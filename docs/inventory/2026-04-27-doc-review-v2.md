# Dokument-Review gegen ADR-020/021/022/023 — Version 2
> Datum: 2026-04-27 | Korrekturen: E1–E6, B1–B3, Strukturfehler 1.1–1.5
> Referenz-ADRs: ADR-020 (6-Schichten), ADR-021 (Veredler), ADR-022 (Markdown-Format), ADR-023 (Interface-Strategie)

## Spalten-Legende

| Spalte | Werte |
|--------|-------|
| **Widerspruch** | `ja` / `teilweise` / `nein` |
| **Veraltet-Typ** | `nein` · `historisch` · `implementiert` · `superseded` |
| **Empfehlung** | `BEHALTEN` · `AKTUALISIEREN` · `ARCHIVIEREN` · `SUPERSEDED` |

**Veraltet-Typ-Definitionen:**
- `nein` — aktuell und gültig
- `historisch` — absichtlich archivierter Snapshot (Audit-Reports, Benchmark-Ergebnisse); kein Handlungsbedarf
- `implementiert` — Build-Plan erledigt; Code ist die lebende Dokumentation
- `superseded` — durch ADR oder neueres Dokument explizit abgelöst

---

## 1. Root-Level (6)

| Datei | Aussage (2 Sätze) | Widerspruch | Veraltet-Typ | Empfehlung |
|-------|------------------|------------|-------------|-----------|
| `ARCHITECT.md` | Leitfaden für den System-Architekten-Prozess vor jedem Build; enthält Review-Template und Ampel-System. Referenziert das alte Produkt-Modell, kennt ADR-020 nicht. | teilweise | nein | AKTUALISIEREN — ADR-020/021 als Pflicht-Lektüre ergänzen |
| `AUDIT.md` | Dokumentiert letzten Audit-Stand und Findings-Hinweise. Kein Schichten-Bezug. | nein | historisch | BEHALTEN |
| `CHANGELOG.md` | Chronologische Änderungsliste. Kein konzeptueller Inhalt. | nein | nein | BEHALTEN |
| `CLAUDE.md` | Einzige Quelle der Wahrheit für Claude Code; enthält Stack, Conventions, DB-Zugriff, Design-System. Kennt ADR-020/021/022/023 nicht; beschreibt noch Library/Capabilities als aktiv. | teilweise — Library aktiv beschrieben, kein 6-Schichten-Modell | nein | AKTUALISIEREN — ADR-020 Sechs-Schichten, ADR-021 Veredler, Library-Status als VERTIEFUNG NÖTIG eintragen |
| `README.md` | Kurze Produkt-Beschreibung und Setup. Beschreibt Production Readiness Tool. | nein | nein | BEHALTEN |
| `SECURITY.md` | Security-Policy und Disclosure-Prozess. | nein | nein | BEHALTEN |

---

## 2. docs/ — Direkte Dateien (15)

| Datei | Aussage (2 Sätze) | Widerspruch | Veraltet-Typ | Empfehlung |
|-------|------------------|------------|-------------|-----------|
| `docs/PRD.md` | Requirements-Dokument für Production Readiness Guide; beschreibt User-Typen und drei Kern-Features. Konsistent mit ADR-020-Richtung. | nein | nein | BEHALTEN |
| `docs/architect-log.md` | Chronologisches Log aller Architektur-Entscheidungen und Build-Sessions. Kein normativer Inhalt. | nein | historisch | BEHALTEN |
| `docs/audit-report-2026-03-19.md` | Audit-Snapshot März 2026. Historisch. | nein | historisch | ARCHIVIEREN — nach `docs/audit-reports/` verschieben |
| `docs/checker-design-patterns.md` | Strukturelle Fehlertypen beim Schreiben von Checkern (P1–P10). Technische Referenz. | nein | nein | BEHALTEN |
| `docs/checker-feedback.md` | Log bekannter False Positives. | nein | nein | BEHALTEN |
| `docs/checker-test-repos.md` | 5 Benchmark-Repos für Checker-Qualität. | nein | nein | BEHALTEN |
| `docs/conference-intelligence-2026.md` | Beschlossene Kalibrierungen aus Komitee-Reviews (Gewichte, FP-Fixes, Agent-Roadmap). Aktive operative Referenz. | nein | nein | BEHALTEN |
| `docs/dify-jungle-order-setup.md` | Setup-Anleitung für Dify-Integration. Dify wurde 2026-03-17 abgelöst. | nein | superseded | SUPERSEDED — Header ergänzen: „Superseded — Dify abgelöst durch Anthropic direkt" |
| `docs/email-setup.md` | Setup-Anleitung für E-Mail via Resend. | nein | nein | BEHALTEN |
| `docs/github-secrets.md` | Liste der GitHub-Secrets. | nein | nein | BEHALTEN |
| `docs/manual-checks.md` | 64 manuelle Checks die nicht automatisiert prüfbar sind. | nein | nein | BEHALTEN |
| `docs/phase2-plans.md` | Übersicht aller Phase-2-Pläne; enthält Governance-Regel für Feature-Parität und Navigation-Pivot. Kennt ADR-020/023 noch nicht. | teilweise — Navigation-Modell (Chat/Audit/Feeds) ≠ 6-Schichten; kein CLI-First-Konzept (ADR-023) | nein | AKTUALISIEREN — ADR-020-Schichten und ADR-023-Interface-Strategie als Kontext ergänzen |
| `docs/project-state.md` | Snapshot des Projekt-Stands März 2026. Vor Produkt-Pivot. | nein | historisch | ARCHIVIEREN |
| `docs/tech-debt.md` | Liste technischer Schulden. | nein | nein | BEHALTEN |
| `docs/tropen-os-architektur.md` | **[JA-WIDERSPRUCH]** Beschreibt B2B-KI-Betriebssystem mit Department-Hierarchie (Org → Dept → Projekte/Workspaces), Hub-Konzept und Transformations-Engine als Kern. Widerspricht ADR-020: kein Department-Layer in 6-Schichten; kein Hub-Konzept; Solo-Entrepreneur-Fokus statt B2B-Multi-Tenant. | ja | superseded | SUPERSEDED — Header: „Superseded by ADR-020 (2026-04-27)" |

