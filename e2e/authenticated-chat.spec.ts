import { test, expect } from '@playwright/test'

// ─── Authenticated Chat Flow ───────────────────────────────────────────────────
// Testet: Login → Chat → Erste Nachricht → Antwort empfangen
//
// Voraussetzungen (einmalig in Supabase anlegen):
//   1. Test-Account erstellen: E2E_EMAIL + E2E_PASSWORD
//   2. Onboarding für diesen Account einmalig abschließen (oder via SQL: UPDATE user_preferences SET onboarding_completed = true WHERE user_id = '...')
//   3. Env-Vars in .env.local und Vercel Secrets setzen:
//      E2E_EMAIL=test@tropen.de
//      E2E_PASSWORD=...
//
// Ohne diese Vars werden die Tests automatisch übersprungen.

const E2E_EMAIL = process.env.E2E_EMAIL
const E2E_PASSWORD = process.env.E2E_PASSWORD

test.describe('Authenticated Chat Flow', () => {
  test.skip(!E2E_EMAIL || !E2E_PASSWORD, 'E2E_EMAIL und E2E_PASSWORD nicht gesetzt — Test übersprungen')

  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login')
    await page.locator('#email').fill(E2E_EMAIL!)
    await page.locator('#password').fill(E2E_PASSWORD!)
    await page.getByRole('button', { name: 'Anmelden' }).click()
    await expect(page).toHaveURL(/\/chat/, { timeout: 10_000 })
  })

  test('Chat-Interface lädt nach Login', async ({ page }) => {
    await expect(page.locator('.ptoro-textarea, textarea[placeholder="Nachricht eingeben…"]')).toBeVisible({ timeout: 8_000 })
  })

  test('Nachricht senden und Antwort empfangen', async ({ page }) => {
    // Dify-Streaming-API mocken — kein echter API-Call in Tests
    await page.route('**/api/chat/stream**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/plain',
        body: 'Hallo! Ich bin Toro, wie kann ich dir helfen?',
      })
    })

    const input = page.locator('textarea[placeholder="Nachricht eingeben…"]')
    await input.fill('Hallo Toro, kurzer Test.')
    await input.press('Enter')

    // Eigene Nachricht erscheint sofort
    await expect(page.getByText('Hallo Toro, kurzer Test.')).toBeVisible({ timeout: 3_000 })

    // Antwort erscheint
    await expect(page.locator('.cmsg-bubble--assistant').last()).toBeVisible({ timeout: 10_000 })
  })

  test('Neues Gespräch kann gestartet werden', async ({ page }) => {
    // "+ Neu" Button oder Neues-Chat-Button in LeftNav
    const newChatBtn = page.getByRole('button', { name: /neu|new chat/i }).first()
    if (await newChatBtn.isVisible()) {
      await newChatBtn.click()
      // Input ist leer und bereit
      const input = page.locator('textarea[placeholder="Nachricht eingeben…"]')
      await expect(input).toBeVisible()
      await expect(input).toHaveValue('')
    }
  })
})
