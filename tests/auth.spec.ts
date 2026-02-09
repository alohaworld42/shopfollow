import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
    test('should allow navigation to login page', async ({ page }) => {
        await page.goto('/welcome');
        await page.getByRole('button', { name: 'Sign In' }).click();
        await expect(page).toHaveURL(/\/login/);
        await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible();
    });

    test('should allow navigation to signup page', async ({ page }) => {
        await page.goto('/welcome');
        await page.click('text=Get Started');
        await expect(page).toHaveURL(/\/signup/);
    });

    test('should show form fields on login page', async ({ page }) => {
        await page.goto('/login');
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    });

    test('should show signup page with form', async ({ page }) => {
        await page.goto('/signup');
        // Check basic form elements are present
        await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible();
    });

    test('should navigate between login and signup', async ({ page }) => {
        // Login to Signup
        await page.goto('/login');
        await page.click('text=Sign Up');
        await expect(page).toHaveURL(/\/signup/);

        // Signup to Login
        await page.click('text=Sign In');
        await expect(page).toHaveURL(/\/login/);
    });
});
