import React from "react";
import {useData} from "../Context/DataContext";
import {IngredientDto, NameType} from "../types";
import { Pencil } from "lucide-react";

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
                    <Pencil className={"mb-2 text-orange-500"}/>
                </button>
            </div>
            {elements.length > 0 ? (
                <div className="flex flex-wrap mt-2">
                    {elements
                        .filter((num, index, self) => {
                            const absVal = Math.abs(num);
                            const hasNegative = self.includes(-absVal);
                            if (num < 0) return self.indexOf(num) === index;
                            return !hasNegative
                        })
                        .map((el) => (
                        <div
                            key={el}
                            className={"flex items-center bg-"+color+"-100 text-black-700 rounded-md p-2 m-1"}
                        >
                            <span>{map.get(Math.abs(el))?.name || ""}</span>
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

