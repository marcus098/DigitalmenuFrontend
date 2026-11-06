import {AddComandWaiter, AddProductToOrder, ProductToOrder} from "../types";
import {Orders} from "../Dashboard/Pages/OrderPage";
import {Comand, Product as ComandProduct} from "../ComandType";
import {CartLine, cartLineKey, lineVariantsPayload} from "./variants";

export const MOBILE_WIDTH = 350

export const resolveImageUrl = (path: string | undefined | null, fallback = ""): string => {
    if (!path) return fallback;
    const prefix = process.env.REACT_APP_IMAGE_URL_START;
    if (prefix && path.startsWith(prefix)) {
        return (process.env.REACT_APP_BUCKET_URL ?? "") + path;
    }
    return path;
};

/**
 * I 14 allergeni del Reg. UE 1169/2011 (Allegato II), con i nomi ufficiali italiani.
 * Gli id seguono l'ordine dell'Allegato II e coincidono con quelli salvati dal backend
 * e con allergensMap (DataContext): 1 glutine, 2 crostacei, 3 uova, 4 pesce, 5 arachidi,
 * 6 soia, 7 latte, 8 frutta a guscio, 9 sedano, 10 senape, 11 sesamo, 12 solfiti, 13 lupini, 14 molluschi.
 * `short` è l'etichetta breve per i marcatori compatti del menu.
 */
export const allergens = [
    { id: 1, name: 'Cereali contenenti glutine', short: 'Glutine', icon: '/icons/glutine.png' },
    { id: 2, name: 'Crostacei', short: 'Crostacei', icon: '/icons/crostacei.png' },
    { id: 3, name: 'Uova', short: 'Uova', icon: '/icons/uova.png' },
    { id: 4, name: 'Pesce', short: 'Pesce', icon: '/icons/pesce.png' },
    { id: 5, name: 'Arachidi', short: 'Arachidi', icon: '/icons/arachidi.png' },
    { id: 6, name: 'Soia', short: 'Soia', icon: '/icons/soia.png' },
    { id: 7, name: 'Latte', short: 'Latte', icon: '/icons/latte.png' },
    { id: 8, name: 'Frutta a guscio', short: 'Frutta a guscio', icon: '/icons/frutta.png' },
    { id: 9, name: 'Sedano', short: 'Sedano', icon: '/icons/sedano.png' },
    { id: 10, name: 'Senape', short: 'Senape', icon: '/icons/senape.png' },
    { id: 11, name: 'Semi di sesamo', short: 'Sesamo', icon: '/icons/sesamo.png' },
    { id: 12, name: 'Anidride solforosa e solfiti', short: 'Solfiti', icon: '/icons/anidride.png' },
    { id: 13, name: 'Lupini', short: 'Lupini', icon: '/icons/lupino.png' },
    { id: 14, name: 'Molluschi', short: 'Molluschi', icon: '/icons/molluschi.png' },
];

export type AllergenInfo = typeof allergens[number];

export const allergenById: Map<number, AllergenInfo> = new Map(allergens.map(a => [a.id, a]));

/** Tiene solo id allergene validi (1..14), senza duplicati e ordinati. Scarta anche gli id negativi legacy. */
export const normalizeAllergenIds = (ids?: number[] | null): number[] =>
    Array.from(new Set((ids ?? []).map(Number).filter(id => Number.isInteger(id) && id >= 1 && id <= 14)))
        .sort((a, b) => a - b);

export interface ProductAllergenSummary {
    /** Dichiarati direttamente sul prodotto */
    declared: number[]
    /** Derivati dagli ingredienti del prodotto */
    fromIngredients: number[]
    /** Effettivi: prodotto ∪ ingredienti */
    effective: number[]
    /** "Può contenere tracce di", esclusi quelli già contenuti */
    traces: number[]
    /** Almeno un ingrediente è surgelato/congelato all'origine */
    frozen: boolean
}

