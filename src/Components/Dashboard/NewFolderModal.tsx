import React, { useState } from 'react';

interface NewFolderModalProps {
    onClose: () => void;
    onCreate: (folderName: string) => void;
}

export const NewFolderModal: React.FC<NewFolderModalProps> = ({ onClose, onCreate }) => {
    const [name, setName] = useState('');

    const handleCreate = () => {
        if (name.trim()) {
            onCreate(name.trim());
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
                <h3 className="text-2xl font-bold text-gray-800 mb-6">Nuova Cartella</h3>
                <div>
                    <label className="label-style">Nome Cartella</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="input-style mt-1" placeholder="Es. Fatture, Contratti..."/>
                </div>
                <div className="flex justify-end gap-4 mt-8">
                    <button onClick={onClose} className="btn-secondary">Annulla</button>
                    <button onClick={handleCreate} className="btn-primary">Crea Cartella</button>
                </div>
            </div>
        </div>
    );
};