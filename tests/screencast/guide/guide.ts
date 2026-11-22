import { BrowserContext, Locator, Page, TestInfo } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Guida video DineUp, un capitolo per test.
 * - cursore visibile con evidenziazione dei clic (anello che si espande)
 * - nessuna didascalia a schermo: i testi della voce fuori campo finiscono nel JSON del capitolo
 * - say(testo, azioni): registra l'istante della scena e attende almeno il tempo di lettura (~2,5 parole/s)
 * Output: screencast-videos/guide/<id>.webm + <id>.json  (id = "NN-titolo")
 * FAST=1 riduce tutte le pause (prove veloci dei selettori, il video non serve).
 */
export const APP = process.env.SCREENCAST_URL ?? 'http://localhost:5173';
export const API = 'http://localhost:8085';
export const WEBFLUX = 'http://localhost:8081';
export const SLUG = 'trattoriadamarco';
export const OWNER = { email: 'demo-owner@restaurantflow.test', password: 'Demo#Trattoria2026' };
export const WAITER = { email: 'demo-waiter@restaurantflow.test', password: 'Demo#Cameriere2026' };
export const FAST = process.env.FAST === '1';
const WORDS_PER_SEC = 2.5;
const OUT = path.resolve('screencast-videos/guide');

export async function apiLogin(who = OWNER): Promise<string> {
    const r = await fetch(API + '/api/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailUsername: who.email, password: who.password }),
    });
    return (await r.json()).accessToken as string;
}

