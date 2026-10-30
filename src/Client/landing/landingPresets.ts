import type { MenuTemplateKey } from '../menuTemplates';
import type { FeatureCard } from '../../types';
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
const feats = (...items: [string, string, string][]): FeatureCard[] => items.map(([icon, title, sub]) => ({ icon, title, sub }));

export const LANDING_PRESETS: LandingPreset[] = [
    {
        key: 'pizzeria',
        label: 'Pizzeria',
        description: 'Foto a tutto schermo che scorrono, pizze in evidenza e recensioni. Vivace.',
        templateKey: 'pizzeria',
        global: { animation: 'lively', buttonShape: 'pill', cardStyle: 'shadow', dividers: 'none' },
        build: () => [
            sec('announcement', { enabled: false }),
            sec('hero', {
                variant: 'slideshow', height: 'full', align: 'center',
                buttons: [{ label: 'Sfoglia il menù', action: 'menu', href: '' }, { label: 'Chiama', action: 'call', href: '' }],
                showTakeaway: true, style: anim('zoom'),
            }),
            sec('ticker'),
            sec('highlights', { title: 'Le nostre pizze', eyebrow: 'Dal forno', layout: 'cards', style: anim('stagger') }),
            sec('features', {
                title: 'Perché da noi', style: { animation: 'stagger', bg: 'secondary' },
                items: feats(['flame', 'Forno a legna', 'Cottura tradizionale'], ['wheat', 'Impasto lento', 'Lievitazione lunga'], ['leaf', 'Ingredienti scelti', 'Freschi ogni giorno'], ['truck', 'Asporto', 'Ordina e ritira']),
            }),
            sec('gallery', { title: 'Dal nostro forno', layout: 'carousel', style: anim('slide-side') }),
            sec('testimonials', { title: 'Dicono di noi', items: [], style: anim('stagger') }),
            sec('hours', { style: anim('fade') }),
            sec('reservations', { style: anim('slide-up') }),
            sec('location', { style: anim('fade') }),
            sec('contact', { title: 'Contatti', style: anim('fade') }),
        ],
    },
    {
        key: 'trattoria',
        label: 'Trattoria / Osteria',
        description: 'Testata classica, la vostra storia, i piatti della casa e il modulo per prenotare.',
        templateKey: 'trattoria',
        global: { animation: 'subtle', buttonShape: 'template', cardStyle: 'bordered', dividers: 'template' },
        build: () => [
            sec('hero', { variant: 'template', showTakeaway: false, style: anim('fade') }),
            sec('about', { title: 'La nostra storia', imagePosition: 'left', style: anim('slide-up') }),
            sec('highlights', { title: 'I piatti della casa', layout: 'list', style: anim('stagger') }),
            sec('features', {
                title: 'Come una volta', style: anim('stagger'),
                items: feats(['chef-hat', 'Cucina di casa', 'Ricette di famiglia'], ['wheat', 'Pasta fresca', 'Tirata a mano'], ['wine', 'Vini del territorio', 'Selezione curata'], ['heart', 'Accoglienza', 'Come a casa']),
            }),
            sec('gallery', { title: 'La trattoria', layout: 'grid', style: anim('stagger') }),
            sec('categories', { style: anim('fade') }),
            sec('hours', { style: anim('fade') }),
            sec('reservations', { style: anim('slide-up') }),
            sec('contact', { title: 'Dove siamo', eyebrow: 'Informazioni', style: anim('fade') }),
        ],
    },
    {
        key: 'sushi',
        label: 'Sushi / Etnico',
        description: 'Foto e testo affiancati, linee pulite, galleria a mosaico.',
        templateKey: 'sushi',
        global: { animation: 'subtle', buttonShape: 'square', cardStyle: 'flat', dividers: 'line' },
        build: () => [
            sec('hero', { variant: 'split', height: 'large', style: anim('slide-up') }),
            sec('highlights', { title: 'Selezione dello chef', layout: 'cards', style: anim('stagger') }),
            sec('gallery', { title: 'Galleria', layout: 'masonry', style: anim('stagger') }),
            sec('about', { title: 'La nostra cucina', imagePosition: 'right', style: anim('slide-side') }),
            sec('features', {
                title: 'Il nostro metodo', style: anim('stagger'),
                items: feats(['fish', 'Pesce selezionato', 'Qualità ogni giorno'], ['chef-hat', 'Mani esperte', 'Preparato al momento'], ['leaf', 'Ingredienti freschi', 'Gusto autentico'], ['shopping-bag', 'Da asporto', 'Ordina e ritira']),
            }),
            sec('categories', { style: anim('fade') }),
            sec('reservations', { style: anim('fade') }),
            sec('hours', { style: anim('fade') }),
            sec('contact', { style: anim('fade') }),
        ],
    },
    {
        key: 'cocktail',
        label: 'Cocktail bar',
        description: 'Atmosfera serale: foto piena, cocktail in elenco, recensioni e serate.',
        templateKey: 'cocktail',
        global: { animation: 'lively', buttonShape: 'pill', cardStyle: 'shadow', dividers: 'none', backToTop: true },
        build: () => [
            sec('announcement', { enabled: false }),
            sec('hero', {
                variant: 'image', height: 'full', align: 'center', overlayOpacity: 0.55,
                buttons: [{ label: 'La drink list', action: 'menu', href: '' }, { label: 'Prenota un tavolo', action: 'reserve', href: '' }],
                style: anim('fade'),
            }),
            sec('about', { title: 'Il bar', imagePosition: 'right', style: { animation: 'slide-up', bg: 'secondary', spacing: 'airy' } }),
            sec('highlights', { title: 'Signature cocktail', layout: 'list', style: anim('stagger') }),
            sec('gallery', { title: 'Le nostre serate', layout: 'masonry', style: anim('zoom') }),
            sec('testimonials', { title: 'Dicono di noi', items: [], style: anim('stagger') }),
            sec('hours', { style: anim('fade') }),
            sec('reservations', { style: anim('slide-up') }),
            sec('location', { style: anim('fade') }),
            sec('contact', { title: 'Seguici', style: anim('fade') }),
        ],
    },
    {
        key: 'fine',
        label: 'Fine dining',
        description: 'Essenziale ed elegante: solo testo in apertura, ampi spazi, foto in carosello.',
        templateKey: 'luxury',
        global: { animation: 'subtle', buttonShape: 'square', cardStyle: 'flat', dividers: 'template' },
        build: () => [
            sec('hero', { variant: 'minimal', height: 'large', align: 'center', buttons: [{ label: 'Prenota', action: 'reserve', href: '' }, { label: 'Il menù', action: 'menu', href: '' }], style: anim('fade') }),
            sec('about', { title: 'La filosofia', imagePosition: 'right', style: { animation: 'fade', spacing: 'airy' } }),
            sec('gallery', { title: '', layout: 'carousel', style: { animation: 'fade', spacing: 'airy' } }),
            sec('video', { style: anim('fade') }),
            sec('testimonials', { title: 'Recensioni', items: [], style: anim('fade') }),
            sec('reservations', { style: { animation: 'fade', spacing: 'airy' } }),
            sec('location', { style: anim('fade') }),
            sec('contact', { style: anim('fade') }),
        ],
    },
    {
        key: 'caffe',
        label: 'Caffetteria / Brunch',
        description: 'Caldo e luminoso: colazioni e brunch in evidenza, orari e mappa.',
        templateKey: 'caffe',
        global: { animation: 'subtle', buttonShape: 'rounded', cardStyle: 'shadow', dividers: 'wave', fontPairing: 'caldo' },
        build: () => [
            sec('hero', { variant: 'split', height: 'large', style: anim('slide-up') }),
            sec('features', {
                title: 'Buongiorno!', style: anim('stagger'),
                items: feats(['coffee', 'Caffè speciali', 'Tostatura selezionata'], ['croissant', 'Dolci del giorno', 'Sfornati al mattino'], ['leaf', 'Brunch', 'Dolce e salato'], ['clock', 'Aperti presto', 'Dalla colazione']),
            }),
            sec('highlights', { title: 'Colazioni e brunch', layout: 'cards', style: anim('stagger') }),
            sec('gallery', { title: 'Il locale', layout: 'grid', style: anim('stagger') }),
            sec('hours', { style: anim('fade') }),
            sec('location', { showMap: false, style: anim('fade') }),
            sec('contact', { style: anim('fade') }),
        ],
    },
];

/** Campi di impaginazione decisi dal modello (i contenuti invece restano quelli del locale). */
const LAYOUT_KEYS: Partial<Record<SectionType, string[]>> = {
    hero: ['variant', 'height', 'align', 'showTakeaway'],
    gallery: ['layout'],
    highlights: ['layout'],
    about: ['imagePosition'],
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