/**
 * Allergeni di un prodotto secondo il Reg. UE 1169/2011:
 * effettivi = allergeni dichiarati sul prodotto ∪ allergeni dei suoi ingredienti; tracce a parte.
 */
export const getProductAllergens = (
    product: { allergens?: number[]; traces?: number[]; ingredients?: number[] } | null | undefined,
    ingredientsMap: Map<number, { allergens?: number[]; frozen?: boolean }>
): ProductAllergenSummary => {
    if (!product) return { declared: [], fromIngredients: [], effective: [], traces: [], frozen: false };
    const ingredients = (product.ingredients ?? []).map(id => ingredientsMap.get(Number(id))).filter(Boolean) as { allergens?: number[]; frozen?: boolean }[];
    const declared = normalizeAllergenIds(product.allergens);
    const fromIngredients = normalizeAllergenIds(ingredients.flatMap(i => i.allergens ?? []));
    const effective = normalizeAllergenIds([...declared, ...fromIngredients]);
    const traces = normalizeAllergenIds(product.traces).filter(id => !effective.includes(id));
    const frozen = ingredients.some(i => !!i.frozen);
    return { declared, fromIngredients, effective, traces, frozen };
};

export const setCookie = (name: string, value: any, days: number): void => {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    const secure = window.location.protocol === "https:" ? "; Secure" : "";
    document.cookie = name + "=" + (value || "")  + expires + "; path=/; SameSite=Strict" + secure;
}

// Funzione per recuperare il valore di un cookie dato il suo nome
export const getCookie = (name: string): string | null => {
    let nameEQ = name + "=";
    let cookies = document.cookie.split(';');
    for(let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        while (cookie.charAt(0) === ' ') {
            cookie = cookie.substring(1, cookie.length);
        }
        if (cookie.indexOf(nameEQ) === 0) {
            return cookie.substring(nameEQ.length, cookie.length);
        }
    }
    return null;
}

// Funzione per eliminare un cookie dato il suo nome
export const deleteCookie = (name: string): void => {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/;';
}

