'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { MousePointerClick, Eye, TrendingUp, DollarSign, Target, Award, Percent, Calculator, AlertCircle, Settings, LinkIcon } from 'lucide-react';
import { MOCK_GOOGLE_ADS } from './mockData';
import type { Theme } from './GA4Dashboard';

const USE_MOCK = false;

interface GoogleAdsData {
  companyId: string; companyName: string; customerId: string;
  hasGoogleAds?: boolean; message?: string;
  dateRange: { startDate: string; endDate: string };
  metrics?: {
    impressions: number; clicks: number; ctr: number; cost: number;
    conversions: number; conversionsValue: number; averageCpc: number;
  };
  campaigns?: Array<{
    id: string; name: string; status: string;
    impressions: number; clicks: number; ctr: number;
    cost: number; conversions: number; conversionsValue: number;
  }>;
}

interface Props {
  dateRange: { start: string; end: string };
  theme: Theme;
  themeStyles: any;
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

type AdsErrorType = 'not_configured' | 'no_permission' | 'missing_env' | 'generic';

function classifyAdsError(message: string): AdsErrorType {
  const m = message?.toLowerCase() ?? '';
  if (m.includes('google ads is not configured')) return 'not_configured';
  if (m.includes("doesn't have permission") || m.includes('login-customer-id') || m.includes('permission')) return 'no_permission';
  if (m.includes('server configuration error') || m.includes('missing')) return 'missing_env';
  return 'generic';
}

function AdsErrorState({ error, colors, t }: { error: string; colors: any; t: any }) {
  const type = classifyAdsError(error);

  const containerStyle = {
    borderRadius: 16,
    padding: '24px 28px',
    border: `1.5px solid ${colors.border}`,
    background: `${colors.ring1}06`,
  };

  const Step = ({ n, children }: { n: number; children: React.ReactNode }) => (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
      <span style={{
        flexShrink: 0, width: 20, height: 20, borderRadius: '50%',
        background: `${colors.ring1}20`, color: colors.ring1,
        fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginTop: 1,
      }}>{n}</span>
      <span className={t.subtext} style={{ fontSize: 13, lineHeight: 1.5 }}>{children}</span>
    </div>
  );

  const Code = ({ children }: { children: React.ReactNode }) => (
    <code style={{ background: `${colors.ring1}15`, color: colors.ring1, fontSize: 11, padding: '1px 6px', borderRadius: 4 }}>{children}</code>
  );

  if (type === 'not_configured') return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${colors.ring1}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Target size={18} style={{ color: colors.ring1 }} />
        </div>
        <div>
          <p className={t.text} style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Google Ads not connected</p>
          <p className={t.subtext} style={{ fontSize: 12, margin: 0 }}>Customer ID missing in Assembly CRM</p>
        </div>
      </div>
      <Step n={1}>Open this client&apos;s company record in Assembly CRM</Step>
      <Step n={2}>Add custom field <Code>adsCustomerId</Code> with their 10-digit Google Ads ID — no dashes</Step>
      <Step n={3}>Find their ID in the top-right corner of <Code>ads.google.com</Code></Step>
    </div>
  );

