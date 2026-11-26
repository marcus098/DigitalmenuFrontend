import React, {useMemo, useRef, useState} from "react";
import {Minus, Plus, Search, Trash2, X} from "lucide-react";
import {Orders} from "../../Dashboard/Pages/OrderPage";
import {Comand} from "../../ComandType";
import {ProductDto} from "../../types";
import {useData} from "../../Context/DataContext";
import {useNotification} from "../../Context/NotificationContext";
import {editComandItemsApi, getAll} from "../../Utilities/api";
import {CartLine, formatPrice} from "../../Utilities/variants";
import ProductCustomizationDrawer from "../ProductCustomizationDrawer";
import SelectedVariantChips from "./SelectedVariantChips";
import {tableLabel} from "../../Dashboard/tableLabel";
import {
    catalogUnitPrice, comandToEditLines, currentUserId, EditLine, editLineIdentity, editLinesToOrders,
    lineLabels, MAX_LINE_QTY, newLineKey, STATUS_LABEL,
} from "./orderEditing";

/** Il formato unico ("default"/"Standard") non va mostrato. */
const showOption = (name?: string) => !!name && !["default", "standard"].includes(name.trim().toLowerCase());

// Il pannello di personalizzazione usa le variabili del tema del menu: in dashboard un tema chiaro neutro
const DRAWER_THEME = {
    '--menu-bg': '#f9fafb', '--menu-surface': '#f3f4f6', '--menu-card': '#ffffff', '--menu-card-hover': '#f9fafb',
    '--menu-text': '#111827', '--menu-muted': '#6b7280', '--menu-accent': '#f97316', '--menu-accent-text': '#ffffff',
    '--menu-border': '#e5e7eb', '--menu-input-bg': '#ffffff', '--menu-input-border': '#d1d5db',
    '--menu-input-text': '#111827', '--menu-input-placeholder': '#9ca3af',
} as React.CSSProperties;

interface OrderEditModalProps {
    order: Orders;
    onClose: () => void;
}

