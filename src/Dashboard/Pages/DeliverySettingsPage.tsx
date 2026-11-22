import React, {Suspense, lazy, useEffect, useMemo, useState} from 'react';
import {motion} from 'framer-motion';
import {Link, useNavigate, useParams} from 'react-router-dom';
import {
    AlertCircle, Banknote, Bike, Clock, CreditCard, Gift, MapPin, MessageSquareText, Plus, Route, Save, Search, Trash2, Wallet,
} from 'lucide-react';
import {useNotification} from '../../Context/NotificationContext';
import {useLoginContext} from '../../Context/LoginContext';
import {useData} from '../../Context/DataContext';
import {IS_ADMIN} from '../../types';
import {getDeliverySettingsApi, geoSearchApi, getTakeawaySlotConfigApi, saveDeliverySettingsApi, type TimeRange} from '../../Utilities/api';
import {DeliveryPaymentMode, DeliverySettings, GeoResult, OnDeliveryMethod} from '../../deliveryTypes';
import CustomLoading from '../../Components/CustomLoading';
import {ZONE_COLORS} from '../../Components/Dashboard/delivery/DeliveryZonesMap';
import {DELIVERY_SETTINGS_CHANGED} from '../../Hooks/useDeliveryEnabled';

// Leaflet solo quando si apre questa pagina
const DeliveryZonesMap = lazy(() => import('../../Components/Dashboard/delivery/DeliveryZonesMap'));

// ─── Form (stringhe per gli importi in €, convertiti al salvataggio) ───────────

interface ZoneForm { maxKm: string, fee: string, min: string }

interface FormState {
    enabled: boolean
    originLat: number | null
    originLng: number | null
    originAddress: string
    zones: ZoneForm[]
    freeOver: string
    paymentMode: DeliveryPaymentMode
    onDeliveryMethods: OnDeliveryMethod[]
    slotMinutes: string
    deliveriesPerSlot: string
    leadMinutes: string
    requirePhoneOtpTakeaway: boolean
    routePlanning: boolean
    /** null = stessi orari dell'asporto */
    weeklyHours: Record<string, TimeRange[]> | null
}

/** Campi in più che il server restituisce oltre al contratto condiviso. */
type ServerSettings = DeliverySettings & {
    weeklyHours?: Record<string, TimeRange[]> | null
    /** Stripe/SumUp configurato: serve per il pagamento online */
    onlinePaymentAvailable?: boolean
}

const DAYS: { key: string, short: string }[] = [
    {key: 'MONDAY', short: 'Lun'}, {key: 'TUESDAY', short: 'Mar'}, {key: 'WEDNESDAY', short: 'Mer'}, {key: 'THURSDAY', short: 'Gio'},
    {key: 'FRIDAY', short: 'Ven'}, {key: 'SATURDAY', short: 'Sab'}, {key: 'SUNDAY', short: 'Dom'},
]

const DEFAULTS: DeliverySettings = {
    enabled: false,
    originLat: null, originLng: null, originAddress: null,
    zones: [{maxKm: 3, feeCents: 200, minOrderCents: 1500}, {maxKm: 6, feeCents: 350, minOrderCents: 2000}],
    freeDeliveryOverCents: null,
    paymentMode: 'CUSTOMER_CHOICE',
    onDeliveryMethods: ['CASH', 'CARD'],
    slotMinutes: 15, deliveriesPerSlot: 3, leadMinutes: 30,
    requirePhoneOtpTakeaway: false,
    routePlanning: false,
}

const centsToEur = (c: number | null | undefined) => c == null ? '' : (c / 100).toFixed(2).replace('.', ',').replace(/,00$/, '')
const eurToCents = (v: string): number | null => {
    const t = v.trim().replace(',', '.')
    if (t === '') return null
    const n = Number(t)
    return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : NaN
}
const kmToStr = (km: number) => String(km).replace('.', ',')
const strToNum = (v: string) => { const t = v.trim().replace(',', '.'); return t === '' ? NaN : Number(t) }

const toForm = (s: ServerSettings): FormState => ({
    enabled: !!s.enabled,
    originLat: s.originLat ?? null,
    originLng: s.originLng ?? null,
    originAddress: s.originAddress ?? '',
    zones: (s.zones?.length ? [...s.zones].sort((a, b) => a.maxKm - b.maxKm) : []).map(z => ({
        maxKm: kmToStr(z.maxKm), fee: centsToEur(z.feeCents), min: centsToEur(z.minOrderCents),
    })),
    freeOver: centsToEur(s.freeDeliveryOverCents),
    paymentMode: s.paymentMode || 'CUSTOMER_CHOICE',
    onDeliveryMethods: s.onDeliveryMethods?.length ? s.onDeliveryMethods : [],
    slotMinutes: String(s.slotMinutes ?? 15),
    deliveriesPerSlot: String(s.deliveriesPerSlot ?? 3),
    leadMinutes: String(s.leadMinutes ?? 30),
    requirePhoneOtpTakeaway: !!s.requirePhoneOtpTakeaway,
    routePlanning: !!s.routePlanning,
    weeklyHours: s.weeklyHours ?? null,
})

