# Feature-Bestand
> Wartungs-Doku des technischen Bestands von Tropen OS
> Stand: 2026-04-27 (initial aus Tag-3-Produkt-Inventur abgeleitet)
> Pflicht-Lektüre vor Code-Änderungen an einem Feature: dieser Eintrag

---

## Wie diese Datei zu lesen ist

Diese Datei beschreibt, **was im Code steht** — nicht was sein soll. Sie ist die Wartungs-Doku.

**Strategische Quelle bleibt `docs/product/roadmap-2026-q2.md`.** Bei Konflikt: Roadmap gewinnt.

**Status-Marker pro Feature:**

| Marker | Bedeutung | Code-Status |
|--------|-----------|-------------|
| 🟢 **LIVE** | Aktiv genutzt, in der Roadmap-MVP-Vision | Code aktiv, kein Feature-Flag |
| 🟡 **POLISH** | Aktiv, aber Verbesserung in einem kommenden Sprint geplant | Code aktiv, To-Do dokumentiert |
| 🔵 **TRANSFORMATION** | Substanz wird zu etwas anderem (z.B. Library → Veredler) | Code aktiv, im Wandel |
| ❄️ **EINGEFROREN** | Code im Repo, aber Feature-Flag-deaktiviert für MVP | Code aktiv, Flag false |
| ⚫ **ABGELÖST** | Feature wurde durch Nachfolger ersetzt | Code teilweise inaktiv |
| 🔴 **AUS** | Wird entfernt (oder bereits entfernt) | Code zu entfernen |

Pro Feature dokumentiert:
- **Status-Marker** (siehe oben)
- **Standort** (technische Verortung)
- **Begründung** (warum dieser Status?)
- **Bei EINGEFROREN: Wieder-Anschalten-Bedingung** (aus Anhang C der Tag-4-Synthese)
- **Sprint-Bezug** (wann wird das angefasst?)

---

## Wie pflegen wir diese Datei?

- Bei Code-Änderungen am Feature: hier den Eintrag prüfen, ggf. anpassen
- Bei Feature-Flag-Wechsel: Status-Marker aktualisieren
- Bei strategischer Entscheidung (z.B. EINGEFROREN → LIVE): ADR schreiben + hier ändern
- Quartalsweise Drift-Checkliste aus Anhang C laufen lassen

---

# Kern-Features (Roadmap MVP)

Die drei Roadmap-Kern-Features + ihre engen Begleiter.

## Audit Engine

**Status:** 🟢 LIVE
**Standort:** `src/lib/audit/*` (45 Dateien, 9.200 Zeilen)
**Begründung:** Roadmap-MVP-Feature 1 ("Instant Audit mit Score"). 25+ Agenten, 195 Regeln (laut Roadmap, real 183 nach BP3-Klassifizierung).
**Sprint-Bezug:** Sprint 1 (UI-Tier-Umbau), Sprint 2 (Prompt-Qualität A19)

## Score-Tracking

**Status:** 🟢 LIVE
**Standort:** `audit_runs`, `audit_category_scores` Tabellen + Trend-Anzeige
**Begründung:** Roadmap-MVP-Feature 3. Substanz steht.
**Sprint-Bezug:** Sprint 1 ("Noch X% bis Stable"-Messaging A6, Score-Vergleich vor/nach A9), Sprint 2 (prominentere Visualisierung A5)

## Fix-Prompt Export

**Status:** 🟡 POLISH
**Standort:** `src/lib/audit/prompt-export/*` (template-engine, repo-context, types, index)
**Begründung:** Roadmap-MVP-Feature 2. Existiert, aber generische "Was zu tun ist"-Templates sind ein Qualitätsproblem (Screenshot-Befund, A19).
**Sprint-Bezug:** Sprint 1 (Bulk-Download A1, einzelne Findings A3 — beides existiert), Sprint 2 (A19 Top-30 Rules überarbeiten)

## Repo Map Generator

**Status:** 🟢 LIVE
**Standort:** `src/lib/repo-map/*` (12 Dateien, 1.213 Zeilen)
**Begründung:** Substanz für Audit-Kontext + Veredler-Vorform. Roadmap-Erwähnung.
**Sprint-Bezug:** Bleibt unverändert, Veredler-Anbindung in Sprint 4

