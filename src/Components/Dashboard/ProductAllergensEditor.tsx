import React from "react";
import { Check, Lock, Snowflake } from "lucide-react";
import { useData } from "../../Context/DataContext";
import { allergens as ALLERGENS, getProductAllergens } from "../../Utilities/Utilities";

interface ProductAllergensEditorProps {
    /** Allergeni dichiarati direttamente sul prodotto (id 1..14) */
    allergens: number[]
    /** "Può contenere tracce di" (id 1..14) */
    traces: number[]
    /** Ingredienti del prodotto: i loro allergeni sono inclusi in automatico */
    ingredients: number[]
    onChangeAllergens: (ids: number[]) => void
    onChangeTraces: (ids: number[]) => void
}

const toggle = (list: number[], id: number) =>
    list.includes(id) ? list.filter(i => i !== id) : [...list, id].sort((a, b) => a - b);

/**
 * Editor allergeni del prodotto (Reg. UE 1169/2011).
 * - Allergeni: quelli degli ingredienti sono mostrati in sola lettura (con l'ingrediente di origine);
 *   gli altri si possono dichiarare sul prodotto (bevande, dolci descritti a testo, ecc.).
 * - Tracce: "può contenere tracce di", escluse quelle già contenute.
 * Non riusa AllergensSelector perché quello è legato al filtro allergeni del cliente (stato globale).
 */
const ProductAllergensEditor: React.FC<ProductAllergensEditorProps> = ({ allergens, traces, ingredients, onChangeAllergens, onChangeTraces }) => {
    const { ingredientsMap } = useData();
    const { declared, fromIngredients, effective, frozen } = getProductAllergens({ allergens, traces, ingredients }, ingredientsMap);

    // Per ogni allergene, gli ingredienti del prodotto che lo contengono
    const sources = (id: number) =>
        ingredients
            .map(i => ingredientsMap.get(i))
            .filter(ing => ing && (ing.allergens || []).includes(id))
            .map(ing => ing!.name);

    const frozenIngredients = ingredients
        .map(i => ingredientsMap.get(i))
        .filter(ing => ing?.frozen)
        .map(ing => ing!.name);

    return (
        <div className="space-y-6">
            <div>
                <div className="flex items-baseline justify-between gap-2 mb-1">
                    <label className="block font-medium">Allergeni</label>
                    <span className="text-xs text-gray-500">{effective.length} su 14</span>
                </div>
                <p className="text-xs text-gray-500 mb-3">
                    Gli allergeni degli ingredienti sono inclusi in automatico <Lock className="inline w-3 h-3 -mt-0.5" aria-hidden="true" />.
                    Seleziona quelli presenti nel prodotto ma non coperti dagli ingredienti (es. bevande o dolci descritti solo a testo).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                    {ALLERGENS.map(a => {
                        const fromIng = fromIngredients.includes(a.id);
                        const isDeclared = declared.includes(a.id);
                        const active = fromIng || isDeclared;
                        const src = fromIng ? sources(a.id) : [];
                        return (
                            <button
                                key={a.id}
                                type="button"
                                disabled={fromIng}
                                aria-pressed={active}
                                onClick={() => onChangeAllergens(toggle(declared, a.id))}
                                title={fromIng ? `Da ingrediente: ${src.join(", ")}` : undefined}
                                className={`flex items-center gap-2 text-left p-2 rounded-lg border-2 transition-colors ${
                                    fromIng
                                        ? "bg-amber-50 border-amber-200 cursor-default"
                                        : isDeclared
                                            ? "bg-orange-100 border-orange-400"
                                            : "bg-white border-gray-200 hover:border-gray-300"
                                }`}
                            >
                                <span className={`w-5 h-5 flex-shrink-0 rounded-md border-2 flex items-center justify-center ${
                                    fromIng ? "bg-amber-400 border-amber-400" : isDeclared ? "bg-orange-500 border-orange-500" : "border-gray-300 bg-white"
                                }`}>
                                    {fromIng ? <Lock className="w-3 h-3 text-white" /> : isDeclared && <Check className="w-3 h-3 text-white" strokeWidth={4} />}
                                </span>
                                <span className="min-w-0">
                                    <span className="block text-sm font-semibold text-gray-800 leading-tight">{a.name}</span>
                                    {fromIng && (
                                        <span className="block text-xs text-amber-700 truncate">da: {src.join(", ")}</span>
                                    )}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div>
                <label className="block font-medium mb-1">Può contenere tracce di</label>
                <p className="text-xs text-gray-500 mb-3">
                    Contaminazioni crociate possibili. Nel menu sono indicate a parte e non nascondono il piatto ai clienti che filtrano quell'allergene, ma mostrano un avviso.
                </p>
                <div className="flex flex-wrap gap-2">
                    {ALLERGENS.map(a => {
                        const contained = effective.includes(a.id);
                        const selected = !contained && traces.includes(a.id);
                        return (
                            <button
                                key={a.id}
                                type="button"
                                disabled={contained}
                                aria-pressed={selected}
                                onClick={() => onChangeTraces(toggle(traces, a.id))}
                                title={contained ? "Già contenuto nel prodotto" : undefined}
                                className={`px-3 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
                                    contained
                                        ? "bg-gray-100 border-gray-200 text-gray-400 line-through cursor-default"
                                        : selected
                                            ? "bg-orange-500 border-orange-500 text-white"
                                            : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                                }`}
                            >
                                {a.short}
                            </button>
                        );
                    })}
                </div>
            </div>

            {frozen && (
                <p className="flex items-start gap-2 text-sm text-sky-800 bg-sky-50 border border-sky-200 rounded-lg p-3">
                    <Snowflake className="w-4 h-4 mt-0.5 flex-shrink-0" aria-hidden="true" />
                    <span>
                        Contiene ingredienti surgelati ({frozenIngredients.join(", ")}): nel menu il prodotto sarà segnato con
                        <strong> *</strong> e la legenda "Prodotto surgelato o congelato all'origine".
                    </span>
                </p>
            )}
        </div>
    );
};

export default ProductAllergensEditor;
