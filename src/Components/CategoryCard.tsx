import React from "react";
import { FaEdit, FaTrashAlt } from "react-icons/fa";
import { useParams } from "react-router-dom";
import { CategoryDto } from "../types";
import { useHistory } from "../Context/HistoryContext";

interface CategoryCardProps {
    category: CategoryDto;
    handleAvailable: (id: number, value: boolean) => void;
    deleteCategory: (categoryId: number, name: string) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
                                                       category,
                                                       handleAvailable,
                                                       deleteCategory,
                                                   }) => {
    const { localname } = useParams();
    const defaultImage = "/noImage.jpg";
    const categoryImage = category.image || defaultImage;
    const { navigateWithHistory } = useHistory();

    const handleDelete = () => {
        deleteCategory(category.id, category.name);
    };

    return (
        <div className={`p-5 rounded-xl shadow-md flex flex-col space-y-3 transition-all ${
            category.available ? "bg-white" : "bg-rose-100"
        }`}>
            {/* Immagine e dettagli */}
            <div className="flex items-center space-x-4">
                <div className="w-14 h-14">
                    <img
                        src={categoryImage ? process.env.REACT_APP_BUCKET_URL + categoryImage : ""}
                        alt={category.name}
                        className="w-full h-full object-cover rounded-md border border-gray-300"
                    />
                </div>
                <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">
                        {category.name}
                    </h3>
                    {category.description && (
                        <p className="text-sm text-gray-600">{category.description}</p>
                    )}
                </div>
            </div>

            {/* Toggle Disponibilità e Pulsanti */}
            <div className="flex justify-between items-center">
                <button
                    className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                        category.available
                            ? "bg-amber-500 text-white hover:bg-amber-600"
                            : "bg-rose-500 text-white hover:bg-rose-600"
                    }`}
                    onClick={() => handleAvailable(category.id, !category.available)}
                >
                    {category.available ? "Disponibile" : "Non disponibile"}
                </button>

                {/* Pulsanti Azione */}
                <div className="flex items-center space-x-3">
                    <button
                        className="text-orange-500 hover:text-orange-700 p-2 rounded-full"
                        title="Modifica"
                        onClick={() =>
                            navigateWithHistory(
                                `/${localname}/Dashboard/Category/${category.id}`
                            )
                        }
                    >
                        <FaEdit size={16} />
                    </button>
                    <button
                        className="text-red-500 hover:text-red-700 p-2 rounded-full"
                        title="Elimina"
                        onClick={handleDelete}
                    >
                        <FaTrashAlt size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CategoryCard;
