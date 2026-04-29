# Domain-Mapping der Audit-Rules

Datum: 2026-04-29 (ADR-025 Tab-Sprint)

## Mapping-Übersicht

| Category | Domain | Ausnahmen |
|----------|--------|-----------|
| cat-1 (Architektur) | code-quality | — |
| cat-2 (Code-Stil) | code-quality | cat-2-rule-11 → performance |
| cat-3 (Sicherheit) | security | — |
| cat-4 (Compliance) | dsgvo | cat-4-rule-6 → ki-act |
| cat-5 (Daten/DB) | code-quality | cat-5-rule-6 → security, cat-5-rule-20 → dsgvo |
| cat-6 (API) | code-quality | — |
| cat-7 (Performance) | performance | — |
| cat-8..15 | code-quality | — |
| cat-16 (A11y) | accessibility | — |
| cat-17..20 | code-quality | — |
| cat-21 (PWA & Resilience) | code-quality | — |
| cat-22 (KI-Act) | ki-act | — |
| cat-23 (Deployment) | code-quality | — |
| cat-24 (Sec-Scan) | security | — |
| cat-25..26 | code-quality | — |

## Grenzfälle

- cat-3-rule-11 (tier=compliance) → security (Sicherheit bleibt dominant)
- cat-5-rule-6 (RLS/Service Key) → security (DB-Sicherheitsregel)
- cat-5-rule-20 (Affiliate-Links) → dsgvo (Compliance-Pflicht)
- cat-4-rule-6 (AI Act Klassifizierung) → ki-act
- cat-2-rule-11 (Lighthouse Best Practices) → performance (Lighthouse-Metrik)
- cat-22-rule-5 (User-Input in System-Prompt) → ki-act (auch Security-Aspekt, aber in cat-22)
- cat-22-rule-8 (AI Security Scan) → ki-act (in cat-22 heimisch)
- cat-3-rule-30 (Hardcoded Secrets) → security (AST-Check, cat-3 heimisch)
- cat-24 (Supply Chain Security) → security (trotz cat-24-Nummer, inhaltlich Security)

## Implementierung

- Pflichtfeld `domain?: AuditDomain` auf `AuditRule` (src/lib/audit/types.ts)
- `manual()` Helper: 8. Parameter `auditDomain: AuditDomain = 'code-quality'`
- Filter-Funktion: `getFindingsByDomain()` in src/lib/audit/domain-filter.ts (geplant)
- Tab-Routing: `?tab=<domain>` in /audit
