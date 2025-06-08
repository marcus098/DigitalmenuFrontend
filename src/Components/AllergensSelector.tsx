import React, {useContext, useState} from 'react';
import {ThemeContext} from "../Context/ThemeContext";
import AllergensSelectorComponent from "./AllergensSelectorComponent";
import {useData} from "../Context/DataContext";

interface AllergensSelectorProps {
    allergens: { id: number, name: string; icon: string }[];
    onAllergenChange: (selected: number[]) => void;
}

const AllergensSelector: React.FC<AllergensSelectorProps> = ({ allergens, onAllergenChange }) => {
    const theme = useContext(ThemeContext)
    const {selectedAllergens, setSelectedAllergens} = useData()

    const toggleAllergen = (allergen: number) => {
        const updatedSelection = selectedAllergens.includes(allergen)
            ? selectedAllergens.filter((a) => a !== allergen)
            : [...selectedAllergens, allergen];

        setSelectedAllergens(updatedSelection);
        onAllergenChange(updatedSelection);
    };

    return (
        <div className="py-4 px-6 rounded-lg shadow-md overflow-x-auto"  style={{backgroundColor: theme?.theme.colors.color1 + ""}}>
            <h3 className="text-lg font-semibold mb-3" style={{color: theme?.theme.colors.text1 + ""}}>Seleziona Allergeni</h3>
            <div className="overflow-x-auto">
                <div className="flex space-x-4 py-4">
                    {allergens.map((allergen) => (
                        <AllergensSelectorComponent allergen={allergen} toggleAllergen={toggleAllergen} isSelected={selectedAllergens.includes(allergen.id)} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AllergensSelector;
