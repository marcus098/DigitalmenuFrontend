import React from 'react';
import { ShieldAlert, ShoppingBag } from 'lucide-react';
import { useData } from '../../Context/DataContext';
import { useMenuT } from '../../Client/menuI18n';

/** Nome della lingua scritto nella lingua stessa: lo straniero la riconosce subito. */
const LANGUAGE_NATIVE: Record<string, string> = {
    en: 'English', de: 'Deutsch', fr: 'Français', es: 'Español', nl: 'Nederlands', pl: 'Polski', pt: 'Português', zh: '中文',
};

interface ClientStickyHeaderProps {
    restaurantName: string;
    onAllergenClick: () => void;
    onCartClick: () => void;
    cartItemCount?: number;
    allergenFilterCount?: number;
    primaryColor?: string;
}

/**
 * Barra superiore del menu pubblico: nome del locale nel font dei titoli del
 * template, lingua, filtro allergeni e carrello. Fondo pieno con un filetto sotto,
 * come l'intestazione di una pagina di menu.
 */
const ClientStickyHeader: React.FC<ClientStickyHeaderProps> = ({
    restaurantName,
    onAllergenClick,
    onCartClick,
    cartItemCount = 0,
    allergenFilterCount = 0,
    primaryColor,
}) => {
    const { menuLang, menuLanguages, setMenuLang } = useData();
    const t = useMenuT();
    return (
        <header
            className="sticky top-0 z-30 menu-page"
            style={{ borderBottom: '1px solid var(--menu-rule)', height: 57 }}
        >
            <div className="max-w-4xl mx-auto h-full px-4 flex justify-between items-center gap-3">
                <span
                    className="menu-h truncate min-w-0"
                    style={{ fontSize: 'clamp(1.1rem, 4.4vw, 1.4rem)', lineHeight: 1.2 }}
                >
                    {restaurantName}
                </span>

                <div className="flex items-center gap-2 flex-shrink-0">
                    {menuLanguages.length > 0 && (
                        <select
                            value={menuLang}
                            onChange={e => setMenuLang(e.target.value)}
                            aria-label={t('language')}
                            className="menu-focus text-xs font-semibold uppercase"
                            style={{
                                height: 40,
                                padding: '0 6px',
                                borderRadius: 'var(--menu-radius)',
                                border: '1px solid var(--menu-rule)',
                                background: 'transparent',
                                color: 'var(--menu-text)',
                                fontFamily: 'var(--menu-font-body)',
                            }}
                        >
                            <option value="it">IT · Italiano</option>
                            {menuLanguages.map(l => (
                                <option key={l.code} value={l.code}>{l.code.toUpperCase()} · {LANGUAGE_NATIVE[l.code] ?? l.label}</option>
                            ))}
                        </select>
                    )}
                    <button
                        type="button"
                        onClick={onAllergenClick}
                        aria-label={t('allergensFilter')}
                        className="menu-focus relative flex items-center gap-1.5 transition-colors active:opacity-80"
                        style={{
                            height: 40,
                            padding: '0 12px',
                            borderRadius: 'var(--menu-radius)',
                            border: '1px solid var(--menu-rule)',
                            background: allergenFilterCount > 0 ? 'color-mix(in srgb, #dc2626 14%, transparent)' : 'transparent',
                            color: 'var(--menu-text)',
                            fontFamily: 'var(--menu-font-body)',
                        }}
                    >
                        <ShieldAlert className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                        <span className="hidden sm:inline text-xs font-semibold tracking-wide">{t('allergens')}</span>
                        {allergenFilterCount > 0 && (
                            <span
                                className="absolute -top-1.5 -right-1.5 w-4 h-4 text-[10px] font-bold text-white rounded-full flex items-center justify-center"
                                style={{ background: '#dc2626' }}
                            >
                                {allergenFilterCount}
                            </span>
                        )}
                    </button>

                    <button
                        type="button"
                        onClick={onCartClick}
                        aria-label={cartItemCount > 0 ? `${t('order')}, ${cartItemCount}` : t('order')}
                        className="menu-focus relative flex items-center gap-1.5 transition-opacity active:opacity-80"
                        style={{
                            height: 40,
                            padding: '0 14px',
                            borderRadius: 'var(--menu-radius)',
                            background: primaryColor || 'var(--menu-accent)',
                            color: 'var(--menu-accent-text)',
                            fontFamily: 'var(--menu-font-body)',
                        }}
                    >
                        <ShoppingBag className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                        <span className="hidden sm:inline text-xs font-semibold tracking-wide">{t('order')}</span>
                        {cartItemCount > 0 && (
                            <span className="menu-price text-sm font-bold" style={{ color: 'var(--menu-accent-text)' }}>
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
