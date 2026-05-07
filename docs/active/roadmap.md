---
status: active
updated: 2026-05-07
review_by: 2026-08-07
supersedes: []
---

# Tropen OS → [Neuer Name] — Roadmap Q2/Q3 2026
## Production Readiness Guide für Vibe-Coders

> **Status:** Normative Roadmap für Tropen OS. Diese Datei ist die Single Source of Truth für Bauphasen, Sprint-Status und strategische Klärungen.
> **Stand:** 2026-04-30
> **Pflege:** Bei jedem Sprint-Abschluss aktualisieren. Bei jedem Pivot Phasen-Plan prüfen.

> **Letzte Aktualisierung:** 2026-05-04 (ADR-027 Schritte 1-4 + Score-Refactor + Design-Sprint + Phase 2.5)
> **Vorherige Aktualisierung:** 2026-04-29 (Tab-Sprint Domain-Architektur, ADR-025)
> **Basis:** 5 Komitee-Reviews (€4.80 Gesamtkosten), Tiefe Wettbewerbsanalyse
> **Positionierung:** "Dein Code, in Production-Reife." — Coach-Position (ADR-024)
> **Produktname:** Tropen OS (Platzhalter) — Prodify wurde am 2026-04-13 als Idee diskutiert, nicht beschlossen. Naming-Sprint + Domain-Sicherung offen.
> **Tab-Sprint:** ADR-025 accepted 2026-04-29. Sprint 1 (BP8–BP13) verschoben hinter Tab-Sprint.

## Bauphasen-Plan (Stand 2026-04-30)

> Reihenfolge der Produkt-Bauphasen. Pivots in dieser Reihenfolge erfordern ADR + 24h-Wartezeit.

**Phase 1 — Audit-Seite stabilisieren** ← AKTIV
- Tab-Sprint (ADR-025) ✅ abgeschlossen 2026-04-29
- DB-Sicherheit-Erweiterung (10 Rules) ✅ abgeschlossen
- BP8 — Quick-Wins-Box global + Fix-Session-Bundle ✅ 2026-04-30
- BP12 — durch BP8 obsolet
- BP13 — Sprint-Abschluss (Cleanup, Docs, Commit) ⏳ folgt
- BP-Audit-Coverage-1 — nach BP13 ⏳
- BP-E2E-Hygiene-1 — nach BP-Audit-Coverage-1 ⏳

**Phase 2 — Audit-Design verbessern + Aufräumen**
- Visueller Sweep nach BP8
- Audit-Seite-Polish (aus BP8-Sweep 2026-04-30):
  - Fix-Session-Header-Text "Einzelne Fix-Prompts findest du in den Findings unten" — streichen oder umformulieren (schwächt Coach-Autorität)
  - Performance-Findings spezifizieren — 4× identische "Core Web Vitals außerhalb Zielbereich" durch konkrete Lighthouse-Daten ersetzen
  - Score-Drift erklären — "-1.9%" mit Coach-Stimme begründen ("Vor 18h: 93.0% — X neue Findings im Y-Tab")
  - Findings-Tabellen-Sortierung prüfen — Default-Sortierregel klarstellen (Severity → Score-Gain)
- 820 Lint-Warnings-Welle (Code-Hygiene)
- Mobile-Verhalten 7 Tabs prüfen
- BP11 — UX-Polish (Items vor Start schärfen)

**Phase 2.5 — Validierung der Audit-Engine** ← NEU, AKTIV

Bevor weitere Polish-Iterationen stattfinden, wird die Audit-Engine mit echten Daten validiert. Ohne Validierung wäre jeder weitere Polish-Schritt Lippenstift auf möglicherweise schiefen Daten.

- **Self-Dogfooding der eigenen Findings** — die ~183 Code-Qualität-Findings und weitere offene Findings systematisch durcharbeiten. Pro Finding klären: ist das ein echter Befund? Severity korrekt? Fix-Prompt nützlich? Bei Bedarf: Checker direkt korrigieren oder als unklarer Fall sammeln.
- **Fremd-Repo-Scan-Erweiterung** — bestehenden 49-Repo-Benchmark erweitern. Mehr Vibe-Coder-Stack-Repos (Next.js + Supabase) testen. Top-20 häufigste Findings über alle Benchmark-Repos identifizieren — diese Rules brauchen die beste Coach-Stimme.
- **Erkenntnisse zurück in Audit-Engine — Killer-Kriterien-Implementation** (ADR-027, 2026-05-04)
  - Marken-Brief Section 28 ✅ 2026-05-04
  - AST-Detektoren (Secrets/SQL/Auth/CORS/Build) ✅ 2026-05-04
  - Dependency-Scanner ✅ 2026-05-04
  - Config-Analyzer (DB-SSL/Dev-Secrets/HTTPS) ✅ 2026-05-04
  - Score-Architektur-Refactor ✅ 2026-05-04
  - Compliance-Domänen-Architektur ✅ 2026-05-05 — 9 Domänen, 5 umbenannte Profile, Default-Tabelle, Marken-Brief Section 28.5/28.6 (ADR-027 Update)
  - ✅ **Sprint 5: Profil-Onboarding** (2026-05-05) — scan_project_profiles Migration + API + getDomainActivation + Modal/Wizard UI + AuditActions-Integration
  - ✅ **Sprint 6a: UI-Pivot Audit-Detail** (2026-05-05) — ScoreBar Killer-primär, GlobalQuickWinsBar entfernt, FilterChips Multi-Select dynamisch, drei Sektionen (Stopper/Empfohlen/Polish)
  - ✅ **Sprint 6b₁: Compliance-Blöcke** (2026-05-05) — DSGVO/KI-Act Fragen + Lighthouse-URL wiederhergestellt
  - ✅ **Sprint 6b₂: Liste + Verbinden + Cleanup** (2026-05-05) — KillerStatusBadge, Projekteliste Killer-primär, Verbinden-Maske schlank, Tabs gelöscht. Schritt 6 abgeschlossen.
  - ✅ Schritt 7: Settings-Profil-Änderbarkeit (2026-05-05) — ProfileDisplayBar + Modal edit-mode + activeProfile prop-chain
  - ✅ Schritt 8: Coach-Wording (Sprint 8a + 8b) — 42 Rules, limitation-Feld
  - ✅ Schritt 9: Domain-Detektoren (Sprint 9a + 9b + 9c) — Foundation, OSS/Marketing/Plattform/Infra, Compliance-Fragen
  - **ADR-027 vollständig implementiert (Schritte 1–11) ✅ 2026-05-05**
  - ✅ Polish-Sprint 9-Polish-1 (2026-05-05) — Hybrid-Badge (🟡/🟢/🛑), Auto-Skip Info-Block, 0-Dateien-Stale-Data-Fix
  - ✅ Polish-Sprint 9-Polish-2 (2026-05-05) — Pattern-Cluster (Findings by ruleId), KI-Optik raus (Border-Strich statt blauer Hintergrund), Aufwand-Klassen (Quick Win/Mittel/Größer)
  - ✅ Polish-Sprint 9-Polish-3 (2026-05-05) — Score-Header 60/40 ("Veröffentlichungs-Check" + "Was wir von dir brauchen"), Mini-Status mit Scroll-Anchors, Compliance-Blöcke weißer Hintergrund, Doppel-Icon-Fix
  - 🟡 Beta-Vorbereitung als nächste Phase
  - ⊘ Schritt 6–8: UI-Pivot / Settings / Coach-Wording
  - ⊘ Schritt 9: Domain-Detektoren (DSGVO-Scanner, OSS-License-Scanner, LAZY-Detection)

