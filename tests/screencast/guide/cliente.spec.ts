import { test, Page } from '@playwright/test';
import { api, apiLogin, cleanupTable, APP, chapter, prepareContext, SLUG } from './guide';

/**
 * Parte 1 — Cliente (telefono 390x844). Un test = un capitolo.
 * Tavolo usato: il primo libero tra Tavolo 8, 4 (id 17, 13). Non tocca tavoli aperti da altri.
 */
const PART = 'Cliente';
let TOKEN = '';

test.beforeAll(async () => { TOKEN = await apiLogin(); });

/** Primo tavolo libero tra quelli dedicati al cliente; apre la sessione e restituisce codice e id. */
async function openTable(seats = 2) {
    for (const id of [17, 13, 12, 16]) {
        const t = await api(`/api/public/sessions/table/${id}?localname=${SLUG}`);
        if (t.json && t.json.busy === false) {
            const o = await api(`/api/tables/${id}/session/open`, 'POST', TOKEN, { seats });
            if (o.status === 200) return { tableId: id, tableName: t.json.tableName as string, sessionId: o.json.sessionId as string, code: o.json.accessCode as string };
        }
    }
    throw new Error('Nessun tavolo libero per il cliente (Tavolo 8 / Tavolo 4)');
}

async function closeTable(tableId: number) {
    await cleanupTable(tableId, TOKEN, RUN_START);
}
const RUN_START = Date.now();

/** Entra nella sessione del tavolo senza mostrarlo (capitoli successivi al codice). */
async function joinSilently(page: Page, table: { tableId: number; code: string; sessionId: string }) {
    const clientSessionId = 'guide-' + Date.now();
    const j = await api('/api/public/sessions/join', 'POST', undefined, { tableId: table.tableId, code: table.code, localname: SLUG, clientSessionId });
    const stored = JSON.stringify({ sessionId: j.json?.sessionId ?? table.sessionId, tableId: table.tableId, localname: SLUG, joinedAt: Date.now() });
    await page.context().addInitScript(([tid, sess, cs]) => {
        if (localStorage.getItem('__guide_joined')) return;
        localStorage.setItem('__guide_joined', '1');
        localStorage.setItem('rf_table_id', String(tid));
        localStorage.setItem('rf_client_session', cs as string);
        localStorage.setItem('rf_table_session', sess as string);
    }, [table.tableId, stored, clientSessionId] as const);
    return { clientSessionId, join: j.json };
}

test('01 La pagina del ristorante', async ({ page }, info) => {
    const ch = await chapter(page, info, PART, 'La pagina del ristorante');
    await prepareContext(page.context());
    await ch.goto(`/${SLUG}`);
    ch.begin();
    await ch.say('Ogni locale su DineUp ha la sua pagina pubblica. È quella che il cliente apre dal link sui social, da Google o dal QR in vetrina.', async () => {
        await ch.pause(1500);
        await ch.point(page.getByText('Trattoria Da Marco').nth(1), 2000);
    });
    await ch.say('In alto trova subito indirizzo e orari, e quattro pulsanti: sfoglia il menù, prenota un tavolo, asporto e consegna a domicilio.', async () => {
        await ch.point(page.getByRole('button', { name: 'Sfoglia il menù' }).first(), 1500);
        await ch.point(page.getByRole('button', { name: 'Prenota un tavolo' }).first(), 1500);
        await ch.point(page.getByRole('button', { name: 'Asporto' }).first(), 1200);
        await ch.point(page.getByRole('button', { name: 'Consegna a domicilio' }).first(), 1200);
    });
    await ch.say('Scorrendo, trova le categorie del menù, i punti di forza del locale, i contatti con la mappa e il modulo per prenotare.', async () => {
        await ch.scroll(700, 10);
        await ch.pause(1200);
        await ch.scroll(800, 10);
        await ch.pause(1200);
        await ch.scroll(900, 10);
        await ch.shot('scroll');
    });
    await ch.say('Toccando una categoria, per esempio le pizze, si apre direttamente quella parte del menù.', async () => {
        await ch.scrollTop();
        const cat = page.getByRole('button', { name: 'Pizze', exact: true }).first();
        await ch.click(cat, 2000);
        await ch.shot('pizze');
    });
    await ch.finish();
});

