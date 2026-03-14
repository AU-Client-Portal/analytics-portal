import { NextResponse } from 'next/server';

let cached: any = null;

export async function GET() {
  if (cached) return NextResponse.json(cached);
  const res = await fetch('https://unpkg.com/world-atlas@2/countries-110m.json');
  if (!res.ok) return NextResponse.json({ error: 'Failed to fetch geo data' }, { status: 500 });
  cached = await res.json();
  return NextResponse.json(cached);
}
