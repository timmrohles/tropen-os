# ADR-023: Schnittstellen-Strategie zwischen Tropen OS und Bau-Tools

**Status:** Proposed
**Datum:** 2026-04-27
**Entscheider:** Timm Rotter
**Tags:** architecture · interfaces · cli · mcp · interoperability

---

## Context

Tropen OS positioniert sich nach der Neuausrichtung im April 2026 als **Begleitplattform** für Vibe-Coder, die mit externen Bau-Tools (Lovable, Bolt, Cursor, Claude Code u.a.) arbeiten. Die operative Brücke zwischen Tropen OS und diesen Bau-Tools ist der **veredelte Prompt** (siehe ADR-007).

Die heutige Übergabe-Praxis ist manuelles Kopieren: User klickt „Kopieren", wechselt das Tool, fügt ein, sendet ab. Das ist 2026 für eine Plattform, die sich als Workflow-Beschleuniger positioniert, nicht mehr zeitgemäß. Vibe-Coder erwarten reibungsarme Übergänge — sie bekommen sie in jedem anderen Tool, das sie täglich nutzen.

Gleichzeitig hat Tropen OS eine **strategische Position**, die nicht durch beliebige Integration verwässert werden darf:

- **Trennung Denken / Bauen.** Tropen OS ist die Schicht des Strukturierens. Externe Bau-Tools sind die Schicht des Bauens. Diese Grenze ist Produkt-Identität, nicht Implementierungsdetail.
- **Führung ohne Zwang.** Der User entscheidet, was an die IDE geht. Vollautomatik ohne Bestätigung widerspricht dem Prinzip.
- **Tool-Neutralität.** Tropen OS bevorzugt kein einzelnes Bau-Tool. Eine tiefe Lovable-Integration, die Claude-Code-User benachteiligt, wäre falsch.
- **Daten-Souveränität.** Schnittstellen, die Projektwissen unkontrolliert nach außen tragen, widersprechen der EU-Compliance-Position.

Die Frage dieses ADRs ist: **Wie gestalten wir die Schnittstellen so, dass Reibung sinkt, ohne diese strategischen Positionen aufzugeben?**

Im Markt etablieren sich 2026 mehrere Schnittstellen-Pattern parallel:

- **Deeplinks** — URL-Schemata wie `cursor://` oder `vscode://` öffnen Tools mit vorbefülltem Kontext
- **CLI-Tools** — Lokale Befehlszeilen-Werkzeuge (`gh`, `claude`, `cursor agent`) automatisieren Übergaben
- **MCP (Model Context Protocol)** — Anthropics Protokoll, das LLM-Anwendungen externe Wissensquellen oder Aktionen anbindet. Tropen OS könnte sowohl MCP-**Client** (konsumiert externe Server) als auch MCP-**Server** (wird von externen Clients konsumiert) sein.
- **APIs / Webhooks** — Klassische Integration für Repo-Events, Statusupdates

---

## Decision

Diese Entscheidung ist **als Strategie-Position dokumentiert, nicht als finale Implementierungs-Festlegung**. Konkrete Tool-Wahl, CLI-Befehlssatz und MCP-Implementierung folgen in eigenen ADRs oder Specs.

### Strategische Position

**Die Schnittstellen-Strategie folgt vier Leitsätzen:**

1. **Push richtungsfrei, Pull selektiv.** Der Weg *aus Tropen OS in Bau-Tools* (Push) bleibt User-kontrolliert und Tool-neutral. Der Weg *aus externen Quellen in Tropen OS* (Pull) wird selektiv geöffnet, wenn er das Projektwissen anreichert.
2. **CLI-First für den Push.** Eine lokale Befehlszeile (`tropen ...`) ist der primäre Übergabe-Pfad zu Bau-Tools. Sie ist Tool-agnostisch, transparent für den User, und respektiert die Trennung Denken/Bauen.
3. **Deeplinks als Web/Mobile-Fallback.** Wo CLI nicht verfügbar ist (Browser-Nutzung, Mobile), öffnen Deeplinks die Bau-Tools mit vorbefülltem Prompt.
4. **Pull-MCP als Tropen-OS-als-Client.** Tropen OS konsumiert externe MCP-Server (GitHub, Supabase, Linear u.a.) als Wissensquellen. Das verletzt die Trennung Denken/Bauen nicht, da Tropen OS die kontrollierende Instanz bleibt.

