// src/Components/EditTableModal.tsx
import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import {Table} from "../../Dashboard/Pages/TablesPageTest";
import {IS_ADMIN} from "../../types";
import {useLoginContext} from "../../Context/LoginContext";

interface EditTableModalProps {
    table: Table;
    onClose: () => void;
    onSave: (tableId: string, newName: string, newSeats: number) => Promise<void>;
    onDelete: (tableId: string) => void;
}

const EditTableModal: React.FC<EditTableModalProps> = ({ table, onClose, onSave, onDelete }) => {
    // Stato locale per gestire i campi del form, inizializzato con i dati del tavolo
    const [name, setName] = useState(table.name);
    const [seats, setSeats] = useState(table.seats || 2);
    const { checkVariable } = useLoginContext()

    // Se l'oggetto `table` cambia dall'esterno, aggiorniamo lo stato del form
    useEffect(() => {
        setName(table.name);
        setSeats(table.seats || 2);
    }, [table]);

    const handleSaveClick = () => {
        console.log("salvo")
        // Validazione minima prima di salvare
        if (name.trim() && seats >= 0) {
            onSave(table.id, name.trim(), seats);
            onClose(); // Chiude il modale dopo aver salvato
        }
    };

    const handleDeleteClick = () => {
        onDelete(table.id);
        onClose(); // Chiude il modale dopo aver avviato l'eliminazione
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Modifica Tavolo</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XMarkIcon className="w-7 h-7" />
                    </button>
                </div>

                {/* Form di modifica */}
                <div className="space-y-4">
                    <div>
                        <label htmlFor="tableName" className="block text-sm font-medium text-gray-700 mb-1">
                            Nome Tavolo
                        </label>
                        <input
                            id="tableName"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full input-style" // Usa la classe globale definita in precedenza
                            placeholder="Es. T1, Prive'"
                        />
                    </div>
                    <div>
                        <label htmlFor="tableSeats" className="block text-sm font-medium text-gray-700 mb-1">
                            Numero Posti
                        </label>
                        <input
                            id="tableSeats"
                            type="number"
                            min="1"
                            value={seats}
                            onChange={(e) => setSeats(Number(e.target.value))}
                            className="w-full input-style"
                        />
                    </div>
                </div>

                {/* Pulsanti di azione */}
                <div className="flex justify-between items-center mt-8">
                    {/* Pulsante Elimina a sinistra */}
                    {checkVariable(IS_ADMIN) && <button
                        onClick={handleDeleteClick}
                        className="text-red-600 font-semibold hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
                    >
                        Elimina Tavolo
                    </button>}

                    {/* Pulsanti Annulla e Salva a destra */}
                    <div className="flex justify-end gap-4">
                        <button onClick={onClose} className="btn-secondary">Annulla</button>
                        <button onClick={handleSaveClick} className="btn-primary">Salva Modifiche</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditTableModal;