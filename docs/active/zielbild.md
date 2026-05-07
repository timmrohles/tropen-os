---
status: active
updated: 2026-05-07
review_by: 2026-08-07
supersedes:
  - docs/archive/2026-05/zielbild-2026-q3-v2.md
superseded_by: null
---

# Tropen OS — Zielbild Q3 2026 (Version 3)

> **Repo-Pfad:** `docs/active/zielbild.md` (normativ)
> **Vorgänger:** `docs/archive/2026-05/zielbild-2026-q3-v2.md`
> **Erstellt:** 2026-05-07
> **Quelle:** Sparring (8 Achsen) + K0 + K0.5 + K0.6 + Repo-Bestandsaufnahme 2026-05-07
> **Status:** Entwurf für ADR-028. 24h-Wait nach Doku-Fertigstellung.

---

## Vorbemerkung zur Version 3

Version 2 wurde aus zwei Gründen überholt: Erstens hat die Repo-Bestandsaufnahme (2026-05-07) substantielle Substanz sichtbar gemacht, die in v2 nur als 70%-Schätzung stand — präziser jetzt: 255 Regeln in 26 Kategorien, 18 Komitee-Agenten, 33 dokumentierte Komitee-Reviews, plus erhebliche eingefrorene Substanz (Feeds-System, Projektwissen-System, Perspectives-System), die für v3 als Recycling-Kandidaten markierbar ist.

Zweitens hat das K0.6-Komitee die **neunte Achse** sauber etabliert: Doku-Hygiene als fünfte Wissens-Domäne, mit acht konkreten Audit-Findings als MVP-Substanz. Da K0.6 mit ungewöhnlich hoher Konvergenz lief (10 querliegende Konsens-Punkte zwischen 5 Modellen) und die acht Findings deterministisch automatisierbar sind, wird Achse 9 nicht als Wette, sondern als gesetzte Achse aufgenommen.

v3 ist deshalb vollständig — alle neun Achsen, Recycling-Mapping, Inventur-Erkenntnisse, offene Punkte, Wetten, Pricing, Vertrag.

---

## Was sich gegenüber v2 geändert hat — Kurz-Übersicht

| Bereich | v2 | v3 |
|---|---|---|
| **Achse 3 — Wissens-Asymmetrie** | Vier-Domänen-Spezialist | **Fünf-Domänen-Spezialist** (Doku-Hygiene als 5. Domäne) |
| **Achse 9 — Doku-Hygiene** | nicht existent | **Neu, gesetzt** mit 8 konkreten Audit-Findings |
| **Substanz-Bewertung** | "70% vorhanden" als Schätzung | **Präzise** durch Inventur belegt: 255 Regeln, 18 Komitee-Agenten, 33 Reviews, eingefrorene Assets quantifiziert |
| **Eingefrorene Substanz** | abstrakt erwähnt | **Recycling-Mapping** pro Asset gegen v3-Achsen |
| **Tropen-eigene Doku** | "ist von User-Doku getrennt" als Setzung | **Konkrete Konvention** (`AGENTS.md` + `docs/CONVENTIONS.md`) gesetzt |
| **Regelzahl** | "242" | **255** (Code-Stand 2026-05-07) |
| **Quellen-Lücken** | nicht thematisiert | **7 explizit dokumentiert** als verbleibende Unklarheiten |

---

## Teil A — Die neun Achsen

### Achse 1 — Eintritts-Architektur

**Position:** Ein Eintritt mit Verzweigungs-Frage auf Screen 1, kein Modi-Konstrukt.

**Eintritts-Frage:** "Was hast du bereits?"
- **Ein Repo / GitHub-URL** → Repo-Connection-Flow → Audit läuft.
- **Eine Idee / nichts** → 5 kurze Fragen (Vertikale, Datenarten, KI ja/nein, geplante Features, EU-Markt) → initiales Decision-Log + Compliance-Checkliste + Template-Prompts.

**Konvergenz nach Screen 1:** Identisches Dashboard, identische Navigation, identisches Decision-Log, identische Gates. Verzweigung steuert die *erste Aktivität*, nicht das Produkt.

