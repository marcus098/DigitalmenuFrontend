import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import { Screencast } from './helpers';

/**
 * Guida video per il TITOLARE (ruolo ROLE_ADMIN) di RestaurantFlow.
 * Dati demo: vedi demo-data.md. Usa i tavoli 1, 2, 4, 7 (id 10, 11, 13, 16): 3, 5 e 6 sono di cliente e cameriere.
 */
const APP = 'http://localhost:5173';
const API = 'http://localhost:8085';
const SLUG = 'trattoriadamarco';
const EMAIL = 'demo-owner@restaurantflow.test';
const PASSWORD = 'Demo#Trattoria2026';
const SHOTS = 'screencast-output/owner';

// ───────────────────────── preparazione dati (non visibile nel video) ─────────────────────────
const prod = (idProduct: number, quantity = 1) =>
    ({ idProduct, productOption: 'Standard', quantity, ingredientsMinus: [], ingredientsPlus: [], note: '' });

async function seed() {
    const login = await fetch(API + '/api/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailUsername: EMAIL, password: PASSWORD }),
    });
    const token = (await login.json()).accessToken as string;
    const H = { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token };
    const post = (u: string, b: unknown) => fetch(API + u, { method: 'POST', headers: H, body: JSON.stringify(b) });
    const get = (u: string) => fetch(API + u, { headers: H });
    const order = (idTable: number, seats: number, products: ReturnType<typeof prod>[]) =>
        post('/api/orders/insertWaiter', { type: 'AddComandWaiter', comandWaiterType: 'TABLE', idTable, seats, orders: [{ products }] });

    // pulizia dei tavoli di questa registrazione
    for (const id of [10, 11, 13, 16]) {
        await get('/api/tables/freeAndClose/' + id);
        await post(`/api/tables/${id}/session/close`, {});
    }
    // il piatto esaurito deve restare esaurito: nessun intervento. Tavoli e ordini realistici:
    for (const [id, seats] of [[10, 2], [11, 2], [13, 4]]) await post(`/api/tables/${id}/session/open`, { seats });
    await order(10, 2, [prod(33), prod(37), prod(44), prod(49, 2)]);          // Tavolo 1: 31 EUR, lo chiuderemo in cassa
    await order(11, 2, [prod(35), prod(38), prod(46), prod(51, 2), prod(52)]); // Tavolo 2
    // Un incasso nello storico, solo se non c'è già (le registrazioni ripetute non lo duplicano)
    const to = new Date().toISOString().slice(0, 10);
    const from = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
    const summary = await (await get(`/api/orders/checkout-summary?from=${from}&to=${to}`)).json();
    const rows = Array.isArray(summary) ? summary : summary.data ?? [];
    if (!rows.some((r: { totalCents: number }) => r.totalCents > 0)) {
        await post('/api/tables/16/session/open', { seats: 2 });
        await order(16, 2, [prod(34), prod(41, 2), prod(48), prod(54, 2)]);
        const list = await (await fetch('http://localhost:8081/api/comands/table/16', { headers: H })).json();
        const c = (Array.isArray(list) ? list : list.data ?? [])[0];
        if (c) {
            await post('/api/orders/changeStatus', { comandId: c.id, status: 'COMPLETED' });
            const sub = Math.round((14 + 36 + 2.5 + 10) * 100);
            await post(`/api/orders/${c.id}/checkout`, {
                subtotalCents: sub, totalCents: Math.round(sub * 0.9), discountMode: 'PCT', discountPct: 10,
                cardDiscountCents: 0, pointsToUse: 0, redeemStamps: false, earn: false,
            });
        }
        await get('/api/tables/freeAndClose/16');
        await post('/api/tables/16/session/close', {});
    }
    // Tessera fedeltà "Anna Rossi" (una sola)
    const cards = await (await get('/api/cards/getall')).json();
    let card = (cards.data ?? []).find((c: { holderName?: string }) => c.holderName === 'Anna Rossi');
    if (!card) {
        card = (await (await post('/api/cards/add', { typePoints: true, scope: 0, priceForPoint: 1, holderName: 'Anna Rossi', holderContact: 'anna.rossi@example.com' })).json()).data;
        await get(`/api/cards/addPoints/${card.id}/24`);
    }
    // Ricordiamo il codice della tessera da digitare in cassa
    return { token, cardCode: card.code as string, newOrderLater: () => order(13, 4, [prod(37), prod(39, 2), prod(45), prod(50, 2), prod(53)]) };
}

