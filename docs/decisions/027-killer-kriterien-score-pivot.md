# ADR-027: Killer-Kriterien als primäres Coach-Signal

**Status:** Accepted
**Datum:** 2026-05-04
**Kontext:** Phase 2.5 (Validierung)
**Verwandt:** ADR-024 (Marken-Pivot), Marken-Brief Section 28

---

## Kontext

Bis 2026-05-04 nutzte Tropen OS eine kontinuierliche Audit-Score-Skala (0–100%) als primäres Coach-Signal. Score-Diagnose-Sprint (2026-05-04) hat strukturelle Schwächen aufgedeckt:

- **Skalen-Kompression:** effektive Zone 48–88%, niemand außer Tropen OS über 90% (380 Benchmark-Runs)
- **Sensitivität katastrophal niedrig:** +5 high-Severity-Findings = 0.268% Score-Bewegung
- **Always-Pass-Kategorien:** 13 von 26 Kategorien strukturell bei 100%, verwässern Diskriminierung
- **Pseudo-Präzision:** "78.3%" suggeriert Präzision, die der Skala fehlt

Vibe-Coder bekommen unklare Coach-Signale: "Was bedeutet 78%? Kann ich veröffentlichen?"

Multi-Model-Komitee (4 Modelle + Opus-Judge, €0.40) hat Killer-Kriterien-Liste für 5 Profile erarbeitet.

---

## Entscheidung

**Score-Architektur-Pivot:** Killer-Kriterien werden primäres Coach-Signal, Score wird sekundärer Polish-Indikator.

**Drei-Ebenen-Klassifikation** (vollständig dokumentiert in Marken-Brief Section 28):

| Ebene | Signal | Verhalten |
|-------|--------|-----------|
| 🛑 Killer | "Veröffentlichung blockiert" | Binär/Schwellwert, UI prominent oben |
| 🟠 Polish | "verbessert Qualität, kein Stopper" | Severity low/medium/high, Score weiterhin sichtbar |
| 📋 Hinweis | "außerhalb unserer technischen Prüfbarkeit" | Eigene UI-Sektion mit externen Links |

Killer-Kriterien sind **profil-spezifisch** (5 Profile + EU-Markt-Achse).

---

## Killer-Kriterien-Liste (Stand 2026-05-04)

### Universal — alle Profile

| Kriterium | Schwellwert |
|-----------|-------------|
| Hardcoded Secrets / API Keys / Tokens | Binär |
| Production-Build bricht ab | Binär |
| SQL-Injection-Risiko (String-Konkatenation in Queries) | Binär |
| Ungepatchte kritische Dependencies (CVSS >9) | Binär |
| Production-Secrets in Dev-Config | Binär |

### Public-Aktivierung — Profile 3, 4, 5

| Kriterium | Schwellwert |
|-----------|-------------|
| Open CORS auf Public Endpoints | Binär |
| Keine HTTPS-Erzwingung | Binär |
| Stack Traces an Client | Binär |
| Database-Connection ohne SSL | Binär |
| Rate Limiting fehlt auf API-Endpoints | Binär |
| Unbehandelte Promise-Rejections | >3 in kritischen Flows |
| Input-Validation fehlt | >30% der POST/PUT-Routes |

### Multi-User-Aktivierung — Profile 4, 5

| Kriterium | Schwellwert |
|-----------|-------------|
| API-Routes ohne Auth-Check | Strikt binär + Stub-Erkennung (410/404/501-Only excludiert) |
| PII in Logs | Binär |
| Fehlende Row Level Security (Supabase) | Binär |
| CSRF-Schutz fehlt in Form-Handling | Binär |

### EU-Markt-Aktivierung — Profile 4, 5 mit EU

| Kriterium | Schwellwert |
|-----------|-------------|
| DSGVO Backup-Pflicht (PITR oder vergleichbar) | Binär |

### B2B/Reguliert-Aktivierung — Profil 5

| Kriterium | Schwellwert |
|-----------|-------------|
| Audit-Logs fehlen für sensible Operationen | Binär |
| Soft-Delete fehlt für User-Daten | Binär |

### Polish-High (nicht Killer, aber prominent — 🟠)

| Kriterium | Profile | Begründung |
|-----------|---------|------------|
| Tenant-Isolation (organization_id-Filter) | 4–5 | Detection heuristisch, FP-Risiko zu hoch für Killer-Status |

