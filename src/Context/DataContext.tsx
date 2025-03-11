import React, { useEffect, useState, createContext, useContext } from 'react';
import {
    AddCategory, AddIngredient, AddProduct,
    CategoryDto,
    DataContextType, Entity, IdWithOrder,
    ImageDto,
    IngredientDto,
    ListToExport, NameType,
    ProductDto,
    StyleDto,
    TableDto, UpdateCategory, UpdateIngredient, UpdateProduct
} from "../types";
import {
    addCategoryApi,
    addIngredientApi,
    addProductApi, changeOrderCategoriesApi,
    deleteCategoryApi, deleteIngredientApi, deleteProductApi, deleteTableApi,
    getAll,
    getToken, setAddableIngredientApi, setAvailableCategoryApi,
    setAvailableIngredientApi, setAvailableProductApi,
    UPDATE_ENDPOINT,
    UPDATE_ENDPOINT_DASHBOARD, updateCategoryApi, updateIngredientApi, updateProductApi
} from "../Utilities/api";
import {useParams} from "react-router-dom";
import {allergens} from "../Utilities/Utilities";

const allergensArray = [
    { id: 1, name: "glutine" },
    { id: 2, name: "crostacei" },
    { id: 3, name: "uova" },
    { id: 4, name: "pesce" },
    { id: 5, name: "arachidi" },
    { id: 6, name: "soia" },
    { id: 7, name: "latte" },
    { id: 8, name: "frutta a guscio" },
    { id: 9, name: "sedano" },
    { id: 10, name: "senape" },
    { id: 11, name: "sesamo" },
    { id: 12, name: "anidride solforosa" },
    { id: 13, name: "lupini" },
    { id: 14, name: "molluschi" }
];

const tagsArray = [
    {id: 1, name: "Vegetariano"},
    {id: 2, name: "Senza Glutine"},
    {id: 3, name: "Spicy"},
    {id: 4, name: "Classico"}
];


