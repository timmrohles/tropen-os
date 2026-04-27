# Anhang A — Roadmap
## Tropen OS — Sprint 1 bis Sprint 5

> **Zugehörig zu:** Tag 4 Master-Synthese
> **Quellen:** Roadmap-Q2/Q3 + Tag 3 (Produkt-Inventur) + M1 (Veredler-Substanz)
> **Charakter:** Nachschlagewerk, gezielt aufgeschlagen

---

## Sprint-Übersicht

| Sprint | Zeitrahmen | Fokus | Aufwand-Punkte | Kalender-Tage |
|--------|-----------|-------|----------------|---------------|
| **0** (Tag 4.5) | 2-3 Tage | Hygiene + Validierung | ~10 | 2-3 |
| **1** | Diese Woche | Navigation + Top-5-Findings | ~10 | 3-4 |
| **2** | Nächste 2 Wochen | Landing + Content | ~8 | 5-7 |
| **3** | Nächster Monat | Inbox-UI + Templates + Pricing | ~25 | 10-14 |
| **4** | Sprint 3+ | Veredler + Onboarding | ~35 | 14-20 |
| **5** | Q3 2026 | Distribution (GitHub, MCP, VS Code) | ~30 | 12-18 |
| **Gesamt** | Q2-Q3 2026 | | **~118** | **~46-66 Tage** |

**Anmerkung zur Aufwand-Schätzung:** S=1, M=3, L=8 Aufwand-Punkte. Bei pragmatischen 5 Punkten/Tag (mit Tests, Reviews, Iteration). Sprint 1-3 sind enger getaktet, Sprint 4-5 brauchen mehr Pufferzeit weil Veredler und Distribution mehr Validierungs-Schleifen erfordern.

---

## Sprint 0 (Tag 4.5) — Hygiene und Validierung

**Ziel:** Vor Sprint 1 die Drei-Visionen-Spannung auflösen, Phase-2-Backup anlegen, Validierungs-Lücken schließen.

### Aufgaben

| Aufgabe | Aufwand | Wer |
|---------|---------|-----|
| CLAUDE.md aktualisieren — Drei-Rollen-Aufteilung, Library-Status TRANSFORMATION | M (3) | Timm + Claude |
| ARCHITECT.md aktualisieren — ADR-020/021/022/023 als Pflicht-Lektüre | S (1) | Claude |
| `docs/phase-2-vision.md` erstellen | M (3) | Claude (aus Architektur-Trilogie) |
| `feature-bestand.md` (umbenannt) mit Status-Markern | S (1) | Claude |
| `docs/_archive/2026-04-pre-pivot/` mit Index | S (1) | Claude |
| Fix-Engine mit Feature-Flag deaktivieren | S (1) | Claude Code |
| L1: SQL-Queries auf `usage_logs` für Nutzungsdaten | S (1) | Timm |
| L2: Outreach für drei Vibe-Coder-Gespräche | (parallel laufend) | Timm |

**Aufwand:** ~10 Punkte = ~2 Tage

**Deliverables:**
- Aktualisierte CLAUDE.md, ARCHITECT.md
- Neue Dokumente: `phase-2-vision.md`, `feature-bestand.md`, Archiv-Index
- Fix-Engine deaktiviert (Feature-Flag in `.env`)
- L1-Erkenntnisse in Tag-3-Aktualisierung integriert
- L2-Gespräche terminiert

---

## Sprint 1 — Navigation + Top-5-Findings

**Ziel:** Den Roadmap-Pivot sichtbar machen. Cockpit wird zum Projektboard, Top-5-Findings statt 314, Tool-Empfehlungen-Sektion.

### Aufgaben

| Aufgabe | Aufwand | Verweis |
|---------|---------|---------|
| Navigation umbauen — Cockpit → Projektboard | M (3) | ADR-020 Schicht 6 |
| Schichten-Filter in Projektboard | M (3) | ADR-020 |
| Top-5-Findings als Default-Ansicht (statt 314) | S (1) | Roadmap |
| Tool-Empfehlungen-Sektion ("Für Dependencies: Snyk") | S (1) | Roadmap |
| Phase-Achse im Projektboard (Konzept/Architektur/Bauen) | M (3) | ADR-020 + User-Story |

**Aufwand:** ~10 Punkte = ~3-4 Tage

**Deliverables:**
- Sichtbar pivoted Navigation
- Top-5-Findings als Default
- Tool-Empfehlungen sichtbar im Dashboard
- Projektboard mit Schichten-Filter und Phase-Achse

