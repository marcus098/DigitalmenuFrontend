/**
 * Monta la guida video DineUp dai capitoli registrati con playwright.guide.config.ts.
 *   node scripts/guide/build-guide.mjs [--only 07,08] [--skip-chapters]
 * Input : screencast-videos/guide/NN-*.webm + .json
 * Output: OUT_DIR (default Commerciale/DineUp/video-guida-web)
 *   NN-titolo.mp4 (cartello + capitolo, nel formato originale: telefono 780x1688 o desktop 1440x900)
 *   parti/Parte-N-*.mp4, DineUp-guida-web-completa.mp4 (1440x900; i capitoli da telefono composti su sfondo)
 *   chapters.json, capitoli.md
 */
import { chromium } from '@playwright/test';
import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'screencast-videos/guide');
const OUT = process.env.OUT_DIR ?? path.resolve(ROOT, '../Commerciale/DineUp/video-guida-web');
const WORK = path.join(ROOT, 'screencast-output/guide-build');
const CARD_S = 2.5;
const FPS = 30;
const CRF = '21';
const args = process.argv.slice(2);
const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null;
const skipChapters = args.includes('--skip-chapters');

const PARTS = {
    Cliente: { n: 1, name: 'Il cliente', sub: 'Menu digitale, ordini e consegne dal telefono' },
    Cameriere: { n: 2, name: 'Il cameriere', sub: 'Sala, ordini e comande dal browser' },
    Titolare: { n: 3, name: 'Il titolare', sub: 'La dashboard del ristorante, area per area' },
};

fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(OUT, 'parti'), { recursive: true });
fs.mkdirSync(WORK, { recursive: true });

const ff = (...a) => execFileSync('ffmpeg', ['-loglevel', 'error', '-y', ...a], { stdio: 'inherit' });
const probeDur = f => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim();
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const chapters = fs.readdirSync(SRC).filter(f => /^\d\d-.*\.json$/.test(f)).sort()
    .map(f => JSON.parse(fs.readFileSync(path.join(SRC, f), 'utf8')))
    .filter(c => fs.existsSync(path.join(SRC, c.id + '.webm')));
if (!chapters.length) throw new Error('Nessun capitolo in ' + SRC);

const logoSvg = fs.readFileSync(path.join(ROOT, 'public/brand/dineup-logo.svg'), 'utf8');
const logoUri = 'data:image/svg+xml;base64,' + Buffer.from(logoSvg).toString('base64');
const fontCss = `@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Fraunces:opsz,wght@9..144,600&display=swap');`;

function cardHtml(c, w, h) {
    const P = PARTS[c.part];
    const portrait = h > w;
    const s = portrait ? w / 780 : w / 1440;
    return `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}
    *{margin:0;box-sizing:border-box}
    body{width:${w}px;height:${h}px;background:#FBF7F3;color:#2A1F18;font-family:'DM Sans',system-ui,sans-serif;
      display:flex;flex-direction:column;justify-content:center;padding:0 ${portrait ? 70 * s : 140 * s}px;position:relative;overflow:hidden}
    .glow{position:absolute;width:${900 * s}px;height:${900 * s}px;border-radius:50%;right:${-300 * s}px;top:${-300 * s}px;
      background:radial-gradient(circle,rgba(249,115,22,.16),rgba(249,115,22,0) 65%)}
    .logo{height:${(portrait ? 90 : 64) * s}px;position:absolute;top:${(portrait ? 120 : 70) * s}px;left:${portrait ? 70 * s : 140 * s}px}
    .part{font-size:${(portrait ? 34 : 26) * s}px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#F97316}
    .num{font-size:${(portrait ? 30 : 24) * s}px;font-weight:500;letter-spacing:.06em;margin-top:${18 * s}px;color:#8a776a}
    h1{font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:${(portrait ? 76 : 70) * s}px;line-height:1.08;margin-top:${18 * s}px;max-width:${portrait ? 660 * s : 1100 * s}px}
    .bar{width:${90 * s}px;height:${8 * s}px;border-radius:9px;background:#F97316;margin-top:${36 * s}px}
    .sub{font-size:${(portrait ? 32 : 26) * s}px;color:#6b5a4e;margin-top:${24 * s}px}
    .foot{position:absolute;bottom:${(portrait ? 110 : 60) * s}px;left:${portrait ? 70 * s : 140 * s}px;font-size:${(portrait ? 26 : 20) * s}px;color:#8a776a}
    </style></head><body><div class="glow"></div><img class="logo" src="${logoUri}">
    <div class="part">Parte ${P.n} · ${esc(P.name)}</div>
    <div class="num">Capitolo ${c.num}</div>
    <h1>${esc(c.title)}</h1><div class="bar"></div>
    <div class="sub">${esc(P.sub)}</div>
    <div class="foot">Guida all'uso di DineUp · versione web</div>
    </body></html>`;
}