⚠ **Strategische Klärung vor Phase 3** — Onboarding-Modus und Projektseite-Definition werden nach Phase 2.5 angegangen, nicht parallel.

**Phase 3 — Onboarding + Projektseite konzipieren**
- Onboarding-Flow durchdenken
- "Projektseite" konzeptionell schärfen
- Verbindung zu BP10 (Cockpit → Projektboard) klären

⚠ **Strategische Klärung vor Phase 4** — siehe Klärungen-Abschnitt

**Phase 4 — Chat + weitere alte/neue Komponenten**
- Chat-Komponente prüfen
- Workspaces, Feeds, Agents, Perspectives, Library-System: re-aktivieren / löschen / selektiv?
- ADRs 020-023 entscheiden (alle "Proposed" seit 2026-04-27)

**Geparkt:** Business-Plan-Logik (Pricing, Kundenmodell — wer zahlt was, wann, wo)

---

## Strategische Klärungen vor Phasen-Übergängen

> Diese Punkte müssen geklärt sein, bevor die nächste Phase startet.
> Sparring-Sessions / ADRs notwendig.

### Vor Phase 3 (Onboarding + Projektseite)

| Punkt | Beschreibung |
|-------|--------------|
| Onboarding-Modus | Audit-Modus (kurz, einfach) oder Build-Modus (Interview, Konventionen-Setup, längerer Funnel)? |
| Projektseite-Definition | "Audit-Cockpit" oder "Project Hub mit Konventionen, Wissensbasis, Chat-History"? |
| BP10-Integration | Wird BP10 Teil von Phase 3 oder separater Sprint? |
| Repo-Konventionen-Datei | `.tropen-conventions.json` als Tropen-OS-eigene Single-Source-of-Truth? |

### Vor Phase 4 (Komponenten)

| Punkt | Beschreibung |
|-------|--------------|
| Eingefrorene KMU-Substanz | 113+ Migrationen, vollständige Plattform unter MVP. Re-aktivieren / löschen / selektiv? |
| ADRs 020-023 | Alle "Proposed" seit 2026-04-27. Phase-2-Architektur strukturell offen. |
| Live "Prodify" im Nav-Logo | Code rendert Platzhalter, Doku sagt "Idee". Drift sichtbar bei Demo. |

---

## Sequenz-Constraints

> Reihenfolge-Regeln, die nicht verhandelbar sind.

1. **Naming-Sprint vor Beta-Onboarding** — sonst sieht User "Prodify", User-Doku sagt "Tropen OS"
2. **Strategische Klärung vor Phase 3** — sonst falscher Onboarding-Modus gebaut
3. **Strategische Klärung vor Phase 4** — sonst falsche KMU-Substanz-Behandlung
4. **Visueller Sweep nach jedem Sprint-Abschluss** — Pivot-Disziplin-Regel CLAUDE.md
5. **L2-Outreach (3 Vibe-Coder-Calls) vor großen Architektur-Entscheidungen** — Vibe-Coder-Realität validieren
6. **Ansatz C (Lighthouse Finding-Typen) klären vor Beta-Einladungen**
7. **`NEXT_PUBLIC_FIX_ENGINE_ENABLED=false` in `.env.local` setzen vor Beta-Einladungen** ✅ bereits gesetzt
8. **Validierung vor Polish-Sprint-B** — Sprint-B (Findings-Gruppierung, Titel-Übersetzung, Responsive) wird erst nach Phase 2.5 gestartet. Ohne Validierungs-Daten würden Übersetzungen im Vakuum geschehen.
9. **Onboarding-Komplex vor Beta klären** — Onboarding-Modus → Regeln-Export-Position → Deep-Review-Architektur (in dieser Reihenfolge — alle drei zusammen, nicht einzeln)
10. **Checker-FP-Behandlung für Stub-Routes klären vor Beta** — 410-Only-Routes triggern Auth-Checker ohne echtes Risiko. Optionen: A (Checker-Fix), B (UI-Markierung), C (Hybrid). Empfehlung: B als Coach-Feature. Details: Backlog "P4-Pattern für 410-Only-Routes".
10. **Externe Marketing-Materialien auf Korb/Türkis-Migration prüfen vor Beta** — Pitch-Decks, Social-Media-Profile, Domain-Recherche (Limette war Sekundärfarbe bis 2026-05-04)

---

## ⚠️ Pivot-Disziplin (Stand 2026-04-29)

In den Tagen vom 27.-29. April 2026 sind drei substantielle Pivots passiert:
1. Marken-Pivot Größe C (Schiefer-Limette, Coach-Position)
2. Audit-Tabellen-Welt-Umbau (Sentry-Stil)
3. Tab-Sprint Domain-Architektur (ADR-025)

Jeder Pivot war für sich legitim. Die Häufigkeit war problematisch — mehrere
Hand-Overs ("tsc + lint grün") versteckten reale Bugs, weil zwischen den Pivots
nicht stabilisiert wurde.

**Disziplin-Regel ab 2026-04-29:**

1. **Strategische Pivots brauchen ADR + 24h Wartezeit** — kein Pivot mehr ohne formales ADR.
2. **Build-Prompts werden nicht mitten im Sprint umgeschrieben** — außer bei Bugs.
3. **Sprint-Reihenfolge bleibt stabil bis Sprint-Abschluss** — keine Zwischenarbeit zwischen Phasen.
4. **"tsc + lint grün" ist kein Funktionalitäts-Nachweis** — visueller Sweep nach jedem Sprint.
5. **Self-Audit-Score validiert Code, nicht Produkt** — ergänzt, ersetzt nicht visuelle Validation.

