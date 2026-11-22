import { defineConfig, devices } from '@playwright/test';

/**
 * Guida video DineUp per capitoli (un test = un capitolo = un video).
 * Avvio: npx playwright test -c playwright.guide.config.ts --project=cliente|cameriere|titolare [-g "^07 "]
 * Output: screencast-videos/guide/NN-titolo.webm + .json, poi scripts/guide/build-guide.mjs
 */
const baseURL = process.env.SCREENCAST_URL ?? 'http://localhost:5173';
const FAST = process.env.FAST === '1';

export default defineConfig({
    testDir: './tests/screencast/guide',
    outputDir: `./screencast-output/guide-${process.env.SC_ROLE ?? 'all'}`,
    timeout: 8 * 60_000,
    workers: 1,
    retries: 0,
    reporter: [['list']],
    use: {
        baseURL,
        locale: 'it-IT',
        timezoneId: 'Europe/Rome',
        browserName: 'chromium',
        channel: 'msedge',
        actionTimeout: FAST ? 8_000 : 20_000,
        navigationTimeout: 30_000,
    },
    projects: [
        {
            name: 'cliente',
            testMatch: /cliente\.spec\.ts/,
            use: {
                ...devices['iPhone 14'],
                browserName: 'chromium',
                channel: 'msedge',
                viewport: { width: 390, height: 844 },
                deviceScaleFactor: 2,
                // Playwright non ingrandisce i fotogrammi: il video resta 390x844 (il montaggio lo porta a 780x1688)
                video: FAST ? 'off' : { mode: 'on', size: { width: 390, height: 844 } },
            },
        },
        {
            name: 'cameriere',
            testMatch: /cameriere\.spec\.ts/,
            use: {
                ...devices['Desktop Chrome'],
                channel: 'msedge',
                viewport: { width: 1440, height: 900 },
                video: FAST ? 'off' : { mode: 'on', size: { width: 1440, height: 900 } },
            },
        },
        {
            name: 'titolare',
            testMatch: /titolare\.spec\.ts/,
            use: {
                ...devices['Desktop Chrome'],
                channel: 'msedge',
                viewport: { width: 1440, height: 900 },
                video: FAST ? 'off' : { mode: 'on', size: { width: 1440, height: 900 } },
            },
        },
    ],
});
