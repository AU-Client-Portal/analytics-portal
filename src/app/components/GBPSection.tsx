'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AreaChart, Area, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Eye, Search, Phone, Navigation, Globe, Star, MapPin, TrendingUp } from 'lucide-react';
import { getMockGBP } from './mockData';
import type { Theme } from './GA4Dashboard';

const USE_MOCK = true;
const TW_FONT = "var(--font-tomorrow), 'Tomorrow', sans-serif";

interface GBPMetricsData {
  businessImpressions: number; searchImpressions: number; mapsImpressions: number;
  websiteClicks: number; callClicks: number; directionRequests: number;
  averageRating: number; totalReviews: number;
}
interface GBPData {
  companyId: string; companyName: string; locationId: string; locationName: string;
  hasGBP?: boolean;
  dateRange: { startDate: string; endDate: string };
  metrics?: GBPMetricsData;
  timeSeries?: Array<{
    date: string; impressions: number; clicks: number; calls: number;
    searchImpressions?: number; mapsImpressions?: number; directionRequests?: number; avgRating?: number;
  }>;
}

interface Props {
  dateRange: { start: string; end: string };
  theme: Theme;
  themeStyles: any;
}

const ACCENT: Record<Theme, { ring1: string; ring2: string; ring3: string; ring4: string; track: string; border: string; chartLine1: string; chartLine2: string; chartLine3: string; barColors: string[] }> = {
  light:    { ring1: '#F26C00', ring2: '#2D2926', ring3: '#8A7A70', ring4: '#B05000', track: '#E8E7E5', border: '#D9D8D6', chartLine1: '#F26C00', chartLine2: '#2D2926', chartLine3: '#B05000', barColors: ['#F26C00', '#2D2926', '#8A7A70'] },
  dark:     { ring1: '#F26C00', ring2: '#D9D8D6', ring3: '#FF9040', ring4: '#FFB060', track: '#3D3530', border: '#3D3530', chartLine1: '#F26C00', chartLine2: '#D9D8D6', chartLine3: '#FF9040', barColors: ['#F26C00', '#D9D8D6', '#FF9040'] },
  asquared: { ring1: '#F26C00', ring2: '#FFB060', ring3: '#D9D8D6', ring4: '#FF8030', track: '#4A2810', border: '#6B3A18', chartLine1: '#F26C00', chartLine2: '#FFB060', chartLine3: '#D9D8D6', barColors: ['#F26C00', '#FFB060', '#D9D8D6'] },
};

function resolveDate(s: string): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  if (s === 'today') return d;
  if (s === 'yesterday') { d.setDate(d.getDate() - 1); return d; }
  const m = s.match(/^(\d+)daysAgo$/);
  if (m) { d.setDate(d.getDate() - parseInt(m[1])); return d; }
  const parsed = new Date(s);
  parsed.setHours(12, 0, 0, 0);
  return parsed;
}

function filterSeries<T extends { date: string }>(ts: T[], start: string, end: string): T[] {
  if (!start || !end || !ts.length) return ts;
  const s = resolveDate(start); s.setHours(0, 0, 0, 0);
  const e = resolveDate(end);   e.setHours(23, 59, 59, 999);
  return ts.filter(row => {
    const r = row.date;
    let parsed: Date;
    if (r.length === 8) {
      parsed = new Date(+r.slice(0,4), +r.slice(4,6)-1, +r.slice(6,8), 12, 0, 0, 0);
    } else {
      const [yr, mo, dy] = r.split('-').map(Number);
      parsed = new Date(yr, mo-1, dy, 12, 0, 0, 0);
    }
    return parsed >= s && parsed <= e;
  });
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000)    return `${(n / 1_000).toFixed(1)}K`;
  return Math.round(n).toLocaleString();
}

function ChartTip({ active, payload, label, raw }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: raw.card, border: `1px solid ${raw.border}`, borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)', fontFamily: TW_FONT }}>
      <p style={{ color: raw.subtext, fontSize: 11, marginBottom: 6, fontWeight: 600 }}>{label}</p>
      {payload.map((p: any, i: number) => <p key={i} style={{ color: p.color, fontSize: 12, fontWeight: 700, margin: '2px 0' }}>{p.name}: {p.value?.toLocaleString()}</p>)}
    </div>
  );
}

