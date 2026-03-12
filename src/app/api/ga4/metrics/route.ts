import { NextRequest, NextResponse } from 'next/server';
import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { getSessionFromRoute, getCompanyConfig } from '@/utils/session';

export const dynamic = 'force-dynamic';

function getPreviousPeriodDates(startDate: string, endDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const resolveDate = (s: string): Date => {
    const d = new Date(today);
    if (s === 'today') return d;
    if (s === 'yesterday') { d.setDate(d.getDate() - 1); return d; }
    if (s.includes('daysAgo')) {
      d.setDate(d.getDate() - parseInt(s.replace('daysAgo', '')));
      return d;
    }
    return new Date(s);
  };

  const toStr = (d: Date) => d.toISOString().split('T')[0];

  const end = resolveDate(endDate);
  const start = resolveDate(startDate);
  const diffMs = end.getTime() - start.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;

  const prevEnd = new Date(start);
  prevEnd.setDate(prevEnd.getDate() - 1);
  const prevStart = new Date(prevEnd);
  prevStart.setDate(prevStart.getDate() - diffDays + 1);

  return { prevStart: toStr(prevStart), prevEnd: toStr(prevEnd) };
}

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

    const analyticsDataClient = new BetaAnalyticsDataClient({
      credentials: {
        client_email: process.env.GA4_CLIENT_EMAIL!,
        private_key: process.env.GA4_PRIVATE_KEY!.replace(/\\n/g, '\n'),
      },
    });

    const property = `properties/${config.ga4PropertyId}`;
    const { prevStart, prevEnd } = getPreviousPeriodDates(startDate, endDate);

    const CORE_METRICS = [
      { name: 'activeUsers' },
      { name: 'sessions' },
      { name: 'screenPageViews' },
      { name: 'averageSessionDuration' },
      { name: 'bounceRate' },
      { name: 'newUsers' },
      { name: 'engagementRate' },
    ];

    const [
      metricsResponse,
      previousMetricsResponse,
      timeSeriesResponse,
      pagesResponse,
      sourcesResponse,
      devicesResponse,
      countriesResponse,
      regionsResponse,
      callEventsResponse,
    ] = await Promise.all([
      analyticsDataClient.runReport({
        property,
        dateRanges: [{ startDate, endDate }],
        metrics: CORE_METRICS,
      }),
      analyticsDataClient.runReport({
        property,
        dateRanges: [{ startDate: prevStart, endDate: prevEnd }],
        metrics: CORE_METRICS,
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
        limit: 50,
      }),
      analyticsDataClient.runReport({
        property,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'country' }, { name: 'region' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 100,
      }),
      analyticsDataClient.runReport({
        property,
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: 'eventName' }],
        metrics: [{ name: 'eventCount' }],
        dimensionFilter: {
          filter: {
            fieldName: 'eventName',
            inListFilter: {
              values: ['phone_call', 'call_click', 'click_to_call', 'outbound_call', 'call'],
            },
          },
        },
      }).catch(() => null),
    ]);

    const parseMetrics = (response: any) => {
      const row = response[0]?.rows?.[0];
      if (!row) return null;
      return {
        activeUsers: parseInt(row.metricValues?.[0]?.value || '0'),
        sessions: parseInt(row.metricValues?.[1]?.value || '0'),
        pageViews: parseInt(row.metricValues?.[2]?.value || '0'),
        avgSessionDuration: parseFloat(row.metricValues?.[3]?.value || '0'),
        bounceRate: (parseFloat(row.metricValues?.[4]?.value || '0') * 100).toFixed(2),
        newUsers: parseInt(row.metricValues?.[5]?.value || '0'),
        engagementRate: (parseFloat(row.metricValues?.[6]?.value || '0') * 100).toFixed(2),
      };
    };

    const mainMetrics = parseMetrics(metricsResponse);
    const previousMetrics = parseMetrics(previousMetricsResponse);

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

    const regions = regionsResponse[0].rows?.map(row => ({
      country: row.dimensionValues?.[0]?.value || 'Unknown',
      region: row.dimensionValues?.[1]?.value || 'Unknown',
      users: parseInt(row.metricValues?.[0]?.value || '0'),
    })).filter(r => r.region && r.region !== '(not set)') || [];

    const callEvents = callEventsResponse
      ? (callEventsResponse[0]?.rows?.map(row => ({
          event: row.dimensionValues?.[0]?.value || '',
          count: parseInt(row.metricValues?.[0]?.value || '0'),
        })) || [])
      : [];

    return NextResponse.json({
      companyId: config.companyId,
      companyName: config.name,
      dateRange: { startDate, endDate },
      previousDateRange: { startDate: prevStart, endDate: prevEnd },
      metrics: mainMetrics,
      previousMetrics,
      timeSeries,
      topPages,
      trafficSources,
      devices,
      countries,
      regions,
      callEvents,
    });

  } catch (error: any) {
    console.error('GA4 API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data', details: error.message },
      { status: 500 }
    );
  }
}