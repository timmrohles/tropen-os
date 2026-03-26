# ADR-009: Vercel als Deployment-Plattform

**Datum:** 2026-02 (initiale Entscheidung) — dokumentiert 2026-03-26
**Status:** Entschieden

---

## Kontext

Tropen OS benötigt eine Deployment-Plattform für eine Next.js-Applikation mit
AI-Streaming, Cron-Jobs, Edge-nahen Funktionen und Preview-Deployments für iterative
Entwicklung. Das Team besteht primär aus 1 Entwickler — Infrastruktur-Aufwand muss minimal sein.

**Anforderungen:**
- Zero-Config-Deployment für Next.js
- Preview-URLs für jeden Commit (Entwicklung ohne Produktions-Risiko)
- Cron-Jobs für Feed-Sync und Agent-Runs
- Env-Variable-Management pro Environment (Development/Preview/Production)
- EU-Hosting möglich (DSGVO)

**Alternativen evaluiert:**
- **AWS Amplify**: Komplexer Setup, kein natives Next.js-Verständnis, mehr DevOps-Aufwand
- **Render**: Gute Next.js-Unterstützung, aber kein globales Edge-Netzwerk, kein Cron ohne Extra-Service
- **Hetzner (self-hosted)**: Volle Kontrolle, aber Nginx, CI/CD, SSL, Monitoring selbst managen — zu viel Overhead für 1-Person-Team
- **Fly.io**: Container-basiert, mehr Flexibilität aber auch mehr Konfiguration

---

## Entscheidung

**Vercel** als einzige Deployment-Plattform.

Genutzte Features:
- **Vercel Functions** (Next.js Route Handlers + Server Actions) — automatisch
- **Edge Network** — globales CDN, ~300ms Propagation
- **Cron Jobs** via `vercel.json` — Feed-Sync (alle 6h), Agent-Runs (alle 7h)
- **Environment Variables** — Development / Preview / Production getrennt
- **Preview Deployments** — jeder Push erzeugt eigene URL
- **`vercel env pull`** — lokale `.env.local` aus Vercel-Settings ziehen

`vercel.json` dokumentiert alle Cron-Definitionen:
```json
{
  "crons": [
    { "path": "/api/feeds/sync", "schedule": "0 */6 * * *" },
    { "path": "/api/agents/run", "schedule": "0 */7 * * *" }
  ]
}
```

---

## Konsequenzen

**Positiv:**
- Deployment auf `git push` ohne CI/CD-Konfiguration
- Preview-URLs ermöglichen Feedback ohne Staging-Server
- Cron-Jobs in `vercel.json` — keine separate Queue-Infrastruktur nötig
- Next.js-spezifische Optimierungen (Image, Font, ISR) out-of-the-box
- EU-Region verfügbar (Frankfurt)

**Negativ / Risiken:**
- Vendor-Bindung: Cron-Syntax, Environment-Variables-Management, Preview-URLs sind Vercel-spezifisch
- Kosten steigen mit Traffic (Function-Invocations, Bandwidth) — bei 10k+ Nutzern prüfen
- Cron-Jobs haben keine Retry-Logik bei Fehlern — Feed-Sync-Fehler werden nur geloggt
- Exit-Strategie: Next.js-Server selbst-hosten möglich, Crons müssten zu eigener Queue migriert werden (z.B. Windmill, ADR-006)
