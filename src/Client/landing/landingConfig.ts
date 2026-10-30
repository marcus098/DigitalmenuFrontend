import type { FeatureCard, StyleDto } from '../../types';

/**
 * Sito vetrina a sezioni (StyleDto.landingConfig).
 *
 * Il backend salva il JSON così com'è (con limiti di dimensione e controllo dei link);
 * qui stanno i tipi, i valori di default, la normalizzazione dei dati letti (campi
 * mancanti, liste troppo lunghe…) e gli helper per i link sicuri.
 *
 * `landingConfig` assente/null = sito "classico" costruito dai campi storici dello stile.
 * Nell'editor si parte da `buildInitialConfig(style)`, che riproduce il sito classico.
 */

export const LANDING_CONFIG_VERSION = 1;
/** Limite del backend (LandingConfigValidator.MAX_BYTES). */
export const LANDING_MAX_BYTES = 200 * 1024;

export const LIMITS = {
    sections: 30,
    heroImages: 5,
    heroButtons: 2,
    gallery: 12,
    features: 8,
    highlights: 12,
    testimonials: 12,
    title: 120,
    subtitle: 300,
    text: 2000,
    short: 140,
    label: 40,
    quote: 500,
    author: 80,
    url: 500,
    dayText: 60,
} as const;

// ─── Tipi ─────────────────────────────────────────────────────────────────────

export type SectionType =
    | 'hero' | 'about' | 'gallery' | 'features' | 'highlights' | 'testimonials' | 'hours'
    | 'location' | 'reservations' | 'contact' | 'announcement' | 'text' | 'video' | 'categories' | 'ticker';

export type AnimationKind = 'none' | 'fade' | 'slide-up' | 'slide-side' | 'zoom' | 'stagger';
export type SectionBg = 'theme' | 'primary' | 'secondary' | 'custom' | 'image';
export type Spacing = 'compact' | 'normal' | 'airy';
export type Align = 'template' | 'left' | 'center';

export interface LandingImage {
    /** Percorso nel bucket (da upload) oppure URL https. */
    src: string;
    alt: string;
    caption?: string;
}

export interface SectionStyle {
    bg: SectionBg;
    bgColor: string;
    bgImage: LandingImage | null;
    /** Opacità del velo scuro sopra la foto di sfondo (0..1). */
    bgOverlay: number;
    spacing: Spacing;
    animation: AnimationKind;
    titleAlign: Align;
}

export type ButtonAction = 'menu' | 'reserve' | 'call' | 'whatsapp' | 'link' | 'takeaway';

export interface LandingButton {
    label: string;
    action: ButtonAction;
    href: string;
}

interface Base<T extends SectionType> {
    id: string;
    type: T;
    enabled: boolean;
    title: string;
    eyebrow: string;
    style: SectionStyle;
}

export type HeroVariant = 'template' | 'image' | 'split' | 'slideshow' | 'minimal';

export interface HeroSection extends Base<'hero'> {
    variant: HeroVariant;
    subtitle: string;
    images: LandingImage[];
    /** Secondi tra una foto e l'altra (slideshow). */
    interval: number;
    buttons: LandingButton[];
    showTakeaway: boolean;
    showFacts: boolean;
    /** '' = colore hero dello stile. */
    overlayColor: string;
    /** null = opacità dello stile. */
    overlayOpacity: number | null;
    align: Align;
    height: 'medium' | 'large' | 'full';
}
export interface AboutSection extends Base<'about'> { text: string; image: LandingImage | null; imagePosition: 'left' | 'right' }
export interface GallerySection extends Base<'gallery'> { items: LandingImage[]; layout: 'grid' | 'masonry' | 'carousel' }
export interface FeaturesSection extends Base<'features'> { items: FeatureCard[] }
export interface HighlightsSection extends Base<'highlights'> { productIds: number[]; layout: 'cards' | 'list'; showPrices: boolean }
export interface Testimonial { text: string; author: string; stars: number }
export interface TestimonialsSection extends Base<'testimonials'> { items: Testimonial[] }
export interface DayHours { closed: boolean; text: string }
export interface HoursSection extends Base<'hours'> { days: DayHours[]; note: string }
export interface LocationSection extends Base<'location'> { text: string; showMap: boolean }
export interface ReservationsSection extends Base<'reservations'> { text: string; mode: 'form' | 'button' }
export interface ContactSection extends Base<'contact'> { email: string; tripadvisorUrl: string; showHours: boolean }
export interface AnnouncementSection extends Base<'announcement'> { text: string; linkLabel: string; href: string; bgColor: string; textColor: string }
export interface TextSection extends Base<'text'> { text: string }
export interface VideoSection extends Base<'video'> { videoUrl: string; caption: string }
export interface CategoriesSection extends Base<'categories'> { showButton: boolean }
export type TickerSection = Base<'ticker'>;

