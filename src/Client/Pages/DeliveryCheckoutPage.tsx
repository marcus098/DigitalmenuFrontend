import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Bike, Check, CreditCard, Crosshair, MapPin, Search, ShoppingBasket, Wallet, Banknote, AlertTriangle } from 'lucide-react';
import { useData } from '../../Context/DataContext';
import { useNotification } from '../../Context/NotificationContext';
import CustomLoading from '../../Components/CustomLoading';
import ClientStickyHeader from '../../Components/Client/ClientStickyHeader';
import AllergenModal from '../../Components/Client/AllergenModal';
import PhoneVerification from '../../Components/Client/PhoneVerification';
import { MenuRule } from '../../Components/Client/MenuPrimitives';
import useCartCount from '../../Utilities/useCartCount';
import useDeliverySettings from '../../Hooks/useDeliverySettings';
import { CART_UPDATED_EVENT, cartToAddComandOrders, emptyCart, getCartMap } from '../../Utilities/Utilities';
import { CartLine } from '../../Utilities/variants';
import {
    getPublicDeliverySlotsApi, getPublicPaymentsConfigApi, getPublicTakeawayStatusApi,
    publicGeoReverseApi, publicGeoSearchApi, sendDeliveryOrderApi, type Slot,
} from '../../Utilities/api';
import { localIsoDate } from '../../Utilities/dates';
import type { DeliveryAddress, DeliveryPaymentChoice, GeoResult } from '../../deliveryTypes';
import { PublicPaymentsConfig } from '../../types';
import { formatCents, useDeliveryT } from '../delivery/deliveryI18n';
import {
    forgetPhoneToken, formatKm, loadDeliveryDraft, phoneVerificationOn, quoteDelivery, saveDeliveryDraft, saveOrderAddress, setOrderChannel,
} from '../delivery/deliveryUtils';
import SlotPicker from '../../Components/Client/SlotPicker';

const DeliveryMap = lazy(() => import('../delivery/DeliveryMap'));

type Step = 1 | 2 | 3;

/** "Via Milano 12, Brescia" dai campi della geocodifica inversa, altrimenti l'etichetta intera. */
const shortLabel = (g: GeoResult): string => {
    if (g.street) {
        const line = [g.street, g.houseNumber].filter(Boolean).join(' ');
        return [line, g.city].filter(Boolean).join(', ');
    }
    return g.label;
};

