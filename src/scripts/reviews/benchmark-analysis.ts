import type { CommitteeReviewConfig } from '../committee-review'

export const config: CommitteeReviewConfig = {
  name: 'benchmark-analysis',

  contextFiles: [
    'docs/committee-reviews/input-benchmark-analysis.md',
    'docs/product/roadmap-2026-q2.md',
    'docs/webapp-manifest/audit-system.md',
  ],

  contextTransforms: {
    'docs/product/roadmap-2026-q2.md': (c) =>
      c.split('\n').slice(0, 80).join('\n') + '\n... (gekuerzt)',
    'docs/webapp-manifest/audit-system.md': (c) =>
      c.split('\n').slice(0, 60).join('\n') + '\n... (gekuerzt)',
  },

  systemPrompt: `Du bist ein erfahrener Product Strategist und Developer Tools Architect mit Expertise in Code-Quality-Scoring-Systemen, Developer Marketing und EU-Compliance.

Du beraetst einen Solo-Founder der ein "Production Readiness Guide" fuer Vibe-Coders baut. Das Produkt scannt Code mit 188 Regeln und erzeugt Findings.

BENCHMARK-ERGEBNIS:
41 oeffentliche Lovable-Projekte gescannt. Alle scoren 72.3% ± 0.82 (Risky). Kein einziges ist Stable oder Production-ready. 23 Regeln triggern bei 100% aller Repos — sie dominieren den Score und machen ihn fuer individuelle Qualitaetsbewertung nutzlos.

STRATEGISCHES DILEMMA:
1. Score muss individuelle Qualitaet messen — aktuell tut er das nicht
2. EU-Compliance-Findings (7 von 23 "100%-Regeln") sind Differenziator aber auch Noise-Risiko
3. Die Daten sind Content-Gold fuer Marketing — aber der Ton muss stimmen
4. Lovable ist potenzieller Partner, nicht Gegner

Bewerte pragmatisch. Solo-Founder mit begrenzter Zeit. Konkrete Empfehlungen.`,

  userPrompt: `BEWERTE DIESE 6 FRAGEN:

1. KALIBRIERUNGSPROBLEM: Score unterscheidet nicht (StdDev 0.82)

   23 "Template-Default"-Regeln treffen auf alle Repos zu und dominieren den Score. Die tatsaechliche Code-Qualitaet wird ueberlagert.

   A) Gewichtung aendern — Template-Default-Regeln niedriger gewichten
   B) Scoring-Modus — "Starter Score" vs "Full Score"
   C) Projekt-Profil — N/A-Kategorien basierend auf Typ (Template/MVP/Production)
   D) Baseline subtrahieren — Score relativ zum Durchschnitt
   E) Nicht-lineare Gewichtung die bei vielen gleichen Findings abflacht

2. WELCHE 100%-REGELN SIND LEGITIM, WELCHE NOISE?

   7 EU-Compliance, 8 Infrastruktur/Tooling, 5 Code-Qualitaet, 3 Sonstiges.
   Welche sind echte Probleme fuer Vibe-Coders, welche sind Enterprise-Anforderungen die nicht passen?
   Sollen Regeln fuer Vibe-Coder anders gewichtet werden als fuer Enterprise?

3. EU-COMPLIANCE: STAERKE ODER SCHWAECHE?

   Wenn DSGVO/BFSG bei JEDEM Projekt triggert = Hintergrundrauschen.
   A) Nur bei EU-Projekten anzeigen
   B) Eigene Kategorie, nicht im Hauptscore
   C) Prominent mit konkretem Risiko ("20.000 EUR Bussgeld")
   D) Staged Disclosure: erst Top 3, Rest bei Klick

4. CONTENT-STRATEGIE: Was publizieren?

   - "100% der Lovable-Apps haben DSGVO-Luecken"
   - "0 von 41 sind production-ready"
   - "Die 5 Fehler die JEDE KI-generierte App hat"

   Welche Headlines sind effektiv? Welche sind zu aggressiv?
   Wie ohne als Angst-Verkaeufer zu wirken?

5. CHECKER-QUALITAET: Was sind False Positives?

   - Typosquatting-Risiko bei 100%? Klingt nach FP.
   - Migrations-Naming bei Lovable/Supabase — echtes Problem?
   - "Dependency model partially enforced" — was bedeutet "partially"?

6. NAECHSTE SCHRITTE: Was zuerst?

   A) Score-Kalibrierung
   B) Content fuer Landing Page
   C) "Lovable Readiness Report" als Lead-Magnet
   D) Mehr Repos (100+) scannen
   E) Andere Quellen (Bolt, T3, ShipFast)
   F) Checker verfeinern

---

ARCHITEKTUR-EMPFEHLUNG:
Skizziere wie ein "Projekt-Profil" (Template/MVP/Production) die Scoring-Formel aendern koennte — konkretes Schema.`,

  judgePrompt: `4 Modelle haben unabhaengig die Benchmark-Ergebnisse einer Code-Quality-Plattform analysiert — 6 Fragen.

Kern: 41 Lovable-Projekte gescannt, alle ~72% Risky, StdDev 0.82. 23 Regeln triggern bei 100%. Score unterscheidet nicht zwischen Projekten. EU-Compliance ist Differenziator aber auch Noise-Risiko.

Destilliere den Konsens:

Fuer jede der 6 Fragen:
1. Konsens-Level (EINIG | MEHRHEIT | GESPALTEN)
2. Empfohlene Option
3. Konkreter naechster Schritt

KERNENTSCHEIDUNG:
- Wie kalibrieren wir den Score?
- Welche Regeln sind Noise fuer Vibe-Coders?
- Wie positionieren wir EU-Compliance ohne Fatigue?
- Welche Content-Strategie gewinnt?

WARNUNGEN:
- Was koennte Lovable als Partner vergraeulen?
- Welche Kalibrierung wuerde den Score verfaelschen?
- Was ist Over-Engineering fuer einen Solo-Founder?

PRIORISIERTE TODO-LISTE:
Max. 5 konkrete Schritte.`,
}
