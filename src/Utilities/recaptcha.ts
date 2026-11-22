import { useEffect } from "react";

/**
 * Google reCAPTCHA v3 (invisibile, a punteggio) per login e registrazioni.
 *
 * - Site key da REACT_APP_RECAPTCHA_SITE_KEY (build-time, come le altre REACT_APP_*). Vuota = tutto disattivato:
 *   lo script non viene caricato e non si invia alcun token (sviluppo invariato).
 * - Lo script di Google si carica solo nelle pagine che chiamano useRecaptcha() (login, registrazioni).
 * - Il token va nel corpo della richiesta, campo "recaptchaToken"; il backend lo verifica con l'azione attesa.
 */

const SITE_KEY = (process.env.REACT_APP_RECAPTCHA_SITE_KEY || "").trim();
const SCRIPT_ID = "google-recaptcha-v3";
const LOAD_TIMEOUT_MS = 10_000;
const EXECUTE_TIMEOUT_MS = 8_000;

export type RecaptchaAction = "login" | "signup" | "signup_staff";

type Grecaptcha = {
    ready: (cb: () => void) => void;
    execute: (siteKey: string, options: { action: string }) => Promise<string>;
};

declare global {
    interface Window {
        grecaptcha?: Grecaptcha;
    }
}

let loading: Promise<Grecaptcha> | null = null;

export const isRecaptchaEnabled = (): boolean => SITE_KEY.length > 0;

const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> =>
    new Promise<T>((resolve, reject) => {
        const t = window.setTimeout(() => reject(new Error("reCAPTCHA timeout")), ms);
        p.then(v => { window.clearTimeout(t); resolve(v); }, e => { window.clearTimeout(t); reject(e); });
    });

const loadRecaptcha = (): Promise<Grecaptcha> => {
    if (loading) return loading;
    loading = withTimeout(new Promise<Grecaptcha>((resolve, reject) => {
        const onReady = () => window.grecaptcha!.ready(() => resolve(window.grecaptcha!));
        if (window.grecaptcha?.execute) { onReady(); return; }
        let script = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
        if (!script) {
            script = document.createElement("script");
            script.id = SCRIPT_ID;
            script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(SITE_KEY)}`;
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
        }
        script.addEventListener("load", () => window.grecaptcha ? onReady() : reject(new Error("reCAPTCHA non disponibile")));
        script.addEventListener("error", () => reject(new Error("reCAPTCHA non caricato")));
    }), LOAD_TIMEOUT_MS).catch(err => {
        loading = null; // al prossimo tentativo si riprova
        throw err;
    });
    return loading;
};

const setBadgeVisible = (visible: boolean) => {
    const badge = document.querySelector<HTMLElement>(".grecaptcha-badge");
    if (badge) badge.style.visibility = visible ? "visible" : "hidden";
};

/** Precarica lo script nella pagina corrente e mostra il badge solo finché la pagina è aperta. */
export const useRecaptcha = () => {
    useEffect(() => {
        if (!isRecaptchaEnabled()) return;
        loadRecaptcha().then(() => setBadgeVisible(true)).catch(() => { /* gestito al submit */ });
        return () => setBadgeVisible(false);
    }, []);
};

/**
 * Token per l'azione indicata, oppure undefined se reCAPTCHA è disattivato o Google non risponde
 * (in quel caso il backend decide: con la verifica attiva il browser riceve un 403 con messaggio).
 */
export const getRecaptchaToken = async (action: RecaptchaAction): Promise<string | undefined> => {
    if (!isRecaptchaEnabled()) return undefined;
    try {
        const g = await loadRecaptcha();
        return await withTimeout(g.execute(SITE_KEY, { action }), EXECUTE_TIMEOUT_MS);
    } catch {
        return undefined;
    }
};
