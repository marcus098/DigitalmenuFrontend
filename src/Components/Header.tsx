import React, {useState} from 'react';
import {NavLink, useNavigate, useParams} from "react-router-dom";
import {useHistory} from "../Context/HistoryContext";
import {FaEdit, FaUser} from "react-icons/fa";
import {FiLogOut} from "react-icons/fi";
import {useLoginContext} from "../Context/LoginContext";
import { Bars3Icon, BellIcon, XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
import { UserCircleIcon, ArrowLeftOnRectangleIcon, Cog6ToothIcon } from '@heroicons/react/24/solid';
import {IS_ADMIN, IS_WAITER} from "../types";

const Header: React.FC = () => {
    const { user, logout, checkVariable } = useLoginContext();
    const { localname } = useParams();
    const navigate = useNavigate();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

    const navigationLinks = [
        { name: 'Dashboard', href: `/${localname}/Dashboard/Home`, waiter: true },
        { name: 'Gestione Menu', href: `/${localname}/Dashboard/Menu`, waiter: true },
        { name: 'Gestione Sala', href: `/${localname}/Dashboard/Tables`, waiter: true },
        { name: 'Ordini', href: `/${localname}/Dashboard/Orders`, waiter: true },
        { name: 'Camerieri', href: `/${localname}/Dashboard/Waiters`, waiter: false },
    ];

    // Stile per i link di navigazione attivi e non attivi
    const navLinkClass = ({ isActive }: { isActive: boolean }) =>
        `px-3 py-2 rounded-md text-sm font-semibold transition-colors ${
            isActive ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'
        }`;

    const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
        `block px-4 py-3 rounded-md text-base font-semibold transition-colors ${
            isActive ? 'bg-primary text-white' : 'text-gray-700 hover:bg-gray-100'
        }`;

    const handleLogout = () => {
        logout();
        navigate('/login');
    }

    return (
        <header className="bg-white shadow-sm sticky top-0 z-40">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Sezione Sinistra: Logo e Navigazione Desktop */}
                    <div className="flex items-center gap-8">
                        {/* Logo */}
                        <NavLink to={`/${localname}/Dashboard/Home`} className="flex-shrink-0">
                            <h1 className="text-xl font-bold text-primary">{user?.localname}</h1>
                        </NavLink>

                        {/* Navigazione Desktop (nascosta su mobile) */}
                        <nav className="hidden md:flex items-center gap-2">
                            {(checkVariable(IS_ADMIN) ? ([...navigationLinks]) : ([...navigationLinks.filter(n => n.waiter && checkVariable(IS_WAITER))])).map(link => (
                                <NavLink key={link.name} to={link.href} className={navLinkClass} end>
                                    {link.name}
                                </NavLink>
                            ))}
                        </nav>
                    </div>

                    {/* Sezione Destra: Azioni e Profilo */}
                    <div className="flex items-center gap-4">
                        <button className="btn-primary hidden sm:flex items-center" onClick={(e) => navigate(`/Waiters/${localname}/Categories`)}>
                            <PlusIcon className="w-5 h-5 mr-2"/>
                            <span>Nuovo Ordine</span>
                        </button>
                        <button className="p-2 text-gray-500 hover:text-primary hover:bg-gray-100 rounded-full transition-colors">
                            <BellIcon className="w-6 h-6"/>
                        </button>

                        {/* Menu Profilo Utente */}
                        <div className="relative">
                            <button onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}>
                                <UserCircleIcon className="w-9 h-9 text-gray-400 hover:text-primary transition-colors"/>
                            </button>
                            {isProfileMenuOpen && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 py-1 z-50">
                                    <div className="px-4 py-2 border-b">
                                        <p className="text-sm font-semibold text-gray-800">{user?.name}</p>
                                        <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                                    </div>
                                    <NavLink to={`/${localname}/Dashboard/Profile`} className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                                        <Cog6ToothIcon className="w-5 h-5 mr-3"/> Il Mio Profilo
                                    </NavLink>
                                    <button onClick={handleLogout} className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                                        <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-3"/> Logout
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Hamburger Menu (visibile solo su mobile) */}
                        <div className="md:hidden">
                            <button onClick={() => setIsMobileMenuOpen(true)}>
                                <Bars3Icon className="w-7 h-7 text-gray-600"/>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Pannello Menu Mobile */}
            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 bg-black/40 z-50" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="fixed top-0 left-0 h-full w-4/5 max-w-sm bg-white shadow-xl p-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-primary">Menu</h2>
                            <button onClick={() => setIsMobileMenuOpen(false)}><XMarkIcon className="w-7 h-7"/></button>
                        </div>
                        <nav className="flex flex-col gap-2">
                            {(checkVariable(IS_ADMIN) ? ([...navigationLinks]) : ([...navigationLinks.filter(n => n.waiter && checkVariable(IS_WAITER))])).map(link => (
                                <NavLink key={link.name} to={link.href} className={mobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)} end>
                                    {link.name}
                                </NavLink>
                            ))}
                        </nav>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
