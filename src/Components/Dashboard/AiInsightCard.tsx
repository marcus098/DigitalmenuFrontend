import React from "react";
import { Sparkles, RefreshCw, TrendingUp, TrendingDown, Minus, Loader2, AlertCircle, Inbox } from "lucide-react";
import { AiHighlight, AiInsight } from "../../types";
import { localIsoDate, localIsoDatePlusDays } from "../../Utilities/dates";

interface AiInsightCardProps {
    title: string
    /** null = non ancora generato per il periodo corrente */
    insight: AiInsight | null
    loading?: boolean
    /** Errore dell'ultima azione (es. 429 "Hai già richiesto un aggiornamento da poco…") */
    error?: string | null
    refreshing?: boolean
    /** Il polling su PENDING è andato oltre i ~3 minuti */
    pollTimedOut?: boolean
    onRefresh: () => void
    onReload?: () => void
    className?: string
}

// "yyyy-MM-dd" come data locale (new Date("yyyy-MM-dd") sarebbe UTC)
const parseDate = (iso: string): Date => {
    const [y, m, d] = iso.split("-").map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
};

/** "ieri, giovedì 29 ottobre" · "20–26 ottobre" · "28 settembre – 4 ottobre" */
export const formatAiPeriod = (from: string, to: string): string => {
    if (!from) return "";
    const f = parseDate(from);
    if (!to || from === to) {
        const label = f.toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" });
        if (from === localIsoDatePlusDays(-1)) return `ieri, ${label}`;
        if (from === localIsoDate()) return `oggi, ${label}`;
        return label;
    }
    const t = parseDate(to);
    const sameYear = f.getFullYear() === t.getFullYear();
    const yearSuffix = t.getFullYear() !== new Date().getFullYear() ? ` ${t.getFullYear()}` : "";
    if (sameYear && f.getMonth() === t.getMonth()) {
        return `${f.getDate()}–${t.getDate()} ${t.toLocaleDateString("it-IT", { month: "long" })}${yearSuffix}`;
    }
    const fromLabel = f.toLocaleDateString("it-IT", sameYear ? { day: "numeric", month: "long" } : { day: "numeric", month: "long", year: "numeric" });
    const toLabel = t.toLocaleDateString("it-IT", { day: "numeric", month: "long" });
    return `${fromLabel} – ${toLabel}${sameYear ? yearSuffix : ` ${t.getFullYear()}`}`;
};

const TREND_STYLE: Record<string, { color: string; Icon: React.ElementType }> = {
    up:   { color: "text-emerald-600", Icon: TrendingUp },
    down: { color: "text-rose-600",    Icon: TrendingDown },
    flat: { color: "text-gray-500",    Icon: Minus },
};

const HighlightTile: React.FC<{ h: AiHighlight }> = ({ h }) => {
    const trend = h.trend ? TREND_STYLE[h.trend] : undefined;
    return (
        <div className="bg-slate-50 rounded-xl p-3 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 truncate" title={h.label}>{h.label}</p>
            <p className={`text-lg font-black leading-tight tabular-nums flex items-center gap-1 ${trend ? trend.color : "text-gray-900"}`}>
                {trend && <trend.Icon className="w-4 h-4 shrink-0" />}
                <span className="truncate">{h.value}</span>
            </p>
            {h.detail && <p className={`text-[11px] leading-snug mt-0.5 ${trend ? trend.color : "text-gray-500"}`}>{h.detail}</p>}
        </div>
    );
};

/** Testo semplice del backend: paragrafi su righe diverse, punti elenco con "- ". Niente HTML. */
const InsightText: React.FC<{ text: string }> = ({ text }) => {
    const blocks: ({ type: "p"; text: string } | { type: "ul"; items: string[] })[] = [];
    text.split(/\r?\n/).map(l => l.trim()).filter(Boolean).forEach(line => {
        if (/^[-•]\s+/.test(line)) {
            const item = line.replace(/^[-•]\s+/, "");
            const last = blocks[blocks.length - 1];
            if (last && last.type === "ul") last.items.push(item);
            else blocks.push({ type: "ul", items: [item] });
        } else {
            blocks.push({ type: "p", text: line });
        }
    });
    return (
        <div className="space-y-2 text-sm text-gray-700 leading-relaxed">
            {blocks.map((b, i) => b.type === "p"
                ? <p key={i}>{b.text}</p>
                : (
                    <ul key={i} className="list-disc pl-5 space-y-1">
                        {b.items.map((it, j) => <li key={j}>{it}</li>)}
                    </ul>
                ))}
        </div>
    );
};

