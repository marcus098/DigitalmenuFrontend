import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './landing.css';
import { BRAND_NAME, COMPANY_NAME, CONTACT_EMAIL } from './brand';
import { CassaMockup, OrdersBoardMockup, PhoneMenuMockup, StampCardMockup, TemplateStrip, TicketMockup } from './Mockups';
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
type Feature = { term: string; text: React.ReactNode };
type Chapter = { n: string; id: string; title: string; lede: string; features: Feature[]; aside?: React.ReactNode; wide?: React.ReactNode };

const CHAPTERS: Chapter[] = [
    {
        n: '01', id: 'menu', title: 'Menu digitale e ordini dal tavolo',
        lede: 'Il cliente inquadra il QR sul tavolo e ordina dal suo telefono, nel browser. Niente app da scaricare.',
        features: [
            { term: 'QR per ogni tavolo', text: 'Generi e stampi i QR dalla dashboard. Chi lo inquadra apre il menu già associato a quel tavolo.' },
            { term: `${MENU_TEMPLATES.length} template grafici`, text: 'Dal Classico con i prezzi a puntini al Pub, dal Cocktail bar alla Pizzeria: scegli quello che somiglia al tuo locale.' },
            { term: 'Ingredienti e allergeni', text: 'Ogni piatto ha i suoi ingredienti e allergeni. Il cliente può nascondere quello che non può mangiare.' },
            { term: 'Aggiunte e rimozioni', text: '“Senza cipolla”, “più mozzarella”: le modifiche si scelgono dal telefono e arrivano scritte sulla comanda.' },
            { term: 'Ordine di gruppo', text: 'Allo stesso tavolo ognuno ordina dal proprio telefono; la comanda parte quando tutti sono pronti. Il tavolo si sblocca con il codice dato dal cameriere.' },
            { term: 'Stato dell’ordine in diretta', text: 'Dopo l’invio il cliente vede quando l’ordine è ricevuto, in preparazione e pronto, senza ricaricare la pagina.' },
        ],
    },
    {
        n: '02', id: 'sala', title: 'Sala, camerieri e ordini in tempo reale',
        lede: 'Gli ordini dal QR e quelli presi dai camerieri finiscono nello stesso posto, nel momento in cui vengono inviati.',
        features: [
            { term: 'App per i camerieri', text: 'Dal telefono, con lo stesso menu dei clienti: ordini al tavolo, da asporto o a domicilio.' },
            { term: 'Ordini live', text: 'La schermata ordini si aggiorna da sola: accetti, mandi in preparazione, segni come pronto.' },
            { term: 'Gestione sala', text: 'Tavoli liberi e occupati, apertura e chiusura del tavolo, sessioni di gruppo.' },
            { term: 'Staff con accessi propri', text: 'Inviti i camerieri con un link; l’account si attiva dopo la tua approvazione.' },
            { term: 'Etichette elettroniche al tavolo', text: 'Con tag e-paper OpenEPaperLink, all’apertura del tavolo il suo QR viene inviato direttamente sull’etichetta.' },
        ],
        aside: <OrdersBoardMockup />,
    },
    {
        n: '03', id: 'cucina', title: 'Comande stampate in cucina e al bar',
        lede: 'La comanda arriva alla stampante giusta, divisa per categoria, con le modifiche e le note in chiaro.',
        features: [
            { term: 'Star CloudPRNT', text: 'La stampante si collega da sola via internet e scarica le comande. Nessun computer acceso in cucina.' },
            { term: 'Stampanti ESC/POS', text: 'Le classiche stampanti termiche, collegate tramite un piccolo bridge nella rete del locale.' },
            { term: 'Tablet Android con RawBT', text: 'Il tablet in cucina stampa con “Accetta e stampa” e “Ristampa”, senza code sul server.' },
            { term: 'Una stampante per reparto', text: 'Ogni stampante riceve solo le categorie che le competono, alla creazione o all’accettazione della comanda. Stato di ogni stampa e ristampa dalla dashboard.' },
        ],
        aside: (
            <figure className="m-0 flex flex-col items-start">
                <TicketMockup />
                <figcaption className="eyebrow mt-4">Fig. 3 — Una comanda come esce dalla stampante</figcaption>
            </figure>
        ),
    },
    {
        n: '04', id: 'cassa', title: 'Cassa e tessere fedeltà',
        lede: 'Il conto si chiude in pochi tocchi, con lo sconto come lo fai davvero: in percentuale o arrotondando il totale.',
        features: [
            { term: 'Conto per tavolo e per ordine', text: 'Aggiungi articoli all’ultimo momento, applichi lo sconto e chiudi. Gli ordini già pagati online non vengono contati due volte.' },
            { term: 'Sconto su “Prezzo finale”', text: 'Scrivi direttamente quanto deve pagare il cliente: lo sconto lo calcola la cassa.' },
            { term: 'Tessere a punti o a timbri', text: 'Le crei dalla dashboard e le carichi alla chiusura del conto. Il cliente riceve la tessera via email con il QR e ne controlla lo stato quando vuole.' },
        ],
        wide: (
            <div className="grid gap-10 md:grid-cols-2 md:items-start">
                <CassaMockup />
                <StampCardMockup />
            </div>
        ),
    },
    {
        n: '05', id: 'asporto', title: 'Asporto, domicilio e prenotazioni',
        lede: 'Anche quando il cliente non è seduto al tavolo, l’ordine passa dallo stesso flusso.',
        features: [
            { term: 'Asporto con fasce orarie', text: 'Il cliente ordina online e sceglie l’orario di ritiro tra gli slot disponibili, per oggi e i due giorni successivi.' },
            { term: 'Pausa e chiusure', text: 'Imposti orari e giorni di chiusura; quando la cucina è piena metti in pausa gli ordini da asporto per qualche minuto.' },
            { term: 'Ordini a domicilio', text: 'Gli ordini telefonici a domicilio si inseriscono dall’app camerieri con indirizzo e orario, e vanno in stampa come gli altri.' },
            { term: 'Prenotazioni', text: 'I clienti chiedono un tavolo dalla pagina del locale; tu confermi, annulli o segni il no-show da un calendario.' },
        ],
    },
    {
        n: '06', id: 'gestione', title: 'Numeri e back office',
        lede: 'Quello che serve per capire come va il locale, senza esportare fogli di calcolo.',
        features: [
            { term: 'Analytics', text: 'Ricavi e ordini degli ultimi sette giorni, prodotti venduti per categoria.' },
            { term: 'Report camerieri', text: 'Ordini e incassi per ogni cameriere.' },
            { term: 'Menu sempre aggiornato', text: 'Categorie, prodotti, ingredienti e foto si modificano dalla dashboard e sono subito online.' },
            { term: 'Documenti', text: 'Un archivio a cartelle per tenere i file del locale in un posto solo.' },
        ],
    },
];

