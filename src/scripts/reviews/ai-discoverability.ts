import type { CommitteeReviewConfig } from '../committee-review'

export const config: CommitteeReviewConfig = {
  name: 'ai-discoverability',

  contextFiles: [
    'docs/active/engineering-standard.md',
    'docs/active/brand-brief.md',
    'src/lib/audit/checkers/file-system-checker.ts',
  ],

  contextTransforms: {
    'docs/active/engineering-standard.md': (c) => {
      // Nur Kategorieübersicht + cat-21 (PWA) als Referenz für Checker-Muster
      const lines = c.split('\n')
      const catStart = lines.findIndex(l => l.includes('### cat-21'))
      const catEnd = lines.findIndex((l, i) => i > catStart + 5 && l.match(/^### cat-\d+/))
      const header = lines.slice(0, 40).join('\n')
      const cat21 = lines.slice(catStart, catEnd > 0 ? catEnd : catStart + 30).join('\n')
      return header + '\n...\n' + cat21 + '\n... (gekürzt)'
    },
    'docs/active/brand-brief.md': (c) =>
      c.split('\n').slice(0, 60).join('\n') + '\n... (gekürzt)',
    'src/lib/audit/checkers/file-system-checker.ts': (c) =>
      c.split('\n').slice(0, 100).join('\n') + '\n... (gekürzt)',
  },

  systemPrompt: `Du bist Mitglied eines Multi-Model-Komitees für Tropen OS — eine Production-Readiness-Plattform für Vibe-Coder (Entwickler die mit Lovable/Cursor/Bolt bauen).

PRODUKT-KONTEXT:
Tropen OS scannt Web-Apps und gibt Vibe-Codernauf eine einzige binäre Frage eine Antwort: "Kann ich das veröffentlichen?"
Das Audit-System hat 26 Kategorien. Geplant ist Kategorie 27: Web Discoverability & AI Readiness.

ZIELGRUPPE:
Vibe-Coder bauen primär B2C-Web-Apps, SaaS-Tools, Landing Pages, Dashboards.
Sie denken in Produkten, nicht in Standards. Sie wissen nicht, was llms.txt ist.
Der Checker muss ihnen erklären *warum* etwas fehlt, nicht nur *was*.

TECHNISCHE RAHMENBEDINGUNGEN:
- Checker arbeiten file-system-basiert (public/ Ordner, next.config.ts, HTML-Output)
- Kein Browser-Zugriff, kein HTTP-Request beim Scannen — nur lokale Dateien
- Checking-Ansätze: Datei-Existenz, Regex auf Datei-Inhalt, RepoMap-Symbole
- Implementierungssprache: TypeScript, Laufzeit Node.js

COACH-STIMME: konkret, beobachtend, ohne Drohung. Kein "Dein Code ist schlecht" — stattdessen Beobachtung + Konsequenz + Vorschlag.`,

  userPrompt: `## Aufgabe

Für Kategorie 27 (Web Discoverability & AI Readiness) soll das Komitee Regelwerk, Gewichtung und Implementierungsempfehlungen erarbeiten.

Sechs Kandidaten-Regeln stehen zur Diskussion. Das Komitee soll für jede Regel entscheiden: Aufnehmen oder nicht — mit konkreter Begründung.

---

## FRAGE 1 — REGELAUSWAHL UND GEWICHTUNG

Pro Kandidaten-Regel: Aufnehmen (ja/nein)? Gewicht (1–3)? Severity (low/medium/high)? Begründung in einem Satz.

**Kandidat A — robots.txt**
Datei \`public/robots.txt\` vorhanden. Enthält mindestens eine \`User-agent:\` + \`Disallow:\` Direktive.
Optional: Erkennung von AI-Crawler-Direktiven (GPTBot, anthropic-ai, PerplexityBot, Googlebot).

**Kandidat B — llms.txt**
Datei \`public/llms.txt\` vorhanden. Standard aus late 2024 (llmstxt.org) — maschinenlesbare Zusammenfassung der App für LLM-Crawl-Zwecke. Noch kein offizieller Standard, aber rapid adoption.

**Kandidat C — OpenGraph / Meta-Tags**
\`public/\` oder \`app/layout.tsx\` enthält OG-Tags: \`og:title\`, \`og:description\`, \`og:image\`.
Prüfbar via Regex auf \`layout.tsx\` + Next.js \`metadata\`-Export.

**Kandidat D — sitemap.xml**
Datei \`public/sitemap.xml\` vorhanden, oder Next.js \`app/sitemap.ts\` vorhanden.
Optional: Sitemap referenziert in robots.txt.

**Kandidat E — Canonical URLs**
Canonical-URL gesetzt in \`app/layout.tsx\` via Next.js \`metadata.alternates.canonical\`.
Verhindert Duplicate-Content-Probleme bei AI-Indexierung.

**Kandidat F — Structured Data / JSON-LD**
JSON-LD Script-Tag in \`app/layout.tsx\` oder seitenspezifischen Layouts vorhanden.
Schema.org-Typ erkennbar (WebApplication, Organization, SoftwareApplication).

---

## FRAGE 2 — REIFEGRAD UND TIMING

\`llms.txt\` ist noch kein RFC-Standard. Drei Positionen stehen zur Wahl:

**Option I:** Jetzt aufnehmen — Adoption ist schnell, Vibe-Coder die früh compliant sind haben Vorteil. Severity: low.

**Option II:** Aufnehmen aber als \`advisory\` flaggen — Checker zeigt Finding, kein Score-Impact bis Standard stabilisiert.

**Option III:** Noch nicht aufnehmen — zu früh, zu viel Unsicherheit über den endgültigen Format-Standard.

Welche Option empfiehlt das Komitee — und sollte die Entscheidung für llms.txt von der Entscheidung zu robots.txt getrennt behandelt werden?

---

## FRAGE 3 — SCOPE UND PROFIL-BINDUNG

Web Discoverability ist nicht für alle Projekte gleich relevant:
- Internes Tool (Profil 2): robots.txt wichtig (blockieren!), OG-Tags irrelevant
- Public B2C-App (Profil 4): alles relevant
- Demo/Solo-Tool (Profil 1): wenig relevant, eher noise

Soll Kategorie 27 profil-gebunden sein (Regeln nur aktiv wenn Profil >= 3)?
Oder pauschal für alle Profile mit angepasster Severity?

---

## FRAGE 4 — IMPLEMENTIERUNGSANSATZ

Für jeden aufgenommenen Kandidaten: Welcher Prüfansatz ist robust gegen False Positives?

Bekannte Fallen:
- robots.txt kann leer sein oder nur Kommentare enthalten → kein valider Inhalt
- OG-Tags in Next.js können in \`metadata\`-Export oder als JSX \`<meta>\`-Tags stehen → beide Formen erkennen
- sitemap.xml kann dynamisch generiert sein (\`app/sitemap.ts\`) → Datei-Existenz-Check reicht nicht
- JSON-LD kann inline oder als externe Datei eingebunden sein

Empfehlung pro Kandidat: Welcher Prüfansatz minimiert False Positives bei vertretbarem Implementierungsaufwand?`,

  judgePrompt: `4 Modelle haben Regelwerk und Implementierungsempfehlungen für Checker-Kategorie 27 (Web Discoverability & AI Readiness) erarbeitet. Destilliere den Konsens.

Pro Frage:
1. Konsens-Level: EINIG | MEHRHEIT | GESPALTEN
2. Endgültige Empfehlung
3. Wichtigste Spaltungs-Argumente (falls GESPALTEN)

## FRAGE 1 — REGELAUSWAHL
Pro Kandidat (A–F): Aufnehmen (ja/nein) | Gewicht | Severity | Konsens-Level
Gib am Ende eine priorisierte Implementierungs-Reihenfolge (1 = zuerst bauen).

## FRAGE 2 — LLMS.TXT TIMING
Empfehlung Option I/II/III + Begründung in 2 Sätzen.
Getrennte Behandlung von robots.txt: ja/nein?

## FRAGE 3 — SCOPE
Profil-Bindung ja/nein? Falls ja: ab welchem Profil aktiv?
Falls nein: wie Severity anpassen nach Profil?

## FRAGE 4 — IMPLEMENTIERUNG
Pro aufgenommenem Kandidaten: empfohlener Prüfansatz in max. 2 Sätzen.
Kritischste False-Positive-Falle pro Kandidat.

## ZUSAMMENFASSUNG FÜR TIMM
- Finale Regelübersicht als Tabelle: Regel | Aufnehmen | Gewicht | Severity | Profil-Bedingung
- Offene Entscheidungen die Timm selbst treffen muss (max. 3)
- Empfohlener nächster Schritt (Implementierungs-Priorität)`,
}
