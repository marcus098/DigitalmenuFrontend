// src/pages/MenuPage.tsx
import React, { useEffect, useState, useMemo } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { useData } from "../../Context/DataContext";
import { IdWithOrder, ProductDto } from "../../types";
import ProductCard from "../../Components/ProductCard";
import { useParams } from "react-router-dom";
import DeletePopup from "../../Components/DeletePopup";
import { useHistory } from "../../Context/HistoryContext";
import CustomLoading from "../../Components/CustomLoading";
import { GripVerticalIcon, Search, Plus } from "lucide-react";
const MenuPage: React.FC = () => {

    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [openPopup, setOpenPopup] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: number; name: string } | null>(null);

    const {
        loading,
        categoriesMap,
        productsMap,
        changeAvailableAddable,
        deleteEntity,
        changeOrderCategories,
        changeOrderProducts,
    } = useData();

    const { navigateWithHistory } = useHistory();
    const { localname } = useParams();

    useEffect(() => {
        if (!loading && selectedCategory === null && categoriesMap.size > 0) {
            const firstCategory = [...Array.from(categoriesMap.values())].sort((a, b) => a.progressiveNumber - b.progressiveNumber)[0];
            const hash = window.location.hash.replace('#', '')
            if(hash.trim() !== ""){
                setSelectedCategory(Number(hash))
            }else if (firstCategory) {
                setSelectedCategory(firstCategory.id);
                window.location.hash = firstCategory.id + ""
            }
        }
    }, [loading, categoriesMap, selectedCategory]);

    const onDragEnd = async (result: DropResult) => {
        const { source, destination, type } = result;
        if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return;

        if (type === "category") {
            const reorderedCategories = [...Array.from(categoriesMap.values())].sort((a, b) => a.progressiveNumber - b.progressiveNumber);
            const [movedItem] = reorderedCategories.splice(source.index, 1);
            reorderedCategories.splice(destination.index, 0, movedItem);
            const orderedIds: IdWithOrder[] = reorderedCategories.map((cat, index) => ({ id: cat.id, order: index + 1 }));
            await changeOrderCategories(orderedIds);
        }

        if (type === "product" && selectedCategory) {
            if (searchTerm) return;
            const reorderedProducts = [...filteredAndSortedProducts];
            const [movedItem] = reorderedProducts.splice(source.index, 1);
            reorderedProducts.splice(destination.index, 0, movedItem);
            const orderedIds: IdWithOrder[] = reorderedProducts.map((p, index) => ({ id: p.id, order: index + 1 }));
            await changeOrderProducts(orderedIds, selectedCategory);
        }
    };

    const filteredAndSortedProducts = useMemo(() => {
        if (!selectedCategory) return [];
        const category = categoriesMap.get(selectedCategory);
        if (!category || !category.products) return [];
        return category.products
            .map(p => productsMap.get(p.longValue))
            .filter((p): p is ProductDto => p !== undefined && p.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => a.positionProgressive - b.positionProgressive) || [];
    }, [selectedCategory, categoriesMap, productsMap, searchTerm]);

    const handleDeleteClick = (name: string, id: number) => {
        setItemToDelete({ id, name });
        setOpenPopup(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;
        await deleteEntity(itemToDelete.id, { entity: "product" });
        setOpenPopup(false);
        setItemToDelete(null);
    };

    if (loading && !selectedCategory) return <CustomLoading isFullPage={true} />;

    return (
        <>
            {openPopup && itemToDelete && (
                <DeletePopup itemName={itemToDelete.name} onConfirm={handleConfirmDelete} onCancel={() => setOpenPopup(false)} />
            )}

            {/*
              LAYOUT PRINCIPALE:
              - Default (mobile): flex-col (elementi impilati verticalmente)
              - Da 'md' in su (desktop): flex-row (layout a due colonne)
            */}
            <div className="flex flex-col md:flex-row h-screen bg-slate-50">
                <DragDropContext onDragEnd={onDragEnd}>
                    {/* SIDEBAR / HEADER CATEGORIE:
                      - Mobile: Un div orizzontale scrollabile
                      - Desktop: Una sidebar verticale fissa
                    */}
                    <div className="md:w-64 flex-shrink-0 p-3 md:p-4 bg-white md:border-r border-b md:border-b-0 border-gray-200">
                        <h2 className="text-xl font-bold text-gray-800 mb-4 hidden md:block">Categorie</h2>

                        {/* Contenitore Droppable per le categorie.
                          - direction="horizontal" per permettere lo scroll e D&D su mobile
                          - md:flex-col per tornare a una lista verticale su desktop
                        */}
                        <Droppable droppableId="categories" type="category" direction="horizontal">
                            {(provided) => (
                                <div ref={provided.innerRef} {...provided.droppableProps}
                                     className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-2 md:pb-0">

                                    {[...Array.from(categoriesMap.values())].sort((a, b) => a.progressiveNumber - b.progressiveNumber).map((cat, index) => (
                                        <Draggable key={cat.id} draggableId={String(cat.id)} index={index}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef} {...provided.draggableProps}
                                                    onClick={() => {
                                                            setSelectedCategory(cat.id);
                                                            window.location.hash = cat.id + ""
                                                        }
                                                    }
                                                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors flex-shrink-0 md:flex-shrink-1 ${selectedCategory === cat.id ? 'bg-primary text-white shadow' : 'bg-gray-100 hover:bg-gray-200'}`}
                                                >
                                                    <span className="font-semibold text-sm md:text-base">{cat.name}</span>
                                                    <div {...provided.dragHandleProps} className="ml-2">
                                                        <GripVerticalIcon className="w-5 h-5 opacity-60" />
                                                    </div>
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}

                                    {/* Bottone Aggiungi Categoria con stile tratteggiato */}
                                    <div
                                        onClick={() => navigateWithHistory(((`/${localname}/Dashboard/AddCategory`) + (window.location.hash.replace('#', '').trim() !== "" ? window.location.hash : "")))}
                                        className="flex-shrink-0 md:flex-shrink-1 flex items-center justify-center p-3 rounded-lg border-2 border-dashed border-gray-300 text-gray-500 hover:text-primary hover:border-primary cursor-pointer transition-colors"
                                    >
                                        <Plus className="w-5 h-5 mr-1" />
                                        <span className="font-semibold text-sm md:text-base">Nuova</span>
                                    </div>
                                </div>
                            )}
                        </Droppable>
                    </div>

                    {/* CONTENUTO PRINCIPALE PRODOTTI (la logica interna rimane quasi uguale) */}
                    <main className="flex-1 p-3 md:p-6 overflow-y-auto">
                        {selectedCategory && categoriesMap.get(selectedCategory) ? (
                            <>
                                {/* Header del contenuto */}
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                                    <h1 className="text-2xl md:text-3xl font-bold text-gray-800 truncate">{categoriesMap.get(selectedCategory)?.name}</h1>
                                    <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto">
                                        <div className="relative flex-1">
                                            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2"/>
                                            <input type="text" placeholder="Cerca..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                                   className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-primary/50"/>
                                        </div>
                                        <button onClick={() => navigateWithHistory((`/${localname}/Dashboard/AddProduct#${selectedCategory}`) + (window.location.hash.replace('#', '').trim() !== "" ? window.location.hash : ""))}
                                                className="bg-primary text-white p-2.5 rounded-lg shadow-md hover:bg-primary-dark font-semibold">
                                            <Plus className="w-6 h-6 md:hidden"/>
                                            <span className="hidden md:block">Aggiungi Prodotto</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Griglia Prodotti */}
                                <Droppable droppableId={String(selectedCategory)} type="product">
                                    {(provided) => (
                                        <div ref={provided.innerRef} {...provided.droppableProps}
                                             className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-5">
                                            {filteredAndSortedProducts.map((product, index) => (
                                                <Draggable key={product.id} draggableId={String(product.id)} index={index}>
                                                    {(provided) => (
                                                        <ProductCard
                                                            product={product}
                                                            provided={provided}
                                                            handleToggleAvailability={(id, val) => changeAvailableAddable({entity: "product"}, id, val, true)}
                                                            deleteProduct={handleDeleteClick}
                                                        />
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </>
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-gray-500">Seleziona una categoria per iniziare.</p>
                            </div>
                        )}
                    </main>
                </DragDropContext>
            </div>
        </>
    );
};

export default MenuPage;