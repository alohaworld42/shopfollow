import { test, expect } from '@playwright/test';

test.describe('Basic Navigation', () => {
    test('should load welcome page', async ({ page }) => {
        await page.goto('/welcome');
        await expect(page.getByText('CartConnect')).toBeVisible();
    });

    test('should redirect to welcome if not logged in', async ({ page }) => {
        await page.goto('/feed');
        await expect(page).toHaveURL(/\/welcome/);
    });
});
