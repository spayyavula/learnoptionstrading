import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display main navigation items', async ({ page }) => {
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Portfolio')).toBeVisible();
    await expect(page.locator('text=Trading')).toBeVisible();
    await expect(page.locator('text=Orders')).toBeVisible();
    await expect(page.locator('text=Watchlist')).toBeVisible();
    await expect(page.locator('text=Analytics')).toBeVisible();
    await expect(page.locator('text=Settings')).toBeVisible();
  });

  test('should display app title', async ({ page }) => {
    await expect(page.locator('text=Paper Trading')).toBeVisible();
  });

  test('should navigate to portfolio page', async ({ page }) => {
    await page.click('text=Portfolio');
    await expect(page).toHaveURL('/portfolio');
    await expect(page.locator('h2')).toContainText('Portfolio');
  });

  test('should navigate to trading page', async ({ page }) => {
    await page.click('text=Trading');
    await expect(page).toHaveURL('/trading');
    await expect(page.locator('h2')).toContainText('Trading');
  });

  test('should navigate to orders page', async ({ page }) => {
    await page.click('text=Orders');
    await expect(page).toHaveURL('/orders');
    await expect(page.locator('h2')).toContainText('Orders');
  });

  test('should navigate to watchlist page', async ({ page }) => {
    await page.click('text=Watchlist');
    await expect(page).toHaveURL('/watchlist');
    await expect(page.locator('h2')).toContainText('Watchlist');
  });

  test('should navigate to analytics page', async ({ page }) => {
    await page.click('text=Analytics');
    await expect(page).toHaveURL('/analytics');
    await expect(page.locator('h2')).toContainText('Analytics');
  });

  test('should navigate to settings page', async ({ page }) => {
    await page.click('text=Settings');
    await expect(page).toHaveURL('/settings');
    await expect(page.locator('h2')).toContainText('Settings');
  });

  test('should highlight active navigation item', async ({ page }) => {
    // Dashboard should be active by default
    await expect(page.locator('text=Dashboard').locator('..')).toHaveClass(/bg-blue-50/);
    
    // Navigate to portfolio
    await page.click('text=Portfolio');
    await expect(page.locator('text=Portfolio').locator('..')).toHaveClass(/bg-blue-50/);
    
    // Dashboard should no longer be active
    await expect(page.locator('text=Dashboard').locator('..')).not.toHaveClass(/bg-blue-50/);
  });

  test('should display page title in header', async ({ page }) => {
    // Should show Dashboard initially
    await expect(page.locator('h2')).toContainText('Dashboard');
    
    // Navigate to different pages and check title updates
    await page.click('text=Portfolio');
    await expect(page.locator('h2')).toContainText('Portfolio');
    
    await page.click('text=Trading');
    await expect(page.locator('h2')).toContainText('Trading');
  });

  test('should show paper trading mode indicator', async ({ page }) => {
    await expect(page.locator('text=Paper Trading Mode')).toBeVisible();
  });

  test('should handle mobile navigation', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Mobile menu button should be visible
    const menuButton = page.locator('button[type="button"]').first();
    await expect(menuButton).toBeVisible();
    
    // Desktop sidebar should be hidden
    await expect(page.locator('.lg\\:fixed')).not.toBeVisible();
    
    // Click menu button to open mobile sidebar
    await menuButton.click();
    
    // Mobile sidebar should be visible
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Portfolio')).toBeVisible();
    
    // Click on a navigation item
    await page.click('text=Portfolio');
    
    // Should navigate and close mobile menu
    await expect(page).toHaveURL('/portfolio');
    await expect(page.locator('h2')).toContainText('Portfolio');
  });

  test('should close mobile menu when clicking backdrop', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Open mobile menu
    await page.locator('button[type="button"]').first().click();
    
    // Click backdrop to close
    await page.locator('.bg-gray-600').click();
    
    // Menu should be closed (navigation items should not be visible)
    await expect(page.locator('.fixed.inset-0.z-50')).not.toBeVisible();
  });

  test('should close mobile menu with X button', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Open mobile menu
    await page.locator('button[type="button"]').first().click();
    
    // Click X button to close
    await page.locator('button').filter({ hasText: /×/ }).click();
    
    // Menu should be closed
    await expect(page.locator('.fixed.inset-0.z-50')).not.toBeVisible();
  });

  test('should maintain navigation state across page refreshes', async ({ page }) => {
    // Navigate to portfolio
    await page.click('text=Portfolio');
    await expect(page).toHaveURL('/portfolio');
    
    // Refresh page
    await page.reload();
    
    // Should still be on portfolio page
    await expect(page).toHaveURL('/portfolio');
    await expect(page.locator('h2')).toContainText('Portfolio');
    await expect(page.locator('text=Portfolio').locator('..')).toHaveClass(/bg-blue-50/);
  });

  test('should handle direct URL navigation', async ({ page }) => {
    // Navigate directly to analytics page
    await page.goto('/analytics');
    
    // Should be on analytics page with correct highlighting
    await expect(page).toHaveURL('/analytics');
    await expect(page.locator('h2')).toContainText('Analytics');
    await expect(page.locator('text=Analytics').locator('..')).toHaveClass(/bg-blue-50/);
  });

  test('should display navigation icons', async ({ page }) => {
    // Check that navigation items have icons (SVG elements)
    const navItems = page.locator('nav a');
    const count = await navItems.count();
    
    for (let i = 0; i < count; i++) {
      const item = navItems.nth(i);
      await expect(item.locator('svg')).toBeVisible();
    }
  });
});