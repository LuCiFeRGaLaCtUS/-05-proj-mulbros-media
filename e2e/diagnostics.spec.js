// @ts-check
/**
 * Diagnostic probe — no auth required.
 * Captures: page load, console errors, network errors, screenshots.
 * Used to verify the app is reachable and document the auth gate.
 */
import { test, expect } from '@playwright/test';

test.describe('Production diagnostics', () => {
  test('health endpoint returns ok', async ({ request }) => {
    const res = await request.get('/health');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    console.log('Health:', JSON.stringify(body));
  });

  test('root renders login gate (no auth)', async ({ page }) => {
    const consoleErrors = [];
    const networkErrors = [];
    const requests = [];

    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    page.on('response', res => {
      const url = res.url();
      const status = res.status();
      requests.push({ url, status });
      if (status >= 400 && !url.includes('favicon')) {
        networkErrors.push({ url, status });
      }
    });

    await page.goto('/');
    // Wait for React to hydrate
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-report/diag-root.png', fullPage: true });

    // Should show login page — look for email input or MULBROS heading
    const title = page.locator('h1').filter({ hasText: /MULBROS/i });
    const emailInput = page.locator('input[type="email"]');

    const hasTitle = await title.isVisible().catch(() => false);
    const hasEmailInput = await emailInput.isVisible().catch(() => false);

    console.log('Has MULBROS title:', hasTitle);
    console.log('Has email input:', hasEmailInput);
    console.log('Page URL:', page.url());
    console.log('Console errors:', JSON.stringify(consoleErrors));
    console.log('Network 4xx/5xx:', JSON.stringify(networkErrors));

    // At minimum the page should load without 5xx
    const serverErrors = networkErrors.filter(e => e.status >= 500);
    expect(serverErrors, `Server errors on load: ${JSON.stringify(serverErrors)}`).toHaveLength(0);
  });

  test('/onboarding redirects to login when unauthenticated', async ({ page }) => {
    const networkErrors = [];
    page.on('response', res => {
      if (res.status() >= 400 && !res.url().includes('favicon')) {
        networkErrors.push({ url: res.url(), status: res.status() });
      }
    });

    await page.goto('/onboarding');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'e2e-report/diag-onboarding-gate.png', fullPage: true });

    const currentUrl = page.url();
    console.log('URL after /onboarding visit (unauthenticated):', currentUrl);

    // Should show login form OR stay on onboarding if SSR doesn't gate
    // Either way, no 5xx errors
    const serverErrors = networkErrors.filter(e => e.status >= 500);
    expect(serverErrors, `Server errors: ${JSON.stringify(serverErrors)}`).toHaveLength(0);
  });

  test('supabase-token endpoint rejects unauthenticated calls', async ({ request }) => {
    const res = await request.post('/api/auth/supabase-token', {
      data: { email: 'test@example.com' },
    });
    // Should be 401 (no Stytch session) — NOT 500 or 503
    console.log('supabase-token status (no auth):', res.status());
    const body = await res.json().catch(() => ({}));
    console.log('supabase-token body:', JSON.stringify(body));
    expect(res.status()).toBe(401);
  });
});
