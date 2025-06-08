import React, {useState, useEffect, useContext} from 'react';
import { CustomDish } from '../Client/Pages/ProductsPage';
import {ProductCard, ProductDto} from "../types";
import {useData} from "../Context/DataContext";
import {ThemeContext} from "../Context/ThemeContext";
import {addProductToCart} from "../Utilities/Utilities";
import {useNotification} from "../Context/NotificationContext";
import {selectOptions} from "@testing-library/user-event/dist/select-options";

interface ProductCustomizationDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    dish: null | ProductDto;
    onAddToCart: (dish: CustomDish) => void;
    waiter: boolean
}

const ProductCustomizationDrawer: React.FC<ProductCustomizationDrawerProps> = ({
                                                                                   isOpen,
                                                                                   onClose,
                                                                                   dish,
                                                                                   waiter
                                                                               }) => {
    const [selectedIngredients, setSelectedIngredients] = useState<number[]>(dish?.ingredients || []);
    //const [selectedIngredientsPlus, setSelectedIngredientsPlus] = useState<number[]>([]);
    //const [selectedIngredientsMinus, setSelectedIngredientsMinus] = useState<number[]>([]);
    const [note, setNote] = useState<string>('');
    const [selectedOption, setSelectedOption] = useState<string | null>(dish?.options.find(option => option.isDefault)?.name || null); // Per le opzioni del piatto
    const [quantity, setQuantity] = useState(1)
    const [selectedPrice, setSelectedPrice] = useState<number>(dish?.options.find(o => o.name === selectedOption)?.price || 0)

    const {ingredientsMap} = useData()
    const theme = useContext(ThemeContext)
    const { addNotification } = useNotification();

    useEffect(() => {
        if (dish) {
            console.log(dish)
            setSelectedIngredients(dish.ingredients || []);
            setNote('');
            const opt = dish.options.find(option => option.isDefault)
            setSelectedOption(opt?.name || null);
            setSelectedPrice(opt?.price || 0)
        }
    }, [dish]);

    // Aggiungi o rimuovi ingredienti
    const handleToggleIngredient = (ingredient: number) => {
        if(!dish?.ingredients.includes(ingredient)){
            // se non lo includeva il piatto originale, devo capire se sto aggiungendo o togliendo
            if(selectedIngredients.includes(ingredient)){
                setSelectedPrice(selectedPrice - (ingredientsMap.get(ingredient)?.price || 0))
            }else{
                setSelectedPrice(selectedPrice + (ingredientsMap.get(ingredient)?.price || 0))
            }
        }
        setSelectedIngredients(prev =>
            prev.includes(ingredient)
                ? prev.filter(i => i !== ingredient)
                : [...prev, ingredient]
        );
    };

    const changeOption = (option: string, price: number) => {
        setSelectedOption(option)
        const oldOptPrice = dish?.options.find(o => o.name === selectedOption)?.price;
        if(price && oldOptPrice)
            setSelectedPrice(selectedPrice + price - oldOptPrice)
    }

    // Aggiungi al carrello
    const handleAddToCart = () => {
        if (dish && selectedOption) {
            const ingredientsPlus: number[] = []
            const ingredientsMinus: number[] = []
            let price = selectedPrice
            const dishCopy = [...dish.ingredients]; // copia mutabile

            for (const ing of selectedIngredients) {
                const index = dishCopy.indexOf(ing);
                if (index !== -1) {
                    dishCopy.splice(index, 1); // rimuove una corrispondenza
                } else {
                    ingredientsPlus.push(ing); // mantiene duplicati
                    price += ingredientsMap.get(ing)?.price || 0;
                }
            }

            ingredientsMinus.push(...dishCopy);

            const productCart: ProductCard = {id: dish.id, quantity: quantity, optionName: selectedOption, ingredientsPlus: ingredientsPlus, ingredientsMinus: ingredientsMinus, price: price, note: note}

            const flag = waiter ? addProductToCart(productCart, "waiter") : addProductToCart(productCart);
            if(flag){
                addNotification({message: "Piatto aggiunto", type: "success"})
                resetAll()
                onClose()
            }else{
                addNotification({message: "Errore", type: "error"})
            }
        }
    };

    // Chiudi il drawer quando si clicca fuori dal contenuto
    const handleOverlayClick = (e: React.MouseEvent) => {
        if (e.target === e.currentTarget) onClose();
    };

    const resetAll = () => {
        setSelectedIngredients(dish?.ingredients || []);
        setNote('');
        const optionsPr = dish?.options.find(option => option.isDefault)
        setSelectedPrice(optionsPr?.price || 0)
        setSelectedOption(optionsPr?.name || null);
    }

    if (!dish) return null;

    return (
        <div
            className={`fixed inset-0 bg-gray-900 bg-opacity-50 ${isOpen ? 'block' : 'hidden'}`}
            onClick={handleOverlayClick}
        >
            <div className="w-full md:w-1/2 bg-white p-6 rounded-lg absolute top-1/2 left-1/2 transform -translate-x-1/2 transform -translate-y-1/2">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">{dish.name}</h2>
                    <button onClick={onClose} className="text-gray-500 text-xl">×</button>
                </div>

                {/* Seleziona opzione */}
                {dish.options && dish.options.length > 1 && (
                    <div className="mb-4">
                        <h3 className="font-medium text-lg text-gray-700">Scegli un'opzione:</h3>
                        <div className="flex flex-wrap gap-2">
                            {dish.options.map((option) => (
                                <button
                                    key={option.name}
                                    onClick={() => changeOption(option.name, option.price)}
                                    className={`px-4 py-2 rounded-full transition`}
                                    style={{
                                        color: (selectedOption === option.name) ? theme?.theme.colors.text2 + "" : theme?.theme.colors.text + "",
                                        backgroundColor: (selectedOption === option.name) ? theme?.theme.colors.color1 + "" : theme?.theme.colors.color3 + ""
                                }}
                                >
                                    {option.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Ingredienti personalizzati */}
                <div className="mb-4">
                    <h3 className="font-medium text-lg text-gray-700">Seleziona Ingredienti:</h3>
                    <div className="flex flex-wrap gap-2">
                        {Array.from(ingredientsMap.values()).filter(i => dish.ingredients.includes(i.id) || (i.addable && i.available)).map(i => i.id).map((ingredient) => (
                            <button
                                key={ingredient}
                                onClick={() => handleToggleIngredient(ingredient)}
                                className={`px-4 py-2 rounded-full transition`}
                                style={{
                                    color: (selectedIngredients.includes(ingredient)) ? theme?.theme.colors.text2 + "" : theme?.theme.colors.text + "",
                                    backgroundColor: (selectedIngredients.includes(ingredient)) ? theme?.theme.colors.color1 + "" : theme?.theme.colors.color3 + ""
                                }}
                            >
                                {ingredientsMap.get(ingredient)?.name}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Aggiungi una nota */}
                <div className="mb-4">
                    <label className="font-medium text-lg text-gray-700">Note:</label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full mt-2 p-2 border border-gray-300 rounded-lg"
                        placeholder="Inserisci delle note qui..."
                    />
                </div>

                {/* Prezzo e aggiungi al carrello */}
                <div className="flex justify-between items-center mb-6">
                    <p className="text-xl font-semibold" style={{color: theme?.theme.colors.color1 + ""}}>
                        {selectedPrice}€
                    </p>
                    <div className="flex flex-wrap gap-2 items-center">
                        <div>Quantita'</div>
                        <input type={"number"} style={{width: "50px", border: "1px solid black"}} value={quantity}/>
                        <button
                            onClick={handleAddToCart}
                            className="px-4 py-2 rounded-full"
                            style={{backgroundColor: theme?.theme.colors.color1 + "", color: theme?.theme.colors.text2 + ""}}
                        >
                            Aggiungi al carrello
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCustomizationDrawer;
