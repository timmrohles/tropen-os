# Wording-Komitee 8a — 2026-05-05

> **Datum:** 2026-05-05
> **Anlass:** Coach-Wording für 24 DSGVO + KI-Act-Rules (ADR-027 Schritt 8)
> **Methode:** Multi-Model-Komitee (Claude Sonnet + GPT-4o + Gemini 2.5 Pro + Grok 4 + Opus-Judge)
> **Kosten:** €0.47
> **Vollständiger Rohbericht:** `docs/committee-reviews/wording-komitee-8a-review.md`

---

## Frage 1 — Coach-Wording pro Rule

### DSGVO (14 Rules)

| Rule-ID | Aktueller Titel | Coach-Titel | Begrenzungs-Aussage | Konsens |
|---------|-----------------|-------------|---------------------|---------|
| cat-4-rule-1 | Kein PII in Logs | Werden Namen oder E-Mails in Logs gespeichert? | Wir prüfen nur auf häufige PII-Pattern im Code. Ob eure Log-Inhalte rechtskonform sind, müsst ihr selbst sicherstellen. | EINIG |
| cat-4-rule-7 | Impressum + Datenschutz-Seiten vorhanden | Habt ihr Impressum und Datenschutzerklärung? | Wir prüfen nur ob die Seiten existieren. Ob der Inhalt vollständig ist, müsst ihr selbst sicherstellen. | EINIG |
| cat-4-rule-8 | VVT (Verarbeitungsverzeichnis) in docs/ | Dokumentiert ihr welche Nutzerdaten ihr sammelt? | — | GESPALTEN* |
| cat-4-rule-10 | PII in Analytics-Events getrennt | Trennt ihr Nutzerdaten von Analytics-Events? | Wir können nicht alle Analytics-Integrationen erkennen. Prüft selbst ob GA4 oder Facebook Pixel PII erhalten. | GESPALTEN* |
| cat-4-rule-12 | DSGVO: Cookie Consent Library | Können Nutzer Cookies vor dem Setzen ablehnen? | Wir prüfen nur ob eine Cookie-Library existiert. Ob die Konfiguration rechtskonform ist, müsst ihr selbst sicherstellen. | EINIG |
| cat-4-rule-13 | DSGVO: Kein Tracking vor Consent (Art. 7) | Startet Analytics erst nach Cookie-Zustimmung? | Wir können nicht alle Tracking-Scripts erkennen. Prüft selbst ob GA4, Facebook Pixel etc. vor Consent laden. | MEHRHEIT |
| cat-4-rule-14 | DSGVO: Passwort-Hashing (Art. 32) | Werden Passwörter sicher gespeichert? | — | GESPALTEN* |
| cat-4-rule-15 | DSGVO: HSTS-Header konfiguriert | Erzwingt ihr verschlüsselte Verbindungen? | — | MEHRHEIT |
| cat-4-rule-16 | DSGVO: CSP-Header konfiguriert | Blockiert ihr unsichere externe Inhalte? | — | GESPALTEN* |
| cat-4-rule-17 | DSGVO: Datenexport-Endpunkt (Art. 20) | Können Nutzer ihre Daten exportieren? | Wir prüfen nur ob ein Export-Endpunkt existiert. Ob alle Daten exportiert werden, müsst ihr selbst sicherstellen. | EINIG |
| cat-4-rule-18 | DSGVO: Account-Löschung (Art. 17) | Können Nutzer ihren Account vollständig löschen? | Wir prüfen nur ob ein Lösch-Endpunkt existiert. Ob alle Daten gelöscht werden, müsst ihr selbst sicherstellen. | EINIG |
| cat-4-rule-20 | AGB/Terms-Seite vorhanden | Habt ihr Nutzungsbedingungen? | Wir prüfen nur ob die Seite existiert. Ob der Inhalt rechtsgültig ist, müsst ihr selbst sicherstellen. | GESPALTEN* |
| cat-4-rule-21 | Widerrufsbelehrung vorhanden | Kann man Bestellungen binnen 14 Tagen stornieren? | Wir prüfen nur ob eine Widerrufs-Seite existiert. Ob der Prozess rechtskonform ist, müsst ihr selbst sicherstellen. | EINIG |
| cat-4-rule-22 | Checkout-Button: "Kostenpflichtig bestellen" | Zeigt euer Bezahl-Button dass es kostenpflichtig ist? | — | MEHRHEIT |

### KI-Act (10 Rules)

