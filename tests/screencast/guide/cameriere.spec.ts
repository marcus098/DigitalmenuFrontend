import { test, Page } from '@playwright/test';
import { api, apiLogin, cleanupTable, APP, chapter, prepareContext, SLUG, WAITER, WEBFLUX } from './guide';

/**
 * Parte 2 — Cameriere, versione web (1440x900).
 * Usa un tavolo libero tra Tavolo 8, 3, 4 (id 17, 12, 13), che poi richiude.
 */
const PART = 'Cameriere';
let OWNER_TOKEN = '';
let WAITER_TOKEN = '';

test.beforeAll(async () => {
    OWNER_TOKEN = await apiLogin();
    WAITER_TOKEN = await apiLogin(WAITER);
});

async function freeTable(): Promise<{ id: number; name: string }> {
    for (const id of [17, 12, 13, 16]) {
        const t = await api(`/api/public/sessions/table/${id}?localname=${SLUG}`);
        if (t.json && t.json.busy === false) return { id, name: t.json.tableName };
    }
    throw new Error('Nessun tavolo libero');
}
async function closeTable(id: number) {
    await cleanupTable(id, OWNER_TOKEN, RUN_START);
}
const RUN_START = Date.now();
const card = (page: Page, name: string) => page.locator('.react-grid-item').filter({ has: page.getByText(name, { exact: true }) }).first();
const nav = (page: Page, label: string) => page.locator('header').getByRole('link', { name: label, exact: true }).first();

test('13 Accesso e sala del cameriere', async ({ page }, info) => {
    const ch = await chapter(page, info, PART, 'Accesso e sala del cameriere');
    await prepareContext(page.context());
    const t = await freeTable();
    try {
        await ch.goto('/login', 2000);
        ch.begin();
        await ch.say('Il cameriere usa DineUp anche dal computer o dal tablet della sala. Accede da questa pagina con la sua email e la sua password.', async () => {
            await ch.type(page.locator('input[type=email]'), WAITER.email, 400);
            await ch.type(page.locator('input[type=password]'), WAITER.password, 400);
        });
        await ch.say('Tocca Accedi: entra nella sua area, con solo le funzioni che servono in sala.', async () => {
            await ch.click(page.locator('button[type=submit]'), 1000);
            await page.waitForURL(/Dashboard\/Home/);
            await ch.pause(2500);
        });
        await ch.say('Nella home trova i tavoli occupati, gli ordini in coda, le prenotazioni di oggi e gli ultimi ordini arrivati.', async () => {
            await ch.point(page.getByText('Tavoli Occupati').first(), 1500);
            await ch.point(page.getByText('Ordini in Coda').first(), 1500);
            await ch.point(page.getByText(/Ordini recenti/i).first(), 1500);
        });
        await ch.say('In alto il menu: Sala, Ordini, Prenotazioni e Consegne. Apriamo la Sala.', async () => {
            await ch.click(nav(page, 'Sala'), 2500);
        });
        await ch.say(`Ogni riquadro è un tavolo: rosso se occupato, verde se libero. Arrivano due clienti al ${t.name}: il cameriere tocca il lucchetto per occuparlo.`, async () => {
            await ch.point(card(page, t.name), 1500);
            await ch.click(card(page, t.name).locator('[title="Occupa tavolo"]'), 1800);
        });
        await ch.say('Indica quanti coperti e conferma con Occupa tavolo.', async () => {
            await ch.fill(page.locator('#seatsToOccupy'), '2', 600);
            await ch.click(page.getByRole('button', { name: 'Occupa Tavolo', exact: true }).last(), 2500);
            await ch.shot('codice');
        });
        await ch.say('Il tavolo diventa occupato e si apre la sessione con il codice di accesso di quattro caratteri: il cameriere lo comunica ai clienti, che lo scrivono dopo aver inquadrato il QR.', async () => {
            await ch.point(page.getByText(/Codice per i clienti/i).first(), 2500);
        });
        await ch.say('Qui si vedono anche i clienti collegati e chi è pronto. Forza invio ordini manda in cucina quello che hanno scelto, anche se qualcuno non ha confermato.', async () => {
            await ch.point(page.getByText(/Clienti collegati/i).first(), 1500);
            await ch.point(page.getByRole('button', { name: /Forza invio ordini/ }), 2000);
        });
        await ch.say("Chiudiamo la finestra. Con la i si apre il dettaglio del tavolo: coperti, codice, ordini con il loro stato, totale e quanto resta da incassare.", async () => {
            await ch.click(page.getByRole('button', { name: 'Chiudi' }).filter({ visible: true }).first(), 1000);
            await ch.click(card(page, t.name).locator('[title="Dettagli"]'), 2500);
            await ch.shot('dettaglio');
        });
        await ch.say('Dal dettaglio si riapre la sessione o si chiude il tavolo a fine servizio.', async () => {
            await ch.point(page.getByRole('button', { name: 'Chiudi tavolo' }).last(), 2000);
            await page.keyboard.press('Escape');
        });
        await ch.finish();
    } finally {
        await closeTable(t.id);
    }
});

