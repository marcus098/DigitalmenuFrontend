import React from "react";
import {Order} from "../Dashboard/Pages/OrderPage";

interface OrderModalProps {
    order: Order;
    onClose: () => void;
}

const OrderModal: React.FC<OrderModalProps> = ({ order, onClose }) => {
    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                <h3 className="font-bold text-lg mb-4">
                    Dettagli Ordine #{order.id}
                </h3>
                <ul>
                    {order.items.map((item, index) => (
                        <li key={index} className="mb-2">
                            <p>
                                {item.productName} - €
                                {item.total.toFixed(2)}
                            </p>
                            {item.additionalIngredients.length > 0 && (
                                <p className="text-sm text-gray-600">
                                    + {item.additionalIngredients.join(", ")}
                                </p>
                            )}
                            {item.removedIngredients.length > 0 && (
                                <p className="text-sm text-gray-600">
                                    - {item.removedIngredients.join(", ")}
                                </p>
                            )}
                            {item.notes && (
                                <p className="text-sm italic text-gray-600">
                                    Note: {item.notes}
                                </p>
                            )}
                        </li>
                    ))}
                </ul>
                <button
                    onClick={onClose}
                    className="mt-4 bg-gray-300 px-4 py-2 rounded-lg"
                >
                    Chiudi
                </button>
            </div>
        </div>
    );
};

export default OrderModal;