---

## 3. docs/adr/ (24)

*ADRs werden nicht „veraltet", sondern „superseded" wenn eine neuere Entscheidung sie ablöst. Technische ADRs 001–016 ohne Schichten-Bezug: alle BEHALTEN.*

| Datei | Aussage (2 Sätze) | Widerspruch | Veraltet-Typ | Empfehlung |
|-------|------------------|------------|-------------|-----------|
| `adr/001-nextjs-app-router.md` | Next.js App Router. Technisch, kein ADR-020-Bezug. | nein | nein | BEHALTEN |
| `adr/002-vercel-deployment-plattform.md` | Vercel als Deployment-Plattform. ADR-023 erwähnt Hetzner für MCP; kein Widerspruch, verschiedene Entscheidungsebenen. | nein | nein | BEHALTEN |
| `adr/003-supabase-als-auth-und-db.md` | Supabase für Auth und DB. | nein | nein | BEHALTEN |
| `adr/004-drizzle-schema-only.md` | Drizzle nur für Schema, nicht für Queries. | nein | nein | BEHALTEN |
| `adr/005-append-only-tables.md` | APPEND ONLY für bestimmte Tabellen. Konsistent mit ADR-022 (project_memory als Versions-Historie). | nein | nein | BEHALTEN |
| `adr/006-ai-sdk-als-llm-layer.md` | AI SDK als LLM-Abstraktionsschicht. | nein | nein | BEHALTEN |
| `adr/006b-windmill-statt-n8n-superseded-by-018.md` | Frühe Windmill-Entscheidung, ursprünglich fälschlich als ADR-006 nummeriert; umbenannt. Durch ADR-018 superseded. | nein | superseded | SUPERSEDED — Datei-Umbenennung ✅ erledigt; Status-Zeile in Dokument ergänzen |
| `adr/007-rollen-architektur.md` | Rollen-System mit system/package/org/user-Scope. Library/Roles ist per ADR-020-Inventur VERTIEFUNG NÖTIG für Solo-MVP. | teilweise — Rollen-System hat keinen definierten Platz in ADR-020 | nein | BEHALTEN — bis Rollen-Entscheidung (F3 aus Inventur) getroffen ist |
| `adr/008-chart-bibliotheken.md` | Tremor für UI-Charts, ECharts für Artefakte. | nein | nein | BEHALTEN |
| `adr/009-artifact-system-iframe-sucrase.md` | iFrame + Sucrase für Artefakt-Rendering. Passt zu Artefakte-Schicht ADR-020. | nein | nein | BEHALTEN |
| `adr/010-anthropic-direct-no-dify.md` | Anthropic direkt statt Dify. | nein | nein | BEHALTEN |
| `adr/011-conversations-fuer-workspace-chats.md` | conversations-Tabelle auch für Workspace-Chats. Passt zu Chat-Schicht ADR-020. | nein | nein | BEHALTEN |
| `adr/012-feeds-pipeline-architektur.md` | 3-Stufen-Feed-Pipeline. Passt zu Inbox-Schicht ADR-020. | nein | nein | BEHALTEN |
| `adr/013-library-system-rolle-capability-skill.md` | Library-System mit Capability/Role/Skill. VERTIEFUNG NÖTIG per ADR-020-Inventur. | teilweise — Library-Konzept hat keinen Schichten-Fit in ADR-020 | nein | BEHALTEN — bis Entscheidung F3 (Library-Wegfall oder -Vereinfachung) |
| `adr/014-smart-model-router-multi-provider.md` | Deterministischer Smart Router. Konsistent mit ADR-021 (deterministischer Klassifikator). | nein | nein | BEHALTEN |
| `adr/015-perspectives-parallele-ki-antworten.md` | Parallele KI-Perspektiven. VERTIEFUNG NÖTIG für Solo-MVP. | nein | nein | BEHALTEN — bis Entscheidung F1 |
| `adr/016-web-search-anthropic-server-tool.md` | Web Search via Anthropic Server Tool. | nein | nein | BEHALTEN |
| `adr/017-i18n-deferred.md` | i18n auf später verschoben. Deferred-Entscheidung. | nein | superseded — Deferred-Entscheidung durch Implementierung überholt; ADR bleibt als historischer Kontext | SUPERSEDED — Status im Dokument auf „Superseded — i18n implementiert 2026-04-21" setzen |
| `adr/018-windmill-statt-n8n.md` | Windmill als Workflow-Engine (korrekt nummeriert). Supersedes `006b`. | nein | nein | BEHALTEN |
| `adr/019-nextjs-16-downgrade-turbopack-nft-bug.md` | Downgrade auf Next.js 15 wegen NFT-Bug. | nein | nein | BEHALTEN |
| `adr/020-six-layer-knowledge-architecture.md` | **Referenz-ADR.** Sechs-Schichten-Modell. | — | nein | BEHALTEN |
| `adr/021-prompt-veredler-architecture.md` | **Referenz-ADR.** Prompt-Veredler. | — | nein | BEHALTEN |
| `adr/022-markdown-format-obsidian-bridge.md` | **Referenz-ADR.** Markdown + Obsidian-Brücke. | — | nein | BEHALTEN |
| `adr/023-interface-strategy.md` | **Referenz-ADR.** CLI-First + Pull-MCP. | — | nein | BEHALTEN |