### Bewusst offen gelassen: Push-MCP (Tropen OS als MCP-Server)

Die Frage, ob Tropen OS auch ein **MCP-Server** sein soll — also von externen Clients (Claude Desktop, Cursor mit MCP-Support, etc.) konsumiert werden kann — ist in diesem ADR **nicht entschieden**.

**Für Push-MCP spricht:**
- Wachsender Standard 2026 — viele Vibe-Coder erwarten MCP-Integration
- Sehr niedrige Reibung — Tropen OS wäre permanent im Bau-Tool präsent
- Marketing-Effekt: „Tropen OS hat einen MCP-Server" ist eine erkennbare Position

**Gegen Push-MCP spricht:**
- Push-MCP würde bedeuten, dass externe Clients (z.B. ein User in Cursor) direkt auf Tropen-OS-Projektwissen zugreifen, ohne dass Tropen OS die User-Interaktion kontrolliert
- Die Trennung Denken/Bauen verschwimmt: Wenn die IDE Projektwissen direkt zieht, findet das „Denken" zunehmend in der IDE statt
- *Führung ohne Zwang* wird schwerer durchzusetzen, wenn der User in einem fremden Kontext mit Tropen-OS-Wissen arbeitet
- Der Veredler verliert an Bedeutung, wenn das Projektwissen ohnehin in der IDE verfügbar ist

**Diese Frage wird vertagt** und soll separat beantwortet werden, nachdem:
1. Validierungs-Gespräche mit Vibe-Codern stattgefunden haben
2. Push-Erfahrungen mit CLI/Deeplinks (Phase A & B) gesammelt sind
3. Der MCP-Standard 2026/2027 weiter ausgereift ist

### Reihenfolge der Umsetzung (vorläufig)

```
Phase A — Deeplinks für die Top-Bau-Tools (Web/Mobile)
Phase B — CLI als Hauptpfad (Desktop)
Phase C — Pull-MCP — Tropen OS konsumiert externe Quellen
Phase D — Eigene API/Webhooks für Repo-Events und Integrationen
Phase ? — Push-MCP (offen, siehe oben)
```

Die konkreten Tools, Schemata und Befehlssätze pro Phase werden in nachgelagerten ADRs oder Specs entschieden.

### Was *nicht* gebaut wird (zumindest vorerst)

- **Browser-Extensions in Bau-Tools** (Eingriff zu tief, Wartungslast je Tool-Update)
- **Direkte API-Integrationen pro Bau-Tool** (jedes Tool hat eigene API, Wartungsalbtraum, Tool-Neutralität verletzt)
- **Auto-Send ohne User-Bestätigung** (verletzt *Führung ohne Zwang*)

---

## Consequences

### Positive Konsequenzen

- **Reibung sinkt deutlich.** CLI und Deeplinks reduzieren die Übergabe von 4–5 Klicks auf 1.
- **Trennung Denken/Bauen bleibt sichtbar.** Der User wechselt aktiv aus Tropen OS heraus — das ist gewollt.
- **Tool-Neutralität bleibt erhalten.** CLI funktioniert tool-agnostisch; Deeplinks decken die wichtigsten Tools ab, ohne eines zu bevorzugen.
- **Pull-MCP erweitert das Projektwissen.** GitHub-Repo-Status, Supabase-Migrationen, Linear-Tickets als Live-Quellen direkt in Tropen OS — ohne dass Tropen-Daten nach außen fließen.
- **Strategische Offenheit.** Push-MCP wird nicht ausgeschlossen, nur vertagt — anpassbar an Marktentwicklung.
- **Konsistent mit bestehender Roadmap.** Plan N (Kontext-Layer) adressiert genau diese Schnittstellen-Frage und kann nun konkretisiert werden.

### Negative Konsequenzen

