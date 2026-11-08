const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Tempo trascorso in italiano: "adesso", "12 min fa", "5 ore fa", "4 mesi, 16 giorni, 18 ore fa".
 * Mesi da 30 giorni e anni da 12 mesi: è un'indicazione, la data esatta va nel title.
 */
export const timeAgo = (iso: string | number | Date | null | undefined, now = Date.now()): string => {
    if (iso == null) return '';
    const t = new Date(iso).getTime();
    if (Number.isNaN(t)) return '';
    const min = Math.floor(Math.max(0, now - t) / 60000);
    if (min < 1) return 'adesso';
    if (min < 60) return `${min} min fa`;
    const totalHours = Math.floor(min / 60);
    if (totalHours < 24) return `${plural(totalHours, 'ora', 'ore')} fa`;

    const hours = totalHours % 24;
    const totalDays = Math.floor(totalHours / 24);
    const days = totalDays % 30;
    const totalMonths = Math.floor(totalDays / 30);
    const months = totalMonths % 12;
    const years = Math.floor(totalMonths / 12);

    const parts = [
        years ? plural(years, 'anno', 'anni') : '',
        months ? plural(months, 'mese', 'mesi') : '',
        days ? plural(days, 'giorno', 'giorni') : '',
        // Le ore contano solo finché non si parla di anni
        hours && !years ? plural(hours, 'ora', 'ore') : '',
    ].filter(Boolean);
    return `${parts.join(', ')} fa`;
};
