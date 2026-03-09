import { NextRequest, NextResponse } from 'next/server';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { getSessionFromRoute, getCompanyConfig } from '@/utils/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const startDate = request.nextUrl.searchParams.get('startDate') || '30daysAgo';
    const endDate = request.nextUrl.searchParams.get('endDate') || 'today';

    const session = await getSessionFromRoute(request.nextUrl.searchParams);
    const config = getCompanyConfig(session);

    if (!config) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!config.ga4PropertyId) {
      return NextResponse.json(
        { error: 'GA4 is not configured for your account. Please contact support.' },
        { status: 403 }
      );
    }

    const serviceAccount = JSON.parse(process.env.GA4_SERVICE_ACCOUNT!);
    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: serviceAccount.client_email,
        private_key: serviceAccount.private_key,
      },
    });

    const property = `properties/${config.ga4PropertyId}`;

    const [
      metricsResponse,
      timeSeriesResponse,
      pagesResponse,
      sourcesResponse,
      devicesResponse,
      countriesResponse,
    ] = await Promise.all([
      analyticsDataClient.runReport({
        property,
        dateRanges: [{ startDate, endDate }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
          { name: 'averageSessionDuration' },
          { name: 'bounceRate' },
          { name: 'newUsers' },
          { name: 'engagementRate' },
        ],
      }),
      analyticsDataClient.runReport({
        property,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'date' }],
        metrics: [
          { name: 'activeUsers' },
          { name: 'sessions' },
          { name: 'screenPageViews' },
        ],
        orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
      }),
      analyticsDataClient.runReport({
        property,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'pageTitle' }, { name: 'pagePath' }],
        metrics: [{ name: 'screenPageViews' }],
        orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
        limit: 10,
      }),
      analyticsDataClient.runReport({
        property,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'sessionDefaultChannelGroup' }],
        metrics: [{ name: 'sessions' }],
        orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      }),
      analyticsDataClient.runReport({
        property,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'deviceCategory' }],
        metrics: [{ name: 'activeUsers' }],
      }),
      analyticsDataClient.runReport({
        property,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'country' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 10,
      }),
    ]);

    const mainRow = metricsResponse[0].rows?.[0];
    const mainMetrics = mainRow ? {
      activeUsers: parseInt(mainRow.metricValues?.[0]?.value || '0'),
      sessions: parseInt(mainRow.metricValues?.[1]?.value || '0'),
      pageViews: parseInt(mainRow.metricValues?.[2]?.value || '0'),
      avgSessionDuration: parseFloat(mainRow.metricValues?.[3]?.value || '0'),
      bounceRate: (parseFloat(mainRow.metricValues?.[4]?.value || '0') * 100).toFixed(2),
      newUsers: parseInt(mainRow.metricValues?.[5]?.value || '0'),
      engagementRate: (parseFloat(mainRow.metricValues?.[6]?.value || '0') * 100).toFixed(2),
    } : null;

    const timeSeries = timeSeriesResponse[0].rows?.map(row => ({
      date: row.dimensionValues?.[0]?.value || '',
      activeUsers: parseInt(row.metricValues?.[0]?.value || '0'),
      sessions: parseInt(row.metricValues?.[1]?.value || '0'),
      pageViews: parseInt(row.metricValues?.[2]?.value || '0'),
    })) || [];

    const topPages = pagesResponse[0].rows?.map(row => ({
      title: row.dimensionValues?.[0]?.value || 'Unknown',
      path: row.dimensionValues?.[1]?.value || '/',
      views: parseInt(row.metricValues?.[0]?.value || '0'),
    })) || [];

    const trafficSources = sourcesResponse[0].rows?.map(row => ({
      source: row.dimensionValues?.[0]?.value || 'Unknown',
      sessions: parseInt(row.metricValues?.[0]?.value || '0'),
    })) || [];

    const devices = devicesResponse[0].rows?.map(row => ({
      device: row.dimensionValues?.[0]?.value || 'Unknown',
      users: parseInt(row.metricValues?.[0]?.value || '0'),
    })) || [];

    const countries = countriesResponse[0].rows?.map(row => ({
      country: row.dimensionValues?.[0]?.value || 'Unknown',
      users: parseInt(row.metricValues?.[0]?.value || '0'),
    })) || [];

    return NextResponse.json({
      companyId: config.companyId,
      companyName: config.name,
      dateRange: { startDate, endDate },
      metrics: mainMetrics,
      timeSeries,
      topPages,
      trafficSources,
      devices,
      countries,
    });

  } catch (error: any) {
    console.error('GA4 API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data', details: error.message },
      { status: 500 }
    );
  }
}