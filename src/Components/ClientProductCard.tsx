import React, {useContext} from 'react';
import {OptionInProduct} from "../types";
import {ThemeContext} from "../Context/ThemeContext";

interface FoodCardProps {
    imageSrc: string;
    name: string;
    ingredients: string;
    options: OptionInProduct[];
    isNew?: boolean;
    isRecommended?: boolean;
    onAddToCart: () => void;
}

const ClientProductCard: React.FC<FoodCardProps> = ({
                                                        onAddToCart,
                                                        imageSrc,
                                                        name,
                                                        ingredients,
                                                        options,
                                                        isNew,
                                                        isRecommended,
                                                    }) => {
    const theme = useContext(ThemeContext)

    return (
        <div className="flex flex-col justify-between items-center w-[260px] p-5 rounded-2xl shadow-lg transition-transform transform hover:scale-105" style={{backgroundColor: theme?.theme.colors.color4 + ""}}>
            {/* Mostra l'immagine solo se è presente, altrimenti non verrà renderizzata */}
            {imageSrc && (
                <img
                    src={process.env.REACT_APP_BUCKET_URL + imageSrc}
                    alt={name}
                    className="w-full h-[160px] object-cover rounded-lg shadow-md mb-4"
                />
            )}

            {/* Dettagli del piatto */}
            <div className="flex flex-col flex-grow text-center">
                <h2 className="text-lg font-semibold mb-1" style={{color: theme?.theme.colors.color1 + ""}}>{name}</h2>
                <p className="text-sm font-light mb-2 line-clamp-2" style={{color: theme?.theme.colors.color1 + ""}}>{ingredients}</p>
                {options.length === 1 ?
                    <p className="text-lg font-bold mb-2" style={{color: theme?.theme.colors.color1 + ""}}>{options[0].price}</p>
                    :
                    <p className="text-lg font-bold mb-2" style={{color: theme?.theme.colors.color1 + ""}}>test</p>
                }


                {/* Etichetta "Nuovo" o "Consigliato" */}
                    <div className="flex justify-center space-x-2 mb-2">
                    {isNew && (
                        <span className="text-xs font-medium text-white py-1 px-2 rounded-full" style={{color: theme?.theme.colors.text1 + ""}}>
                            New
                        </span>
                    )}
                    {isRecommended && (
                        <span className="text-xs font-medium text-white py-1 px-2 rounded-full" style={{color: theme?.theme.colors.text1 + ""}}>
                            Recommended
                        </span>
                    )}
                </div>
            </div>

            {/* Bottone "Aggiungi al carrello" */}
            <button
                onClick={onAddToCart}
                className="w-full px-4 py-2 rounded-full mt-auto flex items-center justify-center transition" style={{backgroundColor: theme?.theme.colors.color1 + "", color: theme?.theme.colors.text1}}
            >
                <i className="fa-solid fa-cart-shopping text-lg mr-2"></i>
                Add to Cart
            </button>
        </div>
    );
};

export default ClientProductCard;
