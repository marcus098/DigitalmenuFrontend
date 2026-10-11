import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useData } from '../../Context/DataContext';
import { ProductDto } from '../../types';
import { allergenById, getProductAllergens } from '../../Utilities/Utilities';
import { allergenName, useMenuT } from '../../Client/menuI18n';

/**
 * Informazioni allergeni del menu pubblico (Reg. UE 1169/2011), condivise da lista prodotti,
 * pagina prodotto e drawer. Solo variabili del tema (--menu-*) così vanno bene su tutti i template;
 * l'avviso "tracce" usa un rosso miscelato col colore del testo, come il filtro nell'header.
 */

const WARN_TEXT = 'color-mix(in srgb, #dc2626 75%, var(--menu-text))';
const WARN_BG = 'color-mix(in srgb, #dc2626 9%, transparent)';
const WARN_BORDER = 'color-mix(in srgb, #dc2626 35%, transparent)';

/** Nomi nella lingua del menu (versioni ufficiali del regolamento), italiano come riserva. */
const names = (ids: number[], lang: string, short = false) =>
    ids.map(id => allergenById.get(id)).filter(Boolean)
        .map(a => allergenName(a!.id, lang, short) ?? (short ? a!.short : a!.name));

/** Asterisco dei prodotti con ingredienti surgelati/congelati all'origine (legenda in MenuAllergenFooter). */
export const FrozenMark: React.FC = () => {
    const t = useMenuT();
    return (
        <span
            title={t('frozen')}
            aria-label={`(${t('frozen')})`}
            style={{ color: 'var(--menu-muted)', fontWeight: 600, marginLeft: 2 }}
        >
            *
        </span>
    );
};

/** Hook comodo: allergeni effettivi/tracce del prodotto + tracce che il cliente ha chiesto di evitare. */
export const useProductAllergens = (product: ProductDto | null | undefined) => {
    const { ingredientsMap, selectedAllergens } = useData();
    const info = getProductAllergens(product, ingredientsMap);
    const filteredTraces = info.traces.filter(id => selectedAllergens.includes(id));
    return { ...info, filteredTraces };
};

/** Avviso: il prodotto può contenere tracce di allergeni che il cliente ha filtrato. */
const TraceWarning: React.FC<{ ids: number[]; align?: 'left' | 'center'; compact?: boolean }> = ({ ids, align = 'left', compact }) => {
    const { menuLang } = useData();
    const t = useMenuT();
    if (ids.length === 0) return null;
    return (
        <p
            role="note"
            className={`${compact ? 'mt-1.5' : 'mt-3'} inline-flex items-start gap-1.5`}
            style={{
                fontFamily: 'var(--menu-font-body)',
                fontSize: compact ? '0.72rem' : '0.8rem',
                fontWeight: 600,
                lineHeight: 1.35,
                color: WARN_TEXT,
                background: WARN_BG,
                border: `1px solid ${WARN_BORDER}`,
                borderRadius: 'var(--menu-radius)',
                padding: compact ? '2px 7px' : '6px 10px',
                textAlign: align,
            }}
        >
            <AlertTriangle aria-hidden="true" style={{ width: '1.1em', height: '1.1em', flexShrink: 0, marginTop: '0.1em' }} />
            <span>{t('mayContainTraces')} {names(ids, menuLang).join(', ').toLowerCase()}</span>
        </p>
    );
};

