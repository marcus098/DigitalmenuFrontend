import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    AlertTriangle, ChevronDown, ChevronUp, Layers, Plus, ShieldCheck, Tag, Trash2, X,
} from "lucide-react";
import { VariantChoice, VariantGroup } from "../../types";
import { allergens as ALLERGENS, allergenById } from "../../Utilities/Utilities";
import {
    DIETARY_TAG_SUGGESTIONS, MAX_VARIANT_CHOICES, MAX_VARIANT_GROUPS, VARIANT_PRESETS, VariantPresetKey,
    emptyChoice, formatDelta, isLactoseMisuse, uniqueSlug,
} from "./variantUtils";

interface VariantGroupsEditorProps {
    groups: VariantGroup[];
    onChange: (groups: VariantGroup[]) => void;
    /** Gruppi già salvati sul server: i loro id non cambiano mai, anche se rinomini */
    persisted: VariantGroup[];
    /** Allergeni effettivi del prodotto (prodotto + ingredienti): evidenziati tra quelli da togliere */
    productAllergens: number[];
    /** Errori di validazione da mostrare (stessi controlli del backend) */
    errors: string[];
}

const move = <T,>(list: T[], from: number, to: number): T[] => {
    if (to < 0 || to >= list.length) return list;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
};

const toggleId = (list: number[], id: number) =>
    list.includes(id) ? list.filter(i => i !== id) : [...list, id].sort((a, b) => a - b);

/** Input del supplemento: accetta la virgola, lo zero e i negativi senza saltare mentre si digita. */
const fmtDelta = (v: number) => Number.isInteger(v) ? String(v) : v.toFixed(2).replace(".", ",");

const DeltaInput: React.FC<{ value: number; onChange: (v: number) => void; id?: string }> = ({ value, onChange, id }) => {
    const [text, setText] = useState(fmtDelta(value));
    useEffect(() => {
        const parsed = Number(text.replace(",", "."));
        if (!Number.isFinite(parsed) || Math.abs(parsed - value) > 0.0001) setText(fmtDelta(value));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);
    return (
        <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">€</span>
            <input
                id={id}
                type="text"
                inputMode="decimal"
                value={text}
                onChange={e => {
                    const raw = e.target.value.replace(/[^0-9,.\-]/g, "");
                    setText(raw);
                    const n = Number(raw.replace(",", "."));
                    if (raw !== "" && raw !== "-" && Number.isFinite(n)) onChange(Math.round(n * 100) / 100);
                    if (raw === "") onChange(0);
                }}
                onBlur={() => setText(fmtDelta(value))}
                className="input-style !pl-7 !py-2 text-sm"
                aria-label="Supplemento in euro"
                placeholder="0"
            />
        </div>
    );
};

/** Interruttore compatto (stesso linguaggio visivo di PillToggle, più piccolo per le righe). */
const MiniSwitch: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; tone?: "primary" | "red" | "rose" }> = ({ checked, onChange, label, tone = "primary" }) => {
    const on = tone === "red" ? "bg-red-600" : tone === "rose" ? "bg-emerald-500" : "bg-primary";
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            onClick={() => onChange(!checked)}
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-700 select-none"
        >
            <span className={`relative w-8 h-[18px] rounded-full transition-colors ${checked ? on : "bg-gray-300"}`}>
                <span className={`absolute top-[2px] left-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[14px]" : ""}`} />
            </span>
            {label}
        </button>
    );
};

const AllergenChips: React.FC<{
    selected: number[];
    onToggle: (id: number) => void;
    tone: "remove" | "add";
    highlightIds?: number[];
}> = ({ selected, onToggle, tone, highlightIds = [] }) => (
    <div className="flex flex-wrap gap-1.5">
        {ALLERGENS.map(a => {
            const isOn = selected.includes(a.id);
            const inProduct = highlightIds.includes(a.id);
            return (
                <button
                    key={a.id}
                    type="button"
                    aria-pressed={isOn}
                    onClick={() => onToggle(a.id)}
                    title={a.name + (tone === "remove" && inProduct ? " (presente nel prodotto)" : "")}
                    className={`inline-flex items-center gap-1 pl-1 pr-2 py-1 rounded-full text-xs font-semibold border transition-colors ${
                        isOn
                            ? tone === "remove" ? "bg-emerald-600 border-emerald-600 text-white" : "bg-orange-500 border-orange-500 text-white"
                            : tone === "remove" && inProduct
                                ? "bg-amber-50 border-amber-300 text-amber-800 hover:border-amber-400"
                                : "bg-white border-gray-300 text-gray-600 hover:border-gray-400"
                    }`}
                >
                    <img src={a.icon} alt="" className={`w-4 h-4 rounded-full ${isOn ? "bg-white" : ""}`} />
                    {tone === "remove" && isOn ? "−" : tone === "add" && isOn ? "+" : ""}{a.short}
                </button>
            );
        })}
    </div>
);

