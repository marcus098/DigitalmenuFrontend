import { apiCall, ApiCallResult } from "../Utilities/helper";
import {
    AgencyDetail, AgencyNote, AgencySummary, AuditEntry, ImpersonateResponse,
    SubscriptionStatus, SubscriptionUpdate, SuperadminStats,
} from "./types";

const BASE = "/api/superadmin";

/** Risultato semplificato: dati già estratti da `{data: ...}`, oppure messaggio d'errore. */
export interface SaResult<T> {
    ok: boolean;
    status: number;
    data: T | null;
    message: string | null;
}

const call = async <T,>(method: string, url: string, data?: unknown): Promise<SaResult<T>> => {
    const res: ApiCallResult<{ data: T }> = await apiCall<{ data: T }>({ method, url: BASE + url, data, fixed: true });
    const payload: any = res.data;
    const unwrapped = (payload && typeof payload === 'object' && 'data' in payload ? payload.data : payload) as T | null;
    const message = res.success
        ? null
        : res.message && !res.message.startsWith('Request failed') && !res.message.startsWith('Network Error')
            ? res.message
            : res.status === 403 ? 'Accesso negato' : res.status === -1 ? 'Server non raggiungibile' : 'Operazione non riuscita';
    return { ok: res.success, status: res.status, data: res.success ? unwrapped : null, message };
};

export const getSuperadminStats = () => call<SuperadminStats>('GET', '/stats');

export const getAgencies = (q: string, status: SubscriptionStatus | '') => {
    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (status) params.set('status', status);
    const qs = params.toString();
    return call<AgencySummary[]>('GET', '/agencies' + (qs ? '?' + qs : ''));
};

export const getAgencyDetail = (id: number) => call<AgencyDetail>('GET', `/agencies/${id}`);

export const updateAgencySubscription = (id: number, body: SubscriptionUpdate) =>
    call<AgencySummary>('PUT', `/agencies/${id}/subscription`, body);

export const addAgencyNote = (id: number, text: string, pinned = false) =>
    call<AgencyNote>('POST', `/agencies/${id}/notes`, { text, pinned });

export const setNotePinned = (noteId: number, pinned: boolean) =>
    call<AgencyNote>('PATCH', `/notes/${noteId}`, { pinned });

export const deleteNote = (noteId: number) => call<unknown>('DELETE', `/notes/${noteId}`);

export const impersonateAgency = (id: number, reason: string) =>
    call<ImpersonateResponse>('POST', `/agencies/${id}/impersonate`, { reason });

export const getAuditLog = (agencyId?: number | null, limit = 100) => {
    const params = new URLSearchParams();
    if (agencyId) params.set('agencyId', String(agencyId));
    params.set('limit', String(limit));
    return call<AuditEntry[]>('GET', '/audit?' + params.toString());
};
