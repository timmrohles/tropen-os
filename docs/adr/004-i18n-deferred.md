# ADR-004: Internationalisierung aufgeschoben, Grundstruktur vorbereitet

**Status:** Accepted
**Datum:** 2026-03-26
**Kontext:** Internationalisierung / Lokalisierung

## Entscheidung

Tropen OS bleibt vorerst einsprachig (Deutsch). Eine minimale `t()` Funktion
wird als Vorarbeit bereitgestellt, damit Strings spaeter ohne Big-Bang-Migration
extrahiert werden koennen.

## Grund

- Zielgruppe Phase 1: deutsche KMU (20-200 Mitarbeiter)
- 200+ UI-Strings muessen extrahiert werden — Aufwand steht nicht im Verhaeltnis zum Nutzen vor dem ersten Kunden
- Testing (7%), Impressum-Daten und Budget-Wiring haben hoehere Prioritaet
- Nachtraegliches i18n ist mit der `t()` Funktion deutlich einfacher als ohne Vorbereitung

## Migrationsplan (wenn i18n aktiviert wird)

1. `next-intl` installieren (Next.js App Router kompatibel)
2. `messages/de.json` + `messages/en.json` anlegen
3. `t()` Aufrufe im Code bleiben bestehen — nur die Implementierung aendert sich
4. Pro Seite/Feature Strings extrahieren (kein Big Bang)

## Konsequenzen

- **Positiv:** Kein Overhead jetzt, Code ist vorbereitet fuer spaetere Migration
- **Positiv:** `t()` Aufrufe dokumentieren wo Strings sind
- **Negativ:** Audit-Kategorie 17 bleibt bei 0-1/5 bis zur Aktivierung
- **Negativ:** Neue Features muessen daran denken `t()` zu verwenden

## Zeithorizont

Aktivierung geplant fuer Q3/Q4 2026 wenn internationale Expansion (Schweiz, Oesterreich) ansteht.
