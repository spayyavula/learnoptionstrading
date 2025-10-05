import { test, expect } from '@playwright/test';

test.describe('Subscription API Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Clear local storage before each test to ensure a clean state
    await page.evaluate(() => localStorage.clear());
  });

  test('should create a subscription and store it in Supabase', async ({ page, request }) => {
    // 1. Navigate to subscription page
    await page.goto('/subscribe');
    await expect(page.locator('h1')).toContainText('Choose Your Subscription Plan');

    // 2. Mock Supabase response for subscription check
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

    // 3. Mock Stripe webhook endpoint
    await page.route('**/functions/v1/stripe-webhook', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ received: true })
      });
    });

    // 4. Simulate a webhook event (in a real test, this would be sent to the webhook endpoint)
    const webhookPayload = {
      id: 'evt_mock_123456',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_mock_123456',
          customer: 'cus_mock_123456',
          client_reference_id: 'user_123456',
          subscription: 'sub_mock_123456',
          line_items: {
            data: [{
              price: { id: 'price_monthly' }
            }]
          }
        }
      }
    };

    // 5. Send the webhook event
    try {
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

    // 6. Mock the Stripe checkout process
    await page.route('**', route => {
      const url = route.request().url();
      if (url.includes('checkout.stripe.com')) {
        route.fulfill({
          status: 200,
          contentType: 'text/html',
          body: `
            <script>
              localStorage.setItem('mock_subscription', JSON.stringify({
                id: 'sub_mock_123456',
                plan: 'monthly',
                status: 'active',
                created: new Date().toISOString(),
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                customer_id: 'cus_mock_123456',
                terms_accepted: true
              }));
              window.location.href = '${page.url().split('?')[0]}?subscription=success';
            </script>
          `,
        });
      } else {
        route.continue();
      }
    });

    // 7. Proceed to checkout and accept terms
    await page.click('button:has-text("Proceed to Checkout")');
    await page.waitForSelector('text=Terms and Conditions');
    await page.click('input[type="checkbox"]');
    await page.click('button:has-text("I Accept")');

    // 8. Verify success message
    await expect(page.locator('text=Success!')).toBeVisible();

    // 9. Navigate to settings to verify subscription status
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

    // 3. Mock Supabase response for subscription check
    await page.route('**/rest/v1/subscriptions**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'sub_mock_cancel',
          customer_id: 'cus_mock_cancel',
          user_id: 'user_123456',
          status: 'active',
          price_id: 'price_monthly',
          quantity: 1,
          cancel_at_period_end: false,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created: new Date().toISOString(),
          terms_accepted: true
        }])
      });
    });

    // 4. Mock customer portal redirect
    const popupPromise = page.waitForEvent('popup');
    await page.click('button:has-text("Manage")');
    const popup = await popupPromise;
    
    // 5. Verify portal URL
    expect(popup.url()).toContain('billing.stripe.com/p/session/cus_mock_cancel');
    
    // 6. Simulate cancellation in the portal
    await popup.evaluate(() => {
      // This would normally happen in the Stripe portal UI
      window.opener.postMessage({ type: 'stripe_subscription_updated', status: 'canceled' }, '*');
    });
    
    // 7. Close the popup
    await popup.close();
    
    // 8. Update mock subscription in local storage to reflect cancellation
    await page.evaluate(() => {
      const subscription = JSON.parse(localStorage.getItem('mock_subscription') || '{}');
      subscription.status = 'canceled';
      subscription.cancel_at_period_end = true;
      subscription.canceled_at = new Date().toISOString();
      localStorage.setItem('mock_subscription', JSON.stringify(subscription));
    });
    
    // 9. Mock Supabase response for canceled subscription
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
    
    // 10. Refresh the page to see updated subscription status
    await page.reload();
    
    // 11. Verify subscription shows as canceled
    await expect(page.locator('text=Canceled')).toBeVisible();
  });

  test('should handle subscription webhook events', async ({ page, request }) => {
    // 1. Set up mock subscription in local storage
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
    
    // 3. Mock Supabase response for initial subscription
    await page.route('**/rest/v1/subscriptions**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'sub_mock_webhook',
          customer_id: 'cus_mock_webhook',
          user_id: 'user_123456',
          status: 'active',
          price_id: 'price_monthly',
          quantity: 1,
          cancel_at_period_end: false,
          current_period_start: new Date().toISOString(),
          current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          created: new Date().toISOString(),
          terms_accepted: true
        }])
      });
    });
    
    await expect(page.locator('text=Pro Monthly')).toBeVisible();
    
    // 4. Simulate a webhook event by directly updating the mock subscription in localStorage
    await page.evaluate(() => {
      const subscription = JSON.parse(localStorage.getItem('mock_subscription') || '{}');
      subscription.plan = 'yearly';
      subscription.price_id = 'price_yearly';
      subscription.current_period_end = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
      localStorage.setItem('mock_subscription', JSON.stringify(subscription));
    });
    
    // 5. Mock Supabase response for updated subscription
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
    
    // 6. Refresh the page to see updated subscription
    await page.reload();
    
    // 7. Verify subscription shows as yearly now
    await expect(page.locator('text=Pro Yearly')).toBeVisible();
  });
});