---

## Positionierung

### Was wir SIND

Eine dritte Kategorie neben Vibe-Coding-Tools und Quality-Tools:
**Production Readiness Guide** — der Übergang zwischen "ich habe etwas gebaut"
und "mein Produkt ist bereit für echte User".

### One-Liner

> "Von der Idee zum production-reifen Produkt — mit EU-Compliance."

### Elevator Pitch

> "Du hast mit Cursor oder Lovable etwas gebaut — aber weißt du ob es
> wirklich ready für echte Nutzer ist? Wir sagen dir: deine App verletzt
> DSGVO hier, hat eine Security-Lücke dort, und dein Barrierefreiheits-
> Score liegt bei 40%. Nicht als Warnung die du ignorierst — sondern als
> konkreter Aufgaben-Plan den du deiner KI übergibst."

### Abgrenzung

| vs. | Unterschied |
|-----|-------------|
| **Lovable** | Lovable baut deine App. Wir stellen sicher dass sie production-ready ist. Potenzieller Partner, nicht Konkurrent. |
| **SonarQube** | SonarQube liefert 400 Findings an einen Senior Dev. Wir liefern 5 priorisierte Aufgaben an einen Vibe-Coder. |
| **Copilot Review** | Copilot prüft den Commit. Wir begleiten die gesamte Reise. |
| **Aikido Security** | Aikido macht Security. Wir machen Production Readiness — Security ist eine von 25 Kategorien. |
| **Bearer/Cycode** | Bearer hatte den richtigen Ansatz (DSGVO auf Code-Ebene). Ist am falschen Targeting gescheitert. Wir machen das was Bearer versucht hat, aber für Vibe-Coders. |

### Einzigartige Position (aus Wettbewerbsanalyse)

Kein anderes Tool im Markt bietet gleichzeitig:
1. Geführter Weg von der Idee zum produktionsreifen Launch
2. Numerisches Production-Readiness-Signal das über Zeit wächst
3. EU-spezifische Compliance-Prüfung auf Code-Architektur-Ebene (DSGVO, BFSG, AI Act)
4. Fix-Prompt-Export der den Gap zwischen "Problem erkannt" und "Problem gelöst" schließt
5. Tool-agnostisch — egal ob Cursor, Lovable, Bolt oder handgeschrieben

---

## Das Produkt (MVP)

Drei Features. Nicht mehr.

### Feature 1: Instant Audit mit Score

Repo verbinden (oder Ordner scannen), 60 Sekunden, Score + Top 5 Probleme.
Nicht 195 Findings — 5. Priorisiert. In menschlicher Sprache.
Kein Setup, kein Konto nötig für den ersten Scan.

**Status:** ✅ Gebaut (25+ Agenten, 195 Regeln, File System API)
**Fehlt:** Reduktion auf Top 5 als Default-Ansicht, GitHub-Repo-Connect

### Feature 2: Fix-Prompt Export

Jedes Finding hat einen kopierbaren Prompt: "Hier ist was falsch ist,
hier ist warum, hier ist wie du es deiner KI sagst."
Plus: .cursorrules / CLAUDE.md Export für Build-Time-Regeln.

**Status:** ✅ Gebaut (.cursorrules Export, Aufgabenliste, Prompt-Export)
**Fehlt:** Prompt-Qualität verbessern (Feedback-Loop), einzelne Findings als Prompt

### Feature 3: Score-Tracking über Zeit

Ein Graph. Dein Score diese Woche vs. letzte Woche.
Wenn er steigt, kommt der User wieder. Das ist der Retention-Hook.

**Status:** ✅ Gebaut (Score-Verlauf, Run-Historie, Trend-Anzeige)
**Fehlt:** Prominentere Darstellung, "noch X% bis Stable" Messaging

---

## Wettbewerbslandschaft

### Bedrohungen (priorisiert)

| Bedrohung | Level | Zeitrahmen | Unsere Antwort |
|-----------|-------|------------|----------------|
| Cursor BugBot | 7/10 | Native im Workflow, wächst | MCP-Integration, Position festigen vor Compliance-Layer (18-24 Mo) |
| GitHub Copilot Code Review | 7/10 | Distribution durch GitHub | VS Code Extension als Counter |
| CodeRabbit | 5/10 | Beste UX im PR-Review | Wir sind Journey, nicht Commit-Review |
| Aikido Security | 5/10 | Beste Security-UX | Partner statt Konkurrent, Benchmark für UX |
| Fehlender Conversion-Moment | 35% Risiko | Permanent | Echte Bußgeld-Cases als Story |
| Scope-Creep | 40% Risiko | Permanent | Kill-the-Darlings diszipliniert einhalten |

### Partner-Kette (unser Platz im Ökosystem)

```
Vibe-Guide.dev (Idee + PRD)
        ↓
Lovable / Cursor / Bolt (Bauen)
        ↓
★ WIR (Production Readiness Check) ★
        ↓
Vercel (Deployment)
        ↓
Sentry / Plausible (Monitoring)
```

### Was wir NICHT nachbauen

| Bereich | Stattdessen empfehlen | Warum |
|---------|----------------------|-------|
| Dependency Security | Snyk / Aikido | Haben bessere CVE-Datenbanken |
| Performance-Analyse | Lighthouse / PageSpeed | Kostenlos und bekannt |
| Test-Generierung | Qodo (CodiumAI) | Spezialisiert auf Tests |
| Secrets Detection | Gitleaks / TruffleHog | Spezialisiert, weniger False Positives |
| Container Security | Trivy / Checkov | Falsche Zielgruppe |
| Code Coverage | Istanbul / c8 | Gelöstes Problem |
| SEO-Analyse | Screaming Frog | Out of scope |
| PR-basierter Review | CodeRabbit | Haben bessere PR-UX |
| Code-Editor | Cursor | Cursors Job |

**In der App:** Explizite "Empfohlene Tools"-Section im Dashboard.
"Für Dependencies empfehlen wir Snyk. Für Performance: Lighthouse."
Stärkt Vertrauen, reduziert Scope.

---

## User-Typen

### Primär: Solo-Gründer (80% der Energie)

Hat gerade mit Lovable/Cursor eine App deployt und weiß nicht
ob sie sicher/compliant/production-ready ist. Kommt aus
Indie-Hacker-Communities. Bezahlt €39/Monat.

### Sekundär: Hobby-Viber (Einstieg, Conversion zu Gründer)

