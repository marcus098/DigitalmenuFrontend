import React, { useEffect, useRef, useState } from 'react';
import { CheckCircle2, MessageSquare } from 'lucide-react';
import { sendOtpApi, verifyOtpApi } from '../../Utilities/api';
import { useDeliveryT } from '../../Client/delivery/deliveryI18n';
import { getPhoneToken, normalizePhone, savePhoneToken } from '../../Client/delivery/deliveryUtils';

const RESEND_SECONDS = 60;

interface Props {
    localname: string;
    name: string;
    phone: string;
    onNameChange: (v: string) => void;
    onPhoneChange: (v: string) => void;
    /**
     * token per il numero corrente (E.164), null se non (più) verificato.
     * Con verify={false} il token è sempre null e phoneE164 è il numero normalizzato (null se non valido).
     */
    onToken: (token: string | null, phoneE164: string | null) => void;
    /** false = verifica SMS non attiva sul server: solo nome e telefono, nessun codice */
    verify?: boolean;
    /** testo introduttivo opzionale (es. asporto con OTP richiesto dal locale) */
    intro?: string;
    idPrefix?: string;
}

/**
 * Nome + telefono con verifica SMS (OTP). Chi ha già un phoneToken valido per quel numero
 * (localStorage, 90 giorni) non riceve un nuovo SMS.
 */
