import React, { useEffect, useMemo, useState } from 'react';
import type { Slot } from '../../Utilities/api';
import { useDeliveryT } from '../../Client/delivery/deliveryI18n';

export type SlotDay = { date: string; label: string; slots: Slot[] };

type Props = {
    days: SlotDay[];
    /** "yyyy-MM-ddTHH:mm" oppure "" */
    value: string;
    onChange: (value: string) => void;
    mode: 'pickup' | 'delivery';
};

type Part = 'partMorning' | 'partLunch' | 'partAfternoon' | 'partEvening';

const partOf = (time: string): Part => {
    const h = parseInt(time.slice(0, 2), 10);
    if (h < 11) return 'partMorning';
    if (h < 15) return 'partLunch';
    if (h < 18) return 'partAfternoon';
    return 'partEvening';
};

/**
 * Scelta dell'orario per asporto e domicilio: giorni come schede, orari come pulsanti raggruppati
 * per momento della giornata. Al cliente non si mostra la capienza, solo gli orari prenotabili.
 */
const SlotPicker: React.FC<Props> = ({ days, value, onChange, mode }) => {
    const dt = useDeliveryT();
    const [selDate, selTime] = value ? value.split('T') : ['', ''];
    const [activeDate, setActiveDate] = useState(selDate || days[0]?.date || '');

    useEffect(() => {
        if (!days.some(d => d.date === activeDate)) setActiveDate(days[0]?.date ?? '');
    }, [days, activeDate]);

    const day = days.find(d => d.date === activeDate);
    const groups = useMemo(() => {
        const out: { part: Part; slots: Slot[] }[] = [];
        for (const s of day?.slots ?? []) {
            const part = partOf(s.time);
            const last = out[out.length - 1];
            if (last?.part === part) last.slots.push(s);
            else out.push({ part, slots: [s] });
        }
        return out;
    }, [day]);

    return (
        <div className="space-y-3" style={{ fontFamily: 'var(--menu-font-body)' }}>
            <p className="font-semibold" style={{ color: 'var(--menu-text)' }}>
                {dt(mode === 'pickup' ? 'pickupWhen' : 'deliveryWhen')}
            </p>

            {days.length > 1 && (
                <div role="tablist" className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                    {days.map(d => {
                        const active = d.date === activeDate;
                        return (
                            <button
                                key={d.date}
                                type="button"
                                role="tab"
                                aria-selected={active}
                                onClick={() => setActiveDate(d.date)}
                                className="menu-focus flex-shrink-0 capitalize"
                                style={{
                                    minHeight: 40,
                                    padding: '0 16px',
                                    borderRadius: 999,
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    border: `1px solid ${active ? 'var(--menu-accent)' : 'var(--menu-border)'}`,
                                    background: active ? 'var(--menu-accent)' : 'transparent',
                                    color: active ? 'var(--menu-accent-text)' : 'var(--menu-text)',
                                }}
                            >
                                {d.label}
                            </button>
                        );
                    })}
                </div>
            )}

            {groups.map(g => (
                <div key={g.part}>
                    <p className="text-xs uppercase mb-2" style={{ color: 'var(--menu-muted)', letterSpacing: '0.08em' }}>
                        {dt(g.part)}
                    </p>
                    <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(76px, 1fr))' }}>
                        {g.slots.map(s => {
                            const v = `${activeDate}T${s.time}`;
                            const active = v === value;
                            const onRequest = s.status === 'ON_REQUEST';
                            return (
                                <button
                                    key={v}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => onChange(active ? '' : v)}
                                    className="menu-focus flex flex-col items-center justify-center"
                                    style={{
                                        minHeight: 48,
                                        borderRadius: 'var(--menu-radius)',
                                        border: `1px ${onRequest && !active ? 'dashed' : 'solid'} ${active ? 'var(--menu-accent)' : 'var(--menu-border)'}`,
                                        background: active ? 'var(--menu-accent)' : 'var(--menu-input-bg)',
                                        color: active ? 'var(--menu-accent-text)' : 'var(--menu-text)',
                                        fontVariantNumeric: 'tabular-nums',
                                        transition: 'background .15s, border-color .15s',
                                    }}
                                >
                                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{s.time}</span>
                                    {onRequest && (
                                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>{dt('onRequestShort')}</span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ))}

            {selTime && selDate === activeDate && (
                <p className="text-sm" style={{ color: 'var(--menu-accent)', fontWeight: 600 }}>
                    {dt(mode === 'pickup' ? 'pickupPicked' : 'deliveryPicked', { time: selTime })}
                </p>
            )}
        </div>
    );
};

export default SlotPicker;
