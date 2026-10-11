import React, {useState, useMemo, useEffect, useCallback} from 'react';
import {CardDto, AddCard, LoyaltySettings, CardMovement} from '../../types';
import LoyaltySettingsPanel, {expiryLabel} from "../../Components/Dashboard/LoyaltySettingsPanel";
import QRCode from 'react-qr-code';
import {PlusIcon, MagnifyingGlassIcon, EnvelopeIcon, ArrowDownTrayIcon, LinkIcon, ChevronRightIcon} from '@heroicons/react/24/outline';
import {XMarkIcon} from '@heroicons/react/24/solid';
import {AddCardModal} from "../../Components/Dashboard/AddCardModal";
import {
    addCardApi,
    addPointToCardApi,
    claimCardApi,
    deleteCardApi,
    getAllCardsApi,
    getCardMovementsApi,
    resetCardApi,
    sendCardByEmailApi,
    updateCardDetailsApi,
} from "../../Utilities/api";
import {useNotification} from "../../Context/NotificationContext";
import CustomLoading from "../../Components/CustomLoading";
import html2canvas from "html2canvas";

// ─── Utilità ──────────────────────────────────────────────────────────────────

const eur = new Intl.NumberFormat('it-IT', {style: 'currency', currency: 'EUR'});
const formatCents = (c: number | null | undefined) => eur.format((c ?? 0) / 100);

const formatDate = (iso: string | null | undefined) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('it-IT', {day: 'numeric', month: 'short', year: 'numeric'});
};

const formatDateTime = (iso: string | null | undefined) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return Number.isNaN(d.getTime()) ? '—'
        : d.toLocaleString('it-IT', {day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'});
};

const daysSince = (iso: string | null | undefined) => {
    if (!iso) return Infinity;
    const t = new Date(iso).getTime();
    return Number.isNaN(t) ? Infinity : (Date.now() - t) / 86_400_000;
};

const relativeDay = (iso: string | null | undefined) => {
    const d = daysSince(iso);
    if (d === Infinity) return 'mai';
    if (d < 1) return 'oggi';
    if (d < 2) return 'ieri';
    if (d < 31) return `${Math.floor(d)} giorni fa`;
    return formatDate(iso);
};

const cardLink = (code: string) => `${window.location.origin}/cardStatus#${code}`;
const prizeReady = (c: CardDto) => !c.typePoints && c.actualValue >= c.scope;
const INACTIVE_DAYS = 90;

const balanceLabel = (c: CardDto) => c.typePoints
    ? `${c.actualValue} ${c.actualValue === 1 ? 'punto' : 'punti'}`
    : `${c.actualValue} / ${c.scope} visite`;

const MOVEMENT_LABEL: Record<CardMovement['type'], string> = {
    EARN: 'Conto in cassa',
    ADD: 'Aggiunta manuale',
    CLAIM: 'Utilizzo',
    RESET: 'Azzeramento',
    EXPIRE: 'Scadenza',
};

type Filter = 'all' | 'visits' | 'points' | 'prize' | 'inactive';
type Sort = 'lastVisit' | 'balance' | 'spent' | 'created';

// ─── Barra di avanzamento visite ──────────────────────────────────────────────

const VisitDots: React.FC<{ value: number; scope: number }> = ({value, scope}) => {
    if (scope > 20) {
        return (
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{width: `${Math.min(100, (value / scope) * 100)}%`}}/>
            </div>
        );
    }
    return (
        <div className="flex flex-wrap gap-1">
            {Array.from({length: scope}, (_, i) => (
                <span key={i} className={`w-3 h-3 rounded-full ${i < value ? 'bg-emerald-500' : 'bg-gray-200'}`}/>
            ))}
        </div>
    );
};

// ─── Dettaglio tessera ────────────────────────────────────────────────────────

