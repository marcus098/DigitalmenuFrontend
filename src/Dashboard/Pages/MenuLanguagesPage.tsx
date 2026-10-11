import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Languages, Sparkles} from 'lucide-react';
import {useNotification} from '../../Context/NotificationContext';
import CustomLoading from '../../Components/CustomLoading';
import {
    getTranslationOverviewApi,
    getTranslationRowsApi,
    saveManualTranslationApi,
    startTranslationApi,
    TranslationOverview,
    TranslationRow,
    TranslationStatus,
    updateTranslationSettingsApi,
} from '../../Utilities/translationApi';

const TYPE_LABEL: Record<TranslationRow['type'], string> = {
    CATEGORY: 'Categorie',
    PRODUCT: 'Prodotti',
    INGREDIENT: 'Ingredienti',
};

const STATUS: Record<TranslationStatus, { label: string; cls: string }> = {
    OK: {label: 'Tradotto', cls: 'bg-emerald-50 text-emerald-700'},
    STALE: {label: 'Da aggiornare', cls: 'bg-amber-50 text-amber-700'},
    MISSING: {label: 'Da tradurre', cls: 'bg-gray-100 text-gray-600'},
};

type Filter = 'all' | 'todo' | 'manual';

const errorMessage = (res: { message?: string }, fallback: string) =>
    res.message && !res.message.startsWith('Request failed') ? res.message : fallback;

/** Una riga dell'editor: si salva uscendo dal campo, solo se il testo è cambiato. */
const RowEditor: React.FC<{
    row: TranslationRow;
    onSave: (row: TranslationRow, text: string) => Promise<void>;
}> = ({row, onSave}) => {
    const [value, setValue] = useState(row.translation ?? '');
    const [saving, setSaving] = useState(false);
    useEffect(() => setValue(row.translation ?? ''), [row.translation]);
    const long = row.field === 'DESCRIPTION';
    const commit = async () => {
        if (value.trim() === (row.translation ?? '').trim()) return;
        setSaving(true);
        await onSave(row, value);
        setSaving(false);
    };
    const common = {
        id: `tr-${row.type}-${row.id}-${row.field}`,
        value,
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValue(e.target.value),
        onBlur: commit,
        placeholder: 'Traduzione',
        className: 'input-style w-full',
        disabled: saving,
    };
    return (
        <li className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 px-4 py-3">
            <div className="min-w-0">
                <p className="text-xs text-gray-400 mb-0.5">{row.field === 'NAME' ? 'Nome' : 'Descrizione'}</p>
                <p className="text-sm text-gray-800 break-words">{row.source}</p>
            </div>
            <div className="min-w-0 space-y-1">
                {long ? <textarea rows={2} {...common}/> : <input {...common}/>}
                <div className="flex items-center gap-2 text-xs">
                    <span className={`px-1.5 py-0.5 rounded font-semibold ${STATUS[row.status].cls}`}>{STATUS[row.status].label}</span>
                    {row.manual && <span className="px-1.5 py-0.5 rounded font-semibold bg-indigo-50 text-indigo-700">Corretta a mano</span>}
                    {saving && <span className="text-gray-400">Salvataggio…</span>}
                </div>
            </div>
        </li>
    );
};

