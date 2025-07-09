import React from 'react';
import {CategoryDto} from "../types";

interface CategoriesListProps {
    categories: CategoryDto[];
    onSelectCategory: (categoryId: number) => void;
}

const ClientCategoriesList: React.FC<CategoriesListProps> = ({ categories, onSelectCategory }) => {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 p-4 md:p-6">
            {categories.filter(c => c.id > 0 && c.available).map((category) => (
                <div
                    key={category.id}
                    onClick={() => onSelectCategory(category.id)}
                    className="relative aspect-square rounded-xl shadow-lg overflow-hidden cursor-pointer group transition-transform duration-300 ease-in-out hover:scale-105"
                >
                    {/* Immagine di Sfondo */}
                    <img
                        src={category.image ? process.env.REACT_APP_BUCKET_URL + category.image : "/placeholder.png"}
                        alt={category.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    {/* Gradiente per leggibilità testo */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                    {/* Testo in sovrapposizione */}
                    <h2 className="absolute bottom-4 left-4 text-white text-xl font-bold">
                        {category.name}
                    </h2>
                </div>
            ))}
        </div>
    );
};

export default ClientCategoriesList;