import React, { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/*
 * Schemi tecnici in SVG disegnati a mano (nessuna immagine).
 * I contenuti (tavoli, orari, importi) sono esempi illustrativi.
 */

const STROKE = { fill: 'none', stroke: 'var(--ink)', strokeWidth: 1.25, vectorEffect: 'non-scaling-stroke' as const };
/** I tratti animati con pathLength non possono usare non-scaling-stroke (i trattini sarebbero in px schermo). */
const DRAWN = { fill: 'none', stroke: 'var(--ink)', strokeWidth: 1.25 };

// ─── Hero: mini schema in loop + log eventi ────────────────────────────────────
const HERO_NODES = [
    { x: 30, label: 'QR T07' },
    { x: 130, label: 'CLIENTE' },
    { x: 230, label: 'CUCINA' },
    { x: 330, label: 'CASSA' },
];
const HERO_LOG: [string, string, string][] = [
    ['19:42:07', 'T07', 'ordine inviato · 2 articoli'],
    ['19:42:08', 'CUCINA', 'comanda stampata'],
    ['19:58:31', 'SALA', 'piatto pronto, notifica al cameriere'],
    ['20:31:12', 'CASSA', 'conto chiuso · 23,50 €'],
];

const HeroIcon: React.FC<{ i: number; on: boolean }> = ({ i, on }) => {
    const c = on ? 'var(--accent)' : 'var(--ink)';
    const s = { ...STROKE, stroke: c };
    const x = HERO_NODES[i].x;
    switch (i) {
        case 0: // QR
            return (
                <g>
                    <rect x={x - 9} y={33} width={7} height={7} fill={c} />
                    <rect x={x + 2} y={33} width={7} height={7} fill={c} />
                    <rect x={x - 9} y={44} width={7} height={7} fill={c} />
                    <rect x={x + 4} y={46} width={3} height={3} fill={c} />
                </g>
            );
        case 1: // telefono
            return <g><rect x={x - 7} y={30} width={14} height={24} rx={2.5} {...s} /><path d={`M${x - 2} ${50}h4`} {...s} /></g>;
        case 2: // stampante
            return <g><rect x={x - 10} y={33} width={20} height={11} rx={1.5} {...s} /><path d={`M${x - 6} 44v10h12V44`} {...s} /><path d={`M${x - 3} 48h6M${x - 3} 51h4`} {...s} /></g>;
        default: // cassa
            return <g><rect x={x - 10} y={31} width={20} height={14} rx={1.5} {...s} /><path d={`M${x - 3} 45l-1 6M${x + 3} 45l1 6M${x - 7} 52h14`} {...s} /></g>;
    }
};

export const HeroSchematic: React.FC = () => {
    const reduce = useReducedMotion();
    const [tick, setTick] = useState(reduce ? HERO_LOG.length - 1 : 0);
    useEffect(() => {
        if (reduce) return;
        const t = window.setInterval(() => setTick(v => (v + 1) % (HERO_LOG.length + 1)), 1700);
        return () => window.clearInterval(t);
    }, [reduce]);
    // tick 0..3 = nodo attivo; 4 = pausa (tutto acceso) prima di ripartire
    const active = Math.min(tick, HERO_LOG.length - 1);
    const all = tick === HERO_LOG.length || !!reduce;

    return (
        <figure className="m-0 border border-[var(--ink)] bg-[var(--bg)]">
            <div className="flex items-center justify-between border-b border-[var(--rule)] px-4 py-2.5">
                <span className="label">Esempio · venerdì sera</span>
                <span className="label flex items-center gap-2">
                    <span className="inline-block h-[6px] w-[6px] bg-[var(--accent)]" aria-hidden="true" /> In servizio
                </span>
            </div>
            <div className="px-3 pt-4 sm:px-5">
                <svg viewBox="0 0 360 82" className="w-full h-auto" aria-hidden="true" focusable="false">
                    <path d="M30 42H330" stroke="var(--rule-2)" strokeWidth={1} strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
                    <motion.path
                        d="M30 42H330"
                        stroke="var(--ink)"
                        strokeWidth={1}
                        fill="none"
                        initial={false}
                        animate={{ pathLength: all ? 1 : active / 3 }}
                        transition={{ duration: reduce ? 0 : 0.9, ease: [0.4, 0, 0.2, 1] }}
                    />
                    {HERO_NODES.map((n, i) => {
                        const on = !all && i === active;
                        const reached = all || i <= active;
                        return (
                            <g key={n.label}>
                                <rect x={n.x - 18} y={24} width={36} height={36} fill="var(--bg)"
                                      stroke={on ? 'var(--accent)' : reached ? 'var(--ink)' : 'var(--rule-2)'}
                                      strokeWidth={on ? 1.5 : 1} vectorEffect="non-scaling-stroke" />
                                <HeroIcon i={i} on={on} />
                                <text x={n.x} y={76} textAnchor="middle" fontFamily="var(--f-mono)" fontSize={8.5} letterSpacing="0.06em"
                                      fill={reached ? 'var(--ink)' : 'var(--faint)'}>{n.label}</text>
                                <text x={n.x - 18} y={16} fontFamily="var(--f-mono)" fontSize={7.5} fill={on ? 'var(--accent-text)' : 'var(--faint)'}>
                                    {String(i + 1).padStart(2, '0')}
                                </text>
                            </g>
                        );
                    })}
                    {!all && (
                        <motion.rect
                            width={6} height={6} y={39} fill="var(--accent)"
                            initial={false}
                            animate={{ x: HERO_NODES[active].x - 3 }}
                            transition={{ duration: reduce ? 0 : 0.9, ease: [0.4, 0, 0.2, 1] }}
                        />
                    )}
                </svg>
            </div>
            <ol className="mono mt-3 border-t border-[var(--rule)] px-4 py-3 text-[12px] leading-[1.45] sm:px-5" aria-label="Esempio di registro eventi di un ordine">
                {HERO_LOG.map(([t, where, msg], i) => (
                    <li key={t} className={`log-row grid grid-cols-[62px_54px_1fr] gap-x-2 py-[3px] ${all || i <= active ? 'on' : ''}`}>
                        <span className="tnum text-[var(--muted)]">{t}</span>
                        <span className="flex items-center gap-1.5"><span className="log-dot" aria-hidden="true" />{where}</span>
                        <span className="text-[var(--ink-2)]">{msg}</span>
                    </li>
                ))}
            </ol>
        </figure>
    );
};

// ─── Glifi dei ruoli (si disegnano entrando nello schermo) ─────────────────────
const DrawIn: React.FC<{ d: string; delay?: number; accent?: boolean }> = ({ d, delay = 0, accent }) => {
    const reduce = useReducedMotion();
    return (
        <motion.path
            d={d}
            {...DRAWN}
            stroke={accent ? 'var(--accent)' : 'var(--ink)'}
            strokeWidth={accent ? 1.5 : 1.25}
            strokeLinecap="square"
            initial={reduce ? false : { pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, margin: '-15% 0px' }}
            transition={{ duration: 0.9, delay, ease: [0.4, 0, 0.2, 1] }}
        />
    );
};

export const RoleGlyph: React.FC<{ role: 'cliente' | 'cameriere' | 'titolare'; className?: string }> = ({ role, className = '' }) => (
    <svg viewBox="0 0 96 64" className={className} aria-hidden="true" focusable="false">
        <path d="M0 63.5H96" stroke="var(--rule)" vectorEffect="non-scaling-stroke" />
        {role === 'cliente' && (
            <>
                <DrawIn d="M8 14h20v20H8z" />
                <DrawIn d="M12 18h5v5h-5zM19 27h5v3h-5z" delay={0.2} />
                <DrawIn d="M34 24H52" delay={0.35} accent />
                <DrawIn d="M58 4h26a4 4 0 0 1 4 4v48a4 4 0 0 1-4 4H58a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z" delay={0.4} />
                <DrawIn d="M60 16h18M60 24h22M60 32h14M60 46h22" delay={0.7} />
            </>
        )}
        {role === 'cameriere' && (
            <>
                <DrawIn d="M10 4h26a4 4 0 0 1 4 4v48a4 4 0 0 1-4 4H10a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z" />
                <DrawIn d="M11 12h24v12H11z" delay={0.35} accent />
                <DrawIn d="M11 32h7v6h-7zM20 32h7v6h-7zM29 32h6v6h-6zM11 41h7v6h-7zM20 41h7v6h-7z" delay={0.55} />
                <DrawIn d="M52 30h36M52 30l6-6M52 30l6 6" delay={0.7} />
            </>
        )}
        {role === 'titolare' && (
            <>
                <DrawIn d="M4 6h88v46H4z" />
                <DrawIn d="M4 16h88M28 16v36" delay={0.3} />
                <DrawIn d="M36 44V36M46 44V28M56 44V32M66 44V24" delay={0.6} accent />
                <DrawIn d="M10 24h12M10 30h10M10 36h12M38 58h20" delay={0.75} />
            </>
        )}
    </svg>
);

// ─── Pagamenti: il denaro non passa dalla piattaforma ──────────────────────────
export const PaymentsDiagram: React.FC = () => {
    const reduce = useReducedMotion();
    const draw = (delay: number) => ({
        initial: reduce ? false : { pathLength: 0 },
        whileInView: { pathLength: 1 },
        viewport: { once: true, margin: '-20% 0px' },
        transition: { duration: 0.8, delay, ease: [0.4, 0, 0.2, 1] as const },
    });
    const fade = (delay: number) => ({
        initial: reduce ? false : { opacity: 0 },
        whileInView: { opacity: 1 },
        viewport: { once: true, margin: '-20% 0px' },
        transition: { duration: 0.4, delay },
    });
    const ink = 'var(--dark-ink)';
    const line = { fill: 'none', stroke: ink, strokeWidth: 1 };
    const t = { fontFamily: 'var(--f-mono)', fontSize: 10, letterSpacing: '0.06em', fill: ink };
    const tm = { ...t, fill: 'var(--dark-muted)' };

    return (
        <svg viewBox="0 0 360 220" className="w-full h-auto" role="img"
             aria-label="Il pagamento va dal telefono del cliente all'account Stripe o SumUp del locale e poi sul conto del locale. La piattaforma non è nel percorso del denaro.">
            {/* Piattaforma: fuori dal percorso */}
            <motion.g {...fade(0.9)}>
                <rect x={112} y={8} width={136} height={40} fill="none" stroke="var(--dark-muted)" strokeDasharray="3 3" vectorEffect="non-scaling-stroke" />
                <text x={180} y={25} textAnchor="middle" {...tm}>PIATTAFORMA</text>
                <text x={180} y={39} textAnchor="middle" {...t} fontSize={8.5} fill="var(--accent)">0% SUGLI INCASSI</text>
                <path d="M180 48V82" stroke="var(--dark-muted)" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
                <path d="M174 70l12 8M186 70l-12 8" stroke="var(--accent)" strokeWidth={1.5} vectorEffect="non-scaling-stroke" />
            </motion.g>

            {/* Cliente */}
            <motion.path d="M14 96h40a4 4 0 0 1 4 4v80a4 4 0 0 1-4 4H14a4 4 0 0 1-4-4v-80a4 4 0 0 1 4-4z" {...line} {...draw(0)} />
            <motion.g {...fade(0.3)}>
                <text x={34} y={204} textAnchor="middle" {...tm}>CLIENTE</text>
                <rect x={18} y={160} width={32} height={12} fill="var(--accent)" />
                <text x={34} y={169} textAnchor="middle" fontFamily="var(--f-sans)" fontSize={8} fontWeight={600} fill="#fff">Paga</text>
                <text x={34} y={120} textAnchor="middle" {...t} fontSize={8} letterSpacing="0">23,50 €</text>
            </motion.g>

            <motion.path d="M58 140H126" {...line} strokeWidth={1.25} {...draw(0.4)} />

            {/* Account del locale */}
            <motion.path d="M126 96h108v88H126z" {...line} {...draw(0.6)} />
            <motion.g {...fade(0.9)}>
                <text x={180} y={124} textAnchor="middle" {...t}>STRIPE</text>
                <text x={180} y={140} textAnchor="middle" {...tm}>oppure</text>
                <text x={180} y={156} textAnchor="middle" {...t}>SUMUP</text>
                <text x={180} y={204} textAnchor="middle" {...tm}>ACCOUNT DEL LOCALE</text>
            </motion.g>

            <motion.path d="M234 140H298" {...line} strokeWidth={1.25} {...draw(1.0)} />

            {/* Conto */}
            <motion.path d="M298 112h52v56h-52zM298 124h52" {...line} {...draw(1.2)} />
            <motion.g {...fade(1.5)}>
                <text x={324} y={150} textAnchor="middle" {...t}>IBAN</text>
                <text x={324} y={204} textAnchor="middle" {...tm}>TUO CONTO</text>
            </motion.g>
        </svg>
    );
};
