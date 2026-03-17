'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Users, Activity, Eye, UserPlus, Clock, TrendingDown,
  Zap, Sun, Moon, Leaf, BarChart2, Settings, X, Check,
  TrendingUp, Phone, ArrowUpRight, ArrowDownRight, Calendar,
  ChevronDown, FileText, PhoneCall, PhoneIncoming, PhoneMissed,
  Target, Award,
} from 'lucide-react';
import { GoogleAdsMetrics } from './GoogleAdsMetrics';
import { MetricoolMetrics } from './MetricoolMetrics';
import { SearchConsoleMetrics } from './SearchConsoleMetrics';
import dynamic from 'next/dynamic';
import { MOCK_GA4 } from './mockData';

function MapFallback() {
  return <p style={{ fontSize: 13, padding: 20, textAlign: 'center', opacity: 0.5 }}>Map unavailable</p>;
}

const WorldHeatmap = dynamic(
  () => import('./WorldHeatmap').then(m => m.WorldHeatmap).catch(() => MapFallback),
  { ssr: false, loading: () => <p style={{ fontSize: 13, padding: 20, textAlign: 'center', opacity: 0.5 }}>Loading map…</p> }
);

const USE_MOCK = true;
export type Theme = 'light' | 'dark' | 'forest';

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}K`;
  return n.toLocaleString();
}

function toISODate(d: Date) { return d.toISOString().split('T')[0]; }

function resolveDate(s: string): Date {
  const d = new Date();
  if (s === 'today') return d;
  if (s === 'yesterday') { d.setDate(d.getDate() - 1); return d; }
  const m = s.match(/^(\d+)daysAgo$/);
  if (m) { d.setDate(d.getDate() - parseInt(m[1])); return d; }
  return new Date(s);
}

function filterBySeries<T extends { date: string }>(ts: T[], start: string, end: string): T[] {
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

function DesktopIcon({ color }: { color: string }) {
  return (
    <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
      <rect x="2" y="3" width="28" height="19" rx="3" stroke={color} strokeWidth="2" fill={`${color}15`} />
      <path d="M10 22v4m12-4v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M7 26h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <rect x="5" y="6" width="22" height="13" rx="1.5" fill={`${color}20`} />
    </svg>
  );
}
function MobileIcon({ color }: { color: string }) {
  return (
    <svg width="24" height="32" viewBox="0 0 24 32" fill="none">
      <rect x="2" y="1" width="20" height="30" rx="4" stroke={color} strokeWidth="2" fill={`${color}15`} />
      <rect x="5" y="5" width="14" height="18" rx="1" fill={`${color}20`} />
      <circle cx="12" cy="27" r="1.5" fill={color} />
    </svg>
  );
}
function TabletIcon({ color }: { color: string }) {
  return (
    <svg width="26" height="32" viewBox="0 0 26 32" fill="none">
      <rect x="2" y="1" width="22" height="30" rx="4" stroke={color} strokeWidth="2" fill={`${color}15`} />
      <rect x="5" y="5" width="16" height="20" rx="1" fill={`${color}20`} />
      <circle cx="13" cy="28" r="1.5" fill={color} />
    </svg>
  );
}

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
  mapCountry: string | null;
  compareMode?: string;
  selectedPreset?: number | null;
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
  barColors: string[]; pieColors: string[]; legendText: string; shineColor: string;
}> = {
  light: {
    bg: '#f0f2f5', card: '#fafbfc', border: '#dde2e8',
    text: '#1a1f2e', subtext: '#6b7a8d', track: '#e8ecf0',
    ring1: '#003F27', ring2: '#f59e0b', ring3: '#ef4444', ringTrack: '#dde2e8',
    chartLine1: '#003F27', chartLine2: '#22c55e', chartLine3: '#f59e0b',
    barColors: ['#003F27', '#22c55e', '#f59e0b'],
    pieColors: ['#003F27', '#22c55e', '#f59e0b', '#3b82f6', '#a855f7', '#f97316', '#06b6d4', '#ef4444'],
    legendText: '#6b7a8d', shineColor: 'rgba(255,255,255,0.35)',
  },
  dark: {
    bg: '#13151f', card: '#1c1f2e', border: '#2c3040',
    text: '#e8ecf4', subtext: '#8a9ab8', track: '#2c3040',
    ring1: '#4ade80', ring2: '#fbbf24', ring3: '#f87171', ringTrack: '#2c3040',
    chartLine1: '#4ade80', chartLine2: '#fbbf24', chartLine3: '#60a5fa',
    barColors: ['#4ade80', '#fbbf24', '#60a5fa'],
    pieColors: ['#4ade80', '#fbbf24', '#60a5fa', '#c084fc', '#f87171', '#fb923c', '#22d3ee', '#a3e635'],
    legendText: '#8a9ab8', shineColor: 'rgba(255,255,255,0.06)',
  },
  forest: {
    bg: '#f0e8d8', card: '#faf4e8', border: '#d4b896',
    text: '#2c1a0e', subtext: '#7a5c3a', track: '#e8d5b7',
    ring1: '#003F27', ring2: '#b5832a', ring3: '#9b4a20', ringTrack: '#e8d5b7',
    chartLine1: '#003F27', chartLine2: '#b5832a', chartLine3: '#5a8fa8',
    barColors: ['#6b4226', '#b5832a', '#5a8fa8'],
    pieColors: ['#6b4226', '#b5832a', '#5a8fa8', '#6a8f6a', '#9b4a20', '#8b5a2b', '#7a5c3a', '#c8a97a'],
    legendText: '#7a5c3a', shineColor: 'rgba(255,255,255,0.25)',
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
    pillActive: 'bg-[#003F27] text-white', pillInactive: 'bg-[#e8ecf0] text-[#6b7a8d] hover:bg-[#dde2e8]',
    tableBg: 'bg-[#fafbfc]', tableHover: 'hover:bg-[#f0f2f5]', trackBg: 'bg-[#e8ecf0]',
  },
  dark: {
    bg: 'bg-[#13151f]', card: 'bg-[#1c1f2e]', border: 'border-[#2c3040]',
    text: 'text-[#e8ecf4]', subtext: 'text-[#8a9ab8]', accentText: 'text-[#4ade80]',
    headerBg: 'bg-[#13151f]/90 backdrop-blur border-b border-[#2c3040]',
    pillActive: 'bg-[#003F27] text-[#4ade80]', pillInactive: 'bg-[#2c3040] text-[#8a9ab8] hover:bg-[#353848]',
    tableBg: 'bg-[#1c1f2e]', tableHover: 'hover:bg-[#232636]', trackBg: 'bg-[#2c3040]',
  },
  forest: {
    bg: 'bg-[#f0e8d8]', card: 'bg-[#faf4e8]', border: 'border-[#d4b896]',
    text: 'text-[#2c1a0e]', subtext: 'text-[#7a5c3a]', accentText: 'text-[#003F27]',
    headerBg: 'bg-[#f0e8d8]/90 backdrop-blur border-b border-[#d4b896]',
    pillActive: 'bg-[#003F27] text-[#e8d5b7]', pillInactive: 'bg-[#e8d5b7] text-[#7a5c3a] hover:bg-[#ddc9a3]',
    tableBg: 'bg-[#faf4e8]', tableHover: 'hover:bg-[#f0e8d8]', trackBg: 'bg-[#e8d5b7]',
  },
};

const PRESET_RANGES = [
  { label: 'Today',     start: 'today',      end: 'today'      },
  { label: 'Yesterday', start: 'yesterday',  end: 'yesterday'  },
  { label: '7D',        start: '7daysAgo',   end: 'today'      },
  { label: '30D',       start: '30daysAgo',  end: 'today'      },
  { label: '90D',       start: '90daysAgo',  end: 'today'      },
  { label: '6M',        start: '180daysAgo', end: 'today'      },
  { label: '1Y',        start: '365daysAgo', end: 'today'      },
];

const COMPARE_OPTIONS = [
  { label: 'No comparison',   value: 'none'     },
  { label: 'Previous period', value: 'previous' },
  { label: 'Previous week',   value: 'week'     },
  { label: 'Previous month',  value: 'month'    },
  { label: 'Previous year',   value: 'year'     },
];

interface GA4Metrics {
  activeUsers: number; sessions: number; pageViews: number;
  avgSessionDuration: number; bounceRate: string; newUsers: number; engagementRate: string;
}
interface GA4Data {
  companyId: string; companyName: string;
  dateRange: { startDate: string; endDate: string };
  previousDateRange?: { startDate: string; endDate: string };
  metrics: GA4Metrics;
  previousMetrics?: GA4Metrics | null;
  timeSeries: Array<{
    date: string; activeUsers: number; sessions: number; pageViews: number;
    bounceRate?: number; engagementRate?: number; newUsers?: number; avgSessionDuration?: number;
    phoneCallClicks?: number; callButtonClicks?: number; callConnected?: number;
    formSubmits?: number; contactPageViews?: number; quoteRequests?: number;
  }>;
  topPages: Array<{ title: string; path: string; views: number }>;
  trafficSources: Array<{ source: string; sessions: number }>;
  devices: Array<{ device: string; users: number }>;
  countries: Array<{ country: string; users: number }>;
  regions?: Array<{ country: string; region: string; users: number }>;
}

function Spark({ data, color, uid }: { data: number[]; color: string; uid: string }) {
  if (!data || data.length < 2) return null;
  const d = data.map(v => ({ v }));
  const gid = `ga4spk-${uid.replace(/[^a-z0-9]/gi, '').toLowerCase()}`;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={d} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0}    />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${gid})`} dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function ShineCard({ children, className = '', style, shineColor, onClick }: {
  children: React.ReactNode; className?: string; style?: React.CSSProperties;
  shineColor: string; onClick?: () => void;
}) {
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [hovered, setHovered] = useState(false);
  return (
    <div className={className} style={{ position: 'relative', overflow: 'hidden', ...style }}
      onMouseMove={e => { const r = e.currentTarget.getBoundingClientRect(); setPos({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 }); }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onClick={onClick}>
      {children}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10, borderRadius: 'inherit', background: `radial-gradient(circle at ${pos.x}% ${pos.y}%, ${shineColor}, transparent 65%)`, opacity: hovered ? 1 : 0, transition: 'opacity 0.25s ease' }} />
    </div>
  );
}

