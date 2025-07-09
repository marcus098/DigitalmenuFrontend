// src/pages/ProductPage.tsx

import React, { useEffect, useState } from "react";
import { useData } from "../../Context/DataContext";
import { useParams } from "react-router-dom";
import { FaArrowLeft, FaSave, FaPlus, FaTrashAlt } from "react-icons/fa";
import { CameraIcon } from '@heroicons/react/24/solid';

import { useHistory } from "../../Context/HistoryContext";
import { AddProduct, UpdateProduct, OptionInProduct } from "../../types";

import CustomLoading from "../../Components/CustomLoading";
import PillToggle from "../../Components/Dashboard/PillToggle";
import ManageItemsModal from "../../Components/Dashboard/ManageItemsModal";
import AllergenIngredientTagRow from "../../Components/AllergenIngredientTagRow";
import {useNotification} from "../../Context/NotificationContext";

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
    const [allergens, setAllergens] = useState<number[]>([]);
    const [ingredients, setIngredients] = useState<number[]>([]);
    const [tags, setTags] = useState<number[]>([]);
    const [available, setAvailable] = useState<boolean>(true);
    const [myLoading, setMyLoading] = useState<boolean>(true);
    const [image, setImage] = useState<string>("");
    const [file, setFile] = useState<File | null>(null);
    const [priceMode, setPriceMode] = useState<"single" | "options">("single");
    const [singlePrice, setSinglePrice] = useState<number>(0);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<"allergeni" | "ingredienti" | "tags" | null>(null);

    // CONTEXT E ROUTING
    const {
        loading,
        allergensMap,
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
                setAllergens(product.allergens || []);
                setTags(product.tags || []);
                setIngredients(product.ingredients || []);
                setAvailable(product.available);
                setIdCategory(product.idCategory);
                setImage(product.image || "");
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
        setIngredients([]);
        setTags([]);
        setAvailable(true);
        setImage("");
        setFile(null);
        setId(-1);
        setPriceMode("single");
        setSinglePrice(0);
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

    const openModal = (type: "allergeni" | "ingredienti" | "tags") => {
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
        setMyLoading(true);
        let success = false;
        const finalOptions: OptionInProduct[] = priceMode === 'single' ? [{
            name: 'default',
            price: singlePrice,
            isDefault: true
        }] : options;

        if (isNew) {
            const payload: AddProduct = {
                name,
                description,
                idCategory,
                available,
                image: image.startsWith("data") ? "" : image,
                ingredients,
                allergens,
                tags,
                options: finalOptions
            };
            success = await addProduct(payload, file);
        } else {
            const payload: UpdateProduct = {
                id,
                name,
                description,
                idCategory,
                available,
                image: image.startsWith("data") ? "" : image,
                ingredients,
                allergens,
                tags,
                options: finalOptions,
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

    const addRemoveIngredient = (value: number[]) => {
        const tmp = [...ingredients]
        const removed: number[] = []

        tmp
            .filter(i => {
                const ings = ingredientsMap.get(i);
                return ings && ings.allergens.length > 0 && !value.includes(i)
            })
            .forEach(i => (ingredientsMap.get(i)?.allergens || []).forEach(el => removed.push(el)))

        const added: number[] = []

        value
            .filter(i => {
                const ings = ingredientsMap.get(i);
                return ings && ings.allergens.length > 0 && !tmp.includes(i)
            })
            .forEach(i => (ingredientsMap.get(i)?.allergens || []).forEach(el => added.push(el)))

        console.log(removed)
        console.log(added)

        const currentAllergens = removed.length > 0 ? [] : [...allergens]

        console.log(allergens)

        if (removed.length > 0) {
            const removedCopy = [...removed].map(e => -e)

            allergens.forEach(val => {
                const index = removedCopy.indexOf(val);
                if (index !== -1) {
                    removedCopy.splice(index, 1);
                } else {
                    currentAllergens.push(val);
                }
            });
        }

        if (added.length > 0) {
            added.forEach((ad) => {
                currentAllergens.push(-ad)
            })
        }

        if (removed.length > 0 || added.length > 0)
            setAllergens([...currentAllergens])

        console.log(currentAllergens)
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
        case "allergeni":
            modalProps = {
                title: "Gestisci Allergeni",
                itemsMap: allergensMap,
                selectedItems: allergens.filter((num, index, self) => {
                    const absVal = Math.abs(num);
                    const hasNegative = self.includes(-absVal);
                    if (num < 0) return self.indexOf(num) === index;
                    return !hasNegative
                }),
                onChange: setAllergens
            };
            break;
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

    return (
        <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
            {(myLoading || loading) && <CustomLoading isFullPage={true} isTransparent={true} message={"Salvataggio..."} />}

            {/* --- Action Bar Superiore --- */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <button onClick={() => handleNavigation(`/${localname}/Dashboard/Menu`)} className="flex items-center gap-2 text-gray-500 hover:text-primary font-semibold transition-colors">
                        <FaArrowLeft /><span>Torna al Menu</span>
                    </button>
                    <h1 className="text-3xl font-bold text-gray-800 mt-1">{isNew ? "Nuovo Prodotto" : `Modifica: ${name}`}</h1>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    {isNew ? (
                        <>
                            <button onClick={() => handleSave(false)} className="btn-primary w-full md:w-auto flex items-center justify-center"><FaSave className="mr-2" />Salva e Chiudi</button>
                            <button onClick={() => handleSave(true)} className="btn-secondary w-full md:w-auto flex items-center justify-center"><FaPlus className="mr-2" />Salva e Aggiungi</button>
                        </>
                    ) : (
                        <button onClick={() => handleSave(false)} className="btn-primary w-full md:w-auto flex items-center justify-center"><FaSave className="mr-2" />Salva Modifiche</button>
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
                                <label htmlFor="product-desc" className="label-style">Descrizione</label>
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
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Gestione Prezzi</h3>
                        <div className="flex items-center p-1 space-x-1 bg-gray-200 rounded-full w-min mb-4">
                            <button onClick={() => setPriceMode('single')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all ${priceMode === 'single' ? 'bg-white text-primary shadow' : 'text-gray-600'}`}>Prezzo Unico</button>
                            <button onClick={() => setPriceMode('options')} className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all ${priceMode === 'options' ? 'bg-white text-primary shadow' : 'text-gray-600'}`}>Opzioni Multiple</button>
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
                                        <input type="text" value={option.name} onChange={e => changeNameOption(index, e.target.value)} className="input-style flex-grow" placeholder="Nome opzione (es. Regular, Maxi)"/>
                                        <input type="number" value={option.price} onChange={e => changePriceOption(index, e.target.value)} className="input-style w-full md:w-28" placeholder="Prezzo"/>
                                        <div className="flex items-center gap-2" title="Imposta come predefinita">
                                            <input type="radio" id={`default-${index}`} name="default-option" checked={option.isDefault} onChange={() => changeDefaultOption(index)} className="h-4 w-4 text-primary focus:ring-primary"/>
                                            <label htmlFor={`default-${index}`} className="text-sm text-gray-600">Default</label>
                                        </div>
                                        <button onClick={() => deleteOption(index)} className="text-red-400 hover:text-red-600 p-2 rounded-full"><FaTrashAlt/></button>
                                    </div>
                                ))}
                                {options.length < 3 && <button onClick={addOption} className="btn-secondary text-sm"><FaPlus className="mr-2"/>Aggiungi Opzione</button>}
                            </div>
                        )}
                    </div>

                    {/* Card Ingredienti, Allergeni e Tag */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Dettagli Aggiuntivi</h3>
                        <div className="space-y-4">
                            <AllergenIngredientTagRow color={"orange"} handleAddOrRemove={() => handleAddOrRemove("ingredienti", id)} name="Ingredienti" map={ingredientsMap} elements={ingredients} openModal={() => openModal("ingredienti")} />
                            <AllergenIngredientTagRow color={"orange"} handleAddOrRemove={() => handleAddOrRemove("allergeni", id)} name="Allergeni" map={allergensMap} elements={allergens} openModal={() => openModal("allergeni")} />
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
                                : <div className="text-center text-gray-500"><CameraIcon className="w-12 h-12 mx-auto text-gray-400 group-hover:text-primary"/><p className="mt-2 text-sm font-semibold">Carica Immagine</p></div>}
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Stato</h3>
                        <PillToggle label="Visibilità Prodotto" enabled={available} onChange={setAvailable}/>
                        <p className="text-xs text-gray-500 mt-2">Se disabilitato, il prodotto non sarà visibile ai clienti nel menu.</p>
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