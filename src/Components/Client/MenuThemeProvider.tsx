import React, { useEffect, useMemo } from 'react';
import { useData } from '../../Context/DataContext';
import { getMenuTokens, tokensToCssVars } from '../../Client/menuTheme';

/**
 * Wraps the client (customer-facing) routes and injects menu CSS variables on
 * a single root element. All descendants read `var(--menu-bg)` etc. without
 * touching DataContext themselves. Also keeps the document body background
 * matched so navigation does not flash white.
 */
const MenuThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { styles } = useData();

    const tokens = useMemo(() => getMenuTokens(styles), [styles]);
    const cssVars = useMemo(() => tokensToCssVars(tokens), [tokens]);

    // Body background follows the menu bg so back/forward navigation doesn't
    // flash the default white. Reset on unmount.
    useEffect(() => {
        const prev = document.body.style.backgroundColor;
        document.body.style.backgroundColor = tokens.bg;
        return () => { document.body.style.backgroundColor = prev; };
    }, [tokens.bg]);

    // Load Permanent Marker only if a template needs it (Strafame).
    useEffect(() => {
        if (tokens.fontAccent && tokens.fontAccent.includes('Permanent Marker')) {
            const id = 'menu-font-permanent-marker';
            if (!document.getElementById(id)) {
                const link = document.createElement('link');
                link.id = id;
                link.rel = 'stylesheet';
                link.href = 'https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Oswald:wght@400;500;600;700&family=Barlow:wght@400;500;600;700&display=swap';
                document.head.appendChild(link);
            }
        }
    }, [tokens.fontAccent]);

    return (
        <div style={cssVars as React.CSSProperties}>
            {children}
        </div>
    );
};

export default MenuThemeProvider;