**Substanz-Stand (aus Inventur):**
- ✅ File System Access API vollständig (`src/lib/file-access/`)
- ✅ `/audit/scan` mit `ConnectProjectCard.tsx` (3-Schritt-Flow)
- ✅ Scan-Pipeline via `/api/projects/scan`
- ❌ GitHub-URL-Direkt-Verbindung fehlt
- ❌ "Idee/nichts"-Pfad mit 5-Fragen-Wizard fehlt
- ❌ Verzweigungs-UX zwischen den zwei Pfaden fehlt
- 🔄 Eingefrorene **Guided-Workflows** (7 geseedet) sind potenziell recycelbar für "Idee/nichts"-Pfad

**Begründung Architektur:** Die "zweite App"-Realität — derselbe User durchläuft beide Pfade über die Zeit. Modi als getrennte Produkte hätten das blockiert. K0.5-Komitee bestätigt mit 3-von-5-Konsens.

### Achse 2 — Eingriffs-Logik: Gate-getrieben

**Position:** Pull statt Push. Drei Loci klar getrennt.

| Locus | Verhalten |
|---|---|
| **Editor / Coding-Session (lokal)** | Schweigen. Keine Pop-ups, keine Toasts, keine Background-Watcher. |
| **Pre-Commit-Gate (opt-in)** | Optional aktivierbarer Git-Hook. Blockt nur Critical-Severity in vom User aktivierten Kategorien. |
| **CI/CD-Release-Gate (opt-in)** | `tropen gate --release` blockt bei Critical-Compliance-Verstößen. Override mit Kommentar-Pflicht. |

**Drei Severity-Klassen:** Critical / Should / Info. Default: Critical sichtbar, Should + Info zugeklappt.

**Substanz-Stand (aus Inventur):**
- ✅ Killer-Klassifikation (`killer-rule-ids.ts`) als Critical-Grundlage
- ✅ `shouldBeKiller()` als einziger Entscheidungspunkt
- ✅ Severity-Felder in `audit_findings` (`severity`, `is_killer`)
- ❌ CLI-Tool (`tropen audit`, `tropen gate`) fehlt komplett
- ❌ Pre-Commit-Git-Hook fehlt
- ❌ CI/CD-Release-Gate fehlt
- ⚠ Heutige UI-Schichtung (STOPPER/EMPFOHLEN ZUERST/WEITERE) ist eigene Form — passt funktional, müsste auf v3 abgeglichen werden

**Aufwand-Schätzung CLI:** 4 Wochen (K0.5-Komitee, Sonnet-Warnung gegen 2-3-Wochen-Schätzung).

### Achse 3 — Wissens-Asymmetrie: Fünf-Domänen-Spezialist

**Position:** Tropen ist Fünf-Domänen-Spezialist:

1. **Architektur & Datenmodell** — was wo gehört, Schichten, Trennung
2. **Security & Auth** — RLS, Secrets, Tenant-Isolation
3. **Testing, Monitoring, Operations** — alles ab Live
4. **Compliance** — DSGVO-Kern + BFSG-Basics + AI-Act-Transparenz (CRA in Phase 2)
5. **Doku-Hygiene** — neu in v3, siehe Achse 9 für Substanz

**UX/UI-Konsistenz bleibt gestrichen** — nicht im 6-Monats-Scope.

**Substanz-Stand (aus Inventur):**
- ✅ 7 Domain-Tabs aktiv (code-quality, security, accessibility, dsgvo, ki-act, performance, documentation)
- ✅ DSGVO-Checker (6 automatisierte Rules), BFSG-Checker (5), AI-Act-Checker (5)
- ✅ Compliance-Resolver Stufe 1 (3 Checks aktiv)
- ✅ 18 Komitee-Agenten in `agent-committee-checker.ts`
- 🆕 Doku-Hygiene als Domäne fehlt — Aufbau via 8 Findings (siehe Achse 9)

### Achse 4 — Tool-Verhältnis: Hilfs-Artefakte und Datei-Brücke

**Position:** Tropen baut nie App-Code. Nur Hilfs-Artefakte: Decision-Log, Fix-Prompts, Compliance-Checklisten, Template-Prompts.

