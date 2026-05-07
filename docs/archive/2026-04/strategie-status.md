# Status-Bericht für Strategie-Sparring
**Stand:** 2026-04-29 | **Erstellt von:** Claude Code aus Repo-Lektüre

---

## 1. Stand des Produkts

Tropen OS (Arbeitsname; Prodify war ein Namens-Vorschlag der Komitee-Diskussion vom 2026-04-13, nicht beschlossen) ist eine Production-Readiness-Plattform für Vibe-Coded Apps: ein automatisiertes Audit-System mit 242 Regeln, Fix-Prompt-Export und Score-Tracking-Dashboard, positioniert als "dritte Kategorie" zwischen Vibe-Coding-Tools (Lovable, Cursor) und klassischen Quality-Tools (SonarQube). Aktueller Audit-Score des eigenen Repos: **93.6% — Production Grade** (Report 2026-04-28; README zeigt noch 96.4% vom 2026-04-23 — veraltet). Phase: **Pre-Beta** — technische Infrastruktur fertig, keine zahlenden Kunden, Beta-Waitlist existiert aber noch keine User eingeladen (bewusste Entscheidung: erst stabiler Tab-Sprint-Stand, dann Outreach).

---

## 2. Was läuft gerade aktiv

- **Tab-Sprint (ADR-025, accepted 2026-04-29):** Umbau der Audit-Seite von Tier-basierter auf Domain-basierte Architektur (6 Domains: Code-Qualität / Performance / Sicherheit / Accessibility / DSGVO / KI-Act). 5 Phasen, ~3–4 Wochen Solo-Founder-Arbeit. Heute gestartet.
  - Phase 1 aktiv: Domain-Mapping AuditEngine + 10 DB-Security-Rules (~3–5 PT)
- **Pivot-Stabilisierung:** Drei Pivots in 48h (Marken-Pivot, Tabellen-Welt, Tab-Sprint) haben Pivot-Disziplin-Regeln erzwungen — neue Pflicht-Regel in CLAUDE.md + Roadmap seit heute: ADR + 24h Wartezeit vor jedem Pivot, kein Sprint-Abbruch zwischen Phasen.
- **Frisch abgeschlossen (letzte 2 Tage):** BP-Design-1 (Marken-Pivot Schiefer-Limette), Audit-Tabellen-Welt (Sentry-Stil), Bug-Fix-Runde Tabellen-Welt.
- **Verschoben:** BP8–BP13 (Bulk-Download, Cockpit→Projektboard, UX-Polish, Fix-Prompt-Top-5, Self-Audit-Roundtrip) warten auf Tab-Sprint-Abschluss.

---

## 3. Roadmap-Stand

**Diesen Monat (Mai):** Tab-Sprint 5 Phasen — Domain-Mapping, 6-Tab-Struktur, Compliance-Inputs (Variante D), Lighthouse-Integration im Performance-Tab, Doku + Self-Audit-Roundtrip.

**Nächsten Monat (Juni):** L2 Vibe-Coder-Outreach (3 Gespräche in 1 Woche), BP8/BP9/BP10, "Scan your Lovable App" Landing Page, Tool-Empfehlungen im Dashboard, Template-Score-Content (ShipFast etc.), BFSG-SEO-Artikel.

**Backlog (Titel):** Credits-Modell + Pricing Page · Erste 10 Beta-User · Lovable Community Listening · Bußgeld-Cases als Onboarding-Content · VS Code Extension (Q3) · MCP-Server für Cursor (Q3) · GitHub-Repo-Connect via OAuth (Q3) · Product Hunt Launch · Snyk-Integration (BP14) · axe-core-Integration (BP15) · Agency/Freelancer-Tier (Q4)

---

## 4. ADR-Übersicht

