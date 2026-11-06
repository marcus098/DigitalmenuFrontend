import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Layers, Loader2 } from "lucide-react";
import { ProductDto } from "../../types";
import { useSetVariantAvailable } from "../../Context/DataContext";
import { useNotification } from "../../Context/NotificationContext";
import { formatDelta } from "./variantUtils";

/**
 * Indicatore "varianti" sulla card del menu + elenco espandibile per segnare una singola scelta
 * esaurita/disponibile. Titolare e cameriere (il cameriere può solo cambiare la disponibilità).
 */
const VariantAvailabilityPanel: React.FC<{ product: ProductDto }> = ({ product }) => {
    const groups = product.variantGroups ?? [];
    const [open, setOpen] = useState(false);
    const [busy, setBusy] = useState<string | null>(null);
    const setVariantAvailable = useSetVariantAvailable();
    const { addNotification } = useNotification();

    if (groups.length === 0) return null;
    const soldOut = groups.reduce((n, g) => n + g.choices.filter(c => !c.available).length, 0);

    const toggle = async (groupId: string, choiceId: string, choiceName: string, value: boolean) => {
        const key = `${groupId}/${choiceId}`;
        setBusy(key);
        const ok = await setVariantAvailable(product.id, groupId, choiceId, value);
        setBusy(null);
        addNotification(ok
            ? { message: `${choiceName}: ${value ? "di nuovo disponibile" : "segnata esaurita"}`, type: "success" }
            : { message: "Impossibile aggiornare la variante", type: "error" });
    };

    return (
        <div className="mt-2" data-testid="variant-availability">
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                aria-expanded={open}
                className="flex max-w-full items-center gap-1.5 px-2 py-1 rounded-md bg-primary-50 text-primary-700 text-xs font-semibold text-left hover:bg-primary-100 transition-colors"
                title={groups.map(g => g.name).join(", ")}
            >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span className="shrink-0">Varianti</span>
                <span className="min-w-0 truncate font-normal text-primary-600">{groups.map(g => g.name).join(", ")}</span>
                {soldOut > 0 && (
                    <span className="shrink-0 ml-0.5 px-1.5 rounded-full bg-rose-500 text-white text-[10px] leading-4 whitespace-nowrap">{soldOut} esaurit{soldOut === 1 ? "a" : "e"}</span>
                )}
                <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-2 space-y-3 rounded-lg border border-gray-100 bg-slate-50 p-2.5">
                            {groups.map(g => (
                                <div key={g.id}>
                                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-400 mb-1">{g.name}</p>
                                    <ul className="space-y-1">
                                        {g.choices.map(c => {
                                            const key = `${g.id}/${c.id}`;
                                            const delta = formatDelta(c.priceDelta);
                                            return (
                                                <li key={c.id} className="flex items-center justify-between gap-2 bg-white rounded-md border border-gray-100 px-2 py-1.5">
                                                    <span className="min-w-0 flex-1 leading-tight">
                                                        <span className={`text-sm break-words ${c.available ? "text-gray-800" : "text-gray-400 line-through"}`}>{c.name}</span>
                                                        {(delta || c.isDefault) && (
                                                            <span className="block text-[11px] text-gray-400">
                                                                {delta}{delta && c.isDefault && " · "}{c.isDefault && <span className="font-bold text-primary-600 uppercase">predefinita</span>}
                                                            </span>
                                                        )}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        disabled={busy === key}
                                                        onClick={() => toggle(g.id, c.id, c.name, !c.available)}
                                                        aria-label={`${c.name}: ${c.available ? "segna esaurita" : "segna disponibile"}`}
                                                        className={`shrink-0 inline-flex items-center gap-1 px-2.5 py-1.5 min-h-[32px] rounded-full text-xs font-semibold transition-colors disabled:opacity-60 ${
                                                            c.available
                                                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                                                : "bg-rose-500 text-white hover:bg-rose-600"
                                                        }`}
                                                    >
                                                        {busy === key && <Loader2 className="w-3 h-3 animate-spin" />}
                                                        {c.available ? "Disponibile" : "Esaurita"}
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            ))}
                            <p className="text-[11px] text-gray-400">Tocca per segnare una scelta esaurita: il prodotto resta ordinabile con le altre.</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VariantAvailabilityPanel;