export type LandingSection =
    | HeroSection | AboutSection | GallerySection | FeaturesSection | HighlightsSection | TestimonialsSection
    | HoursSection | LocationSection | ReservationsSection | ContactSection | AnnouncementSection | TextSection
    | VideoSection | CategoriesSection | TickerSection;

export interface LandingGlobal {
    /** 'template' oppure chiave di FONT_PAIRINGS. */
    fontPairing: string;
    buttonShape: 'template' | 'square' | 'rounded' | 'pill';
    cardStyle: 'template' | 'flat' | 'bordered' | 'shadow';
    animation: 'off' | 'subtle' | 'lively';
    dividers: 'template' | 'none' | 'line' | 'wave';
    backToTop: boolean;
}

export interface LandingConfig {
    version: number;
    global: LandingGlobal;
    sections: LandingSection[];
}

// ─── Cataloghi per l'editor ───────────────────────────────────────────────────

export const SECTION_META: Record<SectionType, { label: string; description: string; single?: boolean }> = {
    hero:         { label: 'Intestazione (hero)', description: 'Foto, titolo e pulsanti in cima alla pagina' },
    announcement: { label: 'Barra avvisi',         description: 'Messaggio in evidenza sopra la pagina', single: true },
    about:        { label: 'Chi siamo',            description: 'La vostra storia con una foto' },
    gallery:      { label: 'Galleria foto',        description: 'Fino a 12 foto in griglia, mosaico o carosello' },
    features:     { label: 'Punti di forza',       description: 'Box con icona, titolo e sottotitolo' },
    highlights:   { label: 'Piatti in evidenza',   description: 'Scegli i piatti dal tuo menu' },
    categories:   { label: 'Menù (categorie)',     description: 'Le categorie del menu con link' },
    ticker:       { label: 'Striscia categorie',   description: 'Barra con i nomi delle categorie' },
    testimonials: { label: 'Recensioni',           description: 'Citazioni dei clienti con stelle' },
    hours:        { label: 'Orari',                description: 'Orari per giorno della settimana' },
    location:     { label: 'Dove siamo',           description: 'Indirizzo e link a Google Maps' },
    reservations: { label: 'Prenotazioni',         description: 'Modulo o pulsante per prenotare' },
    contact:      { label: 'Contatti e social',    description: 'Telefono, email, WhatsApp, social' },
    text:         { label: 'Testo libero',         description: 'Un titolo e un paragrafo' },
    video:        { label: 'Video',                description: 'Video di YouTube o Vimeo' },
};

export const SECTION_ORDER: SectionType[] = [
    'hero', 'announcement', 'about', 'gallery', 'features', 'highlights', 'categories', 'ticker',
    'testimonials', 'hours', 'location', 'reservations', 'contact', 'text', 'video',
];

export const WEEKDAYS = ['Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato', 'Domenica'];

export interface FontPairing { key: string; label: string; display: string; body: string }

/** Abbinamenti titoli/testo (chiavi di Utilities/fonts.ts). */
export const FONT_PAIRINGS: FontPairing[] = [
    { key: 'classico',    label: 'Classico — Playfair + Lato',        display: 'playfair',         body: 'lato' },
    { key: 'editoriale',  label: 'Editoriale — Cormorant + Inter',     display: 'cormorant',        body: 'inter' },
    { key: 'caldo',       label: 'Caldo — Lora + Nunito',              display: 'lora',             body: 'nunito' },
    { key: 'moderno',     label: 'Moderno — Poppins + DM Sans',        display: 'poppins',          body: 'dm-sans' },
    { key: 'insegna',     label: 'Insegna — Bebas Neue + Inter',       display: 'bebas-neue',       body: 'inter' },
    { key: 'urbano',      label: 'Urbano — Oswald + DM Sans',          display: 'oswald',           body: 'dm-sans' },
    { key: 'artigianale', label: 'Artigianale — Caveat + Lora',        display: 'caveat',           body: 'lora' },
    { key: 'street',      label: 'Street — Permanent Marker + Poppins', display: 'permanent-marker', body: 'poppins' },
];

