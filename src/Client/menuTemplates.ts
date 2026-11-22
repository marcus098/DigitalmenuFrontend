/**
 * Libreria dei template del menu pubblico (landing + pagine menu).
 *
 * Il template scelto è salvato come stringa libera in `StyleDto.landingTemplate`
 * (colonna VARCHAR(255) lato backend, nessun enum): aggiungere un template qui non
 * richiede modifiche al backend. Chiavi sconosciute ricadono su 'default'.
 *
 * Ogni template definisce:
 *  - palette: colori di partenza, applicati ai campi colore dello stile quando
 *    il ristoratore sceglie il template (poi li può ritoccare dal tab "Colori");
 *  - fonts:   abbinamento tipografico (titoli / testo / prezzi) da Google Fonts;
 *  - look:    scelte di impaginazione ispirate ai menu stampati (filetti,
 *             puntini tra piatto e prezzo, numerazione, texture della carta…).
 *
 * Ritocchi del ristoratore (Dashboard → Personalizza aspetto → Layout): sono salvati
 * nella stessa stringa, dopo la chiave del template, es.
 *   "enoteca|pl=grid;im=round;r=4"
 * Il formato è compatto (max ~120 caratteri) e ignorato se non valido: i valori storici
 * ("default", "trattoria"…) restano identici e si vedono esattamente come prima.
 */

export type MenuTemplateKey =
    | 'default'
    | 'minimal'
    | 'luxury'
    | 'trattoria'
    | 'bistrot'
    | 'pub'
    | 'cocktail'
    | 'caffe'
    | 'pizzeria'
    | 'street'
    | 'sushi'
    | 'enoteca'
    | 'gelateria'
    | 'brasserie'
    | 'braceria'
    | 'vegetale'
    | 'mediterraneo'
    | 'diner'
    | 'izakaya'
    | 'agriturismo'
    | 'levante'
    | 'forno';

export type VenueTag =
    | 'ristorante'
    | 'trattoria'
    | 'enoteca'
    | 'pizzeria'
    | 'pesce'
    | 'braceria'
    | 'bar'
    | 'caffe'
    | 'gelateria'
    | 'forno'
    | 'vegano'
    | 'pub'
    | 'cocktail'
    | 'street'
    | 'etnico'
    | 'fine';

export const VENUE_FILTERS: { key: VenueTag | 'all'; label: string }[] = [
    { key: 'all',        label: 'Tutti' },
    { key: 'ristorante', label: 'Ristorante' },
    { key: 'trattoria',  label: 'Trattoria / Osteria' },
    { key: 'enoteca',    label: 'Enoteca / Wine bar' },
    { key: 'pizzeria',   label: 'Pizzeria' },
    { key: 'pesce',      label: 'Pesce' },
    { key: 'braceria',   label: 'Braceria / Steakhouse' },
    { key: 'bar',        label: 'Bar' },
    { key: 'caffe',      label: 'Caffè / Pasticceria' },
    { key: 'gelateria',  label: 'Gelateria' },
    { key: 'forno',      label: 'Panificio / Forno' },
    { key: 'vegano',     label: 'Vegano / Healthy' },
    { key: 'pub',        label: 'Pub / Birreria' },
    { key: 'cocktail',   label: 'Cocktail bar' },
    { key: 'street',     label: 'Street food / Burger' },
    { key: 'etnico',     label: 'Sushi / Etnico' },
    { key: 'fine',       label: 'Fine dining' },
];

export type DividerStyle =
    | 'hairline' | 'double' | 'thick' | 'dashed' | 'checker' | 'ornament'
    // aggiunti a novembre 2026 (vedi index.css → .menu-rule--*)
    | 'tile' | 'girih' | 'nouveau' | 'brush' | 'awning' | 'diner' | 'stitch' | 'none';
export type TextureStyle =
    | 'none' | 'paper' | 'chalk' | 'wood' | 'washi'
    | 'laid' | 'butcher' | 'flecks' | 'sashiko' | 'kraft' | 'flour';

/** Impaginazione dei piatti in una categoria. */
export type ProductLayout = 'menu' | 'centered' | 'cards' | 'twocol' | 'grid';
/** Forma delle foto dei piatti. */
export type ImageShape = 'square' | 'round' | 'arch';
/** Spaziatura tra i piatti. */
export type Density = 'compact' | 'normal' | 'airy';
/** Dove sta il prezzo rispetto al nome. */
export type PricePosition = 'right' | 'below' | 'inline';
/** Titolo delle sezioni (categoria nella pagina piatti, titoli del sito vetrina). */
export type SectionHeaderStyle = 'plain' | 'ruled' | 'band' | 'label' | 'stamp' | 'seal' | 'arch';
/** Barra delle categorie nella pagina piatti. */
export type CategoryNavStyle = 'underline' | 'pill' | 'block';
/** Testata con il nome del locale (menu + sito vetrina "a testata"). */
export type HeaderStyle = 'plain' | 'framed' | 'banner' | 'stamp' | 'script' | 'noren' | 'tape' | 'awning';
/** Pulsanti del sito vetrina. */
export type ButtonStyle = 'solid' | 'outline' | 'underline';
/** Descrizione dei piatti: 'auto' = corsivo se i titoli sono in corsivo (comportamento storico). */
export type DescriptionStyle = 'auto' | 'italic' | 'ingredients';

export interface TemplatePalette {
    bg: string;
    card: string;
    text: string;
    muted: string;
    accent: string;
    accentText: string;
    secondary: string;
    secondaryText: string;
    heroBg: string;
    heroOverlay: number;
}

export interface TemplateFonts {
    display: string;
    body: string;
    /** Font per i prezzi (es. monospazio nel Minimal). Default = body. */
    price?: string;
    /** Font "insegna" per il nome del locale (es. corsivo del Diner). Default = display. */
    accent?: string;
    /** Query Google Fonts (`family=` value) da caricare per questo template. */
    google: string[];
}

