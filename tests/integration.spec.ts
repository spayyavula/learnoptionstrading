import { test, expect } from '@playwright/test';

test.describe('Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete full trading workflow', async ({ page }) => {
    // 1. Start from dashboard
    await expect(page.locator('h2')).toContainText('Dashboard');
    
    // 2. Navigate to trading page
    await page.click('text=Start Trading');
    await expect(page).toHaveURL('/trading');
    
    // 3. Select a stock
    await page.click('text=AAPL >> .. >> text=Select');
    await expect(page.locator('text=Selected')).toBeVisible();
    
    // 4. Place a buy order
    await page.fill('input[placeholder="Number of shares"]', '10');
    await page.click('text=Place BUY Order');
    
    // 5. Verify order was placed
    await expect(page.locator('text=BUY order placed for 10 shares of AAPL')).toBeVisible();
    
    // 6. Check orders page
    await page.click('text=Orders');
    await expect(page).toHaveURL('/orders');
    await expect(page.locator('text=AAPL')).toBeVisible();
    await expect(page.locator('text=BUY')).toBeVisible();
    
    // 7. Check portfolio page
    await page.click('text=Portfolio');
    await expect(page).toHaveURL('/portfolio');
    await expect(page.locator('text=AAPL')).toBeVisible();
    
    // 8. Return to dashboard and verify updates
    await page.click('text=Dashboard');
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=1').first()).toBeVisible(); // Should show 1 position
  });

  test('should manage watchlist workflow', async ({ page }) => {
    // 1. Navigate to watchlist
    await page.click('text=Watchlist');
    await expect(page).toHaveURL('/watchlist');
    
    // 2. Add stock to watchlist
    await page.click('text=Add Stock');
    await page.fill('input[placeholder="Search stocks..."]', 'MSFT');
    await page.click('text=Add').last();
    
    // 3. Verify stock was added
    await expect(page.locator('text=MSFT')).toBeVisible();
    await expect(page.locator('text=Microsoft Corporation')).toBeVisible();
    
    // 4. Navigate to trading and verify stock is available
    await page.click('text=Trading');
    await expect(page.locator('text=MSFT')).toBeVisible();
    
    // 5. Return to watchlist and remove stock
    await page.click('text=Watchlist');
    await page.click('button[class*="text-red-600"]');
    
    // Handle confirmation dialog
    page.on('dialog', dialog => dialog.accept());
    
    // 6. Verify stock was removed
    await expect(page.locator('text=No stocks in watchlist')).toBeVisible();
  });

  test('should handle limit order workflow', async ({ page }) => {
    // 1. Navigate to trading
    await page.click('text=Trading');
    
    // 2. Select stock and place limit order
    await page.click('text=AAPL >> .. >> text=Select');
    await page.selectOption('select', 'limit');
    await page.fill('input[placeholder="Number of shares"]', '5');
    await page.fill('input[placeholder="Price per share"]', '100.00'); // Low price to keep it pending
    await page.click('text=Place BUY Order');
    
    // 3. Check orders page for pending order
    await page.click('text=Orders');
    await expect(page.locator('text=pending')).toBeVisible();
    await expect(page.locator('text=Cancel')).toBeVisible();
    
    // 4. Cancel the order
    await page.click('text=Cancel');
    
    // Handle confirmation dialog
    page.on('dialog', dialog => dialog.accept());
    
    // 5. Verify order was cancelled
    await expect(page.locator('text=cancelled')).toBeVisible();
  });

  test('should persist data across page reloads', async ({ page }) => {
    // 1. Place an order
    await page.click('text=Trading');
    await page.click('text=AAPL >> .. >> text=Select');
    await page.fill('input[placeholder="Number of shares"]', '10');
    await page.click('text=Place BUY Order');
    
    // 2. Add to watchlist
    await page.click('text=Watchlist');
    await page.click('text=Add Stock');
    await page.fill('input[placeholder="Search stocks..."]', 'GOOGL');
    await page.click('text=Add').last();
    
    // 3. Reload page
    await page.reload();
    
    // 4. Verify data persisted
    await expect(page.locator('text=GOOGL')).toBeVisible();
    
    // 5. Check orders persisted
    await page.click('text=Orders');
    await expect(page.locator('text=AAPL')).toBeVisible();
    
    // 6. Check portfolio persisted
    await page.click('text=Portfolio');
    await expect(page.locator('text=AAPL')).toBeVisible();
  });

  test('should handle settings changes', async ({ page }) => {
    // 1. Navigate to settings
    await page.click('text=Settings');
    
    // 2. Change notification setting
    const orderFillsCheckbox = page.locator('text=Order Fills').locator('..').locator('input[type="checkbox"]');
    await orderFillsCheckbox.click();
    
    // 3. Change risk setting
    const maxPositionInput = page.locator('text=Max Position Size').locator('..').locator('input');
    await maxPositionInput.clear();
    await maxPositionInput.fill('15000');
    
    // 4. Save settings
    await page.click('text=Save Settings');
    await expect(page.locator('text=Settings saved successfully!')).toBeVisible();
    
    // 5. Reload and verify settings persisted
    await page.reload();
    await expect(orderFillsCheckbox).not.toBeChecked();
    await expect(maxPositionInput).toHaveValue('15000');
  });

  test('should handle analytics with trading data', async ({ page }) => {
    // 1. Place some trades first
    await page.click('text=Trading');
    
    // Place first order
    await page.click('text=AAPL >> .. >> text=Select');
    await page.fill('input[placeholder="Number of shares"]', '10');
    await page.click('text=Place BUY Order');
    
    // Place second order
    await page.click('text=MSFT >> .. >> text=Select');
    await page.fill('input[placeholder="Number of shares"]', '5');
    await page.click('text=Place BUY Order');
    
    // 2. Navigate to analytics
    await page.click('text=Analytics');
    
    // 3. Verify analytics show updated data
    await expect(page.locator('text=2')).toBeVisible(); // Total trades
    await expect(page.locator('text=2')).toBeVisible(); // Total positions
    
    // 4. Check that charts are displayed
    const charts = page.locator('.recharts-wrapper');
    expect(await charts.count()).toBeGreaterThan(0);
    
    // 5. Test time range switching
    await page.click('text=7d');
    await expect(page.locator('text=7d')).toHaveClass(/bg-blue-100/);
    
    await page.click('text=1y');
    await expect(page.locator('text=1y')).toHaveClass(/bg-blue-100/);
  });

  test('should handle mobile responsive workflow', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 1. Test mobile navigation
    await page.locator('button[type="button"]').first().click();
    await page.click('text=Trading');
    await expect(page).toHaveURL('/trading');
    
    // 2. Test mobile trading
    await page.click('text=AAPL >> .. >> text=Select');
    await page.fill('input[placeholder="Number of shares"]', '5');
    await page.click('text=Place BUY Order');
    
    // 3. Test mobile navigation to orders
    await page.locator('button[type="button"]').first().click();
    await page.click('text=Orders');
    await expect(page.locator('text=AAPL')).toBeVisible();
    
    // 4. Test mobile portfolio view
    await page.locator('button[type="button"]').first().click();
    await page.click('text=Portfolio');
    await expect(page.locator('text=AAPL')).toBeVisible();
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    // 1. Try to place order with insufficient funds
    await page.click('text=Trading');
    await page.click('text=AAPL >> .. >> text=Select');
    await page.fill('input[placeholder="Number of shares"]', '1000000'); // Very large quantity
    await page.click('text=Place BUY Order');
    
    // Should show insufficient funds alert
    await expect(page.locator('text=Insufficient buying power')).toBeVisible();
    
    // 2. Try to place limit order without price
    await page.selectOption('select', 'limit');
    await page.fill('input[placeholder="Number of shares"]', '10');
    
    // Place order button should be disabled
    await expect(page.locator('text=Place BUY Order')).toBeDisabled();
  });

  test('should handle data export and reset', async ({ page }) => {
    // 1. Create some data first
    await page.click('text=Trading');
    await page.click('text=AAPL >> .. >> text=Select');
    await page.fill('input[placeholder="Number of shares"]', '10');
    await page.click('text=Place BUY Order');
    
    // 2. Navigate to settings
    await page.click('text=Settings');
    
    // 3. Test data export
    const downloadPromise = page.waitForEvent('download');
    await page.click('text=Export Data');
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/paper-trading-data-\d{4}-\d{2}-\d{2}\.json/);
    
    // 4. Test account reset (but cancel it)
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('Are you sure you want to reset your account?');
      dialog.dismiss();
    });
    await page.click('text=Reset Account');
    
    // 5. Verify data is still there
    await page.click('text=Portfolio');
    await expect(page.locator('text=AAPL')).toBeVisible();
  });
});