**Brücke ins Bau-Tool:** Datei-Export + Zwischenablage. Keine native IDE-Integration in Phase 1.

**Source-of-Truth Decision-Log:** User-Repo ist Master (`.tropen/decision-log.yml`). Tropen-DB hält nur Metadaten.

**Substanz-Stand (aus Inventur):**
- ✅ Fix-Prompt-Generator (Template-Engine + API-Route) vollständig
- ✅ Copy-to-Clipboard in `FixPromptDrawer.tsx` + `PromptCopyButton.tsx`
- ✅ Compliance-Checklisten-Komponenten (`ComplianceBlock`, `ComplianceQuestion`)
- ✅ Prompt-Templates-System (`prompt_templates`-Tabelle + UI)
- ❌ CLI-Tool fehlt
- ❌ Decision-Log als `.tropen/decision-log.yml` fehlt
- ❌ GitHub-Action fehlt
- 🔄 Eingefrorene **Cockpit-Widgets** (10 Komponenten) potenziell recycelbar

### Achse 5 — Schweigen-by-Default mit Chat-Differenzierung

**Position:** Schweigen außerhalb Chat. Proaktiv im Chat, wenn aktiv geöffnet (siehe Wette 4).

**Drei Eingriffs-Modi:**
- **Audit-Pipeline (Repo-Scan):** Pull-Modell. Kein Background-Push.
- **Editor:** Null Pop-ups, null Toasts, null Tab-Badges.
- **Begleiter-Chat (User aktiv):** Kontext-Trigger erlaubt. Lautstärke-Regler still / normal / laut.
- **Email-Digest (opt-in):** Wöchentlicher Bericht.

**Substanz-Stand (aus Inventur):**
- ✅ Chat-Interface vorhanden (eingefroren)
- ✅ Quick-Chips, Intention-System (`conversations.intention`)
- ✅ Workspace-Chat-Substanz vorhanden (`workspace_messages`, `workspace_participants`, `workspace_assets`, `workspace_exports` — aktiv produktiv) — Recycling-Basis für Begleiter-Chat
- ❌ Email-Digest-System fehlt
- ❌ Lautstärke-Regler fehlt
- ❌ Kontext-Trigger im Chat fehlt
- ⚠ Begleiter-Chat als v3-Konzept noch nicht zugeschnitten — Workspace-Chat-Substanz vorhanden, Recycling möglich (siehe Teil B)
- 🔄 Eingefrorenes **Feeds-System** (vollständig gebaut, Cron alle 6h) ist starker Recycling-Kandidat für Email-Digest

### Achse 6 — Projekt-Hygiene über Zeit

**Position:** Decision-Log + Drift-Erkennung + Repo-Hygiene als Querschnitt durch Audit + Chat.

**Cluster 1 — Wissen:** Decision-Log als YAML im User-Repo (`.tropen/decision-log.yml`), ADR-artige Einträge, schlanke Metadaten-DB für Audit-Run-Historie.

**Cluster 2 — UI/Code:** Clean Code kalibriert (Funktion >50 Zeilen, Naming, Cyclomatic Complexity). Severity-Sortierung hält Clean-Code unter Compliance/Security.

**Cluster 3 — Struktur:** Müll-Erkennung (toter Code, doppelte Komponenten, ungenutzte Deps). Drift-Erkennung. Refactoring: Anlass-Erkennung + Meldung.

**Substanz-Stand (aus Inventur):**
- ✅ Score-Trend (`src/lib/audit/trend.ts`), `audit_runs` (APPEND ONLY)
- ✅ Repo-Map-Generator, SLOP-Detection (cat-26) als Müll-Erkennung
- ❌ Decision-Log im User-Repo fehlt
- ❌ Drift-Erkennung Soll vs. Ist fehlt
- 🔄 Eingefrorenes **Projektwissen-System** (`projects`, `project_memory`, `project_documents`) ist starker Recycling-Kandidat für Decision-Log

### Achse 7 — Regelwerk als Kern-Asset

**Position:** 255 Regeln in 26 Kategorien als zentrales Wissens-Asset, vier Use-Cases.