**Prüfsteine vor Sprint 2:**
- L1-Erkenntnisse bestätigen Sprint-1-Priorisierung?
- L2-Gespräche zeigen Resonanz auf Top-5-Konzept?

---

## Sprint 2 — Landing + Content

**Ziel:** Die Außensicht etablieren. Lovable-spezifische Landing, Template-Scans als Content, BFSG-Artikel als SEO-Hebel.

### Aufgaben

| Aufgabe | Aufwand | Verweis |
|---------|---------|---------|
| "Scan your Lovable App" Landing Page | M (3) | Roadmap |
| ROI-Argument im Hero ("€39 vs. €20.000 Bußgeld") | S (1) | Roadmap |
| Bestehende Templates scannen (ShipFast, create-t3-app, Taxonomy, Supastarter) | S (1) | Roadmap |
| Score-Veröffentlichung als Content | S (1) | Roadmap |
| BFSG-für-Entwickler — SEO-Artikel | S (1) | Roadmap, Content |
| Bußgeld-Cases recherchieren (3 Stories) | S (1) | Roadmap, Content |

**Aufwand:** ~8 Punkte = ~5-7 Tage

**Deliverables:**
- Lovable-spezifische Landing-Page
- 4 Template-Scan-Ergebnisse als Blog/Reddit-Posts
- BFSG-Artikel (~2.000 Wörter)
- 3 Bußgeld-Case-Studies als Onboarding-Content

**Prüfsteine vor Sprint 3:**
- L2-Gespräche abgeschlossen, Erkenntnisse dokumentiert
- Pricing-Validation aus L3 vorhanden
- Content-Reaktion: gibt es organischen Traffic auf BFSG-Artikel?

---

## Sprint 3 — Inbox-UI + Templates + Pricing

**Ziel:** Plattform-Kern komplettieren. Inbox-Schicht (ADR-020) wird sichtbar, Projekt-Template-Generator als Lead-Magnet, Pricing operationalisiert.

### Aufgaben

| Aufgabe | Aufwand | Verweis |
|---------|---------|---------|
| **Inbox-UI** | | M1 |
| InboxView (Hauptansicht) | M (3) | ADR-020 Schicht 2 |
| InboxItem (mit Aktionen sichten/verwerfen/PW/Projektboard) | M (3) | ADR-020 |
| QuickCaptureField (immer sichtbar) | S (1) | ADR-020 |
| InboxShortcut (Cmd/Ctrl+I Overlay) | S (1) | ADR-020 |
| InboxRoutingConfig (Distributions) | M (3) | ADR-020 |
| **Projekt-Template-Generator** | | |
| "Tropen OS Certified Starter" — Next.js + Supabase + Auth + Legal | L (8) | Roadmap, User-Story Sprint B |
| Initial-Score ≥ 55% Garantie | M (3) | User-Story Sprint B |
| **Pricing** | | |
| Credits-Modell + Pricing Page | M (3) | Roadmap |
| Stripe-Integration für Tier-Wechsel | M (3) | Roadmap |
| Free/Gründer/Agency-Tiers operationalisiert | S (1) | Roadmap |
| **Aufspaltungs-Refactorings (vor Sprint 4!)** | | |
| `useWorkspaceState.ts` aufspalten | M (3) | M1 Befund |

**Aufwand:** ~25 Punkte = ~10-14 Tage

**Deliverables:**
- Funktionsfähige Inbox als zweite niedrigschwellige Eingangstür
- Tropen OS Certified Starter als Lead-Magnet
- Pricing-Page mit funktionsfähigem Stripe-Flow
- `useWorkspaceState.ts` aufgespalten (Vorbereitung Sprint 4)

**Prüfsteine vor Sprint 4:**
- Erste 10 Beta-User onboarded?
- Inbox-Nutzung gemessen — wird sie tatsächlich gebraucht?
- Pricing-Tier-Verteilung sichtbar?

---

## Sprint 4 — Veredler + Onboarding

**Ziel:** Das produktive Herzstück. Prompt-Veredler (ADR-021) auf existierender ~1.840-Zeilen-Substanz aufbauen. Phase-0-Onboarding (User-Story) als Begleiter etablieren.

### Aufgaben

