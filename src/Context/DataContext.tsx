import React, {useEffect, useRef, useState, createContext, useContext, useMemo, useCallback} from 'react';
import {
    AddCategory, AddIngredient, AddProduct, AddTable,
    CategoryDto,
    DataContextType, Entity, IdWithOrder,
    ImageDto,
    IngredientDto,
    ListToExport,
    ProductDto,
    StyleDto,
    TableDto, UpdateCategory, UpdateIngredient, UpdateProduct, UpdateStyle, UpdateTables, WaiterDto
} from "../types";
import {
    addCategoryApi,
    addIngredientApi,
    addProductApi, addTableApi,
    changeComandStatusApi,
    changeOrderCategoriesApi, changeOrderProductsApi, confirmWaiterApi,
    deleteCategoryApi,
    deleteIngredientApi,
    deleteProductApi,
    deleteTableApi, deleteWaiterApi,
    forceDeleteTableApi,
    forceFreeTableApi,
    freeTableApi,
    getAll,
    getToken, getWaitersApi, getWaitersInviteUrlApi,
    setAddableIngredientApi,
    setAvailableCategoryApi,
    setAvailableIngredientApi,
    setAvailableProductApi, setBusyTableApi,
    UPDATE_ENDPOINT,
    updateCategoryApi,
    updateIngredientApi,
    updateProductApi, updateSingleTableApi, updateStyleApi, updateTablesApi
} from "../Utilities/api";
import {useParams} from "react-router-dom";
import {allergens} from "../Utilities/Utilities";
import {Comand} from "../ComandType";
import {useNotification} from "./NotificationContext";
import {OrderItem, Orders} from "../Dashboard/Pages/OrderPage";
import {LoginContext} from "./LoginContext";

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

    // ── Real-time connections ──────────────────────────────────────────────
    // Dashboard → WebSocket (Rust server, port 8083)
    // Public    → SSE (Spring WebFlux, port 8081) — unchanged
    const wsRef = useRef<WebSocket | null>(null);
    const reconnectDelayRef = useRef<number>(1000);
    const isMountedRef = useRef<boolean>(true);
    const [eventSource, setEventSource] = useState<EventSource | null>(null);

    // Read agencyId from LoginContext (available only inside DashboardRoutes).
    const loginCtx = useContext(LoginContext);
    const agencyId = loginCtx?.user?.idAgency;

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

        if(tmp.styleDto){
            setStyles(tmp.styleDto)
        }

        if (dashboard && tmp.comands){
            setComandList(tmp.comands)
        }

    }

    // ── Transforms the Rust WS payload into the internal ListToExport format ──
    const wsDataToListToExport = (data: any): ListToExport => {
        const result: ListToExport = {};
        if (data.categories?.length)
            result.categoriesList = new Map((data.categories as CategoryDto[]).map(c => [c.id, c]));
        if (data.products?.length)
            result.productsList = new Map((data.products as ProductDto[]).map(p => [p.id, p]));
        if (data.ingredients?.length)
            result.ingredientsList = new Map((data.ingredients as IngredientDto[]).map(i => [i.id, i]));
        if (data.tables?.length)
            result.tablesList = new Map((data.tables as TableDto[]).map(t => [t.id, t]));
        if (data.images?.length)
            result.imagesList = data.images;
        if (data.styles?.length)
            result.styleDto = data.styles[data.styles.length - 1];
        if (data.orders?.length)
            result.comands = data.orders;
        return result;
    };

    // ── Dashboard WebSocket (Rust server) ─────────────────────────────────
    const stopWS = useCallback(() => {
        if (wsRef.current) {
            // Prevent the onclose handler from triggering a reconnect.
            wsRef.current.onclose = null;
            wsRef.current.close();
            wsRef.current = null;
        }
    }, []);

    const startWS = useCallback((aid: number) => {
        stopWS();
        const token = getToken();
        if (!token) return;

        const base = process.env.REACT_APP_WS_URL_BASE;
        if (!base) {
            console.error('[WS] REACT_APP_WS_URL_BASE is not configured');
            return;
        }
        const url = `${base}/ws?token=${encodeURIComponent(token)}&agencyId=${aid}`;
        const ws = new WebSocket(url);
        wsRef.current = ws;

        ws.onopen = () => {
            reconnectDelayRef.current = 1000;
            console.log('[WS] connected');
        };

        ws.onmessage = (event: MessageEvent) => {
            try {
                const msg = JSON.parse(event.data as string);
                if (msg.type === 'AGGREGATED_UPDATE' && msg.data) {
                    setStates(wsDataToListToExport(msg.data));
                }
            } catch (e) {
                console.error('[WS] parse error', e);
            }
        };

        ws.onerror = () => ws.close();

        ws.onclose = () => {
            wsRef.current = null;
            if (!isMountedRef.current) return;
            const delay = Math.min(reconnectDelayRef.current, 30_000);
            reconnectDelayRef.current = delay * 2;
            console.log(`[WS] reconnecting in ${delay}ms`);
            setTimeout(() => {
                if (isMountedRef.current) startWS(aid);
            }, delay);
        };
    }, [stopWS]);

    // ── Public SSE (Spring WebFlux, unchanged) ────────────────────────────
    // Funzione per caricare i dati iniziali
    const loadData = async () => {
        try {
            setLoading(true);
            let response = await getAll(dashboard, dashboard ? '' : localname);
            if (response && response.data) {
                setStates(response.data)
            }
            // Public mode starts SSE immediately; dashboard WS is started
            // by a separate effect once agencyId is resolved from LoginContext.
            if (!dashboard) startSSE();
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

    // SSE — used only for public/client mode (unauthenticated menu browsing).
    const startSSE = () => {
        if (eventSource) stopSSE();
        const webfluxBase = process.env.REACT_APP_BACKEND_WEBFLUX_URL_BASE;
        if (!webfluxBase) {
            console.error('[SSE] REACT_APP_BACKEND_WEBFLUX_URL_BASE is not configured');
            return;
        }
        const url = webfluxBase + UPDATE_ENDPOINT(localname ?? '', true);
        const es = new EventSource(url);
        es.onmessage = (event) => {
            const update = JSON.parse(event.data);
            if (update?.updates) setStates(update.updates as ListToExport);
        };
        es.onerror = () => es.close();
        setEventSource(es);
    };

    const stopSSE = () => {
        eventSource?.close();
        setEventSource(null);
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


    const changeOrderProducts = async (ordered: IdWithOrder[], categoryId: number) => {
        const response = await changeOrderProductsApi(ordered)
        if(response?.status === 200 && response.data){
            const tmpProducts = new Map(productsMap)
            for(const p of ordered){
                const product = tmpProducts.get(p.id)
                if(product) {
                    product.positionProgressive = p.order
                    tmpProducts.set(p.id, product)
                }
            }
            setProductsMap(tmpProducts)

            const tmpCategories = new Map(categoriesMap)
            const category = tmpCategories.get(categoryId)
            if(category) {
                category.products = ordered.map(p => ({longValue: p.id, intValue: p.order}))
                tmpCategories.set(categoryId, category)
            }
            setCategoriesMap(tmpCategories)
            return true
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
            console.log(response)
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
        const response = await updateCategoryApi(formData)

        if(response?.status === 200 && response.data){
            let tmp = new Map(categoriesMap)
            const old = tmp.get(updateCategory.id)
            tmp.set(updateCategory.id, {name: updateCategory.name, description: updateCategory.description, progressiveNumber: old?.progressiveNumber || 0, id: updateCategory.id, products: updateCategory.products, available: updateCategory.available, image: response.data.data.image })
            setCategoriesMap(tmp)
            return true
        }
        return false
    }

    const updateStyle = async (updateStyle: UpdateStyle, logoFile: File | null, heroFile: File | null) => {
        const formData: FormData = new FormData()
        if(logoFile)
            formData.append("logoFile", logoFile)
        if(heroFile)
            formData.append("heroFile", heroFile)
        formData.append("backgroundGradient", updateStyle.backgroundGradient)
        formData.append("cardBackground", updateStyle.cardBackground)
        formData.append("primary", updateStyle.primary)
        formData.append("textBody", updateStyle.textBody)
        formData.append("textOnPrimary", updateStyle.textOnPrimary)
        formData.append("textTitle", updateStyle.textTitle)
        formData.append("address", updateStyle.address)
        formData.append("phone", updateStyle.phone)
        formData.append("facebookUrl", updateStyle.facebookUrl)
        formData.append("instagramUrl", updateStyle.instagramUrl)
        formData.append("heroImageUrl", updateStyle.heroImageUrl)
        formData.append("logoUrl", updateStyle.logoUrl)
        formData.append("restaurantName", updateStyle.restaurantName)
        formData.append("cardStyle", updateStyle.cardStyle)
        formData.append("showImages", updateStyle.showImages.toString())
        formData.append("font", updateStyle.font)
        formData.append("description", updateStyle.description || "")
        formData.append("openingHours", updateStyle.openingHours || "")
        formData.append("whatsapp", updateStyle.whatsapp || "")
        formData.append("tiktokUrl", updateStyle.tiktokUrl || "")
        formData.append("features", updateStyle.features || "[]")
        formData.append("sectionMenuTitle", updateStyle.sectionMenuTitle || "")
        formData.append("sectionBookingTitle", updateStyle.sectionBookingTitle || "")
        formData.append("sectionWhyTitle", updateStyle.sectionWhyTitle || "")
        formData.append("showWhyUs", (updateStyle.showWhyUs ?? true).toString())
        formData.append("showBooking", (updateStyle.showBooking ?? true).toString())
        formData.append("showTicker", (updateStyle.showTicker ?? true).toString())
        formData.append("landingTemplate", updateStyle.landingTemplate || "default")
        const response = await updateStyleApi(formData)
        if(response?.status === 200 && response.data){
            setStyles(response.data.data)
            return true
        }
        return false
    }

    const updateIngredient = async (updateIngredient: UpdateIngredient) => {
        const response = await updateIngredientApi(updateIngredient)
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
                const allergensToDelete = ingredientsMap.get(id)?.allergens || []
                if(response?.status === 200 && response.data){
                    let tmp = new Map(ingredientsMap)
                    tmp.delete(id)
                    setIngredientsMap(tmp)
                }
                if(response?.data?.data && response.data.data.length > 0) {
                    let tmpProducts = new Map(productsMap)
                    try {
                        for(const idProd of response.data.data){
                            const prod = tmpProducts.get(Number(idProd))
                            let ingredientsOld = prod?.ingredients || []
                            let allergensOld = prod?.allergens || []
                            let ingredientsNew: number[] = []
                            for(const ingId of ingredientsOld){
                                if(Number(ingId) !== id){
                                    ingredientsNew.push(Number(ingId))
                                }
                            }
                            if(prod)
                                prod.ingredients = ingredientsNew;

                            if(allergensToDelete.length > 0) {
                                const allergensNew: number[] = []
                                const tmpAllList: number[] = []
                                for (const allId of allergensOld) {
                                    const tmpId = Number(allId)
                                    if (tmpId < 0 && allergensToDelete.includes(0 - tmpId)) {
                                        if(!tmpAllList.includes(tmpId)) {
                                            tmpAllList.push(tmpId)
                                        }
                                    }else{
                                        allergensNew.push(tmpId)
                                    }
                                }
                                if(prod)
                                    prod.allergens = allergensNew
                            }

                            if(prod)
                                tmpProducts.set(prod.id, prod)
                            setProductsMap(tmpProducts)
                        }
                    }catch (error){
                        window.location.reload()
                    }
                }
                return true
                break
            case "table":

                break
        }
        return false
    }

    // Initial data load + public SSE.
    useEffect(() => {
        isMountedRef.current = true;
        loadData();
        return () => {
            isMountedRef.current = false;
            stopSSE();
            stopWS();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Dashboard WebSocket: connect once both initial load is done and agencyId
    // is resolved from LoginContext (may arrive slightly after mount).
    useEffect(() => {
        if (dashboard && !loading && agencyId) {
            startWS(agencyId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dashboard, loading, agencyId]);

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

    const getWaiters = async (): Promise<WaiterDto[] | null> => {
        setLoading(true)
        try {
            const response = await getWaitersApi()

            if (response && response.status === 200 && response.data?.data) {
                setLoading(false)
                return response.data.data || []
            }
            setLoading(false)
            return []
        }catch(error){
            setLoading(false)
            return null
        }
    }

    const deleteWaiter = async (id: number): Promise<boolean> => {
        setLoading(true)
        try {
            const response = await deleteWaiterApi(id)
            setLoading(false)
            return response && response.status === 200
        }catch(error){
            setLoading(false)
            return false
        }
    }

    const confirmWaiter = async (id: number): Promise<boolean> => {
        setLoading(true)
        try{
            const response = await confirmWaiterApi(id)
            setLoading(false)
            return response && response.status === 200
        }catch (error){
            setLoading(false)
            return false
        }
    }

    const getWaiterInvitationUrl = async () => {
        setLoading(true)
        try{
            const response = await getWaitersInviteUrlApi()
            if(response && response.status === 200 && response.data?.data){
                setLoading(false)
                return response.data.data
            }
            setLoading(false)
            return null
        } catch(error){
            setLoading(false)
            return null
        }
    }

    const addTableFunc = async (addTable: AddTable) => {
        const response = await addTableApi(addTable);
        if((response.status === 200 || response.status === 201) && response.data?.data){
            const tmp = new Map(tablesMap)
            const table = response.data.data
            tmp.set(table.id, table)
            setTablesMap(new Map(tmp))
            return true
        }
        return false
    }

    const updateTablesFunc = async (updateTables: UpdateTables) => {
        const response = await updateTablesApi(updateTables)
        if(response.status === 200 && response.data?.data){
            const tmp = new Map(tablesMap)
            for(const table of response.data.data) {
                tmp.set(table.id, table)
            }
            setTablesMap(new Map(tmp))
            return true
        }
        return false
    }

    const updateSingleTableFunc = async(table: TableDto) => {
        const response = await updateSingleTableApi(table)
        if(response.status === 200 && response.data?.data){
            const tmp = new Map(tablesMap)
            tmp.set(response.data.data.id, response.data.data)
            setTablesMap(new Map(tmp))
            return true
        }
        return false
    }


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
        deleteWaiter,
        confirmWaiter,
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
        changeOrderProducts,
        mapRawOrderToOrder,
        updateStyle,
        getWaiters,
        getWaiterInvitationUrl,
        addTableFunc,
        updateTablesFunc,
        updateSingleTableFunc
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
