# Audit Report
## tropen-os

**Date:** 2026-04-07  
**Automated Score:** 64.4% - Risky  
**Rules evaluated:** 50 automated, 70 manual (not scored)  

## Category Results

| Category | Automated % | Auto Rules | Manual Rules |
|----------|-------------|------------|--------------|
| Architektur | 60.0% | 4 | 1 |
| Code-Qualität | 100.0% | 3 | 3 |
| Sicherheit | 20.0% | 1 | 13 |
| Datenschutz & Compliance | 100.0% | 1 | 5 |
| Datenbank | 70.0% | 4 | 2 |
| API-Design | 33.3% | 3 | 2 |
| Performance | 0.0% | 1 | 4 |
| Skalierbarkeit | 80.0% | 1 | 3 |
| State Management | - | 0 | 3 |
| Testing | 82.2% | 4 | 1 |
| CI/CD | 52.5% | 3 | 2 |
| Observability | 100.0% | 3 | 2 |
| Backup & Disaster Recovery | 0.0% | 2 | 3 |
| Dependency Management | 100.0% | 4 | 0 |
| Design System | - | 0 | 4 |
| Accessibility | 80.0% | 1 | 2 |
| Internationalisierung | 0.0% | 1 | 2 |
| Dokumentation | 50.0% | 2 | 2 |
| Git Governance | 33.3% | 2 | 1 |
| Cost Awareness | 20.0% | 1 | 3 |
| PWA & Resilience | 100.0% | 2 | 1 |
| AI Integration | 60.0% | 1 | 3 |
| Infrastructure | 100.0% | 1 | 3 |
| Supply Chain Security | 40.0% | 2 | 2 |
| Namenskonventionen & Dateihygiene | 60.0% | 3 | 3 |

## Critical Findings

- **CRITICAL: Service key (supabaseAdmin) imported in client-side file: src/app/admin/logs/page.tsx**
  - File: `src/app/admin/logs/page.tsx`
  - Fix: Move this logic to a server component or API route
- **CRITICAL: Service key (supabaseAdmin) imported in client-side file: src/app/chat/[id]/page.tsx**
  - File: `src/app/chat/[id]/page.tsx`
  - Fix: Move this logic to a server component or API route
- **CRITICAL: Service key (supabaseAdmin) imported in client-side file: src/app/chat/new/page.tsx**
  - File: `src/app/chat/new/page.tsx`
  - Fix: Move this logic to a server component or API route
- **CRITICAL: Service key (supabaseAdmin) imported in client-side file: src/app/chat/page.tsx**
  - File: `src/app/chat/page.tsx`
  - Fix: Move this logic to a server component or API route
- **CRITICAL: Service key (supabaseAdmin) imported in client-side file: src/app/home/page.tsx**
  - File: `src/app/home/page.tsx`
  - Fix: Move this logic to a server component or API route
- **CRITICAL: Service key (supabaseAdmin) imported in client-side file: src/app/ws/[workspaceId]/canvas/page.tsx**
  - File: `src/app/ws/[workspaceId]/canvas/page.tsx`
  - Fix: Move this logic to a server component or API route
- **CRITICAL: Service key (supabaseAdmin) imported in client-side file: src/app/ws/[workspaceId]/layout.tsx**
  - File: `src/app/ws/[workspaceId]/layout.tsx`
  - Fix: Move this logic to a server component or API route