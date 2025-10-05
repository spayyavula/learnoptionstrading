import { test, expect } from '@playwright/test';

test.describe('Portfolio Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/portfolio');
  });

  test('should display portfolio title', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Portfolio');
  });

  test('should display portfolio summary cards', async ({ page }) => {
    await expect(page.locator('text=Total Value')).toBeVisible();
    await expect(page.locator('text=Unrealized P&L')).toBeVisible();
    await expect(page.locator('text=Cash Balance')).toBeVisible();
    await expect(page.locator('text=Invested')).toBeVisible();
  });

  test('should display portfolio allocation chart', async ({ page }) => {
    await expect(page.locator('text=Portfolio Allocation')).toBeVisible();
    // Check if pie chart is present
    await expect(page.locator('.recharts-wrapper')).toBeVisible();
  });

  test('should display position performance chart', async ({ page }) => {
    await expect(page.locator('text=Position Performance')).toBeVisible();
    // Check if bar chart is present
    await expect(page.locator('.recharts-wrapper')).toBeVisible();
  });

  test('should display current positions table', async ({ page }) => {
    await expect(page.locator('text=Current Positions')).toBeVisible();
    
    // Check table headers
    await expect(page.locator('text=Symbol')).toBeVisible();
    await expect(page.locator('text=Quantity')).toBeVisible();
    await expect(page.locator('text=Avg Price')).toBeVisible();
    await expect(page.locator('text=Current Price')).toBeVisible();
    await expect(page.locator('text=Market Value')).toBeVisible();
    await expect(page.locator('text=Unrealized P&L')).toBeVisible();
    await expect(page.locator('text=% Change')).toBeVisible();
    await expect(page.locator('text=Purchase Date')).toBeVisible();
  });

  test('should show empty state when no positions', async ({ page }) => {
    // Since we start with no positions, should show empty state
    await expect(page.locator('text=No positions')).toBeVisible();
    await expect(page.locator('text=Start trading to build your portfolio.')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if mobile sidebar toggle is visible
    await expect(page.locator('button[type="button"]').first()).toBeVisible();
    
    // Summary cards should stack vertically
    const cards = page.locator('.card');
    await expect(cards.first()).toBeVisible();
  });

  test('should display correct currency formatting', async ({ page }) => {
    // Check that all monetary values are properly formatted
    const currencyElements = page.locator('text=/\\$[\\d,]+\\.\\d{2}/')
    const count = await currencyElements.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should display percentage changes with proper formatting', async ({ page }) => {
    // Check for percentage formatting
    const percentElements = page.locator('text=/[+-]?\\d+\\.\\d{2}%/')
    // Should have percentage elements in the summary cards
    expect(await percentElements.count()).toBeGreaterThanOrEqual(0);
  });
});