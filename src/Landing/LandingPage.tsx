import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import {
    ArrowRight, Check, CreditCard, FileText, Landmark, Lightbulb, Menu, Pause, PenLine, Play, Wallet, X,
} from 'lucide-react';
import './landing.css';
import { AI_NAME, BRAND_NAME, COMPANY_LEGAL, COMPANY_NAME, CONTACT_EMAIL } from './brand';
import { Wordmark } from './BrandMark';
import { AiCard, OrderCard } from './AppCards';
import EveningStory from './EveningStory';
import Features from './Features';
import ContactForm from './ContactForm';
import ManageCookiesLink from '../Components/CookieConsent/ManageCookiesLink';

// ─── Head (title + meta description) ────────────────────────────────────────────
const PAGE_TITLE = `${BRAND_NAME} — Tutto il tuo locale, in un'unica app`;
const PAGE_DESCRIPTION =
    `${BRAND_NAME} è la piattaforma per ristoranti, pizzerie, bar e pub: QR dinamico al tavolo, menu digitale e ordini, ` +
    `app per la sala, comande stampate in cucina, cassa e pagamenti sul conto del locale, prenotazioni, asporto, ` +
    `tessere fedeltà, sito del locale e ${AI_NAME}, l'intelligenza artificiale integrata.`;

function useHead() {
    useEffect(() => {
        const prevTitle = document.title;
        const metas: [string, string, string][] = [
            ['name', 'description', PAGE_DESCRIPTION],
            ['property', 'og:title', PAGE_TITLE],
            ['property', 'og:description', PAGE_DESCRIPTION],
        ];
        const restore: (() => void)[] = [];
        metas.forEach(([attr, key, value]) => {
            let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
            if (el) {
                const prev = el.getAttribute('content');
                const node = el;
                restore.push(() => { if (prev !== null) node.setAttribute('content', prev); });
            } else {
                el = document.createElement('meta');
                el.setAttribute(attr, key);
                document.head.appendChild(el);
                const node = el;
                restore.push(() => node.remove());
            }
            el.setAttribute('content', value);
        });
        document.title = PAGE_TITLE;
        return () => {
            document.title = prevTitle;
            restore.forEach(fn => fn());
        };
    }, []);
}

// ─── Contenuti ──────────────────────────────────────────────────────────────────
const NAV = [
    { href: '#serata', label: 'Come funziona' },
    { href: '#funzioni', label: 'Funzioni' },
    { href: '#axiomai', label: AI_NAME },
    { href: '#pagamenti', label: 'Pagamenti' },
    { href: '#faq', label: 'Domande' },
];

const FAQ: { q: string; a: string }[] = [
    {
        q: 'I clienti devono scaricare un’app?',
        a: 'No. Inquadrano il QR e il menu si apre nel browser del telefono. Anche Omnivo Sala, l’app dei camerieri, si usa dal browser dello smartphone: niente store, niente installazioni.',
    },
    {
        q: 'Cos’è il QR dinamico?',
        a: 'Un piccolo schermo e-ink appoggiato sul tavolo. Il QR cambia a ogni nuovo cliente, quindi può ordinare solo chi è seduto lì: niente ordini fantasma da un QR fotografato la settimana prima.',
    },
    {
        q: 'Dove finiscono i soldi dei pagamenti online?',
        a: `Sul tuo account Stripe o SumUp, quindi sul tuo conto. ${BRAND_NAME} crea l’ordine e verifica il pagamento, ma non incassa e non trattiene nulla: paghi solo le commissioni del tuo contratto con il provider. E i pagamenti online sono facoltativi.`,
    },
    {
        q: 'Che stampanti posso usare?',
        a: 'Stampanti Star con CloudPRNT, stampanti termiche ESC/POS in rete locale, oppure un tablet Android con l’app RawBT collegato alla stampante. Puoi averne più di una, ognuna con le sue categorie: cucina, bar, pizzeria.',
    },
    {
        q: `Cosa fa ${AI_NAME}?`,
        a: `${AI_NAME} è il motore di intelligenza artificiale integrato in ${BRAND_NAME}. Legge ordini, incassi e prenotazioni del locale e ogni mattina ti manda un riepilogo, ti suggerisce cosa cambiare nel menu e ti aiuta a scrivere le descrizioni dei piatti.`,
    },
    {
        q: 'Posso cambiare menu e prezzi durante il servizio?',
        a: 'Sì. Le modifiche dalla dashboard arrivano subito su tavoli e telefoni dei camerieri, senza ristampare nulla. Un piatto finito si segna esaurito con un clic.',
    },
    {
        q: 'Quanto costa?',
        a: 'Dipende dal locale e da cosa ti serve. Scrivici dal modulo qui sotto: ti rispondiamo con una proposta su misura.',
    },
];

