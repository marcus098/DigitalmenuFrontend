// src/Components/ProductCustomizationDrawer.tsx

import React, {useState, useEffect, useContext, useMemo} from 'react';
import { ProductDto, IngredientDto, ProductCard } from "../types"; // Assicurati di avere tutti i tipi
import { useData } from "../Context/DataContext";
import { ThemeContext } from "../Context/ThemeContext";
import { addProductToCart } from "../Utilities/Utilities";
import { useNotification } from "../Context/NotificationContext";
import {XMarkIcon, PlusIcon, MinusIcon, ChevronDownIcon} from '@heroicons/react/24/solid';

// --- Componente interno per la riga di un ingrediente ---
const IngredientRow: React.FC<{
    name: string;
    price?: number;
    isSelected: boolean;
    onToggle: () => void;
}> = ({ name, price, isSelected, onToggle }) => (
    <div onClick={onToggle} className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
        <label htmlFor={`ing-${name}`} className="font-medium text-gray-700 cursor-pointer">{name}</label>
        <div className="flex items-center">
            {price !== undefined && price > 0 && (
                <span className="text-sm text-gray-500 mr-3">+ €{price.toFixed(2)}</span>
            )}
            <input
                id={`ing-${name}`}
                type="checkbox"
                checked={isSelected}
                readOnly
                className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary pointer-events-none"
            />
        </div>
    </div>
);


// --- Componente Principale del Drawer ---
interface ProductCustomizationDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    dish: ProductDto | null;
    waiter: boolean;
}

