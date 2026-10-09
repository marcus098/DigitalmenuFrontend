import React, { useEffect } from 'react';
import { ShieldAlert, LogOut } from 'lucide-react';
import { useLoginContext } from '../Context/LoginContext';
import { useNotification } from '../Context/NotificationContext';
import { IMPERSONATION_FORBIDDEN_EVENT } from '../Utilities/impersonation';

const MAX_TIMEOUT = 2_147_000_000; // limite di setTimeout (~24,8 giorni)

const formatTime = (iso: string) => {
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Banner rosso persistente mostrato su ogni pagina della dashboard durante
 * una sessione di supporto ("Accedi come"). Esce automaticamente alla scadenza.
 */
const ImpersonationBanner: React.FC = () => {
    const { impersonation, exitImpersonation } = useLoginContext();
    const { addNotification } = useNotification();

    // Uscita automatica alla scadenza del token di supporto
    useEffect(() => {
        if (!impersonation) return;
        const ms = new Date(impersonation.expiresAt).getTime() - Date.now();
        if (Number.isNaN(ms)) return;
        if (ms <= 0) { exitImpersonation(); return; }
        const t = window.setTimeout(exitImpersonation, Math.min(ms, MAX_TIMEOUT));
        return () => window.clearTimeout(t);
    }, [impersonation, exitImpersonation]);

    // Operazioni bloccate dal backend durante il supporto → toast d'errore
    useEffect(() => {
        if (!impersonation) return;
        const handler = (e: Event) => {
            const message = (e as CustomEvent<string>).detail;
            if (message) addNotification({ message, type: 'error' });
        };
        window.addEventListener(IMPERSONATION_FORBIDDEN_EVENT, handler);
        return () => window.removeEventListener(IMPERSONATION_FORBIDDEN_EVENT, handler);
    }, [impersonation, addNotification]);

    if (!impersonation) return null;

    return (
        <div role="alert" className="bg-red-600 text-white">
            <div className="max-w-[1400px] mx-auto px-4 py-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span className="flex-1 min-w-0">
                    Stai operando come <strong>«{impersonation.agencyName}»</strong> (supporto)
                    <span className="opacity-90"> — scade alle {formatTime(impersonation.expiresAt)}</span>
                </span>
                <button
                    type="button"
                    onClick={exitImpersonation}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white text-red-700 font-semibold hover:bg-red-50 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    Esci
                </button>
            </div>
        </div>
    );
};

export default ImpersonationBanner;
