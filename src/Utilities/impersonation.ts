/**
 * Sessione di supporto ("Accedi come") del superadmin.
 *
 * Tutto vive in sessionStorage (mai localStorage): la sessione di supporto
 * resta confinata alla scheda in cui è stata avviata e sparisce chiudendo
 * il browser.
 *
 * - `impersonation`      → token di impersonazione + dati del locale. Finché è
 *                          presente, getToken() (api.ts) usa questo token al posto
 *                          del cookie rf_token, quindi le altre schede restano
 *                          con la sessione superadmin.
 * - `superadmin_session` → backup della sessione superadmin (token + utente),
 *                          usato per ripristinare il cookie all'uscita.
 */
import { getCookie, setCookie } from "./Utilities";
import { LoginResponse, User } from "../types";

export const SUPERADMIN_SESSION_KEY = "superadmin_session";
export const IMPERSONATION_KEY = "impersonation";
export const IMPERSONATION_FORBIDDEN_EVENT = "rf:impersonation-forbidden";

export interface ImpersonationInfo {
    token: string;
    agencyId: number;
    agencyName: string;
    localname: string;
    expiresAt: string;
}

interface SuperadminSession {
    token: string;
    user: User | null;
}

const readJson = <T,>(key: string): T | null => {
    try {
        const raw = window.sessionStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : null;
    } catch {
        return null;
    }
};

const writeJson = (key: string, value: unknown) => {
    try {
        window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
        /* storage non disponibile */
    }
};

const remove = (key: string) => {
    try {
        window.sessionStorage.removeItem(key);
    } catch {
        /* ignore */
    }
};

export const getImpersonation = (): ImpersonationInfo | null => {
    const info = readJson<ImpersonationInfo>(IMPERSONATION_KEY);
    return info && info.token ? info : null;
};

export const isImpersonating = (): boolean => getImpersonation() !== null;

export const isImpersonationExpired = (info: ImpersonationInfo | null = getImpersonation()): boolean => {
    if (!info) return false;
    const t = new Date(info.expiresAt).getTime();
    return !Number.isNaN(t) && t <= Date.now();
};

/** Token della sessione di supporto, se attiva in questa scheda. */
export const getImpersonationToken = (): string | null => getImpersonation()?.token ?? null;

/**
 * Avvia la sessione di supporto: salva la sessione superadmin, memorizza il
 * token di impersonazione e ricarica la pagina sulla dashboard del locale
 * (il reload riapre anche la connessione SSE con il nuovo token).
 */
export const startImpersonation = (
    params: { token: string; expiresAt: string; agency: { id: number; name: string; localname: string }; auth: LoginResponse },
    superadminUser: User | null,
) => {
    const superToken = getCookie("rf_token") || "";
    // Non sovrascrivere il backup se esiste già (es. doppio click)
    if (!readJson<SuperadminSession>(SUPERADMIN_SESSION_KEY)) {
        writeJson(SUPERADMIN_SESSION_KEY, { token: superToken, user: superadminUser } as SuperadminSession);
    }
    const localname = params.auth?.localname || params.agency.localname;
    writeJson(IMPERSONATION_KEY, {
        token: params.auth?.accessToken || params.token,
        agencyId: params.agency.id,
        agencyName: params.agency.name || params.auth?.name || localname,
        localname,
        expiresAt: params.expiresAt,
    } as ImpersonationInfo);
    window.location.assign("/" + encodeURIComponent(localname) + "/Dashboard/Home");
};

/** Rimuove i dati della sessione di supporto senza navigare (es. nuovo login). */
export const clearImpersonationStorage = () => {
    remove(IMPERSONATION_KEY);
    remove(SUPERADMIN_SESSION_KEY);
};

let exiting = false;

/**
 * Termina la sessione di supporto: ripristina la sessione superadmin e torna
 * alla scheda del locale nella console. Idempotente.
 */
export const endImpersonation = () => {
    if (exiting) return;
    const info = getImpersonation();
    const backup = readJson<SuperadminSession>(SUPERADMIN_SESSION_KEY);
    if (!info && !backup) return;
    exiting = true;
    remove(IMPERSONATION_KEY);
    if (backup?.token && getCookie("rf_token") !== backup.token) {
        setCookie("rf_token", backup.token, 1);
    }
    remove(SUPERADMIN_SESSION_KEY);
    window.location.assign(info ? "/superadmin/agencies/" + info.agencyId : "/superadmin");
};
