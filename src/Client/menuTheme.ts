/**
 * Menu theme token system.
 *
 * Each landing template ('default' | 'minimal' | 'luxury' | 'strafame') maps
 * to a "menu look": background, surface, card, text colors, fonts, radius.
 *
 * Tokens are injected as CSS custom properties on a wrapping element so any
 * descendant page (Categories, Products, Cart, …) can consume them via
 * `var(--menu-bg)` etc. — no per-page conditional rendering needed.
 *
 * The user's existing StyleDto fields (primary, cardBackground, textTitle,
 * textBody, backgroundGradient[0]) override the preset when present, so the
 * dashboard "Colori" tab already personalizes the menu without new backend fields.
 */

import type { StyleDto } from '../types';
import { FONT_BY_KEY } from '../Utilities/fonts';

export type MenuTemplateKey = 'default' | 'minimal' | 'luxury' | 'strafame';

export interface MenuTokens {
    bg: string;
    surface: string;
    card: string;
    cardHover: string;
    text: string;
    muted: string;
    accent: string;
    accentText: string;
    secondary: string;
    secondaryText: string;
    border: string;
    inputBg: string;
    inputBorder: string;
    inputText: string;
    inputPlaceholder: string;
    fontDisplay: string;
    fontBody: string;
    radius: string;
    // Hero gradient overlay (rgba) — derived from bg so the hero image fades into the page bg.
    heroGradient: string;
    // Indicates the theme is dark (consumers can adjust e.g. shimmer opacity).
    isDark: boolean;
    // Stylized name for special accents (e.g. Strafame uses Permanent Marker).
    fontAccent?: string;
}

const RADIUS_BY_STYLE: Record<NonNullable<StyleDto['cardStyle']>, string> = {
    soft: '16px',
    rounded: '24px',
    sharp: '4px',
};

// ─── Presets ──────────────────────────────────────────────────────────────────

// Current production "dark menu" look. Keeps existing pages visually identical
// when the template is 'default' (no surprise regressions).
const PRESET_DEFAULT: MenuTokens = {
    bg:             '#17140f',
    surface:        '#1e1b15',
    card:           '#25211a',
    cardHover:      '#2f2a21',
    text:           '#ede8da',
    muted:          '#8a7d6a',
    accent:         '#f97316',
    accentText:     '#ffffff',
    secondary:      '#2f2a21',
    secondaryText:  '#ede8da',
    border:         'rgba(255,255,255,0.07)',
    inputBg:        'rgba(255,255,255,0.06)',
    inputBorder:    'rgba(255,255,255,0.1)',
    inputText:      '#ede8da',
    inputPlaceholder: '#5a5048',
    fontDisplay:    '"Cormorant Garamond", Georgia, serif',
    fontBody:       'Nunito, ui-sans-serif, sans-serif',
    // (defaults sotto sostituiscono per ogni preset; ripetuti per chiarezza)
    radius:         '16px',
    heroGradient:   'linear-gradient(to top, rgba(23,20,15,0.95) 0%, rgba(23,20,15,0.4) 55%, rgba(23,20,15,0.15) 100%)',
    isDark:         true,
};

const PRESET_MINIMAL: MenuTokens = {
    bg:             '#ffffff',
    surface:        '#f9fafb',
    card:           '#ffffff',
    cardHover:      '#f3f4f6',
    text:           '#0f172a',
    muted:          '#64748b',
    accent:         '#f97316',
    accentText:     '#ffffff',
    secondary:      '#f3f4f6',
    secondaryText:  '#0f172a',
    border:         'rgba(15,23,42,0.08)',
    inputBg:        '#f9fafb',
    inputBorder:    'rgba(15,23,42,0.1)',
    inputText:      '#0f172a',
    inputPlaceholder: '#94a3b8',
    fontDisplay:    '"DM Sans", ui-sans-serif, system-ui, sans-serif',
    fontBody:       '"DM Sans", ui-sans-serif, system-ui, sans-serif',
    radius:         '12px',
    heroGradient:   'linear-gradient(to top, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.4) 55%, rgba(255,255,255,0.0) 100%)',
    isDark:         false,
};

const PRESET_LUXURY: MenuTokens = {
    bg:             '#000000',
    surface:        '#0a0a0a',
    card:           '#111111',
    cardHover:      '#1a1a1a',
    text:           '#ffffff',
    muted:          '#9ca3af',
    accent:         '#c9a84c',
    accentText:     '#000000',
    secondary:      '#1a1a1a',
    secondaryText:  '#ffffff',
    border:         'rgba(255,255,255,0.06)',
    inputBg:        'rgba(255,255,255,0.04)',
    inputBorder:    'rgba(255,255,255,0.08)',
    inputText:      '#ffffff',
    inputPlaceholder: '#4b5563',
    fontDisplay:    '"Cormorant Garamond", Georgia, serif',
    fontBody:       '"DM Sans", ui-sans-serif, sans-serif',
    radius:         '4px',
    heroGradient:   'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.4) 55%, rgba(0,0,0,0.05) 100%)',
    isDark:         true,
};

