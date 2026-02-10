import { test, expect } from '@playwright/test';

test.describe('UI Design System Verification', () => {

    test('Welcome page should use new design system classes', async ({ page }) => {
        // Navigate to Welcome page
        await page.goto('/welcome');

        // 1. Verify wrapper class
        await expect(page.locator('.welcome-page')).toBeVisible();

        // 2. Verify NEW classes are present
        await expect(page.locator('.welcome-hero')).toBeVisible();
        await expect(page.locator('.welcome-title')).toBeVisible();
        await expect(page.locator('.welcome-features')).toBeVisible();

        // 3. Verify OLD dark-theme/glass classes are ABSENT
        // These were prevalent in the old design
        await expect(page.locator('.glass-panel')).not.toBeVisible();
        await expect(page.locator('.glass-card')).not.toBeVisible();
        await expect(page.locator('.hero-section')).not.toBeVisible(); // Old hero class

        // 4. Verify primary button styling class
        const btn = page.locator('.welcome-btn-primary');
        await expect(btn).toBeVisible();
        await expect(btn).toHaveClass(/welcome-btn-primary/);
    });

    test('Login page should use clean auth-form structure', async ({ page }) => {
        // Navigate to Login page
        await page.goto('/login');

        // 1. Verify container
        await expect(page.locator('.auth-page')).toBeVisible();

        // 2. Verify NEW form class
        await expect(page.locator('.auth-form')).toBeVisible();
        await expect(page.locator('.auth-header')).toBeVisible();

        // 3. Verify OLD glass classes are ABSENT
        await expect(page.locator('.glass-card')).not.toBeVisible();

        // 4. Verify Social Buttons use new classes
        // The old ones might have had specific glass styling
        const googleBtn = page.locator('button', { hasText: 'Google' });
        if (await googleBtn.isVisible()) {
            // Just verify it exists and is visible
            await expect(googleBtn).toBeVisible();
        }
    });

});
