import { Container } from '@/components/Container';
import { Demo } from '@/app/bridge/demo';
import { getSessionFromRoute } from '@/lib/session';

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = new URLSearchParams(
    Object.entries(searchParams as Record<string, string>)
  );

  const session = await getSessionFromRoute(params);

  const portalUrl = (session.workspace as any)?.portalUrl ?? '';

  return (
    <Container className="max-w-screen-lg">
      <Demo portalUrl={portalUrl} />
    </Container>
  );
}