const START = [
    { t: 'Ci racconti il locale', d: 'Tavoli, reparti, stampanti, asporto. Bastano dieci minuti.' },
    { t: 'Prepariamo tutto insieme', d: 'Menu, schermini sui tavoli, stampanti e inviti allo staff.' },
    { t: 'Primo servizio', d: 'Il primo ordine parte dal tavolo. Noi restiamo a portata di telefono.' },
];

// ─── Animazioni ─────────────────────────────────────────────────────────────────
const EASE = [0.2, 0.7, 0.2, 1] as const;

const Reveal: React.FC<{ children: React.ReactNode; className?: string; delay?: number; as?: 'div' | 'li' }> = ({ children, className, delay = 0, as = 'div' }) => {
    const reduce = useReducedMotion();
    const Comp = as === 'li' ? motion.li : motion.div;
    if (reduce) return as === 'li' ? <li className={className}>{children}</li> : <div className={className}>{children}</div>;
    return (
        <Comp
            className={className}
            initial={{ opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.7, delay, ease: EASE }}
        >
            {children}
        </Comp>
    );
};

// ─── Header ─────────────────────────────────────────────────────────────────────
const SiteHeader: React.FC = () => {
    const [open, setOpen] = useState(false);
    const [solid, setSolid] = useState(false);

    useEffect(() => {
        const onScroll = () => setSolid(window.scrollY > 40);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open]);

    const isSolid = solid || open;

    return (
        <header className={`site-header ${isSolid ? 'is-solid' : ''}`}>
            <div className="wrap flex h-[68px] items-center justify-between gap-6">
                <a href="#top" aria-label={`${BRAND_NAME}, torna all'inizio`} className="shrink-0">
                    <Wordmark size={25} animated tone={isSolid ? 'dark' : 'light'} />
                </a>
                <nav aria-label="Sezioni" className="hidden lg:block">
                    <ul className="flex items-center gap-7">
                        {NAV.map(n => <li key={n.href}><a href={n.href} className="nav-a">{n.label}</a></li>)}
                    </ul>
                </nav>
                <div className="hidden lg:flex items-center gap-2">
                    <Link to="/login" className="btn btn-sm btn-line">Accedi</Link>
                    <a href="#contatti" className="btn btn-sm btn-orange">Richiedi una demo</a>
                </div>
                <button
                    type="button"
                    className="lg:hidden -mr-2 grid h-11 w-11 place-items-center rounded-full"
                    aria-expanded={open}
                    aria-controls="lp-mobile-nav"
                    aria-label={open ? 'Chiudi il menu' : 'Apri il menu'}
                    onClick={() => setOpen(o => !o)}
                >
                    {open ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
                </button>
            </div>
            {open && (
                <nav id="lp-mobile-nav" aria-label="Sezioni" className="lg:hidden border-t border-[var(--rule)] bg-[var(--cream)] max-h-[calc(100svh-68px)] overflow-y-auto">
                    <ul className="wrap py-3">
                        {[...NAV, { href: '#contatti', label: 'Contatti' }].map(n => (
                            <li key={n.href}>
                                <a href={n.href} onClick={() => setOpen(false)}
                                   className="flex items-center justify-between py-3.5 border-b border-[var(--rule)] text-[20px] font-extrabold"
                                   style={{ fontFamily: 'var(--f-display)' }}>
                                    {n.label}<ArrowRight size={18} className="text-[var(--orange-text)]" aria-hidden="true" />
                                </a>
                            </li>
                        ))}
                        <li className="flex gap-2 py-5">
                            <Link to="/login" className="btn btn-line flex-1">Accedi</Link>
                            <a href="#contatti" onClick={() => setOpen(false)} className="btn btn-orange flex-1">Richiedi una demo</a>
                        </li>
                    </ul>
                </nav>
            )}
        </header>
    );
};

// ─── Modale video ───────────────────────────────────────────────────────────────
const VideoDialog: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
    const ref = useRef<HTMLDialogElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const d = ref.current;
        if (!d) return;
        if (open && !d.open) {
            d.showModal();
            videoRef.current?.play().catch(() => { /* l'utente può premere play */ });
        } else if (!open && d.open) {
            d.close();
        }
    }, [open]);

    return (
        <dialog
            ref={ref}
            className="omn-dialog"
            aria-label={`Il video di ${BRAND_NAME} (35 secondi)`}
            onClose={() => { videoRef.current?.pause(); onClose(); }}
            onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="omn-dialog-inner">
                <button type="button" className="omn-close" aria-label="Chiudi il video" onClick={onClose} autoFocus>
                    <X size={22} aria-hidden="true" />
                </button>
                {open && (
                    <video
                        ref={videoRef}
                        src="/landing/omnivo-teaser.mp4"
                        poster="/landing/hero-poster.webp"
                        controls
                        playsInline
                        preload="metadata"
                    />
                )}
            </div>
        </dialog>
    );
};

