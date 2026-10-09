import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Printer, Plus, Pencil, Trash2, KeyRound, Copy, Check, X, RefreshCw, Send, ListChecks, AlertCircle, Wifi, WifiOff, Tablet, ExternalLink,
} from 'lucide-react';
import { useNotification } from '../../Context/NotificationContext';
import { useData } from '../../Context/DataContext';
import CustomLoading from '../../Components/CustomLoading';
import {
    getPrintersApi, createPrinterApi, updatePrinterApi, deletePrinterApi, regeneratePrinterTokenApi,
    testPrinterApi, getPrinterJobsApi, getTabletTestApi,
    type PrinterDto, type PrinterRequest, type PrintJobDto, type PrinterType, type PrintOn, type PrintJobStatus,
} from '../../Utilities/printApi';
import { isAndroid, printCached, printWhenReady, hasCached, RAWBT_PLAY_URL, type FetchOutcome } from '../../Utilities/rawbt';
import { invalidateTabletStatus } from '../../Hooks/useTabletPrinting';

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<PrinterType, string> = {
    STAR_CLOUDPRNT: 'Star CloudPRNT',
    ESCPOS_BRIDGE: 'ESC/POS (bridge)',
    TABLET_RAWBT: 'Tablet Android (RawBT)',
};

const testKey = (printerId: string) => `test:${printerId}`;

const PRINT_ON_LABEL: Record<PrintOn, string> = {
    CREATED: 'Alla creazione della comanda',
    ACCEPTED: "Quando la comanda è accettata (in preparazione)",
};

const JOB_STATUS: Record<PrintJobStatus, { label: string; cls: string }> = {
    PENDING: { label: 'In coda',   cls: 'bg-gray-100 text-gray-700' },
    SENT:    { label: 'Inviato',   cls: 'bg-amber-100 text-amber-700' },
    PRINTED: { label: 'Stampato',  cls: 'bg-emerald-100 text-emerald-700' },
    FAILED:  { label: 'Fallito',   cls: 'bg-red-100 text-red-700' },
};

const JOB_KIND: Record<string, string> = { NEW_ORDER: 'Comanda', REPRINT: 'Ristampa', TEST: 'Test' };

const emptyForm = (): PrinterRequest => ({
    name: '',
    type: 'ESCPOS_BRIDGE',
    macAddress: '',
    paperWidth: 80,
    categoryFilter: [],
    printOn: 'CREATED',
    copies: 1,
    enabled: true,
});

