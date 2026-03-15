# Audit System
## Ebene 3 — Gewichtetes Scoring

> Dieses Dokument definiert das Bewertungssystem für Web Application Audits.  
> Jede Regel hat einen Score (0–5), ein Gewicht und gibt an, ob sie automatisierbar ist.  
> Für die vollständigen Regeldefinitionen → `engineering-standard.md`

---

## Scoring-Modell

### Score pro Regel (0–5)

| Score | Bedeutung |
|-------|-----------|
| 0 | Nicht vorhanden |
| 1 | Rudimentär / bewusst ignoriert |
| 2 | Teilweise umgesetzt |
| 3 | Solide, Standardniveau |
| 4 | Sehr gut, über Minimum hinaus |
| 5 | Best Practice, vorbildlich |

### Gewichtung

| Gewicht | Bedeutung |
|---------|-----------|
| 3 | Kritisch — direkte Auswirkung auf Sicherheit, Datenverlust, Compliance |
| 2 | Wichtig — signifikante Auswirkung auf Betrieb, Qualität, Skalierbarkeit |
| 1 | Optional — verbessert Qualität, aber kein sofortiger Showstopper |

### Gesamtscore

```
score = Σ(rule_score × weight) / Σ(max_score × weight) × 100
```

### Bewertungsstufen

| Score | Status | Bedeutung |
|-------|--------|-----------|
| 85–100 | 🟢 **Production Grade** | Industriestandard erfüllt |
| 70–84 | 🟡 **Stable** | Produktionsfähig mit dokumentierten Risiken |
| 50–69 | 🟠 **Risky** | Maßnahmenplan erforderlich vor weiterer Skalierung |
| < 50 | 🔴 **Prototype** | Nicht produktionsreif |

---

## Audit-Regeln nach Kategorie

### 1. Architektur

| Regel | Gewicht | Automatisierbar | Prüfmethode |
|-------|---------|----------------|-------------|
| Klare Schichtenarchitektur erkennbar | 3 | nein | Code-Review |
| Business-Logik nicht in UI/Routes | 3 | teilweise | `eslint-plugin-boundaries` |
| Keine zirkulären Abhängigkeiten | 2 | ja | `dependency-cruiser` |
| Dateien < 300 Zeilen (Ausnahmen dokumentiert) | 1 | ja | `cloc`, eigenes Script |
| ADRs vorhanden für Kerntechnologieentscheidungen | 2 | nein | Dokumentation prüfen |

**Kategorie-Maximalscore:** 55

---

### 2. Code-Qualität

| Regel | Gewicht | Automatisierbar | Prüfmethode |
|-------|---------|----------------|-------------|
| TypeScript Strict Mode aktiv | 3 | ja | `tsconfig.json` prüfen |
| ESLint konfiguriert und aktiv | 2 | ja | `.eslintrc` + CI-Logs |
| Prettier konfiguriert | 1 | ja | `.prettierrc` vorhanden |
| Magic Numbers/Strings minimiert | 1 | teilweise | ESLint `no-magic-numbers` |
| Explizites Error Handling durchgängig | 2 | teilweise | Code-Review, ESLint |
| Cognitive Complexity ≤ 15 (≤ 8 für KI-Code) | 2 | ja | `eslint-plugin-sonarjs/cognitive-complexity` |

**Kategorie-Maximalscore:** 55

---

### 3. Sicherheit ⚠️ Kritisch

| Regel | Gewicht | Automatisierbar | Prüfmethode |
|-------|---------|----------------|-------------|
| OWASP Top 10 berücksichtigt | 3 | teilweise | `semgrep`, Code-Review |
| Serverseitige Input-Validierung | 3 | teilweise | Code-Review, API-Test |
| Keine Secrets im Repo / History | 3 | ja | `gitleaks`, `detect-secrets` |
| HTTP Sicherheitsheader gesetzt | 2 | ja | `securityheaders.com`, `curl` |
| Rate Limiting implementiert (inkl. Auth-Flows) | 2 | nein | Manueller Test |
| Auth und Authz klar getrennt | 3 | nein | Code-Review |
| Dependency-Vulnerabilities geprüft | 2 | ja | `npm audit`, `snyk` |
| Auth-Härtung (Token-Expiry, Rotation, Logout) | 3 | nein | Code-Review, JWT-Analyse |
| Boilerplate-Hygiene (keine Default-Credentials) | 2 | teilweise | `semgrep`, manuell |
| E-Mail-Sicherheit (SPF, DKIM, DMARC) | 2 | ja | `mxtoolbox.com`, DNS-Check |
| Patch-Management + Disclosure Policy | 2 | nein | Dokumentation prüfen |
| SSRF-Schutz (URL-Validierung, Allowlist) | 3 | nein | Code-Review, `OWASP ZAP` |
| CSRF-Schutz (SameSite Cookies, CSRF-Tokens) | 2 | nein | Code-Review, manueller Test |
| Object-Level Authorization (Ownership-Check) | 3 | nein | Code-Review, API-Test |

