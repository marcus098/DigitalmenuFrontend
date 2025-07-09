// src/Components/AddTableModal.tsx
import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface AddTableModalProps {
    rooms: { id: number; name: string }[];
    onClose: () => void;
    onAdd: (name: string, location: string) => void;
}

const AddTableModal: React.FC<AddTableModalProps> = ({ rooms, onClose, onAdd }) => {
    const [name, setName] = useState('');
    //const [seats, setSeats] = useState(2);
    const [location, setLocation] = useState(rooms[0]?.name || '');
    const [isNewLocation, setIsNewLocation] = useState(false);
    const [customLocation, setCustomLocation] = useState('');

    const handleAddClick = () => {
        const finalLocation = isNewLocation ? customLocation : location;
        if (name.trim() && finalLocation.trim()) {
            onAdd(name.trim(), finalLocation.trim());
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Aggiungi Nuovo Tavolo</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XMarkIcon className="w-7 h-7" />
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome Tavolo</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full input-style" placeholder="Es. T1, Prive'"/>
                    </div>
                    {/*<div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Numero Posti</label>
                        <input type="number" min="1" value={seats} onChange={(e) => setSeats(Number(e.target.value))} className="w-full input-style" />
                    </div>*/}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sala</label>
                        <select value={location} onChange={(e) => setLocation(e.target.value)} disabled={isNewLocation} className="w-full input-style">
                            {rooms.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                        </select>
                        <div className="flex items-center mt-2">
                            <input type="checkbox" id="new-loc" checked={isNewLocation} onChange={(e) => setIsNewLocation(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"/>
                            <label htmlFor="new-loc" className="ml-2 block text-sm text-gray-900">Crea nuova sala</label>
                        </div>
                        {isNewLocation && (
                            <input type="text" value={customLocation} onChange={(e) => setCustomLocation(e.target.value)} className="w-full input-style mt-2" placeholder="Nome nuova sala"/>
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-4 mt-8">
                    <button onClick={onClose} className="btn-secondary">Annulla</button>
                    <button onClick={handleAddClick} className="btn-primary">Aggiungi Tavolo</button>
                </div>
            </div>
        </div>
    );
};

export default AddTableModal