### Hinweise — eigene UI-Sektion (📋)

| Thema | Profile |
|-------|---------|
| Cookie-Banner | 4–5 (EU) |
| Datenschutzerklärung | 4–5 (EU) |
| Newsletter Double-Opt-In | 4–5 (EU mit Newsletter) |
| Zugriffsrechte-Dokumentation | 5 |

---

## Implementations-Reihenfolge (Folgesprint)

1. **Marken-Brief Section 28** ✅ — mit diesem Sprint dokumentiert
2. **AST-Detektoren** für Top-5 Killer (Secrets, SQL-Injection, Auth, CORS, Build-Fehler)
3. **Dependency-Scanner** (CVSS via `npm audit`)
4. **Config-Analyzer** (SSL, HTTPS-Redirect-Detection, Dev-Secrets)
5. **Profil-Onboarding-Frage** (5 Profile + Markt-Achse + Wizard-Modus)
6. **UI-Pivot Audit-Seite:** Killer-Status-Sektion oben, Polish-Findings darunter, Hinweise als eigene Sektion
   *(Erweiterte Anforderungen 2026-05-04: Quick-Wins-Doppelung auflösen → eine Findings-Liste mit Sortierung; Reihenfolge-Empfehlung Aufwand-basiert, Kriterium transparent erklärt; Score sekundär unter Killer-Status; Referenz: Marken-Brief Section 28.4)*
7. **Settings-Seite:** Profil jederzeit änderbar
8. **Coach-Wording umsetzen** für alle 19 Killer-Kriterien (Komitee-Output)

---

## Konsequenzen

**Positiv:**
- Coach-Position geschärft: "kann ich veröffentlichen?" binär, nicht Komma-Prozent
- Profil-Sensitivität: Demo-Tool und B2B-App werden unterschiedlich bewertet
- Trust-Mechanismus zweiter Ordnung: Coach erklärt explizit Grenzen
- Onboarding-Frage jetzt klar: Profil-Auswahl als erster Schritt

**Negativ:**
- UI-Pivot nötig: Score-zentrierte UI muss umgebaut werden
- Onboarding-Pivot nötig: Profil-Frage als zentraler Schritt
- Detection-Schärfung nötig: AST-Detektoren für Top-5-Killer
- Score bleibt, aber weniger prominent (rutscht ins Detail)

**Risiken:**
- False Positives bei Killern: Trust-Killer. Mitigation: AST statt Regex, Stub-Erkennung, strenge Konfidenz-Schwellen
- Profil-Wechsel-Verwirrung: Coach erklärt Wechsel explizit ("Profil auf B2C geändert — 8 neue Killer aktiv")
- Compliance-Halb-Zuständigkeit: Wording explizit machen ("wir prüfen das nicht — wir zeigen, was zu prüfen ist")

---

## Spaltungs-Entscheidungen (Timm, 2026-05-04)

Drei Spaltungen aus Komitee-Review BP-Dogfood-Komitee-1:

1. **Tenant-Isolation:** zu Polish-High verschoben — Detection heuristisch, FP-Risiko zu hoch für Killer. Aber prominent mit Begrenzungs-Aussage.
2. **Auth-Check-Schwelle:** strikt binär **plus** automatische Stub-Erkennung (410/404/501-Only excludiert).
3. **Compliance-Checks:** eigene UI-Kategorie "Hinweise" mit externen Links. Wording: "wir sind Code-Coach, kein Anwalt."

---

## Quellen

- `docs/audit-reports/score-diagnose-2026-05-04.md` — Faktenbasis
- `docs/audit-reports/killer-kriterien-komitee-2026-05-04.md` — Komitee-Empfehlungen (€0.40)
- Marken-Brief Section 28 — Coach-Position zweiter Ordnung
- ADR-024 — Marken-Pivot (Türkis, Korb)


> **Update 2026-05-04:** Schritt 2 abgeschlossen. 4 Killer-Detektoren mit isKiller-Flag implementiert. Self-Audit: 0 Killer-Findings auf Tropen OS (alle FPs durch Allowlists und Stub-Erkennung korrekt behandelt). Schritt 3 (Build-Check) ist nächster Sprint.

