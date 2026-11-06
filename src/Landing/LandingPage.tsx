import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import './landing.css';
import { BRAND_NAME, COMPANY_LEGAL, COMPANY_NAME, CONTACT_EMAIL } from './brand';
import { Wordmark } from './BrandMark';
import FlowSection from './FlowDiagram';
import { HeroSchematic, PaymentsDiagram, RoleGlyph } from './Mockups';
import ContactForm from './ContactForm';
import ManageCookiesLink from '../Components/CookieConsent/ManageCookiesLink';
import { MENU_TEMPLATES } from '../Client/menuTemplates';

// ─── Head (title + meta description) ────────────────────────────────────────────
const PAGE_TITLE = `${BRAND_NAME} — Gestionale per ristoranti, bar, pub e pizzerie`;
const PAGE_DESCRIPTION =
    `${BRAND_NAME} è il gestionale per la ristorazione: menu digitale con QR, ordini dal tavolo e dai camerieri, ` +
    `comande stampate in cucina, cassa, tessere fedeltà, asporto con fasce orarie, prenotazioni e pagamenti online ` +
    `sul conto Stripe o SumUp del locale.`;

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
type Item = { term: string; tag?: string; text: string };

const CLIENT: Item[] = [
    { term: 'Menu dal QR, senza app', tag: 'QR', text: 'Si apre nel browser del telefono, già legato al tavolo.' },
    { term: 'Menu in più lingue', text: 'Il cliente sceglie la lingua; le traduzioni sono automatiche.' },
    { term: 'Ingredienti e allergeni', text: 'Per ogni piatto, consultabili prima di ordinare.' },
    { term: 'Aggiunte e rimozioni', text: '“Senza cipolla”, “più mozzarella”: arrivano scritte sulla comanda.' },
    { term: 'Esauriti in tempo reale', tag: 'Live', text: 'Un piatto finito in cucina non si può più ordinare, senza ricaricare la pagina.' },
    { term: 'Ordine di gruppo', text: 'Ognuno ordina dal suo telefono; la comanda parte quando tutti premono “Sono pronto”.' },
    { term: 'Stato dell’ordine', tag: 'Live', text: 'Ricevuto, in preparazione, pronto: si aggiorna da solo.' },
    { term: 'Storico degli ordini', text: 'Quello che ha già ordinato al tavolo, sempre consultabile.' },
    { term: 'Paga dal telefono', tag: 'Stripe · SumUp', text: 'Se il locale attiva i pagamenti online.' },
    { term: 'Asporto con ritiro a orario', text: 'Sceglie la fascia di ritiro tra quelle disponibili.' },
    { term: 'Prenotazione del tavolo', text: 'Dalla pagina del locale; la conferma arriva dallo staff.' },
    { term: 'Tessera fedeltà a punti', text: 'Arriva via email con il suo QR; il saldo si controlla quando vuole.' },
];

const WAITER: Item[] = [
    { term: 'App sul telefono', tag: 'Push', text: 'Notifica quando arriva un ordine o un piatto è pronto. Nessuna installazione dagli store.' },
    { term: 'Ordini presi al tavolo', text: 'Con lo stesso menu dei clienti, comprese aggiunte e note. Anche asporto e domicilio.' },
    { term: 'Mappa della sala', text: 'Tavoli liberi e occupati, apertura e chiusura del tavolo, sessioni di gruppo.' },
    { term: 'Prenotazioni', text: 'Le inserisce lo staff, anche quelle arrivate per telefono.' },
    { term: 'Accesso con link d’invito', text: 'Il titolare manda il link; l’account si attiva dopo la sua approvazione.' },
];

