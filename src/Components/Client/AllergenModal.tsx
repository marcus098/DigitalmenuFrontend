// src/Components/Client/AllergenModal.tsx

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import AllergensSelector from '../AllergensSelector'; // Il tuo componente esistente
import { allergens as mockAllergens } from '../../Utilities/Utilities'; // Dati mock

interface AllergenModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApplyFilters: (selectedAllergens: number[]) => void;
}

const AllergenModal: React.FC<AllergenModalProps> = ({ isOpen, onClose, onApplyFilters }) => {
    const [selected, setSelected] = useState<number[]>([]);

    useEffect(() => {
        if (!isOpen) return;
        // Qui potresti voler caricare i filtri salvati
        setSelected([]);
    }, [isOpen]);

    if (!isOpen) return null;

    const handleApply = () => {
        onApplyFilters(selected);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-fadeIn">
                <div className="p-6 border-b border-zinc-200 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-zinc-800">Opzioni Allergeni</h3>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600"><X className="w-6 h-6" /></button>
                </div>
                <div className="p-6">
                    <p className="text-zinc-600 text-sm mb-4">Seleziona gli allergeni da escludere. I piatti che li contengono verranno nascosti dal menù.</p>
                    {/* Usiamo il tuo selettore esistente, ma senza il suo stile di card esterna */}
                    <AllergensSelector allergens={mockAllergens} onAllergenChange={setSelected} isModalVersion={true} />
                </div>
                <div className="p-6 bg-zinc-50 rounded-b-xl flex justify-between items-center">
                    <button onClick={() => setSelected([])} className="px-4 py-2 rounded-lg text-zinc-600 hover:text-zinc-700 font-semibold active:scale-95">Resetta</button>
                    <button onClick={handleApply} className="px-6 py-2 rounded-lg bg-amber-500 text-white font-bold hover:bg-amber-600 active:scale-95">Applica Filtri</button>
                </div>
            </div>
        </div>
);
};

export default AllergenModal;