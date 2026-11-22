import * as React from 'react';
import {useEffect, useState} from 'react';
import {X, Users, Clock, Lock, Receipt, UtensilsCrossed, RefreshCw} from 'lucide-react';
import {getWaiterTableSessionApi} from '../../Utilities/api';
import {WaiterSessionState} from '../../types';
import {tableLabel} from '../tableLabel';
import {orderTotal, useTableOrders} from '../../Hooks/useTableOrders';

export interface TableInfoTable {
    id: string;
    name: string;
    seats?: number;
    code?: string;
    busy: boolean;
    location: string;
}

interface TableInfoProps {
    table: TableInfoTable;
    onClose: () => void;
    /** Apre la conferma di chiusura del tavolo (sempre disponibile a tavolo occupato) */
    onCloseTable?: (table: TableInfoTable) => void;
    onOccupy?: (table: TableInfoTable) => void;
    onGroupSession?: (table: TableInfoTable) => void;
    /** Cambia a ogni aggiornamento periodico della Sala: ricarica sessione e ordini */
    refreshKey?: number;
}

const eur = (n: number) => new Intl.NumberFormat('it-IT', {style: 'currency', currency: 'EUR'}).format(n);

const STATUS_LABEL: Record<string, string> = {
    AWAIT: 'Da accettare', PENDING: 'In attesa', PROGRESS: 'In cucina', COMPLETED: 'Servito',
    AWAIT_PAYMENT: 'In attesa di pagamento', AWAIT_APPROVAL: 'Da approvare',
};

const STATUS_CLASS: Record<string, string> = {
    AWAIT: 'bg-amber-100 text-amber-800', PENDING: 'bg-amber-100 text-amber-800',
    PROGRESS: 'bg-blue-100 text-blue-700', COMPLETED: 'bg-green-100 text-green-700',
};

const since = (iso?: string): string => {
    if (!iso) return '';
    const ms = Date.now() - new Date(iso).getTime();
    if (!Number.isFinite(ms) || ms < 0) return '';
    const min = Math.floor(ms / 60000);
    if (min < 1) return 'da meno di un minuto';
    if (min < 60) return `da ${min} min`;
    const h = Math.floor(min / 60);
    return `da ${h} h ${min % 60} min`;
};

