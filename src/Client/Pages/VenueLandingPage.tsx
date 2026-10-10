import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useData } from '../../Context/DataContext';
import { resolveImageUrl } from '../../Utilities/Utilities';
import CustomLoading from '../../Components/CustomLoading';
import { createReservationPublicApi } from '../../Utilities/api';
import { CategoryDto, FeatureCard } from '../../types';
import { MapPin, Clock, MessageCircle, Phone, CheckCircle2, Loader2 } from 'lucide-react';
import { FEATURE_ICON_MAP } from '../../Utilities/featureIcons';
import { usePreviewStyles } from '../usePreviewStyles';
import { useMenuLook } from '../../Components/Client/MenuThemeProvider';
import { MenuRule } from '../../Components/Client/MenuPrimitives';
import ClientCategoriesList from '../../Components/Client/ClientCategoriesList';
import { getTemplateDef } from '../menuTemplates';

/**
 * Sito vetrina pubblico del locale (`/:localname`).
 *
 * Un'unica struttura per tutti i template della libreria (`menuTemplates.ts`):
 * colori, font, filetti, intestazione e impaginazione delle categorie arrivano
 * dal "look" del template via CSS variables + `useMenuLook()`. Così ogni
 * template ha le stesse funzioni (prenotazione, asporto, info, social…) e
 * cambia solo l'aspetto.
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isDarkColor = (hex: string): boolean => {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
    if (!m) return true;
    const [r, g, b] = [m[1], m[2], m[3]].map(x => parseInt(x, 16) / 255)
        .map(c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.4;
};

const FeatureIcon: React.FC<{ icon: string; className?: string; style?: React.CSSProperties }> = ({ icon, className, style }) => {
    const Cmp = FEATURE_ICON_MAP[icon];
    if (Cmp) return <Cmp className={className} style={style} aria-hidden="true" />;
    // fallback: testo libero (compat con dati vecchi)
    return <span className={className} style={style}>{icon}</span>;
};

const DEFAULT_FEATURES: FeatureCard[] = [
    { icon: 'leaf',       title: 'Ingredienti Freschi', sub: 'Selezionati ogni giorno' },
    { icon: 'chef-hat',   title: 'Ricette Originali',   sub: 'Chef di esperienza' },
    { icon: 'zap',        title: 'Servizio Rapido',     sub: 'Pronto in pochi minuti' },
    { icon: 'smartphone', title: 'Ordina dal Tavolo',   sub: 'Scansiona il QR' },
];

const IgIcon = () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>;
const FbIcon = () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
const TkIcon = () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.2 8.2 0 004.79 1.53V6.77a4.85 4.85 0 01-1.02-.08z"/></svg>;

// ─── Bottoni ──────────────────────────────────────────────────────────────────

type BtnVariant = 'primary' | 'secondary' | 'ghost';

const Btn: React.FC<{
    variant?: BtnVariant;
    onClick?: () => void;
    type?: 'button' | 'submit';
    disabled?: boolean;
    full?: boolean;
    /** Colore testo/bordo per il ghost (es. bianco sopra una foto). */
    ghostColor?: string;
    children: React.ReactNode;
}> = ({ variant = 'primary', onClick, type = 'button', disabled, full, ghostColor, children }) => {
    const { look } = useMenuLook();
    const heavy = look.cardBorder === 'heavy' && look.offsetShadow;
    const palette: Record<BtnVariant, React.CSSProperties> = {
        primary:   { background: 'var(--menu-accent)', color: 'var(--menu-accent-text)', border: heavy ? '2px solid var(--menu-text)' : '1px solid var(--menu-accent)' },
        secondary: { background: 'var(--menu-secondary)', color: 'var(--menu-secondary-text)', border: heavy ? '2px solid var(--menu-text)' : '1px solid var(--menu-secondary)' },
        ghost:     { background: 'transparent', color: ghostColor || 'var(--menu-text)', border: `1px solid ${ghostColor || 'var(--menu-rule)'}` },
    };
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`menu-focus inline-flex items-center justify-center gap-2 transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60 ${full ? 'w-full' : ''}`}
            style={{
                ...palette[variant],
                minHeight: 48,
                padding: '0 22px',
                borderRadius: 'var(--menu-radius)',
                fontFamily: 'var(--menu-font-body)',
                fontSize: '0.86rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                boxShadow: heavy && variant !== 'ghost' ? '3px 3px 0 var(--menu-text)' : 'none',
            }}
        >
            {children}
        </button>
    );
};