const STEPS: { title: string; text: string }[] = [
    { title: 'Ci scrivi', text: 'Ci racconti il locale e ti mostriamo il prodotto su quello che ti serve davvero.' },
    { title: 'Carichi il menu', text: 'Categorie, piatti, ingredienti e allergeni. Scegli il template e i tuoi colori sono pronti.' },
    { title: 'Prepari la sala', text: 'Crei i tavoli, stampi i QR, colleghi le stampanti e inviti i camerieri.' },
    { title: 'Apri il servizio', text: 'Gli ordini arrivano dal tavolo, dai camerieri e dall’asporto. Tu guardi una sola schermata.' },
];

const VENUES: { name: string; text: string }[] = [
    { name: 'Ristoranti e trattorie', text: 'Ordini al tavolo e dai camerieri, comande divise tra cucina e bar, conto con sconto e prenotazioni.' },
    { name: 'Pizzerie', text: 'Asporto con fasce orarie e pausa quando il forno è pieno, domicilio da telefono, aggiunte e rimozioni scritte in chiaro sulla comanda.' },
    { name: 'Bar e caffetterie', text: 'Ordini veloci dal QR, tessere a timbri per i clienti abituali, conto chiuso in pochi tocchi.' },
    { name: 'Pub e birrerie', text: 'Ordini di gruppo dallo stesso tavolo, comande al bancone e in cucina su stampanti diverse.' },
    { name: 'Cocktail bar', text: 'Una carta che ha l’aspetto del locale, allergeni consultabili, ordini dal tavolo senza aspettare.' },
    { name: 'Street food, sushi e cucine etniche', text: 'Asporto prepagato online, slot di ritiro, menu con ingredienti e allergeni dettagliati.' },
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
        a: 'Sì. Le modifiche fatte dalla dashboard sono subito visibili a clienti e camerieri, senza ristampare nulla.',
    },
    {
        q: 'Quanto costa?',
        a: 'Dipende dal locale e da cosa ti serve. Scrivici dal modulo qui sotto e ti rispondiamo con una proposta.',
    },
];

