import React from 'react';
import { Comand } from '../../ComandType';
import { comandProductUnitPrice } from '../../Utilities/Utilities';
import VariantSummary from './VariantSummary';
import { useMenuT } from '../../Client/menuI18n';

/**
 * Righe di una comanda già inviata (stato ordine, tavolo live): nomi, formato e varianti sono lo
 * snapshot salvato dal server, i prezzi sono unitPriceCents (formato + varianti + extra).
 */
const ComandLines: React.FC<{ comand: Comand; compact?: boolean }> = ({ comand, compact }) => {
    const t = useMenuT();
    const products = (comand.orders ?? []).flatMap(o => o.products ?? []);
    if (products.length === 0) return null;
    return (
        <ul className={compact ? 'space-y-2' : 'space-y-3'} style={{ fontFamily: 'var(--menu-font-body)' }}>
            {products.map((p, i) => {
                const option = p.productOption?.name;
                const showOption = !!option && !['default', 'standard'].includes(option.toLowerCase());
                return (
                    <li
                        key={i}
                        className={compact ? 'pt-2' : 'p-3 rounded-lg'}
                        style={compact
                            ? { borderTop: i > 0 ? '1px solid var(--menu-border)' : undefined }
                            : { background: 'var(--menu-surface)', border: '1px solid var(--menu-border)' }}
                    >
                        <div className="flex justify-between items-start gap-3">
                            <p className="font-semibold" style={{ color: 'var(--menu-text)', fontSize: compact ? '0.85rem' : undefined }}>
                                {p.quantity}× {p.productName}
                            </p>
                            <p className="font-semibold tabular-nums flex-shrink-0" style={{ color: 'var(--menu-text)', fontSize: compact ? '0.85rem' : undefined }}>
                                €{(comandProductUnitPrice(p) * p.quantity).toFixed(2)}
                            </p>
                        </div>
                        {showOption && (
                            <p className="text-xs mt-0.5" style={{ color: 'var(--menu-muted)' }}>
                                {t('format')}: <span style={{ color: 'var(--menu-text)' }}>{option}</span>
                            </p>
                        )}
                        <VariantSummary variants={p.selectedVariants} className="mt-1" />
                        {(p.ingredientsMinus ?? []).length > 0 && (
                            <p className="text-xs mt-1" style={{ color: '#f87171' }}>− {p.ingredientsMinus.map(x => x?.name).join(', ')}</p>
                        )}
                        {(p.ingredientsPlus ?? []).length > 0 && (
                            <p className="text-xs mt-1" style={{ color: '#4ade80' }}>+ {p.ingredientsPlus.map(x => x?.name).join(', ')}</p>
                        )}
                        {p.note && <p className="text-xs mt-1 italic" style={{ color: 'var(--menu-muted)' }}>"{p.note}"</p>}
                    </li>
                );
            })}
        </ul>
    );
};

export default ComandLines;
