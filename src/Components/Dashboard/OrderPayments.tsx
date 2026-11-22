import React, { useCallback, useEffect, useState } from 'react';
import { IS_ADMIN, PaymentDto } from '../../types';
import { getComandPaymentsApi } from '../../Utilities/api';
import { useLoginContext } from '../../Context/LoginContext';
import { formatEurCents } from './delivery/deliveryUtils';
import PaymentActionDialog, { isRefundablePayment, isVoidable } from './PaymentActionDialog';

const STATUS: Record<string, { label: string; badge: string }> = {
    AUTHORIZED:         { label: 'Autorizzato, non incassato', badge: 'bg-indigo-100 text-indigo-700' },
    COMPLETED:          { label: 'Incassato',                  badge: 'bg-green-100 text-green-700' },
    PENDING:            { label: 'In attesa',                  badge: 'bg-yellow-100 text-yellow-700' },
    FAILED:             { label: 'Fallito',                    badge: 'bg-red-100 text-red-600' },
    CANCELED:           { label: 'Annullato',                  badge: 'bg-gray-100 text-gray-500' },
    REFUNDED:           { label: 'Rimborsato',                 badge: 'bg-purple-100 text-purple-700' },
    PARTIALLY_REFUNDED: { label: 'Rimborsato in parte',        badge: 'bg-purple-50 text-purple-700' },
};

/**
 * Pagamenti online di una comanda nel dettaglio ordine, con "Annulla pagamento" (autorizzazione non incassata,
 * gratis) e "Rimborsa" (dopo l'incasso, commissione persa). Le azioni sono riservate al titolare.
 * Non mostra nulla se la comanda non ha pagamenti online.
 */
const OrderPayments: React.FC<{ comandId: string }> = ({ comandId }) => {
    const { checkVariable } = useLoginContext();
    const isAdmin = checkVariable(IS_ADMIN);
    const [payments, setPayments] = useState<PaymentDto[]>([]);
    const [action, setAction] = useState<{ p: PaymentDto; mode: 'cancel' | 'refund' } | null>(null);

    const load = useCallback(async () => {
        const res = await getComandPaymentsApi(comandId);
        if (res.success && res.data) setPayments(res.data.data ?? []);
    }, [comandId]);

    useEffect(() => { load(); }, [load]);

    // Solo i pagamenti significativi: i tentativi aperti o falliti non interessano allo staff
    const shown = payments.filter(p => p.status !== 'PENDING' && p.status !== 'FAILED');
    if (shown.length === 0) return null;

    return (
        <div className="mt-4 pt-3 border-t border-gray-200">
            <p className="text-sm font-bold text-gray-800 mb-2">Pagamento online</p>
            <ul className="space-y-2">
                {shown.map(p => {
                    const st = STATUS[p.status] ?? { label: p.status, badge: 'bg-gray-100 text-gray-600' };
                    return (
                        <li key={p.id} className="text-sm">
                            <div className="flex items-center justify-between gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${st.badge}`}>{st.label}</span>
                                <span className="font-bold text-gray-900">
                                    {formatEurCents(p.amountCents)}
                                    {(p.refundedCents ?? 0) > 0 && (
                                        <span className="ml-1 text-xs font-semibold text-purple-600">−{formatEurCents(p.refundedCents ?? 0)}</span>
                                    )}
                                </span>
                            </div>
                            {isVoidable(p) && (
                                <p className="text-xs text-gray-500 mt-1">
                                    Verrà incassato quando metti l'ordine in preparazione o lo completi.
                                </p>
                            )}
                            {isAdmin && (isVoidable(p) || isRefundablePayment(p)) && (
                                <div className="mt-2 flex gap-2">
                                    {isVoidable(p) && (
                                        <button onClick={() => setAction({ p, mode: 'cancel' })}
                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100">
                                            Annulla pagamento
                                        </button>
                                    )}
                                    {isRefundablePayment(p) && (
                                        <button onClick={() => setAction({ p, mode: 'refund' })}
                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100">
                                            Rimborsa
                                        </button>
                                    )}
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
            {action && (
                <PaymentActionDialog
                    payment={action.p}
                    mode={action.mode}
                    onClose={() => setAction(null)}
                    onDone={() => {
                        setAction(null);
                        load();
                        // Rimborsi Stripe: lo stato REFUNDED arriva dal webhook
                        setTimeout(load, 4000);
                    }}
                />
            )}
        </div>
    );
};

export default OrderPayments;