/** Scelte storiche (presenti in tutti i template dal 2026-10). */
interface BaseLook {
    /** Allineamento di titoli e intestazioni. */
    align: 'left' | 'center';
    headingCase: 'none' | 'uppercase' | 'smallcaps';
    headingStyle: 'normal' | 'italic';
    headingWeight: number;
    headingTracking: string;
    divider: DividerStyle;
    texture: TextureStyle;
    /** Raggio per bottoni, immagini e riquadri (px). */
    radius: number;
    /** Puntini tra nome del piatto e prezzo. */
    leaders: boolean;
    /** Come appare il prezzo. */
    price: 'plain' | 'accent' | 'badge';
    /** Impaginazione dei prodotti in una categoria. */
    productLayout: ProductLayout;
    /** Impaginazione della lista categorie. */
    categoryLayout: 'index' | 'tiles' | 'rows';
    /** Numerazione delle categorie. */
    categoryNumbers: 'none' | 'arabic' | 'roman';
    /** Numerazione dei piatti (tipica di sushi / cucine etniche). */
    productNumbers: boolean;
    /** Intestazione: testo sopra la foto oppure "testata" tipografica con foto separata. */
    hero: 'overlay' | 'masthead';
    /** Bordo delle schede (layout cards / tiles). */
    cardBorder: 'none' | 'hairline' | 'heavy';
    /** Ombra piena sfalsata (stile street / poster). */
    offsetShadow: boolean;
    /** Larghezza massima del contenuto della landing. */
    width: 'narrow' | 'wide';
    /** Striscia categorie nella landing: scorrevole o statica. */
    ticker: 'marquee' | 'static';
}

/** Scelte aggiunte a novembre 2026: facoltative nella definizione, default = aspetto storico. */
interface ExtLook {
    imageShape: ImageShape;
    density: Density;
    pricePosition: PricePosition;
    sectionHeader: SectionHeaderStyle;
    categoryNav: CategoryNavStyle;
    headerStyle: HeaderStyle;
    buttonStyle: ButtonStyle;
    descStyle: DescriptionStyle;
}

export type TemplateLook = BaseLook & ExtLook;

const EXT_DEFAULTS: ExtLook = {
    imageShape: 'square',
    density: 'normal',
    pricePosition: 'right',
    sectionHeader: 'plain',
    categoryNav: 'underline',
    headerStyle: 'plain',
    buttonStyle: 'solid',
    descStyle: 'auto',
};

export interface MenuTemplateDef {
    key: MenuTemplateKey;
    label: string;
    /** Descrizione breve per il ristoratore: per quale locale è pensato. */
    description: string;
    venues: VenueTag[];
    palette: TemplatePalette;
    fonts: TemplateFonts;
    look: TemplateLook;
}

interface TemplateSpec extends Omit<MenuTemplateDef, 'look'> {
    look: BaseLook & Partial<ExtLook>;
}

// ─── Libreria ─────────────────────────────────────────────────────────────────

