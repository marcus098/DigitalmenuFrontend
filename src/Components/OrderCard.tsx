import React, { useState } from "react";
import {Order} from "../Dashboard/Pages/OrderPage";

interface OrderCardProps {
    order: Order;
    onStatusChange: (orderId: string, newStatus: "waiting" | "pending" | "confirmed") => void;
    onPrint: (orderId: string) => void;
    onDetailsClick: (order: Order) => void;
}

const OrderCard: React.FC<OrderCardProps> = ({
                                                 order,
                                                 onStatusChange,
                                                 onPrint,
                                                 onDetailsClick,
                                             }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div
            className={`border rounded-lg p-4 shadow-md ${
                order.status === "waiting"
                    ? "bg-yellow-50"
                    : order.status === "pending"
                        ? "bg-blue-50"
                        : "bg-green-50"
            }`}
        >
            <div className="flex justify-between items-center">
                <h3 className="font-bold text-lg">Ordine #{order.id}</h3>
                <button onClick={() => onPrint(order.id)}>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6 text-gray-600 hover:text-gray-800"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 9V3h12v6M6 18h12v3H6v-3zM6 14h12v4H6v-4z"
                        />
                    </svg>
                </button>
            </div>
            <p className="text-sm text-gray-500">Tavolo: {order.tableId}</p>
            <p className="text-sm text-gray-500">Utente: {order.userId}</p>

            {/* Prodotti */}
            <div className="mt-4">
                {(expanded ? order.items : order.items.slice(0, 3)).map(
                    (item, index) => (
                        <div key={index} className="mb-2">
                            <p>
                                <strong>{item.productName}</strong> - €
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
                        </div>
                    )
                )}

                {/* Pulsante Mostra/Nascondi */}
                {order.items.length > 3 && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-blue-500 text-sm mt-2 underline"
                    >
                        {expanded ? "Mostra meno" : `Mostra altri (${order.items.length - 3})`}
                    </button>
                )}
            </div>

            {/* Azioni */}
            <div className="flex justify-between items-center mt-4">
                <div>
                    {order.status === "waiting" && (
                        <>
                            <button
                                onClick={() =>
                                    onStatusChange(order.id, "pending")
                                }
                                className="bg-blue-500 text-white px-3 py-1 rounded-lg mr-2"
                            >
                                Pending
                            </button>
                            <button
                                onClick={() =>
                                    onStatusChange(order.id, "confirmed")
                                }
                                className="bg-green-500 text-white px-3 py-1 rounded-lg"
                            >
                                Conferma
                            </button>
                        </>
                    )}
                    {order.status === "pending" && (
                        <button
                            onClick={() =>
                                onStatusChange(order.id, "confirmed")
                            }
                            className="bg-green-500 text-white px-3 py-1 rounded-lg"
                        >
                            Conferma
                        </button>
                    )}
                </div>
                <button
                    onClick={() => onDetailsClick(order)}
                    className="text-blue-500 text-sm underline"
                >
                    Dettagli
                </button>
            </div>
        </div>
    );
};

export default OrderCard;
