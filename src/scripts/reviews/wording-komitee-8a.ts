import type { CommitteeReviewConfig } from '../committee-review'

const STRAWMAN = `
## DSGVO-Rules (14 Rules)

| Rule-ID | Aktueller Titel | Inventar-Vorschlag |
|---------|-----------------|---------------------|
| cat-4-rule-1 | Kein PII in Logs | Werden keine Namen, E-Mails oder andere Nutzerdaten in Logs gespeichert? |
| cat-4-rule-7 | Impressum + Datenschutz-Seiten vorhanden | (Kontext fehlt laut Inventar) |
| cat-4-rule-8 | VVT (Verarbeitungsverzeichnis) in docs/ | (kein Inventar-Vorschlag) |
| cat-4-rule-10 | PII in Analytics-Events getrennt | (kein Inventar-Vorschlag) |
| cat-4-rule-12 | DSGVO: Cookie Consent Library | Haben Nutzer die Möglichkeit, Cookies abzulehnen, bevor sie gesetzt werden? |
| cat-4-rule-13 | DSGVO: Kein Tracking vor Consent (Art. 7) | (kein Inventar-Vorschlag) |
| cat-4-rule-14 | DSGVO: Passwort-Hashing (Art. 32) | (kein Inventar-Vorschlag) |
| cat-4-rule-15 | DSGVO: HSTS-Header konfiguriert | (kein Inventar-Vorschlag) |
| cat-4-rule-16 | DSGVO: CSP-Header konfiguriert | (kein Inventar-Vorschlag) |
| cat-4-rule-17 | DSGVO: Datenexport-Endpunkt (Art. 20) | (kein Inventar-Vorschlag) |
| cat-4-rule-18 | DSGVO: Account-Löschung (Art. 17) | Können Nutzer ihren Account vollständig löschen lassen? |
| cat-4-rule-20 | AGB/Terms-Seite vorhanden | (Kontext fehlt laut Inventar) |
| cat-4-rule-21 | Widerrufsbelehrung vorhanden | Können Käufer Bestellungen innerhalb von 14 Tagen stornieren? |
| cat-4-rule-22 | Checkout-Button: "Kostenpflichtig bestellen" | (Technisch klar, Kontext fehlt) |

## KI-Act-Rules (10 Rules)

| Rule-ID | Aktueller Titel | Inventar-Vorschlag |
|---------|-----------------|---------------------|
| cat-22-rule-1 | Prompt Injection Defense | (kein Inventar-Vorschlag) |
| cat-22-rule-5 | User-Input nicht in System-Prompt | (kein Inventar-Vorschlag) |
| cat-22-rule-8 | Kein AI-Security-Risk (Prompt-Injection/Output-Eval) | Können User durch ihre Eingaben eure KI umprogrammieren? |
| cat-22-rule-9 | AI Act: Risikoeinstufung dokumentiert | Wisst ihr, welche Risikokategorie eure KI laut EU AI Act hat? |
| cat-22-rule-10 | AI Act: KI-Interaktionen erkennbar | (kein Inventar-Vorschlag) |
| cat-22-rule-11 | AI Act: KI-Entscheidungs-Logging | (kein Inventar-Vorschlag) |
| cat-22-rule-12 | AI Act: Zweckbeschreibung dokumentiert | (kein Inventar-Vorschlag) |
| cat-22-rule-13 | AI Act: Keine verbotenen Praktiken | Nutzt eure KI keine verbotenen Methoden wie Social Scoring oder unterschwellige Manipulation? |
| cat-22-rule-14 | AI Act: KI-Nutzung transparent kommuniziert | (kein Inventar-Vorschlag) |
| cat-22-rule-15 | AI Act: KI-generierte Inhalte markiert | (kein Inventar-Vorschlag) |
`.trim()

