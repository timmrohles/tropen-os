# Benchmark-Analyse: 41 Lovable-Projekte — Committee Input

## Rohdaten

- 41 Repos gescannt, 47 Sekunden
- Avg Score: 72.3%, Median: 72.4%, StdDev: 0.82
- Score-Range: 68.2% — 73.5%
- 100% Risky, 0% Stable, 0% Production
- 4.618 Findings total, 113 avg/Repo
- Fix-Typ: 46% code-fix, 36% refactoring, 17% code-gen, 1% manual

## 23 Regeln die bei 100% aller Repos triggern

DSGVO/Compliance (7):
- cat-4-rule-11: Datenschutzseite fehlt (Critical)
- cat-4-rule-12: Cookie-Consent fehlt (Critical, 92.7%)
- cat-4-rule-7: Impressum fehlt (High)
- cat-4-rule-17: Kein Datenexport Art. 20 (High)
- cat-4-rule-18: Keine Account-Loeschung Art. 17 (High)
- cat-16-rule-5: BFSG Barrierefreiheitserklaerung fehlt (High)
- cat-16-rule-6: BFSG Feedback-Mechanismus fehlt (High)

Infrastruktur/Tooling (8):
- cat-12-rule-2: Sentry nicht installiert (High)
- cat-6-rule-3: Keine Vendor-Abstraktionsschicht (Medium, 3x)
- cat-10-rule-3: Keine E2E-Tests (Medium)
- cat-23-rule-2: Kein Health-Check (Medium)
- cat-16-rule-4: axe-core nicht installiert (Medium)
- cat-24-rule-1: Kein SBOM (Medium)
- cat-12-rule-4: Kein OpenTelemetry (Medium)
- cat-24-rule-5: Keine Build-Provenance (Low)

Code-Qualitaet (5):
- cat-1-rule-6: Dependency-Modell nicht erzwungen (Medium)
- cat-5-rule-8: Migrations-Naming inkonsistent (Medium)
- cat-5-rule-7: Kein Soft-Delete Pattern (Medium)
- cat-16-rule-8: Skip-Navigation fehlt WCAG (Medium)
- cat-6-rule-2: Keine OpenAPI-Spec (Low)

Sonstiges (3):
- cat-17-rule-1: Kein i18n-Framework (Low, 97.6%)
- cat-24-rule-6: Typosquatting-Risiko (Low)
- cat-2-rule-1: TypeScript Strict Mode (Medium)

## Das Problem

StdDev 0.82 = der Score unterscheidet nicht zwischen Projekten.
Ein Portfolio mit 41 Findings = gleicher Score wie SaaS mit 1071 Findings.
23 "Template-Default"-Regeln dominieren den Score.

## Positionierung

- Tropen OS = Production Readiness Guide fuer Vibe-Coders
- EU-Compliance als Differenziator
- Lovable ist potenzieller Partner, nicht Gegner
- Ton: ermutigend, nicht einschuechternd
