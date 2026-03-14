import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRoute } from '@/utils/session';

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRoute(req.nextUrl.searchParams);
    const fields = (session.company as any)?.customFields ?? {};
    const raw = fields.dashboardPreferences ?? fields.dashboardpreferences ?? null;

    if (!raw) return NextResponse.json({ preferences: null });

    try {
      return NextResponse.json({ preferences: JSON.parse(raw) });
    } catch {
      return NextResponse.json({ preferences: null });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRoute(req.nextUrl.searchParams);
    const company = session.company as any;
    if (!company?.id) {
      return NextResponse.json({ error: 'No company in session' }, { status: 401 });
    }

    const body = await req.json();

    const res = await fetch(`https://api.copilot.app/v1/companies/${company.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.COPILOT_API_KEY!,
      },
      body: JSON.stringify({
        customFields: {
          ...((company.customFields as object) ?? {}),
          dashboardPreferences: JSON.stringify(body),
        },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.log('Assembly PATCH failed:', res.status, text);
      return NextResponse.json({ error: `Assembly API error: ${text}` }, { status: res.status });
    }

    console.log('Assembly PATCH success');
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
