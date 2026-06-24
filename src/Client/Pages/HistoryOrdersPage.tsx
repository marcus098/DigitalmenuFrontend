import React, { useState, useEffect } from 'react';
import { useData } from '../../Context/DataContext';
import { useParams, useNavigate } from 'react-router-dom';
import ClientStickyHeader from '../../Components/Client/ClientStickyHeader';
import AllergenModal from '../../Components/Client/AllergenModal';
import useCartCount from '../../Utilities/useCartCount';
import { getClientOrderApi, getClientOrderHistoryApi, getTableSessionStateApi } from '../../Utilities/api';
import { Comand } from '../../ComandType';
import { Clock, Wallet, ArrowLeft, History, PlusCircle, MinusCircle } from 'lucide-react';
import { getOrCreateClientSessionId, getTableSession } from '../../Utilities/Utilities';
import { TableSessionComandLite } from '../../types';

const STATUS_LABEL: Record<string, string> = {
    AWAIT: 'In attesa',
    PENDING: 'In attesa',
    PROGRESS: 'In preparazione',
    COMPLETED: 'Completato',
    DELETED: 'Annullato',
};
// Status colors are semantic (yellow=waiting, green=done, red=cancelled) — kept hardcoded.
const STATUS_COLOR: Record<string, string> = {
    AWAIT: 'bg-zinc-100 text-zinc-600',
    PENDING: 'bg-yellow-100 text-yellow-700',
    PROGRESS: 'bg-amber-100 text-amber-700',
    COMPLETED: 'bg-green-100 text-green-700',
    DELETED: 'bg-red-100 text-red-600',
};