test('02 Prenotare un tavolo', async ({ page }, info) => {
    const ch = await chapter(page, info, PART, 'Prenotare un tavolo');
    await prepareContext(page.context());
    await ch.goto(`/${SLUG}`);
    ch.begin();
    await ch.say('Per prenotare, dalla pagina del locale il cliente tocca Prenota un tavolo: la pagina scorre da sola fino al modulo.', async () => {
        await ch.click(page.getByRole('button', { name: 'Prenota un tavolo' }).first(), 2200);
    });
    await ch.say('Inserisce nome e cognome, il numero di telefono e, se vuole, anche la mail.', async () => {
        await ch.type(page.locator('#bk-name'), 'Chiara Lombardi');
        await ch.type(page.locator('#bk-phone'), '+39 347 555 1290');
        await ch.type(page.locator('#bk-email'), 'chiara.lombardi@email.it');
    });
    await ch.say("Poi sceglie il giorno, l'orario tra quelli proposti e il numero di persone.", async () => {
        const iso = new Date(Date.now() + 5 * 864e5).toISOString().slice(0, 10);
        await ch.click(page.locator('#bk-date'), 400);
        await page.locator('#bk-date').fill(iso);
        await ch.pause(800);
        await ch.click(page.locator('#bk-time'), 300);
        await page.locator('#bk-time').selectOption('20:30');
        await ch.pause(800);
        await ch.type(page.locator('#bk-guests'), '4');
    });
    await ch.say('Nelle note può segnalare allergie, un seggiolone o una ricorrenza. Infine tocca Invia la richiesta.', async () => {
        await ch.type(page.locator('#bk-notes'), 'Festeggiamo un compleanno, tavolo tranquillo se possibile');
        await ch.click(page.getByRole('button', { name: 'Invia la richiesta' }), 2200);
        await ch.shot('inviata');
    });
    await ch.say('La richiesta arriva subito al ristorante, nella pagina Prenotazioni, dove il titolare la conferma o la rifiuta.', async () => {
        await ch.pause(1500);
    });
    await ch.finish();
});

test('03 Al tavolo: QR e codice di accesso', async ({ page }, info) => {
    const ch = await chapter(page, info, PART, 'Al tavolo: QR e codice di accesso');
    await prepareContext(page.context());
    const t = await openTable(2);
    try {
        await ch.goto(`/${SLUG}/Categories?table=${t.tableId}`, 2500);
        ch.begin();
        await ch.say(`Seduto al tavolo, il cliente inquadra il QR code con la fotocamera del telefono. Non serve nessuna app: si apre subito la pagina del ${t.tableName}.`, async () => {
            await ch.pause(2500);
            await ch.shot('codice');
        });
        await ch.say('Per sicurezza viene chiesto un codice di quattro caratteri. Lo comunica il cameriere quando apre il tavolo, ed è diverso ogni volta.', async () => {
            await ch.point(page.locator('input').first(), 2500);
        });
        await ch.say('Il cliente scrive il codice e tocca Entra al tavolo.', async () => {
            await ch.type(page.locator('input').first(), t.code, 600);
            await ch.click(page.getByRole('button', { name: 'Entra al tavolo' }), 2500);
            await page.waitForURL(/categories/i);
        });
        await ch.say('Fatto: è dentro il menù del suo tavolo. Gli ordini inviati da qui arrivano in sala già collegati al tavolo giusto.', async () => {
            await ch.pause(1500);
            await ch.shot('menu');
        });
        await ch.say('Anche gli amici seduti allo stesso tavolo possono entrare con lo stesso codice, ognuno dal proprio telefono.', async () => {
            await ch.scroll(400, 6);
            await ch.scrollTop();
        });
        await ch.finish();
    } finally {
        await closeTable(t.tableId);
    }
});

test('04 Sfogliare il menu e cercare un piatto', async ({ page }, info) => {
    const ch = await chapter(page, info, PART, 'Sfogliare il menu e cercare un piatto');
    await prepareContext(page.context());
    await ch.goto(`/${SLUG}/Categories`, 2500);
    ch.begin();
    await ch.say('Ecco il menù. In alto il nome del locale, poi le categorie: antipasti, primi, secondi, pizze, bevande e dolci.', async () => {
        await ch.scroll(450, 8);
        await ch.pause(1200);
    });
    await ch.say("Tocchiamo i primi: si vede l'elenco dei piatti con descrizione, prezzo e foto.", async () => {
        await ch.click(page.getByText('Primi', { exact: true }).first(), 2500);
        await ch.scroll(350, 6);
        await ch.shot('primi');
    });
    await ch.say("Con la barra in alto si passa da una categoria all'altra con un tocco, senza tornare indietro.", async () => {
        await ch.scrollTop();
        await ch.click(page.getByText('Pizze', { exact: true }).first(), 2000);
        await ch.click(page.getByText('Dolci', { exact: true }).first(), 2000);
    });
    await ch.say('Se il cliente cerca qualcosa di preciso, usa la ricerca: basta scrivere il nome di un piatto o di un ingrediente.', async () => {
        await ch.type(page.getByPlaceholder(/Cerca un piatto/).first(), 'funghi', 1500);
        await ch.shot('ricerca');
    });
    await ch.say('I risultati arrivano da tutte le categorie insieme: compaiono le tagliatelle ai porcini e la capricciosa, che ha i funghi tra gli ingredienti.', async () => {
        await ch.pause(2500);
    });
    await ch.say('Con la X si cancella la ricerca e si torna al menù completo.', async () => {
        await ch.click(page.locator('button[aria-label]').filter({ has: page.locator('svg.lucide-x') }).first(), 1500);
        await ch.shot('dopo-ricerca');
    });
    await ch.finish();
});


