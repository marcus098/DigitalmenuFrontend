import React from 'react';
import { ShieldAlert, ShoppingCart } from 'lucide-react';

interface ClientStickyHeaderProps {
    restaurantName: string;
    onAllergenClick: () => void;
    onCartClick: () => void;
    cartItemCount?: number;
    allergenFilterCount?: number;
    primaryColor?: string;
}

const ClientStickyHeader: React.FC<ClientStickyHeaderProps> = ({
    restaurantName,
    onAllergenClick,
    onCartClick,
    cartItemCount = 0,
    allergenFilterCount = 0,
    primaryColor = '#f97316',
}) => {
    return (
        <header
            className="sticky top-0 z-30"
            style={{
                background: 'rgba(23, 20, 15, 0.88)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
            }}
        >
            <div className="max-w-4xl mx-auto px-5 py-3.5 flex justify-between items-center">
                {/* Restaurant name */}
                <span
                    className="font-cormorant font-semibold tracking-wide leading-none truncate max-w-[55%]"
                    style={{ color: '#ede8da', fontSize: 'clamp(1.1rem, 4vw, 1.35rem)' }}
                >
                    {restaurantName}
                </span>

                {/* Actions */}
                <div className="flex items-center gap-2">
                    {/* Allergen button */}
                    <button
                        onClick={onAllergenClick}
                        className="relative flex items-center gap-1.5 rounded-full transition-all duration-200 active:scale-95"
                        style={{
                            padding: '8px 14px',
                            background: allergenFilterCount > 0
                                ? 'rgba(239,68,68,0.15)'
                                : 'rgba(255,255,255,0.07)',
                            color: allergenFilterCount > 0 ? '#fca5a5' : '#8a7d6a',
                        }}
                    >
                        <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                        <span className="hidden md:inline font-nunito text-xs font-medium tracking-wide">
                            Allergeni
                        </span>
                        {allergenFilterCount > 0 && (
                            <span
                                className="absolute -top-1 -right-1 w-4 h-4 text-[10px] font-bold text-white rounded-full flex items-center justify-center"
                                style={{ background: '#ef4444' }}
                            >
                                {allergenFilterCount}
                            </span>
                        )}
                    </button>

                    {/* Cart button */}
                    <button
                        onClick={onCartClick}
                        className="relative flex items-center gap-1.5 rounded-full transition-all duration-200 active:scale-95"
                        style={{
                            padding: '8px 16px',
                            background: primaryColor,
                            color: '#fff',
                        }}
                    >
                        <ShoppingCart className="w-4 h-4 flex-shrink-0" />
                        <span className="hidden md:inline font-nunito text-xs font-semibold tracking-wide">
                            Carrello
                        </span>
                        {cartItemCount > 0 && (
                            <span
                                className="ml-0.5 font-nunito text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0"
                                style={{ background: 'rgba(255,255,255,0.25)', color: '#fff' }}
                            >
                                {cartItemCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
};

export default ClientStickyHeader;
