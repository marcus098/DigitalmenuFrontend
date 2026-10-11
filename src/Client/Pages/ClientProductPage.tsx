import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '../../Context/DataContext';
import { ProductDto } from '../../types';
import CustomLoading from '../../Components/CustomLoading';
import ClientStickyHeader from '../../Components/Client/ClientStickyHeader';
import AllergenModal from '../../Components/Client/AllergenModal';
import ProductCustomizationDrawer from '../../Components/ProductCustomizationDrawer';
import ShimmerButton from '../../Components/ui/ShimmerButton';
import useCartCount from '../../Utilities/useCartCount';
import { ArrowLeft, ChefHat } from 'lucide-react';
import { FrozenMark, MenuAllergenDetails, MenuAllergenFooter } from '../../Components/Client/MenuAllergens';
import { getProductAllergens } from '../../Utilities/Utilities';

const pageVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.05 },
    },
};

const slideUp = {
    hidden: { opacity: 0, y: 24 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
    },
};

const ClientProductPage: React.FC = () => {
    const [dish, setDish] = useState<ProductDto | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isAllergenModalOpen, setIsAllergenModalOpen] = useState(false);

    const { idProduct, localname } = useParams();
    const navigate = useNavigate();
    const { productsMap, ingredientsMap, loading, setSelectedAllergens, styles } =
        useData();
    const cartCount = useCartCount();

    const primaryColor = styles?.primary?.trim() || '#f97316';

    useEffect(() => {
        if (!loading && idProduct) {
            setDish(productsMap.get(Number(idProduct)) || null);
        }
    }, [idProduct, productsMap, loading]);

    if (loading) return <CustomLoading />;

    if (!dish) {
        return (
            <div
                className="flex flex-col items-center justify-center min-h-screen"
                style={{ background: 'var(--menu-bg)' }}
            >
                <h2 className="font-semibold text-2xl" style={{ color: 'var(--menu-text)', fontFamily: 'var(--menu-font-display)' }}>
                    Prodotto non trovato
                </h2>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 px-6 py-2.5 rounded-xl font-semibold"
                    style={{ background: primaryColor, color: 'var(--menu-accent-text)', fontFamily: 'var(--menu-font-body)' }}
                >
                    Torna indietro
                </button>
            </div>
        );
    }

    // Surgelati: asterisco sul nome e sugli ingredienti, con legenda in fondo
    const { frozen } = getProductAllergens(dish, ingredientsMap);

    const imageUrl = dish.image
        ? `${process.env.REACT_APP_BUCKET_URL}${dish.image}`
        : null;

    const displayPrice = dish.options && dish.options.length > 0 ? dish.options[0].price : 0;

    return (
        <div style={{ background: 'var(--menu-bg)', minHeight: '100vh' }}>
            <div className="max-w-4xl mx-auto" style={{ minHeight: '100vh' }}>
                <ClientStickyHeader
                    restaurantName={styles?.restaurantName || ''}
                    onAllergenClick={() => setIsAllergenModalOpen(true)}
                    onCartClick={() => navigate(`/${localname}/cart`)}
                    cartItemCount={cartCount}
                    primaryColor={primaryColor}
                />

                <motion.main
                    variants={pageVariants}
                    initial="hidden"
                    animate="show"
                    className="pb-16"
                >
                    {/* Hero image */}
                    <motion.div
                        variants={{
                            hidden: { opacity: 0 },
                            show: { opacity: 1, transition: { duration: 0.6 } },
                        }}
                        className="relative overflow-hidden"
                        style={{ height: 'clamp(220px, 45vw, 320px)' }}
                    >
                        {imageUrl ? (
                            <motion.img
                                src={imageUrl}
                                alt={dish.name}
                                className="absolute inset-0 w-full h-full object-cover"
                                initial={{ scale: 1.06 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
                            />
                        ) : (
                            <div
                                className="absolute inset-0 flex items-center justify-center"
                                style={{ background: 'var(--menu-surface)' }}
                            >
                                <ChefHat
                                    className="w-24 h-24"
                                    style={{ color: 'var(--menu-accent)', opacity: 0.2 }}
                                />
                            </div>
                        )}

                        <div
                            className="absolute inset-0"
                            style={{ background: 'var(--menu-hero-gradient)' }}
                        />
                    </motion.div>

                    <div className="px-4 md:px-6 -mt-4 relative z-10">
                        <motion.button
                            variants={slideUp}
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 text-sm font-medium mb-5"
                            style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            whileHover={{ x: -3 } as any}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Indietro
                        </motion.button>

                        <motion.h1
                            variants={slideUp}
                            className="font-semibold leading-tight"
                            style={{
                                color: 'var(--menu-text)',
                                fontFamily: 'var(--menu-font-display)',
                                fontSize: 'clamp(1.8rem, 6vw, 2.8rem)',
                            }}
                        >
                            {dish.name}{frozen && <FrozenMark />}
                        </motion.h1>

                        {dish.description && (
                            <motion.p
                                variants={slideUp}
                                className="mt-3 leading-relaxed"
                                style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)', fontSize: '0.9rem' }}
                            >
                                {dish.description}
                            </motion.p>
                        )}

                        {dish.ingredients.length > 0 && (
                            <motion.div variants={slideUp} className="mt-5">
                                <p
                                    className="text-xs font-bold uppercase tracking-widest mb-2"
                                    style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)', opacity: 0.7 }}
                                >
                                    Ingredienti
                                </p>
                                <p
                                    style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)', fontSize: '0.85rem' }}
                                >
                                    {dish.ingredients
                                        .map(id => ingredientsMap.get(id))
                                        .filter(Boolean)
                                        .map(ing => ing!.name + (ing!.frozen ? '*' : ''))
                                        .join(', ')}
                                </p>
                            </motion.div>
                        )}

                        {/* Allergeni (prodotto ∪ ingredienti) e tracce */}
                        <motion.div variants={slideUp}>
                            <MenuAllergenDetails product={dish} className="mt-5" />
                        </motion.div>

                        <motion.div
                            variants={slideUp}
                            className="my-6"
                            style={{ height: 1, background: 'var(--menu-border)' }}
                        />

                        <motion.div
                            variants={slideUp}
                            className="flex items-center justify-between"
                        >
                            <div>
                                <p
                                    className="text-xs uppercase tracking-widest mb-1"
                                    style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)', opacity: 0.6 }}
                                >
                                    Prezzo
                                </p>
                                <span
                                    className="font-bold"
                                    style={{
                                        color: 'var(--menu-accent)',
                                        fontFamily: 'var(--menu-font-display)',
                                        fontSize: 'clamp(1.8rem, 5vw, 2.4rem)',
                                    }}
                                >
                                    €{displayPrice.toFixed(2)}
                                </span>
                                {dish.options && dish.options.length > 1 && (
                                    <p
                                        className="text-xs"
                                        style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)' }}
                                    >
                                        da
                                    </p>
                                )}
                            </div>

                            <ShimmerButton
                                onClick={() => setIsDrawerOpen(true)}
                                className="px-6 py-3.5 rounded-2xl"
                                style={{
                                    background: primaryColor,
                                    color: 'var(--menu-accent-text)',
                                    boxShadow: `0 6px 20px ${primaryColor}44`,
                                    fontSize: '0.9rem',
                                    fontFamily: 'var(--menu-font-body)',
                                }}
                            >
                                Aggiungi al carrello
                            </ShimmerButton>
                        </motion.div>

                        <MenuAllergenFooter showFrozenLegend={frozen} className="mt-10 space-y-1" />
                    </div>
                </motion.main>
            </div>

            <ProductCustomizationDrawer
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                dish={dish}
                waiter={window.location.href.toLowerCase().includes('/waiters/')}
            />

            <AllergenModal
                isOpen={isAllergenModalOpen}
                onClose={() => setIsAllergenModalOpen(false)}
                onApplyFilters={selected => setSelectedAllergens(selected)}
            />
        </div>
    );
};

export default ClientProductPage;