> **Update 2026-05-04 (Schritt 3):** Dependency-Scanner abgeschlossen. Erweiterung von `checkDependencyVulnerabilities` in `cli-checker.ts` — CVSS>9 + patchbar = isKiller, --prod excluded devDeps. Self-Audit: 0 Killer-Findings, 3 Polish-Findings (uuid/postcss/@anthropic-ai/sdk CVSS 0–6.1). Schritt 4 (Config-Analyzer) ist nächster Sprint.

> **Update 2026-05-04 (Schritt 2 komplett):** Alle 5 Universal-Killer-Detektoren aktiv: Secrets, SQL-Injection, Auth-Check, Open CORS (ADR-027 Schritt 2) + Build-Check (cat-3-rule-build, cli-checker.ts, cross-env-Fix für Windows). isKiller auch in checkNpmAudit (external-tools-checker.ts) ergänzt. Schritt 4 (Config-Analyzer) ist nächster Sprint.

> **Update 2026-05-04 (Schritt 4):** Config-Analyzer abgeschlossen. Drei Killer-Detektoren implementiert (DB-SSL, Dev-Secrets, HTTPS) in `config-killer-checker.ts`. Self-Audit: 0 Killer-Findings, Score 96.8%. Nächster Sprint: Schritt 5 (Profil-Onboarding) oder Score-Logik-Sparring.

## Update 2026-05-04 (Score-Architektur-Refactor)

**Entscheidung:** Score und Killer-Status sind getrennte, orthogonale Signale.
- Killer-Status: binär, primäres Coach-Signal ("X Stopper")
- Score: rein Polish-Aggregat — Killer-Findings excluded

**Technische Umsetzung (`score-calculator.ts`):**
- `hasKillerFindings` Guard in `calculateCategoryScore()`: Rules mit isKiller-Findings tragen 0 zu weightedScore und weightedMax bei
- `killerCount > 0 → score=1`-Logik in `cli-checker.ts` entfernt
- `KILLER_CRITERIA`-Konstante mit `@deprecated`-JSDoc markiert (bleibt bis Schritt 6)

**Score-Differenz:** 0% (Tropen OS hatte 0 Killer-Findings — erwartetes Ergebnis)

**UI-Konsequenz (Schritt 6, noch nicht umgesetzt):** Killer-Status visuell primär, Score sekundär.

**Bewusst akzeptierte Konsequenzen:**
- Vergleichbarkeit zu historischen Benchmark-Runs (380 Runs) gebrochen
- UI zeigt neuen Score ohne neue Hierarchie bis Schritt 6 — Übergangs-Zustand bis Beta-Launch

---

## Update 2026-05-05 (Compliance-Domänen-Architektur)

**Anlass:** Sparring zu Schritt 5 (Profil-Onboarding) hat strukturelle Lücke aufgedeckt — 5 Profile + Markt-Achse reichen nicht für ehrliche Compliance-Prüfung. Compliance-Domain-Komitee (€0.48) hat 9 Domänen + Profile-Update + Spaltungs-Entscheidungen geliefert.

**Entscheidung — Logik 3 (final):** Profile sind UI-Vereinfachung für End-User. Intern arbeitet Tropen OS mit multi-dimensionalen Compliance-Achsen. 5 Profile setzen Default-Werte für 9 Domänen.

### Compliance-Domänen (9, EINIG durch Komitee)

| # | Domäne | Aktivierung | Coach-Frage (Vibe-Coder-Sprache) |
|---|--------|------------|----------------------------------|
| 1 | Datenschutz | Pflicht (Onboarding) | "Sammelt ihr Namen, E-Mails oder andere User-Daten?" |
| 2 | KI-Einsatz | Empfohlen (Onboarding) | "Nutzt eure App KI (Chatbot, Bildgenerierung, Empfehlungen)?" |
| 3 | E-Commerce | Empfohlen (Onboarding) | "Verkauft ihr etwas über die App?" |
| 4 | Branchen-Sensibilität | Settings | "Seid ihr in einer regulierten Branche (Gesundheit, Finanzen, Kinder)?" |
| 5 | Barrierefreiheit | Settings | (über Profil + EU-Geo abgeleitet) |
| 6 | Werbung/Marketing | LAZY | Code-Detection: GA4/FB Pixel im Bundle? |
| 7 | Plattform (App Store) | LAZY | Code-Detection: capacitor.config/Info.plist? |
| 8 | Infrastruktur | LAZY | Code-Detection: vercel.json, hosting-config? |
| 9 | Open-Source-Lizenzen | LAZY | Code-Detection: package.json GPL-Scan |