type Errors = Partial<Record<'origin' | 'zones' | 'freeOver' | 'methods' | 'slotMinutes' | 'deliveriesPerSlot' | 'leadMinutes' | 'hours', string>> & {
    zoneRows?: Record<number, string>
}

const validate = (f: FormState): { errors: Errors, payload: ServerSettings | null } => {
    const errors: Errors = {}
    const zoneRows: Record<number, string> = {}
    const zones = f.zones.map((z, i) => {
        const km = strToNum(z.maxKm), fee = eurToCents(z.fee), min = eurToCents(z.min)
        if (!Number.isFinite(km) || km <= 0) zoneRows[i] = 'Indica la distanza massima in km (maggiore di 0).'
        else if (km > 50) zoneRows[i] = 'Massimo 50 km in linea d\'aria.'
        else if (fee === null || Number.isNaN(fee)) zoneRows[i] = 'Indica la tariffa (0 per consegna gratuita).'
        else if (min !== null && Number.isNaN(min)) zoneRows[i] = 'Ordine minimo non valido.'
        else if (i > 0 && km <= strToNum(f.zones[i - 1].maxKm)) zoneRows[i] = 'Ogni zona deve arrivare più lontano della precedente.'
        return {maxKm: km, feeCents: fee ?? 0, minOrderCents: min ?? 0}
    })
    if (Object.keys(zoneRows).length) errors.zoneRows = zoneRows
    if (f.zones.length === 0 && f.enabled) errors.zones = 'Aggiungi almeno una zona di consegna.'
    if (f.enabled && (f.originLat == null || f.originLng == null)) errors.origin = 'Imposta il punto di partenza: cerca l\'indirizzo o clicca sulla mappa.'
    const freeOver = eurToCents(f.freeOver)
    if (freeOver !== null && (Number.isNaN(freeOver) || freeOver <= 0)) errors.freeOver = 'Importo non valido (lascia vuoto per disattivare).'
    if (f.paymentMode !== 'ONLINE_REQUIRED' && f.onDeliveryMethods.length === 0) errors.methods = 'Scegli almeno un metodo di pagamento alla consegna.'
    const slot = Number(f.slotMinutes), per = Number(f.deliveriesPerSlot), lead = Number(f.leadMinutes)
    if (!Number.isInteger(slot) || slot < 5 || slot > 120) errors.slotMinutes = 'Tra 5 e 120 minuti.'
    if (!Number.isInteger(per) || per < 1 || per > 50) errors.deliveriesPerSlot = 'Tra 1 e 50 consegne per fascia.'
    if (f.weeklyHours) {
        const bad = Object.values(f.weeklyHours).some(rs => rs.some(r => !/^\d{2}:\d{2}$/.test(r.start) || !/^\d{2}:\d{2}$/.test(r.end) || r.start >= r.end))
        if (bad) errors.hours = 'Controlla gli orari: ogni fascia deve finire dopo l\'inizio.'
        else if (f.enabled && !Object.values(f.weeklyHours).some(rs => rs.length > 0)) errors.hours = 'Aggiungi almeno un orario di consegna.'
    }
    if (!Number.isInteger(lead) || lead < 0 || lead > 1440) errors.leadMinutes = 'Tra 0 e 1440 minuti.'

    const hasErrors = Object.keys(errors).length > 0
    return {
        errors,
        payload: hasErrors ? null : {
            enabled: f.enabled,
            originLat: f.originLat, originLng: f.originLng,
            originAddress: f.originAddress.trim() || null,
            zones,
            freeDeliveryOverCents: freeOver,
            paymentMode: f.paymentMode,
            onDeliveryMethods: f.paymentMode === 'ONLINE_REQUIRED' ? [] : f.onDeliveryMethods,
            slotMinutes: slot, deliveriesPerSlot: per, leadMinutes: lead,
            requirePhoneOtpTakeaway: f.requirePhoneOtpTakeaway,
            routePlanning: f.routePlanning,
            weeklyHours: f.weeklyHours,
        },
    }
}

// ─── UI helpers ────────────────────────────────────────────────────────────────

const cardVariant = {
    hidden: {opacity: 0, y: 16},
    show: {opacity: 1, y: 0, transition: {duration: 0.4, ease: [0.22, 1, 0.36, 1]}},
}

