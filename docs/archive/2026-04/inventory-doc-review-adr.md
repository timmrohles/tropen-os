# Dokument-Review gegen ADR-020/021/022/023
> Datum: 2026-04-27 | 185 Dokumente
> Referenz-ADRs: ADR-020 (6-Schichten), ADR-021 (Veredler), ADR-022 (Markdown-Format), ADR-023 (Interface-Strategie)

**Spalten:**
- **Aussage** — Kernthese des Dokuments in 2 Sätzen
- **Widerspruch** — `ja` / `teilweise` / `nein` (bezogen auf ADR-020–023 zusammen)
- **Veraltet** — `ja` / `nein` (Inhalt beschreibt Stand der vor ADRs überholt ist)
- **Dublette mit** — Verweis wenn inhaltlich überlappend

---

## Root-Level (6)

| Datei | Aussage | Widerspruch | Veraltet | Dublette mit |
|-------|---------|------------|---------|-------------|
| `ARCHITECT.md` | Leitfaden für den System-Architekten-Prozess vor jedem Build; enthält Review-Template und Ampel-System. Kein Schichten-Modell, kein Veredler-Konzept enthalten. | teilweise — beschreibt Workflow für das alte Produkt, kennt ADR-020 nicht | nein — Prozess-Dokument, bleibt aktuell | — |
| `AUDIT.md` | Dokumentiert den letzten Audit-Stand und offene Findings. Keine architektonische Position. | nein | nein | `docs/audit-reports/` |
| `CHANGELOG.md` | Listet Änderungen chronologisch. Kein konzeptueller Inhalt. | nein | nein | — |
| `CLAUDE.md` | Einzige Quelle der Wahrheit für Claude Code; beschreibt Stack, Conventions, DB-Zugriff, Design-System. Enthält noch B2B-KMU-Konzepte (Library, Capabilities, Departments) ohne Schichten-Modell. | teilweise — kein Verweis auf ADR-020/021/022/023; kennt Sechs-Schichten-Modell nicht | nein — lebendes Dokument, muss nach ADRs aktualisiert werden | — |
| `README.md` | Kurze Produkt-Beschreibung und Setup-Anleitung. Beschreibt das Produkt als Production Readiness Tool. | nein | nein | — |
| `SECURITY.md` | Security-Policy und Disclosure-Prozess. Kein konzeptueller Inhalt. | nein | nein | — |

---

## docs/ — Direkte Dateien (15)

| Datei | Aussage | Widerspruch | Veraltet | Dublette mit |
|-------|---------|------------|---------|-------------|
| `docs/PRD.md` | Product Requirements Document; beschreibt Tropen OS als Production Readiness Guide für Vibe-Coder. Enthält User-Typen und Kern-Features. | nein — konsistent mit ADR-020-Richtung | nein | `docs/product/roadmap-2026-q2.md` |
| `docs/architect-log.md` | Chronologisches Log aller Architektur-Entscheidungen und Build-Sessions. Keine normative Position. | nein | nein | — |
| `docs/audit-report-2026-03-19.md` | Audit-Report vom 19. März 2026; historischer Score-Snapshot. | nein | ja — historischer Stand | `docs/audit-reports/` (neuere Reports) |
| `docs/checker-design-patterns.md` | Strukturelle Fehlertypen beim Schreiben von Checkern (P1–P10). Technische Referenz für Checker-Entwicklung. | nein | nein | — |
| `docs/checker-feedback.md` | Log bekannter False Positives mit Prozess-Beschreibung. Kein konzeptueller Inhalt. | nein | nein | — |
| `docs/checker-test-repos.md` | Liste von 5 Benchmark-Repos für Checker-Qualitätsprüfung. | nein | nein | — |
| `docs/conference-intelligence-2026.md` | Enthält beschlossene Kalibrierungen aus Komitee-Reviews (Kategorie-Gewichte, FP-Fixes, Agent-Roadmap). Aktuelle operative Referenz. | nein | nein | — |
| `docs/dify-jungle-order-setup.md` | Setup-Anleitung für Dify-Integration. Dify wurde abgelöst. | nein — kein Schichten-Bezug | ja — Dify abgelöst (2026-03-17) | — |
| `docs/email-setup.md` | Setup-Anleitung für E-Mail via Resend. Kein konzeptueller Inhalt. | nein | nein | — |
| `docs/github-secrets.md` | Liste der benötigten GitHub-Secrets. Kein konzeptueller Inhalt. | nein | nein | — |
| `docs/manual-checks.md` | 64 manuelle Checks die nicht automatisiert prüfbar sind. Technische Referenz. | nein | nein | — |
| `docs/phase2-plans.md` | Übersicht aller Phase-2-Pläne mit Status; enthält Governance-Regel für Feature-Parität mit Claude.ai und Navigation-Pivot (Production Readiness Guide). | teilweise — Navigation-Modell (Chat/Audit/Feeds) ist nicht das 6-Schichten-Modell; kein Verweis auf ADR-020 | nein — aktiv genutzte Referenz, aber benötigt ADR-020-Update | `docs/product/roadmap-2026-q2.md` |
| `docs/project-state.md` | Snapshot des Projekt-Stands zum Zeitpunkt des letzten Updates (März 2026). Historisches Lagebild. | nein | ja — März-2026-Stand, vor Produkt-Pivot | — |
| `docs/tech-debt.md` | Liste technischer Schulden. Kein konzeptueller Inhalt. | nein | nein | — |
| `docs/tropen-os-architektur.md` | Beschreibt Tropen OS als B2B-KI-Betriebssystem mit Department-Hierarchie, Transformations-Engine und Hub-Konzept. Modell: Org → Dept → Projekte/Workspaces. | ja — Department-Hierarchie, Hub-Konzept, Workspace-als-Karten-Board widersprechen ADR-020 (6 Schichten, Solo-Fokus, Projektboard als Sicht) | ja — March-2026-Architektur; Pre-Pivot-Modell | `docs/product/architecture.md`, `docs/product/architecture-navigation.md` |

