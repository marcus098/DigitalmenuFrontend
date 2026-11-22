import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FileDown, Loader2, X } from 'lucide-react';
import type { StyleDto } from '../../../types';
import { useData } from '../../../Context/DataContext';
import { fontPairLabel, MENU_TEMPLATES, MenuTemplateKey, parseTemplateValue, TEMPLATE_BY_KEY } from '../../../Client/menuTemplates';
import { getMenuLanguagesApi, getMenuTranslationApi, MenuLanguage, PublicMenuTranslation } from '../../../Utilities/translationApi';
import { buildMenuPrintHtmlAsync, contrast, PRINT_PRICE_CONTRAST, printTokens } from './buildMenuPrintHtml';
import { AllergenStyle, buildPdfMenu, MenuPdfOptions } from './menuPdfModel';

/**
 * Dashboard → Personalizza aspetto → Template → "Scarica menu in PDF".
 * Il ristoratore sceglie template (default: quello in uso), lingua e cosa includere; l'anteprima è
 * il documento vero (A4) in un iframe, e "Scarica PDF" apre la stampa del browser su quell'iframe
 * ("Salva come PDF"). Le interruzioni di pagina non spezzano mai un piatto (vedi buildMenuPrintHtml).
 */

interface MenuPdfDialogProps {
    /** Bozza dello stile (colori/ritocchi non ancora salvati inclusi). */
    draftTheme: StyleDto;
    localname: string;
    onClose: () => void;
}

const A4_PX = 794; // 210mm a 96 dpi
const FRAME_PX = A4_PX + 40; // + margine grigio attorno al foglio

/** Template "fitti" (numerati / compatti): allergeni come numeri con legenda, gli altri per nome. */
function defaultAllergenStyle(key: MenuTemplateKey): AllergenStyle {
    const l = TEMPLATE_BY_KEY[key].look;
    return l.productNumbers || l.density === 'compact' ? 'numbers' : 'names';
}

/** CSS dell'app (Tailwind + index.css): le classi .menu-* servono anche al documento stampato. */
function collectAppCss(): { css: string; links: string[] } {
    let css = '';
    const links: string[] = [];
    for (const sheet of Array.from(document.styleSheets)) {
        try {
            css += Array.from(sheet.cssRules).map(r => r.cssText).join('\n') + '\n';
        } catch {
            // foglio di un altro dominio (Google Fonts): lo ricolleghiamo
            if (sheet.href) links.push(sheet.href);
        }
    }
    return { css, links };
}

