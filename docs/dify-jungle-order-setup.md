# Dify App: tropen-os-jungle-order

## Überblick

Separate Dify App (Workflow-Typ) für das "Ordnung im Dschungel" Feature.
Wird von der Edge Function `jungle-order` aufgerufen.

## App anlegen

1. Dify Dashboard → "Apps" → "+ Neue App erstellen"
2. Typ: **Workflow** (nicht Chatflow, nicht Agent)
3. Name: `tropen-os-jungle-order`
4. Beschreibung: `Toro – Struktur-Analyse und Chat-Zusammenführung`

## Workflow-Aufbau

```
[START]
  └─ Input: prompt (Text, Long Text)
       └─ [LLM Node]
            ├─ Modell: claude-sonnet-4-5 (oder gpt-4o als Fallback)
            ├─ System: "Du bist Toro, ein KI-Assistent für Workspace-Organisation."
            ├─ User: {{prompt}}
            └─ [END]
                 └─ Output: text (LLM-Antwort direkt)
```

### LLM Node Einstellungen
- **Modell**: claude-sonnet-4-5-20251001 (oder gpt-4o-mini für günstigere Runs)
- **Temperature**: 0.3 (deterministisch für JSON-Output)
- **Max Tokens**: 2000
- **System Prompt**:
  ```
  Du bist Toro, ein freundlicher KI-Papagei der Unternehmen durch den
  Informationsdschungel führt. Antworte immer auf Deutsch.
  Wenn du JSON ausgeben sollst, antworte NUR mit validem JSON – kein Text davor oder danach.
  ```
- **User**: `{{prompt}}` (Variable aus START-Node)

### START Node
- Variable: `prompt`
- Typ: Paragraph (Long Text)
- Pflichtfeld: ja

### END Node
- Output Variable: `text`
- Mapped auf: LLM Node Output → `text`

## API Key holen

Nach Veröffentlichung der App:
1. App öffnen → "API" → "API-Schlüssel"
2. Neuen Schlüssel erstellen: `jungle-order-prod`
3. Kopieren → in `.env.local` eintragen

## Env-Vars

### .env.local (lokal)
```
DIFY_JUNGLE_ORDER_KEY=app-...
```

### Supabase Edge Function Secrets
```bash
supabase secrets set DIFY_JUNGLE_ORDER_KEY=app-...
supabase secrets set DIFY_API_URL=https://api.dify.ai/v1
```

Prüfen ob SUPABASE_URL + SUPABASE_ANON_KEY + SUPABASE_SERVICE_ROLE_KEY
automatisch gesetzt sind (sind sie in Supabase Edge Functions by default).

## Testen

### Modus A – Struktur-Analyse
```bash
curl -X POST https://<project>.supabase.co/functions/v1/jungle-order \
  -H "Authorization: Bearer <user-jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "structure",
    "conversations": [
      {"id": "1", "title": "Q2 Marktanalyse", "task_type": "research"},
      {"id": "2", "title": "Wettbewerber Recherche", "task_type": "research"},
      {"id": "3", "title": "Onboarding Lisa", "task_type": "create"},
      {"id": "4", "title": "Onboarding Tom", "task_type": "create"},
      {"id": "5", "title": "Budget Planung", "task_type": "chat"}
    ]
  }'
```

### Modus B – Merge
```bash
curl -X POST https://<project>.supabase.co/functions/v1/jungle-order \
  -H "Authorization: Bearer <user-jwt>" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "merge",
    "conversation_ids": ["uuid-1", "uuid-2", "uuid-3"]
  }'
```

## Deployment

```bash
supabase functions deploy jungle-order --no-verify-jwt
```

Hinweis: `--no-verify-jwt` nicht verwenden – JWT-Verifizierung ist in der
Function selbst implementiert (via supabase.auth.getUser()).
Also ohne Flag deployen:

```bash
supabase functions deploy jungle-order
```
