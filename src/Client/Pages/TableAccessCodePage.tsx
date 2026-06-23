import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useNotification } from '../../Context/NotificationContext';
import { useData } from '../../Context/DataContext';
import { lookupTableSessionApi, joinTableSessionApi } from '../../Utilities/api';
import { getOrCreateClientSessionId, saveTableSession } from '../../Utilities/Utilities';
import { JoinResponse, TableLookup } from '../../types';
import { Lock, RefreshCw, Users } from 'lucide-react';

const CODE_LENGTH = 4;

const TableAccessCodePage: React.FC = () => {
    const { localname } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { addNotification } = useNotification();
    const { styles } = useData();

    const tableIdParam = searchParams.get('table');
    const tableId = tableIdParam ? Number(tableIdParam) : NaN;

    const [lookupLoading, setLookupLoading] = useState<boolean>(true);
    const [lookup, setLookup] = useState<TableLookup | null>(null);
    const [code, setCode] = useState<string>('');
    const [joining, setJoining] = useState<boolean>(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const primaryColor = styles?.primary?.trim() || '#f97316';

    const fetchLookup = useCallback(async () => {
        if (!localname || Number.isNaN(tableId)) {
            setLookupLoading(false);
            return;
        }
        setLookupLoading(true);
        const result = await lookupTableSessionApi(tableId, localname);
        if (result.success && result.data) {
            setLookup(result.data);
        } else {
            setLookup(null);
            addNotification({ type: 'error', message: 'Tavolo non trovato' });
        }
        setLookupLoading(false);
    }, [localname, tableId, addNotification]);

    useEffect(() => {
        fetchLookup();
    }, [fetchLookup]);

    const handleJoin = async () => {
        if (!localname || Number.isNaN(tableId)) return;
        if (code.length !== CODE_LENGTH) {
            setErrorMsg(`La password è di ${CODE_LENGTH} caratteri.`);
            return;
        }
        setErrorMsg(null);
        setJoining(true);
        const clientSessionId = getOrCreateClientSessionId();
        const result = await joinTableSessionApi({ tableId, code: code.toUpperCase(), localname, clientSessionId });
        setJoining(false);

        if (result.success && result.data && !('error' in (result.data as object))) {
            const joined = result.data as JoinResponse;
            saveTableSession(joined.sessionId, joined.tableId, localname);
            try { localStorage.setItem('rf_table_id', String(joined.tableId)); } catch { /* noop */ }
            navigate(`/${localname}/Categories?table=${joined.tableId}`);
            return;
        }

        const errorBody = result.data as { error?: string } | null;
        if (result.status === 401 || errorBody?.error === 'INVALID_CODE') {
            setErrorMsg('Password errata. Riprova.');
        } else if (result.status === 409 || errorBody?.error === 'TABLE_NOT_OPEN') {
            setErrorMsg('Il tavolo non è più aperto. Chiama il cameriere.');
            fetchLookup();
        } else {
            setErrorMsg("Errore di connessione. Riprova.");
        }
    };

    if (lookupLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--menu-bg)' }}>
                <p style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)' }}>Caricamento...</p>
            </div>
        );
    }

    if (!lookup) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--menu-bg)' }}>
                <div className="max-w-sm w-full text-center p-6 rounded-2xl" style={{ background: 'var(--menu-surface)', border: '1px solid var(--menu-border)' }}>
                    <p className="font-semibold mb-2" style={{ color: 'var(--menu-text)', fontFamily: 'var(--menu-font-display)' }}>Tavolo non valido</p>
                    <p className="text-sm" style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)' }}>Scansiona di nuovo il QR code o chiedi al personale.</p>
                </div>
            </div>
        );
    }

    if (!lookup.busy) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--menu-bg)' }}>
                <div className="max-w-sm w-full text-center p-6 rounded-2xl" style={{ background: 'var(--menu-surface)', border: '1px solid var(--menu-border)' }}>
                    <Users className="w-12 h-12 mx-auto mb-3" style={{ color: primaryColor }} />
                    <h1 className="font-semibold mb-2" style={{ color: 'var(--menu-text)', fontFamily: 'var(--menu-font-display)', fontSize: '1.4rem' }}>
                        Tavolo {lookup.tableName} non aperto
                    </h1>
                    <p className="text-sm mb-5" style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)' }}>
                        Chiama il cameriere per attivare l'ordinazione di gruppo a questo tavolo.
                    </p>
                    <button
                        onClick={fetchLookup}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold"
                        style={{ background: primaryColor, color: 'var(--menu-accent-text)', fontFamily: 'var(--menu-font-body)' }}
                    >
                        <RefreshCw className="w-4 h-4" />
                        Riprova
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--menu-bg)' }}>
            <div className="max-w-sm w-full p-6 rounded-2xl" style={{ background: 'var(--menu-surface)', border: '1px solid var(--menu-border)' }}>
                <div className="text-center mb-5">
                    <Lock className="w-10 h-10 mx-auto mb-2" style={{ color: primaryColor }} />
                    <h1 className="font-semibold" style={{ color: 'var(--menu-text)', fontFamily: 'var(--menu-font-display)', fontSize: '1.5rem' }}>
                        {lookup.tableName}
                    </h1>
                    <p className="text-xs mt-1" style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)' }}>
                        Inserisci la password di 4 caratteri data dal cameriere
                    </p>
                    {typeof lookup.connectedCount === 'number' && (
                        <p className="text-xs mt-2" style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)' }}>
                            {lookup.connectedCount} {lookup.connectedCount === 1 ? 'persona collegata' : 'persone collegate'}
                        </p>
                    )}
                </div>

                <input
                    inputMode="text"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    maxLength={CODE_LENGTH}
                    value={code}
                    onChange={(e) => {
                        const v = e.target.value.toUpperCase().replace(/\s/g, '');
                        setCode(v.slice(0, CODE_LENGTH));
                        if (errorMsg) setErrorMsg(null);
                    }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && code.length === CODE_LENGTH) handleJoin();
                    }}
                    className="w-full text-center font-mono"
                    style={{
                        background: 'var(--menu-input-bg)',
                        color: 'var(--menu-text)',
                        border: '1px solid var(--menu-border)',
                        borderRadius: 14,
                        fontSize: '2rem',
                        letterSpacing: '0.6rem',
                        padding: '14px 12px',
                        outline: 'none',
                        textTransform: 'uppercase',
                    }}
                    placeholder="––––"
                />

                {errorMsg && (
                    <p className="text-xs mt-3 text-center" style={{ color: '#ef4444', fontFamily: 'var(--menu-font-body)' }}>
                        {errorMsg}
                    </p>
                )}

                <button
                    onClick={handleJoin}
                    disabled={joining || code.length !== CODE_LENGTH}
                    className="w-full mt-5 py-3 rounded-2xl text-sm font-semibold transition-opacity"
                    style={{
                        background: primaryColor,
                        color: 'var(--menu-accent-text)',
                        opacity: joining || code.length !== CODE_LENGTH ? 0.5 : 1,
                        cursor: joining || code.length !== CODE_LENGTH ? 'not-allowed' : 'pointer',
                        fontFamily: 'var(--menu-font-body)',
                    }}
                >
                    {joining ? 'Connessione...' : 'Entra al tavolo'}
                </button>

                <button
                    onClick={fetchLookup}
                    className="w-full mt-3 text-xs"
                    style={{ color: 'var(--menu-muted)', fontFamily: 'var(--menu-font-body)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    Aggiorna stato tavolo
                </button>
            </div>
        </div>
    );
};

export default TableAccessCodePage;