// ─── Hero ───────────────────────────────────────────────────────────────────────
const Hero: React.FC<{ onPlay: () => void }> = ({ onPlay }) => {
    const reduce = useReducedMotion();
    const videoRef = useRef<HTMLVideoElement>(null);
    const [playing, setPlaying] = useState(!reduce);

    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        if (playing) v.play().catch(() => setPlaying(false));
        else v.pause();
    }, [playing]);

    const fade = (delay: number) => reduce ? {} : {
        initial: { opacity: 0, y: 24 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.8, delay, ease: EASE },
    };

    return (
        <section aria-labelledby="hero-title" className="hero">
            <video
                ref={videoRef}
                className="hero-media"
                src="/landing/hero-loop.mp4"
                poster="/landing/hero-poster.webp"
                muted
                loop
                playsInline
                autoPlay={!reduce}
                preload="metadata"
                aria-hidden="true"
                tabIndex={-1}
            />
            <div className="hero-shade" aria-hidden="true" />

            <div className="wrap relative pt-28 pb-8 sm:pb-10">
                <motion.p className="eyebrow on-dark" {...fade(0.1)}>Per ristoranti, pizzerie, bar e pub</motion.p>
                <motion.h1
                    id="hero-title"
                    className="display mt-5 [text-wrap:wrap] text-[clamp(42px,12vw,58px)] sm:text-[76px] lg:text-[88px] xl:text-[104px]"
                    {...fade(0.2)}
                >
                    Tutto il tuo locale,<br />
                    <span className="text-[var(--orange)]">in un’unica app.</span>
                </motion.h1>
                <div className="grid items-end gap-10 lg:grid-cols-12">
                    <div className="lg:col-span-8">
                        <motion.p className="mt-6 max-w-[580px] text-[17px] sm:text-[19px] leading-[1.55] text-[rgba(251,247,243,.86)]" {...fade(0.32)}>
                            Il tavolo ordina, la sala lo sa, la cucina stampa, il conto si chiude. E la mattina dopo
                            {' '}{AI_NAME} ti racconta com’è andata.
                        </motion.p>
                        <motion.div className="mt-8 flex flex-wrap items-center gap-3" {...fade(0.42)}>
                            <a href="#contatti" className="btn btn-orange">
                                Richiedi una demo <ArrowRight size={18} className="arr" aria-hidden="true" />
                            </a>
                            <button type="button" className="btn btn-glass pl-4" onClick={onPlay}>
                                <span className="play-dot ml-0" aria-hidden="true"><Play size={14} fill="currentColor" /></span>
                                Guarda il video <span className="font-semibold opacity-75">35 s</span>
                            </button>
                        </motion.div>
                    </div>

                    <motion.div
                        className="hidden lg:flex lg:col-span-4 justify-end pb-2"
                        initial={reduce ? false : { opacity: 0, x: 30, y: 10 }}
                        animate={{ opacity: 1, x: 0, y: 0 }}
                        transition={{ duration: 0.8, delay: 1.1, ease: EASE }}
                    >
                        <OrderCard className="max-w-[330px]" />
                    </motion.div>
                </div>

                <div className="hero-facts mt-12 sm:mt-14 flex items-end justify-between gap-6 pt-5">
                    <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
                        {[
                            ['App da scaricare', 'Nessuna'],
                            ['Commissioni sui tuoi incassi', '0%'],
                            ['Comande', 'Stampate da sole'],
                            ['Ogni mattina', `Il riepilogo di ${AI_NAME}`],
                        ].map(([k, v]) => (
                            <div key={k}>
                                <dt>{k}</dt>
                                <dd>{v}</dd>
                            </div>
                        ))}
                    </dl>
                    <button
                        type="button"
                        className="icon-btn shrink-0"
                        onClick={() => setPlaying(p => !p)}
                        aria-label={playing ? 'Metti in pausa il video di sfondo' : 'Riproduci il video di sfondo'}
                    >
                        {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
                    </button>
                </div>
            </div>
        </section>
    );
};

