import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import {AddCard, CardType} from "../../types";

// Definiamo le props che il modale si aspetta di ricevere
export interface NewCardConfig {
    type: CardType;
    totalStamps?: number;
    pointConversionRate?: number;
}

interface IssueCardModalProps {
    onClose: () => void;
    onCreate: (add: AddCard) => void;
}

export const AddCardModal: React.FC<IssueCardModalProps> = ({ onClose, onCreate }) => {
    // Stato interno del modale
    const [cardType, setCardType] = useState<CardType>('stamps');
    const [totalStamps, setTotalStamps] = useState<number>(10);
    const [pointConversionRate, setPointConversionRate] = useState<number>(1);

    const handleCreateClick = () => {
        if (cardType === 'stamps' && totalStamps > 0) {
            onCreate({ typePoints: false, scope: totalStamps, priceForPoint: pointConversionRate });
        } else if (cardType === 'points' && pointConversionRate > 0) {
            onCreate({ typePoints: true, scope: totalStamps, priceForPoint: pointConversionRate });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Emetti Nuova Carta Fedeltà</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <XMarkIcon className="w-7 h-7" />
                    </button>
                </div>

                {/* Selettore del tipo di carta */}
                <div>
                    <label className="label-style mb-2">1. Scegli il tipo di carta</label>
                    <div className="flex items-center p-1 space-x-1 bg-gray-200 rounded-full">
                        <button onClick={() => setCardType('stamps')} className={`w-full px-4 py-2 text-sm font-semibold rounded-full transition-all ${cardType === 'stamps' ? 'bg-white text-primary shadow' : 'text-gray-600'}`}>
                            A Timbri
                        </button>
                        <button onClick={() => setCardType('points')} className={`w-full px-4 py-2 text-sm font-semibold rounded-full transition-all ${cardType === 'points' ? 'bg-white text-primary shadow' : 'text-gray-600'}`}>
                            A Punti
                        </button>
                    </div>
                </div>

                {/* Configurazione condizionale */}
                <div className="mt-6">
                    <label className="label-style">2. Imposta le regole</label>
                    {cardType === 'stamps' ? (
                        <div className="mt-1">
                            <p className="text-sm text-gray-600 mb-2">Il cliente riceverà un premio dopo aver collezionato un certo numero di timbri.</p>
                            <label htmlFor="total-stamps" className="label-style text-xs">Numero totale di timbri richiesti</label>
                            <input id="total-stamps" type="number" value={totalStamps} onChange={e => setTotalStamps(Number(e.target.value))} className="input-style w-full md:w-1/2"/>
                        </div>
                    ) : (
                        <div className="mt-1">
                            <p className="text-sm text-gray-600 mb-2">Il cliente accumula punti in base alla spesa, che potrà poi convertire in premi.</p>
                            <label htmlFor="point-rate" className="label-style text-xs">€ per ottenere 1 punto (es. inserisci 1 per 1€ = 1 punto)</label>
                            <input id="point-rate" type="number" value={pointConversionRate} onChange={e => setPointConversionRate(Number(e.target.value))} className="input-style w-full md:w-1/2"/>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-4 mt-8 border-t pt-6">
                    <button onClick={onClose} className="btn-secondary">Annulla</button>
                    <button onClick={handleCreateClick} className="btn-primary">Crea e Mostra Carta</button>
                </div>
            </div>
        </div>
    );
};