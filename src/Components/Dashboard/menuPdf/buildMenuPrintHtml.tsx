import React from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import type { StyleDto } from '../../../types';
import { getMenuTokens, MenuTokens, tokensToCssVars, TEMPLATE_FONT_KEY } from '../../../Client/menuTheme';
import { MenuTemplateKey, parseTemplateValue, TEMPLATE_BY_KEY } from '../../../Client/menuTemplates';
import { buildGoogleFontsHref } from '../../../Utilities/fonts';
import { escapeHtml } from '../../../Utilities/Utilities';
import MenuPrintDocument from './MenuPrintDocument';
import type { MenuPdfOptions, PdfMenuData } from './menuPdfModel';

/**
 * Documento HTML completo (A4) del menu nello stile di un template. Viene caricato in un iframe
 * (anteprima nel dialog) e stampato col "Salva come PDF" del browser: niente librerie PDF,
 * il testo resta selezionabile e i font sono quelli veri del template.
 */

export interface BuildMenuPrintInput {
    /** Stile salvato (o bozza) del locale. */
    styles: StyleDto | null | undefined;
    /** Template con cui stampare. Se è quello in uso si tengono colori e ritocchi del ristoratore. */
    templateKey: MenuTemplateKey;
    menu: PdfMenuData;
    options: MenuPdfOptions;
    venueName: string;
    /** CSS dell'app (Tailwind + index.css) da copiare nel documento. */
    appCss: string;
    /** Fogli di stile esterni dell'app non leggibili via CSSOM. */
    appCssLinks?: string[];
    /** Prefisso per le immagini del bucket (process.env.REACT_APP_BUCKET_URL). */
    imageBase: string;
    /** Da React a HTML. Default: render sincrono in un nodo staccato (niente react-dom/server nel bundle). */
    renderMarkup?: (element: React.ReactElement) => string;
}

function renderDetached(element: React.ReactElement): string {
    const host = document.createElement('div');
    const root = createRoot(host);
    flushSync(() => root.render(element));
    const html = host.innerHTML;
    root.unmount();
    return html;
}

/**
 * Render in un nodo staccato aspettando il commit di React. flushSync su una root nuova non è affidabile
 * quando l'app ha già una root concorrente attiva (in sviluppo restituiva una stringa vuota → anteprima
 * e PDF bianchi): si attende il layout effect di un wrapper, con un limite di sicurezza.
 */
function renderDetachedAsync(element: React.ReactElement): Promise<string> {
    return new Promise(resolve => {
        const host = document.createElement('div');
        const root = createRoot(host);
        let done = false;
        const finish = () => {
            if (done) return;
            done = true;
            const html = host.innerHTML;
            setTimeout(() => root.unmount(), 0);
            resolve(html);
        };
        const Committed: React.FC<{ children: React.ReactNode }> = ({ children }) => {
            React.useLayoutEffect(() => { finish(); }, []);
            return <>{children}</>;
        };
        root.render(<Committed>{element}</Committed>);
        setTimeout(finish, 5000);
    });
}

/** Come buildMenuPrintHtml, ma con il render asincrono (da usare nel browser). */
export async function buildMenuPrintHtmlAsync(input: BuildMenuPrintInput): Promise<string> {
    const PLACEHOLDER = '<!--rf-menu-body-->';
    let captured: React.ReactElement | null = null;
    const shell = buildMenuPrintHtml({ ...input, renderMarkup: el => { captured = el; return PLACEHOLDER; } });
    const body = captured ? await renderDetachedAsync(captured) : '';
    return shell.replace(PLACEHOLDER, () => body);
}

/** Token del template scelto: quello in uso con i colori del locale, gli altri con la loro palette. */
export function printTokens(styles: StyleDto | null | undefined, templateKey: MenuTemplateKey) {
    const current = parseTemplateValue(styles?.landingTemplate).key;
    if (styles && current === templateKey) return getMenuTokens(styles);
    return getMenuTokens({ landingTemplate: templateKey, font: TEMPLATE_FONT_KEY } as StyleDto);
}

