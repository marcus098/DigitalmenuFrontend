import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

// Bump when the cookie policy changes — forces users to re-consent.
export const CONSENT_VERSION = 1;
const STORAGE_KEY = 'cookieConsent';

export type ConsentCategory = 'necessary' | 'functional' | 'analytics' | 'marketing';

export type ConsentState = {
    necessary: true;
    functional: boolean;
    analytics: boolean;
    marketing: boolean;
};

type StoredConsent = {
    version: number;
    timestamp: string;
    state: ConsentState;
};

type CookieConsentContextType = {
    hasDecided: boolean;
    state: ConsentState;
    bannerVisible: boolean;
    preferencesOpen: boolean;
    acceptAll: () => void;
    rejectAll: () => void;
    savePreferences: (partial: Omit<ConsentState, 'necessary'>) => void;
    openPreferences: () => void;
    closePreferences: () => void;
    reopenBanner: () => void;
};

const DEFAULT_STATE: ConsentState = {
    necessary: true,
    functional: false,
    analytics: false,
    marketing: false,
};

const CookieConsentContext = createContext<CookieConsentContextType | null>(null);

const readStored = (): StoredConsent | null => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as StoredConsent;
        if (parsed.version !== CONSENT_VERSION) return null;
        return parsed;
    } catch {
        return null;
    }
};

const writeStored = (state: ConsentState) => {
    const payload: StoredConsent = {
        version: CONSENT_VERSION,
        timestamp: new Date().toISOString(),
        state,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

export const CookieConsentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [stored, setStored] = useState<StoredConsent | null>(() => readStored());
    const [preferencesOpen, setPreferencesOpen] = useState(false);

    const persist = useCallback((next: ConsentState) => {
        writeStored(next);
        setStored({ version: CONSENT_VERSION, timestamp: new Date().toISOString(), state: next });
    }, []);

    const acceptAll = useCallback(() => {
        persist({ necessary: true, functional: true, analytics: true, marketing: true });
        setPreferencesOpen(false);
    }, [persist]);

    const rejectAll = useCallback(() => {
        persist({ necessary: true, functional: false, analytics: false, marketing: false });
        setPreferencesOpen(false);
    }, [persist]);

    const savePreferences = useCallback((partial: Omit<ConsentState, 'necessary'>) => {
        persist({ necessary: true, ...partial });
        setPreferencesOpen(false);
    }, [persist]);

    const openPreferences = useCallback(() => setPreferencesOpen(true), []);
    const closePreferences = useCallback(() => setPreferencesOpen(false), []);
    const reopenBanner = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setStored(null);
    }, []);

    // Broadcast consent changes so listeners (e.g. analytics loaders) can react.
    useEffect(() => {
        if (!stored) return;
        window.dispatchEvent(new CustomEvent('cookieconsent:change', { detail: stored.state }));
    }, [stored]);

    const value = useMemo<CookieConsentContextType>(() => ({
        hasDecided: stored !== null,
        state: stored?.state ?? DEFAULT_STATE,
        bannerVisible: stored === null,
        preferencesOpen,
        acceptAll,
        rejectAll,
        savePreferences,
        openPreferences,
        closePreferences,
        reopenBanner,
    }), [stored, preferencesOpen, acceptAll, rejectAll, savePreferences, openPreferences, closePreferences, reopenBanner]);

    return (
        <CookieConsentContext.Provider value={value}>
            {children}
        </CookieConsentContext.Provider>
    );
};

export const useCookieConsent = (): CookieConsentContextType => {
    const ctx = useContext(CookieConsentContext);
    if (!ctx) throw new Error('useCookieConsent must be used inside CookieConsentProvider');
    return ctx;
};

// Convenience hook for gating a feature on a specific category.
export const useConsentFor = (category: ConsentCategory): boolean => {
    const { state, hasDecided } = useCookieConsent();
    if (category === 'necessary') return true;
    return hasDecided && state[category];
};
