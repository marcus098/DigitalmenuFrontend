import { test, expect, Locator } from '@playwright/test';
import { Screencast } from './helpers';

/**
 * Guida video per il CLIENTE (cellulare): QR, codice tavolo, menu, allergeni, extra, carrello,
 * ordine di gruppo, stato in tempo reale, cronologia, pagamento, asporto, carta fedeltà.
 */
const API = 'http://localhost:8085';
const APP = 'http://localhost:5173';
const SLUG = 'trattoriadamarco';
const TABLE = 12;
const SHOTS = 'screencast-shots/client';

async function api(path: string, method = 'GET', token?: string, body?: unknown) {
    const res = await fetch(API + path, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
        body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch { /* noop */ }
    return { status: res.status, json };
}

test.use({ actionTimeout: 15_000, navigationTimeout: 20_000 });

test('guida cliente', async ({ page }) => {
    test.setTimeout(10 * 60_000);

    // ---------- Preparazione (non visibile) ----------
    const login = await api('/api/login', 'POST', undefined, { emailUsername: 'demo-owner@restaurantflow.test', password: 'Demo#Trattoria2026' });
    const token: string = login.json.accessToken;
    await api(`/api/tables/${TABLE}/session/close`, 'POST', token);
    const opened = await api(`/api/tables/${TABLE}/session/open`, 'POST', token, { seats: 2 });
    expect(opened.status).toBe(200);
    const { sessionId, accessCode } = opened.json as { sessionId: string; accessCode: string };

    const sc = new Screencast(page, 'client');
    await page.addInitScript(() => {
        try {
            localStorage.setItem('cookieConsent', JSON.stringify({ version: 1, timestamp: new Date().toISOString(), state: { necessary: true, functional: true, analytics: false, marketing: false } }));
        } catch { /* noop */ }
    });
    // Didascalia sopra il pulsante flottante del menu
    await page.addInitScript(() => {
        const add = () => {
            const s = document.createElement('style');
            s.textContent = '#__sc_caption{bottom:104px !important;max-width:80vw !important}';
            document.head.appendChild(s);
        };
        if (document.head) add(); else document.addEventListener('DOMContentLoaded', add);
    });
    await sc.setup();

    const shot = async (name: string) => { await page.screenshot({ path: `${SHOTS}/${name}.png` }); };

    /** Scena: didascalia + voce; esegue le azioni e poi attende fino al termine stimato della voce. */
    const say = async (title: string, voice: string, actions?: () => Promise<void>, shotName?: string) => {
        const t0 = Date.now(); console.log('SCENE', title, new Date().toISOString());
        await sc.scene(title, voice, 1200);
        if (actions) await actions();
        if (shotName) await shot(shotName);
        const words = voice.split(/\s+/).length;
        const need = words * 330 + 700;
        const left = need - (Date.now() - t0);
        if (left > 0) await page.waitForTimeout(left);
    };

    const tap = (loc: Locator) => sc.click(loc, 900);
    const goto = async (path: string) => {
        await page.goto(APP + path);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(900);
    };
    const addBtn = () => page.getByRole('button', { name: /^Aggiungi/ });

    try {
        // ---------- 1. Pagina pubblica ----------
        await say('Il sito del ristorante',
            'Ogni ristorante ha la sua pagina: trovi indirizzo, orari e il menù completo, e puoi ordinare, prenotare o ordinare da asporto.',
            async () => { await goto(`/${SLUG}`); await sc.scroll(500, 5); await page.mouse.wheel(0, -500); await page.waitForTimeout(500); }, '01-vetrina');

        // ---------- 2. QR ----------
        await say('Inquadra il QR del tavolo',
            'Al tavolo trovi un codice QR: inquadralo con la fotocamera del telefono e si apre subito il menù, senza scaricare nessuna app.',
            async () => { await goto(`/${SLUG}/Categories?table=${TABLE}`); }, '02-codice');

        // ---------- 3. Codice ----------
        await say('Inserisci il codice del cameriere',
            'Per ordinare dal tavolo serve il codice di quattro caratteri che ti dà il cameriere. Scrivilo e premi Entra al tavolo.',
            async () => {
                await sc.pause(800);
                await sc.type(page.locator('input').first(), accessCode);
                await sc.pause(600);
                await tap(page.getByRole('button', { name: 'Entra al tavolo' }));
                await page.waitForURL(/Categories/);
                await page.waitForTimeout(1200);
            }, '03-menu');

        // ---------- 4. Categorie ----------
        await say('Sfoglia il menù per categorie',
            'Eccoci nel menù: antipasti, primi, secondi, pizze, bevande e dolci. Scegli la categoria che ti interessa.',
            async () => { await sc.scroll(450, 5); await page.mouse.wheel(0, -450); await page.waitForTimeout(500); }, '04-categorie');

        await tap(page.getByText('Pizze', { exact: true }).first());
        await page.waitForURL(/Products/);
        await page.waitForTimeout(1000);

        // ---------- 5. Allergeni ----------
        await say('Allergeni sempre visibili',
            'Per ogni piatto vedi subito ingredienti e allergeni. E con lo scudo in alto puoi nascondere i piatti che non fanno per te.',
            async () => {
                await sc.scroll(300, 4);
                await page.mouse.wheel(0, -300);
                await page.waitForTimeout(600);
            }, '05-allergeni');

        // ---------- 6. Prodotto + extra ----------
        await say('Personalizza il piatto',
            'Tocca un piatto per aprirlo. Qui puoi aggiungere degli extra, per esempio la mozzarella di bufala sulla Margherita, e scrivere una nota.',
            async () => {
                await tap(page.getByText('Margherita', { exact: true }).first());
                await page.waitForTimeout(1000);
                await tap(page.getByText('Aggiunte extra'));
                await page.waitForTimeout(600);
                await tap(page.getByText('Mozzarella di bufala', { exact: true }));
                await page.waitForTimeout(800);
            }, '06-extra');

        await say('Aggiungi al carrello',
            'Poi premi Aggiungi: il piatto con gli extra finisce nel carrello, e il prezzo si aggiorna da solo.',
            async () => {
                await tap(addBtn());
                await page.waitForTimeout(1200);
            }, '07-aggiunto');

        // ---------- 7. Altri piatti ----------
        await say('Aggiungi altri piatti',
            'Continua con gli altri piatti: un primo e due bevande. Con più e meno scegli la quantità.',
            async () => {
                await goto(`/${SLUG}/Products/19?table=${TABLE}`);
                await tap(page.getByText('Spaghetti alla carbonara', { exact: true }).first());
                await page.waitForTimeout(800);
                await tap(addBtn());
                await page.waitForTimeout(900);
                await goto(`/${SLUG}/Products/22?table=${TABLE}`);
                await tap(page.getByText('Coca-Cola 33cl', { exact: true }).first());
                await page.waitForTimeout(700);
                await tap(page.locator('button:has(svg.lucide-plus)').last());
                await page.waitForTimeout(500);
                await shot('08-quantita');
                await tap(addBtn());
                await page.waitForTimeout(900);
            }, '08-altri');

        // ---------- 8. Carrello ----------
        await say('Controlla il carrello',
            'Nel carrello rivedi l\'ordine con il totale, e puoi togliere o cambiare le quantità prima di confermare.',
            async () => {
                await goto(`/${SLUG}/cart`);
                await sc.scroll(300, 4);
                await page.waitForTimeout(500);
            }, '09-carrello');

        // ---------- 9. Sono pronto ----------
        await say('Ordine di gruppo: sono pronto',
            'Se siete in più persone al tavolo, ognuno ordina dal proprio telefono. Quando hai finito premi Sono pronto.',
            async () => {
                await tap(page.getByRole('button', { name: 'Sono pronto' }));
                await page.waitForURL(/table-session/);
                await page.waitForTimeout(1200);
            }, '10-pronto');

        // Secondo commensale (via API, non visibile come browser)
        const guest = 'guest-' + Date.now();
        await api('/api/public/sessions/join', 'POST', undefined, { tableId: TABLE, code: accessCode, localname: SLUG, clientSessionId: guest });
        await page.waitForTimeout(2500);
        await say('Si vede chi è pronto',
            'Qui vedi tutti i commensali collegati: un amico si è appena unito e sta ancora scegliendo.',
            async () => { await page.waitForTimeout(500); }, '11-ospite');
        await api(`/api/public/sessions/${sessionId}/ready`, 'POST', undefined, {
            clientSessionId: guest,
            draftOrder: [{ products: [{ idProduct: 44, productOption: 'Standard', note: '', quantity: 1, ingredientsMinus: [], ingredientsPlus: [] }] }],
        });
        await page.waitForTimeout(2500);
        await say('Tutti pronti: invia al cameriere',
            'Quando tutti sono pronti, uno di voi invia gli ordini al cameriere con un solo tocco. Se serve, puoi ancora modificare il tuo.',
            async () => {
                await tap(page.getByRole('button', { name: 'Invia ordini al cameriere' }));
                await page.waitForURL(/table-live/);
                await page.waitForTimeout(1500);
            }, '12-inviato');

        await say('Segui l\'ordine in tempo reale',
            'Ecco gli ordini del tavolo. Appena la cucina inizia a prepararli, lo stato cambia da solo, senza ricaricare la pagina.',
            async () => { await page.waitForTimeout(500); }, '13-live');

    } finally {
        await sc.finish().catch(() => {});
        await api(`/api/tables/${TABLE}/session/close`, 'POST', token);
    }
});
