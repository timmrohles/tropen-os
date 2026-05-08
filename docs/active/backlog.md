---
status: active
updated: 2026-05-08
review_by: 2026-08-07
supersedes: []
superseded_by: null
---

# Backlog

> **Single-Source für alle Tropen-Backlog-Items** — Code-Schulden, Phase-2-Features, UX-Items, technische Hygiene.
> **Konvention:** Siehe `docs/active/CONVENTIONS.md` Abschnitt "Backlog-Schema".
> **Was hier nicht reingehört:** Aktive Sprint-Aufgaben (gehören in Sprint-Plan), strategische Entscheidungen (gehören in ADR), Vision-Items (gehören in `docs/active/vision.md`).

---

## Kategorien

Fünf Kategorien, jeweils mit eigener Sektion unten:

- **Vor erstem Kunden** — Beta-Launch-Blocker (Compliance, Backup, Recht) — alle `critical`
- **Code-Schulden** — konkrete TODOs im Code, technische Schuld mit Datei-Referenz
- **Phase-2-Features** — Funktionen, die ADR-028 aus Phase 1 ausgeschlossen hat
- **UX-Items** — Anpassungen am User-Interface, vor Beta zu klären oder später
- **Technische Hygiene** — Tests, Refactoring, Doku-Drift im Code, Performance

---

## Vor erstem Kunden

Items, die Beta-Launch direkt blockieren — Compliance-Voraussetzungen, Backup-Disziplin, rechtliche Pflichten. Alle Items dieser Kategorie sind `critical`.

### Supabase PITR Restore-Test

- **Status:** open
- **Severity:** critical
- **Effort:** S
- **Beschreibung:** Manueller Test des Point-in-Time-Recovery in Supabase. Restore in separates Test-Projekt durchführen, Datenintegrität prüfen, Verfahren dokumentieren. Offen seit 2026-04-21. Reine manuelle Aktion, kein Code.
- **Wann lösen:** Vor erstem Beta-Kunden, nicht aufschiebbar.

### Impressum/Datenschutz Betreiber-Daten

- **Status:** open
- **Severity:** critical
- **Effort:** S
- **Beschreibung:** Platzhalter-Daten im Impressum und in der Datenschutzerklärung durch echte Betreiber-Daten (Tropen Research UG, Berlin) ersetzen. Rechtliche Pflicht ab Live-Schaltung.
- **Wann lösen:** Vor erstem Beta-Kunden, nicht aufschiebbar.

---

## Code-Schulden

### Killer-Count-Proxy in page-data.ts

- **Datei:** `src/.../page-data.ts:34`
- **Status:** open
- **Severity:** should
- **Effort:** S
- **Beschreibung:** Migration 117 hat `is_killer BOOLEAN` auf `audit_findings` eingeführt — das Feld existiert, wird aber im Dashboard-Daten-Layer noch nicht direkt gezählt. Stattdessen wird `critical_findings` aus `audit_runs` als Proxy genutzt. Das ist unpräzise, wenn kritische Findings manuell dismissed wurden.
- **Wann lösen:** Foundation-Phase, falls Decision-Log-Integration ohnehin am Datenmodell arbeitet. Sonst Build.
- **Code-TODO im Repo:** ja (`// TODO: durch echten is_killer-Count ersetzen ...`)

### Unused Dependencies

- **Status:** open
- **Severity:** should
- **Effort:** M
- **Beschreibung:** Vollständige Dependency-Tree-Analyse zur Erkennung ungenutzter Abhängigkeiten. Einzige verbliebene offene Lücke aus dem Gap-Report vom 2026-04-15. Geschätzter Aufwand ~6h.
- **Wann lösen:** Foundation oder Build, je nach Spielraum.

---

## Phase-2-Features

### Compliance-Resolver Stufe 2 — sechs verbleibende Fragen

- **Datei:** `src/.../compliance-resolver.ts`
- **Status:** open
- **Severity:** should
- **Effort:** M
- **Beschreibung:** Stufe 1 ist live (Privacy, Deletion, Data-Location). Stufe 2 enthält sechs Fragen, deren Verkabelung explizit auf nach Beta verschoben wurde:
  - `has_avv_supabase`
  - `has_avv_vercel`
  - `ki_risk_class`
  - `ki_transparency_label`
  - `ki_logging_enabled`
  - `ki_purpose_documented`
