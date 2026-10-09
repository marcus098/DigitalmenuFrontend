import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useData } from '../../Context/DataContext';
import {
    getClientOrderApi, createPaymentIntentPublicApi, getPublicPaymentsConfigApi, syncSumUpCheckoutPublicApi,
} from '../../Utilities/api';
import { PaymentIntentResponse, SumUpSyncResponse } from '../../types';
import { Comand } from '../../ComandType';
import ClientStickyHeader from '../../Components/Client/ClientStickyHeader';
import CustomLoading from '../../Components/CustomLoading';
import { CheckCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';

// ── Stripe.js: ogni locale usa il PROPRIO account, quindi la publishable key arriva dal server.
// loadStripe va chiamato una sola volta per chiave (non a ogni render).
const stripePromises = new Map<string, Promise<Stripe | null>>();
const getStripe = (publishableKey: string): Promise<Stripe | null> => {
    let p = stripePromises.get(publishableKey);
    if (!p) {
        p = loadStripe(publishableKey);
        stripePromises.set(publishableKey, p);
    }
    return p;
};

// ── SumUp Card Widget (fallback se il server non restituisce un hosted checkout) ──
interface SumUpCardInstance { unmount?: () => void; submit?: () => void; update?: (cfg: Record<string, unknown>) => void; }
interface SumUpCardSdk {
    mount: (config: {
        id: string;
        checkoutId: string;
        locale?: string;
        onResponse?: (type: string, body: unknown) => void;
        onLoad?: () => void;
    }) => SumUpCardInstance;
}
declare global {
    interface Window { SumUpCard?: SumUpCardSdk; }
}

const SUMUP_SDK_URL = 'https://gateway.sumup.com/gateway/ecom/card/v2/sdk.js';
let sumUpSdkPromise: Promise<SumUpCardSdk> | null = null;
const loadSumUpSdk = (): Promise<SumUpCardSdk> => {
    if (window.SumUpCard) return Promise.resolve(window.SumUpCard);
    if (!sumUpSdkPromise) {
        sumUpSdkPromise = new Promise<SumUpCardSdk>((resolve, reject) => {
            const script = document.createElement('script');
            script.src = SUMUP_SDK_URL;
            script.async = true;
            script.onload = () => window.SumUpCard ? resolve(window.SumUpCard) : reject(new Error('SumUpCard non disponibile'));
            script.onerror = () => reject(new Error('Impossibile caricare SumUp'));
            document.head.appendChild(script);
        }).catch(err => {
            sumUpSdkPromise = null; // consente un nuovo tentativo
            throw err;
        });
    }
    return sumUpSdkPromise;
};

/** Checkout SumUp in corso, salvato prima del redirect: al ritorno SumUp potrebbe non passare l'id. */
interface StoredSumUpCheckout { checkoutId: string; comandId: string; approvalRequired?: boolean; }
const sumUpStorageKey = (comandId: string) => `dm_sumup_checkout_${comandId}`;
const stripePkStorageKey = (comandId: string) => `dm_stripe_pk_${comandId}`;

const ssGet = (key: string): string | null => { try { return sessionStorage.getItem(key); } catch { return null; } };
const ssSet = (key: string, value: string) => { try { sessionStorage.setItem(key, value); } catch { /* storage non disponibile */ } };
const ssDel = (key: string) => { try { sessionStorage.removeItem(key); } catch { /* storage non disponibile */ } };

const readStoredSumUp = (comandId: string): StoredSumUpCheckout | null => {
    const raw = ssGet(sumUpStorageKey(comandId));
    if (!raw) return null;
    try {
        const v = JSON.parse(raw) as StoredSumUpCheckout;
        return v?.checkoutId && v.comandId === comandId ? v : null;
    } catch {
        return null;
    }
};

const formatEur = (cents: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);

const PAID_POLL_INTERVAL_MS = 2000;
const PAID_POLL_MAX_ATTEMPTS = 15;
const SUMUP_SYNC_INTERVAL_MS = 2000;
const SUMUP_SYNC_MAX_ATTEMPTS = 15; // ~30s

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
/**
 * loading/confirming: spinner · form: Stripe Elements · sumup: Card Widget SumUp
 * redirecting: verso l'hosted checkout SumUp · pending: SumUp non ha ancora confermato
 */
type Phase = 'loading' | 'confirming' | 'redirecting' | 'form' | 'sumup' | 'pending' | 'success' | 'error';
type Provider = 'STRIPE' | 'SUMUP';

const PaymentPage: React.FC = () => {
    const { localname, comandId } = useParams<{ localname: string; comandId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const { styles } = useData();

    const [comand, setComand] = useState<Comand | null>(null);
    const [provider, setProvider] = useState<Provider | null>(null);
    const [clientSecret, setClientSecret] = useState<string | null>(null);
    const [stripePk, setStripePk] = useState<string | null>(null);
    const [sumUpCheckoutId, setSumUpCheckoutId] = useState<string | null>(null);
    const [sumUpWidgetError, setSumUpWidgetError] = useState<string | null>(null);
    const [totalCents, setTotalCents] = useState(0);
    const [phase, setPhase] = useState<Phase>('loading');
    const [error, setError] = useState<string | null>(null);
    const [paidConfirmed, setPaidConfirmed] = useState(false);
    /** Ordine su richiesta (Stripe): solo autorizzazione, addebito all'accettazione del locale. */
    const [manualCapture, setManualCapture] = useState(false);
    /** Ordine su richiesta già pagato (SumUp): in attesa di conferma, rimborso automatico se rifiutato. */
    const [awaitingApproval, setAwaitingApproval] = useState(false);
    const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const unmountedRef = useRef(false);
    const syncRunRef = useRef(0);

    const primary = styles?.primary || '#fb923c';
    const returnUrl = `${window.location.origin}/${localname}/payment/${comandId}`;

    useEffect(() => {
        unmountedRef.current = false;
        return () => {
            unmountedRef.current = true;
            syncRunRef.current++;
            if (pollRef.current) clearTimeout(pollRef.current);
        };
    }, []);

    // Dopo il successo lato provider, attende che il server marchi la comanda come pagata.
    const pollPaid = useCallback((attempt = 0) => {
        if (!comandId) return;
        pollRef.current = setTimeout(async () => {
            const res = await getClientOrderApi(comandId);
            const d = res.data as Comand | null;
            if (res.success && (d?.paid || d?.paymentAuthorized)) {
                setPaidConfirmed(true);
                if (d?.status === 'AWAIT_APPROVAL' && d.paid) setAwaitingApproval(true);
                return;
            }
            if (attempt + 1 < PAID_POLL_MAX_ATTEMPTS) pollPaid(attempt + 1);
        }, PAID_POLL_INTERVAL_MS);
    }, [comandId]);

    const markSuccess = useCallback(() => {
        setPhase('success');
        pollPaid();
    }, [pollPaid]);

    /** Chiede al server di sincronizzare lo stato del checkout SumUp; ripete finché è PENDING (~30s). */
    const syncSumUp = useCallback(async (checkoutId: string, approvalRequired?: boolean) => {
        if (!localname || !comandId) return;
        const run = ++syncRunRef.current;
        setPhase('confirming');
        let last: SumUpSyncResponse['status'] | null = null;
        for (let attempt = 0; attempt < SUMUP_SYNC_MAX_ATTEMPTS; attempt++) {
            if (attempt > 0) await wait(SUMUP_SYNC_INTERVAL_MS);
            if (run !== syncRunRef.current || unmountedRef.current) return;
            const res = await syncSumUpCheckoutPublicApi(localname, checkoutId);
            if (run !== syncRunRef.current || unmountedRef.current) return;
            const status = res.success ? res.data?.status ?? null : null;
            last = status;
            if (status === 'PENDING' || status === null) continue;
            break;
        }

        if (last === 'PAID') {
            ssDel(sumUpStorageKey(comandId));
            setProvider('SUMUP');
            setManualCapture(false);
            const orderRes = await getClientOrderApi(comandId);
            if (run !== syncRunRef.current || unmountedRef.current) return;
            const cmd = orderRes.success ? orderRes.data as unknown as Comand : null;
            if (cmd) setComand(cmd);
            setAwaitingApproval(!!approvalRequired || cmd?.status === 'AWAIT_APPROVAL');
            if (cmd?.paid) setPaidConfirmed(true);
            markSuccess();
        } else if (last === 'FAILED' || last === 'EXPIRED') {
            ssDel(sumUpStorageKey(comandId));
            setError(last === 'EXPIRED'
                ? 'La sessione di pagamento è scaduta. Riprova.'
                : 'Il pagamento non è andato a buon fine. Puoi riprovare.');
            setPhase('error');
        } else {
            // Ancora PENDING (o server irraggiungibile): non creare un nuovo pagamento, lascia verificare di nuovo.
            setSumUpCheckoutId(checkoutId);
            setPhase('pending');
        }
    }, [localname, comandId, markSuccess]);

    const init = useCallback(async () => {
        if (!comandId || !localname) return;
        syncRunRef.current++;
        setPhase('loading');
        setError(null);
        setSumUpWidgetError(null);
        setClientSecret(null);
        setSumUpCheckoutId(null);

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
            setAwaitingApproval(cmd.status === 'AWAIT_APPROVAL');
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
        const intent = ((intentRes.data as any).data ?? intentRes.data) as PaymentIntentResponse;
        const serverCents = Number(intent?.amountCents);
        if (!Number.isFinite(serverCents) || serverCents <= 0) {
            setError('Importo non valido per il pagamento.');
            setPhase('error');
            return;
        }
        setTotalCents(serverCents);

        if (intent.provider === 'SUMUP') {
            if (!intent.checkoutId) {
                setError('Impossibile avviare il pagamento. Riprova tra poco.');
                setPhase('error');
                return;
            }
            setProvider('SUMUP');
            setManualCapture(false);
            const stored: StoredSumUpCheckout = { checkoutId: intent.checkoutId, comandId, approvalRequired: !!intent.approvalRequired };
            ssSet(sumUpStorageKey(comandId), JSON.stringify(stored));
            if (intent.hostedCheckoutUrl) {
                setPhase('redirecting');
                window.location.assign(intent.hostedCheckoutUrl);
                return;
            }
            setSumUpCheckoutId(intent.checkoutId);
            setPhase('sumup');
            return;
        }

        // Stripe (default)
        if (!intent.clientSecret || !intent.publishableKey) {
            setError('Impossibile avviare il pagamento. Riprova tra poco.');
            setPhase('error');
            return;
        }
        setProvider('STRIPE');
        ssSet(stripePkStorageKey(comandId), intent.publishableKey);
        setStripePk(intent.publishableKey);
        setManualCapture(!!intent.manualCapture);
        setClientSecret(intent.clientSecret);
        setPhase('form');
    }, [comandId, localname]);

    // Primo caricamento: ritorno da SumUp hosted checkout, ritorno da redirect Stripe (3DS / wallet) o nuovo pagamento.
    useEffect(() => {
        const providerParam = searchParams.get('provider');
        const redirectStatus = searchParams.get('redirect_status');

        if (providerParam?.toLowerCase() === 'sumup' && comandId) {
            const stored = readStoredSumUp(comandId);
            // Pulisce i parametri: un reload non deve riprocessare il ritorno
            setSearchParams({}, { replace: true });
            setProvider('SUMUP');
            if (stored) {
                syncSumUp(stored.checkoutId, stored.approvalRequired);
            } else {
                // Checkout sconosciuto (altro dispositivo/sessione): init verifica comunque se l'ordine è già pagato.
                init();
            }
            return;
        }

        if (!redirectStatus) {
            init();
            return;
        }

        const piSecret = searchParams.get('payment_intent_client_secret');
        let cancelled = false;
        (async () => {
            setPhase('confirming');
            setProvider('STRIPE');
            let status: string = redirectStatus;
            let pk = comandId ? ssGet(stripePkStorageKey(comandId)) : null;
            if (!pk && localname) {
                const cfg = await getPublicPaymentsConfigApi(localname);
                pk = (cfg.success && cfg.data?.stripePublishableKey) || null;
            }
            if (pk && piSecret) {
                const stripe = await getStripe(pk);
                if (stripe) {
                    const { paymentIntent } = await stripe.retrievePaymentIntent(piSecret);
                    if (paymentIntent?.status) status = paymentIntent.status;
                }
            }
            if (cancelled) return;
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

    // Monta il Card Widget SumUp quando serve (nessun hosted checkout disponibile).
    useEffect(() => {
        if (phase !== 'sumup' || !sumUpCheckoutId) return;
        let instance: SumUpCardInstance | null = null;
        let cancelled = false;
        const approvalRequired = comandId ? readStoredSumUp(comandId)?.approvalRequired : false;
        loadSumUpSdk()
            .then(sdk => {
                if (cancelled) return;
                instance = sdk.mount({
                    id: 'sumup-card',
                    checkoutId: sumUpCheckoutId,
                    locale: 'it-IT',
                    onResponse: (type) => {
                        if (cancelled) return;
                        if (type === 'success') {
                            setSumUpWidgetError(null);
                            syncSumUp(sumUpCheckoutId, approvalRequired);
                        } else if (type === 'error' || type === 'fail') {
                            setSumUpWidgetError('Pagamento non riuscito. Controlla i dati della carta o riprova.');
                        } else if (type === 'invalid') {
                            setSumUpWidgetError(null);
                        }
                    },
                });
            })
            .catch(() => {
                if (cancelled) return;
                setError('Impossibile caricare il modulo di pagamento SumUp. Riprova tra poco.');
                setPhase('error');
            });
        return () => {
            cancelled = true;
            try { instance?.unmount?.(); } catch { /* widget già smontato */ }
        };
    }, [phase, sumUpCheckoutId, comandId, syncSumUp]);

    if (phase === 'loading' || phase === 'confirming' || phase === 'redirecting') {
        return (
            <CustomLoading
                isFullPage
                message={phase === 'confirming' ? 'Verifica del pagamento…' : phase === 'redirecting' ? 'Reindirizzamento a SumUp…' : ''}
            />
        );
    }

    const stripePromise = stripePk ? getStripe(stripePk) : null;
    const providerName = provider === 'SUMUP' ? 'SumUp' : 'Stripe';

    const orderSummary = comand && (
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
    );

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
                                    : awaitingApproval
                                    ? "Il tuo ordine è in attesa di conferma del locale. Se non viene accettato, l'importo ti verrà rimborsato automaticamente."
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
                    ) : phase === 'pending' ? (
                        <div className="text-center py-16">
                            <ClockIcon className="w-14 h-14 mx-auto mb-4" style={{ color: 'var(--menu-accent)' }} />
                            <h2 className="text-xl font-bold" style={{ color: 'var(--menu-text)' }}>Pagamento in verifica</h2>
                            <p className="mt-2" style={{ color: 'var(--menu-muted)' }}>
                                Non abbiamo ancora ricevuto la conferma da SumUp. Se hai completato il pagamento, attendi qualche
                                istante e verifica di nuovo: non ripetere il pagamento.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                                <button
                                    onClick={() => {
                                        if (!sumUpCheckoutId) { init(); return; }
                                        const stored = comandId ? readStoredSumUp(comandId) : null;
                                        syncSumUp(sumUpCheckoutId, stored?.approvalRequired);
                                    }}
                                    className="px-6 py-2 font-bold rounded-xl hover:opacity-90"
                                    style={{ background: 'var(--menu-accent)', color: 'var(--menu-accent-text)' }}
                                >
                                    Verifica di nuovo
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
                    ) : phase === 'sumup' && sumUpCheckoutId ? (
                        <>
                            {orderSummary}
                            <div className="mb-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--menu-muted)' }}>Dati di Pagamento</h3>
                                <div id="sumup-card" />
                                {sumUpWidgetError && (
                                    <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
                                        <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
                                        <span className="flex-1">{sumUpWidgetError}</span>
                                        <button onClick={() => init()} className="font-semibold underline shrink-0">Riprova</button>
                                    </div>
                                )}
                            </div>
                            {comand?.approvalRequired && (
                                <p className="text-center text-sm mt-2" style={{ color: 'var(--menu-muted)' }}>
                                    Orario su richiesta: l'importo viene addebitato subito e rimborsato automaticamente se il locale non accetta l'ordine.
                                </p>
                            )}
                            <p className="text-center text-xs mt-4" style={{ color: 'var(--menu-muted)' }}>
                                Pagamento sicuro gestito da <strong>SumUp</strong>
                            </p>
                        </>
                    ) : phase === 'form' && clientSecret && stripePromise ? (
                        <>
                            {orderSummary}

                            {/* Stripe Elements */}
                            <div className="mb-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--menu-muted)' }}>Dati di Pagamento</h3>
                                <Elements
                                    key={`${stripePk}:${clientSecret}`}
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
                                Pagamento sicuro gestito da <strong>{providerName}</strong>
                            </p>
                        </>
                    ) : null}
                </main>
            </div>
        </div>
    );
};

export default PaymentPage;
