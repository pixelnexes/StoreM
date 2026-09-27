import { test, expect } from '@playwright/test';

/**
 * E2E smoke flow. Requires a running app with a seeded database.
 * Run: npm run test:e2e   (see docs/SETUP.md)
 */

test('landing page loads with hero CTA', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Manage Karein/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /Start Free/i }).first()).toBeVisible();
});

test('store owner can log in and reach the dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.getByPlaceholder('03001234567').fill('03001234567');
  await page.getByPlaceholder('••••••••').fill('owner1234');
  await page.getByRole('button', { name: /^Login$/ }).click();
  await expect(page).toHaveURL(/\/app/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
});

test('super admin can log in and see the theme selector', async ({ page }) => {
  await page.goto('/admin/login');
  await page.getByRole('button', { name: /^Login$/ }).click();
  await expect(page).toHaveURL(/\/admin/);
  await expect(page.getByText('Platform Theme')).toBeVisible();
});

test('POS finalizes a cash sale (TC-003/TC-008 end-to-end)', async ({ page }) => {
  await page.goto('/login');
  await page.getByPlaceholder('03001234567').fill('03001234567');
  await page.getByPlaceholder('••••••••').fill('owner1234');
  await page.getByRole('button', { name: /^Login$/ }).click();
  await page.goto('/app/pos');
  await page.getByRole('button', { name: /Lollipop/ }).click();
  await page.getByText('Cash = full amount').click();
  await page.getByRole('button', { name: /Complete Sale/ }).click();
  await expect(page.getByText(/Sale complete/)).toBeVisible();
});
