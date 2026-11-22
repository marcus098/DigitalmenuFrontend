import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { useData } from '../../Context/DataContext';
import { useMenuT } from '../../Client/menuI18n';
import { CategoryDto, IngredientDto, ProductDto } from '../../types';
import { findCompatibleSelection } from '../../Utilities/variants';
import { useMenuLook } from './MenuThemeProvider';
import { MenuRule } from './MenuPrimitives';
import ProductListItem from './ProductListItem';
import ProductCustomizationDrawer from '../ProductCustomizationDrawer';

/**
 * Ricerca dei piatti nel menu pubblico, su tutte le categorie.
 * Cerca in nome, descrizione, ingredienti, formati e varianti (gruppi e scelte),
 * senza distinguere maiuscole e accenti. Le mappe di DataContext arrivano già con i
 * testi nella lingua scelta dal cliente, quindi si cerca in quello che il cliente legge.
 *
 * Il campo prende la forma della barra delle sezioni del template (pillola, riquadro
 * o riga sottolineata da menu stampato); i risultati usano la stessa riga prodotto
 * della categoria, con il nome della categoria sopra il piatto.
 */

/** "Caffè Ristretto" → "caffe ristretto" */
export const normalizeSearch = (s: string | undefined | null): string =>
    (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

interface SearchHit {
    product: ProductDto;
    category: CategoryDto;
    /** Posizione nella categoria (1-based), come nella pagina della categoria */
    index: number;
    score: number;
    order: number;
}

const buildIndexText = (p: ProductDto, ingredientsMap: Map<number, IngredientDto>): string => [
    p.description,
    ...(p.ingredients ?? []).map(id => ingredientsMap.get(id)?.name),
    ...(p.options ?? []).map(o => o.name),
    ...(p.variantGroups ?? []).flatMap(g => [g.name, ...(g.choices ?? []).map(c => c.name)]),
].map(normalizeSearch).filter(Boolean).join(' | ');

export function searchMenu(
    query: string,
    categories: CategoryDto[],
    products: ProductDto[],
    ingredientsMap: Map<number, IngredientDto>,
    avoidAllergens: number[],
): SearchHit[] {
    const q = normalizeSearch(query);
    if (!q) return [];
    const tokens = q.split(' ');
    const visibleCats = categories.filter(c => c.id > 0 && c.available !== false);
    const hits: SearchHit[] = [];
    let order = 0;
    for (const category of visibleCats) {
        const inCategory = products
            .filter(p => p.idCategory === category.id)
            // Stesso filtro allergeni della pagina categoria
            .filter(p => avoidAllergens.length === 0 || findCompatibleSelection(p, ingredientsMap, avoidAllergens) !== null);
        inCategory.forEach((product, i) => {
            const name = normalizeSearch(product.name);
            const rest = buildIndexText(product, ingredientsMap);
            if (!tokens.every(t => name.includes(t) || rest.includes(t))) return;
            // Prima i nomi che iniziano con la ricerca, poi quelli che la contengono, poi il resto
            const score = name.startsWith(q) ? 0 : tokens.every(t => name.includes(t)) ? 1 : 2;
            hits.push({ product, category, index: i + 1, score, order: order++ });
        });
    }
    return hits.sort((a, b) => a.score - b.score || a.order - b.order);
}

/** Campo di ricerca nello stile del template corrente. */
export const MenuSearchField: React.FC<{
    value: string;
    onChange: (v: string) => void;
    onClear: () => void;
}> = ({ value, onChange, onClear }) => {
    const { look } = useMenuLook();
    const t = useMenuT();
    const inputRef = useRef<HTMLInputElement>(null);
    const nav = look.categoryNav;

    const shape: React.CSSProperties = nav === 'pill'
        ? { borderRadius: 999, border: '1px solid var(--menu-input-border)', background: 'var(--menu-input-bg)', padding: '0 6px 0 16px' }
        : nav === 'block'
            ? { borderRadius: 0, border: '2px solid var(--menu-text)', background: 'var(--menu-input-bg)', padding: '0 6px 0 12px' }
            // Riga da menu stampato: solo il filetto sotto, sul fondo della pagina
            : { borderRadius: 0, borderBottom: '1px solid var(--menu-rule)', background: 'transparent', padding: '0 2px' };

    return (
        <form
            role="search"
            aria-label={t('searchLabel')}
            onSubmit={e => { e.preventDefault(); inputRef.current?.blur(); }}
        >
            <label className="menu-search-field flex items-center gap-2.5 transition-colors" style={{ minHeight: 46, ...shape }}>
                <Search className="w-4 h-4 flex-shrink-0" aria-hidden="true" style={{ color: 'var(--menu-muted)' }} />
                <span className="sr-only">{t('searchLabel')}</span>
                <input
                    ref={inputRef}
                    type="search"
                    inputMode="search"
                    enterKeyHint="search"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Escape' && value) { e.preventDefault(); onClear(); } }}
                    placeholder={t('searchPlaceholder')}
                    className="menu-search-input flex-1 min-w-0 bg-transparent outline-none border-0 p-0"
                    // 16px: sotto questa misura iOS ingrandisce la pagina al tocco
                    style={{ fontSize: 16, height: 44 }}
                />
                {value && (
                    <button
                        type="button"
                        onClick={() => { onClear(); inputRef.current?.focus(); }}
                        aria-label={t('searchClear')}
                        className="menu-focus flex-shrink-0 flex items-center justify-center"
                        style={{ width: 36, height: 36, borderRadius: nav === 'pill' ? 999 : 'var(--menu-radius)', color: 'var(--menu-text)' }}
                    >
                        <X className="w-4 h-4" aria-hidden="true" />
                    </button>
                )}
            </label>
        </form>
    );
};

/**
 * Campo di ricerca + risultati. Finché la ricerca è vuota mostra `children`
 * (l'indice delle categorie o i piatti della categoria).
 * `resetKey`: cambiandolo la ricerca si azzera (es. cambio di categoria dalla barra).
 */
const MenuSearch: React.FC<{
    children: React.ReactNode;
    centered?: boolean;
    resetKey?: string | number;
    className?: string;
}> = ({ children, centered = false, resetKey, className = '' }) => {
    const { categoriesMap, productsMap, ingredientsMap, selectedAllergens } = useData();
    const { look } = useMenuLook();
    const t = useMenuT();

    const [input, setInput] = useState('');
    const [query, setQuery] = useState('');
    const [selectedDish, setSelectedDish] = useState<ProductDto | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Debounce leggero: si cerca a ogni pausa di battitura, svuotare è immediato
    useEffect(() => {
        if (!input.trim()) { setQuery(''); return; }
        const id = window.setTimeout(() => setQuery(input), 140);
        return () => window.clearTimeout(id);
    }, [input]);

    useEffect(() => { setInput(''); setQuery(''); }, [resetKey]);

    const hits = useMemo(
        () => searchMenu(query, Array.from(categoriesMap.values()), Array.from(productsMap.values()), ingredientsMap, selectedAllergens),
        [query, categoriesMap, productsMap, ingredientsMap, selectedAllergens],
    );

    const clear = () => { setInput(''); setQuery(''); };
    const active = input.trim().length > 0;

    const listClass = {
        cards: 'flex flex-col gap-3.5 pt-3',
        grid: 'grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 pt-3',
        twocol: 'grid grid-cols-1 md:grid-cols-2 md:gap-x-10',
        menu: 'flex flex-col',
        centered: 'flex flex-col',
    }[look.productLayout];

    return (
        <>
            <div className={className}>
                <MenuSearchField value={input} onChange={setInput} onClear={clear} />
            </div>

            {!active ? children : (
                <section aria-label={t('searchResults')} className="pt-5 menu-fade-in">
                    <p
                        className="menu-label mb-2"
                        aria-live="polite"
                        style={{ textAlign: centered ? 'center' : 'left', color: 'var(--menu-emph)' }}
                    >
                        {t('searchResults')}{query ? ` · ${hits.length}` : ''}
                    </p>
                    <MenuRule className="mb-2" />

                    {query && hits.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <p className="menu-h" style={{ color: 'var(--menu-muted)', fontSize: '1.4rem' }}>
                                {t('searchNoResults')}
                            </p>
                            <p className="mt-2" style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)', fontSize: '0.82rem', opacity: 0.7 }}>
                                {t('searchNoResultsHint')}
                            </p>
                        </div>
                    ) : (
                        <div className={listClass}>
                            {hits.map(({ product, category, index }, i) => (
                                <div
                                    key={product.id}
                                    style={
                                        look.productLayout === 'menu' || look.productLayout === 'twocol'
                                            ? { borderBottom: `1px ${look.divider === 'dashed' ? 'dashed' : 'solid'} var(--menu-border)` }
                                            : undefined
                                    }
                                >
                                    {look.productLayout === 'centered' && i > 0 && <MenuRule className="my-1" />}
                                    <ProductListItem
                                        product={product}
                                        index={index}
                                        eyebrow={category.name}
                                        onClick={() => { setSelectedDish(product); setIsDrawerOpen(true); }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            )}

            <ProductCustomizationDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                dish={selectedDish ? (productsMap.get(selectedDish.id) ?? selectedDish) : null}
                waiter={window.location.href.toLowerCase().includes('/waiters/')}
            />
        </>
    );
};

export default MenuSearch;
