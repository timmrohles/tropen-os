// src/scripts/reviews/product-vision.ts
// Komitee-Review: Geführter Weg von der Idee zum Produkt
// Bewertet das 7-Phasen-Konzept aus Product-Strategy-Perspektive

import type { CommitteeReviewConfig } from '../committee-review'

export const config: CommitteeReviewConfig = {
  name: 'product-vision-guided-building',

  contextFiles: [
    'docs/product/user-story-idea-to-production.md',
  ],

  systemPrompt: `Du bist ein erfahrener Product Strategist und Developer Experience Engineer. Du bewertest ein Produktkonzept für eine Plattform die Vibe-Coders (Entwickler die mit KI-Tools wie Cursor, Claude Code, Lovable, v0 Code generieren) von der Idee bis zum produktionsreifen Launch begleiten will.

Die Plattform heißt Tropen OS und hat bereits:
- Ein Audit-System mit 25+ Kategorien und 195 Regeln
- Multi-Model-Konsens-Reviews (4 LLMs + Judge)
- Repo Map Generator (Code-Kontext für LLMs)
- File System API (Browser-basierter Projekt-Scan)
- Aufgabenliste mit Prompt-Export
- Stack-Detection und Projekt-Onboarding
- Fix Engine (KI-generierte Code-Fixes)
- 21 Agenten-Rule-Packs für verschiedene Domänen

Das Konzept beschreibt 7 Phasen: Idee → Scope → Recherche → Anforderungen → Architektur → Setup → Build → Launch.

Bewerte das Konzept kritisch und konstruktiv. Sei konkret — keine generischen Empfehlungen. Beziehe dich auf spezifische Phasen und konkrete Beispiele. Antworte auf Deutsch.`,

  userPrompt: `Hier ist das vollständige Konzept:

[Inhalt von docs/product/user-story-idea-to-production.md wird automatisch eingefügt]

---

BEWERTE DIESE 8 ASPEKTE (jeweils 150-250 Wörter, konkret und kritisch):

## 1. TOOLING & "WIE BAUST DU?"
Das Konzept beschreibt WAS in jeder Phase passiert, aber nicht WIE der User konkret arbeitet.

- Welches Tool für welche Phase? (Lovable, v0, Cursor, Claude Code, Bolt, Replit, Windsurf)
- Was sind die konkreten Best Practices pro Tool?
- Wo liegen die Fallstricke? (z.B. Lovable exportiert keine Tests, v0 generiert keine Auth)
- Sollte Tropen OS eine Tool-Empfehlung geben oder tool-agnostisch bleiben?
- Wie sieht der konkrete Workflow aus? (User öffnet Cursor → lädt Tropen OS Regeln → promptet → scannt)

## 2. AGENTEN ALS LEITPLANKEN IM BUILD-PROZESS
Die 21 Agenten prüfen aktuell NACHHER (Audit). Sie müssten VORHER wirken — als Regeln die das Coding-Tool des Users befolgt.

- Wie werden Agenten-Regeln in .cursorrules / CLAUDE.md / Lovable-System-Prompts übersetzt?
- Welche Regeln sind zur Build-Zeit relevant, welche nur zur Audit-Zeit?
- Wie hält man die Regeln synchron (Tropen OS Agent ändert sich → .cursorrules muss aktualisiert werden)?
- Soll Tropen OS eine einzige Datei generieren die ALLE aktiven Agenten-Regeln enthält?
- Wie granular? (Alle 195 Regeln im System-Prompt wäre zu viel — wie priorisieren?)

## 3. WIREFRAMES & DESIGN-PROZESS
Das Konzept sagt "Design im Code" und empfiehlt shadcn/ui.

- Sind Wireframes für Vibe-Coders überflüssig oder wertvoll?
- Was ist die Alternative? (User-Journey-Diagramme? Seitenstruktur als Liste? Low-fi Skizzen?)
- Sollte Tropen OS Wireframes generieren können?
- Wie sieht die Design-Entscheidung konkret aus? (Farben, Fonts, Layout — wann und wie?)
- Ist "funktional first, schön second" der richtige Rat oder verliert der User das Interesse?

## 4. PHASEN-REALISMUS
7 Phasen sind viel. Vibe-Coders wollen SOFORT loslegen.

- Sind Phase 0-3 (Idee bis Anforderungen) zu lang bevor der User Code sieht?
- Wie viel Geduld hat ein typischer Vibe-Coder für "erst planen, dann bauen"?
- Sollten manche Phasen zusammengefasst oder optional sein?
- Was ist die Mindest-Vorbereitung bevor Code geschrieben werden sollte?
- Gibt es einen "Quick Start" Pfad für erfahrene User die keine Führung brauchen?

## 5. TEMPLATES & STARTER-KITS
Phase 5 beschreibt ein Template das bei 60% Score startet.

- Ist ein einziges Template realistisch oder braucht es mehrere? (SaaS, E-Commerce, Landing Page, API)
- Was muss ein Template mindestens enthalten damit es bei 60% startet?
- Wie pflegt man Templates aktuell? (Dependencies veralten schnell)
- Gibt es Open-Source-Starter die man nutzen sollte statt eigene zu bauen? (create-t3-app, next-saas-starter)
- Sollte das Template generiert werden (dynamisch basierend auf Anforderungen) oder vorgefertigt?

## 6. OPEN SOURCE & LIBRARY-EMPFEHLUNGEN
Phase 2 prüft ob das Rad neu erfunden werden muss.

- Wie findet Tropen OS relevante Libraries? (Web Search? Kuratierte Liste? npm-Analyse?)
- Wie bewertet man Library-Qualität? (Stars, Maintenance, Bundle-Size, TypeScript?)
- Wie warnt man vor schlechten Libraries? (veraltet, unsicher, zu groß)
- Sollte Tropen OS alternative Open-Source-Projekte empfehlen die der User forken kann?
- Wie verhindert man "Dependency Hell" bei Vibe-Coders die blind npm install machen?

## 7. QUALITY LOOP — PRAXISTEST
Phase 6 beschreibt "nach jedem Feature scannen".

- Ist das realistisch oder nervt es den User?
- Was ist die richtige Frequenz? (nach jedem Feature? einmal am Tag? nur vor Deploy?)
- Wie vermeidet man "Alert Fatigue" bei 500 Findings?
- Was ist der richtige Ton? ("du hast 3% verloren" vs. "hier sind 2 Dinge die du fixen solltest")
- Wie motiviert man den User den Score hochzuhalten?

## 8. FEHLENDE ASPEKTE
Was fehlt im Konzept komplett?

Denke an:
- Team-Zusammenarbeit (mehrere Leute am Projekt)
- Versionierung und Branches
- Testing-Strategie (wann schreibt der Vibe-Coder Tests?)
- Deployment-Strategie (Preview, Staging, Production)
- Kosten-Management (API-Kosten, Hosting-Kosten)
- User-Feedback-Loop (wie lernt Tropen OS was User wollen?)
- Migration von bestehendem Code (User hat schon ein Projekt)
- Mobile Apps (React Native, Expo — nicht nur Web)
- Backend-only Projekte (APIs ohne Frontend)
- Mehrere Projekte gleichzeitig managen`,

  judgePrompt: `Destilliere den Konsens der 4 Modelle zum Produktkonzept "Geführter Weg von der Idee zum Produkt".

Für jeden der 8 Aspekte:
1. **Konsens-Level:** EINIG | MEHRHEIT | GESPALTEN
2. **Top-Empfehlung** (1-2 Sätze, konkret)
3. **Konkreter nächster Schritt** (was soll Tropen OS bauen/ändern?)

Dann:

## GESAMTBEWERTUNG
- Ist das Konzept insgesamt tragfähig? (Ja/Nein/Mit Einschränkungen — begründe)
- Was ist die größte Stärke des Konzepts?
- Was ist die größte Schwäche / das größte Risiko?
- Was fehlt am dringendsten?

## PRIORISIERUNG: TOP 3 FÜR DIE NÄCHSTEN 3 MONATE
Wenn Tropen OS NUR 3 der 8 Aspekte in den nächsten 3 Monaten bauen kann — welche 3?
Begründe die Auswahl mit konkretem Nutzer-Impact.

## WARNUNGEN
- Gibt es Aspekte die das Projekt zum Scheitern bringen können wenn sie ignoriert werden?
- Gibt es Annahmen im Konzept die wahrscheinlich falsch sind?
- Was unterschätzt das Konzept am stärksten?

Antworte auf Deutsch. Sei direkt und konkret.`,
}
