# Anhang C — Kill- und Einfrier-Liste
## Tropen OS — Was rausfliegt und was eingefroren wird

> **Zugehörig zu:** Tag 4 Master-Synthese
> **Quellen:** Roadmap-Q2 (Kill-the-Darlings) + Tag 3 (Empfehlungen) + ADR-020 (Solo-Fokus)
> **Charakter:** Zukunfts-Vertrag — wird in 3-12 Monaten gelesen

---

## Zweck

Dieser Anhang fixiert schriftlich, was aus dem Produkt entfernt oder eingefroren wird. Jeder Eintrag hat eine **Begründung** und — bei eingefrorenen Features — eine **Wieder-Anschalten-Bedingung**, sodass in 3-6 Monaten klar ist, ob es Zeit für Phase 2 ist.

Das Dokument ist **bewusst defensiv geschrieben**. Es ist leicht, im Sprint-Fieber Features wegzuwerfen, die später schmerzhaft fehlen. Dieser Anhang macht Schwere-Kalibrierung explizit.

---

## Teil 1 — Kill-Liste (AUS DEM PRODUKT)

Diese Features werden entfernt — Code, DB-Tabellen, UI-Pfade.

### K1 — Fix-Engine (autonom Fixen)

**Was:** `src/lib/fix-engine/*` (8 Dateien, 1.345 Zeilen)
**Warum AUS:**
- Memory: Hat real File-Damage angerichtet
- ADR-021 ersetzt das Konzept durch "Advisor not Mechanic" Veredler
- Strategisches Risiko überwiegt Nutzen
**Datum:** Sprint 0 (deaktivieren), Sprint 4 (entfernen oder transformieren)
**Migration:** Feature-Flag in Sprint 0, dann Code-Entfernung in Sprint 4
**Was bleibt:** `audit_findings.fix_hint` (Spalte) — als Hinweis-Text, nicht als ausführbarer Patch

### K2 — Multi-Modell-Reviews (4+1 Judge) als MVP-Feature

**Was:** `src/lib/review/*` (7 Dateien, 407 Zeilen) als Standard-Audit
**Warum nicht ganz AUS, aber nicht im MVP:**
- Roadmap erwähnt es nicht in den drei MVP-Features
- Kosten pro Review unklar — operatives Risiko
- **Aber:** Substanz ist wertvoll, könnte Premium-Phase-3-Feature werden
**Status:** **EINGEFROREN als Premium-Kandidat** (siehe E11 unten — verschiebt sich also auf Einfrier-Liste)

### K3 — Marketing-Paket (5 Agenten)

**Was:** DB-Seeds für 5 Marketing-Agenten in `agents`-Tabelle
**Warum AUS:**
- KMU-Marketing-Use-Case ist nicht Solo-Vibe-Coder
- Roadmap kill-list explizit: "Custom Agenten Self-Service: ESLint-Import reicht"
**Datum:** Sprint 4
**Migration:** DELETE FROM agents WHERE scope = 'package' AND package_id = 'marketing'

### K4 — Cockpit-Widget "Marketing Performance"

**Was:** `dashboard_widgets`-Eintrag, falls vorhanden
**Warum AUS:**
- Hängt an K3 (Marketing-Paket)
- Solo-Vibe-Coder hat keine Marketing-Performance zu tracken
**Datum:** Sprint 1 (Cockpit→Projektboard-Umbau)

### K5 — i18n-Substanz vor EU-Tiefe (laut Roadmap-Kill-Liste)

**Status:** Ist bereits implementiert (gemäß ADR-017), Roadmap-Kill-Liste sagt aber "i18n vor EU-Tiefe — gestrichen"
**Klärung:** Die Roadmap-Aussage bedeutet *Priorität*, nicht *Code-Entfernung*. i18n bleibt als Feature, aber wird **nicht weiter ausgebaut**, bis EU-Tiefe (DSGVO, BFSG, AI Act) auf Production-Grade ist.
**Datum:** Keine Aktion, nur Priorisierung
**Wichtig:** Diesen Eintrag explizit halten, sonst entsteht Verwirrung

### K6 — "Eigener Code-Editor" / "Echtzeit-Linting" / "Code-Generierung"

**Was:** Diese Features sind **nicht gebaut**, stehen aber als Verlockung im Hinterkopf
**Warum AUS:**
- Roadmap: "Cursors Job"
- Wäre Verwässerung der Positionierung
**Datum:** Permanent — wenn jemand vorschlägt, dieses Feature zu bauen, dieser Anhang ist die Antwort

### K7 — "Compliance-Zertifikate" / "SSO/Enterprise in Year 1"

