'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Phone, PhoneCall, PhoneIncoming, TrendingUp, FileText } from 'lucide-react';
import { getMockWhatConverts } from './mockData';
import type { Theme } from './GA4Dashboard';

const USE_MOCK = false;
const TW_FONT = "var(--font-tomorrow), 'Tomorrow', sans-serif";

interface WCMetrics {
  totalLeads: number; phoneCalls: number; formLeads: number; connected: number;
  callRate: number; connectRate: number;
}
interface WCLead { id: string; type: string; source: string; date: string; duration: string | null; connected: boolean; }
interface WCData {
  companyId: string; companyName: string; hasWhatConverts: boolean; message?: string;
  dateRange: { startDate: string; endDate: string };
  metrics?: WCMetrics;
  timeSeries?: Array<{ date: string; phoneCalls: number; formLeads: number; connected: number; totalLeads: number }>;
  recentLeads?: WCLead[];
}

interface Props {
  dateRange: { start: string; end: string };
  theme: Theme;
  themeStyles: any;
}

const ACCENT: Record<Theme, { ring1: string; ring2: string; ring3: string; track: string; border: string; chartLine1: string; chartLine2: string; chartLine3: string }> = {
  light:    { ring1: '#F26C00', ring2: '#2D2926', ring3: '#8A7A70', track: '#E8E7E5', border: '#D9D8D6', chartLine1: '#F26C00', chartLine2: '#2D2926', chartLine3: '#B05000' },
  dark:     { ring1: '#F26C00', ring2: '#D9D8D6', ring3: '#FF9040', track: '#3D3530', border: '#3D3530', chartLine1: '#F26C00', chartLine2: '#D9D8D6', chartLine3: '#FF9040' },
  asquared: { ring1: '#F26C00', ring2: '#FFB060', ring3: '#D9D8D6', track: '#4A2810', border: '#6B3A18', chartLine1: '#F26C00', chartLine2: '#FFB060', chartLine3: '#D9D8D6' },
};

function ChartTip({ active, payload, label, borderColor, bgCard, subtextColor }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: bgCard, border: `1px solid ${borderColor}`, borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontFamily: TW_FONT }}>
      <p style={{ color: subtextColor, fontSize: 11, marginBottom: 6, fontWeight: 600 }}>{label}</p>
      {payload.map((p: any, i: number) => <p key={i} style={{ color: p.color, fontSize: 12, fontWeight: 700, margin: '2px 0' }}>{p.name}: {p.value?.toLocaleString()}</p>)}
    </div>
  );
}

