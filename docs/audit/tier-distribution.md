# Audit-Rules Tier-Verteilung
Datum: 2026-04-27 (Ergebnis von BP3, Tag 4.5)

## Übersicht

| Tier | Anzahl | Beschreibung |
|------|--------|--------------|
| code | 149 (inline) + ~45 (manual default) | Konkreter Code-Fix oder Konfigurations-Änderung |
| metric | 10 | Wert-/Score-Messung mit Zielwert |
| compliance | 24 | Regulatorische Anforderung (DSGVO, BFSG, AI Act, Impressum, AGB) |

**Gesamt:** ~183 Rules mit explizitem tier (176 inline + 7 explicit manual-Aufrufe).
Alle weiteren `manual()` Aufrufe defaulten auf `tier: 'code'`.

## Tier-Definitionen

| Tier | Bedeutung | User-Aktion |
|------|-----------|-------------|
| `code` | Finding prüft ein konkretes Code-Pattern | Finding lesen → Fix-Prompt kopieren → an KI übergeben → Code anpassen |
| `metric` | Finding misst einen Wert (Score, Prozent, Ratio) | Wert beobachten, über Zeit verbessern, Schwellenwerte definieren |
| `compliance` | Finding prüft regulatorische Anforderung | Lücke schließen, Nachweis erbringen (binär: erfüllt / nicht erfüllt) |

## metric-Rules (10)

| Rule-ID | Name |
|---------|------|
| cat-2-rule-6 | Cognitive Complexity <= 15 (manuell) |
| cat-2-rule-11 | Lighthouse Best Practices |
| cat-2-rule-12 | Cognitive Complexity <= 15 pro Funktion (AST) |
| cat-7-rule-1 | Core Web Vitals im Zielbereich |
| cat-7-rule-2 | Bundle-Größe analysiert und optimiert |
| cat-10-rule-1 | Unit-Test-Coverage >= 80% |
| cat-10-rule-5 | KI-Code-Gate: Coverage >= 90% |
| cat-16-rule-1 | WCAG 2.1 AA Konformität (Lighthouse) |
| cat-18-rule-5 | Lighthouse SEO |
| cat-26-rule-3 | Keine Überkommentierung (Kommentar-Ratio <40%) |

## compliance-Rules (24)

| Rule-ID | Name | Quelle |
|---------|------|--------|
| cat-3-rule-11 | Patch-Management + Disclosure Policy | Security Policy |
| cat-4-rule-2 | Consent-System DSGVO-konform | DSGVO |
| cat-4-rule-4 | Rechtsgrundlagen dokumentiert | DSGVO |
| cat-4-rule-5 | AVV mit Drittanbietern vorhanden | DSGVO |
| cat-4-rule-6 | AI Act Klassifizierung durchgeführt | AI Act |
| cat-4-rule-7 | Impressum + Datenschutz-Seiten vorhanden | TMG/DSGVO |
| cat-4-rule-8 | VVT vorhanden | DSGVO |
| cat-4-rule-12 | DSGVO: Cookie Consent Library | ePrivacy |
| cat-4-rule-13 | DSGVO: Kein Tracking vor Consent | DSGVO |
| cat-4-rule-20 | AGB/Terms-Seite vorhanden | Fernabsatz |
| cat-4-rule-21 | Widerrufsbelehrung vorhanden | Fernabsatz |
| cat-4-rule-22 | Checkout-Button: "Kostenpflichtig bestellen" | Fernabsatz |
| cat-5-rule-20 | Affiliate-Links korrekt gekennzeichnet | Werbekennzeichnung |
| cat-16-rule-5 | BFSG: Erklärung zur Barrierefreiheit | BFSG |
| cat-16-rule-6 | BFSG: Feedback-Mechanismus | BFSG |
| cat-20-rule-4 | Lizenz-Compliance geprüft | Urheberrecht |
| cat-22-rule-9 | AI Act: Risikoeinstufung dokumentiert | AI Act |
| cat-22-rule-10 | AI Act: KI-Interaktionen erkennbar | AI Act |
| cat-22-rule-11 | AI Act: KI-Entscheidungs-Logging | AI Act |
| cat-22-rule-12 | AI Act: Zweckbeschreibung dokumentiert | AI Act |
| cat-22-rule-13 | AI Act: Keine verbotenen Praktiken | AI Act |
| cat-22-rule-14 | AI Act: KI-Nutzung transparent kommuniziert | AI Act |
| cat-22-rule-15 | AI Act: KI-generierte Inhalte markiert | AI Act |
| (diverse bfsg) | Weitere BFSG/WCAG technical checks | Gehören zu code, nicht compliance |

## Grenzfälle (im architect-log dokumentiert)

- **DSGVO-technische Rules** (HSTS, CSP, Passwort-Hashing, Datenexport, Account-Löschung): `code` — Begründung: Fix ist ein konkreter Code-Change, auch wenn DSGVO die Anforderung stellt
- **BFSG-technische Rules** (html lang, skip nav, alt-Text, ARIA): `code` — selbe Logik
- **cat-4-rule-3 (Datenlöschung)**: `code` — Feature muss gebaut werden, kein Dokument-Nachweis
- **cat-3-rule-11 (Patch-Management)**: `compliance` — Organisatorische Policy, kein Code-Fix

## Hinweis zur Verteilung

Die Instruction zu BP3 erwartete ~70 Rules ("~70 Rules in rule-registry.ts"). Die Datei enthält tatsächlich 183+ Rules da seit dem Erstellen des Build-Prompts ~100+ neue Rules hinzugefügt wurden (Sprint 5–11). Die proportionale Verteilung (metric ~5%, compliance ~13%, code ~82%) entspricht der Erwartung aus der Instruction.

**Nächster Schritt:** Sprint 1 UI-Umbau nutzt dieses `tier`-Feld für separate Ansichten (Code-Findings / Metrik-Dashboard / Compliance-Checkliste).
