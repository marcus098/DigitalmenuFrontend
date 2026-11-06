// Utility per i gruppi di varianti del prodotto (vedi docs/VARIANTI_PRODOTTO.md nel backend).
import { VariantChoice, VariantGroup } from "../../types";
import { Product, SelectedVariant } from "../../ComandType";
import { normalizeAllergenIds } from "../../Utilities/Utilities";

export const MAX_VARIANT_GROUPS = 6;
export const MAX_VARIANT_CHOICES = 12;
export const ALLERGEN_MILK = 7;
export const ALLERGEN_GLUTEN = 1;

/** Slug ASCII per gli id stabili (es. "Senza glutine" → "senza-glutine"). */
export const slugify = (s: string, fallback = "voce"): string => {
    const slug = (s || "")
        .normalize("NFD").replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40)
        .replace(/-+$/g, "");
    return slug || fallback;
};

/** Slug del nome reso unico rispetto agli id già usati (suffisso -2, -3, ...). */
export const uniqueSlug = (name: string, taken: string[], fallback = "voce"): string => {
    const base = slugify(name, fallback);
    if (!taken.includes(base)) return base;
    let i = 2;
    while (taken.includes(`${base}-${i}`)) i++;
    return `${base}-${i}`;
};

export const emptyChoice = (id: string, name = "", isDefault = false): VariantChoice => ({
    id, name, priceDelta: 0, isDefault, available: true,
    removesAllergens: [], addsAllergens: [], certifiedFree: false, dietaryTags: [], highlight: false,
});

/** Preset approvati (spec "Regole allergeni"). */
export type VariantPresetKey = "senza-glutine" | "senza-lattosio";

export const VARIANT_PRESETS: Record<VariantPresetKey, { label: string; groupName: string; baseChoice: string; choice: Omit<VariantChoice, "id" | "isDefault"> }> = {
    "senza-glutine": {
        label: "Senza glutine",
        groupName: "Impasto",
        baseChoice: "Classico",
        choice: {
            name: "Senza glutine", priceDelta: 0, available: true,
            removesAllergens: [ALLERGEN_GLUTEN], addsAllergens: [], certifiedFree: false,
            dietaryTags: ["senza-glutine"], highlight: true,
        },
    },
    "senza-lattosio": {
        label: "Senza lattosio",
        groupName: "Mozzarella",
        baseChoice: "Classica",
        choice: {
            // "Senza lattosio" NON toglie l'allergene 7: le proteine del latte restano
            name: "Senza lattosio", priceDelta: 0, available: true,
            removesAllergens: [], addsAllergens: [], certifiedFree: false,
            dietaryTags: ["senza-lattosio"], highlight: true,
        },
    },
};

export const DIETARY_TAG_SUGGESTIONS = ["senza-glutine", "senza-lattosio", "vegetariano", "vegano", "piccante"];

/** La scelta parla di lattosio ma toglie il Latte: errore tipico da segnalare. */
export const isLactoseMisuse = (c: VariantChoice) =>
    /lattosio/i.test(c.name) && (c.removesAllergens || []).includes(ALLERGEN_MILK);

/** Normalizza i gruppi letti dal server (campi mancanti → default sicuri). */
export const normalizeVariantGroups = (groups?: VariantGroup[] | null): VariantGroup[] =>
    (Array.isArray(groups) ? groups : []).map(g => ({
        id: String(g.id ?? ""),
        name: g.name ?? "",
        choices: (Array.isArray(g.choices) ? g.choices : []).map(c => ({
            id: String(c.id ?? ""),
            name: c.name ?? "",
            priceDelta: Number(c.priceDelta) || 0,
            isDefault: !!c.isDefault,
            available: c.available !== false,
            removesAllergens: normalizeAllergenIds(c.removesAllergens),
            addsAllergens: normalizeAllergenIds(c.addsAllergens),
            certifiedFree: !!c.certifiedFree,
            dietaryTags: Array.isArray(c.dietaryTags) ? c.dietaryTags.filter(t => typeof t === "string" && t.trim() !== "") : [],
            highlight: !!c.highlight,
        })),
    }));

/** Stessa validazione del backend: restituisce i messaggi d'errore (vuoto = ok). */
export const validateVariantGroups = (groups: VariantGroup[]): string[] => {
    const errors: string[] = [];
    if (groups.length > MAX_VARIANT_GROUPS) errors.push(`Massimo ${MAX_VARIANT_GROUPS} gruppi di varianti`);
    const groupIds = new Set<string>();
    groups.forEach((g, gi) => {
        const label = g.name.trim() || `Gruppo ${gi + 1}`;
        if (!g.name.trim()) errors.push(`Gruppo ${gi + 1}: manca il nome`);
        if (!g.id || groupIds.has(g.id)) errors.push(`${label}: id duplicato o mancante`);
        groupIds.add(g.id);
        if (g.choices.length < 2) errors.push(`${label}: servono almeno 2 scelte`);
        if (g.choices.length > MAX_VARIANT_CHOICES) errors.push(`${label}: massimo ${MAX_VARIANT_CHOICES} scelte`);
        const defaults = g.choices.filter(c => c.isDefault).length;
        if (defaults !== 1) errors.push(`${label}: indica esattamente una scelta predefinita`);
        const choiceIds = new Set<string>();
        g.choices.forEach((c, ci) => {
            if (!c.name.trim()) errors.push(`${label}: la scelta ${ci + 1} non ha nome`);
            if (!c.id || choiceIds.has(c.id)) errors.push(`${label}: id scelta duplicato o mancante`);
            choiceIds.add(c.id);
            const all = [...(c.removesAllergens || []), ...(c.addsAllergens || [])];
            if (all.some(a => !Number.isInteger(a) || a < 1 || a > 14)) errors.push(`${label} / ${c.name || ci + 1}: allergene non valido`);
            if (!Number.isFinite(c.priceDelta)) errors.push(`${label} / ${c.name || ci + 1}: supplemento non valido`);
        });
    });
    return errors;
};

