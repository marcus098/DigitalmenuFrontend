import React from 'react';
import { BRAND_NAME } from './brand';

/*
 * Marchio Omnivo: simbolo (piatto a quattro spicchi con il morso) + wordmark "omnivo"
 * in Nunito 900, con la "i" senza puntino e un puntino arancio al suo posto.
 * Gli stili (.omn-*) sono in landing.css; il simbolo è il file in public/brand.
 */

type Tone = 'dark' | 'light';

export const OmnivoSymbol: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = '' }) => (
    <img
        src="/brand/omnivo-symbol.svg"
        width={size}
        height={size}
        alt=""
        aria-hidden="true"
        draggable={false}
        className={`omn-sym block flex-none ${className}`}
    />
);

/**
 * Logo completo. `animated` riproduce l'entrata del video (girandola che ruota, puntino che
 * cade sulla i) una sola volta; con prefers-reduced-motion resta fermo.
 * `tone="light"` per gli sfondi scuri (simbolo arancio, scritta crema).
 */
export const Wordmark: React.FC<{ size?: number; tone?: Tone; animated?: boolean; className?: string }> = ({
    size = 26, tone = 'dark', animated = false, className = '',
}) => (
    <span
        role="img"
        aria-label={BRAND_NAME}
        className={`inline-flex items-center ${animated ? 'omn-anim' : ''} ${className}`}
        style={{ gap: Math.round(size * 0.3) }}
    >
        <OmnivoSymbol size={Math.round(size * 1.12)} />
        <span aria-hidden="true" className={`omn-word ${tone === 'light' ? 'is-light' : ''}`} style={{ fontSize: size }}>
            omn<span className="omn-i">ı<span className="omn-dot" /></span>vo
        </span>
    </span>
);

export default Wordmark;
