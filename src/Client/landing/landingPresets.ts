import type { MenuTemplateKey } from '../menuTemplates';
import {
    AnimationKind, DEFAULT_GLOBAL, LandingConfig, LandingGlobal, LandingSection, LANDING_CONFIG_VERSION,
    newSection, SectionStyle, SectionType,
} from './landingConfig';

/**
 * Modelli di sito completi (Dashboard → Template → "Siti completi"): sezioni già ordinate,
 * stile globale e template grafico del menu. Applicando un modello le foto e i testi già inseriti
 * restano dove esiste una sezione dello stesso tipo (vedi `applyPreset`).
 */

export interface LandingPreset {
    key: string;
    label: string;
    description: string;
    /** Il locale / l'oggetto stampato da cui nasce (una riga, mostrata nella libreria). */
    inspiration?: string;
    /** Template grafico (palette/font/impaginazione) abbinato. */
    templateKey: MenuTemplateKey;
    global: Partial<LandingGlobal>;
    build: () => LandingSection[];
}

type Over<T extends SectionType> = Partial<Omit<Extract<LandingSection, { type: T }>, 'style'>> & { style?: Partial<SectionStyle> };

function sec<T extends SectionType>(type: T, over: Over<T> = {}): LandingSection {
    const base = newSection(type);
    const { style, ...rest } = over;
    return { ...base, ...rest, style: { ...base.style, ...(style || {}) } } as LandingSection;
}

const anim = (animation: AnimationKind) => ({ animation });

/**
 * Ogni modello nasce da un locale vero e da un oggetto stampato (campo `inspiration`):
 * cambia l'ordine e il ritmo delle sezioni, non solo i colori. Regole comuni (dicembre 2026):
 * niente "4 box con icona" di riempimento, niente schede con ombra sfumata e pulsanti a pillola
 * di default, il menù come contenuto (elenchi stampati, lavagne, indici) invece che come bottone.
 */
const quiet = { buttonShape: 'template', cardStyle: 'template', dividers: 'template' } as const;

