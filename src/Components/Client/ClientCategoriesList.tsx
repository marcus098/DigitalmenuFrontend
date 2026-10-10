import React from 'react';
import { ChevronRight } from 'lucide-react';
import CategoryCard from './CategoryCard';
import { CategoryDto } from '../../types';
import { useMenuLook } from './MenuThemeProvider';
import { formatIndex } from '../../Client/menuTemplates';

interface ClientCategoriesListProps {
    categories: CategoryDto[];
    onSelectCategory: (categoryId: number) => void;
}

/**
 * Elenco categorie del menu pubblico. L'impaginazione dipende dal template:
 *  - 'index': indice tipografico (come la prima pagina di un menu stampato)
 *  - 'rows':  righe con piccola foto a sinistra
 *  - 'tiles': tessere con foto, due per riga su mobile
 */
const ClientCategoriesList: React.FC<ClientCategoriesListProps> = ({
    categories,
    onSelectCategory,
}) => {
    const { look, showImages } = useMenuLook();
    const visible = categories.filter(c => c.id > 0 && c.available);
    const centered = look.align === 'center';

    if (look.categoryLayout === 'tiles') {
        return (
            <div
                className="grid gap-3 md:gap-4 menu-fade-in"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(150px, 45%), 1fr))' }}
            >
                {visible.map(category => (
                    <CategoryCard key={category.id} category={category} onClick={() => onSelectCategory(category.id)} />
                ))}
            </div>
        );
    }

    if (look.categoryLayout === 'rows') {
        return (
            <ul className="menu-fade-in" style={{ borderTop: '1px solid var(--menu-border)' }}>
                {visible.map(category => {
                    const img = showImages && category.image ? `${process.env.REACT_APP_BUCKET_URL}${category.image}` : null;
                    return (
                        <li key={category.id} style={{ borderBottom: '1px solid var(--menu-border)' }}>
                            <button
                                type="button"
                                onClick={() => onSelectCategory(category.id)}
                                className="menu-row w-full text-left flex items-center gap-4 py-3 px-1"
                                style={{ minHeight: 64 }}
                            >
                                <span
                                    className="flex-shrink-0 overflow-hidden flex items-center justify-center"
                                    style={{
                                        width: 60,
                                        height: 60,
                                        borderRadius: 'var(--menu-radius)',
                                        background: 'var(--menu-secondary)',
                                        color: 'var(--menu-secondary-text)',
                                    }}
                                    aria-hidden="true"
                                >
                                    {img
                                        ? <img src={img} alt="" loading="lazy" className="w-full h-full object-cover" />
                                        : <span className="menu-h" style={{ color: 'inherit', fontSize: '1.6rem', opacity: 0.75 }}>{category.name.charAt(0).toUpperCase()}</span>}
                                </span>
                                <span className="flex-1 min-w-0">
                                    <span className="menu-h block" style={{ fontSize: 'clamp(1.2rem, 4.4vw, 1.5rem)' }}>{category.name}</span>
                                    {category.description && (
                                        <span className="block mt-0.5 line-clamp-1" style={{ color: 'var(--menu-muted)', fontSize: '0.8rem' }}>
                                            {category.description}
                                        </span>
                                    )}
                                </span>
                                <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--menu-muted)' }} aria-hidden="true" />
                            </button>
                        </li>
                    );
                })}
            </ul>
        );
    }

    // ── Indice tipografico ──────────────────────────────────────────────────
    return (
        <ol className="menu-fade-in">
            {visible.map((category, i) => {
                const num = formatIndex(i + 1, look.categoryNumbers);
                return (
                    <li key={category.id} style={{ borderBottom: look.divider === 'ornament' ? 'none' : '1px solid var(--menu-border)' }}>
                        <button
                            type="button"
                            onClick={() => onSelectCategory(category.id)}
                            className={`menu-row w-full flex items-baseline gap-4 py-4 px-1 ${centered ? 'justify-center text-center' : 'text-left'}`}
                            style={{ minHeight: 60 }}
                        >
                            {num && !centered && (
                                <span
                                    className="menu-price flex-shrink-0"
                                    style={{ color: 'var(--menu-emph)', fontSize: '0.85rem', fontWeight: 600, minWidth: '2rem' }}
                                    aria-hidden="true"
                                >
                                    {num}
                                </span>
                            )}
                            <span className={centered ? 'block' : 'flex-1 min-w-0'}>
                                {num && centered && (
                                    <span className="menu-label block mb-1" style={{ color: 'var(--menu-emph)', letterSpacing: '0.2em' }} aria-hidden="true">
                                        {num}
                                    </span>
                                )}
                                <span className="menu-h block" style={{ fontSize: 'clamp(1.45rem, 5.6vw, 2rem)' }}>
                                    {category.name}
                                </span>
                                {category.description && (
                                    <span
                                        className="block mt-1"
                                        style={{ color: 'var(--menu-muted)', fontSize: '0.84rem', fontStyle: look.headingStyle === 'italic' ? 'italic' : 'normal' }}
                                    >
                                        {category.description}
                                    </span>
                                )}
                            </span>
                            {!centered && (
                                <ChevronRight className="w-5 h-5 flex-shrink-0 self-center" style={{ color: 'var(--menu-muted)' }} aria-hidden="true" />
                            )}
                        </button>
                    </li>
                );
            })}
        </ol>
    );
};

export default ClientCategoriesList;