const MenuLanguagesPage: React.FC = () => {
    const {addNotification} = useNotification();
    const [overview, setOverview] = useState<TranslationOverview | null>(null);
    const [selected, setSelected] = useState<string[]>([]);
    const [auto, setAuto] = useState(false);
    const [savingSettings, setSavingSettings] = useState(false);
    const [activeLang, setActiveLang] = useState<string | null>(null);
    const [rows, setRows] = useState<TranslationRow[] | null>(null);
    const [filter, setFilter] = useState<Filter>('all');
    const [search, setSearch] = useState('');
    const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const loadOverview = useCallback(async () => {
        const res = await getTranslationOverviewApi();
        if (res.success && res.data?.data) {
            setOverview(res.data.data);
            return res.data.data;
        }
        addNotification({type: 'error', message: 'Impossibile caricare le lingue del menu'});
        return null;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadRows = useCallback(async (lang: string) => {
        setRows(null);
        const res = await getTranslationRowsApi(lang);
        setRows(res.success && res.data?.data ? res.data.data : []);
    }, []);

    useEffect(() => {
        loadOverview().then(o => {
            if (!o) return;
            setSelected(o.settings.languages);
            setAuto(o.settings.autoTranslate);
            if (o.settings.languages.length) setActiveLang(o.settings.languages[0]);
        });
        return () => { if (pollRef.current) clearTimeout(pollRef.current); };
    }, [loadOverview]);

    useEffect(() => { if (activeLang) loadRows(activeLang); }, [activeLang, loadRows]);

    // Mentre la traduzione gira si aggiorna l'avanzamento; alla fine si ricaricano i testi
    const running = !!overview?.job.running;
    useEffect(() => {
        if (!running) return;
        const tick = async () => {
            const o = await loadOverview();
            if (o?.job.running) {
                pollRef.current = setTimeout(tick, 2500);
            } else if (o) {
                if (o.job.error) addNotification({type: 'error', message: o.job.error});
                else addNotification({type: 'success', message: 'Traduzione completata'});
                if (activeLang) loadRows(activeLang);
            }
        };
        pollRef.current = setTimeout(tick, 2500);
        return () => { if (pollRef.current) clearTimeout(pollRef.current); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [running]);

    const settingsDirty = overview != null && (
        auto !== overview.settings.autoTranslate ||
        selected.length !== overview.settings.languages.length ||
        selected.some(l => !overview.settings.languages.includes(l)));

    const saveSettings = async () => {
        setSavingSettings(true);
        const res = await updateTranslationSettingsApi(selected, auto);
        setSavingSettings(false);
        if (res.success) {
            addNotification({type: 'success', message: 'Lingue salvate'});
            const o = await loadOverview();
            if (o && (!activeLang || !o.settings.languages.includes(activeLang))) setActiveLang(o.settings.languages[0] ?? null);
        } else {
            addNotification({type: 'error', message: errorMessage(res, 'Errore nel salvataggio')});
        }
    };

    const start = async (langs?: string[]) => {
        const res = await startTranslationApi(langs);
        if (res.success) {
            addNotification({type: 'info', message: 'Traduzione avviata: puoi continuare a lavorare'});
            loadOverview();
        } else {
            addNotification({type: 'error', message: errorMessage(res, 'Impossibile avviare la traduzione')});
        }
    };

    const saveRow = async (row: TranslationRow, text: string) => {
        if (!activeLang) return;
        const res = await saveManualTranslationApi(activeLang, row, text);
        if (res.success && res.data?.data) {
            const saved = res.data.data;
            setRows(prev => prev?.map(r => r.type === saved.type && r.id === saved.id && r.field === saved.field ? saved : r) ?? prev);
            loadOverview();
        } else {
            addNotification({type: 'error', message: errorMessage(res, 'Errore nel salvataggio')});
        }
    };

    const visibleRows = useMemo(() => {
        if (!rows) return [];
        const q = search.trim().toLowerCase();
        return rows.filter(r => {
            if (filter === 'todo' && r.status === 'OK') return false;
            if (filter === 'manual' && !r.manual) return false;
            return !q || r.source.toLowerCase().includes(q) || (r.translation ?? '').toLowerCase().includes(q);
        });
    }, [rows, filter, search]);

    if (!overview) return <CustomLoading isTransparent={true} isFullPage={true}/>;

    const labelOf = (code: string) => overview.settings.supported.find(l => l.code === code)?.label ?? code;
    const saved = overview.settings.languages;
    const job = overview.job;

    return (
        <div className="p-4 md:p-6 bg-slate-50 min-h-screen space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Lingue del menu</h1>
                <p className="text-gray-500 mt-1">
                    I clienti stranieri scelgono la lingua dal menu. Nomi e descrizioni vengono tradotti in automatico e puoi correggerli quando vuoi.
                </p>
            </div>

            {!overview.settings.aiEnabled && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                    La traduzione automatica non è attiva su questo server. Puoi comunque scegliere le lingue e scrivere le traduzioni a mano.
                </div>
            )}

            {/* Lingue */}
            <section className="bg-white rounded-xl shadow-lg p-4 space-y-4">
                <div className="flex items-center gap-2">
                    <Languages className="w-5 h-5 text-gray-500"/>
                    <h2 className="font-semibold text-gray-800">Lingue offerte ai clienti</h2>
                </div>
                <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1.5 rounded-full text-sm font-semibold bg-gray-900 text-white">Italiano</span>
                    {overview.settings.supported.map(l => {
                        const on = selected.includes(l.code);
                        return (
                            <button key={l.code} type="button" aria-pressed={on}
                                    onClick={() => setSelected(on ? selected.filter(c => c !== l.code) : [...selected, l.code])}
                                    className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                                        on ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                                {l.label}
                            </button>
                        );
                    })}
                </div>
                <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                    <input type="checkbox" className="mt-0.5" checked={auto} onChange={e => setAuto(e.target.checked)}
                           disabled={!overview.settings.aiEnabled}/>
                    <span>
                        Traduci ogni notte i piatti nuovi o modificati
                        <span className="block text-xs text-gray-500">Altrimenti usa "Traduci ora" dopo aver cambiato il menu.</span>
                    </span>
                </label>
                {settingsDirty && (
                    <div className="flex justify-end">
                        <button onClick={saveSettings} disabled={savingSettings} className="btn-primary disabled:opacity-60">
                            {savingSettings ? 'Salvataggio…' : 'Salva lingue'}
                        </button>
                    </div>
                )}
            </section>

            {/* Avanzamento */}
            {overview.languages.length > 0 && (
                <section className="bg-white rounded-xl shadow-lg p-4 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <h2 className="font-semibold text-gray-800">Stato delle traduzioni</h2>
                        <button onClick={() => start()} disabled={running || !overview.settings.aiEnabled || settingsDirty}
                                className="btn-primary flex items-center justify-center gap-2 disabled:opacity-50">
                            <Sparkles className="w-4 h-4"/>
                            {running ? 'Traduzione in corso…' : 'Traduci ora'}
                        </button>
                    </div>
                    {running && (
                        <div className="text-sm text-gray-600">
                            <p>{job.total > 0 ? `${labelOf(job.lang ?? '')}: ${job.done} di ${job.total} testi` : 'Preparazione…'}</p>
                            <div className="h-2 mt-1 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-primary transition-all" style={{width: `${job.total ? (job.done / job.total) * 100 : 5}%`}}/>
                            </div>
                            <p className="text-xs text-gray-400 mt-1">Ci vuole circa un minuto ogni 50 testi. Puoi chiudere la pagina.</p>
                        </div>
                    )}
                    {!running && job.error && (
                        <p className="text-sm text-red-600">Ultima traduzione interrotta: {job.error}</p>
                    )}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {overview.languages.map(l => {
                            const pct = l.total ? Math.round((l.upToDate / l.total) * 100) : 100;
                            return (
                                <div key={l.lang} className="rounded-lg border border-gray-100 p-3">
                                    <div className="flex items-baseline justify-between">
                                        <p className="font-semibold text-gray-800">{labelOf(l.lang)}</p>
                                        <p className="text-sm tabular-nums text-gray-600">{pct}%</p>
                                    </div>
                                    <div className="h-1.5 mt-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500" style={{width: `${pct}%`}}/>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {l.missing > 0 && `${l.missing} da tradurre · `}
                                        {l.stale > 0 && `${l.stale} da aggiornare · `}
                                        {l.manual > 0 && `${l.manual} corrette a mano · `}
                                        {l.total} testi
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Editor */}
            {saved.length > 0 && (
                <section className="bg-white rounded-xl shadow-lg">
                    <div className="p-4 border-b border-gray-100 space-y-3">
                        <h2 className="font-semibold text-gray-800">Rivedi e correggi</h2>
                        <div className="flex flex-wrap gap-2">
                            {saved.map(code => (
                                <button key={code} onClick={() => setActiveLang(code)}
                                        className={`px-3 py-1.5 rounded-md text-sm font-semibold ${
                                            activeLang === code ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                    {labelOf(code)}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cerca un piatto o un testo"
                                   className="input-style flex-1 min-w-0" id="tr-search"/>
                            <select value={filter} onChange={e => setFilter(e.target.value as Filter)} className="input-style sm:!w-56" id="tr-filter">
                                <option value="all">Tutti i testi</option>
                                <option value="todo">Da tradurre o aggiornare</option>
                                <option value="manual">Corretti a mano</option>
                            </select>
                        </div>
                        <p className="text-xs text-gray-500">Le correzioni si salvano uscendo dal campo e non vengono mai sovrascritte dalla traduzione automatica. Svuota il campo per tornare alla traduzione automatica.</p>
                    </div>
                    {rows == null ? (
                        <p className="p-4 text-sm text-gray-400">Caricamento…</p>
                    ) : visibleRows.length === 0 ? (
                        <p className="p-8 text-center text-sm text-gray-500">
                            {rows.length === 0 ? 'Il menu non ha ancora testi da tradurre.' : 'Nessun testo con questi filtri.'}
                        </p>
                    ) : (
                        (['CATEGORY', 'PRODUCT', 'INGREDIENT'] as const).map(type => {
                            const group = visibleRows.filter(r => r.type === type);
                            if (!group.length) return null;
                            return (
                                <div key={type}>
                                    <h3 className="px-4 pt-4 pb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">{TYPE_LABEL[type]}</h3>
                                    <ul className="divide-y divide-gray-100">
                                        {group.map(r => <RowEditor key={`${r.type}-${r.id}-${r.field}`} row={r} onSave={saveRow}/>)}
                                    </ul>
                                </div>
                            );
                        })
                    )}
                </section>
            )}
        </div>
    );
};

export default MenuLanguagesPage;
