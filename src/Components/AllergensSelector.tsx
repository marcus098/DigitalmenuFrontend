import React, {useContext, useState} from 'react';
import {ThemeContext} from "../Context/ThemeContext";
import AllergensSelectorComponent from "./AllergensSelectorComponent";
import {useData} from "../Context/DataContext";

// Per questo esempio, creiamo un componente fittizio per il singolo allergene
const AllergenChip: React.FC<{ allergen: { id: number, name: string; icon: string }, onToggle: () => void, isSelected: boolean }> = ({ allergen, onToggle, isSelected }) => {
    return (
        <button
            onClick={onToggle}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full transition-all border-2 ${
                isSelected ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
            }`}
        >
            <img src={allergen.icon} alt={allergen.name} className="w-5 h-5"/>
            <span className="font-semibold text-sm">{allergen.name}</span>
        </button>
    )
}

interface AllergensSelectorProps {
    allergens: { id: number, name: string; icon: string }[];
    onAllergenChange: (selected: number[]) => void;
}

const AllergensSelector: React.FC<AllergensSelectorProps> = ({ allergens, onAllergenChange }) => {
    const theme = useContext(ThemeContext);
    const { selectedAllergens, setSelectedAllergens } = useData();

    const toggleAllergen = (allergenId: number) => {
        const updatedSelection = selectedAllergens.includes(allergenId)
            ? selectedAllergens.filter((id) => id !== allergenId)
            : [...selectedAllergens, allergenId];
        setSelectedAllergens(updatedSelection);
        onAllergenChange(updatedSelection);
    };

    return (
        <div className="py-4">
            <h3 className="text-lg font-semibold mb-3 px-4 text-gray-800">Filtra per allergeni</h3>
            {/* Aggiungiamo padding laterale per un effetto migliore su mobile */}
            <div className="overflow-x-auto pb-2 pl-4 pr-4">
                <div className="flex space-x-3">
                    {allergens.map((allergen) => (
                        <AllergenChip
                            key={allergen.id}
                            allergen={allergen}
                            onToggle={() => toggleAllergen(allergen.id)}
                            isSelected={selectedAllergens.includes(allergen.id)}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AllergensSelector;