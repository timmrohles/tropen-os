# Committee Review: wording-komitee-8a

> Generiert am 2026-05-05 · Reviewer: Claude Sonnet, GPT-4o, Gemini 2.5 Pro, Grok 4 · Judge: Claude Opus

---

## Konsens-Report: Coach-Wording für 24 DSGVO + KI-Act Rules

### AUFGABE 1 — Finale Tabelle mit Coach-Titeln

#### DSGVO-Rules (14 Rules)

| Rule-ID | Coach-Titel | Begrenzungs-Aussage | Konsens-Level |
|---------|-------------|-------------------|---------------|
| cat-4-rule-1 | Werden Namen oder E-Mails in Logs gespeichert? | Wir prüfen nur auf häufige PII-Pattern im Code. Ob eure Log-Inhalte rechtskonform sind, müsst ihr selbst sicherstellen. | **EINIG** |
| cat-4-rule-7 | Habt ihr Impressum und Datenschutzerklärung? | Wir prüfen nur ob die Seiten existieren. Ob der Inhalt vollständig ist, müsst ihr selbst sicherstellen. | **EINIG** |
| cat-4-rule-8 | **Variante A:** Dokumentiert ihr welche Nutzerdaten ihr sammelt?<br>**Variante B:** Habt ihr eine Liste aller verarbeiteten Nutzerdaten? | keine | **GESPALTEN**<br>A: direkter<br>B: konkreter |
| cat-4-rule-10 | **Variante A:** Trennt ihr Nutzerdaten von Analytics-Events?<br>**Variante B:** Werden Userdaten von Analytics-Events getrennt? | Wir können nicht alle Analytics-Integrationen erkennen. Prüft selbst ob Google Analytics oder ähnliche Tools PII erhalten. | **GESPALTEN**<br>A: aktiver<br>B: passiver |
| cat-4-rule-12 | Können Nutzer Cookies vor dem Setzen ablehnen? | Wir prüfen nur ob eine Cookie-Library existiert. Ob die Konfiguration rechtskonform ist, müsst ihr selbst sicherstellen. | **EINIG** |
| cat-4-rule-13 | Startet Analytics erst nach Cookie-Zustimmung? | Wir können nicht alle Tracking-Scripts erkennen. Prüft selbst ob GA4, Facebook Pixel etc. vor Consent laden. | **MEHRHEIT** |
| cat-4-rule-14 | **Variante A:** Werden Passwörter sicher gespeichert?<br>**Variante B:** Hasht ihr Passwörter sicher? | keine | **GESPALTEN**<br>A: allgemeiner<br>B: technischer |
| cat-4-rule-15 | Erzwingt ihr verschlüsselte Verbindungen? | keine | **MEHRHEIT** |
| cat-4-rule-16 | **Variante A:** Blockiert ihr unsichere externe Inhalte?<br>**Variante B:** Schützt ihr Inhalte mit Content-Security-Policy? | keine | **GESPALTEN**<br>A: verständlicher<br>B: präziser |
| cat-4-rule-17 | Können Nutzer ihre Daten exportieren? | Wir prüfen nur ob ein Export-Endpunkt existiert. Ob alle Daten exportiert werden, müsst ihr selbst sicherstellen. | **EINIG** |
| cat-4-rule-18 | Können Nutzer ihren Account vollständig löschen? | Wir prüfen nur ob ein Lösch-Endpunkt existiert. Ob alle Daten gelöscht werden, müsst ihr selbst sicherstellen. | **EINIG** |
| cat-4-rule-20 | **Variante A:** Habt ihr Nutzungsbedingungen?<br>**Variante B:** AGB-Seite erstellt? | Wir prüfen nur ob die Seite existiert. Ob der Inhalt rechtsgültig ist, müsst ihr selbst sicherstellen. | **GESPALTEN**<br>A: klarer<br>B: kürzer |
| cat-4-rule-21 | Kann man Bestellungen binnen 14 Tagen stornieren? | Wir prüfen nur ob eine Widerrufs-Seite existiert. Ob der Prozess rechtskonform ist, müsst ihr selbst sicherstellen. | **EINIG** |
| cat-4-rule-22 | Zeigt euer Bezahl-Button dass es kostenpflichtig ist? | keine | **MEHRHEIT** |

