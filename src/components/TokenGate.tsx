export function TokenGate({
  children,
  searchParams,
}: {
  children: React.ReactNode;
  searchParams: SearchParams;
}) {
  const hasToken = !!searchParams.token;
  const hasCompanyId = !!searchParams.companyId;
  const isMock = searchParams.mock === 'true';

  if (!hasToken && !hasCompanyId && !isMock && process.env.COPILOT_ENV !== 'local') {
    throw new Error(
      'Session Token is required, guide available at: https://docs.copilot.app/docs/custom-apps-setting-up-the-sdk#session-tokens',
    );
  }

  return children;
}