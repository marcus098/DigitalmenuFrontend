import React, { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { createReservationPublicApi } from '../../Utilities/api';
import { CategoryDto, FeatureCard } from '../../types';
import { FEATURE_ICON_MAP } from '../../Utilities/featureIcons';
import { localIsoDate } from '../../Utilities/dates';
import { useMenuLook } from '../../Components/Client/MenuThemeProvider';

/**
 * Mattoni condivisi dal sito vetrina pubblico: sia la versione "classica"
 * (VenueLandingPage → TemplateLanding) sia quella a sezioni (SectionsLanding).
 */

// ─── Dati comuni ─────────────────────────────────────────────────────────────

/** Dati del locale già risolti da VenueLandingPage (foto con URL completo, default applicati). */
export interface LandingProps {
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

export const isDarkColor = (hex: string): boolean => {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '');
    if (!m) return true;
    const [r, g, b] = [m[1], m[2], m[3]].map(x => parseInt(x, 16) / 255)
        .map(c => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.4;
};

export const FeatureIcon: React.FC<{ icon: string; className?: string; style?: React.CSSProperties }> = ({ icon, className, style }) => {
    const Cmp = FEATURE_ICON_MAP[icon];
    if (Cmp) return <Cmp className={className} style={style} aria-hidden="true" />;
    // fallback: testo libero (compat con dati vecchi)
    return <span className={className} style={style}>{icon}</span>;
};

export const IgIcon = () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>;
export const FbIcon = () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
export const TkIcon = () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.2 8.2 0 004.79 1.53V6.77a4.85 4.85 0 01-1.02-.08z"/></svg>;

// ─── Bottoni ──────────────────────────────────────────────────────────────────

export type BtnVariant = 'primary' | 'secondary' | 'ghost';

export const Btn: React.FC<{
    variant?: BtnVariant;
    onClick?: () => void;
    type?: 'button' | 'submit';
    disabled?: boolean;
    full?: boolean;
    /** Colore testo/bordo per il ghost (es. bianco sopra una foto). */
    ghostColor?: string;
    /** Se presente il pulsante è un link (https → nuova scheda; tel:/mailto: → stessa scheda). Va già validato. */
    href?: string;
    children: React.ReactNode;
}> = ({ variant = 'primary', onClick, type = 'button', disabled, full, ghostColor, href, children }) => {
    const { look } = useMenuLook();
    const heavy = look.cardBorder === 'heavy' && look.offsetShadow;
    const palette: Record<BtnVariant, React.CSSProperties> = {
        primary:   { background: 'var(--menu-accent)', color: 'var(--menu-accent-text)', border: heavy ? '2px solid var(--menu-text)' : '1px solid var(--menu-accent)' },
        secondary: { background: 'var(--menu-secondary)', color: 'var(--menu-secondary-text)', border: heavy ? '2px solid var(--menu-text)' : '1px solid var(--menu-secondary)' },
        ghost:     { background: 'transparent', color: ghostColor || 'var(--menu-text)', border: `1px solid ${ghostColor || 'var(--menu-rule)'}` },
    };
    const className = `menu-focus inline-flex items-center justify-center gap-2 transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60 ${full ? 'w-full' : ''}`;
    const style: React.CSSProperties = {
        ...palette[variant],
        minHeight: 48,
        padding: '0 22px',
        // --lp-btn-radius: forma dei pulsanti scelta nel sito a sezioni (assente = come il template)
        borderRadius: 'var(--lp-btn-radius, var(--menu-radius))',
        fontFamily: 'var(--menu-font-body)',
        fontSize: '0.86rem',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        textDecoration: 'none',
        boxShadow: heavy && variant !== 'ghost' ? '3px 3px 0 var(--menu-text)' : 'none',
    };
    if (href) {
        const external = href.startsWith('https://');
        return (
            <a href={href} className={className} style={style} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                {children}
            </a>
        );
    }
    return (
        <button type={type} onClick={onClick} disabled={disabled} className={className} style={style}>
            {children}
        </button>
    );
};

export const SectionTitle: React.FC<{ eyebrow?: string; title: string; centered: boolean }> = ({ eyebrow, title, centered }) => (
    <div className={`mb-8 ${centered ? 'text-center' : ''}`}>
        {eyebrow && <p className="menu-label" style={{ color: 'var(--menu-emph)' }}>{eyebrow}</p>}
        <h2 className="menu-h mt-2" style={{ fontSize: 'clamp(1.9rem, 7vw, 3rem)', textAlign: centered ? 'center' : 'left' }}>
            {title}
        </h2>
    </div>
);

// ─── Prenotazione ─────────────────────────────────────────────────────────────

export const Field: React.FC<{ id: string; label: string; children: React.ReactNode }> = ({ id, label, children }) => (
    <div>
        <label htmlFor={id} className="menu-label block mb-1.5">{label}</label>
        {children}
    </div>
);

export const BookingForm: React.FC<{ localname: string }> = ({ localname }) => {
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
                    <input id="bk-date" required type="date" value={form.date} onChange={set('date')} min={localIsoDate()} className="dark-input" style={inputStyle} />
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
