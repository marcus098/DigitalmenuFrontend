/**
 * Helper della consegna a domicilio lato dashboard/rider (contratto: docs/DOMICILIO.md nel backend).
 * La comanda porta lo snapshot `delivery` e `orderType: "DELIVERY"`: qui si leggono senza toccare ComandType.
 */
import {Comand} from '../../../ComandType';
import {ComandDelivery, DeliveryPaymentChoice, DeliveryStage} from '../../../deliveryTypes';
import {lineUnitPrice} from '../variantUtils';

/** Campi extra che il server aggiunge alla comanda di una consegna. */
export type DeliveryComand = Comand & {
    orderType?: string
    delivery?: ComandDelivery | null
    deliveryFeeCents?: number
    subtotalCents?: number
}

export const getDelivery = (c: Comand | null | undefined): ComandDelivery | undefined => {
    const d = (c as DeliveryComand | null | undefined)?.delivery
    return d && typeof d === 'object' ? d : undefined
}

export const isDeliveryComand = (c: Comand | null | undefined): boolean =>
    !!c && ((c as DeliveryComand).orderType === 'DELIVERY' || !!getDelivery(c))

export const formatEurCents = (cents: number) =>
    new Intl.NumberFormat('it-IT', {style: 'currency', currency: 'EUR'}).format((cents || 0) / 100)

export const formatKm = (km?: number | null) =>
    km == null || !Number.isFinite(km) ? '' : `${km.toLocaleString('it-IT', {maximumFractionDigits: 1, minimumFractionDigits: km < 10 ? 1 : 0})} km`

/** Tariffa di consegna in centesimi (snapshot, poi campo della comanda). */
export const deliveryFeeCents = (c: Comand): number =>
    getDelivery(c)?.feeCents ?? (c as DeliveryComand).deliveryFeeCents ?? 0

/** Subtotale prodotti in centesimi (dal server se presente, altrimenti ricalcolato). */
export const productsSubtotalCents = (c: Comand): number => {
    const s = (c as DeliveryComand).subtotalCents
    if (typeof s === 'number') return s
    return Math.round((c.orders || []).reduce((acc, o) =>
        acc + (o.products || []).reduce((ps, p) => ps + lineUnitPrice(p) * p.quantity, 0), 0) * 100)
}

/** Totale da incassare/pagato: prodotti + consegna. */
export const deliveryTotalCents = (c: Comand): number =>
    typeof c.totalCents === 'number' && c.totalCents > 0 ? c.totalCents : productsSubtotalCents(c) + deliveryFeeCents(c)

export const STAGE_META: Record<DeliveryStage, { label: string, short: string, chip: string, dot: string }> = {
    PREPARING:        {label: 'In preparazione', short: 'Da preparare', chip: 'bg-amber-100 text-amber-800',   dot: 'bg-amber-500'},
    OUT_FOR_DELIVERY: {label: 'In consegna',     short: 'In consegna',  chip: 'bg-sky-100 text-sky-800',       dot: 'bg-sky-500'},
    DELIVERED:        {label: 'Consegnato',      short: 'Consegnate',   chip: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500'},
}

export const PAYMENT_METHOD_LABEL: Record<Exclude<DeliveryPaymentChoice, 'ONLINE'>, string> = {
    CASH: 'contanti',
    CARD: 'POS',
}

/** "Pagato online" oppure "Da incassare € 23,50 contanti". */
export const paymentLabelFor = (d: ComandDelivery | undefined, paid: boolean | undefined, totalCents: number): { text: string, toCollect: boolean, collected: boolean } => {
    if (!d || d.paymentChoice === 'ONLINE' || paid) {
        return {text: 'Pagato online', toCollect: false, collected: false}
    }
    const amount = formatEurCents(totalCents)
    const method = PAYMENT_METHOD_LABEL[d.paymentChoice] ?? ''
    if (d.cashCollected) return {text: `Incassato ${amount} ${method}`.trim(), toCollect: false, collected: true}
    return {text: `Da incassare ${amount} ${method}`.trim(), toCollect: true, collected: false}
}

export const paymentLabel = (c: Comand) => paymentLabelFor(getDelivery(c), c.paid, deliveryTotalCents(c))

/** Orario di consegna "HH:mm" (accetta ISO "2026-11-20T20:15" o solo "20:15"). */
export const deliveryTimeLabel = (time?: string): string => {
    if (!time) return ''
    const m = time.match(/(\d{2}):(\d{2})/)
    return m ? `${m[1]}:${m[2]}` : time
}

/** Data/ora di consegna in ms (per ordinare), Infinity se mancante. */
export const deliveryTimeValue = (c: Comand): number => {
    const t = c.time
    if (!t) return Number.POSITIVE_INFINITY
    const full = /^\d{4}-\d{2}-\d{2}T/.test(t) ? t : `${new Date().toISOString().slice(0, 10)}T${t}`
    const v = new Date(full).getTime()
    return Number.isNaN(v) ? Number.POSITIVE_INFINITY : v
}

export const mapsLinks = (d: { lat?: number, lng?: number, label?: string }) => {
    const hasCoords = Number.isFinite(d.lat) && Number.isFinite(d.lng)
    const q = hasCoords ? `${d.lat},${d.lng}` : (d.label || '')
    return {
        /** Apre Google Maps (app o web) con il percorso fino al punto. */
        google: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}&travelmode=driving`,
        /** Apple Maps: su iPhone apre l'app nativa. */
        apple: hasCoords
            ? `https://maps.apple.com/?daddr=${d.lat},${d.lng}&dirflg=d`
            : `https://maps.apple.com/?daddr=${encodeURIComponent(q)}&dirflg=d`,
        /** Solo visualizzazione del punto (dashboard). */
        view: hasCoords
            ? `https://www.google.com/maps/search/?api=1&query=${d.lat},${d.lng}`
            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`,
    }
}

export const isAppleDevice = () =>
    typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent) && 'ontouchend' in document

export const telHref = (phone?: string) => phone ? `tel:${phone.replace(/[^\d+]/g, '')}` : undefined