**Status:** Nicht gebaut
**Warum AUS:**
- Rechtliches Risiko (Zertifikate)
- Year-1-Kapazität sprengt (Enterprise)
**Datum:** Permanent (für Year 1)
**Wieder relevant:** Bei erstem Enterprise-Kunden organisch

### K8 — "Große Community-Plattform"

**Status:** Nicht gebaut, aber `scope='public'` in Library-Tabellen vorbereitet
**Warum AUS:**
- Roadmap: "Discord reicht"
- Community-Plattform-Aufbau bindet Ressourcen die in Produkt-Verbesserung besser investiert sind
**Datum:** Permanent (für Year 1)
**Wichtig:** `scope='public'` bleibt als technische Möglichkeit, aber UI-Werkzeuge werden nicht gebaut

### K9 — "Gamification (Badges, etc.)"

**Status:** Nicht gebaut
**Warum AUS:**
- Roadmap: "Score-Anstieg reicht"
- Score selbst ist die Gamification
**Datum:** Permanent

### K10 — "PR-basierter Review"

**Status:** Nicht gebaut
**Warum AUS:**
- CodeRabbit hat das besser
- Wir sind Journey, nicht Commit-Review
**Datum:** Permanent

### K11 — "Dependency-CVE-Datenbank"

**Status:** Nicht gebaut, nur Empfehlungs-Pattern in Tool-Empfehlungen
**Warum AUS:**
- Snyk hat das besser, Aikido auch
- Snyk-Integration via Empfehlung ist die richtige Antwort
**Datum:** Permanent

### K12 — "Performance-Profiling"

**Status:** Lighthouse-Integration vorhanden
**Warum AUS:**
- Lighthouse selbst reicht
- Performance-Profiling über Lighthouse hinaus ist Scope-Creep
**Datum:** Permanent

### K13 — "Test-Schreiben (KI generiert Tests)"

**Status:** Nicht gebaut
**Warum AUS:**
- Qodo (CodiumAI) hat das besser
- Spezialisierter Markt
**Datum:** Permanent

---

## Teil 2 — Einfrier-Liste (PHASE 2)

Diese Features bleiben im Code, werden via Feature-Flag deaktiviert, werden nicht weiterentwickelt — aber bleiben verfügbar für Phase 2.

### E1 — Workspaces (Department-Container)

**Was:** `workspaces`-Tabelle + 5 Sub-Tabellen + UI in `/workspaces/*`
**Warum EINFRIEREN:**
- Roadmap: "Team-Features in Year 1" gestrichen
- Code ist solide, Wegwerfen wäre Verschwendung
- Phase 2: Wenn KMU-Markt relevant wird, ist das die Basis
**Wieder-Anschalten-Bedingung:**
- Erster KMU-Kunde mit klaren Multi-User-Anforderungen, ODER
- Solo-Gründer-Markt-Validierung positiv (Sprint 5+) und Skalierung zur Agency-Tier-Stufe geht
**Datum:** Sprint 4
**Code-Standort:** Bleibt im Repo, Feature-Flag `NEXT_PUBLIC_WORKSPACES_ENABLED=false`

### E2 — Workspace-Members + Rollen

**Was:** `workspace_members`-Tabelle + Rollen-Logik
**Warum EINFRIEREN:**
- Folgt E1 (Workspaces)
**Wieder-Anschalten-Bedingung:** Wie E1
**Datum:** Sprint 4

### E3 — Cards + Card History

**Was:** `cards`-Tabelle + `card_history`-APPEND-ONLY-Tabelle
**Warum EINFRIEREN:**
- DUP zu `project_memory` (siehe M3 PW-Cluster)
- Im Solo-MVP redundant
**Wieder-Anschalten-Bedingung:** Wenn Karten-Board-Visualisierung als KMU-Phase-2-Feature relevant wird
**Datum:** Sprint 3 (PW-Cluster-Migration)
**Wichtig:** APPEND-ONLY-Daten bleiben liegen, nur keine neuen mehr

### E4 — Custom Agents (Trigger-basiert)

**Was:** `agents`-Tabelle + Agent-Engine + Cron-Trigger + Webhook
**Warum EINFRIEREN (statt AUS in K-Liste):**
- Memory-Empfehlung: AUS, aber Code ist da
- Strategische Vorsicht: Solo-Power-User könnte Custom Agents wollen
- Substanz ~735 Zeilen (agent-engine + agent-catalog)
**Wieder-Anschalten-Bedingung:**
- L2-Gespräche zeigen >30% Power-User-Anfrage nach Custom Agents, ODER
- Phase 2: Agency-Tier braucht Multi-Projekt-Automatisierung
**Datum:** Sprint 4
**Code-Standort:** Bleibt, Feature-Flag `NEXT_PUBLIC_CUSTOM_AGENTS_ENABLED=false`
**Hinweis:** Hier weicht die Empfehlung von der Roadmap-Kill-Liste ab. Begründung: Memory ist klar, aber das Wegwerfen von ~735 Zeilen ohne Phase-2-Sicherung ist riskant. Lieber stilllegen, dann in 6 Monaten entscheiden.