const DeliveryCheckoutPage: React.FC = () => {
    const { localname = '' } = useParams();
    const navigate = useNavigate();
    const dt = useDeliveryT();
    const { addNotification } = useNotification();
    const { loading, styles, setSelectedAllergens, menuLang, productsMap } = useData();
    const cartCount = useCartCount();
    const { settings, loading: settingsLoading, deliveryEnabled } = useDeliverySettings(localname);

    const draft = useMemo(() => loadDeliveryDraft(localname), [localname]);
    const [step, setStep] = useState<Step>(1);
    const [cart, setCart] = useState<CartLine[]>([]);
    const [isAllergenModalOpen, setIsAllergenModalOpen] = useState(false);

    // Passo 1 — indirizzo
    const [address, setAddress] = useState<DeliveryAddress | null>(draft.address ?? null);
    const [labelFromReverse, setLabelFromReverse] = useState(false);
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<GeoResult[] | null>(null);
    const [searching, setSearching] = useState(false);
    const [locating, setLocating] = useState(false);
    const [geoMessage, setGeoMessage] = useState<string | null>(null);

    // Passo 2 — contatto
    const [name, setName] = useState(draft.name ?? '');
    const [phone, setPhone] = useState(draft.phone ?? '');
    const [phoneToken, setPhoneToken] = useState<string | null>(null);
    const [phoneE164, setPhoneE164] = useState<string | null>(null);
    const [contactError, setContactError] = useState<string | null>(null);
    // Verifica SMS non attiva sul server: basta nome + telefono valido (niente codice, niente phoneToken)
    const smsVerification = phoneVerificationOn(settings);
    const contactOk = !!name.trim() && !!phoneE164 && (!smsVerification || !!phoneToken);

    // Passo 3 — orario, pagamento, invio
    const [days, setDays] = useState<{ date: string; label: string; slots: Slot[] }[]>([]);
    const [slotsLoading, setSlotsLoading] = useState(true);
    const [paused, setPaused] = useState(false);
    const [time, setTime] = useState('');
    const [payment, setPayment] = useState<DeliveryPaymentChoice | null>(null);
    const [paymentsConfig, setPaymentsConfig] = useState<PublicPaymentsConfig | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    const headingRef = useRef<HTMLHeadingElement>(null);
    const firstRender = useRef(true);

    useEffect(() => {
        const read = () => setCart(Object.values(getCartMap() ?? {}));
        read();
        window.addEventListener(CART_UPDATED_EVENT, read);
        return () => window.removeEventListener(CART_UPDATED_EVENT, read);
    }, []);

    useEffect(() => { saveDeliveryDraft(localname, { address, name, phone }); }, [localname, address, name, phone]);

    // Focus sul titolo a ogni cambio di passo (lettori di schermo + tastiera)
    useEffect(() => {
        if (firstRender.current) { firstRender.current = false; return; }
        headingRef.current?.focus();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [step]);

    useEffect(() => {
        if (!localname) return;
        getPublicPaymentsConfigApi(localname).then(r => { if (r.success && r.data) setPaymentsConfig(r.data); });
    }, [localname]);

    const subtotalCents = useMemo(() => Math.round(cart.reduce((s, i) => s + i.price * i.quantity, 0) * 100), [cart]);
    const quote = useMemo(
        () => (settings ? quoteDelivery(settings, address, subtotalCents) : null),
        [settings, address, subtotalCents],
    );

    // Metodi di pagamento ammessi dal locale
    const paymentOptions: DeliveryPaymentChoice[] = useMemo(() => {
        if (!settings) return [];
        if (Array.isArray(settings.paymentOptions)) return settings.paymentOptions;
        const onDelivery = (settings.onDeliveryMethods ?? []) as DeliveryPaymentChoice[];
        if (settings.paymentMode === 'ONLINE_REQUIRED') return ['ONLINE'];
        if (settings.paymentMode === 'ON_DELIVERY_ONLY') return onDelivery;
        const online = paymentsConfig && !paymentsConfig.enabled ? [] : (['ONLINE'] as DeliveryPaymentChoice[]);
        return [...online, ...onDelivery];
    }, [settings, paymentsConfig]);

    useEffect(() => {
        if (payment && paymentOptions.includes(payment)) return;
        setPayment(paymentOptions[0] ?? null);
    }, [paymentOptions, payment]);

    // Fasce di consegna (oggi + 2 giorni) quando si arriva al passo 3
    useEffect(() => {
        if (step !== 3 || !localname) return;
        let cancelled = false;
        (async () => {
            setSlotsLoading(true);
            const st = await getPublicTakeawayStatusApi(localname);
            if (cancelled) return;
            setPaused(!!settings?.paused || !!(st.success && st.data?.paused));
            const locale = menuLang === 'zh' ? 'zh-CN' : menuLang || 'it';
            const list = [0, 1, 2].map(d => {
                const x = new Date();
                x.setDate(x.getDate() + d);
                return {
                    iso: localIsoDate(x),
                    label: d === 0 ? dt('today') : d === 1 ? dt('tomorrow') : x.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'short' }),
                };
            });
            const res = await Promise.all(list.map(async d => {
                const r = await getPublicDeliverySlotsApi(localname, d.iso);
                return { date: d.iso, label: d.label, slots: (r.success && Array.isArray(r.data) ? r.data : []) };
            }));
            if (cancelled) return;
            setDays(res
                .map(r => ({ ...r, slots: r.slots.filter(s => s.status === 'AVAILABLE' || s.status === 'ON_REQUEST') }))
                .filter(r => r.slots.length > 0));
            setSlotsLoading(false);
        })();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [step, localname, menuLang]);

    // ── Indirizzo ────────────────────────────────────────────────────────────
    const applyGeo = (g: GeoResult, fromReverse: boolean) => {
        setAddress(a => ({ ...(a ?? {}), label: shortLabel(g), lat: g.lat, lng: g.lng }));
        setLabelFromReverse(fromReverse);
        setResults(null);
        setGeoMessage(null);
    };

    const useMyLocation = () => {
        setGeoMessage(null);
        if (!('geolocation' in navigator)) { setGeoMessage(dt('geoDenied')); return; }
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            async pos => {
                const { latitude: lat, longitude: lng } = pos.coords;
                const r = await publicGeoReverseApi(localname, lat, lng);
                setLocating(false);
                if (r.success && r.data) applyGeo({ ...r.data, lat, lng }, true);
                else applyGeo({ label: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, lat, lng }, false);
            },
            () => { setLocating(false); setGeoMessage(dt('geoDenied')); },
            { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
        );
    };

    const runSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        const q = query.trim();
        if (q.length < 3 || searching) return;
        setSearching(true);
        setGeoMessage(null);
        const r = await publicGeoSearchApi(localname, q);
        setSearching(false);
        if (!r.success) { setResults(null); setGeoMessage(dt('searchError')); return; }
        const list = r.data ?? [];
        setResults(list);
        if (list.length === 1) applyGeo(list[0], false);
        else if (list.length === 0) setGeoMessage(dt('noResults'));
    };

    const onPinMove = async (lat: number, lng: number) => {
        setAddress(a => (a ? { ...a, lat, lng } : { label: '', lat, lng }));
        if (labelFromReverse) {
            const r = await publicGeoReverseApi(localname, lat, lng);
            if (r.success && r.data) setAddress(a => (a ? { ...a, label: shortLabel(r.data!) } : a));
        }
    };

    const addressOk = !!address && address.label.trim().length > 2 && !!quote && !quote.outOfZone && !quote.belowMinimum;

    const goTakeaway = () => { setOrderChannel(localname, 'TAKEAWAY'); navigate(`/${localname}/cart`); };

    // ── Invio ────────────────────────────────────────────────────────────────
    const submit = async () => {
        setSubmitError(null);
        if (!address || !contactOk || !phoneE164 || !payment || !time) return;
        setSubmitting(true);
        const r = await sendDeliveryOrderApi(localname, {
            customerName: name.trim(),
            customerPhone: phoneE164,
            ...(smsVerification && phoneToken ? { phoneToken } : {}),
            address: {
                label: address.label.trim(), lat: address.lat, lng: address.lng,
                intercom: address.intercom?.trim() || undefined,
                floor: address.floor?.trim() || undefined,
                notes: address.notes?.trim() || undefined,
            },
            deliveryTime: time,
            paymentChoice: payment,
            orders: cartToAddComandOrders(cart),
        });
        setSubmitting(false);
        if (r.success && r.data) {
            saveOrderAddress(r.data.id, address);
            emptyCart();
            window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
            navigate(r.data.paymentRequired ? `/${localname}/payment/${r.data.id}` : `/${localname}/order-status/${r.data.id}`);
            return;
        }
        const serverMsg = r.message && !r.message.startsWith('Request failed') && r.message !== 'Unknown error' ? r.message : null;
        if (r.status === 401 && smsVerification) {
            // token scaduto o revocato: nuova verifica
            forgetPhoneToken(phoneE164);
            setPhoneToken(null);
            setContactError(serverMsg ?? dt('verifyFirst'));
            setStep(2);
            return;
        }
        const msg = (r.status === 400 || r.status === 409) && serverMsg ? serverMsg : dt('orderError');
        setSubmitError(msg);
        addNotification({ message: msg, type: 'error' });
    };

    // ── Render ───────────────────────────────────────────────────────────────
    if (loading || settingsLoading) return <CustomLoading />;

    const card: React.CSSProperties = { background: 'var(--menu-surface)', border: '1px solid var(--menu-border)', borderRadius: 'var(--menu-radius)' };
    const muted: React.CSSProperties = { color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)', fontSize: '0.82rem' };
    const label: React.CSSProperties = { color: 'var(--menu-text)', fontFamily: 'var(--menu-font-body)', fontSize: '0.85rem', fontWeight: 600 };
    const primaryBtn: React.CSSProperties = {
        minHeight: 52, borderRadius: 'var(--menu-radius)', background: 'var(--menu-accent)', color: 'var(--menu-accent-text)',
        fontFamily: 'var(--menu-font-body)', fontWeight: 700, fontSize: '1rem',
    };
    const secondaryBtn: React.CSSProperties = {
        minHeight: 48, borderRadius: 'var(--menu-radius)', border: '1px solid var(--menu-border)', background: 'var(--menu-card)',
        color: 'var(--menu-text)', fontFamily: 'var(--menu-font-body)', fontWeight: 600, fontSize: '0.92rem', padding: '0 14px',
    };

    const steps: { n: Step; title: string }[] = [
        { n: 1, title: dt('stepAddress') }, { n: 2, title: dt('stepContact') }, { n: 3, title: dt('stepConfirm') },
    ];

    const shell = (body: React.ReactNode) => (
        <div className="menu-page" style={{ minHeight: '100vh' }}>
            <div className="max-w-2xl mx-auto" style={{ minHeight: '100vh' }}>
                <ClientStickyHeader
                    restaurantName={styles?.restaurantName || localname}
                    onAllergenClick={() => setIsAllergenModalOpen(true)}
                    onCartClick={() => navigate(`/${localname}/cart`)}
                    cartItemCount={cartCount}
                    primaryColor={styles?.primary?.trim() || undefined}
                />
                <main className="px-4 md:px-6 pt-5 pb-28">{body}</main>
            </div>
            <AllergenModal
                isOpen={isAllergenModalOpen}
                onClose={() => setIsAllergenModalOpen(false)}
                onApplyFilters={sel => { setSelectedAllergens(sel); setIsAllergenModalOpen(false); }}
            />
        </div>
    );

    if (!deliveryEnabled || !settings) {
        return shell(
            <div className="text-center py-16">
                <Bike className="w-14 h-14 mx-auto mb-4" style={{ color: 'var(--menu-muted)', opacity: 0.5 }} aria-hidden="true" />
                <p className="menu-h" style={{ fontSize: '1.4rem' }}>{dt('unavailable')}</p>
                <button type="button" onClick={goTakeaway} className="menu-focus mt-6 px-6" style={primaryBtn}>{dt('switchTakeaway')}</button>
            </div>,
        );
    }

    if (cart.length === 0) {
        return shell(
            <div className="text-center py-16">
                <ShoppingBasket className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--menu-muted)', opacity: 0.4 }} aria-hidden="true" />
                <p className="menu-h" style={{ fontSize: '1.5rem' }}>{dt('emptyCart')}</p>
                <button type="button" onClick={() => navigate(`/${localname}/Categories`)} className="menu-focus mt-6 px-6" style={primaryBtn}>{dt('backToMenu')}</button>
            </div>,
        );
    }

    const feeLine = quote && quote.zone
        ? (quote.feeCents === 0 ? dt('free') : formatCents(quote.feeCents))
        : null;
    const totalCents = subtotalCents + (quote?.feeCents ?? 0);
    const selectedSlot = (() => {
        if (!time) return null;
        const [d, t] = time.split('T');
        return days.find(x => x.date === d)?.slots.find(s => s.time === t) ?? null;
    })();
    const paymentMeta: Record<DeliveryPaymentChoice, { text: string; Icon: React.ElementType }> = {
        ONLINE: { text: dt('payOnline'), Icon: CreditCard },
        CASH: { text: dt('payCash'), Icon: Banknote },
        CARD: { text: dt('payCard'), Icon: Wallet },
    };

    return shell(
        <>
            <button
                type="button"
                onClick={() => (step === 1 ? navigate(`/${localname}/cart`) : setStep((step - 1) as Step))}
                className="menu-focus flex items-center gap-2 text-sm font-medium mb-4"
                style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)', minHeight: 44 }}
            >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" /> {dt('back')}
            </button>

            <p className="menu-label flex items-center gap-2" style={{ color: 'var(--menu-emph)' }}>
                <Bike className="w-4 h-4" aria-hidden="true" /> {dt('channelDelivery')}
            </p>
            <h1 ref={headingRef} tabIndex={-1} className="menu-h mt-1 outline-none" style={{ fontSize: 'clamp(1.8rem, 7vw, 2.4rem)', lineHeight: 1.1 }}>
                {step === 1 ? dt('whereDeliver') : step === 2 ? dt('contactTitle') : dt('stepConfirm')}
            </h1>

            {/* Avanzamento */}
            <ol className="flex gap-2 mt-4 mb-5" aria-label={dt('stepOf', { n: step, t: 3 })}>
                {steps.map(s => {
                    const done = s.n < step;
                    const current = s.n === step;
                    return (
                        <li key={s.n} className="flex-1" aria-current={current ? 'step' : undefined}>
                            <div style={{ height: 4, borderRadius: 2, background: done || current ? 'var(--menu-accent)' : 'var(--menu-border)' }} />
                            <span className="block mt-1.5 truncate" style={{ ...muted, fontSize: '0.74rem', color: current ? 'var(--menu-text)' : 'var(--menu-muted)', fontWeight: current ? 700 : 400 }}>
                                {done && <Check className="inline w-3 h-3 mr-0.5" aria-hidden="true" />}{s.title}
                            </span>
                        </li>
                    );
                })}
            </ol>
            <MenuRule className="mb-5" />

            {/* ── Passo 1: indirizzo ── */}
            {step === 1 && (
                <section aria-label={dt('stepAddress')} className="space-y-4">
                    <button type="button" onClick={useMyLocation} disabled={locating} className="menu-focus w-full inline-flex items-center justify-center gap-2 disabled:opacity-60" style={secondaryBtn}>
                        <Crosshair className="w-4 h-4" aria-hidden="true" style={{ color: 'var(--menu-accent)' }} />
                        {locating ? dt('locating') : dt('useMyLocation')}
                    </button>

                    <div className="flex items-center gap-3" aria-hidden="true">
                        <span className="flex-1" style={{ height: 1, background: 'var(--menu-border)' }} />
                        <span style={muted}>{dt('or')}</span>
                        <span className="flex-1" style={{ height: 1, background: 'var(--menu-border)' }} />
                    </div>

                    <form onSubmit={runSearch} role="search">
                        <label htmlFor="rf-addr-q" style={label}>{dt('searchLabel')}</label>
                        <div className="flex gap-2 mt-1">
                            <input
                                id="rf-addr-q"
                                type="search"
                                enterKeyHint="search"
                                autoComplete="street-address"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                placeholder={dt('searchPlaceholder')}
                                className="dark-input"
                            />
                            <button type="submit" disabled={searching || query.trim().length < 3} className="menu-focus flex-shrink-0 inline-flex items-center gap-1.5 px-4 disabled:opacity-60" style={{ ...primaryBtn, minHeight: 48, fontSize: '0.92rem' }}>
                                <Search className="w-4 h-4" aria-hidden="true" />
                                {searching ? dt('searching') : dt('search')}
                            </button>
                        </div>
                    </form>

                    {geoMessage && <p role="status" style={{ ...muted, color: 'var(--menu-text)' }}>{geoMessage}</p>}

                    {results && results.length > 1 && (
                        <ul className="overflow-hidden" style={card} aria-label={dt('searchLabel')}>
                            {results.map((g, i) => (
                                <li key={`${g.lat},${g.lng},${i}`} style={{ borderTop: i ? '1px solid var(--menu-border)' : 'none' }}>
                                    <button type="button" onClick={() => applyGeo(g, false)} className="menu-focus w-full text-left flex items-start gap-2 px-3 py-3" style={{ color: 'var(--menu-text)', fontFamily: 'var(--menu-font-body)', fontSize: '0.88rem', minHeight: 48 }}>
                                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" style={{ color: 'var(--menu-accent)' }} />
                                        {g.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {address && (
                        <>
                            <Suspense fallback={<div className="flex items-center justify-center" style={{ ...card, height: 260, ...muted }}>{dt('mapLoading')}</div>}>
                                <DeliveryMap
                                    lat={address.lat}
                                    lng={address.lng}
                                    origin={settings.originLat != null && settings.originLng != null ? { lat: settings.originLat, lng: settings.originLng } : null}
                                    maxKm={quote?.maxKm}
                                    onMove={onPinMove}
                                    label={dt('mapLabel')}
                                    pinLabel={dt('addressLabel')}
                                />
                            </Suspense>
                            <p style={muted}>{dt('dragPin')}</p>

                            <div>
                                <label htmlFor="rf-addr-label" style={label}>{dt('addressLabel')} *</label>
                                <input
                                    id="rf-addr-label"
                                    type="text"
                                    autoComplete="street-address"
                                    value={address.label}
                                    onChange={e => { setLabelFromReverse(false); setAddress({ ...address, label: e.target.value }); }}
                                    className="dark-input mt-1"
                                    aria-describedby="rf-addr-label-hint"
                                />
                                <p id="rf-addr-label-hint" className="mt-1" style={muted}>{dt('addressHint')}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label htmlFor="rf-addr-intercom" style={label}>{dt('intercom')}</label>
                                    <input id="rf-addr-intercom" type="text" value={address.intercom ?? ''} onChange={e => setAddress({ ...address, intercom: e.target.value })} className="dark-input mt-1" />
                                </div>
                                <div>
                                    <label htmlFor="rf-addr-floor" style={label}>{dt('floor')}</label>
                                    <input id="rf-addr-floor" type="text" value={address.floor ?? ''} onChange={e => setAddress({ ...address, floor: e.target.value })} className="dark-input mt-1" />
                                </div>
                            </div>
                            <div>
                                <label htmlFor="rf-addr-notes" style={label}>{dt('notes')} <span style={{ fontWeight: 400, color: 'var(--menu-muted)' }}>({dt('optional')})</span></label>
                                <textarea id="rf-addr-notes" rows={2} value={address.notes ?? ''} onChange={e => setAddress({ ...address, notes: e.target.value })} placeholder={dt('notesPlaceholder')} className="dark-input mt-1" style={{ resize: 'vertical' }} />
                            </div>

                            {/* Zona, tariffa, distanza (stima: decide il server) */}
                            {quote && (
                                <div className="p-4 space-y-2" style={card} aria-live="polite">
                                    {quote.outOfZone ? (
                                        <div className="flex gap-2" role="alert">
                                            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500" aria-hidden="true" />
                                            <div>
                                                <p style={{ ...label, fontWeight: 600 }}>
                                                    {dt('outOfZone', { km: formatKm(quote.distanceKm ?? 0), max: formatKm(quote.maxKm) })}
                                                </p>
                                                <button type="button" onClick={goTakeaway} className="menu-focus mt-3" style={secondaryBtn}>{dt('switchTakeaway')}</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between" style={muted}>
                                                <span>{dt('distance')}</span>
                                                <span className="tabular-nums" style={{ color: 'var(--menu-text)' }}>{quote.distanceKm != null ? `${formatKm(quote.distanceKm)} km` : '—'}</span>
                                            </div>
                                            <div className="flex justify-between" style={muted}>
                                                <span>{dt('deliveryFee')}</span>
                                                <span className="tabular-nums font-semibold" style={{ color: 'var(--menu-text)' }}>{feeLine}</span>
                                            </div>
                                            <div className="flex justify-between" style={muted}>
                                                <span>{dt('minOrder')}</span>
                                                <span className="tabular-nums" style={{ color: 'var(--menu-text)' }}>{formatCents(quote.minOrderCents)}</span>
                                            </div>
                                            {settings.freeDeliveryOverCents != null && !quote.freeApplied && (
                                                <p style={muted}>{dt('freeOver', { amount: formatCents(settings.freeDeliveryOverCents) })}</p>
                                            )}
                                            {quote.belowMinimum && (
                                                <div role="alert" className="pt-1">
                                                    <p style={{ ...label, color: '#dc2626' }}>
                                                        {dt('belowMin', { min: formatCents(quote.minOrderCents), missing: formatCents(quote.minOrderCents - subtotalCents) })}
                                                    </p>
                                                    <button type="button" onClick={() => navigate(`/${localname}/Categories`)} className="menu-focus mt-2" style={secondaryBtn}>{dt('addMore')}</button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    <button
                        type="button"
                        disabled={!addressOk}
                        onClick={() => setStep(2)}
                        className="menu-focus w-full disabled:opacity-50"
                        style={primaryBtn}
                    >
                        {address ? dt('continue') : dt('pickAddressFirst')}
                    </button>
                </section>
            )}

            {/* ── Passo 2: telefono ── */}
            {step === 2 && (
                <section aria-label={dt('stepContact')} className="space-y-4">
                    <PhoneVerification
                        localname={localname}
                        name={name}
                        phone={phone}
                        onNameChange={setName}
                        onPhoneChange={v => { setPhone(v); setContactError(null); }}
                        onToken={(tok, e164) => { setPhoneToken(tok); setPhoneE164(e164); if (tok) setContactError(null); }}
                        verify={smsVerification}
                    />
                    {contactError && <p role="alert" className="text-sm font-semibold" style={{ color: '#dc2626' }}>{contactError}</p>}
                    <button
                        type="button"
                        disabled={!contactOk}
                        onClick={() => setStep(3)}
                        className="menu-focus w-full disabled:opacity-50"
                        style={primaryBtn}
                    >
                        {contactOk ? dt('continue') : smsVerification ? dt('verifyFirst') : dt('contactFirst')}
                    </button>
                </section>
            )}

            {/* ── Passo 3: orario, pagamento, riepilogo ── */}
            {step === 3 && address && quote && (
                <section aria-label={dt('stepConfirm')} className="space-y-5">
                    <div className="p-4 flex items-start gap-3" style={card}>
                        <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--menu-accent)' }} aria-hidden="true" />
                        <div className="flex-1 min-w-0" style={{ fontFamily: 'var(--menu-font-body)' }}>
                            <p style={muted}>{dt('deliverTo')}</p>
                            <p className="font-semibold" style={{ color: 'var(--menu-text)' }}>{address.label}</p>
                            {(address.intercom || address.floor) && (
                                <p style={muted}>{[address.intercom && `${dt('intercom')}: ${address.intercom}`, address.floor && `${dt('floor')}: ${address.floor}`].filter(Boolean).join(' · ')}</p>
                            )}
                            <p style={muted}>{name} · {phoneE164}</p>
                        </div>
                        <button type="button" onClick={() => setStep(1)} className="menu-focus flex-shrink-0" style={{ color: 'var(--menu-accent)', fontWeight: 600, fontSize: '0.85rem', minHeight: 44, padding: '0 4px' }}>
                            {dt('edit')}
                        </button>
                    </div>

                    <div>
                        {(slotsLoading || paused || days.length === 0) && <p style={label}>{dt('deliveryTime')} *</p>}
                        {slotsLoading ? (
                            <p className="mt-1" style={muted}>{dt('slotsLoading')}</p>
                        ) : paused ? (
                            <p className="mt-1 font-semibold" style={{ ...label, color: 'var(--menu-accent)' }}>{dt('paused')}</p>
                        ) : days.length === 0 ? (
                            <p className="mt-1" style={muted}>{dt('noSlots')}</p>
                        ) : (
                            <div className="mt-1">
                                <SlotPicker mode="delivery" days={days} value={time} onChange={setTime} />
                            </div>
                        )}
                        {selectedSlot?.status === 'ON_REQUEST' && (
                            <p className="mt-2 text-xs p-2" style={{ color: 'var(--menu-text)', background: 'var(--menu-input-bg)', borderRadius: 'var(--menu-radius)' }}>
                                {dt('onRequest')}
                            </p>
                        )}
                    </div>

                    <fieldset>
                        <legend style={label}>{dt('payment')} *</legend>
                        <div className="mt-2 space-y-2" role="radiogroup">
                            {paymentOptions.map(opt => {
                                const { text, Icon } = paymentMeta[opt];
                                const active = payment === opt;
                                return (
                                    <label
                                        key={opt}
                                        className="flex items-center gap-3 px-3 cursor-pointer"
                                        style={{
                                            minHeight: 52, borderRadius: 'var(--menu-radius)',
                                            border: active ? '2px solid var(--menu-accent)' : '1px solid var(--menu-border)',
                                            background: active ? 'var(--menu-surface)' : 'var(--menu-card)',
                                            color: 'var(--menu-text)', fontFamily: 'var(--menu-font-body)', fontSize: '0.92rem', fontWeight: 600,
                                        }}
                                    >
                                        <input type="radio" name="rf-del-payment" value={opt} checked={active} onChange={() => setPayment(opt)} className="w-4 h-4" style={{ accentColor: 'var(--menu-accent)' }} />
                                        <Icon className="w-5 h-5" aria-hidden="true" style={{ color: active ? 'var(--menu-accent)' : 'var(--menu-muted)' }} />
                                        {text}
                                    </label>
                                );
                            })}
                        </div>
                        {settings.paymentMode === 'ONLINE_REQUIRED' && <p className="mt-2" style={muted}>{dt('onlineRequired')}</p>}
                    </fieldset>

                    <div className="p-4 space-y-2" style={card} aria-label={dt('summary')}>
                        <p className="menu-label" style={{ color: 'var(--menu-emph)' }}>{dt('summary')}</p>
                        <ul className="space-y-1">
                            {cart.map((l, i) => (
                                <li key={i} className="flex justify-between gap-3" style={{ ...muted, color: 'var(--menu-text)', fontSize: '0.88rem' }}>
                                    <span className="min-w-0 truncate">{l.quantity}× {productsMap.get(l.id)?.name ?? ""}{l.optionName && l.optionName !== "Standard" ? ` (${l.optionName})` : ""}</span>
                                    <span className="tabular-nums flex-shrink-0">{formatCents(Math.round(l.price * l.quantity * 100))}</span>
                                </li>
                            ))}
                        </ul>
                        <div className="pt-2 space-y-1" style={{ borderTop: '1px solid var(--menu-border)' }}>
                            <div className="flex justify-between" style={muted}><span>{dt('subtotal')}</span><span className="tabular-nums">{formatCents(subtotalCents)}</span></div>
                            <div className="flex justify-between" style={muted}>
                                <span>{dt('deliveryFee')}{quote.distanceKm != null ? ` (${formatKm(quote.distanceKm)} km)` : ''}</span>
                                <span className="tabular-nums" style={quote.freeApplied ? { color: '#16a34a', fontWeight: 700 } : undefined}>{feeLine}</span>
                            </div>
                            <div className="flex justify-between pt-1" style={{ color: 'var(--menu-text)', fontFamily: 'var(--menu-font-display)', fontSize: '1.4rem', fontWeight: 700 }}>
                                <span>{dt('total')}</span><span className="tabular-nums">{formatCents(totalCents)}</span>
                            </div>
                            <p style={{ ...muted, fontSize: '0.74rem' }}>{dt('feeEstimateNote')}</p>
                        </div>
                    </div>

                    {submitError && <p role="alert" className="text-sm font-semibold" style={{ color: '#dc2626', fontFamily: 'var(--menu-font-body)' }}>{submitError}</p>}

                    <button
                        type="button"
                        onClick={submit}
                        disabled={submitting || !time || !payment || paused}
                        className="menu-focus w-full inline-flex items-center justify-center gap-2 disabled:opacity-50"
                        style={primaryBtn}
                    >
                        <Check className="w-5 h-5" aria-hidden="true" />
                        {submitting ? dt('submitting') : payment === 'ONLINE' ? `${dt('orderAndPay')} · ${formatCents(totalCents)}` : `${dt('sendOrder')} · ${formatCents(totalCents)}`}
                    </button>
                </section>
            )}
        </>,
    );
};

export default DeliveryCheckoutPage;
