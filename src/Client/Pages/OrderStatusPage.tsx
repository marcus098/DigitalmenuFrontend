import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../../Context/DataContext';
import ClientStickyHeader from '../../Components/Client/ClientStickyHeader';
import AllergenModal from '../../Components/Client/AllergenModal';
import useCartCount from '../../Utilities/useCartCount';
import { getClientOrderApi } from '../../Utilities/api';
import { Check, Clock, Loader2, PartyPopper } from 'lucide-react';

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

const OrderStatusPage: React.FC = () => {
    const [status, setStatus] = useState<OrderStatus>('submitted');
    const [notFound, setNotFound] = useState(false);
    const [isAllergenModalOpen, setIsAllergenModalOpen] = useState(false);
    const esRef = useRef<EventSource | null>(null);

    const { setSelectedAllergens, styles } = useData();
    const navigate = useNavigate();
    const { localname, comandId } = useParams<{ localname: string; comandId: string }>();
    const cartCount = useCartCount();

    const applyBackendStatus = (backendStatus: string) => {
        const mapped = STATUS_MAP[backendStatus];
        if (mapped) setStatus(mapped);
    };

    // Initial fetch to get current status
    useEffect(() => {
        if (!comandId) return;
        getClientOrderApi(comandId).then(result => {
            if (result.success && result.data) {
                applyBackendStatus((result.data as any).status ?? '');
            } else {
                setNotFound(true);
            }
        });
    }, [comandId]);

    // SSE subscription for real-time updates
    useEffect(() => {
        if (!localname) return;
        const webfluxUrl = process.env.REACT_APP_BACKEND_WEBFLUX_URL_BASE;
        const url = `${webfluxUrl}/api/public/updates?localname=${localname}`;
        const es = new EventSource(url);
        esRef.current = es;

        es.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                if (payload.type === 'aggregated_update' && Array.isArray(payload.data?.orders)) {
                    const mine = payload.data.orders.find((o: any) => o.id === comandId);
                    if (mine) applyBackendStatus(mine.status);
                }
            } catch {}
        };

        return () => {
            es.close();
            esRef.current = null;
        };
    }, [localname, comandId]);

    // Polling fallback every 15 seconds
    useEffect(() => {
        if (!comandId) return;
        const interval = setInterval(async () => {
            const result = await getClientOrderApi(comandId);
            if (result.success && result.data) {
                applyBackendStatus((result.data as any).status ?? '');
            }
        }, 15000);
        return () => clearInterval(interval);
    }, [comandId]);

    const currentStepIndex = statusSteps.findIndex(s => s.id === status);

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
                    ) : (
                    <div className="p-6 sm:p-8 rounded-2xl" style={{ background: 'var(--menu-card)' }}>
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--menu-text)' }}>Grazie per il tuo ordine!</h1>
                            <p className="mt-2" style={{ color: 'var(--menu-muted)' }}>Stiamo preparando tutto con cura.</p>
                            {comandId && (
                                <p className="mt-2 text-xs font-mono" style={{ color: 'var(--menu-muted)' }}>#{comandId.split('_')[0]}</p>
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
                                        onClick={() => navigate(`/${localname}/payment/${comandId}`)}
                                        className="px-6 py-3 font-bold rounded-xl hover:opacity-90 shadow-md"
                                        style={{ background: 'var(--menu-accent)', color: 'var(--menu-accent-text)' }}
                                    >
                                        💳 Paga il Conto
                                    </button>
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