  if (type === 'no_permission') return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${colors.ring2}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LinkIcon size={18} style={{ color: colors.ring2 }} />
        </div>
        <div>
          <p className={t.text} style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Manager account access required</p>
          <p className={t.subtext} style={{ fontSize: 12, margin: 0 }}>Art Unlimited needs permission to access this account</p>
        </div>
      </div>
      <Step n={1}>Log into the Art Unlimited Google Ads Manager account</Step>
      <Step n={2}>Go to <Code>Accounts → Sub-accounts</Code> → click <Code>+</Code> → Request access</Step>
      <Step n={3}>Enter the client&apos;s customer ID and submit</Step>
      <Step n={4}>Client approves the request via the email they receive</Step>
    </div>
  );

  if (type === 'missing_env') return (
    <div style={containerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${colors.ring3}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Settings size={18} style={{ color: colors.ring3 }} />
        </div>
        <div>
          <p className={t.text} style={{ fontWeight: 700, fontSize: 15, margin: 0 }}>Google Ads API not configured</p>
          <p className={t.subtext} style={{ fontSize: 12, margin: 0 }}>Missing environment variables in Vercel</p>
        </div>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {['GOOGLE_ADS_CLIENT_ID', 'GOOGLE_ADS_CLIENT_SECRET', 'GOOGLE_ADS_DEVELOPER_TOKEN', 'GOOGLE_ADS_REFRESH_TOKEN'].map(v => (
          <Code key={v}>{v}</Code>
        ))}
      </div>
      <p className={t.subtext} style={{ fontSize: 11, marginTop: 10 }}>Vercel → Project → Settings → Environment Variables</p>
    </div>
  );

  return (
    <div style={{ ...containerStyle, background: '#fef2f225', border: '1.5px solid #fca5a5' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
        <p style={{ color: '#dc2626', fontWeight: 700, fontSize: 14, margin: 0 }}>Google Ads error</p>
      </div>
      <p style={{ color: '#ef4444', fontSize: 12, margin: 0 }}>{error}</p>
    </div>
  );
}

function AdMetricCard({ title, value, sub, icon, index, accentColor, t }: {
  title: string; value: string; sub?: string; icon: React.ReactNode;
  index: number; accentColor: string; t: any;
}) {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), index * 80);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(18px) scale(0.97)',
        transition: 'opacity 0.45s ease, transform 0.45s cubic-bezier(0.34,1.56,0.64,1)',
        transitionDelay: `${index * 60}ms`,
        boxShadow: hovered ? `0 8px 32px ${accentColor}25` : '0 1px 4px rgba(0,0,0,0.06)',
        borderColor: hovered ? accentColor : undefined,
      }}
      className={`${t.card} border ${t.border} rounded-2xl p-3 md:p-5 cursor-default group`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className={`${t.subtext} font-semibold uppercase tracking-widest leading-tight`} style={{ fontSize: 10 }}>{title}</span>
        <span style={{ color: accentColor, opacity: hovered ? 1 : 0.45, transition: 'opacity 0.2s, transform 0.3s', transform: hovered ? 'scale(1.2) rotate(-6deg)' : 'scale(1)', flexShrink: 0, marginLeft: 4 }}>
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
      {sub && <p className={`${t.subtext} mt-1`} style={{ fontSize: 10 }}>{sub}</p>}
    </div>
  );
}

