import React, {useEffect, useState} from "react";
import {OptionInProduct, ProductDto} from "../../types";
import {useData} from "../../Context/DataContext";
import {useNavigate, useParams} from "react-router-dom";
import AllergenIngredientTagRow from "../../Components/AllergenIngredientTagRow";
import { FaArrowLeft, FaSave, FaPlus } from "react-icons/fa";
import CustomLoading from "../../Components/CustomLoading";
import {useHistory} from "../../Context/HistoryContext";
import ManageItemsModal from "../../Components/Dashboard/ManageItemsModal";
import {useNotification} from "../../Context/NotificationContext";

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
    const [positionProgressive, setPositionProgressive] = useState<number>(1)
    const [filter, setFilter] = useState<string>("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<"allergeni" | "ingredienti" | "tags" | null>(null);

    const {loading, allergensMap, tagsMap, productsMap, ingredientsMap, categoriesMap, addProduct, updateProduct} = useData()
    const {idProduct, localname} = useParams()
    const { navigateWithHistory } = useHistory()
    const { addNotification } = useNotification()

    const [priceMode, setPriceMode] = useState<"single" | "options">("single");
    const [singlePrice, setSinglePrice] = useState<number>(0);

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
                        setPriceMode("single")
                        setSinglePrice(product.options[0].price)
                    }else {
                        setPriceMode("options")
                        setOptions(product?.options || [])
                    }
                }else{
                    setPriceMode("single")
                    setOptions([])
                }
                const img = product?.image || ""
                setImage(img)
                setPositionProgressive(product?.positionProgressive || 1)
            }
            setMyLoading(false)
        }
    }, [loading]);

    const resetField = () => {
        setName("")
        setDescription("")
        setIdCategory(-1)
        setOptions([])
        setAllergens([])
        setIngredients([])
        setTags([])
        setAvailable(true)
        setImage("")
        setFile(null)
        setPositionProgressive(1)
        setId(-1)
        setFilter("")
        setPriceMode("single")
        setSinglePrice(0)
    }

    const openModal = (type: "allergeni" | "ingredienti" | "tags") => {
        setModalType(type);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setModalType(null);
    };

    const saveAndContinue = async () => {
        const status = isNew ? await add() : await update()
        if (status){
            addNotification({message: "Prodotto modificato", type: "success"})
            resetField()
        }else{
            addNotification({message: "Errore", type: "error"})
        }
    }

    const saveAndClose = async () => {
        const status = isNew ? await add() : await update()
        if (status) {
            addNotification({message: "Prodotto modificato", type: "success"})
            resetField()
            navigateWithHistory("/" + localname + "/Dashboard/Menu")
        }else{
            addNotification({message: "Errore", type: "error"})
        }
    }


    const add = async () => {
        setMyLoading(true)
        let tmp: OptionInProduct[] = [];
        if(priceMode === "single")
            tmp.push({name: "default", isDefault: true, price: singlePrice})
        else
            tmp = [...options]

        const status = await addProduct({name: name, options: tmp, image: image.startsWith("data") ? "" : image, tags: tags, available: available, allergens: allergens, idCategory: idCategory, description: description, ingredients: ingredients}, file)
        setMyLoading(false)
        return status
    }

    const update = async () => {
        setMyLoading(true) //todo non mandare indietro in caso di errori
        const tmp: OptionInProduct[] = (priceMode === "single") ? [{name: "default", isDefault: true, price: singlePrice}] : [...options]
        const status = await updateProduct({id: id, positionProgressive: positionProgressive, name: name, options: tmp, image: image.startsWith("data") ? "" : image, tags: tags, available: available, allergens: allergens, idCategory: idCategory, description: description, ingredients: ingredients}, file || undefined)

        setMyLoading(false)
        return status
    }

    const changeDefaultOption = (index: number) => {
        if(index > options.length){
            return
        }
        const tmp = [...options]
        for(let i = 0; i < tmp.length; i++){
            tmp[i].isDefault = i === index
        }
        setOptions([...tmp])
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
        setAvailable(!available)
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

        if(removed.length > 0) {
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

        if(removed.length > 0 || added.length > 0)
            setAllergens([...currentAllergens])

        console.log(currentAllergens)
        setIngredients([...value])
    }

    let itemsMap: Map<number, { name: string }> | undefined;
    let selectedItems: number[] = [];
    let onChange: (newSelected: number[]) => void = () => {};

    switch (modalType) {
        case "allergeni":
            itemsMap = allergensMap;
            const result = allergens.filter((num, index, self) => {
                const absVal = Math.abs(num);
                const hasNegative = self.includes(-absVal);
                if (num < 0) return self.indexOf(num) === index;
                return !hasNegative
            })
            selectedItems = result;
            onChange = setAllergens;
            break;
        case "ingredienti":
            itemsMap = ingredientsMap;
            selectedItems = ingredients;
            onChange = addRemoveIngredient;
            break;
        case "tags":
            itemsMap = tagsMap;
            selectedItems = tags;
            onChange = setTags;
            break;
    }


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
            {isModalOpen && <ManageItemsModal
                //filter={filter}
                //setFilter={setFilter}
                //isOpen={isModalOpen}
                onClose={closeModal}
                selectedItems={modalType === "allergeni" ? allergens : modalType === "ingredienti" ? ingredients : tags}
                onChange={
                    modalType === "allergeni"
                        ? setAllergens
                        : modalType === "ingredienti"
                            ? setIngredients
                            : setTags
                }
                itemsMap={modalType === "allergeni" ? allergensMap : modalType === "ingredienti" ? ingredientsMap : tagsMap}
                title={modalType || "allergeni"}
            />
            }
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
                        src={image.startsWith("data") ? image || "" : process.env.REACT_APP_BUCKET_URL + image}
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
                {isNew &&
                    <button
                        className="flex items-center space-x-2 bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-600"
                        onClick={() => saveAndContinue()}
                    >
                        <FaPlus size={16} />
                        <span>Salva e Aggiungi Altro</span>
                    </button>
                }
            </div>

            {/* Modale */}
            {isModalOpen && modalType && itemsMap && (
                <ManageItemsModal
                    title={
                        modalType === "allergeni"
                            ? "Gestisci Allergeni"
                            : modalType === "ingredienti"
                                ? "Gestisci Ingredienti"
                                : "Gestisci Tag"
                    }
                    itemsMap={itemsMap}
                    selectedItems={selectedItems}
                    onChange={onChange}
                    onClose={closeModal}
                />
            )}

        </div>}
            </>
    );

};

export default ProductPage;
