import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRoute, getCompanyConfig } from '@/utils/session';

export const dynamic = 'force-dynamic';

function formatDateForMetricool(dateStr: string): string {
  if (dateStr === 'today') {
    return new Date().toISOString().split('T')[0];
  } else if (dateStr === 'yesterday') {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  } else if (dateStr.includes('daysAgo')) {
    const days = parseInt(dateStr.replace('daysAgo', ''));
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  }
  return dateStr;
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

    if (!config.metricoolBlogId) {
      return NextResponse.json(
        { error: 'Metricool is not configured for your account. Please contact support.' },
        { status: 403 }
      );
    }

    const metricoolUserId = process.env.METRICOOL_USER_ID;
    const metricoolToken = process.env.METRICOOL_API_TOKEN;

    if (!metricoolUserId || !metricoolToken) {
      return NextResponse.json(
        { error: 'Metricool credentials not configured' },
        { status: 500 }
      );
    }

    const baseUrl = 'https://app.metricool.com/api';

    const callMetricoolApi = async (endpoint: string, additionalParams: Record<string, string> = {}) => {
      const params = new URLSearchParams({
        userId: metricoolUserId,
        blogId: config.metricoolBlogId!,
        ...additionalParams,
      });

      const response = await fetch(`${baseUrl}${endpoint}?${params.toString()}`, {
        method: 'GET',
        headers: {
          'X-Mc-Auth': metricoolToken,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Metricool API error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    };

    const [profileData, statsData, postsData] = await Promise.all([
      callMetricoolApi('/admin/simpleProfiles').catch(e => {
        console.error('Profile fetch error:', e);
        return null;
      }),
      callMetricoolApi('/statistics/summary', {
        from: formatDateForMetricool(startDate),
        to: formatDateForMetricool(endDate),
      }).catch(e => {
        console.error('Stats fetch error:', e);
        return null;
      }),
      callMetricoolApi('/posts/list', { limit: '10' }).catch(e => {
        console.error('Posts fetch error:', e);
        return null;
      }),
    ]);

    return NextResponse.json({
      companyId: config.companyId,
      companyName: config.name,
      blogId: config.metricoolBlogId,
      dateRange: { startDate, endDate },
      profile: profileData,
      stats: statsData,
      posts: postsData,
    });

  } catch (error: any) {
    console.error('Metricool API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Metricool data', details: error.message },
      { status: 500 }
    );
  }
}