const shieldBtn = (page: Page) => page.locator('header button').filter({ has: page.locator('svg[class*="shield"]') }).first();

test('05 Allergeni e scheda del piatto', async ({ page }, info) => {
    const ch = await chapter(page, info, PART, 'Allergeni e scheda del piatto');
    await prepareContext(page.context());
    await ch.goto(`/${SLUG}/Products/19`, 2500);
    ch.begin();
    await ch.say("Sotto ogni piatto ci sono le etichette degli allergeni, come glutine e latte, e l'indicazione vegetariano quando serve.", async () => {
        await ch.point(page.getByText('Glutine', { exact: true }).first(), 2000);
        await ch.point(page.getByText('Latte', { exact: true }).first(), 1500);
    });
    await ch.say('Con lo scudo in alto si apre il filtro allergeni. Il cliente seleziona quelli che non può mangiare.', async () => {
        await ch.click(shieldBtn(page), 2000);
    });
    await ch.say('Per esempio il latte. Toccando Applica filtri, i primi che lo contengono spariscono: restano solo le tagliatelle ai funghi porcini. I piatti che possono contenerne tracce restano visibili, con un avviso.', async () => {
        await ch.click(page.locator('label').filter({ hasText: /^Latte$/ }).first(), 1200);
        await ch.click(page.getByRole('button', { name: 'Applica filtri' }), 2500);
        await ch.shot('filtrato');
    });
    await ch.say('Per tornare al menù completo si riapre lo scudo e si tocca Resetta.', async () => {
        await ch.click(shieldBtn(page), 1500);
        await ch.click(page.getByRole('button', { name: 'Resetta' }), 1000);
        await ch.click(page.getByRole('button', { name: 'Applica filtri' }), 1800);
    });
    await ch.say('Toccando un piatto si apre la sua scheda, con la descrizione completa, gli ingredienti e gli allergeni della versione scelta.', async () => {
        await ch.goto(`/${SLUG}/Product/38`, 2500);
        await ch.shot('scheda');
    });
    await ch.say('In fondo, la nota sugli allergeni secondo il regolamento europeo ricorda di chiedere al personale per qualsiasi dubbio.', async () => {
        await ch.scroll(350, 6);
        await ch.pause(1000);
    });
    await ch.finish();
});

const drawerBody = (page: Page) => page.locator('div.p-6.space-y-6.overflow-y-auto').first();

test('06 Varianti ed extra', async ({ page }, info) => {
    const ch = await chapter(page, info, PART, 'Varianti ed extra');
    await prepareContext(page.context());
    await ch.goto(`/${SLUG}/Products/21`, 2500);
    ch.begin();
    await ch.say('Alcuni piatti hanno delle varianti. La Margherita, per esempio, parte da cinque euro: il prezzo finale dipende dalle scelte.', async () => {
        await ch.point(page.getByText('Margherita', { exact: true }).first(), 2000);
    });
    await ch.say('Toccandola si apre la scheda di personalizzazione, divisa in gruppi di scelte.', async () => {
        await ch.click(page.getByText('Margherita', { exact: true }).first(), 2500);
    });
    await ch.say('Nel formato si sceglie tra baby, normale e maxi: accanto a ogni voce c\'è il prezzo.', async () => {
        await ch.click(page.getByText('Maxi', { exact: true }).first(), 1800);
    });
    await ch.say("Nell'impasto c'è anche la versione senza glutine, con il suo sovrapprezzo. E per la mozzarella, la classica oppure senza lattosio.", async () => {
        await ch.click(page.getByText('Senza glutine', { exact: true }).first(), 1800);
        await ch.click(page.getByText('Senza lattosio', { exact: true }).first(), 1800);
        await ch.shot('scelte');
    });
    await ch.say("Gli allergeni si aggiornano in base alla versione scelta: con l'impasto senza glutine, il glutine resta solo come possibile traccia. La mozzarella senza lattosio contiene comunque latte, e infatti resta indicato.", async () => {
        await ch.point(page.getByText(/allergeni della versione scelta/i).first(), 2500);
    });
    await ch.say('Negli ingredienti inclusi si può togliere quello che non si vuole, per esempio il basilico.', async () => {
        await ch.click(page.locator('label.menu-ingredient-row').filter({ hasText: /^Basilico/ }).first(), 1800);
        await ch.shot('basilico');
    });
    await ch.say('Nelle aggiunte extra si scelgono ingredienti a pagamento, ognuno con il suo prezzo. Aggiungiamo la burrata.', async () => {
        await ch.point(page.getByRole('button', { name: /Aggiunte extra/ }), 1200);
        await ch.click(page.locator('label.menu-ingredient-row').filter({ hasText: /Burrata/ }).first(), 1800);
        await ch.shot('extra');
    });
    await ch.say('Infine una nota per la cucina, la quantità con più e meno, e il pulsante Aggiungi, che mostra già il prezzo totale.', async () => {
        await ch.type(page.locator('#notes'), 'Ben cotta, grazie', 800);
        await ch.click(page.locator('button:has(svg.lucide-plus)').last(), 1200);
        await ch.point(page.getByRole('button', { name: /^Aggiungi/ }).last(), 1500);
        await ch.click(page.getByRole('button', { name: /^Aggiungi/ }).last(), 2000);
        await ch.shot('aggiunto');
    });
    await ch.say("Il carrello in alto si aggiorna con il numero dei piatti scelti.", async () => {
        await ch.point(page.locator('header button').last(), 2000);
    });
    await ch.finish();
});

