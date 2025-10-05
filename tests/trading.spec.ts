import { test, expect } from '@playwright/test';

test.describe('Trading Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/trading');
  });

  test('should display trading title', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Trading');
  });

  test('should display available stocks table', async ({ page }) => {
    await expect(page.locator('text=Available Stocks')).toBeVisible();
    
    // Check table headers
    await expect(page.locator('text=Symbol')).toBeVisible();
    await expect(page.locator('text=Price')).toBeVisible();
    await expect(page.locator('text=Change')).toBeVisible();
    await expect(page.locator('text=% Change')).toBeVisible();
    await expect(page.locator('text=Volume')).toBeVisible();
    await expect(page.locator('text=Market Cap')).toBeVisible();
    await expect(page.locator('text=Action')).toBeVisible();
  });

  test('should display stock search functionality', async ({ page }) => {
    const searchInput = page.locator('input[placeholder="Search stocks..."]');
    await expect(searchInput).toBeVisible();
    
    // Test search functionality
    await searchInput.fill('AAPL');
    await expect(page.locator('text=Apple Inc.')).toBeVisible();
    
    // Clear search
    await searchInput.fill('');
    await expect(page.locator('text=Microsoft Corporation')).toBeVisible();
  });

  test('should display place order panel', async ({ page }) => {
    await expect(page.locator('text=Place Order')).toBeVisible();
    await expect(page.locator('text=Select a stock to start trading')).toBeVisible();
  });

  test('should display account info panel', async ({ page }) => {
    await expect(page.locator('text=Account Info')).toBeVisible();
    await expect(page.locator('text=Buying Power:')).toBeVisible();
    await expect(page.locator('text=Cash Balance:')).toBeVisible();
    await expect(page.locator('text=Total Value:')).toBeVisible();
    await expect(page.locator('text=Positions:')).toBeVisible();
  });

  test('should allow stock selection', async ({ page }) => {
    // Click select button for AAPL
    await page.click('text=AAPL >> .. >> text=Select');
    
    // Check if stock is selected
    await expect(page.locator('text=Selected')).toBeVisible();
    
    // Order form should now be active
    await expect(page.locator('text=AAPL').first()).toBeVisible();
    await expect(page.locator('text=Apple Inc.')).toBeVisible();
  });

  test('should display order form when stock is selected', async ({ page }) => {
    // Select AAPL
    await page.click('text=AAPL >> .. >> text=Select');
    
    // Check order form elements
    await expect(page.locator('text=Trade Type')).toBeVisible();
    await expect(page.locator('text=Buy')).toBeVisible();
    await expect(page.locator('text=Sell')).toBeVisible();
    
    await expect(page.locator('text=Order Type')).toBeVisible();
    await expect(page.locator('select')).toBeVisible();
    
    await expect(page.locator('text=Quantity')).toBeVisible();
    await expect(page.locator('input[placeholder="Number of shares"]')).toBeVisible();
  });

  test('should place a buy order', async ({ page }) => {
    // Select AAPL
    await page.click('text=AAPL >> .. >> text=Select');
    
    // Fill order form
    await page.fill('input[placeholder="Number of shares"]', '10');
    
    // Click place order
    await page.click('text=Place BUY Order');
    
    // Should show confirmation alert
    await expect(page.locator('text=BUY order placed for 10 shares of AAPL')).toBeVisible();
  });

  test('should validate order form', async ({ page }) => {
    // Select AAPL
    await page.click('text=AAPL >> .. >> text=Select');
    
    // Try to place order without quantity
    const placeOrderButton = page.locator('text=Place BUY Order');
    await expect(placeOrderButton).toBeDisabled();
    
    // Fill quantity
    await page.fill('input[placeholder="Number of shares"]', '10');
    await expect(placeOrderButton).toBeEnabled();
  });

  test('should switch between buy and sell', async ({ page }) => {
    // Select AAPL
    await page.click('text=AAPL >> .. >> text=Select');
    
    // Check buy is selected by default
    await expect(page.locator('text=Buy').first()).toHaveClass(/btn-success/);
    
    // Click sell (should be disabled initially as no position)
    const sellButton = page.locator('text=Sell').first();
    await expect(sellButton).toBeDisabled();
  });

  test('should display order summary', async ({ page }) => {
    // Select AAPL
    await page.click('text=AAPL >> .. >> text=Select');
    
    // Fill quantity
    await page.fill('input[placeholder="Number of shares"]', '10');
    
    // Check order summary appears
    await expect(page.locator('text=Order Summary')).toBeVisible();
    await expect(page.locator('text=Shares:')).toBeVisible();
    await expect(page.locator('text=Price:')).toBeVisible();
    await expect(page.locator('text=Estimated Cost:')).toBeVisible();
  });

  test('should handle limit orders', async ({ page }) => {
    // Select AAPL
    await page.click('text=AAPL >> .. >> text=Select');
    
    // Change to limit order
    await page.selectOption('select', 'limit');
    
    // Limit price field should appear
    await expect(page.locator('text=Limit Price')).toBeVisible();
    await expect(page.locator('input[placeholder="Price per share"]')).toBeVisible();
    
    // Fill form
    await page.fill('input[placeholder="Number of shares"]', '10');
    await page.fill('input[placeholder="Price per share"]', '170.00');
    
    // Place order button should be enabled
    await expect(page.locator('text=Place BUY Order')).toBeEnabled();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if mobile sidebar toggle is visible
    await expect(page.locator('button[type="button"]').first()).toBeVisible();
    
    // Tables should be scrollable horizontally
    await expect(page.locator('.overflow-x-auto')).toBeVisible();
  });

  test('should display stock data correctly', async ({ page }) => {
    // Check that stock data is displayed with proper formatting
    await expect(page.locator('text=AAPL')).toBeVisible();
    await expect(page.locator('text=Apple Inc.')).toBeVisible();
    
    // Check price formatting
    const priceElements = page.locator('text=/\\$\\d+\\.\\d{2}/')
    expect(await priceElements.count()).toBeGreaterThan(0);
    
    // Check percentage formatting
    const percentElements = page.locator('text=/[+-]\\d+\\.\\d{2}%/')
    expect(await percentElements.count()).toBeGreaterThan(0);
  });
});