---

## docs/adr/ — Architecture Decision Records (24)

| Datei | Aussage | Widerspruch | Veraltet | Dublette mit |
|-------|---------|------------|---------|-------------|
| `adr/001-nextjs-app-router.md` | Entscheidung für Next.js App Router. Technisch, kein Schichten-Bezug. | nein | nein | — |
| `adr/002-vercel-deployment-plattform.md` | Entscheidung für Vercel. ADR-023 erwähnt Hetzner-Migration für MCP; kein direkter Widerspruch. | nein | nein | — |
| `adr/003-supabase-als-auth-und-db.md` | Entscheidung für Supabase. Kein Schichten-Bezug. | nein | nein | — |
| `adr/004-drizzle-schema-only.md` | Drizzle nur für Schema, nicht für Queries. Kein Schichten-Bezug. | nein | nein | — |
| `adr/005-append-only-tables.md` | APPEND ONLY für bestimmte Tabellen. Passt zu ADR-022 (project_memory als Versions-Historie). | nein | nein | — |
| `adr/006-ai-sdk-als-llm-layer.md` | AI SDK als LLM-Abstraktionsschicht. Kein Schichten-Bezug. | nein | nein | — |
| `adr/006b-windmill-statt-n8n-superseded-by-018.md` | Frühe Windmill-Entscheidung, ursprünglich fälschlich als ADR-006 nummeriert; umbenannt. | nein | nein — superseded by `adr/018-windmill-statt-n8n.md` | `adr/018-windmill-statt-n8n.md` — Superseded (gleiche Entscheidung, korrekte Nummer) |
| `adr/007-rollen-architektur.md` | Entscheidung für Rollen-System (system/package/org/user-Scope-Hierarchie). ADR-020-Inventur empfiehlt Roles als VERTIEFUNG NÖTIG. | teilweise — Library/Rollen-System ist in ADR-020-Analyse als Wegfall-Kandidat markiert | nein — technisch noch aktiv | — |
| `adr/008-chart-bibliotheken.md` | Tremor für UI-Charts, ECharts für Artefakte. Kein Schichten-Bezug. | nein | nein | — |
| `adr/009-artifact-system-iframe-sucrase.md` | iFrame + Sucrase für Artefakt-Rendering. Passt zu Artefakte-Schicht ADR-020. | nein | nein | — |
| `adr/010-anthropic-direct-no-dify.md` | Anthropic direkt statt Dify. Kein Schichten-Bezug. | nein | nein | — |
| `adr/011-conversations-fuer-workspace-chats.md` | conversations-Tabelle auch für Workspace-Chats. Passt zu Chat-Schicht ADR-020. | nein | nein | — |
| `adr/012-feeds-pipeline-architektur.md` | 3-Stufen-Feed-Pipeline. Passt zu Inbox-Schicht ADR-020. | nein | nein | — |
| `adr/013-library-system-rolle-capability-skill.md` | Library-System mit Capability/Role/Skill-Abstraktion. ADR-020-Inventur empfiehlt Library-Wegfall für Solo-Entrepreneurs. | teilweise — Library-Konzept hat keinen Platz in ADR-020; kein Schichten-Fit | nein — technisch noch aktiv | — |
| `adr/014-smart-model-router-multi-provider.md` | Deterministischer Smart Router für Modell-Auswahl. Konsistent mit ADR-021 (deterministischer Klassifikator). | nein | nein | — |
| `adr/015-perspectives-parallele-ki-antworten.md` | Parallele KI-Perspektiven via Avatar-System. ADR-020-Inventur: VERTIEFUNG NÖTIG für Solo-MVP. | nein — kein direkter Widerspruch, aber Priorität offen | nein | — |
| `adr/016-web-search-anthropic-server-tool.md` | Web Search via Anthropic Server Tool. Kein Schichten-Bezug. | nein | nein | — |
| `adr/017-i18n-deferred.md` | i18n auf später verschoben. Kein Schichten-Bezug. | nein | nein — Status: Superseded (Deferred-Entscheidung durch Implementierung überholt; ADR bleibt als historischer Kontext gültig) | — |
| `adr/018-windmill-statt-n8n.md` | Windmill als Workflow-Engine (korrekt nummerierte Version). Supersedes `adr/006b-windmill-statt-n8n-superseded-by-018.md`. | nein | nein | — |
| `adr/019-nextjs-16-downgrade-turbopack-nft-bug.md` | Downgrade auf Next.js 15 wegen NFT-Bug. Kein Schichten-Bezug. | nein | nein | — |
| `adr/020-six-layer-knowledge-architecture.md` | Sechs-Schichten-Wissens-Architektur (Chat/Inbox/PW/Merker/Artefakte/Projektboard) für Solo-Entrepreneurs. **Referenz-ADR.** | — | nein | — |
| `adr/021-prompt-veredler-architecture.md` | Prompt-Veredler als dreistufiges deterministisches System mit 4 Output-Feldern. **Referenz-ADR.** | — | nein | — |
| `adr/022-markdown-format-obsidian-bridge.md` | Projektwissen als Plain Markdown + YAML-Frontmatter + Wikilinks, Obsidian optional. **Referenz-ADR.** | — | nein | — |
| `adr/023-interface-strategy.md` | CLI-First + Deeplinks für Push; Pull-MCP für eingehende Quellen; Push-MCP vertagt. **Referenz-ADR.** | — | nein | — |

---

## docs/agents/ — Agent Rule Packs (29 aktiv)

*Alle Agent Rule Packs sind technische Regelsammlungen für das Audit-System. Sie haben keine architektonische Position zu ADR-020–023 und sind weder veraltet noch Dubletten untereinander. Abweichungen nur wo vorhanden.*

