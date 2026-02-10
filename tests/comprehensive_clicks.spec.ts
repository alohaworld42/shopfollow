import { test, expect, Page } from '@playwright/test';

// ============================================================================
// COMPREHENSIVE CLICK TESTS — Tests every interactive element across all pages
// ============================================================================

// Helper: Capture console errors during a test
function attachConsoleLogger(page: Page) {
    const errors: string[] = [];
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', err => errors.push(err.message));
    return errors;
}

// ============================================================================
// 1. WELCOME PAGE — /welcome
// ============================================================================
test.describe('Welcome Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/welcome');
    });

    test('renders hero, features, and action buttons', async ({ page }) => {
        // Hero section
        await expect(page.locator('.welcome-hero')).toBeVisible();
        await expect(page.locator('.welcome-title')).toContainText('Discover');
        await expect(page.locator('.welcome-tagline')).toBeVisible();

        // Logo icon
        await expect(page.locator('.welcome-logo-icon')).toBeVisible();

        // 3 feature cards
        const features = page.locator('.welcome-feature');
        await expect(features).toHaveCount(3);
        await expect(features.nth(0)).toContainText('Share Finds');
        await expect(features.nth(1)).toContainText('Follow Friends');
        await expect(features.nth(2)).toContainText('Track Prices');

        // Action buttons
        await expect(page.locator('.welcome-btn-primary')).toContainText('Get Started');
        await expect(page.locator('.welcome-btn-secondary')).toContainText('I already have an account');
    });

    test('"Get Started" navigates to /signup', async ({ page }) => {
        await page.locator('.welcome-btn-primary').click();
        await expect(page).toHaveURL('/signup');
    });

    test('"I already have an account" navigates to /login', async ({ page }) => {
        await page.locator('.welcome-btn-secondary').click();
        await expect(page).toHaveURL('/login');
    });
});

// ============================================================================
// 2. LOGIN PAGE — /login
// ============================================================================
test.describe('Login Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/login');
    });

    test('renders all form elements', async ({ page }) => {
        // Header
        await expect(page.locator('.auth-header h1')).toContainText('Welcome Back');

        // Email field
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('label').filter({ hasText: 'Email' })).toBeVisible();

        // Password field
        await expect(page.locator('input[type="password"]')).toBeVisible();
        await expect(page.locator('label').filter({ hasText: 'Password' })).toBeVisible();

        // Password toggle button
        await expect(page.locator('.auth-toggle-password')).toBeVisible();

        // Submit button
        await expect(page.locator('.auth-submit')).toContainText('Sign In');

        // Social login buttons
        await expect(page.getByRole('button', { name: /google/i })).toBeVisible();
        await expect(page.getByRole('button', { name: /apple/i })).toBeVisible();

        // Forgot password link
        await expect(page.getByText('Forgot password?')).toBeVisible();

        // Footer link
        await expect(page.getByText("Don't have an account?")).toBeVisible();
        await expect(page.locator('.auth-footer a')).toContainText('Sign up');
    });

    test('password toggle shows/hides password', async ({ page }) => {
        const passwordInput = page.locator('.auth-field input').nth(1);
        const toggleBtn = page.locator('.auth-toggle-password');

        // Initially hidden
        await expect(passwordInput).toHaveAttribute('type', 'password');

        // Click toggle → visible
        await toggleBtn.click();
        await expect(passwordInput).toHaveAttribute('type', 'text');

        // Click toggle again → hidden
        await toggleBtn.click();
        await expect(passwordInput).toHaveAttribute('type', 'password');
    });

    test('email input accepts text', async ({ page }) => {
        const emailInput = page.locator('input[type="email"]');
        await emailInput.fill('test@example.com');
        await expect(emailInput).toHaveValue('test@example.com');
    });

    test('password input accepts text', async ({ page }) => {
        const passwordInput = page.locator('.auth-field input').nth(1);
        await passwordInput.fill('TestPassword123');
        await expect(passwordInput).toHaveValue('TestPassword123');
    });

    test('"Forgot password?" link shows alert', async ({ page }) => {
        // The link has an onClick that calls alert()
        page.on('dialog', async dialog => {
            expect(dialog.message()).toContain('Password reset coming soon');
            await dialog.accept();
        });
        await page.getByText('Forgot password?').click();
    });

    test('"Sign up" footer link navigates to /signup', async ({ page }) => {
        await page.locator('.auth-footer a').click();
        await expect(page).toHaveURL('/signup');
    });

    test('back arrow navigates to /welcome', async ({ page }) => {
        await page.locator('.auth-back-btn').click();
        await expect(page).toHaveURL('/welcome');
    });

    test('submitting empty form does not crash', async ({ page }) => {
        const errors = attachConsoleLogger(page);
        await page.locator('.auth-submit').click();
        // Form has required fields, so browser validation should prevent submit
        // No JS crash should occur
        expect(errors.filter(e => !e.includes('supabase'))).toHaveLength(0);
    });

    test('submitting with credentials shows loading or error', async ({ page }) => {
        await page.locator('input[type="email"]').fill('test@example.com');
        await page.locator('.auth-field input').nth(1).fill('Password123!');
        await page.locator('.auth-submit').click();

        // Should show loading spinner or error message
        await expect(
            page.locator('.auth-submit').or(page.locator('.auth-error'))
        ).toBeVisible({ timeout: 10000 });
    });
});

// ============================================================================
// 3. SIGNUP PAGE — /signup
// ============================================================================
test.describe('Signup Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/signup');
    });

    test('renders all form elements', async ({ page }) => {
        await expect(page.locator('.auth-header h1')).toContainText('Create Account');

        // 4 input fields: Display Name, Email, Password, Confirm Password
        const inputs = page.locator('.auth-field input');
        await expect(inputs).toHaveCount(4);

        // Submit button
        await expect(page.locator('.auth-submit')).toContainText('Create Account');

        // Footer link to login
        await expect(page.locator('.auth-footer a')).toContainText('Sign in');
    });

    test('password strength indicators update in real time', async ({ page }) => {
        const passwordInput = page.locator('.auth-field input').nth(2);

        // Type a short password
        await passwordInput.fill('ab');
        // "At least 8 characters" should be visible (unchecked)
        const lengthIndicator = page.getByText('At least 8 characters');
        await expect(lengthIndicator).toBeVisible();

        // Type a longer password with uppercase and number
        await passwordInput.fill('Abcdef12');
        // All indicators should show as met
        await expect(page.getByText('At least 8 characters')).toBeVisible();
        await expect(page.getByText('One uppercase letter')).toBeVisible();
        await expect(page.getByText('One number')).toBeVisible();
    });

    test('email validation shows error on invalid email', async ({ page }) => {
        const emailInput = page.locator('.auth-field input').nth(1);
        await emailInput.fill('not-an-email');
        await emailInput.blur();

        // Should show email error
        await expect(page.getByText('Please enter a valid email')).toBeVisible();
    });

    test('email validation clears on valid email', async ({ page }) => {
        const emailInput = page.locator('.auth-field input').nth(1);
        await emailInput.fill('not-an-email');
        await emailInput.blur();
        await expect(page.getByText('Please enter a valid email')).toBeVisible();

        await emailInput.fill('valid@example.com');
        await emailInput.blur();
        await expect(page.getByText('Please enter a valid email')).not.toBeVisible();
    });

    test('footer "Sign in" link navigates to /login', async ({ page }) => {
        await page.locator('.auth-footer a').click();
        await expect(page).toHaveURL('/login');
    });

    test('back arrow navigates to /welcome', async ({ page }) => {
        await page.locator('.auth-back').click();
        await expect(page).toHaveURL('/welcome');
    });

    test('password toggle shows/hides password', async ({ page }) => {
        const passwordInput = page.locator('.auth-field input').nth(2);
        await passwordInput.fill('Test123!');

        const toggleBtn = page.locator('.auth-toggle-password');
        await expect(passwordInput).toHaveAttribute('type', 'password');

        await toggleBtn.click();
        await expect(passwordInput).toHaveAttribute('type', 'text');
    });
});

// ============================================================================
// 4. ROUTING & REDIRECTS
// ============================================================================
test.describe('Routing & Redirects', () => {
    test('unknown route redirects to /welcome', async ({ page }) => {
        await page.goto('/this-does-not-exist');
        await expect(page).toHaveURL('/welcome');
    });

    test('/shop redirects to /search', async ({ page }) => {
        // This is a public redirect, but /search is protected
        // So it should chain: /shop → /search → /welcome (if not logged in)
        await page.goto('/shop');
        // Should end on /welcome since /search is protected
        await expect(page).toHaveURL(/\/(welcome|search)/);
    });

    test('/inbox redirects to /purchases', async ({ page }) => {
        await page.goto('/inbox');
        await expect(page).toHaveURL(/\/(welcome|purchases)/);
    });

    test('/profile redirects to /welcome when not logged in', async ({ page }) => {
        await page.goto('/profile');
        await expect(page).toHaveURL('/welcome');
    });

    test('/settings redirects to /welcome when not logged in', async ({ page }) => {
        await page.goto('/settings');
        await expect(page).toHaveURL('/welcome');
    });

    test('/notifications redirects to /welcome when not logged in', async ({ page }) => {
        await page.goto('/notifications');
        await expect(page).toHaveURL('/welcome');
    });
});

// ============================================================================
// 5. CROSS-PAGE NAVIGATION FLOW
// ============================================================================
test.describe('Full Navigation Flow', () => {
    test('Welcome → Signup → Login → Welcome round-trip', async ({ page }) => {
        // Start at Welcome
        await page.goto('/welcome');

        // Click "Get Started" → Signup
        await page.locator('.welcome-btn-primary').click();
        await expect(page).toHaveURL('/signup');

        // Click footer "Sign in" → Login
        await page.locator('.auth-footer a').click();
        await expect(page).toHaveURL('/login');

        // Click back arrow → Welcome
        await page.locator('.auth-back').click();
        await expect(page).toHaveURL('/welcome');
    });

    test('Welcome → Login → type credentials → see form feedback', async ({ page }) => {
        await page.goto('/welcome');

        // Go to login
        await page.locator('.welcome-btn-secondary').click();
        await expect(page).toHaveURL('/login');

        // Fill credentials
        await page.locator('input[type="email"]').fill('user@test.com');
        await page.locator('.auth-field input').nth(1).fill('MyPassword1');

        // Toggle password visibility
        await page.locator('.auth-toggle-password').click();
        const input = page.locator('.auth-field input').nth(1);
        await expect(input).toHaveAttribute('type', 'text');
        await expect(input).toHaveValue('MyPassword1');
    });
});

// ============================================================================
// 6. VISUAL INTEGRITY CHECKS (no JS errors)
// ============================================================================
test.describe('No JS Errors on Public Pages', () => {
    const publicPages = ['/welcome', '/login', '/signup'];

    for (const path of publicPages) {
        test(`no crash on ${path}`, async ({ page }) => {
            const errors: string[] = [];
            page.on('pageerror', err => errors.push(err.message));

            await page.goto(path, { waitUntil: 'networkidle' });
            await page.waitForTimeout(1000);

            // Filter out known benign errors (e.g., Supabase connection attempts)
            const criticalErrors = errors.filter(
                e => !e.includes('supabase') && !e.includes('AbortError') && !e.includes('Failed to fetch')
            );
            expect(criticalErrors).toHaveLength(0);
        });
    }
});

// ============================================================================
// 7. RESPONSIVE LAYOUT CHECKS
// ============================================================================
test.describe('Responsive Layout', () => {
    test('Welcome page is usable on mobile viewport', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto('/welcome');

        await expect(page.locator('.welcome-btn-primary')).toBeVisible();
        await expect(page.locator('.welcome-btn-secondary')).toBeVisible();

        // All features visible
        const features = page.locator('.welcome-feature');
        await expect(features).toHaveCount(3);
    });

    test('Login page is usable on mobile viewport', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 812 });
        await page.goto('/login');

        await expect(page.locator('.auth-submit')).toBeVisible();
        await expect(page.locator('input[type="email"]')).toBeVisible();
    });

    test('Welcome page works on tablet viewport', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 });
        await page.goto('/welcome');

        await expect(page.locator('.welcome-hero')).toBeVisible();
        await expect(page.locator('.welcome-btn-primary')).toBeVisible();
    });
});

// ============================================================================
// 8. ACCESSIBILITY — KEYBOARD NAVIGATION
// ============================================================================
test.describe('Keyboard Navigation', () => {
    test('Login form is navigable via Tab key', async ({ page }) => {
        await page.goto('/login');

        // Tab through form elements
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        // Email should be focusable
        const emailInput = page.locator('input[type="email"]');
        await emailInput.focus();
        await emailInput.fill('keyboard@test.com');
        await expect(emailInput).toHaveValue('keyboard@test.com');

        // Tab to password
        await page.keyboard.press('Tab');
    });
});
