import React from 'react';
import { ShoppingBag, Bike } from 'lucide-react';
import type { DeliverySettings } from '../../deliveryTypes';
import { useDeliveryT, formatCents } from '../../Client/delivery/deliveryI18n';
import { deliveryTeaser, OrderChannel } from '../../Client/delivery/deliveryUtils';

interface Props {
    settings: DeliverySettings;
    value: OrderChannel;
    onChange: (c: OrderChannel) => void;
    className?: string;
}

/**
 * Scelta "Asporto / Consegna a domicilio" (solo senza tavolo e con consegna attiva).
 * Radio group accessibile con i token del tema del menu: eredita colori, raggi e font del template.
 */
const OrderChannelPicker: React.FC<Props> = ({ settings, value, onChange, className = '' }) => {
    const dt = useDeliveryT();
    const teaser = deliveryTeaser(settings);

    const options: { id: OrderChannel; title: string; sub: string; Icon: React.ElementType }[] = [
        { id: 'TAKEAWAY', title: dt('channelTakeaway'), sub: dt('channelTakeawaySub'), Icon: ShoppingBag },
        { id: 'DELIVERY', title: dt('channelDelivery'), sub: dt('channelDeliverySub'), Icon: Bike },
    ];

    const onKey = (e: React.KeyboardEvent) => {
        if (['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(e.key)) {
            e.preventDefault();
            const next: OrderChannel = value === 'TAKEAWAY' ? 'DELIVERY' : 'TAKEAWAY';
            onChange(next);
            (e.currentTarget.querySelector(`[data-channel="${next}"]`) as HTMLElement | null)?.focus();
        }
    };

    return (
        <div className={className}>
            <p id="rf-channel-label" className="menu-label mb-2" style={{ color: 'var(--menu-emph)' }}>{dt('channelTitle')}</p>
            <div role="radiogroup" aria-labelledby="rf-channel-label" className="grid grid-cols-2 gap-2" onKeyDown={onKey}>
                {options.map(({ id, title, sub, Icon }) => {
                    const active = value === id;
                    return (
                        <button
                            key={id}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            tabIndex={active ? 0 : -1}
                            data-channel={id}
                            onClick={() => onChange(id)}
                            className="menu-focus text-left p-3 flex flex-col gap-1 transition-colors"
                            style={{
                                minHeight: 76,
                                borderRadius: 'var(--menu-radius)',
                                border: active ? '2px solid var(--menu-accent)' : '1px solid var(--menu-border)',
                                background: active ? 'var(--menu-surface)' : 'var(--menu-card)',
                                color: 'var(--menu-text)',
                                fontFamily: 'var(--menu-font-body)',
                                padding: active ? 11 : 12,
                            }}
                        >
                            <span className="flex items-center gap-2 font-semibold" style={{ fontSize: '0.95rem' }}>
                                <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" style={{ color: active ? 'var(--menu-accent)' : 'var(--menu-muted)' }} />
                                {title}
                            </span>
                            <span style={{ color: 'var(--menu-muted)', fontSize: '0.78rem', lineHeight: 1.3 }}>{sub}</span>
                        </button>
                    );
                })}
            </div>
            <p className="mt-2" style={{ color: 'var(--menu-muted)', fontSize: '0.78rem', fontFamily: 'var(--menu-font-body)' }}>
                {dt('deliveryInfo', { min: formatCents(teaser.minOrderCents), fee: teaser.feeCents === 0 ? dt('free').toLowerCase() : formatCents(teaser.feeCents) })}
                {teaser.freeOverCents != null && <> · {dt('freeOver', { amount: formatCents(teaser.freeOverCents) })}</>}
            </p>
        </div>
    );
};

export default OrderChannelPicker;
