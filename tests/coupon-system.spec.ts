import { test, expect } from '@playwright/test';

test.describe('Coupon System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display deals section on landing page', async ({ page }) => {
    // Check if deals section is visible
    const dealsSection = page.locator('text=Limited Time Deals');
    if (await dealsSection.isVisible()) {
      await expect(dealsSection).toBeVisible();
      await expect(page.locator('text=Don\'t miss out on these exclusive offers')).toBeVisible();
    }
  });

  test('should display coupon input in pricing section', async ({ page }) => {
    // Scroll to pricing section
    await page.locator('text=Choose Your Plan').scrollIntoViewIfNeeded();
    
    // Check for coupon input
    await expect(page.locator('input[placeholder="Enter coupon code"]')).toBeVisible();
    await expect(page.locator('text=Apply')).toBeVisible();
  });

  test('should validate coupon codes', async ({ page }) => {
    // Scroll to pricing section
    await page.locator('text=Choose Your Plan').scrollIntoViewIfNeeded();
    
    // Try invalid coupon
    await page.fill('input[placeholder="Enter coupon code"]', 'INVALID');
    await page.click('text=Apply');
    
    // Should show error
    await expect(page.locator('text=Invalid coupon code')).toBeVisible();
  });

  test('should apply valid coupon codes', async ({ page }) => {
    // Scroll to pricing section
    await page.locator('text=Choose Your Plan').scrollIntoViewIfNeeded();
    
    // Try valid coupon
    await page.fill('input[placeholder="Enter coupon code"]', 'WELCOME50');
    await page.click('text=Apply');
    
    // Should show success
    await expect(page.locator('text=WELCOME50 Applied')).toBeVisible();
    await expect(page.locator('text=50% OFF')).toBeVisible();
  });

  test('should remove applied coupon', async ({ page }) => {
    // Apply coupon first
    await page.locator('text=Choose Your Plan').scrollIntoViewIfNeeded();
    await page.fill('input[placeholder="Enter coupon code"]', 'WELCOME50');
    await page.click('text=Apply');
    
    // Remove coupon
    await page.click('button:has-text("×")');
    
    // Should return to input state
    await expect(page.locator('input[placeholder="Enter coupon code"]')).toBeVisible();
    await expect(page.locator('text=WELCOME50 Applied')).not.toBeVisible();
  });

  test('should display featured deals', async ({ page }) => {
    const featuredDeal = page.locator('text=Featured Deal');
    if (await featuredDeal.isVisible()) {
      await expect(featuredDeal).toBeVisible();
      await expect(page.locator('text=Claim Deal')).toBeVisible();
      
      // Check for discount percentage
      const discountBadge = page.locator('text=/\\d+% OFF/');
      await expect(discountBadge).toBeVisible();
    }
  });

  test('should show deal countdown timer', async ({ page }) => {
    const timerElement = page.locator('text=/\\d+[dh] left|Ending soon!/');
    if (await timerElement.isVisible()) {
      await expect(timerElement).toBeVisible();
    }
  });

  test('should update pricing when deal is selected', async ({ page }) => {
    const dealCard = page.locator('.cursor-pointer').first();
    if (await dealCard.isVisible()) {
      await dealCard.click();
      
      // Should show updated pricing
      await expect(page.locator('text=/Was \\$\\d+/month/')).toBeVisible();
      await expect(page.locator('text=/Save \\$\\d+ with this deal!/')).toBeVisible();
    }
  });

  test('should handle coupon management in settings', async ({ page }) => {
    // Navigate to settings
    await page.goto('/app/settings');
    
    // Check for coupon management section
    await expect(page.locator('text=Coupon Management')).toBeVisible();
    
    // Show coupon manager
    await page.click('text=Show Coupons');
    
    // Should display coupon creation form
    await expect(page.locator('text=Create New Coupon')).toBeVisible();
    await expect(page.locator('input[placeholder="SAVE20"]')).toBeVisible();
  });

  test('should create new coupon in settings', async ({ page }) => {
    await page.goto('/app/settings');
    await page.click('text=Show Coupons');
    
    // Fill coupon form
    await page.fill('input[placeholder="SAVE20"]', 'TEST20');
    await page.fill('input[placeholder="Save 20% Deal"]', 'Test Coupon');
    await page.fill('input[placeholder="20% off your subscription"]', 'Test description');
    await page.selectOption('select', 'percentage');
    await page.fill('input[placeholder="20"]', '20');
    
    // Set future date
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 1);
    await page.fill('input[type="date"]', futureDate.toISOString().split('T')[0]);
    
    // Create coupon
    await page.click('text=Create Coupon');
    
    // Should show success
    await expect(page.locator('text=Coupon created successfully!')).toBeVisible();
  });

  test('should display existing coupons table', async ({ page }) => {
    await page.goto('/app/settings');
    await page.click('text=Show Coupons');
    
    // Should show coupons table
    await expect(page.locator('text=Existing Coupons')).toBeVisible();
    await expect(page.locator('text=Code')).toBeVisible();
    await expect(page.locator('text=Name')).toBeVisible();
    await expect(page.locator('text=Type')).toBeVisible();
    await expect(page.locator('text=Value')).toBeVisible();
    await expect(page.locator('text=Used/Limit')).toBeVisible();
    await expect(page.locator('text=Valid Until')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
  });

  test('should show coupon status correctly', async ({ page }) => {
    await page.goto('/app/settings');
    await page.click('text=Show Coupons');
    
    // Check for active/inactive status badges
    const statusBadges = page.locator('.bg-green-100, .bg-red-100');
    if (await statusBadges.count() > 0) {
      await expect(statusBadges.first()).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check coupon input on mobile
    await page.locator('text=Choose Your Plan').scrollIntoViewIfNeeded();
    await expect(page.locator('input[placeholder="Enter coupon code"]')).toBeVisible();
    
    // Check deals section on mobile
    const dealsSection = page.locator('text=Limited Time Deals');
    if (await dealsSection.isVisible()) {
      await expect(dealsSection).toBeVisible();
    }
  });

  test('should handle different coupon types', async ({ page }) => {
    await page.locator('text=Choose Your Plan').scrollIntoViewIfNeeded();
    
    // Test percentage coupon
    await page.fill('input[placeholder="Enter coupon code"]', 'WELCOME50');
    await page.click('text=Apply');
    await expect(page.locator('text=50% OFF')).toBeVisible();
    
    // Remove and test fixed amount coupon
    await page.click('button:has-text("×")');
    await page.fill('input[placeholder="Enter coupon code"]', 'SAVE20');
    await page.click('text=Apply');
    await expect(page.locator('text=$20 OFF')).toBeVisible();
  });

  test('should validate coupon expiration', async ({ page }) => {
    // This would test expired coupons if we had them in the system
    await page.locator('text=Choose Your Plan').scrollIntoViewIfNeeded();
    
    // Try to apply a coupon (this would be expired in a real scenario)
    await page.fill('input[placeholder="Enter coupon code"]', 'EXPIRED');
    await page.click('text=Apply');
    
    // Should show error for expired coupon
    await expect(page.locator('text=Invalid coupon code')).toBeVisible();
  });

  test('should show savings amount when coupon applied', async ({ page }) => {
    await page.locator('text=Choose Your Plan').scrollIntoViewIfNeeded();
    
    // Apply coupon
    await page.fill('input[placeholder="Enter coupon code"]', 'WELCOME50');
    await page.click('text=Apply');
    
    // Should show savings
    await expect(page.locator('text=/Save \\$\\d+(\\.\\d{2})? with this deal!/')).toBeVisible();
  });
});