const MenuPdfDialog: React.FC<MenuPdfDialogProps> = ({ draftTheme, localname, onClose }) => {
    const { categoriesMap, productsMap, ingredientsMap } = useData();
    const currentKey = parseTemplateValue(draftTheme.landingTemplate).key;

    const [templateKey, setTemplateKey] = useState<MenuTemplateKey>(currentKey);
    const [allergenStyle, setAllergenStyle] = useState<AllergenStyle>(() => defaultAllergenStyle(currentKey));
    const [allergenTouched, setAllergenTouched] = useState(false);
    const [includeSoldOut, setIncludeSoldOut] = useState(false);
    const [includeImages, setIncludeImages] = useState(false);
    const [showDescriptions, setShowDescriptions] = useState(true);
    const [showAllergens, setShowAllergens] = useState(true);
    // Ritocchi di stampa: '' = come da template
    const [accent, setAccent] = useState('');
    const [fontPair, setFontPair] = useState<MenuTemplateKey | ''>('');
    const [density, setDensity] = useState<'' | 'airy' | 'compact'>('');
    const [columns, setColumns] = useState<0 | 1 | 2>(0);
    const [lang, setLang] = useState('it');
    const [languages, setLanguages] = useState<MenuLanguage[]>([]);
    const [translations, setTranslations] = useState<Record<string, PublicMenuTranslation | null>>({});
    const [loadingLang, setLoadingLang] = useState(false);
    const [ready, setReady] = useState(false);

    const iframeRef = useRef<HTMLIFrameElement>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const [previewSize, setPreviewSize] = useState({ w: 0, h: 0 });

    const appCss = useMemo(collectAppCss, []);

    // Lingue del menu (se il locale ha attivato le traduzioni)
    useEffect(() => {
        if (!localname) return;
        let cancelled = false;
        getMenuLanguagesApi(localname).then(res => {
            if (!cancelled && res.success && res.data?.data) setLanguages(res.data.data);
        });
        return () => { cancelled = true; };
    }, [localname]);

    useEffect(() => {
        if (lang === 'it' || lang in translations) return;
        let cancelled = false;
        setLoadingLang(true);
        getMenuTranslationApi(localname, lang).then(res => {
            if (cancelled) return;
            setTranslations(t => ({ ...t, [lang]: res.success && res.data?.data ? res.data.data : null }));
            setLoadingLang(false);
        });
        return () => { cancelled = true; };
    }, [lang, localname, translations]);

    useEffect(() => {
        if (!allergenTouched) setAllergenStyle(defaultAllergenStyle(templateKey));
    }, [templateKey, allergenTouched]);

    useEffect(() => { setAccent(''); setFontPair(''); }, [templateKey]);

    // Colori proposti: quelli della palette del template (con i ritocchi del locale se è quello in uso)
    const baseTokens = useMemo(() => printTokens(draftTheme, templateKey), [draftTheme, templateKey]);
    const swatches = useMemo(() => {
        const seen = new Set<string>();
        return [
            { c: baseTokens.accent, label: 'Accento' },
            { c: baseTokens.secondary, label: 'Secondario' },
            { c: baseTokens.text, label: 'Testo' },
        ].filter(x => /^#[0-9a-f]{6}$/i.test(x.c) && !seen.has(x.c.toLowerCase()) && !!seen.add(x.c.toLowerCase()));
    }, [baseTokens]);
    const pairOptions = useMemo(() => {
        const def = TEMPLATE_BY_KEY[templateKey];
        return [templateKey, ...(def.pairsWith || [])].filter((k, i, a) => TEMPLATE_BY_KEY[k] && a.indexOf(k) === i);
    }, [templateKey]);
    const tplDensity = TEMPLATE_BY_KEY[templateKey].look.density;
    const accentLowContrast = !!accent && contrast(accent, baseTokens.bg) < PRINT_PRICE_CONTRAST;

    // Esc chiude
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    useEffect(() => {
        const el = previewRef.current;
        if (!el) return;
        const measure = () => setPreviewSize({ w: el.clientWidth, h: el.clientHeight });
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        measure();
        return () => ro.disconnect();
    }, []);

    const translation = lang === 'it' ? null : translations[lang];
    const venueName = (draftTheme.restaurantName || '').trim() || localname;

    const menu = useMemo(
        () => buildPdfMenu(categoriesMap, productsMap, ingredientsMap, { includeSoldOut, includeImages, showDescriptions, showAllergens }, translation),
        [categoriesMap, productsMap, ingredientsMap, includeSoldOut, includeImages, showDescriptions, showAllergens, translation],
    );
    const productCount = menu.categories.reduce((s, c) => s + c.products.length, 0);

    // Il documento si genera fuori dal ciclo di render di React (render sincrono in un nodo staccato)
    const [html, setHtml] = useState('');
    useEffect(() => {
        const options: MenuPdfOptions = {
            includeSoldOut, includeImages, allergenStyle, lang: translation ? lang : 'it', showDescriptions, showAllergens,
            accent: accent || undefined,
            fontPair: fontPair && fontPair !== templateKey ? fontPair : undefined,
            density: density || undefined,
            columns: columns || undefined,
        };
        setReady(false);
        let alive = true;
        const timer = setTimeout(() => {
            buildMenuPrintHtmlAsync({
                styles: draftTheme,
                templateKey,
                menu,
                options,
                venueName,
                appCss: appCss.css,
                appCssLinks: appCss.links,
                imageBase: process.env.REACT_APP_BUCKET_URL || '',
            }).then(doc => { if (alive) setHtml(doc); });
        }, 0);
        return () => { alive = false; clearTimeout(timer); };
    }, [draftTheme, templateKey, menu, includeSoldOut, includeImages, showDescriptions, showAllergens, allergenStyle, accent, fontPair, density, columns, lang, translation, venueName, appCss]);

    // Pronto per la stampa quando font e foto del documento sono caricati
    const onFrameLoad = async () => {
        const doc = iframeRef.current?.contentDocument;
        if (!doc) return;
        try {
            await Promise.race([
                Promise.all([
                    doc.fonts?.ready,
                    ...Array.from(doc.images).map(img => img.complete ? null : new Promise(r => { img.onload = img.onerror = r; })),
                ]),
                new Promise(r => setTimeout(r, 8000)),
            ]);
        } catch { /* stampa comunque */ }
        setReady(true);
    };

    const print = () => {
        const win = iframeRef.current?.contentWindow;
        if (!win) return;
        // Alcuni browser usano il titolo della pagina principale come nome del file
        const prevTitle = document.title;
        document.title = `Menu - ${venueName}`;
        const restore = () => { document.title = prevTitle; };
        win.addEventListener('afterprint', restore, { once: true });
        setTimeout(restore, 60000);
        win.focus();
        win.print();
    };

    const scale = previewSize.w > 0 ? Math.min(1, previewSize.w / FRAME_PX) : 0.5;
    const showLangPicker = languages.length > 0;

    return createPortal(
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-2 sm:p-4" role="dialog" aria-modal="true" aria-labelledby="menu-pdf-title" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[94vh] flex flex-col overflow-hidden">
                <div className="flex items-start justify-between gap-4 px-5 sm:px-6 py-4 border-b">
                    <div>
                        <h2 id="menu-pdf-title" className="text-xl font-bold text-gray-800">Scarica menu in PDF</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Formato A4, pronto da stampare. Nessun piatto viene spezzato tra due pagine.</p>
                    </div>
                    <button onClick={onClose} aria-label="Chiudi" className="text-gray-400 hover:text-gray-600 flex-shrink-0">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 min-h-0 flex flex-col md:flex-row">
                    {/* Opzioni */}
                    <div className="md:w-80 flex-shrink-0 p-5 sm:p-6 space-y-5 overflow-y-auto border-b md:border-b-0 md:border-r max-h-[42vh] md:max-h-none">
                        <div>
                            <label htmlFor="menu-pdf-template" className="label-style">Template</label>
                            <select
                                id="menu-pdf-template"
                                value={templateKey}
                                onChange={e => setTemplateKey(e.target.value as MenuTemplateKey)}
                                className="input-style mt-1 w-full"
                            >
                                {MENU_TEMPLATES.map(t => (
                                    <option key={t.key} value={t.key}>{t.label}{t.key === currentKey ? ' (in uso)' : ''}</option>
                                ))}
                            </select>
                            <p className="text-[11px] text-gray-400 mt-1">
                                {templateKey === currentKey
                                    ? 'Con i tuoi colori e ritocchi, come nel menu online.'
                                    : 'Con colori e font originali del template.'}
                                {' '}Colore, caratteri e spaziatura qui sotto valgono solo per il PDF.
                            </p>
                        </div>


                        <div>
                            <p className="label-style">Colore d'accento</p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setAccent('')}
                                    aria-pressed={!accent}
                                    className={`px-2.5 h-8 rounded-lg border text-xs ${!accent ? 'border-gray-900 bg-slate-50 font-semibold text-gray-900' : 'border-gray-200 text-gray-600'}`}
                                >
                                    Del template
                                </button>
                                {swatches.map(sw => (
                                    <button
                                        key={sw.c}
                                        type="button"
                                        title={`${sw.label} ${sw.c}`}
                                        aria-label={`${sw.label} ${sw.c}`}
                                        aria-pressed={accent.toLowerCase() === sw.c.toLowerCase()}
                                        onClick={() => setAccent(sw.c)}
                                        className={`w-8 h-8 rounded-lg border-2 ${accent.toLowerCase() === sw.c.toLowerCase() ? 'border-gray-900' : 'border-gray-200'}`}
                                        style={{ background: sw.c }}
                                    />
                                ))}
                                <label className="relative w-8 h-8 rounded-lg border-2 border-dashed border-gray-300 cursor-pointer overflow-hidden" title="Colore personalizzato">
                                    <span className="sr-only">Colore personalizzato</span>
                                    <input
                                        type="color"
                                        value={/^#[0-9a-f]{6}$/i.test(accent) ? accent : baseTokens.accent.startsWith('#') ? baseTokens.accent : '#7a2318'}
                                        onChange={e => setAccent(e.target.value)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">+</span>
                                </label>
                            </div>
                            {accentLowContrast && (
                                <p className="text-[11px] text-amber-700 mt-1">Poco leggibile sul fondo: i prezzi restano nel colore del testo, l'accento resta su filetti e fasce.</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="menu-pdf-fonts" className="label-style">Caratteri</label>
                            <select
                                id="menu-pdf-fonts"
                                value={fontPair || templateKey}
                                onChange={e => setFontPair(e.target.value as MenuTemplateKey)}
                                className="input-style mt-1 w-full text-sm"
                            >
                                {pairOptions.map(k => (
                                    <option key={k} value={k} title={fontPairLabel(TEMPLATE_BY_KEY[k])}>{k === templateKey ? '★ ' : ''}{fontPairLabel(TEMPLATE_BY_KEY[k])}</option>
                                ))}
                            </select>
                        </div>

                        <fieldset>
                            <legend className="label-style">Spaziatura</legend>
                            <div className="mt-1 grid grid-cols-3 gap-1.5">
                                {([["","Template"],["airy","Aerata"],["compact","Compatta"]] as const).map(([k, label]) => (
                                    <button
                                        key={String(k)}
                                        type="button"
                                        aria-pressed={density === k}
                                        onClick={() => setDensity(k as any)}
                                        className={`px-2 py-1.5 rounded-lg border text-xs ${density === k ? 'border-gray-900 bg-slate-50 font-semibold text-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </fieldset>

                        <fieldset>
                            <legend className="label-style">Colonne</legend>
                            <div className="mt-1 grid grid-cols-3 gap-1.5">
                                {([[0,"Template"],[1,"1 colonna"],[2,"2 colonne"]] as const).map(([k, label]) => (
                                    <button
                                        key={String(k)}
                                        type="button"
                                        aria-pressed={columns === k}
                                        onClick={() => setColumns(k as any)}
                                        className={`px-2 py-1.5 rounded-lg border text-xs ${columns === k ? 'border-gray-900 bg-slate-50 font-semibold text-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        </fieldset>

                        {showLangPicker && (
                            <div>
                                <label htmlFor="menu-pdf-lang" className="label-style">Lingua</label>
                                <select id="menu-pdf-lang" value={lang} onChange={e => setLang(e.target.value)} className="input-style mt-1 w-full">
                                    <option value="it">Italiano</option>
                                    {languages.filter(l => l.code !== 'it').map(l => <option key={l.code} value={l.code}>{l.label}</option>)}
                                </select>
                                {lang !== 'it' && translations[lang] === null && (
                                    <p className="text-[11px] text-amber-700 mt-1">Traduzione non disponibile: il PDF resta in italiano.</p>
                                )}
                                {lang !== 'it' && translations[lang] && (
                                    <p className="text-[11px] text-gray-400 mt-1">I testi non ancora tradotti restano in italiano.</p>
                                )}
                            </div>
                        )}

                        {showAllergens && (
                        <fieldset>
                            <legend className="label-style">Allergeni</legend>
                            <div className="mt-1 grid grid-cols-2 gap-2">
                                {([['numbers', 'Numeri + legenda'], ['names', 'Nomi']] as const).map(([k, label]) => (
                                    <label key={k} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer ${allergenStyle === k ? 'border-gray-900 bg-slate-50 font-semibold' : 'border-gray-200 text-gray-600'}`}>
                                        <input
                                            type="radio"
                                            name="menu-pdf-allergens"
                                            checked={allergenStyle === k}
                                            onChange={() => { setAllergenStyle(k); setAllergenTouched(true); }}
                                            className="accent-primary"
                                        />
                                        {label}
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                        )}

                        <div className="space-y-2">
                            <label className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg border cursor-pointer">
                                <input type="checkbox" checked={includeSoldOut} onChange={e => setIncludeSoldOut(e.target.checked)} className="mt-0.5 w-4 h-4 accent-primary" />
                                <span>
                                    <span className="block text-sm font-semibold text-gray-700">Includi i piatti esauriti</span>
                                    <span className="block text-xs text-gray-500 mt-0.5">Compaiono con l'etichetta "Esaurito".</span>
                                </span>
                            </label>
                            <label className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg border cursor-pointer">
                                <input type="checkbox" checked={includeImages} onChange={e => setIncludeImages(e.target.checked)} className="mt-0.5 w-4 h-4 accent-primary" />
                                <span>
                                    <span className="block text-sm font-semibold text-gray-700">Foto dei piatti</span>
                                    <span className="block text-xs text-gray-500 mt-0.5">File più pesante e più pagine.</span>
                                </span>
                            </label>
                            <label className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg border cursor-pointer">
                                <input type="checkbox" checked={showDescriptions} onChange={e => setShowDescriptions(e.target.checked)} className="mt-0.5 w-4 h-4 accent-primary" />
                                <span>
                                    <span className="block text-sm font-semibold text-gray-700">Descrizioni dei piatti</span>
                                    <span className="block text-xs text-gray-500 mt-0.5">Senza, il menu sta in meno pagine.</span>
                                </span>
                            </label>
                            <label className="flex items-start gap-3 bg-slate-50 p-3 rounded-lg border cursor-pointer">
                                <input type="checkbox" checked={showAllergens} onChange={e => setShowAllergens(e.target.checked)} className="mt-0.5 w-4 h-4 accent-primary" />
                                <span>
                                    <span className="block text-sm font-semibold text-gray-700">Allergeni</span>
                                    <span className="block text-xs text-gray-500 mt-0.5">Accanto a ogni piatto, con la legenda in fondo.</span>
                                </span>
                            </label>
                        </div>

                        <p className="text-xs text-gray-500 leading-relaxed">
                            {menu.categories.length} categorie · {productCount} piatti.
                            {' '}Nella finestra di stampa scegli <strong>Salva come PDF</strong> come destinazione.
                        </p>
                    </div>

                    {/* Anteprima */}
                    <div className="flex-1 min-h-0 min-w-0 bg-gray-200 p-3 sm:p-4 flex flex-col">
                        <div ref={previewRef} className="flex-1 min-h-0 relative overflow-hidden rounded-lg">
                            {productCount === 0 ? (
                                <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500 text-center px-6">
                                    Nessun piatto da stampare. Aggiungi dei piatti al menu o includi quelli esauriti.
                                </div>
                            ) : html && (
                                <iframe
                                    ref={iframeRef}
                                    title="Anteprima del menu in PDF"
                                    srcDoc={html}
                                    onLoad={onFrameLoad}
                                    data-testid="menu-pdf-frame"
                                    style={{
                                        width: FRAME_PX,
                                        height: previewSize.h > 0 ? previewSize.h / scale : 1200,
                                        transform: `scale(${scale})`,
                                        transformOrigin: 'top left',
                                        border: 0,
                                        background: '#e5e7eb',
                                    }}
                                />
                            )}
                            {(!ready || loadingLang) && productCount > 0 && (
                                <div className="absolute top-3 right-3 bg-white/90 rounded-full px-3 py-1 text-xs font-semibold text-gray-600 flex items-center gap-1.5 shadow">
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Preparazione…
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3 px-5 sm:px-6 py-3 border-t">
                    <button onClick={onClose} className="btn-secondary">Chiudi</button>
                    <button
                        onClick={print}
                        disabled={!ready || loadingLang || productCount === 0}
                        className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <FileDown className="w-5 h-5" /> Scarica PDF
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
};

export default MenuPdfDialog;
