import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../../Context/DataContext';
import CustomLoading from '../../Components/CustomLoading';
import { useLoginContext } from '../../Context/LoginContext';
import { IS_ADMIN, IS_WAITER } from '../../types';
import NumberTicker from '../../Components/ui/NumberTicker';
import GlowCard from '../../Components/ui/GlowCard';
import ShimmerButton from '../../Components/ui/ShimmerButton';
import {
    TableCellsIcon, ShoppingCartIcon, CalendarDaysIcon, CurrencyEuroIcon,
    PlusCircleIcon, BuildingStorefrontIcon, TagIcon, UsersIcon,
    ArrowTrendingUpIcon, ClockIcon,
} from '@heroicons/react/24/outline';
import { getPaymentsTodayTotalApi, getReservationsRangeApi } from '../../Utilities/api';

// ── Animation variants ────────────────────────────────────────────────────────
const pageVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.06, delayChildren: 0.05 },
    },
};

const cardVariant = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    show: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
    },
};

const listVariant = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.05, delayChildren: 0.3 },
    },
};

const listItem = {
    hidden: { opacity: 0, x: -12 },
    show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

// ── KPI card ──────────────────────────────────────────────────────────────────
interface KpiCardProps {
    title: string;
    value: string | number;
    numericValue?: number;
    sub?: string;
    icon: React.ElementType;
    gradient: string;
    glowColor?: string;
    onClick?: () => void;
}

const KpiCard: React.FC<KpiCardProps> = ({
    title, value, numericValue, sub, icon: Icon, gradient, glowColor, onClick,
}) => (
    <motion.div variants={cardVariant}>
        <GlowCard
            glowColor={glowColor || 'rgba(249,115,22,0.12)'}
            className="rounded-2xl"
        >
            <motion.button
                onClick={onClick}
                className="w-full text-left bg-white rounded-2xl p-5 flex items-center gap-4"
                style={{
                    border: '1px solid rgba(0,0,0,0.06)',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    cursor: onClick ? 'pointer' : 'default',
                }}
                whileHover={onClick ? { y: -2, boxShadow: '0 8px 20px rgba(0,0,0,0.1)' } : {}}
                whileTap={onClick ? { scale: 0.98 } : {}}
                transition={{ type: 'spring', stiffness: 350, damping: 26 }}
            >
                <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: gradient }}
                >
                    <Icon className="w-7 h-7 text-white" />
                </div>
                <div>
                    <p className="text-2xl font-black text-gray-900 leading-tight tabular-nums">
                        {numericValue !== undefined ? (
                            <NumberTicker value={numericValue} />
                        ) : (
                            value
                        )}
                    </p>
                    <p className="text-sm font-semibold text-gray-700 mt-0.5">{title}</p>
                    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
                </div>
            </motion.button>
        </GlowCard>
    </motion.div>
);

// ── Quick action ──────────────────────────────────────────────────────────────
interface QuickActionProps {
    label: string;
    icon: React.ElementType;
    onClick: () => void;
    primary?: boolean;
}

const QuickAction: React.FC<QuickActionProps> = ({ label, icon: Icon, onClick, primary }) => (
    <motion.div variants={listItem}>
        {primary ? (
            <ShimmerButton
                onClick={onClick}
                className="w-full px-4 py-3 rounded-xl text-white text-sm flex items-center gap-3"
                style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}
            >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {label}
            </ShimmerButton>
        ) : (
            <motion.button
                onClick={onClick}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-sm bg-white border border-gray-200 text-gray-700"
                whileHover={{ borderColor: 'rgba(249,115,22,0.5)', color: '#f97316', x: 2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
                <Icon className="w-5 h-5 flex-shrink-0 text-gray-400" />
                {label}
            </motion.button>
        )}
    </motion.div>
);

// ── Status badge ──────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
    PENDING:   'bg-yellow-100 text-yellow-700',
    AWAIT:     'bg-yellow-100 text-yellow-700',
    PROGRESS:  'bg-blue-100 text-blue-700',
    COMPLETED: 'bg-green-100 text-green-700',
    DELETED:   'bg-red-100 text-red-600',
};
const STATUS_LABELS: Record<string, string> = {
    PENDING:   'In attesa',
    AWAIT:     'In attesa',
    PROGRESS:  'In preparazione',
    COMPLETED: 'Completato',
    DELETED:   'Eliminato',
};

