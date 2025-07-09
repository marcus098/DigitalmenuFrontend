// src/Components/EditWaiterModal.tsx
import React, { useState } from 'react';
import {Waiter} from "./WaiterCard";

interface EditWaiterModalProps {
    waiter: Waiter;
    onSave: (id: number, newName: string) => void;
    onClose: () => void;
}

const EditWaiterModal: React.FC<EditWaiterModalProps> = ({ waiter, onSave, onClose }) => {
    const [name, setName] = useState(waiter.name);

    const handleSave = () => {
        if (name.trim()) {
            onSave(waiter.id, name.trim());
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Modifica Cameriere</h2>
                <div>
                    <label htmlFor="waiterName" className="block text-sm font-medium text-gray-700 mb-2">
                        Nome Cameriere
                    </label>
                    <input
                        id="waiterName"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
                <div className="flex justify-end gap-4 mt-8">
                    <button onClick={onClose} className="px-5 py-2.5 rounded-lg text-gray-600 hover:bg-gray-100">
                        Annulla
                    </button>
                    <button onClick={handleSave} className="bg-primary text-white px-5 py-2.5 rounded-lg shadow-md hover:bg-primary-dark font-semibold">
                        Salva Modifiche
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditWaiterModal;