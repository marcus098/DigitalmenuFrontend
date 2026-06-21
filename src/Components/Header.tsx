import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate, useParams } from 'react-router-dom';
import { useLoginContext } from '../Context/LoginContext';
import {
    Menu, Bell, X, Plus, UserCircle, LogOut, Settings,
    LayoutDashboard, UtensilsCrossed, LayoutGrid, ClipboardList,
    CalendarDays, Receipt, BarChart2, Users, FileBarChart, ChevronDown,
} from 'lucide-react';
import { IS_ADMIN, IS_WAITER } from '../types';

/* ── Navigation definition ─────────────────────────── */
const PRIMARY_LINKS = [
    { name: 'Dashboard',    short: 'Home',        icon: LayoutDashboard, href: 'Home',             waiter: true  },
    { name: 'Gestione Menu', short: 'Menu',        icon: UtensilsCrossed, href: 'Menu',             waiter: true  },
    { name: 'Gestione Sala', short: 'Sala',        icon: LayoutGrid,      href: 'Tables',           waiter: true  },
    { name: 'Ordini',        short: 'Ordini',      icon: ClipboardList,   href: 'Orders',           waiter: true  },
    { name: 'Prenotazioni',  short: 'Prenotazioni',icon: CalendarDays,    href: 'Reservations',     waiter: true  },
    { name: 'Cassa',         short: 'Cassa',       icon: Receipt,         href: 'Cassa',            waiter: false },
];

const ADMIN_MORE_LINKS = [
    { name: 'Analytics',         icon: BarChart2,   href: 'Analytics'        },
    { name: 'Camerieri',         icon: Users,        href: 'Waiters'          },
    { name: 'Report Camerieri',  icon: FileBarChart, href: 'WaiterAnalytics'  },
];

