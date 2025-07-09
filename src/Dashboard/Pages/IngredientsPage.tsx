// src/pages/IngredientsPage.tsx
import React, { useState, useMemo } from "react";
import { useData } from "../../Context/DataContext";
import { useParams } from "react-router-dom";
import IngredientCard from "../../Components/IngredientCard";
import { useHistory } from "../../Context/HistoryContext";
import CustomLoading from "../../Components/CustomLoading";
import DeletePopup from "../../Components/DeletePopup";
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'; // Icona per la ricerca

const IngredientsPage: React.FC = () => {
    // Rinomino myLoading in isSubmitting per maggiore chiarezza
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [openPopup, setOpenPopup] = useState<boolean>(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: number; name: string } | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");

    const { loading, ingredientsMap, deleteEntity, changeAvailableAddable } = useData();
    const { localname } = useParams();
    const { navigateWithHistory } = useHistory();

    const handleDelete = (id: number, name: string) => {
        setItemToDelete({ id, name });
        setOpenPopup(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        setIsSubmitting(true);
        await deleteEntity(itemToDelete.id, { entity: "ingredient" });
        closePopup();
        setIsSubmitting(false);
    };

    const handleAvailableAddable = async (id: number, value: boolean, isAvailable: boolean) => {
        setIsSubmitting(true);
        await changeAvailableAddable({ entity: "ingredient" }, id, value, isAvailable);
        setIsSubmitting(false);
    };

    const closePopup = () => {
        setOpenPopup(false);
        setItemToDelete(null);
    };

    // Filtra e ordina gli ingredienti
    const filteredIngredients = useMemo(() => {
        return Array.from(ingredientsMap.values())
            .filter(ingredient =>
                ingredient.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [ingredientsMap, searchTerm]);

    if (loading) return <CustomLoading isFullPage={true} />;

    return (
        <>
            {openPopup && itemToDelete && (
                <DeletePopup itemName={itemToDelete.name} onConfirm={handleConfirmDelete} onCancel={closePopup} />
            )}
            {isSubmitting && <CustomLoading isTransparent={true} />}

            <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
                {/* Header con Titolo e Pulsante Aggiungi */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                    <h1 className="text-3xl font-bold text-gray-800">Gestione Ingredienti</h1>
                    <button
                        onClick={() => navigateWithHistory(`/${localname}/Dashboard/AddIngredient`)}
                        className="bg-primary text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-primary-dark transition-colors font-semibold flex items-center justify-center"
                    >
                        Aggiungi Ingrediente
                    </button>
                </div>

                {/* Barra di Ricerca */}
                <div className="mb-6">
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </span>
                        <input
                            type="text"
                            placeholder="Cerca un ingrediente..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        />
                    </div>
                </div>

                {/* Griglia Ingredienti */}
                {filteredIngredients.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                        {filteredIngredients.map((ingredient) => (
                            <IngredientCard
                                key={ingredient.id}
                                ingredient={ingredient}
                                handleAvailableAddable={handleAvailableAddable}
                                deleteIngredient={handleDelete}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Nessun ingrediente trovato.</p>
                    </div>
                )}

                <div className="text-sm text-gray-500 mt-6"><span className="text-blue-500 font-semibold">*</span> Indica un prodotto surgelato</div>
            </div>
        </>
    );
};

export default IngredientsPage;