function Delta({ current, previous, inverse = false }: { current: number; previous: number; inverse?: boolean }) {
  if (!previous) return null;
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  if (Math.abs(pct) < 0.1) return null;
  const isGood = inverse ? pct < 0 : pct > 0;
  const color = isGood ? '#22c55e' : '#ef4444';
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, fontWeight: 700, color }}>
      {pct > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function RingGauge({ value, label, sub, color, trackColor, pct, size = 160 }: {
  value: string; label: string; sub: string; color: string; trackColor: string; pct: number; size?: number;
}) {
  const [animated, setAnimated] = useState(false);
  const prevPctRef = useRef(0);
  useEffect(() => {
    setAnimated(false);
    const t = setTimeout(() => { setAnimated(true); prevPctRef.current = pct; }, 50);
    return () => clearTimeout(t);
  }, [pct, value]);
  const r = size * 0.38, circ = 2 * Math.PI * r;
  const dash = animated ? Math.min(pct / 100, 1) * circ : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={trackColor} strokeWidth={size * 0.055} />
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={size * 0.055}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 1s cubic-bezier(0.4,0,0.2,1)' }} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <span style={{ fontSize: size * 0.185, fontWeight: 700, color, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</span>
          <span style={{ fontSize: size * 0.075, color, fontWeight: 600, opacity: 0.8 }}>{sub}</span>
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.6 }}>{label}</span>
    </div>
  );
}

function useCountUp(target: number, duration = 1000) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) { setValue(0); return; }
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

function MetricCard({ title, value, suffix = '', icon, index, tw, raw, previousValue, inverse = false, sparkData, sparkColor }: {
  title: string; value: number; suffix?: string; icon: React.ReactNode;
  index: number; tw: typeof THEME_TW[Theme]; raw: typeof THEME_RAW[Theme];
  previousValue?: number; inverse?: boolean; sparkData?: number[]; sparkColor?: string;
}) {
  const [visible, setVisible] = useState(false);
  const count = useCountUp(value);
  useEffect(() => { const t = setTimeout(() => setVisible(true), index * 75); return () => clearTimeout(t); }, [index]);
  const uid   = `${title.replace(/\s+/g, '').toLowerCase()}-${index}`;
  const color = sparkColor || raw.ring1;
  return (
    <ShineCard shineColor={raw.shineColor}
      className={`${tw.card} border ${tw.border} rounded-2xl cursor-default group overflow-hidden`}
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(14px)', transition: 'opacity 0.4s ease, transform 0.3s ease' }}
    >
      <div
        onMouseEnter={e => { const p = e.currentTarget.parentElement as HTMLDivElement; p.style.transform = 'translateY(-2px)'; p.style.boxShadow = '0 8px 24px rgba(0,0,0,0.1)'; }}
        onMouseLeave={e => { const p = e.currentTarget.parentElement as HTMLDivElement; p.style.transform = 'translateY(0)'; p.style.boxShadow = 'none'; }}
        style={{ padding: '12px 14px 8px', position: 'relative', zIndex: 1 }}
      >
        <div className="flex items-start justify-between mb-1.5">
          <div className={`${tw.subtext} text-xs font-semibold uppercase tracking-widest leading-tight`} style={{ fontSize: 10 }}>{title}</div>
          <div style={{ color, opacity: 0.5 }} className="group-hover:opacity-100 transition-opacity shrink-0 ml-1">{icon}</div>
        </div>
        <div className={`${tw.text} font-bold tracking-tight`} style={{ fontSize: 'clamp(0.95rem, 4vw, 1.6rem)', wordBreak: 'break-all' }}>
          {fmt(count)}{suffix}
        </div>
        {previousValue !== undefined && previousValue > 0 && (
          <div className="flex items-center gap-1.5 mt-1">
            <Delta current={value} previous={previousValue} inverse={inverse} />
            <span className={`${tw.subtext}`} style={{ fontSize: 9 }}>vs prev.</span>
          </div>
        )}
      </div>
      {sparkData && sparkData.length > 1 && (
        <div style={{ height: 40, position: 'relative', zIndex: 1 }}>
          <Spark data={sparkData} color={color} uid={uid} />
        </div>
      )}
    </ShineCard>
  );
}