/** Aggiunge al carrello del telefono, dal vivo, un piatto senza varianti. */
async function addSimple(ch: import('./guide').Chapter, page: Page, name: string, extraPlus = 0) {
    await ch.click(page.getByText(name, { exact: true }).first(), 1500);
    for (let i = 0; i < extraPlus; i++) await ch.click(page.locator('button:has(svg.lucide-plus)').last(), 600);
    await ch.click(page.getByRole('button', { name: /^Aggiungi/ }).last(), 1500);
}

test('07 Carrello e invio dell\'ordine', async ({ page }, info) => {
    const ch = await chapter(page, info, PART, "Carrello e invio dell'ordine");
    await prepareContext(page.context());
    const t = await openTable(3);
    try {
        await joinSilently(page, t);
        await ch.goto(`/${SLUG}/Products/19?table=${t.tableId}`, 2500);
        ch.begin();
        await ch.say(`Siamo al ${t.tableName}. Il cliente sceglie un primo, gli spaghetti alla carbonara, e lo aggiunge al carrello.`, async () => {
            await addSimple(ch, page, 'Spaghetti alla carbonara');
        });
        await ch.say('Poi passa alle bevande e prende due birre artigianali: con il più si sceglie la quantità.', async () => {
            await ch.goto(`/${SLUG}/Products/22?table=${t.tableId}`, 1500);
            await addSimple(ch, page, 'Birra artigianale 50cl', 1);
        });
        await ch.say('Toccando il carrello in alto rivede tutto quello che ha scelto, con il totale.', async () => {
            await ch.click(page.locator('header button').last(), 2500);
            await ch.shot('carrello');
        });
        await ch.say('Qui può ancora cambiare le quantità o togliere un piatto, prima di confermare.', async () => {
            await ch.scroll(300, 5);
            await ch.point(page.locator('button:has(svg.lucide-minus)').first(), 1500);
        });
        await ch.say('Al tavolo si ordina tutti insieme: ognuno sceglie dal suo telefono e poi tocca Sono pronto.', async () => {
            await ch.click(page.getByRole('button', { name: 'Sono pronto' }), 2500);
            await page.waitForURL(/table-session/i);
            await ch.shot('attesa');
        });
        // Un amico al tavolo, dal suo telefono (via API)
        const friend = 'guide-amico-' + Date.now();
        await api('/api/public/sessions/join', 'POST', undefined, { tableId: t.tableId, code: t.code, localname: SLUG, clientSessionId: friend });
        await ch.say('In questa schermata si vede chi è collegato al tavolo e chi ha già finito di scegliere. Ecco, si è appena unito un amico.', async () => {
            await ch.pause(3000);
            await ch.shot('amico');
        });
        const sessionId = t.sessionId;
        await api(`/api/public/sessions/${sessionId}/ready`, 'POST', undefined, {
            clientSessionId: friend,
            draftOrder: [{ products: [{ idProduct: 46, productOption: 'Standard', note: '', quantity: 1, ingredientsMinus: [], ingredientsPlus: [] }] }],
        });
        await ch.say("Anche l'amico è pronto. Ora chiunque al tavolo può inviare tutti gli ordini al cameriere con un solo tocco.", async () => {
            await ch.pause(2500);
            await ch.shot('pronti');
        });
        await ch.say('Tocchiamo Invia ordini al cameriere: la comanda arriva in sala e in cucina, e si apre la pagina dello stato.', async () => {
            await ch.click(page.getByRole('button', { name: /Invia ordini al cameriere/ }), 3000);
            await page.waitForURL(/table-live/);
            await ch.shot('live');
        });
        await ch.finish();
    } finally {
        // Il tavolo resta aperto per il capitolo 08 solo se richiesto; qui si chiude.
        await closeTable(t.tableId);
    }
});

