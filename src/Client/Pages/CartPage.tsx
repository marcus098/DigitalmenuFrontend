// src/pages/client/CartPage.tsx

import React, {useEffect, useMemo, useState} from 'react';
import {getCartMap, removeProductFromCart, saveCart, updateProductQuantity} from "../../Utilities/Utilities";
import CartItem from "../../Components/CartItem";
import { ProductCard } from "../../types";
import CartPopupWaiter from "../../Components/Waiters/CartPopupWaiter";
import ClientHeader from "../../Components/ClientHeader";
import { FaArrowLeft } from 'react-icons/fa';
import {useNavigate, useParams} from 'react-router-dom';
import {useNotification} from "../../Context/NotificationContext";
import {useData} from "../../Context/DataContext";
import CustomLoading from "../../Components/CustomLoading";

interface CartPageProps {
    waiter: boolean;
}

const CartPage: React.FC<CartPageProps> = ({ waiter }) => {
    const [cart, setCart] = useState<ProductCard[]>([]);
    const [showPopup, setShowPopup] = useState<boolean>(false);
    const navigate = useNavigate();
    const { localname } = useParams()
    const { addNotification } = useNotification()
    const { loading } = useData()

    // Carica il carrello all'avvio
    useEffect(() => {
        const cartFromStorage = waiter ? getCartMap("waiter") : getCartMap();
        setCart(cartFromStorage ? Object.values(cartFromStorage) : []);
    }, [waiter]);

    // Funzione per aggiornare sia lo stato che lo storage
    const updateCartStateAndStorage = (newCart: ProductCard[]) => {
        const storageKey = waiter ? "waiter" : undefined;
        const value = saveCart(newCart, storageKey);
        if(value)
            setCart(newCart);
        else
            addNotification({message: "Errore", type: "error"})
    }

    // --- LOGICA IMPLEMENTATA ---
    const removeItem = (itemIndex: number) => {
        const newCart = cart.filter((_, index) => index !== itemIndex);
        updateCartStateAndStorage(newCart);
    };

    const updateItemQuantity = (itemIndex: number, newQuantity: number) => {
        if (newQuantity < 1) return;
        const newCart = [...cart];
        newCart[itemIndex].quantity = newQuantity;
        updateCartStateAndStorage(newCart);
    };
    // -------------------------

    const handleOrder = () => {
        if (waiter) {
            setShowPopup(true);
        } else {
            navigate("/" + localname + '/checkout');
        }
    };

    const total = useMemo(() => {
        return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
    }, [cart]);

    return (
        <div className="flex flex-col bg-slate-100" style={{minHeight:'105vh'}}>
            {showPopup && <CartPopupWaiter cart={cart} close={() => setShowPopup(false)} />}

            {loading && <CustomLoading isTransparent={true} isFullPage={true} />}

            <ClientHeader localname="Riepilogo Ordine" />

            {/* Aggiungiamo un padding in basso al main per non far coprire i contenuti dal footer fisso */}
            <main className="flex-grow container mx-auto max-w-3xl p-4 space-y-4 pb-32">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-primary font-semibold transition-colors mb-4">
                    <FaArrowLeft />
                    <span>Continua a ordinare</span>
                </button>
                <h1 className="text-3xl font-bold mb-4 text-gray-800">🛒 Il tuo Carrello</h1>

                {cart.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
                        <p className="font-semibold text-xl text-gray-600">Il tuo carrello è vuoto</p>
                        <p className="text-gray-500 mt-2">Aggiungi qualcosa di buono dal nostro menu!</p>
                    </div>
                ) : (
                    cart.map((item, index) => (
                        <CartItem
                            key={`${item.id}-${item.optionName}-${index}`} // Chiave più robusta
                            productCard={item}
                            onRemove={() => removeItem(index)}
                            onQuantityChange={(newQuantity) => updateItemQuantity(index, newQuantity)}
                        />
                    ))
                )}
            </main>

            {/* --- FOOTER FISSO (STICKY) --- */}
            {cart.length > 0 && (
                <footer className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-primary/50 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
                    <div className="container mx-auto max-w-3xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Totale</p>
                            <div className="text-2xl md:text-3xl font-bold text-gray-900">€{total.toFixed(2)}</div>
                        </div>
                        <button onClick={handleOrder} className="btn-primary w-1/2 md:w-auto">
                            Procedi all'Ordine
                        </button>
                    </div>
                </footer>
            )}
        </div>
    );
};

export default CartPage;