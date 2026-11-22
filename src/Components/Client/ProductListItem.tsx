import React from 'react';
import { ProductDto } from '../../types';
import { Plus } from 'lucide-react';
import { useMenuLook } from './MenuThemeProvider';
import { imageRadius, MenuDescription, MenuPrice, MenuTags, rowPadding } from './MenuPrimitives';
import { FrozenMark, MenuAllergenMarkers, useProductAllergens } from './MenuAllergens';
import { allergenById } from '../../Utilities/Utilities';

interface ProductListItemProps {
    product: ProductDto;
    onClick: () => void;
    /** Posizione nella categoria (1-based) — usata dai template con piatti numerati. */
    index?: number;
    /** Riga sopra il nome (es. la categoria del piatto nei risultati della ricerca). */
    eyebrow?: string;
}

/**
 * Riga prodotto del menu pubblico. Impaginazioni, scelte dal template (o dai ritocchi del ristoratore):
 *  - 'menu' / 'twocol': riga da menu stampato (nome · puntini · prezzo, descrizione sotto);
 *                       'twocol' è la stessa riga, impaginata su due colonne da ProductsPage
 *  - 'centered':        blocco centrato, molto spazio (fine dining)
 *  - 'cards':           scheda con foto a lato (caffè, street food)
 *  - 'grid':            scheda verticale con foto sopra, in griglia (gelateria, forno)
 * Densità, forma delle foto, posizione del prezzo e stile della descrizione arrivano dal look.
 */
