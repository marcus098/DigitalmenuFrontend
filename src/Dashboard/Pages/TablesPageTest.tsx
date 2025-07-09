// src/pages/TablesPageTest.tsx

import React, {useState, useEffect} from "react";
import {Responsive, WidthProvider, Layouts, Layout} from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import {useData} from "../../Context/DataContext";
import TableItem from "../../Components/Dashboard/TableItem";
import AddTableModal from "../../Components/Dashboard/AddTableModal";
import EditTableModal from "../../Components/Dashboard/EditTableModal";
import DeletePopup from "../../Components/DeletePopup";
import {PlusIcon, CheckIcon} from "@heroicons/react/24/solid";
import {useNotification} from "../../Context/NotificationContext";
import {AddTable, UpdateTableRow, UpdateTables} from "../../types";
import {all} from "axios";
import CustomLoading from "../../Components/CustomLoading";
import FreeBusyTableModal from "../../Components/Dashboard/FreeBusyTableModal";


const ResponsiveGridLayout = WidthProvider(Responsive);

const TablesPageTest: React.FC = () => {
    // STATI COMPLETI
    const { loading, tablesMap, mapRawOrderToOrder, setBusyTable, freeTableContext, forceFreeTableContext, addTableFunc, updateTablesFunc, updateSingleTableFunc, deleteTable, forceDeleteTable } = useData();
    const { addNotification } = useNotification();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
    const [layouts, setLayouts] = useState<Layouts>({});
    const [isModified, setIsModified] = useState(false);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
    const [isForceDeletePopupOpen, setIsForceDeletePopupOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isBusyModalOpen, setIsBusyModalOpen] = useState<boolean>(false)

    const [showBusyMessage, setShowBusyMessage] = useState(false);
    const [tableOrders, setTableOrders] = useState<Record<OrderStatus, Item[]>>({ PENDING: [], PROGRESS: [], COMPLETED: [], CONFIRMED: [] });
    const [orderTotal, setOrderTotal] = useState<Record<OrderStatus, number>>({ PENDING: 0, PROGRESS: 0, COMPLETED: 0, CONFIRMED: 0 });
    const [loadingOrders, setLoadingOrders] = useState<boolean>(false);
    const [layoutCurrent, setLayoutCurrent] = useState<Layout[]>([])

    const saveTableLayout = (l: any) => {
        console.log(l)
    }

    // LOGICA DI CARICAMENTO DATI
    useEffect(() => {
        if (!tablesMap) return;
        const roomMap = new Map<string, Table[]>();
        tablesMap.forEach((tableDto) => {
            const location = tableDto.location || "Senza Sala";
            const table: Table = {
                id: tableDto.id.toString(), name: tableDto.name, status: tableDto.busy ? "Occupato" : "Libero",
                x: tableDto.x, y: tableDto.y, w: tableDto.w, h: tableDto.h,
                code: tableDto.code, location: tableDto.location, seats: tableDto.seats, busy: tableDto.busy
            };
            if (!roomMap.has(location)) roomMap.set(location, []);
            roomMap.get(location)?.push(table);
        });
        const generatedRooms: Room[] = Array.from(roomMap.entries()).map(([name, tables], index) => ({ id: index, name, tables }));
        setRooms(generatedRooms);

        const hash = window.location.hash.replace('#', '');
        const initialRoom = generatedRooms.find(r => r.name === hash) || generatedRooms[0];
        if (initialRoom) setSelectedRoom(initialRoom);
    }, [tablesMap]);

    // LOGICA PER I LAYOUT (STABILE)
    useEffect(() => {
        if (!selectedRoom) { setLayouts({}); return; }
        const currentLayout = selectedRoom.tables.map(t => ({ i: t.id.toString(), x: t.x, y: t.y, w: t.w, h: t.h }));
        const newLayouts: Layouts = { lg: currentLayout, md: currentLayout, sm: currentLayout, xs: currentLayout, xxs: currentLayout };
        setLayouts(newLayouts);
        setIsModified(false);
    }, [selectedRoom]);

    const handleLayoutChange = (currentLayout: Layout[], allLayouts: Layouts) => {
        setLayouts(allLayouts);
        setLayoutCurrent([...currentLayout])
        if (!isModified) setIsModified(true);
    };

    // LOGICA DI FETCH DEGLI ORDINI
    useEffect(() => {
        if (selectedTable && selectedTable.status === "Occupato"){
            fetchTableOrders(selectedTable.id);
        }
    }, [selectedTable]);

    const fetchTableOrders = async (tableId: string) => { /* ... la tua logica di fetch qui ... */ };


    const handleSaveLayout = async () => {
        if(selectedRoom?.tables) {
            const tables:  UpdateTableRow[] = []
            for(const t of layoutCurrent){
                tables.push({
                    id: Number(t.i),
                    x: t.x,
                    y: t.y,
                    w: t.w,
                    h: t.h
                })
            }
            const updated: UpdateTables = {
                id: selectedRoom.id,
                name: selectedRoom.name,
                tables: tables
            }

            const response = await updateTablesFunc(updated)
            if(response) {
                addNotification({message: "Salvato!", type: "success"})
                setIsModified(false)
            }else{
                addNotification({message: "Errore", type: "error"})
            }
        }
    };

    const handleRoomChange = (room: Room) => { setSelectedRoom(room); window.location.hash = room.name; };
    const handleInfoClick = (table: Table) => { setSelectedTable(table); setIsDetailModalOpen(true); };
    const handleEditClick = (table: Table) => { setSelectedTable(table); setIsEditModalOpen(true); };
    const handleRemoveClick = (table: Table) => { setSelectedTable(table); setIsDeletePopupOpen(true); };

    const handleConfirmDelete = async () => {
        if(!selectedTable) return

        const response = await deleteTable(Number(selectedTable.id))
        switch(response){
            case "SUCCESS":
                addNotification({message: "Tavolo eliminato!", type: "success"})
                setIsDeletePopupOpen(false)
                break;
            case "ERROR":
                addNotification({message: "Errore!", type: "error"})
                break;
            case "TABLE_NOT_FOUND":
                setIsDeletePopupOpen(false)
                addNotification({message: "Tavolo non trovato!", type: "error"})
                break;
            case "NOT_EMPTY":
                setIsDeletePopupOpen(false)
                setIsForceDeletePopupOpen(true)
                break;
            case "NOT_AUTHORIZED":
                addNotification({message: "Non autorizzato!", type: "error"})
                setIsDeletePopupOpen(false)
                break;
        }
    };

    const handleForceConfirmDelete = async () => {
        if(!selectedTable) return
        const response = await forceDeleteTable(Number(selectedTable.id))
        if(response){
            addNotification({message: "Tavolo eliminato!", type: "success"})
            setIsForceDeletePopupOpen(false)
        }else{
            addNotification({message: "Errore!", type: "error"})
        }
    }

    const forceFreeTable = async (id: number) => {
        const response = await forceFreeTableContext(id)
        if(response)
            addNotification({message: "Tavolo liberato!", type: "success"})
        else
            addNotification({message: "Errore", type: "error"})
    }

    const freeTable = async (id: number) => {
        const response = await freeTableContext(id)
        switch(response){
            case "SUCCESS":
                addNotification({message: "Tavolo liberato!", type: "success"})
                break;
            case "ERROR":
                addNotification({message: "Errore", type: "error"})
                break;
            case "TABLE_NOT_FOUND":
                addNotification({message: "Tavolo non trovato", type: "error"})
                break;
            case "NOT_EMPTY":
                addNotification({message: "Tavolo occupato", type: "error"})
                setShowBusyMessage(true)
                return;
            case "NOT_AUTHORIZED":
                addNotification({message: "Non autorizzato", type: "error"})
                break
        }
        setShowBusyMessage(false)
    };

    const setBusy = async (id: number, seats?: number) => {
        if(!seats) return
        const response = await setBusyTable(id, seats)
        if(response)
            addNotification({message: "Tavolo occupato!", type: "success"})
        else
            addNotification({message: "Errore", type: "error"})
    };

    const onAdd = async(name: string, location: string) => {
        const addTable: AddTable = {
            name: name,
            location: location,
            type: "",
            x: 0,
            y: 0,
            w: 0,
            h: 0
        }
        const response = await addTableFunc(addTable)
        if(response){
            addNotification({message: "Tavolo aggiunto!", type: "success"})
            setIsAddModalOpen(false)
        }else{
            addNotification({message: "Errore!", type: "error"})
        }
    }

    const handleEdit = async (tableId: string, name: string, seats: number) => {
        if(selectedTable && Number(selectedTable.id) === Number(tableId)){
            const response = await updateSingleTableFunc({
                id: Number(selectedTable.id),
                name: name,
                x: selectedTable.x,
                y: selectedTable.y,
                w: selectedTable.w,
                h: selectedTable.h,
                seats: seats,
                busy: selectedTable.busy,
                location: selectedTable.location
            })
            if(response){
                addNotification({message: "Tavolo modificato!", type: "success"})
                setIsEditModalOpen(false)
            }else{
                addNotification({message: "Errore", type: "error"})
            }
        }
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            {/* HEADER */}
            <header className="p-4 bg-white border-b border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <h1 className="text-3xl font-bold text-gray-800">Gestione Sala</h1>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                        {rooms.map(room => (
                            <button key={room.id} onClick={() => handleRoomChange(room)}
                                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors flex-shrink-0 ${selectedRoom?.id === room.id ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                                {room.name}
                            </button>
                        ))}
                    </div>
                </div>
            </header>

            {/* AREA PRINCIPALE */}
            <main className="flex-1 relative p-4 overflow-y-auto">
                {selectedRoom ? (
                    <ResponsiveGridLayout
                        layouts={layouts}
                        onLayoutChange={handleLayoutChange}
                        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                        cols={{ lg: 24, md: 20, sm: 12, xs: 8, xxs: 4 }}
                        rowHeight={30}
                        draggableCancel=".non-draggable" // Regola chiave
                    >
                        {selectedRoom.tables.map(table => (
                            <TableItem
                                key={table.id.toString()}
                                table={table}
                                isSelected={selectedTable?.id === table.id}
                                onInfo={handleInfoClick}
                                onEdit={handleEditClick}
                                onRemove={() => handleRemoveClick(table)}
                                onFree={(table: Table)        => {setSelectedTable(table); freeTable(Number(table.id))}}
                                onOccupy={(table: Table)      => {setSelectedTable(table); setIsBusyModalOpen(true)}}
                            />
                        ))}
                    </ResponsiveGridLayout>
                ) : (
                    <div className="flex items-center justify-center h-full"><p className="text-gray-500">Seleziona una sala</p></div>
                )}
            </main>

            {/* BOTTONI FLOTTANTI */}
            <div className="absolute bottom-6 right-6 flex flex-col gap-4 z-40">
                {isModified && <button onClick={handleSaveLayout} className="btn-primary p-4 rounded-full shadow-lg"><CheckIcon className="w-7 h-7"/></button>}
                <button onClick={() => setIsAddModalOpen(true)} className="bg-primary text-white p-4 rounded-full shadow-lg"><PlusIcon className="w-7 h-7" /></button>
            </div>

            {/* MODALI E POPUP */}
            {isAddModalOpen && <AddTableModal rooms={rooms} onClose={() => setIsAddModalOpen(false)} onAdd={onAdd} />}
            {isEditModalOpen && selectedTable && <EditTableModal table={selectedTable} onClose={() => setIsEditModalOpen(false)} onSave={handleEdit} onDelete={() => setIsDeletePopupOpen(true)} />}
            {isDeletePopupOpen && selectedTable && <DeletePopup itemName={selectedTable.name} onConfirm={handleConfirmDelete} onCancel={() => setIsDeletePopupOpen(false)}/>}
            {isForceDeletePopupOpen && selectedTable && <DeletePopup itemName={"free_table"} onConfirm={handleForceConfirmDelete} onCancel={() => setIsForceDeletePopupOpen(false)}/>}
            {isBusyModalOpen && selectedTable && <FreeBusyTableModal table={selectedTable} onClose={() => {setIsBusyModalOpen(false); setSelectedTable(null)}} onSave={setBusy} />}
            {showBusyMessage && selectedTable && <FreeBusyTableModal table={selectedTable} onClose={() => {setShowBusyMessage(false); setSelectedTable(null)}} onSave={forceFreeTable} />}
            {loading && <CustomLoading isFullPage={true} isTransparent={true} />}

            {/* Qui puoi mettere il modale dei dettagli del tavolo (quello con gli ordini) */}
            {isDetailModalOpen && selectedTable && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setIsDetailModalOpen(false)}>
                    <div className="bg-white p-6 rounded-lg" onClick={e => e.stopPropagation()}>
                        Dettagli per {selectedTable.name}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TablesPageTest;

export interface Table {
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
    busy: boolean
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
