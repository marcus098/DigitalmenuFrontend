import React from 'react';
import { ProductDto } from '../../types';
import { Plus } from 'lucide-react';
import { useMenuLook } from './MenuThemeProvider';
import { MenuPrice, MenuTags } from './MenuPrimitives';

interface ProductListItemProps {
    product: ProductDto;
    onClick: () => void;
    /** Posizione nella categoria (1-based) — usata dai template con piatti numerati. */
    index?: number;
}

/**
 * Riga prodotto del menu pubblico. Tre impaginazioni, scelte dal template:
 *  - 'menu':     riga da menu stampato (nome · puntini · prezzo, descrizione sotto)
 *  - 'centered': blocco centrato, molto spazio (fine dining)
 *  - 'cards':    scheda con foto in evidenza (caffè, street food)
 */
const ProductListItem: React.FC<ProductListItemProps> = ({ product, onClick, index }) => {
    const { look, showImages } = useMenuLook();

    const imageUrl = showImages && product.image
        ? `${process.env.REACT_APP_BUCKET_URL}${product.image}`
        : null;

    const price = product.options && product.options.length > 0 ? product.options[0].price : 0;
    const from = !!product.options && product.options.length > 1;
    const number = look.productNumbers && index ? String(index).padStart(2, '0') : null;
    const ariaLabel = `${product.name}, ${from ? 'da ' : ''}${price.toFixed(2)} euro. Apri per aggiungere`;

    const hideBrokenImg = (e: React.SyntheticEvent<HTMLImageElement>) => {
        (e.target as HTMLImageElement).style.display = 'none';
    };

    // ── Fine dining: blocco centrato ────────────────────────────────────────
    if (look.productLayout === 'centered') {
        return (
            <button
                type="button"
                onClick={onClick}
                aria-label={ariaLabel}
                className="menu-row w-full text-center px-4 py-6"
                style={{ borderRadius: 'var(--menu-radius)' }}
            >
                <h3 className="menu-h" style={{ fontSize: 'clamp(1.35rem, 4.6vw, 1.6rem)', lineHeight: 1.15 }}>
                    {product.name}
                </h3>
                {product.description && (
                    <p
                        className="mt-2 mx-auto max-w-md"
                        style={{ color: 'var(--menu-muted)', fontSize: '0.86rem', lineHeight: 1.55, letterSpacing: '0.01em' }}
                    >
                        {product.description}
                    </p>
                )}
                <MenuTags tags={product.tags} align="center" />
                <div className="mt-3" style={{ letterSpacing: '0.08em' }}>
                    <MenuPrice value={price} from={from} size="0.95rem" />
                </div>
            </button>
        );
    }

    // ── Schede con foto ─────────────────────────────────────────────────────
    if (look.productLayout === 'cards') {
        const heavy = look.cardBorder === 'heavy';
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
                    minHeight: 104,
                }}
            >
                {imageUrl && (
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
                )}
                <div className="flex-1 min-w-0 flex flex-col p-3.5">
                    <h3 className="menu-h" style={{ fontSize: 'clamp(1.08rem, 3.6vw, 1.25rem)', lineHeight: 1.15 }}>
                        {product.name}
                    </h3>
                    {product.description && (
                        <p className="mt-1 line-clamp-2" style={{ color: 'var(--menu-muted)', fontSize: '0.82rem', lineHeight: 1.45 }}>
                            {product.description}
                        </p>
                    )}
                    <MenuTags tags={product.tags} />
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

    // ── Riga da menu stampato ───────────────────────────────────────────────
    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={ariaLabel}
            className="menu-row w-full text-left flex items-start gap-3.5 py-4 px-1"
            style={{ minHeight: 56 }}
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
                <div className="flex items-baseline">
                    <h3
                        className="menu-h min-w-0"
                        style={{
                            fontSize: 'clamp(1.08rem, 3.8vw, 1.28rem)',
                            lineHeight: 1.2,
                            textAlign: 'left',
                            // le spaziature ampie dei titoli (es. Cocktail bar) sui nomi dei piatti mandano a capo
                            ...(look.headingCase === 'uppercase' ? { letterSpacing: '0.05em' } : {}),
                        }}
                    >
                        {product.name}
                    </h3>
                    {look.leaders ? <span className="menu-leader" aria-hidden="true" /> : <span className="flex-1 min-w-[1rem]" />}
                    <MenuPrice value={price} from={from} />
                </div>
                {product.description && (
                    <p
                        className="mt-1"
                        style={{
                            color: 'var(--menu-muted)',
                            fontSize: '0.86rem',
                            lineHeight: 1.5,
                            fontStyle: look.headingStyle === 'italic' ? 'italic' : 'normal',
                            maxWidth: '36rem',
                        }}
                    >
                        {product.description}
                    </p>
                )}
                <MenuTags tags={product.tags} />
            </div>
            {imageUrl && (
                <div
                    className="flex-shrink-0 overflow-hidden"
                    style={{
                        width: 64,
                        height: 64,
                        borderRadius: 'var(--menu-radius)',
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
