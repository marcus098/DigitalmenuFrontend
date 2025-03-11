import React from "react";

interface Ingredient {
    name: string;
}

interface Option {
    size: string; // es. "Baby", "Normale", "Maxi"
    price: number;
}

interface Dish {
    id: number;
    name: string;
    description: string;
    price: number; // Prezzo base
    ingredients: Ingredient[];
    allergens: string[]; // Es. ["Glutine", "Lattosio"]
    image: string;
    options?: Option[]; // Opzioni facoltative
}

interface ClientProductPageProps {
    dish: Dish;
    addToCart: (dish: Dish, option?: Option) => void; // Funzione per aggiungere al carrello
}

const ClientProductPage: React.FC = () => {
    const dish = {
        id: 1,
        name: "Pizza Margherita",
        description: "Pizza classica con pomodoro, mozzarella e basilico fresco.",
        price: 7.99,
        ingredients: [
            { name: "Pomodoro" },
            { name: "Mozzarella" },
            { name: "Basilico" },
            { name: "Olio d'oliva" },
        ],
        allergens: ["Lattosio", "Glutine"],
        image: "https://via.placeholder.com/400x400?text=Pizza+Margherita",
        options: [
            { size: "Baby", price: 5.99 },
            { size: "Normale", price: 7.99 },
            { size: "Maxi", price: 10.99 },
        ],
    };

    const addToCart = () => {

    }
    return (
        <div className="min-h-screen bg-gradient-to-r from-blue-600 via-sky-400 to-cyan-200 flex justify-center items-center">
            <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl w-full">
                {/* Immagine del prodotto */}
                <div className="flex flex-col md:flex-row gap-6">
                    <img
                        src={dish.image}
                        alt={dish.name}
                        className="w-full md:w-1/2 h-72 object-cover rounded-lg shadow-md"
                    />

                    {/* Dettagli del prodotto */}
                    <div className="flex flex-col justify-between w-full">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-800">{dish.name}</h1>
                            <p className="text-gray-600 mt-2">{dish.description}</p>

                            {/* Allergeni */}
                            {dish.allergens && dish.allergens.length > 0 && (
                                <div className="mt-4">
                                    <h3 className="text-lg font-semibold text-gray-700">Allergeni</h3>
                                    <p className="text-sm text-gray-600">{dish.allergens.join(", ")}</p>
                                </div>
                            )}

                            {/* Ingredienti */}
                            <div className="mt-4">
                                <h3 className="text-lg font-semibold text-gray-700">Ingredienti</h3>
                                <p className="text-sm text-gray-600">
                                    {dish.ingredients.map((ingredient) => ingredient.name).join(", ")}
                                </p>
                            </div>
                        </div>

                        {/* Opzioni di dimensione */}
                        <div className="mt-6">
                            <h3 className="text-lg font-semibold text-gray-700">Opzioni</h3>
                            {dish.options ? (
                                <ul className="mt-2">
                                    {dish.options.map((option) => (
                                        <li
                                            key={option.size}
                                            className="flex justify-between items-center bg-gray-100 px-4 py-2 rounded-md mb-2"
                                        >
                                            <span>{option.size}</span>
                                            <span className="text-gray-800 font-semibold">
                                                € {option.price.toFixed(2)}
                                            </span>
                                            <button
                                                onClick={() => addToCart()}
                                                className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600 transition-all"
                                            >
                                                Aggiungi
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm text-gray-600">Taglia unica</p>
                            )}
                        </div>

                        {/* Prezzo base (se non ci sono opzioni) */}
                        {!dish.options && (
                            <div className="mt-6 flex justify-between items-center">
                                <span className="text-2xl font-bold text-gray-800">
                                    € {dish.price.toFixed(2)}
                                </span>
                                <button
                                    onClick={() => addToCart()}
                                    className="bg-orange-500 text-white px-6 py-2 rounded-md hover:bg-orange-600 transition-all"
                                >
                                    Aggiungi al carrello
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClientProductPage;
