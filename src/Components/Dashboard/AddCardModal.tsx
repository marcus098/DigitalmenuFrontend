import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/solid';
import {AddCard, CardType, LoyaltySettings} from "../../types";

interface IssueCardModalProps {
    onClose: () => void;
    onCreate: (add: AddCard) => void;
    /** Regole del locale: se impostate prevalgono (il backend le applica comunque) */
    settings?: LoyaltySettings | null;
}

export const AddCardModal: React.FC<IssueCardModalProps> = ({ onClose, onCreate, settings }) => {
    const fixedStamps = settings?.stampsForPrize ?? null;
    const fixedRate = settings?.eurosPerPoint ?? null;
    // Tipo deciso dal locale nelle regole tessere: niente scelta qui
    const fixedType: CardType | null = settings?.programType === 'POINTS' ? 'points'
        : settings?.programType === 'VISITS' ? 'stamps' : null;
    const [cardType, setCardType] = useState<CardType>(fixedType ?? 'stamps');
    const [totalStamps, setTotalStamps] = useState<number>(10);
    const [pointConversionRate, setPointConversionRate] = useState<number>(1);
    const [holderName, setHolderName] = useState('');
    const [holderContact, setHolderContact] = useState('');
    const [note, setNote] = useState('');

    const type = fixedType ?? cardType;

    const handleCreateClick = () => {
        const stamps = fixedStamps ?? totalStamps;
        const rate = fixedRate ?? pointConversionRate;
        const holder = { holderName: holderName.trim(), holderContact: holderContact.trim(), note: note.trim() };
        if (type === 'stamps' && stamps > 0) {
            onCreate({ typePoints: false, scope: stamps, priceForPoint: rate, ...holder });
        } else if (type === 'points' && rate > 0) {
            onCreate({ typePoints: true, scope: stamps, priceForPoint: rate, ...holder });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-2xl w-full max-w-lg my-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">Nuova tessera</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600" aria-label="Chiudi">
                        <XMarkIcon className="w-7 h-7" />
                    </button>
                </div>

                {fixedType == null ? (
                    <div>
                        <label className="label-style mb-2">Tipo di tessera</label>
                        <div className="flex items-center p-1 space-x-1 bg-gray-200 rounded-full">
                            <button onClick={() => setCardType('stamps')} className={`w-full px-4 py-2 text-sm font-semibold rounded-full transition-all ${cardType === 'stamps' ? 'bg-white text-primary shadow' : 'text-gray-600'}`}>
                                A visite
                            </button>
                            <button onClick={() => setCardType('points')} className={`w-full px-4 py-2 text-sm font-semibold rounded-full transition-all ${cardType === 'points' ? 'bg-white text-primary shadow' : 'text-gray-600'}`}>
                                A punti
                            </button>
                        </div>
                    </div>
                ) : null}

                <div className={fixedType == null ? 'mt-5' : ''}>
                    {type === 'stamps' ? (
                        fixedStamps != null ? (
                            <p className="text-sm text-gray-700 bg-slate-50 rounded-lg p-3">
                                <span className="font-semibold">Tessera a visite:</span> premio a {fixedStamps} visite{settings?.stampsPrize ? ` (${settings.stampsPrize})` : ''}.
                                <span className="block text-xs text-gray-500 mt-0.5">Dalle regole tessere del locale.</span>
                            </p>
                        ) : (
                            <label className="block">
                                <span className="label-style">Visite per il premio</span>
                                <input type="number" min={1} value={totalStamps} onChange={e => setTotalStamps(Number(e.target.value))} className="input-style w-full md:w-1/2"/>
                            </label>
                        )
                    ) : (
                        fixedRate != null ? (
                            <p className="text-sm text-gray-700 bg-slate-50 rounded-lg p-3">
                                <span className="font-semibold">Tessera a punti:</span> 1 punto ogni {fixedRate.toLocaleString('it-IT')} €.
                                <span className="block text-xs text-gray-500 mt-0.5">Dalle regole tessere del locale.</span>
                            </p>
                        ) : (
                            <label className="block">
                                <span className="label-style">€ per ottenere 1 punto</span>
                                <input type="number" min={0.01} step="0.01" value={pointConversionRate} onChange={e => setPointConversionRate(Number(e.target.value))} className="input-style w-full md:w-1/2"/>
                            </label>
                        )
                    )}
                </div>

                <div className="mt-6 space-y-3">
                    <p className="label-style">Titolare <span className="font-normal text-gray-400">(facoltativo)</span></p>
                    <input value={holderName} onChange={e => setHolderName(e.target.value)} maxLength={80}
                           placeholder="Nome e cognome" className="input-style w-full" />
                    <input value={holderContact} onChange={e => setHolderContact(e.target.value)} maxLength={120}
                           placeholder="Telefono o email" className="input-style w-full" />
                    <input value={note} onChange={e => setNote(e.target.value)} maxLength={500}
                           placeholder="Nota (es. intollerante al lattosio)" className="input-style w-full" />
                    <p className="text-xs text-gray-400">Serve a ritrovare la tessera se il cliente la perde. Chiedi il consenso prima di salvare i suoi dati.</p>
                </div>

                <div className="flex justify-end gap-4 mt-8 border-t pt-6">
                    <button onClick={onClose} className="btn-secondary">Annulla</button>
                    <button onClick={handleCreateClick} className="btn-primary">Crea tessera</button>
                </div>
            </div>
        </div>
    );
};
