import { GA4Dashboard } from '@/app/components/GA4Dashboard';

export const revalidate = 180;

export default function Home({ searchParams }: { searchParams: SearchParams }) {
  return <GA4Dashboard />;
}