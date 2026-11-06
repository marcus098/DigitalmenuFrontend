import { Locator, Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Utility per le guide video: cursore visibile, didascalie a schermo e
 * registro delle scene (secondi dall'inizio) per allineare poi la voce fuori campo.
 */
export class Screencast {
    private readonly start = Date.now();
    private readonly chapters: { t: number; title: string; voiceover: string }[] = [];

    constructor(private readonly page: Page, private readonly role: string) {}

    /** Da chiamare subito dopo la creazione della pagina: cursore e stile delle didascalie a ogni navigazione. */
    async setup() {
        await this.page.addInitScript(() => {
            const install = () => {
                if (document.getElementById('__sc_cursor')) return;
                const style = document.createElement('style');
                style.textContent = `
                    #__sc_cursor{position:fixed;z-index:2147483647;width:22px;height:22px;border-radius:50%;
                        background:rgba(255,90,40,.35);border:2px solid #ff5a28;pointer-events:none;
                        transform:translate(-50%,-50%);transition:left .25s ease,top .25s ease,width .15s,height .15s;left:-50px;top:-50px}
                    #__sc_cursor.down{width:14px;height:14px;background:rgba(255,90,40,.7)}
                    #__sc_caption{position:fixed;z-index:2147483646;left:50%;bottom:28px;transform:translateX(-50%);
                        max-width:86vw;padding:12px 22px;border-radius:14px;background:rgba(15,15,20,.86);color:#fff;
                        font:600 clamp(14px,2.2vw,22px)/1.35 system-ui,-apple-system,sans-serif;text-align:center;
                        box-shadow:0 8px 30px rgba(0,0,0,.35);pointer-events:none;opacity:0;transition:opacity .3s}
                    #__sc_caption.on{opacity:1}`;
                document.head.appendChild(style);
                const c = document.createElement('div');
                c.id = '__sc_cursor';
                document.body.appendChild(c);
                const move = (e: MouseEvent | Touch) => { c.style.left = e.clientX + 'px'; c.style.top = e.clientY + 'px'; };
                document.addEventListener('mousemove', move, true);
                document.addEventListener('mousedown', e => { move(e); c.classList.add('down'); }, true);
                document.addEventListener('mouseup', () => c.classList.remove('down'), true);
                document.addEventListener('touchstart', e => { if (e.touches[0]) move(e.touches[0]); c.classList.add('down'); }, true);
                document.addEventListener('touchend', () => c.classList.remove('down'), true);
            };
            if (document.body) install();
            else document.addEventListener('DOMContentLoaded', install);
        });
    }

    /** Nuova scena: mostra la didascalia e registra il testo della voce fuori campo. */
    async scene(title: string, voiceover: string, holdMs = 2500) {
        this.chapters.push({ t: +((Date.now() - this.start) / 1000).toFixed(1), title, voiceover });
        await this.caption(title);
        await this.page.waitForTimeout(holdMs);
    }

    async caption(text: string | null) {
        await this.page.evaluate(t => {
            let el = document.getElementById('__sc_caption');
            if (!el) {
                el = document.createElement('div');
                el.id = '__sc_caption';
                document.body.appendChild(el);
            }
            if (t) { el.textContent = t; el.classList.add('on'); } else el.classList.remove('on');
        }, text).catch(() => {});
    }

    /** Sposta il cursore visibile sull'elemento, poi clicca. */
    async click(target: Locator, pauseMs = 700) {
        await target.scrollIntoViewIfNeeded();
        const box = await target.boundingBox();
        if (box) await this.page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 12 });
        await this.page.waitForTimeout(300);
        await target.click();
        await this.page.waitForTimeout(pauseMs);
    }

    /** Digita come una persona (visibile nel video). */
    async type(target: Locator, text: string) {
        await this.click(target, 200);
        await target.pressSequentially(text, { delay: 60 });
    }

    async pause(ms = 1500) {
        await this.page.waitForTimeout(ms);
    }

    /** Scorre lentamente la pagina per mostrarne il contenuto. */
    async scroll(distance = 600, steps = 6) {
        for (let i = 0; i < steps; i++) {
            await this.page.mouse.wheel(0, distance / steps);
            await this.page.waitForTimeout(250);
        }
    }

    /** Chiude la pagina e salva video + scene in screencast-videos/ (fuori da outputDir, che Playwright svuota). */
    async finish() {
        await this.caption(null);
        await this.pause(1000);
        const dir = path.resolve('screencast-videos');
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, `${this.role}.chapters.json`), JSON.stringify(this.chapters, null, 2));
        const video = this.page.video();
        await this.page.close();
        if (video) await video.saveAs(path.join(dir, `${this.role}.webm`));
    }
}