Baut Spaßprojekte, will lernen. Kostenlos. Bekommt Tipps statt
Warnungen. Lite-Agenten. Wird zum Gründer-Kunden wenn ernst.

### Tertiär: Agency/Freelancer (nach PMF)

Baut für verschiedene Kunden, braucht Multi-Projekt-Management
und Compliance-Nachweise. €199/Monat.

### Später: Business/Enterprise (nach Year 1)

Kommt organisch wenn Gründer zu Business-Kunden wachsen.

---

## Kill-the-Darlings (endgültig)

| Feature | Warum gestrichen |
|---------|-----------------|
| Eigener Code-Editor | Cursors Job |
| Echtzeit-Linting | Stört Flow, gehört in "Feature fertig"-Phase |
| Code-Generierung | Verwässert Positioning |
| Enterprise DB-Import | Over-Engineering |
| Custom Agenten Self-Service | ESLint-Import reicht |
| SSO / Enterprise in Year 1 | Erst mit erstem Enterprise-Kunden |
| Compliance-Zertifikate | Rechtliches Risiko |
| i18n vor EU-Tiefe | EU perfekt machen zuerst |
| Große Community-Plattform | Discord reicht |
| Gamification (Badges) | Score-Anstieg reicht |
| Team-Features in Year 1 | Nicht relevant für Adoption |
| PR-basierter Review | CodeRabbit hat das besser |
| Dependency-CVE-Datenbank | Snyk hat das besser |
| Performance-Profiling | Lighthouse reicht |
| Test-Schreiben | Qodo hat das besser |

---

## Roadmap

### ✅ ERLEDIGT

```
Audit Engine             25+ Agenten, 195 Regeln, 3-Schichten-Audit
Repo Map Generator       TypeScript Compiler API, Kontext für LLMs
Multi-Model Reviews      4 Reviewer + Opus Judge
Fix-Engine               Quick Fix, Konsens-Fix, Risk Assessment
File System API          Externe Projekte scannen (Chromium)
Aufgabenliste            Findings → Tasks → Prompt-Export
.cursorrules Export      26 Build-Time-Regeln, profil-aware
Strategie-Empfehlungen   Gruppierte Findings mit Lösungsansätzen
Score-Tracking           Verlauf über 41+ Runs
Regulatorische Agenten   DSGVO (18), BFSG (14), AI Act (12) Regeln
Security Scan            34 Patterns, 8 Check-Funktionen
Projekt-Onboarding       Auto-Detect + Interview, N/A-Kategorien
PRs gemergt              #25 + Dependabot (#21, #23, #24)
```

### JETZT — Diese Woche

```
□ Navigation umbauen
  Alte Features einfrieren (Chat, Workspaces, Feeds, Artefakte)
  Neue Struktur: Dashboard → Audit → Aufgaben → Regeln → Settings

□ Dashboard als Einstieg
  Ohne Projekte: "Was hast du gebaut?" + 3 Tracks (Speedrun/Guided/Rescue)
  Mit Projekten: Score-Cards, Trend, "noch X% bis Stable"
  Top-5-Findings als Default statt 314

□ Name entscheiden
  Kandidaten: GuideVibe, VibeMate, ReadyCheck
  Domain sichern
```

### NÄCHSTE 2 WOCHEN

```
□ "Scan your Lovable App" Landing Page
  Kostenloser Scan als Hook
  Positioning klar formuliert
  ROI-Argument: "€39/Monat vs. €20.000 Bußgeld"

□ Tool-Empfehlungen im Dashboard
  "Für Dependencies: Snyk. Für Performance: Lighthouse."
  Stärkt Vertrauen, reduziert "warum habt ihr das nicht?"

□ Bestehende Templates scannen + Score veröffentlichen
  ShipFast, create-t3-app, Taxonomy, Supastarter
  "ShipFast hat Score 45% bei uns. Hier sind die 5 Aufgaben."
  Content für IH + Reddit

□ BFSG für Entwickler — SEO-Artikel
  Null Konkurrenz, bindend seit Juni 2025
  "Was BFSG für deine Next.js-App bedeutet"
  Organic Traffic als langfristiger Kanal
```

### NÄCHSTER MONAT

```
□ Lovable Community Listening
  Discord beitreten, 2 Wochen beobachten
  Dann: Cold-Outreach an Lovable-Team
  Ziel: "Scan in [unser Tool]"-Button nach Lovable-Build

□ Echte Bußgeld-Cases recherchieren
  3 DSGVO/BFSG-Bußgeld-Stories als Onboarding-Content
  "Jemand in deiner Situation hat €50.000 Strafe bekommen"
  Conversion-Trigger statt abstrakte Warnung

□ Credits-Modell + Pricing Page
  Free: 10 Credits/Monat, 1 Projekt, Top 5 Findings
  Gründer: €39/Monat, 3 Projekte, Deep Scan, EU-Compliance
  Agency: €199/Monat, unlimitiert, API, Reports

□ "Tropen OS Certified Starter"
  Kostenloses Template als Lead-Magnet
  Next.js + Supabase + Auth + Legal Pages
  Startet bei ~55-60% Score
  Nicht verkaufen — verschenken für Akquisition

□ Erste 10 Beta-User
  Analyse-Posts: "Wir haben 50 Lovable-Apps gescannt"
  IH, r/nextjs, r/SideProject
  Eigene Projekte öffentlich scannen + Ergebnisse teilen
```

### Q3 2026

```
□ VS Code Extension (Minimal)
  Score in Statusbar, Findings-Liste
  Counter-Positionierung gegen BugBot/Copilot

□ MCP-Server für Cursor
  @tropen scan → Score erscheint in Cursor
  Größte Reichweite ohne eigene Extension

□ GitHub-Repo-Connect (OAuth)
  Automatischer Scan, kein File System API nötig
  Funktioniert auf allen Browsern

□ Product Hunt Launch
  Timing: nach ersten 10-20 Beta-Usern mit Testimonials

□ Community-Start (Discord)
  Ein Kanal, richtig gemacht
  Geteilte Regel-Packs, Template-Scores
  Netzwerkeffekt aufbauen

□ Prompt-Qualität Feedback-Loop
  "Hat dieser Prompt das Problem gelöst?" → Ja/Nein
  Daten sammeln → Prompts verbessern → Daten-Moat
```

### Q4 2026

```
□ Agency/Freelancer-Tier
  Multi-Projekt, Compliance-Reports, €199/Monat

□ Vercel Deploy-Hook Integration
  Automatischer Scan vor Production-Deploy

□ Lovable Partnership (formell)
  "Scan after Build"-Button in Lovable

□ 100 Beta-User Milestone
□ Erste Einnahmen
□ Community-Regelwerk (user-contributed)
```

