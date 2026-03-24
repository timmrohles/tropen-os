# Technische Schulden — 2026-03-19

> Erstellt auf Basis des Audit-Reports 2026-03-19 (Score 53.6%, 🟠 Risky).
> Priorisierung nach Sicherheitsrisiko, Compliance-Pflicht und Score-Auswirkung.

---

## Kritisch (vor nächstem Feature-Release beheben)

- [x] **SSRF-Schutz fehlt in Feed-Fetchern** — `rss.ts` fehlte, 2026-03-21 behoben
- [x] **PII in Logs: E-Mail-Adresse** — bereits gefixt (log zeigt keine E-Mail mehr)
- [x] **Email-Inbound-Webhook ohne Signaturvalidierung** — 2026-03-21: `validateWebhookSecret()` via `Authorization: Bearer` + `timingSafeEqual`. `RESEND_INBOUND_SECRET` in `.env.example` dokumentiert.
- [x] **Debug-Route in Produktion** — 2026-03-21: `assertSuperadmin()` Guard in GET + POST, `loggedInAs: user.email` entfernt
- [x] **CSP enthält abgelöste Dify-Domain** — bereits entfernt (war nicht mehr vorhanden)

---

## Wichtig (nächste 4 Wochen)

- [ ] **Kein DR-Runbook** — `docs/runbooks/` fehlt — Aufwand: M
  - Supabase PITR-Status verifizieren und dokumentieren
  - `docs/runbooks/disaster-recovery.md` erstellen: RTO/RPO, Restore-Schritte, Verantwortliche
  - Einmaliger Restore-Test durchführen und protokollieren

- [ ] **DataView.tsx über 500-Zeilen-Grenze** — `src/app/feeds/DataView.tsx` (793 Zeilen) — Aufwand: M
  - CI warnt ab 300, Error ab 500 Zeilen
  - In Sub-Komponenten aufteilen: `DataChart.tsx`, `DataTable.tsx`, `DataFilters.tsx`

- [ ] **Workspaces-Endpoint ohne Pagination** — `src/app/api/workspaces/route.ts` — Aufwand: S
  - `limit` + `offset` Parameter hinzufügen (analog zu `GET /api/projects`)

- [ ] **Datenschutzerklärung unvollständig** — `src/app/datenschutz/page.tsx` — Aufwand: M
  - `[Anschrift]`-Platzhalter durch echte Betreiber-Daten ersetzen
  - Rechtsgrundlagen nach Art. 6 DSGVO pro Datenkategorie dokumentieren
  - Datenschutzbeauftragter / Kontakt ergänzen

- [ ] **Coverage-Thresholds zu eng** — `vitest.config.ts` — Aufwand: M
  - Aktuell: nur 7 Dateien mit 70%-Schwelle
  - Ausweiten auf alle `src/lib/` (feeds/, api/, workspace*, capability*, guided*, agent*)
  - Ziel: 80% auf Business-Logik

- [ ] **Kein Token-Budget per User im Chat** — `src/app/api/chat/stream/route.ts` — Aufwand: M
  - Nur Feed-Budget implementiert (`src/lib/feeds/token-budget.ts`)
  - Chat ohne Nutzer-seitiges Token-Kontingent: unkontrollierte Kosten möglich

- [ ] **Kein Anthropic-Fallback für Chat** — `src/app/api/chat/stream/route.ts`, `src/app/api/workspaces/[id]/chat/route.ts` — Aufwand: S
  - Timeout (30s) + 1 Retry + Fehler-Fallback-Message ("KI momentan nicht erreichbar")
  - Analog zu Haiku-Fallback in `library-resolver.ts`

- [ ] **manifest.json theme_color veraltet** — `public/manifest.json` — Aufwand: S
  - `theme_color: "#a3b554"` ist abgelöstes dunkles Theme
  - Korrektur auf `"#2D7A50"` (`var(--accent)` Wert laut CLAUDE.md)

