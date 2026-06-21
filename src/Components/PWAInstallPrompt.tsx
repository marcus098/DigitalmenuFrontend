import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence as AnimatePresenceRaw, motion } from 'framer-motion';

const AnimatePresence = AnimatePresenceRaw as React.FC<React.PropsWithChildren<{ initial?: boolean; mode?: 'sync' | 'wait' | 'popLayout' }>>;

const DISMISS_KEY = 'pwaInstallDismissedAt';
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type BIPEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

const isStandalone = (): boolean => {
    return window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
};

const wasRecentlyDismissed = (): boolean => {
    try {
        const ts = localStorage.getItem(DISMISS_KEY);
        if (!ts) return false;
        return Date.now() - parseInt(ts, 10) < DISMISS_TTL_MS;
    } catch {
        return false;
    }
};

// Show only on customer-facing client routes — the dashboard PWA install
// makes less sense (operators use laptops).
const isClientRoute = (pathname: string): boolean => {
    if (pathname.startsWith('/login') ||
        pathname.startsWith('/signup') ||
        pathname.startsWith('/privacy') ||
        pathname.startsWith('/cookie-policy') ||
        pathname.includes('/Dashboard') ||
        pathname.startsWith('/Waiters/') ||
        pathname.startsWith('/cardStatus') ||
        pathname.startsWith('/urlInvite') ||
        pathname.startsWith('/confirmAccount') ||
        pathname.startsWith('/confirmByAdmin') ||
        pathname.startsWith('/emailNotConfirmed')) {
        return false;
    }
    return pathname !== '/' && pathname.length > 1;
};

const PWAInstallPrompt: React.FC = () => {
    const { pathname } = useLocation();
    const [deferredPrompt, setDeferredPrompt] = useState<BIPEvent | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isStandalone() || wasRecentlyDismissed() || !isClientRoute(pathname)) return;

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BIPEvent);
            // Delay 4s so it doesn't pop the instant the menu loads.
            setTimeout(() => setVisible(true), 4000);
        };

        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, [pathname]);

    const dismiss = () => {
        setVisible(false);
        try { localStorage.setItem(DISMISS_KEY, Date.now().toString()); } catch { /* noop */ }
    };

    const install = async () => {
        if (!deferredPrompt) return;
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        setVisible(false);
        if (choice.outcome === 'dismissed') {
            try { localStorage.setItem(DISMISS_KEY, Date.now().toString()); } catch { /* noop */ }
        }
    };

    return (
        <AnimatePresence>
            {visible && deferredPrompt && (
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    className="fixed inset-x-0 bottom-0 z-[9998] px-4 pb-4 sm:px-6 sm:pb-6"
                    role="dialog"
                    aria-label="Installa l'app"
                >
                    <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl border border-[#3a3428] bg-[#1e1b15]/95 p-4 shadow-2xl backdrop-blur-md">
                        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-[#25211a] text-xl font-serif italic text-[#c9a84c]">
                            R
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-[#ede8da]">Aggiungi alla home</p>
                            <p className="text-xs text-[#bdb29a]">Accesso rapido al menu, anche offline.</p>
                        </div>
                        <button
                            type="button"
                            onClick={dismiss}
                            aria-label="Chiudi"
                            className="rounded-lg px-2 py-1 text-sm text-[#bdb29a] hover:bg-[#25211a]"
                        >
                            ×
                        </button>
                        <button
                            type="button"
                            onClick={install}
                            className="rounded-xl bg-[#c9a84c] px-4 py-2 text-sm font-semibold text-[#17140f] hover:bg-[#e0bc60]"
                        >
                            Installa
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default PWAInstallPrompt;
