import { test, expect } from '@playwright/test';

test('DEBUG: Signup and Login Flow', async ({ page }) => {
    // Listen for console logs
    page.on('console', msg => console.log(`BROWSER CONSOLE: ${msg.text()}`));

    // Listen for network errors
    page.on('requestfailed', request => {
        console.log(`NETWORK FAIL: ${request.url()} - ${request.failure()?.errorText}`);
    });

    // 1. Go to Signup
    await page.goto('/signup');
    console.log('Navigated to /signup');

    // 2. Fill form
    const email = `test.user.${Date.now()}@example.com`;
    await page.fill('input[type="email"]', email);
    await page.fill('input[type="password"]', 'Password123!');
    await page.fill('input[placeholder="Display Name"]', 'Test User');

    // 3. Submit
    console.log(`Submitting signup for ${email}...`);
    await page.getByRole('button', { name: /create account/i }).click();

    // 4. Wait for result (success or error)
    // We expect either a redirect or an error message
    try {
        // Wait for either navigation to home/welcome or an alert
        await Promise.race([
            page.waitForURL('**/', { timeout: 5000 }), // Success -> redirects to home
            page.waitForSelector('.auth-error', { timeout: 5000 }), // Failure -> shows error
            page.waitForURL('**/login', { timeout: 5000 }) // Maybe redirects to login?
        ]);
        console.log('Signup action completed. Checking current URL...');
    } catch (e) {
        console.log('Timeout waiting for signup result');
    }

    console.log(`Current URL: ${page.url()}`);

    // Check for visible errors
    const error = await page.locator('.auth-error').textContent().catch(() => null);
    if (error) {
        console.log(`VISIBLE ERROR: ${error}`);
    }

    // Check if we are logged in (local storage or UI check)
    // We can check if "nav" exists which implies being inside Layout (protected)
    if (await page.locator('nav').count() > 0) {
        console.log('SUCCESS: Navigation bar found, user is logged in.');
    } else {
        console.log('INFO: Navigation bar not found (user likely not logged in).');
    }
});
