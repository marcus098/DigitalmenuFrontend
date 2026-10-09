import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Calendar, Clock, Plus, Save, Trash2, Lock, Unlock, RotateCcw, CalendarOff,
    AlertCircle, CheckCircle2, X, PauseCircle, PlayCircle, Palmtree,
} from 'lucide-react';
import { useNotification } from '../../Context/NotificationContext';
import {
    getTakeawaySlotConfigApi, saveTakeawaySlotConfigApi,
    getTakeawaySlotsDayApi, closeTakeawaySlotApi, openTakeawaySlotApi,
    addManualTakeawaySlotApi, resetManualTakeawaySlotApi,
    closeTakeawayDayApi, openTakeawayDayApi,
    getTakeawayClosuresApi, addTakeawayClosureApi, deleteTakeawayClosureApi,
    getTakeawayPauseApi, pauseTakeawayApi, resumeTakeawayApi,
    type SlotConfig, type Slot, type TimeRange, type TakeawayClosure, type TakeawayPauseStatus,
} from '../../Utilities/api';
import CustomLoading from '../../Components/CustomLoading';

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS: { key: string; short: string; label: string }[] = [
    { key: 'MONDAY',    short: 'Lun', label: 'Lunedì' },
    { key: 'TUESDAY',   short: 'Mar', label: 'Martedì' },
    { key: 'WEDNESDAY', short: 'Mer', label: 'Mercoledì' },
    { key: 'THURSDAY',  short: 'Gio', label: 'Giovedì' },
    { key: 'FRIDAY',    short: 'Ven', label: 'Venerdì' },
    { key: 'SATURDAY',  short: 'Sab', label: 'Sabato' },
    { key: 'SUNDAY',    short: 'Dom', label: 'Domenica' },
];

