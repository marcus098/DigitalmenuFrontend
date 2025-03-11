import React from 'react';

interface CustomButtonProps {
    onClick: () => void;
    label: string;
    type?: 'button' | 'submit' | 'reset'; // Aggiungi il tipo di bottone
    extraClassName?: string; // Permetti l'estensione di classi personalizzate
}

const CustomButton: React.FC<CustomButtonProps> = ({ onClick, label, type = 'button', extraClassName = '' }) => {
    return (
        <button
            type={type}
            onClick={onClick}
            className={`px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 ${extraClassName}`}
        >
            {label}
        </button>
    );
};

export default CustomButton;
