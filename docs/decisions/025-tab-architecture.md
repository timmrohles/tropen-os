# ADR-025 — Strategische Tab-Architektur und Compliance-Strategie

**Status:** Accepted
**Datum:** 2026-04-29
**Autor:** Timm Rotter
**Quelle:** Strategie-Sparring 2026-04-29
**Verwandte ADRs:** ADR-024 (Marken-Pivot), ADR-018 (Workflow-Engine), BP3 (Tier-Klassifizierung)
**Ersetzt:** Tier-basierte Tab-Struktur (Findings/Metriken/Compliance) aus BP7

---

## Kontext

Nach Build des Tabellen-Welt-Umbaus (Sentry/DataDog-Stil) und mehreren
Visual-Sparring-Runden zur Audit-Seite hat sich gezeigt:

1. Die bisherige Tier-basierte Tab-Struktur (Code-Findings / Metriken / Compliance)
   ist eine **Engineer-Sicht**, keine **User-Sicht**. Vibe-Coder denken in
   Domänen ("Ist meine Seite schnell?", "Bin ich DSGVO-konform?"), nicht in
   Datenherkunft (Code-Analyse vs. Lighthouse vs. Compliance-Datei).

2. Der "Compliance 0"-Tab ist nichtssagend wenn keine Pflichten offen sind —
   der User merkt nicht, dass es Compliance-Bereiche überhaupt gibt.

3. Die Aggregator-Strategie (mehrere Drittanbieter pro Domäne integrieren) ist
   mit Tier-Schnitt nicht sauber abbildbar. Lighthouse, Snyk, axe-core, OWASP
   gehören nicht in einen "Metriken"-Topf.

4. Compliance-Pflichten brauchen User-Input, der heute keinen Ort hat
   (z.B. AVV-Status, Datenschutzbeauftragter, Drittländer-Dienste).

5. Compliance-Tiefe war bisher implizit "Datei existiert ja/nein" — ohne
   formale Festlegung, wie weit Tropen OS in Compliance-Inhalte geht.

Diese fünf Probleme zusammen erfordern eine ehrliche, formale strategische
Entscheidung — nicht weitere UI-Iterationen.

## Entscheidung

Vier zusammenhängende strategische Festlegungen:

### Entscheidung 1 — Compliance-Tiefe: Stufe 1 jetzt, Stufe 2 später

**Stufe 1 (MVP, Q2 2026):** Existenz-Check
- Tropen OS prüft, ob Compliance-relevante Dateien und Endpoints existieren
  (AGB, Datenschutzerklärung, Cookie-Banner, Datenexport-Endpoint, Löschungs-
  Endpoint, AVV-Status etc.)
- Inhaltliche Prüfung erfolgt nicht
- Marketing-Versprechen: "Wir prüfen, ob deine Compliance-Bausteine vorhanden sind"

**Stufe 2 (Roadmap, Q3+ 2026):** Inhaltliche KI-Prüfung
- Tropen OS prüft, ob Pflicht-Inhalte in den Dokumenten enthalten sind
  (z.B. Art. 13 DSGVO-Pflichtangaben in Datenschutzerklärung)
- Geplant als kostenpflichtiges Premium-Feature
- Risiko: Falsch-Positive sind reputations-gefährlich, daher KI-Prompts
  müssen sehr konservativ sein

**Stufe 3 (nicht geplant):** Dialog-geführte Erstellung
- Generierung von Compliance-Dokumenten aus User-Antworten
- **Explizit nicht geplant** wegen Anwalts-Monopol auf Rechtsberatung in
  Deutschland. Tropen OS ist Code-Tool und Compliance-Hilfsmittel, kein
  Rechtsdienstleister.

### Entscheidung 2 — Compliance-Inputs: Variante D

User-Inputs für Compliance-Pflichten werden auf zwei Orte verteilt:

**Stamm-Daten in Projekt-Settings:**
- Org-Name, Sitz, Datenschutzbeauftragter
- Drittländer-Dienste (Liste, initial aus `package.json` erkannt, User ergänzt)
- AVV-Status pro Drittanbieter
- Verarbeitete Datenkategorien (User-Daten, Zahlungsdaten, etc.)

**Pflicht-spezifische Detailfragen inline in den Tabs:**
- Wenn eine spezifische Pflicht eine Detailantwort braucht, die nicht zu den
  Stamm-Daten gehört