/* ── Component ─────────────────────────────────────── */
const Header: React.FC = () => {
    const { user, logout, checkVariable } = useLoginContext();
    const { localname } = useParams();
    const navigate = useNavigate();

    const [isMobileOpen,  setIsMobileOpen]  = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isMoreOpen,    setIsMoreOpen]    = useState(false);

    const profileRef = useRef<HTMLDivElement>(null);
    const moreRef    = useRef<HTMLDivElement>(null);

    /* close dropdowns on outside click */
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (profileRef.current && !profileRef.current.contains(e.target as Node))
                setIsProfileOpen(false);
            if (moreRef.current && !moreRef.current.contains(e.target as Node))
                setIsMoreOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const isAdmin  = checkVariable(IS_ADMIN);
    const isWaiter = checkVariable(IS_WAITER);

    const visiblePrimary = PRIMARY_LINKS.filter(l => isAdmin || (l.waiter && isWaiter));

    /* ── Shared nav link style ── */
    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        [
            'relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold',
            'transition-colors duration-150 whitespace-nowrap group',
            isActive
                ? 'text-primary-600 bg-primary-50'
                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100',
        ].join(' ');

    return (
        <>
            <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-[1400px] mx-auto px-4">
                    <div className="flex items-center h-14 gap-3">

                        {/* ── Logo ── */}
                        <NavLink
                            to={`/${localname}/Dashboard/Home`}
                            className="flex-shrink-0 flex items-center gap-2"
                        >
                            <span className="text-base font-extrabold text-primary-600 tracking-tight leading-none">
                                {user?.localname}
                            </span>
                        </NavLink>

                        {/* ── Divider ── */}
                        <div className="hidden md:block w-px h-5 bg-gray-200 flex-shrink-0" />

                        {/* ── Desktop nav (scrollable) ── */}
                        <nav
                            className="hidden md:flex flex-1 min-w-0 items-center gap-1 overflow-x-auto"
                            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                            {visiblePrimary.map(link => (
                                <NavLink
                                    key={link.href}
                                    to={`/${localname}/Dashboard/${link.href}`}
                                    className={navLinkClass}
                                    end
                                >
                                    <link.icon className="w-4 h-4 flex-shrink-0" />
                                    <span>{link.short}</span>
                                </NavLink>
                            ))}

                            {/* ── "Altro" dropdown (admin only) ── */}
                            {isAdmin && (
                                <div ref={moreRef} className="relative flex-shrink-0">
                                    <button
                                        onClick={() => setIsMoreOpen(v => !v)}
                                        className={[
                                            'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold',
                                            'transition-colors duration-150',
                                            isMoreOpen
                                                ? 'text-primary-600 bg-primary-50'
                                                : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100',
                                        ].join(' ')}
                                    >
                                        Altro
                                        <ChevronDown
                                            className={`w-3.5 h-3.5 transition-transform ${isMoreOpen ? 'rotate-180' : ''}`}
                                        />
                                    </button>

                                    {isMoreOpen && (
                                        <div className="absolute top-full left-0 mt-1.5 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                                            {ADMIN_MORE_LINKS.map(link => (
                                                <NavLink
                                                    key={link.href}
                                                    to={`/${localname}/Dashboard/${link.href}`}
                                                    onClick={() => setIsMoreOpen(false)}
                                                    className={({ isActive }) =>
                                                        `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                                                            isActive
                                                                ? 'text-primary-600 bg-primary-50'
                                                                : 'text-gray-600 hover:bg-gray-50'
                                                        }`
                                                    }
                                                    end
                                                >
                                                    <link.icon className="w-4 h-4 flex-shrink-0 text-gray-400" />
                                                    {link.name}
                                                </NavLink>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </nav>

                        {/* ── Right actions ── */}
                        <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                            {/* Nuovo Ordine */}
                            <button
                                onClick={() => navigate(`/Waiters/${localname}/Categories`)}
                                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 active:scale-95 transition-all"
                            >
                                <Plus className="w-4 h-4" />
                                <span className="hidden lg:inline">Nuovo Ordine</span>
                            </button>

                            {/* Bell */}
                            <button className="w-9 h-9 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                                <Bell className="w-5 h-5" />
                            </button>

                            {/* Profile */}
                            <div ref={profileRef} className="relative">
                                <button
                                    onClick={() => setIsProfileOpen(v => !v)}
                                    className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                                >
                                    <UserCircle className="w-7 h-7 text-gray-400" />
                                </button>

                                {isProfileOpen && (
                                    <div className="absolute right-0 mt-1.5 w-52 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm font-semibold text-gray-800 truncate">{user?.name}</p>
                                            <p className="text-xs text-gray-400 truncate mt-0.5">{user?.email}</p>
                                        </div>
                                        <NavLink
                                            to={`/${localname}/Dashboard/Profile`}
                                            onClick={() => setIsProfileOpen(false)}
                                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                                        >
                                            <Settings className="w-4 h-4 text-gray-400" />
                                            Il Mio Profilo
                                        </NavLink>
                                        <button
                                            onClick={() => { logout(); navigate('/login'); }}
                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Hamburger (mobile only) */}
                            <button
                                className="md:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                                onClick={() => setIsMobileOpen(true)}
                            >
                                <Menu className="w-5 h-5 text-gray-600" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Mobile drawer ── */}
            {isMobileOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/40 z-50"
                    onClick={() => setIsMobileOpen(false)}
                >
                    <div
                        className="fixed top-0 left-0 h-full w-72 bg-white shadow-xl flex flex-col"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Drawer header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <span className="text-base font-extrabold text-primary-600">{user?.localname}</span>
                            <button
                                onClick={() => setIsMobileOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                            >
                                <X className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>

                        {/* User info */}
                        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                            <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                        </div>

                        {/* Nav links */}
                        <nav className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-1">
                            {visiblePrimary.map(link => (
                                <NavLink
                                    key={link.href}
                                    to={`/${localname}/Dashboard/${link.href}`}
                                    onClick={() => setIsMobileOpen(false)}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                                            isActive
                                                ? 'bg-primary-50 text-primary-600'
                                                : 'text-gray-600 hover:bg-gray-100'
                                        }`
                                    }
                                    end
                                >
                                    <link.icon className="w-5 h-5 flex-shrink-0" />
                                    {link.name}
                                </NavLink>
                            ))}

                            {isAdmin && (
                                <>
                                    <div className="mt-2 mb-1 px-4">
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
                                            Gestione
                                        </span>
                                    </div>
                                    {ADMIN_MORE_LINKS.map(link => (
                                        <NavLink
                                            key={link.href}
                                            to={`/${localname}/Dashboard/${link.href}`}
                                            onClick={() => setIsMobileOpen(false)}
                                            className={({ isActive }) =>
                                                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                                                    isActive
                                                        ? 'bg-primary-50 text-primary-600'
                                                        : 'text-gray-600 hover:bg-gray-100'
                                                }`
                                            }
                                            end
                                        >
                                            <link.icon className="w-5 h-5 flex-shrink-0" />
                                            {link.name}
                                        </NavLink>
                                    ))}
                                </>
                            )}
                        </nav>

                        {/* Bottom actions */}
                        <div className="px-3 py-3 border-t border-gray-100 flex flex-col gap-1">
                            <button
                                onClick={() => { navigate(`/Waiters/${localname}/Categories`); setIsMobileOpen(false); }}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-primary-500 hover:bg-primary-600 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                                Nuovo Ordine
                            </button>
                            <NavLink
                                to={`/${localname}/Dashboard/Profile`}
                                onClick={() => setIsMobileOpen(false)}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                <Settings className="w-5 h-5" />
                                Il Mio Profilo
                            </NavLink>
                            <button
                                onClick={() => { logout(); navigate('/login'); }}
                                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut className="w-5 h-5" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Header;
