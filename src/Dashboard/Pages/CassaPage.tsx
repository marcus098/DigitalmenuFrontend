import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    getCheckoutSummaryApi, getInfoCardApi, getLoyaltySettingsApi, getToCheckoutApi,
    getPaymentsApi, getPaymentsTodayTotalApi, refundPaymentApi,
} from '../../Utilities/api';
import { useData } from '../../Context/DataContext';
import { useNotification } from '../../Context/NotificationContext';
import { CardDto, LoyaltySettings, PaymentDto, OptionInProduct, ProductDto } from '../../types';
import { Comand, Product } from '../../ComandType';
import CustomLoading from '../../Components/CustomLoading';
import {
    CurrencyEuroIcon, CheckCircleIcon, ClockIcon, ShoppingBagIcon,
    TableCellsIcon, HomeIcon, XMarkIcon, PlusIcon, MinusIcon,
    MagnifyingGlassIcon, ArrowUturnLeftIcon, QrCodeIcon, CreditCardIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

// Caricato solo quando si apre lo scanner della tessera
const QrScanner = React.lazy(() => import('react-qr-scanner'));

// ─── Helpers ─────────────────────────────────────────────────────────────────

const itemUnitPrice = (p: Product) =>
    (p.productOption?.price ?? 0) +
    (p.ingredientsPlus ?? []).reduce((s, i) => s + (i.price ?? 0), 0);

const formatEur = (n: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);

const formatEurCents = (c: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(c / 100);

const formatTime = (iso: string) =>
    new Date(iso).toLocaleString('it-IT', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });

// ─── Comand classification ────────────────────────────────────────────────────

type ComandKind = 'table' | 'takeaway' | 'home';

const comandKind = (c: Comand): ComandKind => {
    if (c.idTable) return 'table';
    if (c.comandWaiterType === 'HOME' || c.address) return 'home';
    return 'takeaway';
};

const comandLabel = (c: Comand, tablesMap: Map<number, { name: string }>): string => {
    if (c.idTable) {
        const t = tablesMap.get(c.idTable);
        return t ? `Tavolo ${t.name}` : `Tavolo ${c.idTable}`;
    }
    if (c.comandWaiterType === 'HOME' || c.address) return `Domicilio${c.name ? ` · ${c.name}` : ''}`;
    return `Asporto${c.name ? ` · ${c.name}` : ''}`;
};

const comandTotal = (c: Comand) =>
    c.orders.reduce((s, o) =>
        s + o.products.reduce((ps, p) => ps + itemUnitPrice(p) * p.quantity, 0), 0);

const comandItems = (c: Comand) =>
    c.orders.reduce((s, o) => s + o.products.reduce((ps, p) => ps + p.quantity, 0), 0);

// ─── Status UI ───────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, string> = {
    PENDING:   'bg-yellow-100 text-yellow-700',
    PROGRESS:  'bg-blue-100   text-blue-700',
    COMPLETED: 'bg-amber-100  text-amber-800',
};
const STATUS_LABEL: Record<string, string> = {
    PENDING: 'In attesa', PROGRESS: 'In preparazione', COMPLETED: 'Servito · da incassare',
};

const KIND_ICON: Record<ComandKind, React.FC<{ className?: string }>> = {
    table:    ({ className }) => <TableCellsIcon className={className} />,
    takeaway: ({ className }) => <ShoppingBagIcon className={className} />,
    home:     ({ className }) => <HomeIcon className={className} />,
};
const KIND_COLOR: Record<ComandKind, string> = {
    table: 'bg-blue-100 text-blue-600', takeaway: 'bg-amber-100 text-amber-600', home: 'bg-violet-100 text-violet-600',
};

// ─── Checkout state ───────────────────────────────────────────────────────────

interface ExtraItem {
    uid: string;
    productId: number;
    productName: string;
    optionName: string;
    price: number;
    qty: number;
}

type DiscountMode = 'pct' | 'final';

interface CheckoutState {
    quantities: Record<string, number>; // key: `${orderId}_${idx}`
    extras: ExtraItem[];
    discountMode: DiscountMode;
    discountPct: number;
    finalPrice: string;        // "Prezzo finale": quanto paga davvero il cliente (testo, accetta la virgola)
    card: CardDto | null;      // tessera fedeltà collegata al conto
    earn: boolean;             // accumula punti / timbro alla chiusura
    redeemStamps: boolean;     // tessera a timbri: riscatta il premio (scala `scope` timbri)
    pointsToUse: number;       // tessera a punti: punti da scalare
    pointsValue: string;       // valore in € dei punti usati (sconto tessera)
}

const freshState = (): CheckoutState => ({
    quantities: {}, extras: [], discountMode: 'pct', discountPct: 0, finalPrice: '',
    card: null, earn: true, redeemStamps: false, pointsToUse: 0, pointsValue: '',
});

const parseEur = (v: string): number | null => {
    if (v.trim() === '') return null;
    const n = parseFloat(v.replace(',', '.'));
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null;
};

const round2 = (n: number) => Math.round(n * 100) / 100;

const checkoutSubtotal = (comand: Comand, state: CheckoutState) =>
    comand.orders.reduce((s, order) =>
        s + order.products.reduce((ps, p, idx) =>
            ps + itemUnitPrice(p) * (state.quantities[`${order.id}_${idx}`] ?? p.quantity), 0), 0) +
    state.extras.reduce((s, e) => s + e.price * e.qty, 0);

/**
 * Totale del conto. Con il "prezzo finale" il totale è quello digitato (include già ogni sconto,
 * tessera compresa); altrimenti subtotale − sconto % − sconto tessera.
 */
