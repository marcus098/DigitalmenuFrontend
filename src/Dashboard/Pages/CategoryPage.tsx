import React, { useEffect, useState } from "react";
import { useData } from "../../Context/DataContext";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Save, Plus, Camera } from "lucide-react";

import { useHistory } from "../../Context/HistoryContext";
import { AddCategory, UpdateCategory, LongInteger } from "../../types";

import CustomLoading from "../../Components/CustomLoading";
import PillToggle from "../../Components/Dashboard/PillToggle";
import {useNotification} from "../../Context/NotificationContext"; // Riutilizziamo il nostro PillToggle!

interface CategoryPageProps {
    isNew: boolean;
}

const CategoryPage: React.FC<CategoryPageProps> = ({ isNew }) => {
    // La logica di stato rimane la stessa
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [id, setId] = useState<number>(-1);
    const [products, setProducts] = useState<LongInteger[]>([]);
    const [image, setImage] = useState<string>("");
    const [available, setAvailable] = useState<boolean>(true);
    const [myLoading, setMyLoading] = useState<boolean>(true);
    const [file, setFile] = useState<File | null>(null);

    const { loading, addCategory, updateCategory, productsMap, categoriesMap } = useData();
    const { previousPath, navigateWithHistory } = useHistory();
    const { idCategory, localname } = useParams();
    const {addNotification} = useNotification()
    const navigate = useNavigate()

    // La logica degli useEffect rimane la stessa
    useEffect(() => {
        if (!loading) {
            if (!isNew && idCategory && categoriesMap.has(Number(idCategory))) {
                const tmp = categoriesMap.get(Number(idCategory))!;
                setId(tmp.id);
                setName(tmp.name);
                setDescription(tmp.description || "");
                setImage(tmp.image || "");
                setAvailable(tmp.available);
                setProducts(tmp.products || []);
            }
            setMyLoading(false);
        }
    }, [loading, isNew, idCategory, categoriesMap]);

    // Funzioni di supporto (invariate)
    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const fileTmp = event.target.files?.[0];
        if (fileTmp) {
            const reader = new FileReader();
            reader.onload = () => { setImage(reader.result as string); setFile(fileTmp); };
            reader.readAsDataURL(fileTmp);
        }
    };
    const resetAll = () => { setName(""); setDescription(""); setId(-1); setFile(null); setImage(""); setProducts([]); setAvailable(true); };

    const handleSubmit = async (andContinue: boolean = false) => {
        setMyLoading(true);
        console.log("test")
        let success = false;
        let result;

        if (isNew) {
            const addCategoryValue: AddCategory = { name, description, image, products, available };
            result = await addCategory(addCategoryValue, file || undefined);
            console.log(result)

        } else {
            const updateCategoryValue: UpdateCategory = { id, name, description, image, products, available };
            result = await updateCategory(updateCategoryValue, file || undefined);
            console.log(result)
        }
        if (result) success = true;

        setMyLoading(false);
        if (success) {
            addNotification({ message: `Categoria ${isNew ? 'creata' : 'aggiornata'}!`, type: "success" });
            if (andContinue) {
                resetAll();
            } else {
                handleNavigation(`/${localname}/Dashboard/Categories`);
            }
        } else {
            addNotification({ message: "Errore durante il salvataggio.", type: "error" });
        }
    };

    const handleNavigation = (path: string) => {
        //try {
        //    const hash = window.location.hash.replace('#', '');
//
        //    if (hash){
        //        navigate(path + "/" + hash)
        //    }
        //} catch (e){
        //    navigate(path)
        //}
        navigate(path)
    };

    return (
        <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
            {(myLoading || loading) && <CustomLoading isFullPage={true} isTransparent={true} message={"Salvataggio..."} />}

            {/* --- Action Bar Superiore --- */}
            <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                <div>
                    <button onClick={() => handleNavigation(`/${localname}/Dashboard/Categories`)}
                            className="flex items-center gap-2 text-gray-500 hover:text-primary font-semibold transition-colors">
                        <ArrowLeft/>
                        <span>Torna a Categorie</span>
                    </button>
                    <h1 className="text-3xl font-bold text-gray-800 mt-1">
                        {isNew ? "Nuova Categoria" : `Modifica: ${name}`}
                    </h1>
                </div>
                {/* Pulsanti di salvataggio */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                    {isNew ? (
                        <>
                            {/* Aggiunto 'flex items-center' e 'md:w-auto' */}
                            <button onClick={() => handleSubmit(false)}
                                    className="btn-primary w-full md:w-auto flex items-center justify-center">
                                <Save className="mr-2"/>
                                <span>Salva e Chiudi</span>
                            </button>
                            {/* Aggiunto 'flex items-center' e 'md:w-auto' */}
                            <button onClick={() => handleSubmit(true)}
                                    className="btn-secondary w-full md:w-auto flex items-center justify-center">
                                <Plus className="mr-2"/>
                                <span>Salva e Continua</span>
                            </button>
                        </>
                    ) : (
                        // Aggiunto 'flex items-center' e 'md:w-auto'
                        <button onClick={() => handleSubmit(false)}
                                className="btn-primary w-full md:w-auto flex items-center justify-center">
                            <Save className="mr-2"/>
                            <span>Salva Modifiche</span>
                        </button>
                    )}
                </div>
            </div>

            {/* --- Layout a Griglia --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Colonna Sinistra: Dati Principali */}
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="category-name" className="block text-sm font-medium text-gray-700 mb-1">Nome
                                Categoria</label>
                            <input type="text" id="category-name" value={name} onChange={(e) => setName(e.target.value)}
                                   className="input-style" placeholder="Es. Pizze Rosse, Birre Artigianali..."/>
                        </div>
                        <div>
                            <label htmlFor="category-description"
                                   className="block text-sm font-medium text-gray-700 mb-1">Descrizione
                                (opzionale)</label>
                            <textarea id="category-description" value={description}
                                      onChange={(e) => setDescription(e.target.value)}
                                      rows={4} className="input-style" placeholder="Una breve descrizione della categoria..."/>
                        </div>
                    </div>
                </div>

                {/* Colonna Destra: Metadati e Impostazioni */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Immagine</h3>
                        <input id="imageUploadInput" type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                        <div onClick={() => document.getElementById("imageUploadInput")?.click()}
                             className="w-full aspect-video bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer border-2 border-dashed border-gray-300 hover:border-primary transition-colors group">
                            {image ? (
                                <img src={file ? image : process.env.REACT_APP_BUCKET_URL + image} alt="Anteprima categoria" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center text-gray-500">
                                    <Camera className="w-12 h-12 mx-auto text-gray-400 group-hover:text-primary transition-colors" />
                                    <p className="mt-2 text-sm font-semibold">Carica Immagine</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Stato</h3>
                        <PillToggle
                            label="Visibilità Categoria"
                            enabled={available}
                            onChange={setAvailable}
                        />
                        <p className="text-xs text-gray-500 mt-2">Se disabilitata, la categoria e i suoi prodotti non saranno visibili ai clienti.</p>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default CategoryPage;
