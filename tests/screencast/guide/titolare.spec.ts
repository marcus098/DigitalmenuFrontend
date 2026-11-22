import { test, Page, Locator } from '@playwright/test';
import { api, apiLogin, cleanupTable, chapter, prepareContext, OWNER, SLUG, WAITER, Chapter } from './guide';

/**
 * Parte 3 — Titolare (dashboard, 1440x900). Un test = un capitolo.
 * Tavoli: usa solo tavoli liberi tra 8, 3, 4, 7 (id 17, 12, 13, 16) e li richiude a fine capitolo.
 */
const PART = 'Titolare';
let TOKEN = '';
const RUN_START = Date.now();
const D = (p: string) => `/${SLUG}/Dashboard/${p}`;

test.beforeAll(async () => { TOKEN = await apiLogin(); });

async function freeTable(skip: number[] = []): Promise<{ id: number; name: string }> {
    for (const id of [17, 12, 13, 16]) {
        if (skip.includes(id)) continue;
        const t = await api(`/api/public/sessions/table/${id}?localname=${SLUG}`);
        if (t.json && t.json.busy === false) return { id, name: t.json.tableName };
    }
    throw new Error('Nessun tavolo libero');
}
const prod = (idProduct: number, quantity = 1, note = '') =>
    ({ idProduct, productOption: 'Standard', quantity, ingredientsMinus: [], ingredientsPlus: [], note });
/** Comanda del cameriere su un tavolo (aperto con N coperti). Restituisce l'id della comanda. */
async function waiterOrder(tableId: number, seats: number, products: ReturnType<typeof prod>[]) {
    await api(`/api/tables/${tableId}/session/open`, 'POST', TOKEN, { seats });
    await api('/api/orders/insertWaiter', 'POST', TOKEN, { type: 'AddComandWaiter', comandWaiterType: 'TABLE', idTable: tableId, seats, orders: [{ products }] });
    const all = await api('/api/dashboard/getAll', 'GET', TOKEN, undefined, 'http://localhost:8081');
    const mine = (all.json?.comands ?? []).filter((c: any) => c.idTable === tableId && c.status !== 'DELETED');
    return mine.map((c: any) => c.id as string);
}

const nav = (page: Page, label: string) => page.locator('header').getByRole('link', { name: label, exact: true }).first();
async function more(ch: Chapter, page: Page, label: string) {
    await ch.click(page.locator('header').getByRole('button', { name: /Altro/ }).first(), 900);
    await ch.click(page.getByRole('link', { name: label, exact: true }).first(), 2500);
}
async function start(page: Page, info: any, title: string, path: string, settle = 2500) {
    const ch = await chapter(page, info, PART, title);
    await prepareContext(page.context(), TOKEN);
    await ch.goto(D(path), settle);
    ch.begin();
    return ch;
}
const tableCard = (page: Page, name: string) => page.locator('.react-grid-item').filter({ has: page.getByText(name, { exact: true }) }).first();

// ───────────────────────────── 16 Accesso e Home ─────────────────────────────
test('16 Accesso e Home del titolare', async ({ page }, info) => {
    const ch = await chapter(page, info, PART, 'Accesso e Home del titolare');
    await prepareContext(page.context());
    await ch.goto('/login', 2000);
    ch.begin();
    await ch.say('Il titolare gestisce tutto il ristorante dalla dashboard di DineUp. Accede con la sua email e la sua password.', async () => {
        await ch.type(page.locator('input[type=email]'), OWNER.email, 300);
        await ch.type(page.locator('input[type=password]'), OWNER.password, 300);
        await ch.click(page.locator('button[type=submit]'), 1000);
        await page.waitForURL(/Dashboard\/Home/);
        await ch.pause(2000);
    });
    await ch.say('In alto, quattro numeri per capire la giornata: tavoli occupati, ordini in coda, prenotazioni di oggi e incassi di oggi, online e in cassa.', async () => {
        for (const t of ['Tavoli Occupati', 'Ordini in Coda', 'Prenotazioni Oggi', 'Incassi Oggi']) await ch.point(page.getByText(t, { exact: true }).first(), 1100);
    });
    await ch.say("Sotto, il riquadro Com'è andata ieri: un riepilogo scritto in automatico con incasso, numero di comande, scontrino medio, ora di punta e piatto più venduto, confrontati con le settimane precedenti.", async () => {
        await ch.point(page.getByText(/Com.è andata ieri/i).first(), 2000);
        await ch.scroll(300, 6);
        await ch.point(page.getByText(/ORA DI PUNTA|Ora di punta/).first(), 1500);
    });
    await ch.say('Le azioni rapide portano in un tocco alle operazioni di tutti i giorni: nuovo ordine, tavoli, ordini, prenotazioni, menu, categorie, ingredienti e camerieri.', async () => {
        await ch.scroll(350, 6);
        await ch.point(page.getByText(/azioni rapide/i).first(), 1500);
        await ch.point(page.getByRole('button', { name: /Ingredienti/ }).or(page.getByRole('link', { name: /Ingredienti/ })).last(), 1500);
    });
    await ch.say('A destra gli ordini recenti, con lo stato e da quanto tempo sono arrivati. Vedi tutti apre la pagina Ordini.', async () => {
        await ch.point(page.getByText(/ordini recenti/i).first(), 1500);
        await ch.point(page.getByText('Vedi tutti').first(), 1500);
    });
    await ch.say("Il menu in alto porta a tutte le aree: Menu, Sala, Ordini, Prenotazioni, Cassa, Consegne, e nel menu Altro le impostazioni del locale.", async () => {
        await ch.scrollTop();
        await ch.click(page.locator('header').getByRole('button', { name: /Altro/ }).first(), 2500);
        await ch.shot('altro');
    });
    await ch.say('Nei prossimi capitoli vediamo queste aree una per una.', async () => {
        await page.keyboard.press('Escape');
        await page.mouse.click(700, 500);
        await ch.pause(800);
    });
    await ch.finish();
});

// ───────────────────────────── 17 Menu ─────────────────────────────
test('17 Il menu: categorie e piatti', async ({ page }, info) => {
    const ch = await start(page, info, 'Il menu: categorie e piatti', 'Menu');
    const card = (name: string) => page.getByText(name, { exact: true }).first().locator('xpath=ancestor::div[.//button[@title="Modifica"]][1]');
    await ch.say('In Menu, a sinistra ci sono le categorie e a destra i piatti della categoria scelta, con prezzo, foto e disponibilità.', async () => {
        for (const c of ['Primi', 'Pizze', 'Dolci']) await ch.click(page.getByText(c, { exact: true }).first(), 1300);
        await ch.click(page.getByText('Antipasti', { exact: true }).first(), 1500);
        await ch.shot('menu');
    });
    await ch.say('Un piatto è finito? Con un tocco su No lo segni come esaurito: sparisce subito dal menu dei clienti e dal menu dei camerieri.', async () => {
        await ch.click(card('Burrata con pomodorini').getByText('No', { exact: true }), 2200);
        await ch.shot('esaurito');
    });
    await ch.say('Quando torna disponibile, tocca Sì. I piatti esauriti restano evidenziati, come il fritto misto.', async () => {
        await ch.click(card('Burrata con pomodorini').getByText('Sì', { exact: true }), 1800);
        await ch.point(page.getByText('Fritto misto di mare', { exact: true }).first(), 1500);
    });
    await ch.say('Con Nuova si crea una categoria, con Aggiungi Prodotto un nuovo piatto. La matita apre la scheda del piatto per modificarlo.', async () => {
        await ch.point(page.getByText('Nuova', { exact: true }).first(), 1300);
        await ch.point(page.getByLabel('Aggiungi prodotto').first(), 1300);
        await ch.point(card('Burrata con pomodorini').getByTitle('Modifica'), 1500);
    });
    await ch.finish();
});

