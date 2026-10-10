/**
 * Menu theme token system.
 *
 * Il template scelto (`StyleDto.landingTemplate`, vedi `menuTemplates.ts`)
 * fornisce palette, font e "look" (filetti, puntini, numerazione, texture…).
 *
 * I token sono iniettati come CSS custom properties su un elemento wrapper
 * (MenuThemeProvider) così ogni pagina cliente (Categories, Products, Cart, …)
 * li consuma via `var(--menu-bg)` ecc.
 *
 * I colori salvati dal ristoratore (primary, cardBackground, textTitle,
 * textBody, backgroundGradient[0]) hanno la precedenza sulla palette del
 * template: scegliere un template dalla dashboard applica la sua palette a
 * quei campi, poi il ristoratore può ritoccarli dal tab "Colori".
 */

import type { StyleDto } from '../types';
import { FONT_BY_KEY } from '../Utilities/fonts';
import { getTemplateDef, MenuTemplateDef, MenuTemplateKey, TemplateLook } from './menuTemplates';

export type { MenuTemplateKey } from './menuTemplates';

export interface MenuTokens {
    template: MenuTemplateKey;
    look: TemplateLook;
    /** Toggle dashboard "Mostra immagini nelle card". */
    showImages: boolean;
    bg: string;
    surface: string;
    card: string;
    cardHover: string;
    text: string;
    muted: string;
    accent: string;
    accentText: string;
    /** Accento usabile come colore di testo sul fondo (accento se leggibile, altrimenti testo). */
    emph: string;
    secondary: string;
    secondaryText: string;
    border: string;
    /** Colore dei filetti / puntini (più marcato di `border`). */
    rule: string;
    inputBg: string;
    inputBorder: string;
    inputText: string;
    inputPlaceholder: string;
    fontDisplay: string;
    fontBody: string;
    fontPrice: string;
    radius: string;
    // Hero gradient overlay (rgba) — derived from bg so the hero image fades into the page bg.
    heroGradient: string;
    // Indicates the theme is dark (consumers can adjust e.g. shimmer opacity).
    isDark: boolean;
    fontAccent?: string;
}

// cardStyle: 'soft' è il valore storico di default → significa "usa il raggio del template".
const RADIUS_OVERRIDE: Record<string, string> = {
    rounded: '18px',
    sharp: '0px',
};

/** Font "dell'abbinamento del template" (nessun override). */
export const TEMPLATE_FONT_KEY = 'template';

// ─── Public API ───────────────────────────────────────────────────────────────

export function getMenuTokens(styles: StyleDto | null | undefined): MenuTokens {
    const def: MenuTemplateDef = getTemplateDef(styles?.landingTemplate);
    const p = def.palette;

    // Apply user overrides from existing StyleDto fields when present.
    const accent = (styles?.primary || '').trim() || p.accent;
    const card = (styles?.cardBackground || '').trim() || p.card;
    const text = (styles?.textTitle || '').trim() || p.text;
    const muted = (styles?.textBody || '').trim() || p.muted;
    const accentText = (styles?.textOnPrimary || '').trim() || p.accentText;
    const secondary = ((styles as any)?.secondaryColor || '').trim() || p.secondary;
    const secondaryText = ((styles as any)?.secondaryTextColor || '').trim() || p.secondaryText;
    const bg = (typeof styles?.backgroundGradient === 'string'
        ? (styles.backgroundGradient as any).split(';')[0]
        : styles?.backgroundGradient?.[0])?.trim() || p.bg;

    const cardStyle = (styles?.cardStyle || '') as string;
    const radius = RADIUS_OVERRIDE[cardStyle] ?? `${def.look.radius}px`;

    // Font scelto dalla dashboard (chiave del catalogo Utilities/fonts.ts).
    // 'template', vuoto o sconosciuto → abbinamento del template.
    const fontKey = (styles?.font || '').trim();
    const fontOpt = fontKey && fontKey !== TEMPLATE_FONT_KEY ? FONT_BY_KEY[fontKey] : undefined;
    const fontBody    = fontOpt?.family || def.fonts.body;
    const fontDisplay = fontOpt?.family || def.fonts.display;
    const fontPrice   = fontOpt?.family || def.fonts.price || def.fonts.body;

    // ── Derived tokens ──────────────────────────────────────────────────────
    // Capiamo se la palette è chiara o scura guardando la luminanza del fondo
    // pagina e costruiamo surface/input/border coerenti.
    const userIsDark = relativeLuminance(bg) < 0.35;
    const surface       = blendColors(bg, userIsDark ? '#ffffff' : '#000000', 0.04);
    const cardHover     = blendColors(card, userIsDark ? '#ffffff' : '#000000', 0.05);
    const border        = userIsDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
    const rule          = blendColors(bg, text, 0.38);
    const emph          = contrastRatio(accent, bg) >= 3.2 ? accent : text;
    const inputBg       = userIsDark ? 'rgba(255,255,255,0.06)' : blendColors(card, '#000000', 0.03);
    const inputBorder   = userIsDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.18)';

    return {
        template: def.key,
        look: def.look,
        showImages: styles?.showImages !== false,
        bg,
        surface,
        card,
        cardHover,
        text,
        muted,
        accent,
        accentText,
        emph,
        secondary,
        secondaryText,
        border,
        rule,
        inputBg,
        inputBorder,
        inputText: text,
        inputPlaceholder: muted,
        radius,
        fontBody,
        fontDisplay,
        fontPrice,
        isDark: userIsDark,
        heroGradient: buildHeroGradient(bg, userIsDark),
    };
}