test('08 Stato dell\'ordine e secondo giro', async ({ page }, info) => {
    const ch = await chapter(page, info, PART, "Stato dell'ordine e secondo giro");
    await prepareContext(page.context());
    const t = await openTable(2);
    try {
        const me = await joinSilently(page, t);
        // Primo giro già inviato (preparazione nascosta)
        await api(`/api/public/sessions/${t.sessionId}/ready`, 'POST', undefined, {
            clientSessionId: me.clientSessionId,
            draftOrder: [{ products: [
                { idProduct: 39, productOption: 'Standard', note: '', quantity: 1, ingredientsMinus: [], ingredientsPlus: [] },
                { idProduct: 42, productOption: 'Standard', note: '', quantity: 1, ingredientsMinus: [], ingredientsPlus: [] },
                { idProduct: 51, productOption: 'Standard', note: '', quantity: 2, ingredientsMinus: [], ingredientsPlus: [] },
            ] }],
        });
        const sub = await api(`/api/public/sessions/${t.sessionId}/submit`, 'POST', undefined, { clientSessionId: me.clientSessionId });
        const state = await api(`/api/public/sessions/${t.sessionId}/state?clientSessionId=${encodeURIComponent(me.clientSessionId)}`);
        const ids: string[] = ((state.json?.comands ?? []) as any[]).map(c => c.comandId);
        if (!ids.length) console.log('submit', sub.status, sub.text?.slice(0, 200));
        await ch.goto(`/${SLUG}/table-live`, 2500);
        ch.begin();
        await ch.say("Dopo l'invio, il cliente vede lo stato degli ordini del suo tavolo, in tempo reale. Ora l'ordine risulta inviato.", async () => {
            await ch.pause(2500);
            await ch.shot('inviato');
        });
        await ch.say("Appena la cucina lo prende in carico, lo stato passa a In preparazione, senza ricaricare la pagina.", async () => {
            for (const id of ids) await api('/api/orders/changeStatus', 'POST', TOKEN, { comandId: id, status: 'PROGRESS' });
            await ch.pause(4000);
            await ch.shot('preparazione');
        });
        await ch.say('Quando i piatti sono pronti, lo stato diventa Pronto. Il cliente sa sempre a che punto è.', async () => {
            for (const id of ids) await api('/api/orders/changeStatus', 'POST', TOKEN, { comandId: id, status: 'COMPLETED' });
            await ch.pause(4000);
            await ch.shot('pronto');
        });
        await ch.say('Il tavolo resta aperto: per un secondo giro, per esempio il dolce, si tocca Aggiungi altro ordine.', async () => {
            await ch.click(page.getByRole('button', { name: 'Aggiungi altro ordine' }), 2500);
            await page.waitForURL(/categories/i);
        });
        await ch.say('Si torna al menù: scegliamo i dolci e aggiungiamo un tiramisù.', async () => {
            await ch.click(page.getByText('Dolci', { exact: true }).first(), 2000);
            await addSimple(ch, page, 'Tiramisu');
        });
        await ch.say('Dal carrello, Sono pronto e poi Invia ordini al cameriere: il dolce arriva in cucina come nuova comanda dello stesso tavolo.', async () => {
            await ch.click(page.locator('header button').last(), 2000);
            await ch.click(page.getByRole('button', { name: 'Sono pronto' }), 2500);
            await page.waitForURL(/table-session/i);
            await ch.click(page.getByRole('button', { name: /Invia ordini al cameriere/ }), 3000);
            await page.waitForURL(/table-live/);
        });
        await ch.say('Con Dettaglio ordini il cliente ritrova tutto quello che il tavolo ha ordinato, con extra, totale e stato di ogni comanda.', async () => {
            await ch.click(page.getByRole('button', { name: 'Dettaglio ordini' }), 2500);
            await ch.scroll(400, 6);
            await ch.shot('dettaglio');
        });
        await ch.finish();
    } finally {
        await closeTable(t.tableId);
    }
});

