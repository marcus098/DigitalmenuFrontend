import { defineConfig, devices } from '@playwright/test';

/**
 * Registrazione delle guide video (cameriere, titolare, cliente).
 * Richiede frontend su SCREENCAST_URL (default http://localhost:5173) e backend avviati.
 * Avvio: npx playwright test -c playwright.screencast.config.ts
 * Video e tempi delle scene in screencast-videos/<ruolo>.webm e <ruolo>.chapters.json
 */
const baseURL = process.env.SCREENCAST_URL ?? 'http://localhost:5173';

export default defineConfig({
    testDir: './tests/screencast',
    // Cartella per ruolo (SC_ROLE): più registrazioni in parallelo non si cancellano a vicenda.
    outputDir: `./screencast-output/${process.env.SC_ROLE ?? 'all'}`,
    timeout: 10 * 60_000,
    workers: 1,
    retries: 0,
    reporter: [['list']],
    use: {
        baseURL,
        locale: 'it-IT',
        timezoneId: 'Europe/Rome',
        // Chromium di Playwright non è installato: si usa Edge (anche per il profilo iPhone, che di default sarebbe WebKit).
        browserName: 'chromium',
        channel: 'msedge',
        launchOptions: { slowMo: 250 },
    },
    projects: [
        {
            name: 'desktop',
            testMatch: /owner\.spec\.ts/,
            use: {
                ...devices['Desktop Chrome'],
                viewport: { width: 1440, height: 900 },
                video: { mode: 'on', size: { width: 1440, height: 900 } },
            },
        },
        {
            name: 'mobile',
            testMatch: /(client|waiter)\.spec\.ts/,
            use: {
                ...devices['iPhone 14'],
                browserName: 'chromium',
                channel: 'msedge',
                video: { mode: 'on', size: { width: 390, height: 844 } },
            },
        },
    ],
});