const SectionTitle: React.FC<{ eyebrow?: string; title: string; centered: boolean }> = ({ eyebrow, title, centered }) => (
    <div className={`mb-8 ${centered ? 'text-center' : ''}`}>
        {eyebrow && <p className="menu-label" style={{ color: 'var(--menu-emph)' }}>{eyebrow}</p>}
        <h2 className="menu-h mt-2" style={{ fontSize: 'clamp(1.9rem, 7vw, 3rem)', textAlign: centered ? 'center' : 'left' }}>
            {title}
        </h2>
    </div>
);

// ─── Prenotazione ─────────────────────────────────────────────────────────────

const Field: React.FC<{ id: string; label: string; children: React.ReactNode }> = ({ id, label, children }) => (
    <div>
        <label htmlFor={id} className="menu-label block mb-1.5">{label}</label>
        {children}
    </div>
);

const BookingForm: React.FC<{ localname: string }> = ({ localname }) => {
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

    const inputStyle: React.CSSProperties = { borderRadius: 'var(--menu-radius)', minHeight: 46, fontSize: '0.95rem' };

    if (done) return (
        <div className="text-center py-10">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--menu-emph)' }} strokeWidth={1.5} />
            <h3 className="menu-h" style={{ fontSize: '1.6rem' }}>Richiesta inviata</h3>
            <p className="mt-2" style={{ color: 'var(--menu-muted)' }}>Ti contatteremo presto per confermare la prenotazione.</p>
            <div className="mt-6">
                <Btn variant="ghost" onClick={() => setDone(false)}>Nuova prenotazione</Btn>
            </div>
        </div>
    );

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field id="bk-name" label="Nome e cognome *">
                    <input id="bk-name" required type="text" autoComplete="name" value={form.name} onChange={set('name')} className="dark-input" style={inputStyle} placeholder="Mario Rossi" />
                </Field>
                <Field id="bk-phone" label="Telefono *">
                    <input id="bk-phone" required type="tel" autoComplete="tel" value={form.phone} onChange={set('phone')} className="dark-input" style={inputStyle} placeholder="+39 333 000 0000" />
                </Field>
            </div>
            <Field id="bk-email" label="Email (facoltativa)">
                <input id="bk-email" type="email" autoComplete="email" value={form.email} onChange={set('email')} className="dark-input" style={inputStyle} placeholder="mario@email.com" />
            </Field>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Field id="bk-date" label="Data *">
                    <input id="bk-date" required type="date" value={form.date} onChange={set('date')} min={new Date().toISOString().split('T')[0]} className="dark-input" style={inputStyle} />
                </Field>
                <Field id="bk-time" label="Orario *">
                    <select id="bk-time" required value={form.time} onChange={set('time')} className="dark-input appearance-none" style={inputStyle}>
                        <option value="">Scegli</option>
                        {['12:00','12:30','13:00','13:30','14:00','19:00','19:30','20:00','20:30','21:00','21:30','22:00'].map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </Field>
                <div className="col-span-2 sm:col-span-1">
                    <Field id="bk-guests" label="Persone *">
                        <input id="bk-guests" required type="number" inputMode="numeric" min="1" max="20" value={form.guests} onChange={set('guests')} className="dark-input" style={inputStyle} placeholder="2" />
                    </Field>
                </div>
            </div>
            <Field id="bk-notes" label="Note (facoltative)">
                <textarea id="bk-notes" value={form.notes} onChange={set('notes')} rows={3} className="dark-input resize-none" style={{ ...inputStyle, minHeight: 0 }} placeholder="Allergie, seggiolone, tavolo all'aperto…" />
            </Field>
            {error && (
                <p role="alert" className="text-sm py-2 px-3" style={{ color: '#b91c1c', background: '#fef2f2', borderRadius: 'var(--menu-radius)' }}>
                    {error}
                </p>
            )}
            <div className="pt-1">
                <Btn type="submit" disabled={busy} full>
                    {busy ? (<><Loader2 className="w-4 h-4 animate-spin" /> Invio in corso…</>) : 'Invia la richiesta'}
                </Btn>
            </div>
        </form>
    );
};