export const DEFAULT_FEATURE_CARDS: FeatureCard[] = [
    { icon: 'leaf',       title: 'Ingredienti Freschi', sub: 'Selezionati ogni giorno' },
    { icon: 'chef-hat',   title: 'Ricette Originali',   sub: 'Chef di esperienza' },
    { icon: 'zap',        title: 'Servizio Rapido',     sub: 'Pronto in pochi minuti' },
    { icon: 'smartphone', title: 'Ordina dal Tavolo',   sub: 'Scansiona il QR' },
];

// ─── Default ──────────────────────────────────────────────────────────────────

export const DEFAULT_GLOBAL: LandingGlobal = {
    fontPairing: 'template',
    buttonShape: 'template',
    cardStyle: 'template',
    animation: 'subtle',
    dividers: 'template',
    backToTop: false,
};

export const defaultSectionStyle = (animation: AnimationKind = 'fade'): SectionStyle => ({
    bg: 'theme', bgColor: '', bgImage: null, bgOverlay: 0.5, spacing: 'normal', animation, titleAlign: 'template',
});

export const newSectionId = (type: SectionType): string =>
    `${type}-${Math.random().toString(36).slice(2, 10)}`;

const base = <T extends SectionType>(type: T, title = ''): Base<T> => ({
    id: newSectionId(type), type, enabled: true, title, eyebrow: '', style: defaultSectionStyle(),
});

/** Nuova sezione con contenuti di esempio sensati. */
export function newSection(type: SectionType): LandingSection {
    switch (type) {
        case 'hero': return {
            ...base('hero'), variant: 'image', subtitle: '', images: [], interval: 5,
            buttons: [{ label: 'Sfoglia il menù', action: 'menu', href: '' }, { label: 'Prenota un tavolo', action: 'reserve', href: '' }],
            showTakeaway: false, showFacts: true, overlayColor: '', overlayOpacity: null, align: 'template', height: 'large',
        };
        case 'about': return { ...base('about', 'La nostra storia'), text: '', image: null, imagePosition: 'left' };
        case 'gallery': return { ...base('gallery', 'Galleria'), items: [], layout: 'grid' };
        case 'features': return { ...base('features', 'Perché sceglierci'), items: DEFAULT_FEATURE_CARDS.map(f => ({ ...f })) };
        case 'highlights': return { ...base('highlights', 'I nostri piatti'), productIds: [], layout: 'cards', showPrices: true };
        case 'testimonials': return { ...base('testimonials', 'Dicono di noi'), items: [{ text: '', author: '', stars: 5 }] };
        case 'hours': return { ...base('hours', 'Orari di apertura'), days: WEEKDAYS.map(() => ({ closed: false, text: '' })), note: '' };
        case 'location': return { ...base('location', 'Dove siamo'), text: '', showMap: false };
        case 'reservations': return { ...base('reservations', 'Prenota un tavolo'), text: 'Compila il modulo: ti ricontattiamo per confermare.', mode: 'form' };
        case 'contact': return { ...base('contact', 'Contatti'), email: '', tripadvisorUrl: '', showHours: true };
        case 'announcement': return { ...base('announcement'), text: '', linkLabel: '', href: '', bgColor: '', textColor: '', style: defaultSectionStyle('none') };
        case 'text': return { ...base('text', ''), text: '' };
        case 'video': return { ...base('video', ''), videoUrl: '', caption: '' };
        case 'categories': return { ...base('categories', 'Il menù'), eyebrow: 'Dalla nostra cucina', showButton: true };
        case 'ticker': return { ...base('ticker'), style: defaultSectionStyle('none') };
    }
}

/** Copia con nuovo id (pulsante "Duplica"). */
export function duplicateSection(s: LandingSection): LandingSection {
    return { ...JSON.parse(JSON.stringify(s)), id: newSectionId(s.type) };
}

const cleanUrlish = (v: string | undefined) => (v && v !== 'DELETE' && !v.startsWith('blob:') ? v : '');

