import { Building2, MapPin, Trophy, UtensilsCrossed } from 'lucide-react';
import * as maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

interface SponsorRegion {
  suburb: string;
  sponsor: string | null;
  meals: number;
  businesses: number;
  value: number;
  longitude: number;
  latitude: number;
  colour: string;
  logo?: string;
}

const regions: SponsorRegion[] = [
  { suburb: 'Newtown', sponsor: 'NSW Education', meals: 1284, businesses: 18, value: 6420, longitude: 151.179, latitude: -33.898, colour: '#d97941', logo: '/sponsors/nsw-government.png' },
  { suburb: 'Lane Cove', sponsor: 'Apple', meals: 1106, businesses: 14, value: 5530, longitude: 151.166, latitude: -33.815, colour: '#809761', logo: '/sponsors/apple.png' },
  { suburb: 'Marrickville', sponsor: 'Google', meals: 936, businesses: 12, value: 4680, longitude: 151.155, latitude: -33.911, colour: '#3f77b8', logo: '/sponsors/google.svg' },
  { suburb: 'Parramatta', sponsor: 'Microsoft', meals: 812, businesses: 11, value: 4060, longitude: 151.003, latitude: -33.815, colour: '#d9a33d', logo: '/sponsors/microsoft.svg' },
  { suburb: 'Blacktown', sponsor: 'Crown Resorts', meals: 604, businesses: 8, value: 3020, longitude: 150.906, latitude: -33.77, colour: '#9a6e54', logo: '/sponsors/crown.svg' },
  { suburb: 'Liverpool', sponsor: null, meals: 318, businesses: 7, value: 1590, longitude: 150.925, latitude: -33.92, colour: '#8c958e' },
];

const money = (value: number) => `$${value.toLocaleString()}`;

export default function SponsorMapPage() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const [selectedSuburb, setSelectedSuburb] = useState('Newtown');
  const selected = regions.find((region) => region.suburb === selectedSuburb) ?? regions[0];
  const ranked = useMemo(() => [...regions].sort((a, b) => b.meals - a.meals), []);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['/sydney-tiles/11/{x}/{y}.png'],
            tileSize: 256,
            minzoom: 11,
            maxzoom: 11,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [{
          id: 'osm',
          type: 'raster',
          source: 'osm',
          paint: {
            'raster-saturation': 0.28,
            'raster-contrast': 0.16,
            'raster-brightness-min': 0.08,
            'raster-brightness-max': 0.96,
          },
        }],
      },
      center: [151.08, -33.85],
      zoom: 11,
      minZoom: 11,
      maxZoom: 14,
      interactive: false,
      fadeDuration: 0,
      attributionControl: { compact: true },
    });
    map.once('load', () => map.jumpTo({ center: [151.08, -33.85], zoom: 11 }));
    regions.forEach((region) => {
      const marker = document.createElement('button');
      marker.type = 'button';
      marker.className = `sponsor-map-pin${region.sponsor ? '' : ' is-open'}`;
      marker.style.setProperty('--marker-colour', region.colour);
      if (region.logo) {
        const logo = document.createElement('img');
        logo.src = region.logo;
        logo.alt = '';
        logo.className = region.logo.endsWith('.svg') && !region.logo.includes('crown') ? 'is-wordmark' : 'is-emblem';
        marker.append(logo);
      } else {
        const openLabel = document.createElement('span');
        openLabel.textContent = '+';
        marker.append(openLabel);
      }
      marker.title = `${region.suburb}: ${region.sponsor ?? 'available to sponsor'}`;
      marker.setAttribute('aria-label', marker.title);
      marker.addEventListener('click', () => setSelectedSuburb(region.suburb));
      new maplibregl.Marker({ element: marker, anchor: 'center' }).setLngLat([region.longitude, region.latitude]).addTo(map);
    });
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  return <main className="sponsor-map-page" id="main-content">
    <section className="sponsor-map-hero">
      <div className="page-shell">
        <p className="eyebrow">Local sponsorship, made visible</p>
        <h1>See who is feeding each suburb.</h1>
        <p>Explore sponsor-funded meals across Sydney and find communities ready for a new funding partner.</p>
      </div>
    </section>

    <section className="page-shell sponsor-map-shell" aria-labelledby="map-title">
      <div className="sponsor-map-heading">
        <div><p className="eyebrow">Sydney sponsor map</p><h2 id="map-title">Community impact by suburb</h2></div>
        <label>Jump to a suburb
          <select value={selectedSuburb} onChange={(event) => setSelectedSuburb(event.target.value)}>
            {regions.map((region) => <option key={region.suburb}>{region.suburb}</option>)}
          </select>
        </label>
      </div>

      <div className="sponsor-map-layout">
        <div className="sponsor-map-canvas" aria-label="Interactive map of sponsored Sydney suburbs">
          <div ref={mapContainer} className="sponsor-map-map" />
          <div className="sponsor-map-key"><span><i/>Sponsored suburb</span><span><i/>Opportunity area</span></div>
        </div>

        <aside className="sponsor-region-card" aria-live="polite">
          <p className="eyebrow">{selected.sponsor ? 'Top local sponsor' : 'Sponsorship opportunity'}</p>
          <h2>{selected.suburb}</h2>
          <div className={`sponsor-region-card__leader ${selected.sponsor ? '' : 'is-open'}`}>
            {selected.logo ? <span className="sponsor-region-card__logo"><img src={selected.logo} alt="" /></span> : selected.sponsor ? <Trophy size={22}/> : <MapPin size={22}/>}<div><small>{selected.sponsor ? 'Leading partner' : 'This suburb is open'}</small><strong>{selected.sponsor ?? 'Become the first named sponsor'}</strong></div>
          </div>
          <dl>
            <div><UtensilsCrossed size={17}/><dt>Meals funded</dt><dd>{selected.meals.toLocaleString()}</dd></div>
            <div><Building2 size={17}/><dt>Local businesses</dt><dd>{selected.businesses}</dd></div>
            <div><span aria-hidden="true">$</span><dt>Value delivered</dt><dd>{money(selected.value)}</dd></div>
          </dl>
          <Link className="button button--primary button--wide" to={`/sponsors?suburb=${encodeURIComponent(selected.suburb)}#fund`}>{selected.sponsor ? 'Challenge the top sponsor' : `Sponsor ${selected.suburb}`}</Link>
        </aside>
      </div>

      <section className="sponsor-ranking" aria-labelledby="ranking-title">
        <div><p className="eyebrow">Friendly competition</p><h2 id="ranking-title">Sydney sponsor leaderboard</h2></div>
        <ol>{ranked.map((region, index) => <li key={region.suburb} onClick={() => setSelectedSuburb(region.suburb)} className={selected.suburb === region.suburb ? 'is-selected' : ''}>
          <span>{index + 1}</span><div><strong>{region.sponsor ?? 'Position available'}</strong><small>{region.suburb}</small></div><b>{region.meals.toLocaleString()} meals</b>
        </li>)}</ol>
      </section>
    </section>
  </main>;
}