const OrderEditModal: React.FC<OrderEditModalProps> = ({order, onClose}) => {
    const {productsMap, categoriesMap, ingredientsMap, replaceComand} = useData();
    const {addNotification} = useNotification();
    const [base, setBase] = useState<Comand | undefined>(order.raw);
    const [lines, setLines] = useState<EditLine[]>(() => order.raw ? comandToEditLines(order.raw) : []);
    const initialPayload = useRef(JSON.stringify(editLinesToOrders(lines)));
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<{ message: string, conflict: boolean } | null>(null);
    // Personalizzazione: riga esistente (key) o nuovo prodotto (key null)
    const [custom, setCustom] = useState<{ product: ProductDto, key: string | null } | null>(null);
    const [picking, setPicking] = useState(false);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState<number | null>(null);

    const takenBy = base?.takenBy;
    const me = currentUserId();
    const colleague = takenBy && takenBy.id !== me ? takenBy.name : null;
    // Arrivata in tempo reale una versione più nuova di quella in modifica
    const stale = (order.raw?.version ?? 0) > (base?.version ?? 0);
    const lastGroup = Math.max(0, (base?.orders?.length ?? 1) - 1);

    const payload = editLinesToOrders(lines);
    const dirty = JSON.stringify(payload) !== initialPayload.current;
    const productsTotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
    const deliveryFee = (order.delivery?.feeCents ?? 0) / 100;
    const oldTotal = useMemo(() => base ? comandToEditLines(base).reduce((s, l) => s + l.unitPrice * l.quantity, 0) : 0, [base]);

    const categories = useMemo(() => Array.from(categoriesMap.values())
        .sort((a, b) => (a.progressiveNumber ?? 0) - (b.progressiveNumber ?? 0)), [categoriesMap]);
    const pickable = useMemo(() => {
        const q = search.trim().toLowerCase();
        return Array.from(productsMap.values())
            .filter(p => (category == null || p.idCategory === category) && (!q || p.name.toLowerCase().includes(q)))
            .sort((a, b) => (a.positionProgressive ?? 0) - (b.positionProgressive ?? 0) || a.name.localeCompare(b.name, 'it'));
    }, [productsMap, search, category]);

    const updateLine = (key: string, patch: Partial<EditLine>) =>
        setLines(prev => prev.map(l => l.key === key ? {...l, ...patch} : l));
    const removeLine = (key: string) => setLines(prev => prev.filter(l => l.key !== key));

    /** Conferma dal pannello di personalizzazione: aggiorna la riga o aggiunge il prodotto. */
    const onCustomized = (cart: CartLine) => {
        if (!custom) return;
        const product = custom.product;
        const fields = {
            optionName: cart.optionName,
            variants: cart.variants ?? [],
            ingredientsPlus: cart.ingredientsPlus,
            ingredientsMinus: cart.ingredientsMinus,
            note: cart.note,
            quantity: Math.min(MAX_LINE_QTY, cart.quantity),
        };
        const unitPrice = catalogUnitPrice(product, fields, ingredientsMap);
        setLines(prev => {
            const editing = custom.key ? prev.find(l => l.key === custom.key) : undefined;
            const identity = editLineIdentity({idProduct: product.id, ...fields});
            // Una riga identica a un'altra si somma (come nel carrello)
            const twin = prev.find(l => l.key !== custom.key && editLineIdentity(l) === identity);
            if (twin) {
                return prev.filter(l => l.key !== custom.key).map(l => l.key === twin.key
                    ? {...l, quantity: Math.min(MAX_LINE_QTY, l.quantity + fields.quantity)} : l);
            }
            if (editing) {
                // Personalizzazione invariata: si tengono prezzo ed etichette del server
                if (editLineIdentity(editing) === identity) return prev.map(l => l.key === editing.key ? {...l, quantity: fields.quantity} : l);
                return prev.map(l => l.key === editing.key ? {...l, ...fields, unitPrice, saved: undefined} : l);
            }
            return [...prev, {
                key: newLineKey(), group: lastGroup, idProduct: product.id, productName: product.name,
                categoryName: categoriesMap.get(product.idCategory)?.name ?? '', ...fields, unitPrice,
            }];
        });
    };

    const reload = async () => {
        setError(null);
        const res = await getAll(true);
        const fresh = res.data?.comands?.find(c => c.id === order.id);
        if (!fresh) {
            addNotification({message: "L'ordine non è più aperto", type: "error"});
            onClose();
            return;
        }
        replaceComand(fresh);
        const next = comandToEditLines(fresh);
        initialPayload.current = JSON.stringify(editLinesToOrders(next));
        setBase(fresh);
        setLines(next);
    };

    const save = async () => {
        if (saving || !order.id) return;
        setSaving(true);
        setError(null);
        const res = await editComandItemsApi(order.id, payload, base?.version);
        setSaving(false);
        if (res.success && res.data) {
            if (res.data.comand) replaceComand(res.data.comand);
            addNotification({message: res.data.changed ? "Ordine modificato" : "Nessuna modifica", type: "success"});
            onClose();
            return;
        }
        setError({
            message: res.message && !res.message.startsWith('Request failed') ? res.message : "Errore nel salvataggio dell'ordine",
            conflict: res.code === 'VERSION_CONFLICT',
        });
    };

    const qtyBtn = "w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center disabled:opacity-40";

    return (
        <div className="fixed inset-0 z-[70] bg-gray-800 bg-opacity-50 flex items-center justify-center p-4" style={DRAWER_THEME}
             role="dialog" aria-modal="true" aria-label="Modifica ordine">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-lg max-h-[calc(100vh-2rem)] flex flex-col">
                <div className="p-4 border-b border-gray-200 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="font-bold text-lg">Modifica ordine</h3>
                        <p className="text-sm text-gray-500 truncate">
                            {[order.tableName && tableLabel(order.tableName), order.name, STATUS_LABEL[order.status]].filter(Boolean).join(' · ')}
                        </p>
                        {colleague && <p className="mt-1 text-sm text-amber-700">Ordine preso da {colleague}</p>}
                    </div>
                    <button onClick={onClose} aria-label="Chiudi" className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"><X className="w-5 h-5"/></button>
                </div>

                <div className="p-4 overflow-y-auto flex-1 space-y-3">
                    {!base && <p className="text-sm text-gray-500">Righe dell'ordine non disponibili: ricarica la pagina.</p>}
                    {base && lines.length === 0 && (
                        <p className="text-sm text-red-600">L'ordine non può restare vuoto: per annullarlo usa "Cancella".</p>
                    )}
                    {lines.map(l => {
                        const product = productsMap.get(l.idProduct);
                        const labels = lineLabels(l, product, ingredientsMap);
                        return (
                            <div key={l.key} className="border border-gray-200 rounded-lg p-3" data-testid="edit-line">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <p className="font-semibold">
                                            {l.productName}
                                            {showOption(l.optionName) && <span className="font-normal text-gray-600"> · {l.optionName}</span>}
                                        </p>
                                        <SelectedVariantChips variants={labels.variants}/>
                                        {labels.plus.length > 0 && <p className="text-sm text-green-600">+ {labels.plus.join(", ")}</p>}
                                        {labels.minus.length > 0 && <p className="text-sm text-red-600">- {labels.minus.join(", ")}</p>}
                                    </div>
                                    <span className="shrink-0 text-sm font-semibold text-gray-700">{formatPrice(l.unitPrice * l.quantity)}</span>
                                </div>
                                <input
                                    value={l.note}
                                    onChange={e => updateLine(l.key, {note: e.target.value})}
                                    placeholder="Nota (es. ben cotta)"
                                    aria-label={`Nota ${l.productName}`}
                                    className="mt-2 w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <div className="mt-2 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <button className={qtyBtn} aria-label="Togli uno" disabled={l.quantity <= 1}
                                                onClick={() => updateLine(l.key, {quantity: l.quantity - 1})}><Minus size={16}/></button>
                                        <span className="w-6 text-center font-bold" data-testid="edit-line-qty">{l.quantity}</span>
                                        <button className={qtyBtn} aria-label="Aggiungi uno" disabled={l.quantity >= MAX_LINE_QTY}
                                                onClick={() => updateLine(l.key, {quantity: l.quantity + 1})}><Plus size={16}/></button>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {product && (
                                            <button className="text-blue-600 text-sm underline" onClick={() => setCustom({product, key: l.key})}>
                                                Personalizza
                                            </button>
                                        )}
                                        <button className="text-red-600 p-1.5 rounded hover:bg-red-50" aria-label={`Rimuovi ${l.productName}`}
                                                onClick={() => removeLine(l.key)}><Trash2 size={18}/></button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    {base && (picking ? (
                        <div className="border border-gray-200 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold text-sm">Aggiungi prodotto</h4>
                                <button className="text-sm text-gray-500 underline" onClick={() => setPicking(false)}>Chiudi</button>
                            </div>
                            <div className="relative mb-2">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
                                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca prodotto..." autoFocus
                                       className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                            </div>
                            <div className="flex gap-1.5 overflow-x-auto pb-2">
                                {[{id: null as number | null, name: 'Tutti'}, ...categories].map(c => (
                                    <button key={c.id ?? 'all'} onClick={() => setCategory(c.id)}
                                            className={`shrink-0 px-3 py-1 rounded-full text-xs font-semibold border ${category === c.id
                                                ? 'bg-gray-700 text-white border-gray-700' : 'bg-white text-gray-700 border-gray-300'}`}>
                                        {c.name}
                                    </button>
                                ))}
                            </div>
                            <ul className="max-h-56 overflow-y-auto divide-y divide-gray-100">
                                {pickable.map(p => (
                                    <li key={p.id}>
                                        <button disabled={!p.available} onClick={() => setCustom({product: p, key: null})}
                                                className="w-full flex justify-between items-center py-2 px-1 text-left text-sm hover:bg-gray-50 disabled:opacity-50">
                                            <span>{p.name}</span>
                                            <span className="text-gray-500">{p.available ? formatPrice((p.options.find(o => o.isDefault) ?? p.options[0])?.price ?? 0) : 'Esaurito'}</span>
                                        </button>
                                    </li>
                                ))}
                                {pickable.length === 0 && <li className="py-3 text-center text-sm text-gray-500">Nessun prodotto trovato.</li>}
                            </ul>
                        </div>
                    ) : (
                        <button onClick={() => setPicking(true)}
                                className="w-full border-2 border-dashed border-gray-300 rounded-lg py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                            + Aggiungi prodotto
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-gray-200 space-y-2">
                    {!error && stale && (
                        <div className="rounded bg-amber-50 border border-amber-200 p-2 text-sm text-amber-800" role="status">
                            Un collega ha appena modificato questo ordine.
                            <button onClick={reload} className="ml-2 font-semibold underline">Ricarica</button>
                        </div>
                    )}
                    {error && (
                        <div className="rounded bg-red-50 border border-red-200 p-2 text-sm text-red-700" role="alert">
                            {error.message}
                            {error.conflict && (
                                <button onClick={reload} className="ml-2 font-semibold underline">Ricarica</button>
                            )}
                        </div>
                    )}
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Totale{deliveryFee > 0 ? ' (con consegna)' : ''}</span>
                        <span className="font-bold" data-testid="edit-total">
                            {dirty && <span className="font-normal text-gray-400 line-through mr-2">{formatPrice(oldTotal + deliveryFee)}</span>}
                            {formatPrice(productsTotal + deliveryFee)}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="flex-1 bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded-lg text-sm font-semibold">Annulla</button>
                        <button onClick={save} disabled={!base || !dirty || lines.length === 0 || saving}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
                            {saving ? 'Salvataggio...' : 'Salva modifiche'}
                        </button>
                    </div>
                </div>
            </div>

            <ProductCustomizationDrawer
                isOpen={!!custom}
                onClose={() => setCustom(null)}
                dish={custom?.product ?? null}
                waiter={true}
                initial={custom?.key ? lines.find(l => l.key === custom.key) : undefined}
                onConfirm={onCustomized}
                confirmLabel={custom?.key ? 'Conferma' : 'Aggiungi'}
            />
        </div>
    );
};

export default OrderEditModal;