## `.cursorrules` / CLAUDE.md Export

**Status:** 🟢 LIVE
**Standort:** `src/lib/audit/export-rules.ts`
**Begründung:** Roadmap-Erwähnung als gebaut. 26 Build-Time-Regeln, profil-aware.
**Sprint-Bezug:** Bleibt unverändert

## File System API Scan

**Status:** 🟢 LIVE
**Standort:** `src/lib/file-access/*` (5 Dateien)
**Begründung:** Roadmap-Erwähnung. Chromium-only — Browser-Limitation.
**Sprint-Bezug:** Sprint 5 (GitHub-Repo-Connect als Browser-unabhängige Alternative)

## Stack-Detection (Auto-Detect)

**Status:** 🟢 LIVE
**Standort:** `src/lib/file-access/stack-detector.ts`
**Begründung:** Audit-Voraussetzung — welche Agenten gelten für dieses Projekt?
**Sprint-Bezug:** Bleibt unverändert

## Aufgabenliste (Findings → Tasks)

**Status:** ⚫ ABGELÖST → Cluster-Findings
**Standort:** `audit_tasks`-Tabelle + `audit_tasks_dismissed`-Spalte + `/tasks`-Route
**Begründung:** Durch Cluster-Ansicht in Findings-Liste abgelöst. Doppelte Datenhaltung wurde überflüssig.
**Sprint-Bezug:** Sprint 1 — Schreibrechte entzogen, Route entfernt; Sprint 4 — Tabelle DROP (siehe Anhang B + Anhang C K2.5)
**Wichtig:** Findings tragen Status selbst (`not_relevant_reason`-Spalte in `audit_findings`)

## Strategie-Empfehlungen (Cluster-Ansicht)

**Status:** 🟢 LIVE
**Standort:** `src/lib/audit/group-findings.ts` (149 Zeilen) + `src/lib/audit/quick-wins.ts` (141 Zeilen)
**Begründung:** Ersetzt die Aufgabenliste. Cluster-Headlines wie "Dateien zu lang — systematisch aufteilen".
**Sprint-Bezug:** Sprint 1 — Quick Wins ausklappbar (A18)

## Risk Assessment für Fixes

**Status:** ❄️ EINGEFROREN (Teil von Fix-Engine)
**Standort:** `src/lib/fix-engine/risk-assessor.ts`
**Begründung:** Hängt an Fix-Engine. Code bleibt, aber nicht aufrufbar.
**Sprint-Bezug:** Sprint 4-Entscheidung steht aus
**Wieder-Anschalten:** Mit Veredler-Transformation oder bei Premium-Tier-Definition

---

# Audit-Erweiterte Features (Sprint 1+)

## Cockpit-Dashboard

**Status:** 🟡 POLISH (Umbau zu Projektboard in Sprint 1)
**Standort:** `dashboard_widgets`-Tabelle + 13 Widgets in `src/lib/cockpit/`
**Begründung:** Roadmap nennt "Cockpit → Projektboard" als Sprint-1-Aufgabe. Substanz bleibt.
**Sprint-Bezug:** Sprint 1 (Navigation-Umbau, Schichten-Filter, Phase-Achse)

## Beta-Waitlist + Feedback

**Status:** 🟢 LIVE
**Standort:** `beta_waitlist`-Tabelle + `beta_feedback`-Tabelle
**Begründung:** Lead-Magnet-Funktion, klein aber aktiv.
**Sprint-Bezug:** Bleibt unverändert

---

# Chat & Toro (Roadmap-Kern, im Umbau)

## Chat (Toro-Konversationen)

**Status:** 🟡 POLISH (God-File-Refactoring nötig)
**Standort:** `messages`, `conversations` Tabellen + `supabase/functions/ai-chat/index.ts` (924 Zeilen)
**Begründung:** Kern-Feature, aber `ai-chat/index.ts` ist God-File. Aufspaltung vor Veredler-Integration.
**Sprint-Bezug:** Sprint 4 (Aufspaltung als Vorlauf zu Veredler)

## Guided Workflows