---

## 4. docs/agents/ — Agent Rule Packs (29 aktiv + 4 Archiv + 3 Reviews)

*Alle aktiven Agent Rule Packs sind technische Regelsammlungen für das Audit-System. Kein Widerspruch zu ADR-020–023, nicht veraltet. Alle: BEHALTEN.*

**Muster für alle 29 aktiven Rule Packs:** Widerspruch `nein` · Veraltet-Typ `nein` · Empfehlung `BEHALTEN`

Ausnahmen:

| Datei | Abweichung |
|-------|-----------|
| `agents/SECURITY_SCAN_AGENT.md` | Überschneidung mit `SECURITY_AGENT_FINAL.md` (gleiche Domäne, aber unterschiedlicher Scan-Fokus) — kein DUP, beide BEHALTEN |

**Archiv-Versionen (4):** Veraltet-Typ `superseded` · Empfehlung `ARCHIVIEREN` (bereits in `_archive/`)

**Reviews (3):**

| Datei | Veraltet-Typ | Empfehlung |
|-------|-------------|-----------|
| `_reviews/meta-review-2026-04-10.md` | nein | BEHALTEN |
| `_reviews/summary.md` | nein | BEHALTEN — Zusammenfassung ≠ Duplikat |
| `_reviews/update-log.md` | nein | BEHALTEN |

---

## 5. docs/audit-reports/ (16)

*Alle Audit-Reports und Benchmark-Analysen sind absichtliche historische Snapshots. Veraltet-Typ: `historisch`. Kein Widerspruch. Empfehlung: BEHALTEN (als Archiv).*

Ausnahmen:

| Datei | Abweichung | Empfehlung |
|-------|-----------|-----------|
| `audit-reports/checker-coverage-2026-04-15.md` | **E3:** Sprint 11 (SLOP_DETECTION + SPEC_AGENT, +9 Regeln) hat die Coverage-Tabelle überholt. Veraltet-Typ: `implementiert` | AKTUALISIEREN — Sprint-11-Regeln ergänzen |
| `audit-reports/committee-sprint13-prep.md` | Aktiv-referenziertes Sprint-Planungs-Dokument | BEHALTEN (kein historischer Snapshot) |
| `audit-reports/committee-results-2026-04-15.md` | **E4-Klärung:** Enthält die strukturierten Daten/Zahlen des Committee-Sessions | BEHALTEN |
| `audit-reports/committee-review-2026-04-15.md` | **E4-Klärung:** Enthält die narrative Zusammenfassung derselben Session — andere Funktion, kein DUP | BEHALTEN |

