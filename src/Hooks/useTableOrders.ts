import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {useData} from '../Context/DataContext';
import {getComandsByTableApi} from '../Utilities/api';
import {Comand} from '../ComandType';

/** Stati di una comanda non ancora servita (in attesa, da approvare o in cucina). */
const UNFINISHED = new Set(['AWAIT', 'PENDING', 'PROGRESS', 'AWAIT_APPROVAL']);
/** Mai mostrate nel conto del tavolo: eliminate o in attesa del prepagamento online. */
const EXCLUDED = new Set(['DELETED', 'AWAIT_PAYMENT']);

/**
 * Ordini della sessione corrente di un tavolo, con totali.
 *
 * La lista `comands` del DataContext contiene solo le comande ancora aperte (niente COMPLETED):
 * da sola fa sparire dal dettaglio tavolo tutto ciò che è già stato servito, cioè quasi tutto il conto.
 * Per questo si legge anche /api/comands/table/{id} (comande della sessione, servite comprese) e si
 * uniscono le due fonti: lo stato "live" del contesto (aggiornato via SSE) vince su quello letto.
 *
 * Si ricarica a ogni evento ordine (orderEventTick) e quando cambia `refreshKey` (polling della Sala).
 */
export const useTableOrders = (tableId: number, enabled: boolean, refreshKey: number = 0) => {
    const {comands, orderEventTick, mapRawOrderToOrder} = useData();
    const [fetched, setFetched] = useState<Comand[]>([]);
    const [loading, setLoading] = useState<boolean>(enabled);
    const [error, setError] = useState<boolean>(false);
    // Solo l'ultima richiesta aggiorna lo stato (risposte fuori ordine o arrivate dopo la chiusura)
    const requestRef = useRef(0);

    const load = useCallback(async () => {
        const id = ++requestRef.current;
        if (!enabled) {
            setFetched([]); setError(false); setLoading(false);
            return;
        }
        const res = await getComandsByTableApi(tableId);
        if (id !== requestRef.current) return;
        if (res.success && Array.isArray(res.data)) {
            setFetched(res.data);
            setError(false);
        } else {
            setError(true);
        }
        setLoading(false);
    }, [tableId, enabled]);

    // Cambio di tavolo (o tavolo aperto/chiuso): si riparte da vuoto con il caricamento visibile
    useEffect(() => {
        setFetched([]);
        setError(false);
        setLoading(enabled);
    }, [tableId, enabled]);

    useEffect(() => {
        load();
    }, [load, refreshKey, orderEventTick]);

    useEffect(() => () => { requestRef.current++; }, []);

    const tableComands = useMemo(() => {
        if (!enabled) return [];
        const byId = new Map<string, Comand>();
        // Il server filtra già per sessione del tavolo; il controllo su idTable evita comunque di mostrare
        // comande di altri tavoli o asporti se la sessione risultasse vuota
        for (const c of fetched) if (c.id && c.idTable === tableId) byId.set(c.id, c);
        for (const c of comands) {
            if (!c.id || c.idTable !== tableId) continue;
            byId.set(c.id, {...byId.get(c.id), ...c});
        }
        return Array.from(byId.values())
            .filter(c => !EXCLUDED.has(c.status))
            .sort((a, b) => (a.createdAt || '').localeCompare(b.createdAt || ''));
    }, [fetched, comands, tableId, enabled]);

    const orders = useMemo(() => mapRawOrderToOrder(tableComands), [tableComands, mapRawOrderToOrder]);

    const summary = useMemo(() => {
        const comandById = new Map(tableComands.map(c => [c.id, c]));
        let total = 0;
        let toCollect = 0;
        let unfinished = 0;
        for (const o of orders) {
            const t = orderTotal(o);
            total += t;
            const c = comandById.get(o.id);
            if (c && !c.paid && !c.checkout) toCollect += t;
            if (UNFINISHED.has(o.status)) unfinished++;
        }
        const firstOrderAt = tableComands.map(c => c.createdAt).filter(Boolean).sort()[0];
        return {total, toCollect, unfinished, firstOrderAt};
    }, [orders, tableComands]);

    return {comands: tableComands, orders, ...summary, loading, error, reload: load};
};

type MappedOrder = ReturnType<ReturnType<typeof useData>['mapRawOrderToOrder']>[number];

/** Totale di una comanda: quello calcolato dal server se presente, altrimenti la somma delle righe. */
export const orderTotal = (o: MappedOrder): number =>
    typeof o.totalCents === 'number' && o.totalCents > 0
        ? o.totalCents / 100
        : o.items.reduce((s, it) => s + (it.total || 0) * it.quantity, 0);

export const isUnfinishedStatus = (status?: string) => !!status && UNFINISHED.has(status);
