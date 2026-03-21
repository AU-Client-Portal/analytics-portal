import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRoute, getCompanyConfig } from '@/utils/session';

export async function GET(req: NextRequest) {
  try {
    const params = req.nextUrl.searchParams;
    const startDate = params.get('startDate') ?? '30daysAgo';
    const endDate   = params.get('endDate')   ?? 'today';

    const session = await getSessionFromRoute(params);
    const config  = getCompanyConfig(session);

    if (!config) {
      return NextResponse.json({ error: 'Access required. Please use your personalised portal link.' }, { status: 401 });
    }

    if (!config.whatConvertsAccountId) {
      return NextResponse.json({ hasWhatConverts: false, message: 'WhatConverts is not configured for your account. Ask your account manager to connect your WhatConverts account.' });
    }

    const apiToken = process.env.WHATCONVERTS_API_TOKEN;
    const apiSecret = process.env.WHATCONVERTS_API_SECRET;

    if (!apiToken || !apiSecret) {
      return NextResponse.json({ error: 'WhatConverts credentials are not configured on the server. Your account manager should check the WHATCONVERTS_API_TOKEN and WHATCONVERTS_API_SECRET environment variables.' }, { status: 500 });
    }

    function resolveToISO(s: string): string {
      const d = new Date();
      if (s === 'today') return d.toISOString().split('T')[0];
      if (s === 'yesterday') { d.setDate(d.getDate()-1); return d.toISOString().split('T')[0]; }
      const m = s.match(/^(\d+)daysAgo$/);
      if (m) { d.setDate(d.getDate()-parseInt(m[1])); return d.toISOString().split('T')[0]; }
      return s;
    }

    const start = resolveToISO(startDate);
    const end   = resolveToISO(endDate);

    const base = `https://api.whatconverts.com/v1`;
    const auth = Buffer.from(`${apiToken}:${apiSecret}`).toString('base64');
    const headers = { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' };

    const leadsRes = await fetch(`${base}/leads?account_id=${config.whatConvertsAccountId}&start_date=${start}&end_date=${end}&per_page=500`, { headers });

    if (!leadsRes.ok) {
      const text = await leadsRes.text();
      if (leadsRes.status === 401 || leadsRes.status === 403) {
        return NextResponse.json({ error: `WhatConverts access denied. Your account manager should verify the API credentials and account ID are correct.` }, { status: 403 });
      }
      return NextResponse.json({ error: `WhatConverts returned an error (${leadsRes.status}). Your account manager can check the API connection in your WhatConverts account settings.` }, { status: 502 });
    }

    const leadsData = await leadsRes.json();
    const leads = leadsData.leads ?? [];

    const phoneCalls  = leads.filter((l: any) => l.lead_type === 'phone_call');
    const formLeads   = leads.filter((l: any) => l.lead_type !== 'phone_call');
    const connected   = phoneCalls.filter((l: any) => l.duration_seconds > 0);

    const tsMap: Record<string, { phoneCalls:number; formLeads:number; connected:number; totalLeads:number }> = {};
    for (const lead of leads) {
      const day = (lead.date_created ?? '').slice(0, 10).replace(/-/g, '');
      if (!day) continue;
      if (!tsMap[day]) tsMap[day] = { phoneCalls:0, formLeads:0, connected:0, totalLeads:0 };
      tsMap[day].totalLeads++;
      if (lead.lead_type === 'phone_call') {
        tsMap[day].phoneCalls++;
        if (lead.duration_seconds > 0) tsMap[day].connected++;
      } else {
        tsMap[day].formLeads++;
      }
    }

    const timeSeries = Object.entries(tsMap)
      .sort(([a],[b]) => a.localeCompare(b))
      .map(([date, vals]) => ({ date, ...vals }));

    const totalSessions = 1;

    return NextResponse.json({
      companyId:       config.companyId,
      companyName:     config.name,
      hasWhatConverts: true,
      dateRange:       { startDate: start, endDate: end },
      metrics: {
        totalLeads:   leads.length,
        phoneCalls:   phoneCalls.length,
        formLeads:    formLeads.length,
        connected:    connected.length,
        callRate:     0,
        connectRate:  phoneCalls.length > 0 ? +((connected.length / phoneCalls.length) * 100).toFixed(1) : 0,
      },
      timeSeries,
      recentLeads: leads.slice(0, 5).map((l: any) => ({
        id:        l.lead_id,
        type:      l.lead_type === 'phone_call' ? 'Phone Call' : 'Form Submit',
        source:    l.lead_source ?? 'Unknown',
        date:      (l.date_created ?? '').slice(0, 10).replace(/-/g, ''),
        duration:  l.duration_seconds > 0 ? `${Math.floor(l.duration_seconds/60)}:${String(l.duration_seconds%60).padStart(2,'0')}` : null,
        connected: l.duration_seconds > 0,
      })),
    });
  } catch (err: any) {
    console.error('WhatConverts API error:', err);
    return NextResponse.json({ error: `Failed to load call tracking data. Your account manager should check the WhatConverts connection. (${err.message})` }, { status: 500 });
  }
}