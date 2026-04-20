# Audit Report
## tropen-os

**Date:** 2026-04-20  
**Automated Score:** 77% - Risky  
**Rules evaluated:** 145 automated, 88 manual (not scored)  
**vs. 2026-04-20:** 77% (Delta +0.0)  

## Category Results

| Category | Automated % | Auto Rules | Manual Rules |
|----------|-------------|------------|--------------|
| Architektur | 71.7% | 7 | 3 |
| Code-Qualität | 80.0% | 11 | 4 |
| Sicherheit | 74.9% | 14 | 13 |
| Datenschutz & Compliance | 76.0% | 10 | 11 |
| Datenbank | 70.6% | 8 | 3 |
| API-Design | 82.9% | 3 | 5 |
| Performance | 60.0% | 2 | 5 |
| Skalierbarkeit | 85.0% | 4 | 3 |
| State Management | 63.3% | 4 | 2 |
| Testing | 86.7% | 6 | 1 |
| CI/CD | 66.7% | 6 | 2 |
| Observability | 92.3% | 6 | 4 |
| Backup & Disaster Recovery | 81.8% | 6 | 3 |
| Dependency Management | 92.0% | 8 | 0 |
| Design System | 68.0% | 3 | 4 |
| Accessibility | 87.5% | 5 | 5 |
| Internationalisierung | 86.7% | 2 | 2 |
| Dokumentation | 72.3% | 9 | 3 |
| Git Governance | 100.0% | 4 | 1 |
| Cost Awareness | 40.0% | 4 | 3 |
| PWA & Resilience | 95.0% | 5 | 1 |
| AI Integration | 75.2% | 12 | 3 |
| Infrastructure | 65.0% | 3 | 3 |
| Supply Chain Security | 100.0% | 2 | 4 |
| Namenskonventionen & Dateihygiene | 93.3% | 3 | 3 |
| KI-Code-Hygiene | 60.0% | 5 | 0 |

## Critical Findings

- **CRITICAL: DSGVO/ePrivacy Art. 5(3): Cookie-Consent vor nicht-essentiellen Cookies erforderlich**
  - Fix: Füge eine CMP-Library hinzu (z.B. klaro, react-cookie-consent) oder implementiere Banner-Komponente
- **CRITICAL: Service key (supabaseAdmin) imported in client-side file: src/app/[locale]/(app)/audit/page.tsx**
  - File: `src/app/[locale]/(app)/audit/page.tsx`
  - Fix: Move this logic to a server component or API route
- **CRITICAL: Service key (supabaseAdmin) imported in client-side file: src/app/[locale]/(app)/superadmin/beta/page.tsx**
  - File: `src/app/[locale]/(app)/superadmin/beta/page.tsx`
  - Fix: Move this logic to a server component or API route
- **CRITICAL: Service key (supabaseAdmin) imported in client-side file: src/app/[locale]/welcome/page.tsx**
  - File: `src/app/[locale]/welcome/page.tsx`
  - Fix: Move this logic to a server component or API route