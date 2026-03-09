'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  Users, Activity, Eye, UserPlus, Clock, TrendingDown,
  Zap, Sun, Moon, Leaf, Monitor, Smartphone, Tablet, BarChart2,
  Settings, X, Check
} from 'lucide-react';
import { GoogleAdsMetrics } from './GoogleAdsMetrics';
import { MetricoolMetrics } from './MetricoolMetrics';
import dynamic from 'next/dynamic';
import { MOCK_GA4 } from './mockData';

const WorldHeatmap = dynamic(
  () => import('./WorldHeatmap').then(m => m.WorldHeatmap),
  { ssr: false, loading: () => <p style={{ fontSize: 13, padding: 20, textAlign: 'center', opacity: 0.5 }}>Loading map…</p> }
);

const USE_MOCK = false;

export type Theme = 'light' | 'dark' | 'forest';

const ALL_HERO_METRICS = [
  { id: 'engagementRate', label: 'Engagement Rate', sub: 'of sessions'   },
  { id: 'bounceRate',     label: 'Bounce Rate',     sub: 'leaving early' },
  { id: 'activeUsers',    label: 'Active Users',    sub: 'this period'   },
  { id: 'sessions',       label: 'Sessions',        sub: 'this period'   },
  { id: 'pageViews',      label: 'Page Views',      sub: 'total'         },
  { id: 'newUsers',       label: 'New Users',       sub: 'first visit'   },
  { id: 'avgSession',     label: 'Avg Session',     sub: 'seconds'       },
] as const;

type HeroMetricId = typeof ALL_HERO_METRICS[number]['id'];
const DEFAULT_HERO: [HeroMetricId, HeroMetricId, HeroMetricId] = ['engagementRate', 'activeUsers', 'bounceRate'];

interface DashboardPreferences {
  theme: Theme;
  heroMetrics: [HeroMetricId, HeroMetricId, HeroMetricId];
}

const THEMES: { id: Theme; label: string; icon: React.ReactNode }[] = [
  { id: 'light',  label: 'Light',  icon: <Sun size={14} /> },
  { id: 'dark',   label: 'Dark',   icon: <Moon size={14} /> },
  { id: 'forest', label: 'Forest', icon: <Leaf size={14} /> },
];

const THEME_RAW: Record<Theme, {
  bg: string; card: string; border: string; text: string; subtext: string; track: string;
  ring1: string; ring2: string; ring3: string; ringTrack: string;
  chartLine1: string; chartLine2: string; chartLine3: string;
  barColors: string[]; pieColors: string[]; legendText: string;
}> = {
  light: {
    bg: '#f0f2f5', card: '#fafbfc', border: '#dde2e8',
    text: '#1a1f2e', subtext: '#6b7a8d', track: '#e8ecf0',
    ring1: '#003F27', ring2: '#f59e0b', ring3: '#ef4444', ringTrack: '#dde2e8',
    chartLine1: '#003F27', chartLine2: '#22c55e', chartLine3: '#f59e0b',
    barColors: ['#003F27', '#22c55e', '#f59e0b'],
    pieColors: ['#003F27', '#22c55e', '#f59e0b', '#3b82f6', '#a855f7', '#f97316', '#06b6d4', '#ef4444'],
    legendText: '#6b7a8d',
  },
  dark: {
    bg: '#13151f', card: '#1c1f2e', border: '#2c3040',
    text: '#e8ecf4', subtext: '#8a9ab8', track: '#2c3040',
    ring1: '#4ade80', ring2: '#fbbf24', ring3: '#f87171', ringTrack: '#2c3040',
    chartLine1: '#4ade80', chartLine2: '#fbbf24', chartLine3: '#60a5fa',
    barColors: ['#4ade80', '#fbbf24', '#60a5fa'],
    pieColors: ['#4ade80', '#fbbf24', '#60a5fa', '#c084fc', '#f87171', '#fb923c', '#22d3ee', '#a3e635'],
    legendText: '#8a9ab8',
  },
  forest: {
    bg: '#f0e8d8', card: '#faf4e8', border: '#d4b896',
    text: '#2c1a0e', subtext: '#7a5c3a', track: '#e8d5b7',
    ring1: '#003F27', ring2: '#b5832a', ring3: '#9b4a20', ringTrack: '#e8d5b7',
    chartLine1: '#003F27', chartLine2: '#b5832a', chartLine3: '#5a8fa8',
    barColors: ['#6b4226', '#b5832a', '#5a8fa8'],
    pieColors: ['#6b4226', '#b5832a', '#5a8fa8', '#6a8f6a', '#9b4a20', '#8b5a2b', '#7a5c3a', '#c8a97a'],
    legendText: '#7a5c3a',
  },
};

