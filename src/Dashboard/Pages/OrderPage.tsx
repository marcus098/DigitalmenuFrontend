import React, { useState } from "react";
import OrderModal from "../../Components/OrderModal";
import OrderCard from "../../Components/OrderCard";

export interface OrderItem {
    productName: string;
    total: number;
    additionalIngredients: string[];
    removedIngredients: string[];
    notes: string;
}

export interface Order {
    id: string;
    userId: string;
    tableId: string;
    status: "waiting" | "pending" | "confirmed";
    items: OrderItem[];
}

const OrdersPage: React.FC = () => {
    const [orders, setOrders] = useState<Order[]>([
        {
            id: "1",
            userId: "user_001",
            tableId: "Table 5",
            status: "waiting",
            items: [
                {
                    productName: "Pizza Margherita",
                    total: 8.5,
                    additionalIngredients: ["Mozzarella extra"],
                    removedIngredients: ["Basilico"],
                    notes: "Non troppo cotta",
                },
                {
                    productName: "Coca-Cola",
                    total: 3.0,
                    additionalIngredients: [],
                    removedIngredients: [],
                    notes: "",
                },
            ],
        },
        // Aggiungi altri ordini di esempio
    ]);
    const [modalOrder, setModalOrder] = useState<Order | null>(null);

    const handleChangeStatus = (orderId: string, newStatus: 'pending' | 'waiting' | 'confirmed') => {
        setOrders((prevOrders) =>
            prevOrders.map((order) =>
                order.id === orderId ? { ...order, status: newStatus } : order
            )
        );
    };

    const handlePrintOrder = (orderId: string) => {
        console.log(`Printing order #${orderId}`);
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">Gestione Ordini</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orders.map((order) => (
                    <OrderCard
                        key={order.id}
                        order={order}
                        onStatusChange={handleChangeStatus}
                        onPrint={handlePrintOrder}
                        onDetailsClick={setModalOrder}
                    />
                ))}
            </div>

            {modalOrder && (
                <OrderModal
                    order={modalOrder}
                    onClose={() => setModalOrder(null)}
                />
            )}
        </div>
    );
};

export default OrdersPage;