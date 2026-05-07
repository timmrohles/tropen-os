# K0.6 — Doku-Konvention für Vibe-Coder

> Sprint: 2026-05-07 · Modelle: Claude Opus 4.7, Claude Sonnet 4.6, GPT-5, Gemini 2.5 Pro, Grok 4 · Judge: Claude Opus 4.7 · Dauer: 184s · Kosten: €1.5386

---

## Kontext-Brief (verbatim)

KONTEXT-BRIEF — DOKU-KONVENTION FÜR VIBE-CODER (K0.6)

DAS PROBLEM

"Vibe-Coding" beschreibt eine neue Form der Software-Erstellung: Menschen ohne tiefe Entwickler-Erfahrung bauen SaaS-Anwendungen mit AI-Bau-Agenten (Cursor, Claude Code, Lovable, Bolt, Replit, GitHub Copilot, Continue, Aider, Windsurf, Cline, und weitere). Der Bau-Agent generiert auf Zuruf Code, oft sehr schnell.

Im Lauf eines Projekts entsteht parallel zum Code eine wachsende Menge an Doku — Roadmaps, Strategie-Dokumente, ADRs, Status-Reports, Sparring-Outputs, Übergabe-Notizen, Konzept-Dokus, Pivot-Notizen, Plan-Dateien. Der Bau-Agent erstellt diese Dokumente ebenfalls auf Zuruf — oft mit der besten Absicht, neuen Inhalt sauber zu kapseln, dafür aber in immer neuen Verzeichnissen, mit immer neuen Dateinamen, ohne Rücksicht auf den Bestand.

Das Resultat ist ein typisches Vibe-Coding-Phänomen, das wir "Doku-Wildwuchs" nennen:

- Mehrere parallele Roadmaps, die sich teilweise widersprechen ("roadmap.md", "roadmap-v2.md", "roadmap-2026-q2.md", "ROADMAP.md")
- Strategie-Dokumente, deren Status (Entwurf / aktiv / überholt) nirgends ablesbar ist
- ADRs ohne klare Kennzeichnung, ob sie noch gültig sind
- Konzept-Dokus, die nirgendwo verlinkt sind und im Repo "verwaist" liegen
- Übergabe-Dokumente, die nie konsolidiert werden — jeder neue Chat erzeugt einen neuen Stand
- Doku-Verzeichnisse, die organisch entstehen (docs/, docs/notes/, docs/strategy/, docs/inventur/, docs/handover/, documents/, notes/)

Der Vibe-Coder verliert über Wochen den Überblick. Der Bau-Agent verliert ihn auch — er findet beim nächsten Aufruf nicht mehr verlässlich die maßgebliche Quelle und produziert deshalb noch mehr Doku.

DEINE AUFGABE

Entwirf eine Doku-Konvention für Vibe-Coder, die diesen Wildwuchs verhindert.

Du entscheidest selbst:
- Welche Tools du in deinem Entwurf berücksichtigst (Cursor, Claude Code, Lovable, Bolt, ggf. weitere — du wählst)
- Welche Architektur die Konvention hat (einheitlich für alle Tools? Tool-spezifische Adapter? Gemeinsamer Kern + Adapter? Tool-agnostisch und User spiegelt selbst?)
- Welche Verzeichnis-Struktur, welche Datei-Typen, welche Lebenszyklen
- Welche Verbindlichkeit (was ist Pflicht, was ist Empfehlung)
- Welche Mechaniken Drift verhindern (Status-Felder, Verfallsdaten, Verlinkungs-Pflicht, Index-Datei)

HARTE CONSTRAINTS

Diese Constraints prägen deine Antworten — sie sind nicht verhandelbar:

- **Solo-Founder oder Kleinteam (1–3 Personen)**, der/die selbst entwickelt mit AI-Bau-Agent.
- **6–12 Monate Projekt-Laufzeit** ist die typische Erfahrung. Konvention muss diese Zeit überstehen, ohne dass der Mensch zum Doku-Bibliothekar wird.
- **Mehrere parallele Projekte** sind realistisch (User hat oft 2–4 Repos parallel). Konvention muss konsistent über Projekte hinweg anwendbar sein, ohne dass jedes Projekt neu erfunden wird.
- **AI-Bau-Agent ist die Ausführungs-Hand.** Die Konvention muss vom Agent verlässlich befolgt werden können — sie muss in einer Form vorliegen, die der Agent versteht und respektiert. Konventionen, die nur ein menschlicher Disziplin-Mensch durchhält, scheitern.
- **Tool-Wechsel ist Realität, nicht Ausnahme.** User probieren aus, wechseln zwischen Cursor, Claude Code, Lovable, Bolt. Die Konvention sollte diesen Wechsel als Anforderung benennen — du musst den Wechsel nicht *lösen*, aber als zu adressierende Anforderung sichtbar machen.

DOPPEL-VERWENDUNG (WICHTIG)

Dein Entwurf hat zwei mögliche Verwendungen, die du beide bedienen sollst:

a) **Eigene Doku-Disziplin** für ein konkretes Vibe-Coding-Projekt namens Tropen OS (Begleitplattform für Vibe-Coder, derzeit in Entwicklung). Tropen OS hat selbst Doku-Wildwuchs.

b) **Substanz für ein Produkt-Feature** in Tropen OS: Doku-Hygiene als fünfte Wissens-Domäne ("Vier-Domänen-Spezialist" wird "Fünf-Domänen-Spezialist"). Tropen würde dann Repos auf Doku-Wildwuchs scannen, gemäß deiner Konvention oder einer ähnlichen.

Berücksichtige beide Verwendungen, aber halte sie im Output sauber getrennt — was ist die Konvention, was wäre als Produkt-Feature implementierbar.

OUTPUT-FORMAT

# Doku-Konvention K0.6 — [Modell]

## Kern-Position (5–7 Sätze)
Was ist deine Grundidee? Welche Wette steckt drin?

## Konvention (für eigene Doku-Disziplin)

### Architektur-Entscheidung
Wie geht deine Konvention mit Tool-Vielfalt um (einheitlich / Adapter / agnostisch / anders)? Welche Tools hast du berücksichtigt? Begründung in 3–5 Sätzen.

### Verzeichnis-Struktur
Welche Verzeichnisse, welche Datei-Typen, welche Datei-Namen-Konventionen. Konkret, nicht abstrakt.

### Lebenszyklus pro Datei
Wie wird eine neue Datei angelegt, wie wird sie aktualisiert, wann wird sie archiviert oder gelöscht. Welche Status-Felder. Wie verhindert die Konvention "Datei XY-v2.md" neben "Datei XY.md".

### Verbindlichkeits-Stufen
Was ist Pflicht (verstößt der Agent dagegen, ist es ein Bug), was Empfehlung (verstößt der Agent, ist es ein Hinweis), was Freistil.

### Drift-Schutz-Mechaniken
Konkrete Mechaniken die verhindern, dass Doku binnen 3 Monaten wieder verwildert. Nenne 3–5 mit Wirkungsweise.

### Tool-Wechsel-Anforderung
Benennen (nicht lösen): Was muss eine Konvention berücksichtigen, wenn der User von Tool A zu Tool B wechselt? Welche Anforderungen entstehen?

### Wie der Agent die Konvention befolgt
Wo steht die Konvention, sodass jeder Bau-Agent sie verlässlich liest? Datei-Pfad, Format, Verlinkung.

## Produkt-Feature-Skizze (für Tropen OS Achse 9)

### Was Tropen scannen würde
Welche konkreten Verstöße gegen Doku-Hygiene würde Tropen als Findings melden? 5–10 Beispiele (analog zu Audit-Findings für DSGVO oder Security).

### Severity-Logik
Welche Verstöße sind Critical (würde Release blockieren), welche Should, welche Info.

### Fix-Prompt-Beispiele
Skizziere 2 Fix-Prompts, die Tropen User geben würde — ein einfacher (z.B. "Doppelte Roadmap erkannt"), einer komplexer (z.B. "Konzept-Doku verwaist, kein Anker im Repo").

### Abgrenzung
Was sollte Tropen als Doku-Hygiene-Feature *nicht* tun? Wo ist die Grenze zwischen Hilfe und Bevormundung?

## Drei Risiken / Schwächen deines Vorschlags
Sei selbstkritisch. Wo bricht die Konvention?

## Eine alternative Konvention, die du *nicht* gewählt hast
Skizziere kurz: Was wäre eine andere plausible Konvention, und warum hast du sie nicht gewählt?

---

## Modell-Antworten (unverändert)

## Claude Opus 4.7

# Doku-Konvention K0.6 — Claude Sonnet 4.5

## Kern-Position (5–7 Sätze)

Doku-Wildwuchs ist kein Disziplin-Problem, sondern ein **Auffindbarkeits-Problem**: Der Agent erstellt neue Dateien, weil er die alten nicht findet — und er findet sie nicht, weil es keinen verlässlichen Einstiegspunkt gibt. Meine Wette: Eine einzige, vom Agent zwingend zu lesende Datei (`AGENTS.md` im Repo-Root) plus ein **flacher, kanonischer Doku-Baum mit höchstens drei Verzeichnissen** löst 80% des Problems. Der zweite Hebel ist **Front-Matter-Pflicht** (YAML-Header mit Status, Datum, Supersedes-Link) — ohne gültiges Front-Matter existiert die Datei für den Agent schlicht nicht. Der dritte Hebel ist **eine pflicht-aktualisierte Index-Datei** (`docs/INDEX.md`), die als Single Source of Truth fungiert; jeder Agent-Lauf muss sie zuerst lesen und am Ende aktualisieren. Ich verzichte bewusst auf Tool-spezifische Adapter — das ist der falsche Hebel, weil alle relevanten Bau-Agenten heute `AGENTS.md`/`CLAUDE.md`/`.cursorrules` aus dem Repo-Root lesen können und das Repo der einzige Ort ist, der den Tool-Wechsel überlebt. Die Konvention ist bewusst **rigide bei wenigen Dingen** (Pfade, Status-Feld, Index) und **liberal beim Rest** (Inhalt, Sprache, Länge), weil rigide Konventionen mit kleinem Oberflächen-Bereich von Agents zuverlässiger befolgt werden als umfassende Stilguides.

