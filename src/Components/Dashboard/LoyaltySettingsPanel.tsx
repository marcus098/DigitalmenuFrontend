import React, { useEffect, useState } from 'react';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';
import { LoyaltyExpiryPolicy, LoyaltyProgramType, LoyaltySettings } from '../../types';
import { getLoyaltySettingsApi, resetAllCardsApi, updateLoyaltySettingsApi } from '../../Utilities/api';
import { useNotification } from '../../Context/NotificationContext';

const toInput = (n: number | null | undefined) => (n == null ? '' : String(n).replace('.', ','));

const parseNum = (v: string): number | null | undefined => {
    if (v.trim() === '') return null;
    const n = parseFloat(v.replace(',', '.'));
    return Number.isFinite(n) ? n : undefined; // undefined = non valido
};

const MONTHS = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto',
    'settembre', 'ottobre', 'novembre', 'dicembre'];
const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

export const expiryLabel = (s: LoyaltySettings | null): string | null => {
    if (!s || !s.expiryPolicy || s.expiryPolicy === 'NONE') return null;
    if (s.expiryPolicy === 'YEARLY' && s.expiryMonth && s.expiryDay)
        return `saldi azzerati ogni ${s.expiryDay} ${MONTHS[s.expiryMonth - 1]}`;
    if (s.expiryPolicy === 'INACTIVITY' && s.inactivityMonths)
        return `saldi azzerati dopo ${s.inactivityMonths} ${s.inactivityMonths === 1 ? 'mese' : 'mesi'} senza movimenti`;
    return null;
};

