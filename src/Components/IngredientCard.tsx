// src/Components/IngredientCard.tsx
import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useParams } from "react-router-dom";
import {IngredientDto, IS_ADMIN} from "../types";
import { useHistory } from "../Context/HistoryContext";
import { useData } from "../Context/DataContext";
import ToggleSwitch from "./ToggleSwitch";
import PillToggle from "./Dashboard/PillToggle";
import {useLoginContext} from "../Context/LoginContext"; // Importiamo il nuovo componente

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
    const { allergensMap } = useData();
    const { checkVariable } = useLoginContext()

    return (
        <div className={`rounded-xl shadow-lg flex flex-col transition-all duration-300 ${
            ingredient.available ? "bg-white" : "bg-gray-50 border-l-4 border-rose-400"
        }`}>
            {/* Sezione 1: Informazioni Principali */}
            <div className="p-4 flex items-center space-x-4">
                {/* Usiamo il colore primario per l'avatar per coerenza di brand */}
                <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-primary/20 rounded-lg">
                    <span className="text-xl font-bold text-primary">{ingredient.name[0]}</span>
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">
                        {ingredient.name}
                        {ingredient.frozen && <span className="text-blue-500 ml-1">*</span>}
                    </h3>
                    <p className="text-sm text-gray-600">Prezzo: €{ingredient.price.toFixed(2)}</p>
                </div>
                {/* Azioni Principali (Modifica/Elimina) */}
                <div className="flex items-center space-x-1">
                    <button
                        className="p-3 rounded-full text-gray-500 hover:bg-gray-100 hover:text-primary transition"
                        title="Modifica"
                        onClick={() => navigateWithHistory(`/${localname}/Dashboard/Ingredient/${ingredient.id}`)}
                    >
                        <Pencil size={18} />
                    </button>
                    {checkVariable(IS_ADMIN) && <button
                        className="p-3 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-500 transition"
                        title="Elimina"
                        onClick={() => deleteIngredient(ingredient.id, ingredient.name)}
                    >
                        <Trash2 size={18} />
                    </button>}
                </div>
            </div>

            {/* Sezione 2: Allergeni e Toggle (con divisore) */}
            <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
                {ingredient.allergens && ingredient.allergens.length > 0 && (
                    <div>
                        <h4 className="text-xs font-semibold text-gray-500 mb-2">ALLERGENI</h4>
                        <div className="flex flex-wrap gap-2">
                            {ingredient.allergens.map((allergenId) => (
                                <span key={allergenId}
                                      className="px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-xs font-medium">
                                    {allergensMap.get(allergenId)?.name || "N/D"}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Nuovi PillToggle */}
                <div className="space-y-3">
                    <PillToggle
                        label="Disponibile"
                        enabled={ingredient.available}
                        onChange={(value) => handleAvailableAddable(ingredient.id, value, true)}
                    />
                    <PillToggle
                        label="Aggiungibile"
                        enabled={ingredient.addable}
                        onChange={(value) => handleAvailableAddable(ingredient.id, value, false)}
                    />
                </div>
            </div>
        </div>
    );
};

export default IngredientCard;