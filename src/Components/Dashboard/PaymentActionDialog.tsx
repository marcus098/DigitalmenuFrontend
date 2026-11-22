import React, { useState } from 'react';
import { PaymentDto } from '../../types';
import { cancelPaymentApi, refundPaymentApi } from '../../Utilities/api';
import { useNotification } from '../../Context/NotificationContext';
import { formatEurCents } from './delivery/deliveryUtils';

/**
 * Azioni dello staff su un pagamento online, con le commissioni spiegate:
 * - "Annulla pagamento" su un'autorizzazione carta non ancora incassata: gratis, il cliente non viene addebitato;
 * - "Rimborsa" su un pagamento incassato: il cliente riavrà i soldi, ma la commissione del provider non torna.
 */

/** Pagamento carta solo autorizzato (non incassato): si annulla senza commissioni. */
export const isVoidable = (p: PaymentDto) => p.status === 'AUTHORIZED' && !p.capturedUpfront;
/**
 * Pagamento incassato: solo rimborso, la commissione non torna. (Un ordine SumUp "su richiesta" già addebitato si
 * rimborsa rifiutando l'ordine.)
 */
export const isRefundablePayment = (p: PaymentDto) => p.status === 'COMPLETED' || p.status === 'PARTIALLY_REFUNDED';

const refundedOf = (p: PaymentDto) => p.refundedCents ?? 0;
const netCents = (p: PaymentDto) => p.amountCents - refundedOf(p);
const providerName = (p: PaymentDto) => (p.provider === 'SUMUP' ? 'SumUp' : 'Stripe');

const apiError = (message: string | undefined, fallback: string) =>
    message && !message.startsWith('Request failed') ? message : fallback;

interface Props {
    payment: PaymentDto;
    mode: 'cancel' | 'refund';
    onClose: () => void;
    /** Operazione riuscita: lo stato definitivo può arrivare in differita (webhook del provider). */
    onDone: () => void;
}

const PaymentActionDialog: React.FC<Props> = ({ payment, mode, onClose, onDone }) => {
    const { addNotification } = useNotification();
    const [busy, setBusy] = useState(false);
    const [amount, setAmount] = useState((netCents(payment) / 100).toFixed(2));
    const order = payment.comandId ? `Ordine ${payment.comandId.slice(0, 8)}… · ` : '';

    const confirm = async () => {
        if (mode === 'cancel') {
            setBusy(true);
            const res = await cancelPaymentApi(payment.id);
            setBusy(false);
            if (res.success) {
                addNotification({ type: 'success', message: 'Pagamento annullato: nessun addebito al cliente, nessuna commissione' });
                onDone();
            } else {
                addNotification({ type: 'error', message: apiError(res.message, "Impossibile annullare il pagamento") });
            }
            return;
        }
        const remaining = netCents(payment);
        const cents = Math.round(parseFloat(amount.replace(',', '.')) * 100);
        if (!Number.isFinite(cents) || cents <= 0 || cents > remaining) {
            addNotification({ type: 'warning', message: `Importo non valido (massimo ${formatEurCents(remaining)})` });
            return;
        }
        setBusy(true);
        const res = await refundPaymentApi(payment.id, cents === remaining ? undefined : cents);
        setBusy(false);
        if (res.success) {
            addNotification({ type: 'success', message: 'Rimborso avviato: lo stato si aggiornerà a breve' });
            onDone();
        } else {
            addNotification({ type: 'error', message: apiError(res.message, 'Errore durante il rimborso') });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => !busy && onClose()}>
            <div role="dialog" aria-modal="true" aria-labelledby="payment-action-title"
                 className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto"
                 onClick={e => e.stopPropagation()}>
                {mode === 'cancel' ? (
                    <>
                        <h3 id="payment-action-title" className="text-xl font-bold text-gray-800 mb-1">Annullare il pagamento?</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            {order}{formatEurCents(payment.amountCents)} autorizzati sulla carta del cliente, non ancora incassati.
                        </p>
                        <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-sm text-green-800">
                            <strong>Nessuna commissione.</strong> L'autorizzazione viene rilasciata: il cliente non viene
                            addebitato e l'importo bloccato torna disponibile sulla sua carta.
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                            L'ordine non viene eliminato ma non risulterà più pagato online: se lo prepari comunque,
                            incassalo in altro modo. L'operazione non è annullabile.
                        </p>
                    </>
                ) : (
                    <>
                        <h3 id="payment-action-title" className="text-xl font-bold text-gray-800 mb-1">Rimborsare il pagamento?</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            {order}pagato {formatEurCents(payment.amountCents)}
                            {refundedOf(payment) > 0 ? `, già rimborsati ${formatEurCents(refundedOf(payment))}` : ''}.
                            Il cliente riceverà l'importo sul metodo di pagamento usato (di solito in 5-10 giorni lavorativi).
                        </p>
                        <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900 mb-4">
                            <strong>La commissione non viene restituita.</strong>{' '}
                            {payment.provider === 'SUMUP'
                                ? "Il pagamento è già stato incassato: SumUp trattiene la commissione dell'incasso originale (salvo rimborso prima del versamento sul tuo conto). Serve saldo SumUp sufficiente."
                                : "Il pagamento è già stato incassato: Stripe trattiene la commissione dell'incasso originale."}
                        </div>
                        <label className="label-style" htmlFor="refund-amount">Importo da rimborsare (€)</label>
                        <input
                            id="refund-amount"
                            type="number"
                            inputMode="decimal"
                            min="0.01"
                            step="0.01"
                            max={(netCents(payment) / 100).toFixed(2)}
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            className="input-style"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            Massimo {formatEurCents(netCents(payment))} · {providerName(payment)} · l'operazione non è annullabile.
                        </p>
                    </>
                )}
                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} disabled={busy} className="btn-secondary">Indietro</button>
                    <button
                        onClick={confirm}
                        disabled={busy}
                        className={`px-4 py-2 rounded-lg font-semibold text-white disabled:opacity-50 ${
                            mode === 'cancel' ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'
                        }`}
                    >
                        {busy ? 'Attendere…' : mode === 'cancel' ? 'Annulla pagamento' : 'Rimborsa'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentActionDialog;
