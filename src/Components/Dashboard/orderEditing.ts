import {Comand, ComandHistoryEntry, ComandItemChange, SelectedVariant} from "../../ComandType";
import {AddComandOrder, IngredientDto, ProductDto} from "../../types";
import {Orders} from "../../Dashboard/Pages/OrderPage";
import {completeSelection, lineVariantLabels, VariantSelection, variantsSupplement} from "../../Utilities/variants";
import {getToken} from "../../Utilities/api";

/** Etichette italiane degli stati (card, modifica, storico). */
export const STATUS_LABEL: Record<string, string> = {
    AWAIT: "Nuovo",
    PENDING: "In attesa",
    PROGRESS: "In cucina",
    COMPLETED: "Completato",
    DELETED: "Cancellato",
    AWAIT_APPROVAL: "Da approvare",
    AWAIT_PAYMENT: "In attesa di pagamento",
};

const EDITABLE_STATUSES = ['AWAIT', 'PENDING', 'PROGRESS', 'AWAIT_APPROVAL'];

/** Quantità massima per riga accettata dal server. */
export const MAX_LINE_QTY = 50;

/**
 * Le righe si possono modificare: stato aperto, conto non chiuso in cassa, nessun pagamento online
 * (autorizzato o incassato). Il server ricontrolla tutto e risponde 409 con un messaggio leggibile.
 */
export const isOrderEditable = (order: Orders): boolean =>
    !!order.raw && EDITABLE_STATUSES.includes(order.status) && !order.raw.checkout && !order.paid && !order.paymentAuthorized;

/** Id dell'utente collegato, dal claim "id" del JWT (null se il token non è leggibile). */
export const currentUserId = (): number | null => {
    try {
        const part = getToken().split('.')[1];
        if (!part) return null;
        const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
        const json = JSON.parse(atob(b64.padEnd(Math.ceil(b64.length / 4) * 4, '=')));
        const id = Number(json?.id);
        return Number.isFinite(id) ? id : null;
    } catch {
        return null;
    }
};

/** Riga in modifica: gli stessi campi di /insertWaiter più quanto serve a mostrarla. */
export interface EditLine {
    key: string
    /** Indice dell'ordine (gruppo) della comanda a cui appartiene: il server li mantiene per posizione */
    group: number
    idProduct: number
    productName: string
    categoryName: string
    optionName: string
    variants: VariantSelection[]
    ingredientsPlus: number[]
    ingredientsMinus: number[]
    note: string
    quantity: number
    /** Prezzo unitario in euro: del server per le righe salvate, ricalcolato dal catalogo dopo una modifica */
    unitPrice: number
    /** Etichette salvate sulla comanda (righe non ancora personalizzate di nuovo) */
    saved?: { variants: SelectedVariant[], plus: string[], minus: string[] }
}

let keySeq = 0;
export const newLineKey = () => `l${++keySeq}`;

/** Righe della comanda nel formato dell'editor. */
export const comandToEditLines = (c: Comand): EditLine[] => {
    const lines: EditLine[] = [];
    (c.orders || []).forEach((o, group) => (o.products || []).forEach(p => {
        const variants = p.selectedVariants || [];
        const plus = p.ingredientsPlus || [];
        const minus = p.ingredientsMinus || [];
        lines.push({
            key: newLineKey(),
            group,
            idProduct: p.idProduct,
            productName: p.productName || '',
            categoryName: p.categoryName || '',
            optionName: p.productOption?.name ?? '',
            variants: variants.map(v => ({groupId: v.groupId, choiceId: v.choiceId})),
            ingredientsPlus: plus.map(i => i.id),
            ingredientsMinus: minus.map(i => i.id),
            note: p.note || '',
            quantity: p.quantity,
            unitPrice: p.unitPriceCents != null ? p.unitPriceCents / 100
                : (p.productOption?.price ?? 0) + variants.reduce((s, v) => s + (Number(v?.priceDelta) || 0), 0)
                  + plus.reduce((s, i) => s + (i?.price ?? 0), 0),
            saved: {variants, plus: plus.map(i => i?.name || ''), minus: minus.map(i => i?.name || '')},
        });
    }));
    return lines;
};

/** Prezzo unitario stimato dal catalogo (il server lo ricalcola al salvataggio). */
export const catalogUnitPrice = (product: ProductDto, line: Pick<EditLine, 'optionName' | 'variants' | 'ingredientsPlus'>,
                                 ingredientsMap: Map<number, IngredientDto>): number => {
    const option = product.options.find(o => o.name === line.optionName) ?? product.options.find(o => o.isDefault) ?? product.options[0];
    return (option?.price ?? 0)
        + variantsSupplement(product, completeSelection(product, line.variants))
        + line.ingredientsPlus.reduce((s, id) => s + (ingredientsMap.get(id)?.price ?? 0), 0);
};