const TableInfo: React.FC<TableInfoProps> = ({table, onClose, onCloseTable, onOccupy, onGroupSession, refreshKey = 0}) => {
    const tableId = Number(table.id);
    const [session, setSession] = useState<WaiterSessionState | null>(null);
    const [loadingSession, setLoadingSession] = useState<boolean>(table.busy);
    const {orders, comands, total, toCollect, firstOrderAt, loading: loadingOrders, error: ordersError, reload} =
        useTableOrders(tableId, table.busy, refreshKey);

    useEffect(() => {
        if (!table.busy) { setSession(null); setLoadingSession(false); return; }
        let cancelled = false;
        getWaiterTableSessionApi(tableId).then(r => {
            if (cancelled) return;
            // 404 = tavolo occupato senza sessione gruppo: si mostrano comunque coperti e ordini del tavolo
            setSession(r.success && r.data ? r.data : null);
            setLoadingSession(false);
        });
        return () => { cancelled = true; };
    }, [tableId, table.busy, refreshKey]);

    const firstOrderLabel = firstOrderAt
        ? new Date(firstOrderAt).toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'})
        : '';

    const seats = session?.seats || table.seats;
    const code = session?.accessCode || table.code;
    const paidIds = new Set(comands.filter(c => c.paid || c.checkout).map(c => c.id));

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-5 border-b border-zinc-200">
                    <div>
                        <h2 className="text-lg font-bold text-zinc-800">{tableLabel(table.name, tableId)}</h2>
                        <p className="text-xs text-zinc-500">{table.location}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${table.busy ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {table.busy ? 'Occupato' : 'Libero'}
                        </span>
                        <button onClick={onClose} aria-label="Chiudi" className="p-1 text-zinc-500 hover:text-zinc-700"><X className="w-5 h-5"/></button>
                    </div>
                </div>

                <div className="p-5 space-y-5">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-3">
                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1"><Users className="w-3.5 h-3.5"/>{table.busy ? 'Coperti' : 'Posti'}</p>
                            <p className="text-xl font-bold text-zinc-800 mt-1">{loadingSession && !seats ? '...' : seats || '-'}</p>
                        </div>
                        {table.busy && (
                            <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-3">
                                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1"><Lock className="w-3.5 h-3.5"/>Codice</p>
                                <p className="text-xl font-mono font-bold tracking-widest text-zinc-800 mt-1">
                                    {loadingSession && !code ? '...' : code || '-'}
                                </p>
                            </div>
                        )}
                    </div>

                    {!table.busy ? (
                        <p className="text-sm text-zinc-600">Il tavolo è libero: nessun ordine aperto.</p>
                    ) : (
                        <>
                            <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-3 flex items-start gap-2 text-sm text-zinc-700">
                                <Clock className="w-4 h-4 mt-0.5 text-zinc-500 flex-shrink-0"/>
                                {firstOrderAt
                                    ? <span>Primo ordine alle <b>{firstOrderLabel}</b> ({since(firstOrderAt)})</span>
                                    : <span>{loadingOrders ? 'Caricamento ordini...' : 'Nessun ordine ancora inviato.'}</span>}
                            </div>

                            {session && (
                                <p className="text-sm text-zinc-600">
                                    Clienti collegati: <b>{session.clients.length}</b>
                                    {session.clients.length > 0 && ` (${session.clients.filter(c => c.ready).length} pronti)`}
                                </p>
                            )}

                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1">
                                    <UtensilsCrossed className="w-3.5 h-3.5"/>Ordini del tavolo ({orders.length})
                                </p>
                                {ordersError && (
                                    <div className="mb-2 rounded-lg bg-amber-50 border border-amber-200 p-2 text-xs text-amber-800 flex items-center justify-between gap-2">
                                        <span>Impossibile caricare gli ordini già serviti: sono mostrati solo quelli aperti.</span>
                                        <button onClick={() => reload()} className="inline-flex items-center gap-1 font-semibold flex-shrink-0"><RefreshCw className="w-3 h-3"/>Riprova</button>
                                    </div>
                                )}
                                {loadingOrders && orders.length === 0 ? (
                                    <p className="text-sm text-zinc-400">Caricamento...</p>
                                ) : orders.length === 0 ? (
                                    <p className="text-sm text-zinc-400">Nessun ordine per questo tavolo.</p>
                                ) : (
                                    <ul className="space-y-2">
                                        {orders.map(o => (
                                            <li key={o.id} className="border border-zinc-200 rounded-lg p-3">
                                                <div className="flex justify-between items-center mb-1 gap-2">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_CLASS[o.status] || 'bg-zinc-100 text-zinc-600'}`}>{STATUS_LABEL[o.status] || o.status}</span>
                                                        {paidIds.has(o.id) && <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Pagato</span>}
                                                    </div>
                                                    <span className="text-sm font-semibold text-zinc-800">{eur(orderTotal(o))}</span>
                                                </div>
                                                <ul className="text-sm text-zinc-600">
                                                    {o.items.map((it, i) => (
                                                        <li key={i}>{it.quantity}× {it.productName}{it.option ? ` (${it.option})` : ''}</li>
                                                    ))}
                                                </ul>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                                {orders.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-zinc-200 space-y-1">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-zinc-700 flex items-center gap-1"><Receipt className="w-4 h-4"/>Totale</span>
                                            <span className="text-lg font-bold text-zinc-900">{eur(total)}</span>
                                        </div>
                                        {toCollect > 0 && toCollect < total && (
                                            <div className="flex justify-between items-center text-sm text-zinc-600">
                                                <span>Da incassare</span>
                                                <span className="font-semibold">{eur(toCollect)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    <div className="flex flex-col gap-2 pt-2 border-t border-zinc-200">
                        {table.busy && onGroupSession && (
                            <button onClick={() => { onClose(); onGroupSession(table); }}
                                    className="w-full py-2.5 bg-zinc-200 text-zinc-800 font-semibold rounded-lg">Sessione gruppo</button>
                        )}
                        {table.busy && onCloseTable && (
                            <button onClick={() => { onClose(); onCloseTable(table); }}
                                    className="w-full py-2.5 bg-red-500 text-white font-bold rounded-lg">Chiudi tavolo</button>
                        )}
                        {!table.busy && onOccupy && (
                            <button onClick={() => { onClose(); onOccupy(table); }}
                                    className="w-full py-2.5 bg-primary text-white font-bold rounded-lg">Occupa tavolo</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TableInfo;
