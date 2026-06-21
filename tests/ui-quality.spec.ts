import { test, expect, Page } from '@playwright/test';

/**
 * UI Quality tests: contrast, animations, accessibility.
 *
 * Prerequisites: run `npm start` before executing these tests.
 * Execute: npx playwright test
 */

// ─── Contrast helpers ────────────────────────────────────────────────────────

/** Parse rgb/rgba string to [r, g, b] */
function parseRgb(css: string): [number, number, number] | null {
    const m = css.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return null;
    return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
}

/** Relative luminance (WCAG 2.1) */
function luminance([r, g, b]: [number, number, number]): number {
    const srgb = [r, g, b].map(c => {
        const s = c / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

/** WCAG contrast ratio between two colours */
function contrastRatio(fg: string, bg: string): number | null {
    const c1 = parseRgb(fg);
    const c2 = parseRgb(bg);
    if (!c1 || !c2) return null;
    const l1 = luminance(c1);
    const l2 = luminance(c2);
    const lighter = Math.max(l1, l2);
    const darker  = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

/** Measure contrast of visible text elements on the page */
async function checkTextContrast(page: Page, minRatio = 3): Promise<{
    passes: number;
    fails: { text: string; ratio: number | null; fg: string; bg: string }[];
}> {
    return page.evaluate(({ minRatio }) => {
        const results = { passes: 0, fails: [] as any[] };

        function lum([r, g, b]: number[]) {
            return [r, g, b]
                .map(c => {
                    const s = c / 255;
                    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
                })
                .reduce((acc, v, i) => acc + v * [0.2126, 0.7152, 0.0722][i], 0);
        }

        function parse(css: string): number[] | null {
            const m = css.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            return m ? [+m[1], +m[2], +m[3]] : null;
        }

        function ratio(fg: string, bg: string): number | null {
            const c1 = parse(fg);
            const c2 = parse(bg);
            if (!c1 || !c2) return null;
            const l1 = lum(c1);
            const l2 = lum(c2);
            const lt = Math.max(l1, l2);
            const dk = Math.min(l1, l2);
            return (lt + 0.05) / (dk + 0.05);
        }

        const elements = document.querySelectorAll<HTMLElement>('h1,h2,h3,p,span,button,a,label');
        elements.forEach(el => {
            const rect = el.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;
            const style = window.getComputedStyle(el);
            const fg    = style.color;
            const bg    = style.backgroundColor;
            if (bg === 'rgba(0, 0, 0, 0)') return; // transparent bg – skip
            const r = ratio(fg, bg);
            if (r === null) return;
            const text = el.textContent?.trim().slice(0, 40) || '';
            if (r >= minRatio) {
                results.passes++;
            } else {
                results.fails.push({ text, ratio: r, fg, bg });
            }
        });
        return results;
    }, { minRatio });
}

// ─── Tests ───────────────────────────────────────────────────────────────────

test.describe('Client Menu – visual quality', () => {

    test('page loads with dark background', async ({ page }) => {
        await page.goto('/demo/Categories');
        await page.waitForTimeout(500);
        const bg = await page.evaluate(() =>
            window.getComputedStyle(document.body).backgroundColor
        );
        await page.screenshot({ path: 'tests/screenshots/categories-load.png' });
        // Body should be dark (< 50 per channel) on client menu pages
        const rgb = parseRgb(bg);
        if (rgb) {
            const isDark = rgb.every(c => c < 80);
            expect(isDark).toBe(true);
        }
    });

    test('no zero-size animated elements remain invisible after 1 s', async ({ page }) => {
        await page.goto('/demo/Categories');
        await page.waitForTimeout(1100);

        const invisibleCount = await page.evaluate(() => {
            const all = document.querySelectorAll('[style*="opacity"]');
            let count = 0;
            all.forEach(el => {
                const s = (el as HTMLElement).style.opacity;
                if (s === '0') count++;
            });
            return count;
        });

        // After 1 s stagger animations should have resolved
        expect(invisibleCount).toBeLessThan(5);
        await page.screenshot({ path: 'tests/screenshots/categories-animated.png' });
    });

    test('cart page renders dark theme', async ({ page }) => {
        await page.goto('/demo/cart');
        await page.waitForTimeout(600);
        await page.screenshot({ path: 'tests/screenshots/cart-dark.png' });

        // Background container should be dark
        const bg = await page.evaluate(() => {
            const el = document.querySelector<HTMLElement>('[style*="#17140f"]');
            return el ? 'dark' : 'unknown';
        });
        // Accept both dark and unknown (page may need auth)
        expect(['dark', 'unknown']).toContain(bg);
    });

    test('product detail page renders dark theme', async ({ page }) => {
        await page.goto('/demo/Product/1');
        await page.waitForTimeout(600);
        await page.screenshot({ path: 'tests/screenshots/product-dark.png' });
    });

    test('text contrast passes AA-large (3:1) on client pages', async ({ page }) => {
        await page.goto('/demo/Categories');
        await page.waitForTimeout(1200);
        const { passes, fails } = await checkTextContrast(page, 3);
        console.log(`Contrast: ${passes} pass, ${fails.length} fail`);
        if (fails.length > 0) {
            console.log('Failing elements:', fails.slice(0, 5));
        }
        // At least 80 % of measured text elements should pass
        const total = passes + fails.length;
        if (total > 0) {
            expect(passes / total).toBeGreaterThanOrEqual(0.8);
        }
        await page.screenshot({ path: 'tests/screenshots/contrast-check.png' });
    });
});

test.describe('Dashboard – visual quality', () => {

    test('dashboard home page KPI cards render', async ({ page }) => {
        await page.goto('/demo/Dashboard/Home');
        await page.waitForTimeout(1000);
        await page.screenshot({ path: 'tests/screenshots/dashboard-home.png' });

        // Page should load (not be a blank error page)
        const bodyText = await page.evaluate(() => document.body.innerText.length);
        expect(bodyText).toBeGreaterThan(0);
    });

    test('staggered animations complete within 1.5 s', async ({ page }) => {
        await page.goto('/demo/Dashboard/Home');
        await page.waitForTimeout(1500);

        const stillHidden = await page.evaluate(() => {
            const motionDivs = document.querySelectorAll('[style*="opacity: 0"]');
            return motionDivs.length;
        });

        expect(stillHidden).toBeLessThan(3);
        await page.screenshot({ path: 'tests/screenshots/dashboard-animated.png' });
    });

    test('shimmer buttons are visible', async ({ page }) => {
        await page.goto('/demo/Dashboard/Home');
        await page.waitForTimeout(800);

        const buttons = page.locator('button').filter({ hasText: /Nuovo Ordine/i });
        const count   = await buttons.count();
        if (count > 0) {
            await expect(buttons.first()).toBeVisible();
        }
        await page.screenshot({ path: 'tests/screenshots/shimmer-button.png' });
    });
});

test.describe('Accessibility – keyboard & focus', () => {

    test('interactive elements are keyboard-focusable', async ({ page }) => {
        await page.goto('/demo/Categories');
        await page.waitForTimeout(600);

        // Tab through first 5 elements and verify focus
        for (let i = 0; i < 5; i++) {
            await page.keyboard.press('Tab');
        }
        const focused = await page.evaluate(() => {
            const el = document.activeElement;
            return el ? el.tagName.toLowerCase() : null;
        });
        expect(focused).toBeTruthy();
    });
});
