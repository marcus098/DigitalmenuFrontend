import React, {useEffect, useRef, useState, createContext, useContext, useMemo} from 'react';
import { translateVariantGroups } from '../Utilities/variants';
import {
    AddCategory, AddIngredient, AddProduct, AddTable,
    CategoryDto,
    DataContextType, Entity, IdWithOrder,
    ImageDto,
    IngredientDto,
    ListToExport,
    ProductDto,
    StyleDto,
    BusyTableResult, TableDto, UpdateCategory, UpdateIngredient, UpdateProduct, UpdateStyle, UpdateTables, WaiterDto,
    CheckoutResult, VariantGroup,
} from "../types";
import {CheckoutRequest} from "../ComandType";
import {
    addCategoryApi,
    addIngredientApi,
    addProductApi, addTableApi,
    changeComandStatusApi,
    checkoutComandApi,
    approveComandApi,
    rejectComandApi,
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
    UPDATE_ENDPOINT_DASHBOARD,
    updateCategoryApi,
    updateIngredientApi,
    updateProductApi, updateSingleTableApi, updateStyleApi, updateTablesApi,
    setVariantAvailableApi
} from "../Utilities/api";
import {serializeVariantGroups} from "../Components/Dashboard/variantUtils";
import {useParams} from "react-router-dom";
import {allergens} from "../Utilities/Utilities";
import {Comand} from "../ComandType";
import {useNotification} from "./NotificationContext";
import {OrderItem, Orders} from "../Dashboard/Pages/OrderPage";
import {LoginContext} from "./LoginContext";
import {getMenuLanguagesApi, getMenuTranslationApi, MenuLanguage, PublicMenuTranslation} from "../Utilities/translationApi";

// Lista canonica dei 14 allergeni (Reg. UE 1169/2011): stessi id salvati nel database
const allergensMap = new Map(allergens.map(a => [a.id, { id: a.id, name: a.name }]));

const tagsMap = new Map([
    [1, { id: 1, name: "Vegetariano" }],
    [2, { id: 2, name: "Senza Glutine" }],
    [3, { id: 3, name: "Spicy" }],
    [4, { id: 4, name: "Classico" }],
]);


const DataContext = createContext<DataContextType | undefined>(undefined);

// ── SSE (Spring WebFlux) ────────────────────────────────────────────────────
const SSE_MIN_RETRY_MS = 1000;
const SSE_MAX_RETRY_MS = 30_000;

type SseHandle = {
    es: EventSource | null;
    timer: ReturnType<typeof setTimeout> | null;
    delay: number;
    connected: boolean;
};

const newSseHandle = (): SseHandle => ({ es: null, timer: null, delay: SSE_MIN_RETRY_MS, connected: false });

// Una comanda COMPLETED/DELETED esce dalla lista "attiva" della dashboard
// (stesso comportamento di changeComandStatus).
const isClosedStatus = (status?: string) => status === 'COMPLETED' || status === 'DELETED';
// In attesa di prepagamento: mai mostrata in dashboard (non è ancora un ordine per il locale).
const isHiddenStatus = (status?: string) => status === 'AWAIT_PAYMENT';
const visibleComands = (list: Comand[]) => list.filter(c => !isHiddenStatus(c.status) && !isClosedStatus(c.status));

// Avviso sonoro breve (Web Audio, nessun asset): nuovo ordine "su richiesta" da approvare.
const playAlertSound = () => {
    try {
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!Ctx) return;
        const ctx = new Ctx();
        [0, 0.25].forEach(offset => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 880;
            gain.gain.setValueAtTime(0.25, ctx.currentTime + offset);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.2);
            osc.connect(gain).connect(ctx.destination);
            osc.start(ctx.currentTime + offset);
            osc.stop(ctx.currentTime + offset + 0.2);
        });
        setTimeout(() => ctx.close?.(), 1000);
    } catch { /* autoplay bloccato: resta la notifica visiva */ }
};

