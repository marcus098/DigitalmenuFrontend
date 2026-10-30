import { useCallback, useEffect, useRef, useState } from 'react';
import { getAiInsightsApi, getAiStatusApi, refreshAiInsightApi } from '../Utilities/api';
import { AiInsight, AiInsightRefreshKind, AiInsightsResponse } from '../types';

export type AiInsightKey = 'daily' | 'weekly' | 'menuTips';

export const AI_REFRESH_KIND: Record<AiInsightKey, AiInsightRefreshKind> = {
    daily: 'daily',
    weekly: 'weekly',
    menuTips: 'menu-tips',
};

const POLL_INTERVAL_MS = 5000;
const POLL_MAX_MS = 3 * 60 * 1000;

// ── Stato AI: chiesto una sola volta per sessione (la pagina non si ricarica tra una schermata e l'altra) ──
let aiStatusPromise: Promise<boolean> | null = null;

export const getAiEnabledCached = (): Promise<boolean> => {
    if (!aiStatusPromise) {
        aiStatusPromise = getAiStatusApi().then(r => {
            const enabled = !!(r.success && r.data?.aiEnabled);
            // Errore di rete/server: riprova alla prossima richiesta invece di nascondere il pulsante per sempre
            if (!r.success && (r.status === -1 || r.status >= 500)) aiStatusPromise = null;
            return enabled;
        });
    }
    return aiStatusPromise;
};

/** true se l'assistente AI è attivo (solo quando `enabled`, es. utente titolare). */
export const useAiEnabled = (enabled: boolean = true): boolean => {
    const [aiEnabled, setAiEnabled] = useState(false);
    useEffect(() => {
        if (!enabled) return;
        let alive = true;
        getAiEnabledCached().then(v => { if (alive) setAiEnabled(v); });
        return () => { alive = false; };
    }, [enabled]);
    return enabled && aiEnabled;
};

/**
 * Riepiloghi AxiomAI. Ricarica ogni 5 s finché una delle voci richieste è PENDING (massimo ~3 minuti).
 * `available` = false se l'endpoint non è raggiungibile per questo utente (403/404): le card vanno nascoste.
 */
export const useAiInsights = (enabled: boolean, keys: AiInsightKey[]) => {
    const [data, setData] = useState<AiInsightsResponse | null>(null);
    const [loading, setLoading] = useState(enabled);
    const [available, setAvailable] = useState(true);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [errors, setErrors] = useState<Partial<Record<AiInsightKey, string>>>({});
    const [refreshing, setRefreshing] = useState<Partial<Record<AiInsightKey, boolean>>>({});
    const [pollTimedOut, setPollTimedOut] = useState(false);
    // Cambia a ogni risposta (anche di errore): il polling riparte anche se una ricarica fallisce
    const [loadTick, setLoadTick] = useState(0);

    const mountedRef = useRef(true);
    const pollStartRef = useRef<number | null>(null);
    const keysKey = keys.join(',');

    useEffect(() => {
        mountedRef.current = true;
        return () => { mountedRef.current = false; };
    }, []);

    const load = useCallback(async () => {
        const r = await getAiInsightsApi();
        if (!mountedRef.current) return;
        if (r.success && r.data) {
            setData(r.data);
            setLoadError(null);
        } else if (r.status === 403 || r.status === 404) {
            setAvailable(false);
        } else {
            setLoadError(r.message || 'Impossibile caricare il riepilogo');
        }
        setLoading(false);
        setLoadTick(t => t + 1);
    }, []);

    useEffect(() => {
        if (!enabled) return;
        setLoading(true);
        load();
    }, [enabled, load]);

    const anyPending = !!data && keysKey.split(',').some(k => data[k as AiInsightKey]?.status === 'PENDING');

    // Polling: ogni nuovo `data` programma la ricarica successiva; il cleanup cancella il timer (anche all'unmount)
    useEffect(() => {
        if (!anyPending) {
            pollStartRef.current = null;
            return;
        }
        if (pollStartRef.current === null) pollStartRef.current = Date.now();
        if (Date.now() - pollStartRef.current > POLL_MAX_MS) {
            setPollTimedOut(true);
            return;
        }
        const t = window.setTimeout(load, POLL_INTERVAL_MS);
        return () => window.clearTimeout(t);
    }, [data, loadTick, anyPending, load]);

    /** Ricarica manuale dopo il timeout del polling */
    const reload = useCallback(() => {
        pollStartRef.current = null;
        setPollTimedOut(false);
        setLoading(true);
        load();
    }, [load]);

    const refresh = useCallback(async (key: AiInsightKey) => {
        setErrors(e => ({ ...e, [key]: undefined }));
        setRefreshing(s => ({ ...s, [key]: true }));
        const r = await refreshAiInsightApi(AI_REFRESH_KIND[key]);
        if (!mountedRef.current) return;
        setRefreshing(s => ({ ...s, [key]: false }));
        if (r.success && r.data) {
            const insight = r.data as AiInsight;
            pollStartRef.current = null;
            setPollTimedOut(false);
            setData(d => ({ ...(d ?? { aiEnabled: false, daily: null, weekly: null, menuTips: null }), [key]: insight }));
        } else {
            setErrors(e => ({ ...e, [key]: r.message || 'Impossibile aggiornare il riepilogo' }));
        }
    }, []);

    return { data, loading, available, loadError, errors, refreshing, pollTimedOut, refresh, reload };
};