- **Wann lösen:** Phase 2, nach Beta-Feedback. Beta soll zeigen, ob diese Fragen sinnvoll sind oder reformuliert werden müssen.
- **Abhängigkeit:** ADR-028 (Pivot-Setzung).

### CLI-Tool

- **Status:** open
- **Severity:** should
- **Effort:** L
- **Beschreibung:** Sub-Kommandos `tropen audit`, `tropen gate`. Mit ADR-028 vollständig aus Phase 1 gestrichen. Beta-Erfahrung läuft web-basiert plus Copy-Paste-Workflow. CLI wird relevant, sobald Pro-Tier (€49–89) live geht und CI/CD-Integration als Premium-Feature erwartet wird.
- **Wann lösen:** Phase 2, nach Beta.
- **Abhängigkeit:** ADR-028.

### Prompt-Veredler-Vollausbau

- **Status:** open
- **Severity:** should
- **Effort:** L
- **Beschreibung:** Foundation enthält Veredler-Skelett (einfache Anreicherung). Vollausbau braucht Tag-/Embedding-basierte Regel-Selektion — Komitee-Frage K2 (Regel-Selektion-Architektur) muss vorgeschaltet werden.
- **Wann lösen:** Phase 2.
- **Abhängigkeit:** K2-Komitee-Sprint.

### Repo-Lernen mit Privacy-Architektur

- **Status:** open
- **Severity:** should
- **Effort:** L
- **Beschreibung:** Lernen aus User-Repos zur Regel-Verbesserung. Bei <500 Usern statistisch bedeutungslos, plus DSGVO-Aufwand (DPIA, AVV, Opt-in-Mechanik) frisst 2–4 Wochen. Auf Phase 2/3 verschoben.
- **Wann lösen:** Phase 2 frühestens, Phase 3 wahrscheinlicher.
- **Abhängigkeit:** Privacy-Architektur-Komitee-Sprint vorab.

### ADR-030 — Profil-System formal definieren

- **Status:** open
- **Severity:** must
- **Effort:** S
- **Beschreibung:** ADR-029 setzt Profil-Schwellen (≥ 2, ≥ 3, ≥ 4) für Kategorie 27, aber das Profil-System selbst (Profile 1–4, Definitionen, Übergangs-Logik, Default-Bindungen für bestehende Regeln) ist nicht formal definiert. ADR-030 schließt diese Lücke.
- **Wann lösen:** Vor Build-Start Kategorie 27 — als Sparring-Session, nicht als Build-Sprint.
- **Abhängigkeit:** ADR-029 (accepted).

### Komitee-Wiederholung mit Opus-Judge (ai-discoverability)

- **Status:** open
- **Severity:** info
- **Effort:** S
- **Beschreibung:** Run 2 des ai-discoverability-Followup lief mit Sonnet als Judge-Fallback, weil Opus persistent Internal Server Error hatte (2026-05-08). Für Robustheits-Validierung der Konvergenz wäre eine Wiederholung mit Opus-Judge wertvoll.
- **Wann lösen:** Phase 2, sobald Opus-API wieder stabil — kein Blocker für Build.

### Checker-Kategorie 27 — Web Discoverability & AI Readiness

- **Status:** open
- **Severity:** should
- **Effort:** M
- **Beschreibung:** Neue Checker-Kategorie für maschinelle Lesbarkeit und AI-Discoverability von Web-Apps. Abzudeckende Regeln nach Komitee-Sprint zu finalisieren — Kandidaten:
  - `robots.txt` vorhanden + AI-Crawler-Direktiven (GPTBot, anthropic-ai, PerplexityBot etc.)
  - `llms.txt` vorhanden (neuer de-facto Standard für LLM-Lesbarkeit)
  - OpenGraph / Meta-Tags (title, description, og:image, og:type)
  - `sitemap.xml` vorhanden + referenziert in robots.txt
  - Canonical URLs gesetzt
  - Structured Data / Schema.org (JSON-LD im `<head>`)
  Core Web Vitals sind explizit *nicht* Teil dieser Kategorie — läuft über Lighthouse/Performance-Tab.
- **Wann lösen:** Phase 2, nach Komitee-Sprint.
- **Abhängigkeit:** Komitee-Sprint `ai-discoverability` muss vorgeschaltet werden (Regelgewichtung, llms.txt-Reifegrad, Scope-Entscheidung B2B vs. B2C vs. Marketing-Site).

### SSRF-Mustererkennung (Audit-Kategorie Sicherheit)