// Escape dei valori interpolati in HTML (evita XSS con document.write)
export const escapeHtml = (value: unknown): string => {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export const print = (order: Orders): void => {
    if (!order) return;

    // Genera i dettagli degli ordini
    const orderDetails = order.items.map((item) => {
        const ingPlus = item.additionalIngredients.length
            ? `<div>+ ${escapeHtml(item.additionalIngredients.join(", "))}</div>`
            : "";
        const ingMinus = item.removedIngredients.length
            ? `<div>- ${escapeHtml(item.removedIngredients.join(", "))}</div>`
            : "";
        const notes = item.notes ? `<div>Note: ${escapeHtml(item.notes)}</div>` : "";

        return `
            <div style="border-bottom: 1px dashed #000; padding: 5px;">
                <div style="font-weight: bold;">${escapeHtml(item.productName)}</div>
                ${ingMinus}
                ${ingPlus}
                ${notes}
                <div>Prezzo: €${escapeHtml(item.total.toFixed(2))}</div>
            </div>
        `;
    }).join("");

    // Struttura del contenuto per la stampa
    const printContent = `
        <div style="text-align: center; font-family: Arial, sans-serif; padding: 10px;">
            <h2>Ordine Tavolo: ${escapeHtml(order.tableName)}</h2>
            <div>${orderDetails}</div>
        </div>
    `;

    // Apri una nuova finestra e stampa
    const printWindow = window.open("", "", "height=500,width=500");
    if (printWindow) {
        printWindow.document.write("<html><head><title>Stampa Ordine</title></head><body>");
        printWindow.document.write(printContent);
        printWindow.document.write("</body></html>");
        printWindow.document.close();
        printWindow.print();
    }
};

// carrello
// Identità della riga (prodotto, formato, varianti, extra, rimozioni, nota): vedi cartLineKey in variants.ts
const generateCartKey = (productCart: CartLine): string => cartLineKey(productCart);

export const CART_UPDATED_EVENT = 'restaurantflow:cart-updated';

// Nome del cookie del carrello: "cart_tmp0" (cliente) o "cart_<nome>" (es. "cart_waiter").
// Unico punto di verità: prima alcune funzioni usavano "cart_cart_tmp0" come default e
// svuotavano/salvavano un cookie diverso da quello letto (badge del carrello che restava pieno).
const cartCookieName = (cartName?: string): string =>
    cartName ? (cartName.startsWith("cart") ? "" : "cart_") + cartName : "cart_tmp0";

export const addProductToCart = (productCart: CartLine, cartName?: string) => {
    const nameCart = cartCookieName(cartName);
    const cartMap = getCartMap(nameCart);

    const key = generateCartKey(productCart);

    if (cartMap[key]) {
        cartMap[key].quantity += productCart.quantity;
    } else {
        cartMap[key] = { ...productCart };
    }
    setCookie(nameCart, JSON.stringify(cartMap), 1);
    window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
    return true;
};

export const getCartMap = (cartName?: string): { [key: string]: CartLine } => {
    const nameCart = cartCookieName(cartName);
    const cookie = getCookie(nameCart) || "{}";

    try {
        const parsed = JSON.parse(cookie);
        if (typeof parsed === 'object' && parsed !== null) {
            // saveCart salvava un array: lo riporto a mappa con le chiavi di riga (altrimenti
            // le aggiunte successive, fatte per chiave su un array, andavano perse in JSON)
            const lines: CartLine[] = Array.isArray(parsed) ? parsed : Object.values(parsed);
            const map: { [key: string]: CartLine } = {};
            lines.filter(l => l && typeof l.id === 'number').forEach(l => {
                const key = generateCartKey(l);
                if (map[key]) map[key].quantity += l.quantity;
                else map[key] = l;
            });
            return map;
        }
    } catch (e) {
        console.error("Errore nel parsing del carrello:", e);
    }

    return {};
};

export const removeProductFromCart = (productCart: CartLine, cartName?: string): boolean => {
    const nameCart = cartCookieName(cartName);
    const cartMap = getCartMap(nameCart);
    const key = generateCartKey(productCart);

    if (cartMap[key]) {
        delete cartMap[key];
        setCookie(nameCart, JSON.stringify(cartMap), 1);
        return true;
    }

    return false;
};

export const updateProductQuantity = (productCart: CartLine, delta: number, cartName?: string) => {
    const nameCart = cartCookieName(cartName);
    const cartMap = getCartMap(nameCart);
    const key = generateCartKey(productCart);

    if (cartMap[key]) {
        cartMap[key].quantity += delta;

        if (cartMap[key].quantity <= 0) {
            delete cartMap[key];
        }

            setCookie(nameCart, JSON.stringify(cartMap), 1);
        return true;
    }

    return false;
};

export const emptyCart = (cartName?: string) => {
    deleteCookie(cartCookieName(cartName));
    window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
};

export const convertCartToAddComandWaiterOrder = (products: CartLine[]): AddComandWaiter => {
    let productsToOrder: AddProductToOrder[] = []

    products.forEach((prod, index) => {
        productsToOrder.push({
            idProduct: prod.id,
            productOption: prod.optionName,
            note: prod.note,
            quantity: prod.quantity,
            ingredientsMinus: prod.ingredientsMinus,
            ingredientsPlus: prod.ingredientsPlus,
            variants: lineVariantsPayload(prod)
        })
    })

    return {orders: [{products: productsToOrder}], comandWaiterType: "HOME"}
}

export function saveCart(productCard: CartLine[], name: string | undefined){
    try {
        const nameCart = cartCookieName(name);
        if(productCard.length === 0){
            deleteCookie(nameCart)
        }else {
            // Sempre come mappa chiave-di-riga → riga (lo stesso formato di addProductToCart)
            const map: { [key: string]: CartLine } = {};
            productCard.forEach(l => {
                const key = generateCartKey(l);
                if (map[key]) map[key] = { ...map[key], quantity: map[key].quantity + l.quantity };
                else map[key] = l;
            });
            setCookie(nameCart, JSON.stringify(map), 1);
        }
        window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
        return true;
    }catch (except){
        return false
    }
}

// ── Group Order / Table Session ─────────────────────────────────────────────
const TABLE_SESSION_KEY = "rf_table_session";
const CLIENT_SESSION_KEY = "rf_client_session";
const TABLE_SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

interface StoredTableSession {
    sessionId: string;
    tableId: number;
    localname: string;
    joinedAt: number;
}

const generateUuid = (): string => {
    const cryptoObj: Crypto | undefined = typeof window !== "undefined" ? window.crypto : undefined;
    if (cryptoObj && typeof cryptoObj.randomUUID === "function") {
        return cryptoObj.randomUUID();
    }
    // Fallback RFC4122-ish v4
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};

export const getOrCreateClientSessionId = (): string => {
    try {
        const existing = localStorage.getItem(CLIENT_SESSION_KEY);
        if (existing && existing.trim().length > 0) return existing;
        const fresh = generateUuid();
        localStorage.setItem(CLIENT_SESSION_KEY, fresh);
        return fresh;
    } catch {
        return generateUuid();
    }
};

export const saveTableSession = (sessionId: string, tableId: number, localname: string): void => {
    try {
        const payload: StoredTableSession = { sessionId, tableId, localname, joinedAt: Date.now() };
        localStorage.setItem(TABLE_SESSION_KEY, JSON.stringify(payload));
    } catch {
        /* noop */
    }
};

export const getTableSession = (): StoredTableSession | null => {
    try {
        const raw = localStorage.getItem(TABLE_SESSION_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as StoredTableSession;
        if (!parsed || typeof parsed.sessionId !== "string" || typeof parsed.joinedAt !== "number") return null;
        if (Date.now() - parsed.joinedAt > TABLE_SESSION_MAX_AGE_MS) {
            localStorage.removeItem(TABLE_SESSION_KEY);
            return null;
        }
        return parsed;
    } catch {
        return null;
    }
};

export const clearTableSession = (): void => {
    try {
        localStorage.removeItem(TABLE_SESSION_KEY);
    } catch {
        /* noop */
    }
};

export const cartToAddComandOrders = (cart: CartLine[]) => {
    return cart.map((item) => ({
        products: [{
            idProduct: item.id,
            productOption: item.optionName,
            note: item.note ?? '',
            quantity: item.quantity,
            ingredientsMinus: item.ingredientsMinus,
            ingredientsPlus: item.ingredientsPlus,
            variants: lineVariantsPayload(item),
        }],
    }));
};

/** Prezzo unitario di una riga di comanda (€): snapshot del server, altrimenti opzione + varianti + extra salvati. */
export const comandProductUnitPrice = (p: ComandProduct): number => {
    if (p.unitPriceCents != null) return p.unitPriceCents / 100;
    return (p.productOption?.price ?? 0)
        + (p.selectedVariants ?? []).reduce((s, v) => s + (Number(v?.priceDelta) || 0), 0)
        + (p.ingredientsPlus ?? []).reduce((s, i) => s + (i?.price ?? 0), 0);
};

/** Totale della comanda (€): totalCents del server se presente, altrimenti somma delle righe (extra inclusi). */
export const comandTotal = (c: Comand): number => {
    if (c.totalCents != null) return c.totalCents / 100;
    return (c.orders ?? []).reduce((acc, o) =>
        acc + (o.products ?? []).reduce((s, p) => s + comandProductUnitPrice(p) * p.quantity, 0), 0);
};

export function formatDateTime(isoString: string): string {
    const date = new Date(isoString);

    const options: Intl.DateTimeFormatOptions = {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    };

    return date.toLocaleString("it-IT", options);
}
