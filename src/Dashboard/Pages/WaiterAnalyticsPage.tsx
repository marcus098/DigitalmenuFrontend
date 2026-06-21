import React, { useEffect, useMemo, useState } from 'react';
import { getCompletedApi, getWaitersApi } from '../../Utilities/api';
import { WaiterDto } from '../../types';
import { Comand } from '../../ComandType';
import CustomLoading from '../../Components/CustomLoading';
import {
    CurrencyEuroIcon, ShoppingBagIcon, UserGroupIcon, ChartBarIcon, ClockIcon,
} from '@heroicons/react/24/outline';

// ─── Helpers ────────────────────────────────────────────────────────────────

type Period = 'oggi' | '7g' | '30g';
const PERIOD_DAYS: Record<Period, number> = { oggi: 1, '7g': 7, '30g': 30 };
const PERIOD_LABELS: Record<Period, string> = { oggi: 'Oggi', '7g': 'Ultimi 7 giorni', '30g': 'Ultimi 30 giorni' };

type SortKey = 'revenue' | 'orders' | 'avgRevenue' | 'avgTimeMin' | 'items';

const formatEur = (n: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(n);

const formatMin = (min: number): string => {
    if (!isFinite(min) || isNaN(min) || min <= 0) return '—';
    const h = Math.floor(min / 60);
    const m = Math.round(min % 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const isoDate = (d: Date) => d.toISOString().split('T')[0];

const getDates = (days: number): string[] =>
    Array.from({ length: days }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (days - 1 - i));
        return isoDate(d);
    });

const computeValue = (comand: Comand): number =>
    comand.orders.reduce((total, order) =>
        total + order.products.reduce((t, p) => {
            const base = (p.productOption?.price ?? 0) * p.quantity;
            const extras = (p.ingredientsPlus ?? []).reduce((s, i) => s + (i.price ?? 0), 0) * p.quantity;
            return t + base + extras;
        }, 0), 0);

const countItems = (comand: Comand): number =>
    comand.orders.reduce((s, o) => s + o.products.reduce((ps, p) => ps + p.quantity, 0), 0);

// ─── Types ───────────────────────────────────────────────────────────────────

interface WaiterStat {
    waiter: WaiterDto;
    orders: number;
    revenue: number;
    avgRevenue: number;
    avgTimeMin: number;
    items: number;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const StatCell: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="bg-white/70 rounded-xl p-2.5">
        <p className="text-[10px] text-gray-400 uppercase tracking-wider leading-tight">{label}</p>
        <p className="text-sm font-bold text-gray-800 mt-0.5 truncate">{value}</p>
    </div>
);

interface BarItem { label: string; value: number; max: number; display: string; color: string; }
const BarChart: React.FC<{ title: string; items: BarItem[] }> = ({ title, items }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-5">{title}</h2>
        <div className="space-y-3">
            {items.map(it => (
                <div key={it.label}>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold text-gray-700 truncate max-w-[60%]">{it.label}</span>
                        <span className="text-gray-400 shrink-0 ml-2">{it.display}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                        <div
                            className={`h-2.5 rounded-full ${it.color} transition-all`}
                            style={{ width: `${Math.max(it.max > 0 ? (it.value / it.max) * 100 : 0, it.value > 0 ? 3 : 0)}%` }}
                        />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// ─── Medal palette ───────────────────────────────────────────────────────────

const MEDALS = [
    { ring: 'ring-amber-300', bg: 'bg-amber-50', avatar: 'bg-amber-400', rankBg: 'bg-amber-400', emoji: '🥇' },
    { ring: 'ring-slate-300',  bg: 'bg-slate-50',  avatar: 'bg-slate-400',  rankBg: 'bg-slate-400',  emoji: '🥈' },
    { ring: 'ring-orange-300', bg: 'bg-orange-50', avatar: 'bg-orange-400', rankBg: 'bg-orange-400', emoji: '🥉' },
];

// ─── Page ────────────────────────────────────────────────────────────────────

const WaiterAnalyticsPage: React.FC = () => {
    const [period, setPeriod]           = useState<Period>('7g');
    const [waiters, setWaiters]         = useState<WaiterDto[]>([]);
    const [comands, setComands]         = useState<Comand[]>([]);
    const [loadingData, setLoadingData] = useState(true);
    const [sortKey, setSortKey]         = useState<SortKey>('revenue');
    const [sortAsc, setSortAsc]         = useState(false);

    // Fetch waiter list once
    useEffect(() => {
        getWaitersApi().then(r => {
            const list: WaiterDto[] = (r as any)?.data?.data ?? [];
            if (Array.isArray(list)) setWaiters(list);
        });
    }, []);

    // Fetch completed orders for selected period
    useEffect(() => {
        setLoadingData(true);
        const dates = getDates(PERIOD_DAYS[period]);
        Promise.all(dates.map(d => getCompletedApi(d)))
            .then(results => {
                const all: Comand[] = [];
                results.forEach(r => {
                    if ((r as any).success !== false) {
                        const data = (r.data as any)?.data ?? r.data;
                        if (Array.isArray(data))
                            all.push(...(data as Comand[]).filter(c => c.idWaiter != null));
                    }
                });
                setComands(all);
            })
            .finally(() => setLoadingData(false));
    }, [period]);

    // Build per-waiter stats
    const stats = useMemo((): WaiterStat[] =>
        waiters
            .map(waiter => {
                const wc = comands.filter(c => c.idWaiter === waiter.id);
                if (wc.length === 0) return null;
                const orders    = wc.length;
                const revenue   = wc.reduce((s, c) => s + computeValue(c), 0);
                const items     = wc.reduce((s, c) => s + countItems(c), 0);
                const times     = wc
                    .filter(c => c.createdAt && c.updatedAt)
                    .map(c => (new Date(c.updatedAt).getTime() - new Date(c.createdAt).getTime()) / 60000)
                    .filter(t => t > 0);
                const avgTimeMin = times.length ? times.reduce((s, t) => s + t, 0) / times.length : 0;
                return { waiter, orders, revenue, avgRevenue: revenue / orders, avgTimeMin, items };
            })
            .filter(Boolean) as WaiterStat[],
        [waiters, comands]);

    const sorted = useMemo(() => {
        return [...stats].sort((a, b) => {
            // For time: lower = better, so ascending by default when clicking
            const diff = sortKey === 'avgTimeMin'
                ? (a.avgTimeMin || Infinity) - (b.avgTimeMin || Infinity)
                : b[sortKey] - a[sortKey];
            return sortAsc ? -diff : diff;
        });
    }, [stats, sortKey, sortAsc]);

    const totals = useMemo(() => ({
        revenue:       stats.reduce((s, w) => s + w.revenue, 0),
        orders:        stats.reduce((s, w) => s + w.orders,  0),
        items:         stats.reduce((s, w) => s + w.items,   0),
        activeWaiters: stats.length,
    }), [stats]);

    const maxOrders  = useMemo(() => Math.max(...stats.map(s => s.orders),  1), [stats]);
    const maxRevenue = useMemo(() => Math.max(...stats.map(s => s.revenue), 1), [stats]);

    const handleSort = (key: SortKey) => {
        if (sortKey === key) setSortAsc(a => !a);
        else { setSortKey(key); setSortAsc(false); }
    };

    const SortIcon: React.FC<{ col: SortKey }> = ({ col }) => (
        <span className={`ml-1 ${sortKey === col ? 'text-primary' : 'text-gray-300'}`}>
            {sortKey === col ? (sortAsc ? '↑' : '↓') : '⇅'}
        </span>
    );

    const sortLabel: Record<SortKey, string> = {
        revenue: 'revenue', orders: 'ordini', avgRevenue: 'scontrino medio',
        avgTimeMin: 'velocità', items: 'prodotti',
    };

    if (loadingData) return <CustomLoading isFullPage />;

    return (
        <div className="p-4 sm:p-6 bg-slate-50 min-h-screen">

            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900">Report Camerieri</h1>
                    <p className="text-gray-400 text-sm mt-0.5">
                        {PERIOD_LABELS[period]} · {totals.activeWaiters} attivi su {waiters.length} registrati
                    </p>
                </div>
                <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm self-start">
                    {(['oggi', '7g', '30g'] as Period[]).map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                                period === p ? 'bg-primary text-white shadow' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {PERIOD_LABELS[p]}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── KPI Cards ──────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Revenue Staff',    value: formatEur(totals.revenue), icon: CurrencyEuroIcon, color: 'bg-emerald-500' },
                    { label: 'Ordini Totali',    value: totals.orders,             icon: ShoppingBagIcon,  color: 'bg-amber-500'  },
                    { label: 'Prodotti Serviti', value: totals.items,              icon: ChartBarIcon,     color: 'bg-blue-500'   },
                    { label: 'Camerieri Attivi', value: totals.activeWaiters,      icon: UserGroupIcon,    color: 'bg-violet-500' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-2xl font-black text-gray-900 leading-tight truncate">{value}</p>
                            <p className="text-sm text-gray-500">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Empty state ────────────────────────────────────────── */}
            {stats.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
                    <UserGroupIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-semibold">Nessun ordine cameriere nel periodo selezionato</p>
                    <p className="text-gray-400 text-sm mt-1">Prova a selezionare un periodo più ampio</p>
                </div>
            ) : (
                <>
                    {/* ── Top 3 Podium ───────────────────────────────── */}
                    <div className="mb-6">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">
                            Top 3 · ordinati per {sortLabel[sortKey]}
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {sorted.slice(0, 3).map((s, i) => {
                                const m = MEDALS[i] ?? MEDALS[2];
                                return (
                                    <div key={s.waiter.id}
                                         className={`relative rounded-2xl ring-2 ${m.ring} ${m.bg} p-5`}>
                                        <span className="absolute top-3 right-4 text-2xl select-none">{m.emoji}</span>
                                        <div className="flex items-center gap-3 mb-4 pr-10">
                                            <div className={`w-11 h-11 rounded-full ${m.avatar} flex items-center justify-center text-white font-black text-sm shrink-0`}>
                                                {s.waiter.name[0]}{s.waiter.surname[0]}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-gray-800 truncate">
                                                    {s.waiter.name} {s.waiter.surname}
                                                </p>
                                                <p className="text-xs text-gray-400 truncate">{s.waiter.email}</p>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <StatCell label="Ordini"         value={String(s.orders)} />
                                            <StatCell label="Revenue"        value={formatEur(s.revenue)} />
                                            <StatCell label="Scontrino med." value={formatEur(s.avgRevenue)} />
                                            <StatCell label="Tempo medio"    value={formatMin(s.avgTimeMin)} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Bar Charts ─────────────────────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <BarChart
                            title="Ordini per Cameriere"
                            items={[...stats]
                                .sort((a, b) => b.orders - a.orders)
                                .map(s => ({
                                    label:   `${s.waiter.name} ${s.waiter.surname}`,
                                    value:   s.orders,
                                    max:     maxOrders,
                                    display: `${s.orders} ordini`,
                                    color:   'bg-amber-400',
                                }))}
                        />
                        <BarChart
                            title="Revenue per Cameriere"
                            items={[...stats]
                                .sort((a, b) => b.revenue - a.revenue)
                                .map(s => ({
                                    label:   `${s.waiter.name} ${s.waiter.surname}`,
                                    value:   s.revenue,
                                    max:     maxRevenue,
                                    display: formatEur(s.revenue),
                                    color:   'bg-emerald-500',
                                }))}
                        />
                    </div>

                    {/* ── Ranking Table ──────────────────────────────── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100">
                            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
                                Classifica Completa
                            </h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-100 text-xs text-gray-400 uppercase tracking-wider">
                                        <th className="px-4 py-3 text-left font-semibold w-10">#</th>
                                        <th className="px-4 py-3 text-left font-semibold">Cameriere</th>
                                        <th
                                            className="px-4 py-3 text-right font-semibold cursor-pointer hover:text-gray-700 select-none"
                                            onClick={() => handleSort('orders')}
                                        >
                                            Ordini <SortIcon col="orders" />
                                        </th>
                                        <th
                                            className="px-4 py-3 text-right font-semibold cursor-pointer hover:text-gray-700 select-none"
                                            onClick={() => handleSort('revenue')}
                                        >
                                            Revenue <SortIcon col="revenue" />
                                        </th>
                                        <th
                                            className="px-4 py-3 text-right font-semibold cursor-pointer hover:text-gray-700 select-none hidden sm:table-cell"
                                            onClick={() => handleSort('avgRevenue')}
                                        >
                                            Scontrino medio <SortIcon col="avgRevenue" />
                                        </th>
                                        <th
                                            className="px-4 py-3 text-right font-semibold cursor-pointer hover:text-gray-700 select-none hidden md:table-cell"
                                            onClick={() => handleSort('avgTimeMin')}
                                        >
                                            Tempo medio <SortIcon col="avgTimeMin" />
                                        </th>
                                        <th
                                            className="px-4 py-3 text-right font-semibold cursor-pointer hover:text-gray-700 select-none hidden lg:table-cell"
                                            onClick={() => handleSort('items')}
                                        >
                                            Prodotti <SortIcon col="items" />
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {sorted.map((s, idx) => (
                                        <tr key={s.waiter.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="px-4 py-4">
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white ${
                                                    idx === 0 ? 'bg-amber-400' :
                                                    idx === 1 ? 'bg-slate-400'  :
                                                    idx === 2 ? 'bg-orange-400' : 'bg-gray-200 !text-gray-500'
                                                }`}>
                                                    {idx + 1}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                                                        {s.waiter.name[0]}{s.waiter.surname[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-800">
                                                            {s.waiter.name} {s.waiter.surname}
                                                        </p>
                                                        <p className="text-xs text-gray-400">{s.waiter.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right font-bold text-gray-700">
                                                {s.orders}
                                            </td>
                                            <td className="px-4 py-4 text-right font-bold text-emerald-600">
                                                {formatEur(s.revenue)}
                                            </td>
                                            <td className="px-4 py-4 text-right text-gray-600 hidden sm:table-cell">
                                                {formatEur(s.avgRevenue)}
                                            </td>
                                            <td className="px-4 py-4 text-right hidden md:table-cell">
                                                <span className={`font-semibold ${
                                                    s.avgTimeMin <= 0  ? 'text-gray-300'   :
                                                    s.avgTimeMin < 15  ? 'text-emerald-600' :
                                                    s.avgTimeMin < 30  ? 'text-amber-500'   :
                                                    'text-red-500'
                                                }`}>
                                                    {formatMin(s.avgTimeMin)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 text-right text-gray-600 hidden lg:table-cell">
                                                {s.items}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default WaiterAnalyticsPage;