// ───────────────────────────── 18 Piatto e varianti ─────────────────────────────
test('18 La scheda del piatto e i gruppi di varianti', async ({ page }, info) => {
    const ch = await start(page, info, 'La scheda del piatto e i gruppi di varianti', 'Product/44', 3000);
    const body = page.locator('main').first();
    await ch.say('Ecco la scheda della Margherita. In alto nome, descrizione e categoria: sono i testi che il cliente legge nel menu.', async () => {
        await ch.point(page.getByLabel('Nome Prodotto').first(), 1500);
        await ch.point(page.getByLabel('Descrizione').first(), 1500);
        await ch.point(page.getByLabel('Categoria').first(), 1200);
    });
    await ch.say('In Formato e prezzo si sceglie un prezzo unico oppure più formati: qui baby, normale e maxi, ognuno con il suo prezzo, e quello predefinito già selezionato per il cliente.', async () => {
        await ch.scroll(250, 6);
        await ch.point(page.getByRole('button', { name: 'Più formati' }), 1500);
        await ch.point(page.getByLabel('Prezzo del formato in euro').nth(2), 1500);
        await ch.point(page.getByText('Predefinito', { exact: true }).nth(1), 1200);
        await ch.shot('formati');
    });
    await ch.say("Sotto, le varianti: gruppi a scelta singola. Per l'impasto, classico oppure senza glutine con due euro di supplemento; per la mozzarella, classica o senza lattosio.", async () => {
        await ch.moveTo(page.getByLabel('Nome gruppo').first());
        await ch.pause(1500);
        await ch.point(page.getByLabel('Supplemento in euro').nth(1), 1800);
        await ch.shot('varianti');
    });
    await ch.say('Ogni scelta si può rendere non disponibile per un momento, ed evidenziare nella comanda, così la cucina non la perde di vista.', async () => {
        await ch.point(page.getByRole('switch', { name: 'Disponibile' }).nth(1), 1500);
        await ch.point(page.getByRole('switch', { name: 'Evidenzia in comanda' }).nth(1), 1500);
    });
    await ch.say("Con Allergeni ed etichette si indicano gli allergeni tolti o aggiunti da quella scelta, ed etichette come senza glutine: così il menu mostra sempre gli allergeni della versione scelta.", async () => {
        await ch.click(page.getByRole('button', { name: 'Allergeni ed etichette' }).nth(1), 2200);
        await ch.shot('allergeni');
        await ch.scroll(250, 5);
    });
    await ch.say('Le scelte e i gruppi si riordinano con le frecce o si eliminano. Aggiungi scelta crea una nuova voce, e i pulsanti rapidi aggiungono quelle più comuni.', async () => {
        await ch.point(page.getByRole('button', { name: 'Sposta gruppo giù' }).first(), 1200);
        await ch.point(page.getByRole('button', { name: 'Aggiungi scelta' }).first(), 1500);
    });
    await ch.say('Più in basso ingredienti, extra a pagamento, allergeni, la foto del piatto e lo stato. Alla fine si tocca Salva Modifiche.', async () => {
        await ch.scroll(900, 12);
        await ch.pause(1000);
        await ch.scroll(700, 10);
        await ch.scrollTop();
        await ch.point(page.getByRole('button', { name: /Salva Modifiche/ }).first(), 1500);
    });
    await ch.finish();
});

// ───────────────────────────── 19 Categorie e ingredienti ─────────────────────────────
test('19 Categorie e ingredienti', async ({ page }, info) => {
    const ch = await start(page, info, 'Categorie e ingredienti', 'Categories');
    await ch.say('In Gestione Categorie trovi tutte le categorie del menu, con la ricerca e i pulsanti per modificarle o riordinarle.', async () => {
        await ch.type(page.getByPlaceholder('Cerca una categoria...'), 'Pi', 1500);
        await page.getByPlaceholder('Cerca una categoria...').fill('');
        await ch.pause(800);
        await ch.shot('categorie');
    });
    await ch.say('Ogni categoria ha nome, descrizione e una foto, che i clienti vedono nel menu.', async () => {
        await ch.click(page.locator('[title="Modifica"], button:has(svg.lucide-pencil), button:has(svg.lucide-edit)').first(), 2500);
        await ch.shot('categoria');
        await page.goBack();
        await ch.pause(1200);
    });
    await ch.say("Gli ingredienti si gestiscono in Gestione Ingredienti: per ognuno gli allergeni e, se si può aggiungere come extra, il prezzo del supplemento.", async () => {
        await ch.goto(D('Ingredients'), 2000);
        await ch.type(page.getByPlaceholder('Cerca un ingrediente...'), 'Mozz', 1500);
        await page.getByPlaceholder('Cerca un ingrediente...').fill('');
        await ch.shot('ingredienti');
    });
    await ch.say('Modificando un ingrediente, il cambio vale per tutti i piatti che lo usano: allergeni e prezzi restano coerenti in tutto il menu.', async () => {
        await ch.click(page.locator('[title="Modifica"], button:has(svg.lucide-pencil), button:has(svg.lucide-edit)').first(), 2500);
        await ch.shot('ingrediente');
        await ch.scroll(400, 6);
    });
    await ch.finish();
});

