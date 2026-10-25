// Hospitals, clinics and doctors near the family, from OpenStreetMap (free, no
// key). Searches go from the browser straight to OpenStreetMap's servers, not
// ours. Places the family has already been to are recognised from the
// facility names in their confirmed records.

export type PlaceKind = "hospital" | "clinic" | "doctor";

export type Place = {
  id: string;
  name: string;
  kind: PlaceKind;
  lat: number;
  lon: number;
  distanceKm: number;
  specialties: string[];
  emergency: boolean;
  phone?: string;
  website?: string;
  address?: string;
};

export type Visit = { facility: string; doctor: string | null; date: string | null; docId: string };

const OVERPASS = "https://overpass-api.de/api/interpreter";
const NOMINATIM = "https://nominatim.openstreetmap.org/search";

const SPECIALTIES: Record<string, string> = {
  general: "General practice",
  internal: "Internal medicine",
  otolaryngology: "Ear, nose & throat",
  neurology: "Neurology",
  cardiology: "Heart",
  endocrinology: "Hormones",
  orthopaedics: "Bones & joints",
  rheumatology: "Joints (rheumatology)",
  ophthalmology: "Eyes",
  psychiatry: "Mental health",
  geriatrics: "Older adults",
  radiology: "Scans",
  emergency: "Emergency",
};

export function distanceKm(aLat: number, aLon: number, bLat: number, bLon: number) {
  const rad = Math.PI / 180;
  const dLat = (bLat - aLat) * rad;
  const dLon = (bLon - aLon) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(aLat * rad) * Math.cos(bLat * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

type OsmElement = { type: string; id: number; lat?: number; lon?: number; center?: { lat: number; lon: number }; tags?: Record<string, string> };

export function parsePlaces(elements: OsmElement[], lat: number, lon: number): Place[] {
  const seen = new Set<string>();
  const places: Place[] = [];
  for (const e of elements) {
    const t = e.tags ?? {};
    const name = t.name ?? t["name:en"];
    const pLat = e.lat ?? e.center?.lat;
    const pLon = e.lon ?? e.center?.lon;
    if (!name || pLat == null || pLon == null) continue;
    const type = t.amenity ?? t.healthcare ?? "";
    const kind: PlaceKind = type === "hospital" ? "hospital" : type === "doctors" || type === "doctor" ? "doctor" : "clinic";
    const key = `${kind}:${name.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const street = [t["addr:street"], t["addr:housenumber"]].filter(Boolean).join(" ");
    places.push({
      id: `${e.type}/${e.id}`,
      name,
      kind,
      lat: pLat,
      lon: pLon,
      distanceKm: distanceKm(lat, lon, pLat, pLon),
      specialties: (t["healthcare:speciality"] ?? "")
        .split(";")
        .map((s) => SPECIALTIES[s.trim()] ?? "")
        .filter(Boolean),
      emergency: t.emergency === "yes",
      phone: t.phone ?? t["contact:phone"],
      website: t.website ?? t["contact:website"],
      address: [street, t["addr:city"]].filter(Boolean).join(", ") || undefined,
    });
  }
  return places.sort((a, b) => a.distanceKm - b.distanceKm);
}

async function query(lat: number, lon: number, radiusM: number, signal?: AbortSignal) {
  const around = `(around:${radiusM},${lat.toFixed(5)},${lon.toFixed(5)})`;
  const q = `[out:json][timeout:20];(nwr["amenity"~"^(hospital|clinic|doctors)$"]${around};nwr["healthcare"~"^(hospital|clinic|doctor|centre)$"]${around};);out center tags 150;`;
  const res = await fetch(OVERPASS, { method: "POST", body: new URLSearchParams({ data: q }), signal });
  if (!res.ok) throw new Error("The map service is busy. Try again in a minute.");
  return parsePlaces(((await res.json()) as { elements: OsmElement[] }).elements ?? [], lat, lon);
}

/** Places within 5 km, widening to 20 km when there are only a few. */
export async function findNearby(lat: number, lon: number, signal?: AbortSignal) {
  const near = await query(lat, lon, 5000, signal);
  if (near.length >= 8) return near;
  return query(lat, lon, 20000, signal);
}

/** Turns a typed town or address into coordinates. */
export async function geocode(text: string, signal?: AbortSignal) {
  const url = `${NOMINATIM}?${new URLSearchParams({ q: text, format: "jsonv2", limit: "1" })}`;
  const res = await fetch(url, { signal, headers: { "Accept-Language": "en" } });
  if (!res.ok) throw new Error("The map service is busy. Try again in a minute.");
  const [hit] = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  if (!hit) throw new Error("We couldn't find that place. Try a town or city name.");
  return { lat: Number(hit.lat), lon: Number(hit.lon), label: hit.display_name.split(",").slice(0, 2).join(",") };
}

// ---------- "Already visited" check ----------

// Words that say what kind of place it is rather than which one.
const GENERIC = new Set(
  "rs rsu rsud rsia rumah sakit rumahsakit hospital hospitals hosp klinik clinic clinics medical medika center centre the of and dr dr. general umum kesehatan health healthcare poli poliklinik puskesmas pratama utama santo st saint care international indonesia contoh sample ejemplo hospitalario centro de del la el los salud"
    .split(" "),
);

function tokens(name: string) {
  return new Set(
    name
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 3 && !GENERIC.has(w)),
  );
}

/** Same place if every distinctive word of the shorter name appears in the other. */
export function sameName(a: string, b: string) {
  const ta = tokens(a);
  const tb = tokens(b);
  if (!ta.size || !tb.size) return false;
  const [small, big] = ta.size <= tb.size ? [ta, tb] : [tb, ta];
  return [...small].every((w) => big.has(w));
}

export function visitsTo(place: Place, visits: Visit[]) {
  return visits.filter((v) => sameName(place.name, v.facility));
}

export function directionsUrl(p: Place) {
  return `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}`;
}