#### KI-Act-Rules (10 Rules)

| Rule-ID | Coach-Titel | Begrenzungs-Aussage | Konsens-Level |
|---------|-------------|-------------------|---------------|
| cat-22-rule-1 | Schützt ihr euch vor KI-Prompt-Manipulation? | Unsere Detection ist heuristisch. Ob eure Schutzmaßnahmen ausreichen, müsst ihr selbst testen. | **EINIG** |
| cat-22-rule-5 | **Variante A:** Werden Nutzereingaben vom System-Prompt getrennt?<br>**Variante B:** Kommt User-Input nicht in System-Prompts? | Wir können nicht alle KI-Integrationen erkennen. Prüft selbst ob User-Input in System-Prompts landet. | **GESPALTEN**<br>A: neutraler<br>B: direkter |
| cat-22-rule-8 | Können User durch Eingaben eure KI umprogrammieren? | Unsere Detection ist heuristisch. Testet selbst mit Jailbreak-Prompts ob eure KI manipulierbar ist. | **EINIG** |
| cat-22-rule-9 | Wisst ihr welche KI-Risikokategorie ihr habt? | Wir können keine Risikoeinstufung vornehmen — das muss ein KI-Rechtsexperte entscheiden. | **EINIG** |
| cat-22-rule-10 | **Variante A:** Erkennen Nutzer dass sie mit KI interagieren?<br>**Variante B:** Ist KI-Interaktion für Nutzer erkennbar? | Wir prüfen nur technische Kennzeichnung. Ob die Kommunikation ausreichend transparent ist, müsst ihr selbst sicherstellen. | **GESPALTEN**<br>A: aktiver<br>B: passiver |
| cat-22-rule-11 | Loggt ihr KI-Entscheidungen für Nachverfolgung? | keine | **EINIG** |
| cat-22-rule-12 | Dokumentiert ihr wofür eure KI verwendet wird? | keine | **EINIG** |
| cat-22-rule-13 | Nutzt eure KI keine verbotenen Manipulationstechniken? | Wir können keine vollständige Bewertung vornehmen — das erfordert KI-Ethik-Expertise. | **EINIG** |
| cat-22-rule-14 | Kommuniziert ihr KI-Nutzung transparent? | Wir prüfen nur ob Hinweise existieren. Ob die Kommunikation ausreichend ist, müsst ihr selbst sicherstellen. | **EINIG** |
| cat-22-rule-15 | Kennzeichnet ihr KI-generierte Inhalte? | Wir können nicht alle KI-generierten Inhalte erkennen. Prüft selbst ob Texte/Bilder korrekt markiert sind. | **EINIG** |

### AUFGABE 2 — Top-3 Schwierigste Wordings

**Konsens-Level: EINIG** — Alle Modelle identifizierten ähnliche Problembereiche:

#### 1. cat-4-rule-8: "Dokumentiert ihr welche Nutzerdaten ihr sammelt?"
**Warum scheitern Vibe-Coder:** Sie denken an User-Profile und Datenbank-Schemas, nicht an DSGVO-Verarbeitungsverzeichnisse. Ein Todo-App-Entwickler sieht sein User-Model und denkt "dokumentiert!" — versteht aber nicht, dass es um Zweck, Rechtsgrundlage, Löschfristen geht.

#### 2. cat-22-rule-9: "Wisst ihr welche KI-Risikokategorie ihr habt?"
**Warum scheitern Vibe-Coder:** "Risikokategorie" klingt nach technischem Risk-Assessment (Bugs, Ausfälle), nicht nach EU-Regulatorik (minimal/limited/high/unacceptable). Ein Chatbot-Builder denkt an Server-Crashes statt an CE-Kennzeichnung und Konformitätsbewertung.