| Datei | Inhalt | Datum | Status |
|-------|--------|-------|--------|
| 001 | Next.js App Router als Web-Framework | 2026-02 | Accepted |
| 002 | Vercel als Deployment-Plattform | 2026-02 | Accepted |
| 003 | Supabase als Auth- und DB-Plattform | 2026-03-07 | Accepted |
| 004 | Drizzle ORM nur für Schema, keine Queries | 2026-03-15 | Accepted |
| 005 | APPEND ONLY Tabellen (Audit-Trail) | 2026-03-15 | Accepted |
| 006 | Vercel AI SDK als LLM-Abstraktionsschicht | 2026-03 | Accepted |
| 007 | Rollen-Architektur (Superadmin/OrgRole/WorkspaceRole) | 2026-03 | Accepted |
| 008 | Chart-Bibliotheken (Tremor + ECharts CDN) | 2026-03 | Accepted |
| 009 | Artifact-System — iFrame-Sandbox + Sucrase | 2026-03 | Accepted |
| 010 | Anthropic SDK direkt statt Dify | 2026-03-17 | Accepted |
| 011 | Conversations-Tabelle für Workspace-Chats | 2026-03-18 | Accepted |
| 012 | Feeds-Pipeline-Architektur | 2026-03-18 | Accepted |
| 013 | Library-System (Capability/Outcome/Role/Skill) | 2026-03-19 | Accepted |
| 014 | Smart Model Router — Multi-Provider | 2026-03-20 | **Proposed** |
| 015 | Perspectives — parallele KI-Antworten | 2026-03-22 | Accepted |
| 016 | Web Search via Anthropic Server Tool | 2026-03-24 | Accepted |
| 017 | i18n aufgeschoben, Grundstruktur vorbereitet | 2026-03-26 | Accepted |
| 018 | Windmill statt n8n als Workflow-Engine | 2026-03-26 | Accepted (Phase 2 — nicht aktiv im MVP) |
| 019 | Next.js 16 → 15 Downgrade (Turbopack NFT-Bug) | 2026-04-10 | Accepted |
| 020 | Sechs-Schichten-Wissens-Architektur | 2026-04-27 | **Proposed** |
| 021 | Prompt-Veredler-Architektur | 2026-04-27 | **Proposed** |
| 022 | Markdown-Format + Obsidian-Brücke | 2026-04-27 | **Proposed** |
| 023 | Schnittstellen-Strategie (CLI-First + Pull-MCP) | 2026-04-27 | **Proposed** |
| 024 | Marken-Pivot (Coach-Position + Schiefer-Limette) | 2026-04-28 | Accepted |
| 025 | Strategische Tab-Architektur + Compliance-Strategie | 2026-04-29 | Accepted |

---

## 5. Strategie-Doks-Inventar

`docs/strategie/` existiert erst seit heute (dieser Report ist die erste Datei). Strategie-relevante Dokumente sind über mehrere Verzeichnisse verteilt:

| Pfad | Zweck |
|------|-------|
| `docs/product/roadmap-2026-q2.md` | **Normative Quelle** — was gebaut wird + Sprint-Status (aktualisiert 2026-04-29) |
| `docs/product/marken-brief.md` | Marken-Position, Stimme, Farbwelt, Pflicht-Tags — normativ, Änderung nur per ADR |
| `docs/synthese/tag4-master-synthese.md` | 3-Tage-Inventur-Ergebnis (2026-04-27): Drei-Visionen-Auflösung, Veredler-Substanz-Analyse, 5 Empfehlungskategorien |
| `docs/synthese/anhang-a-roadmap.md` | Sprint-Plan mit Aufwand-Schätzungen |
| `docs/synthese/anhang-b-migrations.md` | DB-Migrations-Block für Sprint 1+ |
| `docs/synthese/anhang-c-kill-und-einfrier-liste.md` | Kill- und Einfrier-Liste mit Wieder-Anschalten-Bedingungen |
| `docs/phase2-plans.md` | Detaillierte Build-Pläne A–L (KMU-Phase, eingefroren) |
| `docs/phase-2-vision.md` | KMU-Phase-2-Konzept (Backup, 5 Pfeiler — nicht aktive Richtung) |
| `docs/conference-intelligence-2026.md` | Strategische Entscheidungen + /ultrareview-Vergleich (2026-04-17) |

---

## 6. Bekannte offene Strategie-Fragen

