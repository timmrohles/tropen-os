---
status: archived
updated: 2026-05-07
review_by: null
supersedes: []
---

# Konvention-Update-Sprint — Hand-Over

## Status
Teil-erfolgreich — Aufgaben 1–3 + 5 abgeschlossen. Aufgabe 4 (Migration) pausiert für Bestätigung.

---

## Aufgabe 1 — Sprache-Konvention
✓ `docs/CONVENTIONS.md` erweitert — Sektion "Sprache" nach Datei-Namen-Konvention eingefügt.
Englische Datei- und Verzeichnis-Namen, Inhalt darf deutsch sein. Commit: `09b55d7`.

## Aufgabe 2 — Memories-Konvention
✓ `docs/CONVENTIONS.md` erweitert — Sektion "Tool-Memories als Wissens-Quelle".
Memories ergänzen das Repo, ersetzen es nicht. Commit: `0484085`.

## Aufgabe 3 — Brainstorms-Konvention
✓ `docs/CONVENTIONS.md` erweitert — Sektion "Brainstorms und Roh-Material".
Sonderbereich `docs/active/brainstorms/[thema]/`, 30-Tage review_by, Lifecycle. Commit: `6409f3b`.

**Hinweis:** Die Brainstorms-Sektion führt Unterordner unter `docs/active/` ein — das ist eine dokumentierte Ausnahme zur bestehenden Flat-File-Regel. Die bestehende "Nicht erlaubt"-Liste ("Eigene Themen-Unterordner unterhalb von `active/`") sollte bei Gelegenheit mit einem Ausnahme-Hinweis ergänzt werden.

## Aufgabe 4 — Bestands-Migration
**Status:** Pausiert für Bestätigung — 18 Dateien, >5-Schwelle überschritten.

**Migrations-Liste:**

### `docs/active/` (3 Dateien)

| Alt | Neu | Verweise | Code-Referenz | Ampel |
|---|---|---|---|---|
| `marken-brief.md` | `brand-brief.md` | INDEX.md, CLAUDE.md (vielfach), zielbild.md | `src/scripts/` referenzieren STALE-Pfad `docs/product/marken-brief.md` — keine Live-Referenz auf aktiven Pfad | 🟡 (CLAUDE.md-Referenzen, aber nur Doku) |
| `feature-bestand.md` | `feature-inventory.md` | INDEX.md, CLAUDE.md | nein | 🟢 |
| `zielbild.md` | `product-vision.md` | INDEX.md, CLAUDE.md | nein | 🟡 (CLAUDE.md-Referenzen) |

### `docs/decisions/` (15 Dateien)

| Alt | Neu | Verweise | Code-Referenz | Ampel |
|---|---|---|---|---|
| `002-vercel-deployment-plattform.md` | `002-vercel-deployment-platform.md` | INDEX.md | nein | 🟢 |
| `003-supabase-als-auth-und-db.md` | `003-supabase-as-auth-and-db.md` | INDEX.md | nein | 🟢 |
| `006-ai-sdk-als-llm-layer.md` | `006-ai-sdk-as-llm-layer.md` | INDEX.md | nein | 🟢 |
| `007-rollen-architektur.md` | `007-role-architecture.md` | INDEX.md | nein | 🟢 |
| `008-chart-bibliotheken.md` | `008-chart-libraries.md` | INDEX.md | nein | 🟢 |
| `011-conversations-fuer-workspace-chats.md` | `011-conversations-for-workspace-chats.md` | INDEX.md | nein | 🟢 |
| `012-feeds-pipeline-architektur.md` | `012-feeds-pipeline-architecture.md` | INDEX.md | nein | 🟢 |
| `013-library-system-rolle-capability-skill.md` | `013-library-system-role-capability-skill.md` | INDEX.md | nein | 🟢 |
| `015-perspectives-parallele-ki-antworten.md` | `015-perspectives-parallel-ai-responses.md` | INDEX.md | nein | 🟢 |
| `018-windmill-statt-n8n.md` | `018-windmill-instead-of-n8n.md` | INDEX.md | nein | 🟢 |
| `021-prompt-veredler-architecture.md` | `021-prompt-refiner-architecture.md` | INDEX.md | nein | 🟢 |
| `024-marken-pivot.md` | `024-brand-pivot.md` | INDEX.md | nein | 🟢 |
| `025-tab-architektur.md` | `025-tab-architecture.md` | INDEX.md | nein | 🟢 |
| `026-doku-hygiene-tab.md` | `026-docs-hygiene-tab.md` | INDEX.md | nein | 🟢 |
| `027-killer-kriterien-score-pivot.md` | `027-killer-criteria-score-pivot.md` | INDEX.md | nein | 🟢 |

**Offene Fragen vor Migration:**

1. `021-prompt-veredler-architecture.md` → `021-prompt-refiner-architecture.md`? "Veredler" ist produktspezifisch — "refiner" oder "enricher"?
2. `zielbild.md` → `product-vision.md`? Alternativ: `vision.md` (kürzer) oder `target-vision.md` (näher am Wortsinn)?
3. `src/scripts/reviews/` referenzieren stale Pfad `docs/product/marken-brief.md` — sollen diese bei der Migration auf `docs/active/brand-brief.md` korrigiert werden?

**Empfehlung:** docs/decisions-Migrations (15 Dateien, alle 🟢) können direkt durchgezogen werden. docs/active-Migrations (3 Dateien, 🟡) erfordern Bestätigung der offenen Fragen.

## Aufgabe 5 — Audit-Regel-Backlog
✓ `docs/active/zielbild.md` (v3) Teil J: Einträge 8+9 ergänzt.
- Eintrag 8: Audit-Regel Schlüssel-Rotation-Policy (Security, ~3 Tage)
- Eintrag 9: Audit-Regel Lint-Konventions-Tiefe (Architektur, Phase 2, ~1 Woche)
Anhang-Hinweis aktualisiert: "Sieben" → "Neun Strategie-offene Punkte".

---

## Verbleibende Auffälligkeiten

- `src/scripts/reviews/*.ts`: Stale Pfade `docs/product/marken-brief.md` (Pre-Aufräum-Sprint) — kein funktionaler Schaden, aber technische Schuld
- CONVENTIONS.md "Nicht erlaubt"-Liste: Ausnahme für Brainstorms-Unterordner noch nicht dokumentiert — kleiner Widerspruch zwischen Flat-File-Regel und neuer Brainstorms-Sektion

## Empfehlung für nächsten Schritt

1. Offene Fragen zu Aufgabe 4 beantworten → Migration der 18 Dateien
2. K0.7 Distribution-Komitee (Teil J Punkt 4 in zielbild.md)
