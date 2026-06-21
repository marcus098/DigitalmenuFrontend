import React, { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useData } from '../../Context/DataContext';
import { useLoginContext } from '../../Context/LoginContext';
import { EslConfigDto } from '../../types';
import { getEslConfigsApi, saveEslConfigApi, deleteEslConfigApi, pushEslTagApi } from '../../Utilities/api';
import { useNotification } from '../../Context/NotificationContext';

const QRCodePage: React.FC = () => {
    const { tablesMap } = useData();
    const { user } = useLoginContext();
    const { addNotification } = useNotification();
    const localname = user?.localname ?? '';
    const baseUrl = process.env.REACT_APP_URL ?? window.location.origin;
    const tables = Array.from(tablesMap.values()).filter((t: any) => !t.deleted);

    const [eslConfigs, setEslConfigs] = useState<Map<number, EslConfigDto>>(new Map());
    const [expandedEsl, setExpandedEsl] = useState<number | null>(null);
    const [eslForm, setEslForm] = useState<{ mac: string; apUrl: string }>({ mac: '', apUrl: '' });
    const [eslSaving, setEslSaving] = useState(false);
    const [eslPushing, setEslPushing] = useState<number | null>(null);

    useEffect(() => {
        getEslConfigsApi().then(r => {
            if (r.success && r.data) {
                const list: EslConfigDto[] = (r.data as any).data ?? r.data;
                const map = new Map<number, EslConfigDto>();
                list.forEach(c => map.set(c.tableId, c));
                setEslConfigs(map);
            }
        });
    }, []);

    const openEsl = (tableId: number) => {
        const existing = eslConfigs.get(tableId);
        setEslForm({ mac: existing?.eslTagMac ?? '', apUrl: existing?.eslApUrl ?? '' });
        setExpandedEsl(expandedEsl === tableId ? null : tableId);
    };

    const saveEsl = async (tableId: number) => {
        setEslSaving(true);
        const r = await saveEslConfigApi(tableId, eslForm.mac.trim(), eslForm.apUrl.trim());
        setEslSaving(false);
        if (r.success && r.data) {
            const cfg: EslConfigDto = (r.data as any).data ?? r.data;
            setEslConfigs(prev => new Map(prev).set(tableId, cfg));
            addNotification({ type: 'success', message: 'Configurazione ESL salvata' });
            setExpandedEsl(null);
        } else {
            addNotification({ type: 'error', message: 'Errore salvataggio ESL' });
        }
    };

    const pushEsl = async (tableId: number) => {
        setEslPushing(tableId);
        const r = await pushEslTagApi(tableId);
        setEslPushing(null);
        const ok = r.success && ((r.data as any)?.data?.success ?? (r.data as any)?.success);
        addNotification({ type: ok ? 'success' : 'error', message: ok ? 'QR inviato al tag e-ink!' : 'Errore invio al tag. Verifica la connessione AP.' });
    };

    const removeEsl = async (tableId: number) => {
        await deleteEslConfigApi(tableId);
        setEslConfigs(prev => { const m = new Map(prev); m.delete(tableId); return m; });
        addNotification({ type: 'success', message: 'Config ESL rimossa' });
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <h1 className="text-3xl font-bold mb-1">QR Code Tavoli</h1>
            <p className="text-zinc-500 mb-2 text-sm">Ogni QR code reindirizza al menù con il tavolo già associato.</p>
            <p className="text-zinc-400 mb-8 text-xs">
                <span className="font-semibold text-amber-600">E-Ink:</span> espandi il pannello ESL di un tavolo per associare il MAC del tag OpenEPaperLink — il QR verrà inviato automaticamente ogni volta che il tavolo viene occupato.
            </p>

            {tables.length === 0 ? (
                <div className="text-center py-16 text-zinc-400">
                    <p className="text-lg font-semibold">Nessun tavolo configurato.</p>
                    <p className="mt-1 text-sm">Aggiungi i tavoli dalla sezione Tavoli per generare i QR code.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tables.map(table => {
                        const url = `${baseUrl}/${localname}/Categories?table=${table.id}`;
                        const eslCfg = eslConfigs.get(table.id);
                        const hasEsl = !!(eslCfg?.eslTagMac);
                        const isExpanded = expandedEsl === table.id;

                        return (
                            <div key={table.id} className="flex flex-col bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
                                {/* QR section */}
                                <div className="flex flex-col items-center p-4">
                                    <div className="flex items-center gap-2 mb-3 w-full justify-between">
                                        <p className="font-bold text-zinc-800">{table.name}</p>
                                        {hasEsl && (
                                            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">E-INK ✓</span>
                                        )}
                                    </div>
                                    <QRCodeCanvas id={`qr-${table.id}`} value={url} size={160} />
                                    <p className="mt-3 text-xs text-zinc-400 text-center break-all">{url}</p>
                                    <button
                                        onClick={() => {
                                            const canvas = document.getElementById(`qr-${table.id}`) as HTMLCanvasElement;
                                            const dataUrl = canvas?.toDataURL();
                                            const w = window.open('', '_blank');
                                            if (w) {
                                                w.document.write(`<html><body style="text-align:center;font-family:sans-serif;padding:20px"><h2>${table.name}</h2><img src="${dataUrl}" width="200"/><p style="font-size:11px;color:#888">${url}</p></body></html>`);
                                                w.document.close();
                                                w.print();
                                            }
                                        }}
                                        className="mt-3 text-xs text-amber-600 font-semibold hover:underline"
                                    >
                                        Stampa
                                    </button>
                                </div>

                                {/* ESL toggle bar */}
                                <div className="border-t border-zinc-100">
                                    <button
                                        onClick={() => openEsl(table.id)}
                                        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-50 transition-colors"
                                    >
                                        <span>🏷️ Config E-Ink (ESL)</span>
                                        <span>{isExpanded ? '▲' : '▼'}</span>
                                    </button>

                                    {isExpanded && (
                                        <div className="px-4 pb-4 space-y-2 bg-zinc-50 border-t border-zinc-100">
                                            <div className="mt-2">
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">MAC address tag</label>
                                                <input
                                                    type="text"
                                                    placeholder="AA:BB:CC:DD:EE:FF"
                                                    value={eslForm.mac}
                                                    onChange={e => setEslForm(f => ({ ...f, mac: e.target.value }))}
                                                    className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-1">AP URL (lascia vuoto per default)</label>
                                                <input
                                                    type="text"
                                                    placeholder="http://192.168.1.50"
                                                    value={eslForm.apUrl}
                                                    onChange={e => setEslForm(f => ({ ...f, apUrl: e.target.value }))}
                                                    className="w-full px-2.5 py-1.5 border border-zinc-200 rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                                                />
                                            </div>
                                            <div className="flex gap-2 pt-1">
                                                <button
                                                    onClick={() => saveEsl(table.id)}
                                                    disabled={eslSaving || !eslForm.mac.trim()}
                                                    className="flex-1 py-1.5 bg-amber-500 text-white text-xs font-bold rounded-lg hover:bg-amber-600 disabled:opacity-50 transition-colors"
                                                >
                                                    {eslSaving ? 'Salvando…' : 'Salva'}
                                                </button>
                                                {hasEsl && (
                                                    <>
                                                        <button
                                                            onClick={() => pushEsl(table.id)}
                                                            disabled={eslPushing === table.id}
                                                            className="flex-1 py-1.5 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                                                        >
                                                            {eslPushing === table.id ? 'Invio…' : '📡 Invia QR'}
                                                        </button>
                                                        <button
                                                            onClick={() => removeEsl(table.id)}
                                                            className="py-1.5 px-2 bg-red-50 text-red-500 text-xs font-bold rounded-lg hover:bg-red-100 transition-colors"
                                                        >
                                                            ✕
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default QRCodePage;
