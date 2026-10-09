import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../../Context/DataContext';
import ClientStickyHeader from '../../Components/Client/ClientStickyHeader';
import AllergenModal from '../../Components/Client/AllergenModal';
import useCartCount from '../../Utilities/useCartCount';
import { getClientOrderApi, getPublicPaymentsConfigApi } from '../../Utilities/api';
import { Check, Clock, CreditCard, Hourglass, Loader2, PartyPopper, XCircle } from 'lucide-react';

type OrderStatus = 'submitted' | 'in_preparation' | 'ready';

const STATUS_MAP: Record<string, OrderStatus> = {
    AWAIT: 'submitted',
    PENDING: 'submitted',
    PROGRESS: 'in_preparation',
    COMPLETED: 'ready',
};

const statusSteps: { id: OrderStatus; title: string; description: string; icon: React.ElementType }[] = [
    { id: 'submitted', title: 'Ordine Inviato', description: 'Abbiamo ricevuto il tuo ordine.', icon: Clock },
    { id: 'in_preparation', title: 'In Preparazione', description: 'La cucina sta preparando le tue delizie!', icon: Loader2 },
    { id: 'ready', title: 'Pronto!', description: 'Il tuo ordine è pronto!', icon: Check },
];

/** Countdown "mm:ss" fino a una scadenza ISO (null se assente). */
const useCountdown = (deadline: string | null): string | null => {
    const [now, setNow] = useState(() => Date.now());
    useEffect(() => {
        if (!deadline) return;
        const t = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(t);
    }, [deadline]);
    if (!deadline) return null;
    const ms = new Date(deadline).getTime() - now;
    if (Number.isNaN(ms)) return null;
    const s = Math.max(0, Math.floor(ms / 1000));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

const OrderStatusPage: React.FC = () => {
    const [status, setStatus] = useState<OrderStatus>('submitted');
    const [backendStatus, setBackendStatus] = useState<string>('');
    const [notFound, setNotFound] = useState(false);
    const [paid, setPaid] = useState(false);
    const [deleted, setDeleted] = useState(false);
    const [rejectReason, setRejectReason] = useState<string | null>(null);
    const [approvalDeadline, setApprovalDeadline] = useState<string | null>(null);
    const [authorizationCanceled, setAuthorizationCanceled] = useState(false);
    const [paymentAuthorized, setPaymentAuthorized] = useState(false);
    const [refunded, setRefunded] = useState(false);
    const [paymentsEnabled, setPaymentsEnabled] = useState(false);
    const [isAllergenModalOpen, setIsAllergenModalOpen] = useState(false);
    const esRef = useRef<EventSource | null>(null);

    const { setSelectedAllergens, styles } = useData();
    const navigate = useNavigate();
    const { localname, comandId } = useParams<{ localname: string; comandId: string }>();
    const cartCount = useCartCount();
    const countdown = useCountdown(backendStatus === 'AWAIT_APPROVAL' ? approvalDeadline : null);

    const applyBackendStatus = (s: string) => {
        if (!s) return;
        const mapped = STATUS_MAP[s];
        if (mapped) setStatus(mapped);
        setBackendStatus(s);
        setDeleted(s === 'DELETED');
    };

    const applyOrder = (data: any) => {
        applyBackendStatus(data?.status ?? '');
        if (typeof data?.paid === 'boolean') setPaid(data.paid);
        // Gli eventi SSE contengono solo {id,status,paid}: i dettagli arrivano dalla GET
        if ('rejectReason' in (data ?? {})) setRejectReason(data.rejectReason ?? null);
        if ('approvalDeadline' in (data ?? {})) setApprovalDeadline(data.approvalDeadline ?? null);
        if ('authorizationCanceled' in (data ?? {})) setAuthorizationCanceled(!!data.authorizationCanceled);
        if ('paymentAuthorized' in (data ?? {})) setPaymentAuthorized(!!data.paymentAuthorized);
        if ('refunded' in (data ?? {})) setRefunded(!!data.refunded);
    };

    // Il locale accetta pagamenti online? (mostra "Paga online" solo se attivi)
    useEffect(() => {
        if (!localname) return;
        getPublicPaymentsConfigApi(localname).then(res => {
            setPaymentsEnabled(!!(res.success && res.data?.enabled));
        });
    }, [localname]);

    // Initial fetch to get current status
    useEffect(() => {
        if (!comandId) return;
        getClientOrderApi(comandId).then(result => {
            if (result.success && result.data) {
                applyOrder(result.data);
            } else {
                setNotFound(true);
            }
        });
    }, [comandId]);

    // SSE subscription for real-time updates
    useEffect(() => {
        if (!localname) return;
        const webfluxUrl = process.env.REACT_APP_BACKEND_WEBFLUX_URL_BASE;
        const url = `${webfluxUrl}/api/public/updates?localname=${encodeURIComponent(localname)}`;
        let cancelled = false;
        let retryTimer: ReturnType<typeof setTimeout> | null = null;
        let retryDelay = 1000;
        let hasConnected = false;

        const refreshStatus = async () => {
            if (!comandId) return;
            const result = await getClientOrderApi(comandId);
            if (!cancelled && result.success && result.data) {
                applyOrder(result.data);
            }
        };

        const connect = () => {
            const es = new EventSource(url);
            esRef.current = es;

            es.onopen = () => {
                retryDelay = 1000;
                // Dopo una riconnessione recupera lo stato perso nel frattempo.
                if (hasConnected) refreshStatus();
                hasConnected = true;
            };

            es.onmessage = (event) => {
                try {
                    const payload = JSON.parse(event.data);
                    if (payload.type === 'aggregated_update' && Array.isArray(payload.data?.orders)) {
                        const mine = payload.data.orders.find((o: any) => o?.id === comandId);
                        if (mine) {
                            applyOrder(mine);
                            // rifiuto/approvazione: ricarica motivo e dettagli dalla vista pubblica
                            if (mine.status === 'DELETED' || mine.status === 'PENDING') refreshStatus();
                        }
                    }
                } catch {}
            };

            es.onerror = () => {
                es.close();
                if (esRef.current === es) esRef.current = null;
                if (cancelled) return;
                const delay = retryDelay;
                retryDelay = Math.min(retryDelay * 2, 30_000);
                retryTimer = setTimeout(() => {
                    retryTimer = null;
                    if (!cancelled) connect();
                }, delay);
            };
        };

        connect();

        return () => {
            cancelled = true;
            if (retryTimer) clearTimeout(retryTimer);
            esRef.current?.close();
            esRef.current = null;
        };
    }, [localname, comandId]);

    // Polling fallback every 15 seconds
    useEffect(() => {
        if (!comandId) return;
        const interval = setInterval(async () => {
            const result = await getClientOrderApi(comandId);
            if (result.success && result.data) {
                applyOrder(result.data);
            }
        }, 15000);
        return () => clearInterval(interval);
    }, [comandId]);

    const currentStepIndex = statusSteps.findIndex(s => s.id === status);
    const awaitingPayment = backendStatus === 'AWAIT_PAYMENT';
    const awaitingApproval = backendStatus === 'AWAIT_APPROVAL';
    const canPayOnline = paymentsEnabled && !paid && !deleted && !awaitingApproval && !awaitingPayment && !!comandId;

    const renderSpecialState = () => {
        if (awaitingPayment) {
            return (
                <div className="text-center py-10">
                    <CreditCard className="w-14 h-14 mx-auto mb-4" style={{ color: 'var(--menu-accent)' }} />
                    <h1 className="text-2xl font-extrabold" style={{ color: 'var(--menu-text)' }}>In attesa di pagamento</h1>
                    <p className="mt-2" style={{ color: 'var(--menu-muted)' }}>
                        Il locale richiede il pagamento anticipato: l'ordine verrà inviato in cucina appena il pagamento è confermato.
                    </p>
                    <p className="mt-1 text-xs" style={{ color: 'var(--menu-muted)' }}>
                        Se non paghi entro 15 minuti l'ordine viene annullato.
                    </p>
                    <button
                        onClick={() => navigate(`/${localname}/payment/${comandId}`)}
                        className="mt-6 inline-flex items-center gap-2 px-6 py-3 font-bold rounded-xl hover:opacity-90 shadow-md"
                        style={{ background: 'var(--menu-accent)', color: 'var(--menu-accent-text)' }}
                    >
                        <CreditCard className="w-5 h-5" /> Paga
                    </button>
                </div>
            );
        }
        if (awaitingApproval) {
            return (
                <div className="text-center py-10">
                    <Hourglass className="w-14 h-14 mx-auto mb-4" style={{ color: 'var(--menu-accent)' }} />
                    <h1 className="text-2xl font-extrabold" style={{ color: 'var(--menu-text)' }}>In attesa di conferma del locale</h1>
                    <p className="mt-2" style={{ color: 'var(--menu-muted)' }}>
                        Hai scelto un orario "su richiesta": il locale deve confermare il tuo ordine.
                    </p>
                    {countdown && (
                        <p className="mt-4 text-3xl font-mono font-bold" style={{ color: 'var(--menu-text)' }}>{countdown}</p>
                    )}
                    {paymentAuthorized && (
                        <p className="mt-3 text-sm" style={{ color: 'var(--menu-muted)' }}>
                            Importo autorizzato: verrà addebitato solo se il locale accetta l'ordine.
                        </p>
                    )}
                </div>
            );
        }
        if (deleted) {
            return (
                <div className="text-center py-10">
                    <XCircle className="w-14 h-14 mx-auto mb-4 text-red-500" />
                    <h1 className="text-2xl font-extrabold" style={{ color: 'var(--menu-text)' }}>
                        {rejectReason ? `Rifiutato: ${rejectReason}` : 'Ordine annullato'}
                    </h1>
                    {authorizationCanceled && (
                        <p className="mt-2 font-semibold text-green-700">Nessun addebito: l'autorizzazione di pagamento è stata annullata.</p>
                    )}
                    {refunded && (
                        <p className="mt-2 font-semibold text-green-700">Il pagamento è stato rimborsato.</p>
                    )}
                    <button
                        onClick={() => navigate(`/${localname}/Categories`)}
                        className="mt-6 px-6 py-2 font-bold rounded-xl hover:opacity-90"
                        style={{ background: 'var(--menu-accent)', color: 'var(--menu-accent-text)' }}
                    >
                        Torna al Menù
                    </button>
                </div>
            );
        }
        return null;
    };
    const special = notFound ? null : renderSpecialState();

    return (
        <div style={{ background: 'var(--menu-bg)' }}>
            <div className="max-w-4xl mx-auto shadow-2xl min-h-screen" style={{ background: 'var(--menu-card)' }}>
                <ClientStickyHeader
                    restaurantName={styles?.restaurantName || localname || ""}
                    onAllergenClick={() => setIsAllergenModalOpen(true)}
                    onCartClick={() => navigate(`/${localname}/cart`)}
                    cartItemCount={cartCount}
                />

                <main className="p-4 md:p-6">
                    {notFound ? (
                        <div className="text-center py-16">
                            <p className="text-xl font-bold" style={{ color: 'var(--menu-text)' }}>Ordine non trovato</p>
                            <p className="mt-2" style={{ color: 'var(--menu-muted)' }}>L'ordine potrebbe essere già completato o non esistere.</p>
                            <button
                                onClick={() => navigate(`/${localname}/Categories`)}
                                className="mt-6 px-6 py-2 font-bold rounded-xl hover:opacity-90"
                                style={{ background: 'var(--menu-accent)', color: 'var(--menu-accent-text)' }}
                            >
                                Torna al Menù
                            </button>
                        </div>
                    ) : special ? (
                        <div className="p-6 sm:p-8 rounded-2xl" style={{ background: 'var(--menu-card)' }}>
                            {special}
                            {comandId && (
                                <p className="text-center text-xs font-mono" style={{ color: 'var(--menu-muted)' }}>#{comandId.split('_')[0]}</p>
                            )}
                        </div>
                    ) : (
                    <div className="p-6 sm:p-8 rounded-2xl" style={{ background: 'var(--menu-card)' }}>
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--menu-text)' }}>Grazie per il tuo ordine!</h1>
                            <p className="mt-2" style={{ color: 'var(--menu-muted)' }}>Stiamo preparando tutto con cura.</p>
                            {comandId && (
                                <p className="mt-2 text-xs font-mono" style={{ color: 'var(--menu-muted)' }}>#{comandId.split('_')[0]}</p>
                            )}
                            {paid && (
                                <span className="inline-flex items-center gap-1.5 mt-3 px-3 py-1 rounded-full text-sm font-bold bg-green-100 text-green-700">
                                    <Check className="w-4 h-4" /> Pagato
                                </span>
                            )}
                            {canPayOnline && (
                                <div className="mt-5">
                                    <button
                                        onClick={() => navigate(`/${localname}/payment/${comandId}`)}
                                        className="inline-flex items-center gap-2 px-6 py-3 font-bold rounded-xl hover:opacity-90 shadow-md"
                                        style={{ background: 'var(--menu-accent)', color: 'var(--menu-accent-text)' }}
                                    >
                                        <CreditCard className="w-5 h-5" /> Paga online
                                    </button>
                                    <p className="mt-2 text-xs" style={{ color: 'var(--menu-muted)' }}>Oppure paga direttamente alla cassa.</p>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col">
                            {statusSteps.map((step, index) => {
                                const isActive = index <= currentStepIndex;
                                const isCurrent = index === currentStepIndex;
                                const Icon = step.icon;
                                return (
                                    <div key={step.id} className="flex items-start gap-4">
                                        <div className="flex flex-col items-center">
                                            <div
                                                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                                                style={
                                                    isActive
                                                        ? { background: 'var(--menu-accent)', color: 'var(--menu-accent-text)' }
                                                        : { background: 'var(--menu-surface)', color: 'var(--menu-muted)' }
                                                }
                                            >
                                                <Icon className={`w-6 h-6 ${isCurrent && step.id === 'in_preparation' ? 'animate-spin' : ''}`} />
                                            </div>
                                            {index < statusSteps.length - 1 && (
                                                <div
                                                    className="w-0.5 h-20 mt-2 transition-colors"
                                                    style={{ background: index < currentStepIndex ? 'var(--menu-accent)' : 'var(--menu-border)' }}
                                                />
                                            )}
                                        </div>
                                        <div className="pt-1.5">
                                            <h3 className="font-bold text-lg" style={{ color: isActive ? 'var(--menu-text)' : 'var(--menu-muted)' }}>{step.title}</h3>
                                            <p className="text-sm" style={{ color: 'var(--menu-muted)', opacity: isActive ? 1 : 0.7 }}>{step.description}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {status === 'ready' && (
                            <div className="mt-10 text-center p-6 bg-green-50 border-2 border-dashed border-green-300 rounded-2xl">
                                <PartyPopper className="w-16 h-16 text-green-500 mx-auto" />
                                <h3 className="mt-4 text-xl font-bold text-green-800">Buon Appetito!</h3>
                                <p className="text-green-700 mt-1">Speriamo che la tua esperienza sia fantastica.</p>
                                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-5">
                                    <button
                                        onClick={() => navigate(`/${localname}/Categories`)}
                                        className="px-6 py-2 border border-green-300 text-green-700 font-bold rounded-xl hover:bg-green-100"
                                    >
                                        Torna al Menù
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                    )}
                </main>

                <AllergenModal
                    isOpen={isAllergenModalOpen}
                    onClose={() => setIsAllergenModalOpen(false)}
                    onApplyFilters={(selected) => setSelectedAllergens(selected)}
                />
            </div>
        </div>
    );
};

export default OrderStatusPage;
