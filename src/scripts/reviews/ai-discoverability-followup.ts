import type { CommitteeReviewConfig } from '../committee-review'

export const config: CommitteeReviewConfig = {
  name: 'ai-discoverability-followup',

  contextFiles: [
    'docs/committee-reviews/ai-discoverability-review-run1.md',
    'docs/committee-reviews/ai-discoverability-review-run2.md',
  ],

  contextTransforms: {
    'docs/committee-reviews/ai-discoverability-review-run1.md': (c) =>
      '=== VORHERIGER KOMITEE-RUN 1 ===\n' +
      c.split('\n').filter(l => !l.startsWith('| Modell') && !l.startsWith('| ---') && !l.startsWith('| Claude') && !l.startsWith('| GPT') && !l.startsWith('| Gemini') && !l.startsWith('| Grok') && !l.startsWith('| Judge') && !l.startsWith('| **Gesamt')).join('\n').trim(),
    'docs/committee-reviews/ai-discoverability-review-run2.md': (c) =>
      '=== VORHERIGER KOMITEE-RUN 2 ===\n' +
      c.split('\n').filter(l => !l.startsWith('| Modell') && !l.startsWith('| ---') && !l.startsWith('| Claude') && !l.startsWith('| GPT') && !l.startsWith('| Gemini') && !l.startsWith('| Grok') && !l.startsWith('| Judge') && !l.startsWith('| **Gesamt')).join('\n').trim(),
  },

  systemPrompt: `Du bist Mitglied eines Mini-Followup-Komitees für Tropen OS — eine Production-Readiness-Plattform für Vibe-Coder (Entwickler die mit Lovable/Cursor/Bolt bauen).

KONTEXT-BRIEF — AI-DISCOVERABILITY MINI-FOLLOWUP

VORLAUF

Im AI-Discoverability-Komitee (zwei Runs) wurde diese Konvergenz erreicht:

| Regel       | Entscheidung | Gewicht | Severity     | Profil-Bindung               |
|-------------|--------------|---------|--------------|------------------------------|
| robots.txt  | aufnehmen    | 3       | high         | >= 2 (Profil 2 = blockieren) |
| OpenGraph   | aufnehmen    | 2-3     | medium-high  | >= 3                         |
| sitemap.xml | aufnehmen    | 2-3     | medium       | >= 3                         |
| llms.txt    | advisory     | 1       | low          | >= 3                         |

Plus zwei nachträgliche Founder-Setzungen:

| Regel       | Entscheidung | Gewicht | Severity | Profil-Bindung |
|-------------|--------------|---------|----------|----------------|
| Canonical   | aufnehmen    | 1       | low      | >= 4            |
| JSON-LD     | aufnehmen    | 2       | medium   | >= 3 (als AI-Readiness-Wette markiert) |

Insgesamt sechs Regeln in der neuen Audit-Kategorie 27 "Web Discoverability & AI Readiness".

PROFIL-DEFINITION (zur Erinnerung)

- Profil 1: Lokales Tooling, keine öffentliche Sichtbarkeit
- Profil 2: Interne / Beta-Phase mit kontrolliertem Zugriff
- Profil 3: Public Site mit Marketing-Anspruch (Standard für Vibe-Coder-SaaS)
- Profil 4: Public Site mit ernsthaftem SEO-/Reichweiten-Anspruch (Multi-Domain, internationaler Markt)

Beantworte die zwei Fragen präzise im vorgegebenen Format. Kein Jargon, keine Umschweife.`,

  userPrompt: `ZWEI FRAGEN — BITTE PRO FRAGE VOLLSTÄNDIG ANTWORTEN.

---

## FRAGE 1 — IMPLEMENTIERUNGS-REIHENFOLGE PRO PROFIL

Welche Reihenfolge sollen die sechs Regeln in der Implementierung haben — pro Profil-Stufe? Berücksichtige:

- User-sichtbarer Schmerz (höhere Sichtbarkeit = höhere Priorität, weil Validierung der Kategorie-Annahme)
- Implementierungs-Aufwand (einfacher = früher, weil schnelleres Feedback)
- False-Positive-Risiko (geringer = früher, weil Vertrauen in Kategorie nicht früh untergraben wird)

Schwerpunkt: Profil 3 (Standard-Vibe-Coder-SaaS). Dort sind alle sechs Regeln aktiv und die Reihenfolge ist nicht trivial.

Für Profil 2 (nur robots.txt) und Profil 4 (alle sechs plus Canonical) reicht eine knappe Antwort.

Format:

### Profil 3 — empfohlene Implementierungs-Reihenfolge

1. [Regel] — Begründung
2. [Regel] — Begründung
... usw.

### Profil 2 / Profil 4 — knappe Anmerkungen

[1-2 Sätze pro Profil]

---

## FRAGE 2 — LLMS.TXT-TRIGGER-LOGIK

Beide Runs haben llms.txt als "advisory" eingestuft (kein Score-Impact, nur Info-Finding bis Standard stabilisiert).

Offen ist: **Wann genau feuert die advisory-Regel?**

Drei mögliche Trigger-Logiken:

A) **Existenz-Check:** Finding feuert, wenn keine llms.txt im Repo-Root liegt. Severity: info. Botschaft: "llms.txt gehört zu modernen AI-Crawler-Praktiken. Wenn ihr AI-Sichtbarkeit wollt, prüft ob llms.txt für euer Projekt sinnvoll ist."

B) **Format-Check (wenn vorhanden):** Finding feuert nur, wenn llms.txt existiert aber nicht dem (informellen) Format folgt. Severity: info. Wenn llms.txt nicht existiert, schweigt Tropen.

C) **Hybrid:** Existenz-Check als low Info, Format-Check (wenn vorhanden) als medium Should.

D) **Anders:** Eigener Vorschlag, falls A-C nicht passen.

Welche Trigger-Logik empfiehlst du, mit welcher Begründung? Berücksichtige:

- llms.txt ist kein W3C-/RFC-Standard, sondern community-driven (Stand 2026-05). Standard kann sich ändern.
- Vibe-Coder hat oft keine Vorbildung zu llms.txt — Existenz-Check könnte als Spam wirken
- Wenn Tropen-Achse 9 (Doku-Hygiene) Wert legt auf "wir sehen Drift, den andere nicht sehen", spricht das für aktiven Existenz-Check

Format:

### llms.txt-Trigger — empfohlen: [A/B/C/D]

[Begründung in 3-5 Sätzen]

### Risiko deiner Empfehlung

[Was könnte schiefgehen, was sind False-Positive- oder False-Negative-Fallen]

---

OUTPUT-FORMAT

# AI-Discoverability Followup — [Modell]

## Frage 1 — Implementierungs-Reihenfolge pro Profil

[Antwort wie oben spezifiziert]

## Frage 2 — llms.txt-Trigger-Logik

[Antwort wie oben spezifiziert]

## Querliegende Anmerkung

[Eine Beobachtung über beide Fragen hinweg, falls relevant — max. 3 Sätze]`,

  judgePrompt: `Du bist Judge im AI-Discoverability-Mini-Followup-Komitee. Vier Modelle haben zwei Fragen beantwortet: Implementierungs-Reihenfolge pro Profil, llms.txt-Trigger-Logik.

Deine Aufgabe ist eine knappe, entscheidungs-orientierte Synthese — nicht 10 Seiten.

Output-Format:

# AI-Discoverability Followup — Synthese

## Konsens Frage 1 — Reihenfolge Profil 3

[Welche Reihenfolge wird mehrheitlich vorgeschlagen? Welche Regeln sind in der Reihenfolge stabil, welche umstritten?]

## Konsens Profile 2 und 4

[Knappe Synthese, 2-3 Sätze pro Profil]

## Konsens Frage 2 — llms.txt-Trigger

[Welche Trigger-Logik wird mehrheitlich empfohlen? Begründung.]

## Drei Implikationen für ADR-029

[Was muss das Tropen-Team aus diesen Antworten in ADR-029 verankern?]

## Mein Founder-Rat

[Falls eine Empfehlung trotz Konvergenz fragwürdig ist — Hinweis. Sonst: 'Empfehlungen sind tragfähig.']`,
}
