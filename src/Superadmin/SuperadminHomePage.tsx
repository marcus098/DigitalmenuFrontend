import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, RefreshCw, StickyNote, ChevronRight } from 'lucide-react';
import { getAgencies, getSuperadminStats } from './superadminApi';
import { AgencySummary, SubscriptionStatus, SuperadminStats } from './types';
import { ErrorBox, formatDate, PROVIDER_LABEL, relativeTime, Spinner, STATUS_LABEL, StatusBadges } from './components';

const FILTERS: { value: SubscriptionStatus | ''; label: string }[] = [
    { value: '', label: 'Tutti' },
    { value: 'TRIAL', label: STATUS_LABEL.TRIAL },
    { value: 'ACTIVE', label: STATUS_LABEL.ACTIVE },
    { value: 'SUSPENDED', label: STATUS_LABEL.SUSPENDED },
    { value: 'CANCELLED', label: STATUS_LABEL.CANCELLED },
];

const StatCard: React.FC<{ label: string; value: number | undefined; tone?: string }> = ({ label, value, tone = 'text-gray-800' }) => (
    <div className="bg-white rounded-xl shadow-sm p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${tone}`}>{value ?? '—'}</p>
    </div>
);

const SuperadminHomePage: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<SuperadminStats | null>(null);
    const [agencies, setAgencies] = useState<AgencySummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [status, setStatus] = useState<SubscriptionStatus | ''>('');
    const requestId = useRef(0);

    // Ricerca con debounce
    useEffect(() => {
        const t = window.setTimeout(() => setDebouncedQuery(query), 300);
        return () => window.clearTimeout(t);
    }, [query]);

    const loadAgencies = useCallback(async () => {
        const id = ++requestId.current;
        setLoading(true);
        const res = await getAgencies(debouncedQuery, status);
        if (id !== requestId.current) return; // risposta superata da una ricerca più recente
        setLoading(false);
        if (res.ok) {
            setAgencies(res.data ?? []);
            setError(null);
        } else {
            setError(res.message);
        }
    }, [debouncedQuery, status]);

    const loadStats = useCallback(async () => {
        const res = await getSuperadminStats();
        if (res.ok) setStats(res.data);
    }, []);

    useEffect(() => { loadAgencies(); }, [loadAgencies]);
    useEffect(() => { loadStats(); }, [loadStats]);

    const open = (a: AgencySummary) => navigate(`/superadmin/agencies/${a.id}`);

    return (
        <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
            <div className="mb-6 flex justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Ristoranti</h1>
                    <p className="text-gray-500 mt-1">Abbonamenti, note interne e accesso di supporto ai locali della piattaforma.</p>
                </div>
                <button
                    onClick={() => { loadAgencies(); loadStats(); }}
                    disabled={loading}
                    className="btn-secondary flex items-center text-sm"
                    title="Aggiorna"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* ── Statistiche ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
                <StatCard label="Locali" value={stats?.agencies} />
                <StatCard label="Attivi" value={stats?.active} tone="text-green-600" />
                <StatCard label="In prova" value={stats?.trial} tone="text-yellow-600" />
                <StatCard label="Sospesi" value={stats?.suspended} tone="text-orange-600" />
                <StatCard label="Disdetti" value={stats?.cancelled} tone="text-gray-500" />
                <StatCard label="Bloccati" value={stats?.blocked} tone="text-red-600" />
                <StatCard label="Ordini oggi" value={stats?.ordersToday} tone="text-primary-600" />
                <StatCard label="Ordini 30gg" value={stats?.ordersLast30Days} tone="text-primary-600" />
            </div>

            {/* ── Filtri ── */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-col md:flex-row md:items-center gap-3">
                <div className="relative md:w-80">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="search"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        placeholder="Cerca nome, localname, email…"
                        className="input-style pl-9"
                        aria-label="Cerca ristoranti"
                    />
                </div>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Filtra per stato">
                    {FILTERS.map(f => (
                        <button
                            key={f.value || 'all'}
                            type="button"
                            onClick={() => setStatus(f.value)}
                            aria-pressed={status === f.value}
                            className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${status === f.value
                                ? 'bg-primary-500 border-primary-500 text-white'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
                <span className="md:ml-auto text-sm text-gray-400">{agencies.length} locali</span>
            </div>

            {error && <div className="mb-4"><ErrorBox>{error}</ErrorBox></div>}

            {loading && agencies.length === 0 ? <Spinner /> : agencies.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm p-10 text-center text-gray-400">Nessun locale trovato.</div>
            ) : (
                <>
                    {/* ── Desktop: tabella ── */}
                    <div className={`hidden lg:block bg-white rounded-xl shadow-sm overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-400 border-b border-gray-100">
                                    <th className="px-4 py-3">Locale</th>
                                    <th className="px-4 py-3">Admin</th>
                                    <th className="px-4 py-3">Stato</th>
                                    <th className="px-4 py-3">N. abbonamento</th>
                                    <th className="px-4 py-3">Attivo dal</th>
                                    <th className="px-4 py-3">Scadenza</th>
                                    <th className="px-4 py-3">Pagamenti</th>
                                    <th className="px-4 py-3 text-right">Tavoli</th>
                                    <th className="px-4 py-3 text-right">Ordini 30gg</th>
                                    <th className="px-4 py-3">Ultimo ordine</th>
                                    <th className="px-4 py-3 text-right">Note</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {agencies.map(a => (
                                    <tr
                                        key={a.id}
                                        onClick={() => open(a)}
                                        onKeyDown={e => { if (e.key === 'Enter') open(a); }}
                                        tabIndex={0}
                                        className={`cursor-pointer hover:bg-primary-50/40 focus:bg-primary-50/40 outline-none ${a.deleted ? 'opacity-60' : ''}`}
                                    >
                                        <td className="px-4 py-3">
                                            <p className="font-semibold text-gray-800">{a.name}</p>
                                            <p className="text-xs text-gray-400">/{a.localname}</p>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate" title={a.adminEmail ?? ''}>{a.adminEmail ?? '—'}</td>
                                        <td className="px-4 py-3"><StatusBadges status={a.subscriptionStatus} blocked={a.blocked} deleted={a.deleted} /></td>
                                        <td className="px-4 py-3 text-gray-600">{a.subscriptionNumber || '—'}</td>
                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(a.activeFrom)}</td>
                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{formatDate(a.billingEndAt)}</td>
                                        <td className="px-4 py-3 text-gray-600">{PROVIDER_LABEL[a.paymentProvider] ?? a.paymentProvider}</td>
                                        <td className="px-4 py-3 text-gray-600 text-right">{a.tablesCount}</td>
                                        <td className="px-4 py-3 text-gray-600 text-right">{a.ordersLast30Days}</td>
                                        <td className="px-4 py-3 text-gray-600 whitespace-nowrap" title={a.lastOrderAt ?? ''}>{relativeTime(a.lastOrderAt)}</td>
                                        <td className="px-4 py-3 text-right">
                                            {a.notesCount > 0
                                                ? <span className="inline-flex items-center gap-1 text-gray-600"><StickyNote className="w-4 h-4 text-gray-400" />{a.notesCount}</span>
                                                : <span className="text-gray-300">—</span>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* ── Mobile/tablet: card ── */}
                    <div className={`lg:hidden grid grid-cols-1 md:grid-cols-2 gap-3 ${loading ? 'opacity-60' : ''}`}>
                        {agencies.map(a => (
                            <button
                                key={a.id}
                                type="button"
                                onClick={() => open(a)}
                                className={`text-left bg-white rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow ${a.deleted ? 'opacity-60' : ''}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-800 truncate">{a.name}</p>
                                        <p className="text-xs text-gray-400 truncate">/{a.localname} · {a.adminEmail ?? '—'}</p>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-300 shrink-0" />
                                </div>
                                <div className="mt-2"><StatusBadges status={a.subscriptionStatus} blocked={a.blocked} deleted={a.deleted} /></div>
                                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                                    <dt className="text-gray-400">N. abbonamento</dt><dd className="text-gray-700 truncate">{a.subscriptionNumber || '—'}</dd>
                                    <dt className="text-gray-400">Attivo dal</dt><dd className="text-gray-700">{formatDate(a.activeFrom)}</dd>
                                    <dt className="text-gray-400">Scadenza</dt><dd className="text-gray-700">{formatDate(a.billingEndAt)}</dd>
                                    <dt className="text-gray-400">Pagamenti</dt><dd className="text-gray-700">{PROVIDER_LABEL[a.paymentProvider] ?? a.paymentProvider}</dd>
                                    <dt className="text-gray-400">Tavoli · Ordini 30gg</dt><dd className="text-gray-700">{a.tablesCount} · {a.ordersLast30Days}</dd>
                                    <dt className="text-gray-400">Ultimo ordine</dt><dd className="text-gray-700">{relativeTime(a.lastOrderAt)}</dd>
                                    <dt className="text-gray-400">Note</dt><dd className="text-gray-700">{a.notesCount}</dd>
                                </dl>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default SuperadminHomePage;
