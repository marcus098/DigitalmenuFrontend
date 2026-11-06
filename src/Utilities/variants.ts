import {ProductCard, ProductDto, VariantChoice, VariantGroup} from "../types";
import {getProductAllergens, normalizeAllergenIds} from "./Utilities";

/**
 * Gruppi di varianti del prodotto (impasto, mozzarella, ...): selezione, prezzo, allergeni e identità
 * della riga di carrello. Contratto: docs/VARIANTI_PRODOTTO.md nel backend.
 */

/** Scelta inviata al server per un gruppo (gruppi omessi = scelta predefinita). */
export interface VariantSelection {
    groupId: string
    choiceId: string
}

/** Riga del carrello (cookie): ProductCard + varianti scelte. Le righe salvate prima delle varianti non le hanno. */
export interface CartLine extends ProductCard {
    variants?: VariantSelection[]
}

/** groupId → choiceId */
export type VariantSelectionMap = Record<string, string>

/** Variante pronta da mostrare (carrello: dal catalogo; comanda: snapshot del server). */
export interface VariantLabel {
    groupId: string
    groupName: string
    choiceId: string
    choiceName: string
    priceDelta: number
    highlight: boolean
}

/** Gruppi validi del prodotto (array mai null, gruppi senza scelte scartati). */
export const getVariantGroups = (product: Pick<ProductDto, 'variantGroups'> | null | undefined): VariantGroup[] =>
    Array.isArray(product?.variantGroups)
        ? product!.variantGroups!.filter(g => g && g.id && Array.isArray(g.choices) && g.choices.length > 0)
        : [];

const defaultChoice = (g: VariantGroup): VariantChoice =>
    g.choices.find(c => c.isDefault) ?? g.choices[0];

/** Predefinita se disponibile, altrimenti la prima disponibile (o comunque la predefinita se è tutto esaurito). */
const preferredChoice = (g: VariantGroup): VariantChoice => {
    const def = defaultChoice(g);
    if (def.available !== false) return def;
    return g.choices.find(c => c.available !== false) ?? def;
};

export const defaultVariantSelection = (product: ProductDto | null | undefined): VariantSelectionMap => {
    const out: VariantSelectionMap = {};
    getVariantGroups(product).forEach(g => { out[g.id] = preferredChoice(g).id; });
    return out;
};

/** Completa una selezione parziale (es. riga di un vecchio carrello) con le predefinite e scarta id sconosciuti. */
export const completeSelection = (product: ProductDto | null | undefined, selection?: VariantSelectionMap | VariantSelection[]): VariantSelectionMap => {
    const map: VariantSelectionMap = Array.isArray(selection)
        ? Object.fromEntries(selection.map(s => [s.groupId, s.choiceId]))
        : {...(selection ?? {})};
    const out: VariantSelectionMap = {};
    getVariantGroups(product).forEach(g => {
        const wanted = map[g.id];
        out[g.id] = g.choices.some(c => c.id === wanted) ? wanted : defaultChoice(g).id;
    });
    return out;
};

/** Scelte effettive (oggetti del catalogo) nell'ordine dei gruppi. */
export const chosenChoices = (product: ProductDto | null | undefined, selection: VariantSelectionMap): { group: VariantGroup; choice: VariantChoice }[] =>
    getVariantGroups(product).map(g => ({
        group: g,
        choice: g.choices.find(c => c.id === selection[g.id]) ?? defaultChoice(g),
    }));

/** Somma dei supplementi (€) delle scelte. */
export const variantsSupplement = (product: ProductDto | null | undefined, selection: VariantSelectionMap): number =>
    chosenChoices(product, selection).reduce((s, {choice}) => s + (Number(choice.priceDelta) || 0), 0);

/** Una scelta esaurita è selezionata (o un gruppo è tutto esaurito): il prodotto non si può aggiungere così. */
export const selectionHasUnavailable = (product: ProductDto | null | undefined, selection: VariantSelectionMap): boolean =>
    chosenChoices(product, selection).some(({choice}) => choice.available === false);