const THEME_TW: Record<Theme, {
  bg: string; card: string; border: string; text: string; subtext: string; accentText: string;
  headerBg: string; pillActive: string; pillInactive: string;
  tableBg: string; tableHover: string; trackBg: string;
}> = {
  light: {
    bg: 'bg-[#f0f2f5]', card: 'bg-[#fafbfc]', border: 'border-[#dde2e8]',
    text: 'text-[#1a1f2e]', subtext: 'text-[#6b7a8d]', accentText: 'text-[#003F27]',
    headerBg: 'bg-[#fafbfc]/90 backdrop-blur border-b border-[#dde2e8]',
    pillActive: 'bg-[#003F27] text-white',
    pillInactive: 'bg-[#e8ecf0] text-[#6b7a8d] hover:bg-[#dde2e8]',
    tableBg: 'bg-[#fafbfc]', tableHover: 'hover:bg-[#f0f2f5]', trackBg: 'bg-[#e8ecf0]',
  },
  dark: {
    bg: 'bg-[#13151f]', card: 'bg-[#1c1f2e]', border: 'border-[#2c3040]',
    text: 'text-[#e8ecf4]', subtext: 'text-[#8a9ab8]', accentText: 'text-[#4ade80]',
    headerBg: 'bg-[#13151f]/90 backdrop-blur border-b border-[#2c3040]',
    pillActive: 'bg-[#003F27] text-[#4ade80]',
    pillInactive: 'bg-[#2c3040] text-[#8a9ab8] hover:bg-[#353848]',
    tableBg: 'bg-[#1c1f2e]', tableHover: 'hover:bg-[#232636]', trackBg: 'bg-[#2c3040]',
  },
  forest: {
    bg: 'bg-[#f0e8d8]', card: 'bg-[#faf4e8]', border: 'border-[#d4b896]',
    text: 'text-[#2c1a0e]', subtext: 'text-[#7a5c3a]', accentText: 'text-[#003F27]',
    headerBg: 'bg-[#f0e8d8]/90 backdrop-blur border-b border-[#d4b896]',
    pillActive: 'bg-[#003F27] text-[#e8d5b7]',
    pillInactive: 'bg-[#e8d5b7] text-[#7a5c3a] hover:bg-[#ddc9a3]',
    tableBg: 'bg-[#faf4e8]', tableHover: 'hover:bg-[#f0e8d8]', trackBg: 'bg-[#e8d5b7]',
  },
};

const DATE_RANGES = [
  { label: 'Today',     value: { start: 'today',      end: 'today'      } },
  { label: 'Yesterday', value: { start: 'yesterday',  end: 'yesterday'  } },
  { label: '7 Days',    value: { start: '7daysAgo',   end: 'today'      } },
  { label: '30 Days',   value: { start: '30daysAgo',  end: 'today'      } },
  { label: '90 Days',   value: { start: '90daysAgo',  end: 'today'      } },
  { label: '6 Months',  value: { start: '180daysAgo', end: 'today'      } },
  { label: '1 Year',    value: { start: '365daysAgo', end: 'today'      } },
];

interface GA4Data {
  companyId: string; companyName: string;
  dateRange: { startDate: string; endDate: string };
  metrics: {
    activeUsers: number; sessions: number; pageViews: number;
    avgSessionDuration: number; bounceRate: string; newUsers: number; engagementRate: string;
  };
  timeSeries: Array<{ date: string; activeUsers: number; sessions: number; pageViews: number }>;
  topPages: Array<{ title: string; path: string; views: number }>;
  trafficSources: Array<{ source: string; sessions: number }>;
  devices: Array<{ device: string; users: number }>;
  countries: Array<{ country: string; users: number }>;
}

