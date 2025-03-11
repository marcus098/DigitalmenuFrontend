import React, {useEffect, useState} from "react";
import { CategoryDto, AddCategory, UpdateCategory, LongInteger } from "../../types";
import { useData } from "../../Context/DataContext";
import CustomLoading from "../../Components/CustomLoading";
import {useNavigate, useParams} from "react-router-dom";
import {FaArrowLeft, FaPlus, FaSave} from "react-icons/fa";
import {useHistory} from "../../Context/HistoryContext";

interface CategoryPageProps {
    isNew: boolean;
    //categoryDto?: CategoryDto;
}

const CategoryPage: React.FC<CategoryPageProps> = ({ isNew/*, categoryDto*/ }) => {
    const [name, setName] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [id, setId] = useState<number>(-1);
    const [products, setProducts] = useState<LongInteger[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [image, setImage] = useState<string>("");
    const [available, setAvailable] = useState<boolean>(true);
    const [myLoading, setMyLoading] = useState<boolean>(true)
    const { loading, addCategory, updateCategory, productsMap, categoriesMap } = useData();
    const [file, setFile] = useState<File | null>(null)
    const { previousPath, navigateWithHistory } = useHistory();

    const {idCategory, localname} = useParams()

    useEffect(() => {
        if(isNew && !loading){
            setMyLoading(false)
        }
        console.log("test")
    }, []);

    useEffect(() => {
        if(!loading){
            if(!isNew && categoriesMap && categoriesMap.has(Number(idCategory))){
                const tmp = categoriesMap.get(Number(idCategory))
                setId(tmp?.id || -1)
                setName(tmp?.name || "")
                setDescription(tmp?.description || "")
                setImage(tmp?.image || "")
                setAvailable(tmp?.available || true)
                setProducts(tmp?.products || [])
            }
            setMyLoading(false)
        }
    }, [loading]);


    const closeModal = () => {
        setIsModalOpen(false);
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const filetmp = event.target.files?.[0];
        if (filetmp) {
            const reader = new FileReader();
            reader.onload = () => {
                setImage(reader.result as string);
                setFile(filetmp)
            };
            reader.readAsDataURL(filetmp);
        }
    };

    const handleBoxClick = () => {
        document.getElementById("imageUploadInput")?.click();
    };

    const handleToggleAvailable = () => {
        setAvailable((prev) => !prev);
    };


    const saveAndClose = async () => {
        setMyLoading(true)
        const addCategoryValue: AddCategory = { name: name, image: image, products: products, available: available, description: description };
        await addCategory(addCategoryValue, file || undefined);
        handleNavigation("/" + localname + "/Dashboard/Categories")
        setMyLoading(false)
    }

    const saveAndContinue = async () => {
        setMyLoading(true)
        const addCategoryValue: AddCategory = { name: name, image: image, products: products, available: available, description: description };
        await addCategory(addCategoryValue, file || undefined);
        resetAll()
        setMyLoading(false)
    }

    const update = async () => {
        setMyLoading(true)
        const updateCategoryValue: UpdateCategory = { id: id, name: name, image: image, products: products, available: available, description: description };
        await updateCategory(updateCategoryValue, file || undefined);
        handleNavigation("/" + localname + "/Dashboard/Categories")
        setMyLoading(false)
    };

    const resetAll = () => {
        setName("")
        setDescription("")
        setId(-1)
        setFile(null)
        setImage("")
        setProducts([])
        setAvailable(true)
    }

    const handleNavigation = (path: string) => {
        if (previousPath && previousPath.includes(window.location.origin + "/" + localname + "/Dashboard")) {
            window.history.back();
        } else {
            navigateWithHistory(path);
        }
    };

    return (
        <div className="p-6">
            {(myLoading || loading) && <CustomLoading isFullPage={true}/>}

            <div className="mb-6" style={{marginLeft: "-1.7rem", marginTop: "-2rem"}}>
                <button
                    className="flex items-center space-x-2 text-orange-500 hover:text-orange-700"
                    onClick={() => handleNavigation("/" + localname + "/Dashboard/Categories")}
                >
                    <FaArrowLeft size={20}/>
                    <span className="font-medium">Torna indietro</span>
                </button>
            </div>

            <h1 className="text-2xl font-bold mb-4">{(isNew ? "Aggiungi " : "Modifica ") + "Categoria"}</h1>

            {/* Immagine */}
            <div className="mb-6">
                <label className="block font-medium mb-2">Immagine</label>
                <div
                    onClick={handleBoxClick}
                    className="relative w-40 h-40 bg-gray-200 rounded-md flex items-center justify-center overflow-hidden cursor-pointer border border-dashed border-orange-400"
                >
                    <img
                        src={image}
                        onError={(e) => (e.currentTarget.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3f/Placeholder_view_vector.svg/1280px-Placeholder_view_vector.svg.png")}
                        className="w-full h-full object-cover"
                    />
                    <div
                        className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity">
                        <span className="text-white text-sm font-medium">Clicca per caricare</span>
                    </div>
                </div>
                <input
                    id="imageUploadInput"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                />
                <button
                    className="mt-4 bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600"
                    onClick={handleBoxClick}
                >
                    Carica immagine
                </button>
            </div>

            {/* Nome */}
            <div className="mb-6">
                <label className="block font-medium mb-2">Nome</label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full p-2 border rounded-md"
                />
            </div>

            {/* Descrizione */}
            <div className="mb-6">
                <label className="block font-medium mb-2">Descrizione</label>
                <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-2 border rounded-md"
                />
            </div>

            {/* Disponibilità */}
            <div className="mb-6">
                <label className="block font-medium mb-2">Disponibile</label>
                <div className="flex items-center">
                    <span
                        className="mr-4">{available ? "La categoria è attualmente disponibile" : "La categoria non è disponibile"}</span>
                    <div
                        className={`relative w-12 h-6 bg-gray-300 rounded-full cursor-pointer transition-all ${available ? "bg-green-500" : "bg-gray-300"}`}
                        onClick={handleToggleAvailable}
                    >
                        <div
                            className={`absolute w-6 h-6 bg-white rounded-full shadow-md transform transition-transform ${available ? "translate-x-6" : "translate-x-0"}`}
                        ></div>
                    </div>
                </div>
            </div>

            {!isNew &&
                <button
                    className="mt-4 bg-red-500 text-white px-4 py-2 rounded-md"
                    onClick={() => update()}
                >
                    Salva Categoria
                </button>
            }

            {/* Pulsanti Finali se nuovo */}
            {isNew &&
                <div className="mt-6 flex justify-end space-x-4">
                    <button
                        className="flex items-center space-x-2 bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600"
                        onClick={() => saveAndClose()}
                    >
                        <FaSave size={16} />
                        <span>Salva e Torna Indietro</span>
                    </button>
                    <button
                        className="flex items-center space-x-2 bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600"
                        onClick={() => saveAndContinue()}
                    >
                        <FaPlus size={16} />
                        <span>Salva e Aggiungi Altra</span>
                    </button>
                </div>
            }

            {/* Modale */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-md p-6 w-96 max-h-96 overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">Gestisci Prodotti</h2>
                        <div className="flex flex-wrap"></div>
                        <button
                            onClick={closeModal}
                            className="mt-4 bg-red-500 text-white px-4 py-2 rounded-md"
                        >
                            Chiudi
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryPage;
