import React from 'react';
import { MENU_TEMPLATES } from '../Client/menuTemplates';

/*
 * Riproduzioni in HTML/CSS delle schermate reali del prodotto (non abbiamo screenshot).
 * I contenuti (piatti, prezzi, tavoli) sono esempi illustrativi.
 * Ogni mockup è decorativo per gli screen reader: la descrizione sta nella figcaption.
 */

const Caption: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <figcaption className={`eyebrow mt-4 ${className}`}>{children}</figcaption>
);

// ─── Telefono con menu digitale (template "Classico") ───────────────────────────
export const PhoneMenuMockup: React.FC<{ className?: string }> = ({ className = '' }) => {
    const items: [string, string, string?][] = [
        ['Tagliere di salumi', '14,00'],
        ['Tagliatelle al ragù', '12,50', 'Glutine · Uova'],
        ['Margherita DOP', '8,00', 'Glutine · Latte'],
        ['Tiramisù della casa', '6,00'],
    ];
    return (
        <div className={className} aria-hidden="true">
            <div className="relative mx-auto w-[260px] sm:w-[280px] rounded-[38px] bg-[#16130f] p-[10px] shadow-[0_30px_60px_-20px_rgba(26,23,19,0.45)]">
                <div className="absolute left-1/2 top-[14px] h-[18px] w-[86px] -translate-x-1/2 rounded-full bg-[#16130f] z-10" />
                <div className="overflow-hidden rounded-[30px] bg-[#f4eee2] text-[#1f1a14]">
                    <div className="px-5 pt-10 pb-4 text-center border-b border-[#1f1a14]/15">
                        <div className="text-[10px] tracking-[0.25em] uppercase text-[#5b5143]">Menu · Tavolo 7</div>
                        <div className="mt-1 text-[22px] leading-tight" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontWeight: 600 }}>
                            Osteria del Borgo
                        </div>
                    </div>
                    <div className="flex gap-4 overflow-hidden px-5 py-2 text-[11px] border-b-[3px] border-double border-[#1f1a14]/40 whitespace-nowrap">
                        <span className="font-semibold border-b border-[#7a2318] text-[#7a2318]">I · Antipasti</span>
                        <span className="text-[#5b5143]">II · Primi</span>
                        <span className="text-[#5b5143]">III · Pizze</span>
                    </div>
                    <ul className="px-5 py-3 space-y-3" style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}>
                        {items.map(([name, price, allergens]) => (
                            <li key={name}>
                                <div className="flex items-baseline text-[15px] font-semibold">
                                    <span>{name}</span>
                                    <span className="leaders" />
                                    <span>€ {price}</span>
                                </div>
                                {allergens && <div className="text-[10px] font-sans text-[#5b5143] mt-0.5">{allergens}</div>}
                            </li>
                        ))}
                    </ul>
                    <div className="mx-3 mb-3 mt-1 flex items-center justify-between bg-[#7a2318] px-4 py-3 text-[12px] text-[#faf6ee]">
                        <span>3 articoli</span>
                        <span className="font-semibold">Ordina · € 34,50</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Comanda stampata in cucina ─────────────────────────────────────────────────
export const TicketMockup: React.FC<{ className?: string; compact?: boolean }> = ({ className = '', compact }) => (
    <div className={`ticket-wrap ${className}`} aria-hidden="true">
        <div className={`ticket ${compact ? 'w-[210px] text-[11px]' : 'w-[250px] text-[12px]'} px-4 pt-4 leading-[1.5]`}>
            <div className="text-center">Osteria del Borgo</div>
            <div>==========================</div>
            <div className="font-bold text-[1.6em] leading-tight">TAVOLO 7</div>
            <div className="flex justify-between"><span>20:41</span><span>#0142</span></div>
            <div>--------------------------</div>
            <div className="font-bold">[ PRIMI ]</div>
            <div className="font-bold">2x Tagliatelle al ragù</div>
            <div className="font-bold mt-1.5">[ PIZZE ]</div>
            <div className="font-bold">1x Margherita DOP</div>
            <div className="pl-3">- senza basilico</div>
            <div className="pl-3">+ bufala</div>
            <div className="font-bold mt-1.5">[ ANTIPASTI ]</div>
            <div className="font-bold">1x Tagliere di salumi</div>
            <div className="pl-3">Note: da dividere</div>
            <div>--------------------------</div>
            <div className="flex justify-between"><span>Articoli: 4</span><span>#0142</span></div>
        </div>
    </div>
);

