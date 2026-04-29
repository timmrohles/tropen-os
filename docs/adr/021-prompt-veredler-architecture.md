# ADR-021: Prompt-Veredler-Architektur

**Status:** Proposed
**Datum:** 2026-04-27
**Entscheider:** Timm Rotter
**Tags:** architecture · prompt-engineering · core-product

---

## Context

Tropen OS positioniert sich nach der Neuausrichtung im April 2026 als **Begleitplattform** für Vibe-Coder, die mit Lovable, Bolt, Cursor und Claude Code bauen. Die Plattform konkurriert ausdrücklich nicht mit den Bau-Tools — sie ist eine Schicht darüber, die strukturiert, lehrt und vor häufigen Fallen schützt.

Der **Prompt-Veredler** ist in der Vision (Komponente 9) als einer von mehreren Bausteinen aufgeführt. Im Verlauf der Strategie-Session am 27. April 2026 wurde jedoch klar: Der Prompt-Veredler ist nicht ein Feature unter vielen — er ist das **operative Herzstück** der Plattform.

Die Logik: Tropen OS ist die Schicht, in der **gedacht und strukturiert** wird. Die externen Bau-Tools (IDEs, Vibe-Coding-Tools) sind die Schicht, in der **gebaut** wird. Die Brücke zwischen beiden ist der veredelte Prompt — das, was der User aus Tropen OS in seine IDE kopiert.

Damit hat der Veredler eine kritische Funktion: Er **trägt das Projektwissen, die Hygiene-Regeln und die Konsequenz-Verweise** in jedes externe Bau-Tool. Ohne Veredler ist Tropen OS ein hübsches Wissens-Tool. Mit Veredler wird es zur Operations-Plattform.

Die Anforderungen an den Veredler:

- **Zugriff auf Projektwissen** — er muss aktuelle Projektbedingungen kennen
- **Tool-Sensitivität** — Lovable-Prompts unterscheiden sich von Cursor-Prompts
- **Differenzierung nach Aufgaben-Tiefe** — eine Button-Farbänderung braucht keine volle Anreicherung; ein Login-Feature schon
- **Niedrige Reibung im Default-Fall** — User darf nicht bei jedem Mini-Prompt durch eine UI-Schleuse
- **Sichtbarkeit bei Bedarf** — bei großen Aufgaben muss der User sehen können, was angereichert wurde
- **Deterministisches Verhalten** in der Routing-Entscheidung — keine LLM-Calls für reine Klassifikation

---

## Decision

Der Prompt-Veredler ist als **dreistufiges System mit deterministischem Klassifikator** umgesetzt. Er produziert **vier Felder** als Output und ist konversational eingebettet, ohne den User-Flow zu bremsen.

### Drei Tiefen

