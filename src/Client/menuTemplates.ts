/**
 * Libreria dei template del menu pubblico (landing + pagine menu).
 *
 * Il template scelto è salvato come stringa libera in `StyleDto.landingTemplate`
 * (colonna VARCHAR lato backend, nessun enum): aggiungere un template qui non
 * richiede modifiche al backend. Chiavi sconosciute ricadono su 'default'.
 *
 * Ogni template definisce:
 *  - palette: colori di partenza, applicati ai campi colore dello stile quando
 *    il ristoratore sceglie il template (poi li può ritoccare dal tab "Colori");
 *  - fonts:   abbinamento tipografico (titoli / testo / prezzi) da Google Fonts;
 *  - look:    scelte di impaginazione ispirate ai menu stampati (filetti,
 *             puntini tra piatto e prezzo, numerazione, texture della carta…).
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
    | 'sushi';

export type VenueTag =
    | 'ristorante'
    | 'trattoria'
    | 'pizzeria'
    | 'bar'
    | 'caffe'
    | 'pub'
    | 'cocktail'
    | 'street'
    | 'etnico'
    | 'fine';

export const VENUE_FILTERS: { key: VenueTag | 'all'; label: string }[] = [
    { key: 'all',        label: 'Tutti' },
    { key: 'ristorante', label: 'Ristorante' },
    { key: 'trattoria',  label: 'Trattoria / Osteria' },
    { key: 'pizzeria',   label: 'Pizzeria' },
    { key: 'bar',        label: 'Bar' },
    { key: 'caffe',      label: 'Caffè / Pasticceria' },
    { key: 'pub',        label: 'Pub / Birreria' },
    { key: 'cocktail',   label: 'Cocktail bar' },
    { key: 'street',     label: 'Street food' },
    { key: 'etnico',     label: 'Sushi / Etnico' },
    { key: 'fine',       label: 'Fine dining' },
];

export type DividerStyle = 'hairline' | 'double' | 'thick' | 'dashed' | 'checker' | 'ornament';
export type TextureStyle = 'none' | 'paper' | 'chalk' | 'wood' | 'washi';

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
    /** Query Google Fonts (`family=` value) da caricare per questo template. */
    google: string[];
}

export interface TemplateLook {
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
    productLayout: 'menu' | 'centered' | 'cards';
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

// ─── Libreria ─────────────────────────────────────────────────────────────────

export const MENU_TEMPLATES: MenuTemplateDef[] = [
    {
        key: 'default',
        label: 'Classico',
        description: 'Carta avorio, Garamond in maiuscoletto, doppio filetto e prezzi con i puntini. Il menu del ristorante di tradizione.',
        venues: ['ristorante', 'trattoria'],
        palette: {
            bg: '#f4eee2', card: '#faf6ee', text: '#1f1a14', muted: '#5b5143',
            accent: '#7a2318', accentText: '#faf6ee', secondary: '#1f1a14', secondaryText: '#f4eee2',
            heroBg: '#1f1a14', heroOverlay: 0.35,
        },
        fonts: {
            display: '"Cormorant Garamond", Garamond, Georgia, serif',
            body: '"EB Garamond", Garamond, Georgia, serif',
            google: ['Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500', 'EB+Garamond:ital,wght@0,400;0,500;0,600;1,400'],
        },
        look: {
            align: 'center', headingCase: 'smallcaps', headingStyle: 'normal', headingWeight: 600, headingTracking: '0.06em',
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
        description: 'Fondo scuro, corsivo sottile, tanto spazio vuoto e niente foto tra i piatti. Per cucina d\'autore e menu degustazione.',
        venues: ['fine', 'ristorante', 'cocktail'],
        palette: {
            bg: '#13120f', card: '#1a1916', text: '#ece6da', muted: '#a69d8c',
            accent: '#c2a26b', accentText: '#13120f', secondary: '#ece6da', secondaryText: '#13120f',
            heroBg: '#13120f', heroOverlay: 0.55,
        },
        fonts: {
            display: '"Cormorant Garamond", Garamond, Georgia, serif',
            body: 'Jost, "Futura", "Century Gothic", sans-serif',
            google: ['Cormorant+Garamond:ital,wght@0,400;0,500;1,400;1,500', 'Jost:wght@300;400;500'],
        },
        look: {
            align: 'center', headingCase: 'none', headingStyle: 'italic', headingWeight: 400, headingTracking: '0.01em',
            divider: 'ornament', texture: 'none', radius: 0, leaders: false, price: 'accent',
            productLayout: 'centered', categoryLayout: 'index', categoryNumbers: 'none', productNumbers: false,
            hero: 'masthead', cardBorder: 'none', offsetShadow: false, width: 'narrow', ticker: 'static',
        },
    },
    {
        key: 'trattoria',
        label: 'Trattoria',
        description: 'Carta paglia, bordo a quadretti, titoli corsivi rosso pomodoro. Cucina di casa, osterie, agriturismi.',
        venues: ['trattoria', 'pizzeria', 'ristorante'],
        palette: {
            bg: '#f1e6cf', card: '#f8f0de', text: '#2a1f16', muted: '#5e4e3b',
            accent: '#a3241a', accentText: '#fff8ec', secondary: '#2f4a2a', secondaryText: '#f8f0de',
            heroBg: '#2a1f16', heroOverlay: 0.35,
        },
        fonts: {
            display: '"Playfair Display", Georgia, serif',
            body: 'Lora, Georgia, serif',
            google: ['Playfair+Display:ital,wght@0,700;1,700;1,800', 'Lora:ital,wght@0,400;0,500;0,600;1,400'],
        },
        look: {
            align: 'left', headingCase: 'none', headingStyle: 'italic', headingWeight: 700, headingTracking: '0',
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
        description: 'Chiaro e arioso, serif morbido e foto della vetrina in primo piano. Colazioni, brunch, gelaterie, pasticcerie.',
        venues: ['caffe', 'bar'],
        palette: {
            bg: '#fbf7f1', card: '#ffffff', text: '#3a2a20', muted: '#6c5a4c',
            accent: '#a94f2b', accentText: '#ffffff', secondary: '#eadfd2', secondaryText: '#3a2a20',
            heroBg: '#3a2a20', heroOverlay: 0.2,
        },
        fonts: {
            display: 'Fraunces, Georgia, serif',
            body: 'Mulish, "Segoe UI", sans-serif',
            google: ['Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700', 'Mulish:wght@400;600;700'],
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
];

export const TEMPLATE_BY_KEY: Record<MenuTemplateKey, MenuTemplateDef> =
    Object.fromEntries(MENU_TEMPLATES.map(t => [t.key, t])) as Record<MenuTemplateKey, MenuTemplateDef>;

/** Alias di chiavi storiche salvate a DB. */
const LEGACY_ALIASES: Record<string, MenuTemplateKey> = {
    // 'strafame' era il look del template di default fino a ottobre 2026.
    strafame: 'default',
};

/** Normalizza il valore salvato in `landingTemplate` (anche vecchio/sconosciuto). */
export function resolveTemplateKey(raw: string | null | undefined): MenuTemplateKey {
    const k = (raw || '').trim();
    if (!k) return 'default';
    if (k in TEMPLATE_BY_KEY) return k as MenuTemplateKey;
    return LEGACY_ALIASES[k] || 'default';
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