/**
 * Configurazione iniziale che riproduce il sito classico a partire dai campi storici:
 * chi non ha mai usato le sezioni non perde nulla quando inizia a modificarle.
 */
export function buildInitialConfig(style: Partial<StyleDto> | null | undefined): LandingConfig {
    const s: any = style || {};
    const keep = (sec: LandingSection): LandingSection => ({ ...sec, style: { ...sec.style, animation: 'none' } });
    const hero = newSection('hero') as HeroSection;
    const heroImg = cleanUrlish(s.heroImageUrl);
    const features = Array.isArray(s.features) && s.features.length ? s.features as FeatureCard[] : DEFAULT_FEATURE_CARDS;
    const sections: LandingSection[] = [
        keep({ ...hero, variant: 'template', images: heroImg ? [{ src: heroImg, alt: '' }] : [], showTakeaway: true }),
        { ...(newSection('ticker') as TickerSection), enabled: s.showTicker ?? true },
        keep({ ...(newSection('features') as FeaturesSection), title: s.sectionWhyTitle || '', items: features.map(f => ({ ...f })), enabled: s.showWhyUs ?? true }),
        keep({ ...(newSection('categories') as CategoriesSection), title: s.sectionMenuTitle || 'Il menù' }),
        keep({ ...(newSection('contact') as ContactSection), title: 'Dove siamo', eyebrow: 'Informazioni' }),
        keep({ ...(newSection('reservations') as ReservationsSection), title: s.sectionBookingTitle || 'Prenota un tavolo', eyebrow: 'Prenotazioni' }),
    ];
    // id stabili: la configurazione iniziale viene ricalcolata finché il ristoratore non la modifica
    return { version: LANDING_CONFIG_VERSION, global: { ...DEFAULT_GLOBAL }, sections: sections.map(x => ({ ...x, id: `${x.type}-1` })) };
}

// ─── Normalizzazione ──────────────────────────────────────────────────────────

const str = (v: unknown, max: number, fallback = ''): string =>
    typeof v === 'string' ? v.slice(0, max) : fallback;
const bool = (v: unknown, fallback: boolean): boolean => (typeof v === 'boolean' ? v : fallback);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
    (typeof v === 'string' && (allowed as readonly string[]).includes(v) ? v as T : fallback);
const num = (v: unknown, min: number, max: number, fallback: number): number =>
    (typeof v === 'number' && Number.isFinite(v) ? Math.max(min, Math.min(max, v)) : fallback);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const isObj = (v: unknown): v is Record<string, any> => !!v && typeof v === 'object' && !Array.isArray(v);

const image = (v: unknown): LandingImage | null => {
    if (!isObj(v) || typeof v.src !== 'string' || !v.src) return null;
    const out: LandingImage = { src: str(v.src, LIMITS.url), alt: str(v.alt, LIMITS.short) };
    if (typeof v.caption === 'string') out.caption = str(v.caption, LIMITS.short);
    return out;
};
const images = (v: unknown, max: number): LandingImage[] =>
    arr(v).map(image).filter((x): x is LandingImage => !!x).slice(0, max);

const SECTION_TYPES = Object.keys(SECTION_META) as SectionType[];
const ANIMS: AnimationKind[] = ['none', 'fade', 'slide-up', 'slide-side', 'zoom', 'stagger'];

function normalizeStyle(v: unknown, fallback: SectionStyle): SectionStyle {
    const o = isObj(v) ? v : {};
    return {
        bg: oneOf(o.bg, ['theme', 'primary', 'secondary', 'custom', 'image'] as const, fallback.bg),
        bgColor: str(o.bgColor, 7),
        bgImage: image(o.bgImage),
        bgOverlay: num(o.bgOverlay, 0, 0.9, fallback.bgOverlay),
        spacing: oneOf(o.spacing, ['compact', 'normal', 'airy'] as const, fallback.spacing),
        animation: oneOf(o.animation, ANIMS, fallback.animation),
        titleAlign: oneOf(o.titleAlign, ['template', 'left', 'center'] as const, fallback.titleAlign),
    };
}

