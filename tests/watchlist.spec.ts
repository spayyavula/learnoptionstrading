import { test, expect } from '@playwright/test';

test.describe('Watchlist Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/watchlist');
  });

  test('should display watchlist title', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Watchlist');
  });

  test('should display watchlist statistics cards', async ({ page }) => {
    await expect(page.locator('text=Total Watched')).toBeVisible();
    await expect(page.locator('text=Gainers')).toBeVisible();
    await expect(page.locator('text=Losers')).toBeVisible();
    await expect(page.locator('text=Avg Change')).toBeVisible();
  });

  test('should display my watchlist section', async ({ page }) => {
    await expect(page.locator('text=My Watchlist')).toBeVisible();
    await expect(page.locator('text=Add Stock')).toBeVisible();
  });

  test('should show empty state when no stocks in watchlist', async ({ page }) => {
    await expect(page.locator('text=No stocks in watchlist')).toBeVisible();
    await expect(page.locator('text=Add stocks to track their performance.')).toBeVisible();
    await expect(page.locator('text=Add Your First Stock')).toBeVisible();
  });

  test('should display watchlist table headers', async ({ page }) => {
    await expect(page.locator('text=Symbol')).toBeVisible();
    await expect(page.locator('text=Price')).toBeVisible();
    await expect(page.locator('text=Change')).toBeVisible();
    await expect(page.locator('text=% Change')).toBeVisible();
    await expect(page.locator('text=Added Date')).toBeVisible();
    await expect(page.locator('text=Actions')).toBeVisible();
  });

  test('should open add stock modal', async ({ page }) => {
    await page.click('text=Add Stock');
    
    // Check modal is open
    await expect(page.locator('text=Add Stock to Watchlist')).toBeVisible();
    await expect(page.locator('input[placeholder="Search stocks..."]')).toBeVisible();
    await expect(page.locator('text=Close')).toBeVisible();
  });

  test('should search stocks in add modal', async ({ page }) => {
    await page.click('text=Add Stock');
    
    // Search for AAPL
    await page.fill('input[placeholder="Search stocks..."]', 'AAPL');
    
    // Should show AAPL in results
    await expect(page.locator('text=AAPL')).toBeVisible();
    await expect(page.locator('text=Apple Inc.')).toBeVisible();
    await expect(page.locator('text=Add').last()).toBeVisible();
  });

  test('should add stock to watchlist', async ({ page }) => {
    await page.click('text=Add Stock');
    
    // Search and add AAPL
    await page.fill('input[placeholder="Search stocks..."]', 'AAPL');
    await page.click('text=Add').last();
    
    // Modal should close and stock should be in watchlist
    await expect(page.locator('text=Add Stock to Watchlist')).not.toBeVisible();
    
    // Check if AAPL is now in the watchlist table
    await expect(page.locator('table')).toContainText('AAPL');
  });

  test('should prevent adding duplicate stocks', async ({ page }) => {
    // Add AAPL first
    await page.click('text=Add Stock');
    await page.fill('input[placeholder="Search stocks..."]', 'AAPL');
    await page.click('text=Add').last();
    
    // Try to add AAPL again
    await page.click('text=Add Stock');
    await page.fill('input[placeholder="Search stocks..."]', 'AAPL');
    
    // Should show "Added" instead of "Add"
    await expect(page.locator('text=Added')).toBeVisible();
  });

  test('should remove stock from watchlist', async ({ page }) => {
    // First add a stock
    await page.click('text=Add Stock');
    await page.fill('input[placeholder="Search stocks..."]', 'AAPL');
    await page.click('text=Add').last();
    
    // Now remove it
    await page.click('button[class*="text-red-600"]'); // Trash button
    
    // Confirm removal
    page.on('dialog', dialog => dialog.accept());
    
    // Should be back to empty state
    await expect(page.locator('text=No stocks in watchlist')).toBeVisible();
  });

  test('should close modal when clicking close', async ({ page }) => {
    await page.click('text=Add Stock');
    await expect(page.locator('text=Add Stock to Watchlist')).toBeVisible();
    
    await page.click('text=Close');
    await expect(page.locator('text=Add Stock to Watchlist')).not.toBeVisible();
  });

  test('should close modal when clicking backdrop', async ({ page }) => {
    await page.click('text=Add Stock');
    await expect(page.locator('text=Add Stock to Watchlist')).toBeVisible();
    
    // Click on backdrop
    await page.click('.bg-gray-500');
    await expect(page.locator('text=Add Stock to Watchlist')).not.toBeVisible();
  });

  test('should display correct statistics after adding stocks', async ({ page }) => {
    // Add a stock
    await page.click('text=Add Stock');
    await page.fill('input[placeholder="Search stocks..."]', 'AAPL');
    await page.click('text=Add').last();
    
    // Check statistics updated
    await expect(page.locator('text=Total Watched').locator('..').locator('text=1')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if mobile sidebar toggle is visible
    await expect(page.locator('button[type="button"]').first()).toBeVisible();
    
    // Statistics cards should stack vertically
    const cards = page.locator('.card');
    await expect(cards.first()).toBeVisible();
    
    // Add stock button should be visible
    await expect(page.locator('text=Add Stock')).toBeVisible();
  });

  test('should display stock data with correct formatting', async ({ page }) => {
    // Add a stock first
    await page.click('text=Add Stock');
    await page.fill('input[placeholder="Search stocks..."]', 'AAPL');
    await page.click('text=Add').last();
    
    // Check formatting in the table
    await expect(page.locator('text=AAPL')).toBeVisible();
    await expect(page.locator('text=Apple Inc.')).toBeVisible();
    
    // Check price formatting
    const priceElements = page.locator('text=/\\$\\d+\\.\\d{2}/')
    expect(await priceElements.count()).toBeGreaterThan(0);
  });
});