function CampaignRow({ campaign, maxCost, maxConv, index, colors, t }: {
  campaign: any; maxCost: number; maxConv: number; index: number; colors: any; t: any;
}) {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(false);
  const costPct = maxCost > 0 ? (campaign.cost / maxCost) * 100 : 0;
  const convPct = maxConv > 0 ? (campaign.conversions / maxConv) * 100 : 0;
  const roas = campaign.cost > 0 ? (campaign.conversionsValue / campaign.cost).toFixed(2) : '—';

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 300 + index * 100);
    return () => clearTimeout(timer);
  }, [index]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(-20px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease, background 0.2s',
        transitionDelay: `${index * 80}ms`,
        background: hovered ? `${colors.border}40` : 'transparent',
        borderRadius: 12,
        padding: '14px 16px',
      }}
    >
      <div className="flex items-center justify-between mb-2 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: colors.ring1, flexShrink: 0 }} />
          <span className={`${t.text} text-sm font-semibold truncate`}>{campaign.name}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span style={{ color: colors.ring2, fontSize: 12, fontWeight: 700 }}>{fmtCurrency(campaign.cost)}</span>
          <span style={{ color: colors.ring1, fontSize: 12, fontWeight: 700 }}>{campaign.conversions} conv.</span>
          <span className={`${t.subtext}`} style={{ fontSize: 11 }}>ROAS {roas}×</span>
        </div>
      </div>
      <div className="space-y-1.5">
        <div style={{ height: 5, background: colors.track, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: visible ? `${costPct}%` : '0%', background: colors.ring2, borderRadius: 3, transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)', transitionDelay: `${400 + index * 80}ms` }} />
        </div>
        <div style={{ height: 5, background: colors.track, borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: visible ? `${convPct}%` : '0%', background: colors.ring1, borderRadius: 3, transition: 'width 0.9s cubic-bezier(0.4,0,0.2,1)', transitionDelay: `${500 + index * 80}ms` }} />
        </div>
      </div>
      <div className="flex gap-4 mt-1.5">
        <span className={`${t.subtext}`} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: 2, background: colors.ring2, display: 'inline-block' }} /> Cost
        </span>
        <span className={`${t.subtext}`} style={{ fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: 2, background: colors.ring1, display: 'inline-block' }} /> Conversions
        </span>
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
  const [data, setData] = useState<GoogleAdsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const colors = ACCENT[theme] ?? ACCENT.forest;

  useEffect(() => {
    async function fetch_() {
      setLoading(true); setError(null);
      try {
        if (USE_MOCK) {
          await new Promise(r => setTimeout(r, 500));
          setData(MOCK_GOOGLE_ADS as any);
          return;
        }
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

  if (error) return (
    <div className="space-y-3">
      <div>
        <h2 className={`${t.text} text-xl font-bold tracking-tight`}>Google Ads Performance</h2>
        <p className={`${t.subtext} text-xs mt-0.5`}>Setup required</p>
      </div>
      <AdsErrorState error={error} colors={colors} t={t} />
    </div>
  );

  if (data?.hasGoogleAds === false) return (
    <div className="space-y-3">
      <h2 className={`${t.text} text-xl font-bold tracking-tight`}>Google Ads Performance</h2>
      <AdsErrorState error="Google Ads is not configured for your account." colors={colors} t={t} />
    </div>
  );

  if (!data?.metrics) return <p className={`${t.subtext} text-sm py-4`}>No Google Ads data available.</p>;

  const m = data.metrics;
  const campaigns = data.campaigns || [];
  const maxCost = Math.max(...campaigns.map(c => c.cost), 1);
  const maxConv = Math.max(...campaigns.map(c => c.conversions), 1);
  const costPerConv = m.conversions > 0 ? m.cost / m.conversions : 0;
  const roas = m.cost > 0 ? m.conversionsValue / m.cost : 0;
  const cardAccents = [colors.ring1, colors.ring2, colors.ring3, colors.ring4, colors.ring1, colors.ring2, colors.ring3, colors.ring4];

  return (
    <div className="space-y-8">
      <div>
        <h2 className={`${t.text} text-xl font-bold tracking-tight`}>Google Ads Performance</h2>
        <p className={`${t.subtext} text-xs mt-0.5`}>Customer ID: {data.customerId}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        <AdMetricCard title="Impressions"  value={fmtNum(m.impressions)}                    icon={<Eye size={15}/>}               index={0} accentColor={cardAccents[0]} t={t} />
        <AdMetricCard title="Clicks"       value={fmtNum(m.clicks)}                         icon={<MousePointerClick size={15}/>}  index={1} accentColor={cardAccents[1]} t={t} />
        <AdMetricCard title="CTR"          value={`${m.ctr.toFixed(2)}%`}                   icon={<Percent size={15}/>}            index={2} accentColor={cardAccents[2]} t={t} />
        <AdMetricCard title="Total Spend"  value={fmtCurrency(m.cost)}                      icon={<DollarSign size={15}/>}         index={3} accentColor={cardAccents[3]} t={t} />
        <AdMetricCard title="Conversions"  value={m.conversions.toFixed(0)}                 icon={<Target size={15}/>}             index={4} accentColor={cardAccents[4]} t={t} />
        <AdMetricCard title="Conv. Value"  value={fmtCurrency(m.conversionsValue)}          icon={<Award size={15}/>}              index={5} accentColor={cardAccents[5]} t={t} />
        <AdMetricCard title="Avg CPC"      value={`$${m.averageCpc.toFixed(2)}`}            icon={<TrendingUp size={15}/>}         index={6} accentColor={cardAccents[6]} t={t} />
        <AdMetricCard
          title="Cost / Conv."
          value={costPerConv > 0 ? `$${costPerConv.toFixed(2)}` : '—'}
          sub={roas > 0 ? `${roas.toFixed(2)}× ROAS` : undefined}
          icon={<Calculator size={15}/>}
          index={7} accentColor={cardAccents[7]} t={t}
        />
      </div>

      {campaigns.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className={`${t.text} text-base font-bold`}>Campaign Breakdown</h3>
            <div className="flex gap-4" style={{ color: t.subtext }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                <span style={{ width: 10, height: 4, borderRadius: 2, background: colors.ring2, display: 'inline-block' }} /> Spend
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                <span style={{ width: 10, height: 4, borderRadius: 2, background: colors.ring1, display: 'inline-block' }} /> Conversions
              </span>
            </div>
          </div>
          <div className="space-y-1">
            {campaigns.map((c, i) => (
              <CampaignRow key={c.id} campaign={c} maxCost={maxCost} maxConv={maxConv} index={i} colors={colors} t={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}