- **CLI-Bau ist Aufwand.** Eigenes CLI-Tool mit Authentifizierung, Konfiguration, Distribution (Homebrew, npm, etc.). Nicht trivial.
- **CLI funktioniert nur lokal.** User auf Tablets, in Web-Only-Setups oder hinter Corporate-Firewalls bleiben auf Deeplinks angewiesen.
- **Pull-MCP erfordert Hetzner-Migration.** MCP-Client-Logik braucht Backend-Hosting mit langlebigen Verbindungen — auf Vercel Serverless schwierig. (Memory: Hetzner-Migration ohnehin geplant post-MVP.)
- **Push-MCP-Vertagung kann als Lücke wahrgenommen werden.** Wettbewerber, die Push-MCP haben, könnten als „integrierter" wahrgenommen werden.
- **Mehr-Pfad-Komplexität.** CLI + Deeplinks + Pull-MCP + API ist mehr als nur „Copy-Paste". Doku, Support und Tests werden umfangreicher.

### Neutrale Konsequenzen

- **Veredler-Architektur (ADR-007) bleibt unverändert.** Der Veredler produziert seinen Output formatfrei; Schnittstellen sind nachgelagert.
- **Markdown-Format (ADR-008) wird zum Vorteil.** Markdown lässt sich gut in Deeplink-URLs encodieren und über CLI-Stdout transportieren.

### Risiken

| Risiko | Wahrscheinlichkeit | Auswirkung | Mitigation |
|---|---|---|---|
| CLI-Distribution (npm, Homebrew, etc.) wird verpasst | Mittel | Hoch | Phase B beginnt mit npm-Paket; weitere Distributionswege später |
| Deeplink-Schemata ändern sich seitens der Bau-Tools | Mittel | Mittel | Profile als versionierbare Markdown-Dateien (siehe ADR-008), bei Bruch zentral aktualisierbar |
| Pull-MCP-Server (GitHub, etc.) sind unzuverlässig | Niedrig | Mittel | Caching-Schicht in Tropen OS; Pull-MCP-Outputs als Quellen-Anker im Projektwissen, nicht als Echtzeit-Pflicht |
| User missverstehen die Trennung Denken/Bauen | Hoch | Niedrig | Klare Doku, Onboarding-Erklärung, konsistente UX |
| Push-MCP-Vertagung wird strategisch falsch | Mittel | Hoch | Validierung in 6 Monaten erneut prüfen; Marktentwicklung beobachten |

---

## Alternatives Considered

### Alternative 1: Status quo — manuelles Kopieren beibehalten

**Beschreibung:** Keine Schnittstellen-Investition; User kopiert Prompts wie heute.

**Verworfen weil:**
- Friktion ist 2026 nicht mehr akzeptabel
- Vibe-Coder wechseln zu Wettbewerbern mit besseren Übergaben
- Der Veredler-Mehrwert wird durch die Übergabe-Friktion verwässert

### Alternative 2: Tiefe Push-MCP-Integration als Hauptpfad

**Beschreibung:** Tropen OS wird primär als MCP-Server entwickelt; Bau-Tools konsumieren Projektwissen direkt.

**Verworfen weil:**
- Verletzt die Trennung Denken/Bauen, die Produkt-Identität ist
- *Führung ohne Zwang* wird schwer durchsetzbar
- Der Veredler verliert an Bedeutung
- Dennoch nicht ausgeschlossen — als spätere Option offen gehalten (siehe „Bewusst offen gelassen")

### Alternative 3: Browser-Extension für jedes Bau-Tool

**Beschreibung:** Tropen OS injiziert sich via Browser-Extension direkt in Lovable-, Bolt-, Cursor-Web-Versionen.

**Verworfen weil:**
- Wartungslast bei jedem Tool-Update
- Verletzt Tool-Neutralität in der Praxis (welche Tools werden zuerst unterstützt?)
- Distribution über Browser-Stores erhöht Reibung
- Sicherheitsbedenken bei Extension-Berechtigungen

### Alternative 4: Tropen OS als VS Code Extension

**Beschreibung:** Hauptpfad als VS Code Extension, die im Editor läuft.

**Verworfen weil:**
- Bevorzugt VS Code / Cursor gegenüber anderen Tools
- Tropen OS würde *in* die IDE wandern — Trennung Denken/Bauen verloren
- Schließt User aus, die nicht in VS-Code-basierten Tools arbeiten (Lovable, Bolt)

### Alternative 5: Komplette API-First-Architektur ohne CLI

**Beschreibung:** Tropen OS bietet nur eine REST-API; jede Integration baut darauf.

**Verworfen weil:**
- Hohe Reibung für End-User (API-Keys, Endpoints, eigene Skripte)
- Vibe-Coder sind nicht primär API-Nutzer
- CLI ist die richtige Abstraktionsebene für die Zielgruppe

---

## Implementation Notes

### Vorbedingungen

- **Hetzner-Migration** sollte vor Phase C (Pull-MCP) abgeschlossen sein. MCP-Client-Logik mit längeren Verbindungen passt nicht gut zu Vercel Serverless.
- **Veredler-Architektur (ADR-007)** muss stabil sein, bevor Schnittstellen darauf aufsetzen.
- **Markdown-Format (ADR-008)** muss stehen, weil CLI/Deeplinks Markdown transportieren.

### Offene Fragen für nachgelagerte ADRs/Specs

**Phase A — Deeplinks**
- Welche Bau-Tools zuerst? Kandidaten: Cursor, Claude Code, Lovable, Bolt, GitHub-Issue
- URL-Schema-Recherche pro Tool
- Wie groß darf ein Prompt in einer URL sein? (Limits)
- Fallback-Strategie bei zu langen Prompts

**Phase B — CLI**
- Sprache und Distributionsweg (Node/npm? Go/Homebrew? Python/pipx?)
- Authentifizierung gegenüber Tropen OS (OAuth Device Flow? API-Key? Magic Link?)
- Befehlssatz: `tropen send <prompt-id>`, `tropen pull-context`, `tropen status`?
- Konfigurationsformat (`~/.tropenrc`?)

**Phase C — Pull-MCP**
- Welche externen Server zuerst? GitHub, Supabase, Linear?
- Caching-Strategie
- User-Authentifizierung gegenüber externen Quellen
- Wie werden externe Daten ins Projektwissen integriert? (Quellen-Anker als Markdown-Einträge mit `type: source`?)

**Phase D — API/Webhooks**
- Webhook-Empfänger für Repo-Events
- Eigene API für Power-User
- Rate-Limiting, Authentifizierung

**Push-MCP — offen**
- Re-Evaluation nach 6 Monaten oder bei signifikanter Marktentwicklung
- Kriterien für Re-Evaluation: User-Bedarf, Marktdruck, Stand des MCP-Standards

### Validierung vor Phase A

Vor Beginn der Implementierung sollten **drei Vibe-Coder-Gespräche** geführt werden:

- Wie übergeben sie heute Prompts an Bau-Tools?
- Welche Reibung empfinden sie als störend?
- Welche Übergabe-Erwartungen haben sie?
- Würde ein CLI-Tool akzeptiert oder als Hürde empfunden?

Die Ergebnisse fließen in die Phase-A/B-Entscheidung ein.

---

## Related ADRs

- **ADR-006** — Sechs-Schichten-Wissens-Architektur (Schnittstellen sind die Außenkanten der Schichten)
- **ADR-007** — Prompt-Veredler-Architektur (Veredler produziert das, was über Schnittstellen geht)
- **ADR-008** — Markdown-Format mit Obsidian-Brücke (Markdown ist das Transportformat)

## References

- Strategie-Session 2026-04-27 (Schnittstellen-Diskussion)
- Memory: „Vercel hosting limitation acknowledged but deferred — Migration to Hetzner + Coolify is planned post-MVP"
- Memory: „Plan N (Kontext-Layer): Personal context profiles, structured onboarding interview, tiered RAG loading, context agent"
- `manifesto.md` — Principle 4 (Dependencies must be Replaceable)
- Tropen-OS-Vision Teil 5 (Multi-Agenten-Architektur)
- MCP-Standard (Model Context Protocol, Anthropic) — wird beobachtet, Stand 2026-04
