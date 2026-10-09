import {useCallback, useContext, useEffect, useState} from 'react';
import {LoginContext} from '../Context/LoginContext';
import {useNotification} from '../Context/NotificationContext';
import {IS_ADMIN, IS_WAITER} from '../types';
import {getTabletStatusApi, TabletStatus} from '../Utilities/printApi';
import {clearCached, isAndroid, prefetch, printCached, printWhenReady, ticketKey} from '../Utilities/rawbt';

// Stato caricato una volta per agency (per sessione); invalidato da PrintersPage dopo modifiche.
const statusCache = new Map<number, TabletStatus>();
const HINT_KEY = 'tabletPrintHintShown';

export const invalidateTabletStatus = () => statusCache.clear();

/**
 * Stampa dal tablet (RawBT) per ADMIN e WAITER.
 *  - tabletPrintEnabled: stampante tablet configurata E dispositivo Android → mostrare "Accetta e stampa".
 *  - unavailableReason: stampante tablet configurata ma dispositivo non Android (suggerimento mostrato una volta).
 *  - run(): avvia in parallelo download del ticket e azione (cambio stato / approvazione); se il ticket arriva
 *    oltre la finestra di attivazione resta in cache e la comanda risulta "pending" → printPending() al tocco successivo.
 */
export function useTabletPrinting() {
    const loginCtx = useContext(LoginContext);
    const user = loginCtx?.user;
    const {addNotification} = useNotification();
    const idAgency = user?.idAgency;
    const allowed = !!user && !!loginCtx && (loginCtx.checkVariable(IS_ADMIN) || loginCtx.checkVariable(IS_WAITER));

    const [status, setStatus] = useState<TabletStatus | null>(
        idAgency != null ? statusCache.get(idAgency) ?? null : null);
    const [pending, setPending] = useState<Set<string>>(new Set());

    const android = isAndroid();

    useEffect(() => {
        if (!allowed || idAgency == null) return;
        const cached = statusCache.get(idAgency);
        if (cached) {
            setStatus(cached);
            return;
        }
        let cancelled = false;
        getTabletStatusApi().then(r => {
            if (cancelled || !r.success || !r.data) return;
            statusCache.set(idAgency, r.data);
            setStatus(r.data);
        });
        return () => { cancelled = true; };
    }, [allowed, idAgency]);

    const configured = !!status?.enabled;
    const tabletPrintEnabled = configured && android;
    const unavailableReason = configured && !android
        ? "La stampa dal tablet funziona solo da Chrome su Android (app RawBT): da questo dispositivo non verrà stampato nulla."
        : null;

    // Suggerimento una sola volta per sessione
    useEffect(() => {
        if (!unavailableReason) return;
        try {
            if (sessionStorage.getItem(HINT_KEY)) return;
            sessionStorage.setItem(HINT_KEY, '1');
        } catch { /* storage non disponibile: mostra comunque */ }
        addNotification({message: unavailableReason, type: 'info'});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [unavailableReason]);

    const setPendingFor = (comandId: string, on: boolean) =>
        setPending(prev => {
            const next = new Set(prev);
            if (on) next.add(comandId); else next.delete(comandId);
            return next;
        });

    /**
     * Da chiamare DIRETTAMENTE nel click handler (il download parte subito, nello stesso gesto).
     * @return esito dell'azione (true se nessuna azione)
     */
    const run = useCallback(async (comandId: string, reprint: boolean, action?: () => Promise<boolean>): Promise<boolean> => {
        const tapAt = performance.now();
        const key = ticketKey(comandId, reprint);
        const ticket = prefetch(comandId, reprint);
        const [ok, res] = await Promise.all([
            action ? action() : Promise.resolve(true),
            printWhenReady(key, ticket, tapAt),
        ]);
        switch (res.outcome) {
            case 'deferred':
                if (!ok) {
                    clearCached(key);
                    break;
                }
                setPendingFor(comandId, true);
                addNotification({message: "Stampa pronta: tocca \"Tocca per stampare\" sulla comanda", type: 'warning'});
                break;
            case 'empty':
                if (reprint) addNotification({message: "Nessun prodotto da stampare sulle stampanti tablet", type: 'info'});
                break;
            case 'error':
                addNotification({message: res.message || "Errore stampa dal tablet", type: 'error'});
                break;
            case 'printed':
                setPendingFor(comandId, false);
                break;
        }
        return ok;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /** Stampa sincrona dalla cache (il tocco dà una nuova attivazione). */
    const printPending = useCallback((comandId: string) => {
        const printed = printCached(ticketKey(comandId, false)) || printCached(ticketKey(comandId, true));
        setPendingFor(comandId, false);
        if (!printed) addNotification({message: "Stampa scaduta: usa Ristampa", type: 'error'});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        configured,
        tabletPrintEnabled,
        unavailableReason,
        queuedPrinters: !!status?.queuedPrinters,
        statusLoaded: status != null,
        isPending: (comandId: string) => pending.has(comandId),
        run,
        printPending,
    };
}
