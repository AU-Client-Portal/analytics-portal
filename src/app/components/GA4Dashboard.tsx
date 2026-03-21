'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AreaChart, Area, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Users, Activity, Eye, UserPlus, Clock, TrendingDown,
  Zap, Sun, Moon, BarChart2, Settings, X, Check,
  TrendingUp, ArrowUpRight, ArrowDownRight, Calendar,
  ChevronDown, FileText, Target, Flame,
} from 'lucide-react';
import { MetricoolMetrics } from './MetricoolMetrics';
import { SearchConsoleMetrics } from './SearchConsoleMetrics';
import { GBPSection } from './GBPSection';
import { WhatConvertsMetrics } from './WhatConvertsMetrics';
import { getMockGA4 } from './mockData';

export type Theme = 'light' | 'dark' | 'asquared';

const TW_FONT = "var(--font-tomorrow), 'Tomorrow', sans-serif";

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000) return `${Math.round(n / 1000)}K`;
  return n.toLocaleString();
}

function toISODate(d: Date) {
  const yr = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const dy = String(d.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${dy}`;
}

function resolveDate(s: string): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  if (s === 'today') return d;
  if (s === 'yesterday') { d.setDate(d.getDate() - 1); return d; }
  const m = s.match(/^(\d+)daysAgo$/);
  if (m) { d.setDate(d.getDate() - parseInt(m[1])); return d; }
  const [yr, mo, dy] = s.split('-').map(Number);
  const parsed = new Date(yr, mo - 1, dy, 12, 0, 0, 0);
  return parsed;
}

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtDateNice(s: string): string {
  if (!s) return '';
  if (s.length === 8) {
    const mo = parseInt(s.slice(4,6)) - 1;
    const dy = parseInt(s.slice(6,8));
    const yr = s.slice(0,4);
    return `${MONTHS[mo]} ${dy}, ${yr}`;
  }
  if (s.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const [yr, mo, dy] = s.split('-');
    return `${MONTHS[parseInt(mo)-1]} ${parseInt(dy)}, ${yr}`;
  }
  const d = resolveDate(s);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function fmtActiveDateLabel(start: string, end: string): string {
  if (!start || !end) return '';
  const s = resolveDate(start);
  const e = resolveDate(end);
  const f = (dt: Date) => `${MONTHS[dt.getMonth()]} ${dt.getDate()}`;
  if (s.toDateString() === e.toDateString()) return `${f(s)}, ${s.getFullYear()}`;
  if (s.getFullYear() !== e.getFullYear()) return `${f(s)}, ${s.getFullYear()} – ${f(e)}, ${e.getFullYear()}`;
  return `${f(s)} – ${f(e)}, ${e.getFullYear()}`;
}

function filterBySeries<T extends { date: string }>(ts: T[], start: string, end: string): T[] {
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

const THEME_RAW: Record<Theme, {
  bg: string; card: string; border: string; text: string; subtext: string; track: string;
  ring1: string; ring2: string; ring3: string; ringTrack: string;
  chartLine1: string; chartLine2: string; chartLine3: string;
  barColors: string[]; pieColors: string[]; legendText: string;
}> = {
  light: {
    bg: '#F0EFED', card: '#FFFFFF', border: '#D9D8D6',
    text: '#2D2926', subtext: '#6B6460', track: '#E8E7E5',
    ring1: '#F26C00', ring2: '#2D2926', ring3: '#8A7A70', ringTrack: '#E8E7E5',
    chartLine1: '#F26C00', chartLine2: '#2D2926', chartLine3: '#B05000',
    barColors: ['#F26C00', '#2D2926', '#8A7A70'],
    pieColors: ['#F26C00', '#2D2926', '#8A7A70', '#D9D8D6', '#B05000', '#4A3530', '#C08060', '#E0A070'],
    legendText: '#6B6460',
  },
  dark: {
    bg: '#1E1A18', card: '#2D2926', border: '#3D3530',
    text: '#F0EFED', subtext: '#A09488', track: '#3D3530',
    ring1: '#F26C00', ring2: '#D9D8D6', ring3: '#FF9040', ringTrack: '#3D3530',
    chartLine1: '#F26C00', chartLine2: '#D9D8D6', chartLine3: '#FF9040',
    barColors: ['#F26C00', '#D9D8D6', '#FF9040'],
    pieColors: ['#F26C00', '#D9D8D6', '#FF9040', '#8A7A70', '#FFB060', '#A09488', '#E0E0DF', '#C08060'],
    legendText: '#A09488',
  },
  asquared: {
    bg: '#FFF5EC', card: '#FFFFFF', border: '#E8D5C0',
    text: '#2D2926', subtext: '#7A4020', track: '#FFE8D0',
    ring1: '#F26C00', ring2: '#2D2926', ring3: '#D45000', ringTrack: '#FFE8D0',
    chartLine1: '#F26C00', chartLine2: '#2D2926', chartLine3: '#D45000',
    barColors: ['#F26C00', '#2D2926', '#D45000'],
    pieColors: ['#F26C00', '#2D2926', '#D45000', '#FFB060', '#7A4020', '#4A2810', '#FF9040', '#FFC890'],
    legendText: '#7A4020',
  },
};

const THEME_TW: Record<Theme, {
  bg: string; card: string; border: string; text: string; subtext: string; accentText: string;
  headerBg: string; pillActive: string; pillInactive: string;
  tableBg: string; tableHover: string; trackBg: string;
}> = {
  light: {
    bg: 'bg-[#F0EFED]', card: 'bg-white', border: 'border-[#D9D8D6]',
    text: 'text-[#2D2926]', subtext: 'text-[#6B6460]', accentText: 'text-[#F26C00]',
    headerBg: 'bg-white/90 backdrop-blur border-b border-[#D9D8D6]',
    pillActive: 'bg-[#F26C00] text-white', pillInactive: 'bg-[#E8E7E5] text-[#6B6460] hover:bg-[#D9D8D6]',
    tableBg: 'bg-white', tableHover: 'hover:bg-[#F0EFED]', trackBg: 'bg-[#E8E7E5]',
  },
  dark: {
    bg: 'bg-[#1E1A18]', card: 'bg-[#2D2926]', border: 'border-[#3D3530]',
    text: 'text-[#F0EFED]', subtext: 'text-[#A09488]', accentText: 'text-[#F26C00]',
    headerBg: 'bg-[#1E1A18]/90 backdrop-blur border-b border-[#3D3530]',
    pillActive: 'bg-[#F26C00] text-white', pillInactive: 'bg-[#3D3530] text-[#A09488] hover:bg-[#4A4038]',
    tableBg: 'bg-[#2D2926]', tableHover: 'hover:bg-[#3D3530]', trackBg: 'bg-[#3D3530]',
  },
  asquared: {
    bg: 'bg-[#FFF5EC]', card: 'bg-white', border: 'border-[#E8D5C0]',
    text: 'text-[#2D2926]', subtext: 'text-[#7A4020]', accentText: 'text-[#F26C00]',
    headerBg: 'bg-[#F26C00] border-b border-[#D45000]',
    pillActive: 'bg-[#2D2926] text-white', pillInactive: 'bg-[#FFE8D0] text-[#7A4020] hover:bg-[#FFD4AA]',
    tableBg: 'bg-white', tableHover: 'hover:bg-[#FFF5EC]', trackBg: 'bg-[#FFE8D0]',
  },
};

const THEMES: { id: Theme; label: string; icon: React.ReactNode }[] = [
  { id: 'light',    label: 'Light', icon: <Sun size={13} />   },
  { id: 'dark',     label: 'Dark',  icon: <Moon size={13} />  },
  { id: 'asquared', label: 'A²',    icon: <Flame size={13} /> },
];

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
    formSubmits?: number; contactPageViews?: number; quoteRequests?: number;
  }>;
  topPages: Array<{ title: string; path: string; views: number }>;
  trafficSources: Array<{ source: string; sessions: number }>;
  devices: Array<{ device: string; users: number }>;
  countries: Array<{ country: string; users: number }>;
}

function DesktopIcon({ color }: { color: string }) {
  return (
    <svg width="30" height="30" viewBox="0 0 32 32" fill="none">
      <rect x="2" y="3" width="28" height="19" rx="3" stroke={color} strokeWidth="2" fill={`${color}12`} />
      <path d="M10 22v4m12-4v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M7 26h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function MobileIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="30" viewBox="0 0 24 32" fill="none">
      <rect x="2" y="1" width="20" height="30" rx="4" stroke={color} strokeWidth="2" fill={`${color}12`} />
      <circle cx="12" cy="27" r="1.5" fill={color} />
    </svg>
  );
}
function TabletIcon({ color }: { color: string }) {
  return (
    <svg width="24" height="30" viewBox="0 0 26 32" fill="none">
      <rect x="2" y="1" width="22" height="30" rx="4" stroke={color} strokeWidth="2" fill={`${color}12`} />
      <circle cx="13" cy="28" r="1.5" fill={color} />
    </svg>
  );
}

function Spark({ data, color, uid }: { data: number[]; color: string; uid: string }) {
  if (!data || data.length < 2) return null;
  const gid = `spk-${uid}`;
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data.map(v => ({ v }))} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.22} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#${gid})`} dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function Delta({ current, previous, inverse = false }: { current: number; previous: number; inverse?: boolean }) {
  if (!previous) return null;
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  if (Math.abs(pct) < 0.1) return null;
  const isGood = inverse ? pct < 0 : pct > 0;
  const color = isGood ? '#22c55e' : '#ef4444';
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 10, fontWeight: 600, color }}>
      {pct > 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function RingGauge({ value, label, sub, color, trackColor, pct, size = 160 }: {
  value: string; label: string; sub: string; color: string; trackColor: string; pct: number; size?: number;
}) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { setAnimated(false); const t = setTimeout(() => setAnimated(true), 50); return () => clearTimeout(t); }, [pct, value]);
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
          <span style={{ fontSize: size * 0.185, fontWeight: 700, color, letterSpacing: '-0.03em', lineHeight: 1, fontFamily: TW_FONT }}>{value}</span>
          <span style={{ fontSize: size * 0.075, color, fontWeight: 600, opacity: 0.75 }}>{sub}</span>
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', opacity: 0.55 }}>{label}</span>
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
  const [hovered, setHovered] = useState(false);
  const count = useCountUp(value);
  useEffect(() => { const t = setTimeout(() => setVisible(true), index * 75); return () => clearTimeout(t); }, [index]);
  const uid = `${title.replace(/\s+/g, '').toLowerCase()}-${index}`;
  const color = sparkColor || raw.ring1;
  return (
    <div className={`${tw.card} border ${tw.border} rounded-2xl cursor-default group overflow-hidden`}
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)', transition: 'opacity 0.4s ease, transform 0.3s ease', boxShadow: hovered ? `0 4px 16px rgba(0,0,0,0.08)` : '0 1px 3px rgba(0,0,0,0.04)' }}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <div style={{ padding: '12px 14px 8px', position: 'relative' }}>
        <div className="flex items-start justify-between mb-1.5">
          <div className={`${tw.subtext} text-xs font-semibold uppercase tracking-widest leading-tight`} style={{ fontSize: 10 }}>{title}</div>
          <div style={{ color, opacity: hovered ? 0.9 : 0.4, transition: 'opacity 0.2s' }} className="shrink-0 ml-1">{icon}</div>
        </div>
        <div className={`${tw.text} font-bold tracking-tight`} style={{ fontSize: 'clamp(1rem, 4vw, 1.6rem)', wordBreak: 'break-all', fontFamily: TW_FONT }}>
          {fmt(count)}{suffix}
        </div>
        {previousValue !== undefined && previousValue > 0 && (
          <div className="flex items-center gap-1.5 mt-1">
            <Delta current={value} previous={previousValue} inverse={inverse} />
            <span className={tw.subtext} style={{ fontSize: 9 }}>vs prev.</span>
          </div>
        )}
      </div>
      {sparkData && sparkData.length > 1 && (
        <div style={{ height: 38 }}>
          <Spark data={sparkData} color={color} uid={uid} />
        </div>
      )}
    </div>
  );
}

