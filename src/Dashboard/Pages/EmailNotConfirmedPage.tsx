import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { resendConfirmationLinkApi } from '../../Utilities/api'; // Dovrai creare questa API
import { useNotification } from '../../Context/NotificationContext';

const EmailNotConfirmedPage: React.FC = () => {
    const { id, code } = useParams<{ id: string; code: string }>(); // Cattura id e code dalla URL
    const [loading, setLoading] = useState<boolean>(false);
    const [message, setMessage] = useState<string>('');
    const [messageType, setMessageType] = useState<'success' | 'error' | ''>('');
    const { addNotification } = useNotification();

    // Effettua un controllo iniziale o pre-popola, se necessario, usando id/code
    useEffect(() => {
        if (!id || !code) {
            setMessage('Link non valido o incompleto. Torna alla pagina di login.');
            setMessageType('error');
        }
    }, [id, code]);

    const handleResend = async () => {
        if (!id || !code) {
            addNotification({ message: 'Impossibile inviare il link. ID o Codice mancanti.', type: 'error' });
            return;
        }

        setLoading(true);
        setMessage('');
        setMessageType('');

        try {
            // Chiamata API per rinviare il link di conferma, usando id e code
            const response = await resendConfirmationLinkApi(Number(id), code);

            if (response.success && response.status === 200) {
                setMessage('Un nuovo link di conferma è stato inviato alla tua email. Controlla anche la cartella spam!');
                setMessageType('success');
                addNotification({ message: 'Nuovo link inviato!', type: 'success' });
            } else {
                setMessage(response.message || 'Errore durante l\'invio del nuovo link di conferma.');
                setMessageType('error');
                addNotification({ message: response.message || 'Errore durante l\'invio.', type: 'error' });
            }
        } catch (error) {
            console.error('Errore nell\'invio del nuovo link di conferma:', error);
            setMessage('Si è verificato un errore inaspettato durante l\'invio del link.');
            setMessageType('error');
            addNotification({ message: 'Si è verificato un errore inaspettato.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-400 via-red-300 to-yellow-400">
            <div className="w-full max-w-lg bg-white p-8 rounded-2xl shadow-2xl text-center">
                <h2 className="text-3xl font-extrabold text-red-600 mb-4">
                    La tua Email Non È Stata Confermato
                </h2>
                <p className="text-gray-700 text-lg mb-4">
                    Per favore, controlla la tua casella di posta (e anche la cartella **spam** o **posta indesiderata**) per il link di conferma.
                </p>

                {message && (
                    <div className={`mb-4 p-3 rounded-lg ${messageType === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {message}
                    </div>
                )}

                <p className="text-gray-700 text-lg mb-6">
                    Non hai ricevuto il link o è scaduto? Clicca il pulsante qui sotto per riceverne uno nuovo.
                </p>

                <button
                    onClick={handleResend}
                    disabled={loading || !id || !code}
                    className="w-full bg-orange-500 text-white py-3 px-4 rounded-lg shadow-lg hover:bg-orange-600 focus:outline-none focus:ring-4 focus:ring-orange-400 focus:ring-offset-2 transition-transform transform hover:scale-105 duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Invio in corso...' : 'Invia un Nuovo Link di Conferma'}
                </button>

                <p className="mt-6 text-sm text-center text-gray-600">
                    Se credi di aver già confermato, prova ad{' '}
                    <Link to="/login" className="text-orange-500 font-semibold hover:underline">
                        accedere
                    </Link>.
                </p>
            </div>
        </div>
    );
};

export default EmailNotConfirmedPage;