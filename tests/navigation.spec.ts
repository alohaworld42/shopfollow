import { test, expect } from '@playwright/test';

test.describe('Basic Navigation', () => {
    test('should load welcome page', async ({ page }) => {
        await page.goto('/welcome');
        // Check for app branding - currently "CartConnect"
        await expect(page.getByText('CartConnect').first()).toBeVisible({ timeout: 5000 });
    });

    test('should redirect to welcome if not logged in', async ({ page }) => {
        await page.goto('/feed');
        await expect(page).toHaveURL(/\/(welcome|login)/);
    });

    test('should have get started link', async ({ page }) => {
        await page.goto('/welcome');
        await expect(page.getByText('Get Started').first()).toBeVisible();
    });
});
