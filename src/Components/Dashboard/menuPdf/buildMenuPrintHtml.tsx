import React from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import type { StyleDto } from '../../../types';
import { getMenuTokens, tokensToCssVars, TEMPLATE_FONT_KEY } from '../../../Client/menuTheme';
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

/** Token del template scelto: quello in uso con i colori del locale, gli altri con la loro palette. */
export function printTokens(styles: StyleDto | null | undefined, templateKey: MenuTemplateKey) {
    const current = parseTemplateValue(styles?.landingTemplate).key;
    if (styles && current === templateKey) return getMenuTokens(styles);
    return getMenuTokens({ landingTemplate: templateKey, font: TEMPLATE_FONT_KEY } as StyleDto);
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
.pdf-legend { margin-top: 20pt; break-inside: avoid; page-break-inside: avoid; }
.pdf-legend-list { list-style: none; padding: 0; columns: 3; column-gap: 8mm; }
.pdf-legend-list > li { break-inside: avoid; }
img { max-width: 100%; }
`;

export function buildMenuPrintHtml(input: BuildMenuPrintInput): string {
    const { styles, templateKey, menu, options, venueName, appCss, appCssLinks = [], imageBase, renderMarkup = renderDetached } = input;
    const tokens = printTokens(styles, templateKey);
    const def = TEMPLATE_BY_KEY[templateKey];
    const vars = tokensToCssVars(tokens);
    const varsCss = Object.entries(vars).map(([k, v]) => `${k}:${v}`).join(';');

    const fontLinks: string[] = [];
    if (tokens.fontsGoogle.length) {
        fontLinks.push(`https://fonts.googleapis.com/css2?${tokens.fontsGoogle.map(f => `family=${f}`).join('&')}&display=swap`);
    }
    const userFont = (styles?.font || '').trim();
    if (tokens.template === parseTemplateValue(styles?.landingTemplate).key && userFont && userFont !== TEMPLATE_FONT_KEY) {
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