// ───────────────────────────── 20 Sala ─────────────────────────────
test('20 La sala: tavoli in tempo reale', async ({ page }, info) => {
    const a = await freeTable();
    // Un tavolo con un giro dal QR mai accettato e una comanda del cameriere (in cucina)
    const opened = await api(`/api/tables/${a.id}/session/open`, 'POST', TOKEN, { seats: 4 });
    const cs = 'guide-sala-' + Date.now();
    await api('/api/public/sessions/join', 'POST', undefined, { tableId: a.id, code: opened.json?.accessCode, localname: SLUG, clientSessionId: cs });
    await api(`/api/public/sessions/${opened.json?.sessionId}/ready`, 'POST', undefined, { clientSessionId: cs, draftOrder: [{ products: [prod(53), prod(54)] }] });
    const sub = await api(`/api/public/sessions/${opened.json?.sessionId}/submit`, 'POST', undefined, { clientSessionId: cs });
    console.log('qr submit', opened.status, sub.status);
    await waiterOrder(a.id, 4, [prod(37, 2), prod(43), prod(51, 2)]);
    try {
        const ch = await start(page, info, 'La sala: tavoli in tempo reale', 'Tables', 3500);
        await ch.say('Gestione Sala è la piantina del locale: ogni riquadro è un tavolo, verde se libero e rosso se occupato, con i coperti. La pagina si aggiorna da sola ogni minuto e a ogni nuovo ordine.', async () => {
            await ch.point(tableCard(page, a.name), 2000);
            await ch.pointIf(page.getByText(/^libero$/i), 1500);
        });
        if (await page.getByRole('button', { name: 'Dehors', exact: true }).isVisible().catch(() => false)) {
            await ch.say("Se il locale ha più sale, come il dehors, si passa dall'una all'altra con i pulsanti in alto a destra.", async () => {
                await ch.point(page.getByRole('button', { name: 'Dehors', exact: true }), 1500);
            });
        }
        await ch.say("Su ogni tavolo quattro icone: la i per il dettaglio, la matita per modificarlo, le persone per la sessione dei clienti e il lucchetto per occuparlo o liberarlo.", async () => {
            const c = tableCard(page, a.name);
            for (const t of ['Dettagli', 'Modifica tavolo', 'Sessione gruppo']) await ch.point(c.locator(`[title="${t}"]`), 1000);
            await ch.point(c.locator('[title="Libera tavolo"], [title="Occupa tavolo"]').first(), 1000);
        });
        await ch.say(`Apriamo il dettaglio del ${a.name}: coperti, codice per i clienti, da quanto è aperto, gli ordini con il loro stato e il totale. C'è una comanda in cucina e un secondo giro dal QR ancora da accettare.`, async () => {
            await ch.click(tableCard(page, a.name).locator('[title="Dettagli"]'), 3000);
            await ch.shot('dettaglio');
            await ch.pointIf(page.getByText('Da accettare'), 1500);
        });
        await ch.say('A fine servizio si tocca Chiudi tavolo.', async () => {
            await ch.click(page.getByRole('button', { name: 'Chiudi tavolo' }).last(), 2500);
            await ch.shot('chiudi');
        });
        await ch.say("DineUp chiede conferma e avvisa: gli ordini dal QR mai accettati vengono annullati, quelli in cucina segnati come completati, e il conto resta in Cassa da incassare. Confermiamo.", async () => {
            await ch.pointIf(page.getByText(/mai stato accettato|mai stati accettati/), 2000);
            await ch.pointIf(page.getByText(/Conto non ancora incassato/), 2000);
            await ch.click(page.getByRole('button', { name: /Chiudi comunque|Chiudi tavolo/ }).last(), 2500);
        });
        await ch.say('Il tavolo torna libero. Con il più in basso a destra si aggiungono nuovi tavoli; trascinandoli si ridisegna la piantina, e con Salva si conserva la disposizione.', async () => {
            await ch.point(tableCard(page, a.name), 1500);
            await ch.point(page.locator('button.fixed, button:has(svg.lucide-plus)').last(), 2000);
        });
        await ch.finish();
    } finally {
        await cleanupTable(a.id, TOKEN, RUN_START);
    }
});

// ───────────────────────────── 21 Ordini ─────────────────────────────
test('21 Gli ordini', async ({ page }, info) => {
    const t = await freeTable();
    try {
        const ch = await start(page, info, 'Gli ordini', 'Orders', 3000);
        await ch.say('In Gestione Ordini arrivano tutte le comande in tempo reale: dai camerieri, dal QR al tavolo, da asporto e a domicilio. Ogni scheda ha la sua etichetta di stato in italiano.', async () => {
            await ch.point(page.getByText(/^Stato:/).first(), 2000);
        });
        await ch.say(`Ecco: è appena arrivato un nuovo ordine dal ${t.name}. Compare da solo in fondo all'elenco, senza ricaricare la pagina.`, async () => {
            await waiterOrder(t.id, 3, [prod(40), prod(41), prod(50, 2)]);
            await ch.pause(2500);
            await ch.scroll(4000, 12);
            await ch.pointIf(page.getByText(t.name, { exact: true }).last(), 2000);
            await ch.shot('nuovo');
            await ch.scrollTop();
        });
        await ch.say("Per gli ordini presi in sala, Preso da indica il cameriere. Per l'asporto ci sono nome, telefono e orario di ritiro.", async () => {
            await ch.point(page.getByText('Preso da:').first(), 2000);
            await ch.pointIf(page.getByText(/^Ora:|^Tel:/), 2000);
        });
        await ch.say('I filtri funzionano per stato: nuovi, in attesa, in cucina, completati e cancellati. Con Giorno si rivedono gli ordini di una data passata.', async () => {
            for (const f of ['Nuovi', 'In attesa', 'In cucina', 'Completati', 'Cancellati']) await ch.click(page.getByRole('button', { name: f, exact: true }).first(), 1200);
            await ch.click(page.getByRole('button', { name: 'Tutti', exact: true }).first(), 1000);
            await ch.point(page.locator('input[type=date]').first(), 1200);
        });
        await ch.say("L'icona della stampante ristampa la comanda. Completa la segna come servita, Cancella la annulla.", async () => {
            await ch.point(page.locator('button[title*="tampa"]').first().or(page.locator('button:has(svg.lucide-printer)').first()), 1500);
            await ch.point(page.getByRole('button', { name: 'Completa', exact: true }).first(), 1200);
            await ch.point(page.getByRole('button', { name: 'Cancella', exact: true }).first(), 1200);
        });
        await ch.say("Nei momenti di punta, Sospendi asporto blocca per un po' i nuovi ordini da asporto online: i clienti vedono che il servizio è momentaneamente sospeso.", async () => {
            await ch.point(page.getByRole('button', { name: /Sospendi asporto/ }), 2500);
        });
        await ch.finish();
    } finally {
        await cleanupTable(t.id, TOKEN, RUN_START);
    }
});

