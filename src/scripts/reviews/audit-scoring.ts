import type { CommitteeReviewConfig } from '../committee-review'

export const config: CommitteeReviewConfig = {
  name: 'audit-scoring',
  contextFiles: [
    'docs/webapp-manifest/audit-system.md',
    'docs/webapp-manifest/engineering-standard.md',
    'src/lib/audit/scoring/score-calculator.ts',
    'src/lib/audit/rule-registry.ts',
  ],
  contextTransforms: {
    'docs/webapp-manifest/engineering-standard.md': (content) =>
      content.split('\n').slice(0, 200).join('\n') + '\n... (gekürzt)',
    'src/lib/audit/rule-registry.ts': (content) =>
      content.split('\n').slice(0, 300).join('\n') + '\n... (gekürzt)',
  },
  systemPrompt: `Du bist ein Quality Assurance Engineer der Audit-Scoring-Systeme bewertet.
Das System hat 25 Kategorien mit Gewichten (1-3) und Regeln mit Scores (0-5).
Bewerte ob die Gewichtung, Formeln und Schwellenwerte sinnvolle Ergebnisse produzieren.
Sei konkret — zeige Rechenbeispiele wenn du Probleme identifizierst.`,

  userPrompt: `Aktueller Score des Projekts: 71.3% (Status: Stable).

BEWERTE DIESE 5 ASPEKTE:

1. GEWICHTUNG DER KATEGORIEN
   Security (×3), Testing (×3), CI/CD (×3), Observability (×3), Backup (×3) haben alle Gewicht 3.
   Design System (×1), i18n (×1), PWA (×1) haben Gewicht 1.
   Ist das fair? Sollte z.B. Accessibility (×2) nicht ×3 sein?
   Welche Gewichte würdest du ändern und warum? Zeige konkreten Impact auf den Score.

2. SCORE-SCHWELLENWERTE
   85-100% = Production Grade, 70-84% = Stable, 50-69% = Risky, <50% = Prototype.
   Sind diese Schwellen realistisch? Ein Projekt mit 71% wird "Stable" genannt — ist das zu großzügig?
   Welche Schwellen wären angemessener für ein B2B SaaS Produkt?

3. VERZERRUNG DURCH NICHT-ANWENDBARE REGELN
   i18n = 0 bei einem bewusst deutschsprachigen Produkt.
   PWA = 0 bei einer App die keine PWA sein will.
   Diese Regeln drücken den Score künstlich nach unten.
   Wie sollte das System mit "not applicable" Regeln umgehen? Ignorieren? Separater Score?
   Was wäre der Score ohne i18n und PWA?

4. FORMEL-VALIDIERUNG
   Formel: Σ(rule_score × weight) / Σ(5 × weight) × 100
   Produziert das bei 50% automatisierten und 50% manuellen Regeln ein sinnvolles Ergebnis?
   Was passiert wenn nur 30% der Regeln automatisiert bewertbar sind — ist der Score dann noch aussagekräftig?

5. KILLER-KRITERIEN
   Ein Projekt mit Security 5/5 und Testing 0/5 hat denselben Gesamt-Score wie
   eines mit Security 2.5/5 und Testing 2.5/5.
   Sollte es Kategorien geben die unter einem Minimum den Gesamt-Status blockieren?
   Welche Kategorien wären Killer-Kriterien — und bei welchem Minimum?`,

  judgePrompt: `Destilliere die 4 Bewertungen des Audit-Scoring-Systems.
Für jeden der 5 Aspekte:
- Konsens-Level (EINIG | MEHRHEIT | GESPALTEN)
- Empfohlene Änderung mit konkretem Impact auf den aktuellen Score (71.3%)
- Priorität (sofort / bald / später)

Besonders wichtig: Für jeden vorgeschlagenen Gewichts- oder Schwellenwert-Change —
berechne was der neue Score wäre (Ausgangspunkt: 71.3%).`,
}
