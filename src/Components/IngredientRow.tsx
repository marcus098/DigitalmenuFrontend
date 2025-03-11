import React, { useState } from "react";
import { IngredientDto } from "../types";
import ToggleSwitch from "./ToggleSwitch";
import { useData } from "../Context/DataContext";

interface IngredientRowProps {
    ingredient: IngredientDto;
    setEditIngredient: (idIngredient: number) => void;
}

const IngredientRow: React.FC<IngredientRowProps> = ({
                                                         ingredient,
                                                         setEditIngredient,
                                                     }) => {
    const [available, setAvailable] = useState<boolean>(ingredient.available);
    const [addable, setAddable] = useState<boolean>(ingredient.addable);
    const [myLoading, setMyLoading] = useState<boolean>(false);

    const { changeAvailableAddable, deleteEntity } = useData();

    const handleToggleAddable = async (value: boolean) => {
        setMyLoading(true);
        await changeAvailableAddable({ entity: "ingredient" }, ingredient.id, value, true);
        setMyLoading(false);
    };

    const handleToggleAvailable = async (value: boolean) => {
        setMyLoading(true);
        await changeAvailableAddable({ entity: "ingredient" }, ingredient.id, value, false);
        setMyLoading(false);
    };

    const handleDeleteIngredient = async () => {
        setMyLoading(true);
        await deleteEntity(ingredient.id, { entity: "ingredient" });
        setMyLoading(false);
    };

    return (
        <div
            key={ingredient.id}
            className={`flex items-center p-4 rounded-lg shadow-md transition-colors ${
                available ? "bg-white" : "bg-gray-100"
            }`}
        >

            {/* Colonna centrale: dettagli */}
            <div className="flex-1">
                <h3 className={`text-lg font-medium ${available ? "text-black" : "text-gray-500"}`}>
                    {ingredient.name}
                </h3>
                <p className="text-sm text-gray-500">
                    Prezzo: €{ingredient.price.toFixed(2)} | {ingredient.frozen ? "Surgelato" : "Fresco"}
                </p>
                <p className="text-sm text-gray-500">
                    Allergeni: {ingredient.allergens.length > 0 ? ingredient.allergens.join(", ") : "Nessuno"}
                </p>
            </div>

            {/* Colonna destra: toggle e pulsanti */}
            <div className="flex flex-col items-end space-y-2">
                {/* Toggle Disponibile */}
                <ToggleSwitch
                    label=""
                    value={available}
                    onToggle={handleToggleAvailable}
                />

                {/* Toggle Aggiungibile
                <ToggleSwitch
                    label=""
                    value={addable}
                    onToggle={handleToggleAddable}
                />*/}

                {/* Pulsanti Modifica ed Elimina */}
                <div className="flex space-x-2">
                    <button
                        className="text-blue-500 hover:text-blue-700 p-2 rounded-full"
                        title="Modifica"
                        onClick={() => setEditIngredient(ingredient.id)}
                    >
                        ✏️
                    </button>
                    <button
                        className="text-red-500 hover:text-red-700 p-2 rounded-full"
                        title="Elimina"
                        onClick={handleDeleteIngredient}
                    >
                        🗑️
                    </button>
                </div>
            </div>
        </div>
    );
};

export default IngredientRow;
