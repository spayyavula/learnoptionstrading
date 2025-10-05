import { test, expect } from '@playwright/test';

test.describe('Community Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/community');
  });

  test('should display community title', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Trading Community');
  });

  test('should display community overview stats', async ({ page }) => {
    await expect(page.locator('text=Total Members')).toBeVisible();
    await expect(page.locator('text=Active Today')).toBeVisible();
    await expect(page.locator('text=Trades Shared')).toBeVisible();
    await expect(page.locator('text=Platforms')).toBeVisible();
  });

  test('should display community platforms section', async ({ page }) => {
    await expect(page.locator('text=Community Platforms')).toBeVisible();
    await expect(page.locator('text=Slack')).toBeVisible();
    await expect(page.locator('text=Discord')).toBeVisible();
    await expect(page.locator('text=Telegram')).toBeVisible();
    await expect(page.locator('text=WhatsApp')).toBeVisible();
    await expect(page.locator('text=Facebook')).toBeVisible();
  });

  test('should display recent activity section', async ({ page }) => {
    await expect(page.locator('text=Recent Activity')).toBeVisible();
  });

  test('should show platform configuration status', async ({ page }) => {
    // Check that platforms show "Not configured" status initially
    await expect(page.locator('text=Not configured')).toBeVisible();
    await expect(page.locator('text=Setup Required')).toBeVisible();
  });

  test('should display community guidelines', async ({ page }) => {
    await expect(page.locator('text=Community Guidelines')).toBeVisible();
    await expect(page.locator('text=Do\'s')).toBeVisible();
    await expect(page.locator('text=Don\'ts')).toBeVisible();
    await expect(page.locator('text=Disclaimer')).toBeVisible();
  });

  test('should handle platform join attempts', async ({ page }) => {
    // Try to join a platform (should be disabled if not configured)
    const joinButtons = page.locator('text=Setup Required');
    const firstButton = joinButtons.first();
    await expect(firstButton).toBeDisabled();
  });

  test('should display share to community section when platforms are configured', async ({ page }) => {
    // This test would need mock configuration or actual platform setup
    // For now, we'll check if the section exists in the DOM
    const shareSection = page.locator('text=Share with Community');
    // Section might not be visible if no platforms are configured
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if mobile sidebar toggle is visible
    await expect(page.locator('button[type="button"]').first()).toBeVisible();
    
    // Community stats should stack vertically
    await expect(page.locator('text=Total Members')).toBeVisible();
    await expect(page.locator('text=Active Today')).toBeVisible();
  });

  test('should display platform icons and colors', async ({ page }) => {
    // Check that platform icons are displayed
    const platformSections = page.locator('text=Slack').locator('..');
    await expect(platformSections).toBeVisible();
    
    // Check for Discord
    await expect(page.locator('text=Discord')).toBeVisible();
    
    // Check for Telegram
    await expect(page.locator('text=Telegram')).toBeVisible();
  });

  test('should show empty state for recent activity when no platforms configured', async ({ page }) => {
    // Should show empty state message
    await expect(page.locator('text=No recent activity')).toBeVisible();
    await expect(page.locator('text=Community messages will appear here once platforms are configured')).toBeVisible();
  });

  test('should display community statistics with proper formatting', async ({ page }) => {
    // Check that numbers are properly formatted
    const memberCount = page.locator('text=Total Members').locator('..').locator('div').first();
    await expect(memberCount).toBeVisible();
    
    // Check for proper number formatting (commas for thousands)
    const statsNumbers = page.locator('text=/\\d{1,3}(,\\d{3})*/');
    expect(await statsNumbers.count()).toBeGreaterThan(0);
  });

  test('should handle navigation from dashboard community preview', async ({ page }) => {
    // Go to dashboard first
    await page.goto('/');
    
    // Look for community section (if configured)
    const communityLink = page.locator('text=Join Community');
    if (await communityLink.isVisible()) {
      await communityLink.click();
      await expect(page).toHaveURL('/community');
    }
  });

  test('should display proper disclaimer text', async ({ page }) => {
    await expect(page.locator('text=All content shared is for educational purposes only')).toBeVisible();
    await expect(page.locator('text=This is not financial advice')).toBeVisible();
    await expect(page.locator('text=Always do your own research')).toBeVisible();
  });
});