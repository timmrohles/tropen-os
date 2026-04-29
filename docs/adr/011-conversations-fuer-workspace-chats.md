# ADR-011: Conversations-Tabelle für Workspace-Chats (conversation_type)

**Datum:** 2026-03-18 (Migration 049) — dokumentiert 2026-03-19
**Status:** Entschieden

---

## Kontext

Tropen OS hat zwei Chat-Systeme:
1. **Projekt-Chat** (Edge Function `ai-chat`): Nutzer chatt mit Toro in einem Projektkontext
2. **Workspace-Chat** (Next.js `/api/workspaces/[id]/chat`): Toro arbeitet im Kontext eines Workspace-Canvas (Silo-Chat, Karten-Chat, Briefing)

Vor Migration 049 existierte nur ein Chat-System in der `conversations`-Tabelle. Mit der Workspace-Erweiterung (Plan F) entstanden neue Chat-Typen.

**Frage:** Separate Tabelle `workspace_conversations` anlegen, oder `conversations` erweitern?

---

## Entscheidung

Die bestehende `conversations`-Tabelle wird um drei Spalten erweitert (Migration `20260318000049_conversations_workspace.sql`):

```sql
ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
ADD COLUMN card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
ADD COLUMN conversation_type TEXT NOT NULL DEFAULT 'chat'
  CHECK (conversation_type IN ('chat', 'workspace_briefing', 'workspace_silo', 'workspace_card'))
```

**Begründung für Erweiterung statt separater Tabelle:**
- Geteilte Infrastruktur: Sharing-Feature (Migration 050), Memory-Summaries, Search nutzen alle `conversations` — keine Duplizierung
- Backward-kompatibel: Bestehende API-Routen funktionieren weiter, `conversation_type` hat Default `'chat'`
- Simpler Query-Pfad: Ein JOIN für alle Chat-Typen statt Union über zwei Tabellen

**API-Layer-Regel:** `supabaseAdmin` wird in Workspace-Chat-APIs verwendet (RLS bypassed). Scoping erfolgt via `organization_id` + `workspace_id` in der Query, nicht via RLS. Kommentar in Migration dokumentiert dies explizit.

---

## Konsequenzen

**Positiv:**
- Einheitliche Chat-Infrastruktur: Sharing, Export, Search, Memory funktionieren für alle Typen
- Kein Schema-Proliferation (neue Tabelle würde FK-Chaos riskieren)
- Index `idx_conversations_workspace` für performante Workspace-Queries

**Negativ / Risiken:**
- `conversations`-Tabelle wächst mit Workspace-Chats — langfristig Partitionierung erwägen
- RLS schützt Workspace-Chats nicht explizit (bewusste Entscheidung: API-Layer mit `supabaseAdmin` übernimmt Scoping)
- Neue Query-Disziplin nötig: Alle `from('conversations')`-Queries müssen auf `conversation_type` filtern, wenn nur Projekt-Chats gewollt sind
  - Verifiziert: `src/app/api/search/route.ts` filtert korrekt auf `conversation_type: 'chat'`
  - Offenes Risiko: Ältere Routes ohne expliziten `conversation_type`-Filter könnten Workspace-Chats irrtümlich einschließen

**Tech Debt:** Explizite RLS-Policy für Workspace-Conversations als Defense-in-Depth empfohlen (`docs/tech-debt.md`).