export async function api(pathname: string, method = 'GET', token?: string, body?: unknown, base = API) {
    const res = await fetch(base + pathname, {
        method,
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    let json: any = null;
    try { json = JSON.parse(text); } catch { /* testo semplice */ }
    return { status: res.status, json, text };
}

/** Cookie di login + consenso cookie: la registrazione parte già dentro l'area riservata. */
export async function prepareContext(ctx: BrowserContext, token?: string) {
    if (token) await ctx.addCookies([{ name: 'rf_token', value: token, url: APP }]);
    await ctx.addInitScript(() => {
        try {
            localStorage.setItem('cookieConsent', JSON.stringify({
                version: 1, timestamp: new Date().toISOString(),
                state: { necessary: true, functional: true, analytics: false, marketing: false },
            }));
        } catch { /* noop */ }
    });
}

type Scene = { at: number; text: string };

export class Chapter {
    private readonly created = Date.now();
    private began = 0;
    private readonly scenes: Scene[] = [];
    private sceneStart = 0;
    private sceneNeed = 0;

    constructor(readonly page: Page, readonly id: string, readonly meta: { part: string; title: string }) {}

    async setup() {
        await this.page.addInitScript(() => {
            const install = () => {
                if (document.getElementById('__sc_cursor')) return;
                const style = document.createElement('style');
                style.textContent = `
                    #__sc_cursor{position:fixed;z-index:2147483647;width:24px;height:24px;border-radius:50%;
                        background:rgba(249,115,22,.30);border:2px solid #F97316;pointer-events:none;
                        transform:translate(-50%,-50%);transition:left .35s ease,top .35s ease,width .15s,height .15s;left:-60px;top:-60px;
                        box-shadow:0 0 0 2px rgba(255,255,255,.7)}
                    #__sc_cursor.down{width:16px;height:16px;background:rgba(249,115,22,.75)}
                    .__sc_ripple{position:fixed;z-index:2147483646;width:16px;height:16px;border-radius:50%;pointer-events:none;
                        border:3px solid #F97316;transform:translate(-50%,-50%);animation:__sc_r .6s ease-out forwards}
                    @keyframes __sc_r{to{width:70px;height:70px;opacity:0}}`;
                document.head.appendChild(style);
                const c = document.createElement('div');
                c.id = '__sc_cursor';
                document.body.appendChild(c);
                const last = (window as any).__sc_last;
                if (last) { c.style.left = last[0] + 'px'; c.style.top = last[1] + 'px'; }
                const move = (x: number, y: number) => { c.style.left = x + 'px'; c.style.top = y + 'px'; try { sessionStorage.setItem('__sc_last', JSON.stringify([x, y])); } catch { /* */ } };
                try { const s = JSON.parse(sessionStorage.getItem('__sc_last') || 'null'); if (s) move(s[0], s[1]); } catch { /* */ }
                const ripple = (x: number, y: number) => {
                    const r = document.createElement('div');
                    r.className = '__sc_ripple'; r.style.left = x + 'px'; r.style.top = y + 'px';
                    document.body.appendChild(r); setTimeout(() => r.remove(), 700);
                };
                document.addEventListener('mousemove', e => move(e.clientX, e.clientY), true);
                document.addEventListener('pointerdown', e => { move(e.clientX, e.clientY); c.classList.add('down'); ripple(e.clientX, e.clientY); }, true);
                document.addEventListener('pointerup', () => c.classList.remove('down'), true);
                document.addEventListener('touchstart', e => { const t = e.touches[0]; if (t) { move(t.clientX, t.clientY); ripple(t.clientX, t.clientY); } c.classList.add('down'); }, true);
                document.addEventListener('touchend', () => c.classList.remove('down'), true);
            };
            if (document.body) install();
            else document.addEventListener('DOMContentLoaded', install);
        });
    }

    /** Inizio effettivo del capitolo: tutto ciò che precede (login, caricamento) viene tagliato. */
    begin() {
        this.began = Date.now();
    }

    private now() { return (Date.now() - this.began) / 1000; }

    private async finishScene() {
        if (!this.sceneStart) return;
        const left = this.sceneNeed - (Date.now() - this.sceneStart);
        if (left > 0) await this.page.waitForTimeout(FAST ? 50 : left);
        this.sceneStart = 0;
    }

    /**
     * Nuova scena di voce fuori campo. Le azioni partono subito; la scena dura almeno
     * il tempo di lettura del testo + 1,2 s di respiro (minimo extra con minMs).
     */
    async say(text: string, actions?: () => Promise<void>, minMs = 0) {
        await this.finishScene();
        if (!this.began) this.begin();
        this.scenes.push({ at: +this.now().toFixed(1), text });
        const words = text.split(/\s+/).filter(Boolean).length;
        this.sceneStart = Date.now();
        this.sceneNeed = Math.max(minMs, (words / WORDS_PER_SEC) * 1000 + 1200);
        if (actions) await actions();
    }

    async pause(ms = 1500) { await this.page.waitForTimeout(FAST ? Math.min(ms, 150) : ms); }

    async moveTo(target: Locator) {
        await target.scrollIntoViewIfNeeded().catch(() => {});
        const box = await target.boundingBox();
        if (box) await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: FAST ? 2 : 18 });
        return box;
    }

    /** Porta il cursore sull'elemento senza cliccare (per indicarlo mentre la voce lo spiega). */
    async point(target: Locator, holdMs = 1200) {
        await this.moveTo(target);
        await this.pause(holdMs);
    }

    /** Come point(), ma salta in silenzio se l'elemento non c'è (dati che dipendono dalla giornata). */
    async pointIf(target: Locator, holdMs = 1200) {
        if (await target.first().isVisible().catch(() => false)) await this.point(target.first(), holdMs);
        else await this.pause(holdMs);
    }

    async click(target: Locator, pauseMs = 1500) {
        await this.moveTo(target);
        await this.pause(350);
        await target.click();
        await this.pause(pauseMs);
    }

    async type(target: Locator, text: string, pauseMs = 900) {
        await this.click(target, 250);
        await target.pressSequentially(text, { delay: FAST ? 5 : 70 });
        await this.pause(pauseMs);
    }

    async fill(target: Locator, text: string, pauseMs = 900) {
        await this.click(target, 250);
        await target.fill('');
        await target.pressSequentially(text, { delay: FAST ? 5 : 70 });
        await this.pause(pauseMs);
    }

    /** Scorrimento lento con la rotella (desktop) o con scrollBy (mobile/touch). */
    async scroll(distance = 600, steps = 8, el?: Locator) {
        for (let i = 0; i < steps; i++) {
            if (el) await el.evaluate((n, d) => n.scrollBy(0, d), distance / steps);
            else await this.page.evaluate(d => window.scrollBy({ top: d, behavior: 'instant' as ScrollBehavior }), distance / steps);
            await this.page.waitForTimeout(FAST ? 10 : 160);
        }
        await this.pause(500);
    }

    async scrollTop() {
        await this.page.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
        await this.pause(900);
    }

    async goto(url: string, settleMs = 1800) {
        await this.page.goto(url.startsWith('http') ? url : APP + url);
        await this.page.waitForLoadState('domcontentloaded');
        await this.pause(settleMs);
    }

    async shot(name: string) {
        const dir = path.resolve('screencast-shots/guide');
        fs.mkdirSync(dir, { recursive: true });
        await this.page.screenshot({ path: path.join(dir, `${this.id}--${name}.png`) });
    }

    /** Chiude la pagina e salva video + scene. */
    async finish(tailMs = 1500) {
        await this.finishScene();
        await this.pause(tailMs);
        const end = this.now();
        fs.mkdirSync(OUT, { recursive: true });
        const trim = (this.began - this.created) / 1000;
        const video = this.page.video();
        await this.page.close();
        if (video && !FAST) await video.saveAs(path.join(OUT, `${this.id}.webm`));
        if (!FAST) fs.writeFileSync(path.join(OUT, `${this.id}.json`), JSON.stringify({ id: this.id, ...this.meta, trim, duration: +end.toFixed(1), scenes: this.scenes }, null, 2));
    }
}

