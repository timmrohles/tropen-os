import type { CommitteeReviewConfig } from '../committee-review'

export const config: CommitteeReviewConfig = {
  name: 'product-naming',

  contextFiles: [
    'docs/committee-reviews/input-product-naming.md',
  ],

  systemPrompt: `Du bist ein erfahrener Brand Consultant und Developer-Tools-Marktstratege.
Du kennst den Developer-Tools-Markt (Cursor, Lovable, Bolt, SonarQube, CodeRabbit, ShipFast, ShipCheck)
und verstehst wie Produktnamen in der Developer-Community wahrgenommen werden.

Du bewertest Produktnamen für einen Production Readiness Guide für Vibe-Coders —
Entwickler die mit KI-Tools wie Cursor, Lovable, Claude Code Code generieren und dann
nicht wissen ob ihr Produkt wirklich production-ready ist.

One-Liner des Produkts: "Your AI writes code. We make it production-ready."

WICHTIG: Du kennst beide Sprachen Englisch UND Deutsch und weißt welche Konnotationen
Namen in beiden Sprachen haben. "Forged" bedeutet auf Deutsch auch "gefälscht" — das
wäre für ein Compliance-Produkt katastrophal. Solche Fallen musst du erkennen.

Sei konkret, kritisch und ehrlich. Keine Marketing-Sprache.`,

  userPrompt: `AUFGABE: Generiere und bewerte Produktnamen für den Production Readiness Guide.

Vollständiges Briefing:
{{docs/committee-reviews/input-product-naming.md}}

---

DEINE AUFGABE (alle 6 Punkte bearbeiten):

1. GENERIERE 10 NAMENSVORSCHLÄGE
   - Alle Must-Have-Kriterien müssen erfüllt sein
   - Kein Name aus der Eliminierten-Liste
   - Für jeden Namen: ein Satz warum er funktioniert
   - Für jeden Namen: .dev Domain wahrscheinlich frei? (Ja/Nein/Unklar)
   - Prüfe bei jedem Namen explizit: gibt es negative Konnotationen auf Deutsch oder Englisch?

2. WÄHLE DEINE TOP 3 UND BEGRÜNDE DIE REIHENFOLGE
   - Warum Platz 1, nicht Platz 2?
   - Was ist die stärkste und schwächste Eigenschaft jedes Namens?

3. NPM-CHECK FÜR TOP 3
   - Existiert ein etabliertes npm-Package mit diesem Namen?
   - Wenn ja: wie kritisch ist das für eine CLI (npx [name] scan)?

4. KONTEXTE FÜR TOP 3 — zeige wie der Name klingt in:
   - Landing Page Headline: "[NAME] — Your AI writes code. We make it production-ready."
   - Community: "Run [NAME] on your project before you launch"
   - CLI: \`npx [name] scan\`
   - Pricing: "[NAME] Free / [NAME] Pro / [NAME] Agency"
   - Verb: "Ich habe mein Projekt ge[NAME]t" (auf Deutsch)

5. SPRACH-CHECK FÜR TOP 3
   - Wie wird der Name auf Englisch ausgesprochen?
   - Wie auf Deutsch? Gibt es Ausspracheprobleme?
   - Gibt es unbeabsichtigte Bedeutungen in anderen EU-Sprachen?

6. DEIN FAVORIT
   - Welcher Name würdest du nehmen wenn du heute launchen müsstest?
   - Ein Satz Begründung.`,

  judgePrompt: `4 Modelle haben unabhängig Produktnamen für einen Production Readiness Guide
für Vibe-Coders generiert und bewertet.

One-Liner: "Your AI writes code. We make it production-ready."
Eliminierte Namen: GuideVibe, VibeMate, VibeGuard, VibeGuide, ShipCheck, ReadyCheck,
Deepploy, Appiness, Comitter, Forged (= "gefälscht" auf Deutsch), Tropen OS.

DEINE AUFGABE als Judge:

1. KONSENS-NAMEN
   Welche Namen tauchen bei mehreren Modellen auf?
   Liste alle Namen die mindestens 2 Modelle vorgeschlagen haben.

2. KONFLIKTPRÜFUNG
   Für jeden Konsens-Namen: gibt es Konflikte die die Modelle übersehen haben?
   - Existierende Produkte im Dev-Tool-Markt?
   - Toxische Assoziationen?
   - Domain bereits vergeben (basierend auf Bekanntheitsgrad)?
   - Negative Konnotationen in DE/EN/anderen EU-Sprachen?

3. FINALE TOP 5
   Wähle die 5 besten Namen aus allen Vorschlägen (Konsens UND Einzelnennungen).
   Für jeden:
   - Name + .dev Domain-Status (wahrscheinlich frei/unklar/vergeben)
   - Stärken (2-3 Punkte)
   - Risiken (1-2 Punkte)
   - Community-Tauglichkeit (0-10)
   - CLI-Tauglichkeit (0-10)

4. KLARER GEWINNER
   Welcher Name ist der beste? Ein klares Votum, keine Ausweichung.
   Begründung in 3 Sätzen.

5. WARNUNGEN
   Gibt es Namen die mehrere Modelle empfohlen haben, die aber
   ein kritisches Problem haben das übersehen wurde?

Format: Klar strukturiert mit Überschriften. Kein Fließtext ohne Struktur.`,
}
