import React, { useMemo, useState } from 'react';
import {
    ArrowDown, ArrowUp, ChevronDown, Copy, Eye, EyeOff, GripVertical, Info, Plus, Search, Trash2, X,
} from 'lucide-react';
import { useData } from '../../../Context/DataContext';
import { useLoginContext } from '../../../Context/LoginContext';
import { useAiEnabled } from '../../../Hooks/useAiInsights';
import { FEATURE_ICONS } from '../../../Utilities/featureIcons';
import { IS_ADMIN, StyleDto } from '../../../types';
import {
    AboutSection, AnnouncementSection, buildInitialConfig, ButtonAction, CategoriesSection, configByteSize, ContactSection,
    duplicateSection, FeaturesSection, FONT_PAIRINGS, GallerySection, HeroSection, HighlightsSection, HoursSection,
    LANDING_MAX_BYTES, LandingConfig, LandingGlobal, LandingSection, LIMITS, LocationSection, newSection, parseLandingConfig,
    ReservationsSection, safeHttpsUrl, safeLinkHref, SECTION_META, SECTION_ORDER, SectionStyle, TestimonialsSection,
    TextSection, toVideoEmbed, VideoSection, WEEKDAYS,
} from '../../../Client/landing/landingConfig';
import {
    AiAssist, ColorInput, EditorEnvContext, ImageListEditor, ImageSlot, Segmented, SelectField, TextField, ToggleInput,
} from './EditorFields';

/**
 * Editor del sito vetrina a sezioni (Dashboard → Personalizza Aspetto → Sezioni).
 * Impostazioni globali + elenco sezioni (riordino con frecce o trascinamento, duplica,
 * nascondi, elimina) con un pannello di modifica per ciascuna. Ogni modifica aggiorna
 * subito l'anteprima live via draftTheme.
 */

export type LandingUpdater = (fn: (cfg: LandingConfig) => LandingConfig) => void;

interface Props {
    draftTheme: StyleDto;
    updateThemeValue: (k: keyof StyleDto | string, v: any) => void;
    /** Aggiornamento funzionale del config (parte dal sito classico se non c'è ancora). */
    updateLanding: LandingUpdater;
}

type Patch<S> = Partial<S> | ((s: S) => Partial<S>);
type Upd<S> = (patch: Patch<S>) => void;

const urlError = (v: string, check: (v: string) => string | null, msg: string) => (v.trim() && !check(v) ? msg : null);

// ─── Palette rapide ───────────────────────────────────────────────────────────

const COLOR_PRESETS: { label: string; bg: string; card: string; primary: string; onPrimary: string; secondary: string; onSecondary: string; title: string; body: string; hero: string }[] = [
    { label: 'Crema e terracotta', bg: '#f7f1e6', card: '#fffaf1', primary: '#b4532a', onPrimary: '#ffffff', secondary: '#2f2a24', onSecondary: '#f7f1e6', title: '#2a2119', body: '#6b5d4f', hero: '#2a2119' },
    { label: 'Notte e oro', bg: '#111111', card: '#1b1b1b', primary: '#d4a64a', onPrimary: '#111111', secondary: '#f2ead8', onSecondary: '#111111', title: '#f5efe2', body: '#b9b09c', hero: '#000000' },
    { label: 'Bianco e verde', bg: '#ffffff', card: '#f5f7f4', primary: '#2f6b3f', onPrimary: '#ffffff', secondary: '#1d2a20', onSecondary: '#ffffff', title: '#16211a', body: '#5b6a60', hero: '#16211a' },
    { label: 'Mare', bg: '#f3f7fa', card: '#ffffff', primary: '#1f5f8b', onPrimary: '#ffffff', secondary: '#0f2a3d', onSecondary: '#ffffff', title: '#0f2a3d', body: '#577083', hero: '#0f2a3d' },
    { label: 'Rosso pizzeria', bg: '#fff8f0', card: '#ffffff', primary: '#c62828', onPrimary: '#ffffff', secondary: '#1f6f3a', onSecondary: '#ffffff', title: '#231a14', body: '#6d5d50', hero: '#231a14' },
    { label: 'Rosa brunch', bg: '#fff5f3', card: '#ffffff', primary: '#d9577a', onPrimary: '#ffffff', secondary: '#3b2a33', onSecondary: '#ffffff', title: '#3b2a33', body: '#7a6570', hero: '#3b2a33' },
];

// ─── Pannelli comuni ──────────────────────────────────────────────────────────

const Panel: React.FC<{ title: string; defaultOpen?: boolean; children: React.ReactNode; badge?: React.ReactNode }> = ({ title, defaultOpen, children, badge }) => {
    const [open, setOpen] = useState(!!defaultOpen);
    return (
        <div className="border rounded-xl bg-white">
            <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open} className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left">
                <span className="font-semibold text-sm text-gray-800 flex items-center gap-2">{title}{badge}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            {open && <div className="px-4 pb-4 space-y-4">{children}</div>}
        </div>
    );
};

