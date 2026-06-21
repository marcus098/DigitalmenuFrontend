import React, { useEffect, useMemo, useState } from 'react';
import { getPaymentsApi, getPaymentsTodayTotalApi } from '../../Utilities/api';
import { useData } from '../../Context/DataContext';
import { useNotification } from '../../Context/NotificationContext';
import { PaymentDto, OptionInProduct, ProductDto } from '../../types';
import { Comand, Product } from '../../ComandType';
import CustomLoading from '../../Components/CustomLoading';
import {
    CurrencyEuroIcon, CheckCircleIcon, ClockIcon, ShoppingBagIcon,
    TableCellsIcon, HomeIcon, XMarkIcon, PlusIcon, MinusIcon,
    MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';

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
    COMPLETED: 'bg-green-100  text-green-700',
};
const STATUS_LABEL: Record<string, string> = {
    PENDING: 'In attesa', PROGRESS: 'In preparazione', COMPLETED: 'Completato',
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

interface CheckoutState {
    quantities: Record<string, number>; // key: `${orderId}_${idx}`
    extras: ExtraItem[];
    discountPct: number;
}

const freshState = (): CheckoutState => ({ quantities: {}, extras: [], discountPct: 0 });

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
}

const CheckoutPanel: React.FC<PanelProps> = ({
    comand, label, state, onChange, onClose, onConfirm, confirming, productsMap,
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
    const subtotal =
        lineItems.reduce((s, { p, qty }) => s + itemUnitPrice(p) * qty, 0) +
        state.extras.reduce((s, e) => s + e.price * e.qty, 0);
    const discountAmt = subtotal * (state.discountPct / 100);
    const total = Math.max(0, subtotal - discountAmt);

    const DISCOUNT_PRESETS = [0, 5, 10, 15, 20];

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

                {/* Discount presets */}
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-500 mr-1">Sconto</span>
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

                {/* Total breakdown */}
                <div className="bg-gray-50 rounded-xl px-4 py-3 space-y-1.5">
                    <div className="flex justify-between text-sm text-gray-500">
                        <span>Subtotale</span>
                        <span>{formatEur(subtotal)}</span>
                    </div>
                    {state.discountPct > 0 && (
                        <div className="flex justify-between text-sm text-red-500">
                            <span>Sconto ({state.discountPct}%)</span>
                            <span>− {formatEur(discountAmt)}</span>
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
                        disabled={confirming}
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
type PayFilter    = 'ALL' | 'PENDING' | 'COMPLETED' | 'FAILED';

const CassaPage: React.FC = () => {
    const { comands, tablesMap, productsMap, categoriesMap, changeComandStatus } = useData();
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

    // Load payment history
    useEffect(() => {
        Promise.all([getPaymentsApi(), getPaymentsTodayTotalApi()]).then(([pr, tr]) => {
            if (pr.success && pr.data) setPayments((pr.data as any).data ?? pr.data);
            if (tr.success && tr.data) setTodayCents((tr.data as any).data?.amountCents ?? 0);
            setPayLoading(false);
        });
    }, []);

    // Active comands for checkout (exclude DELETED, require id)
    const activeComands = useMemo(() =>
        comands.filter(c => c.status !== 'DELETED' && c.id != null),
        [comands]);

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

    const handleConfirm = async () => {
        if (!selected?.id) return;
        setConfirming(true);
        try {
            changeComandStatus(selected.id, 'COMPLETED');
            addNotification({ type: 'success', message: 'Conto chiuso correttamente' });
            setSelected(null);
        } catch {
            addNotification({ type: 'error', message: 'Errore nella chiusura del conto' });
        } finally {
            setConfirming(false);
        }
    };

    // Payment history
    const filteredPayments = useMemo(() =>
        payFilter === 'ALL' ? payments : payments.filter(p => p.status === payFilter),
        [payments, payFilter]);

    const totalCompleted = useMemo(() =>
        payments.filter(p => p.status === 'COMPLETED').reduce((s, p) => s + p.amountCents, 0), [payments]);
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
                                                    ? 'border-gray-100 bg-gray-50 opacity-70'
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
                                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[c.status] ?? 'bg-gray-100 text-gray-500'}`}>
                                                    {STATUS_LABEL[c.status] ?? c.status}
                                                </span>
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
                                            <div className={`w-2 h-2 rounded-full shrink-0 ${
                                                p.status === 'COMPLETED' ? 'bg-green-500' :
                                                p.status === 'FAILED'    ? 'bg-red-500'   : 'bg-yellow-400'
                                            }`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-semibold text-gray-800 truncate">
                                                    {p.comandId ? `Ordine ${p.comandId.slice(0, 8)}…` : 'Pagamento'}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {p.createdAt ? formatTime(p.createdAt) : ''}
                                                    {p.idTable ? ` · Tavolo ${p.idTable}` : ''}
                                                </p>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${
                                                p.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                                                p.status === 'FAILED'    ? 'bg-red-100 text-red-600'     :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {p.status === 'COMPLETED' ? 'Completato' : p.status === 'FAILED' ? 'Fallito' : 'In attesa'}
                                            </span>
                                            <span className="text-base font-black text-gray-900 shrink-0 min-w-[80px] text-right">
                                                {formatEurCents(p.amountCents)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )
            )}
        </div>
    );
};

export default CassaPage;
