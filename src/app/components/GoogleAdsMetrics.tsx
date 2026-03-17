'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { MousePointerClick, Eye, TrendingUp, DollarSign, Target, Award, Percent, Calculator } from 'lucide-react';
import { MOCK_GOOGLE_ADS } from './mockData';
import type { Theme } from './GA4Dashboard';

const USE_MOCK = true;

interface AdsTimeSeries { date: string; impressions: number; clicks: number; cost: number; conversions: number; convValue: number; }
interface GoogleAdsData {
  companyId: string; companyName: string; customerId: string;
  hasGoogleAds?: boolean; message?: string;
  dateRange: { startDate: string; endDate: string };
  timeSeries?: AdsTimeSeries[];
  metrics?: { impressions: number; clicks: number; ctr: number; cost: number; conversions: number; conversionsValue: number; averageCpc: number; };
  campaigns?: Array<{ id: string; name: string; status: string; impressions: number; clicks: number; ctr: number; cost: number; conversions: number; conversionsValue: number; }>;
}

interface Props {
  dateRange: { start: string; end: string };
  theme: Theme;
  themeStyles: any;
}

function resolveDate(s: string): Date {
  const d = new Date();
  if (s === 'today') return d;
  if (s === 'yesterday') { d.setDate(d.getDate() - 1); return d; }
  const m = s.match(/^(\d+)daysAgo$/);
  if (m) { d.setDate(d.getDate() - parseInt(m[1])); return d; }
  return new Date(s);
}

function filterSeries<T extends { date: string }>(ts: T[], start: string, end: string): T[] {
  if (!start || !end || !ts.length) return ts;
  const s = resolveDate(start); s.setHours(0, 0, 0, 0);
  const e = resolveDate(end);   e.setHours(23, 59, 59, 999);
  return ts.filter(row => {
    const r = row.date;
    const parsed = r.length === 8
      ? new Date(+r.slice(0, 4), +r.slice(4, 6) - 1, +r.slice(6, 8))
      : new Date(r);
    return parsed >= s && parsed <= e;
  });
}

function fmtCurrency(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000)    return `$${Math.round(n / 1000)}K`;
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000)    return `${Math.round(n / 1000)}K`;
  return n.toLocaleString();
}

function classifyAdsError(message: string): 'not_configured' | 'no_permission' | 'other' {
  const m = message?.toLowerCase() ?? '';
  if (m.includes('google ads is not configured')) return 'not_configured';
  if (m.includes("doesn't have permission") || m.includes('login-customer-id') || m.includes('permission')) return 'no_permission';
  return 'other';
}

function AdsErrorState({ error, colors, t }: { error: string; colors: any; t: any }) {
  const type = classifyAdsError(error);
  const s = { borderRadius: 16, padding: '28px 32px', border: `1.5px solid ${colors.border}`, background: `${colors.ring1}06`, textAlign: 'center' as const };
  if (type === 'not_configured') return <div style={s}><p className={t.text} style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Google Ads not connected</p><p className={t.subtext} style={{ fontSize: 13, lineHeight: 1.6 }}>Your Google Ads account hasn&apos;t been linked yet. Contact your account manager to get this set up.</p></div>;
  if (type === 'no_permission')  return <div style={s}><p className={t.text} style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Google Ads access pending</p><p className={t.subtext} style={{ fontSize: 13, lineHeight: 1.6 }}>Your account manager needs access to your Google Ads before data can appear here.</p></div>;
  return <div style={s}><p className={t.text} style={{ fontWeight: 700, fontSize: 15, marginBottom: 8 }}>Google Ads unavailable</p><p className={t.subtext} style={{ fontSize: 13, lineHeight: 1.6 }}>We couldn&apos;t load your Google Ads data. Please contact your account manager if this continues.</p></div>;
}

