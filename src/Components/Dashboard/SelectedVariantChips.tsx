import React from "react";
import { SelectedVariant } from "../../ComandType";
import { formatDelta, sortVariantsForDisplay } from "./variantUtils";

interface SelectedVariantChipsProps {
    variants?: SelectedVariant[] | null;
    /** Mostra il supplemento accanto alla scelta */
    showDelta?: boolean;
    size?: "sm" | "md";
    className?: string;
}

/**
 * Varianti scelte sotto il prodotto in comanda/cassa.
 * Quelle "in evidenza" (es. senza glutine) sono un chip rosso ben visibile: la cucina non deve perderle.
 */
const SelectedVariantChips: React.FC<SelectedVariantChipsProps> = ({ variants, showDelta = true, size = "sm", className = "" }) => {
    const list = sortVariantsForDisplay(variants);
    if (list.length === 0) return null;
    const text = size === "md" ? "text-sm" : "text-xs";
    return (
        <div className={`flex flex-wrap items-center gap-1 mt-1 ${className}`} data-testid="selected-variants">
            {list.map(v => {
                const delta = showDelta ? formatDelta(v.priceDelta) : "";
                return v.highlight ? (
                    <span
                        key={v.groupId}
                        title={`${v.groupName}: ${v.choiceName}`}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-600 text-white font-bold uppercase tracking-wide shadow-sm whitespace-nowrap ${text}`}
                    >
                        <span aria-hidden="true">⚠</span>{v.choiceName}
                        {delta && <span className="font-semibold normal-case opacity-90">{delta}</span>}
                    </span>
                ) : (
                    <span
                        key={v.groupId}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 whitespace-nowrap ${text}`}
                    >
                        <span className="text-slate-400">{v.groupName}:</span>
                        <span className="font-semibold">{v.choiceName}</span>
                        {delta && <span className="text-slate-500">{delta}</span>}
                    </span>
                );
            })}
        </div>
    );
};

export default SelectedVariantChips;