const OWNER: { group: string; items: Item[] }[] = [
    {
        group: 'Menu',
        items: [
            { term: 'Gestione del menu', text: 'Categorie, piatti, ingredienti, allergeni, aggiunte, foto. Online subito.' },
            { term: 'Esaurito con un clic', text: 'Sparisce dagli ordinabili su tutti i telefoni.' },
            { term: `${MENU_TEMPLATES.length} template grafici`, text: 'Scegli quello più vicino allo stile del locale.' },
            { term: 'Traduzioni automatiche', text: 'Il menu è pronto per i clienti stranieri.' },
        ],
    },
    {
        group: 'Sala',
        items: [
            { term: 'QR per ogni tavolo', text: 'Generati e stampati dalla dashboard.' },
            { term: 'Mappa sala e tavoli', text: 'La disposizione del locale, con lo stato di ogni tavolo.' },
            { term: 'Ordini in tempo reale', text: 'QR, camerieri e asporto in un’unica schermata.' },
            { term: 'Inviti allo staff', text: 'Un link per ogni cameriere, con la tua approvazione.' },
        ],
    },
    {
        group: 'Cucina',
        items: [
            { term: 'Stampa automatica', text: 'Comande su stampanti termiche Star CloudPRNT o ESC/POS, oppure su tablet Android con RawBT.' },
            { term: 'Una stampante per reparto', text: 'Cucina, bar, pizzeria: ognuna riceve solo le sue categorie.' },
        ],
    },
    {
        group: 'Cassa e pagamenti',
        items: [
            { term: 'Cassa', text: 'Conto per tavolo, sconto in percentuale o sul prezzo finale, sconti fedeltà.' },
            { term: 'Pagamenti online', text: 'Sul tuo account Stripe o SumUp. La piattaforma non prende percentuali.' },
            { term: 'Report per periodo', text: 'Incassi e pagamenti filtrati per date.' },
        ],
    },
    {
        group: 'Servizio',
        items: [
            { term: 'Prenotazioni', text: 'Conferma, annulla, segna il no-show da un calendario.' },
            { term: 'Asporto', text: 'Fasce di ritiro, pausa degli ordini quando la cucina è piena, giorni di chiusura.' },
            { term: 'Programma fedeltà', text: 'Tessere a punti caricate alla chiusura del conto.' },
        ],
    },
    {
        group: 'Numeri',
        items: [
            { term: 'Analytics', text: 'Ricavi, prodotti più venduti, andamento dei camerieri.' },
            { term: 'Sessione di assistenza', text: 'Quando ci chiedi aiuto, il supporto entra nel tuo locale e risolve da lì.' },
        ],
    },
];

const START: { title: string; text: string; meta: string }[] = [
    {
        title: 'Configuri il locale',
        text: 'Carichi menu, allergeni e foto dalla dashboard, scegli il template, colleghi le stampanti e inviti i camerieri con un link.',
        meta: 'Dashboard · menu · stampanti · staff',
    },
    {
        title: 'Stampi i QR',
        text: 'Un QR per tavolo, generato dalla dashboard. Lo stampi e lo appoggi sul tavolo: è già legato al suo numero.',
        meta: 'Un QR per tavolo',
    },
    {
        title: 'Ricevi il primo ordine',
        text: 'Il cliente inquadra e ordina, la comanda esce in cucina, il cameriere riceve la notifica. Tu segui tutto da una schermata.',
        meta: 'Tavolo → cucina → sala',
    },
];

const FAQ: { q: string; a: React.ReactNode }[] = [
    {
        q: 'I clienti devono scaricare un’app?',
        a: 'No. Inquadrano il QR e il menu si apre nel browser del telefono. Lo stesso vale per i camerieri: usano una web app dal loro smartphone.',
    },
    {
        q: 'Dove finiscono i soldi dei pagamenti online?',
        a: `Sul tuo account Stripe o SumUp, quindi sul tuo conto. ${BRAND_NAME} crea l’ordine e verifica l’esito del pagamento, ma non incassa e non trattiene nulla sulle transazioni: le commissioni sono solo quelle del tuo contratto con il provider.`,
    },
    {
        q: 'Il pagamento online è obbligatorio?',
        a: 'No, è facoltativo. Se lo attivi puoi chiedere il pagamento anticipato solo per l’asporto, solo al tavolo o in entrambi i casi; altrimenti il cliente paga in cassa come sempre.',
    },
    {
        q: 'Che stampanti posso usare?',
        a: 'Stampanti Star con CloudPRNT, stampanti termiche ESC/POS tramite bridge in rete locale, oppure un tablet Android con l’app RawBT collegato alla stampante. Puoi averne più di una, ciascuna per le sue categorie.',
    },
    {
        q: 'Posso cambiare menu e prezzi durante il servizio?',
        a: 'Sì. Le modifiche fatte dalla dashboard sono subito visibili a clienti e camerieri, senza ristampare nulla. Lo stesso per gli esauriti.',
    },
    {
        q: 'Funziona anche per l’asporto?',
        a: 'Sì. Il cliente ordina dalla pagina del locale e sceglie l’orario di ritiro tra le fasce che hai impostato. Quando la cucina è piena puoi mettere in pausa gli ordini da asporto.',
    },
    {
        q: 'Quanto costa?',
        a: 'Dipende dal locale e da cosa ti serve. Scrivici dal modulo qui sotto e ti rispondiamo con una proposta.',
    },
];

