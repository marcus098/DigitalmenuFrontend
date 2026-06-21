import React, { useState } from "react";
import {sendWaiterComandApi} from "../../Utilities/api";
import {AddComandWaiter, ProductCard} from "../../types";
import {convertCartToAddComandWaiterOrder, saveCart} from "../../Utilities/Utilities";
import {useNotification} from "../../Context/NotificationContext";
import {useParams} from "react-router-dom";
import {useData} from "../../Context/DataContext";

interface CartPopupWaiter {
    cart: ProductCard[]
    close: () => void
}

const CartPopupWaiter: React.FC<CartPopupWaiter> = ({cart, close}) => {
    const options = [
        { id: 1, label: "Da Tavolo", value: "table" },
        { id: 2, label: "Asporto", value: "takeaway" },
        { id: 3, label: "Domicilio", value: "delivery" },
    ];

    const [selected, setSelected] = useState<number>(0);
    const [tableNumber, setTableNumber] = useState<number>(-1);
    const [customerName, setCustomerName] = useState<string>("");
    const [phone, setPhone] = useState<string>("");
    const [address, setAddress] = useState<string>("");
    const [time, setTime] = useState<string>("");
    const { addNotification } = useNotification()
    const { localname } = useParams()
    const { tablesMap } = useData()
    const tables = Array.from(tablesMap.values())

    const resetForm = () => {
        setSelected(0);
        setTableNumber(-1);
        setCustomerName("");
        setPhone("");
        setAddress("");
        setTime("");
        close()
    };

    const handleConfirm = async () => {
        let order: AddComandWaiter = convertCartToAddComandWaiterOrder(cart)
        if (selected === 1) {
            if (tableNumber <= 0) {
                addNotification({message: "Il tavolo è vuoto", type: "error"})
            } else{
                order.comandWaiterType = "TABLE"
                order.idTable = tableNumber
                const response = await sendWaiterComandApi(order)
                if(response.success){
                    saveCart([], "waiter")
                    addNotification({message: "Ordine aggiunto!", type: "success"})
                    window.location.href = (process.env.REACT_APP_URL || "") + "/" + localname + "/Dashboard/Home"
                    resetForm();
                }else{
                    addNotification({message: "Errore", type: "error"})
                }
            }
        } else if (selected === 2) {
            if (customerName.trim() === "" || phone.trim() === "" || time.trim() === ""){
                addNotification({message: "Inserire tutti i capi", type: "error"})
            }
            order.comandWaiterType = "TAKE_AWAY"
            order.name = customerName
            order.phone = phone
            order.time = time
            const response = await sendWaiterComandApi(order)
            if(response.success){
                saveCart([], "waiter")
                addNotification({message: "Ordine aggiunto!", type: "success"})
                window.location.href = (process.env.REACT_APP_URL || "") + "/" + localname + "/Dashboard/Home"
                resetForm();
            }else{
                addNotification({message: "Errore", type: "error"})
            }
        } else if (selected === 3) {
            if (customerName.trim() === "" || phone.trim() === "" || address.trim() === "" || time.trim() === "") {
                addNotification({message: "Inserire tutti i capi", type: "error"})
            }
            order.comandWaiterType = "HOME"
            order.name = customerName
            order.phone = phone
            order.address = address
            order.time = time
            const response = await sendWaiterComandApi(order)
            if(response.success){
                saveCart([], "waiter")
                addNotification({message: "Ordine aggiunto!", type: "success"})
                window.location.href = (process.env.REACT_APP_URL || "") + "/" + localname + "/Dashboard/Home"
                resetForm();
            }else{
                addNotification({message: "Errore", type: "error"})
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            {selected === 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6 w-[90%] max-w-md">
                    <h2 className="text-xl font-semibold mb-4 text-center">
                        Scegli il tipo di ordine
                    </h2>
                    <div className="grid grid-cols-1 gap-4">
                        {options.map((option) => (
                            <div
                                key={option.value}
                                onClick={() => setSelected(option.id)}
                                className="flex items-center justify-center border rounded-xl p-4 cursor-pointer hover:bg-gray-100 transition"
                            >
                                <div className="w-12 h-12 bg-gray-300 rounded-full mr-4" />
                                <span className="text-lg font-medium">{option.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {selected === 1 && (
                <div className="bg-white rounded-2xl shadow-lg p-6 w-[90%] max-w-md">
                    <h2 className="text-xl font-semibold mb-4 text-center">
                        Seleziona il tavolo
                    </h2>
                    <select
                        className="border rounded-lg px-4 py-2 w-full mb-4 bg-white"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(Number(e.target.value))}
                    >
                        <option value={-1}>-- Scegli tavolo --</option>
                        {tables.map(t => (
                            <option key={t.id} value={t.id}>
                                {t.name}{t.busy ? " (occupato)" : ""}
                            </option>
                        ))}
                    </select>
                    <div className="flex justify-between">
                        <button
                            onClick={resetForm}
                            className="text-sm text-gray-500 hover:underline"
                        >
                            Indietro
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                        >
                            Conferma
                        </button>
                    </div>
                </div>
            )}

            {(selected === 2 || selected === 3) && (
                <div className="bg-white rounded-2xl shadow-lg p-6 w-[90%] max-w-md">
                    <h2 className="text-xl font-semibold mb-4 text-center">
                        Inserisci i dati del cliente
                    </h2>
                    <input
                        type="text"
                        placeholder="Nome"
                        className="border rounded-lg px-4 py-2 w-full mb-3"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="Telefono"
                        className="border rounded-lg px-4 py-2 w-full mb-3"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                    />
                    {selected === 3 && (
                        <input
                            type="text"
                            placeholder="Indirizzo"
                            className="border rounded-lg px-4 py-2 w-full mb-3"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                        />
                    )}
                    <input
                        type="time"
                        placeholder="Orario"
                        className="border rounded-lg px-4 py-2 w-full mb-4"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                    />
                    <div className="flex justify-between">
                        <button
                            onClick={resetForm}
                            className="text-sm text-gray-500 hover:underline"
                        >
                            Indietro
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg"
                        >
                            Conferma
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPopupWaiter;
