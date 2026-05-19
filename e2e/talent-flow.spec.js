// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Sprint 5 — Talent flow smoke test.
 *
 * Path: login → (role-pick if onboarding) → /vertical/talent/auditions
 *       → New Audition modal → fill title → submit → row appears.
 *
 * Requires env vars (skips cleanly if absent — CI-friendly):
 *   E2E_TALENT_EMAIL
 *   E2E_TALENT_PASSWORD
 *
 * The test account should already have onboarding_complete=true AND
 * persona_type='talent' set in profiles. If not, the first run will
 * pause at role-pick and fail — reset via Supabase dashboard.
 */

const EMAIL    = process.env.E2E_TALENT_EMAIL;
const PASSWORD = process.env.E2E_TALENT_PASSWORD;

async function loginWithPassword(page) {
  await page.goto('/');
  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.waitFor({ state: 'visible', timeout: 30_000 });
  await emailInput.fill(EMAIL);
  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill(PASSWORD);
  await page.locator('form button[type="submit"]').first().click();
  await page.waitForURL(/\/(onboarding|dashboard|vertical)/, { timeout: 30_000 });
}

test.describe('Talent flow — log audition', () => {
  test.skip(!EMAIL || !PASSWORD, 'E2E_TALENT_EMAIL / E2E_TALENT_PASSWORD not set — skipping');

  test('signed-in talent can add a new audition', async ({ page }) => {
    const networkErrors = [];
    page.on('response', res => {
      if (res.status() >= 500 && !res.url().includes('favicon')) {
        networkErrors.push({ url: res.url(), status: res.status() });
      }
    });

    await loginWithPassword(page);

    // If still in onboarding (account not pre-configured), skip clearly
    if (page.url().includes('/onboarding')) {
      // Try to pick Talent if RolePicker is shown
      const talentBtn = page.locator('[data-testid="role-talent"]');
      if (await talentBtn.count() > 0) {
        await talentBtn.click();
        await page.locator('[data-testid="role-continue"]').click();
      } else {
        test.skip(true, 'Account not pre-configured. Set onboarding_complete=true + persona_type=talent in Supabase first.');
        return;
      }
    }

    // Navigate to auditions view
    await page.goto('/vertical/talent/auditions');
    await page.waitForLoadState('networkidle', { timeout: 20_000 });
    await page.screenshot({ path: 'e2e-report/talent-01-auditions.png', fullPage: true });

    // Open the new-audition modal
    const newBtn = page.locator('[data-testid="auditions-new-btn"]');
    await newBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await newBtn.click();

    // Fill title with unique marker (timestamp) so we can find the new card
    const uniqueTitle = `E2E Audition ${Date.now()}`;
    const titleInput  = page.locator('[data-testid="auditions-form-title"]');
    await titleInput.fill(uniqueTitle);

    // Intercept Supabase POST for the audition insert
    const insertPromise = page.waitForResponse(
      res => res.url().includes('/rest/v1/auditions') && res.request().method() === 'POST',
      { timeout: 15_000 }
    ).catch(() => null);

    await page.locator('[data-testid="auditions-form-submit"]').click();

    const insertRes = await insertPromise;
    if (insertRes) {
      expect(insertRes.status(), `Audition INSERT failed with ${insertRes.status()}`).toBeLessThan(300);
    } else {
      console.warn('Audition INSERT not intercepted');
    }

    // New card should be visible on the board
    await expect(page.getByText(uniqueTitle)).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: 'e2e-report/talent-02-audition-saved.png', fullPage: true });

    // No server errors during the flow
    expect(
      networkErrors,
      `Server errors during talent flow: ${JSON.stringify(networkErrors)}`,
    ).toHaveLength(0);
  });
});