const SPECS: TemplateSpec[] = [
    {
        key: 'default',
        label: 'Classico',
        description: 'Carta avorio, titoli serif classici, doppio filetto e prezzi con i puntini. Il menu del ristorante di tradizione.',
        venues: ['ristorante', 'trattoria'],
        palette: {
            bg: '#f4eee2', card: '#faf6ee', text: '#1f1a14', muted: '#5b5143',
            accent: '#7a2318', accentText: '#faf6ee', secondary: '#1f1a14', secondaryText: '#f4eee2',
            heroBg: '#1f1a14', heroOverlay: 0.35,
        },
        fonts: {
            display: '"Libre Baskerville", Baskerville, Georgia, serif',
            body: 'Lato, "Segoe UI", Arial, sans-serif',
            google: ['Libre+Baskerville:wght@400;700', 'Lato:ital,wght@0,400;0,700;1,400'],
        },
        look: {
            align: 'center', headingCase: 'none', headingStyle: 'normal', headingWeight: 700, headingTracking: '0',
            divider: 'double', texture: 'paper', radius: 2, leaders: true, price: 'plain',
            productLayout: 'menu', categoryLayout: 'index', categoryNumbers: 'roman', productNumbers: false,
            hero: 'masthead', cardBorder: 'hairline', offsetShadow: false, width: 'narrow', ticker: 'static',
        },
    },
    {
        key: 'minimal',
        label: 'Minimal',
        description: 'Bianco, griglia svizzera, numeri in monospazio. Per locali moderni, caffetterie specialty e brunch.',
        venues: ['caffe', 'bar', 'ristorante'],
        palette: {
            bg: '#fafaf7', card: '#ffffff', text: '#141414', muted: '#5a5a55',
            accent: '#c8402a', accentText: '#ffffff', secondary: '#141414', secondaryText: '#ffffff',
            heroBg: '#141414', heroOverlay: 0.25,
        },
        fonts: {
            display: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif',
            body: '"IBM Plex Sans", "Helvetica Neue", Arial, sans-serif',
            price: '"IBM Plex Mono", ui-monospace, monospace',
            google: ['IBM+Plex+Sans:wght@400;500;600', 'IBM+Plex+Mono:wght@400;500'],
        },
        look: {
            align: 'left', headingCase: 'none', headingStyle: 'normal', headingWeight: 600, headingTracking: '-0.015em',
            divider: 'hairline', texture: 'none', radius: 0, leaders: false, price: 'plain',
            productLayout: 'menu', categoryLayout: 'index', categoryNumbers: 'arabic', productNumbers: false,
            hero: 'masthead', cardBorder: 'hairline', offsetShadow: false, width: 'wide', ticker: 'static',
        },
    },
    {
        key: 'luxury',
        label: 'Fine dining',
        description: 'Fondo scuro, titoli lapidari, tanto spazio vuoto e niente foto tra i piatti. Per cucina d\'autore e menu degustazione.',
        venues: ['fine', 'ristorante', 'cocktail'],
        palette: {
            bg: '#13120f', card: '#1a1916', text: '#ece6da', muted: '#a69d8c',
            accent: '#c2a26b', accentText: '#13120f', secondary: '#ece6da', secondaryText: '#13120f',
            heroBg: '#13120f', heroOverlay: 0.55,
        },
        fonts: {
            display: 'Cinzel, "Trajan Pro", Georgia, serif',
            body: 'Jost, "Futura", "Century Gothic", sans-serif',
            google: ['Cinzel:wght@400;500;600', 'Jost:wght@300;400;500'],
        },
        look: {
            align: 'center', headingCase: 'none', headingStyle: 'normal', headingWeight: 500, headingTracking: '0.04em',
            divider: 'ornament', texture: 'none', radius: 0, leaders: false, price: 'accent',
            productLayout: 'centered', categoryLayout: 'index', categoryNumbers: 'none', productNumbers: false,
            hero: 'masthead', cardBorder: 'none', offsetShadow: false, width: 'narrow', ticker: 'static',
        },
    },
    {
        key: 'trattoria',
        label: 'Trattoria',
        description: 'Carta paglia, bordo a quadretti, titoli rosso pomodoro. Cucina di casa, osterie, agriturismi.',
        venues: ['trattoria', 'pizzeria', 'ristorante'],
        palette: {
            bg: '#f1e6cf', card: '#f8f0de', text: '#2a1f16', muted: '#5e4e3b',
            accent: '#a3241a', accentText: '#fff8ec', secondary: '#2f4a2a', secondaryText: '#f8f0de',
            heroBg: '#2a1f16', heroOverlay: 0.35,
        },
        fonts: {
            display: '"Playfair Display", Georgia, serif',
            body: '"Source Sans 3", "Segoe UI", Arial, sans-serif',
            google: ['Playfair+Display:wght@700;800', 'Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400'],
        },
        look: {
            align: 'left', headingCase: 'none', headingStyle: 'normal', headingWeight: 700, headingTracking: '0',
            divider: 'checker', texture: 'paper', radius: 3, leaders: true, price: 'plain',
            productLayout: 'menu', categoryLayout: 'rows', categoryNumbers: 'none', productNumbers: false,
            hero: 'masthead', cardBorder: 'hairline', offsetShadow: false, width: 'narrow', ticker: 'static',
        },
    },
    {
        key: 'bistrot',
        label: 'Bistrot · Lavagna',
        description: 'Lavagna nera e scritte a gesso, come il menu del giorno appeso al muro. Bistrot, osterie moderne, wine bar.',
        venues: ['bar', 'ristorante', 'trattoria'],
        palette: {
            bg: '#232825', card: '#2a302c', text: '#f0ede4', muted: '#bdbcb1',
            accent: '#f1d27a', accentText: '#232825', secondary: '#f0ede4', secondaryText: '#232825',
            heroBg: '#232825', heroOverlay: 0.55,
        },
        fonts: {
            display: 'Caveat, "Segoe Print", cursive',
            body: '"Patrick Hand", "Segoe Print", cursive',
            google: ['Caveat:wght@600;700', 'Patrick+Hand'],
        },
        look: {
            align: 'center', headingCase: 'none', headingStyle: 'normal', headingWeight: 700, headingTracking: '0.01em',
            divider: 'dashed', texture: 'chalk', radius: 0, leaders: true, price: 'accent',
            productLayout: 'menu', categoryLayout: 'index', categoryNumbers: 'none', productNumbers: false,
            hero: 'masthead', cardBorder: 'hairline', offsetShadow: false, width: 'narrow', ticker: 'static',
        },
    },
    {
        key: 'pub',
        label: 'Pub',
        description: 'Legno scuro, ottone, condensato tutto maiuscolo. Birre alla spina, burger, fritti e partite.',
        venues: ['pub', 'bar', 'street'],
        palette: {
            bg: '#1c140e', card: '#271b12', text: '#f2e6cc', muted: '#c4b291',
            accent: '#d9a441', accentText: '#1c140e', secondary: '#7a2e1c', secondaryText: '#f2e6cc',
            heroBg: '#1c140e', heroOverlay: 0.5,
        },
        fonts: {
            display: 'Oswald, "Arial Narrow", sans-serif',
            body: '"Barlow Semi Condensed", "Arial Narrow", sans-serif',
            google: ['Oswald:wght@500;600;700', 'Barlow+Semi+Condensed:wght@400;500;600'],
        },
        look: {
            align: 'left', headingCase: 'uppercase', headingStyle: 'normal', headingWeight: 600, headingTracking: '0.03em',
            divider: 'thick', texture: 'wood', radius: 2, leaders: true, price: 'accent',
            productLayout: 'menu', categoryLayout: 'tiles', categoryNumbers: 'none', productNumbers: false,
            hero: 'overlay', cardBorder: 'heavy', offsetShadow: false, width: 'wide', ticker: 'marquee',
        },
    },
    {
        key: 'cocktail',
        label: 'Cocktail bar',
        description: 'Nero profondo, oro, Bodoni e linee déco. Per american bar, speakeasy e lounge.',
        venues: ['cocktail', 'bar', 'fine'],
        palette: {
            bg: '#0e1013', card: '#15181c', text: '#ebe5d6', muted: '#a9a395',
            accent: '#c9a85c', accentText: '#0e1013', secondary: '#1d3b3a', secondaryText: '#ebe5d6',
            heroBg: '#0e1013', heroOverlay: 0.6,
        },
        fonts: {
            display: '"Bodoni Moda", "Didot", "Bodoni 72", serif',
            body: '"Josefin Sans", "Futura", sans-serif',
            google: ['Bodoni+Moda:ital,opsz,wght@0,6..96,500;0,6..96,600;1,6..96,500', 'Josefin+Sans:wght@300;400;600'],
        },
        look: {
            align: 'center', headingCase: 'uppercase', headingStyle: 'normal', headingWeight: 500, headingTracking: '0.16em',
            divider: 'double', texture: 'none', radius: 0, leaders: true, price: 'accent',
            productLayout: 'menu', categoryLayout: 'index', categoryNumbers: 'none', productNumbers: false,
            hero: 'masthead', cardBorder: 'hairline', offsetShadow: false, width: 'narrow', ticker: 'static',
        },
    },
    {
        key: 'caffe',
        label: 'Caffè & Pasticceria',
        description: 'Chiaro e arioso, titoli tondi e foto della vetrina in primo piano. Colazioni, brunch, gelaterie, pasticcerie.',
        venues: ['caffe', 'bar'],
        palette: {
            bg: '#fbf7f1', card: '#ffffff', text: '#3a2a20', muted: '#6c5a4c',
            accent: '#a94f2b', accentText: '#ffffff', secondary: '#eadfd2', secondaryText: '#3a2a20',
            heroBg: '#3a2a20', heroOverlay: 0.2,
        },
        fonts: {
            display: 'Poppins, "Segoe UI", Arial, sans-serif',
            body: '"Nunito Sans", "Segoe UI", sans-serif',
            google: ['Poppins:wght@500;600;700', 'Nunito+Sans:wght@400;600;700'],
        },
        look: {
            align: 'left', headingCase: 'none', headingStyle: 'normal', headingWeight: 600, headingTracking: '-0.01em',
            divider: 'hairline', texture: 'none', radius: 10, leaders: false, price: 'accent',
            productLayout: 'cards', categoryLayout: 'tiles', categoryNumbers: 'none', productNumbers: false,
            hero: 'overlay', cardBorder: 'hairline', offsetShadow: false, width: 'wide', ticker: 'static',
        },
    },
    {
        key: 'pizzeria',
        label: 'Pizzeria',
        description: 'Caldo e deciso: slab spesso, rosso pomodoro e verde basilico. Si legge bene anche in sala piena.',
        venues: ['pizzeria', 'trattoria', 'street'],
        palette: {
            bg: '#fff6ea', card: '#fffdf8', text: '#24170f', muted: '#5f4c3a',
            accent: '#c3341b', accentText: '#ffffff', secondary: '#2e6b3b', secondaryText: '#ffffff',
            heroBg: '#24170f', heroOverlay: 0.45,
        },
        fonts: {
            display: '"Alfa Slab One", "Rockwell", serif',
            body: 'Rubik, "Segoe UI", sans-serif',
            google: ['Alfa+Slab+One', 'Rubik:wght@400;500;600'],
        },
        look: {
            align: 'left', headingCase: 'none', headingStyle: 'normal', headingWeight: 400, headingTracking: '0.005em',
            divider: 'thick', texture: 'none', radius: 6, leaders: true, price: 'accent',
            productLayout: 'menu', categoryLayout: 'rows', categoryNumbers: 'none', productNumbers: false,
            hero: 'overlay', cardBorder: 'hairline', offsetShadow: false, width: 'wide', ticker: 'marquee',
        },
    },
    {
        key: 'street',
        label: 'Street food',
        description: 'Alto contrasto, bordi neri spessi, ombre piene, prezzi in evidenza. Panini, burger, kebab, friggitorie.',
        venues: ['street', 'pub', 'pizzeria'],
        palette: {
            bg: '#f3f0e6', card: '#ffffff', text: '#0b0b0b', muted: '#45453f',
            accent: '#ffcc00', accentText: '#0b0b0b', secondary: '#0b0b0b', secondaryText: '#ffffff',
            heroBg: '#0b0b0b', heroOverlay: 0.5,
        },
        fonts: {
            display: 'Anton, Impact, "Arial Narrow", sans-serif',
            body: 'Archivo, "Segoe UI", sans-serif',
            google: ['Anton', 'Archivo:wght@400;500;700'],
        },
        look: {
            align: 'left', headingCase: 'uppercase', headingStyle: 'normal', headingWeight: 400, headingTracking: '0.01em',
            divider: 'thick', texture: 'none', radius: 0, leaders: false, price: 'badge',
            productLayout: 'cards', categoryLayout: 'tiles', categoryNumbers: 'none', productNumbers: false,
            hero: 'overlay', cardBorder: 'heavy', offsetShadow: true, width: 'wide', ticker: 'marquee',
        },
    },
    {
        key: 'sushi',
        label: 'Sushi & Etnico',
        description: 'Carta washi, filetti sottili, piatti numerati e timbro vermiglio. Sushi, ramen, poke, cucine dal mondo.',
        venues: ['etnico', 'ristorante'],
        palette: {
            bg: '#f3efe6', card: '#faf8f3', text: '#1b1b1b', muted: '#57544c',
            accent: '#b3302a', accentText: '#ffffff', secondary: '#1b1b1b', secondaryText: '#f3efe6',
            heroBg: '#1b1b1b', heroOverlay: 0.4,
        },
        fonts: {
            display: '"Shippori Mincho", "Yu Mincho", Georgia, serif',
            body: '"Zen Kaku Gothic New", "Hiragino Sans", "Segoe UI", sans-serif',
            google: ['Shippori+Mincho:wght@500;600;700', 'Zen+Kaku+Gothic+New:wght@400;500;700'],
        },
        look: {
            align: 'left', headingCase: 'none', headingStyle: 'normal', headingWeight: 600, headingTracking: '0.04em',
            divider: 'hairline', texture: 'washi', radius: 0, leaders: false, price: 'plain',
            productLayout: 'menu', categoryLayout: 'index', categoryNumbers: 'arabic', productNumbers: true,
            hero: 'masthead', cardBorder: 'hairline', offsetShadow: false, width: 'wide', ticker: 'static',
        },
    },

    // ── Template aggiunti a novembre 2026 ────────────────────────────────────
    // Ognuno parte da un riferimento stampato reale (descritto nel commento): niente
    // sfumature, vetri o bagliori, solo carta, inchiostro e la tipografia del genere.

    {
        // Riferimento: la carta dei vini delle osterie veronesi e piemontesi stampata in tipografia
        // (carta vergata, maiuscoletto, numeri romani per le sezioni, due colonne come un listino).
        key: 'enoteca',
        label: 'Osteria · Enoteca',
        description: 'Carta vergata, maiuscoletto da caratteri mobili, sezioni in numeri romani e due colonne come un listino dei vini.',
        venues: ['enoteca', 'trattoria', 'ristorante'],
        palette: {
            bg: '#efe7d6', card: '#f6f0e3', text: '#2a1b17', muted: '#5e4b42',
            accent: '#6d1a2a', accentText: '#f6f0e3', secondary: '#2f3a26', secondaryText: '#efe7d6',
            heroBg: '#2a1b17', heroOverlay: 0.4,
        },
        fonts: {
            display: '"IM Fell English SC", Georgia, serif',
            body: '"Crimson Pro", Georgia, serif',
            google: ['IM+Fell+English+SC', 'Crimson+Pro:ital,wght@0,400;0,500;0,600;1,400'],
        },
        look: {
            align: 'center', headingCase: 'none', headingStyle: 'normal', headingWeight: 400, headingTracking: '0.03em',
            divider: 'double', texture: 'laid', radius: 0, leaders: false, price: 'plain',
            productLayout: 'twocol', categoryLayout: 'index', categoryNumbers: 'roman', productNumbers: false,
            hero: 'masthead', cardBorder: 'hairline', offsetShadow: false, width: 'wide', ticker: 'static',
            sectionHeader: 'ruled', buttonStyle: 'outline', descStyle: 'italic',
        },
    },
    {
        // Riferimento: insegne e banconi delle gelaterie e pasticcerie storiche (anni '50-'60):
        // tenda a righe con il bordo smerlato, carta da vassoio color panna, pistacchio e lampone smorzati.
        key: 'gelateria',
        label: 'Gelateria · Pasticceria',
        description: 'Tenda a righe smerlata, panna, pistacchio e lampone smorzati, foto ad arco come le vetrine. Gusti in griglia.',
        venues: ['gelateria', 'caffe'],
        palette: {
            bg: '#f7f0e6', card: '#fffaf3', text: '#3a2626', muted: '#6e5752',
            accent: '#b5455b', accentText: '#fffaf3', secondary: '#a9c3a0', secondaryText: '#233022',
            heroBg: '#3a2626', heroOverlay: 0.25,
        },
        fonts: {
            display: '"Young Serif", Georgia, serif',
            body: '"Red Hat Text", "Segoe UI", sans-serif',
            google: ['Young+Serif', 'Red+Hat+Text:wght@400;500;600;700'],
        },
        look: {
            align: 'center', headingCase: 'none', headingStyle: 'normal', headingWeight: 400, headingTracking: '0',
            divider: 'awning', texture: 'none', radius: 14, leaders: false, price: 'accent',
            productLayout: 'grid', categoryLayout: 'index', categoryNumbers: 'none', productNumbers: false,
            hero: 'masthead', cardBorder: 'hairline', offsetShadow: false, width: 'wide', ticker: 'static',
            imageShape: 'arch', pricePosition: 'below', categoryNav: 'pill',
        },
    },
    {
        // Riferimento: le brasserie parigine Belle Époque (Bouillon Julien, Brasserie Lipp, Chartier):
        // cornice Art Nouveau a colpo di frusta, Didone maiuscolo spaziato, rosso e verde bottiglia.
        key: 'brasserie',
        label: 'Brasserie',
        description: 'Cornice Art Nouveau, Didone maiuscolo spaziato, puntini fino al prezzo. Rosso brasserie e verde bottiglia.',
        venues: ['ristorante', 'bar', 'fine'],
        palette: {
            bg: '#f2e9d6', card: '#f8f2e4', text: '#1c2620', muted: '#55594e',
            accent: '#8e1b1b', accentText: '#f8f2e4', secondary: '#1e3a2f', secondaryText: '#f2e9d6',
            heroBg: '#1c2620', heroOverlay: 0.45,
        },
        fonts: {
            display: '"Gilda Display", Didot, "Bodoni 72", Georgia, serif',
            body: '"Libre Caslon Text", Georgia, serif',
            google: ['Gilda+Display', 'Libre+Caslon+Text:ital,wght@0,400;0,700;1,400'],
        },
        look: {
            align: 'center', headingCase: 'uppercase', headingStyle: 'normal', headingWeight: 400, headingTracking: '0.12em',
            divider: 'nouveau', texture: 'paper', radius: 0, leaders: true, price: 'plain',
            productLayout: 'menu', categoryLayout: 'index', categoryNumbers: 'none', productNumbers: false,
            hero: 'masthead', cardBorder: 'hairline', offsetShadow: false, width: 'narrow', ticker: 'static',
            headerStyle: 'framed', sectionHeader: 'ruled', buttonStyle: 'outline', descStyle: 'italic',
        },
    },
    {
        // Riferimento: macellerie e steakhouse (le lavagne di Hawksmoor, le etichette dei tagli del banco):
        // fondo carbone come carta da macelleria scura, slab robusto maiuscolo, etichette color carta, prezzi a macchina.
        key: 'braceria',
        label: 'Braceria · Steakhouse',
        description: 'Fondo carbone, slab robusto maiuscolo, tagli numerati su etichette di carta da macelleria e prezzi a macchina.',
        venues: ['braceria', 'ristorante', 'pub'],
        palette: {
            bg: '#1a1613', card: '#231e1a', text: '#efe5d4', muted: '#b7a891',
            accent: '#d4583c', accentText: '#1a1613', secondary: '#e6d6bc', secondaryText: '#1f1915',
            heroBg: '#1a1613', heroOverlay: 0.55,
        },
        fonts: {
            display: 'Rokkitt, Rockwell, "Roboto Slab", serif',
            body: '"Source Serif 4", Georgia, serif',
            price: '"Courier Prime", "Courier New", monospace',
            google: ['Rokkitt:wght@600;700;800', 'Source+Serif+4:opsz,wght@8..60,400;8..60,600', 'Courier+Prime:wght@400;700'],
        },
        look: {
            align: 'left', headingCase: 'uppercase', headingStyle: 'normal', headingWeight: 800, headingTracking: '0.02em',
            divider: 'thick', texture: 'butcher', radius: 0, leaders: true, price: 'plain',
            productLayout: 'menu', categoryLayout: 'index', categoryNumbers: 'arabic', productNumbers: false,
            hero: 'masthead', cardBorder: 'hairline', offsetShadow: false, width: 'wide', ticker: 'static',
            headerStyle: 'banner', sectionHeader: 'label', categoryNav: 'block',
        },
    },
    {
        // Riferimento: i menu dei locali vegetali nordeuropei e di Ottolenghi stampati su carta riciclata:
        // ingredienti in evidenza in maiuscoletto spaziato, serif editoriale, tanta aria, verde salvia e curcuma.
        key: 'vegetale',
        label: 'Vegetale · Healthy',
        description: 'Carta riciclata salvia, titoli puliti, gli ingredienti in evidenza sotto ogni piatto, foto tonde e tanta aria.',
        venues: ['vegano', 'caffe', 'ristorante'],
        palette: {
            bg: '#eceee3', card: '#f6f7f0', text: '#1f2b1c', muted: '#525d49',
            accent: '#4c6a35', accentText: '#f6f7f0', secondary: '#d6a543', secondaryText: '#1f2b1c',
            heroBg: '#1f2b1c', heroOverlay: 0.3,
        },
        fonts: {
            display: 'Raleway, "Segoe UI", sans-serif',
            body: 'Lato, "Segoe UI", sans-serif',
            google: ['Raleway:wght@500;600;700', 'Lato:ital,wght@0,400;0,700;1,400'],
        },
        look: {
            align: 'left', headingCase: 'none', headingStyle: 'normal', headingWeight: 500, headingTracking: '-0.01em',
            divider: 'hairline', texture: 'flecks', radius: 2, leaders: false, price: 'plain',
            productLayout: 'menu', categoryLayout: 'index', categoryNumbers: 'none', productNumbers: false,
            hero: 'masthead', cardBorder: 'hairline', offsetShadow: false, width: 'wide', ticker: 'static',
            density: 'airy', categoryNav: 'pill', imageShape: 'round', buttonStyle: 'outline', descStyle: 'ingredients',
        },
    },
    {
        // Riferimento: le maioliche di Vietri e le trattorie di pesce liguri (Camogli, Boccadasse):
        // fascia di piastrelle blu cobalto, muro a calce, lettere lapidarie, il giallo limone solo come tocco.
        key: 'mediterraneo',
        label: 'Mediterraneo · Pesce',
        description: 'Muro a calce e fascia di maioliche blu cobalto, lettere lapidarie, un tocco di giallo limone. Pesce e cucina di mare.',
        venues: ['pesce', 'ristorante', 'trattoria'],
        palette: {
            bg: '#f6f4ee', card: '#ffffff', text: '#14284a', muted: '#4b5872',
            accent: '#1d4f9e', accentText: '#ffffff', secondary: '#e3ad2f', secondaryText: '#14284a',
            heroBg: '#14284a', heroOverlay: 0.35,
        },
        fonts: {
            display: 'Marcellus, "Trajan Pro", Georgia, serif',
            body: 'Karla, "Segoe UI", sans-serif',
            google: ['Marcellus', 'Karla:ital,wght@0,400;0,500;0,700;1,400'],
        },
        look: {
            align: 'center', headingCase: 'uppercase', headingStyle: 'normal', headingWeight: 400, headingTracking: '0.08em',
            divider: 'tile', texture: 'none', radius: 0, leaders: false, price: 'accent',
            productLayout: 'menu', categoryLayout: 'index', categoryNumbers: 'none', productNumbers: false,
            hero: 'masthead', cardBorder: 'hairline', offsetShadow: false, width: 'narrow', ticker: 'static',
            sectionHeader: 'ruled',
        },
    },
    {
        // Riferimento: i diner americani anni '50 (Mel's Drive-In, le tovagliette di carta dei luncheonette):
        // logotipo in corsivo da insegna al neon spenta, maiuscolo condensato, pavimento a scacchi, rosso e verde acqua.
        key: 'diner',
        label: 'Diner anni \'50',
        description: 'Nome in corsivo da insegna, maiuscolo condensato, fasce rosse e pavimento a scacchi. Burger, hot dog, milkshake.',
        venues: ['street', 'pub', 'bar'],
        palette: {
            bg: '#fbf5ea', card: '#ffffff', text: '#171717', muted: '#4a4743',
            accent: '#c41e2c', accentText: '#ffffff', secondary: '#1d6f6b', secondaryText: '#ffffff',
            heroBg: '#171717', heroOverlay: 0.45,
        },
        fonts: {
            display: 'Antonio, "Arial Narrow", sans-serif',
            body: '"Libre Franklin", "Segoe UI", sans-serif',
            accent: 'Yellowtail, "Brush Script MT", cursive',
            google: ['Antonio:wght@600;700', 'Libre+Franklin:wght@400;500;700', 'Yellowtail'],
        },
        look: {
            align: 'left', headingCase: 'uppercase', headingStyle: 'normal', headingWeight: 700, headingTracking: '0.02em',
            divider: 'diner', texture: 'none', radius: 10, leaders: true, price: 'accent',
            productLayout: 'menu', categoryLayout: 'index', categoryNumbers: 'none', productNumbers: false,
            hero: 'masthead', cardBorder: 'heavy', offsetShadow: false, width: 'wide', ticker: 'marquee',
            headerStyle: 'script', sectionHeader: 'band', categoryNav: 'pill',
        },
    },
    {
        // Riferimento: le izakaya di Tokyo, con le strisce del menu scritte a mano appese al muro (o-shinagaki),
        // il noren all'ingresso, il timbro hanko vermiglio e i punti sashiko sul cotone indaco.
        key: 'izakaya',
        label: 'Izakaya · Ramen',
        description: 'Indaco con punti sashiko, noren in testata, sezioni col timbro vermiglio e piatti piccoli in due colonne.',
        venues: ['etnico', 'street'],
        palette: {
            bg: '#1b2231', card: '#222b3c', text: '#f1e8d6', muted: '#b6b0a1',
            accent: '#e2482f', accentText: '#fff7ea', secondary: '#efe5d0', secondaryText: '#1b2231',
            heroBg: '#1b2231', heroOverlay: 0.55,
        },
        fonts: {
            display: '"Dela Gothic One", "Hiragino Sans", sans-serif',
            body: '"Zen Maru Gothic", "Hiragino Maru Gothic ProN", sans-serif',
            google: ['Dela+Gothic+One', 'Zen+Maru+Gothic:wght@400;500;700'],
        },
        look: {
            align: 'left', headingCase: 'none', headingStyle: 'normal', headingWeight: 400, headingTracking: '0.02em',
            divider: 'brush', texture: 'sashiko', radius: 0, leaders: false, price: 'plain',
            productLayout: 'twocol', categoryLayout: 'index', categoryNumbers: 'none', productNumbers: false,
            hero: 'masthead', cardBorder: 'hairline', offsetShadow: false, width: 'wide', ticker: 'static',
            headerStyle: 'noren', sectionHeader: 'seal', categoryNav: 'block', density: 'compact',
        },
    },
    {
        // Riferimento: il menu del giorno degli agriturismi toscani e delle Langhe, scritto a mano su carta
        // da pacchi, con il nome del podere su un cartoncino fermato con il nastro adesivo.
        key: 'agriturismo',
        label: 'Agriturismo · Cucina di casa',
        description: 'Carta da pacchi, piatti scritti a mano, nome del podere su un cartoncino col nastro adesivo e cuciture tra le sezioni.',
        venues: ['trattoria', 'ristorante'],
        palette: {
            bg: '#d9c4a1', card: '#e8d9bd', text: '#2a1f15', muted: '#4b3c2a',
            accent: '#8b2c1c', accentText: '#f3e8d4', secondary: '#3e5232', secondaryText: '#efe4cd',
            heroBg: '#2a1f15', heroOverlay: 0.4,
        },
        fonts: {
            display: 'Vollkorn, Georgia, serif',
            body: 'Kalam, "Segoe Print", cursive',
            google: ['Vollkorn:ital,wght@0,600;0,700;0,800;1,600', 'Kalam:wght@400;700'],
        },
        look: {
            align: 'left', headingCase: 'none', headingStyle: 'normal', headingWeight: 700, headingTracking: '0',
            divider: 'stitch', texture: 'kraft', radius: 2, leaders: true, price: 'plain',
            productLayout: 'menu', categoryLayout: 'index', categoryNumbers: 'none', productNumbers: false,
            hero: 'masthead', cardBorder: 'hairline', offsetShadow: false, width: 'narrow', ticker: 'static',
            headerStyle: 'tape',
        },
    },
    {
        // Riferimento: le lokanta di Istanbul e le insegne delle rosticcerie libanesi: fregio geometrico a
        // stelle a otto punte (girih), archi a sesto acuto sulle sezioni, Kufi geometrico, sommacco e turchese Iznik.
        key: 'levante',
        label: 'Levante · Kebab',
        description: 'Fregio a stelle geometriche, archi a sesto acuto sulle sezioni, Kufi geometrico, sommacco e turchese Iznik. Piatti numerati.',
        venues: ['etnico', 'street'],
        palette: {
            bg: '#f3eadb', card: '#fbf5ea', text: '#1d2629', muted: '#585750',
            accent: '#a83f27', accentText: '#fff8ee', secondary: '#17595f', secondaryText: '#fff8ee',
            heroBg: '#1d2629', heroOverlay: 0.45,
        },
        fonts: {
            display: '"Reem Kufi", "Segoe UI", sans-serif',
            body: 'Cairo, "Segoe UI", sans-serif',
            google: ['Reem+Kufi:wght@500;600;700', 'Cairo:wght@400;500;600;700'],
        },
        look: {
            align: 'center', headingCase: 'uppercase', headingStyle: 'normal', headingWeight: 600, headingTracking: '0.06em',
            divider: 'girih', texture: 'none', radius: 0, leaders: false, price: 'accent',
            productLayout: 'cards', categoryLayout: 'index', categoryNumbers: 'arabic', productNumbers: true,
            hero: 'masthead', cardBorder: 'hairline', offsetShadow: false, width: 'wide', ticker: 'static',
            sectionHeader: 'arch', categoryNav: 'block', imageShape: 'arch',
        },
    },
    {
        // Riferimento: i sacchetti di carta dei forni (Antico Forno Roscioli, le boulangerie di quartiere):
        // timbri a inchiostro blu su carta infarinata, maiuscoletto da insegna, prezzi sotto il pane.
        key: 'forno',
        label: 'Panificio · Forno',
        description: 'Carta infarinata e timbri a inchiostro blu, maiuscoletto da bottega, pani e dolci in griglia col prezzo sotto.',
        venues: ['forno', 'caffe', 'gelateria'],
        palette: {
            bg: '#eee5d3', card: '#f7f1e5', text: '#2a2420', muted: '#5d544b',
            accent: '#2c4a87', accentText: '#f7f1e5', secondary: '#b97a35', secondaryText: '#2a2420',
            heroBg: '#2a2420', heroOverlay: 0.35,
        },
        fonts: {
            display: '"Alegreya SC", Georgia, serif',
            body: 'Alegreya, Georgia, serif',
            google: ['Alegreya+SC:wght@500;700;800', 'Alegreya:ital,wght@0,400;0,500;0,700;1,400'],
        },
        look: {
            align: 'center', headingCase: 'none', headingStyle: 'normal', headingWeight: 700, headingTracking: '0.04em',
            divider: 'dashed', texture: 'flour', radius: 0, leaders: false, price: 'plain',
            productLayout: 'grid', categoryLayout: 'index', categoryNumbers: 'none', productNumbers: false,
            hero: 'masthead', cardBorder: 'hairline', offsetShadow: false, width: 'wide', ticker: 'static',
            headerStyle: 'stamp', sectionHeader: 'stamp', pricePosition: 'below', buttonStyle: 'outline', descStyle: 'italic',
        },
    },
];

