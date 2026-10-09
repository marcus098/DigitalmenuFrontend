import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, LogIn, Save, Pin, PinOff, Trash2, RefreshCw, Lock, Users, ScrollText, CreditCard,
} from 'lucide-react';
import { useLoginContext } from '../Context/LoginContext';
import { useNotification } from '../Context/NotificationContext';
import { startImpersonation } from '../Utilities/impersonation';
import {
    addAgencyNote, deleteNote, getAgencyDetail, impersonateAgency, setNotePinned, updateAgencySubscription,
} from './superadminApi';
import { AgencyDetail, AgencyNote, AgencySummary, SubscriptionStatus, SubscriptionUpdate } from './types';
import {
    AuditList, Badge, ErrorBox, formatDate, formatDateTime, Modal, PROVIDER_LABEL, relativeTime, Spinner, STATUS_LABEL, StatusBadges,
} from './components';

const REASON_MIN = 3;
const REASON_MAX = 500;

/** "2026-10-10T…" o "2026-10-10" → "2026-10-10" per gli input type=date. */
const toDateInput = (v: string | null | undefined) => (v ? v.slice(0, 10) : '');
const fromDateInput = (v: string) => (v ? v : null);
const emptyToNull = (v: string) => (v.trim() ? v.trim() : null);

const formFromSummary = (s: AgencySummary): SubscriptionUpdate => ({
    activeFrom: toDateInput(s.activeFrom),
    subscriptionNumber: s.subscriptionNumber ?? '',
    plan: s.plan ?? '',
    subscriptionStatus: s.subscriptionStatus,
    trial: s.trial,
    trialEndAt: toDateInput(s.trialEndAt),
    billingEndAt: toDateInput(s.billingEndAt),
});

const sortNotes = (notes: AgencyNote[]) =>
    [...notes].sort((a, b) => (a.pinned === b.pinned
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : a.pinned ? -1 : 1));

const Card: React.FC<{ title: string; icon?: React.ElementType; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }> =
    ({ title, icon: Icon, subtitle, action, children }) => (
        <section className="bg-white p-5 md:p-6 rounded-xl shadow-lg">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-2">
                    {Icon && <Icon className="w-5 h-5 text-gray-500 mt-1 shrink-0" />}
                    <div>
                        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
                    </div>
                </div>
                {action}
            </div>
            {children}
        </section>
    );

