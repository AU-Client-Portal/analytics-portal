import { GA4Dashboard } from '@/app/components/GA4Dashboard';
import { TokenGate } from '@/components/TokenGate';

export const revalidate = 180;

async function Content({ searchParams }: { searchParams: SearchParams }) {
  return <GA4Dashboard />;
}

export default function Home({ searchParams }: { searchParams: SearchParams }) {
  return (
    <TokenGate searchParams={searchParams}>
      <Content searchParams={searchParams} />
    </TokenGate>
  );
}