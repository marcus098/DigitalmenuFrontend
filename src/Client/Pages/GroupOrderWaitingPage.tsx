import React, { useState, useEffect } from 'react';
import { ProductCard } from '../../types';
import { useData } from '../../Context/DataContext';
import { useParams, useNavigate } from 'react-router-dom';
import { UserGroupIcon, ClockIcon, PaperAirplaneIcon, CheckCircleIcon, UserIcon } from '@heroicons/react/24/solid';
import ClientHeader from '../../Components/ClientHeader';

// --- TIPI E DATI MOCKUP PER LA SIMULAZIONE ---

interface Participant {
    id: string;
    name: string; // Es. "Ospite 1", in un sistema reale potrebbe essere il nome utente
    status: 'ordering' | 'submitted';
    cart: ProductCard[];
}

interface TableSession {
    tableId: string;
    tableName: string;
    totalSeats: number;
    participants: Participant[];
}

// SIMULIAMO UN "DATABASE" CONDIVISO IN MEMORIA
// In un'app reale, questi dati sarebbero su un server (es. Firebase, o gestiti con WebSockets).
let mockTableSessionDB: TableSession = {
    tableId: 'T08',
    tableName: 'Tavolo 8',
    totalSeats: 4,
    participants: [
        { id: 'user_1', name: 'Tu', status: 'submitted', cart: [
                { id: 1, quantity: 1, optionName: 'default', price: 8.50, note: 'Ben cotta', ingredientsPlus: [], ingredientsMinus: [2] }
            ]},
        { id: 'user_2', name: 'Ospite 2', status: 'ordering', cart: [] },
        { id: 'user_3', name: 'Ospite 3', status: 'ordering', cart: [] },
        { id: 'user_4', name: 'Ospite 4', status: 'submitted', cart: [
                { id: 3, quantity: 2, optionName: 'Maxi', price: 12.00, note: '', ingredientsPlus: [5], ingredientsMinus: [] },
                { id: 5, quantity: 1, optionName: 'default', price: 2.50, note: '', ingredientsPlus: [], ingredientsMinus: [] }
            ]},
    ]
};

// --- FINE SEZIONE MOCKUP ---


// --- COMPONENTI INTERNI ---

