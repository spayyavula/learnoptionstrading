import { test, expect } from '@playwright/test';

test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
  });

  test('should display settings title', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Settings');
  });

  test('should display account overview section', async ({ page }) => {
    await expect(page.locator('text=Account Overview')).toBeVisible();
    await expect(page.locator('text=Account Balance')).toBeVisible();
    await expect(page.locator('text=Total Value')).toBeVisible();
    await expect(page.locator('text=Active Positions')).toBeVisible();
    await expect(page.locator('text=Total Orders')).toBeVisible();
  });

  test('should display notifications settings', async ({ page }) => {
    await expect(page.locator('text=Notifications')).toBeVisible();
    await expect(page.locator('text=Order Fills')).toBeVisible();
    await expect(page.locator('text=Price Alerts')).toBeVisible();
    await expect(page.locator('text=Daily Summary')).toBeVisible();
    await expect(page.locator('text=Market News')).toBeVisible();
  });

  test('should display risk management settings', async ({ page }) => {
    await expect(page.locator('text=Risk Management')).toBeVisible();
    await expect(page.locator('text=Max Position Size')).toBeVisible();
    await expect(page.locator('text=Max Daily Loss')).toBeVisible();
    await expect(page.locator('text=Default Stop Loss (%)')).toBeVisible();
    await expect(page.locator('text=Default Take Profit (%)')).toBeVisible();
  });

  test('should display display settings', async ({ page }) => {
    await expect(page.locator('text=Display Settings')).toBeVisible();
    await expect(page.locator('text=Theme')).toBeVisible();
    await expect(page.locator('text=Currency')).toBeVisible();
    await expect(page.locator('text=Time Zone')).toBeVisible();
    await expect(page.locator('text=Chart Type')).toBeVisible();
  });

  test('should display data management section', async ({ page }) => {
    await expect(page.locator('text=Data Management')).toBeVisible();
    await expect(page.locator('text=Export Data')).toBeVisible();
    await expect(page.locator('text=Import Data')).toBeVisible();
    await expect(page.locator('text=Reset Account')).toBeVisible();
  });

  test('should toggle notification settings', async ({ page }) => {
    // Find order fills checkbox
    const orderFillsCheckbox = page.locator('text=Order Fills').locator('..').locator('input[type="checkbox"]');
    
    // Check initial state (should be checked)
    await expect(orderFillsCheckbox).toBeChecked();
    
    // Toggle it
    await orderFillsCheckbox.click();
    await expect(orderFillsCheckbox).not.toBeChecked();
    
    // Toggle back
    await orderFillsCheckbox.click();
    await expect(orderFillsCheckbox).toBeChecked();
  });

  test('should update risk management values', async ({ page }) => {
    // Find max position size input
    const maxPositionInput = page.locator('text=Max Position Size').locator('..').locator('input');
    
    // Clear and enter new value
    await maxPositionInput.clear();
    await maxPositionInput.fill('15000');
    
    // Check value is updated
    await expect(maxPositionInput).toHaveValue('15000');
  });

  test('should change display settings', async ({ page }) => {
    // Change theme
    const themeSelect = page.locator('text=Theme').locator('..').locator('select');
    await themeSelect.selectOption('dark');
    await expect(themeSelect).toHaveValue('dark');
    
    // Change currency
    const currencySelect = page.locator('text=Currency').locator('..').locator('select');
    await currencySelect.selectOption('EUR');
    await expect(currencySelect).toHaveValue('EUR');
  });

  test('should save settings', async ({ page }) => {
    // Make a change
    const orderFillsCheckbox = page.locator('text=Order Fills').locator('..').locator('input[type="checkbox"]');
    await orderFillsCheckbox.click();
    
    // Save settings
    await page.click('text=Save Settings');
    
    // Should show success message
    await expect(page.locator('text=Settings saved successfully!')).toBeVisible();
  });

  test('should export data', async ({ page }) => {
    // Set up download promise before clicking
    const downloadPromise = page.waitForEvent('download');
    
    // Click export button
    await page.click('text=Export Data');
    
    // Wait for download
    const download = await downloadPromise;
    
    // Check filename pattern
    expect(download.suggestedFilename()).toMatch(/paper-trading-data-\d{4}-\d{2}-\d{2}\.json/);
  });

  test('should handle account reset', async ({ page }) => {
    // Set up dialog handler to cancel
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('Are you sure you want to reset your account?');
      dialog.dismiss();
    });
    
    // Click reset button
    await page.click('text=Reset Account');
  });

  test('should display account values correctly', async ({ page }) => {
    // Check that account values are displayed with proper formatting
    await expect(page.locator('text=$100,000.00')).toBeVisible();
    await expect(page.locator('text=0')).toBeVisible(); // Positions and orders
  });

  test('should have proper form validation', async ({ page }) => {
    // Risk management inputs should accept numbers
    const maxPositionInput = page.locator('text=Max Position Size').locator('..').locator('input');
    await expect(maxPositionInput).toHaveAttribute('type', 'number');
    
    const maxDailyLossInput = page.locator('text=Max Daily Loss').locator('..').locator('input');
    await expect(maxDailyLossInput).toHaveAttribute('type', 'number');
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if mobile sidebar toggle is visible
    await expect(page.locator('button[type="button"]').first()).toBeVisible();
    
    // Settings sections should be visible
    await expect(page.locator('text=Account Overview')).toBeVisible();
    await expect(page.locator('text=Notifications')).toBeVisible();
    
    // Save button should be visible
    await expect(page.locator('text=Save Settings')).toBeVisible();
  });

  test('should display proper input types and attributes', async ({ page }) => {
    // Checkboxes should be checkboxes
    const checkboxes = page.locator('input[type="checkbox"]');
    expect(await checkboxes.count()).toBeGreaterThan(0);
    
    // Number inputs should be number type
    const numberInputs = page.locator('input[type="number"]');
    expect(await numberInputs.count()).toBeGreaterThan(0);
    
    // Selects should have options
    const selects = page.locator('select');
    expect(await selects.count()).toBeGreaterThan(0);
  });

  test('should handle file input for import', async ({ page }) => {
    // Check that file input exists and has correct attributes
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toHaveAttribute('accept', '.json');
  });
});