export const LANDING_PRESETS: LandingPreset[] = [
    // ── Modelli storici (stesse chiavi), rivisti ───────────────────────────
    {
        key: 'pizzeria',
        label: 'Pizzeria',
        description: 'La foto del forno a tutta pagina, la striscia delle categorie, le pizze come sul cartello sopra il banco e un collage di sala.',
        inspiration: 'Il cartello delle pizze appeso sopra il forno.',
        templateKey: 'pizzeria',
        global: { ...quiet, animation: 'subtle' },
        build: () => [
            sec('announcement', { enabled: false }),
            sec('hero', {
                variant: 'image', height: 'full', align: 'template',
                buttons: [{ label: 'Le pizze', action: 'menu', href: '' }, { label: 'Chiama per l\'asporto', action: 'call', href: '' }],
                showTakeaway: true, style: anim('fade'),
            }),
            sec('ticker'),
            sec('highlights', { title: 'Dal forno', layout: 'menu', style: anim('stagger') }),
            sec('gallery', { title: 'In sala e al banco', layout: 'collage', style: anim('stagger') }),
            sec('testimonials', { title: 'Dicono di noi', items: [], style: anim('fade') }),
            sec('hours', { style: anim('fade') }),
            sec('reservations', { mode: 'button', style: anim('fade') }),
            sec('location', { style: anim('fade') }),
        ],
    },
    {
        key: 'trattoria',
        label: 'Trattoria / Osteria',
        description: 'Il cartoncino del menu in apertura con l\'indice delle sezioni, un biglietto scritto a mano dalla cucina, i piatti della casa in elenco.',
        inspiration: 'Il menu infilato nel portamenu e il biglietto della nonna appeso in cucina.',
        templateKey: 'trattoria',
        global: { ...quiet, animation: 'subtle' },
        build: () => [
            sec('hero', { variant: 'card', showTakeaway: false, style: anim('fade') }),
            sec('about', { title: 'Due righe dalla cucina', variant: 'note', style: anim('slide-up') }),
            sec('highlights', { title: 'I piatti della casa', layout: 'menu', style: anim('stagger') }),
            sec('gallery', { title: 'La trattoria', layout: 'grid', style: anim('stagger') }),
            sec('hours', { style: anim('fade') }),
            sec('reservations', { style: anim('slide-up') }),
            sec('contact', { title: 'Dove siamo', style: anim('fade') }),
        ],
    },
    {
        key: 'sushi',
        label: 'Sushi / Etnico',
        description: 'Foto e testo affiancati, la selezione dello chef numerata come al banco, il provino delle foto e la storia in colonna stretta.',
        inspiration: 'Il menu numerato dei sushi-ya e le foto di cucina in pellicola.',
        templateKey: 'sushi',
        global: { ...quiet, animation: 'subtle', dividers: 'line' },
        build: () => [
            sec('hero', { variant: 'split', height: 'large', style: anim('slide-up') }),
            sec('highlights', { title: 'Selezione dello chef', layout: 'menu', style: anim('stagger') }),
            sec('gallery', { title: 'Al banco', layout: 'filmstrip', style: anim('fade') }),
            sec('about', { title: 'La nostra cucina', variant: 'editorial', style: anim('fade') }),
            sec('categories', { style: anim('fade') }),
            sec('reservations', { style: anim('fade') }),
            sec('hours', { style: anim('fade') }),
            sec('contact', { style: anim('fade') }),
        ],
    },
    {
        key: 'cocktail',
        label: 'Cocktail bar',
        description: 'Foto di sera a tutta pagina, il bar raccontato come un articolo, la drink list con gli ingredienti e le citazioni dei clienti.',
        inspiration: 'Le carte degli american bar degli anni \'30.',
        templateKey: 'cocktail',
        global: { ...quiet, animation: 'subtle', backToTop: true },
        build: () => [
            sec('announcement', { enabled: false }),
            sec('hero', {
                variant: 'image', height: 'full', align: 'center', overlayOpacity: 0.55,
                buttons: [{ label: 'La drink list', action: 'menu', href: '' }, { label: 'Prenota un tavolo', action: 'reserve', href: '' }],
                style: anim('fade'),
            }),
            sec('highlights', { title: 'Signature', layout: 'menu', style: anim('stagger') }),
            sec('about', { title: 'Il bar', variant: 'editorial', style: { animation: 'fade', spacing: 'airy' } }),
            sec('gallery', { title: '', layout: 'masonry', style: anim('fade') }),
            sec('testimonials', { title: 'Dicono di noi', items: [], style: anim('fade') }),
            sec('hours', { style: anim('fade') }),
            sec('reservations', { style: anim('fade') }),
            sec('contact', { title: 'Seguici', style: anim('fade') }),
        ],
    },
    {
        key: 'fine',
        label: 'Fine dining · Degustazione',
        description: 'Solo testo in apertura, la filosofia in colonna con capolettera, il percorso degustazione come sul cartoncino, foto in carosello.',
        inspiration: 'Il cartoncino del percorso degustazione da portare a casa.',
        templateKey: 'luxury',
        global: { ...quiet, animation: 'subtle' },
        build: () => [
            sec('hero', { variant: 'minimal', height: 'large', align: 'center', buttons: [{ label: 'Prenota', action: 'reserve', href: '' }, { label: 'Il percorso', action: 'menu', href: '' }], style: anim('fade') }),
            sec('about', { title: 'La filosofia', variant: 'editorial', style: { animation: 'fade', spacing: 'airy' } }),
            sec('highlights', { title: 'Il percorso', layout: 'menu', showPrices: false, style: { animation: 'fade', spacing: 'airy' } }),
            sec('gallery', { title: '', layout: 'carousel', style: { animation: 'fade', spacing: 'airy' } }),
            sec('video', { style: anim('fade') }),
            sec('reservations', { style: { animation: 'fade', spacing: 'airy' } }),
            sec('location', { style: anim('fade') }),
        ],
    },
    {
        key: 'caffe',
        label: 'Caffè · Bar',
        description: 'Foto del banco a lato del nome, il listino "al banco" con i puntini, un collage del locale, orari come sulla porta.',
        inspiration: 'Il listino prezzi dietro al banco dei bar italiani.',
        templateKey: 'caffe',
        global: { ...quiet, animation: 'subtle' },
        build: () => [
            sec('hero', { variant: 'split', height: 'large', style: anim('slide-up') }),
            sec('highlights', { title: 'Al banco', layout: 'menu', style: anim('stagger') }),
            sec('gallery', { title: 'Il locale', layout: 'collage', style: anim('stagger') }),
            sec('hours', { style: anim('fade') }),
            sec('location', { showMap: false, style: anim('fade') }),
            sec('contact', { style: anim('fade') }),
        ],
    },

    // ── Modelli nuovi (dicembre 2026), abbinati ai template nuovi ───────────
    {
        key: 'osteria',
        label: 'Osteria · Lavagna',
        description: 'Si apre con la lavagna all\'ingresso e le voci del menù scritte col gesso, la foto appuntata a lato, un biglietto dall\'oste e il fuori menù di oggi.',
        inspiration: 'La lavagna fuori dall\'osteria e il bigliettino scritto dall\'oste.',
        templateKey: 'bistrot',
        global: { ...quiet, animation: 'subtle' },
        build: () => [
            sec('hero', { variant: 'board', showFacts: true, buttons: [{ label: 'Tutto il menù', action: 'menu', href: '' }, { label: 'Prenota', action: 'reserve', href: '' }], style: anim('fade') }),
            sec('highlights', { title: 'Fuori menù di oggi', layout: 'menu', style: anim('stagger') }),
            sec('about', { title: 'Dall\'oste', variant: 'note', style: anim('slide-up') }),
            sec('gallery', { title: 'Le sere in osteria', layout: 'collage', style: anim('stagger') }),
            sec('hours', { style: anim('fade') }),
            sec('reservations', { mode: 'button', style: anim('fade') }),
            sec('contact', { title: 'Dove siamo', style: anim('fade') }),
        ],
    },
    {
        key: 'stampa60',
        label: 'Trattoria · Stampa anni \'60',
        description: 'Il cartoncino a due colori in apertura con le sezioni del menù numerate, la storia della casa con capolettera, i piatti in colonna coi puntini.',
        inspiration: 'I menu stampati in tipografia dalle trattorie negli anni \'60.',
        templateKey: 'tipografia',
        global: { ...quiet, animation: 'subtle' },
        build: () => [
            sec('hero', { variant: 'card', style: anim('fade') }),
            sec('about', { title: 'La casa', variant: 'editorial', style: anim('fade') }),
            sec('highlights', { title: 'Piatti della tradizione', layout: 'menu', style: anim('stagger') }),
            sec('testimonials', { title: 'Hanno scritto di noi', items: [], style: anim('fade') }),
            sec('gallery', { title: '', layout: 'grid', style: anim('stagger') }),
            sec('hours', { style: anim('fade') }),
            sec('reservations', { style: anim('fade') }),
            sec('location', { style: anim('fade') }),
        ],
    },
    {
        key: 'svizzero',
        label: 'Stile svizzero',
        description: 'Manifesto tipografico: il nome enorme a bandiera, foto sfalsata sulla griglia, piatti come indice numerato a filetti pieni. Nessun ornamento.',
        inspiration: 'I manifesti della scuola di Zurigo (Müller-Brockmann) e i listini dei caffè di Basilea.',
        templateKey: 'minimal',
        global: { ...quiet, animation: 'off' },
        build: () => [
            sec('hero', { variant: 'poster', buttons: [{ label: 'Menù', action: 'menu', href: '' }, { label: 'Prenota', action: 'reserve', href: '' }], style: anim('none') }),
            sec('highlights', { title: 'Selezione', layout: 'index', style: anim('none') }),
            sec('about', { title: 'Il locale', variant: 'editorial', style: anim('none') }),
            sec('hours', { style: anim('none') }),
            sec('location', { style: anim('none') }),
            sec('contact', { title: 'Contatti', style: anim('none') }),
        ],
    },
    {
        key: 'fanzine',
        label: 'Caffè · Fanzine',
        description: 'Copertina da fanzine con la foto in bicromia rosa e blu, le cose buone come polaroid, il provino del locale e le recensioni come citazioni.',
        inspiration: 'Le fanzine stampate in risografia nei caffè di quartiere.',
        templateKey: 'riso',
        global: { ...quiet, animation: 'subtle' },
        build: () => [
            sec('hero', { variant: 'poster', buttons: [{ label: 'Cosa c\'è oggi', action: 'menu', href: '' }, { label: 'Asporto', action: 'takeaway', href: '' }], style: anim('fade') }),
            sec('highlights', { title: 'Le cose buone', layout: 'polaroid', style: anim('stagger') }),
            sec('gallery', { title: 'Rullino', layout: 'filmstrip', style: anim('fade') }),
            sec('testimonials', { title: 'Lettere alla redazione', items: [], style: anim('fade') }),
            sec('hours', { style: anim('fade') }),
            sec('location', { style: anim('fade') }),
        ],
    },
    {
        key: 'napoletana',
        label: 'Pizzeria napoletana',
        description: 'Le foto del forno che scorrono, la fascia di maioliche, le pizze divise come sul cartello, la storia accanto alla foto del pizzaiolo e un collage di sala.',
        inspiration: 'Le pizzerie storiche di Napoli, il bancone piastrellato e il cartello delle pizze.',
        templateKey: 'napoletana',
        global: { ...quiet, animation: 'subtle' },
        build: () => [
            sec('hero', {
                variant: 'slideshow', height: 'large',
                buttons: [{ label: 'Le pizze', action: 'menu', href: '' }, { label: 'Chiama', action: 'call', href: '' }],
                showTakeaway: true, style: anim('fade'),
            }),
            sec('ticker'),
            sec('highlights', { title: 'Le rosse e le bianche', layout: 'menu', style: anim('stagger') }),
            sec('about', { title: 'Il pizzaiolo', variant: 'side', imagePosition: 'right', style: anim('slide-up') }),
            sec('gallery', { title: 'Al banco', layout: 'collage', style: anim('stagger') }),
            sec('testimonials', { title: 'Dicono di noi', items: [], style: anim('fade') }),
            sec('hours', { style: anim('fade') }),
            sec('reservations', { mode: 'button', style: anim('fade') }),
            sec('location', { style: anim('fade') }),
        ],
    },
    {
        key: 'vineria',
        label: 'Vineria · Bàcaro',
        description: 'Una pagina battuta a macchina: il nome in testa, la lista al calice coi puntini, il biglietto dell\'oste, il rullino delle serate. Pochissimo altro.',
        inspiration: 'Le liste dei vini battute a macchina nei bàcari veneziani.',
        templateKey: 'vineria',
        global: { ...quiet, animation: 'off' },
        build: () => [
            sec('hero', { variant: 'minimal', height: 'medium', align: 'left', buttons: [{ label: 'La lista completa', action: 'menu', href: '' }], style: anim('none') }),
            sec('highlights', { title: 'Al calice stasera', layout: 'menu', style: anim('none') }),
            sec('about', { title: 'Due righe', variant: 'note', style: anim('none') }),
            sec('gallery', { title: 'Serate', layout: 'filmstrip', style: anim('none') }),
            sec('hours', { style: anim('none') }),
            sec('contact', { title: 'Dove siamo', style: anim('none') }),
        ],
    },
    {
        key: 'pasticceria',
        label: 'Pasticceria storica',
        description: 'Il cartiglio col nome in corsivo inglese sopra il cartoncino del listino, la vetrina in collage, i dolci come foto sul banco, la storia con capolettera.',
        inspiration: 'Le scatole e i listini delle pasticcerie storiche torinesi e palermitane.',
        templateKey: 'pasticceria',
        global: { ...quiet, animation: 'subtle' },
        build: () => [
            sec('hero', { variant: 'card', showFacts: true, style: anim('fade') }),
            sec('gallery', { title: 'La vetrina', layout: 'collage', style: anim('stagger') }),
            sec('highlights', { title: 'Dal laboratorio', layout: 'polaroid', style: anim('stagger') }),
            sec('about', { title: 'Dal 1898', variant: 'editorial', style: anim('fade') }),
            sec('hours', { style: anim('fade') }),
            sec('location', { style: anim('fade') }),
        ],
    },
    {
        key: 'tavolacalda',
        label: 'Tavola calda · Bacheca',
        description: 'Tutto su una bacheca a lettere: il nome, le sezioni del giorno, la foto appuntata. Poi i piatti del giorno in elenco fitto, orari e indirizzo.',
        inspiration: 'Le bacheche di feltro con le lettere a incastro delle rosticcerie.',
        templateKey: 'bacheca',
        global: { ...quiet, animation: 'off' },
        build: () => [
            sec('hero', { variant: 'board', showFacts: true, buttons: [{ label: 'Ordina', action: 'menu', href: '' }, { label: 'Chiama', action: 'call', href: '' }], showTakeaway: true, style: anim('none') }),
            sec('highlights', { title: 'Piatti del giorno', layout: 'menu', style: anim('none') }),
            sec('hours', { style: anim('none') }),
            sec('location', { style: anim('none') }),
            sec('contact', { title: 'Contatti', style: anim('none') }),
        ],
    },
    {
        key: 'dimsum',
        label: 'Dim sum',
        description: 'Foto dei cestini a lato del nome, i piatti numerati come sul foglio d\'ordine, il provino della cucina a vapore e il modulo per prenotare.',
        inspiration: 'I fogli d\'ordine dei ristoranti dim sum di Hong Kong.',
        templateKey: 'dimsum',
        global: { ...quiet, animation: 'subtle' },
        build: () => [
            sec('hero', { variant: 'split', height: 'large', style: anim('fade') }),
            sec('highlights', { title: 'Dal foglio d\'ordine', layout: 'menu', style: anim('stagger') }),
            sec('gallery', { title: 'Vapore', layout: 'filmstrip', style: anim('fade') }),
            sec('hours', { style: anim('fade') }),
            sec('reservations', { style: anim('fade') }),
            sec('contact', { style: anim('fade') }),
        ],
    },
    {
        key: 'bageri',
        label: 'Bageri · Forno nordico',
        description: 'Nome enorme in minuscolo, foto del pane sfalsata, un elenco asciutto col prezzo subito dopo il nome, la storia del lievito madre in colonna.',
        inspiration: 'Le panetterie di Copenaghen e Stoccolma.',
        templateKey: 'bageri',
        global: { ...quiet, animation: 'off' },
        build: () => [
            sec('hero', { variant: 'poster', buttons: [{ label: 'Oggi in forno', action: 'menu', href: '' }, { label: 'Asporto', action: 'takeaway', href: '' }], style: anim('none') }),
            sec('highlights', { title: 'Oggi in forno', layout: 'menu', style: anim('none') }),
            sec('about', { title: 'Lievito madre', variant: 'editorial', style: anim('none') }),
            sec('hours', { style: anim('none') }),
            sec('location', { style: anim('none') }),
        ],
    },
    {
        key: 'taqueria',
        label: 'Taquería',
        description: 'Foto che scorrono sotto i festoni di papel picado, i tacos come polaroid sul bancone, un collage del locale, orari e indirizzo.',
        inspiration: 'Le taquerías di Città del Messico con i festoni di carta traforata.',
        templateKey: 'taqueria',
        global: { ...quiet, animation: 'subtle' },
        build: () => [
            sec('hero', { variant: 'slideshow', height: 'large', buttons: [{ label: 'El menú', action: 'menu', href: '' }, { label: 'Asporto', action: 'takeaway', href: '' }], style: anim('fade') }),
            sec('highlights', { title: 'Tacos y más', layout: 'polaroid', style: anim('stagger') }),
            sec('gallery', { title: 'La taquería', layout: 'collage', style: anim('stagger') }),
            sec('hours', { style: anim('fade') }),
            sec('location', { style: anim('fade') }),
        ],
    },
    {
        key: 'birreria',
        label: 'Birreria · Bierstube',
        description: 'Foto del bancone a tutta pagina, le birre e i piatti come sul listino della Stube, la storia accanto alla foto, il modulo per i tavoli lunghi.',
        inspiration: 'Le birrerie bavaresi e altoatesine coi tavoloni di legno.',
        templateKey: 'birreria',
        global: { ...quiet, animation: 'subtle' },
        build: () => [
            sec('hero', { variant: 'image', height: 'large', buttons: [{ label: 'Speisekarte', action: 'menu', href: '' }, { label: 'Prenota un tavolo', action: 'reserve', href: '' }], style: anim('fade') }),
            sec('highlights', { title: 'Dalla spina e dalla cucina', layout: 'menu', style: anim('stagger') }),
            sec('about', { title: 'La Stube', variant: 'side', imagePosition: 'left', style: anim('slide-up') }),
            sec('gallery', { title: '', layout: 'grid', style: anim('stagger') }),
            sec('hours', { style: anim('fade') }),
            sec('reservations', { style: anim('fade') }),
            sec('contact', { style: anim('fade') }),
        ],
    },
    {
        key: 'chiosco',
        label: 'Chiosco al mare',
        description: 'La spiaggia a tutta pagina, le righe anni \'70, piadine e granite come polaroid, le foto dell\'estate in carosello.',
        inspiration: 'I chioschi della riviera romagnola negli anni \'70.',
        templateKey: 'chiosco',
        global: { ...quiet, animation: 'subtle' },
        build: () => [
            sec('hero', { variant: 'image', height: 'full', buttons: [{ label: 'Cosa c\'è', action: 'menu', href: '' }, { label: 'Chiama', action: 'call', href: '' }], showTakeaway: true, style: anim('fade') }),
            sec('ticker'),
            sec('highlights', { title: 'Al chiosco', layout: 'polaroid', style: anim('stagger') }),
            sec('gallery', { title: 'Estate', layout: 'carousel', style: anim('slide-side') }),
            sec('hours', { style: anim('fade') }),
            sec('location', { style: anim('fade') }),
        ],
    },
];