**Status:** 🔵 TRANSFORMATION
**Standort:** `src/lib/guided-workflow-engine.ts` (250 Zeilen) + DB-Tabellen
**Begründung:** Konzept passt direkt zum Veredler (ADR-021). Wird als Veredler-Bestandteil weiterentwickelt.
**Sprint-Bezug:** Sprint 4 (Veredler-Integration)

## Bookmarks (Merker-Vorform)

**Status:** 🟡 POLISH (Ausbau zur vollständigen Merker-Schicht)
**Standort:** `bookmarks`-Tabelle
**Begründung:** ADR-020 nennt Merker als Schicht 4. Aktuelle Bookmarks sind Vorform. Session-Reaktivierung fehlt.
**Sprint-Bezug:** Sprint 3+ (Merker-Schicht ausbauen)

## Artefakte (React/HTML/PPTX/ECharts)

**Status:** 🟢 LIVE
**Standort:** `artifacts`-Tabelle + iframe-Renderer + 4 Artefakt-Typen
**Begründung:** Solide gebaut, kein Umbau geplant.
**Sprint-Bezug:** Bleibt unverändert

## Workspace-Briefing als Konzept

**Status:** 🔵 TRANSFORMATION
**Standort:** `src/lib/workspace/briefing.ts` (70 Zeilen) + `briefing-prompts.ts`
**Begründung:** Substanz wird in Sprint 4 für Phase-0-Onboarding (Projekt-Briefing-Generierung) wiederverwendet.
**Sprint-Bezug:** Sprint 4

---

# Library-System (TRANSFORMATION zur Veredler-Vorform)

> **Hinweis:** Schemas und Resolver-Code bleiben aktiv und werden in Sprint 4 zum Veredler. UI-Verwaltung wird Feature-Flag-deaktiviert.

## Capabilities (Modell-Routing)

**Status:** 🔵 TRANSFORMATION
**Standort:** `src/lib/capability-resolver.ts` (196 Zeilen) + DB-Tabelle `capabilities`
**Begründung:** Wird zur Veredler-Tiefen-Logik (Tiefe 1=Haiku, Tiefe 3=Opus).
**Sprint-Bezug:** Sprint 4

## Outcomes (Output-Templates)

**Status:** 🔵 TRANSFORMATION
**Standort:** DB-Tabelle `outcomes` + `library-resolver.ts`
**Begründung:** Wird zu den 4 Veredler-Output-Feldern (Aufgabe/Ziel-Artefakt/Ablage-Vorgaben/Konsequenzen).
**Sprint-Bezug:** Sprint 4

## Roles (Toro-Fachexpertise)

**Status:** ❄️ EINGEFROREN (Schema bleibt)
**Standort:** `roles`-Tabelle + Library-Resolver
**Begründung:** UI-Verwaltung ist KMU-Feature. Schema bleibt für mögliche Wiederverwendung in Phase-0-Onboarding.
**Sprint-Bezug:** Sprint 4 (UI-Flag deaktiviert)
**Wieder-Anschalten:** Wenn Phase-0-Onboarding User-Rollen-Auswahl braucht oder KMU-Markt aktiviert

## Skills (Schritt-für-Schritt)

**Status:** ❄️ EINGEFROREN (Schema bleibt)
**Standort:** `skills`-Tabelle + `agent_skills` + `src/lib/skill-resolver.ts` (165 Zeilen)
**Begründung:** Wie Roles.
**Sprint-Bezug:** Sprint 4 (UI-Flag deaktiviert)
**Wieder-Anschalten:** Wenn Phase-0-Onboarding Skill-Empfehlungen braucht oder KMU-Markt aktiviert

## Library-Resolver (Code)

**Status:** 🔵 TRANSFORMATION
**Standort:** `src/lib/library-resolver.ts` (267 Zeilen)
**Begründung:** Kern der Veredler-Anreicherung. Code bleibt aktiv und wird erweitert.
**Sprint-Bezug:** Sprint 4

## Library-Versions

**Status:** ❄️ EINGEFROREN
**Standort:** `library_versions`-Tabelle
**Begründung:** Versionierung ist Phase-2-Feature für KMU-Library-Verwaltung.
**Wieder-Anschalten:** Wenn Library-UI als KMU-Verwaltungs-Interface gebaut wird

## Community-Scope (`scope='public'`)

