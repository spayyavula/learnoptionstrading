import { test, expect } from '@playwright/test';

test.describe('Analytics Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/analytics');
  });

  test('should display analytics title', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Analytics');
  });

  test('should display performance overview cards', async ({ page }) => {
    await expect(page.locator('text=Total Return')).toBeVisible();
    await expect(page.locator('text=Win Rate')).toBeVisible();
    await expect(page.locator('text=Total Trades')).toBeVisible();
    await expect(page.locator('text=Concentration')).toBeVisible();
  });

  test('should display portfolio performance chart', async ({ page }) => {
    await expect(page.locator('text=Portfolio Performance')).toBeVisible();
    
    // Check time range buttons
    await expect(page.locator('text=7d')).toBeVisible();
    await expect(page.locator('text=30d')).toBeVisible();
    await expect(page.locator('text=90d')).toBeVisible();
    await expect(page.locator('text=1y')).toBeVisible();
    
    // Check if chart is present
    await expect(page.locator('.recharts-wrapper')).toBeVisible();
  });

  test('should display monthly performance chart', async ({ page }) => {
    await expect(page.locator('text=Monthly Performance')).toBeVisible();
    // Check if bar chart is present
    await expect(page.locator('.recharts-wrapper')).toBeVisible();
  });

  test('should display sector allocation chart', async ({ page }) => {
    await expect(page.locator('text=Sector Allocation')).toBeVisible();
    // Check if pie chart is present
    await expect(page.locator('.recharts-wrapper')).toBeVisible();
  });

  test('should display risk analysis section', async ({ page }) => {
    await expect(page.locator('text=Risk Analysis')).toBeVisible();
    await expect(page.locator('text=Total Positions')).toBeVisible();
    await expect(page.locator('text=Largest Position')).toBeVisible();
    await expect(page.locator('text=Cash Allocation')).toBeVisible();
    await expect(page.locator('text=Avg Volatility')).toBeVisible();
  });

  test('should display top performers section', async ({ page }) => {
    await expect(page.locator('text=Top Performers')).toBeVisible();
    await expect(page.locator('text=No positions to analyze')).toBeVisible();
  });

  test('should display recent activity section', async ({ page }) => {
    await expect(page.locator('text=Recent Activity')).toBeVisible();
    await expect(page.locator('text=No recent activity')).toBeVisible();
  });

  test('should switch time ranges for portfolio performance', async ({ page }) => {
    // Click 7d button
    await page.click('text=7d');
    await expect(page.locator('text=7d')).toHaveClass(/bg-blue-100/);
    
    // Click 90d button
    await page.click('text=90d');
    await expect(page.locator('text=90d')).toHaveClass(/bg-blue-100/);
    
    // Click 1y button
    await page.click('text=1y');
    await expect(page.locator('text=1y')).toHaveClass(/bg-blue-100/);
  });

  test('should display correct initial metrics', async ({ page }) => {
    // Check that initial values are displayed
    await expect(page.locator('text=0')).toBeVisible(); // Total trades
    await expect(page.locator('text=0.0%')).toBeVisible(); // Win rate
    await expect(page.locator('text=100.0%')).toBeVisible(); // Cash allocation
  });

  test('should display currency formatting correctly', async ({ page }) => {
    // Check for proper currency formatting
    const currencyElements = page.locator('text=/\\$[\\d,]+\\.\\d{2}/')
    expect(await currencyElements.count()).toBeGreaterThan(0);
  });

  test('should display percentage formatting correctly', async ({ page }) => {
    // Check for proper percentage formatting
    const percentElements = page.locator('text=/\\d+\\.\\d{1,2}%/')
    expect(await percentElements.count()).toBeGreaterThan(0);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if mobile sidebar toggle is visible
    await expect(page.locator('button[type="button"]').first()).toBeVisible();
    
    // Performance cards should stack vertically
    const cards = page.locator('.card');
    await expect(cards.first()).toBeVisible();
    
    // Time range buttons should be visible
    await expect(page.locator('text=7d')).toBeVisible();
  });

  test('should display charts with proper dimensions', async ({ page }) => {
    // Check that charts have proper height
    const chartContainers = page.locator('.h-80');
    expect(await chartContainers.count()).toBeGreaterThan(0);
    
    // Check that ResponsiveContainer is present
    const responsiveContainers = page.locator('.recharts-responsive-container');
    expect(await responsiveContainers.count()).toBeGreaterThan(0);
  });

  test('should show risk metrics with proper values', async ({ page }) => {
    // Check risk analysis values
    await expect(page.locator('text=Risk Analysis').locator('..').locator('text=0')).toBeVisible(); // Total positions
    await expect(page.locator('text=Risk Analysis').locator('..').locator('text=0.0%')).toBeVisible(); // Largest position
  });

  test('should handle empty state for performance sections', async ({ page }) => {
    // Top performers should show empty state
    await expect(page.locator('text=No positions to analyze')).toBeVisible();
    
    // Recent activity should show empty state
    await expect(page.locator('text=No recent activity')).toBeVisible();
  });
});