**Kategorie-Maximalscore:** 185

---

### 4. Datenschutz & Compliance ⚠️ Kritisch

| Regel | Gewicht | Automatisierbar | Prüfmethode |
|-------|---------|----------------|-------------|
| Kein PII in Logs | 3 | teilweise | Log-Analyse, Code-Review |
| Consent-System DSGVO-konform | 2 | nein | Manuell + rechtliche Prüfung |
| Datenlöschung technisch möglich | 2 | nein | Feature-Test |
| Rechtsgrundlagen dokumentiert | 2 | nein | Dokumentation prüfen |
| AVV mit Drittanbietern vorhanden | 2 | nein | Vertragscheck |
| AI Act Klassifizierung durchgeführt | 2 | nein | Dokumentation prüfen |

**Kategorie-Maximalscore:** 65

---

### 5. Datenbank

| Regel | Gewicht | Automatisierbar | Prüfmethode |
|-------|---------|----------------|-------------|
| FK-Constraints vorhanden | 3 | ja | Schema-Analyse |
| Index-Strategie vorhanden | 2 | teilweise | `EXPLAIN ANALYZE`, Schema |
| Migrations-Tool im Einsatz | 2 | ja | Konfiguration prüfen |
| JSON-Blobs vermieden für filterbare Daten | 1 | teilweise | Schema-Review |
| Principle of Least Privilege für DB-User | 3 | nein | DB-Permissions prüfen |
| BaaS: RLS aktiv + kein Service Key im Frontend | 3 | nein | Config-Review, Bundle-Analyse |

**Kategorie-Maximalscore:** 70

---

### 6. API-Design

| Regel | Gewicht | Automatisierbar | Prüfmethode |
|-------|---------|----------------|-------------|
| API-Versionierung vorhanden | 2 | ja | Route-Analyse |
| OpenAPI/Swagger-Spec vorhanden | 2 | ja | Datei prüfen |
| Vendor-Abstraktionsschicht | 2 | nein | Code-Review |
| Webhook-Signaturvalidierung | 3 | nein | Code-Review |
| Resilience-Patterns (Timeout, Retry, CB) | 2 | nein | Code-Review |

**Kategorie-Maximalscore:** 55

---

### 7. Performance

| Regel | Gewicht | Automatisierbar | Prüfmethode |
|-------|---------|----------------|-------------|
| Core Web Vitals im Zielbereich | 3 | ja | Lighthouse, PageSpeed |
| Bundle-Größe analysiert und optimiert | 2 | ja | Bundle Analyzer |
| Pagination für alle Listen-Endpunkte | 2 | teilweise | API-Review |
| Caching-Strategie definiert und aktiv | 2 | teilweise | Code-Review, Response-Header |
| CDN für statische Assets | 2 | ja | DNS/Response-Header prüfen |

**Kategorie-Maximalscore:** 55

---

### 8. Skalierbarkeit

| Regel | Gewicht | Automatisierbar | Prüfmethode |
|-------|---------|----------------|-------------|
| Stateless App-Server | 3 | nein | Architektur-Review |
| Job-Queue für Background-Tasks | 2 | nein | Code-Review |
| Lasttests durchgeführt + dokumentiert | 2 | nein | Ergebnisse prüfen |
| DB-Scaling-Plan vorhanden | 2 | nein | Dokumentation |

**Kategorie-Maximalscore:** 45

---

### 9. State Management

