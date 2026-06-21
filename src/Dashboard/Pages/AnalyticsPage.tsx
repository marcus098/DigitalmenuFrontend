import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '../../Context/DataContext';
import { getPaymentsApi } from '../../Utilities/api';
import { PaymentDto } from '../../types';
import CustomLoading from '../../Components/CustomLoading';
import {
    ArrowTrendingUpIcon, ShoppingCartIcon, TagIcon, CurrencyEuroIcon,
} from '@heroicons/react/24/outline';

const formatEur = (cents: number) =>
    new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);

const isoDate = (d: Date) => d.toISOString().split('T')[0];

const last7Days = (): { label: string; iso: string }[] => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push({
            label: d.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' }),
            iso: isoDate(d),
        });
    }
    return days;
};

const AnalyticsPage: React.FC = () => {
    const { loading, comands, productsMap, categoriesMap } = useData();
    const [payments, setPayments] = useState<PaymentDto[]>([]);
    const [paymentsLoading, setPaymentsLoading] = useState(true);

    useEffect(() => {
        getPaymentsApi().then(r => {
            if (r.success && r.data) setPayments((r.data as any).data ?? r.data);
            setPaymentsLoading(false);
        });
    }, []);

    const days = useMemo(() => last7Days(), []);

    // Revenue per day from payments (COMPLETED only)
    const revenueByDay = useMemo(() => {
        const map: Record<string, number> = {};
        days.forEach(d => { map[d.iso] = 0; });
        payments.filter(p => p.status === 'COMPLETED').forEach(p => {
            const d = p.createdAt ? p.createdAt.split('T')[0] : null;
            if (d && map[d] !== undefined) map[d] += p.amountCents;
        });
        return days.map(d => ({ ...d, cents: map[d.iso] }));
    }, [payments, days]);

    // Orders per day from comands (all statuses)
    const ordersByDay = useMemo(() => {
        const map: Record<string, number> = {};
        days.forEach(d => { map[d.iso] = 0; });
        comands.forEach(c => {
            const d = c.updatedAt ? c.updatedAt.split('T')[0] : null;
            if (d && map[d] !== undefined) map[d]++;
        });
        return days.map(d => ({ ...d, count: map[d.iso] }));
    }, [comands, days]);

    // Top categories by product count
    const topCategories = useMemo(() => {
        const map = new Map<number, { name: string; count: number }>();
        categoriesMap.forEach((cat, id) => map.set(id, { name: cat.name, count: 0 }));
        productsMap.forEach(p => {
            const entry = map.get(p.idCategory);
            if (entry) entry.count++;
        });
        return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 6);
    }, [productsMap, categoriesMap]);

    const maxRevenue = useMemo(() => Math.max(...revenueByDay.map(d => d.cents), 1), [revenueByDay]);
    const maxOrders  = useMemo(() => Math.max(...ordersByDay.map(d => d.count), 1), [ordersByDay]);
    const maxCatCount = useMemo(() => Math.max(...topCategories.map(c => c.count), 1), [topCategories]);

    const totalRevenue  = useMemo(() => payments.filter(p => p.status === 'COMPLETED').reduce((s, p) => s + p.amountCents, 0), [payments]);
    const totalOrders   = comands.length;
    const totalProducts = productsMap.size;
    const totalCats     = categoriesMap.size;

    if (loading || paymentsLoading) return <CustomLoading isFullPage />;

    return (
        <div className="p-4 sm:p-6 bg-slate-50 min-h-screen">

            {/* Header */}
            <div className="mb-6">
                <h1 className="text-3xl font-black text-gray-900">Analytics</h1>
                <p className="text-gray-400 text-sm mt-0.5">Panoramica degli ultimi 7 giorni</p>
            </div>

            {/* Summary KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[
                    { label: 'Ricavi Totali', value: formatEur(totalRevenue), icon: CurrencyEuroIcon, color: 'bg-emerald-500' },
                    { label: 'Ordini Attivi', value: totalOrders, icon: ShoppingCartIcon, color: 'bg-amber-500' },
                    { label: 'Prodotti a Menu', value: totalProducts, icon: ArrowTrendingUpIcon, color: 'bg-blue-500' },
                    { label: 'Categorie', value: totalCats, icon: TagIcon, color: 'bg-violet-500' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
                            <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <p className="text-2xl font-black text-gray-900 leading-tight">{value}</p>
                            <p className="text-sm text-gray-500">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

                {/* Revenue chart */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-5">Ricavi (€) — ultimi 7 giorni</h2>
                    <div className="flex items-end gap-2 h-40">
                        {revenueByDay.map(d => {
                            const pct = maxRevenue > 0 ? (d.cents / maxRevenue) * 100 : 0;
                            return (
                                <div key={d.iso} className="flex-1 flex flex-col items-center gap-1 group">
                                    <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                        {formatEur(d.cents)}
                                    </span>
                                    <div className="w-full rounded-t-lg bg-emerald-500 transition-all" style={{ height: `${Math.max(pct, 4)}%` }} />
                                    <span className="text-[10px] text-gray-400 text-center leading-tight">{d.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Orders chart */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-5">Ordini — ultimi 7 giorni</h2>
                    <div className="flex items-end gap-2 h-40">
                        {ordersByDay.map(d => {
                            const pct = maxOrders > 0 ? (d.count / maxOrders) * 100 : 0;
                            return (
                                <div key={d.iso} className="flex-1 flex flex-col items-center gap-1 group">
                                    <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {d.count}
                                    </span>
                                    <div className="w-full rounded-t-lg bg-amber-400 transition-all" style={{ height: `${Math.max(pct, 4)}%` }} />
                                    <span className="text-[10px] text-gray-400 text-center leading-tight">{d.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Top categories */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-5">Prodotti per Categoria</h2>
                {topCategories.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">Nessuna categoria trovata</p>
                ) : (
                    <div className="space-y-3">
                        {topCategories.map(cat => {
                            const pct = maxCatCount > 0 ? (cat.count / maxCatCount) * 100 : 0;
                            return (
                                <div key={cat.name}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="font-semibold text-gray-700">{cat.name}</span>
                                        <span className="text-gray-400">{cat.count} prodotti</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2">
                                        <div
                                            className="h-2 rounded-full bg-primary transition-all"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AnalyticsPage;
