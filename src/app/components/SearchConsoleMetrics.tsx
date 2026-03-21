'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Search, TrendingUp, MousePointerClick, Eye, Percent, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { getMockSearchConsole } from './mockData';
import type { Theme } from './GA4Dashboard';

const USE_MOCK = false;
const TW_FONT = "var(--font-tomorrow), 'Tomorrow', sans-serif";

interface GSCData {
  siteUrl: string;
  metrics: { totalClicks: number; totalImpressions: number; avgCtr: number; avgPosition: number };
  timeSeries: Array<{ date: string; clicks: number; impressions: number; ctr: number; position: number }>;
  topQueries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number; positionTrend: number[] }>;
  topPages:   Array<{ page: string; clicks: number; impressions: number; ctr: number; position: number }>;
}

interface Props {
  dateRange: { start: string; end: string };
  theme: Theme;
  themeStyles: any;
}

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

function fmtNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000)    return `${Math.round(n / 1000)}K`;
  return n.toLocaleString();
}

function PosTrend({ data, color }: { data: number[]; color: string }) {
  if (!data || data.length < 2) return null;
  const reversed = data.map(v => ({ v: -v }));
  const gid = `gsc-pt-${Math.random().toString(36).slice(2, 7)}`;
  return (
    <div style={{ width: 56, height: 24 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={reversed} margin={{ top: 1, right: 0, left: 0, bottom: 1 }}>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${gid})`} dot={false} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

function PositionBadge({ pos, ring1, ring2, subtext }: { pos: number; ring1: string; ring2: string; subtext: string }) {
  const color = pos <= 3 ? ring1 : pos <= 10 ? ring2 : subtext;
  return <span style={{ fontWeight: 700, fontSize: 13, color, minWidth: 32, fontFamily: TW_FONT, display: 'inline-block' }}>{pos.toFixed(1)}</span>;
}

function PosDelta({ trend }: { trend: number[] }) {
  if (!trend || trend.length < 2) return null;
  const delta = trend[0] - trend[trend.length - 1];
  if (Math.abs(delta) < 0.2) return <Minus size={10} style={{ color: '#8A7A70', flexShrink: 0 }} />;
  const improved = delta > 0;
  const color = improved ? '#22c55e' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      {improved ? <ArrowUp size={10} style={{ color, flexShrink: 0 }} /> : <ArrowDown size={10} style={{ color, flexShrink: 0 }} />}
      <span style={{ fontSize: 10, fontWeight: 700, color, fontFamily: TW_FONT }}>{Math.abs(delta).toFixed(1)}</span>
    </div>
  );
}

const ACCENT: Record<Theme, { ring1: string; ring2: string; ring3: string; track: string; border: string; pillActive: string; pillInactive: string }> = {
  light:    { ring1: '#F26C00', ring2: '#2D2926', ring3: '#8A7A70', track: '#E8E7E5', border: '#D9D8D6', pillActive: 'bg-[#F26C00] text-white', pillInactive: 'bg-[#E8E7E5] text-[#6B6460] hover:bg-[#D9D8D6]' },
  dark:     { ring1: '#F26C00', ring2: '#D9D8D6', ring3: '#FF9040', track: '#3D3530', border: '#3D3530', pillActive: 'bg-[#F26C00] text-white', pillInactive: 'bg-[#3D3530] text-[#A09488] hover:bg-[#4A4038]' },
  asquared: { ring1: '#F26C00', ring2: '#FFB060', ring3: '#D9D8D6', track: '#4A2810', border: '#6B3A18', pillActive: 'bg-[#F26C00] text-white', pillInactive: 'bg-[#4A2810] text-[#C09060] hover:bg-[#6B3A18]' },
};

export function SearchConsoleMetrics({ dateRange, theme, themeStyles: t }: Props) {
  const [data, setData]       = useState<GSCData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [tab, setTab]         = useState<'queries' | 'pages'>('queries');
  const searchParams = useSearchParams();
  const colors = ACCENT[theme] ?? ACCENT.light;

  useEffect(() => {
    async function load() {
      setLoading(true); setError(null);
      try {
        if (USE_MOCK) { await new Promise(r => setTimeout(r, 450)); setData(getMockSearchConsole() as any); return; }
        const token = searchParams.get('token');
        const res = await fetch(`/api/search-console/metrics?token=${token}&startDate=${dateRange.start}&endDate=${dateRange.end}`);
        if (!res.ok) { const e = await res.json(); throw new Error(e.details || e.error || 'Failed'); }
        setData(await res.json());
      } catch (err: any) { setError(err.message); }
      finally { setLoading(false); }
    }
    load();
  }, [searchParams, dateRange]);

  if (loading) return (
    <div className="flex items-center gap-3 py-10">
      <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${colors.ring1}30`, borderTop: `2px solid ${colors.ring1}`, animation: 'gscSpin 0.7s linear infinite' }} />
      <span className={`${t.subtext} text-sm`}>Loading Search Console…</span>
      <style>{`@keyframes gscSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Search size={16} style={{ color: colors.ring1 }} />
        <h2 className={`${t.text} text-xl font-bold tracking-tight`} style={{ fontFamily: TW_FONT }}>Organic Search Performance</h2>
      </div>
      <div style={{ borderRadius: 16, padding: '28px 32px', border: `1.5px solid ${colors.border}`, background: `${colors.ring1}06`, textAlign: 'center' }}>
        <p className={t.text} style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, fontFamily: TW_FONT }}>Search Performance not connected</p>
        <p className={t.subtext} style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 460, margin: '0 auto' }}>
          Your organic search data hasn't been linked yet. Ask your account manager to enable this — it shows which Google searches bring people to your website. They'll need Google Search Console property access.
        </p>
      </div>
    </div>
  );

  if (!data) return null;

  const filteredTs = filterSeries(data.timeSeries, dateRange.start, dateRange.end);
  const dm = filteredTs.length > 0 ? {
    totalClicks:      filteredTs.reduce((s, d) => s + d.clicks, 0),
    totalImpressions: filteredTs.reduce((s, d) => s + d.impressions, 0),
    avgCtr:           +(filteredTs.reduce((s, d) => s + d.ctr, 0) / filteredTs.length).toFixed(2),
    avgPosition:      +(filteredTs.reduce((s, d) => s + d.position, 0) / filteredTs.length).toFixed(1),
  } : data.metrics;

  const clicksSpk  = filteredTs.map(d => d.clicks);
  const impressSpk = filteredTs.map(d => d.impressions);

  const overviewCards = [
    { label: 'Total Clicks',      value: fmtNum(dm.totalClicks),      sub: 'organic clicks',     icon: <MousePointerClick size={14} />, color: colors.ring1, spark: clicksSpk  },
    { label: 'Total Impressions', value: fmtNum(dm.totalImpressions),  sub: 'search appearances', icon: <Eye size={14} />,              color: colors.ring2, spark: impressSpk },
    { label: 'Avg CTR',           value: `${dm.avgCtr.toFixed(2)}%`,   sub: 'click-through rate', icon: <Percent size={14} />,          color: colors.ring3, spark: filteredTs.map(d => d.ctr) },
    { label: 'Avg Position',      value: `${dm.avgPosition.toFixed(1)}`, sub: 'search position',  icon: <TrendingUp size={14} />,        color: dm.avgPosition <= 3 ? colors.ring1 : colors.ring2, spark: filteredTs.map(d => -d.position + 10) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Search size={16} style={{ color: colors.ring1 }} />
            <h2 className={`${t.text} text-xl font-bold tracking-tight`} style={{ fontFamily: TW_FONT }}>Organic Search Performance</h2>
          </div>
          <p className={`${t.subtext} text-xs`}>Organic search performance from Google</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {overviewCards.map((card, i) => (
          <div key={i} className={`${t.card} border ${t.border} rounded-2xl overflow-hidden cursor-default`}>
            <div style={{ padding: '12px 14px 8px' }}>
              <div className="flex items-start justify-between mb-1.5">
                <span className={`${t.subtext} font-semibold uppercase tracking-widest`} style={{ fontSize: 10 }}>{card.label}</span>
                <span style={{ color: card.color, opacity: 0.5 }}>{card.icon}</span>
              </div>
              <p className={`${t.text} font-bold tracking-tight`} style={{ fontSize: 'clamp(0.95rem, 4vw, 1.5rem)', fontFamily: TW_FONT }}>{card.value}</p>
              <p className={`${t.subtext}`} style={{ fontSize: 10, marginTop: 2 }}>{card.sub}</p>
            </div>
            {card.spark.length > 1 && (
              <div style={{ height: 36 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={card.spark.map(v => ({ v }))} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id={`gscov${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={card.color} stopOpacity={0.28} />
                        <stop offset="100%" stopColor={card.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="v" stroke={card.color} strokeWidth={1.5} fill={`url(#gscov${i})`} dot={false} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
          <button onClick={() => setTab('queries')} className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${tab === 'queries' ? colors.pillActive : colors.pillInactive}`}>Top Queries</button>
          <button onClick={() => setTab('pages')}   className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${tab === 'pages'   ? colors.pillActive : colors.pillInactive}`}>Top Pages</button>
        </div>

        {tab === 'queries' && (
          <div className={`${t.card} border ${t.border} rounded-2xl overflow-hidden`}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                    {['Query', 'Clicks', 'Impressions', 'CTR', 'Position', 'Trend'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: h === 'Query' ? 'left' : 'right', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.ring1, opacity: 0.7, whiteSpace: 'nowrap', fontFamily: TW_FONT }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.topQueries.map((row, i) => (
                    <tr key={i} style={{ borderBottom: i < data.topQueries.length - 1 ? `1px solid ${colors.border}` : 'none' }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = `${colors.ring1}06`}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                      <td style={{ padding: '10px 16px', maxWidth: 200 }}>
                        <span className={`${t.text}`} style={{ fontSize: 13, fontWeight: 500, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.query}</span>
                      </td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}><span style={{ color: colors.ring1, fontWeight: 700, fontSize: 13, fontFamily: TW_FONT }}>{fmtNum(row.clicks)}</span></td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}><span className={`${t.subtext}`} style={{ fontSize: 13, fontFamily: TW_FONT }}>{fmtNum(row.impressions)}</span></td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}><span className={`${t.subtext}`} style={{ fontSize: 13, fontFamily: TW_FONT }}>{row.ctr.toFixed(2)}%</span></td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                          <PosDelta trend={row.positionTrend} />
                          <PositionBadge pos={row.position} ring1={colors.ring1} ring2={colors.ring2} subtext={colors.ring3} />
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px', display: 'flex', justifyContent: 'flex-end' }}>
                        <PosTrend data={row.positionTrend} color={row.position <= 3 ? colors.ring1 : colors.ring2} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ padding: '10px 16px', borderTop: `1px solid ${colors.border}` }}>
              <p className={`${t.subtext}`} style={{ fontSize: 10 }}>
                Position is your average ranking in Google search results for each query. Lower number = higher on the page. The trend shows movement over the past 7 weeks.
              </p>
            </div>
          </div>
        )}

        {tab === 'pages' && (
          <div className={`${t.card} border ${t.border} rounded-2xl overflow-hidden`}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                    {['Page', 'Clicks', 'Impressions', 'CTR', 'Avg Position'].map(h => (
                      <th key={h} style={{ padding: '10px 16px', textAlign: h === 'Page' ? 'left' : 'right', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.ring1, opacity: 0.7, fontFamily: TW_FONT }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.topPages.map((row, i) => (
                    <tr key={i} style={{ borderBottom: i < data.topPages.length - 1 ? `1px solid ${colors.border}` : 'none' }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = `${colors.ring1}06`}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                      <td style={{ padding: '10px 16px', maxWidth: 220 }}><span className={`${t.text}`} style={{ fontSize: 12, fontFamily: 'monospace', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.page}</span></td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}><span style={{ color: colors.ring1, fontWeight: 700, fontSize: 13, fontFamily: TW_FONT }}>{fmtNum(row.clicks)}</span></td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}><span className={`${t.subtext}`} style={{ fontSize: 13, fontFamily: TW_FONT }}>{fmtNum(row.impressions)}</span></td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}><span className={`${t.subtext}`} style={{ fontSize: 13, fontFamily: TW_FONT }}>{row.ctr.toFixed(2)}%</span></td>
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}><PositionBadge pos={row.position} ring1={colors.ring1} ring2={colors.ring2} subtext={colors.ring3} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}