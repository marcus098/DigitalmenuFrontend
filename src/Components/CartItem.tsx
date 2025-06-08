import { Trash } from "lucide-react"
import * as React from 'react';
import {useData} from "../Context/DataContext";
import {useEffect, useState} from "react";
import {ProductCard, ProductDto} from "../types";

interface CartItemProps {
    productCard: ProductCard
    onRemove: () => void
}


const CartItem: React.FC<CartItemProps> = ({
                                               productCard,
                                               onRemove
                                           }) => {

    const {
        ingredientsMap,
        categoriesMap,
        productsMap,
        allergensMap,
        loading} = useData()
    const [product, setProduct] = useState<ProductDto | null>(null)

    useEffect(() => {
        setProduct(productsMap.get(productCard?.id) || null)
    }, []);

    const onChangeQuantity = (newQuantity: number) => {
        // todo modifica quantita
    }

    useEffect(() => {
        if(!loading)
            setProduct(productsMap.get(productCard.id) || null)
    }, [loading]);

    return ( <>
        {product === null || loading ? <></> :
        <div className="border rounded-2xl shadow-sm p-4 space-y-2 bg-white">
            <div className="text-xl font-semibold">
                    {product.name} {" "}
                    <span className="text-sm text-gray-500">{categoriesMap.get(product.idCategory)?.name || ""}</span>
            </div>
            {productCard.optionName !== "default" && <div className="text-sm text-gray-600">Opzione: {productCard.optionName}</div> }

            {productCard.ingredientsPlus.length > 0 && (
                <div className="text-sm text-green-700">+ {productCard.ingredientsPlus
                    .map(id => ingredientsMap.get(id)?.name ?? "")
                    .filter(name => name !== "")
                    .join(", ")}</div>
            )}

            {productCard.ingredientsMinus.length > 0 && (
                <div className="text-sm text-red-700">- {productCard.ingredientsPlus
                    .map(id => ingredientsMap.get(id)?.name ?? "")
                    .filter(name => name !== "")
                    .join(", ")}</div>
            )}

            <div className="flex items-center justify-between pt-2">
                <div className="flex items-center space-x-2">
                    <button onClick={() => onChangeQuantity(productCard.quantity - 1)} className="px-2 py-1 rounded bg-gray-200">-</button>
                    <span>{productCard.quantity}</span>
                    <button onClick={() => onChangeQuantity(productCard.quantity + 1)} className="px-2 py-1 rounded bg-gray-200">+</button>
                </div>
                <div className="text-lg font-medium">€{productCard.price.toFixed(2)}</div>
                <button onClick={onRemove} className="text-red-500 hover:text-red-700">
                    <Trash size={20} />
                </button>
            </div>
        </div>
        }
        </>
    )
}

export default CartItem