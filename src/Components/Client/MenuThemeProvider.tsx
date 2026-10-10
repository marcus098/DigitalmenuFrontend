import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { getMenuTokens, MenuTokens, tokensToCssVars, TEMPLATE_FONT_KEY } from '../../Client/menuTheme';
import { usePreviewStyles } from '../../Client/usePreviewStyles';
import { buildGoogleFontsHref } from '../../Utilities/fonts';
import { buildTemplateFontsHref, getTemplateDef } from '../../Client/menuTemplates';

/**
 * Wraps the client (customer-facing) routes and injects menu CSS variables on
 * a single root element. All descendants read `var(--menu-bg)` etc. without
 * touching DataContext themselves. Also keeps the document body background
 * matched so navigation does not flash white.
 *
 * Espone anche i token (incluso il "look" del template) via `useMenuLook()`
 * per i componenti che cambiano impaginazione in base al template.
 *
 * Quando l'app è renderizzata dentro un iframe (Dashboard → Layout) i campi
 * dello style salvato vengono sovrascritti in tempo reale dal draftTheme via
 * postMessage — vedi `usePreviewStyles`.
 */

const MenuLookContext = createContext<MenuTokens | null>(null);

/** Token del tema corrente. Fuori dal provider ricade sul template di default. */
export function useMenuLook(): MenuTokens {
    const ctx = useContext(MenuLookContext);
    return ctx ?? getMenuTokens(null);
}

function ensureStylesheet(id: string, href: string | null) {
    if (!href || document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    document.head.appendChild(link);
}

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

    // Font del template (abbinamento titoli/testo/prezzi) + eventuale font scelto
    // dall'utente in dashboard. Caricati on-demand da Google Fonts.
    const userFontKey = (styles?.font || '').trim();
    useEffect(() => {
        ensureStylesheet(`menu-tpl-fonts-${tokens.template}`, buildTemplateFontsHref([getTemplateDef(tokens.template)]));
        if (userFontKey && userFontKey !== TEMPLATE_FONT_KEY) {
            ensureStylesheet(`menu-fonts-${userFontKey}`, buildGoogleFontsHref([userFontKey]));
        }
    }, [userFontKey, tokens.template]);

    return (
        <MenuLookContext.Provider value={tokens}>
            <div
                style={cssVars as React.CSSProperties}
                data-menu-template={tokens.template}
                data-menu-texture={tokens.look.texture}
                data-menu-dark={tokens.isDark ? 'true' : 'false'}
            >
                {children}
            </div>
        </MenuLookContext.Provider>
    );
};

export default MenuThemeProvider;
