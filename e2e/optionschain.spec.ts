import { test, expect } from '@playwright/test'

test('Demo user can access options chain', async ({ page }) => {
  await page.goto('http://localhost:5173/app/optionschain')
  await expect(page.locator('text=Options Chain')).toBeVisible()
})

test('Unauthenticated user is redirected', async ({ page }) => {
  // Simulate logout or no demo mode
  await page.goto('http://localhost:5173/app/optionschain')
  await expect(page.locator('text=Sign In')).toBeVisible()
})