import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {AnimatePresence, motion} from 'framer-motion';
import {
    Bike, CheckCircle2, ChevronDown, Clock, MapPin, Navigation, Phone, RefreshCw, Route, StickyNote, PackageCheck, Banknote, CreditCard,
} from 'lucide-react';
import {useData} from '../../Context/DataContext';
import {useNotification} from '../../Context/NotificationContext';
import {DeliveryRouteInfo, getDeliveryOrdersApi, getDeliveryRouteInfoApi, setDeliveryStageApi} from '../../Utilities/api';
import {googleMapsTripUrls, MAX_WAYPOINTS, planRoute, stopOf} from '../../Client/delivery/route';
import {DeliveryStage} from '../../deliveryTypes';
import {
    DeliveryComand, deliveryTimeLabel, deliveryTimeValue, deliveryTotalCents, formatEurCents, formatKm, getDelivery,
    isAppleDevice, mapsLinks, paymentLabel, PAYMENT_METHOD_LABEL, STAGE_META, telHref,
} from '../../Components/Dashboard/delivery/deliveryUtils';
import {PaymentChip} from '../../Components/Dashboard/delivery/DeliveryInfo';

const POLL_MS = 30_000

const KITCHEN_LABEL: Record<string, string> = {
    AWAIT: 'Nuovo', PENDING: 'In attesa', PROGRESS: 'In cucina', COMPLETED: 'Pronto', AWAIT_APPROVAL: 'Da approvare',
    AWAIT_PAYMENT: 'Attende pagamento', DELETED: 'Annullato',
}

const TABS: { stage: DeliveryStage, label: string }[] = [
    {stage: 'PREPARING', label: 'Da preparare'},
    {stage: 'OUT_FOR_DELIVERY', label: 'In consegna'},
    {stage: 'DELIVERED', label: 'Consegnate'},
]

const stageOf = (c: DeliveryComand): DeliveryStage => getDelivery(c)?.stage || 'PREPARING'

const itemsCount = (c: DeliveryComand) =>
    (c.orders || []).reduce((s, o) => s + (o.products || []).reduce((ps, p) => ps + p.quantity, 0), 0)

// ─── Card ────────────────────────────────────────────────────────────────────

interface CardProps {
    c: DeliveryComand
    busy: boolean
    onStage: (c: DeliveryComand, stage: 'OUT_FOR_DELIVERY' | 'DELIVERED', cashCollected?: boolean) => void
    /** Numero della tappa nel giro pianificato. */
    stop?: number
}

