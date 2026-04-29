# Tropen OS → [Neuer Name] — Roadmap Q2/Q3 2026
## Production Readiness Guide für Vibe-Coders

> **Letzte Aktualisierung:** 2026-04-29 (Tab-Sprint Domain-Architektur, ADR-025)
> **Basis:** 5 Komitee-Reviews (€4.80 Gesamtkosten), Tiefe Wettbewerbsanalyse
> **Positionierung:** "Dein Code, in Production-Reife." — Coach-Position (ADR-024)
> **Produktname:** Prodify (Komitee 2026-04-13) — Domain sichern + Markenrecherche offen
> **Tab-Sprint:** ADR-025 accepted 2026-04-29. Sprint 1 (BP8–BP13) verschoben hinter Tab-Sprint.

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
- BP8 — Bulk-Download (Findings als Markdown-Export)
- BP9 — Compliance-Stufe-1 (teilweise in Tab-Sprint Phase 3 integriert)
- BP10 — Cockpit→Projektboard
- BP11 — UX-Polish A6/A9/A15/A18
- BP12 — Fix-Prompt-Top-5-Optimierung
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