| Datei | Aussage | Widerspruch | Veraltet | Dublette mit |
|-------|---------|------------|---------|-------------|
| `agents/ACCESSIBILITY_AGENT.md` | Barrierefreiheits-Regeln (BFSG, WCAG). Technische Regel-Referenz. | nein | nein | — |
| `agents/AGENT_QUALITY_AGENT.md` | Qualitäts-Checks für andere Agenten. Meta-Referenz. | nein | nein | — |
| `agents/AI_ACT_AGENT.md` | EU AI Act Compliance-Regeln. | nein | nein | — |
| `agents/AI_INTEGRATION_AGENT.md` | Regeln für KI-Integrations-Qualität. | nein | nein | — |
| `agents/ANALYTICS_AGENT.md` | Analytics-Qualitäts-Regeln. | nein | nein | — |
| `agents/API_AGENT.md` | API-Design-Regeln (Versioning, Error-Handling). | nein | nein | — |
| `agents/ARCHITECTURE_AGENT_v3.md` | Architektur-Qualitäts-Regeln (Tenant-Isolation, Abstraktion). | nein | nein | — |
| `agents/BACKUP_DR_AGENT.md` | Backup & Disaster-Recovery-Regeln. | nein | nein | — |
| `agents/BFSG_AGENT.md` | BFSG-Barrierefreiheits-Regeln (DE-spezifisch). | nein | nein | — |
| `agents/CODE_STYLE_AGENT.md` | Code-Style und Hygiene-Regeln. | nein | nein | — |
| `agents/CONTENT_AGENT.md` | Content-Qualitäts-Regeln (SEO, Lesbarkeit). | nein | nein | — |
| `agents/COST_AWARENESS_AGENT.md` | Kosten-Bewusstseins-Regeln (LLM, Infra). | nein | nein | — |
| `agents/DATABASE_AGENT.md` | Datenbank-Qualitäts-Regeln (RLS, Indexes). | nein | nein | — |
| `agents/DEPENDENCIES_AGENT.md` | Dependency-Hygiene-Regeln (CVEs, Updates). | nein | nein | — |
| `agents/DESIGN_SYSTEM_AGENT.md` | Design-System-Regeln (Tokens, Konsistenz). | nein | nein | — |
| `agents/DSGVO_AGENT.md` | DSGVO-Compliance-Regeln. | nein | nein | — |
| `agents/ERROR_HANDLING_AGENT.md` | Error-Handling-Regeln (Try/Catch, Logging). | nein | nein | — |
| `agents/GIT_GOVERNANCE_AGENT.md` | Git-Governance-Regeln (CODEOWNERS, Commit-Format). | nein | nein | — |
| `agents/LEGAL_AGENT.md` | Rechtliche Compliance-Regeln (Impressum, AGB). | nein | nein | — |
| `agents/LOAD_TEST_AGENT.md` | Last-Test-Qualitäts-Regeln. | nein | nein | — |
| `agents/OBSERVABILITY_AGENT_v3.md` | Observability-Regeln (Logging, Monitoring, Alerting). | nein | nein | — |
| `agents/PERFORMANCE_AGENT.md` | Performance-Regeln (Core Web Vitals, Bundle-Size). | nein | nein | — |
| `agents/PLATFORM_AGENT.md` | Plattform-Qualitäts-Regeln (Deployment, CI/CD). | nein | nein | — |
| `agents/SCALABILITY_AGENT.md` | Skalierbarkeits-Regeln (DB-Indexes, Caching). | nein | nein | — |
| `agents/SECURITY_AGENT_FINAL.md` | Security-Regeln (OWASP, Auth, Secrets). | nein | nein | — |
| `agents/SECURITY_SCAN_AGENT.md` | Security-Scan-spezifische Regeln. | nein | nein | `agents/SECURITY_AGENT_FINAL.md` — Überschneidung Security-Domäne, aber unterschiedlicher Fokus |
| `agents/SLOP_DETECTION_AGENT.md` | KI-Code-Hygiene-Regeln (Placeholder, Fingerprints). | nein | nein | — |
| `agents/SPEC_AGENT.md` | Spec-Qualitäts-Regeln (PRD, AI-Kontext-Datei). | nein | nein | — |
| `agents/TESTING_AGENT.md` | Test-Qualitäts-Regeln (Coverage, Test-Typen). | nein | nein | — |

### docs/agents/_archive/ (4)

| Datei | Aussage | Widerspruch | Veraltet | Dublette mit |
|-------|---------|------------|---------|-------------|
| `_archive/ACCESSIBILITY_AGENT_pre-review-2026-04-09.md` | Pre-Review-Version des Accessibility Agent. | nein | ja — archivierte Vorgänger-Version | `agents/ACCESSIBILITY_AGENT.md` |
| `_archive/API_AGENT_pre-review-2026-04-09.md` | Pre-Review-Version des API Agent. | nein | ja | `agents/API_AGENT.md` |
| `_archive/SECURITY_AGENT_FINAL_pre-review-2026-04-09.md` | Pre-Review-Version des Security Agent. | nein | ja | `agents/SECURITY_AGENT_FINAL.md` |
| `_archive/TESTING_AGENT_pre-review-2026-04-09.md` | Pre-Review-Version des Testing Agent. | nein | ja | `agents/TESTING_AGENT.md` |

### docs/agents/_reviews/ (3)

| Datei | Aussage | Widerspruch | Veraltet | Dublette mit |
|-------|---------|------------|---------|-------------|
| `_reviews/meta-review-2026-04-10.md` | Fachliche Vollständigkeitsprüfung aller Agenten durch Opus. | nein | nein — Ausgangsbasis für spätere Kalibrierungen | — |
| `_reviews/summary.md` | Zusammenfassung des Meta-Reviews. | nein | nein | — |
| `_reviews/update-log.md` | Log der Agent-Updates nach Review. | nein | nein | — |

---

## docs/audit-reports/ (16)

*Alle Audit-Reports sind historische Score-Snapshots. Kein Widerspruch zu ADRs. Veralteter Inhalt = ja (historisch), aber absichtlich archiviert.*

