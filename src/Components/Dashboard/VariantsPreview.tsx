import React, { useMemo } from "react";
import { Eye } from "lucide-react";
import { VariantGroup } from "../../types";
import { allergenById } from "../../Utilities/Utilities";
import { variantCombinations, variantPriceRange } from "./variantUtils";

interface VariantsPreviewProps {
    /** Prezzi dei formati (uno solo se prezzo unico) */
    formats: { name: string; price: number; isDefault: boolean }[];
    groups: VariantGroup[];
    baseAllergens: number[];
    baseTraces: number[];
}

const eur = (n: number) => new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(n);

const AllergenList: React.FC<{ ids: number[]; traces: number[] }> = ({ ids, traces }) => (
    <div className="flex flex-wrap gap-1 mt-1">
        {ids.length === 0 && traces.length === 0 && <span className="text-[11px] text-gray-400">Nessun allergene</span>}
        {ids.map(a => (
            <span key={a} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-100 text-orange-800 text-[11px] font-semibold" title={allergenById.get(a)?.name}>
                <img src={allergenById.get(a)?.icon} alt="" className="w-3 h-3" />{allergenById.get(a)?.short}
            </span>
        ))}
        {traces.map(a => (
            <span key={`t${a}`} className="px-1.5 py-0.5 rounded border border-dashed border-gray-300 text-gray-500 text-[11px]" title="Può contenere tracce">
                tracce: {allergenById.get(a)?.short}
            </span>
        ))}
    </div>
);

/** Anteprima: fascia di prezzo e allergeni effettivi per combinazione. */
const VariantsPreview: React.FC<VariantsPreviewProps> = ({ formats, groups, baseAllergens, baseTraces }) => {
    const usable = groups.filter(g => g.choices.length > 0);
    const range = variantPriceRange(formats.map(f => f.price), usable);
    const { list, total } = useMemo(() => variantCombinations(usable, baseAllergens, baseTraces, 12), [usable, baseAllergens, baseTraces]);
    const defaultFormat = formats.find(f => f.isDefault) ?? formats[0];
    const showFormats = formats.length > 1;

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg" data-testid="variants-preview">
            <h3 className="text-lg font-semibold text-gray-800 mb-1 flex items-center gap-2"><Eye className="w-5 h-5 text-primary" />Anteprima</h3>
            <p className="text-xs text-gray-500 mb-4">Cosa vedrà il cliente con le impostazioni attuali.</p>

            <div className="rounded-lg bg-primary-50 border border-primary-100 p-3 mb-4">
                <p className="text-xs font-semibold text-primary-800 uppercase tracking-wide">Prezzo</p>
                <p className="text-2xl font-black text-gray-900">
                    {range.min === range.max ? eur(range.min) : <>{eur(range.min)} <span className="text-gray-400 font-bold">–</span> {eur(range.max)}</>}
                </p>
                {showFormats && (
                    <p className="text-xs text-gray-500 mt-1">Formati: {formats.map(f => `${f.name || "?"} ${eur(f.price)}`).join(" · ")}</p>
                )}
                {!showFormats && <p className="text-xs text-gray-500 mt-1">Formato unico: il cliente non vede la scelta del formato.</p>}
            </div>

            {usable.length === 0 ? (
                <div>
                    <p className="text-xs font-semibold text-gray-700">Allergeni</p>
                    <AllergenList ids={baseAllergens} traces={baseTraces} />
                </div>
            ) : (
                <div>
                    <p className="text-xs font-semibold text-gray-700 mb-2">
                        Combinazioni {total > list.length ? <span className="font-normal text-gray-400">(prime {list.length} di {total})</span> : <span className="font-normal text-gray-400">({total})</span>}
                    </p>
                    <ul className="space-y-2 max-h-[28rem] overflow-y-auto dash-scroll pr-1">
                        {list.map((combo, i) => {
                            const price = (defaultFormat?.price ?? 0) + combo.priceDelta;
                            return (
                                <li key={i} className={`rounded-lg border p-2.5 ${i === 0 ? "border-primary-200 bg-primary-50/40" : "border-gray-100"}`}>
                                    <div className="flex items-start justify-between gap-2">
                                        <p className="text-xs text-gray-700 leading-snug">
                                            {combo.choices.map(({ group, choice }, k) => (
                                                <span key={group.id}>
                                                    {k > 0 && <span className="text-gray-300"> · </span>}
                                                    <span className={choice.highlight ? "font-bold text-red-700" : "font-semibold"}>{choice.name || "?"}</span>
                                                    {!choice.available && <span className="ml-1 text-[10px] font-bold text-rose-600 uppercase">esaurita</span>}
                                                </span>
                                            ))}
                                            {i === 0 && <span className="ml-1 text-[10px] font-bold text-primary-700 uppercase">predefinita</span>}
                                        </p>
                                        <span className="text-xs font-bold text-gray-900 shrink-0">{eur(price)}</span>
                                    </div>
                                    <AllergenList ids={combo.allergens} traces={combo.traces} />
                                </li>
                            );
                        })}
                    </ul>
                    {showFormats && <p className="text-[11px] text-gray-400 mt-2">Prezzi calcolati sul formato predefinito ({defaultFormat?.name}).</p>}
                </div>
            )}
        </div>
    );
};

export default VariantsPreview;
