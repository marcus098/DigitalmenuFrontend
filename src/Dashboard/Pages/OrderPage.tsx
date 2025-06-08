import React, {useEffect, useState} from "react";
import OrderModal from "../../Components/OrderModal";
import OrderCard from "../../Components/OrderCard";
import {print} from "../../Utilities/Utilities";
import {useData} from "../../Context/DataContext";
import {Comand, Order} from "../../ComandType";
import {getCompletedApi, getDeletedApi} from "../../Utilities/api";
import {useNotification} from "../../Context/NotificationContext";
import CustomLoading from "../../Components/CustomLoading";

export interface OrderItem {
    productName: string;
    categoryName: string;
    total: number;
    additionalIngredients: string[];
    removedIngredients: string[];
    notes: string;
    option?: string
    quantity: number
}

export interface Orders {
    id: string;
    userId: string;
    tableName?: string;
    status: 'PROGRESS' | 'COMPLETED' | 'DELETED' | 'AWAIT' | 'PENDING' | 'WAITING';
    items: OrderItem[];
    time?: string
    address?: string
    phone?: string
    name?: string
    createdAt: string
}


const OrdersPage: React.FC = () => {
    const { comands, tablesMap, mapRawOrderToOrder, changeComandStatus } = useData()
    const [singleOrder, setSingleOrder] = useState<Orders | null>(null)
    const [ordersList, setOrdersList] = useState<Orders[]>([]);
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'PROGRESS' | 'COMPLETED' | 'DELETED'>('ALL');
    const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0])
    const [myLoading, setMyLoading] = useState<boolean>(false)
    const [historicalOrders, setHistoricalOrders] = useState<Orders[]>([]);

    const { addNotification } = useNotification()

    useEffect(() => {
        setOrdersList([...mapRawOrderToOrder()])
    }, [comands]);

    useEffect(() => {
        setOrdersList([...mapRawOrderToOrder()])
    }, []);

    const loadHistorical = async (completed: boolean) => {
        setMyLoading(true)
        const response = completed ? await getCompletedApi(filterDate) : await getDeletedApi(filterDate)
        if(response.status === 200){
            setHistoricalOrders(mapRawOrderToOrder(response.data || []) || [])
        }else{
            addNotification({message: "Errore caricamento", type: "error"})
        }
        console.log(response)
        setMyLoading(false)
    }

    useEffect(() => {
        if (filterStatus === 'COMPLETED') {
            loadHistorical(true)
        } else if(filterStatus === 'DELETED') {
            loadHistorical(false)
        }else{
            setHistoricalOrders([])
        }
    }, [filterStatus, filterDate]);

//    const handlePrintOrder = (orderId: string) => {
//        console.log(`Printing order #${orderId}`);
//        print(orders[0])
//        /*const printData = generatePrintData();
//
//        // Verifica se l'app Bluetooth Print è installata
//        const appPackage = "mate.bluetoothprint"; // Pacchetto dell'app
//        const appUrl = `intent://send?text=${encodeURIComponent(printData)}#Intent;package=${appPackage};end;`;
//
//        // Crea un link che aprirà l'app Bluetooth Print
//        window.location.href = appUrl;*/
//    };

    // Funzione per preparare il contenuto da stampare
    const generatePrintData = () => {
        let str = "<110>Questo è il mio test di stampa"; // Testo con formato (ad esempio, testo in grassetto)

        // Aggiungi un'immagine base64 (questo è solo un esempio, sostituisci con una base64 valida)
        const base64Image = "data:image/jpeg;base64,/9j/..."; // Base64 dell'immagine
        str += `<IMAGE>1#${base64Image}`;

        // Aggiungi un codice a barre
        str += "<BARCODE>0#100#50#2132137538472"; // Esempio di barcode

        // Aggiungi un QR code
        str += "<QR>1#50#https://esempio.com";

        // Aggiungi HTML (dovresti sostituire con una versione valida di HTML)
        const htmlCode = "<div><b>Testo stampato</b></div>";
        str += `<HTML>${getHTMLEquivalent(htmlCode)}`;

        return str;
    };

// Funzione per preparare HTML
    const getHTMLEquivalent = (s: any) => {
        return s.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    };

    const handleChangeStatus = async (value: string, newStatus: "PROGRESS" | "COMPLETED" | "DELETED" | "PENDING") => {
        await changeComandStatus(value, newStatus)
    }

    const handlePrintOrder = () => {

    }

    const filteredOrders = filterStatus === 'COMPLETED' || filterStatus === 'DELETED'
        ? historicalOrders.filter(o => {
            const matchStatus = o.status === filterStatus;
            const matchDate = filterDate ? o.createdAt.startsWith(filterDate) : true;
            return matchStatus && matchDate;
        })
        : ordersList.filter(o => filterStatus === 'ALL' || o.status === filterStatus);


    return (
        <div className="p-4">
            {myLoading && <CustomLoading isFullPage={true} isTransparent={true} message={"Loading..."}/>}
            <h1 className="text-2xl font-bold mb-6">Gestione Ordini</h1>
            {/*<a href="thermalprint://print?data=content_to_print">Stampa con Thermal Print</a>
            <a href="printer://print?data=content_to_print">Stampa Print</a>*/}

            <div className="mb-6 flex flex-wrap gap-2">
                {[
                    {label: 'Tutti', value: 'ALL', color: 'gray'},
                    {label: 'Pending', value: 'PENDING', color: 'yellow'},
                    {label: 'In Corso', value: 'PROGRESS', color: 'blue'},
                    {label: 'Completati', value: 'COMPLETED', color: 'green'},
                    {label: 'Cancellati', value: 'DELETED', color: 'red'},
                ].map(({label, value, color}) => (
                    <button
                        key={value}
                        onClick={() => setFilterStatus(value as any)}
                        className={`
                            px-4 py-2 rounded-full text-sm font-semibold border
                            transition-all duration-200
                            ${filterStatus === value
                            ? `bg-${color}-600 text-black border-${color}-600`
                            : `bg-white text-${color}-700 border-${color}-300 hover:bg-${color}-100`}
                        `}
                        >
                            {label}
                        </button>
                ))}

                {['COMPLETED', 'DELETED'].includes(filterStatus) && (
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                )}
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map((order) => (
                    <OrderCard
                        key={order.id}
                        order={order}
                        onStatusChange={handleChangeStatus}
                        onPrint={handlePrintOrder}
                        onDetailsClick={setSingleOrder}
                    />
                ))}
            </div>

            {singleOrder && (
                <OrderModal
                    order={singleOrder}
                    onClose={() => setSingleOrder(null)}
                />
            )}
        </div>
    );
};

export default OrdersPage;