/** Sfondo 1440x900 per i capitoli da telefono nella versione orizzontale. */
function phoneBgHtml(c) {
    const P = PARTS[c.part];
    return `<!doctype html><html><head><meta charset="utf-8"><style>${fontCss}
    *{margin:0;box-sizing:border-box}
    body{width:1440px;height:900px;background:#FBF7F3;color:#2A1F18;font-family:'DM Sans',system-ui,sans-serif;position:relative;overflow:hidden}
    .glow{position:absolute;width:1000px;height:1000px;border-radius:50%;left:-380px;bottom:-460px;background:radial-gradient(circle,rgba(249,115,22,.13),rgba(249,115,22,0) 65%)}
    .left{position:absolute;left:110px;top:0;bottom:0;width:560px;display:flex;flex-direction:column;justify-content:center}
    .logo{height:52px;position:absolute;top:64px;left:110px}
    .part{font-size:20px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#F97316}
    h1{font-family:'Fraunces',Georgia,serif;font-weight:600;font-size:50px;line-height:1.1;margin-top:18px}
    .bar{width:70px;height:7px;border-radius:9px;background:#F97316;margin-top:28px}
    .num{font-size:22px;color:#8a776a;margin-top:22px}
    .phone{position:absolute;left:894px;top:9px;width:416px;height:882px;border-radius:18px;background:#2A1F18;
      box-shadow:0 30px 60px rgba(42,31,24,.25)}
    </style></head><body><div class="glow"></div><img class="logo" src="${logoUri}">
    <div class="left"><div class="part">Parte ${P.n} · ${esc(P.name)}</div><h1>${esc(c.title)}</h1><div class="bar"></div>
    <div class="num">Capitolo ${c.num}</div></div><div class="phone"></div></body></html>`;
}

async function renderPngs(list) {
    const browser = await chromium.launch({ channel: 'msedge' });
    const page = await browser.newPage();
    for (const c of list) {
        const jobs = [[c.portrait ? cardHtml(c, 780, 1688) : null, 780, 1688, 'card-p'], [cardHtml(c, 1440, 900), 1440, 900, 'card-l']];
        if (c.portrait) jobs.push([phoneBgHtml(c), 1440, 900, 'bg']);
        for (const [html, w, h, kind] of jobs) {
            if (!html) continue;
            await page.setViewportSize({ width: w, height: h });
            await page.setContent(html, { waitUntil: 'networkidle' });
            await page.evaluate(() => document.fonts.ready);
            await page.waitForTimeout(150);
            await page.screenshot({ path: path.join(WORK, `${c.id}.${kind}.png`) });
        }
    }
    await browser.close();
}

const enc = ['-c:v', 'libx264', '-preset', 'medium', '-crf', CRF, '-pix_fmt', 'yuv420p', '-r', String(FPS),
    '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-ac', '2'];

function cardClip(png, out) {
    ff('-loop', '1', '-t', String(CARD_S), '-i', png, '-f', 'lavfi', '-t', String(CARD_S), '-i', 'anullsrc=r=48000:cl=stereo',
        '-vf', `fade=t=in:st=0:d=0.35,fade=t=out:st=${CARD_S - 0.35}:d=0.35,format=yuv420p`, ...enc, '-shortest', out);
}

