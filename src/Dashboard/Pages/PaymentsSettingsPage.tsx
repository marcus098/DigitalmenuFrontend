import React, { useCallback, useEffect, useState } from 'react';
import { useNotification } from '../../Context/NotificationContext';
import {
    getPaymentProviderApi,
    saveStripeProviderApi,
    saveSumUpProviderApi,
    setActivePaymentProviderApi,
    deleteStripeProviderApi,
    deleteSumUpProviderApi,
    updatePrepaymentSettingsApi,
} from '../../Utilities/api';
import { PaymentProvider, PrepaymentSettings, ProviderSettings } from '../../types';
import CustomLoading from '../../Components/CustomLoading';
import {
    CheckCircleIcon, CreditCardIcon, ExclamationTriangleIcon, ArrowTopRightOnSquareIcon, ArrowPathIcon,
    ClipboardDocumentIcon, ShieldCheckIcon, TrashIcon, BanknotesIcon, NoSymbolIcon,
} from '@heroicons/react/24/outline';

const unwrap = <T,>(res: any): T | null => (res?.data?.data ?? res?.data ?? null) as T | null;

const STRIPE_WEBHOOK_EVENTS = [
    'payment_intent.succeeded',
    'payment_intent.payment_failed',
    'payment_intent.amount_capturable_updated',
    'payment_intent.canceled',
    'charge.refunded',
];

const PROVIDER_LABEL: Record<PaymentProvider, string> = { NONE: 'Nessuno', STRIPE: 'Stripe', SUMUP: 'SumUp' };

const formatDateTime = (iso: string | null) => {
    if (!iso) return null;
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString('it-IT', { dateStyle: 'short', timeStyle: 'short' });
};

/** Interruttore semplice (accessibile) per le impostazioni. */
const Switch: React.FC<{ checked: boolean; disabled?: boolean; onChange: (v: boolean) => void; label: string }> =
    ({ checked, disabled, onChange, label }) => (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            aria-label={label}
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${checked ? 'bg-green-600' : 'bg-gray-300'}`}
        >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </button>
    );

const Badge: React.FC<{ tone: 'green' | 'yellow' | 'slate' | 'blue'; children: React.ReactNode }> = ({ tone, children }) => {
    const tones = {
        green: 'bg-green-100 text-green-700',
        yellow: 'bg-yellow-100 text-yellow-700',
        slate: 'bg-slate-100 text-slate-600',
        blue: 'bg-blue-100 text-blue-700',
    };
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${tones[tone]}`}>
            {children}
        </span>
    );
};

const ErrorBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
        <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
        <span className="break-words min-w-0">{children}</span>
    </div>
);

const WarningBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
        <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
        <span>{children}</span>
    </div>
);

/** Chiave salvata (write-only): mostra solo le ultime 4 cifre. */
const SavedKey: React.FC<{ last4: string; onReplace: () => void }> = ({ last4, onReplace }) => (
    <div className="mt-1 flex items-center justify-between gap-3 px-4 py-2.5 border border-gray-200 rounded-lg bg-gray-50">
        <span className="font-mono text-sm text-gray-700">•••• {last4}</span>
        <button type="button" onClick={onReplace} className="text-sm font-semibold text-primary-600 hover:underline disabled:opacity-50">
            Sostituisci chiave
        </button>
    </div>
);

const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch {
        try {
            const ta = document.createElement('textarea');
            ta.value = text;
            ta.style.position = 'fixed';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            const ok = document.execCommand('copy');
            document.body.removeChild(ta);
            return ok;
        } catch {
            return false;
        }
    }
};

type Busy = null | 'stripe' | 'sumup' | 'active' | 'prepay';

