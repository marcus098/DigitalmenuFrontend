// TODO: nome del prodotto non ancora deciso. Cambiarlo qui aggiorna tutto il sito vetrina
// (titolo pagina, meta, wordmark, testi). Il wordmark si adatta a qualsiasi nome breve.
export const BRAND_NAME = "AxiomMenu";

/** Azienda che sviluppa il prodotto. */
export const COMPANY_NAME = "Axiom Group";

/** Contatto commerciale (lo stesso indicato nell'informativa privacy). */
export const CONTACT_EMAIL = "commerciale@axiomgroup.it";

/** Dati legali mostrati nel footer (gli stessi dell'informativa privacy). */
export const COMPANY_LEGAL = {
    holder: "Fatima Boukhama",
    tradeName: "Axiom Group",
    address: "Brescia (BS)",
    vat: "04717560983",
} as const;

/*
 * Colori e caratteri del sito vetrina: sono definiti come variabili CSS in landing.css
 * (blocco `.lp { --accent: … }`). Per cambiare il colore del marchio basta modificare lì
 * --accent / --accent-text.
 */