function RingGauge({ value, label, sub, color, trackColor, pct, size = 160 }: {
  value: string; label: string; sub: string; color: string; trackColor: string; pct: number; size?: number;
}) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 200); return () => clearTimeout(t); }, []);
  const r = size * 0.38;
  const circ = 2 * Math.PI * r;
  const dash = animated ? Math.min(pct / 100, 1) * circ : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={size * 0.055} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size * 0.055}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <span style={{ fontSize: size * 0.185, fontWeight: 700, color, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</span>
          <span style={{ fontSize: size * 0.075, color, fontWeight: 600, opacity: 0.8, letterSpacing: '0.03em' }}>{sub}</span>
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.6 }}>{label}</span>
    </div>
  );
}

function useCountUp(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

function MetricCard({ title, value, suffix = '', icon, index, tw, raw }: {
  title: string; value: number; suffix?: string; icon: React.ReactNode;
  index: number; tw: typeof THEME_TW[Theme]; raw: typeof THEME_RAW[Theme];
}) {
  const [visible, setVisible] = useState(false);
  const count = useCountUp(value);
  useEffect(() => { const t = setTimeout(() => setVisible(true), index * 75); return () => clearTimeout(t); }, [index]);
  return (
    <div
      className={`${tw.card} border ${tw.border} rounded-2xl p-5 cursor-default group`}
      style={{ transition: 'transform 0.3s ease, box-shadow 0.3s ease, opacity 0.4s ease',
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(14px)' }}
      onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`${tw.subtext} text-xs font-semibold uppercase tracking-widest`}>{title}</div>
        <div className={`${tw.accentText} opacity-50 group-hover:opacity-100 transition-opacity`}>{icon}</div>
      </div>
      <div className={`${tw.text} text-3xl font-bold tracking-tight`}>{count.toLocaleString()}{suffix}</div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label, raw }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: raw.card, border: `1px solid ${raw.border}`, borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
      <p style={{ color: raw.subtext, fontSize: 11, marginBottom: 6, fontWeight: 600 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, fontSize: 12, fontWeight: 700, margin: '2px 0' }}>
          {p.name}: {p.value?.toLocaleString()}
        </p>
      ))}
    </div>
  );
};