const PaymentsSettingsPage: React.FC = () => {
    const { addNotification } = useNotification();
    const [settings, setSettings] = useState<ProviderSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState<Busy>(null);

    // Stripe form
    const [pk, setPk] = useState('');
    const [sk, setSk] = useState('');
    const [whsec, setWhsec] = useState('');
    const [replaceSk, setReplaceSk] = useState(false);

    // SumUp form
    const [sumupKey, setSumupKey] = useState('');
    const [merchantCode, setMerchantCode] = useState('');
    const [replaceSumupKey, setReplaceSumupKey] = useState(false);

    /** Applica la risposta del server e svuota i campi segreti (le chiavi non tornano mai indietro). */
    const applySettings = useCallback((s: ProviderSettings | null) => {
        if (!s) return;
        setSettings(s);
        setPk(s.stripe?.publishableKey ?? '');
        setMerchantCode(s.sumup?.merchantCode ?? '');
        setSk('');
        setWhsec('');
        setSumupKey('');
        setReplaceSk(false);
        setReplaceSumupKey(false);
    }, []);

    const load = useCallback(async () => {
        setLoading(true);
        const res = await getPaymentProviderApi();
        if (res.success) {
            applySettings(unwrap<ProviderSettings>(res));
            setError(null);
        } else {
            setError(res.status === 403
                ? 'Solo l’amministratore del locale può gestire i pagamenti online.'
                : 'Impossibile leggere la configurazione dei pagamenti online.');
        }
        setLoading(false);
    }, [applySettings]);

    useEffect(() => { load(); }, [load]);

    // ── Stripe ───────────────────────────────────────────────────────────────
    const saveStripe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings) return;
        const publishableKey = pk.trim();
        const secretKey = sk.trim();
        const webhookSecret = whsec.trim();

        if (!/^pk_(test|live)_/.test(publishableKey)) {
            addNotification({ message: 'La publishable key deve iniziare con pk_test_ o pk_live_.', type: 'error' });
            return;
        }
        if (!settings.stripe.secretKeyLast4 && !secretKey) {
            addNotification({ message: 'Inserisci la restricted key o la chiave segreta.', type: 'error' });
            return;
        }
        if (secretKey && !/^(sk|rk)_(test|live)_/.test(secretKey)) {
            addNotification({ message: 'La chiave deve iniziare con rk_ (consigliata) o sk_.', type: 'error' });
            return;
        }
        if (secretKey && publishableKey.startsWith('pk_live_') !== /^(sk|rk)_live_/.test(secretKey)) {
            addNotification({ message: 'Le chiavi devono essere entrambe di test o entrambe live.', type: 'error' });
            return;
        }
        if (webhookSecret && !webhookSecret.startsWith('whsec_')) {
            addNotification({ message: 'Il webhook secret deve iniziare con whsec_.', type: 'error' });
            return;
        }

        setBusy('stripe');
        const res = await saveStripeProviderApi({
            publishableKey,
            ...(secretKey ? { secretKey } : {}),
            ...(webhookSecret ? { webhookSecret } : {}),
        });
        setBusy(null);
        if (res.success) {
            const next = unwrap<ProviderSettings>(res);
            applySettings(next);
            addNotification(next?.stripe && !next.stripe.configured
                ? { message: 'Chiavi salvate, ma manca il webhook: configuralo qui sotto per attivare Stripe.', type: 'warning' }
                : next?.stripe?.lastError
                    ? { message: 'Chiavi salvate, ma Stripe ha segnalato un problema: controlla i dettagli.', type: 'warning' }
                    : { message: 'Configurazione Stripe salvata e verificata', type: 'success' });
        } else {
            addNotification({ message: res.message || 'Impossibile salvare la configurazione Stripe', type: 'error' });
        }
    };

    const removeStripe = async () => {
        if (!window.confirm('Scollegare Stripe? Le chiavi salvate verranno eliminate e, se Stripe è il metodo attivo, i pagamenti online verranno disattivati.')) return;
        setBusy('stripe');
        const res = await deleteStripeProviderApi();
        setBusy(null);
        if (res.success) {
            applySettings(unwrap<ProviderSettings>(res));
            addNotification({ message: 'Stripe scollegato', type: 'info' });
        } else {
            addNotification({ message: res.message || 'Impossibile scollegare Stripe', type: 'error' });
        }
    };

    // ── SumUp ────────────────────────────────────────────────────────────────
    const saveSumUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!settings) return;
        const apiKey = sumupKey.trim();
        const code = merchantCode.trim();
        if (!settings.sumup.apiKeyLast4 && !apiKey) {
            addNotification({ message: 'Inserisci la API key di SumUp.', type: 'error' });
            return;
        }
        setBusy('sumup');
        const res = await saveSumUpProviderApi({
            ...(apiKey ? { apiKey } : {}),
            ...(code ? { merchantCode: code } : {}),
        });
        setBusy(null);
        if (res.success) {
            const next = unwrap<ProviderSettings>(res);
            applySettings(next);
            addNotification(next?.sumup?.lastError
                ? { message: 'Chiave salvata, ma SumUp ha segnalato un problema: controlla i dettagli.', type: 'warning' }
                : { message: 'Configurazione SumUp salvata e verificata', type: 'success' });
        } else {
            addNotification({ message: res.message || 'Impossibile salvare la configurazione SumUp', type: 'error' });
        }
    };

    const removeSumUp = async () => {
        if (!window.confirm('Scollegare SumUp? La chiave salvata verrà eliminata e, se SumUp è il metodo attivo, i pagamenti online verranno disattivati.')) return;
        setBusy('sumup');
        const res = await deleteSumUpProviderApi();
        setBusy(null);
        if (res.success) {
            applySettings(unwrap<ProviderSettings>(res));
            addNotification({ message: 'SumUp scollegato', type: 'info' });
        } else {
            addNotification({ message: res.message || 'Impossibile scollegare SumUp', type: 'error' });
        }
    };

    // ── Provider attivo ──────────────────────────────────────────────────────
    const selectProvider = async (provider: PaymentProvider) => {
        if (!settings || settings.activeProvider === provider) return;
        setBusy('active');
        const res = await setActivePaymentProviderApi(provider);
        setBusy(null);
        if (res.success) {
            const next = unwrap<ProviderSettings>(res);
            if (next) setSettings(next);
            addNotification({
                message: provider === 'NONE' ? 'Pagamenti online disattivati' : `Pagamenti online attivi con ${PROVIDER_LABEL[provider]}`,
                type: 'success',
            });
        } else {
            addNotification({
                message: res.message && !res.message.startsWith('Request failed')
                    ? res.message
                    : res.status === 400 ? `Configura prima ${PROVIDER_LABEL[provider]}.` : 'Impossibile cambiare il metodo di pagamento',
                type: 'error',
            });
        }
    };

    // ── Prepagamento ─────────────────────────────────────────────────────────
    const savePrepay = async (takeaway: boolean, table: boolean) => {
        setBusy('prepay');
        const res = await updatePrepaymentSettingsApi(takeaway, table);
        setBusy(null);
        if (res.success) {
            const p = unwrap<PrepaymentSettings>(res);
            setSettings(s => s ? {
                ...s,
                prepaymentTakeaway: p?.prepaymentTakeaway ?? takeaway,
                prepaymentTable: p?.prepaymentTable ?? table,
            } : s);
            addNotification({ message: 'Impostazioni di pagamento salvate', type: 'success' });
        } else {
            addNotification({ message: res.message || 'Impossibile salvare le impostazioni', type: 'error' });
        }
    };

    const copyWebhookUrl = async (url: string) => {
        const ok = await copyToClipboard(url);
        addNotification(ok
            ? { message: 'URL copiato', type: 'success' }
            : { message: 'Copia non riuscita: selezionalo manualmente', type: 'error' });
    };

    if (loading && !settings) return <CustomLoading isFullPage message="" />;

    const stripe = settings?.stripe;
    const sumup = settings?.sumup;
    const encryptionOk = !!settings?.encryptionAvailable;
    const enabled = !!settings?.enabled;
    const active: PaymentProvider = settings?.activeProvider ?? 'NONE';
    // Il backend considera Stripe "configured" solo con chiavi verificate E webhook secret salvato
    const stripeKeysSaved = !!stripe?.secretKeyLast4;
    const showWebhookField = stripeKeysSaved && (stripe.webhookStatus === 'MISSING' || stripe.webhookStatus === 'MANUAL');
    const editingSk = !stripe?.secretKeyLast4 || replaceSk;
    const editingSumupKey = !sumup?.apiKeyLast4 || replaceSumupKey;

    const providerOptions: { id: PaymentProvider; label: string; desc: string; configured: boolean; Icon: React.ElementType }[] = [
        { id: 'NONE', label: 'Nessuno', desc: 'Solo pagamento alla cassa', configured: true, Icon: NoSymbolIcon },
        { id: 'STRIPE', label: 'Stripe', desc: 'Carte, Apple Pay, Google Pay', configured: !!stripe?.configured, Icon: CreditCardIcon },
        { id: 'SUMUP', label: 'SumUp', desc: 'Carte tramite checkout SumUp', configured: !!sumup?.configured, Icon: BanknotesIcon },
    ];

    return (
        <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
            <div className="mb-6 flex justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Pagamenti online</h1>
                    <p className="text-gray-500 mt-1">
                        Collega il tuo account Stripe o SumUp per far pagare i clienti direttamente dal menu.
                    </p>
                </div>
                <button onClick={load} disabled={loading} className="btn-secondary flex items-center text-sm" title="Aggiorna stato">
                    <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {error || !settings || !stripe || !sumup ? (
                <div className="bg-white p-6 rounded-xl shadow-lg flex items-center gap-3 text-red-600">
                    <ExclamationTriangleIcon className="w-6 h-6 shrink-0" />
                    {error ?? 'Impossibile leggere la configurazione dei pagamenti online.'}
                </div>
            ) : (
                <div className="space-y-8">
                    <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
                        <ShieldCheckIcon className="w-6 h-6 shrink-0 text-blue-600" />
                        <div>
                            <p className="font-semibold">
                                I pagamenti arrivano direttamente sul tuo conto Stripe o SumUp: la piattaforma non incassa nulla.
                            </p>
                            <p className="mt-1 text-blue-800">
                                Paghi solo le commissioni del tuo fornitore di pagamento. Le chiavi che inserisci vengono salvate
                                cifrate e, dopo il salvataggio, non sono più visibili.
                            </p>
                        </div>
                    </div>

                    {!encryptionOk && (
                        <WarningBox>
                            Il server non ha la chiave di cifratura configurata (APP_SECRETS_ENCRYPTION_KEY): non è possibile
                            salvare le chiavi di pagamento. Contatta l’amministratore della piattaforma.
                        </WarningBox>
                    )}

                    {/* ── Metodo attivo ─────────────────────────────────────── */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-800">Metodo di pagamento attivo</h3>
                                <p className="text-sm text-gray-500">Puoi attivare solo un fornitore già configurato.</p>
                            </div>
                            {enabled
                                ? <Badge tone="green"><CheckCircleIcon className="w-4 h-4" /> Attivi con {PROVIDER_LABEL[active]}</Badge>
                                : <Badge tone="slate">Pagamenti online disattivati</Badge>}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" role="radiogroup" aria-label="Metodo di pagamento attivo">
                            {providerOptions.map(({ id, label, desc, configured, Icon }) => {
                                const selected = active === id;
                                return (
                                    <button
                                        key={id}
                                        type="button"
                                        role="radio"
                                        aria-checked={selected}
                                        disabled={busy !== null || (!configured && !selected)}
                                        onClick={() => selectProvider(id)}
                                        className={`text-left p-4 rounded-xl border-2 transition-colors disabled:cursor-not-allowed ${selected
                                            ? 'border-primary-500 bg-primary-50'
                                            : 'border-gray-200 hover:border-gray-300 disabled:opacity-50'}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="flex items-center gap-2 font-bold text-gray-800">
                                                <Icon className="w-5 h-5" /> {label}
                                            </span>
                                            {selected && <CheckCircleIcon className="w-5 h-5 text-primary-600" />}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">{desc}</p>
                                        {!configured && <p className="text-xs text-gray-400 mt-1">Da configurare qui sotto</p>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                        {/* ── Stripe ──────────────────────────────────────────── */}
                        <div className="bg-white p-6 rounded-xl shadow-lg">
                            <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                                <div className="flex items-center gap-3">
                                    <CreditCardIcon className="w-8 h-8 text-gray-700" />
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">Stripe</h3>
                                        <p className="text-sm text-gray-500">Carte, Apple Pay e Google Pay</p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {stripe.configured
                                        ? <Badge tone="green"><CheckCircleIcon className="w-4 h-4" /> Configurato</Badge>
                                        : stripeKeysSaved
                                            ? <Badge tone="yellow"><ExclamationTriangleIcon className="w-4 h-4" /> Webhook mancante</Badge>
                                            : <Badge tone="slate">Non configurato</Badge>}
                                    {stripe.livemode != null && (
                                        stripe.livemode ? <Badge tone="blue">Live</Badge> : <Badge tone="yellow">Test</Badge>
                                    )}
                                </div>
                            </div>

                            {stripeKeysSaved && (
                                <dl className="text-sm mb-4 divide-y divide-gray-100 border-y border-gray-100">
                                    {(stripe.accountName || stripe.accountId) && (
                                        <div className="flex justify-between gap-3 py-2">
                                            <dt className="text-gray-500">Account</dt>
                                            <dd className="text-gray-800 text-right min-w-0">
                                                {stripe.accountName && <span className="font-semibold">{stripe.accountName}</span>}
                                                {stripe.accountId && <span className="block font-mono text-xs text-gray-500 break-all">{stripe.accountId}</span>}
                                            </dd>
                                        </div>
                                    )}
                                    <div className="flex justify-between gap-3 py-2">
                                        <dt className="text-gray-500">Webhook</dt>
                                        <dd className="text-right">
                                            {stripe.webhookStatus === 'AUTO' && <span className="text-green-700 font-semibold">Configurato automaticamente</span>}
                                            {stripe.webhookStatus === 'MANUAL' && <span className="text-green-700 font-semibold">Configurato manualmente</span>}
                                            {stripe.webhookStatus === 'MISSING' && <span className="text-red-600 font-semibold">Da configurare</span>}
                                            {!stripe.webhookStatus && <span className="text-gray-400">—</span>}
                                        </dd>
                                    </div>
                                    {stripe.verifiedAt && (
                                        <div className="flex justify-between gap-3 py-2">
                                            <dt className="text-gray-500">Ultima verifica</dt>
                                            <dd className="text-gray-800">{formatDateTime(stripe.verifiedAt)}</dd>
                                        </div>
                                    )}
                                </dl>
                            )}

                            {stripe.lastError && <div className="mb-4"><ErrorBox>{stripe.lastError}</ErrorBox></div>}

                            <form onSubmit={saveStripe}>
                                <fieldset disabled={!encryptionOk || busy !== null} className="space-y-4 disabled:opacity-60">
                                    <div>
                                        <label className="label-style" htmlFor="stripe-pk">Publishable key</label>
                                        <input
                                            id="stripe-pk"
                                            className="input-style mt-1 font-mono text-sm"
                                            value={pk}
                                            onChange={e => setPk(e.target.value)}
                                            placeholder="pk_live_..."
                                            autoComplete="off"
                                            spellCheck={false}
                                        />
                                    </div>
                                    <div>
                                        <label className="label-style" htmlFor="stripe-sk">Restricted key o chiave segreta</label>
                                        {editingSk ? (
                                            <div className="flex gap-2 mt-1">
                                                <input
                                                    id="stripe-sk"
                                                    type="password"
                                                    className="input-style font-mono text-sm"
                                                    value={sk}
                                                    onChange={e => setSk(e.target.value)}
                                                    placeholder="rk_live_... oppure sk_live_..."
                                                    autoComplete="new-password"
                                                    spellCheck={false}
                                                />
                                                {replaceSk && (
                                                    <button type="button" className="btn-secondary text-sm" onClick={() => { setReplaceSk(false); setSk(''); }}>
                                                        Annulla
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <SavedKey last4={stripe.secretKeyLast4 ?? ''} onReplace={() => setReplaceSk(true)} />
                                        )}
                                    </div>

                                    {showWebhookField && (
                                        <div className="rounded-xl border border-gray-200 p-4 space-y-3 bg-slate-50">
                                            <p className="text-sm font-semibold text-gray-800">Webhook (configurazione manuale)</p>
                                            <p className="text-xs text-gray-600">
                                                La chiave non permette di creare il webhook in automatico. Su Stripe apri
                                                <em> Sviluppatori → Webhook → Aggiungi endpoint</em>, incolla questo URL, seleziona gli
                                                eventi elencati e copia qui il <em>signing secret</em>.
                                            </p>
                                            <div className="flex gap-2">
                                                <input
                                                    readOnly
                                                    value={stripe.webhookUrl}
                                                    className="input-style font-mono text-xs bg-white"
                                                    onFocus={e => e.currentTarget.select()}
                                                    aria-label="URL webhook"
                                                />
                                                <button type="button" className="btn-secondary flex items-center text-sm" onClick={() => copyWebhookUrl(stripe.webhookUrl)} title="Copia URL">
                                                    <ClipboardDocumentIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-gray-700 mb-1">Eventi da selezionare</p>
                                                <ul className="text-xs font-mono text-gray-700 list-disc pl-5">
                                                    {STRIPE_WEBHOOK_EVENTS.map(ev => <li key={ev}>{ev}</li>)}
                                                </ul>
                                            </div>
                                            <div>
                                                <label className="label-style" htmlFor="stripe-whsec">
                                                    Webhook secret{' '}
                                                    {stripe.webhookStatus === 'MANUAL' && (
                                                        <span className="font-normal text-gray-500">(già salvato: compila solo per sostituirlo)</span>
                                                    )}
                                                </label>
                                                <input
                                                    id="stripe-whsec"
                                                    type="password"
                                                    className="input-style mt-1 font-mono text-sm"
                                                    value={whsec}
                                                    onChange={e => setWhsec(e.target.value)}
                                                    placeholder="whsec_..."
                                                    autoComplete="new-password"
                                                    spellCheck={false}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-3">
                                        <button type="submit" className="btn-primary disabled:opacity-50">
                                            {busy === 'stripe' ? 'Verifica in corso…' : stripeKeysSaved ? 'Salva modifiche' : 'Collega Stripe'}
                                        </button>
                                        {stripeKeysSaved && (
                                            <button type="button" onClick={removeStripe} className="btn-secondary flex items-center text-sm !text-red-600 hover:!bg-red-50">
                                                <TrashIcon className="w-5 h-5 mr-1" /> Scollega
                                            </button>
                                        )}
                                    </div>
                                </fieldset>
                            </form>

                            <div className="mt-6 text-xs text-gray-500 space-y-1">
                                <p className="font-semibold text-gray-700">Come ottenere le chiavi</p>
                                <p>
                                    Apri{' '}
                                    <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline inline-flex items-center gap-0.5">
                                        dashboard.stripe.com/apikeys <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                                    </a>
                                    , copia la <em>publishable key</em> e crea una <strong>restricted key</strong> (più sicura della
                                    chiave segreta completa) con permessi di scrittura su PaymentIntents, Refunds e Webhook Endpoints.
                                </p>
                                <p>Usa le chiavi di test per provare, quelle live per incassare davvero.</p>
                            </div>
                        </div>

                        {/* ── SumUp ───────────────────────────────────────────── */}
                        <div className="bg-white p-6 rounded-xl shadow-lg">
                            <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
                                <div className="flex items-center gap-3">
                                    <BanknotesIcon className="w-8 h-8 text-gray-700" />
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">SumUp</h3>
                                        <p className="text-sm text-gray-500">Pagamento con carta tramite SumUp</p>
                                    </div>
                                </div>
                                {sumup.configured
                                    ? <Badge tone="green"><CheckCircleIcon className="w-4 h-4" /> Configurato</Badge>
                                    : <Badge tone="slate">Non configurato</Badge>}
                            </div>

                            {sumup.configured && (sumup.merchantCode || sumup.verifiedAt) && (
                                <dl className="text-sm mb-4 divide-y divide-gray-100 border-y border-gray-100">
                                    {sumup.merchantCode && (
                                        <div className="flex justify-between gap-3 py-2">
                                            <dt className="text-gray-500">Merchant code</dt>
                                            <dd className="font-mono text-gray-800">{sumup.merchantCode}</dd>
                                        </div>
                                    )}
                                    {sumup.verifiedAt && (
                                        <div className="flex justify-between gap-3 py-2">
                                            <dt className="text-gray-500">Ultima verifica</dt>
                                            <dd className="text-gray-800">{formatDateTime(sumup.verifiedAt)}</dd>
                                        </div>
                                    )}
                                </dl>
                            )}

                            {sumup.lastError && <div className="mb-4"><ErrorBox>{sumup.lastError}</ErrorBox></div>}

                            <form onSubmit={saveSumUp}>
                                <fieldset disabled={!encryptionOk || busy !== null} className="space-y-4 disabled:opacity-60">
                                    <div>
                                        <label className="label-style" htmlFor="sumup-key">API key</label>
                                        {editingSumupKey ? (
                                            <div className="flex gap-2 mt-1">
                                                <input
                                                    id="sumup-key"
                                                    type="password"
                                                    className="input-style font-mono text-sm"
                                                    value={sumupKey}
                                                    onChange={e => setSumupKey(e.target.value)}
                                                    placeholder="sup_sk_..."
                                                    autoComplete="new-password"
                                                    spellCheck={false}
                                                />
                                                {replaceSumupKey && (
                                                    <button type="button" className="btn-secondary text-sm" onClick={() => { setReplaceSumupKey(false); setSumupKey(''); }}>
                                                        Annulla
                                                    </button>
                                                )}
                                            </div>
                                        ) : (
                                            <SavedKey last4={sumup.apiKeyLast4 ?? ''} onReplace={() => setReplaceSumupKey(true)} />
                                        )}
                                    </div>
                                    <div>
                                        <label className="label-style" htmlFor="sumup-merchant">
                                            Merchant code <span className="font-normal text-gray-500">(opzionale)</span>
                                        </label>
                                        <input
                                            id="sumup-merchant"
                                            className="input-style mt-1 font-mono text-sm"
                                            value={merchantCode}
                                            onChange={e => setMerchantCode(e.target.value)}
                                            placeholder="Rilevato automaticamente se vuoto"
                                            autoComplete="off"
                                            spellCheck={false}
                                        />
                                    </div>

                                    <div className="flex flex-wrap gap-3">
                                        <button type="submit" className="btn-primary disabled:opacity-50">
                                            {busy === 'sumup' ? 'Verifica in corso…' : sumup.apiKeyLast4 ? 'Salva modifiche' : 'Collega SumUp'}
                                        </button>
                                        {!!sumup.apiKeyLast4 && (
                                            <button type="button" onClick={removeSumUp} className="btn-secondary flex items-center text-sm !text-red-600 hover:!bg-red-50">
                                                <TrashIcon className="w-5 h-5 mr-1" /> Scollega
                                            </button>
                                        )}
                                    </div>
                                </fieldset>
                            </form>

                            <div className="mt-6 text-xs text-gray-500 space-y-2">
                                <p className="bg-slate-50 border border-gray-200 rounded-lg p-3 text-gray-700">
                                    Con SumUp gli ordini su richiesta vengono addebitati subito e rimborsati automaticamente se li rifiuti.
                                </p>
                                <p className="font-semibold text-gray-700">Come ottenere la chiave</p>
                                <p>
                                    Accedi a SumUp e apri{' '}
                                    <a href="https://me.sumup.com/developers" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline inline-flex items-center gap-0.5">
                                        me.sumup.com/developers <ArrowTopRightOnSquareIcon className="w-3 h-3" />
                                    </a>
                                    , crea una API key e incollala qui.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── Pagamento anticipato ─────────────────────────────── */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <h3 className="text-xl font-bold text-gray-800 mb-1">Pagamento anticipato</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            Se attivo, l'ordine arriva in cucina (e viene stampato) solo dopo che il cliente ha pagato online.
                            Gli ordini non pagati entro 15 minuti vengono annullati.
                        </p>
                        {!enabled && (
                            <div className="mb-4">
                                <WarningBox>Attiva i pagamenti online con Stripe o SumUp per poter richiedere il pagamento anticipato.</WarningBox>
                            </div>
                        )}
                        <div className="divide-y divide-gray-100">
                            <div className="flex items-center justify-between gap-4 py-3">
                                <div>
                                    <p className="font-semibold text-gray-800">Asporto</p>
                                    <p className="text-xs text-gray-500">
                                        Orari "su richiesta": con Stripe l'importo viene solo autorizzato e addebitato se accetti l'ordine;
                                        con SumUp viene addebitato subito e rimborsato automaticamente se lo rifiuti.
                                    </p>
                                </div>
                                <Switch
                                    label="Pagamento anticipato per l'asporto"
                                    checked={!!settings.prepaymentTakeaway}
                                    disabled={!enabled || busy !== null}
                                    onChange={v => savePrepay(v, !!settings.prepaymentTable)}
                                />
                            </div>
                            <div className="flex items-center justify-between gap-4 py-3">
                                <div>
                                    <p className="font-semibold text-gray-800">Al tavolo</p>
                                    <p className="text-xs text-gray-500">Ogni cliente paga la propria comanda prima che arrivi in cucina.</p>
                                </div>
                                <Switch
                                    label="Pagamento anticipato al tavolo"
                                    checked={!!settings.prepaymentTable}
                                    disabled={!enabled || busy !== null}
                                    onChange={v => savePrepay(!!settings.prepaymentTakeaway, v)}
                                />
                            </div>
                        </div>
                        {!enabled && (settings.prepaymentTakeaway || settings.prepaymentTable) && (
                            <p className="text-xs text-gray-500 mt-2">
                                I pagamenti online non sono attivi: il pagamento anticipato è sospeso finché non li riattivi.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentsSettingsPage;