## Konvention (für eigene Doku-Disziplin)

### Architektur-Entscheidung

**Tool-agnostischer Kern + dünne Tool-Brücken via Symlinks/Includes.** Die Konvention lebt in einer Datei: `AGENTS.md` im Repo-Root (de-facto-Standard, den Codex, Aider, Cursor's neue Versionen, Cline u.a. bereits lesen). Für Tools, die abweichende Dateinamen erwarten — `CLAUDE.md` (Claude Code), `.cursorrules` bzw. `.cursor/rules/` (Cursor), `.windsurfrules` (Windsurf), `.github/copilot-instructions.md` (Copilot) — wird die `AGENTS.md` per One-Liner referenziert oder symverlinkt. Lovable und Bolt sind Spezialfälle (cloud-basiert, oft kein Datei-Zugriff im klassischen Sinn) — hier wird die Konvention beim Projekt-Start als System-Prompt eingespeist; das ist eine bekannte Schwäche, die ich unten als Risiko nenne. Berücksichtigte Tools: Cursor, Claude Code, Aider, Cline, Continue, Copilot, Windsurf (alle Datei-basiert) sowie Lovable/Bolt (Cloud, eingeschränkt). **Begründung:** Tool-spezifische Konventionen multiplizieren Wartungsaufwand mit jedem neuen Tool und brechen beim Wechsel. Eine Quelle, mehrere Pointer ist die einzige Architektur, die einen 6–12-Monats-Horizont mit Tool-Hopping überlebt.

### Verzeichnis-Struktur

```
/                          
├── AGENTS.md              # Konvention selbst + Pointer zu allem
├── README.md              # Mensch-orientiert, Projekt-Pitch
├── CLAUDE.md              # Symlink → AGENTS.md
├── .cursor/rules/main.mdc # 3-Zeilen-Pointer auf AGENTS.md
└── docs/
    ├── INDEX.md           # Lebende Übersicht — Pflicht-Update
    ├── decisions/         # ADRs, nummeriert: 0001-xxx.md
    ├── active/            # Alles "live": Roadmap, Strategie, Konzepte
    └── archive/           # Alles "superseded" oder "obsolete"
```

**Genau drei Verzeichnisse unter `docs/`**: `decisions/`, `active/`, `archive/`. Keine Sub-Verzeichnisse außer in `archive/YYYY-MM/`. Keine `notes/`, keine `strategy/`, keine `handover/`, keine `inventur/`. Diese semantischen Sub-Ordner sind die Hauptquelle für Wildwuchs.

**Datei-Namen-Konvention:**
- ADRs: `decisions/NNNN-kebab-titel.md` (4-stellig, fortlaufend, niemals umbenannt)
- Active: `active/<thema>.md` — **ein Thema, eine Datei, kein Suffix**. Also `active/roadmap.md`, nicht `active/roadmap-v2.md`. Versionierung läuft über Git und Front-Matter, nicht über Dateinamen.
- Archive: Original-Name + Datum-Präfix beim Archivieren: `archive/2025-03/roadmap.md`

### Lebenszyklus pro Datei

**Front-Matter-Pflicht** (YAML, ohne das die Datei "existiert nicht"):

```yaml
---
title: Roadmap Q2 2026
status: active        # active | draft | superseded | obsolete
created: 2025-11-15
updated: 2026-01-20
owner: solo           # oder Name bei Team
supersedes: null      # oder relative Pfad zur abgelösten Datei
review_by: 2026-04-01 # Pflicht für status:active
---
```

**Anlage neuer Doku — Agent-Pflicht-Sequenz:**
1. `docs/INDEX.md` lesen
2. Prüfen, ob Thema bereits existiert (`active/<thema>.md`)
3. Wenn ja → **bestehende Datei updaten**, nicht neue anlegen. `updated`-Feld pflegen.
4. Wenn nein → neue Datei in `active/` mit Front-Matter
5. `INDEX.md` ergänzen
6. Bei Ablösung: alte Datei nach `archive/YYYY-MM/` verschieben, `status: superseded` setzen, `supersedes`-Link in neuer Datei pflegen

**"v2"-Verhinderung:** Die Konvention verbietet explizit Suffixe wie `-v2`, `-new`, `-final`, `-2026`, `-q2` in `active/`. Wenn eine Roadmap überholt wird, wandert die alte nach `archive/`, die neue heißt weiterhin `roadmap.md`. Versions-Historie ist Git-Aufgabe.

**Review-Pflicht:** `review_by` darf nicht in der Vergangenheit liegen. Bei abgelaufenem Datum eskaliert der Agent-Scan: "Datei XY ist seit 14 Tagen unreviewed. Status entscheiden: aktiv halten (review_by erneuern) / archivieren / löschen."

### Verbindlichkeits-Stufen

**MUST (Verstoß = Bug, Agent muss verweigern oder korrigieren):**
- Front-Matter mit `status` und `updated` auf jeder `.md` in `docs/`
- Keine neuen Verzeichnisse unter `docs/` außer den drei genannten
- Keine Datei-Suffixe `-v2`, `-new`, `-final` in `active/`
- `INDEX.md` wird bei jeder Änderung in `docs/` mit aktualisiert
- Vor Anlage neuer Doku: Existenz-Check in `INDEX.md`

**SHOULD (Verstoß = Hinweis):**
- ADRs für Entscheidungen mit Tragweite > 2 Wochen Arbeit
- Maximum 1 Bildschirmseite pro `active/`-Datei (länger → splitten oder ADR daraus machen)
- `review_by` nicht weiter als 90 Tage in der Zukunft

**FREESTYLE:**
- Sprache (Deutsch/Englisch — aber konsistent pro Repo)
- Inhaltliche Struktur innerhalb der Datei
- README-Stil
- Code-Kommentare, Inline-Doku

### Drift-Schutz-Mechaniken

1. **INDEX.md als Pflicht-Eingang.** Jeder Agent-Lauf beginnt mit `cat docs/INDEX.md`. Steht in `AGENTS.md` als allererste Anweisung. Wirkung: Agent kennt den Bestand, bevor er Neues erzeugt — der häufigste Wildwuchs-Trigger ist eliminiert.

2. **Front-Matter-Validierung als Pre-Commit-Hook.** Skript prüft: Hat jede `.md` in `docs/` gültiges Front-Matter? Ist `status` aus erlaubter Liste? Ist `review_by` gesetzt? CI-fähig. Wirkung: Doku ohne Status existiert nicht — der Bau-Agent kann nicht "schnell mal eine Notiz" hinterlassen.

3. **`review_by`-Verfallsdatum.** Datei mit abgelaufenem Review-Datum wird im nächsten Doku-Scan zur Entscheidung gestellt. Wirkung: Verwaiste Konzept-Dokus sterben spätestens nach 90 Tagen, statt jahrelang zu liegen.

4. **Supersedes-Kette als Pflicht.** Neue Doku, die alte ablöst, *muss* `supersedes:`-Feld haben. Alte Doku *muss* in einem Atomic-Schritt archiviert werden. Wirkung: Keine zwei "lebenden" Roadmaps — strukturell ausgeschlossen.

5. **Quartals-Selbst-Audit-Prompt in `AGENTS.md`.** Vorgefertigter Prompt, den der User alle 3 Monate ausführt: "Lies `docs/INDEX.md`, prüfe alle `active/`-Dateien gegen `review_by`, schlage Archivierungen vor." Wirkung: Wartung wird zur 30-Min-Routine statt zur Bibliothekars-Aufgabe.

### Tool-Wechsel-Anforderung

Wenn der User von Cursor zu Claude Code wechselt (oder Lovable zu Cursor), entstehen folgende Anforderungen, die die Konvention **benennt, aber nicht vollständig löst**:

- **Konventions-Datei muss am gemeinsamen Anker-Punkt liegen** (Repo-Root, nicht Tool-Config-Verzeichnis). `AGENTS.md` ist genau dieser Anker.
- **Tool-spezifische Pointer-Dateien müssen synchronisiert bleiben** — wenn `AGENTS.md` aktualisiert wird, dürfen `.cursorrules` etc. nicht "alte Wahrheit" enthalten. Lösung in K0.6: Symlinks oder 3-Zeilen-Pointer ("Read AGENTS.md").
- **Cloud-Tools ohne Datei-Zugriff (Lovable, Bolt) brechen die Konvention.** Dort muss die Konvention beim Projekt-Start manuell als System-Prompt eingespeist werden. Das ist eine offene Anforderung, die K0.6 nicht löst.
- **Doku-Format muss Tool-übergreifend lesbar sein** → reines Markdown + YAML-Front-Matter, keine Notion/Obsidian-spezifischen Erweiterungen.
- **History muss in Git liegen, nicht im Tool.** Cursor-Chat-Historie ist nicht portierbar; konsolidierte Übergabe-Notizen in `docs/active/` sind es.

### Wie der Agent die Konvention befolgt

**Pfad:** `/AGENTS.md` (Repo-Root). Pointer: `CLAUDE.md` als Symlink, `.cursor/rules/main.mdc` mit 3-Zeilen-Verweis, `.github/copilot-instructions.md` mit Verweis.

**Format:** Markdown, max. 200 Zeilen. Struktur:
```
# AGENTS.md
## Pflicht-Sequenz vor jedem Doku-Schreibvorgang
1. Lies docs/INDEX.md
2. Prüfe Existenz des Themas
3. ...
## Verbotene Muster
- Keine Datei-Suffixe -v2, -new, -final
- ...
## Front-Matter-Schema
[YAML-Beispiel]
## Bei Unsicherheit
Frage den User, lege keine neue Datei "auf Verdacht" an.
```

**Verlinkung:** `README.md` verweist als zweite Zeile auf `AGENTS.md`. `docs/INDEX.md` Header verweist auf `AGENTS.md`.

## Produkt-Feature-Skizze (für Tropen OS Achse 9)

### Was Tropen scannen würde

1. **Mehrere "lebende" Dokumente zum gleichen Thema** — Datei-Namen-Heuristik (Levenshtein < 3 oder gemeinsamer Wortstamm) + beide ohne `status: superseded`. Beispiel: `roadmap.md` und `roadmap-2026.md` beide `active`.
2. **Datei ohne Front-Matter** in `docs/`-äquivalentem Verzeichnis.
3. **Verwaiste Doku** — Datei in `docs/`, aber kein Verweis aus `INDEX.md`, `README.md` oder einer anderen `.md`.
4. **Parallele Doku-Verzeichnisse** — Repo enthält `docs/`, `documents/`, `notes/`, `wiki/` parallel.
5. **Status-Drift** — Datei mit `status: active`, aber `updated` älter als `review_by`.
6. **Tot-Verl

---

## Claude Sonnet 4.6

# Doku-Konvention K0.6 — Claude

---

## Kern-Position

Die Grundidee ist eine **Single-Source-of-Truth-Architektur mit erzwungener Verdrängung**: Jede inhaltliche Kategorie darf exakt eine lebende Datei haben — neue Inhalte *ersetzen* den Vorgänger, sie ergänzen ihn nicht. Die Wette dahinter: Wildwuchs entsteht nicht aus Faulheit, sondern aus falschem Anreiz-Design. Agents und Menschen erstellen neue Dateien, weil das der Weg des geringsten Widerstands ist — keine Konflikt-Entscheidung, kein Merge-Risiko. Die Konvention dreht diesen Anreiz um: Neue Datei anlegen ist teurer als bestehende Datei aktualisieren, weil eine neue Datei explizit begründet werden muss. Das Fundament ist eine maschinenlesbare Index-Datei (`docs/INDEX.md`), die der Agent bei jeder Doku-Operation als erste Quelle liest und als letzte schreibt. Ohne Eintrag im Index existiert eine Datei für den Agent nicht — das ist die einzige Zwangsmaßnahme. Die Konvention ist bewusst **tool-agnostisch im Kern** und löst Tool-Spezifika über genau eine Adapter-Datei pro Tool, nicht über Tool-spezifische Doku-Strukturen. Sechs bis zwölf Monate Laufzeit überstehen heißt: Der Mensch darf maximal zehn Minuten pro Woche mit Doku-Hygiene verbringen — alles andere muss der Agent erledigen.

---

## Konvention (für eigene Doku-Disziplin)

### Architektur-Entscheidung

**Ansatz: Tool-agnostischer Kern + ein optionaler Adapter pro Tool**

Ich habe mich gegen einheitliche Tool-Integration und gegen rein manuelle Konventionen entschieden. Der Grund ist einfach: Eine Konvention, die Cursor-spezifische `.cursorrules` als einzigen Durchsetzungsmechanismus hat, bricht sofort, wenn der User zu Claude Code wechselt. Umgekehrt: Eine Konvention, die gar keine Tool-Hooks nutzt, verlässt sich zu sehr auf menschliche Disziplin.

**Berücksichtigte Tools:** Cursor (`.cursor/rules/`-Verzeichnis), Claude Code (`CLAUDE.md`), Lovable (kein nativer Rules-Mechanismus, daher Konvention im System-Prompt), Bolt (ähnlich Lovable — kein nativer Hook, daher Prompt-Ebene). Aider und Cline sind nahe genug an Cursor/Claude Code, dass keine separaten Adapter nötig sind.

Der **Kern** der Konvention lebt in `docs/INDEX.md` und `docs/CONVENTIONS.md` — tool-agnostisch, versioniert, der Agent liest diese Dateien unabhängig davon, welches Tool ihn aufruft. Jeder Tool-Adapter tut genau eine Sache: Er verweist den Agent auf den Kern. Mehr nicht.

**Warum nicht einheitlich?** Weil die Tools unterschiedliche Mechaniken haben, wann und wie sie Kontext laden. Das zu ignorieren bedeutet, auf Disziplin zu hoffen.

**Warum kein Full-Adapter-System?** Weil Tool-Adapter Wartungsaufwand erzeugen. Wenn Lovable sein System ändert, muss nur der Lovable-Adapter aktualisiert werden, nicht die Konvention selbst.

---

### Verzeichnis-Struktur

```
/
├── docs/
│   ├── INDEX.md              ← PFLICHT. Maschinenlesbare Haupt-Navigation. 
│   │                           Jede Doku-Datei muss hier eingetragen sein.
│   ├── CONVENTIONS.md        ← PFLICHT. Diese Konvention selbst. Unveränderlich 
│   │                           ohne expliziten Versions-Bump.
│   │
│   ├── live/                 ← Genau eine lebende Datei pro Kategorie.
│   │   ├── roadmap.md        ← Die Roadmap. Keine roadmap-v2.md.
│   │   ├── strategy.md       ← Die Strategie. Kein strategy-new.md.
│   │   ├── architecture.md   ← Architektur-Überblick (nicht ADRs).
│   │   ├── status.md         ← Aktueller Projekt-Status. Wöchentlich überschrieben.
│   │   └── handover.md       ← Übergabe-Notiz. Immer dieselbe Datei, aktualisiert.
│   │
│   ├── adr/                  ← Architecture Decision Records.
│   │   ├── adr-001-auth.md   ← Format: adr-NNN-thema.md. Nummeriert, unveränderlich.
│   │   └── adr-002-db.md       Status im Header: proposed / accepted / superseded.
│   │
│   ├── concepts/             ← Konzept-Dokus, die noch keine ADRs sind.
│   │   └── payment-flow.md     Jede Datei braucht einen Anker-Link in INDEX.md.
│   │
│   ├── archive/              ← Alles, was nicht mehr aktiv ist. Nie löschen, 
│   │   └── 2025-05/            in Monats-Ordner ablegen.
│   │       └── roadmap-pre-pivot.md
│   │
│   └── sparring/             ← Outputs aus AI-Sparring-Sessions. 
│       └── 2025-05-30-pricing-debate.md   Datumspräfix, nie aktualisiert.
│
├── CLAUDE.md                 ← Claude Code Adapter (verweist auf docs/CONVENTIONS.md)
├── .cursor/
│   └── rules/
│       └── docs-convention.mdc ← Cursor Adapter
└── README.md                 ← Verweist auf docs/INDEX.md für Doku-Navigation.
```

**Dateinamen-Regeln:**
- `live/`-Dateien: Genau der Kategorie-Name. Keine Versionsnummern, keine Daten, keine Suffixe. `roadmap.md`, nicht `roadmap-v2.md`.
- `adr/`-Dateien: `adr-NNN-kurzer-slug.md`. NNN dreistellig, lückenlos aufsteigend.
- `concepts/`-Dateien: `kurzer-slug.md`. Kein Datum, kein Status im Dateinamen (der steht im Header).
- `sparring/`-Dateien: `YYYY-MM-DD-slug.md`. Datum als Präfix, weil Sparring chronologisch ist.
- `archive/`-Dateien: Monats-Ordner `YYYY-MM/`, Dateiname bleibt wie er war.

**Was explizit verboten ist:**
- Dateien im Root von `docs/` außer `INDEX.md` und `CONVENTIONS.md`.
- Unterverzeichnisse in `live/`.
- Dateien mit `-v2`, `-new`, `-final`, `-updated` im Namen irgendwo im Repo.

---

### Lebenszyklus pro Datei

**Grundprinzip: Verdrängung statt Ergänzung**

```
ANLEGEN
  → Agent prüft INDEX.md: Existiert eine Datei dieser Kategorie bereits?
  → Nein: Neue Datei im richtigen Verzeichnis anlegen, sofort in INDEX.md eintragen.
  → Ja:   Bestehende Datei aktualisieren. Keine neue Datei. 
           Wenn Inhalt zu verschieden: Entweder in archive/ schieben und 
           ersetzen, oder in concepts/ als separates Konzept anlegen — 
           aber das erfordert explizite User-Entscheidung.

AKTUALISIEREN
  → Datei öffnen, Header-Feld `updated` auf heutiges Datum setzen.
  → Inhalt ändern. Keine Kopie anlegen.
  → INDEX.md `updated`-Spalte synchronisieren.

ARCHIVIEREN
  → Datei nach archive/YYYY-MM/ verschieben (nicht kopieren, nicht löschen).
  → INDEX.md-Eintrag: Status auf `archived`, Pfad auf neuen Ort aktualisieren.
  → Nachfolger-Datei in INDEX.md mit `replaces: archive/YYYY-MM/alte-datei.md` verlinken.

LÖSCHEN
  → Nicht erlaubt außer für leere Stub-Dateien (0 Inhalt) innerhalb von 24h nach Anlage.
```

**Pflicht-Header für alle Dateien in `live/`, `adr/`, `concepts/`:**

```markdown
---
status: draft | active | superseded | archived
created: YYYY-MM-DD
updated: YYYY-MM-DD
expires: YYYY-MM-DD | never
owner: [Name oder "ai-generated"]
replaces: [Pfad zur Vorgänger-Datei oder "-"]
---
```

**Wie verhindert die Konvention `XY-v2.md` neben `XY.md`?**

Durch zwei Mechaniken:
1. Der Agent wird explizit angewiesen: Vor dem Anlegen einer neuen Datei in `live/` oder `concepts/` muss er `INDEX.md` konsultieren. Findet er eine gleichnamige oder inhaltlich verwandte Datei, ist die Standardaktion: Update, nicht neue Datei.
2. `INDEX.md` enthält eine "Bekannte Duplikate"-Sektion. Findet der Agent beim Scan zwei Dateien mit ähnlichem Inhalt, trägt er sie dort ein, anstatt sie stumm zu tolerieren. Das macht Duplikate sichtbar, ohne sie sofort zu löschen.

---

### Verbindlichkeits-Stufen

**Pflicht (Agent-Fehler, wenn verletzt):**

| Regel | Warum Pflicht |
|-------|--------------|
| Jede neue Doku-Datei wird in `INDEX.md` eingetragen | Ohne das bricht die gesamte Navigations-Logik |
| `live/`-Dateien haben keinen Versions-Suffix im Namen | Kernmechanik gegen Wildwuchs |
| Jede Datei außer `sparring/` hat einen vollständigen Pflicht-Header | Status-Lesbarkeit ohne Header nicht möglich |
| Archivierung über `archive/`-Ordner, nicht über Umbenennung | Sonst entsteht Wildwuchs im alten Verzeichnis |
| Neue `concepts/`-Datei braucht Anker-Link in `INDEX.md` | Verhindert verwaiste Konzept-Dokus |

**Empfehlung (Hinweis, kein Fehler):**

- `expires`-Feld in `live/`-Dateien setzen (empfohlen: 90 Tage für `status.md`, `handover.md`)
- Sparring-Outputs mit kurzem `## Summary`-Abschnitt an Datei-Anfang
- ADRs, die älter als 6 Monate sind und nie auf `accepted` standen, sollten auf `superseded` gesetzt werden

**Freistil:**

- Wie viele Konzept-Dokus angelegt werden
- Innere Struktur der Dateien (Überschriften, Abschnitte)
- Ob Sparring-Outputs zusammengefasst werden
- Sprache der Inhalte (Deutsch/Englisch)

---

### Drift-Schutz-Mechaniken

**1. INDEX.md als Gating-Bedingung**

Wirkungsweise: Der Agent-Adapter (CLAUDE.md / Cursor-Rule) enthält die Regel: "Bevor du eine Doku-Datei erstellst oder bearbeitest, lies `docs/INDEX.md`. Danach, bevor du die Session beendest, aktualisiere `docs/INDEX.md`." INDEX.md ist damit nicht optional — sie ist der Taktschlag jeder Doku-Operation. Eine Datei, die nicht in INDEX.md steht, wird vom nächsten Agent-Aufruf nicht als maßgeblich behandelt.

**2. Status-Verfall durch `expires`-Feld**

Wirkungsweise: `live/status.md` und `live/handover.md` tragen `expires: YYYY-MM-DD` (Standard: 30 Tage nach letztem Update). Wenn der Agent eine dieser Dateien liest und das Datum abgelaufen ist, gibt er eine Warnung aus: "Achtung: `status.md` ist seit X Tagen abgelaufen. Bitte aktualisieren oder als `archived` markieren." Das erzeugt einen aktiven Verfalls-Druck, ohne dass der Mensch Kalender führen muss.

**3. Duplikat-Detektion im INDEX.md**

Wirkungsweise: `INDEX.md` hat eine Sektion `## Bekannte Konflikte`. Der Agent ist angewiesen, beim Scan des `docs/`-Verzeichnisses Dateien mit ähnlichem Namen oder ähnlichen `status: active`-Einträgen in derselben Kategorie in diese Sektion einzutragen. Das macht Konflikte sichtbar und adressierbar, anstatt sie zu vergraben. Der Mensch muss dann entscheiden — aber er sieht das Problem.

**4. Archivierungs-Pflicht vor Ersatz**

Wirkungsweise: Wer eine `live/`-Datei durch einen inhaltlich anderen Nachfolger ersetzt, muss die alte Datei zuerst nach `archive/` verschieben. Das verhindert stillen Informationsverlust und erzeugt einen expliziten "ich ersetze das"-Moment — psychologisch und protokollarisch. Der Verdrängungsakt ist damit sichtbar, kein stilles Überschreiben.

**5. Monatlicher Mini-Audit-Prompt**

Wirkungsweise: In `docs/CONVENTIONS.md` steht ein vorgefertigter Audit-Prompt, den der User einmal pro Monat ausführen kann (Copy-paste in den Agent): "Scanne `docs/` vollständig. Liste alle Dateien, die (a) nicht in INDEX.md stehen, (b) `expires` überschritten haben, (c) `status: draft` älter als 30 Tage sind, (d) keinen Anker-Link in INDEX.md haben. Erstelle einen kurzen Report und schlage Aktionen vor." Zehn Minuten, einmal im Monat. Mehr Doku-Disziplin soll das nicht kosten.

---

### Tool-Wechsel-Anforderung

Das ist eine strukturelle Schwachstelle fast aller Konventionen, die sie nicht explizit benennen. Ich benenne sie hier als Anforderungs-Cluster:

**Anforderung 1: Kontext-Portabilität**
Wenn der User von Cursor zu Claude Code wechselt, muss der neue Agent dieselbe Konvention finden und verstehen, ohne dass der User sie neu erklärt. Die Konvention muss in einer Datei leben, die *jeder* Agent ohne Tool-spezifischen Mechanismus lesen kann (`docs/CONVENTIONS.md`). Tool-Adapter dürfen nur auf den Kern verweisen, nicht den Kern *enthalten*.

**Anforderung 2: Kein Tool-spezifischer Zustand**
Kein Teil der lebenden Doku-Wahrheit darf in tool-spezifischen Dateien stecken (z.B. nicht in `.cursorrules` allein). Wenn `.cursorrules` die einzige Quelle der Konvention ist und der User zu Claude Code wechselt, ist die Konvention weg.

**Anforderung 3: Adapter-Erstellung beim Wechsel**
Beim Tool-Wechsel muss der User (oder der neue Agent) genau eine Aktion ausführen: Den Adapter für das neue Tool anlegen, der auf `docs/CONVENTIONS.md` verweist. Das ist die einzige Wechsel-Pflicht.

**Anforderung 4: Adapter-Vollständigkeit prüfen**
`INDEX.md` listet im Header, für welche Tools Adapter existieren. Fehlt ein Adapter, ist das ein sichtbarer Eintrag, kein stilles Problem.

**Was die Konvention nicht löst:** Sie kann nicht garantieren, dass ein neues Tool die Konvention *befolgt*, wenn das Tool keinen nativen Mechanismus hat, Dateien vorab zu lesen. Lovable und Bolt sind hier die schwachen Glieder — dort ist die Konvention nur so stark wie der System-Prompt, den der User einstellt.

---

### Wie der Agent die Konvention befolgt

**Primärquelle: `docs/CONVENTIONS.md`**

Diese Datei ist der kanonische Text der Konvention. Sie enthält alle Regeln in maschinenlesbarer Form (klare Aufzählungen, keine Prosa-Blöcke). Format: Markdown mit Heading-Hierarchie. Kein PDF, keine externe URL — die Datei lebt im Repo.

**Tool-Adapter:**

*Cursor:*
```
# docs-convention.mdc (in .cursor/rules/)
Diese Regeln gelten für alle Doku-Operationen in diesem Repo.
Lies zuerst docs/CONVENTIONS.md. Lies dann docs/INDEX.md.
Befolge alle Pflicht-Regeln aus docs/CONVENTIONS.md.
Aktualisiere docs/INDEX.md nach jeder Doku-Operation.
```

*Claude Code:*
```
# CLAUDE.md (Root)
## Doku-Konvention
Für alle Operationen in docs/: Lies docs/CONVENTIONS.md vor dem ersten 
Schritt. Lies docs/INDEX.md. Befolge Pflicht-Regeln. Schreibe INDEX.md zurück.
```

*Lovable / Bolt:*
Diese Tools haben keine native Datei-Vorab-Lese-Mechanik. Empfehlung: System-Prompt der jeweiligen Plattform enthält den Verweis auf `docs/CONVENTIONS.md` und die Kern-Regeln als komprimierte Liste (max. 200 Token). Der User muss das einmalig einrichten.

**Verlinkung:**

`README.md` enthält im ersten Abschnitt:
```markdown
**Doku-Navigation:** Siehe [docs/INDEX.md](docs/INDEX.md).
**Doku-Konvention:** Siehe [docs/CONVENTIONS.md](docs/CONVENTIONS.md).
```

Damit findet jeder Agent, der `README.md` als Einstiegspunkt liest (das tun die meisten), den Pfad zur Konv

---

## GPT-5

# Doku-Konvention K0.6 — ARK (Anker-Registry-Kern)

## Kern-Position (5–7 Sätze)
Doku-Wildwuchs stoppt man nicht mit mehr Doku, sondern mit wenigen harten Ankern. Meine Wette: Ein maschinenlesbares Registry-File als Single Source of Truth, feste Doc-Typen mit stabilen Pfaden und Pflicht-Frontmatter reichen, um 90% des Chaos zu verhindern. Keine Versionen im Dateinamen, niemals Duplikate: Änderung heißt Aktualisierung, nicht „-v2“. Kurzlebiges landet in eine Inbox mit Verfallsdatum, Langlebiges bekommt Review-Termine. Ein menschlich lesbares Index-Dokument spiegelt die Registry; beides wird ausschließlich vom Agent gepflegt. Tool-Wechsel bleibt möglich, weil alles in einfachen Dateien liegt: Markdown + YAML, keine Symlinks, keine proprietären Features.

## Konvention (für eigene Doku-Disziplin)

### Architektur-Entscheidung
Gemeinsamer Kern, tool-agnostisch, mit leichten Adaptern per Templates. Berücksichtigt: Cursor, Claude Code, Copilot, Lovable, Bolt, Replit, Continue, Aider, Windsurf, Cline. Begründung: Diese Tools können Dateisystem + Markdown + YAML sicher handhaben; JSON/YAML ist für sie robust konsumierbar. Der Kern definiert Pfade, Formate, Status und Registry; Adapter sind nur Templatedateien pro Tool (Prompt-Snippets), keine Logik. So übersteht die Konvention 6–12 Monate und Tool-Wechsel ohne Umbau.

### Verzeichnis-Struktur
- Root
  - README.md (verlinkt auf docs/00-index.md)
  - DOCS-CONVENTION.md (menschlich, Kurzfassung)
  - .tropen/
    - docs.yaml (maschinelles Registry + Regeln, Single Source of Truth)
    - templates/
      - roadmap.md
      - strategy.md
      - adr.md
      - concept.md
      - handover.md
      - plan.md
      - status.md
      - note.md
      - index.md
- docs/
  - 00-index.md (menschlicher Einstieg; nur Agent schreibt/aktualisiert)
  - roadmap/
    - main.md (Singleton)
  - strategy/
    - main.md (Singleton)
  - adr/
    - 2026-05-07-adopt-ark.md (Datums-IDs statt Zählern)
  - concept/
    - billing-service-sharding.md
  - plan/
    - 2026-q2.md
  - status/
    - 2026-05-week-19.md
  - handover/
    - infra-handover-may.md
  - inbox/
    - spike-auth-provider.md (kurzlebig, Auto-Archiv)
  - _archive/ (nur für automatisches Weglegen durch Agent; Pfadspiegelung)

Dateinamen-Konventionen:
- Format: kebab-case, ASCII, keine Leerzeichen, keine „v2“, keine Großschreibung.
- Keine Datums-Präfixe außer bei ADR und Status (bewusst, um Sortierung zu helfen).
- Keine alternativen Doku-Ordner (keine documents/, notes/ etc.). docs/ ist allein gültig.

### Lebenszyklus pro Datei
Allgemein
- Jede Datei beginnt mit YAML-Frontmatter:
  - id: <type>-<slug | date-slug>
  - type: roadmap | strategy | adr | concept | plan | status | handover | note
  - title: Menschlicher Titel
  - status: draft | active | deprecated | archived
  - version: MAJOR.MINOR.PATCH (Start 0.1.0)
  - created: YYYY-MM-DD
  - updated: YYYY-MM-DD
  - owner: @handle oder E-Mail
  - supersedes: <id> | null
  - superseded_by: <id> | null
  - links: [Pfad/URL...]
  - review_cycle_days: 30 | 60 | 90 (nur für active)
  - next_review: YYYY-MM-DD (Agent pflegt)
  - expires_at: YYYY-MM-DD (nur für inbox, handover, status optional)

Anlegen
- Agent prüft .tropen/docs.yaml (registry.types + registry.entries), erzeugt slug nach Konvention, wählt Template aus .tropen/templates, setzt Pflichtfelder, fügt Entry in docs.yaml hinzu und verlinkt in docs/00-index.md unter dem passenden Abschnitt.
- Für Singleton-Typen (roadmap, strategy) darf es genau eine Datei mit status active geben, Pfad ist fix: roadmap/main.md und strategy/main.md.

Aktualisieren
- Niemals neue Datei für denselben Inhalt anlegen. Inhalt in-place ändern, updated und version patchen. Wenn inhaltlicher Pivot: altes Dokument auf deprecated setzen, superseded_by referenzieren, neues Dokument anlegen mit supersedes. Registry und Index updaten.

Archivieren/Löschen
- inbox und handover haben Standard-TTL (in .tropen/docs.yaml). Nach Ablauf setzt Agent status archived und verschiebt nach docs/_archive/<type>/... oder löscht, falls in registry.policies.delete_on_archive: true gesetzt.
- status (z. B. Weeklies) werden nach 90 Tagen archived (Konfiguration).
- deprecated bleibt im Originalpfad (keine Moves), damit Links nicht brechen; optionaler Kopie ins _archive via Agent-Policy.

Wie „Datei XY-v2.md“ verhindert wird
- Harte Regel: create/update-Operationen prüfen doc.yaml.registry auf kollidierende title/type/slug; Dateinamen mit „v\d“ oder „-v\d“ sind verboten. Bei Verstoß: Operation abbrechen, Fix-Vorschlag zurückgeben.

### Verbindlichkeits-Stufen
Pflicht (Bug, wenn Agent abweicht)
- .tropen/docs.yaml existiert und ist Quelle für Regeln + Registry.
- Jede Doku-Datei hat gültige Frontmatter gemäß obigem Schema.
- Nur die erlaubten Verzeichnisse unter docs/ (keine zusätzlichen).
- Keine Versionssuffixe im Dateinamen; Slug-Regel strikt.
- Singleton-Typen haben exakt ein active-Dokument (roadmap/main.md, strategy/main.md).
- Neue Doku wird in Registry und 00-index verlinkt.

Empfehlung (Hinweis bei Abweichung)
- review_cycle_days gesetzt für active.
- owner gepflegt.
- links mindestens zur nächsten fachlich angrenzenden Quelle.
- ADRs referenzieren Code-Commit/PR.

Freistil
- Interne Gliederung innerhalb des Dokuments.
- Umfang/Erzählstil, solange Kernfelder gepflegt sind.

### Drift-Schutz-Mechaniken
- Maschinelle Registry (.tropen/docs.yaml) als Single Source of Truth, die der Agent vor jeder Doku-Operation liest und nach jeder ändert. Sie enthält: erlaubte Typen, Policies (TTL, singleton), und alle Einträge (id, path, status).
- Pflicht-Frontmatter + Linter-Regeln: Kein Dokument ohne Frontmatter; Status-Feld steuert Lifecycle; next_review und expires_at treiben Wartung.
- Ein einziges, agentgepflegtes 00-index.md, das alle kanonischen Links enthält. Orphans sind damit klar erkennbar.
- Inbox mit Verfallsdatum: Kurzlebiges muss entweder in langlebige Dokumente konsolidiert werden (supersedes) oder wird automatisch archiviert/entfernt.
- Templates pro Typ (in .tropen/templates) erzwingen Mindestinhalte (z. B. „Context/Decision/Consequences“ für ADR).

### Tool-Wechsel-Anforderung
- Neue Tools müssen ohne Plugin nur Markdown + YAML + einfache Pfade verarbeiten können.
- Die Onboarding-Regel ist sichtbar im Root (DOCS-CONVENTION.md) und maschinenlesbar in .tropen/docs.yaml; beides muss im Default-Context der Tools liegen.
- Keine Abhängigkeit von Git-Hooks/Actions zur Korrektheit (dürfen ergänzen, sind aber nicht Grundlage).
- Keine Symlinks, keine proprietären Dateiformate, keine Code-Generator-Voraussetzungen.

### Wie der Agent die Konvention befolgt
- Normativer Speicherort:
  - .tropen/docs.yaml (Maschinen-Protokoll + Policies + Registry)
  - DOCS-CONVENTION.md (Kurzregeln für Menschen/Agenten)
  - docs/00-index.md (nur Ausgabe; nie Quelle)
- Jeder Agent-Task für Doku startet mit: „Lies .tropen/docs.yaml und DOCS-CONVENTION.md. Wenn sie fehlen, lege sie mit Default-Templates an.“ 
- In .tropen/docs.yaml steht zusätzlich ein kurzes „agent_policy“-Snippet mit JSON-Checkliste (create/update/archive steps), das die Tools 1:1 be

---

## Gemini 2.5 Pro

# Doku-Konvention K0.6 — GPT-4o

## Kern-Position (5–7 Sätze)
Meine Grundidee ist **Struktur durch Metadaten und einen einzigen Einstiegspunkt**. Anstatt den Vibe-Coder oder den AI-Agenten mit einer komplexen Verzeichnis-Hierarchie zu belasten, erzwingen wir eine minimale, aber rigide Struktur *innerhalb* jeder Doku-Datei mittels Frontmatter. Ein zentraler, maschinenlesbarer Index (`INDEX.md`) dient als das einzige "Inhaltsverzeichnis" des Repos, das der Agent *immer* zuerst konsultieren muss. Diese Wette geht davon aus, dass es einfacher ist, einem Agenten beizubringen, eine einzelne Datei zu lesen und Metadaten zu respektieren, als ihm ein komplexes mentales Modell des gesamten Repo-Zustands beizubringen. Die Konvention bekämpft Wildwuchs nicht durch Verbote, sondern indem sie einen klaren, unmissverständlichen Pfad für das Anlegen und Aktualisieren von Wissen vorgibt. Es ist ein System, das auf Compliance durch Einfachheit setzt, nicht auf Disziplin durch Komplexität.

## Konvention (für eigene Doku-Disziplin)

### Architektur-Entscheidung
Meine Konvention ist **Tool-agnostisch mit einem gemeinsamen Kern**. Sie basiert auf Markdown-Dateien und Frontmatter, einem De-facto-Standard, den jedes fähige AI-Tool parsen kann. Ich habe Tools wie Cursor (mit seiner Repo-weiten Kenntnis), Aider (im Terminal) und die textbasierte Interaktion mit Modellen wie Claude im Hinterkopf. Die Konvention braucht keine Adapter, weil sie auf der fundamentalsten Ebene operiert: Textdateien in einem Verzeichnis. Die Verantwortung, dem Agenten die Existenz und Wichtigkeit der Konvention mitzuteilen, liegt beim User (via Custom Instructions oder Start-Prompt). Dieser Ansatz stellt maximale Portabilität sicher, wenn der Vibe-Coder das Tool wechselt – die Doku-Struktur im Repo bleibt identisch und funktional.

### Verzeichnis-Struktur
Die Struktur ist absichtlich flach und typ-orientiert, um die kognitive Last zu minimieren.

- **`/docs`**: Das einzige Top-Level-Verzeichnis für alle Doku-Inhalte. Keine `documents/`, `notes/` oder ähnliches.
    - **`/docs/INDEX.md`**: Die zentrale Index-Datei. Die einzige Quelle der Wahrheit, welche Dokumente existieren und was ihr Status ist. Dies ist eine maschinenlesbare Tabelle.
    - **`/docs/CONVENTION.md`**: Diese Konvention selbst, als Referenz für Mensch und Maschine.
    - **`/docs/_assets/`**: Bilder, PDFs und andere Binärdateien, die in Doku-Dateien verlinkt werden.
    - **`/docs/log/`**: Für "Wegwerf"-Doku wie Meeting-Notizen oder tägliche Status-Updates. Diese werden nicht im `INDEX.md` geführt und können nach 30 Tagen gelöscht werden. Es ist das absichtliche Ventil für Chaos.
    - **`/docs/core/`**: Alle langlebigen, wichtigen Dokumente.
        - Dateinamen-Konvention: `YYYY-MM-DD-[typ]-[kurz-titel].md`
        - Beispiel: `2024-05-20-adr-authentication-jwt.md`, `2024-05-21-strategy-q3-roadmap.md`
        - **Typen-Präfixe:** `roadmap`, `strategy`, `adr`, `concept`, `handover`, `decision`

### Lebenszyklus pro Datei
Der Lebenszyklus wird über Metadaten (YAML-Frontmatter) am Anfang jeder Markdown-Datei in `/docs/core/` gesteuert.

**1. Anlegen (Creation):**
- Der User promptet den Agenten: "Erstelle ein Konzept für das neue Onboarding".
- **Agenten-Pflicht:**
    1. Lese `/docs/INDEX.md`, um zu prüfen, ob bereits ein aktives Konzept existiert.
    2. Wenn nein, erstelle eine neue Datei: `/docs/core/2024-05-23-concept-new-onboarding.md`.
    3. Füge den Frontmatter-Block mit `status: draft` hinzu.
    4. Füge einen neuen Eintrag in `/docs/INDEX.md` hinzu.

**2. Aktualisieren (Update):**
- Der User promptet: "Überarbeite die Q3-Roadmap".
- **Agenten-Pflicht:**
    1. Lese `/docs/INDEX.md`, finde den Eintrag der aktiven Roadmap.
    2. Öffne die verlinkte Datei (z.B. `2024-05-21-strategy-q3-roadmap.md`).
    3. Modifiziere den Inhalt.
    4. **Wichtig:** Aktualisiere das `last_updated` Datum im Frontmatter. **Erstelle keine neue Datei.**

**3. Archivieren (Archival):**
- Wenn ein Dokument veraltet ist (z.B. ein ADR wird durch ein neueres ersetzt), wird sein `status` im Frontmatter auf `archived` oder `deprecated` gesetzt.
- Die Datei wird **nicht** gelöscht oder verschoben. Ihr Status im `INDEX.md` wird ebenfalls aktualisiert. Dies erhält die Historie, verhindert aber, dass der Agent veraltete Infos nutzt.

**Frontmatter-Struktur (Beispiel):**
```yaml
---
id: 2024-05-23-concept-new-onboarding # Eindeutig, aus Dateinamen generiert
title: Konzept für neues User Onboarding
status: draft # draft | active | archived | deprecated
created_at: 2024-05-23
last_updated: 2024-05-23
owner: alice
replaces: [] # Optional: ID des Dokuments, das dieses ersetzt
---

# Inhalt des Dokuments...
```

### Verbindlichkeits-Stufen
- **Pflicht (MUSS):**
    - Jede Datei in `/docs/core/` MUSS einen Frontmatter-Block mit `id`, `title`, `status`, `created_at`, `last_updated` haben.
    - Jede Datei in `/docs/core/` MUSS im `/docs/INDEX.md` eingetragen sein.
    - Es darf nur ein Dokument mit dem Typ `roadmap` und dem Status `active` geben.
    - Ein Agent darf NIEMALS eine Datei mit `-v2`, `-neu` oder `_copy` im Namen erstellen. Er muss die bestehende Datei aktualisieren.

- **Empfehlung (SOLLTE):**
    - Die Dateinamen-Konvention `YYYY-MM-DD-[typ]-[kurz-titel].md` sollte befolgt werden.
    - Dokumente sollten sich gegenseitig über ihre `id` verlinken.
    - Der `/docs/log/` Ordner sollte für transiente Notizen genutzt werden, um `/docs/core/` sauber zu halten.

- **Freistil (KANN):**
    - Zusätzliche Felder im Frontmatter (z.B. `tags`, `reviewers`).
    - Die genaue Struktur innerhalb der Markdown-Dateien.

### Drift-Schutz-Mechaniken
1.  **Zentraler Index (`/docs/INDEX.md`):** Dient als "allow-list". Jede Doku, die nicht hier drinsteht, ist per Definition "verwaist". Der Agent wird instruiert, nur Dokumente aus diesem Index als "Source of Truth" zu betrachten.
2.  **Status-Feld im Frontmatter:** Die explizite Angabe `status: active` oder `status: archived` verhindert Mehrdeutigkeit. Ein Skript (oder Tropen OS) kann leicht alle aktiven Roadmaps finden und bei mehr als einer einen Fehler werfen.
3.  **Update-First-Policy:** Die Kern-Anweisung an den Agenten, bestehende Dokumente zu aktualisieren anstatt neue zu erstellen, ist der direkteste Schutz gegen `roadmap-v2.md`. Dies muss im System-Prompt des Agenten verankert sein.
4.  **Stale-Content-Check:** Ein automatisierter Check (z.B. via GitHub Action) kann periodisch alle `active` Dokumente durchgehen und eine Warnung ausgeben, wenn `last_updated` älter als z.B. 90 Tage ist.
5.  **ID-basierte Verlinkung:** Durch die Verwendung der stabilen `id` im Frontmatter bleiben Links auch dann erhalten, wenn eine Datei umbenannt wird (obwohl die Konvention das nicht vorsieht). `replaces: [id]` macht die Historie explizit.

### Tool-Wechsel-Anforderung
Wenn ein User von Tool A zu Tool B wechselt, entstehen folgende Anforderungen an die Konvention und den User:
1.  **Kontext-Portabilität:** Der User muss sicherstellen, dass das neue Tool den Inhalt von `/docs/CONVENTION.md` und `/docs/INDEX.md

---

## Grok 4

# Doku-Konvention K0.6 — Claude-3.5

## Kern-Position (5–7 Sätze)
Die Kernidee ist eine tool-agnostische, strikt zentralisierte Doku-Struktur, die auf einer einzigen `docs/`-Verzeichnis basiert und durch YAML-Metadaten in jeder Datei Lebenszyklen erzwingt – das verhindert Wildwuchs, indem es Duplikate eliminiert und Aktualität automatisiert. Ich wette darauf, dass AI-Agenten Konventionen nur befolgen, wenn sie maschinenlesbar und zentral referenziert sind, daher muss jede Datei einen Header mit Status, Verfallsdatum und Links haben, und eine `index.md` dient als einziger Einstiegspunkt. Das System ist für Solo-Founder optimiert, die keine Zeit für manuelle Pflege haben: Es priorisiert Automatisierung über Flexibilität, um Drift in 6–12 Monaten zu stoppen, ohne dass der User zum Bibliothekar wird. Tool-Wechsel werden als Risiko benannt, aber nicht gelöst – die Konvention ist portabel, der User muss sie selbst in neue Tools übertragen. Ich habe starke Position: Dezentralisierte Strukturen scheitern immer bei AI-gestütztem Coding, weil Agenten Kontext verlieren; zentrale Indizierung ist Pflicht, sonst eskaliert der Wildwuchs exponentiell. Unsicherheit besteht bei extrem volatilen Projekten mit >4 parallelen Repos – dort könnte die Konvention überfordern, aber ich halte sie für machbar. Insgesamt setzt das auf Disziplin durch Design, nicht durch Willenskraft.

## Konvention (für eigene Doku-Disziplin)

### Architektur-Entscheidung
Die Konvention ist tool-agnostisch und basiert auf einer gemeinsamen Kernstruktur, die der User selbst in jedes Tool spiegelt – keine Adapter, da das Komplexität erhöht und bei Wechseln bricht. Ich berücksichtige Cursor, Claude Code, Lovable und Bolt, da diese die gängigsten sind; andere (wie Replit) passen sich an, wenn der User die Struktur manuell initialisiert. Begründung: Einheitliche Strukturen scheitern bei Tool-Wechseln, Adapter wären wartungsintensiv für Kleinteams; agnostisch hält es einfach und portabel, zwingt aber den User zur Disziplin – das ist akzeptabel, da AI-Agenten Dateisysteme direkt manipulieren können.

### Verzeichnis-Struktur
- Einziger Root-Ordner: `docs/` (keine Parallelen wie `notes/` oder `documents/` erlaubt).
- Unterordner: `roadmaps/`, `strategies/`, `adrs/`, `concepts/`, `handovers/`, `reports/` (für Status-Reports und Sparring-Outputs).
- Datei-Typen: Nur Markdown (.md), YAML für Konfig-Dateien (z.B. index.yaml, falls benötigt).
- Datei-Namen-Konventionen: Kategorie + Datum + Slug, z.B. `roadmap-2024-10-01-initial.md` (ISO-Datum, kei­ne Versions wie v2); für ADRs: `adr-2024-10-01-auth-system.md`; Konzepte: `concept-2024-10-01-user-onboarding.md`. Keine Groß-/Kleinschreibung-Mischung, alles lowercase mit Bindestrichen.

### Lebenszyklus pro Datei
Jede Datei startet mit einem YAML-Header: `status: draft/active/archived`, `created: YYYY-MM-DD`, `updated: YYYY-MM-DD`, `expires: YYYY-MM-DD` (optional, default 90 Tage), `links: [array of related file paths]`. Neue Datei: Agent legt sie an, setzt `status: draft` und verlinkt in `docs/index.md`. Aktualisierung: Ändere Inhalt, update `updated`-Feld, reset `expires` bei Bedarf; nie Duplikate erzeugen – stattdessen bestehende Datei editieren. Archivierung: Setze `status: archived`, verschiebe in `docs/archived/` (Unterordner), oder lösche bei Irrelevanz. Verhindert "XY-v2.md": Pflicht, bestehende Datei zu suchen und zu editieren; Duplikate sind verboten, Agent muss prüfen.

### Verbindlichkeits-Stufen
Pflicht (Agent-Verstoß = Bug): YAML-Header in jeder Datei, Verzeichnis-Struktur einhalten, keine Duplikate anlegen, jede Datei in `index.md` verlinken. Empfehlung (Agent-Verstoß = Hinweis): Inhaltsqualität (z.B. klare Sprache), Verfallsdatum setzen für Roadmaps/Strategies. Freistil: Spezifische Inhalte innerhalb der Datei (z.B. kreative Notizen), solange Header und Struktur passen – hier darf der Agent experimentieren.

### Drift-Schutz-Mechaniken
1. **Verfallsdaten-Pflicht**: Jede Datei mit `expires` wird nach Ablauf automatisch auf `status: archived` gesetzt (Agent prüft beim Zugriff); verhindert veraltete Inhalte, die Wildwuchs fördern. 2. **Zentrale Index-Datei**: `docs/index.md` listet alle aktiven Dateien mit Status und Links; Agent muss sie vor jeder Doku-Änderung aktualisieren – das erzwingt Konsolidierung. 3. **Duplikat-Scan-Regel**: Beim Anlegen neuer Dateien muss Agent das Repo auf ähnliche Namen/Inhalte scannen und mergen, statt neu zu erstellen; reduziert Parallelen. 4. **Status-Update-Trigger**: Bei jedem Projekt-Update (z.B. Pivot) fordert Agent eine Review aller Dateien mit `status: active` – verhindert Verwaiste. 5. **Archivierungs-Automatismus**: Dateien ohne Update >30 Tage werden vorgeschlagen zum Archivieren; hält das Repo schlank.

### Tool-Wechsel-Anforderung
Die Konvention muss berücksichtigen, dass bei Wechsel von Tool A (z.B. Cursor) zu Tool B (z.B. Lovable) der User die `docs/`-Struktur manuell kopiert oder exportiert – Anforderung: Portabilität durch standardisierte Dateiformate (Markdown/YAML), keine Tool-spezifischen Features. Entstehende Anforderungen: Dokumentation der Konvention muss exportierbar sein (z.B. als Git-Repo-Commit); Agent in neuem Tool muss explizit auf `docs/convention.md` hingewiesen werden; Risiko von Inkonsistenzen bei Wechsel, daher Pflicht für User, eine "Wechsel-Checklist" zu folgen (z.B. Index validieren).

### Wie der Agent die Konvention befolgt
Die Konvention steht in `docs/convention.md` (Markdown mit YAML-Beispielen), referenziert in der Repo-README.md und in jeder Prompt-Vorlage für den Agent. Format: Strukturierte Markdown mit Abschnitten wie oben; Verlinkung: In `docs/index.md` als erster Eintrag. Agent liest sie verlässlich, indem Prompts immer "Folge docs/convention.md" enthalten – das ist maschinenlesbar und zwingt Respekt.

## Produkt-Feature-Skizze (für Tropen OS Achse 9)

### Was Tropen scannen würde
Tropen würde scannen und Findings melden wie: 1. Mehrere Roadmaps ohne klare Status (z.B. roadmap.md und roadmap-v2.md parallel). 2. Datei ohne YAML-Header (fehlender Status/Expires). 3. Verwaiste Datei (nicht in index.md verlinkt). 4. Überholte Datei (expires abgelaufen, aber status:active). 5. Duplizierte Verzeichnisse (z.B. docs/ und notes/). 6. ADR ohne Links zu betroffenen Code-Dateien. 7. Handover-Doku älter als 30 Tage ohne Update. 8. Konzept-Doku ohne Verlinkung in Roadmap. 9. Inkonsistente Dateinamen (z.B. ohne Datum-Slug). 10. Archivierte Datei nicht in archived/-Ordner verschoben.

### Severity-Logik
Critical (blockiert Release): Duplikate aktiver Roadmaps/Strategies (risikiert Fehlentscheidungen), fehlende YAML-Headers in >20% der Dateien (struktureller Kollaps). Should (sollte fixen, aber nicht blockierend): Verwaiste Dateien, abgelaufene Expires ohne Archivierung (milder Drift). Info (nur Hinweis): Inkonsistente Namen, fehlende Links in ADRs (ästhetisch, kein sofortiges Risiko).

### Fix-Prompt-Beispiele
Einfacher: "Doppelte Roadmap erkannt in docs/roadmaps/ (roadmap.md und roadmap-2024.md). Merge sie in eine Datei: Editiere die neueste, setze status:active, archiviere die alte, update index.md." Komplexer: "Konzept-Doku verwaist (concept-2024-10-01-user-onboarding.md nicht in index.md verlinkt, kein Anker im Repo). Füge Link in index.md hinzu, prüfe auf Duplikate, setze expires auf +90 Tage, und verlinke sie in der relevanten Roadmap-Datei."

### Abgrenzung
Tropen sollte nicht automatische Fixes ausführen (z.B. Dateien löschen/mergen) – das wäre Bevormundung und könnte Datenverlust verursachen; Grenze bei Scans und Prompt-Vorschlägen. Keine Inhaltsbewertung (z.B. "schlechte Strategie") – nur strukturelle Hygiene. Nicht in Code-Doku eingreifen (z.B. inline-Kommentare), da das Developer-Experience dominiert; Fokus rein auf dedizierte Doku-Dateien.

## Drei Risiken / Schwächen deines Vorschlags
1. Übermäßige Rigidität: Die strikte Struktur könnte kreative Vibe-Coder behindern, die spontan Notizen brauchen – in volatilen Phasen bricht das, wenn Agenten "Freistil" missbrauchen. 2. Abhängigkeit vom User: Tool-Wechsel erfordern manuelle Portierung; bei 2–4 parallelen Projekten vergisst der Solo-Founder das, und Wildwuchs kehrt zurück. 3. Skalierungsgrenze: Bei >50 Doku-Dateien wird index.md unübersichtlich; nach 12 Monaten könnte der Archiv-Ordner aufblähen, ohne dass Agenten effizient scannen.

## Eine alternative Konvention, die du *nicht* gewählt hast
Alternative: Eine dezentrale, tag-basierte Struktur ohne feste Verzeichnisse, stattdessen globale Suche mit Tags in Datei-Headers (z.B. #roadmap #active) und ein AI-gestützter Doku-Manager-Skript, das alles dynamisch indexiert. Nicht gewählt, weil das bei AI-Agenten scheitert – sie verlieren Kontext ohne feste Pfade, und Tool-Wechsel machen Tags inkonsistent; es fördert eher Wildwuchs durch fehlende Erzwingung.

---

## Judge-Synthese

# K0.6 Komitee-Synthese — Opus-Judge

## Konzept-Familien

### Familie A: "Index-Gating" (INDEX.md als Pflicht-Eingang)
**Kern-Idee:** Eine menschenlesbare Markdown-Index-Datei ist die Single Source of Truth. Der Agent liest sie als erste Aktion und schreibt sie als letzte Aktion. Wildwuchs-Verhinderung läuft über die Pflicht-Sequenz "Index lesen → Existenz prüfen → Update statt Neuanlage".

**Vertretene Modelle:** Claude Opus 4.7, Claude Sonnet 4.6, Gemini 2.5 Pro

**Stärken:**
- Niedrige Tool-Anforderungen (jedes Tool kann Markdown lesen)
- Menschenlesbar – User kann selbst auditieren ohne Tooling
- Wenig Oberfläche → höhere Befolgungswahrscheinlichkeit
- Übersteht Tool-Wechsel ohne Migrationsschritt

**Schwächen:**
- INDEX.md kann selbst driften (Datei existiert, aber Eintrag fehlt)
- Skalierungsgrenze: Bei >50 Dateien wird Index unübersichtlich
- Verlässt sich darauf, dass Agent die Pflicht-Sequenz tatsächlich befolgt – kein technischer Zwang

### Familie B: "Maschinenlesbare Registry" (YAML als Single Source of Truth)
**Kern-Idee:** Eine strukturierte YAML/JSON-Datei (`.tropen/docs.yaml`) hält Policies, Typen-Definitionen und alle Einträge. Index.md ist nur abgeleitete Ausgabe. Singleton-Typen werden hart über Registry erzwungen.

**Vertretene Modelle:** GPT-5 (allein in Reinform)

**Stärken:**
- Maschinell validierbar (Linter, Pre-Commit, CI)
- Singleton-Garantie technisch durchsetzbar
- Klare Trennung Quelle (yaml) / Ausgabe (md)
- Policies sind versioniert und auditierbar

**Schwächen:**
- Höhere kognitive Last für Solo-Founder
- YAML-Drift gegenüber tatsächlichem Dateisystem möglich
- Tool-Anforderungen höher (muss YAML zuverlässig pflegen)
- "Zwei Quellen der Wahrheit" wenn Index.md aus Versehen direkt editiert wird

### Familie C: "Frontmatter-First" (Metadaten in jeder Datei)
**Kern-Idee:** Die Wahrheit lebt im YAML-Frontmatter jeder Datei. Status, Verfallsdatum, Supersedes-Links machen jede Datei selbsterklärend. Index ist nachgelagert.

**Vertretene Modelle:** Grok 4 (am stärksten), mit starken Anteilen bei Opus 4.7 und Sonnet 4.6

**Stärken:**
- Jede Datei trägt eigene Metadaten – kein zentraler Single Point of Failure
- Robust gegen Tool-Wechsel (Daten in Datei)
- Verfallsdaten als aktiver Drift-Schutz

**Schwächen:**
- Ohne Index-Aggregation schwer zu überblicken
- Frontmatter ohne Validierung kann inkonsistent werden
- Allein nicht ausreichend gegen Duplikate

**Beobachtung:** Familien A und C sind in vier von fünf Vorschlägen kombiniert – sie sind komplementär, nicht alternativ. Echte "Reinform"-Vertreter gibt es nur für B (GPT-5).

---

## Querliegende Konvergenzen

Alle fünf Modelle sind sich einig in:

1. **Ein einziges Top-Level-Verzeichnis** (`docs/`) – keine Parallelstrukturen
2. **YAML-Frontmatter mit Status-Feld** (active/draft/archived/superseded oder Varianten)
3. **Verbot von Versions-Suffixen** (-v2, -new, -final) im Dateinamen
4. **Update statt Neuanlage** als Default-Verhalten des Agenten
5. **Ein zentraler Index** als Einstiegspunkt (egal ob INDEX.md oder docs.yaml)
6. **Tool-agnostischer Kern** (Markdown + YAML, keine proprietären Formate)
7. **ADRs als eigene Kategorie** mit unveränderlicher Nummerierung
8. **Archiv-Ordner statt Löschen**
9. **Supersedes/Replaces-Mechanik** für explizite Ablöse-Ketten
10. **Pflicht/Empfehlung/Freistil-Schichtung** der Verbindlichkeit

Das ist eine bemerkenswert robuste Basis. Die Konvergenz suggeriert: Diese 10 Punkte sind keine Designentscheidung mehr, sondern Stand der Technik.

---

## Querliegende Divergenzen

Echte Streitpunkte, bei denen das Tropen-Team entscheiden muss:

**D1: Index als Markdown oder YAML?**
- Markdown-Index (Opus, Sonnet 4.6, Gemini, Grok): menschenlesbar, niedrige Toolanforderung
- YAML-Registry (GPT-5): maschinell validierbar, Singleton-erzwingbar
- Hybrid (Sonnet 4.6 implizit): YAML als Quelle, MD als Spiegel

**D2: Verzeichnis-Granularität**
- Drei Ordner (Opus 4.7: `decisions/`, `active/`, `archive/`)
- Sechs+ Ordner pro Typ (Sonnet 4.6, GPT-5, Grok: `roadmap/`, `strategy/`, `adr/`, ...)
- Flach mit Typ-Präfix im Dateinamen (Gemini: alles in `core/`)

**D3: Dateinamen-Schema**
- Stabile Namen ohne Datum (Opus 4.7, Sonnet 4.6: `roadmap.md`, Versionierung via Git)
- Datum-Präfix bei manchen Typen (GPT-5: nur ADR/Status)
- Datum-Präfix immer (Gemini, Grok: `YYYY-MM-DD-typ-slug.md`)

**D4: Tool-Adapter ja/nein**
- Adapter mit Pointer-Dateien (Opus 4.7, Sonnet 4.6, GPT-5)
- Keine Adapter, manuell vom User (Gemini, Grok)

**D5: Verfallsdatum als Pflicht?**
- Pflicht für active (Opus 4.7: `review_by`)
- Empfehlung (Sonnet 4.6, GPT-5)
- Default 90 Tage (Grok)
- Nur für log/transient (Gemini)

**D6: Singleton-Typen erzwingen?**
- Hart per Registry (GPT-5)
- Weich per Konvention (Sonnet 4.6)
- Nicht thematisiert (Opus 4.7, Gemini, Grok)

---

## Empfehlung pro Schicht

### 1. Architektur-Entscheidung Tool-Umgang
**Empfehlung: Tool-agnostischer Kern + minimale Pointer-Adapter**

Begründung: Vier von fünf Modellen (außer Grok in Reinform) konvergieren auf "ein Kern, mehrere dünne Verweise". Opus 4.7 nennt den entscheidenden Punkt: `AGENTS.md` ist bereits De-facto-Standard, der von Codex/Aider/Cursor/Cline gelesen wird. Pointer-Dateien (`CLAUDE.md`, `.cursor/rules/main.mdc`) sind 3-Zeilen-Verweise auf den Kern. Lovable/Bolt sind als bekannte Schwäche zu benennen, nicht zu lösen.

### 2. Verzeichnis-Struktur
**Empfehlung: Flach, drei Funktionsordner + `archive/`**

```
docs/
  INDEX.md
  CONVENTIONS.md
  active/        # alle lebenden Dokumente, Singleton pro Thema
  decisions/     # nummerierte ADRs
  archive/YYYY-MM/
```

Begründung: Opus 4.7's "drei Verzeichnisse" ist die schlankste Variante mit der geringsten Wildwuchs-Oberfläche. Sonnet 4.6's und GPT-5's Typ-Ordner (`roadmap/`, `strategy/`, ...) erzeugen das Problem zurück, das sie lösen sollen: Wo gehört Datei X hin, wenn sie zwei Typen berührt? Funktions-Ordner (active/decisions/archive) sind eindeutig.

### 3. Lebenszyklus-Mechanik
**Empfehlung: Update-First-Policy + Frontmatter-Pflicht + Supersedes-Kette**

Drei Mechaniken kombiniert:
- Stabile Dateinamen ohne Versions-Suffix (`roadmap.md`, nicht `roadmap-v2.md`)
- Frontmatter mit `status`, `updated`, `supersedes`
- Bei Pivot: alte Datei → `archive/YYYY-MM/` mit `status: superseded`, neue Datei mit `supersedes:` referenziert

Begründung: Opus 4.7 und Sonnet 4.6 sind hier deckungsgleich und am rigorosesten. Versionierung läuft über Git, nicht über Dateinamen – das ist die einzige Mechanik, die ohne Tooling robust ist.

### 4. Verbindlichkeits-Stufen
**Pflicht (Agent-Bug bei Verstoß):**
- Frontmatter mit `status` und `updated` auf jeder Datei in `docs/active/` und `docs/decisions/`
- Eintrag in `INDEX.md` für jede Datei in `active/`
- Keine Datei-Suffixe `-v2`, `-new`, `-final`, `-copy`
- Existenz-Check vor Neuanlage

**Empfehlung:**
- `review_by`-Feld für active-Dateien
- ADR-Erstellung bei Entscheidungen >2 Wochen Tragweite
- 1 Bildschirmseite max. pro active-Datei

**Freistil:**
- Inhaltliche Struktur, Sprache, Stil
- README-Format
- Code-Kommentare

### 5. Drift-Schutz: Die drei wirksamsten Mechaniken
1. **INDEX.md als Pflicht-Eingang** (alle fünf Modelle): Agent liest Index zuerst, schreibt zuletzt. Kostet wenig, verhindert "ich wusste nicht, dass es schon existiert"-Wildwuchs.
2. **Supersedes-Kette mit atomarem Archivieren** (Opus 4.7, Sonnet 4.6): Neue Datei muss alte explizit ablösen, alte muss in selbem Schritt nach `archive/`. Strukturell ausgeschlossen, dass zwei "lebende" Versionen existieren.
3. **Verfallsdatum + Quartals-Audit-Prompt** (Opus 4.7, Sonnet 4.6): `review_by`-Feld plus vorgefertigter Audit-Prompt in `CONVENTIONS.md`. 30 Min Wartung pro Quartal.

Die maschinelle Registry (GPT-5) ist mächtiger, aber für 1–3-Personen-Setups overengineered.

### 6. Wie Bau-Agent die Konvention liest
**Pfad:** `AGENTS.md` im Repo-Root (De-facto-Standard 2025/26)
**Format:** Markdown, max. 200 Zeilen, mit Pflicht-Sequenz als ersten Block
**Tool-Adapter:** `CLAUDE.md` als Symlink (oder 3-Zeilen-Pointer), `.cursor/rules/main.mdc` mit Verweis
**README.md** verlinkt in zweiter Zeile auf `AGENTS.md`

---

## Tropen-Produkt-Feature: Was tragen die Vorschläge

**Automatisierbar (klare Severity, deterministisch):**
- Mehrere `status: active`-Dateien gleichen Themas (Levenshtein/Wortstamm)
- Datei ohne gültiges Frontmatter
- Verwaiste Datei (in `docs/`, nicht in `INDEX.md`)
- Parallele Doku-Verzeichnisse (`docs/`, `documents/`, `notes/`, `wiki/`)
- Datei-Suffixe `-v2`, `-new`, `-final`
- Abgelaufenes `review_by` bei `status: active`
- Inkonsistente Status-Werte (außerhalb erlaubter Liste)
- Supersedes-Link zeigt auf nicht-existente Datei

**Schwierig automatisierbar:**
- "Zwei Dateien mit ähnlichem Inhalt" (Inhaltsähnlichkeit ist subjektiv)
- "ADR ohne Code-Bezug" (Verlinkungsqualität)
- "Konzept-Doku ohne Roadmap-Verlinkung" (semantische Beziehung)

**Soll Tropen *nicht* tun (Konsens):**
- Inhaltliche Bewertung ("schlechte Strategie")
- Automatische Datei-Löschung/Merge ohne User-Bestätigung
- Eingriff in Code-Inline-Doku

Grok hat den Severity-Schnitt am klarsten gezogen: Critical = strukturelle Duplikate aktiver Singletons; Should = verwaist/abgelaufen; Info = ästhetisch.

---

## Tool-Wechsel-Anforderung: Synthese

Vier Anforderungen kristallisieren sich heraus:

1. **Konvention liegt am Repo-Root, nicht im Tool-Config-Verzeichnis** (alle Modelle implizit). Repo überlebt Tool-Wechsel, Tool-Config nicht.
2. **Reines Markdown + YAML, keine proprietären Erweiterungen** (alle Modelle explizit). Notion/Obsidian-Features brechen beim Wechsel.
3. **Beim Tool-Wechsel: genau eine Aktion** – neuen Pointer-Adapter anlegen, der auf den Kern verweist (Sonnet 4.6 am klarsten).
4. **Cloud-Tools ohne Datei-Zugriff (Lovable, Bolt) sind explizit benannte Schwachstelle** (Opus 4.7, Sonnet 4.6) – Konvention muss als System-Prompt eingespeist werden, das ist Restrisiko.

**Was kein Modell löst:** Wie der User merkt, dass das neue Tool die Konvention *tatsächlich befolgt* und nicht stillschweigend ignoriert. Das ist ein offenes Problem, das eventuell Tropens Audit-Engine adressieren kann (Drift-Detection nach Tool-Wechsel als eigener Scan).

---

## Drei Trade-offs, die das Tropen-Team explizit treffen muss

**1. Markdown-Index vs. YAML-Registry (höchste Tragweite)**
Markdown ist niedrigschwellig und menschenlesbar, aber nicht maschinell validierbar. YAML ist mächtiger, aber kognitive Last für Solo-Founder. Empfehlung: Markdown-Index als Primary, YAML-Schema *innerhalb* Frontmatter (kombiniert Stärken). Tropen kann YAML-Registry als optionalen Power-User-Modus anbieten.

**2. Stabile Dateinamen vs. Datum-präfigierte Dateinamen**
Stabile Namen (`roadmap.md`) erzwingen Update-First, aber verlieren Sortierbarkeit. Datum-Präfix sortiert chronologisch, lädt aber zur Mehrfach-Anlage ein. Empfehlung: Stabile Namen für `active/`, Datum-Präfix nur für inhärent chronologische Typen (ADRs als Ausnahme: nummeriert; Status-Reports: Datum).

**3. Singleton-Erzwingung hart vs. weich**
Hart (Registry) garantiert keine Duplikate, ist aber Tooling-abhängig. Weich (Konvention + Audit) kann brechen, ist aber portabel. Empfehlung: Weich im Default, Tropen-Audit übernimmt Detection. Hart nur, wenn Tropen ohnehin im Stack.

---

## Was die Constraints konkret ausschließen

Unter 1–3 Personen, 6–12 Monate, m

---

## Sprint-Metadaten

| Modell                | In-Tok  | Out-Tok | Kosten     |
|-----------------------|---------|---------|------------|
| Claude Opus 4.7       |    3589 |    5000 | €0.3988 |
| Claude Sonnet 4.6     |    2633 |    5000 | €0.0771 |
| GPT-5                 |    1803 |    5000 | €0.2028 |
| Gemini 2.5 Pro        |    1912 |    4996 | €0.0487 |
| Grok 4                |    2677 |    3164 | €0.0516 |
| Judge (Opus)          |   24453 |    6000 | €0.7596 |
| **Gesamt**            |         |         | **€1.5386** |

**Judge:** Claude Opus 4.7 (claude-opus-4-7)
**Dauer:** 184s · **Erfolgreiche Reviewer:** 5/5