#### 3. cat-4-rule-13: "Startet Analytics erst nach Cookie-Zustimmung?"
**Warum scheitern Vibe-Coder:** Sie unterscheiden nicht zwischen verschiedenen Tracking-Arten. Error-Monitoring (Sentry) wird als "kein Tracking" eingestuft, Analytics (GA4) als "harmloses Tracking" — aber beide brauchen je nach Konfiguration Consent.

### AUFGABE 3 — Art.-X-Referenzen-Strategie

**Konsens-Level: EINIG**  
**Empfohlene Option: A — Vollständig aus Titeln entfernen**

Alle Modelle empfehlen, Artikel-Referenzen komplett aus den Coach-Titeln zu entfernen und in hint-Felder zu verschieben. Vibe-Coder werden von juristischen Fachbegriffen abgeschreckt. Die Strategie erhöht Verständlichkeit und Engagement.

## Zusätzliche Erkenntnisse

### Spaltungen für Timm (priorisiert)

1. **Aktiv vs. Passiv-Formulierung** (cat-4-rule-10, cat-22-rule-10): Sollen wir "Trennt ihr..." oder "Werden ... getrennt?" fragen?
2. **Technische vs. allgemeine Sprache** (cat-4-rule-14): "Hasht ihr Passwörter?" oder "sicher gespeichert?"
3. **Direkte vs. indirekte Formulierung** (cat-22-rule-5): "Kommt User-Input nicht..." oder "Werden Eingaben getrennt?"
4. **Begriff-Wahl** (cat-4-rule-20): "Nutzungsbedingungen" oder "AGB"?

### Muster-Erkennung

Das Komitee entwickelte gemeinsame Sprachmuster:
- **Fragen-Format** dominiert (erhöht Engagement)
- **Du-Form** durchgängig (persönliche Ansprache)
- **Konkrete Beispiele** in Begrenzungs-Aussagen (GA4, Facebook Pixel, Sentry)
- **Pattern:** "Wir prüfen nur X. Ob Y, müsst ihr selbst sicherstellen."
- **Vermeidung von:** Fachjargon, Artikel-Referenzen, abstrakten Begriffen

### Qualitäts-Check: Noch nicht überzeugende Coach-Titel

1. **cat-22-rule-13:** "Nutzt eure KI keine verbotenen Manipulationstechniken?" — Doppelte Verneinung verwirrt, "Manipulationstechniken" zu abstrakt
2. **cat-4-rule-16:** Spaltung zwischen "Blockiert ihr unsichere externe Inhalte?" (zu vage) und "CSP-Header" (zu technisch)
3. **cat-22-rule-9:** "KI-Risikokategorie" bleibt problematisch — selbst in vereinfachter Form nicht intuitiv für Vibe-Coder

## Nächste Schritte

1. **Sofort:** Aktiv/Passiv-Spaltung klären (Timm-Entscheidung)
2. **Sofort:** cat-22-rule-13 umformulieren ohne doppelte Verneinung
3. **Bald:** Glossar für unvermeidbare Fachbegriffe (Risikokategorie, CSP)
4. **Später:** A/B-Tests mit echten Vibe-Codern für gespaltene Formulierungen

---

## Kosten

| Modell           | In-Tok  | Out-Tok | Kosten   |
|------------------|---------|---------|----------|
| Claude Sonnet    |    6260 |    2048 | €0.0460 |
| GPT-4o           |    4476 |    1119 | €0.0208 |
| Gemini 2.5 Pro   |    4912 |    2043 | €0.0247 |
| Grok 4           |    5484 |    2860 | €0.0552 |
| Judge (Opus)     |    7075 |    3188 | €0.3211 |
| **Gesamt**       |         |         | **€0.4678** |
