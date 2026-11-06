import React, { useMemo, useRef, useState } from 'react';
import {
    AnimatePresence,
    motion,
    useMotionValue,
    useMotionValueEvent,
    useReducedMotion,
    useScroll,
    useTransform,
    type MotionValue,
} from 'framer-motion';

/*
 * Il flusso di un ordine, disegnato a mano in SVG e costruito con lo scroll.
 * Un'unica MotionValue `p` (0 → 7) guida tutto: ogni passo occupa un'unità.
 * Nessun re-render per frame: linee e gruppi leggono `p` tramite useTransform.
 * Con prefers-reduced-motion il diagramma è mostrato già completo e i passi come lista.
 */

export const FLOW_STEPS: { tag: string; title: string; text: string }[] = [
    {
        tag: 'Tavolo',
        title: 'Il QR del tavolo',
        text: 'Ogni tavolo ha il suo QR, generato e stampato dalla dashboard. Il cliente lo inquadra con la fotocamera e il menu si apre nel browser, già associato al tavolo 7. Nessuna app da scaricare.',
    },
    {
        tag: 'Cliente',
        title: 'Il menu sul telefono',
        text: 'Nella sua lingua, con ingredienti e allergeni. Aggiunge la bufala, toglie il miele. Se in cucina finisce il tiramisù, sul menu risulta esaurito in quel momento.',
    },
    {
        tag: 'Ordine',
        title: 'Il tavolo ordina insieme',
        text: 'Ognuno sceglie dal proprio telefono. Quando tutti hanno premuto “Sono pronto”, parte un’unica comanda. Il cliente ne segue lo stato in diretta: ricevuto, in preparazione, pronto.',
    },
    {
        tag: 'Cucina',
        title: 'La comanda esce stampata',
        text: 'Sulla stampante termica del reparto giusto, con Star CloudPRNT o ESC/POS, oppure su un tablet Android con RawBT. Aggiunte e rimozioni sono scritte in chiaro.',
    },
    {
        tag: 'Sala',
        title: 'Il cameriere riceve la notifica',
        text: 'Una notifica push sul telefono quando arriva un ordine o un piatto è pronto. Sulla mappa della sala vede quali tavoli sono occupati e chi sta aspettando.',
    },
    {
        tag: 'Cassa',
        title: 'Il conto si chiude in cassa',
        text: 'Conto per tavolo, sconto in percentuale o scrivendo il prezzo finale, punti caricati sulla tessera fedeltà. Gli ordini già pagati online non vengono contati due volte.',
    },
    {
        tag: 'Pagamento',
        title: 'I soldi arrivano a te',
        text: 'Se attivi i pagamenti online, il cliente paga dal telefono con Stripe o SumUp, sul tuo account. Sulle transazioni non tratteniamo nulla.',
    },
];

const N = FLOW_STEPS.length; // 7

// ─── Geometria ──────────────────────────────────────────────────────────────────
type Pt = [number, number];
const rr = (x: number, y: number, w: number, h: number, r: number) =>
    `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}` +
    `H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;
const poly = (pts: Pt[]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0]} ${p[1]}`).join('');

const SEGMENTS: { from: number; to: number; pts: Pt[] }[] = [
    { from: 1.0, to: 1.35, pts: [[98, 104], [152, 104]] },
    { from: 2.35, to: 2.85, pts: [[252, 70], [296, 70]] },
    { from: 4.0, to: 4.45, pts: [[274, 70], [274, 340], [312, 340]] },
    { from: 5.0, to: 5.3, pts: [[312, 400], [252, 400]] },
    { from: 6.0, to: 6.3, pts: [[152, 372], [104, 372]] },
];