### E5 — Agent-Webhooks (HMAC)

**Was:** `/api/agents/webhook/[id]` + HMAC-Signaturen
**Warum EINFRIEREN:**
- Folgt E4
**Wieder-Anschalten-Bedingung:** Wie E4
**Datum:** Sprint 4

### E6 — Cron-Agenten (täglich 7 Uhr)

**Was:** `vercel.json` Cron + `/api/cron/agents`
**Warum EINFRIEREN:**
- Folgt E4
**Wieder-Anschalten-Bedingung:** Wie E4
**Datum:** Sprint 4
**Wichtig:** Cron-Eintrag in `vercel.json` zumindest auskommentieren, damit kein leerer Cron-Run erfolgt

### E7 — Library-Versions (Versionierung)

**Was:** `library_versions`-Tabelle
**Warum EINFRIEREN:**
- Hängt an Library-Substanz (siehe E10 Library)
- Versionierung ist Phase-2-Feature für KMU-Library-Verwaltung
**Wieder-Anschalten-Bedingung:** Wenn Library-UI als KMU-Verwaltungs-Interface gebaut wird
**Datum:** Sprint 4

### E8 — Community-Scope (`scope='public'`)

**Was:** `scope='public'` in Library-Tabellen + opt-in-Mechanismus
**Warum EINFRIEREN:**
- Roadmap: "Große Community-Plattform" als "Discord reicht" markiert
- Aber: technische Möglichkeit bleibt
**Wieder-Anschalten-Bedingung:** Phase 3 (Year 2 Netzwerkeffekte)
**Datum:** Permanent eingefroren

### E9 — Transformations-Engine

**Was:** `transformations`-Tabelle + Engine
**Warum EINFRIEREN:**
- KMU-Use-Case-spezifisch
- Nicht im Roadmap-Plan
**Wieder-Anschalten-Bedingung:** Wenn KMU-Workspaces wieder aktiv werden (folgt E1)
**Datum:** Sprint 4

### E10 — Roles + Skills (Library-Substanz)

**Was:** `roles`, `skills`, `agent_skills`, `card.role_id`, `card.skill_id`
**Warum EINFRIEREN als Schema:**
- M2-Erkenntnis: Wegwerfen wäre teuer, Veredler braucht Resolver-Code
- UI-Verwaltung wird nicht weiter gebaut
- Schema bleibt als Veredler-Vorform
**Wieder-Anschalten-Bedingung (für UI):**
- KMU-Phase 2: Org-Admin verwaltet Rollen/Skills
**Datum:** Sprint 4
**Code-Standort:** Resolver-Code wird in Sprint 4 in den Veredler integriert (TRANSFORMATION). UI-Routes `/library/*` werden Feature-Flag-deaktiviert.

### E11 — Multi-Modell-Reviews (4+1 Judge) als Premium-Kandidat

**Was:** `src/lib/review/*` (7 Dateien, 407 Zeilen)
**Warum EINFRIEREN (statt AUS):**
- Substanz ist wertvoll
- Could be Premium-Tier-Feature in Phase 3
- Aber Kosten-Risiko im MVP zu groß
**Wieder-Anschalten-Bedingung:**
- Pricing-Strategie definiert (€199 Agency-Tier oder höher)
- Kostenmodell pro Multi-Modell-Review klar (geschätzt: €0,50 - €2 pro Review)
**Datum:** Sprint 4
**Code-Standort:** Bleibt, Feature-Flag `NEXT_PUBLIC_MULTI_MODEL_REVIEW_ENABLED=false`

### E12 — Perspectives (Parallele KI-Antworten)

**Was:** `perspective_avatars`, UI in PerspectivesStrip + BottomSheet
**Warum EINFRIEREN:**
- Roadmap erwähnt nicht, nicht in MVP-Drei-Features
- Komplexität für Solo-MVP zu groß
- Substanz ist gut, könnte Premium-Feature werden
**Wieder-Anschalten-Bedingung:**
- L2-Gespräche zeigen >20% Power-User-Anfrage, ODER
- Premium-Tier-Differenzierung braucht zusätzliche Features
**Datum:** Sprint 4

### E13 — Parallel-Tabs im Chat

**Was:** `useParallelTabs.ts` + Tab-Logik
**Warum EINFRIEREN:**
- Power-User-Feature
- Nicht in Roadmap-Drei-Features
**Wieder-Anschalten-Bedingung:**
- L2-Gespräche zeigen Bedarf
**Datum:** Sprint 4

