/**
 * Etichetta di un tavolo da mostrare in dashboard.
 * Il nome scelto dal titolare contiene già di solito la parola "Tavolo" ("Tavolo 1"): in quel caso
 * si usa così com'è, altrimenti si antepone "Tavolo " ("12" → "Tavolo 12", "Terrazza" → "Tavolo Terrazza").
 * Senza nome (tavolo non trovato) si ripiega sull'id tecnico, marcato con # per non confonderlo col numero.
 */
export const tableLabel = (name?: string | null, id?: number | null): string => {
    const n = (name || "").trim()
    if (n) return /^tavol[oi]\b/i.test(n) ? n : `Tavolo ${n}`
    return id != null && id > 0 ? `Tavolo #${id}` : "Tavolo"
}