/** Etichette da mostrare per una riga (salvate o, dopo una modifica, dal catalogo). */
export const lineLabels = (line: EditLine, product: ProductDto | undefined, ingredientsMap: Map<number, IngredientDto>) => {
    if (line.saved) return line.saved;
    const name = (id: number) => ingredientsMap.get(id)?.name ?? `#${id}`;
    return {
        variants: product ? lineVariantLabels(product, {id: line.idProduct, variants: line.variants} as any) as SelectedVariant[] : [],
        plus: line.ingredientsPlus.map(name),
        minus: line.ingredientsMinus.map(name),
    };
};

/** Identità della riga (come nel carrello): righe identiche si sommano. */
export const editLineIdentity = (l: Pick<EditLine, 'idProduct' | 'optionName' | 'variants' | 'ingredientsPlus' | 'ingredientsMinus' | 'note'>): string =>
    [l.idProduct, l.optionName,
        [...l.variants].sort((a, b) => a.groupId.localeCompare(b.groupId)).map(v => `${v.groupId}:${v.choiceId}`).join(','),
        [...l.ingredientsPlus].sort((a, b) => a - b).join(','),
        [...l.ingredientsMinus].sort((a, b) => a - b).join(','),
        l.note.trim()].join('|');

/** Corpo di PUT /api/orders/{id}/items: tutte le righe, nei gruppi originali (i nuovi prodotti vanno nell'ultimo). */
export const editLinesToOrders = (lines: EditLine[]): AddComandOrder[] => {
    const groups = Math.max(1, ...lines.map(l => l.group + 1));
    return Array.from({length: groups}, (_, g) => ({
        products: lines.filter(l => l.group === g).map(l => ({
            idProduct: l.idProduct,
            productOption: l.optionName,
            quantity: l.quantity,
            variants: l.variants,
            ingredientsMinus: l.ingredientsMinus,
            ingredientsPlus: l.ingredientsPlus,
            note: l.note.trim(),
        })),
    }));
};

// ── Storico ──────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0');

/** "20:01" (oggi) oppure "25/11 20:01". */
export const historyTime = (at: string): string => {
    const d = new Date(at);
    if (Number.isNaN(d.getTime())) return at;
    const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    return d.toDateString() === new Date().toDateString() ? time : `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${time}`;
};

/** Solo le parti cambiate di "Normale, Impasto: Classico" → "Normale, Impasto: Senza glutine" = "Impasto: Classico → Impasto: Senza glutine". */
const descriptionDiff = (oldDesc?: string | null, newDesc?: string | null): string => {
    const split = (d?: string | null) => (d || '').split(',').map(p => p.trim()).filter(Boolean);
    const before = split(oldDesc), after = split(newDesc);
    const removed = before.filter(p => !after.includes(p)), added = after.filter(p => !before.includes(p));
    return removed.length && added.length ? `${removed.join(', ')} → ${added.join(', ')}`
        : `${oldDesc || '—'} → ${newDesc || '—'}`;
};

const changeText = (c: ComandItemChange): string => {
    const name = c.productName || 'Prodotto';
    // Variante o nota cambiata insieme alla quantità: "Margherita 2→3: ..."
    const qty = c.oldQty != null && c.newQty != null && c.oldQty !== c.newQty ? ` ${c.oldQty}→${c.newQty}` : '';
    switch (c.type) {
        case 'ADDED': return `+${c.newQty ?? 1} ${name}`;
        case 'REMOVED': return `−${c.oldQty ?? 1} ${name}`;
        case 'QTY_CHANGED': return `${name} ${c.oldQty ?? '?'}→${c.newQty ?? '?'}`;
        case 'VARIANT_CHANGED': return `${name}${qty}: ${descriptionDiff(c.oldDescription, c.newDescription)}`;
        case 'NOTE_CHANGED': return c.newNote ? `${name}${qty}: nota “${c.newNote}”` : `${name}${qty}: nota tolta`;
        default: return name;
    }
};

/** Testo di una voce dello storico, es. "Modificato: +1 Birra, Margherita 2→3". */
export const historyText = (e: ComandHistoryEntry): string => {
    switch (e.action) {
        case 'CREATED': return 'Ordine creato';
        case 'EDITED': {
            const changes = (e.changes || []).map(changeText);
            return changes.length ? `Modificato: ${changes.join(', ')}` : 'Modificato';
        }
        case 'STATUS': {
            const label = (s?: string | null) => (s && STATUS_LABEL[s]) || s || '—';
            return `Stato: ${label(e.from)} → ${label(e.to)}`;
        }
        case 'CHECKOUT': return 'Conto chiuso';
        default: return String(e.action);
    }
};
