import React, {useEffect, useState} from "react";
import {OptionInProduct, ProductDto} from "../../types";
import {useData} from "../../Context/DataContext";
import {useNavigate, useParams} from "react-router-dom";
import AllergenIngredientTagRow from "../../Components/AllergenIngredientTagRow";
import { FaArrowLeft, FaSave, FaPlus } from "react-icons/fa";
import CustomLoading from "../../Components/CustomLoading";
import {useHistory} from "../../Context/HistoryContext";

//const availableAllergensId = [1,2,3,4,5,6,7,8,9,10,11,12,13,14]
//const availableTagsId = [1,2,3]
//const availableIngredientsId = [1,2,3]

interface ProductPageProps {
    isNew: boolean
    productDto?: ProductDto
}

const ProductPage: React.FC<ProductPageProps> = ({isNew, productDto}) => {
    const [name, setName] = useState<string>(!isNew && productDto ? productDto.name : "")
    const [description, setDescription] = useState<string>(!isNew && productDto ? productDto.description || "" : "")
    const [id, setId] = useState<number>(!isNew && productDto ? productDto?.id : -1)
    const [idCategory, setIdCategory] = useState<number>(!isNew && productDto ? productDto?.idCategory : -1)
    const [options, setOptions] = useState<OptionInProduct[]>(!isNew && productDto ? productDto?.options : [])
    const [allergens, setAllergens] = useState<number[]>([])
    const [ingredients, setIngredients] = useState<number[]>(!isNew && productDto ? productDto?.ingredients : [])
    const [tags, setTags] = useState<number[]>(!isNew && productDto ? productDto?.tags : [])
    const [available, setAvailable] = useState<boolean>(true)
    const [myLoading, setMyLoading] = useState<boolean>(true)
    const [image, setImage] = useState<string>("")
    const [file, setFile] = useState<File | null>(null)
    const [positionProgressive, setPositionProgressive] = useState<number>(0)
    const [filter, setFilter] = useState<string>("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<"allergeni" | "ingredienti" | "tags" | null>(null);

    const {loading, allergensMap, tagsMap, productsMap, ingredientsMap, categoriesMap, addProduct, updateProduct} = useData()
    const {idProduct, localname} = useParams()
    const {navigateWithHistory} = useHistory()

    useEffect(() => {
        if(!loading){
            if(!isNew){
                const product = productsMap.get(Number(idProduct))
                setId(product?.id || 0)
                setName(product?.name || "")
                setAllergens(product?.allergens || [])
                setTags(product?.tags || [])
                setIngredients(product?.ingredients || [])
                setAvailable(product?.available || true)
                setIdCategory(product?.idCategory || 0)
                if(product?.options && product.options.length > 0) {
                    if(product.options.length === 1 && product.options[0].name === "default"){
                        setOptions([])
                        setSinglePrice(product.options[0].price)
                    }else {
                        setOptions(product?.options || [])
                    }
                }else{
                    setOptions([])
                }
                setImage(product?.image || "")
                setPositionProgressive(product?.positionProgressive || 0)
            }
            setMyLoading(false)
        }
    }, [loading]);

    const openModal = (type: "allergeni" | "ingredienti" | "tags") => {
        setModalType(type);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalType(null);
    };

    const saveAndContinue = async () => {
        await isNew ? add() : update()
        resetField()
    }

    const saveAndClose = async () => {
        await isNew ? add() : update()
        resetField()
        navigateWithHistory("/" + localname + "/Dashboard/Menu")
    }

    const resetField = () => {
        setImage("")
        setName("")
        setAllergens([])
        setIngredients([])
        setTags([])
        setPositionProgressive(0)
        setFile(null)
        setAvailable(true)
        setIdCategory(0)
        setOptions([])
        setDescription("")
        setId(-1)
    }

    const handleSelectionChange = (type: "allergeni" | "ingredienti" | "tags", item: string) => {
        console.log(type, item)
        /*setProduct((prev) => {
            if(prev) {
                const currentList = prev[type];
                const isAlreadySelected = currentList.includes(item);

                const updatedList = isAlreadySelected
                    ? currentList.filter((i) => i !== item) // Rimuovi
                    : [...currentList, item]; // Aggiungi

                return {...prev, [type]: updatedList};
            }
        });*/
    };

    const getAvailableOptions = (type: "allergeni" | "ingredienti" | "tags") => {
        if (type === "allergeni") return Array.from(allergensMap.values()).sort((a,b) => a.name > b.name ? 1 : -1).map(e => e.id);
        if (type === "ingredienti") return Array.from(ingredientsMap.values()).sort((a,b) => a.name > b.name ? 1 : -1).map(e => e.id);
        if (type === "tags") return Array.from(tagsMap.values()).sort((a,b) => a.name > b.name ? 1 : -1).map(e => e.id);
        return [];
    };

    const filteredOptions = (type: "allergeni" | "ingredienti" | "tags") =>
        getAvailableOptions(type).filter(
            (id) =>
                !filter ||
                (type === "allergeni" && allergensMap.get(id)?.name?.toLowerCase().includes(filter.toLowerCase())) ||
                (type === "ingredienti" && ingredientsMap.get(id)?.name?.toLowerCase().includes(filter.toLowerCase())) ||
                (type === "tags" && tagsMap.get(id)?.name?.toLowerCase().includes(filter.toLowerCase()))
        );

    const add = async () => {
        setMyLoading(true)
        const tmp: OptionInProduct[] = (priceMode === "single") ? [{name: "default", isDefault: true, price: singlePrice}] : [...options]
        await addProduct({name: name, options: tmp, image: image, tags: tags, available: available, allergens: allergens, idCategory: idCategory, description: description, ingredients: ingredients}, file)
        setMyLoading(false)
    }

    const update = async () => {
        setMyLoading(true) //todo non mandare indietro in caso di errori
        const tmp: OptionInProduct[] = (priceMode === "single") ? [{name: "default", isDefault: true, price: singlePrice}] : [...options]
        await updateProduct({id: id, positionProgressive: positionProgressive, name: name, options: tmp, image: image, tags: tags, available: available, allergens: allergens, idCategory: idCategory, description: description, ingredients: ingredients}, file || undefined)
        setMyLoading(false)
    }

    const handleChange = (item: number) => {
        console.log(item)
    }

    const changeDefaultOption = (index: number) => {
        console.log(index)
        for(const option of options){

        }
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

    const changePriceOption = (index: number, price: string) => {
        if(index <= options.length - 1){
            if(index <= options.length - 1){
                const tmp = [...options]
                tmp[index].price = Number(Number(price).toFixed(2));
                setOptions(tmp)
            }
        }
    }

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


    const changeNameOption = (index: number, name: string) => {
        if(index <= options.length - 1){
            const tmp = [...options]
            tmp[index].name = name;
            setOptions(tmp)
        }
    }

    const handleToggleAvailable = () => {

    }

    const deleteOption = (index: number) => {
        if(index <= options.length - 1){
            const tmp = []
            const wasDefault = options[index].isDefault
            let changed = false
            for (let i = 0; i < options.length; i++){
                if(i !== index){
                    const o = options[i]
                    if(wasDefault && !changed && !o.isDefault){
                        o.isDefault = true
                        changed = true
                    }
                    tmp.push(o)
                }
            }
            setOptions([...tmp])
        }
    }

    const [priceMode, setPriceMode] = useState<"single" | "options">("single");
    const [singlePrice, setSinglePrice] = useState<number>(0);

// Componente Toggle
    const PriceModeToggle = () => (
        <div className="flex items-center space-x-4 mb-6">
            <button
                className={`px-4 py-2 rounded-md ${
                    priceMode === "single" ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-gray-200 hover:bg-gray-300"
                }`}
                onClick={() => setPriceMode("single")}
            >
                Prezzo Unico
            </button>
            <button
                className={`px-4 py-2 rounded-md ${
                    priceMode === "options" ? "bg-orange-500 text-white hover:bg-orange-600" : "bg-gray-200 hover:bg-gray-300"
                }`}
                onClick={() => setPriceMode("options")}
            >
                Opzioni
            </button>
        </div>
    );

    // Importazione React e altri moduli rimangono invariate.

    return (
        <>
        {loading ? <CustomLoading isFullPage={true}/> :
        <div className="p-6">
            {myLoading && <CustomLoading isTransparent={true}/>}

            <div className="mb-6" style={{ marginLeft: "-1.7rem", marginTop: "-2rem" }}>
                <button
                    className="flex items-center space-x-2 text-orange-500 hover:text-orange-700"
                    onClick={() => navigateWithHistory("/" + localname + "/Dashboard/Menu")}
                >
                    <FaArrowLeft size={20} />
                    <span className="font-medium">Torna indietro</span>
                </button>
            </div>

            <h1 className="text-2xl font-bold mb-4">{(isNew ? "Aggiungi " : "Modifica ") + "Prodotto"}</h1>

            {/* Immagine */}
            <div className="mb-6">
                <label className="block font-medium mb-2">Immagine</label>
                <div
                    onClick={handleBoxClick}
                    className="relative w-40 h-40 bg-orange-200 rounded-md flex items-center justify-center overflow-hidden cursor-pointer border border-dashed border-orange-400"
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
                    onChange={(e) =>
                        setName(e.target.value)
                    }
                    className="w-full p-2 border rounded-md"
                />
            </div>

            {/* Descrizione */}
            <div className="mb-6">
                <label className="block font-medium mb-2">Descrizione</label>
                <textarea
                    value={description}
                    onChange={(e) =>
                        setDescription(e.target.value)
                    }
                    className="w-full p-2 border rounded-md"
                />
            </div>

            {/* Categoria */}
            <div className="mb-6">
                <label className="block font-medium mb-2">Categoria</label>
                <select
                    value={idCategory}
                    onChange={(e) => setIdCategory(Number(e.target.value))}
                    className="w-full p-2 border rounded-md"
                >
                    <option value={-1} disabled>
                        Seleziona una categoria
                    </option>
                    {Array.from(categoriesMap.values())
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                </select>
            </div>

            {/* Modalità Prezzo */}
            <PriceModeToggle />

            {priceMode === "single" ? (
                <div className="mb-6">
                    <label className="block font-medium mb-2">Prezzo Unico</label>
                    <input
                        type="number"
                        value={singlePrice}
                        onChange={(e) => setSinglePrice(Number(e.target.value))}
                        className="w-full p-2 border rounded-md"
                    />
                </div>
            ) : (
                <div className="mb-6">
                    <label className="block font-medium mb-2">Opzioni</label>
                    {options.map((option, index) => (
                        <div
                            key={index}
                            className="flex items-center space-x-4 mb-2"
                        >
                            <input
                                type="text"
                                value={option.name}
                                onChange={(e) =>
                                    changeNameOption(index, e.target.value)
                                }
                                className="w-1/3 p-2 border rounded-md"
                            />
                            <input
                                type="number"
                                value={option.price}
                                onChange={(e) =>
                                    changePriceOption(index, e.target.value)
                                }
                                className="w-1/3 p-2 border rounded-md"
                            />
                            <input
                                type="radio"
                                checked={option.isDefault}
                                onChange={() =>
                                    changeDefaultOption(index)
                                }
                            />
                            <button
                                onClick={() => deleteOption(index)}
                                className="text-red-500"
                            >
                                ✖
                            </button>
                        </div>
                    ))}
                    {options.length < 3 && (
                        <button
                            className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600"
                            onClick={() => {
                                const tmp: OptionInProduct[] = [...options];
                                let def = true;
                                for (const opt of options) {
                                    if (opt.isDefault) def = false;
                                }
                                tmp.push({ name: "", price: 0, isDefault: def });
                                setOptions(tmp);
                            }}
                        >
                            Aggiungi Opzione
                        </button>
                    )}
                </div>
            )}

            {/* Allergeni, Ingredienti */}
            <AllergenIngredientTagRow
                color={"orange"}
                openModal={() => openModal("ingredienti")}
                name={"Ingredienti"}
                elements={ingredients}
                map={ingredientsMap}
                handleAddOrRemove={() => handleAddOrRemove("ingredienti", id)} />

            <AllergenIngredientTagRow
                color={"orange"}
                openModal={() => openModal("allergeni")}
                name={"Allergeni"}
                elements={allergens}
                map={allergensMap}
                handleAddOrRemove={() => handleAddOrRemove("allergeni", id)} />

            {/* Disponibilità */}
            <div className="mb-6">
                <label className="block font-medium mb-2">Disponibile</label>
                <div className="flex items-center">
                    <span
                        className="mr-4">{available ? "Il piatto è attualmente disponibile" : "Il piatto non è disponibile"}</span>
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


            {/* Pulsanti Finali */}
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
                    <span>Salva e Aggiungi Altro</span>
                </button>
            </div>

            {/* Modale */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-md p-6 max-h-96 overflow-y-auto"
                         style={{width: "80vw", maxWidth: "600px"}}>
                        <h2 className="text-xl font-bold mb-4">
                            Gestisci {modalType === "allergeni" ? "Allergeni" : modalType === "ingredienti" ? "Ingredienti" : "Tag"}
                        </h2>
                        <input
                            type="text"
                            placeholder="Filtra..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="w-full mb-4 p-2 border rounded-md"
                        />
                        <div className="flex flex-wrap">
                            {modalType &&
                                filteredOptions(modalType).map((id: number) => (
                                    <button
                                        key={id}
                                        onClick={() => handleAddOrRemove(modalType, id)}
                                        className={"m-1 px-3 py-1 rounded-md border ".concat(
                                            (modalType === "allergeni" && allergens.includes(id)) ||
                                            (modalType === "ingredienti" && ingredients.includes(id)) ||
                                            (modalType === "tags" && tags.includes(id))
                                                ? "bg-blue-500 text-white"
                                                : "bg-gray-200")
                                        }
                                    >
                                        {modalType === "allergeni"
                                            ? allergensMap.get(id)?.name
                                            : modalType === "ingredienti"
                                                ? ingredientsMap.get(id)?.name
                                                : tagsMap.get(id)?.name}
                                    </button>
                                ))}
                        </div>
                        <button
                            onClick={closeModal}
                            className="mt-4 bg-red-500 text-white px-4 py-2 rounded-md"
                        >
                            Chiudi
                        </button>
                    </div>
                </div>
            )}

        </div>}
            </>
    );

};

export default ProductPage;
