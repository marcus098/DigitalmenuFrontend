import React, { useEffect, useMemo } from 'react';
import { getMenuTokens, tokensToCssVars } from '../../Client/menuTheme';
import { usePreviewStyles } from '../../Client/usePreviewStyles';
import { buildGoogleFontsHref } from '../../Utilities/fonts';

/**
 * Wraps the client (customer-facing) routes and injects menu CSS variables on
 * a single root element. All descendants read `var(--menu-bg)` etc. without
 * touching DataContext themselves. Also keeps the document body background
 * matched so navigation does not flash white.
 *
 * Quando l'app è renderizzata dentro un iframe (Dashboard → Layout) i campi
 * dello style salvato vengono sovrascritti in tempo reale dal draftTheme via
 * postMessage — vedi `usePreviewStyles`.
 */
const MenuThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const styles = usePreviewStyles();

    const tokens = useMemo(() => getMenuTokens(styles), [styles]);
    const cssVars = useMemo(() => tokensToCssVars(tokens), [tokens]);

    // Body background follows the menu bg so back/forward navigation doesn't
    // flash the default white. Reset on unmount.
    useEffect(() => {
        const prev = document.body.style.backgroundColor;
        document.body.style.backgroundColor = tokens.bg;
        return () => { document.body.style.backgroundColor = prev; };
    }, [tokens.bg]);

    // Carica dinamicamente i font Google necessari: quello scelto dall'utente
    // (styles.font) + Permanent Marker se un template lo richiede come accent.
    const userFontKey = (styles?.font || '').trim();
    useEffect(() => {
        const keys: string[] = [];
        if (userFontKey) keys.push(userFontKey);
        if (tokens.fontAccent && tokens.fontAccent.includes('Permanent Marker')) keys.push('permanent-marker');
        const href = buildGoogleFontsHref(keys);
        if (!href) return;
        const id = `menu-fonts-${keys.join('-')}`;
        if (document.getElementById(id)) return;
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = href;
        document.head.appendChild(link);
    }, [userFontKey, tokens.fontAccent]);

    return (
        <div style={cssVars as React.CSSProperties}>
            {children}
        </div>
    );
};

export default MenuThemeProvider;