---

## Go-to-Market

### Kanäle (priorisiert)

1. **"Scan your Lovable/Bolt App"** — Landing Page + kostenloser Scan
2. **BFSG/DSGVO Content** — SEO-Artikel, null Konkurrenz
3. **Template-Scores** — "ShipFast Score: 45%" als Content
4. **Indie Hackers + Reddit** — Analyse-Posts, kein Werbung
5. **Lovable/Bolt Discord** — Community-Listening → Help → Referrals
6. **Twitter/X** — "Wir haben 50 Apps gescannt. DSGVO-Fehler in 94%."
7. **Product Hunt** — Launch nach ersten Testimonials

### Messaging

Primär für den Gründer. Business kommt von alleine.

Compliance als Schutz, nicht als Pflicht:
"Schützt dich vor €20.000 Bußgeld" statt "DSGVO Art. 13 Absatz 2"

Conversion-Trigger: Echte Bußgeld-Cases statt abstrakte Warnungen.

### Erster Kunde

Ein Solo-Gründer der gerade mit Lovable oder Cursor eine App deployt
hat und nicht schläft weil er nicht weiß ob alles sicher ist.

---

## Moat-Strategie

### Year 1: Wissensvorsprung aufbauen

- EU-Compliance-Rules kuratieren (DSGVO, BFSG, AI Act)
- Prompt-Export-Qualität durch Feedback verbessern (Daten-Moat)
- Echte Cases sammeln und dokumentieren
- BFSG + AI Act Content als SEO-Moat (null Konkurrenz)

### Year 2: Netzwerkeffekte

- Community-Regelwerk (user-contributed)
- Integration-Lock-In (VS Code, MCP, GitHub Actions, Vercel)
- Daten aus tausenden Scans → Pattern-Erkennung
- Partnership-Netzwerk (Lovable, Cursor, Vercel, Supabase)

### Existenzielle Bedrohungen

| Bedrohung | Wahrscheinlichkeit | Unsere Antwort |
|-----------|-------------------|----------------|
| Cursor baut Quality+Compliance nativ | 15% in 12 Mo | Position festigen, MCP-Integration, EU-Expertise als Differenziator |
| Lovable kauft EU-Compliance-Startup | 10% | Partnership vor Akquisition |
| Kein Conversion-Moment | 35% | Echte Bußgeld-Cases, konkreter ROI |
| Scope-Creep | 40% | Kill-the-Darlings Liste, "hilft es dem Score?" als Feature-Test |

---

## Pricing

| Tier | Preis | Enthält | Conversion-Argument |
|------|-------|---------|---------------------|
| **Free** | €0 | 10 Credits/Monat, 1 Projekt, Top 5 Findings | "Probier es kostenlos" |
| **Gründer** | €39/Monat | 3 Projekte, Deep Scan, EU-Compliance, Prompt-Export | "€39 vs. €20.000 Bußgeld" |
| **Agency** | €199/Monat | Unlimitiert, API, Compliance-Reports | "Compliance-Nachweis für deine Kunden" |

---

## Prinzipien (aus 5 Komitee-Reviews)

1. **Score steigt = Produkt funktioniert.** Jedes Feature muss
   diese Frage beantworten: hilft es dem User seinen Score zu
   verbessern?

2. **5 Findings statt 500.** Priorisierung > Vollständigkeit.

3. **Prompt-Export ist der Aha-Moment.** Der User muss DSGVO nicht
   verstehen — er muss nur den Prompt kopieren.

4. **EU-Compliance ist Differenziator, nicht Headline.**
   Teil der breiteren Quality-Story.

5. **Kein Scope-Creep.** Die größte Gefahr ist nicht die
   Konkurrenz — es ist der Scope.

6. **Kommuniziere für den Gründer.** Business kommt von alleine.

7. **Empfehlen statt nachbauen.** Snyk, Lighthouse, Gitleaks
   empfehlen. Stärkt Vertrauen, reduziert Scope.

8. **Partnership vor Sales.** Lovable, Cursor, Vercel sind
   Partner-Opportunities, nicht Vertriebskanäle.

9. **Content vor Community.** Analyse-Posts bringen User
   ohne Werbung. BFSG-Content hat null Konkurrenz.

10. **Ein Kanal, richtig gemacht.** Discord vor Forum vor
    Blog vor Newsletter.

---

## Sprint-Status (Stand 2026-04-29)

### ✅ Abgeschlossen
- BP6 — Tasks-Cleanup
- BP1 — ARCHITECT.md Update
- BP-Design-1 (Größe C) — Marken-Pivot inkl. Hero, Use-Cases, Coach-Stimme
- BP7 — Audit-Tier-UI (Variante C-1, deployed)
- Audit-Tabellen-Welt-Umbau (Sentry-Stil)
- Bug-Fix-Runde Tabellen-Welt (Tier-Filter, Sticky-Tabs, Coach-Stimme-Migration)

### 🔄 Aktuell aktiv
- **Tab-Sprint Domain-Architektur** (ADR-025)
  - Phase 1: Domain-Mapping AuditEngine + 10 DB-Security-Rules (~3-5 PT)
  - Phase 2: Tab-Struktur 6 Domänen (~3-5 PT)
  - Phase 3: Compliance-Inputs Variante D (~4-6 PT)
  - Phase 4: Lighthouse-Integration Performance-Tab (~3-5 PT)
  - Phase 5: Doku & Self-Audit (~1 PT)
  - **Geschätzte Dauer:** 3-4 Wochen Solo-Founder-Arbeit

### ⏸ Verschoben (warten auf Tab-Sprint-Abschluss)
- BP8 — Quick-Wins-Box global + Fix-Session-Bundle ✅ 2026-04-30
- BP9 — Compliance-Stufe-1 (teilweise in Tab-Sprint Phase 3 integriert)
- BP10 — Cockpit→Projektboard
- BP11 — UX-Polish A6/A9/A15/A18
- ~~BP12 — Fix-Prompt-Top-5-Optimierung~~ → durch BP8 erledigt 2026-04-30
- BP13 — Self-Audit-Roundtrip

### 🆕 Neu hinzugefügt (durch ADR-025)
- L2 — Vibe-Coder-Outreach (3 Calls in 1 Woche) — Trigger: nach Tab-Sprint
- BP14 — Snyk-Integration (Sicherheits-Tab füllen) — Trigger: nach L2, ~5-7 PT
- BP15 — axe-core-Integration (Barrierefreiheits-Tab füllen) — Trigger: nach BP14