const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode, dashboard: boolean }> = ({ children, dashboard }) => {
    const [categoriesList, setCategoriesList] = useState<CategoryDto[]>([])
    const [ingredientsList, setIngredientsList] = useState<IngredientDto[]>([])
    const [productsList, setProductsList] = useState<ProductDto[]>([])
    const [imagesList, setImagesList] = useState<ImageDto[]>([])
    const [tablesList, setTablesList] = useState<TableDto[]>([])
    const [styles, setStyles] = useState<StyleDto>()

    const [categoriesMap, setCategoriesMap] = useState<Map<number, CategoryDto>>(new Map())
    const [ingredientsMap, setIngredientsMap] = useState<Map<number, IngredientDto>>(new Map())
    const [productsMap, setProductsMap] = useState<Map<number, ProductDto>>(new Map())
    const [tablesMap, setTablesMap] = useState<Map<number, TableDto>>(new Map())
    const [allergensMap, setAllergensMap] = useState<Map<number, NameType>>(new Map())
    const [tagsMap, setTagsMap] = useState<Map<number, NameType>>(new Map())

    const {localname} = useParams()

    const [loading, setLoading] = useState(true);
    const [eventSource, setEventSource] = useState<EventSource | null>(null);

    // Funzione per caricare i dati iniziali
    const loadData = async () => {
        try {
            setLoading(true);
            const availableAllergens = new Map()
            allergens.forEach(allergen => {
                availableAllergens.set(allergen.id, allergen);
            });
            setAllergensMap(availableAllergens)

            const availableTags = new Map()
            tagsArray.forEach(tag => {
                availableTags.set(tag.id, tag);
            });
            setTagsMap(availableTags)

            let response = await getAll(dashboard, dashboard ? '' : localname);

            if (response && response.data) {
                const tmp = response.data
                if(tmp.categoriesList){
                    const tmpMap = new Map()
                    for(const category of tmp.categoriesList){
                        if(dashboard || (!dashboard && category.products.length > 0))
                            tmpMap.set(category.id, category)
                    }
                    setCategoriesMap(tmpMap)
                    setCategoriesList(tmp.categoriesList)
                }
                if(tmp.productsList){
                    const tmpMap: Map<number, ProductDto> = new Map()
                    for(const el of tmp.productsList){
                        tmpMap.set(el.id, el)
                    }
                    setProductsMap(tmpMap)
                    setProductsList(tmp.productsList)
                }
                if(dashboard && tmp.imagesList){
                    setImagesList(tmp.imagesList)
                }
                if(tmp.ingredientsList){
                    const tmpMap = new Map()
                    for(const el of tmp.ingredientsList){
                        tmpMap.set(el.id, el)
                    }
                    setIngredientsMap(tmpMap)
                    setIngredientsList(tmp.ingredientsList)
                }
                if(dashboard && tmp.tablesList){
                    const tmpMap = new Map()
                    for(const el of tmp.tablesList){
                        tmpMap.set(el.id, el)
                    }
                    setTablesMap(tmpMap)
                    setTablesList(tmp.tablesList)
                }
                if(tmp.style){
                    setStyles(tmp.style)
                }

            }
            startSSE()
        } catch (err) {
            console.error("Errore nel caricamento iniziale dei dati:", err);
        } finally {
            setLoading(false);
        }
    };

    // Funzione per avviare la connessione SSE
    const startSSE = () => {
        if (eventSource) {
            stopSSE(); // Chiudi eventuali connessioni esistenti
        }

        let url = process.env.REACT_APP_BACKEND_WEBFLUX_URL_BASE + (dashboard ? UPDATE_ENDPOINT_DASHBOARD : UPDATE_ENDPOINT(localname || ""));

        // Aggiungi il token come parametro di query solo per l'endpoint dashboard
        const token = getToken()
        console.log(token)
        if (dashboard && token) {
            url += `?token=${token}`;
        }

        const newEventSource = new EventSource(url);
        //const newEventSource = new EventSource(process.env.REACT_APP_BACKEND_URL_BASE + "" + (dashboard ? UPDATE_ENDPOINT_DASHBOARD : UPDATE_ENDPOINT(localname || "")));

        newEventSource.onmessage = (event) => {
            const update = JSON.parse(event.data);
            console.log(update)

            if (update && update.updates) {
                const tmp = (update.updates as ListToExport)
                if(tmp.categoriesList){
                    const tmpMap = new Map()
                    for(const category of tmp.categoriesList){
                        tmpMap.set(category.id, category)
                    }
                    setCategoriesMap(tmpMap)
                    setCategoriesList(tmp.categoriesList)
                }
                if(tmp.productsList){
                    const tmpMap = new Map()
                    for(const el of tmp.productsList){
                        tmpMap.set(el.id, el)
                    }
                    setProductsMap(tmpMap)
                    setProductsList(tmp.productsList)
                }
                if(dashboard && tmp.imagesList){
                    setImagesList(tmp.imagesList)
                }
                if(tmp.ingredientsList){
                    const tmpMap = new Map()
                    for(const el of tmp.ingredientsList){
                        tmpMap.set(el.id, el)
                    }
                    setIngredientsMap(tmpMap)
                    setIngredientsList(tmp.ingredientsList)
                }
                if(dashboard && tmp.tablesList){
                    const tmpMap = new Map()
                    for(const el of tmp.tablesList){
                        tmpMap.set(el.id, el)
                    }
                    setProductsMap(tmpMap)
                    setTablesList(tmp.tablesList)
                }
                if(tmp.style){
                    setStyles(tmp.style)
                }

            }

            //if (update.type === 'FULL_SYNC') {
            //    setData(update.updates); // Sostituisci tutto con i dati ricevuti
            //
            //} else if (update.type === 'PARTIAL_SYNC') {
            //    //setData((prevData) => ({
            //    //    ...prevData,
            //    //    ...update.updates // Aggiorna solo le liste inviate
            //    //}));
            //}
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
                    }
                }
                break
        }
        return !!response;

    }


    const addProduct = async (addProduct: AddProduct, file?: File | null) => {
        const formData: FormData = new FormData()

        formData.append("name", addProduct.name);
        formData.append("description", addProduct.description);
        formData.append("idCategory", addProduct.idCategory.toString());
        formData.append("available", addProduct.available ? "true" : "false");

        addProduct.allergens.forEach(element => {
            formData.append("allergens", element.toString());
        });

        addProduct.tags.forEach(element => {
            formData.append("tags", element.toString());
        });

        addProduct.ingredients.forEach(element => {
            formData.append("ingredients", element.toString());
        });

        addProduct.options.forEach(option => {
            formData.append("options", JSON.stringify(option)); // Se necessario, stringifica oggetti complessi
        });

        // Aggiungi il file se presente
        if (file) {
            formData.append("file", file);
        }
        let response = await addProductApi(formData);

        if(response?.status === 200 && response.data){
            console.log(response)
            const test: ProductDto = response.data
            console.log(test)
            let tmp = new Map(productsMap)
            tmp.set(response.data.id, response.data)
            setProductsMap(tmp)
            let categoryTmp = categoriesMap.get(response.data.idCategory)
            if(categoryTmp && categoryTmp.products){
                categoryTmp.products.push({longValue: response.data.id, intValue: response.data.positionProgressive})
                const tmpMap = new Map(categoriesMap)
                tmpMap.set(categoryTmp.id, categoryTmp)
                setCategoriesMap(tmpMap)
            }
        }
    }


    const changeOrderCategories = async (ordered: IdWithOrder[]) => {
        let response = await changeOrderCategoriesApi(ordered)
        console.log(categoriesMap)
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
            console.log(tmp)
            setCategoriesMap(tmp)
        }
    }

    const addIngredient = async (addIngredient: AddIngredient) => {
        let response = await addIngredientApi(addIngredient)
        if(response?.status === 200 && response.data){
            let tmp = new Map(ingredientsMap)
            tmp.set(response.data.id, response.data)
            setIngredientsMap(tmp)
        }
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
            tmp.set(response.data.id, response.data)
            setCategoriesMap(tmp)
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
        updateProduct.options.forEach(element => {
            formData.append("options", element.toString());
        });
        formData.append("idCategory", updateProduct.idCategory.toString())
        formData.append("positionProgressive", updateProduct.positionProgressive.toString())
        if(file)
            formData.append("file", file)
        let response = await updateProductApi(formData)

        if(response?.status === 200 && response.data){
            let tmp = new Map(productsMap)
            tmp.set(response.data.id, response.data)
            setProductsMap(tmp)
        }
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
        updateCategory.products.forEach(element => {
            formData.append("products", element.toString());
        });
        let response = await updateCategoryApi(formData)

        if(response?.status === 200 && response.data){
            let tmp = new Map(categoriesMap)
            const old = tmp.get(updateCategory.id)
            tmp.set(updateCategory.id, {name: updateCategory.name, description: updateCategory.description, progressiveNumber: old?.progressiveNumber || 0, id: updateCategory.id, products: updateCategory.products, available: updateCategory.available, image: response.data })
            setCategoriesMap(tmp)
        }
    }

    const updateIngredient = async (updateIngredient: UpdateIngredient) => {
        let response = await updateIngredientApi(updateIngredient)
        if(response?.status === 200 && response.data){
            console.log(response)
            let tmp = new Map(ingredientsMap)
            tmp.set(response.data.id, {name: updateIngredient.name, id: updateIngredient.id, addable: updateIngredient.addable, allergens: updateIngredient.allergens, available: updateIngredient.available, frozen: updateIngredient.frozen, price: updateIngredient.price})
            setIngredientsMap(tmp)
        }
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
                }
                break
            case "product":
                response = await deleteProductApi(id)
                console.log(response)
                if(response?.status === 200 && response.data){
                    let tmp = new Map(productsMap)
                    tmp.delete(id)
                    console.log(tmp)
                    setProductsMap(tmp)
                    const tmpMap = new Map()
                    Array.from(categoriesMap.values()).forEach((cat) => {
                        const products = cat.products.filter((value) => value.longValue !== id)
                        tmpMap.set(cat.id, {id: cat.id, name: cat.name, description: cat.description, image: cat.image, available: cat.available, progressiveNumber: cat.progressiveNumber, products: products})
                    })
                    setCategoriesMap(tmpMap)

                }
                break
            case "ingredient":
                response = await deleteIngredientApi(id)
                if(response?.status === 200 && response.data){
                    let tmp = new Map(ingredientsMap)
                    tmp.delete(id)
                    setIngredientsMap(tmp)
                }
                break
            case "table":
                response = await deleteTableApi()
                break
        }
    }

    // Effetto per caricare i dati iniziali
    useEffect(() => {
        loadData();
    }, []);

    // Cleanup quando il provider viene smontato
    useEffect(() => {
        return () => {
            stopSSE();
        };
    }, []);

    return (
        <DataContext.Provider
            value={{
                categoriesMap,
                imagesList,
                ingredientsMap,
                productsMap,
                tablesMap,
                styles,
                loading,
                tagsMap,
                allergensMap,
                changeAvailableAddable,
                addCategory,
                addProduct,
                addIngredient,
                updateProduct,
                updateCategory,
                updateIngredient,
                deleteEntity,
                changeOrderCategories
            }}
        >
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
