import React, { useState, useEffect } from 'react';
import QrScanner from 'react-qr-scanner';
import QRCode from 'react-qr-code'; // <-- 1. Importa il componente QR Code
import { QrCodeIcon, MagnifyingGlassIcon, StarIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import { CardDto } from "../types";
import { getInfoCardApi } from "../Utilities/api";


// --- Componente per Visualizzare la Carta Trovata (CON MODIFICHE) ---
const CardDisplay: React.FC<{ card: CardDto }> = ({ card }) => {
    // Stato per decidere se mostrare o nascondere il QR code
    const [showQr, setShowQr] = useState(false);

    // Genera l'URL completo per il QR code
    const qrCodeUrl = `${window.location.origin}${window.location.pathname}#${card.code}`;

    return (
        <div className="w-full max-w-sm mx-auto bg-slate-800 text-white rounded-2xl shadow-2xl p-6 transform transition-all duration-500">
            <div className="flex justify-between items-center mb-4">
                <span className="font-semibold text-lg">Carta Fedeltà</span>
                {card.typePoints
                    ? <StarIcon className="w-8 h-8 text-yellow-400"/>
                    : <CheckBadgeIcon className="w-8 h-8 text-green-400"/>
                }
            </div>
            <div className="text-center my-8">
                <p className="font-mono text-3xl tracking-widest">{card.code}</p>
            </div>
            <div className="border-t border-slate-700 pt-4">
                {card.typePoints && card.actualValue !== undefined && (
                    <div>
                        <p className="text-sm text-slate-400">Punti Accumulati</p>
                        <p className="text-4xl font-bold">{card.actualValue}</p>
                    </div>
                )}
                {!card.typePoints && card.actualValue !== undefined && card.scope !== undefined && (
                    <div>
                        <p className="text-sm text-slate-400">Progresso Timbri</p>
                        <p className="text-3xl font-bold">{card.actualValue} / {card.scope}</p>
                        <div className="w-full bg-slate-600 rounded-full h-2 mt-2">
                            <div className="bg-green-400 h-2 rounded-full" style={{ width: `${(card.actualValue / card.scope) * 100}%` }}></div>
                        </div>
                    </div>
                )}
            </div>

            {/* --- SEZIONE QR CODE AGGIUNTA --- */}
            <div className="mt-6 text-center">
                <button
                    onClick={() => setShowQr(!showQr)}
                    className="bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-lg flex items-center justify-center w-full transition-colors"
                >
                    <QrCodeIcon className="w-5 h-5 mr-2" />
                    {showQr ? 'Nascondi' : 'Mostra'} QR Code
                </button>

                {/* Il QR code viene mostrato solo se showQr è true */}
                {showQr && (
                    <div className="mt-6 bg-white p-4 rounded-lg">
                        <QRCode
                            value={qrCodeUrl}
                            size={256}
                            style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                            viewBox={`0 0 256 256`}
                        />
                    </div>
                )}
            </div>
            {/* --- FINE SEZIONE AGGIUNTA --- */}

            <div className="text-xs text-slate-500 text-center mt-6">
                Carta emessa il {new Date(card.createdAt).toLocaleDateString('it-IT')}
            </div>
        </div>
    )
};


// --- Pagina Principale (invariata) ---
const CardStatusPage: React.FC = () => {
    const [codeInput, setCodeInput] = useState('');
    const [foundCard, setFoundCard] = useState<CardDto | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);

    useEffect(() => {
        const hash = window.location.hash;
        if (hash) {
            const code = hash.replace("#", "");
            setCodeInput(code.toUpperCase());
            handleSearch(code);
        }
    }, []);

    const handleSearch = async (code: string) => {
        if (!code) return;
        window.location.hash = code;
        setIsLoading(true);
        setError(null);
        setFoundCard(null);
        setIsScanning(false);

        const response = await getInfoCardApi(code);

        if (response && response.success && response.data?.data) {
            setFoundCard(response.data.data);
        } else {
            setError(`Nessuna carta trovata con il codice "${code}". Riprova.`);
        }
        setIsLoading(false);
    };

    const handleScan = (data: { text: string } | null) => {
        if (data) {
            const urlParts = data.text.split('#');
            const code = urlParts[urlParts.length - 1];
            if (code) {
                setCodeInput(code.toUpperCase());
                handleSearch(code);
            }
        }
    };

    const handleError = (err: any) => {
        console.error(err);
        setError("Impossibile avviare la fotocamera. Assicurati di aver dato i permessi e che non sia usata da altre app.");
        setIsScanning(false);
    };

    return (
        <div className="bg-gradient-to-br from-amber-100 via-orange-200 to-red-200 min-h-screen flex flex-col items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-gray-800">La Tua Carta Fedeltà</h1>
                    <p className="text-gray-600 mt-2">Controlla il saldo punti o i timbri della tua carta.</p>
                </div>

                {isScanning ? (
                    <div className="bg-white p-6 rounded-2xl shadow-xl">
                        <QrScanner
                            onScan={handleScan}
                            onError={handleError}
                            constraints={{ video: { facingMode: "environment" } }}
                            style={{ width: '100%', borderRadius: '12px' }}
                        />
                        <button onClick={() => setIsScanning(false)} className="btn-secondary w-full mt-4">
                            Annulla Scansione
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="bg-white p-6 rounded-2xl shadow-xl">
                            <label htmlFor="card-code" className="label-style">Inserisci il codice della tua carta</label>
                            <div className="flex items-center gap-2 mt-1">
                                <input
                                    id="card-code"
                                    type="text"
                                    value={codeInput}
                                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                                    placeholder="ES. AA9DC8ED-6A65"
                                    className="input-style flex-grow"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch(codeInput)}
                                />
                                <button onClick={() => handleSearch(codeInput)} disabled={isLoading} className="btn-primary p-3">
                                    <MagnifyingGlassIcon className="w-6 h-6"/>
                                </button>
                            </div>
                            <div className="relative flex items-center justify-center my-4">
                                <span className="flex-grow border-t border-gray-200"></span>
                                <span className="flex-shrink mx-4 text-xs font-semibold text-gray-400">OPPURE</span>
                                <span className="flex-grow border-t border-gray-200"></span>
                            </div>
                            <button onClick={() => setIsScanning(true)} disabled={isLoading} className="btn-secondary w-full flex items-center justify-center">
                                <QrCodeIcon className="w-5 h-5 mr-2"/>
                                Inquadra il QR Code
                            </button>
                        </div>

                        <div className="mt-8 min-h-[300px]">
                            {isLoading && (
                                <div className="text-center pt-10">
                                    <p className="font-semibold text-indigo-600 animate-pulse">Ricerca in corso...</p>
                                </div>
                            )}
                            {error && (
                                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg">
                                    <p className="font-bold">Errore</p>
                                    <p>{error}</p>
                                </div>
                            )}
                            {foundCard && (
                                <CardDisplay card={foundCard} />
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default CardStatusPage;