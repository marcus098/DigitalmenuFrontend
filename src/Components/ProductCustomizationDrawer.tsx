// src/Components/ProductCustomizationDrawer.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { ProductDto, IngredientDto, ProductCard } from "../types";
import { useData } from "../Context/DataContext";
import { addProductToCart } from "../Utilities/Utilities";
import { useNotification } from "../Context/NotificationContext";
import { AnimatePresence, motion } from 'framer-motion';
import { X, Plus, Minus, ChevronDown, Search, ShieldAlert } from 'lucide-react'; // Aggiunto ShieldAlert

// ... Componente IngredientRow (invariato)
const IngredientRow: React.FC<{ name: string; price?: number; isSelected: boolean; onToggle: () => void; }> = ({ name, price, isSelected, onToggle }) => (
    <label className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-zinc-100 transition-colors has-[:checked]:bg-amber-50">
        <span className="font-medium text-zinc-800">{name}</span>
        <div className="flex items-center">
            {price !== undefined && price > 0 && <span className="text-sm text-zinc-500 mr-3">+ €{price.toFixed(2)}</span>}
            <input type="checkbox" checked={isSelected} onChange={onToggle} className="sr-only" />
            <div className={`w-5 h-5 flex-shrink-0 rounded-md border-2 flex items-center justify-center ${isSelected ? 'bg-amber-500 border-amber-500' : 'border-zinc-300 bg-white'}`}>
                {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
            </div>
        </div>
    </label>
);


interface ProductCustomizationDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    dish: ProductDto | null;
    waiter: boolean;
}

