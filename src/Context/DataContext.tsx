import React, {useEffect, useState, createContext, useContext, useMemo} from 'react';
import {
    AddCategory, AddIngredient, AddProduct,
    CategoryDto,
    DataContextType, Entity, IdWithOrder,
    ImageDto,
    IngredientDto,
    ListToExport,
    ProductDto,
    StyleDto,
    TableDto, UpdateCategory, UpdateIngredient, UpdateProduct
} from "../types";
import {
    addCategoryApi,
    addIngredientApi,
    addProductApi,
    changeComandStatusApi,
    changeOrderCategoriesApi,
    deleteCategoryApi,
    deleteIngredientApi,
    deleteProductApi,
    deleteTableApi,
    forceDeleteTableApi,
    forceFreeTableApi,
    freeTableApi,
    getAll,
    getToken,
    setAddableIngredientApi,
    setAvailableCategoryApi,
    setAvailableIngredientApi,
    setAvailableProductApi, setBusyTableApi,
    UPDATE_ENDPOINT,
    UPDATE_ENDPOINT_DASHBOARD,
    updateCategoryApi,
    updateIngredientApi,
    updateProductApi
} from "../Utilities/api";
import {useParams} from "react-router-dom";
import {allergens} from "../Utilities/Utilities";
import {Comand} from "../ComandType";
import {useNotification} from "./NotificationContext";
import {OrderItem, Orders} from "../Dashboard/Pages/OrderPage";
import {tab} from "@testing-library/user-event/dist/tab";

const allergensMap = new Map([
    [1, { id: 1, name: "glutine" }],
    [2, { id: 2, name: "crostacei" }],
    [3, { id: 3, name: "uova" }],
    [4, { id: 4, name: "pesce" }],
    [5, { id: 5, name: "arachidi" }],
    [6, { id: 6, name: "soia" }],
    [7, { id: 7, name: "latte" }],
    [8, { id: 8, name: "frutta a guscio" }],
    [9, { id: 9, name: "sedano" }],
    [10, { id: 10, name: "senape" }],
    [11, { id: 11, name: "sesamo" }],
    [12, { id: 12, name: "anidride solforosa" }],
    [13, { id: 13, name: "lupini" }],
    [14, { id: 14, name: "molluschi" }]
]);

const tagsMap = new Map([
    [1, { id: 1, name: "Vegetariano" }],
    [2, { id: 2, name: "Senza Glutine" }],
    [3, { id: 3, name: "Spicy" }],
    [4, { id: 4, name: "Classico" }],
]);


