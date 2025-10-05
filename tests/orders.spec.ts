import { test, expect } from '@playwright/test';

test.describe('Orders Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/orders');
  });

  test('should display orders title', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Orders');
  });

  test('should display order statistics cards', async ({ page }) => {
    await expect(page.locator('text=Total Orders')).toBeVisible();
    await expect(page.locator('text=Pending')).toBeVisible();
    await expect(page.locator('text=Filled')).toBeVisible();
    await expect(page.locator('text=Cancelled')).toBeVisible();
    await expect(page.locator('text=Rejected')).toBeVisible();
  });

  test('should display order history table', async ({ page }) => {
    await expect(page.locator('text=Order History')).toBeVisible();
    
    // Check table headers
    await expect(page.locator('text=Status')).toBeVisible();
    await expect(page.locator('text=Symbol')).toBeVisible();
    await expect(page.locator('text=Type')).toBeVisible();
    await expect(page.locator('text=Order Type')).toBeVisible();
    await expect(page.locator('text=Quantity')).toBeVisible();
    await expect(page.locator('text=Price')).toBeVisible();
    await expect(page.locator('text=Filled Price')).toBeVisible();
    await expect(page.locator('text=Total Value')).toBeVisible();
    await expect(page.locator('text=Date')).toBeVisible();
    await expect(page.locator('text=Actions')).toBeVisible();
  });

  test('should display filter options', async ({ page }) => {
    // Check status filter
    const statusFilter = page.locator('select').first();
    await expect(statusFilter).toBeVisible();
    await expect(statusFilter.locator('option[value="all"]')).toBeVisible();
    await expect(statusFilter.locator('option[value="pending"]')).toBeVisible();
    await expect(statusFilter.locator('option[value="filled"]')).toBeVisible();
    await expect(statusFilter.locator('option[value="cancelled"]')).toBeVisible();
    await expect(statusFilter.locator('option[value="rejected"]')).toBeVisible();
    
    // Check type filter
    const typeFilter = page.locator('select').nth(1);
    await expect(typeFilter).toBeVisible();
    await expect(typeFilter.locator('option[value="all"]')).toBeVisible();
    await expect(typeFilter.locator('option[value="buy"]')).toBeVisible();
    await expect(typeFilter.locator('option[value="sell"]')).toBeVisible();
  });

  test('should show empty state when no orders', async ({ page }) => {
    // Since we start with no orders, should show empty state
    await expect(page.locator('text=No orders found')).toBeVisible();
    await expect(page.locator('text=You haven\'t placed any orders yet.')).toBeVisible();
  });

  test('should filter orders by status', async ({ page }) => {
    // First, place an order to have something to filter
    await page.goto('/trading');
    await page.click('text=AAPL >> .. >> text=Select');
    await page.fill('input[placeholder="Number of shares"]', '10');
    await page.click('text=Place BUY Order');
    
    // Go back to orders page
    await page.goto('/orders');
    
    // Filter by pending
    await page.selectOption('select', 'pending');
    
    // Should show pending orders
    await expect(page.locator('text=pending')).toBeVisible();
  });

  test('should filter orders by type', async ({ page }) => {
    // First, place an order
    await page.goto('/trading');
    await page.click('text=AAPL >> .. >> text=Select');
    await page.fill('input[placeholder="Number of shares"]', '10');
    await page.click('text=Place BUY Order');
    
    // Go back to orders page
    await page.goto('/orders');
    
    // Filter by buy orders
    await page.selectOption('select >> nth=1', 'buy');
    
    // Should show buy orders
    await expect(page.locator('text=BUY')).toBeVisible();
  });

  test('should display order statistics correctly', async ({ page }) => {
    // Check that statistics show 0 initially
    await expect(page.locator('text=Total Orders').locator('..').locator('text=0')).toBeVisible();
    await expect(page.locator('text=Pending').locator('..').locator('text=0')).toBeVisible();
    await expect(page.locator('text=Filled').locator('..').locator('text=0')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if mobile sidebar toggle is visible
    await expect(page.locator('button[type="button"]').first()).toBeVisible();
    
    // Statistics cards should stack vertically
    const cards = page.locator('.card');
    await expect(cards.first()).toBeVisible();
    
    // Table should be scrollable horizontally
    await expect(page.locator('.overflow-x-auto')).toBeVisible();
  });

  test('should handle order cancellation', async ({ page }) => {
    // First, place a limit order (which will be pending)
    await page.goto('/trading');
    await page.click('text=AAPL >> .. >> text=Select');
    await page.selectOption('select', 'limit');
    await page.fill('input[placeholder="Number of shares"]', '10');
    await page.fill('input[placeholder="Price per share"]', '100.00'); // Low price to keep it pending
    await page.click('text=Place BUY Order');
    
    // Go to orders page
    await page.goto('/orders');
    
    // Should see cancel button for pending order
    await expect(page.locator('text=Cancel')).toBeVisible();
  });

  test('should display order details correctly', async ({ page }) => {
    // Place an order first
    await page.goto('/trading');
    await page.click('text=AAPL >> .. >> text=Select');
    await page.fill('input[placeholder="Number of shares"]', '10');
    await page.click('text=Place BUY Order');
    
    // Go to orders page
    await page.goto('/orders');
    
    // Check order details
    await expect(page.locator('text=AAPL')).toBeVisible();
    await expect(page.locator('text=Apple Inc.')).toBeVisible();
    await expect(page.locator('text=BUY')).toBeVisible();
    await expect(page.locator('text=10')).toBeVisible(); // quantity
  });
});