/** Campi di impaginazione decisi dal modello (i contenuti invece restano quelli del locale). */
const LAYOUT_KEYS: Partial<Record<SectionType, string[]>> = {
    hero: ['variant', 'height', 'align', 'showTakeaway'],
    gallery: ['layout'],
    highlights: ['layout'],
    about: ['imagePosition', 'variant'],
};

const hasValue = (v: unknown) =>
    v !== null && v !== undefined && !(typeof v === 'string' && v.trim() === '') && !(Array.isArray(v) && v.length === 0);

/**
 * Applica un modello: sezioni, ordine e stile vengono dal modello; per ogni sezione del modello
 * si riusa (una sola volta) la sezione dello stesso tipo già presente, mantenendone foto e testi.
 */
export function applyPreset(preset: LandingPreset, current: LandingConfig | null): LandingConfig {
    const pool = [...(current?.sections || [])];
    const sections = preset.build().map(ps => {
        const idx = pool.findIndex(s => s.type === ps.type);
        if (idx < 0) return ps;
        const old: any = pool.splice(idx, 1)[0];
        const merged: any = { ...ps, id: old.id };
        const layout = LAYOUT_KEYS[ps.type] || [];
        for (const k of Object.keys(old)) {
            if (k === 'id' || k === 'type' || k === 'style' || k === 'enabled' || layout.includes(k)) continue;
            if (hasValue(old[k])) merged[k] = old[k];
        }
        // L'avviso resta acceso se il locale ne aveva già scritto uno
        if (ps.type === 'announcement' && hasValue(old.text)) merged.enabled = old.enabled;
        return merged as LandingSection;
    });
    return {
        version: LANDING_CONFIG_VERSION,
        global: { ...DEFAULT_GLOBAL, ...preset.global },
        sections,
    };
}
