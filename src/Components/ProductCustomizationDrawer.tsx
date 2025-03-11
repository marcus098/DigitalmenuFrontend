import React, { useState } from "react";
import { FaTrash, FaPlus, FaMinus, FaTimes } from "react-icons/fa";
import { ProductDto } from "../types"; // Assicurati che questa importazione corrisponda al tuo tipo di prodotto

interface ProductCustomizationDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    dish: ProductDto | null;
    onAddToCart: (customDish: CustomDish) => void;
}

interface CustomDish extends ProductDto {
    ingredientsDifference: { id: number; quantity: number }[]; // Ingrediente con quantità
    quantity: number;
    notes: string;
}

const ProductCustomizationDrawer: React.FC<ProductCustomizationDrawerProps> = ({
                                                                                   isOpen,
                                                                                   onClose,
                                                                                   dish,
                                                                                   onAddToCart,
                                                                               }) => {
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [selectedIngredients, setSelectedIngredients] = useState<
        { id: number; quantity: number }[]
    >(dish?.ingredients?.map((id) => ({ id, quantity: 1 })) || []);
    const [quantity, setQuantity] = useState<number>(1);
    const [notes, setNotes] = useState<string>("");

    const allIngredients = [
        { id: 1, name: "Mozzarella" },
        { id: 2, name: "Pomodoro" },
        { id: 3, name: "Basilico" },
        { id: 4, name: "Olive" },
        // Altri ingredienti...
    ];

    const filteredIngredients = allIngredients.filter((ingredient) =>
        ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddIngredient = (id: number) => {
        const existing = selectedIngredients.find((ing) => ing.id === id);
        if (existing) {
            setSelectedIngredients(
                selectedIngredients.map((ing) =>
                    ing.id === id ? { ...ing, quantity: ing.quantity + 1 } : ing
                )
            );
        } else {
            setSelectedIngredients([...selectedIngredients, { id, quantity: 1 }]);
        }
    };

    const handleRemoveIngredient = (id: number) => {
        setSelectedIngredients(selectedIngredients.filter((ing) => ing.id !== id));
    };

    const handleDecreaseIngredient = (id: number) => {
        setSelectedIngredients(
            selectedIngredients
                .map((ing) =>
                    ing.id === id && ing.quantity > 1
                        ? { ...ing, quantity: ing.quantity - 1 }
                        : ing
                )
                .filter((ing) => ing.quantity > 0)
        );
    };

    const handleAddToCart = () => {
        if (dish) {
            const customDish: CustomDish = {
                ...dish,
                ingredientsDifference: selectedIngredients,
                quantity,
                notes,
            };
            onAddToCart(customDish);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-end">
            <div className="w-[400px] h-full bg-white shadow-xl p-6 flex flex-col transform transition-transform duration-300">
                {/* Header */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">{dish?.name}</h2>
                    <button className="text-gray-600 text-xl" onClick={onClose}>
                        <FaTimes />
                    </button>
                </div>

                {/* Search Bar */}
                <input
                    type="text"
                    className="w-full border rounded-lg px-3 py-2 mb-4"
                    placeholder="Cerca ingrediente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                {/* Ingredients Selection */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 overflow-y-auto max-h-64 border rounded-lg p-4 mb-4">
                    {filteredIngredients.map((ingredient) => (
                        <div
                            key={ingredient.id}
                            className="p-2 border rounded-lg text-center bg-gray-100 cursor-pointer hover:bg-blue-100"
                            onClick={() => handleAddIngredient(ingredient.id)}
                        >
                            {ingredient.name}
                        </div>
                    ))}
                </div>

                {/* Selected Ingredients */}
                <h3 className="text-lg font-semibold mb-2">Ingredienti selezionati:</h3>
                <ul className="mb-4 max-h-40 overflow-y-auto border rounded-lg p-4">
                    {selectedIngredients.map((ingredient) => {
                        const ingredientDetails = allIngredients.find(
                            (ing) => ing.id === ingredient.id
                        );
                        return (
                            <li
                                key={ingredient.id}
                                className="flex justify-between items-center py-2"
                            >
                <span className="text-gray-700">
                  {ingredientDetails?.name} x {ingredient.quantity}
                </span>
                                <div className="flex items-center gap-2">
                                    <button
                                        className="text-green-500 hover:text-green-700"
                                        onClick={() => handleAddIngredient(ingredient.id)}
                                    >
                                        <FaPlus />
                                    </button>
                                    <button
                                        className="text-yellow-500 hover:text-yellow-700"
                                        onClick={() => handleDecreaseIngredient(ingredient.id)}
                                    >
                                        <FaMinus />
                                    </button>
                                    <button
                                        className="text-red-500 hover:text-red-700"
                                        onClick={() => handleRemoveIngredient(ingredient.id)}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </li>
                        );
                    })}
                </ul>

                {/* Notes */}
                <div className="mb-6">
                    <label htmlFor="notes" className="block text-gray-700 font-semibold">
                        Note:
                    </label>
                    <textarea
                        id="notes"
                        className="w-full border rounded-lg px-3 py-2 text-sm"
                        rows={3}
                        placeholder="Aggiungi eventuali richieste o modifiche..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                </div>

                {/* Quantity */}
                <div className="mb-4">
                    <label htmlFor="quantity" className="block text-gray-700 font-semibold">
                        Quantità:
                    </label>
                    <input
                        id="quantity"
                        type="number"
                        className="w-20 border rounded-lg px-3 py-2 text-center"
                        min="1"
                        value={quantity}
                        onChange={(e) =>
                            setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                        }
                    />
                </div>

                {/* Add to Cart */}
                <button
                    className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 mt-auto"
                    onClick={handleAddToCart}
                >
                    Aggiungi al carrello
                </button>
            </div>
        </div>
    );
};

export default ProductCustomizationDrawer;