const smallBtn = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed";

/** Card riepilogo AxiomAI: numeri calcolati dal backend + testo (AI o deterministico). */
const AiInsightCard: React.FC<AiInsightCardProps> = ({
    title, insight, loading, error, refreshing, pollTimedOut, onRefresh, onReload, className = "",
}) => {
    const status = insight?.status;
    const period = insight ? formatAiPeriod(insight.periodFrom, insight.periodTo) : "";

    const refreshButton = (label: string, primary = false) => (
        <button
            type="button"
            onClick={onRefresh}
            disabled={refreshing}
            className={`${smallBtn} ${primary ? "bg-primary-500 text-white hover:bg-primary-600" : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"}`}
        >
            {refreshing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {label}
        </button>
    );

    let body: React.ReactNode;
    if (loading && !insight) {
        body = (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-6 justify-center">
                <Loader2 className="w-4 h-4 animate-spin" /> Caricamento…
            </div>
        );
    } else if (!insight) {
        body = (
            <div className="flex flex-col items-center text-center gap-3 py-6">
                <Sparkles className="w-8 h-8 text-gray-300" />
                <p className="text-sm text-gray-500">Il riepilogo sarà pronto domattina</p>
                {refreshButton("Genera ora", true)}
            </div>
        );
    } else if (status === "PENDING") {
        body = pollTimedOut ? (
            <div className="flex flex-col items-center text-center gap-3 py-6">
                <p className="text-sm text-gray-500">Ci sta mettendo più del previsto. Riprova tra qualche minuto.</p>
                {onReload && (
                    <button type="button" onClick={onReload} className={`${smallBtn} text-gray-500 hover:text-gray-800 hover:bg-gray-100`}>
                        <RefreshCw className="w-3.5 h-3.5" /> Ricarica
                    </button>
                )}
            </div>
        ) : (
            <div className="flex items-center gap-2 text-sm text-gray-500 py-6 justify-center text-center">
                <Loader2 className="w-4 h-4 animate-spin text-primary-500 shrink-0" />
                AxiomAI sta preparando il riepilogo…
            </div>
        );
    } else if (status === "NO_DATA") {
        body = (
            <div className="flex flex-col items-center text-center gap-2 py-6">
                <Inbox className="w-8 h-8 text-gray-300" />
                <p className="text-sm text-gray-500">Nessun ordine completato nel periodo</p>
            </div>
        );
    } else if (status === "FAILED") {
        body = (
            <div className="flex flex-col items-center text-center gap-3 py-6">
                <AlertCircle className="w-8 h-8 text-rose-300" />
                <p className="text-sm text-gray-500">{insight.text || "Non è stato possibile preparare il riepilogo."}</p>
                {refreshButton("Riprova", true)}
            </div>
        );
    } else {
        body = (
            <div className="space-y-4">
                {insight.highlights?.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {insight.highlights.map((h, i) => <HighlightTile key={`${h.label}-${i}`} h={h} />)}
                    </div>
                )}
                {insight.text && <InsightText text={insight.text} />}
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-5 ${className}`}>
            <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400">{title}</h2>
                        {insight?.aiGenerated && status === "READY" && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 text-[10px] font-bold"
                                  title="Testo scritto dall'assistente AI a partire dai numeri del locale">
                                <Sparkles className="w-3 h-3" /> AxiomAI
                            </span>
                        )}
                    </div>
                    {period && <p className="text-xs text-gray-400 mt-0.5">{period}</p>}
                </div>
                {status === "READY" && <div className="shrink-0">{refreshButton("Aggiorna")}</div>}
            </div>
            {error && (
                <p className="mb-3 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">{error}</p>
            )}
            {body}
        </div>
    );
};

export default AiInsightCard;
