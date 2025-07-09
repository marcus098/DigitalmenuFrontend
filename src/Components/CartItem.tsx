// src/Components/CartItem.tsx

import React, { useEffect, useState } from 'react';
import { useData } from "../Context/DataContext";
import { ProductCard, ProductDto } from "../types";
import { TrashIcon, PlusIcon, MinusIcon } from '@heroicons/react/24/solid';

interface CartItemProps {
    productCard: ProductCard;
    onRemove: () => void;
    onQuantityChange: (newQuantity: number) => void;
}

const CartItem: React.FC<CartItemProps> = ({ productCard, onRemove, onQuantityChange }) => {
    const { ingredientsMap, categoriesMap, productsMap, loading } = useData();
    const [product, setProduct] = useState<ProductDto | null>(null);

    useEffect(() => {
        if (!loading) {
            setProduct(productsMap.get(productCard.id) || null);
        }
    }, [loading, productsMap, productCard.id]);

    if (!product) {
        // Puoi mostrare uno scheletro di caricamento qui se preferisci
        return <div className="bg-white p-4 rounded-xl shadow-sm animate-pulse h-32"></div>;
    }

    return (
        <div className="bg-white rounded-2xl shadow-lg p-4 flex gap-4">
            {/* Immagine Prodotto */}
            <img
                src={product.image ? process.env.REACT_APP_BUCKET_URL + product.image : "/placeholder.png"}
                alt={product.name}
                className="w-24 h-24 md:w-28 md:h-28 object-cover rounded-xl flex-shrink-0"
            />

            {/* Dettagli e Azioni */}
            <div className="flex flex-col justify-between flex-grow">
                <div>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm text-gray-500">{categoriesMap.get(product.idCategory)?.name || ""}</p>
                            <h3 className="text-lg font-bold text-gray-800">{product.name}</h3>
                        </div>
                        <button onClick={onRemove} className="text-gray-400 hover:text-red-500 p-1">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Personalizzazioni */}
                    <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                        {productCard.optionName !== "default" && <p>Opzione: <span className="font-semibold">{productCard.optionName}</span></p>}
                        {productCard.ingredientsPlus.length > 0 && (
                            <p className="text-green-600">+ {productCard.ingredientsPlus.map(id => ingredientsMap.get(id)?.name).join(", ")}</p>
                        )}
                        {/* BUG CORRETTO: qui usiamo ingredientsMinus */}
                        {productCard.ingredientsMinus.length > 0 && (
                            <p className="text-red-600">- {productCard.ingredientsMinus.map(id => ingredientsMap.get(id)?.name).join(", ")}</p>
                        )}
                        {productCard.note && <p className="italic">Nota: "{productCard.note}"</p>}
                    </div>
                </div>

                {/* Prezzo e Quantità */}
                <div className="flex justify-between items-center mt-2">
                    <p className="text-xl font-extrabold text-primary">€{(productCard.price * productCard.quantity).toFixed(2)}</p>
                    <div className="flex items-center gap-2">
                        <button onClick={() => onQuantityChange(productCard.quantity - 1)} disabled={productCard.quantity <= 1} className="bg-gray-200 w-8 h-8 rounded-full font-bold text-lg hover:bg-gray-300 disabled:opacity-50">-</button>
                        <span className="text-lg font-bold w-8 text-center">{productCard.quantity}</span>
                        <button onClick={() => onQuantityChange(productCard.quantity + 1)} className="bg-gray-200 w-8 h-8 rounded-full font-bold text-lg hover:bg-gray-300">+</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartItem;