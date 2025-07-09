// src/components/WaiterAccountPendingAdminApproval.tsx (Nuovo Nome)
import React from 'react';
import { Link } from 'react-router-dom';

const WaiterAccountPendingAdminApproval: React.FC = () => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-400 via-red-300 to-yellow-400">
            <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-2xl text-center">
                <h2 className="text-3xl font-extrabold text-gray-800 mb-4">
                    Registrazione Inviata!
                </h2>
                <p className="text-gray-700 text-lg mb-4">
                    La tua richiesta di registrazione è stata inviata al proprietario del locale.
                </p>
                <p className="text-gray-700 text-lg mb-6">
                    Riceverai una notifica via email non appena la tua richiesta sarà stata esaminata e approvata
                </p>
                <Link
                    to="/login" // O a una pagina informativa generale
                    className="w-full inline-block bg-orange-500 text-white py-3 px-4 rounded-lg shadow-lg hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-400 focus:ring-offset-2 transition-transform transform hover:scale-105 duration-300"
                >
                    Torna alla Pagina Iniziale
                </Link>
            </div>
        </div>
    );
};

export default WaiterAccountPendingAdminApproval;