const TagsEditor: React.FC<{ tags: string[]; onChange: (t: string[]) => void }> = ({ tags, onChange }) => {
    const [draft, setDraft] = useState("");
    const add = (raw: string) => {
        const t = raw.trim().toLowerCase().replace(/\s+/g, "-");
        if (!t || tags.includes(t)) return;
        onChange([...tags, t]);
    };
    const suggestions = DIETARY_TAG_SUGGESTIONS.filter(s => !tags.includes(s));
    return (
        <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-1.5">
                {tags.map(t => (
                    <span key={t} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-sky-100 text-sky-800 text-xs font-semibold">
                        <Tag className="w-3 h-3" />{t}
                        <button type="button" onClick={() => onChange(tags.filter(x => x !== t))} aria-label={`Rimuovi etichetta ${t}`} className="hover:text-sky-950">
                            <X className="w-3 h-3" />
                        </button>
                    </span>
                ))}
                <input
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(draft); setDraft(""); }
                    }}
                    onBlur={() => { if (draft.trim()) { add(draft); setDraft(""); } }}
                    placeholder="Nuova etichetta…"
                    className="text-xs border border-gray-300 rounded-full px-3 py-1 w-36 focus:outline-none focus:ring-2 focus:ring-primary-400/50"
                />
            </div>
            {suggestions.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] text-gray-400">Suggerite:</span>
                    {suggestions.map(s => (
                        <button key={s} type="button" onClick={() => add(s)}
                                className="px-2 py-0.5 rounded-full border border-dashed border-gray-300 text-[11px] text-gray-500 hover:border-sky-400 hover:text-sky-700">
                            + {s}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const ChoiceRow: React.FC<{
    choice: VariantChoice;
    index: number;
    count: number;
    groupKey: string;
    productAllergens: number[];
    onChange: (c: VariantChoice) => void;
    onSetDefault: () => void;
    onMove: (dir: -1 | 1) => void;
    onDelete: () => void;
}> = ({ choice, index, count, groupKey, productAllergens, onChange, onSetDefault, onMove, onDelete }) => {
    const [open, setOpen] = useState(false);
    const removes = choice.removesAllergens || [];
    const adds = choice.addsAllergens || [];
    const lactoseMisuse = isLactoseMisuse(choice);
    const delta = formatDelta(choice.priceDelta);
    const summary = [
        ...removes.map(a => ({ k: `r${a}`, t: `− ${allergenById.get(a)?.short}`, c: "bg-emerald-100 text-emerald-800" })),
        ...adds.map(a => ({ k: `a${a}`, t: `+ ${allergenById.get(a)?.short}`, c: "bg-orange-100 text-orange-800" })),
        ...choice.dietaryTags.map(t => ({ k: `t${t}`, t, c: "bg-sky-100 text-sky-800" })),
    ];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className={`rounded-lg border p-3 ${choice.isDefault ? "border-primary-300 bg-primary-50/40" : "border-gray-200 bg-white"} ${!choice.available ? "opacity-80" : ""}`}
            data-testid="variant-choice"
        >
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="flex items-center gap-2 shrink-0 cursor-pointer" title="Scelta predefinita (già selezionata per il cliente)">
                    <input type="radio" name={`default-${groupKey}`} checked={choice.isDefault} onChange={onSetDefault}
                           className="h-4 w-4 text-primary focus:ring-primary" />
                    <span className={`text-xs font-semibold sm:hidden ${choice.isDefault ? "text-primary-700" : "text-gray-500"}`}>Predefinita</span>
                </label>
                <input
                    type="text"
                    value={choice.name}
                    onChange={e => onChange({ ...choice, name: e.target.value })}
                    placeholder="Nome scelta (es. Senza glutine)"
                    className="input-style !py-2 text-sm flex-1 min-w-0"
                    aria-label="Nome scelta"
                />
                <div className="flex items-center gap-2">
                    <div className="w-28 shrink-0"><DeltaInput value={choice.priceDelta} onChange={v => onChange({ ...choice, priceDelta: v })} /></div>
                    <div className="flex items-center ml-auto sm:ml-0">
                        <button type="button" onClick={() => onMove(-1)} disabled={index === 0} aria-label="Sposta su"
                                className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"><ChevronUp className="w-4 h-4" /></button>
                        <button type="button" onClick={() => onMove(1)} disabled={index === count - 1} aria-label="Sposta giù"
                                className="p-1.5 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent"><ChevronDown className="w-4 h-4" /></button>
                        <button type="button" onClick={onDelete} aria-label="Elimina scelta"
                                className="p-1.5 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2.5 sm:pl-6">
                <MiniSwitch checked={choice.available} onChange={v => onChange({ ...choice, available: v })} label={choice.available ? "Disponibile" : "Esaurita"} tone="rose" />
                <MiniSwitch checked={choice.highlight} onChange={v => onChange({ ...choice, highlight: v })} label="Evidenzia in comanda" tone="red" />
                <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700 hover:text-primary-800">
                    Allergeni ed etichette
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
                </button>
                {!open && summary.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {summary.map(s => <span key={s.k} className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${s.c}`}>{s.t}</span>)}
                        {choice.certifiedFree && removes.length > 0 && (
                            <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-600 text-white inline-flex items-center gap-0.5"><ShieldCheck className="w-3 h-3" />certificata</span>
                        )}
                    </div>
                )}
                {choice.highlight && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-600 text-white text-[11px] font-bold uppercase tracking-wide">
                        ⚠ {choice.name || "…"}{delta && <span className="normal-case font-semibold opacity-90">{delta}</span>}
                    </span>
                )}
            </div>

            {lactoseMisuse && (
                <p className="flex items-start gap-2 mt-2.5 text-xs text-amber-900 bg-amber-50 border border-amber-300 rounded-lg p-2.5" role="alert">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-px text-amber-600" />
                    <span>
                        <strong>"Senza lattosio" non vuol dire senza latte:</strong> le proteine del latte restano, quindi l'allergene
                        <strong> Latte</strong> va lasciato. Usa l'etichetta <em>senza-lattosio</em> invece di togliere l'allergene.
                        <button type="button" className="ml-1 underline font-semibold"
                                onClick={() => onChange({
                                    ...choice,
                                    removesAllergens: removes.filter(a => a !== 7),
                                    dietaryTags: choice.dietaryTags.includes("senza-lattosio") ? choice.dietaryTags : [...choice.dietaryTags, "senza-lattosio"],
                                })}>
                            Correggi
                        </button>
                    </span>
                </p>
            )}

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-3 pt-3 border-t border-gray-100 space-y-4 sm:pl-6">
                            <div>
                                <p className="text-xs font-semibold text-gray-700 mb-1">Allergeni tolti</p>
                                <p className="text-[11px] text-gray-500 mb-2">In giallo quelli presenti nel prodotto.</p>
                                <AllergenChips selected={removes} highlightIds={productAllergens} tone="remove"
                                               onToggle={id => onChange({ ...choice, removesAllergens: toggleId(removes, id), certifiedFree: toggleId(removes, id).length ? choice.certifiedFree : false })} />
                                {removes.length > 0 && (
                                    <label className="flex items-start gap-2 mt-3 p-2.5 rounded-lg bg-slate-50 border border-slate-200 cursor-pointer">
                                        <input type="checkbox" checked={choice.certifiedFree}
                                               onChange={e => onChange({ ...choice, certifiedFree: e.target.checked })}
                                               className="mt-0.5 h-4 w-4 rounded text-emerald-600 focus:ring-emerald-500" />
                                        <span className="text-xs text-gray-700">
                                            <strong>Assenza garantita (certificata)</strong> — il locale garantisce l'assenza (es. senza glutine &lt; 20 ppm con procedure dedicate).
                                            <span className="block text-gray-500 mt-0.5">Se non spunti, l'allergene resta tra le tracce ("può contenere tracce di").</span>
                                        </span>
                                    </label>
                                )}
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-700 mb-2">Allergeni aggiunti</p>
                                <AllergenChips selected={adds} tone="add" onToggle={id => onChange({ ...choice, addsAllergens: toggleId(adds, id) })} />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-gray-700 mb-2">Etichette per il cliente</p>
                                <TagsEditor tags={choice.dietaryTags} onChange={t => onChange({ ...choice, dietaryTags: t })} />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

/**
 * Editor dei gruppi di varianti (Impasto, Mozzarella, ...): scelta singola, sempre con una predefinita.
 * Id stabili: slug del nome alla creazione; una volta salvati non cambiano più anche se rinomini.
 */
const VariantGroupsEditor: React.FC<VariantGroupsEditorProps> = ({ groups, onChange, persisted, productAllergens, errors }) => {
    const persistedGroupIds = useMemo(() => new Set(persisted.map(g => g.id)), [persisted]);
    const persistedChoiceIds = useMemo(() => {
        const m = new Map<string, Set<string>>();
        persisted.forEach(g => m.set(g.id, new Set(g.choices.map(c => c.id))));
        return m;
    }, [persisted]);

    const setGroup = (gi: number, g: VariantGroup) => onChange(groups.map((x, i) => i === gi ? g : x));

    const renameGroup = (gi: number, name: string) => {
        const g = groups[gi];
        let id = g.id;
        if (!persistedGroupIds.has(g.id)) {
            id = uniqueSlug(name, groups.filter((_, i) => i !== gi).map(x => x.id), "gruppo");
        }
        setGroup(gi, { ...g, id, name });
    };

    const updateChoice = (gi: number, ci: number, c: VariantChoice) => {
        const g = groups[gi];
        const old = g.choices[ci];
        let next = c;
        const locked = persistedChoiceIds.get(g.id)?.has(old.id) ?? false;
        if (!locked && c.name !== old.name) {
            next = { ...c, id: uniqueSlug(c.name, g.choices.filter((_, i) => i !== ci).map(x => x.id), "scelta") };
        }
        setGroup(gi, { ...g, choices: g.choices.map((x, i) => i === ci ? next : x) });
    };

    const addGroup = (preset?: VariantPresetKey) => {
        if (groups.length >= MAX_VARIANT_GROUPS) return;
        const taken = groups.map(g => g.id);
        if (preset) {
            const p = VARIANT_PRESETS[preset];
            const id = uniqueSlug(p.groupName, taken, "gruppo");
            const base = emptyChoice(uniqueSlug(p.baseChoice, [], "scelta"), p.baseChoice, true);
            const special: VariantChoice = { ...p.choice, id: uniqueSlug(p.choice.name, [base.id], "scelta"), isDefault: false };
            onChange([...groups, { id, name: p.groupName, choices: [base, special] }]);
        } else {
            const id = uniqueSlug("", taken, "gruppo");
            onChange([...groups, { id, name: "", choices: [emptyChoice("scelta", "", true), emptyChoice("scelta-2", "")] }]);
        }
    };

    const addChoice = (gi: number, preset?: VariantPresetKey) => {
        const g = groups[gi];
        if (g.choices.length >= MAX_VARIANT_CHOICES) return;
        const taken = g.choices.map(c => c.id);
        const choice: VariantChoice = preset
            ? { ...VARIANT_PRESETS[preset].choice, id: uniqueSlug(VARIANT_PRESETS[preset].choice.name, taken, "scelta"), isDefault: g.choices.length === 0 }
            : emptyChoice(uniqueSlug("", taken, "scelta"), "", g.choices.length === 0);
        setGroup(gi, { ...g, choices: [...g.choices, choice] });
    };

    const deleteChoice = (gi: number, ci: number) => {
        const g = groups[gi];
        const choices = g.choices.filter((_, i) => i !== ci);
        if (g.choices[ci]?.isDefault && choices.length > 0) choices[0] = { ...choices[0], isDefault: true };
        setGroup(gi, { ...g, choices });
    };

    return (
        <div className="space-y-4" data-testid="variant-groups-editor">
            <p className="text-sm text-gray-500">
                Gruppi a scelta singola oltre al formato, ad esempio <em>Impasto</em> (Classico / Senza glutine) o <em>Mozzarella</em> (Classica / Senza lattosio).
                Il cliente trova già selezionata la scelta predefinita; il supplemento si somma al prezzo del formato.
            </p>

            <AnimatePresence initial={false}>
                {groups.map((g, gi) => (
                    <motion.div
                        key={gi}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className="rounded-xl border border-gray-200 bg-slate-50 p-3 sm:p-4"
                        data-testid="variant-group"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <span className="hidden sm:flex w-8 h-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                                <Layers className="w-4 h-4" />
                            </span>
                            <div className="flex-1 min-w-0">
                                <input
                                    type="text"
                                    value={g.name}
                                    onChange={e => renameGroup(gi, e.target.value)}
                                    placeholder="Nome gruppo (es. Impasto)"
                                    className="input-style !py-2 font-semibold"
                                    aria-label="Nome gruppo"
                                />
                            </div>
                            <div className="flex items-center shrink-0">
                                <button type="button" onClick={() => onChange(move(groups, gi, gi - 1))} disabled={gi === 0} aria-label="Sposta gruppo su"
                                        className="p-2 rounded-md text-gray-400 hover:text-gray-700 hover:bg-white disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                                <button type="button" onClick={() => onChange(move(groups, gi, gi + 1))} disabled={gi === groups.length - 1} aria-label="Sposta gruppo giù"
                                        className="p-2 rounded-md text-gray-400 hover:text-gray-700 hover:bg-white disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                                <button type="button" onClick={() => onChange(groups.filter((_, i) => i !== gi))} aria-label="Elimina gruppo"
                                        className="p-2 rounded-md text-red-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>

                        <p className="text-[11px] text-gray-400 mb-2 px-1">
                            <span className="inline-block w-2.5 h-2.5 rounded-full border-[3px] border-primary align-middle mr-1" />scelta predefinita · supplemento in € (anche 0 o negativo)
                        </p>
                        <div className="space-y-2">
                            <AnimatePresence initial={false}>
                                {g.choices.map((c, ci) => (
                                    <ChoiceRow
                                        key={`${gi}-${ci}`}
                                        choice={c}
                                        index={ci}
                                        count={g.choices.length}
                                        groupKey={`${gi}`}
                                        productAllergens={productAllergens}
                                        onChange={nc => updateChoice(gi, ci, nc)}
                                        onSetDefault={() => setGroup(gi, { ...g, choices: g.choices.map((x, i) => ({ ...x, isDefault: i === ci })) })}
                                        onMove={dir => setGroup(gi, { ...g, choices: move(g.choices, ci, ci + dir) })}
                                        onDelete={() => deleteChoice(gi, ci)}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>

                        {g.choices.length < MAX_VARIANT_CHOICES && (
                            <div className="flex flex-wrap items-center gap-2 mt-3">
                                <button type="button" onClick={() => addChoice(gi)}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold text-primary-700 hover:bg-primary-50">
                                    <Plus className="w-4 h-4" />Aggiungi scelta
                                </button>
                                {(Object.keys(VARIANT_PRESETS) as VariantPresetKey[]).map(k => (
                                    <button key={k} type="button" onClick={() => addChoice(gi, k)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border border-dashed border-gray-300 text-gray-600 hover:border-primary-400 hover:text-primary-700">
                                        <Plus className="w-3 h-3" />{VARIANT_PRESETS[k].label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>

            {groups.length < MAX_VARIANT_GROUPS ? (
                <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={() => addGroup()}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border-2 border-dashed border-gray-300 text-sm font-semibold text-gray-600 hover:border-primary hover:text-primary transition-colors">
                        <Plus className="w-4 h-4" />Nuovo gruppo
                    </button>
                    <span className="text-xs text-gray-400">oppure da preset:</span>
                    {(Object.keys(VARIANT_PRESETS) as VariantPresetKey[]).map(k => (
                        <button key={k} type="button" onClick={() => addGroup(k)} data-testid={`preset-${k}`}
                                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white border border-gray-200 shadow-sm text-sm font-semibold text-gray-700 hover:border-primary-300 hover:text-primary-700 transition-colors">
                            <img src={k === "senza-glutine" ? "/icons/glutine.png" : "/icons/latte.png"} alt="" className="w-4 h-4" />
                            {VARIANT_PRESETS[k].label}
                        </button>
                    ))}
                </div>
            ) : (
                <p className="text-xs text-gray-500">Raggiunto il massimo di {MAX_VARIANT_GROUPS} gruppi.</p>
            )}

            {groups.length > 0 && errors.length > 0 && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="status" data-testid="variant-errors">
                    <p className="font-semibold flex items-center gap-1.5 mb-1"><AlertTriangle className="w-4 h-4" />Da sistemare prima di salvare</p>
                    <ul className="list-disc pl-5 space-y-0.5 text-xs">
                        {Array.from(new Set(errors)).map(e => <li key={e}>{e}</li>)}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default VariantGroupsEditor;