function normalizeSection(v: unknown): LandingSection | null {
    if (!isObj(v) || !SECTION_TYPES.includes(v.type)) return null;
    const type = v.type as SectionType;
    const d: any = newSection(type);
    const id = typeof v.id === 'string' && /^[A-Za-z0-9_-]{1,40}$/.test(v.id) ? v.id : d.id;
    const common = {
        id, type, enabled: bool(v.enabled, true),
        title: str(v.title, LIMITS.title, ''), eyebrow: str(v.eyebrow, LIMITS.short, ''),
        style: normalizeStyle(v.style, d.style),
    };
    switch (type) {
        case 'hero': return {
            ...common, type,
            variant: oneOf(v.variant, ['template', 'image', 'split', 'slideshow', 'minimal'] as const, 'image'),
            subtitle: str(v.subtitle, LIMITS.subtitle),
            images: images(v.images, LIMITS.heroImages),
            interval: num(v.interval, 3, 15, 5),
            buttons: arr(v.buttons).filter(isObj).slice(0, LIMITS.heroButtons).map(b => ({
                label: str(b.label, LIMITS.label),
                action: oneOf(b.action, ['menu', 'reserve', 'call', 'whatsapp', 'link', 'takeaway'] as const, 'menu'),
                href: str(b.href, LIMITS.url),
            })),
            showTakeaway: bool(v.showTakeaway, false),
            showFacts: bool(v.showFacts, true),
            overlayColor: str(v.overlayColor, 7),
            overlayOpacity: v.overlayOpacity === null || v.overlayOpacity === undefined ? null : num(v.overlayOpacity, 0, 1, 0.6),
            align: oneOf(v.align, ['template', 'left', 'center'] as const, 'template'),
            height: oneOf(v.height, ['medium', 'large', 'full'] as const, 'large'),
        };
        case 'about': return {
            ...common, type, text: str(v.text, LIMITS.text), image: image(v.image),
            imagePosition: oneOf(v.imagePosition, ['left', 'right'] as const, 'left'),
        };
        case 'gallery': return {
            ...common, type, items: images(v.items, LIMITS.gallery),
            layout: oneOf(v.layout, ['grid', 'masonry', 'carousel'] as const, 'grid'),
        };
        case 'features': return {
            ...common, type,
            items: arr(v.items).filter(isObj).slice(0, LIMITS.features).map(f => ({
                icon: str(f.icon, 40), title: str(f.title, LIMITS.title), sub: str(f.sub, LIMITS.short),
            })),
        };
        case 'highlights': return {
            ...common, type,
            productIds: arr(v.productIds).filter((x): x is number => typeof x === 'number' && Number.isFinite(x)).slice(0, LIMITS.highlights),
            layout: oneOf(v.layout, ['cards', 'list'] as const, 'cards'),
            showPrices: bool(v.showPrices, true),
        };
        case 'testimonials': return {
            ...common, type,
            items: arr(v.items).filter(isObj).slice(0, LIMITS.testimonials).map(t => ({
                text: str(t.text, LIMITS.quote), author: str(t.author, LIMITS.author), stars: Math.round(num(t.stars, 1, 5, 5)),
            })),
        };
        case 'hours': {
            const days = arr(v.days).filter(isObj).slice(0, 7).map(x => ({ closed: bool(x.closed, false), text: str(x.text, LIMITS.dayText) }));
            while (days.length < 7) days.push({ closed: false, text: '' });
            return { ...common, type, days, note: str(v.note, LIMITS.short) };
        }
        case 'location': return { ...common, type, text: str(v.text, LIMITS.subtitle), showMap: bool(v.showMap, false) };
        case 'reservations': return { ...common, type, text: str(v.text, LIMITS.subtitle), mode: oneOf(v.mode, ['form', 'button'] as const, 'form') };
        case 'contact': return {
            ...common, type, email: str(v.email, LIMITS.author), tripadvisorUrl: str(v.tripadvisorUrl, LIMITS.url), showHours: bool(v.showHours, true),
        };
        case 'announcement': return {
            ...common, type, text: str(v.text, LIMITS.short), linkLabel: str(v.linkLabel, LIMITS.label), href: str(v.href, LIMITS.url),
            bgColor: str(v.bgColor, 7), textColor: str(v.textColor, 7),
        };
        case 'text': return { ...common, type, text: str(v.text, LIMITS.text) };
        case 'video': return { ...common, type, videoUrl: str(v.videoUrl, LIMITS.url), caption: str(v.caption, LIMITS.short) };
        case 'categories': return { ...common, type, showButton: bool(v.showButton, true) };
        case 'ticker': return { ...common, type };
    }
}

