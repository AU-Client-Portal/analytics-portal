'use client';

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { ChevronLeft, Globe, MapPin } from 'lucide-react';

const WORLD_GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
const US_GEO_URL = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

const COUNTRY_NAME_MAP: Record<string, string> = {
  'United States': 'United States of America',
};

const USA_NAMES = new Set(['United States', 'United States of America']);

const COUNTRY_CENTROIDS: Record<string, [number, number]> = {
  'United States of America': [-98, 38], 'United States': [-98, 38],
  'United Kingdom': [-2, 54], 'Canada': [-96, 60], 'Australia': [134, -25],
  'Germany': [10, 51], 'France': [2, 46], 'Japan': [138, 36],
  'Brazil': [-51, -10], 'India': [80, 20], 'China': [105, 35],
  'Mexico': [-102, 23], 'Italy': [12, 42], 'Spain': [-3, 40],
  'Netherlands': [5, 52], 'South Korea': [128, 36],
};
const COUNTRY_ZOOM: Record<string, number> = {
  'United States of America': 3, 'United States': 3,
  'Canada': 2.5, 'Australia': 2.5, 'Russia': 2, 'Brazil': 2.5,
  'China': 2.5, 'India': 3,
};

const THEME_MAP = {
  light: {
    ocean: '#dde8f0', base: '#ccd8e2', low: '#8fb8cc', mid: '#3a7a96', high: '#003F27',
    hover: '#005538', border: '#b0c8d8',
    tooltip: { bg: '#f8fafc', border: '#ccd8e2', text: '#1a2e3b', sub: '#3a7a96' },
    rank: { bg: '#f1f5f8', border: '#ccd8e2', text: '#1a2e3b', dim: '#6a8a9a', accent: '#003F27' },
    panel: { bg: '#f8fafc', border: '#ccd8e2', text: '#1a2e3b', sub: '#6a8a9a', accent: '#003F27' },
    legendDim: '#6a8a9a',
  },
  dark: {
    ocean: '#0d1117', base: '#1a2535', low: '#1e3d2e', mid: '#2a6644', high: '#00a855',
    hover: '#00cc66', border: '#2a3a50',
    tooltip: { bg: '#1c1f2e', border: '#2c3040', text: '#e8ecf4', sub: '#4ade80' },
    rank: { bg: '#1c1f2e', border: '#2c3040', text: '#e8ecf4', dim: '#6b7a96', accent: '#4ade80' },
    panel: { bg: '#1c1f2e', border: '#2c3040', text: '#e8ecf4', sub: '#8a9ab8', accent: '#4ade80' },
    legendDim: '#6b7a96',
  },
  forest: {
    ocean: '#e8d8be', base: '#ddc9a3', low: '#c8a97a', mid: '#8b5a2b', high: '#003F27',
    hover: '#005538', border: '#d4b896',
    tooltip: { bg: '#faf4e8', border: '#d4b896', text: '#2e1f0e', sub: '#6b4226' },
    rank: { bg: '#f0e8d8', border: '#d4b896', text: '#2e1f0e', dim: '#8a7055', accent: '#003F27' },
    panel: { bg: '#faf4e8', border: '#d4b896', text: '#2e1f0e', sub: '#8a7055', accent: '#003F27' },
    legendDim: '#8a7055',
  },
};

export interface CountryData { country: string; users: number; }
export interface RegionData { country: string; region: string; users: number; }

interface Props {
  countries: CountryData[];
  regions?: RegionData[];
  theme: 'light' | 'dark' | 'forest';
  initialCountry?: string | null;
  onCountryChange?: (country: string | null) => void;
}