**Vier Use-Cases nach MVP-Priorität:**
1. Audit (heute aktiv) — Kern, läuft mit 255 Regeln
2. Fix-Prompts copy-paste-fähig — heute aktiv
3. Prompt-Veredler — Phase 2
4. Initial-Compliance-Checkliste im "Idee/nichts"-Eintritt — Phase 1, neu

**Substanz-Stand (aus Inventur):**
- ✅ 255 Regeln (im Code gezählt), 18 Komitee-Agenten
- ✅ `finding-recommendations.ts` (2400+ Zeilen) als Wissens-Asset
- ✅ Use-Cases 1+2 aktiv
- ❌ Prompt-Veredler (Use-Case 3) — Phase 2
- ❌ Initial-Compliance-Checkliste (Use-Case 4) fehlt

### Achse 8 — Lernfähigkeit

**Position:** Lernfähigkeit ist strategischer Markenkern, gestaffelte Aktivierung.

| Lernquelle | Phase 1 (0–6 Mon) | Phase 2 (6–12 Mon) | Phase 3 (12+) |
|---|---|---|---|
| **Komitee** | ✅ Aktiv (intern, Regel-Qualität) | ✅ Aktiv (auch user-facing als Premium) | ✅ Aktiv |
| **Externe Quellen** | ✅ Aktiv (CVE-Feeds, Gesetzes-Updates manuell kuratiert) | ✅ Semi-automatisiert | ✅ Aktiv |
| **Repo-Lernen** | ❌ Nicht aktiv | 🟡 Privacy-Architektur, Vertrag, Opt-in | ✅ Aktiv (>500 User statistisch sinnvoll) |

**Substanz-Stand (aus Inventur):**
- ✅ Multi-Model-Komitee vollständig, 33 Komitee-Reviews dokumentiert
- ✅ Agent-Generator + Meta-Review + Deep-Agent-Generator als Lern-Pipeline
- ❌ Externe Quellen automatisiert (CVE-Feed-Ingest) fehlt
- 🔄 Eingefrorenes **Feeds-System** ist Recycling-Kandidat für CVE-/Gesetzes-Feeds

### Achse 9 — Doku-Hygiene als fünfte Wissens-Domäne (NEU)

**Position:** Doku-Wildwuchs ist typisches Vibe-Coding-Phänomen. Tropen scannt User-Repos auf Verstöße gegen Doku-Konvention. Acht konkrete Findings als MVP-Substanz.

**Acht Audit-Findings:**

| # | Finding | Severity |
|---|---|---|
| 1 | Mehrere `status: active`-Dateien gleichen Themas (Levenshtein/Wortstamm) | Critical |
| 2 | Datei in `active/`/`decisions/` ohne gültiges Frontmatter | Should |
| 3 | Verwaiste Datei (in `docs/`, nicht in `INDEX.md` eingetragen) | Should |
| 4 | Parallele Doku-Verzeichnisse (`docs/`, `documents/`, `notes/`, `wiki/`, deutsch+englisch parallel) | Critical |
| 5 | Datei-Suffixe `-v2`, `-new`, `-final`, `-copy`, `-old` | Should |
| 6 | Abgelaufenes `review_by` bei `status: active` | Info |
| 7 | Inkonsistente Status-Werte (außerhalb erlaubter Liste) | Should |
| 8 | Supersedes-Link zeigt auf nicht-existente Datei | Should |
| 9 | Außen-Sicht-Drift: Top-Level-Doku-Dateien (README, CHANGELOG, package.json) enthalten Fakten/Zahlen/Pfade, die von normativen Quellen abweichen | Should/Critical |

**Severity-Differenzierung Finding 9:**

- **Critical** — Außen-Sicht und normative Quelle dokumentieren unterschiedliche Werte zum *gleichen* Schwellwert/Konzept (z.B. README sagt "85% = Production Grade", CLAUDE.md sagt "90% = Production Grade").
- **Should** — Außen-Sicht enthält veraltete Zahlen oder Pfade ohne direkten Widerspruch.

