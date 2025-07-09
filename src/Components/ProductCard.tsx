// src/Components/ProductCard.tsx
import React from "react";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import { DraggableProvided } from "react-beautiful-dnd";
import {IS_ADMIN, ProductDto} from "../types";
import { useData } from "../Context/DataContext";
import { useHistory } from "../Context/HistoryContext";
import { useParams } from "react-router-dom";
import PillToggle from "./Dashboard/PillToggle";
import {useLoginContext} from "../Context/LoginContext";

interface ProductCardProps {
    provided: DraggableProvided; // Tipo corretto da react-beautiful-dnd
    product: ProductDto;
    handleToggleAvailability: (productId: number, value: boolean) => void;
    deleteProduct: (element: string, id: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
                                                     product,
                                                     provided,
                                                     handleToggleAvailability,
                                                     deleteProduct,
                                                 }) => {
    const defaultImage = "/noImage.jpg";
    const productImage = product.image ? process.env.REACT_APP_BUCKET_URL + product.image : defaultImage;
    const { localname } = useParams();
    const { navigateWithHistory } = useHistory();
    const { ingredientsMap } = useData();
    const { checkVariable } = useLoginContext()

    return (
        <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps} // Maniglia di trascinamento applicata all'intera card
            className={`rounded-xl shadow-lg flex flex-col transition-all duration-300 ${
                product.available ? "bg-white" : "bg-gray-50 border-l-4 border-rose-400"
            }`}
        >
            {/* Sezione 1: Immagine e Informazioni Principali */}
            <div className="p-4 flex items-start space-x-4">
                <img
                    src={productImage}
                    alt={product.name}
                    className="w-16 h-16 flex-shrink-0 object-cover rounded-lg border border-gray-200"
                />
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">{product.name}</h3>
                    <p className="text-base font-semibold text-primary">
                        € {product.options.find((o) => o.isDefault)?.price.toFixed(2)}
                    </p>
                    {product.ingredients && product.ingredients.length > 0 && (
                        <p className="text-sm text-gray-500 mt-1 truncate">
                            {product.ingredients.map(id => ingredientsMap.get(id)?.name).join(', ')}
                        </p>
                    )}
                </div>
            </div>

            {/* Sezione 2: Azioni e Disponibilità */}
            <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
                <PillToggle
                    label="Disponibile"
                    enabled={product.available}
                    onChange={(value) => handleToggleAvailability(product.id, value)}
                />
                <div className="flex items-center justify-end space-x-2 pt-2">
                    <button
                        className="p-3 rounded-full text-gray-500 hover:bg-gray-100 hover:text-primary transition"
                        title="Modifica"
                        onClick={() => navigateWithHistory((`/${localname}/Dashboard/product/${product.id}`) + (window.location.hash.replace('#', '').trim() !== "" ? window.location.hash : ""))}
                    >
                        <FaEdit size={18} />
                    </button>
                    {checkVariable(IS_ADMIN) && <button
                        className="p-3 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-500 transition"
                        title="Elimina"
                        onClick={() => deleteProduct(product.name, product.id)}
                    >
                        <FaTrashAlt size={18} />
                    </button>}
                </div>
            </div>
        </div>
    );
};

export default ProductCard;