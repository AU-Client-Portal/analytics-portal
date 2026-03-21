import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRoute, getCompanyConfig } from '@/utils/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const startDate = request.nextUrl.searchParams.get('startDate') || '30daysAgo';
    const endDate   = request.nextUrl.searchParams.get('endDate')   || 'today';

    const session = await getSessionFromRoute(request.nextUrl.searchParams);
    const config  = getCompanyConfig(session);

    if (!config) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!config.gbpLocationId) {
      return NextResponse.json({ companyId: config.companyId, companyName: config.name, hasGBP: false });
    }

    function resolveDate(d: string): string {
      const today = new Date();
      if (d === 'today')     return today.toISOString().split('T')[0];
      if (d === 'yesterday') { const y = new Date(today); y.setDate(y.getDate() - 1); return y.toISOString().split('T')[0]; }
      const m = d.match(/^(\d+)daysAgo$/);
      if (m) { const p = new Date(today); p.setDate(p.getDate() - parseInt(m[1])); return p.toISOString().split('T')[0]; }
      return d;
    }

    const start = resolveDate(startDate);
    const end   = resolveDate(endDate);

    const serviceAccount = JSON.parse(process.env.GA4_SERVICE_ACCOUNT!);
    const { GoogleAuth } = await import('google-auth-library');
    const auth = new GoogleAuth({
      credentials: { client_email: serviceAccount.client_email, private_key: serviceAccount.private_key },
      scopes: ['https://www.googleapis.com/auth/business.manage'],
    });
    const client        = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    const accessToken   = tokenResponse.token;

    const locationName = `locations/${config.gbpLocationId}`;
    const [sy, sm, sd] = start.split('-');
    const [ey, em, ed] = end.split('-');

    const params = new URLSearchParams({
      'dailyRange.startDate.year':  sy, 'dailyRange.startDate.month': sm, 'dailyRange.startDate.day':   sd,
      'dailyRange.endDate.year':    ey, 'dailyRange.endDate.month':   em, 'dailyRange.endDate.day':     ed,
    });
    // Append repeated param
    const metrics = [
      'BUSINESS_IMPRESSIONS_DESKTOP_MAPS', 'BUSINESS_IMPRESSIONS_DESKTOP_SEARCH',
      'BUSINESS_IMPRESSIONS_MOBILE_MAPS',  'BUSINESS_IMPRESSIONS_MOBILE_SEARCH',
      'BUSINESS_DIRECTION_REQUESTS', 'CALL_CLICKS', 'WEBSITE_CLICKS',
    ];
    metrics.forEach(m => params.append('dailyMetric', m));

    const [metricsRes, locationRes] = await Promise.all([
      fetch(`https://businessprofileperformance.googleapis.com/v1/${locationName}:fetchMultiDailyMetricsTimeSeries?${params}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }),
      fetch(`https://mybusiness.googleapis.com/v4/${locationName}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }),
    ]);

    if (!metricsRes.ok) throw new Error(`GBP metrics API: ${await metricsRes.text()}`);

    const metricsData  = await metricsRes.json();
    const locationData = locationRes.ok ? await locationRes.json() : null;

    function sumMetric(name: string): number {
      const series = metricsData.multiDailyMetricTimeSeries?.find((s: any) => s.dailyMetric === name);
      return series?.timeSeries?.datedValues?.reduce((acc: number, dv: any) => acc + parseInt(dv.value || '0'), 0) ?? 0;
    }

    // Build daily time series (aggregate all metric types per date)
    const dateMap: Record<string, { impressions: number; clicks: number; calls: number }> = {};
    metricsData.multiDailyMetricTimeSeries?.forEach((s: any) => {
      s.timeSeries?.datedValues?.forEach((dv: any) => {
        const key = `${dv.date.year}-${String(dv.date.month).padStart(2,'0')}-${String(dv.date.day).padStart(2,'0')}`;
        if (!dateMap[key]) dateMap[key] = { impressions: 0, clicks: 0, calls: 0 };
        const val = parseInt(dv.value || '0');
        if (['BUSINESS_IMPRESSIONS_DESKTOP_MAPS','BUSINESS_IMPRESSIONS_DESKTOP_SEARCH','BUSINESS_IMPRESSIONS_MOBILE_MAPS','BUSINESS_IMPRESSIONS_MOBILE_SEARCH'].includes(s.dailyMetric)) dateMap[key].impressions += val;
        if (s.dailyMetric === 'WEBSITE_CLICKS')         dateMap[key].clicks += val;
        if (s.dailyMetric === 'CALL_CLICKS')            dateMap[key].calls  += val;
      });
    });
    const timeSeries = Object.entries(dateMap).sort(([a],[b]) => a.localeCompare(b)).map(([date, vals]) => ({ date: date.replace(/-/g,''), ...vals }));

    const searchImpressions   = sumMetric('BUSINESS_IMPRESSIONS_DESKTOP_SEARCH') + sumMetric('BUSINESS_IMPRESSIONS_MOBILE_SEARCH');
    const mapsImpressions     = sumMetric('BUSINESS_IMPRESSIONS_DESKTOP_MAPS')   + sumMetric('BUSINESS_IMPRESSIONS_MOBILE_MAPS');
    const businessImpressions = searchImpressions + mapsImpressions;

    return NextResponse.json({
      companyId: config.companyId, companyName: config.name,
      locationId: config.gbpLocationId,
      locationName: locationData?.title ?? config.name,
      hasGBP: true,
      dateRange: { startDate: start, endDate: end },
      timeSeries,
      metrics: {
        businessImpressions, searchImpressions, mapsImpressions,
        websiteClicks:      sumMetric('WEBSITE_CLICKS'),
        callClicks:         sumMetric('CALL_CLICKS'),
        directionRequests:  sumMetric('BUSINESS_DIRECTION_REQUESTS'),
        averageRating:      parseFloat(locationData?.averageRating  ?? '0'),
        totalReviews:       parseInt(locationData?.totalReviewCount ?? '0'),
      },
    });

  } catch (error: any) {
    console.error('GBP API Error:', error);
    return NextResponse.json({ error: 'Failed to fetch GBP data', details: error.message }, { status: 500 });
  }
}