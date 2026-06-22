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
                background: 'color-mix(in srgb, var(--menu-bg) 88%, transparent)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderBottom: '1px solid var(--menu-border)',
            }}
        >
            <div className="max-w-4xl mx-auto px-5 py-3.5 flex justify-between items-center">
                <span
                    className="font-semibold tracking-wide leading-none truncate max-w-[55%]"
                    style={{ color: 'var(--menu-text)', fontFamily: 'var(--menu-font-display)', fontSize: 'clamp(1.1rem, 4vw, 1.35rem)' }}
                >
                    {restaurantName}
                </span>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onAllergenClick}
                        className="relative flex items-center gap-1.5 rounded-full transition-all duration-200 active:scale-95"
                        style={{
                            padding: '8px 14px',
                            background: allergenFilterCount > 0 ? 'rgba(239,68,68,0.15)' : 'var(--menu-input-bg)',
                            color: allergenFilterCount > 0 ? '#fca5a5' : 'var(--menu-muted)',
                            fontFamily: 'var(--menu-font-body)',
                        }}
                    >
                        <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                        <span className="hidden md:inline text-xs font-medium tracking-wide">
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

                    <button
                        onClick={onCartClick}
                        className="relative flex items-center gap-1.5 rounded-full transition-all duration-200 active:scale-95"
                        style={{
                            padding: '8px 16px',
                            background: primaryColor || 'var(--menu-accent)',
                            color: 'var(--menu-accent-text)',
                            fontFamily: 'var(--menu-font-body)',
                        }}
                    >
                        <ShoppingCart className="w-4 h-4 flex-shrink-0" />
                        <span className="hidden md:inline text-xs font-semibold tracking-wide">
                            Carrello
                        </span>
                        {cartItemCount > 0 && (
                            <span
                                className="ml-0.5 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0"
                                style={{ background: 'rgba(255,255,255,0.25)', color: 'var(--menu-accent-text)' }}
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