test('09 Ordinare da asporto', async ({ page }, info) => {
    const ch = await chapter(page, info, PART, 'Ordinare da asporto');
    await prepareContext(page.context());
    await ch.goto(`/${SLUG}`, 2000);
    ch.begin();
    await ch.say("Per ordinare da asporto il cliente tocca Asporto nella pagina del locale. Si apre il menù, con l'asporto già selezionato.", async () => {
        await ch.click(page.getByRole('button', { name: 'Asporto', exact: true }).first(), 2500);
        await ch.point(page.getByText('Ritiri tu al locale').first(), 1500);
    });
    await ch.say('Sceglie i piatti come al tavolo: una pizza bufalina, una diavola e due coca cola.', async () => {
        await ch.click(page.getByText('Pizze', { exact: true }).first(), 1800);
        await addSimple(ch, page, 'Bufalina');
        await ch.click(page.getByText('Diavola', { exact: true }).first(), 1500);
        await ch.click(page.getByRole('button', { name: /^Aggiungi/ }).last(), 1500);
        await ch.click(page.getByText('Bevande', { exact: true }).first(), 1500);
        await addSimple(ch, page, 'Coca-Cola 33cl', 1);
    });
    await ch.say('Nel carrello controlla i piatti, poi scrive nome e telefono: servono al locale per riconoscere l\'ordine al ritiro.', async () => {
        await ch.click(page.locator('header button').last(), 2000);
        await ch.scroll(450, 6);
        await ch.type(page.getByPlaceholder('Nome e Cognome *'), 'Giorgia Ferri');
        await ch.type(page.getByPlaceholder('Telefono *'), '348 112 7790');
    });
    await ch.say("Sotto compaiono gli orari di ritiro liberi, divisi per giorno e fascia. Gli orari pieni non vengono proposti, così il locale non riceve più ordini di quanti ne può preparare.", async () => {
        await ch.scroll(300, 5);
        await ch.shot('slot');
        await ch.pause(1500);
    });
    await ch.say("Il cliente sceglie l'orario che preferisce e tocca Invia ordine asporto.", async () => {
        const slots = page.locator('button[aria-pressed]');
        const slot = slots.nth(Math.min(5, (await slots.count()) - 1));
        await ch.click(slot, 1500);
        await ch.click(page.getByRole('button', { name: /Invia Ordine Asporto|Ordina e paga/ }), 3000);
        await page.waitForURL(/order-status/i);
        await ch.shot('stato');
    });
    const comandId = page.url().split('/').pop()!.split('?')[0];
    await ch.say("Si apre la pagina dello stato dell'ordine, con il riepilogo e l'orario di ritiro. Il cliente può tenerla aperta: si aggiorna da sola.", async () => {
        await ch.pause(2500);
        await ch.scroll(300, 5);
        await ch.scrollTop();
    });
    await ch.say('Quando il locale inizia a prepararlo, lo stato passa a In preparazione.', async () => {
        await api('/api/orders/changeStatus', 'POST', TOKEN, { comandId, status: 'PROGRESS' });
        await ch.pause(4000);
        await ch.shot('preparazione');
    });
    await ch.say("E quando è pronto, il cliente lo vede subito: può passare a ritirarlo.", async () => {
        await api('/api/orders/changeStatus', 'POST', TOKEN, { comandId, status: 'COMPLETED' });
        await ch.pause(4000);
        await ch.shot('pronto');
    });
    await ch.finish();
    // libera lo slot per le registrazioni successive
    await api('/api/orders/changeStatus', 'POST', TOKEN, { comandId, status: 'DELETED' });
});


/** Prepara (fuori video) un carrello per la consegna arrivando fino al passo indicato. */
async function deliveryUpTo(ch: import('./guide').Chapter, page: Page, step: 'address' | 'contact' | 'confirm', live: boolean) {
    const go = live ? ch : null;
    const click = async (l: import('@playwright/test').Locator, ms = 1500) => go ? ch.click(l, ms) : l.click();
    await click(page.getByRole('button', { name: 'Consegna a domicilio' }).first(), 2500);
    if (live) await ch.say("In alto vede le condizioni: ordine minimo, costo della consegna e la soglia oltre la quale la consegna è gratuita.", async () => {
        await ch.point(page.getByText(/Ordine minimo/).first(), 2500);
    });
    const add = async (cat: string, name: string, plus = 0) => {
        await click(page.getByText(cat, { exact: true }).first(), 1500);
        await click(page.getByText(name, { exact: true }).first(), 1500);
        for (let i = 0; i < plus; i++) await click(page.locator('button:has(svg.lucide-plus)').last(), 600);
        await click(page.getByRole('button', { name: /^Aggiungi/ }).last(), 1500);
    };
    const pick = async () => {
        await add('Primi', 'Lasagne della nonna', 1);
        await add('Secondi', 'Tagliata di manzo con rucola');
        await add('Dolci', 'Tiramisu');
    };
    if (live) await ch.say('Sceglie i piatti: due lasagne, una tagliata e un tiramisù.', pick); else await pick();
    const toCheckout = async () => {
        await click(page.locator('header button').last(), 2000);
        if (live) await ch.scroll(500, 6); else await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await click(page.getByRole('button', { name: /Continua con la consegna/ }), 2500);
    };
    if (live) await ch.say('Nel carrello tocca Continua con la consegna.', toCheckout); else await toCheckout();
    if (step === 'address') return;
    // indirizzo (fuori video)
    await page.getByPlaceholder(/Via e numero civico/).fill('Viale Venezia 40, Brescia');
    await page.getByRole('button', { name: 'Cerca', exact: true }).click();
    await page.locator('.leaflet-container').first().waitFor({ timeout: 15000 });
    await page.getByLabel(/Citofono/).first().fill('Ferrari');
    await page.getByLabel(/Piano/).first().fill('2° piano, int. 5');
    await page.getByRole('button', { name: /^Continua/ }).last().click();
    await page.waitForTimeout(800);
    if (step === 'contact') return;
    await page.locator('input[id$="-name"]').first().fill('Lorenzo Ferrari');
    await page.locator('input[id$="-phone"]').first().fill('333 908 4471');
    const send = page.getByRole('button', { name: 'Invia codice' });
    if (await send.isVisible().catch(() => false)) {
        await send.click();
        await page.locator('input[id$="-code"]').first().fill('123456');
        await page.getByText('Numero verificato').first().waitFor();
    }
    await page.getByRole('button', { name: /^Continua/ }).last().click();
    await page.waitForTimeout(1000);
}

