import React from 'react';
import { Bike, Check, ChefHat, Clock, CreditCard, Home, MapPin, Banknote, Wallet } from 'lucide-react';
import type { ComandDelivery, DeliveryStage } from '../../deliveryTypes';
import { formatCents, useDeliveryT } from '../../Client/delivery/deliveryI18n';

interface Props {
    delivery: ComandDelivery;
    /** stato comanda (AWAIT/PENDING = ricevuto, PROGRESS/COMPLETED = in cucina o pronto) */
    status: string;
    paid: boolean;
    totalCents: number;
    /** "2026-11-20T20:15" o "20:15" */
    deliveryTime?: string | null;
}

const ORDER: DeliveryStage[] = ['PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];

/**
 * Avanzamento della consegna per il cliente: Ricevuto → In preparazione → In consegna → Consegnato.
 * Lo stage è un campo separato della comanda (aggiornato dal rider, arriva via SSE + GET pubblica).
 */
const DeliveryOrderStatus: React.FC<Props> = ({ delivery, status, paid, totalCents, deliveryTime }) => {
    const dt = useDeliveryT();
    const stage = delivery.stage ?? 'PREPARING';
    const received = status === 'AWAIT' || status === 'PENDING';
    // indice 0 = ricevuto, 1 = preparazione, 2 = in consegna, 3 = consegnato
    const current = stage === 'PREPARING' ? (received ? 0 : 1) : 1 + ORDER.indexOf(stage);

    const steps = [
        { title: dt('stageReceived'), sub: dt('stageReceivedSub'), Icon: Clock },
        { title: dt('stagePreparing'), sub: dt('stagePreparingSub'), Icon: ChefHat },
        { title: dt('stageOut'), sub: dt('stageOutSub'), Icon: Bike },
        { title: dt('stageDelivered'), sub: dt('stageDeliveredSub'), Icon: Home },
    ];

    const time = deliveryTime ? (deliveryTime.includes('T') ? deliveryTime.split('T')[1].slice(0, 5) : deliveryTime.slice(0, 5)) : null;
    const choice = delivery.paymentChoice;
    const PayIcon = paid || choice === 'ONLINE' ? CreditCard : choice === 'CASH' ? Banknote : Wallet;
    const collected = !paid && delivery.cashCollected === true;
    const payText = paid
        ? dt('paidOnline')
        : collected
            ? dt('paidOnDelivery')
        : choice === 'CASH'
            ? dt('toPayCash', { amount: formatCents(totalCents) })
            : choice === 'CARD'
                ? dt('toPayCard', { amount: formatCents(totalCents) })
                : null;

    const card: React.CSSProperties = { background: 'var(--menu-surface)', border: '1px solid var(--menu-border)', borderRadius: 'var(--menu-radius)' };
    const muted: React.CSSProperties = { color: 'var(--menu-muted)', fontSize: '0.85rem' };

    return (
        <div>
            <ol className="flex flex-col" aria-label={dt('channelDelivery')}>
                {steps.map((s, i) => {
                    const active = i <= current;
                    const isCurrent = i === current;
                    const Icon = i < current ? Check : s.Icon;
                    return (
                        <li key={i} className="flex items-start gap-4" aria-current={isCurrent ? 'step' : undefined}>
                            <div className="flex flex-col items-center">
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isCurrent && i < 3 ? 'ring-4' : ''}`}
                                    style={{
                                        ...(active ? { background: 'var(--menu-accent)', color: 'var(--menu-accent-text)' } : { background: 'var(--menu-surface)', color: 'var(--menu-muted)' }),
                                        ['--tw-ring-color' as any]: 'color-mix(in srgb, var(--menu-accent) 25%, transparent)',
                                    }}
                                >
                                    <Icon className="w-5 h-5" aria-hidden="true" />
                                </div>
                                {i < steps.length - 1 && (
                                    <div className="w-0.5 h-12 mt-1 mb-1 transition-colors" style={{ background: i < current ? 'var(--menu-accent)' : 'var(--menu-border)' }} />
                                )}
                            </div>
                            <div className="pt-1.5">
                                <h3 className="font-bold text-lg" style={{ color: active ? 'var(--menu-text)' : 'var(--menu-muted)' }}>{s.title}</h3>
                                {(isCurrent || i === 3 && current === 3) && <p className="text-sm" style={{ color: 'var(--menu-muted)' }}>{s.sub}</p>}
                            </div>
                        </li>
                    );
                })}
            </ol>
            <p className="sr-only" aria-live="polite">{steps[Math.max(0, current)].title}</p>

            <div className="mt-6 p-4 space-y-3" style={card}>
                {time && stage !== 'DELIVERED' && (
                    <p className="flex items-center gap-2 font-semibold" style={{ color: 'var(--menu-text)' }}>
                        <Clock className="w-4 h-4 flex-shrink-0" aria-hidden="true" style={{ color: 'var(--menu-accent)' }} />
                        {dt('expectedAt', { time })}
                    </p>
                )}
                {delivery.label && <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" aria-hidden="true" style={{ color: 'var(--menu-accent)' }} />
                    <div>
                        <p className="font-semibold" style={{ color: 'var(--menu-text)' }}>{delivery.label}</p>
                        {(delivery.intercom || delivery.floor) && (
                            <p style={muted}>
                                {[delivery.intercom && `${dt('intercom')}: ${delivery.intercom}`, delivery.floor && `${dt('floor')}: ${delivery.floor}`].filter(Boolean).join(' · ')}
                            </p>
                        )}
                        {delivery.notes && <p style={muted}>{delivery.notes}</p>}
                    </div>
                </div>}
                {payText && (
                    <p className={`flex items-center gap-2 font-semibold ${paid || collected ? 'text-green-700' : ''}`} style={paid || collected ? undefined : { color: 'var(--menu-text)' }}>
                        <PayIcon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                        {payText}
                    </p>
                )}
            </div>
        </div>
    );
};

export default DeliveryOrderStatus;
