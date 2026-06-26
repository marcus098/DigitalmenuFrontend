/**
 * Catalogo font disponibili nella dashboard.
 *
 * Ogni voce ha:
 *  - key:    valore stabile salvato in StyleDto.font
 *  - name:   etichetta umana per il dropdown
 *  - family: CSS font-family (con fallback)
 *  - google: query Google Fonts (usata per costruire il link al CDN); null = font di sistema
 *
 * Il loader (MenuThemeProvider) carica il CSS Google Fonts solo per il font scelto,
 * così evitiamo di scaricare 10 famiglie a vuoto.
 */

export interface FontOption {
    key: string;
    name: string;
    family: string;
    google: string | null;
}

export const AVAILABLE_FONTS: FontOption[] = [
    { key: 'system',           name: 'Sistema',                  family: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', google: null },
    { key: 'dm-sans',          name: 'DM Sans (moderno)',        family: '"DM Sans", system-ui, sans-serif',                         google: 'DM+Sans:wght@400;500;600;700' },
    { key: 'inter',            name: 'Inter (pulito)',           family: 'Inter, system-ui, sans-serif',                             google: 'Inter:wght@400;500;600;700' },
    { key: 'nunito',           name: 'Nunito (caldo)',           family: 'Nunito, system-ui, sans-serif',                            google: 'Nunito:wght@400;600;700;800' },
    { key: 'poppins',          name: 'Poppins (geometrico)',     family: 'Poppins, system-ui, sans-serif',                           google: 'Poppins:wght@400;500;600;700' },
    { key: 'lato',             name: 'Lato (versatile)',         family: 'Lato, system-ui, sans-serif',                              google: 'Lato:wght@400;700;900' },
    { key: 'lora',             name: 'Lora (serif morbido)',     family: 'Lora, Georgia, serif',                                     google: 'Lora:wght@400;500;700' },
    { key: 'playfair',         name: 'Playfair (serif elegante)', family: '"Playfair Display", Georgia, serif',                      google: 'Playfair+Display:wght@400;500;700;900' },
    { key: 'cormorant',        name: 'Cormorant (editoriale)',   family: '"Cormorant Garamond", Georgia, serif',                     google: 'Cormorant+Garamond:wght@400;500;600;700' },
    { key: 'oswald',           name: 'Oswald (condensato)',      family: 'Oswald, sans-serif',                                       google: 'Oswald:wght@400;500;600;700' },
    { key: 'bebas-neue',       name: 'Bebas Neue (insegna)',     family: '"Bebas Neue", sans-serif',                                 google: 'Bebas+Neue' },
    { key: 'caveat',           name: 'Caveat (manoscritto)',     family: 'Caveat, cursive',                                          google: 'Caveat:wght@400;500;700' },
    { key: 'permanent-marker', name: 'Permanent Marker (graffito)', family: '"Permanent Marker", cursive',                           google: 'Permanent+Marker' },
];

export const FONT_BY_KEY: Record<string, FontOption> =
    Object.fromEntries(AVAILABLE_FONTS.map(f => [f.key, f]));

/** Costruisce l'URL di Google Fonts CSS per un set di chiavi (deduplicato). */
export function buildGoogleFontsHref(keys: string[]): string | null {
    const families = Array.from(new Set(
        keys
            .map(k => FONT_BY_KEY[k]?.google)
            .filter((g): g is string => !!g)
    ));
    if (families.length === 0) return null;
    return `https://fonts.googleapis.com/css2?${families.map(f => `family=${f}`).join('&')}&display=swap`;
}