- **Produktname offen:** Tropen OS ist Platzhalter. Prodify wurde am 2026-04-13 als Idee diskutiert (nicht beschlossen). Domain `prodify.dev` nicht gesichert, Markenrecherche nicht gestartet. Naming-Sprint erforderlich vor Beta-Outreach.
- **ADR-020–023 alle Proposed:** Die Phase-2-Architektur (Sechs-Schichten-Wissen, Prompt-Veredler, Markdown-Format, Interface-Strategie) hat 4 ADRs im "Proposed"-Status — keine bindende Entscheidung getroffen.
- **ADR-014 (Smart Model Router) Proposed:** Steht seit 2026-03-20 auf "Vorgeschlagen" — nie accepted.
- **3 Validierungs-Lücken (tag4-synthese 2026-04-27):** Keine Nutzungsdaten von echten Vibe-Codern, keine Vibe-Coder-Gespräche vor Sprint 1, kein Pricing-Test — sollen vor Sprint 2 geschlossen sein.
- **Plan L (MCP-Integrationen):** Design fertig seit 2026-03-27, wartet auf OAuth-Keys — seither keine Bewegung.
- **Pricing-Seite nicht live:** Credits-Modell (Free / €39 / €199) definiert in Roadmap, aber keine Pricing Page gebaut.
- **Tab-Sprint Q2-Ziel-Verschiebung:** MVP-Launch-Datum von Mitte Q2 auf Ende Q2/Anfang Q3 verschoben (explizit in Roadmap dokumentiert 2026-04-29) — Marketing-Versprechen noch nicht angepasst.

---

## 7. Bekannte Inkonsistenzen

- **Score-Divergenz:** README zeigt 96.4% (2026-04-23), CLAUDE.md + neuester Report zeigen 93.6% (2026-04-28). README ist 6 Tage veraltet. Wahrheit: 93.6%.
- **ADR-Nummern-Chaos:** Dateinamen (001–025) stimmen nicht mit internen ADR-Nummern überein. Z.B. Datei `001-nextjs-app-router.md` hat Kopfzeile `ADR-007`. Mehrere interne Nummern sind doppelt vergeben (ADR-001, ADR-002, ADR-003, ADR-004, ADR-007, ADR-008, ADR-009). Für externe Leser nicht navigierbar.
- **Produktname:** README und CLAUDE.md verwenden "Tropen OS" (korrekt — Platzhalter). Roadmap wurde korrigiert (Prodify als Idee markiert, nicht als Entscheidung). Kein Naming-Beschluss getroffen — Naming-Sprint offen.
- **CLAUDE.md Nav-Sektion:** Beschreibt die alte KMU-Sidebar-Struktur (Chat, Workspaces, Feeds, Agenten) und die neue (Dashboard → Audit) parallel, ohne klare "altes ist eingefroren"-Markierung.
- **Phase-2-Plans.md vs. Roadmap:** `phase2-plans.md` beschreibt Pläne A–L als aktiv ("Phase 2 vollständig abgeschlossen"), während die Roadmap explizit Chat/Workspaces/Feeds/Agenten einfriert. Kein Status-Marker in phase2-plans.md.

---

## 8. Was eine externe Sparring-Quelle wahrscheinlich nicht weiß

- **Drei Pivots in 48h (2026-04-27–29):** Marken-Pivot (Größe C), Tabellen-Welt-Umbau (Sentry-Stil), Tab-Sprint (ADR-025). Das hat Sprint 1 (BP8–BP13) um ~3–4 Wochen verschoben und neue Pivot-Disziplin-Regeln erzeugt — steht so nicht in README oder CLAUDE.md summary.
- **ADR-025 ist 0 Tage alt:** Accepted heute. Der Tab-Sprint ist damit strategisch bestätigt, aber kein einziger Build wurde noch geliefert.
- **Fix-Engine deaktiviert:** Die Fix-Engine (Konsens-Fix, 4-Modell-Komitee für Fixes) wurde in Tag 4.5 deaktiviert ("Fix-Engine deaktiviert" in tag4-pivot.md). README beschreibt sie noch als aktives Feature.
- **113+ Migrationen, große Legacy-Codebase:** Hinter den drei MVP-Features steckt eine vollständige KMU-Plattform (Workspaces, Feeds, Agents, Perspectives, Library-System, Cockpit-Widgets). Alles eingefroren aber nicht entfernt — Wartungslast wird mit dem Produkt wachsen.
- **~1.840 Zeilen Veredler-Substanz:** ADRs 020–023 (alle "Proposed") beschreiben eine Phase-2-Vision um existierenden Resolver-Code herum. Die Entscheidung ob das je gebaut wird, ist nicht getroffen.
- **Benchmark-Evidenz läuft:** 49 öffentliche Repos gescannt (v8, 2026-04-17). Lovable-Apps Avg 80.2%, Bolt 71.0%, eigenes Produkt 93.6%. Diese Daten existieren, sind aber noch nicht als GTM-Material aufbereitet.
- **0 echte User:** Die Beta-Infrastruktur (Waitlist, Feedback, Onboarding) existiert vollständig — aber es wurde noch kein einziger User eingeladen. Alle "Kunden"-Daten sind hypothetisch.