// ─── Landing ──────────────────────────────────────────────────────────────────

interface LandingProps {
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
    /** Sfondo pagina: gradiente se il ristoratore ne ha impostato più colori. */
    pageBgGradient: string | null;
    heroBgColor: string;
    heroOverlayOpacity: number;
    goToMenu: () => void;
    goToTakeaway: () => void;
    scrollTo: (id: string) => void;
    navigate: (path: string) => void;
}

const TemplateLanding: React.FC<LandingProps> = (p) => {
    const { look } = useMenuLook();
    const centered = look.align === 'center';
    const wrap = `${look.width === 'narrow' ? 'max-w-3xl' : 'max-w-6xl'} mx-auto px-5 md:px-8`;
    const visibleCats = p.categories.filter(c => c.id > 0 && c.available);
    const hasSocial = p.instagramUrl.length > 5 || p.facebookUrl.length > 5 || p.tiktokUrl.length > 5;

    const navItems: [string, string][] = [
        ...(visibleCats.length > 0 ? [['Menù', 'categories'] as [string, string]] : []),
        ['Dove siamo', 'info'],
        ...(p.showBooking ? [['Prenota', 'prenota'] as [string, string]] : []),
    ];

    // ── Intestazione ───────────────────────────────────────────────────────
    const heroDark = isDarkColor(p.heroBgColor);
    const heroText = heroDark ? '#ffffff' : '#141414';

    const ctas = (onPhoto: boolean) => (
        <div className={`flex flex-col sm:flex-row flex-wrap gap-3 mt-8 ${centered ? 'sm:justify-center' : ''}`}>
            <Btn onClick={p.goToMenu}>Sfoglia il menù</Btn>
            {p.showBooking && (
                onPhoto
                    ? <Btn variant="ghost" ghostColor={heroText} onClick={() => p.scrollTo('prenota')}>Prenota un tavolo</Btn>
                    : <Btn variant="secondary" onClick={() => p.scrollTo('prenota')}>Prenota un tavolo</Btn>
            )}
            <Btn variant="ghost" ghostColor={onPhoto ? heroText : undefined} onClick={p.goToTakeaway}>Asporto</Btn>
        </div>
    );

    const facts = [p.address, p.hours].filter(Boolean);

    const hero = look.hero === 'overlay' ? (
        <section className="relative overflow-hidden" style={{ backgroundColor: p.heroBgColor, minHeight: 'min(82vh, 700px)' }}>
            {p.heroImg && (
                <>
                    <img src={p.heroImg} alt="" className="absolute inset-0 w-full h-full object-cover menu-hero-img" />
                    <div className="absolute inset-0" style={{ backgroundColor: p.heroBgColor, opacity: p.heroOverlayOpacity }} />
                </>
            )}
            <div className={`relative ${wrap} flex flex-col justify-end ${centered ? 'text-center items-center' : ''}`} style={{ minHeight: 'min(82vh, 700px)', paddingTop: 96, paddingBottom: 56 }}>
                {facts.length > 0 && (
                    <p className="menu-label" style={{ color: heroText, opacity: 0.85 }}>{facts.join('  ·  ')}</p>
                )}
                <h1
                    className="menu-h mt-3"
                    style={{
                        color: heroText,
                        fontSize: 'clamp(3rem, 15vw, 7.5rem)',
                        lineHeight: 0.95,
                        textShadow: p.heroImg && heroDark ? '0 1px 18px rgba(0,0,0,0.35)' : 'none',
                    }}
                >
                    {p.name}
                </h1>
                {p.description && (
                    <p className="mt-4 max-w-xl" style={{ color: heroText, opacity: 0.9, fontSize: 'clamp(1rem, 3.6vw, 1.25rem)', lineHeight: 1.45 }}>
                        {p.description}
                    </p>
                )}
                {ctas(true)}
            </div>
        </section>
    ) : (
        <>
            <section className={`${wrap} pt-12 md:pt-20 pb-10 ${centered ? 'text-center' : ''}`}>
                {p.logoImg && (
                    <img
                        src={p.logoImg}
                        alt=""
                        className={`w-16 h-16 object-cover mb-6 ${centered ? 'mx-auto' : ''}`}
                        style={{ borderRadius: 'var(--menu-radius)' }}
                    />
                )}
                {facts.length > 0 && <p className="menu-label">{facts.join('  ·  ')}</p>}
                <h1 className="menu-h mt-3" style={{ fontSize: 'clamp(3rem, 14vw, 6.5rem)', lineHeight: 0.95, textAlign: centered ? 'center' : 'left' }}>
                    {p.name}
                </h1>
                <MenuRule className={`mt-7 mb-6 ${centered ? 'mx-auto' : ''}`} style={{ maxWidth: centered ? 360 : undefined }} />
                {p.description && (
                    <p
                        className={`max-w-xl ${centered ? 'mx-auto' : ''}`}
                        style={{ color: 'var(--menu-muted)', fontSize: 'clamp(1.05rem, 3.8vw, 1.3rem)', lineHeight: 1.5, fontStyle: 'italic' }}
                    >
                        {p.description}
                    </p>
                )}
                {ctas(false)}
            </section>
            {p.heroImg && (
                <figure className={`${wrap} pb-4`}>
                    <div className="relative overflow-hidden" style={{ aspectRatio: '16 / 9', borderRadius: 'var(--menu-radius)', backgroundColor: p.heroBgColor }}>
                        <img src={p.heroImg} alt="" className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                </figure>
            )}
        </>
    );

    // ── Striscia categorie ─────────────────────────────────────────────────
    const strip = p.showTicker && visibleCats.length > 0 && (
        look.ticker === 'marquee' ? (
            <div className="overflow-hidden py-3" style={{ background: 'var(--menu-secondary)', color: 'var(--menu-secondary-text)' }} aria-hidden="true">
                <div className="whitespace-nowrap inline-flex menu-marquee">
                    {[...visibleCats, ...visibleCats, ...visibleCats, ...visibleCats].map((c, i) => (
                        <span key={i} className="menu-h inline-flex items-center" style={{ color: 'inherit', fontSize: '1.15rem', padding: '0 18px' }}>
                            {c.name}
                            <span style={{ marginLeft: 36, opacity: 0.5 }}>/</span>
                        </span>
                    ))}
                </div>
            </div>
        ) : (
            <nav aria-label="Categorie" className={`${wrap} py-5`}>
                <ul className={`flex flex-wrap gap-x-1 gap-y-1 ${centered ? 'justify-center' : ''}`}>
                    {visibleCats.map((c, i) => (
                        <li key={c.id} className="flex items-center">
                            {i > 0 && <span aria-hidden="true" style={{ color: 'var(--menu-rule)', padding: '0 4px' }}>·</span>}
                            <button
                                type="button"
                                onClick={() => p.navigate(`/${p.localname}/Products/${c.id}`)}
                                className="menu-focus"
                                style={{ minHeight: 40, padding: '0 6px', fontSize: '0.92rem', color: 'var(--menu-text)', fontFamily: 'var(--menu-font-body)' }}
                            >
                                {c.name}
                            </button>
                        </li>
                    ))}
                </ul>
            </nav>
        )
    );

    return (
        <div className="menu-page min-h-screen overflow-x-hidden" style={p.pageBgGradient ? { background: p.pageBgGradient } : undefined}>
            {/* Barra superiore */}
            <header className="sticky top-0 z-40 menu-page" style={{ borderBottom: '1px solid var(--menu-rule)', ...(p.pageBgGradient ? { background: 'var(--menu-bg)' } : {}) }}>
                <div className={`${look.width === 'narrow' ? 'max-w-5xl' : 'max-w-6xl'} mx-auto px-5 md:px-8 h-[60px] flex items-center justify-between gap-4`}>
                    <button
                        type="button"
                        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                        className="menu-focus flex items-center gap-3 min-w-0"
                        aria-label={`${p.name}, torna su`}
                    >
                        {p.logoImg && (
                            <img src={p.logoImg} alt="" className="w-9 h-9 object-cover flex-shrink-0" style={{ borderRadius: 'var(--menu-radius)' }} />
                        )}
                        <span className="menu-h truncate" style={{ fontSize: '1.2rem', lineHeight: 1.2 }}>{p.name}</span>
                    </button>
                    <nav className="flex items-center gap-1" aria-label="Sezioni">
                        {navItems.map(([label, id]) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => p.scrollTo(id)}
                                className="menu-focus hidden md:inline-flex items-center px-3"
                                style={{ minHeight: 44, fontSize: '0.88rem', color: 'var(--menu-text)', fontFamily: 'var(--menu-font-body)' }}
                            >
                                {label}
                            </button>
                        ))}
                        <span className="ml-2">
                            <Btn onClick={p.goToMenu}>Ordina</Btn>
                        </span>
                    </nav>
                </div>
            </header>

            {look.divider === 'checker' && <MenuRule />}

            {hero}
            {strip}

            {/* Perché noi */}
            {p.showWhyUs && (
                <section className={`${wrap} py-12`}>
                    {p.sectionWhyTitle && <SectionTitle title={p.sectionWhyTitle} centered={centered} />}
                    <ul className="grid grid-cols-2 md:grid-cols-4 gap-x-6">
                        {p.features.map((f, i) => (
                            <li key={i} className={`py-5 ${centered ? 'text-center' : ''}`} style={{ borderTop: '1px solid var(--menu-rule)' }}>
                                <FeatureIcon icon={f.icon} className={`w-5 h-5 ${centered ? 'mx-auto' : ''}`} style={{ color: 'var(--menu-emph)' }} />
                                <p className="menu-h mt-3" style={{ fontSize: '1.12rem', lineHeight: 1.2, textAlign: centered ? 'center' : 'left' }}>{f.title}</p>
                                <p className="mt-1" style={{ color: 'var(--menu-muted)', fontSize: '0.86rem', lineHeight: 1.45 }}>{f.sub}</p>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {/* Menù */}
            {visibleCats.length > 0 && (
                <section id="categories" className={`${wrap} py-12 scroll-mt-16`}>
                    <MenuRule className="mb-10" />
                    <SectionTitle eyebrow="Dalla nostra cucina" title={p.sectionMenuTitle || 'Il menù'} centered={centered} />
                    <ClientCategoriesList
                        categories={p.categories}
                        onSelectCategory={id => p.navigate(`/${p.localname}/Products/${id}`)}
                    />
                    <div className={`mt-8 ${centered ? 'text-center' : ''}`}>
                        <Btn variant="secondary" onClick={p.goToMenu}>Apri il menù completo</Btn>
                    </div>
                </section>
            )}

            {/* Dove siamo */}
            {(p.address || p.hours || p.phone || p.whatsapp || hasSocial) && (
                <section id="info" className={`${wrap} py-12 scroll-mt-16`}>
                    <MenuRule className="mb-10" />
                    <SectionTitle eyebrow="Informazioni" title="Dove siamo" centered={centered} />
                    <dl className={`grid grid-cols-1 sm:grid-cols-2 gap-x-10 ${centered ? 'text-center' : ''}`}>
                        {p.address && (
                            <div className="py-4" style={{ borderTop: '1px solid var(--menu-border)' }}>
                                <dt className={`menu-label flex items-center gap-2 ${centered ? 'justify-center' : ''}`}><MapPin className="w-3.5 h-3.5" aria-hidden="true" /> Indirizzo</dt>
                                <dd className="mt-1.5" style={{ fontSize: '1.02rem' }}>
                                    <a className="menu-focus underline underline-offset-4" style={{ textDecorationColor: 'var(--menu-rule)' }} href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.address)}`} target="_blank" rel="noopener noreferrer">
                                        {p.address}
                                    </a>
                                </dd>
                            </div>
                        )}
                        {p.hours && (
                            <div className="py-4" style={{ borderTop: '1px solid var(--menu-border)' }}>
                                <dt className={`menu-label flex items-center gap-2 ${centered ? 'justify-center' : ''}`}><Clock className="w-3.5 h-3.5" aria-hidden="true" /> Orari</dt>
                                <dd className="mt-1.5" style={{ fontSize: '1.02rem' }}>{p.hours}</dd>
                            </div>
                        )}
                        {p.phone && (
                            <div className="py-4" style={{ borderTop: '1px solid var(--menu-border)' }}>
                                <dt className={`menu-label flex items-center gap-2 ${centered ? 'justify-center' : ''}`}><Phone className="w-3.5 h-3.5" aria-hidden="true" /> Telefono</dt>
                                <dd className="mt-1.5" style={{ fontSize: '1.02rem' }}><a className="menu-focus" href={`tel:${p.phone}`}>{p.phone}</a></dd>
                            </div>
                        )}
                        {p.whatsapp && (
                            <div className="py-4" style={{ borderTop: '1px solid var(--menu-border)' }}>
                                <dt className={`menu-label flex items-center gap-2 ${centered ? 'justify-center' : ''}`}><MessageCircle className="w-3.5 h-3.5" aria-hidden="true" /> WhatsApp</dt>
                                <dd className="mt-1.5" style={{ fontSize: '1.02rem' }}>
                                    <a className="menu-focus" href={`https://wa.me/${p.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">{p.whatsapp}</a>
                                </dd>
                            </div>
                        )}
                    </dl>
                    {hasSocial && (
                        <div className={`mt-6 flex flex-wrap gap-2 ${centered ? 'justify-center' : ''}`}>
                            {p.instagramUrl.length > 5 && <a className="menu-focus inline-flex items-center gap-2 px-4" style={{ minHeight: 44, border: '1px solid var(--menu-rule)', borderRadius: 'var(--menu-radius)', fontSize: '0.9rem' }} href={p.instagramUrl} target="_blank" rel="noopener noreferrer"><IgIcon /> Instagram</a>}
                            {p.facebookUrl.length > 5 && <a className="menu-focus inline-flex items-center gap-2 px-4" style={{ minHeight: 44, border: '1px solid var(--menu-rule)', borderRadius: 'var(--menu-radius)', fontSize: '0.9rem' }} href={p.facebookUrl} target="_blank" rel="noopener noreferrer"><FbIcon /> Facebook</a>}
                            {p.tiktokUrl.length > 5 && <a className="menu-focus inline-flex items-center gap-2 px-4" style={{ minHeight: 44, border: '1px solid var(--menu-rule)', borderRadius: 'var(--menu-radius)', fontSize: '0.9rem' }} href={p.tiktokUrl} target="_blank" rel="noopener noreferrer"><TkIcon /> TikTok</a>}
                        </div>
                    )}
                </section>
            )}

            {/* Prenota */}
            {p.showBooking && (
                <section id="prenota" className={`${look.width === 'narrow' ? 'max-w-2xl' : 'max-w-3xl'} mx-auto px-5 md:px-8 py-12 scroll-mt-16`}>
                    <MenuRule className="mb-10" />
                    <SectionTitle eyebrow="Prenotazioni" title={p.sectionBookingTitle || 'Prenota un tavolo'} centered={centered} />
                    <p className={`-mt-4 mb-6 ${centered ? 'text-center' : ''}`} style={{ color: 'var(--menu-muted)', fontSize: '0.92rem' }}>
                        Compila il modulo: ti ricontattiamo per confermare.
                    </p>
                    <div
                        className="p-5 md:p-8"
                        style={{
                            background: 'var(--menu-card)',
                            border: look.cardBorder === 'heavy' ? '2px solid var(--menu-text)' : '1px solid var(--menu-border)',
                            borderRadius: 'var(--menu-radius)',
                            boxShadow: look.offsetShadow ? '5px 5px 0 var(--menu-text)' : 'none',
                        }}
                    >
                        <BookingForm localname={p.localname} />
                    </div>
                </section>
            )}

            {/* Piede */}
            <footer className="mt-8">
                <MenuRule />
                <div className={`${wrap} py-10 ${centered ? 'text-center' : ''}`}>
                    <p className="menu-h" style={{ fontSize: '1.6rem', textAlign: centered ? 'center' : 'left' }}>{p.name}</p>
                    {(p.address || p.phone) && (
                        <p className="mt-2" style={{ color: 'var(--menu-muted)', fontSize: '0.88rem' }}>
                            {[p.address, p.phone].filter(Boolean).join('  ·  ')}
                        </p>
                    )}
                    <p className="mt-6" style={{ color: 'var(--menu-muted)', fontSize: '0.75rem' }}>
                        © {new Date().getFullYear()} {p.name} · Powered by AxiomGroup
                    </p>
                </div>
            </footer>
        </div>
    );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const VenueLandingPage: React.FC = () => {
    const { loading, categoriesMap } = useData();
    const styles = usePreviewStyles(); // merged con draftTheme quando dentro iframe preview
    const { localname } = useParams<{ localname: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        const tableId = searchParams.get('table');
        if (tableId) navigate(`/${localname}/Categories?table=${tableId}`, { replace: true });
    }, [searchParams, navigate, localname]);

    if (loading) return <CustomLoading />;

    const eff: any = styles || {};
    const def = getTemplateDef(eff.landingTemplate);

    const name        = eff.restaurantName || localname || 'Ristorante';
    const heroImg     = eff.heroImageUrl && eff.heroImageUrl !== 'DELETE' ? (eff.heroImageUrl.startsWith?.('blob:') ? eff.heroImageUrl : resolveImageUrl(eff.heroImageUrl, '')) : '';
    const logoImg     = eff.logoUrl && eff.logoUrl !== 'DELETE' ? (eff.logoUrl.startsWith?.('blob:') ? eff.logoUrl : resolveImageUrl(eff.logoUrl, '')) : '';

    let rawFeatures = eff.features;
    if (typeof rawFeatures === 'string') {
        try { rawFeatures = JSON.parse(rawFeatures); } catch { rawFeatures = undefined; }
    }
    const features: FeatureCard[] = (rawFeatures as FeatureCard[] | undefined)?.length ? rawFeatures as FeatureCard[] : DEFAULT_FEATURES;

    const categories = Array.from(categoriesMap.values()).filter(c => c.available);

    // backgroundGradient può arrivare come array (state in memoria) o come stringa "a;b;c"
    // (da backend). Con un solo colore il fondo lo gestiscono i token del tema.
    let bgArr: string[] = [];
    const bgRaw: any = eff.backgroundGradient;
    if (Array.isArray(bgRaw)) bgArr = bgRaw.filter(Boolean);
    else if (typeof bgRaw === 'string' && bgRaw) bgArr = bgRaw.split(';').filter(Boolean);
    const pageBgGradient = bgArr.length > 1 ? `linear-gradient(to bottom, ${bgArr.join(', ')})` : null;

    const heroBgColor = eff.heroBgColor || def.palette.heroBg;
    const heroOverlayOpacity = typeof eff.heroOverlayOpacity === 'number'
        ? Math.max(0, Math.min(1, eff.heroOverlayOpacity))
        : def.palette.heroOverlay;

    // Navigazione interna abilitata anche dentro l'iframe: così dalla preview puoi
    // cliccare "Sfoglia il menù" e atterrare su /Categories / Products mantenendo lo
    // stesso draftTheme via postMessage (vedi MenuThemeProvider + usePreviewStyles).
    const goToMenu     = () => navigate(`/${localname}/Categories`);
    const goToTakeaway = () => { localStorage.removeItem('rf_table_id'); navigate(`/${localname}/Categories`); };
    const scrollTo     = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

    return (
        <TemplateLanding
            name={name}
            heroImg={heroImg}
            logoImg={logoImg}
            description={(eff.description as string) || ''}
            hours={(eff.openingHours as string) || ''}
            whatsapp={(eff.whatsapp as string) || ''}
            tiktokUrl={(eff.tiktokUrl as string) || ''}
            categories={categories}
            features={features}
            sectionMenuTitle={eff.sectionMenuTitle || ''}
            sectionBookingTitle={eff.sectionBookingTitle || ''}
            sectionWhyTitle={eff.sectionWhyTitle || ''}
            showWhyUs={eff.showWhyUs ?? true}
            showBooking={eff.showBooking ?? true}
            showTicker={eff.showTicker ?? true}
            localname={localname || ''}
            address={eff.address || ''}
            phone={eff.phone || ''}
            instagramUrl={eff.instagramUrl || ''}
            facebookUrl={eff.facebookUrl || ''}
            pageBgGradient={pageBgGradient}
            heroBgColor={heroBgColor}
            heroOverlayOpacity={heroOverlayOpacity}
            goToMenu={goToMenu}
            goToTakeaway={goToTakeaway}
            scrollTo={scrollTo}
            navigate={navigate}
        />
    );
};

export default VenueLandingPage;
