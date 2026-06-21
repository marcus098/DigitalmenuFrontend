import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useData } from '../../Context/DataContext';
import { getClientOrderApi, createPaymentIntentPublicApi } from '../../Utilities/api';
import { Comand } from '../../ComandType';
import ClientStickyHeader from '../../Components/Client/ClientStickyHeader';
import CustomLoading from '../../Components/CustomLoading';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '');

// ── Calcola totale dal comand ──────────────────────────────────────────────
const calcTotalCents = (comand: Comand): number => {
    let total = 0;
    for (const order of comand.orders) {
        for (const product of order.products) {
            const base = (product.productOption?.price ?? 0) * product.quantity;
            const extras = product.ingredientsPlus?.reduce((s, i) => s + ((i as any).price ?? 0), 0) ?? 0;
            total += base + extras * product.quantity;
        }
    }
    return Math.round(total * 100);
};

const formatEur = (cents: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);

// ── Stripe checkout form ──────────────────────────────────────────────────
interface CheckoutFormProps { totalCents: number; onSuccess: () => void; }

const CheckoutForm: React.FC<CheckoutFormProps> = ({ totalCents, onSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;
        setError(null);
        setBusy(true);

        const { error: stripeError } = await stripe.confirmPayment({
            elements,
            redirect: 'if_required',
        });

        if (stripeError) {
            setError(stripeError.message ?? 'Pagamento non riuscito.');
            setBusy(false);
        } else {
            onSuccess();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <PaymentElement options={{ layout: 'tabs' }} />
            {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                    <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
                    {error}
                </div>
            )}
            <button
                type="submit"
                disabled={!stripe || busy}
                className="w-full py-4 bg-primary text-white font-bold rounded-xl text-lg tracking-wide hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
                {busy ? 'Elaborazione…' : `Paga ${formatEur(totalCents)}`}
            </button>
        </form>
    );
};

// ── Main page ─────────────────────────────────────────────────────────────
const PaymentPage: React.FC = () => {
    const { localname, comandId } = useParams<{ localname: string; comandId: string }>();
    const navigate = useNavigate();
    const { styles } = useData();

    const [comand, setComand] = useState<Comand | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [totalCents, setTotalCents] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    const primary = styles?.primary || '#fb923c';

    const init = useCallback(async () => {
        if (!comandId || !localname) return;
        setLoading(true);

        const orderRes = await getClientOrderApi(comandId);
        if (!orderRes.success || !orderRes.data) {
            setError('Ordine non trovato.');
            setLoading(false);
            return;
        }

        const cmd = orderRes.data as unknown as Comand;
        const cents = calcTotalCents(cmd);

        if (cents <= 0) {
            setError('Importo non valido per il pagamento.');
            setLoading(false);
            return;
        }

        setComand(cmd);
        setTotalCents(cents);

        const intentRes = await createPaymentIntentPublicApi(localname, {
            comandId,
            idTable: (cmd as any).idTable ?? undefined,
            amountCents: cents,
            currency: 'eur',
        });

        if (intentRes.success && intentRes.data) {
            setClientSecret((intentRes.data as any).data?.clientSecret ?? (intentRes.data as any).clientSecret ?? null);
        } else {
            setError(intentRes.message || 'Impossibile avviare il pagamento.');
        }
        setLoading(false);
    }, [comandId, localname]);

    useEffect(() => { init(); }, [init]);

    if (loading) return <CustomLoading isFullPage message="" />;

    return (
        <div className="bg-gray-50 min-h-screen">
            <div className="max-w-lg mx-auto bg-white shadow-xl min-h-screen">
                <ClientStickyHeader
                    restaurantName={styles?.restaurantName || localname || ''}
                    onAllergenClick={() => {}}
                    onCartClick={() => navigate(`/${localname}/cart`)}
                    cartItemCount={0}
                />

                <main className="p-5">
                    {success ? (
                        <div className="text-center py-16">
                            <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-black text-gray-900">Pagamento riuscito!</h2>
                            <p className="text-gray-500 mt-2">Grazie, il tuo conto è stato saldato.</p>
                            <button
                                onClick={() => navigate(`/${localname}/Categories`)}
                                className="mt-8 px-8 py-3 text-white font-bold rounded-xl hover:opacity-90"
                                style={{ backgroundColor: primary }}
                            >
                                Torna al Menu
                            </button>
                        </div>
                    ) : error ? (
                        <div className="text-center py-16">
                            <ExclamationTriangleIcon className="w-14 h-14 text-red-400 mx-auto mb-4" />
                            <h2 className="text-xl font-bold text-gray-700">{error}</h2>
                            <button
                                onClick={() => navigate(-1)}
                                className="mt-6 px-6 py-2 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50"
                            >
                                Torna indietro
                            </button>
                        </div>
                    ) : clientSecret ? (
                        <>
                            {/* Order summary */}
                            {comand && (
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-1">
                                        <h2 className="text-xl font-black text-gray-900">Riepilogo Conto</h2>
                                        <span
                                            className="text-2xl font-black"
                                            style={{ color: primary }}
                                        >
                                            {formatEur(totalCents)}
                                        </span>
                                    </div>
                                    <div className="bg-gray-50 rounded-2xl p-4 space-y-1.5 mt-3">
                                        {comand.orders.flatMap(o => o.products).map((p, i) => (
                                            <div key={i} className="flex justify-between text-sm">
                                                <span className="text-gray-700">
                                                    {p.quantity}× {p.productName}
                                                    {p.productOption?.name && p.productOption.name !== 'Default' && (
                                                        <span className="text-gray-400 ml-1">({p.productOption.name})</span>
                                                    )}
                                                </span>
                                                <span className="text-gray-600 font-medium">
                                                    {formatEur((p.productOption?.price ?? 0) * p.quantity * 100)}
                                                </span>
                                            </div>
                                        ))}
                                        <div className="border-t border-gray-200 pt-2 mt-2 flex justify-between font-bold">
                                            <span>Totale</span>
                                            <span style={{ color: primary }}>{formatEur(totalCents)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Stripe Elements */}
                            <div className="mb-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">Dati di Pagamento</h3>
                                <Elements
                                    stripe={stripePromise}
                                    options={{
                                        clientSecret,
                                        appearance: {
                                            theme: 'stripe',
                                            variables: { colorPrimary: primary },
                                        },
                                    }}
                                >
                                    <CheckoutForm totalCents={totalCents} onSuccess={() => setSuccess(true)} />
                                </Elements>
                            </div>

                            <p className="text-center text-xs text-gray-400 mt-4">
                                Pagamento sicuro gestito da <strong>Stripe</strong>
                            </p>
                        </>
                    ) : null}
                </main>
            </div>
        </div>
    );
};

export default PaymentPage;