const Section: React.FC<{ icon: React.ElementType, title: string, subtitle?: string, children: React.ReactNode, className?: string }> =
    ({icon: Icon, title, subtitle, children, className = ''}) => (
        <motion.section variants={cardVariant} className={`bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 ${className}`}>
            <div className="flex items-start gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5"/>
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-800 leading-tight">{title}</h2>
                    {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
                </div>
            </div>
            {children}
        </motion.section>
    )

const Switch: React.FC<{ checked: boolean, onChange: (v: boolean) => void, label: string, id?: string, disabled?: boolean, describedBy?: string }> = ({checked, onChange, label, id, disabled, describedBy}) => (
    <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        aria-describedby={describedBy}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 disabled:opacity-50 disabled:cursor-not-allowed ${checked ? 'bg-emerald-500' : 'bg-gray-300'}`}
    >
        <span className={`inline-block h-6 w-6 rounded-full bg-white shadow transform transition-transform ${checked ? 'translate-x-[22px]' : 'translate-x-0.5'}`}/>
    </button>
)

const FieldError: React.FC<{ msg?: string }> = ({msg}) => msg
    ? <p className="mt-1 text-xs font-medium text-red-600 flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5"/>{msg}</p>
    : null

const EuroInput: React.FC<{ value: string, onChange: (v: string) => void, placeholder?: string, ariaLabel: string, invalid?: boolean }> =
    ({value, onChange, placeholder, ariaLabel, invalid}) => (
        <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
            <input inputMode="decimal" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                   aria-label={ariaLabel}
                   className={`input-style !pl-8 ${invalid ? 'border-red-400' : ''}`}/>
        </div>
    )

const PAYMENT_MODES: { value: DeliveryPaymentMode, title: string, desc: string, icon: React.ElementType }[] = [
    {value: 'ONLINE_REQUIRED', title: 'Online obbligatorio', desc: 'Il cliente paga con carta al momento dell\'ordine.', icon: CreditCard},
    {value: 'CUSTOMER_CHOICE', title: 'A scelta del cliente', desc: 'Online oppure alla consegna, decide il cliente.', icon: Wallet},
    {value: 'ON_DELIVERY_ONLY', title: 'Solo alla consegna', desc: 'Il rider incassa alla porta.', icon: Banknote},
]

// ─── Page ──────────────────────────────────────────────────────────────────────

const DeliverySettingsPage: React.FC = () => {
    const {addNotification} = useNotification()
    const {user, checkVariable} = useLoginContext()
    const {styles} = useData()
    const {localname} = useParams()
    const navigate = useNavigate()

    const [form, setForm] = useState<FormState | null>(null)
    const [dirty, setDirty] = useState(false)
    const [saving, setSaving] = useState(false)
    const [showErrors, setShowErrors] = useState(false)
    const [loadError, setLoadError] = useState<string | null>(null)
    const [onlineAvailable, setOnlineAvailable] = useState<boolean | null>(null)
    /** false = verifica SMS non attiva sul server (nessuna chiave Prelude): l'opzione per l'asporto non ha effetto */
    const [smsAvailable, setSmsAvailable] = useState<boolean | null>(null)

    const [query, setQuery] = useState('')
    const [searching, setSearching] = useState(false)
    const [results, setResults] = useState<GeoResult[] | null>(null)
    const [searchError, setSearchError] = useState<string | null>(null)

    useEffect(() => {
        if (user && !checkVariable(IS_ADMIN)) navigate(`/${localname}/Dashboard/Home`, {replace: true})
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user])

    useEffect(() => {
        getDeliverySettingsApi().then(r => {
            if (r.success && r.data && typeof r.data.enabled === 'boolean') {
                const data = r.data as ServerSettings
                if (typeof data.onlinePaymentAvailable === 'boolean') setOnlineAvailable(data.onlinePaymentAvailable)
                if (typeof data.phoneVerification === 'boolean') setSmsAvailable(data.phoneVerification)
                const f = toForm({...DEFAULTS, ...data, zones: data.zones ?? []})
                setForm(f)
                setQuery(f.originAddress)
            } else if (r.status === 404 || (r.success && !r.data)) {
                // Mai configurato: si parte dai valori suggeriti
                setForm(toForm(DEFAULTS))
            } else {
                setLoadError(r.message || 'Impossibile caricare le impostazioni.')
                setForm(toForm(DEFAULTS))
            }
        })
    }, [])

    // Primo accesso: suggerisce l'indirizzo del locale
    useEffect(() => {
        if (form && !query && !form.originAddress && styles?.address) setQuery(styles.address)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [form === null, styles?.address])

    const update = (patch: Partial<FormState>) => {
        setForm(f => f ? {...f, ...patch} : f)
        setDirty(true)
    }
    const updateZone = (i: number, patch: Partial<ZoneForm>) =>
        form && update({zones: form.zones.map((z, idx) => idx === i ? {...z, ...patch} : z)})

    // Orari dedicati: si parte da quelli dell'asporto
    const enableOwnHours = async (on: boolean) => {
        if (!on) { update({weeklyHours: null}); return }
        const r = await getTakeawaySlotConfigApi()
        const base: Record<string, TimeRange[]> = r.success && r.data?.weeklyHours ? r.data.weeklyHours : {}
        update({weeklyHours: Object.fromEntries(DAYS.map(d => [d.key, (base[d.key] ?? []).map(x => ({...x}))]))})
    }
    const setDayRanges = (day: string, ranges: TimeRange[]) =>
        form?.weeklyHours && update({weeklyHours: {...form.weeklyHours, [day]: ranges}})

    const {errors, payload} = useMemo(() => form ? validate(form) : {errors: {} as Errors, payload: null}, [form])
    const err = showErrors ? errors : {}

    const zonesKm = useMemo(() => (form?.zones ?? []).map(z => strToNum(z.maxKm)), [form?.zones])
    const origin = form && form.originLat != null && form.originLng != null ? {lat: form.originLat, lng: form.originLng} : null

    const runSearch = async (e?: React.FormEvent) => {
        e?.preventDefault()
        const q = query.trim()
        if (q.length < 3 || !localname) {
            setSearchError('Scrivi almeno via e città.')
            return
        }
        setSearching(true)
        setSearchError(null)
        const r = await geoSearchApi(localname, q)
        setSearching(false)
        if (r.success && Array.isArray(r.data)) {
            setResults(r.data)
            if (r.data.length === 0) setSearchError('Nessun indirizzo trovato. Prova ad aggiungere la città o il CAP.')
            if (r.data.length === 1) pickResult(r.data[0])
        } else {
            setResults(null)
            setSearchError(r.status === 429 ? 'Troppe ricerche ravvicinate: riprova tra un secondo.' : (r.message || 'Ricerca non disponibile al momento.'))
        }
    }

    const pickResult = (g: GeoResult) => {
        update({originLat: g.lat, originLng: g.lng, originAddress: g.label})
        setQuery(g.label)
        setResults(null)
    }

    const handleSave = async () => {
        setShowErrors(true)
        if (payload && onlineAvailable === false && payload.paymentMode === 'ONLINE_REQUIRED') {
            addNotification({message: "Attiva prima i pagamenti online oppure scegli un'altra modalità di pagamento", type: 'error'})
            return
        }
        if (!payload) {
            addNotification({message: 'Controlla i campi evidenziati', type: 'error'})
            return
        }
        setSaving(true)
        const r = await saveDeliverySettingsApi(payload as DeliverySettings)
        setSaving(false)
        if (r.success) {
            if (r.data && typeof r.data.enabled === 'boolean') {
                const data = r.data as ServerSettings
                if (typeof data.onlinePaymentAvailable === 'boolean') setOnlineAvailable(data.onlinePaymentAvailable)
                if (typeof data.phoneVerification === 'boolean') setSmsAvailable(data.phoneVerification)
                setForm(toForm({...DEFAULTS, ...data}))
            }
            setDirty(false)
            setShowErrors(false)
            window.dispatchEvent(new CustomEvent(DELIVERY_SETTINGS_CHANGED, {detail: payload.enabled}))
            addNotification({message: 'Impostazioni di consegna salvate', type: 'success'})
        } else {
            addNotification({message: r.message || 'Errore nel salvataggio', type: 'error'})
        }
    }

    if (!form) return <CustomLoading isFullPage={true} isTransparent={true}/>

    const onlineOnly = form.paymentMode === 'ONLINE_REQUIRED'

    return (
        <motion.div className="p-0 md:p-2 min-h-screen max-w-6xl mx-auto"
                    initial="hidden" animate="show" variants={{hidden: {opacity: 0}, show: {opacity: 1, transition: {staggerChildren: 0.06}}}}>
            {/* Header */}
            <motion.div variants={cardVariant} className="flex items-start justify-between gap-4 mb-6 flex-wrap">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Consegna a domicilio</h1>
                    <p className="text-gray-500 mt-1 text-sm max-w-2xl">
                        Zone, tariffe, pagamenti e fasce orarie delle consegne. I clienti vedono "Consegna a domicilio" nel menu solo quando è attiva.
                    </p>
                </div>
                <button onClick={handleSave} disabled={saving || !dirty}
                        className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                    <Save className="w-5 h-5"/>{saving ? 'Salvataggio…' : 'Salva impostazioni'}
                </button>
            </motion.div>

            {loadError && (
                <div className="mb-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0"/> {loadError} Puoi comunque compilare e salvare.
                </div>
            )}

            {/* Attivazione */}
            <motion.div variants={cardVariant}
                        className={`rounded-2xl p-5 mb-6 flex items-center gap-4 flex-wrap border ${form.enabled ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-100 shadow-sm'}`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${form.enabled ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                    <Bike className="w-6 h-6"/>
                </div>
                <div className="flex-1 min-w-[220px]">
                    <label htmlFor="delivery-enabled" className="text-lg font-bold text-gray-900 cursor-pointer">
                        {form.enabled ? 'Consegna a domicilio attiva' : 'Consegna a domicilio disattivata'}
                    </label>
                    <p className="text-sm text-gray-600">
                        {form.enabled
                            ? 'I clienti possono ordinare con consegna dal menu online.'
                            : 'Attivala quando hai impostato punto di partenza e zone.'}
                    </p>
                </div>
                <Switch id="delivery-enabled" checked={form.enabled} onChange={v => update({enabled: v})} label="Attiva consegna a domicilio"/>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Punto di partenza + mappa */}
                <Section icon={MapPin} title="Punto di partenza e zone"
                         subtitle="Le distanze si misurano in linea d'aria da qui. Trascina il pin o clicca sulla mappa per correggerlo."
                         className="lg:col-span-3">
                    <form onSubmit={runSearch} className="flex gap-2">
                        <input value={query} onChange={e => setQuery(e.target.value)}
                               placeholder="Es. Via Milano 12, Brescia" aria-label="Indirizzo del punto di partenza"
                               className={`input-style flex-1 ${err.origin ? 'border-red-400' : ''}`}/>
                        <button type="submit" disabled={searching}
                                className="inline-flex items-center gap-1.5 px-4 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800 disabled:opacity-60">
                            <Search className="w-4 h-4"/>{searching ? 'Cerco…' : 'Cerca'}
                        </button>
                    </form>
                    {searchError && <p className="mt-1.5 text-xs text-amber-700">{searchError}</p>}
                    <FieldError msg={err.origin}/>
                    {results && results.length > 1 && (
                        <ul className="mt-2 rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden" role="listbox" aria-label="Risultati">
                            {results.map((g, i) => (
                                <li key={i}>
                                    <button type="button" onClick={() => pickResult(g)}
                                            className="w-full text-left px-3 py-2.5 text-sm hover:bg-primary-50 flex items-start gap-2">
                                        <MapPin className="w-4 h-4 text-primary-500 mt-0.5 shrink-0"/>{g.label}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}

                    <Suspense fallback={<div className="mt-3 h-[380px] lg:h-[440px] rounded-xl bg-gray-100 animate-pulse"/>}>
                        <DeliveryZonesMap
                            className="mt-3 h-[380px] lg:h-[440px]"
                            origin={origin}
                            zonesKm={zonesKm}
                            onMove={(lat, lng) => update({originLat: +lat.toFixed(6), originLng: +lng.toFixed(6)})}
                        />
                    </Suspense>
                    <p className="mt-2 text-xs text-gray-500 min-h-[1rem]">
                        {origin
                            ? <>Partenza: <span className="font-semibold text-gray-700">{form.originAddress || 'posizione sul pin'}</span>{' '}
                                <span className="text-gray-400">({origin.lat.toFixed(5)}, {origin.lng.toFixed(5)})</span></>
                            : 'Nessun punto di partenza: cerca l\'indirizzo del locale.'}
                    </p>
                </Section>

                {/* Zone */}
                <Section icon={Bike} title="Zone e tariffe" subtitle="Oltre l'ultima zona l'indirizzo è fuori area." className="lg:col-span-2">
                    <div className="space-y-3">
                        {form.zones.map((z, i) => {
                            const rowErr = err.zoneRows?.[i]
                            const prevKm = i > 0 ? form.zones[i - 1].maxKm : '0'
                            return (
                                <div key={i} className={`rounded-xl border p-3 ${rowErr ? 'border-red-300 bg-red-50/40' : 'border-gray-200'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="inline-flex items-center gap-2 text-sm font-bold text-gray-700">
                                            <span className="w-3 h-3 rounded-full" style={{background: ZONE_COLORS[i % ZONE_COLORS.length]}}/>
                                            Zona {i + 1}
                                            <span className="font-normal text-gray-400">da {prevKm || 0} km</span>
                                        </span>
                                        <button type="button" onClick={() => update({zones: form.zones.filter((_, idx) => idx !== i)})}
                                                aria-label={`Elimina zona ${i + 1}`}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                                            <Trash2 className="w-4 h-4"/>
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <label className="text-xs font-semibold text-gray-500">Fino a
                                            <div className="relative mt-1">
                                                <input inputMode="decimal" value={z.maxKm} onChange={e => updateZone(i, {maxKm: e.target.value})}
                                                       aria-label={`Zona ${i + 1}: distanza massima in km`}
                                                       className="input-style !pr-10"/>
                                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">km</span>
                                            </div>
                                        </label>
                                        <label className="text-xs font-semibold text-gray-500">Tariffa
                                            <div className="mt-1"><EuroInput value={z.fee} onChange={v => updateZone(i, {fee: v})} placeholder="0" ariaLabel={`Zona ${i + 1}: tariffa`}/></div>
                                        </label>
                                        <label className="text-xs font-semibold text-gray-500">Ordine min.
                                            <div className="mt-1"><EuroInput value={z.min} onChange={v => updateZone(i, {min: v})} placeholder="0" ariaLabel={`Zona ${i + 1}: ordine minimo`}/></div>
                                        </label>
                                    </div>
                                    <FieldError msg={rowErr}/>
                                </div>
                            )
                        })}
                        {form.zones.length === 0 && <p className="text-sm text-gray-400">Nessuna zona: aggiungine almeno una.</p>}
                        <FieldError msg={err.zones}/>
                        {form.zones.length < 6 && (
                            <button type="button"
                                    onClick={() => {
                                        const last = strToNum(form.zones[form.zones.length - 1]?.maxKm ?? '0')
                                        update({zones: [...form.zones, {maxKm: kmToStr(Number.isFinite(last) ? last + 3 : 3), fee: '', min: ''}]})
                                    }}
                                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border-2 border-dashed border-gray-300 text-sm font-semibold text-gray-600 hover:border-primary-300 hover:text-primary-600">
                                <Plus className="w-4 h-4"/> Aggiungi zona
                            </button>
                        )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-100">
                        <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-1.5">
                            <Gift className="w-4 h-4 text-primary-500"/> Consegna gratis sopra
                        </label>
                        <EuroInput value={form.freeOver} onChange={v => update({freeOver: v})} placeholder="Nessuna soglia"
                                   ariaLabel="Consegna gratis sopra questo importo" invalid={!!err.freeOver}/>
                        <p className="mt-1 text-xs text-gray-500">Subtotale dei prodotti oltre il quale la consegna non si paga. Vuoto = sempre a pagamento.</p>
                        <FieldError msg={err.freeOver}/>
                    </div>
                </Section>

                {/* Pagamento */}
                <Section icon={Wallet} title="Pagamento" subtitle="Come pagano i clienti le consegne." className="lg:col-span-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="radiogroup" aria-label="Modalità di pagamento">
                        {PAYMENT_MODES.map(m => {
                            const active = form.paymentMode === m.value
                            return (
                                <button key={m.value} type="button" role="radio" aria-checked={active}
                                        onClick={() => update({
                                            paymentMode: m.value,
                                            onDeliveryMethods: m.value !== 'ONLINE_REQUIRED' && form.onDeliveryMethods.length === 0 ? ['CASH'] : form.onDeliveryMethods,
                                        })}
                                        className={`text-left rounded-xl border-2 p-3 transition-colors ${active ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                                    <m.icon className={`w-5 h-5 mb-1.5 ${active ? 'text-primary-600' : 'text-gray-400'}`}/>
                                    <p className="text-sm font-bold text-gray-800">{m.title}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
                                </button>
                            )
                        })}
                    </div>

                    <div className={`mt-4 ${onlineOnly ? 'opacity-50' : ''}`}>
                        <p className="text-sm font-bold text-gray-700 mb-2">Alla consegna il rider accetta</p>
                        <div className="flex flex-wrap gap-2">
                            {([['CASH', 'Contanti', Banknote], ['CARD', 'POS (carta)', CreditCard]] as const).map(([value, label, Icon]) => {
                                const on = form.onDeliveryMethods.includes(value)
                                return (
                                    <label key={value}
                                           className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl border-2 text-sm font-semibold cursor-pointer select-none ${
                                               on && !onlineOnly ? 'border-primary-500 bg-primary-50 text-primary-800' : 'border-gray-200 text-gray-600'
                                           } ${onlineOnly ? 'cursor-not-allowed' : ''}`}>
                                        <input type="checkbox" className="sr-only" disabled={onlineOnly} checked={on}
                                               onChange={() => update({onDeliveryMethods: on ? form.onDeliveryMethods.filter(x => x !== value) : [...form.onDeliveryMethods, value]})}/>
                                        <Icon className="w-4 h-4"/>{label}
                                    </label>
                                )
                            })}
                        </div>
                        {onlineOnly && <p className="mt-1.5 text-xs text-gray-500">Con il pagamento online obbligatorio il rider non incassa nulla.</p>}
                        <FieldError msg={err.methods}/>
                    </div>
                    {onlineAvailable === false && form.paymentMode !== 'ON_DELIVERY_ONLY' && (
                        <p className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800 flex gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0"/>
                            {form.paymentMode === 'ONLINE_REQUIRED'
                                ? 'I pagamenti online non sono attivi: non puoi rendere obbligatorio il pagamento online finché non li configuri.'
                                : 'I pagamenti online non sono attivi: i clienti potranno pagare solo alla consegna.'}
                        </p>
                    )}
                    {form.paymentMode !== 'ON_DELIVERY_ONLY' && (
                        <p className="mt-4 text-xs text-gray-500">
                            Il pagamento online usa il fornitore configurato in{' '}
                            <Link to={`/${localname}/Dashboard/PaymentsSettings`} className="font-semibold text-primary-600 hover:underline">Pagamenti online</Link>.
                        </p>
                    )}
                </Section>

                {/* Fasce orarie */}
                <Section icon={Clock} title="Fasce orarie" subtitle="Capienza separata da quella dell'asporto." className="lg:col-span-2">
                    <div className="grid grid-cols-3 gap-3">
                        <label className="text-xs font-semibold text-gray-500">Durata fascia
                            <select value={form.slotMinutes} onChange={e => update({slotMinutes: e.target.value})}
                                    className={`input-style mt-1 !px-2 ${err.slotMinutes ? 'border-red-400' : ''}`} aria-label="Durata della fascia in minuti">
                                {Array.from(new Set(['10', '15', '20', '30', '45', '60', '90', '120', form.slotMinutes])).map(m => <option key={m} value={m}>{m} min</option>)}
                            </select>
                        </label>
                        <label className="text-xs font-semibold text-gray-500">Consegne / fascia
                            <input type="number" min={1} max={50} value={form.deliveriesPerSlot}
                                   onChange={e => update({deliveriesPerSlot: e.target.value})}
                                   className={`input-style mt-1 ${err.deliveriesPerSlot ? 'border-red-400' : ''}`}/>
                        </label>
                        <label className="text-xs font-semibold text-gray-500">Preavviso
                            <div className="relative mt-1">
                                <input type="number" min={0} max={1440} step={5} value={form.leadMinutes}
                                       onChange={e => update({leadMinutes: e.target.value})}
                                       className={`input-style !pr-11 ${err.leadMinutes ? 'border-red-400' : ''}`}/>
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">min</span>
                            </div>
                        </label>
                    </div>
                    <FieldError msg={err.slotMinutes || err.deliveriesPerSlot || err.leadMinutes}/>
                    <p className="mt-3 text-xs text-gray-500">
                        Con fasce da {form.slotMinutes || '–'} minuti e {form.deliveriesPerSlot || '–'} consegne per fascia, il primo orario
                        prenotabile è almeno {form.leadMinutes || '0'} minuti dopo l'ordine.
                    </p>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <label htmlFor="own-hours" className="text-sm font-bold text-gray-800 cursor-pointer">Orari dedicati alle consegne</label>
                                <p className="text-xs text-gray-500">
                                    {form.weeklyHours
                                        ? "Giorni e orari in cui si consegna. Chiusure e pausa restano quelle dell'asporto."
                                        : <>Disattivato: si usano gli orari di <Link to={`/${localname}/Dashboard/Slots`} className="font-semibold text-primary-600 hover:underline">Slot Asporto</Link>.</>}
                                </p>
                            </div>
                            <Switch id="own-hours" checked={!!form.weeklyHours} onChange={enableOwnHours} label="Orari dedicati alle consegne"/>
                        </div>
                        {form.weeklyHours && (
                            <div className="mt-3 space-y-1.5">
                                {DAYS.map(({key, short}) => {
                                    const ranges = form.weeklyHours?.[key] ?? []
                                    return (
                                        <div key={key} className="flex items-start gap-2">
                                            <span className="w-10 shrink-0 text-center text-xs font-bold bg-gray-100 rounded py-1.5 mt-0.5">{short}</span>
                                            <div className="flex-1 space-y-1.5">
                                                {ranges.length === 0 && <p className="text-xs text-gray-400 py-1.5">Nessuna consegna</p>}
                                                {ranges.map((r, i) => (
                                                    <div key={i} className="flex items-center gap-1.5">
                                                        <input type="time" value={r.start} aria-label={`${short} inizio`}
                                                               onChange={e => setDayRanges(key, ranges.map((x, j) => j === i ? {...x, start: e.target.value} : x))}
                                                               className="input-style !px-2 !py-1.5 text-sm max-w-[110px]"/>
                                                        <span className="text-gray-400 text-xs">→</span>
                                                        <input type="time" value={r.end} aria-label={`${short} fine`}
                                                               onChange={e => setDayRanges(key, ranges.map((x, j) => j === i ? {...x, end: e.target.value} : x))}
                                                               className="input-style !px-2 !py-1.5 text-sm max-w-[110px]"/>
                                                        <button type="button" aria-label="Rimuovi orario" onClick={() => setDayRanges(key, ranges.filter((_, j) => j !== i))}
                                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
                                                            <Trash2 className="w-4 h-4"/>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                            <button type="button" aria-label={`Aggiungi orario ${short}`}
                                                    onClick={() => setDayRanges(key, [...ranges, {start: '19:00', end: '22:00'}])}
                                                    className="p-1.5 text-primary-600 hover:bg-primary-50 rounded mt-0.5">
                                                <Plus className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                        <FieldError msg={err.hours}/>
                    </div>
                </Section>

                {/* Verifica telefono asporto */}
                <Section icon={MessageSquareText} title="Verifica del telefono" className="lg:col-span-5">
                    <div className="flex items-start gap-4 flex-wrap">
                        <div className="flex-1 min-w-[260px]">
                            <label htmlFor="otp-takeaway" className={`text-sm font-bold text-gray-800 ${smsAvailable === false ? '' : 'cursor-pointer'}`}>
                                Verifica telefono via SMS anche per l'asporto
                            </label>
                            {smsAvailable === false ? (
                                <p id="otp-takeaway-off" className="text-sm font-medium text-amber-700 mt-0.5 flex items-center gap-1">
                                    <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true"/>
                                    Verifica SMS non attiva su questo server: consegne e asporto accettano il numero senza codice.
                                </p>
                            ) : (
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Per le consegne il codice SMS è sempre richiesto. Attivalo anche per l'asporto se ricevi ordini con numeri falsi.
                                </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1.5">
                                Ogni SMS inviato ha un costo per il locale. Un numero verificato resta valido 90 giorni sullo stesso
                                dispositivo: i clienti abituali non ricevono un nuovo SMS a ogni ordine.
                            </p>
                        </div>
                        <Switch id="otp-takeaway" checked={smsAvailable === false ? false : form.requirePhoneOtpTakeaway}
                                onChange={v => update({requirePhoneOtpTakeaway: v})}
                                disabled={smsAvailable === false}
                                describedBy={smsAvailable === false ? 'otp-takeaway-off' : undefined}
                                label="Verifica telefono via SMS anche per l'asporto"/>
                    </div>
                </Section>

                {/* Percorso dei rider */}
                <Section icon={Route} title="Percorso dei rider" className="lg:col-span-5">
                    <div className="flex items-start gap-4 flex-wrap">
                        <div className="flex-1 min-w-[260px]">
                            <label htmlFor="route-planning" className="text-sm font-bold text-gray-800 cursor-pointer">
                                Calcolo del percorso per i rider
                            </label>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Ordina le consegne in uscita dalla più vicina al punto di partenza, numera le tappe e apre il giro
                                completo in Google Maps con un tocco su "Avvia giro" (pagina Consegne e app DineUp Sala).
                            </p>
                            <p className="text-xs text-gray-400 mt-1.5">
                                L'ordine è calcolato in linea d'aria, senza costi né chiavi. Google Maps accetta 10 tappe per volta:
                                con più consegne il giro è diviso in tratte.
                            </p>
                        </div>
                        <Switch id="route-planning" checked={form.routePlanning} onChange={v => update({routePlanning: v})}
                                label="Calcolo del percorso per i rider"/>
                    </div>
                </Section>
            </div>

            {/* Barra di salvataggio fissa quando ci sono modifiche */}
            {dirty && (
                <motion.div initial={{y: 80, opacity: 0}} animate={{y: 0, opacity: 1}}
                            className="sticky bottom-4 mt-6 z-30 mx-auto max-w-xl rounded-2xl bg-gray-900 text-white shadow-2xl px-4 py-3 flex items-center gap-3">
                    <p className="flex-1 text-sm">Hai modifiche non salvate.</p>
                    <button onClick={handleSave} disabled={saving}
                            className="px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-sm font-bold disabled:opacity-60">
                        {saving ? 'Salvataggio…' : 'Salva'}
                    </button>
                </motion.div>
            )}
        </motion.div>
    )
}

export default DeliverySettingsPage;