- [ ] **package.json engines-Feld fehlt** — `package.json` — Aufwand: S
  - `"engines": { "node": ">=20" }` ergänzen (Node-Version nur in `.nvmrc` + CI gepinnt)

---

## Nice-to-have (nächstes Quartal)

- [ ] **Kein SBOM** — Projekt-Root — Aufwand: S
  - `syft . -o cyclonedx-json > sbom.json` als CI-Step nach Install
  - Einmalige Einrichtung, dann automatisch bei jedem Build

- [ ] **Kein Output-Validator für Feed-Stage-2/3** — `src/lib/feeds/pipeline.ts` — Aufwand: M
  - Zod-Schema für Haiku/Sonnet JSON-Responses
  - Analog zu `briefingProposalSchema` in `workspace/briefing.ts`

- [ ] **Sequentieller Feed-Cron** — `src/app/api/cron/sync-feeds/route.ts` — Aufwand: M
  - `for`-Loop über alle Feed-Quellen ist sequentiell
  - Parallelisierung mit `Promise.allSettled()` und Concurrency-Limit

- [ ] **12 TypeScript any-Verwendungen** — verteilt in `src/` — Aufwand: M
  - `grep ": any"` findet 12 Stellen (vorher war 1 das Ziel)
  - Explizite Typen oder dokumentierte Ausnahmen mit Kommentar

- [ ] **Keine /accessibility Seite** — Projekt-Root — Aufwand: S
  - BFSG-Pflicht seit 28.06.2025 für kommerzielle Web-Apps
  - Accessibility-Erklärung nach EU-Standard anlegen

- [ ] **Keine Cloud-Budget-Alerts** — Vercel + Supabase Dashboard — Aufwand: S
  - Monatliche Budget-Alerts in beiden Dashboards einrichten
  - Kein Code-Aufwand, nur Konfiguration

- [ ] **Kein Uptime-Monitoring** — extern — Aufwand: S
  - BetterUptime oder UptimeRobot: `/api/health` alle 5 Minuten pingen
  - Alert bei 503 an Team

- [ ] **SW dify.ai-Referenz** — `public/sw.js` — Aufwand: S
  - `url.hostname.includes('dify')` in Service-Worker-Exclude-Liste (Zeile 45)
  - Dify ist abgelöst — tote Regel entfernen

- [ ] **LangSmith Tracing ohne OpenTelemetry-Standard** — `src/lib/langsmith/` — Aufwand: L
  - `instrumentation.ts` für OpenTelemetry einrichten
  - Vercel OTel-Integration vorhanden

- [ ] **Keine Signed Builds / SLSA** — CI-Pipeline — Aufwand: L
  - Cosign + Sigstore für Build-Artefakt-Signierung
  - SLSA Level 2 als mittelfristiges Ziel

- [ ] **Keine semantische Versionierung** — `package.json: 0.1.0` — Aufwand: S
  - Git-Tags für Releases einführen (`v0.x.y`)
  - `CHANGELOG.md` nach Keep-a-Changelog-Format

- [ ] **feed/page.tsx 505 Zeilen** — `src/app/feeds/page.tsx` — Aufwand: M
  - In Sub-Komponenten aufteilen (über 300-Zeilen-Warnschwelle)

- [ ] **WorkspaceBriefing.tsx 470 Zeilen** — `src/components/workspace/WorkspaceBriefing.tsx` — Aufwand: M
  - Aufteilen in `BriefingHeader.tsx`, `BriefingProposalCard.tsx`

- [ ] **Conversations RLS für workspace_id** — `supabase/migrations/` — Aufwand: S
  - Migration 049 kommentiert: "supabaseAdmin in API layer so RLS is bypassed — no policy change needed"
  - Explizite RLS-Policy für workspace-scoped Conversations für Defense-in-Depth

---

*Letzte Aktualisierung: 2026-03-19*
