import React, { useState } from 'react';

interface AllergensSelectorComponentProps {
    allergen: {
        id: number,
        name: string,
        icon: string
    },
    isSelected: boolean,
    toggleAllergen: (id: number) => void
}

const AllergensSelectorComponent: React.FC<AllergensSelectorComponentProps> = ({ allergen, toggleAllergen, isSelected }) => {
    const [hovered, setHovered] = useState(false);

    return (
        <button
            key={allergen.name}
            onClick={() => toggleAllergen(allergen.id)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={`flex flex-col items-center p-1 rounded-lg border transition-colors duration-150 ${
                isSelected || hovered
                    ? 'bg-primary-400 border-primary-500 text-white'
                    : 'bg-white border-neutral-200 text-neutral-700'
            }`}
        >
            <img
                src={allergen.icon}
                alt={allergen.name}
                className="w-16 h-17 mb-1 object-contain"
                style={{ maxWidth: "350px" }}
            />
        </button>
    );
};

export default AllergensSelectorComponent;