// ─── Board ordini (dashboard) ───────────────────────────────────────────────────
export const OrdersBoardMockup: React.FC = () => {
    const cols: { title: string; orders: { id: string; where: string; lines: string[]; tag?: string }[] }[] = [
        { title: 'Nuovi', orders: [
            { id: '#0143', where: 'Tavolo 3', lines: ['2x Spritz', '1x Patatine'] },
            { id: '#0144', where: 'Asporto 20:30', lines: ['3x Margherita'], tag: 'Pagato online' },
        ] },
        { title: 'In preparazione', orders: [
            { id: '#0142', where: 'Tavolo 7', lines: ['2x Tagliatelle', '1x Margherita'] },
        ] },
        { title: 'Pronti', orders: [
            { id: '#0139', where: 'Tavolo 12', lines: ['1x Tiramisù'] },
        ] },
    ];
    return (
        <figure className="m-0">
            <div aria-hidden="true" className="border-[1.5px] border-[var(--ink)] bg-[var(--card)]">
                <div className="flex items-center justify-between border-b-[1.5px] border-[var(--ink)] px-4 py-2.5">
                    <span className="text-[13px] font-semibold">Ordini</span>
                    <span className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
                        <span className="h-2 w-2 rounded-full bg-[var(--olive)]" /> Connesso
                    </span>
                </div>
                <div className="grid grid-cols-3 divide-x divide-[var(--rule)]">
                    {cols.map(col => (
                        <div key={col.title} className="p-2.5 sm:p-3 min-w-0">
                            <div className="eyebrow !text-[10px] mb-2 truncate">{col.title} · {col.orders.length}</div>
                            <div className="space-y-2">
                                {col.orders.map(o => (
                                    <div key={o.id} className="border border-[var(--rule)] bg-[var(--paper)] p-2 text-[11px] leading-snug">
                                        <div className="flex justify-between gap-1 font-semibold"><span className="truncate">{o.where}</span><span className="f-mono text-[10px] text-[var(--muted)] hidden sm:inline">{o.id}</span></div>
                                        {o.lines.map(l => <div key={l} className="truncate text-[var(--ink-2)]">{l}</div>)}
                                        {o.tag && <div className="mt-1 inline-block bg-[var(--olive)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--paper)]">{o.tag}</div>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <Caption>Fig. 2 — La schermata ordini si aggiorna da sola quando arriva una comanda</Caption>
        </figure>
    );
};

// ─── Cassa con sconto "Prezzo finale" e tessera ─────────────────────────────────
export const CassaMockup: React.FC = () => (
    <figure className="m-0">
        <div aria-hidden="true" className="border-[1.5px] border-[var(--ink)] bg-[var(--card)] text-[13px]">
            <div className="flex items-baseline justify-between border-b border-[var(--rule)] px-4 py-3">
                <span className="font-semibold">Tavolo 7 · Conto</span>
                <span className="f-mono text-[11px] text-[var(--muted)]">4 coperti</span>
            </div>
            <ul className="px-4 py-3 space-y-1.5">
                {[['2x Tagliatelle al ragù', '25,00'], ['1x Margherita DOP', '8,00'], ['1x Tagliere di salumi', '14,00'], ['4x Acqua 0,75', '10,00']].map(([n, p]) => (
                    <li key={n} className="flex"><span>{n}</span><span className="leaders" /><span className="f-mono">{p}</span></li>
                ))}
            </ul>
            <div className="border-t border-[var(--rule)] px-4 py-3 space-y-3">
                <div className="flex items-center gap-2">
                    <span className="text-[var(--muted)] mr-1">Sconto</span>
                    <div className="flex border border-[var(--rule)] text-[11px] font-semibold">
                        <span className="px-2 py-1 text-[var(--muted)]">Percentuale</span>
                        <span className="px-2 py-1 bg-[var(--ink)] text-[var(--paper)]">Prezzo finale</span>
                    </div>
                    <span className="ml-auto f-mono border-b border-[var(--ink)] px-1">55,00</span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                    <span className="text-[var(--muted)]">Tessera fedeltà · Carta punti</span>
                    <span className="f-mono text-[var(--olive)] font-semibold">+55 punti</span>
                </div>
                <div className="flex items-baseline justify-between border-t-[3px] border-double border-[var(--ink)] pt-2">
                    <span className="text-[var(--muted)]">Totale <s className="ml-1 f-mono">57,00</s></span>
                    <span className="f-display text-[28px] leading-none">€ 55,00</span>
                </div>
                <div className="bg-[var(--ink)] py-2.5 text-center text-[13px] font-semibold text-[var(--paper)]">Chiudi conto</div>
            </div>
        </div>
        <Caption>Fig. 4 — Cassa: sconto in percentuale o direttamente sul prezzo finale</Caption>
    </figure>
);

// ─── Tessera fedeltà a timbri ───────────────────────────────────────────────────
export const StampCardMockup: React.FC = () => (
    <figure className="m-0">
        <div aria-hidden="true" className="relative max-w-[340px] bg-[var(--olive)] p-5 text-[var(--paper)]">
            <div className="flex items-start justify-between">
                <div>
                    <div className="eyebrow !text-[rgba(243,238,228,0.75)]">Carta timbri</div>
                    <div className="f-display text-[22px] mt-1">Bar Centrale</div>
                </div>
                <div className="grid grid-cols-5 gap-[2px] bg-[var(--paper)] p-1.5" title="QR">
                    {Array.from({ length: 25 }).map((_, i) => (
                        <span key={i} className={`block h-[6px] w-[6px] ${[0,1,2,4,5,7,9,10,12,14,15,17,19,20,21,22,24].includes(i) ? 'bg-[#1a1713]' : 'bg-transparent'}`} />
                    ))}
                </div>
            </div>
            <div className="mt-5 grid grid-cols-5 gap-2.5">
                {Array.from({ length: 10 }).map((_, i) => (
                    <span key={i} className={`flex aspect-square items-center justify-center rounded-full border-[1.5px] border-[var(--paper)] text-[11px] f-mono ${i < 7 ? 'bg-[var(--paper)] text-[var(--olive)]' : 'opacity-60'}`}>
                        {i < 7 ? '✓' : i + 1}
                    </span>
                ))}
            </div>
            <div className="mt-4 text-[12px] opacity-85">7 di 10 · al decimo caffè, uno offerto</div>
        </div>
        <Caption>Fig. 5 — Tessera a timbri: il cliente la riceve via email e ne controlla lo stato dal QR</Caption>
    </figure>
);

// ─── Libreria template (dati reali da menuTemplates.ts) ─────────────────────────
export const TemplateStrip: React.FC = () => (
    <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-6">
        {MENU_TEMPLATES.map(t => (
            <li key={t.key}>
                <div
                    aria-hidden="true"
                    className="h-[120px] border border-black/10 p-3 flex flex-col justify-between"
                    style={{ background: t.palette.bg, color: t.palette.text }}
                >
                    <div className="text-[18px] leading-tight truncate" style={{ fontFamily: t.fonts.display }}>
                        {t.label}
                    </div>
                    <div className="space-y-1" style={{ fontFamily: t.fonts.body }}>
                        <div className="flex items-baseline text-[11px]">
                            <span>Piatto del giorno</span>
                            <span className="leaders" />
                            <span style={{ fontFamily: t.fonts.price ?? t.fonts.body }}>12</span>
                        </div>
                        <div className="flex gap-1">
                            <span className="h-2.5 w-6" style={{ background: t.palette.accent }} />
                            <span className="h-2.5 w-6" style={{ background: t.palette.secondary }} />
                            <span className="h-2.5 w-6 border border-black/10" style={{ background: t.palette.card }} />
                        </div>
                    </div>
                </div>
                <div className="mt-2 text-[14px] font-semibold">{t.label}</div>
                <p className="text-[13px] leading-snug text-[var(--muted)] line-clamp-2">{t.description}</p>
            </li>
        ))}
    </ul>
);
