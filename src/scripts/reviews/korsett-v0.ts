// src/scripts/reviews/korsett-v0.ts
// Adversariale Komitee-Verifikation des Foundation-Korsett v0.

import type { CommitteeReviewConfig } from '../committee-review'

export const config: CommitteeReviewConfig = {
  name: 'korsett-v0',
  contextFiles: [
    'docs/plans/begleiter-korsett-v0.md',
    'docs/plans/begleiter-foundation-korsett.md',
  ],
  systemPrompt: `Du bist ein erfahrener Senior-Software-Architekt UND Produkt-Reviewer mit Fokus auf EU/DACH-Compliance.

Du prüfst eine "Foundation-Taxonomie" (Korsett v0) — eine Checkliste von Entscheidungen, die ein KI-Begleiter einem **Solo-Vibe-Coder** VOR dem Bauen vorlegt. Zielnutzer: technisch eher schwach, baut mit Lovable/Cursor/Bolt auf Supabase + Next.js, sitzt in der EU, hat 6 Monate Runway.

Deine Haltung ist **adversarial**: Deine Aufgabe ist NICHT, zu loben, sondern **Lücken, Fehlklassifikationen und Über-Engineering zu finden**. Ein Nicken ist wertlos. Sei konkret, mit Knoten-IDs und Beispielen.

Beachte die Design-Prinzipien des Tools (Verstöße sind ebenfalls Findings):
- **Korsett, keine Zwangsjacke** — lieber zu wenige als zu viele Knoten. Ein früheres Komitee flaggte "195 Regeln zu viele".
- **Awareness, kein Gate** — informiert, blockiert nie.
- **Advisor, kein Anwalt** — nur Stufe-1-Hinweise, keine Rechtsberatung.
- **Aufschub-Kosten**: 🔴 = aufschieben wird teurer Umbau; 🟡 = nachrüstbar. Eine Fehlklassifikation ist ein ernstes Finding.`,
  userPrompt: `Im Kontext oben stehen zwei Dokumente: das Korsett v0 (der Entscheidungsbaum) und das zugrundeliegende Konzept.

Bewerte das Korsett v0 adversarial entlang dieser fünf Achsen — pro Achse konkret mit Knoten-IDs:

1. **VOLLSTÄNDIGKEIT** — Fehlt ein **universeller Knoten** oder ein **Pivot**? Was würde ein Senior beim Projekt-Kickoff fragen, das hier fehlt? (Denk an: Frontend-Architektur/State, API-Design, Testing/Verifikation, Deploy/CI, Realtime, Datei-Uploads, E-Mail/Notifications, Internationalisierung, Performance-Budget, Onboarding/Seed-Daten.)

2. **FEHLKLASSIFIKATION** — Ist ein 🟡-Knoten in Wahrheit 🔴 (oder umgekehrt)? Wo ist die Aufschub-Kosten-Einstufung falsch?

3. **ÜBER-ENGINEERING** — Welche Knoten sind für einen Solo-Vibe-Coder zu viel und sollten gestrichen oder zusammengelegt werden? (Korsett, keine Zwangsjacke.)

4. **BAUM-FORM** — Sind das die richtigen 7 Pivots? Fehlt eine Verzweigung, ist eine überflüssig, ist ein "universeller" Knoten in Wahrheit stack-spezifisch?

5. **COMPLIANCE-TIEFE** — Ist die Legal-Synthese (P6) korrekt und vollständig genug für EU/DACH, ohne in Rechtsberatung abzurutschen? Fehlt eine Pflicht, ist eine falsch?

Antworte strukturiert pro Achse. Sei knapp, aber konkret.`,
  judgePrompt: `Destilliere aus den vier Bewertungen einen Abschlussbericht für die Überarbeitung zu Korsett v1.

Struktur:
1. **Fehlende Knoten/Pivots** — pro Vorschlag: Konsens-Level (EINIG/MEHRHEIT/GESPALTEN) + ob aufnehmen. Nur was mehrheitlich genannt wurde.
2. **Fehlklassifikationen** (🔴↔🟡) — mit Konsens-Level.
3. **Streichen/Zusammenlegen** (Über-Engineering) — mit Konsens-Level.
4. **Baum-Form-Kritik** — Pivots korrekt?
5. **Compliance-Lücken**.
6. **Priorisierte Änderungsliste v0 → v1** (sofort / bald / später).

Wichtig: Trenne klar zwischen EINIG (alle vier) und Einzelmeinung. Eine Einzelmeinung ist kein Konsens — markiere sie als solche.`,
}
