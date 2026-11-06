import React from 'react';
import { useData } from '../../Context/DataContext';
import { dietaryTagLabel, useMenuT } from '../../Client/menuI18n';

/**
 * Gruppo a scelta singola (formato, impasto, mozzarella...) per il drawer del prodotto, cliente e cameriere.
 * Radio native dentro un fieldset: frecce da tastiera, lettore di schermo e focus funzionano da soli.
 * Solo variabili del tema (--menu-*), così segue tutti i template del menu.
 */

export interface PickerChoice {
    id: string
    name: string
    /** Testo a destra: "+2,00 €" per i supplementi, prezzo pieno per il formato */
    priceLabel?: string
    disabled?: boolean
    dietaryTags?: string[]
}

interface VariantPickerProps {
    /** Nome univoco del gruppo di radio */
    name: string
    legend: string
    choices: PickerChoice[]
    value: string | null
    onChange: (id: string) => void
}

const VariantPicker: React.FC<VariantPickerProps> = ({ name, legend, choices, value, onChange }) => {
    const t = useMenuT();
    const { menuLang } = useData();
    return (
        <fieldset>
            <legend className="font-semibold text-lg mb-3" style={{ color: 'var(--menu-text)' }}>{legend}</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {choices.map(c => {
                    const checked = value === c.id;
                    const inputId = `${name}-${c.id}`;
                    return (
                        <label
                            key={c.id}
                            htmlFor={inputId}
                            className="variant-choice flex items-center gap-3 px-3.5 py-3 transition-colors has-[:focus-visible]:ring-2 [--tw-ring-color:var(--menu-accent)]"
                            style={{
                                borderRadius: 'var(--menu-radius, 12px)',
                                border: `2px solid ${checked ? 'var(--menu-accent)' : 'var(--menu-border)'}`,
                                background: checked
                                    ? 'color-mix(in srgb, var(--menu-accent) 10%, var(--menu-card))'
                                    : 'var(--menu-card)',
                                cursor: c.disabled ? 'not-allowed' : 'pointer',
                                opacity: c.disabled ? 0.55 : 1,
                                minHeight: 48,
                            }}
                        >
                            <input
                                id={inputId}
                                type="radio"
                                name={name}
                                value={c.id}
                                checked={checked}
                                disabled={c.disabled}
                                onChange={() => onChange(c.id)}
                                className="sr-only"
                            />
                            <span
                                aria-hidden="true"
                                className="flex-shrink-0 rounded-full flex items-center justify-center"
                                style={{
                                    width: 20, height: 20,
                                    border: `2px solid ${checked ? 'var(--menu-accent)' : 'var(--menu-border)'}`,
                                    background: 'var(--menu-card)',
                                }}
                            >
                                {checked && <span className="rounded-full" style={{ width: 10, height: 10, background: 'var(--menu-accent)' }} />}
                            </span>
                            <span className="flex-1 min-w-0">
                                <span
                                    className="block font-semibold leading-snug"
                                    style={{ color: 'var(--menu-text)', textDecoration: c.disabled ? 'line-through' : undefined }}
                                >
                                    {c.name}
                                </span>
                                {(() => {
                                    // Etichette dietetiche, salvo quando ripetono il nome della scelta ("Senza lattosio")
                                    const labels = c.disabled ? [] : (c.dietaryTags ?? [])
                                        .map(tag => dietaryTagLabel(tag, menuLang))
                                        .filter(l => l.toLowerCase() !== c.name.trim().toLowerCase());
                                    return labels.length > 0 ? (
                                        <span className="block text-xs mt-0.5" style={{ color: 'var(--menu-accent)', fontWeight: 600 }}>
                                            {labels.join(' · ')}
                                        </span>
                                    ) : null;
                                })()}
                            </span>
                            {c.disabled ? (
                                <span
                                    className="text-xs font-bold uppercase tracking-wide flex-shrink-0"
                                    style={{
                                        color: 'color-mix(in srgb, #dc2626 75%, var(--menu-text))',
                                        border: '1px solid color-mix(in srgb, #dc2626 35%, transparent)',
                                        borderRadius: 999,
                                        padding: '2px 8px',
                                    }}
                                >
                                    {t('soldOut')}
                                </span>
                            ) : c.priceLabel ? (
                                <span className="text-sm font-semibold flex-shrink-0 tabular-nums" style={{ color: 'var(--menu-muted)' }}>
                                    {c.priceLabel}
                                </span>
                            ) : null}
                        </label>
                    );
                })}
            </div>
        </fieldset>
    );
};

export default VariantPicker;
