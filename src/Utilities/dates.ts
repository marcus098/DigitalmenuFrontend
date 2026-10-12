/**
 * Data "YYYY-MM-DD" nel fuso del dispositivo (ora italiana per i locali).
 * Non usare toISOString().split('T')[0]: è la data UTC, e tra mezzanotte e le 2 restituisce ieri.
 * Il backend lavora in Europe/Rome e le date/ore che invia sono senza offset (ora locale italiana).
 */
export const localIsoDate = (d: Date = new Date()): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Oggi + days giorni, come data locale "YYYY-MM-DD". */
export const localIsoDatePlusDays = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return localIsoDate(d);
};
