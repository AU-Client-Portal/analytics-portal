'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Users, FileText, Heart, Radio, ThumbsUp, MessageCircle, Instagram, Linkedin, Facebook, Twitter, Share2, Eye } from 'lucide-react';
import { getMockMetricool } from './mockData';
import type { Theme } from './GA4Dashboard';

const TW_FONT = "var(--font-tomorrow), 'Tomorrow', sans-serif";

interface SocialTimeSeries { date: string; reach: number; impressions: number; engagement: number; followers: number; }
interface MetricoolData {
  companyId: string; companyName: string; blogId: string;
  dateRange: { startDate: string; endDate: string };
  profile: any; stats: any; posts: any[];
  timeSeries?: SocialTimeSeries[];
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

const ACCENT: Record<Theme, { ring1: string; ring2: string; ring3: string; ring4: string; track: string; border: string }> = {
  light:    { ring1: '#F26C00', ring2: '#2D2926', ring3: '#8A7A70', ring4: '#B05000', track: '#E8E7E5', border: '#D9D8D6' },
  dark:     { ring1: '#F26C00', ring2: '#D9D8D6', ring3: '#FF9040', ring4: '#FFB060', track: '#3D3530', border: '#3D3530' },
  asquared: { ring1: '#F26C00', ring2: '#FFB060', ring3: '#D9D8D6', ring4: '#FF8030', track: '#4A2810', border: '#6B3A18' },
};

const NETWORK_COLORS: Record<string, string> = {
  Instagram: '#e1306c', Facebook: '#1877f2', LinkedIn: '#0a66c2', Twitter: '#1da1f2', Default: '#8A7A70',
};

function NetworkIcon({ network }: { network: string }) {
  const n = network?.toLowerCase() || '';
  if (n.includes('instagram')) return <Instagram size={13} />;
  if (n.includes('linkedin'))  return <Linkedin size={13} />;
  if (n.includes('facebook'))  return <Facebook size={13} />;
  if (n.includes('twitter'))   return <Twitter size={13} />;
  return <Radio size={13} />;
}

function fmtNum(n: number | undefined): string {
  if (n === undefined || n === null) return '—';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000)    return `${Math.round(n / 1000)}K`;
  return n.toLocaleString();
}

