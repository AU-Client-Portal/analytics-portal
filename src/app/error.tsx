'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const isAuthError =
    error.message?.toLowerCase().includes('token') ||
    error.message?.toLowerCase().includes('unauthorized') ||
    error.message?.toLowerCase().includes('forbidden') ||
    error.message?.toLowerCase().includes('no_token');

  return (
    <main className="flex flex-col min-h-screen items-center justify-center p-8 bg-[#f0e8d8]">
      <div className="flex flex-col items-center max-w-md w-full bg-[#faf4e8] border border-[#d4b896] rounded-2xl p-10 shadow-lg text-center">
        <div style={{ fontSize: 40, marginBottom: 12 }}>
          {isAuthError ? '🔒' : '⚠️'}
        </div>

        <p className="text-[#2c1a0e] font-bold text-lg mb-2">
          {isAuthError ? 'Access token required' : 'Something went wrong'}
        </p>

        {isAuthError ? (
          <>
            <p className="text-[#7a5c3a] text-sm leading-relaxed mb-4">
              This dashboard requires a valid access token. Use the personalised link provided to you — it should look like:
            </p>
            <code className="block text-xs bg-[#e8d5b7] text-[#2c1a0e] rounded-lg px-4 py-3 break-all mb-4 w-full text-left">
              yourdomain.com/dashboard?token=YOUR_TOKEN
            </code>
            <p className="text-[#7a5c3a] text-xs">
              Contact your account manager if you need help accessing your dashboard.
            </p>
          </>
        ) : (
          <>
            <p className="text-[#7a5c3a] text-sm mb-6 leading-relaxed">
              {error.message || 'An unexpected error occurred.'}
            </p>
            <button
              className="bg-[#003F27] text-[#e8d5b7] rounded-xl py-2 px-6 text-sm font-semibold hover:bg-[#005538] transition-colors"
              onClick={() => reset()}
            >
              Try again
            </button>
          </>
        )}
      </div>
    </main>
  );
}