export function WhatConvertsMetrics({ dateRange, theme, themeStyles: t }: Props) {
  const [data, setData]       = useState<WCData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const searchParams = useSearchParams();
  const colors = ACCENT[theme] ?? ACCENT.light;

  useEffect(() => {
    async function load() {
      setLoading(true); setError(null);
      try {
        if (USE_MOCK) { await new Promise(r => setTimeout(r, 400)); setData(getMockWhatConverts() as any); return; }
        const token = searchParams.get('token');
        const res = await fetch(`/api/whatconverts/metrics?token=${token}&startDate=${dateRange.start}&endDate=${dateRange.end}`);
        if (!res.ok) { const e = await res.json(); throw new Error(e.details || e.error || 'Failed'); }
        setData(await res.json());
      } catch (err: any) { setError(err.message); }
      finally { setLoading(false); }
    }
    load();
  }, [searchParams, dateRange]);

  if (loading) return (
    <div className="flex items-center gap-3 py-6">
      <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${colors.ring1}30`, borderTop: `2px solid ${colors.ring1}`, animation: 'wcSpin 0.7s linear infinite' }} />
      <span className={`${t.subtext} text-sm`}>Loading call tracking…</span>
      <style>{`@keyframes wcSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error || data?.hasWhatConverts === false) {
    const m = (error ?? data?.message ?? '').toLowerCase();
    let title = 'Call tracking unavailable';
    let msg = "We couldn't load your call tracking data. Your account manager can check the WhatConverts connection.";
    if (m.includes('not configured') || m.includes('not connected') || data?.hasWhatConverts === false) {
      title = 'Call tracking not connected';
      msg = "WhatConverts call tracking hasn't been linked to this dashboard yet. Ask your account manager to connect it — they'll need your WhatConverts Account ID and to add the API credentials to the server.";
    } else if (m.includes('access denied') || m.includes('credentials') || m.includes('403')) {
      title = 'Call tracking access pending';
      msg = "The WhatConverts API credentials appear to be incorrect or expired. Your account manager should check the WHATCONVERTS_API_TOKEN and API_SECRET in the server environment variables.";
    }
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Phone size={14} style={{ color: colors.ring1 }} />
          <p className={`${t.subtext} text-xs font-bold uppercase tracking-widest`}>Call Tracking</p>
        </div>
        <div style={{ borderRadius: 16, padding: '28px 32px', border: `1.5px solid ${colors.border}`, background: `${colors.ring1}06`, textAlign: 'center' }}>
          <p className={t.text} style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, fontFamily: TW_FONT }}>{title}</p>
          <p className={t.subtext} style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 460, margin: '0 auto' }}>{msg}</p>
        </div>
      </div>
    );
  }

  if (!data?.metrics) return null;

  const m   = data.metrics;
  const ts  = data.timeSeries ?? [];
  const funnelSteps = [
    { label: 'Total Leads',  value: m.totalLeads,  color: colors.chartLine3, icon: <TrendingUp size={13} />,    pct: 100 },
    { label: 'Phone Calls',  value: m.phoneCalls,  color: colors.chartLine1, icon: <PhoneCall size={13} />,     pct: m.totalLeads > 0 ? Math.round((m.phoneCalls / m.totalLeads) * 100) : 0 },
    { label: 'Form Leads',   value: m.formLeads,   color: colors.chartLine2, icon: <FileText size={13} />,      pct: m.totalLeads > 0 ? Math.round((m.formLeads / m.totalLeads) * 100) : 0 },
    { label: 'Connected',    value: m.connected,   color: colors.ring1,      icon: <PhoneIncoming size={13} />, pct: m.phoneCalls > 0 ? Math.round((m.connected / m.phoneCalls) * 100) : 0 },
  ];

  const tsFormatted = ts.map(d => ({
    ...d,
    date: d.date?.length === 8 ? `${d.date.slice(4, 6)}/${d.date.slice(6, 8)}` : d.date,
  }));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Phone size={14} style={{ color: colors.ring1 }} />
        <p className={`${t.subtext} text-xs font-bold uppercase tracking-widest`}>Call Tracking</p>
        <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 600, color: colors.ring1, background: `${colors.ring1}12`, borderRadius: 5, padding: '2px 8px' }}>via WhatConverts</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className={`${t.subtext} text-xs font-semibold uppercase tracking-widest mb-4`} style={{ fontSize: 9 }}>Lead Funnel</p>
          <div className="space-y-3">
            {funnelSteps.map((step, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <span style={{ color: step.color }}>{step.icon}</span>
                    <span className={`${t.text} text-sm`}>{step.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{ color: step.color, fontSize: 13, fontWeight: 700, fontFamily: TW_FONT }}>{step.value.toLocaleString()}</span>
                    {i > 0 && <span style={{ fontSize: 10, color: colors.ring3, background: `${step.color}15`, borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>{step.pct}%</span>}
                  </div>
                </div>
                <div style={{ height: 5, background: colors.track, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${step.pct}%`, background: step.color, borderRadius: 3, transition: 'width 0.9s ease' }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ background: `${colors.ring1}08`, borderRadius: 10, padding: '12px 14px', marginTop: 16, display: 'flex', gap: 20, border: `1px solid ${colors.ring1}15` }}>
            <div>
              <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: colors.ring3, marginBottom: 2 }}>Connect Rate</p>
              <p style={{ color: colors.ring1, fontWeight: 800, fontSize: 20, lineHeight: 1.2, fontFamily: TW_FONT }}>{m.connectRate}%</p>
              <p className={`${t.subtext} text-xs`}>of phone calls</p>
            </div>
            {m.phoneCalls > 0 && m.formLeads > 0 && (
              <>
                <div style={{ width: 1, background: colors.border }} />
                <div>
                  <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700, color: colors.ring3, marginBottom: 2 }}>Calls vs Forms</p>
                  <p style={{ color: colors.ring2, fontWeight: 800, fontSize: 20, lineHeight: 1.2, fontFamily: TW_FONT }}>{Math.round((m.phoneCalls / m.totalLeads) * 100)}%</p>
                  <p className={`${t.subtext} text-xs`}>phone-based</p>
                </div>
              </>
            )}
          </div>
        </div>

        {tsFormatted.length > 0 && (
          <div>
            <p className={`${t.subtext} text-xs font-semibold uppercase tracking-widest mb-4`} style={{ fontSize: 9 }}>Lead Volume Over Time</p>
            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={tsFormatted} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    {[['wc1', colors.chartLine1], ['wc2', colors.chartLine2], ['wc3', colors.ring1]].map(([id, color]) => (
                      <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                        <stop offset="100%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                  <XAxis dataKey="date" tick={{ fill: colors.ring3, fontSize: 8 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                  <YAxis tick={{ fill: colors.ring3, fontSize: 8 }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip content={props => <ChartTip {...props} borderColor={colors.border} bgCard="#ffffff" subtextColor={colors.ring3} />} />
                  <Area type="monotone" dataKey="phoneCalls" stroke={colors.chartLine1} strokeWidth={1.5} fill="url(#wc1)" name="Phone Calls" dot={false} />
                  <Area type="monotone" dataKey="formLeads"  stroke={colors.chartLine2} strokeWidth={1.5} fill="url(#wc2)" name="Form Leads"  dot={false} />
                  <Area type="monotone" dataKey="connected"  stroke={colors.ring1}      strokeWidth={1.5} fill="url(#wc3)" name="Connected"   dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {data.recentLeads && data.recentLeads.length > 0 && (
        <div>
          <p className={`${t.subtext} text-xs font-semibold uppercase tracking-widest mb-3`} style={{ fontSize: 9 }}>Recent Activity</p>
          <div className="space-y-2">
            {data.recentLeads.map((lead, i) => (
              <div key={i} className={`${t.card} border ${t.border} rounded-xl`} style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: lead.type === 'Phone Call' ? `${colors.ring1}15` : `${colors.ring2}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {lead.type === 'Phone Call' ? <Phone size={13} style={{ color: colors.ring1 }} /> : <FileText size={13} style={{ color: colors.ring2 }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p className={`${t.text} text-sm font-semibold`}>{lead.type}</p>
                  <p className={`${t.subtext} text-xs`}>{lead.source}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {lead.duration && <p style={{ color: colors.ring1, fontSize: 12, fontWeight: 700, fontFamily: TW_FONT }}>{lead.duration}</p>}
                  <p className={`${t.subtext} text-xs`}>{(() => { const d = lead.date; if (d?.length === 8) return `${d.slice(4,6)}/${d.slice(6,8)}`; return d; })()}</p>
                </div>
                {lead.connected !== undefined && (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: lead.connected ? '#22c55e' : colors.ring3, flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}