## Q2-Ziel-Anpassung (2026-04-29)

**Ursprüngliches Q2-Ziel:** Sprint 1 + Sprint 2 abgeschlossen, MVP launchbereit

**Realistisches Q2-Ziel nach Tab-Sprint:**
- Tab-Sprint abgeschlossen (Ende Mai 2026)
- L2 Vibe-Coder-Outreach durchgeführt
- BP8/BP9/BP10 (verbleibender Sprint 1) abgeschlossen
- BP14 (Snyk) optional, falls L2 positiv
- **Sprint 2 fällt voraussichtlich in Q3** (Multi-Modell-Review, BP11-BP13)

**Marketing-Versprechen kalibrieren:**
- MVP-Launch-Datum: realistisch Ende Q2 / Anfang Q3 statt Mitte Q2
- Aggregator-Versprechen: "Lighthouse heute, Snyk + axe-core in Vorbereitung"
- Compliance-Versprechen: "Existenz-Check heute, Inhalts-Prüfung Q3+"

## Drittanbieter-Integrations-Roadmap (ADR-025)

| Tool | Domain | Sprint | Status | Aufwand | Pricing-Risiko |
|------|--------|--------|--------|---------|----------------|
| Lighthouse / PageSpeed Insights | Performance | Tab-Sprint Phase 4 | In Build | ~3-5 PT | Gratis bis Quota |
| Snyk | Sicherheit | BP14 (Q2/Q3) | Geplant | ~5-7 PT | Pro-Plan kostenpflichtig |
| axe-core | Barrierefreiheit | BP15 (Q3) | Geplant | ~5-7 PT | Open Source |
| OWASP ZAP | Sicherheit | BP16+ (Q3/Q4) | Geplant | ~7-10 PT | Open Source, Setup-Komplex |
| WAVE | Barrierefreiheit | BP17+ (Q4) | Optional | ~3-5 PT | API kostenpflichtig |
| WebPageTest | Performance | BP18+ (Q4) | Optional | ~3-5 PT | API kostenpflichtig |
| Pa11y | Barrierefreiheit | BP19+ (Q4) | Optional | ~3-5 PT | Open Source |

## Backlog — Audit-UX + Checker-Qualität

### UI-Pivot-Vorbereitung: Quick-Wins-Doppelung + Reihenfolge-Empfehlung — 2026-05-04

**Beobachtung (Timm):** Quick Wins als eigene Sektion fühlt sich doppelt an — Findings tauchen in Quick-Wins-Box UND Findings-Liste auf. User fragt: "wo soll ich anfangen?"

**Hypothese:** Quick Wins sind kein eigener Inhalt, sondern eine Sortier-/Empfehlungs-Information für die Findings-Liste.

**Für ADR-027 Schritt 6 (UI-Pivot):**
- Eine einzige Findings-Liste, sortiert — Quick Wins kommen zuerst ("Empfohlen zuerst")
- Keine separate Quick-Wins-Sektion mehr
- **Default-Sortierung: Aufwand-basiert** (Quick Wins zuerst, Begründung: Aufwand ist greifbar, "15 Min" ist konkret — Impact-Score wäre für Vibe-Coder überkonstruiert)
- Reihenfolge-Kriterium **transparent erklären**: "Diese 5 sind in <15 Min lösbar — fang hier an"
- Hybrid (Aufwand × Impact) als mögliche Erweiterung später

**Coach-Lücke heute:** Tropen OS liefert keine Reihenfolge-Empfehlung. Schritt 6 schließt das.
Wording-Beispiel: "Du hast 17 Polish-Findings. Wir empfehlen, mit diesen 5 anzufangen — sie sind alle in unter 15 Minuten lösbar und reduzieren die Liste schnell."

Architektur-Referenz: Marken-Brief Section 28.4.

---

### P4-Pattern für 410-Only-Routes — 2026-05-04
**Anlass:** Dogfood-Sprint — Audit-Finding "API route may lack auth check" für `audit/tasks/route.ts` + `audit/tasks/[id]/route.ts`. Beide Routes geben ausschließlich 410 Gone zurück, greifen auf keine Daten zu. Checker sieht nur "kein Auth-Import" und nicht "Route tut nichts, was Auth bräuchte". Bereits als bekannter FP in `docs/checker-feedback.md` dokumentiert. Bei Senior-Engineer-Reflex kein Schaden — bei Vibe-Codern potenziell Verwirrung.

**Optionen:**
- **A — Checker-Korrektur:** 410/404-Only-Stubs als Exclusion erkennen. Pro: Wurzel-Fix. Contra: Komplexere Detection, ~30–60 Min.
- **B — UI-Markierung dokumentierter FPs:** Audit-UI liest `checker-feedback.md` und markiert dokumentierte FPs visuell ("vom Repo als False Positive bestätigt"). Pro: Coach-Marketing-Feature. Contra: substantieller Aufwand (UI + Datei-Parsing).
- **C — Hybrid:** A + B kombiniert.

**Empfehlung:** B — Coach-Marketing-fähig, koppelt an Stop-and-think (s.u.). Vor Beta-Onboarding entscheiden.

---

### Stop-and-think im Fix-Prompt-Format — 2026-05-04
**Anlass:** Fix-Prompts im vollen Coach-Stil können bei Vibe-Codern ohne Senior-Engineer-Reflex mechanisch ausgeführt werden — auch bei False Positives. Besonders bei Security/DSGVO/Compliance-Findings relevant.

**Optionen:**
- **A — Standard-Block in jedem Prompt:** "Bevor du fixt — kurz prüfen". Pro: konsistent. Contra: wird wie Cookie-Banner weggeklickt, verwässert Coach-Stimme.
- **B — Reflexions-Block nur bei kritischen Domains:** Nur Sicherheit, DSGVO, Compliance. Pro: pragmatisch. Contra: Pflege-Aufwand.
- **C — UI-Element "❓ False Positive?":** Button neben Finding öffnet kurze UI-Frage, Antwort landet in `checker-feedback.md`. Pro: eleganteste Lösung, baut FP-Doku als UX-Habit ein, koppelt direkt an P4-Pattern Option B. Contra: substantieller Aufwand.

**Empfehlung:** C als Ziel-Lösung. Falls zu teuer für Phase 2: B als Übergang. A nicht empfohlen (Anti-Coach). Timing: Phase 3 UX-Polish oder gemeinsam mit P4-Pattern Option B vor Beta.

---

### Onboarding-Komplex (Deep Review + Regeln-Export + Onboarding-Modus) — 2026-05-04

