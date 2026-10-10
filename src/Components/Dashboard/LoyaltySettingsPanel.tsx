import React, { useEffect, useState } from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { LoyaltySettings } from '../../types';
import { getLoyaltySettingsApi, updateLoyaltySettingsApi } from '../../Utilities/api';
import { useNotification } from '../../Context/NotificationContext';

const toInput = (n: number | null | undefined) => (n == null ? '' : String(n).replace('.', ','));

const parseNum = (v: string): number | null | undefined => {
    if (v.trim() === '') return null;
    const n = parseFloat(v.replace(',', '.'));
    return Number.isFinite(n) ? n : undefined; // undefined = non valido
};

/**
 * Regole delle tessere a livello di locale. Valgono per tutte le tessere, anche quelle già emesse:
 * cambiando "1 punto ogni X €" non serve riemettere le carte.
 */
const LoyaltySettingsPanel: React.FC<{
    onLoaded?: (s: LoyaltySettings) => void;
    onSaved?: (s: LoyaltySettings) => void;
}> = ({ onLoaded, onSaved }) => {
    const { addNotification } = useNotification();
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [eurosPerPoint, setEurosPerPoint] = useState('');
    const [pointValue, setPointValue] = useState('');
    const [stampsForPrize, setStampsForPrize] = useState('');
    const [stampsPrize, setStampsPrize] = useState('');
    const [configured, setConfigured] = useState(true);

    const fill = (s: LoyaltySettings) => {
        setEurosPerPoint(toInput(s.eurosPerPoint));
        setPointValue(toInput(s.pointValue));
        setStampsForPrize(s.stampsForPrize == null ? '' : String(s.stampsForPrize));
        setStampsPrize(s.stampsPrize ?? '');
        setConfigured(s.eurosPerPoint != null || s.stampsForPrize != null);
    };

    useEffect(() => {
        getLoyaltySettingsApi().then(r => {
            if (r.success && r.data?.data) {
                fill(r.data.data);
                onLoaded?.(r.data.data);
                // Primo utilizzo: apri il pannello per invitare a impostare le regole
                if (r.data.data.eurosPerPoint == null && r.data.data.stampsForPrize == null) setOpen(true);
            }
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const save = async () => {
        const epp = parseNum(eurosPerPoint);
        const pv = parseNum(pointValue);
        const sfp = stampsForPrize.trim() === '' ? null : Number(stampsForPrize);
        if (epp === undefined || (epp !== null && epp <= 0)) {
            addNotification({ type: 'warning', message: '"1 punto ogni" deve essere un importo maggiore di zero' });
            return;
        }
        if (pv === undefined || (pv !== null && pv < 0)) {
            addNotification({ type: 'warning', message: 'Valore del punto non valido' });
            return;
        }
        if (sfp !== null && (!Number.isInteger(sfp) || sfp < 1)) {
            addNotification({ type: 'warning', message: 'Il numero di timbri deve essere un intero maggiore di zero' });
            return;
        }
        setSaving(true);
        const res = await updateLoyaltySettingsApi({
            eurosPerPoint: epp, pointValue: pv, stampsForPrize: sfp,
            stampsPrize: stampsPrize.trim() || null,
        });
        setSaving(false);
        if (res.success && res.data?.data) {
            fill(res.data.data);
            onSaved?.(res.data.data);
            addNotification({ type: 'success', message: 'Regole tessere salvate: valgono per tutte le tessere' });
            setOpen(false);
        } else {
            addNotification({ type: 'error', message: res.message && !res.message.startsWith('Request failed') ? res.message : 'Errore nel salvataggio' });
        }
    };

    const summary = [
        eurosPerPoint && `1 punto ogni ${eurosPerPoint} €`,
        pointValue && `1 punto vale ${pointValue} €`,
        stampsForPrize && `premio a ${stampsForPrize} timbri${stampsPrize ? ` (${stampsPrize})` : ''}`,
    ].filter(Boolean).join(' · ');

    return (
        <div className="bg-white rounded-xl shadow-lg mb-6">
            <button onClick={() => setOpen(o => !o)}
                    className="w-full flex items-center justify-between gap-3 p-4 text-left">
                <span className="flex items-center gap-3 min-w-0">
                    <Cog6ToothIcon className="w-5 h-5 text-gray-500 shrink-0" />
                    <span className="min-w-0">
                        <span className="block font-semibold text-gray-800">Regole tessere</span>
                        <span className="block text-sm text-gray-500 truncate">
                            {configured && summary ? summary : 'Non impostate: imposta quanto vale un punto e quanti timbri servono'}
                        </span>
                    </span>
                </span>
                <span className="text-sm font-semibold text-primary shrink-0">{open ? 'Chiudi' : 'Modifica'}</span>
            </button>

            {open && (
                <div className="border-t border-gray-100 p-4 space-y-5">
                    <p className="text-sm text-gray-500">
                        Valgono per tutte le tessere del locale, anche quelle già consegnate ai clienti. Se cambi una regola, si applica da subito.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <fieldset className="space-y-3">
                            <legend className="font-semibold text-gray-700 mb-1">Tessere a punti</legend>
                            <label className="block">
                                <span className="label-style">1 punto ogni (€ spesi)</span>
                                <input type="text" inputMode="decimal" value={eurosPerPoint} placeholder="es. 1"
                                       onChange={e => setEurosPerPoint(e.target.value.replace(/[^0-9.,]/g, ''))}
                                       className="input-style w-full" />
                            </label>
                            <label className="block">
                                <span className="label-style">Valore di 1 punto quando si usa in cassa (€)</span>
                                <input type="text" inputMode="decimal" value={pointValue} placeholder="es. 0,05 (100 punti = 5 €)"
                                       onChange={e => setPointValue(e.target.value.replace(/[^0-9.,]/g, ''))}
                                       className="input-style w-full" />
                                <span className="block text-xs text-gray-400 mt-1">Vuoto = il valore lo decide l'operatore a ogni riscatto.</span>
                            </label>
                        </fieldset>
                        <fieldset className="space-y-3">
                            <legend className="font-semibold text-gray-700 mb-1">Tessere a timbri</legend>
                            <label className="block">
                                <span className="label-style">Timbri per il premio</span>
                                <input type="number" min={1} value={stampsForPrize} placeholder="es. 10"
                                       onChange={e => setStampsForPrize(e.target.value)}
                                       className="input-style w-full" />
                            </label>
                            <label className="block">
                                <span className="label-style">Premio</span>
                                <input type="text" maxLength={120} value={stampsPrize} placeholder="es. Caffè omaggio"
                                       onChange={e => setStampsPrize(e.target.value)}
                                       className="input-style w-full" />
                            </label>
                        </fieldset>
                    </div>
                    <div className="flex justify-end">
                        <button onClick={save} disabled={saving} className="btn-primary disabled:opacity-60">
                            {saving ? 'Salvataggio…' : 'Salva regole'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoyaltySettingsPanel;
