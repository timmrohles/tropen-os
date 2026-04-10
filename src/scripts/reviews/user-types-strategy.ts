// src/scripts/reviews/user-types-strategy.ts
// Komitee-Review: Drei User-Typen + Strategie
// Bewertet Hobby/Gründer/Business-Dreiteilung + strategische Fragen

import type { CommitteeReviewConfig } from '../committee-review'

export const config: CommitteeReviewConfig = {
  name: 'user-types-strategy',

  contextFiles: [
    'docs/product/user-story-idea-to-production.md',
    'docs/product/user-types-hobby-business-enterprise.md',
  ],

  systemPrompt: `Du bist ein erfahrener Product Strategist und CTO der Produkte für Developer Tools und KI-gestützte Plattformen bewertet. Du denkst aus Sicht von Nutzern, Investoren und dem Engineering-Team.

Die Plattform heißt Tropen OS und hat bereits:
- Ein Audit-System mit 25+ Kategorien und 195 Regeln
- Multi-Model-Konsens-Reviews (4 LLMs + Judge)
- Repo Map Generator (Code-Kontext für LLMs)
- File System API (Browser-basierter Projekt-Scan)
- Aufgabenliste mit Prompt-Export
- Stack-Detection und Projekt-Onboarding
- Fix Engine (KI-generierte Code-Fixes)
- 21 Agenten-Rule-Packs für verschiedene Domänen

Bewerte kritisch und konstruktiv. Sei konkret — keine generischen Empfehlungen. Beziehe dich auf spezifische Details aus den Dokumenten. Antworte auf Deutsch.`,

  userPrompt: `Hier sind die zwei Kontextdokumente:

[Inhalt von docs/product/user-story-idea-to-production.md wird automatisch eingefügt]
[Inhalt von docs/product/user-types-hobby-business-enterprise.md wird automatisch eingefügt]

---

BEWERTE DIESE 8 ASPEKTE (jeweils 150-250 Wörter, konkret und kritisch):

## 1. DREITEILUNG (Hobby/Gründer/Business)
Ist die Dreiteilung richtig oder gibt es einen vierten Typ den wir übersehen? (Freelancer? Agency? Educator?)

- Welche echten User-Segmente nutzen Developer Tools?
- Sind Hobby und Gründer wirklich trennscharf? (Hobby-Projekte werden oft zu Startups)
- Fehlt der "Agentur"-Typ: Freelancer/Agency die für Kunden bauen?
- Fehlt der "Educator"-Typ: Lehrer, Bootcamp-Trainer, Tutorial-Ersteller?
- Gibt es Übergänge zwischen den Typen die das System unterstützen muss?
- Sind die Agenten-Matrizen (30/120/195 Regeln) realistisch unterscheidbar?

## 2. ENTERPRISE-TIEFE
Wie tief sollte die Enterprise-Integration gehen?

- Import bestehender DB-Schemas und Firmen-Linter: realistische Feature oder Over-Engineering?
- Wann genug Komplexität für eigenes Produkt (Tropen OS Enterprise) vs. Tier im selben Produkt?
- Welche Enterprise-Features sind Table Stakes (ohne die kein Deal) vs. Nice-to-have?
- Custom Agenten: Self-Service oder managed? (Kunden können eigene Regeln schreiben vs. Professional Services)
- Wie verhindert man dass der Enterprise-Track die Roadmap für Hobby/Gründer blockiert?

## 3. PRICING
Ist Freemium (Hobby kostenlos) der richtige Einstieg oder schreckt es zahlende Kunden ab?

- Freemium-Fallen bei Developer Tools: wie vermeidet man dass alle auf dem Free-Tier bleiben?
- €19-49 für Gründer: ist das der richtige Preis oder zu günstig/teuer?
- €99-299 für Business: realistisch oder zu wenig für Enterprise-Budget?
- Alternativen: Pay-per-Scan, Credits-Modell, Open Source + Enterprise-Support?
- Welche Feature-Gate-Logik konvertiert Hobby-User zu zahlenden Kunden?

## 4. AGENTEN ALS BUILD-TIME-REGELN
Das Komitee hat "20-30 Build-Time-Rules" empfohlen — wie wählt man die aus?

- Welches Kriterium unterscheidet Build-Time-Rules von Audit-Time-Rules?
- Wie exportiert man 195 Regeln sinnvoll in .cursorrules / CLAUDE.md ohne Token-Bloat?
- Hierarchie: Welche 5 Regeln sind immer dabei, welche 25 sind kontextabhängig?
- Wie hält man .cursorrules aktuell wenn sich Agenten-Regeln ändern?
- Gibt es bessere Alternativen zum .cursorrules-Format? (MCP Server, IDE-Extensions?)

## 5. WETTBEWERB
Welche bestehenden Produkte adressieren Teile dieser Vision?

- CodeRabbit, Snyk, SonarQube, Cursor Rules, Bolt, Vercel v0, Lovable, Devin, GitHub Copilot Workspace — was machen sie gut/schlecht?
- Wo ist der echte Moat von Tropen OS? (was können diese nicht?)
- Welche Konkurrenten haben dasselbe Problem gelöst und sind gescheitert? Warum?
- Wer könnte Tropen OS kopieren? (Anthropic direkt in Claude Code? GitHub Copilot? Cursor nativ?)
- Ist "Qualitäts-Leitplanken für Vibe-Coding" defensibel als Position?

## 6. GO-TO-MARKET
Wie erreicht man Vibe-Coders? Was funktioniert bei Developer Tools?

- Welche GTM-Kanäle funktionieren nachweislich bei Developer Tools? (PLG, Community, Content, Partnerships)
- Wo hängen Vibe-Coders: Reddit, Twitter/X, YouTube, Discord, Product Hunt, Cursor Marketplace?
- Wäre ein Cursor-Extension oder VS Code Extension sinnvoller als eine Web-App?
- Partnerships: Cursor, Lovable, v0 — realistisch oder zu früh?
- Was ist das "Aha-Moment" das User zu Paid konvertiert?

## 7. TECHNISCHE RISIKEN
Was sind die größten technischen Risiken?

- Skalierung: Repo-Scanning von 1000+ Dateien in <30 Sekunden — realistisch?
- LLM-Kosten: bei vielen Scans explodieren die API-Kosten — wie mitigieren?
- Template-Wartung: Dependencies veralten in 3-6 Monaten — wie pflegt man Starter?
- API-Änderungen: Anthropic/OpenAI ändern APIs ohne Vorwarnung — wie absichern?
- Browser-basiertes File System API: Sicherheitsmodell und Grenzen?
- Welche Teile der Vision sind technisch unrealistisch mit einem kleinen Team?

## 8. BLINDE FLECKEN
Was haben wir komplett übersehen? Sei schonungslos ehrlich.

- Welche Annahmen im Konzept sind wahrscheinlich falsch?
- Welche Nutzer-Bedürfnisse fehlen komplett?
- Welche Markt-Realitäten ignorieren wir?
- Was passiert wenn Cursor/Lovable diese Features selbst bauen?
- Welche Nutzer-Gruppe würde Tropen OS NICHT nutzen wollen und warum?
- Was ist das härteste "Nein" das ein Investor zu diesem Konzept sagen würde?`,

  judgePrompt: `Destilliere den Konsens der 4 Modelle zu Tropen OS User-Typen und Strategie.

Für jeden der 8 Aspekte:
1. **Konsens-Level:** EINIG | MEHRHEIT | GESPALTEN
2. **Top-Empfehlung** (1-2 Sätze, konkret)
3. **Konkreter nächster Schritt** (was soll Tropen OS bauen/ändern?)

Dann:

## BLINDE FLECKEN
Liste ALLE blinden Flecken die von mindestens 2 Modellen genannt werden.
Das ist die wichtigste Sektion — sei vollständig, nicht zusammenfassend.
Format: **Blinder Fleck:** [Name] — [Beschreibung, warum das kritisch ist]

## KILL-THE-DARLING
Gibt es Teile der Vision die gestrichen werden sollten?
Bewertungskriterien: zu komplex für kleines Team | zu teuer | unrealistische Annahme | kein Markt
Format pro Streichung: **[Feature/Aspekt]** — Warum streichen + Was stattdessen

## INVESTOR-PERSPEKTIVE
Was ist die härteste Kritik die ein erfahrener SaaS-Investor vorbringen würde?
Und: Was ist das stärkste Argument FÜR die Vision?

## PRIORISIERUNG: DIE NÄCHSTEN 90 TAGE
Wenn Tropen OS NUR EINE SACHE in den nächsten 90 Tagen bauen kann — was ist es?
Begründe mit Nutzer-Impact, Markt-Differenzierung und technischer Machbarkeit.

Antworte auf Deutsch. Sei direkt und konkret. Keine generischen Empfehlungen.`,
}
