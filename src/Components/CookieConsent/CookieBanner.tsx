import React from 'react';
import { AnimatePresence as AnimatePresenceRaw, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useCookieConsent } from '../../Context/CookieConsentContext';
import CookiePreferencesModal from './CookiePreferencesModal';

// framer-motion 11 + @types/react 18.3 returns Element|undefined; cast for JSX compat.
const AnimatePresence = AnimatePresenceRaw as React.FC<React.PropsWithChildren<{ initial?: boolean; mode?: 'sync' | 'wait' | 'popLayout' }>>;

// Routes that use the dark "luxury" client theme.
const isClientRoute = (pathname: string): boolean => {
    if (pathname.startsWith('/login') ||
        pathname.startsWith('/signup') ||
        pathname.startsWith('/cardStatus') ||
        pathname.startsWith('/urlInvite') ||
        pathname.startsWith('/confirmAccount') ||
        pathname.startsWith('/confirmByAdmin') ||
        pathname.startsWith('/emailNotConfirmed')) {
        return false;
    }
    if (pathname.startsWith('/Waiters/')) return true;
    return !pathname.includes('/Dashboard');
};

const CookieBanner: React.FC = () => {
    const { bannerVisible, preferencesOpen, acceptAll, rejectAll, openPreferences } = useCookieConsent();
    const { pathname } = useLocation();
    const dark = isClientRoute(pathname);

    if (!bannerVisible && !preferencesOpen) return null;

    return (
        <>
            <AnimatePresence>
                {bannerVisible && (
                    <motion.div
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 80, opacity: 0 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                        role="dialog"
                        aria-live="polite"
                        aria-label="Informativa sui cookie"
                        className={`fixed inset-x-0 bottom-0 z-[9999] px-4 pb-4 sm:px-6 sm:pb-6 ${
                            dark ? 'text-[#ede8da]' : 'text-slate-800'
                        }`}
                    >
                        <div
                            className={`mx-auto max-w-5xl rounded-2xl border shadow-2xl backdrop-blur-md ${
                                dark
                                    ? 'bg-[#1e1b15]/95 border-[#3a3428]'
                                    : 'bg-white/95 border-slate-200'
                            }`}
                        >
                            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-6">
                                <div className="flex-1 text-sm leading-relaxed">
                                    <p className={`mb-1 font-semibold ${dark ? 'text-[#c9a84c]' : 'text-slate-900'}`}>
                                        Rispettiamo la tua privacy
                                    </p>
                                    <p className={dark ? 'text-[#bdb29a]' : 'text-slate-600'}>
                                        Utilizziamo cookie tecnici necessari al funzionamento del servizio e,
                                        previo tuo consenso, cookie funzionali, analitici e di marketing.
                                        Puoi accettare tutti i cookie, rifiutarli o personalizzare le preferenze.{' '}
                                        <a
                                            href="/privacy"
                                            className={`underline underline-offset-2 ${
                                                dark ? 'text-[#c9a84c] hover:text-[#e0bc60]' : 'text-orange-600 hover:text-orange-700'
                                            }`}
                                        >
                                            Privacy policy
                                        </a>
                                        {' · '}
                                        <a
                                            href="/cookie-policy"
                                            className={`underline underline-offset-2 ${
                                                dark ? 'text-[#c9a84c] hover:text-[#e0bc60]' : 'text-orange-600 hover:text-orange-700'
                                            }`}
                                        >
                                            Cookie policy
                                        </a>
                                    </p>
                                </div>
                                <div className="flex flex-col gap-2 sm:flex-row sm:flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={rejectAll}
                                        className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                                            dark
                                                ? 'border-[#3a3428] text-[#ede8da] hover:bg-[#25211a]'
                                                : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        Rifiuta tutti
                                    </button>
                                    <button
                                        type="button"
                                        onClick={openPreferences}
                                        className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                                            dark
                                                ? 'border-[#3a3428] text-[#ede8da] hover:bg-[#25211a]'
                                                : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                                        }`}
                                    >
                                        Personalizza
                                    </button>
                                    <button
                                        type="button"
                                        onClick={acceptAll}
                                        className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                                            dark
                                                ? 'bg-[#c9a84c] text-[#17140f] hover:bg-[#e0bc60]'
                                                : 'bg-orange-500 text-white hover:bg-orange-600'
                                        }`}
                                    >
                                        Accetta tutti
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <CookiePreferencesModal dark={dark} />
        </>
    );
};

export default CookieBanner;