function pointOn(pts: Pt[], t: number): Pt {
    const lens = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]));
    const total = lens.reduce((a, b) => a + b, 0);
    let d = Math.max(0, Math.min(1, t)) * total;
    for (let i = 0; i < lens.length; i++) {
        if (d <= lens[i] || i === lens.length - 1) {
            const k = lens[i] ? Math.min(1, d / lens[i]) : 0;
            return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * k, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * k];
        }
        d -= lens[i];
    }
    return pts[pts.length - 1];
}
function head(v: number): { pt: Pt; on: boolean } {
    for (const s of SEGMENTS) {
        if (v >= s.from && v <= s.to + 0.04) return { pt: pointOn(s.pts, (v - s.from) / (s.to - s.from)), on: true };
    }
    return { pt: [0, 0], on: false };
}

/** QR 21×21 deterministico: tre "occhi", linee di temporizzazione, moduli pseudo-casuali. */
function qrPath(x0: number, y0: number, m: number): string {
    const S = 21;
    const on = (r: number, c: number): boolean => {
        const finder = (fr: number, fc: number) => {
            const rr2 = r - fr, cc = c - fc;
            if (rr2 < -1 || rr2 > 7 || cc < -1 || cc > 7) return null;
            if (rr2 === -1 || rr2 === 7 || cc === -1 || cc === 7) return false;
            if (rr2 === 0 || rr2 === 6 || cc === 0 || cc === 6) return true;
            return rr2 >= 2 && rr2 <= 4 && cc >= 2 && cc <= 4;
        };
        for (const [fr, fc] of [[0, 0], [0, 14], [14, 0]] as const) {
            const f = finder(fr, fc);
            if (f !== null) return f;
        }
        if (r === 6) return c % 2 === 0;
        if (c === 6) return r % 2 === 0;
        const h = Math.sin(r * 12.9898 + c * 78.233) * 43758.5453;
        return h - Math.floor(h) > 0.52;
    };
    let d = '';
    for (let r = 0; r < S; r++) for (let c = 0; c < S; c++) {
        if (on(r, c)) d += `M${(x0 + c * m).toFixed(2)} ${(y0 + r * m).toFixed(2)}h${m}v${m}h-${m}z`;
    }
    return d;
}

// ─── Primitivi animati ──────────────────────────────────────────────────────────
const useRange = (p: MotionValue<number>, a: number, b: number) => useTransform(p, [a, b], [0, 1]);

const Draw: React.FC<{ d: string; v: MotionValue<number>; stroke?: string; width?: number; fill?: string }> = ({ d, v, stroke = 'var(--ink)', width = 1.1, fill = 'none' }) => {
    const opacity = useTransform(v, x => (x > 0.001 ? 1 : 0));
    return (
        <motion.path
            d={d}
            fill={fill}
            stroke={stroke}
            strokeWidth={width}
            strokeLinejoin="round"
            style={{ pathLength: v, opacity }}
        />
    );
};

const Reveal: React.FC<{ v: MotionValue<number>; dy?: number; children: React.ReactNode }> = ({ v, dy = 5, children }) => {
    const y = useTransform(v, [0, 1], [dy, 0]);
    return <motion.g style={{ opacity: v, y }}>{children}</motion.g>;
};

/** Etichetta di stazione: tenue finché il passo non è raggiunto. */
const Station: React.FC<{ p: MotionValue<number>; at: number; x: number; y: number; n: string; text?: string }> = ({ p, at, x, y, n, text }) => {
    const fill = useTransform(p, v => (v >= at ? 'var(--ink)' : 'var(--faint)'));
    const numFill = useTransform(p, v => (v >= at ? 'var(--accent-text)' : 'var(--faint)'));
    return (
        <text x={x} y={y} fontFamily="var(--f-mono)" fontSize={10} letterSpacing="0.06em">
            <motion.tspan style={{ fill: numFill }}>{n}</motion.tspan>
            {text && <motion.tspan dx={6} style={{ fill }}>{text}</motion.tspan>}
        </text>
    );
};

const T: React.FC<React.SVGProps<SVGTextElement> & { mono?: boolean }> = ({ mono, children, ...rest }) => (
    <text fontFamily={mono ? 'var(--f-mono)' : 'var(--f-sans)'} fill="var(--ink)" {...rest}>{children}</text>
);