export const MENU_TEMPLATES: MenuTemplateDef[] = SPECS.map(s => ({ ...s, look: { ...EXT_DEFAULTS, ...s.look } }));

export const TEMPLATE_BY_KEY: Record<MenuTemplateKey, MenuTemplateDef> =
    Object.fromEntries(MENU_TEMPLATES.map(t => [t.key, t])) as Record<MenuTemplateKey, MenuTemplateDef>;

/** Alias di chiavi storiche salvate a DB. */
const LEGACY_ALIASES: Record<string, MenuTemplateKey> = {
    // 'strafame' era il look del template di default fino a ottobre 2026.
    strafame: 'default',
};

// ─── Ritocchi del ristoratore ─────────────────────────────────────────────────

/**
 * Ritocchi salvati dopo la chiave del template in `landingTemplate` ("chiave|pl=grid;r=4").
 * Assente = come da template.
 */
export interface LookOverrides {
    /** Abbinamento di font: quello di un altro template. */
    fp?: MenuTemplateKey;
    pl?: ProductLayout;
    im?: ImageShape;
    de?: Density;
    dv?: DividerStyle;
    tx?: TextureStyle;
    /** Raggio angoli in px. */
    r?: number;
    bt?: ButtonStyle;
    pp?: PricePosition;
    sh?: SectionHeaderStyle;
    cn?: CategoryNavStyle;
    hd?: HeaderStyle;
}

