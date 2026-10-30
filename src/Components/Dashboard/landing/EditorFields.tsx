import React, { createContext, useContext, useId, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Image as ImageIcon, Loader2, Plus, Replace, Trash2, X } from 'lucide-react';
import { generateLandingTextApi, uploadLandingImageApi } from '../../../Utilities/api';
import { downscaleImage } from '../../../Utilities/imageResize';
import { resolveImageUrl } from '../../../Utilities/Utilities';
import { useNotification } from '../../../Context/NotificationContext';
import { LandingImage, LIMITS, safeImageSrc } from '../../../Client/landing/landingConfig';
import type { AiLandingTextKind, AiLandingTone } from '../../../types';

/**
 * Campi riutilizzabili dell'editor "Personalizza Aspetto" (colori, interruttori, testi con
 * contatore, foto caricate nel bucket, "Scrivi con AI").
 */

// ─── Contesto editor ──────────────────────────────────────────────────────────

export interface EditorEnv {
    aiEnabled: boolean;
    venueName: string;
}

export const EditorEnvContext = createContext<EditorEnv>({ aiEnabled: false, venueName: '' });
export const useEditorEnv = () => useContext(EditorEnvContext);

// ─── Campi base ───────────────────────────────────────────────────────────────

export const ColorInput: React.FC<{
    label: string;
    value: string;
    onChange: (v: string) => void;
    onRemove?: () => void;
    /** Testo mostrato quando il valore è vuoto (es. "Automatico"): abilita il pulsante di reset. */
    emptyLabel?: string;
}> = ({ label, value, onChange, onRemove, emptyLabel }) => (
    <div>
        <label className="label-style text-sm">{label}</label>
        <div className="flex items-center gap-3 mt-1">
            <input type="color" aria-label={label} value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#000000'} onChange={e => onChange(e.target.value)} className="w-10 h-10 p-0 border-none rounded-md cursor-pointer shrink-0" />
            <input type="text" value={value} placeholder={emptyLabel} maxLength={7} onChange={e => onChange(e.target.value)} className="input-style flex-grow min-w-0" />
            {onRemove && <button type="button" aria-label="Rimuovi colore" onClick={onRemove} className="p-2 text-gray-400 hover:text-red-500 rounded-full"><X className="w-5 h-5" /></button>}
            {emptyLabel && value && !onRemove && (
                <button type="button" onClick={() => onChange('')} className="text-xs font-semibold text-gray-500 hover:text-gray-800 whitespace-nowrap">Reimposta</button>
            )}
        </div>
    </div>
);

