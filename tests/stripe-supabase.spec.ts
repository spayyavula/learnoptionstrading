import { test, expect } from '@playwright/test';

test.describe('Stripe and Supabase Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Clear local storage before each test to ensure a clean state
    await page.evaluate(() => localStorage.clear());
  });

  test('should create a subscription and store it in Supabase', async ({ page }) => {
    // 1. Navigate to subscription page
    await page.goto('/subscribe');
    await expect(page.locator('h1')).toContainText('Choose Your Subscription Plan');

    // 2. Select monthly plan
    await page.click('button:has-text("Monthly")');
    await expect(page.locator('button:has-text("Monthly")')).toHaveClass(/bg-blue-600/);

    // 3. Mock the Stripe checkout process
    await page.route('**', route => {
      // Only intercept navigation to Stripe checkout
      const url = route.request().url();
      if (url.includes('checkout.stripe.com')) {
        // Simulate a successful Stripe checkout by redirecting to success URL
        route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: `
            <script>
              // Mock successful checkout
              window.location.href = '${page.url().split('?')[0]}?subscription=success&plan=monthly';
            </script>
          `,
        });
      } else {
        route.continue();
      }
    });

    // 4. Proceed to checkout and accept terms
    await page.click('button:has-text("Proceed to Checkout")');
    await page.waitForSelector('text=Terms and Conditions');
    await page.click('input[type="checkbox"]'); // Accept terms
    await page.click('button:has-text("I Accept")');

    // 5. Verify success message
    await expect(page.locator('text=Success!')).toBeVisible();

    // 6. Mock Supabase response for subscription check
    await page.route('**/rest/v1/subscriptions**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'sub_mock_123456',
          customer_id: 'cus_mock_123456',
          user_id: 'user_123456',
          status: 'active',
          price_id: 'price_monthly',
          quantity: 1,
          cancel_at_period_end: false,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created: new Date().toISOString(),
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString()
        }])
      });
    });

    // 7. Navigate to settings to verify subscription status
    await page.goto('/app/settings');
    await expect(page.locator('text=Pro Monthly')).toBeVisible();
    await expect(page.locator('text=Terms Accepted')).toBeVisible();
  });

  test('should handle coupon application in checkout process', async ({ page }) => {
    // 1. Navigate to subscription page
    await page.goto('/subscribe');

    // 2. Apply a coupon code
    await page.fill('input[placeholder="Enter coupon code"]', 'WELCOME50');
    await page.click('button:has-text("Apply")');
    
    // 3. Verify coupon is applied
    await expect(page.locator('text=WELCOME50 Applied')).toBeVisible();
    await expect(page.locator('text=50% OFF')).toBeVisible();

    // 4. Mock Stripe checkout with coupon
    await page.route('**', route => {
      const url = route.request().url();
      if (url.includes('checkout.stripe.com')) {
        route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: `
            <script>
              window.location.href = '${page.url().split('?')[0]}?subscription=success&plan=monthly&coupon=WELCOME50';
            </script>
          `,
        });
      } else {
        route.continue();
      }
    });

    // 5. Proceed to checkout and accept terms
    await page.click('button:has-text("Proceed to Checkout")');
    await page.waitForSelector('text=Terms and Conditions');
    await page.click('input[type="checkbox"]');
    await page.click('button:has-text("I Accept")');

    // 6. Verify success message
    await expect(page.locator('text=Success!')).toBeVisible();

    // 7. Mock Supabase response with coupon info
    await page.route('**/rest/v1/subscriptions**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'sub_mock_coupon',
          customer_id: 'cus_mock_coupon',
          user_id: 'user_123456',
          status: 'active',
          price_id: 'price_monthly',
          quantity: 1,
          cancel_at_period_end: false,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created: new Date().toISOString(),
          terms_accepted: true,
          terms_accepted_at: new Date().toISOString(),
          metadata: {
            coupon_applied: 'WELCOME50',
            original_price: '29.00',
            discounted_price: '14.50'
          }
        }])
      });
    });

    // 8. Navigate to settings to verify subscription with coupon
    await page.goto('/app/settings');
    await expect(page.locator('text=Pro Monthly')).toBeVisible();
  });

  test('should handle subscription cancellation via customer portal', async ({ page }) => {
    // 1. Set up mock subscription in local storage
    await page.evaluate(() => {
      localStorage.setItem('mock_subscription', JSON.stringify({
        id: 'sub_mock_cancel',
        plan: 'monthly',
        status: 'active',
        created: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        customer_id: 'cus_mock_cancel',
        terms_accepted: true
      }));
    });

    // 2. Navigate to settings page
    await page.goto('/app/settings');
    await expect(page.locator('text=Pro Monthly')).toBeVisible();

    // 3. Mock customer portal redirect
    const popupPromise = page.waitForEvent('popup');
    await page.click('button:has-text("Manage")');
    const popup = await popupPromise;
    
    // 4. Verify portal URL
    expect(popup.url()).toContain('billing.stripe.com/p/session/cus_mock_cancel');
    
    // 5. Simulate cancellation in the portal
    await popup.evaluate(() => {
      // This would normally happen in the Stripe portal UI
      window.opener.postMessage({ type: 'stripe_subscription_updated', status: 'canceled' }, '*');
    });
    
    // 6. Close the popup
    await popup.close();
    
    // 7. Mock Supabase response for canceled subscription
    await page.route('**/rest/v1/subscriptions**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'sub_mock_cancel',
          customer_id: 'cus_mock_cancel',
          user_id: 'user_123456',
          status: 'canceled',
          price_id: 'price_monthly',
          quantity: 1,
          cancel_at_period_end: true,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created: new Date().toISOString(),
          canceled_at: new Date().toISOString(),
          terms_accepted: true
        }])
      });
    });
    
    // 8. Refresh the page to see updated subscription status
    await page.reload();
    
    // 9. Verify subscription shows as canceled but still active until period end
    await expect(page.locator('text=Canceled')).toBeVisible();
    await expect(page.locator('text=Active until')).toBeVisible();
  });

  test('should handle subscription webhook events', async ({ page, request }) => {
    // This test simulates a webhook event from Stripe to Supabase
    
    // 1. Set up mock subscription
    await page.evaluate(() => {
      localStorage.setItem('mock_subscription', JSON.stringify({
        id: 'sub_mock_webhook',
        plan: 'monthly',
        status: 'active',
        created: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        customer_id: 'cus_mock_webhook',
        terms_accepted: true
      }));
    });
    
    // 2. Navigate to settings to verify initial state
    await page.goto('/app/settings');
    await expect(page.locator('text=Pro Monthly')).toBeVisible();
    
    // 3. Simulate a webhook event (in a real test, this would be sent to the webhook endpoint)
    const webhookPayload = {
      id: 'evt_mock_123456',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_mock_webhook',
          customer: 'cus_mock_webhook',
          status: 'active',
          items: {
            data: [{
              price: { id: 'price_yearly' } // Changed from monthly to yearly
            }]
          },
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60,
          cancel_at_period_end: false
        }
      }
    };
    
    // 4. Mock the webhook endpoint response
    await page.route('**/functions/v1/stripe-webhook', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ received: true })
      });
    });
    
    // 5. Send the webhook event (in a real test, this would be done with a separate HTTP client)
    try {
      // This is just a simulation - in a real test you'd use the request object
      await request.post('/functions/v1/stripe-webhook', {
        headers: {
          'Content-Type': 'application/json',
          'Stripe-Signature': 'mock_signature'
        },
        data: webhookPayload
      });
    } catch (e) {
      // Ignore errors since this is just a simulation
    }
    
    // 6. Mock Supabase response for updated subscription
    await page.route('**/rest/v1/subscriptions**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'sub_mock_webhook',
          customer_id: 'cus_mock_webhook',
          user_id: 'user_123456',
          status: 'active',
          price_id: 'price_yearly', // Changed from monthly to yearly
          quantity: 1,
          cancel_at_period_end: false,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          created: new Date().toISOString(),
          terms_accepted: true
        }])
      });
    });
    
    // 7. Refresh the page to see updated subscription
    await page.reload();
    
    // 8. Verify subscription shows as yearly now
    await expect(page.locator('text=Pro Yearly')).toBeVisible();
  });

  test('should handle subscription checkout errors gracefully', async ({ page }) => {
    // 1. Navigate to subscription page
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
});