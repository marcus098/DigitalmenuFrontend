import React, { useState } from "react";
import QRCode from "react-qr-code";

interface Waiter {
    id: string;
    name: string;
}

const WaitersPage: React.FC = () => {
    const [waiters, setWaiters] = useState<Waiter[]>([
        { id: "1", name: "Giovanni Rossi" },
        { id: "2", name: "Maria Verdi" },
    ]);

    const [newWaiterLink, setNewWaiterLink] = useState<string | null>(null);

    const handleAddWaiter = () => {
        const generatedLink = `https://your-restaurant.com/register?code=${Math.random()
            .toString(36)
            .substr(2, 8)}`;
        setNewWaiterLink(generatedLink);
    };

    const handleRemoveWaiter = (id: string) => {
        setWaiters((prevWaiters) => prevWaiters.filter((waiter) => waiter.id !== id));
    };

    const handleUpdateWaiter = (id: string, newName: string) => {
        setWaiters((prevWaiters) =>
            prevWaiters.map((waiter) =>
                waiter.id === id ? { ...waiter, name: newName } : waiter
            )
        );
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">Gestione Camerieri</h1>

            {/* Lista dei camerieri */}
            <div className="mb-8">
                <h2 className="text-lg font-bold mb-4">Camerieri Registrati</h2>
                <ul className="space-y-4">
                    {waiters.map((waiter) => (
                        <li
                            key={waiter.id}
                            className="flex justify-between items-center border p-4 rounded-lg shadow-sm"
                        >
                            <div>
                                <strong>{waiter.name}</strong>
                            </div>
                            <div className="flex gap-2">
                                {/* Modifica */}
                                <button
                                    className="bg-blue-500 text-white px-3 py-1 rounded-lg"
                                    onClick={() => {
                                        const newName = prompt(
                                            "Inserisci il nuovo nome del cameriere:",
                                            waiter.name
                                        );
                                        if (newName) {
                                            handleUpdateWaiter(waiter.id, newName);
                                        }
                                    }}
                                >
                                    Modifica
                                </button>
                                {/* Elimina */}
                                <button
                                    className="bg-red-500 text-white px-3 py-1 rounded-lg"
                                    onClick={() => handleRemoveWaiter(waiter.id)}
                                >
                                    Elimina
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Aggiungi cameriere */}
            <div>
                <h2 className="text-lg font-bold mb-4">Aggiungi Cameriere</h2>
                <button
                    onClick={handleAddWaiter}
                    className="bg-green-500 text-white px-4 py-2 rounded-lg"
                >
                    Genera Link/QRCode
                </button>

                {/* Mostra il QR Code o link */}
                {newWaiterLink && (
                    <div className="mt-6 p-4 border rounded-lg bg-gray-100 flex flex-col items-center">
                        <p className="mb-4 text-gray-700">
                            Condividi il seguente link o QR Code con il cameriere per registrarsi:
                        </p>
                        <a
                            href={newWaiterLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 underline"
                        >
                            {newWaiterLink}
                        </a>
                        <div className="mt-4">
                            <QRCode value={newWaiterLink} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default WaitersPage;
