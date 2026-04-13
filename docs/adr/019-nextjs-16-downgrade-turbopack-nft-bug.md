# ADR-019: Next.js 16 → 15 Downgrade (Turbopack Middleware NFT Bug)

**Status:** Accepted  
**Datum:** 2026-04-10  
**Kontext:** Build-Infrastruktur / Bundler  

---

## Problem

Nach dem i18n-Umbau (`feat/repo-map-generator` → `main`, commit `ec1ec34`) schlug der
Vercel-Produktionsbuild mit Next.js 16 fehl. Ursache war ein Turbopack-Bug beim
**Node File Tracing (NFT)** für Middleware.

**Das Problem ist KEIN next-intl-Kompatibilitätsproblem.**  
next-intl `4.9.1` funktioniert problemlos mit Next.js 15 und ist weiterhin installiert.

---

## Fehler-Chronologie (Commits vom 2026-04-10)

| Commit | Aktion | Ergebnis |
|--------|--------|---------|
| `b875aed` | Upgrade auf Next.js 16.2.3 | Build bricht mit Turbopack NFT-Fehler |
| `d795fe4` | `turbopack.root: __dirname` aus `next.config.ts` entfernt | Build bricht weiterhin |
| `e7bfa6e` | `next build --no-turbopack` Flag gesetzt | Build bricht weiterhin |
| `7a1d7b3` | `NEXT_NO_TURBOPACK=1` Env-Var gesetzt | Build bricht weiterhin |
| `e4e4f95` | Downgrade auf `^15.5.15`, `NEXT_NO_TURBOPACK=1` entfernt | ✅ Build erfolgreich |

**Fazit:** Selbst erzwungener Webpack-Modus (`--no-turbopack`, `NEXT_NO_TURBOPACK=1`) hat den
Bug nicht behoben — die NFT-Fehler entstanden bereits in der Turbopack-Infrastruktur von
Next.js 16, nicht nur beim Turbopack-Bundling selbst.

---

## Entscheidung

Downgrade auf `next: ^15.5.15`.

`eslint-config-next` bleibt auf `^16.2.1` (kein Konflikt, reine Dev-Dependency).
`@next/bundle-analyzer` bleibt auf `^16.2.2` (kein Konflikt).

---

## Was wir durch den Downgrade verlieren

| Feature | Status |
|---------|--------|
| Turbopack Production Builds (16.x) | Nicht mehr verfügbar — aber durch den NFT-Bug ohnehin nicht nutzbar |
| `turbopack.root` Config-Option | Entfernt aus `next.config.ts` |
| Potenzielle Speed-Improvements des Turbopack-Prod-Bundlers | Nicht messbar nutzbar gewesen |

Funktional verlieren wir **nichts** — alle Features (Middleware, i18n, App Router) laufen
unter Next.js 15 stabil.

---

## Upgrade-Kriterien: Wann können wir wieder auf Next.js 16?

Upgrade auf Next.js 16.x ist möglich wenn **alle** dieser Bedingungen erfüllt sind:

1. **Turbopack NFT-Bug für Middleware ist in Next.js 16 gefixt**  
   → Offizieller Fix in Release Notes dokumentiert oder GitHub-Issue geschlossen  
   → Verifizierbarer Vercel-Deployment-Test mit unserem Middleware-Setup

2. **i18n-Routing funktioniert unter Next.js 16**  
   → `next-intl 4.x` mit `[locale]`-Routing muss explizit auf Next.js 16 getestet sein  
   → Middleware (`src/middleware.ts`) muss korrekt `createMiddleware()` + `createServerClient()` durchführen

3. **Vercel Build-Test bestanden**  
   → Produktionsbuild auf Vercel ohne `NEXT_NO_TURBOPACK`-Flag durchläuft  
   → Middleware wird korrekt deployed (kein NFT-Fehler)

**Empfohlener Zeitpunkt für nächsten Upgrade-Versuch:** Nach Next.js 16.3.x oder wenn
in den Release Notes explizit "Fix: Middleware NFT tracing" erwähnt wird.

---

## Konsequenzen

- **Positiv:** Stabiler Produktionsbuild auf Vercel
- **Positiv:** Kein funktionaler Verlust — alle Features laufen unter Next.js 15
- **Negativ:** Kein Turbopack Production-Bundling (war durch den Bug ohnehin nicht nutzbar)
- **Negativ:** CLAUDE.md Tech-Stack-Tabelle muss auf `^15.5.15` korrigiert werden
- **Neutral:** `eslint-config-next ^16.x` und `@next/bundle-analyzer ^16.x` bleiben installiert (keine Konflikte)

---

## Tracking

Wenn ein Upgrade-Versuch stattfindet:
1. Branch `feat/nextjs16-retry` anlegen
2. `next: ^16.x.y` in `package.json` setzen
3. Lokaler Build: `pnpm build` — muss grün sein
4. Vercel Preview Deployment — muss grün sein  
5. Middleware-Test: `/de/dashboard` und `/en/dashboard` müssen korrekt routen
6. Erst dann Merge auf `main`
