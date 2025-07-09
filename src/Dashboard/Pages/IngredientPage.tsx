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
import PillToggle from "../../Components/Dashboard/PillToggle";

interface IngredientPageProps {
    isNew: boolean;
    ingredientDto?: IngredientDto;
}

interface IngredientPageProps {
    isNew: boolean;
}

const IngredientPage: React.FC<IngredientPageProps> = ({ isNew }) => {
    // La tua logica di stato è corretta e viene mantenuta
    const [id, setId] = useState<number>(0);
    const [name, setName] = useState<string>("");
    const [price, setPrice] = useState<number>(0);
    const [priceInput, setPriceInput] = useState<string>("");
    const [allergens, setAllergens] = useState<number[]>([]);
    const [frozen, setFrozen] = useState<boolean>(false);
    const [available, setAvailable] = useState<boolean>(true);
    const [addable, setAddable] = useState<boolean>(true);
    const [myLoading, setMyLoading] = useState<boolean>(true);
    const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

    const { loading, ingredientsMap, addIngredient, updateIngredient, allergensMap } = useData();
    const { idIngredient, localname } = useParams();
    const { navigateWithHistory, previousPath } = useHistory();
    const { addNotification } = useNotification();

    // Logica di caricamento dati (invariata)
    useEffect(() => {
        if (!loading) {
            if (!isNew && idIngredient && ingredientsMap.has(Number(idIngredient))) {
                const ingredient = ingredientsMap.get(Number(idIngredient))!;
                setId(ingredient.id);
                setName(ingredient.name);
                setPrice(ingredient.price);
                setPriceInput(String(ingredient.price));
                setAddable(ingredient.addable);
                setAllergens(ingredient.allergens || []);
                setAvailable(ingredient.available);
                setFrozen(ingredient.frozen);
            }
            setMyLoading(false);
        }
    }, [loading, isNew, idIngredient, ingredientsMap]);

    // Funzioni di supporto (invariate)
    const handlePriceChange = (value: string) => {
        setPriceInput(value);
        const parsedValue = parseFloat(value);
        setPrice(isNaN(parsedValue) ? 0 : parsedValue);
    };

    const resetFields = () => {
        setId(0); setName(""); setPrice(0); setPriceInput("");
        setAddable(true); setAllergens([]); setAvailable(true); setFrozen(false);
    };

    const handleNavigation = (path: string) => {
        if (previousPath && previousPath.includes(window.location.origin + "/" + localname + "/Dashboard")) {
            window.history.back();
        } else {
            navigateWithHistory(path);
        }
    };

    const handleAddOrRemove = (id: number) => {
        if (allergens.includes(id)) {
            setAllergens(allergens.filter(a => a !== id));
        } else {
            setAllergens([...allergens, id]);
        }
    };

    // Logica di salvataggio unificata
    const handleSave = async (andContinue: boolean = false) => {
        setMyLoading(true);
        let success = false;
        if (isNew) {
            success = await addIngredient({ name, addable, frozen, available, price, allergens });
        } else {
            success = await updateIngredient({ id, name, addable, frozen, available, price, allergens });
        }

        setMyLoading(false);
        if (success) {
            addNotification({ message: `Ingrediente ${isNew ? 'creato' : 'aggiornato'}!`, type: "success" });
            if (andContinue) {
                resetFields();
            } else {
                handleNavigation(`/${localname}/Dashboard/Ingredients`);
            }
        } else {
            addNotification({ message: "Errore durante il salvataggio.", type: "error" });
        }
    };

    if (loading) return <CustomLoading isFullPage />;

    return (
        <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
            {myLoading && <CustomLoading isTransparent={true} message={"Salvataggio..."} />}

            {/* Modale per gli allergeni */}
            {isModalOpen && (
                <ManageItemsModal
                    title="Gestisci Allergeni"
                    itemsMap={allergensMap}
                    selectedItems={allergens}
                    onChange={setAllergens}
                    onClose={() => setIsModalOpen(false)}
                />
            )}

            {/* --- Action Bar Superiore --- */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <button onClick={() => handleNavigation(`/${localname}/Dashboard/Ingredients`)} className="flex items-center gap-2 text-gray-500 hover:text-primary font-semibold transition-colors">
                        <FaArrowLeft />
                        <span>Torna a Ingredienti</span>
                    </button>
                    <h1 className="text-3xl font-bold text-gray-800 mt-1">
                        {isNew ? "Nuovo Ingrediente" : `Modifica: ${name}`}
                    </h1>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    {isNew ? (
                        <>
                            <button onClick={() => handleSave(false)} className="btn-primary w-full md:w-auto flex items-center justify-center"><FaSave className="mr-2"/>Salva e Chiudi</button>
                            <button onClick={() => handleSave(true)} className="btn-secondary w-full md:w-auto flex items-center justify-center"><FaPlus className="mr-2"/>Salva e Continua</button>
                        </>
                    ) : (
                        <button onClick={() => handleSave(false)} className="btn-primary w-full md:w-auto flex items-center justify-center"><FaSave className="mr-2"/>Salva Modifiche</button>
                    )}
                </div>
            </div>

            {/* --- Layout a Griglia --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Colonna Sinistra: Dati Principali */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Dettagli Ingrediente</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="ingredient-name" className="label-style">Nome Ingrediente</label>
                                <input type="text" id="ingredient-name" value={name} onChange={(e) => setName(e.target.value)} className="input-style" placeholder="Es. Mozzarella, Basilico..."/>
                            </div>
                            <div>
                                <label htmlFor="ingredient-price" className="label-style">Prezzo Aggiuntivo (€)</label>
                                <input type="number" id="ingredient-price" value={priceInput} onChange={(e) => handlePriceChange(e.target.value)} className="input-style" placeholder="0.00"/>
                            </div>
                        </div>
                        <div className="mt-6">
                            <h4 className="label-style mb-2"></h4>
                            <AllergenIngredientTagRow
                                color="orange"
                                handleAddOrRemove={(type, id) => handleAddOrRemove(id)}
                                name={"Allergeni"}
                                map={allergensMap}
                                elements={allergens}
                                openModal={() => setIsModalOpen(true)}
                            />
                        </div>
                    </div>
                </div>

                {/* Colonna Destra: Impostazioni */}
                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Impostazioni</h3>
                        <div className="space-y-4">
                            <PillToggle label="Disponibile nel menu" enabled={available} onChange={setAvailable}/>
                            <PillToggle label="Aggiungibile dal cliente" enabled={addable} onChange={setAddable}/>
                            <PillToggle label="Prodotto Surgelato" enabled={frozen} onChange={setFrozen}/>
                        </div>
                        <p className="text-xs text-gray-500 mt-4">Usa queste opzioni per controllare la visibilità e il comportamento dell'ingrediente.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IngredientPage;