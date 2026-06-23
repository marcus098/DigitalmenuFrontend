import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useNotification } from '../../Context/NotificationContext';
import { useData } from '../../Context/DataContext';
import { getOrCreateClientSessionId, getTableSession } from '../../Utilities/Utilities';
import { setNotReadyApi, submitTableSessionApi } from '../../Utilities/api';
import { useTableSessionSSE } from '../../Hooks/useTableSessionSSE';
import { TableSessionState } from '../../types';
import { ArrowLeft, Check, Clock, Send, Users } from 'lucide-react';

const TableSessionWaitingPage: React.FC = () => {
    const { localname } = useParams();
    const navigate = useNavigate();
    const { addNotification } = useNotification();
    const { styles } = useData();

    const stored = useMemo(() => getTableSession(), []);
    const clientSessionId = useMemo(() => getOrCreateClientSessionId(), []);

    const [state, setState] = useState<TableSessionState | null>(null);
    const [busy, setBusy] = useState<boolean>(false);
    const [loaded, setLoaded] = useState<boolean>(false);

    const primaryColor = styles?.primary?.trim() || '#f97316';

    useEffect(() => {
        if (!stored) {
            navigate(`/${localname ?? ''}`, { replace: true });
        }
    }, [stored, localname, navigate]);

    const onState = useCallback((s: TableSessionState) => {
        setState(s);
        setLoaded(true);
        if (s.status === 'SUBMITTED') {
            navigate(`/${localname}/table-live`);
        } else if (s.status === 'CLOSED') {
            navigate(`/${localname}/table-live`);
        }
    }, [localname, navigate]);

    useTableSessionSSE(stored?.sessionId ?? null, clientSessionId, onState);

    const handleEdit = async () => {
        if (!stored) return;
        setBusy(true);
        const result = await setNotReadyApi(stored.sessionId, clientSessionId);
        setBusy(false);
        if (result.success) {
            navigate(`/${localname}/cart`);
        } else {
            addNotification({ type: 'error', message: 'Impossibile modificare l\'ordine ora.' });
        }
    };

    const handleSubmit = async () => {
        if (!stored) return;
        setBusy(true);
        const result = await submitTableSessionApi(stored.sessionId, clientSessionId);
        setBusy(false);
        if (result.success && result.data && !('error' in (result.data as object))) {
            navigate(`/${localname}/table-live`);
            return;
        }
        const errBody = result.data as { error?: string } | null;
        if (errBody?.error === 'NOT_SUBMITTABLE') {
            addNotification({ type: 'warning', message: 'Non tutti i clienti sono pronti.' });
        } else if (errBody?.error === 'ALREADY_SUBMITTED') {
            addNotification({ type: 'info', message: 'Ordine già inviato.' });
            navigate(`/${localname}/table-live`);
        } else {
            addNotification({ type: 'error', message: 'Errore nell\'invio. Riprova.' });
        }
    };

    if (!stored || !loaded || !state) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--menu-bg)' }}>
                <p style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)' }}>Caricamento sessione...</p>
            </div>
        );
    }

    const readyCount = state.clients.filter(c => c.ready).length;
    const me = state.clients.find(c => c.isYou);
    const youReady = me?.ready ?? false;
    const isOpen = state.status === 'OPEN';

    return (
        <div className="min-h-screen px-4 pt-6 pb-12" style={{ background: 'var(--menu-bg)' }}>
            <div className="max-w-md mx-auto">
                <button
                    onClick={() => navigate(`/${localname}/Categories?table=${stored.tableId}`)}
                    className="flex items-center gap-2 text-sm font-medium mb-5"
                    style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    Torna al menu
                </button>

                <h1
                    className="font-semibold mb-1"
                    style={{ color: 'var(--menu-text)', fontFamily: 'var(--menu-font-display)', fontSize: '1.7rem' }}
                >
                    {state.tableName}
                </h1>
                <p className="text-sm mb-1" style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)' }}>
                    Sei <span style={{ color: 'var(--menu-text)', fontWeight: 600 }}>{me?.label ?? 'Tu'}</span>
                </p>

                <div className="flex items-center gap-2 mb-5">
                    <Users className="w-4 h-4" style={{ color: primaryColor }} />
                    <p className="text-sm" style={{ color: 'var(--menu-text)', fontFamily: 'var(--menu-font-body)' }}>
                        Pronti {readyCount}/{state.clients.length}
                    </p>
                </div>

                <div className="rounded-2xl mb-6 overflow-hidden" style={{ background: 'var(--menu-surface)', border: '1px solid var(--menu-border)' }}>
                    {state.clients.map((c, idx) => (
                        <div
                            key={c.clientSessionId}
                            className="flex items-center justify-between px-4 py-3"
                            style={{
                                borderTop: idx === 0 ? 'none' : '1px solid var(--menu-border)',
                                background: c.isYou ? 'color-mix(in srgb, var(--menu-accent) 10%, transparent)' : 'transparent',
                            }}
                        >
                            <div className="flex items-center gap-3">
                                {c.ready ? (
                                    <Check className="w-5 h-5" style={{ color: '#22c55e' }} />
                                ) : (
                                    <Clock className="w-5 h-5" style={{ color: 'var(--menu-muted)' }} />
                                )}
                                <div>
                                    <p className="text-sm font-semibold" style={{ color: 'var(--menu-text)', fontFamily: 'var(--menu-font-body)' }}>
                                        {c.label}{c.isYou ? ' (tu)' : ''}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)' }}>
                                        {c.ready ? `Pronto · ${c.draftItemsCount} prodott${c.draftItemsCount === 1 ? 'o' : 'i'}` : 'Sta scegliendo...'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex flex-col gap-2">
                    <button
                        onClick={handleEdit}
                        disabled={busy || !isOpen}
                        className="w-full py-3 rounded-2xl text-sm font-semibold transition-opacity"
                        style={{
                            background: 'var(--menu-input-bg)',
                            color: 'var(--menu-text)',
                            opacity: busy || !isOpen ? 0.5 : 1,
                            cursor: busy || !isOpen ? 'not-allowed' : 'pointer',
                            fontFamily: 'var(--menu-font-body)',
                            border: '1px solid var(--menu-border)',
                        }}
                    >
                        Modifica ordine
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={busy || !state.submittable || !youReady}
                        className="w-full py-3 rounded-2xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition-opacity"
                        style={{
                            background: primaryColor,
                            color: 'var(--menu-accent-text)',
                            opacity: busy || !state.submittable || !youReady ? 0.5 : 1,
                            cursor: busy || !state.submittable || !youReady ? 'not-allowed' : 'pointer',
                            fontFamily: 'var(--menu-font-body)',
                        }}
                    >
                        <Send className="w-4 h-4" />
                        Invia ordini al cameriere
                    </button>

                    {!state.submittable && (
                        <p className="text-xs text-center mt-1" style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)' }}>
                            In attesa che tutti i collegati siano pronti.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TableSessionWaitingPage;
