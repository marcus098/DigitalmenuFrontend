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
import { ArrowLeft, ShieldAlert, ChefHat } from 'lucide-react';

const MENU_BG = '#17140f';

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
    const { productsMap, ingredientsMap, allergensMap, loading, setSelectedAllergens, styles } =
        useData();
    const cartCount = useCartCount();

    const primaryColor = styles?.primary?.trim() || '#f97316';

    useEffect(() => {
        document.body.style.backgroundColor = MENU_BG;
        return () => { document.body.style.backgroundColor = ''; };
    }, []);

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
                style={{ background: MENU_BG }}
            >
                <h2 className="font-cormorant font-semibold text-2xl" style={{ color: '#ede8da' }}>
                    Prodotto non trovato
                </h2>
                <button
                    onClick={() => navigate(-1)}
                    className="mt-4 px-6 py-2.5 rounded-xl font-nunito font-semibold text-white"
                    style={{ background: primaryColor }}
                >
                    Torna indietro
                </button>
            </div>
        );
    }

    const dishAllergens = Array.from(
        new Set(dish.ingredients.flatMap(ingId => ingredientsMap.get(ingId)?.allergens || []))
    )
        .map(allergenId => allergensMap.get(allergenId)?.name)
        .filter(Boolean) as string[];

    const imageUrl = dish.image
        ? `${process.env.REACT_APP_BUCKET_URL}${dish.image}`
        : null;

    const displayPrice = dish.options && dish.options.length > 0 ? dish.options[0].price : 0;

    return (
        <div style={{ background: MENU_BG, minHeight: '100vh' }}>
            <style>{`:root { --c-accent: ${primaryColor}; }`}</style>

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
                                style={{
                                    background:
                                        'linear-gradient(135deg, #2d2820 0%, #1a1510 100%)',
                                }}
                            >
                                <ChefHat
                                    className="w-24 h-24"
                                    style={{ color: 'rgba(201,168,76,0.2)' }}
                                />
                            </div>
                        )}

                        {/* Gradient overlay */}
                        <div
                            className="absolute inset-0"
                            style={{
                                background:
                                    'linear-gradient(to top, rgba(23,20,15,1) 0%, rgba(23,20,15,0.3) 60%, transparent 100%)',
                            }}
                        />
                    </motion.div>

                    <div className="px-4 md:px-6 -mt-4 relative z-10">
                        {/* Back button */}
                        <motion.button
                            variants={slideUp}
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 font-nunito text-sm font-medium mb-5"
                            style={{ color: '#8a7d6a', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                            whileHover={{ x: -3 } as any}
                            onHoverStart={e => { (e.target as any).style.color = '#ede8da'; }}
                            onHoverEnd={e => { (e.target as any).style.color = '#8a7d6a'; }}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Indietro
                        </motion.button>

                        {/* Name */}
                        <motion.h1
                            variants={slideUp}
                            className="font-cormorant font-semibold leading-tight"
                            style={{
                                color: '#ede8da',
                                fontSize: 'clamp(1.8rem, 6vw, 2.8rem)',
                            }}
                        >
                            {dish.name}
                        </motion.h1>

                        {/* Description */}
                        {dish.description && (
                            <motion.p
                                variants={slideUp}
                                className="font-nunito mt-3 leading-relaxed"
                                style={{ color: '#8a7d6a', fontSize: '0.9rem' }}
                            >
                                {dish.description}
                            </motion.p>
                        )}

                        {/* Ingredients */}
                        {dish.ingredients.length > 0 && (
                            <motion.div variants={slideUp} className="mt-5">
                                <p
                                    className="font-nunito text-xs font-bold uppercase tracking-widest mb-2"
                                    style={{ color: 'rgba(138,125,106,0.7)' }}
                                >
                                    Ingredienti
                                </p>
                                <p
                                    className="font-nunito"
                                    style={{ color: '#8a7d6a', fontSize: '0.85rem' }}
                                >
                                    {dish.ingredients
                                        .map(id => ingredientsMap.get(id)?.name)
                                        .filter(Boolean)
                                        .join(', ')}
                                </p>
                            </motion.div>
                        )}

                        {/* Allergens */}
                        {dishAllergens.length > 0 && (
                            <motion.div
                                variants={slideUp}
                                className="mt-4 flex items-start gap-3 p-3 rounded-xl"
                                style={{
                                    background: 'rgba(239,68,68,0.08)',
                                    border: '1px solid rgba(239,68,68,0.2)',
                                }}
                            >
                                <ShieldAlert
                                    className="w-5 h-5 flex-shrink-0 mt-0.5"
                                    style={{ color: '#f87171' }}
                                />
                                <div>
                                    <p
                                        className="font-nunito text-sm font-bold"
                                        style={{ color: '#fca5a5' }}
                                    >
                                        Allergeni presenti
                                    </p>
                                    <p
                                        className="font-nunito text-sm mt-0.5"
                                        style={{ color: '#f87171' }}
                                    >
                                        {dishAllergens.join(', ')}
                                    </p>
                                </div>
                            </motion.div>
                        )}

                        {/* Divider */}
                        <motion.div
                            variants={slideUp}
                            className="my-6"
                            style={{ height: 1, background: 'rgba(255,255,255,0.07)' }}
                        />

                        {/* Price + CTA */}
                        <motion.div
                            variants={slideUp}
                            className="flex items-center justify-between"
                        >
                            <div>
                                <p
                                    className="font-nunito text-xs uppercase tracking-widest mb-1"
                                    style={{ color: 'rgba(138,125,106,0.6)' }}
                                >
                                    Prezzo
                                </p>
                                <span
                                    className="font-cormorant font-bold"
                                    style={{
                                        color: primaryColor,
                                        fontSize: 'clamp(1.8rem, 5vw, 2.4rem)',
                                    }}
                                >
                                    €{displayPrice.toFixed(2)}
                                </span>
                                {dish.options && dish.options.length > 1 && (
                                    <p
                                        className="font-nunito text-xs"
                                        style={{ color: '#8a7d6a' }}
                                    >
                                        da
                                    </p>
                                )}
                            </div>

                            <ShimmerButton
                                onClick={() => setIsDrawerOpen(true)}
                                className="px-6 py-3.5 rounded-2xl text-white"
                                style={{
                                    background: `linear-gradient(135deg, ${primaryColor} 0%, #ea580c 100%)`,
                                    boxShadow: `0 6px 20px ${primaryColor}44`,
                                    fontSize: '0.9rem',
                                }}
                            >
                                Aggiungi al carrello
                            </ShimmerButton>
                        </motion.div>
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