const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode, dashboard: boolean, waiters?: boolean }> = ({ children, dashboard, waiters = false }) => {
    const [imagesList, setImagesList] = useState<ImageDto[]>([])
    const [styles, setStyles] = useState<StyleDto>()
    const [selectedAllergens, setSelectedAllergens] = useState<number[]>([]);

    const [categoriesMap, setCategoriesMap] = useState<Map<number, CategoryDto>>(new Map())
    const [ingredientsMap, setIngredientsMap] = useState<Map<number, IngredientDto>>(new Map())
    const [productsMap, setProductsMap] = useState<Map<number, ProductDto>>(new Map())
    const [comands, setComandList] = useState<Comand[]>([])
    const [tablesMap, setTablesMap] = useState<Map<number, TableDto>>(new Map())

    const { localname } = useParams()
    const { addNotification } = useNotification()

    const [loading, setLoading] = useState(true);
    const [eventSource, setEventSource] = useState<EventSource | null>(null);

    const setStates = (tmp: ListToExport) => {
        if(tmp.categoriesList){
            setCategoriesMap(new Map(tmp.categoriesList))
        }

        if (tmp.productsList) {
            setProductsMap(new Map(tmp.productsList))
        }

        if(dashboard && tmp.imagesList){
            setImagesList(tmp.imagesList)
        }

        if(tmp.ingredientsList){
            setIngredientsMap(new Map(tmp.ingredientsList))
        }

        if(dashboard && tmp.tablesList){
            setTablesMap(new Map(tmp.tablesList))
        }

        if(tmp.style){
            setStyles(tmp.style)
        }

        if (dashboard && tmp.comands){
            setComandList(tmp.comands)
        }

    }

    // Funzione per caricare i dati iniziali
    const loadData = async () => {
        try {
            setLoading(true);

            let response = await getAll(dashboard, dashboard ? '' : localname);

            if (response && response.data) {
                setStates(response.data)
            }
            startSSE()
        } catch (err) {
            console.error("Errore nel caricamento iniziale dei dati:", err);
        } finally {
            setLoading(false);
        }
    };

    const mapRawOrderToOrder = (hasComands?: Comand[]): Orders[] => {
        const orders: Orders[] = []
        const list: Comand[] = hasComands ? [...hasComands] : [...comands]

        list.forEach((c) => {
            const items: OrderItem[] = []
            c.orders.forEach((o) => {
                    o.products.forEach((p) => {
                        items.push({
                            productName: p.productName || "",
                            categoryName: p.categoryName || "",
                            total: p.productOption.price + p.ingredientsPlus.reduce((acc, i) => acc + (i.price ?? 0), 0),
                            option: p.productOption.name,
                            additionalIngredients: p.ingredientsPlus?.map((i) => i.name) || [],
                            removedIngredients: p.ingredientsMinus?.map((i) => i.name) || [],
                            notes: p.note || "",
                            quantity: p.quantity
                        })
                    })
                    const idTable: number = c.idTable || -1

                    orders.push({
                        id: c.id || "",
                        userId: o.userId,
                        tableName: idTable > 0 && tablesMap.has(idTable) ? tablesMap.get(idTable)?.name || "" : "",
                        status: c.status,
                        items: items,
                        name: c.name,
                        time: c.time,
                        address: c.address,
                        phone: c.phone,
                        createdAt: c.createdAt
                    })
                }

            )
        });
        return orders
    };

    // Funzione per avviare la connessione SSE
    const startSSE = () => {
        if (eventSource) {
            stopSSE(); // Chiudi eventuali connessioni esistenti
        }

        let url = process.env.REACT_APP_BACKEND_WEBFLUX_URL_BASE + (dashboard ? UPDATE_ENDPOINT_DASHBOARD : UPDATE_ENDPOINT(localname || ""));

        // Aggiungi il token come parametro di query solo per l'endpoint dashboard
        const token = getToken()
        if (dashboard && token) {
            url += `?token=${token}`;
        }

        const newEventSource = new EventSource(url);
        //const newEventSource = new EventSource(process.env.REACT_APP_BACKEND_URL_BASE + "" + (dashboard ? UPDATE_ENDPOINT_DASHBOARD : UPDATE_ENDPOINT(localname || "")));

        newEventSource.onmessage = (event) => {
            const update = JSON.parse(event.data);

            if (update && update.updates) {
                setStates(update.updates as ListToExport)
            }

        };

        newEventSource.onerror = (err) => {
            console.error("Errore nella connessione SSE:", err);
            newEventSource.close();
        };

        setEventSource(newEventSource);
    };

    // Funzione per chiudere la connessione SSE
    const stopSSE = () => {
        if (eventSource) {
            eventSource.close();
            setEventSource(null);
        }
    };

    const changeAvailableAddable = async (entity: Entity, id: number, value: boolean, isAvailable: boolean) => {
        let response = null
        switch (entity.entity){
            case "category":
                response = await setAvailableCategoryApi(id, value)
                if(response?.status === 200){
                    const tmp = new Map(categoriesMap)
                    const cat = tmp.get(id)
                    if(cat) {
                        cat.available = value
                        tmp.set(cat.id, cat)
                        setCategoriesMap(tmp)
                        return true
                    }
                }
                break
            case "product":
                response = await setAvailableProductApi(id, value)
                if(response?.status === 200){
                    const tmp = new Map(productsMap)
                    const prod = tmp.get(id)
                    if(prod) {
                        prod.available = value
                        tmp.set(prod.id, prod)
                        setProductsMap(tmp)
                        return true
                    }
                }
                break
            case "ingredient":
                response = isAvailable ? await setAvailableIngredientApi(id, value) : await setAddableIngredientApi(id, value)

                if(response?.status === 200){
                    const tmp = new Map(ingredientsMap)
                    const ing = tmp.get(id)
                    if(ing) {
                        if(isAvailable)
                            ing.available = value
                        else
                            ing.addable = value
                        tmp.set(ing.id, ing)
                        setIngredientsMap(tmp)
                        return true
                    }
                }
                break
        }
        return false;

    }


    const addProduct = async (addProduct: AddProduct, file?: File | null) => {
        const formData: FormData = new FormData()

        formData.append("name", addProduct.name);
        formData.append("description", addProduct.description);
        formData.append("idCategory", addProduct.idCategory.toString());
        formData.append("available", addProduct.available ? "true" : "false");
//
        addProduct.allergens.forEach(element => {
            formData.append("allergens", element.toString());
        });
//
        addProduct.tags.forEach(element => {
            formData.append("tags", element.toString());
        });
//
        addProduct.ingredients.forEach(element => {
            formData.append("ingredients", element.toString());
        });

        //formData.append("options", JSON.stringify(addProduct.options))
        addProduct.options.forEach(option => {
            formData.append("options", JSON.stringify(option).replaceAll(",", ";"));
        });

//        formData.append("addProduct", JSON.stringify(addProduct))

        // Aggiungi il file se presente
        if (file) {
            formData.append("file", file);
        }
        let response = await addProductApi(formData);

        if(response?.status === 200 && response.data){
            let tmp = new Map(productsMap)
            tmp.set(response.data.data.id, response.data.data)
            setProductsMap(tmp)
            let categoryTmp = categoriesMap.get(response.data.data.idCategory)
            if(categoryTmp && categoryTmp.products){
                categoryTmp.products.push({longValue: response.data.data.id, intValue: response.data.data.positionProgressive})
                const tmpMap = new Map(categoriesMap)
                tmpMap.set(categoryTmp.id, categoryTmp)
                setCategoriesMap(tmpMap)
                return true
            }
        }
        return false
    }


    const changeOrderCategories = async (ordered: IdWithOrder[]) => {
        let response = await changeOrderCategoriesApi(ordered)
        if(response?.status === 200 && response.data){
            const tmp = new Map()
            for(const c of ordered){
                if(categoriesMap.has(c.id)){
                    const category = categoriesMap.get(c.id)
                    if(category) {
                        category.progressiveNumber = c.order
                        tmp.set(c.id, category)
                    }
                }
            }
            setCategoriesMap(tmp)
            return true
        }
        return false
    }

    const addIngredient = async (addIngredient: AddIngredient) => {
        let response = await addIngredientApi(addIngredient)
        if(response?.status === 200 && response.data){
            let tmp = new Map(ingredientsMap)
            tmp.set(response.data.data.id, response.data.data)
            setIngredientsMap(tmp)
            return true
        }
        return false
    }

    const addCategory = async (addCategory: AddCategory, file?: File) => {
        const formData: FormData = new FormData()
        if(file)
            formData.append("file", file)
        formData.append("name", addCategory.name)
        formData.append("description", addCategory.description)
        formData.append("available", addCategory.available.toString())
        addCategory.products.forEach(product => {
            formData.append("products", product.toString());
        });

        formData.append("image", addCategory.image)
        let response = await addCategoryApi(formData)

        if(response?.status === 200 && response.data){
            let tmp = new Map(categoriesMap)
            tmp.set(response.data.data.id, response.data.data)
            setCategoriesMap(tmp)
            return true
        }
        return false
    }

    const changeComandStatus = async (idComand: string, status: 'PROGRESS' | 'COMPLETED' | 'DELETED' | 'PENDING') => {
        const response = await changeComandStatusApi(idComand, status)
        if(response.status === 200){
            const values = [...comands]
            const tmp: Comand[] = []
            values.forEach(c => {
                if(c.id === idComand){
                    c.status = status
                }
                if(c.status !== 'COMPLETED' && status !== 'DELETED'){
                    tmp.push(c)
                }
            })
            setComandList([...tmp])

        }else{
            addNotification({message: "Errore", type: "error"})
        }
    }

    const updateProduct = async (updateProduct: UpdateProduct, file?: File) => {
        const formData: FormData = new FormData()
        formData.append("id", updateProduct.id.toString())
        formData.append("name", updateProduct.name)
        formData.append("available", updateProduct.available.toString())
        formData.append("image", updateProduct.image)
        formData.append("description", updateProduct.description)
        updateProduct.allergens.forEach(element => {
            formData.append("allergens", element.toString());
        });
        updateProduct.tags.forEach(element => {
            formData.append("tags", element.toString());
        });
        updateProduct.ingredients.forEach(element => {
            formData.append("ingredients", element.toString());
        });
        updateProduct.options.forEach(option => {
            formData.append("options", JSON.stringify(option).replaceAll(",", ";"));
        });
        formData.append("idCategory", updateProduct.idCategory.toString())
        formData.append("positionProgressive", updateProduct.positionProgressive.toString())
        if(file)
            formData.append("file", file)
        let response = await updateProductApi(formData)

        if(response?.status === 200 && response.data){
            console.log(response)
            let tmp = new Map(productsMap)
            tmp.set(response.data.data.id, response.data.data)
            setProductsMap(tmp)
            return true
        }
        return false
    }

    const updateCategory = async (updateCategory: UpdateCategory, file?: File) => {
        const formData: FormData = new FormData()
        if(file)
            formData.append("file", file)
        formData.append("name", updateCategory.name)
        formData.append("description", updateCategory.description)
        formData.append("image", updateCategory.image)
        formData.append("available", updateCategory.available.toString())
        formData.append("id", updateCategory.id.toString())
        //formData.append("products", JSON.stringify(updateCategory.products.map((p) => p.longValue + "|" + p.intValue)))
        updateCategory.products.forEach(p => {
            formData.append("products", p.longValue.toString() + "|" + p.intValue);
        });
        let response = await updateCategoryApi(formData)

        if(response?.status === 200 && response.data){
            let tmp = new Map(categoriesMap)
            const old = tmp.get(updateCategory.id)
            tmp.set(updateCategory.id, {name: updateCategory.name, description: updateCategory.description, progressiveNumber: old?.progressiveNumber || 0, id: updateCategory.id, products: updateCategory.products, available: updateCategory.available, image: response.data.data })
            setCategoriesMap(tmp)
            return true
        }
        return false
    }

    const updateIngredient = async (updateIngredient: UpdateIngredient) => {
        let response = await updateIngredientApi(updateIngredient)
        if(response?.status === 200 && response.data){
            let tmp = new Map(ingredientsMap)
            tmp.set(response.data.data.id, {name: updateIngredient.name, id: updateIngredient.id, addable: updateIngredient.addable, allergens: updateIngredient.allergens, available: updateIngredient.available, frozen: updateIngredient.frozen, price: updateIngredient.price})
            setIngredientsMap(tmp)
            return true
        }
        return false
    }

    const deleteEntity = async (id: number, entity: Entity) => {
        let response = null;
        switch (entity.entity){
            case "category":
                response = await deleteCategoryApi(id)
                if(response?.status === 200 && response.data){
                    let tmp = new Map(categoriesMap)
                    tmp.delete(id)
                    setCategoriesMap(tmp)
                    return true
                }
                break
            case "product":
                response = await deleteProductApi(id)
                if(response?.status === 200 && response.data){
                    let tmp = new Map(productsMap)
                    tmp.delete(id)
                    setProductsMap(tmp)
                    const tmpMap = new Map()
                    Array.from(categoriesMap.values()).forEach((cat) => {
                        const products = cat.products.filter((value) => value.longValue !== id)
                        tmpMap.set(cat.id, {id: cat.id, name: cat.name, description: cat.description, image: cat.image, available: cat.available, progressiveNumber: cat.progressiveNumber, products: products})
                    })
                    setCategoriesMap(tmpMap)
                    return true
                }
                break
            case "ingredient":
                response = await deleteIngredientApi(id)
                if(response?.status === 200 && response.data){
                    let tmp = new Map(ingredientsMap)
                    tmp.delete(id)
                    setIngredientsMap(tmp)
                    return true
                }
                break
            case "table":

                break
        }
        return false
    }

    // Effetto per caricare i dati iniziali
    useEffect(() => {
        loadData();

        // Cleanup quando il provider viene smontato
        return () => {
            stopSSE();
        };
    }, []);

    const freeTableContext = async(id: number): Promise<string> => {
        const response = await freeTableApi(id)
        switch (response.status){
            case 200:
                const tmp = new Map(tablesMap)
                const table = tmp.get(id)

                if(table){
                    table.busy = false
                    table.seats = -1
                    table.code = response.data?.data || ""
                    tmp.set(id, table)
                }else{
                    window.location.reload()
                }
                setTablesMap(new Map(tmp))
                return "SUCCESS"
            case 400:
                return "ERROR"
            case 404:
                return "TABLE_NOT_FOUND"
            case 402:
                return "NOT_EMPTY"
            case 401:
                return "NOT_AUTHORIZED"
            default:
                return "ERROR"
        }
    }

    const forceFreeTableContext = async(id: number): Promise<boolean> => {
        const response = await forceFreeTableApi(id)
        if(response.status === 200) {
            const tmp = new Map(tablesMap)
            const table = tmp.get(id)

            if(table){
                table.busy = false
                table.seats = -1
                table.code = response.data?.data || ""
                tmp.set(id, table)
            }else{
                window.location.reload()
            }

            setTablesMap(new Map(tmp))

            return true
        }
        addNotification({message: "Errore", type: "error"})
        return false
    }

    const setBusyTable = async(id: number, seats: number): Promise<boolean> => {
        const response = await setBusyTableApi(id, seats)
        if(response.status === 200){
            const tmp = new Map(tablesMap)
            const table = tmp.get(id)
            if(table){
                table.busy = true
                table.seats = seats
                tmp.set(id, table)
            }else{
                window.location.reload()
            }
            setTablesMap(new Map(tmp))
            return true
        }
        addNotification({message: "Errore", type: "error"})
        return false
    }

    const deleteTable = async(id: number) => {
        const response = await deleteTableApi(id)
        switch (response.status){
            case 200:
                const tmp = new Map(tablesMap)
                tmp.delete(id)
                setTablesMap(new Map(tmp))
                return "SUCCESS"
            case 400:
                return "ERROR"
            case 404:
                return "TABLE_NOT_FOUND"
            case 402:
                return "NOT_EMPTY"
            case 401:
                return "NOT_AUTHORIZED"
            default:
                return "ERROR"
        }
    }

    const forceDeleteTable = async(id: number): Promise<boolean> => {
        const response = await forceDeleteTableApi(id)
        if(response.status === 200){
            const tmp = new Map(tablesMap)
            tmp.delete(id)
            setTablesMap(new Map(tmp))
            return true
        }
        addNotification({message: "Errore", type: "error"})
        return false
    }


    // Cleanup quando il provider viene smontato
    //useEffect(() => {
    //    return () => {
    //        stopSSE();
    //    };
    //}, []);

    const contextValue = useMemo(() => ({
        categoriesMap,
        imagesList,
        ingredientsMap,
        productsMap,
        tablesMap,
        styles,
        loading,
        tagsMap,
        allergensMap,
        waiters,
        comands,
        selectedAllergens,
        freeTableContext,
        forceFreeTableContext,
        deleteTable,
        forceDeleteTable,
        setBusyTable,
        setSelectedAllergens,
        changeAvailableAddable,
        addCategory,
        addProduct,
        changeComandStatus,
        addIngredient,
        updateProduct,
        updateCategory,
        updateIngredient,
        deleteEntity,
        changeOrderCategories,
        mapRawOrderToOrder
    }), [
        categoriesMap,
        imagesList,
        ingredientsMap,
        productsMap,
        tablesMap,
        styles,
        loading,
        tagsMap,
        allergensMap,
        waiters,
        selectedAllergens,
        comands
    ]);

    return (
        <DataContext.Provider value={contextValue}>
            {children}
        </DataContext.Provider>
    );

};

// Custom hook per accedere al DataContext
export const useData = (): DataContextType => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