### E14 — Workspace-Briefing als Konzept

**Was:** `workspace/briefing.ts` (70 Zeilen) + briefing-prompts.ts
**Warum EINFRIEREN:**
- Hängt an Workspaces (E1)
- ABER: Konzept ist wertvoll für Solo-Use-Case (Projekt-Übersicht)
**Wieder-Anschalten-Bedingung:**
- In Sprint 4: Substanz wird in Phase-0-Onboarding (Projekt-Briefing-Generierung) **transformiert**, nicht eingefroren
**Datum:** Sprint 4 — Transformation, nicht Einfrieren
**Hinweis:** Eigentlich UMBAU, nicht EINFRIEREN. In dieser Liste nur, weil verwandte Workspace-Features eingefroren werden.

### E15 — i18n-Erweiterung (Sprachen über Deutsch + Englisch hinaus)

**Was:** Erweiterung von next-intl auf weitere Sprachen
**Warum EINFRIEREN:**
- Roadmap: "i18n vor EU-Tiefe" gestrichen
- DE + EN reicht für DACH-Vibe-Coder-Markt
**Wieder-Anschalten-Bedingung:**
- Internationaler Markt-Eintritt geplant (Phase 3+)
**Datum:** Permanent eingefroren bis Phase 3

---

## Teil 3 — Wieder-Anschalten-Prozess

Wenn eine Wieder-Anschalten-Bedingung erfüllt scheint:

1. **ADR schreiben** — Warum jetzt? Was hat sich geändert?
2. **Aufwand schätzen** — Was kostet das Wieder-Hochfahren?
3. **Konsequenzen prüfen** — Welche anderen Features sind betroffen?
4. **Feature-Flag aktivieren** — Schrittweise, nicht alles auf einmal
5. **L2-Validierung** — Echte User testen das wieder-aktivierte Feature
6. **CLAUDE.md aktualisieren** — Status-Marker im `feature-bestand.md` ändern

**Niemals:** Feature ohne ADR und ohne L2-Validierung re-aktivieren. Wieder-Anschalten ist eine Architektur-Entscheidung, kein Feature-Flag-Flip.

---

## Teil 4 — Checks gegen Drift

Alle 3 Monate (oder bei größeren Strategie-Pivots) prüfen:

### Drift-Checkliste

- [ ] Sind alle Kill-Liste-Features tatsächlich entfernt?
- [ ] Gibt es Code-Pfade, die auf eingefrorene Features zugreifen wollen?
- [ ] Haben sich Wieder-Anschalten-Bedingungen erfüllt, die wir übersehen haben?
- [ ] Gibt es neue Kill-Kandidaten aus Sprints 4-5?
- [ ] Hat die Drei-Visionen-Aufteilung (Roadmap normativ, User-Story Marketing, Feature-Bestand technisch) gehalten?

### Bei Drift-Fund

1. ADR schreiben (was ist gedriftet?)
2. Anhang C aktualisieren
3. CLAUDE.md aktualisieren
4. Tag-4-Master-Synthese aktualisieren wenn Strategie betroffen

---

## Zusammenfassung — die Liste auf einen Blick

### AUS (entfernen)

| # | Feature | Sprint |
|---|---------|--------|
| K1 | Fix-Engine | 0 + 4 |
| K3 | Marketing-Paket (5 Agenten) | 4 |
| K4 | Cockpit-Widget Marketing Performance | 1 |
| K5-K13 | Strategische Klarstellungen, keine Code-Aktion | permanent |

### EINGEFROREN (Phase 2)

| # | Feature | Sprint |
|---|---------|--------|
| E1 | Workspaces | 4 |
| E2 | Workspace-Members | 4 |
| E3 | Cards + Card History | 3 |
| E4 | Custom Agents | 4 |
| E5 | Agent-Webhooks | 4 |
| E6 | Cron-Agenten | 4 |
| E7 | Library-Versions | 4 |
| E8 | Community-Scope | permanent |
| E9 | Transformations-Engine | 4 |
| E10 | Roles + Skills (UI) | 4 |
| E11 | Multi-Modell-Reviews | 4 |
| E12 | Perspectives | 4 |
| E13 | Parallel-Tabs | 4 |
| E15 | i18n-Erweiterung | permanent |

**Gesamt:** 13 Kills + 14 Einfrierungen = 27 strategische Entscheidungen, die Tag 4 fixiert.

---

## Der wichtigste Satz

> **Wenn jemand in 3 Monaten fragt, warum ein Feature fehlt: dieser Anhang ist die Antwort.**

Wer ein eingefrorenes Feature wieder aktivieren will: Wieder-Anschalten-Prozess durchlaufen. Wer ein gekilltes Feature wieder vorschlägt: dieser Anhang ist das Veto.