**Status:** ❄️ EINGEFROREN (permanent für Year 1)
**Standort:** `scope='public'`-Markierung in mehreren Library-Tabellen
**Begründung:** Roadmap: "Discord reicht". Technische Möglichkeit bleibt.
**Wieder-Anschalten:** Phase 3 (Year 2 Netzwerkeffekte)

---

# KMU-Plattform-Features (EINGEFROREN für Phase 2)

> Diese Features sind im Code real und bleiben erhalten. UI-Pfade werden Feature-Flag-deaktiviert. Die KMU-Substanz bleibt für eine mögliche Phase-2-Aktivierung verfügbar (siehe `docs/phase-2-vision.md`).

## Workspaces (Department-Container)

**Status:** ❄️ EINGEFROREN
**Standort:** `workspaces`-Tabelle + 5 Sub-Tabellen + UI in `/workspaces/*`
**Begründung:** Roadmap: "Team-Features in Year 1" gestrichen. Code ist solide.
**Sprint-Bezug:** Sprint 4 (`NEXT_PUBLIC_WORKSPACES_ENABLED=false`)
**Wieder-Anschalten:** Erster KMU-Kunde mit Multi-User-Anforderungen ODER Solo-Markt-Validierung positiv

## Workspace-Members + Rollen

**Status:** ❄️ EINGEFROREN
**Standort:** `workspace_members`-Tabelle + Rollen-Logik
**Begründung:** Folgt Workspaces.
**Wieder-Anschalten:** Wie Workspaces

## Cards + Card History

**Status:** ❄️ EINGEFROREN
**Standort:** `cards`-Tabelle + `card_history`-APPEND-ONLY-Tabelle
**Begründung:** DUP zu `project_memory`. Im Solo-MVP redundant.
**Sprint-Bezug:** Sprint 3 (PW-Cluster-Migration)
**Wieder-Anschalten:** Wenn Karten-Board-Visualisierung als KMU-Phase-2-Feature relevant wird

## Custom Agents (Trigger-basiert)

**Status:** ❄️ EINGEFROREN
**Standort:** `agents`-Tabelle + Agent-Engine + `src/lib/agent-engine.ts` (394 Zeilen)
**Begründung:** Memory-Empfehlung war AUS, aber ~735 Zeilen Substanz. Vorsichtige Stilllegung statt Löschung.
**Sprint-Bezug:** Sprint 4 (`NEXT_PUBLIC_CUSTOM_AGENTS_ENABLED=false`)
**Wieder-Anschalten:** L2-Gespräche zeigen >30% Power-User-Anfrage ODER Agency-Tier braucht Multi-Projekt-Automatisierung

## Agent-Webhooks (HMAC)

**Status:** ❄️ EINGEFROREN
**Standort:** `/api/agents/webhook/[id]` + HMAC-Signaturen
**Begründung:** Folgt Custom Agents.
**Wieder-Anschalten:** Wie Custom Agents

## Cron-Agenten (täglich 7 Uhr)

**Status:** ❄️ EINGEFROREN
**Standort:** `vercel.json` Cron + `/api/cron/agents`
**Begründung:** Folgt Custom Agents.
**Sprint-Bezug:** Sprint 4 — Cron-Eintrag in `vercel.json` auskommentieren
**Wieder-Anschalten:** Wie Custom Agents

## Marketing-Paket (5 Agenten)

**Status:** 🔴 AUS
**Standort:** DB-Seeds für 5 Marketing-Agenten in `agents`-Tabelle
**Begründung:** KMU-Marketing-Use-Case ist nicht Solo-Vibe-Coder. Roadmap-Kill-Liste.
**Sprint-Bezug:** Sprint 4 (`DELETE FROM agents WHERE scope = 'package' AND package_id = 'marketing'`)

## Transformations-Engine

**Status:** ❄️ EINGEFROREN
**Standort:** `transformations`-Tabelle + Engine
**Begründung:** KMU-Use-Case-spezifisch.
**Wieder-Anschalten:** Wenn KMU-Workspaces wieder aktiv werden

---

# Power-User-Features (Premium-Kandidaten, EINGEFROREN)

## Multi-Modell-Reviews (4+1 Judge)

