import React, { useState, useEffect, useMemo } from 'react';
import {
    CalendarDaysIcon, PhoneIcon, UserGroupIcon, TrashIcon,
    CheckIcon, XMarkIcon, MagnifyingGlassIcon, ListBulletIcon,
    ChevronLeftIcon, ChevronRightIcon,
} from '@heroicons/react/24/outline';
import CustomLoading from '../../Components/CustomLoading';
import { useNotification } from '../../Context/NotificationContext';
import { ReservationDto } from '../../types';
import { deleteReservationApi, getReservationsApi, updateReservationStatusApi } from '../../Utilities/api';

const STATUS_LABELS: Record<string, { label: string; cls: string }> = {
    PENDING:   { label: 'In attesa',      cls: 'bg-yellow-100 text-yellow-800' },
    CONFIRMED: { label: 'Confermata',     cls: 'bg-green-100 text-green-800' },
    CANCELLED: { label: 'Annullata',      cls: 'bg-red-100 text-red-800' },
    NO_SHOW:   { label: 'Non presentato', cls: 'bg-gray-100 text-gray-600' },
};

const DOT_COLOR: Record<string, string> = {
    PENDING:   'bg-yellow-400',
    CONFIRMED: 'bg-green-500',
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

    const today = new Date().toISOString().split('T')[0];
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
        const c = { ALL: reservations.length, PENDING: 0, CONFIRMED: 0, CANCELLED: 0 };
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
                        className="bg-primary text-white px-5 py-2.5 rounded-lg shadow-md hover:opacity-90 font-semibold text-sm"
                    >
                        Aggiorna
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {[
                    { key: 'ALL',       label: 'Totali',     color: 'bg-blue-50 text-blue-700' },
                    { key: 'PENDING',   label: 'In attesa',  color: 'bg-yellow-50 text-yellow-700' },
                    { key: 'CONFIRMED', label: 'Confermate', color: 'bg-green-50 text-green-700' },
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
                                            <span className="flex items-center gap-1.5">
                                                <PhoneIcon className="w-4 h-4" />
                                                <a href={`tel:${r.customerPhone}`} className="hover:text-primary">{r.customerPhone}</a>
                                            </span>
                                            {r.customerEmail && (
                                                <span className="text-gray-400 text-xs">{r.customerEmail}</span>
                                            )}
                                        </div>
                                        {r.specialRequests && (
                                            <p className="mt-2 text-xs text-gray-400 italic">"{r.specialRequests}"</p>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
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
        </div>
    );
};

export default ReservationsPage;