| Rule-ID | Aktueller Titel | Coach-Titel | Begrenzungs-Aussage | Konsens |
|---------|-----------------|-------------|---------------------|---------|
| cat-22-rule-1 | Prompt Injection Defense | Schützt ihr euch vor KI-Prompt-Manipulation? | Unsere Detection ist heuristisch. Ob eure Schutzmaßnahmen ausreichen, müsst ihr selbst testen. | EINIG |
| cat-22-rule-5 | User-Input nicht in System-Prompt | Werden Nutzereingaben vom System-Prompt getrennt? | Wir können nicht alle KI-Integrationen erkennen. Prüft selbst ob User-Input in System-Prompts landet. | GESPALTEN* |
| cat-22-rule-8 | Kein AI-Security-Risk (Prompt-Injection/Output-Eval) | Können User durch Eingaben eure KI umprogrammieren? | Unsere Detection ist heuristisch. Testet selbst mit Jailbreak-Prompts ob eure KI manipulierbar ist. | EINIG |
| cat-22-rule-9 | AI Act: Risikoeinstufung dokumentiert | Wisst ihr welche KI-Risikokategorie ihr habt? | Wir können keine Risikoeinstufung vornehmen — das muss ein KI-Rechtsexperte entscheiden. | EINIG |
| cat-22-rule-10 | AI Act: KI-Interaktionen erkennbar | Erkennen Nutzer dass sie mit KI interagieren? | Wir prüfen nur technische Kennzeichnung. Ob die Kommunikation ausreichend transparent ist, müsst ihr selbst sicherstellen. | GESPALTEN* |
| cat-22-rule-11 | AI Act: KI-Entscheidungs-Logging | Loggt ihr KI-Entscheidungen für Nachverfolgung? | — | EINIG |
| cat-22-rule-12 | AI Act: Zweckbeschreibung dokumentiert | Dokumentiert ihr wofür eure KI verwendet wird? | — | EINIG |
| cat-22-rule-13 | AI Act: Keine verbotenen Praktiken | Verwendet eure KI Manipulations­techniken wie Social Scoring? | Wir können keine vollständige Bewertung vornehmen — das erfordert KI-Ethik-Expertise. | EINIG (Titel-Überarbeitung empfohlen) |
| cat-22-rule-14 | AI Act: KI-Nutzung transparent kommuniziert | Kommuniziert ihr KI-Nutzung transparent? | Wir prüfen nur ob Hinweise existieren. Ob die Kommunikation ausreichend ist, müsst ihr selbst sicherstellen. | EINIG |
| cat-22-rule-15 | AI Act: KI-generierte Inhalte markiert | Kennzeichnet ihr KI-generierte Inhalte? | Wir können nicht alle KI-generierten Inhalte erkennen. Prüft selbst ob Texte/Bilder korrekt markiert sind. | EINIG |

*Spaltungs-Details unten.

---

## Frage 2 — Top-3 schwierigste Wordings

**Konsens-Level: EINIG** — alle 4 Modelle identifizierten dieselben Problemstellen.

### 1. cat-4-rule-8 — "Dokumentiert ihr welche Nutzerdaten ihr sammelt?"

Vibe-Coder zeigen auf ihr User-Schema und denken "klar dokumentiert!" — verstehen aber nicht, dass DSGVO-Dokumentation Zweck, Rechtsgrundlage und Löschfristen erfordert. Die Coach-Frage klingt nach Datenbank-Architektur, nicht nach Datenschutz.

**Empfehlung:** Begrenzungs-Aussage stärken: "Wir prüfen ob eine Doku-Datei in docs/ existiert. Ein DSGVO-konformes Verarbeitungsverzeichnis braucht mehr — welche Daten, warum, wie lange."

### 2. cat-22-rule-9 — "Wisst ihr welche KI-Risikokategorie ihr habt?"

"Risikokategorie" klingt nach Server-Ausfällen, nicht nach EU-Regulatorik. Chatbot-Builder denken an Uptime-Risiken. Die EU-Risikoklassen (minimal/limited/high/unacceptable) sind komplexe Rechtsbegriffe.

**Begrenzungs-Aussage ist kritisch:** "Wir können keine Risikoeinstufung vornehmen — das muss ein KI-Rechtsexperte entscheiden."

### 3. cat-4-rule-13 — "Startet Analytics erst nach Cookie-Zustimmung?"

Vibe-Coder unterscheiden nicht zwischen Tracking-Arten: Error-Monitoring (Sentry) = "kein Tracking", GA4 = "harmloses Analytics", Facebook Pixel = "Werbung". Alle drei brauchen je nach Konfiguration unterschiedlichen Consent-Umgang.

**Begrenzungs-Aussage stärkt hier:** "Wir können nicht alle Tracking-Scripts erkennen. Prüft selbst ob GA4, Facebook Pixel oder Error-Monitoring vor Consent laden."

---

## Frage 3 — Art.-X-Referenzen-Strategie

**Konsens-Level: EINIG — Option A**

