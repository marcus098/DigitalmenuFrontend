import React from 'react';
import { useMenuLook } from './MenuThemeProvider';
import type { ImageShape, TemplateLook } from '../../Client/menuTemplates';
import { toKanji } from '../../Client/menuTemplates';

/**
 * Piccoli mattoni tipografici condivisi da tutti i template del menu pubblico
 * (divisori, prezzi, etichette dei piatti). Lo stile arriva dal "look" del
 * template corrente via `useMenuLook()` + classi `.menu-*` in index.css.
 */

export const MenuRule: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style }) => {
    const { look } = useMenuLook();
    return (
        <div className={`menu-rule menu-rule--${look.divider} ${className}`} style={style} aria-hidden="true">
            {ruleHasGlyph(look.divider) && <i />}
        </div>
    );
};

/** Divisori con un ornamento centrale (elemento <i> mascherato in index.css). */
export function ruleHasGlyph(d: TemplateLook['divider']): boolean {
    return d === 'ornament' || d === 'nouveau' || d === 'fleuron';
}

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

/** Numero del piatto (template con piatti numerati): semplice o nella casella del foglio d'ordine. */
export const MenuNumber: React.FC<{ n: number; size?: string; className?: string; style?: React.CSSProperties }> = ({ n, size = '0.8rem', className = '', style }) => {
    const { look } = useMenuLook();
    const boxed = look.numberStyle === 'boxed';
    return (
        <span
            aria-hidden="true"
            className={`menu-price ${boxed ? 'menu-num--boxed' : ''} ${className}`}
            style={{ color: 'var(--menu-emph)', fontSize: size, fontWeight: boxed ? 700 : 600, ...style }}
        >
            {String(n).padStart(2, '0')}
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
                // in tono di testo, non da etichetta: le caratteristiche si leggono, non si "brandizzano"
                fontFamily: 'var(--menu-font-body)',
                fontSize: '0.76rem',
                fontWeight: 600,
                fontStyle: 'italic',
                color: 'var(--menu-emph)',
                textAlign: align,
            }}
        >
            {labels.join(' · ')}
        </p>
    );
};


// ─── Aggiunte novembre 2026 ───────────────────────────────────────────────────

/** border-radius delle foto dei piatti secondo la forma scelta. */
export function imageRadius(shape: ImageShape): string {
    if (shape === 'round') return '50%';
    if (shape === 'arch') return '999px 999px var(--menu-radius) var(--menu-radius)';
    return 'var(--menu-radius)';
}

/** Spaziatura verticale delle righe piatto (px) per densità. */
export function rowPadding(look: TemplateLook): number {
    return look.density === 'compact' ? 10 : look.density === 'airy' ? 24 : 16;
}

/** Descrizione del piatto nello stile del template. */
export const MenuDescription: React.FC<{
    text: string;
    className?: string;
    style?: React.CSSProperties;
    clamp?: number;
    /** 'auto': corsivo se i titoli sono in corsivo (riga da menu); false = mai (schede, centrato). */
    autoItalic?: boolean;
}> = ({ text, className = '', style, clamp, autoItalic = true }) => {
    const { look } = useMenuLook();
    const clampStyle: React.CSSProperties = clamp
        ? { display: '-webkit-box', WebkitLineClamp: clamp, WebkitBoxOrient: 'vertical', overflow: 'hidden' }
        : {};
    if (look.descStyle === 'ingredients') {
        // "pomodoro, basilico, olio" → pomodoro / basilico / olio, come la riga degli ingredienti
        // sotto un drink o sotto il piatto in un ricettario (minuscolo, barrette in colore d'accento).
        const parts = text.split(/\s*[,;]\s*/).filter(Boolean);
        return (
            <p
                className={className}
                style={{
                    ...style, ...clampStyle,
                    color: 'var(--menu-muted)', lineHeight: 1.5, fontWeight: 500,
                }}
            >
                {parts.map((part, i) => (
                    <React.Fragment key={i}>
                        {i > 0 && <span aria-hidden="true" style={{ color: 'var(--menu-emph)', margin: '0 0.35em', fontWeight: 400 }}>/</span>}
                        {part.charAt(0).toLowerCase() + part.slice(1)}
                    </React.Fragment>
                ))}
            </p>
        );
    }
    const italic = look.descStyle === 'italic' || (look.descStyle === 'auto' && autoItalic && look.headingStyle === 'italic');
    return (
        <p className={className} style={{ color: 'var(--menu-muted)', ...style, fontStyle: italic ? 'italic' : 'normal', ...clampStyle }}>
            {text}
        </p>
    );
};

/**
 * Nome del locale nella testata, con la "cornice" del template (headerStyle ≠ 'plain').
 * Con 'plain' i chiamanti usano il loro markup storico.
 */