**Erkennung:** Pattern-Match: Zahlen, Pfade, Schwellwerte in README/CHANGELOG/package.json. Cross-Check gegen `docs/active/` und CLAUDE.md. Falsifikation manuell — daher Should-Default, Critical nur bei strikt identischer Begriffs-Verwendung.

**Empirisch validiert:** Im README-Mini-Sprint 2026-05-07 war die Score-Schwellen-Diskrepanz (README 85% vs. CLAUDE.md 90%) ein Finding-9-Critical-Treffer.

**Was Tropen nicht tut:** Inhaltliche Bewertung, automatische Datei-Löschung ohne User-Bestätigung, Eingriff in Code-Inline-Doku.

**Konvention im Detail:** `docs/CONVENTIONS.md` + `AGENTS.md`.

**Substanz-Stand:**
- ❌ Acht Findings als Audit-Regeln fehlen
- ❌ Frontmatter-Parser fehlt
- ❌ Levenshtein/Wortstamm-Ähnlichkeitsanalyse fehlt
- ❌ Index-Validator fehlt

**Aufwand-Schätzung:** 1–2 Wochen (deterministisch automatisierbar, K0.6-Konsens).

---

## Teil B — Recycling-Mapping eingefrorener Substanz

| Asset | Status | v3-Bewertung |
|---|---|---|
| **Projektwissen-System** (`projects`, `project_memory`, `project_documents`) | teilweise aktiv | 🔄 **Recycling für Decision-Log (Achse 6)** — starker Kandidat |
| **Agenten-System** (`agents`, `agent_runs`) | eingefroren | 🟡 Doppelung mit Komitee-Mechanik — Phase 2 prüfen |
| **Guided-Workflows** (7 geseedet) | eingefroren | 🔄 **Recycling für "Idee/nichts"-Pfad (Achse 1)** |
| **Skill-System** (6 geseedet) | nur Schema | ❌ Streichen für Phase 1 |
| **Bookmarks / Inbox** | eingefroren | ❌ Streichen für Phase 1 |
| **MCP-Plan** | nur Konzept | 🟡 Phase 2 (wartet auf OAuth-Keys) |
| **Toro-Chat / Canvas-Chat** | eingefroren | 🟡 Mögl. Substanz für Begleiter-Chat (Achse 5). Konkreter: `workspace_messages`, `workspace_participants`, `workspace_assets`, `workspace_exports` sind aktiv produktiv — Tabellen-Substanz bereits vorhanden, kein Neubau nötig. |
| **Perspectives-System** (vollständig gebaut) | eingefroren | 🔄 Recycling für Komitee-User-Facing (Achse 8 Phase 2) |
| **Feeds-System** (vollständig gebaut) | eingefroren | 🔄 **Höchste Recycling-Priorität** — Email-Digest (Achse 5) + CVE-Feeds (Achse 8) |
| **Cockpit-Widgets** (10 Komponenten) | teilweise aktiv | 🔄 Recycling für Dashboard nach Eintritt (Achse 1) |

**Drei Recycling-Prioritäten Phase 1:**
1. **Feeds-System** → Email-Digest + externe Quellen (Achse 5 + 8)
2. **Projektwissen-System** → Decision-Log-Substanz (Achse 6)
3. **Guided-Workflows** → 5-Fragen-Wizard (Achse 1)

---

## Teil C — Tropens eigene Doku-Konvention

Verbindlich seit 2026-05-07. Bestand im Aufräum-Sprint migriert.

**Zwei normative Dokumente:**
- `AGENTS.md` (Repo-Root) — Pflicht-Eingang für Bau-Agenten
- `docs/CONVENTIONS.md` — vollständige Konvention

**Kern-Regeln:** `docs/active/` + `docs/decisions/` + `docs/archive/YYYY-MM/`, YAML-Frontmatter Pflicht, keine Versions-Suffixe, atomares Archivieren, Tool-Adapter als Pointer.

**Achse 9 als Produkt-Feature deckt dieselbe Konvention für User-Repos ab** — Tropen predigt nicht Wasser und trinkt Wein.

---

## Teil D — Verbindliche Inhalte aus K0.5

### Pricing-Modell