/** Crea il capitolo: da chiamare come prima riga del test (il video parte con la pagina). */
export async function chapter(page: Page, info: TestInfo, part: string, title: string) {
    const id = info.title.split(' ')[0] + '-' + slugify(title);
    const ch = new Chapter(page, id, { part, title });
    await ch.setup();
    page.setDefaultTimeout(FAST ? 8000 : 20000);
    page.on('response', async r => {
        if (r.status() < 400 || r.url().includes('tile.openstreetmap')) return;
        const body = await r.text().catch(() => '');
        console.log(`[${id}] HTTP ${r.status()} ${r.request().method()} ${r.url()} ${(r.request().postData() ?? '').slice(0, 400)} -> ${body.slice(0, 300)}`);
    });
    page.on('pageerror', e => console.log(`[${id}] PAGEERROR ${e.message}`));
    return ch;
}

export function slugify(s: string) {
    return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
}

/**
 * Chiude un tavolo usato dalla guida e annulla le comande ancora aperte create dopo `sinceMs`
 * (come fa la chiusura dalla dashboard per gli ordini QR mai accettati), così non restano in Sala/Cassa.
 */
export async function cleanupTable(tableId: number, token: string, sinceMs: number) {
    const all = await api('/api/dashboard/getAll', 'GET', token, undefined, WEBFLUX);
    const tc = await api('/api/orders/to-checkout', 'GET', token);
    const done: any[] = Array.isArray(tc.json) ? tc.json : (tc.json?.data ?? []);
    const rows: any[] = [...(all.json?.comands ?? []), ...done].filter((c: any) => c.idTable === tableId);
    for (const c of rows) {
        const created = c.createdAt ? new Date(c.createdAt).getTime() : 0;
        if (c.status !== 'DELETED' && created >= sinceMs - 60_000) {
            await api('/api/orders/changeStatus', 'POST', token, { comandId: c.id, status: 'DELETED' });
        }
    }
    await api(`/api/tables/${tableId}/session/close`, 'POST', token);
    await api(`/api/tables/freeAndClose/${tableId}`, 'GET', token);
}
