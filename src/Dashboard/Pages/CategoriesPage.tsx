// src/pages/CategoriesPage.tsx
import React, { useState, useMemo } from "react";
import { useData } from "../../Context/DataContext";
import { useParams } from "react-router-dom";
import CategoryCard from "../../Components/CategoryCard";
import CustomLoading from "../../Components/CustomLoading";
import DeletePopup from "../../Components/DeletePopup";
import { useHistory } from "../../Context/HistoryContext";
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const CategoriesPage: React.FC = () => {
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [openPopup, setOpenPopup] = useState<boolean>(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: number; name: string } | null>(null);
    const [searchTerm, setSearchTerm] = useState<string>("");

    // Nota: 'changeAvailableAddable' funziona anche qui, passiamo solo 'isAvailable=true'
    const { loading, categoriesMap, deleteEntity, changeAvailableAddable } = useData();
    const { localname } = useParams();
    const { navigateWithHistory } = useHistory();

    const handleDelete = (id: number, name: string) => {
        setItemToDelete({ id, name });
        setOpenPopup(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        setIsSubmitting(true);
        await deleteEntity(itemToDelete.id, { entity: "category" });
        closePopup();
        setIsSubmitting(false);
    };

    const handleAvailable = async (id: number, value: boolean) => {
        setIsSubmitting(true);
        await changeAvailableAddable({ entity: "category" }, id, value, true);
        setIsSubmitting(false);
    };

    const closePopup = () => {
        setOpenPopup(false);
        setItemToDelete(null);
    };

    // Filtra e ordina le categorie
    const filteredCategories = useMemo(() => {
        return Array.from(categoriesMap.values())
            .filter(category =>
                category.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .sort((a, b) => a.name.localeCompare(b.name)); // Aggiungiamo l'ordinamento
    }, [categoriesMap, searchTerm]);

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
                    <h1 className="text-3xl font-bold text-gray-800">Gestione Categorie</h1>
                    <button
                        onClick={() => navigateWithHistory(`/${localname}/Dashboard/AddCategory`)}
                        className="bg-primary text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-primary-dark transition-colors font-semibold flex items-center justify-center"
                    >
                        Aggiungi Categoria
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
                            placeholder="Cerca una categoria..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        />
                    </div>
                </div>

                {/* Griglia Categorie */}
                {filteredCategories.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                        {filteredCategories.map((category) => (
                            <CategoryCard
                                key={category.id}
                                category={category}
                                handleAvailable={handleAvailable}
                                deleteCategory={handleDelete}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <p className="text-gray-500">Nessuna categoria trovata.</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default CategoriesPage;