- Beispiel im DSGVO-Tab: "Hast du ein Verzeichnis der Verarbeitungstätigkeiten
  nach Art. 30 DSGVO?"
- Antworten werden Projekt-bezogen gespeichert (in `project_compliance_data`)

**Speicher-Architektur:**
- Neue Tabelle `project_compliance_data` mit Feldern `scope` (`master` / `detail`),
  `question_key`, `question_value` (JSONB), `answered_at`, `answered_by`
- RLS pro Projekt
- Antworten persistent über Audit-Runs

### Entscheidung 3 — Drittanbieter-Strategie: Aggregator-Ziel

**Tropen OS positioniert sich langfristig als Aggregator:**
- Eigene AuditEngine bleibt Kern (Code-Findings, Compliance-Existenz)
- Domain-relevante externe Tools werden integriert
- Marketing-Versprechen: "Ein Audit, alle relevanten Werkzeuge"

**Roadmap der Drittanbieter-Integration:**

| Tool | Domain | Status | Priorität |
|------|--------|--------|-----------|
| Lighthouse / PageSpeed Insights | Performance | Geplant Tab-Sprint Phase 4 | Hoch |
| Snyk | Sicherheit | Coming Soon (nach Tab-Sprint) | Hoch |
| axe-core | Barrierefreiheit | Coming Soon (nach Tab-Sprint) | Hoch |
| OWASP ZAP | Sicherheit | Geplant nach Snyk | Mittel |
| WAVE | Barrierefreiheit | Geplant nach axe-core | Mittel |
| WebPageTest | Performance | Optional, nach Lighthouse | Niedrig |
| Pa11y | Barrierefreiheit | Optional | Niedrig |

**Implikationen:**
- Solo-Founder-Wartungsaufwand pro Drittanbieter: ~1-2 Wochen Erst-Integration,
  ~2-4 Stunden pro Quartal danach
- Bei 5-7 Drittanbietern: ~2 Wochen Wartung pro Jahr
- API-Pricing externe Anbieter (Snyk Pro, etc.) wird weitergereicht oder via
  eigene Limits gepuffert
- Schrittweise Integration zwingt zu disziplinierter Priorisierung

### Entscheidung 4 — Tab-Architektur: 6 Domain-Tabs

Sechs Tabs, geschnitten nach Domäne (was wird beurteilt) statt nach Tier
(wie wird gemessen):

| # | Tab | Domain-Code | Status MVP | Datenquellen MVP | Datenquellen Roadmap |
|---|-----|-------------|------------|------------------|---------------------|
| 1 | Code-Qualität | `code-quality` | Aktiv | Eigene AuditEngine | — |
| 2 | Performance | `performance` | Aktiv (Phase 4) | Lighthouse, eigene Bundle-Analyse | WebPageTest |
| 3 | Sicherheit | `security` | Aktiv ab Phase 1 | Eigene Rules + 10 DB-Security-Rules | Snyk, OWASP ZAP |
| 4 | Barrierefreiheit | `accessibility` | Coming Soon | Eigene a11y-relevante Rules | axe-core, WAVE, Pa11y |
| 5 | DSGVO | `dsgvo` | Aktiv | Eigene Rules + User-Inputs | Stufe 2: KI-Prüfung Inhalte |
| 6 | KI-Act | `ki-act` | Aktiv | Eigene Rules + User-Inputs | Stufe 2: KI-Prüfung Inhalte |