function bodyClip(c, out, landscape) {
    const src = path.join(SRC, c.id + '.webm');
    const dur = c.duration;
    const cut = ['-ss', String(Math.max(0, c.trim)), '-t', String(dur), '-i', src];
    const audio = ['-f', 'lavfi', '-t', String(dur), '-i', 'anullsrc=r=48000:cl=stereo'];
    // Playwright non ingrandisce: con video 780x1688 la pagina (390x844) occupa l'angolo in alto a sinistra
    const w = +execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width', '-of', 'csv=p=0', src]).toString().trim();
    const crop = c.portrait && w > 390 ? 'crop=390:844:0:0,' : '';
    if (!c.portrait) {
        ff(...cut, ...audio, '-filter_complex', `[0:v]fps=${FPS},scale=1440:900:flags=lanczos,fade=t=in:st=0:d=0.3,fade=t=out:st=${dur - 0.4}:d=0.4[v]`,
            '-map', '[v]', '-map', '1:a', ...enc, '-shortest', out);
    } else if (!landscape) {
        ff(...cut, ...audio, '-filter_complex', `[0:v]${crop}fps=${FPS},scale=780:1688:flags=lanczos,fade=t=in:st=0:d=0.3,fade=t=out:st=${dur - 0.4}:d=0.4[v]`,
            '-map', '[v]', '-map', '1:a', ...enc, '-shortest', out);
    } else {
        // telefono 390x844 → 400x866 dentro la cornice disegnata sullo sfondo
        const bg = path.join(WORK, `${c.id}.bg.png`);
        ff(...cut, '-loop', '1', '-t', String(dur), '-i', bg, ...audio, '-filter_complex',
            `[0:v]${crop}fps=${FPS},scale=400:866:flags=lanczos[ph];` +
            `[1:v]fps=${FPS}[bg];[bg][ph]overlay=x=902:y=17:shortest=1,fade=t=in:st=0:d=0.3,fade=t=out:st=${dur - 0.4}:d=0.4,format=yuv420p[v]`,
            '-map', '[v]', '-map', '2:a', ...enc, '-shortest', out);
    }
}

function concat(files, out) {
    const list = path.join(WORK, path.basename(out) + '.txt');
    fs.writeFileSync(list, files.map(f => `file '${f.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`).join('\n'));
    // stessi parametri di codifica in tutti i pezzi: concatenazione senza ricodifica + faststart
    execFileSync('ffmpeg', ['-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-movflags', '+faststart', out], { stdio: 'inherit' });
}

const ts = s => { s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };

// numerazione globale e metadati
chapters.forEach(c => {
    c.num = c.id.slice(0, 2);
    c.portrait = c.part === 'Cliente';
});

const todo = chapters.filter(c => !only || only.includes(c.num));
if (!skipChapters) {
    await renderPngs(todo);
    for (const c of todo) {
        console.log('capitolo', c.id);
        const cardL = path.join(WORK, `${c.id}.card-l.mp4`);
        const bodyL = path.join(WORK, `${c.id}.body-l.mp4`);
        cardClip(path.join(WORK, `${c.id}.card-l.png`), cardL);
        bodyClip(c, bodyL, true);
        if (c.portrait) {
            const cardP = path.join(WORK, `${c.id}.card-p.mp4`);
            const bodyP = path.join(WORK, `${c.id}.body-p.mp4`);
            cardClip(path.join(WORK, `${c.id}.card-p.png`), cardP);
            bodyClip(c, bodyP, false);
            concat([cardP, bodyP], path.join(OUT, `${c.id}.mp4`));
        } else {
            concat([cardL, bodyL], path.join(OUT, `${c.id}.mp4`));
        }
    }
}

