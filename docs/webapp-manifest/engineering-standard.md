# Engineering Standard
## Ebene 2 — Konkrete Regeln pro Kategorie

> Dieses Dokument ist der operative Teil des Web Application Manifests.  
> Jede Regel hat eine Gewichtung und gibt an, ob sie automatisierbar ist.  
> Für die Bewertung → `audit-system.md`

---

## Kategorien

1. [Architektur](#1-architektur)
2. [Code-Qualität](#2-code-qualität)
3. [Sicherheit](#3-sicherheit)
4. [Datenschutz & Compliance](#4-datenschutz--compliance)
5. [Datenbank](#5-datenbank)
6. [API-Design](#6-api-design)
7. [Performance](#7-performance)
8. [Skalierbarkeit](#8-skalierbarkeit)
9. [State Management](#9-state-management)
10. [Testing](#10-testing)
11. [CI/CD](#11-cicd)
12. [Observability](#12-observability)
13. [Backup & Disaster Recovery](#13-backup--disaster-recovery)
14. [Dependency Management](#14-dependency-management)
15. [Design System](#15-design-system)
16. [Accessibility](#16-accessibility)
17. [Internationalisierung](#17-internationalisierung)
18. [Dokumentation](#18-dokumentation)
19. [Git Governance](#19-git-governance)
20. [Cost Awareness](#20-cost-awareness)
21. [PWA & Resilience](#21-pwa--resilience)
22. [AI Integration](#22-ai-integration)
23. [Infrastructure](#23-infrastructure)
24. [Supply Chain Security](#24-supply-chain-security)
25. [Namenskonventionen & Dateihygiene](#25-namenskonventionen--dateihygiene)

---

## 1. Architektur

> *Principle: Architecture before Code*

**Pflichten**

- **ADRs** (Architecture Decision Records) für alle wesentlichen Entscheidungen: Kontext → Entscheidung → Konsequenzen
- **Klare Schichtenarchitektur**: Presentation / Application / Domain / Infrastructure — Abhängigkeiten fließen immer nach innen
- **Standardisierte Projektstruktur:**
  ```
  /src
    /components   # UI, rein presentational
    /features     # self-contained Feature-Module
    /services     # Business-Logik, Use Cases
    /api          # Externe Kommunikation
    /store        # State Management
    /types        # TypeScript-Definitionen
    /config       # App-Konfiguration
  /tests
  /docs/adr
  ```
- Keine Business-Logik in UI-Komponenten oder Route-Handlern
- Keine zirkulären Abhängigkeiten

**Tools:** `eslint-plugin-boundaries`, `dependency-cruiser`

**Warnsignale**
- Alles flach in `/src`, keine erkennbare Ownership
- `utils.js` mit 2.000 Zeilen und 60 unzusammenhängenden Funktionen
- Dateien > 500 Zeilen ohne Begründung
- Geschäftslogik direkt in React-Komponenten

---

## 2. Code-Qualität

> *Principle: Code is read more than written*

**Pflichten**

- TypeScript `"strict": true`, kein ungeklärtes `any`
- ESLint + Prettier, Lint-Fehler blockieren Commits (Pre-Commit-Hook via Husky)
- Naming Conventions:

  | Kontext | Convention | Beispiel |
  |---------|-----------|---------|
  | Variablen/Funktionen | camelCase | `getUserById` |
  | Komponenten | PascalCase | `UserProfile` |
  | Konstanten | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
  | Dateien | feature-orientiert | `UserProfile.tsx` |

- Keine Magic Numbers/Strings — immer benannte Konstanten
- Fehlertypen explizit modelliert, kein leerer `catch`-Block
- Funktionen: Single Responsibility, max. ~30 Zeilen als Orientierung
- **Cognitive Complexity:** Funktionen ≤ 15 (menschlicher Code), ≤ 8 (KI-generierter Code) — KI schreibt technisch korrekten, aber kognitiv dichten Code mit tief verschachtelten Conditions und langen Methoden

**Tools:** `eslint` mit `sonarjs/cognitive-complexity`, SonarQube Cloud (AI Code Assurance)

**Warnsignale**
- KI-generierte Variablennamen ohne Domänenbezug (`data`, `result`, `item`, `temp`)
- Verschachtelungstiefe > 4 Ebenen
- `// fix later` als einzige Erklärung
- `console.log` als Fehlerbehandlung in Produktion
- Cognitive Complexity > 15 in einer Funktion ohne Begründung

---

## 3. Sicherheit

> *Principle: Security is Baseline, not Feature*

**Pflichten**

- Authentication und Authorization strikt getrennt, kein DIY-Auth ohne Security-Review
- **Auth-Härtung:**
  - Access Tokens: max. 15 Minuten Gültigkeit
  - Refresh Token Rotation: nach jedem Einsatz neues Token, altes invalidiert
  - Session-Invalidierung bei Logout serverseitig erzwingen (kein "nur Cookie löschen")
  - "Remember me" nur mit sicherem, rotierten Refresh Token — nie mit langlebigem Access Token
- OWASP Top 10 bekannt und adressiert (Injection, XSS, Broken Access Control, ...)
- Serverseitige Input-Validierung für jeden Endpunkt (Zod, Yup o.ä.)
- Parametrisierte Queries — niemals String-Konkatenation für SQL
- Keine Secrets im Code oder in der Git-History
- HTTP-Sicherheitsheader gesetzt:
  ```
  Content-Security-Policy
  Strict-Transport-Security (HSTS)
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy
  ```
- Rate Limiting auf allen öffentlichen Endpunkten
- Brute-Force-Schutz auf Auth-Endpunkten
- **Boilerplate & Template-Hygiene:**
  - Alle Default-Credentials aus Frameworks und Bibliotheken entfernen (Admin/Admin, Password123, test/test)
  - Admin-Panels (`/admin`, `/dashboard`, `/superadmin`) nie öffentlich ohne Auth erreichbar
  - Framework-Defaults kritisch prüfen und überschreiben (z.B. `create-next-app`, Supabase Studio)
  - Debug-Endpoints und Beispiel-Routes aus Produktion entfernen
- **E-Mail-Sicherheit (SPF / DKIM / DMARC):**
  - SPF-Record für alle sendenden Domains konfiguriert (`v=spf1 ... -all`)
  - DKIM-Signierung für ausgehende E-Mails aktiv
  - DMARC-Policy gesetzt (mindestens `p=quarantine`, Ziel: `p=reject`)
  - Rate Limiting auf "Passwort vergessen"- und Invite-Flows (max. 3–5 Versuche / Stunde pro IP)
  - Keine sensiblen Daten in E-Mail-Links — nur kurzlebige, einmalig verwendbare Tokens
- **Patch-Management:**
  - Vulnerability Disclosure Policy dokumentiert (wie meldet jemand eine Lücke?)
  - Patch-Reaktionszeiten definiert: kritische CVEs < 24 h, hohe CVEs < 7 Tage
  - Security-Monitoring für neue CVEs in genutzten Packages (Dependabot Alerts, Snyk Monitor)
- **SSRF-Schutz (Server-Side Request Forgery):**
  - Alle server-seitigen HTTP-Anfragen mit User-kontrollierten URLs validieren
  - Allowlist statt Blocklist für erlaubte Ziel-Domains und -IPs
  - Interne IP-Ranges blockieren (169.254.x.x, 10.x.x.x, 172.16.x.x, 192.168.x.x)
  - URL-Parsing nie dem LLM-generierten Code überlassen — dedizierte Bibliothek verwenden
- **CSRF-Schutz:**
  - Session-Cookies mit `SameSite=Strict` oder `SameSite=Lax` gesetzt
  - CSRF-Tokens auf allen state-ändernden Endpunkten (POST, PUT, PATCH, DELETE)
  - Double-Submit-Cookie-Pattern oder synchronizer Token Pattern
- **Object-Level Authorization (OWASP #1):**
  - Jede Ressource prüft ob der anfragende User Owner oder Berechtigter ist — nicht nur ob er eingeloggt ist
  - Keine IDs direkt aus Request übernehmen ohne Ownership-Check (Insecure Direct Object Reference)
  - RBAC allein reicht nicht — zusätzlich Row-Level-Checks auf Datenbankebene

**Tools:** `npm audit`, `snyk`, `semgrep`, `gitleaks`, `OWASP ZAP`

**Warnsignale**
- SQL-String-Konkatenation mit Nutzereingaben
- `dangerouslySetInnerHTML` ohne Sanitization
- CORS `*` in Produktion
- Admin-Bereiche ohne Rollen-Check
- JWT mit `alg: none`
- Access Token mit Gültigkeit > 1 Stunde
- Kein SPF/DKIM/DMARC für sendende Domain
- Default-Credentials aus Boilerplate nicht entfernt
- "Passwort vergessen" ohne Rate Limiting
- Server-seitige HTTP-Anfragen ohne URL-Validierung (SSRF)
- Kein `SameSite` auf Session-Cookies (CSRF)
- Resource-IDs aus dem Request ohne Ownership-Check verwendet

---

## 4. Datenschutz & Compliance

> *Principle: Data is a Liability, not an Asset*

**Pflichten**

- Privacy by Design & Default — Datensparsamkeit, datenschutzfreundliche Defaults
- Rechtsgrundlagen nach Art. 6 DSGVO für jede Datenkategorie dokumentiert
- Technische Umsetzung der Betroffenenrechte:

  | Recht | Technische Umsetzung |
  |-------|---------------------|
  | Auskunft | Daten-Export auf Anfrage |
  | Löschung | Vollständige Löschung inkl. Backups (mit Zeitplan) |
  | Berichtigung | Nutzerdaten editierbar |
  | Portabilität | Maschinenlesbarer Export (JSON/CSV) |

- Consent-Management ohne Dark Patterns, Einwilligungen protokolliert
- AVV mit allen Drittanbietern, die PII verarbeiten
- Keine PII in Logs (Passwörter, Tokens, E-Mail-Adressen, IDs ohne Pseudonymisierung)

**AI Act (ab 2026)**
- Klassifizierung jedes KI-Systems nach Risikokategorie (minimal / begrenzt / hoch / inakzeptabel)
- Hochrisiko: Technische Dokumentation, Konformitätsbewertung, Human Oversight
- Transparenzpflicht: Nutzer müssen wissen, wenn sie mit KI interagieren
- KI-generierte Inhalte müssen als solche erkennbar sein

**Warnsignale**
- Google Analytics ohne Einwilligung aktiv
- Kein VVT (Verzeichnis der Verarbeitungstätigkeiten)
- KI-Entscheidungen ohne menschliche Kontrollmöglichkeit
- Datenschutzerklärungs-Template ohne Anpassung

---

## 5. Datenbank

**Pflichten**

- Schema-Design und ERD vor Implementierung, Review-Pflicht
- Normalisierung: mindestens 3. Normalform als Ausgangspunkt; Denormalisierung nur begründet und gemessen
- Index-Strategie:
  - Alle Fremdschlüssel indiziert
  - Alle WHERE-, ORDER BY-, JOIN-Felder geprüft
  - Zusammengesetzte Indizes für häufige Query-Muster
  - Slow-Query-Log aktiviert, regelmäßig analysiert
- Migrationen versioniert und reversibel (Prisma Migrate, Flyway, Drizzle, Liquibase)
- Datenbankzugriff nach Principle of Least Privilege (kein `GRANT ALL` für App-User)
- API-Latenz-Budget: DB-Queries < 50 ms (p95), Slow-Query-Grenze konfiguriert
- **BaaS-Sicherheit (Supabase, Firebase, PocketBase o.ä.):**
  - Row-Level-Security (RLS) auf **allen** Tabellen zwingend aktiviert — keine Ausnahmen ohne explizite Begründung
  - Service Role Key / Admin Key nie im Frontend-Bundle, nie im Client-Code
  - Anon Key nur mit minimal nötigen Rechten (read-only wo möglich)
  - RLS-Policies nach jedem Schema-Change reviewen — neue Tabellen haben standardmäßig keine Policies

**Warnsignale**
- Keine FK-Constraints (fehlende referentielle Integrität)
- Alles nullable ohne Grund, `varchar(255)` überall
- JSON-Blobs für Daten, die aktiv gefiltert werden müssen
- N+1-Query-Probleme
- Direkter Datenbankzugriff aus dem Frontend
- RLS deaktiviert oder keine Policies auf Tabellen mit Nutzerdaten
- Service Role Key im Frontend-Bundle oder öffentlichem Repository

---

## 6. API-Design

> *Eine API ist ein Vertrag — brichst du ihn, brichst du Vertrauen.*

**Pflichten**

- Versionierung von Tag 1: `/api/v1/`
- HTTP-Verben semantisch korrekt, Status-Codes bedeutungsvoll
- Konsistente Fehler-Antwort-Struktur über alle Endpunkte
- Input- und Output-Validierung, kein Over-Sharing sensibler Felder
- OpenAPI/Swagger-Dokumentation, möglichst auto-generiert
- Resilience-Patterns für alle externen Aufrufe:

  | Pattern | Einsatz |
  |---------|---------|
  | Timeout | Jeder externe Call hat ein Limit |
  | Retry + Backoff | Transiente Fehler |
  | Circuit Breaker | Cascade-Failure verhindern |
  | Graceful Degradation | Fallback bei Ausfall |

- Webhook-Signaturen validieren, Events idempotent verarbeitbar
- Drittanbieter immer hinter Abstraktionsschicht kapseln

**Warnsignale**
- Vendor-SDK direkt in UI-Komponenten oder Business-Logik
- Keine Fehlerbehandlung bei externen Calls
- Kein Timeout definiert
- Fehlende Webhook-Signaturvalidierung

---

## 7. Performance

> *Principle: Performance is a Feature*

**Zielwerte (Core Web Vitals)**

| Metrik | Ziel |
|--------|------|
| LCP | < 2,5 s |
| INP | < 200 ms |
| CLS | < 0,1 |
| TTFB | < 800 ms |
| API-Latenz (p95) | < 300 ms |
| DB-Query (p95) | < 50 ms |

**Pflichten**

- Bundle-Analyse als Teil des Build-Prozesses, Code-Splitting und Lazy Loading
- Bilder: moderne Formate (WebP/AVIF), `srcset`, Lazy Loading, CDN
- Caching-Strategie auf allen Ebenen (HTTP-Header, API-Responses, DB-Layer)
- Keine Pagination vergessen — kein Endpunkt liefert unbegrenzte Listen

**Tools:** Lighthouse, WebPageTest, Bundle Analyzer, `k6`

**Warnsignale**
- Lighthouse Score < 70 in Produktion ohne Begründung
- Unkomprimierte Assets > 1 MB
- Globale App ohne CDN
- Synchrone blockierende Operationen im Main Thread

---

## 8. Skalierbarkeit

> *Principle: Failure is not an Exception*

**Pflichten**

- Stateless App-Server — kein lokaler Session-State, alles in externen Stores (DB, Redis)
- Job-Queue für alle Tasks > 3–5 Sekunden (BullMQ, Celery, AWS SQS)
- Lasttests vor jedem signifikanten Launch, Ergebnisse dokumentiert
- Scaling-Runbook: Team weiß, welche Komponente zuerst zum Bottleneck wird

**Warnsignale**
- Sessions im lokalen Dateisystem
- Alle Operationen synchron im Request-Response-Zyklus
- Kein Lasttest vor Go-Live

---

## 9. State Management

**State-Kategorien und passende Tools**

| Kategorie | Beispiele | Empfohlener Ansatz |
|-----------|-----------|-------------------|
| Server State | API-Daten, Cache | React Query, SWR, Apollo |
| Client State | Modal offen/zu | useState, useReducer |
| Global State | Auth, Theme | Zustand, Redux Toolkit, Jotai |
| URL State | Filter, Pagination | URL Params, Router State |
| Form State | Felder, Validierung | React Hook Form, Formik |

**Pflichten**

- Kein globaler Store für State, der lokal sein könnte
- Unidirektionaler Datenfluss, keine unkontrollierten Side-Effects
- Optimistic Updates immer mit Rollback-Logik

**Warnsignale**
- API-Calls direkt in `useEffect` ohne Caching-Layer
- Globaler Store als Mülleimer für jeden Zustand
- Prop-Drilling über mehr als 3 Ebenen

---

## 10. Testing

> *Ohne Tests bist du Hoffnungsträger, kein Entwickler.*

**Testing-Pyramide**

```
      /\
     /E2E\          Playwright / Cypress — wenige, kritische Flows
    /------\
   / Integ. \       API-Tests mit echter Test-DB
  /----------\
 / Unit Tests \     Jest / Vitest — ≥ 80% Coverage für Business-Logik
/_____________ \
```

**Pflichten**

- Unit Tests: ≥ 80% Coverage für Business-Logik und Utilities, deterministisch
- Integration Tests: API-Endpunkte mit echter (Test-)DB, externe Services gemockt
- E2E Tests: alle kritischen User-Journeys (Registration, Login, Core-Flow, Payment)
- Tests laufen in der CI-Pipeline — kein Merge ohne grüne Tests
- Regressions-Test für jeden Bug-Fix
- **KI-generierter Code: strengerer Quality-Gate**
  - Coverage auf neuem KI-Code: ≥ 90% (statt 80%) — KI kann Tests sofort generieren, daher höherer Standard
  - Duplikate in neuem Code: ≤ 1% (statt 3%) — KI neigt zu Copy-Paste-Patterns
  - Jeder neue Security Hotspot muss reviewed sein, bevor Merge erlaubt ist
  - Re-Test nach jedem KI-generierten Change — nicht auf Point-in-Time-Reviews verlassen

**Warnsignale**
- Keine Tests vorhanden
- Tests nur für einfache Teile, nicht für Business-Logik
- `expect(true).toBe(true)` als Testfall

---

## 11. CI/CD

> *Principle: Automate what Repeats*

**Pipeline-Minimum**

```
Push → Lint → Type Check → Unit Tests → Build → Integration Tests 
     → Deploy Staging → E2E Tests → Deploy Production
```

**Pflichten**

- Branch-Schutz: kein direkter Push auf `main` oder `develop`
- Mindestens 3 Umgebungen: Dev, Staging, Prod — Staging ist Prod-Spiegel
- Zero-Downtime Deployments (Blue/Green oder Rolling)
- Datenbankmigrationen abwärtskompatibel — nie Breaking Migration + Code-Deploy gleichzeitig
- Rollback-Strategie definiert und getestet
- Infrastructure as Code (Terraform, Pulumi, CDK) — kein manuelles Klicken in der Console

**Warnsignale**
- Manueller Deploy via FTP/SSH
- Kein Staging
- Tests laufen nicht in der Pipeline
- Keine Rollback-Möglichkeit

---

## 12. Observability

> *Principle: Systems must be Observable — Logs + Metrics + Traces*

**Die drei Säulen**

| Säule | Zweck | Tools |
|-------|-------|-------|
| Logs | Was ist passiert? | Structured Logging (JSON), kein PII |
| Metrics | Wie verhält sich das System? | Prometheus, Datadog, CloudWatch |
| Traces | Warum ist es passiert? | OpenTelemetry, Jaeger, Tempo |

**Pflichten**

- Structured Logs (JSON): Timestamp, Level, Service, Trace-ID, Message, Context
- Kein `console.log` in Produktion, kein PII in Logs
- Error-Tracking (Sentry o.ä.) in allen Umgebungen, Alerts bei Anomalien
- APM für kritische Endpunkte (Latenz, Error-Rate, Throughput)
- Uptime Monitoring extern, Alerting an das Team (PagerDuty, OpsGenie)
- Status-Page für Nutzer
- Business-KPIs messen (Conversion, Fehlerquote in Kern-Flows)

**Warnsignale**
- Fehler nur durch Nutzerbeschwerden sichtbar
- Keine Performance-Baseline bekannt
- Logs unstrukturiert oder gänzlich fehlend

---

## 13. Backup & Disaster Recovery

> *Ein Backup das nie getestet wurde, ist kein Backup — es ist Hoffnung.*

**Backup-Pflichten**

- 3-2-1-Regel: 3 Kopien, 2 Medientypen, 1 Offsite/Off-Cloud
- Automatisierte Backup-Frequenzen:

  | Datenkategorie | Frequenz | Retention |
  |----------------|----------|-----------|
  | Produktionsdatenbank | Stündlich (inkrementell), täglich (full) | 30 Tage |
  | User-Uploads / Medien | Täglich | 90 Tage |
  | Konfiguration / IaC | Bei Änderung (Git) | Unbegrenzt |
  | Logs | Täglich archiviert | 12 Monate |

- Point-in-Time-Recovery (PITR) für kritische Datenbanken
- Restore monatlich getestet, Ergebnisse dokumentiert

**Disaster Recovery**

- RTO/RPO pro System definiert:

  | Metrik | Definition | Ziel |
  |--------|------------|------|
  | RTO (Recovery Time Objective) | Max. Ausfallzeit | < 4 h |
  | RPO (Recovery Point Objective) | Max. Datenverlust | < 1 h |

- DR-Runbook vorhanden, aktuell und nicht nur auf dem betroffenen System erreichbar
- Incident-Klassifizierung:

  | Severity | Beschreibung | Reaktionszeit |
  |----------|-------------|---------------|
  | SEV1 | Komplette Plattform down | Sofort |
  | SEV2 | Kritische Teilfunktion down | < 1 h |
  | SEV3 | Performance-Degradation | < 4 h |

- Kommunikationsplan und Verantwortliche im Runbook benannt

**Warnsignale**
- Backups existieren, Restore wurde nie getestet
- Backup liegt auf derselben Infrastruktur wie Primärdaten
- Kein DR-Runbook
- RTO/RPO nicht definiert

---

## 14. Dependency Management

**Pflichten**

- Lockfiles committed (`package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`)
- Pre-Commit-Hook verhindert Secret-Commits (`gitleaks`, `detect-secrets`)
- Node.js-Version in `.nvmrc` oder `engines` in `package.json` fixiert
- `npm audit` / `snyk` in CI — kritische CVEs blockieren Deploy
- Renovate Bot oder Dependabot für automatische Update-PRs
- `.env.example` vollständig und aktuell — keine echten Werte

**Warnsignale**
- Keine Lockfiles
- Kritische CVEs in `npm audit` ohne Maßnahmenplan
- `node_modules` im Git-Repository
- Unterschiedliche Node-Versionen im Team

---

## 15. Design System

**Pflichten**

- Design-Tokens als Single Source of Truth:

  | Token-Ebene | Beispiel |
  |-------------|---------|
  | Primitive | `color-blue-500: #3B82F6` |
  | Semantic | `color-primary: {color-blue-500}` |
  | Component | `button-background: {color-primary}` |

- Tokens zwischen Figma und Codebase synchronisiert (Tokens Studio, Style Dictionary)
- Komponentenbibliothek mit Dokumentation (Storybook)
- Component Lifecycle definiert:

  | Status | Bedeutung |
  |--------|-----------|
  | `draft` | In Entwicklung, nicht für Produktion |
  | `stable` | Produktionsreif, dokumentiert |
  | `deprecated` | Auslaufend, Migrationspfad dokumentiert |

- Kein Hard-Coding von Farben, Spacing oder Typografie in Komponenten
- Theming über Token-Austausch, nicht CSS-Override-Wildwuchs

**Warnsignale**
- Designer liefern Mockups ohne Entsprechung in Codekomponenten
- Inkonsistente Farben, Abstände, Schriftgrößen durch die gesamte App
- Kein Storybook oder äquivalente Komponentendokumentation

---

## 16. Accessibility

> *Accessibility ist kein Komfort — es ist Qualität für alle.*

**Pflichten**

- WCAG 2.1 Level AA als Minimum
- Semantisches HTML (`<button>`, `<nav>`, `<main>` — kein `<div>` für alles)
- ARIA-Attribute korrekt und sparsam eingesetzt (nur wo HTML nicht ausreicht)
- Fokus-Management bei Modals und dynamischen Inhalten
- Farbkontrast: ≥ 4,5:1 (Normaltext), ≥ 3:1 (Großtext)
- Keine Information ausschließlich durch Farbe kommuniziert
- Testing: automatisiert (axe-core, Lighthouse) + manuell (Tastatur, Screen Reader)

**Warnsignale**
- Buttons ohne sichtbares Focus-Styling
- Fehlende Alt-Texte auf informativen Bildern
- Formulare ohne Labels
- Accessibility noch nie getestet

---

## 17. Internationalisierung

> *Nachträgliche i18n kostet das Dreifache.*

**Pflichten**

- i18n-Framework von Tag 1, auch bei zunächst einsprachigen Projekten (`react-i18next`, `next-intl`)
- Alle User-facing Strings externalisiert — kein Hardcoding
- Locale-sensitive Formatierung via Intl API oder Bibliothek:
  - Datum/Uhrzeit
  - Zahlen und Währungen
  - Plural-Regeln und Gender-Formen (ICU Messages)
- Fallback-Locales definiert
- RTL-Unterstützung: Logical CSS Properties (`margin-inline-start` statt `margin-left`)
- Übersetzungs-Workflow mit Tool-Unterstützung (Lokalise, Phrase, Crowdin)
- Tests stellen sicher, dass neue Features i18n-fähig sind

**Warnsignale**
- UI-Texte direkt im JSX
- Festes Datumformat (`MM/DD/YYYY`) ohne Locale-Berücksichtigung
- Kein i18n-Framework in einer App, die skalieren soll

---

## 18. Dokumentation

> *Principle: Systems must survive their Creators*

**Pflichten**

- README enthält: Projektzweck, lokales Setup (Schritt für Schritt), Tests ausführen, Deployment, weiterführende Doku
- Onboarding-Ziel: neuer Entwickler ist ≤ 30 Minuten produktiv — sonst ist die Dokumentation unzureichend
- ADRs für alle Schlüsselentscheidungen unter `/docs/adr/`
- API-Dokumentation auto-generiert (OpenAPI/Swagger, GraphQL-Schema)
- Code-Kommentare erklären **warum**, nicht was:
  ```typescript
  // Wir starten bei 1, nicht 0 — die externe API erwartet 1-basierte Paginierung
  const page = startPage + 1;
  ```
- CHANGELOG nach Keep-a-Changelog-Format

**Warnsignale**
- README fehlt oder ist veraltet
- „Frag Entwickler X" als einzige Dokumentationsstrategie
- Business-Logik, die nirgendwo erklärt ist

---

## 19. Git Governance

**Pflichten**

- Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`
- Atomare Commits — ein Commit, eine logische Änderung
- Branch-Schutz für `main` und `develop`: kein Force Push, kein direkter Push, min. 1 Approval, CI muss grün sein
- Semantic Versioning: `MAJOR.MINOR.PATCH`
- Secrets in der History → sofortiger Rewrite (`git filter-repo`) + Credential-Rotation

**Warnsignale**
- Commit-Messages: „fix", „update", „asdf", „wip123"
- Direkte Commits auf `main`
- Feature-Branches, die wochenlang nicht gemergt werden

---

## 20. Cost Awareness

> *Principle: Dependencies must be Replaceable*

**Pflichten**

- Budget-Alerts in allen Cloud-Accounts, monatliches Cost-Review
- Tagging-Strategie für alle Cloud-Ressourcen (Projekt, Team, Environment)
- Rate Limiting und Caching für kostenintensive APIs — besonders LLM-APIs (Token-Budget pro Nutzer)
- Abstraktionslayer für kritische Drittanbieter + dokumentierte Exit-Strategie
- Lizenz-Compliance-Check in CI (FOSSA, License Checker)
- Ungenutzte Ressourcen regelmäßig bereinigen

**Warnsignale**
- Keine Budget-Alerts
- LLM-API ohne Token-Limits oder Nutzer-Kontingente
- Drittanbieter direkt ohne Abstraktionsschicht eingebunden
- Keine Exit-Strategie für kritische externe Dienste

---

## 21. PWA & Resilience

> *Eine moderne Webapp funktioniert offline sinnvoll und degradiert elegant.*

**Pflichten**

- Valides `manifest.json`: Name, Icons (min. 192×192 und 512×512), Start-URL, Theme-Color, Display-Mode
- Service Worker mit definierter Caching-Strategie:

  | Strategie | Einsatz |
  |-----------|---------|
  | Cache First | Statische Assets, Fonts |
  | Network First | API-Calls, dynamische Inhalte |
  | Stale While Revalidate | Häufig aktualisierte Inhalte |

- Offline-Fallback für Kernfunktionen
- Korrekte HTTPS-Konfiguration (Pflicht für Service Worker)
- Installierbarkeit (Add-to-Home-Screen) geprüft
- Grundfunktionen ohne JavaScript erreichbar, wo fachlich sinnvoll (Progressive Enhancement)

**Warnsignale**
- App bricht komplett ohne Internet/JS
- Kein `manifest.json` oder fehlerhaft
- Kein Service Worker trotz klarem Offline-Use-Case

---

## 22. AI Integration

> *KI-Features folgen denselben Standards wie jedes andere System — plus eigene Risiken.*

**Pflichten**

- Prompt Injection Defense: Nutzereingaben werden niemals unkontrolliert in System-Prompts eingefügt
- Token-Limits pro Request und pro Nutzer definiert und durchgesetzt
- Fallback-Strategie bei Modellausfall (Fallback-Modell oder Graceful Degradation)
- LLM-Outputs werden validiert, bevor sie in Business-Logik oder UI fließen
- Caching-Strategie für identische Prompts (Kostenkontrolle)
- KI trifft keine finalen Business-Entscheidungen ohne menschliche Kontrollmöglichkeit
- Deterministic Mode (Temperature 0) wo reproduzierbare Ergebnisse nötig sind
- AI Act Klassifizierung: Risikokategorie des KI-Systems dokumentiert

**Warnsignale**
- LLM entscheidet Business-Logik ohne Validation
- Keine Token-Limits — Kosten können explodieren
- Nutzereingaben direkt in Prompts (Injection-Risiko)
- Keine Caching-Strategie für teure LLM-Calls

---

## 23. Infrastructure

> *Principle: Failure is not an Exception — auf Infrastrukturebene.*

**Pflichten**

- Multi-AZ Deployment für produktionskritische Systeme
- Health Checks für alle Services (Liveness + Readiness)
- Autoscaling konfiguriert und getestet (horizontal skalierbar)
- Region-Strategie dokumentiert (Latenz, Datensouveränität, Failover)
- Infrastructure as Code — kein manuelles Klicken in der Cloud-Console für Prod-Ressourcen
- Netzwerk-Segmentierung: öffentliche, private und Datenbank-Subnets getrennt

**Warnsignale**
- Single-AZ Deployment ohne Begründung
- Keine Health Checks
- Manuelle Infrastruktur-Änderungen ohne IaC
- Datenbank öffentlich erreichbar

---

## 24. Supply Chain Security

> *Der Code, den du nicht geschrieben hast, ist genauso deine Verantwortung.*

**Pflichten**

- SBOM (Software Bill of Materials) generieren und pflegen (`cyclonedx`, `syft`)
- Signed Builds: Build-Artefakte kryptografisch signiert (Sigstore, Cosign)
- Dependency Provenance prüfen: Herkunft und Integrität von Packages verifiziert
- SLSA (Supply-chain Levels for Software Artifacts) Level ≥ 2 anstreben
- Keine Packages aus unbekannten Quellen ohne explizites Review
- Private Package-Registry für interne Packages (NPM Private, GitHub Packages)
- **KI-generierte Dependency-Risiken:**
  - Jede von KI vorgeschlagene neue Dependency vor Installation prüfen — KI halluziniert Package-Namen oder zieht veraltete/unsichere Versionen rein
  - Package-Name gegen bekannte Typosquatting-Muster prüfen (`npm info <package>` vor `npm install`)
  - KI-generierte `import`-Statements auf nicht existierende oder falsch geschriebene Module prüfen
  - Keine automatische Übernahme von KI-vorgeschlagenen Lockfile-Änderungen ohne Diff-Review

**Tools:** `syft`, `grype`, `cosign`, Sigstore, SLSA GitHub Generator

**Warnsignale**
- Kein SBOM vorhanden
- Packages direkt von GitHub-URLs statt registrierten Releases
- Build-Artefakte ohne Signatur in Produktion
- Interne Packages öffentlich veröffentlicht
- KI-vorgeschlagene Packages ohne manuelle Prüfung installiert
- Lockfile-Änderungen ohne Diff-Review akzeptiert

---

## 25. Namenskonventionen & Dateihygiene

> *Konsistenz ist keine Ästhetik — sie ist Orientierung für jeden, der den Code liest.*

### Namenskonventionen (Next.js Standard)

| Was | Convention | Beispiel |
|-----|-----------|---------|
| React-Komponenten | PascalCase | `UserProfile.tsx` |
| Seiten / App-Routes | kebab-case | `user-profile/page.tsx` |
| Custom Hooks | camelCase + `use`-Prefix | `useUserProfile.ts` |
| Utilities / Helpers | camelCase | `formatDate.ts` |
| Konstanten-Dateien | camelCase | `apiEndpoints.ts` |
| Konstanten-Werte | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Ordner | kebab-case | `user-management/` |
| Test-Dateien | gleich wie Quelldatei | `UserProfile.test.tsx` |
| Type-Dateien | PascalCase + `.types` | `UserProfile.types.ts` |
| API-Routes (Next.js) | kebab-case | `route.ts` in `api/user-profile/` |
| Server Actions | camelCase | `createUser.ts` |
| Stores (Zustand etc.) | camelCase + `Store` | `userStore.ts` |
| Enum-Werte | PascalCase | `OrderStatus.Shipped` |

### Projektstruktur (Next.js App Router)

```
/src
  /app                    # Next.js App Router — nur Routing, kein Business-Code
    /[route]/
      page.tsx            # Seite (kebab-case Ordner)
      layout.tsx          # Layout
      loading.tsx         # Loading UI
      error.tsx           # Error Boundary
  /components             # Wiederverwendbare UI-Komponenten (PascalCase)
    /ui                   # Primitive (Button, Input, Modal)
    /layout               # Strukturelle Komponenten (Header, Sidebar)
    /[feature]            # Feature-spezifische Komponenten
  /features               # Self-contained Feature-Module
    /[feature-name]/
      components/
      hooks/
      types.ts
      actions.ts          # Server Actions
  /hooks                  # Shared Custom Hooks
  /lib                    # Utilities, Helpers, Formatters
  /services               # Business-Logik, externe Service-Abstraktionen
  /store                  # Global State (Zustand, Jotai etc.)
  /types                  # Globale TypeScript-Typen
  /config                 # App-Konfiguration, Konstanten
/public                   # Statische Assets
/tests                    # E2E-Tests (Playwright)
/docs
  /adr                    # Architecture Decision Records
  /webapp-manifest        # Dieses Framework
```

### Dateihygiene-Regeln

**Größengrenzen**
- Komponenten: max. 200 Zeilen — ab 300 Zeilen aufteilen
- Utility-Funktionen: max. 150 Zeilen pro Datei
- Services: max. 300 Zeilen — ab 400 Zeilen in Sub-Module aufteilen
- Types-Dateien: keine strikte Grenze, aber logisch gruppiert

**Dead Code**
- Unused imports werden sofort entfernt (ESLint `no-unused-vars` / `@typescript-eslint/no-unused-vars`)
- Auskommentierter Code wird nicht committed — dafür gibt es Git
- `TODO`-Kommentare müssen ein Ticket oder Datum enthalten: `// TODO(#123): ...`
- Dateien, die nicht mehr importiert werden, werden gelöscht

**Aufräum-Automatisierung**
Claude Code darf eigenständig:
- Unused imports entfernen
- Auskommentierten Code löschen (älter als aktueller Branch)
- Leere Dateien / Ordner löschen
- Duplizierte Utility-Funktionen konsolidieren
- Dateien umbenennen, die gegen Konventionen verstoßen

Claude Code meldet kurz was er getan hat, fragt aber nicht vorher.

**Verboten ohne explizite Anweisung**
- Dateien löschen, die noch aktive Imports haben
- Umstrukturierung ganzer Feature-Ordner
- Umbenennung von öffentlichen API-Routen

### Warnsignale
- `component1.tsx`, `test2.ts`, `newFile_FINAL_v3.tsx`
- `utils.ts` mit > 500 Zeilen und 40 unzusammenhängenden Funktionen
- Ordner `/components/misc/` oder `/helpers/old/`
- Auskommentierter Code aus dem letzten Quartal
- Imports die nirgendwo verwendet werden
- Doppelte Implementierungen derselben Utility in verschiedenen Ordnern