// ── Color utils ───────────────────────────────────────────────────────────────

function relativeLuminance(hex: string): number {
    const [r, g, b] = hexToRgbArr(hex);
    // sRGB → linear, poi formula WCAG semplificata
    const toLin = (c: number) => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
}

function contrastRatio(a: string, b: string): number {
    const la = relativeLuminance(a);
    const lb = relativeLuminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

function blendColors(base: string, with_: string, amount: number): string {
    const [r1, g1, b1] = hexToRgbArr(base);
    const [r2, g2, b2] = hexToRgbArr(with_);
    const a = Math.max(0, Math.min(1, amount));
    const r = Math.round(r1 + (r2 - r1) * a);
    const g = Math.round(g1 + (g2 - g1) * a);
    const b = Math.round(b1 + (b2 - b1) * a);
    return `rgb(${r}, ${g}, ${b})`;
}

function hexToRgbArr(input: string): [number, number, number] {
    if (!input) return [0, 0, 0];
    if (input.startsWith('rgb')) {
        const m = input.match(/\d+/g);
        if (m && m.length >= 3) return [Number(m[0]), Number(m[1]), Number(m[2])];
    }
    const cleaned = input.replace('#', '');
    if (cleaned.length === 3) {
        return [
            parseInt(cleaned[0] + cleaned[0], 16),
            parseInt(cleaned[1] + cleaned[1], 16),
            parseInt(cleaned[2] + cleaned[2], 16),
        ];
    }
    if (cleaned.length === 6) {
        return [
            parseInt(cleaned.substring(0, 2), 16),
            parseInt(cleaned.substring(2, 4), 16),
            parseInt(cleaned.substring(4, 6), 16),
        ];
    }
    return [0, 0, 0];
}

function buildHeroGradient(bg: string, isDark: boolean): string {
    // The original hardcoded gradient used the dark menu bg. Replicate that with the user's bg.
    // For non-dark themes we keep the top of the image more visible.
    const stop1 = isDark ? '0.95' : '0.88';
    const stop2 = isDark ? '0.4'  : '0.35';
    const stop3 = isDark ? '0.15' : '0.05';
    const rgb = hexToRgbTuple(bg);
    return `linear-gradient(to top, rgba(${rgb},${stop1}) 0%, rgba(${rgb},${stop2}) 55%, rgba(${rgb},${stop3}) 100%)`;
}

function hexToRgbTuple(hex: string): string {
    const cleaned = hex.replace('#', '');
    if (cleaned.length === 3) {
        const r = parseInt(cleaned[0] + cleaned[0], 16);
        const g = parseInt(cleaned[1] + cleaned[1], 16);
        const b = parseInt(cleaned[2] + cleaned[2], 16);
        return `${r},${g},${b}`;
    }
    if (cleaned.length === 6) {
        const r = parseInt(cleaned.substring(0, 2), 16);
        const g = parseInt(cleaned.substring(2, 4), 16);
        const b = parseInt(cleaned.substring(4, 6), 16);
        return `${r},${g},${b}`;
    }
    return '23,20,15';
}

export function tokensToCssVars(t: MenuTokens): Record<string, string> {
    const l = t.look;
    return {
        '--menu-bg':              t.bg,
        '--menu-surface':         t.surface,
        '--menu-card':            t.card,
        '--menu-card-hover':      t.cardHover,
        '--menu-text':            t.text,
        '--menu-muted':           t.muted,
        '--menu-accent':          t.accent,
        '--menu-accent-text':     t.accentText,
        '--menu-emph':            t.emph,
        '--menu-secondary':       t.secondary,
        '--menu-secondary-text':  t.secondaryText,
        '--menu-border':          t.border,
        '--menu-rule':            t.rule,
        '--menu-input-bg':        t.inputBg,
        '--menu-input-border':    t.inputBorder,
        '--menu-input-text':      t.inputText,
        '--menu-input-placeholder': t.inputPlaceholder,
        '--menu-font-display':    t.fontDisplay,
        '--menu-font-body':       t.fontBody,
        '--menu-font-price':      t.fontPrice,
        '--menu-font-accent':     t.fontAccent || t.fontDisplay,
        '--menu-radius':          t.radius,
        '--menu-hero-gradient':   t.heroGradient,
        '--menu-h-transform':     l.headingCase === 'uppercase' ? 'uppercase' : 'none',
        '--menu-h-caps':          l.headingCase === 'smallcaps' ? 'all-small-caps' : 'normal',
        '--menu-h-style':         l.headingStyle,
        '--menu-h-weight':        String(l.headingWeight),
        '--menu-h-tracking':      l.headingTracking,
        '--menu-h-align':         l.align,
        '--c-accent':             t.accent,
    };
}
