import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { useData } from "../../Context/DataContext";
import {CategoryDto, IdWithOrder, ProductDto} from "../../types";
import ProductCard from "../../Components/ProductCard";
import { useParams } from "react-router-dom";
import DeletePopup from "../../Components/DeletePopup";
import { useHistory } from "../../Context/HistoryContext";
import CustomLoading from "../../Components/CustomLoading";
import {useNotification} from "../../Context/NotificationContext";

const MenuPage: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState<number>(0);
    const { categoriesMap, productsMap, changeAvailableAddable, loading, deleteEntity } = useData();
    const [isPopupVisible, setIsPopupVisible] = useState<boolean>(false);
    const [itemToDelete, setItemToDelete] = useState<string>("");
    const [idItem, setIdItem] = useState<number>(-1);

    const { navigateWithHistory } = useHistory();
    const { localname } = useParams();
    const { changeOrderCategories } = useData()
    const { addNotification } = useNotification()

    useEffect(() => {
        if (!loading && selectedCategory === 0 && categoriesMap.size > 0) {
            const firstCategory = Array.from(categoriesMap.values()).sort((c1, c2) => c1.progressiveNumber - c2.progressiveNumber).values().next().value;
            if (firstCategory) {
                setSelectedCategory(firstCategory.id);
            }
        }
    }, [loading]);

    const handleCategoryChange = (category: number) => {
        setSelectedCategory(category);
    };

    const handleToggleAvailability = async (productId: number, value: boolean) => {
        const result = await changeAvailableAddable({ entity: "product" }, productId, value, true);
        if(!result){
            addNotification({message: "Errore", type: "error"})
        }
    };

    const onDragEnd = async (result: DropResult) => {
        const { source, destination, type } = result;
        if (!destination) return;

        if (type === "category") {

            // Convertire la mappa in un array e ordinare in base al progressivenumber
            const categoriesArrayTmp = [...Array.from(categoriesMap.values())].sort((a, b) =>
                a.progressiveNumber - b.progressiveNumber
            );
            const categoriesArray: CategoryDto[] = []
            for(const cat of categoriesArrayTmp){
                categoriesArray.push(cat)
            }
            // Estrarre l'elemento dalla posizione di partenza
            const [moved] = categoriesArray.splice(source.index-1, 1);
            if(!moved)
                return

            // Inserirlo nella nuova posizione
            categoriesArray.splice(destination.index-1, 0, moved);

            // Aggiornare il progressivenumber in base alla nuova posizione
            const updatedCategories = categoriesArray.map((category, index) => ({
                ...category,
                progressiveNumber: index + 1, // progressivenumber parte da 1
            }));
            const ordered: IdWithOrder[] = []

            for(const c of updatedCategories){
                ordered.push({id: c.id, order: c.progressiveNumber})
            }

            await changeOrderCategories(ordered)
            // Aggiornare lo stato con il nuovo ordine (se necessario)
            //setCategoriesMap(new Map(reorderedCategories.map(cat => [cat.id, cat])));
        } else if (type === "product") {
            console.log(result) // todo ordinamento per prodotti
        }
    };

    const handleConfirm = async () => {
        await deleteEntity(idItem, { entity: "product" });
        handleCancel();
    };

    const handleCancel = () => {
        setItemToDelete("");
        setIdItem(-1);
        setIsPopupVisible(false);
    };

    const openPopup = (element: string, id: number) => {
        setItemToDelete(element);
        setIdItem(id);
        setIsPopupVisible(true);
    };

    return (
        <>
            {isPopupVisible && (
                <DeletePopup
                    itemName={itemToDelete}
                    onConfirm={handleConfirm}
                    onCancel={handleCancel}
                />
            )}
            {loading ? (
                <CustomLoading isFullPage={true} />
            ) : (
                <div className="p-4 flex">
                    <div className="hidden md:block w-1/4 mr-4" style={{ maxWidth: "200px" }}>
                        <h2 className="text-xl font-semibold mb-4">Categorie</h2>
                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId="categories" type="category">
                                {(provided) => (
                                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                                        <div
                                            className="p-3 rounded-lg border-dashed border-2 border-gray-300 text-gray-500 text-center cursor-pointer"
                                            onClick={() => navigateWithHistory("/" + localname + "/Dashboard/AddCategory")}
                                        >
                                            + Aggiungi Categoria
                                        </div>
                                        {Array.from(categoriesMap.values())
                                            .sort((c1, c2) => c1.progressiveNumber - c2.progressiveNumber)
                                            .map((category, index) => (
                                                <Draggable key={category.progressiveNumber.toString()} draggableId={category.progressiveNumber.toString()} index={category.progressiveNumber}>
                                                    {(provided) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`p-3 rounded-lg shadow-md ${selectedCategory === category.id ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-800"}`}
                                                            onClick={() => handleCategoryChange(category.id)}
                                                        >
                                                            {category.name}
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </div>

                    {/* Contenuto principale */}
                    <div className="flex-1">
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={() => navigateWithHistory("/" + localname + "/Dashboard/AddProduct#" + selectedCategory.toString())}
                                className="bg-amber-500 text-white px-4 py-2 rounded-lg shadow hover:bg-amber-600 transition"
                            >
                                Aggiungi Prodotto
                            </button>
                        </div>

                        <DragDropContext onDragEnd={onDragEnd}>
                            <Droppable droppableId={selectedCategory.toString()} type="product">
                                {(provided) => (
                                    <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                                        {categoriesMap.get(selectedCategory)?.products.map((product, index) => (
                                            <Draggable key={product.longValue} draggableId={product.longValue.toString()} index={product.intValue}>
                                                {(provided) => {
                                                    const element = productsMap.get(product.longValue) as ProductDto;
                                                    return (<>
                                                        {element ? <ProductCard
                                                            key={element.id}
                                                            product={element}
                                                            selectedCategory={selectedCategory}
                                                            provided={provided}
                                                            handleToggleAvailability={handleToggleAvailability}
                                                            deleteProduct={openPopup}
                                                        /> : <></>}
                                                        </>
                                                    );
                                                }}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    </div>
                </div>
            )}
        </>
    );
};

export default MenuPage;
