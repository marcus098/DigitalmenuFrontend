import React from 'react';
import {Bike, Clock, CreditCard, MapPin, Phone, Banknote, CheckCircle2, ExternalLink} from 'lucide-react';
import {ComandDelivery} from '../../../deliveryTypes';
import {deliveryTimeLabel, formatEurCents, formatKm, mapsLinks, paymentLabelFor, STAGE_META, telHref} from './deliveryUtils';

/** Badge "Domicilio" (riconoscibile a colpo d'occhio tra tavoli e asporto). */
export const DeliveryBadge: React.FC<{ className?: string }> = ({className = ''}) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-violet-600 text-white shrink-0 ${className}`}>
        <Bike className="w-3.5 h-3.5"/> Domicilio
    </span>
);

export const DeliveryStageChip: React.FC<{ stage?: ComandDelivery['stage'] }> = ({stage}) => {
    const meta = STAGE_META[stage || 'PREPARING'] ?? STAGE_META.PREPARING
    return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold ${meta.chip}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`}/>{meta.label}
        </span>
    )
}

export const PaymentChip: React.FC<{ delivery: ComandDelivery, paid?: boolean, totalCents: number, large?: boolean }> = ({delivery, paid, totalCents, large}) => {
    const p = paymentLabelFor(delivery, paid, totalCents)
    const Icon = p.toCollect ? (delivery.paymentChoice === 'CARD' ? CreditCard : Banknote) : CheckCircle2
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full font-bold ${large ? 'px-3 py-1 text-sm' : 'px-2 py-0.5 text-xs'} ${
            p.toCollect ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-300' : 'bg-emerald-100 text-emerald-800'
        }`}>
            <Icon className={large ? 'w-4 h-4' : 'w-3.5 h-3.5'}/>{p.text}
        </span>
    )
}

interface DeliveryInfoProps {
    delivery: ComandDelivery
    phone?: string
    /** Orario di consegna richiesto */
    time?: string
    name?: string
    /** Totale (prodotti + consegna) in centesimi */
    totalCents: number
    paid?: boolean
    /** Variante compatta per le card (meno righe) */
    compact?: boolean
}

/**
 * Blocco consegna per card ordine, dettaglio e cassa: indirizzo con "Apri in Maps", citofono/piano/note,
 * telefono, orario, distanza, tariffa, pagamento e fase della consegna.
 */
const DeliveryInfo: React.FC<DeliveryInfoProps> = ({delivery, phone, time, name, totalCents, paid, compact}) => {
    const links = mapsLinks(delivery)
    const extra = [
        delivery.intercom ? `Citofono: ${delivery.intercom}` : '',
        delivery.floor ? `Piano: ${delivery.floor}` : '',
    ].filter(Boolean).join(' · ')
    const tel = telHref(phone)

    return (
        <div className="mt-2 rounded-xl border border-violet-200 bg-violet-50/60 p-3 text-sm space-y-1.5" data-testid="delivery-info">
            <div className="flex items-center justify-between gap-2 flex-wrap">
                <DeliveryStageChip stage={delivery.stage}/>
                {time && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-violet-900">
                        <Clock className="w-3.5 h-3.5"/> Consegna {deliveryTimeLabel(time)}
                    </span>
                )}
            </div>
            {name && !compact && <p className="font-semibold text-gray-800">{name}</p>}
            <div className="flex items-start gap-1.5">
                <MapPin className="w-4 h-4 text-violet-600 mt-0.5 shrink-0"/>
                <div className="min-w-0">
                    <p className="font-semibold text-gray-800 leading-snug break-words">{delivery.label}</p>
                    {extra && <p className="text-xs text-gray-600">{extra}</p>}
                    <a href={links.view} target="_blank" rel="noopener noreferrer"
                       onClick={e => e.stopPropagation()}
                       className="inline-flex items-center gap-1 text-xs font-semibold text-violet-700 hover:underline">
                        Apri in Maps <ExternalLink className="w-3 h-3"/>
                    </a>
                </div>
            </div>
            {delivery.notes && (
                <p className="text-xs italic text-gray-700 bg-white/70 rounded-lg px-2 py-1">Note: {delivery.notes}</p>
            )}
            {phone && (
                <a href={tel} onClick={e => e.stopPropagation()}
                   className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-800 hover:text-violet-700">
                    <Phone className="w-4 h-4 text-violet-600"/> {phone}
                </a>
            )}
            <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-violet-100">
                <span className="text-xs text-gray-600">
                    {formatKm(delivery.distanceKm)}{delivery.distanceKm != null ? ' · ' : ''}
                    Consegna {delivery.feeCents > 0 ? formatEurCents(delivery.feeCents) : 'gratis'}
                </span>
                <PaymentChip delivery={delivery} paid={paid} totalCents={totalCents}/>
            </div>
        </div>
    )
}

export default DeliveryInfo;