export const PRODUCT_LAYOUTS: { key: ProductLayout; label: string }[] = [
    { key: 'menu',     label: 'Elenco (menu stampato)' },
    { key: 'twocol',   label: 'Elenco su due colonne (da tablet)' },
    { key: 'cards',    label: 'Schede con foto a lato' },
    { key: 'grid',     label: 'Griglia con foto sopra' },
    { key: 'centered', label: 'Centrato, molto spazio' },
];
export const IMAGE_SHAPES: { key: ImageShape; label: string }[] = [
    { key: 'square', label: 'Rettangolare' },
    { key: 'round',  label: 'Tonda' },
    { key: 'arch',   label: 'Ad arco' },
];
export const DENSITIES: { key: Density; label: string }[] = [
    { key: 'compact', label: 'Compatta' },
    { key: 'normal',  label: 'Normale' },
    { key: 'airy',    label: 'Ariosa' },
];
export const DIVIDERS: { key: DividerStyle; label: string }[] = [
    { key: 'hairline', label: 'Filetto sottile' },
    { key: 'double',   label: 'Doppio filetto' },
    { key: 'thick',    label: 'Barra spessa' },
    { key: 'dashed',   label: 'Tratteggio' },
    { key: 'stitch',   label: 'Cucitura' },
    { key: 'ornament', label: 'Ornamento centrale' },
    { key: 'nouveau',  label: 'Fregio Art Nouveau' },
    { key: 'checker',  label: 'Quadretti tovaglia' },
    { key: 'diner',    label: 'Scacchi bianco e nero' },
    { key: 'tile',     label: 'Fascia di maioliche' },
    { key: 'girih',    label: 'Fregio geometrico' },
    { key: 'brush',    label: 'Pennellata' },
    { key: 'awning',   label: 'Tenda a righe' },
    { key: 'none',     label: 'Nessuno' },
];
export const TEXTURES: { key: TextureStyle; label: string }[] = [
    { key: 'none',    label: 'Nessuna (tinta unita)' },
    { key: 'paper',   label: 'Carta avorio' },
    { key: 'laid',    label: 'Carta vergata' },
    { key: 'kraft',   label: 'Carta da pacchi' },
    { key: 'flour',   label: 'Carta infarinata' },
    { key: 'flecks',  label: 'Carta riciclata' },
    { key: 'washi',   label: 'Washi' },
    { key: 'sashiko', label: 'Punti sashiko (fondi scuri)' },
    { key: 'chalk',   label: 'Lavagna (fondi scuri)' },
    { key: 'wood',    label: 'Legno (fondi scuri)' },
    { key: 'butcher', label: 'Carta da macelleria (fondi scuri)' },
];
export const BUTTON_STYLES: { key: ButtonStyle; label: string }[] = [
    { key: 'solid',     label: 'Pieni' },
    { key: 'outline',   label: 'Solo bordo' },
    { key: 'underline', label: 'Testo sottolineato' },
];
export const PRICE_POSITIONS: { key: PricePosition; label: string }[] = [
    { key: 'right',  label: 'A destra, in colonna' },
    { key: 'inline', label: 'Dopo il nome' },
    { key: 'below',  label: 'Sotto la descrizione' },
];
export const SECTION_HEADERS: { key: SectionHeaderStyle; label: string }[] = [
    { key: 'plain', label: 'Solo titolo' },
    { key: 'ruled', label: 'Tra due filetti' },
    { key: 'band',  label: 'Fascia colorata' },
    { key: 'label', label: 'Etichetta di carta' },
    { key: 'stamp', label: 'Timbro' },
    { key: 'seal',  label: 'Sigillo quadrato' },
    { key: 'arch',  label: 'Sotto un arco' },
];
export const CATEGORY_NAVS: { key: CategoryNavStyle; label: string }[] = [
    { key: 'underline', label: 'Sottolineata' },
    { key: 'pill',      label: 'Pillole' },
    { key: 'block',     label: 'Riquadri pieni' },
];
export const HEADER_STYLES: { key: HeaderStyle; label: string }[] = [
    { key: 'plain',  label: 'Solo nome' },
    { key: 'framed', label: 'Cornice Art Nouveau' },
    { key: 'banner', label: 'Fascia di carta' },
    { key: 'stamp',  label: 'Timbro' },
    { key: 'script', label: 'Corsivo da insegna' },
    { key: 'noren',  label: 'Tenda noren' },
    { key: 'tape',   label: 'Cartoncino con nastro' },
    { key: 'awning', label: 'Tenda a righe' },
];