const SuperadminAgencyPage: React.FC = () => {
    const { id: idParam } = useParams();
    const id = Number(idParam);
    const navigate = useNavigate();
    const { user } = useLoginContext();
    const { addNotification } = useNotification();

    const [detail, setDetail] = useState<AgencyDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Abbonamento
    const [form, setForm] = useState<SubscriptionUpdate | null>(null);
    const [savingSub, setSavingSub] = useState(false);

    // Note
    const [noteText, setNoteText] = useState('');
    const [notePinned, setNotePinnedFlag] = useState(false);
    const [savingNote, setSavingNote] = useState(false);
    const [busyNoteId, setBusyNoteId] = useState<number | null>(null);
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    // Accedi come
    const [impersonateOpen, setImpersonateOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [impersonating, setImpersonating] = useState(false);
    const [impersonateError, setImpersonateError] = useState<string | null>(null);

    const load = useCallback(async () => {
        if (!Number.isFinite(id)) { setError('Locale non valido'); setLoading(false); return; }
        setLoading(true);
        const res = await getAgencyDetail(id);
        setLoading(false);
        if (res.ok && res.data) {
            setDetail(res.data);
            setForm(formFromSummary(res.data.summary));
            setError(null);
        } else {
            setError(res.status === 404 ? 'Locale non trovato.' : res.message);
        }
    }, [id]);

    useEffect(() => { load(); }, [load]);

    const notes = useMemo(() => sortNotes(detail?.notes ?? []), [detail?.notes]);

    if (loading && !detail) return <div className="p-6"><Spinner /></div>;
    if (!detail || !form) {
        return (
            <div className="p-4 md:p-6 max-w-[1400px] mx-auto space-y-4">
                <Link to="/superadmin" className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-800">
                    <ArrowLeft className="w-4 h-4" /> Ristoranti
                </Link>
                <ErrorBox>{error ?? 'Impossibile caricare il locale.'}</ErrorBox>
            </div>
        );
    }

    const s = detail.summary;
    const setField = <K extends keyof SubscriptionUpdate>(k: K, v: SubscriptionUpdate[K]) => setForm(f => (f ? { ...f, [k]: v } : f));

    // ── Abbonamento ─────────────────────────────────────────────────────────
    const saveSubscription = async (e: React.FormEvent) => {
        e.preventDefault();
        const body: SubscriptionUpdate = {
            activeFrom: fromDateInput(form.activeFrom ?? ''),
            subscriptionNumber: emptyToNull(form.subscriptionNumber ?? ''),
            plan: emptyToNull(form.plan ?? ''),
            subscriptionStatus: form.subscriptionStatus,
            trial: form.trial,
            trialEndAt: form.trial ? fromDateInput(form.trialEndAt ?? '') : null,
            billingEndAt: fromDateInput(form.billingEndAt ?? ''),
        };
        setSavingSub(true);
        const res = await updateAgencySubscription(id, body);
        setSavingSub(false);
        if (res.ok && res.data) {
            const summary = res.data;
            setDetail(d => (d ? { ...d, summary } : d));
            setForm(formFromSummary(summary));
            addNotification({ message: 'Abbonamento aggiornato', type: 'success' });
            load(); // aggiorna anche l'audit
        } else {
            addNotification({ message: res.message || 'Impossibile salvare l’abbonamento', type: 'error' });
        }
    };

    // ── Note ────────────────────────────────────────────────────────────────
    const addNote = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = noteText.trim();
        if (!text) return;
        setSavingNote(true);
        const res = await addAgencyNote(id, text, notePinned);
        setSavingNote(false);
        if (res.ok && res.data) {
            const note = res.data;
            setDetail(d => (d ? { ...d, notes: [note, ...d.notes], summary: { ...d.summary, notesCount: d.summary.notesCount + 1 } } : d));
            setNoteText('');
            setNotePinnedFlag(false);
        } else {
            addNotification({ message: res.message || 'Impossibile salvare la nota', type: 'error' });
        }
    };

    const togglePin = async (note: AgencyNote) => {
        setBusyNoteId(note.id);
        const res = await setNotePinned(note.id, !note.pinned);
        setBusyNoteId(null);
        if (res.ok) {
            const updated = res.data ?? { ...note, pinned: !note.pinned };
            setDetail(d => (d ? { ...d, notes: d.notes.map(n => (n.id === note.id ? updated : n)) } : d));
        } else {
            addNotification({ message: res.message || 'Operazione non riuscita', type: 'error' });
        }
    };

    const removeNote = async (noteId: number) => {
        setBusyNoteId(noteId);
        const res = await deleteNote(noteId);
        setBusyNoteId(null);
        setConfirmDeleteId(null);
        if (res.ok) {
            setDetail(d => (d ? {
                ...d,
                notes: d.notes.filter(n => n.id !== noteId),
                summary: { ...d.summary, notesCount: Math.max(0, d.summary.notesCount - 1) },
            } : d));
        } else {
            addNotification({ message: res.message || 'Impossibile eliminare la nota', type: 'error' });
        }
    };

    // ── Accedi come ─────────────────────────────────────────────────────────
    const reasonTrimmed = reason.trim();
    const reasonValid = reasonTrimmed.length >= REASON_MIN && reasonTrimmed.length <= REASON_MAX;

    const doImpersonate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reasonValid) return;
        setImpersonating(true);
        setImpersonateError(null);
        const res = await impersonateAgency(id, reasonTrimmed);
        if (res.ok && res.data && (res.data.auth?.accessToken || res.data.token)) {
            // Ricarica la pagina sulla dashboard del locale (anche l'SSE riparte con il nuovo token)
            startImpersonation(res.data, user);
            return;
        }
        setImpersonating(false);
        setImpersonateError(res.message || 'Impossibile avviare l’accesso di supporto');
    };

    const closeImpersonate = () => {
        if (impersonating) return;
        setImpersonateOpen(false);
        setImpersonateError(null);
    };

    return (
        <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
            <button type="button" onClick={() => navigate('/superadmin')} className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-gray-800 mb-3">
                <ArrowLeft className="w-4 h-4" /> Ristoranti
            </button>

            {/* ── Intestazione ── */}
            <div className="bg-white p-5 md:p-6 rounded-xl shadow-lg mb-6 flex flex-col md:flex-row md:items-start gap-4">
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 break-words">{s.name}</h1>
                        <StatusBadges status={s.subscriptionStatus} blocked={s.blocked} deleted={s.deleted} />
                    </div>
                    <p className="text-gray-500 mt-1">/{s.localname} · ID {s.id}</p>
                    <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-2 text-sm">
                        <div><dt className="text-gray-400 text-xs">Amministratore</dt><dd className="text-gray-700 break-words">{s.adminName || '—'}{s.adminEmail ? ` · ${s.adminEmail}` : ''}</dd></div>
                        <div><dt className="text-gray-400 text-xs">Telefono</dt><dd className="text-gray-700">{s.phone || '—'}</dd></div>
                        <div><dt className="text-gray-400 text-xs">Registrato il</dt><dd className="text-gray-700">{formatDate(s.createdAt)}</dd></div>
                        <div><dt className="text-gray-400 text-xs">Pagamenti online</dt><dd className="text-gray-700 inline-flex items-center gap-1"><CreditCard className="w-4 h-4 text-gray-400" />{PROVIDER_LABEL[s.paymentProvider] ?? s.paymentProvider}</dd></div>
                        <div><dt className="text-gray-400 text-xs">Tavoli · Camerieri</dt><dd className="text-gray-700">{s.tablesCount} · {s.waitersCount}</dd></div>
                        <div><dt className="text-gray-400 text-xs">Ordini ultimi 30 giorni</dt><dd className="text-gray-700">{s.ordersLast30Days}</dd></div>
                        <div><dt className="text-gray-400 text-xs">Ultimo ordine</dt><dd className="text-gray-700" title={formatDateTime(s.lastOrderAt)}>{relativeTime(s.lastOrderAt)}</dd></div>
                    </dl>
                </div>
                <div className="flex md:flex-col items-stretch gap-2 shrink-0">
                    <button
                        type="button"
                        onClick={() => { setReason(''); setImpersonateError(null); setImpersonateOpen(true); }}
                        disabled={s.deleted}
                        className="btn-primary-danger inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        title={s.deleted ? 'Locale eliminato' : 'Apri la dashboard del locale come supporto'}
                    >
                        <LogIn className="w-5 h-5" /> Accedi come
                    </button>
                    <button type="button" onClick={load} disabled={loading} className="btn-secondary inline-flex items-center justify-center gap-2 text-sm">
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Aggiorna
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
                <div className="space-y-6">
                    {/* ── Abbonamento ── */}
                    <Card title="Abbonamento" icon={CreditCard}>
                        <form onSubmit={saveSubscription} className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <label className="block">
                                    <span className="label-style">Attivo dal</span>
                                    <input type="date" className="input-style mt-1" value={form.activeFrom ?? ''} onChange={e => setField('activeFrom', e.target.value)} />
                                </label>
                                <label className="block">
                                    <span className="label-style">Numero abbonamento</span>
                                    <input type="text" className="input-style mt-1" maxLength={100} value={form.subscriptionNumber ?? ''} onChange={e => setField('subscriptionNumber', e.target.value)} />
                                </label>
                                <label className="block">
                                    <span className="label-style">Piano</span>
                                    <input type="text" className="input-style mt-1" maxLength={100} placeholder="es. Base, Pro" value={form.plan ?? ''} onChange={e => setField('plan', e.target.value)} />
                                </label>
                                <label className="block">
                                    <span className="label-style">Stato</span>
                                    <select
                                        className="input-style mt-1"
                                        value={form.subscriptionStatus}
                                        onChange={e => setField('subscriptionStatus', e.target.value as SubscriptionStatus)}
                                    >
                                        {(Object.keys(STATUS_LABEL) as SubscriptionStatus[]).map(st => (
                                            <option key={st} value={st}>{STATUS_LABEL[st]}</option>
                                        ))}
                                    </select>
                                </label>
                                <div className="block">
                                    <span className="label-style">Periodo di prova</span>
                                    <div className="mt-1 flex items-center gap-3 h-[46px]">
                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={form.trial}
                                            aria-label="Periodo di prova"
                                            onClick={() => setField('trial', !form.trial)}
                                            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${form.trial ? 'bg-green-600' : 'bg-gray-300'}`}
                                        >
                                            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${form.trial ? 'translate-x-5' : 'translate-x-0.5'}`} />
                                        </button>
                                        <span className="text-sm text-gray-600">{form.trial ? 'In prova' : 'No'}</span>
                                    </div>
                                </div>
                                <label className="block">
                                    <span className="label-style">Fine prova</span>
                                    <input
                                        type="date"
                                        className="input-style mt-1 disabled:bg-gray-50 disabled:text-gray-400"
                                        disabled={!form.trial}
                                        value={form.trialEndAt ?? ''}
                                        onChange={e => setField('trialEndAt', e.target.value)}
                                    />
                                </label>
                                <label className="block">
                                    <span className="label-style">Scadenza fatturazione</span>
                                    <input type="date" className="input-style mt-1" value={form.billingEndAt ?? ''} onChange={e => setField('billingEndAt', e.target.value)} />
                                </label>
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" disabled={savingSub} className="btn-primary inline-flex items-center gap-2 disabled:opacity-50">
                                    <Save className="w-4 h-4" /> {savingSub ? 'Salvataggio…' : 'Salva'}
                                </button>
                            </div>
                        </form>
                    </Card>

                    {/* ── Utenti ── */}
                    <Card title="Utenti" icon={Users} subtitle={`${detail.users.length} account collegati al locale`}>
                        {detail.users.length === 0 ? <p className="text-sm text-gray-400">Nessun utente.</p> : (
                            <ul className="divide-y divide-gray-100">
                                {detail.users.map(u => (
                                    <li key={u.id} className={`py-3 flex flex-wrap items-center justify-between gap-2 ${u.deleted ? 'opacity-60' : ''}`}>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 truncate">
                                                {[u.name, u.surname].filter(Boolean).join(' ') || u.username}
                                            </p>
                                            <p className="text-xs text-gray-400 truncate">{u.email}{u.username && u.username !== u.email ? ` · ${u.username}` : ''}</p>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            <Badge tone="blue">{u.role}</Badge>
                                            {u.confirmed ? <Badge tone="green">Confermato</Badge> : <Badge tone="yellow">Non confermato</Badge>}
                                            {u.deleted && <Badge tone="slate">Eliminato</Badge>}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* ── Note interne ── */}
                    <Card title="Note interne" icon={Lock} subtitle="Note interne — visibili solo agli amministratori della piattaforma">
                        <form onSubmit={addNote} className="space-y-2 mb-4">
                            <textarea
                                className="input-style min-h-[90px]"
                                placeholder="Aggiungi una nota…"
                                maxLength={4000}
                                value={noteText}
                                onChange={e => setNoteText(e.target.value)}
                            />
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <label className="inline-flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                                    <input type="checkbox" checked={notePinned} onChange={e => setNotePinnedFlag(e.target.checked)} className="rounded border-gray-300" />
                                    Fissa in alto
                                </label>
                                <button type="submit" disabled={savingNote || !noteText.trim()} className="btn-primary text-sm disabled:opacity-50">
                                    {savingNote ? 'Salvataggio…' : 'Aggiungi nota'}
                                </button>
                            </div>
                        </form>
                        {notes.length === 0 ? <p className="text-sm text-gray-400">Nessuna nota.</p> : (
                            <ul className="space-y-3">
                                {notes.map(n => (
                                    <li key={n.id} className={`rounded-lg border p-3 ${n.pinned ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200'}`}>
                                        <p className="text-sm text-gray-800 whitespace-pre-line break-words">{n.text}</p>
                                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                                            <p className="text-xs text-gray-400">
                                                {n.authorName || n.authorEmail || 'Sconosciuto'} · {formatDateTime(n.createdAt)}
                                                {n.pinned && <span className="ml-2 font-semibold text-yellow-700">Fissata</span>}
                                            </p>
                                            {confirmDeleteId === n.id ? (
                                                <div className="flex items-center gap-2 text-xs">
                                                    <span className="text-gray-600">Eliminare la nota?</span>
                                                    <button type="button" disabled={busyNoteId === n.id} onClick={() => removeNote(n.id)} className="px-2 py-1 rounded bg-red-500 text-white font-semibold hover:bg-red-600 disabled:opacity-50">
                                                        Elimina
                                                    </button>
                                                    <button type="button" onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 rounded text-gray-600 hover:bg-gray-100 font-semibold">
                                                        Annulla
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        type="button"
                                                        disabled={busyNoteId === n.id}
                                                        onClick={() => togglePin(n)}
                                                        className="p-1.5 rounded text-gray-400 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                                                        title={n.pinned ? 'Sblocca' : 'Fissa in alto'}
                                                        aria-label={n.pinned ? 'Sblocca nota' : 'Fissa nota'}
                                                    >
                                                        {n.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={busyNoteId === n.id}
                                                        onClick={() => setConfirmDeleteId(n.id)}
                                                        className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                                                        title="Elimina"
                                                        aria-label="Elimina nota"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </Card>

                    {/* ── Audit ── */}
                    <Card title="Attività" icon={ScrollText} subtitle="Ultime 50 operazioni della piattaforma su questo locale">
                        <AuditList entries={detail.audit.slice(0, 50)} />
                    </Card>
                </div>
            </div>

            {/* ── Modale "Accedi come" ── */}
            {impersonateOpen && (
                <Modal title={`Accedi come «${s.name}»`} onClose={closeImpersonate}>
                    <form onSubmit={doImpersonate} className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Aprirai la dashboard del locale con i permessi del suo amministratore. L’accesso è a tempo,
                            viene registrato nell’audit e alcune operazioni (password, email, eliminazione account,
                            credenziali di pagamento, rimborsi) restano bloccate.
                        </p>
                        <label className="block">
                            <span className="label-style">Motivo dell’accesso *</span>
                            <textarea
                                className="input-style mt-1 min-h-[90px]"
                                autoFocus
                                maxLength={REASON_MAX}
                                placeholder="es. Richiesta del cliente: configurazione stampante"
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                            />
                            <span className="text-xs text-gray-400">{reasonTrimmed.length}/{REASON_MAX} — minimo {REASON_MIN} caratteri</span>
                        </label>
                        {impersonateError && <ErrorBox>{impersonateError}</ErrorBox>}
                        <div className="flex justify-end gap-2">
                            <button type="button" onClick={closeImpersonate} disabled={impersonating} className="btn-secondary">Annulla</button>
                            <button type="submit" disabled={!reasonValid || impersonating} className="btn-primary-danger inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                <LogIn className="w-4 h-4" /> {impersonating ? 'Accesso…' : 'Accedi come'}
                            </button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

export default SuperadminAgencyPage;