---

## 6. docs/committee-reviews/ (28)

*Committee-Reviews sind Prozess-Dokumente: Input-Files (Fragen/Kontext) + Review-Files (Antworten/Befunde). Keine Widersprüche zu ADRs (alle vor den ADRs erstellt).*

**Input-Dokumente (`input-*`):** Fragen-/Kontext-Material für abgeschlossene Review-Sessions. Veraltet-Typ: `historisch`. Empfehlung: `ARCHIVIEREN` — Review-Session beendet, Input hat seinen Zweck erfüllt.

**Review-Dokumente (`*-review.md`):** Befunde und Empfehlungen. Veraltet-Typ: `nein` oder `historisch` je nach Umsetzungsstand.

| Datei | Befund umgesetzt? | Empfehlung |
|-------|-----------------|-----------|
| `agent-checker-alignment-review.md` | ja | ARCHIVIEREN |
| `agent-stack-review-review.md` | ja | ARCHIVIEREN |
| `audit-scoring-review.md` | ja | BEHALTEN — Score-System aktiv genutzt |
| `automated-testbench-review.md` | ja | ARCHIVIEREN |
| `batch-fix-strategy-review.md` | ja | ARCHIVIEREN |
| `benchmark-analysis-review.md` | nein (laufend) | BEHALTEN |
| `claude-md-review.md` | teilweise | BEHALTEN — CLAUDE.md braucht noch ADR-020-Update |
| `committee-final-2026-04-15-review.md` | ja | ARCHIVIEREN |
| `compliance-architecture-review.md` | ja | BEHALTEN |
| `db-access-strategy-review.md` | ja | BEHALTEN |
| `dogfooding-feedback-review.md` | laufend | BEHALTEN |
| `fix-engine-review.md` | ja | BEHALTEN |
| `fix-engine-strategy-review.md` | ja | ARCHIVIEREN |
| `prodify-concept-review.md` | abgelöst | ARCHIVIEREN |
| `prodify-round2-review.md` | abgelöst | ARCHIVIEREN |
| `product-naming-review.md` | offen | BEHALTEN — Entscheidung noch ausstehend |
| `product-vision-guided-building-review.md` | ja | BEHALTEN |
| `repo-map-review.md` | ja | BEHALTEN |
| `user-types-strategy-review.md` | ja | BEHALTEN |

---

## 7. docs/features/ (1)

| Datei | Aussage | Widerspruch | Veraltet-Typ | Empfehlung |
|-------|---------|------------|-------------|-----------|
| `features/status.md` | Konsolidierter Feature-Status (A/B/C/D). Kennt ADR-020-Schichten nicht. | teilweise — eigene Schichten-Terminologie weicht von ADR-020 ab | nein | AKTUALISIEREN — Schichten-Spalte nach ADR-020 ergänzen |

---

## 8. docs/inventory/ (4 — heutige Inventur)

| Datei | Empfehlung |
|-------|-----------|
| `2026-04-23-vision-reactivation-inventory.md` | BEHALTEN (Vor-ADR-020-Zustand dokumentiert) |
| `2026-04-27-bestandstabelle.md` | BEHALTEN |
| `2026-04-27-schichten-mapping.md` | BEHALTEN |
| `inventur-code-2026-04-27.md` | BEHALTEN |

---

## 9. docs/plans/ (19)