const OV_ENUMS: Record<Exclude<keyof LookOverrides, 'r'>, readonly string[]> = {
    fp: MENU_TEMPLATES.map(t => t.key),
    pl: PRODUCT_LAYOUTS.map(x => x.key),
    im: IMAGE_SHAPES.map(x => x.key),
    de: DENSITIES.map(x => x.key),
    dv: DIVIDERS.map(x => x.key),
    tx: TEXTURES.map(x => x.key),
    bt: BUTTON_STYLES.map(x => x.key),
    pp: PRICE_POSITIONS.map(x => x.key),
    sh: SECTION_HEADERS.map(x => x.key),
    cn: CATEGORY_NAVS.map(x => x.key),
    hd: HEADER_STYLES.map(x => x.key),
};
const OV_ORDER: (keyof LookOverrides)[] = ['fp', 'pl', 'im', 'de', 'dv', 'tx', 'r', 'bt', 'pp', 'sh', 'cn', 'hd'];
export const RADIUS_STEPS = [0, 2, 6, 12, 20];

/** Separa chiave del template e ritocchi. Valori non validi vengono ignorati. */
export function parseTemplateValue(raw: string | null | undefined): { key: MenuTemplateKey; overrides: LookOverrides } {
    const s = (raw || '').trim();
    const bar = s.indexOf('|');
    const head = bar >= 0 ? s.slice(0, bar) : s;
    const overrides: LookOverrides = {};
    if (bar >= 0) {
        for (const part of s.slice(bar + 1).split(';')) {
            const eq = part.indexOf('=');
            if (eq <= 0) continue;
            const k = part.slice(0, eq).trim() as keyof LookOverrides;
            const v = part.slice(eq + 1).trim();
            if (k === 'r') {
                const n = Number(v);
                if (Number.isFinite(n) && n >= 0 && n <= 40) overrides.r = Math.round(n);
            } else if (k in OV_ENUMS && OV_ENUMS[k as Exclude<keyof LookOverrides, 'r'>].includes(v)) {
                (overrides as any)[k] = v;
            }
        }
    }
    return { key: resolveBareKey(head), overrides };
}