/** Pulisce i gruppi prima dell'invio (trim, allergeni normalizzati, certifiedFree solo se toglie qualcosa). */
export const serializeVariantGroups = (groups: VariantGroup[]): string =>
    JSON.stringify(groups.map(g => ({
        id: g.id,
        name: g.name.trim(),
        choices: g.choices.map(c => {
            const removes = normalizeAllergenIds(c.removesAllergens);
            return {
                id: c.id,
                name: c.name.trim(),
                priceDelta: Math.round((Number(c.priceDelta) || 0) * 100) / 100,
                isDefault: c.isDefault,
                available: c.available,
                removesAllergens: removes,
                addsAllergens: normalizeAllergenIds(c.addsAllergens),
                certifiedFree: removes.length > 0 && c.certifiedFree,
                dietaryTags: Array.from(new Set(c.dietaryTags.map(t => t.trim()).filter(Boolean))),
                highlight: c.highlight,
            };
        }),
    })));

/** Somma dei supplementi delle scelte predefinite. */
export const defaultVariantsDelta = (groups?: VariantGroup[] | null): number =>
    (groups || []).reduce((s, g) => s + (g.choices.find(c => c.isDefault)?.priceDelta ?? 0), 0);

/** Prezzo minimo e massimo considerando formati e supplementi. */
export const variantPriceRange = (formatPrices: number[], groups: VariantGroup[]) => {
    const prices = formatPrices.length ? formatPrices : [0];
    let min = Math.min(...prices);
    let max = Math.max(...prices);
    for (const g of groups) {
        if (!g.choices.length) continue;
        const deltas = g.choices.map(c => Number(c.priceDelta) || 0);
        min += Math.min(...deltas);
        max += Math.max(...deltas);
    }
    return { min: Math.round(min * 100) / 100, max: Math.round(max * 100) / 100 };
};

export interface VariantCombination {
    choices: { group: VariantGroup; choice: VariantChoice }[];
    priceDelta: number;
    allergens: number[];
    traces: number[];
}

/**
 * Allergeni effettivi di una combinazione = (prodotto + ingredienti) − tolti + aggiunti.
 * Un allergene tolto (e prima presente) finisce nelle tracce, salvo certifiedFree.
 */
export const combinationAllergens = (
    baseAllergens: number[], baseTraces: number[], choices: VariantChoice[]
): { allergens: number[]; traces: number[] } => {
    const removed = new Set<number>();
    const removedToTraces = new Set<number>();
    const added = new Set<number>();
    for (const c of choices) {
        for (const a of c.removesAllergens || []) {
            removed.add(a);
            if (!c.certifiedFree && baseAllergens.includes(a)) removedToTraces.add(a);
        }
        for (const a of c.addsAllergens || []) added.add(a);
    }
    const allergens = normalizeAllergenIds([...baseAllergens.filter(a => !removed.has(a)), ...Array.from(added)]);
    const traces = normalizeAllergenIds([...baseTraces, ...Array.from(removedToTraces)]).filter(a => !allergens.includes(a));
    return { allergens, traces };
};

/** Tutte le combinazioni (prodotto cartesiano), fino a `limit`. La prima è quella predefinita. */
export const variantCombinations = (
    groups: VariantGroup[], baseAllergens: number[], baseTraces: number[], limit = 24
): { list: VariantCombination[]; total: number } => {
    const valid = groups.filter(g => g.choices.length > 0);
    const total = valid.reduce((n, g) => n * g.choices.length, 1);
    // Ordina le scelte con la predefinita per prima, così la combinazione 0 è quella di default
    const ordered = valid.map(g => ({ g, choices: [...g.choices].sort((a, b) => Number(b.isDefault) - Number(a.isDefault)) }));
    const list: VariantCombination[] = [];
    const walk = (i: number, acc: { group: VariantGroup; choice: VariantChoice }[]) => {
        if (list.length >= limit) return;
        if (i === ordered.length) {
            const { allergens, traces } = combinationAllergens(baseAllergens, baseTraces, acc.map(a => a.choice));
            list.push({ choices: acc, priceDelta: acc.reduce((s, a) => s + (Number(a.choice.priceDelta) || 0), 0), allergens, traces });
            return;
        }
        for (const choice of ordered[i].choices) walk(i + 1, [...acc, { group: ordered[i].g, choice }]);
    };
    if (valid.length) walk(0, []);
    return { list, total: valid.length ? total : 0 };
};

/** Prezzo unitario di una riga d'ordine in euro: quello calcolato dal server se presente. */
export const lineUnitPrice = (p: Pick<Product, "productOption" | "ingredientsPlus" | "selectedVariants" | "unitPriceCents">): number => {
    if (p.unitPriceCents != null && Number.isFinite(p.unitPriceCents)) return p.unitPriceCents / 100;
    return (p.productOption?.price ?? 0)
        + (p.selectedVariants ?? []).reduce((s, v) => s + (Number(v.priceDelta) || 0), 0)
        + (p.ingredientsPlus ?? []).reduce((s, i) => s + (i?.price ?? 0), 0);
};

export const formatDelta = (delta: number): string => {
    const abs = Math.abs(delta).toFixed(2).replace(".", ",");
    return delta > 0 ? `+€${abs}` : delta < 0 ? `−€${abs}` : "";
};

export const sortVariantsForDisplay = (variants?: SelectedVariant[] | null): SelectedVariant[] =>
    [...(variants || [])].sort((a, b) => Number(b.highlight) - Number(a.highlight));