// ─── AxiomAI ────────────────────────────────────────────────────────────────────
const DISH_TEXT = 'Controfiletto scottato sulla griglia, rosmarino fresco e sale in fiocchi. Arriva in tavola già tagliato, con patate al forno croccanti.';

const AiWriter: React.FC = () => {
    const ref = useRef<HTMLDivElement>(null);
    const inView = useInView(ref, { once: true, amount: 0.6 });
    const reduce = useReducedMotion();
    const [n, setN] = useState(reduce ? DISH_TEXT.length : 0);

    useEffect(() => {
        if (reduce || !inView || n >= DISH_TEXT.length) return;
        const t = window.setTimeout(() => setN(x => Math.min(DISH_TEXT.length, x + 2)), 28);
        return () => window.clearTimeout(t);
    }, [inView, n, reduce]);

    const done = n >= DISH_TEXT.length;
    return (
        <div ref={ref} className="acard max-w-[330px]">
            <div className="ac-hd">
                <span className="ac-ic"><PenLine size={20} strokeWidth={2.2} aria-hidden="true" /></span>
                <div>
                    <div className="ac-ttl">Descrizione suggerita</div>
                    <div className="ac-sub">Tagliata al rosmarino · IT · EN · DE</div>
                </div>
            </div>
            <div className="ac-hr" />
            <p className="text-[14.5px] leading-[1.5] min-h-[88px]" aria-label={DISH_TEXT}>
                <span aria-hidden="true" className={done ? '' : 'caret'}>{DISH_TEXT.slice(0, n)}</span>
            </p>
            <div className="flex gap-2">
                <span className="pill p-dk">Usa nel menu</span>
                <span className="pill p-or">Riscrivi</span>
            </div>
        </div>
    );
};