// Card per un singolo partecipante
const ParticipantCard: React.FC<{ participant: Participant }> = ({ participant }) => {
    const { productsMap } = useData();
    const hasSubmitted = participant.status === 'submitted';

    return (
        <div className={`p-4 rounded-xl border-2 transition-all duration-300 ${hasSubmitted ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${hasSubmitted ? 'bg-green-200' : 'bg-gray-200'}`}>
                    <UserIcon className={`w-6 h-6 ${hasSubmitted ? 'text-green-700' : 'text-gray-500'}`} />
                </div>
                <div>
                    <p className="font-bold text-gray-800">{participant.name}</p>
                    <div className="flex items-center gap-1 text-sm">
                        {hasSubmitted ? (
                            <>
                                <CheckCircleIcon className="w-4 h-4 text-green-600"/>
                                <span className="font-semibold text-green-700">Ordine inviato</span>
                            </>
                        ) : (
                            <>
                                <ClockIcon className="w-4 h-4 text-gray-500"/>
                                <span className="text-gray-600">Sta scegliendo...</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
            {hasSubmitted && participant.cart.length > 0 && (
                <div className="mt-3 pl-4 border-l-2 border-green-200 space-y-1">
                    {participant.cart.map((item, index) => (
                        <p key={index} className="text-sm text-gray-700">
                            <span className="font-semibold">{item.quantity}x</span> {productsMap.get(item.id)?.name || 'Prodotto non trovato'}
                        </p>
                    ))}
                </div>
            )}
        </div>
    );
};


// --- PAGINA PRINCIPALE ---

const GroupOrderWaitingPage: React.FC = () => {
    const [session, setSession] = useState<TableSession | null>(null);
    const navigate = useNavigate();
    // const { tableId } = useParams(); // In un'app reale, prenderesti l'ID del tavolo dall'URL

    // Simula l'aggiornamento in tempo reale
    useEffect(() => {
        // Carica i dati la prima volta
        setSession(mockTableSessionDB);

        // Ogni 3 secondi, simula l'arrivo di un nuovo ordine da un altro utente
        const interval = setInterval(() => {
            const userOrdering = mockTableSessionDB.participants.find(p => p.status === 'ordering');
            if (userOrdering) {
                // Simula che questo utente abbia inviato un ordine
                userOrdering.status = 'submitted';
                userOrdering.cart = [{ id: 4, quantity: 1, optionName: 'default', price: 5.00, note: '', ingredientsPlus: [], ingredientsMinus: [] }];

                // Aggiorna lo stato per riflettere il cambiamento
                setSession({ ...mockTableSessionDB });
            }
        }, 5000); // Aumentato a 5 secondi per non essere troppo fastidioso

        // Pulisci l'intervallo quando il componente viene smontato
        return () => clearInterval(interval);
    }, []);

    const handleSubmitCombinedOrder = () => {
        // Qui andrà la logica per inviare l'ordine combinato al backend
        console.log("INVIO COMANDA UNICA ALLA CUCINA:", session?.participants.filter(p => p.status === 'submitted'));
        alert("Comanda inviata con successo!");
        // Dopo l'invio, potresti reindirizzare a una pagina di riepilogo o di pagamento
        navigate('/'); // Torna alla home per esempio
    };

    if (!session) {
        return <div>Caricamento sessione tavolo...</div>;
    }

    const submittedParticipants = session.participants.filter(p => p.status === 'submitted');
    const orderingParticipants = session.participants.filter(p => p.status === 'ordering');

    return (
        <div className="bg-slate-100 min-h-screen">
            <ClientHeader localname="Riepilogo Ordine Tavolo" />

            <main className="container mx-auto max-w-4xl p-4 md:p-6">
                {/* Box Informazioni Tavolo */}
                <div className="bg-white p-6 rounded-2xl shadow-lg mb-8 text-center">
                    <h2 className="text-3xl font-bold text-primary">{session.tableName}</h2>
                    <div className="flex items-center justify-center gap-2 mt-1 text-gray-600">
                        <UserGroupIcon className="w-6 h-6"/>
                        <span className="text-lg font-semibold">{session.totalSeats} Posti</span>
                    </div>
                </div>

                {/* Layout a due colonne per le liste */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Colonna: Hanno Ordinato */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-gray-800 border-b-2 pb-2">Hanno già inviato l'ordine ({submittedParticipants.length})</h3>
                        {submittedParticipants.length > 0 ? (
                            submittedParticipants.map(p => <ParticipantCard key={p.id} participant={p} />)
                        ) : (
                            <p className="text-gray-500 pt-4">Nessuno ha ancora inviato il proprio ordine.</p>
                        )}
                    </div>

                    {/* Colonna: Stanno Scegliendo */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-gray-800 border-b-2 pb-2">Stanno ancora scegliendo ({orderingParticipants.length})</h3>
                        {orderingParticipants.length > 0 ? (
                            orderingParticipants.map(p => <ParticipantCard key={p.id} participant={p} />)
                        ) : (
                            <div className="text-center bg-green-50 p-8 rounded-xl border-2 border-dashed border-green-300">
                                <p className="font-bold text-lg text-green-700">Fantastico! Tutti hanno inviato il loro ordine.</p>
                                <p className="text-green-600">Puoi inviare la comanda unica alla cucina.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pulsante Azione Finale */}
                <div className="mt-12 pt-6 border-t-2 border-gray-200 text-center">
                    <p className="text-gray-600 mb-4">Quando tutti sono pronti, invia l'ordine completo alla cucina.</p>
                    <button
                        onClick={handleSubmitCombinedOrder}
                        className="btn-primary w-full md:w-auto text-lg flex items-center justify-center gap-3 mx-auto"
                    >
                        <PaperAirplaneIcon className="w-6 h-6"/>
                        Invia Comanda Unica
                    </button>
                    <p className="text-xs text-gray-500 mt-2">Nota: Puoi inviare la comanda anche se qualcuno sta ancora scegliendo.</p>
                </div>

            </main>
        </div>
    );
};

export default GroupOrderWaitingPage;