export const MenuMastheadTitle: React.FC<{
    name: string;
    fontSize: string;
    centered: boolean;
    sub?: string;
    as?: 'h1' | 'p';
}> = (props) => {
    const { look } = useMenuLook();
    if (look.headerStyle === 'plain') return <MastheadInner {...props} />;
    // Le cornici hanno bisogno di aria prima del testo che segue (descrizione, indirizzo)
    return <div className="mb-5"><MastheadInner {...props} /></div>;
};

const MastheadInner: React.FC<{ name: string; fontSize: string; centered: boolean; sub?: string; as?: 'h1' | 'p' }> = ({ name, fontSize, centered, sub, as = 'h1' }) => {
    const { look } = useMenuLook();
    const H = as;
    const subEl = sub ? <p className="menu-label mt-3" style={{ color: 'inherit', opacity: 0.85 }}>{sub}</p> : null;
    const wrapAlign = centered ? 'text-center' : 'text-left';

    switch (look.headerStyle) {
        case 'framed':
            return (
                <div className={`menu-head--framed ${wrapAlign}`}>
                    {(['tl', 'tr', 'bl', 'br'] as const).map(c => <span key={c} aria-hidden="true" className={`menu-corner menu-corner--${c}`} />)}
                    <H className="menu-h" style={{ fontSize, lineHeight: 1.02, textAlign: centered ? 'center' : 'left' }}>{name}</H>
                    {sub && <p className="menu-label mt-3" style={{ color: 'var(--menu-emph)' }}>{sub}</p>}
                </div>
            );
        case 'banner':
            return (
                <div className={`menu-head--banner ${wrapAlign}`}>
                    <H className="menu-h" style={{ fontSize, lineHeight: 0.95, textAlign: centered ? 'center' : 'left' }}>{name}</H>
                    {subEl}
                </div>
            );
        case 'stamp':
            return (
                <div className={centered ? 'text-center' : ''}>
                    <div className="menu-head--stamp menu-ink">
                        <H className="menu-h" style={{ fontSize, lineHeight: 1, textAlign: 'center' }}>{name}</H>
                        {sub && <p className="menu-label mt-2" style={{ color: 'inherit', textAlign: 'center' }}>{sub}</p>}
                    </div>
                </div>
            );
        case 'script':
            return (
                <div className={wrapAlign}>
                    <H
                        style={{
                            fontFamily: 'var(--menu-font-accent)', fontSize: `calc(${fontSize} * 1.12)`, lineHeight: 1.05,
                            color: 'var(--menu-emph)', fontWeight: 400, transform: 'rotate(-4deg)', transformOrigin: 'left center',
                            textShadow: '2px 2px 0 var(--menu-text)', display: 'inline-block', padding: '0.05em 0.1em 0.12em 0',
                            textAlign: centered ? 'center' : 'left',
                        }}
                    >
                        {name}
                    </H>
                    {sub && (
                        <p className="menu-label mt-3">
                            <span style={{ background: 'var(--menu-text)', color: 'var(--menu-bg)', padding: '4px 10px', letterSpacing: '0.16em' }}>{sub}</span>
                        </p>
                    )}
                </div>
            );
        case 'noren':
            return (
                <div className="menu-head--noren text-center">
                    <H className="menu-h" style={{ fontSize, lineHeight: 1.05, textAlign: 'center' }}>{name}</H>
                    {subEl}
                </div>
            );
        case 'tape':
            return (
                <div className={centered ? 'text-center' : ''}>
                    <div className="menu-head--tape text-left">
                        <H className="menu-h" style={{ fontSize, lineHeight: 1 }}>{name}</H>
                        {sub && <p className="mt-2" style={{ color: 'var(--menu-muted)', fontSize: '0.95rem' }}>{sub}</p>}
                    </div>
                </div>
            );
        case 'awning':
            return (
                <div className="text-center">
                    <div className="menu-rule menu-rule--awning" aria-hidden="true" style={{ height: 34, WebkitMaskSize: '18px 34px', maskSize: '18px 34px' }} />
                    <H className="menu-h mt-7" style={{ fontSize, lineHeight: 1.02, textAlign: 'center' }}>{name}</H>
                    {sub && <p className="menu-label mt-3">{sub}</p>}
                </div>
            );
        case 'cartouche':
            return (
                <div className={centered ? 'text-center' : ''} style={{ paddingInline: 12 }}>
                    <div className="menu-head--cartouche">
                        <H
                            style={{
                                fontFamily: 'var(--menu-font-accent)', fontWeight: 400, fontSize: `calc(${fontSize} * 1.05)`,
                                lineHeight: 1.05, color: 'var(--menu-text)', textAlign: 'center', padding: '0 0.1em',
                            }}
                        >
                            {name}
                        </H>
                        {sub && <p className="mt-2" style={{ color: 'var(--menu-muted)', fontStyle: 'italic', fontSize: '0.92rem', textAlign: 'center' }}>{sub}</p>}
                    </div>
                </div>
            );
        case 'sticker':
            return (
                <div className={centered ? 'text-center' : ''} style={{ padding: '6px 6px 0' }}>
                    <div className="menu-head--sticker">
                        <H className="menu-h" style={{ fontSize: `calc(${fontSize} * 0.86)`, lineHeight: 1, textAlign: 'left' }}>{name}</H>
                    </div>
                    {sub && <p className="mt-4" style={{ fontWeight: 700, fontSize: '0.95rem', color: 'inherit' }}>{sub}</p>}
                </div>
            );
        default:
            return <H className="menu-h" style={{ fontSize, lineHeight: 0.95, textAlign: centered ? 'center' : 'left' }}>{name}</H>;
    }
};

