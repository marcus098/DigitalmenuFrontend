import React from 'react';
import { useMenuLook } from './MenuThemeProvider';

/**
 * Piccoli mattoni tipografici condivisi da tutti i template del menu pubblico
 * (divisori, prezzi, etichette dei piatti). Lo stile arriva dal "look" del
 * template corrente via `useMenuLook()` + classi `.menu-*` in index.css.
 */

export const MenuRule: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style }) => {
    const { look } = useMenuLook();
    return (
        <div className={`menu-rule menu-rule--${look.divider} ${className}`} style={style} aria-hidden="true">
            {look.divider === 'ornament' && <i />}
        </div>
    );
};

export function formatEuro(value: number): string {
    // Sui menu stampati italiani: "12" se intero, "8,50" altrimenti.
    const v = Number.isFinite(value) ? value : 0;
    return Number.isInteger(v) ? String(v) : v.toFixed(2).replace('.', ',');
}

export const MenuPrice: React.FC<{ value: number; from?: boolean; size?: string }> = ({ value, from, size = '1.05rem' }) => {
    const { look } = useMenuLook();
    const base: React.CSSProperties = { fontSize: size, lineHeight: 1.1 };
    const label = (
        <>
            {from && <span style={{ fontSize: '0.72em', opacity: 0.8, marginRight: 4 }}>da</span>}
            <span aria-hidden="true" style={{ marginRight: 1 }}>€</span>
            {formatEuro(value)}
        </>
    );
    if (look.price === 'badge') {
        return (
            <span
                className="menu-price inline-block"
                style={{
                    ...base,
                    fontWeight: 700,
                    padding: '3px 8px',
                    background: 'var(--menu-accent)',
                    color: 'var(--menu-accent-text)',
                    border: '2px solid var(--menu-text)',
                }}
            >
                {label}
            </span>
        );
    }
    return (
        <span
            className="menu-price"
            style={{
                ...base,
                fontWeight: 600,
                color: look.price === 'accent' ? 'var(--menu-emph)' : 'var(--menu-text)',
            }}
        >
            {label}
        </span>
    );
};

const TAG_LABELS: Record<number, string> = {
    1: 'Vegetariano',
    2: 'Senza glutine',
    3: 'Piccante',
    4: 'Classico della casa',
};

export const MenuTags: React.FC<{ tags?: number[]; align?: 'left' | 'center' }> = ({ tags, align = 'left' }) => {
    if (!tags || tags.length === 0) return null;
    const labels = tags.slice(0, 3).map(t => TAG_LABELS[t]).filter(Boolean);
    if (labels.length === 0) return null;
    return (
        <p
            className="mt-1.5"
            style={{
                fontFamily: 'var(--menu-font-body)',
                fontSize: '0.68rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'var(--menu-emph)',
                textAlign: align,
            }}
        >
            {labels.join('  ·  ')}
        </p>
    );
};
