import React, { useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { sendContactRequestApi } from '../Utilities/contactApi';
import { CONTACT_EMAIL } from './brand';

/** Deve coincidere con ContactService.VENUE_TYPES nel backend. */
export const VENUE_TYPES = [
    'Ristorante', 'Pizzeria', 'Bar', 'Pub / Birreria', 'Cocktail bar', 'Trattoria / Osteria',
    'Caffè / Pasticceria', 'Street food', 'Sushi / Etnico', 'Altro',
] as const;

type Fields = {
    name: string;
    venueName: string;
    email: string;
    phone: string;
    venueType: string;
    message: string;
    privacyAccepted: boolean;
    website: string; // honeypot
};

type Errors = Partial<Record<keyof Fields, string>>;

const EMPTY: Fields = {
    name: '', venueName: '', email: '', phone: '', venueType: '', message: '', privacyAccepted: false, website: '',
};

const EMAIL_RE = /^[^\s@<>()[\],;:"]+@[^\s@<>()[\],;:"]+\.[^\s@<>()[\],;:"]{2,}$/;
const PHONE_RE = /^[0-9+()./\-\s]{6,30}$/;

function validate(f: Fields): Errors {
    const e: Errors = {};
    if (!f.name.trim()) e.name = 'Inserisci il tuo nome';
    else if (f.name.trim().length > 100) e.name = 'Massimo 100 caratteri';
    if (!f.venueName.trim()) e.venueName = 'Inserisci il nome del locale';
    else if (f.venueName.trim().length > 150) e.venueName = 'Massimo 150 caratteri';
    if (!f.email.trim()) e.email = "Inserisci l'email";
    else if (!EMAIL_RE.test(f.email.trim()) || f.email.trim().length > 254) e.email = 'Email non valida';
    if (f.phone.trim() && !PHONE_RE.test(f.phone.trim())) e.phone = 'Numero non valido';
    if (!f.venueType) e.venueType = 'Scegli il tipo di locale';
    if (f.message.trim().length < 10) e.message = 'Scrivi almeno qualche parola (10 caratteri)';
    else if (f.message.length > 4000) e.message = 'Massimo 4000 caratteri';
    if (!f.privacyAccepted) e.privacyAccepted = "Serve il consenso per poterti ricontattare";
    return e;
}

const ORDER: (keyof Fields)[] = ['name', 'venueName', 'email', 'phone', 'venueType', 'message', 'privacyAccepted'];

const ContactForm: React.FC = () => {
    const uid = useId();
    const id = (k: string) => `${uid}-${k}`;
    const [fields, setFields] = useState<Fields>(EMPTY);
    const [errors, setErrors] = useState<Errors>({});
    const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
    const [serverMessage, setServerMessage] = useState('');
    const formRef = useRef<HTMLFormElement>(null);
    const successRef = useRef<HTMLDivElement>(null);

    const set = <K extends keyof Fields>(k: K, v: Fields[K]) => {
        setFields(prev => ({ ...prev, [k]: v }));
        if (errors[k]) setErrors(prev => ({ ...prev, [k]: undefined }));
    };

    const onSubmit = async (ev: React.FormEvent) => {
        ev.preventDefault();
        if (status === 'sending') return;
        const errs = validate(fields);
        setErrors(errs);
        const first = ORDER.find(k => errs[k]);
        if (first) {
            formRef.current?.querySelector<HTMLElement>(`#${CSS.escape(id(first))}`)?.focus();
            return;
        }
        setStatus('sending');
        setServerMessage('');
        const res = await sendContactRequestApi({
            name: fields.name.trim(),
            venueName: fields.venueName.trim(),
            email: fields.email.trim(),
            phone: fields.phone.trim(),
            venueType: fields.venueType,
            message: fields.message.trim(),
            privacyAccepted: fields.privacyAccepted,
            website: fields.website,
        });
        if (res.success) {
            setStatus('sent');
            setFields(EMPTY);
            requestAnimationFrame(() => successRef.current?.focus());
        } else {
            setStatus('error');
            const fallback = res.status === 429
                ? 'Hai inviato troppe richieste. Riprova più tardi.'
                : 'Invio non riuscito. Riprova tra poco.';
            setServerMessage(res.status > 0 && res.message ? res.message : fallback);
        }
    };

    if (status === 'sent') {
        return (
            <div ref={successRef} tabIndex={-1} role="status" className="border-[1.5px] border-[var(--ink)] bg-[var(--card)] p-6 sm:p-8">
                <div className="eyebrow">Richiesta inviata</div>
                <p className="f-display text-[28px] leading-tight mt-2">Grazie, ti rispondiamo a breve.</p>
                <p className="mt-3 text-[var(--ink-2)]">
                    Abbiamo ricevuto il tuo messaggio. Ti scriviamo all'indirizzo che ci hai lasciato
                    (o ti chiamiamo, se hai indicato un numero).
                </p>
                <button type="button" className="btn btn-ghost mt-6" onClick={() => setStatus('idle')}>
                    Invia un'altra richiesta
                </button>
            </div>
        );
    }

    const label = 'block text-[14px] font-semibold mb-1.5';
    const errText = 'mt-1.5 text-[13px] font-medium text-[var(--accent)]';
    const describedBy = (k: keyof Fields) => (errors[k] ? id(`${k}-err`) : undefined);

    return (
        <form ref={formRef} onSubmit={onSubmit} noValidate className="relative grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
            <div>
                <label htmlFor={id('name')} className={label}>Nome e cognome</label>
                <input id={id('name')} className="field" autoComplete="name" value={fields.name}
                       onChange={e => set('name', e.target.value)} maxLength={100}
                       aria-invalid={!!errors.name} aria-describedby={describedBy('name')} />
                {errors.name && <p id={id('name-err')} className={errText}>{errors.name}</p>}
            </div>
            <div>
                <label htmlFor={id('venueName')} className={label}>Nome del locale</label>
                <input id={id('venueName')} className="field" autoComplete="organization" value={fields.venueName}
                       onChange={e => set('venueName', e.target.value)} maxLength={150}
                       aria-invalid={!!errors.venueName} aria-describedby={describedBy('venueName')} />
                {errors.venueName && <p id={id('venueName-err')} className={errText}>{errors.venueName}</p>}
            </div>
            <div>
                <label htmlFor={id('email')} className={label}>Email</label>
                <input id={id('email')} type="email" inputMode="email" className="field" autoComplete="email" value={fields.email}
                       onChange={e => set('email', e.target.value)} maxLength={254}
                       aria-invalid={!!errors.email} aria-describedby={describedBy('email')} />
                {errors.email && <p id={id('email-err')} className={errText}>{errors.email}</p>}
            </div>
            <div>
                <label htmlFor={id('phone')} className={label}>
                    Telefono <span className="font-normal text-[var(--muted)]">(facoltativo)</span>
                </label>
                <input id={id('phone')} type="tel" inputMode="tel" className="field" autoComplete="tel" value={fields.phone}
                       onChange={e => set('phone', e.target.value)} maxLength={30}
                       aria-invalid={!!errors.phone} aria-describedby={describedBy('phone')} />
                {errors.phone && <p id={id('phone-err')} className={errText}>{errors.phone}</p>}
            </div>
            <div className="sm:col-span-2">
                <label htmlFor={id('venueType')} className={label}>Tipo di locale</label>
                <select id={id('venueType')} className="field"
                        value={fields.venueType} onChange={e => set('venueType', e.target.value)}
                        aria-invalid={!!errors.venueType} aria-describedby={describedBy('venueType')}>
                    <option value="" disabled>Seleziona…</option>
                    {VENUE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                {errors.venueType && <p id={id('venueType-err')} className={errText}>{errors.venueType}</p>}
            </div>
            <div className="sm:col-span-2">
                <label htmlFor={id('message')} className={label}>Messaggio</label>
                <textarea id={id('message')} className="field min-h-[140px] resize-y" value={fields.message}
                          onChange={e => set('message', e.target.value)} maxLength={4000}
                          placeholder="Raccontaci il locale: quanti tavoli, se fate asporto, che stampanti usate, cosa vorreste migliorare…"
                          aria-invalid={!!errors.message} aria-describedby={describedBy('message')} />
                {errors.message && <p id={id('message-err')} className={errText}>{errors.message}</p>}
            </div>

            {/* Honeypot: nascosto a utenti e screen reader */}
            <div className="hp" aria-hidden="true">
                <label htmlFor={id('website')}>Sito web</label>
                <input id={id('website')} tabIndex={-1} autoComplete="off" value={fields.website}
                       onChange={e => set('website', e.target.value)} />
            </div>

            <div className="sm:col-span-2">
                <div className="flex items-start gap-3">
                    <input id={id('privacyAccepted')} type="checkbox" checked={fields.privacyAccepted}
                           onChange={e => set('privacyAccepted', e.target.checked)}
                           className="mt-1 h-[18px] w-[18px] shrink-0 accent-[#1a1713]"
                           aria-invalid={!!errors.privacyAccepted} aria-describedby={describedBy('privacyAccepted')} />
                    <label htmlFor={id('privacyAccepted')} className="text-[14px] leading-snug text-[var(--ink-2)]">
                        Ho letto l'<Link to="/privacy" target="_blank" className="link-u">informativa sulla privacy</Link> e
                        acconsento al trattamento dei miei dati per essere ricontattato.
                    </label>
                </div>
                {errors.privacyAccepted && <p id={id('privacyAccepted-err')} className={errText}>{errors.privacyAccepted}</p>}
            </div>

            <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center gap-4">
                <button type="submit" className="btn btn-ink justify-center disabled:opacity-60" disabled={status === 'sending'}>
                    {status === 'sending' ? 'Invio in corso…' : 'Invia richiesta'}
                    <span aria-hidden="true">→</span>
                </button>
                <p className="text-[13px] text-[var(--muted)]">
                    Oppure scrivici a <a href={`mailto:${CONTACT_EMAIL}`} className="link-u">{CONTACT_EMAIL}</a>
                </p>
            </div>

            <div aria-live="polite" className="sm:col-span-2 empty:hidden">
                {status === 'error' && (
                    <p className="border-l-[3px] border-[var(--accent)] bg-[var(--card)] px-4 py-3 text-[14px]">
                        {serverMessage}
                    </p>
                )}
            </div>
        </form>
    );
};

export default ContactForm;
