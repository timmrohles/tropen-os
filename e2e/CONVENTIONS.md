# E2E Test Conventions

## Selektor-Policy

E2E-Tests verwenden folgende Selektoren (in Priorität):

1. **`getByTestId('...')`** — bevorzugt für App-eigene Komponenten
2. **`getByRole('...')`** — für semantisch valide Elemente (Buttons, Links, Headings)
3. **`#id`-Selektoren** — akzeptabel für stabile Form-Elemente
4. **`getByText()`** — akzeptabel für einmaligen Text (Login-Fehler, Überschriften)

Verboten:

- CSS-Klassen-Selektoren: `page.locator('.btn-primary')`
- Tailwind-Klassen: `page.locator('.flex.items-center')`
- Interne Implementation-Klassen: `page.locator('.ptoro-textarea')`

Begründung: Tailwind-Klassen sind dynamisch, Komponenten werden umbenannt.
`data-testid` ist die explizite Test-Schnittstelle — sie kommuniziert Absicht statt Implementation.

## Naming Convention für data-testid

Format: `<feature>-<element>` (kebab-case)

Beispiele:
- `login-email`
- `login-password`
- `login-submit`
- `audit-run-button`
- `chat-input`
- `chat-send-button`

## ESLint

`eslint-plugin-playwright` ist konfiguriert in `eslint.config.mjs`.

Die Regel `playwright/no-raw-locators` ist auf `warn` gesetzt (nicht `error`) — das erlaubt
eine schrittweise Migration bestehender Tests ohne CI-Fehler zu erzeugen.

Sobald alle Tests auf `getByTestId` / `getByRole` migriert sind, kann die Regel auf `error` hochgestuft werden.

## Status bestehender Tests (Stand 2026-04-30)

| Datei | Status | Selektoren |
|-------|--------|------------|
| `login.spec.ts` | Aktiv, laufen grün | `#email`, `#password` (stabile IDs — konform), `getByRole`, `getByText` |
| `toro-widget.spec.ts` | Übersprungen (`test.skip(true)`) | `.ptoro-textarea` — aber irrelevant, da Widget entfernt |
| `authenticated-chat.spec.ts` | Übersprungen (kein `E2E_EMAIL`) | `.ptoro-textarea`, `textarea[placeholder]` — migration pending |

### Migrations-Backlog

`authenticated-chat.spec.ts` nutzt `.ptoro-textarea` und `textarea[placeholder="..."]`.
Diese Tests sind derzeit per `test.skip(!E2E_EMAIL)` übersprungen — niedrige Priorität.
Bei Reaktivierung: Selektoren auf `data-testid="chat-input"` migrieren.

## data-testid im Source-Code (Stand 2026-04-30)

| Component | data-testid Attribute |
|-----------|-----------------------|
| `src/app/[locale]/login/page.tsx` | `login-email`, `login-password`, `login-submit` |
