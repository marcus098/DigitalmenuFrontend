import React, { useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CategoryDto } from '../../types';
import { ArrowLeft } from 'lucide-react';

interface CategoryNavBarProps {
    categories: CategoryDto[];
    activeCategoryId: number;
    onSelectCategory: (categoryId: number) => void;
    primaryColor: string;
}

/**
 * Barra delle sezioni del menu: voci di testo, la sezione attiva è sottolineata
 * nel colore d'accento (come le linguette di un menu rilegato).
 */
const CategoryNavBar: React.FC<CategoryNavBarProps> = ({
    categories,
    activeCategoryId,
    onSelectCategory,
}) => {
    const navigate = useNavigate();
    const { localname } = useParams();
    const activeRef = useRef<HTMLButtonElement>(null);

    /* scroll active tab into view on category change */
    useEffect(() => {
        activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }, [activeCategoryId]);

    const visible = categories.filter(c => c.available !== false);

    return (
        <nav
            aria-label="Sezioni del menu"
            className="sticky z-20 flex items-stretch menu-page"
            style={{ top: 57, borderBottom: '1px solid var(--menu-border)' }}
        >
            <button
                type="button"
                onClick={() => navigate(`/${localname}`)}
                className="menu-focus flex-shrink-0 flex items-center justify-center"
                style={{
                    width: 52,
                    minHeight: 50,
                    color: 'var(--menu-text)',
                    borderRight: '1px solid var(--menu-border)',
                }}
                aria-label="Torna alle categorie"
            >
                <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="menu-nav-scroll flex items-stretch flex-1 min-w-0" style={{ overflowX: 'auto', padding: '0 8px' }}>
                {visible.map(cat => {
                    const isActive = cat.id === activeCategoryId;
                    return (
                        <button
                            type="button"
                            key={cat.id}
                            ref={isActive ? activeRef : null}
                            onClick={() => onSelectCategory(cat.id)}
                            aria-current={isActive ? 'page' : undefined}
                            className="menu-focus whitespace-nowrap flex-shrink-0 transition-colors"
                            style={{
                                padding: '0 12px',
                                minHeight: 50,
                                fontFamily: 'var(--menu-font-body)',
                                fontSize: '0.86rem',
                                fontWeight: isActive ? 700 : 500,
                                letterSpacing: '0.02em',
                                color: isActive ? 'var(--menu-text)' : 'var(--menu-muted)',
                                borderBottom: `3px solid ${isActive ? 'var(--menu-accent)' : 'transparent'}`,
                                borderTop: '3px solid transparent',
                            }}
                        >
                            {cat.name}
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};

export default CategoryNavBar;