export const selectionToPayload = (selection: VariantSelectionMap): VariantSelection[] =>
    Object.keys(selection).sort().map(groupId => ({groupId, choiceId: selection[groupId]}));

/** Varianti da inviare al server per una riga di carrello ([] = tutte predefinite, anche per i carrelli vecchi). */
export const lineVariantsPayload = (line: CartLine): VariantSelection[] =>
    Array.isArray(line.variants)
        ? line.variants.filter(v => v && v.groupId && v.choiceId).map(v => ({groupId: v.groupId, choiceId: v.choiceId}))
        : [];

/** Etichette delle varianti di una riga di carrello, coi nomi (già tradotti) del catalogo. */
export const lineVariantLabels = (product: ProductDto | null | undefined, line: CartLine): VariantLabel[] =>
    chosenChoices(product, completeSelection(product, line.variants)).map(({group, choice}) => ({
        groupId: group.id,
        groupName: group.name,
        choiceId: choice.id,
        choiceName: choice.name,
        priceDelta: Number(choice.priceDelta) || 0,
        highlight: !!choice.highlight,
    }));

/**
 * Identità della riga: stessa riga solo se prodotto, formato, varianti, extra, rimozioni e nota coincidono.
 * Le righe vecchie senza varianti hanno "var=" vuoto e restano raggiungibili.
 */
export const cartLineKey = (line: CartLine): string => {
    const plus = [...(line.ingredientsPlus ?? [])].sort((a, b) => a - b).join(",");
    const minus = [...(line.ingredientsMinus ?? [])].sort((a, b) => a - b).join(",");
    const variants = lineVariantsPayload(line)
        .sort((a, b) => a.groupId.localeCompare(b.groupId))
        .map(v => `${v.groupId}:${v.choiceId}`).join(",");
    const note = (line.note ?? "").trim();
    return `id=${line.id}|opt=${line.optionName}|var=${variants}|plus=${plus}|minus=${minus}|note=${note}`;
};

// ── Allergeni ────────────────────────────────────────────────────────────────

export interface VariantAllergenSummary {
    effective: number[]
    traces: number[]
    frozen: boolean
    /** Etichette dietetiche delle scelte (es. "senza-lattosio"), senza duplicati */
    dietaryTags: string[]
}

type IngredientsLookup = Map<number, { allergens?: number[]; frozen?: boolean }>;

/**
 * Allergeni di una combinazione (regole approvate, docs/VARIANTI_PRODOTTO.md):
 * effettivi = (prodotto + ingredienti [+ extra scelti]) − removesAllergens + addsAllergens;
 * un allergene tolto finisce nelle tracce salvo certifiedFree.
 */
export const variantAllergens = (
    product: ProductDto | null | undefined,
    ingredientsMap: IngredientsLookup,
    selection?: VariantSelectionMap,
    extraIngredientIds: number[] = [],
): VariantAllergenSummary => {
    if (!product) return {effective: [], traces: [], frozen: false, dietaryTags: []};
    const ingredients = Array.from(new Set([...(product.ingredients ?? []), ...extraIngredientIds]));
    const base = getProductAllergens({...product, ingredients}, ingredientsMap);
    const choices = chosenChoices(product, completeSelection(product, selection)).map(c => c.choice);

    const removed = new Set<number>();
    const removedToTraces = new Set<number>();
    choices.forEach(c => normalizeAllergenIds(c.removesAllergens).forEach(id => {
        if (!base.effective.includes(id)) return;
        removed.add(id);
        if (!c.certifiedFree) removedToTraces.add(id);
    }));
    const added = normalizeAllergenIds(choices.flatMap(c => c.addsAllergens ?? []));
    const effective = normalizeAllergenIds([...base.effective.filter(id => !removed.has(id)), ...added]);
    const traces = normalizeAllergenIds([...base.traces, ...Array.from(removedToTraces)]).filter(id => !effective.includes(id));
    const dietaryTags = Array.from(new Set(choices.flatMap(c => c.dietaryTags ?? []).filter(Boolean)));
    return {effective, traces, frozen: base.frozen, dietaryTags};
};