// ───────────────────────── helper locali ─────────────────────────
async function shot(page: Page, name: string) {
    fs.mkdirSync(SHOTS, { recursive: true });
    await page.screenshot({ path: `${SHOTS}/${name}.png` });
}

test('Guida titolare', async ({ page }) => {
    test.setTimeout(10 * 60_000);
    const data = await seed();
    const sc = new Screencast(page, 'owner');
    await sc.setup();
    await page.addInitScript(() => {
        localStorage.setItem('cookieConsent', JSON.stringify({
            version: 1, timestamp: new Date().toISOString(),
            state: { necessary: true, functional: true, analytics: false, marketing: false },
        }));
    });
    const nav = (label: string | RegExp) => page.locator('header, nav').getByRole('link', { name: label }).first();
    const goMore = async (label: string) => {
        await sc.click(page.getByRole('button', { name: 'Altro' }));
        await sc.click(page.getByRole('link', { name: label, exact: true }), 1500);
    };
    const toast = () => page.waitForTimeout(600);

    // 1. Accesso
    await page.goto(APP + '/login');
    await page.waitForLoadState('networkidle');
    await sc.scene('Accedi alla tua area', 'Benvenuto in RestaurantFlow! Accedi con la tua email e la tua password: da qui gestisci tutto il ristorante.', 3500);
    await sc.type(page.locator('input[type=email]'), EMAIL);
    await sc.type(page.locator('input[type=password]'), PASSWORD);
    await shot(page, '01-login');
    await sc.click(page.locator('button[type=submit]'), 500);
    await page.waitForURL('**/Dashboard/Home');
    await page.waitForTimeout(2500);

    // 2. Home
    await sc.scene('La tua Dashboard', 'Questa è la Home: in un colpo d\'occhio vedi i tavoli occupati, gli ordini in coda, le prenotazioni di oggi e gli incassi.', 6500);
    await page.mouse.move(250, 240, { steps: 20 });
    await sc.pause(1200);
    await page.mouse.move(1200, 240, { steps: 30 });
    await sc.pause(1500);
    await sc.scroll(450, 5);
    await sc.scene('Ordini recenti e azioni rapide', 'Più in basso trovi gli ordini più recenti e le scorciatoie per le operazioni di tutti i giorni.', 4500);
    await shot(page, '02-home');
    await page.mouse.wheel(0, -1000);

    // 3. Menu
    await sc.click(nav('Menu'), 1500);
    await sc.scene('Il tuo Menu', 'Nella sezione Menu trovi le categorie a sinistra e i piatti di ciascuna categoria a destra, con prezzo e ingredienti.', 5500);
    for (const cat of ['Primi', 'Secondi', 'Pizze', 'Bevande']) {
        await sc.click(page.getByText(cat, { exact: true }).first(), 1300);
    }
    await sc.click(page.getByText('Antipasti', { exact: true }).first(), 1000);
    await shot(page, '03-menu');

    // 4. Scheda prodotto
    const card = (name: string) => page.getByText(name, { exact: true }).first().locator('xpath=ancestor::div[.//button[@title="Modifica"]][1]');
    await sc.click(page.getByText('Pizze', { exact: true }).first(), 1000);
    await sc.click(card('Margherita').getByTitle('Modifica'), 2000);
    await sc.scene('Modifica un piatto', 'Aprendo un piatto puoi cambiare nome, descrizione, categoria e prezzo, anche con più formati o opzioni.', 5000);
    await sc.scroll(500, 6);
    await sc.scene('Ingredienti, extra e allergeni', 'Qui indichi gli ingredienti, gli extra che il cliente può aggiungere a pagamento e gli allergeni, per essere sempre in regola.', 6000);
    await sc.scroll(600, 6);
    await sc.pause(1500);
    await shot(page, '04-prodotto');
    await sc.scroll(700, 6);
    await sc.scene('Stato e immagine', 'Puoi anche caricare una foto del piatto e decidere se è visibile ai clienti.', 4000);
    await page.goBack();
    await page.waitForTimeout(1500);

    // 5. Esaurito
    await sc.click(page.getByText('Antipasti', { exact: true }).first(), 1000);
    const burrata = card('Burrata con pomodorini');
    await page.mouse.move(700, 450, { steps: 15 });
    await sc.scene('Segna un piatto esaurito', 'Ti è finito un piatto? Con un solo tocco su No lo segni come esaurito, e sparisce subito dal menu dei clienti.', 4000);
    await sc.click(burrata.getByText('No', { exact: true }), 2000);
    await shot(page, '05-esaurito');
    await sc.scene('Torna disponibile', 'Quando arriva la merce, tocca Sì e il piatto torna ordinabile.', 3000);
    await sc.click(burrata.getByText('Sì', { exact: true }), 1800);
    await sc.scene('Piatti già esauriti', 'I piatti esauriti restano evidenziati in rosso, così non li dimentichi.', 3500);
    await page.mouse.move(480, 590, { steps: 20 });
    await sc.pause(1500);

    // 6. Layout
    await goMore('Template');
    await page.waitForTimeout(2000);
    await sc.scene('Personalizza il tuo sito', 'In Template decidi come appare il tuo menu e la tua pagina pubblica: sezioni, colori, testi e foto, con l\'anteprima dal vivo.', 6500);
    await page.mouse.move(1000, 600, { steps: 20 });
    await sc.pause(1200);
    for (const tab of ['Colori', 'Contenuti', 'Layout']) {
        await sc.click(page.getByRole('button', { name: tab, exact: true }), 1800);
    }
    await sc.click(page.getByRole('button', { name: 'Sezioni' }), 1200);
    await sc.click(page.getByRole('button', { name: 'Desktop' }), 2500);
    await shot(page, '06-layout');
    await sc.scene('Anteprima desktop e mobile', 'Controlli subito come si vede da computer e da telefono, e quando sei soddisfatto salvi le modifiche.', 4500);
    await sc.click(page.getByRole('button', { name: 'Mobile' }), 1000);

    // 7. Lingue
    await goMore('Lingue del menu');
    await page.waitForTimeout(1500);
    await sc.scene('Menu in più lingue', 'Con le Lingue del menu offri il menu ai turisti: scegli le lingue disponibili e i nomi dei piatti vengono tradotti per te.', 6000);
    for (const l of ['Inglese', 'Tedesco', 'Francese', 'Spagnolo']) {
        await page.getByRole('button', { name: l }).first().hover();
        await sc.pause(700);
    }
    await shot(page, '07-lingue');

    // 8. QR code
    await page.goto(`${APP}/${SLUG}/Dashboard/QRCode`);
    await page.waitForTimeout(2500);
    await sc.scene('I QR code dei tavoli', 'Ogni tavolo ha il suo QR code: lo stampi, lo appoggi sul tavolo e il cliente ordina dal telefono, già collegato al suo tavolo.', 6500);
    await page.mouse.move(430, 370, { steps: 20 });
    await sc.pause(1000);
    await sc.click(page.getByText('Stampa').first().first(), 800).catch(() => {});
    await sc.scroll(500, 5);
    await shot(page, '08-qr');

    // 9. Sala
    await page.goto(`${APP}/${SLUG}/Dashboard/Tables`);
    await page.waitForTimeout(2500);
    await sc.scene('La mappa della sala', 'Gestione Sala mostra tutti i tavoli: in verde quelli liberi, in rosso quelli occupati, con il numero dei coperti.', 6000);
    await page.mouse.move(210, 250, { steps: 25 });
    await sc.pause(1500);
    await shot(page, '09-sala');
    await sc.scene('Apri e chiudi i tavoli', 'Con le icone su ogni tavolo vedi i dettagli, il codice di accesso per i clienti e liberi il tavolo a fine servizio.', 5500);

    // 10. Ordini in tempo reale
    await sc.click(nav('Ordini'), 2000);
    await sc.scene('Ordini in tempo reale', 'Gli ordini arrivano qui in tempo reale, sia dai clienti sia dai camerieri, senza dover aggiornare la pagina.', 5500);
    await shot(page, '10-ordini-a');
    await data.newOrderLater();
    await page.waitForTimeout(2500);
    await page.mouse.move(250, 300, { steps: 20 });
    await sc.scene('Ecco un nuovo ordine', 'Ecco: è appena arrivato un ordine dal Tavolo 4, comparso da solo. Puoi completarlo o cancellarlo con un tocco.', 5500);
    await shot(page, '10-ordini-b');
    for (const f of ['In Corso', 'Nuovi', 'Tutti']) await sc.click(page.getByRole('button', { name: f, exact: true }), 1000);

    // 11. Cassa
    await sc.click(nav('Cassa'), 2000);
    await sc.scene('La Cassa', 'In Cassa chiudi i conti: scegli il tavolo da incassare e controlli il dettaglio di quello che ha consumato.', 5000);
    await sc.click(page.getByText('Tavolo Tavolo 1').or(page.getByText('Tavolo 1')).first(), 1800);
    await shot(page, '11-cassa-a');
    await sc.scene('Collega la tessera fedeltà', 'Se il cliente ha una tessera fedeltà, collegala digitando il codice: accumula punti oppure li usa come sconto.', 5000);
    await sc.click(page.getByText('Collega tessera fedeltà'), 800);
    await sc.type(page.getByPlaceholder('Codice tessera'), data.cardCode);
    await sc.click(page.getByRole('button', { name: 'Cerca' }), 1800);
    await shot(page, '11-cassa-b');
    await page.getByText('Totale', { exact: true }).last().scrollIntoViewIfNeeded();
    await sc.scene('Sconti e punti', 'Puoi anche applicare uno sconto in percentuale o fissare il prezzo finale, e vedi subito il totale da incassare.', 5500);
    await sc.click(page.getByRole('button', { name: '10%', exact: true }), 1800);
    await shot(page, '11-cassa-c');
    await sc.scene('Chiudi il conto', 'Quando è tutto a posto, premi Chiudi conto: i punti vengono assegnati alla tessera e l\'incasso viene registrato.', 4500);
    await sc.click(page.getByRole('button', { name: 'Chiudi conto' }), 2500);
    await shot(page, '11-cassa-d');
    await sc.click(page.getByRole('button', { name: /Storico/ }), 2500);
    await sc.scene('Storico pagamenti', 'Nello Storico trovi tutti i pagamenti, che puoi filtrare per periodo e per tipo.', 5000);
    await shot(page, '11-cassa-storico');

    // 12. Prenotazioni
    await sc.click(nav('Prenotazioni'), 2000);
    await sc.scene('Le prenotazioni', 'In Prenotazioni vedi tutte le richieste: puoi confermarle, segnare l\'arrivo del cliente o inserirne di nuove tu stesso.', 6000);
    await sc.click(page.getByRole('button', { name: 'Calendario' }), 2500);
    await shot(page, '12-prenotazioni-cal');
    await sc.scene('Vista calendario', 'Con la vista calendario controlli a colpo d\'occhio i giorni più pieni.', 4000);
    await sc.click(page.getByRole('button', { name: 'Lista' }), 1200);
    await sc.click(page.getByRole('button', { name: /Nuova prenotazione/ }), 2000);
    await shot(page, '12-prenotazioni-nuova');
    await sc.scene('Aggiungi una prenotazione', 'Se qualcuno prenota al telefono, la inserisci qui in pochi secondi.', 4000);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);
    if (await page.getByRole('button', { name: /Annulla|Chiudi/ }).first().isVisible().catch(() => false)) {
        await sc.click(page.getByRole('button', { name: /Annulla|Chiudi/ }).first(), 800);
    }

    // 13. Slot asporto
    await goMore('Slot Asporto');
    await page.waitForTimeout(1500);
    await sc.scene('Gli ordini da asporto', 'Negli Slot Asporto imposti gli orari in cui accetti ordini da portare via e quanti ne puoi gestire in ogni fascia.', 6000);
    await page.mouse.move(380, 440, { steps: 20 });
    await sc.pause(1000);
    await page.mouse.move(1000, 520, { steps: 25 });
    await sc.pause(1500);
    await shot(page, '13-slot');
    await sc.scene('Sospendi l\'asporto', 'Nei momenti di punta puoi sospendere l\'asporto con un tocco, e riattivarlo quando vuoi.', 4500);
    await page.mouse.move(1280, 253, { steps: 20 });
    await sc.pause(1500);

    // 14. Tessere fedeltà
    await page.goto(`${APP}/${SLUG}/Dashboard/Cards`);
    await page.waitForTimeout(2500);
    await sc.scene('Le tessere fedeltà', 'Le tessere fedeltà premiano i clienti abituali: qui vedi saldo, visite e premi da riscattare.', 5500);
    await shot(page, '14-tessere');
    await page.mouse.move(1330, 230, { steps: 25 });
    await sc.scene('Le regole', 'Con Regole tessere scegli come si accumulano i punti e quale premio offrire.', 4500);
    await sc.click(page.getByRole('button', { name: /Nuova tessera/ }), 2000);
    await shot(page, '14-tessere-nuova');
    await sc.scene('Emetti una nuova tessera', 'Per ogni nuovo cliente crei una tessera in pochi secondi e gliela consegni con il QR.', 4500);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);
    if (await page.getByRole('button', { name: /Annulla|Chiudi/ }).first().isVisible().catch(() => false)) {
        await sc.click(page.getByRole('button', { name: /Annulla|Chiudi/ }).first(), 800);
    }

    // 15. Camerieri
    await goMore('Camerieri');
    await page.waitForTimeout(1500);
    await sc.scene('Il tuo staff', 'In Camerieri vedi il tuo personale. Per aggiungere un nuovo cameriere premi Aggiungi Cameriere.', 5000);
    await sc.click(page.getByRole('button', { name: /Aggiungi Cameriere/ }), 2000);
    await shot(page, '15-camerieri');
    await sc.scene('Il link d\'invito', 'Ti viene mostrato un link da inviargli: dopo la registrazione, approvi tu il suo accesso da questa pagina.', 6000);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);
    if (await page.getByRole('button', { name: /Chiudi|Annulla/ }).first().isVisible().catch(() => false)) {
        await sc.click(page.getByRole('button', { name: /Chiudi|Annulla/ }).first(), 800);
    }

    // 16. Stampanti
    await goMore('Stampanti');
    await page.waitForTimeout(1500);
    await sc.scene('Le stampanti delle comande', 'Nelle Stampanti colleghi quelle di cucina e bar: ogni nuovo ordine viene stampato in automatico.', 5500);
    await sc.click(page.getByRole('button', { name: /Aggiungi stampante/ }), 2000);
    await shot(page, '16-stampanti');
    await sc.scene('Aggiungi una stampante', 'Scegli il tipo di stampante, la inserisci e puoi vedere gli ultimi job stampati.', 4500);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);
    if (await page.getByRole('button', { name: /Annulla|Chiudi/ }).first().isVisible().catch(() => false)) {
        await sc.click(page.getByRole('button', { name: /Annulla|Chiudi/ }).first(), 800);
    }

    // 17. Analytics
    await goMore('Analytics');
    await page.waitForTimeout(3000);
    await sc.scene('Analytics', 'In Analytics controlli l\'andamento: incassi, sconti concessi, ordini degli ultimi giorni.', 5500);
    await shot(page, '17-analytics-a');
    await sc.scroll(600, 6);
    await sc.scene('Più venduti e categorie', 'Più in basso scopri i piatti più venduti e quali categorie funzionano meglio.', 5000);
    await shot(page, '17-analytics-b');
    await page.mouse.wheel(0, -2000);

    // 18. Chiusura
    await sc.click(nav('Home'), 2500);
    await sc.scene('Tutto sotto controllo', 'Questo è RestaurantFlow: tutto il tuo ristorante in un unico posto. Buon lavoro!', 5000);
    await sc.finish();
});
