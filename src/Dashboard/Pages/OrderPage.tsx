import React, {useContext, useEffect, useState} from "react";
import OrderModal from "../../Components/OrderModal";
import OrderCard from "../../Components/OrderCard";
import {useData} from "../../Context/DataContext";
import {getCompletedApi, getDeletedApi} from "../../Utilities/api";
import {useNotification} from "../../Context/NotificationContext";
import CustomLoading from "../../Components/CustomLoading";
import {reprintComandApi} from "../../Utilities/printApi";
import {getTakeawayPauseApi, pauseTakeawayApi, resumeTakeawayApi, TakeawayPauseStatus} from "../../Utilities/api";
import {LoginContext} from "../../Context/LoginContext";
import {useTabletPrinting} from "../../Hooks/useTabletPrinting";

/** Countdown "m:ss" verso una scadenza ISO; "scaduto" se passata. */
const Countdown: React.FC<{ deadline?: string }> = ({deadline}) => {
    const [now, setNow] = useState(Date.now())
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(t)
    }, [])
    if (!deadline) return null
    const ms = new Date(deadline).getTime() - now
    if (Number.isNaN(ms)) return null
    if (ms <= 0) return <span className="font-mono font-bold text-red-700">scaduto</span>
    const s = Math.floor(ms / 1000)
    return (
        <span className={`font-mono font-bold ${s < 120 ? 'text-red-700' : 'text-orange-700'}`}>
            {Math.floor(s / 60)}:{String(s % 60).padStart(2, '0')}
        </span>
    )
}

export interface OrderItem {
    productName: string;
    categoryName: string;
    total: number;
    additionalIngredients: string[];
    removedIngredients: string[];
    notes: string;
    option?: string
    quantity: number
}

export interface Orders {
    id: string;
    userId: string;
    tableName?: string;
    status: 'PROGRESS' | 'COMPLETED' | 'DELETED' | 'AWAIT' | 'PENDING' | 'AWAIT_PAYMENT' | 'AWAIT_APPROVAL';
    items: OrderItem[];
    time?: string
    address?: string
    phone?: string
    name?: string
    createdAt: string
    /** Pagato online (Stripe) */
    paid?: boolean
    /** Ordine "su richiesta": scadenza entro cui accettare/rifiutare */
    approvalDeadline?: string
    approvalRequired?: boolean
    /** Importo autorizzato, incassato all'accettazione */
    paymentAuthorized?: boolean
}