const NAV = [
    { href: '#flusso', label: 'Come funziona' },
    { href: '#funzioni', label: 'Funzioni' },
    { href: '#pagamenti', label: 'Pagamenti' },
    { href: '#faq', label: 'Domande' },
];

// ─── Pezzi di layout ────────────────────────────────────────────────────────────
const SecHead: React.FC<{ n: string; label: string; dark?: boolean; right?: React.ReactNode }> = ({ n, label, right }) => (
    <div className="sec-head">
        <span className="label"><span className="label-accent">{n}</span>&nbsp;&nbsp;{label}</span>
        {right && <span className="label hidden sm:inline">{right}</span>}
    </div>
);

const SiteHeader: React.FC = () => {
    const [open, setOpen] = useState(false);
    return (
        <header className="site-header">
            <div className="wrap flex h-14 items-center justify-between gap-6">
                <a href="#top" aria-label={`${BRAND_NAME}, torna all'inizio`} className="shrink-0">
                    <Wordmark />
                </a>
                <nav aria-label="Sezioni" className="hidden md:block">
                    <ul className="flex items-center gap-7 text-[14px]">
                        {NAV.map(n => <li key={n.href}><a href={n.href} className="nav-a">{n.label}</a></li>)}
                    </ul>
                </nav>
                <div className="hidden md:flex items-center gap-2 text-[14px]">
                    <Link to="/login" className="btn btn-sm btn-line">Accedi</Link>
                    <a href="#contatti" className="btn btn-sm btn-ink">Richiedi una demo</a>
                </div>
                <button
                    type="button"
                    className="md:hidden -mr-1 h-10 px-2 mono text-[12px] uppercase tracking-[0.06em]"
                    aria-expanded={open}
                    aria-controls="lp-mobile-nav"
                    onClick={() => setOpen(o => !o)}
                >
                    {open ? 'Chiudi' : 'Menu'}
                </button>
            </div>
            {open && (
                <nav id="lp-mobile-nav" aria-label="Sezioni" className="md:hidden border-t border-[var(--rule)] bg-[var(--bg)]">
                    <ul className="wrap py-2 text-[17px]">
                        {[...NAV, { href: '#contatti', label: 'Contatti' }].map((n, i) => (
                            <li key={n.href}>
                                <a href={n.href} onClick={() => setOpen(false)} className="flex items-baseline gap-4 py-3 border-b border-[var(--rule)]">
                                    <span className="mono text-[11px] text-[var(--muted)]">{String(i + 1).padStart(2, '0')}</span>{n.label}
                                </a>
                            </li>
                        ))}
                        <li className="flex gap-2 py-4">
                            <Link to="/login" className="btn btn-line flex-1">Accedi</Link>
                            <Link to="/signup" className="btn btn-ink flex-1">Registra il locale</Link>
                        </li>
                    </ul>
                </nav>
            )}
        </header>
    );
};

const SpecList: React.FC<{ items: Item[] }> = ({ items }) => (
    <dl className="border-b border-[var(--rule)]">
        {items.map(it => (
            <div key={it.term} className="spec-row">
                <dt className="text-[15.5px] font-medium tracking-[-0.01em]">
                    {it.term}{it.tag && <span className="tag">{it.tag}</span>}
                </dt>
                <dd className="text-[15px] text-[var(--ink-2)]">{it.text}</dd>
            </div>
        ))}
    </dl>
);