function SocialCard({ title, value, icon, index, accentColor, t, sparkData }: {
  title: string; value: string; icon: React.ReactNode;
  index: number; accentColor: string; t: any; sparkData?: number[];
}) {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  useEffect(() => { const timer = setTimeout(() => setVisible(true), index * 90); return () => clearTimeout(timer); }, [index]);
  const uid = `soc-${title.replace(/\s+/g, '').toLowerCase()}-${index}`;
  return (
    <div
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.96)', transition: `opacity 0.5s ease ${index * 70}ms, transform 0.5s cubic-bezier(0.34,1.56,0.64,1) ${index * 70}ms`, boxShadow: hovered ? `0 10px 36px ${accentColor}30` : '0 1px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}
      className={`${t.card} border ${t.border} rounded-2xl cursor-default`}>
      <div style={{ padding: '12px 14px 8px' }}>
        <div className="flex items-start justify-between mb-2">
          <span className={`${t.subtext} font-semibold uppercase tracking-widest leading-tight`} style={{ fontSize: 10 }}>{title}</span>
          <span style={{ color: accentColor, transform: hovered ? 'scale(1.25) rotate(-8deg)' : 'scale(1)', transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)', opacity: hovered ? 1 : 0.5, flexShrink: 0, marginLeft: 4 }}>{icon}</span>
        </div>
        <p className={`${t.text} font-bold tracking-tight`} style={{ fontSize: 'clamp(0.9rem, 4vw, 1.5rem)', wordBreak: 'break-all', color: hovered ? accentColor : undefined, transition: 'color 0.2s', lineHeight: 1.15, fontFamily: TW_FONT }}>{value}</p>
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

function PostCard({ post, index, colors, t }: { post: any; index: number; colors: any; t: any }) {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const netColor = NETWORK_COLORS[post.network] || NETWORK_COLORS.Default;
  useEffect(() => { const timer = setTimeout(() => setVisible(true), 200 + index * 110); return () => clearTimeout(timer); }, [index]);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(24px)', transition: `opacity 0.45s ease ${index * 90}ms, transform 0.45s ease ${index * 90}ms`, boxShadow: hovered ? '0 6px 24px rgba(0,0,0,0.12)' : '0 1px 3px rgba(0,0,0,0.04)' }}
      className={`${t.card} border ${t.border} rounded-2xl p-4`}>
      <div className="flex items-start gap-3">
        <div style={{ width: 34, height: 34, borderRadius: 10, background: `${netColor}18`, border: `1.5px solid ${netColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: netColor, flexShrink: 0, transform: hovered ? 'scale(1.1) rotate(-5deg)' : 'scale(1)', transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)' }}>
          <NetworkIcon network={post.network} />
        </div>
        <div className="flex-1 min-w-0">
          <p className={`${t.text} text-sm font-medium leading-snug line-clamp-2`}>{post.text}</p>
          <div className="flex items-center gap-3 mt-2">
            <span style={{ color: netColor, fontSize: 11, fontWeight: 700 }}>{post.network}</span>
            <span className={`${t.subtext} text-xs`}>{post.date}</span>
          </div>
        </div>
        {(post.likes !== undefined || post.comments !== undefined) && (
          <div className="flex flex-col gap-1.5 shrink-0 items-end">
            {post.likes    !== undefined && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><ThumbsUp     size={11} style={{ color: colors.ring1 }} /><span style={{ fontSize: 12, fontWeight: 700, color: colors.ring1, fontFamily: TW_FONT }}>{fmtNum(post.likes)}</span></div>}
            {post.comments !== undefined && <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MessageCircle size={11} style={{ color: colors.ring2 }} /><span style={{ fontSize: 12, fontWeight: 700, color: colors.ring2, fontFamily: TW_FONT }}>{fmtNum(post.comments)}</span></div>}
          </div>
        )}
      </div>
      {post.likes !== undefined && (
        <div style={{ marginTop: 10, height: 3, background: colors.track, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: hovered ? `${Math.min((post.likes / 600) * 100, 100)}%` : '0%', background: `linear-gradient(90deg, ${netColor}, ${colors.ring1})`, borderRadius: 2, transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)' }} />
        </div>
      )}
    </div>
  );
}

export function MetricoolMetrics({ dateRange, theme, themeStyles: t }: Props) {
  const [data, setData]       = useState<MetricoolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const searchParams = useSearchParams();
  const colors = ACCENT[theme] ?? ACCENT.light;

  useEffect(() => {
    async function load() {
      setLoading(true); setError(null);
      try {
        const token = searchParams.get('token');
        const companyId = searchParams.get('companyId');
        const mock = searchParams.get('mock') === 'true';
        if (mock) { await new Promise(r => setTimeout(r, 700)); setData(getMockMetricool() as any); return; }
        const authParam = token ? `token=${token}` : `companyId=${companyId}`;
        const res = await fetch(`/api/metricool/metrics?${authParam}&startDate=${dateRange.start}&endDate=${dateRange.end}`);
        if (!res.ok) { const e = await res.json(); throw new Error(e.details || e.error || 'Failed'); }
        setData(await res.json());
      } catch (err: any) { setError(err.message); }
      finally { setLoading(false); }
    }
    load();
  }, [searchParams, dateRange]);

  if (loading) return (
    <div className="flex items-center gap-3 py-10">
      <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${colors.ring1}30`, borderTop: `2px solid ${colors.ring1}`, animation: 'metSpin 0.7s linear infinite' }} />
      <span className={`${t.subtext} text-sm`}>Loading social media…</span>
      <style>{`@keyframes metSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) {
    const m = error?.toLowerCase() ?? '';
    let title = 'Social media unavailable';
    let msg = "We couldn't load your social media data. Please contact your account manager if this continues.";
    if (m.includes('not configured') || m.includes('credentials')) {
      title = 'Social media not connected';
      msg = "Your Metricool account hasn't been linked to this dashboard yet. Ask your account manager to connect it — they'll need your Metricool Blog ID from your account settings.";
    }
    return (
      <div className="space-y-4">
        <h2 className={`${t.text} text-xl font-bold tracking-tight`} style={{ fontFamily: TW_FONT }}>Social Media Performance</h2>
        <div style={{ borderRadius: 16, padding: '28px 32px', border: `1.5px solid ${colors.border}`, background: `${colors.ring1}06`, textAlign: 'center' }}>
          <p className={t.text} style={{ fontWeight: 700, fontSize: 15, marginBottom: 8, fontFamily: TW_FONT }}>{title}</p>
          <p className={t.subtext} style={{ fontSize: 13, lineHeight: 1.6, maxWidth: 460, margin: '0 auto' }}>{msg}</p>
        </div>
      </div>
    );
  }

  if (!data) return <p className={`${t.subtext} text-sm py-4`}>No social media data available for this period.</p>;

  const stats = data.stats || {};
  const posts = data.posts || [];
  const filteredTs = filterSeries(data.timeSeries ?? [], dateRange.start, dateRange.end);

  const dm = filteredTs.length > 0 ? {
    totalFollowers:   filteredTs[filteredTs.length - 1]?.followers ?? stats.totalFollowers,
    totalReach:       filteredTs.reduce((s, d) => s + d.reach, 0),
    totalImpressions: filteredTs.reduce((s, d) => s + d.impressions, 0),
    engagementRate:   +(filteredTs.reduce((s, d) => s + d.engagement, 0) / filteredTs.length).toFixed(2),
    totalPosts:       stats.totalPosts,
    totalShares:      stats.totalShares,
  } : stats;

  const sparks = {
    followers:   filteredTs.map(d => d.followers),
    reach:       filteredTs.map(d => d.reach),
    impressions: filteredTs.map(d => d.impressions),
    engagement:  filteredTs.map(d => d.engagement),
  };

  const accents = [colors.ring1, colors.ring2, colors.ring3, colors.ring4, colors.ring1, colors.ring2];

  return (
    <div className="space-y-8">
      <h2 className={`${t.text} text-xl font-bold tracking-tight`} style={{ fontFamily: TW_FONT }}>Social Media Performance</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
        <SocialCard title="Followers"   value={fmtNum(dm.totalFollowers)}                                    icon={<Users size={15}/>}    index={0} accentColor={accents[0]} t={t} sparkData={sparks.followers} />
        <SocialCard title="Total Posts" value={fmtNum(dm.totalPosts)}                                        icon={<FileText size={15}/>} index={1} accentColor={accents[1]} t={t} />
        <SocialCard title="Total Reach" value={fmtNum(dm.totalReach)}                                        icon={<Eye size={15}/>}      index={2} accentColor={accents[2]} t={t} sparkData={sparks.reach} />
        <SocialCard title="Engagement"  value={dm.engagementRate ? `${dm.engagementRate.toFixed(2)}%` : '—'} icon={<Heart size={15}/>}    index={3} accentColor={accents[3]} t={t} sparkData={sparks.engagement} />
        <SocialCard title="Impressions" value={fmtNum(dm.totalImpressions)}                                  icon={<Radio size={15}/>}    index={4} accentColor={accents[4]} t={t} sparkData={sparks.impressions} />
        <SocialCard title="Shares"      value={fmtNum(dm.totalShares)}                                       icon={<Share2 size={15}/>}   index={5} accentColor={accents[5]} t={t} />
      </div>
      {posts.length > 0 && (
        <div>
          <h3 className={`${t.text} text-base font-bold mb-4`} style={{ fontFamily: TW_FONT }}>Recent Posts</h3>
          <div className="space-y-3">
            {posts.slice(0, 5).map((post: any, i: number) => <PostCard key={i} post={post} index={i} colors={colors} t={t} />)}
          </div>
        </div>
      )}
    </div>
  );
}