# ADR-005: APPEND ONLY Tabellen fuer Audit-Trail und Historisierung

**Status:** Accepted
**Datum:** 2026-03-15
**Kontext:** Datenintegritaet und Compliance

## Entscheidung

Bestimmte Tabellen sind als APPEND ONLY gekennzeichnet. Auf diesen Tabellen
darf kein UPDATE oder DELETE ausgefuehrt werden — nur INSERT.

## Betroffene Tabellen

- `card_history` — Aenderungshistorie von Workspace-Karten
- `project_memory` — Akkumulierte Erkenntnisse aus Projekt-Chats
- `feed_processing_log` — Feed-Verarbeitungsprotokoll
- `feed_data_records` — Rohdaten aus externen Datenquellen
- `feed_runs` — Feed-Ausfuehrungsprotokoll
- `agent_runs` — Agenten-Ausfuehrungsprotokoll
- `memory_extraction_log` — Gedaechtnis-Extraktionsprotokoll

## Grund

- **Audit-Trail:** Nachvollziehbarkeit aller Aenderungen fuer Compliance (AI Act, DSGVO)
- **Debugging:** Fehlersuche in der Feed-Pipeline erfordert unveraenderte Logs
- **Datenintegritaet:** Agenten-Runs und ihre Ergebnisse muessen reproduzierbar sein
- **Kunden-Vertrauen:** KMU muessen sehen koennen, was die KI wann getan hat

## Konsequenzen

- **Positiv:** Vollstaendiger Audit-Trail, keine verlorenen Daten
- **Positiv:** Debugging ueber Zeitverlaeufe moeglich
- **Negativ:** Tabellen wachsen unbegrenzt — regelmaessiges Archivieren noetig
- **Negativ:** Kein "Undo" moeglich — fehlerhafte Eintraege bleiben bestehen
- **Mitigation:** TTL-Cleanup Cron (`feed-cleanup`) archiviert alte Eintraege nach `max_age_days`

## Enforcement

- CLAUDE.md listet APPEND ONLY Tabellen explizit
- Code-Review prueft auf UPDATE/DELETE-Statements gegen diese Tabellen
- Kein RLS-Policy erlaubt UPDATE/DELETE fuer diese Tabellen
