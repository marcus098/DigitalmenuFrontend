import React from "react";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import { useParams } from "react-router-dom";
import { IngredientDto } from "../types";
import { useHistory } from "../Context/HistoryContext";
import {useData} from "../Context/DataContext";

interface IngredientCardProps {
    ingredient: IngredientDto;
    handleAvailableAddable: (id: number, value: boolean, isAvailable: boolean) => void;
    deleteIngredient: (ingredientId: number, name: string) => void;
}

const IngredientCard: React.FC<IngredientCardProps> = ({
                                                           ingredient,
                                                           handleAvailableAddable,
                                                           deleteIngredient,
                                                       }) => {
    const { localname } = useParams();
    const { navigateWithHistory } = useHistory();
    const { allergensMap } = useData()

    const handleDelete = () => {
        deleteIngredient(ingredient.id, ingredient.name);
    };

    return (
        <div className={`p-5 rounded-xl shadow-md flex flex-col space-y-3 transition-all ${
            ingredient.available ? "bg-white" : "bg-rose-100"
        }`}>
            {/* Dettagli dell'ingrediente */}
            <div className="flex items-center space-x-4">
                <div className="w-14 h-14 flex items-center justify-center bg-gray-200 rounded-md border border-gray-300">
                    <span className="text-lg font-semibold text-gray-800">{ingredient.name[0]}</span>
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">
                        {ingredient.name + (ingredient.frozen ? "*" : "")}
                    </h3>
                    <p className="text-sm text-gray-600">Prezzo: € {ingredient.price.toFixed(2)}</p>
                </div>
            </div>

            {/* Visualizzazione degli allergeni */}
            {ingredient.allergens && ingredient.allergens.length > 0 && (
                <div className="mt-2">
                    <h4 className="text-sm font-medium text-gray-700">Allergeni:</h4>
                    <div className="flex flex-wrap space-x-2">
                        {ingredient.allergens.map((allergen, index) => (
                            <span
                                key={index}
                                className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium"
                            >
                                {allergensMap.get(allergen)?.name || ""}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Toggle Disponibilità e Addibilità */}
            <div className="flex justify-between items-center">
                <div className="space-x-2">
                    <button
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                            ingredient.available ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-rose-500 text-white hover:bg-rose-600"
                        }`}
                        onClick={() => handleAvailableAddable(ingredient.id, !ingredient.available, true)}
                    >
                        {ingredient.available ? "Disponibile" : "Non disponibile"}
                    </button>

                    <button
                        className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                            ingredient.addable ? "bg-amber-500 text-white hover:bg-amber-600" : "bg-rose-500 text-white hover:bg-rose-600"
                        }`}
                        onClick={() => handleAvailableAddable(ingredient.id, !ingredient.addable, false)}
                    >
                        {ingredient.addable ? "Aggiungibile" : "Non aggiungibile"}
                    </button>
                </div>

                {/* Pulsanti Azione */}
                <div className="flex items-center space-x-3">
                    <button
                        className="text-orange-500 hover:text-orange-700 p-2 rounded-full"
                        title="Modifica"
                        onClick={() =>
                            navigateWithHistory("/" + localname + "/Dashboard/Ingredient/" + ingredient.id.toString())
                        }
                    >
                        <FaEdit size={16} />
                    </button>
                    <button
                        className="text-red-500 hover:text-red-700 p-2 rounded-full"
                        title="Elimina"
                        onClick={handleDelete}
                    >
                        <FaTrashAlt size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IngredientCard;