| Regel | Gewicht | Automatisierbar | Prüfmethode |
|-------|---------|----------------|-------------|
| State-Kategorien klar getrennt | 2 | nein | Code-Review |
| Kein Server-State im globalen Store | 2 | nein | Code-Review |
| Optimistic Updates mit Rollback | 1 | nein | Code-Review |

**Kategorie-Maximalscore:** 25

---

### 10. Testing ⚠️ Kritisch

| Regel | Gewicht | Automatisierbar | Prüfmethode |
|-------|---------|----------------|-------------|
| Unit-Test-Coverage ≥ 80% (Business-Logik) | 3 | ja | Coverage-Report |
| Integration Tests für API-Endpunkte | 2 | teilweise | Test-Runner |
| E2E Tests für kritische User-Journeys | 2 | ja | Playwright/Cypress |
| Tests laufen in CI-Pipeline | 3 | ja | CI-Logs |
| KI-Code-Gate: Coverage ≥ 90%, Duplikate ≤ 1% | 2 | ja | SonarQube AI Code Assurance / CI-Config |

**Kategorie-Maximalscore:** 60

---

### 11. CI/CD ⚠️ Kritisch

| Regel | Gewicht | Automatisierbar | Prüfmethode |
|-------|---------|----------------|-------------|
| CI-Pipeline vorhanden | 3 | ja | Pipeline-Config prüfen |
| Staging-Umgebung vorhanden | 2 | nein | Deployment-Docs |
| Rollback-Plan definiert und getestet | 3 | nein | Runbook prüfen |
| Infrastructure as Code | 2 | ja | IaC-Files prüfen |
| Zero-Downtime Deployments | 2 | nein | Deploy-Strategie prüfen |

**Kategorie-Maximalscore:** 60

---

### 12. Observability ⚠️ Kritisch

| Regel | Gewicht | Automatisierbar | Prüfmethode |
|-------|---------|----------------|-------------|
| Structured Logging (JSON, kein PII) | 3 | teilweise | Log-Output analysieren |
| Error-Tracking-Tool aktiv | 3 | ja | Sentry/Bugsnag prüfen |
| Metrics gesammelt (APM) | 2 | ja | Monitoring-Dashboard |
| Distributed Tracing (OpenTelemetry) | 2 | ja | Tracing-Config |
| Uptime-Monitoring + Alerting | 2 | ja | Monitoring-Tool prüfen |

**Kategorie-Maximalscore:** 60

---

### 13. Backup & Disaster Recovery ⚠️ Kritisch

| Regel | Gewicht | Automatisierbar | Prüfmethode |
|-------|---------|----------------|-------------|
| 3-2-1-Backup-Regel umgesetzt | 3 | nein | Infra-Dokumentation |
| PITR für Produktionsdatenbank | 3 | nein | DB-Konfiguration |
| Restore regelmäßig getestet | 3 | nein | Test-Protokolle |
| DR-Runbook vorhanden und aktuell | 2 | nein | Dokumentation |
| RTO/RPO definiert | 2 | nein | Dokumentation |

**Kategorie-Maximalscore:** 65

---

### 14. Dependency Management

| Regel | Gewicht | Automatisierbar | Prüfmethode |
|-------|---------|----------------|-------------|
| Lockfiles committed | 3 | ja | Git prüfen |
| Vulnerability-Scans in CI | 3 | ja | `npm audit`, `snyk` |
| Renovate / Dependabot konfiguriert | 2 | ja | Config prüfen |
| Node-Version fixiert | 1 | ja | `.nvmrc` prüfen |

**Kategorie-Maximalscore:** 45

---

### 15. Design System

| Regel | Gewicht | Automatisierbar | Prüfmethode |
|-------|---------|----------------|-------------|
| Design-Tokens definiert | 2 | nein | Token-Files prüfen |
| Komponentenbibliothek dokumentiert | 2 | nein | Storybook prüfen |
| Kein Hard-Coding von Designwerten | 2 | teilweise | Code-Review, ESLint |
| Component Lifecycle definiert | 1 | nein | Dokumentation |

**Kategorie-Maximalscore:** 35

---

### 16. Accessibility