function GBPMetricCard({ title, value, icon, index, accent, t }: {
  title: string; value: string; icon: React.ReactNode;
  index: number; accent: string; t: any;
}) {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  useEffect(() => { const timer = setTimeout(() => setVisible(true), index * 70); return () => clearTimeout(timer); }, [index]);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(14px)', transition: `opacity 0.4s ease ${index * 60}ms, transform 0.4s ease ${index * 60}ms`, boxShadow: hovered ? `0 8px 28px ${accent}22` : '0 1px 4px rgba(0,0,0,0.06)' }}
      className={`${t.card} border ${t.border} rounded-2xl p-4 md:p-5 cursor-default`}>
      <div className="flex items-start justify-between mb-2">
        <span className={`${t.subtext} text-xs font-semibold uppercase tracking-widest`}>{title}</span>
        <span style={{ color: accent, opacity: hovered ? 1 : 0.4, transition: 'opacity 0.2s, transform 0.3s', transform: hovered ? 'scale(1.15) rotate(-5deg)' : 'scale(1)' }}>{icon}</span>
      </div>
      <p className={`${t.text} text-2xl font-bold tracking-tight`} style={{ color: hovered ? accent : undefined, transition: 'color 0.2s', fontFamily: TW_FONT }}>{value}</p>
    </div>
  );
}