const computeTotals = (subtotal: number, state: CheckoutState, loyalty: LoyaltySettings | null) => {
    const pctAmt = round2(subtotal * (state.discountPct / 100));
    // Valore dei punti: dalle impostazioni del locale se c'è, altrimenti quello digitato dall'operatore
    const cardAmt = !state.card?.typePoints || state.pointsToUse <= 0 ? 0
        : loyalty?.pointValue != null ? round2(state.pointsToUse * loyalty.pointValue)
        : (parseEur(state.pointsValue) ?? 0);
    const final = state.discountMode === 'final' ? parseEur(state.finalPrice) : null;
    const total = state.discountMode === 'final'
        ? (final ?? round2(subtotal))
        : Math.max(0, round2(subtotal - pctAmt - cardAmt));
    const card = state.card;
    const earned = !card || !state.earn ? 0
        : card.typePoints ? (card.priceForPoint > 0 ? Math.floor(total / card.priceForPoint + 1e-9) : 0)
        : 1;
    return { pctAmt, cardAmt, final, total, adjustment: round2(subtotal - total), earned };
};

// ─── Tessera fedeltà ─────────────────────────────────────────────────────────

const LoyaltySection: React.FC<{
    state: CheckoutState;
    onChange: (s: CheckoutState) => void;
    earned: number;
    cardAmt: number;
    loyalty: LoyaltySettings | null;
}> = ({ state, onChange, earned, cardAmt, loyalty }) => {
    const { addNotification } = useNotification();
    const [open, setOpen] = useState(false);
    const [code, setCode] = useState('');
    const [scanning, setScanning] = useState(false);
    const [loading, setLoading] = useState(false);
    const card = state.card;

    const lookup = async (raw: string) => {
        // Il QR della tessera contiene l'URL .../cardStatus#CODICE
        const c = raw.split('#').pop()?.trim().toUpperCase();
        if (!c || loading) return;
        setScanning(false);
        setLoading(true);
        const res = await getInfoCardApi(c);
        setLoading(false);
        if (res.success && res.data?.data) {
            onChange({ ...state, card: res.data.data, earn: true, redeemStamps: false, pointsToUse: 0, pointsValue: '' });
            setCode('');
        } else {
            addNotification({ type: 'warning', message: 'Tessera non trovata' });
        }
    };

    const unlink = () => onChange({ ...state, card: null, redeemStamps: false, pointsToUse: 0, pointsValue: '' });

    if (!card && !open) {
        return (
            <button onClick={() => setOpen(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-dashed border-gray-200 text-sm font-semibold text-gray-500 hover:border-primary hover:text-primary transition-colors">
                <CreditCardIcon className="w-4 h-4" />
                Collega tessera fedeltà
            </button>
        );
    }

    if (!card) {
        return (
            <div className="border border-gray-200 rounded-xl p-3 space-y-2">
                {scanning ? (
                    <React.Suspense fallback={<p className="text-xs text-gray-400 text-center py-6">Avvio fotocamera…</p>}>
                        <QrScanner
                            onScan={(d: { text: string } | null) => { if (d) lookup(d.text); }}
                            onError={() => {
                                setScanning(false);
                                addNotification({ type: 'error', message: 'Impossibile avviare la fotocamera' });
                            }}
                            constraints={{ video: { facingMode: 'environment' } }}
                            style={{ width: '100%', borderRadius: '12px' }}
                        />
                        <button onClick={() => setScanning(false)} className="w-full text-xs text-gray-500 font-semibold py-1">
                            Annulla scansione
                        </button>
                    </React.Suspense>
                ) : (
                    <div className="flex items-center gap-2">
                        <input
                            autoFocus
                            value={code}
                            onChange={e => setCode(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') lookup(code); }}
                            placeholder="Codice tessera"
                            className="flex-1 min-w-0 text-sm uppercase border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <button onClick={() => lookup(code)} disabled={loading || !code.trim()}
                                className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold disabled:opacity-50">
                            {loading ? '…' : 'Cerca'}
                        </button>
                        <button onClick={() => setScanning(true)} title="Scansiona QR" aria-label="Scansiona QR"
                                className="p-1.5 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200">
                            <QrCodeIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => setOpen(false)} title="Chiudi" aria-label="Chiudi"
                                className="p-1.5 text-gray-400 hover:text-gray-600">
                            <XMarkIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        );
    }

    const prizeReady = !card.typePoints && card.actualValue >= card.scope;

    return (
        <div className="border border-primary/20 bg-primary/5 rounded-xl p-3 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                    <p className="font-bold text-gray-800 truncate">
                        <CreditCardIcon className="w-4 h-4 inline -mt-0.5 mr-1" />{card.code}
                    </p>
                    <p className="text-xs text-gray-500">
                        {card.typePoints
                            ? `${card.actualValue} punti · 1 punto ogni ${formatEur(card.priceForPoint)}`
                            : `${card.actualValue} / ${card.scope} timbri`}
                    </p>
                </div>
                <button onClick={unlink} title="Scollega tessera" aria-label="Scollega tessera"
                        className="p-1.5 text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="w-4 h-4" />
                </button>
            </div>

            {prizeReady && (
                <label className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" className="mt-0.5" checked={state.redeemStamps}
                           onChange={e => onChange({ ...state, redeemStamps: e.target.checked, earn: !e.target.checked })} />
                    <span>
                        <span className="font-semibold text-green-700">Premio disponibile: riscatta</span>
                        <span className="block text-xs text-gray-500">
                            {loyalty?.stampsPrize ? `Premio: ${loyalty.stampsPrize}. ` : ''}
                            Scala {card.scope} timbri. Applica il premio con lo sconto o il prezzo finale.
                        </span>
                    </span>
                </label>
            )}

            {card.typePoints && card.actualValue > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-gray-500">Usa</span>
                    <input type="number" min={0} max={card.actualValue} value={state.pointsToUse || ''} placeholder="0"
                           onChange={e => onChange({ ...state, pointsToUse: Math.max(0, Math.min(card.actualValue, Math.floor(Number(e.target.value) || 0))) })}
                           className="w-16 text-sm text-center border border-gray-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-primary/30" />
                    {loyalty?.pointValue != null ? (
                        <span className="text-xs text-gray-500">
                            punti = <b className="text-gray-800">{formatEur(cardAmt)}</b> di sconto
                            <span className="block">1 punto = {formatEur(loyalty.pointValue)}</span>
                        </span>
                    ) : (
                        <>
                            <span className="text-xs text-gray-500">punti, valore €</span>
                            <input type="text" inputMode="decimal" value={state.pointsValue} placeholder="0,00"
                                   disabled={state.pointsToUse <= 0}
                                   onChange={e => onChange({ ...state, pointsValue: e.target.value.replace(/[^0-9.,]/g, '') })}
                                   className="w-20 text-sm text-center border border-gray-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:bg-gray-50" />
                        </>
                    )}
                    {state.discountMode === 'final' && state.pointsToUse > 0 && (
                        <p className="w-full text-xs text-gray-500">Con il prezzo finale lo sconto tessera è già compreso nell'importo digitato.</p>
                    )}
                </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={state.earn} onChange={e => onChange({ ...state, earn: e.target.checked })} />
                <span className="text-gray-700">
                    {card.typePoints
                        ? <>Accredita <b>{earned}</b> {earned === 1 ? 'punto' : 'punti'} alla chiusura</>
                        : prizeReady && !state.redeemStamps
                            ? 'Aggiungi 1 timbro (tessera già piena)'
                            : 'Aggiungi 1 timbro alla chiusura'}
                </span>
            </label>
        </div>
    );
};

// ─── CheckoutPanel ────────────────────────────────────────────────────────────

interface PanelProps {
    comand:       Comand;
    label:        string;
    state:        CheckoutState;
    onChange:     (s: CheckoutState) => void;
    onClose:      () => void;
    onConfirm:    () => void;
    confirming:   boolean;
    productsMap:  Map<number, ProductDto>;
    categoriesMap: Map<number, { name: string }>;
    loyalty:      LoyaltySettings | null;
}

const CheckoutPanel: React.FC<PanelProps> = ({
    comand, label, state, onChange, onClose, onConfirm, confirming, productsMap, loyalty,
}) => {
    const [addMode, setAddMode] = useState(false);
    const [search,  setSearch]  = useState('');

    // Build flat item list from comand
    const lineItems = useMemo(() =>
        comand.orders.flatMap(order =>
            order.products.map((p, idx) => {
                const key = `${order.id}_${idx}`;
                return { key, p, qty: state.quantities[key] ?? p.quantity };
            })
        ), [comand, state.quantities]);

    const setItemQty = (key: string, qty: number) =>
        onChange({ ...state, quantities: { ...state.quantities, [key]: Math.max(0, qty) } });

    // Add product from catalogue
    const filteredProducts = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return [];
        return Array.from(productsMap.values())
            .filter(p => p.available && p.name.toLowerCase().includes(q))
            .slice(0, 10);
    }, [search, productsMap]);

    const handleAddExtra = (product: ProductDto, option: OptionInProduct) => {
        const existing = state.extras.findIndex(
            e => e.productId === product.id && e.optionName === option.name
        );
        if (existing >= 0) {
            const next = [...state.extras];
            next[existing] = { ...next[existing], qty: next[existing].qty + 1 };
            onChange({ ...state, extras: next });
        } else {
            onChange({
                ...state,
                extras: [...state.extras, {
                    uid: Math.random().toString(36).slice(2),
                    productId:   product.id,
                    productName: product.name,
                    optionName:  option.name,
                    price:       option.price,
                    qty:         1,
                }],
            });
        }
    };

    const setExtraQty = (uid: string, qty: number) =>
        onChange({
            ...state,
            extras: qty <= 0
                ? state.extras.filter(e => e.uid !== uid)
                : state.extras.map(e => e.uid === uid ? { ...e, qty } : e),
        });

    // Totals
    const subtotal = checkoutSubtotal(comand, state);
    const totals = computeTotals(subtotal, state, loyalty);
    const { total } = totals;
    const finalInvalid = state.discountMode === 'final' && totals.final === null;

    const DISCOUNT_PRESETS = [0, 5, 10, 15, 20];

    // Arrotondamenti rapidi per il prezzo finale (all'euro e ai 5 € inferiori)
    const roundSuggestions = Array.from(new Set([Math.floor(subtotal), Math.floor(subtotal / 5) * 5]))
        .filter(v => v > 0 && v < round2(subtotal));

    const setMode = (mode: DiscountMode) => onChange({
        ...state,
        discountMode: mode,
        // Passando a "prezzo finale" si parte dal totale attuale, da correggere a mano
        finalPrice: mode === 'final' && state.finalPrice === '' ? total.toFixed(2).replace('.', ',') : state.finalPrice,
    });

    return (
        <div className="flex flex-col h-full max-h-[calc(100vh-6rem)]">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
                <div>
                    <h2 className="text-lg font-black text-gray-900">{label}</h2>
                    <p className="text-xs text-gray-400">{formatTime(comand.createdAt)}</p>
                </div>
                <button onClick={onClose}
                        className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-700">
                    <XMarkIcon className="w-5 h-5" />
                </button>
            </div>

            {/* Scrollable items area */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2 min-h-0">

                {/* Original order items */}
                {lineItems.map(({ key, p, qty }) => {
                    const unit = itemUnitPrice(p);
                    const removed = qty === 0;
                    return (
                        <div key={key}
                             className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${
                                 removed
                                     ? 'border-gray-100 bg-gray-50 opacity-50'
                                     : 'border-gray-100 bg-white'
                             }`}>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-semibold leading-tight ${removed ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                    {p.productName}
                                </p>
                                {p.productOption?.name && !p.productOption.isDefault && (
                                    <p className="text-xs text-gray-400 mt-0.5">{p.productOption.name}</p>
                                )}
                                {(p.ingredientsPlus ?? []).length > 0 && (
                                    <p className="text-xs text-emerald-600 mt-0.5">
                                        + {p.ingredientsPlus.map(i => i.name).join(', ')}
                                    </p>
                                )}
                                {(p.ingredientsMinus ?? []).length > 0 && (
                                    <p className="text-xs text-red-400 mt-0.5">
                                        − {p.ingredientsMinus.map(i => i.name).join(', ')}
                                    </p>
                                )}
                                {p.note && (
                                    <p className="text-xs text-gray-400 italic mt-0.5">{p.note}</p>
                                )}
                            </div>
                            {/* Qty controls */}
                            <div className="flex items-center gap-1 shrink-0 mt-0.5">
                                <button onClick={() => setItemQty(key, qty - 1)}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                                    <MinusIcon className="w-3.5 h-3.5 text-gray-600" />
                                </button>
                                <span className="w-6 text-center text-sm font-bold text-gray-700">{qty}</span>
                                <button onClick={() => setItemQty(key, qty + 1)}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                                    <PlusIcon className="w-3.5 h-3.5 text-gray-600" />
                                </button>
                            </div>
                            <p className={`text-sm font-bold w-16 text-right shrink-0 mt-0.5 ${removed ? 'line-through text-gray-300' : 'text-gray-700'}`}>
                                {formatEur(unit * qty)}
                            </p>
                        </div>
                    );
                })}

                {/* Extras added at cassa */}
                {state.extras.length > 0 && (
                    <>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-primary pt-2 px-1">
                            Aggiunte in cassa
                        </p>
                        {state.extras.map(e => (
                            <div key={e.uid}
                                 className="flex items-center gap-3 p-3 rounded-xl border-2 border-primary/20 bg-primary/5">
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-800">{e.productName}</p>
                                    {e.optionName && e.optionName !== e.productName && (
                                        <p className="text-xs text-gray-400">{e.optionName}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                    <button onClick={() => setExtraQty(e.uid, e.qty - 1)}
                                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
                                        <MinusIcon className="w-3.5 h-3.5 text-gray-600" />
                                    </button>
                                    <span className="w-6 text-center text-sm font-bold text-gray-700">{e.qty}</span>
                                    <button onClick={() => setExtraQty(e.uid, e.qty + 1)}
                                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-white border border-gray-200 hover:bg-gray-50 transition-colors">
                                        <PlusIcon className="w-3.5 h-3.5 text-gray-600" />
                                    </button>
                                </div>
                                <p className="text-sm font-bold w-16 text-right text-primary shrink-0">
                                    {formatEur(e.price * e.qty)}
                                </p>
                            </div>
                        ))}
                    </>
                )}

                {/* Add product toggle */}
                {addMode ? (
                    <div className="border border-gray-200 rounded-2xl overflow-hidden mt-2">
                        <div className="flex items-center gap-2 p-3 bg-gray-50 border-b border-gray-100">
                            <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 shrink-0" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Cerca prodotto da aggiungere…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="flex-1 bg-transparent text-sm focus:outline-none placeholder-gray-400"
                            />
                            <button
                                onClick={() => { setAddMode(false); setSearch(''); }}
                                className="text-xs text-gray-400 hover:text-gray-600 font-medium"
                            >
                                Chiudi
                            </button>
                        </div>
                        {search.trim() === '' ? (
                            <p className="text-center text-xs text-gray-400 py-6">Digita per cercare</p>
                        ) : filteredProducts.length === 0 ? (
                            <p className="text-center text-xs text-gray-400 py-6">Nessun prodotto trovato</p>
                        ) : (
                            <div className="divide-y divide-gray-50 max-h-52 overflow-y-auto">
                                {filteredProducts.map(product => (
                                    <div key={product.id} className="p-3">
                                        <p className="text-sm font-semibold text-gray-700 mb-2">{product.name}</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {product.options.map(opt => (
                                                <button
                                                    key={opt.name}
                                                    onClick={() => handleAddExtra(product, opt)}
                                                    className="flex items-center gap-1 px-2.5 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-semibold hover:bg-primary/20 transition-colors"
                                                >
                                                    <PlusIcon className="w-3 h-3" />
                                                    {opt.name || product.name} · {formatEur(opt.price)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <button
                        onClick={() => setAddMode(true)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-400 hover:border-primary hover:text-primary transition-colors mt-1"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Aggiungi articolo
                    </button>
                )}
            </div>

            {/* Footer: discount + totals + actions */}
            <div className="border-t border-gray-100 px-5 py-4 space-y-4 shrink-0">

                {/* Tessera fedeltà */}
                <LoyaltySection state={state} onChange={onChange} earned={totals.earned} cardAmt={totals.cardAmt} loyalty={loyalty} />

                {comand.paid && (
                    <p className="text-xs text-green-700 bg-green-50 rounded-lg px-3 py-2">
                        Pagato online: l'incasso è già registrato nei pagamenti. Chiudendo il conto non verrà contato due volte.
                    </p>
                )}

                {/* Sconto: percentuale oppure prezzo finale */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 mr-1">Sconto</span>
                        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                            {([['pct', 'Percentuale'], ['final', 'Prezzo finale']] as [DiscountMode, string][]).map(([m, lbl]) => (
                                <button key={m} onClick={() => setMode(m)}
                                        className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors ${
                                            state.discountMode === m ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-700'
                                        }`}>
                                    {lbl}
                                </button>
                            ))}
                        </div>
                    </div>

                    {state.discountMode === 'pct' ? (
                        <div className="flex items-center gap-2 flex-wrap">
                            {DISCOUNT_PRESETS.map(pct => (
                                <button
                                    key={pct}
                                    onClick={() => onChange({ ...state, discountPct: pct })}
                                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                                        state.discountPct === pct
                                            ? 'bg-primary text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                >
                                    {pct}%
                                </button>
                            ))}
                            <input
                                type="number"
                                min={0}
                                max={100}
                                value={state.discountPct}
                                onChange={e => onChange({ ...state, discountPct: Math.max(0, Math.min(100, Number(e.target.value))) })}
                                className="w-16 text-sm text-center border border-gray-200 rounded-lg py-1 focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 flex-wrap">
                            <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">€</span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    autoFocus
                                    value={state.finalPrice}
                                    onChange={e => onChange({ ...state, finalPrice: e.target.value.replace(/[^0-9.,]/g, '') })}
                                    className={`w-28 text-base font-bold pl-6 pr-2 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30 ${finalInvalid ? 'border-red-300' : 'border-gray-200'}`}
                                    aria-label="Prezzo finale"
                                />
                            </div>
                            {roundSuggestions.map(v => (
                                <button key={v}
                                        onClick={() => onChange({ ...state, finalPrice: v.toFixed(2).replace('.', ',') })}
                                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors">
                                    {formatEur(v)}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Total breakdown */}
                <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1.5">
                    <div className="flex justify-between text-sm text-gray-500">
                        <span>Subtotale</span>
                        <span>{formatEur(subtotal)}</span>
                    </div>
                    {state.discountMode === 'pct' ? (
                        <>
                            {totals.pctAmt > 0 && (
                                <div className="flex justify-between text-sm text-red-500">
                                    <span>Sconto ({state.discountPct}%)</span>
                                    <span>− {formatEur(totals.pctAmt)}</span>
                                </div>
                            )}
                            {totals.cardAmt > 0 && (
                                <div className="flex justify-between text-sm text-red-500">
                                    <span>Sconto tessera ({state.pointsToUse} punti)</span>
                                    <span>− {formatEur(totals.cardAmt)}</span>
                                </div>
                            )}
                        </>
                    ) : !finalInvalid && totals.adjustment !== 0 && (
                        <div className={`flex justify-between text-sm ${totals.adjustment > 0 ? 'text-red-500' : 'text-amber-600'}`}>
                            <span>
                                {totals.adjustment > 0 ? 'Sconto' : 'Maggiorazione'}
                                {subtotal > 0 && ` (${Math.abs(totals.adjustment / subtotal * 100).toLocaleString('it-IT', { maximumFractionDigits: 1 })}%)`}
                            </span>
                            <span>{totals.adjustment > 0 ? '−' : '+'} {formatEur(Math.abs(totals.adjustment))}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-black text-lg text-gray-900 pt-1.5 border-t border-gray-200">
                        <span>Totale</span>
                        <span className="text-primary">{formatEur(total)}</span>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={() => onChange(freshState())}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        Azzera
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={confirming || finalInvalid}
                        className="flex-2 grow-[2] py-2.5 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                        <CheckCircleSolid className="w-5 h-5" />
                        {confirming ? 'Chiusura…' : 'Chiudi conto'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Main page ────────────────────────────────────────────────────────────────

type Tab          = 'checkout' | 'storico';
type KindFilter   = 'all' | ComandKind;
type PayFilter    = 'ALL' | 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

const PAY_STATUS: Record<string, { label: string; dot: string; badge: string }> = {
    COMPLETED:          { label: 'Completato',            dot: 'bg-green-500',  badge: 'bg-green-100 text-green-700' },
    PENDING:            { label: 'In attesa',             dot: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700' },
    FAILED:             { label: 'Fallito',               dot: 'bg-red-500',    badge: 'bg-red-100 text-red-600' },
    CANCELED:           { label: 'Annullato',             dot: 'bg-gray-400',   badge: 'bg-gray-100 text-gray-500' },
    REFUNDED:           { label: 'Rimborsato',            dot: 'bg-purple-500', badge: 'bg-purple-100 text-purple-700' },
    PARTIALLY_REFUNDED: { label: 'Rimborsato in parte',   dot: 'bg-purple-400', badge: 'bg-purple-50 text-purple-700' },
    AUTHORIZED:         { label: 'Autorizzato',           dot: 'bg-indigo-400', badge: 'bg-indigo-100 text-indigo-700' },
};

const isRefundable = (p: PaymentDto) => p.status === 'COMPLETED' || p.status === 'PARTIALLY_REFUNDED';
const refundedOf = (p: PaymentDto) => p.refundedCents ?? 0;
const netCents = (p: PaymentDto) => p.amountCents - refundedOf(p);
const matchesPayFilter = (p: PaymentDto, f: PayFilter) =>
    f === 'ALL' || p.status === f || (f === 'REFUNDED' && p.status === 'PARTIALLY_REFUNDED');

const PAYMENTS_REFRESH_DEBOUNCE_MS = 1500;

const CassaPage: React.FC = () => {
    const { comands, tablesMap, productsMap, categoriesMap, checkoutComand, orderEventTick } = useData();
    const [loyalty, setLoyalty] = useState<LoyaltySettings | null>(null);
    // Comande servite ma non incassate (dal server) e quelle chiuse ora (nascoste subito, senza attendere il refresh)
    const [served, setServed] = useState<Comand[]>([]);
    const [closedIds, setClosedIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        getLoyaltySettingsApi().then(r => { if (r.success && r.data?.data) setLoyalty(r.data.data); });
    }, []);
    const { addNotification } = useNotification();

    const [tab,         setTab]         = useState<Tab>('checkout');
    const [kindFilter,  setKindFilter]  = useState<KindFilter>('all');
    const [payments,    setPayments]    = useState<PaymentDto[]>([]);
    const [todayCents,  setTodayCents]  = useState<number | null>(null);
    const [payLoading,  setPayLoading]  = useState(true);
    const [payFilter,   setPayFilter]   = useState<PayFilter>('ALL');

    const [selected,    setSelected]    = useState<Comand | null>(null);
    const [checkout,    setCheckout]    = useState<CheckoutState>(freshState());
    const [confirming,  setConfirming]  = useState(false);

    const [refundTarget,  setRefundTarget]  = useState<PaymentDto | null>(null);
    const [refundAmount,  setRefundAmount]  = useState('');
    const [refunding,     setRefunding]     = useState(false);

    // Load payment history
    const loadPayments = useCallback(async () => {
        const d = new Date();
        const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const [pr, tr, cr, toc] = await Promise.all([
            getPaymentsApi(), getPaymentsTodayTotalApi(), getCheckoutSummaryApi(today, today), getToCheckoutApi(),
        ]);
        if (pr.success && pr.data) setPayments((pr.data as any).data ?? pr.data);
        if (toc.success && Array.isArray(toc.data)) setServed(toc.data);
        // Incassi di oggi = online + conti chiusi in cassa (importo effettivo, sconti inclusi)
        const online = tr.success && tr.data ? ((tr.data as any).data?.amountCents ?? 0) : 0;
        const cassaToday = cr.success && cr.data ? cr.data.reduce((s, x) => s + x.totalCents, 0) : 0;
        setTodayCents(tr.success || cr.success ? online + cassaToday : null);
        setPayLoading(false);
    }, []);

    useEffect(() => { loadPayments(); }, [loadPayments]);

    // Aggiornamento live: ogni evento ordine via SSE (es. comanda pagata online) ricarica
    // i pagamenti, con debounce per non martellare il backend sui burst di eventi.
    const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const scheduleRefresh = useCallback((delay = PAYMENTS_REFRESH_DEBOUNCE_MS) => {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        refreshTimerRef.current = setTimeout(() => {
            refreshTimerRef.current = null;
            loadPayments();
        }, delay);
    }, [loadPayments]);

    useEffect(() => {
        if (orderEventTick > 0) scheduleRefresh();
    }, [orderEventTick, scheduleRefresh]);

    useEffect(() => () => { if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current); }, []);

    const openRefund = (p: PaymentDto) => {
        setRefundTarget(p);
        setRefundAmount((netCents(p) / 100).toFixed(2));
    };

    const handleRefund = async () => {
        if (!refundTarget) return;
        const remaining = netCents(refundTarget);
        const cents = Math.round(parseFloat(refundAmount.replace(',', '.')) * 100);
        if (!Number.isFinite(cents) || cents <= 0 || cents > remaining) {
            addNotification({ type: 'warning', message: `Importo non valido (massimo ${formatEurCents(remaining)})` });
            return;
        }
        setRefunding(true);
        const res = await refundPaymentApi(refundTarget.id, cents === remaining ? undefined : cents);
        setRefunding(false);
        if (res.success) {
            addNotification({ type: 'success', message: 'Rimborso avviato: lo stato si aggiornerà a breve' });
            setRefundTarget(null);
            // Lo stato REFUNDED può arrivare in differita (webhook del provider): ricarica dopo qualche secondo
            scheduleRefresh(4000);
        } else {
            addNotification({ type: 'error', message: res.message && !res.message.startsWith('Request failed') ? res.message : 'Errore durante il rimborso' });
        }
    };

    // Da incassare = comande attive + comande già servite (COMPLETED dalla pagina Ordini) ma non ancora chiuse in cassa.
    // Escluse quelle eliminate, in attesa di pagamento/approvazione o senza id.
    const activeComands = useMemo(() => {
        const live = comands.filter(c => c.status !== 'DELETED' && c.status !== 'AWAIT_PAYMENT'
            && c.status !== 'AWAIT_APPROVAL' && c.id != null);
        const ids = new Set(live.map(c => c.id));
        return [...live, ...served.filter(c => !ids.has(c.id) && !closedIds.has(c.id as string))];
    }, [comands, served, closedIds]);

    const filteredComands = useMemo(() =>
        kindFilter === 'all' ? activeComands : activeComands.filter(c => comandKind(c) === kindFilter),
        [activeComands, kindFilter]);

    // Kind filter pills — only show if there are items of that kind
    const kindCounts = useMemo(() => ({
        all:      activeComands.length,
        table:    activeComands.filter(c => comandKind(c) === 'table').length,
        takeaway: activeComands.filter(c => comandKind(c) === 'takeaway').length,
        home:     activeComands.filter(c => comandKind(c) === 'home').length,
    }), [activeComands]);

    const handleSelect = (c: Comand) => {
        setSelected(c);
        setCheckout(freshState());
    };

    /**
     * Chiusura lato server: stato COMPLETED + importo incassato e sconto salvati sulla comanda
     * (così incassi e analytics tornano con la cassa) + movimenti tessera calcolati con le regole del locale.
     */
    const handleConfirm = async () => {
        if (!selected?.id) return;
        const state = checkout;
        const subtotal = checkoutSubtotal(selected, state);
        const t = computeTotals(subtotal, state, loyalty);
        const toCents = (n: number) => Math.round(n * 100);
        setConfirming(true);
        try {
            const res = await checkoutComand(selected.id, {
                subtotalCents: toCents(subtotal),
                totalCents: toCents(t.total),
                discountMode: state.discountMode === 'final' ? 'FINAL' : 'PCT',
                discountPct: state.discountMode === 'pct' ? state.discountPct : undefined,
                cardDiscountCents: toCents(t.cardAmt),
                cardId: state.card?.id,
                pointsToUse: state.card?.typePoints ? state.pointsToUse : 0,
                redeemStamps: state.redeemStamps,
                earn: state.earn,
            });
            if (!res) return;
            const closedId = selected.id;
            setClosedIds(prev => new Set(prev).add(closedId));
            const co = res.checkout;
            const parts: string[] = [];
            if (co.pointsUsed > 0) parts.push(`−${co.pointsUsed} punti`);
            if (co.stampRedeemed) parts.push('premio riscattato');
            if (co.pointsEarned > 0) parts.push(res.card?.typePoints ? `+${co.pointsEarned} punti` : '+1 timbro');
            addNotification({ type: 'success', message: 'Conto chiuso: ' + formatEurCents(co.totalCents) + (parts.length ? ` · tessera: ${parts.join(', ')}` : '') });
            if (co.loyaltyError) {
                addNotification({ type: 'error', message: 'Conto chiuso, ma i movimenti sulla tessera non sono riusciti: verifica dalla pagina Tessere.' });
            }
            setSelected(null);
            scheduleRefresh(500);
        } finally {
            setConfirming(false);
        }
    };

    // Payment history
    const filteredPayments = useMemo(() =>
        payments.filter(p => matchesPayFilter(p, payFilter)),
        [payments, payFilter]);

    const totalCompleted = useMemo(() =>
        payments.filter(p => p.status === 'COMPLETED' || p.status === 'PARTIALLY_REFUNDED')
            .reduce((s, p) => s + netCents(p), 0), [payments]);
    const totalAll = useMemo(() =>
        payments.reduce((s, p) => s + p.amountCents, 0), [payments]);

    return (
        <div className="p-4 sm:p-6 bg-slate-50 min-h-screen">

            {/* ── Page header ─────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Cassa</h1>
                    <p className="text-gray-400 text-sm mt-0.5">Checkout ordini · storico pagamenti</p>
                </div>
                <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm self-start">
                    <button
                        onClick={() => setTab('checkout')}
                        className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                            tab === 'checkout' ? 'bg-primary text-white shadow' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Checkout {activeComands.length > 0 && `(${activeComands.length})`}
                    </button>
                    <button
                        onClick={() => setTab('storico')}
                        className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                            tab === 'storico' ? 'bg-primary text-white shadow' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        Storico
                    </button>
                </div>
            </div>

            {/* ══ CHECKOUT TAB ════════════════════════════════════════════ */}
            {tab === 'checkout' && (
                <>
                    {/* Kind filter pills */}
                    {activeComands.length > 0 && (
                        <div className="flex gap-2 flex-wrap mb-5">
                            {([
                                { key: 'all',      label: 'Tutti' },
                                { key: 'table',    label: 'Tavoli' },
                                { key: 'takeaway', label: 'Asporto' },
                                { key: 'home',     label: 'Domicilio' },
                            ] as { key: KindFilter; label: string }[])
                                .filter(f => f.key === 'all' || kindCounts[f.key] > 0)
                                .map(f => (
                                    <button
                                        key={f.key}
                                        onClick={() => setKindFilter(f.key)}
                                        className={`px-4 py-1.5 rounded-xl text-sm font-semibold border transition-colors ${
                                            kindFilter === f.key
                                                ? 'bg-primary text-white border-primary shadow-sm'
                                                : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                        }`}
                                    >
                                        {f.label} ({f.key === 'all' ? kindCounts.all : kindCounts[f.key]})
                                    </button>
                                ))}
                        </div>
                    )}

                    {activeComands.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                            <ShoppingBagIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 font-semibold">Nessun ordine attivo al momento</p>
                        </div>
                    ) : (
                        <div className={`gap-6 ${selected ? 'grid grid-cols-1 lg:grid-cols-[1fr_400px]' : ''}`}>

                            {/* Comand cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 content-start">
                                {filteredComands.map(c => {
                                    const kind      = comandKind(c);
                                    const lbl       = comandLabel(c, tablesMap as any);
                                    const total     = comandTotal(c);
                                    const items     = comandItems(c);
                                    const isSelected = selected?.id === c.id;
                                    const isDone    = c.status === 'COMPLETED';
                                    const Icon      = KIND_ICON[kind];

                                    return (
                                        <button
                                            key={c.id}
                                            onClick={() => handleSelect(c)}
                                            className={`text-left rounded-2xl border-2 shadow-sm p-5 transition-all hover:shadow-md ${
                                                isSelected
                                                    ? 'border-primary ring-2 ring-primary/20 bg-white'
                                                    : isDone
                                                    ? 'border-amber-200 bg-white hover:border-amber-300'
                                                    : 'border-gray-100 bg-white hover:border-gray-200'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-3">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${KIND_COLOR[kind]}`}>
                                                        <Icon className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800 text-sm leading-tight">{lbl}</p>
                                                        <p className="text-xs text-gray-400">{formatTime(c.createdAt)}</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1 shrink-0">
                                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[c.status] ?? 'bg-gray-100 text-gray-500'}`}>
                                                        {STATUS_LABEL[c.status] ?? c.status}
                                                    </span>
                                                    {c.paid && (
                                                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-600 text-white" title="Pagato online">
                                                            Pagato
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex items-end justify-between">
                                                <p className="text-xs text-gray-400">
                                                    {items} {items === 1 ? 'articolo' : 'articoli'}
                                                </p>
                                                <p className="text-xl font-black text-gray-900">{formatEur(total)}</p>
                                            </div>

                                            {/* Extra info for delivery/takeaway */}
                                            {(c.name || c.phone || c.address || c.time) && (
                                                <div className="mt-2 pt-2 border-t border-gray-100 space-y-0.5">
                                                    {c.name  && <p className="text-xs text-gray-500 truncate">{c.name}</p>}
                                                    {c.phone && <p className="text-xs text-gray-400">{c.phone}</p>}
                                                    {c.address && <p className="text-xs text-gray-400 truncate">{c.address}</p>}
                                                    {c.time  && <p className="text-xs text-gray-400">⏱ {c.time}</p>}
                                                </div>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Checkout detail panel (sticky on desktop) */}
                            {selected && (
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col
                                                lg:sticky lg:top-6 lg:self-start lg:max-h-[calc(100vh-7rem)] lg:overflow-hidden">
                                    <CheckoutPanel
                                        comand={selected}
                                        label={comandLabel(selected, tablesMap as any)}
                                        state={checkout}
                                        onChange={setCheckout}
                                        onClose={() => setSelected(null)}
                                        onConfirm={handleConfirm}
                                        confirming={confirming}
                                        productsMap={productsMap}
                                        categoriesMap={categoriesMap}
                                        loyalty={loyalty}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* ══ STORICO TAB ═════════════════════════════════════════════ */}
            {tab === 'storico' && (
                payLoading ? <CustomLoading isFullPage /> : (
                    <>
                        {/* KPIs */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                            {[
                                { label: 'Incassi Oggi',       value: todayCents !== null ? formatEurCents(todayCents) : '—', icon: CurrencyEuroIcon, color: 'bg-emerald-500' },
                                { label: 'Totale Completati',  value: formatEurCents(totalCompleted), icon: CheckCircleIcon, color: 'bg-blue-500' },
                                { label: 'Totale Transazioni', value: formatEurCents(totalAll),       icon: ClockIcon,       color: 'bg-violet-500' },
                            ].map(({ label, value, icon: Icon, color }) => (
                                <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-gray-900 leading-tight">{value}</p>
                                        <p className="text-sm text-gray-500">{label}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Filter pills */}
                        <div className="flex gap-2 flex-wrap mb-4">
                            {([
                                { key: 'ALL',       label: `Tutti (${payments.length})` },
                                { key: 'COMPLETED', label: `Completati (${payments.filter(p => p.status === 'COMPLETED').length})` },
                                { key: 'PENDING',   label: `In attesa (${payments.filter(p => p.status === 'PENDING').length})` },
                                { key: 'FAILED',    label: `Falliti (${payments.filter(p => p.status === 'FAILED').length})` },
                                { key: 'REFUNDED',  label: `Rimborsati (${payments.filter(p => matchesPayFilter(p, 'REFUNDED')).length})` },
                            ] as { key: PayFilter; label: string }[]).map(f => (
                                <button
                                    key={f.key}
                                    onClick={() => setPayFilter(f.key)}
                                    className={`px-3 py-1.5 rounded-xl text-sm font-semibold border transition-colors ${
                                        payFilter === f.key
                                            ? 'bg-primary text-white border-primary'
                                            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                                    }`}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        {/* Payments list */}
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            {filteredPayments.length === 0 ? (
                                <div className="py-16 text-center">
                                    <CurrencyEuroIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                                    <p className="text-sm text-gray-400">Nessun pagamento trovato</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {filteredPayments.map(p => (
                                        <div key={p.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                                            <div className={`w-2 h-2 rounded-full shrink-0 ${(PAY_STATUS[p.status] ?? PAY_STATUS.PENDING).dot}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-800 truncate">
                                                    {p.comandId ? `Ordine ${p.comandId.slice(0, 8)}…` : 'Pagamento'}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {p.createdAt ? formatTime(p.createdAt) : ''}
                                                    {p.idTable ? ` · Tavolo ${p.idTable}` : ''}
                                                </p>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${(PAY_STATUS[p.status] ?? PAY_STATUS.PENDING).badge}`}>
                                                {(PAY_STATUS[p.status] ?? { label: p.status }).label}
                                            </span>
                                            <span className="shrink-0 min-w-[80px] text-right">
                                                <span className={`block text-base font-black ${refundedOf(p) > 0 ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                                    {formatEurCents(p.amountCents)}
                                                </span>
                                                {refundedOf(p) > 0 && (
                                                    <span className="block text-xs font-semibold text-purple-600">
                                                        −{formatEurCents(refundedOf(p))}
                                                    </span>
                                                )}
                                            </span>
                                            {isRefundable(p) ? (
                                                <button
                                                    onClick={() => openRefund(p)}
                                                    className="shrink-0 p-2 rounded-lg text-gray-500 hover:text-purple-700 hover:bg-purple-50 transition-colors"
                                                    title="Rimborsa"
                                                    aria-label="Rimborsa"
                                                >
                                                    <ArrowUturnLeftIcon className="w-5 h-5" />
                                                </button>
                                            ) : <span className="shrink-0 w-9" />}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )
            )}

            {/* ── Conferma rimborso ───────────────────────────────────── */}
            {refundTarget && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => !refunding && setRefundTarget(null)}>
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-xl font-bold text-gray-800 mb-1">Rimborsare il pagamento?</h3>
                        <p className="text-sm text-gray-500 mb-5">
                            {refundTarget.comandId ? `Ordine ${refundTarget.comandId.slice(0, 8)}… · ` : ''}
                            pagato {formatEurCents(refundTarget.amountCents)}
                            {refundedOf(refundTarget) > 0 ? `, già rimborsati ${formatEurCents(refundedOf(refundTarget))}` : ''}.
                            Il cliente riceverà l'importo sul metodo di pagamento usato (di solito in 5-10 giorni lavorativi).
                        </p>
                        <label className="label-style">Importo da rimborsare (€)</label>
                        <input
                            type="number"
                            inputMode="decimal"
                            min="0.01"
                            step="0.01"
                            max={(netCents(refundTarget) / 100).toFixed(2)}
                            value={refundAmount}
                            onChange={e => setRefundAmount(e.target.value)}
                            className="input-style"
                        />
                        <p className="text-xs text-gray-400 mt-1">Massimo {formatEurCents(netCents(refundTarget))}. L'operazione non è annullabile.</p>
                        <div className="flex justify-end gap-3 mt-6">
                            <button onClick={() => setRefundTarget(null)} disabled={refunding} className="btn-secondary">Annulla</button>
                            <button
                                onClick={handleRefund}
                                disabled={refunding}
                                className="px-4 py-2 rounded-lg font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                            >
                                {refunding ? 'Rimborso…' : 'Rimborsa'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CassaPage;
