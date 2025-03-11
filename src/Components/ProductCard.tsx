import React from "react";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import { ProductDto } from "../types";
import { useData } from "../Context/DataContext";
import { useHistory } from "../Context/HistoryContext";
import { useParams } from "react-router-dom";

interface ProductCardProps {
    provided: any;
    product: ProductDto;
    selectedCategory: number;
    handleToggleAvailability: (productId: number, value: boolean) => void;
    deleteProduct: (element: string, id: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({
                                                     product,
                                                     provided,
                                                     selectedCategory,
                                                     handleToggleAvailability,
                                                     deleteProduct
                                                 }) => {
    const defaultImage = "https://via.placeholder.com/100"; // Immagine predefinita
    const productImage = product.image || defaultImage;
    const { localname } = useParams();
    const { navigateWithHistory } = useHistory();
    const {ingredientsMap, allergensMap} = useData()

    // Creiamo una stringa di allergeni separata da virgola, simile agli ingredienti
    const allergens = product.allergens ? product.allergens.join(", ") : "";
    const ingredients = product.ingredients ? product.ingredients.join(", ") : "";

    // Funzione per ottenere l'iniziale del nome del prodotto
    const getInitial = (name: string) => {
        return name ? name.charAt(0).toUpperCase() : "";
    };

    return (
        <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`p-5 rounded-xl shadow-md flex flex-col space-y-3 transition-all ${product.available ? "bg-white" : "bg-rose-100"}`}
        >
            {/* Immagine o iniziale del prodotto */}
            <div className="flex items-center space-x-4">
                <div className="w-14 h-14 flex items-center justify-center bg-gray-200 rounded-md border border-gray-300">
                    {/* Se non c'è l'immagine, mostra l'iniziale del nome */}
                    {product.image ? (
                        <img
                            src={productImage}
                            alt={product.name}
                            className="w-full h-full object-cover rounded-md"
                        />
                    ) : (
                        <span className="text-lg font-semibold text-gray-800">{getInitial(product.name)}</span>
                    )}
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">
                        {product.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                        {product.ingredients && product.ingredients.length > 0 && <>
                            Ingredienti:{" "}
                            {product.ingredients
                                .map((i) => ingredientsMap.get(i)?.name)
                                .join(", ")}
                            </>
                        }
                    </p>
                    <p className="text-sm text-gray-500">
                        {product.allergens && product.allergens.length > 0 &&
                            <>Allergeni:{" "}
                            {product.allergens
                                .map((i) => allergensMap.get(i)?.name)
                                .join(", ")}
                        </>}
                    </p>
                    <p className="text-sm text-gray-500">
                        {product.options.find((o) => o.isDefault)?.price}
                    </p>
                </div>
            </div>

            {/* Toggle Disponibilità */}
            <div className="flex justify-between items-center">
                <div className="space-x-2">
                    <button
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                            product.available ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-rose-500 text-white hover:bg-rose-600"
                        }`}
                        onClick={() => handleToggleAvailability(product.id, !product.available)}
                    >
                        {product.available ? "Disponibile" : "Non disponibile"}
                    </button>
                </div>

                {/* Pulsanti Azione */}
                <div className="flex items-center space-x-3">
                    <button
                        className="text-orange-500 hover:text-orange-700 p-2 rounded-full"
                        title="Modifica"
                        onClick={() =>
                            navigateWithHistory("/" + localname + "/Dashboard/product/" + product.id.toString() + "/")
                        }
                    >
                        <FaEdit size={16} />
                    </button>
                    <button
                        className="text-red-500 hover:text-red-700 p-2 rounded-full"
                        title="Elimina"
                        onClick={() => deleteProduct(product.name, product.id)}
                    >
                        <FaTrashAlt size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
