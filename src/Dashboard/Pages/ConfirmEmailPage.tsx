import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useNotification } from '../../Context/NotificationContext';
import {confirmEmailApi} from "../../Utilities/api";
import {deleteCookie} from "../../Utilities/Utilities";

const ConfirmEmailPage: React.FC = () => {
    const [confirmationStatus, setConfirmationStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const { addNotification } = useNotification(); // Per mostrare notifiche (opzionale)
    const { code } = useParams()

    useEffect(() => {
        deleteCookie('token')
        deleteCookie('key')
    }, [])

    useEffect(() => {
        const confirmEmail = async () => {
            if (!code) {
                setConfirmationStatus('error');
                addNotification({ message: 'Token di conferma mancante.', type: 'error' });
                return;
            }

            try {
                const response = await confirmEmailApi(code);

                if (response.success) {
                    setConfirmationStatus('success');
                    addNotification({ message: 'Email confermata con successo!', type: 'success' });
                } else {
                    setConfirmationStatus('error');
                    addNotification({ message: response.message || 'Errore durante la conferma dell\'email.', type: 'error' });
                }
            } catch (error) {
                console.error('Errore nella conferma email:', error);
                setConfirmationStatus('error');
                addNotification({ message: 'Si è verificato un errore inaspettato.', type: 'error' });
            }
        };

        confirmEmail();
    }, [code]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-400 via-red-300 to-yellow-400">
            <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-2xl text-center">
                {confirmationStatus === 'loading' && (
                    <>
                        <h2 className="text-3xl font-extrabold text-gray-800 mb-4">Conferma Email...</h2>
                        <p className="text-gray-700 text-lg">Stiamo verificando la tua email. Attendi prego...</p>
                    </>
                )}

                {confirmationStatus === 'success' && (
                    <>
                        <h2 className="text-3xl font-extrabold text-green-600 mb-4">Email Confermata!</h2>
                        <p className="text-gray-700 text-lg mb-6">
                            La tua email è stata confermata con successo. Ora puoi accedere
                        </p>
                        <Link
                            to="/login"
                            className="w-full inline-block bg-orange-500 text-white py-3 px-4 rounded-lg shadow-lg hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-400 focus:ring-offset-2 transition-transform transform hover:scale-105 duration-300"
                        >
                            Vai al Login
                        </Link>
                    </>
                )}

                {confirmationStatus === 'error' && (
                    <>
                        <h2 className="text-3xl font-extrabold text-red-600 mb-4">Errore nella Conferma!</h2>
                        <p className="text-gray-700 text-lg mb-6">
                            Non è stato possibile confermare la tua email. Il link potrebbe essere scaduto o non valido
                        </p>
                        <Link
                            to="/login"
                            className="w-full inline-block bg-gray-500 text-white py-3 px-4 rounded-lg shadow-lg hover:bg-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-400 focus:ring-offset-2 transition-transform transform hover:scale-105 duration-300"
                        >
                            Torna al Login
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
};

export default ConfirmEmailPage;