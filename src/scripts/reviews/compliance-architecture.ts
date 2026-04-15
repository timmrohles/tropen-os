import type { CommitteeReviewConfig } from '../committee-review'

export const config: CommitteeReviewConfig = {
  name: 'compliance-architecture',

  contextFiles: [
    'docs/committee-reviews/input-compliance-architecture.md',
    'docs/product/roadmap-2026-q2.md',
  ],

  contextTransforms: {
    'docs/product/roadmap-2026-q2.md': (c) =>
      c.split('\n').slice(0, 80).join('\n') + '\n... (gekuerzt)',
  },

  systemPrompt: `Du bist ein erfahrener Legal-Tech Product Strategist mit Expertise in EU-Compliance (DSGVO, AI Act, BFSG, E-Commerce-Recht) und Developer Tools.

Du beraetst einen Solo-Founder der ein Code-Quality-Tool fuer "Vibe Coders" baut — Entwickler die mit KI-Tools wie Cursor, Lovable, Claude Code Apps generieren. Das Tool scannt Code und findet Compliance-Luecken.

DIFFERENZIATOR: Kein US-Tool deckt EU-Compliance ab. Das ist der Moat.

BENCHMARK-ERGEBNIS: 100% der Lovable-Apps haben DSGVO-Luecken. 7 von 23 "100%-Findings" sind Compliance-Regeln die bei jedem Projekt triggern.

PROBLEM: Bisherige Checks decken nur 3 von 6 relevanten Compliance-Domaenen ab. Die vollstaendige Landkarte hat 6 Domaenen + App Store Bonus.

CONSTRAINT: Solo-Founder, max 1 Woche fuer MVP-Erweiterung, Deutschland-first. Vibe-Coder sind keine Juristen — Sprache muss einfach sein.

Bewerte pragmatisch. Konkrete Empfehlungen mit Aufwandsschaetzung.`,

  userPrompt: `BEWERTE DIESE 6 FRAGEN:

1. PROFIL-DESIGN: Reichen 3 Fragen?

   Frage 1: "Was fuer eine App?" (Portfolio/SaaS/E-Commerce/Blog/Mobile)
   Frage 2: "Wo sind deine Nutzer?" (DE/EU/Weltweit/Intern)
   Frage 3: "Was ist drin?" (Multi-Select: Login/Bezahlung/KI/Affiliate/UGC)

   Daraus leiten sich die relevanten Domaenen ab.
   Reichen 3 Fragen oder brauchen wir mehr?

2. MVP-SCOPE: Welche Domaenen zuerst?

   A) Nur Universal-Pflichten (Impressum + DSGVO-Basics)
   B) Top 3 nach Risiko (DSGVO + Fernabsatz + Impressum)
   C) Profil-first (alle Domaenen, aber nur relevante anzeigen)
   Constraint: Max 1 Woche.

3. E-COMMERCE-TIEFE fuer Vibe-Coder?

   Jede SaaS mit Subscription = Fernabsatzvertrag.
   A) Nur "AGB + Widerrufsbelehrung vorhanden?"
   B) Auch Checkout-Flow-Checks (Button-Text, Preistransparenz)
   C) Vollstaendiger E-Commerce-Check

4. AFFILIATE-CHECKS: Automatisierbar?

   A) Erkennung von Affiliate-URLs (amazon tag=, awin1, etc.)
   B) Pruefung ob "Werbung"/"Anzeige" in der Naehe
   C) Nur Hinweis-Finding

5. APP STORE: Eigene Domaene oder Overlap?

   A) Eigene Domaene
   B) In bestehende integrieren (Privacy->DSGVO, AI->AI Act)
   C) Nur als Hinweis

6. NAMING: Wie benennen wir die Domaenen im UI?

   Vorschlag: Datenschutz / KI-Transparenz / Barrierefreiheit / Online-Handel / Werbekennzeichnung / Impressum & Recht
   Jede mit Ampel + Bussgeld-Range. Passt das?

---

ZUSAETZLICH:
Skizziere die technische Architektur fuer das Profil-System:
- Wie wird das Profil gespeichert?
- Wie beeinflusst es den Score?
- Wie werden N/A-Regeln behandelt?`,

  judgePrompt: `4 Modelle haben die Compliance-Architektur einer Code-Quality-Plattform bewertet — 6 Fragen.

Kern: 6 Compliance-Domaenen fuer DE-basierte Web-Apps. Solo-Founder, max 1 Woche MVP. 3-Fragen-Profil bestimmt welche Domaenen relevant sind.

Destilliere den Konsens:

Fuer jede der 6 Fragen:
1. Konsens-Level (EINIG | MEHRHEIT | GESPALTEN)
2. Empfohlene Option
3. Konkreter naechster Schritt

KERNENTSCHEIDUNG:
- Reichen 3 Profil-Fragen?
- Welche Domaenen im MVP?
- Wie tief E-Commerce?

ARCHITEKTUR:
- Profil-Schema (DB-Struktur)
- Score-Anpassung basierend auf Profil
- N/A-Regel-Handling

PRIORISIERTE TODO-LISTE: Max 5 Schritte.`,
}
