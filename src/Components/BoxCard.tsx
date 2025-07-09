// src/Components/BoxCard.tsx
import React from 'react';

interface BoxCardProps {
    title: string;
    value: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: 'primary' | 'default';
}

const BoxCard: React.FC<BoxCardProps> = ({ title, value, icon, onClick, variant = 'default' }) => {
    // Aggiunto 'active:scale-95' per il feedback al tocco
    const baseClasses = "rounded-xl shadow-lg cursor-pointer transition-all duration-200 ease-out flex flex-col";

    // Classi per le varianti. Ora usiamo i colori definiti nel nostro tema!
    const variantClasses = {
        default: 'bg-white text-gray-800 hover:shadow-xl hover:-translate-y-1 active:scale-95',
        primary: 'bg-primary text-white hover:bg-primary-dark active:scale-95', // Usiamo le nuove classi!
    };

    return (
        <div className={`${baseClasses} ${variantClasses[variant]}`} onClick={onClick}>

            {/* Sezione Superiore: Titolo e Icona */}
            <div className="p-4 flex items-start justify-between">
                <h3 className="text-lg font-semibold">{title}</h3>
                {/* Per l'icona sulla card primaria, un bianco con opacità crea un bel contrasto */}
                <div className={`w-7 h-7 ${variant === 'primary' ? 'text-white opacity-80' : 'text-gray-400'}`}>
                    {icon}
                </div>
            </div>

            {/* Questo div si espanderà per spingere il valore in basso, garantendo altezze uniformi */}
            <div className="flex-grow"></div>

            {/* Sezione Inferiore: Valore */}
            <div className="p-4">
                <p className="text-3xl font-bold">
                    {value}
                </p>
            </div>
        </div>
    );
};

export default BoxCard;