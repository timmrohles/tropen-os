import type { CommitteeReviewConfig } from '../committee-review'

export const config: CommitteeReviewConfig = {
  name: 'dogfood-komitee-1',

  contextFiles: [
    'docs/audit-reports/dogfood-2026-05-04.md',
    'docs/webapp-manifest/audit-system.md',
    'docs/checker-design-patterns.md',
  ],

  contextTransforms: {
    'docs/webapp-manifest/audit-system.md': (c) =>
      c.split('\n').slice(0, 80).join('\n') + '\n... (gekürzt)',
    'docs/checker-design-patterns.md': (c) =>
      c.split('\n').slice(0, 60).join('\n') + '\n... (gekürzt)',
  },

  systemPrompt: `Du bist Mitglied eines Multi-Model-Komitees, das die Audit-Engine von Tropen OS reviewen soll.
Tropen OS ist eine Production-Readiness-Plattform für Vibe-Coder (Entwickler die mit Lovable/Cursor/Bolt arbeiten).
Die Engine prüft Code mit 147 automatisierten Rules in 26 Kategorien. Coach-Position: ehrlicher Advisor, kein Werkzeug.

Deine Aufgabe: 4 konkrete Rule-Fragen aus einem Self-Dogfood-Sprint beantworten. Pro Frage:
1. Konsens-Empfehlung — eine klare Empfehlung mit Option-Buchstabe und kurzer Begründung (2-4 Sätze)
2. Pattern-Beobachtung — falls die Frage ein übergeordnetes Pattern aufzeigt das andere Rules betrifft, kurz benennen
3. Konsequenz für Coach-Position — wie wirkt die Empfehlung auf Vibe-Coder ohne Senior-Engineer-Reflex

Wichtige Disziplin:
- Severity-Definition: critical/high/medium/low/info — info = "informativ", NICHT "manueller Fix"
- Vibe-Coder haben ähnliche Muster: alte Lovable-Experimente, geparkte Cursor-Sessions, unfertige Features
- Tropen OS hat eingefrorene Phase-4-Komponenten (Agenten, Feeds, Workspaces, Chat) — bewusst nicht angefasst bis Phase 4
- False Positives sind Trust-Killer bei Vibe-Coder-Zielgruppe`,

  userPrompt: `VIER FRAGEN AUS DEM SELF-DOGFOOD-SPRINT — BITTE PRO FRAGE ANTWORTEN:

---

FRAGE 1 — Frozen-Code-Exclusion (cat-1-rule-10 + cat-2-rule-12)

Tropen OS hat Checker für "oversized components" (68 Findings) und "high cognitive complexity" (48 Findings).
Über 60% der Findings liegen in eingefrorenen Phase-4-Pfaden: /agenten/, /feeds/, /workspaces/, /chat/.
Diese Pfade sind bewusst nicht angefasste ältere Komponenten — kein aktiver Tech-Debt im klassischen Sinn.

Optionen:
A — Frozen-Pfade vom Checker excluden (Konvention: bestimmte Pfade aus Rule-Scope nehmen)
B — Findings stehen lassen, im Audit-UI als "frozen code" markieren (analog zu False-Positive-Tags)
C — Findings stehen lassen, im Score reflektieren — ehrliche Gesamtschulden-Anzeige

Besondere Relevanz: Vibe-Coder haben dieselbe Situation — alte Lovable-Experimente, geparkte Cursor-Sessions
die man nicht mehr anfassen will. Wie soll Tropen OS damit umgehen?

---

FRAGE 2 — Prop Drilling Severity (cat-9-rule-6)

Rule cat-9-rule-6 "prop drilling detected" hat aktuell Severity "info" (Weight 0).
Sie findet Komponenten die 3+ Props unverändert weiterreichen.

Severity-Definition:
- info (0) = informativ, kein Fix nötig
- low (1) = Stil-Optimierung, Nice-to-have
- medium (2) = Code-Qualität, Wartbarkeit
- high (3) = dringende Probleme

Frage: Die Empfehlung "React Context oder Zustand verwenden" ist eine konkrete Code-Aktion — was gegen "info" spricht.
Aber: 3-Props-Forwarding ist nicht akut bug-anfällig. Welche Severity ist angemessen?

---

FRAGE 3 — Approaching 300-Zeilen-Limit (cat-25-rule-2)

Rule cat-25-rule-2 prüft Dateigröße. 12 Dateien triggern (300+ Zeilen).
Beispiele: TopBar.tsx (326 Zeilen, bewusst wegen Hydration-Guards), ArtifactRenderer.tsx (495 Zeilen, real zu groß).

Frage: Soll der Checker zwischen "soft approach" und "hard violation" unterscheiden?

A — score=4 für alle 300+, wie aktuell (keine Stufung)
B — score=3 für 300-400, score=5 für 400+ (Stufung nach Größe)
C — score=4 ab 400, darunter score=2 als Frühwarnung
D — Stufung anders (bitte spezifizieren)

---

FRAGE 4 — IaC ohne Terraform (cat-11-rule-4)

Rule cat-11-rule-4 "Infrastructure as Code" gibt score=3 weil kein Terraform/Pulumi vorhanden.
Tropen OS hat vercel.json als Vercel-native IaC.

Frage: Sollte Vercel-native IaC als gleichwertig gelten?

A — Vercel-native IaC als score=4 anerkennen (gleichwertig minus Multi-Cloud-Fähigkeit)
B — Vercel-native IaC als score=5 anerkennen (gleichwertig, weil Vibe-Coder-Zielgruppe)
C — score=3 belassen — Terraform/Pulumi sind Industrie-Standard für ernsthafte Skalierung

Kontext: Vibe-Coder deployen primär auf Vercel/Netlify. Terraform ist für sie typischerweise overkill.
Bewertet die Regel die Tatsache "IaC vorhanden" oder die spezifische Tool-Wahl?

---

Bitte für jede Frage:
1. Klare Empfehlung (Option A/B/C/D) mit 2-3 Sätzen Begründung
2. Pattern-Beobachtung (falls übergreifend relevant)
3. Konsequenz für Vibe-Coder-Zielgruppe`,

  judgePrompt: `4 Modelle haben unabhängig 4 Checker-Design-Fragen für Tropen OS bewertet.
Tropen OS ist eine Production-Readiness-Plattform (Coach-Position) für Vibe-Coder mit 147 automatisierten Rules.

Destilliere den Konsens für alle 4 Fragen:

Pro Frage:
1. Konsens-Level: EINIG | MEHRHEIT | GESPALTEN
2. Empfohlene Option (A/B/C/D)
3. Kern-Begründung (2-3 Sätze)
4. Pattern-Beobachtung (falls Modelle übergreifende Muster erkannt haben)
5. Konsequenz für Coach-Position

ÜBERGREIFENDE ANALYSE:
- Gibt es ein gemeinsames Pattern über alle 4 Fragen?
- Welche Frage ist am dringendsten zu entscheiden (vor Beta)?
- Welche Entscheidung hat den größten Einfluss auf Vibe-Coder-Vertrauen?

TIMM-ENTSCHEIDUNGS-LISTE:
Max. 4 konkrete Entscheidungen die Timm nach diesem Review treffen muss.`,
}