export const ToggleInput: React.FC<{ label: string; checked: boolean; onChange: (v: boolean) => void; description?: string }> = ({ label, checked, onChange, description }) => (
    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border">
        <div>
            <p className="font-semibold text-gray-700 text-sm">{label}</p>
            {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
        </div>
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            onClick={() => onChange(!checked)}
            className={`relative w-11 h-6 rounded-full cursor-pointer transition-colors shrink-0 ml-3 ${checked ? 'bg-primary' : 'bg-gray-300'}`}
        >
            <span className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    </div>
);

export const TextField: React.FC<{
    label: string;
    value: string;
    onChange: (v: string) => void;
    max: number;
    placeholder?: string;
    multiline?: boolean;
    rows?: number;
    hint?: React.ReactNode;
    error?: string | null;
    /** Elemento a destra dell'etichetta (es. "Scrivi con AI"). */
    action?: React.ReactNode;
    inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
}> = ({ label, value, onChange, max, placeholder, multiline, rows = 3, hint, error, action, inputMode }) => {
    const id = useId();
    const near = value.length > max * 0.85;
    return (
        <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
                <label htmlFor={id} className="label-style text-sm">{label}</label>
                {action}
            </div>
            {multiline ? (
                <textarea id={id} value={value} maxLength={max} rows={rows} placeholder={placeholder} onChange={e => onChange(e.target.value)} className="input-style mt-1" />
            ) : (
                <input id={id} type="text" inputMode={inputMode} value={value} maxLength={max} placeholder={placeholder} onChange={e => onChange(e.target.value)} className="input-style mt-1" />
            )}
            <div className="flex justify-between gap-2 mt-0.5">
                <span className={`text-[11px] ${error ? 'text-red-600' : 'text-gray-400'}`}>{error || hint}</span>
                {near && <span className="text-[11px] text-gray-400 shrink-0">{value.length}/{max}</span>}
            </div>
        </div>
    );
};

export function Segmented<T extends string>({ label, value, options, onChange }: {
    label: string;
    value: T;
    options: [T, string][];
    onChange: (v: T) => void;
}) {
    return (
        <div>
            <p className="label-style text-sm">{label}</p>
            <div className="flex flex-wrap gap-1 mt-1" role="radiogroup" aria-label={label}>
                {options.map(([v, l]) => (
                    <button
                        key={v}
                        type="button"
                        role="radio"
                        aria-checked={value === v}
                        onClick={() => onChange(v)}
                        className={`px-2.5 py-1.5 rounded-md text-xs font-semibold border transition-colors ${
                            value === v ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                        }`}
                    >
                        {l}
                    </button>
                ))}
            </div>
        </div>
    );
}

export function SelectField<T extends string>({ label, value, options, onChange }: {
    label: string;
    value: T;
    options: [T, string][];
    onChange: (v: T) => void;
}) {
    const id = useId();
    return (
        <div>
            <label htmlFor={id} className="label-style text-sm">{label}</label>
            <select id={id} value={value} onChange={e => onChange(e.target.value as T)} className="input-style mt-1">
                {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
        </div>
    );
}

// ─── Foto ─────────────────────────────────────────────────────────────────────

export const previewUrl = (src: string | undefined | null) => {
    const s = safeImageSrc(src);
    return s ? resolveImageUrl(s, '') : '';
};

/** Riduce la foto, la carica nel bucket e restituisce il percorso (o null con notifica d'errore). */
function useImageUpload() {
    const { addNotification } = useNotification();
    const [busy, setBusy] = useState(false);
    const [progress, setProgress] = useState(0);
    const upload = async (file: File): Promise<string | null> => {
        if (!file.type.startsWith('image/')) {
            addNotification({ message: 'Il file deve essere un\'immagine', type: 'error' });
            return null;
        }
        setBusy(true);
        setProgress(0);
        try {
            const small = await downscaleImage(file);
            if (small.size > 10 * 1024 * 1024) {
                addNotification({ message: 'Immagine troppo grande (massimo 10 MB)', type: 'error' });
                return null;
            }
            const r = await uploadLandingImageApi(small, setProgress);
            const path = r.success ? r.data?.data?.path : null;
            if (!path) {
                addNotification({ message: r.message || 'Caricamento della foto non riuscito', type: 'error' });
                return null;
            }
            return path;
        } finally {
            setBusy(false);
        }
    };
    return { busy, progress, upload };
}

const UploadOverlay: React.FC<{ progress: number }> = ({ progress }) => (
    <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-2 text-xs font-semibold text-gray-600" aria-live="polite">
        <Loader2 className="w-6 h-6 animate-spin" />
        {progress > 0 && progress < 100 ? `Caricamento ${progress}%` : 'Caricamento…'}
    </div>
);

/** Una foto: carica / sostituisci / rimuovi + testo alternativo (e didascalia, se richiesta). */
export const ImageSlot: React.FC<{
    label: string;
    image: LandingImage | null;
    onChange: (img: LandingImage | null) => void;
    withCaption?: boolean;
    aspect?: string;
}> = ({ label, image, onChange, withCaption, aspect = '16 / 9' }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const { busy, progress, upload } = useImageUpload();
    const url = previewUrl(image?.src);

    const pick = async (file: File | undefined) => {
        if (!file) return;
        const path = await upload(file);
        if (path) onChange({ src: path, alt: image?.alt || '', ...(withCaption ? { caption: image?.caption || '' } : {}) });
    };

    return (
        <div>
            <p className="label-style text-sm">{label}</p>
            <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={e => { pick(e.target.files?.[0]); e.target.value = ''; }} />
            <div className="relative mt-1 w-full bg-slate-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300" style={{ aspectRatio: aspect }}>
                {url ? (
                    <img src={url} alt={image?.alt || ''} className="w-full h-full object-cover" />
                ) : (
                    <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="w-full h-full flex flex-col items-center justify-center text-gray-500 hover:bg-slate-200/60">
                        <ImageIcon className="w-9 h-9 text-gray-400" />
                        <span className="mt-1 text-xs font-semibold">Carica foto</span>
                    </button>
                )}
                {busy && <UploadOverlay progress={progress} />}
                {url && !busy && (
                    <div className="absolute top-2 right-2 flex gap-1.5">
                        <button type="button" onClick={() => inputRef.current?.click()} className="p-2 bg-black/55 rounded-full text-white hover:bg-black/75" title="Sostituisci" aria-label="Sostituisci foto">
                            <Replace className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => onChange(null)} className="p-2 bg-black/55 rounded-full text-white hover:bg-red-600" title="Rimuovi" aria-label="Rimuovi foto">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
            {image && (
                <div className="grid grid-cols-1 gap-2 mt-2">
                    <input type="text" value={image.alt} maxLength={LIMITS.short} onChange={e => onChange({ ...image, alt: e.target.value })} className="input-style text-sm" placeholder="Descrizione della foto (per chi non vede, es. Sala con tavoli in legno)" aria-label="Testo alternativo" />
                    {withCaption && (
                        <input type="text" value={image.caption || ''} maxLength={LIMITS.short} onChange={e => onChange({ ...image, caption: e.target.value })} className="input-style text-sm" placeholder="Didascalia (facoltativa)" aria-label="Didascalia" />
                    )}
                </div>
            )}
        </div>
    );
};

/** Elenco di foto (galleria, slideshow): aggiunta multipla, ordine, testo alternativo e didascalia. */
export const ImageListEditor: React.FC<{
    label: string;
    items: LandingImage[];
    max: number;
    /** Aggiornamento funzionale: l'upload è asincrono e non deve sovrascrivere modifiche fatte nel frattempo. */
    update: (fn: (items: LandingImage[]) => LandingImage[]) => void;
    withCaption?: boolean;
}> = ({ label, items, max, update, withCaption }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const { busy, progress, upload } = useImageUpload();
    const [queue, setQueue] = useState<{ done: number; total: number } | null>(null);

    const addFiles = async (files: FileList | null) => {
        if (!files?.length) return;
        const room = Math.max(0, max - items.length);
        const list = Array.from(files).slice(0, room);
        setQueue({ done: 0, total: list.length });
        for (let i = 0; i < list.length; i++) {
            const path = await upload(list[i]);
            if (path) update(cur => (cur.length < max ? [...cur, { src: path, alt: '', ...(withCaption ? { caption: '' } : {}) }] : cur));
            setQueue({ done: i + 1, total: list.length });
        }
        setQueue(null);
    };

    const move = (i: number, dir: -1 | 1) => update(cur => {
        const j = i + dir;
        if (j < 0 || j >= cur.length) return cur;
        const next = [...cur];
        [next[i], next[j]] = [next[j], next[i]];
        return next;
    });

    return (
        <div>
            <div className="flex items-center justify-between">
                <p className="label-style text-sm">{label}</p>
                <span className="text-[11px] text-gray-400">{items.length}/{max}</span>
            </div>
            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={e => { addFiles(e.target.files); e.target.value = ''; }} />
            <ul className="space-y-3 mt-1">
                {items.map((im, i) => (
                    <li key={im.src + i} className="flex gap-3 p-2 bg-slate-50 border rounded-lg">
                        <img src={previewUrl(im.src)} alt="" className="w-20 h-20 object-cover rounded-md shrink-0 bg-slate-200" />
                        <div className="flex-1 min-w-0 space-y-1.5">
                            <input type="text" value={im.alt} maxLength={LIMITS.short} onChange={e => update(cur => cur.map((x, k) => (k === i ? { ...x, alt: e.target.value } : x)))} className="input-style text-sm" placeholder="Descrizione della foto" aria-label={`Testo alternativo foto ${i + 1}`} />
                            {withCaption && (
                                <input type="text" value={im.caption || ''} maxLength={LIMITS.short} onChange={e => update(cur => cur.map((x, k) => (k === i ? { ...x, caption: e.target.value } : x)))} className="input-style text-sm" placeholder="Didascalia (facoltativa)" aria-label={`Didascalia foto ${i + 1}`} />
                            )}
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                            <button type="button" onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 rounded text-gray-500 hover:bg-white disabled:opacity-30" aria-label="Sposta prima"><ArrowLeft className="w-4 h-4" /></button>
                            <button type="button" onClick={() => move(i, 1)} disabled={i === items.length - 1} className="p-1.5 rounded text-gray-500 hover:bg-white disabled:opacity-30" aria-label="Sposta dopo"><ArrowRight className="w-4 h-4" /></button>
                            <button type="button" onClick={() => update(cur => cur.filter((_, k) => k !== i))} className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-white" aria-label="Rimuovi foto"><Trash2 className="w-4 h-4" /></button>
                        </div>
                    </li>
                ))}
            </ul>
            {items.length < max && (
                <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="btn-secondary text-sm w-full justify-center items-center mt-2 flex gap-2 disabled:opacity-60">
                    {busy
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> {queue && queue.total > 1 ? `Foto ${Math.min(queue.done + 1, queue.total)}/${queue.total}` : 'Caricamento'}{progress > 0 && progress < 100 ? ` · ${progress}%` : '…'}</>
                        : <><Plus className="w-4 h-4" /> Aggiungi foto</>}
                </button>
            )}
            <p className="text-[11px] text-gray-400 mt-1">Le foto grandi vengono ridotte automaticamente prima del caricamento.</p>
        </div>
    );
};

// ─── Scrivi con AI ────────────────────────────────────────────────────────────

/**
 * "✨ Scrivi con AI" (AxiomAI): visibile solo al titolare con l'assistente attivo.
 * Apre un piccolo riquadro con note facoltative e tono, poi passa il risultato al chiamante.
 */
export const AiAssist: React.FC<{
    kind: AiLandingTextKind;
    /** true se c'è già del testo: chiede conferma prima di sostituirlo. */
    hasText: boolean;
    onResult: (r: { title: string; text: string }) => void;
}> = ({ kind, hasText, onResult }) => {
    const { aiEnabled, venueName } = useEditorEnv();
    const { addNotification } = useNotification();
    const [open, setOpen] = useState(false);
    const [notes, setNotes] = useState('');
    const [tone, setTone] = useState<AiLandingTone>('classico');
    const [busy, setBusy] = useState(false);
    if (!aiEnabled) return null;

    const run = async () => {
        const name = venueName.trim();
        if (!name) {
            addNotification({ message: 'Indica prima il nome del locale (tab Contenuti)', type: 'error' });
            return;
        }
        setBusy(true);
        const r = await generateLandingTextApi({ kind, venueName: name.slice(0, 120), notes: notes.trim() || undefined, tone });
        setBusy(false);
        const data = r.success ? r.data : null;
        if (!data || (!data.text?.trim() && !data.title?.trim())) {
            addNotification({ message: r.message || "L'assistente AI non è disponibile in questo momento", type: 'error' });
            return;
        }
        if (hasText && !window.confirm("Sostituire il testo attuale con quello scritto dall'AI?")) return;
        onResult({ title: data.title || '', text: data.text || '' });
        setOpen(false);
        addNotification({ message: 'Testo scritto: rileggilo prima di salvare', type: 'success' });
    };

    if (!open) {
        return (
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors whitespace-nowrap"
                title="AxiomAI scrive una proposta partendo dal nome del locale e dalle tue note"
            >
                ✨ Scrivi con AI
            </button>
        );
    }

    return (
        <div className="w-full mt-1 p-3 rounded-lg border border-violet-200 bg-violet-50/60 space-y-2">
            <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-violet-800">✨ AxiomAI</p>
                <button type="button" onClick={() => setOpen(false)} className="p-1 text-violet-500 hover:text-violet-800" aria-label="Chiudi"><X className="w-4 h-4" /></button>
            </div>
            <textarea
                value={notes}
                maxLength={600}
                rows={2}
                onChange={e => setNotes(e.target.value)}
                className="input-style text-sm"
                placeholder="Note facoltative: cucina, specialità, atmosfera, avviso da dare… L'AI non inventa premi né date."
                aria-label="Note per l'AI"
            />
            <div className="flex flex-wrap items-center gap-2">
                <select aria-label="Tono" value={tone} onChange={e => setTone(e.target.value as AiLandingTone)} disabled={busy} className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white text-gray-600">
                    <option value="classico">Classico</option>
                    <option value="elegante">Elegante</option>
                    <option value="semplice">Semplice</option>
                    <option value="giovane">Giovane</option>
                </select>
                <button type="button" onClick={run} disabled={busy} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-60">
                    {busy ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Sto scrivendo…</> : 'Genera'}
                </button>
            </div>
        </div>
    );
};
