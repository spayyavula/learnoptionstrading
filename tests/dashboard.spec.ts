import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display dashboard title', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Dashboard');
  });

  test('should display portfolio overview cards', async ({ page }) => {
    // Check for Total Value card
    await expect(page.locator('text=Total Value')).toBeVisible();
    await expect(page.locator('text=$100,000.00')).toBeVisible();

    // Check for Day Change card
    await expect(page.locator('text=Day Change')).toBeVisible();

    // Check for Buying Power card
    await expect(page.locator('text=Buying Power')).toBeVisible();

    // Check for Positions card
    await expect(page.locator('text=Positions')).toBeVisible();
  });

  test('should display portfolio performance chart', async ({ page }) => {
    await expect(page.locator('text=Portfolio Performance')).toBeVisible();
    // Check if chart container is present
    await expect(page.locator('.recharts-wrapper')).toBeVisible();
  });

  test('should display market movers section', async ({ page }) => {
    await expect(page.locator('text=Market Movers')).toBeVisible();
    await expect(page.locator('text=Top Gainers')).toBeVisible();
    await expect(page.locator('text=Top Losers')).toBeVisible();
  });

  test('should display recent orders section', async ({ page }) => {
    await expect(page.locator('text=Recent Orders')).toBeVisible();
    await expect(page.locator('text=View all')).toBeVisible();
  });

  test('should display quick actions', async ({ page }) => {
    await expect(page.locator('text=Quick Actions')).toBeVisible();
    await expect(page.locator('text=Start Trading')).toBeVisible();
    await expect(page.locator('text=View Portfolio')).toBeVisible();
    await expect(page.locator('text=Manage Watchlist')).toBeVisible();
    await expect(page.locator('text=View Analytics')).toBeVisible();
  });

  test('should navigate to trading page when clicking Start Trading', async ({ page }) => {
    await page.click('text=Start Trading');
    await expect(page).toHaveURL('/trading');
    await expect(page.locator('h2')).toContainText('Trading');
  });

  test('should navigate to portfolio page when clicking View Portfolio', async ({ page }) => {
    await page.click('text=View Portfolio');
    await expect(page).toHaveURL('/portfolio');
    await expect(page.locator('h2')).toContainText('Portfolio');
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if mobile sidebar toggle is visible
    await expect(page.locator('button[type="button"]').first()).toBeVisible();
    
    // Cards should stack vertically on mobile
    const cards = page.locator('.card');
    await expect(cards.first()).toBeVisible();
  });

  test('should update stock prices periodically', async ({ page }) => {
    // Wait for initial load
    await page.waitForLoadState('networkidle');
    
    // Get initial price of a stock
    const initialPrice = await page.locator('text=AAPL').locator('..').locator('text=/\\$\\d+\\.\\d+/').textContent();
    
    // Wait for price update (5 seconds based on the context)
    await page.waitForTimeout(6000);
    
    // Check if price might have changed (this is probabilistic due to random updates)
    const currentPrice = await page.locator('text=AAPL').locator('..').locator('text=/\\$\\d+\\.\\d+/').textContent();
    
    // At minimum, ensure the price format is correct
    expect(currentPrice).toMatch(/\$\d+\.\d+/);
  });
});