| Datei | Aussage | Widerspruch | Veraltet | Dublette mit |
|-------|---------|------------|---------|-------------|
| `audit-reports/README.md` | Index der Audit-Reports. 3 Zeilen. | nein | nein | — |
| `audit-reports/2026-04-07-audit-report.md` | Score-Snapshot 2026-04-07. | nein | ja — historisch | — |
| `audit-reports/2026-04-08-audit-report.md` | Score-Snapshot 2026-04-08. | nein | ja — historisch | — |
| `audit-reports/2026-04-09-audit-report.md` | Score-Snapshot 2026-04-09. | nein | ja — historisch | — |
| `audit-reports/2026-04-20-audit-report.md` | Score-Snapshot 2026-04-20. | nein | ja — historisch | — |
| `audit-reports/2026-04-21-audit-report.md` | Score-Snapshot 2026-04-21. | nein | ja — historisch | — |
| `audit-reports/2026-04-22-audit-report.md` | Score-Snapshot 2026-04-22. | nein | ja — historisch | — |
| `audit-reports/2026-04-23-audit-report.md` | Score-Snapshot 2026-04-23. | nein | ja — historisch | — |
| `audit-reports/benchmark-2026-04-15-v7-analysis.md` | Benchmark-Analyse v7 (49 Repos). Aktive Referenz für Positionierung. | nein | nein | — |
| `audit-reports/checker-coverage-2026-04-15.md` | Coverage-Tabelle aller Checker-Regeln. Aktive Referenz. | nein | nein | — |
| `audit-reports/checker-gaps-2026-04-15.md` | Lücken-Analyse der Checker-Coverage. | nein | nein | — |
| `audit-reports/committee-agents-2026-04-17.md` | Committee-Review-Vorbereitung für Agent-Stack. | nein | nein | `docs/conference-intelligence-2026.md` (Entscheidungen extrahiert) |
| `audit-reports/committee-agents-results-2026-04-17.md` | Detailergebnisse des Agent-Stack-Reviews. | nein | nein | `docs/conference-intelligence-2026.md` |
| `audit-reports/committee-results-2026-04-15.md` | Committee-Ergebnisse April 2026. | nein | nein | `docs/committee-reviews/committee-final-2026-04-15-review.md` |
| `audit-reports/committee-review-2026-04-15.md` | Committee-Review-Zusammenfassung April 2026. | nein | nein | — |
| `audit-reports/committee-sprint13-prep.md` | Sprint-13-Vorbereitung mit F1–F5 Fragestellungen. | nein | nein | — |

---

## docs/committee-reviews/ (28)

*Committee-Reviews sind Prozess-Logs: Inputs (Fragen) + Outputs (Antworten) aus Multi-Modell-Reviews. Keiner widerspricht ADR-020–023 direkt, da sie vor den ADRs erstellt wurden. Veraltete Inhalte = ja wenn die Entscheidung inzwischen getroffen wurde.*

| Datei | Aussage | Widerspruch | Veraltet | Dublette mit |
|-------|---------|------------|---------|-------------|
| `committee-reviews/agent-checker-alignment-review.md` | Review zu Checker-Agenten-Ausrichtung. Entscheidung getroffen (in conference-intelligence-2026). | nein | ja — Entscheidung umgesetzt | `docs/conference-intelligence-2026.md` |
| `committee-reviews/agent-stack-review-review.md` | Review des Agent-Stacks April 2026. | nein | nein | — |
| `committee-reviews/audit-scoring-review.md` | Review des Scoring-Systems. | nein | nein | — |
| `committee-reviews/automated-testbench-review.md` | Review der automatisierten Testbench. | nein | nein | — |
| `committee-reviews/batch-fix-strategy-review.md` | Review der Batch-Fix-Strategie. | nein | nein | — |
| `committee-reviews/benchmark-analysis-review.md` | Review der Benchmark-Analyse. | nein | nein | `docs/audit-reports/benchmark-2026-04-15-v7-analysis.md` |
| `committee-reviews/claude-md-review.md` | Review von CLAUDE.md. | nein | ja — CLAUDE.md wurde aktualisiert | — |
| `committee-reviews/committee-final-2026-04-15-review.md` | Finale Zusammenfassung Committee April 2026. | nein | nein | — |
| `committee-reviews/compliance-architecture-review.md` | Review der Compliance-Architektur. | nein | nein | — |
| `committee-reviews/db-access-strategy-review.md` | Review der DB-Zugriffs-Strategie. | nein | nein | — |
| `committee-reviews/dogfooding-feedback-review.md` | Review des Dogfooding-Feedback-Prozesses. | nein | nein | — |
| `committee-reviews/fix-engine-review.md` | Review der Fix-Engine-Architektur. | nein | nein | — |
| `committee-reviews/fix-engine-strategy-review.md` | Review der Fix-Engine-Strategie. Entscheidung implementiert. | nein | ja — implementiert | — |
| `committee-reviews/input-automated-testbench.md` | Frage/Kontext-Dokument für Testbench-Review (Input ≠ Output). | nein | ja — Review-Session abgeschlossen | — |
| `committee-reviews/input-batch-fix-strategy.md` | Frage/Kontext-Dokument für Batch-Fix-Review. | nein | ja | — |
| `committee-reviews/input-benchmark-analysis.md` | Frage/Kontext-Dokument für Benchmark-Review. | nein | ja | — |
| `committee-reviews/input-compliance-architecture.md` | Frage/Kontext-Dokument für Compliance-Review. | nein | ja | — |
| `committee-reviews/input-db-access-strategy.md` | Frage/Kontext-Dokument für DB-Zugriffs-Review. | nein | ja | — |
| `committee-reviews/input-dogfooding-feedback-loop.md` | Frage/Kontext-Dokument für Dogfooding-Review. | nein | ja | — |
| `committee-reviews/input-fix-engine-strategy.md` | Frage/Kontext-Dokument für Fix-Engine-Review. | nein | ja | — |
| `committee-reviews/input-product-naming.md` | Frage/Kontext-Dokument für Product-Naming-Review. Namens-Entscheidung noch offen. | nein | nein | — |
| `committee-reviews/input-repo-map-review.md` | Frage/Kontext-Dokument für Repo-Map-Review. | nein | ja | — |
| `committee-reviews/prodify-concept-review.md` | Review des "Prodify"-Produkt-Konzepts, Runde 1. | nein | ja — Namens-Konzept abgelöst | — |
| `committee-reviews/prodify-round2-review.md` | Zweiter Round des Prodify-Reviews. | nein | ja — Pivot-Naming noch offen | — |
| `committee-reviews/product-naming-review.md` | Review der Produkt-Namenskandidaten. Entscheidung noch offen. | nein | nein | — |
| `committee-reviews/product-vision-guided-building-review.md` | Review der Guided-Building-Vision. Konsistent mit ADR-020-Richtung (Begleiter, Führung). | nein | nein | — |
| `committee-reviews/repo-map-review.md` | Review der Repo-Map-Architektur. | nein | nein | — |
| `committee-reviews/user-types-strategy-review.md` | Review der User-Typen-Strategie. Ergebnis floss in user-types-Dokument ein. | nein | nein | `docs/product/user-types-hobby-business-enterprise.md` |

