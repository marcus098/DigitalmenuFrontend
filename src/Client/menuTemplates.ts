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
 * Questo file è l'unica fonte di verità anche per il menu in PDF (web) e per gli stili PDF
 * dell'app mobile: `npm run export:pdf-tokens` rigenera
 * `src/Components/Dashboard/menuPdf/pdfTokens.generated.json` da qui.
 *
 * Ritocchi del ristoratore (Dashboard → Personalizza aspetto → Layout): sono salvati
 * nella stessa stringa, dopo la chiave del template, es.
 *   "enoteca|pl=grid;im=round;r=4"
 * Il formato è compatto (max ~120 caratteri) e ignorato se non valido: i valori storici
 * ("default", "trattoria"…) restano identici e si vedono esattamente come prima.
 *
 * Regola per i font: niente scelte "di default" (Inter, Poppins, Playfair, Montserrat, DM…).
 * Ogni template usa caratteri che appartengono davvero al suo genere di stampa.
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
    | 'forno'
    // dicembre 2026
    | 'tipografia'
    | 'riso'
    | 'dimsum'
    | 'napoletana'
    | 'vineria'
    | 'pasticceria'
    | 'chiosco'
    | 'bageri'
    | 'taqueria'
    | 'bacheca'
    | 'birreria';

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
    | 'tile' | 'girih' | 'nouveau' | 'brush' | 'awning' | 'diner' | 'stitch' | 'none'
    // dicembre 2026
    | 'fleuron' | 'short' | 'stripes' | 'papel' | 'rauten' | 'lace';
export type TextureStyle =
    | 'none' | 'paper' | 'chalk' | 'wood' | 'washi'
    | 'laid' | 'butcher' | 'flecks' | 'sashiko' | 'kraft' | 'flour'
    // dicembre 2026
    | 'grain' | 'felt';

/** Impaginazione dei piatti in una categoria. */
export type ProductLayout = 'menu' | 'centered' | 'cards' | 'twocol' | 'grid';
/** Forma delle foto dei piatti. */
export type ImageShape = 'square' | 'round' | 'arch';
/** Spaziatura tra i piatti. */
export type Density = 'compact' | 'normal' | 'airy';
/** Dove sta il prezzo rispetto al nome. */
export type PricePosition = 'right' | 'below' | 'inline';
/** Titolo delle sezioni (categoria nella pagina piatti, titoli del sito vetrina). */
export type SectionHeaderStyle = 'plain' | 'ruled' | 'band' | 'label' | 'stamp' | 'seal' | 'arch' | 'sticker' | 'underscore';
/** Barra delle categorie nella pagina piatti. */
export type CategoryNavStyle = 'underline' | 'pill' | 'block';
/** Testata con il nome del locale (menu + sito vetrina "a testata"). */
export type HeaderStyle = 'plain' | 'framed' | 'banner' | 'stamp' | 'script' | 'noren' | 'tape' | 'awning' | 'cartouche' | 'sticker';
/** Pulsanti del sito vetrina. */
export type ButtonStyle = 'solid' | 'outline' | 'underline';
/** Descrizione dei piatti: 'auto' = corsivo se i titoli sono in corsivo (comportamento storico). */
export type DescriptionStyle = 'auto' | 'italic' | 'ingredients';
/**
 * Resa dell'inchiostro su titoli e prezzi (solo text-shadow, niente filtri):
 * 'letterpress' = leggera sbavatura dei caratteri mobili, 'misregister' = secondo colore
 * fuori registro come nella risografia, 'typed' = battuta della macchina da scrivere,
 * 'chalk' = alone del gesso sulla lavagna.
 */
export type InkStyle = 'none' | 'letterpress' | 'misregister' | 'typed' | 'chalk';
/** Numeri dei piatti: semplici o in una casella (foglio d'ordine del dim sum). */
export type NumberStyle = 'plain' | 'boxed';

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
    /** Font per i prezzi (es. macchina da scrivere nella Vineria). Default = body. */
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
    headingCase: 'none' | 'uppercase' | 'smallcaps' | 'lowercase';
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

/** Scelte aggiunte da novembre 2026: facoltative nella definizione, default = aspetto storico. */
interface ExtLook {
    imageShape: ImageShape;
    density: Density;
    pricePosition: PricePosition;
    sectionHeader: SectionHeaderStyle;
    categoryNav: CategoryNavStyle;
    headerStyle: HeaderStyle;
    buttonStyle: ButtonStyle;
    descStyle: DescriptionStyle;
    ink: InkStyle;
    numberStyle: NumberStyle;
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
    ink: 'none',
    numberStyle: 'plain',
};

export interface MenuTemplateDef {
    key: MenuTemplateKey;
    label: string;
    /** Descrizione breve per il ristoratore: per quale locale è pensato. */
    description: string;
    /** Il riferimento reale da cui nasce il template (una riga, mostrata nella libreria). */
    inspiration: string;
    /** Aggiunto di recente: badge "Nuovo" nella libreria. */
    isNew?: boolean;
    /**
     * Due template il cui abbinamento di font sta bene anche su questo: proposti come
     * alternative nel dialog del PDF e per primi nel selettore "Abbinamento di font".
     */
    pairsWith: MenuTemplateKey[];
    venues: VenueTag[];
    palette: TemplatePalette;
    fonts: TemplateFonts;
    look: TemplateLook;
}

interface TemplateSpec extends Omit<MenuTemplateDef, 'look'> {
    look: BaseLook & Partial<ExtLook>;
}

// ─── Libreria ─────────────────────────────────────────────────────────────────
// Ogni template parte da un riferimento stampato reale (campo `inspiration`): niente
// sfumature, vetri o bagliori, solo carta, inchiostro e la tipografia del genere.
// Contrasto: testo, testo secondario e prezzi rispettano WCAG AA su fondo e schede
// (verificato da scripts/export-pdf-tokens.mjs, che fallisce se un template scende sotto).