export function GA4Dashboard() {
  const [data, setData] = useState<GA4Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRange, setSelectedRange] = useState(3);
  const [theme, setTheme] = useState<Theme>('forest');
  const [heroMetrics, setHeroMetrics] = useState<[HeroMetricId, HeroMetricId, HeroMetricId]>(DEFAULT_HERO);
  const [showPicker, setShowPicker] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchParams = useSearchParams();
  const tw = THEME_TW[theme];
  const raw = THEME_RAW[theme];
  const token = searchParams.get('token') ?? '';

  useEffect(() => {
    try {
      const local = localStorage.getItem('dashboard-prefs');
      if (local) {
        const p: DashboardPreferences = JSON.parse(local);
        if (p.theme && THEME_TW[p.theme]) setTheme(p.theme);
        if (p.heroMetrics?.length === 3) setHeroMetrics(p.heroMetrics);
      }
    } catch {}

    if (USE_MOCK) return;
    fetch(`/api/preferences?token=${token}`)
      .then(r => r.json())
      .then(({ preferences: p }) => {
        if (!p) return;
        if (p.theme && THEME_TW[p.theme as Theme]) setTheme(p.theme as Theme);
        if (p.heroMetrics?.length === 3) setHeroMetrics(p.heroMetrics);
        localStorage.setItem('dashboard-prefs', JSON.stringify(p));
      })
      .catch(() => {});
  }, [token]);

  const savePreferences = useCallback((prefs: DashboardPreferences) => {
    localStorage.setItem('dashboard-prefs', JSON.stringify(prefs));
    if (USE_MOCK) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSavingPrefs(true);
      setSaveStatus('idle');
      try {
        const res = await fetch(`/api/preferences?token=${token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(prefs),
        });
        if (!res.ok) throw new Error('save failed');
        setSaveStatus('saved');
      } catch {
        setSaveStatus('error');
      } finally {
        setSavingPrefs(false);
        setTimeout(() => setSaveStatus('idle'), 2500);
      }
    }, 800);
  }, [token]);

  const changeTheme = (th: Theme) => {
    setTheme(th);
    savePreferences({ theme: th, heroMetrics });
  };

  const changeHeroMetrics = (metrics: [HeroMetricId, HeroMetricId, HeroMetricId]) => {
    setHeroMetrics(metrics);
    savePreferences({ theme, heroMetrics: metrics });
  };

  useEffect(() => {
    async function fetchMetrics() {
      setLoading(true); setError(null);
      try {
        if (USE_MOCK) {
          await new Promise(r => setTimeout(r, 600));
          setData(MOCK_GA4);
          return;
        }
        const range = DATE_RANGES[selectedRange].value;
        const res = await fetch(`/api/ga4/metrics?token=${token}&startDate=${range.start}&endDate=${range.end}`);
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed'); }
        setData(await res.json());
      } catch (err: any) { setError(err.message); }
      finally { setLoading(false); }
    }
    fetchMetrics();
  }, [token, selectedRange]);

  const fmtDate = (d: string) => d?.length === 8 ? `${d.substring(4,6)}/${d.substring(6,8)}` : d;
  const deviceIcon = (d: string) => d.toLowerCase().includes('mobile') ? <Smartphone size={14} /> : d.toLowerCase().includes('tablet') ? <Tablet size={14} /> : <Monitor size={14} />;

  if (loading) return (
    <div className={`min-h-screen ${tw.bg} flex items-center justify-center transition-colors duration-300`}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: `${raw.ring1}30` }} />
          <div className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: raw.ring1, borderTopColor: 'transparent' }} />
        </div>
        <p className={`${tw.subtext} text-sm font-medium`}>Loading analytics…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className={`min-h-screen ${tw.bg} flex items-center justify-center p-6`}>
      <div className={`${tw.card} border ${tw.border} rounded-2xl p-8 max-w-md w-full text-center`}>
        <div className="text-red-400 text-4xl mb-3">⚠</div>
        <p className={`${tw.text} font-semibold mb-1`}>Failed to load analytics</p>
        <p className={`${tw.subtext} text-sm`}>{error}</p>
      </div>
    </div>
  );

  if (!data?.metrics) return (
    <div className={`min-h-screen ${tw.bg} flex items-center justify-center`}>
      <p className={tw.subtext}>No data available</p>
    </div>
  );

  const ts = data.timeSeries.map(d => ({ ...d, date: fmtDate(d.date) }));
  const maxPages = Math.max(...data.topPages.map(p => p.views), 1);
  const totalSrc = data.trafficSources.reduce((s, r) => s + r.sessions, 0);
  const newPct = data.metrics.sessions > 0 ? Math.round((data.metrics.newUsers / data.metrics.sessions) * 100) : 0;
  const ringColors = [raw.ring1, raw.ring2, raw.ring3];

  const HERO_VALUES: Record<HeroMetricId, { value: string; sub: string; pct: number }> = {
    engagementRate: { value: `${parseFloat(data.metrics.engagementRate).toFixed(0)}%`, sub: 'of sessions',  pct: parseFloat(data.metrics.engagementRate) },
    bounceRate:     { value: `${parseFloat(data.metrics.bounceRate).toFixed(0)}%`,     sub: 'leaving early', pct: parseFloat(data.metrics.bounceRate) },
    activeUsers:    { value: data.metrics.activeUsers.toLocaleString(),                sub: `${newPct}% new`, pct: Math.min((data.metrics.activeUsers / Math.max(data.metrics.sessions, 1)) * 100, 100) },
    sessions:       { value: data.metrics.sessions.toLocaleString(),                   sub: 'total',         pct: Math.min((data.metrics.sessions / Math.max(data.metrics.pageViews, 1)) * 100, 100) },
    pageViews:      { value: data.metrics.pageViews.toLocaleString(),                  sub: 'total',         pct: Math.min((data.metrics.pageViews / 20000) * 100, 100) },
    newUsers:       { value: data.metrics.newUsers.toLocaleString(),                   sub: 'first visit',   pct: Math.min((data.metrics.newUsers / Math.max(data.metrics.activeUsers, 1)) * 100, 100) },
    avgSession:     { value: `${Math.round(data.metrics.avgSessionDuration)}s`,        sub: 'per session',   pct: Math.min((data.metrics.avgSessionDuration / 300) * 100, 100) },
  };

  return (
    <div className={`min-h-screen ${tw.bg} transition-colors duration-300`} style={{ color: raw.text }}>

      {showPicker && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
          onClick={e => { if (e.target === e.currentTarget) setShowPicker(false); }}
        >
          <div
            className={`${tw.card} border ${tw.border} rounded-2xl shadow-2xl w-full max-w-md`}
            style={{ animation: 'modalIn 0.25s cubic-bezier(0.34,1.56,0.64,1)' }}
          >
            <div className="flex items-center justify-between p-6 pb-4">
              <div>
                <h3 className={`${tw.text} font-bold text-lg`}>Customize Hero Metrics</h3>
                <p className={`${tw.subtext} text-xs mt-0.5`}>Pick 3 metrics to highlight at the top</p>
              </div>
              <button onClick={() => setShowPicker(false)} className={`${tw.pillInactive} p-1.5 rounded-lg`}><X size={16} /></button>
            </div>
            <div className="px-6 pb-6 space-y-2">
              {ALL_HERO_METRICS.map(m => {
                const selectedIdx = heroMetrics.indexOf(m.id as HeroMetricId);
                const isSelected = selectedIdx !== -1;
                const slotColor = isSelected ? ringColors[selectedIdx] : undefined;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      if (isSelected) {
                        const unselected = ALL_HERO_METRICS.find(x => !heroMetrics.includes(x.id as HeroMetricId));
                        if (!unselected) return;
                        const next = [...heroMetrics] as [HeroMetricId, HeroMetricId, HeroMetricId];
                        next[selectedIdx] = unselected.id as HeroMetricId;
                        changeHeroMetrics(next);
                      } else {
                        changeHeroMetrics([heroMetrics[0], heroMetrics[1], m.id as HeroMetricId]);
                      }
                    }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', borderRadius: 12, border: '1.5px solid',
                      borderColor: isSelected ? slotColor! : 'transparent',
                      background: isSelected ? `${slotColor}12` : 'transparent',
                      cursor: 'pointer', transition: 'all 0.15s', outline: 'none', textAlign: 'left',
                    }}
                  >
                    <div style={{
                      width: 28, height: 28, borderRadius: 8, border: '2px solid',
                      borderColor: isSelected ? slotColor! : raw.border,
                      background: isSelected ? slotColor! : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, transition: 'all 0.15s',
                    }}>
                      {isSelected
                        ? <Check size={14} color="white" strokeWidth={3} />
                        : <span style={{ fontSize: 10, color: raw.subtext, fontWeight: 700 }}>+</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`${tw.text} text-sm font-semibold`}>{m.label}</p>
                      <p className={`${tw.subtext} text-xs`}>{m.sub}</p>
                    </div>
                    {isSelected && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: slotColor, background: `${slotColor}20`, padding: '2px 8px', borderRadius: 6 }}>
                        Ring {selectedIdx + 1}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className={`border-t ${tw.border} px-6 py-4 flex items-center justify-between`}>
              <p className={`${tw.subtext} text-xs`}>
                {USE_MOCK
                  ? 'Mock mode — saved locally only'
                  : savingPrefs ? 'Saving…'
                  : saveStatus === 'saved' ? '✓ Saved to your profile'
                  : saveStatus === 'error' ? '⚠ Save failed'
                  : 'Changes save automatically'}
              </p>
              <button onClick={() => setShowPicker(false)} className={`${tw.pillActive} px-4 py-1.5 rounded-lg text-xs font-semibold`}>Done</button>
            </div>
          </div>
        </div>
      )}

      <header className={`sticky top-0 z-50 ${tw.headerBg} px-4 md:px-8 py-3`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#003F27] flex items-center justify-center shrink-0">
              <BarChart2 size={16} className="text-white" />
            </div>
            <div>
              <p className={`${tw.text} font-bold text-sm leading-tight`}>{data.companyName}</p>
              <p className={`${tw.subtext} text-xs`}>Analytics Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {!USE_MOCK && saveStatus !== 'idle' && (
              <span style={{
                fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 8,
                background: saveStatus === 'saved' ? `${raw.ring1}18` : '#fef2f2',
                color: saveStatus === 'saved' ? raw.ring1 : '#ef4444',
              }}>
                {saveStatus === 'saved' ? '✓ Saved' : '⚠ Save failed'}
              </span>
            )}
            <div className="flex gap-1 flex-wrap">
              {DATE_RANGES.map((r, i) => (
                <button key={i} onClick={() => setSelectedRange(i)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${selectedRange === i ? tw.pillActive : tw.pillInactive}`}>
                  {r.label}
                </button>
              ))}
            </div>
            <div className={`flex gap-0.5 p-1 rounded-xl border ${tw.border} ${tw.card}`}>
              {THEMES.map(th => (
                <button key={th.id} onClick={() => changeTheme(th.id)} title={th.label}
                  className={`p-1.5 rounded-lg transition-all duration-200 flex items-center gap-1 text-xs font-medium ${theme === th.id ? tw.pillActive : tw.pillInactive}`}>
                  {th.icon}
                  <span className="hidden sm:inline">{th.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">

        <div className={`${tw.card} border ${tw.border} rounded-2xl p-8`}>
          <div className="flex items-center justify-between mb-8">
            <p className={`${tw.subtext} text-xs font-bold uppercase tracking-widest`}>Key Highlights</p>
            <button
              onClick={() => setShowPicker(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${tw.pillInactive}`}
            >
              <Settings size={12} />
              <span>Customize</span>
            </button>
          </div>
          <div className="flex justify-around items-center flex-wrap gap-8">
            {heroMetrics.map((metricId, i) => {
              const meta = ALL_HERO_METRICS.find(m => m.id === metricId)!;
              const vals = HERO_VALUES[metricId];
              return (
                <div key={metricId} className="flex items-center gap-8 w-full justify-around md:contents">
                  <RingGauge
                    value={vals.value} label={meta.label} sub={vals.sub}
                    color={ringColors[i]} trackColor={raw.ringTrack} pct={vals.pct} size={172}
                  />
                  {i < 2 && <div style={{ width: 1, height: 120, background: raw.border }} className="hidden md:block" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard title="Active Users"    value={data.metrics.activeUsers}                          icon={<Users size={18}/>}        index={0} tw={tw} raw={raw} />
          <MetricCard title="Sessions"        value={data.metrics.sessions}                              icon={<Activity size={18}/>}     index={1} tw={tw} raw={raw} />
          <MetricCard title="Page Views"      value={data.metrics.pageViews}                             icon={<Eye size={18}/>}          index={2} tw={tw} raw={raw} />
          <MetricCard title="New Users"       value={data.metrics.newUsers}                              icon={<UserPlus size={18}/>}     index={3} tw={tw} raw={raw} />
          <MetricCard title="Avg Session (s)" value={Math.round(data.metrics.avgSessionDuration)}        icon={<Clock size={18}/>}        index={4} tw={tw} raw={raw} />
          <MetricCard title="Bounce Rate"     value={parseFloat(data.metrics.bounceRate)}   suffix="%"   icon={<TrendingDown size={18}/>} index={5} tw={tw} raw={raw} />
          <MetricCard title="Engagement"      value={parseFloat(data.metrics.engagementRate)} suffix="%" icon={<Zap size={18}/>}         index={6} tw={tw} raw={raw} />
        </div>

        {ts.length > 0 && (
          <div className={`${tw.card} border ${tw.border} rounded-2xl p-6`}>
            <p className={`${tw.subtext} text-xs font-bold uppercase tracking-widest mb-5`}>Traffic Over Time</p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={ts}>
                <CartesianGrid strokeDasharray="3 3" stroke={raw.border} />
                <XAxis dataKey="date" tick={{ fill: raw.subtext, fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: raw.subtext, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip raw={raw} />} />
                <Legend wrapperStyle={{ fontSize: 12, color: raw.legendText }} />
                <Line type="monotone" dataKey="activeUsers" stroke={raw.chartLine1} strokeWidth={2.5} dot={false} name="Active Users" />
                <Line type="monotone" dataKey="sessions"    stroke={raw.chartLine2} strokeWidth={2}   dot={false} name="Sessions" />
                <Line type="monotone" dataKey="pageViews"   stroke={raw.chartLine3} strokeWidth={2}   dot={false} name="Page Views" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.trafficSources.length > 0 && (
            <div className={`${tw.card} border ${tw.border} rounded-2xl p-6`}>
              <p className={`${tw.subtext} text-xs font-bold uppercase tracking-widest mb-5`}>Traffic Sources</p>
              <div className="space-y-4">
                {data.trafficSources.map((src, i) => {
                  const pct = Math.round((src.sessions / totalSrc) * 100);
                  const col = raw.pieColors[i % raw.pieColors.length];
                  return (
                    <div key={i}>
                      <div className="flex justify-between mb-1.5">
                        <span style={{ color: raw.text, fontSize: 13 }}>{src.source}</span>
                        <span style={{ color: col, fontSize: 13, fontWeight: 700 }}>{pct}%</span>
                      </div>
                      <div style={{ height: 6, background: raw.track, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 3, transition: 'width 0.8s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {data.devices.length > 0 && (
            <div className={`${tw.card} border ${tw.border} rounded-2xl p-6`}>
              <p className={`${tw.subtext} text-xs font-bold uppercase tracking-widest mb-5`}>Devices</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data.devices} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke={raw.border} />
                  <XAxis dataKey="device" tick={{ fill: raw.subtext, fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: raw.subtext, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip raw={raw} />} />
                  <Bar dataKey="users" name="Users" radius={[5,5,0,0]}>
                    {data.devices.map((_, i) => <Cell key={i} fill={raw.barColors[i % raw.barColors.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className={`${tw.card} border ${tw.border} rounded-2xl p-6 md:p-8`}>
          <GoogleAdsMetrics
            dateRange={{ start: DATE_RANGES[selectedRange].value.start, end: DATE_RANGES[selectedRange].value.end }}
            theme={theme} themeStyles={{ ...tw, chartGrid: raw.border, accentText: tw.accentText }}
          />
        </div>

        <div className={`${tw.card} border ${tw.border} rounded-2xl p-6 md:p-8`}>
          <MetricoolMetrics
            dateRange={{ start: DATE_RANGES[selectedRange].value.start, end: DATE_RANGES[selectedRange].value.end }}
            theme={theme} themeStyles={{ ...tw, chartGrid: raw.border, accentText: tw.accentText }}
          />
        </div>

        {data.topPages.length > 0 && (
          <div className={`${tw.tableBg} border ${tw.border} rounded-2xl overflow-hidden`}>
            <div className="p-6 pb-2">
              <p className={`${tw.subtext} text-xs font-bold uppercase tracking-widest`}>Top Pages</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={`border-t ${tw.border}`}>
                    {['#','Page','Path','Views'].map(h => (
                      <th key={h} className={`${h === 'Views' ? 'text-right' : 'text-left'} py-3 px-5 text-xs font-bold uppercase tracking-wider ${tw.subtext} ${h === 'Path' ? 'hidden md:table-cell' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.topPages.map((page, i) => (
                    <tr key={i} className={`border-t ${tw.border} ${tw.tableHover} transition-colors`}>
                      <td className={`py-4 px-5 ${tw.subtext} text-sm w-10`}>{i+1}</td>
                      <td className={`py-4 px-5 ${tw.text} text-sm font-medium`}>{page.title}</td>
                      <td className={`py-4 px-5 text-xs font-mono ${tw.accentText} hidden md:table-cell`}>{page.path}</td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div className={`h-1.5 w-16 rounded-full ${tw.trackBg} hidden sm:block overflow-hidden`}>
                            <div className="h-full rounded-full" style={{ width: `${(page.views / maxPages)*100}%`, background: raw.ring1 }} />
                          </div>
                          <span className={`${tw.text} text-sm font-bold`}>{page.views.toLocaleString()}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {data.countries.length > 0 && (
          <div className={`${tw.card} border ${tw.border} rounded-2xl p-6`}>
            <p className={`${tw.subtext} text-xs font-bold uppercase tracking-widest mb-5`}>Global Audience</p>
            <WorldHeatmap countries={data.countries} theme={theme} />
          </div>
        )}

      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes modalIn {
          from { opacity: 0; transform: scale(0.94) translateY(8px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}