---

## docs/features/ (1)

| Datei | Aussage | Widerspruch | Veraltet | Dublette mit |
|-------|---------|------------|---------|-------------|
| `features/status.md` | Konsolidierter Feature-Status (A/B/C/D) mit Schichten-Check; aktuell bis 2026-04-22. Kennt ADR-020-Schichten nicht, nutzt eigene Schichten-Terminologie. | teilweise — Schichten-Definition weicht von ADR-020 ab; kein Verweis auf Sechs-Schichten-Modell | nein — lebendes Dokument, benötigt ADR-020-Update | — |

---

## docs/inventory/ (4 — heutige Inventur)

| Datei | Aussage | Widerspruch | Veraltet | Dublette mit |
|-------|---------|------------|---------|-------------|
| `inventory/2026-04-23-vision-reactivation-inventory.md` | Inventur vom 23. April (vor ADR-020-Session); andere Kategorisierung. | nein | teilweise — Vor-ADR-020-Stand | `inventory/2026-04-27-bestandstabelle.md` — neuere Version |
| `inventory/2026-04-27-bestandstabelle.md` | Bestands-Tabelle aller Tabellen, Routes und Komponenten (heutige Inventur). | nein | nein | — |
| `inventory/2026-04-27-schichten-mapping.md` | Mapping jeder Bestands-Position zu ADR-020-Schichten. | nein | nein | — |
| `inventory/inventur-code-2026-04-27.md` | Empfehlungen (BEHALTEN/UMWIDMEN/WEGFALL/VERTIEFUNG) pro Bestands-Position. | nein | nein | — |

---

## docs/plans/ (19)

| Datei | Aussage | Widerspruch | Veraltet | Dublette mit |
|-------|---------|------------|---------|-------------|
| `plans/2026-03-07-superadmin-clients-design.md` | Design-Spec für Superadmin-Client-Verwaltung. Implementiert. | nein | ja — implementiert, März 2026 | `plans/2026-03-07-superadmin-clients.md` |
| `plans/2026-03-07-superadmin-clients.md` | Build-Plan für Superadmin. Implementiert. | nein | ja — implementiert | — |
| `plans/2026-03-07-workspace-redesign.md` | Build-Plan für Workspace-Redesign (Karten-Board-Konzept). Karten-Board ist im Wandel gemäß ADR-020. | teilweise — Karten-Board-Workspace widerspricht ADR-020-Projektboard-Konzept | ja — implementiert, aber konzeptuell überholt | — |
| `plans/2026-03-08-prompt-templates-design.md` | Design für Prompt-Templates-Feature. Implementiert. | nein | ja — implementiert | `plans/2026-03-08-prompt-templates.md` |
| `plans/2026-03-08-prompt-templates.md` | Build-Plan für Prompt-Templates. Implementiert. | nein | ja — implementiert | — |
| `plans/2026-03-08-ui-redesign.md` | UI-Redesign-Plan (Design-System-Unification). Implementiert. | nein | ja — implementiert | — |
| `plans/2026-03-09-smarte-projekte-design.md` | Design für Smarte-Projekte-Feature. Implementiert. | nein | ja — implementiert | `plans/2026-03-09-smarte-projekte.md` |
| `plans/2026-03-09-smarte-projekte.md` | Build-Plan für Smarte Projekte. Implementiert. | nein | ja — implementiert | — |
| `plans/2026-03-10-rag-foundation.md` | Build-Plan für RAG-Fundament (pgvector, Embeddings). Implementiert. | nein | ja — implementiert | — |
| `plans/2026-03-10-toro-public-chat-widget.md` | Build-Plan für öffentliches Chat-Widget. Implementiert. | nein | ja — implementiert | — |
| `plans/agents-spec.md` | Vollständige Spezifikation des Agenten-Systems. Implementiert; Agenten sind laut ADR-020-Inventur VERTIEFUNG NÖTIG. | nein | nein — Referenz bleibt gültig | — |
| `plans/ansatz-c-lh-finding-types.md` | Sprint-Plan für strukturierte Lighthouse-Finding-Typen (Metric/Opportunity/Diagnostic). Nächster Sprint. | nein | nein — aktueller offener Plan | — |
| `plans/echarts-artifacts.md` | Plan für ECharts-Artefakte. Implementiert. | nein | ja — implementiert | — |
| `plans/mcp-integrations-konzept.md` | Konzept für MCP-Integrationen. ADR-023 trifft jetzt Entscheidungen dazu: Pull-MCP ja, Push-MCP vertagt. | teilweise — Konzept behandelt MCP ohne Push/Pull-Unterscheidung; ADR-023 ist präziser | nein — noch offene Fragen | `plans/mcp-integrations-plan.md` |
| `plans/mcp-integrations-plan.md` | Detaillierter MCP-Integrationsplan. ADR-023 ersetzt und präzisiert diesen Plan. | teilweise — kein Push/Pull-Unterschied; ADR-023 trifft strategischere Position | nein | `plans/mcp-integrations-konzept.md` — DUP |
| `plans/perspectives-build.md` | Build-Plan für Perspectives-Feature. Implementiert; VERTIEFUNG NÖTIG laut ADR-020-Inventur. | nein | ja — implementiert | — |
| `plans/presentation-artifacts.md` | Plan für Präsentations-Artefakte (Reveal.js). Implementiert. | nein | ja — implementiert | — |
| `plans/tremor-migration.md` | Plan für Tremor-Chart-Migration. Implementiert. | nein | ja — implementiert | — |
| `plans/widget-katalog.md` | Katalog der Cockpit-Widgets mit Roadmap. ADR-020 nennt Cockpit als Projektboard. | teilweise — Widget-Framing ist "Cockpit", nicht "Projektboard"; ADR-020 benennt um | nein — aktive Roadmap | — |