const StyleEditor: React.FC<{ st: SectionStyle; onChange: (st: SectionStyle) => void; noBg?: boolean }> = ({ st, onChange, noBg }) => {
    const set = <K extends keyof SectionStyle>(k: K, v: SectionStyle[K]) => onChange({ ...st, [k]: v });
    return (
        <details className="group rounded-lg border bg-slate-50">
            <summary className="cursor-pointer select-none px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 list-none flex items-center justify-between">
                Stile della sezione
                <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
            </summary>
            <div className="px-3 pb-3 space-y-3">
                {!noBg && (
                    <>
                        <Segmented label="Sfondo" value={st.bg} onChange={v => set('bg', v)} options={[
                            ['theme', 'Tema'], ['primary', 'Primario'], ['secondary', 'Secondario'], ['custom', 'Colore'], ['image', 'Foto'],
                        ]} />
                        {st.bg === 'custom' && <ColorInput label="Colore di sfondo" value={st.bgColor} onChange={v => set('bgColor', v)} />}
                        {st.bg === 'image' && (
                            <>
                                <ImageSlot label="Foto di sfondo" image={st.bgImage} onChange={img => set('bgImage', img)} aspect="21 / 9" />
                                <div>
                                    <label className="label-style text-sm">Velo scuro sulla foto: {Math.round(st.bgOverlay * 100)}%</label>
                                    <input type="range" min={0} max={90} value={Math.round(st.bgOverlay * 100)} onChange={e => set('bgOverlay', parseInt(e.target.value, 10) / 100)} className="w-full" />
                                </div>
                            </>
                        )}
                        {st.bg !== 'theme' && <p className="text-[11px] text-gray-400">Il colore del testo si adatta da solo allo sfondo.</p>}
                    </>
                )}
                <Segmented label="Spaziatura" value={st.spacing} onChange={v => set('spacing', v)} options={[['compact', 'Compatta'], ['normal', 'Normale'], ['airy', 'Ariosa']]} />
                <SelectField label="Animazione allo scorrimento" value={st.animation} onChange={v => set('animation', v)} options={[
                    ['none', 'Nessuna'], ['fade', 'Dissolvenza'], ['slide-up', 'Sale dal basso'], ['slide-side', 'Entra di lato'], ['zoom', 'Zoom'], ['stagger', 'Elementi uno dopo l\'altro'],
                ]} />
                <Segmented label="Allineamento titolo" value={st.titleAlign} onChange={v => set('titleAlign', v)} options={[['template', 'Come da template'], ['left', 'A sinistra'], ['center', 'Centrato']]} />
            </div>
        </details>
    );
};

const TitleFields: React.FC<{ s: { title: string; eyebrow: string }; up: (p: { title?: string; eyebrow?: string }) => void; titlePlaceholder?: string; action?: React.ReactNode }> = ({ s, up, titlePlaceholder, action }) => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
            <TextField label="Titolo" value={s.title} max={LIMITS.title} placeholder={titlePlaceholder} onChange={v => up({ title: v })} action={action} />
        </div>
        <TextField label="Sopratitolo" value={s.eyebrow} max={LIMITS.short} placeholder="facoltativo" onChange={v => up({ eyebrow: v })} />
    </div>
);

// ─── Editor per tipo di sezione ───────────────────────────────────────────────

const ACTION_LABEL: [ButtonAction, string][] = [
    ['menu', 'Apri il menù'], ['reserve', 'Prenota (va al modulo)'], ['call', 'Chiama il locale'], ['whatsapp', 'WhatsApp'], ['takeaway', 'Asporto'], ['link', 'Link esterno'],
];

