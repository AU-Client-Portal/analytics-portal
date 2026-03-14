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
        <div style={{ marginBottom: 12 }}>
          {isAuthError ? (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#7a5c3a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          ) : (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#7a5c3a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          )}
        </div>

        <p className="text-[#2c1a0e] font-bold text-lg mb-2">
          {isAuthError ? 'Access token required' : 'Something went wrong'}
        </p>

        {isAuthError ? (
          <>
            <code className="block text-xs bg-[#e8d5b7] text-[#2c1a0e] rounded-lg px-4 py-3 break-all mb-4 w-full text-left">
              {error.message}
            </code>
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