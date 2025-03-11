import React, { useState } from "react";
import { CategoryDto } from "../types";
import ToggleSwitch from "./ToggleSwitch";
import { useData } from "../Context/DataContext"; // Assicurati che il percorso sia corretto

interface CategoryRowProps {
    category: CategoryDto;
    setEdit: (id: number) => void;
}

const CategoryRow: React.FC<CategoryRowProps> = ({ category, setEdit }) => {
    const [available, setAvailable] = useState<boolean>(category.available);
    const [myLoading, setMyLoading] = useState<boolean>(false);

    const { changeAvailableAddable, deleteEntity } = useData();

    const handleToggleAvailable = async (value: boolean) => {
        setMyLoading(true);
        await changeAvailableAddable({ entity: "category" }, category.id, value, false);
        setMyLoading(false);
    };

    const handleDelete = async () => {
        setMyLoading(true);
        await deleteEntity(category.id, { entity: "category" });
        setMyLoading(false);
    };

    const defaultImage = "https://via.placeholder.com/100"; // URL immagine predefinita
    const categoryImage = category.image || defaultImage;

    return (
        <div
            className={`flex items-center p-4 rounded-lg shadow-md transition-colors ${
                available ? "bg-white" : "bg-gray-100"
            }`}
        >
            {/* Colonna sinistra: immagine */}
            <div className="w-20 h-20 mr-4">
                <img
                    src={categoryImage}
                    alt={category.name}
                    className="w-full h-full object-cover rounded-md"
                />
            </div>

            {/* Colonna destra: contenuto */}
            <div className="flex-1 flex flex-col justify-between">
                {/* Nome categoria */}
                <h3
                    className={`font-medium text-lg mb-2 ${
                        available ? "text-black" : "text-gray-500"
                    }`}
                >
                    {category.name}
                </h3>

                {/* Disponibile e pulsanti */}
                <div className="flex items-center justify-between">
                    {/* Disponibile */}
                    <ToggleSwitch
                        label={""}
                        value={available}
                        onToggle={(value) => handleToggleAvailable(value)}
                    />

                    {/* Pulsanti */}
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setEdit(category.id)}
                            title="Modifica"
                            className="p-2 rounded-full text-blue-500 hover:bg-blue-100 hover:text-blue-700"
                        >
                            ✏️
                        </button>
                        <button
                            onClick={() => handleDelete()}
                            title="Elimina"
                            className="p-2 rounded-full text-red-500 hover:bg-red-100 hover:text-red-700"
                        >
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CategoryRow;
