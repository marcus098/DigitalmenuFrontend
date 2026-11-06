import React from 'react';
import { BadgeCheck } from 'lucide-react';
import { useData } from '../../Context/DataContext';
import { formatSupplement, VariantLabel } from '../../Utilities/variants';

/**
 * Varianti scelte sotto una riga (carrello, storico, stato ordine): "Impasto: Classico" in testo,
 * quelle `highlight` (es. Senza glutine) come chip in evidenza, come sulla comanda stampata.
 */
const VariantSummary: React.FC<{ variants?: VariantLabel[] | null; showPrices?: boolean; className?: string }> = ({
    variants,
    showPrices = true,
    className = '',
}) => {
    const { menuLang } = useData();
    const list = (variants ?? []).filter(v => v && v.choiceName);
    if (list.length === 0) return null;
    const plain = list.filter(v => !v.highlight);
    const highlighted = list.filter(v => v.highlight);
    const price = (v: VariantLabel) => (showPrices && Number(v.priceDelta) ? ` (${formatSupplement(Number(v.priceDelta), menuLang)})` : '');
    return (
        <div className={`space-y-1 ${className}`} style={{ fontFamily: 'var(--menu-font-body)' }}>
            {plain.length > 0 && (
                <p className="text-xs" style={{ color: 'var(--menu-muted)' }}>
                    {plain.map((v, i) => (
                        <React.Fragment key={v.groupId}>
                            {i > 0 && ' · '}
                            {v.groupName}: <span style={{ color: 'var(--menu-text)' }}>{v.choiceName}{price(v)}</span>
                        </React.Fragment>
                    ))}
                </p>
            )}
            {highlighted.length > 0 && (
                <ul className="flex flex-wrap gap-1.5">
                    {highlighted.map(v => (
                        <li
                            key={v.groupId}
                            className="inline-flex items-center gap-1 text-xs font-bold whitespace-nowrap"
                            title={v.groupName}
                            style={{
                                color: 'var(--menu-accent)',
                                background: 'color-mix(in srgb, var(--menu-accent) 12%, transparent)',
                                border: '1px solid color-mix(in srgb, var(--menu-accent) 45%, transparent)',
                                borderRadius: 999,
                                padding: '2px 8px',
                            }}
                        >
                            <BadgeCheck aria-hidden="true" style={{ width: '1em', height: '1em' }} />
                            <span className="sr-only">{v.groupName}: </span>
                            {v.choiceName}{price(v)}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default VariantSummary;