const AiSection: React.FC = () => (
    <section id="axiomai" aria-labelledby="ai-title" className="on-night relative overflow-hidden">
        <div className="glow w-[520px] h-[520px] -right-40 -top-40" aria-hidden="true" />
        <div className="glow w-[380px] h-[380px] -left-48 bottom-0 opacity-50" aria-hidden="true" />
        <div className="wrap relative py-20 sm:py-28">
            <div className="grid items-center gap-14 lg:grid-cols-12 lg:gap-10">
                <Reveal className="lg:col-span-6">
                    <p className="eyebrow">{AI_NAME} · intelligenza artificiale integrata</p>
                    <h2 id="ai-title" className="h2 mt-5">Ogni mattina, il punto sulla sera prima.</h2>
                    <p className="lead mt-5 max-w-[520px]">
                        {AI_NAME} legge ordini, incassi e prenotazioni del tuo locale e te li restituisce in poche
                        righe chiare: cosa ha funzionato, cosa è finito troppo presto, cosa conviene cambiare.
                    </p>
                    <ul className="mt-9 grid gap-5">
                        {[
                            { icon: FileText, t: 'Riepiloghi giornalieri e settimanali', d: 'Incasso, coperti, piatti più venduti, confronto con la settimana prima.' },
                            { icon: Lightbulb, t: 'Consigli sul menu', d: 'Cosa spingere, cosa togliere, quanto preparare per il sabato.' },
                            { icon: PenLine, t: 'Descrizioni dei piatti', d: 'Scritte a partire dagli ingredienti, anche in altre lingue. Tu correggi e pubblichi.' },
                        ].map(({ icon: Icon, t, d }) => (
                            <li key={t} className="flex gap-4">
                                <span className="ai-li-ic"><Icon size={20} aria-hidden="true" /></span>
                                <div>
                                    <p className="text-[18px] font-extrabold leading-tight" style={{ fontFamily: 'var(--f-display)' }}>{t}</p>
                                    <p className="mt-1 text-[15px] text-[var(--on-night-2)]">{d}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Reveal>
                <Reveal className="lg:col-span-6" delay={0.15}>
                    <div className="relative mx-auto max-w-[520px] lg:mr-0">
                        <AiCard className="max-w-[400px] [&_.ac-big]:text-[44px]" />
                        <div className="mt-[-28px] ml-auto w-[88%] max-w-[330px] relative sm:mt-[-40px]">
                            <AiWriter />
                        </div>
                    </div>
                </Reveal>
            </div>
        </div>
    </section>
);

// ─── Pagamenti ──────────────────────────────────────────────────────────────────
const PaymentsSection: React.FC = () => (
    <section id="pagamenti" aria-labelledby="pagamenti-title" className="bg-[var(--cream-2)]">
        <div className="wrap py-20 sm:py-28">
            <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
                <Reveal className="lg:col-span-6">
                    <p className="eyebrow">Pagamenti</p>
                    <h2 id="pagamenti-title" className="h2 mt-5">
                        I soldi vanno sul tuo conto. <span className="text-[var(--orange-text)]">Non sul nostro.</span>
                    </h2>
                    <p className="lead mt-5 max-w-[520px]">
                        Colleghi il tuo account Stripe o SumUp e i clienti pagano dal telefono o in contactless.
                        L’incasso arriva a te con i tempi e le commissioni del tuo contratto: {BRAND_NAME} non fa
                        da intermediario e non prende percentuali.
                    </p>
                    <ul className="mt-8 grid gap-x-8 gap-y-4 sm:grid-cols-2">
                        {[
                            ['Facoltativi', 'Se non li attivi, si paga in cassa come sempre.'],
                            ['Anticipati dove serve', 'Solo per l’asporto, solo al tavolo, o entrambi.'],
                            ['Niente doppi incassi', 'Un ordine pagato online risulta già saldato in cassa.'],
                            ['Report per periodo', 'Incassi e pagamenti filtrati per date.'],
                        ].map(([t, d]) => (
                            <li key={t} className="flex gap-3">
                                <Check size={20} className="mt-0.5 flex-none text-[var(--orange-text)]" aria-hidden="true" />
                                <div>
                                    <p className="font-bold">{t}</p>
                                    <p className="text-[14.5px] text-[var(--ink-2)]">{d}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </Reveal>

                <Reveal className="lg:col-span-5 lg:col-start-8" delay={0.15}>
                    <figure className="money" aria-label="Il percorso di un pagamento da 86,50 €">
                        <div className="money-row">
                            <span className="feat-ic"><CreditCard size={21} aria-hidden="true" /></span>
                            <div className="flex-1">
                                <p className="font-bold leading-tight">Il tavolo 7 paga</p>
                                <p className="text-[13.5px] text-[var(--muted)]">dal telefono o in contactless</p>
                            </div>
                            <span className="ac-big text-[24px]">86,50 €</span>
                        </div>
                        <div className="money-link" aria-hidden="true" />
                        <div className="money-row">
                            <span className="feat-ic"><Wallet size={21} aria-hidden="true" /></span>
                            <div className="flex-1">
                                <p className="font-bold leading-tight">Il tuo Stripe o SumUp</p>
                                <p className="text-[13.5px] text-[var(--muted)]">account del locale, contratto tuo</p>
                            </div>
                        </div>
                        <div className="money-link" aria-hidden="true" />
                        <div className="money-row is-you">
                            <span className="feat-ic bg-white text-[var(--ok)]"><Landmark size={21} aria-hidden="true" /></span>
                            <div className="flex-1">
                                <p className="font-bold leading-tight">Il tuo conto</p>
                                <p className="text-[13.5px] text-[#166534]">accredito diretto</p>
                            </div>
                            <span className="ac-big text-[24px] text-[#166534]">86,50 €</span>
                        </div>
                        <figcaption className="mt-2 flex items-center justify-between gap-4 rounded-[16px] px-4 py-3 text-[14px]">
                            <span className="text-[var(--ink-2)]">Trattenuto da {BRAND_NAME}</span>
                            <span className="ac-big text-[20px]">0,00 €</span>
                        </figcaption>
                    </figure>
                </Reveal>
            </div>
        </div>
    </section>
);

// ─── Pagina ─────────────────────────────────────────────────────────────────────
const LandingPage: React.FC = () => {
    useHead();
    const [videoOpen, setVideoOpen] = useState(false);
    const year = new Date().getFullYear();

    return (
        <div className="lp min-h-screen" id="top">
            <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-full focus:bg-[var(--ink)] focus:px-5 focus:py-2.5 focus:text-white">
                Vai al contenuto
            </a>
            <SiteHeader />

            <main id="main">
                <Hero onPlay={() => setVideoOpen(true)} />

                {/* ── Una sera ──────────────────────────────────────────── */}
                <section id="serata" aria-labelledby="serata-title">
                    <div className="wrap py-20 sm:py-28">
                        <Reveal className="mb-10 lg:mb-14 grid gap-5 lg:grid-cols-12 lg:items-end">
                            <div className="lg:col-span-7">
                                <p className="eyebrow">Come funziona</p>
                                <h2 id="serata-title" className="h2 mt-5">Una sera, dall’ordine al conto.</h2>
                            </div>
                            <p className="lead lg:col-span-4 lg:col-start-9">
                                Tavolo 7, sabato sera. Ecco cosa succede, e chi vede cosa, senza un solo foglietto.
                            </p>
                        </Reveal>
                        <EveningStory />
                    </div>
                </section>

                {/* ── Funzioni ──────────────────────────────────────────── */}
                <section id="funzioni" aria-labelledby="funzioni-title" className="pb-20 sm:pb-28">
                    <div className="wrap">
                        <Reveal className="mb-10 grid gap-5 lg:grid-cols-12 lg:items-end">
                            <div className="lg:col-span-7">
                                <p className="eyebrow">Tutto quello che fa</p>
                                <h2 id="funzioni-title" className="h2 mt-5">Nove strumenti. Un solo posto dove guardare.</h2>
                            </div>
                            <p className="lead lg:col-span-4 lg:col-start-9">
                                Cambi un prezzo e cambia ovunque: sul tavolo, sui telefoni della sala, in cassa.
                            </p>
                        </Reveal>
                        <Reveal><Features /></Reveal>
                    </div>
                </section>

                <AiSection />
                <PaymentsSection />

                {/* ── FAQ ───────────────────────────────────────────────── */}
                <section id="faq" aria-labelledby="faq-title">
                    <div className="wrap py-20 sm:py-28">
                        <div className="grid gap-10 lg:grid-cols-12 lg:gap-10">
                            <Reveal className="lg:col-span-4">
                                <p className="eyebrow">Domande</p>
                                <h2 id="faq-title" className="h2 mt-5">Le domande che ci fanno tutti.</h2>
                                <p className="mt-5 text-[16px] text-[var(--ink-2)]">
                                    Non trovi la tua? <a href="#contatti" className="link-u font-semibold text-[var(--ink)]">Scrivici</a>.
                                </p>
                            </Reveal>
                            <div className="lg:col-span-8 border-b border-[var(--rule-2)]">
                                {FAQ.map(item => (
                                    <details key={item.q} className="border-t border-[var(--rule-2)]">
                                        <summary className="flex items-center gap-4 py-5 text-[18px] sm:text-[19px] font-extrabold leading-snug"
                                                 style={{ fontFamily: 'var(--f-display)' }}>
                                            <span className="flex-1">{item.q}</span>
                                            <span aria-hidden="true" className="faq-mark" />
                                        </summary>
                                        <p className="pb-6 pr-12 text-[16px] text-[var(--ink-2)] max-w-[680px]">{item.a}</p>
                                    </details>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Contatti ──────────────────────────────────────────── */}
                <section id="contatti" aria-labelledby="contatti-title" className="bg-[var(--cream-2)]">
                    <div className="wrap py-20 sm:py-28">
                        <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
                            <Reveal className="lg:col-span-5">
                                <p className="eyebrow">Richiedi una demo</p>
                                <h2 id="contatti-title" className="h2 mt-5">Parliamo del tuo locale.</h2>
                                <p className="lead mt-5 max-w-[440px]">
                                    Raccontaci come lavorate e cosa vorreste cambiare. Ti risponde una persona di {COMPANY_NAME},
                                    non un bot.
                                </p>
                                <ol className="mt-9 grid gap-5">
                                    {START.map((s, i) => (
                                        <li key={s.t} className="flex gap-4">
                                            <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-[var(--ink)] text-[15px] font-black text-white"
                                                  style={{ fontFamily: 'var(--f-display)' }}>{i + 1}</span>
                                            <div>
                                                <p className="text-[17px] font-extrabold leading-tight" style={{ fontFamily: 'var(--f-display)' }}>{s.t}</p>
                                                <p className="mt-0.5 text-[15px] text-[var(--ink-2)]">{s.d}</p>
                                            </div>
                                        </li>
                                    ))}
                                </ol>
                                <p className="mt-9 text-[15px] text-[var(--ink-2)]">
                                    Preferisci l’email? <a href={`mailto:${CONTACT_EMAIL}`} className="link-u font-semibold text-[var(--ink)]">{CONTACT_EMAIL}</a>
                                    <br />Hai già un locale attivo? <Link to="/login" className="link-u font-semibold text-[var(--ink)]">Accedi alla dashboard</Link>
                                </p>
                            </Reveal>
                            <Reveal className="lg:col-span-7" delay={0.1}>
                                <div className="rounded-[28px] bg-white p-5 sm:p-9 shadow-[0_30px_60px_-30px_rgba(42,31,24,.35)]">
                                    <ContactForm />
                                </div>
                            </Reveal>
                        </div>
                    </div>
                </section>
            </main>

            {/* ── Footer ────────────────────────────────────────────────── */}
            <footer className="on-night">
                <div className="wrap pt-14 pb-8">
                    <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-6">
                        <div className="lg:col-span-4">
                            <Wordmark size={34} tone="light" />
                            <p className="mt-5 max-w-[340px] text-[15px] text-[var(--on-night-2)]">
                                Tutto il tuo locale, in un’unica app. Con {AI_NAME} integrata.
                                Un prodotto {COMPANY_NAME}.
                            </p>
                        </div>
                        <nav aria-label="Prodotto" className="lg:col-span-2 lg:col-start-6">
                            <p className="label mb-3 !text-[var(--on-night-2)]">Prodotto</p>
                            <ul className="space-y-2 text-[15px]">
                                <li><a href="#serata" className="link-u">Come funziona</a></li>
                                <li><a href="#funzioni" className="link-u">Funzioni</a></li>
                                <li><a href="#axiomai" className="link-u">{AI_NAME}</a></li>
                                <li><Link to="/signup" className="link-u">Registra il locale</Link></li>
                                <li><Link to="/login" className="link-u">Accedi</Link></li>
                            </ul>
                        </nav>
                        <nav aria-label="Note legali" className="lg:col-span-2">
                            <p className="label mb-3 !text-[var(--on-night-2)]">Legale</p>
                            <ul className="space-y-2 text-[15px]">
                                <li><Link to="/privacy" className="link-u">Privacy policy</Link></li>
                                <li><Link to="/cookie-policy" className="link-u">Cookie policy</Link></li>
                                <li><ManageCookiesLink className="link-u text-left" /></li>
                            </ul>
                        </nav>
                        <div className="lg:col-span-3">
                            <p className="label mb-3 !text-[var(--on-night-2)]">Contatti</p>
                            <p className="text-[15px]"><a href={`mailto:${CONTACT_EMAIL}`} className="link-u break-all">{CONTACT_EMAIL}</a></p>
                        </div>
                    </div>
                    <div className="mt-12 border-t border-[var(--on-night-rule)] pt-6 flex flex-col gap-1 sm:flex-row sm:justify-between text-[13px] text-[var(--on-night-2)]">
                        <span>© {year} {COMPANY_LEGAL.tradeName}, un brand di {COMPANY_LEGAL.holder}</span>
                        <span>{COMPANY_LEGAL.address} · P.IVA {COMPANY_LEGAL.vat}</span>
                    </div>
                </div>
            </footer>

            <VideoDialog open={videoOpen} onClose={() => setVideoOpen(false)} />
        </div>
    );
};

export default LandingPage;
