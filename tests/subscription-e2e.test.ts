import { test, expect, Page } from '@playwright/test';

test.describe('Subscription E2E Flow', () => {
  // Setup for each test
  test.beforeEach(async ({ page }) => {
    // Clear local storage before each test to ensure a clean state
    await page.evaluate(() => localStorage.clear());
  });

  test('complete subscription flow from landing page to confirmation', async ({ page }) => {
    // 1. Start at landing page
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Learn to Be an Expert Trader');

    // 2. Click on a subscription button
    await page.click('text=Start Trading Now');
    await expect(page).toHaveURL('/app');

    // 3. Navigate to subscription page via settings
    await page.click('text=Settings');
    await expect(page).toHaveURL('/app/settings');

    // 4. Verify free plan status is shown
    await expect(page.locator('text=Free Plan')).toBeVisible();
    
    // 5. No upgrade button, all features are free forever
    await expect(page).toHaveURL('/subscribe');

    // 6. Verify subscription page loaded
    await expect(page.locator('h1')).toContainText('Choose Your Subscription Plan');

    // 7. Select monthly plan
    await page.click('button:has-text("Monthly")');
    await expect(page.locator('button:has-text("Monthly")')).toHaveClass(/bg-blue-600/);

    // 8. Apply a coupon code
    await page.fill('input[placeholder="Enter coupon code"]', 'WELCOME50');
    await page.click('button:has-text("Apply")');
    
    // 9. Verify coupon is applied
    await expect(page.locator('text=WELCOME50 Applied')).toBeVisible();
    await expect(page.locator('text=50% OFF')).toBeVisible();

    // 10. Mock the Stripe checkout process
    await mockStripeCheckout(page);

    // 11. Click "Proceed to Checkout"
    await page.click('button:has-text("Proceed to Checkout")');

    // 12. Accept terms and conditions
    await page.waitForSelector('text=Terms and Conditions');
    await page.click('input[type="checkbox"]');
    await page.click('button:has-text("I Accept")');

    // 13. Verify success message (after redirect)
    await expect(page.locator('text=Success!')).toBeVisible();
    await expect(page.locator('text=Thank you for subscribing')).toBeVisible();

    // 14. Navigate to settings to verify subscription status
    await page.goto('/app/settings');
    
    // 15. Verify subscription status is updated
    await expect(page.locator('text=Pro Monthly')).toBeVisible();
    await expect(page.locator('text=Terms Accepted')).toBeVisible();
    await expect(page.locator('text=Next billing:')).toBeVisible();

    // 16. Test the "Manage" subscription button
    const [newPage] = await Promise.all([
      page.waitForEvent('popup'),
      page.click('button:has-text("Manage")')
    ]);
    
    // 17. Verify the customer portal URL
    expect(newPage.url()).toMatch(/https:\/\/billing\.stripe\.com\/p\/session\//);
    await newPage.close();
  });

  test('should handle coupon application and validation', async ({ page }) => {
    // 1. Go to subscription page
    await page.goto('/subscribe');
    
    // 2. Try invalid coupon
    await page.fill('input[placeholder="Enter coupon code"]', 'INVALID');
    await page.click('button:has-text("Apply")');
    
    // 3. Verify error message
    await expect(page.locator('text=Invalid coupon code')).toBeVisible();
    
    // 4. Try valid coupon
    await page.fill('input[placeholder="Enter coupon code"]', 'WELCOME50');
    await page.click('button:has-text("Apply")');
    
    // 5. Verify coupon applied
    await expect(page.locator('text=WELCOME50 Applied')).toBeVisible();
    
    // 6. Verify price updated
    await expect(page.locator('text=/Was \\$\\d+/')).toBeVisible();
    await expect(page.locator('text=/Save \\$\\d+/')).toBeVisible();
    
    // 7. Remove coupon
    await page.click('button:has-text("×")');
    
    // 8. Verify coupon removed
    await expect(page.locator('input[placeholder="Enter coupon code"]')).toBeVisible();
    await expect(page.locator('text=WELCOME50 Applied')).not.toBeVisible();
  });

  test('should handle special deals selection', async ({ page }) => {
    // 1. Go to subscription page
    await page.goto('/subscribe');
    
    // Check if deals section exists (may not be present if no active deals)
    const hasDeals = await page.locator('text=Special Offers').isVisible();
    if (!hasDeals) {
      test.skip();
      return;
    }
    
    // 2. Find and click on a deal
    const dealCard = page.locator('.cursor-pointer').first();
    await dealCard.click();
    
    // 3. Verify the deal is selected (price should update)
    await expect(page.locator('text=/Save \\$\\d+/')).toBeVisible();
    
    // 4. Mock Stripe checkout
    await mockStripeCheckout(page);
    
    // 5. Click "Claim Deal" button
    await page.click('button:has-text("Claim Deal")');
    
    // 6. Accept terms
    await page.waitForSelector('text=Terms and Conditions');
    await page.click('input[type="checkbox"]');
    await page.click('button:has-text("I Accept")');
    
    // 7. Verify success message
    await expect(page.locator('text=Success!')).toBeVisible();
  });

  test('should handle terms agreement modal', async ({ page }) => {
    // 1. Go to subscription page
    await page.goto('/subscribe');
    
    // 2. Click "Proceed to Checkout" to trigger terms modal
    await page.click('button:has-text("Proceed to Checkout")');
    
    // 3. Verify terms modal appears
    await expect(page.locator('text=Terms and Conditions')).toBeVisible();
    await expect(page.locator('button:has-text("I Accept")')).toBeDisabled(); // Should be disabled until checkbox is checked
    
    // 4. Check the terms agreement checkbox
    await page.click('input[type="checkbox"]');
    await expect(page.locator('button:has-text("I Accept")')).toBeEnabled();
    
    // 5. Click "I Decline" to close the modal
    await page.click('button:has-text("I Decline")');
    await expect(page.locator('text=Terms and Conditions')).not.toBeVisible();
  });

  test('should handle subscription checkout errors gracefully', async ({ page }) => {
    // 1. Go to subscription page
    await page.goto('/subscribe');
    
    // 2. Mock a Stripe error
    await page.route('**', route => {
      const url = route.request().url();
      if (url.includes('checkout.stripe.com')) {
        // Simulate a Stripe error
        route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ error: { message: 'Invalid payment method' } })
        });
      } else {
        route.continue();
      }
    });
    
    // 3. Proceed to checkout and accept terms
    await page.click('button:has-text("Proceed to Checkout")');
    await page.waitForSelector('text=Terms and Conditions');
    await page.click('input[type="checkbox"]');
    await page.click('button:has-text("I Accept")');
    
    // 4. Verify error message is displayed
    await expect(page.locator('text=Failed to initialize checkout')).toBeVisible();
  });

  test('should handle subscription webhook events', async ({ page, request }) => {
    // This test simulates a webhook event from Stripe to Supabase
    
    // 1. Set up mock subscription in local storage
    await page.evaluate(() => {
      localStorage.setItem('mock_subscription', JSON.stringify({
        id: 'sub_mock_webhook',
        plan: 'monthly',
        status: 'active',
        customer_id: 'cus_mock_webhook',
        created: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }));
    });
    
    // 2. Go to settings page to verify initial subscription
    await page.goto('/app/settings');
    await expect(page.locator('text=Pro Monthly')).toBeVisible();
    
    // 3. Simulate a webhook event (in a real test, this would be sent to the webhook endpoint)
    // Instead of trying to make an actual HTTP request, we'll simulate the webhook event
    // by directly updating the mock subscription in localStorage
    await page.evaluate(() => {
      // Get the current mock subscription
      const subscription = JSON.parse(localStorage.getItem('mock_subscription') || '{}');
      
      // Update it to simulate a webhook event that changes the plan from monthly to yearly
      subscription.plan = 'yearly';
      subscription.price_id = 'price_yearly';
      subscription.current_period_end = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      
      // Save the updated subscription back to localStorage
      localStorage.setItem('mock_subscription', JSON.stringify(subscription));
    });
    
    // 4. Mock Supabase response for updated subscription
    await page.route('**/rest/v1/subscriptions**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'sub_mock_webhook',
          plan: 'yearly',
          status: 'active',
          customer_id: 'cus_mock_webhook',
          current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        }])
      });
    });
    
    // 5. Refresh the page to see updated subscription
    await page.reload();
    
    // 6. Verify subscription shows as yearly now
    await expect(page.locator('text=Pro Yearly')).toBeVisible();
  });
});

/**
 * Helper function to mock the Stripe checkout process
 */
async function mockStripeCheckout(page: Page) {
  await page.route('**', route => {
    // Only intercept navigation to Stripe checkout
    const url = route.request().url();
    if (url.includes('checkout.stripe.com')) {
      // Simulate a successful Stripe checkout by setting mock data in localStorage
      // and then redirecting to the success URL
      route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <script>
            localStorage.setItem('mock_subscription', JSON.stringify({
              id: 'sub_mock_${Date.now()}',
              plan: 'monthly',
              status: 'active',
              created: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              customer_id: 'cus_mock_${Date.now()}',
              terms_accepted: true,
              terms_accepted_at: new Date().toISOString()
            }));
            window.location.href = '${page.url().split('?')[0]}?subscription=success';
          </script>
        `,
      });
    } else {
      route.continue();
    }
  });
}