// ── Contrasto (stessa formula WCAG di menuTheme.ts) ─────────────────────────
function rgbOf(c: string): [number, number, number] {
    const m = c.match(/\d+(\.\d+)?/g);
    if (c.startsWith('rgb') && m && m.length >= 3) return [Number(m[0]), Number(m[1]), Number(m[2])];
    let h = c.replace('#', '');
    if (h.length === 3) h = h.split('').map(x => x + x).join('');
    return [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16) || 0) as [number, number, number];
}
function luminance(c: string): number {
    const [r, g, b] = rgbOf(c).map(v => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a: string, b: string): number {
    const [x, y] = [luminance(a), luminance(b)];
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
/** Soglia per usare l'accento come colore dei prezzi in stampa (testo normale, WCAG AA). */
export const PRINT_PRICE_CONTRAST = 4.5;

/**
 * Ritocchi di stampa sopra ai token del template (tutto il resto resta del template):
 * colore d'accento, abbinamento di font di un altro template, densità.
 */
export function applyPrintOverrides(tokens: MenuTokens, options: Pick<MenuPdfOptions, 'accent' | 'fontPair' | 'density'>): MenuTokens {
    let t = tokens;
    if (options.accent && /^#[0-9a-f]{6}$/i.test(options.accent)) {
        const accent = options.accent;
        // Testo sui pieni d'accento (bottoni, fasce): il più leggibile tra quelli della palette
        const accentText = [t.accentText, '#ffffff', t.text, t.bg]
            .reduce((best, c) => (contrast(c, accent) > contrast(best, accent) ? c : best));
        const emph = contrast(accent, t.bg) >= PRINT_PRICE_CONTRAST ? accent : t.text;
        t = { ...t, accent, accentText, emph };
    }
    if (options.fontPair && TEMPLATE_BY_KEY[options.fontPair]) {
        const f = TEMPLATE_BY_KEY[options.fontPair].fonts;
        t = {
            ...t,
            fontDisplay: f.display, fontBody: f.body, fontPrice: f.price || f.body, fontAccent: f.accent || f.display,
            fontsGoogle: f.google,
        };
    }
    if (options.density) t = { ...t, look: { ...t.look, density: options.density } };
    return t;
}

const PRINT_CSS = `
@page { size: A4; margin: 14mm 13mm 15mm; }
html, body, * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; font-size: 10pt; }
@media screen {
  html { background: #e5e7eb; }
  body { width: 210mm; min-height: 297mm; margin: 20px auto; padding: 14mm 13mm 15mm; box-sizing: border-box; box-shadow: 0 0 0 1px rgba(0,0,0,.08), 0 6px 24px rgba(0,0,0,.18); }
}
@media print {
  /* Fondo e texture stanno su @page (vedi pageCss) */
  body.menu-page { width: auto; background: none !important; }
}
p, h1, h2, h3, ol { margin: 0; }
.pdf-item { break-inside: avoid; page-break-inside: avoid; }
/* Senza contain, Chrome lascia in fondo alla pagina precedente schegge di elementi ruotati o con
   maschera (filetti a ornamento, tende noren…) quando il blocco passa alla pagina dopo. */
.pdf-item, .pdf-masthead, .pdf-cat-head { contain: paint; }
.pdf-masthead { padding-top: 10pt; }
.pdf-cat-head { break-after: avoid; page-break-after: avoid; break-inside: avoid; }
.pdf-category { margin-top: 18pt; }
.pdf-category:first-child { margin-top: 0; }
.pdf-cols { column-count: 2; column-gap: 11mm; }
.pdf-cols > .pdf-item { display: flex; }
.pdf-cols > .pdf-item--block { display: block; }
.pdf-legend { margin-top: 20pt; break-inside: avoid; page-break-inside: avoid; }
.pdf-legend-list { list-style: none; padding: 0; columns: 3; column-gap: 8mm; }
.pdf-legend-list > li { break-inside: avoid; }
img { max-width: 100%; }
`;

export function buildMenuPrintHtml(input: BuildMenuPrintInput): string {
    const { styles, templateKey, menu, options, venueName, appCss, appCssLinks = [], imageBase, renderMarkup = renderDetached } = input;
    const tokens = applyPrintOverrides(printTokens(styles, templateKey), options);
    const def = TEMPLATE_BY_KEY[templateKey];
    const vars = tokensToCssVars(tokens);
    const varsCss = Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';');

    const fontLinks: string[] = [];
    if (tokens.fontsGoogle.length) {
        fontLinks.push(`https://fonts.googleapis.com/css2?${tokens.fontsGoogle.map(f => `family=${f}`).join('&')}&display=swap`);
    }
    const userFont = (styles?.font || '').trim();
    if (!options.fontPair && tokens.template === parseTemplateValue(styles?.landingTemplate).key && userFont && userFont !== TEMPLATE_FONT_KEY) {
        const href = buildGoogleFontsHref([userFont]);
        if (href) fontLinks.push(href);
    }

    const sameTemplate = !!styles && parseTemplateValue(styles.landingTemplate).key === templateKey;
    const heroBg = (sameTemplate && styles?.heroBgColor) || def.palette.heroBg;
    const venueSub = [styles?.address, styles?.phone].map(s => (s || '').trim()).filter(Boolean).join('  ·  ');
    const logoUrl = styles?.logoUrl ? imageBase + styles.logoUrl : undefined;

    const body = renderMarkup(
        <MenuPrintDocument
            tokens={tokens}
            menu={menu}
            venueName={venueName}
            venueSub={venueSub || undefined}
            logoUrl={logoUrl}
            heroBg={heroBg}
            allergenStyle={options.allergenStyle}
            showAllergens={options.showAllergens !== false}
            columns={options.columns}
            lang={options.lang}
            imageBase={imageBase}
        />,
    );

    const links = [...appCssLinks, ...fontLinks].map(h => `<link rel="stylesheet" href="${escapeHtml(h)}">`).join('\n');
    // "</style" dentro il CSS chiuderebbe il tag in anticipo
    const safeCss = appCss.replace(/<\/style/gi, '<\\/style');
    // Fondo e texture della carta (index.css: `[data-menu-texture="x"] .menu-page {…}`) vanno anche su
    // @page: è l'unico sfondo che Chrome dipinge sui margini del foglio (pagina al vivo). Colori
    // letterali, perché in @page le variabili CSS del documento non arrivano.
    const texture = Array.from(safeCss.matchAll(/\[data-menu-texture="(\w+)"\]\s*\.menu-page\s*\{([^}]*)\}/g))
        .find(m => m[1] === tokens.look.texture)?.[2] ?? '';
    const pageCss = `@page { background-color: ${tokens.bg.replace(/[<>{};]/g, "")}; ${texture} }`;

    return `<!doctype html>
<html lang="${escapeHtml(options.lang)}" data-menu-template="${tokens.template}" data-menu-texture="${tokens.look.texture}" data-menu-dark="${tokens.isDark}" style="${escapeHtml(varsCss)}">
<head>
<meta charset="utf-8">
<title>${escapeHtml(`Menu - ${venueName}`)}</title>
${links}
<style>${safeCss}</style>
<style>${PRINT_CSS}</style>
<style>${pageCss}</style>
</head>
<body class="menu-page">
${body}
</body>
</html>`;
}