| Tier | Preis/Monat | Inhalt |
|---|---|---|
| **Free** | €0 | Single-Model-Audit, kein Komitee. Lokale Verarbeitung. |
| **Starter** | €19–29 | 5 Komitee-Runs/Monat, Hard-Cap. |
| **Pro** | €49–89 | 10–20 Komitee-Runs/Monat + CLI + GitHub-Action. |
| **Team** | €89–99 | 50 Runs + erweiterte Features. |

**Kalkulation:** Komitee-Run €0.30–€0.80. Marge 55–72%. Keine Pay-as-you-go. Beta: kostenfrei mit 10-Run-Limit.

### Vertrags-Architektur

**Aufwand:** ~€1.500–€2.000 Anwaltskosten, 1–2 Tage. Pflicht vor Beta-Onboarding.

Sechs Bausteine: (1) Daten-Eigentum User 100%, (2) Free/Pro-Audit lokal, (3) Komitee-Calls mit AVV + SCCs + Per-Run-Einwilligung, (4) Aggregierte Metadaten gehören Tropen, (5) EU-Hosting (Hetzner/DE), (6) Phase-2-Klausel Pattern-Sharing als Opt-in.

### Integrations-Architektur

**MVP in 6 Monaten:** Web-Plattform mit File System Access API + CLI-Tool (4 Wochen Aufwand) + GitHub-Action über CLI.

**Ausgeschlossen aus MVP:** native IDE-Plugins, Browser-Extension, Echtzeit-Linting, Background-Watcher.

---

## Teil E — Was die Constraints konkret ausschließen

1. Native IDE-Integration (Cursor / Lovable / Claude Code / Replit)
2. Echtzeit-Linting im Editor
3. Browser-Extension
4. Dreistufiges proaktives Eskalations-Warnsystem mit hartem Stopp
5. Lernen aus User-Repos / ML-basierte Regel-Verbesserung
6. CRA-Tiefe (Phase 2)
7. Komitee als Default-Erfahrung im Hintergrund
8. Persistentes Projekt-Gedächtnis als Graph-DB / Multi-Tier-Architektur
9. Mehrstündiges "Idee/nichts"-Coaching-Onboarding (max. 5-Minuten-Wizard)
10. UX/UI-Konsistenz als Wissens-Domäne
11. UI mit Per-Modell-Drill-Down im Komitee-Output (nur Aggregat + Dissens)
12. Prompt-Veredler in Phase 1 (Phase 2)

---

## Teil F — Vier explizite Wetten

### Wette 1 — Stickiness der asynchronen Architektur
**Setzung:** Schweigen-by-Default + Pull-Modell + kein IDE-Plugin produzieren ein Subscription-Produkt.
**Falsifikation:** Audit-Frequenz pro User <1/Monat nach 8 Wochen Beta.

### Wette 2 — Distribution: Ein Channel für die ersten 30 User existiert
**Setzung:** 30 zahlungsbereite Beta-User in DACH/EU sind erreichbar.
**Falsifikation:** <10 zahlungsbereite Beta-User nach 8 Wochen aktiver Akquise.

### Wette 3 — EU-Moat ist nachhaltig
**Setzung:** Tiefe + Vertrauen + EU-Hosting verteidigt sich gegen US-Konkurrenz.
**Falsifikation:** US-Konkurrent mit ähnlicher EU-Tiefe vor 1.000 zahlenden Tropen-Usern.

### Wette 4 — Chat-Aktivität ist nicht Coding-Flow
**Setzung:** Begleiter-Chat-Sessions vertragen Proaktivität.
**Falsifikation:** Chat-Sessions pro User <2/Monat nach 8 Wochen Beta.

---

## Teil G — Komitee-Sprint-Pipeline

