import * as React from 'react';
import { useEffect, useState } from "react";
import { IngredientDto } from "../../types";
import CustomLoading from "../../Components/CustomLoading";
import { useData } from "../../Context/DataContext";
import { useParams } from "react-router-dom";
import ToggleSwitch from "../../Components/ToggleSwitch";

interface IngredientPageProps {
    isNew: boolean;
    ingredientDto?: IngredientDto;
}

const IngredientPage: React.FC<IngredientPageProps> = ({ isNew, ingredientDto }) => {
    const [id, setId] = useState<number>(0);
    const [name, setName] = useState<string>(isNew ? ingredientDto?.name || "" : "");
    const [price, setPrice] = useState<number>(isNew ? ingredientDto?.price || 0 : 0);
    const [priceInput, setPriceInput] = useState<string>(isNew ? (ingredientDto?.price?.toString() || "") : "");
    const [allergens, setAllergens] = useState<number[]>(isNew ? ingredientDto?.allergens || [] : []);
    const [frozen, setFrozen] = useState<boolean>(isNew ? ingredientDto?.frozen || true : true);
    const [available, setAvailable] = useState<boolean>(isNew ? ingredientDto?.available || true : true);
    const [addable, setAddable] = useState<boolean>(isNew ? ingredientDto?.addable || true : true);
    const [myLoading, setMyLoading] = useState<boolean>(true);

    const { loading, ingredientsMap, addIngredient, updateIngredient } = useData();
    const { idIngredient } = useParams();

    useEffect(() => {
        if (!loading) {
            if (!isNew) {
                const ingredient = ingredientsMap.get(Number(idIngredient));
                setId(ingredient?.id || 0);
                setName(ingredient?.name || "");
                setPrice(ingredient?.price || 0);
                setPriceInput((ingredient?.price || "").toString());
                setAddable(ingredient ? ingredient.addable : true);
                setAllergens(ingredient?.allergens || []);
                setAvailable(ingredient ? ingredient.available : true);
                setFrozen(ingredient ? ingredient.frozen : false);
            }
            setMyLoading(false);
        }
    }, [loading]);

    const handleToggle = (setter: React.Dispatch<React.SetStateAction<boolean>>) => {
        setter((prev) => !prev);
    };

    const handlePriceChange = (value: string) => {
        setPriceInput(value);
        const parsedValue = parseFloat(value);
        setPrice(isNaN(parsedValue) ? 0 : parsedValue);
    };

    const handleSave = async () => {
        setMyLoading(true);
        if (isNew) {
            await addIngredient({
                name,
                addable,
                frozen,
                available,
                price,
                allergens,
            });
        } else {
            await updateIngredient({
                id,
                name,
                addable,
                frozen,
                available,
                price,
                allergens,
            });
        }
        setMyLoading(false);
    };

    if (myLoading || loading) return <CustomLoading isFullPage />;

    return (
        <div className="p-6">
            <h1 className="text-3xl font-bold mb-6">{isNew ? "Aggiungi Ingrediente" : "Modifica Ingrediente"}</h1>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Nome */}
                <div>
                    <label className="block font-medium mb-1">Nome</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Prezzo */}
                <div>
                    <label className="block font-medium mb-1">Prezzo</label>
                    <input
                        type="text"
                        value={priceInput}
                        onChange={(e) => handlePriceChange(e.target.value)}
                        className="w-full p-3 border rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3 mt-6">
                {/* Disponibilità */}
                <ToggleSwitch
                    label="Disponibile"
                    value={available}
                    onToggle={() => handleToggle(setAvailable)}
                />

                {/* Aggiungibile */}
                <ToggleSwitch
                    label="Aggiungibile"
                    value={addable}
                    onToggle={() => handleToggle(setAddable)}
                />

                {/* Surgelato */}
                <ToggleSwitch
                    label="Surgelato"
                    value={frozen}
                    onToggle={() => handleToggle(setFrozen)}
                />
            </div>

            <button
                onClick={handleSave}
                className="mt-6 bg-green-500 text-white px-6 py-3 rounded-md shadow-lg hover:bg-green-600 transition-all"
            >
                Salva Ingrediente
            </button>
        </div>
    );
};

export default IngredientPage;
