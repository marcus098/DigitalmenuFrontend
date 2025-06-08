import React, {useEffect, useState} from "react";
import GridLayout, { Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { FaInfoCircle, FaTrashAlt } from "react-icons/fa";
import {useData} from "../../Context/DataContext";
import {getComandsByTableApi} from "../../Utilities/api";
import {Orders} from "./OrderPage";
import DeletePopup from "../../Components/DeletePopup";
import {useNotification} from "../../Context/NotificationContext";

interface Table {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    name: string;
    status: string;
    seats?: number;
    total?: number;
    code?: string;
    location: string
}

interface Room {
    id: number;
    name: string;
    tables: Table[];
}

interface Item {
    additionalIngredients: string[]
    option: string
    productName: string
    categoryName: string
    removedIngredients: string[]
    total: number
    quantity: number
}

type OrderStatus = "PROGRESS" | "PENDING" | "COMPLETED" | "CONFIRMED";


const TablesPageTest: React.FC = () => {
    const { tablesMap, mapRawOrderToOrder, setBusyTable, freeTableContext, forceFreeTableContext } = useData();
    const { addNotification } = useNotification()
    const [rooms, setRooms] = useState<Room[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<number | null>(null);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [isModified, setIsModified] = useState(false);
    const [checkHasComands, setCheckHasComands] = useState<boolean>(false)
    const [tableOrders, setTableOrders] = useState<Record<OrderStatus, Item[]>>({
        PENDING: [],
        PROGRESS: [],
        COMPLETED: [],
        CONFIRMED: []
    });
    const [orderTotal, setOrderTotal] = useState<Record<OrderStatus, number>>({
        PENDING: 0,
        PROGRESS: 0,
        COMPLETED: 0,
        CONFIRMED: 0
    });
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [newTableData, setNewTableData] = useState<{
        name: string;
        location: string;
        isNewLocation: boolean;
        customLocation: string;
        visible: boolean;
    }>({
        name: '',
        location: '',
        isNewLocation: false,
        customLocation: '',
        visible: false,
    });


    useEffect(() => {
        if (!tablesMap) return;

        const roomMap = new Map<string, Table[]>();

        tablesMap.forEach((tableDto) => {
            const location = tableDto.location || "Senza Sala";
            const table: Table = {
                id: tableDto.id.toString(),
                name: tableDto.name,
                status: tableDto.busy ? "Occupato" : "Libero",
                x: tableDto.x,
                y: tableDto.y,
                w: tableDto.w,
                h: tableDto.h,
                code: tableDto.code,
                location: tableDto.location,
                seats: tableDto.seats
            };

            if (!roomMap.has(location)) {
                roomMap.set(location, []);
            }

            roomMap.get(location)?.push(table);
        });

        const generatedRooms: Room[] = Array.from(roomMap.entries()).map(([location, tables], index) => ({
            id: index + 1,
            name: location,
            tables,
        }));

        setRooms(generatedRooms);

        if (generatedRooms.length > 0 && !selectedRoom) {
            setSelectedRoom(generatedRooms[0].id);
            window.location.hash = generatedRooms[0].id + '';
        }
    }, [tablesMap]);

    useEffect(() => {
        if (selectedTable && selectedTable.status !== "Libero"){
            fetchTableOrders(selectedTable.id)
        }
    }, [selectedTable]);

    useEffect(() => {
        const hash = decodeURIComponent(window.location.hash);
        const location = hash.replace('#', '');
        setSelectedRoom(Number(location) || null)
    }, []);

    const freeTable = async () => {
        if(selectedTable && selectedTable.id.startsWith("temp")){
            addNotification({message: "Errore. Aggiornare la pagina", type: "error"})
        }
        if(selectedTable && selectedTable?.id) {
            const response = await freeTableContext(Number(selectedTable.id))
            if (response === "SUCCESS") {
                resetAll()
            } else if (response === "NOT_EMPTY") {
                setCheckHasComands(true)
            }
        }
    }

    const forceFreeTable = async() => {
        if(selectedTable && selectedTable.id.startsWith("temp")){
            addNotification({message: "Errore. Aggiornare la pagina", type: "error"})
        }
        if(selectedTable && selectedTable?.id) {
            const response = await forceFreeTableContext(Number(selectedTable.id))

            if (response)
                resetAll()
        }
    }

    const setBusy = async() => {
        if(selectedTable && selectedTable.id.startsWith("temp")){
            addNotification({message: "Errore. Aggiornare la pagina", type: "error"})
        }
        if(selectedTable && selectedTable?.id && selectedTable.seats) {
            const response = await setBusyTable(Number(selectedTable.id), selectedTable.seats)
            if(response){
                addNotification({message: "Tavolo occupato", type: "success"})
                resetAll(true)
            }
        }
    }

    const fetchTableOrders = async (tableId: string) => {
        try {
            setLoadingOrders(true);
            const res = await getComandsByTableApi(Number(tableId));

            if(res.status === 200){
                const tmp = ([...mapRawOrderToOrder(res.data || [])]);

                const grouped: {PROGRESS: any, PENDING: any, COMPLETED: any, CONFIRMED: any} = {
                    PROGRESS: {},
                    PENDING: {},
                    COMPLETED: {},
                    CONFIRMED: {}
                };

                for (const comand of tmp) {
                    const status = comand.status;
                    if (status === 'DELETED' || status === 'AWAIT' || status === 'WAITING')
                        continue

                    for (const item of comand.items) {
                        const key = JSON.stringify({
                            productName: item.productName,
                            categoryName: item.categoryName,
                            option: item.option,
                            additionalIngredients: [...item.additionalIngredients].sort(),
                            removedIngredients: [...item.removedIngredients].sort(),
                        });

                        if (!grouped[status][key]) {
                            grouped[status][key] = {
                                productName: item.productName,
                                categoryName: item.categoryName,
                                option: item.option,
                                additionalIngredients: [...item.additionalIngredients],
                                removedIngredients: [...item.removedIngredients],
                                total: 0,
                                quantity: 0
                            };
                        }

                        grouped[status][key].total += item.total;
                        grouped[status][key].quantity += item.quantity;
                    }
                }

                const result = {
                    PROGRESS: Object.values(grouped.PROGRESS) as Item[],
                    PENDING: Object.values(grouped.PENDING) as Item[],
                    COMPLETED: Object.values(grouped.COMPLETED) as Item[],
                    CONFIRMED: Object.values(grouped.CONFIRMED) as Item[]
                };

                const totalAll: Record<OrderStatus, number> = {
                    PENDING: result.PENDING.reduce((sum, item) => sum + (item.total * item.quantity), 0),
                    PROGRESS: result.PROGRESS.reduce((sum, item) => sum + (item.total * item.quantity), 0),
                    COMPLETED: result.COMPLETED.reduce((sum, item) => sum + (item.total * item.quantity), 0),
                    CONFIRMED: result.CONFIRMED.reduce((sum, item) => sum + (item.total * item.quantity), 0)
                }

                setTableOrders(result)
                setOrderTotal(totalAll);
            }else{
                // todo mandare chiamata al backend principale in quanto gli ordini sono importanti
                // todo spostare la logica in DataContext
            }

        } catch (error) {
            console.error("Errore caricamento comande", error);
        } finally {
            setLoadingOrders(false);
        }
    };

    const resetAll = (keepModal?: boolean) => {
        setOrderTotal({
            PENDING: 0,
            PROGRESS: 0,
            COMPLETED: 0,
            CONFIRMED: 0
        })
        setTableOrders({
            PENDING: [],
            PROGRESS: [],
            COMPLETED: [],
            CONFIRMED: []
        })
        if(!keepModal)
            setSelectedTable(null)
        setCheckHasComands(false)
    }


    const handleRoomChange = (roomId: number) => {
        setSelectedRoom(roomId)
        window.location.hash = roomId + '';
    }

    const handleLayoutChange = (layout: Layout[]) => {
        setRooms((prevRooms) =>
            prevRooms.map((room) =>
                room.id === selectedRoom
                    ? {
                        ...room,
                        tables: layout.map((item) => {
                            const table = room.tables.find((t) => t.id === item.i);
                            return table ? { ...table, x: item.x, y: item.y, w: item.w, h: item.h } : null;
                        }).filter((table): table is Table => table !== null),
                    }
                    : room
            )
        );
        setIsModified(true);
    };

    const convertName = (status: "PROGRESS" | "PENDING" | "COMPLETED" | "CONFIRMED") => {
        switch (status){
            case "COMPLETED":
                return "Completate"
            case "CONFIRMED":
                return "Confermate"
            case "PENDING":
                return "In attesa"
            case "PROGRESS":
                return "In corso"
        }
    }

    const handleAddTable = () => {
        setNewTableData({
            name: '',
            location: '',
            isNewLocation: false,
            customLocation: '',
            visible: true,
        });
    };


    const handleRemoveTable = (tableId: string) => {
        setRooms((prevRooms) =>
            prevRooms.map((room) =>
                room.id === selectedRoom ? { ...room, tables: room.tables.filter((table) => table.id !== tableId) } : room
            )
        );
        setSelectedTable(null);
        setIsModified(true);
    };

    return (
        <>
            {checkHasComands && <DeletePopup itemName={"free_table"} onConfirm={forceFreeTable} onCancel={() => setCheckHasComands(false)} />}
        <div className="p-4">

            {newTableData.visible && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96 space-y-4">
                        <h3 className="text-md font-semibold text-gray-700 mb-1 flex items-center gap-1">
                            <FaInfoCircle className="text-blue-400"/> Dettaglio Comande
                        </h3>

                        <input
                            type="text"
                            className="w-full border rounded px-2 py-1"
                            placeholder="Nome Tavolo"
                            value={newTableData.name}
                            onChange={(e) => setNewTableData(prev => ({...prev, name: e.target.value}))}
                        />

                        <div>
                            <label className="block font-semibold mb-1">Seleziona Location</label>
                            <select
                                className="w-full border rounded px-2 py-1"
                                disabled={newTableData.isNewLocation}
                                value={newTableData.location}
                                onChange={(e) => setNewTableData(prev => ({...prev, location: e.target.value}))}
                            >
                                <option value="">-- Seleziona --</option>
                                {[...Array.from(rooms.map(r => r.name))].map((loc) => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                            <div className="flex items-center mt-2">
                                <input
                                    type="checkbox"
                                    checked={newTableData.isNewLocation}
                                    onChange={(e) =>
                                        setNewTableData((prev) => ({
                                            ...prev,
                                            isNewLocation: e.target.checked,
                                            location: '',
                                            customLocation: '',
                                        }))
                                    }
                                />
                                <span className="ml-2">Inserisci nuova location</span>
                            </div>

                            {newTableData.isNewLocation && (
                                <input
                                    type="text"
                                    placeholder="Nuova Location"
                                    className="w-full mt-2 border rounded px-2 py-1"
                                    value={newTableData.customLocation}
                                    onChange={(e) => setNewTableData(prev => ({
                                        ...prev,
                                        customLocation: e.target.value
                                    }))}
                                />
                            )}
                        </div>

                        <div className="flex justify-end space-x-2">
                            <button
                                className="px-4 py-2 rounded bg-gray-300 text-gray-800"
                                onClick={() => setNewTableData(prev => ({...prev, visible: false}))}
                            >
                                Annulla
                            </button>
                            <button
                                className="px-4 py-2 rounded bg-green-500 text-white"
                                onClick={() => {
                                    const finalLocation = newTableData.isNewLocation
                                        ? newTableData.customLocation
                                        : newTableData.location;

                                    if (!finalLocation || !newTableData.name) return;

                                    // Inserisci un nuovo tavolo tratteggiato (default posizione y max)
                                    const roomIndex = rooms.findIndex(r => r.name === finalLocation);
                                    const table: Table = {
                                        id: `temp-${Date.now()}`,
                                        name: newTableData.name,
                                        location: finalLocation,
                                        x: 0,
                                        y: 0,
                                        w: 2,
                                        h: 2,
                                        status: "Libero",
                                    };

                                    setRooms((prevRooms) => {
                                        if (roomIndex !== -1) {
                                            const updatedRooms = [...prevRooms];
                                            updatedRooms[roomIndex].tables.push(table);
                                            return updatedRooms;
                                        } else {
                                            return [
                                                ...prevRooms,
                                                {
                                                    id: prevRooms.length + 1,
                                                    name: finalLocation,
                                                    tables: [table],
                                                },
                                            ];
                                        }
                                    });

                                    handleRoomChange(
                                        roomIndex !== -1 ? rooms[roomIndex].id : rooms.length + 1
                                    );

                                    setNewTableData({
                                        name: '',
                                        location: '',
                                        isNewLocation: false,
                                        customLocation: '',
                                        visible: false,
                                    });

                                    setIsModified(true);
                                }}
                            >
                                Inserisci
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <h1 className="text-2xl font-bold mb-6">Gestione Tavoli - Test</h1>

            {/* Selettore Stanze */}
            <div className="flex space-x-4 mb-4">
                {rooms.map((room) => (
                    <button
                        key={room.id}
                        onClick={() => handleRoomChange(room.id)}
                        className={`px-4 py-2 rounded-lg ${
                            room.id === selectedRoom ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"
                        }`}
                    >
                        {room.name}
                    </button>
                ))}
            </div>

            {/* Pulsante Aggiungi Tavolo fuori dal riquadro */}
            <button onClick={handleAddTable} className="bg-amber-500 text-white px-4 py-2 rounded-lg shadow hover:bg-amber-600 transition">
                Aggiungi Tavolo
            </button>

            {/* Mappa Tavoli */}
            <div className="border rounded-lg bg-gray-100 p-4">
                <GridLayout
                    className="layout"
                    layout={
                        rooms.find((room) => room.id === selectedRoom)?.tables.map((table) => ({
                            i: table.id,
                            x: table.x,
                            y: table.y,
                            w: table.w,
                            h: table.h,
                        })) || []
                    }
                    cols={12}
                    rowHeight={50}
                    width={1000}
                    onLayoutChange={handleLayoutChange}
                    isResizable
                    isDraggable
                >
                    {rooms.find((room) => room.id === selectedRoom)?.tables.map((table) => (
                        <div
                            key={table.id}
                            className={`rounded-lg shadow-md flex items-center justify-between p-2 cursor-move ${
                                table.status === "Libero" ? "bg-green-200" : "bg-red-200"
                            }`}
                            data-grid={{ x: table.x, y: table.y, w: table.w, h: table.h }}
                            onMouseDown={(e) => e.stopPropagation()}
                        >
                            <span>{table.name}</span>
                            <div className="flex space-x-2">
                                <button
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedTable(table);
                                    }}
                                    className="text-blue-500 hover:text-blue-700 p-2 rounded-full"
                                    title="Dettagli Tavolo"
                                >
                                    <FaInfoCircle size={16} />
                                </button>

                                <button
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveTable(table.id);
                                    }}
                                    className="text-red-500 hover:text-red-700 p-2 rounded-full"
                                    title="Elimina Tavolo"
                                >
                                    <FaTrashAlt size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </GridLayout>
            </div>

            {/* Pulsante Salva Modifiche */}
            {isModified && (
                <button
                    onClick={() => {
                        console.log("Modifiche Salvate", rooms);
                        setIsModified(false);
                    }}
                    className="bg-amber-500 text-white px-4 py-2 rounded-lg shadow hover:bg-amber-600 transition"
                >
                    Salva Modifiche
                </button>
            )}

            {/* Modale Tavolo */}
            {selectedTable && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                        <h2 className="text-xl font-bold mb-4">{selectedTable.name}</h2>

                        {selectedTable.status === "Libero" ? (
                            <>
                                <label className="block font-semibold mb-1">Numero posti</label>
                                <input
                                    type="number"
                                    min={1}
                                    className="w-full border rounded px-2 py-1 mb-4"
                                    value={selectedTable.seats || ''}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        setSelectedTable((prev) =>
                                            prev ? { ...prev, seats: isNaN(val) ? undefined : val } : null
                                        );
                                    }}
                                />
                                <button
                                    className="bg-green-500 text-white px-4 py-2 rounded-lg w-full"
                                    onClick={() => {
                                        if (!selectedTable.seats || selectedTable.seats < 1) addNotification({message:"Inserisci un numero di posti valido", type:"warning"})
                                        else{
                                            //setSelectedTable((prev) =>
                                            //    prev ? { ...prev, status: "Occupato" } : null
                                            //);
                                            setBusy()
                                        }
                                    }}
                                >
                                    Occupa
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="mb-2">
                                    Codice Cliente: <span className="font-semibold">{selectedTable.code}</span>
                                </p>
                                <div className="mb-4">
                                    <p className="text-sm text-gray-600 mb-2">
                                        Persone al tavolo: <span className="font-semibold">{selectedTable.seats}</span>
                                    </p>

                                    {loadingOrders ? (
                                        <p className="text-gray-500 italic">Caricamento comande...</p>
                                    ) : (
                                        <>
                                            <div className="bg-gray-100 rounded-md p-3 space-y-4 max-h-96 overflow-y-auto border border-gray-300">
                                                <h3 className="text-md font-semibold text-gray-700 mb-2">Dettaglio Comande</h3>

                                                {(["PROGRESS", "PENDING", "COMPLETED"] as OrderStatus[]).map((status) => (
                                                    <div key={status}>
                                                        <h4 className="text-sm font-semibold text-blue-600 uppercase mb-1">{convertName(status)} {' - € '} {orderTotal[status].toFixed(2)}</h4>

                                                        {tableOrders[status] && tableOrders[status].length > 0 ? (
                                                            tableOrders[status].map((item, idx) => (
                                                                <div
                                                                    key={`${status}-${idx}`}
                                                                    className="border border-gray-300 rounded px-2 py-1 mb-2 bg-white shadow-sm"
                                                                >
                                                                    <div
                                                                        className="flex justify-between text-sm font-medium text-gray-800">
                                                                        <div>
                                                                            {item.productName} x {item.quantity}
                                                                        </div>
                                                                    </div>

                                                                    <div
                                                                        className="flex justify-between text-sm font-medium text-gray-800">
                                                                        <div>
                                                                            Tot: € {(item.total * item.quantity).toFixed(2)}
                                                                        </div>
                                                                    </div>

                                                                    {item.option !== 'default' &&
                                                                        <div className="text-xs text-gray-600 mt-1">
                                                                            Opzione: <span
                                                                            className="font-semibold">{item.option}</span>
                                                                        </div>}

                                                                    {item.additionalIngredients.length > 0 && (
                                                                        <div className="text-xs text-green-600">
                                                                            + {item.additionalIngredients.join(", ")}
                                                                        </div>
                                                                    )}

                                                                    {item.removedIngredients.length > 0 && (
                                                                        <div className="text-xs text-red-600">
                                                                            - {item.removedIngredients.join(", ")}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="text-xs text-gray-500 ml-1 mb-2">Nessuna
                                                                comanda {convertName(status).toLowerCase()}.</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            <div className="mt-3 text-right text-lg font-bold text-gray-800">
                                                Totale: €{(orderTotal.PENDING + orderTotal.PROGRESS + orderTotal.CONFIRMED + orderTotal.COMPLETED).toFixed(2)}
                                            </div>
                                        </>

                                    )}
                                </div>
                                <button
                                    className="bg-red-500 text-white px-4 py-2 rounded-lg w-full"
                                    onClick={() => {
                                        //setSelectedTable((prev) =>
                                        //    prev ? { ...prev, status: "Libero", seats: undefined } : null
                                        //);
                                        freeTable()
                                    }}
                                >
                                    Libera Tavolo
                                </button>
                            </>
                        )}

                        <button
                            onClick={() => setSelectedTable(null)}
                            className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg mt-4 w-full"
                        >
                            Chiudi
                        </button>
                    </div>
                </div>
            )}

        </div>
        </>
    );
};

export default TablesPageTest