### Profile (5, umbenannt durch Komitee)

| Alt | Neu | Coach-Beschreibung |
|-----|-----|---------------------|
| Demo / Solo-Tool | **Solo-Projekt** | "Nur ich, kein Login, keine echten User" |
| Internes Tool | **Internes Tool** | "Mein Team nutzt es, niemand von außen" |
| Public Tool ohne PII | **Public App ohne Login** | "Jeder kann die App nutzen, aber niemand muss sich anmelden" |
| B2C-App mit User-Daten | **B2C-App mit Accounts** | "User registrieren sich und speichern Daten" |
| B2B / Reguliert | **Regulierte B2B-App** | "Compliance ist wichtig — Health, Finance oder Behörden-Kunden" |

### Default-Werte-Tabelle: Profil × Domäne

| Profil | Datenschutz | KI | Commerce | Branche | A11y | Marketing | Platform | Infra | OSS |
|--------|------------|-----|----------|---------|------|-----------|----------|-------|-----|
| Solo-Projekt | — | — | — | — | — | — | — | — | LAZY |
| Internes Tool | AKTIV | — | — | LAZY | — | — | — | AKTIV | LAZY |
| Public App | — | LAZY | LAZY | — | AKTIV | LAZY | AKTIV | AKTIV | LAZY |
| B2C-App | AKTIV | LAZY | AKTIV | LAZY | AKTIV | AKTIV | AKTIV | AKTIV | LAZY |
| Regulierte B2B | AKTIV | AKTIV | AKTIV | AKTIV | AKTIV | LAZY | AKTIV | AKTIV | AKTIV |

**Legende:** AKTIV = beim First-Run aktiv · LAZY = nur wenn Code-Detection triggert · — = N/A

### Spaltungs-Entscheidungen (Timm-Review 2026-05-05)

1. **Domäne 8 (Infrastruktur) separat behalten** — nicht mit Datenschutz verschmelzen. Vibe-Coder-Mental-Modell trennt "was speichere ich" von "wo läuft das."

2. **Onboarding: 3 Pflichtfragen** — Profil + Geo-Scope + Datenschutz-Basis. KI und E-Commerce sind EMPFOHLEN (skip-bar mit Default "Nein"), nicht Pflicht. Niedrige Reibung priorisiert.

3. **Open-Source-Lizenzen: conditional (LAZY)** — package.json-Check läuft automatisch ohne User-Aktivierung. Universal-Status nicht nötig.

4. **Vibe-Coder-Sprache: radikal vereinfachen** — Alltagssprache statt Compliance-Begriffe. Wörterbuch in Marken-Brief Section 28.5.

### Sprint 5 — Re-Definition

**Bisheriger Plan:** Profil-Onboarding (5 Profile + Markt-Achse + Wizard-Modus).

**Neuer Plan:** 3-Pflichtfragen-Onboarding mit Profil-Default-Aktivierung.

**Pflichtfragen:**
1. Profil-Wahl (5 Cards mit Kurzbeschreibung + Beispielen)
2. Geo-Scope (EU / Nicht-EU / Global / Egal)
3. Datenschutz-Basis ("Sammelt ihr Namen, E-Mails oder andere User-Daten?")

**Plus 2 empfohlene (skip-bar, Default "Nein"):**
4. KI-Einsatz ("Nutzt eure App KI?")
5. E-Commerce ("Verkauft ihr etwas?")

**Wizard-Modus:** für Unsichere bei Profil-Wahl. 2-4 Ja/Nein-Fragen leiten zum Profil.

**Persistenz:** eigene Tabelle `project_profiles` mit Wechsel-Tracking. Foreign Key zu `projects`.

**Default für Migration bestehender Projekte:** B2C-App + EU (konservativ, alle Killer aktiv). User kann anpassen.

**LAZY-Detection** (kommt mit Detektoren, nicht im Onboarding):
- Marketing: GA4/FB Pixel im Bundle?
- Platform: capacitor.config/Info.plist?
- Infrastruktur: vercel.json, netlify.toml?
- OSS: package.json GPL-Scan?

### Implementations-Reihenfolge (revidiert, Stand 2026-05-05)