function CustomizeModal({ selected, onChange, onClose, tw, raw }: {
  selected: [HeroMetricId, HeroMetricId, HeroMetricId];
  onChange: (m: [HeroMetricId, HeroMetricId, HeroMetricId]) => void;
  onClose: () => void; tw: typeof THEME_TW[Theme]; raw: typeof THEME_RAW[Theme];
}) {
  const [draft, setDraft]     = useState<[HeroMetricId, HeroMetricId, HeroMetricId]>([...selected]);
  const [activeSlot, setSlot] = useState<0 | 1 | 2>(0);
  const slotColors            = [raw.ring1, raw.ring2, raw.ring3];
  const slotLabels            = ['Slot 1', 'Slot 2', 'Slot 3'];

  function pickMetric(id: HeroMetricId) {
    const next: [HeroMetricId, HeroMetricId, HeroMetricId] = [...draft];
    const ex = next.indexOf(id) as -1 | 0 | 1 | 2;
    if (ex !== -1 && ex !== activeSlot) next[ex] = next[activeSlot];
    next[activeSlot] = id;
    setDraft(next);
    setSlot(s => (s < 2 ? (s + 1) as 0 | 1 | 2 : s));
  }

  return (
    <div onClick={e => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className={`${tw.card} border ${tw.border} rounded-2xl shadow-2xl w-full max-w-sm`}
        style={{ animation: 'modalIn 0.22s cubic-bezier(0.34,1.56,0.64,1)', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 pb-4">
          <div>
            <h3 className={`${tw.text} font-bold`} style={{ fontSize: 15 }}>Customize Hero Metrics</h3>
            <p className={`${tw.subtext}`} style={{ fontSize: 12, marginTop: 2 }}>Select a slot, then choose its metric</p>
          </div>
          <button onClick={onClose} className={`${tw.pillInactive} p-1.5 rounded-lg`}><X size={15} /></button>
        </div>
        <div style={{ padding: '0 20px 16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {([0, 1, 2] as const).map(s => {
            const color = slotColors[s]; const metric = ALL_HERO_METRICS.find(m => m.id === draft[s])!; const isActive = activeSlot === s;
            return (
              <button key={s} onClick={() => setSlot(s)} style={{ padding: '10px 8px', borderRadius: 10, border: `2px solid ${isActive ? color : raw.border}`, background: isActive ? `${color}12` : 'transparent', cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s', outline: 'none' }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: isActive ? color : raw.subtext, marginBottom: 5 }}>{slotLabels[s]}</div>
                <div style={{ width: 20, height: 3, borderRadius: 2, background: color, margin: '0 auto 6px', opacity: isActive ? 1 : 0.4 }} />
                <div style={{ fontSize: 11, fontWeight: 700, color: isActive ? color : raw.text, lineHeight: 1.2 }}>{metric.label}</div>
                <div style={{ fontSize: 10, color: raw.subtext, marginTop: 2 }}>{metric.sub}</div>
              </button>
            );
          })}
        </div>
        <div className={`border-t ${tw.border}`} style={{ margin: '0 20px' }} />
        <div style={{ padding: '12px 20px 8px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: raw.subtext, marginBottom: 10 }}>Assign to {slotLabels[activeSlot]}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {ALL_HERO_METRICS.map(metric => {
              const as2 = draft.indexOf(metric.id as HeroMetricId) as -1 | 0 | 1 | 2;
              const isCur = as2 === activeSlot; const isOth = as2 !== -1 && as2 !== activeSlot;
              const sc = as2 !== -1 ? slotColors[as2] : undefined;
              return (
                <button key={metric.id} onClick={() => pickMetric(metric.id as HeroMetricId)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, border: `1.5px solid ${isCur ? slotColors[activeSlot] : 'transparent'}`, background: isCur ? `${slotColors[activeSlot]}12` : 'transparent', cursor: 'pointer', textAlign: 'left', outline: 'none', transition: 'all 0.12s' }}
                  onMouseEnter={e => { if (!isCur) (e.currentTarget as HTMLButtonElement).style.background = `${raw.border}60`; }}
                  onMouseLeave={e => { if (!isCur) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isCur ? slotColors[activeSlot] : isOth ? `${sc}20` : raw.track, border: `1.5px solid ${isCur ? slotColors[activeSlot] : isOth ? sc! : raw.border}`, transition: 'all 0.12s' }}>
                    {isCur ? <Check size={12} color="white" strokeWidth={3} /> : isOth ? <span style={{ fontSize: 8, fontWeight: 800, color: sc }}>{as2 + 1}</span> : null}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: raw.text }}>{metric.label}</div>
                    <div style={{ fontSize: 11, color: raw.subtext }}>{metric.sub}</div>
                  </div>
                  {isOth && <span style={{ fontSize: 9, fontWeight: 700, color: sc, background: `${sc}18`, padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>in slot {as2 + 1}</span>}
                </button>
              );
            })}
          </div>
        </div>
        <div className={`border-t ${tw.border}`} style={{ padding: '14px 20px', display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '8px', borderRadius: 9, border: `1px solid ${raw.border}`, background: 'transparent', color: raw.subtext, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
          <button onClick={() => { onChange(draft); onClose(); }} className={tw.pillActive} style={{ flex: 2, padding: '8px', borderRadius: 9, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Apply</button>
        </div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label, raw }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: raw.card, border: `1px solid ${raw.border}`, borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)' }}>
      <p style={{ color: raw.subtext, fontSize: 11, marginBottom: 6, fontWeight: 600 }}>{label}</p>
      {payload.map((p: any, i: number) => <p key={i} style={{ color: p.color, fontSize: 12, fontWeight: 700, margin: '2px 0' }}>{p.name}: {p.value?.toLocaleString()}</p>)}
    </div>
  );
};

function DateRangePicker({ startDate, endDate, compareMode, onApply, tw, raw, onClose }: {
  startDate: string; endDate: string; compareMode: string;
  onApply: (start: string, end: string, compare: string) => void;
  tw: typeof THEME_TW[Theme]; raw: typeof THEME_RAW[Theme]; onClose: () => void;
}) {
  const [s, setS] = useState(startDate || toISODate(new Date(Date.now() - 30 * 86400000)));
  const [e, setE] = useState(endDate || toISODate(new Date()));
  const [cmp, setCmp] = useState(compareMode || 'previous');
  const today = toISODate(new Date());
  const inp = { background: raw.bg, border: `1px solid ${raw.border}`, borderRadius: 8, padding: '7px 12px', color: raw.text, fontSize: 13, outline: 'none', width: '100%', colorScheme: 'inherit' } as React.CSSProperties;
  return (
    <div className={`${tw.card} border ${tw.border}`} style={{ position: 'fixed', bottom: 'auto', right: 16, borderRadius: 16, padding: 20, boxShadow: '0 16px 48px rgba(0,0,0,0.28)', zIndex: 300, width: 'min(320px, calc(100vw - 32px))' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: raw.ring1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calendar size={14} color="white" /></div>
          <div><p style={{ color: raw.text, fontSize: 13, fontWeight: 700, margin: 0 }}>Custom Range</p><p style={{ color: raw.subtext, fontSize: 10, margin: 0 }}>Pick dates & compare</p></div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: raw.subtext, padding: 4 }}><X size={16} /></button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div><label style={{ color: raw.subtext, fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Start date</label><input type="date" value={s} max={e || today} onChange={ev => setS(ev.target.value)} style={inp} /></div>
        <div><label style={{ color: raw.subtext, fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>End date</label><input type="date" value={e} min={s} max={today} onChange={ev => setE(ev.target.value)} style={inp} /></div>
        <div style={{ height: 1, background: raw.border }} />
        <div>
          <label style={{ color: raw.subtext, fontSize: 11, fontWeight: 600, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Compare to</label>
          <div style={{ position: 'relative' }}>
            <select value={cmp} onChange={ev => setCmp(ev.target.value)} style={{ ...inp, cursor: 'pointer', appearance: 'none' as any, WebkitAppearance: 'none' }}>
              {COMPARE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: raw.subtext, pointerEvents: 'none' }} />
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button onClick={onClose} style={{ flex: 1, padding: '8px', borderRadius: 10, border: `1px solid ${raw.border}`, background: 'transparent', color: raw.subtext, fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
        <button onClick={() => { if (s && e) { onApply(s, e, cmp); onClose(); } }} disabled={!s || !e}
          style={{ flex: 2, padding: '8px', borderRadius: 10, border: 'none', background: raw.ring1, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', opacity: s && e ? 1 : 0.5 }}>Apply Range</button>
      </div>
    </div>
  );
}

function PageRow({ page, i, pct, sharePct, color, visible, raw }: { page: { title: string; path: string; views: number }; i: number; pct: number; sharePct: number; color: string; visible: boolean; raw: typeof THEME_RAW[Theme] }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ padding: '10px 24px', background: hovered ? `${raw.ring1}06` : 'transparent', transition: 'background 0.15s', opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(-16px)', transitionDelay: `${i * 60}ms` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, background: `${color}18`, border: `1.5px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontSize: 12, fontWeight: 800, transform: hovered ? 'scale(1.1)' : 'scale(1)', transition: 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)' }}>{i + 1}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: raw.text, fontSize: 13, fontWeight: 600, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page.title}</p>
          <p style={{ color: raw.subtext, fontSize: 11, fontFamily: 'monospace', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page.path}</p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ color, fontSize: 13, fontWeight: 700, margin: 0 }}>{fmt(page.views)}</p>
          <p style={{ color: raw.subtext, fontSize: 10, margin: '1px 0 0' }}>{sharePct}% share</p>
        </div>
      </div>
      <div style={{ marginTop: 8, height: 3, background: raw.track, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: hovered ? `${pct}%` : `${pct * 0.85}%`, background: `linear-gradient(90deg, ${color}, ${color}88)`, borderRadius: 2, transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)' }} />
      </div>
    </div>
  );
}

function TopPagesSection({ pages, tw, raw }: { pages: Array<{ title: string; path: string; views: number }>; tw: typeof THEME_TW[Theme]; raw: typeof THEME_RAW[Theme] }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 100); return () => clearTimeout(t); }, []);
  const max = Math.max(...pages.map(p => p.views), 1);
  const total = pages.reduce((s, p) => s + p.views, 0);
  const rankColors = [raw.ring1, raw.ring2, raw.ring3, raw.subtext, raw.subtext];
  return (
    <div className={`${tw.card} border ${tw.border} rounded-2xl overflow-hidden`}>
      <div style={{ padding: '20px 24px 0' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><FileText size={14} style={{ color: raw.ring1 }} /><p className={`${tw.subtext} text-xs font-bold uppercase tracking-widest`}>Top Pages</p></div>
          <p className={`${tw.subtext} text-xs`}>{total.toLocaleString()} total views</p>
        </div>
      </div>
      <div style={{ padding: '16px 0 8px' }}>
        {pages.map((page, i) => <PageRow key={i} page={page} i={i} pct={(page.views / max) * 100} sharePct={Math.round((page.views / total) * 100)} color={rankColors[Math.min(i, rankColors.length - 1)]} visible={visible} raw={raw} />)}
      </div>
    </div>
  );
}

function CallTrackingSection({ filteredTs, tw, raw }: {
  filteredTs: GA4Data['timeSeries']; tw: typeof THEME_TW[Theme]; raw: typeof THEME_RAW[Theme];
}) {
  const totalCallClicks   = filteredTs.reduce((s, d) => s + (d.phoneCallClicks ?? 0), 0);
  const totalButtonClicks = filteredTs.reduce((s, d) => s + (d.callButtonClicks ?? 0), 0);
  const totalConnected    = filteredTs.reduce((s, d) => s + (d.callConnected ?? 0), 0);
  const totalSessions     = filteredTs.reduce((s, d) => s + d.sessions, 0);
  const callRate          = totalSessions > 0 ? ((totalCallClicks / totalSessions) * 100).toFixed(2) : '0';
  const connectRate       = totalCallClicks > 0 ? Math.round((totalConnected / totalCallClicks) * 100) : 0;

  const hasData = totalCallClicks > 0 || totalButtonClicks > 0;

  const callSparkClicks  = filteredTs.map(d => d.phoneCallClicks ?? 0);
  const callSparkConnect = filteredTs.map(d => d.callConnected ?? 0);

  const funnelSteps = [
    { label: 'Button Clicks',  value: totalButtonClicks, color: raw.chartLine3, icon: <Phone size={13} />,         pct: 100 },
    { label: 'Tap to Call',    value: totalCallClicks,   color: raw.chartLine2, icon: <PhoneCall size={13} />,     pct: totalButtonClicks > 0 ? Math.round((totalCallClicks / totalButtonClicks) * 100) : 0 },
    { label: 'Connected',      value: totalConnected,    color: raw.ring1,      icon: <PhoneIncoming size={13} />, pct: totalButtonClicks > 0 ? Math.round((totalConnected / totalButtonClicks) * 100) : 0 },
  ];

  if (!hasData) return (
    <ShineCard shineColor={raw.shineColor} className={`${tw.card} border ${tw.border} rounded-2xl p-6`}>
      <div className="flex items-start gap-4">
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${raw.ring1}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Phone size={18} style={{ color: raw.ring1 }} />
        </div>
        <div style={{ flex: 1 }}>
          <p className={`${tw.text} font-bold mb-1`} style={{ fontSize: 14 }}>Call Tracking</p>
          <p className={`${tw.subtext} text-sm leading-relaxed mb-4`} style={{ maxWidth: 480 }}>
            Once enabled, this section shows how many visitors called your business directly from the website — including how many calls were answered. It&apos;s one of the clearest signals of real customer interest.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {[
              { icon: <PhoneCall size={14} />, label: 'Calls initiated',   desc: 'How many people tapped your phone number' },
              { icon: <PhoneIncoming size={14} />, label: 'Calls connected', desc: 'How many actually reached you' },
              { icon: <TrendingUp size={14} />, label: 'Call rate',          desc: 'What % of website visitors called' },
            ].map((item, i) => (
              <div key={i} style={{ background: `${raw.ring1}08`, borderRadius: 10, padding: '12px 14px', border: `1px solid ${raw.ring1}18` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: raw.ring1, marginBottom: 4 }}>{item.icon}<span style={{ fontSize: 11, fontWeight: 700 }}>{item.label}</span></div>
                <p className={`${tw.subtext}`} style={{ fontSize: 11, lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ background: `${raw.ring1}08`, borderRadius: 10, padding: '12px 16px', border: `1px solid ${raw.ring1}15`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: raw.ring2, flexShrink: 0 }} />
            <p className={`${tw.subtext} text-xs leading-relaxed`}>
              <strong className={tw.text}>Not set up yet.</strong> Ask your account manager to enable call tracking — it takes under 30 minutes and requires no changes to your website.
            </p>
          </div>
        </div>
      </div>
    </ShineCard>
  );

  return (
    <ShineCard shineColor={raw.shineColor} className={`${tw.card} border ${tw.border} rounded-2xl p-5 md:p-6`}>
      <div className="flex items-center gap-2 mb-5">
        <Phone size={14} style={{ color: raw.ring1 }} />
        <p className={`${tw.subtext} text-xs font-bold uppercase tracking-widest`}>Call Tracking</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <p className={`${tw.subtext} text-xs font-semibold uppercase tracking-widest mb-4`} style={{ fontSize: 9 }}>Call Funnel</p>
          <div className="space-y-3">
            {funnelSteps.map((step, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2">
                    <span style={{ color: step.color }}>{step.icon}</span>
                    <span className={`${tw.text} text-sm`}>{step.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{ color: step.color, fontSize: 13, fontWeight: 700 }}>{fmt(step.value)}</span>
                    {i > 0 && <span style={{ fontSize: 10, color: raw.subtext, background: `${step.color}15`, borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>{step.pct}%</span>}
                  </div>
                </div>
                <div style={{ height: 5, background: raw.track, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${step.pct}%`, background: step.color, borderRadius: 3, transition: 'width 0.9s ease' }} />
                </div>
              </div>
            ))}
          </div>
          <div className={`${tw.trackBg} rounded-xl p-3 mt-4 flex gap-4`}>
            <div>
              <p className={`${tw.subtext}`} style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Call Rate</p>
              <p style={{ color: raw.ring1, fontWeight: 800, fontSize: 18, lineHeight: 1.2 }}>{callRate}%</p>
              <p className={`${tw.subtext} text-xs`}>of sessions</p>
            </div>
            <div style={{ width: 1, background: raw.border }} />
            <div>
              <p className={`${tw.subtext}`} style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>Connect Rate</p>
              <p style={{ color: raw.ring1, fontWeight: 800, fontSize: 18, lineHeight: 1.2 }}>{connectRate}%</p>
              <p className={`${tw.subtext} text-xs`}>of tap-to-calls</p>
            </div>
          </div>
        </div>

        <div>
          <p className={`${tw.subtext} text-xs font-semibold uppercase tracking-widest mb-4`} style={{ fontSize: 9 }}>Call Volume Over Time</p>
          <div style={{ height: 130 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredTs.map(d => ({ date: d.date, clicks: d.phoneCallClicks ?? 0, connected: d.callConnected ?? 0 }))} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="callg1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={raw.chartLine3} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={raw.chartLine3} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="callg2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={raw.ring1} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={raw.ring1} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={raw.border} />
                <XAxis dataKey="date" tick={{ fill: raw.subtext, fontSize: 8 }} axisLine={false} tickLine={false} interval="preserveStartEnd"
                  tickFormatter={v => v?.length === 8 ? `${v.slice(4,6)}/${v.slice(6,8)}` : v} />
                <YAxis tick={{ fill: raw.subtext, fontSize: 8 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip content={<CustomTooltip raw={raw} />} />
                <Area type="monotone" dataKey="clicks"    stroke={raw.chartLine3} strokeWidth={1.5} fill="url(#callg1)" name="Tap to Call" dot={false} />
                <Area type="monotone" dataKey="connected" stroke={raw.ring1}      strokeWidth={1.5} fill="url(#callg2)" name="Connected"   dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className={`${tw.subtext} text-xs mt-3 leading-relaxed`} style={{ fontSize: 10 }}>
            Recorded each time a visitor taps your phone number or a call button on the website. Connected calls are those where the phone app successfully opened.
          </p>
        </div>
      </div>
    </ShineCard>
  );
}

function QualifiedLeadsSection({ filteredTs, tw, raw }: {
  filteredTs: GA4Data['timeSeries']; tw: typeof THEME_TW[Theme]; raw: typeof THEME_RAW[Theme];
}) {
  const totalSessions    = filteredTs.reduce((s, d) => s + d.sessions, 0);
  const totalFormSubmits = filteredTs.reduce((s, d) => s + (d.formSubmits ?? 0), 0);
  const totalQuotes      = filteredTs.reduce((s, d) => s + (d.quoteRequests ?? 0), 0);
  const totalContact     = filteredTs.reduce((s, d) => s + (d.contactPageViews ?? 0), 0);
  const totalCalls       = filteredTs.reduce((s, d) => s + (d.phoneCallClicks ?? 0), 0);

  const qualifiedLeads   = totalFormSubmits + totalQuotes + totalCalls;
  const qualRate         = totalSessions > 0 ? ((qualifiedLeads / totalSessions) * 100).toFixed(2) : '0';

  const formSparkData    = filteredTs.map(d => d.formSubmits ?? 0);
  const quoteSparkData   = filteredTs.map(d => d.quoteRequests ?? 0);

  const sources = [
    { label: 'Form Submissions', value: totalFormSubmits, color: raw.ring1,      pct: qualifiedLeads > 0 ? Math.round((totalFormSubmits / qualifiedLeads) * 100) : 0, spark: formSparkData },
    { label: 'Quote Requests',   value: totalQuotes,      color: raw.ring2,      pct: qualifiedLeads > 0 ? Math.round((totalQuotes / qualifiedLeads) * 100) : 0,      spark: quoteSparkData },
    { label: 'Phone Call Taps',  value: totalCalls,       color: raw.chartLine2, pct: qualifiedLeads > 0 ? Math.round((totalCalls / qualifiedLeads) * 100) : 0,       spark: filteredTs.map(d => d.phoneCallClicks ?? 0) },
  ];

  const hasData = qualifiedLeads > 0;

  if (!hasData) return (
    <ShineCard shineColor={raw.shineColor} className={`${tw.card} border ${tw.border} rounded-2xl p-6`}>
      <div className="flex items-start gap-4">
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${raw.ring1}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Target size={18} style={{ color: raw.ring1 }} />
        </div>
        <div style={{ flex: 1 }}>
          <p className={`${tw.text} font-bold mb-1`} style={{ fontSize: 14 }}>Qualified Leads</p>
          <p className={`${tw.subtext} text-sm leading-relaxed mb-4`} style={{ maxWidth: 480 }}>
            Once enabled, this section counts the visitors who took a meaningful action — submitted a form, requested a quote, or called — and shows what percentage of your overall website traffic they represent.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Form submissions',  desc: 'Contact and enquiry forms completed' },
              { label: 'Quote requests',    desc: 'Visitors who asked for a quote or estimate' },
              { label: 'Phone call taps',   desc: 'Visitors who tapped to call from the site' },
            ].map((item, i) => (
              <div key={i} style={{ background: `${raw.ring1}08`, borderRadius: 10, padding: '12px 14px', border: `1px solid ${raw.ring1}18` }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: raw.ring1, marginBottom: 4 }}>{item.label}</p>
                <p className={`${tw.subtext}`} style={{ fontSize: 11, lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ background: `${raw.ring1}08`, borderRadius: 10, padding: '12px 16px', border: `1px solid ${raw.ring1}15`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: raw.ring2, flexShrink: 0 }} />
            <p className={`${tw.subtext} text-xs leading-relaxed`}>
              <strong className={tw.text}>Not set up yet.</strong> Ask your account manager to enable lead tracking — they&apos;ll handle the configuration, no website changes needed.
            </p>
          </div>
        </div>
      </div>
    </ShineCard>
  );

  return (
    <ShineCard shineColor={raw.shineColor} className={`${tw.card} border ${tw.border} rounded-2xl p-5 md:p-6`}>
      <div className="flex items-center gap-2 mb-5">
        <Target size={14} style={{ color: raw.ring1 }} />
        <p className={`${tw.subtext} text-xs font-bold uppercase tracking-widest`}>Qualified Leads</p>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 10, color: raw.subtext, background: `${raw.ring1}12`, borderRadius: 5, padding: '2px 8px', fontWeight: 600 }}>
              Website activity
            </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 'clamp(2rem, 5vw, 2.8rem)', fontWeight: 800, letterSpacing: '-0.04em', color: raw.text, lineHeight: 1 }}>{fmt(qualifiedLeads)}</span>
            <span className={`${tw.subtext} text-sm`}>qualified leads</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: raw.ring1 }}>{qualRate}%</span>
            <span className={`${tw.subtext} text-xs`}>session-to-lead rate</span>
            <div style={{ flex: 1, height: 3, background: raw.track, borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(parseFloat(qualRate) * 10, 100)}%`, background: raw.ring1, borderRadius: 2, transition: 'width 1s ease' }} />
            </div>
          </div>

          <div className="space-y-4">
            {sources.map(src => (
              <div key={src.label}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className={`${tw.text} text-sm`}>{src.label}</span>
                  <div className="flex items-center gap-2">
                    <span style={{ color: src.color, fontSize: 13, fontWeight: 700 }}>{fmt(src.value)}</span>
                    <span style={{ fontSize: 10, color: raw.subtext, background: `${src.color}15`, borderRadius: 4, padding: '1px 5px', fontWeight: 600 }}>{src.pct}%</span>
                  </div>
                </div>
                <div style={{ height: 5, background: raw.track, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${src.pct}%`, background: src.color, borderRadius: 3, transition: 'width 0.9s ease' }} />
                </div>
              </div>
            ))}
          </div>

          <div className={`${tw.trackBg} rounded-xl p-3 mt-4`}>
            <p className={`${tw.subtext} text-xs`} style={{ fontSize: 10, lineHeight: 1.6 }}>
              <strong>How we count leads:</strong> We count anyone who submitted a form, requested a quote, or tapped to call — actions that signal genuine intent to buy. General browsing like visiting the contact page ({fmt(totalContact)} visits this period) is tracked separately but not included.
            </p>
          </div>
        </div>

        <div>
          <p className={`${tw.subtext} text-xs font-semibold uppercase tracking-widest mb-4`} style={{ fontSize: 9 }}>Lead Volume Over Time</p>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={filteredTs.map(d => ({
                  date: d.date,
                  forms:  d.formSubmits ?? 0,
                  quotes: d.quoteRequests ?? 0,
                  calls:  d.phoneCallClicks ?? 0,
                }))}
                margin={{ top: 2, right: 0, left: 0, bottom: 0 }}
              >
                <defs>
                  {[['qlg1', raw.ring1], ['qlg2', raw.ring2], ['qlg3', raw.chartLine2]].map(([id, color]) => (
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                      <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={raw.border} />
                <XAxis dataKey="date" tick={{ fill: raw.subtext, fontSize: 8 }} axisLine={false} tickLine={false} interval="preserveStartEnd"
                  tickFormatter={v => v?.length === 8 ? `${v.slice(4,6)}/${v.slice(6,8)}` : v} />
                <YAxis tick={{ fill: raw.subtext, fontSize: 8 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip content={<CustomTooltip raw={raw} />} />
                <Area type="monotone" dataKey="forms"  stroke={raw.ring1}      strokeWidth={1.5} fill="url(#qlg1)" name="Forms"  dot={false} />
                <Area type="monotone" dataKey="quotes" stroke={raw.ring2}      strokeWidth={1.5} fill="url(#qlg2)" name="Quotes" dot={false} />
                <Area type="monotone" dataKey="calls"  stroke={raw.chartLine2} strokeWidth={1.5} fill="url(#qlg3)" name="Calls"  dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </ShineCard>
  );
}

export function GA4Dashboard() {
  const [data, setData]       = useState<GA4Data | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const [selectedPreset, setSelectedPreset] = useState<number | null>(3);
  const [customStart, setCustomStart]       = useState('');
  const [customEnd, setCustomEnd]           = useState('');
  const [compareMode, setCompareMode]       = useState('previous');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [theme, setTheme]               = useState<Theme>('light');
  const [heroMetrics, setHeroMetrics]   = useState<[HeroMetricId, HeroMetricId, HeroMetricId]>(DEFAULT_HERO);
  const [showPicker, setShowPicker]     = useState(false);
  const [mapCountry, setMapCountry]     = useState<string | null>(null);
  const [saveStatus, setSaveStatus]     = useState<'idle' | 'saved' | 'error'>('idle');

  const saveTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchParams = useSearchParams();
  const tw  = THEME_TW[theme];
  const raw = THEME_RAW[theme];
  const token = searchParams.get('token') ?? '';

  const activeStart = selectedPreset !== null ? PRESET_RANGES[selectedPreset].start : customStart;
  const activeEnd   = selectedPreset !== null ? PRESET_RANGES[selectedPreset].end   : customEnd;
  const activeLabel = selectedPreset !== null ? PRESET_RANGES[selectedPreset].label : `${customStart} → ${customEnd}`;

  useEffect(() => {
    try {
      const local = localStorage.getItem('dashboard-prefs');
      if (local) {
        const p: DashboardPreferences = JSON.parse(local);
        if (p.theme && THEME_TW[p.theme]) setTheme(p.theme);
        if (Array.isArray(p.heroMetrics) && p.heroMetrics.length === 3) setHeroMetrics(p.heroMetrics as any);
        if (p.mapCountry !== undefined) setMapCountry(p.mapCountry);
        if (p.compareMode) setCompareMode(p.compareMode);
        if (p.selectedPreset !== undefined) setSelectedPreset(p.selectedPreset ?? 3);
      }
    } catch {}
    if (!USE_MOCK && token) {
      fetch(`/api/preferences?token=${token}`)
        .then(r => r.json())
        .then(({ preferences: p }) => {
          if (!p) return;
          if (p.theme && THEME_TW[p.theme as Theme]) setTheme(p.theme as Theme);
          if (Array.isArray(p.heroMetrics) && p.heroMetrics.length === 3) setHeroMetrics(p.heroMetrics as any);
          if (p.mapCountry !== undefined) setMapCountry(p.mapCountry ?? null);
          if (p.compareMode) setCompareMode(p.compareMode);
          if (p.selectedPreset !== undefined) setSelectedPreset(p.selectedPreset ?? 3);
          localStorage.setItem('dashboard-prefs', JSON.stringify(p));
        })
        .catch(() => {});
    }
  }, [token]);

  const savePreferences = useCallback((prefs: DashboardPreferences) => {
    localStorage.setItem('dashboard-prefs', JSON.stringify(prefs));
    if (USE_MOCK || !token) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const existing = await fetch(`/api/preferences?token=${token}`)
          .then(r => r.json()).then(d => d.preferences || {}).catch(() => ({}));
        await fetch(`/api/preferences?token=${token}`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...existing, ...prefs }),
        });
        setSaveStatus('saved');
      } catch { setSaveStatus('error'); }
      finally { setTimeout(() => setSaveStatus('idle'), 3000); }
    }, 800);
  }, [token]);

  const changeTheme       = (th: Theme) => { setTheme(th); savePreferences({ theme: th, heroMetrics, mapCountry, compareMode, selectedPreset }); };
  const changeHeroMetrics = (m: [HeroMetricId, HeroMetricId, HeroMetricId]) => { setHeroMetrics(m); savePreferences({ theme, heroMetrics: m, mapCountry, compareMode, selectedPreset }); };
  const changeMapCountry  = (c: string | null) => { setMapCountry(c); savePreferences({ theme, heroMetrics, mapCountry: c, compareMode, selectedPreset }); };

  useEffect(() => {
    async function fetchMetrics() {
      if (!activeStart || !activeEnd) return;
      if (!token && !USE_MOCK) { setError('NO_TOKEN'); setLoading(false); return; }
      setLoading(true); setError(null);
      try {
        if (USE_MOCK) { await new Promise(r => setTimeout(r, 600)); setData(MOCK_GA4 as any); return; }
        const res = await fetch(`/api/ga4/metrics?token=${token}&startDate=${activeStart}&endDate=${activeEnd}&compareMode=${compareMode}`);
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed'); }
        setData(await res.json());
      } catch (err: any) { setError(err.message); }
      finally { setLoading(false); }
    }
    fetchMetrics();
  }, [token, activeStart, activeEnd, compareMode]);

  if (loading) return (
    <div className={`min-h-screen ${tw.bg} flex items-center justify-center`}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: `${raw.ring1}30` }} />
          <div className="absolute inset-0 rounded-full animate-spin" style={{ border: `2px solid ${raw.ring1}`, borderTopColor: 'transparent' }} />
        </div>
        <p className={`${tw.subtext} text-sm`}>Loading analytics…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className={`min-h-screen ${tw.bg} flex items-center justify-center p-6`}>
      <div className={`${tw.card} border ${tw.border} rounded-2xl p-10 max-w-md w-full text-center shadow-lg`}>
        {error === 'NO_TOKEN' ? (
          <>
            <div style={{ marginBottom: 12 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={raw.ring1} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <p className={`${tw.text} font-bold text-lg mb-2`}>Access required</p>
            <p className={`${tw.subtext} text-sm leading-relaxed`}>This dashboard can only be accessed through your personalised portal link.</p>
          </>
        ) : (
          <><div className="text-red-400 text-4xl mb-3">⚠</div><p className={`${tw.text} font-semibold mb-1`}>Failed to load analytics</p><p className={`${tw.subtext} text-sm`}>{error}</p></>
        )}
      </div>
    </div>
  );

  if (!data?.metrics) return <div className={`min-h-screen ${tw.bg} flex items-center justify-center`}><p className={tw.subtext}>No data available</p></div>;

  const m    = data.metrics;
  const prev = data.previousMetrics;

  const filteredTs = filterBySeries(data.timeSeries, activeStart, activeEnd);

  const ts = filteredTs.map(d => ({
    ...d,
    date: d.date?.length === 8 ? `${d.date.substring(4,6)}/${d.date.substring(6,8)}` : d.date,
  }));

  const dm = filteredTs.length > 0 ? {
    activeUsers:        filteredTs.reduce((s, d) => s + d.activeUsers, 0),
    sessions:           filteredTs.reduce((s, d) => s + d.sessions, 0),
    pageViews:          filteredTs.reduce((s, d) => s + d.pageViews, 0),
    newUsers:           filteredTs.reduce((s, d) => s + (d.newUsers ?? 0), 0),
    bounceRate:         String((filteredTs.reduce((s, d) => s + (d.bounceRate ?? parseFloat(m.bounceRate)), 0) / filteredTs.length).toFixed(1)),
    engagementRate:     String((filteredTs.reduce((s, d) => s + (d.engagementRate ?? parseFloat(m.engagementRate)), 0) / filteredTs.length).toFixed(1)),
    avgSessionDuration: Math.round(filteredTs.reduce((s, d) => s + (d.avgSessionDuration ?? m.avgSessionDuration), 0) / filteredTs.length),
  } : m;

  const ga4Spark = {
    activeUsers:    filteredTs.map(d => d.activeUsers ?? 0),
    sessions:       filteredTs.map(d => d.sessions ?? 0),
    pageViews:      filteredTs.map(d => d.pageViews ?? 0),
    newUsers:       filteredTs.map(d => d.newUsers ?? 0),
    bounceRate:     filteredTs.map(d => d.bounceRate ?? 0),
    engagementRate: filteredTs.map(d => d.engagementRate ?? 0),
    avgSession:     filteredTs.map(d => d.avgSessionDuration ?? 0),
  };

  const totalSrc = data.trafficSources.reduce((s, r) => s + r.sessions, 0);
  const newPct   = dm.sessions > 0 ? Math.round((dm.newUsers / dm.sessions) * 100) : 0;
  const ringColors = [raw.ring1, raw.ring2, raw.ring3];
  const heroSet  = new Set(heroMetrics);
  const prevLabel = data.previousDateRange ? `${data.previousDateRange.startDate} → ${data.previousDateRange.endDate}` : 'previous period';
  const compareModeLabel = COMPARE_OPTIONS.find(o => o.value === compareMode)?.label ?? '';

  const HERO_VALUES: Record<HeroMetricId, { value: string; sub: string; pct: number }> = {
    engagementRate: { value: `${parseFloat(dm.engagementRate).toFixed(0)}%`, sub: 'of sessions',    pct: parseFloat(dm.engagementRate) },
    bounceRate:     { value: `${parseFloat(dm.bounceRate).toFixed(0)}%`,     sub: 'leaving early',  pct: parseFloat(dm.bounceRate) },
    activeUsers:    { value: fmt(dm.activeUsers),                             sub: `${newPct}% new`, pct: Math.min((dm.activeUsers / Math.max(dm.sessions, 1)) * 100, 100) },
    sessions:       { value: fmt(dm.sessions),                                sub: 'total',          pct: Math.min((dm.sessions / Math.max(dm.pageViews, 1)) * 100, 100) },
    pageViews:      { value: fmt(dm.pageViews),                               sub: 'total',          pct: Math.min((dm.pageViews / 20000) * 100, 100) },
    newUsers:       { value: fmt(dm.newUsers),                                sub: 'first visit',    pct: Math.min((dm.newUsers / Math.max(dm.activeUsers, 1)) * 100, 100) },
    avgSession:     { value: `${dm.avgSessionDuration}s`,                     sub: 'per session',    pct: Math.min((dm.avgSessionDuration / 300) * 100, 100) },
  };

  const CARD_METRICS = [
    { id: 'activeUsers',    title: 'Active Users',  value: dm.activeUsers,                          icon: <Users size={16}/>,        prevValue: prev?.activeUsers,                                     sparkData: ga4Spark.activeUsers,    sparkColor: raw.chartLine1 },
    { id: 'sessions',       title: 'Sessions',      value: dm.sessions,                             icon: <Activity size={16}/>,     prevValue: prev?.sessions,                                        sparkData: ga4Spark.sessions,       sparkColor: raw.chartLine2 },
    { id: 'pageViews',      title: 'Page Views',    value: dm.pageViews,                            icon: <Eye size={16}/>,          prevValue: prev?.pageViews,                                       sparkData: ga4Spark.pageViews,      sparkColor: raw.chartLine3 },
    { id: 'newUsers',       title: 'New Users',     value: dm.newUsers,                             icon: <UserPlus size={16}/>,     prevValue: prev?.newUsers,                                        sparkData: ga4Spark.newUsers,       sparkColor: raw.chartLine1 },
    { id: 'avgSession',     title: 'Avg Session',   value: dm.avgSessionDuration,                   icon: <Clock size={16}/>,        prevValue: prev ? Math.round(prev.avgSessionDuration) : undefined, sparkData: ga4Spark.avgSession,     sparkColor: raw.ring2      },
    { id: 'bounceRate',     title: 'Bounce Rate',   value: parseFloat(dm.bounceRate), suffix: '%',  icon: <TrendingDown size={16}/>, prevValue: prev ? parseFloat(prev.bounceRate) : undefined, inverse: true, sparkData: ga4Spark.bounceRate, sparkColor: raw.ring3 },
    { id: 'engagementRate', title: 'Engagement',    value: parseFloat(dm.engagementRate), suffix: '%', icon: <Zap size={16}/>,      prevValue: prev ? parseFloat(prev.engagementRate) : undefined,    sparkData: ga4Spark.engagementRate, sparkColor: raw.chartLine2 },
  ].filter(c => !heroSet.has(c.id as HeroMetricId)) as any[];

  return (
    <div className={`min-h-screen ${tw.bg} transition-colors duration-300`} style={{ color: raw.text }}>

      {showPicker && <CustomizeModal selected={heroMetrics} onChange={changeHeroMetrics} onClose={() => setShowPicker(false)} tw={tw} raw={raw} />}

      <header className={`sticky top-0 z-50 ${tw.headerBg} px-3 md:px-8 py-3`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#003F27] flex items-center justify-center shrink-0"><BarChart2 size={16} className="text-white" /></div>
            <div><p className={`${tw.text} font-bold text-sm leading-tight`}>{data.companyName}</p><p className={`${tw.subtext} text-xs`}>Analytics Dashboard</p></div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex gap-1 flex-wrap">
              {PRESET_RANGES.map((r, i) => (
                <button key={i} onClick={() => { setSelectedPreset(i); setShowDatePicker(false); savePreferences({ theme, heroMetrics, mapCountry, compareMode, selectedPreset: i }); }}
                  className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${selectedPreset === i ? tw.pillActive : tw.pillInactive}`}>{r.label}</button>
              ))}
            </div>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowDatePicker(!showDatePicker)}
                className={`flex items-center gap-1.5 rounded-lg text-xs font-semibold transition-all ${selectedPreset === null ? tw.pillActive : tw.pillInactive}`}
                style={{ padding: '6px 10px', border: showDatePicker ? `2px solid ${raw.ring1}` : selectedPreset === null ? 'none' : `1.5px solid ${raw.border}` }}>
                <Calendar size={13} />
                <span>{selectedPreset === null ? (() => { if (!activeLabel.includes('→')) return activeLabel; const [s, e] = activeLabel.split('→').map(x => x.trim()); const sh = (d: string) => { const p = d.split('-'); return p.length === 3 ? `${p[1]}/${p[2].slice(0,2)}` : d; }; return `${sh(s)} → ${sh(e)}`; })() : 'Custom'}</span>
                {selectedPreset !== null && <span style={{ width: 5, height: 5, borderRadius: '50%', background: raw.ring2, display: 'inline-block', marginLeft: 2 }} />}
              </button>
              {showDatePicker && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 290 }} onClick={() => setShowDatePicker(false)} />
                  <div style={{ position: 'fixed', top: 64, right: 16, zIndex: 300 }}>
                    <DateRangePicker startDate={customStart} endDate={customEnd} compareMode={compareMode}
                      onApply={(s, e, cmp) => { setCustomStart(s); setCustomEnd(e); setCompareMode(cmp); setSelectedPreset(null); savePreferences({ theme, heroMetrics, mapCountry, compareMode: cmp, selectedPreset: null }); }}
                      onClose={() => setShowDatePicker(false)} tw={tw} raw={raw} />
                  </div>
                </>
              )}
            </div>
            <div className={`flex gap-0.5 p-1 rounded-xl border ${tw.border} ${tw.card}`}>
              {THEMES.map(th => (
                <button key={th.id} onClick={() => changeTheme(th.id)} title={th.label}
                  className={`p-1.5 rounded-lg transition-all text-xs font-medium flex items-center gap-1 ${theme === th.id ? tw.pillActive : tw.pillInactive}`}>
                  {th.icon}<span className="hidden sm:inline">{th.label}</span>
                </button>
              ))}
            </div>
            {saveStatus !== 'idle' && (
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 8, background: saveStatus === 'saved' ? `${raw.ring1}18` : '#fef2f2', color: saveStatus === 'saved' ? raw.ring1 : '#ef4444' }}>
                {saveStatus === 'saved' ? '✓ Saved' : '⚠ Save failed'}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 md:px-8 py-8 space-y-6">
        {prev && (
          <div className={`${tw.card} border ${tw.border} rounded-xl px-4 py-2.5 flex items-center gap-2 text-xs flex-wrap`} style={{ borderLeft: `3px solid ${raw.ring1}` }}>
            <TrendingUp size={12} style={{ color: raw.ring1, flexShrink: 0 }} />
            <span className={`${tw.text} font-semibold`}>Comparing to: {prevLabel}</span>
            {compareMode !== 'none' && <span className={`${tw.subtext}`}>({compareModeLabel})</span>}
            <span className={tw.subtext}>· Deltas reflect change vs. comparison period</span>
          </div>
        )}

        <ShineCard shineColor={raw.shineColor} className={`${tw.card} border ${tw.border} rounded-2xl p-6 md:p-8`}>
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <p className={`${tw.subtext} text-xs font-bold uppercase tracking-widest`}>Key Highlights · {activeLabel}</p>
            <button onClick={() => setShowPicker(true)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${tw.pillInactive}`}>
              <Settings size={12} /><span>Customize</span>
            </button>
          </div>
          <div className="flex justify-around items-center flex-wrap gap-8">
            {heroMetrics.map((metricId, i) => {
              const meta = ALL_HERO_METRICS.find(m => m.id === metricId)!;
              const vals = HERO_VALUES[metricId];
              return (
                <div key={`${metricId}-${activeStart}-${activeEnd}`} className="flex items-center gap-8 w-full justify-around md:contents">
                  <RingGauge value={vals.value} label={meta.label} sub={vals.sub} color={ringColors[i]} trackColor={raw.ringTrack} pct={vals.pct} size={160} />
                  {i < 2 && <div style={{ width: 1, height: 120, background: raw.border }} className="hidden md:block" />}
                </div>
              );
            })}
          </div>
        </ShineCard>

        {CARD_METRICS.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            {CARD_METRICS.map((c: any, i: number) => (
              <MetricCard key={c.id} title={c.title} value={c.value} suffix={c.suffix} icon={c.icon} index={i} tw={tw} raw={raw} previousValue={c.prevValue} inverse={c.inverse} sparkData={c.sparkData} sparkColor={c.sparkColor} />
            ))}
          </div>
        )}

        {ts.length > 0 && (
          <ShineCard shineColor={raw.shineColor} className={`${tw.card} border ${tw.border} rounded-2xl p-4 md:p-6`}>
            <p className={`${tw.subtext} text-xs font-bold uppercase tracking-widest mb-5`}>Traffic Over Time</p>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={ts}>
                <CartesianGrid strokeDasharray="3 3" stroke={raw.border} />
                <XAxis dataKey="date" tick={{ fill: raw.subtext, fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => fmt(v)} tick={{ fill: raw.subtext, fontSize: 10 }} axisLine={false} tickLine={false} width={40} />
                <Tooltip content={<CustomTooltip raw={raw} />} />
                <Legend wrapperStyle={{ fontSize: 11, color: raw.legendText }} />
                <Line type="monotone" dataKey="activeUsers" stroke={raw.chartLine1} strokeWidth={2.5} dot={false} name="Active Users" />
                <Line type="monotone" dataKey="sessions"    stroke={raw.chartLine2} strokeWidth={2}   dot={false} name="Sessions" />
                <Line type="monotone" dataKey="pageViews"   stroke={raw.chartLine3} strokeWidth={2}   dot={false} name="Page Views" />
              </LineChart>
            </ResponsiveContainer>
          </ShineCard>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.trafficSources.length > 0 && (
            <ShineCard shineColor={raw.shineColor} className={`${tw.card} border ${tw.border} rounded-2xl p-6`}>
              <p className={`${tw.subtext} text-xs font-bold uppercase tracking-widest mb-5`}>Traffic Sources</p>
              <div className="space-y-4">
                {data.trafficSources.map((src, i) => {
                  const pct = Math.round((src.sessions / totalSrc) * 100);
                  const col = raw.pieColors[i % raw.pieColors.length];
                  return (
                    <div key={i}>
                      <div className="flex justify-between mb-1.5"><span style={{ color: raw.text, fontSize: 13 }}>{src.source}</span><span style={{ color: col, fontSize: 13, fontWeight: 700 }}>{pct}%</span></div>
                      <div style={{ height: 6, background: raw.track, borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 3, transition: 'width 0.8s ease' }} /></div>
                    </div>
                  );
                })}
              </div>
            </ShineCard>
          )}
          {data.devices.length > 0 && (
            <ShineCard shineColor={raw.shineColor} className={`${tw.card} border ${tw.border} rounded-2xl p-6`}>
              <p className={`${tw.subtext} text-xs font-bold uppercase tracking-widest mb-5`}>Devices</p>
              <div className="flex justify-around items-end gap-4">
                {data.devices.map((d, i) => {
                  const col = raw.barColors[i % raw.barColors.length];
                  const maxU = Math.max(...data.devices.map(x => x.users), 1);
                  const isTablet = d.device.toLowerCase().includes('tablet');
                  const isMobile = d.device.toLowerCase().includes('mobile');
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <p style={{ color: col, fontSize: 13, fontWeight: 700 }}>{fmt(d.users)}</p>
                      <div style={{ width: 40, height: 80, background: raw.track, borderRadius: 6, overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
                        <div style={{ width: '100%', height: `${(d.users / maxU) * 100}%`, background: col, borderRadius: '6px 6px 0 0', transition: 'height 0.8s ease', minHeight: 4 }} />
                      </div>
                      <div style={{ opacity: 0.9 }}>{isTablet ? <TabletIcon color={col} /> : isMobile ? <MobileIcon color={col} /> : <DesktopIcon color={col} />}</div>
                      <p style={{ color: raw.subtext, fontSize: 11, textTransform: 'capitalize' }}>{d.device}</p>
                    </div>
                  );
                })}
              </div>
            </ShineCard>
          )}
        </div>

        <CallTrackingSection filteredTs={filteredTs} tw={tw} raw={raw} />

        <QualifiedLeadsSection filteredTs={filteredTs} tw={tw} raw={raw} />

        <ShineCard shineColor={raw.shineColor} className={`${tw.card} border ${tw.border} rounded-2xl p-4 md:p-8`}>
          <SearchConsoleMetrics dateRange={{ start: activeStart, end: activeEnd }} theme={theme} themeStyles={{ ...tw, chartGrid: raw.border, accentText: tw.accentText }} />
        </ShineCard>

        <ShineCard shineColor={raw.shineColor} className={`${tw.card} border ${tw.border} rounded-2xl p-4 md:p-8`}>
          <GoogleAdsMetrics dateRange={{ start: activeStart, end: activeEnd }} theme={theme} themeStyles={{ ...tw, chartGrid: raw.border, accentText: tw.accentText }} />
        </ShineCard>

        <ShineCard shineColor={raw.shineColor} className={`${tw.card} border ${tw.border} rounded-2xl p-4 md:p-8`}>
          <MetricoolMetrics dateRange={{ start: activeStart, end: activeEnd }} theme={theme} themeStyles={{ ...tw, chartGrid: raw.border, accentText: tw.accentText }} />
        </ShineCard>

        {data.topPages.length > 0 && <TopPagesSection pages={data.topPages} tw={tw} raw={raw} />}

        {data.countries.length > 0 && (
          <ShineCard shineColor={raw.shineColor} className={`${tw.card} border ${tw.border} rounded-2xl p-4 md:p-6`}>
            <p className={`${tw.subtext} text-xs font-bold uppercase tracking-widest mb-5`}>Global Audience</p>
            <WorldHeatmap countries={data.countries} regions={data.regions} theme={theme} initialCountry={mapCountry} onCountryChange={changeMapCountry} />
          </ShineCard>
        )}
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.94) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
}