const HeroEditor: React.FC<{ s: HeroSection; up: Upd<HeroSection>; draft: StyleDto }> = ({ s, up, draft }) => {
    const d: any = draft;
    return (
        <>
            <SelectField label="Tipo di intestazione" value={s.variant} onChange={v => up({ variant: v })} options={[
                ['template', 'Come da template'], ['image', 'Foto a tutta pagina con velo'], ['split', 'Foto e testo affiancati'], ['slideshow', 'Presentazione (fino a 5 foto)'], ['minimal', 'Solo testo'],
            ]} />
            <TextField
                label="Titolo" value={s.title} max={LIMITS.title} placeholder={draft.restaurantName || 'Nome del locale'}
                hint="Vuoto = nome del locale"
                onChange={v => up({ title: v })}
                action={<AiAssist kind="hero" hasText={!!(s.title.trim() || s.subtitle.trim())} onResult={r => up({ title: r.title, subtitle: r.text })} />}
            />
            <TextField label="Sottotitolo" value={s.subtitle} max={LIMITS.subtitle} multiline rows={2} placeholder={d.description || 'Una frase che vi descrive'} hint="Vuoto = descrizione breve del tab Contenuti" onChange={v => up({ subtitle: v })} />
            {s.variant === 'slideshow' ? (
                <>
                    <ImageListEditor label="Foto della presentazione" items={s.images} max={LIMITS.heroImages} update={fn => up(cur => ({ images: fn(cur.images) }))} />
                    <div>
                        <label className="label-style text-sm">Cambio foto ogni {s.interval} secondi</label>
                        <input type="range" min={3} max={15} value={s.interval} onChange={e => up({ interval: parseInt(e.target.value, 10) })} className="w-full" />
                    </div>
                </>
            ) : s.variant !== 'minimal' && (
                <ImageSlot label="Foto" image={s.images[0] || null} onChange={img => up(cur => ({ images: img ? [img, ...cur.images.slice(1)] : cur.images.slice(1) }))} />
            )}
            <div className="space-y-2">
                <p className="label-style text-sm">Pulsanti (max {LIMITS.heroButtons})</p>
                {s.buttons.map((b, i) => {
                    const setB = (patch: Partial<typeof b>) => up(cur => ({ buttons: cur.buttons.map((x, k) => (k === i ? { ...x, ...patch } : x)) }));
                    return (
                        <div key={i} className="p-3 bg-slate-50 border rounded-lg space-y-2">
                            <div className="flex gap-2">
                                <input type="text" value={b.label} maxLength={LIMITS.label} onChange={e => setB({ label: e.target.value })} className="input-style flex-1 min-w-0" placeholder="Testo del pulsante" aria-label={`Testo pulsante ${i + 1}`} />
                                <button type="button" onClick={() => up(cur => ({ buttons: cur.buttons.filter((_, k) => k !== i) }))} className="p-2 text-gray-400 hover:text-red-600" aria-label="Rimuovi pulsante"><Trash2 className="w-4 h-4" /></button>
                            </div>
                            <select value={b.action} onChange={e => setB({ action: e.target.value as ButtonAction })} className="input-style" aria-label={`Azione pulsante ${i + 1}`}>
                                {ACTION_LABEL.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                            </select>
                            {b.action === 'link' && (
                                <TextField label="Indirizzo del link" value={b.href} max={LIMITS.url} placeholder="https://…" onChange={v => setB({ href: v })}
                                    error={urlError(b.href, safeLinkHref, 'Usa un link che inizia con https://')} />
                            )}
                            {b.action === 'call' && !d.phone && <p className="text-[11px] text-amber-600">Aggiungi il telefono nel tab Contenuti, altrimenti il pulsante non compare.</p>}
                            {b.action === 'whatsapp' && !d.whatsapp && <p className="text-[11px] text-amber-600">Aggiungi il numero WhatsApp nel tab Contenuti.</p>}
                        </div>
                    );
                })}
                {s.buttons.length < LIMITS.heroButtons && (
                    <button type="button" onClick={() => up(cur => ({ buttons: [...cur.buttons, { label: '', action: 'menu', href: '' }] }))} className="btn-secondary text-sm w-full justify-center flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Aggiungi pulsante
                    </button>
                )}
            </div>
            <ToggleInput label='Pulsante "Asporto"' checked={s.showTakeaway} onChange={v => up({ showTakeaway: v })} />
            <ToggleInput label="Indirizzo e orari sopra il titolo" checked={s.showFacts} onChange={v => up({ showFacts: v })} />
            {(s.variant === 'image' || s.variant === 'slideshow' || s.variant === 'template') && (
                <>
                    <ColorInput label="Colore del velo sulla foto" value={s.overlayColor} emptyLabel="Come il colore hero" onChange={v => up({ overlayColor: v })} />
                    <div>
                        <div className="flex items-center justify-between">
                            <label className="label-style text-sm">Opacità del velo: {Math.round((s.overlayOpacity ?? d.heroOverlayOpacity ?? 0.6) * 100)}%</label>
                            {s.overlayOpacity !== null && <button type="button" onClick={() => up({ overlayOpacity: null })} className="text-xs font-semibold text-gray-500 hover:text-gray-800">Reimposta</button>}
                        </div>
                        <input type="range" min={0} max={100} value={Math.round((s.overlayOpacity ?? d.heroOverlayOpacity ?? 0.6) * 100)} onChange={e => up({ overlayOpacity: parseInt(e.target.value, 10) / 100 })} className="w-full" />
                    </div>
                </>
            )}
            <Segmented label="Allineamento testo" value={s.align} onChange={v => up({ align: v })} options={[['template', 'Come da template'], ['left', 'A sinistra'], ['center', 'Centrato']]} />
            <Segmented label="Altezza" value={s.height} onChange={v => up({ height: v })} options={[['medium', 'Media'], ['large', 'Grande'], ['full', 'Tutto schermo']]} />
        </>
    );
};

const AboutEditor: React.FC<{ s: AboutSection; up: Upd<AboutSection> }> = ({ s, up }) => (
    <>
        <TitleFields s={s} up={up} action={<AiAssist kind="about" hasText={!!s.text.trim()} onResult={r => up({ title: r.title || s.title, text: r.text })} />} />
        <TextField label="Testo" value={s.text} max={LIMITS.text} multiline rows={6} placeholder="Chi siete, da dove venite, cosa vi rende speciali…" hint="Lascia una riga vuota per andare a capo con un nuovo paragrafo" onChange={v => up({ text: v })} />
        <ImageSlot label="Foto" image={s.image} onChange={img => up({ image: img })} aspect="4 / 3" />
        <Segmented label="Posizione della foto" value={s.imagePosition} onChange={v => up({ imagePosition: v })} options={[['left', 'A sinistra'], ['right', 'A destra']]} />
    </>
);

const GalleryEditor: React.FC<{ s: GallerySection; up: Upd<GallerySection> }> = ({ s, up }) => (
    <>
        <TitleFields s={s} up={up} />
        <Segmented label="Disposizione" value={s.layout} onChange={v => up({ layout: v })} options={[['grid', 'Griglia'], ['masonry', 'Mosaico'], ['carousel', 'Carosello']]} />
        <ImageListEditor label="Foto" items={s.items} max={LIMITS.gallery} withCaption update={fn => up(cur => ({ items: fn(cur.items) }))} />
    </>
);

const FeaturesEditor: React.FC<{ s: FeaturesSection; up: Upd<FeaturesSection>; primary: string }> = ({ s, up, primary }) => (
    <>
        <TitleFields s={s} up={up} titlePlaceholder="Vuoto = nessun titolo" />
        <div className="space-y-3">
            {s.items.map((f, i) => {
                const setF = (patch: Partial<typeof f>) => up(cur => ({ items: cur.items.map((x, k) => (k === i ? { ...x, ...patch } : x)) }));
                return (
                    <div key={i} className="p-3 bg-slate-50 rounded-xl border space-y-2">
                        <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Box {i + 1}</p>
                            <button type="button" onClick={() => up(cur => ({ items: cur.items.filter((_, k) => k !== i) }))} className="p-1 text-gray-400 hover:text-red-600" aria-label="Rimuovi box"><Trash2 className="w-4 h-4" /></button>
                        </div>
                        <div className="grid grid-cols-8 gap-1 p-2 bg-white border rounded-lg max-h-32 overflow-y-auto" role="radiogroup" aria-label="Icona">
                            {FEATURE_ICONS.map(({ key, label, Cmp }) => (
                                <button key={key} type="button" role="radio" aria-checked={f.icon === key} title={label} onClick={() => setF({ icon: key })}
                                    className={`aspect-square flex items-center justify-center rounded-md ${f.icon === key ? 'text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                                    style={f.icon === key ? { backgroundColor: primary } : undefined}>
                                    <Cmp className="w-4 h-4" />
                                </button>
                            ))}
                        </div>
                        <input type="text" value={f.title} maxLength={LIMITS.title} onChange={e => setF({ title: e.target.value })} className="input-style" placeholder="Titolo" aria-label="Titolo del box" />
                        <input type="text" value={f.sub} maxLength={LIMITS.short} onChange={e => setF({ sub: e.target.value })} className="input-style" placeholder="Sottotitolo" aria-label="Sottotitolo del box" />
                    </div>
                );
            })}
        </div>
        {s.items.length < LIMITS.features && (
            <button type="button" onClick={() => up(cur => ({ items: [...cur.items, { icon: 'star', title: '', sub: '' }] }))} className="btn-secondary text-sm w-full justify-center flex items-center gap-2"><Plus className="w-4 h-4" /> Aggiungi box</button>
        )}
    </>
);

/** Scambia due piatti per id: `productIds` può contenere piatti eliminati che nell'elenco non compaiono. */
const swapIds = (ids: number[], x: number, y: number): number[] => {
    const a = [...ids];
    const i = a.indexOf(x), j = a.indexOf(y);
    if (i < 0 || j < 0) return ids;
    [a[i], a[j]] = [a[j], a[i]];
    return a;
};

const HighlightsEditor: React.FC<{ s: HighlightsSection; up: Upd<HighlightsSection> }> = ({ s, up }) => {
    const { productsMap, categoriesMap } = useData();
    const [q, setQ] = useState('');
    const all = useMemo(() => Array.from(productsMap.values()).filter(p => p.id > 0), [productsMap]);
    const found = all.filter(p => !s.productIds.includes(p.id) && p.name.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 30);
    const selected = s.productIds.map(id => productsMap.get(id)).filter((p): p is NonNullable<typeof p> => !!p);
    const full = s.productIds.length >= LIMITS.highlights;
    return (
        <>
            <TitleFields s={s} up={up} />
            <Segmented label="Disposizione" value={s.layout} onChange={v => up({ layout: v })} options={[['cards', 'Schede con foto'], ['list', 'Elenco']]} />
            <ToggleInput label="Mostra i prezzi" checked={s.showPrices} onChange={v => up({ showPrices: v })} />
            <div>
                <p className="label-style text-sm">Piatti scelti ({s.productIds.length}/{LIMITS.highlights})</p>
                {selected.length === 0 && <p className="text-xs text-gray-400 mt-1">Nessun piatto scelto: la sezione non compare sul sito.</p>}
                <ul className="mt-1 space-y-1">
                    {selected.map((p, i) => (
                        <li key={p.id} className="flex items-center gap-2 p-2 bg-slate-50 border rounded-lg text-sm">
                            <span className="flex-1 min-w-0 truncate">{p.name}{!p.available && <span className="text-[11px] text-amber-600 ml-2">(non disponibile, nascosto)</span>}</span>
                            <button type="button" disabled={i === 0} onClick={() => up(cur => ({ productIds: swapIds(cur.productIds, p.id, selected[i - 1].id) }))} className="p-1 text-gray-500 disabled:opacity-30" aria-label="Sposta su"><ArrowUp className="w-4 h-4" /></button>
                            <button type="button" disabled={i === selected.length - 1} onClick={() => up(cur => ({ productIds: swapIds(cur.productIds, p.id, selected[i + 1].id) }))} className="p-1 text-gray-500 disabled:opacity-30" aria-label="Sposta giù"><ArrowDown className="w-4 h-4" /></button>
                            <button type="button" onClick={() => up(cur => ({ productIds: cur.productIds.filter(x => x !== p.id) }))} className="p-1 text-gray-400 hover:text-red-600" aria-label={`Togli ${p.name}`}><X className="w-4 h-4" /></button>
                        </li>
                    ))}
                </ul>
            </div>
            {!full && (
                <div>
                    <div className="relative">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input type="search" value={q} onChange={e => setQ(e.target.value)} className="input-style pl-9" placeholder="Cerca un piatto del menu…" aria-label="Cerca un piatto" />
                    </div>
                    <ul className="mt-1 max-h-52 overflow-y-auto border rounded-lg divide-y bg-white">
                        {found.length === 0 && <li className="p-3 text-xs text-gray-400">Nessun piatto trovato.</li>}
                        {found.map(p => (
                            <li key={p.id}>
                                <button type="button" onClick={() => up(cur => ({ productIds: cur.productIds.includes(p.id) || cur.productIds.length >= LIMITS.highlights ? cur.productIds : [...cur.productIds, p.id] }))} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2">
                                    <Plus className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="flex-1 truncate">{p.name}</span>
                                    <span className="text-[11px] text-gray-400 truncate max-w-[40%]">{categoriesMap.get(p.idCategory)?.name}</span>
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </>
    );
};

const TestimonialsEditor: React.FC<{ s: TestimonialsSection; up: Upd<TestimonialsSection> }> = ({ s, up }) => (
    <>
        <TitleFields s={s} up={up} />
        <p className="text-[11px] text-gray-400 flex gap-1.5"><Info className="w-3.5 h-3.5 shrink-0 mt-px" /> Pubblica solo recensioni reali dei tuoi clienti.</p>
        {s.items.map((t, i) => {
            const setT = (patch: Partial<typeof t>) => up(cur => ({ items: cur.items.map((x, k) => (k === i ? { ...x, ...patch } : x)) }));
            return (
                <div key={i} className="p-3 bg-slate-50 border rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Recensione {i + 1}</p>
                        <button type="button" onClick={() => up(cur => ({ items: cur.items.filter((_, k) => k !== i) }))} className="p-1 text-gray-400 hover:text-red-600" aria-label="Rimuovi recensione"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <textarea value={t.text} maxLength={LIMITS.quote} rows={3} onChange={e => setT({ text: e.target.value })} className="input-style" placeholder="Testo della recensione" aria-label="Testo della recensione" />
                    <div className="flex gap-2">
                        <input type="text" value={t.author} maxLength={LIMITS.author} onChange={e => setT({ author: e.target.value })} className="input-style flex-1 min-w-0" placeholder="Nome (es. Giulia, Google)" aria-label="Autore" />
                        <select value={t.stars} onChange={e => setT({ stars: parseInt(e.target.value, 10) })} className="input-style w-28" aria-label="Stelle">
                            {[5, 4, 3, 2, 1].map(n => <option key={n} value={n}>{'★'.repeat(n)}</option>)}
                        </select>
                    </div>
                </div>
            );
        })}
        {s.items.length < LIMITS.testimonials && (
            <button type="button" onClick={() => up(cur => ({ items: [...cur.items, { text: '', author: '', stars: 5 }] }))} className="btn-secondary text-sm w-full justify-center flex items-center gap-2"><Plus className="w-4 h-4" /> Aggiungi recensione</button>
        )}
    </>
);

const HoursEditor: React.FC<{ s: HoursSection; up: Upd<HoursSection> }> = ({ s, up }) => (
    <>
        <TitleFields s={s} up={up} />
        <div className="space-y-2">
            {s.days.map((d, i) => (
                <div key={i} className="flex items-center gap-2">
                    <span className="w-20 text-sm font-semibold text-gray-700 shrink-0">{WEEKDAYS[i]}</span>
                    <label className="flex items-center gap-1 text-xs text-gray-600 shrink-0">
                        <input type="checkbox" checked={d.closed} onChange={e => up(cur => ({ days: cur.days.map((x, k) => (k === i ? { ...x, closed: e.target.checked } : x)) }))} className="w-4 h-4" />
                        Chiuso
                    </label>
                    <input type="text" value={d.text} maxLength={LIMITS.dayText} disabled={d.closed} onChange={e => up(cur => ({ days: cur.days.map((x, k) => (k === i ? { ...x, text: e.target.value } : x)) }))} className="input-style flex-1 min-w-0 disabled:opacity-50" placeholder="12:00–15:00 · 19:00–23:00" aria-label={`Orari ${WEEKDAYS[i]}`} />
                </div>
            ))}
        </div>
        <button type="button" onClick={() => up(cur => ({ days: cur.days.map(() => ({ ...cur.days[0] })) }))} className="text-xs font-semibold text-gray-600 hover:text-gray-900 underline underline-offset-2">
            Copia gli orari del lunedì su tutti i giorni
        </button>
        <TextField label="Nota" value={s.note} max={LIMITS.short} placeholder="es. Cucina aperta fino alle 22:30" onChange={v => up({ note: v })} />
    </>
);

const LocationEditor: React.FC<{ s: LocationSection; up: Upd<LocationSection>; draft: StyleDto; setStyle: Props['updateThemeValue'] }> = ({ s, up, draft, setStyle }) => (
    <>
        <TitleFields s={s} up={up} />
        <TextField label="Indirizzo (lo stesso del tab Contenuti)" value={draft.address || ''} max={200} onChange={v => setStyle('address', v)} placeholder="Via Roma 1, Milano" hint="Il pulsante apre Google Maps con questo indirizzo" />
        <TextField label="Indicazioni" value={s.text} max={LIMITS.subtitle} multiline rows={2} placeholder="es. Parcheggio gratuito sul retro" onChange={v => up({ text: v })} />
        <ToggleInput label="Mostra la mappa" checked={s.showMap} onChange={v => up({ showMap: v })} description="Incorpora Google Maps nella pagina (Google può impostare i suoi cookie)" />
    </>
);

const ReservationsEditor: React.FC<{ s: ReservationsSection; up: Upd<ReservationsSection>; bookingOn: boolean }> = ({ s, up, bookingOn }) => (
    <>
        {!bookingOn && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2">Le prenotazioni online sono disattivate nelle impostazioni globali: la sezione non compare.</p>}
        <TitleFields s={s} up={up} titlePlaceholder="Prenota un tavolo" />
        <TextField label="Testo" value={s.text} max={LIMITS.subtitle} multiline rows={2} onChange={v => up({ text: v })} />
        <Segmented label="Mostra" value={s.mode} onChange={v => up({ mode: v })} options={[['form', 'Il modulo completo'], ['button', 'Un pulsante che apre il modulo']]} />
    </>
);

const ContactEditor: React.FC<{ s: ContactSection; up: Upd<ContactSection>; draft: StyleDto; setStyle: Props['updateThemeValue'] }> = ({ s, up, draft, setStyle }) => {
    const d: any = draft;
    const socialErr = (v: string) => urlError(v, safeHttpsUrl, 'Link non valido');
    return (
        <>
            <TitleFields s={s} up={up} />
            <p className="text-[11px] text-gray-400 flex gap-1.5"><Info className="w-3.5 h-3.5 shrink-0 mt-px" /> Telefono, WhatsApp, orari e social sono gli stessi del tab Contenuti.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <TextField label="Telefono" value={d.phone || ''} max={40} inputMode="tel" onChange={v => setStyle('phone', v)} />
                <TextField label="WhatsApp" value={d.whatsapp || ''} max={40} inputMode="tel" placeholder="+39 333 123 4567" onChange={v => setStyle('whatsapp', v)} />
                <TextField label="Email" value={s.email} max={LIMITS.author} placeholder="info@…" onChange={v => up({ email: v })} />
                <TextField label="Instagram" value={d.instagramUrl || ''} max={LIMITS.url} placeholder="https://instagram.com/…" onChange={v => setStyle('instagramUrl', v)} error={socialErr(d.instagramUrl || '')} />
                <TextField label="Facebook" value={d.facebookUrl || ''} max={LIMITS.url} placeholder="https://facebook.com/…" onChange={v => setStyle('facebookUrl', v)} error={socialErr(d.facebookUrl || '')} />
                <TextField label="TikTok" value={d.tiktokUrl || ''} max={LIMITS.url} placeholder="https://tiktok.com/@…" onChange={v => setStyle('tiktokUrl', v)} error={socialErr(d.tiktokUrl || '')} />
                <TextField label="TripAdvisor" value={s.tripadvisorUrl} max={LIMITS.url} placeholder="https://www.tripadvisor.it/…" onChange={v => up({ tripadvisorUrl: v })} error={socialErr(s.tripadvisorUrl)} />
            </div>
            <ToggleInput label="Mostra gli orari" checked={s.showHours} onChange={v => up({ showHours: v })} />
            {s.showHours && <TextField label="Orari (testo breve)" value={d.openingHours || ''} max={200} placeholder="Tutti i giorni 18:00 – 23:00" onChange={v => setStyle('openingHours', v)} />}
        </>
    );
};

const AnnouncementEditor: React.FC<{ s: AnnouncementSection; up: Upd<AnnouncementSection> }> = ({ s, up }) => (
    <>
        <p className="text-[11px] text-gray-400">La barra appare sempre in cima alla pagina, sopra il menu.</p>
        <TextField label="Avviso" value={s.text} max={LIMITS.short} placeholder="es. Domenica aperti anche a pranzo" onChange={v => up({ text: v })}
            action={<AiAssist kind="announcement" hasText={!!s.text.trim()} onResult={r => up({ text: r.text })} />} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField label="Testo del link" value={s.linkLabel} max={LIMITS.label} placeholder="Scopri di più" onChange={v => up({ linkLabel: v })} />
            <TextField label="Link (facoltativo)" value={s.href} max={LIMITS.url} placeholder="https://…" onChange={v => up({ href: v })} error={urlError(s.href, safeHttpsUrl, 'Usa un link che inizia con https://')} />
        </div>
        <ColorInput label="Colore di sfondo" value={s.bgColor} emptyLabel="Colore secondario" onChange={v => up({ bgColor: v })} />
        <ColorInput label="Colore del testo" value={s.textColor} emptyLabel="Automatico" onChange={v => up({ textColor: v })} />
    </>
);

const TextEditor: React.FC<{ s: TextSection; up: Upd<TextSection> }> = ({ s, up }) => (
    <>
        <TitleFields s={s} up={up} />
        <TextField label="Testo" value={s.text} max={LIMITS.text} multiline rows={6} hint="Lascia una riga vuota per un nuovo paragrafo" onChange={v => up({ text: v })} />
    </>
);

const VideoEditor: React.FC<{ s: VideoSection; up: Upd<VideoSection> }> = ({ s, up }) => (
    <>
        <TitleFields s={s} up={up} />
        <TextField label="Link del video (YouTube o Vimeo)" value={s.videoUrl} max={LIMITS.url} placeholder="https://www.youtube.com/watch?v=…" onChange={v => up({ videoUrl: v })}
            error={urlError(s.videoUrl, toVideoEmbed, 'Link non riconosciuto: incolla un video di YouTube o Vimeo')}
            hint={s.videoUrl.trim() ? 'Video riconosciuto: verrà mostrato in modalità privacy (senza cookie di profilazione)' : undefined} />
        <TextField label="Didascalia" value={s.caption} max={LIMITS.short} onChange={v => up({ caption: v })} />
    </>
);

const CategoriesEditor: React.FC<{ s: CategoriesSection; up: Upd<CategoriesSection> }> = ({ s, up }) => (
    <>
        <TitleFields s={s} up={up} titlePlaceholder="Il menù" />
        <ToggleInput label='Pulsante "Apri il menù completo"' checked={s.showButton} onChange={v => up({ showButton: v })} />
    </>
);

// ─── Editor principale ────────────────────────────────────────────────────────

const sectionSummary = (s: LandingSection): string => {
    const any: any = s;
    const t = (any.title || any.text || '').trim();
    return t ? (t.length > 40 ? t.slice(0, 40) + '…' : t) : '';
};

const LandingEditor: React.FC<Props> = ({ draftTheme, updateThemeValue, updateLanding }) => {
    const { checkVariable } = useLoginContext();
    const aiEnabled = useAiEnabled(checkVariable(IS_ADMIN));
    const d: any = draftTheme;
    const parsed = useMemo(() => parseLandingConfig(d.landingConfig), [d.landingConfig]);
    const config = useMemo(() => parsed ?? buildInitialConfig(draftTheme),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [parsed, d.heroImageUrl, d.features, d.sectionWhyTitle, d.sectionMenuTitle, d.sectionBookingTitle, d.showTicker, d.showWhyUs]);
    const active = !!parsed;
    const [openId, setOpenId] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [dragIdx, setDragIdx] = useState<number | null>(null);
    const bookingOn = d.showBooking ?? true;

    const setGlobal = <K extends keyof LandingGlobal>(k: K, v: LandingGlobal[K]) =>
        updateLanding(cfg => ({ ...cfg, global: { ...cfg.global, [k]: v } }));

    const patchSection = (id: string, patch: Patch<any>) => updateLanding(cfg => ({
        ...cfg,
        sections: cfg.sections.map(s => (s.id === id ? { ...s, ...(typeof patch === 'function' ? patch(s) : patch) } as LandingSection : s)),
    }));

    const move = (from: number, to: number) => updateLanding(cfg => {
        if (to < 0 || to >= cfg.sections.length || from === to) return cfg;
        const next = [...cfg.sections];
        const [x] = next.splice(from, 1);
        next.splice(to, 0, x);
        return { ...cfg, sections: next };
    });

    const remove = (s: LandingSection) => {
        if (!window.confirm(`Eliminare la sezione "${SECTION_META[s.type].label}"? Potrai annullare solo non salvando.`)) return;
        updateLanding(cfg => ({ ...cfg, sections: cfg.sections.filter(x => x.id !== s.id) }));
    };

    const add = (type: (typeof SECTION_ORDER)[number]) => {
        const sec = newSection(type);
        updateLanding(cfg => {
            if (cfg.sections.length >= LIMITS.sections) return cfg;
            // L'avviso va in cima; le altre sezioni in fondo
            return { ...cfg, sections: type === 'announcement' ? [sec, ...cfg.sections] : [...cfg.sections, sec] };
        });
        setOpenId(sec.id);
        setAdding(false);
    };

    const applyColors = (c: typeof COLOR_PRESETS[number]) => {
        updateThemeValue('backgroundGradient', [c.bg]);
        updateThemeValue('cardBackground', c.card);
        updateThemeValue('primary', c.primary);
        updateThemeValue('textOnPrimary', c.onPrimary);
        updateThemeValue('secondaryColor', c.secondary);
        updateThemeValue('secondaryTextColor', c.onSecondary);
        updateThemeValue('textTitle', c.title);
        updateThemeValue('textBody', c.body);
        updateThemeValue('heroBgColor', c.hero);
    };

    const size = useMemo(() => configByteSize(config), [config]);
    const g = config.global;

    const renderEditor = (s: LandingSection) => {
        const up = (patch: Patch<any>) => patchSection(s.id, patch);
        switch (s.type) {
            case 'hero': return <HeroEditor s={s} up={up} draft={draftTheme} />;
            case 'about': return <AboutEditor s={s} up={up} />;
            case 'gallery': return <GalleryEditor s={s} up={up} />;
            case 'features': return <FeaturesEditor s={s} up={up} primary={draftTheme.primary} />;
            case 'highlights': return <HighlightsEditor s={s} up={up} />;
            case 'testimonials': return <TestimonialsEditor s={s} up={up} />;
            case 'hours': return <HoursEditor s={s} up={up} />;
            case 'location': return <LocationEditor s={s} up={up} draft={draftTheme} setStyle={updateThemeValue} />;
            case 'reservations': return <ReservationsEditor s={s} up={up} bookingOn={bookingOn} />;
            case 'contact': return <ContactEditor s={s} up={up} draft={draftTheme} setStyle={updateThemeValue} />;
            case 'announcement': return <AnnouncementEditor s={s} up={up} />;
            case 'text': return <TextEditor s={s} up={up} />;
            case 'video': return <VideoEditor s={s} up={up} />;
            case 'categories': return <CategoriesEditor s={s} up={up} />;
            case 'ticker': return <p className="text-xs text-gray-500">Mostra i nomi delle categorie del menu (animata nei template che lo prevedono). Nessuna impostazione.</p>;
        }
    };

    return (
        <EditorEnvContext.Provider value={{ aiEnabled, venueName: draftTheme.restaurantName || '' }}>
            <div className="space-y-4">
                {active ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-3">
                        <span>Il sito vetrina usa le sezioni qui sotto.</span>
                        <button type="button" onClick={() => {
                            if (window.confirm('Tornare al sito classico? Le sezioni verranno eliminate al salvataggio (foto e testi del tab Contenuti restano).')) updateThemeValue('landingConfig', null);
                        }} className="font-semibold underline underline-offset-2">Torna al sito classico</button>
                    </div>
                ) : (
                    <div className="text-xs bg-sky-50 border border-sky-200 text-sky-900 rounded-lg p-3 space-y-2">
                        <p>Il sito pubblico usa ancora il layout classico. Qui sotto trovi le stesse sezioni pronte da personalizzare: appena ne modifichi una, l'anteprima passa al nuovo sito a sezioni.</p>
                        <button type="button" onClick={() => updateLanding(cfg => cfg)} className="font-semibold underline underline-offset-2">Attiva il sito a sezioni</button>
                    </div>
                )}

                {/* ── Impostazioni globali ── */}
                <Panel title="Impostazioni generali" defaultOpen={false}>
                    <ToggleInput label="Prenotazioni online attive" checked={bookingOn} onChange={v => updateThemeValue('showBooking', v)} description='Mostra la sezione Prenotazioni e i pulsanti "Prenota"' />
                    <div>
                        <p className="label-style text-sm">Palette rapide</p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
                            {COLOR_PRESETS.map(c => (
                                <button key={c.label} type="button" onClick={() => applyColors(c)} className="flex items-center gap-2 p-2 rounded-lg border bg-white hover:border-gray-400 text-left" title={`Applica "${c.label}"`}>
                                    <span className="flex -space-x-1 shrink-0" aria-hidden="true">
                                        {[c.bg, c.primary, c.secondary].map((x, i) => <span key={i} className="w-5 h-5 rounded-full border border-black/10" style={{ background: x }} />)}
                                    </span>
                                    <span className="text-[11px] font-semibold text-gray-700 leading-tight">{c.label}</span>
                                </button>
                            ))}
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1">I colori su misura si scelgono nel tab Colori.</p>
                    </div>
                    <SelectField label="Abbinamento font" value={g.fontPairing} onChange={v => setGlobal('fontPairing', v)} options={[
                        ['template', 'Come da template (o font del tab Colori)'], ...FONT_PAIRINGS.map(f => [f.key, f.label] as [string, string]),
                    ]} />
                    <Segmented label="Animazioni" value={g.animation} onChange={v => setGlobal('animation', v)} options={[['off', 'Spente'], ['subtle', 'Delicate'], ['lively', 'Vivaci']]} />
                    <Segmented label="Forma dei pulsanti" value={g.buttonShape} onChange={v => setGlobal('buttonShape', v)} options={[['template', 'Template'], ['square', 'Squadrati'], ['rounded', 'Arrotondati'], ['pill', 'Pillola']]} />
                    <Segmented label="Stile delle schede" value={g.cardStyle} onChange={v => setGlobal('cardStyle', v)} options={[['template', 'Template'], ['flat', 'Piatte'], ['bordered', 'Con bordo'], ['shadow', 'Con ombra']]} />
                    <Segmented label="Separatori tra le sezioni" value={g.dividers} onChange={v => setGlobal('dividers', v)} options={[['template', 'Template'], ['none', 'Nessuno'], ['line', 'Linea'], ['wave', 'Onda']]} />
                    <ToggleInput label='Pulsante "Torna su"' checked={g.backToTop} onChange={v => setGlobal('backToTop', v)} />
                    <p className="text-[11px] text-gray-400">Chi ha attivato "riduci movimento" sul telefono vede la pagina senza animazioni.</p>
                </Panel>

                {/* ── Sezioni ── */}
                <div>
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Sezioni ({config.sections.length}/{LIMITS.sections})</p>
                        <span className={`text-[11px] ${size > LANDING_MAX_BYTES * 0.9 ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
                            {Math.ceil(size / 1024)} / {LANDING_MAX_BYTES / 1024} KB
                        </span>
                    </div>
                    <ul className="space-y-2">
                        {config.sections.map((s, i) => {
                            const open = openId === s.id;
                            const summary = sectionSummary(s);
                            return (
                                <li
                                    key={s.id}
                                    className={`border rounded-xl bg-white transition-shadow ${dragIdx === i ? 'opacity-50' : ''} ${!s.enabled ? 'bg-slate-50' : ''}`}
                                    onDragOver={e => { if (dragIdx !== null) e.preventDefault(); }}
                                    onDrop={e => { e.preventDefault(); if (dragIdx !== null) move(dragIdx, i); setDragIdx(null); }}
                                >
                                    <div className="flex items-center gap-1 px-2 py-2">
                                        <span
                                            draggable
                                            onDragStart={e => { setDragIdx(i); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', s.id); }}
                                            onDragEnd={() => setDragIdx(null)}
                                            className="hidden sm:inline-flex p-1.5 text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing"
                                            title="Trascina per spostare"
                                            aria-hidden="true"
                                        >
                                            <GripVertical className="w-4 h-4" />
                                        </span>
                                        <button type="button" onClick={() => setOpenId(open ? null : s.id)} aria-expanded={open} className="flex-1 min-w-0 text-left px-1 py-1">
                                            <span className={`block text-sm font-semibold truncate ${s.enabled ? 'text-gray-800' : 'text-gray-400 line-through'}`}>{SECTION_META[s.type].label}</span>
                                            {summary && <span className="block text-[11px] text-gray-400 truncate">{summary}</span>}
                                        </button>
                                        <button type="button" onClick={() => patchSection(s.id, { enabled: !s.enabled })} className="p-1.5 text-gray-400 hover:text-gray-700" aria-label={s.enabled ? 'Nascondi sezione' : 'Mostra sezione'} title={s.enabled ? 'Nascondi' : 'Mostra'}>
                                            {s.enabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                        </button>
                                        <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0} className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30" aria-label="Sposta su"><ArrowUp className="w-4 h-4" /></button>
                                        <button type="button" onClick={() => move(i, i + 1)} disabled={i === config.sections.length - 1} className="p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30" aria-label="Sposta giù"><ArrowDown className="w-4 h-4" /></button>
                                        <button
                                            type="button"
                                            onClick={() => updateLanding(cfg => cfg.sections.length >= LIMITS.sections ? cfg : ({ ...cfg, sections: [...cfg.sections.slice(0, i + 1), duplicateSection(s), ...cfg.sections.slice(i + 1)] }))}
                                            disabled={config.sections.length >= LIMITS.sections || !!SECTION_META[s.type].single}
                                            className="hidden sm:inline-flex p-1.5 text-gray-400 hover:text-gray-700 disabled:opacity-30"
                                            aria-label="Duplica sezione" title="Duplica"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        <button type="button" onClick={() => remove(s)} className="p-1.5 text-gray-400 hover:text-red-600" aria-label="Elimina sezione" title="Elimina"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                    {open && (
                                        <div className="px-3 sm:px-4 pb-4 pt-1 space-y-4 border-t">
                                            <div className="pt-3 space-y-4">{renderEditor(s)}</div>
                                            {s.type !== 'ticker' && s.type !== 'announcement' && (
                                                <StyleEditor st={s.style} noBg={s.type === 'hero' && (s.variant === 'image' || s.variant === 'slideshow' || s.variant === 'template')} onChange={st => patchSection(s.id, { style: st })} />
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => updateLanding(cfg => cfg.sections.length >= LIMITS.sections ? cfg : ({ ...cfg, sections: [...cfg.sections.slice(0, i + 1), duplicateSection(s), ...cfg.sections.slice(i + 1)] }))}
                                                disabled={config.sections.length >= LIMITS.sections || !!SECTION_META[s.type].single}
                                                className="sm:hidden text-xs font-semibold text-gray-600 underline underline-offset-2 disabled:opacity-40"
                                            >
                                                Duplica sezione
                                            </button>
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>

                    {adding ? (
                        <div className="mt-3 border rounded-xl bg-white p-3">
                            <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-semibold text-gray-800">Aggiungi una sezione</p>
                                <button type="button" onClick={() => setAdding(false)} className="p-1 text-gray-400 hover:text-gray-700" aria-label="Chiudi"><X className="w-4 h-4" /></button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {SECTION_ORDER.map(type => {
                                    const disabled = !!SECTION_META[type].single && config.sections.some(s => s.type === type);
                                    return (
                                        <button key={type} type="button" disabled={disabled} onClick={() => add(type)} className="text-left p-2.5 rounded-lg border hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed">
                                            <span className="block text-sm font-semibold text-gray-800">{SECTION_META[type].label}</span>
                                            <span className="block text-[11px] text-gray-500 leading-snug">{SECTION_META[type].description}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <button type="button" onClick={() => setAdding(true)} disabled={config.sections.length >= LIMITS.sections} className="btn-secondary text-sm w-full justify-center flex items-center gap-2 mt-3 disabled:opacity-50">
                            <Plus className="w-4 h-4" /> Aggiungi sezione
                        </button>
                    )}
                </div>
            </div>
        </EditorEnvContext.Provider>
    );
};

export default LandingEditor;