1. ✅ Marken-Brief Section 28 (2026-05-04)
2. ✅ AST-Detektoren Top-5 (2026-05-04)
3. ✅ Dependency-Scanner (2026-05-04)
4. ✅ Config-Analyzer DB-SSL/Dev-Secrets/HTTPS (2026-05-04)
5. ✅ Score-Architektur-Refactor (2026-05-04)
6. ✅ Compliance-Domänen-Architektur (2026-05-05, dieses Update)
7. ✅ **Sprint 5: Profil-Onboarding** (2026-05-05) — Migration, API, getDomainActivation, UI-Modal + Wizard, AuditActions-Integration
8. ✅ **Sprint 6a: UI-Pivot Audit-Detail** (2026-05-05) — ScoreBar Killer-primär, GlobalQuickWinsBar entfernt, FilterChips (Multi-Select, dynamisch), drei Sektionen (Stopper/Empfohlen/Polish), isKillerByRuleId-Heuristik
9. ✅ **Sprint 6b₁: Compliance-Blöcke** (2026-05-05) — DSGVO (5 Fragen) + KI-Act (4 Fragen) + Lighthouse-URL wiederhergestellt, Begrenzungs-Aussagen (Marken-Brief 28.1/28.3), collapsed by default
10. ✅ **Sprint 6b₂: Liste + Verbinden + Cleanup** (2026-05-05) — KillerStatusBadge standalone, Projekteliste Killer-primär, Verbinden-Maske 4 Profil-Fragen entfernt, N/A-Sektion Coach-Header, DsgvoTab/KiActTab/PerformanceTab gelöscht. **Schritt 6 (UI-Pivot) abgeschlossen.**
11. ✅ **Schritt 7: Settings-Profil-Änderbarkeit** (2026-05-05) — ProfileOnboardingModal mit `initialProfile`+`mode='edit'` Props, ProfileDisplayBar im AuditFindingsClient, "Profil ändern"-Button auf Audit-Detail-Seite

> **Update 2026-05-05 (Schritt 8 abgeschlossen — Sprint 8a + 8b):** Coach-Wording für 42 Rules implementiert. limitation-Feld in FindingRow sichtbar. Schritt 9 folgt.

> **Update 2026-05-05 (Sprint 9a + Self-Test):** DB-Migration deployed. Bug gefixt: Domain-Key-Mismatch (`dsgvo`→`privacy`, `ki-act`→`ai`). Verifikation: Solo 36 Rules skipped, B2C 0 Rules skipped.

> **Update 2026-05-05 (Sprint 9b — neue Detektoren):** 4 neue Domain-Detektoren: OSS-Lizenzen (GPL/AGPL/LGPL), Marketing-Tracking, Plattform (App Store), Infrastruktur (Hosting). AuditDomain-Type + RULE_DOMAIN_TO_ACTIVATION erweitert. 193 Regeln total. Solo überspringt Marketing/Platform/Infra/DSGVO/KI-Act/A11y. fixHint-Pattern (Selbst-Prüfungs-Befähigung) für Marketing eingeführt.

> **Update 2026-05-05 (Sprint 9c + Schritt 9 abgeschlossen):** Compliance-Block-Fragen inhaltlich geschärft. **ADR-027 vollständig implementiert — alle 11 Schritte abgeschlossen.**

> **Update 2026-05-05 (Polish-Sprints 9-Polish-1/2/3 abgeschlossen):** UI-Pivot-Abschluss-Runde: Hybrid-Badge (🟡 Veröffentlichbar mit Polish-Bedarf), Pattern-Cluster, Aufwand-Klassen (Quick Win/Mittel/Größer), Score-Header 60/40 mit Mini-Status "Was wir von dir brauchen", Scroll-Anchors, Compliance-Blöcke aufgeräumt. Marken-Position vollständig operativ.
9. ⊘ Schritt 7: Settings-Profil-Änderbarkeit
10. ⊘ Schritt 8: Coach-Wording-Implementation pro Domäne (Vibe-Coder-Wörterbuch)
11. ⊘ Schritt 9: Domain-Detektoren (DSGVO-Scanner, OSS-License-Scanner, etc.)

### Pragmatischer Pfad statt 135-Zellen-Matrix

Opus-Judge wies auf 5×9×3 = 135-Zellen-Matrix hin (Schätzung: 4 Wochen MVP). Diese Komplexität entsteht nicht real, weil:

