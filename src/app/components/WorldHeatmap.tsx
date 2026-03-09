'use client';

import { useState, useEffect, ReactNode } from 'react';

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

const COUNTRY_NAME_MAP: Record<string, string> = {
  'United States': 'United States of America',
  'South Korea': 'South Korea',
};

const THEME_MAP = {
  light: {
    ocean: '#dde8f0', base: '#ccd8e2', low: '#8fb8cc', mid: '#3a7a96', high: '#003F27',
    hover: '#005538', border: '#b0c8d8',
    tooltip: { bg: '#f8fafc', border: '#ccd8e2', text: '#1a2e3b', sub: '#3a7a96' },
    rank: { bg: '#f1f5f8', border: '#ccd8e2', text: '#1a2e3b', dim: '#6a8a9a', accent: '#003F27' },
    legendDim: '#6a8a9a',
  },
  dark: {
    ocean: '#0d1117', base: '#1a2535', low: '#1e3d2e', mid: '#2a6644', high: '#00a855',
    hover: '#00cc66', border: '#2a3a50',
    tooltip: { bg: '#1c1f2e', border: '#2c3040', text: '#e8ecf4', sub: '#4ade80' },
    rank: { bg: '#1c1f2e', border: '#2c3040', text: '#e8ecf4', dim: '#6b7a96', accent: '#4ade80' },
    legendDim: '#6b7a96',
  },
  forest: {
    ocean: '#e8d8be', base: '#ddc9a3', low: '#c8a97a', mid: '#8b5a2b', high: '#003F27',
    hover: '#005538', border: '#d4b896',
    tooltip: { bg: '#faf4e8', border: '#d4b896', text: '#2e1f0e', sub: '#6b4226' },
    rank: { bg: '#f0e8d8', border: '#d4b896', text: '#2e1f0e', dim: '#8a7055', accent: '#003F27' },
    legendDim: '#8a7055',
  },
};

export interface CountryData { country: string; users: number; }
interface Props { countries: CountryData[]; theme: 'light' | 'dark' | 'forest'; }

export function WorldHeatmap({ countries, theme }: Props) {
  const [ComposableMap, setComposableMap] = useState<any>(null);
  const [Geographies, setGeographies] = useState<any>(null);
  const [Geography, setGeography] = useState<any>(null);
  const [ZoomableGroup, setZoomableGroup] = useState<any>(null);
  const [hovered, setHovered] = useState<CountryData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const C = THEME_MAP[theme];
  const maxUsers = Math.max(...countries.map(c => c.users), 1);
  const ranked = [...countries].sort((a, b) => b.users - a.users);

  useEffect(() => {
    import('react-simple-maps').then(mod => {
      setComposableMap(() => mod.ComposableMap);
      setGeographies(() => mod.Geographies);
      setGeography(() => mod.Geography);
      setZoomableGroup(() => mod.ZoomableGroup);
    });
  }, []);

  function getFill(geoName: string): { data: CountryData | null; color: string } {
    const match = countries.find(c => {
      const mapped = COUNTRY_NAME_MAP[c.country] || c.country;
      return geoName === mapped || geoName === c.country;
    });
    if (!match) return { data: null, color: C.base };
    const ratio = Math.sqrt(match.users / maxUsers);
    const color = ratio > 0.7 ? C.high : ratio > 0.4 ? C.mid : ratio > 0.15 ? C.low : C.base;
    return { data: match, color };
  }

  if (!ComposableMap) return (
    <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 20, height: 20, border: `2px solid ${C.border}`, borderTop: `2px solid ${C.high}`, borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <div>
      <div
        style={{ position: 'relative', background: C.ocean, borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.border}` }}
        onMouseMove={e => {
          const rect = e.currentTarget.getBoundingClientRect();
          setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }}
        onMouseLeave={() => setHovered(null)}
      >
        <ComposableMap projectionConfig={{ scale: 145, center: [0, 10] }} style={{ width: '100%', height: 'auto' }} height={400}>
          <ZoomableGroup>
            <Geographies geography={GEO_URL}>
              {({ geographies }: { geographies: any[] }) =>
                geographies.map((geo: any) => {
                  const name = geo.properties?.name as string;
                  const { data, color } = getFill(name);
                  const isHov = hovered && data?.country === hovered.country;
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => data && setHovered(data)}
                      onMouseLeave={() => setHovered(null)}
                      style={{
                        default: { fill: isHov ? C.hover : color, stroke: C.border, strokeWidth: 0.4, outline: 'none', transition: 'fill 0.15s' },
                        hover:   { fill: data ? C.hover : C.base, stroke: C.border, strokeWidth: 0.5, outline: 'none', cursor: data ? 'pointer' : 'default' },
                        pressed: { outline: 'none' },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>

        {hovered && (
          <div style={{
            position: 'absolute',
            top: Math.min(tooltipPos.y + 12, 340),
            left: Math.min(tooltipPos.x + 12, 560),
            background: C.tooltip.bg, border: `1px solid ${C.tooltip.border}`,
            borderRadius: 8, padding: '8px 14px', pointerEvents: 'none', zIndex: 10,
            whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}>
            <p style={{ color: C.tooltip.text, fontWeight: 700, fontSize: 13, margin: 0 }}>{hovered.country}</p>
            <p style={{ color: C.tooltip.sub, fontSize: 12, margin: '3px 0 0', fontWeight: 600 }}>
              {hovered.users.toLocaleString()} users
            </p>
          </div>
        )}
      </div>

      {/* Legend + ranked */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: C.legendDim, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase' }}>Intensity</span>
          <span style={{ fontSize: 10, color: C.legendDim }}>Low</span>
          <div style={{ display: 'flex' }}>
            {[C.base, C.low, C.mid, C.high].map((col, i) => (
              <div key={i} style={{
                width: 22, height: 9, background: col,
                borderRadius: i === 0 ? '4px 0 0 4px' : i === 3 ? '0 4px 4px 0' : 0,
              }} />
            ))}
          </div>
          <span style={{ fontSize: 10, color: C.legendDim }}>High</span>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ranked.slice(0, 5).map((c, i) => (
            <div
              key={c.country}
              onMouseEnter={() => setHovered(c)}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: hovered?.country === c.country ? C.rank.border : C.rank.bg,
                border: `1px solid ${C.rank.border}`, borderRadius: 8,
                padding: '5px 10px', cursor: 'default', transition: 'background 0.15s',
              }}
            >
              <span style={{ fontSize: 10, color: C.rank.dim, fontWeight: 700 }}>#{i + 1}</span>
              <span style={{ fontSize: 12, color: C.rank.text, fontWeight: 500 }}>{c.country}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? C.rank.accent : C.rank.dim }}>
                {c.users.toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}