test('14 Gli ordini in sala', async ({ page }, info) => {
    const ch = await chapter(page, info, PART, 'Gli ordini in sala');
    await prepareContext(page.context(), WAITER_TOKEN);
    await ch.goto(`/${SLUG}/Dashboard/Orders`, 2500);
    ch.begin();
    await ch.say('Nella pagina Ordini il cameriere vede tutte le comande del giorno, aggiornate in tempo reale: dai tavoli, dal QR, da asporto e a domicilio.', async () => {
        await ch.pause(1500);
        await ch.point(page.getByText(/^Ordine #/).first(), 1500);
    });
    await ch.say("Ogni scheda mostra il tavolo o il cliente, l'ora, i piatti con varianti, aggiunte e note, e chi ha preso l'ordine: la voce Preso da riporta il nome del cameriere.", async () => {
        await ch.point(page.getByText('Preso da:').first(), 2500);
        await ch.point(page.getByText(/SENZA GLUTINE|Note:/).first(), 2000);
    });
    await ch.say('I filtri in alto separano gli ordini per stato: nuovi, in attesa, in cucina, completati e cancellati. Si può anche scegliere un giorno.', async () => {
        for (const f of ['Nuovi', 'In attesa', 'In cucina', 'Completati']) await ch.click(page.getByRole('button', { name: f, exact: true }).first(), 1500);
        await ch.click(page.getByRole('button', { name: 'Tutti', exact: true }).first(), 1500);
    });
    await ch.say('Quando i piatti escono dalla cucina, il cameriere tocca Completa; con Cancella annulla una comanda sbagliata. Dettagli apre la scheda completa.', async () => {
        await ch.click(page.getByRole('button', { name: 'In cucina', exact: true }).first(), 1500);
        await ch.point(page.getByRole('button', { name: 'Completa', exact: true }).first(), 1500);
        await ch.point(page.getByRole('button', { name: 'Cancella', exact: true }).first(), 1200);
        await ch.click(page.getByText('Dettagli', { exact: true }).first(), 2500);
        await ch.shot('dettagli');
    });
    await ch.say("Dal dettaglio si rivede tutta la comanda. Si chiude e si torna all'elenco.", async () => {
        await ch.pause(1500);
        await page.keyboard.press('Escape');
        const x = page.getByRole('button', { name: /Chiudi/ }).filter({ visible: true }).first();
        if (await x.isVisible().catch(() => false)) await ch.click(x, 1000);
        await ch.click(page.getByRole('button', { name: 'Tutti', exact: true }).first(), 1200);
    });
    await ch.finish();
});

test('15 Prendere un ordine', async ({ page }, info) => {
    const ch = await chapter(page, info, PART, 'Prendere un ordine');
    await prepareContext(page.context(), WAITER_TOKEN);
    const t = await freeTable();
    try {
        await ch.goto(`/${SLUG}/Dashboard/Home`, 2500);
        ch.begin();
        await ch.say('Per prendere un ordine al tavolo, il cameriere tocca Nuovo Ordine, in alto a destra.', async () => {
            await ch.click(page.locator('header').getByRole('button', { name: /Nuovo Ordine/ }).first(), 2500);
        });
        await ch.say('Si apre il menù, uguale a quello dei clienti: categorie, ricerca e schede dei piatti.', async () => {
            await ch.click(page.getByText('Primi', { exact: true }).first(), 2000);
        });
        await ch.say('Aggiungiamo due carbonare: si apre la scheda, si sceglie la quantità e si tocca Aggiungi.', async () => {
            await ch.click(page.getByText('Spaghetti alla carbonara', { exact: true }).first(), 1500);
            await ch.click(page.locator('button:has(svg.lucide-plus)').last(), 800);
            await ch.click(page.getByRole('button', { name: /^Aggiungi/ }).last(), 1500);
            await ch.shot('dopo-carbonara');
        });
        await ch.say('Poi una pizza margherita in formato maxi, con una nota per la cucina.', async () => {
            await ch.click(page.getByText('Pizze', { exact: true }).first(), 1500);
            await ch.shot('pizze');
            await ch.click(page.getByText('Margherita', { exact: true }).first(), 1500);
            await ch.click(page.getByText('Maxi', { exact: true }).first(), 1000);
            await ch.type(page.locator('#notes'), 'Tagliata a spicchi', 600);
            await ch.click(page.getByRole('button', { name: /^Aggiungi/ }).last(), 1500);
        });
        await ch.say('E da bere, acqua naturale. Ora apriamo il carrello.', async () => {
            await ch.click(page.getByText('Bevande', { exact: true }).first(), 1500);
            await ch.click(page.getByText('Acqua naturale 75cl', { exact: true }).first(), 1500);
            await ch.click(page.getByRole('button', { name: /^Aggiungi/ }).last(), 1500);
            await ch.click(page.locator('header button').last(), 2500);
            await ch.shot('carrello');
        });
        await ch.say("Il cameriere controlla l'ordine e tocca Conferma ordine. Poi sceglie il tipo: al tavolo, da asporto o a domicilio.", async () => {
            await ch.click(page.getByRole('button', { name: /Conferma Ordine/i }).first(), 2000);
            await ch.shot('tipo');
            await ch.click(page.getByText('Da Tavolo', { exact: true }), 1800);
        });
        await ch.say(`Sceglie il tavolo, il ${t.name}, e, se è libero, il numero di coperti. Conferma: la comanda parte subito per la cucina e per le stampanti.`, async () => {
            await page.locator('select').last().selectOption({ label: t.name });
            await ch.point(page.locator('select').last(), 1200);
            const seats = page.locator('input[type=number]').last();
            if (await seats.isVisible().catch(() => false)) await ch.fill(seats, '2', 600);
            await ch.click(page.getByRole('button', { name: 'Conferma', exact: true }), 3000);
            await ch.shot('inviato');
        });
        await ch.say("Fatto: l'ordine compare nella pagina Ordini con il nome del cameriere che l'ha preso, e il tavolo risulta occupato in Sala.", async () => {
            await ch.goto(`/${SLUG}/Dashboard/Orders`, 2500);
            await ch.point(page.getByText(t.name, { exact: true }).last(), 2000);
        });
        await ch.finish();
    } finally {
        await closeTable(t.id);
    }
});