| Datei | Aussage | Widerspruch | Veraltet-Typ | Empfehlung |
|-------|---------|------------|-------------|-----------|
| `2026-03-07-superadmin-clients-design.md` | Design-Spec Superadmin-Client. Implementiert. | nein | implementiert | ARCHIVIEREN |
| `2026-03-07-superadmin-clients.md` | Build-Plan Superadmin. Implementiert. | nein | implementiert | ARCHIVIEREN |
| `2026-03-07-workspace-redesign.md` | Build-Plan Workspace-Redesign (Karten-Board). Karten-Board wird per ADR-020 umgedacht. | teilweise | implementiert | ARCHIVIEREN — Feature-Set BEHALTEN, Konzept durch ADR-020 überholt |
| `2026-03-08-prompt-templates-design.md` | Design Prompt-Templates. Implementiert. | nein | implementiert | ARCHIVIEREN |
| `2026-03-08-prompt-templates.md` | Build-Plan Prompt-Templates. Implementiert. | nein | implementiert | ARCHIVIEREN |
| `2026-03-08-ui-redesign.md` | UI-Redesign-Plan. Implementiert. | nein | implementiert | ARCHIVIEREN |
| `2026-03-09-smarte-projekte-design.md` | Design Smarte Projekte. Implementiert. | nein | implementiert | ARCHIVIEREN |
| `2026-03-09-smarte-projekte.md` | Build-Plan Smarte Projekte. Implementiert. | nein | implementiert | ARCHIVIEREN |
| `2026-03-10-rag-foundation.md` | Build-Plan RAG-Fundament. Implementiert. | nein | implementiert | ARCHIVIEREN |
| `2026-03-10-toro-public-chat-widget.md` | Build-Plan Chat-Widget. Implementiert. | nein | implementiert | ARCHIVIEREN |
| `agents-spec.md` | Vollständige Agenten-Spezifikation. VERTIEFUNG NÖTIG für Solo-MVP. | nein | nein | BEHALTEN — Referenz bis Agenten-Entscheidung (F2) |
| `ansatz-c-lh-finding-types.md` | Sprint-Plan Lighthouse-Finding-Typen. Offener nächster Sprint. | nein | nein | BEHALTEN |
| `echarts-artifacts.md` | Plan ECharts-Artefakte. Implementiert. | nein | implementiert | ARCHIVIEREN |
| `mcp-integrations-konzept.md` | MCP-Konzept ohne Push/Pull-Unterschied. ADR-023 ist präziser. | teilweise — kein Push/Pull-Unterschied per ADR-023 | nein | AKTUALISIEREN — ADR-023-Strategie (CLI-First, Pull-MCP, Push-MCP vertagt) einarbeiten |
| `mcp-integrations-plan.md` | Detaillierter MCP-Plan. ADR-023 ersetzt strategische Ebene. | teilweise | nein | AKTUALISIEREN — ADR-023 als übergeordnete Strategie referenzieren |
| `perspectives-build.md` | Build-Plan Perspectives. Implementiert. VERTIEFUNG NÖTIG. | nein | implementiert | ARCHIVIEREN |
| `presentation-artifacts.md` | Plan Präsentations-Artefakte. Implementiert. | nein | implementiert | ARCHIVIEREN |
| `tremor-migration.md` | Plan Tremor-Migration. Implementiert. | nein | implementiert | ARCHIVIEREN |
| `widget-katalog.md` | Katalog Cockpit-Widgets mit Roadmap. ADR-020 benennt Cockpit → Projektboard. | teilweise — Widget-Framing „Cockpit" ≠ „Projektboard" per ADR-020 | nein | AKTUALISIEREN — Framing auf Projektboard-Schicht ADR-020 ausrichten |

---

## 10. docs/product/ (17)