/**
 * Legge il config (oggetto dal backend/anteprima o stringa JSON) riempiendo i campi mancanti
 * e limitando liste e testi. null = nessun config valido → sito classico.
 * Non altera i link mentre si scrivono: la verifica di sicurezza avviene in rendering e al salvataggio.
 */
export function parseLandingConfig(raw: unknown): LandingConfig | null {
    let v: unknown = raw;
    if (typeof v === 'string') {
        if (!v.trim()) return null;
        try { v = JSON.parse(v); } catch { return null; }
    }
    if (!isObj(v) || v.version !== LANDING_CONFIG_VERSION || !Array.isArray(v.sections)) return null;
    const g = isObj(v.global) ? v.global : {};
    const pairingKeys = ['template', ...FONT_PAIRINGS.map(p => p.key)];
    const global: LandingGlobal = {
        fontPairing: oneOf(g.fontPairing, pairingKeys, 'template'),
        buttonShape: oneOf(g.buttonShape, ['template', 'square', 'rounded', 'pill'] as const, 'template'),
        cardStyle: oneOf(g.cardStyle, ['template', 'flat', 'bordered', 'shadow'] as const, 'template'),
        animation: oneOf(g.animation, ['off', 'subtle', 'lively'] as const, 'subtle'),
        dividers: oneOf(g.dividers, ['template', 'none', 'line', 'wave'] as const, 'template'),
        backToTop: bool(g.backToTop, false),
    };
    const seen = new Set<string>();
    const sections = v.sections.map(normalizeSection).filter((x): x is LandingSection => !!x).slice(0, LIMITS.sections)
        // id duplicati (JSON scritto a mano / vecchi salvataggi): chiavi React e modifiche finirebbero su due sezioni
        // (id deterministico: il config viene riletto a ogni render)
        .map((x, i) => {
            let id = x.id;
            for (let n = i; seen.has(id); n++) id = `${x.id.slice(0, 32)}-d${n}`;
            seen.add(id);
            return id === x.id ? x : { ...x, id };
        });
    return { version: LANDING_CONFIG_VERSION, global, sections };
}

// ─── Link sicuri ──────────────────────────────────────────────────────────────

const HEX = /^#[0-9a-f]{6}$/i;
export const validHex = (v: string | undefined | null): string => (v && HEX.test(v.trim()) ? v.trim() : '');

