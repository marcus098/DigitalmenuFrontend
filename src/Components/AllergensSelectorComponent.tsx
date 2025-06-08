import React, {useContext, useState} from 'react';
import {ThemeContext} from "../Context/ThemeContext";

interface AllergensSelectorComponentProps {
    allergen: {
        id: number,
        name: string,
        icon: string
    },
    isSelected: boolean,
    toggleAllergen: (id: number) => void
}

const AllergensSelectorComponent: React.FC<AllergensSelectorComponentProps> = ({allergen, toggleAllergen, isSelected}) => {
    const theme = useContext(ThemeContext)

    const [hovered, setHovered] = useState(false);

    return (
        <button
            key={allergen.name}
            onClick={() => toggleAllergen(allergen.id)}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            className={`flex flex-col items-center p-1 rounded-lg border`}
            style={{backgroundColor: isSelected || hovered ? theme?.theme.colors.color1 + "" : theme?.theme.colors.color2, color: isSelected || hovered ? theme?.theme.colors.text1 + "" : theme?.theme.colors.text}}
        >
            <img
                src={allergen.icon}
                alt={allergen.name}
                className="w-16 h-17 mb-1 object-contain"
                style={{maxWidth: "350px"}}
            />
        </button>
    );
};

export default AllergensSelectorComponent;