---

## docs/product/ (17)

| Datei | Aussage | Widerspruch | Veraltet | Dublette mit |
|-------|---------|------------|---------|-------------|
| `product/architecture-navigation.md` | Beschreibt Tropen OS als KI-Betriebssystem mit Aufbau/Produktion-Modell, Hub-Konzept, Live-Systemen und n8n-Integration. Enthält Karten-Board-Workspace-Konzept. | ja — Hub, Live, Karten-Board-Workspace, n8n-as-Primary widersprechen ADR-020 (6 Schichten, Projektboard-als-Sicht, kein Hub-Konzept) und ADR-023 (n8n nicht als primäre Interface-Strategie) | ja — Pre-Pivot-Modell, März 2026 | `docs/tropen-os-architektur.md`, `product/architecture.md` |
| `product/architecture.md` | Beschreibt Phase-2-Architektur mit Department-Hierarchie, Karten-Board-Workspaces und Wissens-Hierarchie mit 8 Ebenen. | ja — Department-Hierarchie, Karten-Board, 8-Ebenen-Wissen widersprichen ADR-020 (6 Schichten, Solo-Focus, keine Departments) | ja — März-2026-Stand, vor Pivot | `docs/tropen-os-architektur.md` |
| `product/backup-dr.md` | Backup & Disaster-Recovery-Plan. Kein konzeptueller Bezug zu ADRs. | nein | nein | — |
| `product/feature-registry.md` | Detaillierte Feature-Dokumentation aller implementierten Features (Guided Workflows, Library etc.). Enthält Library-System-Beschreibung als aktives Feature. | teilweise — Library-System ist laut ADR-020-Inventur Wegfall-Kandidat, hier als aktiv dokumentiert | nein — aktuell gültige Feature-Beschreibung, aber nach ADR-020-Entscheidungen zu aktualisieren | — |
| `product/informationsarchitektur-v2.md` | Beschreibt 5-Entitäten-Modell (Projekt/Artefakt/Collection/Workspace/Wissen) mit Workspace-als-Sharing-Bereich. Workspace-Konzept weicht von ADR-020 ab. | teilweise — 5-Entitäten-Modell ≠ 6-Schichten-Modell; Collections nicht implementiert; Workspace-Semantik verschieden | ja — März-2026-Konzept, vor 6-Schichten-ADR | `docs/tropen-os-architektur.md` (andere Konzeptualisierung) |
| `product/jungle-order.md` | Dokumentiert Jungle-Order-Soft-Delete-System. Technische Referenz. | nein | nein | — |
| `product/meta-agenten.md` | Plan für Meta-Agenten-System. Enthält Agenten-Typen und Toro-Konzept. ADR-020-Inventur: Agents VERTIEFUNG NÖTIG. | nein — kein direkter Widerspruch | nein | — |
| `product/migrations.md` | Vollständige Migrations-Übersicht. Technische Referenz. | nein | nein | — |
| `product/onboarding.md` | Onboarding-Dokumentation. Kein konzeptueller Bezug zu ADRs. | nein | nein | — |
| `product/open-todos.md` | Liste offener Aufgaben. Kein konzeptueller Inhalt. | nein | teilweise — viele TODOs vor Pivot | — |
| `product/rag-architecture.md` | RAG-Architektur mit pgvector. Passt zu Projektwissen-Schicht ADR-020. | nein | nein | — |
| `product/roadmap-2026-q2.md` | Roadmap Q2/Q3 2026 als Production Readiness Guide für Vibe-Coder. Enthält drei Kern-Features (Audit, Fix-Prompt, Score-Tracking). Konsistent mit ADR-020-Richtung, kennt aber 6-Schichten-Modell noch nicht. | nein — Produkt-Richtung kompatibel | nein | — |
| `product/superadmin.md` | Superadmin-Dokumentation. Kein konzeptueller Bezug zu ADRs. | nein | nein | — |
| `product/toro-potential-scan.md` | Konzept: Toro als KMU-Berater der Automatisierungspotenziale zeigt. Zielgruppe KMU (nicht Solo-Entrepreneurs). | teilweise — KMU-Fokus weicht von ADR-020 (Solo-Entrepreneurs) ab; Automatisierungs-Berater-Rolle geht über Audit-Tool hinaus | ja — Konzept März 2026, vor Produktpivot | — |
| `product/user-story-idea-to-production.md` | 7-Phasen-Journey von der Idee zum Launch mit Toro als Begleiter. Sehr konsistent mit ADR-020-Vision (niedrige Reibung, Führung, Solo-Kontext). | nein — stark konsistent mit neuer Positionierung | nein | — |
| `product/user-types-hobby-business-enterprise.md` | Drei User-Typen (Hobby/Gründer/Business) mit unterschiedlichen Journeys. Business-Typ enthält Multi-Tenant-Features die laut ADR-020 für Solo deprioritiert sind. | teilweise — Business-Typ mit Enterprise-Features widerspricht Solo-Focus ADR-020 für MVP | nein — sinnvolle Zukunftsvision, aber MVP-Priorität klar auf Solo-Entrepreneur | — |

