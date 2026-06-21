// src/Components/CategoryCard.tsx
import React from "react";
import { Pencil, Trash2 } from "lucide-react";
import { useParams } from "react-router-dom";
import {CategoryDto, IS_ADMIN} from "../types";
import { useHistory } from "../Context/HistoryContext";
import PillToggle from "./Dashboard/PillToggle";
import {useLoginContext} from "../Context/LoginContext";

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
    const { navigateWithHistory } = useHistory();
    const defaultImage = "/noImage.jpg"; // Fallback se non c'è immagine
    const categoryImage = category.image ? process.env.REACT_APP_BUCKET_URL + category.image : defaultImage;
    const { checkVariable } = useLoginContext()

    return (
        <div className={`rounded-xl shadow-lg flex flex-col transition-all duration-300 ${
            category.available ? "bg-white" : "bg-gray-50 border-l-4 border-rose-400"
        }`}>
            {/* Sezione 1: Immagine e Informazioni */}
            <div className="p-4 flex items-center space-x-4">
                <img
                    src={categoryImage}
                    alt={category.name}
                    className="w-16 h-16 flex-shrink-0 object-cover rounded-lg border border-gray-200"
                />
                <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800">{category.name}</h3>
                    {category.description && (
                        <p className="text-sm text-gray-600 truncate">{category.description}</p>
                    )}
                </div>
            </div>

            {/* Sezione 2: Azioni e Disponibilità (con divisore) */}
            <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
                {/* Pill Toggle per la disponibilità */}
                <PillToggle
                    label="Disponibile"
                    enabled={category.available}
                    onChange={(value) => handleAvailable(category.id, value)}
                />
                {/* Pulsanti azione grandi e facili da premere */}
                <div className="flex items-center justify-end space-x-2 pt-2">
                    <button
                        className="p-3 rounded-full text-gray-500 hover:bg-gray-100 hover:text-primary transition"
                        title="Modifica"
                        onClick={() => navigateWithHistory(`/${localname}/Dashboard/Category/${category.id}`)}
                    >
                        <Pencil size={18} />
                    </button>
                    {checkVariable(IS_ADMIN) &&
                        <button
                            className="p-3 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-500 transition"
                            title="Elimina"
                            onClick={() => deleteCategory(category.id, category.name)}
                        >
                            <Trash2 size={18} />
                        </button>
                    }
                </div>
            </div>
        </div>
    );
};

export default CategoryCard;