export const DataProvider: React.FC<{ children: React.ReactNode, dashboard: boolean, waiters?: boolean }> = ({ children, dashboard, waiters = false }) => {
    const [imagesList, setImagesList] = useState<ImageDto[]>([])
    const [styles, setStyles] = useState<StyleDto>()
    const [selectedAllergens, setSelectedAllergens] = useState<number[]>([]);

    const [categoriesMap, setCategoriesMap] = useState<Map<number, CategoryDto>>(new Map())
    const [ingredientsMap, setIngredientsMap] = useState<Map<number, IngredientDto>>(new Map())
    const [productsMap, setProductsMap] = useState<Map<number, ProductDto>>(new Map())
    const [comands, setComandList] = useState<Comand[]>([])
    // Incrementato a ogni evento ordine via SSE (anche per comande chiuse/pagate): la Cassa lo usa
    // per ricaricare i pagamenti senza un canale realtime dedicato.
    const [orderEventTick, setOrderEventTick] = useState(0)
    const [tablesMap, setTablesMap] = useState<Map<number, TableDto>>(new Map())

    const { localname } = useParams()

    // ── Menu in più lingue (solo menu cliente) ─────────────────────────────
    // Le traduzioni sono solo per la visualizzazione: gli ordini usano gli id e il server
    // rimette i nomi italiani, quindi cucina e cassa restano in italiano.
    const translatable = !dashboard && !waiters && !!localname
    const langStorageKey = `menuLang:${localname ?? ''}`
    const [menuLanguages, setMenuLanguages] = useState<MenuLanguage[]>([])
    const [menuLang, setMenuLangState] = useState<string>('it')
    const [menuTexts, setMenuTexts] = useState<PublicMenuTranslation | null>(null)

    const setMenuLang = (lang: string) => {
        setMenuLangState(lang)
        try { localStorage.setItem(langStorageKey, lang) } catch { /* storage non disponibile */ }
    }

    useEffect(() => {
        if (!translatable || !localname) return
        let cancelled = false
        getMenuLanguagesApi(localname).then(res => {
            const langs = res.success && res.data?.data ? res.data.data : []
            if (cancelled || langs.length === 0) return
            setMenuLanguages(langs)
            // Lingua scelta in precedenza, altrimenti quella del telefono se il locale la offre
            let saved: string | null = null
            try { saved = localStorage.getItem(langStorageKey) } catch { /* ignore */ }
            const device = (navigator.language || '').slice(0, 2).toLowerCase()
            const pick = [saved, device].find(l => l && (l === 'it' || langs.some(x => x.code === l)))
            if (pick) setMenuLangState(pick)
        })
        return () => { cancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [translatable, localname])

    useEffect(() => {
        if (!translatable || !localname || menuLang === 'it') { setMenuTexts(null); return }
        let cancelled = false
        getMenuTranslationApi(localname, menuLang).then(res => {
            if (cancelled) return
            if (res.success && res.data?.data) setMenuTexts(res.data.data)
            else { setMenuTexts(null); setMenuLangState('it') }
        })
        return () => { cancelled = true }
    }, [translatable, localname, menuLang])
    const { addNotification } = useNotification()

    const [loading, setLoading] = useState(true);

    // ── Real-time connections (SSE WebFlux) ────────────────────────────────
    // Dashboard → /api/auth/admin?token=…   Public → /api/public/updates?localname=…
    const isMountedRef = useRef<boolean>(true);
    const adminSseRef = useRef<SseHandle>(newSseHandle());
    const publicSseRef = useRef<SseHandle>(newSseHandle());
    const comandsRef = useRef<Comand[]>([]);
    const comandsRefetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [initialLoaded, setInitialLoaded] = useState(false);

    // Read agencyId from LoginContext (available only inside DashboardRoutes).
    const loginCtx = useContext(LoginContext);
    const agencyId = loginCtx?.user?.idAgency;

    useEffect(() => {
        comandsRef.current = comands;
    }, [comands]);

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
            setComandList(visibleComands(tmp.comands))
        }

    }

    // Full refetch (senza toggle di `loading`): usato dopo una riconnessione SSE
    // per recuperare gli eventi persi mentre la connessione era giù.
    const refreshAll = async () => {
        try {
            const response = await getAll(dashboard, dashboard ? '' : localname);
            if (isMountedRef.current && response && response.data) {
                setStates(response.data)
            }
        } catch (err) {
            console.error("[SSE] refetch failed", err);
        }
    };

    // Refetch della sola lista comande (debounced): non esiste un endpoint
    // dashboard per la singola comanda, quindi si riusa getAll.
    const scheduleComandsRefetch = () => {
        if (comandsRefetchTimerRef.current) return;
        comandsRefetchTimerRef.current = setTimeout(async () => {
            comandsRefetchTimerRef.current = null;
            try {
                const response = await getAll(true);
                if (isMountedRef.current && response?.data?.comands) {
                    const next = visibleComands(response.data.comands);
                    // Nuovi ordini "su richiesta": avviso sonoro + notifica (il locale ha pochi minuti per rispondere)
                    const before = new Set(comandsRef.current.map(c => c.id));
                    const newApprovals = next.filter(c => c.status === 'AWAIT_APPROVAL' && !before.has(c.id)).length;
                    setComandList(next)
                    if (newApprovals > 0) {
                        playAlertSound();
                        addNotification({
                            message: newApprovals === 1 ? "Nuovo ordine da approvare" : `${newApprovals} ordini da approvare`,
                            type: "warning"
                        })
                    }
                }
            } catch (err) {
                console.error("[SSE] comands refetch failed", err);
            }
        }, 300);
    };

    // Upsert per id: il payload contiene DTO completi di categorie/prodotti.
    const mergeCatalogUpdate = (data: any) => {
        if (Array.isArray(data?.categories) && data.categories.length) {
            setCategoriesMap(prev => {
                const next = new Map(prev);
                for (const c of data.categories as CategoryDto[]) {
                    if (c?.id == null) continue;
                    next.set(c.id, { ...prev.get(c.id), ...c });
                }
                return next;
            });
        }
        if (Array.isArray(data?.products) && data.products.length) {
            setProductsMap(prev => {
                const next = new Map(prev);
                for (const p of data.products as ProductDto[]) {
                    if (p?.id == null) continue;
                    next.set(p.id, { ...prev.get(p.id), ...p });
                }
                return next;
            });
        }
        if (Array.isArray(data?.availability) && data.availability.length) {
            applyAvailability(data.availability)
        }
    };

    // "Esaurito" in tempo reale. Dashboard: si aggiorna il flag. Menu cliente: il catalogo pubblico contiene
    // solo elementi disponibili, quindi un esaurito sparisce e un ritorno disponibile ricarica il menu.
    const applyAvailability = (events: { kind: 'PRODUCT' | 'CATEGORY' | 'INGREDIENT', id: number, available: boolean, groupId?: string, choiceId?: string, choiceAvailable?: boolean }[]) => {
        const apply = <T extends { available?: boolean }>(kind: string, setter: React.Dispatch<React.SetStateAction<Map<number, T>>>) => {
            const list = events.filter(e => e.kind === kind)
            if (!list.length) return
            setter(prev => {
                const next = new Map(prev)
                for (const e of list) {
                    const current = next.get(e.id)
                    // Esaurita/ripristinata una singola scelta di variante: la disponibilità del prodotto non cambia
                    if (kind === 'PRODUCT' && e.groupId != null && e.choiceId != null && typeof e.choiceAvailable === 'boolean') {
                        const groups = (current as ProductDto | undefined)?.variantGroups
                        if (current && groups) {
                            next.set(e.id, { ...current, variantGroups: groups.map(g => g.id !== e.groupId ? g : {
                                ...g, choices: g.choices.map(c => c.id === e.choiceId ? { ...c, available: e.choiceAvailable as boolean } : c)
                            }) })
                        }
                        continue
                    }
                    if (dashboard || waiters) {
                        if (current) next.set(e.id, { ...current, available: e.available })
                    } else if (!e.available) {
                        next.delete(e.id)
                    }
                }
                return next
            })
        }
        apply<ProductDto>('PRODUCT', setProductsMap)
        apply<CategoryDto>('CATEGORY', setCategoriesMap)
        apply<IngredientDto>('INGREDIENT', setIngredientsMap)
        // Menu cliente: un elemento tornato disponibile non è nel catalogo pubblico, va ricaricato
        if (!dashboard && !waiters && events.some(e => e.available)) refreshAll()
    };

    // Gli eventi ordine sono stub {id, status, idAgency, paid?}: si aggiorna lo stato
    // delle comande note, si rimuovono quelle chiuse, e per id sconosciuti si
    // ricarica la lista (mai sostituire la lista con gli stub).
    const mergeOrderEvents = (events: { id?: string, status?: string, paid?: boolean }[]) => {
        const known = new Set(comandsRef.current.map(c => c.id));
        const updates = new Map<string, { status: Comand['status'], paid?: boolean }>();
        let newOrders = 0;
        let unknown = false;
        setOrderEventTick(t => t + 1);

        for (const e of events) {
            if (!e?.id || !e.status) continue;
            // In attesa di pagamento: il locale non deve vederla (né refetch né notifiche)
            if (isHiddenStatus(e.status)) continue;
            if (known.has(e.id)) {
                updates.set(e.id, { status: e.status as Comand['status'], paid: e.paid });
            } else if (!isClosedStatus(e.status)) {
                unknown = true;
                if (e.status === 'AWAIT' || e.status === 'PENDING') newOrders++;
            }
        }

        if (updates.size > 0) {
            setComandList(prev => visibleComands(prev
                .map(c => {
                    const u = c.id ? updates.get(c.id) : undefined;
                    if (!u) return c;
                    // paid può tornare false (rimborso totale)
                    return { ...c, status: u.status, ...(u.paid !== undefined ? { paid: u.paid } : {}) };
                })));
        }
        if (unknown) scheduleComandsRefetch();
        if (newOrders > 0) {
            addNotification({
                message: newOrders === 1 ? "Nuovo ordine ricevuto" : `${newOrders} nuovi ordini ricevuti`,
                type: "info"
            })
        }
    };

    const closeSSE = (h: SseHandle) => {
        if (h.timer) {
            clearTimeout(h.timer);
            h.timer = null;
        }
        if (h.es) {
            h.es.onopen = null;
            h.es.onmessage = null;
            h.es.onerror = null;
            h.es.close();
            h.es = null;
        }
    };

    // Apre un EventSource con riconnessione a backoff esponenziale.
    // Alla riconnessione (non alla prima apertura) esegue un refetch completo.
    const openSSE = (h: SseHandle, buildUrl: () => string | null, onPayload: (payload: any) => void) => {
        closeSSE(h);
        const url = buildUrl();
        if (!url) return;

        const es = new EventSource(url);
        h.es = es;

        es.onopen = () => {
            h.delay = SSE_MIN_RETRY_MS;
            if (h.connected) refreshAll();
            h.connected = true;
        };

        es.onmessage = (event: MessageEvent) => {
            try {
                onPayload(JSON.parse(event.data as string));
            } catch (e) {
                console.error('[SSE] parse error', e);
            }
        };

        es.onerror = () => {
            closeSSE(h);
            if (!isMountedRef.current) return;
            const delay = h.delay;
            h.delay = Math.min(delay * 2, SSE_MAX_RETRY_MS);
            h.timer = setTimeout(() => {
                h.timer = null;
                if (isMountedRef.current) openSSE(h, buildUrl, onPayload);
            }, delay);
        };
    };

    const webfluxBaseUrl = (): string | null => {
        const base = process.env.REACT_APP_BACKEND_WEBFLUX_URL_BASE;
        if (!base) {
            console.error('[SSE] REACT_APP_BACKEND_WEBFLUX_URL_BASE is not configured');
            return null;
        }
        return base;
    };

    // ── Dashboard SSE (admin) ─────────────────────────────────────────────
    const startAdminSSE = () => {
        openSSE(adminSseRef.current, () => {
            const base = webfluxBaseUrl();
            const token = getToken();
            if (!base || !token) return null;
            return `${base}${UPDATE_ENDPOINT_DASHBOARD}?token=${encodeURIComponent(token)}`;
        }, (payload) => {
            if (payload?.type !== 'aggregated_update' || !payload.data) return;
            mergeCatalogUpdate(payload.data);
            if (Array.isArray(payload.data.orders) && payload.data.orders.length) {
                mergeOrderEvents(payload.data.orders);
            }
        });
    };

    const stopAdminSSE = () => {
        closeSSE(adminSseRef.current);
        adminSseRef.current.connected = false;
        adminSseRef.current.delay = SSE_MIN_RETRY_MS;
    };

    // Rilegge solo i tavoli dal getAll autenticato. Serve all'area camerieri (il catalogo pubblico
    // ha tablesList vuota) e dopo apertura/chiusura di una sessione tavolo, per aggiornare subito la Sala.
    const refreshTables = async () => {
        try {
            const res = await getAll(true)
            if (isMountedRef.current && res?.data?.tablesList) {
                setTablesMap(new Map(res.data.tablesList))
            }
        } catch (err) {
            console.error("Errore nel caricamento dei tavoli:", err)
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
            // Area camerieri: il catalogo pubblico non contiene i tavoli (tablesList vuota),
            // quindi si leggono dal getAll autenticato (il cameriere è loggato con rf_token).
            if (waiters) await refreshTables()
            // Public mode starts SSE immediately; dashboard SSE is started
            // by a separate effect once agencyId is resolved from LoginContext.
            if (!dashboard) startSSE();
        } catch (err) {
            console.error("Errore nel caricamento iniziale dei dati:", err);
        } finally {
            setLoading(false);
            setInitialLoaded(true);
        }
    };

    const mapRawOrderToOrder = (hasComands?: Comand[]): Orders[] => {
        const orders: Orders[] = []
        const list: Comand[] = hasComands ? [...hasComands] : [...comands]

        list.forEach((c) => {
            const items: OrderItem[] = []
            ;(c.orders || []).forEach((o) => {
                    ;(o.products || []).forEach((p) => {
                        // productOption può essere null per prodotti senza opzioni (es. asporto Margherita).
                        const optPrice = p.productOption?.price ?? 0
                        const optName  = p.productOption?.name  ?? ''
                        const plus     = p.ingredientsPlus || []
                        const minus    = p.ingredientsMinus || []
                        const variants = p.selectedVariants || []
                        items.push({
                            productName: p.productName || "",
                            categoryName: p.categoryName || "",
                            // Prezzo unitario calcolato dal server (formato + varianti + extra); fallback per comande vecchie
                            total: p.unitPriceCents != null ? p.unitPriceCents / 100
                                : optPrice + variants.reduce((acc, v) => acc + (Number(v?.priceDelta) || 0), 0)
                                  + plus.reduce((acc, i) => acc + (i?.price ?? 0), 0),
                            variants,
                            option: optName,
                            additionalIngredients: plus.map((i) => i?.name || ''),
                            removedIngredients: minus.map((i) => i?.name || ''),
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
                        createdAt: c.createdAt,
                        paid: !!c.paid,
                        approvalDeadline: c.approvalDeadline,
                        approvalRequired: !!c.approvalRequired,
                        paymentAuthorized: !!c.paymentAuthorized
                    })
                }

            )
        });
        return orders
    };

    // SSE — used only for public/client mode (unauthenticated menu browsing).
    // Gli eventi ordine (stub) non interessano il menu pubblico.
    const startSSE = () => {
        openSSE(publicSseRef.current, () => {
            const base = webfluxBaseUrl();
            return base ? base + UPDATE_ENDPOINT(localname ?? '', true) : null;
        }, (payload) => {
            if (payload?.data) mergeCatalogUpdate(payload.data);
        });
    };

    const stopSSE = () => {
        closeSSE(publicSseRef.current);
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


    // Esaurisce/ripristina una scelta di un gruppo di varianti (come setAvailable del prodotto)
    const setVariantAvailable: VariantAvailabilitySetter = async (idProduct, groupId, choiceId, value) => {
        const response = await setVariantAvailableApi(idProduct, groupId, choiceId, value)
        if (response?.status !== 200) return false
        setProductsMap(prev => {
            const prod = prev.get(idProduct)
            if (!prod) return prev
            const next = new Map(prev)
            next.set(idProduct, {
                ...prod,
                variantGroups: (prod.variantGroups || []).map(g => g.id !== groupId ? g : {
                    ...g,
                    choices: g.choices.map(c => c.id === choiceId ? { ...c, available: value } : c)
                })
            })
            return next
        })
        return true
    }

    const addProduct = async (addProduct: AddProduct & { variantGroups?: VariantGroup[] }, file?: File | null) => {
        const formData: FormData = new FormData()

        formData.append("name", addProduct.name);
        formData.append("description", addProduct.description);
        formData.append("idCategory", addProduct.idCategory.toString());
        formData.append("available", addProduct.available ? "true" : "false");
//
        addProduct.allergens.forEach(element => {
            formData.append("allergens", element.toString());
        });
        // "0" = nessuna traccia: senza il parametro il server mantiene quelle salvate
        const addTraces = addProduct.traces ?? []
        if (addTraces.length === 0) formData.append("traces", "0")
        addTraces.forEach(t => formData.append("traces", t.toString()))
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
        // Varianti: JSON standard così com'è (senza il trucco ; → , delle options)
        if (addProduct.variantGroups)
            formData.append("variantGroups", serializeVariantGroups(addProduct.variantGroups));

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
        // Aggiornamento ottimistico con rollback, come per le categorie
        const previousProducts = productsMap
        const previousCategories = categoriesMap
        const tmpProducts = new Map(productsMap)
        for(const p of ordered){
            const product = tmpProducts.get(p.id)
            if(product) tmpProducts.set(p.id, {...product, positionProgressive: p.order})
        }
        setProductsMap(tmpProducts)

        const tmpCategories = new Map(categoriesMap)
        const category = tmpCategories.get(categoryId)
        if(category) {
            tmpCategories.set(categoryId, {...category, products: ordered.map(p => ({longValue: p.id, intValue: p.order}))})
        }
        setCategoriesMap(tmpCategories)

        const response = await changeOrderProductsApi(ordered)
        if(response?.status === 200 && response.data){
            return true
        }
        setProductsMap(previousProducts)
        setCategoriesMap(previousCategories)
        return false
    }

    const changeOrderCategories = async (ordered: IdWithOrder[]) => {
        // Aggiornamento ottimistico: la lista resta dove l'utente l'ha lasciata,
        // senza tornare indietro in attesa del server. Rollback se la chiamata fallisce.
        const previous = categoriesMap
        const orderById = new Map(ordered.map(c => [c.id, c.order]))
        const tmp = new Map(categoriesMap)
        for(const [id, category] of categoriesMap){
            const order = orderById.get(id)
            if(order !== undefined) tmp.set(id, {...category, progressiveNumber: order})
        }
        setCategoriesMap(tmp)
        const response = await changeOrderCategoriesApi(ordered)
        if(response?.status === 200 && response.data){
            return true
        }
        setCategoriesMap(previous)
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

    /** Accetta un ordine "su richiesta": diventa PENDING (stampa + incasso dell'eventuale autorizzazione). */
    const approveComand = async (idComand: string): Promise<boolean> => {
        const response = await approveComandApi(idComand)
        if (response.success) {
            setComandList(prev => prev.map(c => c.id === idComand ? { ...c, status: 'PENDING' as Comand['status'] } : c))
            addNotification({message: "Ordine accettato", type: "success"})
            return true
        }
        addNotification({message: response.message || "Impossibile accettare l'ordine", type: "error"})
        scheduleComandsRefetch()
        return false
    }

    /** Rifiuta un ordine "su richiesta" (motivo opzionale mostrato al cliente, autorizzazione annullata). */
    const rejectComand = async (idComand: string, reason?: string): Promise<boolean> => {
        const response = await rejectComandApi(idComand, reason)
        if (response.success) {
            setComandList(prev => prev.filter(c => c.id !== idComand))
            addNotification({message: "Ordine rifiutato", type: "success"})
            return true
        }
        addNotification({message: response.message || "Impossibile rifiutare l'ordine", type: "error"})
        scheduleComandsRefetch()
        return false
    }

    const changeComandStatus = async (idComand: string, status: 'PROGRESS' | 'COMPLETED' | 'DELETED' | 'PENDING'): Promise<boolean> => {
        const response = await changeComandStatusApi(idComand, status)
        if(response.status === 200){
            const values = [...comands]
            const tmp: Comand[] = []
            values.forEach(c => {
                if(c.id === idComand){
                    c.status = status
                }
                if(!isClosedStatus(c.status)){
                    tmp.push(c)
                }
            })
            setComandList([...tmp])
            return true
        }else{
            addNotification({message: "Errore", type: "error"})
            return false
        }
    }

    const checkoutComand = async (idComand: string, req: CheckoutRequest): Promise<CheckoutResult | null> => {
        const response = await checkoutComandApi(idComand, req)
        if(response.success && response.data){
            // Come changeComandStatus: la comanda chiusa esce dalla lista attiva
            setComandList(comands.filter(c => c.id !== idComand))
            return response.data
        }
        const msg = response.status === 409 ? "Conto già chiuso o comanda non chiudibile in questo stato"
            : response.message && !response.message.startsWith('Request failed') ? response.message
            : "Errore nella chiusura del conto"
        addNotification({message: msg, type: "error"})
        return null
    }

    const updateProduct = async (updateProduct: UpdateProduct & { variantGroups?: VariantGroup[] }, file?: File) => {
        const formData: FormData = new FormData()
        formData.append("id", updateProduct.id.toString())
        formData.append("name", updateProduct.name)
        formData.append("available", updateProduct.available.toString())
        formData.append("image", updateProduct.image)
        formData.append("description", updateProduct.description)
        updateProduct.allergens.forEach(element => {
            formData.append("allergens", element.toString());
        });
        const updTraces = updateProduct.traces ?? []
        if (updTraces.length === 0) formData.append("traces", "0")
        updTraces.forEach(t => formData.append("traces", t.toString()))
        updateProduct.tags.forEach(element => {
            formData.append("tags", element.toString());
        });
        updateProduct.ingredients.forEach(element => {
            formData.append("ingredients", element.toString());
        });
        updateProduct.options.forEach(option => {
            formData.append("options", JSON.stringify(option).replaceAll(",", ";"));
        });
        // Assente = nessuna modifica; "[]" = rimuove tutti i gruppi
        if (updateProduct.variantGroups)
            formData.append("variantGroups", serializeVariantGroups(updateProduct.variantGroups));
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

    const updateStyle = async (updateStyle: UpdateStyle, logoFile: File | null, heroFile: File | null, onError?: (message: string) => void) => {
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
        // Campi aspetto hero/secondario: omessi se undefined (il backend li lascia invariati),
        // stringa vuota = reset al default del template.
        if (updateStyle.heroBgColor !== undefined) formData.append("heroBgColor", updateStyle.heroBgColor)
        if (typeof updateStyle.heroOverlayOpacity === "number") formData.append("heroOverlayOpacity", updateStyle.heroOverlayOpacity.toString())
        if (updateStyle.secondaryColor !== undefined) formData.append("secondaryColor", updateStyle.secondaryColor)
        if (updateStyle.secondaryTextColor !== undefined) formData.append("secondaryTextColor", updateStyle.secondaryTextColor)
        // Sito vetrina a sezioni: omesso = invariato, "" = torna al sito classico.
        if (updateStyle.landingConfig !== undefined) formData.append("landingConfig", updateStyle.landingConfig)
        const response = await updateStyleApi(formData)
        if(response?.status === 200 && response.data){
            setStyles(response.data.data)
            return true
        }
        // 400 del backend (es. sito vetrina non valido): il messaggio è già leggibile
        if (response?.status === 400 && response.message) onError?.(response.message)
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
            stopAdminSSE();
            if (comandsRefetchTimerRef.current) {
                clearTimeout(comandsRefetchTimerRef.current);
                comandsRefetchTimerRef.current = null;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Dashboard SSE: connect once the initial load is done and agencyId is
    // resolved from LoginContext (may arrive slightly after mount). Uses
    // `initialLoaded` (not `loading`, which other actions toggle) so the
    // stream isn't torn down on every loading change.
    useEffect(() => {
        if (!dashboard || !initialLoaded || !agencyId) return;
        startAdminSSE();
        return () => stopAdminSSE();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dashboard, initialLoaded, agencyId]);

    const freeTableContext = async(id: number): Promise<string> => {
        const response = await freeTableApi(id)
        switch (response.status){
            case 200:
                const tmp = new Map(tablesMap)
                const table = tmp.get(id)

                if(table){
                    tmp.set(id, { ...table, busy: false, seats: 0, code: response.data?.data || "" })
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
                tmp.set(id, { ...table, busy: false, seats: 0, code: response.data?.data || "" })
            }else{
                window.location.reload()
            }

            setTablesMap(new Map(tmp))

            return true
        }
        addNotification({message: "Errore", type: "error"})
        return false
    }

    // Apre il tavolo (sessione vera lato server): la risposta contiene il codice d'accesso
    // di 4 caratteri da dare ai clienti. 409 = tavolo già aperto (es. da un altro cameriere).
    const setBusyTable = async(id: number, seats: number): Promise<BusyTableResult> => {
        const response = await setBusyTableApi(id, seats)
        if(response.status === 200){
            const code = response.data?.data || ""
            setTablesMap(prev => {
                const table = prev.get(id)
                if (!table) return prev
                const next = new Map(prev)
                next.set(id, { ...table, busy: true, seats: seats, code: code || table.code })
                return next
            })
            return { result: "SUCCESS", code }
        }
        if(response.status === 409){
            // Lo stato locale era vecchio: riallinea la Sala con il server
            refreshTables()
            return { result: "ALREADY_OPEN" }
        }
        return { result: "ERROR" }
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


    // Mappe con nomi e descrizioni nella lingua scelta (i testi non tradotti restano in italiano)
    const shownCategories = useMemo(() => {
        const t = menuTexts?.texts.CATEGORY
        if (!t) return categoriesMap
        const out = new Map(categoriesMap)
        out.forEach((c, id) => {
            const tr = t[String(id)]
            if (tr) out.set(id, {...c, name: tr.NAME ?? c.name, description: tr.DESCRIPTION ?? c.description})
        })
        return out
    }, [categoriesMap, menuTexts])

    const shownProducts = useMemo(() => {
        const t = menuTexts?.texts.PRODUCT
        // Varianti: VARIANT[idProdotto]["gruppo" | "gruppo/scelta"] (vedi translateVariantGroups)
        const v = (menuTexts?.texts as Record<string, Record<string, Record<string, string>> | undefined> | undefined)?.VARIANT
        if (!t && !v) return productsMap
        const out = new Map(productsMap)
        out.forEach((p, id) => {
            const tr = t?.[String(id)]
            const vt = v?.[String(id)]
            if (tr || vt) out.set(id, {
                ...p,
                name: tr?.NAME ?? p.name,
                description: tr?.DESCRIPTION ?? p.description,
                variantGroups: translateVariantGroups(p.variantGroups, vt),
            })
        })
        return out
    }, [productsMap, menuTexts])

    const shownIngredients = useMemo(() => {
        const t = menuTexts?.texts.INGREDIENT
        if (!t) return ingredientsMap
        const out = new Map(ingredientsMap)
        out.forEach((i, id) => {
            const tr = t[String(id)]
            if (tr?.NAME) out.set(id, {...i, name: tr.NAME})
        })
        return out
    }, [ingredientsMap, menuTexts])

    const contextValue = useMemo(() => ({
        categoriesMap: shownCategories,
        imagesList,
        ingredientsMap: shownIngredients,
        productsMap: shownProducts,
        menuLang,
        menuLanguages,
        setMenuLang,
        tablesMap,
        styles,
        loading,
        tagsMap,
        allergensMap,
        waiters,
        comands,
        orderEventTick,
        selectedAllergens,
        deleteWaiter,
        confirmWaiter,
        freeTableContext,
        forceFreeTableContext,
        deleteTable,
        forceDeleteTable,
        setBusyTable,
        refreshTables,
        setSelectedAllergens,
        changeAvailableAddable,
        setVariantAvailable,
        addCategory,
        addProduct,
        changeComandStatus,
        checkoutComand,
        approveComand,
        rejectComand,
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
        shownCategories,
        imagesList,
        shownIngredients,
        shownProducts,
        menuLang,
        menuLanguages,
        tablesMap,
        styles,
        loading,
        tagsMap,
        allergensMap,
        waiters,
        selectedAllergens,
        comands,
        orderEventTick
    ]);

    return (
        <DataContext.Provider value={contextValue}>
            {children}
        </DataContext.Provider>
    );

};

export type VariantAvailabilitySetter = (idProduct: number, groupId: string, choiceId: string, value: boolean) => Promise<boolean>;

/** Azione "esaurisci/ripristina scelta" (aggiunta al contesto senza toccare DataContextType condiviso). */
export const useSetVariantAvailable = (): VariantAvailabilitySetter =>
    (useData() as DataContextType & { setVariantAvailable: VariantAvailabilitySetter }).setVariantAvailable;

// Custom hook per accedere al DataContext
export const useData = (): DataContextType => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};
