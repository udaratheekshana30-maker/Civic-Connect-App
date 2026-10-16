import type { GeoPlace } from '@/types';

// Nominatim (OpenStreetMap) — free, no key. Usage policy we follow:
//  - max 1 request/second (serialised queue below),
//  - identify the app (User-Agent + Referer headers, optional email),
//  - cache results, debounce typing in the UI (useDebounce ≥ 600 ms),
//  - restrict searches to Sri Lanka (countrycodes=lk).
// https://operations.osmfoundation.org/policies/nominatim/

const BASE = 'https://nominatim.openstreetmap.org';
const EMAIL = process.env.EXPO_PUBLIC_NOMINATIM_EMAIL;
const HEADERS = {
  'User-Agent': 'CivicConnect/1.0 (civic issue reporting app, Sri Lanka; Expo)',
  Referer: 'https://civicconnect.app/',
  Accept: 'application/json',
};

let last = 0;
let chain: Promise<unknown> = Promise.resolve();

/** Runs requests one at a time, at least 1.1 s apart. */
function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(async () => {
    const wait = Math.max(0, last + 1100 - Date.now());
    if (wait) await new Promise((r) => setTimeout(r, wait));
    last = Date.now();
    return fn();
  });
  chain = run.catch(() => undefined);
  return run;
}

const cache = new Map<string, unknown>();

async function getJson<T>(path: string): Promise<T> {
  const url = `${BASE}${path}${EMAIL ? `&email=${encodeURIComponent(EMAIL)}` : ''}`;
  if (cache.has(url)) return cache.get(url) as T;
  const data = await throttled(async () => {
    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) throw Object.assign(new Error(`Nominatim ${res.status}`), { code: 'unavailable' });
    return (await res.json()) as T;
  });
  if (cache.size > 200) cache.delete(cache.keys().next().value as string);
  cache.set(url, data);
  return data;
}

interface NominatimAddress {
  road?: string;
  neighbourhood?: string;
  suburb?: string;
  village?: string;
  town?: string;
  city?: string;
  city_district?: string;
  county?: string;
  state_district?: string;
  state?: string;
  postcode?: string;
}

interface NominatimPlace {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  name?: string;
  address?: NominatimAddress;
}

function areaOf(a?: NominatimAddress) {
  return a?.city || a?.town || a?.village || a?.state_district?.replace(' District', '') || a?.county || '';
}

/** "Kandy Road, Colombo 07" rather than the full 8-part display name. */
function shortAddress(p: NominatimPlace) {
  const a = p.address;
  if (!a) return p.display_name.split(',').slice(0, 3).join(',').trim();
  const first = p.name && p.name !== a.road ? p.name : a.road || a.neighbourhood || a.suburb;
  const second = a.suburb && a.suburb !== first ? a.suburb : areaOf(a);
  return [first, second].filter(Boolean).join(', ') || p.display_name.split(',').slice(0, 2).join(',');
}

function toPlace(p: NominatimPlace): GeoPlace & { id: string; detail: string } {
  return {
    id: String(p.place_id),
    lat: parseFloat(p.lat),
    lng: parseFloat(p.lon),
    address: shortAddress(p),
    detail: p.display_name,
    area: areaOf(p.address),
  };
}

export type SearchResult = ReturnType<typeof toPlace>;

/** Street / landmark search inside Sri Lanka. */
export async function searchPlaces(query: string, near?: { lat: number; lng: number }): Promise<SearchResult[]> {
  const q = query.trim();
  if (q.length < 3) return [];
  let path = `/search?format=jsonv2&addressdetails=1&limit=6&countrycodes=lk&q=${encodeURIComponent(q)}`;
  if (near) {
    // bias (not restrict) results to ~30 km around the user
    const d = 0.3;
    path += `&viewbox=${near.lng - d},${near.lat + d},${near.lng + d},${near.lat - d}`;
  }
  const data = await getJson<NominatimPlace[]>(path);
  return data.map(toPlace);
}

/** Coordinates → readable address. Rounded to ~10 m so map drags hit the cache. */
export async function reverseGeocode(lat: number, lng: number): Promise<GeoPlace> {
  const rl = lat.toFixed(4);
  const rg = lng.toFixed(4);
  const data = await getJson<NominatimPlace>(`/reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${rl}&lon=${rg}`);
  const p = toPlace(data);
  return { lat, lng, address: p.address, area: p.area };
}
