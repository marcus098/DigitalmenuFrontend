import React from 'react';
import { BRAND_NAME } from './brand';

/*
 * Marchio DineUp: simbolo (piatto a quattro spicchi con il morso) + wordmark "DineUp"
 * in Nunito 900, con "Dine" nel colore del testo e "Up" in arancio (come in dineup-logo.svg).
 * Gli stili (.du-*) sono in landing.css; il simbolo è il file in public/brand.
 */

type Tone = 'dark' | 'light';

export const DineUpSymbol: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = '' }) => (
    <img
        src="/brand/dineup-symbol.svg"
        width={size}
        height={size}
        alt=""
        aria-hidden="true"
        draggable={false}
        className={`du-sym block flex-none ${className}`}
    />
);

/**
 * Logo completo. `animated` riproduce l'entrata del video (girandola che ruota, "Up" che
 * salta su) una sola volta; con prefers-reduced-motion resta fermo.
 * `tone="light"` per gli sfondi scuri (simbolo arancio, "Dine" crema, "Up" arancio).
 */
export const Wordmark: React.FC<{ size?: number; tone?: Tone; animated?: boolean; className?: string }> = ({
    size = 26, tone = 'dark', animated = false, className = '',
}) => (
    <span
        role="img"
        aria-label={BRAND_NAME}
        className={`inline-flex items-center ${animated ? 'du-anim' : ''} ${className}`}
        style={{ gap: Math.round(size * 0.3) }}
    >
        <DineUpSymbol size={Math.round(size * 1.12)} />
        <span aria-hidden="true" className={`du-word ${tone === 'light' ? 'is-light' : ''}`} style={{ fontSize: size }}>
            Dine<span className="du-up">Up</span>
        </span>
    </span>
);

export default Wordmark;
