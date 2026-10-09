import React from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { AgencyPaymentProvider, AuditAction, AuditEntry, SubscriptionStatus } from './types';

/* ── Formattazione ───────────────────────────────────── */
export const formatDate = (value: string | null | undefined) => {
    if (!value) return '—';
    // Le date "YYYY-MM-DD" vanno interpretate come locali, non UTC
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    const d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const formatDateTime = (value: string | null | undefined) => {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' });
};

const rtf = new Intl.RelativeTimeFormat('it', { numeric: 'auto' });

export const relativeTime = (value: string | null | undefined) => {
    if (!value) return 'Mai';
    const t = new Date(value).getTime();
    if (Number.isNaN(t)) return value;
    const diffSec = Math.round((t - Date.now()) / 1000);
    const abs = Math.abs(diffSec);
    if (abs < 60) return 'adesso';
    if (abs < 3600) return rtf.format(Math.round(diffSec / 60), 'minute');
    if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), 'hour');
    if (abs < 86400 * 30) return rtf.format(Math.round(diffSec / 86400), 'day');
    if (abs < 86400 * 365) return rtf.format(Math.round(diffSec / (86400 * 30)), 'month');
    return rtf.format(Math.round(diffSec / (86400 * 365)), 'year');
};

/* ── Etichette ───────────────────────────────────────── */
export const STATUS_LABEL: Record<SubscriptionStatus, string> = {
    TRIAL: 'Prova',
    ACTIVE: 'Attivo',
    SUSPENDED: 'Sospeso',
    CANCELLED: 'Disdetto',
};

export const PROVIDER_LABEL: Record<AgencyPaymentProvider, string> = { NONE: '—', STRIPE: 'Stripe', SUMUP: 'SumUp' };

export const AUDIT_LABEL: Record<AuditAction, string> = {
    IMPERSONATE_START: 'Accesso come supporto',
    IMPERSONATE_REQUEST: 'Richiesta accesso come supporto',
    SUBSCRIPTION_UPDATE: 'Abbonamento modificato',
    NOTE_ADD: 'Nota aggiunta',
    NOTE_DELETE: 'Nota eliminata',
};

const AUDIT_TONE: Record<AuditAction, string> = {
    IMPERSONATE_START: 'bg-red-100 text-red-700',
    IMPERSONATE_REQUEST: 'bg-orange-100 text-orange-700',
    SUBSCRIPTION_UPDATE: 'bg-blue-100 text-blue-700',
    NOTE_ADD: 'bg-green-100 text-green-700',
    NOTE_DELETE: 'bg-slate-100 text-slate-600',
};

/* ── Badge ───────────────────────────────────────────── */
type Tone = 'green' | 'yellow' | 'orange' | 'slate' | 'red' | 'blue';

const TONES: Record<Tone, string> = {
    green: 'bg-green-100 text-green-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    orange: 'bg-orange-100 text-orange-700',
    slate: 'bg-slate-100 text-slate-600',
    red: 'bg-red-100 text-red-700',
    blue: 'bg-blue-100 text-blue-700',
};

export const Badge: React.FC<{ tone: Tone; children: React.ReactNode }> = ({ tone, children }) => (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap ${TONES[tone]}`}>
        {children}
    </span>
);

const STATUS_TONE: Record<SubscriptionStatus, Tone> = {
    TRIAL: 'yellow',
    ACTIVE: 'green',
    SUSPENDED: 'orange',
    CANCELLED: 'slate',
};

export const StatusBadges: React.FC<{ status: SubscriptionStatus; blocked?: boolean; deleted?: boolean }> = ({ status, blocked, deleted }) => (
    <span className="inline-flex flex-wrap gap-1">
        <Badge tone={STATUS_TONE[status] ?? 'slate'}>{STATUS_LABEL[status] ?? status}</Badge>
        {blocked && <Badge tone="red">Bloccato</Badge>}
        {deleted && <Badge tone="slate">Eliminato</Badge>}
    </span>
);

/* ── Box ─────────────────────────────────────────────── */
export const ErrorBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
        <AlertTriangle className="w-5 h-5 shrink-0" />
        <span className="break-words min-w-0">{children}</span>
    </div>
);

export const Spinner: React.FC = () => (
    <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary-400 border-t-transparent rounded-full animate-spin" />
    </div>
);

export const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-800">{title}</h2>
                <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded" aria-label="Chiudi">
                    <X className="w-5 h-5" />
                </button>
            </div>
            {children}
        </div>
    </div>
);

/* ── Lista audit ─────────────────────────────────────── */
export const AuditList: React.FC<{ entries: AuditEntry[]; showAgency?: boolean; onAgencyClick?: (id: number) => void }> =
    ({ entries, showAgency = false, onAgencyClick }) => {
        if (!entries.length) return <p className="text-sm text-gray-400 py-4">Nessuna attività registrata.</p>;
        return (
            <ul className="divide-y divide-gray-100">
                {entries.map(e => (
                    <li key={e.id} className="py-3 flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4">
                        <div className="sm:w-36 shrink-0 text-xs text-gray-400 pt-0.5">{formatDateTime(e.createdAt)}</div>
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${AUDIT_TONE[e.action] ?? 'bg-slate-100 text-slate-600'}`}>
                                    {AUDIT_LABEL[e.action] ?? e.action}
                                </span>
                                {showAgency && e.idAgency != null && (
                                    onAgencyClick
                                        ? <button type="button" onClick={() => onAgencyClick(e.idAgency as number)} className="text-sm font-semibold text-primary-600 hover:underline">
                                            {e.agencyName || `#${e.idAgency}`}
                                        </button>
                                        : <span className="text-sm font-semibold text-gray-700">{e.agencyName || `#${e.idAgency}`}</span>
                                )}
                            </div>
                            {e.detail && <p className="text-sm text-gray-600 mt-1 break-words whitespace-pre-line">{e.detail}</p>}
                            <p className="text-xs text-gray-400 mt-0.5">
                                {e.superadminEmail}{e.ip ? ` · IP ${e.ip}` : ''}
                            </p>
                        </div>
                    </li>
                ))}
            </ul>
        );
    };