const ProductListItem: React.FC<ProductListItemProps> = ({ product, onClick, index, eyebrow }) => {
    const { look, showImages } = useMenuLook();

    const imageUrl = showImages && product.image
        ? `${process.env.REACT_APP_BUCKET_URL}${product.image}`
        : null;

    const price = product.options && product.options.length > 0 ? product.options[0].price : 0;
    const from = !!product.options && product.options.length > 1;
    const number = look.productNumbers && index ? String(index).padStart(2, '0') : null;
    const { effective, frozen, filteredTraces } = useProductAllergens(product);
    const allergenNames = (ids: number[]) => ids.map(id => allergenById.get(id)?.name).filter(Boolean).join(', ');
    // L'aria-label sostituisce il contenuto del bottone: gli allergeni vanno ripetuti qui
    const ariaLabel = `${eyebrow ? `${eyebrow}: ` : ''}${product.name}${frozen ? " (surgelato o congelato all'origine)" : ''}, ${from ? 'da ' : ''}${price.toFixed(2)} euro.`
        + (effective.length > 0 ? ` Allergeni: ${allergenNames(effective)}.` : '')
        + (filteredTraces.length > 0 ? ` Attenzione: può contenere tracce di ${allergenNames(filteredTraces)}.` : '')
        + ' Apri per aggiungere';

    const hideBrokenImg = (e: React.SyntheticEvent<HTMLImageElement>) => {
        (e.target as HTMLImageElement).style.display = 'none';
    };

    const pad = rowPadding(look);
    const compact = look.density === 'compact';

    const eyebrowEl = eyebrow ? (
        <span
            aria-hidden="true"
            className="menu-label block truncate"
            style={{ color: 'var(--menu-emph)', fontSize: '0.62rem', marginBottom: 3 }}
        >
            {eyebrow}
        </span>
    ) : null;

    // ── Fine dining: blocco centrato ────────────────────────────────────────
    if (look.productLayout === 'centered') {
        return (
            <button
                type="button"
                onClick={onClick}
                aria-label={ariaLabel}
                className="menu-row w-full text-center px-4"
                style={{ borderRadius: 'var(--menu-radius)', paddingTop: pad + 8, paddingBottom: pad + 8 }}
            >
                {eyebrowEl}
                <h3 className="menu-h" style={{ fontSize: 'clamp(1.35rem, 4.6vw, 1.6rem)', lineHeight: 1.15 }}>
                    {product.name}{frozen && <FrozenMark />}
                </h3>
                {product.description && (
                    <MenuDescription
                        text={product.description}
                        autoItalic={false}
                        className="mt-2 mx-auto max-w-md"
                        style={{ fontSize: '0.86rem', lineHeight: 1.55, letterSpacing: '0.01em' }}
                    />
                )}
                <MenuTags tags={product.tags} align="center" />
                <MenuAllergenMarkers product={product} align="center" />
                <div className="mt-3" style={{ letterSpacing: '0.08em' }}>
                    <MenuPrice value={price} from={from} size="0.95rem" />
                </div>
            </button>
        );
    }

    // ── Griglia: foto sopra, prezzo sotto ───────────────────────────────────
    if (look.productLayout === 'grid') {
        const heavy = look.cardBorder === 'heavy';
        // Senza foto: una fascia di colore in cima (alterna accento / secondario, come le vaschette in vetrina)
        const tints = [
            'color-mix(in srgb, var(--menu-accent) 70%, var(--menu-card))',
            'var(--menu-secondary)',
            'color-mix(in srgb, var(--menu-secondary) 45%, var(--menu-card))',
        ];
        return (
            <button
                type="button"
                onClick={onClick}
                aria-label={ariaLabel}
                className="menu-row w-full h-full text-left flex flex-col overflow-hidden"
                style={{
                    background: 'var(--menu-card)',
                    borderRadius: 'var(--menu-radius)',
                    border: heavy ? '2px solid var(--menu-text)' : look.cardBorder === 'none' ? 'none' : '1px solid var(--menu-border)',
                    boxShadow: look.offsetShadow ? '4px 4px 0 var(--menu-text)' : 'none',
                }}
            >
                {imageUrl ? (
                    <div className="px-2.5 pt-2.5">
                        <div className="overflow-hidden" style={{ aspectRatio: look.imageShape === 'arch' ? '4 / 5' : '4 / 3', borderRadius: imageRadius(look.imageShape), background: 'var(--menu-surface)' }}>
                            <img src={imageUrl} alt="" loading="lazy" className="w-full h-full object-cover" onError={hideBrokenImg} />
                        </div>
                    </div>
                ) : (
                    <div aria-hidden="true" style={{ height: 8, background: tints[((index || 1) - 1) % tints.length] }} />
                )}
                <div className="flex-1 min-w-0 flex flex-col" style={{ padding: compact ? '10px 12px 12px' : '14px 14px 14px' }}>
                    {number && (
                        <span className="menu-price" style={{ color: 'var(--menu-emph)', fontSize: '0.75rem', fontWeight: 600 }} aria-hidden="true">{number}</span>
                    )}
                    {eyebrowEl}
                    <h3 className="menu-h" style={{ fontSize: 'clamp(1.02rem, 3.6vw, 1.22rem)', lineHeight: 1.15 }}>
                        {product.name}{frozen && <FrozenMark />}
                    </h3>
                    {product.description && (
                        <MenuDescription
                            text={product.description}
                            autoItalic={false}
                            className="mt-1.5"
                            clamp={3}
                            style={{ fontSize: '0.8rem', lineHeight: 1.45 }}
                        />
                    )}
                    <MenuTags tags={product.tags} />
                    <MenuAllergenMarkers product={product} />
                    <div className="mt-auto pt-3">
                        <MenuPrice value={price} from={from} />
                    </div>
                </div>
            </button>
        );
    }

    // ── Schede con foto ─────────────────────────────────────────────────────
    if (look.productLayout === 'cards') {
        const heavy = look.cardBorder === 'heavy';
        const shaped = look.imageShape !== 'square';
        return (
            <button
                type="button"
                onClick={onClick}
                aria-label={ariaLabel}
                className="menu-row w-full text-left flex items-stretch overflow-hidden"
                style={{
                    background: 'var(--menu-card)',
                    borderRadius: 'var(--menu-radius)',
                    border: heavy ? '2px solid var(--menu-text)' : '1px solid var(--menu-border)',
                    boxShadow: look.offsetShadow ? '4px 4px 0 var(--menu-text)' : 'none',
                    minHeight: compact ? 88 : 104,
                }}
            >
                {imageUrl && (
                    shaped ? (
                        <div className="flex-shrink-0 p-2.5 pr-0" style={{ width: 'clamp(96px, 28vw, 132px)' }}>
                            <div className="overflow-hidden w-full" style={{ aspectRatio: look.imageShape === 'round' ? '1 / 1' : '4 / 5', borderRadius: imageRadius(look.imageShape), background: 'var(--menu-surface)' }}>
                                <img src={imageUrl} alt="" loading="lazy" className="w-full h-full object-cover" onError={hideBrokenImg} />
                            </div>
                        </div>
                    ) : (
                        <div
                            className="flex-shrink-0 overflow-hidden"
                            style={{
                                width: 'clamp(96px, 28vw, 132px)',
                                borderRight: heavy ? '2px solid var(--menu-text)' : 'none',
                                background: 'var(--menu-surface)',
                            }}
                        >
                            <img src={imageUrl} alt="" loading="lazy" className="w-full h-full object-cover" onError={hideBrokenImg} />
                        </div>
                    )
                )}
                {number && (
                    <span
                        aria-hidden="true"
                        className="menu-price flex-shrink-0 flex items-start justify-center"
                        style={{
                            width: 44, paddingTop: 16, color: 'var(--menu-secondary-text)', background: 'var(--menu-secondary)',
                            fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.04em',
                        }}
                    >
                        {number}
                    </span>
                )}
                <div className="flex-1 min-w-0 flex flex-col" style={{ padding: compact ? 11 : 14 }}>
                    {eyebrowEl}
                    <h3 className="menu-h" style={{ fontSize: 'clamp(1.08rem, 3.6vw, 1.25rem)', lineHeight: 1.15 }}>
                        {product.name}{frozen && <FrozenMark />}
                    </h3>
                    {product.description && (
                        <MenuDescription
                            text={product.description}
                            autoItalic={false}
                            className="mt-1 line-clamp-2"
                            style={{ fontSize: '0.82rem', lineHeight: 1.45 }}
                        />
                    )}
                    <MenuTags tags={product.tags} />
                    <MenuAllergenMarkers product={product} />
                    <div className="mt-auto pt-2.5 flex items-center justify-between gap-3">
                        <MenuPrice value={price} from={from} />
                        <span
                            aria-hidden="true"
                            className="flex items-center justify-center flex-shrink-0"
                            style={{
                                width: 34,
                                height: 34,
                                borderRadius: 'var(--menu-radius)',
                                background: 'var(--menu-secondary)',
                                color: 'var(--menu-secondary-text)',
                            }}
                        >
                            <Plus className="w-4 h-4" strokeWidth={2.5} />
                        </span>
                    </div>
                </div>
            </button>
        );
    }

    // ── Riga da menu stampato (anche su due colonne) ────────────────────────
    const pp = look.pricePosition;
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={ariaLabel}
            className="menu-row w-full text-left flex items-start gap-3.5 px-1"
            style={{ minHeight: compact ? 48 : 56, paddingTop: pad, paddingBottom: pad }}
        >
            {number && (
                <span
                    className="menu-price flex-shrink-0 pt-0.5"
                    style={{ color: 'var(--menu-emph)', fontSize: '0.8rem', fontWeight: 600, minWidth: '1.6rem' }}
                    aria-hidden="true"
                >
                    {number}
                </span>
            )}
            <div className="flex-1 min-w-0">
                {eyebrowEl}
                <div className="flex items-baseline">
                    <h3
                        className="menu-h min-w-0"
                        style={{
                            fontSize: compact ? 'clamp(1rem, 3.5vw, 1.15rem)' : 'clamp(1.08rem, 3.8vw, 1.28rem)',
                            lineHeight: 1.2,
                            textAlign: 'left',
                            // le spaziature ampie dei titoli (es. Cocktail bar) sui nomi dei piatti mandano a capo
                            ...(look.headingCase === 'uppercase' ? { letterSpacing: '0.05em' } : {}),
                        }}
                    >
                        {product.name}{frozen && <FrozenMark />}
                        {pp === 'inline' && (
                            <span style={{ marginLeft: '0.6em', fontFamily: 'var(--menu-font-price)', fontStyle: 'normal', textTransform: 'none', letterSpacing: 0 }}>
                                <MenuPrice value={price} from={from} size="0.92em" />
                            </span>
                        )}
                    </h3>
                    {pp === 'right' && (
                        <>
                            {look.leaders ? <span className="menu-leader" aria-hidden="true" /> : <span className="flex-1 min-w-[1rem]" />}
                            <MenuPrice value={price} from={from} />
                        </>
                    )}
                </div>
                {product.description && (
                    <MenuDescription
                        text={product.description}
                        className={compact ? 'mt-0.5' : 'mt-1'}
                        style={{ fontSize: compact ? '0.8rem' : '0.86rem', lineHeight: 1.5, maxWidth: '36rem' }}
                    />
                )}
                <MenuTags tags={product.tags} />
                <MenuAllergenMarkers product={product} />
                {pp === 'below' && (
                    <div className="mt-2">
                        <MenuPrice value={price} from={from} />
                    </div>
                )}
            </div>
            {imageUrl && (
                <div
                    className="flex-shrink-0 overflow-hidden"
                    style={{
                        width: 64,
                        height: look.imageShape === 'arch' ? 76 : 64,
                        borderRadius: imageRadius(look.imageShape),
                        border: '1px solid var(--menu-border)',
                        background: 'var(--menu-surface)',
                    }}
                >
                    <img src={imageUrl} alt="" loading="lazy" className="w-full h-full object-cover" onError={hideBrokenImg} />
                </div>
            )}
        </button>
    );
};

export default ProductListItem;