---

## docs/repo-map/ (1)

| Datei | Aussage | Widerspruch | Veraltet | Dublette mit |
|-------|---------|------------|---------|-------------|
| `repo-map/calibration-review.md` | Review der Repo-Map-Kalibrierung (Threshold, Scores). Technische Referenz. | nein | nein | — |

---

## docs/runbooks/ (3)

| Datei | Aussage | Widerspruch | Veraltet | Dublette mit |
|-------|---------|------------|---------|-------------|
| `runbooks/disaster-recovery.md` | DR-Runbook. Kein konzeptueller Bezug. | nein | nein | — |
| `runbooks/incident-response.md` | Incident-Response-Runbook. Kein konzeptueller Bezug. | nein | nein | — |
| `runbooks/rollback.md` | Rollback-Runbook. Kein konzeptueller Bezug. | nein | nein | — |

---

## docs/security/ (1)

| Datei | Aussage | Widerspruch | Veraltet | Dublette mit |
|-------|---------|------------|---------|-------------|
| `security/tenant-isolation-audit-2026-03-25.md` | Tenant-Isolation-Audit vom März 2026. Historischer Sicherheits-Befund. | nein | ja — historischer Stand, aber Sicherheits-Prinzipien bleiben gültig | — |

---

## docs/superpowers/ — Implementierungspläne (22 direkte Dateien + specs/)

*Alle Superpowers-Pläne sind abgeschlossene Implementierungs-Prompts. Sie beschreiben was zu bauen war — die meisten Features wurden seitdem gebaut. Kein direkter Widerspruch zu ADRs (sie beschreiben Implementierung, nicht Strategie). Veralteter Inhalt = ja für alle implementierten Pläne.*

| Datei | Aussage | Widerspruch | Veraltet | Dublette mit |
|-------|---------|------------|---------|-------------|
| `superpowers/chat-ui-konzept-v1.md` | Chat-UI-Konzept v1 mit Split-View und Action-Layer. Implementiert. | nein | ja — implementiert | — |
| `superpowers/n8n-integration-konzept.md` | Konzept für n8n-Integration (Toro generiert Workflows). ADR-023 positioniert n8n nicht als Kern-Interface. | teilweise — n8n als primary Automation-Layer weicht von ADR-023-Interface-Strategie ab | nein — noch offen, aber ADR-023 gibt neue Rahmenbedingungen | `docs/superpowers/windmill-integration-konzept.md` |
| `superpowers/windmill-integration-konzept.md` | Konzept für Windmill-Integration (ersetzt n8n-Overlegung). | nein | nein | `superpowers/n8n-integration-konzept.md` — DUP, konkurrierend |
| `superpowers/plans/2026-03-10-paket-system.md` | Build-Plan für Package-System. Implementiert. Packages sind laut ADR-020-Inventur WEGFALL. | nein | ja — implementiert, konzeptuell abgelöst | — |
| `superpowers/plans/2026-03-11-design-system-nav-refactor.md` | Build-Plan für Design-System-Refactor. Implementiert. | nein | ja — implementiert | — |
| `superpowers/plans/2026-03-12-design-system-unification.md` | Build-Plan für Design-System-Unification. Implementiert. | nein | ja — implementiert | `superpowers/specs/2026-03-12-design-system-unification.md` — DUP |
| `superpowers/plans/2026-03-12-feed-feature.md` | Build-Plan für Feed-Feature. Implementiert; Feeds = Inbox-Schicht. | nein | ja — implementiert | — |
| `superpowers/plans/2026-03-12-phase2-a-db-foundation.md` | DB-Fundament Phase-2-Plan. Implementiert. | nein | ja — implementiert | — |
| `superpowers/plans/2026-03-12-phase2-b-projects-crud.md` | Projects-CRUD-Plan. Implementiert. | nein | ja — implementiert | — |
| `superpowers/plans/2026-03-14-feeds-rebuild.md` | Feeds-Rebuild-Plan. Implementiert. | nein | ja — implementiert | — |
| `superpowers/plans/2026-03-14-workspace-card-engine.md` | Workspace-Card-Engine-Plan (Karten-Board). Implementiert; Karten-Board ist per ADR-020 im Wandel. | teilweise — Karten-Board-Konzept wird durch ADR-020-Projektboard abgelöst | ja — implementiert, konzeptuell überholt | — |
| `superpowers/plans/2026-03-17-architect-review-d2-j2.md` | Architektur-Review Plan D2+J2. Historische Review. | nein | ja — historisch | — |
| `superpowers/plans/2026-03-17-capability-outcome-system.md` | Build-Plan für Capability/Outcome-System. Implementiert; laut ADR-020 WEGFALL. | nein | ja — implementiert, konzeptuell abgelöst | — |
| `superpowers/plans/2026-03-17-guided-workflows.md` | Build-Plan für Guided Workflows. Implementiert; BEHALTEN laut ADR-020. | nein | ja — implementiert | — |
| `superpowers/plans/2026-03-17-plan-d-chat-context.md` | Chat-Context-Plan. Implementiert. | nein | ja — implementiert | — |
| `superpowers/plans/2026-03-17-plan-e-transformations.md` | Transformations-Engine-Plan. Implementiert; laut ADR-020 VERTIEFUNG NÖTIG. | nein | ja — implementiert | — |
| `superpowers/plans/2026-03-17-plan-f-ui.md` | UI-Plan (Workspace-UI). Implementiert. | nein | ja — implementiert | — |
| `superpowers/plans/2026-03-19-ai-sdk-migration.md` | AI-SDK-Migrations-Plan. Implementiert. | nein | ja — implementiert | — |
| `superpowers/plans/2026-03-19-plan-home-seite.md` | Home-Seite-Plan. Implementiert. | nein | ja — implementiert | — |
| `superpowers/plans/2026-03-19-plan-k-shared-chats.md` | Shared-Chats-Plan. Implementiert. | nein | ja — implementiert | — |
| `superpowers/plans/2026-03-20-plan-j1-feeds-autonom.md` | Feeds-Autonom-Plan. Implementiert. | nein | ja — implementiert | — |
| `superpowers/plans/2026-03-20-plan-l-chat-interactions.md` | Chat-Interactions-Plan (Perspectives, Parallel-Tabs). Implementiert. | nein | ja — implementiert | — |
| `superpowers/plans/2026-03-26-audit-fixes-pagination-ssrf-dataview.md` | Audit-Fix-Plan. Implementiert. | nein | ja — implementiert | — |
| `superpowers/plans/2026-04-22-deep-fix-button.md` | Deep-Fix-Button-Plan. Implementiert (2026-04-22). | nein | ja — implementiert | — |
| `superpowers/plans/prompt-01-library.md` | Build-Plan für Library-System. Implementiert; Library laut ADR-020-Inventur WEGFALL. | nein | ja — implementiert, konzeptuell abgelöst | — |
| `superpowers/specs/2026-03-12-design-system-unification.md` | Spec für Design-System-Unification. | nein | ja — implementiert | `superpowers/plans/2026-03-12-design-system-unification.md` — DUP |
| `superpowers/specs/2026-03-26-mcp-integrations-design.md` | MCP-Integrations-Design-Spec. ADR-023 gibt jetzt klare Position: Pull-MCP ja, Push-MCP vertagt. | teilweise — Spec behandelt MCP ohne Push/Pull-Trennung | nein — noch offene Fragen, aber ADR-023 ist präziser | `docs/plans/mcp-integrations-plan.md` |