test("10 Consegna a domicilio: l'indirizzo", async ({ page }, info) => {
    const ch = await chapter(page, info, PART, "Consegna a domicilio: l'indirizzo");
    await prepareContext(page.context());
    await ch.goto(`/${SLUG}`, 2000);
    ch.begin();
    await ch.say('Se il locale ha attivato le consegne, il cliente può farsi portare la cena a casa: dalla pagina del locale tocca Consegna a domicilio.', async () => {
        await ch.point(page.getByRole('button', { name: 'Consegna a domicilio' }).first(), 1500);
    });
    await deliveryUpTo(ch, page, 'address', true);
    await ch.say("Il primo passo è l'indirizzo. Può usare la sua posizione, oppure cercare la via: scriviamo viale Venezia quaranta, Brescia, e tocchiamo Cerca.", async () => {
        await ch.point(page.getByRole('button', { name: /Usa la mia posizione/ }), 1500);
        await ch.type(page.getByPlaceholder(/Via e numero civico/), 'Viale Venezia 40, Brescia', 600);
        await ch.click(page.getByRole('button', { name: 'Cerca', exact: true }), 1500);
        await page.locator('ul li button, .leaflet-container').first().waitFor({ timeout: 15000 });
        const first = page.locator('ul li button').first();
        if (await first.isVisible()) await ch.click(first, 1500);
        await ch.pause(1500);
    });
    await ch.say("Sulla mappa compare il segnaposto: se serve, si trascina sul punto esatto del portone.", async () => {
        await ch.point(page.locator('.leaflet-marker-icon').first(), 3000);
        await ch.shot('mappa');
    });
    await ch.say("Sotto, il sistema calcola la distanza, il costo della consegna in base alla zona e ricorda l'ordine minimo.", async () => {
        await ch.scroll(520, 6);
        await ch.point(page.getByText('Distanza stimata').first(), 2000);
    });
    await ch.say('Poi il cliente aggiunge il nome sul citofono, piano e interno, e una nota per il rider.', async () => {
        await ch.type(page.getByLabel(/Citofono/).first(), 'Ferrari');
        await ch.type(page.getByLabel(/Piano/).first(), '2° piano, int. 5');
        await ch.type(page.getByLabel(/Note per il rider/).first(), 'Cancello verde, secondo campanello');
        await ch.shot('dettagli');
    });
    await ch.say('Tutto pronto: tocca Continua per passare ai suoi dati.', async () => {
        await ch.click(page.getByRole('button', { name: /^Continua/ }).last(), 2500);
    });
    await ch.finish();
});