const Segmented = <T extends string>({ value, options, onChange }: {
    value: T; options: { value: T; label: string }[]; onChange: (v: T) => void;
}) => (
    <div className="flex p-1 gap-1 bg-gray-100 rounded-lg">
        {options.map(o => (
            <button key={o.value} type="button" onClick={() => onChange(o.value)}
                    className={`flex-1 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                        value === o.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                {o.label}
            </button>
        ))}
    </div>
);

type ProgramChoice = LoyaltyProgramType | 'ANY';

/**
 * Regole delle tessere a livello di locale. Valgono per tutte le tessere, anche quelle già emesse:
 * cambiando "1 punto ogni X €" non serve riemettere le carte.
 */
const LoyaltySettingsPanel: React.FC<{
    onLoaded?: (s: LoyaltySettings) => void;
    onSaved?: (s: LoyaltySettings) => void;
    /** Dopo "azzera tutte": la pagina ricarica le tessere */
    onCardsReset?: () => void;
}> = ({ onLoaded, onSaved, onCardsReset }) => {
    const { addNotification } = useNotification();
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState<LoyaltySettings | null>(null);

    const [program, setProgram] = useState<ProgramChoice>('ANY');
    const [eurosPerPoint, setEurosPerPoint] = useState('');
    const [pointValue, setPointValue] = useState('');
    const [stampsForPrize, setStampsForPrize] = useState('');
    const [stampsPrize, setStampsPrize] = useState('');
    const [minSpend, setMinSpend] = useState('');
    const [oneVisitPerDay, setOneVisitPerDay] = useState(false);
    const [expiry, setExpiry] = useState<LoyaltyExpiryPolicy>('NONE');
    const [expiryMonth, setExpiryMonth] = useState(1);
    const [expiryDay, setExpiryDay] = useState(1);
    const [inactivityMonths, setInactivityMonths] = useState('12');

    const [confirmReset, setConfirmReset] = useState(false);
    const [resetting, setResetting] = useState(false);

    const fill = (s: LoyaltySettings) => {
        setSaved(s);
        setProgram(s.programType ?? 'ANY');
        setEurosPerPoint(toInput(s.eurosPerPoint));
        setPointValue(toInput(s.pointValue));
        setStampsForPrize(s.stampsForPrize == null ? '' : String(s.stampsForPrize));
        setStampsPrize(s.stampsPrize ?? '');
        setMinSpend(toInput(s.minSpendForVisit));
        setOneVisitPerDay(!!s.oneVisitPerDay);
        setExpiry(s.expiryPolicy ?? 'NONE');
        setExpiryMonth(s.expiryMonth ?? 1);
        setExpiryDay(s.expiryDay ?? 1);
        setInactivityMonths(s.inactivityMonths == null ? '12' : String(s.inactivityMonths));
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

    const usesPoints = program !== 'VISITS';
    const usesVisits = program !== 'POINTS';

    const save = async () => {
        const epp = parseNum(eurosPerPoint);
        const pv = parseNum(pointValue);
        const ms = parseNum(minSpend);
        const sfp = stampsForPrize.trim() === '' ? null : Number(stampsForPrize);
        const im = Number(inactivityMonths);
        const warn = (message: string) => addNotification({ type: 'warning', message });
        if (epp === undefined || (epp !== null && epp <= 0)) return warn('"1 punto ogni" deve essere un importo maggiore di zero');
        if (pv === undefined || (pv !== null && pv < 0)) return warn('Valore del punto non valido');
        if (sfp !== null && (!Number.isInteger(sfp) || sfp < 1)) return warn('Le visite per il premio devono essere un numero intero maggiore di zero');
        if (ms === undefined || (ms !== null && ms < 0)) return warn('Spesa minima non valida');
        if (expiry === 'INACTIVITY' && (!Number.isInteger(im) || im < 1 || im > 60)) return warn('I mesi di inattività vanno da 1 a 60');
        if (program === 'POINTS' && epp === null) return warn('Imposta quanti € servono per 1 punto');
        if (program === 'VISITS' && sfp === null) return warn('Imposta quante visite servono per il premio');

        setSaving(true);
        const res = await updateLoyaltySettingsApi({
            programType: program === 'ANY' ? null : program,
            eurosPerPoint: epp, pointValue: pv, stampsForPrize: sfp,
            stampsPrize: stampsPrize.trim() || null,
            minSpendForVisit: ms, oneVisitPerDay,
            expiryPolicy: expiry,
            expiryMonth: expiry === 'YEARLY' ? expiryMonth : null,
            expiryDay: expiry === 'YEARLY' ? expiryDay : null,
            inactivityMonths: expiry === 'INACTIVITY' ? im : null,
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

    const resetAll = async () => {
        setResetting(true);
        const res = await resetAllCardsApi();
        setResetting(false);
        setConfirmReset(false);
        if (res.success) {
            const n = res.data?.data ?? 0;
            addNotification({ type: 'success', message: n === 0 ? 'Nessuna tessera aveva un saldo' : `Azzerate ${n} tessere` });
            onCardsReset?.();
        } else {
            addNotification({ type: 'error', message: 'Errore durante l\'azzeramento' });
        }
    };

    const summary = saved ? [
        saved.programType === 'POINTS' ? 'Tessere a punti' : saved.programType === 'VISITS' ? 'Tessere a visite' : null,
        saved.programType !== 'VISITS' && saved.eurosPerPoint != null && `1 punto ogni ${toInput(saved.eurosPerPoint)} €`,
        saved.programType !== 'POINTS' && saved.stampsForPrize != null
            && `premio a ${saved.stampsForPrize} visite${saved.stampsPrize ? ` (${saved.stampsPrize})` : ''}`,
        expiryLabel(saved),
    ].filter(Boolean).join(' · ') : '';

    return (
        <div className="bg-white rounded-xl shadow-lg mb-6">
            <button onClick={() => setOpen(o => !o)}
                    className="w-full flex items-center justify-between gap-3 p-4 text-left">
                <span className="flex items-center gap-3 min-w-0">
                    <Cog6ToothIcon className="w-5 h-5 text-gray-500 shrink-0" />
                    <span className="min-w-0">
                        <span className="block font-semibold text-gray-800">Regole tessere</span>
                        <span className="block text-sm text-gray-500 truncate">
                            {summary || 'Non impostate: scegli punti o visite e quando si ottiene il premio'}
                        </span>
                    </span>
                </span>
                <span className="text-sm font-semibold text-primary shrink-0">{open ? 'Chiudi' : 'Modifica'}</span>
            </button>

            {open && (
                <div className="border-t border-gray-100 p-4 space-y-6">
                    <p className="text-sm text-gray-500">
                        Valgono per tutte le tessere del locale, anche quelle già consegnate ai clienti. Se cambi una regola, si applica da subito.
                    </p>

                    <section className="space-y-2">
                        <h4 className="font-semibold text-gray-700">Come funziona la tessera</h4>
                        <Segmented<ProgramChoice> value={program} onChange={setProgram} options={[
                            { value: 'VISITS', label: 'A visite' },
                            { value: 'POINTS', label: 'A punti' },
                            { value: 'ANY', label: 'Scelgo ogni volta' },
                        ]} />
                        <p className="text-xs text-gray-500">
                            {program === 'VISITS' && 'Ogni conto chiuso con la tessera vale una visita; raggiunto il numero di visite il cliente ha il premio. Semplice da spiegare, niente calcoli.'}
                            {program === 'POINTS' && 'Il cliente accumula punti in base a quanto spende e li usa come sconto.'}
                            {program === 'ANY' && 'Alla creazione di ogni tessera scegli se è a punti o a visite.'}
                            {program !== 'ANY' && ' Le tessere già emesse dell\'altro tipo continuano a funzionare.'}
                        </p>
                    </section>

                    <div className={`grid grid-cols-1 ${usesPoints && usesVisits ? 'md:grid-cols-2' : ''} gap-5`}>
                        {usesVisits && (
                            <fieldset className="space-y-3">
                                <legend className="font-semibold text-gray-700 mb-1">Tessere a visite</legend>
                                <div className="grid grid-cols-2 gap-3">
                                    <label className="block">
                                        <span className="label-style">Visite per il premio</span>
                                        <input type="number" min={1} value={stampsForPrize} placeholder="es. 10"
                                               onChange={e => setStampsForPrize(e.target.value)}
                                               className="input-style w-full" />
                                    </label>
                                    <label className="block">
                                        <span className="label-style">Spesa minima (€)</span>
                                        <input type="text" inputMode="decimal" value={minSpend} placeholder="nessuna"
                                               onChange={e => setMinSpend(e.target.value.replace(/[^0-9.,]/g, ''))}
                                               className="input-style w-full" />
                                    </label>
                                </div>
                                <label className="block">
                                    <span className="label-style">Premio</span>
                                    <input type="text" maxLength={120} value={stampsPrize} placeholder="es. Pizza omaggio"
                                           onChange={e => setStampsPrize(e.target.value)}
                                           className="input-style w-full" />
                                </label>
                                <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                                    <input type="checkbox" className="mt-0.5" checked={oneVisitPerDay}
                                           onChange={e => setOneVisitPerDay(e.target.checked)} />
                                    <span>
                                        Al massimo una visita al giorno
                                        <span className="block text-xs text-gray-500">Evita che un tavolo diviso in più conti conti più visite.</span>
                                    </span>
                                </label>
                            </fieldset>
                        )}
                        {usesPoints && (
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
                        )}
                    </div>

                    <section className="space-y-2">
                        <h4 className="font-semibold text-gray-700">Scadenza dei saldi</h4>
                        <Segmented<LoyaltyExpiryPolicy> value={expiry} onChange={setExpiry} options={[
                            { value: 'NONE', label: 'Non scadono' },
                            { value: 'YEARLY', label: 'Ogni anno' },
                            { value: 'INACTIVITY', label: 'Se inattiva' },
                        ]} />
                        {expiry === 'YEARLY' && (
                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
                                <span>Azzera punti e visite il</span>
                                <select value={expiryDay} onChange={e => setExpiryDay(Number(e.target.value))}
                                        className="input-style !w-auto py-1">
                                    {Array.from({ length: DAYS_IN_MONTH[expiryMonth - 1] }, (_, i) => i + 1).map(d =>
                                        <option key={d} value={d}>{d}</option>)}
                                </select>
                                <select value={expiryMonth}
                                        onChange={e => {
                                            const m = Number(e.target.value);
                                            setExpiryMonth(m);
                                            setExpiryDay(d => Math.min(d, DAYS_IN_MONTH[m - 1]));
                                        }}
                                        className="input-style !w-auto py-1">
                                    {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                                </select>
                                <span>di ogni anno.</span>
                            </div>
                        )}
                        {expiry === 'INACTIVITY' && (
                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-700">
                                <span>Azzera il saldo dopo</span>
                                <input type="number" min={1} max={60} value={inactivityMonths}
                                       onChange={e => setInactivityMonths(e.target.value)}
                                       className="input-style !w-20 py-1" />
                                <span>mesi senza visite né movimenti.</span>
                            </div>
                        )}
                        {expiry !== 'NONE' && (
                            <p className="text-xs text-gray-500">
                                Attivando la scadenza i saldi attuali non vengono toccati subito: il conteggio parte da oggi.
                                Ogni azzeramento resta nello storico della tessera.
                            </p>
                        )}
                    </section>

                    <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-gray-100">
                        {confirmReset ? (
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                <span className="text-red-700 font-semibold">Azzerare punti e visite di tutte le tessere?</span>
                                <button onClick={resetAll} disabled={resetting}
                                        className="px-3 py-1.5 rounded-md bg-red-600 text-white font-semibold disabled:opacity-60">
                                    {resetting ? 'Azzeramento…' : 'Sì, azzera tutte'}
                                </button>
                                <button onClick={() => setConfirmReset(false)} className="px-3 py-1.5 text-gray-600 font-semibold">Annulla</button>
                            </div>
                        ) : (
                            <button onClick={() => setConfirmReset(true)}
                                    className="text-sm font-semibold text-red-600 hover:text-red-700 text-left">
                                Azzera tutte le tessere ora
                            </button>
                        )}
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