// ─── Diagramma ──────────────────────────────────────────────────────────────────
export const FlowSVG: React.FC<{ p: MotionValue<number>; className?: string }> = ({ p, className = '' }) => {
    const qr = useMemo(() => qrPath(33, 62, 2.6), []);

    // 01 — tavolo
    const tableLine = useRange(p, 0.0, 0.3);
    const tentLine = useRange(p, 0.05, 0.45);
    const qrCover = useTransform(p, [0.2, 0.85], [1, 0]);
    const scanY = useTransform(p, [0.2, 0.85], [62, 116.6]);
    const scanO = useTransform(p, v => (v > 0.2 && v < 0.9 ? 1 : 0));
    const tableLabel = useRange(p, 0.5, 0.8);

    // 02 — cliente
    const phone = useRange(p, 1.05, 1.5);
    const phHead = useRange(p, 1.3, 1.5);
    const row1 = useRange(p, 1.4, 1.58);
    const row2 = useRange(p, 1.52, 1.7);
    const row3 = useRange(p, 1.64, 1.82);
    const soldOut = useRange(p, 1.8, 1.95);

    // 03 — ordine
    const ready = useRange(p, 2.0, 2.25);
    const readyBtn = useRange(p, 2.15, 2.35);
    const printer = useRange(p, 2.45, 2.9);

    // 04 — cucina
    const led = useTransform(p, v => (v >= 3.0 ? 1 : 0.15));
    const ticketCover = useTransform(p, [3.05, 3.9], [1, 0]);

    // 05 — sala
    const waiter = useRange(p, 4.1, 4.55);
    const map = useRange(p, 4.4, 4.7);
    const notif = useRange(p, 4.55, 4.85);

    // 06 — cassa
    const cassa = useRange(p, 5.05, 5.45);
    const bill1 = useRange(p, 5.35, 5.55);
    const bill2 = useRange(p, 5.48, 5.68);
    const total = useRange(p, 5.62, 5.82);
    const points = useRange(p, 5.8, 5.95);

    // 07 — pagamento
    const card = useRange(p, 6.05, 6.45);
    const cardTxt = useRange(p, 6.3, 6.5);
    const check = useRange(p, 6.5, 6.8);
    const checkTxt = useRange(p, 6.65, 6.9);

    const seg = [
        useRange(p, SEGMENTS[0].from, SEGMENTS[0].to),
        useRange(p, SEGMENTS[1].from, SEGMENTS[1].to),
        useRange(p, SEGMENTS[2].from, SEGMENTS[2].to),
        useRange(p, SEGMENTS[3].from, SEGMENTS[3].to),
        useRange(p, SEGMENTS[4].from, SEGMENTS[4].to),
    ];
    const junction = useTransform(p, v => (v >= 4.0 ? 1 : 0));
    const hx = useTransform(p, v => head(v).pt[0]);
    const hy = useTransform(p, v => head(v).pt[1]);
    const hO = useTransform(p, v => (head(v).on ? 1 : 0));

    const ticketEdge = (() => {
        let d = 'M312 96V236';
        for (let x = 312; x < 392; x += 8) d += `L${x + 4} 241L${x + 8} 236`;
        return d + 'V96';
    })();

    return (
        <svg viewBox="0 -16 420 486" preserveAspectRatio="xMidYMin meet" className={className} role="img" aria-label="Schema del percorso di un ordine: QR sul tavolo, menu sul telefono del cliente, comanda stampata in cucina, notifica al cameriere, conto in cassa, pagamento sul conto del locale.">

            {/* Tracce tenui: lo schema è visibile prima di essere disegnato */}
            <g fill="none" stroke="var(--rule-2)" strokeWidth={1} strokeDasharray="2 3" vectorEffect="non-scaling-stroke">
                {SEGMENTS.map((s, i) => <path key={i} d={poly(s.pts)} vectorEffect="non-scaling-stroke" />)}
                <path d={rr(22, 52, 76, 104, 3)} vectorEffect="non-scaling-stroke" />
                <path d={rr(152, 20, 100, 192, 14)} vectorEffect="non-scaling-stroke" />
                <path d={rr(296, 44, 112, 52, 4)} vectorEffect="non-scaling-stroke" />
                <path d={rr(312, 290, 88, 168, 12)} vectorEffect="non-scaling-stroke" />
                <path d={rr(152, 318, 100, 92, 4)} vectorEffect="non-scaling-stroke" />
                <path d={rr(14, 328, 90, 56, 5)} vectorEffect="non-scaling-stroke" />
            </g>

            {/* Etichette di stazione */}
            <Station p={p} at={0} x={22} y={38} n="01" text="TAVOLO" />
            <Station p={p} at={1} x={152} y={8} n="02" text="CLIENTE" />
            <Station p={p} at={2} x={258} y={60} n="03" />
            <Station p={p} at={3} x={296} y={32} n="04" text="CUCINA" />
            <Station p={p} at={4} x={312} y={280} n="05" text="SALA" />
            <Station p={p} at={5} x={152} y={306} n="06" text="CASSA" />
            <Station p={p} at={6} x={14} y={316} n="07" text="PAGAMENTO" />

            {/* Linee dell'ordine */}
            {SEGMENTS.map((s, i) => <Draw key={i} d={poly(s.pts)} v={seg[i]} stroke="var(--ink)" width={1.3} />)}
            <motion.rect x={271} y={67} width={6} height={6} fill="var(--ink)" style={{ opacity: junction }} />

            {/* 01 — tavolo con QR */}
            <Draw d="M8 166H112" v={tableLine} />
            <Draw d={rr(22, 52, 76, 104, 3)} v={tentLine} fill="var(--bg)" />
            <path d={qr} fill="var(--ink)" />
            <motion.rect x={31} y={60} width={59} height={59} fill="var(--bg)" style={{ scaleY: qrCover, originY: 1 }} />
            <motion.rect x={28} width={65} height={1.5} fill="var(--accent)" style={{ y: scanY, opacity: scanO }} />
            <Reveal v={tableLabel}>
                <T mono x={60} y={140} fontSize={9.5} textAnchor="middle" letterSpacing="0.08em">TAVOLO 07</T>
            </Reveal>

            {/* 02 — telefono del cliente */}
            <Draw d={rr(152, 20, 100, 192, 14)} v={phone} fill="var(--bg)" />
            <Reveal v={phHead}>
                <path d="M190 29H214" stroke="var(--ink)" strokeWidth={2} strokeLinecap="round" />
                <T mono x={163} y={48} fontSize={8.5} fill="var(--muted)">MENU</T>
                <T mono x={241} y={48} fontSize={8.5} fill="var(--muted)" textAnchor="end">IT EN</T>
                <path d="M163 55H241" stroke="var(--rule-2)" vectorEffect="non-scaling-stroke" />
            </Reveal>
            <Reveal v={row1}>
                <T x={163} y={72} fontSize={10.5} fontWeight={500}>Margherita</T>
                <T x={241} y={72} fontSize={10} textAnchor="end" className="tnum">9,50</T>
                <T mono x={163} y={84} fontSize={8.5} fill="var(--accent-text)">+ bufala</T>
                <path d="M163 93H241" stroke="var(--rule)" vectorEffect="non-scaling-stroke" />
            </Reveal>
            <Reveal v={row2}>
                <T x={163} y={110} fontSize={10.5} fontWeight={500}>Tagliere</T>
                <T x={241} y={110} fontSize={10} textAnchor="end">14,00</T>
                <T mono x={163} y={122} fontSize={8.5} fill="var(--muted)">– senza miele</T>
                <path d="M163 131H241" stroke="var(--rule)" vectorEffect="non-scaling-stroke" />
            </Reveal>
            <Reveal v={row3}>
                <T x={163} y={148} fontSize={10.5} fontWeight={500} fill="var(--faint)">Tiramisù</T>
                <T x={241} y={148} fontSize={10} textAnchor="end" fill="var(--faint)">6,00</T>
                <motion.g style={{ opacity: soldOut }}>
                    <path d="M163 144.5H241" stroke="var(--faint)" vectorEffect="non-scaling-stroke" />
                    <T mono x={163} y={160} fontSize={8.5} fill="var(--accent-text)">ESAURITO</T>
                </motion.g>
            </Reveal>
            <Reveal v={ready}>
                <rect x={163} y={170} width={5} height={5} fill="var(--ink)" />
                <rect x={170} y={170} width={5} height={5} fill="var(--ink)" />
                <T mono x={180} y={175} fontSize={8.5} fill="var(--muted)">2/2 PRONTI</T>
            </Reveal>
            <Reveal v={readyBtn}>
                <path d={rr(163, 181, 78, 22, 3)} fill="var(--ink)" />
                <T x={202} y={195.5} fontSize={10} fontWeight={500} textAnchor="middle" fill="#fff">Sono pronto</T>
            </Reveal>

            {/* 04 — stampante e comanda: la carta si scopre dall'alto, riga dopo riga */}
            <g>
                <path d={ticketEdge} fill="#fff" stroke="var(--ink)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                <T mono x={318} y={112} fontSize={9.5} fontWeight={500}>TAVOLO 07</T>
                <T mono x={318} y={123} fontSize={8} fill="var(--muted)">19:42 · #0142</T>
                <path d="M318 130H386" stroke="var(--ink)" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
                <T mono x={318} y={144} fontSize={8.5}>1 MARGHERITA</T>
                <T mono x={326} y={156} fontSize={8.5} fill="var(--accent-text)">+ BUFALA</T>
                <T mono x={318} y={170} fontSize={8.5}>1 TAGLIERE</T>
                <T mono x={326} y={182} fontSize={8.5}>- MIELE</T>
                <path d="M318 191H386" stroke="var(--ink)" strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
                <T mono x={318} y={204} fontSize={8} fill="var(--muted)">REPARTO CUCINA</T>
                <path d="M318 214h3v10h-3zM323 214h1v10h-1zM326 214h2v10h-2zM330 214h1v10h-1zM333 214h3v10h-3zM338 214h1v10h-1zM341 214h2v10h-2zM345 214h1v10h-1zM348 214h3v10h-3zM353 214h1v10h-1zM356 214h2v10h-2z" fill="var(--ink)" />
                <motion.rect x={305} y={95} width={94} height={152} fill="var(--bg)" style={{ scaleY: ticketCover, originY: 1 }} />
            </g>
            <Draw d={rr(296, 44, 112, 52, 4)} v={printer} fill="var(--bg)" />
            <Reveal v={printer} dy={0}>
                <path d="M306 58H398" stroke="var(--rule-2)" vectorEffect="non-scaling-stroke" />
                <T mono x={306} y={82} fontSize={8.5} fill="var(--muted)">ESC/POS · 80MM</T>
                <motion.rect x={392} y={50} width={6} height={4} fill="var(--accent)" style={{ opacity: led }} />
                <path d="M310 96H394" stroke="var(--ink)" strokeWidth={2.5} />
            </Reveal>

            {/* 05 — telefono del cameriere */}
            <Draw d={rr(312, 290, 88, 168, 12)} v={waiter} fill="var(--bg)" />
            <Reveal v={waiter} dy={0}>
                <path d="M346 298H366" stroke="var(--ink)" strokeWidth={2} strokeLinecap="round" />
                <T x={321} y={316} fontSize={10} fontWeight={600}>Ordini</T>
            </Reveal>
            <Reveal v={notif} dy={-8}>
                <path d={rr(320, 324, 72, 38, 2)} fill="var(--bg)" stroke="var(--ink)" vectorEffect="non-scaling-stroke" />
                <rect x={320} y={324} width={3} height={38} fill="var(--accent)" />
                <T x={328} y={340} fontSize={9.5} fontWeight={600}>Tavolo 07</T>
                <T mono x={328} y={353} fontSize={8} fill="var(--accent-text)">PRONTO</T>
            </Reveal>
            <Reveal v={map}>
                <T mono x={321} y={380} fontSize={8} fill="var(--muted)">MAPPA SALA</T>
                {[0, 1, 2, 3, 4, 5].map(i => {
                    const x = 321 + (i % 3) * 24;
                    const y = 388 + Math.floor(i / 3) * 22;
                    const is7 = i === 4;
                    const busy = i === 0 || i === 2;
                    return (
                        <g key={i}>
                            <rect x={x} y={y} width={20} height={16} fill={is7 ? 'var(--accent)' : busy ? 'var(--ink)' : 'var(--bg)'}
                                  stroke={is7 ? 'var(--accent)' : 'var(--ink)'} strokeWidth={1} vectorEffect="non-scaling-stroke" />
                            {is7 && <T mono x={x + 10} y={y + 11} fontSize={7.5} textAnchor="middle" fill="#fff">07</T>}
                        </g>
                    );
                })}
                <path d="M342 448H370" stroke="var(--ink)" strokeWidth={2} strokeLinecap="round" />
            </Reveal>

            {/* 06 — cassa */}
            <Draw d={rr(152, 318, 100, 92, 4)} v={cassa} fill="var(--bg)" />
            <Draw d="M192 410L188 428M212 410L216 428M174 428H230" v={cassa} />
            <Reveal v={bill1}>
                <T mono x={162} y={336} fontSize={8.5} fill="var(--muted)">CONTO · T07</T>
                <T x={162} y={352} fontSize={9.5}>Margherita</T>
                <T x={242} y={352} fontSize={9.5} textAnchor="end">9,50</T>
            </Reveal>
            <Reveal v={bill2}>
                <T x={162} y={366} fontSize={9.5}>Tagliere</T>
                <T x={242} y={366} fontSize={9.5} textAnchor="end">14,00</T>
                <path d="M162 374H242" stroke="var(--ink)" vectorEffect="non-scaling-stroke" />
            </Reveal>
            <Reveal v={total}>
                <T x={162} y={389} fontSize={10.5} fontWeight={600}>Totale</T>
                <T x={242} y={389} fontSize={10.5} fontWeight={600} textAnchor="end">23,50</T>
            </Reveal>
            <Reveal v={points}>
                <T mono x={162} y={402} fontSize={8} fill="var(--accent-text)">TESSERA +23 PUNTI</T>
            </Reveal>

            {/* 07 — pagamento */}
            <Draw d={rr(14, 328, 90, 56, 5)} v={card} fill="var(--bg)" />
            <Reveal v={cardTxt}>
                <rect x={24} y={340} width={14} height={10} fill="none" stroke="var(--ink)" vectorEffect="non-scaling-stroke" />
                <T mono x={24} y={374} fontSize={8} fill="var(--muted)">STRIPE · SUMUP</T>
            </Reveal>
            <Draw d="M28 402a9 9 0 1 0 0.01 0" v={check} stroke="var(--accent)" width={1.5} />
            <Draw d="M23.5 411.5l3.5 3.5 6-7" v={check} stroke="var(--accent)" width={1.5} />
            <Reveal v={checkTxt}>
                <T mono x={44} y={408} fontSize={8.5}>SUL CONTO</T>
                <T mono x={44} y={420} fontSize={8.5}>DEL LOCALE</T>
            </Reveal>

            {/* Il "pacchetto" che viaggia sulla linea */}
            <motion.rect width={7} height={7} x={-3.5} y={-3.5} fill="var(--accent)" style={{ x: hx, y: hy, opacity: hO }} />
        </svg>
    );
};