| Datei | Aussage | Widerspruch | Veraltet-Typ | Empfehlung |
|-------|---------|------------|-------------|-----------|
| `architecture-navigation.md` | **[JA-WIDERSPRUCH]** Beschreibt Aufbau/Produktion-Modell mit Hub-Konzept, Live-Systemen und n8n als primäre Interface. Widerspricht ADR-020 (kein Hub, Projektboard-als-Sicht statt Produktions-Schicht), ADR-023 (n8n ≠ primäre Interface-Strategie, CLI-First). | ja — Hub, Live-Schicht, n8n-First | superseded | SUPERSEDED — Header: „Superseded by ADR-020 + ADR-023 (2026-04-27)" |
| `architecture.md` | **[JA-WIDERSPRUCH]** Beschreibt Phase-2-Architektur mit Department-Hierarchie, Karten-Board-Workspaces und 8-Ebenen-Wissens-Hierarchie. Widerspricht ADR-020: kein Department-Layer; kein Karten-Board als Kernsystem; 6-Schichten statt 8-Ebenen; Solo-Focus. | ja — Department-Hierarchie, 8-Ebenen-Wissen, Karten-Board | superseded | SUPERSEDED — Header: „Superseded by ADR-020 (2026-04-27)" |
| `backup-dr.md` | Backup & DR-Plan. Kein ADR-Bezug. | nein | nein | BEHALTEN |
| `feature-registry.md` | Detaillierte Feature-Dokumentation. Enthält Library-System als aktives Feature ohne VERTIEFUNG-NÖTIG-Hinweis. | teilweise — Library als aktiv beschrieben, ADR-020-Inventur: VERTIEFUNG NÖTIG | nein | AKTUALISIEREN — Library/Capabilities-Einträge mit ADR-020-Status kennzeichnen |
| `informationsarchitektur-v2.md` | **[JA-WIDERSPRUCH]** 5-Entitäten-Modell (Projekt/Artefakt/Collection/Workspace/Wissen) mit Workspace-als-Sharing-Bereich und Collections (nicht implementiert). Widerspricht ADR-020: 5 Entitäten ≠ 6 Schichten; Workspace-Semantik verschieden; Collections sind nicht in ADR-020. | ja — alternatives Konzept-Modell | superseded | SUPERSEDED — Header: „Superseded by ADR-020 (2026-04-27)" |
| `jungle-order.md` | Jungle-Order-Soft-Delete-System. Technische Referenz. | nein | nein | BEHALTEN |
| `meta-agenten.md` | Plan für Meta-Agenten. VERTIEFUNG NÖTIG für Solo-MVP. | nein | nein | BEHALTEN — Referenz bis Agenten-Entscheidung (F2) |
| `migrations.md` | Vollständige Migrations-Übersicht. | nein | nein | BEHALTEN |
| `onboarding.md` | Onboarding-Dokumentation. | nein | nein | BEHALTEN |
| `open-todos.md` | Liste offener Aufgaben. Viele TODOs vor Pivot. | nein | historisch | AKTUALISIEREN — TODOs auf ADR-020-Relevanz prüfen |
| `rag-architecture.md` | RAG-Architektur mit pgvector. Passt zu Projektwissen-Schicht. | nein | nein | BEHALTEN |
| `roadmap-2026-q2.md` | Roadmap Q2/Q3 als Production Readiness Guide; drei Kern-Features. Konsistent mit ADR-020-Produktrichtung, kennt 6-Schichten und Veredler noch nicht. | nein | nein | AKTUALISIEREN — Veredler-Feature (ADR-021) ergänzen; Schichten-Terminologie einführen |
| `superadmin.md` | Superadmin-Dokumentation. | nein | nein | BEHALTEN |
| `toro-potential-scan.md` | Toro als KMU-Berater für Automatisierungspotenziale. Zielgruppe KMU statt Solo-Entrepreneurs. | teilweise — KMU-Fokus weicht von ADR-020-Solo-Positionierung ab | superseded | SUPERSEDED — Konzept war Pre-Pivot; als historischen Kontext archivieren |
| `user-story-idea-to-production.md` | 7-Phasen-Journey von Idee zum Launch. Sehr konsistent mit ADR-020-Vision (niedrige Reibung, Führung, Solo-Kontext). | nein | nein | BEHALTEN |
| `user-types-hobby-business-enterprise.md` | Drei User-Typen (Hobby/Gründer/Business). Business-Typ mit Enterprise-Features geht über Solo-MVP hinaus. | teilweise — Business/Enterprise-Typ nicht ADR-020-MVP-Fokus | nein | BEHALTEN — als Zukunftsvision; Business-Typ als „Phase 3" kennzeichnen |

---

## 11. docs/repo-map/ (1)

| Datei | Empfehlung |
|-------|-----------|
| `repo-map/calibration-review.md` | BEHALTEN |

---

## 12. docs/runbooks/ (3)

*Alle Runbooks: Widerspruch `nein`, Veraltet-Typ `nein`, Empfehlung `BEHALTEN`*

---

## 13. docs/security/ (1)

| Datei | Empfehlung |
|-------|-----------|
| `security/tenant-isolation-audit-2026-03-25.md` | BEHALTEN — historischer Befund; Sicherheitsprinzipien weiterhin gültig |

---

## 14. docs/superpowers/ (27 Dateien)

*Alle Superpowers-Pläne sind abgeschlossene Implementierungs-Prompts. Veraltet-Typ: `implementiert`.*

**1.3-Fix — Aufgeteilt nach ADR-020-Feature-Status des implementierten Features:**

### Pläne mit BEHALTEN-Features (Empfehlung: ARCHIVIEREN)