function CustomizeModal({ selected, onChange, onClose, tw, raw }: {
  selected: [HeroMetricId, HeroMetricId, HeroMetricId];
  onChange: (m: [HeroMetricId, HeroMetricId, HeroMetricId]) => void;
  onClose: () => void; tw: typeof THEME_TW[Theme]; raw: typeof THEME_RAW[Theme];
}) {
  const [draft, setDraft] = useState<[HeroMetricId, HeroMetricId, HeroMetricId]>([...selected]);
  const [activeSlot, setSlot] = useState<0 | 1 | 2>(0);
  const slotColors = [raw.ring1, raw.ring2, raw.ring3];
  const slotLabels = ['Slot 1', 'Slot 2', 'Slot 3'];

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
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className={`${tw.card} border ${tw.border} rounded-2xl shadow-2xl w-full max-w-sm`}
        style={{ animation: 'modalIn 0.2s ease', maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 pb-4">
          <div>
            <h3 className={`${tw.text} font-bold`} style={{ fontSize: 15, fontFamily: TW_FONT }}>Customize Key Highlights</h3>
            <p className={`${tw.subtext} text-sm mt-0.5`}>Select a slot then pick its metric</p>
          </div>
          <button onClick={onClose} className={`${tw.pillInactive} p-1.5 rounded-lg`}><X size={14} /></button>
        </div>
        <div style={{ padding: '0 20px 16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {([0, 1, 2] as const).map(s => {
            const color = slotColors[s]; const metric = ALL_HERO_METRICS.find(m => m.id === draft[s])!; const isActive = activeSlot === s;
            return (
              <button key={s} onClick={() => setSlot(s)} style={{ padding: '10px 8px', borderRadius: 10, border: `2px solid ${isActive ? color : raw.border}`, background: isActive ? `${color}10` : 'transparent', cursor: 'pointer', textAlign: 'center', transition: 'all 0.12s', outline: 'none' }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: isActive ? color : raw.subtext, marginBottom: 5 }}>{slotLabels[s]}</div>
                <div style={{ width: 20, height: 3, borderRadius: 2, background: color, margin: '0 auto 6px', opacity: isActive ? 1 : 0.35 }} />
                <div style={{ fontSize: 11, fontWeight: 600, color: isActive ? color : raw.text, lineHeight: 1.2 }}>{metric.label}</div>
              </button>
            );
          })}
        </div>
        <div className={`border-t ${tw.border}`} style={{ margin: '0 20px' }} />
        <div style={{ padding: '12px 20px 8px' }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: raw.subtext, marginBottom: 10 }}>Assign to {slotLabels[activeSlot]}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {ALL_HERO_METRICS.map(metric => {
              const as2 = draft.indexOf(metric.id as HeroMetricId) as -1 | 0 | 1 | 2;
              const isCur = as2 === activeSlot; const isOth = as2 !== -1 && as2 !== activeSlot;
              const sc = as2 !== -1 ? slotColors[as2] : undefined;
              return (
                <button key={metric.id} onClick={() => pickMetric(metric.id as HeroMetricId)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 9, border: `1.5px solid ${isCur ? slotColors[activeSlot] : 'transparent'}`, background: isCur ? `${slotColors[activeSlot]}10` : 'transparent', cursor: 'pointer', textAlign: 'left', outline: 'none', transition: 'all 0.1s' }}
                  onMouseEnter={e => { if (!isCur) (e.currentTarget as HTMLButtonElement).style.background = `${raw.border}40`; }}
                  onMouseLeave={e => { if (!isCur) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}>
                  <div style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isCur ? slotColors[activeSlot] : isOth ? `${sc}18` : raw.track, border: `1.5px solid ${isCur ? slotColors[activeSlot] : isOth ? sc! : raw.border}`, transition: 'all 0.1s' }}>
                    {isCur ? <Check size={12} color="white" strokeWidth={3} /> : isOth ? <span style={{ fontSize: 8, fontWeight: 800, color: sc }}>{as2 + 1}</span> : null}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: raw.text }}>{metric.label}</div>
                    <div style={{ fontSize: 11, color: raw.subtext }}>{metric.sub}</div>
                  </div>
                  {isOth && <span style={{ fontSize: 9, fontWeight: 700, color: sc, background: `${sc}15`, padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>slot {as2 + 1}</span>}
                </button>
              );
            })}
          </div>
        </div>
        <div className={`border-t ${tw.border}`} style={{ padding: '14px 20px', display: 'flex', gap: 8, marginTop: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '8px', borderRadius: 9, border: `1px solid ${raw.border}`, background: 'transparent', color: raw.subtext, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
          <button onClick={() => { onChange(draft); onClose(); }} className={tw.pillActive} style={{ flex: 2, padding: '8px', borderRadius: 9, border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Apply</button>
        </div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label, raw }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: raw.card, border: `1px solid ${raw.border}`, borderRadius: 10, padding: '10px 14px', boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
      <p style={{ color: raw.subtext, fontSize: 11, marginBottom: 6, fontWeight: 600 }}>{label}</p>
      {payload.map((p: any, i: number) => <p key={i} style={{ color: p.color, fontSize: 12, fontWeight: 600, margin: '2px 0' }}>{p.name}: {p.value?.toLocaleString()}</p>)}
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
  const inp = { background: raw.bg, border: `1px solid ${raw.border}`, borderRadius: 8, padding: '7px 12px', color: raw.text, fontSize: 13, outline: 'none', width: '100%' } as React.CSSProperties;
  return (
    <div className={`${tw.card} border ${tw.border}`} style={{ position: 'fixed', top: 64, right: 16, borderRadius: 16, padding: 20, boxShadow: '0 16px 48px rgba(0,0,0,0.22)', zIndex: 300, width: 'min(320px, calc(100vw - 32px))' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: raw.ring1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Calendar size={14} color="white" /></div>
          <div><p style={{ color: raw.text, fontSize: 13, fontWeight: 600, margin: 0, fontFamily: TW_FONT }}>Custom Range</p><p style={{ color: raw.subtext, fontSize: 11, margin: 0 }}>Pick dates and compare period</p></div>
        </div>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: raw.subtext, padding: 4 }}><X size={15} /></button>
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
        <button onClick={onClose} style={{ flex: 1, padding: '8px', borderRadius: 10, border: `1px solid ${raw.border}`, background: 'transparent', color: raw.subtext, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
        <button onClick={() => { if (s && e) { onApply(s, e, cmp); onClose(); } }} disabled={!s || !e}
          style={{ flex: 2, padding: '8px', borderRadius: 10, border: 'none', background: raw.ring1, color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: s && e ? 1 : 0.5 }}>Apply Range</button>
      </div>
    </div>
  );
}

function PageRow({ page, i, pct, sharePct, color, visible, raw }: { page: { title: string; path: string; views: number }; i: number; pct: number; sharePct: number; color: string; visible: boolean; raw: typeof THEME_RAW[Theme] }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ padding: '10px 24px', background: hovered ? `${raw.ring1}05` : 'transparent', transition: 'background 0.15s, opacity 0.4s, transform 0.3s', opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(-12px)', transitionDelay: `${i * 55}ms` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, flexShrink: 0, background: `${color}15`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, fontSize: 12, fontWeight: 700, fontFamily: TW_FONT }}>{i + 1}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ color: raw.text, fontSize: 13, fontWeight: 500, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page.title}</p>
          <p style={{ color: raw.subtext, fontSize: 11, fontFamily: 'monospace', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{page.path}</p>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ color, fontSize: 13, fontWeight: 700, margin: 0, fontFamily: TW_FONT }}>{fmt(page.views)}</p>
          <p style={{ color: raw.subtext, fontSize: 10, margin: '1px 0 0' }}>{sharePct}%</p>
        </div>
      </div>
      <div style={{ marginTop: 7, height: 3, background: raw.track, borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.6s ease', opacity: 0.75 }} />
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
      <div style={{ padding: '18px 24px 0' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><FileText size={14} style={{ color: raw.ring1 }} /><p className={`${tw.subtext} text-xs font-bold uppercase tracking-widest`}>Top Pages</p></div>
          <p className={`${tw.subtext} text-xs`}>{total.toLocaleString()} total views</p>
        </div>
      </div>
      <div style={{ padding: '14px 0 8px' }}>
        {pages.map((page, i) => <PageRow key={i} page={page} i={i} pct={(page.views / max) * 100} sharePct={Math.round((page.views / total) * 100)} color={rankColors[Math.min(i, rankColors.length - 1)]} visible={visible} raw={raw} />)}
      </div>
    </div>
  );
}

function QualifiedLeadsSection({ filteredTs, tw, raw }: {
  filteredTs: GA4Data['timeSeries']; tw: typeof THEME_TW[Theme]; raw: typeof THEME_RAW[Theme];
}) {
  const totalSessions    = filteredTs.reduce((s, d) => s + d.sessions, 0);
  const totalFormSubmits = filteredTs.reduce((s, d) => s + (d.formSubmits ?? 0), 0);
  const totalQuotes      = filteredTs.reduce((s, d) => s + (d.quoteRequests ?? 0), 0);
  const totalContact     = filteredTs.reduce((s, d) => s + (d.contactPageViews ?? 0), 0);
  const qualifiedLeads   = totalFormSubmits + totalQuotes;
  const qualRate         = totalSessions > 0 ? ((qualifiedLeads / totalSessions) * 100).toFixed(2) : '0';
  const sources = [
    { label: 'Form Submissions', value: totalFormSubmits, color: raw.ring1, pct: qualifiedLeads > 0 ? Math.round((totalFormSubmits / qualifiedLeads) * 100) : 0 },
    { label: 'Quote Requests',   value: totalQuotes,      color: raw.ring2, pct: qualifiedLeads > 0 ? Math.round((totalQuotes / qualifiedLeads) * 100) : 0 },
  ];
  const hasData = qualifiedLeads > 0;

  if (!hasData) return (
    <div className={`${tw.card} border ${tw.border} rounded-2xl p-6`}>
      <div className="flex items-start gap-4">
        <div style={{ width: 40, height: 40, borderRadius: 12, background: `${raw.ring1}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Target size={18} style={{ color: raw.ring1 }} />
        </div>
        <div style={{ flex: 1 }}>
          <p className={`${tw.text} font-bold mb-1`} style={{ fontSize: 14, fontFamily: TW_FONT }}>Website Lead Activity</p>
          <p className={`${tw.subtext} text-sm leading-relaxed mb-4`} style={{ maxWidth: 480 }}>
            Once enabled, this section tracks form submissions and quote requests from your website. Ask your account manager to set up goal tracking in Google Analytics.
          </p>
          <div style={{ background: `${raw.ring1}07`, borderRadius: 10, padding: '12px 16px', border: `1px solid ${raw.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: raw.ring2, flexShrink: 0 }} />
            <p className={`${tw.subtext} text-xs leading-relaxed`}>
              <strong className={tw.text}>Not set up yet.</strong> Your account manager can enable this — let them know you&apos;d like to track form submissions and quote requests.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`${tw.card} border ${tw.border} rounded-2xl p-5 md:p-6`}>
      <div className="flex items-center gap-2 mb-5">
        <Target size={14} style={{ color: raw.ring1 }} />
        <p className={`${tw.subtext} text-xs font-bold uppercase tracking-widest`}>Website Lead Activity</p>
        <span style={{ marginLeft: 'auto', fontSize: 10, color: raw.subtext, background: `${raw.ring1}10`, borderRadius: 5, padding: '2px 8px', fontWeight: 600 }}>Form &amp; Quote Tracking</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 'clamp(1.8rem, 5vw, 2.6rem)', fontWeight: 800, letterSpacing: '-0.04em', color: raw.text, lineHeight: 1, fontFamily: TW_FONT }}>{fmt(qualifiedLeads)}</span>
            <span className={`${tw.subtext} text-sm`}>web leads</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: raw.ring1, fontFamily: TW_FONT }}>{qualRate}%</span>
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
                    <span style={{ color: src.color, fontSize: 13, fontWeight: 700, fontFamily: TW_FONT }}>{fmt(src.value)}</span>
                    <span style={{ fontSize: 10, color: raw.subtext, background: `${src.color}12`, borderRadius: 4, padding: '1px 5px', fontWeight: 600 }}>{src.pct}%</span>
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
              <strong>How we count leads:</strong> Form submissions and quote requests — actions that show genuine purchase intent. Contact page views ({fmt(totalContact)} this period) are tracked separately. Phone calls are tracked via WhatConverts above.
            </p>
          </div>
        </div>
        <div>
          <p className={`${tw.subtext} text-xs font-semibold uppercase tracking-widest mb-4`} style={{ fontSize: 9 }}>Lead Volume Over Time</p>
          <div style={{ height: 160 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredTs.map(d => ({ date: d.date, forms: d.formSubmits ?? 0, quotes: d.quoteRequests ?? 0 }))} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                <defs>
                  {[['qlg1', raw.ring1], ['qlg2', raw.ring2]].map(([id, color]) => (
                    <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={color} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={raw.border} />
                <XAxis dataKey="date" tick={{ fill: raw.subtext, fontSize: 8 }} axisLine={false} tickLine={false} interval="preserveStartEnd"
                  tickFormatter={v => v?.length === 8 ? `${v.slice(4, 6)}/${v.slice(6, 8)}` : v} />
                <YAxis tick={{ fill: raw.subtext, fontSize: 8 }} axisLine={false} tickLine={false} width={24} />
                <Tooltip content={<CustomTooltip raw={raw} />} />
                <Area type="monotone" dataKey="forms"  stroke={raw.ring1} strokeWidth={1.5} fill="url(#qlg1)" name="Forms"  dot={false} />
                <Area type="monotone" dataKey="quotes" stroke={raw.ring2} strokeWidth={1.5} fill="url(#qlg2)" name="Quotes" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
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

  const [theme, setTheme]             = useState<Theme>('dark');
  const [heroMetrics, setHeroMetrics] = useState<[HeroMetricId, HeroMetricId, HeroMetricId]>(DEFAULT_HERO);
  const [showPicker, setShowPicker]   = useState(false);
  const [saveStatus, setSaveStatus]   = useState<'idle' | 'saved' | 'error'>('idle');

  const saveTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchParams = useSearchParams();
  const tw  = THEME_TW[theme];
  const raw = THEME_RAW[theme];
  const token = searchParams.get('token') ?? '';
  const companyId = searchParams.get('companyId') ?? '';
  const authParam = token ? `token=${token}` : `companyId=${companyId}`;
  const useMock = searchParams.get('mock') === 'true';

  const activeStart = selectedPreset !== null ? PRESET_RANGES[selectedPreset].start : customStart;
  const activeEnd   = selectedPreset !== null ? PRESET_RANGES[selectedPreset].end   : customEnd;
  const activeDateLabel = fmtActiveDateLabel(activeStart, activeEnd);

  useEffect(() => {
    try {
      const local = localStorage.getItem('dashboard-prefs');
      if (local) {
        const p = JSON.parse(local);
        if (p.theme && THEME_TW[p.theme as Theme]) setTheme(p.theme as Theme);
        if (p.analytics) {
          const a = p.analytics;
          if (Array.isArray(a.heroMetrics) && a.heroMetrics.length === 3) setHeroMetrics(a.heroMetrics);
          if (a.compareMode) setCompareMode(a.compareMode);
          if (typeof a.selectedPreset === 'number' || a.selectedPreset === null) setSelectedPreset(a.selectedPreset ?? 3);
          if (a.customStart) setCustomStart(a.customStart);
          if (a.customEnd) setCustomEnd(a.customEnd);
        }
      }
    } catch {}
    if (!useMock && (token || companyId)) {
      fetch(`/api/preferences?${authParam}`)
        .then(r => r.json())
        .then(({ preferences: p }) => {
          if (!p) return;
          if (p.theme && THEME_TW[p.theme as Theme]) setTheme(p.theme as Theme);
          if (p.analytics) {
            const a = p.analytics;
            if (Array.isArray(a.heroMetrics) && a.heroMetrics.length === 3) setHeroMetrics(a.heroMetrics);
            if (a.compareMode) setCompareMode(a.compareMode);
            if (typeof a.selectedPreset === 'number' || a.selectedPreset === null) setSelectedPreset(a.selectedPreset ?? 3);
            if (a.customStart) setCustomStart(a.customStart);
            if (a.customEnd) setCustomEnd(a.customEnd);
          }
          localStorage.setItem('dashboard-prefs', JSON.stringify(p));
        })
        .catch(() => {});
    }
  }, [token]);

  const savePreferences = useCallback((patch: { theme?: Theme; analytics?: any }) => {
    const existing: any = (() => { try { return JSON.parse(localStorage.getItem('dashboard-prefs') || '{}'); } catch { return {}; } })();
    const merged = { ...existing, ...(patch.theme ? { theme: patch.theme } : {}), analytics: { ...(existing.analytics || {}), ...(patch.analytics || {}) } };
    localStorage.setItem('dashboard-prefs', JSON.stringify(merged));
    if (useMock || !token) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const serverPrefs = await fetch(`/api/preferences?${authParam}`).then(r => r.json()).then(d => d.preferences || {}).catch(() => ({}));
        const toSave = { ...serverPrefs, ...(patch.theme ? { theme: patch.theme } : {}), analytics: { ...(serverPrefs.analytics || {}), ...(patch.analytics || {}) } };
        await fetch(`/api/preferences?${authParam}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toSave) });
        setSaveStatus('saved');
      } catch { setSaveStatus('error'); }
      finally { setTimeout(() => setSaveStatus('idle'), 3000); }
    }, 800);
  }, [token]);

  const changeTheme = (th: Theme) => { setTheme(th); savePreferences({ theme: th }); };
  const changeHeroMetrics = (m: [HeroMetricId, HeroMetricId, HeroMetricId]) => { setHeroMetrics(m); savePreferences({ analytics: { heroMetrics: m, compareMode, selectedPreset, customStart, customEnd } }); };
  const changePreset = (i: number) => { setSelectedPreset(i); setShowDatePicker(false); savePreferences({ analytics: { heroMetrics, compareMode, selectedPreset: i, customStart: '', customEnd: '' } }); };
  const applyCustomRange = (s: string, e: string, cmp: string) => { setCustomStart(s); setCustomEnd(e); setCompareMode(cmp); setSelectedPreset(null); savePreferences({ analytics: { heroMetrics, compareMode: cmp, selectedPreset: null, customStart: s, customEnd: e } }); };

  useEffect(() => {
    async function fetchMetrics() {
      if (!activeStart || !activeEnd) return;
      if (!token && !companyId && !useMock) { setError('NO_TOKEN'); setLoading(false); return; }      setLoading(true); setError(null);
      try {
        if (useMock) { await new Promise(r => setTimeout(r, 600)); setData(getMockGA4() as any); return; }
        const res = await fetch(`/api/ga4/metrics?${authParam}&startDate=${activeStart}&endDate=${activeEnd}&compareMode=${compareMode}`);
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed to load website analytics. Your account manager can check the Google Analytics connection.'); }
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
          <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: `${raw.ring1}25` }} />
          <div className="absolute inset-0 rounded-full animate-spin" style={{ border: `2px solid ${raw.ring1}`, borderTopColor: 'transparent' }} />
        </div>
        <p className={`${tw.subtext} text-sm`}>Loading analytics…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className={`min-h-screen ${tw.bg} flex items-center justify-center p-6`}>
      <div className={`${tw.card} border ${tw.border} rounded-2xl p-10 max-w-md w-full text-center shadow-sm`}>
        {error === 'NO_TOKEN' ? (
          <>
            <div style={{ marginBottom: 12 }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke={raw.ring1} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto' }}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <p className={`${tw.text} font-bold text-lg mb-2`} style={{ fontFamily: TW_FONT }}>Access required</p>
            <p className={`${tw.subtext} text-sm leading-relaxed`}>This dashboard can only be accessed through your personalised portal link. Please use the link provided by your account manager.</p>
          </>
        ) : (
          <><div style={{ fontSize: 36, marginBottom: 12, color: raw.ring3 }}>⚠</div><p className={`${tw.text} font-semibold mb-1`} style={{ fontFamily: TW_FONT }}>Analytics unavailable</p><p className={`${tw.subtext} text-sm`}>{error}</p></>
        )}
      </div>
    </div>
  );

  if (!data?.metrics) return <div className={`min-h-screen ${tw.bg} flex items-center justify-center`}><p className={tw.subtext}>No analytics data available for this period.</p></div>;

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

  const totalSrc   = data.trafficSources.reduce((s, r) => s + r.sessions, 0);
  const newPct     = dm.sessions > 0 ? Math.round((dm.newUsers / dm.sessions) * 100) : 0;
  const ringColors = [raw.ring1, raw.ring2, raw.ring3];
  const heroSet    = new Set(heroMetrics);
  const prevLabel  = data.previousDateRange ? `${fmtDateNice(data.previousDateRange.startDate)} – ${fmtDateNice(data.previousDateRange.endDate)}` : 'previous period';
  const compareModeLabel = COMPARE_OPTIONS.find(o => o.value === compareMode)?.label ?? '';

  const HERO_VALUES: Record<HeroMetricId, { value: string; sub: string; pct: number }> = {
    engagementRate: { value: `${parseFloat(dm.engagementRate).toFixed(0)}%`, sub: 'of sessions',  pct: parseFloat(dm.engagementRate) },
    bounceRate:     { value: `${parseFloat(dm.bounceRate).toFixed(0)}%`,     sub: 'leaving early', pct: parseFloat(dm.bounceRate) },
    activeUsers:    { value: fmt(dm.activeUsers),                             sub: `${newPct}% new`, pct: Math.min((dm.activeUsers / Math.max(dm.sessions, 1)) * 100, 100) },
    sessions:       { value: fmt(dm.sessions),                                sub: 'total',          pct: Math.min((dm.sessions / Math.max(dm.pageViews, 1)) * 100, 100) },
    pageViews:      { value: fmt(dm.pageViews),                               sub: 'total',          pct: Math.min((dm.pageViews / 20000) * 100, 100) },
    newUsers:       { value: fmt(dm.newUsers),                                sub: 'first visit',    pct: Math.min((dm.newUsers / Math.max(dm.activeUsers, 1)) * 100, 100) },
    avgSession:     { value: `${dm.avgSessionDuration}s`,                     sub: 'per session',    pct: Math.min((dm.avgSessionDuration / 300) * 100, 100) },
  };

  const CARD_METRICS = [
    { id: 'activeUsers',    title: 'Active Users',  value: dm.activeUsers,                          icon: <Users size={16}/>,        prevValue: prev?.activeUsers,                                      sparkData: ga4Spark.activeUsers,    sparkColor: raw.chartLine1 },
    { id: 'sessions',       title: 'Sessions',      value: dm.sessions,                             icon: <Activity size={16}/>,     prevValue: prev?.sessions,                                         sparkData: ga4Spark.sessions,       sparkColor: raw.chartLine2 },
    { id: 'pageViews',      title: 'Page Views',    value: dm.pageViews,                            icon: <Eye size={16}/>,          prevValue: prev?.pageViews,                                        sparkData: ga4Spark.pageViews,      sparkColor: raw.chartLine3 },
    { id: 'newUsers',       title: 'New Users',     value: dm.newUsers,                             icon: <UserPlus size={16}/>,     prevValue: prev?.newUsers,                                         sparkData: ga4Spark.newUsers,       sparkColor: raw.chartLine1 },
    { id: 'avgSession',     title: 'Avg Session',   value: dm.avgSessionDuration,                   icon: <Clock size={16}/>,        prevValue: prev ? Math.round(prev.avgSessionDuration) : undefined,  sparkData: ga4Spark.avgSession,     sparkColor: raw.ring2 },
    { id: 'bounceRate',     title: 'Bounce Rate',   value: parseFloat(dm.bounceRate), suffix: '%',  icon: <TrendingDown size={16}/>, prevValue: prev ? parseFloat(prev.bounceRate) : undefined, inverse: true, sparkData: ga4Spark.bounceRate, sparkColor: raw.ring3 },
    { id: 'engagementRate', title: 'Engagement',    value: parseFloat(dm.engagementRate), suffix: '%', icon: <Zap size={16}/>,      prevValue: prev ? parseFloat(prev.engagementRate) : undefined,     sparkData: ga4Spark.engagementRate, sparkColor: raw.chartLine2 },
  ].filter(c => !heroSet.has(c.id as HeroMetricId)) as any[];

  return (
    <div className={`min-h-screen ${tw.bg} transition-colors duration-300`} style={{ color: raw.text }}>
      {showPicker && <CustomizeModal selected={heroMetrics} onChange={changeHeroMetrics} onClose={() => setShowPicker(false)} tw={tw} raw={raw} />}

      <header className={`sticky top-0 z-50 ${tw.headerBg} px-3 md:px-8 py-3`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: theme === 'asquared' ? '#2D2926' : raw.ring1 }}><BarChart2 size={16} color="white" /></div>
            <div>
              <p className={`font-bold text-sm leading-tight`} style={{ fontFamily: TW_FONT, color: theme === 'asquared' ? '#FFFFFF' : raw.text }}>{data.companyName}</p>
              <p style={{ fontSize: 12, color: theme === 'asquared' ? 'rgba(255,255,255,0.75)' : raw.subtext }}>Analytics Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex gap-1 flex-wrap">
              {PRESET_RANGES.map((r, i) => {
                const isActive = selectedPreset === i;
                const activeCls = theme === 'asquared' ? 'bg-[#2D2926] text-white' : tw.pillActive;
                const inactiveCls = theme === 'asquared' ? 'bg-[#FFE8D0] text-[#2D2926] hover:bg-white' : tw.pillInactive;
                return (
                  <button key={i} onClick={() => changePreset(i)}
                    className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${isActive ? activeCls : inactiveCls}`}>{r.label}</button>
                );
              })}
            </div>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowDatePicker(!showDatePicker)}
                className={`flex items-center gap-1.5 rounded-lg text-xs font-semibold transition-all ${selectedPreset === null ? tw.pillActive : tw.pillInactive}`}
                style={{ padding: '6px 10px', border: showDatePicker ? `2px solid ${raw.ring1}` : selectedPreset === null ? 'none' : `1.5px solid ${raw.border}` }}>
                <Calendar size={12} />
                <span>{selectedPreset === null ? activeDateLabel : 'Custom'}</span>
                {selectedPreset !== null && <span style={{ width: 5, height: 5, borderRadius: '50%', background: raw.ring1, display: 'inline-block', marginLeft: 2 }} />}
              </button>
              {showDatePicker && (
                <>
                  <div style={{ position: 'fixed', inset: 0, zIndex: 290 }} onClick={() => setShowDatePicker(false)} />
                  <DateRangePicker startDate={customStart} endDate={customEnd} compareMode={compareMode}
                    onApply={applyCustomRange}
                    onClose={() => setShowDatePicker(false)} tw={tw} raw={raw} />
                </>
              )}
            </div>
            <div className={`flex gap-0.5 p-1 rounded-xl ${theme === 'asquared' ? 'bg-[#D45000] border border-[#D45000]' : `border ${tw.border} ${tw.card}`}`}>
              {THEMES.map(th => {
                const isActive = theme === th.id;
                const activeCls = theme === 'asquared' ? 'bg-[#2D2926] text-white' : tw.pillActive;
                const inactiveCls = theme === 'asquared' ? 'bg-transparent text-white hover:bg-[#B03800]' : tw.pillInactive;
                return (
                  <button key={th.id} onClick={() => changeTheme(th.id)} title={th.label}
                    className={`p-1.5 rounded-lg transition-all text-xs font-semibold flex items-center gap-1 ${isActive ? activeCls : inactiveCls}`}>
                    {th.icon}<span className="hidden sm:inline">{th.label}</span>
                  </button>
                );
              })}
            </div>
            {saveStatus !== 'idle' && (
              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 8, background: saveStatus === 'saved' ? `${raw.ring1}15` : '#fef2f2', color: saveStatus === 'saved' ? raw.ring1 : '#ef4444' }}>
                {saveStatus === 'saved' ? '✓ Saved' : '⚠ Save failed'}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 md:px-8 py-8 space-y-6">



        <div className={`${tw.card} border ${tw.border} rounded-2xl p-6 md:p-8`}>
          <div className="flex items-center justify-between mb-6 md:mb-8 flex-wrap gap-3">
            <div>
              <p className={`${tw.subtext} text-xs font-bold uppercase tracking-widest mb-1`}>Key Highlights</p>
              <p className={`${tw.text} font-bold`} style={{ fontSize: 15, fontFamily: TW_FONT }}>{activeDateLabel}</p>
            </div>
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
                  {i < 2 && <div style={{ width: 1, height: 110, background: raw.border }} className="hidden md:block" />}
                </div>
              );
            })}
          </div>
        </div>

        {CARD_METRICS.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            {CARD_METRICS.map((c: any, i: number) => (
              <MetricCard key={c.id} title={c.title} value={c.value} suffix={c.suffix} icon={c.icon} index={i} tw={tw} raw={raw} previousValue={c.prevValue} inverse={c.inverse} sparkData={c.sparkData} sparkColor={c.sparkColor} />
            ))}
          </div>
        )}

        {ts.length > 0 && (
          <div className={`${tw.card} border ${tw.border} rounded-2xl p-4 md:p-6`}>
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
                      <div className="flex justify-between mb-1.5"><span style={{ color: raw.text, fontSize: 13 }}>{src.source}</span><span style={{ color: col, fontSize: 13, fontWeight: 600, fontFamily: TW_FONT }}>{pct}%</span></div>
                      <div style={{ height: 5, background: raw.track, borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', width: `${pct}%`, background: col, borderRadius: 3, transition: 'width 0.8s ease' }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {data.devices.length > 0 && (
            <div className={`${tw.card} border ${tw.border} rounded-2xl p-6`}>
              <p className={`${tw.subtext} text-xs font-bold uppercase tracking-widest mb-5`}>Devices</p>
              <div className="flex justify-around items-end gap-4">
                {data.devices.map((d, i) => {
                  const col = raw.barColors[i % raw.barColors.length];
                  const maxU = Math.max(...data.devices.map(x => x.users), 1);
                  const isTablet = d.device.toLowerCase().includes('tablet');
                  const isMobile = d.device.toLowerCase().includes('mobile');
                  return (
                    <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                      <p style={{ color: col, fontSize: 13, fontWeight: 700, fontFamily: TW_FONT }}>{fmt(d.users)}</p>
                      <div style={{ width: 38, height: 72, background: raw.track, borderRadius: 5, overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
                        <div style={{ width: '100%', height: `${(d.users / maxU) * 100}%`, background: col, borderRadius: '5px 5px 0 0', transition: 'height 0.8s ease', minHeight: 4 }} />
                      </div>
                      <div style={{ opacity: 0.85 }}>{isTablet ? <TabletIcon color={col} /> : isMobile ? <MobileIcon color={col} /> : <DesktopIcon color={col} />}</div>
                      <p style={{ color: raw.subtext, fontSize: 11, textTransform: 'capitalize' }}>{d.device}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className={`${tw.card} border ${tw.border} rounded-2xl p-4 md:p-6`}>
          <WhatConvertsMetrics dateRange={{ start: activeStart, end: activeEnd }} theme={theme} themeStyles={{ ...tw, chartGrid: raw.border, accentText: tw.accentText }} />
        </div>

        <QualifiedLeadsSection filteredTs={filteredTs} tw={tw} raw={raw} />

        <div className={`${tw.card} border ${tw.border} rounded-2xl p-4 md:p-8`}>
          <SearchConsoleMetrics dateRange={{ start: activeStart, end: activeEnd }} theme={theme} themeStyles={{ ...tw, chartGrid: raw.border, accentText: tw.accentText }} />
        </div>

        <div className={`${tw.card} border ${tw.border} rounded-2xl p-4 md:p-8`}>
          <MetricoolMetrics dateRange={{ start: activeStart, end: activeEnd }} theme={theme} themeStyles={{ ...tw, chartGrid: raw.border, accentText: tw.accentText }} />
        </div>

        {data.topPages.length > 0 && <TopPagesSection pages={data.topPages} tw={tw} raw={raw} />}

        <div className={`${tw.card} border ${tw.border} rounded-2xl p-4 md:p-6`}>
          <GBPSection dateRange={{ start: activeStart, end: activeEnd }} theme={theme} themeStyles={{ ...tw, chartGrid: raw.border, accentText: tw.accentText }} />
        </div>

        <div className={`${tw.card} border ${tw.border} rounded-xl px-5 py-3.5 flex items-center justify-between flex-wrap gap-3`} style={{ borderLeft: `3px solid ${raw.border}` }}>
          <div className="flex items-center gap-2">
            <Calendar size={12} style={{ color: raw.subtext }} />
            <p className={`${tw.subtext} text-xs`}>Reporting period: <strong className={`${tw.text} font-semibold`} style={{ fontFamily: TW_FONT }}>{activeDateLabel}</strong></p>
          </div>
          <p className={`${tw.subtext} text-xs`}>Data refreshes daily · {data.companyName}</p>
        </div>

      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes modalIn { from { opacity: 0; transform: scale(0.96) translateY(6px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
}