const CardDetail: React.FC<{
    card: CardDto;
    settings: LoyaltySettings | null;
    onClose: () => void;
    onChanged: (card: CardDto) => void;
    onDeleted: (id: number) => void;
}> = ({card, settings, onClose, onChanged, onDeleted}) => {
    const {addNotification} = useNotification();
    const [movements, setMovements] = useState<CardMovement[] | null>(null);
    const [busy, setBusy] = useState(false);
    const [qty, setQty] = useState('');
    const [holderName, setHolderName] = useState(card.holderName ?? '');
    const [holderContact, setHolderContact] = useState(card.holderContact ?? '');
    const [note, setNote] = useState(card.note ?? '');
    const [email, setEmail] = useState('');
    const [confirm, setConfirm] = useState<'reset' | 'delete' | null>(null);

    const loadMovements = useCallback(async () => {
        const r = await getCardMovementsApi(card.id);
        setMovements(r.success && r.data?.data ? r.data.data : []);
    }, [card.id]);

    useEffect(() => { loadMovements(); }, [loadMovements]);

    useEffect(() => {
        setHolderName(card.holderName ?? '');
        setHolderContact(card.holderContact ?? '');
        setNote(card.note ?? '');
    }, [card.id, card.holderName, card.holderContact, card.note]);

    /** Esegue un'operazione sul saldo e aggiorna tessera e storico. */
    const run = async (call: () => Promise<{ success: boolean; data?: { data?: CardDto | null } | null }>, ok: string, ko: string) => {
        setBusy(true);
        const r = await call();
        setBusy(false);
        setConfirm(null);
        if (r.success && r.data?.data) {
            onChanged(r.data.data);
            addNotification({type: 'success', message: ok});
            setQty('');
            loadMovements();
        } else {
            addNotification({type: 'error', message: ko});
        }
    };

    const n = Math.floor(Number(qty));
    const validQty = Number.isFinite(n) && n > 0;

    const detailsDirty = (holderName.trim() !== (card.holderName ?? '')) || (holderContact.trim() !== (card.holderContact ?? '')) || (note.trim() !== (card.note ?? ''));

    const saveDetails = () => run(() => updateCardDetailsApi(card.id, {holderName, holderContact, note}),
        'Dati del titolare salvati', 'Errore nel salvataggio');

    const sendEmail = async () => {
        if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
            addNotification({type: 'warning', message: 'Email non valida'});
            return;
        }
        setBusy(true);
        const r = await sendCardByEmailApi(card.id, email.trim());
        setBusy(false);
        if (r.success && r.data?.data) {
            addNotification({type: 'success', message: 'Tessera inviata via email'});
            setEmail('');
        } else {
            addNotification({type: 'error', message: 'Invio non riuscito'});
        }
    };

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(cardLink(card.code));
            addNotification({message: 'Link copiato', type: 'success'});
        } catch {
            addNotification({message: 'Impossibile copiare il link', type: 'error'});
        }
    };

    const downloadQr = () => {
        const el = document.getElementById('card-qr');
        if (!el) return;
        html2canvas(el).then(canvas => {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `tessera-${card.code}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    };

    const visits = card.visitsCount ?? 0;
    const spent = card.totalSpentCents ?? 0;
    const prize = settings?.stampsPrize;

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
            <aside className="h-full w-full max-w-xl bg-white shadow-2xl overflow-y-auto" onClick={e => e.stopPropagation()}>
                {/* Intestazione */}
                <div className="sticky top-0 z-10 bg-white border-b border-gray-100 px-5 py-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Tessera {card.typePoints ? 'a punti' : 'a visite'}
                        </p>
                        <h2 className="text-xl font-bold text-gray-900 truncate">{card.holderName || card.code}</h2>
                        {card.holderName && <p className="font-mono text-sm text-gray-500">{card.code}</p>}
                    </div>
                    <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600" aria-label="Chiudi">
                        <XMarkIcon className="w-7 h-7"/>
                    </button>
                </div>

                <div className="p-5 space-y-6">
                    {/* Saldo e azioni */}
                    <section className="rounded-xl bg-slate-50 p-4 space-y-3">
                        <div className="flex items-baseline justify-between gap-3">
                            <p className="text-3xl font-bold text-gray-900">{balanceLabel(card)}</p>
                            {card.expiresAt && (
                                <p className="text-xs text-amber-700 text-right">Si azzera il {formatDate(card.expiresAt)}</p>
                            )}
                        </div>
                        {!card.typePoints && <VisitDots value={card.actualValue} scope={card.scope}/>}
                        {prizeReady(card) && (
                            <p className="text-sm font-semibold text-emerald-700">Premio disponibile{prize ? `: ${prize}` : ''}</p>
                        )}

                        <div className="flex flex-wrap gap-2 pt-1">
                            {card.typePoints ? (
                                <>
                                    <input type="number" min={1} value={qty} onChange={e => setQty(e.target.value)}
                                           placeholder="Punti" className="input-style !w-24"/>
                                    <button disabled={busy || !validQty} className="btn-primary disabled:opacity-50"
                                            onClick={() => run(() => addPointToCardApi(card.id, n), `+${n} punti`, 'Errore aggiunta punti')}>
                                        Aggiungi
                                    </button>
                                    <button disabled={busy || !validQty || n > card.actualValue} className="btn-secondary disabled:opacity-50"
                                            onClick={() => run(() => claimCardApi(card.id, n), `−${n} punti usati`, 'Errore utilizzo punti')}>
                                        Usa
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button disabled={busy || card.actualValue >= card.scope} className="btn-primary disabled:opacity-50"
                                            onClick={() => run(() => addPointToCardApi(card.id, 1), 'Visita aggiunta', 'Errore')}>
                                        + 1 visita
                                    </button>
                                    <button disabled={busy || !prizeReady(card)} className="btn-secondary disabled:opacity-50"
                                            onClick={() => run(() => claimCardApi(card.id, card.scope), 'Premio riscattato', 'Errore riscatto')}>
                                        Riscatta premio
                                    </button>
                                </>
                            )}
                        </div>
                        <p className="text-xs text-gray-500">
                            In cassa {card.typePoints ? 'i punti si accreditano' : 'la visita si conta'} da sola collegando la tessera al conto.
                        </p>
                    </section>

                    {/* Statistiche */}
                    <section className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                        {[
                            ['Visite totali', String(visits)],
                            ['Spesa totale', formatCents(spent)],
                            ['Scontrino medio', visits > 0 ? formatCents(Math.round(spent / visits)) : '—'],
                            ['Ultima visita', relativeDay(card.lastVisitAt)],
                            ['Emessa il', formatDate(card.createdAt)],
                            [card.typePoints ? '1 punto ogni' : 'Premio a', card.typePoints ? eur.format(card.priceForPoint) : `${card.scope} visite`],
                        ].map(([label, value]) => (
                            <div key={label} className="rounded-lg border border-gray-100 p-3">
                                <p className="text-xs text-gray-500">{label}</p>
                                <p className="font-semibold text-gray-900">{value}</p>
                            </div>
                        ))}
                    </section>

                    {/* Titolare */}
                    <section className="space-y-2">
                        <h3 className="font-semibold text-gray-800">Titolare</h3>
                        <input value={holderName} onChange={e => setHolderName(e.target.value)} maxLength={80}
                               placeholder="Nome e cognome" className="input-style w-full"/>
                        <input value={holderContact} onChange={e => setHolderContact(e.target.value)} maxLength={120}
                               placeholder="Telefono o email" className="input-style w-full"/>
                        <textarea value={note} onChange={e => setNote(e.target.value)} maxLength={500} rows={2}
                                  placeholder="Note" className="input-style w-full"/>
                        {detailsDirty && (
                            <div className="flex justify-end">
                                <button onClick={saveDetails} disabled={busy} className="btn-primary disabled:opacity-50">Salva</button>
                            </div>
                        )}
                    </section>

                    {/* Consegna al cliente */}
                    <section className="space-y-3">
                        <h3 className="font-semibold text-gray-800">Consegna al cliente</h3>
                        <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                            <div id="card-qr" className="bg-white p-3 rounded-lg border border-gray-200 shrink-0">
                                <QRCode value={cardLink(card.code)} size={128}/>
                            </div>
                            <div className="w-full space-y-2">
                                <div className="flex gap-2">
                                    <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                                           placeholder="Email del cliente" className="input-style flex-1 min-w-0"/>
                                    <button onClick={sendEmail} disabled={busy || !email.trim()} title="Invia via email"
                                            className="btn-secondary px-3 disabled:opacity-50"><EnvelopeIcon className="w-5 h-5"/></button>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={downloadQr} className="btn-secondary flex-1 flex items-center justify-center gap-1.5">
                                        <ArrowDownTrayIcon className="w-4 h-4"/>Scarica QR
                                    </button>
                                    <button onClick={copyLink} className="btn-secondary flex-1 flex items-center justify-center gap-1.5">
                                        <LinkIcon className="w-4 h-4"/>Copia link
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Storico */}
                    <section>
                        <h3 className="font-semibold text-gray-800 mb-2">Storico movimenti</h3>
                        {movements == null ? (
                            <p className="text-sm text-gray-400">Caricamento…</p>
                        ) : movements.length === 0 ? (
                            <p className="text-sm text-gray-400">Nessun movimento.</p>
                        ) : (
                            <ul className="divide-y divide-gray-100 border border-gray-100 rounded-lg">
                                {movements.map((m, i) => (
                                    <li key={i} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                                        <div className="min-w-0">
                                            <p className="font-medium text-gray-800">
                                                {MOVEMENT_LABEL[m.type]}
                                                {m.amountCents != null && <span className="text-gray-500 font-normal"> · {formatCents(m.amountCents)}</span>}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate">
                                                {formatDateTime(m.createdAt)}{m.note ? ` · ${m.note}` : ''}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className={`font-semibold ${m.delta >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                                {m.delta > 0 ? '+' : ''}{m.delta}
                                            </p>
                                            {m.balanceAfter != null && <p className="text-xs text-gray-400">saldo {m.balanceAfter}</p>}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>

                    {/* Azioni distruttive */}
                    <section className="border-t border-gray-100 pt-4 space-y-3">
                        {confirm === 'reset' ? (
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                <span className="font-semibold text-gray-800">Azzerare {balanceLabel(card)}?</span>
                                <button disabled={busy} className="px-3 py-1.5 rounded-md bg-amber-500 text-white font-semibold"
                                        onClick={() => run(() => resetCardApi(card.id), 'Saldo azzerato', 'Errore azzeramento')}>Azzera</button>
                                <button className="px-3 py-1.5 text-gray-600 font-semibold" onClick={() => setConfirm(null)}>Annulla</button>
                            </div>
                        ) : confirm === 'delete' ? (
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                <span className="font-semibold text-gray-800">Eliminare la tessera? Il cliente non potrà più usarla.</span>
                                <button disabled={busy} className="px-3 py-1.5 rounded-md bg-red-600 text-white font-semibold"
                                        onClick={async () => {
                                            setBusy(true);
                                            const r = await deleteCardApi(card.id);
                                            setBusy(false);
                                            if (r.success) onDeleted(card.id);
                                            else addNotification({type: 'error', message: 'Errore eliminazione'});
                                        }}>Elimina</button>
                                <button className="px-3 py-1.5 text-gray-600 font-semibold" onClick={() => setConfirm(null)}>Annulla</button>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-4 text-sm font-semibold">
                                <button disabled={card.actualValue === 0} className="text-amber-700 disabled:text-gray-300"
                                        onClick={() => setConfirm('reset')}>Azzera saldo</button>
                                <button className="text-red-600" onClick={() => setConfirm('delete')}>Elimina tessera</button>
                            </div>
                        )}
                    </section>
                </div>
            </aside>
        </div>
    );
};

// ─── Pagina ───────────────────────────────────────────────────────────────────

const LoyaltyCardsPage: React.FC = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filter, setFilter] = useState<Filter>('all');
    const [sort, setSort] = useState<Sort>('lastVisit');
    const [selectedId, setSelectedId] = useState<number | null>(null);
    const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [cardsList, setCardsList] = useState<CardDto[]>([]);
    const [loyalty, setLoyalty] = useState<LoyaltySettings | null>(null);
    const {addNotification} = useNotification();

    const loadCards = useCallback(async () => {
        const response = await getAllCardsApi();
        if (response && response.success && response.data?.data) {
            setCardsList(response.data.data);
        } else {
            addNotification({message: "Errore caricamento tessere", type: "error"});
        }
        setLoading(false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => { loadCards(); }, [loadCards]);

    const selectedCard = cardsList.find(c => c.id === selectedId) ?? null;
    const replaceCard = (card: CardDto) => setCardsList(prev => prev.map(c => c.id === card.id ? card : c));

    const hasBoth = cardsList.some(c => c.typePoints) && cardsList.some(c => !c.typePoints);

    const filteredCards = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();
        const list = cardsList.filter(c => {
            if (q && ![c.code, c.holderName ?? '', c.holderContact ?? ''].some(v => v.toLowerCase().includes(q))) return false;
            switch (filter) {
                case 'visits': return !c.typePoints;
                case 'points': return c.typePoints;
                case 'prize': return prizeReady(c);
                case 'inactive': return daysSince(c.lastVisitAt ?? c.createdAt) > INACTIVE_DAYS;
                default: return true;
            }
        });
        const time = (iso?: string | null) => (iso ? new Date(iso).getTime() || 0 : 0);
        return [...list].sort((a, b) => {
            switch (sort) {
                case 'balance': return (b.typePoints ? b.actualValue : b.actualValue / Math.max(1, b.scope))
                    - (a.typePoints ? a.actualValue : a.actualValue / Math.max(1, a.scope));
                case 'spent': return (b.totalSpentCents ?? 0) - (a.totalSpentCents ?? 0);
                case 'created': return time(b.createdAt) - time(a.createdAt);
                default: return time(b.lastVisitAt) - time(a.lastVisitAt) || time(b.createdAt) - time(a.createdAt);
            }
        });
    }, [cardsList, searchTerm, filter, sort]);

    const kpi = useMemo(() => ({
        total: cardsList.length,
        active: cardsList.filter(c => daysSince(c.lastVisitAt) <= 30).length,
        prizes: cardsList.filter(prizeReady).length,
        points: cardsList.filter(c => c.typePoints).reduce((s, c) => s + c.actualValue, 0),
        spent: cardsList.reduce((s, c) => s + (c.totalSpentCents ?? 0), 0),
    }), [cardsList]);

    const handleCreateCard = async (add: AddCard) => {
        setLoading(true);
        const response = await addCardApi(add);
        if (response && response.success && response.data?.data) {
            const card = response.data.data;
            setCardsList(prev => [card, ...prev]);
            setSelectedId(card.id);
        } else {
            addNotification({message: "Errore creazione tessera", type: "error"});
        }
        setLoading(false);
    };

    const filters: { key: Filter; label: string; count?: number }[] = [
        {key: 'all', label: 'Tutte', count: kpi.total},
        ...(hasBoth ? [{key: 'visits' as Filter, label: 'A visite'}, {key: 'points' as Filter, label: 'A punti'}] : []),
        {key: 'prize', label: 'Premio pronto', count: kpi.prizes},
        {key: 'inactive', label: `Inattive da ${INACTIVE_DAYS} gg`},
    ];

    const expiry = expiryLabel(loyalty);

    return (
        <div className="p-4 md:p-6 bg-slate-50 min-h-screen">
            {loading && <CustomLoading isTransparent={true} isFullPage={true}/>}
            {isIssueModalOpen && <AddCardModal settings={loyalty} onClose={() => setIsIssueModalOpen(false)} onCreate={handleCreateCard}/>}
            {selectedCard && (
                <CardDetail
                    card={selectedCard}
                    settings={loyalty}
                    onClose={() => setSelectedId(null)}
                    onChanged={replaceCard}
                    onDeleted={id => {
                        setCardsList(prev => prev.filter(c => c.id !== id));
                        setSelectedId(null);
                        addNotification({message: "Tessera eliminata", type: "success"});
                    }}
                />
            )}

            <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Tessere fedeltà</h1>
                    <p className="text-gray-500 mt-1">Tutte le tessere emesse, con saldo, visite e storico.</p>
                </div>
                <button onClick={() => setIsIssueModalOpen(true)} className="btn-primary flex items-center justify-center">
                    <PlusIcon className="w-5 h-5 mr-2"/>Nuova tessera
                </button>
            </div>

            {/* Cambiando le regole cambiano i valori effettivi delle tessere: si ricaricano */}
            <LoyaltySettingsPanel onLoaded={setLoyalty} onSaved={s => { setLoyalty(s); loadCards(); }} onCardsReset={loadCards}/>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl shadow-lg">
                    <p className="text-sm text-gray-500">Tessere emesse</p>
                    <p className="text-2xl font-bold">{kpi.total}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-lg">
                    <p className="text-sm text-gray-500">Attive (30 giorni)</p>
                    <p className="text-2xl font-bold">{kpi.active}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-lg">
                    <p className="text-sm text-gray-500">{cardsList.some(c => c.typePoints) && !cardsList.some(c => !c.typePoints) ? 'Punti in circolo' : 'Premi da riscattare'}</p>
                    <p className="text-2xl font-bold text-emerald-600">
                        {cardsList.some(c => c.typePoints) && !cardsList.some(c => !c.typePoints) ? kpi.points : kpi.prizes}
                    </p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-lg">
                    <p className="text-sm text-gray-500">Speso dai tesserati</p>
                    <p className="text-2xl font-bold">{formatCents(kpi.spent)}</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg">
                <div className="p-4 flex flex-col lg:flex-row gap-3 lg:items-center justify-between border-b border-gray-100">
                    <div className="relative w-full lg:max-w-sm">
                        <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
                        <input type="text" placeholder="Cerca per codice, nome o contatto" value={searchTerm}
                               onChange={e => setSearchTerm(e.target.value)}
                               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:outline-none"/>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {filters.map(f => (
                            <button key={f.key} onClick={() => setFilter(f.key)}
                                    className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                                        filter === f.key ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
                                {f.label}{f.count != null && f.count > 0 ? ` · ${f.count}` : ''}
                            </button>
                        ))}
                        <select value={sort} onChange={e => setSort(e.target.value as Sort)}
                                className="text-sm border border-gray-200 rounded-md py-1.5 px-2 text-gray-700" aria-label="Ordina">
                            <option value="lastVisit">Ultima visita</option>
                            <option value="balance">Saldo</option>
                            <option value="spent">Spesa totale</option>
                            <option value="created">Data di emissione</option>
                        </select>
                    </div>
                </div>
                {expiry && <p className="px-4 pt-3 text-xs text-gray-500">Regola attiva: {expiry}.</p>}

                {filteredCards.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="font-semibold text-gray-600">{cardsList.length === 0 ? 'Nessuna tessera emessa' : 'Nessuna tessera trovata'}</p>
                        <p className="text-sm text-gray-500 mt-1">
                            {cardsList.length === 0 ? 'Crea la prima tessera e consegnala al cliente con il QR.' : 'Prova a cambiare ricerca o filtro.'}
                        </p>
                    </div>
                ) : (
                    <>
                        {/* Desktop: tabella */}
                        <table className="hidden md:table w-full text-sm">
                            <thead>
                            <tr className="text-left text-xs uppercase tracking-wide text-gray-400">
                                <th className="px-4 py-3 font-semibold">Tessera</th>
                                <th className="px-4 py-3 font-semibold">Saldo</th>
                                <th className="px-4 py-3 font-semibold text-right">Visite</th>
                                <th className="px-4 py-3 font-semibold text-right">Spesa totale</th>
                                <th className="px-4 py-3 font-semibold">Ultima visita</th>
                                <th className="px-4 py-3"/>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                            {filteredCards.map(c => (
                                <tr key={c.id} onClick={() => setSelectedId(c.id)} className="cursor-pointer hover:bg-slate-50">
                                    <td className="px-4 py-3">
                                        <p className="font-semibold text-gray-900">{c.holderName || <span className="font-mono">{c.code}</span>}</p>
                                        <p className="text-xs text-gray-500">
                                            {c.holderName && <span className="font-mono">{c.code} · </span>}
                                            {c.typePoints ? 'A punti' : 'A visite'}
                                        </p>
                                    </td>
                                    <td className="px-4 py-3 min-w-[10rem]">
                                        <p className="font-semibold text-gray-900">
                                            {balanceLabel(c)}
                                            {prizeReady(c) && <span className="ml-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">premio</span>}
                                        </p>
                                        {!c.typePoints && <div className="mt-1 max-w-[10rem]"><VisitDots value={c.actualValue} scope={c.scope}/></div>}
                                    </td>
                                    <td className="px-4 py-3 text-right tabular-nums">{c.visitsCount ?? 0}</td>
                                    <td className="px-4 py-3 text-right tabular-nums">{formatCents(c.totalSpentCents)}</td>
                                    <td className="px-4 py-3 text-gray-600">{relativeDay(c.lastVisitAt)}</td>
                                    <td className="px-4 py-3 text-gray-300"><ChevronRightIcon className="w-4 h-4"/></td>
                                </tr>
                            ))}
                            </tbody>
                        </table>

                        {/* Mobile: elenco */}
                        <ul className="md:hidden divide-y divide-gray-100">
                            {filteredCards.map(c => (
                                <li key={c.id}>
                                    <button onClick={() => setSelectedId(c.id)} className="w-full text-left px-4 py-3 flex items-center gap-3">
                                        <div className="min-w-0 flex-1">
                                            <p className="font-semibold text-gray-900 truncate">{c.holderName || <span className="font-mono">{c.code}</span>}</p>
                                            <p className="text-xs text-gray-500">
                                                {balanceLabel(c)} · {c.visitsCount ?? 0} visite · {relativeDay(c.lastVisitAt)}
                                            </p>
                                        </div>
                                        {prizeReady(c) && <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">premio</span>}
                                        <ChevronRightIcon className="w-4 h-4 text-gray-300 shrink-0"/>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </div>
        </div>
    );
};

export default LoyaltyCardsPage;