export function GBPSection({ dateRange, theme, themeStyles: t }: Props) {
  const [data, setData]       = useState<GBPData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const searchParams = useSearchParams();
  const colors = ACCENT[theme] ?? ACCENT.light;

  useEffect(() => {
    async function load() {
      setLoading(true); setError(null);
      try {
        if (USE_MOCK) { await new Promise(r => setTimeout(r, 500)); setData(getMockGBP() as any); return; }
        const token = searchParams.get('token');
        const res = await fetch(`/api/gbp/metrics?token=${token}&startDate=${dateRange.start}&endDate=${dateRange.end}`);
        if (!res.ok) { const e = await res.json(); throw new Error(e.details || e.error || 'Failed'); }
        setData(await res.json());
      } catch (err: any) {
        const m = err.message?.toLowerCase() ?? '';
        let msg = err.message;
        if (m.includes('unauthorized') || m.includes('401') || m.includes('permission')) {
          msg = "We don't have permission to access your Google Business Profile. Ask your account manager to verify that the Google account has owner-level access to your GBP listing.";
        } else if (m.includes('not found') || m.includes('404')) {
          msg = "The Google Business Profile location couldn't be found. Your account manager may need to update the location ID in your portal settings.";
        } else if (m.includes('not configured')) {
          msg = "Google Business Profile hasn't been connected to this dashboard yet. Ask your account manager to add your GBP Location ID in your portal configuration.";
        }
        setError(msg);
      }
      finally { setLoading(false); }
    }
    load();
  }, [searchParams, dateRange]);

  if (loading) return (
    <div className="flex items-center gap-3 py-6">
      <div style={{ width: 18, height: 18, borderRadius: '50%', border: `2px solid ${colors.ring1}30`, borderTop: `2px solid ${colors.ring1}`, animation: 'gbpSpin 0.7s linear infinite' }} />
      <span className={`${t.subtext} text-sm`}>Loading Google Business Profile…</span>
      <style>{`@keyframes gbpSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (data?.hasGBP === false) return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <MapPin size={14} style={{ color: colors.ring1 }} />
        <p className={`${t.subtext} text-xs font-bold uppercase tracking-widest`}>Google Business Profile</p>
      </div>
      <div style={{ borderRadius: 16, padding: '28px 32px', border: `1.5px solid ${colors.border}`, background: `${colors.ring1}06`, textAlign: 'center' }}>
        <p className={t.text} style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, fontFamily: TW_FONT }}>Google Business Profile not connected</p>
        <p className={t.subtext} style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 460, margin: '0 auto' }}>
          Your Google Business Profile hasn't been linked yet. Ask your account manager to add your GBP Location ID to your portal settings.
        </p>
      </div>
    </div>
  );

  if (error) return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <MapPin size={14} style={{ color: colors.ring1 }} />
        <p className={`${t.subtext} text-xs font-bold uppercase tracking-widest`}>Google Business Profile</p>
      </div>
      <div style={{ borderRadius: 16, padding: '28px 32px', border: `1.5px solid ${colors.border}`, background: `${colors.ring1}06`, textAlign: 'center' }}>
        <p className={t.text} style={{ fontWeight: 700, fontSize: 14, marginBottom: 8, fontFamily: TW_FONT }}>Google Business Profile unavailable</p>
        <p className={t.subtext} style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 460, margin: '0 auto' }}>{error}</p>
      </div>
    </div>
  );

  if (!data?.metrics) return null;

  const m = data.metrics;
  const filteredTs = filterSeries(data.timeSeries ?? [], dateRange.start, dateRange.end);
  const timeSeries = filteredTs.map(d => ({
    ...d,
    date: d.date?.length === 8 ? `${d.date.slice(4, 6)}/${d.date.slice(6, 8)}` : d.date,
  }));

  const dm: GBPMetricsData = filteredTs.length > 0 ? {
    businessImpressions: filteredTs.reduce((s, d) => s + (d.impressions ?? 0), 0),
    searchImpressions:   filteredTs.reduce((s, d) => s + (d.searchImpressions ?? 0), 0),
    mapsImpressions:     filteredTs.reduce((s, d) => s + (d.mapsImpressions ?? 0), 0),
    websiteClicks:       filteredTs.reduce((s, d) => s + (d.clicks ?? 0), 0),
    callClicks:          filteredTs.reduce((s, d) => s + (d.calls ?? 0), 0),
    directionRequests:   filteredTs.reduce((s, d) => s + (d.directionRequests ?? 0), 0),
    averageRating:       m.averageRating,
    totalReviews:        m.totalReviews,
  } : m;

  const actionsData = [
    { name: 'Website', value: dm.websiteClicks     },
    { name: 'Calls',   value: dm.callClicks         },
    { name: 'Routes',  value: dm.directionRequests  },
  ];

  const cardAccents = [colors.ring1, colors.ring1, colors.ring4, colors.ring4, colors.ring2, colors.ring3];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MapPin size={14} style={{ color: colors.ring1 }} />
        <p className={`${t.subtext} text-xs font-bold uppercase tracking-widest`}>Google Business Profile</p>
        {data.locationName && <span className={`${t.subtext} text-xs opacity-60`}>· {data.locationName}</span>}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
        <GBPMetricCard title="Total Impressions"  value={fmt(dm.businessImpressions)} icon={<Eye size={16}/>}        index={0} accent={cardAccents[0]} t={t} />
        <GBPMetricCard title="Search Impressions" value={fmt(dm.searchImpressions)}   icon={<Search size={16}/>}     index={1} accent={cardAccents[1]} t={t} />
        <GBPMetricCard title="Maps Impressions"   value={fmt(dm.mapsImpressions)}     icon={<MapPin size={16}/>}     index={2} accent={cardAccents[2]} t={t} />
        <GBPMetricCard title="Website Clicks"     value={fmt(dm.websiteClicks)}       icon={<Globe size={16}/>}      index={3} accent={cardAccents[3]} t={t} />
        <GBPMetricCard title="Call Clicks"        value={fmt(dm.callClicks)}          icon={<Phone size={16}/>}      index={4} accent={cardAccents[4]} t={t} />
        <GBPMetricCard title="Direction Requests" value={fmt(dm.directionRequests)}   icon={<Navigation size={16}/>} index={5} accent={cardAccents[5]} t={t} />
      </div>

      {timeSeries.length > 0 && (
        <div className={`${t.card} border ${t.border} rounded-2xl p-4 md:p-5`}>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={13} style={{ color: colors.ring1 }} />
            <p className={`${t.subtext} text-xs font-bold uppercase tracking-widest`}>Profile Activity Over Time</p>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={timeSeries}>
              <defs>
                {[['gg1', colors.chartLine1], ['gg2', colors.chartLine2], ['gg3', colors.chartLine3]].map(([id, color]) => (
                  <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={color} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis dataKey="date" tick={{ fill: t.subtext.replace('text-[','').replace(']',''), fontSize: 9 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: t.subtext.replace('text-[','').replace(']',''), fontSize: 9 }} axisLine={false} tickLine={false} width={32} tickFormatter={v => fmt(v)} />
              <Tooltip content={props => <ChartTip {...props} raw={{ card: t.card.replace('bg-','').replace('[','').replace(']',''), border: colors.border, subtext: '#8A7A70' }} />} />
              <Area type="monotone" dataKey="impressions" stroke={colors.chartLine1} strokeWidth={2.5} fill="url(#gg1)" name="Impressions" dot={false} />
              <Area type="monotone" dataKey="clicks"      stroke={colors.chartLine2} strokeWidth={2}   fill="url(#gg2)" name="Clicks"      dot={false} />
              <Area type="monotone" dataKey="calls"       stroke={colors.chartLine3} strokeWidth={2}   fill="url(#gg3)" name="Calls"       dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className={`${t.card} border ${t.border} rounded-2xl p-4 md:p-5`}>
          <p className={`${t.subtext} text-xs font-bold uppercase tracking-widest mb-4`}>Customer Actions</p>
          <ResponsiveContainer width="100%" height={140}>
            <BarChart data={actionsData} barSize={34}>
              <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
              <XAxis dataKey="name" tick={{ fill: t.subtext.replace('text-[','').replace(']',''), fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: t.subtext.replace('text-[','').replace(']',''), fontSize: 9 }} axisLine={false} tickLine={false} width={30} tickFormatter={v => fmt(v)} />
              <Tooltip content={props => <ChartTip {...props} raw={{ card: t.card.replace('bg-','').replace('[','').replace(']',''), border: colors.border, subtext: '#8A7A70' }} />} />
              <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                {actionsData.map((_, i) => <Cell key={i} fill={colors.barColors[i % colors.barColors.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-4">
          <div className={`${t.card} border ${t.border} rounded-2xl p-4 md:p-5`}>
            <p className={`${t.subtext} text-xs font-bold uppercase tracking-widest mb-4`}>Impression Split</p>
            <div className="space-y-4">
              {[
                { label: 'Google Search', value: dm.searchImpressions, color: colors.chartLine1 },
                { label: 'Google Maps',   value: dm.mapsImpressions,   color: colors.chartLine2 },
              ].map(item => {
                const pct = dm.businessImpressions > 0 ? Math.round((item.value / dm.businessImpressions) * 100) : 0;
                return (
                  <div key={item.label}>
                    <div className="flex justify-between mb-1.5">
                      <span className={`${t.text} text-sm`}>{item.label}</span>
                      <span style={{ color: item.color, fontSize: 13, fontWeight: 700, fontFamily: TW_FONT }}>{pct}%</span>
                    </div>
                    <div style={{ height: 6, background: colors.track, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: item.color, borderRadius: 3, transition: 'width 1s ease' }} />
                    </div>
                    <p className={`${t.subtext} text-xs mt-1`}>{fmt(item.value)} impressions</p>
                  </div>
                );
              })}
            </div>
          </div>

          {dm.averageRating > 0 && (
            <div className={`${t.card} border ${t.border} rounded-2xl p-4 md:p-5`}>
              <div className="flex items-center gap-2 mb-3">
                <Star size={13} style={{ color: colors.ring2 }} />
                <p className={`${t.subtext} text-xs font-bold uppercase tracking-widest`}>Review Summary</p>
              </div>
              <div className="flex items-center gap-5">
                <div className="flex flex-col items-center shrink-0">
                  <span style={{ fontSize: 36, fontWeight: 800, color: colors.ring2, lineHeight: 1, letterSpacing: '-0.03em', fontFamily: TW_FONT }}>{dm.averageRating.toFixed(1)}</span>
                  <div className="flex gap-0.5 mt-1.5">
                    {[1,2,3,4,5].map(s => <Star key={s} size={11} style={{ color: s <= Math.round(dm.averageRating) ? colors.ring2 : colors.track, fill: s <= Math.round(dm.averageRating) ? colors.ring2 : colors.track }} />)}
                  </div>
                  <p className={`${t.subtext} text-xs mt-1.5`}>{dm.totalReviews.toLocaleString()} reviews</p>
                </div>
                <div style={{ flex: 1 }}>
                  {[5,4,3,2,1].map((s, i) => {
                    const pct = s === 5 ? 60 : s === 4 ? 25 : s === 3 ? 10 : s === 2 ? 3 : 2;
                    return (
                      <div key={s} className="flex items-center gap-2 mb-1.5">
                        <span className={`${t.subtext} text-xs w-2`}>{s}</span>
                        <div style={{ flex: 1, height: 5, background: colors.track, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: colors.ring2, borderRadius: 3, transition: `width 0.8s ease ${500 + i * 80}ms` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}