/**
 * Titolo di sezione nello stile del template (sectionHeader ≠ 'plain').
 * `index` (1-based) serve al sigillo "seal" (numerale giapponese); senza, usa l'iniziale.
 */
export const MenuSectionHeading: React.FC<{
    title: string;
    eyebrow?: string;
    centered: boolean;
    fontSize: string;
    as?: 'h1' | 'h2';
    index?: number;
}> = ({ title, eyebrow, centered, fontSize, as = 'h2', index }) => {
    const { look } = useMenuLook();
    const H = as;
    const eyebrowEl = eyebrow
        ? <p className="lp-eyebrow mb-2" style={{ textAlign: centered ? 'center' : 'left' }}>{eyebrow}</p>
        : null;
    const h = (extra?: React.CSSProperties) => (
        <H className="menu-h" style={{ fontSize, lineHeight: 1.05, ...extra }}>{title}</H>
    );

    switch (look.sectionHeader) {
        case 'ruled':
            return (
                <div>
                    {eyebrowEl}
                    <div className="menu-sh--ruled">{h({ textAlign: 'center', flex: '0 1 auto' })}</div>
                </div>
            );
        case 'band':
            return (
                <div>
                    {eyebrowEl}
                    <div className={`menu-sh--band ${centered ? 'text-center' : ''}`}>{h({ fontSize: `calc(${fontSize} * 0.78)`, textAlign: centered ? 'center' : 'left' })}</div>
                </div>
            );
        case 'label':
            return (
                <div className={centered ? 'text-center' : ''}>
                    {eyebrowEl}
                    <div className="menu-sh--label">{h({ fontSize: `calc(${fontSize} * 0.72)` })}</div>
                </div>
            );
        case 'stamp':
            return (
                <div className={centered ? 'text-center' : ''}>
                    {eyebrowEl}
                    <div className="menu-sh--stamp menu-ink">{h({ fontSize: `calc(${fontSize} * 0.72)` })}</div>
                </div>
            );
        case 'seal': {
            const mark = index ? toKanji(index) : title.trim().charAt(0).toUpperCase();
            return (
                <div>
                    {eyebrowEl}
                    <div className={`flex items-center gap-3.5 ${centered ? 'justify-center' : ''}`}>
                        <span className="menu-seal" aria-hidden="true" style={{ fontSize: `calc(${fontSize} * 0.5)` }}>{mark}</span>
                        {h()}
                    </div>
                </div>
            );
        }
        case 'sticker':
            return (
                <div className={centered ? 'text-center' : ''} style={{ paddingLeft: 4 }}>
                    {eyebrowEl}
                    <div className="menu-sh--sticker">{h({ fontSize: `calc(${fontSize} * 0.7)` })}</div>
                </div>
            );
        case 'underscore':
            return (
                <div className={`menu-sh--underscore ${centered ? 'text-center' : ''}`}>
                    {eyebrowEl}
                    {h({ fontSize: `calc(${fontSize} * 0.82)`, textAlign: centered ? 'center' : 'left' })}
                </div>
            );
        case 'arch':
            return (
                <div className="text-center">
                    <div className="relative inline-block" style={{ padding: '2.4em 1.8em 0.9em', minWidth: 'min(100%, 16em)' }}>
                        <svg aria-hidden="true" className="absolute inset-0 w-full h-full" viewBox="0 0 100 60" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                            <path d="M1 60V24C1 13 22 6 50 1C78 6 99 13 99 24V60" fill="none" stroke="var(--menu-accent)" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
                            <path d="M5 60V25.5C5 16 25 9.5 50 5.2C75 9.5 95 16 95 25.5V60" fill="none" stroke="var(--menu-accent)" strokeWidth="1" vectorEffect="non-scaling-stroke" opacity="0.55" />
                        </svg>
                        {eyebrow && <p className="menu-label mb-1.5 relative" style={{ color: 'var(--menu-emph)' }}>{eyebrow}</p>}
                        <H className="menu-h relative" style={{ fontSize, lineHeight: 1.05, textAlign: 'center' }}>{title}</H>
                    </div>
                </div>
            );
        default:
            return (
                <div className={centered ? 'text-center' : ''}>
                    {eyebrowEl}
                    {h({ textAlign: centered ? 'center' : 'left' })}
                </div>
            );
    }
};
