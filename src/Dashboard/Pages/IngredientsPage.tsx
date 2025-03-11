import React, { useEffect, useState } from "react";
import { useData } from "../../Context/DataContext";
import { useParams } from "react-router-dom";
import IngredientCard from "../../Components/IngredientCard";
import { NameType } from "../../types";
import { useHistory } from "../../Context/HistoryContext";
import CustomLoading from "../../Components/CustomLoading";
import DeletePopup from "../../Components/DeletePopup";

const IngredientsPage: React.FC = () => {
    const [myLoading, setMyLoading] = useState<boolean>(true);
    const [openPopup, setOpenPopup] = useState<boolean>(false);
    const [nameToDelete, setNameToDelete] = useState<string>("");
    const [idToDelete, setIdToDelete] = useState<number>(-1);
    const { loading, ingredientsMap, deleteEntity, changeAvailableAddable } = useData();
    const { localname } = useParams();
    const { navigateWithHistory } = useHistory();

    useEffect(() => {
        if (!loading) setMyLoading(false);
    }, [loading]);

    const handleDelete = (id: number, name: string) => {
        setNameToDelete(name);
        setIdToDelete(id);
        setOpenPopup(true);
    };

    const handleConfirm = async () => {
        setMyLoading(true);
        await deleteEntity(idToDelete, { entity: "ingredient" });
        closePopup();
        setMyLoading(false);
    };

    const handleAvailableAddable = async (id: number, value: boolean, isAvailable: boolean) => {
        setMyLoading(true);
        await changeAvailableAddable({ entity: "ingredient" }, id, value, isAvailable);
        setMyLoading(false);
    };

    const closePopup = () => {
        setOpenPopup(false);
        setIdToDelete(-1);
        setNameToDelete("");
    };

    if (loading) return <CustomLoading isFullPage={true} />;

    return (
        <>
            {openPopup && (
                <DeletePopup itemName={nameToDelete} onConfirm={handleConfirm} onCancel={closePopup} />
            )}
            {myLoading && <CustomLoading isTransparent={true} />}

            <div className="p-6">
                <h1 className="text-2xl font-bold mb-6 text-gray-800">Gestione Ingredienti</h1>

                {/* Pulsante Aggiungi */}
                <div className="flex justify-end mb-6">
                    <button
                        onClick={() => navigateWithHistory(`/${localname}/Dashboard/AddIngredient`)}
                        className="bg-amber-500 text-white px-4 py-2 rounded-lg shadow hover:bg-amber-600 transition"
                    >
                        Aggiungi Ingrediente
                    </button>
                </div>

                {/* Elenco Ingredienti */}
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Ingredienti Disponibili</h2>
                    <div className="space-y-3">
                        {Array.from(ingredientsMap.values()).map((ingredient) => (
                            <IngredientCard
                                key={ingredient.id}
                                ingredient={ingredient}
                                handleAvailableAddable={handleAvailableAddable}
                                deleteIngredient={handleDelete}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default IngredientsPage;
