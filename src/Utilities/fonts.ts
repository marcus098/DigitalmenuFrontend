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
    /** Font ormai "da AI" (Inter, Poppins, Playfair…): restano validi per i locali che li hanno già scelti
     *  ma non vengono più proposti nel menu a tendina. */
    legacy?: boolean;
}

export const AVAILABLE_FONTS: FontOption[] = [
    { key: 'system',           name: 'Sistema',                       family: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', google: null },
    // Proposti: caratteri con una storia tipografica precisa, lontani dai soliti default
    { key: 'spectral',         name: 'Spectral (libro, leggibile)',   family: 'Spectral, Georgia, serif',                                  google: 'Spectral:wght@400;500;700' },
    { key: 'bitter',           name: 'Bitter (slab da trattoria)',    family: 'Bitter, Georgia, serif',                                    google: 'Bitter:wght@400;500;700' },
    { key: 'libre-caslon',     name: 'Libre Caslon (classico)',       family: '"Libre Caslon Text", Georgia, serif',                       google: 'Libre+Caslon+Text:wght@400;700' },
    { key: 'young-serif',      name: 'Young Serif (caldo, anni Settanta)', family: '"Young Serif", Georgia, serif',                           google: 'Young+Serif' },
    { key: 'alegreya-sans',    name: 'Alegreya Sans (umanista)',      family: '"Alegreya Sans", system-ui, sans-serif',                    google: 'Alegreya+Sans:wght@400;500;700' },
    { key: 'schibsted',        name: 'Schibsted Grotesk (svizzero)',  family: '"Schibsted Grotesk", system-ui, sans-serif',                google: 'Schibsted+Grotesk:wght@400;500;700' },
    { key: 'chivo',            name: 'Chivo (bar, listino)',          family: 'Chivo, system-ui, sans-serif',                              google: 'Chivo:wght@400;500;700' },
    { key: 'big-shoulders',    name: 'Big Shoulders (insegna)',       family: '"Big Shoulders Text", sans-serif',                         google: 'Big+Shoulders+Text:wght@400;600;800' },
    { key: 'courier-prime',    name: 'Courier Prime (macchina da scrivere)', family: '"Courier Prime", "Courier New", monospace',          google: 'Courier+Prime:wght@400;700' },
    { key: 'patrick-hand',     name: 'Patrick Hand (lavagna)',        family: '"Patrick Hand", cursive',                                   google: 'Patrick+Hand' },
    // Storici: non più proposti, validi per chi li usa già
    { key: 'nunito',           name: 'Nunito (caldo)',                family: 'Nunito, system-ui, sans-serif',                             google: 'Nunito:wght@400;600;700;800' },
    { key: 'lora',             name: 'Lora (serif morbido)',          family: 'Lora, Georgia, serif',                                      google: 'Lora:wght@400;500;700' },
    { key: 'dm-sans',          name: 'DM Sans (moderno)',             family: '"DM Sans", system-ui, sans-serif',                          google: 'DM+Sans:wght@400;500;600;700', legacy: true },
    { key: 'inter',            name: 'Inter (pulito)',                family: 'Inter, system-ui, sans-serif',                              google: 'Inter:wght@400;500;600;700', legacy: true },
    { key: 'poppins',          name: 'Poppins (geometrico)',          family: 'Poppins, system-ui, sans-serif',                            google: 'Poppins:wght@400;500;600;700', legacy: true },
    { key: 'lato',             name: 'Lato (versatile)',              family: 'Lato, system-ui, sans-serif',                               google: 'Lato:wght@400;700;900', legacy: true },
    { key: 'playfair',         name: 'Playfair (serif elegante)',     family: '"Playfair Display", Georgia, serif',                        google: 'Playfair+Display:wght@400;500;700;900', legacy: true },
    { key: 'cormorant',        name: 'Cormorant (editoriale)',        family: '"Cormorant Garamond", Georgia, serif',                      google: 'Cormorant+Garamond:wght@400;500;600;700', legacy: true },
    { key: 'oswald',           name: 'Oswald (condensato)',           family: 'Oswald, sans-serif',                                        google: 'Oswald:wght@400;500;600;700', legacy: true },
    { key: 'bebas-neue',       name: 'Bebas Neue (insegna)',          family: '"Bebas Neue", sans-serif',                                  google: 'Bebas+Neue', legacy: true },
    { key: 'caveat',           name: 'Caveat (manoscritto)',          family: 'Caveat, cursive',                                           google: 'Caveat:wght@400;500;700', legacy: true },
    { key: 'permanent-marker', name: 'Permanent Marker (graffito)',   family: '"Permanent Marker", cursive',                               google: 'Permanent+Marker', legacy: true },
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
