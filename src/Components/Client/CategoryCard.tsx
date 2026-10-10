import React from 'react';
import { CategoryDto } from '../../types';
import { useMenuLook } from './MenuThemeProvider';

interface CategoryCardProps {
    category: CategoryDto;
    onClick: () => void;
}

/**
 * Riquadro categoria per i template a "tessere" (caffè, pub, street food).
 * Foto sopra, nome sotto su fondo pieno — niente velature o gradienti sopra
 * la foto. Senza foto: blocco nel colore secondario con l'iniziale.
 */
const CategoryCard: React.FC<CategoryCardProps> = ({ category, onClick }) => {
    const { look, showImages } = useMenuLook();
    const imageUrl = showImages && category.image
        ? `${process.env.REACT_APP_BUCKET_URL}${category.image}`
        : null;
    const heavy = look.cardBorder === 'heavy';
    const edge = heavy ? '2px solid var(--menu-text)' : '1px solid var(--menu-border)';

    return (
        <button
            type="button"
            onClick={onClick}
            className="menu-row menu-focus w-full text-left flex flex-col overflow-hidden"
            style={{
                background: 'var(--menu-card)',
                borderRadius: 'var(--menu-radius)',
                border: edge,
                boxShadow: look.offsetShadow ? '4px 4px 0 var(--menu-text)' : 'none',
            }}
        >
            <div
                className="relative w-full overflow-hidden"
                style={{ aspectRatio: '4 / 3', background: 'var(--menu-secondary)', borderBottom: edge }}
            >
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                ) : (
                    <span
                        aria-hidden="true"
                        className="menu-h absolute inset-0 flex items-center justify-center"
                        style={{ color: 'var(--menu-secondary-text)', opacity: 0.5, fontSize: 'clamp(2.4rem, 9vw, 3.4rem)' }}
                    >
                        {category.name.charAt(0).toUpperCase()}
                    </span>
                )}
            </div>
            <div className="px-3 py-2.5" style={{ minHeight: 52 }}>
                <h2 className="menu-h" style={{ fontSize: 'clamp(1.02rem, 3.6vw, 1.2rem)', lineHeight: 1.15 }}>
                    {category.name}
                </h2>
                {category.description && (
                    <p className="mt-0.5 line-clamp-1" style={{ color: 'var(--menu-muted)', fontSize: '0.75rem' }}>
                        {category.description}
                    </p>
                )}
            </div>
        </button>
    );
};

export default CategoryCard;