/**
 * Prima combinazione di scelte disponibili che evita gli allergeni filtrati (null = nessuna).
 * Le scelte predefinite vengono provate per prime, così si cambia il meno possibile.
 */
export const findCompatibleSelection = (
    product: ProductDto | null | undefined,
    ingredientsMap: IngredientsLookup,
    avoid: number[],
): VariantSelectionMap | null => {
    if (!product) return null;
    const defaults = defaultVariantSelection(product);
    const ok = (sel: VariantSelectionMap) => {
        const {effective} = variantAllergens(product, ingredientsMap, sel);
        return !avoid.some(a => effective.includes(a));
    };
    if (avoid.length === 0) return defaults;
    const groups = getVariantGroups(product);
    if (groups.length === 0) return ok(defaults) ? defaults : null;

    const ordered = groups.map(g => {
        const avail = g.choices.filter(c => c.available !== false);
        const pref = preferredChoice(g);
        return [pref, ...avail.filter(c => c.id !== pref.id)].filter(c => c.available !== false);
    });
    if (ordered.some(list => list.length === 0)) return null;

    let budget = 20000; // 6 gruppi x 12 scelte al massimo: limite di sicurezza
    const current: VariantSelectionMap = {};
    const walk = (i: number): VariantSelectionMap | null => {
        if (budget-- <= 0) return null;
        if (i === groups.length) return ok(current) ? {...current} : null;
        for (const c of ordered[i]) {
            current[groups[i].id] = c.id;
            const found = walk(i + 1);
            if (found) return found;
        }
        return null;
    };
    return walk(0);
};

/** Le scelte della selezione che differiscono dalla predefinita (per "disponibile senza glutine" nel menu filtrato). */
export const nonDefaultChoices = (product: ProductDto | null | undefined, selection: VariantSelectionMap): VariantChoice[] =>
    chosenChoices(product, selection).filter(({group, choice}) => defaultChoice(group).id !== choice.id).map(c => c.choice);

// ── Formattazione ────────────────────────────────────────────────────────────

const LOCALES: Record<string, string> = {it: 'it-IT', en: 'en-IE', de: 'de-DE', fr: 'fr-FR', es: 'es-ES', nl: 'nl-NL', pl: 'pl-PL', pt: 'pt-PT', zh: 'zh-CN'};

/** "+2,00 €" (supplemento con segno, nella lingua del menu). */
export const formatSupplement = (amount: number, lang = 'it'): string => {
    const abs = new Intl.NumberFormat(LOCALES[lang] ?? 'it-IT', {style: 'currency', currency: 'EUR'}).format(Math.abs(amount));
    return `${amount < 0 ? '−' : '+'}${abs}`;
};

/** "7,00 €" (prezzo pieno del formato, stesso stile dei supplementi). */
export const formatPrice = (amount: number, lang = 'it'): string =>
    new Intl.NumberFormat(LOCALES[lang] ?? 'it-IT', {style: 'currency', currency: 'EUR'}).format(amount);

/**
 * Nomi di gruppi e scelte nella lingua del menu. Le traduzioni arrivano dal sistema esistente
 * (texts.VARIANT[idProdotto]["gruppo"] e ["gruppo/scelta"]); quelle mancanti restano in italiano.
 */
export const translateVariantGroups = (groups: VariantGroup[] | undefined, texts?: Record<string, string | undefined> | null): VariantGroup[] | undefined => {
    if (!groups || !texts) return groups;
    return groups.map(g => ({
        ...g,
        name: texts[g.id] || g.name,
        choices: (g.choices ?? []).map(c => ({...c, name: texts[`${g.id}/${c.id}`] || c.name})),
    }));
};
