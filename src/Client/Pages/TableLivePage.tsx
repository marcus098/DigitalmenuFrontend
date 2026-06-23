import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../../Context/DataContext';
import { clearTableSession, getOrCreateClientSessionId, getTableSession } from '../../Utilities/Utilities';
import { useTableSessionSSE } from '../../Hooks/useTableSessionSSE';
import { TableSessionState } from '../../types';
import { Check, ChefHat, Clock, PartyPopper } from 'lucide-react';

const COMAND_STATUS_LABEL: Record<string, string> = {
    AWAIT: 'Inviato',
    PENDING: 'Inviato',
    WAITING: 'Inviato',
    PROGRESS: 'In preparazione',
    COMPLETED: 'Pronto!',
};

const TableLivePage: React.FC = () => {
    const { localname } = useParams();
    const navigate = useNavigate();
    const { styles } = useData();

    const stored = useMemo(() => getTableSession(), []);
    const clientSessionId = useMemo(() => getOrCreateClientSessionId(), []);
    const [state, setState] = useState<TableSessionState | null>(null);
    const [loaded, setLoaded] = useState<boolean>(false);
    const [onlyMine, setOnlyMine] = useState<boolean>(false);

    const primaryColor = styles?.primary?.trim() || '#f97316';

    useEffect(() => {
        if (!stored) {
            navigate(`/${localname ?? ''}`, { replace: true });
        }
    }, [stored, localname, navigate]);

    const onState = useCallback((s: TableSessionState) => {
        setState(s);
        setLoaded(true);
    }, []);

    useTableSessionSSE(stored?.sessionId ?? null, clientSessionId, onState);

    if (!stored || !loaded || !state) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--menu-bg)' }}>
                <p style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)' }}>Caricamento stato tavolo...</p>
            </div>
        );
    }

    if (state.status === 'CLOSED') {
        return (
            <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--menu-bg)' }}>
                <div className="max-w-sm w-full text-center p-6 rounded-2xl" style={{ background: 'var(--menu-surface)', border: '1px solid var(--menu-border)' }}>
                    <PartyPopper className="w-12 h-12 mx-auto mb-3" style={{ color: primaryColor }} />
                    <h1 className="font-semibold mb-2" style={{ color: 'var(--menu-text)', fontFamily: 'var(--menu-font-display)', fontSize: '1.3rem' }}>
                        Sessione chiusa
                    </h1>
                    <p className="text-sm mb-5" style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)' }}>
                        Il cameriere ha chiuso il tavolo. Grazie e arrivederci!
                    </p>
                    <button
                        onClick={() => { clearTableSession(); navigate(`/${localname}`); }}
                        className="px-5 py-2.5 rounded-full text-sm font-semibold"
                        style={{ background: primaryColor, color: 'var(--menu-accent-text)', fontFamily: 'var(--menu-font-body)' }}
                    >
                        Home
                    </button>
                </div>
            </div>
        );
    }

    const clientLabelById = new Map(state.clients.map(c => [c.clientSessionId, c.label]));
    const filteredComands = onlyMine
        ? state.comands.filter(c => c.clientSessionId === clientSessionId)
        : state.comands;

    const allCompleted = state.comands.length > 0 && state.comands.every(c => c.status === 'COMPLETED');

    return (
        <div className="min-h-screen px-4 pt-6 pb-12" style={{ background: 'var(--menu-bg)' }}>
            <div className="max-w-md mx-auto">
                <h1 className="font-semibold mb-1" style={{ color: 'var(--menu-text)', fontFamily: 'var(--menu-font-display)', fontSize: '1.7rem' }}>
                    Stato tavolo
                </h1>
                <p className="text-sm mb-5" style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)' }}>
                    {state.tableName} · {state.clients.length} {state.clients.length === 1 ? 'persona' : 'persone'}
                </p>

                <div
                    className="inline-flex rounded-full p-1 mb-5"
                    style={{ background: 'var(--menu-input-bg)', border: '1px solid var(--menu-border)' }}
                >
                    <button
                        onClick={() => setOnlyMine(false)}
                        className="px-4 py-1.5 rounded-full text-xs font-semibold"
                        style={{
                            background: !onlyMine ? primaryColor : 'transparent',
                            color: !onlyMine ? 'var(--menu-accent-text)' : 'var(--menu-text)',
                            fontFamily: 'var(--menu-font-body)',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        Tutti
                    </button>
                    <button
                        onClick={() => setOnlyMine(true)}
                        className="px-4 py-1.5 rounded-full text-xs font-semibold"
                        style={{
                            background: onlyMine ? primaryColor : 'transparent',
                            color: onlyMine ? 'var(--menu-accent-text)' : 'var(--menu-text)',
                            fontFamily: 'var(--menu-font-body)',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        Solo i miei
                    </button>
                </div>

                {filteredComands.length === 0 ? (
                    <div className="text-center py-12 rounded-2xl" style={{ background: 'var(--menu-surface)', border: '1px solid var(--menu-border)' }}>
                        <p className="text-sm" style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)' }}>
                            Nessun ordine.
                        </p>
                    </div>
                ) : (
                    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--menu-surface)', border: '1px solid var(--menu-border)' }}>
                        {filteredComands.map((c, idx) => {
                            const label = clientLabelById.get(c.clientSessionId) ?? 'Cliente';
                            const statusLabel = COMAND_STATUS_LABEL[c.status] ?? c.status;
                            const isMine = c.clientSessionId === clientSessionId;
                            const Icon = c.status === 'COMPLETED' ? Check : c.status === 'PROGRESS' ? ChefHat : Clock;
                            return (
                                <div
                                    key={c.comandId}
                                    className="flex items-center justify-between px-4 py-3"
                                    style={{ borderTop: idx === 0 ? 'none' : '1px solid var(--menu-border)' }}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon className="w-5 h-5" style={{ color: c.status === 'COMPLETED' ? '#22c55e' : primaryColor }} />
                                        <div>
                                            <p className="text-sm font-semibold" style={{ color: 'var(--menu-text)', fontFamily: 'var(--menu-font-body)' }}>
                                                {label}{isMine ? ' (tu)' : ''}
                                            </p>
                                            <p className="text-xs font-mono" style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)' }}>
                                                #{c.comandId.split('_')[0]}
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        className="text-xs font-semibold px-2 py-1 rounded-full"
                                        style={{
                                            background: c.status === 'COMPLETED' ? 'rgba(34,197,94,0.15)' : 'var(--menu-input-bg)',
                                            color: c.status === 'COMPLETED' ? '#22c55e' : 'var(--menu-text)',
                                            fontFamily: 'var(--menu-font-body)',
                                        }}
                                    >
                                        {statusLabel}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}

                {allCompleted && (
                    <div className="mt-6 text-center p-5 rounded-2xl" style={{ background: 'color-mix(in srgb, #22c55e 12%, transparent)', border: '1px dashed #22c55e' }}>
                        <PartyPopper className="w-10 h-10 mx-auto mb-2" style={{ color: '#22c55e' }} />
                        <p className="font-semibold" style={{ color: 'var(--menu-text)', fontFamily: 'var(--menu-font-display)' }}>
                            Tutto pronto, buon appetito!
                        </p>
                    </div>
                )}

                <button
                    onClick={() => navigate(`/${localname}/Categories?table=${stored.tableId}`)}
                    className="w-full mt-6 py-3 rounded-2xl text-sm font-semibold"
                    style={{
                        background: primaryColor,
                        color: 'var(--menu-accent-text)',
                        fontFamily: 'var(--menu-font-body)',
                        border: 'none',
                        cursor: 'pointer',
                    }}
                >
                    Aggiungi altro ordine
                </button>
            </div>
        </div>
    );
};

export default TableLivePage;
