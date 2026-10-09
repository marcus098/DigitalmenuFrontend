import React from 'react';
import { Navigate, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Building2, ScrollText, LogOut, ShieldCheck } from 'lucide-react';
import { useLoginContext } from '../Context/LoginContext';
import CustomLoading from '../Components/CustomLoading';
import NotificationDisplay from '../Components/NotificationDisplay';

const NAV = [
    { name: 'Ristoranti', icon: Building2, to: '/superadmin' },
    { name: 'Audit', icon: ScrollText, to: '/superadmin/audit' },
];

/** Layout + guardia della console superadmin. */
const SuperadminLayout: React.FC = () => {
    const { loading, user, isSuperadmin, impersonation, logout } = useLoginContext();
    const { pathname } = useLocation();
    const onAudit = pathname.toLowerCase().startsWith('/superadmin/audit');

    if (loading) return <CustomLoading isFullPage message="" />;
    // Non loggato: LoginContext reindirizza già al login
    if (!user) return <CustomLoading isFullPage message="" />;
    // Durante una sessione di supporto o per utenti non superadmin la console non è accessibile
    if (impersonation || !isSuperadmin) {
        return <Navigate to={user.localname ? `/${user.localname}/Dashboard/Home` : '/login'} replace />;
    }

    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        [
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap',
            isActive ? 'text-primary-600 bg-primary-50' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100',
        ].join(' ');

    return (
        <div className="flex flex-col min-h-screen">
            <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
                <div className="max-w-[1400px] mx-auto px-4">
                    <div className="flex items-center h-14 gap-3">
                        <NavLink to="/superadmin" className="flex-shrink-0 flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-primary-600" />
                            <span className="hidden sm:inline text-base font-extrabold text-primary-600 tracking-tight leading-none">
                                Console piattaforma
                            </span>
                        </NavLink>
                        <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
                        <nav className="flex items-center gap-1 min-w-0">
                            {NAV.map(link => (
                                <NavLink
                                    key={link.to}
                                    to={link.to}
                                    // "Ristoranti" resta attivo anche nel dettaglio del locale
                                    className={navLinkClass({ isActive: link.to === '/superadmin/audit' ? onAudit : !onAudit })}
                                >
                                    <link.icon className="w-4 h-4 flex-shrink-0" />
                                    <span>{link.name}</span>
                                </NavLink>
                            ))}
                        </nav>
                        <div className="flex items-center gap-3 ml-auto flex-shrink-0">
                            <span className="hidden md:block text-xs text-gray-400 truncate max-w-[220px]" title={user.email}>
                                {user.email}
                            </span>
                            <button
                                type="button"
                                onClick={logout}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 bg-slate-100">
                <Outlet />
            </main>

            <NotificationDisplay />
        </div>
    );
};

export default SuperadminLayout;
