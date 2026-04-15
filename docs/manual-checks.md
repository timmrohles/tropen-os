# Manual Checks — Nicht automatisierbar

> Diese Checks koennen statisch nicht geprueft werden.
> Sie erfordern manuelle Pruefung oder einen AI-Agent-Review.

## Sicherheit (cat-3)

| Check | Warum nicht automatisch |
|-------|----------------------|
| OWASP Top 10 beruecksichtigt | Architektur-Review noetig |
| HTTP Sicherheitsheader gesetzt | Laufzeit-Check noetig (Vercel setzt Header automatisch) |
| Rate Limiting implementiert | Implementation-Pattern zu variabel |
| Auth-Haertung (Token-Expiry, Rotation) | Runtime-Konfiguration |
| Boilerplate-Hygiene (Default-Credentials) | Manuelle Pruefung |
| E-Mail-Sicherheit (SPF/DKIM/DMARC) | DNS-Einstellungen, nicht im Code |
| Patch-Management + Disclosure Policy | Organisatorisch |
| SSRF-Schutz | Architektur-abhaengig |
| CSRF-Schutz | Framework-abhaengig (Next.js hat SameSite default) |
| Object-Level Authorization | Business-Logik-Review noetig |

## Datenschutz (cat-4)

| Check | Warum nicht automatisch |
|-------|----------------------|
| Consent-System DSGVO-konform | UI-Flow-Pruefung noetig |
| Datenloeschung technisch moeglich | Datenbank-Schema + Logik |
| Rechtsgrundlagen dokumentiert | Rechtliche Bewertung |
| AVV mit Drittanbietern vorhanden | Vertragsdokument |

## Performance (cat-7)

| Check | Warum nicht automatisch |
|-------|----------------------|
| Pagination fuer alle Listen-Endpunkte | Teilweise automatisiert (cat-8-rule-7) |
| Caching-Strategie definiert | Architektur-Entscheidung |
| CDN fuer statische Assets | Deployment-Konfiguration |

## Skalierbarkeit (cat-8)

| Check | Warum nicht automatisch |
|-------|----------------------|
| Stateless App-Server | Architektur-Pattern |
| Lasttests durchgefuehrt | Erfordert Laufzeitumgebung |
| DB-Scaling-Plan vorhanden | Infrastruktur-Entscheidung |

## Backup & DR (cat-13)

| Check | Warum nicht automatisch |
|-------|----------------------|
| 3-2-1-Backup-Regel umgesetzt | Infrastruktur-Konfiguration |
| PITR fuer Produktionsdatenbank | Dashboard-Pruefung (teilweise cat-13-rule-9) |
| Restore regelmaessig getestet | Prozess, nicht Code |

## Cost Awareness (cat-20)

| Check | Warum nicht automatisch |
|-------|----------------------|
| Cloud-Budget-Alerts konfiguriert | Dashboard-Konfiguration |
| Vendor-Abstraktionsschicht | Architektur-Entscheidung |
| Lizenz-Compliance geprueft | Rechtliche Bewertung |

## Entscheidung fuer Komitee

Diese manuellen Checks koennen drei Wege gehen:
1. **"Not checked"** im Report markieren (transparent)
2. **AI-Agent-Review**: LLM liest Code und bewertet heuristisch
3. **Ignorieren**: Aus dem Score-System entfernen

Empfehlung: Option 1 fuer MVP, Option 2 als Premium-Feature.