/** Ricompone il valore da salvare in `landingTemplate`. Senza ritocchi = la sola chiave (come sempre). */
export function serializeTemplateValue(key: MenuTemplateKey, overrides: LookOverrides): string {
    const parts = OV_ORDER
        .filter(k => overrides[k] !== undefined && overrides[k] !== null && (overrides[k] as any) !== '')
        .map(k => `${k}=${overrides[k]}`);
    return parts.length ? `${key}|${parts.join(';')}` : key;
}

/** Look del template con i ritocchi applicati. */
export function applyLookOverrides(look: TemplateLook, ov: LookOverrides): TemplateLook {
    return {
        ...look,
        ...(ov.pl ? { productLayout: ov.pl } : {}),
        ...(ov.im ? { imageShape: ov.im } : {}),
        ...(ov.de ? { density: ov.de } : {}),
        ...(ov.dv ? { divider: ov.dv } : {}),
        ...(ov.tx ? { texture: ov.tx } : {}),
        ...(typeof ov.r === 'number' ? { radius: ov.r } : {}),
        ...(ov.bt ? { buttonStyle: ov.bt } : {}),
        ...(ov.pp ? { pricePosition: ov.pp } : {}),
        ...(ov.sh ? { sectionHeader: ov.sh } : {}),
        ...(ov.cn ? { categoryNav: ov.cn } : {}),
        ...(ov.hd ? { headerStyle: ov.hd } : {}),
    };
}

