import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useData } from '../../Context/DataContext';
import { getClientOrderApi, createPaymentIntentPublicApi } from '../../Utilities/api';
import { Comand } from '../../ComandType';
import ClientStickyHeader from '../../Components/Client/ClientStickyHeader';
import CustomLoading from '../../Components/CustomLoading';
import { CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

// Destination charge (Stripe Connect): si usa la publishable key della PIATTAFORMA, senza opzione stripeAccount.
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || '');

const formatEur = (cents: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);

const PAID_POLL_INTERVAL_MS = 2000;
const PAID_POLL_MAX_ATTEMPTS = 15;

/** Messaggio leggibile per gli errori di creazione del pagamento. */
const intentErrorMessage = (status: number, message?: string): string => {
    if (status === 503) return 'I pagamenti online sono temporaneamente non disponibili. Puoi pagare alla cassa.';
    if (status === 409) return message && !message.startsWith('Request failed') ? message : 'Il pagamento online non è disponibile per questo ordine.';
    if (status === 404) return 'Ordine non trovato.';
    return 'Impossibile avviare il pagamento. Riprova tra poco.';
};

// ── Stripe checkout form ──────────────────────────────────────────────────
interface CheckoutFormProps { totalCents: number; returnUrl: string; manualCapture: boolean; onSuccess: () => void; }

const CheckoutForm: React.FC<CheckoutFormProps> = ({ totalCents, returnUrl, manualCapture, onSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements) return;
        setError(null);
        setBusy(true);

        // Con 3DS o wallet che richiedono redirect, Stripe torna su returnUrl con
        // ?payment_intent=…&payment_intent_client_secret=…&redirect_status=…
        const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: { return_url: returnUrl },
            redirect: 'if_required',
        });

        if (stripeError) {
            setError(stripeError.message ?? 'Pagamento non riuscito.');
            setBusy(false);
        } else if (paymentIntent && (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing'
            || paymentIntent.status === 'requires_capture')) {
            onSuccess();
        } else {
            setError('Pagamento non completato. Riprova.');
            setBusy(false);
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
                className="w-full py-4 font-bold rounded-xl text-lg tracking-wide hover:opacity-90 disabled:opacity-50 transition-opacity"
                style={{ background: 'var(--menu-accent)', color: 'var(--menu-accent-text)' }}
            >
                {busy ? 'Elaborazione…' : manualCapture ? `Autorizza ${formatEur(totalCents)}` : `Paga ${formatEur(totalCents)}`}
            </button>
        </form>
    );
};

// ── Main page ─────────────────────────────────────────────────────────────
type Phase = 'loading' | 'form' | 'confirming' | 'success' | 'error';

