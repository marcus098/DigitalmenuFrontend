import type { DeliveryAddress, DeliverySettings, DeliveryZone } from '../../deliveryTypes';

/**
 * Logica lato cliente della consegna: solo STIME per l'interfaccia.
 * Distanza, zona e tariffa vere le calcola il server all'invio dell'ordine.
 */

// ─── Canale scelto dal cliente (asporto / domicilio) ────────────────────────
export type OrderChannel = 'TAKEAWAY' | 'DELIVERY';
const CHANNEL_KEY = (localname: string) => `rf_channel_${localname}`;
export const CHANNEL_CHANGED_EVENT = 'rf-channel-changed';

const safeGet = (k: string): string | null => { try { return localStorage.getItem(k); } catch { return null; } };
const safeSet = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* storage non disponibile */ } };
const safeDel = (k: string) => { try { localStorage.removeItem(k); } catch { /* storage non disponibile */ } };

export const getOrderChannel = (localname: string): OrderChannel =>
    safeGet(CHANNEL_KEY(localname)) === 'DELIVERY' ? 'DELIVERY' : 'TAKEAWAY';

export const setOrderChannel = (localname: string, channel: OrderChannel) => {
    safeSet(CHANNEL_KEY(localname), channel);
    window.dispatchEvent(new CustomEvent(CHANNEL_CHANGED_EVENT));
};

// ─── Bozza del checkout domicilio (sopravvive a refresh e al ritorno dal menu) ─
export interface DeliveryDraft {
    address?: DeliveryAddress | null;
    name?: string;
    phone?: string;
}
const DRAFT_KEY = (localname: string) => `rf_delivery_draft_${localname}`;
export const loadDeliveryDraft = (localname: string): DeliveryDraft => {
    try { return JSON.parse(safeGet(DRAFT_KEY(localname)) || '{}') || {}; } catch { return {}; }
};
export const saveDeliveryDraft = (localname: string, d: DeliveryDraft) => safeSet(DRAFT_KEY(localname), JSON.stringify(d));

// ─── Telefono e phoneToken (90 giorni, uno per numero) ──────────────────────
/** Normalizza in E.164 con le stesse regole del server (PhoneNumbers.java, default +39). null se non valido. */
export const normalizePhone = (raw: string): string | null => {
    let s = raw.trim().replace(/[\s\-().\/]/g, '');
    if (s.startsWith('00')) s = '+' + s.slice(2);
    // "39 333 1234567" senza "+": prefisso italiano scritto senza il più
    else if (/^393\d{8,9}$/.test(s)) s = '+' + s;
    if (!s.startsWith('+')) {
        if (!/^\d{6,12}$/.test(s)) return null;
        s = '+39' + s;
    }
    if (!/^\+[1-9]\d{7,14}$/.test(s)) return null;
    // Italia: cellulari 3xx (9-10 cifre) e fissi 0x (6-11 cifre)
    if (s.startsWith('+39')) {
        const n = s.slice(3);
        const mobile = n.startsWith('3') && n.length >= 9 && n.length <= 10;
        const landline = n.startsWith('0') && n.length >= 6 && n.length <= 11;
        if (!mobile && !landline) return null;
    }
    return s;
};

/** Verifica SMS attiva sul server? (campo assente = backend precedente = attiva) */
export const phoneVerificationOn = (s: { phoneVerification?: boolean } | null | undefined) => s?.phoneVerification !== false;

interface StoredToken { token: string; expiresAt: string }
const TOKENS_KEY = 'rf_phone_tokens';
const readTokens = (): Record<string, StoredToken> => {
    try { return JSON.parse(safeGet(TOKENS_KEY) || '{}') || {}; } catch { return {}; }
};

/** Token valido per quel numero (con 1 ora di margine), altrimenti null. */
export const getPhoneToken = (phoneE164: string): string | null => {
    const t = readTokens()[phoneE164];
    if (!t?.token) return null;
    const exp = new Date(t.expiresAt).getTime();
    if (Number.isFinite(exp) && exp - Date.now() < 3600_000) return null;
    return t.token;
};

