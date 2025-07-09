// src/Components/WaiterCard.tsx
import React from 'react';
import { FaEdit, FaTrashAlt } from 'react-icons/fa';
import { UserIcon } from '@heroicons/react/24/solid';

export interface Waiter{
    id: number
    name: string
    email: string
}

interface WaiterCardProps {
    waiter: Waiter;
    onEdit: (waiter: Waiter) => void;
    onDelete: (waiter: Waiter) => void;
}

const WaiterCard: React.FC<WaiterCardProps> = ({ waiter, onEdit, onDelete }) => {
    return (
        <div className="bg-white p-5 rounded-xl shadow-lg flex items-center justify-between transition-all hover:shadow-xl hover:-translate-y-1">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-primary/20 rounded-full">
                    <UserIcon className="w-7 h-7 text-primary" />
                </div>
                <span className="text-lg font-bold text-gray-800">{waiter.name}</span>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onEdit(waiter)}
                    className="p-3 rounded-full text-gray-500 hover:bg-gray-100 hover:text-primary transition"
                    title="Modifica"
                >
                    <FaEdit size={18} />
                </button>
                <button
                    onClick={() => onDelete(waiter)}
                    className="p-3 rounded-full text-gray-500 hover:bg-red-50 hover:text-red-500 transition"
                    title="Elimina"
                >
                    <FaTrashAlt size={18} />
                </button>
            </div>
        </div>
    );
};

export default WaiterCard;