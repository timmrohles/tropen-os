import { test, expect } from '@playwright/test'

// ─── Login Page ────────────────────────────────────────────────────────────────
// Alle Tests mocken Supabase-Auth – kein echter Account nötig.

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/en/login')
  })

  test('zeigt Login-Formular', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Tropen OS' })).toBeVisible()
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign in' })).toBeVisible()
  })

  test('Submit-Button ist klickbar wenn Felder ausgefüllt', async ({ page }) => {
    await page.locator('#email').fill('test@example.com')
    await page.locator('#password').fill('testpassword')
    const btn = page.getByRole('button', { name: 'Sign in' })
    await expect(btn).not.toBeDisabled()
  })

  test('zeigt Fehlermeldung bei ungültigen Credentials', async ({ page }) => {
    // Supabase auth/token Endpunkt mocken → gibt 400 zurück
    await page.route('**/auth/v1/token**', (route) =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' }),
      })
    )

    await page.locator('#email').fill('wrong@example.com')
    await page.locator('#password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Sign in' }).click()

    await expect(page.getByText(/Invalid login credentials/i)).toBeVisible({ timeout: 5_000 })
  })

  test.skip('leitet nach erfolgreichem Login auf /chat weiter', async ({ page }) => {
    // Dieser Test benötigt eine echte Supabase-Session, da die Next.js-Middleware
    // serverseitig /auth/v1/user aufruft und page.route() nur Browser-Requests mockt.
    // TODO: In Integration-Tests mit echtem Supabase testen.
  })

  test('Link "Passwort vergessen" ist vorhanden', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Forgot password/i })).toBeVisible()
  })
})
