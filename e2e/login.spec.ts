import { test, expect } from '@playwright/test'

// ─── Login Page ────────────────────────────────────────────────────────────────
// Alle Tests mocken Supabase-Auth – kein echter Account nötig.

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login')
  })

  test('zeigt Login-Formular', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Tropen OS' })).toBeVisible()
    await expect(page.locator('#email')).toBeVisible()
    await expect(page.locator('#password')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Anmelden' })).toBeVisible()
  })

  test('Submit-Button ist klickbar wenn Felder ausgefüllt', async ({ page }) => {
    await page.locator('#email').fill('test@example.com')
    await page.locator('#password').fill('testpassword')
    const btn = page.getByRole('button', { name: 'Anmelden' })
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
    await page.getByRole('button', { name: 'Anmelden' }).click()

    await expect(page.getByText(/Invalid login credentials/i)).toBeVisible({ timeout: 5_000 })
  })

  test('leitet nach erfolgreichem Login auf /chat weiter', async ({ page }) => {
    // Supabase auth/token mocken → gibt gültige Session zurück
    await page.route('**/auth/v1/token**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          access_token: 'fake-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'fake-refresh',
          user: { id: 'user-123', email: 'test@example.com', role: 'authenticated' },
        }),
      })
    )

    // department_members Query mocken
    await page.route('**/rest/v1/department_members**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      })
    )

    await page.locator('#email').fill('test@example.com')
    await page.locator('#password').fill('correctpassword')
    await page.getByRole('button', { name: 'Anmelden' }).click()

    await expect(page).toHaveURL(/\/chat/, { timeout: 8_000 })
  })

  test('Link "Passwort vergessen" ist vorhanden', async ({ page }) => {
    await expect(page.getByRole('link', { name: /Passwort vergessen/i })).toBeVisible()
  })
})
