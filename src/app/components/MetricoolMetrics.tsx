'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Users, FileText, Heart, Radio, ThumbsUp, MessageCircle, Instagram, Linkedin, Facebook, Twitter, Share2, Eye } from 'lucide-react';
import { MOCK_METRICOOL } from './mockData';
import type { Theme } from './GA4Dashboard';

const USE_MOCK = false;

interface MetricoolData {
  companyId: string; companyName: string; blogId: string;
  dateRange: { startDate: string; endDate: string };
  profile: any; stats: any; posts: any[];
}

interface Props {
  dateRange: { start: string; end: string };
  theme: Theme;
  themeStyles: any;
}

const ACCENT: Record<Theme, { ring1: string; ring2: string; ring3: string; ring4: string; track: string; border: string }> = {
  light:  { ring1: '#003F27', ring2: '#f59e0b', ring3: '#ef4444', ring4: '#3b82f6', track: '#e8ecf0', border: '#dde2e8' },
  dark:   { ring1: '#4ade80', ring2: '#fbbf24', ring3: '#f87171', ring4: '#60a5fa', track: '#2c3040', border: '#2c3040' },
  forest: { ring1: '#003F27', ring2: '#b5832a', ring3: '#9b4a20', ring4: '#5a8fa8', track: '#e8d5b7', border: '#d4b896' },
};

const NETWORK_COLORS: Record<string, string> = {
  Instagram: '#e1306c', Facebook: '#1877f2', LinkedIn: '#0a66c2', Twitter: '#1da1f2', Default: '#6b7a8d',
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

function SocialCard({ title, value, icon, index, accentColor, t }: {
  title: string; value: string; icon: React.ReactNode;
  index: number; accentColor: string; t: any;
}) {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 90);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.96)',
        transition: 'opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1)',
        transitionDelay: `${index * 70}ms`,
        boxShadow: hovered ? `0 10px 36px ${accentColor}30` : '0 1px 4px rgba(0,0,0,0.05)',
        borderColor: hovered ? accentColor : undefined,
      }}
      className={`${t.card} border ${t.border} rounded-2xl p-3 md:p-5 cursor-default`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className={`${t.subtext} font-semibold uppercase tracking-widest leading-tight`} style={{ fontSize: 10 }}>{title}</span>
        <span style={{ color: accentColor, transform: hovered ? 'scale(1.25) rotate(-8deg)' : 'scale(1)', transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)', opacity: hovered ? 1 : 0.5, flexShrink: 0, marginLeft: 4 }}>
          {icon}
        </span>
      </div>
      <p
        className={`${t.text} font-bold tracking-tight`}
        style={{
          fontSize: 'clamp(0.9rem, 4vw, 1.5rem)',
          wordBreak: 'break-all',
          color: hovered ? accentColor : undefined,
          transition: 'color 0.2s',
          lineHeight: 1.15,
        }}
      >
        {value}
      </p>
    </div>
  );
}

function PostCard({ post, index, colors, t }: { post: any; index: number; colors: any; t: any }) {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const netColor = NETWORK_COLORS[post.network] || NETWORK_COLORS.Default;

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 200 + index * 110);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(24px)',
        transition: 'opacity 0.45s ease, transform 0.45s ease',
        transitionDelay: `${index * 90}ms`,
        boxShadow: hovered ? '0 6px 24px rgba(0,0,0,0.12)' : '0 1px 3px rgba(0,0,0,0.04)',
      }}
      className={`${t.card} border ${t.border} rounded-2xl p-4`}
    >
      <div className="flex items-start gap-3">
        <div style={{
          width: 34, height: 34, borderRadius: 10, background: `${netColor}18`,
          border: `1.5px solid ${netColor}40`, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: netColor, flexShrink: 0,
          transform: hovered ? 'scale(1.1) rotate(-5deg)' : 'scale(1)',
          transition: 'transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
        }}>
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
            {post.likes !== undefined && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <ThumbsUp size={11} style={{ color: colors.ring1 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: colors.ring1 }}>{fmtNum(post.likes)}</span>
              </div>
            )}
            {post.comments !== undefined && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <MessageCircle size={11} style={{ color: colors.ring2 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: colors.ring2 }}>{fmtNum(post.comments)}</span>
              </div>
            )}
          </div>
        )}
      </div>
      {post.likes !== undefined && (
        <div style={{ marginTop: 10, height: 3, background: colors.track, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: hovered ? `${Math.min((post.likes / 600) * 100, 100)}%` : '0%',
            background: `linear-gradient(90deg, ${netColor}, ${colors.ring1})`,
            borderRadius: 2,
            transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
          }} />
        </div>
      )}
    </div>
  );
}