const todayIso = () => new Date().toISOString().split('T')[0];
const addDaysIso = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
};
const itDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const TakeawaySlotsPage: React.FC = () => {
    const { addNotification } = useNotification();

    const [config, setConfig]       = useState<SlotConfig | null>(null);
    const [dirty, setDirty]         = useState(false);
    const [savingCfg, setSavingCfg] = useState(false);
    const [loadingCfg, setLoadingCfg] = useState(true);

    const [activeDate, setActiveDate] = useState<string>(todayIso());
    const [slots, setSlots]           = useState<Slot[]>([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [newClosedDate, setNewClosedDate] = useState<string>('');

    // Chiusure (giorni / periodi di ferie) e "Sospendi asporto"
    const [closures, setClosures] = useState<TakeawayClosure[]>([]);
    const [rangeForm, setRangeForm] = useState({ from: '', to: '', note: 'Ferie' });
    const [pause, setPause] = useState<TakeawayPauseStatus | null>(null);
    const [pauseMinutes, setPauseMinutes] = useState<string>('');
    const [pauseBusy, setPauseBusy] = useState(false);

    const refreshClosures = useCallback(async () => {
        const res = await getTakeawayClosuresApi();
        if (res.success && res.data) setClosures(res.data);
    }, []);

    useEffect(() => {
        refreshClosures();
        getTakeawayPauseApi().then(r => { if (r.success && r.data) setPause(r.data); });
    }, [refreshClosures]);

    const togglePause = async () => {
        setPauseBusy(true);
        const res = pause?.paused
            ? await resumeTakeawayApi()
            : await pauseTakeawayApi(pauseMinutes ? parseInt(pauseMinutes, 10) : undefined);
        setPauseBusy(false);
        if (res.success && res.data) {
            setPause(res.data);
            addNotification({ message: res.data.paused ? 'Asporto sospeso' : 'Asporto riattivato', type: 'success' });
        } else {
            addNotification({ message: 'Errore aggiornamento asporto', type: 'error' });
        }
    };

    const addRangeClosure = async () => {
        if (!rangeForm.from) return;
        const to = rangeForm.to || rangeForm.from;
        const res = await addTakeawayClosureApi(rangeForm.from, to, rangeForm.note.trim() || undefined);
        if (res.success) {
            setRangeForm({ from: '', to: '', note: 'Ferie' });
            refreshClosures();
            refreshSlots(activeDate);
            addNotification({ message: 'Chiusura aggiunta', type: 'success' });
        } else {
            addNotification({ message: res.message || 'Errore aggiunta chiusura', type: 'error' });
        }
    };

    const removeClosure = async (c: TakeawayClosure) => {
        if (!window.confirm('Eliminare questa chiusura? Gli slot torneranno prenotabili.')) return;
        const res = await deleteTakeawayClosureApi(c.id);
        if (res.success) {
            refreshClosures();
            refreshSlots(activeDate);
        } else {
            addNotification({ message: 'Errore eliminazione chiusura', type: 'error' });
        }
    };

    // ── Load config ──
    useEffect(() => {
        (async () => {
            setLoadingCfg(true);
            const res = await getTakeawaySlotConfigApi();
            if (res.success && res.data) setConfig(res.data);
            else addNotification({ message: 'Errore caricamento configurazione slot', type: 'error' });
            setLoadingCfg(false);
        })();
    }, [addNotification]);

    // ── Load slots for active date ──
    const refreshSlots = useCallback(async (date: string) => {
        setLoadingSlots(true);
        const res = await getTakeawaySlotsDayApi(date);
        if (res.success && res.data) setSlots(res.data);
        else { setSlots([]); }
        setLoadingSlots(false);
    }, []);

    useEffect(() => { refreshSlots(activeDate); }, [activeDate, refreshSlots]);

    // ── Config mutators ──
    const update = useCallback(<K extends keyof SlotConfig>(k: K, v: SlotConfig[K]) => {
        setConfig(prev => prev ? { ...prev, [k]: v } : prev);
        setDirty(true);
    }, []);

    const updateDayRanges = (dayKey: string, ranges: TimeRange[]) => {
        if (!config) return;
        update('weeklyHours', { ...config.weeklyHours, [dayKey]: ranges });
    };

    const addRange = (dayKey: string) => {
        if (!config) return;
        const cur = config.weeklyHours[dayKey] || [];
        updateDayRanges(dayKey, [...cur, { start: '19:00', end: '23:00' }]);
    };
    const removeRange = (dayKey: string, idx: number) => {
        if (!config) return;
        const cur = [...(config.weeklyHours[dayKey] || [])];
        cur.splice(idx, 1);
        updateDayRanges(dayKey, cur);
    };
    const updateRange = (dayKey: string, idx: number, field: 'start' | 'end', val: string) => {
        if (!config) return;
        const cur = [...(config.weeklyHours[dayKey] || [])];
        cur[idx] = { ...cur[idx], [field]: val };
        updateDayRanges(dayKey, cur);
    };

    const addClosedDate = () => {
        if (!config || !newClosedDate) return;
        if (config.closedDates.includes(newClosedDate)) return;
        update('closedDates', [...config.closedDates, newClosedDate].sort());
        setNewClosedDate('');
    };
    const removeClosedDate = (d: string) => {
        if (!config) return;
        update('closedDates', config.closedDates.filter(x => x !== d));
    };

    const handleSaveConfig = async () => {
        if (!config) return;
        setSavingCfg(true);
        const res = await saveTakeawaySlotConfigApi(config);
        setSavingCfg(false);
        if (res.success && res.data) {
            setConfig(res.data);
            setDirty(false);
            addNotification({ message: 'Configurazione slot salvata', type: 'success' });
            refreshSlots(activeDate);
        } else {
            addNotification({ message: 'Errore salvataggio configurazione', type: 'error' });
        }
    };

    // ── Live slot actions ──
    const dayClosed = slots.length > 0 && slots.every(s => s.status === 'CLOSED' && (s.closedReason === 'DAY' || s.closedReason === 'RANGE'));
    const dayClosedByRange = dayClosed && slots.some(s => s.closedReason === 'RANGE');
    const toggleDay = async () => {
        if (dayClosed) {
            const res = await openTakeawayDayApi(activeDate);
            if (!res.success) addNotification({ message: res.message || 'Impossibile riaprire il giorno', type: 'error' });
        } else {
            if (!window.confirm(`Chiudere l'asporto per tutta la giornata di ${itDate(activeDate)}?`)) return;
            const res = await closeTakeawayDayApi(activeDate);
            if (!res.success) addNotification({ message: 'Errore chiusura giorno', type: 'error' });
        }
        refreshSlots(activeDate);
        refreshClosures();
    };

    const onClose   = async (s: Slot) => { await closeTakeawaySlotApi(activeDate, s.time);   refreshSlots(activeDate); };
    const onOpen    = async (s: Slot) => { await openTakeawaySlotApi(activeDate, s.time);    refreshSlots(activeDate); };
    const onManual  = async (s: Slot) => {
        const productsStr = window.prompt(`Aggiungi ordine manuale allo slot ${s.time} — quanti prodotti? (default 1)`, '1');
        if (productsStr === null) return;
        const products = Math.max(1, parseInt(productsStr, 10) || 1);
        await addManualTakeawaySlotApi(activeDate, s.time, products);
        refreshSlots(activeDate);
    };
    const onReset   = async (s: Slot) => {
        if (!window.confirm(`Azzerare gli ordini manuali dello slot ${s.time}?`)) return;
        await resetManualTakeawaySlotApi(activeDate, s.time);
        refreshSlots(activeDate);
    };

    // ── Date shortcuts ──
    const dateShortcuts = useMemo(() => ([
        { label: 'Oggi',    iso: todayIso() },
        { label: 'Domani',  iso: addDaysIso(1) },
        { label: '+2 gg',   iso: addDaysIso(2) },
        { label: '+3 gg',   iso: addDaysIso(3) },
        { label: '+1 sett.', iso: addDaysIso(7) },
    ]), []);

    if (loadingCfg || !config) return <CustomLoading isFullPage />;

    return (
        <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
            <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Slot Asporto</h1>
                    <p className="text-gray-500 mt-1 text-sm max-w-xl">
                        Definisci gli orari di apertura settimanali, la durata di ogni slot e i limiti. Nella sezione "Slot del giorno" puoi chiudere/aprire o aggiungere ordini telefonici manualmente.
                    </p>
                </div>
                <button
                    onClick={handleSaveConfig}
                    disabled={!dirty || savingCfg}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Save className="w-5 h-5" />
                    {savingCfg ? 'Salvataggio…' : 'Salva configurazione'}
                </button>
            </div>

            {/* ── Sospendi asporto ── */}
            {pause && (
                <div className={`rounded-xl shadow-sm p-5 mb-6 flex flex-wrap items-center gap-4 ${pause.paused ? 'bg-red-600 text-white' : 'bg-white'}`}>
                    {pause.paused ? <PauseCircle className="w-10 h-10" /> : <PlayCircle className="w-10 h-10 text-emerald-500" />}
                    <div className="flex-1 min-w-[200px]">
                        <p className="text-lg font-bold">
                            {pause.paused ? 'Asporto sospeso' : 'Asporto attivo'}
                        </p>
                        <p className={`text-sm ${pause.paused ? 'text-red-100' : 'text-gray-500'}`}>
                            {pause.paused
                                ? (pause.pausedUntil
                                    ? `I clienti non possono ordinare fino alle ${new Date(pause.pausedUntil).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}.`
                                    : 'I clienti non possono ordinare finché non riprendi.')
                                : 'Nei momenti di punta puoi bloccare temporaneamente i nuovi ordini da asporto online.'}
                        </p>
                    </div>
                    {!pause.paused && (
                        <select value={pauseMinutes} onChange={e => setPauseMinutes(e.target.value)} className="input-style max-w-[200px]">
                            <option value="">Finché non riprendo</option>
                            <option value="30">Per 30 minuti</option>
                            <option value="60">Per 1 ora</option>
                            <option value="120">Per 2 ore</option>
                        </select>
                    )}
                    <button
                        onClick={togglePause}
                        disabled={pauseBusy}
                        className={`px-6 py-3 rounded-xl text-base font-bold disabled:opacity-50 ${pause.paused ? 'bg-white text-red-700 hover:bg-red-50' : 'bg-red-600 text-white hover:bg-red-700'}`}
                    >
                        {pause.paused ? 'Riprendi asporto' : 'Sospendi asporto'}
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* ── Configurazione settimanale ── */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <Calendar className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-bold text-gray-800">Orari settimanali</h2>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-2">
                        <NumberField label="Durata slot (min)" value={config.slotDurationMinutes}
                            onChange={v => update('slotDurationMinutes', v)} min={5} max={120} step={5} />
                        <NumberField label="Max ordini / slot" value={config.maxOrdersPerSlot}
                            onChange={v => update('maxOrdersPerSlot', v)} min={1} max={50} />
                        <NumberField label="Riserva su richiesta" value={config.reserveOrdersPerSlot ?? 0}
                            onChange={v => update('reserveOrdersPerSlot', v)} min={0} max={50} />
                        <NumberField label="Max prodotti (0 = no)" value={config.maxProductsPerSlot}
                            onChange={v => update('maxProductsPerSlot', v)} min={0} max={200} />
                    </div>
                    <p className="text-xs text-gray-500 mb-6">
                        Riserva: ordini accettati oltre il massimo solo dopo la tua conferma (entro 10 minuti, altrimenti rifiutati automaticamente).
                        Il limite prodotti è facoltativo.
                    </p>

                    <div className="space-y-3">
                        {DAYS.map(({ key, short, label }) => {
                            const ranges = config.weeklyHours[key] || [];
                            const closed = ranges.length === 0;
                            return (
                                <div key={key} className="border border-gray-200 rounded-xl p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="inline-flex w-10 justify-center text-xs font-bold bg-gray-100 px-2 py-1 rounded">{short}</span>
                                            <span className="text-sm font-semibold text-gray-700">{label}</span>
                                            {closed && <span className="text-xs text-gray-400">— chiuso</span>}
                                        </div>
                                        <button onClick={() => addRange(key)}
                                            className="text-xs font-semibold text-primary hover:bg-primary/5 px-2 py-1 rounded inline-flex items-center gap-1">
                                            <Plus className="w-3.5 h-3.5" /> Range
                                        </button>
                                    </div>
                                    {ranges.length === 0 && (
                                        <p className="text-xs text-gray-400 pl-12">Aggiungi un range orario per aprire questo giorno.</p>
                                    )}
                                    <div className="space-y-2">
                                        {ranges.map((r, i) => (
                                            <div key={i} className="flex items-center gap-2 pl-12">
                                                <input type="time" value={r.start}
                                                    onChange={e => updateRange(key, i, 'start', e.target.value)}
                                                    className="input-style flex-1 max-w-[110px]" />
                                                <span className="text-gray-400 text-xs">→</span>
                                                <input type="time" value={r.end}
                                                    onChange={e => updateRange(key, i, 'end', e.target.value)}
                                                    className="input-style flex-1 max-w-[110px]" />
                                                <button onClick={() => removeRange(key, i)}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Closed dates */}
                    <div className="mt-6 pt-5 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                            <CalendarOff className="w-4 h-4 text-gray-500" />
                            <h3 className="text-sm font-bold text-gray-700">Chiusure straordinarie</h3>
                        </div>
                        <div className="flex gap-2 mb-3">
                            <input type="date" value={newClosedDate}
                                onChange={e => setNewClosedDate(e.target.value)}
                                className="input-style flex-1" />
                            <button onClick={addClosedDate} disabled={!newClosedDate}
                                className="btn-secondary text-sm disabled:opacity-50">+ Aggiungi</button>
                        </div>
                        {config.closedDates.length === 0 ? (
                            <p className="text-xs text-gray-400">Nessuna chiusura straordinaria.</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {config.closedDates.map(d => (
                                    <span key={d} className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                                        {itDate(d)}
                                        <button onClick={() => removeClosedDate(d)} className="hover:bg-red-100 rounded-full p-0.5">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Ferie / periodi di chiusura */}
                    <div className="mt-6 pt-5 border-t border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                            <Palmtree className="w-4 h-4 text-gray-500" />
                            <h3 className="text-sm font-bold text-gray-700">Ferie e periodi di chiusura</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 mb-3">
                            <input type="date" value={rangeForm.from} min={todayIso()}
                                onChange={e => setRangeForm(f => ({ ...f, from: e.target.value }))}
                                className="input-style" title="Dal" />
                            <input type="date" value={rangeForm.to} min={rangeForm.from || todayIso()}
                                onChange={e => setRangeForm(f => ({ ...f, to: e.target.value }))}
                                className="input-style" title="Al (incluso)" />
                            <input type="text" value={rangeForm.note} maxLength={200} placeholder="Nota (es. Ferie)"
                                onChange={e => setRangeForm(f => ({ ...f, note: e.target.value }))}
                                className="input-style" />
                            <button onClick={addRangeClosure} disabled={!rangeForm.from}
                                className="btn-secondary text-sm disabled:opacity-50">+ Aggiungi</button>
                        </div>
                        {closures.length === 0 ? (
                            <p className="text-xs text-gray-400">Nessun periodo di chiusura programmato.</p>
                        ) : (
                            <ul className="space-y-1.5">
                                {closures.map(c => (
                                    <li key={c.id} className="flex items-center justify-between gap-2 bg-red-50 text-red-800 text-sm px-3 py-2 rounded-lg">
                                        <span>
                                            {c.from === c.to ? itDate(c.from) : `Dal ${itDate(c.from)} al ${itDate(c.to)}`}
                                            {c.note && <span className="ml-2 font-semibold">— {c.note}</span>}
                                        </span>
                                        <button onClick={() => removeClosure(c)} title="Elimina" className="p-1 hover:bg-red-100 rounded">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {/* ── Vista live: slot del giorno ── */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <Clock className="w-5 h-5 text-primary" />
                        <h2 className="text-lg font-bold text-gray-800">Slot del giorno</h2>
                    </div>

                    {/* Date selector */}
                    <div className="flex flex-wrap items-center gap-2 mb-5">
                        {dateShortcuts.map(s => (
                            <button key={s.iso} onClick={() => setActiveDate(s.iso)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                    activeDate === s.iso
                                        ? 'bg-primary text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}>
                                {s.label}
                            </button>
                        ))}
                        <input type="date" value={activeDate}
                            onChange={e => setActiveDate(e.target.value)}
                            className="input-style ml-auto max-w-[160px] text-sm" />
                    </div>

                    <div className="flex items-center justify-between gap-2 mb-3">
                        <p className="text-xs text-gray-500 capitalize">{itDate(activeDate)}</p>
                        {slots.length > 0 && !dayClosedByRange && (
                            <button onClick={toggleDay}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${dayClosed
                                    ? 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                                    : 'border-red-300 text-red-700 hover:bg-red-50'}`}>
                                {dayClosed ? 'Riapri giorno' : 'Chiudi giorno'}
                            </button>
                        )}
                    </div>
                    {dayClosed && (
                        <div className="mb-3 rounded-lg bg-red-50 text-red-700 text-xs font-semibold px-3 py-2">
                            {dayClosedByRange
                                ? 'Giorno compreso in un periodo di chiusura: elimina il periodo per riaprirlo.'
                                : 'Asporto chiuso per tutta la giornata.'}
                        </div>
                    )}

                    {loadingSlots ? (
                        <div className="py-12 text-center text-gray-400 text-sm">Caricamento…</div>
                    ) : slots.length === 0 ? (
                        <div className="py-12 text-center">
                            <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Nessuno slot per questo giorno.</p>
                            <p className="text-xs text-gray-400 mt-1">Aggiungi un range orario per il giorno della settimana corrispondente.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[600px] overflow-y-auto pr-1">
                            {slots.map(s => <SlotCard key={s.time} slot={s}
                                onClose={() => onClose(s)} onOpen={() => onOpen(s)}
                                onManual={() => onManual(s)} onReset={() => onReset(s)} />)}
                        </div>
                    )}

                    <div className="mt-5 pt-5 border-t border-gray-100 text-xs text-gray-500 space-y-1">
                        <p className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Libero — disponibile per i clienti</p>
                        <p className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-orange-500" /> Su richiesta — solo nella riserva, da approvare</p>
                        <p className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-500" /> Pieno — limite raggiunto</p>
                        <p className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-500" /> Chiuso a mano</p>
                        <p className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-gray-300" /> Passato</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const NumberField: React.FC<{
    label: string; value: number; onChange: (v: number) => void;
    min?: number; max?: number; step?: number;
}> = ({ label, value, onChange, min, max, step = 1 }) => (
    <div>
        <label className="label-style text-xs">{label}</label>
        <input type="number" value={value} min={min} max={max} step={step}
            onChange={e => onChange(parseInt(e.target.value, 10) || 0)}
            className="input-style mt-1" />
    </div>
);

const SlotCard: React.FC<{
    slot: Slot;
    onClose: () => void; onOpen: () => void; onManual: () => void; onReset: () => void;
}> = ({ slot, onClose, onOpen, onManual, onReset }) => {
    const cls = {
        AVAILABLE: 'border-emerald-200 bg-emerald-50/50',
        ON_REQUEST: 'border-orange-300 bg-orange-50/60',
        FULL:      'border-amber-200 bg-amber-50/50',
        CLOSED:    'border-red-200 bg-red-50/50 opacity-70',
        PAST:      'border-gray-200 bg-gray-50 opacity-60',
    }[slot.status];

    const dotCls = {
        AVAILABLE: 'bg-emerald-500',
        ON_REQUEST: 'bg-orange-500',
        FULL:      'bg-amber-500',
        CLOSED:    'bg-red-500',
        PAST:      'bg-gray-300',
    }[slot.status];

    const labelStatus = {
        AVAILABLE: 'Libero',
        ON_REQUEST: 'Su richiesta',
        FULL:      'Pieno',
        CLOSED:    slot.closedReason === 'RANGE' ? 'Ferie' : slot.closedReason === 'DAY' ? 'Giorno chiuso' : 'Chiuso',
        PAST:      'Passato',
    }[slot.status];

    return (
        <div className={`border rounded-xl p-3 transition-colors ${cls}`}>
            <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-gray-800 text-base">{slot.time}</span>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-600">
                    <span className={`w-1.5 h-1.5 rounded-full ${dotCls}`} />
                    {labelStatus}
                </span>
            </div>
            <div className="text-xs text-gray-600 mb-2.5 leading-tight">
                <div>
                    Ordini: <span className="font-semibold">{slot.orderCount}/{slot.maxOrders}</span>
                    {(slot.reserveOrders ?? 0) > 0 && <span className="text-orange-600"> (+{slot.reserveOrders} su rich.)</span>}
                </div>
                <div>Prodotti: <span className="font-semibold">{slot.productCount}/{slot.maxProducts > 0 ? slot.maxProducts : '∞'}</span></div>
                {slot.manualOrders > 0 && (
                    <div className="text-amber-600 text-[10px] mt-0.5">
                        +{slot.manualOrders} manuali ({slot.manualProducts}p)
                    </div>
                )}
            </div>

            {slot.status !== 'PAST' && (
                <div className="flex flex-wrap gap-1">
                    {slot.status === 'CLOSED' && slot.closedReason && slot.closedReason !== 'SLOT' ? null : slot.status === 'CLOSED' ? (
                        <button onClick={onOpen} title="Riapri slot"
                            className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-semibold bg-white border border-gray-200 hover:border-emerald-400 hover:text-emerald-700 rounded-md py-1">
                            <Unlock className="w-3 h-3" /> Riapri
                        </button>
                    ) : (
                        <button onClick={onClose} title="Chiudi slot (slot pieno manualmente)"
                            className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-semibold bg-white border border-gray-200 hover:border-red-400 hover:text-red-700 rounded-md py-1">
                            <Lock className="w-3 h-3" /> Chiudi
                        </button>
                    )}
                    <button onClick={onManual} title="Aggiungi ordine manuale (telefonico)"
                        className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-semibold bg-white border border-gray-200 hover:border-primary hover:text-primary rounded-md py-1">
                        <Plus className="w-3 h-3" /> +1
                    </button>
                    {slot.manualOrders > 0 && (
                        <button onClick={onReset} title="Azzera ordini manuali"
                            className="inline-flex items-center justify-center text-[11px] font-semibold bg-white border border-gray-200 hover:border-gray-400 hover:text-gray-700 rounded-md py-1 px-1.5">
                            <RotateCcw className="w-3 h-3" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default TakeawaySlotsPage;
