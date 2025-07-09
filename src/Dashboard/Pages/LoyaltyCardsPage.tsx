import React, {useState, useMemo, useEffect} from 'react';
import {CardDto, AddCard} from '../../types';
import QRCode from 'react-qr-code';
import { PlusIcon, MagnifyingGlassIcon, StarIcon, CheckBadgeIcon, QrCodeIcon, EnvelopeIcon, PrinterIcon, LinkIcon } from '@heroicons/react/24/outline';
import { XMarkIcon } from '@heroicons/react/24/solid';
import {AddCardModal} from "../../Components/Dashboard/AddCardModal";
import LoyaltyCardItem from "../../Components/Dashboard/LoyaltyCardItem";
import {
    addCardApi,
    addPointToCardApi,
    claimCardApi,
    deleteCardApi,
    getAllCardsApi,
    resetCardApi
} from "../../Utilities/api";
import {useNotification} from "../../Context/NotificationContext";
import CustomLoading from "../../Components/CustomLoading";
import html2canvas from "html2canvas";

const CardDetailModal: React.FC<{
    card: CardDto,
    onClose: () => void,
    onUpdate: (card: CardDto) => void,
    addPoint: (amount: number) => Promise<boolean>,
    deleteCard: () => Promise<void>
    claimCard: (quantity: number) => Promise<void>,
    resetCard: () => Promise<void>
}> = ({ card, onClose, onUpdate, addPoint, deleteCard, claimCard, resetCard }) => {
    // Logica interna per aggiungere punti/timbri
    const [pointsToAdd, setPointsToAdd] = useState('');
    const [price, setPrice] = useState('');
    const [amountToClaim, setAmountToClaim] = useState('');
    const { addNotification } = useNotification()

    const addStamp = async () => {
        if (card.actualValue < card.scope) {
            await addPoint(1)
        }
    };


    const addPoints = async (amount: number) => {
        const response = await addPoint(amount)
        if(response) {
            setPointsToAdd('');
            setPrice('');
        }
    }

    const addPointsAuto = (amount: number) => {
        setPointsToAdd(amount.toString())
    }

    const handleClaim = async () => {
        const quantity = Number(amountToClaim);
        if (quantity > 0 && quantity <= card.actualValue) {
            await claimCard(quantity);
            setAmountToClaim(''); // Pulisce il campo dopo il riscatto
        } else {
            // Puoi aggiungere un feedback di errore qui, se vuoi
            console.error("Quantità da riscattare non valida.");
        }
    };

    const handleCopyLink = async () => {
        const linkToCopy = `http://localhost:3000/cardStatus#${card.code}`;

        try {
            await navigator.clipboard.writeText(linkToCopy);
            // Se la copia va a buon fine, mostra la notifica di successo
            addNotification({ message: 'Link copiato negli appunti!', type: 'success' });
        } catch (err) {
            // Se c'è un errore, mostra una notifica di errore
            console.error('Errore durante la copia del link: ', err);
            addNotification({ message: 'Errore durante la copia del link.', type: 'error' });
        }
    };

    const isClaimDisabled = Number(amountToClaim) <= 0 || Number(amountToClaim) > card.actualValue;

    const handleDownload = () => {
        // 1. Trova l'elemento che contiene il QR code usando il suo ID.
        const qrCodeElement = document.getElementById('qr-code-container');

        if (qrCodeElement) {
            // 2. Usa html2canvas per creare un'immagine (restituisce una Promise).
            html2canvas(qrCodeElement).then(canvas => {
                // 3. Converti il canvas in un'immagine PNG in formato Data URL (base64).
                const imageUrl = canvas.toDataURL('image/png');

                // 4. Crea un link temporaneo per il download.
                const link = document.createElement('a');
                link.href = imageUrl;
                link.download = `qrcode-${card.code}.png`; // Nome del file che verrà scaricato

                // 5. Aggiungi il link al documento, cliccalo e rimuovilo.
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
        } else {
            console.error("Elemento QR code non trovato!");
        }
    };

    return (
        // CONTENITORE PRINCIPALE DEL MODALE
        // Aggiunto "overflow-y-auto" per permettere lo scroll solo al modale e non alla pagina.
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto" >

            {/* CARD DEL MODALE */}
            {/* Modifiche principali qui: */}
            {/* 1. Padding responsivo: p-4 su mobile, p-8 su desktop */}
            {/* 2. Altezza massima: max-h-full o max-h-[95vh] per non superare mai lo schermo */}
            {/* 3. Overflow interno: overflow-y-auto per far apparire la scrollbar DENTRO la card bianca */}
            <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-4xl my-auto
                            grid grid-cols-1 md:grid-cols-2 gap-y-8 md:gap-x-8 relative max-h-full overflow-y-auto">

                {/* Pulsante di chiusura spostato qui per un migliore controllo su tutti i dispositivi */}
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 z-10">
                    <XMarkIcon className="w-8 h-8"/>
                </button>

                {/* Colonna Sinistra: QR Code e Distribuzione */}
                <div className="text-center flex flex-col items-center mt-8 md:mt-0">
                    <h3 className="text-2xl font-bold text-gray-800">{card.code}</h3>
                    <p className="text-gray-500 mb-4">Mostra questo codice al cliente</p>
                    <div id="qr-code-container" className="bg-white p-4 sm:p-6 rounded-lg border-4 border-slate-100 inline-block">
                        <QRCode value={"http://localhost:3000/cardStatus#" + card.code} size={200} />
                    </div>
                    <div className="mt-6 w-full space-y-2">
                        <h4 className="font-semibold text-gray-700">Distribuisci al Cliente</h4>
                        <div className="flex items-center gap-2">
                            <input type="email" placeholder="Email cliente (opzionale)" className="input-style flex-grow"/>
                            <button className="btn-secondary p-2.5"><EnvelopeIcon className="w-5 h-5"/></button>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleDownload} className="btn-secondary w-full flex items-center justify-center"><PrinterIcon className="w-5 h-5 mr-2"/>Scarica</button>
                            <button onClick={handleCopyLink}
                                    className="btn-secondary w-full flex items-center justify-center">
                                <LinkIcon className="w-5 h-5 mr-2"/>Copia Link
                            </button>
                        </div>
                    </div>
                </div>

                {/* Colonna Destra: Gestione Punti/Timbri */}
                <div className="relative">
                    <h3 className="text-2xl font-bold text-gray-800">Gestisci Carta</h3>

                    {/* --- Sezione Timbri --- */}
                    {!card.typePoints ? (
                        <div className="mt-4 p-6 bg-slate-50 rounded-lg space-y-4">
                            <p className="text-lg font-bold">Progresso: {card.actualValue} / {card.scope}</p>
                            <button onClick={addStamp} className="btn-primary w-full"
                                    disabled={card.actualValue >= card.scope}>
                                Aggiungi un Timbro
                            </button>
                            <div className="w-full h-px bg-gray-200"></div>
                            <div>
                                <label className="label-style">Riscatta Timbri</label>
                                <div className="flex gap-2">
                                    <input type="number" placeholder="Quantità" value={amountToClaim}
                                           onChange={e => setAmountToClaim(e.target.value)}
                                           className="input-style flex-grow"/>
                                    <button onClick={handleClaim} className="btn-secondary"
                                            disabled={isClaimDisabled}>Riscatta
                                    </button>
                                </div>
                                {card.actualValue >= card.scope && (
                                    <p className="text-xs text-green-600 mt-1 font-semibold">Premio disponibile!
                                        ({card.scope} timbri)</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        /* --- Sezione Punti --- */
                        <div className="mt-4 p-6 bg-slate-50 rounded-lg space-y-4">
                            <p className="text-lg font-bold">Punti Attuali: {card.actualValue}</p>
                            <div>
                                <label className="label-style">Aggiungi Punti</label>
                                <div className="flex gap-2">
                                    <input type="number" placeholder="Quantità" value={pointsToAdd}
                                           onChange={e => setPointsToAdd(e.target.value)}
                                           className="input-style flex-grow"/>
                                    <button onClick={() => addPoints(Number(pointsToAdd))}
                                            className="btn-primary">Aggiungi
                                    </button>
                                </div>
                            </div>
                            <div>
                                <div className="flex gap-2">
                                    <input type="number" placeholder="Prezzo (€)" value={price}
                                           onChange={e => setPrice(e.target.value)} className="input-style flex-grow"/>
                                    <button
                                        onClick={() => addPointsAuto(Math.floor(Number(price) / card.priceForPoint))}
                                        className="btn-primary">Calcola
                                    </button>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">1 punto
                                    ogni {card.priceForPoint.toFixed(2)}€</p>
                            </div>
                            <div className="w-full h-px bg-gray-200"></div>
                            <div>
                                <label className="label-style">Utilizza Punti</label>
                                <div className="flex gap-2">
                                    <input type="number" placeholder="Quantità" value={amountToClaim}
                                           onChange={e => setAmountToClaim(e.target.value)}
                                           className="input-style flex-grow"/>
                                    <button onClick={() => setAmountToClaim(card.actualValue.toString())}
                                            className="btn-secondary-outline">Max
                                    </button>
                                    <button onClick={handleClaim} className="btn-secondary"
                                            disabled={isClaimDisabled}>Utilizza
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- Nuova Sezione: Altre Azioni --- */}
                    <div className="mt-6">
                        <h4 className="font-bold text-gray-700">Altre Azioni</h4>
                        <div className="mt-2 p-4 border border-gray-200 rounded-lg space-y-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-gray-800">Resetta Progresso</p>
                                    <p className="text-sm text-gray-500">Azzera i punti o i timbri accumulati.</p>
                                </div>
                                <button
                                    onClick={resetCard}
                                    className="bg-yellow-500 hover:bg-yellow-600 text-white font-semibold text-sm py-1.5 px-3 rounded-md transition-colors"
                                >
                                    Resetta
                                </button>
                            </div>
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-gray-800">Elimina Carta</p>
                                    <p className="text-sm text-gray-500">Rimuovi permanentemente la carta.</p>
                                </div>
                                <button
                                    onClick={deleteCard}
                                    className="bg-red-500 hover:bg-red-600 text-white font-semibold text-sm py-1.5 px-3 rounded-md transition-colors"
                                >
                                    Elimina
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
};


// --- Pagina Principale ---
const LoyaltyCardsPage: React.FC = () => {
    // Tutta la logica di stato vive qui, al livello più alto
    // const [cards, setCards] = useState<LoyaltyCard[]>(initialCards);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCard, setSelectedCard] = useState<CardDto | null>(null);
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [loading, setLoading] = useState(true)
    const [cardsList, setCardsList] = useState<CardDto[]>([])
    const {addNotification} = useNotification()


    useEffect(() => {
        loadCards()
    }, []);

    const resetPoints = async () => {
        if (!selectedCard) return
        const response = await resetCardApi(selectedCard.id)
        if (response && response.success && response.data?.data) {
            const tmpNew: CardDto[] = []
            for (const value of cardsList) {
                if (value.id === selectedCard.id) {
                    tmpNew.push(response.data.data)
                }
                tmpNew.push(value)
            }
            setCardsList([...tmpNew])
            addNotification({message: "Punti azzerati", type: "success"})
            setSelectedCard(response.data.data)
        } else {
            addNotification({message: "Errore", type: "error"})
        }
    }

    const loadCards = async() => {
        const response = await getAllCardsApi()
        if(response && response.success){
            if(response.data?.data){
                setCardsList([...response.data.data])
            }
        }else{
            addNotification({message: "Errore caricamento", type: "error"})
        }
        setLoading(false)
    }

    const addPoint = async (amount: number) => {
        if(!selectedCard) return false
        const response = await addPointToCardApi(selectedCard.id, amount)
        if(response && response.status && response.data?.data){
            const newList: CardDto[] = []
            for(const tmp of cardsList){
                if(tmp.id !== selectedCard.id)
                    newList.push(tmp)
                else
                    newList.push(response.data.data)
            }
            setCardsList([...newList])
            setSelectedCard(response.data.data)
            addNotification({message: "Punti aggiunti", type: "success"})
        }else{
            addNotification({message: "Errore aggiunta punti", type: "error"})
        }
        return false;
    }

    const filteredCards = useMemo(() => {
        if (!searchTerm) return cardsList;
        return cardsList.filter(card => card.code.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [cardsList, searchTerm]);

    const kpi = useMemo(() => ({
        total: cardsList.length,
        stamps: cardsList.filter(c => !c.typePoints).length,
        points: cardsList.filter(c => c.typePoints).length,
    }), [cardsList]);

    const handleManageCard = (card: CardDto) => {
        setSelectedCard(card);
    };

    const handleUpdateCard = (updatedCard: CardDto) => {
        setCardsList(prev => prev.map(c => c.id === updatedCard.id ? updatedCard : c));
    };

    const handleCreateCard = async (add: AddCard) => {
        setLoading(true)
        const response = await addCardApi(add)
        if(response && response.status && response.data?.data){
            const tmp = [...cardsList]
            tmp.push(response.data.data)
            setCardsList([...tmp])
            setSelectedCard(response.data.data);
        }else{
            addNotification({message: "Errore creazione", type: "error"})
        }
        setLoading(false)
    };

    const deleteCard = async () => {
        if(!selectedCard) return
        const response = await deleteCardApi(selectedCard.id)
        if(response && response.success){
            const tmp: CardDto[] = []
            for(const card of cardsList){
                if(card.id !== selectedCard.id){
                    tmp.push(card)
                }
            }
            setCardsList([...tmp])
            setSelectedCard(null)
            addNotification({message: "Carta eliminata", type: "success"})
        }else{
            addNotification({message: "Errore eliminazione", type: "error"})
        }
    }

    const claimCard = async(quantity: number) => {
        if(!selectedCard) return;
        const response = await claimCardApi(selectedCard.id, quantity);
        if(response && response.success && response.data?.data){
            const tmp: CardDto[] = []
            for(const card of cardsList){
                if(card.id === selectedCard.id){
                    tmp.push(response.data.data)
                }else{
                    tmp.push(card)
                }
            }
            setCardsList([...tmp])
            setSelectedCard(response.data.data)
            addNotification({message: "Punti riscattati", type: "success"})
        }else{
            addNotification({message: "Errore riscatto punti", type: "error"})
        }
    }

    const resetCard = async() => {
        if(!selectedCard) return;
        const response = await resetCardApi(selectedCard.id);
        if(response && response.success && response.data?.data){
            const tmp: CardDto[] = []
            for(const card of cardsList){
                if(card.id === selectedCard.id){
                    tmp.push(response.data.data)
                }else{
                    tmp.push(card)
                }
            }
            setCardsList([...tmp])
            setSelectedCard(response.data.data)
            addNotification({message: "Reset avvenuto", type: "success"})
        }else{
            addNotification({message: "Errore reset", type: "error"})
        }
    }

    return (
        <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
            {loading && <CustomLoading isTransparent={true} isFullPage={true} />}
            {isIssueModalOpen && <AddCardModal onClose={() => setIsIssueModalOpen(false)} onCreate={handleCreateCard} />}
            {selectedCard && <CardDetailModal resetCard={resetCard} claimCard={claimCard} addPoint={addPoint} deleteCard={deleteCard} card={selectedCard} onClose={() => setSelectedCard(null)} onUpdate={handleUpdateCard} />}

            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Carte Fedeltà</h1>
                <p className="text-gray-500 mt-1">Emetti e gestisci le carte per i tuoi clienti.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl shadow-lg"><p className="text-sm text-gray-500">Carte Totali</p><p className="text-2xl font-bold">{kpi.total}</p></div>
                <div className="bg-white p-4 rounded-xl shadow-lg"><p className="text-sm text-gray-500">Tipo Timbri</p><p className="text-2xl font-bold text-green-600">{kpi.stamps}</p></div>
                <div className="bg-white p-4 rounded-xl shadow-lg"><p className="text-sm text-gray-500">Tipo Punti</p><p className="text-2xl font-bold text-indigo-600">{kpi.points}</p></div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4 bg-white p-4 rounded-xl shadow-lg">
                <div className="relative w-full md:w-1/3">
                    <MagnifyingGlassIcon
                        className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
                    <input
                        type="text"
                        placeholder="Cerca per codice..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="
                            w-full
                            pl-10 pr-4 py-2              // Padding: 10 a sx, 4 a dx, 2 sopra/sotto
                            border border-gray-300      // Bordo
                            rounded-md                  // Angoli arrotondati
                            focus:ring-2 focus:ring-orange-500 // Stile al focus
                            focus:outline-none          // Rimuove l'outline di default
                        "
                    />
                </div>
                <button onClick={() => setIsIssueModalOpen(true)}
                        className="btn-primary w-full md:w-auto flex items-center justify-center">
                    <PlusIcon className="w-5 h-5 mr-2"/>Emetti Nuova Carta
                </button>
            </div>

            {filteredCards.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
                    {filteredCards.map(card => (
                        <LoyaltyCardItem key={card.code} card={card} onManage={handleManageCard}/>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-white rounded-xl shadow-lg mt-6">
                <p className="font-semibold text-gray-600">Nessuna carta trovata</p>
                    <p className="text-sm text-gray-500 mt-1">Emetti una nuova carta per iniziare.</p>
                </div>
            )}
        </div>
    );
};

export default LoyaltyCardsPage;