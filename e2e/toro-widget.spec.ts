import { test, expect } from '@playwright/test'

// ─── Toro Chat Widget (Startseite, öffentlich – kein Login nötig) ──────────────

test.describe('Toro Chat Widget', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('Widget ist sichtbar', async ({ page }) => {
    await expect(page.locator('.ptoro-textarea')).toBeVisible()
  })

  test('Eingabe in Textarea möglich', async ({ page }) => {
    const textarea = page.locator('.ptoro-textarea')
    await textarea.fill('Was ist Tropen OS?')
    await expect(textarea).toHaveValue('Was ist Tropen OS?')
  })

  test('Antwort erscheint nach Nachricht senden', async ({ page }) => {
    // API-Route mocken – kein OpenAI-Call in Tests
    await page.route('**/api/public/chat**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'text/plain',
        body: 'Tropen OS ist ein verantwortungsvoller KI-Workspace für den Mittelstand.',
      })
    )

    const textarea = page.locator('.ptoro-textarea')
    await textarea.fill('Was ist Tropen OS?')

    // Enter zum Absenden (Playwright simuliert Shift+Enter-Logik)
    await textarea.press('Enter')

    // Antwort muss erscheinen
    await expect(
      page.getByText('Tropen OS ist ein verantwortungsvoller KI-Workspace')
    ).toBeVisible({ timeout: 8_000 })
  })

  test('Nutzer-Nachricht erscheint sofort (Optimistic UI)', async ({ page }) => {
    // API langsam mocken – UI soll trotzdem sofort reagieren
    await page.route('**/api/public/chat**', async (route) => {
      await new Promise((r) => setTimeout(r, 2_000))
      await route.fulfill({
        status: 200,
        contentType: 'text/plain',
        body: 'Antwort nach Verzögerung.',
      })
    })

    const textarea = page.locator('.ptoro-textarea')
    await textarea.fill('Hallo Toro!')
    await textarea.press('Enter')

    // Nutzer-Bubble erscheint ohne auf API warten zu müssen
    await expect(page.getByText('Hallo Toro!')).toBeVisible({ timeout: 1_000 })
  })
})
