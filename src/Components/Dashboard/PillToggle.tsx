// src/Components/PillToggle.tsx
import React from 'react';

interface PillToggleProps {
    label: string;
    enabled: boolean;
    onChange: (enabled:boolean) => void;
    trueText?: string;
    falseText?: string;
}

const PillToggle: React.FC<PillToggleProps> = ({
                                                   label,
                                                   enabled,
                                                   onChange,
                                                   trueText = "Sì",
                                                   falseText = "No"
                                               }) => {
    // Stile per il bottone attivo (Sì)
    const activeTrueClasses = enabled ? 'bg-primary text-white shadow-md' : 'text-gray-600';
    // Stile per il bottone attivo (No)
    const activeFalseClasses = !enabled ? 'bg-rose-500 text-white shadow-md' : 'text-gray-600';

    return (
        <div className="flex items-center justify-between w-full">
            <span className="text-sm font-medium text-gray-800">{label}</span>
            <div className="flex items-center p-1 space-x-1 bg-gray-200 rounded-full">
                <button
                    type="button"
                    onClick={() => onChange(true)}
                    className={`px-3 py-1 text-sm font-semibold rounded-full transition-all duration-300 ease-in-out ${activeTrueClasses}`}
                >
                    {trueText}
                </button>
                <button
                    type="button"
                    onClick={() => onChange(false)}
                    className={`px-3 py-1 text-sm font-semibold rounded-full transition-all duration-300 ease-in-out ${activeFalseClasses}`}
                >
                    {falseText}
                </button>
            </div>
        </div>
    );
};

export default PillToggle;