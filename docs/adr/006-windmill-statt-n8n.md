# ADR-006: Windmill statt n8n als Workflow-Execution-Engine

**Status:** Accepted
**Datum:** 2026-03-26
**Kontext:** Workflow-Automatisierung / Externe Integrationen

## Entscheidung

Tropen OS verwendet Windmill Community Edition (self-hosted) statt n8n
als Execution Engine fuer Toro-generierte Workflows.

## Grund

Toro ist der einzige Workflow-Builder — der User sieht keinen Editor.
Das verschiebt die Anforderung von "guter visueller Editor" zu
"was kann ein LLM zuverlaessiger generieren".

### Windmill gewinnt bei LLM-Generierung

- **n8n:** Toro muss proprietaeres JSON Schema generieren (Node-Typen,
  Connection-Graphen, Positions-Koordinaten). Fehleranfaellig, schwer zu debuggen.
- **Windmill:** Toro generiert Standard TypeScript/Python Scripts.
  `fetch()` + API-Key ist simpler als den richtigen n8n Node zu parametrisieren.
  Jedes LLM kann TypeScript perfekt.

### Weitere Vorteile

- **Debugging:** Stack Traces + Logs statt "Node X hat einen Fehler"
- **Unbegrenzte Integrationen:** Jede API mit HTTP-Endpoint anbindbar via `fetch()`
- **Performance:** Rust-Core, Worker-basiert, schneller als n8n's Node.js Runtime
- **Embedding (Phase 4):** Guenstigere Lizenzen, explizit fuer SaaS-Wrapping designed
- **Error Handling:** Native Try/Catch statt n8n Error Trigger Nodes

### n8n Vorteile die wir aufgeben

- 500+ vorgefertigte Nodes (kompensiert durch direkte API-Calls)
- Groessere Community und mehr Templates
- Built-in OAuth Token Refresh (kompensiert durch MCP-Token-Sharing)

## Konsequenzen

- **Positiv:** Hoehere Erfolgsrate bei Toro-generierten Workflows
- **Positiv:** Standard-Code statt proprietaerem Format — einfacher zu testen
- **Positiv:** Guenstigerer Pfad zu Embedding falls Phase 4 kommt
- **Negativ:** Weniger out-of-the-box Integrationen (aber unbegrenzt via fetch)
- **Negativ:** Kleinere Community fuer Support-Fragen

## Migration

Konzept-Dokument aktualisiert: `docs/superpowers/windmill-integration-konzept.md`
(ersetzt `n8n-integration-konzept.md`)