const BigButton: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement> & React.ButtonHTMLAttributes<HTMLButtonElement> & { tone: string, as?: 'a' | 'button' }> =
    ({tone, as = 'button', className = '', children, ...rest}) => {
        const cls = `flex-1 min-h-[52px] inline-flex items-center justify-center gap-2 rounded-2xl text-base font-bold active:scale-[0.98] transition-all disabled:opacity-50 ${tone} ${className}`
        return as === 'a'
            ? <a className={cls} {...(rest as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>{children}</a>
            : <button type="button" className={cls} {...(rest as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>
    }

const DeliveryCard: React.FC<CardProps> = ({c, busy, onStage, stop}) => {
    const d = getDelivery(c)!
    const stage = stageOf(c)
    const [open, setOpen] = useState(false)
    const pay = paymentLabel(c)
    const [collected, setCollected] = useState<boolean>(!!d.cashCollected)
    useEffect(() => setCollected(!!d.cashCollected), [d.cashCollected])
    const links = mapsLinks(d)
    const apple = isAppleDevice()
    const tel = telHref(c.phone)
    const total = deliveryTotalCents(c)
    const payOnDelivery = d.paymentChoice !== 'ONLINE' && !c.paid
    const extra = [d.intercom && `Citofono ${d.intercom}`, d.floor && `Piano ${d.floor}`].filter(Boolean).join(' · ')
    const meta = STAGE_META[stage]

    const confirmDelivered = () => {
        if (payOnDelivery && !collected) {
            const ok = window.confirm(`Non hai segnato l'incasso di ${formatEurCents(total)}. Confermi la consegna senza incasso?`)
            if (!ok) return
        }
        onStage(c, 'DELIVERED', payOnDelivery ? collected : undefined)
    }

    return (
        <motion.article layout initial={{opacity: 0, y: 12}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, scale: 0.97}}
                        transition={{duration: 0.25}}
                        className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden" data-testid="rider-card">
            {/* Orario + fase */}
            <div className="flex items-center justify-between gap-3 px-4 pt-4">
                <div className="flex items-center gap-2">
                    {stop !== undefined && (
                        <span aria-label={`Tappa ${stop}`}
                              className="min-w-8 h-8 px-1.5 rounded-full bg-primary-500 text-white text-base font-black tabular-nums inline-flex items-center justify-center">
                            {stop}
                        </span>
                    )}
                    <Clock className="w-5 h-5 text-gray-400"/>
                    <span className="text-2xl font-black text-gray-900 tabular-nums">{deliveryTimeLabel(c.time) || '--:--'}</span>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${meta.chip}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`}/>{meta.label}
                    </span>
                    {stage === 'PREPARING' && (
                        <span className="text-[11px] font-semibold text-gray-500">Cucina: {KITCHEN_LABEL[c.status] ?? c.status}</span>
                    )}
                </div>
            </div>

            {/* Cliente + indirizzo */}
            <div className="px-4 pt-2 pb-3">
                {c.name && <p className="text-base font-bold text-gray-800">{c.name}</p>}
                <div className="flex items-start gap-2 mt-1">
                    <MapPin className="w-5 h-5 text-violet-600 shrink-0 mt-0.5"/>
                    <div className="min-w-0">
                        <p className="text-[17px] leading-snug font-semibold text-gray-900 break-words">{d.label}</p>
                        {extra && <p className="text-sm font-semibold text-gray-600 mt-0.5">{extra}</p>}
                        <p className="text-xs text-gray-400 mt-0.5">{formatKm(d.distanceKm)}</p>
                    </div>
                </div>
                {d.notes && (
                    <p className="mt-2 flex items-start gap-2 text-sm text-amber-900 bg-amber-50 rounded-xl px-3 py-2">
                        <StickyNote className="w-4 h-4 mt-0.5 shrink-0"/>{d.notes}
                    </p>
                )}
                <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                    <PaymentChip delivery={d} paid={c.paid} totalCents={total} large/>
                    <button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open}
                            className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 py-1">
                        {itemsCount(c)} articoli <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}/>
                    </button>
                </div>
                <AnimatePresence initial={false}>
                    {open && (
                        <motion.ul initial={{height: 0, opacity: 0}} animate={{height: 'auto', opacity: 1}} exit={{height: 0, opacity: 0}}
                                   className="mt-2 overflow-hidden text-sm text-gray-700 divide-y divide-gray-100 rounded-xl bg-gray-50 px-3">
                            {(c.orders || []).flatMap(o => o.products || []).map((p, i) => (
                                <li key={i} className="py-1.5 flex gap-2">
                                    <span className="font-bold tabular-nums">{p.quantity}×</span>
                                    <span className="flex-1">{p.productName}
                                        {(p.selectedVariants || []).length > 0 &&
                                            <span className="text-gray-400"> · {p.selectedVariants!.map(v => v.choiceName).join(', ')}</span>}
                                    </span>
                                </li>
                            ))}
                        </motion.ul>
                    )}
                </AnimatePresence>
            </div>

            {/* Incasso alla consegna */}
            {stage === 'OUT_FOR_DELIVERY' && payOnDelivery && (
                <label className={`mx-4 mb-3 flex items-center gap-3 rounded-2xl border-2 px-4 py-3 cursor-pointer select-none ${
                    collected ? 'border-emerald-500 bg-emerald-50' : 'border-amber-300 bg-amber-50'
                }`}>
                    <input type="checkbox" className="w-6 h-6 accent-emerald-600" checked={collected} onChange={e => setCollected(e.target.checked)}/>
                    {d.paymentChoice === 'CARD' ? <CreditCard className="w-5 h-5 text-gray-700"/> : <Banknote className="w-5 h-5 text-gray-700"/>}
                    <span className="text-base font-bold text-gray-900">
                        Incassato {formatEurCents(total)} {PAYMENT_METHOD_LABEL[d.paymentChoice as 'CASH' | 'CARD']}
                    </span>
                </label>
            )}

            {/* Azioni */}
            {stage !== 'DELIVERED' ? (
                <div className="px-4 pb-4 space-y-2">
                    <div className="flex gap-2">
                        <BigButton as="a" href={apple ? links.apple : links.google} target="_blank" rel="noopener noreferrer"
                                   tone="bg-gray-900 text-white hover:bg-gray-800">
                            <Navigation className="w-5 h-5"/> Naviga
                        </BigButton>
                        {tel && (
                            <BigButton as="a" href={tel} tone="bg-white text-gray-900 border-2 border-gray-200 hover:bg-gray-50">
                                <Phone className="w-5 h-5"/> Chiama
                            </BigButton>
                        )}
                    </div>
                    <p className="text-center text-xs text-gray-400">
                        Apri con{' '}
                        <a href={links.google} target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-600 underline">Google Maps</a>
                        {' '}o{' '}
                        <a href={links.apple} target="_blank" rel="noopener noreferrer" className="font-semibold text-gray-600 underline">Apple Maps</a>
                    </p>
                    {stage === 'PREPARING' ? (
                        <BigButton tone="w-full bg-sky-600 text-white hover:bg-sky-700 shadow-lg shadow-sky-600/20" disabled={busy}
                                   onClick={() => onStage(c, 'OUT_FOR_DELIVERY')}>
                            <Bike className="w-6 h-6"/> {busy ? 'Un attimo…' : 'Parto'}
                        </BigButton>
                    ) : (
                        <BigButton tone="w-full bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20" disabled={busy}
                                   onClick={confirmDelivered}>
                            <PackageCheck className="w-6 h-6"/> {busy ? 'Un attimo…' : 'Consegnato'}
                        </BigButton>
                    )}
                </div>
            ) : (
                <div className="px-4 pb-4 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                    <CheckCircle2 className="w-5 h-5"/> Consegnato{pay.collected ? ' · incassato' : ''}
                    {c.updatedAt && <span className="text-gray-400 font-normal">alle {new Date(c.updatedAt).toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'})}</span>}
                </div>
            )}
        </motion.article>
    )
}

// ─── Giro delle consegne ───────────────────────────────────────────────────────

/** Riquadro sopra le consegne in uscita: ordine pianificato e apertura del giro completo in Google Maps. */
const TripCard: React.FC<{ urls: string[], stops: number }> = ({urls, stops}) => (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-4 space-y-2" data-testid="rider-trip">
        <p className="flex items-center gap-2 text-base font-bold text-gray-900">
            <Route className="w-5 h-5 text-primary-600"/> Giro di {stops} {stops === 1 ? 'consegna' : 'consegne'}
        </p>
        <p className="text-sm text-gray-500">
            Ordinate dalla più vicina al locale. Le consegne senza posizione sulla mappa sono in fondo.
        </p>
        {urls.length > 1 && (
            <p className="text-sm font-semibold text-amber-700">
                Google Maps accetta {MAX_WAYPOINTS + 1} tappe per volta: il giro è diviso in {urls.length} tratte.
            </p>
        )}
        <div className="space-y-2 pt-1">
            {urls.map((u, i) => (
                <BigButton key={u} as="a" href={u} target="_blank" rel="noopener noreferrer"
                           tone={`w-full ${i === 0 ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-white text-gray-900 border-2 border-gray-200 hover:bg-gray-50'}`}>
                    <Navigation className="w-5 h-5"/> {urls.length > 1 ? `Avvia giro · tratta ${i + 1}` : 'Avvia giro'}
                </BigButton>
            ))}
        </div>
    </div>
)

// ─── Page ────────────────────────────────────────────────────────────────────

const RiderPage: React.FC = () => {
    const {orderEventTick} = useData()
    const {addNotification} = useNotification()
    const [list, setList] = useState<DeliveryComand[] | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [tab, setTab] = useState<DeliveryStage | null>(null)
    const [busyId, setBusyId] = useState<string | null>(null)
    const [refreshing, setRefreshing] = useState(false)
    const [routeInfo, setRouteInfo] = useState<DeliveryRouteInfo | null>(null)
    const inflight = useRef(false)

    const load = useCallback(async (manual = false) => {
        if (inflight.current) return
        inflight.current = true
        if (manual) setRefreshing(true)
        // Impostazione del percorso e punto di partenza: errori ignorati (si resta all'ordine per orario)
        getDeliveryRouteInfoApi().then(ri => { if (ri.success && ri.data) setRouteInfo(ri.data) }).catch(() => undefined)
        const r = await getDeliveryOrdersApi()
        inflight.current = false
        setRefreshing(false)
        if (r.success && Array.isArray(r.data)) {
            setList((r.data as DeliveryComand[]).filter(c => !!getDelivery(c) && c.status !== 'DELETED' && c.status !== 'AWAIT_PAYMENT'))
            setError(null)
        } else {
            setError(r.status === 403 ? 'Non hai i permessi per vedere le consegne.' : (r.message || 'Impossibile caricare le consegne.'))
            setList(l => l ?? [])
        }
    }, [])

    // Primo caricamento + polling di riserva + ritorno in primo piano
    useEffect(() => {
        load()
        const t = setInterval(() => { if (document.visibilityState === 'visible') load() }, POLL_MS)
        const onVis = () => { if (document.visibilityState === 'visible') load() }
        document.addEventListener('visibilitychange', onVis)
        return () => { clearInterval(t); document.removeEventListener('visibilitychange', onVis) }
    }, [load])

    // Aggiornamenti in tempo reale (SSE della dashboard): ogni evento ordine ricarica la lista
    useEffect(() => {
        if (orderEventTick === 0) return
        const t = setTimeout(() => load(), 250)
        return () => clearTimeout(t)
    }, [orderEventTick, load])

    const sorted = useMemo(() => [...(list ?? [])].sort((a, b) => deliveryTimeValue(a) - deliveryTimeValue(b)), [list])
    const counts = useMemo(() => {
        const m: Record<DeliveryStage, number> = {PREPARING: 0, OUT_FOR_DELIVERY: 0, DELIVERED: 0}
        sorted.forEach(c => { m[stageOf(c)]++ })
        return m
    }, [sorted])

    // Scheda iniziale: quella con lavoro da fare
    useEffect(() => {
        if (tab || !list) return
        setTab(counts.OUT_FOR_DELIVERY > 0 ? 'OUT_FOR_DELIVERY' : counts.PREPARING > 0 ? 'PREPARING' : 'PREPARING')
    }, [list, counts, tab])

    const activeTab = tab ?? 'PREPARING'
    // Giro pianificato: solo per le consegne in uscita e se il locale ha attivato il calcolo del percorso
    const planned = !!routeInfo?.routePlanning && activeTab === 'OUT_FOR_DELIVERY'
    const origin = routeInfo ? {lat: routeInfo.originLat ?? undefined, lng: routeInfo.originLng ?? undefined} : null
    let shown = sorted.filter(c => stageOf(c) === activeTab)
    // Consegnate: le più recenti in alto
    if (activeTab === 'DELIVERED') shown.reverse()
    if (planned) shown = planRoute(shown, origin, c => getDelivery(c), deliveryTimeValue)
    const tripUrls = planned ? googleMapsTripUrls(origin, shown.map(c => stopOf(getDelivery(c), getDelivery(c)?.label || c.address))) : []

    const changeStage = async (c: DeliveryComand, stage: 'OUT_FOR_DELIVERY' | 'DELIVERED', cashCollected?: boolean) => {
        if (!c.id) return
        setBusyId(c.id)
        const r = await setDeliveryStageApi(c.id, stage, cashCollected)
        setBusyId(null)
        if (r.success) {
            setList(l => (l ?? []).map(x => x.id !== c.id ? x : {
                ...x,
                updatedAt: new Date().toISOString(),
                delivery: {...getDelivery(x)!, stage, ...(cashCollected !== undefined ? {cashCollected} : {})},
            }))
            addNotification({message: stage === 'OUT_FOR_DELIVERY' ? 'Buona consegna!' : 'Consegna completata', type: 'success'})
            load()
        } else {
            addNotification({message: r.message || 'Errore: riprova', type: 'error'})
        }
    }

    return (
        <div className="max-w-xl mx-auto pb-10" data-testid="rider-page">
            <div className="flex items-end justify-between gap-3 mb-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Consegne di oggi</h1>
                    <p className="text-sm text-gray-500">
                        {new Date().toLocaleDateString('it-IT', {weekday: 'long', day: 'numeric', month: 'long'})}
                        {list && ` · ${sorted.length} ${sorted.length === 1 ? 'consegna' : 'consegne'}`}
                    </p>
                </div>
                <button type="button" onClick={() => load(true)} aria-label="Aggiorna"
                        className="w-11 h-11 rounded-2xl bg-white border border-gray-200 flex items-center justify-center text-gray-600 active:scale-95">
                    <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`}/>
                </button>
            </div>

            {/* Filtri */}
            <div className="sticky top-14 z-20 -mx-3 px-3 py-2 bg-slate-100/95 backdrop-blur">
                <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-white border border-gray-200" role="tablist">
                    {TABS.map(t => {
                        const active = activeTab === t.stage
                        return (
                            <button key={t.stage} type="button" role="tab" aria-selected={active} onClick={() => setTab(t.stage)}
                                    className={`relative py-2.5 rounded-xl text-sm font-bold transition-colors ${active ? 'text-white' : 'text-gray-600'}`}>
                                {active && <motion.span layoutId="rider-tab" className="absolute inset-0 rounded-xl bg-gray-900" transition={{type: 'spring', stiffness: 500, damping: 40}}/>}
                                <span className="relative">{t.label}
                                    <span className={`ml-1 tabular-nums ${active ? 'text-white/70' : 'text-gray-400'}`}>{counts[t.stage]}</span>
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>

            {error && <p className="mt-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">{error}</p>}

            {list === null ? (
                <div className="mt-4 space-y-3">
                    {[0, 1].map(i => <div key={i} className="h-56 rounded-3xl bg-white animate-pulse"/>)}
                </div>
            ) : shown.length === 0 ? (
                <div className="mt-10 text-center text-gray-400">
                    <Bike className="w-12 h-12 mx-auto mb-2 opacity-40"/>
                    <p className="font-semibold">
                        {activeTab === 'PREPARING' ? 'Nessuna consegna da preparare' : activeTab === 'OUT_FOR_DELIVERY' ? 'Nessuna consegna in corso' : 'Ancora nessuna consegna completata'}
                    </p>
                    <p className="text-sm mt-1">La lista si aggiorna da sola quando arriva un ordine.</p>
                </div>
            ) : (
                <motion.div layout className="mt-3 space-y-3">
                    {planned && <TripCard urls={tripUrls} stops={shown.length}/>}
                    <AnimatePresence initial={false}>
                        {shown.map((c, i) => (
                            <DeliveryCard key={c.id} c={c} busy={busyId === c.id} onStage={changeStage} stop={planned ? i + 1 : undefined}/>
                        ))}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    )
}

export default RiderPage;