// versioni orizzontali per parti e guida completa
const landscapeOf = c => [path.join(WORK, `${c.id}.card-l.mp4`), path.join(WORK, `${c.id}.body-l.mp4`)];
let t = 0;
const out = { product: 'DineUp', title: "Guida all'uso di DineUp — versione web", generated: new Date().toISOString(),
    words_per_second: 2.5, title_card_seconds: CARD_S, full_video: 'DineUp-guida-web-completa.mp4', parts: [], chapters: [] };
for (const [partKey, P] of Object.entries(PARTS)) {
    const list = chapters.filter(c => c.part === partKey);
    if (!list.length) continue;
    const partFile = `parti/Parte-${P.n}-${partKey}.mp4`;
    concat(list.flatMap(landscapeOf), path.join(OUT, partFile));
    const partStart = t;
    let pt = 0;
    for (const c of list) {
        const chapterFile = path.join(OUT, `${c.id}.mp4`);
        const total = probeDur(chapterFile);
        const landDur = landscapeOf(c).map(probeDur).reduce((a, b) => a + b, 0);
        const scenes = c.scenes.map((s, i) => {
            const end = i + 1 < c.scenes.length ? c.scenes[i + 1].at : c.duration;
            const win = +(end - s.at).toFixed(1);
            const words = s.text.split(/\s+/).length;
            return { at_seconds: +(s.at + CARD_S).toFixed(1), window_seconds: win, words, fits: words / 2.5 <= win + 0.05, text: s.text,
                full_video_seconds: +(t + s.at + CARD_S).toFixed(1), part_video_seconds: +(pt + s.at + CARD_S).toFixed(1) };
        });
        out.chapters.push({
            file: `${c.id}.mp4`, part: `Parte ${P.n} · ${P.name}`, part_key: partKey, number: +c.num, title: c.title,
            format: c.portrait ? 'telefono 780x1688 (schermo 390x844 ingrandito 2x)' : 'desktop 1440x900',
            duration_seconds: +total.toFixed(1),
            start_in_full: +t.toFixed(1), end_in_full: +(t + landDur).toFixed(1),
            start_in_part: +pt.toFixed(1), end_in_part: +(pt + landDur).toFixed(1),
            title_card: { from: 0, to: CARD_S, text: `Parte ${P.n}, ${P.name}. Capitolo ${+c.num}: ${c.title}.` },
            voiceover: scenes,
        });
        t += landDur; pt += landDur;
    }
    out.parts.push({ part: P.n, name: P.name, file: partFile, start_in_full: +partStart.toFixed(1), end_in_full: +t.toFixed(1), duration_seconds: +(t - partStart).toFixed(1) });
}
concat(chapters.flatMap(landscapeOf), path.join(OUT, out.full_video));
out.total_seconds = +probeDur(path.join(OUT, out.full_video)).toFixed(1);
fs.writeFileSync(path.join(OUT, 'chapters.json'), JSON.stringify(out, null, 2));

// capitoli.md (timestamp stile YouTube)
let md = `# DineUp — Guida all'uso (versione web)\n\nDurata totale: ${ts(out.total_seconds)} · ${out.chapters.length} capitoli\n\n## Capitoli (per la descrizione di YouTube)\n\n`;
for (const p of out.parts) {
    md += `\n**Parte ${p.part} · ${p.name}**\n`;
    for (const c of out.chapters.filter(c => c.part.startsWith(`Parte ${p.part} `))) md += `${ts(c.start_in_full)} ${String(c.number).padStart(2, '0')}. ${c.title}\n`;
}
md += `\n## File\n\n- Guida completa: \`${out.full_video}\`\n` + out.parts.map(p => `- Parte ${p.part} (${ts(p.duration_seconds)}): \`${p.file}\``).join('\n') +
    `\n- Capitoli singoli: \`NN-titolo.mp4\` (cliente in verticale 780x1688, cameriere e titolare 1440x900)\n- Testi della voce fuori campo con i tempi: \`chapters.json\`\n`;
fs.writeFileSync(path.join(OUT, 'capitoli.md'), md);
console.log('Totale', ts(out.total_seconds), '→', OUT);
