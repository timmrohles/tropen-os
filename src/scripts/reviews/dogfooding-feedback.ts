import type { CommitteeReviewConfig } from '../committee-review'

export const config: CommitteeReviewConfig = {
  name: 'dogfooding-feedback',

  contextFiles: [
    'docs/committee-reviews/input-dogfooding-feedback-loop.md',
    'docs/product/roadmap-2026-q2.md',
    'docs/webapp-manifest/audit-system.md',
  ],

  contextTransforms: {
    'docs/product/roadmap-2026-q2.md': (c) =>
      c.split('\n').slice(0, 120).join('\n') + '\n... (gekürzt)',
    'docs/webapp-manifest/audit-system.md': (c) =>
      c.split('\n').slice(0, 80).join('\n') + '\n... (gekürzt)',
  },

  systemPrompt: `Du bist ein erfahrener Product Strategist und Developer Tools Architect. Du berätst einen Solo-Founder der ein Code-Quality-Tool für "Vibe Coders" baut — Entwickler die mit KI-Tools wie Cursor, Claude Code, Lovable Code generieren.

Das Produkt heißt Tropen OS und positioniert sich als "Production Readiness Guide" — es findet Probleme in Code, erklärt sie, und hilft dem User sie zu beheben. EU-Compliance (DSGVO, BFSG, AI Act) ist der Differenziator.

AKTUELLER STAND:
- 188 Regeln in 25 Kategorien, gewichtetes Scoring (0-100%)
- Dogfooding an eigener Codebase (Next.js + Supabase, 624 Dateien)
- Noch keine externen User
- Solo-Founder mit begrenzter Zeit
- Konkreter Fall heute: Security-Checker hat false positives produziert weil er log.error() nicht von NextResponse.json() unterscheiden konnte

STRATEGISCHE FRAGE:
Wie formalisiert man den Feedback-Loop aus dem Dogfooding in ein System das:
1. Die Checker-Qualität messbar verbessert
2. Bei externen Projekten genauso funktioniert wie bei der eigenen Codebase
3. Langfristig den Daten-Moat aufbaut (Wettbewerbsvorteil)
4. Für einen Solo-Founder mit begrenzter Zeit realistisch ist

Bewerte jede Frage konkret und pragmatisch. Keine generischen Empfehlungen — Empfehlungen müssen für einen Solo-Founder umsetzbar sein.`,

  userPrompt: `BEWERTE DIESE 6 FRAGEN:

1. WIE FORMALISIEREN WIR DAS DOGFOODING-FEEDBACK?

   Aktuell: Finding fällt auf → wir fixen den Checker ad-hoc. Kein Log, kein Tracking, kein Lerneffekt über Zeit.

   Optionen:
   A) Einfaches Markdown-Log (docs/checker-feedback.md): Datum, Regel-ID, Kategorie (echt/false-positive/ausnahme), was geändert wurde
   B) DB-Tabelle die False Positives pro Regel zählt: Wenn eine Regel >X% false positive Rate hat, wird sie automatisch geflagt
   C) GitHub Issues mit Label "checker-quality": Standard-Workflow, keine eigene Infrastruktur
   D) Im Produkt selbst: "Finding falsch?"-Button der Feedback direkt sammelt

2. AB WANN LOHNT SICH EIN AUTOMATISCHES SYSTEM?

   Optionen:
   A) Jetzt — bau von Anfang an ein Tracking ein
   B) Nach 10 Beta-Usern — wenn externe Daten kommen
   C) Nach 100 Scans — wenn statistische Aussagen möglich sind
   D) Nach PMF — erst Produkt validieren, dann optimieren

3. WIE UNTERSCHEIDEN WIR "UNSER PATTERN" VON "UNIVERSELLES PROBLEM"?

   Unser Projekt hat spezifische Muster (supabaseAdmin, Drizzle nur für Typen, spezifischer Logger). Externe Projekte haben andere Muster (console.error, Prisma, Winston Logger).

   Wie stellen wir sicher dass Checker-Fixes die wir aus dem Dogfooding lernen, generisch genug sind?

   A) Jeder Checker-Fix wird gegen 3-5 Open-Source-Repos getestet bevor er gemergt wird
   B) Checker haben ein "strictness"-Level das der User konfigurieren kann (strict/normal/relaxed)
   C) Projekt-Profil erkennt Stack (Supabase/Firebase/Prisma/etc.) und passt Checker-Verhalten an
   D) Community-Feedback: User können Regeln up/downvoten

4. FALSE-POSITIVE-RATE: WAS IST AKZEPTABEL?

   Jede Regel hat eine false-positive-Rate. Wenn sie zu hoch ist, ignorieren User alle Findings dieser Regel. Wenn sie zu niedrig ist, verpassen wir echte Probleme.

   Was ist die Ziel-Rate? Und wie messen wir sie?

   A) <5% false positive pro Regel (SonarQube-Standard)
   B) <10% akzeptabel für MVP, <5% nach Year 1
   C) Nicht pro Regel messen sondern pro Kategorie
   D) User-Feedback als einzige Messung (kein eigenes Tracking)

5. "FINDING FALSCH?"-BUTTON IM PRODUKT

   Sollen wir einen Feedback-Button pro Finding einbauen?
   "War dieses Finding korrekt? [Ja] [Nein] [Unsicher]"

   Pro: Direktes Feedback, skaliert mit User-Zahl, baut den Daten-Moat auf
   Contra: Noise (User wissen nicht immer ob ein Finding korrekt ist), UI-Komplexität, Datenschutz

6. CHECKER-QUALITÄT ALS WETTBEWERBSVORTEIL — WO INVESTIEREN?

   Wie investiert ein Solo-Founder begrenzte Zeit am besten:
   A) Mehr Regeln schreiben (Breite)
   B) Bestehende Regeln verfeinern (Tiefe/Qualität)
   C) Feedback-System bauen (Daten-Infrastruktur)
   D) EU-Compliance vertiefen (Differenzierung)

---

ZUSÄTZLICH — ROADMAP-EMPFEHLUNG GEWÜNSCHT:

Konkreter 3-Phasen-Plan:
- Phase 1 (jetzt, vor Beta): Was genau umsetzen?
- Phase 2 (Beta, 10-50 User): Was aktivieren?
- Phase 3 (nach PMF, 100+ User): Was skalieren?`,

  judgePrompt: `4 Modelle haben unabhängig die Dogfooding-Feedback-Strategie einer Code-Quality-Plattform bewertet — 6 Fragen plus Roadmap.

Die Plattform ist ein "Production Readiness Guide" für Vibe-Coders mit 188 Regeln. Solo-Founder, noch keine externen User. Konkreter Auslöser: False Positives in Security-Checkern die server-seitiges Logging nicht von API-Responses unterscheiden konnten.

Destilliere den Konsens:

Für jede der 6 Fragen:
1. Konsens-Level (EINIG | MEHRHEIT | GESPALTEN)
2. Empfohlene Option (A/B/C/D oder Hybrid)
3. Konkreter nächster Schritt (was genau implementieren?)

KERNENTSCHEIDUNG:
- Was tun wir JETZT (diese Woche)?
- Was tun wir bei BETA-START?
- Was tun wir bei PMF?

WARNUNGEN:
- Welche Option wäre Over-Engineering für einen Solo-Founder?
- Welche Option wird man später bereuen wenn man sie nicht von Anfang an hat?
- Was ist der minimale Aufwand für den maximalen Lerneffekt?

PRIORISIERTE TODO-LISTE:
Max. 5 konkrete Schritte, sortiert nach Impact/Aufwand.`,
}
