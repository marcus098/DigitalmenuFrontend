import type { CategoryDto, IngredientDto, ProductDto } from '../../../types';
import type { PublicMenuTranslation } from '../../../Utilities/translationApi';
import { defaultVariantSelection, getVariantGroups, translateVariantGroups, variantAllergens } from '../../../Utilities/variants';

/**
 * Dati del menu da stampare (Dashboard → Template → "Scarica menu in PDF").
 * Funzioni pure: niente DOM, così si possono provare anche fuori dal browser.
 */

export type AllergenStyle = 'numbers' | 'names';

export interface MenuPdfOptions {
    /** Includere piatti e categorie esauriti (marcati "Esaurito"). Default: no. */
    includeSoldOut: boolean;
    /** Foto dei piatti (solo impaginazioni a schede / griglia / elenco con foto). */
    includeImages: boolean;
    allergenStyle: AllergenStyle;
    /** 'it' oppure una lingua tradotta del menu. */
    lang: string;
}

export interface PdfPrice {
    /** Nome del formato ("Piccola", "0,75 l"); vuoto se il piatto ha un solo prezzo. */
    label: string;
    price: number;
}

export interface PdfVariantGroup {
    name: string;
    choices: { name: string; delta: number; soldOut: boolean }[];
}

export interface PdfProduct {
    id: number;
    name: string;
    description: string;
    prices: PdfPrice[];
    variants: PdfVariantGroup[];
    allergens: number[];
    traces: number[];
    frozen: boolean;
    tags: number[];
    image?: string;
    soldOut: boolean;
}

export interface PdfCategory {
    id: number;
    name: string;
    description: string;
    soldOut: boolean;
    products: PdfProduct[];
}

export interface PdfMenuData {
    categories: PdfCategory[];
    /** Allergeni presenti nel menu stampato (per la legenda numerata). */
    usedAllergens: number[];
    hasFrozen: boolean;
}

const DESCRIPTION_MAX = 260;

/** Descrizione breve: il PDF non è il posto per i romanzi (taglia all'ultima parola intera). */
export function shortDescription(text: string | undefined | null): string {
    const t = (text || '').replace(/\s+/g, ' ').trim();
    if (t.length <= DESCRIPTION_MAX) return t;
    const cut = t.slice(0, DESCRIPTION_MAX);
    const space = cut.lastIndexOf(' ');
    return `${(space > 160 ? cut.slice(0, space) : cut).replace(/[\s,.;:]+$/, '')}…`;
}

export function buildPdfMenu(
    categoriesMap: Map<number, CategoryDto>,
    productsMap: Map<number, ProductDto>,
    ingredientsMap: Map<number, IngredientDto>,
    options: Pick<MenuPdfOptions, 'includeSoldOut' | 'includeImages'>,
    translation?: PublicMenuTranslation | null,
): PdfMenuData {
    const t = translation?.texts;
    const tr = (type: 'CATEGORY' | 'PRODUCT', id: number) => t?.[type]?.[String(id)];
    const variantTexts = (id: number) =>
        (t as Record<string, Record<string, Record<string, string>> | undefined> | undefined)?.VARIANT?.[String(id)];

    const used = new Set<number>();
    let hasFrozen = false;

    const categories = Array.from(categoriesMap.values())
        .filter(c => c.id > 0)
        .sort((a, b) => (a.progressiveNumber ?? 0) - (b.progressiveNumber ?? 0))
        .filter(c => options.includeSoldOut || c.available !== false)
        .map((c): PdfCategory => {
            const products = Array.from(productsMap.values())
                .filter(p => p.idCategory === c.id)
                .sort((a, b) => (a.positionProgressive ?? 0) - (b.positionProgressive ?? 0))
                .filter(p => options.includeSoldOut || p.available !== false)
                .map((p): PdfProduct => {
                    const ptr = tr('PRODUCT', p.id);
                    const info = variantAllergens(p, ingredientsMap, defaultVariantSelection(p));
                    info.effective.forEach(id => used.add(id));
                    info.traces.forEach(id => used.add(id));
                    if (info.frozen) hasFrozen = true;
                    const groups = translateVariantGroups(getVariantGroups(p), variantTexts(p.id)) ?? [];
                    const opts = (p.options ?? []).filter(o => o && Number.isFinite(Number(o.price)));
                    return {
                        id: p.id,
                        name: ptr?.NAME || p.name,
                        description: shortDescription(ptr?.DESCRIPTION ?? p.description),
                        prices: opts.length > 1
                            ? opts.map(o => ({ label: (o.name || '').trim(), price: Number(o.price) }))
                            : opts.length === 1 ? [{ label: '', price: Number(opts[0].price) }] : [],
                        variants: groups.map(g => ({
                            name: g.name,
                            choices: g.choices
                                .filter(ch => options.includeSoldOut || ch.available !== false)
                                .map(ch => ({ name: ch.name, delta: Number(ch.priceDelta) || 0, soldOut: ch.available === false })),
                        })).filter(g => g.choices.length > 1 || g.choices.some(ch => ch.delta !== 0)),
                        allergens: info.effective,
                        traces: info.traces,
                        frozen: info.frozen,
                        tags: p.tags ?? [],
                        image: options.includeImages && p.image ? p.image : undefined,
                        soldOut: p.available === false,
                    };
                });
            const ctr = tr('CATEGORY', c.id);
            return {
                id: c.id,
                name: ctr?.NAME || c.name,
                description: shortDescription(ctr?.DESCRIPTION ?? c.description),
                soldOut: c.available === false,
                products,
            };
        })
        .filter(c => c.products.length > 0);

    return {
        categories,
        usedAllergens: Array.from(used).sort((a, b) => a - b),
        hasFrozen,
    };
}
