import React, { useEffect, useState } from 'react';
import { AnimatePresence as AnimatePresenceRaw, motion } from 'framer-motion';
import { useCookieConsent } from '../../Context/CookieConsentContext';

const AnimatePresence = AnimatePresenceRaw as React.FC<React.PropsWithChildren<{ initial?: boolean; mode?: 'sync' | 'wait' | 'popLayout' }>>;

type Props = { dark: boolean };

type CategoryDef = {
    key: 'necessary' | 'functional' | 'analytics' | 'marketing';
    title: string;
    description: string;
    required?: boolean;
};

const CATEGORIES: CategoryDef[] = [
    {
        key: 'necessary',
        title: 'Strettamente necessari',
        description:
            'Cookie indispensabili per il funzionamento del servizio: autenticazione, carrello, preferenze di lingua, sicurezza. Non possono essere disattivati.',
        required: true,
    },
    {
        key: 'functional',
        title: 'Funzionali',
        description:
            'Memorizzano le tue preferenze di utilizzo (tema, layout, ordinamenti) per migliorare l\'esperienza.',
    },
    {
        key: 'analytics',
        title: 'Analitici',
        description:
            'Ci aiutano a capire come viene utilizzato il servizio in forma aggregata e anonima per migliorarlo.',
    },
    {
        key: 'marketing',
        title: 'Marketing',
        description:
            'Permettono di mostrare contenuti e promozioni rilevanti per te su questa o altre piattaforme.',
    },
];

const CookiePreferencesModal: React.FC<Props> = ({ dark }) => {
    const { preferencesOpen, closePreferences, savePreferences, acceptAll, rejectAll, state } = useCookieConsent();

    const [functional, setFunctional] = useState(state.functional);
    const [analytics, setAnalytics] = useState(state.analytics);
    const [marketing, setMarketing] = useState(state.marketing);

    useEffect(() => {
        if (preferencesOpen) {
            setFunctional(state.functional);
            setAnalytics(state.analytics);
            setMarketing(state.marketing);
        }
    }, [preferencesOpen, state]);

    const getValue = (key: CategoryDef['key']) => {
        switch (key) {
            case 'necessary': return true;
            case 'functional': return functional;
            case 'analytics': return analytics;
            case 'marketing': return marketing;
        }
    };

    const setValue = (key: CategoryDef['key'], v: boolean) => {
        if (key === 'functional') setFunctional(v);
        if (key === 'analytics') setAnalytics(v);
        if (key === 'marketing') setMarketing(v);
    };

    const handleSave = () => savePreferences({ functional, analytics, marketing });

    return (
        <AnimatePresence>
            {preferencesOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/60 p-4 sm:items-center"
                    onClick={closePreferences}
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="cookie-prefs-title"
                >
                    <motion.div
                        initial={{ y: 40, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 40, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        onClick={(e) => e.stopPropagation()}
                        className={`w-full max-w-2xl overflow-hidden rounded-2xl shadow-2xl ${
                            dark ? 'bg-[#1e1b15] text-[#ede8da]' : 'bg-white text-slate-800'
                        }`}
                    >
                        <div className={`flex items-start justify-between border-b px-6 py-5 ${
                            dark ? 'border-[#3a3428]' : 'border-slate-200'
                        }`}>
                            <div>
                                <h2 id="cookie-prefs-title" className={`text-lg font-semibold ${
                                    dark ? 'text-[#c9a84c]' : 'text-slate-900'
                                }`}>
                                    Preferenze cookie
                                </h2>
                                <p className={`mt-1 text-sm ${dark ? 'text-[#bdb29a]' : 'text-slate-500'}`}>
                                    Scegli quali categorie autorizzare. La tua scelta viene salvata su questo dispositivo.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closePreferences}
                                aria-label="Chiudi"
                                className={`ml-4 rounded-lg p-1.5 text-xl leading-none transition ${
                                    dark ? 'text-[#bdb29a] hover:bg-[#25211a]' : 'text-slate-400 hover:bg-slate-100'
                                }`}
                            >
                                ×
                            </button>
                        </div>

                        <div className="max-h-[60vh] overflow-y-auto px-6 py-4">
                            <ul className="space-y-3">
                                {CATEGORIES.map((cat) => {
                                    const v = getValue(cat.key);
                                    return (
                                        <li
                                            key={cat.key}
                                            className={`rounded-xl border p-4 ${
                                                dark ? 'border-[#3a3428] bg-[#25211a]' : 'border-slate-200 bg-slate-50'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <h3 className={`text-sm font-semibold ${
                                                        dark ? 'text-[#ede8da]' : 'text-slate-900'
                                                    }`}>
                                                        {cat.title}
                                                    </h3>
                                                    <p className={`mt-1 text-xs leading-relaxed ${
                                                        dark ? 'text-[#bdb29a]' : 'text-slate-600'
                                                    }`}>
                                                        {cat.description}
                                                    </p>
                                                </div>
                                                <Toggle
                                                    checked={v}
                                                    disabled={cat.required}
                                                    onChange={(next) => setValue(cat.key, next)}
                                                    dark={dark}
                                                    label={cat.title}
                                                />
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        <div className={`flex flex-col gap-2 border-t px-6 py-4 sm:flex-row sm:justify-between ${
                            dark ? 'border-[#3a3428]' : 'border-slate-200'
                        }`}>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={rejectAll}
                                    className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                                        dark
                                            ? 'border-[#3a3428] text-[#ede8da] hover:bg-[#25211a]'
                                            : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    Rifiuta tutti
                                </button>
                                <button
                                    type="button"
                                    onClick={acceptAll}
                                    className={`rounded-xl border px-4 py-2 text-sm font-medium transition ${
                                        dark
                                            ? 'border-[#3a3428] text-[#ede8da] hover:bg-[#25211a]'
                                            : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                                    }`}
                                >
                                    Accetta tutti
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={handleSave}
                                className={`rounded-xl px-5 py-2 text-sm font-semibold transition ${
                                    dark
                                        ? 'bg-[#c9a84c] text-[#17140f] hover:bg-[#e0bc60]'
                                        : 'bg-orange-500 text-white hover:bg-orange-600'
                                }`}
                            >
                                Salva preferenze
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

type ToggleProps = {
    checked: boolean;
    disabled?: boolean;
    onChange: (next: boolean) => void;
    dark: boolean;
    label: string;
};

const Toggle: React.FC<ToggleProps> = ({ checked, disabled, onChange, dark, label }) => {
    const activeBg = dark ? 'bg-[#c9a84c]' : 'bg-orange-500';
    const inactiveBg = dark ? 'bg-[#3a3428]' : 'bg-slate-300';
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={() => !disabled && onChange(!checked)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition ${
                checked ? activeBg : inactiveBg
            } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
        >
            <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                    checked ? 'translate-x-5' : 'translate-x-0.5'
                }`}
            />
        </button>
    );
};

export default CookiePreferencesModal;
