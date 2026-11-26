import React from "react";
import {Orders, orderTotalCents} from "../Dashboard/Pages/OrderPage";
import SelectedVariantChips from "./Dashboard/SelectedVariantChips";
import DeliveryInfo, {DeliveryBadge} from "./Dashboard/delivery/DeliveryInfo";
import {formatEurCents} from "./Dashboard/delivery/deliveryUtils";
import OrderPayments from "./Dashboard/OrderPayments";
import OrderHistory from "./Dashboard/OrderHistory";
import {isOrderEditable} from "./Dashboard/orderEditing";

interface OrderModalProps {
    order: Orders;
    onClose: () => void;
    /** Staff: apre la modifica dell'ordine (mostrato solo se l'ordine è modificabile) */
    onEdit?: (order: Orders) => void;
}

const OrderModal: React.FC<OrderModalProps> = ({ order, onClose, onEdit }) => {
    return (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg shadow-lg w-96 max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] overflow-y-auto">
                <h3 className="font-bold text-lg mb-4 break-all">
                    Dettagli Ordine #{order.id}
                </h3>
                {order.takenBy && (
                    <p className="text-sm text-gray-600 mb-3">Preso da: <span className="font-semibold text-gray-800">{order.takenBy}</span></p>
                )}
                {order.delivery && (
                    <div className="mb-4">
                        <DeliveryBadge/>
                        <DeliveryInfo delivery={order.delivery} phone={order.phone} time={order.time} name={order.name}
                                      totalCents={orderTotalCents(order)} paid={order.paid}/>
                    </div>
                )}
                <ul>
                    {order.items.map((item, index) => (
                        <li key={index} className="mb-2">
                            <p>
                                <strong>{item.quantity}×</strong> {item.productName} - €
                                {(item.total * item.quantity).toFixed(2)}
                            </p>
                            <SelectedVariantChips variants={item.variants} />
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
                {order.delivery && (
                    <div className="mt-3 pt-3 border-t border-gray-200 text-sm space-y-1">
                        <div className="flex justify-between text-gray-600">
                            <span>Consegna</span>
                            <span>{order.delivery.feeCents > 0 ? formatEurCents(order.delivery.feeCents) : 'Gratis'}</span>
                        </div>
                        <div className="flex justify-between font-bold text-gray-900">
                            <span>Totale</span>
                            <span>{formatEurCents(orderTotalCents(order))}</span>
                        </div>
                    </div>
                )}
                <OrderHistory history={order.raw?.history}/>
                {order.id && <OrderPayments comandId={order.id}/>}
                <div className="mt-4 flex gap-2">
                    <button
                        onClick={onClose}
                        className="bg-gray-300 px-4 py-2 rounded-lg"
                    >
                        Chiudi
                    </button>
                    {onEdit && isOrderEditable(order) && (
                        <button
                            onClick={() => onEdit(order)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                        >
                            Modifica
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderModal;
