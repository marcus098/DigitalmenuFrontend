// src/pages/client/ClientCategoriesPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useData } from '../../Context/DataContext';
import CustomLoading from '../../Components/CustomLoading';
import ClientStickyHeader from '../../Components/Client/ClientStickyHeader';
import ClientCategoriesList from '../../Components/Client/ClientCategoriesList';
import AllergenModal from '../../Components/Client/AllergenModal';
import useCartCount from '../../Utilities/useCartCount';
import { resolveImageUrl } from '../../Utilities/Utilities';

const ClientCategoriesPage: React.FC = () => {
    const { loading, categoriesMap, waiters, setSelectedAllergens, styles } = useData();
    const cartCount = useCartCount(waiters ? 'waiter' : undefined);
    const { localname } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isAllergenModalOpen, setIsAllergenModalOpen] = useState(false);

    /* trim handles empty/whitespace primary from default StyleDto */
    const primaryColor = styles?.primary?.trim() || '#f97316';

    useEffect(() => {
        const tableId = searchParams.get('table');
        if (tableId) localStorage.setItem('rf_table_id', tableId);
    }, [searchParams]);

    /* fix flash of white on navigation */
    useEffect(() => {
        document.body.style.backgroundColor = '#17140f';
        return () => { document.body.style.backgroundColor = ''; };
    }, []);

    const handleCategorySelect = (categoryId: number) => {
        const waitersUrl = waiters ? 'waiters/' : '';
        navigate(`/${waitersUrl}${localname}/products/${categoryId}`);
    };

    if (loading) return <CustomLoading />;

    return (
        <div style={{ background: '#17140f', minHeight: '100vh' }}>
            {/* CSS custom property for accent color */}
            <style>{`:root { --c-accent: ${primaryColor}; }`}</style>

            <div className="max-w-4xl mx-auto" style={{ minHeight: '100vh' }}>
                <ClientStickyHeader
                    restaurantName={styles?.restaurantName || localname || ''}
                    onAllergenClick={() => setIsAllergenModalOpen(true)}
                    onCartClick={() => navigate(`/${localname}/cart`)}
                    cartItemCount={cartCount}
                    primaryColor={primaryColor}
                />

                <main>
                    {/* Hero */}
                    <div
                        className="relative overflow-hidden"
                        style={{ height: 'clamp(200px, 40vw, 300px)' }}
                    >
                        <img
                            src={resolveImageUrl(styles?.heroImageUrl, '/images/restaurant-background.jpg')}
                            alt={styles?.restaurantName || localname || ''}
                            className="absolute inset-0 w-full h-full object-cover menu-hero-img"
                        />
                        {/* Gradient overlay */}
                        <div
                            className="absolute inset-0"
                            style={{
                                background:
                                    'linear-gradient(to top, rgba(23,20,15,0.95) 0%, rgba(23,20,15,0.4) 55%, rgba(23,20,15,0.15) 100%)',
                            }}
                        />
                        {/* Hero content */}
                        <div
                            className="absolute bottom-0 left-0 right-0 px-6 pb-7 menu-fade-up"
                            style={{ animationDelay: '0.1s' }}
                        >
                            <p
                                className="font-nunito uppercase tracking-widest mb-1"
                                style={{ color: primaryColor, fontSize: '0.68rem', fontWeight: 700 }}
                            >
                                Il Menù
                            </p>
                            <h1
                                className="font-cormorant font-semibold leading-none"
                                style={{
                                    color: '#ede8da',
                                    fontSize: 'clamp(1.6rem, 6vw, 2.6rem)',
                                }}
                            >
                                {styles?.restaurantName || localname}
                            </h1>
                            {styles?.address && (
                                <p
                                    className="font-nunito mt-1"
                                    style={{ color: 'rgba(237,232,218,0.5)', fontSize: '0.75rem' }}
                                >
                                    {styles.address}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Categories section */}
                    <div className="px-4 md:px-6 pt-6 pb-10">
                        {/* Section label */}
                        <div
                            className="flex items-center gap-3 mb-5 menu-fade-up"
                            style={{ animationDelay: '0.18s' }}
                        >
                            <span
                                className="font-cormorant font-semibold"
                                style={{ color: '#ede8da', fontSize: 'clamp(1.2rem, 4vw, 1.5rem)' }}
                            >
                                Scegli una categoria
                            </span>
                            <div
                                className="flex-1 h-px"
                                style={{ background: 'rgba(255,255,255,0.07)' }}
                            />
                        </div>

                        <ClientCategoriesList
                            categories={Array.from(categoriesMap.values())}
                            onSelectCategory={handleCategorySelect}
                        />
                    </div>
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
        </div>
    );
};

export default ClientCategoriesPage;
