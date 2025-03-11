import React, { useState } from "react";
import QRCode from "react-qr-code"; // Installare con: npm install react-qr-code

const initialTables = [
    { id: 1, name: "Tavolo 1", status: "Libero", total: 0, people: 0, coverCharge: 0, orders: [], code: "" },
    { id: 2, name: "Tavolo 2", status: "Libero", total: 0, people: 0, coverCharge: 0, orders: [], code: "" },
];

const TablesPage: React.FC = () => {
    const [tables, setTables] = useState(initialTables);
    const [selectedTable, setSelectedTable] = useState<any>(null); // Per modifiche dettagliate
    const [showQR, setShowQR] = useState<string | null>(null); // Per visualizzare il QR Code

    // Funzione per occupare un tavolo
    const handleOccupyTable = (id: number) => {
        const updatedTables = tables.map((table) =>
            table.id === id
                ? {
                    ...table,
                    status: "Occupato",
                    people: 1,
                    coverCharge: 2, // Default
                    code: `TAV-${id}-${Date.now()}`,
                }
                : table
        );
        setTables(updatedTables);
    };

    // Funzione per liberare un tavolo
    const handleFreeTable = (id: number) => {
        const updatedTables = tables.map((table) =>
            table.id === id
                ? { ...table, status: "Libero", total: 0, people: 0, orders: [], code: "" }
                : table
        );
        setTables(updatedTables);
    };

    // Funzione per aggiornare un tavolo
    const handleUpdateTable = () => {
        if (!selectedTable) return;
        const updatedTables = tables.map((table) =>
            table.id === selectedTable.id ? selectedTable : table
        );
        setTables(updatedTables);
        setSelectedTable(null);
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">Gestione Tavoli</h1>

            {/* Elenco Tavoli */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tables.map((table) => (
                    <div
                        key={table.id}
                        className={`p-4 rounded-lg shadow-md ${
                            table.status === "Libero" ? "bg-green-100" : "bg-red-100"
                        }`}
                    >
                        <h2 className="text-lg font-bold">{table.name}</h2>
                        <p className="text-sm">Stato: {table.status}</p>
                        {table.status === "Occupato" && (
                            <>
                                <p className="text-sm">Totale: €{table.total.toFixed(2)}</p>
                                <p className="text-sm">Persone: {table.people}</p>
                                <button
                                    onClick={() => setShowQR(table.code)}
                                    className="text-blue-500 underline text-sm"
                                >
                                    Mostra QR
                                </button>
                            </>
                        )}
                        <div className="mt-4 space-x-2">
                            {table.status === "Libero" ? (
                                <button
                                    onClick={() => handleOccupyTable(table.id)}
                                    className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                                >
                                    Occupa
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setSelectedTable(table)}
                                        className="px-4 py-2 bg-orange-500 text-white rounded-lg"
                                    >
                                        Modifica
                                    </button>
                                    <button
                                        onClick={() => handleFreeTable(table.id)}
                                        className="px-4 py-2 bg-gray-500 text-white rounded-lg"
                                    >
                                        Libera
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modifica Tavolo */}
            {selectedTable && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                        <h3 className="text-xl font-bold mb-4">Modifica {selectedTable.name}</h3>
                        <input
                            type="number"
                            value={selectedTable.people}
                            onChange={(e) =>
                                setSelectedTable({ ...selectedTable, people: parseInt(e.target.value) || 0 })
                            }
                            className="w-full px-4 py-2 border rounded-lg mb-4"
                            placeholder="Numero di persone"
                        />
                        <input
                            type="number"
                            value={selectedTable.coverCharge}
                            onChange={(e) =>
                                setSelectedTable({ ...selectedTable, coverCharge: parseFloat(e.target.value) || 0 })
                            }
                            className="w-full px-4 py-2 border rounded-lg mb-4"
                            placeholder="Costo coperto (€)"
                        />
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setSelectedTable(null)}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg"
                            >
                                Annulla
                            </button>
                            <button
                                onClick={handleUpdateTable}
                                className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                            >
                                Salva
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* QR Code Popup */}
            {showQR && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96">
                        <h3 className="text-xl font-bold mb-4">QR Code</h3>
                        <div className="flex justify-center mb-4">
                            <QRCode value={showQR} size={200} />
                        </div>
                        <button
                            onClick={() => setShowQR(null)}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                        >
                            Chiudi
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TablesPage;