const PRESET_STRAFAME: MenuTokens = {
    bg:             '#ffffff',
    surface:        '#f3f4f6',
    card:           '#ffffff',
    cardHover:      '#f9fafb',
    text:           '#0e0e0e',
    muted:          '#6b7280',
    accent:         '#00AEEF',
    accentText:     '#ffffff',
    secondary:      '#0e0e0e',
    secondaryText:  '#ffffff',
    border:         'rgba(14,14,14,0.08)',
    inputBg:        '#f9fafb',
    inputBorder:    'rgba(14,14,14,0.1)',
    inputText:      '#0e0e0e',
    inputPlaceholder: '#9ca3af',
    fontDisplay:    'Oswald, "DM Sans", ui-sans-serif, sans-serif',
    fontBody:       'Barlow, "DM Sans", ui-sans-serif, sans-serif',
    radius:         '18px',
    heroGradient:   'linear-gradient(to top, rgba(14,14,14,0.85) 0%, rgba(14,14,14,0.35) 55%, rgba(14,14,14,0.05) 100%)',
    isDark:         false,
    fontAccent:     '"Permanent Marker", cursive',
};

const PRESETS: Record<MenuTemplateKey, MenuTokens> = {
    default:  PRESET_DEFAULT,
    minimal:  PRESET_MINIMAL,
    luxury:   PRESET_LUXURY,
    strafame: PRESET_STRAFAME,
};

// ─── Public API ───────────────────────────────────────────────────────────────

export function getMenuTokens(styles: StyleDto | null | undefined): MenuTokens {
    const template = (styles?.landingTemplate as MenuTemplateKey) || 'default';
    const preset = PRESETS[template] ?? PRESET_DEFAULT;

    // Apply user overrides from existing StyleDto fields when present.
    const accent = (styles?.primary || '').trim() || preset.accent;
    const card = (styles?.cardBackground || '').trim() || preset.card;
    const text = (styles?.textTitle || '').trim() || preset.text;
    const muted = (styles?.textBody || '').trim() || preset.muted;
    const accentText = (styles?.textOnPrimary || '').trim() || preset.accentText;
    const secondary = ((styles as any)?.secondaryColor || '').trim() || preset.secondary;
    const secondaryText = ((styles as any)?.secondaryTextColor || '').trim() || preset.secondaryText;
    const bg = (typeof styles?.backgroundGradient === 'string'
        ? (styles.backgroundGradient as any).split(';')[0]
        : styles?.backgroundGradient?.[0])?.trim() || preset.bg;

    const cardStyle = styles?.cardStyle as keyof typeof RADIUS_BY_STYLE | undefined;
    const radius = cardStyle && RADIUS_BY_STYLE[cardStyle] ? RADIUS_BY_STYLE[cardStyle] : preset.radius;

    // Font scelto dalla dashboard (chiave del catalogo Utilities/fonts.ts).
    // Se non specificato o sconosciuto si lascia il font del preset.
    const fontKey = (styles?.font || '').trim();
    const fontOpt = fontKey ? FONT_BY_KEY[fontKey] : undefined;
    const fontBody    = fontOpt?.family || preset.fontBody;
    const fontDisplay = fontOpt?.family || preset.fontDisplay;

    // ── Derived tokens ──────────────────────────────────────────────────────
    // Capiamo se la palette dell'utente è chiara o scura guardando la luminanza
    // del card background. Da qui costruiamo surface/input/border coerenti
    // — altrimenti restano "incollati" al preset originale e stonano (es. box
    // "Asporto — Dati di contatto" che resta scura su tema chiaro).
    const userIsDark = relativeLuminance(card) < 0.45;
    const surface       = blendColors(bg, userIsDark ? '#ffffff' : '#000000', userIsDark ? 0.04 : 0.04);
    const cardHover     = blendColors(card, userIsDark ? '#ffffff' : '#000000', userIsDark ? 0.05 : 0.05);
    const border        = userIsDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)';
    const inputBg       = userIsDark ? 'rgba(255,255,255,0.06)' : blendColors(card, '#000000', 0.04);
    const inputBorder   = userIsDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)';
    const inputText     = text;
    const inputPlaceholder = muted;

    return {
        ...preset,
        bg,
        surface,
        card,
        cardHover,
        text,
        muted,
        accent,
        accentText,
        secondary,
        secondaryText,
        border,
        inputBg,
        inputBorder,
        inputText,
        inputPlaceholder,
        radius,
        fontBody,
        fontDisplay,
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
    return {
        '--menu-bg':              t.bg,
        '--menu-surface':         t.surface,
        '--menu-card':            t.card,
        '--menu-card-hover':      t.cardHover,
        '--menu-text':            t.text,
        '--menu-muted':           t.muted,
        '--menu-accent':          t.accent,
        '--menu-accent-text':     t.accentText,
        '--menu-secondary':       t.secondary,
        '--menu-secondary-text':  t.secondaryText,
        '--menu-border':          t.border,
        '--menu-input-bg':        t.inputBg,
        '--menu-input-border':    t.inputBorder,
        '--menu-input-text':      t.inputText,
        '--menu-input-placeholder': t.inputPlaceholder,
        '--menu-font-display':    t.fontDisplay,
        '--menu-font-body':       t.fontBody,
        '--menu-font-accent':     t.fontAccent || t.fontDisplay,
        '--menu-radius':          t.radius,
        '--menu-hero-gradient':   t.heroGradient,
        '--c-accent':             t.accent,
    };
}
