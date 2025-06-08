import * as React from 'react';
import { useEffect, useState } from "react";
import { IngredientDto } from "../../types";
import CustomLoading from "../../Components/CustomLoading";
import { useData } from "../../Context/DataContext";
import { useParams } from "react-router-dom";
import ToggleSwitch from "../../Components/ToggleSwitch";
import {FaArrowLeft, FaPlus, FaSave} from "react-icons/fa";
import {useHistory} from "../../Context/HistoryContext";
import {useNotification} from "../../Context/NotificationContext";
import ManageItemsModal from "../../Components/Dashboard/ManageItemsModal";
import AllergenIngredientTagRow from "../../Components/AllergenIngredientTagRow";

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
    const [frozen, setFrozen] = useState<boolean>(isNew ? ingredientDto?.frozen || false : false);
    const [available, setAvailable] = useState<boolean>(isNew ? ingredientDto?.available || true : true);
    const [addable, setAddable] = useState<boolean>(isNew ? ingredientDto?.addable || true : true);
    const [myLoading, setMyLoading] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
    const [filter, setFilter] = useState("");

    const { loading, ingredientsMap, addIngredient, updateIngredient, allergensMap } = useData();
    const { idIngredient, localname } = useParams();
    const {navigateWithHistory} = useHistory()
    const {addNotification} = useNotification()

    const filteredOptions = () => {
        if (!allergensMap) return [];
        return Array.from(allergensMap.keys())
            .filter(id => allergensMap.get(id)?.name.toLowerCase().includes(filter.toLowerCase()));
    };

    const handleAddOrRemove = (id: number) => {
        if (allergens.includes(id)) {
            setAllergens(allergens.filter(a => a !== id));
        } else {
            setAllergens([...allergens, id]);
        }
    };

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

    const saveAndClose = async () => {
        const response: boolean = await handleSave()
        if(response){
            addNotification({message: "Ingrediente modificato", type: "success"})
            navigateWithHistory("/" + localname + "/Dashboard/Ingredients")
        }else{
            addNotification({message: "Errore", type: "error"})
        }
    }

    const saveAndContinue = async () => {
        const response: boolean = await handleSave()
        if(response){
            addNotification({message: "Ingrediente modificato", type: "success"})
            resetFields()
        }else{
            addNotification({message: "Errore", type: "error"})
        }
    }

    const resetFields = () => {
        setId( 0);
        setName("");
        setPrice(0);
        setPriceInput("");
        setAddable(true);
        setAllergens([]);
        setAvailable(true);
        setFrozen(false);
    }

    const handleSave = async (): Promise<boolean> => {
        setMyLoading(true);
        let value = false
        if (isNew) {
            value = await addIngredient({
                name,
                addable,
                frozen,
                available,
                price,
                allergens,
            });
        } else {
            value = await updateIngredient({
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
        return value
    };

    if (loading) return <CustomLoading isFullPage />;

    return (
        <div className="p-6">
            {isModalOpen && (
                <ManageItemsModal
                    title="Gestisci Allergeni"
                    itemsMap={allergensMap}
                    selectedItems={allergens}
                    onChange={setAllergens}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
            {myLoading && <CustomLoading isTransparent={true}/>}

            <div className="mb-6" style={{marginLeft: "-1.7rem", marginTop: "-2rem"}}>
                <button
                    className="flex items-center space-x-2 text-orange-500 hover:text-orange-700"
                    onClick={() => navigateWithHistory("/" + localname + "/Dashboard/Ingredients")}
                >
                    <FaArrowLeft size={20}/>
                    <span className="font-medium">Torna indietro</span>
                </button>
            </div>
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

            <div className="mt-10">
                <AllergenIngredientTagRow
                    color={"orange"}
                    openModal={() => setIsModalOpen(true)}
                    name={"Allergeni"}
                    elements={allergens}
                    map={allergensMap}
                    handleAddOrRemove={(type, id) => handleAddOrRemove(id)} />
            </div>

            {/* Pulsanti Finali */}
            <div className="mt-6 flex justify-end space-x-4">
                <button
                    className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600"
                    onClick={() => saveAndClose()}
                >
                    <FaSave size={16}/>
                    <span>Salva e Torna Indietro</span>
                </button>
                {isNew &&
                    <button
                        className="flex items-center space-x-2 bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600"
                        onClick={() => saveAndContinue()}
                    >
                        <FaPlus size={16}/>
                        <span>Salva e Aggiungi Altro</span>
                    </button>
                }
            </div>
        </div>
    );
};

export default IngredientPage;
