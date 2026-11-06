import React from 'react';
import { BRAND_NAME } from './brand';

/*
 * Marchio provvisorio: un modulo 3×3 che ricorda un QR (tre "angoli" pieni) con il
 * modulo in basso a destra nel colore d'accento — il punto in cui l'ordine parte.
 * Il wordmark è solo tipografico, quindi funziona con qualsiasi nome breve in brand.ts.
 */
export const BrandGlyph: React.FC<{ size?: number; className?: string; inverted?: boolean }> = ({ size = 18, className = '', inverted = false }) => {
    const ink = inverted ? 'var(--dark-ink)' : 'var(--ink)';
    // 1 = pieno, 0 = vuoto, 2 = accento
    const cells = [
        1, 0, 1,
        0, 1, 0,
        1, 0, 2,
    ];
    return (
        <svg width={size} height={size} viewBox="0 0 18 18" className={className} aria-hidden="true" focusable="false">
            {cells.map((c, i) => {
                if (!c) return null;
                const x = (i % 3) * 6;
                const y = Math.floor(i / 3) * 6;
                return <rect key={i} x={x} y={y} width={5} height={5} fill={c === 2 ? 'var(--accent)' : ink} />;
            })}
        </svg>
    );
};

export const Wordmark: React.FC<{ className?: string; inverted?: boolean; size?: 'sm' | 'md' | 'lg' }> = ({ className = '', inverted = false, size = 'md' }) => {
    const glyph = size === 'lg' ? 26 : size === 'sm' ? 15 : 18;
    const text = size === 'lg' ? 'text-[28px]' : size === 'sm' ? 'text-[15px]' : 'text-[18px]';
    return (
        <span className={`inline-flex items-center gap-[0.5em] ${text} ${className}`}>
            <BrandGlyph size={glyph} inverted={inverted} />
            <span className="font-semibold tracking-[-0.03em] leading-none">{BRAND_NAME}</span>
        </span>
    );
};

export default Wordmark;
