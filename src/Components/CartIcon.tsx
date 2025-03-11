import React from 'react';

interface CartIconProps {
    onClick: () => void;
}

const CartIcon: React.FC<CartIconProps> = ({ onClick }) => {
    return (
        <button></button>
    );
};

export default CartIcon;