function AdMetricCard({ title, value, sub, icon, index, accentColor, t, sparkData }: {
  title: string; value: string; sub?: string; icon: React.ReactNode;
  index: number; accentColor: string; t: any; sparkData?: number[];
}) {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  useEffect(() => { const timer = setTimeout(() => setVisible(true), index * 80); return () => clearTimeout(timer); }, [index]);
  const uid = `adsc-${title.replace(/\s+/g, '').toLowerCase()}-${index}`;
  return (
    <div
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.97)', transition: 'opacity 0.45s ease, transform 0.45s cubic-bezier(0.34,1.56,0.64,1)', transitionDelay: `${index * 60}ms`, boxShadow: hovered ? `0 8px 32px ${accentColor}25` : '0 1px 4px rgba(0,0,0,0.06)', borderColor: hovered ? accentColor : undefined, overflow: 'hidden' }}
      className={`${t.card} border ${t.border} rounded-2xl cursor-default group`}
    >
      <div style={{ padding: '12px 14px 8px' }}>
        <div className="flex items-start justify-between mb-2">
          <span className={`${t.subtext} font-semibold uppercase tracking-widest leading-tight`} style={{ fontSize: 10 }}>{title}</span>
          <span style={{ color: accentColor, opacity: hovered ? 1 : 0.45, transition: 'opacity 0.2s, transform 0.3s', transform: hovered ? 'scale(1.2) rotate(-6deg)' : 'scale(1)', flexShrink: 0, marginLeft: 4 }}>{icon}</span>
        </div>
        <p className={`${t.text} font-bold tracking-tight`} style={{ fontSize: 'clamp(0.9rem, 4vw, 1.5rem)', wordBreak: 'break-all', color: hovered ? accentColor : undefined, transition: 'color 0.2s', lineHeight: 1.15 }}>{value}</p>
        {sub && <p className={`${t.subtext} mt-1`} style={{ fontSize: 10 }}>{sub}</p>}
      </div>
      {sparkData && sparkData.length > 1 && (
        <div style={{ height: 36 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData.map(v => ({ v }))} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={accentColor} stopOpacity={0.28} />
                  <stop offset="100%" stopColor={accentColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={accentColor} strokeWidth={1.5} fill={`url(#${uid})`} dot={false} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function CampaignRow({ campaign, maxCost, maxConv, index, colors, t }: { campaign: any; maxCost: number; maxConv: number; index: number; colors: any; t: any }) {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const roas = campaign.cost > 0 ? (campaign.conversionsValue / campaign.cost).toFixed(2) : '—';
  useEffect(() => { const timer = setTimeout(() => setVisible(true), 300 + index * 100); return () => clearTimeout(timer); }, [index]);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(-20px)', transition: 'opacity 0.4s ease, transform 0.4s ease, background 0.2s', transitionDelay: `${index * 80}ms`, background: hovered ? `${colors.border}40` : 'transparent', borderRadius: 12, padding: '14px 16px' }}>
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: campaign.status === 'PAUSED' ? colors.ring3 : colors.ring1, flexShrink: 0 }} />
          <span className={`${t.text} text-sm font-semibold truncate`}>{campaign.name}</span>
          {campaign.status === 'PAUSED' && <span style={{ fontSize: 9, fontWeight: 700, color: colors.ring3, background: `${colors.ring3}15`, borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>PAUSED</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span style={{ color: colors.ring2, fontSize: 12, fontWeight: 700 }}>{fmtCurrency(campaign.cost)}</span>
          <span style={{ color: colors.ring1, fontSize: 12, fontWeight: 700 }}>{campaign.conversions} conv.</span>
          <span className={`${t.subtext}`} style={{ fontSize: 11 }}>ROAS {roas}×</span>
        </div>
      </div>
      <div className="space-y-1.5">
        <div style={{ height: 5, background: colors.track, borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', width: visible ? `${maxCost > 0 ? (campaign.cost / maxCost) * 100 : 0}%` : '0%', background: colors.ring2, borderRadius: 3, transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)', transitionDelay: `${400 + index * 80}ms` }} /></div>
        <div style={{ height: 5, background: colors.track, borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', width: visible ? `${maxConv > 0 ? (campaign.conversions / maxConv) * 100 : 0}%` : '0%', background: colors.ring1, borderRadius: 3, transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)', transitionDelay: `${500 + index * 80}ms` }} /></div>
      </div>
      <div className="flex gap-4 mt-1.5">
        <span className={`${t.subtext}`} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: 2, background: colors.ring2, display: 'inline-block' }} /> Cost</span>
        <span className={`${t.subtext}`} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 6, height: 6, borderRadius: 2, background: colors.ring1, display: 'inline-block' }} /> Conversions</span>
      </div>
    </div>
  );
}

const ACCENT: Record<Theme, { ring1: string; ring2: string; ring3: string; ring4: string; track: string; border: string }> = {
  light:  { ring1: '#003F27', ring2: '#f59e0b', ring3: '#ef4444', ring4: '#3b82f6', track: '#e8ecf0', border: '#dde2e8' },
  dark:   { ring1: '#4ade80', ring2: '#fbbf24', ring3: '#f87171', ring4: '#60a5fa', track: '#2c3040', border: '#2c3040' },
  forest: { ring1: '#003F27', ring2: '#b5832a', ring3: '#9b4a20', ring4: '#5a8fa8', track: '#e8d5b7', border: '#d4b896' },
};

export function GoogleAdsMetrics({ dateRange, theme, themeStyles: t }: Props) {
  const [data, setData]       = useState<GoogleAdsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const searchParams = useSearchParams();
  const colors = ACCENT[theme] ?? ACCENT.forest;

  useEffect(() => {
    async function fetch_() {
      setLoading(true); setError(null);
      try {
        if (USE_MOCK) { await new Promise(r => setTimeout(r, 500)); setData(MOCK_GOOGLE_ADS as any); return; }
        const token = searchParams.get('token');
        const res = await fetch(`/api/google-ads/metrics?token=${token}&startDate=${dateRange.start}&endDate=${dateRange.end}`);
        if (!res.ok) { const e = await res.json(); throw new Error(e.details || e.error || 'Failed'); }
        setData(await res.json());
      } catch (err: any) { setError(err.message); }
      finally { setLoading(false); }
    }
    fetch_();
  }, [searchParams, dateRange]);

  if (loading) return (
    <div className="flex items-center gap-3 py-10">
      <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${colors.ring1}30`, borderTop: `2px solid ${colors.ring1}`, animation: 'spin 0.7s linear infinite' }} />
      <span className={`${t.subtext} text-sm`}>Loading Google Ads…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error || data?.hasGoogleAds === false) return (
    <div className="space-y-4">
      <h2 className={`${t.text} text-xl font-bold tracking-tight`}>Google Ads Performance</h2>
      <AdsErrorState error={error ?? 'Google Ads is not configured for your account.'} colors={colors} t={t} />
    </div>
  );

  if (!data?.metrics) return <p className={`${t.subtext} text-sm py-4`}>No Google Ads data available.</p>;

  const m         = data.metrics;
  const campaigns = data.campaigns || [];

  const filteredTs = filterSeries(data.timeSeries ?? [], dateRange.start, dateRange.end);
  const dm = filteredTs.length > 0 ? {
    impressions:       filteredTs.reduce((s, d) => s + d.impressions, 0),
    clicks:            filteredTs.reduce((s, d) => s + d.clicks, 0),
    cost:              +filteredTs.reduce((s, d) => s + d.cost, 0).toFixed(2),
    conversions:       +filteredTs.reduce((s, d) => s + d.conversions, 0).toFixed(0),
    conversionsValue:  +filteredTs.reduce((s, d) => s + d.convValue, 0).toFixed(2),
    ctr:               filteredTs.length > 0 ? +((filteredTs.reduce((s, d) => s + d.clicks, 0) / Math.max(filteredTs.reduce((s, d) => s + d.impressions, 0), 1)) * 100).toFixed(2) : m.ctr,
    averageCpc:        filteredTs.length > 0 && filteredTs.reduce((s, d) => s + d.clicks, 0) > 0 ? +(filteredTs.reduce((s, d) => s + d.cost, 0) / filteredTs.reduce((s, d) => s + d.clicks, 0)).toFixed(2) : m.averageCpc,
  } : m;

  const maxCost    = Math.max(...campaigns.map(c => c.cost), 1);
  const maxConv    = Math.max(...campaigns.map(c => c.conversions), 1);
  const costPerConv = dm.conversions > 0 ? dm.cost / +dm.conversions : 0;
  const roas        = dm.cost > 0 ? dm.conversionsValue / dm.cost : 0;
  const accents     = [colors.ring1, colors.ring2, colors.ring3, colors.ring4, colors.ring1, colors.ring2, colors.ring3, colors.ring4];

  const sparks = {
    impressions:  filteredTs.map(d => d.impressions),
    clicks:       filteredTs.map(d => d.clicks),
    ctr:          filteredTs.map(d => d.clicks > 0 ? (d.clicks / d.impressions) * 100 : 0),
    cost:         filteredTs.map(d => d.cost),
    conversions:  filteredTs.map(d => d.conversions),
    convValue:    filteredTs.map(d => d.convValue),
    cpc:          filteredTs.map(d => d.clicks > 0 ? d.cost / d.clicks : 0),
    costPerConv:  filteredTs.map(d => d.conversions > 0 ? d.cost / d.conversions : 0),
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className={`${t.text} text-xl font-bold tracking-tight`}>Google Ads Performance</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <AdMetricCard title="Impressions"  value={fmtNum(dm.impressions)}                                  icon={<Eye size={15}/>}               index={0} accentColor={accents[0]} t={t} sparkData={sparks.impressions} />
        <AdMetricCard title="Clicks"       value={fmtNum(dm.clicks)}                                      icon={<MousePointerClick size={15}/>}  index={1} accentColor={accents[1]} t={t} sparkData={sparks.clicks} />
        <AdMetricCard title="CTR"          value={`${dm.ctr.toFixed(2)}%`}                                icon={<Percent size={15}/>}            index={2} accentColor={accents[2]} t={t} sparkData={sparks.ctr} />
        <AdMetricCard title="Total Spend"  value={fmtCurrency(dm.cost)}                                   icon={<DollarSign size={15}/>}         index={3} accentColor={accents[3]} t={t} sparkData={sparks.cost} />
        <AdMetricCard title="Conversions"  value={String(+dm.conversions)}                                icon={<Target size={15}/>}             index={4} accentColor={accents[4]} t={t} sparkData={sparks.conversions} />
        <AdMetricCard title="Conv. Value"  value={fmtCurrency(dm.conversionsValue)}                       icon={<Award size={15}/>}              index={5} accentColor={accents[5]} t={t} sparkData={sparks.convValue} />
        <AdMetricCard title="Avg CPC"      value={`$${dm.averageCpc.toFixed(2)}`}                         icon={<TrendingUp size={15}/>}         index={6} accentColor={accents[6]} t={t} sparkData={sparks.cpc} />
        <AdMetricCard title="Cost / Conv." value={costPerConv > 0 ? `$${costPerConv.toFixed(2)}` : '—'}  sub={roas > 0 ? `${roas.toFixed(2)}× ROAS` : undefined}
          icon={<Calculator size={15}/>} index={7} accentColor={accents[7]} t={t} sparkData={sparks.costPerConv} />
      </div>

      {campaigns.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`${t.text} text-base font-bold`}>Campaign Breakdown</h3>
            <div className="flex gap-4">
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: t.subtext }}><span style={{ width: 10, height: 4, borderRadius: 2, background: colors.ring2, display: 'inline-block' }} /> Spend</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: t.subtext }}><span style={{ width: 10, height: 4, borderRadius: 2, background: colors.ring1, display: 'inline-block' }} /> Conversions</span>
            </div>
          </div>
          <div className="space-y-1">
            {campaigns.map((c, i) => <CampaignRow key={c.id} campaign={c} maxCost={maxCost} maxConv={maxConv} index={i} colors={colors} t={t} />)}
          </div>
        </div>
      )}
    </div>
  );
}