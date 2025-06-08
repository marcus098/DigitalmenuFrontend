import React, { useState } from "react";
import {Orders} from "../Dashboard/Pages/OrderPage";
import {formatDateTime} from "../Utilities/Utilities";

interface OrderCardProps {
    order: Orders;
    onStatusChange: (orderId: string, newStatus: 'PROGRESS' | 'COMPLETED' | 'DELETED' | 'PENDING') => void;
    onPrint: (orderId: string) => void;
    onDetailsClick: (order: Orders) => void;
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
                order.status === "WAITING"
                    ? "bg-yellow-50"
                    : order.status === "PENDING"
                        ? "bg-blue-50"
                        : "bg-green-50"
            }`}
        >
            <div className="flex justify-between items-center">
                <h6 className="font-bold">Ordine #{order.id.substring(0, 17)}...</h6>
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
            {order.createdAt && <p className="text-sm text-black-500">{formatDateTime(order.createdAt)}</p>}
            {order.tableName && <p className="text-sm text-gray-500">Tavolo: {order.tableName}</p>}
            {order.name && <p className="text-sm text-gray-500">Nome: {order.name}</p>}
            {order.address && <p className="text-sm text-gray-500">Indirizzo: {order.address}</p>}
            {order.phone && <p className="text-sm text-gray-500">Tel: {order.phone}</p>}
            {order.time && <p className="text-sm text-gray-500">Ora: {order.time}</p>}
            {order.userId.length < 5 && <p className="text-sm text-gray-500">Utente: {order.userId}</p>}

            {/* Prodotti */}
            <div className="mt-4">
                {(expanded ? order.items : order.items.slice(0, 3)).map(
                    (item, index) => (
                        <div key={index} className="mb-2">
                            <p>
                                <strong>{item.productName} {' x '} {item.quantity}</strong> ({item.categoryName}) - €
                                {item.total.toFixed(2) || 0.00}
                            </p>
                            {item.additionalIngredients.length > 0 && (
                                <p className="text-sm text-green-600">
                                    + {item.additionalIngredients.join(", ")}
                                </p>
                            )}
                            {item.removedIngredients.length > 0 && (
                                <p className="text-sm text-red-600">
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
            <div className="mt-4">
                {/* Stato attuale compatto */}
                <div className="text-center mb-2">
    <span
        className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold text-white ${
            order.status === "WAITING"
                ? "bg-gray-500"
                : order.status === "PENDING"
                    ? "bg-blue-500"
                    : order.status === "PROGRESS"
                        ? "bg-yellow-500"
                        : order.status === "COMPLETED"
                            ? "bg-green-600"
                            : order.status === "DELETED"
                                ? "bg-red-600"
                                : "bg-gray-400"
        }`}
    >
      Stato: {order.status}
    </span>
                </div>

                {/* Pulsanti in fila, piccoli e stretti */}
                <div className="flex justify-center gap-2 flex-wrap">
                    {order.status === "WAITING" && (
                        <>
                            <button
                                onClick={() => onStatusChange(order.id, "PENDING")}
                                className="bg-blue-500 hover:bg-blue-600 text-white text-xs px-3 py-1 rounded"
                            >
                                Pending
                            </button>
                            <button
                                onClick={() => onStatusChange(order.id, "PROGRESS")}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-3 py-1 rounded"
                            >
                                In Cucina
                            </button>
                        </>
                    )}

                    {order.status === "PENDING" && (
                        <>
                            <button
                                onClick={() => onStatusChange(order.id, "PROGRESS")}
                                className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-3 py-1 rounded"
                            >
                                In Cucina
                            </button>
                            <button
                                onClick={() => onStatusChange(order.id, "COMPLETED")}
                                className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded"
                            >
                                Completa
                            </button>
                            <button
                                onClick={() => onStatusChange(order.id, "DELETED")}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded"
                            >
                                Cancella
                            </button>
                        </>
                    )}

                    {order.status === "PROGRESS" && (
                        <>
                            <button
                                onClick={() => onStatusChange(order.id, "COMPLETED")}
                                className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1 rounded"
                            >
                                Completa
                            </button>
                            <button
                                onClick={() => onStatusChange(order.id, "DELETED")}
                                className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded"
                            >
                                Cancella
                            </button>
                        </>
                    )}

                    {(order.status === "COMPLETED" || order.status === "DELETED") && (
                        <span className="italic text-gray-600 text-xs">Nessuna azione disponibile</span>
                    )}
                </div>

                {/* Dettagli */}
                <div className="mt-3 text-center">
                    <button
                        onClick={() => onDetailsClick(order)}
                        className="text-blue-500 text-sm underline"
                    >
                        Dettagli
                    </button>
                </div>
            </div>



        </div>
    );
};

export default OrderCard;
