# ADR-006: Vercel AI SDK als LLM-Abstraktionsschicht

**Datum:** 2026-03 — dokumentiert 2026-03-26
**Status:** Entschieden

---

## Kontext

Für LLM-Aufrufe standen zwei Ansätze zur Wahl:

1. **Direkt**: `@anthropic-ai/sdk` — Anthropic's offizielles SDK
2. **Abstrahiert**: `ai` + `@ai-sdk/anthropic` — Vercel AI SDK mit Provider-Wrapper

Tropen OS plant langfristig Multi-Provider-Unterstützung (ADR-004: Smart Model Router).
Die Provider-Wahl darf nicht tief im Anwendungscode verdrahtet sein.

---

## Entscheidung

**Vercel AI SDK (`ai` + `@ai-sdk/anthropic`)** als einziger LLM-Abstraktionsschicht.

Konkrete Regeln:
- **Nie `@anthropic-ai/sdk` direkt importieren** — ausschließlich über AI SDK Provider
- Provider-Instanz zentral in `src/lib/llm/anthropic.ts` — kein `new Anthropic()` in Routes
- Alle LLM-Calls über `generateText()` oder `streamText()` aus `ai`
- **Feldnamen AI SDK v6**: `maxOutputTokens` (nicht `maxTokens`), `usage.inputTokens` / `usage.outputTokens`
- Strukturierte Ausgabe via `Output.object()` — nicht `generateObject()` (v5-API, entfernt)
- Streaming in User-facing Endpoints immer via `streamText()` + `toUIMessageStreamResponse()`

---

## Warum AI SDK statt direktem Anthropic SDK

| Dimension | `@anthropic-ai/sdk` direkt | Vercel AI SDK |
|-----------|---------------------------|---------------|
| Provider-Wechsel | Code-Umbau überall | Provider-Datei tauschen |
| Streaming | Anthropic-spezifisch | Einheitlich (SSE) |
| Structured Output | Anthropic Tool-Use | `Output.object()` |
| Multi-Provider | Nicht möglich | Ja (ADR-004) |
| Supabase Edge Functions | Kompatibel | Kompatibel |

---

## Konsequenzen

**Positiv:**
- Provider-Wechsel auf Mistral, OpenAI etc. ohne Code-Änderungen in Routes
- Einheitliche Streaming-Primitive (`streamText`) für alle Endpoints
- AI SDK DevTools (`npx @ai-sdk/devtools`) für Debugging während Entwicklung
- Kompatibel mit Supabase Edge Functions (Deno-Runtime)

**Negativ / Risiken:**
- AI SDK v6 brachte Breaking Changes (v5 → v6 Migration via `npx @ai-sdk/codemod v6`)
- Anthropic-spezifische Features (z.B. extended thinking, computer use) sind ggf. noch nicht im AI SDK — dann direkter Fallback nötig
- Abhängigkeit von Vercel AI SDK Veröffentlichungsrhythmus für neue Anthropic-Modelle

**Hinweis zu Supabase Edge Function:** Der Haupt-Chat (`supabase/functions/ai-chat`) nutzt `@anthropic-ai/sdk` direkt (Deno-Kompatibilität war Anfangsentscheidung). Das ist eine bekannte Inkonsistenz — bei nächster größerer Refaktorierung auf AI SDK migrieren.