// ─── Sezione con diagramma "pinnato" ───────────────────────────────────────────
const FlowSection: React.FC = () => {
    const reduce = useReducedMotion();
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
    const scrolled = useTransform(scrollYProgress, [0, 0.94], [0.35, N]);
    const full = useMotionValue(N);
    const p = reduce ? full : scrolled;
    const [active, setActive] = useState(reduce ? N - 1 : 0);
    useMotionValueEvent(scrolled, 'change', v => {
        if (reduce) return;
        const i = Math.max(0, Math.min(N - 1, Math.floor(v)));
        setActive(prev => (prev === i ? prev : i));
    });
    const bar = useTransform(scrolled, v => Math.max(0, Math.min(1, v - Math.floor(Math.min(v, N - 0.0001)))));

    if (reduce) {
        return (
            <div className="wrap grid gap-12 lg:grid-cols-12 lg:gap-6 pb-24">
                <ol className="lg:col-span-5">
                    {FLOW_STEPS.map((s, i) => (
                        <li key={s.tag} className="border-t border-[var(--rule)] py-5">
                            <div className="label"><span className="label-accent">{String(i + 1).padStart(2, '0')}</span> · {s.tag}</div>
                            <h3 className="mt-2 text-[19px] font-semibold tracking-[-0.015em]">{s.title}</h3>
                            <p className="mt-1.5 text-[15px] text-[var(--ink-2)]">{s.text}</p>
                        </li>
                    ))}
                </ol>
                <div className="lg:col-span-7 lg:sticky lg:top-24 self-start">
                    <FlowSVG p={p} className="w-full h-auto max-h-[80vh]" />
                </div>
            </div>
        );
    }

    const step = FLOW_STEPS[active];
    return (
        <div ref={ref} className="relative" style={{ height: `${N * 65 + 100}svh` }}>
            <div className="sticky top-[57px] h-[calc(100svh-57px)] overflow-hidden">
                <div className="wrap h-full grid grid-rows-[auto_minmax(0,1fr)] lg:grid-rows-1 lg:grid-cols-12 lg:gap-6">
                    {/* Testo del passo */}
                    <div className="pt-5 lg:pt-0 lg:col-span-5 lg:flex lg:flex-col lg:justify-center">
                        {/* Avanzamento a 7 tacche */}
                        <div className="flex gap-1" aria-hidden="true">
                            {FLOW_STEPS.map((s, i) => (
                                <div key={s.tag} className="h-[2px] flex-1 bg-[var(--rule)] overflow-hidden">
                                    {i < active && <div className="h-full w-full bg-[var(--ink)]" />}
                                    {i === active && <motion.div className="flow-step-bar h-full w-full bg-[var(--accent)]" style={{ scaleX: bar }} />}
                                </div>
                            ))}
                        </div>

                        {/* Elenco dei passi (desktop) */}
                        <ol className="hidden lg:block mt-8">
                            {FLOW_STEPS.map((s, i) => (
                                <li key={s.tag} className={`flow-steps flex items-baseline gap-4 border-t border-[var(--rule)] py-[9px] ${i === active ? 'text-[var(--ink)]' : i < active ? 'text-[var(--muted)]' : 'text-[var(--faint)]'}`}>
                                    <span className={`mono text-[12px] w-6 ${i === active ? 'text-[var(--accent-text)]' : ''}`}>{String(i + 1).padStart(2, '0')}</span>
                                    <span className="text-[15px] font-medium tracking-[-0.01em]">{s.title}</span>
                                    <span className="ml-auto label !text-inherit">{s.tag}</span>
                                </li>
                            ))}
                        </ol>

                        <div className="relative mt-4 lg:mt-8 min-h-[150px] sm:min-h-[132px] lg:min-h-[150px]" aria-live="polite">
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.div
                                    key={active}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -6 }}
                                    transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
                                >
                                    <div className="label lg:hidden">
                                        <span className="label-accent">{String(active + 1).padStart(2, '0')}</span> / {String(N).padStart(2, '0')} · {step.tag}
                                    </div>
                                    <h3 className="mt-1.5 lg:hidden text-[20px] font-semibold tracking-[-0.02em] leading-tight">{step.title}</h3>
                                    <p className="mt-1.5 lg:mt-0 text-[14.5px] sm:text-[15px] lg:text-[16px] leading-[1.5] text-[var(--ink-2)] max-w-[460px]">{step.text}</p>
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Diagramma */}
                    <div className="min-h-0 flex items-start justify-center pt-2 pb-4 lg:items-center lg:pt-0 lg:pb-0 lg:col-span-7 lg:col-start-6">
                        <FlowSVG p={p} className="w-full h-auto max-h-full lg:h-full lg:max-h-[740px] lg:w-auto" />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FlowSection;
