import {getTabletTicketApi} from "./printApi";

/**
 * Stampa dal tablet Android tramite l'app RawBT (ru.a402d.rawbtprinter): il browser apre un intent con i byte
 * ESC/POS in base64 e RawBT li invia alla stampante (Bluetooth / USB / WiFi:9100).
 *
 * Chrome apre l'intent solo con "user activation" transitoria (~5s dal tocco): per questo il ticket va scaricato
 * subito dopo il tocco e, se arriva troppo tardi, resta in cache e si stampa al tocco successivo ("Tocca per stampare").
 */

export const RAWBT_PLAY_URL = "https://play.google.com/store/apps/details?id=ru.a402d.rawbtprinter";

/** Margine sotto i ~5s di Chrome. */
export const ACTIVATION_WINDOW_MS = 4000;

const CACHE_TTL_MS = 15 * 60 * 1000;

export const isAndroid = (): boolean =>
    typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent || '');

export const printViaRawBT = (base64: string) => {
    window.location.href = "intent:base64," + base64
        + "#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;S.browser_fallback_url="
        + encodeURIComponent(RAWBT_PLAY_URL) + ";end;";
};

// ── Cache ticket ─────────────────────────────────────────────────────────────

const cache = new Map<string, { b64: string; at: number }>();

export const ticketKey = (comandId: string, reprint = false) => `${comandId}:${reprint ? 'R' : 'N'}`;

export const cacheTicket = (key: string, b64: string) => {
    cache.set(key, {b64, at: Date.now()});
};

export const hasCached = (key: string): boolean => {
    const e = cache.get(key);
    if (!e) return false;
    if (Date.now() - e.at > CACHE_TTL_MS) {
        cache.delete(key);
        return false;
    }
    return true;
};

/** Stampa in modo sincrono dalla cache (da chiamare direttamente nel click handler). */
export const printCached = (key: string): boolean => {
    if (!hasCached(key)) return false;
    const e = cache.get(key)!;
    cache.delete(key);
    printViaRawBT(e.b64);
    return true;
};

export const clearCached = (key: string) => {
    cache.delete(key);
};

// ── Fetch + stampa entro la finestra di attivazione ──────────────────────────

export type FetchOutcome =
    | { kind: 'ok'; b64: string; tickets: number }
    | { kind: 'empty' }
    | { kind: 'error'; message: string };

/** Scarica il ticket tablet della comanda e lo mette in cache (chiave ticketKey(comandId, reprint)). */
export const prefetch = async (comandId: string, reprint = false): Promise<FetchOutcome> => {
    const res = await getTabletTicketApi(comandId, reprint);
    if (res.status === 204 || (res.success && !res.data?.escposBase64)) return {kind: 'empty'};
    if (res.success && res.data) {
        cacheTicket(ticketKey(comandId, reprint), res.data.escposBase64);
        return {kind: 'ok', b64: res.data.escposBase64, tickets: res.data.tickets};
    }
    if (res.status === 409) return {kind: 'error', message: "Comanda non stampabile (cancellata o in attesa di pagamento)"};
    return {kind: 'error', message: "Errore preparazione stampa"};
};

export type PrintOutcome = 'printed' | 'deferred' | 'empty' | 'error';

/**
 * Attende il ticket e, se si è ancora entro la finestra di attivazione del tocco (tapAt = performance.now()
 * nel click handler), apre RawBT. Altrimenti lascia il ticket in cache → 'deferred'.
 */
export const printWhenReady = async (key: string, ticket: Promise<FetchOutcome>, tapAt: number)
    : Promise<{ outcome: PrintOutcome; message?: string }> => {
    const r = await ticket;
    if (r.kind === 'empty') return {outcome: 'empty'};
    if (r.kind === 'error') return {outcome: 'error', message: r.message};
    cacheTicket(key, r.b64);
    const ua = (navigator as any).userActivation;
    const active = ua ? ua.isActive !== false : true;
    if (performance.now() - tapAt <= ACTIVATION_WINDOW_MS && active) {
        printCached(key);
        return {outcome: 'printed'};
    }
    return {outcome: 'deferred'};
};
