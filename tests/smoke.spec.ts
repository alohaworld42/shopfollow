import { test, expect } from '@playwright/test';

test('full app check - no critical errors', async ({ page }) => {
    const errors: string[] = [];
    const failedHttp: string[] = [];

    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(`[UNCAUGHT] ${err.message}`));
    page.on('response', res => {
        if (res.status() >= 400) failedHttp.push(`${res.status()} ${res.url()}`);
    });

    // Check welcome page
    await page.goto('http://localhost:5173/', { timeout: 15000 });
    await page.waitForTimeout(4000);

    // Check login page
    await page.goto('http://localhost:5173/login', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Check signup page
    await page.goto('http://localhost:5173/signup', { timeout: 15000 });
    await page.waitForTimeout(2000);

    // Assert: no AbortErrors
    const abortErrors = errors.filter(e => e.includes('AbortError'));
    expect(abortErrors, 'AbortErrors found').toHaveLength(0);

    // Assert: no 400 Bad Requests
    const http400s = failedHttp.filter(r => r.startsWith('400'));
    expect(http400s, '400 requests found').toHaveLength(0);

    // Assert: no uncaught exceptions
    const uncaught = errors.filter(e => e.includes('[UNCAUGHT]'));
    expect(uncaught, 'Uncaught exceptions found').toHaveLength(0);
});