| Tiefe | Trigger | Verhalten |
|---|---|---|
| **1 — Pass-through** | Reine Kosmetik / Mikro-Iteration. Berührt keine Architektur, keine Datenmodell, keine Compliance. | Prompt geht weitgehend unverändert weiter, ggf. mit Mini-Hygiene-Hinweis (z.B. „CSS-Variablen, kein Hex"). |
| **2 — Anreichern** *(Default bei Unsicherheit)* | Standard-Feature. Berührt UI oder einzelne Komponente, aber nicht Datenmodell oder Compliance. | Prompt wird mit relevantem Projektwissen + Ablagepfaden angereichert. User sieht das angereicherte Ergebnis. |
| **3 — Vollanreicherung** | Strukturelle Änderung. Berührt Auth, Datenmodell, Compliance, mehrere Dateien oder kritische Komponenten. | Volle Anreicherung mit Konsequenz-Verweisen, Ablagevorgaben, Erwartungshaltung. Bestätigungs-UI vor dem Senden. |

### Deterministischer Klassifikator

Der Klassifikator entscheidet die Tiefe **regelbasiert in TypeScript**, ohne LLM-Call. Konsistent mit dem etablierten Smart-Router-Pattern.

**Klassifikator-Inputs:**
- User-Prompt (Text)
- Aktuelles Projektwissen (Stack, Phase, Compliance-Profil, Tool-Profil)
- Heuristik-Regeln (Keyword-Sets, Pattern-Matching)

**Klassifikator-Output:** Tiefe 1 / 2 / 3

**Default bei Unsicherheit:** Tiefe 2 (Anreichern). Konsistent mit *Führung ohne Zwang* — im Zweifel ein wenig mehr Hilfe, ohne den User zu erschlagen.

### Vier Output-Felder

Jeder veredelte Prompt enthält folgende Felder (bei Tiefe 1 ggf. nur 1–2 davon):

1. **Aufgabe** — angereicherte Beschreibung des zu Bauenden
2. **Ziel-Artefakt** — was am Ende existieren soll (Dateien, Tests, Doku-Einträge, Migrationen)
3. **Ablage-Vorgaben** — wo welches Stück hingehört (entspricht Repo-Hygiene-Spalte)
4. **Konsequenzen** — was anschließend geprüft / aktualisiert werden muss (entspricht dem Konsequenz-Mechanismus)

### Außen Chat, innen Pipeline

**Aus Sicht des Users:** Der Veredler ist Teil des Chats mit Toro. Der User redet, Toro veredelt. Bei kleinen Sachen merkt der User den Veredler kaum; bei großen sieht er die Anreicherung und kann sie prüfen.

**Aus Architektur-Sicht:** Der Veredler ist eine mehrstufige Pipeline. Die Stufen variieren je nach Tiefe:

- **Tiefe 1:** Single-Pass (Klassifikator → minimale Anreicherung → Output)
- **Tiefe 2:** Zwei Stufen (Klassifikator → Wissensabruf → Anreicherung → Output)
- **Tiefe 3:** Voller Multi-Turn-Flow (Klassifikator → Wissensabruf → Anreicherung → Validierung → Bestätigungs-UI → Output)

### Veredelte Prompts sind Chat-Output, keine Artefakte

Veredelte Prompts werden **nicht** als Artefakte gespeichert. Sie erscheinen als hervorgehobener Block im Chat (mit Kopier-Button), der User kopiert, was er braucht, in seine IDE.

Begründung: Prompts sind Werkzeug, nicht Werkstück. Datensparsamkeit. Artefakt-Fläche bleibt für Substanzielles reserviert.

### Erfahrungslevel-Adaption

Bei Tiefe 3 unterscheidet sich die Verpackung:

- **Anfänger:** Anreicherung mit Erklärung („Ich habe Folgendes ergänzt, weil dein Projekt Multi-Tenant-Auth nutzt...")
- **Erfahren:** Diff-Ansicht ohne lange Begründung

Das ist *progressive Tiefe* — gleiche Mechanik, andere Verpackung.

---

## Consequences

### Positive Konsequenzen

- **Veredler skaliert mit Aufgaben-Komplexität.** Mini-Iterationen bleiben schnell, große Aufgaben bekommen Substanz.
- **Deterministisches Routing.** Keine LLM-Kosten für Klassifikation, vorhersagbares Verhalten, einfacher zu testen.
- **Konsistenz mit etablierten Patterns.** Smart-Router-Pattern aus dem bestehenden Tropen-OS-Code wird wiederverwendet.
- **Niedrige User-Reibung.** Veredler ist im Default-Fall fast unsichtbar.
- **Sichtbar wenn nötig.** Bei Tiefe 3 wird der User aktiv eingebunden — *Führung ohne Zwang*.
- **Veredler trägt Projektwissen in jedes externe Tool.** Damit ist die Brücke zwischen Tropen OS und der IDE/dem Bau-Tool architektonisch verankert.

### Negative Konsequenzen

- **Klassifikator-Regeln sind kritisch.** Zu aggressiv → Veredler nervt; zu lasch → kritische Fälle gehen durch. Initialer Tuning-Aufwand hoch.
- **Drei Tiefen erhöhen Test-Komplexität.** Jede Tiefe braucht eigene Test-Coverage.
- **Tool-Profile müssen gepflegt werden.** Lovable, Cursor, Claude Code, Bolt — jedes Bau-Tool hat eigene Prompt-Konventionen, die der Veredler kennen muss.
- **Vollanreicherung kann zu schwer wirken.** Wenn ein User bei jedem Login-Feature durch ein Bestätigungs-UI muss, wird das ermüdend. Erfahrungslevel-Adaption mildert, löst aber nicht vollständig.

### Neutrale Konsequenzen

- **Veredler ist kein eigenständiger Spezial-Agent**, sondern eine Funktion, die Toro übernimmt — der Repo-Struktur-Agent ist als Hygiene-Spalte (Feld 3) integriert.
- **Veredler-Konversations-Architektur** ist zukünftig erweiterbar — neue Stufen können hinzugefügt werden, ohne die Tiefen-Logik zu brechen.

### Risiken

| Risiko | Wahrscheinlichkeit | Auswirkung | Mitigation |
|---|---|---|---|
| Klassifikator falsch kalibriert | Hoch (initial) | Hoch | Pilot-Phase mit Logging und manueller Korrektur, Heuristiken iterativ verbessern |
| User umgehen den Veredler | Mittel | Mittel | Veredler so unsichtbar wie möglich machen, Mehrwert sichtbar bei Tiefe 3 |
| Tool-Profile veralten (neue Bau-Tools, Updates) | Mittel | Mittel | Profile als Markdown-Schema versionierbar, Community-Beiträge ermöglichen (Phase 3) |
| Anreicherung enthält Halluzinationen | Mittel | Hoch | Validierungs-Stufe bei Tiefe 3, Quellen-Verweise auf Projektwissen-Einträge mit Markdown-Links |

---

## Alternatives Considered

### Alternative 1: Einheitliche Vollanreicherung für alle Prompts

**Beschreibung:** Jeder Prompt durchläuft denselben Anreicherungs-Pfad, unabhängig von der Aufgabe.

**Verworfen weil:**
- Reibung bei Mini-Iterationen wird untragbar
- Kosten und Latenz hoch für jeden Mini-Prompt
- Widerspricht dem Prinzip *Führung ohne Zwang*

### Alternative 2: User wählt selbst die Tiefe

**Beschreibung:** UI-Toggle zwischen „Schnell", „Standard", „Tief", User entscheidet pro Prompt.

**Verworfen weil:**
- User trifft die Entscheidung schlechter als das System (kennt nicht alle Konsequenzen seiner Aufgabe)
- Erhöht Reibung — bei jedem Prompt muss eine Wahl getroffen werden
- Konsistent mit dem Prinzip „implizite Intelligenz, explizite Wahl" sollte das System die Tiefe erkennen, der User wählt nur den Modus (Veredler ja/nein), wenn überhaupt

### Alternative 3: LLM-basierter Klassifikator

**Beschreibung:** Ein kleiner LLM-Call entscheidet die Tiefe.

**Verworfen weil:**
- Kosten-Leakage — jeder Prompt verursacht zusätzliche LLM-Kosten für Routing
- Latenz — der Veredler wird langsamer, gerade bei Tiefe 1 ein Problem
- Nicht-deterministisch — schwer testbar, unvorhersagbar
- Inkonsistent mit dem etablierten Smart-Router-Pattern (Memory-Eintrag: „Smart Router ist deterministisch")

### Alternative 4: Repo-Struktur-Agent als separater Spezial-Agent

**Beschreibung:** Repo-Hygiene als eigenständiger Agent neben dem Veredler.

**Verworfen weil:**
- Doppelte Wissens-Quelle (beide brauchen Projektwissen)
- Doppelte User-Interaktion (zweimal Veredelung-/Hygiene-Schritt)
- Hygiene gehört in die Anreicherung — sie ist eine **Spalte des Veredler-Prompts**, kein eigenes System

---

## Implementation Notes

### Reihenfolge der Umsetzung

1. **Klassifikator-Regeln** definieren (Heuristiken, Keyword-Sets, Pattern-Matching) — kleinster, schnellster Test
2. **Projektwissen-Datenmodell** muss stehen (siehe ADR-006, ADR-008)
3. **Tool-Profile** für Lovable, Cursor, Claude Code, Bolt definieren
4. **Veredler-Konversations-Architektur** implementieren (Pipeline-Stufen)
5. **Hygiene-Spalte** mit Soll-Repo-Schema verbinden
6. **Bestätigungs-UI** für Tiefe 3
7. **Audit-Modus** als reaktiver Lauf gegen dasselbe Regelwerk (siehe ADR-006, Schicht 5)

### Pseudo-Code Klassifikator (Skizze)

```typescript
function classifyDepth(prompt: string, project: ProjectKnowledge): Depth {
  // Tiefe 3 — strukturelle Änderung
  if (matchesArchitectureKeywords(prompt) ||
      affectsDataModel(prompt, project) ||
      affectsCompliance(prompt, project) ||
      affectsAuth(prompt, project) ||
      affectsMultipleFiles(prompt)) {
    return 3;
  }

  // Tiefe 1 — reine Kosmetik
  if (isCosmeticOnly(prompt) &&
      !affectsArchitecture(prompt, project)) {
    return 1;
  }

  // Tiefe 2 — Default (auch bei Unsicherheit)
  return 2;
}
```

### Logging und Lernen

Jede Klassifikator-Entscheidung wird geloggt mit:
- Eingabe-Prompt (gehasht für Datenschutz)
- Erkannte Tiefe
- User-Reaktion (akzeptiert / korrigiert / übersprungen)

Damit lassen sich Klassifikator-Regeln iterativ schärfen.

### Offene Fragen

- Wie kalibriert man Tool-Profile (z.B. Lovable-spezifische Prompt-Konventionen)? Manuell, durch Crawling der Tool-Doku, durch Community?
- Welche Sprache für veredelte Prompts? Deutsch (für DACH-User) oder Englisch (für IDE-Konsens)?
- Caching von Veredelungen bei wiederholten Prompts?

---

## Related ADRs

- **ADR-006** — Sechs-Schichten-Wissens-Architektur (definiert den Kontext, in dem der Veredler operiert)
- **ADR-008** — Markdown-Format mit Obsidian-Brücke (definiert die Quelle, aus der der Veredler Projektwissen abruft)

## References

- Strategie-Session 2026-04-27
- `engineering-standard.md` — Kategorie 22 (AI Integration)
- Tropen-OS-Vision Teil 5 (Multi-Agenten-Architektur, Komponente 9)
- Memory: „Smart Router ist deterministisch — Pure TypeScript keyword matching für routing decisions"
- Memory: „Implizite Intelligenz, explizite Wahl"