const ProductCustomizationDrawer: React.FC<ProductCustomizationDrawerProps> = ({ isOpen, onClose, dish, waiter }) => {
    // STATI
    const [selectedIngredients, setSelectedIngredients] = useState<number[]>([]);
    const [note, setNote] = useState<string>('');
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [totalPrice, setTotalPrice] = useState<number>(0);
    const [isExtrasOpen, setIsExtrasOpen] = useState(false);
    const [extraSearchTerm, setExtraSearchTerm] = useState('');

    const { ingredientsMap } = useData();
    const { addNotification } = useNotification();

    // EFFETTO PER INIZIALIZZARE LO STATO QUANDO IL PRODOTTO CAMBIA
    useEffect(() => {
        if (dish) {
            const defaultOpt = dish.options.find(o => o.isDefault) || dish.options[0];
            setSelectedIngredients(dish.ingredients || []);
            setNote('');
            setQuantity(1);
            setSelectedOption(defaultOpt?.name || null);
        }
    }, [dish]);

    // EFFETTO PER CALCOLARE IL PREZZO TOTALE IN TEMPO REALE
    useEffect(() => {
        if (!dish || !selectedOption) { setTotalPrice(0); return; }

        let singleUnitPrice = dish.options.find(o => o.name === selectedOption)?.price || 0;
        const baseIngredients = dish.ingredients || [];

        selectedIngredients.forEach(ingId => {
            if (!baseIngredients.includes(ingId)) {
                singleUnitPrice += ingredientsMap.get(ingId)?.price || 0;
            }
        });
        setTotalPrice(singleUnitPrice * quantity);
    }, [dish, selectedOption, selectedIngredients, quantity, ingredientsMap]);

    const includedIngredients = dish?.ingredients.map(id => ingredientsMap.get(id)).filter((i): i is IngredientDto => !!i) || [];
    const allExtraIngredients = Array.from(ingredientsMap.values()).filter(i => i.addable && i.available && !dish?.ingredients.includes(i.id));

    // === NUOVA LOGICA PER FILTRARE LE AGGIUNTE EXTRA IN BASE ALLA RICERCA ===
    const filteredExtraIngredients = useMemo(() => {
        if (!extraSearchTerm) {
            return allExtraIngredients;
        }
        return allExtraIngredients.filter(ing =>
            ing.name.toLowerCase().includes(extraSearchTerm.toLowerCase())
        );
    }, [allExtraIngredients, extraSearchTerm]);

    const selectedExtrasCount = selectedIngredients.filter(id => allExtraIngredients.some(extra => extra.id === id)).length;

    // FUNZIONE PER AGGIUNGERE/RIMUOVERE INGREDIENTI
    const handleToggleIngredient = (ingredientId: number) => {
        setSelectedIngredients(prev =>
            prev.includes(ingredientId)
                ? prev.filter(id => id !== ingredientId)
                : [...prev, ingredientId]
        );
    };

    // FUNZIONE PER CAMBIARE OPZIONE (es. Regular/Maxi)
    const changeOption = (optionName: string) => {
        setSelectedOption(optionName);
    };

    // FUNZIONE FINALE PER AGGIUNGERE AL CARRELLO
    const handleAddToCart = () => {
        if (!dish || !selectedOption) return;

        // Calcola in modo pulito gli ingredienti aggiunti e rimossi
        const baseIngredients = dish.ingredients || [];
        const ingredientsPlus = selectedIngredients.filter(id => !baseIngredients.includes(id));
        const ingredientsMinus = baseIngredients.filter(id => !selectedIngredients.includes(id));

        // Calcola il prezzo unitario (il prezzo totale già calcolato diviso per la quantità)
        const unitPrice = totalPrice / quantity;

        const productCart: ProductCard = {
            id: dish.id,
            quantity: quantity,
            optionName: selectedOption,
            ingredientsPlus: ingredientsPlus,
            ingredientsMinus: ingredientsMinus,
            price: unitPrice,
            note: note,
        };

        const flag = waiter ? addProductToCart(productCart, "waiter") : addProductToCart(productCart);
        if (flag) {
            addNotification({ message: "Prodotto aggiunto al carrello!", type: "success" });
            onClose(); // Chiudiamo il drawer dopo l'aggiunta
        } else {
            addNotification({ message: "Errore nell'aggiunta al carrello.", type: "error" });
        }
    };


    if (!isOpen || !dish) return null;

    // Filtriamo gli ingredienti per la visualizzazione
    const extraIngredients = Array.from(ingredientsMap.values()).filter(i => i.addable && i.available && !dish.ingredients.includes(i.id));

    return (
        <div className={`fixed inset-0 bg-black/60 z-50 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}>
            <div onClick={e => e.stopPropagation()}
                 className={`fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ease-in-out flex flex-col`}
                 style={{ maxHeight: '90vh' }}>

                <div className="p-4 border-b border-gray-200 shrink-0 relative">
                    <img src={dish.image ? process.env.REACT_APP_BUCKET_URL + dish.image : '/placeholder.png'} alt={dish.name} className="w-full h-40 object-cover rounded-xl mb-4"/>
                    <h2 className="text-2xl font-bold text-gray-800">{dish.name}</h2>
                    <button onClick={onClose} className="absolute top-4 right-4 bg-gray-200/70 p-2 rounded-full text-gray-600 hover:bg-gray-300 backdrop-blur-sm"><XMarkIcon className="w-6 h-6"/></button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    {dish.options && dish.options.length > 1 && dish.options[0].name !== 'default' && (
                        <div>
                            <h3 className="font-semibold text-lg text-gray-700 mb-2">Scegli un'opzione</h3>
                            <div className="flex flex-wrap gap-2">
                                {dish.options.map(option => (
                                    <button key={option.name} onClick={() => changeOption(option.name)}
                                            className={`px-4 py-2 text-sm font-bold rounded-full border-2 transition-colors ${selectedOption === option.name ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-200'}`}>
                                        {option.name} (€ {option.price.toFixed(2)})
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <h3 className="font-semibold text-lg text-gray-700 mb-2">Personalizza ingredienti</h3>
                        <div className="bg-slate-50 rounded-lg border divide-y divide-gray-200">
                            {includedIngredients.map(ingredient => (
                                <IngredientRow
                                    key={`incl-${ingredient.id}`}
                                    name={ingredient.name}
                                    isSelected={selectedIngredients.includes(ingredient.id)}
                                    onToggle={() => handleToggleIngredient(ingredient.id)}
                                />
                            ))}
                        </div>
                    </div>

                    {allExtraIngredients.length > 0 && (
                        <div>
                            {/* Header Cliccabile dell'Accordion */}
                            <button
                                onClick={() => setIsExtrasOpen(!isExtrasOpen)}
                                className="w-full flex justify-between items-center text-left p-3 bg-slate-100 rounded-lg border hover:bg-slate-200 transition-colors"
                            >
                                <div >
                                    <h3 className="font-semibold text-lg text-gray-700">Aggiunte extra</h3>
                                    {selectedExtrasCount > 0 && (
                                        <span className="text-sm font-bold text-primary">{selectedExtrasCount} selezionat{selectedExtrasCount > 1 ? 'e' : 'a'}</span>
                                    )}
                                </div>
                                <ChevronDownIcon className={`w-6 h-6 text-gray-500 transition-transform ${isExtrasOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Contenuto a Scomparsa */}
                            {isExtrasOpen && (
                                <div className="mt-2 p-4 border rounded-b-lg bg-slate-50/50">
                                    {/* Barra di Ricerca */}
                                    <input
                                        type="text"
                                        value={extraSearchTerm}
                                        onChange={e => setExtraSearchTerm(e.target.value)}
                                        className="input-style w-full mb-2"
                                        placeholder="Cerca aggiunta..."
                                    />
                                    {/* Lista filtrata */}
                                    <div className="max-h-48 overflow-y-auto divide-y divide-gray-200">
                                        {filteredExtraIngredients.map(ingredient => (
                                            <IngredientRow
                                                key={`extra-${ingredient.id}`}
                                                name={ingredient.name}
                                                price={ingredient.price}
                                                isSelected={selectedIngredients.includes(ingredient.id)}
                                                onToggle={() => handleToggleIngredient(ingredient.id)}
                                            />
                                        ))}
                                        {filteredExtraIngredients.length === 0 && (
                                            <p className="text-center text-sm text-gray-500 p-4">Nessuna aggiunta trovata.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    <div>
                        <label htmlFor="notes" className="font-semibold text-lg text-gray-700">Note speciali</label>
                        <textarea id="notes" value={note} onChange={e => setNote(e.target.value)} className="input-style mt-2 w-full" rows={2} placeholder="Es. ben cotto, senza sale..."/>
                    </div>
                </div>

                <div className="p-4 border-t border-gray-200 bg-white flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="bg-gray-200 w-10 h-10 rounded-full font-bold text-lg hover:bg-gray-300 transition-colors">-</button>
                        <span className="text-xl font-bold w-8 text-center">{quantity}</span>
                        <button onClick={() => setQuantity(q => q + 1)} className="bg-gray-200 w-10 h-10 rounded-full font-bold text-lg hover:bg-gray-300 transition-colors">+</button>
                    </div>
                    <button onClick={handleAddToCart} className="btn-primary flex-grow ml-4">
                        Aggiungi - € {totalPrice.toFixed(2)}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCustomizationDrawer;