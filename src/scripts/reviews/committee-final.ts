import type { CommitteeReviewConfig } from '../committee-review'

export const config: CommitteeReviewConfig = {
  name: 'committee-final-2026-04-15',

  contextFiles: [
    'docs/audit-reports/committee-review-2026-04-15.md',
    'docs/audit-reports/benchmark-2026-04-15-v7-analysis.md',
    'docs/audit-reports/checker-coverage-2026-04-15.md',
  ],

  systemPrompt: `Du bist ein erfahrener Senior Developer und Produktstratege.
Du reviewst das Audit-System "Tropen OS" — ein Production-Readiness-Tool fuer Vibe-Coder (Entwickler die mit Lovable, Bolt, Cursor bauen).

DATEN DIE DU KENNST:
- 233 Regeln, 25 Kategorien, 27 Agenten
- 49 Repos gescannt: Manual 87.8% > Cursor 83.2% > Lovable 79.7% > Bolt 70.9%
- StdDev 6.5, Spread 40% (47.9–87.8%)
- 32 Stable, 16 Risky, 1 Prototype, 0 Production
- Solo-Founder, noch keine externen Nutzer

Sei konkret und direkt. Keine generischen Antworten. Wenn du eine Empfehlung gibst, nenne das groesste Risiko wenn du falsch liegst.`,

  userPrompt: `Lies das Komitee-Dokument und beantworte diese 6 Fragen:

FRAGE 1 — Plattform-spezifische Agenten (Lovable / Bolt / Cursor)
Benchmark zeigt: Manual 87.8%, Cursor 83.2%, Lovable 79.7%, Bolt 70.9%.
Optionen:
A) Plattform-spezifische Checker und Fix-Prompts
B) Generisch bleiben, Plattform nur im Report anzeigen
C) Erst nach PMF entscheiden

Deine Empfehlung (A/B/C), Begruendung (max 3 Saetze), groesstes Risiko.

FRAGE 2 — Score-Algorithmus: Projekt-Typ beruecksichtigen?
Ein 28-Datei-Projekt bekommt 48%, ein 269-Datei-Projekt 84%.
Optionen:
A) Projekt-Typ als Profil-Feld mit angepassten Gewichten
B) Complexity-Faktor mildern
C) Einheitlicher Algorithmus, Kontext in der Darstellung

Deine Empfehlung (A/B/C), Begruendung (max 3 Saetze), groesstes Risiko.

FRAGE 3 — UX-Schicht: Wann?
Checker-Stack ist vollstaendig. Findings sind eine flache Liste.
Optionen:
A) Sofort — UX ist der Differenziator
B) Nach erstem Nutzer-Test
C) Parallel — UX-Sprint neben Checker-Ausbau

Deine Empfehlung (A/B/C), Begruendung (max 3 Saetze), groesstes Risiko.

FRAGE 4 — Manuelle Checks (64 von 233 Regeln)
Optionen:
A) Als "nicht geprueft" markieren
B) LLM-basierter Review
C) Self-Assessment im Onboarding

Deine Empfehlung (A/B/C), Begruendung (max 3 Saetze), groesstes Risiko.

FRAGE 5 — Was ist der groesste blinde Fleck in diesem System?
(Etwas das die Benchmark-Zahlen nicht zeigen aber fuer echte Nutzer kritisch ist)

FRAGE 6 — Was wuerde ein echter Vibe-Coder als erstes kritisieren?
(Stell dir vor: ein 22-jaehriger Lovable-User oeffnet den Audit-Report zum ersten Mal)`,

  judgePrompt: `4 Modelle haben das Audit-System "Tropen OS" bewertet — 4 Entscheidungsfragen + 2 offene Fragen.

Kontext: Production-Readiness-Scanner fuer Vibe-Coder. 233 Regeln, 49 Repos getestet. Solo-Founder, kein PMF.

Destilliere den Konsens:

Fuer jede der 4 Entscheidungsfragen:
1. Konsens-Level (EINIG | MEHRHEIT | GESPALTEN)
2. Empfohlene Option (A/B/C)
3. Begruendung in 1 Satz
4. Groesstes Risiko

BLINDE FLECKEN:
- Was haben MEHRERE Modelle unabhaengig als blinden Fleck genannt?

VIBE-CODER-KRITIK:
- Was wuerden echte Nutzer am ehesten kritisieren? (Konsens der 4 Modelle)

PRIORISIERTE NAECHSTE SCHRITTE:
5 konkrete Schritte mit Zeitschaetzung, sortiert nach Impact.`,
}
