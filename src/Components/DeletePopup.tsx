import React, { useState } from "react";

interface DeletePopupProps {
    itemName: string;
    onConfirm: () => Promise<void>;
    onCancel: () => void;
}

const DeletePopup: React.FC<DeletePopupProps> = ({ itemName, onConfirm, onCancel }) => {
    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full">
                <div className="flex flex-col items-center">
                    <div className="bg-yellow-100 p-4 rounded-full">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6 text-yellow-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 9v2m0 4h.01M21 16.5L12 3 3 16.5h18z"
                            />
                        </svg>
                    </div>

                    <h2 className="text-lg font-semibold text-gray-800 mt-4">
                        Sei sicuro di voler eliminare {itemName}?
                    </h2>
                    <div className="flex mt-6 space-x-4">
                        <button
                            onClick={onConfirm}
                            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                        >
                            Conferma
                        </button>
                        <button
                            onClick={onCancel}
                            className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-400 transition"
                        >
                            Annulla
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeletePopup