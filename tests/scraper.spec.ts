
import { test, expect } from '@playwright/test';

test('verify product scraper functionality', async ({ page }) => {
    // 1. Navigate to Login
    await page.goto('/login');

    // 2. Log In with Manual User
    const email = 'manual_test_user@example.com';
    const password = 'Password123!';

    await page.getByPlaceholder('you@example.com').fill(email);
    await page.getByPlaceholder('••••••••').fill(password);
    await page.getByRole('button', { name: 'Sign In' }).click();

    // 3. Verify Login Success
    await expect(page).toHaveURL('/', { timeout: 15000 });

    // 4. Navigate to Profile/Import
    await page.getByRole('link', { name: /profile/i }).click();

    // Let's wait for navigation
    await expect(page).toHaveURL(/profile/);

    // 5. Open Import Modal
    await page.getByRole('button', { name: /import/i }).click();

    // 6. Enter URL (User provided Etsy URL)
    const testUrl = 'https://www.etsy.com/at/listing/128069217/14k-gold-starburst-diamant-halskette?click_key=b5a7c8c15ef77ad73984af93eda86c209948b3ee%3A128069217&click_sum=d60082e9&external=1&ref=hp_consolidated_gifting_listings-3&sts=1';
    await page.getByPlaceholder('Paste product link...').fill(testUrl);

    // 7. Click Next/Scrape
    await page.getByRole('button', { name: /next|arrow|scrape/i }).click();

    // 8. Wait for results
    // We expect the Name and Image fields to be populated.
    const nameInput = page.getByPlaceholder('Product Name');
    // Etsy is slow/hard, give it more time
    await expect(nameInput).not.toBeEmpty({ timeout: 60000 });

    const inputValue = await nameInput.inputValue();
    console.log('Scraped Name:', inputValue);
    // Expect something reasonable from the title
    expect(inputValue.toLowerCase()).toMatch(/gold|neck|kette|starburst/);

    // Check Image
    const imagePreview = page.locator('img[alt="Product preview"]');
    await expect(imagePreview).toBeVisible();

    // Check that the image source is valid (not missing or broken)
    const src = await imagePreview.getAttribute('src');
    console.log('Scraped Image URL:', src);
    expect(src).not.toContain('MISSING');
    expect(src).toBeTruthy();

    console.log('Test Complete: Scraper verification successful');
});
