import React, { useState } from "react";
import GridLayout, { Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

interface Table {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    name: string;
    status: string;
}

interface Room {
    id: number;
    name: string;
    tables: Table[];
}

const initialRooms: Room[] = [
    {
        id: 1,
        name: "Sala Principale",
        tables: [
            { id: "1", x: 0, y: 0, w: 2, h: 2, name: "Tavolo 1", status: "Libero" },
            { id: "2", x: 2, y: 0, w: 2, h: 2, name: "Tavolo 2", status: "Occupato" },
        ],
    },
    {
        id: 2,
        name: "Sala 2",
        tables: [
            { id: "3", x: 0, y: 0, w: 3, h: 2, name: "Tavolo 3", status: "Libero" },
        ],
    },
];

const TablesPageTest: React.FC = () => {
    const [rooms, setRooms] = useState<Room[]>(initialRooms);
    const [selectedRoom, setSelectedRoom] = useState<number>(rooms[0].id);
    const [selectedTable, setSelectedTable] = useState<Table | null>(null);

    const handleRoomChange = (roomId: number) => setSelectedRoom(roomId);

    const handleLayoutChange = (layout: Layout[]) => {
        const updatedRooms = rooms.map((room) => {
            if (room.id === selectedRoom) {
                const updatedTables = layout.map((item) => {
                    const table = room.tables.find((table) => table.id === item.i);
                    if (table) {
                        return {
                            ...table,
                            x: item.x,
                            y: item.y,
                            w: item.w,
                            h: item.h,
                        };
                    }
                    return null;
                }).filter((table): table is Table => table !== null);

                return {
                    ...room,
                    tables: updatedTables,
                };
            }
            return room;
        });
        setRooms(updatedRooms);
    };

    const handleAddTable = () => {
        const updatedRooms = rooms.map((room) =>
            room.id === selectedRoom
                ? {
                    ...room,
                    tables: [
                        ...room.tables,
                        {
                            id: `${Date.now()}`,
                            x: 0,
                            y: 0,
                            w: 2,
                            h: 2,
                            name: `Tavolo ${room.tables.length + 1}`,
                            status: "Libero",
                        },
                    ],
                }
                : room
        );
        setRooms(updatedRooms);
    };

    const handleRemoveTable = (tableId: string) => {
        const updatedRooms = rooms.map((room) =>
            room.id === selectedRoom
                ? {
                    ...room,
                    tables: room.tables.filter((table) => table.id !== tableId),
                }
                : room
        );
        setRooms(updatedRooms);
        setSelectedTable(null);
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">Gestione Tavoli - Test</h1>

            {/* Selettore Stanze */}
            <div className="flex space-x-4 mb-6">
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

            {/* Mappa Tavoli */}
            <div className="border rounded-lg bg-gray-100 p-4 relative">
                <button
                    onClick={handleAddTable}
                    className="absolute top-2 right-2 bg-green-500 text-white px-4 py-2 rounded-lg"
                >
                    Aggiungi Tavolo
                </button>

                <GridLayout
                    className="layout"
                    layout={rooms.find((room) => room.id === selectedRoom)?.tables.map((table) => ({
                        i: table.id,
                        x: table.x,
                        y: table.y,
                        w: table.w,
                        h: table.h,
                    }))}
                    cols={12}
                    rowHeight={50}
                    width={1000}
                    onLayoutChange={handleLayoutChange}
                    isResizable
                    isDraggable
                >
                    {rooms
                        .find((room) => room.id === selectedRoom)
                        ?.tables.map((table) => (
                            <div
                                key={table.id}
                                className={`rounded-lg shadow-md flex items-center justify-between p-2 ${
                                    table.status === "Libero" ? "bg-green-200" : "bg-red-200"
                                }`}
                            >
                                <span>{table.name}</span>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => setSelectedTable(table)}
                                        className="text-blue-500 hover:text-blue-700"
                                        title="Visualizza Tavolo"
                                    >
                                        👁️
                                    </button>
                                    <button
                                        onClick={() => handleRemoveTable(table.id)}
                                        className="text-red-500 hover:text-red-700"
                                        title="Elimina Tavolo"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                </GridLayout>
            </div>

            {/* Dettagli Tavolo */}
            {selectedTable && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                        <h2 className="text-xl font-bold mb-4">{selectedTable.name}</h2>
                        <p className="mb-4">Stato: {selectedTable.status}</p>
                        <div className="flex justify-between items-center mb-4">
                            <button
                                onClick={() => handleRemoveTable(selectedTable.id)}
                                className="bg-red-500 text-white px-4 py-2 rounded-lg"
                            >
                                Elimina Tavolo
                            </button>
                            <button
                                onClick={() => setSelectedTable(null)}
                                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg"
                            >
                                Chiudi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TablesPageTest;
