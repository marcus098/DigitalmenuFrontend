import React, { useState, useEffect, useRef } from 'react';
import {useNavigate, useParams} from "react-router-dom";

import {
    PlusIcon,
    XMarkIcon,
    ShoppingCartIcon,
    ClockIcon,
    CreditCardIcon
} from '@heroicons/react/24/solid';

const CartIcon: React.FC = () => {
    const { localname } = useParams();
    const navigate = useNavigate();

    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // L'effetto per chiudere il menu cliccando fuori rimane invariato, è corretto.
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const actions = [
        { label: 'Checkout', icon: CreditCardIcon, onClick: () => navigate(`/${localname}/checkout`), bgColor: 'bg-green-500' },
        { label: 'Cronologia Ordini', icon: ClockIcon, onClick: () => navigate(`/${localname}/history`), bgColor: 'bg-blue-500' },
        { label: 'Carrello', icon: ShoppingCartIcon, onClick: () => navigate(window.location.href.toLowerCase().includes('/waiters/') ? `/Waiters/${localname}/cart` : `/${localname}/cart`), bgColor: 'bg-orange-500' },
    ];

    return (
        // Il contenitore principale ora è solo un punto di riferimento per il posizionamento.
        // Usiamo right-5 come richiesto.
        <div ref={menuRef} className="fixed bottom-5 right-5 z-50">
            {/* MODIFICA CHIAVE 1:
              Il menu delle azioni ora è posizionato in modo assoluto *rispetto al contenitore*.
              Si posiziona sopra il bottone principale.
            */}
            <div className="absolute bottom-full mb-3 flex flex-col items-center gap-3" style={{width: !isOpen ? '0px' : 'auto', height: !isOpen ? '0px' : ''}}>
                <div
                    // MODIFICA CHIAVE 2: Le classi di transizione e visibilità sono qui
                    className={`flex flex-col items-center gap-3 transition-all duration-300 ease-in-out ${
                        isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                    }`}
                >
                    {(window.location.href.toLowerCase().includes('/waiters/') ? [...(actions.filter(a => a.label === 'Carrello'))] : [...actions]).map((action) => (
                        <div key={action.label} className="relative group flex items-center">
                            <span className="absolute right-full mr-4 px-3 py-1.5 bg-gray-800 text-white text-xs font-bold rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                {action.label}
                            </span>
                            <button
                                onClick={() => { action.onClick(); setIsOpen(false); }}
                                className={`${action.bgColor} text-white w-12 h-12 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform`}
                            >
                                <action.icon className="w-6 h-6" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* MODIFICA CHIAVE 3:
              Il bottone principale è ora l'elemento base. Il contenitore sopra non ha dimensione propria,
              quindi non può bloccare i click.
            */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform relative z-10"
            >
                <XMarkIcon className={`w-8 h-8 absolute transition-all duration-300 ${isOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'}`} />
                <PlusIcon className={`w-8 h-8 absolute transition-all duration-300 ${isOpen ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'}`} />
            </button>
        </div>
    );
};

export default CartIcon;
