// src/pages/client/ClientCategoriesPage.tsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useData } from '../../Context/DataContext';
import CustomLoading from '../../Components/CustomLoading';
import ClientStickyHeader from '../../Components/Client/ClientStickyHeader';
import ClientCategoriesList from '../../Components/Client/ClientCategoriesList';
import AllergenModal from '../../Components/Client/AllergenModal';
import useCartCount from '../../Utilities/useCartCount';
import { clearTableSession, getTableSession, resolveImageUrl } from '../../Utilities/Utilities';
import { lookupTableSessionApi } from '../../Utilities/api';

const ClientCategoriesPage: React.FC = () => {
    const { loading, categoriesMap, waiters, setSelectedAllergens, styles } = useData();
    const cartCount = useCartCount(waiters ? 'waiter' : undefined);
    const { localname } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [isAllergenModalOpen, setIsAllergenModalOpen] = useState(false);
    const [tableGateState, setTableGateState] = useState<'idle' | 'checking' | 'closed' | 'ok'>('idle');

    const primaryColor = styles?.primary?.trim() || '#f97316';

    useEffect(() => {
        const tableId = searchParams.get('table');
        if (tableId) localStorage.setItem('rf_table_id', tableId);

        if (!tableId || !localname || waiters) {
            setTableGateState('ok');
            return;
        }

        let cancelled = false;
        setTableGateState('checking');
        (async () => {
            const result = await lookupTableSessionApi(Number(tableId), localname);
            if (cancelled) return;
            if (!result.success || !result.data) {
                setTableGateState('ok');
                return;
            }
            const lookup = result.data;
            if (!lookup.busy) {
                clearTableSession();
                setTableGateState('closed');
                return;
            }
            const stored = getTableSession();
            const matches = stored && lookup.sessionId && stored.sessionId === lookup.sessionId && stored.tableId === Number(tableId);
            if (matches) {
                localStorage.setItem('rf_table_id', tableId);
                setTableGateState('ok');
            } else {
                clearTableSession();
                navigate(`/${localname}/table-access?table=${tableId}`, { replace: true });
            }
        })();

        return () => { cancelled = true; };
    }, [searchParams, localname, waiters, navigate]);

    const handleCategorySelect = (categoryId: number) => {
        const waitersUrl = waiters ? 'waiters/' : '';
        navigate(`/${waitersUrl}${localname}/products/${categoryId}`);
    };

    if (loading || tableGateState === 'checking') return <CustomLoading />;

    if (tableGateState === 'closed') {
        return (
            <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--menu-bg)' }}>
                <div className="max-w-sm w-full text-center p-6 rounded-2xl" style={{ background: 'var(--menu-surface)', border: '1px solid var(--menu-border)' }}>
                    <h1 className="font-semibold mb-2" style={{ color: 'var(--menu-text)', fontFamily: 'var(--menu-font-display)', fontSize: '1.4rem' }}>
                        Tavolo non aperto
                    </h1>
                    <p className="text-sm mb-5" style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)' }}>
                        Chiama il cameriere per ricevere la password e iniziare a ordinare.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-sm font-semibold"
                        style={{ background: primaryColor, color: 'var(--menu-accent-text)', fontFamily: 'var(--menu-font-body)' }}
                    >
                        Riprova
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ background: 'var(--menu-bg)', minHeight: '100vh' }}>
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
                        <div
                            className="absolute inset-0"
                            style={{ background: 'var(--menu-hero-gradient)' }}
                        />
                        <div
                            className="absolute bottom-0 left-0 right-0 px-6 pb-7 menu-fade-up"
                            style={{ animationDelay: '0.1s' }}
                        >
                            <p
                                className="uppercase tracking-widest mb-1"
                                style={{ color: 'var(--menu-accent)', fontFamily: 'var(--menu-font-body)', fontSize: '0.68rem', fontWeight: 700 }}
                            >
                                Il Menù
                            </p>
                            <h1
                                className="font-semibold leading-none"
                                style={{
                                    color: 'var(--menu-text)',
                                    fontFamily: 'var(--menu-font-display)',
                                    fontSize: 'clamp(1.6rem, 6vw, 2.6rem)',
                                }}
                            >
                                {styles?.restaurantName || localname}
                            </h1>
                            {styles?.address && (
                                <p
                                    className="mt-1"
                                    style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)', fontSize: '0.75rem' }}
                                >
                                    {styles.address}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Categories section */}
                    <div className="px-4 md:px-6 pt-6 pb-10">
                        <div
                            className="flex items-center gap-3 mb-5 menu-fade-up"
                            style={{ animationDelay: '0.18s' }}
                        >
                            <span
                                className="font-semibold"
                                style={{ color: 'var(--menu-text)', fontFamily: 'var(--menu-font-display)', fontSize: 'clamp(1.2rem, 4vw, 1.5rem)' }}
                            >
                                Scegli una categoria
                            </span>
                            <div className="flex-1 h-px" style={{ background: 'var(--menu-border)' }} />
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