const Role: React.FC<{ id: string; n: string; who: string; title: string; text: string; glyph: 'cliente' | 'cameriere' | 'titolare'; children: React.ReactNode }> = ({ id, n, who, title, text, glyph, children }) => (
    <article id={id} aria-labelledby={`${id}-t`} className="grid gap-8 border-t border-[var(--ink)] pt-6 pb-16 sm:pb-20 lg:grid-cols-12 lg:gap-6">
        <header className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
                <p className="label"><span className="label-accent">{n}</span>&nbsp;&nbsp;{who}</p>
                <h3 id={`${id}-t`} className="mt-3 text-[26px] sm:text-[30px] font-semibold tracking-[-0.03em] leading-[1.08]">{title}</h3>
                <p className="mt-3 max-w-[340px] text-[15.5px] text-[var(--ink-2)]">{text}</p>
                <RoleGlyph role={glyph} className="mt-8 w-[120px] h-auto" />
            </div>
        </header>
        <div className="lg:col-span-8">{children}</div>
    </article>
);

const fadeUp = (reduce: boolean | null, delay = 0) => reduce ? {} : {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: [0.2, 0.7, 0.2, 1] as const },
};

// ─── Pagina ─────────────────────────────────────────────────────────────────────
const LandingPage: React.FC = () => {
    useHead();
    const reduce = useReducedMotion();
    const year = new Date().getFullYear();

    return (
        <div className="lp min-h-screen" id="top">
            <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-[var(--ink)] focus:px-4 focus:py-2 focus:text-white">
                Vai al contenuto
            </a>
            <SiteHeader />

            <main id="main">
                {/* ── Hero ─────────────────────────────────────────────── */}
                <section aria-labelledby="hero-title" className="relative">
                    <div className="wrap relative">
                        <div className="cols-guide" aria-hidden="true">{Array.from({ length: 12 }, (_, i) => <span key={i} />)}</div>
                        <div className="relative pt-12 pb-14 sm:pt-20 sm:pb-20 lg:pt-20 lg:pb-20">
                            <motion.p className="label" {...fadeUp(reduce)}>
                                Gestionale per ristoranti, pizzerie, bar e pub
                            </motion.p>
                            <motion.h1 id="hero-title" className="display mt-6 text-[clamp(38px,10.4vw,46px)] sm:text-[72px] lg:text-[96px]" {...fadeUp(reduce, 0.05)}>
                                Il tavolo ordina.<br />
                                La cucina stampa.<br />
                                <span className="text-[var(--faint)]">La cassa chiude.</span>
                            </motion.h1>
                            <div className="mt-10 grid gap-12 lg:mt-14 lg:grid-cols-12 lg:gap-6">
                                <div className="lg:col-span-5">
                                    <motion.p className="max-w-[500px] text-[17px] sm:text-[18px] leading-[1.55] text-[var(--ink-2)]" {...fadeUp(reduce, 0.12)}>
                                        {BRAND_NAME} collega il QR sul tavolo, il telefono del cameriere, la stampante in
                                        cucina e la cassa. Con asporto, prenotazioni, tessere fedeltà e pagamenti online
                                        che arrivano direttamente sul conto del locale.
                                    </motion.p>
                                    <motion.div className="mt-8 flex flex-wrap items-center gap-2" {...fadeUp(reduce, 0.18)}>
                                        <a href="#contatti" className="btn btn-ink">Richiedi una demo <span className="arr" aria-hidden="true">→</span></a>
                                        <Link to="/signup" className="btn btn-line">Registra il locale</Link>
                                    </motion.div>
                                    <motion.p className="mt-4 text-[13.5px] text-[var(--muted)]" {...fadeUp(reduce, 0.22)}>
                                        Hai già un account? <Link to="/login" className="link-u text-[var(--ink)]">Accedi</Link>
                                    </motion.p>
                                </div>
                                <motion.div className="lg:col-span-6 lg:col-start-7" {...fadeUp(reduce, 0.25)}>
                                    <HeroSchematic />
                                </motion.div>
                            </div>
                        </div>

                        {/* Dati di fatto, non metriche */}
                        <dl className="relative grid grid-cols-2 lg:grid-cols-4 border-t border-[var(--ink)]">
                            {[
                                ['App da installare', 'Nessuna'],
                                ['Commissioni sugli incassi', '0%'],
                                ['Stampa comande', 'CloudPRNT · ESC/POS · RawBT'],
                                ['Template grafici del menu', String(MENU_TEMPLATES.length)],
                            ].map(([k, v], i) => (
                                <div key={k} className={`py-4 pr-4 ${i % 2 ? 'pl-4 border-l border-[var(--rule)]' : ''} ${i === 2 ? 'lg:pl-4 lg:border-l border-t lg:border-t-0 border-[var(--rule)]' : ''} ${i === 3 ? 'border-t lg:border-t-0' : ''}`}>
                                    <dt className="label">{k}</dt>
                                    <dd className="mt-1.5 text-[15px] sm:text-[17px] font-medium tracking-[-0.015em]">{v}</dd>
                                </div>
                            ))}
                        </dl>
                    </div>
                </section>

                {/* ── Il flusso ─────────────────────────────────────────── */}
                <section id="flusso" aria-labelledby="flusso-title" className="scroll-mt-14 border-t border-[var(--rule)]">
                    <div className="wrap pt-20 sm:pt-28">
                        <SecHead n="01" label="Il percorso di un ordine" right="Scorri" />
                        <div className="mt-8 grid gap-6 lg:grid-cols-12">
                            <h2 id="flusso-title" className="h2 lg:col-span-7">
                                Dal QR al pagamento, sette passaggi e nessun foglietto.
                            </h2>
                            <p className="text-[16px] text-[var(--ink-2)] lg:col-span-4 lg:col-start-9 lg:pt-2">
                                Segui un ordine del tavolo 7 di una sera qualsiasi: chi lo tocca, dove arriva e cosa
                                vede ognuno.
                            </p>
                        </div>
                    </div>
                    <div className="mt-6 sm:mt-10">
                        <FlowSection />
                    </div>
                </section>

                {/* ── Funzioni per ruolo ───────────────────────────────── */}
                <section id="funzioni" aria-labelledby="funzioni-title" className="scroll-mt-14">
                    <div className="wrap pt-20 sm:pt-28">
                        <SecHead n="02" label="Funzioni" right="Tre ruoli, un solo sistema" />
                        <div className="mt-8 mb-14 sm:mb-20 grid gap-6 lg:grid-cols-12">
                            <h2 id="funzioni-title" className="h2 lg:col-span-7">Ognuno vede la sua parte dello stesso ordine.</h2>
                            <p className="text-[16px] text-[var(--ink-2)] lg:col-span-4 lg:col-start-9 lg:pt-2">
                                Il cliente dal suo telefono, il cameriere dal suo, il titolare dalla dashboard.
                                Nessuno ricopia niente a mano.
                            </p>
                        </div>

                        <Role id="cliente" n="A" who="Cliente" glyph="cliente" title="Chi siede al tavolo"
                              text="Inquadra il QR e ordina nel browser, anche in gruppo, anche da casa per l’asporto.">
                            <SpecList items={CLIENT} />
                        </Role>

                        <Role id="cameriere" n="B" who="Cameriere" glyph="cameriere" title="Chi lavora in sala"
                              text="Tutto dal telefono: gli ordini che arrivano, quelli da prendere, i tavoli da aprire e chiudere.">
                            <SpecList items={WAITER} />
                        </Role>

                        <Role id="titolare" n="C" who="Titolare" glyph="titolare" title="Chi gestisce il locale"
                              text="La dashboard con menu, sala, cucina, cassa e numeri. Modifichi una cosa e cambia ovunque.">
                            <div className="grid gap-x-10 sm:grid-cols-2">
                                {OWNER.map(g => (
                                    <div key={g.group} className="pb-8">
                                        <h4 className="label border-b border-[var(--ink)] pb-2">{g.group}</h4>
                                        <dl>
                                            {g.items.map(it => (
                                                <div key={it.term} className="border-b border-[var(--rule)] py-3">
                                                    <dt className="text-[15.5px] font-medium tracking-[-0.01em]">{it.term}</dt>
                                                    <dd className="mt-0.5 text-[14.5px] text-[var(--ink-2)]">{it.text}</dd>
                                                </div>
                                            ))}
                                        </dl>
                                    </div>
                                ))}
                            </div>
                        </Role>
                    </div>
                </section>

                {/* ── Pagamenti ────────────────────────────────────────── */}
                <section id="pagamenti" aria-labelledby="pagamenti-title" className="dark scroll-mt-14">
                    <div className="wrap py-20 sm:py-28">
                        <SecHead n="03" label="Pagamenti online" right="Facoltativi" />
                        <div className="mt-8 grid gap-12 lg:grid-cols-12 lg:gap-6">
                            <div className="lg:col-span-5">
                                <h2 id="pagamenti-title" className="h2">I soldi vanno sul tuo conto. Non sul nostro.</h2>
                                <p className="mt-6 max-w-[460px] text-[16px] text-[var(--dark-muted)]">
                                    Colleghi il tuo account Stripe o SumUp e i clienti pagano dal telefono, al tavolo o per
                                    l’asporto. L’incasso va direttamente a te, con i tempi e le commissioni del tuo contratto
                                    con il provider. {BRAND_NAME} non fa da intermediario.
                                </p>
                            </div>
                            <div className="lg:col-span-6 lg:col-start-7 lg:pt-2">
                                <PaymentsDiagram />
                            </div>
                        </div>
                        <ul className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 border-t border-[var(--dark-rule)]">
                            {[
                                ['Facoltativi', 'Li attivi solo se ti servono; il cliente può sempre pagare in cassa.'],
                                ['Anticipati dove serve', 'Solo per l’asporto, solo al tavolo, o entrambi.'],
                                ['Niente doppi incassi', 'Un ordine pagato online risulta già pagato alla chiusura del conto.'],
                                ['Report per periodo', 'Pagamenti e incassi filtrati per date, dalla dashboard.'],
                            ].map(([t, d], i) => (
                                <li key={t} className={`py-5 border-b border-[var(--dark-rule)] lg:border-b-0 sm:pr-6 ${i ? 'lg:border-l lg:pl-6' : ''} ${i % 2 ? 'sm:border-l sm:pl-6' : ''}`}>
                                    <div className="text-[15.5px] font-medium">{t}</div>
                                    <div className="mt-1 text-[14.5px] text-[var(--dark-muted)]">{d}</div>
                                </li>
                            ))}
                        </ul>
                    </div>
                </section>

                {/* ── Come si parte ─────────────────────────────────────── */}
                <section id="come-si-parte" aria-labelledby="start-title" className="scroll-mt-14">
                    <div className="wrap py-20 sm:py-28">
                        <SecHead n="04" label="Come si parte" />
                        <h2 id="start-title" className="h2 mt-8 max-w-[760px]">Tre passaggi, poi il servizio va da sé.</h2>
                        <ol className="mt-14 grid lg:grid-cols-3">
                            {START.map((s, i) => (
                                <li key={s.title} className={`relative border-t border-[var(--rule)] pt-6 pb-10 lg:pb-0 lg:pr-8 ${i ? 'lg:pl-8 lg:border-l' : ''}`}>
                                    <div className="flex items-baseline justify-between">
                                        <span className="mono text-[44px] leading-none tracking-[-0.04em] text-[var(--ink)]">{String(i + 1).padStart(2, '0')}</span>
                                        <span className="label">{s.meta}</span>
                                    </div>
                                    <h3 className="mt-8 text-[20px] font-semibold tracking-[-0.02em]">{s.title}</h3>
                                    <p className="mt-2 text-[15.5px] text-[var(--ink-2)] max-w-[360px]">{s.text}</p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                {/* ── FAQ ───────────────────────────────────────────────── */}
                <section id="faq" aria-labelledby="faq-title" className="scroll-mt-14 bg-[var(--bg-2)]">
                    <div className="wrap py-20 sm:py-28">
                        <SecHead n="05" label="Domande" />
                        <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:gap-6">
                            <h2 id="faq-title" className="h2 lg:col-span-4">Domande frequenti</h2>
                            <div className="lg:col-span-8 border-b border-[var(--rule-2)]">
                                {FAQ.map((item, i) => (
                                    <details key={item.q} className="border-t border-[var(--rule-2)]">
                                        <summary className="flex items-start gap-4 py-5 text-[17px] font-medium tracking-[-0.01em] text-[var(--ink-2)] hover:text-[var(--ink)]">
                                            <span className="mono text-[12px] text-[var(--muted)] w-6 pt-[5px]">{String(i + 1).padStart(2, '0')}</span>
                                            <span className="flex-1">{item.q}</span>
                                            <span aria-hidden="true" className="faq-mark" />
                                        </summary>
                                        <p className="pb-6 pl-10 pr-8 text-[15.5px] text-[var(--ink-2)] max-w-[680px]">{item.a}</p>
                                    </details>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Contatti ──────────────────────────────────────────── */}
                <section id="contatti" aria-labelledby="contatti-title" className="scroll-mt-14">
                    <div className="wrap py-20 sm:py-28">
                        <SecHead n="06" label="Contatti" />
                        <div className="mt-8 grid gap-12 lg:grid-cols-12 lg:gap-6">
                            <div className="lg:col-span-4">
                                <h2 id="contatti-title" className="h2">Parliamo del tuo locale.</h2>
                                <p className="mt-5 text-[16px] text-[var(--ink-2)] max-w-[380px]">
                                    Raccontaci com’è organizzato il servizio e cosa vorresti cambiare. Ti risponde una
                                    persona di {COMPANY_NAME}.
                                </p>
                                <dl className="mt-10 border-t border-[var(--rule)]">
                                    <div className="py-3 border-b border-[var(--rule)]">
                                        <dt className="label">Email</dt>
                                        <dd className="mt-1 text-[15px]"><a href={`mailto:${CONTACT_EMAIL}`} className="link-u">{CONTACT_EMAIL}</a></dd>
                                    </div>
                                    <div className="py-3 border-b border-[var(--rule)]">
                                        <dt className="label">Hai già un locale attivo?</dt>
                                        <dd className="mt-1 text-[15px]"><Link to="/login" className="link-u">Accedi alla dashboard</Link></dd>
                                    </div>
                                </dl>
                            </div>
                            <div className="lg:col-span-7 lg:col-start-6">
                                <ContactForm />
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* ── Footer ────────────────────────────────────────────────── */}
            <footer className="border-t border-[var(--ink)]">
                <div className="wrap py-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-6">
                    <div className="lg:col-span-4">
                        <Wordmark size="lg" />
                        <p className="mt-4 text-[14px] text-[var(--muted)] max-w-[320px]">
                            Gestionale per la ristorazione. Un prodotto {COMPANY_NAME}.
                        </p>
                    </div>
                    <nav aria-label="Link utili" className="lg:col-span-2 lg:col-start-6">
                        <p className="label mb-3">Prodotto</p>
                        <ul className="space-y-2 text-[14.5px]">
                            <li><a href="#flusso" className="link-u">Come funziona</a></li>
                            <li><a href="#funzioni" className="link-u">Funzioni</a></li>
                            <li><Link to="/signup" className="link-u">Registra il locale</Link></li>
                            <li><Link to="/login" className="link-u">Accedi</Link></li>
                        </ul>
                    </nav>
                    <nav aria-label="Note legali" className="lg:col-span-2">
                        <p className="label mb-3">Legale</p>
                        <ul className="space-y-2 text-[14.5px]">
                            <li><Link to="/privacy" className="link-u">Privacy policy</Link></li>
                            <li><Link to="/cookie-policy" className="link-u">Cookie policy</Link></li>
                            <li><ManageCookiesLink className="link-u text-left" /></li>
                        </ul>
                    </nav>
                    <div className="lg:col-span-3">
                        <p className="label mb-3">Contatti</p>
                        <p className="text-[14.5px]"><a href={`mailto:${CONTACT_EMAIL}`} className="link-u break-all">{CONTACT_EMAIL}</a></p>
                    </div>
                    <div className="sm:col-span-2 lg:col-span-12 border-t border-[var(--rule)] pt-5 flex flex-col gap-1 sm:flex-row sm:justify-between mono text-[11.5px] text-[var(--muted)]">
                        <span>© {year} {COMPANY_LEGAL.tradeName}, un brand di {COMPANY_LEGAL.holder}</span>
                        <span>{COMPANY_LEGAL.address} · P.IVA {COMPANY_LEGAL.vat}</span>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
