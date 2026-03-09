import { NextRequest, NextResponse } from 'next/server';
import { GoogleAdsApi } from 'google-ads-api';
import { getSessionFromRoute, getCompanyConfig } from '@/utils/session';

export const dynamic = 'force-dynamic';

function formatDate(dateStr: string): string {
  if (dateStr === 'today') {
    return new Date().toISOString().split('T')[0].replace(/-/g, '');
  } else if (dateStr === 'yesterday') {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0].replace(/-/g, '');
  } else if (dateStr.includes('daysAgo')) {
    const days = parseInt(dateStr.replace('daysAgo', ''));
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0].replace(/-/g, '');
  }
  return dateStr.replace(/-/g, '');
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

    if (!config.adsCustomerId) {
      return NextResponse.json(
        { error: 'Google Ads is not configured for your account. Please contact support.' },
        { status: 403 }
      );
    }

    const missingVars = [
      'GOOGLE_ADS_CLIENT_ID',
      'GOOGLE_ADS_CLIENT_SECRET',
      'GOOGLE_ADS_DEVELOPER_TOKEN',
      'GOOGLE_ADS_REFRESH_TOKEN',
    ].filter(key => !process.env[key]);

    if (missingVars.length > 0) {
      console.error('Missing environment variables:', missingVars);
      return NextResponse.json(
        { error: 'Server configuration error', missing: missingVars },
        { status: 500 }
      );
    }

    const client = new GoogleAdsApi({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET ?? '',
      developer_token: process.env.GOOGLE_ADS_DEVELOPER_TOKEN ?? '',
    });

    const customer = client.Customer({
      customer_id: config.adsCustomerId,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN ?? '',
      login_customer_id: process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID ?? undefined,
    });

    const formattedStartDate = formatDate(startDate);
    const formattedEndDate = formatDate(endDate);

    const [campaigns, overallMetrics] = await Promise.all([
      customer.query(`
        SELECT
          campaign.id,
          campaign.name,
          campaign.status,
          metrics.impressions,
          metrics.clicks,
          metrics.ctr,
          metrics.cost_micros,
          metrics.conversions,
          metrics.conversions_value
        FROM campaign
        WHERE segments.date BETWEEN '${formattedStartDate}' AND '${formattedEndDate}'
          AND campaign.status != 'REMOVED'
        ORDER BY metrics.impressions DESC
        LIMIT 10
      `),
      customer.query(`
        SELECT
          metrics.impressions,
          metrics.clicks,
          metrics.ctr,
          metrics.cost_micros,
          metrics.conversions,
          metrics.conversions_value,
          metrics.average_cpc
        FROM customer
        WHERE segments.date BETWEEN '${formattedStartDate}' AND '${formattedEndDate}'
      `),
    ]);

    const metrics = overallMetrics[0] ? {
      impressions: Number(overallMetrics[0].metrics?.impressions || 0),
      clicks: Number(overallMetrics[0].metrics?.clicks || 0),
      ctr: Number(overallMetrics[0].metrics?.ctr || 0) * 100,
      cost: Number(overallMetrics[0].metrics?.cost_micros || 0) / 1000000,
      conversions: Number(overallMetrics[0].metrics?.conversions || 0),
      conversionsValue: Number(overallMetrics[0].metrics?.conversions_value || 0),
      averageCpc: Number(overallMetrics[0].metrics?.average_cpc || 0) / 1000000,
    } : null;

    const campaignData = campaigns.map((row: any) => ({
      id: row.campaign?.id,
      name: row.campaign?.name || 'Unknown Campaign',
      status: row.campaign?.status,
      impressions: Number(row.metrics?.impressions || 0),
      clicks: Number(row.metrics?.clicks || 0),
      ctr: Number(row.metrics?.ctr || 0) * 100,
      cost: Number(row.metrics?.cost_micros || 0) / 1000000,
      conversions: Number(row.metrics?.conversions || 0),
      conversionsValue: Number(row.metrics?.conversions_value || 0),
    }));

    return NextResponse.json({
      companyId: config.companyId,
      companyName: config.name,
      customerId: config.adsCustomerId,
      dateRange: { startDate, endDate },
      metrics,
      campaigns: campaignData,
    });

  } catch (error: any) {
    console.error('Google Ads API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Google Ads data', details: error.message },
      { status: 500 }
    );
  }
}