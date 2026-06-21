import React from 'react';
import { OptionInProduct } from "../types";
import { Plus } from 'lucide-react';
import { useData } from '../Context/DataContext';

interface FoodCardProps {
    imageSrc: string;
    name: string;
    ingredients: string;
    options: OptionInProduct[];
    onAddToCart: () => void;
}

const ClientProductCard: React.FC<FoodCardProps> = ({ onAddToCart, imageSrc, name, ingredients, options }) => {
    const { styles } = useData();
    const primary = styles?.primary || '#fb923c';
    const textOnPrimary = styles?.textOnPrimary || '#ffffff';

    const defaultPrice = options.find(o => o.isDefault)?.price || options[0]?.price || 0;

    return (
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col group transition-all duration-300 hover:shadow-xl">
            <div className="aspect-video overflow-hidden">
                <img
                    src={imageSrc ? process.env.REACT_APP_BUCKET_URL + imageSrc : "/placeholder.png"}
                    alt={name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
            </div>

            <div className="p-4 flex flex-col flex-grow">
                <h2 className="text-lg font-bold text-gray-800">{name}</h2>
                <p className="text-sm text-gray-500 mt-1 line-clamp-2 flex-grow">{ingredients}</p>

                <div className="flex justify-between items-center mt-4">
                    <p className="text-xl font-extrabold text-gray-900">€ {defaultPrice.toFixed(2)}</p>
                    <button
                        onClick={onAddToCart}
                        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-opacity duration-200 hover:opacity-80"
                        style={{ backgroundColor: primary, color: textOnPrimary }}
                        title="Aggiungi e personalizza"
                    >
                        <Plus className="w-6 h-6" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ClientProductCard;
