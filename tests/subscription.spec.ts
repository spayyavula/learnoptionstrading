import { test, expect } from '@playwright/test';

test.describe('Stripe and Supabase Subscription E2E', () => {

  test.beforeEach(async ({ page }) => {
    // Clear local storage before each test to ensure a clean state
    await page.evaluate(() => localStorage.clear());
    await page.goto('/subscribe');
  });


  // All paid plan/Stripe logic removed. Only test free plan UI and messaging.


  // Yearly plan/Stripe logic removed.


  test('should show free plan status and messaging', async ({ page }) => {
    // Go directly to settings
    await page.goto('/app/settings');

    // Assert that the subscription status is "Free Plan" and "Free Forever" button is visible
    await expect(page.locator('text=Free Plan')).toBeVisible();
    await expect(page.locator('button:has-text("Free Forever")')).toBeVisible();
    await expect(page.locator('text=All features are free forever')).toBeVisible();
  });


  // Coupon code/discount logic removed.


  // Special deals logic removed.


  // Terms agreement modal logic removed.


  test('should navigate from landing page to subscription page', async ({ page }) => {
    // 1. Start at landing page
    await page.goto('/');

    // 2. Click on a "Get Started" or similar button
    await page.click('text=Get Started');

    // 3. Verify redirect to subscription page (now free messaging)
    await expect(page).toHaveURL('/subscribe');
    await expect(page.locator('h1')).toContainText('All features are free forever');
  });


  // Stripe payment error handling removed.
});