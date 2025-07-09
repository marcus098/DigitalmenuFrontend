// src/Components/AddWaiterModal.tsx
import React from 'react';
import QRCode from 'react-qr-code';
import { XMarkIcon } from '@heroicons/react/24/solid';

interface AddWaiterModalProps {
    link: string;
    onClose: () => void;
}

const AddWaiterModal: React.FC<AddWaiterModalProps> = ({ link, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full relative text-center">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <XMarkIcon className="w-7 h-7" />
                </button>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Invita Nuovo Cameriere</h2>
                <p className="text-gray-600 mb-6">Mostra questo QR Code o condividi il link per completare la registrazione.</p>
                <div className="bg-slate-100 p-6 rounded-lg inline-block">
                    <QRCode value={link} size={192} />
                </div>
                <div className="mt-6">
                    <a href={link} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold break-all">
                        {link}
                    </a>
                </div>
            </div>
        </div>
    );
};

export default AddWaiterModal;