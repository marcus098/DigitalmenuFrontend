import React, { useCallback, useEffect, useState } from 'react';
import { X, Lock, Users, Send, RefreshCw, LogOut } from 'lucide-react';
import { useNotification } from '../../Context/NotificationContext';
import {
    closeTableSessionApi,
    forceSubmitTableSessionApi,
    getWaiterTableSessionApi,
    openTableSessionApi,
    updateTableSeatsApi,
} from '../../Utilities/api';
import { WaiterSessionState } from '../../types';

interface GroupSessionModalProps {
    tableId: number;
    tableName: string;
    onClose: () => void;
}

const GroupSessionModal: React.FC<GroupSessionModalProps> = ({ tableId, tableName, onClose }) => {
    const { addNotification } = useNotification();
    const [loading, setLoading] = useState<boolean>(true);
    const [busy, setBusy] = useState<boolean>(false);
    const [session, setSession] = useState<WaiterSessionState | null>(null);
    const [seatsInput, setSeatsInput] = useState<number>(2);

    const fetchSession = useCallback(async () => {
        setLoading(true);
        const result = await getWaiterTableSessionApi(tableId);
        if (result.success && result.data) {
            setSession(result.data);
            setSeatsInput(result.data.seats);
        } else {
            setSession(null);
        }
        setLoading(false);
    }, [tableId]);

    useEffect(() => {
        fetchSession();
    }, [fetchSession]);

    const handleOpen = async () => {
        if (seatsInput <= 0) {
            addNotification({ type: 'warning', message: 'Inserisci un numero di coperti valido.' });
            return;
        }
        setBusy(true);
        const result = await openTableSessionApi(tableId, seatsInput);
        setBusy(false);
        if (result.success && result.data) {
            addNotification({ type: 'success', message: 'Tavolo aperto!' });
            await fetchSession();
        } else if (result.status === 409) {
            addNotification({ type: 'warning', message: 'Tavolo già aperto.' });
            await fetchSession();
        } else {
            addNotification({ type: 'error', message: 'Errore nell\'apertura del tavolo.' });
        }
    };

    const handleClose = async () => {
        setBusy(true);
        const result = await closeTableSessionApi(tableId);
        setBusy(false);
        if (result.success) {
            addNotification({ type: 'success', message: 'Tavolo chiuso.' });
            onClose();
        } else {
            addNotification({ type: 'error', message: 'Errore nella chiusura del tavolo.' });
        }
    };

    const handleUpdateSeats = async () => {
        if (seatsInput <= 0) return;
        setBusy(true);
        const result = await updateTableSeatsApi(tableId, seatsInput);
        setBusy(false);
        if (result.success && result.data) {
            addNotification({ type: 'success', message: 'Coperti aggiornati.' });
            setSession(result.data);
        } else {
            addNotification({ type: 'error', message: 'Errore aggiornamento coperti.' });
        }
    };

    const handleForceSubmit = async () => {
        setBusy(true);
        const result = await forceSubmitTableSessionApi(tableId);
        setBusy(false);
        if (result.success && result.data) {
            addNotification({ type: 'success', message: 'Ordini inviati!' });
            setSession(result.data);
        } else {
            addNotification({ type: 'error', message: 'Errore nell\'invio forzato.' });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center p-5 border-b border-zinc-200">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-bold text-zinc-800">Sessione gruppo · {tableName}</h2>
                    </div>
                    <button onClick={onClose} className="p-1 text-zinc-500 hover:text-zinc-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    {loading ? (
                        <p className="text-sm text-zinc-500">Caricamento...</p>
                    ) : !session ? (
                        <div>
                            <p className="text-sm text-zinc-600 mb-3">
                                Nessuna sessione aperta. Apri il tavolo per generare una password di 4 caratteri da consegnare ai clienti.
                            </p>
                            <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                                Coperti
                            </label>
                            <input
                                type="number"
                                min={1}
                                value={seatsInput}
                                onChange={(e) => setSeatsInput(parseInt(e.target.value, 10) || 0)}
                                className="w-full mt-1 mb-3 px-3 py-2 border border-zinc-300 rounded-lg"
                            />
                            <button
                                onClick={handleOpen}
                                disabled={busy}
                                className="w-full py-2.5 bg-primary text-white font-bold rounded-lg disabled:opacity-50"
                            >
                                {busy ? 'Apertura...' : 'Apri tavolo'}
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="text-center">
                                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">
                                    Password
                                </p>
                                <div className="flex items-center justify-center gap-2 py-4 px-5 rounded-2xl bg-zinc-100 border-2 border-dashed border-zinc-300">
                                    <Lock className="w-5 h-5 text-zinc-500" />
                                    <span className="text-5xl font-mono font-bold tracking-[0.5rem] text-zinc-800">
                                        {session.accessCode}
                                    </span>
                                </div>
                                <button
                                    onClick={fetchSession}
                                    className="mt-2 inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-700"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    Aggiorna
                                </button>
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                                    Coperti
                                </label>
                                <div className="flex gap-2 mt-1">
                                    <input
                                        type="number"
                                        min={1}
                                        value={seatsInput}
                                        onChange={(e) => setSeatsInput(parseInt(e.target.value, 10) || 0)}
                                        className="flex-1 px-3 py-2 border border-zinc-300 rounded-lg"
                                    />
                                    <button
                                        onClick={handleUpdateSeats}
                                        disabled={busy || seatsInput === session.seats}
                                        className="px-3 py-2 bg-zinc-200 text-zinc-700 text-sm font-semibold rounded-lg disabled:opacity-50"
                                    >
                                        Salva
                                    </button>
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">
                                    Clienti collegati ({session.clients.length})
                                </p>
                                {session.clients.length === 0 ? (
                                    <p className="text-sm text-zinc-400">Nessuno collegato.</p>
                                ) : (
                                    <ul className="divide-y divide-zinc-200 border border-zinc-200 rounded-lg overflow-hidden">
                                        {session.clients.map((c) => (
                                            <li key={c.clientSessionId} className="px-3 py-2 flex items-center justify-between text-sm">
                                                <span className="font-semibold text-zinc-700">{c.label}</span>
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${c.ready ? 'bg-green-100 text-green-700' : 'bg-zinc-100 text-zinc-500'}`}>
                                                    {c.ready ? 'Pronto' : 'In scelta'}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            <div className="flex flex-col gap-2 pt-2 border-t border-zinc-200">
                                <button
                                    onClick={handleForceSubmit}
                                    disabled={busy}
                                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-amber-500 text-white font-bold rounded-lg disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4" />
                                    Forza invio ordini
                                </button>
                                <button
                                    onClick={handleClose}
                                    disabled={busy}
                                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 bg-red-500 text-white font-bold rounded-lg disabled:opacity-50"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Chiudi tavolo
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GroupSessionModal;