// ── Main ──────────────────────────────────────────────────────────────────────
const HomePage: React.FC = () => {
    const { localname } = useParams();
    const navigate = useNavigate();
    const { loading, comands, tablesMap, productsMap, categoriesMap, styles } = useData();
    const { checkVariable } = useLoginContext();

    const isAdmin  = checkVariable(IS_ADMIN);
    const isWaiter = checkVariable(IS_WAITER);

    const [todayRevenueCents, setTodayRevenueCents]   = useState<number | null>(null);
    const [todayReservations, setTodayReservations]   = useState<number | null>(null);

    useEffect(() => {
        if (!isAdmin && !isWaiter) return;
        const today = new Date().toISOString().split('T')[0];
        getPaymentsTodayTotalApi().then(r => {
            if (r.success && r.data)
                setTodayRevenueCents((r.data as any).data?.amountCents ?? 0);
        });
        getReservationsRangeApi(today, today).then(r => {
            if (r.success && r.data)
                setTodayReservations(
                    Array.isArray((r.data as any).data) ? (r.data as any).data.length : 0
                );
        });
    }, [isAdmin, isWaiter]);

    const kpis = useMemo(() => {
        const occupiedTables = Array.from(tablesMap.values()).filter(t => t.busy).length;
        const freeTables     = tablesMap.size - occupiedTables;
        const inQueue        = comands.filter(c => c.status === 'PENDING' || c.status === 'AWAIT').length;
        const inProgress     = comands.filter(c => c.status === 'PROGRESS').length;
        return { occupiedTables, freeTables, inQueue, inProgress };
    }, [comands, tablesMap]);

    const recentOrders = useMemo(
        () =>
            [...comands]
                .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
                .slice(0, 6),
        [comands]
    );

    const formatEur = (cents: number) =>
        new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(cents / 100);

    if (loading) return <CustomLoading isFullPage={true} />;

    return (
        <motion.div
            className="p-4 sm:p-6 min-h-screen"
            style={{ background: '#f8f9fb' }}
            variants={pageVariants}
            initial="hidden"
            animate="show"
        >
            {/* Header */}
            <motion.div
                variants={cardVariant}
                className="flex items-center justify-between mb-6"
            >
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Dashboard</h1>
                    <p className="text-gray-400 text-sm mt-0.5 font-medium">
                        {styles?.restaurantName || localname} ·{' '}
                        {new Date().toLocaleDateString('it-IT', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                        })}
                    </p>
                </div>
                {(isAdmin || isWaiter) && (
                    <ShimmerButton
                        onClick={() => navigate(`/Waiters/${localname}/Categories`)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold"
                        style={{ background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' }}
                    >
                        <PlusCircleIcon className="w-5 h-5" />
                        Nuovo Ordine
                    </ShimmerButton>
                )}
            </motion.div>

            {/* KPI Grid */}
            <motion.div
                className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
                variants={pageVariants}
            >
                <KpiCard
                    title="Tavoli Occupati"
                    value={`${kpis.occupiedTables}/${tablesMap.size}`}
                    sub={`${kpis.freeTables} liberi`}
                    icon={TableCellsIcon}
                    gradient="linear-gradient(135deg, #3b82f6, #1d4ed8)"
                    glowColor="rgba(59,130,246,0.15)"
                    onClick={() => navigate(`/${localname}/Dashboard/Tables`)}
                />
                <KpiCard
                    title="Ordini in Coda"
                    numericValue={kpis.inQueue}
                    value={kpis.inQueue}
                    sub={`${kpis.inProgress} in preparazione`}
                    icon={ShoppingCartIcon}
                    gradient="linear-gradient(135deg, #f97316, #ea580c)"
                    glowColor="rgba(249,115,22,0.15)"
                    onClick={() => navigate(`/${localname}/Dashboard/Orders`)}
                />
                <KpiCard
                    title="Prenotazioni Oggi"
                    numericValue={todayReservations ?? 0}
                    value={todayReservations !== null ? todayReservations : '—'}
                    sub="confermate + in attesa"
                    icon={CalendarDaysIcon}
                    gradient="linear-gradient(135deg, #8b5cf6, #6d28d9)"
                    glowColor="rgba(139,92,246,0.15)"
                    onClick={() => navigate(`/${localname}/Dashboard/Reservations`)}
                />
                <KpiCard
                    title="Incassi Oggi"
                    value={todayRevenueCents !== null ? formatEur(todayRevenueCents) : '—'}
                    sub="pagamenti completati"
                    icon={CurrencyEuroIcon}
                    gradient="linear-gradient(135deg, #10b981, #059669)"
                    glowColor="rgba(16,185,129,0.15)"
                />
            </motion.div>

            {/* Quick Actions + Recent Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Quick Actions */}
                <motion.div
                    variants={cardVariant}
                    className="bg-white rounded-2xl p-5"
                    style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
                >
                    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
                        Azioni Rapide
                    </h2>
                    <motion.div
                        className="flex flex-col gap-2"
                        variants={listVariant}
                        initial="hidden"
                        animate="show"
                    >
                        <QuickAction
                            primary
                            label="Nuovo Ordine"
                            icon={PlusCircleIcon}
                            onClick={() => navigate(`/Waiters/${localname}/Categories`)}
                        />
                        <QuickAction
                            label="Gestione Tavoli"
                            icon={TableCellsIcon}
                            onClick={() => navigate(`/${localname}/Dashboard/Tables`)}
                        />
                        <QuickAction
                            label="Vedi Ordini"
                            icon={ShoppingCartIcon}
                            onClick={() => navigate(`/${localname}/Dashboard/Orders`)}
                        />
                        <QuickAction
                            label="Prenotazioni"
                            icon={CalendarDaysIcon}
                            onClick={() => navigate(`/${localname}/Dashboard/Reservations`)}
                        />
                        {isAdmin && (
                            <>
                                <QuickAction
                                    label="Gestione Menu"
                                    icon={BuildingStorefrontIcon}
                                    onClick={() => navigate(`/${localname}/Dashboard/Menu`)}
                                />
                                <QuickAction
                                    label="Categorie"
                                    icon={TagIcon}
                                    onClick={() => navigate(`/${localname}/Dashboard/Categories`)}
                                />
                                <QuickAction
                                    label="Camerieri"
                                    icon={UsersIcon}
                                    onClick={() => navigate(`/${localname}/Dashboard/Waiters`)}
                                />
                            </>
                        )}
                    </motion.div>
                </motion.div>

                {/* Recent Orders */}
                <motion.div
                    variants={cardVariant}
                    className="lg:col-span-2 bg-white rounded-2xl p-5"
                    style={{ border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
                >
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
                            Ordini Recenti
                        </h2>
                        <motion.button
                            onClick={() => navigate(`/${localname}/Dashboard/Orders`)}
                            className="text-xs font-semibold"
                            style={{ color: '#f97316' }}
                            whileHover={{ x: 2 }}
                        >
                            Vedi tutti →
                        </motion.button>
                    </div>

                    {recentOrders.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">
                            <ClockIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
                            <p className="text-sm">Nessun ordine recente</p>
                        </div>
                    ) : (
                        <motion.div
                            className="space-y-2"
                            variants={listVariant}
                            initial="hidden"
                            animate="show"
                        >
                            {recentOrders.map(cmd => {
                                const totalItems = cmd.orders.reduce(
                                    (s, o) => s + o.products.reduce((ps, p) => ps + p.quantity, 0),
                                    0
                                );
                                const diff = Date.now() - new Date(cmd.updatedAt).getTime();
                                const m = Math.floor(diff / 60000);
                                const timeAgo =
                                    m < 1 ? 'adesso' : m < 60 ? `${m}m fa` : `${Math.floor(m / 60)}h fa`;

                                return (
                                    <motion.div
                                        key={cmd.id}
                                        variants={listItem}
                                        className="flex items-center gap-3 p-3 rounded-xl"
                                        whileHover={{ background: '#f9fafb' }}
                                        transition={{ duration: 0.15 }}
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                                            {cmd.idTable ? (
                                                <TableCellsIcon className="w-5 h-5 text-gray-500" />
                                            ) : (
                                                <ShoppingCartIcon className="w-5 h-5 text-gray-500" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-800 truncate">
                                                {cmd.idTable
                                                    ? `Tavolo ${cmd.idTable}`
                                                    : cmd.name || 'Asporto'}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {totalItems}{' '}
                                                {totalItems === 1 ? 'prodotto' : 'prodotti'} · {timeAgo}
                                            </p>
                                        </div>
                                        <span
                                            className={`px-2.5 py-1 rounded-full text-xs font-bold flex-shrink-0 ${STATUS_COLORS[cmd.status] || 'bg-gray-100 text-gray-600'}`}
                                        >
                                            {STATUS_LABELS[cmd.status] || cmd.status}
                                        </span>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    )}
                </motion.div>
            </div>

            {/* Stats footer */}
            <motion.div
                className="grid grid-cols-3 gap-4 mt-6"
                variants={pageVariants}
            >
                {[
                    {
                        label: 'Prodotti nel Menu',
                        value: productsMap.size,
                        icon: BuildingStorefrontIcon,
                        path: `/${localname}/Dashboard/Menu`,
                    },
                    {
                        label: 'Categorie',
                        value: categoriesMap.size,
                        icon: TagIcon,
                        path: `/${localname}/Dashboard/Categories`,
                    },
                    {
                        label: 'Ordini Attivi',
                        value: comands.length,
                        icon: ArrowTrendingUpIcon,
                        path: `/${localname}/Dashboard/Orders`,
                    },
                ].map(({ label, value, icon: Icon, path }) => (
                    <motion.button
                        key={label}
                        variants={cardVariant}
                        onClick={() => navigate(path)}
                        className="bg-white rounded-2xl p-4 text-left"
                        style={{
                            border: '1px solid rgba(0,0,0,0.06)',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
                        }}
                        whileHover={{
                            borderColor: 'rgba(249,115,22,0.35)',
                            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
                            y: -2,
                        }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ type: 'spring', stiffness: 350, damping: 26 }}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Icon className="w-4 h-4 text-gray-400" />
                            <span className="text-xs text-gray-500 font-medium">{label}</span>
                        </div>
                        <p className="text-3xl font-black text-gray-900">
                            <NumberTicker value={value} />
                        </p>
                    </motion.button>
                ))}
            </motion.div>
        </motion.div>
    );
};

export default HomePage;