- LAZY-Detection ist Detektor-Detail, nicht Onboarding-Komplexität
- Aktivierung pro Detektor ist binär ("aktiv für Profil X-Y und Geo-Scope Z")
- Sprint 5 (Onboarding) ist ~5-7h Aufwand
- Domain-Detektoren werden Sprint-für-Sprint dazugebaut (Schritt 9+)

### Konsequenzen

**Positiv:**
- Klarere Coach-Sprache durch radikale Vereinfachung (Marken-Brief Section 28.5)
- Niedrige Onboarding-Reibung (3 Pflichtfragen statt ~25+)
- LAZY-Detection als elegantes Pattern (Coach reagiert auf Code-Sichtbares — Marken-Brief Section 28.6)
- Profile bleiben stabil, nur umbenannt
- Open-Source-Lizenzen als 9. Domäne (echte Risiko-Lücke geschlossen)

**Negativ:**
- `project_profiles` Tabelle muss gebaut werden (mittelschwere Komplexität)
- LAZY-Detection braucht Detektor-Side-Effekte (Sprint 9+)
- Vibe-Coder-Wörterbuch muss gepflegt werden (separater Sprint)

**Risiken:**
- Profil-Default-Drift: wenn Defaults FP-trächtig → Tabelle anpassen
- 3-Pflichtfragen zu wenig: Telemetrie nach Beta prüfen, ggf. auf 5 erhöhen
- LAZY-False-Positives: Allowlist-Disziplin wie bei AST-Detektoren

### Quellen

- `docs/audit-reports/compliance-domains-komitee-2026-05-05.md` — Komitee-Output (€0.48)
- Sparring 2026-05-05 — 4 Spaltungs-Entscheidungen (Timm)
- Marken-Brief Section 28.5/28.6 — Coach-Sprache + LAZY-Detection-Pattern

---

> **Update 2026-05-06 (Sprint 9-Polish-3-Inseln):** ScoreBar (60/40 AppSection dark) ersetzt durch drei helle Insel-Karten oberhalb Findings. KillerStatusIsland (Badge + Coach-Subtext), PolishScoreIsland (Score + Trend ±1%-Schwelle, 3 Zustände), SelfInputIsland (Mini-Status DSGVO/KI-Act/Lighthouse mit Scroll-Anchor). Compliance-Block-Border sachlich (var(--border)). Marken-Brief Pfeiler 28.3 (📋-Marker) konsistent. Neue Dateien: `src/lib/audit/trend.ts`, `_components/IslandsRow.tsx`.

> **Update 2026-05-06 (Sprint 9-Polish-3-FIX):** Compliance-Blöcke-Sichtbarkeits-Bug: `showDsgvo`/`showKiAct` waren fälschlicherweise vom Category-Filter abhängig → auf `true` gesetzt (immer sichtbar). Insel 3 zeigt jetzt immer Mini-Status-Liste (kein Placeholder mehr). Visuelle Angleichung: KillerStatusBadge-Rahmen entfernt, Score-Zahl in `var(--teal)`, `.island--centered`, `align-items: stretch`.

---

> **Update 2026-05-06 (Sprint 9-Critical-Killer):** Severity-Coupling implementiert — `severity='critical'` → automatisch `is_killer=true`. `shouldBeKiller(severity, ruleId)` als zentraler Helper in `killer-rule-ids.ts`. Trigger-Route und page.tsx-Fallback nutzen jetzt `shouldBeKiller`. DB-Migration (20260506000118) setzt alle bestehenden Critical-Findings auf `is_killer=true`. Findings-Sektionen refactored: STOPPER / EMPFOHLEN ZUERST (Top 10, Severity-Hybrid) / WEITERE (mit Severity-Sub-Sektionen Hoch/Mittel/Niedrig). `SectionLabel`-Komponente als Sub-Trenner in WEITERE.

> **Update 2026-05-06 (Sprint Top-10-Bundle):** Fix-Session-Bundle für EMPFOHLEN-ZUERST-Sektion. Bundle-Button im Sektions-Header ruft `/api/audit/fix-session` mit den Top-10-Finding-IDs. Modal zeigt file-gruppierten Prompt via buildFixPrompt. GlobalQuickWinsBar gelöscht. BP8-Versprechen mit besserer Qualität eingelöst (kuratierte Top-10 statt unbegrenzt).
