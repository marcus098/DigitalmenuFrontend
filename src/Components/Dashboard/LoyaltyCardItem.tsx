import React from 'react';
import { StarIcon, CheckBadgeIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import {CardDto} from "../../types";

interface LoyaltyCardItemProps {
    card: CardDto;
    onManage: (card: CardDto) => void;
}

const LoyaltyCardItem: React.FC<LoyaltyCardItemProps> = ({ card, onManage }) => {
    return (
        <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-200 hover:border-primary transition-all">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-xs font-semibold text-primary uppercase">{card.typePoints ? 'A PUNTI' : 'A TIMBRI'}</p>
                    <p className="font-mono font-bold text-lg text-gray-800">{card.code}</p>
                    <p className="text-xs text-gray-500">Emessa il: {card.createdAt}</p>
                </div>
                <div className={`p-2 rounded-full ${card.typePoints ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'}`}>
                    {card.typePoints ? <StarIcon className="w-6 h-6"/> : <CheckBadgeIcon className="w-6 h-6"/>}
                </div>
            </div>
            <div className="mt-4">
                {card.typePoints && card.actualValue !== undefined && (
                    <p className="text-2xl font-bold text-indigo-600">{card.actualValue} Punti</p>
                )}
                {!card.typePoints && card.scope !== undefined && card.scope !== undefined && (
                    <div>
                        <p className="text-lg font-bold text-green-600">{card.actualValue} / {card.scope} Timbri</p>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
                            <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${(card.actualValue / card.scope) * 100}%` }}></div>
                        </div>
                    </div>
                )}
            </div>
            <button onClick={() => onManage(card)} className="btn-secondary w-full mt-4 flex items-center justify-center text-sm">
                <QrCodeIcon className="w-5 h-5 mr-2"/>
                Gestisci / Mostra QR
            </button>
        </div>
    );
};

export default LoyaltyCardItem;