const PhoneVerification: React.FC<Props> = ({ localname, name, phone, onNameChange, onPhoneChange, onToken, intro, idPrefix = 'rf-otp', verify: verifyEnabled = true }) => {
    const dt = useDeliveryT();
    const [stage, setStage] = useState<'phone' | 'code' | 'verified'>('phone');
    const [code, setCode] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [cooldown, setCooldown] = useState(0);
    const [sentTo, setSentTo] = useState<string | null>(null);
    const codeRef = useRef<HTMLInputElement>(null);
    const lastVerifyRef = useRef<string>('');

    const e164 = normalizePhone(phone);

    // Numero già verificato su questo dispositivo → niente SMS
    useEffect(() => {
        if (!verifyEnabled) { onToken(null, e164); return; }
        if (stage === 'code' && e164 === sentTo) return;
        const token = e164 ? getPhoneToken(e164) : null;
        if (token) { setStage('verified'); setError(null); onToken(token, e164); }
        else { if (stage === 'verified') setStage('phone'); onToken(null, e164); }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [e164, verifyEnabled]);

    useEffect(() => {
        if (cooldown <= 0) return;
        const t = setTimeout(() => setCooldown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [cooldown]);

    useEffect(() => { if (stage === 'code') codeRef.current?.focus(); }, [stage]);

    const errorFor = (status: number, message?: string, fallback: 'otpError' | 'invalidCode' = 'otpError') => {
        if (status === 429) return message && !message.startsWith('Request failed') ? message : dt('tooMany');
        if (status === 401) return dt('invalidCode');
        // 503: verifica non configurata/non raggiungibile lato server; 422: Prelude ha bloccato l'invio a questo numero
        if (fallback === 'otpError' && status === 503) return dt('otpUnavailable');
        if (status === 422) return dt('otpBlocked');
        if (status === 400 && message && !message.startsWith('Request failed')) return message;
        return dt(fallback);
    };

    const send = async () => {
        setError(null);
        if (!name.trim()) { setError(dt('nameRequired')); return; }
        if (!e164) { setError(dt('invalidPhone')); return; }
        setBusy(true);
        const r = await sendOtpApi(localname, e164);
        setBusy(false);
        if (r.success) {
            setSentTo(e164);
            setStage('code');
            setCode('');
            lastVerifyRef.current = '';
            setCooldown(RESEND_SECONDS);
        } else {
            setError(errorFor(r.status, r.message));
        }
    };

    const verify = async (value = code) => {
        if (!sentTo || value.length !== 6 || busy) return;
        lastVerifyRef.current = value;
        setError(null);
        setBusy(true);
        const r = await verifyOtpApi(localname, sentTo, value);
        setBusy(false);
        if (r.success && r.data?.phoneToken) {
            savePhoneToken(sentTo, r.data.phoneToken, r.data.expiresAt);
            setStage('verified');
            onToken(r.data.phoneToken, sentTo);
        } else {
            setError(errorFor(r.status, r.message, 'invalidCode'));
            setCode('');
            codeRef.current?.focus();
        }
    };

    const onCode = (v: string) => {
        const digits = v.replace(/\D/g, '').slice(0, 6);
        setCode(digits);
        // autofill SMS / incolla: invio automatico appena ci sono 6 cifre
        if (digits.length === 6 && digits !== lastVerifyRef.current) verify(digits);
    };

    // Senza verifica: errore di formato solo dopo aver lasciato il campo (non mentre si scrive)
    const [phoneTouched, setPhoneTouched] = useState(false);
    const phoneInvalid = !verifyEnabled && phoneTouched && phone.trim() !== '' && !e164;

    const labelStyle: React.CSSProperties = { color: 'var(--menu-text)', fontFamily: 'var(--menu-font-body)', fontSize: '0.85rem', fontWeight: 600 };
    const muted: React.CSSProperties = { color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)', fontSize: '0.8rem' };
    const btn: React.CSSProperties = {
        minHeight: 48, borderRadius: 'var(--menu-radius)', background: 'var(--menu-accent)', color: 'var(--menu-accent-text)',
        fontFamily: 'var(--menu-font-body)', fontWeight: 700, padding: '0 18px',
    };
    const linkBtn: React.CSSProperties = { color: 'var(--menu-accent)', fontFamily: 'var(--menu-font-body)', fontSize: '0.85rem', fontWeight: 600, minHeight: 44, padding: '0 4px' };

    return (
        <div className="space-y-3">
            {intro && <p style={muted}>{intro}</p>}
            <div>
                <label htmlFor={`${idPrefix}-name`} style={labelStyle}>{dt('name')} *</label>
                <input
                    id={`${idPrefix}-name`}
                    type="text"
                    autoComplete="name"
                    value={name}
                    onChange={e => onNameChange(e.target.value)}
                    className="dark-input mt-1"
                />
            </div>
            <div>
                <label htmlFor={`${idPrefix}-phone`} style={labelStyle}>{dt('phone')} *</label>
                <div className="flex gap-2 mt-1">
                    <input
                        id={`${idPrefix}-phone`}
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        value={phone}
                        onChange={e => onPhoneChange(e.target.value)}
                        onBlur={() => setPhoneTouched(true)}
                        readOnly={verifyEnabled && stage === 'code'}
                        aria-invalid={phoneInvalid || undefined}
                        aria-describedby={phoneInvalid ? `${idPrefix}-phone-error` : `${idPrefix}-phone-hint`}
                        className="dark-input"
                        placeholder="333 123 4567"
                    />
                    {verifyEnabled && stage === 'verified' && (
                        <span className="flex items-center gap-1 flex-shrink-0 text-green-600 font-semibold" style={{ fontSize: '0.82rem' }}>
                            <CheckCircle2 className="w-5 h-5" aria-hidden="true" /> {dt('verified')}
                        </span>
                    )}
                </div>
                {verifyEnabled && stage === 'phone' && <p id={`${idPrefix}-phone-hint`} className="mt-1" style={muted}>{dt('phoneHint')}</p>}
                {!verifyEnabled && !phoneInvalid && <p id={`${idPrefix}-phone-hint`} className="mt-1" style={muted}>{dt('phoneHintNoSms')}</p>}
                {phoneInvalid && (
                    <p id={`${idPrefix}-phone-error`} role="alert" className="mt-1 text-sm font-semibold" style={{ color: '#dc2626', fontFamily: 'var(--menu-font-body)' }}>
                        {dt('invalidPhone')}
                    </p>
                )}
            </div>

            {verifyEnabled && stage === 'phone' && (
                <button type="button" onClick={send} disabled={busy} className="menu-focus w-full inline-flex items-center justify-center gap-2 disabled:opacity-60" style={btn}>
                    <MessageSquare className="w-4 h-4" aria-hidden="true" />
                    {busy ? dt('sending') : dt('sendCode')}
                </button>
            )}

            {verifyEnabled && stage === 'code' && sentTo && (
                <form
                    className="space-y-2"
                    onSubmit={e => { e.preventDefault(); verify(); }}
                >
                    <p style={muted} aria-live="polite">{dt('codeSentTo', { phone: sentTo })}</p>
                    <label htmlFor={`${idPrefix}-code`} style={labelStyle}>{dt('codeLabel')}</label>
                    <div className="flex gap-2">
                        <input
                            ref={codeRef}
                            id={`${idPrefix}-code`}
                            name="one-time-code"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            pattern="[0-9]{6}"
                            maxLength={6}
                            value={code}
                            onChange={e => onCode(e.target.value)}
                            aria-invalid={!!error}
                            aria-describedby={error ? `${idPrefix}-error` : undefined}
                            className="dark-input text-center tabular-nums"
                            style={{ letterSpacing: '0.4em', fontSize: '1.25rem' }}
                        />
                        <button type="submit" disabled={busy || code.length !== 6} className="menu-focus flex-shrink-0 disabled:opacity-60" style={btn}>
                            {busy ? dt('verifying') : dt('verify')}
                        </button>
                    </div>
                    <div className="flex items-center justify-between flex-wrap">
                        <button type="button" onClick={() => { setStage('phone'); setSentTo(null); setError(null); }} className="menu-focus" style={linkBtn}>
                            {dt('changeNumber')}
                        </button>
                        {cooldown > 0
                            ? <span style={muted} aria-live="off">{dt('resendIn', { s: cooldown })}</span>
                            : <button type="button" onClick={send} disabled={busy} className="menu-focus" style={linkBtn}>{dt('resend')}</button>}
                    </div>
                </form>
            )}

            {error && (
                <p id={`${idPrefix}-error`} role="alert" className="text-sm font-semibold" style={{ color: '#dc2626', fontFamily: 'var(--menu-font-body)' }}>
                    {error}
                </p>
            )}
        </div>
    );
};

export default PhoneVerification;
