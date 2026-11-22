// Calcolo del percorso per le consegne (impostazione "Calcolo del percorso per i rider", predefinita spenta).
// Nessuna API esterna: nearest neighbour dal punto di partenza del locale con la distanza in linea d'aria
// (haversine), poi un passaggio di 2-opt. Stessa logica dell'app DineUp Sala (src/utils/route.ts).

export interface LatLng { lat: number; lng: number }

/** Google Maps accetta al massimo 9 tappe intermedie oltre alla destinazione. */
export const MAX_WAYPOINTS = 9;

const validPoint = (p: Partial<LatLng> | null | undefined): p is LatLng =>
    !!p && Number.isFinite(p.lat) && Number.isFinite(p.lng)
    && Math.abs(p.lat as number) <= 90 && Math.abs(p.lng as number) <= 180;

/** Distanza in km in linea d'aria. */
export const haversineKm = (a: LatLng, b: LatLng): number => {
    const R = 6371;
    const rad = (x: number) => (x * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
};

/**
 * Ordina le consegne per il giro: prima quelle con coordinate (nearest neighbour dall'origine + 2-opt,
 * percorso aperto senza ritorno al locale), poi quelle senza coordinate in ordine di orario.
 * Senza origine si parte dalla consegna con coordinate più vicina nel tempo.
 */
export function planRoute<T>(
    items: T[],
    origin: Partial<LatLng> | null | undefined,
    pointOf: (t: T) => Partial<LatLng> | null | undefined,
    timeOf: (t: T) => number,
): T[] {
    const byTime = [...items].sort((a, b) => timeOf(a) - timeOf(b));
    const located = byTime.filter(t => validPoint(pointOf(t)));
    const unlocated = byTime.filter(t => !validPoint(pointOf(t)));
    if (located.length < 2) return [...located, ...unlocated];

    const start: LatLng | null = validPoint(origin) ? origin : null;
    const pt = (t: T) => pointOf(t) as LatLng;

    // Nearest neighbour
    const left = [...located];
    const path: T[] = [];
    let cur: LatLng | null = start;
    while (left.length) {
        let best = 0;
        if (cur) {
            let bestD = Number.POSITIVE_INFINITY;
            left.forEach((t, i) => {
                const d = haversineKm(cur as LatLng, pt(t));
                if (d < bestD) { bestD = d; best = i; }
            });
        }
        const [next] = left.splice(best, 1);
        path.push(next);
        cur = pt(next);
    }

    // 2-opt sul percorso aperto: l'origine resta ferma, l'ultima tappa è libera
    const d = (a: LatLng | null, b: LatLng | null) => (a && b ? haversineKm(a, b) : 0);
    const at = (i: number): LatLng | null => (i < 0 ? start : i >= path.length ? null : pt(path[i]));
    let improved = true;
    for (let round = 0; improved && round < 50; round++) {
        improved = false;
        for (let i = 0; i < path.length - 1; i++) {
            for (let j = i + 1; j < path.length; j++) {
                const delta = d(at(i - 1), at(j)) + d(at(i), at(j + 1)) - d(at(i - 1), at(i)) - d(at(j), at(j + 1));
                if (delta < -1e-9) {
                    const seg = path.slice(i, j + 1).reverse();
                    path.splice(i, seg.length, ...seg);
                    improved = true;
                }
            }
        }
    }
    return [...path, ...unlocated];
}

/**
 * Link di Google Maps per il giro (indicazioni in auto, funziona anche su iPhone).
 * `stops` sono "lat,lng" o indirizzi. Oltre 9 tappe intermedie il giro si divide in più tratte:
 * ogni tratta riparte dall'ultima tappa della precedente. Senza origine Maps parte dalla posizione attuale.
 */
export const googleMapsTripUrls = (origin: Partial<LatLng> | null | undefined, stops: string[]): string[] => {
    const list = stops.filter(s => !!s && s.trim().length > 0);
    const urls: string[] = [];
    let from: string | null = validPoint(origin) ? `${origin.lat},${origin.lng}` : null;
    for (let i = 0; i < list.length; i += MAX_WAYPOINTS + 1) {
        const leg = list.slice(i, i + MAX_WAYPOINTS + 1);
        const destination = leg[leg.length - 1];
        const waypoints = leg.slice(0, -1);
        let url = 'https://www.google.com/maps/dir/?api=1';
        if (from) url += `&origin=${encodeURIComponent(from)}`;
        url += `&destination=${encodeURIComponent(destination)}`;
        if (waypoints.length) url += `&waypoints=${waypoints.map(encodeURIComponent).join('%7C')}`;
        url += '&travelmode=driving';
        urls.push(url);
        from = destination;
    }
    return urls;
};

/** Tappa per Google Maps: coordinate se ci sono, altrimenti l'indirizzo scritto. */
export const stopOf = (p: Partial<LatLng> | null | undefined, label?: string | null): string =>
    validPoint(p) ? `${p.lat},${p.lng}` : (label ?? '').trim();
