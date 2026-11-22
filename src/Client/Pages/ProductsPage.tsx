// src/pages/client/ClientProductsPage.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../Context/DataContext';
import { ProductDto } from '../../types';

import CustomLoading from '../../Components/CustomLoading';
import ClientStickyHeader from '../../Components/Client/ClientStickyHeader';
import CategoryNavBar from '../../Components/Client/CategoryNavBar';
import ProductListItem from '../../Components/Client/ProductListItem';
import AllergenModal from '../../Components/Client/AllergenModal';
import ProductCustomizationDrawer from '../../Components/ProductCustomizationDrawer';
import useCartCount from '../../Utilities/useCartCount';
import { useMenuLook } from '../../Components/Client/MenuThemeProvider';
import { MenuRule, MenuSectionHeading } from '../../Components/Client/MenuPrimitives';
import { MenuAllergenFooter } from '../../Components/Client/MenuAllergens';
import { getProductAllergens } from '../../Utilities/Utilities';
import { findCompatibleSelection } from '../../Utilities/variants';
import MenuSearch from '../../Components/Client/MenuSearch';

const ClientProductsPage: React.FC = () => {
    const [selectedDish, setSelectedDish] = useState<ProductDto | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isAllergenModalOpen, setIsAllergenModalOpen] = useState(false);

    const { loading, setSelectedAllergens, selectedAllergens, categoriesMap, productsMap, ingredientsMap, waiters, styles } = useData();
    const cartCount = useCartCount(waiters ? 'waiter' : undefined);
    const { idCategory, localname } = useParams();
    const navigate = useNavigate();

    const primaryColor = styles?.primary?.trim() || '#f97316';
    const { look } = useMenuLook();
    const centered = look.align === 'center';

    const currentCategoryId = Number(idCategory);
    const category = categoriesMap.get(currentCategoryId);

    const visibleProducts = Array.from(productsMap.values())
        .filter(p => p.idCategory === currentCategoryId)
        .filter(p => {
            if (selectedAllergens.length === 0) return true;
            // Allergeni effettivi = dichiarati sul prodotto ∪ ingredienti, corretti dalle varianti:
            // il piatto resta se ALMENO una combinazione disponibile li evita (es. impasto senza glutine).
            // Le sole tracce non nascondono il piatto: la riga mostra un avviso (vedi MenuAllergenMarkers)
            return findCompatibleSelection(p, ingredientsMap, selectedAllergens) !== null;
        });

    // Posizione della categoria nel menu (sigillo numerato del template Izakaya)
    const categoryIndex = Array.from(categoriesMap.values()).filter(c => c.id > 0 && c.available).findIndex(c => c.id === currentCategoryId) + 1;

    const listClass = {
        cards: 'flex flex-col gap-3.5 pt-3',
        grid: 'grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 pt-3',
        twocol: 'grid grid-cols-1 md:grid-cols-2 md:gap-x-10',
        menu: 'flex flex-col',
        centered: 'flex flex-col',
    }[look.productLayout];

    const hasFrozenProducts = visibleProducts.some(p => getProductAllergens(p, ingredientsMap).frozen);

    if (loading) return <CustomLoading />;

    return (
        <div className="menu-page" style={{ minHeight: '100vh' }}>
            <div className="max-w-4xl mx-auto" style={{ minHeight: '100vh' }}>

                <ClientStickyHeader
                    restaurantName={styles?.restaurantName || localname || ''}
                    onAllergenClick={() => setIsAllergenModalOpen(true)}
                    onCartClick={() => navigate(waiters ? `/Waiters/${localname}/cart` : `/${localname}/cart`)}
                    cartItemCount={cartCount}
                    primaryColor={primaryColor}
                />

                <CategoryNavBar
                    categories={Array.from(categoriesMap.values())}
                    activeCategoryId={currentCategoryId}
                    onSelectCategory={newId => {
                        const base = waiters ? `/${localname}/waiters` : ``;
                        navigate(`${base}/${localname}/products/${newId}`);
                    }}
                    primaryColor={primaryColor}
                />

                <main className="px-4 md:px-6 pt-5 pb-12">
                    <MenuSearch centered={centered} resetKey={currentCategoryId} className="mb-7">

                        <div className={`mb-5 menu-fade-up ${centered ? 'text-center' : ''}`} style={{ animationDelay: '0.05s' }}>
                            {look.sectionHeader === 'plain' ? (
                                <h1 className="menu-h" style={{ fontSize: 'clamp(2rem, 8vw, 3.1rem)', textAlign: centered ? 'center' : 'left' }}>
                                    {category?.name || 'Prodotti'}
                                </h1>
                            ) : (
                                <MenuSectionHeading
                                    as="h1"
                                    title={category?.name || 'Prodotti'}
                                    centered={centered}
                                    fontSize="clamp(2rem, 8vw, 3.1rem)"
                                    index={categoryIndex > 0 ? categoryIndex : undefined}
                                />
                            )}
                            {category?.description && (
                                <p
                                    className={`${look.sectionHeader === 'plain' ? 'mt-2' : 'mt-4'} ${centered ? 'mx-auto' : ''}`}
                                    style={{ color: 'var(--menu-muted)', fontSize: '0.92rem', lineHeight: 1.5, maxWidth: '34rem', fontStyle: look.headingStyle === 'italic' ? 'italic' : 'normal' }}
                                >
                                    {category.description}
                                </p>
                            )}
                        </div>

                        <MenuRule className="mb-2" />

                        {visibleProducts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 menu-fade-in" style={{ animationDelay: '0.1s' }}>
                                <p
                                    className="menu-h"
                                    style={{ color: 'var(--menu-muted)', fontSize: '1.4rem' }}
                                >
                                    Nessun piatto disponibile
                                </p>
                                {selectedAllergens.length > 0 && (
                                    <p
                                        className="mt-2"
                                        style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)', fontSize: '0.82rem', opacity: 0.7 }}
                                    >
                                        Prova a rimuovere i filtri allergeni.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className={`menu-fade-in ${listClass}`}>
                                {visibleProducts.map((dish, i) => (
                                    <div
                                        key={dish.id}
                                        style={
                                            look.productLayout === 'menu' || look.productLayout === 'twocol'
                                                ? { borderBottom: `1px ${look.divider === 'dashed' ? 'dashed' : 'solid'} var(--menu-border)` }
                                                : undefined
                                        }
                                    >
                                        {look.productLayout === 'centered' && i > 0 && <MenuRule className="my-1" />}
                                        <ProductListItem
                                            product={dish}
                                            index={i + 1}
                                            onClick={() => {
                                                setSelectedDish(dish);
                                                setIsDrawerOpen(true);
                                            }}
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </MenuSearch>

                    <MenuAllergenFooter
                        showFrozenLegend={hasFrozenProducts}
                        align={centered ? 'center' : 'left'}
                        className="mt-10 space-y-1"
                    />
                </main>
            </div>

            <AllergenModal
                isOpen={isAllergenModalOpen}
                onClose={() => setIsAllergenModalOpen(false)}
                onApplyFilters={selected => {
                    setSelectedAllergens(selected);
                    setIsAllergenModalOpen(false);
                }}
            />

            <ProductCustomizationDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                dish={selectedDish ? (productsMap.get(selectedDish.id) ?? selectedDish) : null}
                waiter={window.location.href.toLowerCase().includes('/waiters/')}
            />
        </div>
    );
};

export default ClientProductsPage;