| # | Thema | Status |
|---|---|---|
| **K0** | Exploratives Konzept-Komitee | ✅ Abgeschlossen 2026-05-07 (€0.35) |
| **K0.5** | Vertiefungs-Komitee mit Constraints | ✅ Abgeschlossen 2026-05-07 (€1.59) |
| **K0.6** | Doku-Konvention | ✅ Abgeschlossen 2026-05-07 (€1.54) |
| **K0.7** | Distribution & Go-to-Market | ⏳ Vor Beta-Phase |
| **K0.8** | Retention-Mechanik | ⏳ Vor Beta-Phase, adressiert Wette 1 |
| ~~K1~~ | Projektwissen-Persistenz | ❌ Geschlossen. Decision-Log = Antwort. |
| **K2** | Regel-Qualität + Selektion | ⏳ Phase 2 (mit Veredler) |
| ~~K3~~ | Repo-Lernen Privacy | ❌ Auf Phase 2 verschoben |
| ~~K4~~ | Meta-Agent Verhaltens-Modell | ❌ Eingeschmolzen in Achse 5 |

**Komitee-Investment Phase 1:** ~€3.50 bisher, plus K0.7+K0.8 geschätzt €1.50–2.50.

---

## Teil H — Quellen-Lücken aus Inventur

Stand 2026-05-07: Alle sieben Lücken aus der Repo-Inventur (2026-05-07) sind geschlossen.

| # | Lücke | Status | Befund |
|---|---|---|---|
| 1 | Regelzahl-Diskrepanz | ✅ Geschlossen | 255 Regeln im Code bestätigt (rule-registry.ts). CLAUDE.md aktualisiert. |
| 2 | Skills 4–6 | ✅ Geschlossen | Vollständig: `knowledge_extract`, `report_write`, `social_media_adapt`. Migration `20260318000047_skills.sql` verifiziert. |
| 3 | ADR-Nummern-Lücken 028–030 | ✅ Geschlossen | Wurden nie angelegt — keine echte Lücke. Nächste freie Nummer: ADR-028 (für Pivot zur Begleitplattform). |
| 4 | `connections`-Tabelle | ✅ Geschlossen | Quelle: `031_workspaces_schema.sql`. Aktiv produktiv genutzt. |
| 5 | `workspace_*`-Tabellen | ✅ Geschlossen | `workspace_assets`, `workspace_exports`, `workspace_messages`, `workspace_participants` — alle vier aktiv produktiv. `workspace_messages` ist Kern-Chat-Tabelle (Recycling-Basis für Begleiter-Chat). |
| 6 | `docs/inventory/` vs. `docs/inventur/` | ✅ Geschlossen | Beide Verzeichnisse leer, werden in Aktion 4 entfernt. |
| 7 | ADR-021 Veredler vs. v3 "Phase 2" | ✅ Geschlossen | ADR-021 auf `status: superseded` gesetzt mit Verweis auf v3. |

**Plus ein Folge-Drift entdeckt und korrigiert:**

| Drift | Status | Aktion |
|---|---|---|
| `docs/active/audit-system.md` zeigte 85%-Schwelle, Code sagt 90% | ✅ Korrigiert 2026-05-07 | Doku auf 90/80/60 angepasst — Code ist Wahrheit |

Quellen: `docs/archive/2026-05/quellen-luecken-handover-2026-05-07.md`, `docs/archive/2026-05/readme-mini-sprint-handover-2026-05-07.md`.

---

## Teil I — Implikationen für den Reaktivierungsplan

| Schritt | Original | Status nach v3 |
|---|---|---|
| **1 — Projektwissen strukturieren** | Tage bis Wochen | Decision-Log-Schema, Recycling Projektwissen-System. ~1 Woche. |
| **2 — Meta-Agent Skeleton** | 1–2 Wochen | Bleibt — Begleiter-Chat-Logik. |
| **3 — Prompt-Veredler** | 2 Wochen | Phase 2. |
| **4 — Onboarding** | 1–2 Wochen | Eintritts-Frage statt Modi. Recycling Guided-Workflows möglich. ~1 Woche. |
| **5 — Scanner einordnen** | Im Menü nach unten | Audit ist Haupttür. |
| **6 — Artefakt-Fläche** | 1–2 Wochen | Decision-Log-Viewer + Audit-Report. Recycling Cockpit-Widgets. |
| **7 — Projektboard** | 1–2 Wochen | Phase 2. |

