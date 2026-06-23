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
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200 shadow-lg">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3 mb-4">
                <div className="flex items-center gap-2 text-zinc-500">
                    <Clock className="w-5 h-5" />
                    <span className="font-semibold">{date.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_COLOR[statusKey] ?? STATUS_COLOR.AWAIT}`}>
                        {STATUS_LABEL[statusKey] ?? statusKey}
                    </span>
                    <div className="flex items-center gap-1 text-lg font-bold text-zinc-800">
                        <Wallet className="w-4 h-4 text-zinc-400" />
                        <span>€{total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {comanda.orders.flatMap((order, oi) =>
                    order.products.map((prod, pi) => (
                        <div key={`${oi}-${pi}`} className="p-3 rounded-lg bg-zinc-50 border border-zinc-200">
                            <div className="flex justify-between items-start">
                                <p className="font-bold text-zinc-800">
                                    <span className="font-semibold">{prod.quantity}x</span> {prod.productName}
                                </p>
                                <p className="font-bold text-zinc-700">€{((prod.productOption?.price ?? 0) * prod.quantity).toFixed(2)}</p>
                            </div>
                            {prod.note && <p className="text-xs text-zinc-500 mt-1 italic">"{prod.note}"</p>}
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
        <div className="bg-gray-50">
            <div className="max-w-4xl mx-auto bg-white shadow-2xl shadow-zinc-200 min-h-screen">
                <ClientStickyHeader
                    restaurantName={styles?.restaurantName || localname || ""}
                    onAllergenClick={() => setIsAllergenModalOpen(true)}
                    onCartClick={() => navigate(`/${localname}/cart`)}
                    cartItemCount={cartCount}
                />

                <main className="p-4 md:p-6">
                    <button onClick={() => navigate(-1)} className="flex items-center space-x-2 text-zinc-600 hover:text-amber-500 mb-6 font-semibold">
                        <ArrowLeft className="w-5 h-5" />
                        <span>Indietro</span>
                    </button>
                    <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-900 mb-6 tracking-tight">Cronologia Ordini</h1>

                    {isSessionMode && (
                        <div className="mb-5 inline-flex rounded-full p-1 bg-zinc-100">
                            <button
                                onClick={() => setOnlyMine(false)}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold ${!onlyMine ? 'bg-primary text-white' : 'text-zinc-700'}`}
                            >
                                Tutti
                            </button>
                            <button
                                onClick={() => setOnlyMine(true)}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold ${onlyMine ? 'bg-primary text-white' : 'text-zinc-700'}`}
                            >
                                Solo i miei
                            </button>
                        </div>
                    )}

                    {isLoading ? (
                        <p className="text-zinc-500">Caricamento cronologia...</p>
                    ) : !isSessionMode && !localStorage.getItem('rf_table_id') ? (
                        <div className="text-center py-16">
                            <History className="w-20 h-20 mx-auto text-zinc-300" />
                            <h2 className="mt-4 text-xl font-semibold text-zinc-700">Nessun tavolo associato</h2>
                            <p className="mt-2 text-zinc-500">Scansiona il QR code del tuo tavolo per vedere gli ordini.</p>
                        </div>
                    ) : visibleComande.length === 0 ? (
                        <div className="text-center py-16">
                            <History className="w-20 h-20 mx-auto text-zinc-300" />
                            <h2 className="mt-4 text-xl font-semibold text-zinc-700">Nessun ordine trovato</h2>
                            <p className="mt-2 text-zinc-500">Non sono ancora state inviate comande per questo tavolo.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {visibleComande.map(comanda => {
                                const clientId = comanda.id ? comandClientMap.get(comanda.id) : undefined;
                                const label = clientId ? labelMap.get(clientId) : undefined;
                                return (
                                    <div key={comanda.id}>
                                        {isSessionMode && label && (
                                            <p className="text-xs font-bold uppercase tracking-widest mb-2 text-zinc-500">
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
