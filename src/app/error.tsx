'use client';

type ErrorType =
  | 'auth'
  | 'ga4_not_configured'
  | 'ads_not_configured'
  | 'metricool_not_configured'
  | 'ga4_permission'
  | 'ads_permission'
  | 'ads_missing_env'
  | 'metricool_credentials'
  | 'generic';

function classifyError(message: string): ErrorType {
  const m = message?.toLowerCase() ?? '';
  if (m.includes('session token is required') || m.includes('no_token') || m.includes('unauthorized') || m.includes('token') && m.includes('required')) return 'auth';
  if (m.includes('ga4 is not configured')) return 'ga4_not_configured';
  if (m.includes('google ads is not configured')) return 'ads_not_configured';
  if (m.includes('metricool is not configured')) return 'metricool_not_configured';
  if (m.includes('unauthenticated') || m.includes('permission_denied') || (m.includes('ga4') && m.includes('permission'))) return 'ga4_permission';
  if (m.includes("doesn't have permission") || m.includes('login-customer-id') || (m.includes('ads') && m.includes('permission'))) return 'ads_permission';
  if (m.includes('server configuration error') || m.includes('missing') && m.includes('google_ads')) return 'ads_missing_env';
  if (m.includes('metricool credentials')) return 'metricool_credentials';
  return 'generic';
}

const LockIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#7a5c3a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const WarningIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#7a5c3a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const PlugIcon = () => (
  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#7a5c3a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6L6 18"/>
    <path d="M7 6v5a5 5 0 0 0 10 0V6"/>
    <line x1="8" y1="2" x2="8" y2="6"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
  </svg>
);

function ErrorContent({ type, message }: { type: ErrorType; message: string }) {
  switch (type) {
    case 'auth':
      return (
        <>
          <LockIcon />
          <p className="text-[#2c1a0e] font-bold text-lg mb-2 mt-3">Access required</p>
          <p className="text-[#7a5c3a] text-sm leading-relaxed">
            This dashboard can only be accessed through your personalised portal link. Please contact your account manager if you need help getting in.
          </p>
        </>
      );

    case 'ga4_not_configured':
    case 'ga4_permission':
      return (
        <>
          <PlugIcon />
          <p className="text-[#2c1a0e] font-bold text-lg mb-2 mt-3">Website analytics unavailable</p>
          <p className="text-[#7a5c3a] text-sm leading-relaxed">
            Your Google Analytics hasn&apos;t been connected to this dashboard yet. Please reach out to your account manager to get this set up.
          </p>
        </>
      );

    case 'ads_not_configured':
    case 'ads_permission':
    case 'ads_missing_env':
      return (
        <>
          <PlugIcon />
          <p className="text-[#2c1a0e] font-bold text-lg mb-2 mt-3">Google Ads unavailable</p>
          <p className="text-[#7a5c3a] text-sm leading-relaxed">
            Your Google Ads account hasn&apos;t been connected to this dashboard yet. Please reach out to your account manager to get this set up.
          </p>
        </>
      );

    case 'metricool_not_configured':
    case 'metricool_credentials':
      return (
        <>
          <PlugIcon />
          <p className="text-[#2c1a0e] font-bold text-lg mb-2 mt-3">Social media unavailable</p>
          <p className="text-[#7a5c3a] text-sm leading-relaxed">
            Your social media accounts haven&apos;t been connected to this dashboard yet. Please reach out to your account manager to get this set up.
          </p>
        </>
      );

    default:
      return (
        <>
          <WarningIcon />
          <p className="text-[#2c1a0e] font-bold text-lg mb-2 mt-3">Something went wrong</p>
          <p className="text-[#7a5c3a] text-sm leading-relaxed">
            We ran into an unexpected issue loading your dashboard. Please contact your account manager if this keeps happening.
          </p>
        </>
      );
  }
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const type = classifyError(error.message);
  const showRetry = type === 'generic';

  return (
    <main className="flex flex-col min-h-screen items-center justify-center p-8 bg-[#f0e8d8]">
      <div className="flex flex-col items-center max-w-md w-full bg-[#faf4e8] border border-[#d4b896] rounded-2xl p-10 shadow-lg text-center">
        <ErrorContent type={type} message={error.message} />
        {showRetry && (
          <button
            className="mt-6 bg-[#003F27] text-[#e8d5b7] rounded-xl py-2 px-6 text-sm font-semibold hover:bg-[#005538] transition-colors"
            onClick={() => reset()}
          >
            Try again
          </button>
        )}
      </div>
    </main>
  );
}