**Neue Schritte aus v3:**
- **N6 — Doku-Konvention durchsetzen:** Aufräum-Sprint im Tropen-Repo, ~3–5 Tage ✅ erledigt
- **N7 — Achse 9 Audit-Findings bauen:** 8 Findings, ~1–2 Wochen

**Aufwand-Bewertung MVP:** ~70% Substanz vorhanden (durch Inventur belegt). 30% Neubau plus Recycling-Anpassungen. Mit 6 Monaten / 1 Person knapp aber machbar.

---

## Teil J — Strategie-offene Punkte

| # | Punkt | Status |
|---|---|---|
| 1 | **Akademie-Verhältnis** | Vor Beta-Marketing-Sprint klären |
| 2 | **Naming-Sprint-Timing** | Pflicht vor Beta-Onboarding |
| 3 | **Beta-Pilot während Umbau** | Beta-User bekommen v3-Produkt |
| 4 | **K0.7 Distribution-Komitee** | Wann? Vor erster Akquise. |
| 5 | **K0.8 Retention-Komitee** | Wann? Adressiert Wette 1. |
| 6 | **CLAUDE.md-Migration** | Bleibt Pointer + Code-Inhalt, oder Code nach `docs/active/code-rules.md`? |
| 7 | **`docs/audit-reports/` Sonderstatus** | Eigene Lifecycle-Regel für Tool-Outputs? |
| 8 | **Audit-Regel Schlüssel-Rotation-Policy** (Achse 3 Domäne 2 — Security) | Phase 1 oder Phase 2: Tropen prüft, ob im Repo eine Schlüssel-Rotations-Policy dokumentiert ist (z.B. via `SECURITY.md` oder ADR). Detection: Existenz-Check + `review_by`-artiger Verfallsdaten-Check. Aufwand: ~3 Tage. |
| 9 | **Audit-Regel Lint-Konventions-Tiefe** (Achse 3 Domäne 1 — Architektur) | Phase 2: MVP prüft heute Lint-Existenz (ESLint, Prettier, TypeScript-Strict). Erweiterung: prüft Lint-Regel-Inhalt gegen Standards (z.B. `airbnb`-Preset, projekt-konsistente Rules). Aufwand: ~1 Woche. |

---

## Teil K — Verbindlichkeit und Disziplin

**Was diese Version 3 ist:**
- Ergebnis aus Sparring + drei Komitee-Sprints (€3.50, 14 Modell-Aggregationen) + vollständiger Repo-Inventur.
- Grundlage für ADR-028. **24h-Wait nach v3-Fertigstellung.**
- Normative Quelle bis durch ADR ersetzt.
- **Vier markierte Wetten** mit Falsifikations-Kriterien.
- **Sieben Quellen-Lücken** offen dokumentiert.

**Was sie nicht ist:** Keine Build-Anweisung. Keine endgültige Roadmap.

**Pivot-Disziplin:** ADR-028 + 24h-Wait sind Pflicht.

---

## Anhang — Kompakte Achsen-Übersicht v3

| # | Achse | v3-Position |
|---|---|---|
| 1 | Eintritts-Architektur | Ein Eintritt mit Verzweigungs-Frage |
| 2 | Eingriffs-Logik | Gate-getrieben, drei Severity-Klassen |
| 3 | Wissens-Asymmetrie | **Fünf-Domänen-Spezialist** (neu: Doku-Hygiene) |
| 4 | Tool-Verhältnis | Hilfs-Artefakte, Web + CLI, keine Plugins |
| 5 | Schweigen-by-Default | Schweigen außerhalb Chat, proaktiv im Chat (Wette 4) |
| 6 | Projekt-Hygiene | Decision-Log + Müll/Drift |
| 7 | Regelwerk | 255 Regeln Kern-Asset |
| 8 | Lernfähigkeit | Komitee + Extern Phase 1, Repo Phase 2/3 |
| 9 | **Doku-Hygiene** (NEU) | Acht Audit-Findings, Konvention via AGENTS.md + CONVENTIONS.md |

**Vier Wetten** · **Drei Recycling-Prioritäten** · **Sieben Quellen-Lücken** · **Neun Strategie-offene Punkte**
