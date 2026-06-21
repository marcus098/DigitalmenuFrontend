import { useState, useEffect } from 'react';
import { getCartMap, CART_UPDATED_EVENT } from './Utilities';

const useCartCount = (cartName?: string): number => {
    const [count, setCount] = useState(0);

    useEffect(() => {
        const update = () => {
            const cart = getCartMap(cartName);
            const total = Object.values(cart).reduce((acc, item) => acc + item.quantity, 0);
            setCount(total);
        };
        update();
        window.addEventListener(CART_UPDATED_EVENT, update);
        return () => window.removeEventListener(CART_UPDATED_EVENT, update);
    }, [cartName]);

    return count;
};

export default useCartCount;