export const WorldHeatmap = forwardRef<{ getSelectedCountry: () => string | null }, Props>(
  function WorldHeatmap({ countries, regions = [], theme, initialCountry = null, onCountryChange }, ref) {
  const [ComposableMap, setComposableMap] = useState<any>(null);
  const [Geographies, setGeographies] = useState<any>(null);
  const [Geography, setGeography] = useState<any>(null);
  const [ZoomableGroup, setZoomableGroup] = useState<any>(null);
  const [hovered, setHovered] = useState<{ name: string; users: number } | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [selectedCountry, setSelectedCountry] = useState<string | null>(initialCountry);
  const [mapZoom, setMapZoom] = useState(1);
  const [mapCenter, setMapCenter] = useState<[number, number]>([0, 10]);
  const [isMobile, setIsMobile] = useState(false);

  useImperativeHandle(ref, () => ({
    getSelectedCountry: () => selectedCountry,
  }));

  const C = THEME_MAP[theme];
  const maxUsers = Math.max(...countries.map(c => c.users), 1);
  const ranked = [...countries].sort((a, b) => b.users - a.users);
  const isUSView = selectedCountry ? USA_NAMES.has(selectedCountry) : false;

  const usStateData = isUSView ? regions.filter(r => USA_NAMES.has(r.country)) : [];
  const maxStateUsers = Math.max(...usStateData.map(s => s.users), 1);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (initialCountry) {
      const center = COUNTRY_CENTROIDS[COUNTRY_NAME_MAP[initialCountry] || initialCountry];
      if (center) {
        setMapCenter(center);
        setMapZoom(COUNTRY_ZOOM[COUNTRY_NAME_MAP[initialCountry] || initialCountry] || 3);
      }
    }
  }, []);

  useEffect(() => {
    import('react-simple-maps').then(mod => {
      setComposableMap(() => mod.ComposableMap);
      setGeographies(() => mod.Geographies);
      setGeography(() => mod.Geography);
      setZoomableGroup(() => mod.ZoomableGroup);
    });
  }, []);

  function getFillWorld(geoName: string): { data: CountryData | null; color: string; isFlagged: boolean } {
    const match = countries.find(c => {
      const mapped = COUNTRY_NAME_MAP[c.country] || c.country;
      return geoName === mapped || geoName === c.country;
    });
    if (!match) return { data: null, color: C.base, isFlagged: false };
    const ratio = Math.sqrt(match.users / maxUsers);
    const color = ratio > 0.7 ? C.high : ratio > 0.4 ? C.mid : ratio > 0.15 ? C.low : C.base;
    return { data: match, color, isFlagged: false };
  }

  function getFillState(stateName: string): string {
    const match = usStateData.find(s => s.region === stateName);
    if (!match) return C.base;
    const ratio = Math.sqrt(match.users / maxStateUsers);
    return ratio > 0.7 ? C.high : ratio > 0.4 ? C.mid : ratio > 0.15 ? C.low : C.base;
  }

  function handleCountryClick(countryName: string, data: CountryData | null) {
    if (!data) return;
    const newCountry = data.country;
    setSelectedCountry(newCountry);
    onCountryChange?.(newCountry);
    const canonical = COUNTRY_NAME_MAP[newCountry] || newCountry;
    const center = COUNTRY_CENTROIDS[canonical] || COUNTRY_CENTROIDS[newCountry];
    if (center) {
      setMapCenter(center);
      setMapZoom(COUNTRY_ZOOM[canonical] || COUNTRY_ZOOM[newCountry] || 4);
    }
  }

  function handleBack() {
    setSelectedCountry(null);
    onCountryChange?.(null);
    setMapCenter([0, 10]);
    setMapZoom(1);
  }

  if (!ComposableMap) return (
    <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 20, height: 20, border: `2px solid ${C.border}`, borderTop: `2px solid ${C.high}`, borderRadius: '50%', animation: 'wmSpin 0.7s linear infinite' }} />
      <style>{`@keyframes wmSpin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const selectedCountryData = selectedCountry ? countries.find(c => c.country === selectedCountry) : null;

  const drilldownItems = isUSView
    ? usStateData.sort((a, b) => b.users - a.users).slice(0, 15)
    : regions
        .filter(r => r.country === selectedCountry || COUNTRY_NAME_MAP[r.country] === selectedCountry)
        .sort((a, b) => b.users - a.users)
        .slice(0, 15);
  const maxDrilldown = Math.max(...drilldownItems.map(r => r.users), 1);

  const hasDrilldown = selectedCountry && drilldownItems.length > 0;
  const layoutStyle: React.CSSProperties = isMobile
    ? { display: 'flex', flexDirection: 'column', gap: 12 }
    : { display: 'grid', gridTemplateColumns: hasDrilldown ? '1fr 210px' : '1fr', gap: 12, alignItems: 'start' };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {selectedCountry ? (
            <button onClick={handleBack} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: C.panel.bg, border: `1px solid ${C.panel.border}`,
              borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
              color: C.panel.text, fontSize: 12, fontWeight: 600,
            }}>
              <ChevronLeft size={14} /> World View
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: C.legendDim, fontSize: 11 }}>
              <Globe size={12} />
              <span>Click a country to drill down · Scroll/drag to navigate</span>
            </div>
          )}
          {selectedCountry && isUSView && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.panel.sub, fontSize: 11 }}>
              <MapPin size={11} /> State breakdown
            </div>
          )}
        </div>

      </div>

      <div style={layoutStyle}>
        <div
          style={{ position: 'relative', background: C.ocean, borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.border}` }}
          onMouseMove={e => {
            const rect = e.currentTarget.getBoundingClientRect();
            setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
          }}
          onMouseLeave={() => setHovered(null)}
        >
          {isUSView ? (
            <ComposableMap
              projection="geoAlbersUsa"
              projectionConfig={{ scale: 1000 }}
              style={{ width: '100%', height: 'auto' }}
              height={400}
            >
              <Geographies geography={US_GEO_URL}>
                {({ geographies }: { geographies: any[] }) =>
                  geographies.map((geo: any) => {
                    const stateName = geo.properties?.name as string;
                    const stateData = usStateData.find(s => s.region === stateName);
                    const fill = getFillState(stateName);
                    const isHov = hovered?.name === stateName;
                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onMouseEnter={() => setHovered({ name: stateName, users: stateData?.users ?? 0 })}
                        onMouseLeave={() => setHovered(null)}
                        style={{
                          default: { fill: isHov ? C.hover : fill, stroke: C.border, strokeWidth: 0.5, outline: 'none', transition: 'fill 0.15s' },
                          hover:   { fill: stateData ? C.hover : C.base, stroke: C.border, strokeWidth: 0.7, outline: 'none', cursor: stateData ? 'pointer' : 'default' },
                          pressed: { outline: 'none' },
                        }}
                      />
                    );
                  })
                }
              </Geographies>
            </ComposableMap>
          ) : (
            <ComposableMap projectionConfig={{ scale: 145, center: [0, 10] }} style={{ width: '100%', height: 'auto' }} height={400}>
              <ZoomableGroup
                center={mapCenter} zoom={mapZoom}
                onMoveEnd={({ zoom, coordinates }: any) => { setMapZoom(zoom); setMapCenter(coordinates); }}
              >
                <Geographies geography={WORLD_GEO_URL}>
                  {({ geographies }: { geographies: any[] }) =>
                    geographies.map((geo: any) => {
                      const name = geo.properties?.name as string;
                      const { data, color, isFlagged } = getFillWorld(name);
                      const isHov = hovered?.name === name;
                      const isSel = selectedCountry && data?.country === selectedCountry;
                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onMouseEnter={() => data && setHovered({ name, users: data.users })}
                          onMouseLeave={() => setHovered(null)}
                          onClick={() => handleCountryClick(name, data)}
                          style={{
                            default: { fill: isSel ? C.hover : isHov ? C.hover : color, stroke: isSel ? C.high : C.border, strokeWidth: isSel ? 1.5 : 0.4, outline: 'none', transition: 'fill 0.15s' },
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
          )}

          {hovered && (
            <div style={{
              position: 'absolute',
              top: Math.min(tooltipPos.y + 12, 340),
              left: Math.min(tooltipPos.x + 12, 520),
              background: C.tooltip.bg, border: `1px solid ${C.tooltip.border}`,
              borderRadius: 8, padding: '8px 14px', pointerEvents: 'none', zIndex: 10,
              whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
            }}>
              <p style={{ color: C.tooltip.text, fontWeight: 700, fontSize: 13, margin: 0 }}>
                {hovered.name}
              </p>
              {hovered.users > 0 && (
                <p style={{ color: C.tooltip.sub, fontSize: 12, margin: '3px 0 0', fontWeight: 600 }}>
                  {hovered.users.toLocaleString()} users
                </p>
              )}
              {!isUSView && USA_NAMES.has(hovered.name) && regions.length > 0 && (
                <p style={{ color: C.legendDim, fontSize: 10, margin: '2px 0 0' }}>Click for state breakdown</p>
              )}
            </div>
          )}
        </div>

        {selectedCountry && (
          drilldownItems.length > 0 ? (
            <div style={{
              background: C.panel.bg, border: `1px solid ${C.panel.border}`,
              borderRadius: 12, padding: '14px 16px',
              maxHeight: isMobile ? 'none' : 400,
              overflowY: isMobile ? 'visible' : 'auto',
            }}>
              <p style={{ color: C.panel.text, fontWeight: 700, fontSize: 13, margin: '0 0 2px' }}>{selectedCountry}</p>
              <p style={{ color: C.panel.sub, fontSize: 11, margin: '0 0 12px' }}>
                {selectedCountryData?.users.toLocaleString() ?? '—'} total · {isUSView ? 'by state' : 'by region'}
              </p>
              <div style={isMobile ? { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 } : {}}>
                {drilldownItems.map((r, i) => {
                  const pct = (r.users / maxDrilldown) * 100;
                  return (
                    <div key={i} style={{ marginBottom: isMobile ? 0 : 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ color: C.panel.text, fontSize: 11, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{r.region}</span>
                        <span style={{ color: C.panel.accent, fontSize: 11, fontWeight: 700 }}>{r.users.toLocaleString()}</span>
                      </div>
                      <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: C.panel.accent, borderRadius: 2, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div style={{ background: C.panel.bg, border: `1px solid ${C.panel.border}`, borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ color: C.panel.text, fontWeight: 700, fontSize: 13, margin: '0 0 6px' }}>{selectedCountry}</p>
              <p style={{ color: C.panel.sub, fontSize: 11, margin: 0 }}>No regional data available.</p>
            </div>
          )
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, color: C.legendDim, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Intensity</span>
          <span style={{ fontSize: 10, color: C.legendDim }}>Low</span>
          <div style={{ display: 'flex' }}>
            {[C.base, C.low, C.mid, C.high].map((col, i) => (
              <div key={i} style={{ width: 22, height: 9, background: col, borderRadius: i === 0 ? '4px 0 0 4px' : i === 3 ? '0 4px 4px 0' : 0 }} />
            ))}
          </div>
          <span style={{ fontSize: 10, color: C.legendDim }}>High</span>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {ranked.slice(0, 5).map((c, i) => (
            <button key={c.country} onClick={() => handleCountryClick(COUNTRY_NAME_MAP[c.country] || c.country, c)}
              onMouseEnter={() => setHovered({ name: c.country, users: c.users })}
              onMouseLeave={() => setHovered(null)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: hovered?.name === c.country ? C.rank.border : C.rank.bg,
                border: `1px solid ${C.rank.border}`,
                borderRadius: 8, padding: '5px 10px', cursor: 'pointer',
                transition: 'background 0.15s', outline: 'none',
              }}>
              <span style={{ fontSize: 10, color: C.rank.dim, fontWeight: 700 }}>#{i + 1}</span>
              <span style={{ fontSize: 12, color: C.rank.text, fontWeight: 500 }}>{c.country}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? C.rank.accent : C.rank.dim }}>
                {c.users.toLocaleString()}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});