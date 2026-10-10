// types/ComandDashboard.ts

/** AWAIT_PAYMENT: in attesa del prepagamento (mai mostrata in dashboard). AWAIT_APPROVAL: asporto su richiesta da approvare. */
export type ComandStatus = 'PROGRESS' | 'COMPLETED' | 'DELETED' | 'AWAIT' | 'PENDING' | 'AWAIT_PAYMENT' | 'AWAIT_APPROVAL';

export interface Ingredient {
    id: number;
    name: string;
    price?: number;
}

export interface ProductOption {
    name: string;
    price: number;
    isDefault: boolean;
}

export interface Product {
    idProduct: number;
    productName: string;
    idCategory: number;
    categoryName: string;
    productOption: ProductOption;
    quantity: number;
    ingredientsMinus: Ingredient[];
    ingredientsPlus: Ingredient[];
    note: string;
}

export interface Order {
    id: string;
    userId: string;
    products: Product[];
    status: ComandStatus;
}

export interface Comand {
    id: string | null;
    createdAt: string;
    updatedAt: string;
    orders: Order[];
    status: ComandStatus;
    idTable?: number
    name?: string
    idWaiter?: number
    time?: string
    phone?: string
    address?: string
    comandWaiterType?: string
    type?: string
    /** Pagata online (Stripe o SumUp) */
    paid?: boolean
    paidAt?: string
    paymentIntentId?: string
    /** Ordine su richiesta (riserva slot): serve l'approvazione del locale */
    approvalRequired?: boolean
    /** Scadenza approvazione (AWAIT_APPROVAL), ISO */
    approvalDeadline?: string
    /** Motivo rifiuto/annullamento */
    rejectReason?: string
    /** Importo autorizzato (capture manuale) non ancora addebitato */
    paymentAuthorized?: boolean
    /** Autorizzazione annullata dopo il rifiuto: nessun addebito */
    authorizationCanceled?: boolean
    /** Rimborsato integralmente */
    refunded?: boolean
    /** Chiusura del conto in cassa (importo incassato e sconto) */
    checkout?: ComandCheckout
    /** Solo vista pubblica: totale calcolato dal server (centesimi) */
    totalCents?: number
}


/** Chiusura del conto in cassa: quanto è stato incassato davvero. */
export interface ComandCheckout {
    subtotalCents: number
    discountCents: number
    totalCents: number
    discountMode: 'PCT' | 'FINAL'
    discountPct?: number
    cardDiscountCents: number
    cardId?: number
    pointsUsed: number
    pointsEarned: number
    stampRedeemed: boolean
    loyaltyError: boolean
    paidOnline: boolean
    closedAt: string
    closedBy?: number
}

export interface CheckoutRequest {
    subtotalCents: number
    totalCents: number
    discountMode: 'PCT' | 'FINAL'
    discountPct?: number
    cardDiscountCents: number
    cardId?: number
    pointsToUse: number
    redeemStamps: boolean
    earn: boolean
}