// ───────────────────────────── 22 Cassa: chiudere un conto ─────────────────────────────
test('22 La cassa: chiudere un conto', async ({ page }, info) => {
    const t = await freeTable();
    const ids = await waiterOrder(t.id, 2, [prod(35), prod(38), prod(42), prod(51, 2), prod(52)]);
    for (const id of ids) await api('/api/orders/changeStatus', 'POST', TOKEN, { comandId: id, status: 'COMPLETED' });
    const cards = await api('/api/cards/getall', 'GET', TOKEN);
    const anna = ((cards.json?.data ?? []) as any[]).find(c => c.holderName === 'Anna Rossi');
    try {
        const ch = await start(page, info, 'La cassa: chiudere un conto', 'Cassa', 3000);
        await ch.say('In Cassa si chiudono i conti. Le schede mostrano gli ordini da incassare: tavoli, asporto e domicilio, con il totale. Si possono filtrare per tipo.', async () => {
            await ch.click(page.getByRole('button', { name: /^Tavoli \(/ }).first(), 1500);
            await ch.click(page.getByRole('button', { name: /^Tutti \(/ }).first(), 1500);
        });
        await ch.say(`Il ${t.name} ha finito di mangiare: il suo ordine è servito e da incassare. Lo apriamo.`, async () => {
            const cardT = page.getByText(t.name, { exact: true }).locator('xpath=ancestor::*[contains(@class,"rounded")][1]').last();
            await ch.click(page.getByText(t.name, { exact: true }).last(), 2500);
            await ch.shot('conto');
        });
        await ch.say('A destra il dettaglio del conto: ogni piatto con quantità e prezzo, modificabili. Con Aggiungi articolo si mette in conto al volo un altro prodotto, per esempio un caffè.', async () => {
            await ch.point(page.getByText(/Aggiungi articolo/).first(), 2500);
        });
        await ch.say('Il cliente ha la tessera fedeltà: si tocca Collega tessera fedeltà e si scrive il codice, oppure si inquadra il QR con la fotocamera.', async () => {
            await ch.click(page.getByText('Collega tessera fedeltà'), 1200);
            await ch.type(page.getByPlaceholder('Codice tessera'), anna.code, 500);
            await ch.click(page.getByRole('button', { name: 'Cerca', exact: true }), 2200);
            await ch.shot('tessera');
        });
        await ch.say('Compare il saldo punti: il cliente può usarli come sconto, oppure accumulare i punti di questo conto.', async () => {
            await ch.pointIf(page.getByText(/punti/i), 2500);
        });
        await ch.say('Lo sconto si applica in percentuale, con i pulsanti rapidi, oppure fissando il prezzo finale. Il totale si aggiorna subito.', async () => {
            await ch.click(page.getByRole('button', { name: '10%', exact: true }), 1500);
            await ch.point(page.getByRole('button', { name: 'Prezzo finale' }), 1200);
            await ch.point(page.getByText('Totale', { exact: true }).last(), 1500);
        });
        await ch.say('Si indica come ha pagato, contanti, carta o altro, e si tocca Chiudi conto: l\'incasso viene registrato e i punti finiscono sulla tessera.', async () => {
            await ch.click(page.getByRole('button', { name: 'Carta', exact: true }), 1200);
            await ch.click(page.getByRole('button', { name: 'Chiudi conto' }).last(), 3000);
            await ch.shot('chiuso');
        });
        await ch.finish();
    } finally {
        await cleanupTable(t.id, TOKEN, Date.now() + 120_000); // il conto chiuso resta nello storico
    }
});

// ───────────────────────────── 23 Cassa: storico e pagamenti online ─────────────────────────────
test('23 La cassa: storico, annulli e rimborsi', async ({ page }, info) => {
    // Sul demo non ci sono pagamenti pre-autorizzati: se ne mostra uno (solo interfaccia) per spiegare "Annulla pagamento".
    await page.route('**/api/payments?**', async route => {
        const res = await route.fetch();
        const body = await res.json().catch(() => null);
        if (body && Array.isArray(body.data)) {
            const now = new Date();
            const iso = new Date(now.getTime() - 25 * 60000).toISOString();
            body.data.unshift({ id: 990001, idAgency: 3, idTable: null, comandId: '6b0demo00000000000000001', amountCents: 3850, currency: 'eur',
                refundedCents: null, provider: 'STRIPE', capturedUpfront: false, approvalRequired: true, status: 'AUTHORIZED', createdAt: iso, updatedAt: iso });
        }
        await route.fulfill({ response: res, json: body });
    });
    const ch = await start(page, info, 'La cassa: storico, annulli e rimborsi', 'Cassa', 2500);
    await ch.say('Nella scheda Storico ci sono tutti gli incassi degli ultimi giorni: i conti chiusi in cassa e i pagamenti online fatti dai clienti con la carta.', async () => {
        await ch.click(page.getByRole('button', { name: 'Storico' }), 3000);
        await ch.shot('storico');
    });
    await ch.say('In alto gli incassi di oggi e i totali del periodo. I filtri separano completati, in attesa, falliti e rimborsati.', async () => {
        await ch.point(page.getByText('Incassi Oggi').first(), 1500);
        await ch.click(page.getByRole('button', { name: /^Completati \(/ }).first(), 1300);
        await ch.click(page.getByRole('button', { name: /^Rimborsati \(/ }).first(), 1300);
        await ch.click(page.getByRole('button', { name: /^Tutti \(/ }).last(), 1500);
        await ch.shot('tutti');
    });
    await ch.say("Un pagamento online solo autorizzato, per esempio un ordine su richiesta non ancora confermato, si può annullare con la X: l'importo viene sbloccato e non ci sono commissioni.", async () => {
        await ch.click(page.getByRole('button', { name: 'Annulla pagamento' }).first(), 2500);
        await ch.shot('annulla');
    });
    await ch.say('Il riquadro chiede conferma. Torniamo indietro senza annullare.', async () => {
        await ch.click(page.getByRole('button', { name: 'Indietro' }), 1500);
    });
    await ch.say("Un pagamento già incassato invece si rimborsa con la freccia: si sceglie l'importo, anche solo una parte. DineUp avvisa che la commissione del circuito non viene restituita.", async () => {
        await ch.click(page.getByRole('button', { name: 'Rimborsa' }).nth(1), 2500);
        await ch.shot('rimborsa0');
        await ch.point(page.getByText(/Importo da rimborsare/).first(), 1500);
        await ch.point(page.getByText(/commissione non viene restituita/i).first(), 2000);
        await ch.shot('rimborsa');
    });
    await ch.say('Anche qui tocchiamo Indietro: nessun rimborso viene fatto finché non si conferma.', async () => {
        await ch.click(page.getByRole('button', { name: 'Indietro' }), 1500);
    });
    await ch.finish();
});

// ───────────────────────────── 24 Prenotazioni ─────────────────────────────
test('24 Le prenotazioni', async ({ page }, info) => {
    // Pulizia delle prove precedenti: una sola Chiara Lombardi (dal capitolo 2) e nessun Davide Bonetti
    const all = await api('/api/reservations', 'GET', TOKEN);
    const rows: any[] = (all.json?.data ?? all.json ?? []).sort((a: any, b: any) => (b.id ?? 0) - (a.id ?? 0));
    let keptChiara = false;
    for (const r of rows) {
        if (r.customerName === 'Davide Bonetti' || (r.customerName === 'Chiara Lombardi' && keptChiara)) await api(`/api/reservations/${r.id}`, 'DELETE', TOKEN);
        else if (r.customerName === 'Chiara Lombardi') keptChiara = true;
    }
    // Una richiesta dal sito in attesa di conferma
    const day = new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10);
    await api(`/api/public/reservations/${SLUG}`, 'POST', undefined, { customerName: 'Davide Bonetti', customerPhone: '+39 340 771 2290', partySize: 3, reservationDate: day, reservationTime: '20:00:00', specialRequests: 'Un ospite celiaco' });
    const ch = await start(page, info, 'Le prenotazioni', 'Reservations', 2500);
    await ch.say('In Prenotazioni arrivano le richieste fatte dal sito del locale e quelle inserite dallo staff. In alto i contatori: totali, in attesa, confermate, arrivati e annullate.', async () => {
        for (const t of ['IN ATTESA', 'CONFERMATE', 'ARRIVATI']) await ch.pointIf(page.getByText(new RegExp('^' + t + '$', 'i')), 1000);
    });
    await ch.say('Toccando un contatore si filtra la lista. Ecco la richiesta di Davide Bonetti, arrivata dal sito: in attesa di conferma.', async () => {
        await ch.click(page.getByText(/^in attesa$/i).first(), 2000);
        await ch.pointIf(page.getByText('Davide Bonetti'), 1500);
    });
    await ch.say('Con Conferma la si accetta, con Rifiuta la si declina. Quando il cliente si siede, Segna arrivato; se non si presenta, Non presentato.', async () => {
        const row = page.locator('div').filter({ hasText: 'Davide Bonetti' }).filter({ has: page.getByRole('button', { name: /Conferma/ }) }).last();
        await ch.click(row.getByRole('button', { name: /Conferma/ }).first(), 2000);
        await ch.click(page.getByText(/^totali$/i).first(), 1500);
        await ch.point(page.getByRole('button', { name: /Segna arrivato/ }).first(), 1200);
        await ch.point(page.getByRole('button', { name: /Non presentato/ }).first(), 1200);
    });
    await ch.say('La vista Calendario mostra il mese, con il numero di prenotazioni di ogni giorno; toccando un giorno si vedono quelle della data.', async () => {
        await ch.click(page.getByRole('button', { name: /Calendario/ }), 2500);
        await ch.shot('calendario');
        await ch.click(page.getByRole('button', { name: /Lista/ }), 1500);
    });
    await ch.say('Per una telefonata si usa Nuova prenotazione: nome, telefono, data, ora, persone e note. Così il locale ha tutto in un unico posto.', async () => {
        await ch.click(page.getByRole('button', { name: /Nuova prenotazione/ }), 2000);
        await ch.shot('nuova');
    });
    await ch.say('Chiudiamo il modulo: la lista si aggiorna da sola quando arriva una nuova richiesta.', async () => {
        await ch.click(page.getByLabel('Chiudi').last(), 1500);
    });
    await ch.finish();
});

// ───────────────────────────── 25 Slot asporto ─────────────────────────────
test("25 L'asporto: orari e capienza", async ({ page }, info) => {
    const ch = await chapter(page, info, PART, "L'asporto: orari e capienza");
    await prepareContext(page.context(), TOKEN);
    await ch.goto(D('Home'), 2000);
    ch.begin();
    await ch.say("Le impostazioni dell'asporto sono nel menu Altro, alla voce Slot Asporto.", async () => {
        await more(ch, page, 'Slot Asporto');
    });
    await ch.say('Qui si decide la durata di ogni fascia di ritiro e quanti ordini e prodotti si possono preparare in ciascuna. Il cliente vede solo gli orari ancora liberi.', async () => {
        await ch.pause(1500);
        await ch.shot('slot');
        await ch.scroll(300, 6);
    });
    await ch.say('Negli orari settimanali si impostano i giorni e le fasce di apertura, per esempio pranzo e cena, e il giorno di chiusura.', async () => {
        await ch.point(page.getByText('Orari settimanali').first(), 2000);
        await ch.scroll(400, 6);
    });
    await ch.say('Sotto si aggiungono chiusure straordinarie e periodi di ferie: in quei giorni l\'asporto non è prenotabile.', async () => {
        await ch.point(page.getByText('Chiusure straordinarie').first(), 1500);
        await ch.point(page.getByText('Ferie e periodi di chiusura').first(), 1500);
        await ch.scroll(450, 6);
    });
    await ch.say('In Slot del giorno si vede l\'occupazione di ogni fascia. Si può chiudere uno slot pieno, riaprirlo, o aggiungere un ordine preso al telefono.', async () => {
        await ch.point(page.getByText('Slot del giorno').first(), 1500);
        await ch.pointIf(page.locator('[title="Chiudi slot (slot pieno manualmente)"]'), 1500);
        await ch.pointIf(page.locator('[title="Aggiungi ordine manuale (telefonico)"]'), 1500);
        await ch.shot('giorno');
    });
    await ch.say("E nei momenti di punta, in cima alla pagina, si sospende l'asporto per trenta minuti, un'ora, due ore o finché non lo si riprende.", async () => {
        await ch.scrollTop();
        await ch.point(page.locator('select').filter({ hasText: 'Per 30 minuti' }).first(), 1500);
        await ch.point(page.getByRole('button', { name: /Sospendi asporto/ }).first(), 1500);
    });
    await ch.finish();
});

// ───────────────────────────── 26 Domicilio: impostazioni ─────────────────────────────
test('26 La consegna a domicilio: impostazioni', async ({ page }, info) => {
    const ch = await start(page, info, 'La consegna a domicilio: impostazioni', 'Delivery', 3000);
    await ch.say('In Altro, Domicilio, si attiva la consegna a casa. Con l\'interruttore in alto i clienti vedono o no la voce Consegna a domicilio nel menu.', async () => {
        await ch.point(page.getByText('Consegna a domicilio attiva').first(), 1500);
        await ch.point(page.getByRole('switch').first().or(page.locator('button[role=switch]').first()), 1500);
    });
    await ch.say('Il punto di partenza è il locale: si cerca l\'indirizzo o si sposta il segnaposto sulla mappa. I cerchi colorati sono le zone di consegna.', async () => {
        await ch.point(page.getByRole('button', { name: 'Cerca', exact: true }).first(), 1200);
        await ch.point(page.locator('.leaflet-container').first(), 2500);
    });
    await ch.say('Per ogni zona si indica fino a quanti chilometri arriva, la tariffa e l\'ordine minimo. Si possono aggiungere altre zone, e fissare la soglia oltre la quale la consegna è gratis.', async () => {
        await ch.point(page.getByText('Zona 1').first(), 1200);
        await ch.point(page.getByText('Zona 2').first(), 1200);
        await ch.point(page.getByRole('button', { name: /Aggiungi zona/ }), 1200);
        await ch.point(page.getByText('Consegna gratis sopra').first(), 1500);
    });
    await ch.say('Nel pagamento si sceglie se il cliente paga online, alla consegna, o decide lui; e cosa accetta il rider alla porta: contanti, POS o entrambi.', async () => {
        await ch.scroll(560, 8);
        await ch.point(page.getByText('A scelta del cliente').first(), 1500);
        await ch.point(page.getByText('Alla consegna il rider accetta').first(), 1500);
    });
    await ch.say('Nelle fasce orarie si decide la durata, quante consegne per fascia e il preavviso minimo. Le consegne hanno una capienza separata da quella dell\'asporto.', async () => {
        await ch.point(page.getByText('Fasce orarie').first(), 1500);
        await ch.point(page.getByText('Consegne / fascia').first(), 1500);
    });
    await ch.say('Più in basso la verifica del telefono via SMS, utile contro gli ordini falsi, e il calcolo del percorso dei rider. Alla fine, Salva impostazioni.', async () => {
        await ch.scroll(600, 8);
        await ch.point(page.getByText('Verifica del telefono').first(), 1500);
        await ch.point(page.getByText('Percorso dei rider').first(), 1500);
        await ch.scrollTop();
        await ch.point(page.getByRole('button', { name: /Salva impostazioni/ }), 1500);
    });
    await ch.finish();
});

// ───────────────────────────── 27 Consegne e rider ─────────────────────────────
test('27 Le consegne e i rider', async ({ page }, info) => {
    // Una consegna nostra da far partire e consegnare durante il capitolo
    const phone = '+393479012233';
    await api('/api/public/otp/send', 'POST', undefined, { localname: SLUG, phone });
    const v = await api('/api/public/otp/verify', 'POST', undefined, { localname: SLUG, phone, code: '123456' });
    const phoneToken = v.json?.phoneToken ?? v.json?.data?.phoneToken;
    const today = new Date().toISOString().slice(0, 10);
    const slots = await api(`/api/public/delivery/${SLUG}/slots/${today}`);
    const avail = ((slots.json?.data ?? slots.json ?? []) as any[]).filter(s => s.status === 'AVAILABLE');
    let ord: any = null;
    for (const sl of avail.slice(2)) {
        ord = await api(`/api/public/orders/delivery/${SLUG}`, 'POST', undefined, {
            customerName: 'Elisa Marchetti', customerPhone: phone, phoneToken,
            address: { label: 'Via Trieste 17, Brescia', lat: 45.5378614, lng: 10.2242813, street: 'Via Trieste', houseNumber: '17', city: 'Brescia', postcode: '25121', intercom: 'Marchetti', floor: '3° piano' },
            deliveryTime: `${today}T${sl.time}`, paymentChoice: 'CASH',
            orders: [{ products: [prod(45, 2), prod(49, 2), prod(54)] }],
        });
        if (ord.status === 200) break;
    }
    const id = ord.json?.id ?? ord.json?.data?.id;
    console.log('consegna demo', ord.status, (ord.text ?? '').slice(0, 200), v.status, slots.status);
    if (id) await api('/api/orders/changeStatus', 'POST', TOKEN, { comandId: id, status: 'PROGRESS' });
    try {
        const ch = await start(page, info, 'Le consegne e i rider', 'Consegne', 3000);
        await ch.say('La pagina Consegne è quella del rider, ma la vede anche il titolare. In alto le consegne di oggi, divise in da preparare, in consegna e consegnate.', async () => {
            await ch.point(page.getByText('Consegne di oggi').first(), 1500);
            await ch.shot('lista');
        });
        await ch.say("Ogni consegna mostra l'orario, il cliente con il telefono da chiamare, l'indirizzo con citofono e piano, i piatti e quanto incassare alla porta.", async () => {
            await ch.pointIf(page.getByText('Elisa Marchetti'), 2000);
            await ch.pointIf(page.getByText(/Da incassare/), 1800);
        });
        await ch.say('Naviga apre il percorso nel navigatore, Chiama telefona al cliente. Se nelle impostazioni è attivo il percorso dei rider, Avvia giro mette in ordine tutte le consegne.', async () => {
            const card = page.locator('article').filter({ hasText: 'Elisa Marchetti' }).first();
            await ch.pointIf(card.getByRole('link', { name: 'Naviga' }), 1500);
            await ch.pointIf(card.getByRole('link', { name: 'Chiama' }), 1500);
        });
        await ch.say('Quando parte, il rider tocca Parto: il cliente vede subito che la cena è in consegna.', async () => {
            const card = page.locator('article').filter({ hasText: 'Elisa Marchetti' }).first();
            await ch.click(card.getByRole('button', { name: /Parto/ }), 2500);
            await ch.click(page.getByRole('tab', { name: /^In consegna/ }).first(), 2000);
        });
        await ch.say('Alla porta tocca Consegnato e segna i contanti incassati. La consegna passa tra le consegnate, e in cassa risulta già incassata.', async () => {
            const card = page.locator('article').filter({ hasText: 'Elisa Marchetti' }).first();
            const cash = card.getByText(/^Incassato/).first();
            if (await cash.isVisible().catch(() => false)) await ch.click(cash, 1200);
            await ch.click(card.getByRole('button', { name: /Consegnato/ }), 2000);
            await ch.click(page.getByRole('tab', { name: /^Consegnate/ }).first(), 2000);
            await ch.shot('consegnate');
        });
        await ch.say('Per avere un rider nel locale basta invitarlo dalla pagina dello staff: vede solo questa pagina, dal telefono o dall\'app DineUp Sala.', async () => {
            await ch.pause(1500);
        });
        await ch.finish();
    } finally {
        if (id) await api('/api/orders/changeStatus', 'POST', TOKEN, { comandId: id, status: 'DELETED' });
    }
});

// ───────────────────────────── 28 Template e aspetto ─────────────────────────────
test("28 L'aspetto del menu: template e ritocchi", async ({ page }, info) => {
    const ch = await chapter(page, info, PART, "L'aspetto del menu: template e ritocchi");
    await prepareContext(page.context(), TOKEN);
    await ch.goto(D('Home'), 2000);
    ch.begin();
    await ch.say("L'aspetto del menu si cambia da Altro, Template: si apre Personalizza Aspetto, con l'anteprima dal vivo del telefono a destra.", async () => {
        await more(ch, page, 'Template');
        await ch.point(page.locator('iframe').first(), 1500);
    });
    await ch.say('Nella scheda Template c\'è la libreria: modelli pronti per ogni tipo di locale, da trattoria a sushi, pizzeria, bistrot o cocktail bar. Si filtrano per tipo di locale.', async () => {
        await ch.click(page.getByRole('button', { name: 'Template', exact: true }).first(), 2500);
        await ch.shot('libreria');
        await ch.point(page.getByLabel('Filtra per tipo di locale').first(), 1500);
    });
    await ch.say("Toccando un template, l'anteprima a destra cambia subito: proviamo Fine dining, scuro ed elegante. Niente è pubblicato finché non si salva.", async () => {
        await ch.click(page.getByRole('button', { name: /^Fine dining Fine dining/ }).first(), 3500);
        await ch.shot('finedining');
    });
    await ch.say("Torniamo al Classico, quello in uso. L'opzione Usa anche colori e font del template decide se tenere i propri colori o prendere quelli del modello.", async () => {
        await ch.click(page.getByRole('button', { name: /^Classico/ }).first(), 2500);
        await ch.pointIf(page.getByText('Usa anche colori e font del template'), 1500);
    });
    await ch.say('Con i Ritocchi del template si cambiano i dettagli senza perdere lo stile: abbinamento di font, aspetto dei piatti, la pagina e la forma degli angoli di foto e pulsanti.', async () => {
        await ch.pointIf(page.getByText('Ritocchi del template'), 1500);
        for (const t of ['Abbinamento di font', 'Piatti', 'Pagina', 'Forme']) await ch.pointIf(page.getByText(t, { exact: true }), 1000);
    });
    await ch.say("Nella scheda Colori si scelgono i colori principali, in Contenuti nome, descrizione, indirizzo, orari e social del locale.", async () => {
        await ch.click(page.getByRole('button', { name: 'Colori', exact: true }), 2000);
        await ch.click(page.getByRole('button', { name: 'Contenuti', exact: true }), 2000);
    });
    await ch.say("L'anteprima si guarda da telefono o da computer. Quando il risultato piace, Salva Modifiche lo pubblica per tutti i clienti.", async () => {
        await ch.click(page.getByTitle('Desktop'), 2200);
        await ch.click(page.getByTitle('Mobile'), 1500);
        await ch.point(page.getByRole('button', { name: /Salva Modifiche/ }), 1500);
    });
    await ch.finish();
});

// ───────────────────────────── 29 Menu in PDF ─────────────────────────────
test('29 Il menu in PDF', async ({ page }, info) => {
    const ch = await start(page, info, 'Il menu in PDF', 'Layout', 3000);
    await ch.say('Oltre al menu digitale, DineUp prepara anche il menu da stampare. In Personalizza Aspetto, scheda Template, c\'è il riquadro Menu stampabile.', async () => {
        await ch.click(page.getByRole('button', { name: 'Template', exact: true }).first(), 2000);
        await ch.point(page.getByText('Menu stampabile').first(), 1500);
    });
    await ch.say('Si tocca Scarica menu in PDF: si apre la finestra con l\'anteprima di tutto il menu in formato A4.', async () => {
        await ch.click(page.getByRole('button', { name: /Scarica menu in PDF/ }).first(), 3500);
        await ch.shot('dialog');
    });
    await ch.say('A sinistra si sceglie il template: lo stesso stile del menu digitale oppure un altro, per esempio più elegante per la sala.', async () => {
        const sel = page.getByLabel(/^Template/).first();
        if (await sel.isVisible().catch(() => false) && await sel.evaluate(e => e.tagName === 'SELECT')) {
            await ch.point(sel, 800);
            const opts = await sel.locator('option').allTextContents();
            const pick = opts.find(o => /Fine dining|Trattoria|Minimal/.test(o));
            if (pick) await sel.selectOption({ label: pick });
            await ch.pause(3000);
        } else {
            await ch.pointIf(page.getByText('Template', { exact: true }).last(), 1500);
        }
        await ch.shot('template');
    });
    await ch.say('Poi la lingua del menu, se mostrare gli allergeni, se includere i piatti esauriti con la loro etichetta e se stampare le foto dei piatti.', async () => {
        await ch.pointIf(page.getByText('Lingua', { exact: true }), 1200);
        await ch.pointIf(page.getByText('Allergeni', { exact: true }), 1200);
        await ch.pointIf(page.getByText('Includi i piatti esauriti'), 1200);
        await ch.pointIf(page.getByText('Foto dei piatti'), 1200);
    });
    await ch.say("L'anteprima a destra mostra le pagine come verranno stampate. Con Scarica PDF si ottiene il file da stampare o da mandare in tipografia.", async () => {
        await ch.point(page.getByTitle('Anteprima del menu in PDF'), 800);
        for (let i = 0; i < 10; i++) { await page.mouse.wheel(0, 140); await ch.pause(180); }
        await ch.pause(1200);
        await ch.point(page.getByRole('button', { name: /Scarica PDF/ }).last(), 1500);
    });
    await ch.say('Chiudiamo la finestra: il menu stampato resta sempre allineato a quello digitale, con gli stessi piatti e gli stessi prezzi.', async () => {
        await ch.click(page.getByRole('button', { name: 'Chiudi', exact: true }).last(), 1500);
    });
    await ch.finish();
});

// ───────────────────────────── 30 Sito del locale ─────────────────────────────
test('30 Il sito del locale', async ({ page }, info) => {
    const ch = await start(page, info, 'Il sito del locale', 'Layout', 3000);
    await ch.say('Ogni locale ha anche un sito vetrina, la pagina pubblica con il menu, le prenotazioni e i contatti. Si costruisce nella scheda Sezioni di Personalizza Aspetto.', async () => {
        await ch.point(page.getByRole('button', { name: 'Sezioni', exact: true }).first(), 1500);
        await ch.pointIf(page.getByText('Attiva il sito a sezioni'), 1500);
    });
    await ch.say("L'elenco mostra le sezioni della pagina, dall'alto in basso: intestazione, striscia delle categorie, punti di forza, menu, contatti e prenotazioni.", async () => {
        await ch.point(page.getByText('Intestazione (hero)').first(), 1500);
        await ch.point(page.getByText('Punti di forza').first(), 1200);
        await ch.point(page.getByText('Contatti e social').first(), 1200);
    });
    await ch.say("Con l'occhio si nasconde una sezione, con le frecce si sposta, e si può duplicare o eliminare.", async () => {
        await ch.point(page.getByLabel('Duplica sezione').first(), 1200);
        await ch.point(page.getByLabel('Elimina sezione').first(), 1200);
    });
    await ch.say('Toccando una sezione la si modifica: per esempio il titolo e i pulsanti dell\'intestazione. L\'anteprima si aggiorna mentre si scrive.', async () => {
        await ch.click(page.getByText('Intestazione (hero)').first(), 2500);
        await ch.shot('hero');
        await ch.scroll(300, 5, page.locator('aside, .overflow-y-auto').first());
    });
    await ch.say('Con Aggiungi sezione si inseriscono nuovi blocchi: galleria di foto, recensioni, chi siamo, orari, mappa e altri ancora.', async () => {
        await page.keyboard.press('Escape');
        await ch.pause(600);
        await ch.click(page.getByText(/Aggiungi sezione/).first(), 2500);
        await ch.shot('aggiungi');
    });
    await ch.say('Con Desktop si controlla la pagina sullo schermo grande, e con Apri la si vede come i clienti. Salva Modifiche pubblica tutto.', async () => {
        await ch.click(page.getByLabel('Chiudi').last(), 1200);
        await ch.scrollTop();
        await ch.click(page.getByTitle('Desktop'), 2500);
        await ch.point(page.getByTitle('Apri il sito pubblico in una nuova scheda'), 1500);
        await ch.click(page.getByTitle('Mobile'), 1200);
    });
    await ch.finish();
});

// ───────────────────────────── 31 Lingue e QR ─────────────────────────────
test('31 Lingue del menu e QR code', async ({ page }, info) => {
    const ch = await start(page, info, 'Lingue del menu e QR code', 'Languages', 3000);
    await ch.say('In Lingue del menu si scelgono, con un tocco, le lingue offerte ai clienti: inglese, tedesco, francese, spagnolo e altre. Il cliente cambia lingua direttamente dal menu.', async () => {
        await ch.point(page.getByText('Lingue offerte ai clienti').first(), 1500);
        for (const l of ['Inglese', 'Tedesco', 'Francese', 'Spagnolo']) await ch.pointIf(page.getByRole('button', { name: l, exact: true }), 700);
        await ch.shot('lingue');
    });
    await ch.say('Con la traduzione automatica attiva, nomi e descrizioni dei piatti vengono tradotti da soli, anche ogni notte per i piatti nuovi. Altrimenti le traduzioni si scrivono a mano.', async () => {
        await ch.pointIf(page.getByText(/Traduci ogni notte/), 2000);
    });
    await ch.say("Nella pagina QR code c'è un codice per ogni tavolo, pronto da stampare e appoggiare sul tavolo. Ognuno apre il menu già collegato al suo tavolo.", async () => {
        await ch.goto(D('QRCode'), 2500);
        await ch.shot('qr');
    });
    await ch.say('Basta stampare la pagina: ogni QR riporta il nome del tavolo. Se si aggiunge un tavolo in sala, il suo QR compare qui da solo.', async () => {
        await ch.scroll(400, 6);
        await ch.pause(1000);
    });
    await ch.finish();
});

// ───────────────────────────── 32 Tessere fedeltà ─────────────────────────────
test('32 Le tessere fedeltà', async ({ page }, info) => {
    const ch = await chapter(page, info, PART, 'Le tessere fedeltà');
    await prepareContext(page.context(), TOKEN);
    await ch.goto(D('Home'), 2000);
    ch.begin();
    const closeDialog = async (names: RegExp) => {
        await page.keyboard.press('Escape');
        await ch.pause(400);
        const x = page.getByRole('button', { name: names }).filter({ visible: true }).first();
        if (await x.isVisible().catch(() => false)) await ch.click(x, 1000);
    };
    await ch.say('Le tessere fedeltà sono in Altro, Tessere fedeltà. In alto le regole: qui a punti, un punto per ogni euro speso.', async () => {
        await more(ch, page, 'Tessere fedeltà');
        await ch.point(page.getByText('Regole tessere').first(), 1500);
    });
    await ch.say('Con Modifica si sceglie come funziona la tessera: a visite, a punti o a scelta ogni volta, quanto vale un punto quando si usa in cassa e se i saldi scadono.', async () => {
        await ch.click(page.getByText('Modifica', { exact: true }).first(), 2500);
        await ch.shot('regole');
        await ch.point(page.getByText('A punti', { exact: true }).first(), 1500);
        await ch.pointIf(page.getByText(/Valore di 1 punto/), 1500);
        await ch.pointIf(page.getByText('Scadenza dei saldi'), 1500);
    });
    await ch.say('I numeri riassumono il programma: tessere emesse, attive negli ultimi trenta giorni, punti in circolo e quanto hanno speso i tesserati.', async () => {
        await ch.click(page.getByText('Chiudi', { exact: true }).first(), 1200);
        for (const t of ['Tessere emesse', 'Attive (30 giorni)', 'Punti in circolo', 'Speso dai tesserati']) await ch.pointIf(page.getByText(t, { exact: true }), 900);
    });
    await ch.say('Nella lista si cerca per codice, nome o contatto, e si filtra per premio pronto o tessere inattive da novanta giorni.', async () => {
        await ch.type(page.getByPlaceholder(/Cerca per codice/), 'Anna', 1500);
        await page.getByPlaceholder(/Cerca per codice/).fill('');
        await ch.click(page.getByRole('button', { name: /Premio pronto/ }), 1200);
        await ch.click(page.getByRole('button', { name: /^Tutte/ }), 1200);
    });
    await ch.say('Aprendo una tessera si vedono saldo, visite, spesa e storico. Qui si caricano punti a mano, si aggiornano i dati del titolare e si consegna la tessera: per email, con il QR o con il link.', async () => {
        await ch.click(page.getByText('Anna Rossi', { exact: true }).first(), 2500);
        await ch.shot('dettaglio');
        await ch.pointIf(page.getByRole('button', { name: 'Aggiungi', exact: true }), 1200);
        await ch.pointIf(page.getByText('Consegna al cliente'), 1200);
        await ch.pointIf(page.getByText('Scarica QR'), 1200);
    });
    await ch.say('Nuova tessera ne crea una in pochi secondi: nome del cliente, telefono o email e una nota. Poi si consegna il QR da salvare sul telefono.', async () => {
        await closeDialog(/^Chiudi$/);
        await ch.click(page.getByRole('button', { name: /Nuova tessera/ }), 2500);
        await ch.shot('nuova');
        await ch.pointIf(page.getByPlaceholder('Nome e cognome'), 1200);
        await ch.pointIf(page.getByRole('button', { name: 'Crea tessera' }), 1200);
    });
    await ch.say('Chiudiamo senza creare nulla: le tessere si usano poi in Cassa, al momento del conto.', async () => {
        await closeDialog(/^Annulla$/);
    });
    await ch.finish();
});

// ───────────────────────────── 33 Staff ─────────────────────────────
test('33 Lo staff: camerieri e rider', async ({ page }, info) => {
    const ch = await chapter(page, info, PART, 'Lo staff: camerieri e rider');
    await prepareContext(page.context(), TOKEN);
    await ch.goto(D('Home'), 2000);
    ch.begin();
    await ch.say('Lo staff si gestisce in Altro, Camerieri. Qui ci sono le persone che lavorano nel locale, con il loro ruolo: cameriere o rider.', async () => {
        await more(ch, page, 'Camerieri');
        await ch.point(page.getByText('Cameriere', { exact: true }).first(), 1500);
        await ch.pointIf(page.getByText('Rider', { exact: true }), 1500);
    });
    await ch.say('Per aggiungere un cameriere si tocca Aggiungi Cameriere: DineUp mostra un link di invito da mandargli, per esempio su WhatsApp.', async () => {
        await ch.click(page.getByRole('button', { name: /Aggiungi Cameriere/ }), 2500);
        await ch.shot('invito');
    });
    await ch.say("Il cameriere apre il link, o inquadra il QR, e crea il suo account. Il titolare poi lo approva da questa pagina, e da quel momento può accedere.", async () => {
        await ch.point(page.getByText(/urlInvite/).first(), 2000);
    });
    await ch.say('Invita rider funziona allo stesso modo, ma il rider vede solo la pagina Consegne, con le consegne del giorno.', async () => {
        await ch.click(page.getByLabel('Chiudi').last(), 1200);
        await ch.click(page.getByRole('button', { name: /Invita rider/ }), 2500);
        await ch.shot('rider');
    });
    await ch.say('Con la matita si modifica una persona, con il cestino la si rimuove. E in Report camerieri si vede il lavoro di ognuno: ordini presi e incassi.', async () => {
        await ch.click(page.getByLabel('Chiudi').last(), 1200);
        await more(ch, page, 'Report Camerieri');
        await ch.shot('report');
    });
    await ch.finish();
});

// ───────────────────────────── 34 Stampanti ─────────────────────────────
test('34 Le stampanti delle comande', async ({ page }, info) => {
    const ch = await start(page, info, 'Le stampanti delle comande', 'Printers', 3000);
    await ch.say('In Stampanti si collegano le stampanti termiche di cucina, pizzeria e bar: ogni nuovo ordine esce stampato in automatico, senza toccare niente.', async () => {
        await ch.shot('lista');
        await ch.pause(1500);
    });
    await ch.say('Si aggiunge una stampante scegliendo il tipo: stampante di rete Star CloudPRNT, oppure un tablet Android con l\'app RawBT collegata via Bluetooth.', async () => {
        await ch.click(page.getByRole('button', { name: /Aggiungi|Nuova stampante/ }).first(), 2500);
        await ch.shot('nuova');
        await ch.pointIf(page.getByText('Tipo di stampante'), 1500);
    });
    await ch.say('Si dà un nome, la larghezza della carta, il numero di copie, e soprattutto quali categorie stampare: per esempio le pizze in pizzeria e le bevande al bar.', async () => {
        await ch.pointIf(page.getByText('Larghezza carta'), 1200);
        await ch.pointIf(page.getByText('Copie', { exact: true }), 1200);
        await ch.pointIf(page.getByText('Categorie da stampare'), 1800);
    });
    await ch.say('In Quando stampare si decide se stampare all\'arrivo dell\'ordine o quando viene accettato. Chiudiamo senza salvare.', async () => {
        await ch.pointIf(page.getByText('Quando stampare'), 1500);
        await ch.click(page.getByRole('button', { name: 'Annulla', exact: true }).last(), 1500);
    });
    await ch.finish();
});

// ───────────────────────────── 35 Analytics ─────────────────────────────
test('35 Analytics e riepiloghi automatici', async ({ page }, info) => {
    const ch = await start(page, info, 'Analytics e riepiloghi automatici', 'Analytics', 4000);
    await ch.say('Analytics riassume gli ultimi sette giorni: incassato, sconti concessi, ordini attivi e prodotti a menu.', async () => {
        await ch.point(page.getByText('Incassato (7 giorni)').first(), 1500);
        await ch.point(page.getByText(/Sconti concessi/).first(), 1200);
    });
    await ch.say("I grafici mostrano l'incasso e gli ordini giorno per giorno, per vedere subito i giorni migliori.", async () => {
        await ch.point(page.getByText(/Incassato \(€\)/).first(), 1500);
        await ch.point(page.getByText(/Ordini — ultimi 7 giorni/).first(), 1500);
    });
    await ch.say('La settimana e Consigli sul menu sono riepiloghi scritti in automatico da AxiomAI: com\'è andata la settimana e quali piatti spingere o rivedere. Se non sono pronti, Genera ora li prepara subito.', async () => {
        await ch.scroll(380, 6);
        await ch.point(page.getByText('La settimana', { exact: false }).first(), 1500);
        const gen = page.getByRole('button', { name: /Genera ora/ }).first();
        if (await gen.isVisible().catch(() => false)) await ch.click(gen, 6000);
        await ch.shot('ai');
    });
    await ch.say('Più in basso la classifica dei piatti più venduti, con quantità e incasso, e quanti prodotti ci sono in ogni categoria.', async () => {
        await ch.scroll(450, 8);
        await ch.point(page.getByText(/Più venduti/).first(), 2000);
    });
    await ch.say('Con DineUp il titolare ha tutto il ristorante in un unico posto: menu, sala, ordini, cassa, consegne e clienti. Buon lavoro!', async () => {
        await ch.click(nav(page, 'Home'), 3000);
    });
    await ch.finish();
});