- **Status:** open
- **Severity:** info
- **Effort:** M
- **Beschreibung:** Sicherheits-Kategorie ist aktuell auf 59% automatisiert. SSRF-Mustererkennung würde die Quote anheben — Detection von URL-Konstruktion aus User-Input ohne Allowlist-Check.
- **Wann lösen:** Phase 2.

### Auth-Token-Rotation-Checks (Audit-Kategorie Sicherheit)

- **Status:** open
- **Severity:** info
- **Effort:** M
- **Beschreibung:** HTTP-Header-Analyse zur Erkennung fehlender Token-Rotations-Konfiguration. Erweitert Sicherheits-Kategorie über die heutigen 59% Automatisierung hinaus.
- **Wann lösen:** Phase 2.

### Hex-Farben-Detection in TSX-Dateien (Audit-Kategorie Design System)

- **Status:** open
- **Severity:** info
- **Effort:** S
- **Beschreibung:** Design-System-Kategorie ist auf 33% automatisiert. Hex-Farben außerhalb von Design-Tokens detektieren. Läuft teilweise schon im CI-Lint, müsste in Audit-Pipeline überführt werden.
- **Wann lösen:** Phase 2 oder Beta-Polish.

### Hardcodierte Spacing-Werte (Audit-Kategorie Design System)

- **Status:** open
- **Severity:** info
- **Effort:** S
- **Beschreibung:** Detection von Spacing-Werten (margin, padding, gap), die nicht Design-Token nutzen. Erweitert Design-System-Kategorie.
- **Wann lösen:** Phase 2 oder Beta-Polish.

---

## UX-Items

Drei zusammenhängende Punkte aus dem Findings-UX-Bereich, vor Beta-Einladungen zu klären.

### Ansatz C — Lighthouse Findings nach Typ trennen

- **Status:** open
- **Severity:** must
- **Effort:** M
- **Plan:** `docs/archive/2026-04/ansatz-c-lh-finding-types.md` (im Aufräum-Sprint archiviert — vor Umsetzung in `docs/active/` zurückspielen)
- **Beschreibung:** Lighthouse-Findings nach Typ trennen — Metriken / Opportunities / Diagnostics. Aktuell entstehen ~57 LH-Findings pro Run, die meisten werden dismissed weil unstrukturiert. Trennung würde Severity und Aktion klar zuordbar machen.
- **ADR-029-Verknüpfung:** Voraussetzung für Build von Kategorie 27 (Web Discoverability). Ohne Ansatz C schweigen Web-Discoverability-Findings. Severity von `should` auf `must` angehoben.
- **Wann lösen:** Vor Build-Start Kategorie 27 — nicht mehr Beta-Polish-optional.

### Listen-Ansicht — Truncation, Gruppierung, Titel-Sprache

- **Status:** open
- **Severity:** should
- **Effort:** S
- **Beschreibung:** UX-Anpassung der Findings-Liste. Drei Sub-Items: Truncation langer Titel, Gruppierung nach Kategorie/Severity, Konsistenz der Titel-Sprache (deutsch/englisch).
- **Wann lösen:** Beta-Polish.

### Manual Finding Card UI

- **Status:** open
- **Severity:** info
- **Effort:** S
- **Dokumentation:** in `CLAUDE.md` festgehalten
- **Beschreibung:** UX-Anpassung an der Manual Finding Card. Detail in CLAUDE.md.
- **Wann lösen:** Beta-Polish.

---

## Technische Hygiene

(Leer beim Start. Hier landen Items wie Test-Coverage-Lücken, Refactoring-Anlässe, Performance-Optimierungen.)

---

## Was *nicht* in dieses Backlog gehört

Damit der Backlog Single-Source bleibt, gehören folgende Item-Typen woanders hin:

- **Aktive Sprint-Aufgaben** — gehören in Sprint-Plan oder Build-Prompt
- **Strategische Entscheidungen** — gehören in ADR (`docs/decisions/`)
- **Vision-Items / Achsen-Setzungen** — gehören in `docs/active/vision.md`
- **Personal-Projekte / Marketing-Ideen** — gehören in eigenes System (nicht Tropen-Repo)
- **Brainstorms** — gehören in `docs/active/brainstorms/` (siehe CONVENTIONS.md)

Wenn ein Item den Backlog "verlässt" (z.B. wird zu ADR oder zu aktiver Sprint-Aufgabe), wird es hier auf `done` gesetzt mit Verweis auf neue Quelle, oder gelöscht falls Verweis sich aus dem Kontext ergibt.
