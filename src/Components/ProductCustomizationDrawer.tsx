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
    <label
        className="menu-ingredient-row flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors"
    >
        <span className="font-medium" style={{ color: 'var(--menu-text)' }}>{name}</span>
        <div className="flex items-center">
            {price !== undefined && price > 0 && <span className="text-sm mr-3" style={{ color: 'var(--menu-muted)' }}>+ €{price.toFixed(2)}</span>}
            <input type="checkbox" checked={isSelected} onChange={onToggle} className="sr-only" />
            <div
                className="w-5 h-5 flex-shrink-0 rounded-md border-2 flex items-center justify-center"
                style={
                    isSelected
                        ? { background: 'var(--menu-accent)', borderColor: 'var(--menu-accent)' }
                        : { borderColor: 'var(--menu-border)', background: 'var(--menu-card)' }
                }
            >
                {isSelected && <svg className="w-3 h-3" style={{ color: 'var(--menu-accent-text)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
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
                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: "0%" }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", stiffness: 400, damping: 40 }}
                        onClick={e => e.stopPropagation()}
                        className="w-full max-h-[90vh] flex flex-col rounded-t-2xl md:rounded-2xl md:max-w-3xl md:h-auto md:max-h-[85vh]"
                        style={{ background: 'var(--menu-card)' }}
                    >

                        <div className="p-4 shrink-0 relative text-center" style={{ borderBottom: '1px solid var(--menu-border)' }}>
                            <div className="w-10 h-1.5 rounded-full mx-auto mb-3" style={{ background: 'var(--menu-border)' }}></div>
                            <h2 className="text-xl font-bold" style={{ color: 'var(--menu-text)' }}>{dish.name}</h2>
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 rounded-full hover:opacity-80"
                                style={{ background: 'var(--menu-surface)', color: 'var(--menu-muted)' }}
                            ><X className="w-5 h-5"/></button>
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
                                    <h3 className="font-semibold text-lg mb-3" style={{ color: 'var(--menu-text)' }}>Scegli un'opzione</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {dish.options.map(opt => (
                                            <button
                                                key={opt.name}
                                                onClick={() => changeOption(opt.name)}
                                                className="px-4 py-2 text-sm font-bold rounded-full border-2 transition-colors"
                                                style={
                                                    selectedOption === opt.name
                                                        ? { background: 'var(--menu-accent)', color: 'var(--menu-accent-text)', borderColor: 'var(--menu-accent)' }
                                                        : { background: 'var(--menu-card)', color: 'var(--menu-text)', borderColor: 'var(--menu-border)' }
                                                }
                                            >
                                                {opt.name} (€{opt.price.toFixed(2)})
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Ingredienti Inclusi */}
                            <div>
                                <h3 className="font-semibold text-lg mb-2" style={{ color: 'var(--menu-text)' }}>Ingredienti inclusi</h3>
                                <div className="rounded-lg" style={{ border: '1px solid var(--menu-border)' }}>
                                    {includedIngredients.map((ing, idx) => (
                                        <div key={`incl-${ing.id}`} style={idx > 0 ? { borderTop: '1px solid var(--menu-border)' } : undefined}>
                                            <IngredientRow name={ing.name} isSelected={selectedIngredients.includes(ing.id)} onToggle={() => handleToggleIngredient(ing.id)} />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* --- 4. GIÀ PRESENTE: Sezione per gli ingredienti extra --- */}
                            {allExtraIngredients.length > 0 && (
                                <div>
                                    <button onClick={() => setIsExtrasOpen(!isExtrasOpen)} className="w-full flex justify-between items-center text-left">
                                        <h3 className="font-semibold text-lg" style={{ color: 'var(--menu-text)' }}>Aggiunte extra</h3>
                                        <div className="flex items-center gap-2">
                                            {selectedExtrasCount > 0 && <span className="text-sm font-bold" style={{ color: 'var(--menu-accent)' }}>{selectedExtrasCount} selezionat{selectedExtrasCount > 1 ? 'e' : 'a'}</span>}
                                            <ChevronDown className={`w-5 h-5 transition-transform ${isExtrasOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--menu-muted)' }} />
                                        </div>
                                    </button>
                                    {isExtrasOpen && (
                                        <div className="mt-2">
                                            <div className="relative mb-2">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: 'var(--menu-muted)' }} />
                                                <input type="text" value={extraSearchTerm} onChange={e => setExtraSearchTerm(e.target.value)} className="dark-input w-full pl-10" placeholder="Cerca aggiunta..."/>
                                            </div>
                                            <div className="max-h-48 overflow-y-auto rounded-lg" style={{ border: '1px solid var(--menu-border)' }}>
                                                {filteredExtraIngredients.length > 0 ? filteredExtraIngredients.map((ing, idx) => (
                                                    <div key={`extra-${ing.id}`} style={idx > 0 ? { borderTop: '1px solid var(--menu-border)' } : undefined}>
                                                        <IngredientRow name={ing.name} price={ing.price} isSelected={selectedIngredients.includes(ing.id)} onToggle={() => handleToggleIngredient(ing.id)} />
                                                    </div>
                                                )) : <p className="text-center text-sm p-4" style={{ color: 'var(--menu-muted)' }}>Nessuna aggiunta trovata.</p>}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Note Speciali */}
                            <div>
                                <label htmlFor="notes" className="font-semibold text-lg" style={{ color: 'var(--menu-text)' }}>Note speciali</label>
                                <textarea id="notes" value={note} onChange={e => setNote(e.target.value)} className="dark-input mt-2 w-full" rows={2} placeholder="Es. ben cotto, senza sale..."/>
                            </div>
                        </div>

                        {/* Footer con azioni */}
                        <div
                            className="p-4 mt-auto backdrop-blur-sm flex justify-between items-center shrink-0"
                            style={{ borderTop: '1px solid var(--menu-border)', background: 'var(--menu-card)' }}
                        >
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                    className="w-11 h-11 rounded-full font-bold text-xl hover:opacity-80 transition-colors active:scale-95 flex items-center justify-center"
                                    style={{ background: 'var(--menu-surface)', color: 'var(--menu-text)' }}
                                ><Minus size={20}/></button>
                                <span className="text-xl font-bold w-8 text-center" style={{ color: 'var(--menu-text)' }}>{quantity}</span>
                                <button
                                    onClick={() => setQuantity(q => q + 1)}
                                    className="w-11 h-11 rounded-full font-bold text-xl hover:opacity-80 transition-colors active:scale-95 flex items-center justify-center"
                                    style={{ background: 'var(--menu-surface)', color: 'var(--menu-text)' }}
                                ><Plus size={20}/></button>
                            </div>
                            <button
                                onClick={handleAddToCart}
                                className="flex-grow ml-4 text-base px-5 py-2.5 rounded-lg shadow-md font-semibold transition-colors hover:opacity-90"
                                style={{ background: 'var(--menu-accent)', color: 'var(--menu-accent-text)' }}
                            >
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