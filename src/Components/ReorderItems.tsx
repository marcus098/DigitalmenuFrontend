import React, { useState } from "react";
import { Reorder } from "framer-motion";
import axios from "axios";

// Tipo per rappresentare un prodotto o categoria
interface Item {
    id: string;
    name: string;
}

const initialItems: Item[] = [
    { id: "1", name: "🍅 Tomato" },
    { id: "2", name: "🥒 Cucumber" },
    { id: "3", name: "🧀 Cheese" },
    { id: "4", name: "🥬 Lettuce" },
];

const ReorderItems: React.FC = () => {
    const [items, setItems] = useState<Item[]>(initialItems);
    const [isSaving, setIsSaving] = useState(false); // Stato per tracking della richiesta

    // Funzione per inviare l'ordine aggiornato al backend
    const sendUpdatedOrder = async (orderedItems: Item[]) => {
        try {
            setIsSaving(true); // Imposta lo stato di salvataggio
            const ids = orderedItems.map(item => item.id); // Estrai solo gli ID
            await axios.post("/api/update-order", { ids });
            console.log("Order updated successfully");
        } catch (error) {
            console.error("Error updating order:", error);
        } finally {
            setIsSaving(false); // Ripristina lo stato dopo il salvataggio
        }
    };

    return (
        <div>
            <h1>Reorder Categories/Products</h1>
            <Reorder.Group axis="y" onReorder={setItems} values={items}>
                {items.map((item) => (
                    <Reorder.Item key={item.id} value={item}>
                        <div className="p-4 border border-gray-300 rounded-md mb-2 bg-white flex items-center justify-between">
                            <span>{item.name}</span>
                        </div>
                    </Reorder.Item>
                ))}
            </Reorder.Group>

            {/* Pulsante Salva */}
            <button
                onClick={() => sendUpdatedOrder(items)}
                className="mt-4 bg-blue-500 text-white py-2 px-4 rounded disabled:opacity-50"
                disabled={isSaving} // Disabilita il pulsante mentre si sta salvando
            >
                {isSaving ? "Saving..." : "Save Order"}
            </button>
        </div>
    );
};

export default ReorderItems;