**Coming-Soon-Tabs:** Zeigen Coach-Empty-State innerhalb des Tabs ("X-Integration
kommt — ich melde mich"). Nicht versteckt — sichtbares Roadmap-Versprechen.

**Tab-Verhalten:**
- Echte Tab-Views (Klick blendet andere Domain-Inhalte aus, kein Sprungmarken-
  Modus mehr)
- URL-State via Query-Param (`?tab=code-quality`)
- Mobile (<768px): horizontaler Scroll, alle 6 Tabs erreichbar

**Pflicht-Indikator:**
- Roter Dot bei DSGVO/KI-Act, wenn offene Pflichten existieren
- Bei `coming-soon`-Tabs: kein Pflicht-Indikator, stattdessen "Bald"-Badge

### Mapping in der AuditEngine

Jede Rule bekommt ein `domain`-Feld zusätzlich zum bestehenden `tier`-Feld:

```typescript
type AuditDomain =
  | 'code-quality'
  | 'performance'
  | 'security'
  | 'accessibility'
  | 'dsgvo'
  | 'ki-act';
```

Die 183 BP3-klassifizierten Rules werden domain-gemappt (siehe
`docs/audit/domain-mapping.md`). Konservatives Mapping: bei unklarer
Zuordnung Default `code-quality` als Sammeltopf.

## Konsequenzen

### Positiv

- **User-zentrierte Tab-Struktur** statt Engineer-zentrierte Tier-Struktur
- **Compliance bekommt sichtbaren Raum** — drei Tabs (DSGVO, KI-Act, Barriere-
  freiheit) statt einer Sammel-Section
- **Architektonisches Wachstum durch Drittanbieter-Integration** ohne erneute
  Tab-Restrukturierung
- **Marketing-Versprechen "Aggregator"** wird durch Tab-Architektur unterstützt
- **Compliance-Inputs haben definierten Ort** (Variante D)
- **Tiefe-Stufen klar** — keine impliziten Versprechen über Inhalts-Prüfung

### Negativ

- **Sechs Tabs erhöhen UI-Komplexität** (Mobile-Verhalten anspruchsvoll)
- **Zwei Tabs leer (Coming Soon)** bis Drittanbieter integriert — kann als
  unfertig wirken
- **AuditEngine-Mapping** muss erweitert werden (183 Rules)
- **Sprint 1 verschiebt sich** um 2-3 Wochen (BP8/BP9/BP10 nach Tab-Sprint)
- **Tab-Sprint dauert ~14-22 PT** (3-4 Wochen Solo-Founder-Arbeit)

### Risiken

- **Aggregator-Strategie für Solo-Founder ambitioniert** — Wartung von 5-7
  Drittanbieter-Integrationen ist substanziell. Mitigation: schrittweise
  Integration, klare Roadmap-Priorisierung.
- **Vibe-Coder-Validierung (L2) wurde übersprungen** — sechs Domain-Tabs sind
  Founder-Intuition. Mitigation: nach Tab-Sprint mit drei Vibe-Codern testen.
- **Compliance-Stufe-2 ist rechtlich heikel** — falsch-positive Inhalts-
  Prüfungen können als Rechtsrat ausgelegt werden. Mitigation: Stufe 2 nur mit
  klarem Disclaimer "Hilfsmittel, ersetzt keine Rechtsberatung".
- **Coming-Soon-Tabs als Marketing-Risiko** — wenn Snyk-Integration sich um
  Monate verzögert, wirkt das Tab-Versprechen leer. Mitigation: realistische
  Roadmap, in `docs/product/roadmap-2026-q2.md` dokumentiert.

## Implementierung

Build-Prompt: `docs/superpowers/plans/2026-04-29-tab-sprint-domain-architektur.md`

Vier sequenzielle Phasen:
1. Domain-Mapping in der AuditEngine (Rules + Filter-Helper) + DB-Sicherheit-Rules
2. Tab-Struktur umbauen (sechs Tabs, Coming-Soon-States, URL-Routing)
3. Compliance-Inputs-Architektur (Settings + Inline-Detailfragen)
4. Lighthouse-Integration in Performance-Tab

Sprint 1 (BP8/BP9/BP10) wird nach Tab-Sprint aufgenommen.

## Validierung

Nach Tab-Sprint-Abschluss:
- L2 Vibe-Coder-Outreach (3 Calls in 1 Woche)
- Mocks der sechs Tabs zeigen, Reaktionen sammeln
- Bei negativem Feedback: ADR-025 erweitert oder ersetzt durch ADR-026

## Referenzen

- `docs/marken-brief.md` — Coach-Stimme, App-Welt-Disziplinen
- `docs/audit/domain-mapping.md` — Rule-zu-Domain-Mapping (Tab-Sprint Phase 1)
- `docs/superpowers/plans/2026-04-29-tab-sprint-domain-architektur.md` — vollständiger Build-Prompt
- ADR-024 — Marken-Pivot

---

## Update 2026-04-29 — Datenbank-Sicherheit als Phase-1-Erweiterung

**Anlass:** Mehrere bekannte Pressefälle zu offen liegenden Supabase-Datenbanken
bei Vibe-Coder-Projekten und auch bei größeren Unternehmen. Supabase macht
RLS standardmäßig optional, was zu systematischer Vernachlässigung von
Datenbank-Sicherheit führt.

**Marktbeobachtung:** Datenbank-Sicherheit ist aktuell ein Thema mit medialer
Aufmerksamkeit. Tropen OS kann hier Coach-Position einnehmen ("Wir prüfen, was
Supabase nicht erzwingt") und gleichzeitig DACH-Compliance-Moat stärken
(DSGVO Art. 32: Sicherheit der Verarbeitung).

**Entscheidung:** ~10 Datenbank-Sicherheit-Rules werden in Tab-Sprint Phase 1
mitgeschrieben. Sie landen in Domain `security` und füllen den Sicherheit-Tab
ab Tag 1 (statt nur Coming-Soon-State).

**Begründung:**
- Marktrhythmus passt (mediale Aufmerksamkeit)
- Disziplin-konform (innerhalb des laufenden Sprints, kein neuer Sprint)
- Sicherheits-Tab wird sofort substantiell, nicht nur Roadmap-Versprechen
- Marketing-Story tragfähig: "Wir prüfen heute, was Supabase nicht erzwingt"
- DSGVO-Verbindung: offene DB = Art. 32-Verstoß = Bußgeld-Risiko

**Aufwand:** +2-3 PT in Phase 1 des Tab-Sprints.

**Folge-Builds (Backlog Q3+, separat zu planen):**
- **BP-Sec-1** — Erweiterung auf weitere DB-Provider (Firebase, Drizzle, Prisma,
  Postgres direkt), Connection-String-Sicherheit, API-Endpoint-Härtung
- **BP-Sec-2** — Marketing-Use-Case-Sektion auf Landing-Page mit konkreten
  Beispiel-Findings ("Datenbank-Sicherheit für Vibe-Coder")
- **BP-Sec-3** — Continuous Monitoring (DB-Sicherheit als wiederkehrender
  Check, nicht nur einmal-Audit, Alerts bei neuen CVEs)

**Initiale 10 Rules:**

| ID | Rule | Severity | Pflicht-Tag |
|----|------|----------|-------------|
| sec-db-01 | RLS auf allen User-Daten-Tabellen aktiviert | critical | DSGVO-Pflicht |
| sec-db-02 | Service-Role-Key nicht im Frontend-Code | critical | Sicherheits-kritisch |
| sec-db-03 | Anon-Key hat keine Schreibrechte auf sensible Tabellen | high | Sicherheits-kritisch |
| sec-db-04 | Public-Schema enthält keine Personendaten ohne RLS | critical | DSGVO-Pflicht |
| sec-db-05 | RLS-Policies sind aktiviert, nicht nur definiert | high | Sicherheits-kritisch |
| sec-db-06 | Auth-Tabellen haben striktere RLS als Daten-Tabellen | high | — |
| sec-db-07 | Storage-Buckets haben definierte Zugriffs-Policies | high | DSGVO-Pflicht |
| sec-db-08 | Edge Functions verwenden nicht Service-Role-Key in User-Context | critical | Sicherheits-kritisch |
| sec-db-09 | Realtime-Subscriptions filtern Daten serverseitig | high | — |
| sec-db-10 | Backup-Strategie dokumentiert (PITR aktiv) | medium | DSGVO-Pflicht (Art. 32) |

**Marken-Brief-Anker für Coach-Stimme der Rules:**

Beispiel sec-db-01 (RLS fehlt):
> "Tabelle `user_profiles` hat keine RLS aktiviert — alle User können alle Profile sehen. Das ist DSGVO-Pflicht (Art. 32) und ein klassischer Vibe-Coder-Stolperstein. Hier ist ein Fix-Prompt für Cursor:"

Beispiel sec-db-02 (Service-Role im Frontend):
> "`supabaseAdmin` taucht in `src/components/UserList.tsx` auf — das ist der Service-Role-Key, der Server-Only sein muss. Sonst kann jeder User deine komplette Datenbank lesen. Hier ist die Korrektur:"

Stimm-Formel: Beobachtung + Konsequenz + Vorschlag.

**Sicherheits-Tab Status nach Phase 1:**
Tab 3 (Sicherheit) ist damit ab Tag 1 substantiell befüllt — kein Coming-Soon mehr.
Die Tab-Konfig in page.tsx wird entsprechend angepasst: `comingSoon: false` für `security`.
