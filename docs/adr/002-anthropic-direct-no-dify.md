# ADR-002: Anthropic SDK direkt statt Dify

**Status:** Accepted
**Datum:** 2026-03-17
**Kontext:** LLM-Integration

## Entscheidung

Alle neuen AI-Features verwenden das Anthropic SDK direkt (`@anthropic-ai/sdk`).
Dify wurde vollstaendig entfernt (seit 2026-03-17).

## Grund

- Dify fuegte eine unnoetige Abstraktionsschicht hinzu (Latenz, Fehlerquellen)
- Dify-Flows waren schwer versionierbar und testbar
- Das Anthropic SDK bietet direkte Kontrolle ueber Prompts, Token-Limits und Streaming
- Budget-Enforcement laesst sich direkt in den API-Routes implementieren
- `jungle-order` Edge Function nutzt jetzt Anthropic direkt (`claude-haiku-4-5-20251001`)

## Konsequenzen

- **Positiv:** Weniger externe Abhaengigkeiten, niedrigere Latenz
- **Positiv:** Prompt-Versionierung im Code (nicht in Dify-UI)
- **Positiv:** Direkte Token-Zaehlung und Budget-Kontrolle
- **Negativ:** Kein visueller Flow-Editor mehr (war aber nie produktiv genutzt)
- **Migration:** `DIFY_API_KEY` und `DIFY_API_URL` koennen aus Secrets entfernt werden

## Modelle

| Verwendung | Modell |
|------------|--------|
| Projekt-Chat, Workspace-Chat | `claude-sonnet-4-20250514` |
| Context-Zusammenfassung, Feed Stage 2 | `claude-haiku-4-5-20251001` |
| Feed Stage 3 (Deep Analysis) | `claude-sonnet-4-20250514` |
| jungle-order Edge Function | `claude-haiku-4-5-20251001` |