| Regel | Gewicht | Automatisierbar | Prüfmethode |
|-------|---------|----------------|-------------|
| WCAG 2.1 AA Konformität | 3 | teilweise | Lighthouse, axe-core |
| Tastaturnavigation funktioniert | 2 | nein | Manueller Test |
| Korrekte ARIA-Nutzung | 1 | teilweise | axe-core |

**Kategorie-Maximalscore:** 30

---

### 17. Internationalisierung

| Regel | Gewicht | Automatisierbar | Prüfmethode |
|-------|---------|----------------|-------------|
| i18n-Framework im Einsatz | 2 | ja | Dependencies prüfen |
| Keine hardcodierten Strings | 2 | teilweise | Statische Analyse |
| Locale-sensitive Formatierung | 2 | nein | Code-Review |

**Kategorie-Maximalscore:** 30

---

### 18. Dokumentation

| Regel | Gewicht | Automatisierbar | Prüfmethode |
|-------|---------|----------------|-------------|
| README vollständig und aktuell | 2 | nein | Manuell prüfen |
| ADRs vorhanden | 2 | nein | `/docs/adr` prüfen |
| API-Dokumentation generiert | 2 | ja | OpenAPI-File prüfen |
| Onboarding < 30 Minuten erreichbar | 1 | nein | Test mit neuem Entwickler |

**Kategorie-Maximalscore:** 35

---

### 19. Git Governance

| Regel | Gewicht | Automatisierbar | Prüfmethode |
|-------|---------|----------------|-------------|
| Branch-Schutz für `main` aktiv | 3 | ja | Repo-Settings |
| Conventional Commits eingehalten | 1 | ja | `commitlint` |
| Semantic Versioning für Releases | 2 | ja | Tags prüfen |

**Kategorie-Maximalscore:** 30

---

### 20. Cost Awareness

| Regel | Gewicht | Automatisierbar | Prüfmethode |
|-------|---------|----------------|-------------|
| Cloud-Budget-Alerts konfiguriert | 3 | nein | Cloud-Console prüfen |
| API Rate Limits / Token Budgets | 2 | nein | Code-Review |
| Vendor-Abstraktionsschicht | 2 | nein | Code-Review |
| Lizenz-Compliance geprüft | 1 | ja | FOSSA, License Checker |

**Kategorie-Maximalscore:** 40

---

### 21. PWA & Resilience

| Regel | Gewicht | Automatisierbar | Prüfmethode |
|-------|---------|----------------|-------------|
| `manifest.json` valide | 2 | ja | Lighthouse PWA-Audit |
| Service Worker vorhanden | 2 | ja | Chrome DevTools |
| Offline-Fallback implementiert | 2 | nein | Manueller Test (Offline) |

**Kategorie-Maximalscore:** 30

---

### 22. AI Integration

| Regel | Gewicht | Automatisierbar | Prüfmethode |
|-------|---------|----------------|-------------|
| Prompt Injection Defense | 3 | nein | Code-Review, Pen Test |
| Token-Limits definiert und aktiv | 2 | nein | Code-Review |
| Fallback-Strategie bei Modellausfall | 2 | nein | Code-Review |
| LLM-Output-Validierung vorhanden | 2 | nein | Code-Review |

**Kategorie-Maximalscore:** 45

---

### 23. Infrastructure

| Regel | Gewicht | Automatisierbar | Prüfmethode |
|-------|---------|----------------|-------------|
| Multi-AZ Deployment | 3 | nein | Infra-Dokumentation / IaC |
| Health Checks konfiguriert | 2 | ja | Load-Balancer-Config |
| Autoscaling konfiguriert | 2 | nein | Infra-Config |
| Netzwerk-Segmentierung | 2 | nein | Infra-Review |

**Kategorie-Maximalscore:** 45

---

### 24. Supply Chain Security

| Regel | Gewicht | Automatisierbar | Prüfmethode |
|-------|---------|----------------|-------------|
| SBOM generiert und gepflegt | 3 | ja | `syft`, `cyclonedx` |
| Signed Builds | 2 | ja | `cosign`, Sigstore |
| Dependency Provenance geprüft | 2 | ja | `grype`, SLSA |
| KI-Dependency-Review (kein blindes Installieren) | 2 | nein | Code-Review, PR-Check |

**Kategorie-Maximalscore:** 45

---

## Beispiel-Audit-Report

