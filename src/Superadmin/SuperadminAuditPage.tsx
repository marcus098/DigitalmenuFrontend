import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { getAgencies, getAuditLog } from './superadminApi';
import { AgencySummary, AuditEntry } from './types';
import { AuditList, ErrorBox, Spinner } from './components';

const LIMITS = [50, 100, 200, 500];

const SuperadminAuditPage: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const agencyId = Number(searchParams.get('agencyId')) || null;
    const [limit, setLimit] = useState(100);
    const [entries, setEntries] = useState<AuditEntry[]>([]);
    const [agencies, setAgencies] = useState<AgencySummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        const res = await getAuditLog(agencyId, limit);
        setLoading(false);
        if (res.ok) {
            setEntries(res.data ?? []);
            setError(null);
        } else {
            setError(res.message);
        }
    }, [agencyId, limit]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        getAgencies('', '').then(res => {
            if (res.ok && res.data) setAgencies([...res.data].sort((a, b) => a.name.localeCompare(b.name, 'it')));
        });
    }, []);

    const setAgencyFilter = (value: string) => {
        const next = new URLSearchParams(searchParams);
        if (value) next.set('agencyId', value); else next.delete('agencyId');
        setSearchParams(next, { replace: true });
    };

    return (
        <div className="p-4 md:p-6 max-w-[1400px] mx-auto">
            <div className="mb-6 flex justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800">Audit</h1>
                    <p className="text-gray-500 mt-1">Registro delle operazioni effettuate dagli amministratori della piattaforma.</p>
                </div>
                <button onClick={load} disabled={loading} className="btn-secondary flex items-center text-sm" title="Aggiorna">
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-4 mb-4 flex flex-col sm:flex-row sm:items-end gap-3">
                <label className="block sm:w-80">
                    <span className="label-style">Locale</span>
                    <select className="input-style mt-1" value={agencyId ?? ''} onChange={e => setAgencyFilter(e.target.value)}>
                        <option value="">Tutti i locali</option>
                        {agencies.map(a => <option key={a.id} value={a.id}>{a.name} (/{a.localname})</option>)}
                        {agencyId && !agencies.some(a => a.id === agencyId) && <option value={agencyId}>#{agencyId}</option>}
                    </select>
                </label>
                <label className="block sm:w-40">
                    <span className="label-style">Righe</span>
                    <select className="input-style mt-1" value={limit} onChange={e => setLimit(Number(e.target.value))}>
                        {LIMITS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                </label>
            </div>

            {error && <div className="mb-4"><ErrorBox>{error}</ErrorBox></div>}

            <div className={`bg-white rounded-xl shadow-sm px-4 md:px-6 py-2 ${loading && entries.length ? 'opacity-60' : ''}`}>
                {loading && entries.length === 0
                    ? <Spinner />
                    : <AuditList entries={entries} showAgency onAgencyClick={id => navigate(`/superadmin/agencies/${id}`)} />}
            </div>
        </div>
    );
};

export default SuperadminAuditPage;
