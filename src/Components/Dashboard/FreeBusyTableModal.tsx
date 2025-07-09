import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import {Table} from "../../Dashboard/Pages/TablesPageTest";

interface FreeBusyTableModalProps {
    table: Table;
    onClose: () => void;
    // Modified onSave to reflect busy status and optionally seats for a "busy" table
    onSave: (tableId: number, seats?: number) => Promise<void>;
}

const FreeBusyTableModal: React.FC<FreeBusyTableModalProps> = ({ table, onClose, onSave }) => {
    // State to manage the 'busy' status locally
    const [isBusy, setIsBusy] = useState<boolean>(table.busy);
    // State to manage seats when marking a table as busy
    const [seatsToOccupy, setSeatsToOccupy] = useState<number>(table.seats && table.seats > 0 ? table.seats : 1); // Default to 1 seat if free

    // Update local state if the 'table' prop changes
    useEffect(() => {
        setIsBusy(table.busy);
        setSeatsToOccupy(table.seats && table.seats > 0 ? table.seats : 1);
    }, [table]);

    const handleConfirmFreeTable = async () => {
        await onSave(Number(table.id));
        onClose();
    };

    const handleOccupyTable = async () => {
        if (seatsToOccupy > 0) {
            await onSave(Number(table.id), seatsToOccupy); // Mark table as busy with specified seats
            onClose();
        } else {
            // Optionally, add some user feedback here if seatsToOccupy is not valid
            alert("Il numero di posti deve essere almeno 1.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {table.busy ? `Libera Tavolo ${table.name}` : `Occupa Tavolo ${table.name}`}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XMarkIcon className="w-7 h-7" />
                    </button>
                </div>

                {/* Conditional rendering based on table busy status */}
                {isBusy ? (
                    // If the table is busy, show option to free it
                    <div>
                        <p className="text-lg text-gray-700 mb-6">
                            Sei sicuro di voler liberare il tavolo <span className="font-semibold">{table.name}</span>?
                        </p>
                        <div className="flex justify-end gap-4">
                            <button onClick={onClose} className="btn-secondary">Annulla</button>
                            <button onClick={handleConfirmFreeTable} className="btn-primary-danger">
                                Sì, Libera Tavolo
                            </button>
                        </div>
                    </div>
                ) : (
                    // If the table is free, show option to occupy it and set seats
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="seatsToOccupy" className="block text-sm font-medium text-gray-700 mb-1">
                                Numero di Posti da Occupare
                            </label>
                            <input
                                id="seatsToOccupy"
                                type="number"
                                min="1"
                                value={seatsToOccupy}
                                onChange={(e) => setSeatsToOccupy(Number(e.target.value))}
                                className="w-full input-style"
                            />
                        </div>
                        <div className="flex justify-end gap-4 mt-8">
                            <button onClick={onClose} className="btn-secondary">Annulla</button>
                            <button onClick={handleOccupyTable} className="btn-primary">
                                Occupa Tavolo
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FreeBusyTableModal;