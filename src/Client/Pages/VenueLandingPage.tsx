import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useData } from '../../Context/DataContext';
import { resolveImageUrl } from '../../Utilities/Utilities';
import CustomLoading from '../../Components/CustomLoading';
import { createReservationPublicApi } from '../../Utilities/api';
import { CategoryDto, FeatureCard } from '../../types';
import {
    MapPin, Clock, MessageCircle, Phone, ChefHat, Leaf, Zap, Smartphone,
    CheckCircle2, ArrowRight, Loader2, UtensilsCrossed, CalendarDays, ShoppingBag,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const hexToRgb = (hex: string): string => {
    const r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return r ? `${parseInt(r[1], 16)}, ${parseInt(r[2], 16)}, ${parseInt(r[3], 16)}` : '251, 146, 60';
};

const FEATURE_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    'chef-hat': ChefHat,
    'leaf': Leaf,
    'zap': Zap,
    'smartphone': Smartphone,
};

const FeatureIcon: React.FC<{ icon: string; className?: string }> = ({ icon, className }) => {
    const Cmp = FEATURE_ICON_MAP[icon];
    if (Cmp) return <Cmp className={className} />;
    return <span className={className}>{icon}</span>;
};

const DEFAULT_FEATURES: FeatureCard[] = [
    { icon: 'leaf',       title: 'Ingredienti Freschi', sub: 'Selezionati ogni giorno' },
    { icon: 'chef-hat',   title: 'Ricette Originali',   sub: 'Chef di esperienza' },
    { icon: 'zap',        title: 'Servizio Rapido',     sub: 'Pronto in pochi minuti' },
    { icon: 'smartphone', title: 'Ordina dal Tavolo',   sub: 'Scansiona il QR' },
];

// ─── Shared sub-components ────────────────────────────────────────────────────

interface BookingFormProps { primary: string; primaryRgb: string; localname: string; dark?: boolean; }

const BookingForm: React.FC<BookingFormProps> = ({ primary, primaryRgb, localname, dark }) => {
    const [form, setForm] = useState({ name: '', phone: '', email: '', date: '', time: '', guests: '', notes: '' });
    const [done, setDone] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
        setForm(prev => ({ ...prev, [k]: e.target.value }));

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setBusy(true);
        const res = await createReservationPublicApi(localname, {
            customerName: form.name,
            customerPhone: form.phone,
            customerEmail: form.email || undefined,
            partySize: parseInt(form.guests, 10),
            reservationDate: form.date,
            reservationTime: form.time + ':00',
            specialRequests: form.notes || undefined,
        });
        setBusy(false);
        if (res.success) setDone(true);
        else setError(res.message || 'Errore nell\'invio. Riprova.');
    };

    const base = dark
        ? 'w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder-gray-500 outline-none focus:border-white/30 focus:ring-2 focus:ring-white/10 transition-all'
        : 'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400 focus:ring-2 focus:ring-gray-200 transition-all';

    if (done) return (
        <div className="text-center py-14">
            <CheckCircle2 className="w-14 h-14 mx-auto mb-4" style={{ color: primary }} strokeWidth={1.5} />
            <h3 className={`text-2xl font-black ${dark ? 'text-white' : 'text-gray-900'}`}>Richiesta inviata</h3>
            <p className={dark ? 'text-gray-400 mt-2' : 'text-gray-500 mt-2'}>Ti contatteremo presto per confermare la prenotazione.</p>
            <button onClick={() => setDone(false)} className="mt-6 px-8 py-3 text-white font-bold rounded-xl hover:scale-105 transition-transform" style={{ backgroundColor: primary }}>
                Nuova Prenotazione
            </button>
        </div>
    );

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className={`text-xs font-bold uppercase tracking-wider block mb-1.5 ${dark ? 'text-gray-400' : 'text-gray-400'}`}>Nome e Cognome *</label>
                    <input required type="text" value={form.name} onChange={set('name')} className={base} placeholder="Mario Rossi" />
                </div>
                <div>
                    <label className={`text-xs font-bold uppercase tracking-wider block mb-1.5 ${dark ? 'text-gray-400' : 'text-gray-400'}`}>Telefono *</label>
                    <input required type="tel" value={form.phone} onChange={set('phone')} className={base} placeholder="+39 000 000 0000" />
                </div>
            </div>
            <div>
                <label className={`text-xs font-bold uppercase tracking-wider block mb-1.5 ${dark ? 'text-gray-400' : 'text-gray-400'}`}>Email (opzionale)</label>
                <input type="email" value={form.email} onChange={set('email')} className={base} placeholder="mario@email.com" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className={`text-xs font-bold uppercase tracking-wider block mb-1.5 ${dark ? 'text-gray-400' : 'text-gray-400'}`}>Data *</label>
                    <input required type="date" value={form.date} onChange={set('date')} min={new Date().toISOString().split('T')[0]} className={base} />
                </div>
                <div>
                    <label className={`text-xs font-bold uppercase tracking-wider block mb-1.5 ${dark ? 'text-gray-400' : 'text-gray-400'}`}>Orario *</label>
                    <select required value={form.time} onChange={set('time')} className={base + ' appearance-none'}>
                        <option value="">Seleziona orario</option>
                        {['12:00','12:30','13:00','13:30','14:00','19:00','19:30','20:00','20:30','21:00','21:30','22:00'].map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div>
                <label className={`text-xs font-bold uppercase tracking-wider block mb-1.5 ${dark ? 'text-gray-400' : 'text-gray-400'}`}>Numero Persone *</label>
                <input required type="number" min="1" max="20" value={form.guests} onChange={set('guests')} className={base} placeholder="2" />
            </div>
            <div>
                <label className={`text-xs font-bold uppercase tracking-wider block mb-1.5 ${dark ? 'text-gray-400' : 'text-gray-400'}`}>Note (opzionale)</label>
                <textarea value={form.notes} onChange={set('notes')} rows={3} className={base + ' resize-none'} placeholder="Allergie, richieste speciali…" />
            </div>
            {error && <p className="text-red-400 text-sm text-center bg-red-950/40 rounded-xl py-2 px-4">{error}</p>}
            <button type="submit" disabled={busy} className="w-full py-4 text-white font-bold uppercase tracking-widest rounded-xl transition-all hover:scale-[1.01] disabled:opacity-60 mt-2 inline-flex items-center justify-center gap-2" style={{ backgroundColor: primary, boxShadow: `0 4px 20px rgba(${primaryRgb}, 0.35)` }}>
                {busy ? (<><Loader2 className="w-4 h-4 animate-spin" /> Invio in corso…</>) : (<>Conferma Prenotazione <ArrowRight className="w-4 h-4" /></>)}
            </button>
        </form>
    );
};

interface InfoRowProps { primary: string; icon: React.ReactNode; label: string; value: React.ReactNode; dark?: boolean; }

const InfoRow: React.FC<InfoRowProps> = ({ primary, icon, label, value, dark }) => (
    <div className="flex items-start gap-4 group">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border" style={{ color: primary, borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', backgroundColor: dark ? 'rgba(255,255,255,0.04)' : `rgba(${primary},0.06)` }}>
            {icon}
        </div>
        <div>
            <h4 className={`font-bold uppercase tracking-wide text-xs mb-0.5 ${dark ? 'text-white' : 'text-gray-800'}`}>{label}</h4>
            <div className={`text-sm ${dark ? 'text-gray-400' : 'text-gray-500'}`}>{value}</div>
        </div>
    </div>
);

interface SocialBtnProps { href: string; primary: string; label: string; children: React.ReactNode; dark?: boolean; }

const SocialBtn: React.FC<SocialBtnProps> = ({ href, primary, label, children, dark }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
        className={`w-11 h-11 rounded-full border flex items-center justify-center text-gray-400 hover:text-white hover:scale-110 transition-all duration-300 ${dark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`}
        onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = primary; el.style.borderColor = primary; }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.backgroundColor = ''; el.style.borderColor = ''; }}
    >
        {children}
    </a>
);

const IgIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>;
const FbIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
const TkIcon = () => <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.2 8.2 0 004.79 1.53V6.77a4.85 4.85 0 01-1.02-.08z"/></svg>;

// ─── Shared template props ────────────────────────────────────────────────────

interface TemplateProps {
    primary: string;
    primaryRgb: string;
    name: string;
    heroImg: string;
    logoImg: string;
    description: string;
    hours: string;
    whatsapp: string;
    tiktokUrl: string;
    categories: CategoryDto[];
    features: FeatureCard[];
    sectionMenuTitle: string;
    sectionBookingTitle: string;
    sectionWhyTitle: string;
    showWhyUs: boolean;
    showBooking: boolean;
    showTicker: boolean;
    localname: string;
    address: string;
    phone: string;
    instagramUrl: string;
    facebookUrl: string;
    goToMenu: () => void;
    goToTakeaway: () => void;
    scrollTo: (id: string) => void;
    navigate: (path: string) => void;
}