const fmtDateTime = (iso?: string) =>
    iso ? new Date(iso).toLocaleString('it-IT', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

// ─── Page ─────────────────────────────────────────────────────────────────────

const PrintersPage: React.FC = () => {
    const { addNotification } = useNotification();
    const { categoriesMap } = useData();

    const [printers, setPrinters] = useState<PrinterDto[]>([]);
    const [loading, setLoading] = useState(true);

    const [editing, setEditing] = useState<PrinterDto | null>(null);
    const [formOpen, setFormOpen] = useState(false);
    const [form, setForm] = useState<PrinterRequest>(emptyForm());
    const [saving, setSaving] = useState(false);

    const [revealed, setRevealed] = useState<PrinterDto | null>(null);

    const [jobsFor, setJobsFor] = useState<PrinterDto | null>(null);
    const [jobs, setJobs] = useState<PrintJobDto[]>([]);
    const [loadingJobs, setLoadingJobs] = useState(false);
    // Stampa di prova tablet scaricata oltre la finestra del tocco → "Tocca per stampare"
    const [testPending, setTestPending] = useState<string | null>(null);
    const android = isAndroid();

    const categories = useMemo(
        () => Array.from(categoriesMap.values()).sort((a, b) => (a.progressiveNumber ?? 0) - (b.progressiveNumber ?? 0)),
        [categoriesMap]
    );
    const categoryName = useCallback((v: string) => {
        const c = categoriesMap.get(Number(v));
        return c ? c.name : v;
    }, [categoriesMap]);

    // ── Load ──
    const refresh = useCallback(async () => {
        const res = await getPrintersApi();
        if (res.success && res.data) setPrinters(res.data);
        else addNotification({ message: 'Errore caricamento stampanti', type: 'error' });
        setLoading(false);
    }, [addNotification]);

    useEffect(() => { refresh(); }, [refresh]);

    // stato online/ultimo contatto aggiornato periodicamente
    useEffect(() => {
        const t = setInterval(refresh, 30000);
        return () => clearInterval(t);
    }, [refresh]);

    const refreshJobs = useCallback(async (p: PrinterDto, silent = false) => {
        if (!silent) setLoadingJobs(true);
        const res = await getPrinterJobsApi(p.id, 20);
        if (res.success && res.data) setJobs(res.data);
        setLoadingJobs(false);
    }, []);

    useEffect(() => {
        if (!jobsFor) return;
        refreshJobs(jobsFor);
        const t = setInterval(() => refreshJobs(jobsFor, true), 5000);
        return () => clearInterval(t);
    }, [jobsFor, refreshJobs]);

    // ── Form ──
    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm());
        setFormOpen(true);
    };

    const openEdit = (p: PrinterDto) => {
        setEditing(p);
        setForm({
            name: p.name,
            type: p.type,
            macAddress: p.macAddress || '',
            paperWidth: p.paperWidth,
            categoryFilter: [...(p.categoryFilter || [])],
            printOn: p.printOn,
            copies: p.copies,
            enabled: p.enabled,
        });
        setFormOpen(true);
    };

    const toggleCategory = (id: string) => {
        setForm(f => ({
            ...f,
            categoryFilter: f.categoryFilter.includes(id) ? f.categoryFilter.filter(x => x !== id) : [...f.categoryFilter, id],
        }));
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            addNotification({ message: 'Inserisci un nome per la stampante', type: 'error' });
            return;
        }
        setSaving(true);
        const payload: PrinterRequest = { ...form, name: form.name.trim(), macAddress: form.type === 'STAR_CLOUDPRNT' ? form.macAddress : '' };
        const res = editing ? await updatePrinterApi(editing.id, payload) : await createPrinterApi(payload);
        setSaving(false);
        if (res.success && res.data) {
            setFormOpen(false);
            invalidateTabletStatus();
            if (!editing && res.data.type !== 'TABLET_RAWBT') setRevealed(res.data); // token mostrato una sola volta
            addNotification({ message: editing ? 'Stampante aggiornata' : 'Stampante creata', type: 'success' });
            refresh();
        } else {
            addNotification({ message: res.status === 400 ? 'Dati non validi (controlla il MAC address)' : 'Errore salvataggio stampante', type: 'error' });
        }
    };

    // ── Azioni ──
    const handleDelete = async (p: PrinterDto) => {
        if (!window.confirm(`Eliminare la stampante "${p.name}"? I job in coda verranno persi.`)) return;
        const res = await deletePrinterApi(p.id);
        if (res.success) {
            if (jobsFor?.id === p.id) setJobsFor(null);
            invalidateTabletStatus();
            addNotification({ message: 'Stampante eliminata', type: 'success' });
            refresh();
        } else addNotification({ message: 'Errore eliminazione stampante', type: 'error' });
    };

    const handleRegenerate = async (p: PrinterDto) => {
        if (!window.confirm(`Generare un nuovo token per "${p.name}"? Il vecchio token smetterà di funzionare e andrà aggiornata la configurazione della stampante/bridge.`)) return;
        const res = await regeneratePrinterTokenApi(p.id);
        if (res.success && res.data) {
            setRevealed(res.data);
            refresh();
        } else addNotification({ message: 'Errore rigenerazione token', type: 'error' });
    };

    const handleTest = async (p: PrinterDto) => {
        const res = await testPrinterApi(p.id);
        if (res.success) {
            addNotification({ message: `Stampa di prova inviata a "${p.name}"`, type: 'success' });
            setJobsFor(p);
            refreshJobs(p, true);
        } else addNotification({ message: 'Errore invio stampa di prova', type: 'error' });
    };

    /** Prova tablet: scarica l'ESC/POS e apre RawBT entro la finestra del tocco (altrimenti "Tocca per stampare"). */
    const handleTabletTest = async (p: PrinterDto) => {
        const key = testKey(p.id);
        if (testPending === p.id && hasCached(key)) {
            printCached(key);
            setTestPending(null);
            return;
        }
        const tapAt = performance.now();
        const ticket: Promise<FetchOutcome> = getTabletTestApi(p.id).then((res): FetchOutcome =>
            res.success && res.data?.escposBase64
                ? { kind: 'ok', b64: res.data.escposBase64, tickets: 1 }
                : { kind: 'error', message: 'Errore preparazione stampa di prova' });
        const r = await printWhenReady(key, ticket, tapAt);
        if (r.outcome === 'deferred') {
            setTestPending(p.id);
            addNotification({ message: 'Stampa pronta: tocca "Tocca per stampare"', type: 'warning' });
        } else if (r.outcome === 'error') {
            addNotification({ message: r.message || 'Errore stampa di prova', type: 'error' });
        } else {
            setTestPending(null);
            if (jobsFor?.id === p.id) refreshJobs(p, true);
        }
    };

    if (loading) return <CustomLoading isFullPage />;

    return (
        <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
            <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Stampanti comande</h1>
                    <p className="text-gray-500 mt-1 text-sm max-w-xl">
                        Stampa automatica delle comande in cucina/bar (non fiscale). Le stampanti Star CloudPRNT si collegano
                        direttamente al server; le stampanti ESC/POS di rete usano il piccolo programma "print bridge" sul PC cassa.
                    </p>
                    <p className="text-gray-500 mt-1 text-sm max-w-xl">
                        Con <b>Tablet Android (RawBT)</b> invece non stampa nulla in automatico: la comanda esce quando sul tablet
                        si tocca <b>"Accetta e stampa"</b> o <b>"Ristampa"</b> nella pagina Ordini.
                    </p>
                </div>
                <button onClick={openCreate} className="btn-primary flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Aggiungi stampante
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* ── Lista stampanti ── */}
                <div className="space-y-4">
                    {printers.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm p-10 text-center">
                            <Printer className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm text-gray-600 font-semibold">Nessuna stampante configurata</p>
                            <p className="text-xs text-gray-400 mt-1">Aggiungi la stampante della cucina per ricevere le comande su carta.</p>
                        </div>
                    ) : printers.map(p => (
                        <div key={p.id} className={`bg-white rounded-xl shadow-sm p-5 border ${jobsFor?.id === p.id ? 'border-primary' : 'border-transparent'}`}>
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <Printer className="w-5 h-5 text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-lg font-bold text-gray-800 truncate">{p.name}</h2>
                                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                            <span className="text-[11px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{TYPE_LABEL[p.type]}</span>
                                            <span className="text-[11px] text-gray-500">{p.paperWidth} mm</span>
                                            {!p.enabled && <span className="text-[11px] font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded">Disattivata</span>}
                                        </div>
                                    </div>
                                </div>
                                {p.type === 'TABLET_RAWBT' ? (
                                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold shrink-0 text-gray-500">
                                        <Tablet className="w-4 h-4" /> Dal tablet
                                    </span>
                                ) : (
                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold shrink-0 ${p.online ? 'text-emerald-600' : 'text-gray-400'}`}
                                      title={p.lastSeenAt ? `Ultimo contatto: ${fmtDateTime(p.lastSeenAt)}` : 'Mai collegata'}>
                                    {p.online ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                                    {p.online ? 'Online' : 'Offline'}
                                </span>
                                )}
                            </div>

                            <div className="mt-4 text-xs text-gray-600 space-y-1">
                                <div>Stampa: <span className="font-semibold">
                                    {p.type === 'TABLET_RAWBT' ? 'Solo dal tablet ("Accetta e stampa" / "Ristampa")' : PRINT_ON_LABEL[p.printOn]}
                                </span></div>
                                <div>Copie: <span className="font-semibold">{p.copies}</span></div>
                                <div>
                                    Categorie:{' '}
                                    <span className="font-semibold">
                                        {p.categoryFilter?.length ? p.categoryFilter.map(categoryName).join(', ') : 'Tutte'}
                                    </span>
                                </div>
                                {p.type !== 'TABLET_RAWBT' && <div>Ultimo contatto: <span className="font-semibold">{fmtDateTime(p.lastSeenAt)}</span></div>}
                                {p.tokenHint && <div>Token: <span className="font-mono">••••{p.tokenHint}</span></div>}
                            </div>

                            <div className="flex flex-wrap gap-2 mt-4">
                                {p.type === 'TABLET_RAWBT' ? (
                                    <ActionButton onClick={() => handleTabletTest(p)} icon={<Send className="w-3.5 h-3.5" />}
                                                  label={testPending === p.id ? 'Tocca per stampare' : 'Stampa di prova'}
                                                  disabled={!android}
                                                  title={android ? undefined : 'Disponibile solo dal tablet Android con RawBT'} />
                                ) : (
                                    <ActionButton onClick={() => handleTest(p)} icon={<Send className="w-3.5 h-3.5" />} label="Stampa di prova" />
                                )}
                                <ActionButton onClick={() => setJobsFor(p)} icon={<ListChecks className="w-3.5 h-3.5" />} label="Ultimi job" />
                                <ActionButton onClick={() => openEdit(p)} icon={<Pencil className="w-3.5 h-3.5" />} label="Modifica" />
                                {p.type !== 'TABLET_RAWBT' && (
                                    <ActionButton onClick={() => handleRegenerate(p)} icon={<KeyRound className="w-3.5 h-3.5" />} label="Rigenera token" />
                                )}
                                <ActionButton onClick={() => handleDelete(p)} icon={<Trash2 className="w-3.5 h-3.5" />} label="Elimina" danger />
                            </div>
                            {p.type === 'TABLET_RAWBT' && !android && (
                                <p className="text-[11px] text-gray-400 mt-2">La stampa di prova funziona aprendo questa pagina in Chrome sul tablet Android con RawBT.</p>
                            )}
                        </div>
                    ))}
                </div>

                {/* ── Ultimi job ── */}
                <div className="bg-white rounded-xl shadow-sm p-6 h-fit">
                    <div className="flex items-center justify-between gap-2 mb-5">
                        <div className="flex items-center gap-2">
                            <ListChecks className="w-5 h-5 text-primary" />
                            <h2 className="text-lg font-bold text-gray-800">
                                Ultimi job{jobsFor ? ` — ${jobsFor.name}` : ''}
                            </h2>
                        </div>
                        {jobsFor && (
                            <button onClick={() => refreshJobs(jobsFor)} className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/5 rounded" title="Aggiorna">
                                <RefreshCw className="w-4 h-4" />
                            </button>
                        )}
                    </div>

                    {!jobsFor ? (
                        <div className="py-12 text-center">
                            <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Seleziona "Ultimi job" su una stampante.</p>
                        </div>
                    ) : loadingJobs ? (
                        <div className="py-12 text-center text-gray-400 text-sm">Caricamento…</div>
                    ) : jobs.length === 0 ? (
                        <div className="py-12 text-center text-gray-400 text-sm">Nessun job per questa stampante.</div>
                    ) : (
                        <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
                            {jobs.map(j => (
                                <details key={j.id} className="border border-gray-200 rounded-lg px-3 py-2">
                                    <summary className="flex items-center justify-between gap-2 cursor-pointer list-none">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${JOB_STATUS[j.status].cls}`}>
                                                {JOB_STATUS[j.status].label}
                                            </span>
                                            <span className="text-xs font-semibold text-gray-700">{JOB_KIND[j.kind] || j.kind}</span>
                                            {j.attempts > 1 && <span className="text-[10px] text-amber-600">{j.attempts} tentativi</span>}
                                        </div>
                                        <span className="text-xs text-gray-500 shrink-0">{fmtDateTime(j.createdAt)}</span>
                                    </summary>
                                    {j.lastError && <p className="text-xs text-red-600 mt-2">Errore: {j.lastError}</p>}
                                    {j.preview && (
                                        <pre className="mt-2 text-[11px] leading-tight bg-gray-50 border border-gray-100 rounded p-2 overflow-x-auto font-mono text-gray-700">
                                            {j.preview}
                                        </pre>
                                    )}
                                </details>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {formOpen && (
                <Modal title={editing ? 'Modifica stampante' : 'Nuova stampante'} onClose={() => setFormOpen(false)}>
                    <div className="space-y-4">
                        <div>
                            <label className="label-style text-xs">Nome</label>
                            <input className="input-style mt-1" value={form.name} maxLength={60} placeholder="es. Cucina, Pizzeria, Bar"
                                   onChange={e => setForm({ ...form, name: e.target.value })} />
                        </div>

                        <div>
                            <label className="label-style text-xs">Tipo di stampante</label>
                            <select className="input-style mt-1" value={form.type}
                                    onChange={e => setForm({ ...form, type: e.target.value as PrinterType })}>
                                <option value="ESCPOS_BRIDGE">ESC/POS di rete tramite bridge (Rongta, Xprinter, …)</option>
                                <option value="STAR_CLOUDPRNT">Star CloudPRNT (mC-Print2/3, TSP143IV)</option>
                                <option value="TABLET_RAWBT">Tablet Android (RawBT) — Bluetooth, USB o WiFi</option>
                            </select>
                        </div>

                        {form.type === 'TABLET_RAWBT' && <TabletSetupBox />}

                        {form.type === 'STAR_CLOUDPRNT' && (
                            <div>
                                <label className="label-style text-xs">MAC address (facoltativo)</label>
                                <input className="input-style mt-1 font-mono" value={form.macAddress || ''} placeholder="00:11:62:AA:BB:CC"
                                       onChange={e => setForm({ ...form, macAddress: e.target.value })} />
                                <p className="text-[11px] text-gray-400 mt-1">Se vuoto viene memorizzato al primo collegamento della stampante.</p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="label-style text-xs">Larghezza carta</label>
                                <select className="input-style mt-1" value={form.paperWidth}
                                        onChange={e => setForm({ ...form, paperWidth: parseInt(e.target.value, 10) })}>
                                    <option value={80}>80 mm (48 caratteri)</option>
                                    <option value={58}>58 mm (32 caratteri)</option>
                                </select>
                            </div>
                            <div>
                                <label className="label-style text-xs">Copie</label>
                                <input type="number" min={1} max={5} className="input-style mt-1" value={form.copies}
                                       onChange={e => setForm({ ...form, copies: Math.max(1, Math.min(5, parseInt(e.target.value, 10) || 1)) })} />
                            </div>
                        </div>

                        {form.type !== 'TABLET_RAWBT' && <div>
                            <label className="label-style text-xs">Quando stampare</label>
                            <select className="input-style mt-1" value={form.printOn}
                                    onChange={e => setForm({ ...form, printOn: e.target.value as PrintOn })}>
                                <option value="CREATED">{PRINT_ON_LABEL.CREATED}</option>
                                <option value="ACCEPTED">{PRINT_ON_LABEL.ACCEPTED}</option>
                            </select>
                        </div>}

                        <div>
                            <div className="flex items-center justify-between">
                                <label className="label-style text-xs">Categorie da stampare</label>
                                {form.categoryFilter.length > 0 && (
                                    <button className="text-[11px] font-semibold text-primary" onClick={() => setForm({ ...form, categoryFilter: [] })}>
                                        Tutte
                                    </button>
                                )}
                            </div>
                            <p className="text-[11px] text-gray-400 mb-2">Nessuna selezione = tutte le categorie. Es. "Pizze" sulla stampante pizzeria, "Bevande" sul bar.</p>
                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                                {categories.map(c => {
                                    const id = String(c.id);
                                    const active = form.categoryFilter.includes(id);
                                    return (
                                        <button key={c.id} type="button" onClick={() => toggleCategory(id)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                                                    active ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}>
                                            {c.name}
                                        </button>
                                    );
                                })}
                                {categories.length === 0 && <span className="text-xs text-gray-400">Nessuna categoria nel menu.</span>}
                            </div>
                        </div>

                        <label className="flex items-center gap-2 text-sm text-gray-700">
                            <input type="checkbox" checked={form.enabled} onChange={e => setForm({ ...form, enabled: e.target.checked })} />
                            Stampante attiva
                        </label>

                        <div className="flex justify-end gap-2 pt-2">
                            <button className="btn-secondary text-sm" onClick={() => setFormOpen(false)}>Annulla</button>
                            <button className="btn-primary text-sm disabled:opacity-50" disabled={saving} onClick={handleSave}>
                                {saving ? 'Salvataggio…' : 'Salva'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {revealed && (
                <Modal title={`Configurazione "${revealed.name}"`} onClose={() => setRevealed(null)}>
                    <div className="space-y-4">
                        <div className="flex items-start gap-2 bg-amber-50 text-amber-800 text-xs rounded-lg p-3">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>Il token viene mostrato <b>una sola volta</b>. Copialo ora: se lo perdi dovrai rigenerarlo.</span>
                        </div>

                        {revealed.type === 'STAR_CLOUDPRNT' ? (
                            <>
                                <CopyField label="URL CloudPRNT (Server URL)" value={revealed.setupUrl || ''} />
                                <ol className="text-xs text-gray-600 list-decimal pl-5 space-y-1">
                                    <li>Apri la pagina web della stampante (indirizzo IP stampato nell'autotest) ed effettua il login.</li>
                                    <li>Vai in <b>CloudPRNT</b>, abilita il servizio e incolla l'URL qui sopra come <b>Server URL</b>.</li>
                                    <li>Imposta un intervallo di poll di 3-5 secondi, salva e riavvia la stampante.</li>
                                    <li>Torna qui e premi "Stampa di prova".</li>
                                </ol>
                            </>
                        ) : (
                            <>
                                <CopyField label="Device token" value={revealed.deviceToken || ''} />
                                <CopyField
                                    label="config.json del print bridge"
                                    multiline
                                    value={JSON.stringify({
                                        serverUrl: revealed.setupUrl || '',
                                        deviceToken: revealed.deviceToken || '',
                                        printer: { host: '192.168.1.50', port: 9100 },
                                        pollIntervalMs: 2500,
                                    }, null, 2)}
                                />
                                <p className="text-xs text-gray-600">
                                    Sostituisci <span className="font-mono">host</span> con l'IP della stampante, salva il file accanto a
                                    <span className="font-mono"> bridge.js</span> sul PC cassa e avvia il bridge (vedi README del print bridge).
                                </p>
                            </>
                        )}

                        <div className="flex justify-end">
                            <button className="btn-primary text-sm" onClick={() => setRevealed(null)}>Ho copiato i dati</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const TabletSetupBox: React.FC = () => (
    <div className="bg-sky-50 border border-sky-100 text-sky-900 text-xs rounded-lg p-3 space-y-2">
        <p className="font-semibold flex items-center gap-1.5"><Tablet className="w-4 h-4" /> Stampa dal tablet Android</p>
        <ol className="list-decimal pl-5 space-y-1">
            <li>
                Installa <b>RawBT</b> dal Play Store sul tablet:{' '}
                <a href={RAWBT_PLAY_URL} target="_blank" rel="noopener noreferrer" className="underline font-semibold inline-flex items-center gap-0.5">
                    apri Play Store <ExternalLink className="w-3 h-3" />
                </a>
            </li>
            <li>
                Nelle impostazioni di RawBT scegli la stampante (<b>Bluetooth</b>, <b>WiFi</b> IP:9100 o <b>USB</b>),
                il driver <b>ESC/POS</b> e la stessa larghezza carta impostata qui.
            </li>
            <li>Apri questa dashboard in <b>Chrome</b> sullo stesso tablet.</li>
            <li>Salva e premi <b>"Stampa di prova"</b> dal tablet.</li>
        </ol>
        <p className="text-sky-800">
            Non stampa nulla in automatico: le comande escono toccando "Accetta e stampa" o "Ristampa" nella pagina Ordini.
            Più stampanti tablet (es. cucina e bar con categorie diverse) escono come scontrini separati sulla stampante di RawBT.
        </p>
    </div>
);

const ActionButton: React.FC<{ onClick: () => void; icon: React.ReactNode; label: string; danger?: boolean; disabled?: boolean; title?: string }> =
    ({ onClick, icon, label, danger, disabled, title }) => (
    <button onClick={onClick} disabled={disabled} title={title}
            className={`inline-flex items-center gap-1.5 text-xs font-semibold bg-white border border-gray-200 rounded-md px-2.5 py-1.5 transition-colors disabled:opacity-50 disabled:pointer-events-none ${
                danger ? 'hover:border-red-400 hover:text-red-700' : 'hover:border-primary hover:text-primary'
            }`}>
        {icon} {label}
    </button>
);

const CopyField: React.FC<{ label: string; value: string; multiline?: boolean }> = ({ label, value, multiline }) => {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            window.prompt('Copia manualmente:', value);
        }
    };
    return (
        <div>
            <label className="label-style text-xs">{label}</label>
            <div className="flex items-start gap-2 mt-1">
                {multiline ? (
                    <pre className="flex-1 text-[11px] bg-gray-50 border border-gray-200 rounded-lg p-2 overflow-x-auto font-mono">{value}</pre>
                ) : (
                    <input readOnly value={value} className="input-style flex-1 font-mono text-xs" onFocus={e => e.target.select()} />
                )}
                <button onClick={copy} className="btn-secondary text-xs inline-flex items-center gap-1 shrink-0">
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copiato' : 'Copia'}
                </button>
            </div>
        </div>
    );
};

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-800">{title}</h2>
                <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded">
                    <X className="w-5 h-5" />
                </button>
            </div>
            {children}
        </div>
    </div>
);

export default PrintersPage;