> **Update 2026-05-04:** Onboarding-Komplex ist nicht mehr vollständig Backlog. Profil-Frage (Onboarding-Modus) ist Bestandteil der Killer-Kriterien-Implementation (ADR-027, Schritt 5). **Profil-Auswahl = Onboarding-Frage** — dieser Teil ist damit entschieden.
> Regeln-Export-Position und Deep-Review-Architektur bleiben zu klären, sind aber vom Killer-Kriterien-Pivot entkoppelt.

**Frage 1 — Deep Review Architektur (offen):**
"Deep Review"-Button suggeriert, der normale Audit könnte ungenau sein. Anti-Coach-Position.
- A: Komitee immer dabei | B: Pro-Tier-Feature | C: Quick vs. Vollständig | D: Automatisch nach Bedingungen

**Frage 2 — Regeln-Export UX-Position (offen):**
"Regeln exportieren" im Audit ist falscher Moment — Export ist Vor-Coding-Setup.
- A: In Onboarding-Flow | B: Eigene Setup-Seite | C: Im Audit kontextuell | D: Backlog nach Onboarding-Klärung

**Frage 3 — Onboarding-Modus:** ✅ Profil-Auswahl (5 Profile + Markt-Achse) ist durch ADR-027 entschieden.

**Status:** Vor Beta-Onboarding zu klären. Alle drei sind Trust-Killer bei Vibe-Coder-Skalierung.

---

### Feature-Guards-Linting (Backlog) — 2026-05-05

**Anlass:** `pnpm lint:features` schlug fehl, weil `scripts/ci/check-feature-guards.mjs` nie angelegt wurde (Vorgriff auf nie umgesetzten Plan). Befehl aus `package.json` entfernt, `lint:all` läuft wieder durch.

**Was es prüfen sollte:** dass Feature-Flags in `src/lib/features.ts` korrekt um experimentelle Features gesetzt sind und keine Feature-Flag-Leichen im Code stehen.

**Sprint-Schätzung:** ~2-3h. **Wann:** vor Beta, im selben Hygiene-Block wie 820-Lint-Warnings-Welle.

---

### Marketing-Consent-Logik-Detection (eigener Sprint nach Beta) — 2026-05-05

**Anlass:** Sprint 9b detectet Tracking-Libraries via package.json. Consent-Integration kann Tropen OS heute nicht prüfen — fixHint befähigt User, das mit ihrem KI-Assistenten zu prüfen (Selbst-Prüfungs-Befähigungs-Pattern, Section 28.1).

**Substanz für eigenen Sprint:**
- AST-Analyse: wo wird Tracking-Library initialisiert? (Module-level, useEffect, conditional)
- Cookie-Manager-Detection (CookieYes, OneTrust, eigene Lösung, keine)
- Conditional-Rendering-Analyse: läuft Tracking nach Consent-State?
- Komitee-Review: ja (DSGVO-Sensibilität)

**Aufwand:** ~10-15h + ~€0.50 Komitee. **Wann:** nach Beta-Feedback. Vibe-Coder-Feedback zu fixHint-Pattern abwarten — möglicherweise reicht der Prompt-Ansatz.

---

### Vibe-Coder-Wörterbuch — 2026-05-05

**Anlass (Compliance-Domänen-Komitee):** Coach-Sprache muss radikal vereinfacht werden. Compliance-Begriffe filtern Vibe-Coder raus, bevor sie verstehen worum es geht. Top-3 Fallen identifiziert: "sensible Daten" (Vibe-Coder denken an Passwörter, nicht Art. 9 DSGVO), "Biometrie" (nicht Sentiment-Analyse), "Tracking" (unterscheidet nicht notwendig vs. Marketing).

**Substanz-Anker:** Marken-Brief Section 28.5 — Übersetzungstabelle (6 Einträge als Startpunkt)

**Aufwand:** ~3 Tage (Komitee-Schätzung). Validierung mit echten Vibe-Coderer-Calls (L2-Outreach).

**Timing:** vor Schritt 8 (Coach-Wording-Implementation). Nach Beta-Start, nicht davor.

---

### Audit-Kategorie: Agent-Friendliness / Discoverability für Maschinen — 2026-05-04

**Beobachtung 2026-05-04 (Timm):**
Vibe-Coder bauen Apps, die zunehmend von AI-Agenten besucht werden (Operator,
Computer Use, Copilot, Gemini Assistant). Wenn die App agent-blind ist, wird sie
für eine wachsende Nutzergruppe unbenutzbar — das ist Production-Readiness-Aspekt.

**Anker-Artikel:** Google web.dev — "Build agent-friendly websites" (2026-04-01)
https://web.dev/articles/ai-agent-site-ux

**Themen-Cluster (offen, zu ergänzen):**
- A11y-Tree-Qualität (semantisches HTML, ARIA-Rollen, stabile DOM-Struktur)
- WebMCP-Bereitschaft (Web-Standard noch in Entwicklung — Reifegrad prüfen)
- schema.org Markup (Timm-Hinweis 2026-05-04, "wird sicherlich noch ergänzt")
- OpenAPI / strukturierte Daten für Agent-Discovery
- Stable-DOM-Klassen (keine Hash-Klassen, die bei jedem Build wechseln)
- ggf. weitere Discoverability-Aspekte (SEO-Schnittmenge?)

**Offene Fragen für Sparring:**
1. Killer oder Polish? — Tendenz Polish-High (Detection heuristisch, Marken-Position zweiter Ordnung greift)
2. Profil-Aktivierung? — Tendenz Profile 3-5 (Public-Apps)
3. Welche konkreten Checks technisch machbar mit AST/Datei-Inspektion?
4. Verhältnis zu bestehenden Audit-Kategorien (Accessibility-Kategorie existiert bereits — Erweitern oder neue Kategorie?)

**Zustand:** Themen-Sammlung. Sparring + Eingrenzung morgen oder später.
**Verbindung:** Coach-Position zweiter Ordnung (Marken-Brief Section 28) greift hier — bei heuristischer Detection lieber Polish mit Begrenzungs-Aussage als Killer.

---

## Backlog Q3+ — Datenbank-Sicherheit-Erweiterung

Anlass: ADR-025-Update 2026-04-29. Phase-1-Erweiterung im Tab-Sprint deckt ~10 Supabase-Sicherheit-Rules ab.

### BP-Sec-1 — DB-Sicherheit-Erweiterung
**Trigger:** Nach Tab-Sprint-Abschluss + L2-Validierung | **Aufwand:** ~7-10 PT
- Erweiterung auf weitere DB-Provider (Firebase, Drizzle, Prisma, Postgres direkt)
- Connection-String-Sicherheit, API-Endpoint-Härtung, Rate-Limiting-Patterns

