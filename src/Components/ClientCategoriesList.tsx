import React from 'react';
import {CategoryDto} from "../types";
import {useNavigate, useParams} from "react-router-dom";


interface CategoriesListProps {
    categories: CategoryDto[];
    onSelectCategory: (categoryId: number) => void;
}

const ClientCategoriesList: React.FC<CategoriesListProps> = ({ categories, onSelectCategory }) => {

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 px-6 py-4">
            {categories.map((category) => (
                <div
                    key={category.id}
                    onClick={() => onSelectCategory(category.id)}
                    className="cursor-pointer p-4 bg-white rounded-lg shadow-md hover:shadow-lg hover:scale-105 transition transform duration-200 flex flex-col items-center"
                >
                    {category.image && (
                        <img
                            src={category.image}
                            alt={category.name}
                            className="w-16 h-16 mb-2 object-cover rounded-md"
                        />
                    )}
                    <h2 className="text-sm font-semibold text-gray-700 text-center">{category.name}</h2>
                </div>
            ))}
        </div>
    );
};

export default ClientCategoriesList;
