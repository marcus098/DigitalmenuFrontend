// src/pages/client/OrderHistoryPage.tsx

import React, { useState, useEffect } from 'react';
import { ProductCard, ProductDto } from '../../types';
import { useData } from '../../Context/DataContext';
import { useParams, useNavigate } from 'react-router-dom';
import { ClockIcon, UserIcon, ArrowLeftIcon } from '@heroicons/react/24/solid';
import ClientHeader from '../../Components/ClientHeader';

// --- TIPI E DATI MOCKUP PER LA SIMULAZIONE ---

// Oggetto che rappresenta un singolo articolo ordinato da un utente
interface OrderItem {
    ownerId: string; // ID dell'ospite che ha ordinato questo articolo
    ownerName: string; // Es. "Tu" o "Ospite 2"
    productCard: ProductCard;
}

// Oggetto che rappresenta una "comanda" inviata alla cucina in un dato momento
interface Comanda {
    id: string;
    timestamp: Date;
    tableId: string;
    items: OrderItem[];
}

// SIMULIAMO UN DATABASE CON LA CRONOLOGIA DEGLI ORDINI PER IL TAVOLO T08
const mockOrderHistoryDB: Comanda[] = [
    {
        id: 'CMD-002',
        timestamp: new Date(new Date().setMinutes(new Date().getMinutes() - 15)), // 15 minuti fa
        tableId: 'T08',
        items: [
            { ownerId: 'guest-xyz-789', ownerName: 'Ospite 2', productCard: { id: 4, quantity: 2, optionName: 'default', price: 5.00, note: 'Senza ghiaccio', ingredientsPlus: [], ingredientsMinus: [] }},
            { ownerId: 'my-session-id-123', ownerName: 'Tu', productCard: { id: 6, quantity: 1, optionName: 'default', price: 3.00, note: '', ingredientsPlus: [], ingredientsMinus: [] }},
        ]
    },
    {
        id: 'CMD-001',
        timestamp: new Date(new Date().setMinutes(new Date().getMinutes() - 45)), // 45 minuti fa
        tableId: 'T08',
        items: [
            { ownerId: 'my-session-id-123', ownerName: 'Tu', productCard: { id: 1, quantity: 1, optionName: 'default', price: 8.50, note: 'Ben cotta', ingredientsPlus: [], ingredientsMinus: [2] }},
            { ownerId: 'guest-abc-456', ownerName: 'Ospite 3', productCard: { id: 1, quantity: 1, optionName: 'default', price: 8.50, note: '', ingredientsPlus: [], ingredientsMinus: [] }},
            { ownerId: 'guest-xyz-789', ownerName: 'Ospite 2', productCard: { id: 5, quantity: 1, optionName: 'default', price: 2.50, note: '', ingredientsPlus: [], ingredientsMinus: [] }},
        ]
    }
];

// Funzione che simula il recupero della cronologia per un tavolo
const fetchOrderHistory = (tableId: string): Promise<Comanda[]> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve(mockOrderHistoryDB.filter(c => c.tableId === tableId));
        }, 500);
    });
};

// Funzione per ottenere o creare l'ID ospite
const getMyGuestId = (): string => {
    let guestId = localStorage.getItem('guestId');
    if (!guestId) {
        guestId = `my-session-id-123`; // In questo mockup, siamo sempre lo stesso utente per coerenza
        localStorage.setItem('guestId', guestId);
    }
    return guestId;
};

// --- FINE SEZIONE MOCKUP ---


// --- COMPONENTI INTERNI ---

const OrderItemRow: React.FC<{ item: OrderItem, isMine: boolean }> = ({ item, isMine }) => {
    const { productsMap, ingredientsMap } = useData();
    const product = productsMap.get(item.productCard.id);
    if (!product) return null;

    return (
        <div className={`p-3 rounded-lg flex gap-3 ${isMine ? 'bg-primary/10' : 'bg-slate-50'}`}>
            <img src={product.image ? process.env.REACT_APP_BUCKET_URL + product.image : '/placeholder.png'} alt={product.name} className="w-16 h-16 object-cover rounded-md flex-shrink-0"/>
            <div className="flex-grow">
                <div className="flex justify-between items-start">
                    <p className="font-bold text-gray-800">
                        <span className="font-semibold">{item.productCard.quantity}x</span> {product.name}
                    </p>
                    <p className="font-bold text-gray-800">€{(item.productCard.price * item.productCard.quantity).toFixed(2)}</p>
                </div>
                {/* Visualizzazione personalizzazioni */}
                <div className="text-xs text-gray-600 mt-1 space-y-0.5">
                    {item.productCard.optionName !== "default" && <p>Opzione: <span className="font-semibold">{item.productCard.optionName}</span></p>}
                    {item.productCard.ingredientsPlus.length > 0 && <p className="text-green-600">+ {item.productCard.ingredientsPlus.map(id => ingredientsMap.get(id)?.name).join(", ")}</p>}
                    {item.productCard.ingredientsMinus.length > 0 && <p className="text-red-600">- {item.productCard.ingredientsMinus.map(id => ingredientsMap.get(id)?.name).join(", ")}</p>}
                    {item.productCard.note && <p className="italic">Nota: "{item.productCard.note}"</p>}
                </div>
            </div>
        </div>
    );
};

const ComandaCard: React.FC<{ comanda: Comanda, myGuestId: string }> = ({ comanda, myGuestId }) => {
    const total = comanda.items.reduce((acc, item) => acc + (item.productCard.price * item.productCard.quantity), 0);

    return (
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg">
            <div className="flex justify-between items-center border-b pb-3 mb-3">
                <div className="flex items-center gap-2 text-gray-500">
                    <ClockIcon className="w-5 h-5"/>
                    <span className="font-semibold">Ordine delle {comanda.timestamp.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="text-lg font-bold text-gray-800">Totale: €{total.toFixed(2)}</div>
            </div>
            <div className="space-y-3">
                {comanda.items.map((item, index) => (
                    <OrderItemRow key={index} item={item} isMine={item.ownerId === myGuestId} />
                ))}
            </div>
        </div>
    );
};


// --- PAGINA PRINCIPALE ---
const HistoryOrdersPage: React.FC = () => {
    const [comande, setComande] = useState<Comanda[]>([]);
    const [myGuestId, setMyGuestId] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    // const { tableId } = useParams(); // Da usare in un'app reale
    const navigate = useNavigate();

    useEffect(() => {
        const guestId = getMyGuestId();
        setMyGuestId(guestId);

        // Simuliamo il fetch per un tavolo fisso, es. 'T08'
        fetchOrderHistory('T08').then(data => {
            setComande(data);
            setIsLoading(false);
        });
    }, []);

    return (
        <div className="bg-slate-100 min-h-screen">
            <ClientHeader localname="Cronologia Ordini" />

            <main className="container mx-auto max-w-3xl p-4 md:p-6">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-primary font-semibold transition-colors mb-6">
                    <ArrowLeftIcon className="w-5 h-5" />
                    <span>Indietro</span>
                </button>

                {isLoading ? (
                    <p>Caricamento cronologia...</p>
                ) : comande.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
                        <p className="font-semibold text-xl text-gray-600">Nessun ordine trovato</p>
                        <p className="text-gray-500 mt-2">Non sono ancora state inviate comande per questo tavolo.</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {comande.map(comanda => (
                            <ComandaCard key={comanda.id} comanda={comanda} myGuestId={myGuestId} />
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

export default HistoryOrdersPage;