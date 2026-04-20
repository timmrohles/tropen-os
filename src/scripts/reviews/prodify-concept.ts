import type { CommitteeReviewConfig } from '../committee-review'

export const config: CommitteeReviewConfig = {
  name: 'prodify-concept',
  contextFiles: [],

  systemPrompt: `Du bist Teil eines mehrköpfigen LLM-Komitees, das ein Produkt-Grobkonzept bewertet.
Antworte strukturiert, kritisch — keine höfliche Zustimmung.

Pro Punkt:
- **Urteil:** stimmig / Vorbehalt / ablehnen
- **Kernkritik** in zwei Sätzen
- **Gegenvorschlag** wenn vorhanden

Am Ende: eine einzige **Gesamt-Empfehlung** in drei Sätzen: Was ist die wichtigste Änderung am Grobkonzept, bevor es in den Bau geht?`,

  userPrompt: `# Komitee-Review: Prodify Grobkonzept

## Kontext

Ich baue ein Produkt für **Vibe-Coder** — Solo-Founder, die mit Cursor / Claude Code / Lovable / Replit / Bolt bauen, kein Senior-Dev im Rücken haben, kaufzögernd sind und schnell iterieren wollen.
*(Abgrenzung: kein Junior-Dev mit Team, keine Agentur, kein Freelancer mit Client-Budget — reine Solo-Builder, oft ohne technische Ausbildung.)*

Das Produkt hat heute einen Scanner mit Findings-Ausgabe und Fix-Prompts. Nach einer Strategie-Diskussion verschiebt sich das Zentrum: Nicht mehr "Scanner", sondern projektzentrischer Begleiter mit strukturellem Gedächtnis. Der Pitch: Wir sind der Senior-Dev, den du nie hattest. Wir führen dich zu Production Ready, egal wo du stehst. Wir liefern dir die Struktur — als lebende Dokumente, die dein Coding-Tool führen.

Differenzierung: 25 ausgearbeitete Agenten-Kategorien (Engineering Standards), EU-Compliance-Tiefe (DSGVO/AI Act/BFSG/CRA), Scan-Erkenntnisse aus öffentlichen Repos in der Datenbank, mehrere-LLM-Komitee-Reviews bei strategischen Entscheidungen.

## Was bereits entschieden ist

- Funktion: Denkpartner mit Gedächtnis
- Struktur: Reise-Rahmen von Idee bis Post-Launch
- Architektur: Form 4 — Web-App als Heimat, Browser-Extension und MCP-Server als Tentakel
- Einstieg: Drei Türen mit gemeinsamer Pipeline
  - Tür 1: Repo existiert (GitHub-App-Zugriff oder MCP)
  - Tür 2a: Textfeld ("kopier rein, was du hast")
  - Tür 2b: Geführter Dialog für den Nullpunkt
- Geführter Prozess ist in allen Türen zwingend, Fragen adaptiv, Wissensstand transparent, alles änderbar
- Profil-Felder dreigeteilt: Muss (Arbeits-Schwelle), Soll (Qualität), Kann (Feinjustierung)
- Primärnutzer V1: Solo-Vibe-Coder (Agentur-Features später)
- Stimme: Arbeitshypothese mehrere Perspektiven (aus 25 Agenten ableitbar), finale Entscheidung beim Prototyp

## Der Vorschlag für V1

Kanonische Quelle plus tool-spezifische Exporte:
Die Wahrheit des Projekts lebt in tool-agnostischen Dokumenten. Claude-Code-, Cursor-, Copilot- und Replit-Nutzer bekommen unterschiedliche Exporte derselben Substanz.

Vier Prio-1-Artefakte:
1. Projekt-Charta (kanonisch, PROJECT.md) — das Gehirn: Zweck, Markt, Nutzer, Nicht-Ziele, Stack, Compliance-Scope, aktueller Reisestand, Abgrenzungen
2. Coding-Tool-Regelwerk (tool-spezifischer Export) — CLAUDE.md / .cursorrules / .github/copilot-instructions.md / Prompt-Pack je nach Tool
3. Architektur-Rahmen (ARCHITECT.md) — Governance-Schicht: Pflicht-Protokolle, Review-Templates, Entscheidungsrahmen, Fallstrick-Register
4. Projekt-Memory — Entscheidungslog, offene Fragen, verworfene Wege, Agenten-Empfehlungen mit Umsetzungs-Status

Entscheidendes Prinzip: Keine ausgefüllten Templates. Wir liefern Struktur — welche Sektionen, welche Update-Regeln, welche Abgrenzungen, was bewusst nicht drin steht. Inhalt kommt aus dem Projekt.

Frage-Kette pro Sektion: Fragen sind nicht separat vom Dokument-Gerüst, sie sind Teil des Gerüsts. Jede Sektion hat ihre eigene Muss/Soll/Kann-Fragenkette. Aktivierung situativ, nicht vorab als 30-Fragen-Onboarding.

Generierung: Profil → relevante Agenten aktivieren → Komitee-Konsolidierung → Artefakt-Erzeugung → laufende Pflege.

## V1-Auslassungen (bewusst)
- Keine Extension, kein MCP-Server — Web-App only
- Tür 2b (voll geführter Dialog ohne jeden Input) kommt später
- Nicht alle 25 Agenten gleich tief in V1 — Leitagenten priorisiert
- Keine Team- oder Agentur-Features
- Einsprachig

---

## Bewertet diese 9 Punkte:

**1. Produkt-Reframing**
Ist die Verschiebung vom Scanner zum "projektzentrischen Begleiter mit Gedächtnis" die richtige strategische Antwort, oder übertreibe ich die Neu-Positionierung? Was spricht dagegen, den Scanner als Hauptversprechen zu lassen und das Gedächtnis als Feature dahinter?

**2a. Artefakt-Auswahl**
Sind diese vier die richtigen Prio-1-Artefakte? Fehlt etwas Essentielles (z.B. ein Nächste-Schritte-Dokument, ein Compliance-Profil als eigenes Dokument, eine Launch-Checkliste)? Ist eines davon überflüssig oder zu früh?

**2b. Charta vs. Architektur-Rahmen**
Sollten Projekt-Charta und Architektur-Rahmen verschmolzen werden, weil die Trennung für Vibe-Coder zu meta ist? Oder ist die Trennung strukturell notwendig?

**3. Kanonisch/Export-Trennung**
Ist die Struktur "eine Quelle, mehrere tool-spezifische Exporte" die richtige Antwort auf die Tool-Vielfalt? Oder überbauen wir das — würden Vibe-Coder mit tool-spezifischen Dokumenten direkt besser zurechtkommen? Gibt es Tools in diesem Markt, bei denen diese Logik zusammenbricht?

**4. Frage-Kette und Adaptivität**
Ist die Muss/Soll/Kann-Logik mit situativer Aktivierung der richtige Weg? Oder unterschätze ich, wie viel Vibe-Coder zu Beginn beantworten können und wollen? Gibt es bessere Modelle für adaptives Onboarding?

**5. Einstiegs-Türen**
Drei Türen mit gemeinsamer Pipeline — technisch machbar und produktstrategisch richtig? Oder sollte V1 sich auf eine Tür konzentrieren, um Fokus zu behalten? Welche wäre es dann?

**6. Abgrenzung zu Coding-Tools**
Ist das Versprechen "wir liefern Struktur, die dein Tool führt" langfristig verteidigbar, oder bauen Cursor / Claude Code / Copilot diese Meta-Ebene in 12–18 Monaten selbst ein und machen das Produkt obsolet? Wenn ja — wo liegt der nicht-kommoditisierbare Kern?

**7. Was ich übersehe**
Eine Kritik, die noch nicht durch die obigen Fragen abgedeckt ist. Das darf gern unbequem sein. Produkt-Annahmen, Marktrisiken, Nutzer-Verhalten, Technologie-Risiken — alles legitim.

**7b. Geschäftsmodell**
Vibe-Coder sind notorisch kaufzögernd. Welches Monetarisierungsmodell passt zu dieser Zielgruppe — und was spricht gegen das Offensichtliche (Abo)?

**8. Der nächste Bau-Schritt**
Was wäre der erste konkrete Bau-Schritt nach diesem Grobkonzept? Nicht "Fundament bauen" generisch, sondern: Welches Artefakt / welchen Prozess / welche Integration als Erstes angehen, um eine testbare V1 in 4–8 Wochen zu haben?`,

  judgePrompt: `Vier Modelle haben das Prodify-Grobkonzept unabhängig bewertet.

Destilliere den Konsens in einen strukturierten Abschlussbericht.

Für jeden der 9 Punkte (1, 2a, 2b, 3, 4, 5, 6, 7, 7b, 8):
- **Konsens-Level:** EINIG | MEHRHEIT | GESPALTEN
- Kern-Finding in 2–3 Sätzen (mit konkreten Zitaten aus den Reviews wenn möglich)
- Empfehlung mit Priorität: sofort / bald / später

Abschluss:
1. Die drei wichtigsten Änderungen am Grobkonzept vor dem Bau (priorisiert)
2. Der konkrete erste Bau-Schritt (aus Konsens der 4 Modelle)
3. Die größte offene Streitfrage (wo Modelle am meisten gespalten waren)`,
}
