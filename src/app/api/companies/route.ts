import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRoute } from '@/utils/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRoute(request.nextUrl.searchParams);

    if (!session.internalUser) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const res = await fetch('https://api.copilot.app/v1/companies?limit=100', {
      headers: { 'X-API-Key': process.env.COPILOT_API_KEY! },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to fetch companies' }, { status: res.status });
    }

    const data = await res.json();

    const companies = (data.data ?? data.items ?? []).map((c: any) => ({
      id: c.id,
      name: c.name ?? 'Unnamed Company',
      iconColor: c.iconColor ?? null,
      ga4PropertyId: c.customFields?.ga4PropertyId ?? c.customFields?.ga4Propertyid ?? null,
      adsCustomerId: c.customFields?.adsCustomerId ?? null,
      metricoolBlogId: c.customFields?.metricoolBlogId ?? null,
    }));

    return NextResponse.json({ companies });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}