const OrdersPage: React.FC = () => {
    const { comands, tablesMap, mapRawOrderToOrder, changeComandStatus, approveComand, rejectComand } = useData()
    const loginCtx = useContext(LoginContext)
    const [pause, setPause] = useState<TakeawayPauseStatus | null>(null)
    const [pauseBusy, setPauseBusy] = useState(false)
    const [busyId, setBusyId] = useState<string | null>(null)
    const [singleOrder, setSingleOrder] = useState<Orders | null>(null)
    const [ordersList, setOrdersList] = useState<Orders[]>([]);
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'AWAIT' | 'PENDING' | 'PROGRESS' | 'COMPLETED' | 'DELETED'>('ALL');
    const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0])
    const [myLoading, setMyLoading] = useState<boolean>(false)
    const [historicalOrders, setHistoricalOrders] = useState<Orders[]>([]);

    const { addNotification } = useNotification()
    const tablet = useTabletPrinting()

    const handleReprint = async (comandId: string) => {
        if (tablet.configured) {
            // Stampa dal tablet (sincrona rispetto al tocco); la coda server solo se ci sono anche stampanti Star/bridge.
            const jobs: Promise<unknown>[] = []
            if (tablet.tabletPrintEnabled) jobs.push(tablet.run(comandId, true))
            if (tablet.queuedPrinters) {
                jobs.push(reprintComandApi(comandId).then(res => {
                    if (!res.success) addNotification({message: "Errore invio stampa", type: "error"})
                    else if (!tablet.tabletPrintEnabled) addNotification({message: "Comanda inviata in stampa", type: "success"})
                }))
            }
            if (jobs.length === 0) {
                addNotification({message: tablet.unavailableReason || "Nessuna stampante attiva", type: "error"})
            }
            await Promise.all(jobs)
            return
        }
        const res = await reprintComandApi(comandId)
        if (res.success && (res.data as any)?.enqueued !== 0) {
            addNotification({message: "Comanda inviata in stampa", type: "success"})
        } else if (res.success) {
            addNotification({message: "Nessuna stampante attiva per questa comanda", type: "error"})
        } else {
            addNotification({message: "Errore invio stampa", type: "error"})
        }
    }

    useEffect(() => {
        setOrdersList([...mapRawOrderToOrder()])
    }, [comands]);

    useEffect(() => {
        setOrdersList([...mapRawOrderToOrder()])
    }, []);

    // Stato "Sospendi asporto" (accesso rapido nei momenti di punta)
    useEffect(() => {
        getTakeawayPauseApi().then(r => { if (r.success && r.data) setPause(r.data) })
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [loginCtx?.user?.idAgency]);

    const togglePause = async () => {
        setPauseBusy(true)
        const r = pause?.paused ? await resumeTakeawayApi() : await pauseTakeawayApi()
        setPauseBusy(false)
        if (r.success && r.data) {
            setPause(r.data)
            addNotification({message: r.data.paused ? "Asporto sospeso" : "Asporto riattivato", type: "success"})
        } else {
            addNotification({message: "Errore aggiornamento asporto", type: "error"})
        }
    }

    const handleApprove = async (id: string) => {
        setBusyId(id)
        await approveComand(id)
        setBusyId(null)
    }

    /** "Da approvare" con stampa dal tablet: approvazione e download del ticket in parallelo. */
    const handleApproveAndPrint = async (id: string) => {
        setBusyId(id)
        await tablet.run(id, false, () => approveComand(id))
        setBusyId(null)
    }

    /** Nuovo ordine (AWAIT/PENDING) → In cucina + stampa dal tablet. */
    const handleAcceptAndPrint = (id: string) => {
        void tablet.run(id, false, () => changeComandStatus(id, "PROGRESS"))
    }

    const handleReject = async (id: string) => {
        const reason = window.prompt("Motivo del rifiuto (facoltativo, verrà mostrato al cliente):", "")
        if (reason === null) return
        setBusyId(id)
        await rejectComand(id, reason.trim() || undefined)
        setBusyId(null)
    }

    // Ordini "su richiesta": sezione dedicata in cima, ordinati per scadenza
    const toApprove = ordersList
        .filter(o => o.status === 'AWAIT_APPROVAL')
        .sort((a, b) => (a.approvalDeadline || '').localeCompare(b.approvalDeadline || ''))

    const loadHistorical = async (completed: boolean) => {
        setMyLoading(true)
        const response = completed ? await getCompletedApi(filterDate) : await getDeletedApi(filterDate)
        if(response.status === 200){
            setHistoricalOrders(mapRawOrderToOrder(response.data || []) || [])
        }else{
            addNotification({message: "Errore caricamento", type: "error"})
        }
        setMyLoading(false)
    }

    useEffect(() => {
        if (filterStatus === 'COMPLETED') {
            loadHistorical(true)
        } else if(filterStatus === 'DELETED') {
            loadHistorical(false)
        }else{
            setHistoricalOrders([])
        }
    }, [filterStatus, filterDate]);

    const handleChangeStatus = async (value: string, newStatus: "PROGRESS" | "COMPLETED" | "DELETED" | "PENDING") => {
        await changeComandStatus(value, newStatus)
    }

    const filteredOrders = filterStatus === 'COMPLETED' || filterStatus === 'DELETED'
        ? historicalOrders.filter(o => {
            const matchStatus = o.status === filterStatus;
            const matchDate = filterDate ? o.createdAt.startsWith(filterDate) : true;
            return matchStatus && matchDate;
        })
        : ordersList.filter(o => o.status !== 'AWAIT_APPROVAL' && o.status !== 'AWAIT_PAYMENT'
            && (filterStatus === 'ALL' || o.status === filterStatus));


    return (
        <div className="p-4">
            {myLoading && <CustomLoading isFullPage={true} isTransparent={true} message={"Loading..."}/>}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <h1 className="text-2xl font-bold">Gestione Ordini</h1>
                {pause && (
                    <button
                        onClick={togglePause}
                        disabled={pauseBusy}
                        className={`px-4 py-2 rounded-lg text-sm font-bold shadow-sm disabled:opacity-50 ${
                            pause.paused ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-white border border-red-300 text-red-700 hover:bg-red-50'
                        }`}
                        title="Blocca temporaneamente i nuovi ordini da asporto online"
                    >
                        {pause.paused
                            ? `Asporto sospeso${pause.pausedUntil ? ' fino alle ' + new Date(pause.pausedUntil).toLocaleTimeString('it-IT', {hour: '2-digit', minute: '2-digit'}) : ''} — Riprendi`
                            : 'Sospendi asporto'}
                    </button>
                )}
            </div>

            {toApprove.length > 0 && (
                <div className="mb-8 rounded-xl border-2 border-orange-400 bg-orange-50 p-4 shadow">
                    <h2 className="text-lg font-bold text-orange-800 mb-1">Da approvare ({toApprove.length})</h2>
                    <p className="text-sm text-orange-700 mb-4">
                        Ordini da asporto "su richiesta" oltre la capacità dello slot: senza risposta entro la scadenza vengono rifiutati automaticamente.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {toApprove.map(order => (
                            <div key={order.id} className="rounded-lg border border-orange-300 bg-white p-4">
                                <div className="flex justify-between items-start gap-2">
                                    <div className="min-w-0">
                                        <p className="font-bold truncate">{order.name || 'Cliente'}</p>
                                        {order.time && <p className="text-sm text-gray-600">Ritiro: {order.time.replace('T', ' ')}</p>}
                                        {order.phone && <p className="text-sm text-gray-600">Tel: {order.phone}</p>}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs text-gray-500">Scade tra</p>
                                        <Countdown deadline={order.approvalDeadline}/>
                                    </div>
                                </div>
                                <ul className="mt-3 text-sm space-y-0.5">
                                    {order.items.map((it, i) => (
                                        <li key={i}><strong>{it.quantity}×</strong> {it.productName}{it.option && it.option !== 'Default' ? ` (${it.option})` : ''}</li>
                                    ))}
                                </ul>
                                {order.paymentAuthorized && (
                                    <p className="mt-2 inline-block px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                                        Pagamento autorizzato: incassato se accetti
                                    </p>
                                )}
                                <div className="mt-4 flex gap-2">
                                    <button
                                        onClick={() => tablet.tabletPrintEnabled ? handleApproveAndPrint(order.id) : handleApprove(order.id)}
                                        disabled={busyId === order.id}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-bold px-3 py-2 rounded disabled:opacity-50"
                                    >
                                        {tablet.tabletPrintEnabled ? 'Accetta e stampa' : 'Accetta'}
                                    </button>
                                    <button
                                        onClick={() => handleReject(order.id)}
                                        disabled={busyId === order.id}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-3 py-2 rounded disabled:opacity-50"
                                    >
                                        Rifiuta
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mb-6 flex flex-wrap gap-2">
                {[
                    {label: 'Tutti', value: 'ALL', color: 'gray'},
                    {label: 'Nuovi', value: 'AWAIT', color: 'amber'},
                    {label: 'Pending', value: 'PENDING', color: 'yellow'},
                    {label: 'In Corso', value: 'PROGRESS', color: 'blue'},
                    {label: 'Completati', value: 'COMPLETED', color: 'green'},
                    {label: 'Cancellati', value: 'DELETED', color: 'red'},
                ].map(({label, value, color}) => (
                    <button
                        key={value}
                        onClick={() => setFilterStatus(value as any)}
                        className={`
                            px-4 py-2 rounded-full text-sm font-semibold border
                            transition-all duration-200
                            ${filterStatus === value
                            ? `bg-${color}-600 text-black border-${color}-600`
                            : `bg-white text-${color}-700 border-${color}-300 hover:bg-${color}-100`}
                        `}
                        >
                            {label}
                        </button>
                ))}

                {['COMPLETED', 'DELETED'].includes(filterStatus) && (
                    <input
                        type="date"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                        className="px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                )}
            </div>


            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map((order) => (
                    <OrderCard
                        key={order.id}
                        order={order}
                        onStatusChange={handleChangeStatus}
                        onDetailsClick={setSingleOrder}
                        onPrint={handleReprint}
                        onAcceptAndPrint={tablet.tabletPrintEnabled ? handleAcceptAndPrint : undefined}
                        pendingPrint={tablet.isPending(order.id)}
                        onPrintPending={tablet.printPending}
                    />
                ))}
            </div>

            {singleOrder && (
                <OrderModal
                    order={singleOrder}
                    onClose={() => setSingleOrder(null)}
                />
            )}
        </div>
    );
};

export default OrdersPage;