// ─── Pezzi di layout ────────────────────────────────────────────────────────────
const Container: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-10 ${className}`}>{children}</div>
);

const NAV = [
    { href: '#funzioni', label: 'Funzioni' },
    { href: '#pagamenti', label: 'Pagamenti' },
    { href: '#come-funziona', label: 'Come funziona' },
    { href: '#faq', label: 'Domande' },
];

const SiteHeader: React.FC = () => {
    const [open, setOpen] = useState(false);
    return (
        <header className="border-b border-[var(--rule)]">
            <Container className="flex h-16 items-center justify-between gap-6">
                <a href="#top" className="f-display text-[22px] leading-none" aria-label={`${BRAND_NAME}, torna all'inizio`}>
                    {BRAND_NAME}
                </a>
                <nav aria-label="Sezioni" className="hidden md:block">
                    <ul className="flex items-center gap-7 text-[15px]">
                        {NAV.map(n => <li key={n.href}><a href={n.href} className="hover:text-[var(--accent)]">{n.label}</a></li>)}
                    </ul>
                </nav>
                <div className="hidden md:flex items-center gap-5 text-[15px]">
                    <Link to="/login" className="font-semibold hover:text-[var(--accent)]">Accedi</Link>
                    <a href="#contatti" className="btn btn-ink !py-2 !px-4">Contattaci</a>
                </div>
                <button
                    type="button"
                    className="md:hidden -mr-2 p-2 text-[15px] font-semibold"
                    aria-expanded={open}
                    aria-controls="lp-mobile-nav"
                    onClick={() => setOpen(o => !o)}
                >
                    {open ? 'Chiudi' : 'Menu'}
                </button>
            </Container>
            {open && (
                <nav id="lp-mobile-nav" aria-label="Sezioni" className="md:hidden border-t border-[var(--rule)]">
                    <Container>
                        <ul className="py-2 text-[17px]">
                            {[...NAV, { href: '#contatti', label: 'Contattaci' }].map(n => (
                                <li key={n.href}>
                                    <a href={n.href} onClick={() => setOpen(false)} className="block py-3 border-b border-[var(--rule)]">{n.label}</a>
                                </li>
                            ))}
                            <li><Link to="/login" className="block py-3 font-semibold">Accedi</Link></li>
                        </ul>
                    </Container>
                </nav>
            )}
        </header>
    );
};

