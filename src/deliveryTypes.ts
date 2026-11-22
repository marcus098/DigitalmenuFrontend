/**
 * Tipi della consegna a domicilio (contratto: docs/DOMICILIO.md nel backend).
 * Condivisi tra menu cliente, dashboard e vista rider.
 */

export type DeliveryPaymentMode = 'ONLINE_REQUIRED' | 'CUSTOMER_CHOICE' | 'ON_DELIVERY_ONLY';
export type OnDeliveryMethod = 'CASH' | 'CARD';
export type DeliveryPaymentChoice = 'ONLINE' | OnDeliveryMethod;
export type DeliveryStage = 'PREPARING' | 'OUT_FOR_DELIVERY' | 'DELIVERED';

export interface DeliveryZone {
    maxKm: number;
    feeCents: number;
    minOrderCents: number;
}

export interface DeliverySettings {
    enabled: boolean;
    originLat: number | null;
    originLng: number | null;
    originAddress: string | null;
    zones: DeliveryZone[];
    freeDeliveryOverCents: number | null;
    paymentMode: DeliveryPaymentMode;
    onDeliveryMethods: OnDeliveryMethod[];
    slotMinutes: number;
    deliveriesPerSlot: number;
    leadMinutes: number;
    requirePhoneOtpTakeaway: boolean;
    /**
     * Sola lettura: verifica SMS del telefono attiva sul server (chiave Prelude o dev-mode). false = ordini senza
     * codice (solo nome e telefono). undefined (backend precedente) = attiva.
     */
    phoneVerification?: boolean;
    /** Solo impostazioni del titolare: calcolo del percorso per i rider (predefinito spento). */
    routePlanning?: boolean;
}

export interface DeliveryAddress {
    label: string;
    lat: number;
    lng: number;
    intercom?: string;
    floor?: string;
    notes?: string;
}

export interface GeoResult {
    label: string;
    lat: number;
    lng: number;
    street?: string;
    houseNumber?: string;
    city?: string;
    postcode?: string;
}

/** Snapshot salvato nella comanda. */
export interface ComandDelivery extends DeliveryAddress {
    distanceKm: number;
    feeCents: number;
    paymentChoice: DeliveryPaymentChoice;
    stage: DeliveryStage;
    cashCollected?: boolean;
}

export interface DeliveryOrderResponse {
    id: string;
    status: string;
    paymentRequired: boolean;
    subtotalCents: number;
    deliveryFeeCents: number;
    totalCents: number;
}
