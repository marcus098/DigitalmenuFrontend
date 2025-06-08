import {AddComandWaiter, AddProductToOrder, ProductCard, ProductToOrder} from "../types";
import {Orders} from "../Dashboard/Pages/OrderPage";

export const MOBILE_WIDTH = 350

export const allergens = [
    { id: 1, name: 'Glutine', icon: '/icons/glutine.png' },
    { id: 2, name: 'Latte', icon: '/icons/latte.png' },
    { id: 3, name: 'Crostacei', icon: '/icons/crostacei.png' },
    { id: 4, name: 'Pesce', icon: '/icons/pesce.png' },
    { id: 5, name: 'Arachidi', icon: '/icons/arachidi.png' },
    { id: 6, name: 'Soia', icon: '/icons/soia.png' },
    { id: 7, name: 'Fruttia a guscio', icon: '/icons/frutta.png' },
    { id: 8, name: 'Sedano', icon: '/icons/sedano.png' },
    { id: 9, name: 'Senape', icon: '/icons/senape.png' },
    { id: 10, name: 'Semi di sesamo', icon: '/icons/sesamo.png' },
    { id: 11, name: 'Anidride solforosa', icon: '/icons/anidride.png' },
    { id: 12, name: 'Lupino', icon: '/icons/lupino.png' },
    { id: 13, name: 'Molluschi', icon: '/icons/molluschi.png' },
    { id: 14, name: 'Uova', icon: '/icons/uova.png' },
];

export const setCookie = (name: string, value: any, days: number): void => {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
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

export const print = (order: Orders): void => {
    if (!order) return;

    // Genera i dettagli degli ordini
    const orderDetails = order.items.map((item) => {
        const ingPlus = item.additionalIngredients.length
            ? `<div>+ ${item.additionalIngredients.join(", ")}</div>`
            : "";
        const ingMinus = item.removedIngredients.length
            ? `<div>- ${item.removedIngredients.join(", ")}</div>`
            : "";
        const notes = item.notes ? `<div>Note: ${item.notes}</div>` : "";

        return `
            <div style="border-bottom: 1px dashed #000; padding: 5px;">
                <div style="font-weight: bold;">${item.productName}</div>
                ${ingMinus}
                ${ingPlus}
                ${notes}
                <div>Prezzo: €${item.total.toFixed(2)}</div>
            </div>
        `;
    }).join("");

    // Struttura del contenuto per la stampa
    const printContent = `
        <div style="text-align: center; font-family: Arial, sans-serif; padding: 10px;">
            <h2>Ordine Tavolo: ${order.tableName}</h2>
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
const generateCartKey = (productCart: ProductCard): string => {
    const plus = productCart.ingredientsPlus.sort((a, b) => a - b).join(",");
    const minus = productCart.ingredientsMinus.sort((a, b) => a - b).join(",");
    return `id=${productCart.id}|opt=${productCart.optionName}|plus=${plus}|minus=${minus}`;
};

export const addProductToCart = (productCart: ProductCard, cartName?: string) => {
    const nameCart = "cart_" + (cartName ?? "tmp0");
    const cartMap = getCartMap(nameCart);

    const key = generateCartKey(productCart);

    if (cartMap[key]) {
        cartMap[key].quantity += productCart.quantity;
    } else {
        cartMap[key] = { ...productCart };
    }

    setCookie(nameCart, JSON.stringify(cartMap), 1);
    return true;
};

export const getCartMap = (cartName?: string): { [key: string]: ProductCard } => {
    const nameCart = cartName ? (cartName.startsWith("cart") ? "" : "cart_") + cartName : "cart_tmp0";
    const cookie = getCookie(nameCart) || "{}";

    try {
        const parsed = JSON.parse(cookie);
        if (typeof parsed === 'object' && parsed !== null) {
            return parsed;
        }
    } catch (e) {
        console.error("Errore nel parsing del carrello:", e);
    }

    return {};
};

export const removeProductFromCart = (productCart: ProductCard, cartName?: string): boolean => {
    const nameCart = "cart_" + (cartName ?? "cart_tmp0");
    const cartMap = getCartMap(nameCart);
    const key = generateCartKey(productCart);

    if (cartMap[key]) {
        delete cartMap[key];
        setCookie(nameCart, JSON.stringify(cartMap), 1);
        return true;
    }

    return false;
};

export const updateProductQuantity = (productCart: ProductCard, delta: number, cartName?: string) => {
    const nameCart = "cart_" + (cartName ?? "cart_tmp0");
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
    const nameCart = "cart_" + (cartName ?? "cart_tmp0");
    deleteCookie(nameCart);
};

export const convertCartToAddComandWaiterOrder = (products: ProductCard[]): AddComandWaiter => {
    let productsToOrder: AddProductToOrder[] = []

    products.forEach((prod, index) => {
        productsToOrder.push({
            idProduct: prod.id,
            productOption: prod.optionName,
            note: prod.note,
            quantity: prod.quantity,
            ingredientsMinus: prod.ingredientsMinus,
            ingredientsPlus: prod.ingredientsPlus
        })
    })

    return {orders: [{products: productsToOrder}], comandWaiterType: "HOME"}
}

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