function resolveBareKey(k: string): MenuTemplateKey {
    if (!k) return 'default';
    if (k in TEMPLATE_BY_KEY) return k as MenuTemplateKey;
    return LEGACY_ALIASES[k] || 'default';
}

/** Normalizza il valore salvato in `landingTemplate` (anche vecchio/sconosciuto o con ritocchi). */
export function resolveTemplateKey(raw: string | null | undefined): MenuTemplateKey {
    return parseTemplateValue(raw).key;
}

export function getTemplateDef(raw: string | null | undefined): MenuTemplateDef {
    return TEMPLATE_BY_KEY[resolveTemplateKey(raw)];
}

/** URL Google Fonts per uno o più template (deduplicato). */
export function buildTemplateFontsHref(defs: MenuTemplateDef[]): string | null {
    const families = Array.from(new Set(defs.flatMap(d => d.fonts.google)));
    if (families.length === 0) return null;
    return `https://fonts.googleapis.com/css2?${families.map(f => `family=${f}`).join('&')}&display=swap`;
}

/** Nome dell'abbinamento di font di un template (selettore "Abbinamento di font"). */
export function fontPairLabel(def: MenuTemplateDef): string {
    const first = (f: string) => f.split(',')[0].replace(/"/g, '').trim();
    const d = first(def.fonts.display);
    const b = first(def.fonts.body);
    return d === b ? `${d} (${def.label})` : `${d} + ${b} (${def.label})`;
}

const ROMAN: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];

export function toRoman(n: number): string {
    let out = '';
    let v = n;
    for (const [val, sym] of ROMAN) {
        while (v >= val) { out += sym; v -= val; }
    }
    return out;
}

export function formatIndex(n: number, mode: TemplateLook['categoryNumbers']): string {
    if (mode === 'roman') return toRoman(n);
    if (mode === 'arabic') return String(n).padStart(2, '0');
    return '';
}

const KANJI = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
/** Numerale giapponese (1-99) per il sigillo delle sezioni. */
export function toKanji(n: number): string {
    if (n <= 10) return KANJI[n] || String(n);
    const t = Math.floor(n / 10);
    const u = n % 10;
    return `${t > 1 ? KANJI[t] : ''}十${u ? KANJI[u] : ''}`;
}
