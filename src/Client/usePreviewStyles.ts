import { useEffect, useState, useMemo } from 'react';
import { useData } from '../Context/DataContext';
import type { StyleDto } from '../types';

/**
 * Live-preview bridge per il cliente.
 *
 * Quando l'app cliente è renderizzata dentro un iframe (es. il pannello
 * Dashboard → Layout) il parent invia via postMessage `{ type: 'rf-layout-preview',
 * payload }` ogni volta che cambia un campo del draftTheme. Qui ascoltiamo
 * quegli eventi e restituiamo uno `styles` "merged" che viene poi consumato
 * sia da MenuThemeProvider che da VenueLandingPage.
 *
 * In assenza di parent (pagina aperta direttamente), si comporta come un
 * passthrough di `useData().styles`.
 */
export function usePreviewStyles(): StyleDto | null | undefined {
    const { styles } = useData();
    const [override, setOverride] = useState<Record<string, any> | null>(null);

    useEffect(() => {
        // Se non siamo dentro un iframe (parent === self), non attiviamo nulla.
        if (window.parent === window) return;

        const handler = (e: MessageEvent) => {
            if (e.origin !== window.location.origin) return;
            if (e.data?.type !== 'rf-layout-preview') return;
            setOverride(e.data.payload || null);
        };
        window.addEventListener('message', handler);

        // Segnaliamo al parent che siamo pronti a ricevere il draft corrente.
        // Lo facciamo sia su mount sia su ogni navigazione (la pagina cambia, montiamo nuovamente).
        try {
            window.parent.postMessage({ type: 'rf-layout-preview-ready' }, window.location.origin);
        } catch { /* cross-origin: ignore */ }

        return () => window.removeEventListener('message', handler);
    }, []);

    return useMemo(() => {
        if (!override) return styles;
        return { ...(styles as any), ...override } as StyleDto;
    }, [styles, override]);
}
