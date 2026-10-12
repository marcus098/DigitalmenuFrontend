import React, { useState, useEffect, useMemo } from 'react';
import {
    CalendarDaysIcon, PhoneIcon, UserGroupIcon, TrashIcon,
    CheckIcon, XMarkIcon, MagnifyingGlassIcon, ListBulletIcon,
    ChevronLeftIcon, ChevronRightIcon, PlusIcon, PencilSquareIcon, ArrowRightEndOnRectangleIcon,
} from '@heroicons/react/24/outline';
import CustomLoading from '../../Components/CustomLoading';
import { useNotification } from '../../Context/NotificationContext';
import { ReservationDto, StaffReservationRequest } from '../../types';
import {
    createReservationStaffApi, deleteReservationApi, getReservationsApi,
    updateReservationStaffApi, updateReservationStatusApi,
} from '../../Utilities/api';
import { localIsoDate } from '../../Utilities/dates';

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
    PENDING:   { label: 'In attesa',      cls: 'bg-yellow-100 text-yellow-800' },
    CONFIRMED: { label: 'Confermata',     cls: 'bg-green-100 text-green-800' },
    ARRIVED:   { label: 'Arrivato',       cls: 'bg-blue-100 text-blue-800' },
    CANCELLED: { label: 'Annullata',      cls: 'bg-red-100 text-red-800' },
    NO_SHOW:   { label: 'Non presentato', cls: 'bg-gray-100 text-gray-600' },
};

const DOT_COLOR: Record<string, string> = {
    PENDING:   'bg-yellow-400',
    CONFIRMED: 'bg-green-500',
    ARRIVED:   'bg-blue-500',
    CANCELLED: 'bg-red-400',
    NO_SHOW:   'bg-gray-400',
};

// ── Calendar Grid ─────────────────────────────────────────────────────────────
interface CalendarProps {
    reservations: ReservationDto[];
    onDayClick: (iso: string) => void;
    selectedDay: string | null;
}

