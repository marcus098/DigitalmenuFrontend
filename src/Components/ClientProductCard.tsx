import React from 'react';

interface FoodCardProps {
    imageSrc: string;
    name: string;
    ingredients: string;
    price: string;
    isNew?: boolean;
    isRecommended?: boolean;
    onAddToCart: () => void;
}

const ClientProductCard: React.FC<FoodCardProps> = ({
                                                        onAddToCart,
                                                        imageSrc,
                                                        name,
                                                        ingredients,
                                                        price,
                                                        isNew,
                                                        isRecommended,
                                                    }) => {
    return (
        <div className="flex flex-col justify-between items-center w-[250px] h-[350px] p-4 bg-[#272524] rounded-lg shadow-md transition-transform transform hover:scale-105">
            {/* Immagine del piatto */}
            <img
                src={imageSrc}
                alt={name}
                className="w-full h-[150px] object-cover rounded-md shadow-sm mb-4"
            />

            {/* Dettagli del piatto */}
            <div className="flex flex-col flex-grow text-center">
                <h2 className="text-md font-semibold text-[#ff7c7d] mb-1">{name}</h2>
                <p className="text-sm font-light text-[#f8f8f8] mb-2 line-clamp-2">{ingredients}</p>
                <p className="text-md font-semibold text-[#ffda67] mb-2">{price}</p>

                {/* Etichetta "Nuovo" o "Consigliato" */}
                <div className="flex justify-center space-x-2 mb-2">
                    {isNew && (
                        <span className="text-xs font-medium text-white bg-[#ff7c7d] py-1 px-2 rounded-full">
                            New
                        </span>
                    )}
                    {isRecommended && (
                        <span className="text-xs font-medium text-white bg-[#ffda67] py-1 px-2 rounded-full">
                            Recommended
                        </span>
                    )}
                </div>
            </div>

            {/* Bottone "Aggiungi al carrello" */}
            <button
                onClick={onAddToCart}
                className="w-full bg-[#ff7c7d] text-white px-4 py-2 rounded-full mt-auto flex items-center justify-center hover:bg-[#e76768] transition"
            >
                <i className="fa-solid fa-cart-shopping text-lg mr-2"></i>
                Add to Cart
            </button>
        </div>
    );
};

export default ClientProductCard;
