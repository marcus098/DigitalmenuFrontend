import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNotification } from '../../Context/NotificationContext';
import {
    getStripeConnectStatusApi,
    getStripeDashboardLinkApi,
    startStripeOnboardingApi,
    getPrepaymentSettingsApi,
    updatePrepaymentSettingsApi,
} from '../../Utilities/api';
import { PrepaymentSettings, StripeConnectStatus } from '../../types';
import CustomLoading from '../../Components/CustomLoading';
import {
    CheckCircleIcon, CreditCardIcon, ExclamationTriangleIcon, ArrowTopRightOnSquareIcon, ArrowPathIcon,
} from '@heroicons/react/24/outline';

const unwrap = <T,>(res: any): T | null => (res?.data?.data ?? res?.data ?? null) as T | null;

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

const formatBps = (bps: number) =>
    `${new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 }).format(bps / 100)}%`;

const PaymentsSettingsPage: React.FC = () => {
    const { addNotification } = useNotification();
    const [searchParams, setSearchParams] = useSearchParams();
    const [status, setStatus] = useState<StripeConnectStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [prepay, setPrepay] = useState<PrepaymentSettings | null>(null);
    const [savingPrepay, setSavingPrepay] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        const res = await getStripeConnectStatusApi();
        if (res.success) {
            setStatus(unwrap<StripeConnectStatus>(res));
            setError(null);
        } else {
            setError(res.status === 403
                ? 'Solo l’amministratore del locale può gestire i pagamenti online.'
                : 'Impossibile leggere lo stato dei pagamenti online.');
        }
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        getPrepaymentSettingsApi().then(res => {
            if (res.success) setPrepay(unwrap<PrepaymentSettings>(res));
        });
    }, [status?.chargesEnabled]);

    const savePrepay = async (takeaway: boolean, table: boolean) => {
        setSavingPrepay(true);
        const res = await updatePrepaymentSettingsApi(takeaway, table);
        setSavingPrepay(false);
        if (res.success) {
            setPrepay(unwrap<PrepaymentSettings>(res));
            addNotification({ message: 'Impostazioni di pagamento salvate', type: 'success' });
        } else {
            addNotification({ message: res.message || 'Impossibile salvare le impostazioni', type: 'error' });
        }
    };

    // Ritorno dall'onboarding Stripe: ?stripe=return (completato o interrotto) | ?stripe=refresh (link scaduto)
    useEffect(() => {
        const stripeParam = searchParams.get('stripe');
        if (!stripeParam) return;
        if (stripeParam === 'return') {
            addNotification({ message: 'Configurazione Stripe aggiornata', type: 'info' });
        } else if (stripeParam === 'refresh') {
            addNotification({ message: 'Il link di configurazione è scaduto: riprova con “Completa configurazione”.', type: 'warning' });
        }
        const next = new URLSearchParams(searchParams);
        next.delete('stripe');
        setSearchParams(next, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleOnboard = async () => {
        setBusy(true);
        const res = await startStripeOnboardingApi();
        const url = unwrap<{ url: string }>(res)?.url;
        if (res.success && url) {
            window.location.href = url;
            return;
        }
        addNotification({
            message: res.status === 503 ? 'Stripe non è ancora configurato sulla piattaforma.' : 'Impossibile avviare la configurazione Stripe.',
            type: 'error',
        });
        setBusy(false);
    };

    const handleOpenDashboard = async () => {
        setBusy(true);
        const res = await getStripeDashboardLinkApi();
        const url = unwrap<{ url: string }>(res)?.url;
        setBusy(false);
        if (res.success && url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        } else {
            addNotification({ message: res.message || 'Impossibile aprire la dashboard Stripe.', type: 'error' });
        }
    };

    if (loading && !status) return <CustomLoading isFullPage message="" />;

    const connected = !!status?.connected;
    const active = !!status?.chargesEnabled;

    return (
        <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-800">Pagamenti online</h1>
                <p className="text-gray-500 mt-1">
                    Ricevi i pagamenti dei clienti direttamente sul conto del tuo locale tramite Stripe.
                </p>
            </div>

            {error ? (
                <div className="bg-white p-6 rounded-xl shadow-lg flex items-center gap-3 text-red-600">
                    <ExclamationTriangleIcon className="w-6 h-6 shrink-0" />
                    {error}
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <div className="bg-white p-6 rounded-xl shadow-lg">
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <CreditCardIcon className="w-8 h-8 text-gray-700" />
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-800">Account Stripe</h3>
                                        <p className="text-sm text-gray-500">Carte, Apple Pay e Google Pay</p>
                                    </div>
                                </div>
                                <button onClick={load} disabled={loading} className="btn-secondary flex items-center text-sm" title="Aggiorna stato">
                                    <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                                </button>
                            </div>

                            {!status?.platformConfigured && (
                                <div className="mb-4 flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
                                    <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
                                    I pagamenti online non sono ancora disponibili sulla piattaforma.
                                </div>
                            )}

                            <div className="flex items-center gap-2 mb-4">
                                {active ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700">
                                        <CheckCircleIcon className="w-4 h-4" /> Attivi
                                    </span>
                                ) : connected ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-700">
                                        Configurazione da completare
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-600">
                                        Non collegato
                                    </span>
                                )}
                            </div>

                            <p className="text-sm text-gray-600 mb-6">
                                {active
                                    ? 'I clienti possono pagare online dal menu. Gli incassi vengono versati sul conto indicato in Stripe.'
                                    : connected
                                        ? status?.detailsSubmitted
                                            ? 'Stripe sta verificando i dati inseriti. Riceverai la conferma a breve; se richiesto, completa le informazioni mancanti.'
                                            : 'Completa la configurazione su Stripe (dati del locale e IBAN) per attivare i pagamenti online.'
                                        : 'Collega il tuo locale a Stripe: ti verranno chiesti i dati dell’attività e l’IBAN su cui ricevere gli incassi.'}
                            </p>

                            <div className="flex flex-wrap gap-3">
                                {!active && (
                                    <button
                                        onClick={handleOnboard}
                                        disabled={busy || !status?.platformConfigured}
                                        className="btn-primary flex items-center disabled:opacity-50"
                                    >
                                        {connected ? 'Completa configurazione' : 'Collega Stripe'}
                                    </button>
                                )}
                                {connected && status?.detailsSubmitted && (
                                    <button
                                        onClick={handleOpenDashboard}
                                        disabled={busy}
                                        className="btn-secondary flex items-center disabled:opacity-50"
                                    >
                                        <ArrowTopRightOnSquareIcon className="w-5 h-5 mr-2" />
                                        Apri dashboard Stripe
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="lg:col-span-3 order-last">
                        <div className="bg-white p-6 rounded-xl shadow-lg">
                            <h3 className="text-xl font-bold text-gray-800 mb-1">Pagamento anticipato</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Se attivo, l'ordine arriva in cucina (e viene stampato) solo dopo che il cliente ha pagato online.
                                Gli ordini non pagati entro 15 minuti vengono annullati.
                            </p>
                            {!active && (
                                <div className="mb-4 flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
                                    <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
                                    Attiva i pagamenti online con Stripe per poter richiedere il pagamento anticipato.
                                </div>
                            )}
                            <div className="divide-y divide-gray-100">
                                <div className="flex items-center justify-between gap-4 py-3">
                                    <div>
                                        <p className="font-semibold text-gray-800">Asporto</p>
                                        <p className="text-xs text-gray-500">
                                            Per gli orari "su richiesta" l'importo viene solo autorizzato e addebitato se accetti l'ordine.
                                        </p>
                                    </div>
                                    <Switch
                                        label="Pagamento anticipato per l'asporto"
                                        checked={!!prepay?.prepaymentTakeaway}
                                        disabled={!active || savingPrepay || !prepay}
                                        onChange={v => savePrepay(v, !!prepay?.prepaymentTable)}
                                    />
                                </div>
                                <div className="flex items-center justify-between gap-4 py-3">
                                    <div>
                                        <p className="font-semibold text-gray-800">Al tavolo</p>
                                        <p className="text-xs text-gray-500">Ogni cliente paga la propria comanda prima che arrivi in cucina.</p>
                                    </div>
                                    <Switch
                                        label="Pagamento anticipato al tavolo"
                                        checked={!!prepay?.prepaymentTable}
                                        disabled={!active || savingPrepay || !prepay}
                                        onChange={v => savePrepay(!!prepay?.prepaymentTakeaway, v)}
                                    />
                                </div>
                            </div>
                            {!active && (prepay?.prepaymentTakeaway || prepay?.prepaymentTable) && (
                                <p className="text-xs text-gray-500 mt-2">
                                    Stripe non è attivo: il pagamento anticipato è sospeso finché i pagamenti non tornano attivi.
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-xl shadow-lg">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Commissioni</h3>
                            <p className="text-sm text-gray-500 mb-4">Trattenute automaticamente su ogni pagamento online.</p>
                            <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                <span className="text-sm text-gray-600">Commissione piattaforma</span>
                                <span className="font-bold text-gray-800">{formatBps(status?.applicationFeeBps ?? 0)}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-3">
                                Alle commissioni della piattaforma si aggiungono quelle di Stripe, visibili nella dashboard Stripe.
                                I rimborsi restituiscono anche la commissione della piattaforma.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentsSettingsPage;
