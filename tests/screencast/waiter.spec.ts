import { test, expect, Page } from '@playwright/test';
import fs from 'fs';
import { Screencast } from './helpers';

/**
 * Guida video per il CAMERIERE (mobile). Usa solo Tavolo 5 e Tavolo 6.
 * Avvio: SC_ROLE=waiter npx playwright test -c playwright.screencast.config.ts tests/screencast/waiter.spec.ts
 */
const BASE = 'http://localhost:5173';
const SLUG = 'trattoriadamarco';
const INVITE = `${BASE}/urlInvite/3/EED9HP3Y793620721389016064`;
const EMAIL = 'demo-waiter@restaurantflow.test';
const PASSWORD = 'Demo#Cameriere2026';
const SHOTS = 'screencast-output/waiter';

const tableCard = (page: Page, name: string) =>
    page.locator('div.rounded-xl').filter({ has: page.getByText(name, { exact: true }) }).first();

test('guida cameriere', async ({ page }) => {
    test.setTimeout(10 * 60_000);
    fs.mkdirSync(SHOTS, { recursive: true });
    await page.context().addInitScript(() => {
        localStorage.setItem('cookieConsent', JSON.stringify({
            version: 1, timestamp: new Date().toISOString(),
            state: { necessary: true, functional: true, analytics: false, marketing: false },
        }));
    });
    const sc = new Screencast(page, 'waiter');
    await sc.setup();
    const shot = (n: string) => page.screenshot({ path: `${SHOTS}/${n}.png` });
    // scroll fluido (page.mouse.wheel si blocca con l'emulazione touch)
    const scrollBy = async (dist: number, steps = 8) => {
        for (let i = 0; i < steps; i++) {
            await page.evaluate(d => window.scrollBy(0, d), dist / steps);
            await page.waitForTimeout(300);
        }
    };
    const settle = async () => { await page.waitForLoadState('domcontentloaded'); await page.waitForTimeout(1800); };
    const goHome = async () => {
        await page.goto(`${BASE}/${SLUG}/Dashboard/Home`);
        await settle();
    };

    // ---- 1. Invito ----
    await page.goto(INVITE);
    await settle();
    await sc.scene('Il tuo invito', 'Il titolare ti invia un link di invito: da qui crei il tuo account da cameriere, con nome, cognome, email e password. Una volta registrato, aspetti che il titolare ti approvi.', 9000);
    await shot('01-invite');

    // ---- 2. Login ----
    await page.goto(`${BASE}/login`);
    await settle();
    await sc.scene('Accedi con la tua email', 'Quando il tuo account è approvato, accedi dalla pagina di login con la tua email e la password.', 3500);
    await sc.type(page.locator('input[type=email]'), EMAIL);
    await sc.type(page.locator('input[type=password]'), PASSWORD);
    await shot('02-login');
    await sc.pause(800);
    await sc.click(page.locator('button[type=submit]'), 500);
    await page.waitForURL(/Dashboard\/Home/);
    await settle();
    await sc.pause(800);

    // ---- 3. Home ----
    await sc.scene('La tua home', 'Questa è la tua home: in alto vedi i tavoli occupati, gli ordini in coda, le prenotazioni e gli incassi di oggi.', 7000);
    await shot('03-home');
    await scrollBy(500, 8);
    await sc.scene('Azioni rapide', 'Più in basso trovi le azioni rapide per raggiungere subito sala, ordini e prenotazioni.', 5000);
    await page.evaluate(() => window.scrollTo(0, 0));

    // ---- 4. Sala ----
    await page.goto(`${BASE}/${SLUG}/Dashboard/Tables`);
    await settle();
    await sc.scene('La sala', 'Nella sezione Sala vedi tutti i tavoli. Quelli verdi sono liberi, quelli rossi sono occupati.', 6000);
    await tableCard(page, 'Tavolo 5').scrollIntoViewIfNeeded();
    await sc.pause(1500);
    await shot('04-sala');

    // ---- 5. Apri Tavolo 5 ----
    const t5 = tableCard(page, 'Tavolo 5');
    await sc.scene('Apri il Tavolo 5', 'Per far sedere dei clienti, tocca l\'icona delle persone sul tavolo: si apre la sessione del gruppo.', 5500);
    await sc.click(t5.locator('[title="Sessione gruppo"]'), 1200);
    await expect(page.getByText('Nessuna sessione aperta')).toBeVisible();
    await sc.scene('Quattro coperti', 'Indica il numero di coperti, in questo caso quattro, e tocca Apri tavolo.', 3500);
    const seats = page.locator('input[type=number]').first();
    await sc.click(seats, 300);
    await seats.fill('');
    await seats.pressSequentially('4', { delay: 200 });
    await sc.pause(900);
    await sc.click(page.getByRole('button', { name: 'Apri tavolo' }), 1500);
    await expect(page.getByText('Password', { exact: true })).toBeVisible();
    await page.mouse.move(195, 330, { steps: 10 });
    await sc.scene('Il codice di accesso', 'Ecco il codice di quattro caratteri: consegnalo ai clienti, che lo inseriscono dal telefono dopo aver inquadrato il QR del tavolo.', 9000);
    await shot('05-codice');
    await sc.scene('Clienti collegati', 'Qui sotto vedrai chi si collega al tavolo e se è ancora in scelta oppure pronto a ordinare.', 5500);
    await page.keyboard.press('Escape');
    await page.mouse.click(195, 30); // chiude toccando fuori dal riquadro
    await sc.pause(900);

    // ---- 6. Nuovo ordine ----
    await goHome();
    await sc.scene('Prendi un ordine', 'Per prendere un ordine direttamente dal tavolo, tocca Nuovo Ordine.', 4000);
    await sc.click(page.getByRole('button', { name: /Nuovo Ordine/ }).first(), 1500);
    await page.waitForURL(/Waiters\/.*\/Categories/i);
    await settle();
    await sc.scene('Scegli la categoria', 'Si apre il menu del locale: scegli la categoria, per esempio le pizze.', 5000);
    await shot('06-categorie');
    await sc.click(page.getByText('Pizze', { exact: true }).first(), 1500);
    await settle();
    await sc.scene('Scegli il piatto', 'Tocca il piatto che i clienti hanno chiesto.', 4000);
    await shot('07-prodotti');
    await sc.click(page.getByText('Margherita', { exact: true }).first(), 1500);
    await sc.scene('Aggiunte extra', 'Se serve, puoi togliere ingredienti o aggiungere extra a pagamento, come la mozzarella di bufala.', 6000);
    const drawer = page;
    const bufala = drawer.getByText('Mozzarella di bufala', { exact: true }).first();
    await sc.click(bufala, 1200);
    await shot('08-extra');
    await sc.pause(1000);
    await sc.click(page.getByRole('button', { name: /^Aggiungi/ }), 1500);
    await shot('09-aggiunto');

    // una bevanda
    await sc.scene('Aggiungi altro', 'Aggiungi lo stesso il resto dell\'ordine: ora una bibita.', 4000);
    await page.goBack().catch(() => {});
    await settle();
    if (!/categories/i.test(page.url())) await page.goto(`${BASE}/Waiters/${SLUG}/Categories`);
    await settle();
    await sc.click(page.getByText('Bevande', { exact: true }).first(), 1500);
    await settle();
    await sc.click(page.getByText('Coca-Cola 33cl', { exact: true }).first(), 1500);
    await sc.click(page.getByRole('button', { name: /^Aggiungi/ }), 1500);
    await shot('10-bibita');

    // ---- 7. Carrello ----
    await sc.scene('Apri il carrello', 'Quando hai finito, tocca il carrello in alto a destra per rivedere l\'ordine.', 4500);
    // BUG app: il pulsante carrello in alto porta al carrello cliente (vuoto) invece di /Waiters/.../cart.
    const bag = page.locator('header button, header a').last();
    const bb = await bag.boundingBox();
    if (bb) await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps: 12 });
    await sc.pause(1200);
    await page.goto(`${BASE}/Waiters/${SLUG}/cart`);
    await settle();
    await sc.scene('Controlla il riepilogo', 'Controlla piatti, extra e totale, poi conferma l\'ordine.', 5000);
    await shot('11-carrello');
    await sc.click(page.getByRole('button', { name: /Conferma Ordine/ }), 1500);
    await sc.scene('Ordine da tavolo', 'Scegli Da Tavolo, poi seleziona il tavolo giusto.', 4500);
    await sc.click(page.getByText('Da Tavolo', { exact: true }), 1200);
    await shot('12-tavolo-popup');
    await page.locator('select').selectOption({ label: 'Tavolo 5 (occupato)' });
    await sc.pause(1200);
    await shot('13-tavolo-scelto');
    await sc.scene('Invia in cucina', 'Tocca Conferma: l\'ordine parte subito in cucina e viene stampato.', 4500);
    await sc.click(page.getByRole('button', { name: 'Conferma', exact: true }), 1500);
    await page.waitForURL(/Dashboard\/Home/, { timeout: 15000 });
    await settle();
    await sc.pause(2000);

    // ---- 8. Ordini ----
    await page.goto(`${BASE}/${SLUG}/Dashboard/Orders`);
    await settle();
    await sc.scene('Gli ordini', 'Nella sezione Ordini trovi tutte le comande: le nuove, quelle in preparazione e quelle completate.', 5500);
    const orderCard = page.locator('div').filter({ hasText: 'Tavolo: Tavolo 5' })
        .filter({ has: page.getByRole('button', { name: /In Cucina|Completa/ }) }).last();
    await orderCard.scrollIntoViewIfNeeded();
    await sc.pause(1200);
    await shot('14-ordini');
    await sc.scene('Cambia lo stato', 'Ecco l\'ordine del Tavolo 5. Quando la cucina lo prende in carico, segnalo con In Cucina.', 5500);
    const inCucina = orderCard.getByRole('button', { name: 'In Cucina' });
    if (await inCucina.count()) await sc.click(inCucina.first(), 1800);
    await shot('15-in-cucina');
    await sc.scene('Piatti serviti', 'E quando i piatti sono stati serviti, tocca Completa.', 4500);
    const completa = page.locator('div').filter({ hasText: 'Tavolo: Tavolo 5' })
        .filter({ has: page.getByRole('button', { name: 'Completa' }) }).last();
    await sc.click(completa.getByRole('button', { name: 'Completa' }).first(), 1800);
    await shot('16-completato');

    // ---- 9. Prenotazioni ----
    await page.goto(`${BASE}/${SLUG}/Dashboard/Reservations`);
    await settle();
    await sc.scene('Le prenotazioni', 'Nella sezione Prenotazioni vedi chi ha prenotato, per oggi e per i prossimi giorni.', 5500);
    await scrollBy(700, 8);
    await page.evaluate(() => window.scrollTo(0, 0));
    await sc.scene('Nuova prenotazione', 'Se un cliente prenota al telefono o di persona, tocca Nuova prenotazione.', 4500);
    await sc.click(page.getByRole('button', { name: /Nuova prenotazione/ }), 1500);
    await sc.type(page.locator('form input').nth(1), 'Famiglia Rinaldi');
    await sc.pause(400);
    await sc.type(page.locator('form input[type=tel]'), '3331234567');
    await sc.scene('Compila i dati', 'Inserisci nome, telefono, numero di persone, data e ora. Poi conferma con Inserisci.', 6500);
    const people = page.locator('form input[type=number]');
    await sc.click(page.getByRole('button', { name: 'Una persona in più' }), 400);
    await sc.click(page.getByRole('button', { name: 'Una persona in più' }), 400);
    await page.locator('form input[type=date]').fill('2026-11-08');
    await page.locator('form input[type=time]').fill('20:30');
    await sc.pause(800);
    await page.evaluate(() => document.querySelector('form')?.scrollTo?.(0, 400));
    await shot('17-prenotazione-form');
    await sc.click(page.getByRole('button', { name: 'Inserisci' }), 1800);
    await expect(page.getByText('Famiglia Rinaldi').first()).toBeVisible({ timeout: 8000 });
    await sc.scene('Prenotazione salvata', 'Fatto: la prenotazione è nell\'elenco, confermata.', 4000);
    await shot('18-prenotazione-salvata');

    // ---- 10. Esaurito ----
    await page.goto(`${BASE}/${SLUG}/Dashboard/Menu`);
    await settle();
    await sc.scene('Piatto esaurito', 'Se un piatto è finito, vai su Menu e mettilo come non disponibile: sparisce subito dal menu dei clienti.', 6000);
    await sc.click(page.getByText('Dolci', { exact: true }).first(), 1200);
    const cannolo = page.locator('div').filter({ hasText: 'Cannolo siciliano' }).filter({ has: page.getByRole('button', { name: 'No', exact: true }) }).last();
    await cannolo.scrollIntoViewIfNeeded();
    await sc.pause(800);
    await sc.click(cannolo.getByRole('button', { name: 'No', exact: true }), 1500);
    await shot('19-esaurito');
    await sc.scene('Di nuovo disponibile', 'Quando torna disponibile, basta toccare Sì.', 4000);
    await sc.click(cannolo.getByRole('button', { name: 'Sì', exact: true }), 1500);

    // ---- 11. Report ----
    await page.goto(`${BASE}/${SLUG}/Dashboard/WaiterAnalytics`);
    await settle();
    await sc.scene('Il report camerieri', 'Nel report vedi gli ordini presi e i prodotti serviti dal personale, per oggi, gli ultimi sette o trenta giorni.', 6500);
    await sc.click(page.getByRole('button', { name: 'Oggi' }), 1500);
    await scrollBy(600, 8);
    await shot('20-report');
    await page.evaluate(() => window.scrollTo(0, 0));

    // ---- 12. Chiudi tavolo ----
    await page.goto(`${BASE}/${SLUG}/Dashboard/Tables`);
    await settle();
    await tableCard(page, 'Tavolo 5').scrollIntoViewIfNeeded();
    await sc.scene('Libera il tavolo', 'Quando i clienti se ne vanno, riapri la sessione del tavolo e tocca Chiudi tavolo: così torna libero per i prossimi.', 6500);
    await sc.click(tableCard(page, 'Tavolo 5').locator('[title="Sessione gruppo"]'), 1200);
    await shot('21-chiudi');
    await sc.click(page.getByRole('button', { name: 'Chiudi tavolo' }), 2000);
    await shot('22-chiuso');
    await page.mouse.click(195, 30);
    await sc.pause(800);
    await tableCard(page, 'Tavolo 5').scrollIntoViewIfNeeded();
    await sc.scene('Tavolo libero', 'Il tavolo è di nuovo verde. Buon servizio!', 5000);
    await shot('23-fine');

    await sc.finish();
});