**Status:** ❄️ EINGEFROREN als Premium-Kandidat
**Standort:** `src/lib/review/*` (7 Dateien, 407 Zeilen)
**Begründung:** Substanz wertvoll, aber Kosten-Risiko im MVP zu groß.
**Sprint-Bezug:** Sprint 4 (`NEXT_PUBLIC_MULTI_MODEL_REVIEW_ENABLED=false`)
**Wieder-Anschalten:** Pricing-Strategie definiert + Kostenmodell pro Review klar (Sprint-4-Entscheidung)

## Perspectives (Parallele KI-Antworten)

**Status:** ❄️ EINGEFROREN
**Standort:** `perspective_avatars`-Tabelle + UI in PerspectivesStrip + BottomSheet
**Begründung:** Komplexität für Solo-MVP zu groß. Substanz gut.
**Wieder-Anschalten:** L2-Gespräche zeigen >20% Power-User-Anfrage ODER Premium-Tier-Differenzierung braucht das

## Parallel-Tabs im Chat

**Status:** ❄️ EINGEFROREN
**Standort:** `useParallelTabs.ts` (168 Zeilen)
**Begründung:** Power-User-Feature. Nicht in Roadmap-Drei-Features.
**Wieder-Anschalten:** L2-Gespräche zeigen Bedarf

---

# AUS dem Produkt

## Fix-Engine (autonom Fixen)

**Status:** 🔴 AUS (deaktiviert seit BP4 Tag 4.5)
**Standort:** `src/lib/fix-engine/*` (8 Dateien, 1.345 Zeilen)
**Begründung:** Memory: hat real File-Damage angerichtet. ADR-021 ersetzt Konzept durch "Advisor not Mechanic" Veredler.
**Sprint-Bezug:** Tag 4.5 (deaktiviert via `NEXT_PUBLIC_FIX_ENGINE_ENABLED=false`), Sprint 4 (transformieren oder entfernen)
**Aktueller Status:** Code bleibt, 4 API-Routes geben 410 Gone, UI-Buttons deaktiviert

## i18n-Erweiterung (über DE+EN hinaus)

**Status:** ❄️ EINGEFROREN (permanent für Year 1)
**Standort:** next-intl Konfiguration
**Begründung:** Roadmap: "i18n vor EU-Tiefe" gestrichen. DE+EN reicht für DACH-Markt.
**Wieder-Anschalten:** Internationaler Markt-Eintritt geplant (Phase 3+)

---

# NEU BAUEN — gehört nicht in Bestand-Doku

Diese Features existieren noch nicht. Siehe `docs/synthese/anhang-a-roadmap.md` für die Sprint-Liste:

- Phase-0-Onboarding (KI-Interview) — Sprint 4
- Projekt-Briefing-Generierung — Sprint 4
- Open-Source-Alternativen-Check — Sprint 4
- Library-Empfehlungen pro Feature — Sprint 4
- Tech-Stack-Empfehlung — Sprint 4
- Datenbankschema-Vorschlag — Sprint 4
- Projekt-Template-Generator ("Tropen OS Certified Starter") — Sprint 3
- Pre-Launch Audit (Schwellenwerte) — Sprint 3+
- Go-Live-Checkliste — Sprint 3+
- Post-Launch Monitoring — Phase 2
- Prompt-Veredler — Sprint 4
- Inbox-UI — Sprint 3
- Quick-Capture-Field — Sprint 3
- GitHub-Repo-Connect — Sprint 5
- Tool-Empfehlungen-Sektion — Sprint 1
- VS Code Extension — Sprint 5
- MCP-Server für Cursor — Sprint 5
- Vercel Deploy-Hook — Phase 2

Sobald gebaut, wandern sie in die entsprechenden Sektionen oben.

---

# Drift-Checkliste (alle 3 Monate prüfen)

- [ ] Sind alle 🔴 AUS-Features tatsächlich entfernt?
- [ ] Gibt es Code-Pfade, die auf ❄️ EINGEFROREN-Features zugreifen wollen?
- [ ] Haben sich Wieder-Anschalten-Bedingungen erfüllt?
- [ ] Sind 🔵 TRANSFORMATION-Features bei der Transformation oder noch im Limbo?
- [ ] Gibt es neue NEU-BAUEN-Features, die hier dokumentiert werden sollten?

Bei Fund: ADR schreiben, hier aktualisieren, in `docs/architect-log.md` notieren.