test('11 Consegna a domicilio: dati, orario e stato', async ({ page }, info) => {
    const ch = await chapter(page, info, PART, 'Consegna a domicilio: dati, orario e stato');
    await prepareContext(page.context());
    await ch.goto(`/${SLUG}`, 1500);
    await deliveryUpTo(ch, page, 'contact', false);
    await ch.pause(1500);
    ch.begin();
    await ch.say('Nel secondo passo il cliente scrive nome e numero di telefono.', async () => {
        await ch.type(page.locator('input[id$="-name"]').first(), 'Lorenzo Ferrari');
        await ch.type(page.locator('input[id$="-phone"]').first(), '333 908 4471');
    });
    const send = page.getByRole('button', { name: 'Invia codice' });
    if (await send.isVisible().catch(() => false)) {
        await ch.say('Se il locale ha attivato la verifica, il cliente tocca Invia codice e riceve un SMS con sei cifre: appena le scrive, il numero è verificato. Serve solo la prima volta, poi il telefono lo ricorda.', async () => {
            await ch.click(send, 2000);
            await ch.type(page.locator('input[id$="-code"]').first(), '123456', 600);
            await page.getByText('Numero verificato').first().waitFor();
            await ch.pause(1800);
            await ch.shot('verificato');
        });
    }
    await ch.say('Con il numero confermato, tocca Continua per passare a orario e pagamento.', async () => {
        await ch.click(page.getByRole('button', { name: /^Continua/ }).last(), 2500);
        await ch.shot('step3');
    });
    let comandId = '';
    await ch.say("Ultimo passo: orario e pagamento. In alto il riepilogo dell'indirizzo, con il pulsante Modifica se serve correggerlo.", async () => {
        await ch.point(page.getByText(/Consegna a|Consegniamo a/).first(), 1500);
        await ch.point(page.getByRole('button', { name: 'Modifica' }).first(), 1500);
    });
    await ch.say('Poi sceglie quando ricevere la cena: gli orari di consegna hanno una capienza propria, separata da quella dell\'asporto.', async () => {
        await ch.scroll(250, 5);
        const slots = page.locator('button[aria-pressed]');
        await ch.click(slots.nth(Math.min(6, (await slots.count()) - 1)), 1800);
        await ch.shot('orario');
    });
    await ch.say('E come pagare: in contanti o con il POS del rider alla consegna. Se il locale ha i pagamenti online, può anche pagare subito con la carta.', async () => {
        await ch.scroll(350, 5);
        await ch.click(page.locator('label').filter({ hasText: /POS|Carta/ }).first(), 1500);
        await ch.click(page.locator('label').filter({ hasText: /Contanti/ }).first(), 1500);
    });
    await ch.say('Il riepilogo mostra i piatti, il costo della consegna e il totale. Tocca Invia ordine.', async () => {
        await ch.scroll(400, 5);
        await ch.shot('riepilogo');
        await ch.click(page.getByRole('button', { name: /^Invia ordine/ }), 3000);
        await page.waitForURL(/order-status/i, { timeout: 15000 });
        comandId = page.url().split('/').pop()!.split('?')[0];
    });
    await ch.say("Si apre la pagina dello stato della consegna: ordine ricevuto, in preparazione, in consegna e consegnato, con l'orario previsto.", async () => {
        await ch.pause(2500);
        await ch.shot('ricevuto');
    });
    await ch.say('Quando la cucina inizia a preparare, lo stato avanza da solo.', async () => {
        await api('/api/orders/changeStatus', 'POST', TOKEN, { comandId, status: 'PROGRESS' });
        await ch.pause(3500);
    });
    await ch.say('Appena il rider parte, il cliente vede che la cena è in consegna.', async () => {
        await api(`/api/delivery/orders/${comandId}/stage`, 'POST', TOKEN, { stage: 'OUT_FOR_DELIVERY' });
        await ch.pause(3500);
        await ch.shot('in-consegna');
    });
    await ch.say('E quando il rider la consegna, lo stato diventa Consegnato. Buon appetito!', async () => {
        await api(`/api/delivery/orders/${comandId}/stage`, 'POST', TOKEN, { stage: 'DELIVERED', cashCollected: true });
        await ch.pause(3500);
        await ch.shot('consegnato');
    });
    await ch.finish();
    if (comandId) await api('/api/orders/changeStatus', 'POST', TOKEN, { comandId, status: 'DELETED' });
});

test('12 La tessera fedeltà', async ({ page }, info) => {
    const ch = await chapter(page, info, PART, 'La tessera fedeltà');
    await prepareContext(page.context());
    const cards = await api('/api/cards/getall', 'GET', TOKEN);
    const anna = ((cards.json?.data ?? cards.json ?? []) as any[]).find(c => c.holderName === 'Anna Rossi');
    await ch.goto('/cardStatus', 2000);
    ch.begin();
    await ch.say('Il locale può dare ai clienti abituali una tessera fedeltà. Il cliente la controlla da questa pagina, inquadrando il QR della sua tessera oppure scrivendo il codice.', async () => {
        await ch.pause(2000);
    });
    await ch.say('Scriviamo il codice della tessera di Anna Rossi e confermiamo.', async () => {
        await ch.type(page.locator('input').first(), anna.code, 600);
        await page.keyboard.press('Enter');
        await ch.pause(2500);
        await ch.shot('saldo');
    });
    await ch.say('Ecco la tessera: i punti accumulati, le visite e quanto manca al prossimo premio. I punti si caricano in cassa a ogni conto, e si usano come sconto.', async () => {
        await ch.scroll(300, 5);
        await ch.pause(1500);
    });
    await ch.say('Il cliente può salvare questa pagina tra i preferiti del telefono: il saldo è sempre aggiornato.', async () => {
        await ch.scrollTop();
    });
    await ch.finish();
});