const SPECS: TemplateSpec[] = [
    {
        // Rivisto a dicembre 2026: il Lato del testo era il classico font "di default".
        key: 'default',
        label: 'Classico',
        description: 'Carta avorio, Baskerville per i titoli e Spectral per le descrizioni, doppio filetto e prezzi con i puntini.',
        inspiration: 'Il menu del ristorante di città stampato dal tipografo sotto casa.',
        pairsWith: ['enoteca', 'tipografia'],
        venues: ['ristorante', 'trattoria'],
        palette: {
            bg: '#f4eee2', card: '#faf6ee', text: '#1f1a14', muted: '#5b5143',
            accent: '#7a2318', accentText: '#faf6ee', secondary: '#1f1a14', secondaryText: '#f4eee2',
            heroBg: '#1f1a14', heroOverlay: 0.35,
        },
        fonts: {
            display: '"Libre Baskerville", Baskerville, Georgia, serif',
            body: 'Spectral, Georgia, serif',
            google: ['Libre+Baskerville:wght@400;700', 'Spectral:ital,wght@0,400;0,500;0,600;1,400'],
        },
        look: {
            align: 'center', headingCase: 'none', headingStyle: 'normal', headingWeight: 700, headingTracking: '0',
            divider: 'double', texture: 'paper', radius: 2, leaders: true, price: 'plain',
            productLayout: 'menu', categoryLayout: 'index', categoryNumbers: 'roman', productNumbers: false,
            hero: 'masthead', cardBorder: 'hairline', offsetShadow: false, width: 'narrow', ticker: 'static',
        },
    },
    {
        // Rivisto a dicembre 2026: era IBM Plex + prezzi in monospazio, il "minimal" che fanno tutti.
        // Ora è lo Stile Tipografico Internazionale vero: un solo grottesco, nero pieno, rosso svizzero.
        key: 'minimal',
        label: 'Minimal · Stile svizzero',
        description: 'Un solo grottesco in nero pieno, barra rossa, sezioni numerate grandi e tutto a bandiera sinistra. Niente decorazioni.',
        inspiration: 'I manifesti e i listini della scuola di Zurigo e Basilea (Müller-Brockmann, Ruder), anni \'50-\'60.',
        pairsWith: ['bageri', 'caffe'],
        venues: ['caffe', 'bar', 'ristorante'],
        palette: {
            bg: '#f4f3ef', card: '#ffffff', text: '#111111', muted: '#545450',
            accent: '#d0281b', accentText: '#ffffff', secondary: '#111111', secondaryText: '#ffffff',
            heroBg: '#111111', heroOverlay: 0.25,
        },
        fonts: {
            display: '"Schibsted Grotesk", "Helvetica Neue", Arial, sans-serif',
            body: '"Schibsted Grotesk", "Helvetica Neue", Arial, sans-serif',
            google: ['Schibsted+Grotesk:ital,wght@0,400;0,500;0,700;0,800;1,400'],
        },
        look: {
            align: 'left', headingCase: 'none', headingStyle: 'normal', headingWeight: 800, headingTracking: '-0.025em',
            divider: 'thick', texture: 'none', radius: 0, leaders: false, price: 'plain',
            productLayout: 'menu', categoryLayout: 'index', categoryNumbers: 'arabic', productNumbers: false,
            hero: 'masthead', cardBorder: 'hairline', offsetShadow: false, width: 'wide', ticker: 'static',
            categoryNav: 'block',
        },
    },
    {
        // Rivisto a dicembre 2026: era nero + oro + Cinzel, il "lusso" generico. Ora è il cartoncino
        // del menu degustazione: carta di cotone, un solo serif, nomi dei piatti in minuscolo.
        key: 'luxury',
        label: 'Fine dining · Degustazione',
        description: 'Cartoncino di cotone, nomi dei piatti in minuscolo, un filetto corto tra un corso e l\'altro, niente foto. Per menu degustazione.',
        inspiration: 'Il cartoncino del percorso degustazione che si porta a casa, stampato in un solo colore.',
        pairsWith: ['brasserie', 'default'],
        venues: ['fine', 'ristorante', 'cocktail'],
        palette: {
            bg: '#f3f0e8', card: '#f9f7f1', text: '#1a1916', muted: '#57534a',
            accent: '#6b2b23', accentText: '#f9f7f1', secondary: '#1a1916', secondaryText: '#f3f0e8',
            heroBg: '#1a1916', heroOverlay: 0.45,
        },
        fonts: {
            display: 'Gloock, "Bodoni 72", Georgia, serif',
            body: 'Cardo, Georgia, serif',
            google: ['Gloock', 'Cardo:ital,wght@0,400;0,700;1,400'],
        },
        look: {
            align: 'center', headingCase: 'lowercase', headingStyle: 'normal', headingWeight: 400, headingTracking: '0',
            divider: 'short', texture: 'none', radius: 0, leaders: false, price: 'plain',
            productLayout: 'centered', categoryLayout: 'index', categoryNumbers: 'none', productNumbers: false,
            hero: 'masthead', cardBorder: 'none', offsetShadow: false, width: 'narrow', ticker: 'static',
            density: 'airy', descStyle: 'italic', buttonStyle: 'underline',
        },
    },
    {
        // Rivisto a dicembre 2026: via Playfair Display. Slab tondo da insegna di paese + Bitter.
        key: 'trattoria',
        label: 'Trattoria',
        description: 'Carta paglia, bordo a quadretti come la tovaglia, titoli in uno slab grasso e tondo, rosso pomodoro. Cucina di casa.',
        inspiration: 'Le trattorie di paese con la tovaglia a quadri e il menu ciclostilato infilato nel portamenu.',
        pairsWith: ['agriturismo', 'pizzeria'],
        venues: ['trattoria', 'pizzeria', 'ristorante'],
        palette: {
            bg: '#f1e6cf', card: '#f8f0de', text: '#2a1f16', muted: '#5e4e3b',
            accent: '#a3241a', accentText: '#fff8ec', secondary: '#2f4a2a', secondaryText: '#f8f0de',
            heroBg: '#2a1f16', heroOverlay: 0.35,
        },
        fonts: {
            display: 'Coustard, Rockwell, Georgia, serif',
            body: 'Bitter, Georgia, serif',
            google: ['Coustard:wght@400;900', 'Bitter:ital,wght@0,400;0,500;0,700;1,400'],
        },
        look: {
            align: 'left', headingCase: 'none', headingStyle: 'normal', headingWeight: 900, headingTracking: '-0.005em',
            divider: 'checker', texture: 'paper', radius: 3, leaders: true, price: 'plain',
            productLayout: 'menu', categoryLayout: 'rows', categoryNumbers: 'none', productNumbers: false,
            hero: 'masthead', cardBorder: 'hairline', offsetShadow: false, width: 'narrow', ticker: 'static',
        },
    },
    {
        // Rivisto a dicembre 2026: Caveat è il "corsivo a mano" che si vede ovunque. Ora gesso a
        // pennello per i titoli, stampatello da lavagna per il testo, tutto a sinistra come scritto di getto.
        key: 'bistrot',
        label: 'Osteria · Lavagna',
        description: 'Lavagna nera, titoli col gessetto grosso, piatti in stampatello e l\'alone del gesso. Il menu del giorno appeso al muro.',
        inspiration: 'La lavagna delle osterie e dei bistrot, riscritta ogni mattina con il gessetto.',
        pairsWith: ['agriturismo', 'vineria'],
        venues: ['bar', 'ristorante', 'trattoria'],
        palette: {
            bg: '#232825', card: '#2a302c', text: '#f0ede4', muted: '#c4c2b7',
            accent: '#f1d27a', accentText: '#232825', secondary: '#f0ede4', secondaryText: '#232825',
            heroBg: '#232825', heroOverlay: 0.55,
        },
        fonts: {
            display: '"Caveat Brush", "Segoe Print", cursive',
            body: '"Gochi Hand", "Segoe Print", cursive',
            google: ['Caveat+Brush', 'Gochi+Hand'],
        },
        look: {
            align: 'left', headingCase: 'none', headingStyle: 'normal', headingWeight: 400, headingTracking: '0.01em',
            divider: 'dashed', texture: 'chalk', radius: 0, leaders: true, price: 'accent',
            productLayout: 'menu', categoryLayout: 'index', categoryNumbers: 'none', productNumbers: false,
            hero: 'masthead', cardBorder: 'hairline', offsetShadow: false, width: 'narrow', ticker: 'static',
            ink: 'chalk',
        },
    },
    {
        // Rivisto a dicembre 2026: via Oswald. Caratteri in legno vittoriani come le insegne dipinte dei pub.
        key: 'pub',
        label: 'Pub',
        description: 'Legno scuro, ottone e i caratteri in legno larghi delle insegne vittoriane. Birre alla spina, burger, fritti e partite.',
        inspiration: 'Le insegne dipinte a mano dei pub inglesi e i manifesti in caratteri di legno dell\'Ottocento.',
        pairsWith: ['birreria', 'braceria'],
        venues: ['pub', 'bar', 'street'],
        palette: {
            bg: '#1c140e', card: '#271b12', text: '#f2e6cc', muted: '#c9b897',
            accent: '#d9a441', accentText: '#1c140e', secondary: '#7a2e1c', secondaryText: '#f2e6cc',
            heroBg: '#1c140e', heroOverlay: 0.5,
        },
        fonts: {
            display: '"Holtwood One SC", Rockwell, Georgia, serif',
            body: '"Barlow Semi Condensed", "Arial Narrow", sans-serif',
            google: ['Holtwood+One+SC', 'Barlow+Semi+Condensed:wght@400;500;600'],
        },
        look: {
            align: 'left', headingCase: 'none', headingStyle: 'normal', headingWeight: 400, headingTracking: '0',
            divider: 'thick', texture: 'wood', radius: 2, leaders: true, price: 'accent',
            productLayout: 'menu', categoryLayout: 'tiles', categoryNumbers: 'none', productNumbers: false,
            hero: 'overlay', cardBorder: 'heavy', offsetShadow: false, width: 'wide', ticker: 'marquee',
        },
    },
    {
        // Rivisto a dicembre 2026: era nero + oro + Bodoni spaziato (il cocktail bar "da template").
        // Ora verde bottiglia, ottone e un display da cartellone di Broadway anni '30.
        key: 'cocktail',
        label: 'Cocktail bar',
        description: 'Verde bottiglia e ottone, titoli da cartellone anni \'30, ingredienti sotto ogni drink. American bar e speakeasy.',
        inspiration: 'Le carte degli american bar degli anni \'30 e i cartelloni dei teatri di Broadway.',
        pairsWith: ['brasserie', 'luxury'],
        venues: ['cocktail', 'bar', 'fine'],
        palette: {
            bg: '#10211c', card: '#162a24', text: '#ece4d2', muted: '#b5ad98',
            accent: '#d2ab62', accentText: '#10211c', secondary: '#7c2c24', secondaryText: '#ece4d2',
            heroBg: '#10211c', heroOverlay: 0.6,
        },
        fonts: {
            display: 'Limelight, "Bodoni 72", Georgia, serif',
            body: '"Josefin Sans", "Futura", sans-serif',
            google: ['Limelight', 'Josefin+Sans:ital,wght@0,400;0,600;1,400'],
        },
        look: {
            align: 'center', headingCase: 'none', headingStyle: 'normal', headingWeight: 400, headingTracking: '0.02em',
            divider: 'double', texture: 'none', radius: 0, leaders: true, price: 'accent',
            productLayout: 'menu', categoryLayout: 'index', categoryNumbers: 'none', productNumbers: false,
            hero: 'masthead', cardBorder: 'hairline', offsetShadow: false, width: 'narrow', ticker: 'static',
            descStyle: 'ingredients',
        },
    },
    {
        // Rivisto a dicembre 2026: era Poppins + Nunito con schede arrotondate (l'aspetto da app).
        // Ora è il listino del bar italiano: grottesco robusto, fascia marrone caffè, puntini fino al prezzo.
        key: 'caffe',
        label: 'Caffè · Bar',
        description: 'Il listino del banco: grottesco robusto, fasce color caffè sulle sezioni, puntini fino al prezzo e foto piccole a lato.',
        inspiration: 'I listini prezzi appesi dietro al banco dei bar italiani, con le piastrelle verdi della parete.',
        pairsWith: ['minimal', 'forno'],
        venues: ['caffe', 'bar'],
        palette: {
            bg: '#f6f1e7', card: '#fffdf8', text: '#2a1d15', muted: '#66564a',
            accent: '#7f3612', accentText: '#fffdf8', secondary: '#2f5e4e', secondaryText: '#ffffff',
            heroBg: '#2a1d15', heroOverlay: 0.3,
        },
        fonts: {
            display: 'Chivo, "Helvetica Neue", Arial, sans-serif',
            body: 'Chivo, "Helvetica Neue", Arial, sans-serif',
            google: ['Chivo:ital,wght@0,400;0,500;0,700;0,800;1,400'],
        },
        look: {
            align: 'left', headingCase: 'none', headingStyle: 'normal', headingWeight: 800, headingTracking: '-0.01em',
            divider: 'hairline', texture: 'none', radius: 3, leaders: true, price: 'plain',
            productLayout: 'menu', categoryLayout: 'tiles', categoryNumbers: 'none', productNumbers: false,
            hero: 'overlay', cardBorder: 'hairline', offsetShadow: false, width: 'wide', ticker: 'static',
            sectionHeader: 'band', categoryNav: 'block',
        },
    },
    {
        // Rivisto a dicembre 2026: via Rubik (testo "da app"), ora Barlow, più vicino ai cartelli del forno.
        key: 'pizzeria',
        label: 'Pizzeria',
        description: 'Caldo e deciso: slab spesso, rosso pomodoro e verde basilico, prezzi in colonna. Si legge bene anche in sala piena.',
        inspiration: 'I cartelli dipinti sopra il forno delle pizzerie di quartiere.',
        pairsWith: ['napoletana', 'trattoria'],
        venues: ['pizzeria', 'trattoria', 'street'],
        palette: {
            bg: '#fff6ea', card: '#fffdf8', text: '#24170f', muted: '#5f4c3a',
            accent: '#b8301a', accentText: '#ffffff', secondary: '#2e6b3b', secondaryText: '#ffffff',
            heroBg: '#24170f', heroOverlay: 0.45,
        },
        fonts: {
            display: '"Alfa Slab One", "Rockwell", serif',
            body: 'Barlow, "Segoe UI", sans-serif',
            google: ['Alfa+Slab+One', 'Barlow:ital,wght@0,400;0,500;0,600;1,400'],
        },
        look: {
            align: 'left', headingCase: 'none', headingStyle: 'normal', headingWeight: 400, headingTracking: '0.005em',
            divider: 'thick', texture: 'none', radius: 4, leaders: true, price: 'accent',
            productLayout: 'menu', categoryLayout: 'rows', categoryNumbers: 'none', productNumbers: false,
            hero: 'overlay', cardBorder: 'hairline', offsetShadow: false, width: 'wide', ticker: 'marquee',
        },
    },
    {
        // Rivisto a dicembre 2026: giallo/nero con ombre piene sfalsate è il "neo-brutalismo" da template.
        // Ora è il furgone pieno di adesivi: nome e sezioni su sticker fustellati e storti.
        key: 'street',
        label: 'Street food · Adesivi',
        description: 'Il nome e le sezioni su adesivi fustellati e un po\' storti, lettere da insegna, prezzi in etichetta. Panini, burger, fritti.',
        inspiration: 'Le fiancate dei food truck e i banconi coperti di adesivi delle friggitorie.',
        pairsWith: ['diner', 'chiosco'],
        venues: ['street', 'pub', 'pizzeria'],
        palette: {
            bg: '#f1efe8', card: '#ffffff', text: '#0b0b0b', muted: '#45453f',
            accent: '#ffcc00', accentText: '#0b0b0b', secondary: '#d42e12', secondaryText: '#ffffff',
            heroBg: '#0b0b0b', heroOverlay: 0.5,
        },
        fonts: {
            display: 'Bungee, Impact, "Arial Narrow", sans-serif',
            body: 'Archivo, "Segoe UI", sans-serif',
            google: ['Bungee', 'Archivo:wght@400;500;700'],
        },
        look: {
            align: 'left', headingCase: 'none', headingStyle: 'normal', headingWeight: 400, headingTracking: '0',
            divider: 'thick', texture: 'none', radius: 12, leaders: false, price: 'badge',
            productLayout: 'cards', categoryLayout: 'tiles', categoryNumbers: 'none', productNumbers: false,
            hero: 'overlay', cardBorder: 'heavy', offsetShadow: false, width: 'wide', ticker: 'marquee',
            headerStyle: 'sticker', sectionHeader: 'sticker', categoryNav: 'pill',
        },
    },
    {
        key: 'sushi',
        label: 'Sushi & Etnico',
        description: 'Carta washi, filetti sottili, piatti numerati e timbro vermiglio. Sushi, ramen, poke, cucine dal mondo.',
        inspiration: 'I menu dei sushi-ya di Tokyo stampati in mincho su carta washi.',
        pairsWith: ['izakaya', 'dimsum'],
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

    {
        key: 'enoteca',
        label: 'Osteria · Enoteca',
        description: 'Carta vergata, maiuscoletto da caratteri mobili, sezioni in numeri romani e due colonne come un listino dei vini.',
        inspiration: 'La carta dei vini delle osterie veronesi e piemontesi stampata in tipografia.',
        pairsWith: ['default', 'vineria'],
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
        key: 'gelateria',
        label: 'Gelateria',
        description: 'Tenda a righe smerlata, panna, pistacchio e lampone smorzati, foto ad arco come le vetrine. Gusti in griglia.',
        inspiration: 'Le insegne e i banconi delle gelaterie storiche degli anni \'50-\'60.',
        pairsWith: ['pasticceria', 'forno'],
        venues: ['gelateria', 'caffe'],
        palette: {
            bg: '#f7f0e6', card: '#fffaf3', text: '#3a2626', muted: '#6e5752',
            accent: '#b03f56', accentText: '#fffaf3', secondary: '#a9c3a0', secondaryText: '#233022',
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
        key: 'brasserie',
        label: 'Brasserie',
        description: 'Cornice Art Nouveau, Didone maiuscolo spaziato, puntini fino al prezzo. Rosso brasserie e verde bottiglia.',
        inspiration: 'Le brasserie parigine Belle Époque: Bouillon Julien, Lipp, Chartier.',
        pairsWith: ['pasticceria', 'default'],
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
        key: 'braceria',
        label: 'Braceria · Steakhouse',
        description: 'Fondo carbone, slab robusto maiuscolo, tagli numerati su etichette di carta da macelleria e prezzi a macchina.',
        inspiration: 'Le lavagne delle macellerie e le etichette dei tagli sul banco frigo.',
        pairsWith: ['pub', 'bacheca'],
        venues: ['braceria', 'ristorante', 'pub'],
        palette: {
            bg: '#1a1613', card: '#231e1a', text: '#efe5d4', muted: '#bcae97',
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
        // Rivisto a dicembre 2026: Raleway + Lato su salvia, con gli ingredienti in maiuscoletto spaziato,
        // era il "healthy" di qualunque generatore. Ora è la bottega naturale degli anni '70.
        key: 'vegetale',
        label: 'Vegetale · Bottega naturale',
        description: 'Serif morbido anni \'70, avena, verde avocado e senape, angoli tondi e gli ingredienti elencati sotto ogni piatto.',
        inspiration: 'I ricettari vegetariani anni \'70 scritti a mano (Moosewood) e le botteghe del biologico.',
        pairsWith: ['chiosco', 'agriturismo'],
        venues: ['vegano', 'caffe', 'ristorante'],
        palette: {
            bg: '#efe6cf', card: '#f7f0de', text: '#2e2a17', muted: '#5a5336',
            accent: '#5b6a17', accentText: '#f7f0de', secondary: '#d08a2c', secondaryText: '#2e2a17',
            heroBg: '#2e2a17', heroOverlay: 0.3,
        },
        fonts: {
            display: 'Corben, "Cooper Black", Georgia, serif',
            body: '"Alegreya Sans", "Segoe UI", sans-serif',
            google: ['Corben:wght@400;700', 'Alegreya+Sans:ital,wght@0,400;0,500;0,700;1,400'],
        },
        look: {
            align: 'left', headingCase: 'none', headingStyle: 'normal', headingWeight: 700, headingTracking: '-0.01em',
            divider: 'dashed', texture: 'flecks', radius: 14, leaders: false, price: 'accent',
            productLayout: 'menu', categoryLayout: 'index', categoryNumbers: 'none', productNumbers: false,
            hero: 'masthead', cardBorder: 'hairline', offsetShadow: false, width: 'wide', ticker: 'static',
            categoryNav: 'pill', imageShape: 'round', buttonStyle: 'solid', descStyle: 'ingredients',
        },
    },
    {
        key: 'mediterraneo',
        label: 'Mediterraneo · Pesce',
        description: 'Muro a calce e fascia di maioliche blu cobalto, lettere lapidarie, un tocco di giallo limone. Pesce e cucina di mare.',
        inspiration: 'Le maioliche di Vietri e le trattorie di pesce liguri (Camogli, Boccadasse).',
        pairsWith: ['napoletana', 'default'],
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
        key: 'diner',
        label: 'Diner anni \'50',
        description: 'Nome in corsivo da insegna, maiuscolo condensato, fasce rosse e pavimento a scacchi. Burger, hot dog, milkshake.',
        inspiration: 'I diner americani anni \'50 e le tovagliette di carta dei luncheonette.',
        pairsWith: ['street', 'bacheca'],
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
        key: 'izakaya',
        label: 'Izakaya · Ramen',
        description: 'Indaco con punti sashiko, noren in testata, sezioni col timbro vermiglio e piatti piccoli in due colonne.',
        inspiration: 'Le izakaya di Tokyo con le strisce del menu scritte a mano appese al muro.',
        pairsWith: ['sushi', 'dimsum'],
        venues: ['etnico', 'street'],
        palette: {
            bg: '#1b2231', card: '#222b3c', text: '#f1e8d6', muted: '#bcb6a7',
            accent: '#f26a4f', accentText: '#1b2231', secondary: '#efe5d0', secondaryText: '#1b2231',
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
        key: 'agriturismo',
        label: 'Agriturismo · Cucina di casa',
        description: 'Carta da pacchi, piatti scritti a mano, nome del podere su un cartoncino col nastro adesivo e cuciture tra le sezioni.',
        inspiration: 'Il menu del giorno degli agriturismi toscani e delle Langhe, scritto a mano su carta da pacchi.',
        pairsWith: ['trattoria', 'bistrot'],
        venues: ['trattoria', 'ristorante'],
        palette: {
            bg: '#d9c4a1', card: '#e8d9bd', text: '#2a1f15', muted: '#46382a',
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
        key: 'levante',
        label: 'Levante · Kebab',
        description: 'Fregio a stelle geometriche, archi a sesto acuto sulle sezioni, Kufi geometrico, sommacco e turchese Iznik. Piatti numerati.',
        inspiration: 'Le lokanta di Istanbul e le insegne delle rosticcerie libanesi.',
        pairsWith: ['taqueria', 'mediterraneo'],
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
        key: 'forno',
        label: 'Panificio · Forno',
        description: 'Carta infarinata e timbri a inchiostro blu, maiuscoletto da bottega, pani e dolci in griglia col prezzo sotto.',
        inspiration: 'I sacchetti di carta dei forni di quartiere, timbrati a mano.',
        pairsWith: ['bageri', 'default'],
        venues: ['forno', 'caffe', 'gelateria'],
        palette: {
            bg: '#eee5d3', card: '#f7f1e5', text: '#2a2420', muted: '#5d544b',
            accent: '#2c4a87', accentText: '#f7f1e5', secondary: '#c4894a', secondaryText: '#1f1a16',
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

    // ── Template aggiunti a dicembre 2026 ────────────────────────────────────
    // Undici tradizioni di stampa in più, ognuna con un suo carattere e una sua logica di pagina.

    {
        key: 'tipografia',
        label: 'Trattoria · Stampa anni \'60',
        description: 'Due inchiostri, nero e rosso, Bodoni maiuscolo, fregi a foglia d\'edera tra le sezioni e la leggera sbavatura dei caratteri mobili.',
        inspiration: 'I menu delle trattorie stampati in tipografia negli anni \'60, con i caratteri Nebiolo e i fregi di cassa.',
        isNew: true,
        pairsWith: ['default', 'enoteca'],
        venues: ['trattoria', 'ristorante', 'enoteca'],
        palette: {
            bg: '#f3ecdc', card: '#f8f3e7', text: '#1d1a17', muted: '#514a40',
            accent: '#ad2219', accentText: '#f8f3e7', secondary: '#1d1a17', secondaryText: '#f3ecdc',
            heroBg: '#1d1a17', heroOverlay: 0.35,
        },
        fonts: {
            display: '"Libre Bodoni", "Bodoni 72", Didot, Georgia, serif',
            body: '"Old Standard TT", Georgia, serif',
            google: ['Libre+Bodoni:ital,wght@0,500;0,700;1,500', 'Old+Standard+TT:ital,wght@0,400;0,700;1,400'],
        },
        look: {
            align: 'center', headingCase: 'uppercase', headingStyle: 'normal', headingWeight: 700, headingTracking: '0.07em',
            divider: 'fleuron', texture: 'paper', radius: 0, leaders: true, price: 'plain',
            productLayout: 'menu', categoryLayout: 'index', categoryNumbers: 'none', productNumbers: false,
            hero: 'masthead', cardBorder: 'hairline', offsetShadow: false, width: 'narrow', ticker: 'static',
            sectionHeader: 'ruled', descStyle: 'italic', ink: 'letterpress', buttonStyle: 'outline',
        },
    },
    {
        key: 'riso',
        label: 'Caffè · Fanzine risograph',
        description: 'Due inchiostri spot, blu e rosa fluo, fuori registro come nella risografia, grana della carta e titoli grassi da fanzine.',
        inspiration: 'Le fanzine e i menu dei caffè di quartiere stampati in risografia, due passaggi di colore.',
        isNew: true,
        pairsWith: ['chiosco', 'street'],
        venues: ['caffe', 'bar', 'vegano'],
        palette: {
            bg: '#f3efe4', card: '#faf7ef', text: '#22347a', muted: '#4a5487',
            accent: '#ff4fa3', accentText: '#141f52', secondary: '#22347a', secondaryText: '#faf7ef',
            heroBg: '#22347a', heroOverlay: 0.3,
        },
        fonts: {
            display: '"Bowlby One", Impact, sans-serif',
            body: '"Atkinson Hyperlegible", "Segoe UI", sans-serif',
            google: ['Bowlby+One', 'Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400'],
        },
        look: {
            align: 'left', headingCase: 'none', headingStyle: 'normal', headingWeight: 400, headingTracking: '0.005em',
            divider: 'thick', texture: 'grain', radius: 0, leaders: false, price: 'plain',
            productLayout: 'grid', categoryLayout: 'tiles', categoryNumbers: 'arabic', productNumbers: false,
            hero: 'masthead', cardBorder: 'heavy', offsetShadow: false, width: 'wide', ticker: 'static',
            sectionHeader: 'band', categoryNav: 'block', pricePosition: 'below', ink: 'misregister',
        },
    },
    {
        key: 'dimsum',
        label: 'Dim sum · Foglio d\'ordine',
        description: 'Il foglietto rosa del dim sum: piatti numerati nelle caselle rosse, sezioni su fascia vermiglia, tutto fitto e ordinato.',
        inspiration: 'I fogli d\'ordine dei ristoranti dim sum di Hong Kong, dove si spunta la casella di ogni cestino.',
        isNew: true,
        pairsWith: ['sushi', 'izakaya'],
        venues: ['etnico', 'ristorante'],
        palette: {
            bg: '#fbf1ec', card: '#fffaf6', text: '#2a1616', muted: '#6a4843',
            accent: '#c2102c', accentText: '#ffffff', secondary: '#0f5c4d', secondaryText: '#ffffff',
            heroBg: '#2a1616', heroOverlay: 0.4,
        },
        fonts: {
            display: '"Zen Old Mincho", "Songti SC", Georgia, serif',
            body: '"Zen Kaku Gothic Antique", "PingFang SC", "Segoe UI", sans-serif',
            google: ['Zen+Old+Mincho:wght@600;900', 'Zen+Kaku+Gothic+Antique:wght@400;500;700'],
        },
        look: {
            align: 'left', headingCase: 'none', headingStyle: 'normal', headingWeight: 900, headingTracking: '0.02em',
            divider: 'double', texture: 'none', radius: 0, leaders: false, price: 'plain',
            productLayout: 'twocol', categoryLayout: 'index', categoryNumbers: 'arabic', productNumbers: true,
            hero: 'masthead', cardBorder: 'hairline', offsetShadow: false, width: 'wide', ticker: 'static',
            sectionHeader: 'band', categoryNav: 'block', density: 'compact', numberStyle: 'boxed',
        },
    },
    {
        key: 'napoletana',
        label: 'Pizzeria napoletana · Maioliche',
        description: 'Smalto bianco e fascia di maioliche verde e gialla, slab grasso da insegna, etichette gialle sulle sezioni.',
        inspiration: 'Le maioliche del chiostro di Santa Chiara e i banconi piastrellati delle pizzerie storiche di Napoli.',
        isNew: true,
        pairsWith: ['pizzeria', 'mediterraneo'],
        venues: ['pizzeria', 'trattoria'],
        palette: {
            bg: '#fbf7ec', card: '#ffffff', text: '#22201a', muted: '#565145',
            accent: '#1f6a39', accentText: '#ffffff', secondary: '#e9b425', secondaryText: '#22201a',
            heroBg: '#22201a', heroOverlay: 0.4,
        },
        fonts: {
            display: 'Ultra, "Rockwell Extra Bold", Georgia, serif',
            body: '"Zilla Slab", Rockwell, Georgia, serif',
            google: ['Ultra', 'Zilla+Slab:ital,wght@0,400;0,500;0,700;1,400'],
        },
        look: {
            align: 'left', headingCase: 'none', headingStyle: 'normal', headingWeight: 400, headingTracking: '0',
            divider: 'tile', texture: 'none', radius: 4, leaders: true, price: 'accent',
            productLayout: 'menu', categoryLayout: 'rows', categoryNumbers: 'none', productNumbers: false,
            hero: 'masthead', cardBorder: 'hairline', offsetShadow: false, width: 'wide', ticker: 'static',
            sectionHeader: 'label', categoryNav: 'pill',
        },
    },
    {
        key: 'vineria',
        label: 'Vineria · Lista a macchina',
        description: 'La lista battuta a macchina su carta velina: nastro nero e rosso, titoli sottolineati, prezzi incolonnati coi puntini.',
        inspiration: 'Le liste dei vini e del giorno battute a macchina nelle vinerie veneziane (i bàcari) e nei wine bar.',
        isNew: true,
        pairsWith: ['enoteca', 'braceria'],
        venues: ['enoteca', 'bar', 'trattoria'],
        palette: {
            bg: '#f2efe6', card: '#f8f6ef', text: '#1e1d1b', muted: '#4c4943',
            accent: '#ab271f', accentText: '#ffffff', secondary: '#1e1d1b', secondaryText: '#f2efe6',
            heroBg: '#1e1d1b', heroOverlay: 0.35,
        },
        fonts: {
            display: '"Special Elite", "Courier New", monospace',
            body: '"Courier Prime", "Courier New", monospace',
            price: '"Courier Prime", "Courier New", monospace',
            google: ['Special+Elite', 'Courier+Prime:ital,wght@0,400;0,700;1,400'],
        },
        look: {
            align: 'left', headingCase: 'uppercase', headingStyle: 'normal', headingWeight: 400, headingTracking: '0.04em',
            divider: 'dashed', texture: 'paper', radius: 0, leaders: true, price: 'plain',
            productLayout: 'menu', categoryLayout: 'index', categoryNumbers: 'arabic', productNumbers: false,
            hero: 'masthead', cardBorder: 'hairline', offsetShadow: false, width: 'narrow', ticker: 'static',
            sectionHeader: 'underscore', ink: 'typed', buttonStyle: 'underline', categoryNav: 'underline',
        },
    },
    {
        key: 'pasticceria',
        label: 'Pasticceria storica',
        description: 'Cartiglio con il nome in corsivo inglese, titoli ornati, pizzo di carta tra le sezioni, verde salotto e oro. Per pasticcerie e sale da tè.',
        inspiration: 'Le confezioni e i listini delle pasticcerie storiche torinesi e palermitane, fine Ottocento.',
        isNew: true,
        pairsWith: ['brasserie', 'gelateria'],
        venues: ['caffe', 'gelateria', 'forno'],
        palette: {
            bg: '#f4ece2', card: '#fbf6ef', text: '#33201a', muted: '#694f45',
            accent: '#2d5a4c', accentText: '#fbf6ef', secondary: '#c8a66a', secondaryText: '#2b1a12',
            heroBg: '#33201a', heroOverlay: 0.35,
        },
        fonts: {
            display: 'Elsie, Didot, Georgia, serif',
            body: '"Sorts Mill Goudy", Georgia, serif',
            accent: '"Pinyon Script", "Snell Roundhand", cursive',
            google: ['Elsie:wght@400;900', 'Sorts+Mill+Goudy:ital@0;1', 'Pinyon+Script'],
        },
        look: {
            align: 'center', headingCase: 'none', headingStyle: 'normal', headingWeight: 400, headingTracking: '0.01em',
            divider: 'lace', texture: 'paper', radius: 0, leaders: true, price: 'accent',
            productLayout: 'menu', categoryLayout: 'index', categoryNumbers: 'none', productNumbers: false,
            hero: 'masthead', cardBorder: 'hairline', offsetShadow: false, width: 'narrow', ticker: 'static',
            headerStyle: 'cartouche', sectionHeader: 'ruled', descStyle: 'italic', imageShape: 'round', buttonStyle: 'outline',
        },
    },
    {
        key: 'chiosco',
        label: 'Chiosco · Spiaggia anni \'70',
        description: 'Righe arancio, senape e marrone come le cabine, corsivo grasso da insegna, schede tonde. Piadine, granite, panini e spritz.',
        inspiration: 'I chioschi della riviera romagnola negli anni \'70: tende a righe, insegne dipinte, ghiaccioli.',
        isNew: true,
        pairsWith: ['riso', 'vegetale'],
        venues: ['bar', 'street', 'gelateria'],
        palette: {
            bg: '#f6ead4', card: '#fcf4e6', text: '#3b2314', muted: '#674a35',
            accent: '#b8431a', accentText: '#ffffff', secondary: '#e0a02a', secondaryText: '#3b2314',
            heroBg: '#3b2314', heroOverlay: 0.35,
        },
        fonts: {
            display: 'Shrikhand, "Cooper Black", Georgia, serif',
            body: 'Rubik, "Segoe UI", sans-serif',
            google: ['Shrikhand', 'Rubik:ital,wght@0,400;0,500;0,700;1,400'],
        },
        look: {
            align: 'left', headingCase: 'none', headingStyle: 'normal', headingWeight: 400, headingTracking: '0.005em',
            divider: 'stripes', texture: 'none', radius: 18, leaders: false, price: 'accent',
            productLayout: 'cards', categoryLayout: 'tiles', categoryNumbers: 'none', productNumbers: false,
            hero: 'overlay', cardBorder: 'hairline', offsetShadow: false, width: 'wide', ticker: 'marquee',
            sectionHeader: 'band', categoryNav: 'pill', imageShape: 'round',
        },
    },
    {
        key: 'bageri',
        label: 'Bageri · Forno nordico',
        description: 'Avena e segale, un grottesco nero tutto in minuscolo, il prezzo subito dopo il nome, tanta aria e nessun ornamento.',
        inspiration: 'Le lavagnette e i listini delle panetterie di Copenaghen e Stoccolma.',
        isNew: true,
        pairsWith: ['minimal', 'forno'],
        venues: ['forno', 'caffe'],
        palette: {
            bg: '#eee7da', card: '#f7f2e9', text: '#2b2118', muted: '#5c5145',
            accent: '#a3263a', accentText: '#ffffff', secondary: '#2b2118', secondaryText: '#eee7da',
            heroBg: '#2b2118', heroOverlay: 0.3,
        },
        fonts: {
            display: '"Albert Sans", "Helvetica Neue", Arial, sans-serif',
            body: '"Albert Sans", "Helvetica Neue", Arial, sans-serif',
            google: ['Albert+Sans:ital,wght@0,400;0,500;0,700;0,800;1,400'],
        },
        look: {
            align: 'left', headingCase: 'lowercase', headingStyle: 'normal', headingWeight: 800, headingTracking: '-0.03em',
            divider: 'none', texture: 'none', radius: 0, leaders: false, price: 'plain',
            productLayout: 'menu', categoryLayout: 'index', categoryNumbers: 'none', productNumbers: false,
            hero: 'masthead', cardBorder: 'none', offsetShadow: false, width: 'wide', ticker: 'static',
            density: 'airy', pricePosition: 'inline', buttonStyle: 'underline',
        },
    },
    {
        key: 'taqueria',
        label: 'Taquería · Papel picado',
        description: 'Festoni di papel picado rosa, arancio e verde, lettere da insegna dipinta, etichette verdi sulle sezioni. Tacos, burritos, mezcal.',
        inspiration: 'Le taquerías di Città del Messico, con i rótulos dipinti a mano e i festoni di carta traforata.',
        isNew: true,
        pairsWith: ['levante', 'street'],
        venues: ['etnico', 'street', 'bar'],
        palette: {
            bg: '#fbf1e1', card: '#fff8ec', text: '#2b1a12', muted: '#62483a',
            accent: '#b8005f', accentText: '#ffffff', secondary: '#00704a', secondaryText: '#ffffff',
            heroBg: '#2b1a12', heroOverlay: 0.4,
        },
        fonts: {
            display: 'Rakkas, "Rockwell Extra Bold", Georgia, serif',
            body: 'Asap, "Segoe UI", sans-serif',
            google: ['Rakkas', 'Asap:ital,wght@0,400;0,500;0,700;1,400'],
        },
        look: {
            align: 'left', headingCase: 'none', headingStyle: 'normal', headingWeight: 400, headingTracking: '0.01em',
            divider: 'papel', texture: 'none', radius: 4, leaders: false, price: 'accent',
            productLayout: 'menu', categoryLayout: 'tiles', categoryNumbers: 'none', productNumbers: false,
            hero: 'masthead', cardBorder: 'hairline', offsetShadow: false, width: 'wide', ticker: 'static',
            sectionHeader: 'label', categoryNav: 'block',
        },
    },
    {
        key: 'bacheca',
        label: 'Tavola calda · Bacheca a lettere',
        description: 'Feltro nero a righe e lettere bianche infilate a mano, tutto maiuscolo condensato e centrato come sulla bacheca. Rosticcerie e tavole calde.',
        inspiration: 'Le bacheche di feltro con le lettere di plastica a incastro delle rosticcerie e delle mense.',
        isNew: true,
        pairsWith: ['diner', 'braceria'],
        venues: ['street', 'trattoria', 'bar'],
        palette: {
            bg: '#1c1c1a', card: '#252523', text: '#f4f1ea', muted: '#c2bdb2',
            accent: '#ef5b47', accentText: '#1c1c1a', secondary: '#f4f1ea', secondaryText: '#1c1c1a',
            heroBg: '#1c1c1a', heroOverlay: 0.55,
        },
        fonts: {
            display: '"Big Shoulders Display", "Arial Narrow", sans-serif',
            body: '"Big Shoulders Text", "Arial Narrow", sans-serif',
            google: ['Big+Shoulders+Display:wght@600;700;800', 'Big+Shoulders+Text:wght@400;500;600;700'],
        },
        look: {
            align: 'center', headingCase: 'uppercase', headingStyle: 'normal', headingWeight: 700, headingTracking: '0.06em',
            divider: 'none', texture: 'felt', radius: 0, leaders: false, price: 'plain',
            productLayout: 'menu', categoryLayout: 'index', categoryNumbers: 'none', productNumbers: false,
            hero: 'masthead', cardBorder: 'hairline', offsetShadow: false, width: 'narrow', ticker: 'static',
            density: 'compact', categoryNav: 'block', buttonStyle: 'outline',
        },
    },
    {
        key: 'birreria',
        label: 'Birreria · Bierstube',
        description: 'Gotico leggibile per i titoli, fregio a losanghe bianche e blu, fascia di legno col nome. Würstel, stinco, birre alla spina.',
        inspiration: 'Le birrerie bavaresi e altoatesine: le insegne in Fraktur e la bandiera a losanghe.',
        isNew: true,
        pairsWith: ['pub', 'agriturismo'],
        venues: ['pub', 'braceria', 'trattoria'],
        palette: {
            bg: '#f1ead9', card: '#f8f3e7', text: '#1f1a14', muted: '#55493a',
            accent: '#1a5aa6', accentText: '#ffffff', secondary: '#5e331b', secondaryText: '#f8f3e7',
            heroBg: '#1f1a14', heroOverlay: 0.4,
        },
        fonts: {
            display: '"Grenze Gotisch", "Old English Text MT", Georgia, serif',
            body: '"Source Sans 3", "Segoe UI", sans-serif',
            google: ['Grenze+Gotisch:wght@500;600;700', 'Source+Sans+3:ital,wght@0,400;0,600;0,700;1,400'],
        },
        look: {
            align: 'left', headingCase: 'none', headingStyle: 'normal', headingWeight: 600, headingTracking: '0.01em',
            divider: 'rauten', texture: 'paper', radius: 2, leaders: true, price: 'plain',
            productLayout: 'menu', categoryLayout: 'rows', categoryNumbers: 'none', productNumbers: false,
            hero: 'masthead', cardBorder: 'hairline', offsetShadow: false, width: 'wide', ticker: 'static',
            headerStyle: 'banner', sectionHeader: 'label', categoryNav: 'underline',
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
    { key: 'fleuron',  label: 'Fregio a foglia (tipografia)' },
    { key: 'short',    label: 'Filetto corto centrato' },
    { key: 'lace',     label: 'Pizzo di carta' },
    { key: 'nouveau',  label: 'Fregio Art Nouveau' },
    { key: 'checker',  label: 'Quadretti tovaglia' },
    { key: 'diner',    label: 'Scacchi bianco e nero' },
    { key: 'tile',     label: 'Fascia di maioliche' },
    { key: 'girih',    label: 'Fregio geometrico' },
    { key: 'brush',    label: 'Pennellata' },
    { key: 'awning',   label: 'Tenda a righe' },
    { key: 'stripes',  label: 'Righe anni \'70' },
    { key: 'papel',    label: 'Papel picado' },
    { key: 'rauten',   label: 'Losanghe bavaresi' },
    { key: 'none',     label: 'Nessuno' },
];
export const TEXTURES: { key: TextureStyle; label: string }[] = [
    { key: 'none',    label: 'Nessuna (tinta unita)' },
    { key: 'paper',   label: 'Carta avorio' },
    { key: 'laid',    label: 'Carta vergata' },
    { key: 'kraft',   label: 'Carta da pacchi' },
    { key: 'flour',   label: 'Carta infarinata' },
    { key: 'flecks',  label: 'Carta riciclata' },
    { key: 'grain',   label: 'Grana risograph' },
    { key: 'washi',   label: 'Washi' },
    { key: 'sashiko', label: 'Punti sashiko (fondi scuri)' },
    { key: 'chalk',   label: 'Lavagna (fondi scuri)' },
    { key: 'wood',    label: 'Legno (fondi scuri)' },
    { key: 'butcher', label: 'Carta da macelleria (fondi scuri)' },
    { key: 'felt',    label: 'Feltro della bacheca (fondi scuri)' },
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
    { key: 'sticker', label: 'Adesivo' },
    { key: 'underscore', label: 'Sottolineato a macchina' },
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
    { key: 'cartouche', label: 'Cartiglio ornato' },
    { key: 'sticker', label: 'Adesivo fustellato' },
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
