import React, { useEffect, useState } from "react";
import { useData } from "../../Context/DataContext";
import { useNavigate, useParams } from "react-router-dom";
import CategoryCard from "../../Components/CategoryCard";
import CustomLoading from "../../Components/CustomLoading";
import DeletePopup from "../../Components/DeletePopup";
import { useHistory } from "../../Context/HistoryContext";

const CategoriesPage: React.FC = () => {
    const [myLoading, setMyLoading] = useState<boolean>(false);
    const [openPopup, setOpenPopup] = useState<boolean>(false);
    const [nameToDelete, setNameToDelete] = useState<string>("");
    const [idToDelete, setIdToDelete] = useState<number>(-1);
    const { loading, categoriesMap, deleteEntity, changeAvailableAddable } = useData();
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
        await deleteEntity(idToDelete, { entity: "category" });
        closePopup();
        setMyLoading(false);
    };

    const handleAvailable = async (id: number, value: boolean) => {
        setMyLoading(true);
        await changeAvailableAddable({ entity: "category" }, id, value, true);
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
                <h1 className="text-2xl font-bold mb-6 text-gray-800">Gestione Categorie</h1>

                {/* Pulsante Aggiungi */}
                <div className="flex justify-end mb-6">
                    <button
                        onClick={() => navigateWithHistory(`/${localname}/Dashboard/AddCategory`)}
                        className="bg-amber-500 text-white px-4 py-2 rounded-lg shadow hover:bg-amber-600 transition"
                    >
                        Aggiungi Categoria
                    </button>
                </div>

                {/* Elenco Categorie */}
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Categorie Disponibili</h2>
                    <div className="space-y-3">
                        {Array.from(categoriesMap.values()).map((category) => (
                            <CategoryCard
                                key={category.id}
                                category={category}
                                handleAvailable={handleAvailable}
                                deleteCategory={handleDelete}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </>
    );
};

export default CategoriesPage;