### BP-Sec-2 — Marketing-Use-Case-Sektion DB-Sicherheit
**Trigger:** Nach BP-Sec-1 | **Aufwand:** ~3-5 PT
- Use-Case-Sektion Landing-Page: "Datenbank-Sicherheit für Vibe-Coder"
- SEO: "supabase security audit", "rls vergessen", "vibe coder datenbank sichern"

### BP-Sec-3 — Continuous DB-Sicherheits-Monitoring
**Trigger:** Q3+, abhängig von Pricing-Modell | **Aufwand:** ~10-15 PT
- DB-Sicherheit als wiederkehrender Check, Diff-Anzeige, Alerts bei CVEs
- Premium-Tier-Kandidat

### Marketing-Hebel sofort (kein Build nötig)
Nach Tab-Sprint-Abschluss kann sofort kommuniziert werden:
- "10 Supabase-Sicherheits-Checks gelauncht — RLS, Service-Role, Storage-Buckets"
- Vibe-Coder-Outreach (L2): konkretes Tool zum Zeigen
- Cursor/Lovable-Communities: "Lasst euer Repo durch unseren Sicherheits-Tab laufen"

---

## Backlog aus ADR-027 Implementations-Phase (Sprints 5–7, 2026-05-05)

Diese Items entstanden während der Implementation. Die meisten lösen sich mit Schritt 9 (Domain-Detektoren + DB-Migration) auf.

### Items, die sich mit Schritt 9 auflösen

#### `isKiller`-Heuristik-Doppelung
**Anlass:** Sprint 6a — `isKiller`-Status wird zweimal berechnet: einmal vom Detektor in `audit_findings`, einmal im Renderer via `KILLER_RULE_IDS` Set in `killer-rule-ids.ts`. Zwei Quellen für dieselbe Information.
**Lösung:** DB-Spalte `is_killer` in `audit_findings` mit Schritt 9. Dann nur noch ein Lookup aus DB, `KILLER_RULE_IDS` Set wird obsolet.
**Status:** Übergang akzeptabel — kein FP-Risiko, nur Redundanz.

#### `critical_findings` als Killer-Count-Proxy
**Anlass:** Sprint 6b₂ — Verbundene-Projekte-Liste zeigt `critical_findings` aus `audit_runs` als Näherung für Killer-Count. `critical_findings` ist severity-basiert (critical ≥ 1), Killer ist rule-id-basiert — leichte Divergenz möglich.
**Konsequenz:** Liste-Approximation und Detail-Seite können leicht abweichen.
**Lösung:** mit Schritt 9 (is_killer-DB-Migration): echten `killer_count` in `scan_projects.last_killer_count` speichern.

#### Aufwand-Heuristik via fixType
**Anlass:** Sprint 6a — `effortMinutesFromFixType` (code-gen=10, code-fix=15, refactoring=45, manual=60) ist grobe Schätzung ohne echte Daten.
**Lösung:** wenn Findings ein echtes Aufwand-Feld bekommen (aus Detektor oder Komitee), Heuristik durch Daten ersetzen. Vermutlich Schritt 9 (zusammen mit is_killer-Migration).

#### Compliance-Fragen-Inhalt überarbeiten
**Anlass:** Sprint 6b₁ — DSGVO- und KI-Act-Compliance-Fragen 1:1 aus alten Tabs wiederhergestellt. Wording war vor Marken-Brief Section 28.5 formuliert.
**Lösung:** Sprint 8 (Coach-Wording) überarbeitet Compliance-Fragen-Wording. Inhaltliche Logik-Überarbeitung kommt mit Schritt 9 (Domain-Logik-Differenzierung).

### Eigenständige Items (nicht durch Schritt 9 abgedeckt)

#### Profile-Historie sichtbar machen
**Anlass:** Sprint 5 — `scan_project_profiles` hat vollständige Änderungs-Historie, aber nirgends in der UI zugänglich.
**Möglicher Ort:** Audit-Detail-Seite zeigt "Profil seit X geändert" oder Settings-Ansicht "Profil-Verlauf".
**Aufwand:** ~1-2h. **Wann:** UX-Polish vor Beta.

#### Quick-Wins-Heuristik überarbeitungsbedürftig?
**Anlass:** Sprint 6a — Quick-Wins-Heuristik aus altem Stand übernommen (quickWinScore basiert auf Severity × fixType × Trio-Bonus). Nicht im Sprint-Scope überarbeitet.
**Wann nachrüsten:** wenn UX-Tests zeigen, dass "Empfohlen zuerst"-Sortierung nicht User-Erwartungen entspricht.
**Aufwand:** ~2-3h + eventuell Komitee-Sprint.

#### `window.location.reload()` statt `router.refresh()` bei Profil-Änderung
**Anlass:** Schritt 7 — nach Profil-Änderung wird `window.location.reload()` genutzt statt Next.js `router.refresh()` (wäre sauberer und ohne Flash).
**Wann nachrüsten:** wenn UX-Tests häufigere Profil-Änderungen zeigen oder Flash stört.
**Aufwand:** ~30 Min — Server Action mit `revalidatePath`.

### Bereits dokumentiert

**Feature-Guards-Linting** — `pnpm lint:features`-Befehl referenzierte nicht-existierendes `check-feature-guards.mjs`. Befehl entfernt (BP-Lint-Features-Fix, 2026-05-05). Neubau als ~2-3h Sprint vor Beta-Phase. → Eintrag in Backlog-Bereich oben.

---

## Offene Punkte

- **Naming-Entscheidung:** Tropen OS ist Platzhalter-Name. Prodify wurde
  2026-04-13 als Idee in einer Komitee-Diskussion erwähnt, nicht beschlossen.
  Naming-Sprint erforderlich vor Beta-Outreach. Domain-Sicherung Voraussetzung.
  Zuständigkeit: Timm. Kein Build-Prompt nötig — strategische Entscheidung.

---

## Historischer Kontext (aus alter roadmap.md, Stand 2026-03-14)

Vor dem Pivot vom 2026-04-27 war Tropen OS eine vollständige KMU-Plattform mit Chat, Workspaces, Feeds, Agenten, Perspectives und Library-System. Alle Komponenten wurden gebaut (Migrationen 001–113+) und sind eingefroren. Die Substanz liegt in `docs/synthese/anhang-c-kill-und-einfrier-liste.md`. Wieder-Aktivierung in Phase 4 möglich.