const ComandaCard: React.FC<{ comanda: Comand }> = ({ comanda }) => {
    const total = comanda.orders.reduce((acc, order) =>
        acc + order.products.reduce((s, p) => s + (p.productOption?.price ?? 0) * p.quantity, 0), 0);
    const date = new Date(comanda.createdAt);
    const statusKey = comanda.status ?? 'AWAIT';

    return (
        <div
            className="p-4 sm:p-5 rounded-2xl shadow-lg"
            style={{ background: 'var(--menu-card)', border: '1px solid var(--menu-border)' }}
        >
            <div className="flex justify-between items-center pb-3 mb-4" style={{ borderBottom: '1px solid var(--menu-border)' }}>
                <div className="flex items-center gap-2" style={{ color: 'var(--menu-muted)' }}>
                    <Clock className="w-5 h-5" />
                    <span className="font-semibold">{date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_COLOR[statusKey] ?? STATUS_COLOR.AWAIT}`}>
                        {STATUS_LABEL[statusKey] ?? statusKey}
                    </span>
                    <div className="flex items-center gap-1 text-lg font-bold" style={{ color: 'var(--menu-text)' }}>
                        <Wallet className="w-4 h-4" style={{ color: 'var(--menu-muted)' }} />
                        <span>€{total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {comanda.orders.flatMap((order, oi) =>
                    order.products.map((prod, pi) => (
                        <div
                            key={`${oi}-${pi}`}
                            className="p-3 rounded-lg"
                            style={{ background: 'var(--menu-surface)', border: '1px solid var(--menu-border)' }}
                        >
                            <div className="flex justify-between items-start">
                                <p className="font-bold" style={{ color: 'var(--menu-text)' }}>
                                    <span className="font-semibold">{prod.quantity}x</span> {prod.productName}
                                </p>
                                <p className="font-bold" style={{ color: 'var(--menu-text)' }}>€{((prod.productOption?.price ?? 0) * prod.quantity).toFixed(2)}</p>
                            </div>
                            {prod.note && <p className="text-xs mt-1 italic" style={{ color: 'var(--menu-muted)' }}>"{prod.note}"</p>}
                            {prod.ingredientsMinus.length > 0 && (
                                <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                                    <MinusCircle size={12} /> {prod.ingredientsMinus.map(i => i.name).join(', ')}
                                </p>
                            )}
                            {prod.ingredientsPlus.length > 0 && (
                                <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                                    <PlusCircle size={12} /> {prod.ingredientsPlus.map(i => i.name).join(', ')}
                                </p>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

const HistoryOrdersPage: React.FC = () => {
    const [comande, setComande] = useState<Comand[]>([]);
    const [comandClientMap, setComandClientMap] = useState<Map<string, string>>(new Map());
    const [labelMap, setLabelMap] = useState<Map<string, string>>(new Map());
    const [isSessionMode, setIsSessionMode] = useState<boolean>(false);
    const [onlyMine, setOnlyMine] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isAllergenModalOpen, setIsAllergenModalOpen] = useState(false);

    const { setSelectedAllergens, styles } = useData();
    const { localname } = useParams();
    const navigate = useNavigate();
    const cartCount = useCartCount();
    const myClientSessionId = getOrCreateClientSessionId();

    useEffect(() => {
        const stored = getTableSession();
        if (stored) {
            setIsSessionMode(true);
            (async () => {
                const stateResult = await getTableSessionStateApi(stored.sessionId, myClientSessionId);
                if (!stateResult.success || !stateResult.data) {
                    setIsLoading(false);
                    return;
                }
                const sState = stateResult.data;
                const newLabelMap = new Map<string, string>();
                sState.clients.forEach(c => newLabelMap.set(c.clientSessionId, c.label));
                setLabelMap(newLabelMap);

                const newCcMap = new Map<string, string>();
                sState.comands.forEach((c: TableSessionComandLite) => newCcMap.set(c.comandId, c.clientSessionId));
                setComandClientMap(newCcMap);

                const fetched = await Promise.all(
                    sState.comands.map(c => getClientOrderApi(c.comandId))
                );
                const list: Comand[] = [];
                for (const r of fetched) {
                    if (r.success && r.data) list.push(r.data);
                }
                setComande(list.filter(c => c.status !== 'DELETED'));
                setIsLoading(false);
            })();
            return;
        }

        const rawTableId = localStorage.getItem('rf_table_id');
        if (!rawTableId || !localname) {
            setIsLoading(false);
            return;
        }
        getClientOrderHistoryApi(Number(rawTableId), localname).then(result => {
            if (result.success && result.data) {
                const list = Array.isArray(result.data) ? result.data : [result.data];
                setComande(list.filter((c: Comand) => c.status !== 'DELETED'));
            }
            setIsLoading(false);
        });
    }, [localname, myClientSessionId]);

    const visibleComande = isSessionMode && onlyMine
        ? comande.filter(c => c.id && comandClientMap.get(c.id) === myClientSessionId)
        : comande;

    return (
        <div style={{ background: 'var(--menu-bg)' }}>
            <div className="max-w-4xl mx-auto shadow-2xl min-h-screen" style={{ background: 'var(--menu-bg)' }}>
                <ClientStickyHeader
                    restaurantName={styles?.restaurantName || localname || ""}
                    onAllergenClick={() => setIsAllergenModalOpen(true)}
                    onCartClick={() => navigate(`/${localname}/cart`)}
                    cartItemCount={cartCount}
                />

                <main className="p-4 md:p-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center space-x-2 mb-6 font-semibold hover:opacity-80"
                        style={{ color: 'var(--menu-muted)' }}
                    >
                        <ArrowLeft className="w-5 h-5" />
                        <span>Indietro</span>
                    </button>
                    <h1 className="text-3xl md:text-4xl font-extrabold mb-6 tracking-tight" style={{ color: 'var(--menu-text)' }}>Cronologia Ordini</h1>

                    {isSessionMode && (
                        <div className="mb-5 inline-flex rounded-full p-1" style={{ background: 'var(--menu-surface)' }}>
                            <button
                                onClick={() => setOnlyMine(false)}
                                className="px-4 py-1.5 rounded-full text-xs font-semibold"
                                style={!onlyMine
                                    ? { background: 'var(--menu-accent)', color: 'var(--menu-accent-text)' }
                                    : { color: 'var(--menu-text)' }}
                            >
                                Tutti
                            </button>
                            <button
                                onClick={() => setOnlyMine(true)}
                                className="px-4 py-1.5 rounded-full text-xs font-semibold"
                                style={onlyMine
                                    ? { background: 'var(--menu-accent)', color: 'var(--menu-accent-text)' }
                                    : { color: 'var(--menu-text)' }}
                            >
                                Solo i miei
                            </button>
                        </div>
                    )}

                    {isLoading ? (
                        <p style={{ color: 'var(--menu-muted)' }}>Caricamento cronologia...</p>
                    ) : !isSessionMode && !localStorage.getItem('rf_table_id') ? (
                        <div className="text-center py-16">
                            <History className="w-20 h-20 mx-auto" style={{ color: 'var(--menu-muted)', opacity: 0.5 }} />
                            <h2 className="mt-4 text-xl font-semibold" style={{ color: 'var(--menu-text)' }}>Nessun tavolo associato</h2>
                            <p className="mt-2" style={{ color: 'var(--menu-muted)' }}>Scansiona il QR code del tuo tavolo per vedere gli ordini.</p>
                        </div>
                    ) : visibleComande.length === 0 ? (
                        <div className="text-center py-16">
                            <History className="w-20 h-20 mx-auto" style={{ color: 'var(--menu-muted)', opacity: 0.5 }} />
                            <h2 className="mt-4 text-xl font-semibold" style={{ color: 'var(--menu-text)' }}>Nessun ordine trovato</h2>
                            <p className="mt-2" style={{ color: 'var(--menu-muted)' }}>Non sono ancora state inviate comande per questo tavolo.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {visibleComande.map(comanda => {
                                const clientId = comanda.id ? comandClientMap.get(comanda.id) : undefined;
                                const label = clientId ? labelMap.get(clientId) : undefined;
                                return (
                                    <div key={comanda.id}>
                                        {isSessionMode && label && (
                                            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--menu-muted)' }}>
                                                {label}{clientId === myClientSessionId ? ' (tu)' : ''}
                                            </p>
                                        )}
                                        <ComandaCard comanda={comanda} />
                                    </div>
                                );
                            })}
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

export default HistoryOrdersPage;