const PaymentPage: React.FC = () => {
    const { localname, comandId } = useParams<{ localname: string; comandId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { styles } = useData();

    const [comand, setComand] = useState<Comand | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [totalCents, setTotalCents] = useState(0);
    const [phase, setPhase] = useState<Phase>('loading');
    const [error, setError] = useState<string | null>(null);
    const [paidConfirmed, setPaidConfirmed] = useState(false);
    /** Ordine su richiesta: solo autorizzazione, addebito all'accettazione del locale. */
    const [manualCapture, setManualCapture] = useState(false);
    const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const primary = styles?.primary || '#fb923c';
    const returnUrl = `${window.location.origin}/${localname}/payment/${comandId}`;

    // Dopo il successo lato Stripe, attende che il webhook marchi la comanda come pagata.
    const pollPaid = useCallback((attempt = 0) => {
        if (!comandId) return;
        pollRef.current = setTimeout(async () => {
            const res = await getClientOrderApi(comandId);
            const d = res.data as Comand | null;
            if (res.success && (d?.paid || d?.paymentAuthorized)) {
                setPaidConfirmed(true);
                return;
            }
            if (attempt + 1 < PAID_POLL_MAX_ATTEMPTS) pollPaid(attempt + 1);
        }, PAID_POLL_INTERVAL_MS);
    }, [comandId]);

    useEffect(() => () => { if (pollRef.current) clearTimeout(pollRef.current); }, []);

    const markSuccess = useCallback(() => {
        setPhase('success');
        pollPaid();
    }, [pollPaid]);

    const init = useCallback(async () => {
        if (!comandId || !localname) return;
        setPhase('loading');
        setError(null);

        const orderRes = await getClientOrderApi(comandId);
        if (!orderRes.success || !orderRes.data) {
            setError('Ordine non trovato.');
            setPhase('error');
            return;
        }
        const cmd = orderRes.data as unknown as Comand;
        setComand(cmd);
        if (cmd.paid) {
            setPaidConfirmed(true);
            setPhase('success');
            return;
        }
        if (cmd.paymentAuthorized && cmd.status === 'AWAIT_APPROVAL') {
            setManualCapture(true);
            setPaidConfirmed(true);
            setPhase('success');
            return;
        }

        // L'importo è calcolato SOLO lato server: quello restituito è quello addebitato.
        const intentRes = await createPaymentIntentPublicApi(localname, {
            comandId,
            idTable: cmd.idTable ?? undefined,
            amountCents: 0,
            currency: 'eur',
        });
        if (!intentRes.success || !intentRes.data) {
            setError(intentErrorMessage(intentRes.status, intentRes.message));
            setPhase('error');
            return;
        }
        const intent = (intentRes.data as any).data ?? intentRes.data;
        const serverCents = Number(intent?.amountCents);
        if (!intent?.clientSecret || !Number.isFinite(serverCents) || serverCents <= 0) {
            setError('Importo non valido per il pagamento.');
            setPhase('error');
            return;
        }
        setTotalCents(serverCents);
        setManualCapture(!!intent.manualCapture);
        setClientSecret(intent.clientSecret);
        setPhase('form');
    }, [comandId, localname]);

    // Ritorno da un redirect Stripe (3DS / wallet): verifica lo stato dell'intent invece di crearne uno nuovo.
    useEffect(() => {
        const redirectStatus = searchParams.get('redirect_status');
        const piSecret = searchParams.get('payment_intent_client_secret');
        if (!redirectStatus) {
            init();
            return;
        }
        let cancelled = false;
        (async () => {
            setPhase('confirming');
            let status: string = redirectStatus;
            const stripe = await stripePromise;
            if (stripe && piSecret) {
                const { paymentIntent } = await stripe.retrievePaymentIntent(piSecret);
                if (paymentIntent?.status) status = paymentIntent.status;
            }
            if (cancelled) return;
            // Pulisce i parametri: un reload non deve riprocessare il ritorno
            setSearchParams({}, { replace: true });
            if (status === 'requires_capture') setManualCapture(true);
            if (status === 'succeeded' || status === 'processing' || status === 'requires_capture') {
                const orderRes = await getClientOrderApi(comandId || '');
                if (!cancelled && orderRes.success && orderRes.data) setComand(orderRes.data as unknown as Comand);
                markSuccess();
            } else {
                setError('Il pagamento non è andato a buon fine. Puoi riprovare con un altro metodo.');
                setPhase('error');
            }
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (phase === 'loading' || phase === 'confirming') {
        return <CustomLoading isFullPage message={phase === 'confirming' ? 'Verifica del pagamento…' : ''} />;
    }

    return (
        <div className="min-h-screen" style={{ background: 'var(--menu-bg)' }}>
            <div className="max-w-lg mx-auto shadow-xl min-h-screen" style={{ background: 'var(--menu-card)' }}>
                <ClientStickyHeader
                    restaurantName={styles?.restaurantName || localname || ''}
                    onAllergenClick={() => {}}
                    onCartClick={() => navigate(`/${localname}/cart`)}
                    cartItemCount={0}
                />

                <main className="p-5">
                    {phase === 'success' ? (
                        <div className="text-center py-16">
                            <CheckCircleIcon className="w-20 h-20 text-green-500 mx-auto mb-4" />
                            <h2 className="text-2xl font-black" style={{ color: 'var(--menu-text)' }}>
                                {manualCapture ? 'Importo autorizzato' : 'Pagamento riuscito!'}
                            </h2>
                            <p className="mt-2" style={{ color: 'var(--menu-muted)' }}>
                                {manualCapture
                                    ? "Importo autorizzato, verrà addebitato solo se il locale accetta l'ordine."
                                    : paidConfirmed
                                    ? 'Grazie, il tuo conto è stato saldato.'
                                    : 'Grazie! Stiamo registrando il pagamento presso il locale…'}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                                <button
                                    onClick={() => navigate(`/${localname}/order-status/${comandId}`)}
                                    className="px-8 py-3 font-bold rounded-xl hover:opacity-90"
                                    style={{ background: 'var(--menu-accent)', color: 'var(--menu-accent-text)' }}
                                >
                                    Stato ordine
                                </button>
                                <button
                                    onClick={() => navigate(`/${localname}/Categories`)}
                                    className="px-8 py-3 rounded-xl hover:opacity-90"
                                    style={{ border: '1px solid var(--menu-border)', color: 'var(--menu-muted)' }}
                                >
                                    Torna al Menu
                                </button>
                            </div>
                        </div>
                    ) : phase === 'error' ? (
                        <div className="text-center py-16">
                            <ExclamationTriangleIcon className="w-14 h-14 text-red-400 mx-auto mb-4" />
                            <h2 className="text-xl font-bold" style={{ color: 'var(--menu-text)' }}>{error}</h2>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                                <button
                                    onClick={() => init()}
                                    className="px-6 py-2 font-bold rounded-xl hover:opacity-90"
                                    style={{ background: 'var(--menu-accent)', color: 'var(--menu-accent-text)' }}
                                >
                                    Riprova
                                </button>
                                <button
                                    onClick={() => navigate(`/${localname}/order-status/${comandId}`)}
                                    className="px-6 py-2 rounded-xl hover:opacity-90"
                                    style={{ border: '1px solid var(--menu-border)', color: 'var(--menu-muted)' }}
                                >
                                    Torna all'ordine
                                </button>
                            </div>
                        </div>
                    ) : clientSecret ? (
                        <>
                            {/* Order summary */}
                            {comand && (
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-1">
                                        <h2 className="text-xl font-black" style={{ color: 'var(--menu-text)' }}>Riepilogo Conto</h2>
                                        <span className="text-2xl font-black" style={{ color: 'var(--menu-accent)' }}>
                                            {formatEur(totalCents)}
                                        </span>
                                    </div>
                                    <div className="rounded-2xl p-4 space-y-1.5 mt-3" style={{ background: 'var(--menu-surface)' }}>
                                        {(comand.orders ?? []).flatMap(o => o.products ?? []).map((p, i) => (
                                            <div key={i} className="flex justify-between text-sm">
                                                <span style={{ color: 'var(--menu-text)' }}>
                                                    {p.quantity}× {p.productName}
                                                    {p.productOption?.name && p.productOption.name !== 'Default' && (
                                                        <span className="ml-1" style={{ color: 'var(--menu-muted)' }}>({p.productOption.name})</span>
                                                    )}
                                                </span>
                                            </div>
                                        ))}
                                        <div className="pt-2 mt-2 flex justify-between font-bold" style={{ borderTop: '1px solid var(--menu-border)', color: 'var(--menu-text)' }}>
                                            <span>Totale</span>
                                            <span style={{ color: 'var(--menu-accent)' }}>{formatEur(totalCents)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Stripe Elements */}
                            <div className="mb-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--menu-muted)' }}>Dati di Pagamento</h3>
                                <Elements
                                    stripe={stripePromise}
                                    options={{
                                        clientSecret,
                                        locale: 'it',
                                        appearance: {
                                            theme: 'stripe',
                                            variables: { colorPrimary: primary },
                                        },
                                    }}
                                >
                                    <CheckoutForm totalCents={totalCents} returnUrl={returnUrl} manualCapture={manualCapture} onSuccess={markSuccess} />
                                </Elements>
                            </div>

                            {manualCapture && (
                                <p className="text-center text-sm mt-2" style={{ color: 'var(--menu-muted)' }}>
                                    Orario su richiesta: l'importo viene solo autorizzato e addebitato se il locale accetta l'ordine.
                                </p>
                            )}
                            <p className="text-center text-xs mt-4" style={{ color: 'var(--menu-muted)' }}>
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