/** URL https valido (gli http vengono portati a https, senza schema si assume https). Altrimenti null. */
export function safeHttpsUrl(raw: string | undefined | null): string | null {
    let v = (raw || '').trim();
    if (!v) return null;
    if (/^http:\/\//i.test(v)) v = 'https://' + v.slice(7);
    else if (!/^[a-z][a-z0-9+.-]*:/i.test(v)) v = 'https://' + v.replace(/^\/+/, '');
    try {
        const u = new URL(v);
        if (u.protocol !== 'https:' || !u.hostname.includes('.')) return null;
        // Caratteri che il browser lascia nell'URL ma che java.net.URI (LandingConfigValidator) rifiuta
        return u.href.replace(/[{}|^`[\]]/g, ch => encodeURIComponent(ch));
    } catch {
        return null;
    }
}

/** Link per i pulsanti: https, tel: o mailto:. */
export function safeLinkHref(raw: string | undefined | null): string | null {
    const v = (raw || '').trim();
    if (/^tel:\+?[0-9 ()-]{3,20}$/i.test(v)) return 'tel:' + v.slice(4).replace(/[^\d+]/g, '');
    if (/^mailto:[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(v)) return v;
    return safeHttpsUrl(v);
}

export const telHref = (phone: string | undefined | null): string | null => {
    const digits = (phone || '').replace(/[^\d+]/g, '');
    return digits.replace(/\D/g, '').length >= 5 ? `tel:${digits}` : null;
};

export const whatsappHref = (n: string | undefined | null): string | null => {
    const digits = (n || '').replace(/\D/g, '');
    return digits.length >= 6 ? `https://wa.me/${digits}` : null;
};

export const mailHref = (email: string | undefined | null): string | null => {
    const v = (email || '').trim();
    return /^[^\s@<>"]+@[^\s@<>"]+\.[a-z]{2,}$/i.test(v) ? `mailto:${v}` : null;
};

export const mapsSearchUrl = (address: string): string =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

export const mapsEmbedUrl = (address: string): string =>
    `https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`;

/** Host video accettati dal backend (LandingConfigValidator.VIDEO_HOSTS). */
const VIDEO_HOSTS = [
    'youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtube-nocookie.com',
    'youtube-nocookie.com', 'vimeo.com', 'www.vimeo.com', 'player.vimeo.com',
];

/** Converte un link YouTube/Vimeo nell'indirizzo del player "privacy" (youtube-nocookie / vimeo dnt). */
export function toVideoEmbed(raw: string | undefined | null): string | null {
    const href = safeHttpsUrl(raw);
    if (!href) return null;
    const u = new URL(href);
    const host = u.hostname.replace(/^www\.|^m\./, '');
    const ytId = /^[A-Za-z0-9_-]{6,20}$/;
    let id: string | null = null;
    if (host === 'youtu.be') id = u.pathname.slice(1).split('/')[0];
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
        if (u.pathname === '/watch') id = u.searchParams.get('v');
        else {
            const m = /^\/(?:embed|shorts|live)\/([^/]+)/.exec(u.pathname);
            id = m ? m[1] : null;
        }
    }
    if (id) return ytId.test(id) ? `https://www.youtube-nocookie.com/embed/${id}` : null;
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
        const m = /\/(?:video\/)?(\d{5,12})(?:\/|$)/.exec(u.pathname);
        return m ? `https://player.vimeo.com/video/${m[1]}?dnt=1` : null;
    }
    return null;
}

/** Foto: percorso relativo del bucket o https; tutto il resto viene scartato. */
export const safeImageSrc = (src: string | undefined | null): string => {
    const v = (src || '').trim();
    if (!v) return '';
    if (v.startsWith('blob:')) return v; // anteprima locale nell'editor
    if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return /^https:\/\//i.test(v) ? v : '';
    return v;
};

/**
 * Ripulisce il config prima del salvataggio: colori non validi → vuoti, link non https → vuoti,
 * video non riconosciuti → vuoti. Così il backend non rifiuta il salvataggio per un campo a metà.
 */
export function cleanConfigForSave(config: LandingConfig): LandingConfig {
    const fixImg = (i: LandingImage | null): LandingImage | null => {
        if (!i) return null;
        const src = safeImageSrc(i.src);
        // il backend accetta solo percorsi senza ":" oppure https
        return src && !src.startsWith('blob:') && (!src.includes(':') || /^https:\/\//i.test(src)) ? { ...i, src } : null;
    };
    const fixImgs = (list: LandingImage[]) => list.map(fixImg).filter((x): x is LandingImage => !!x);
    const sections = config.sections.map((s): LandingSection => {
        const style: SectionStyle = { ...s.style, bgColor: validHex(s.style.bgColor), bgImage: fixImg(s.style.bgImage) };
        const c: any = { ...s, style };
        switch (s.type) {
            case 'hero':
                c.images = fixImgs(s.images);
                c.overlayColor = validHex(s.overlayColor);
                c.buttons = s.buttons.map(b => ({ ...b, href: b.action === 'link' ? (safeLinkHref(b.href) || '') : '' }));
                break;
            case 'about': c.image = fixImg(s.image); break;
            case 'gallery': c.items = fixImgs(s.items); break;
            case 'announcement':
                c.href = s.href ? (safeHttpsUrl(s.href) || '') : '';
                c.bgColor = validHex(s.bgColor);
                c.textColor = validHex(s.textColor);
                break;
            case 'contact': c.tripadvisorUrl = s.tripadvisorUrl ? (safeHttpsUrl(s.tripadvisorUrl) || '') : ''; break;
            case 'video': {
                // il backend accetta solo questi host: per gli altri (es. www.youtu.be) si salva il link del player
                const href = toVideoEmbed(s.videoUrl) ? safeHttpsUrl(s.videoUrl) : null;
                c.videoUrl = href ? (VIDEO_HOSTS.includes(new URL(href).hostname) ? href : (toVideoEmbed(href) || '')) : '';
                break;
            }
        }
        return c as LandingSection;
    });
    return { ...config, sections };
}

/** Dimensione in byte del JSON salvato (limite backend 200 KB). */
export const configByteSize = (config: LandingConfig): number =>
    new TextEncoder().encode(JSON.stringify(config)).length;
