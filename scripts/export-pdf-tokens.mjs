#!/usr/bin/env node
/**
 * Esporta i token "da PDF" di tutti i template del menu in un JSON leggibile da macchina:
 *   src/Components/Dashboard/menuPdf/pdfTokens.generated.json
 *
 * Fonte unica: src/Client/menuTemplates.ts (palette, font, look). Il JSON serve all'app mobile
 * (DigitalmenuApp/src/utils/menuPdfTemplates.ts) per riallinearsi in automatico: nessuna tabella
 * di stili copiata a mano.
 *
 * Controlla anche il contrasto WCAG AA di ogni palette (testo, testo secondario, prezzi, bottoni,
 * fasce): se un template scende sotto la soglia lo segnala ed esce con codice 1.
 *
 * Uso:  npm run export:pdf-tokens          (scrive il JSON)
 *       npm run export:pdf-tokens -- --check (solo verifica, non scrive)
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import ts from 'typescript';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(root, 'src/Client/menuTemplates.ts');
const OUT = path.join(root, 'src/Components/Dashboard/menuPdf/pdfTokens.generated.json');
const checkOnly = process.argv.includes('--check');

// menuTemplates.ts non importa nulla: basta togliere i tipi e importarlo.
const js = ts.transpileModule(fs.readFileSync(SRC, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText;
const tmp = path.join(os.tmpdir(), `menuTemplates-${process.pid}-${Date.now()}.mjs`);
fs.writeFileSync(tmp, js);
const mod = await import(pathToFileURL(tmp).href);
fs.unlinkSync(tmp);

const { MENU_TEMPLATES, TEMPLATE_BY_KEY, buildTemplateFontsHref } = mod;

// ── Contrasto (stessa formula di menuTheme.ts) ──────────────────────────────
const rgb = hex => {
    const c = hex.replace('#', '');
    const f = c.length === 3 ? c.split('').map(x => x + x).join('') : c;
    return [0, 2, 4].map(i => parseInt(f.slice(i, i + 2), 16));
};
const lum = hex => {
    const [r, g, b] = rgb(hex).map(v => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)];
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

const AA = 4.5;
const problems = [];
const checks = (t) => {
    const p = t.palette;
    const out = {};
    const add = (name, fg, bg, min = AA) => {
        const r = +ratio(fg, bg).toFixed(2);
        out[name] = r;
        if (r < min) problems.push(`${t.key}: ${name} ${r} < ${min} (${fg} su ${bg})`);
    };
    add('text/bg', p.text, p.bg);
    add('text/card', p.text, p.card);
    add('muted/bg', p.muted, p.bg);
    add('muted/card', p.muted, p.card);
    add('accentText/accent', p.accentText, p.accent);
    add('secondaryText/secondary', p.secondaryText, p.secondary);
    // Prezzi "accent": menuTheme usa l'accento come colore di testo solo se ha almeno 3.2:1 sul fondo,
    // altrimenti ripiega sul colore del testo. Tra 3.2 e 4.5 il prezzo sarebbe sotto AA.
    const emphRatio = ratio(p.accent, p.bg);
    if (emphRatio >= 3.2) add('emph(accent)/bg', p.accent, p.bg);
    return out;
};

const fontName = f => (f || '').split(',')[0].replace(/"/g, '').trim();
const fontsOf = f => ({
    display: f.display,
    body: f.body,
    price: f.price || f.body,
    accent: f.accent || f.display,
    displayName: fontName(f.display),
    bodyName: fontName(f.body),
    priceName: fontName(f.price || f.body),
    accentName: fontName(f.accent || f.display),
    google: f.google,
    googleHref: f.google.length ? `https://fonts.googleapis.com/css2?${f.google.map(x => `family=${x}`).join('&')}&display=swap` : null,
});

const templates = MENU_TEMPLATES.map(t => {
    const contrast = checks(t);
    const p = t.palette;
    return {
        id: t.key,
        name: t.label,
        description: t.description,
        inspiration: t.inspiration,
        isNew: !!t.isNew,
        venues: t.venues,
        dark: lum(p.bg) < 0.35,
        palette: p,
        /** Colore dei prezzi/accenti usato come testo (come `emph` in menuTheme.ts). */
        emph: ratio(p.accent, p.bg) >= 3.2 ? p.accent : p.text,
        fonts: fontsOf(t.fonts),
        /** Abbinamenti proposti nel dialog PDF: il proprio + quelli dei template in pairsWith. */
        pairings: [t.key, ...(t.pairsWith || [])].filter(k => TEMPLATE_BY_KEY[k]).map(k => ({
            id: k,
            name: k === t.key ? 'Del template' : TEMPLATE_BY_KEY[k].label,
            fonts: fontsOf(TEMPLATE_BY_KEY[k].fonts),
        })),
        ornaments: {
            divider: t.look.divider,
            texture: t.look.texture,
            headerStyle: t.look.headerStyle,
            sectionHeader: t.look.sectionHeader,
            ink: t.look.ink,
            numberStyle: t.look.numberStyle,
            leaders: t.look.leaders,
            price: t.look.price,
        },
        look: t.look,
        contrast,
    };
});

if (problems.length) {
    console.error('Contrasto sotto WCAG AA:\n  ' + problems.join('\n  '));
}

if (!checkOnly) {
    const json = {
        $comment: 'GENERATO da scripts/export-pdf-tokens.mjs a partire da src/Client/menuTemplates.ts. Non modificare a mano: npm run export:pdf-tokens',
        schemaVersion: 1,
        count: templates.length,
        allFontsHref: buildTemplateFontsHref(MENU_TEMPLATES),
        templates,
    };
    fs.writeFileSync(OUT, JSON.stringify(json, null, 2) + '\n');
    console.log(`Scritto ${path.relative(root, OUT)} (${templates.length} template)`);
}
process.exit(problems.length ? 1 : 0);