```
Project: acme-webapp
Datum: März 2026
Auditor: [Name]

ERGEBNIS
────────────────────────────────────────
Kategorie              Score   /5   Gewicht  Gewichtet
──────────────────────────────────────────────────────
Architektur            3.2    / 5     ×2       6.4
Code-Qualität          3.8    / 5     ×1       3.8
Sicherheit             2.4    / 5     ×3       7.2   ⚠️
Datenschutz            3.0    / 5     ×2       6.0
Datenbank              3.5    / 5     ×2       7.0
API-Design             2.8    / 5     ×1       2.8
Performance            3.2    / 5     ×2       6.4
Skalierbarkeit         2.0    / 5     ×2       4.0
State Management       3.0    / 5     ×1       3.0
Testing                1.5    / 5     ×3       4.5   ⚠️
CI/CD                  3.0    / 5     ×3       9.0
Observability          2.0    / 5     ×3       6.0
Backup & DR            1.0    / 5     ×3       3.0   🔴
Dependency Mgmt        3.5    / 5     ×2       7.0
Design System          2.5    / 5     ×1       2.5
Accessibility          2.0    / 5     ×2       4.0
i18n                   2.0    / 5     ×1       2.0
Dokumentation          2.5    / 5     ×1       2.5
Git Governance         4.0    / 5     ×2       8.0
Cost Awareness         2.0    / 5     ×2       4.0
PWA & Resilience       1.5    / 5     ×1       1.5
AI Integration         2.0    / 5     ×2       4.0
Infrastructure         2.5    / 5     ×2       5.0
Supply Chain Security  1.0    / 5     ×2       2.0   🔴
──────────────────────────────────────────────────────
GESAMT                                        111.6 / 185

SCORE: 60.3%
STATUS: 🟠 Risky

KRITISCHE MASSNAHMEN (vor nächstem Release):
  🔴 Backup & DR: Restore-Tests einführen, DR-Runbook erstellen
  🔴 Supply Chain: SBOM implementieren
  ⚠️  Sicherheit:  Rate Limiting, Security-Header vollständig setzen
  ⚠️  Testing:     E2E-Tests für kritische Flows, CI-Integration
```

---

## Automatisierbare Checks — Übersicht

| Tool | Prüft |
|------|-------|
| `gitleaks` | Secrets in Git-History |
| `npm audit` / `snyk` | Dependency-Vulnerabilities |
| `eslint` + `eslint-plugin-boundaries` | Architektur-Violations, Code-Qualität |
| `eslint-plugin-sonarjs` | Cognitive Complexity, Code-Smells |
| `dependency-cruiser` | Zirkuläre Abhängigkeiten |
| `tsc --noEmit` | TypeScript-Fehler |
| Lighthouse CI | Core Web Vitals, PWA, Accessibility |
| `axe-core` | Accessibility |
| `semgrep` | Security-Patterns, Boilerplate-Schwachstellen |
| Bundle Analyzer | Bundle-Größe |
| `syft` / `cyclonedx` | SBOM-Generierung |
| `grype` | Container- und Dependency-Vulnerabilities |
| `cosign` | Build-Signierung |
| `commitlint` | Conventional Commits |
| Coverage-Report (Jest/Vitest) | Test-Coverage |
| `mxtoolbox.com` / `dig` | SPF, DKIM, DMARC DNS-Records |
| SonarQube Cloud | AI Code Assurance, Cognitive Complexity, Security Hotspots |

---

### 25. Namenskonventionen & Dateihygiene

| Regel | Gewicht | Automatisierbar | Prüfmethode |
|-------|---------|----------------|-------------|
| Datei-Namenskonventionen eingehalten | 2 | ja | ESLint `unicorn/filename-case` |
| Keine Dateien > 300 Zeilen (Komponenten) | 2 | ja | `cloc`, eigenes Script |
| Keine unused imports | 2 | ja | ESLint `no-unused-vars` |
| Kein auskommentierter Code committed | 1 | teilweise | ESLint `no-commented-out-code` |
| Projektstruktur folgt Standard | 2 | nein | Code-Review |
| Keine duplizierten Utility-Funktionen | 1 | nein | Code-Review |

**Kategorie-Maximalscore:** 50
