import * as React from 'react';
import {useEffect, useState} from "react";
import {getCartMap} from "../../Utilities/Utilities";
import CustomButton from "../../Components/CustomButton";
import CartItem from "../../Components/CartItem";
import {ProductCard} from "../../types";
import CartPopupWaiter from "../../Components/Waiters/CartPopupWaiter";

interface CartPageProps {
    waiter: boolean
}

const CartPage: React.FC<CartPageProps> = ({waiter}) => {
    const [cart, setCart] = useState<ProductCard[]>([]);
    const [showPopup, setShowPopup] = useState<boolean>(false)

    useEffect(() => {
        const elements: ProductCard[] = []
        const tmp = waiter ? getCartMap("waiter") : getCartMap()
        if(tmp){
            for (const el in tmp){
                const value = tmp[el]
                elements.push({
                    id: value.id,
                    note: value.note,
                    price: value.price,
                    quantity: value.quantity,
                    ingredientsMinus: value.ingredientsMinus,
                    ingredientsPlus: value.ingredientsPlus,
                    optionName: value.optionName
                })
            }
        }
        setCart([...elements])
    }, []);

    const removeItem = (index: number) => {
        // todo
    };


    const handleOrder = () => {
        if (waiter) {
            setShowPopup(true)
        }
    };

    const handleClose = () => {
        if(waiter){
            setShowPopup(false)
        }
    }

    return(
            <div className="max-w-3xl mx-auto p-4 space-y-4">
                {showPopup && <CartPopupWaiter cart={cart} close={handleClose}/>}
                <h1 className="text-2xl font-bold mb-4">🛒 Il tuo carrello</h1>

                {cart.length === 0 ? (
                    <p className="text-gray-600">Il carrello è vuoto.</p>
                ) : (
                    cart.map((item, index) => (
                        <CartItem
                            key={index}
                            productCard={item}
                            onRemove={() => removeItem(index)}
                        />
                    ))
                )}

                <div className="border-t pt-4 mt-4 flex items-center justify-between">
                    <div className="text-xl font-bold">Totale: €{cart.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2)}</div>
                    <CustomButton
                        onClick={handleOrder}
                        label={"Procedi all'ordine"}/>
                </div>
            </div>
            )
}

export default CartPage;