export const config: CommitteeReviewConfig = {
  name: 'wording-komitee-8a',

  contextFiles: [
    'docs/product/marken-brief.md',
    'docs/audit-reports/findings-inventar-2026-05-05.md',
  ],

  contextTransforms: {
    'docs/product/marken-brief.md': (c) => {
      // Nur Section 28.1 + 28.5 laden
      const lines = c.split('\n')
      const s281 = lines.findIndex(l => l.startsWith('### 28.1'))
      const s285 = lines.findIndex(l => l.startsWith('### 28.5'))
      const s286 = lines.findIndex(l => l.startsWith('### 28.6'))
      const part281 = lines.slice(s281, s285).join('\n')
      const part285 = lines.slice(s285, s286 > 0 ? s286 : s285 + 40).join('\n')
      return `${part281}\n\n${part285}\n\n[Nur Sections 28.1 + 28.5 geladen]`
    },
    'docs/audit-reports/findings-inventar-2026-05-05.md': (c) =>
      c.split('\n').slice(0, 60).join('\n') + '\n... (nur Einleitung geladen)',
  },

  systemPrompt: `Du bist Mitglied eines Multi-Model-Komitees für Tropen OS — eine Production-Readiness-Plattform für Vibe-Coder (Entwickler die mit Lovable/Cursor/Bolt Apps generieren, keine Juristen).

KONTEXT:
Tropen OS zeigt heute Findings mit Compliance-Sprache:
- "DSGVO: Cookie Consent Library" → Vibe-Coder wissen nicht was das bedeutet
- "AI Act: Risikoeinstufung dokumentiert" → klingt nach Anwaltsauftrag
- "VVT (Verarbeitungsverzeichnis) in docs/" → komplett unverständlich

MARKEN-POSITION: Coach-Position zweiter Ordnung (Section 28.5). Tropen OS spricht Vibe-Coder-Sprache, nicht Anwalts-Sprache.

ÜBERSETZUNGS-PATTERN aus Section 28.5 (verbindlich):
- "Verarbeitung personenbezogener Daten" → "Sammelt ihr Namen, E-Mails oder andere Nutzerdaten?"
- "Sensible Daten gemäß Art. 9 DSGVO" → "Verarbeitet ihr Gesundheit, Religion, Politik oder sexuelle Orientierung?"
- "Biometrische Identifikation" → "Gesichtserkennung oder Emotionsanalyse?"
- Art.-X-Referenzen gehören in Hilfetext (hint), NICHT in Titel

BEGRENZUNGS-AUSSAGEN (Section 28.1): Tropen OS sagt explizit, was es NICHT prüft. Pattern:
"Wir prüfen ob [Technisches Element] existiert. Ob die Lösung [Compliance-Aspekt] ist, müsst ihr selbst sicherstellen."

TOP-3 BEKANNTE VERSTÄNDNIS-FALLEN (aus früherem Komitee):
1. "PII" — Vibe-Coder denken an Passwörter, nicht an Datenschutz-Daten
2. "Tracking" — unterscheidet nicht Analytics/Ads/Error-Monitoring
3. "Risikoeinstufung" — klingt nach Unternehmensberater-Sprache

AUSGABE-FORMAT pro Rule:
- Coach-Titel: max 12 Wörter, klare Frage oder Aussage
- Begrenzungs-Aussage: 1 Satz, nur wenn Tropen OS nicht vollständig prüfen kann
- Anmerkung bei Spaltung: was ist umstritten?

Antworte auf alle 3 Fragen vollständig und strukturiert.`,

  userPrompt: `
${STRAWMAN}

---

DREI AUFGABEN:

---

AUFGABE 1 — COACH-TITEL + BEGRENZUNGS-AUSSAGE FÜR ALLE 24 RULES

Pro Rule (alle 14 DSGVO + 10 KI-Act):

**Ausgabe-Tabelle:**
| Rule-ID | Coach-Titel (max 12 Wörter) | Begrenzungs-Aussage (oder "keine") | Spaltung? |
|---------|---------------------------|------------------------------------|-----------|

REGELN:
1. Kein "DSGVO:" oder "AI Act:" Präfix — verwenden als Kontext, nicht als Etikett
2. Kein Art.-X → in hint-Feld auslagern
3. Fragen sind stärker als Aussagen ("Können Nutzer…?" besser als "Account-Löschung vorhanden")
4. Begrenzungs-Aussage nur wenn Tropen OS wirklich nur Code-Check macht, nicht den Inhalt prüft
5. Sprache: Du-Form ("Habt ihr?") — konsistent mit Sprint 6b₁ Compliance-Fragen

---

AUFGABE 2 — TOP-3 SCHWIERIGSTE WORDINGS

Welche 3 Rules werden Vibe-Coder am häufigsten missverstehen oder falsch einordnen?
Pro Rule: warum problematisch + konkrete Falle.

---

AUFGABE 3 — ART.-X-REFERENZEN-STRATEGIE

Empfehlung: Sollen Artikel-Referenzen (Art. 7, Art. 17, Art. 20, Art. 32) aus Titeln in hint-Felder wandern — oder ist eine andere Strategie besser?

A — vollständig aus Titeln entfernen (empfohlen laut Inventar)
B — behalten im Klammern-Stil: "Account löschen lassen? (Art. 17)"
C — spezielle "Rechtlicher Hinweis"-Sektion
D — anderes Modell schlägt etwas vor

Begründung + welches Lager bevorzugt welche Option.
`,

  judgePrompt: `4 Modelle haben Coach-Wording für 24 DSGVO + KI-Act-Rules entwickelt.
Zielgruppe: Vibe-Coder (Lovable/Cursor/Bolt), keine Juristen.
Kernregel: Alltagssprache statt Compliance-Sprech, Artikel-Referenzen in hint-Felder.

Destilliere den Konsens:

FÜR AUFGABE 1 (24 Rules):
Finale Tabelle: Rule-ID | Coach-Titel | Begrenzungs-Aussage | Konsens-Level (EINIG/MEHRHEIT/GESPALTEN)
- Wenn GESPALTEN: beide Varianten nennen mit Kurzargument

FÜR AUFGABE 2 (Top-3):
Die 3 Rules, bei denen Vibe-Coder am häufigsten scheitern. Mit Erklärung WARUM.

FÜR AUFGABE 3 (Art.-X-Strategie):
Konsens-Level + empfohlene Option + ob alle Modelle einig waren.

ZUSÄTZLICH:
- Spaltungen für Timm (max 4, priorisiert)
- Muster-Erkennung: Gibt es gemeinsame Sprachmuster die Komitee entwickelt hat?
- Qualitäts-Check: 2-3 Rules bei denen Coach-Titel noch nicht überzeugend ist`,
}
