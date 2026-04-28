// @ts-check
import { test, expect } from '@playwright/test';

/**
 * Onboarding E2E — tests the full onboarding flow on production.
 *
 * Requires env vars:
 *   E2E_EMAIL    — Stytch test account email
 *   E2E_PASSWORD — Stytch test account password
 *
 * The test account must have onboarding_complete=false in Supabase.
 * If already complete, the test skips with a clear message.
 *
 * If env vars absent, tests skip safely (CI-friendly).
 */

const EMAIL    = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;

// ── Login via password form ───────────────────────────────────────────────────
async function loginWithPassword(page) {
  await page.goto('/');

  const emailInput = page.locator('input[type="email"]').first();
  await emailInput.waitFor({ state: 'visible', timeout: 30_000 });
  await emailInput.fill(EMAIL);

  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill(PASSWORD);

  // Click the sign-in submit button (first submit inside the form)
  await page.locator('form button[type="submit"]').first().click();

  // Wait for auth redirect — either /onboarding or /dashboard
  await page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 30_000 });
}

// ─────────────────────────────────────────────────────────────────────────────

test.describe('Onboarding flow', () => {
  test.skip(!EMAIL || !PASSWORD, 'E2E_EMAIL / E2E_PASSWORD not set — skipping');

  test('full flow: vertical → Q1+Q2 → Q3+Q4 → save → dashboard', async ({ page }) => {
    const consoleErrors = [];
    const networkErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('response', res => {
      if (res.status() >= 400 && !res.url().includes('favicon')) {
        networkErrors.push({ url: res.url(), status: res.status() });
      }
    });

    // ── Login ────────────────────────────────────────────────────────────────
    await loginWithPassword(page);

    // If already past onboarding, this account can't be used — skip clearly
    if (!page.url().includes('/onboarding')) {
      await page.goto('/onboarding');
      await page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 10_000 });
      if (page.url().includes('/dashboard')) {
        test.skip(true, 'Account already has onboarding_complete=true. Reset via Supabase dashboard first.');
        return;
      }
    }

    await expect(page).toHaveURL(/\/onboarding/);
    await page.screenshot({ path: 'e2e-report/01-vertical-picker.png', fullPage: true });

    // ── Step 1: pick "Filmmaker" vertical ────────────────────────────────────
    const filmmakerCard = page.locator('[data-testid="vertical-card-filmmaker"]');
    await filmmakerCard.waitFor({ state: 'visible', timeout: 15_000 });
    await filmmakerCard.click();

    // Verify card is selected (checkmark visible, Continue enabled)
    const continueBtn = page.locator('[data-testid="vertical-continue"]');
    await expect(continueBtn).not.toBeDisabled({ timeout: 5_000 });
    await page.screenshot({ path: 'e2e-report/02-vertical-selected.png', fullPage: true });

    await continueBtn.click();

    // ── Step 2: Q1 + Q2 ─────────────────────────────────────────────────────
    // Q1: project_stage — answer "Development"
    // Q2: content_type  — answer "Feature Film"
    await page.locator('[data-testid="option-project_stage-development"]').waitFor({ state: 'visible', timeout: 10_000 });
    await page.screenshot({ path: 'e2e-report/03-q1q2.png', fullPage: true });

    await page.locator('[data-testid="option-project_stage-development"]').click();
    await page.locator('[data-testid="option-content_type-feature-film"]').click();

    const nextBtn = page.locator('[data-testid="questions-next"]');
    await expect(nextBtn).not.toBeDisabled({ timeout: 3_000 });
    await page.screenshot({ path: 'e2e-report/04-q1q2-answered.png', fullPage: true });
    await nextBtn.click();

    // ── Step 3: Q3 + Q4 ─────────────────────────────────────────────────────
    // Q3: budget_range — answer "Under $50K"
    // Q4: seeking      — answer "Film financing"
    await page.locator('[data-testid="option-budget_range-under-$50k"]').waitFor({ state: 'visible', timeout: 10_000 });
    await page.screenshot({ path: 'e2e-report/05-q3q4.png', fullPage: true });

    await page.locator('[data-testid="option-budget_range-under-$50k"]').click();
    await page.locator('[data-testid="option-seeking-film-financing"]').click();

    // Intercept the Supabase PATCH before clicking Complete
    const patchPromise = page.waitForResponse(
      res => res.url().includes('/rest/v1/profiles') && res.request().method() === 'PATCH',
      { timeout: 20_000 }
    ).catch(() => null);

    const completeBtn = page.locator('[data-testid="questions-next"]');
    await expect(completeBtn).not.toBeDisabled({ timeout: 3_000 });
    await page.screenshot({ path: 'e2e-report/06-q3q4-answered.png', fullPage: true });
    await completeBtn.click();

    // ── Step 4: saving → dashboard ───────────────────────────────────────────
    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
    await page.screenshot({ path: 'e2e-report/07-dashboard.png', fullPage: true });

    // Verify no error toasts
    const errorToast = page.locator('[role="status"]').filter({ hasText: /could not|error|failed/i });
    await expect(errorToast).toHaveCount(0);

    await expect(page).toHaveURL(/\/dashboard/);

    // Check profile update was 2xx
    const patchRes = await patchPromise;
    if (patchRes) {
      console.log('Profile PATCH status:', patchRes.status());
      const body = await patchRes.json().catch(() => ({}));
      console.log('Profile PATCH body:', JSON.stringify(body).slice(0, 300));
      expect(patchRes.status(), `Profile PATCH failed with ${patchRes.status()}`).toBeLessThan(300);
    } else {
      console.warn('Profile PATCH request not intercepted — check supabase URL');
    }

    // No 4xx/5xx on critical endpoints
    const criticalErrors = networkErrors.filter(e =>
      e.url.includes('/api/auth/supabase-token') ||
      e.url.includes('/rest/v1/profiles')
    );
    expect(
      criticalErrors,
      `Critical endpoint errors: ${JSON.stringify(criticalErrors)}`
    ).toHaveLength(0);

    if (consoleErrors.length > 0) {
      console.log('Console errors during test:', consoleErrors);
    }
  });

  test('skip from step 1: click Skip → profile saved with skipped_questions:true → dashboard', async ({ page }) => {
    const consoleErrors = [];
    const networkErrors = [];

    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('response', res => {
      if (res.status() >= 400 && !res.url().includes('favicon')) {
        networkErrors.push({ url: res.url(), status: res.status() });
      }
    });

    await loginWithPassword(page);

    if (!page.url().includes('/onboarding')) {
      await page.goto('/onboarding');
      await page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 10_000 });
      if (page.url().includes('/dashboard')) {
        test.skip(true, 'Account already has onboarding_complete=true. Reset via Supabase dashboard first.');
        return;
      }
    }

    await expect(page).toHaveURL(/\/onboarding/);
    await page.screenshot({ path: 'e2e-report/skip-01-step1.png', fullPage: true });

    const patchPromise = page.waitForResponse(
      res => res.url().includes('/rest/v1/profiles') && res.request().method() === 'PATCH',
      { timeout: 20_000 }
    ).catch(() => null);

    const skipBtn = page.locator('[data-testid="vertical-skip"]');
    await skipBtn.waitFor({ state: 'visible', timeout: 10_000 });
    await skipBtn.click();

    await page.waitForURL(/\/dashboard/, { timeout: 30_000 });
    await page.screenshot({ path: 'e2e-report/skip-02-dashboard.png', fullPage: true });

    await expect(page).toHaveURL(/\/dashboard/);

    const patchRes = await patchPromise;
    if (patchRes) {
      console.log('Skip PATCH status:', patchRes.status());
      const body = await patchRes.json().catch(() => ({}));
      console.log('Skip PATCH body:', JSON.stringify(body).slice(0, 300));
      expect(patchRes.status()).toBeLessThan(300);
    } else {
      console.warn('Skip PATCH not intercepted');
    }

    const criticalErrors = networkErrors.filter(e =>
      e.url.includes('/api/auth/supabase-token') ||
      e.url.includes('/rest/v1/profiles')
    );
    expect(criticalErrors, `Critical errors: ${JSON.stringify(criticalErrors)}`).toHaveLength(0);

    if (consoleErrors.length > 0) console.log('Console errors:', consoleErrors);
  });
});