// ─── Template: DEFAULT ────────────────────────────────────────────────────────

const DefaultTemplate: React.FC<TemplateProps> = ({
    primary, primaryRgb, name, heroImg, logoImg, description, hours, whatsapp, tiktokUrl,
    categories, features, sectionMenuTitle, sectionBookingTitle, sectionWhyTitle,
    showWhyUs, showBooking, showTicker, localname, address, phone, instagramUrl, facebookUrl,
    goToMenu, goToTakeaway, scrollTo, navigate,
}) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handler);
        return () => window.removeEventListener('scroll', handler);
    }, []);

    const tickerItems = categories.length > 0
        ? [...categories, ...categories].map(c => c.name)
        : ['Antipasti','Primi','Secondi','Dolci','Bevande','Antipasti','Primi','Secondi','Dolci','Bevande'];

    return (
        <div className="min-h-screen overflow-x-hidden bg-white font-sans">
            <style>{`
                @keyframes marqueeScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
                .marquee-run { animation: marqueeScroll 22s linear infinite; }
                @keyframes fadeUpIn { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
                .fade-up { animation: fadeUpIn 0.65s ease-out forwards; }
                .fade-up-1 { animation-delay: 0.15s; opacity: 0; }
                .fade-up-2 { animation-delay: 0.3s;  opacity: 0; }
                .fade-up-3 { animation-delay: 0.45s; opacity: 0; }
                .fade-up-4 { animation-delay: 0.6s;  opacity: 0; }
            `}</style>

            {/* Navbar */}
            <nav className={`fixed w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100' : 'bg-transparent'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-[70px]">
                        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3 group">
                            {logoImg ? (
                                <img src={logoImg} alt={name} className="w-10 h-10 rounded-full object-cover shadow-md border-2 group-hover:scale-110 transition-transform" style={{ borderColor: primary }} />
                            ) : (
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-black shadow-md group-hover:scale-110 transition-transform" style={{ backgroundColor: primary }}>
                                    {name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span className={`text-xl font-black tracking-tight transition-colors ${scrolled ? 'text-gray-900' : 'text-white'}`}>{name}</span>
                        </button>
                        <div className="hidden md:flex items-center gap-6">
                            {[['Menu','categories'],['Info','info'],showBooking && ['Prenota','prenota']].filter(Boolean).map((item: any) => (
                                <button key={item[1]} onClick={() => scrollTo(item[1])} className={`text-sm font-semibold uppercase tracking-wider hover:opacity-70 ${scrolled ? 'text-gray-600' : 'text-white/80'}`}>{item[0]}</button>
                            ))}
                            <button onClick={goToMenu} className="text-white text-sm font-bold uppercase tracking-wider px-5 py-2.5 rounded-full hover:scale-105 transition-all" style={{ backgroundColor: primary, boxShadow: `0 4px 15px rgba(${primaryRgb},0.35)` }}>Ordina Ora</button>
                        </div>
                        <button onClick={() => setMobileOpen(v => !v)} className={`md:hidden ${scrolled ? 'text-gray-800' : 'text-white'}`}>
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {mobileOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                            </svg>
                        </button>
                    </div>
                </div>
                {mobileOpen && (
                    <div className="md:hidden bg-white border-t px-4 py-4 space-y-1 shadow-lg">
                        {[['Menu','categories'],['Info','info'],showBooking && ['Prenota','prenota']].filter(Boolean).map((item: any) => (
                            <button key={item[1]} onClick={() => { scrollTo(item[1]); setMobileOpen(false); }} className="w-full text-left py-3 text-sm font-bold uppercase text-gray-700 border-b border-gray-50 last:border-0">{item[0]}</button>
                        ))}
                        <button onClick={goToMenu} className="w-full mt-2 py-3 text-white text-sm font-bold uppercase rounded-xl" style={{ backgroundColor: primary }}>Sfoglia il Menu</button>
                        <button onClick={goToTakeaway} className="w-full py-3 text-sm font-bold uppercase rounded-xl border-2" style={{ borderColor: primary, color: primary }}>Ordina Asporto</button>
                    </div>
                )}
            </nav>

            {/* Hero */}
            <section className="relative min-h-[95vh] flex items-center justify-center overflow-hidden bg-gray-900">
                {heroImg && (
                    <div className="absolute inset-0">
                        <img src={heroImg} alt={name} className="w-full h-full object-cover opacity-50" />
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-900/60 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                    </div>
                )}
                <div className="absolute inset-0 pointer-events-none" style={{ background: `radial-gradient(ellipse at 50% 35%, rgba(${primaryRgb},0.12) 0%, transparent 60%)` }} />
                <div className="relative z-10 text-center px-4 max-w-5xl mx-auto pt-20 pb-8">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-[0.2em] uppercase mb-8 border fade-up fade-up-1" style={{ backgroundColor: `rgba(${primaryRgb},0.1)`, borderColor: `rgba(${primaryRgb},0.3)`, color: primary }}>
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: primary }} />
                        {categories.length > 0 ? categories.slice(0,4).map(c => c.name).join(' · ') : 'Benvenuto'}
                    </div>
                    <h1 className="text-6xl md:text-[8rem] lg:text-[10rem] font-black text-white leading-none mb-4 fade-up fade-up-2" style={{ textShadow: `3px 3px 0 rgba(${primaryRgb},0.25), 0 0 80px rgba(${primaryRgb},0.1)` }}>{name}</h1>
                    {description && <p className="text-xl md:text-2xl text-gray-300 mb-3 font-light uppercase tracking-[0.12em] fade-up fade-up-3">{description}</p>}
                    {(address || hours) && (
                        <p className="text-gray-500 text-sm mb-10 tracking-widest fade-up fade-up-3 inline-flex items-center justify-center gap-2 flex-wrap">
                            {address && <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {address}</span>}
                            {address && hours && <span className="opacity-40">·</span>}
                            {hours && <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {hours}</span>}
                        </p>
                    )}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center flex-wrap fade-up fade-up-4">
                        <button onClick={goToMenu} className="text-white px-10 py-4 rounded-full font-bold text-lg uppercase tracking-wider hover:scale-105 hover:brightness-110 transition-all duration-300 inline-flex items-center justify-center gap-2" style={{ backgroundColor: primary, boxShadow: `0 0 30px rgba(${primaryRgb},0.4)` }}><UtensilsCrossed className="w-5 h-5" /> Sfoglia il Menu</button>
                        {showBooking && <button onClick={() => scrollTo('prenota')} className="bg-transparent border-2 border-white/40 text-white px-10 py-4 rounded-full font-bold text-lg uppercase tracking-wider hover:bg-white hover:text-gray-900 hover:border-white transition-all duration-300 inline-flex items-center justify-center gap-2"><CalendarDays className="w-5 h-5" /> Prenota Tavolo</button>}
                        <button onClick={goToTakeaway} className="bg-transparent border-2 border-white/40 text-white px-10 py-4 rounded-full font-bold text-lg uppercase tracking-wider hover:bg-white hover:text-gray-900 hover:border-white transition-all duration-300 inline-flex items-center justify-center gap-2"><ShoppingBag className="w-5 h-5" /> Ordina Asporto</button>
                    </div>
                </div>
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center opacity-50">
                    <div className="w-5 h-8 rounded-full border-2 border-white/30 flex items-start justify-center p-1"><div className="w-1 h-2 rounded-full bg-white/60 animate-bounce" /></div>
                </div>
            </section>

            {/* Ticker */}
            {showTicker && (
                <div className="overflow-hidden py-3" style={{ backgroundColor: primary }}>
                    <div className="whitespace-nowrap marquee-run inline-flex gap-8">
                        {tickerItems.map((item, i) => (
                            <span key={i} className="text-white font-bold text-xs uppercase tracking-[0.2em] inline-flex items-center gap-3">
                                <span className="opacity-60">·</span> {item}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Why Us */}
            {showWhyUs && (
                <section className="py-16 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {sectionWhyTitle && <h2 className="text-center text-2xl font-black text-gray-900 uppercase mb-10">{sectionWhyTitle}</h2>}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                            {features.map((f, i) => (
                                <div key={i} className="p-6 rounded-2xl group hover:bg-gray-50 transition-colors cursor-default">
                                    <div className="mb-3 inline-flex items-center justify-center w-12 h-12 rounded-xl group-hover:scale-110 transition-transform" style={{ color: primary, backgroundColor: `rgba(${primaryRgb},0.08)` }}>
                                        <FeatureIcon icon={f.icon} className="w-6 h-6" />
                                    </div>
                                    <div className="font-bold text-sm text-gray-900 uppercase tracking-wide">{f.title}</div>
                                    <div className="text-gray-400 text-xs mt-1">{f.sub}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Categories */}
            {categories.length > 0 && (
                <section id="categories" className="py-20 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-14">
                            <p className="text-xl font-light mb-2" style={{ color: primary }}>Cosa vuoi mangiare?</p>
                            <h2 className="text-4xl md:text-6xl font-black text-gray-900 uppercase">
                                {sectionMenuTitle || 'Il Nostro'} <span style={{ color: primary }}>{sectionMenuTitle ? '' : 'Menu'}</span>
                            </h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                            {categories.map(cat => {
                                const img = cat.image ? `${process.env.REACT_APP_BUCKET_URL}${cat.image}` : '';
                                return (
                                    <button key={cat.id} onClick={() => navigate(`/${localname}/Products/${cat.id}`)} className="relative rounded-2xl overflow-hidden group h-44 md:h-56 text-left">
                                        {img ? <img src={img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <div className="w-full h-full" style={{ backgroundColor: `rgba(${primaryRgb},0.15)` }} />}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                        <div className="absolute bottom-0 left-0 p-4"><h3 className="text-white text-lg md:text-xl font-black">{cat.name}</h3>{cat.description && <p className="text-gray-300 text-xs mt-0.5 line-clamp-1">{cat.description}</p>}</div>
                                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                            <span className="px-3 py-1 text-white text-xs font-bold rounded-full" style={{ backgroundColor: primary }}>Sfoglia →</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                        <div className="text-center mt-10">
                            <button onClick={goToMenu} className="px-10 py-4 text-white font-bold uppercase tracking-wider rounded-full hover:scale-105 transition-all" style={{ backgroundColor: primary, boxShadow: `0 8px 25px rgba(${primaryRgb},0.3)` }}>Ordina Ora →</button>
                        </div>
                    </div>
                </section>
            )}

            {/* Info */}
            <section id="info" className="py-20 bg-gray-900 text-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                        <div>
                            <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: primary }}>Vieni a trovarci</p>
                            <h2 className="text-4xl md:text-5xl font-black uppercase mb-10 text-white">Info & <span style={{ color: primary }}>Contatti</span></h2>
                            <div className="space-y-6">
                                {address && <InfoRow dark primary={primary} icon={<MapPin className="w-5 h-5" />} label="Dove siamo" value={address} />}
                                {hours   && <InfoRow dark primary={primary} icon={<Clock className="w-5 h-5" />} label="Orari" value={hours} />}
                                {phone   && <InfoRow dark primary={primary} icon={<Phone className="w-5 h-5" />} label="Telefono" value={<a href={`tel:${phone}`} className="hover:text-white transition-colors">{phone}</a>} />}
                                {whatsapp && <InfoRow dark primary={primary} icon={<MessageCircle className="w-5 h-5" />} label="WhatsApp" value={<a href={`https://wa.me/${whatsapp.replace(/[^0-9+]/g,'')}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{whatsapp}</a>} />}
                            </div>
                        </div>
                        <div className="flex flex-col gap-6 lg:pt-20">
                            {(instagramUrl || facebookUrl || tiktokUrl) && (
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Seguici</p>
                                    <div className="flex gap-3">
                                        {instagramUrl?.length > 5 && <SocialBtn dark href={instagramUrl} primary={primary} label="Instagram"><IgIcon /></SocialBtn>}
                                        {facebookUrl?.length > 5 && <SocialBtn dark href={facebookUrl} primary={primary} label="Facebook"><FbIcon /></SocialBtn>}
                                        {tiktokUrl?.length > 5 && <SocialBtn dark href={tiktokUrl} primary={primary} label="TikTok"><TkIcon /></SocialBtn>}
                                    </div>
                                </div>
                            )}
                            <button onClick={goToMenu} className="self-start px-8 py-4 text-white font-bold uppercase tracking-wider rounded-full hover:scale-105 transition-all" style={{ backgroundColor: primary, boxShadow: `0 8px 25px rgba(${primaryRgb},0.25)` }}>Sfoglia il Menu →</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Booking */}
            {showBooking && (
                <section id="prenota" className="py-24 bg-white">
                    <div className="max-w-2xl mx-auto px-4">
                        <div className="text-center mb-10">
                            <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: primary }}>Riserva il tuo posto</p>
                            <h2 className="text-4xl font-black uppercase text-gray-900">{sectionBookingTitle || 'Prenota il tuo'} <span style={{ color: primary }}>{sectionBookingTitle ? '' : 'Tavolo'}</span></h2>
                            <p className="text-gray-400 mt-2 text-sm">Compila il modulo e ti ricontatteremo per confermare.</p>
                        </div>
                        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                            <div className="h-1.5" style={{ background: `linear-gradient(to right, ${primary}, ${primary}99, ${primary})` }} />
                            <div className="p-8 md:p-10"><BookingForm primary={primary} primaryRgb={primaryRgb} localname={localname} /></div>
                        </div>
                    </div>
                </section>
            )}

            {/* Footer */}
            <footer className="bg-[#080808] text-white py-14 border-t border-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-10 mb-10">
                        <div>
                            <span className="font-black text-4xl block mb-3" style={{ color: primary }}>{name}</span>
                            {description && <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{description}</p>}
                        </div>
                        <div>
                            <h4 className="font-bold uppercase text-xs tracking-widest text-gray-500 mb-4">Naviga</h4>
                            <ul className="space-y-2">
                                {[['Home', () => window.scrollTo({ top: 0, behavior: 'smooth' })], ['Menu', () => scrollTo('categories')], showBooking && ['Prenota', () => scrollTo('prenota')], ['Info', () => scrollTo('info')]].filter(Boolean).map((item: any) => (
                                    <li key={item[0]}><button onClick={item[1]} className="text-gray-500 hover:text-white transition-colors text-sm">{item[0]}</button></li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold uppercase text-xs tracking-widest text-gray-500 mb-4">Contatti</h4>
                            {address && <p className="text-gray-500 text-xs mt-1 inline-flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {address}</p>}
                            {phone   && <p className="text-gray-500 text-xs mt-1 inline-flex items-center gap-2"><Phone className="w-3.5 h-3.5" /> {phone}</p>}
                            {whatsapp && <p className="text-gray-500 text-xs mt-1 inline-flex items-center gap-2"><MessageCircle className="w-3.5 h-3.5" /> {whatsapp}</p>}
                        </div>
                    </div>
                    <div className="border-t border-gray-900 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-gray-600">
                        <p>© {new Date().getFullYear()} {name} — Tutti i diritti riservati.</p>
                        <p>Powered by <span style={{ color: primary }}>AxiomGroup</span></p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

// ─── Template: MINIMAL ────────────────────────────────────────────────────────

const MinimalTemplate: React.FC<TemplateProps> = ({
    primary, primaryRgb, name, heroImg, logoImg, description, hours, whatsapp, tiktokUrl,
    categories, features, sectionMenuTitle, sectionBookingTitle, sectionWhyTitle,
    showWhyUs, showBooking, showTicker, localname, address, phone, instagramUrl, facebookUrl,
    goToMenu, goToTakeaway, scrollTo, navigate,
}) => {
    const [mobileOpen, setMobileOpen] = useState(false);

    const tickerItems = categories.length > 0
        ? [...categories, ...categories].map(c => c.name)
        : ['Antipasti','Primi','Secondi','Dolci','Bevande','Antipasti','Primi','Secondi','Dolci','Bevande'];

    return (
        <div className="min-h-screen overflow-x-hidden bg-white font-sans">
            <style>{`
                @keyframes marqueeScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }
                .marquee-run { animation: marqueeScroll 22s linear infinite; }
            `}</style>

            {/* Navbar — always white */}
            <nav className="fixed w-full z-50 bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-[64px]">
                        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3 group">
                            {logoImg ? (
                                <img src={logoImg} alt={name} className="w-9 h-9 rounded-full object-cover border-2" style={{ borderColor: primary }} />
                            ) : (
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-black" style={{ backgroundColor: primary }}>
                                    {name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span className="text-lg font-black tracking-tight text-gray-900">{name}</span>
                        </button>
                        <div className="hidden md:flex items-center gap-5">
                            {[['Menu','categories'],['Info','info'],showBooking && ['Prenota','prenota']].filter(Boolean).map((item: any) => (
                                <button key={item[1]} onClick={() => scrollTo(item[1])} className="text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">{item[0]}</button>
                            ))}
                            <button onClick={goToMenu} className="text-white text-sm font-bold px-5 py-2 rounded-full hover:scale-105 transition-all" style={{ backgroundColor: primary }}>Ordina Ora</button>
                        </div>
                        <button onClick={() => setMobileOpen(v => !v)} className="md:hidden text-gray-700">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {mobileOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                            </svg>
                        </button>
                    </div>
                </div>
                {mobileOpen && (
                    <div className="md:hidden bg-white border-t px-4 py-3 space-y-1">
                        {[['Menu','categories'],['Info','info'],showBooking && ['Prenota','prenota']].filter(Boolean).map((item: any) => (
                            <button key={item[1]} onClick={() => { scrollTo(item[1]); setMobileOpen(false); }} className="w-full text-left py-2.5 text-sm font-semibold text-gray-700 border-b border-gray-50">{item[0]}</button>
                        ))}
                        <button onClick={goToMenu} className="w-full mt-1 py-2.5 text-white text-sm font-bold rounded-xl" style={{ backgroundColor: primary }}>Sfoglia il Menu</button>
                    </div>
                )}
            </nav>

            {/* Hero — compact, light */}
            <section className="relative pt-[64px] min-h-[62vh] flex items-center overflow-hidden bg-gray-50">
                {heroImg && <img src={heroImg} alt={name} className="absolute inset-0 w-full h-full object-cover opacity-15" />}
                <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 60% 50%, rgba(${primaryRgb},0.08) 0%, transparent 70%)` }} />
                <div className="relative z-10 w-full text-center px-4 py-16">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6 border" style={{ backgroundColor: `rgba(${primaryRgb},0.08)`, borderColor: `rgba(${primaryRgb},0.2)`, color: primary }}>
                        {categories.length > 0 ? categories.slice(0,3).map(c => c.name).join(' · ') : 'Benvenuto'}
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black text-gray-900 leading-none mb-4">{name}</h1>
                    {description && <p className="text-gray-500 text-lg md:text-xl mt-3 max-w-xl mx-auto">{description}</p>}
                    {(address || hours) && (
                        <p className="text-gray-400 text-sm mt-4 inline-flex items-center justify-center gap-2 flex-wrap">
                            {address && <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {address}</span>}
                            {address && hours && <span className="opacity-40">·</span>}
                            {hours && <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {hours}</span>}
                        </p>
                    )}
                    <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                        <button onClick={goToMenu} className="px-8 py-3.5 text-white font-bold rounded-full hover:scale-105 transition-all inline-flex items-center justify-center gap-2" style={{ backgroundColor: primary }}><UtensilsCrossed className="w-4 h-4" /> Sfoglia il Menu</button>
                        {showBooking && <button onClick={() => scrollTo('prenota')} className="px-8 py-3.5 font-bold rounded-full border-2 hover:bg-gray-100 transition-colors inline-flex items-center justify-center gap-2" style={{ borderColor: primary, color: primary }}><CalendarDays className="w-4 h-4" /> Prenota Tavolo</button>}
                        <button onClick={goToTakeaway} className="px-8 py-3.5 font-bold rounded-full border-2 border-gray-200 text-gray-600 hover:bg-gray-100 transition-colors inline-flex items-center justify-center gap-2"><ShoppingBag className="w-4 h-4" /> Asporto</button>
                    </div>
                </div>
            </section>

            {/* Ticker (optional) */}
            {showTicker && (
                <div className="overflow-hidden py-2.5 border-y border-gray-100">
                    <div className="whitespace-nowrap marquee-run inline-flex gap-8">
                        {tickerItems.map((item, i) => (
                            <span key={i} className="font-semibold text-xs uppercase tracking-widest inline-flex items-center gap-3" style={{ color: primary }}>
                                <span className="opacity-40">·</span> {item}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Why Us */}
            {showWhyUs && (
                <section className="py-16 bg-white border-b border-gray-100">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                        {sectionWhyTitle && <h2 className="text-center text-xl font-black text-gray-900 uppercase tracking-wide mb-10">{sectionWhyTitle}</h2>}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {features.map((f, i) => (
                                <div key={i} className="p-5 rounded-2xl bg-gray-50 text-center hover:bg-gray-100 transition-colors">
                                    <div className="mb-2 inline-flex items-center justify-center" style={{ color: primary }}>
                                        <FeatureIcon icon={f.icon} className="w-7 h-7" />
                                    </div>
                                    <div className="font-bold text-sm text-gray-800">{f.title}</div>
                                    <div className="text-gray-400 text-xs mt-1">{f.sub}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Categories */}
            {categories.length > 0 && (
                <section id="categories" className="py-20 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-end justify-between mb-10">
                            <div>
                                <p className="text-sm font-semibold uppercase tracking-widest mb-1" style={{ color: primary }}>Esplora</p>
                                <h2 className="text-4xl md:text-5xl font-black text-gray-900">{sectionMenuTitle || 'Il nostro Menu'}</h2>
                            </div>
                            <button onClick={goToMenu} className="hidden md:block px-6 py-3 text-white font-bold rounded-full text-sm hover:scale-105 transition-all" style={{ backgroundColor: primary }}>Ordina Ora →</button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {categories.map(cat => {
                                const img = cat.image ? `${process.env.REACT_APP_BUCKET_URL}${cat.image}` : '';
                                return (
                                    <button key={cat.id} onClick={() => navigate(`/${localname}/Products/${cat.id}`)} className="relative rounded-2xl overflow-hidden group h-40 md:h-52 text-left">
                                        {img ? <img src={img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full bg-gray-100" />}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                                        <div className="absolute bottom-0 left-0 p-4">
                                            <h3 className="text-white font-black text-base">{cat.name}</h3>
                                            {cat.description && <p className="text-gray-300 text-xs mt-0.5 line-clamp-1">{cat.description}</p>}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* Info */}
            <section id="info" className="py-20 bg-gray-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 mb-8">Info & Contatti</h2>
                            <div className="space-y-5">
                                {address  && <InfoRow primary={primary} icon={<MapPin className="w-5 h-5" />} label="Dove siamo" value={address} />}
                                {hours    && <InfoRow primary={primary} icon={<Clock className="w-5 h-5" />} label="Orari" value={hours} />}
                                {phone    && <InfoRow primary={primary} icon={<Phone className="w-5 h-5" />} label="Telefono" value={<a href={`tel:${phone}`} className="hover:underline">{phone}</a>} />}
                                {whatsapp && <InfoRow primary={primary} icon={<MessageCircle className="w-5 h-5" />} label="WhatsApp" value={<a href={`https://wa.me/${whatsapp.replace(/[^0-9+]/g,'')}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{whatsapp}</a>} />}
                            </div>
                        </div>
                        <div>
                            {(instagramUrl || facebookUrl || tiktokUrl) && (
                                <div className="mb-6">
                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Seguici</p>
                                    <div className="flex gap-3">
                                        {instagramUrl?.length > 5 && <SocialBtn href={instagramUrl} primary={primary} label="Instagram"><IgIcon /></SocialBtn>}
                                        {facebookUrl?.length > 5 && <SocialBtn href={facebookUrl} primary={primary} label="Facebook"><FbIcon /></SocialBtn>}
                                        {tiktokUrl?.length > 5 && <SocialBtn href={tiktokUrl} primary={primary} label="TikTok"><TkIcon /></SocialBtn>}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Booking */}
            {showBooking && (
                <section id="prenota" className="py-20 bg-white">
                    <div className="max-w-2xl mx-auto px-4">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-black text-gray-900">{sectionBookingTitle || 'Prenota il tuo Tavolo'}</h2>
                            <p className="text-gray-400 mt-2 text-sm">Compila il modulo e ti ricontatteremo per confermare.</p>
                        </div>
                        <div className="bg-white rounded-3xl shadow-md border border-gray-100 p-8 md:p-10">
                            <BookingForm primary={primary} primaryRgb={primaryRgb} localname={localname} />
                        </div>
                    </div>
                </section>
            )}

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
                    <span className="font-black text-2xl" style={{ color: primary }}>{name}</span>
                    <div className="flex gap-6 text-gray-500">
                        {address && <span className="text-xs inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {address}</span>}
                        {phone   && <span className="text-xs inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {phone}</span>}
                    </div>
                    <p className="text-xs text-gray-600">Powered by <span style={{ color: primary }}>AxiomGroup</span></p>
                </div>
            </footer>
        </div>
    );
};

// ─── Template: LUXURY ─────────────────────────────────────────────────────────

const LuxuryTemplate: React.FC<TemplateProps> = ({
    primary, primaryRgb, name, heroImg, logoImg, description, hours, whatsapp, tiktokUrl,
    categories, features, sectionMenuTitle, sectionBookingTitle, sectionWhyTitle,
    showWhyUs, showBooking, showTicker, localname, address, phone, instagramUrl, facebookUrl,
    goToMenu, goToTakeaway, scrollTo, navigate,
}) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 60);
        window.addEventListener('scroll', handler);
        return () => window.removeEventListener('scroll', handler);
    }, []);

    return (
        <div className="min-h-screen overflow-x-hidden bg-black font-sans">
            <style>{`
                @keyframes fadeUpIn { from { opacity: 0; transform: translateY(32px); } to { opacity: 1; transform: translateY(0); } }
                .lux-up { animation: fadeUpIn 0.9s ease-out forwards; }
                .lux-up-1 { animation-delay: 0.2s; opacity: 0; }
                .lux-up-2 { animation-delay: 0.45s; opacity: 0; }
                .lux-up-3 { animation-delay: 0.7s; opacity: 0; }
            `}</style>

            {/* Navbar */}
            <nav className={`fixed w-full z-50 transition-all duration-500 ${scrolled ? 'bg-black/90 backdrop-blur-md border-b border-white/5' : 'bg-transparent'}`}>
                <div className="max-w-7xl mx-auto px-6 lg:px-8">
                    <div className="flex justify-between items-center h-[72px]">
                        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-3 group">
                            {logoImg ? (
                                <img src={logoImg} alt={name} className="w-10 h-10 rounded-full object-cover border-2 group-hover:scale-110 transition-transform" style={{ borderColor: primary }} />
                            ) : (
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: primary }} />
                            )}
                            <span className="text-xl font-black tracking-[0.05em] text-white">{name}</span>
                        </button>
                        <div className="hidden md:flex items-center gap-8">
                            {[['Menu','categories'],['Info','info'],showBooking && ['Prenota','prenota']].filter(Boolean).map((item: any) => (
                                <button key={item[1]} onClick={() => scrollTo(item[1])} className="text-xs font-bold uppercase tracking-[0.15em] text-gray-400 hover:text-white transition-colors">{item[0]}</button>
                            ))}
                            <button onClick={goToMenu} className="text-xs font-bold uppercase tracking-[0.15em] px-6 py-2.5 border text-white hover:text-black hover:bg-white transition-all duration-300" style={{ borderColor: primary, color: primary }}>Ordina Ora</button>
                        </div>
                        <button onClick={() => setMobileOpen(v => !v)} className="md:hidden text-white">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {mobileOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                            </svg>
                        </button>
                    </div>
                </div>
                {mobileOpen && (
                    <div className="md:hidden bg-black border-t border-white/5 px-6 py-4 space-y-2">
                        {[['Menu','categories'],['Info','info'],showBooking && ['Prenota','prenota']].filter(Boolean).map((item: any) => (
                            <button key={item[1]} onClick={() => { scrollTo(item[1]); setMobileOpen(false); }} className="w-full text-left py-3 text-sm font-bold uppercase tracking-widest text-gray-300 border-b border-white/5">{item[0]}</button>
                        ))}
                        <button onClick={goToMenu} className="w-full mt-2 py-3 text-sm font-bold uppercase tracking-widest border" style={{ borderColor: primary, color: primary }}>Sfoglia il Menu</button>
                    </div>
                )}
            </nav>

            {/* Hero — full screen, text bottom-left */}
            <section className="relative h-screen flex items-end overflow-hidden bg-black">
                {heroImg && (
                    <div className="absolute inset-0">
                        <img src={heroImg} alt={name} className="w-full h-full object-cover opacity-35" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
                    </div>
                )}
                <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse at 30% 70%, rgba(${primaryRgb},0.08) 0%, transparent 60%)` }} />
                <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-8 pb-20">
                    <div className="max-w-3xl">
                        <div className="flex items-center gap-3 mb-6 lux-up lux-up-1">
                            <div className="w-8 h-px" style={{ backgroundColor: primary }} />
                            <span className="text-xs font-bold uppercase tracking-[0.25em]" style={{ color: primary }}>
                                {categories.length > 0 ? categories.slice(0,3).map(c => c.name).join(' · ') : 'Ristorante'}
                            </span>
                        </div>
                        <h1 className="text-7xl md:text-[9rem] font-black text-white leading-none tracking-tight lux-up lux-up-2">{name}</h1>
                        {description && <p className="text-gray-400 mt-6 text-xl font-light leading-relaxed max-w-xl lux-up lux-up-3">{description}</p>}
                        <div className="flex flex-wrap gap-4 mt-10 lux-up lux-up-3">
                            <button onClick={goToMenu} className="px-10 py-4 font-bold uppercase tracking-[0.1em] text-black transition-all hover:scale-105" style={{ backgroundColor: primary }}>Sfoglia il Menu →</button>
                            {showBooking && <button onClick={() => scrollTo('prenota')} className="px-10 py-4 font-bold uppercase tracking-[0.1em] text-white border border-white/20 hover:border-white/60 transition-all inline-flex items-center gap-2"><CalendarDays className="w-4 h-4" /> Prenota</button>}
                            <button onClick={goToTakeaway} className="px-10 py-4 font-bold uppercase tracking-[0.1em] text-white border border-white/20 hover:border-white/60 transition-all inline-flex items-center gap-2"><ShoppingBag className="w-4 h-4" /> Asporto</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Description quote (if present) */}
            {description && (
                <section className="bg-[#050505] py-20">
                    <div className="max-w-4xl mx-auto px-4 text-center">
                        <span className="text-8xl leading-none font-serif" style={{ color: `rgba(${primaryRgb},0.2)` }}>"</span>
                        <p className="text-2xl md:text-4xl text-white font-light italic leading-relaxed -mt-6">{description}</p>
                        <div className="w-16 h-0.5 mx-auto mt-8" style={{ backgroundColor: primary }} />
                    </div>
                </section>
            )}

            {/* Why Us */}
            {showWhyUs && (
                <section className="py-16 bg-[#0a0a0a] border-y border-white/5">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {sectionWhyTitle && <h2 className="text-center text-lg font-bold uppercase tracking-[0.2em] text-gray-500 mb-12">{sectionWhyTitle}</h2>}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/5">
                            {features.map((f, i) => (
                                <div key={i} className="p-8 text-center bg-[#0a0a0a] hover:bg-[#111] transition-colors">
                                    <div className="mb-4 inline-flex items-center justify-center" style={{ color: primary }}>
                                        <FeatureIcon icon={f.icon} className="w-7 h-7" />
                                    </div>
                                    <div className="font-bold text-sm text-white uppercase tracking-wide">{f.title}</div>
                                    <div className="text-gray-600 text-xs mt-2">{f.sub}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Categories */}
            {categories.length > 0 && (
                <section id="categories" className="py-20 bg-[#0d0d0d]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-end justify-between mb-12">
                            <div>
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-6 h-px" style={{ backgroundColor: primary }} />
                                    <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Il Menu</span>
                                </div>
                                <h2 className="text-5xl font-black text-white">{sectionMenuTitle || 'Cosa offriamo'}</h2>
                            </div>
                            <button onClick={goToMenu} className="hidden md:block text-xs font-bold uppercase tracking-[0.15em] px-6 py-3 border transition-colors" style={{ borderColor: `rgba(${primaryRgb},0.5)`, color: primary }}>Ordina Ora →</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-0.5">
                            {categories.map((cat, idx) => {
                                const img = cat.image ? `${process.env.REACT_APP_BUCKET_URL}${cat.image}` : '';
                                const isFeatured = idx === 0;
                                return (
                                    <button
                                        key={cat.id}
                                        onClick={() => navigate(`/${localname}/Products/${cat.id}`)}
                                        className={`relative overflow-hidden group text-left ${isFeatured ? 'md:col-span-2 h-80' : 'h-52'}`}
                                        style={{ backgroundColor: '#1a1a1a' }}
                                    >
                                        {img ? <img src={img} alt={cat.name} className="w-full h-full object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-700" /> : <div className="w-full h-full" style={{ background: `linear-gradient(135deg, #1a1a1a, rgba(${primaryRgb},0.15))` }} />}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                                        <div className="absolute bottom-0 left-0 p-6">
                                            <div className="w-4 h-px mb-3 transition-all duration-300 group-hover:w-8" style={{ backgroundColor: primary }} />
                                            <h3 className="text-white text-xl font-black">{cat.name}</h3>
                                            {cat.description && <p className="text-gray-400 text-xs mt-1 line-clamp-1">{cat.description}</p>}
                                        </div>
                                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                                            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: primary }}>Esplora →</span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* Divider line */}
            <div className="h-px w-full" style={{ backgroundColor: `rgba(${primaryRgb},0.3)` }} />

            {/* Info */}
            <section id="info" className="py-24 bg-[#080808]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-6 h-px" style={{ backgroundColor: primary }} />
                                <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Dove siamo</span>
                            </div>
                            <h2 className="text-5xl font-black text-white mb-10">Info & <span style={{ color: primary }}>Contatti</span></h2>
                            <div className="space-y-6">
                                {address  && <InfoRow dark primary={primary} icon={<MapPin className="w-5 h-5" />} label="Indirizzo" value={address} />}
                                {hours    && <InfoRow dark primary={primary} icon={<Clock className="w-5 h-5" />} label="Orari" value={hours} />}
                                {phone    && <InfoRow dark primary={primary} icon={<Phone className="w-5 h-5" />} label="Telefono" value={<a href={`tel:${phone}`} className="hover:text-white transition-colors">{phone}</a>} />}
                                {whatsapp && <InfoRow dark primary={primary} icon={<MessageCircle className="w-5 h-5" />} label="WhatsApp" value={<a href={`https://wa.me/${whatsapp.replace(/[^0-9+]/g,'')}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{whatsapp}</a>} />}
                            </div>
                        </div>
                        <div className="lg:pt-24">
                            {(instagramUrl || facebookUrl || tiktokUrl) && (
                                <div className="mb-8">
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-600 mb-5">Seguici</p>
                                    <div className="flex gap-3">
                                        {instagramUrl?.length > 5 && <SocialBtn dark href={instagramUrl} primary={primary} label="Instagram"><IgIcon /></SocialBtn>}
                                        {facebookUrl?.length > 5 && <SocialBtn dark href={facebookUrl} primary={primary} label="Facebook"><FbIcon /></SocialBtn>}
                                        {tiktokUrl?.length > 5 && <SocialBtn dark href={tiktokUrl} primary={primary} label="TikTok"><TkIcon /></SocialBtn>}
                                    </div>
                                </div>
                            )}
                            <button onClick={goToMenu} className="px-8 py-4 font-bold uppercase tracking-[0.12em] text-black transition-all hover:scale-105" style={{ backgroundColor: primary }}>Sfoglia il Menu →</button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Booking */}
            {showBooking && (
                <section id="prenota" className="py-24 bg-[#050505]">
                    <div className="max-w-2xl mx-auto px-4">
                        <div className="text-center mb-12">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <div className="w-6 h-px" style={{ backgroundColor: primary }} />
                                <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500">Riserva</span>
                                <div className="w-6 h-px" style={{ backgroundColor: primary }} />
                            </div>
                            <h2 className="text-4xl font-black text-white">{sectionBookingTitle || 'Prenota il tuo Tavolo'}</h2>
                            <p className="text-gray-500 mt-3 text-sm">Compila il modulo e ti ricontatteremo per confermare.</p>
                        </div>
                        <div className="border border-white/10 p-8 md:p-10" style={{ backgroundColor: '#0d0d0d' }}>
                            <div className="h-px mb-8" style={{ background: `linear-gradient(to right, transparent, ${primary}, transparent)` }} />
                            <BookingForm primary={primary} primaryRgb={primaryRgb} localname={localname} dark />
                        </div>
                    </div>
                </section>
            )}

            {/* Footer */}
            <footer className="bg-black border-t border-white/5 py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                        <span className="font-black text-3xl tracking-tight" style={{ color: primary }}>{name}</span>
                        <div className="flex flex-wrap gap-6 text-xs text-gray-600">
                            {address && <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> {address}</span>}
                            {phone   && <span className="inline-flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {phone}</span>}
                            {hours   && <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {hours}</span>}
                        </div>
                        <p className="text-xs text-gray-700">Powered by <span style={{ color: primary }}>AxiomGroup</span></p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

// ─── Template: STRAFAME ───────────────────────────────────────────────────────

const StrafameTemplate: React.FC<TemplateProps> = ({
    primary, primaryRgb, name, heroImg, logoImg, description, hours, whatsapp, tiktokUrl,
    categories, features, sectionMenuTitle, sectionBookingTitle, sectionWhyTitle,
    showWhyUs, showBooking, showTicker, localname, address, phone, instagramUrl, facebookUrl,
    goToMenu, goToTakeaway, scrollTo,
}) => {
    const [mobileOpen, setMobileOpen] = useState(false);

    const tickerItems = categories.length > 0
        ? [...categories, ...categories].map(c => c.name)
        : ['Antipasti','Primi','Secondi','Dolci','Bevande','Antipasti','Primi','Secondi','Dolci','Bevande'];

    const specials = categories.slice(0, 3);

    return (
        <div className="min-h-screen overflow-x-hidden bg-white text-[#0e0e0e] font-sans">
            <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Oswald:wght@300;400;500;600;700&family=Barlow:wght@400;500;600;700&display=swap" />
            <style>{`
                .sf-hand { font-family: 'Permanent Marker', cursive; }
                .sf-display { font-family: 'Oswald', sans-serif; }
                .sf-body { font-family: 'Barlow', sans-serif; }
                @keyframes sfFadeUp { from { opacity: 0; transform: translateY(28px); } to { opacity: 1; transform: translateY(0); } }
                @keyframes sfMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
                @keyframes sfFloat { 0%,100% { transform: scale(1); } 50% { transform: scale(1.01); } }
                .sf-fade-up { animation: sfFadeUp 0.65s ease-out forwards; opacity: 0; }
                .sf-fade-1 { animation-delay: 0.1s; }
                .sf-fade-2 { animation-delay: 0.25s; }
                .sf-fade-3 { animation-delay: 0.4s; }
                .sf-fade-4 { animation-delay: 0.55s; }
                .sf-hero-title { animation: sfFloat 6s ease-in-out infinite; }
                .sf-marquee-track { display: inline-block; white-space: nowrap; animation: sfMarquee 22s linear infinite; }
                .sf-slant { clip-path: polygon(0 0, 100% 0, 100% 92%, 0 100%); }
                .sf-slant-bottom { clip-path: polygon(0 0, 100% 6%, 100% 100%, 0 100%); }
                .sf-nav-link { position: relative; }
                .sf-nav-link::after { content:''; position:absolute; bottom:-3px; left:0; width:0; height:2px; background:${primary}; transition: width 0.3s ease; }
                .sf-nav-link:hover::after { width:100%; }
            `}</style>

            {/* Navbar */}
            <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-[72px]">
                        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-2.5 group">
                            {logoImg ? (
                                <img src={logoImg} alt={name} className="w-9 h-9 rounded-full object-cover shadow-md group-hover:scale-110 transition-transform" />
                            ) : (
                                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md group-hover:scale-110 transition-transform" style={{ backgroundColor: primary }}>
                                    {name.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <span className="sf-hand text-[1.9rem] leading-none" style={{ color: primary, textShadow: '1px 1px 0 rgba(0,0,0,0.08)' }}>{name}</span>
                        </button>

                        <div className="hidden md:flex items-center gap-8">
                            {[['Home', () => window.scrollTo({ top: 0, behavior: 'smooth' })], specials.length > 0 && ['Speciali', () => scrollTo('specials')], ['Menu', () => scrollTo('categories')], showBooking && ['Prenota', () => scrollTo('prenota')]].filter(Boolean).map((item: any) => (
                                <button key={item[0]} onClick={item[1]} className="sf-nav-link sf-display text-gray-500 hover:text-[#0e0e0e] font-semibold uppercase text-sm tracking-wider transition-colors">{item[0]}</button>
                            ))}
                            <button onClick={goToMenu} className="sf-display bg-[#0e0e0e] text-white px-6 py-2.5 rounded-full font-bold tracking-wider text-sm transition-all duration-300 hover:scale-105" onMouseEnter={e => (e.currentTarget.style.backgroundColor = primary)} onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#0e0e0e')}>
                                Ordina Ora
                            </button>
                        </div>

                        <button onClick={() => setMobileOpen(v => !v)} className="md:hidden text-[#0e0e0e]">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {mobileOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
                            </svg>
                        </button>
                    </div>
                </div>
                {mobileOpen && (
                    <div className="md:hidden bg-white border-t border-gray-100 px-4 pt-3 pb-5 space-y-1">
                        {[['Home', () => window.scrollTo({ top: 0, behavior: 'smooth' })], specials.length > 0 && ['Speciali', () => scrollTo('specials')], ['Menu', () => scrollTo('categories')], showBooking && ['Prenota', () => scrollTo('prenota')]].filter(Boolean).map((item: any) => (
                            <button key={item[0]} onClick={() => { item[1](); setMobileOpen(false); }} className="sf-display block w-full text-left py-3 font-bold uppercase text-sm text-gray-700 border-b border-gray-50">{item[0]}</button>
                        ))}
                        <button onClick={goToMenu} className="sf-display block w-full mt-3 py-3 text-white font-bold uppercase rounded-xl" style={{ backgroundColor: primary }}>Ordina Ora</button>
                    </div>
                )}
            </nav>

            {/* Hero */}
            <section className="sf-slant relative min-h-[95vh] flex items-center justify-center overflow-hidden bg-[#0e0e0e]">
                {heroImg && (
                    <div className="absolute inset-0 z-0">
                        <img src={heroImg} alt={name} className="w-full h-full object-cover opacity-50" />
                        <div className="absolute inset-0 bg-gradient-to-br from-[#0e0e0e] via-[#0e0e0e]/70 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0e0e0e] via-transparent to-transparent" />
                    </div>
                )}
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[120px] pointer-events-none" style={{ backgroundColor: `rgba(${primaryRgb},0.1)` }} />

                <div className="relative z-10 text-center px-4 max-w-5xl mx-auto mt-20">
                    {categories.length > 0 && (
                        <div className="sf-fade-up sf-fade-1 inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold tracking-[0.25em] uppercase mb-8 border" style={{ backgroundColor: `rgba(${primaryRgb},0.08)`, borderColor: `rgba(${primaryRgb},0.25)`, color: primary }}>
                            {categories.slice(0, 4).map(c => c.name).join(' · ')}
                        </div>
                    )}

                    <h1 className="sf-hand sf-hero-title sf-fade-up sf-fade-2 text-7xl md:text-[9rem] lg:text-[11rem] text-white leading-none mb-2" style={{ textShadow: `4px 4px 0 rgba(${primaryRgb},0.3), 0 0 60px rgba(${primaryRgb},0.1)` }}>
                        {name}
                    </h1>

                    {description && (
                        <p className="sf-display sf-fade-up sf-fade-3 text-xl md:text-3xl text-gray-300 mb-3 font-light uppercase tracking-[0.12em]">
                            {description}
                        </p>
                    )}

                    {(address || hours) && (
                        <p className="sf-fade-up sf-fade-3 text-gray-500 text-sm mb-10 tracking-widest">
                            {address && <span>{address}</span>}
                            {address && hours && <span> &nbsp;·&nbsp; </span>}
                            {hours && <span>{hours}</span>}
                        </p>
                    )}

                    <div className="sf-fade-up sf-fade-4 flex flex-col sm:flex-row gap-4 justify-center">
                        <button onClick={goToMenu} className="sf-display text-white px-10 py-4 rounded-full font-bold text-lg uppercase tracking-wider transition-all duration-300 hover:scale-105 hover:brightness-110" style={{ backgroundColor: primary, boxShadow: `0 0 30px rgba(${primaryRgb},0.4)` }}>
                            Ordina Ora
                        </button>
                        {showBooking && (
                            <button onClick={() => scrollTo('prenota')} className="sf-display bg-transparent border-2 border-white/40 text-white px-10 py-4 rounded-full font-bold text-lg uppercase tracking-wider hover:bg-white hover:text-[#0e0e0e] hover:border-white transition-all duration-300">
                                Prenota Tavolo
                            </button>
                        )}
                        <button onClick={goToTakeaway} className="sf-display bg-transparent border-2 border-white/40 text-white px-10 py-4 rounded-full font-bold text-lg uppercase tracking-wider hover:bg-white hover:text-[#0e0e0e] hover:border-white transition-all duration-300">
                            Asporto
                        </button>
                    </div>
                </div>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2">
                    <div className="w-5 h-8 rounded-full border-2 border-white/30 flex items-start justify-center p-1">
                        <div className="w-1 h-2 rounded-full bg-white/60 animate-bounce" />
                    </div>
                </div>
            </section>

            {/* Ticker */}
            {showTicker && (
                <div className="py-3 overflow-hidden relative z-10" style={{ backgroundColor: primary }}>
                    <div className="overflow-hidden whitespace-nowrap">
                        <div className="sf-marquee-track sf-display text-white font-bold text-sm uppercase tracking-[0.2em]">
                            {tickerItems.map((item, i) => (
                                <span key={i} className="inline-flex items-center gap-4">
                                    <span className="opacity-50">·</span>
                                    {item}
                                    <span>&nbsp;</span>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Why Us */}
            {showWhyUs && (
                <section className="py-20 bg-white">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        {sectionWhyTitle && (
                            <h2 className="sf-display text-center text-3xl md:text-4xl font-bold text-[#0e0e0e] uppercase mb-10">
                                {sectionWhyTitle}
                            </h2>
                        )}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                            {features.map((f, i) => (
                                <div key={i} className="p-6 rounded-2xl hover:bg-gray-50 transition-colors group cursor-default">
                                    <div className="mb-3 inline-flex items-center justify-center w-14 h-14 rounded-2xl group-hover:scale-110 transition-transform" style={{ color: primary, backgroundColor: `rgba(${primaryRgb},0.08)` }}>
                                        <FeatureIcon icon={f.icon} className="w-7 h-7" />
                                    </div>
                                    <div className="sf-display font-bold text-lg uppercase">{f.title}</div>
                                    <div className="text-gray-400 text-sm mt-1">{f.sub}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Speciali (first 3 categories as hero cards) */}
            {specials.length > 0 && (
                <section id="specials" className="sf-slant-bottom py-20 bg-[#0e0e0e] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-[100px] pointer-events-none" style={{ backgroundColor: `rgba(${primaryRgb},0.1)` }} />
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="mb-14">
                            <p className="sf-hand text-2xl mb-2" style={{ color: primary }}>Da non perdere</p>
                            <h2 className="sf-display text-4xl md:text-6xl font-bold text-white uppercase">
                                I Nostri <span style={{ color: primary }}>Speciali</span>
                            </h2>
                        </div>
                        <div className="grid md:grid-cols-3 gap-6">
                            {specials.map(cat => {
                                const img = cat.image ? `${process.env.REACT_APP_BUCKET_URL}${cat.image}` : '';
                                return (
                                    <button key={cat.id} onClick={() => window.location.assign(`/${localname}/Products/${cat.id}`)} className="relative rounded-3xl overflow-hidden group h-80 cursor-pointer text-left">
                                        {img ? (
                                            <img src={img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                        ) : (
                                            <div className="w-full h-full" style={{ background: `linear-gradient(135deg, rgba(${primaryRgb},0.4), rgba(${primaryRgb},0.1))` }} />
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                                        <div className="absolute bottom-0 left-0 p-6">
                                            <span className="inline-block text-white text-[0.65rem] font-extrabold uppercase tracking-[0.08em] px-2 py-0.5 rounded-sm mb-2" style={{ backgroundColor: primary }}>Signature</span>
                                            <h3 className="sf-hand text-3xl text-white leading-tight">{cat.name}</h3>
                                            {cat.description && <p className="text-gray-300 text-sm mt-1 line-clamp-2">{cat.description}</p>}
                                            <div className="mt-3">
                                                <span className="inline-block px-4 py-1.5 rounded-full border text-xs font-bold transition-all" style={{ color: primary, borderColor: primary }}>
                                                    Sfoglia →
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* Menu */}
            {categories.length > 0 && (
                <section id="categories" className="py-24 bg-gray-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="text-center mb-14">
                            <p className="sf-hand text-2xl mb-1" style={{ color: primary }}>Cosa mangi stasera?</p>
                            <h2 className="sf-display text-5xl md:text-6xl font-bold text-[#0e0e0e] uppercase">
                                {sectionMenuTitle || 'Il Nostro'} <span style={{ color: primary }}>{sectionMenuTitle ? '' : 'Menu'}</span>
                            </h2>
                            <p className="text-gray-400 mt-3 max-w-xl mx-auto">Ingredienti freschi, porzioni abbondanti, gusti che ricordi.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {categories.map(cat => {
                                const img = cat.image ? `${process.env.REACT_APP_BUCKET_URL}${cat.image}` : '';
                                return (
                                    <button key={cat.id} onClick={() => window.location.assign(`/${localname}/Products/${cat.id}`)} className="bg-white rounded-2xl shadow-md overflow-hidden flex flex-col border border-gray-100 group transition-all duration-300 hover:-translate-y-2 hover:shadow-xl text-left">
                                        <div className="relative h-52 overflow-hidden">
                                            {img ? (
                                                <img src={img} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            ) : (
                                                <div className="w-full h-full" style={{ background: `linear-gradient(135deg, rgba(${primaryRgb},0.3), rgba(${primaryRgb},0.05))` }} />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="p-5 flex flex-col flex-1">
                                            <span className="text-[10px] font-bold uppercase tracking-[0.12em]" style={{ color: primary }}>Categoria</span>
                                            <h3 className="sf-display font-bold text-xl text-gray-900 leading-tight mt-0.5">{cat.name}</h3>
                                            {cat.description && <p className="text-gray-400 text-sm leading-relaxed mt-2 flex-1 line-clamp-2">{cat.description}</p>}
                                            <div className="mt-5 w-full py-3 bg-[#0e0e0e] text-white sf-display font-bold uppercase text-sm tracking-wider rounded-xl flex items-center justify-center gap-2 transition-colors group-hover:bg-[color:var(--sf-hover)]" style={{ ['--sf-hover' as any]: primary }}>
                                                Sfoglia →
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </section>
            )}

            {/* Booking + Info */}
            {(showBooking || address || phone || whatsapp) && (
                <section id="prenota" className="py-24 bg-[#0e0e0e] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[130px] pointer-events-none -translate-y-1/3 translate-x-1/3" style={{ backgroundColor: primary, opacity: 0.07 }} />
                    <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/3" style={{ backgroundColor: primary, opacity: 0.05 }} />

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                            <div className="text-white">
                                <p className="sf-hand text-3xl mb-3" style={{ color: primary }}>Vieni a trovarci</p>
                                <h2 className="sf-display text-5xl md:text-6xl font-bold mb-10 leading-[1.1] uppercase">
                                    {sectionBookingTitle ? <>{sectionBookingTitle}</> : (
                                        <>Prenota il tuo<br />tavolo da<br /><span style={{ color: primary }}>{name}</span></>
                                    )}
                                </h2>

                                <div className="space-y-5">
                                    {address && (
                                        <div className="flex items-start gap-4">
                                            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border" style={{ color: primary, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
                                                <MapPin className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="sf-display font-bold uppercase tracking-wide text-xs mb-0.5 text-white">Dove siamo</h4>
                                                <div className="text-sm text-gray-400">{address}</div>
                                            </div>
                                        </div>
                                    )}
                                    {hours && (
                                        <div className="flex items-start gap-4">
                                            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border" style={{ color: primary, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
                                                <Clock className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="sf-display font-bold uppercase tracking-wide text-xs mb-0.5 text-white">Orari</h4>
                                                <div className="text-sm text-gray-400">{hours}</div>
                                            </div>
                                        </div>
                                    )}
                                    {whatsapp && (
                                        <div className="flex items-start gap-4">
                                            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border" style={{ color: primary, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
                                                <MessageCircle className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="sf-display font-bold uppercase tracking-wide text-xs mb-0.5 text-white">WhatsApp</h4>
                                                <a href={`https://wa.me/${whatsapp.replace(/[^0-9+]/g,'')}`} target="_blank" rel="noopener noreferrer" className="text-sm text-gray-400 hover:text-white transition-colors">{whatsapp}</a>
                                            </div>
                                        </div>
                                    )}
                                    {phone && (
                                        <div className="flex items-start gap-4">
                                            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border" style={{ color: primary, borderColor: 'rgba(255,255,255,0.08)', backgroundColor: 'rgba(255,255,255,0.04)' }}>
                                                <Phone className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="sf-display font-bold uppercase tracking-wide text-xs mb-0.5 text-white">Telefono</h4>
                                                <a href={`tel:${phone}`} className="text-sm text-gray-400 hover:text-white transition-colors">{phone}</a>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {showBooking && (
                                <div className="bg-white rounded-3xl overflow-hidden" style={{ boxShadow: `0 0 80px rgba(${primaryRgb},0.12)` }}>
                                    <div className="h-1.5" style={{ background: `linear-gradient(to right, ${primary}, ${primary}99, ${primary})` }} />
                                    <div className="p-8 md:p-10">
                                        <h3 className="sf-display font-bold text-2xl text-[#0e0e0e] mb-7 uppercase tracking-wide">Richiesta Prenotazione</h3>
                                        <BookingForm primary={primary} primaryRgb={primaryRgb} localname={localname} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            )}

            {/* Footer */}
            <footer className="bg-[#080808] text-white py-14 border-t border-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-3 gap-10 mb-10">
                        <div>
                            <span className="sf-hand text-4xl block mb-3" style={{ color: primary }}>{name}</span>
                            {description && <p className="text-gray-500 text-sm leading-relaxed max-w-xs">{description}</p>}
                        </div>
                        <div>
                            <h4 className="sf-display font-bold uppercase text-sm tracking-widest text-gray-400 mb-4">Naviga</h4>
                            <ul className="space-y-2">
                                {[['Home', () => window.scrollTo({ top: 0, behavior: 'smooth' })], specials.length > 0 && ['Speciali', () => scrollTo('specials')], ['Menu', () => scrollTo('categories')], showBooking && ['Prenota', () => scrollTo('prenota')]].filter(Boolean).map((item: any) => (
                                    <li key={item[0]}>
                                        <button onClick={item[1]} className="text-gray-500 transition-colors text-sm hover:text-white" onMouseEnter={e => (e.currentTarget.style.color = primary)} onMouseLeave={e => (e.currentTarget.style.color = '')}>{item[0]}</button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="sf-display font-bold uppercase text-sm tracking-widest text-gray-400 mb-4">Seguici</h4>
                            {(instagramUrl?.length > 5 || facebookUrl?.length > 5 || tiktokUrl?.length > 5) && (
                                <div className="flex gap-3">
                                    {instagramUrl?.length > 5 && <SocialBtn dark href={instagramUrl} primary={primary} label="Instagram"><IgIcon /></SocialBtn>}
                                    {facebookUrl?.length > 5 && <SocialBtn dark href={facebookUrl} primary={primary} label="Facebook"><FbIcon /></SocialBtn>}
                                    {tiktokUrl?.length > 5 && <SocialBtn dark href={tiktokUrl} primary={primary} label="TikTok"><TkIcon /></SocialBtn>}
                                </div>
                            )}
                            {address && <p className="text-gray-600 text-xs mt-5">{address}</p>}
                            {phone && <p className="text-gray-600 text-xs mt-1">{phone}</p>}
                        </div>
                    </div>
                    <div className="border-t border-gray-900 pt-6 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-gray-600">
                        <p>© {new Date().getFullYear()} {name} — Tutti i diritti riservati.</p>
                        <p>Powered by <span style={{ color: primary }}>AxiomGroup</span></p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

// ─── Main dispatcher ──────────────────────────────────────────────────────────

const VenueLandingPage: React.FC = () => {
    const { loading, styles, categoriesMap } = useData();
    const { localname } = useParams<{ localname: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const tableId = searchParams.get('table');
        if (tableId) navigate(`/${localname}/Categories?table=${tableId}`, { replace: true });
    }, [searchParams, navigate, localname]);

    if (loading) return <CustomLoading />;

    const primary     = styles?.primary || '#fb923c';
    const primaryRgb  = hexToRgb(primary);
    const name        = styles?.restaurantName || localname || 'Ristorante';
    const heroImg     = styles?.heroImageUrl ? resolveImageUrl(styles.heroImageUrl, '') : '';
    const logoImg     = styles?.logoUrl ? resolveImageUrl(styles.logoUrl, '') : '';
    const description = (styles as any)?.description as string || '';
    const hours       = (styles as any)?.openingHours as string || '';
    const whatsapp    = (styles as any)?.whatsapp as string || '';
    const tiktokUrl   = (styles as any)?.tiktokUrl as string || '';
    const template    = styles?.landingTemplate || 'default';

    let rawFeatures = styles?.features;
    if (typeof rawFeatures === 'string') {
        try { rawFeatures = JSON.parse(rawFeatures as any); } catch { rawFeatures = undefined; }
    }
    const features: FeatureCard[] = (rawFeatures as FeatureCard[] | undefined)?.length ? rawFeatures as FeatureCard[] : DEFAULT_FEATURES;

    const categories = Array.from(categoriesMap.values()).filter(c => c.available);

    const goToMenu     = () => navigate(`/${localname}/Categories`);
    const goToTakeaway = () => { localStorage.removeItem('rf_table_id'); navigate(`/${localname}/Categories`); };
    const scrollTo     = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

    const props: TemplateProps = {
        primary, primaryRgb, name, heroImg, logoImg, description, hours, whatsapp, tiktokUrl,
        categories, features,
        sectionMenuTitle:    styles?.sectionMenuTitle    || '',
        sectionBookingTitle: styles?.sectionBookingTitle || '',
        sectionWhyTitle:     styles?.sectionWhyTitle     || '',
        showWhyUs:   styles?.showWhyUs   ?? true,
        showBooking: styles?.showBooking ?? true,
        showTicker:  styles?.showTicker  ?? true,
        localname: localname || '',
        address:      styles?.address      || '',
        phone:        styles?.phone        || '',
        instagramUrl: styles?.instagramUrl || '',
        facebookUrl:  styles?.facebookUrl  || '',
        goToMenu, goToTakeaway, scrollTo, navigate,
    };

    if (template === 'minimal')  return <MinimalTemplate  {...props} />;
    if (template === 'luxury')   return <LuxuryTemplate   {...props} />;
    if (template === 'strafame') return <StrafameTemplate {...props} />;
    return <DefaultTemplate {...props} />;
};

export default VenueLandingPage;