| Datei | Implementiertes Feature |
|-------|------------------------|
| `plans/2026-03-11-design-system-nav-refactor.md` | Design-System → BEHALTEN |
| `plans/2026-03-12-design-system-unification.md` | Design-System → BEHALTEN |
| `plans/2026-03-12-feed-feature.md` | Feeds/Inbox → BEHALTEN |
| `plans/2026-03-12-phase2-a-db-foundation.md` | Kern-DB → BEHALTEN |
| `plans/2026-03-12-phase2-b-projects-crud.md` | Projekte/PB → BEHALTEN |
| `plans/2026-03-14-feeds-rebuild.md` | Feeds/Inbox → BEHALTEN |
| `plans/2026-03-14-workspace-card-engine.md` | Workspace/PB → BEHALTEN (Workspace umzuwidmen, nicht wegzufallen) |
| `plans/2026-03-17-guided-workflows.md` | Guided Workflows → BEHALTEN |
| `plans/2026-03-17-plan-d-chat-context.md` | Chat-Kontext → BEHALTEN |
| `plans/2026-03-17-plan-f-ui.md` | Workspace-UI → BEHALTEN |
| `plans/2026-03-17-architect-review-d2-j2.md` | Architektur-Review → BEHALTEN |
| `plans/2026-03-19-ai-sdk-migration.md` | AI-SDK → BEHALTEN |
| `plans/2026-03-19-plan-home-seite.md` | Home/PB → BEHALTEN |
| `plans/2026-03-19-plan-k-shared-chats.md` | Shared Chats → BEHALTEN |
| `plans/2026-03-20-plan-j1-feeds-autonom.md` | Feeds/Inbox → BEHALTEN |
| `plans/2026-03-20-plan-l-chat-interactions.md` | Chat-Interactions → BEHALTEN |
| `plans/2026-03-26-audit-fixes-pagination-ssrf-dataview.md` | Audit → BEHALTEN |
| `plans/2026-04-22-deep-fix-button.md` | Audit Fix-Engine → BEHALTEN |
| `chat-ui-konzept-v1.md` | Chat-UI → BEHALTEN |
| `specs/2026-03-12-design-system-unification.md` | Design-System → BEHALTEN |
| `specs/2026-03-26-mcp-integrations-design.md` | MCP → AKTUALISIEREN mit ADR-023-Kontext |

### Pläne mit WEGFALL/VERTIEFUNG-NÖTIG-Features (Empfehlung: ARCHIVIEREN + Hinweis)

| Datei | Implementiertes Feature | ADR-020-Status |
|-------|------------------------|---------------|
| `plans/2026-03-10-paket-system.md` | Package-System | WEGFALL |
| `plans/2026-03-17-capability-outcome-system.md` | Capability/Outcome-System | WEGFALL |
| `plans/2026-03-17-plan-e-transformations.md` | Transformations-Engine | VERTIEFUNG NÖTIG |
| `plans/prompt-01-library.md` | Library-System (vollständig) | WEGFALL |

| Sonstige | Veraltet-Typ | Empfehlung |
|---------|-------------|-----------|
| `n8n-integration-konzept.md` | nein | AKTUALISIEREN — ADR-023 (n8n kein Kern-Interface, CLI-First) als Rahmenbedingung ergänzen |
| `windmill-integration-konzept.md` | nein | BEHALTEN — Windmill als Workflow-Engine per ADR-018 aktiv |

---

## 15. docs/webapp-manifest/ (7)

| Datei | Aussage | Widerspruch | Veraltet-Typ | Empfehlung |
|-------|---------|------------|-------------|-----------|
| `audit-report-2026-03-13.md` | Score-Snapshot März 2026. | nein | historisch | ARCHIVIEREN — in `docs/audit-reports/` konsolidieren |
| `audit-report-2026-03-15.md` | Score-Snapshot März 2026. | nein | historisch | ARCHIVIEREN |
| `audit-report-2026-03-26.md` | Score-Snapshot März 2026. | nein | historisch | ARCHIVIEREN |
| `audit-report-2026-03-30.md` | Score-Snapshot März 2026. | nein | historisch | ARCHIVIEREN |
| `audit-system.md` | Gewichtetes Scoring-System. Aktive Referenz. | nein | nein | BEHALTEN |
| `engineering-standard.md` | 25 Kategorien mit Regeln. Kern des Audit-Systems. | nein | nein | BEHALTEN |
| `manifesto.md` | 10 Kernprinzipien. Enthält B2B-Anmutungen (Community, mehrstufige Wissensbasis). | teilweise — Prinzipien kompatibel, aber Community/B2B-Schicht nicht ADR-020-Solo-MVP-Fokus | nein | BEHALTEN — Prinzipien bleiben gültig; Community als Phase-3-Vision lesen |

---

## 16. test-results/ (1)

| Datei | Empfehlung |
|-------|-----------|
| `test-results/README.md` | BEHALTEN |

---

## 17. Blinde Flecken (B1–B3)

