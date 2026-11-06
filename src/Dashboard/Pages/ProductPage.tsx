// src/pages/ProductPage.tsx

import React, { useEffect, useRef, useState } from "react";
import { useData } from "../../Context/DataContext";
import { useParams } from "react-router-dom";
import { ArrowLeft, Save, Plus, Trash2, Camera, Loader2 } from "lucide-react";

import { useHistory } from "../../Context/HistoryContext";
import { AddProduct, UpdateProduct, OptionInProduct, AiDescriptionTone, IS_ADMIN, VariantGroup } from "../../types";

import CustomLoading from "../../Components/CustomLoading";
import PillToggle from "../../Components/Dashboard/PillToggle";
import ManageItemsModal from "../../Components/Dashboard/ManageItemsModal";
import AllergenIngredientTagRow from "../../Components/AllergenIngredientTagRow";
import ProductAllergensEditor from "../../Components/Dashboard/ProductAllergensEditor";
import { allergenById, getProductAllergens, normalizeAllergenIds } from "../../Utilities/Utilities";
import {useNotification} from "../../Context/NotificationContext";
import { useLoginContext } from "../../Context/LoginContext";
import { useAiEnabled } from "../../Hooks/useAiInsights";
import { generateProductDescriptionApi } from "../../Utilities/api";
import VariantGroupsEditor from "../../Components/Dashboard/VariantGroupsEditor";
import VariantsPreview from "../../Components/Dashboard/VariantsPreview";
import { normalizeVariantGroups, validateVariantGroups } from "../../Components/Dashboard/variantUtils";

interface ProductPageProps {
    isNew: boolean;
}

