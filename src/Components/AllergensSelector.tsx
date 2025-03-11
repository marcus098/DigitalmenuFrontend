import React, { useState } from 'react';

interface AllergensSelectorProps {
    allergens: { id: number, name: string; icon: string }[];
    onAllergenChange: (selected: number[]) => void;
}

const AllergensSelector: React.FC<AllergensSelectorProps> = ({ allergens, onAllergenChange }) => {
    const [selectedAllergens, setSelectedAllergens] = useState<number[]>([]);

    const toggleAllergen = (allergen: number) => {
        const updatedSelection = selectedAllergens.includes(allergen)
            ? selectedAllergens.filter((a) => a !== allergen)
            : [...selectedAllergens, allergen];

        setSelectedAllergens(updatedSelection);
        onAllergenChange(updatedSelection);
    };

    return (
        <div className="bg-blue-50 py-4 px-6 rounded-lg shadow-md overflow-x-auto">
            <h3 className="text-lg font-semibold text-blue-700 mb-3">Seleziona Allergeni</h3>
            <div className="overflow-x-auto">
                <div className="flex space-x-4 py-4">
                    {allergens.map((allergen) => (
                        <button
                            key={allergen.name}
                            onClick={() => toggleAllergen(allergen.id)}
                            className={`flex flex-col items-center p-3 rounded-lg border ${
                                selectedAllergens.includes(allergen.id)
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-blue-700'
                            } hover:bg-blue-600 hover:text-white transition`}
                        >
                            <img
                                src={allergen.icon}
                                alt={allergen.name}
                                className="w-10 h-10 mb-1 object-contain"
                                style={{maxWidth: "150px"}}
                            />
                            {/*<span className="text-xs">{allergen.name}</span>*/}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AllergensSelector;