/** Marcatori compatti per la riga prodotto: etichette brevi degli allergeni effettivi + avviso tracce filtrate. */
export const MenuAllergenMarkers: React.FC<{ product: ProductDto; align?: 'left' | 'center' }> = ({ product, align = 'left' }) => {
    const { effective, filteredTraces } = useProductAllergens(product);
    const { menuLang } = useData();
    const t = useMenuT();
    if (effective.length === 0 && filteredTraces.length === 0) return null;
    return (
        <div style={{ textAlign: align }}>
            {effective.length > 0 && (
                <div
                    className="mt-1.5"
                    style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 4,
                        justifyContent: align === 'center' ? 'center' : 'flex-start',
                    }}
                >
                    <span className="sr-only">{t('allergens')}: {names(effective, menuLang).join(', ')}</span>
                    {names(effective, menuLang, true).map(label => (
                        <span
                            key={label}
                            aria-hidden="true"
                            style={{
                                fontFamily: 'var(--menu-font-body)',
                                fontSize: '0.64rem',
                                fontWeight: 600,
                                letterSpacing: '0.04em',
                                lineHeight: 1.2,
                                color: 'var(--menu-muted)',
                                border: '1px solid var(--menu-border)',
                                borderRadius: 'var(--menu-radius)',
                                padding: '1px 6px',
                            }}
                        >
                            {label}
                        </span>
                    ))}
                </div>
            )}
            <TraceWarning ids={filteredTraces} align={align} compact />
        </div>
    );
};

const AllergenChip: React.FC<{ id: number }> = ({ id }) => {
    const { menuLang } = useData();
    const a = allergenById.get(id);
    if (!a) return null;
    return (
        <li
            className="inline-flex items-center gap-1.5"
            style={{
                fontFamily: 'var(--menu-font-body)',
                fontSize: '0.8rem',
                fontWeight: 600,
                color: 'var(--menu-text)',
                background: 'var(--menu-surface)',
                border: '1px solid var(--menu-border)',
                borderRadius: 'var(--menu-radius)',
                padding: '3px 9px 3px 5px',
            }}
        >
            <img
                src={a.icon}
                alt=""
                aria-hidden="true"
                style={{ width: 16, height: 16, objectFit: 'contain' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            {allergenName(a.id, menuLang) ?? a.name}
        </li>
    );
};

/** Elenco completo per la pagina/drawer prodotto: allergeni contenuti, tracce e avviso sui filtri. */
export const MenuAllergenDetails: React.FC<{ product: ProductDto; className?: string }> = ({ product, className = '' }) => {
    const { effective, traces, filteredTraces } = useProductAllergens(product);
    const { menuLang } = useData();
    const t = useMenuT();
    const label: React.CSSProperties = {
        color: 'var(--menu-muted)',
        fontFamily: 'var(--menu-font-body)',
        opacity: 0.8,
    };
    return (
        <section className={className} aria-label={t('allergens')}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={label}>
                {t('allergens')}
            </p>
            {effective.length > 0 ? (
                <ul className="flex flex-wrap gap-1.5">
                    {effective.map(id => <AllergenChip key={id} id={id} />)}
                </ul>
            ) : (
                <p style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)', fontSize: '0.85rem' }}>
                    {t('noAllergens')}
                </p>
            )}
            {traces.length > 0 && (
                <p className="mt-3" style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)', fontSize: '0.85rem', lineHeight: 1.5 }}>
                    <span style={{ fontWeight: 700 }}>{t('mayContainTraces')}: </span>
                    {names(traces, menuLang).join(', ').toLowerCase()}
                </p>
            )}
            <TraceWarning ids={filteredTraces} />
        </section>
    );
};

/** Piè di pagina legale del menu: legenda surgelati (se serve) e riferimento al Reg. UE 1169/2011. */
export const MenuAllergenFooter: React.FC<{ showFrozenLegend?: boolean; align?: 'left' | 'center'; className?: string }> = ({
    showFrozenLegend = false,
    align = 'left',
    className = '',
}) => {
    const t = useMenuT();
    return (
    <footer
        className={className}
        style={{
            color: 'var(--menu-muted)',
            fontFamily: 'var(--menu-font-body)',
            fontSize: '0.72rem',
            lineHeight: 1.5,
            textAlign: align,
        }}
    >
        {showFrozenLegend && <p>* {t('frozen')}</p>}
        <p style={{ opacity: 0.85 }}>
            {t('allergenFooter')}
        </p>
    </footer>
    );
};