const ProductPage: React.FC<ProductPageProps> = ({ isNew }) => {
    // STATI
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [id, setId] = useState<number>(-1);
    const [idCategory, setIdCategory] = useState<number>(-1);
    const [options, setOptions] = useState<OptionInProduct[]>([]);
    // Solo allergeni dichiarati sul prodotto: quelli degli ingredienti sono calcolati (ProductAllergensEditor)
    const [allergens, setAllergens] = useState<number[]>([]);
    const [traces, setTraces] = useState<number[]>([]);
    const [ingredients, setIngredients] = useState<number[]>([]);
    const [tags, setTags] = useState<number[]>([]);
    const [available, setAvailable] = useState<boolean>(true);
    const [myLoading, setMyLoading] = useState<boolean>(true);
    const [image, setImage] = useState<string>("");
    const [file, setFile] = useState<File | null>(null);
    const [priceMode, setPriceMode] = useState<"single" | "options">("single");
    const [singlePrice, setSinglePrice] = useState<number>(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<"ingredienti" | "tags" | null>(null);
    // Gruppi di varianti oltre al formato; "persisted" = come salvati sul server (id bloccati)
    const [variantGroups, setVariantGroups] = useState<VariantGroup[]>([]);
    const [persistedGroups, setPersistedGroups] = useState<VariantGroup[]>([]);
    const [aiTone, setAiTone] = useState<AiDescriptionTone>("classico");
    const [aiWriting, setAiWriting] = useState<boolean>(false);
    // Descrizione corrente: la generazione può durare un minuto e nel frattempo il campo può cambiare
    const descriptionRef = useRef(description);
    descriptionRef.current = description;

    // CONTEXT E ROUTING
    const {
        loading,
        tagsMap,
        productsMap,
        ingredientsMap,
        categoriesMap,
        addProduct,
        updateProduct
    } = useData();
    const {idProduct, localname} = useParams();
    const {previousPath, navigateWithHistory} = useHistory();
    const {addNotification} = useNotification();
    const { checkVariable } = useLoginContext();
    // "Scrivi con AI": solo titolare e solo se l'assistente AI è attivo sul backend
    const aiEnabled = useAiEnabled(checkVariable(IS_ADMIN));

    useEffect(() => {
        try{
            const hash = window.location.hash.replace('#', '').trim()
            if(hash && hash !== "") {
                setIdCategory(Number(hash) || -1)
            }
        }catch(e){

        }
        if (!loading) {
            if (!isNew && idProduct && productsMap.has(Number(idProduct))) {
                const product = productsMap.get(Number(idProduct))!;
                setId(product.id);
                setName(product.name);
                setDescription(product.description || "");
                // Scarta gli id negativi legacy (copie degli allergeni degli ingredienti)
                setAllergens(normalizeAllergenIds(product.allergens));
                setTraces(normalizeAllergenIds(product.traces));
                setTags(product.tags || []);
                setIngredients(product.ingredients || []);
                setAvailable(product.available);
                setIdCategory(product.idCategory);
                setImage(product.image || "");
                const loadedGroups = normalizeVariantGroups(product.variantGroups);
                setVariantGroups(loadedGroups);
                setPersistedGroups(loadedGroups);
                if (product.options && product.options.length > 0) {
                    if (product.options.length === 1 && product.options[0].name === "default") {
                        setPriceMode("single");
                        setSinglePrice(product.options[0].price);
                        setOptions([]);
                    } else {
                        setPriceMode("options");
                        setOptions(product.options);
                    }
                }
            }
            setMyLoading(false);
        }
    }, [loading, isNew, idProduct, productsMap]);

    // FUNZIONI DI SUPPORTO (COMPLETE)
    const resetFields = () => {
        setName("");
        setDescription("");
        setIdCategory(-1);
        setOptions([]);
        setAllergens([]);
        setTraces([]);
        setIngredients([]);
        setTags([]);
        setAvailable(true);
        setImage("");
        setFile(null);
        setId(-1);
        setPriceMode("single");
        setSinglePrice(0);
        setVariantGroups([]);
        setPersistedGroups([]);
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileTmp = event.target.files?.[0];
        if (fileTmp) {
            const reader = new FileReader();
            reader.onload = () => {
                setImage(reader.result as string);
                setFile(fileTmp);
            };
            reader.readAsDataURL(fileTmp);
        }
    };

    const changeNameOption = (index: number, name: string) => {
        const newOptions = [...options];
        if (newOptions[index]) {
            newOptions[index].name = name;
            setOptions(newOptions);
        }
    };

    const changePriceOption = (index: number, price: string) => {
        const newOptions = [...options];
        if (newOptions[index]) {
            newOptions[index].price = Number(Number(price).toFixed(2));
            setOptions(newOptions);
        }
    };

    const changeDefaultOption = (index: number) => {
        const newOptions = options.map((opt, i) => ({
            ...opt,
            isDefault: i === index,
        }));
        setOptions(newOptions);
    };

    const deleteOption = (index: number) => {
        const newOptions = options.filter((_, i) => i !== index);
        // Se l'opzione eliminata era quella di default, imposta la prima come nuovo default
        if (options[index]?.isDefault && newOptions.length > 0) {
            newOptions[0].isDefault = true;
        }
        setOptions(newOptions);
    };

    const addOption = () => {
        if (options.length >= 3) {
            addNotification({message: "Consentite fino a 3 opzioni", type: "warning"})
            return
        }
        const isFirstOption = options.length === 0;
        setOptions([...options, {name: "", price: 0, isDefault: isFirstOption}]);
    };

    const openModal = (type: "ingredienti" | "tags") => {
        setModalType(type);
        setIsModalOpen(true);
    };

    const handleNavigation = (path: string) => {
        let hash = ""
        try {
            hash = window.location.hash.replace('#', '');

            if (hash && hash !== "") {
                hash = "#" + hash
            }
        } catch (e) {
            hash = ""
        }

        if (previousPath && previousPath.includes(window.location.origin + "/" + localname + "/Dashboard")) {
            window.history.back();
        } else {
            navigateWithHistory(path + hash);
        }
    };

    const handleSave = async (andContinue: boolean = false) => {
        if (priceMode === "options") {
            if (options.length === 0) {
                addNotification({message: "Opzioni mancanti", type: "warning"})
                return
            }
            let error = false;
            options.forEach((value) => {
                if (value.isDefault && value.name.trim() === "") {
                    error = true
                    addNotification({message: "Opzione di default senza nome", type: "warning"})
                }
            })
            if (error)
                return
        }
        const variantErrors = validateVariantGroups(variantGroups);
        if (variantErrors.length > 0) {
            addNotification({message: "Varianti: " + variantErrors[0], type: "warning"})
            document.querySelector('[data-testid="variant-errors"]')?.scrollIntoView({behavior: "smooth", block: "center"})
            return
        }
        setMyLoading(true);
        let success = false;
        const finalOptions: OptionInProduct[] = priceMode === 'single' ? [{
            name: 'default',
            price: singlePrice,
            isDefault: true
        }] : options;

        if (isNew) {
            const payload: AddProduct & { variantGroups: VariantGroup[] } = {
                name,
                description,
                idCategory,
                available,
                image: image.startsWith("data") ? "" : image,
                ingredients,
                allergens,
                traces,
                tags,
                options: finalOptions,
                variantGroups
            };
            success = await addProduct(payload, file);
        } else {
            const payload: UpdateProduct & { variantGroups: VariantGroup[] } = {
                id,
                name,
                description,
                idCategory,
                available,
                image: image.startsWith("data") ? "" : image,
                ingredients,
                allergens,
                traces,
                tags,
                options: finalOptions,
                // Sempre inviato: "[]" rimuove i gruppi eliminati
                variantGroups,
                positionProgressive: 1
            };
            success = await updateProduct(payload, file || undefined);
        }

        setMyLoading(false);
        if (success) {
            addNotification({message: `Prodotto ${isNew ? 'creato' : 'aggiornato'} con successo!`, type: 'success'});
            if (andContinue) {
                resetFields();
            } else {
                handleNavigation(`/${localname}/Dashboard/Menu`);
            }
        } else {
            addNotification({message: 'Errore durante il salvataggio.', type: 'error'});
        }
    };

    const handleAiDescription = async () => {
        if (!name.trim()) {
            addNotification({message: "Indica il nome del piatto", type: "warning"});
            return;
        }
        const clip = (v: string) => v.trim().slice(0, 200);
        const ingredientNames = ingredients
            .map(i => ingredientsMap.get(i)?.name)
            .filter((n): n is string => !!n && n.trim() !== "")
            .map(clip)
            .slice(0, 30);
        const allergenNames = getProductAllergens({ allergens, traces, ingredients }, ingredientsMap).effective
            .map(a => allergenById.get(a)?.short.toLowerCase())
            .filter((n): n is string => !!n)
            .slice(0, 30);
        const categoryName = categoriesMap.get(idCategory)?.name;

        setAiWriting(true);
        const r = await generateProductDescriptionApi({
            name: clip(name),
            categoryName: categoryName ? clip(categoryName) : undefined,
            ingredients: ingredientNames,
            allergens: allergenNames,
            tone: aiTone,
        });
        setAiWriting(false);

        const generated = r.success ? r.data?.description?.trim() : undefined;
        if (!generated) {
            addNotification({message: r.message || "L'assistente AI non è disponibile in questo momento", type: "error"});
            return;
        }
        const current = descriptionRef.current.trim();
        if (current !== "" && current !== generated
            && !window.confirm("Sostituire la descrizione attuale con quella scritta dall'AI?")) return;
        setDescription(generated);
        addNotification({message: "Descrizione scritta: rileggila prima di salvare", type: "success"});
    };

    // Gli allergeni degli ingredienti non vengono più copiati sul prodotto: li calcola ProductAllergensEditor
    const addRemoveIngredient = (value: number[]) => {
        setIngredients([...value])
    }

    // Logica per il modale (completa)
    let modalProps = {
        title: "",
        itemsMap: new Map(),
        selectedItems: [] as number[],
        onChange: (items: number[]) => {
        },
    };
    switch (modalType) {
        case "ingredienti":
            modalProps = {
                title: "Gestisci Ingredienti",
                itemsMap: ingredientsMap,
                selectedItems: ingredients,
                onChange: addRemoveIngredient
            };
            break;
        case "tags":
            modalProps = {title: "Gestisci Tag", itemsMap: tagsMap, selectedItems: tags, onChange: setTags};
            break;
    }

    const handleAddOrRemove = (type: "allergeni" | "ingredienti" | "tags", id: number) => {
        let updater;
        if (type === "allergeni")
            updater = setAllergens;
        else if (type === "ingredienti")
            updater = setIngredients;
        else
            updater = setTags;

        updater((prev) =>
            prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
        );
    };

    // Anteprima e validazione live delle varianti
    const baseAllergenSummary = getProductAllergens({ allergens, traces, ingredients }, ingredientsMap);
    const variantErrorsLive = validateVariantGroups(variantGroups);
    const previewFormats = priceMode === "single"
        ? [{ name: "", price: singlePrice, isDefault: true }]
        : options.map(o => ({ name: o.name, price: Number(o.price) || 0, isDefault: o.isDefault }));

    return (
        <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
            {(myLoading || loading) && <CustomLoading isFullPage={true} isTransparent={true} message={"Salvataggio..."} />}

            {/* --- Action Bar Superiore --- */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <button onClick={() => handleNavigation(`/${localname}/Dashboard/Menu`)} className="flex items-center gap-2 text-gray-500 hover:text-primary font-semibold transition-colors">
                        <ArrowLeft /><span>Torna al Menu</span>
                    </button>
                    <h1 className="text-3xl font-bold text-gray-800 mt-1">{isNew ? "Nuovo Prodotto" : `Modifica: ${name}`}</h1>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    {isNew ? (
                        <>
                            <button onClick={() => handleSave(false)} className="btn-primary w-full md:w-auto flex items-center justify-center"><Save className="mr-2" />Salva e Chiudi</button>
                            <button onClick={() => handleSave(true)} className="btn-secondary w-full md:w-auto flex items-center justify-center"><Plus className="mr-2" />Salva e Aggiungi</button>
                        </>
                    ) : (
                        <button onClick={() => handleSave(false)} className="btn-primary w-full md:w-auto flex items-center justify-center"><Save className="mr-2" />Salva Modifiche</button>
                    )}
                </div>
            </div>

            {/* --- Layout a Griglia --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Colonna Sinistra */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Card Informazioni Base */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Informazioni Principali</h3>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="product-name" className="label-style">Nome Prodotto</label>
                                <input type="text" id="product-name" value={name} onChange={e => setName(e.target.value)} className="input-style" placeholder="Es. Pizza Margherita"/>
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                                    <label htmlFor="product-desc" className="label-style">Descrizione</label>
                                    {aiEnabled && (
                                        <div className="flex items-center gap-1.5">
                                            <select
                                                aria-label="Tono della descrizione"
                                                value={aiTone}
                                                onChange={e => setAiTone(e.target.value as AiDescriptionTone)}
                                                disabled={aiWriting}
                                                className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-400/50"
                                            >
                                                <option value="classico">Classico</option>
                                                <option value="elegante">Elegante</option>
                                                <option value="semplice">Semplice</option>
                                            </select>
                                            <button
                                                type="button"
                                                onClick={handleAiDescription}
                                                disabled={aiWriting}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap"
                                                title="Scrive una descrizione a partire da nome, categoria, ingredienti e allergeni"
                                            >
                                                {aiWriting ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Sto scrivendo…</> : <>✨ Scrivi con AI</>}
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <textarea id="product-desc" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="input-style" placeholder="Ingredienti e dettagli..."/>
                            </div>
                            <div>
                                <label htmlFor="product-category" className="label-style">Categoria</label>
                                <select id="product-category" value={idCategory} onChange={e => setIdCategory(Number(e.target.value))} className="input-style">
                                    <option value={-1} disabled>Seleziona una categoria</option>
                                    {Array.from(categoriesMap.values()).sort((a,b) => a.name.localeCompare(b.name)).map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Card Gestione Prezzi */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h3 className="text-xl font-bold text-gray-800 mb-1">Formato e prezzo</h3>
                        <p className="text-sm text-gray-500 mb-4">Il formato fissa il prezzo base (es. Baby / Normale / Maxi, ognuno col suo prezzo). Con un solo formato il cliente non vede nessuna scelta.</p>
                        <div className="flex items-center p-1 space-x-1 bg-gray-200 rounded-full w-max mb-4">
                            <button onClick={() => setPriceMode('single')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all ${priceMode === 'single' ? 'bg-white text-primary shadow' : 'text-gray-600'}`}>Prezzo Unico</button>
                            <button onClick={() => setPriceMode('options')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all ${priceMode === 'options' ? 'bg-white text-primary shadow' : 'text-gray-600'}`}>Più formati</button>
                        </div>
                        {priceMode === 'single' ? (
                            <div>
                                <label htmlFor="single-price" className="label-style">Prezzo (€)</label>
                                <input type="number" id="single-price" value={singlePrice} onChange={e => setSinglePrice(Number(e.target.value))} className="input-style w-full md:w-1/3" placeholder="0.00"/>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {options.map((option, index) => (
                                    <div key={index} className="flex flex-col md:flex-row items-center gap-3 bg-slate-50 p-3 rounded-lg border">
                                        <input type="text" value={option.name} onChange={e => changeNameOption(index, e.target.value)} className="input-style flex-grow" placeholder="Nome formato (es. Baby, Normale, Maxi)"/>
                                        <input type="number" value={option.price} onChange={e => changePriceOption(index, e.target.value)} className="input-style w-full md:w-28" placeholder="Prezzo €" aria-label="Prezzo del formato in euro"/>
                                        <div className="flex items-center gap-2" title="Imposta come predefinita">
                                            <input type="radio" id={`default-${index}`} name="default-option" checked={option.isDefault} onChange={() => changeDefaultOption(index)} className="h-4 w-4 text-primary focus:ring-primary"/>
                                            <label htmlFor={`default-${index}`} className="text-sm text-gray-600">Predefinito</label>
                                        </div>
                                        <button onClick={() => deleteOption(index)} className="text-red-400 hover:text-red-600 p-2 rounded-full"><Trash2/></button>
                                    </div>
                                ))}
                                {options.length < 3 && <button onClick={addOption} className="btn-secondary text-sm"><Plus className="mr-2"/>Aggiungi formato</button>}
                                {options.length === 1 && <p className="text-xs text-gray-500">Un solo formato: nel menu non compare la scelta, vale solo il prezzo.</p>}
                            </div>
                        )}
                    </div>

                    {/* Card Varianti (gruppi a scelta singola oltre al formato) */}
                    <div className="bg-white p-6 rounded-xl shadow-lg" id="varianti">
                        <div className="flex items-baseline justify-between gap-2 mb-1">
                            <h3 className="text-xl font-bold text-gray-800">Varianti</h3>
                            {variantGroups.length > 0 && <span className="text-xs text-gray-500">{variantGroups.length} {variantGroups.length === 1 ? "gruppo" : "gruppi"}</span>}
                        </div>
                        <VariantGroupsEditor
                            groups={variantGroups}
                            onChange={setVariantGroups}
                            persisted={persistedGroups}
                            productAllergens={baseAllergenSummary.effective}
                            errors={variantErrorsLive}
                        />
                    </div>

                    {/* Card Ingredienti, Allergeni e Tag */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Dettagli Aggiuntivi</h3>
                        <div className="space-y-4">
                            <AllergenIngredientTagRow color={"orange"} handleAddOrRemove={() => handleAddOrRemove("ingredienti", id)} name="Ingredienti" map={ingredientsMap} elements={ingredients} openModal={() => openModal("ingredienti")} />
                            <ProductAllergensEditor
                                allergens={allergens}
                                traces={traces}
                                ingredients={ingredients}
                                onChangeAllergens={setAllergens}
                                onChangeTraces={setTraces}
                            />
                            {//<AllergenIngredientTagRow handleAddOrRemove={() => handleAddOrRemove("tags", id)} name="Tag" map={tagsMap} elements={tags} openModal={() => openModal("tags")} />
                            }
                        </div>
                    </div>
                </div>

                {/* Colonna Destra */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Immagine Prodotto</h3>
                        <input id="imageUploadInput" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        <div onClick={() => document.getElementById("imageUploadInput")?.click()}
                             className="w-full aspect-video bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-gray-300 hover:border-primary transition-colors group">
                            {image ? <img src={file ? image : process.env.REACT_APP_BUCKET_URL + image} alt="Anteprima" className="w-full h-full object-cover" />
                                : <div className="text-center text-gray-500"><Camera className="w-12 h-12 mx-auto text-gray-400 group-hover:text-primary"/><p className="mt-2 text-sm font-semibold">Carica Immagine</p></div>}
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Stato</h3>
                        <PillToggle label="Visibilità Prodotto" enabled={available} onChange={setAvailable}/>
                        <p className="text-xs text-gray-500 mt-2">Se disabilitato, il prodotto non sarà visibile ai clienti nel menu.</p>
                    </div>
                    <div className="lg:sticky lg:top-4">
                        <VariantsPreview
                            formats={previewFormats}
                            groups={variantGroups}
                            baseAllergens={baseAllergenSummary.effective}
                            baseTraces={baseAllergenSummary.traces}
                        />
                    </div>
                </div>
            </div>

            {isModalOpen && modalType && (
                <ManageItemsModal
                    title={modalProps.title}
                    itemsMap={modalProps.itemsMap}
                    selectedItems={modalProps.selectedItems}
                    onChange={modalProps.onChange}
                    onClose={() => setIsModalOpen(false)}
                />
            )}
        </div>
    );
};

export default ProductPage;