Alle 4 Modelle empfehlen: Art.-X-Referenzen komplett aus Coach-Titeln entfernen, in `hint`-Felder verschieben. Begründung: Artikel-Nummern schrecken Vibe-Coder ab, suggerieren Bürokratie und erzeugen Anxiety statt Handlungsbereitschaft.

**Implementation:** in `finding-recommendations.ts` pro Rule das `hint`-Feld mit Artikel-Referenz befüllen (z.B. `hint: "Art. 17 DSGVO — Recht auf Vergessenwerden"`). Titel bleibt sauber.

---

## Spaltungen — Timm-Entscheidung nötig

**4 Spaltungen, alle stilistisch** — keine inhaltliche Uneinigkeit:

### 1. Aktiv vs. Passiv (cat-4-rule-10, cat-22-rule-10)
- **Aktiv:** "Trennt ihr Nutzerdaten von Analytics-Events?" (Du-Form, direkte Ansprache)
- **Passiv:** "Werden Nutzerdaten von Analytics-Events getrennt?" (technischer, sachlicher)
- **Empfehlung:** Aktiv — konsistent mit Sprint 6b₁ Compliance-Fragen-Stil ("Habt ihr einen AVV…?")

### 2. Technisch vs. Allgemein (cat-4-rule-14 — Passwort-Hashing)
- **Technisch:** "Hasht ihr Passwörter sicher?" (Fachbegriff, aber Devs kennen ihn)
- **Allgemein:** "Werden Passwörter sicher gespeichert?" (breiter verständlich)
- **Empfehlung:** "Werden Passwörter sicher gespeichert?" — Vibe-Coder kennen "Hashing" nicht alle

### 3. Direkt vs. Indirekt (cat-22-rule-5 — User-Input/System-Prompt)
- **Direkt:** "Kommt User-Input nicht in System-Prompts?" (klarere Aussage)
- **Indirekt:** "Werden Nutzereingaben vom System-Prompt getrennt?" (neutraler)
- **Empfehlung:** "Werden Nutzereingaben vom System-Prompt getrennt?" — doppelte Verneinung ("nicht in") verwirrt

### 4. Begriff-Wahl (cat-4-rule-20 — AGB vs. Nutzungsbedingungen)
- **"AGB":** kürzer, juristisch etabliert
- **"Nutzungsbedingungen":** klarer für Vibe-Coder ohne Rechtshintergrund
- **Empfehlung:** "Habt ihr Nutzungsbedingungen?" — breiter verständlich

---

## Komitee-Muster (Opus-Judge-Erkennung)

Das Komitee hat konsistente Sprachmuster entwickelt:
1. **Fragen-Format** dominiert über Aussagen (erhöht Engagement)
2. **Du/Ihr-Form** durchgängig (persönliche Ansprache, konsistent mit Sprint 6b₁)
3. **Begrenzungs-Aussagen-Pattern:** "Wir prüfen nur X. Ob Y, müsst ihr selbst sicherstellen."
4. **Konkrete Beispiele** in Begrenzungs-Aussagen: GA4, Facebook Pixel, Sentry — nicht abstrakt
5. **Keine Artikel-Referenzen** in Titeln (Einig: Option A)

---

## Qualitäts-Check: 3 noch nicht überzeugende Titel

1. **cat-22-rule-13** — "Verwendet eure KI Manipulations­techniken wie Social Scoring?" — "Social Scoring" unbekannt; nach Überarbeitung: "Manipuliert eure KI Nutzer unterschwellig?"
2. **cat-4-rule-16** — Spaltung ungelöst; "Blockiert ihr unsichere externe Inhalte?" ist zu vage, aber "CSP-Header" zu technisch → Timm entscheidet
3. **cat-22-rule-9** — "KI-Risikokategorie" unvermeidbar problematisch; Begrenzungs-Aussage ist essenziell und entschärft das Wording

---

## Empfehlungen für Sprint-8a-Implementation

1. **Aktiv-Form als Standard** für alle neuen Wordings (Spaltung 1 aufgelöst)
2. **cat-22-rule-13 Überarbeitung:** "Manipuliert eure KI Nutzer unterschwellig?" + starke Begrenzungs-Aussage
3. **Art.-X → hint-Felder** für alle 14 DSGVO-Rules (Option A, EINIG)
4. **Begrenzungs-Aussagen** sind Pflicht für 12 von 24 Rules (Marken-Brief 28.1)
5. **Glossar-Kandidaten** für unvermeidbare Fachbegriffe: "Risikokategorie", "CSP-Header" → eigener kleiner Sprint nach 8a

---

*Vollständiger Rohbericht: `docs/committee-reviews/wording-komitee-8a-review.md` · Kosten: €0.47*
