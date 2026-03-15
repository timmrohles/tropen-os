# Tropen OS — RAG-Architektur & Wissensbasis

---

## Fundament

- Vector Store: **Supabase pgvector (EU)** — kein externer Vector Store
- Embedding-Modell: **OpenAI text-embedding-3-small** (1536 Dimensionen)
- Package: `openai` (bereits installiert)

## Drei Wissensebenen

| Ebene | Scope | Wer befüllt |
|-------|-------|-------------|
| Org | Alle Nutzer der Organisation | Admin |
| User | Nur der eigene Nutzer | Jeder |
| Projekt | Spezifisch für ein Projekt | Projekt-Mitglieder |

**Toro-Priorisierung beim Antworten:** Projekt → User → Org → eigenes Wissen

**Pflicht:** Quellenangabe bei jeder RAG-Antwort: `Quelle: [Dokumentname] · [Datum]`

## DB-Schema

```sql
knowledge_sources     -- id, organization_id, user_id, project_id, name, type, url,
                      -- sync_interval, last_synced_at, is_active, created_at
knowledge_documents   -- id, source_id, organization_id, user_id, project_id, title,
                      -- file_type, file_size, status (processing/ready/error), chunk_count
knowledge_chunks      -- id, document_id, organization_id, user_id, project_id,
                      -- content TEXT, embedding vector(1536), chunk_index, metadata JSONB
knowledge_citations   -- id, message_id, chunk_id, relevance_score, created_at
```

## Edge Functions

- **`knowledge-search`**: query + context (org_id, user_id, project_id) → Embedding →
  Cosine Similarity → Top 5 Chunks mit Quellenangabe
- **`knowledge-ingest`**: Datei → Text-Extraktion → Chunking (800 Zeichen, 100 Overlap) →
  Embeddings → knowledge_chunks

## Quellen-Roadmap

| Phase | Quellen |
|-------|---------|
| Phase 2 | Direkter Upload: PDF, DOCX, TXT, MD, CSV |
| Phase 3 | Google Drive Sync, Notion, RSS Feeds, Web-Seiten manuell |
| Phase 4 | Gmail Integration |

## Dokument-Limits pro Tier

| Tier | Max Dokumente | Max Dateigröße |
|------|--------------|----------------|
| Free | 10 | 10 MB |
| Pro User | 100 | 25 MB |
| Org Standard | 500 | 50 MB |
| Org Premium | Unbegrenzt | 100 MB |

## Migration

- **017_rag_foundation.sql** — pgvector Extension, 4 Tabellen, ivfflat Index, RLS Policies
- **018_rls_users_fix.sql** — users_select_own Policy + user_org_id() SECURITY DEFINER