| Aufgabe | Aufwand | Verweis |
|---------|---------|---------|
| **Vorlauf-Refactoring** | | |
| `ai-chat/index.ts` (924 Zeilen) aufspalten | L (8) | M1 Befund |
| **Veredler-Backend** | | |
| Veredler-Klassifikator (auf complexity-detector.ts) | M (3) | M1, ADR-021 |
| Veredler-Anreicherung (auf library-resolver.ts) | M (3) | M1, ADR-021 |
| Veredler-Tool-Profile (Lovable/Cursor/Claude Code/Bolt) | M (3) | ADR-021 |
| API-Routes `/api/veredler/{classify,enrich,profiles}` | M (3) | M1 |
| **Veredler-UI** | | |
| VeredlerClassifier (Tiefen-Indikator) | S (1) | M1 |
| VeredlerPreview (Tiefe 3 Bestätigung) | M (3) | M1 |
| VeredlerOutput (4-Felder-Block mit Kopier-Button) | S (1) | M1 |
| ToolProfilePicker | S (1) | M1 |
| **Phase-0-Onboarding** | | |
| KI-Interview-Flow (4 Pfade aus User-Story) | L (8) | User-Story Phase 0 |
| Projekt-Briefing-Generierung | M (3) | User-Story Phase 0 |
| Tech-Stack-Empfehlung | M (3) | User-Story Phase 4 |
| **Audit-Integration** | | |
| Quality Loop (Audit + Fix-Prompt + Score-Verlauf verkettet) | M (3) | User-Story Phase 6, Roadmap |

**Aufwand:** ~35 Punkte = ~14-20 Tage

**Deliverables:**
- Funktionsfähiger Prompt-Veredler mit drei Tiefen
- Tool-Profile für 4 Bau-Tools
- Phase-0-Onboarding für neue User
- Quality Loop sichtbar verkettet

**Prüfsteine vor Sprint 5:**
- Veredler wird genutzt — quantitative Daten?
- Phase-0-Onboarding-Conversion gemessen?
- Erste positive User-Stories?

---

## Sprint 5 (Q3 2026) — Distribution

**Ziel:** Reichweite. GitHub-Repo-Connect für Browser-unabhängiges Scannen, MCP-Server für Cursor-Integration, VS Code Extension als Counter zu BugBot/Copilot.

### Aufgaben

| Aufgabe | Aufwand | Verweis |
|---------|---------|---------|
| GitHub-Repo-Connect (OAuth) | L (8) | Roadmap Q3 |
| Automatisches Scannen via GitHub API | M (3) | Roadmap |
| MCP-Server für Cursor (Pull, ADR-023) | M (3) | Roadmap, ADR-023 |
| `@tropen scan` als Cursor-Befehl | S (1) | Roadmap |
| VS Code Extension (Score in Statusbar) | L (8) | Roadmap Q3 |
| Findings-Liste in VS Code | M (3) | Roadmap |
| Product Hunt Launch (Vorbereitung) | M (3) | Roadmap |
| Discord-Community-Start | S (1) | Roadmap |

**Aufwand:** ~30 Punkte = ~12-18 Tage

**Deliverables:**
- GitHub-Repo-Connect funktionsfähig
- MCP-Server in Cursor integriert
- VS Code Extension veröffentlicht
- Product Hunt Launch durchgeführt
- Discord aktiv

---

## Was nach Sprint 5 kommt — Q4 2026 (nicht in dieser Roadmap)

Aus Roadmap-Q2-Doc:
- Agency/Freelancer-Tier (€199/Monat)
- Vercel Deploy-Hook Integration
- Lovable Partnership (formell)
- 100 Beta-User Milestone
- Erste Einnahmen
- Community-Regelwerk (user-contributed)

**Diese Punkte kommen in eine separate Roadmap Q4-2026.**

---

## Querverweise zu anderen Anhängen

- **Migrations-Reihenfolge:** siehe Anhang B (M3-Cluster werden parallel zu Sprints umgesetzt)
- **Was nicht im Roadmap erscheint:** siehe Anhang C (Kill- und Einfrier-Liste)

---

## Kritische Fragen zur Roadmap (offen)

| Frage | Wann beantworten | Konsequenz |
|-------|------------------|----------|
| Multi-Modell-Review im MVP oder Premium-Phase-3? | Vor Sprint 4 | Wenn MVP: Sprint 4 erweitert, sonst eingefroren |
| Perspectives-Feature für Solo relevant? | Aus L2-Gesprächen | Wenn nein: einfrieren |
| Parallel-Tabs im Chat für Solo relevant? | Aus L2-Gesprächen | Wenn nein: einfrieren |
| Custom Agents als Phase-2 oder AUS? | Vor Sprint 4 | Memory ist klar (AUS), aber Code ist da — Entscheidung schriftlich fixieren |
| n8n vs. Windmill als Workflow-Engine | Bei Bedarf in Sprint 4-5 | Beide Konzepte existieren, ADR-018 wählt Windmill |