// ─── Pagina ─────────────────────────────────────────────────────────────────────
const LandingPage: React.FC = () => {
    useHead();
    const year = new Date().getFullYear();

    return (
        <div className="lp min-h-screen" id="top">
            <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-[var(--ink)] focus:px-4 focus:py-2 focus:text-[var(--paper)]">
                Vai al contenuto
            </a>
            <SiteHeader />

            <main id="main">
                {/* ── Hero ─────────────────────────────────────────────── */}
                <section aria-labelledby="hero-title" className="border-b border-[var(--rule)]">
                    <Container className="grid gap-14 py-14 sm:py-20 lg:grid-cols-12 lg:gap-8 lg:py-24">
                        <div className="lg:col-span-7 lg:pr-6">
                            <p className="eyebrow">Gestionale per la ristorazione · di {COMPANY_NAME}</p>
                            <h1 id="hero-title" className="f-display mt-5 text-[44px] leading-[1.02] sm:text-[64px] lg:text-[80px]">
                                Menu, comande, cucina e cassa.{' '}
                                <em className="font-normal italic text-[var(--accent)]">Un solo gestionale.</em>
                            </h1>
                            <p className="mt-7 max-w-[560px] text-[18px] sm:text-[19px] text-[var(--ink-2)]">
                                {BRAND_NAME} è il gestionale per bar, ristoranti, pub e pizzerie. I clienti ordinano
                                dal tavolo con il QR, i camerieri dal telefono, la cucina riceve la comanda stampata e
                                la cassa chiude il conto. Con tessere fedeltà, asporto e pagamenti online che arrivano
                                direttamente sul tuo conto.
                            </p>
                            <div className="mt-9 flex flex-wrap items-center gap-3">
                                <a href="#contatti" className="btn btn-ink">Richiedi una demo <span aria-hidden="true">→</span></a>
                                <a href="#funzioni" className="btn btn-ghost">Cosa fa</a>
                            </div>
                            <dl className="mt-12 grid max-w-[560px] grid-cols-3 border-t border-[var(--ink)] text-[13px]">
                                <div className="pt-3 pr-3">
                                    <dt className="eyebrow !text-[11px]">Template menu</dt>
                                    <dd className="f-display text-[30px] leading-tight mt-1">{MENU_TEMPLATES.length}</dd>
                                </div>
                                <div className="pt-3 px-3 border-l border-[var(--rule)]">
                                    <dt className="eyebrow !text-[11px]">Modi di stampare</dt>
                                    <dd className="f-display text-[30px] leading-tight mt-1">3</dd>
                                </div>
                                <div className="pt-3 pl-3 border-l border-[var(--rule)]">
                                    <dt className="eyebrow !text-[11px]">Commissioni nostre sugli incassi</dt>
                                    <dd className="f-display text-[30px] leading-tight mt-1">0</dd>
                                </div>
                            </dl>
                        </div>

                        <figure className="m-0 lg:col-span-5">
                            <div className="relative sm:pb-20 lg:pb-0 lg:min-h-[600px]">
                                <PhoneMenuMockup className="sm:ml-auto sm:mr-[4%] sm:w-fit lg:absolute lg:right-0 lg:top-0 lg:mr-0" />
                                <TicketMockup compact className="hidden sm:block absolute left-0 bottom-0 lg:left-[-8%] lg:bottom-4 -rotate-[4deg]" />
                            </div>
                            <figcaption className="eyebrow mt-6 lg:text-right">
                                Fig. 1 — Il menu sul telefono del cliente<span className="hidden sm:inline"> e la comanda che esce in cucina</span>
                            </figcaption>
                        </figure>
                    </Container>
                </section>

                {/* ── Per chi (riga indice) ───────────────────────────── */}
                <div className="border-b border-[var(--rule)] bg-[var(--paper-2)]">
                    <Container className="py-4">
                        <p className="text-[14px] sm:text-[15px] text-[var(--ink-2)]">
                            <span className="eyebrow mr-3">Per</span>
                            ristoranti · pizzerie · bar · pub e birrerie · cocktail bar · trattorie e osterie ·
                            caffè e pasticcerie · street food · sushi e cucine etniche
                        </p>
                    </Container>
                </div>

                {/* ── Funzioni ─────────────────────────────────────────── */}
                <section id="funzioni" aria-labelledby="funzioni-title" className="scroll-mt-4">
                    <Container className="pt-20 sm:pt-28 pb-6">
                        <div className="grid gap-6 lg:grid-cols-12">
                            <h2 id="funzioni-title" className="f-display text-[38px] leading-[1.05] sm:text-[52px] lg:col-span-7">
                                Tutto il servizio, dal QR sul tavolo alla chiusura del conto.
                            </h2>
                            <p className="text-[var(--ink-2)] lg:col-span-4 lg:col-start-9 lg:pt-3">
                                Non è solo un menu digitale. Sono sei pezzi del lavoro di ogni sera che di solito
                                vivono su carta, su tre app diverse o nella testa di qualcuno.
                            </p>
                        </div>
                    </Container>

                    {CHAPTERS.map((ch, idx) => (
                        <article key={ch.id} id={ch.id} aria-labelledby={`${ch.id}-title`} className="scroll-mt-4">
                            <Container className="py-14 sm:py-20">
                                <div className="rule-double pt-8 grid gap-10 lg:grid-cols-12 lg:gap-8">
                                    <header className="lg:col-span-4">
                                        <div className="lg:sticky lg:top-8">
                                            <div className="f-mono text-[13px] text-[var(--accent)] font-medium">{ch.n} / 06</div>
                                            <h3 id={`${ch.id}-title`} className="f-display mt-3 text-[30px] leading-[1.1] sm:text-[36px]">{ch.title}</h3>
                                            <p className="mt-4 text-[var(--ink-2)]">{ch.lede}</p>
                                        </div>
                                    </header>
                                    <div className={`lg:col-span-8 ${ch.aside ? 'grid gap-10 xl:grid-cols-[1fr_auto] xl:gap-12' : ''}`}>
                                        <dl className={`grid ${ch.aside ? '' : 'sm:grid-cols-2'} gap-x-10`}>
                                            {ch.features.map(f => (
                                                <div key={f.term} className="border-t border-[var(--rule)] py-5">
                                                    <dt className="font-semibold text-[17px]">{f.term}</dt>
                                                    <dd className="mt-1.5 text-[15.5px] text-[var(--ink-2)]">{f.text}</dd>
                                                </div>
                                            ))}
                                        </dl>
                                        {ch.aside && <div className={`xl:w-[330px] ${idx % 2 ? 'xl:pt-10' : ''}`}>{ch.aside}</div>}
                                    </div>
                                </div>
                                {ch.id === 'menu' && (
                                    <div className="mt-14">
                                        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--ink)] pb-3 mb-6">
                                            <h4 className="f-display text-[22px]">La libreria dei template</h4>
                                            <span className="eyebrow">Colori e caratteri reali dei {MENU_TEMPLATES.length} template</span>
                                        </div>
                                        <TemplateStrip />
                                    </div>
                                )}
                                {ch.wide && <div className="mt-14">{ch.wide}</div>}
                            </Container>
                        </article>
                    ))}
                </section>

                {/* ── Pagamenti ────────────────────────────────────────── */}
                <section id="pagamenti" aria-labelledby="pagamenti-title" className="bg-[var(--ink)] text-[var(--paper)] scroll-mt-4">
                    <Container className="py-20 sm:py-28">
                        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
                            <div className="lg:col-span-6">
                                <p className="eyebrow !text-[rgba(243,238,228,0.62)]">Pagamenti online</p>
                                <h2 id="pagamenti-title" className="f-display mt-4 text-[40px] leading-[1.03] sm:text-[58px]">
                                    I soldi vanno sul tuo conto. <em className="italic font-normal text-[var(--accent-soft)]">Non sul nostro.</em>
                                </h2>
                                <p className="mt-7 max-w-[520px] text-[17px] on-dark-72">
                                    Colleghi il tuo account Stripe o SumUp e i clienti pagano dal telefono, al tavolo o
                                    per l’asporto. L’incasso va direttamente a te, con i tempi e le commissioni del tuo
                                    contratto con il provider. {BRAND_NAME} non fa da intermediario e non trattiene
                                    percentuali sulle transazioni.
                                </p>
                            </div>
                            <div className="lg:col-span-5 lg:col-start-8 lg:pt-4">
                                <ol className="relative border-l on-dark-rule ml-2">
                                    {[
                                        ['Il cliente paga dal telefono', 'Con i metodi di pagamento che hai attivato sul tuo provider.'],
                                        ['Il tuo account Stripe o SumUp', 'Le chiavi le inserisci tu nella dashboard e restano salvate cifrate.'],
                                        ['Il tuo conto in banca', 'Nessun passaggio per conti della piattaforma.'],
                                    ].map(([t, d], i) => (
                                        <li key={t} className="relative pl-8 pb-9 last:pb-0">
                                            <span className="absolute -left-[9px] top-1 h-[17px] w-[17px] rounded-full border-[1.5px] border-[var(--paper)] bg-[var(--ink)] f-mono text-[9px] leading-[14px] text-center">{i + 1}</span>
                                            <div className="font-semibold text-[18px]">{t}</div>
                                            <div className="mt-1 text-[15px] on-dark-72">{d}</div>
                                        </li>
                                    ))}
                                </ol>
                            </div>
                        </div>
                        <ul className="mt-16 grid gap-px on-dark-grid border-y on-dark-rule sm:grid-cols-2 lg:grid-cols-4 text-[15px]">
                            {[
                                ['Facoltativo', 'Attivi il pagamento online solo se ti serve; il cliente può sempre pagare in cassa.'],
                                ['Anticipato dove serve', 'Puoi richiederlo solo per l’asporto, solo al tavolo o per entrambi.'],
                                ['Rimborsi', 'Si gestiscono dalla dashboard, sul tuo stesso account.'],
                                ['In cassa è già segnato', 'Un ordine pagato online non viene incassato due volte alla chiusura del conto.'],
                            ].map(([t, d]) => (
                                <li key={t} className="bg-[var(--ink)] py-5 sm:p-6">
                                    <div className="font-semibold">{t}</div>
                                    <div className="mt-1.5 on-dark-72">{d}</div>
                                </li>
                            ))}
                        </ul>
                    </Container>
                </section>

                {/* ── Come funziona ─────────────────────────────────────── */}
                <section id="come-funziona" aria-labelledby="come-title" className="border-b border-[var(--rule)] scroll-mt-4">
                    <Container className="py-20 sm:py-28">
                        <h2 id="come-title" className="f-display text-[38px] leading-[1.05] sm:text-[52px] max-w-[720px]">
                            Come si parte
                        </h2>
                        <ol className="mt-12 grid gap-0 sm:grid-cols-2 lg:grid-cols-4">
                            {STEPS.map((s, i) => (
                                <li key={s.title} className="border-t-[1.5px] border-[var(--ink)] pt-5 pb-10 sm:pr-8">
                                    <div className="f-display text-[56px] leading-none text-[var(--accent)]">{i + 1}</div>
                                    <h3 className="mt-5 text-[19px] font-semibold">{s.title}</h3>
                                    <p className="mt-2 text-[15.5px] text-[var(--ink-2)]">{s.text}</p>
                                </li>
                            ))}
                        </ol>
                    </Container>
                </section>

                {/* ── Per chi è ─────────────────────────────────────────── */}
                <section aria-labelledby="perchi-title" className="border-b border-[var(--rule)]">
                    <Container className="py-20 sm:py-28 grid gap-10 lg:grid-cols-12 lg:gap-8">
                        <div className="lg:col-span-4">
                            <h2 id="perchi-title" className="f-display text-[38px] leading-[1.05] sm:text-[48px]">Per chi è</h2>
                            <p className="mt-5 text-[var(--ink-2)]">
                                Per chi ha un locale con servizio al tavolo, al banco o da asporto. Ogni tipo di locale
                                usa le parti che gli servono.
                            </p>
                        </div>
                        <ul className="lg:col-span-8">
                            {VENUES.map(v => (
                                <li key={v.name} className="grid gap-1 border-t border-[var(--rule)] py-5 sm:grid-cols-[220px_1fr] sm:gap-8 last:border-b">
                                    <h3 className="f-display text-[22px] leading-tight">{v.name}</h3>
                                    <p className="text-[15.5px] text-[var(--ink-2)]">{v.text}</p>
                                </li>
                            ))}
                        </ul>
                    </Container>
                </section>

                {/* ── FAQ ───────────────────────────────────────────────── */}
                <section id="faq" aria-labelledby="faq-title" className="border-b border-[var(--rule)] scroll-mt-4">
                    <Container className="py-20 sm:py-28 grid gap-10 lg:grid-cols-12 lg:gap-8">
                        <h2 id="faq-title" className="f-display text-[38px] leading-[1.05] sm:text-[48px] lg:col-span-4">Domande frequenti</h2>
                        <div className="lg:col-span-8 border-b border-[var(--rule)]">
                            {FAQ.map(item => (
                                <details key={item.q} className="border-t border-[var(--rule)] group">
                                    <summary className="flex items-start justify-between gap-6 py-5 text-[18px] font-semibold hover:text-[var(--accent)]">
                                        <span>{item.q}</span>
                                        <span aria-hidden="true" className="faq-mark f-mono text-[22px] leading-none mt-0.5">+</span>
                                    </summary>
                                    <p className="pb-6 pr-10 text-[16px] text-[var(--ink-2)]">{item.a}</p>
                                </details>
                            ))}
                        </div>
                    </Container>
                </section>

                {/* ── Contatti ──────────────────────────────────────────── */}
                <section id="contatti" aria-labelledby="contatti-title" className="scroll-mt-4">
                    <Container className="py-20 sm:py-28 grid gap-12 lg:grid-cols-12 lg:gap-8">
                        <div className="lg:col-span-4">
                            <p className="eyebrow">Contattaci</p>
                            <h2 id="contatti-title" className="f-display mt-4 text-[38px] leading-[1.05] sm:text-[52px]">
                                Parliamo del tuo locale.
                            </h2>
                            <p className="mt-5 text-[var(--ink-2)]">
                                Scrivici com’è organizzato il servizio e cosa vorresti cambiare. Ti rispondiamo noi di
                                {' '}{COMPANY_NAME}, non un bot.
                            </p>
                            <p className="mt-8 text-[15px]">
                                <span className="eyebrow block mb-1">Email</span>
                                <a href={`mailto:${CONTACT_EMAIL}`} className="link-u">{CONTACT_EMAIL}</a>
                            </p>
                        </div>
                        <div className="lg:col-span-7 lg:col-start-6">
                            <ContactForm />
                        </div>
                    </Container>
                </section>
            </main>

            {/* ── Footer ────────────────────────────────────────────────── */}
            <footer className="bg-[var(--paper-2)] border-t border-[var(--rule)]">
                <Container className="py-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-12">
                    <div className="lg:col-span-6">
                        <div className="f-display text-[26px]">{BRAND_NAME}</div>
                        <p className="mt-2 text-[14px] text-[var(--muted)]">
                            Gestionale per la ristorazione. Un prodotto {COMPANY_NAME}.
                        </p>
                    </div>
                    <nav aria-label="Link utili" className="lg:col-span-3">
                        <ul className="space-y-2 text-[15px]">
                            <li><Link to="/login" className="link-u">Accedi</Link></li>
                            <li><a href="#contatti" className="link-u">Contattaci</a></li>
                        </ul>
                    </nav>
                    <nav aria-label="Note legali" className="lg:col-span-3">
                        <ul className="space-y-2 text-[15px]">
                            <li><Link to="/privacy" className="link-u">Privacy policy</Link></li>
                            <li><Link to="/cookie-policy" className="link-u">Cookie policy</Link></li>
                            <li><ManageCookiesLink className="link-u text-left" /></li>
                        </ul>
                    </nav>
                    <p className="sm:col-span-2 lg:col-span-12 border-t border-[var(--rule)] pt-6 text-[13px] text-[var(--muted)]">
                        © {year} {COMPANY_NAME}
                    </p>
                </Container>
            </footer>
        </div>
    );
};

export default LandingPage;
