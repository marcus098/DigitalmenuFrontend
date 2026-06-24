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
            <div
                className="rounded-xl shadow-xl w-full max-w-md animate-fadeIn"
                style={{ background: 'var(--menu-card)' }}
            >
                <div className="p-6 flex justify-between items-center" style={{ borderBottom: '1px solid var(--menu-border)' }}>
                    <h3 className="text-xl font-bold" style={{ color: 'var(--menu-text)' }}>Opzioni Allergeni</h3>
                    <button
                        onClick={onClose}
                        className="hover:opacity-80"
                        style={{ color: 'var(--menu-muted)' }}
                    ><X className="w-6 h-6" /></button>
                </div>
                <div className="p-6">
                    <p className="text-sm mb-4" style={{ color: 'var(--menu-muted)' }}>Seleziona gli allergeni da escludere. I piatti che li contengono verranno nascosti dal menù.</p>
                    {/* Usiamo il tuo selettore esistente, ma senza il suo stile di card esterna */}
                    <AllergensSelector allergens={mockAllergens} onAllergenChange={setSelected} isModalVersion={true} />
                </div>
                <div
                    className="p-6 rounded-b-xl flex justify-between items-center"
                    style={{ background: 'var(--menu-surface)' }}
                >
                    <button
                        onClick={() => setSelected([])}
                        className="px-4 py-2 rounded-lg font-semibold active:scale-95 hover:opacity-80"
                        style={{ color: 'var(--menu-muted)' }}
                    >Resetta</button>
                    <button
                        onClick={handleApply}
                        className="px-6 py-2 rounded-lg font-bold hover:opacity-90 active:scale-95"
                        style={{ background: 'var(--menu-accent)', color: 'var(--menu-accent-text)' }}
                    >Applica Filtri</button>
                </div>
            </div>
        </div>
);
};

export default AllergenModal;