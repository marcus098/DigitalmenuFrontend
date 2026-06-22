import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useNotification } from '../../Context/NotificationContext';
import { useData } from '../../Context/DataContext';
import { getCartMap, saveCart, emptyCart, CART_UPDATED_EVENT } from '../../Utilities/Utilities';
import { sendClientOrderApi, sendTakeawayOrderApi } from '../../Utilities/api';
import { ProductCard } from '../../types';

import CustomLoading from '../../Components/CustomLoading';
import ClientStickyHeader from '../../Components/Client/ClientStickyHeader';
import AllergenModal from '../../Components/Client/AllergenModal';
import ModernCartItem from '../../Components/Client/ModernCartItem';
import CartPopupWaiter from '../../Components/Waiters/CartPopupWaiter';
import ShimmerButton from '../../Components/ui/ShimmerButton';
import useCartCount from '../../Utilities/useCartCount';
import { ArrowLeft, ShoppingBasket, CheckCircle } from 'lucide-react';

interface CartPageProps {
    waiter: boolean;
}


const pageVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.07, delayChildren: 0.05 },
    },
};

const slideUp = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
    },
};

const CartPage: React.FC<CartPageProps> = ({ waiter }) => {
    const [cart, setCart] = useState<ProductCard[]>([]);
    const [isAllergenModalOpen, setIsAllergenModalOpen] = useState(false);
    const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [takeawayForm, setTakeawayForm] = useState({ name: '', phone: '', time: '' });

    const navigate = useNavigate();
    const { localname } = useParams();
    const { addNotification } = useNotification();
    const { loading, setSelectedAllergens, styles } = useData();
    const cartCount = useCartCount(waiter ? 'waiter' : undefined);

    const primaryColor = styles?.primary?.trim() || '#f97316';
    const isTakeaway = !waiter && !localStorage.getItem('rf_table_id');

    useEffect(() => {
        const storageKey = waiter ? 'waiter' : undefined;
        const cartFromStorage = getCartMap(storageKey);
        setCart(cartFromStorage ? Object.values(cartFromStorage) : []);
    }, [waiter]);

    const updateCartStateAndStorage = (newCart: ProductCard[]) => {
        const storageKey = waiter ? 'waiter' : undefined;
        if (saveCart(newCart, storageKey)) {
            setCart(newCart);
        } else {
            addNotification({ message: 'Errore nel salvataggio del carrello', type: 'error' });
        }
    };

    const removeItem = (id: string) =>
        updateCartStateAndStorage(cart.filter(i => i.id.toString() !== id));

    const updateItemQuantity = (id: string, qty: number) => {
        if (qty < 1) return;
        updateCartStateAndStorage(
            cart.map(i => (i.id.toString() === id ? { ...i, quantity: qty } : i))
        );
    };

    const handleOrder = async () => {
        if (waiter) { setIsOrderModalOpen(true); return; }

        const orders = cart.map(item => ({
            products: [{
                idProduct: item.id,
                productOption: item.optionName,
                note: item.note ?? '',
                quantity: item.quantity,
                ingredientsMinus: item.ingredientsMinus,
                ingredientsPlus: item.ingredientsPlus,
            }],
        }));

        if (isTakeaway) {
            if (!takeawayForm.name.trim() || !takeawayForm.phone.trim()) {
                addNotification({ message: 'Inserisci nome e telefono per procedere', type: 'error' });
                return;
            }
            setIsSubmitting(true);
            const result = await sendTakeawayOrderApi(localname!, {
                customerName: takeawayForm.name,
                customerPhone: takeawayForm.phone,
                pickupTime: takeawayForm.time || undefined,
                orders,
            });
            setIsSubmitting(false);
            if (result.success && result.data) {
                emptyCart();
                window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
                navigate(`/${localname}/order-status/${(result.data as any).data ?? result.data}`);
            } else {
                addNotification({ message: "Errore nell'invio dell'ordine. Riprova.", type: 'error' });
            }
            return;
        }

        const rawTableId = localStorage.getItem('rf_table_id');
        if (!rawTableId) {
            addNotification({ message: 'Scansiona il QR code del tuo tavolo per ordinare', type: 'error' });
            return;
        }
        setIsSubmitting(true);
        const result = await sendClientOrderApi(Number(rawTableId), orders);
        setIsSubmitting(false);
        if (result.success && result.data) {
            emptyCart();
            window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
            navigate(`/${localname}/order-status/${result.data}`);
        } else {
            addNotification({ message: "Errore nell'invio dell'ordine. Riprova.", type: 'error' });
        }
    };

    const total = useMemo(
        () => cart.reduce((acc, item) => acc + item.price * item.quantity, 0),
        [cart]
    );

    if (loading) return <CustomLoading />;

    return (
        <div style={{ background: 'var(--menu-bg)', minHeight: '100vh' }}>
            <div className="max-w-4xl mx-auto" style={{ minHeight: '100vh' }}>
                <ClientStickyHeader
                    restaurantName={styles?.restaurantName || localname || ''}
                    onAllergenClick={() => setIsAllergenModalOpen(true)}
                    onCartClick={() => {}}
                    cartItemCount={cartCount}
                    primaryColor={primaryColor}
                />

                <motion.main
                    className="px-4 md:px-6 pt-7 pb-16"
                    variants={pageVariants}
                    initial="hidden"
                    animate="show"
                >
                    <motion.button
                        variants={slideUp}
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-sm font-medium mb-6"
                        style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        whileHover={{ x: -3 } as any}
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Continua a ordinare
                    </motion.button>

                    <motion.h1
                        variants={slideUp}
                        className="font-semibold mb-1"
                        style={{
                            color: 'var(--menu-text)',
                            fontFamily: 'var(--menu-font-display)',
                            fontSize: 'clamp(2rem, 6vw, 2.8rem)',
                            lineHeight: 1.1,
                        }}
                    >
                        Il Tuo Ordine
                    </motion.h1>

                    {cart.length > 0 && (
                        <motion.p
                            variants={slideUp}
                            className="mb-6"
                            style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)', fontSize: '0.82rem' }}
                        >
                            {cart.length} {cart.length === 1 ? 'prodotto' : 'prodotti'} selezionati
                        </motion.p>
                    )}

                    <motion.div
                        variants={slideUp}
                        className="mb-6"
                        style={{ height: 1, background: 'var(--menu-border)' }}
                    />

                    {cart.length === 0 ? (
                        <motion.div
                            variants={slideUp}
                            className="flex flex-col items-center justify-center py-20 text-center"
                        >
                            <motion.div
                                animate={{ y: [0, -8, 0] }}
                                transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                            >
                                <ShoppingBasket
                                    className="w-20 h-20 mx-auto mb-5"
                                    style={{ color: 'var(--menu-muted)', opacity: 0.4 }}
                                />
                            </motion.div>
                            <h2
                                className="font-semibold"
                                style={{ color: 'var(--menu-text)', fontFamily: 'var(--menu-font-display)', fontSize: '1.6rem' }}
                            >
                                Il carrello è vuoto
                            </h2>
                            <p
                                className="mt-2"
                                style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)', fontSize: '0.85rem' }}
                            >
                                Aggiungi qualcosa di delizioso dal menù!
                            </p>
                        </motion.div>
                    ) : (
                        <>
                            <div className="flex flex-col gap-3">
                                {cart.map(item => (
                                    <ModernCartItem
                                        key={item.id}
                                        item={item}
                                        onRemove={() => removeItem(item.id.toString())}
                                        onQuantityChange={qty =>
                                            updateItemQuantity(item.id.toString(), qty)
                                        }
                                    />
                                ))}
                            </div>

                            <motion.div
                                variants={slideUp}
                                className="mt-8 pt-6"
                                style={{ borderTop: '1px solid var(--menu-border)' }}
                            >
                                {/* Takeaway form */}
                                {isTakeaway && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="mb-6 p-4 rounded-2xl"
                                        style={{
                                            background: 'var(--menu-surface)',
                                            border: '1px solid var(--menu-border)',
                                        }}
                                    >
                                        <p
                                            className="text-xs font-bold uppercase tracking-widest mb-3"
                                            style={{ color: 'var(--menu-accent)', fontFamily: 'var(--menu-font-body)' }}
                                        >
                                            Asporto — Dati di contatto
                                        </p>
                                        <div className="space-y-2">
                                            <input
                                                type="text"
                                                placeholder="Nome e Cognome *"
                                                value={takeawayForm.name}
                                                onChange={e =>
                                                    setTakeawayForm(f => ({ ...f, name: e.target.value }))
                                                }
                                                className="dark-input"
                                            />
                                            <input
                                                type="tel"
                                                placeholder="Telefono *"
                                                value={takeawayForm.phone}
                                                onChange={e =>
                                                    setTakeawayForm(f => ({ ...f, phone: e.target.value }))
                                                }
                                                className="dark-input"
                                            />
                                            <input
                                                type="time"
                                                placeholder="Orario ritiro"
                                                value={takeawayForm.time}
                                                onChange={e =>
                                                    setTakeawayForm(f => ({ ...f, time: e.target.value }))
                                                }
                                                className="dark-input"
                                            />
                                        </div>
                                    </motion.div>
                                )}

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between" style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)' }}>
                                        <span>Subtotale</span>
                                        <span>€{total.toFixed(2)}</span>
                                    </div>
                                    <div
                                        className="flex justify-between font-bold"
                                        style={{ color: 'var(--menu-text)', fontFamily: 'var(--menu-font-display)', fontSize: '1.5rem' }}
                                    >
                                        <span>Totale</span>
                                        <span>€{total.toFixed(2)}</span>
                                    </div>
                                </div>

                                <ShimmerButton
                                    onClick={handleOrder}
                                    disabled={isSubmitting}
                                    className="w-full py-4 rounded-2xl"
                                    style={{
                                        background: primaryColor,
                                        color: 'var(--menu-accent-text)',
                                        boxShadow: `0 8px 24px ${primaryColor}44`,
                                        fontSize: '1rem',
                                        fontFamily: 'var(--menu-font-body)',
                                    }}
                                >
                                    <CheckCircle className="w-5 h-5" />
                                    {isSubmitting
                                        ? 'Invio in corso...'
                                        : isTakeaway
                                        ? 'Invia Ordine Asporto'
                                        : 'Conferma Ordine'}
                                </ShimmerButton>
                            </motion.div>
                        </>
                    )}
                </motion.main>
            </div>

            <AllergenModal
                isOpen={isAllergenModalOpen}
                onClose={() => setIsAllergenModalOpen(false)}
                onApplyFilters={selected => {
                    setSelectedAllergens(selected);
                    setIsAllergenModalOpen(false);
                }}
            />

            {waiter && isOrderModalOpen && (
                <CartPopupWaiter cart={cart} close={() => setIsOrderModalOpen(false)} />
            )}
        </div>
    );
};

export default CartPage;
