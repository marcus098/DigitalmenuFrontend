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

const MENU_BG = '#17140f';

const ClientProductsPage: React.FC = () => {
    const [selectedDish, setSelectedDish] = useState<ProductDto | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isAllergenModalOpen, setIsAllergenModalOpen] = useState(false);

    const { loading, setSelectedAllergens, selectedAllergens, categoriesMap, productsMap, ingredientsMap, waiters, styles } = useData();
    const cartCount = useCartCount(waiters ? 'waiter' : undefined);
    const { idCategory, localname } = useParams();
    const navigate = useNavigate();

    /* fix flash of white on navigation */
    useEffect(() => {
        document.body.style.backgroundColor = MENU_BG;
        return () => { document.body.style.backgroundColor = ''; };
    }, []);

    /* trim to handle empty/whitespace primary from default StyleDto */
    const primaryColor = styles?.primary?.trim() || '#f97316';

    const currentCategoryId = Number(idCategory);
    const category = categoriesMap.get(currentCategoryId);

    const visibleProducts = Array.from(productsMap.values())
        .filter(p => p.idCategory === currentCategoryId)
        .filter(p => {
            if (selectedAllergens.length === 0) return true;
            const productAllergenIds = p.ingredients.flatMap(
                ingId => ingredientsMap.get(ingId)?.allergens ?? []
            );
            return !selectedAllergens.some(a => productAllergenIds.includes(a));
        });

    if (loading) return <CustomLoading />;

    return (
        <div style={{ background: MENU_BG, minHeight: '100vh' }}>
            <div className="max-w-4xl mx-auto" style={{ minHeight: '100vh' }}>

                {/* ── Main header (sticky top-0) ── */}
                <ClientStickyHeader
                    restaurantName={styles?.restaurantName || localname || ''}
                    onAllergenClick={() => setIsAllergenModalOpen(true)}
                    onCartClick={() => navigate(`/${localname}/cart`)}
                    cartItemCount={cartCount}
                    primaryColor={primaryColor}
                />

                {/* ── Category nav (sticky below header) ── */}
                <CategoryNavBar
                    categories={Array.from(categoriesMap.values())}
                    activeCategoryId={currentCategoryId}
                    onSelectCategory={newId => {
                        const base = waiters ? `/${localname}/waiters` : ``;
                        navigate(`${base}/${localname}/products/${newId}`);
                    }}
                    primaryColor={primaryColor}
                />

                {/* ── Page content ── */}
                <main className="px-4 md:px-6 pt-7 pb-12">

                    {/* Category title */}
                    <div
                        className="mb-6 menu-fade-up"
                        style={{ animationDelay: '0.05s' }}
                    >
                        <h1
                            className="font-cormorant font-semibold leading-none"
                            style={{
                                color: '#ede8da',
                                fontSize: 'clamp(2rem, 7vw, 3rem)',
                            }}
                        >
                            {category?.name || 'Prodotti'}
                        </h1>
                        {visibleProducts.length > 0 && (
                            <p
                                className="font-nunito mt-1.5"
                                style={{ color: '#8a7d6a', fontSize: '0.8rem' }}
                            >
                                {visibleProducts.length}{' '}
                                {visibleProducts.length === 1 ? 'piatto disponibile' : 'piatti disponibili'}
                            </p>
                        )}
                    </div>

                    {/* Divider */}
                    <div
                        className="mb-6"
                        style={{ height: 1, background: 'rgba(255,255,255,0.06)' }}
                    />

                    {/* Products */}
                    {visibleProducts.length === 0 ? (
                        <div
                            className="flex flex-col items-center justify-center py-20 menu-fade-in"
                            style={{ animationDelay: '0.1s' }}
                        >
                            <p
                                className="font-cormorant italic"
                                style={{ color: '#8a7d6a', fontSize: '1.5rem' }}
                            >
                                Nessun piatto disponibile
                            </p>
                            {selectedAllergens.length > 0 && (
                                <p
                                    className="font-nunito mt-2"
                                    style={{ color: '#5a5048', fontSize: '0.82rem' }}
                                >
                                    Prova a rimuovere i filtri allergeni.
                                </p>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 menu-stagger">
                            {visibleProducts.map(dish => (
                                <div key={dish.id} className="menu-fade-up">
                                    <ProductListItem
                                        product={dish}
                                        onClick={() => {
                                            setSelectedDish(dish);
                                            setIsDrawerOpen(true);
                                        }}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
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
                dish={selectedDish}
                waiter={window.location.href.toLowerCase().includes('/waiters/')}
            />
        </div>
    );
};

export default ClientProductsPage;