---

## docs/webapp-manifest/ (7)

| Datei | Aussage | Widerspruch | Veraltet | Dublette mit |
|-------|---------|------------|---------|-------------|
| `webapp-manifest/audit-report-2026-03-13.md` | Audit-Report März 2026. Historisch. | nein | ja — historisch | — |
| `webapp-manifest/audit-report-2026-03-15.md` | Audit-Report März 2026. Historisch. | nein | ja — historisch | `audit-reports/` (neuere Reports) |
| `webapp-manifest/audit-report-2026-03-26.md` | Audit-Report März 2026. Historisch. | nein | ja — historisch | — |
| `webapp-manifest/audit-report-2026-03-30.md` | Audit-Report März 2026. Historisch. | nein | ja — historisch | — |
| `webapp-manifest/audit-system.md` | Gewichtetes Scoring-System (0–5 × Gewicht, 25 Kategorien). Aktive Referenz; Gewichte wurden per Committee kalibriert. | nein | nein | — |
| `webapp-manifest/engineering-standard.md` | 25 Kategorien mit konkreten Regeln und Warnsignalen. Aktive Referenz; Kern des Audit-Systems. | nein | nein | — |
| `webapp-manifest/manifesto.md` | 10 Kernprinzipien von Tropen OS. Enthält noch B2B-Konzepte (Org-Wissen, Community). | teilweise — "Community" und mehrstufige Wissensbasis widersprechen ADR-020-Solo-Fokus nicht grundlegend, sind aber nicht mehr Kern | nein — Prinzipien bleiben gültig | — |

---

## test-results/ (1)

| Datei | Aussage | Widerspruch | Veraltet | Dublette mit |
|-------|---------|------------|---------|-------------|
| `test-results/README.md` | Placeholder-README für test-results-Verzeichnis. | nein | nein | — |

---

## Auswertung

### Widerspruch-Statistik

| Wertung | Anzahl | % |
|---------|--------|---|
| nein | 130 | 70% |
| teilweise | 44 | 24% |
| ja | 11 | 6% |

### Härteste Widersprüche (ja)

| Dokument | Kern-Konflikt mit |
|----------|------------------|
| `docs/tropen-os-architektur.md` | ADR-020: Department-Hierarchie, Hub, B2B-Multi-Tenant ≠ 6 Schichten + Solo |
| `product/architecture.md` | ADR-020: 8-Ebenen-Wissen, Karten-Board, Dept-Hierarchie |
| `product/architecture-navigation.md` | ADR-020 + ADR-023: Hub-Konzept, Live-Systeme, n8n-as-Interface |

### Häufigste Teilwidersprüche

| Cluster | Konflikt-Typ |
|---------|-------------|
| MCP-Dokumente (4 Dateien) | ADR-023: kein Push/Pull-Unterschied |
| Library/Capabilities-Pläne (4 Dateien) | ADR-020: Library hat keinen Schichten-Fit |
| B2B-KMU-Konzepte (3 Dateien) | ADR-020: Solo-Entrepreneur-Fokus |
| Karten-Board-Konzepte (3 Dateien) | ADR-020: Projektboard ≠ Karten-Board |

### Veralteter-Inhalt-Statistik

| Wertung | Anzahl | % |
|---------|--------|---|
| nein | 89 | 48% |
| ja | 96 | 52% |

*Hauptgrund für "ja": implementierte Superpowers-Pläne (22), historische Audit-Reports (12), abgeschlossene Committee-Review-Input-Dokumente (8), Pre-Pivot-Architektur-Dokumente (4).*

### Dubletten-Cluster (handlungsrelevant)

| Cluster | Dateien | Empfehlung |
|---------|---------|-----------|
| ADR-006-Kollision behoben | `adr/006b-windmill-statt-n8n-superseded-by-018.md` (umbenannt) | ✅ Erledigt — Superseded by `adr/018-windmill-statt-n8n.md` |
| Architektur-Trilogie | `tropen-os-architektur.md`, `product/architecture.md`, `product/architecture-navigation.md` | Alle drei als „Superseded by ADR-020" markieren |
| Implementierte Superpowers-Pläne | 22 Dateien | In `docs/superpowers/plans/_archive/` verschieben |
| Historische Audit-Reports (webapp-manifest) | 4 Dateien | In `docs/audit-reports/` konsolidieren |
| n8n vs. Windmill Konzepte | 2 Dateien | Nach ADR-023-Kontext klären |