export const savePhoneToken = (phoneE164: string, token: string, expiresAt?: string) => {
    const all = readTokens();
    const now = Date.now();
    for (const [k, v] of Object.entries(all)) if (new Date(v.expiresAt).getTime() < now) delete all[k];
    all[phoneE164] = { token, expiresAt: expiresAt || new Date(now + 90 * 86400_000).toISOString() };
    safeSet(TOKENS_KEY, JSON.stringify(all));
};

/** Il server ha rifiutato il token (401): lo dimentichiamo e si richiede l'SMS. */
export const forgetPhoneToken = (phoneE164: string) => {
    const all = readTokens();
    delete all[phoneE164];
    if (Object.keys(all).length) safeSet(TOKENS_KEY, JSON.stringify(all)); else safeDel(TOKENS_KEY);
};

// ─── Distanza e zone ────────────────────────────────────────────────────────
export const haversineKm = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
};

export const sortedZones = (s: DeliverySettings): DeliveryZone[] =>
    [...(s.zones ?? [])].sort((a, b) => a.maxKm - b.maxKm);

export interface DeliveryQuote {
    distanceKm: number | null;
    zone: DeliveryZone | null;
    outOfZone: boolean;
    maxKm: number;
    /** Tariffa stimata dopo l'eventuale soglia gratuita */
    feeCents: number;
    freeApplied: boolean;
    minOrderCents: number;
    belowMinimum: boolean;
}

export const quoteDelivery = (s: DeliverySettings, point: { lat: number; lng: number } | null, subtotalCents: number): DeliveryQuote => {
    const zones = sortedZones(s);
    const maxKm = zones.length ? zones[zones.length - 1].maxKm : 0;
    const distanceKm = point && s.originLat != null && s.originLng != null
        ? haversineKm(s.originLat, s.originLng, point.lat, point.lng)
        : null;
    const zone = distanceKm == null ? null : zones.find(z => distanceKm <= z.maxKm) ?? null;
    const outOfZone = distanceKm != null && !zone;
    const freeApplied = !!zone && s.freeDeliveryOverCents != null && subtotalCents >= s.freeDeliveryOverCents;
    const feeCents = zone && !freeApplied ? zone.feeCents : 0;
    const minOrderCents = zone?.minOrderCents ?? 0;
    return { distanceKm, zone, outOfZone, maxKm, feeCents, freeApplied, minOrderCents, belowMinimum: !!zone && subtotalCents < minOrderCents };
};

/** Valori "da" mostrati prima di conoscere l'indirizzo (prima zona). */
export const deliveryTeaser = (s: DeliverySettings) => {
    const zones = sortedZones(s);
    return {
        minOrderCents: zones.length ? Math.min(...zones.map(z => z.minOrderCents)) : 0,
        feeCents: zones.length ? Math.min(...zones.map(z => z.feeCents)) : 0,
        freeOverCents: s.freeDeliveryOverCents,
    };
};

export const formatKm = (km: number) => (Number.isInteger(km) ? String(km) : km.toFixed(km < 10 ? 1 : 0).replace('.', ','));

/** Risposta di GET /api/public/delivery/{localname}: impostazioni + campi calcolati dal server. */
export interface PublicDeliveryInfo extends DeliverySettings {
    /** metodi selezionabili ORA (ONLINE solo con pagamenti online attivi) */
    paymentOptions?: ('ONLINE' | 'CASH' | 'CARD')[];
    onlinePaymentAvailable?: boolean;
    /** asporto/consegna sospesi dal locale */
    paused?: boolean;
    maxKm?: number;
}

// ─── Indirizzo dell'ordine sul dispositivo del cliente ──────────────────────
// La vista pubblica della comanda non espone l'indirizzo (privacy): la pagina di stato
// lo mostra dalla copia salvata qui all'invio.
const ORDER_ADDR_KEY = (id: string) => `rf_delivery_addr_${id}`;
export const saveOrderAddress = (id: string, a: DeliveryAddress) =>
    safeSet(ORDER_ADDR_KEY(id), JSON.stringify({ label: a.label, intercom: a.intercom, floor: a.floor, notes: a.notes, savedAt: Date.now() }));
export const loadOrderAddress = (id: string): Partial<DeliveryAddress> | null => {
    try { return JSON.parse(safeGet(ORDER_ADDR_KEY(id)) || 'null'); } catch { return null; }
};