export function MetricoolMetrics({ dateRange, theme, themeStyles: t }: Props) {
  const [data, setData] = useState<MetricoolData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const colors = ACCENT[theme] ?? ACCENT.forest;

  useEffect(() => {
    async function fetch_() {
      setLoading(true); setError(null);
      try {
        if (USE_MOCK) {
          await new Promise(r => setTimeout(r, 700));
          setData(MOCK_METRICOOL as any);
          return;
        }
        const token = searchParams.get('token');
        const res = await fetch(`/api/metricool/metrics?token=${token}&startDate=${dateRange.start}&endDate=${dateRange.end}`);
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Failed'); }
        setData(await res.json());
      } catch (err: any) { setError(err.message); }
      finally { setLoading(false); }
    }
    fetch_();
  }, [searchParams, dateRange]);

  if (loading) return (
    <div className="flex items-center gap-3 py-10">
      <div style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${colors.ring1}30`, borderTop: `2px solid ${colors.ring1}`, animation: 'spin 0.7s linear infinite' }} />
      <span className={`${t.subtext} text-sm`}>Loading social media…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (error) return (
    <div className="rounded-2xl border border-red-300 p-5" style={{ background: '#fef2f2' }}>
      <p className="text-red-600 font-semibold text-sm">Metricool error</p>
      <p className="text-red-500 text-xs mt-1">{error}</p>
    </div>
  );

  if (!data) return <p className={`${t.subtext} text-sm py-4`}>No social media data available.</p>;

  const stats = data.stats || {};
  const posts = data.posts || [];
  const cardAccents = [colors.ring1, colors.ring2, colors.ring3, colors.ring4, colors.ring1, colors.ring2];

  return (
    <div className="space-y-8">
      <div>
        <h2 className={`${t.text} text-xl font-bold tracking-tight`}>Social Media Performance</h2>
        <p className={`${t.subtext} text-xs mt-0.5`}>Powered by Metricool · Blog ID: {data.blogId}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
        <SocialCard title="Followers"    value={fmtNum(stats.totalFollowers)}                                  icon={<Users size={15}/>}    index={0} accentColor={cardAccents[0]} t={t} />
        <SocialCard title="Total Posts"  value={fmtNum(stats.totalPosts)}                                      icon={<FileText size={15}/>} index={1} accentColor={cardAccents[1]} t={t} />
        <SocialCard title="Total Reach"  value={fmtNum(stats.totalReach)}                                      icon={<Eye size={15}/>}      index={2} accentColor={cardAccents[2]} t={t} />
        <SocialCard title="Engagement"   value={stats.engagementRate ? `${stats.engagementRate.toFixed(2)}%` : '—'} icon={<Heart size={15}/>}  index={3} accentColor={cardAccents[3]} t={t} />
        <SocialCard title="Impressions"  value={fmtNum(stats.totalImpressions)}                                icon={<Radio size={15}/>}    index={4} accentColor={cardAccents[4]} t={t} />
        <SocialCard title="Shares"       value={fmtNum(stats.totalShares)}                                     icon={<Share2 size={15}/>}   index={5} accentColor={cardAccents[5]} t={t} />
      </div>

      {posts.length > 0 && (
        <div>
          <h3 className={`${t.text} text-base font-bold mb-4`}>Recent Posts</h3>
          <div className="space-y-3">
            {posts.slice(0, 5).map((post: any, i: number) => (
              <PostCard key={i} post={post} index={i} colors={colors} t={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}