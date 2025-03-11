import React from "react";
import {useData} from "../Context/DataContext";
import {IngredientDto, NameType} from "../types";

interface AllergenIngredientTagRowProps {
    openModal: () => void
    name: string
    elements: number[]
    map: Map<number, NameType> | Map<number, IngredientDto>
    handleAddOrRemove: (type: string, id: number) => void
    color: string
}

const AllergenIngredientTagRow: React.FC<AllergenIngredientTagRowProps> = ({openModal, name, color, handleAddOrRemove, elements, map}) => {

    return (
        <div className="mb-6">
            <div className="flex items-center">
                <label className="block font-medium mb-2">{name}</label>
                <button
                    onClick={() => openModal()}
                    className="ml-2 text-blue-500 hover:text-blue-700"
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                    >
                        <path
                            d="M17.414 2.586a2 2 0 00-2.828 0l-10 10a2 2 0 00-.586 1.414V17a1 1 0 001 1h2.586a2 2 0 001.414-.586l10-10a2 2 0 000-2.828l-2.586-2.586zM14 3l3 3-10 10H4v-3L14 3z"/>
                    </svg>
                </button>
            </div>
            {elements.length > 0 ? (
                <div className="flex flex-wrap mt-2">
                    {elements.map((el) => (
                        <div
                            key={el}
                            className={"flex items-center bg-"+color+"-100 text-"+color+"-700 rounded-md p-2 m-1"}
                        >
                            <span>{map.get(el)?.name || ""}</span>
                            <button
                                onClick={() => handleAddOrRemove(name.toLowerCase(), el)}
                                className={"ml-2 text-"+color+"-500 hover:text-"+color+"-700"}
                            >
                                ✖
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="mt-2 p-4 bg-gray-100 rounded-md text-gray-500 text-sm">
                    {name === "Tags" && "Nessun tag selezionato"}
                    {name === "Allergeni" && "Nessun allergene selezionato"}
                    {name === "Ingredienti" && "Nessun ingrediente selezionato"}
                </div>
            )}
        </div>
    )
}

export default AllergenIngredientTagRow

