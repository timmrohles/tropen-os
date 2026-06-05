// src/scripts/reviews/korsett-v1.ts
// Komitee-Runde 2: Verifikation des überarbeiteten Korsett v1 gegen das Runde-1-Review.

import type { CommitteeReviewConfig } from '../committee-review'

export const config: CommitteeReviewConfig = {
  name: 'korsett-v1',
  contextFiles: [
    'docs/plans/begleiter-korsett-v1.md',
    'docs/committee-reviews/korsett-v0-review.md',
  ],
  systemPrompt: `Du bist ein erfahrener Senior-Software-Architekt UND EU/DACH-Compliance-Reviewer.

Im Kontext stehen zwei Dokumente: (1) **Korsett v1** — eine Foundation-Checkliste, die ein KI-Begleiter einem Solo-Vibe-Coder (EU, baut mit Lovable/Cursor/Bolt auf Supabase + Next.js, 6 Monate Runway) VOR dem Bauen vorlegt; (2) das **Runde-1-Review**, dessen Konsens-Findings in v1 eingearbeitet wurden.

Dies ist **Runde 2**. Deine Haltung bleibt adversarial — finde, was noch fehlt oder jetzt falsch ist. KEIN Nicken.

Design-Prinzipien (Verstöße sind Findings):
- **Korsett, keine Zwangsjacke** — v1 ist größer geworden; achte besonders auf **Über-Korrektur**.
- **Awareness, kein Gate** — informiert, blockiert nie. Pro Projekt entfallen ganze Äste; nur *zutreffende* 🔴 sind ein Muss.
- **Advisor, kein Anwalt** — nur Stufe-1-Hinweise.
- 🔴 = aufschieben wird teurer Umbau; 🟡 = nachrüstbar.`,
  userPrompt: `Bewerte Korsett v1 (Runde 2) konkret entlang dieser vier Fragen — mit Knoten-IDs:

1. **ADRESSIERT?** — Wurden die Runde-1-Konsens-Findings (Frontend fehlt, API/Deploy/Storage fehlen, U6/A1 falsch klassifiziert, Legal zu granular, Baum-Reihenfolge) in v1 **adäquat** umgesetzt? Wo nur halb?

2. **ÜBER-KORRIGIERT?** — v1 hat ~30 Knoten. Ist es jetzt eine **Zwangsjacke** für einen Solo-Vibe-Coder? Welche Knoten zusammenlegen oder streichen? (Bedenke: pro Projekt entfallen ganze Äste — werte nur echtes Über-Engineering, nicht bloße Größe.)

3. **NEUE LÜCKEN?** — Was fehlt jetzt noch, das ein Senior beim Kickoff klären würde? (z.B. Seed-/Demo-Daten, E-Mail-Versand, Background-Jobs/Cron, Feature-Flags, Internationalisierung, Accessibility-Basis im Frontend.)

4. **KLASSIFIKATION** — Stimmt die 🔴/🟡-Verteilung jetzt? Konkrete Fehleinstufungen?

Antworte strukturiert pro Frage, knapp, mit Knoten-IDs.`,
  judgePrompt: `Destilliere einen Abschlussbericht für die Entscheidung "Korsett v1 fertig oder Runde 3 nötig?".

Struktur:
1. **Konvergenz-Urteil** — Ist v1 reif genug zum Festschreiben, oder braucht es eine weitere Runde? Klare Empfehlung.
2. **Verbleibende Konsens-Findings** (was wirklich noch rein muss) — pro Punkt Konsens-Level (EINIG/MEHRHEIT/GESPALTEN/EINZELMEINUNG).
3. **Über-Korrektur** — was zusammenlegen/streichen, mit Konsens-Level.
4. **Restliche Fehlklassifikationen** (🔴↔🟡).
5. **Priorisierte Änderungsliste v1 → v2** (oder "keine — festschreiben").

Trenne EINIG scharf von Einzelmeinung. Eine Einzelmeinung ist kein Auftrag zur Änderung.`,
}