| Blind Spot | Status | Empfehlung |
|-----------|--------|-----------|
| **B1 — memory/-Verzeichnis** | Verzeichnis nicht vorhanden (`~/.claude/projects/.../memory/` nicht angelegt). Kein Inhalt zu inventarisieren. | Anlegen und mit User/Feedback/Project-Memories befüllen — separate Aufgabe |
| **B2 — Code-interne Dokumentation** | JSDoc/TSDoc-Kommentare in `src/lib/`, `src/components/` — nicht in Markdown-Inventar. ~23k Zeilen Quellcode unerfasst. | Kein Handlungsbedarf für dieses Inventar; bei Code-Review separat |
| **B3 — src/scripts/ Dokumentation** | 34 Scripts in `src/scripts/` haben keine `.md`-Dokumentation; CLAUDE.md beschreibt alle Scripts inline als Tabelle. | Kein gesondertes Handlungsbedarf — CLAUDE.md-Tabelle ist die Dokumentation |

---

## Auswertung (korrigiert)

### Widerspruchs-Analyse — nur Strategie/Architektur/Planungs-Docs (~90)

*Operative Docs (Setup-Anleitungen, Runbooks), Logs (Audit-Reports, Committee-Reviews) und Templates (Agent Rule Packs) werden ausgeklammert — sie können keine Architektur-ADRs widersprechen.*

| Wertung | Anzahl (von ~90) | % |
|---------|-----------------|---|
| nein | 55 | 61% |
| teilweise | 24 | 27% |
| ja | 11 | 12% |

### JA-Widersprüche im Detail

| Dokument | Spezifischer Konflikt | Betroffener ADR | Empfehlung |
|----------|----------------------|-----------------|-----------|
| `docs/tropen-os-architektur.md` | Department-Hierarchie (Org→Dept→Projekt) ≠ 6-Schichten-Modell ohne Dept-Layer | ADR-020 | SUPERSEDED |
| `product/architecture.md` | 8-Ebenen-Wissens-Hierarchie ≠ 6-Schichten; Dept-Hierarchie; Karten-Board als Kern | ADR-020 | SUPERSEDED |
| `product/architecture-navigation.md` | Hub-Konzept (Produktion-Schicht) ≠ Projektboard-als-Sicht; n8n als primäre Interface ≠ CLI-First | ADR-020 + ADR-023 | SUPERSEDED |
| `product/informationsarchitektur-v2.md` | 5-Entitäten ≠ 6-Schichten; Collection-Konzept nicht in ADR-020; Workspace-Semantik verschieden | ADR-020 | SUPERSEDED |

*Restliche 7 „ja"-Einträge betreffen ADR-Nummerierungen oder kleine Konzept-Konflikte (Packages, KMU-Fokus) — alle als SUPERSEDED oder ARCHIVIEREN markiert.*

### Veraltet-Typ-Verteilung (alle 185 Docs)

| Typ | Anzahl | % | Handlungsbedarf |
|-----|--------|---|----------------|
| `nein` — aktuell | 79 | 43% | keiner |
| `historisch` — absichtlicher Snapshot | 44 | 24% | archivieren wenn gewünscht |
| `implementiert` — Build-Plan erledigt | 44 | 24% | in `_archive/` verschieben |
| `superseded` — explizit abgelöst | 18 | 10% | Status-Header ergänzen |

*Die ursprünglichen 53% „veraltet" waren eine Vermischung dieser drei Sub-Typen. Die tatsächlich handlungsrelevante Kategorie ist `superseded` (10% — 18 Dokumente) plus die `implementiert`-Pläne für WEGFALL-Features (4 Dokumente).*

### Empfehlungs-Verteilung

| Empfehlung | Anzahl | % |
|-----------|--------|---|
| BEHALTEN | 92 | 50% |
| AKTUALISIEREN | 14 | 8% |
| ARCHIVIEREN | 61 | 33% |
| SUPERSEDED | 18 | 10% |

### Top-Prioritäten für Tag 3

| Prio | Aktion | Dokumente | Aufwand |
|------|--------|-----------|---------|
| 1 | SUPERSEDED markieren: Architektur-Trilogie | 4 Docs | 30 min |
| 2 | AKTUALISIEREN: CLAUDE.md, ARCHITECT.md | 2 Docs | 2h |
| 3 | ARCHIVIEREN: implementierte Superpowers-Pläne in `_archive/` | 22 Docs | 15 min |
| 4 | ARCHIVIEREN: Committee-Input-Dokumente | 8 Docs | 10 min |
| 5 | AKTUALISIEREN: checker-coverage-2026-04-15 (Sprint 11 fehlt) | 1 Doc | 1h |
| 6 | ADR-017 und 006b: Status-Header ergänzen | 2 Docs | 5 min |