const ProductCustomizationDrawer: React.FC<ProductCustomizationDrawerProps> = ({ isOpen, onClose, dish, waiter }) => {
    // STATI E LOGICA
    const [selectedIngredients, setSelectedIngredients] = useState<number[]>([]);
    const [note, setNote] = useState('');
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [totalPrice, setTotalPrice] = useState(0);
    const [isExtrasOpen, setIsExtrasOpen] = useState(true);
    const [extraSearchTerm, setExtraSearchTerm] = useState('');
    const { ingredientsMap, allergensMap } = useData(); // Aggiunto allergensMap
    const { addNotification } = useNotification();

    // ... useEffect e funzioni (invariate) ...
    useEffect(() => {
        if (dish) {
            const defaultOpt = dish.options.find(o => o.isDefault) || dish.options[0];
            setSelectedIngredients(dish.ingredients || []);
            setNote('');
            setQuantity(1);
            setSelectedOption(defaultOpt?.name || null);
            setIsExtrasOpen(true);
        }
    }, [dish]);
    useEffect(() => {
        if (!dish || !selectedOption) { setTotalPrice(0); return; }
        let singleUnitPrice = dish.options.find(o => o.name === selectedOption)?.price || 0;
        const baseIngredients = dish.ingredients || [];
        selectedIngredients.forEach(ingId => {
            if (!baseIngredients.includes(ingId)) singleUnitPrice += ingredientsMap.get(ingId)?.price || 0;
        });
        setTotalPrice(singleUnitPrice * quantity);
    }, [dish, selectedOption, selectedIngredients, quantity, ingredientsMap]);
    const handleToggleIngredient = (id: number) => setSelectedIngredients(p => p.includes(id) ? p.filter(i => i !== id) : [...p, id]);
    const changeOption = (name: string) => setSelectedOption(name);
    const handleAddToCart = () => {
        if (!dish || !selectedOption) return;
        const base = dish.ingredients || [];
        const productCart: ProductCard = { id: dish.id, quantity, optionName: selectedOption, price: totalPrice / quantity, note, ingredientsPlus: selectedIngredients.filter(id => !base.includes(id)), ingredientsMinus: base.filter(id => !selectedIngredients.includes(id)) };
        if (addProductToCart(productCart, waiter ? "waiter" : undefined)) {
            addNotification({ message: "Prodotto aggiunto!", type: "success" });
            onClose();
        } else {
            addNotification({ message: "Errore.", type: "error" });
        }
    };

    // --- 1. NUOVO: Calcolo e memorizzazione degli allergeni del prodotto ---
    const productAllergens = useMemo(() => {
        if (!dish) return [];
        const allergenIds = new Set<number>();
        dish.ingredients.forEach(ingId => {
            const ingredient = ingredientsMap.get(ingId);
            ingredient?.allergens?.forEach(allergenId => allergenIds.add(allergenId));
        });
        return Array.from(allergenIds).map(id => allergensMap.get(id)).filter(Boolean) as {id: number, name: string, icon: string}[];
    }, [dish, ingredientsMap, allergensMap]);

    const includedIngredients = useMemo(() => dish?.ingredients.map(id => ingredientsMap.get(id)).filter(Boolean) as IngredientDto[] || [], [dish, ingredientsMap]);
    const allExtraIngredients = useMemo(() => Array.from(ingredientsMap.values()).filter(i => i.addable && i.available && !dish?.ingredients.includes(i.id)), [dish, ingredientsMap]);
    const filteredExtraIngredients = useMemo(() => allExtraIngredients.filter(ing => ing.name.toLowerCase().includes(extraSearchTerm.toLowerCase())), [allExtraIngredients, extraSearchTerm]);
    const selectedExtrasCount = selectedIngredients.filter(id => !dish?.ingredients.includes(id)).length;

    return (
        <>
            {isOpen && dish && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-0 md:p-6">
                    <motion.div initial={{ y: "100%" }} animate={{ y: "0%" }} exit={{ y: "100%" }} transition={{ type: "spring", stiffness: 400, damping: 40 }} onClick={e => e.stopPropagation()} className="bg-white w-full max-h-[90vh] flex flex-col rounded-t-2xl md:rounded-2xl md:max-w-3xl md:h-auto md:max-h-[85vh]">

                        <div className="p-4 border-b border-zinc-200 shrink-0 relative text-center">
                            <div className="w-10 h-1.5 bg-zinc-300 rounded-full mx-auto mb-3"></div>
                            <h2 className="text-xl font-bold text-zinc-800">{dish.name}</h2>
                            <button onClick={onClose} className="absolute top-4 right-4 bg-zinc-100 p-2 rounded-full text-zinc-600 hover:bg-zinc-200"><X className="w-5 h-5"/></button>
                        </div>

                        <div className="p-6 space-y-6 overflow-y-auto">
                            {/* --- 2. NUOVO: Visualizzazione degli allergeni come "pills" --- */}
                            {productAllergens.length > 0 && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <h4 className="font-semibold text-red-800 flex items-center gap-2 mb-2">
                                        <ShieldAlert size={18} />
                                        <span>Contiene Allergeni</span>
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {productAllergens.map(allergen => (
                                            <div key={allergen.id} className="flex items-center gap-1.5 text-xs font-semibold bg-red-100 text-red-700 px-2 py-1 rounded-full">
                                                <img src={allergen.icon} alt={allergen.name} className="w-4 h-4" />
                                                <span>{allergen.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* --- 3. GIÀ PRESENTE: Sezione per la scelta delle opzioni --- */}
                            {dish.options && dish.options.length > 1 && dish.options[0].name !== 'default' && (
                                <div>
                                    <h3 className="font-semibold text-lg text-zinc-800 mb-3">Scegli un'opzione</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {dish.options.map(opt => (
                                            <button key={opt.name} onClick={() => changeOption(opt.name)} className={`px-4 py-2 text-sm font-bold rounded-full border-2 transition-colors ${selectedOption === opt.name ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-zinc-700 border-zinc-200'}`}>
                                                {opt.name} (€{opt.price.toFixed(2)})
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Ingredienti Inclusi */}
                            <div>
                                <h3 className="font-semibold text-lg text-zinc-800 mb-2">Ingredienti inclusi</h3>
                                <div className="rounded-lg border divide-y divide-zinc-200">
                                    {includedIngredients.map(ing => <IngredientRow key={`incl-${ing.id}`} name={ing.name} isSelected={selectedIngredients.includes(ing.id)} onToggle={() => handleToggleIngredient(ing.id)} />)}
                                </div>
                            </div>

                            {/* --- 4. GIÀ PRESENTE: Sezione per gli ingredienti extra --- */}
                            {allExtraIngredients.length > 0 && (
                                <div>
                                    <button onClick={() => setIsExtrasOpen(!isExtrasOpen)} className="w-full flex justify-between items-center text-left">
                                        <h3 className="font-semibold text-lg text-zinc-800">Aggiunte extra</h3>
                                        <div className="flex items-center gap-2">
                                            {selectedExtrasCount > 0 && <span className="text-sm font-bold text-amber-500">{selectedExtrasCount} selezionat{selectedExtrasCount > 1 ? 'e' : 'a'}</span>}
                                            <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform ${isExtrasOpen ? 'rotate-180' : ''}`} />
                                        </div>
                                    </button>
                                    {isExtrasOpen && (
                                        <div className="mt-2">
                                            <div className="relative mb-2">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                                                <input type="text" value={extraSearchTerm} onChange={e => setExtraSearchTerm(e.target.value)} className="input-style w-full pl-10" placeholder="Cerca aggiunta..."/>
                                            </div>
                                            <div className="max-h-48 overflow-y-auto border rounded-lg divide-y divide-zinc-200">
                                                {filteredExtraIngredients.length > 0 ? filteredExtraIngredients.map(ing => <IngredientRow key={`extra-${ing.id}`} name={ing.name} price={ing.price} isSelected={selectedIngredients.includes(ing.id)} onToggle={() => handleToggleIngredient(ing.id)} />) : <p className="text-center text-sm text-zinc-500 p-4">Nessuna aggiunta trovata.</p>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Note Speciali */}
                            <div>
                                <label htmlFor="notes" className="font-semibold text-lg text-zinc-800">Note speciali</label>
                                <textarea id="notes" value={note} onChange={e => setNote(e.target.value)} className="input-style mt-2 w-full" rows={2} placeholder="Es. ben cotto, senza sale..."/>
                            </div>
                        </div>

                        {/* Footer con azioni */}
                        <div className="p-4 mt-auto border-t border-zinc-200 bg-white/80 backdrop-blur-sm flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2">
                                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="bg-zinc-100 w-11 h-11 rounded-full font-bold text-xl hover:bg-zinc-200 transition-colors active:scale-95 flex items-center justify-center"><Minus size={20}/></button>
                                <span className="text-xl font-bold w-8 text-center">{quantity}</span>
                                <button onClick={() => setQuantity(q => q + 1)} className="bg-zinc-100 w-11 h-11 rounded-full font-bold text-xl hover:bg-zinc-200 transition-colors active:scale-95 flex items-center justify-center"><Plus size={20}/></button>
                            </div>
                            <button onClick={handleAddToCart} className="btn-primary flex-grow ml-4 text-base">
                                Aggiungi {quantity > 1 ? `${quantity} pz.` : ''} - €{totalPrice.toFixed(2)}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </>
    );
};

export default ProductCustomizationDrawer;