const CalendarGrid: React.FC<CalendarProps> = ({ reservations, onDayClick, selectedDay }) => {
    const [viewDate, setViewDate] = useState(new Date());

    const year  = viewDate.getFullYear();
    const month = viewDate.getMonth(); // 0-indexed

    const firstDow = new Date(year, month, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const isoPrefix = `${year}-${String(month + 1).padStart(2, '0')}-`;

    const byDay = useMemo(() => {
        const map: Record<string, ReservationDto[]> = {};
        reservations.forEach(r => {
            if (r.reservationDate?.startsWith(isoPrefix)) {
                const day = r.reservationDate.slice(0, 10);
                if (!map[day]) map[day] = [];
                map[day].push(r);
            }
        });
        return map;
    }, [reservations, isoPrefix]);

    const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
    const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

    const today = localIsoDate();
    const emptyStart = firstDow === 0 ? 6 : firstDow - 1; // Monday-first grid

    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Month nav */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                    <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                </button>
                <span className="font-bold text-gray-800 capitalize">
                    {viewDate.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' })}
                </span>
                <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                    <ChevronRightIcon className="w-5 h-5 text-gray-600" />
                </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 px-2 pt-2">
                {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map(d => (
                    <div key={d} className="text-center text-xs font-bold text-gray-400 uppercase py-1">{d}</div>
                ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 px-2 pb-3 gap-1">
                {Array.from({ length: emptyStart }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const iso = `${isoPrefix}${String(dayNum).padStart(2, '0')}`;
                    const dayRes = byDay[iso] ?? [];
                    const isToday = iso === today;
                    const isSelected = iso === selectedDay;
                    return (
                        <button
                            key={iso}
                            onClick={() => onDayClick(isSelected ? '' : iso)}
                            className={`relative flex flex-col items-center p-1.5 rounded-xl transition-colors min-h-[52px] ${
                                isSelected ? 'bg-primary text-white shadow-md' :
                                isToday    ? 'bg-primary/10 text-primary font-bold' :
                                             'hover:bg-gray-50 text-gray-700'
                            }`}
                        >
                            <span className="text-sm font-semibold leading-none mb-1">{dayNum}</span>
                            {dayRes.length > 0 && (
                                <div className="flex gap-0.5 flex-wrap justify-center">
                                    {dayRes.slice(0, 3).map((r, ri) => (
                                        <span
                                            key={ri}
                                            className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white/80' : DOT_COLOR[r.status] ?? 'bg-gray-400'}`}
                                        />
                                    ))}
                                    {dayRes.length > 3 && (
                                        <span className={`text-[9px] font-bold ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                                            +{dayRes.length - 3}
                                        </span>
                                    )}
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex gap-4 px-5 pb-4 flex-wrap">
                {Object.entries(DOT_COLOR).map(([status, cls]) => (
                    <div key={status} className="flex items-center gap-1.5 text-xs text-gray-500">
                        <span className={`w-2 h-2 rounded-full ${cls}`} />
                        {STATUS_LABELS[status]?.label ?? status}
                    </div>
                ))}
            </div>
        </div>
    );
};

// ── Main ──────────────────────────────────────────────────────────────────────
const ReservationsPage: React.FC = () => {
    const [reservations, setReservations]   = useState<ReservationDto[]>([]);
    const [loading, setLoading]             = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [search, setSearch]               = useState('');
    const [filterStatus, setFilterStatus]   = useState<string>('ALL');
    const [view, setView]                   = useState<'list' | 'calendar'>('list');
    const [selectedDay, setSelectedDay]     = useState<string | null>(null);
    // Modale nuova/modifica: null = chiusa, 'new' = nuova, altrimenti la prenotazione da modificare
    const [editing, setEditing]             = useState<ReservationDto | 'new' | null>(null);
    const { addNotification } = useNotification();

    useEffect(() => { load(); }, []);

    const load = async () => {
        setLoading(true);
        const res = await getReservationsApi();
        if (res.success && res.data) {
            setReservations((res.data as any).data ?? res.data);
        } else {
            addNotification({ type: 'error', message: 'Errore nel caricamento prenotazioni' });
        }
        setLoading(false);
    };

    const handleStatus = async (id: number, status: string) => {
        setActionLoading(true);
        const res = await updateReservationStatusApi(id, status);
        if (res.success) {
            setReservations(prev => prev.map(r => r.id === id ? { ...r, status } : r));
        } else {
            addNotification({ type: 'error', message: 'Impossibile aggiornare lo stato' });
        }
        setActionLoading(false);
    };

    const handleSaved = (saved: ReservationDto, isNew: boolean) => {
        setReservations(prev => isNew ? [saved, ...prev] : prev.map(r => r.id === saved.id ? saved : r));
        setEditing(null);
        addNotification({ type: 'success', message: isNew ? 'Prenotazione inserita' : 'Prenotazione aggiornata' });
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Eliminare questa prenotazione?')) return;
        setActionLoading(true);
        const res = await deleteReservationApi(id);
        if (res.success) {
            setReservations(prev => prev.filter(r => r.id !== id));
        } else {
            addNotification({ type: 'error', message: 'Impossibile eliminare la prenotazione' });
        }
        setActionLoading(false);
    };

    const filtered = useMemo(() => {
        let list = reservations;
        if (selectedDay) list = list.filter(r => r.reservationDate === selectedDay);
        if (filterStatus !== 'ALL') list = list.filter(r => r.status === filterStatus);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(r =>
                r.customerName.toLowerCase().includes(q) || r.customerPhone.includes(q)
            );
        }
        return list;
    }, [reservations, search, filterStatus, selectedDay]);

    const counts = useMemo(() => {
        const c = { ALL: reservations.length, PENDING: 0, CONFIRMED: 0, ARRIVED: 0, CANCELLED: 0 };
        reservations.forEach(r => { if (r.status in c) (c as any)[r.status]++; });
        return c;
    }, [reservations]);

    if (loading) return <CustomLoading isFullPage={true} isTransparent={true} />;

    return (
        <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
            {actionLoading && <CustomLoading isTransparent={true} />}

            {/* Page header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                <h1 className="text-3xl font-bold text-gray-800">Prenotazioni</h1>
                <div className="flex items-center gap-3">
                    {/* View toggle */}
                    <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
                        <button
                            onClick={() => setView('list')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${view === 'list' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
                        >
                            <ListBulletIcon className="w-4 h-4" /> Lista
                        </button>
                        <button
                            onClick={() => setView('calendar')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${view === 'calendar' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
                        >
                            <CalendarDaysIcon className="w-4 h-4" /> Calendario
                        </button>
                    </div>
                    <button
                        onClick={load}
                        className="bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg shadow-sm hover:bg-gray-50 font-semibold text-sm"
                    >
                        Aggiorna
                    </button>
                    <button
                        onClick={() => setEditing('new')}
                        className="flex items-center gap-1.5 bg-primary text-white px-5 py-2.5 rounded-lg shadow-md hover:opacity-90 font-semibold text-sm"
                    >
                        <PlusIcon className="w-4 h-4" /> Nuova prenotazione
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                {[
                    { key: 'ALL',       label: 'Totali',     color: 'bg-blue-50 text-blue-700' },
                    { key: 'PENDING',   label: 'In attesa',  color: 'bg-yellow-50 text-yellow-700' },
                    { key: 'CONFIRMED', label: 'Confermate', color: 'bg-green-50 text-green-700' },
                    { key: 'ARRIVED',   label: 'Arrivati',   color: 'bg-blue-50 text-blue-700' },
                    { key: 'CANCELLED', label: 'Annullate',  color: 'bg-red-50 text-red-700' },
                ].map(({ key, label, color }) => (
                    <button
                        key={key}
                        onClick={() => setFilterStatus(key)}
                        className={`rounded-xl p-4 text-left transition-all border-2 ${color} ${filterStatus === key ? 'border-current shadow-md' : 'border-transparent'}`}
                    >
                        <div className="text-2xl font-black">{(counts as any)[key] ?? 0}</div>
                        <div className="text-xs font-semibold uppercase tracking-wide mt-1">{label}</div>
                    </button>
                ))}
            </div>

            {/* Calendar view */}
            {view === 'calendar' && (
                <div className="mb-6">
                    <CalendarGrid
                        reservations={reservations}
                        onDayClick={day => { setSelectedDay(day || null); setView('list'); }}
                        selectedDay={selectedDay}
                    />
                </div>
            )}

            {/* Selected day banner */}
            {selectedDay && (
                <div className="mb-4 flex items-center gap-3 bg-primary/10 text-primary px-4 py-2.5 rounded-xl text-sm font-semibold">
                    <CalendarDaysIcon className="w-5 h-5" />
                    Filtro: {new Date(selectedDay + 'T00:00:00').toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })}
                    <button onClick={() => setSelectedDay(null)} className="ml-auto hover:opacity-70">
                        <XMarkIcon className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Search (list view only) */}
            {view === 'list' && (
                <div className="relative mb-6">
                    <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="Cerca per nome o telefono…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                </div>
            )}

            {/* Reservation list */}
            {view === 'list' && (
                filtered.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <CalendarDaysIcon className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>Nessuna prenotazione trovata.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map(r => {
                            const statusInfo = STATUS_LABELS[r.status] ?? { label: r.status, cls: 'bg-gray-100 text-gray-600' };
                            return (
                                <div key={r.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-5 flex flex-col md:flex-row md:items-center gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="font-bold text-gray-900 text-lg truncate">{r.customerName}</span>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${statusInfo.cls}`}>{statusInfo.label}</span>
                                            {r.source === 'STAFF' && (
                                                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-500">Inserita dallo staff</span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-x-5 gap-y-1 mt-2 text-sm text-gray-500">
                                            <span className="flex items-center gap-1.5">
                                                <CalendarDaysIcon className="w-4 h-4" />
                                                {r.reservationDate} alle {r.reservationTime?.slice(0, 5)}
                                            </span>
                                            <span className="flex items-center gap-1.5">
                                                <UserGroupIcon className="w-4 h-4" />
                                                {r.partySize} {r.partySize === 1 ? 'persona' : 'persone'}
                                            </span>
                                            {r.customerPhone && (
                                                <span className="flex items-center gap-1.5">
                                                    <PhoneIcon className="w-4 h-4" />
                                                    <a href={`tel:${r.customerPhone}`} className="hover:text-primary">{r.customerPhone}</a>
                                                </span>
                                            )}
                                            {r.customerEmail && (
                                                <span className="text-gray-400 text-xs">{r.customerEmail}</span>
                                            )}
                                        </div>
                                        {r.specialRequests && (
                                            <p className="mt-2 text-xs text-gray-400 italic">"{r.specialRequests}"</p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                                        {(r.status === 'PENDING' || r.status === 'CONFIRMED') && (
                                            <button
                                                onClick={() => handleStatus(r.id, 'ARRIVED')}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                                            >
                                                <ArrowRightEndOnRectangleIcon className="w-4 h-4" /> Segna arrivato
                                            </button>
                                        )}
                                        {r.status === 'PENDING' && (
                                            <>
                                                <button
                                                    onClick={() => handleStatus(r.id, 'CONFIRMED')}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors"
                                                >
                                                    <CheckIcon className="w-4 h-4" /> Conferma
                                                </button>
                                                <button
                                                    onClick={() => handleStatus(r.id, 'CANCELLED')}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                                                >
                                                    <XMarkIcon className="w-4 h-4" /> Rifiuta
                                                </button>
                                            </>
                                        )}
                                        {r.status === 'CONFIRMED' && (
                                            <button
                                                onClick={() => handleStatus(r.id, 'NO_SHOW')}
                                                className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors"
                                            >
                                                Non presentato
                                            </button>
                                        )}
                                        {r.status === 'ARRIVED' && (
                                            <button
                                                onClick={() => handleStatus(r.id, 'CONFIRMED')}
                                                className="px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold hover:bg-gray-100 transition-colors"
                                            >
                                                Annulla arrivo
                                            </button>
                                        )}
                                        <button
                                            onClick={() => setEditing(r)}
                                            title="Modifica"
                                            aria-label="Modifica prenotazione"
                                            className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                        >
                                            <PencilSquareIcon className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(r.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
            )}

            {editing && (
                <ReservationFormModal
                    reservation={editing === 'new' ? null : editing}
                    defaultDate={selectedDay || todayIso()}
                    onClose={() => setEditing(null)}
                    onSaved={handleSaved}
                />
            )}
        </div>
    );
};

// ── Modale nuova/modifica prenotazione (staff) ────────────────────────────────
const pad2 = (n: number) => String(n).padStart(2, '0');
/** Data locale del browser (non UTC) */
const todayIso = () => localIsoDate();
const nowHHmm = () => { const d = new Date(); return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`; };

interface FormProps {
    reservation: ReservationDto | null;
    defaultDate: string;
    onClose: () => void;
    onSaved: (saved: ReservationDto, isNew: boolean) => void;
}

const ReservationFormModal: React.FC<FormProps> = ({ reservation, defaultDate, onClose, onSaved }) => {
    const isNew = reservation == null;
    const [name, setName]     = useState(reservation?.customerName ?? '');
    const [phone, setPhone]   = useState(reservation?.customerPhone ?? '');
    const [email, setEmail]   = useState(reservation?.customerEmail ?? '');
    const [people, setPeople] = useState(reservation?.partySize ?? 2);
    const [date, setDate]     = useState(reservation?.reservationDate ?? (defaultDate < todayIso() ? todayIso() : defaultDate));
    const [time, setTime]     = useState(reservation?.reservationTime?.slice(0, 5) ?? '20:00');
    const [notes, setNotes]   = useState(reservation?.specialRequests ?? '');
    const [walkIn, setWalkIn] = useState(false);
    const [notify, setNotify] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError]   = useState<string | null>(null);

    // Walk-in: oggi, adesso, già arrivato
    const toggleWalkIn = (on: boolean) => {
        setWalkIn(on);
        if (on) { setDate(todayIso()); setTime(nowHHmm()); setNotify(false); }
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!name.trim()) { setError('Inserisci il nome del cliente'); return; }
        if (!people || people < 1) { setError('Numero di persone non valido'); return; }
        if (!date || !/^\d{2}:\d{2}/.test(time)) { setError('Data e ora obbligatorie'); return; }
        setSaving(true);
        const body: StaffReservationRequest = {
            customerName: name.trim(),
            customerPhone: phone.trim(),
            customerEmail: email.trim(),
            partySize: people,
            reservationDate: date,
            reservationTime: time.slice(0, 5),
            specialRequests: notes.trim(),
            notifyCustomer: notify && !!phone.trim(),
        };
        if (isNew) body.status = walkIn ? 'ARRIVED' : 'CONFIRMED';
        const res = isNew ? await createReservationStaffApi(body) : await updateReservationStaffApi(reservation!.id, body);
        setSaving(false);
        const saved = (res.data as any)?.data as ReservationDto | undefined;
        if (res.success && saved) {
            onSaved(saved, isNew);
        } else if (res.status === 400) {
            setError(res.message && !res.message.startsWith('Request failed')
                ? res.message
                : 'Dati non validi: controlla data (non nel passato), ora e persone.');
        } else {
            setError('Salvataggio non riuscito, riprova.');
        }
    };

    const input = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:bg-gray-50 disabled:text-gray-400';
    const label = 'block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
            <form onSubmit={submit} onClick={e => e.stopPropagation()}
                  className="w-full max-w-lg max-h-[92vh] overflow-y-auto bg-white rounded-2xl shadow-2xl">
                <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">{isNew ? 'Nuova prenotazione' : 'Modifica prenotazione'}</h2>
                    <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600" aria-label="Chiudi">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-5 space-y-4">
                    {isNew && (
                        <label className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 cursor-pointer">
                            <input type="checkbox" checked={walkIn} onChange={e => toggleWalkIn(e.target.checked)} className="w-4 h-4" />
                            <span className="text-sm text-blue-800">
                                <span className="font-bold">Cliente al tavolo adesso</span> (walk-in: oggi, ora attuale, segnato come arrivato)
                            </span>
                        </label>
                    )}

                    <div>
                        <label className={label}>Nome *</label>
                        <input className={input} value={name} onChange={e => setName(e.target.value)} autoFocus maxLength={120} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={label}>Telefono</label>
                            <input className={input} type="tel" value={phone} onChange={e => setPhone(e.target.value)} maxLength={40} />
                        </div>
                        <div>
                            <label className={label}>Email</label>
                            <input className={input} type="email" value={email} onChange={e => setEmail(e.target.value)} maxLength={120} />
                        </div>
                    </div>

                    <div>
                        <label className={label}>Persone *</label>
                        <div className="flex items-center gap-3">
                            <button type="button" onClick={() => setPeople(p => Math.max(1, p - 1))}
                                    className="w-10 h-10 rounded-lg border border-gray-300 text-xl font-bold hover:bg-gray-50" aria-label="Una persona in meno">−</button>
                            <input className={`${input} w-20 text-center`} type="number" min={1} max={500} value={people}
                                   onChange={e => setPeople(parseInt(e.target.value, 10) || 0)} />
                            <button type="button" onClick={() => setPeople(p => Math.min(500, p + 1))}
                                    className="w-10 h-10 rounded-lg border border-gray-300 text-xl font-bold hover:bg-gray-50" aria-label="Una persona in più">+</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={label}>Data *</label>
                            <input className={input} type="date" value={date} min={isNew ? todayIso() : undefined}
                                   onChange={e => setDate(e.target.value)} disabled={walkIn} />
                        </div>
                        <div>
                            <label className={label}>Ora *</label>
                            <input className={input} type="time" value={time} onChange={e => setTime(e.target.value)} disabled={walkIn} />
                        </div>
                    </div>

                    <div>
                        <label className={label}>Note</label>
                        <textarea className={input} rows={2} value={notes} onChange={e => setNotes(e.target.value)} maxLength={1000}
                                  placeholder="Allergie, seggiolone, tavolo preferito…" />
                    </div>

                    {!walkIn && (
                        <label className={`flex items-center gap-3 text-sm ${phone.trim() ? 'text-gray-700' : 'text-gray-400'}`}>
                            <input type="checkbox" className="w-4 h-4" checked={notify && !!phone.trim()} disabled={!phone.trim()}
                                   onChange={e => setNotify(e.target.checked)} />
                            Invia SMS di conferma al cliente
                        </label>
                    )}

                    {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
                </div>

                <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4 flex justify-end gap-3">
                    <button type="button" onClick={onClose}
                            className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold text-sm hover:bg-gray-50">
                        Annulla
                    </button>
                    <button type="submit" disabled={saving}
                            className="px-5 py-2.5 rounded-lg bg-primary text-white font-semibold text-sm shadow-md hover:opacity-90 disabled:opacity-50">
                        {saving ? 'Salvataggio…' : isNew ? 'Inserisci' : 'Salva'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ReservationsPage;
