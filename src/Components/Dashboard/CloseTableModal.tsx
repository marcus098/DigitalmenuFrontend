import React, {useState} from 'react';
import {X, AlertTriangle, LogOut, Receipt, Users} from 'lucide-react';
import {tableLabel} from '../../Dashboard/tableLabel';
import {orderTotal, useTableOrders} from '../../Hooks/useTableOrders';

interface CloseTableModalProps {
    table: { id: string; name: string; seats?: number };
    onCancel: () => void;
    /** Chiude davvero il tavolo; true = riuscito (il modale si chiude) */
    onConfirm: () => Promise<boolean>;
}

const eur = (n: number) => new Intl.NumberFormat('it-IT', {style: 'currency', currency: 'EUR'}).format(n);

/**
 * Conferma di chiusura del tavolo. È sempre raggiungibile a tavolo occupato: ordini non serviti o conto
 * non incassato non nascondono l'azione, compaiono come avviso qui prima di confermare.
 */
const CloseTableModal: React.FC<CloseTableModalProps> = ({table, onCancel, onConfirm}) => {
    const {orders, comands, total, toCollect: collectAll, unfinished, loading, error} = useTableOrders(Number(table.id), true);
    const [submitting, setSubmitting] = useState(false);
    // Ordini da QR mai accettati (AWAIT): alla chiusura vengono annullati, gli altri segnati come completati
    const toCancel = orders.filter(o => o.status === 'AWAIT').length;
    const toComplete = unfinished - toCancel;
    // Gli ordini QR mai accettati vengono annullati: non restano da incassare in Cassa
    const paidOrCheckout = new Set(comands.filter(c => c.paid || c.checkout).map(c => c.id));
    const cancelledAmount = orders.filter(o => o.status === 'AWAIT' && !paidOrCheckout.has(o.id)).reduce((s, o) => s + orderTotal(o), 0);
    const toCollect = Math.max(0, collectAll - cancelledAmount);

    const confirm = async () => {
        if (submitting) return;
        setSubmitting(true);
        const ok = await onConfirm();
        setSubmitting(false);
        if (ok) onCancel();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => !submitting && onCancel()}>
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}
                 role="dialog" aria-modal="true" aria-labelledby="close-table-title">
                <div className="flex justify-between items-center p-5 border-b border-zinc-200">
                    <h2 id="close-table-title" className="text-lg font-bold text-zinc-800">Chiudi {tableLabel(table.name, Number(table.id))}</h2>
                    <button onClick={onCancel} disabled={submitting} aria-label="Annulla" className="p-1 text-zinc-500 hover:text-zinc-700 disabled:opacity-50"><X className="w-5 h-5"/></button>
                </div>

                <div className="p-5 space-y-4">
                    <p className="text-sm text-zinc-600">
                        Il tavolo tornerà libero, il codice d'accesso non sarà più valido e i clienti collegati verranno scollegati.
                    </p>

                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-2">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 flex items-center justify-center gap-1"><Users className="w-3 h-3"/>Coperti</p>
                            <p className="text-lg font-bold text-zinc-800">{table.seats || '-'}</p>
                        </div>
                        <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-2">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Ordini</p>
                            <p className="text-lg font-bold text-zinc-800">{loading ? '...' : orders.length}</p>
                        </div>
                        <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-2">
                            <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500 flex items-center justify-center gap-1"><Receipt className="w-3 h-3"/>Totale</p>
                            <p className="text-lg font-bold text-zinc-800">{loading ? '...' : eur(total)}</p>
                        </div>
                    </div>

                    {!loading && toComplete > 0 && (
                        <div className="rounded-xl bg-amber-50 border border-amber-300 p-3 flex gap-2 text-sm text-amber-900">
                            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0"/>
                            <span>
                                {toComplete === 1 ? <b>1 ordine non è ancora stato servito</b> : <b>{toComplete} ordini non sono ancora stati serviti</b>}
                                {' '}(accettati o in cucina): chiudendo il tavolo verranno segnati come completati.
                            </span>
                        </div>
                    )}
                    {!loading && toCancel > 0 && (
                        <div className="rounded-xl bg-amber-50 border border-amber-300 p-3 flex gap-2 text-sm text-amber-900">
                            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0"/>
                            <span>
                                {toCancel === 1 ? <b>1 ordine dal QR non è mai stato accettato</b> : <b>{toCancel} ordini dal QR non sono mai stati accettati</b>}
                                : chiudendo il tavolo verranno annullati.
                            </span>
                        </div>
                    )}
                    {!loading && toCollect > 0 && (
                        <div className="rounded-xl bg-amber-50 border border-amber-300 p-3 flex gap-2 text-sm text-amber-900">
                            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0"/>
                            <span>
                                <b>Conto non ancora incassato: {eur(toCollect)}.</b> Dopo la chiusura resterà in Cassa tra le comande da incassare.
                            </span>
                        </div>
                    )}
                    {error && (
                        <p className="text-xs text-zinc-500">Non è stato possibile verificare tutti gli ordini del tavolo: puoi comunque chiuderlo.</p>
                    )}

                    <div className="flex gap-2 pt-2">
                        <button onClick={onCancel} disabled={submitting}
                                className="flex-1 py-2.5 bg-zinc-200 text-zinc-800 font-semibold rounded-lg disabled:opacity-50">Annulla</button>
                        <button onClick={confirm} disabled={submitting}
                                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-red-500 text-white font-bold rounded-lg disabled:opacity-50">
                            <LogOut className="w-4 h-4"/>
                            {submitting ? 'Chiusura...' : (unfinished > 0 || toCollect > 0) ? 'Chiudi comunque' : 'Chiudi tavolo'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CloseTableModal;
