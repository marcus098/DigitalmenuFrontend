// src/Components/AllergensSelector.tsx

import React, { useContext } from 'react';
import { useData } from "../Context/DataContext";

// NUOVO ITEM PER LA GRIGLIA: più grande, più chiaro e con un checkbox visibile.
const AllergenGridItem: React.FC<{ allergen: { id: number, name: string; icon: string }, onToggle: () => void, isSelected: boolean }> = ({ allergen, onToggle, isSelected }) => {
    return (
        // Usiamo un <label> per una migliore accessibilità. Cliccando ovunque si attiverà il checkbox.
        <label className={`flex items-center justify-between w-full p-3 rounded-xl transition-all border-2 cursor-pointer ${
            isSelected
                ? 'bg-amber-50 border-amber-500 shadow-sm'
                : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
        }`}>
            <div className="flex items-center gap-2">
                <img src={allergen.icon} alt={allergen.name} className="w-6 h-6"/>
                <span className="font-bold text-zinc-800">{allergen.name}</span>
            </div>
            {/* Checkbox nascosto che gestisce lo stato, ma visivamente usiamo un div stilizzato */}
            <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggle}
                className="sr-only"
            />
            <div className={`w-5 h-5 flex-shrink-0 rounded-md border-2 flex items-center justify-center ${isSelected ? 'bg-amber-500 border-amber-500' : 'border-zinc-300 bg-white'}`}>
                {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={4}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
            </div>
        </label>
    );
};


interface AllergensSelectorProps {
    allergens: { id: number, name: string; icon: string }[];
    onAllergenChange: (selected: number[]) => void;
    isModalVersion?: boolean;
}

const AllergensSelector: React.FC<AllergensSelectorProps> = ({ allergens, onAllergenChange, isModalVersion = false }) => {
    const { selectedAllergens, setSelectedAllergens } = useData();

    const toggleAllergen = (allergenId: number) => {
        const updatedSelection = selectedAllergens.includes(allergenId)
            ? selectedAllergens.filter((id) => id !== allergenId)
            : [...selectedAllergens, allergenId];
        // Aggiorniamo sia lo stato globale che quello locale della modale
        setSelectedAllergens(updatedSelection);
        onAllergenChange(updatedSelection);
    };

    // LAYOUT A GRIGLIA: al posto della riga singola, usiamo una griglia a 2 colonne con spaziatura.
    const gridContent = (
        <div className="grid grid-cols-2 gap-3">
            {allergens.map((allergen) => (
                <AllergenGridItem
                    key={allergen.id}
                    allergen={allergen}
                    onToggle={() => toggleAllergen(allergen.id)}
                    isSelected={selectedAllergens.includes(allergen.id)}
                />
            ))}
        </div>
    );

    if (isModalVersion) {
        // La versione per la modale non ha bisogno di padding o titoli extra.
        return gridContent;
    }

    // La versione standard mantiene il suo titolo e la sua spaziatura.
    return (
        <div className="py-4">
            <h3 className="text-lg font-semibold mb-3 px-4 text-gray-800">Filtra per allergeni</h3>
            <div className="px-4">
                {gridContent}
            </div>
        </div>
    );
};

export default AllergensSelector;