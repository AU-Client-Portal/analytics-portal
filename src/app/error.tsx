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

  if (m.includes('session token is required') || m.includes('no_token')) return 'auth';
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

function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-left mb-2">
      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#d4b896] text-[#2c1a0e] text-xs font-semibold flex items-center justify-center mt-0.5">
        {number}
      </span>
      <span className="text-[#7a5c3a] text-sm leading-relaxed">{children}</span>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="inline-block bg-[#e8d5b7] text-[#2c1a0e] text-xs rounded px-1.5 py-0.5 break-all">
      {children}
    </code>
  );
}

function ErrorContent({ type, message }: { type: ErrorType; message: string }) {
  switch (type) {
    case 'auth':
      return (
        <>
          <LockIcon />
          <p className="text-[#2c1a0e] font-bold text-lg mb-2 mt-3">Access token required</p>
          <p className="text-[#7a5c3a] text-sm leading-relaxed mb-3">
            This dashboard must be opened through your Assembly client portal — not directly via URL.
          </p>
          <p className="text-[#7a5c3a] text-xs">
            Contact your account manager if you need your portal link.
          </p>
        </>
      );

    case 'ga4_not_configured':
      return (
        <>
          <PlugIcon />
          <p className="text-[#2c1a0e] font-bold text-lg mb-2 mt-3">GA4 not connected</p>
          <p className="text-[#7a5c3a] text-sm mb-4">
            A GA4 Property ID hasn&apos;t been added for this account. To fix this:
          </p>
          <Step number={1}>Open this client&apos;s company record in Assembly CRM</Step>
          <Step number={2}>Add the custom field <Code>ga4PropertyId</Code> with their Google Analytics Property ID (numbers only)</Step>
          <Step number={3}>Find the Property ID in GA4 → Admin → Property Settings</Step>
        </>
      );

    case 'ads_not_configured':
      return (
        <>
          <PlugIcon />
          <p className="text-[#2c1a0e] font-bold text-lg mb-2 mt-3">Google Ads not connected</p>
          <p className="text-[#7a5c3a] text-sm mb-4">
            A Google Ads customer ID hasn&apos;t been added for this account. To fix this:
          </p>
          <Step number={1}>Open this client&apos;s company record in Assembly CRM</Step>
          <Step number={2}>Add the custom field <Code>adsCustomerId</Code> with their 10-digit Google Ads ID — no dashes</Step>
          <Step number={3}>Find the customer ID in the top right corner of their Google Ads account</Step>
        </>
      );

    case 'metricool_not_configured':
      return (
        <>
          <PlugIcon />
          <p className="text-[#2c1a0e] font-bold text-lg mb-2 mt-3">Metricool not connected</p>
          <p className="text-[#7a5c3a] text-sm mb-4">
            A Metricool Blog ID hasn&apos;t been added for this account. To fix this:
          </p>
          <Step number={1}>Open this client&apos;s company record in Assembly CRM</Step>
          <Step number={2}>Add the custom field <Code>metricoolBlogId</Code> with their Metricool profile/blog ID</Step>
        </>
      );

    case 'ga4_permission':
      return (
        <>
          <PlugIcon />
          <p className="text-[#2c1a0e] font-bold text-lg mb-2 mt-3">GA4 access not granted</p>
          <p className="text-[#7a5c3a] text-sm mb-4">
            The service account doesn&apos;t have permission to access this GA4 property. The client needs to grant access:
          </p>
          <Step number={1}>Client goes to <Code>analytics.google.com</Code> → Admin → Property Access Management</Step>
          <Step number={2}>Click <Code>+</Code> → Add users</Step>
          <Step number={3}>Enter <Code>wordpress-portal-v2@client-portal-au-site.iam.gserviceaccount.com</Code> with Viewer role</Step>
          <Step number={4}>Make sure it&apos;s added at the Property level, not just Account level</Step>
        </>
      );

    case 'ads_permission':
      return (
        <>
          <PlugIcon />
          <p className="text-[#2c1a0e] font-bold text-lg mb-2 mt-3">Google Ads access not granted</p>
          <p className="text-[#7a5c3a] text-sm mb-4">
            The Art Unlimited manager account doesn&apos;t have permission to access this client&apos;s Google Ads. To fix this:
          </p>
          <Step number={1}>Log into the Art Unlimited Google Ads Manager account</Step>
          <Step number={2}>Go to Accounts → Sub-accounts → click <Code>+</Code> → Request access to existing account</Step>
          <Step number={3}>Enter the client&apos;s customer ID</Step>
          <Step number={4}>Client approves the request via the email they receive</Step>
        </>
      );

    case 'ads_missing_env':
      return (
        <>
          <WarningIcon />
          <p className="text-[#2c1a0e] font-bold text-lg mb-2 mt-3">Google Ads not configured</p>
          <p className="text-[#7a5c3a] text-sm mb-4">
            One or more Google Ads environment variables are missing in Vercel. Check that all of these are set:
          </p>
          <div className="text-left w-full space-y-1 mb-2">
            {['GOOGLE_ADS_CLIENT_ID', 'GOOGLE_ADS_CLIENT_SECRET', 'GOOGLE_ADS_DEVELOPER_TOKEN', 'GOOGLE_ADS_REFRESH_TOKEN'].map(v => (
              <div key={v}><Code>{v}</Code></div>
            ))}
          </div>
          <p className="text-[#7a5c3a] text-xs mt-2">Vercel → Project → Settings → Environment Variables</p>
        </>
      );

    case 'metricool_credentials':
      return (
        <>
          <WarningIcon />
          <p className="text-[#2c1a0e] font-bold text-lg mb-2 mt-3">Metricool credentials missing</p>
          <p className="text-[#7a5c3a] text-sm mb-4">
            Metricool API credentials are not set in Vercel. Add these environment variables:
          </p>
          <div className="text-left w-full space-y-1">
            <div><Code>METRICOOL_USER_ID</Code></div>
            <div><Code>METRICOOL_API_TOKEN</Code></div>
          </div>
          <p className="text-[#7a5c3a] text-xs mt-3">Vercel → Project → Settings → Environment Variables</p>
        </>
      );

    default:
      return (
        <>
          <WarningIcon />
          <p className="text-[#2c1a0e] font-bold text-lg mb-2 mt-3">Something went wrong</p>
          <p className="text-[#7a5c3a] text-sm leading-relaxed">
            {message || 'An unexpected error occurred.'}
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