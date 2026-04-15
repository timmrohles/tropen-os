import type { CommitteeReviewConfig } from '../committee-review'

export const config: CommitteeReviewConfig = {
  name: 'batch-fix-strategy',

  contextFiles: [
    'docs/committee-reviews/input-batch-fix-strategy.md',
    'docs/webapp-manifest/manifesto.md',
  ],

  contextTransforms: {
    'docs/webapp-manifest/manifesto.md': (c) => c.split('\n').slice(0, 60).join('\n'),
  },

  systemPrompt: `Du bist ein erfahrener Product Strategist und UX Expert für Developer Tools.
Du verstehst wie Entwickler (insbesondere Vibe-Coders die mit KI-Tools wie Cursor,
Lovable, Claude Code arbeiten) mit Tools interagieren und wo sie scheitern.

Das Produkt ist ein Production Readiness Guide: es scannt Quellcode, findet Probleme,
und generiert Fix-Prompts die der User in sein Coding-Tool kopiert.

Positionierung: "Advisor not Mechanic" — das Produkt fixen nicht selbst, es berät.
Prompt-Qualität ist der zentrale Differenziator.

Sei konkret, kritisch, und pragmatisch. Denke in User-Verhalten, nicht in Features.
Berücksichtige die Constraint: Solo-Founder-Team, Aufwand muss realistisch sein.`,

  userPrompt: `AUFGABE: Beantworte jede der 6 Fragen zur Batch Fix Strategy separat und konkret.

Vollständiges Briefing:
{{docs/committee-reviews/input-batch-fix-strategy.md}}

Produkt-Manifest (Auszug):
{{docs/webapp-manifest/manifesto.md}}

---

BEANTWORTE JEDE FRAGE SEPARAT:

### Frage 1: Kategorisierung
Brauchen wir explizite Finding-Typen (Code-Fix / Refactoring / Nicht-Code / etc.)?
- Konkrete Empfehlung: Ja oder Nein, mit Begründung
- Wenn Ja: welche Kategorien genau, und wie viele sind für den User verständlich?
- Wie wird die Kategorisierung im UI kommuniziert ohne zu verwirren?

### Frage 2: Batch vs. Sequential
Welche Option (A/B/C/D) ist die richtige, und warum?
- Konkrete Empfehlung mit Begründung
- Was sind die Hauptrisiken der empfohlenen Option?
- Was ist der minimale MVP für diese Option?

### Frage 3: N×1 Findings
Wenn 82 Dateien dasselbe Problem haben — wie soll der Export-Prompt aussehen?
- Konkrete Prompt-Struktur (skizziert)
- Wie viele Dateien maximal in einem Prompt?
- Was passiert mit den restlichen Dateien?

### Frage 4: Nicht-Code Findings
Was passiert im Export mit "AVV fehlt" oder "Backup-Strategie prüfen"?
- Konkrete Empfehlung: exportieren oder nicht?
- Wenn separiert: wie sieht die separate Liste aus?

### Frage 5: Qualitätsrisiko
Ist Batch-Fixing empfehlenswert oder eher abraten?
- Konkretes Limit wenn Ja (Anzahl Findings)
- Wie wird das Limit kommuniziert ohne den User zu bevormunden?
- Reputationsrisiko: wessen Schuld ist es wenn Cursor Chaos anrichtet?

### Frage 6: UX Export-Flow
Wie sieht der konkrete Export-Flow aus?
- Skizziere die UX (welche Buttons, welche Ebenen)
- Was ist der kleinste Scope der den User-Wunsch ("alles auf einmal") befriedigt
  ohne das Qualitätsrisiko einzugehen?

ZUSÄTZLICH: Gibt es eine Frage die wir nicht stellen die wir stellen sollten?`,

  judgePrompt: `4 Modelle haben unabhängig 6 Fragen zur Batch Fix Strategy eines
Production Readiness Guides für Vibe-Coders beantwortet.

Positionierung: "Advisor not Mechanic" — das Produkt berät, fixin nicht selbst.
Constraint: Solo-Founder-Team.

DEINE AUFGABE als Judge:

Für jede der 6 Fragen:
1. KONSENS-LEVEL: EINIG | MEHRHEIT | GESPALTEN
2. EMPFEHLUNG: Eine klare Empfehlung in einem Satz
3. BEGRÜNDUNG: Warum diese Empfehlung (2-3 Sätze)
4. NÄCHSTER SCHRITT: Was konkret als erstes gebaut/entschieden werden muss

ÜBERGREIFENDE ANALYSE:

KERNENTSCHEIDUNG:
- Was ist die wichtigste Entscheidung unter den 6 Fragen?
- Welche Entscheidung hat den größten Impact auf UX und Reputation?

WARNUNGEN:
- Gibt es Empfehlungen der Modelle die gefährlich sind?
- Gibt es falsche Annahmen in den Fragen selbst?
- Was passiert wenn Cursor/Claude Code nativ "Fix all"-Features einbauen?

IMPLEMENTATION PRIORITY:
- Was sollte zuerst gebaut werden? (Reihenfolge der 6 Aspekte nach Impact/Aufwand)
- Was kann bis nach dem ersten Kunden warten?

Format: Pro Frage ein klarer Block. Keine Ausweichungen. Konkrete Empfehlungen.`,
}
