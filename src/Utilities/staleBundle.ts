// Dopo un deploy i file JS con il vecchio hash non esistono più: una scheda aperta da prima
// fallisce al primo import dinamico ("Qualcosa è andato storto"). Si ricarica la pagina una volta sola.
const KEY = 'rf_stale_reload_at';

export const isStaleBundleError = (e: unknown): boolean => {
    const msg = e instanceof Error ? `${e.name} ${e.message}` : String(e ?? '');
    return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|ChunkLoadError|Loading chunk .* failed/i.test(msg);
};

/** Ricarica la pagina, ma non più di una volta ogni 30 s (evita cicli se il server è davvero giù). */
export const reloadForNewVersion = (): boolean => {
    try {
        const last = Number(sessionStorage.getItem(KEY) || 0);
        if (Date.now() - last < 30_000) return false;
        sessionStorage.setItem(KEY, String(Date.now()));
    } catch { /* storage non disponibile: si ricarica comunque */ }
    window.location.reload();
    return true;
};

export const installStaleBundleReload = () => {
    // Vite emette questo evento quando il preload di un chunk fallisce
    window.addEventListener('vite:preloadError', (event) => {
        if (reloadForNewVersion()) event.preventDefault();
    });
    window.addEventListener('unhandledrejection', (event) => {
        if (isStaleBundleError(event.reason)) reloadForNewVersion();
    });
};
