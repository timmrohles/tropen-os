# RAG-Fundament – Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wissensbasis mit pgvector in Supabase aufbauen – Upload, Chunking, Embedding und Suche – plus /knowledge UI-Seite mit 3 Tabs.

**Architecture:** Dateien werden in Supabase Storage hochgeladen, dann durch die `knowledge-ingest` Edge Function in Chunks zerlegt, geembeddet und in `knowledge_chunks` gespeichert. Die `knowledge-search` Edge Function nimmt eine Query, erstellt ein Embedding und gibt die Top-5 ähnlichsten Chunks zurück (Priorität: Projekt → User → Org). Die UI-Seite `/knowledge` bietet 3 Tabs (Meine Dokumente, Org-Wissen, Projekt-Wissen) mit Drag-and-Drop-Upload.

**Tech Stack:** Next.js 16 App Router, Supabase pgvector, Deno Edge Functions, OpenAI text-embedding-3-small, Supabase Storage, @phosphor-icons/react, globals.css

---

## Übersicht neue Dateien

| Aktion | Datei |
|--------|-------|
| Neu | `supabase/migrations/017_rag_foundation.sql` |
| Neu | `supabase/functions/knowledge-ingest/index.ts` |
| Neu | `supabase/functions/knowledge-search/index.ts` |
| Neu | `src/app/knowledge/page.tsx` |
| Neu | `src/app/api/knowledge/route.ts` |
| Modifiziert | `src/app/globals.css` |
| Modifiziert | `src/components/workspace/LeftNav.tsx` |
| Modifiziert | `src/middleware.ts` |

---

## Task 1: Migration 017_rag_foundation.sql

**Files:**
- Create: `supabase/migrations/017_rag_foundation.sql`

**Step 1: Datei erstellen**

```sql
-- 017_rag_foundation.sql
-- RAG: pgvector Extension + 4 Tabellen + RLS + Index

-- pgvector aktivieren (falls nicht vorhanden)
create extension if not exists vector;

-- ─── knowledge_sources ───────────────────────────────────────────────────────
create table knowledge_sources (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete cascade,   -- null = Org-Ebene
  project_id      uuid references projects(id) on delete cascade,     -- null = nicht projektspezifisch
  name            text not null,
  type            text not null check (type in ('upload','rss','web','google_drive','notion')),
  url             text,
  sync_interval   interval,
  last_synced_at  timestamptz,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

-- ─── knowledge_documents ─────────────────────────────────────────────────────
create table knowledge_documents (
  id              uuid primary key default gen_random_uuid(),
  source_id       uuid not null references knowledge_sources(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  project_id      uuid references projects(id) on delete set null,
  title           text not null,
  file_type       text,        -- pdf, docx, txt, md, csv
  file_size       bigint,      -- bytes
  storage_path    text,        -- Supabase Storage path
  original_url    text,
  status          text not null default 'processing'
                  check (status in ('processing','ready','error')),
  error_message   text,
  chunk_count     integer not null default 0,
  created_at      timestamptz not null default now()
);

-- ─── knowledge_chunks ────────────────────────────────────────────────────────
create table knowledge_chunks (
  id              uuid primary key default gen_random_uuid(),
  document_id     uuid not null references knowledge_documents(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  project_id      uuid references projects(id) on delete set null,
  content         text not null,
  embedding       vector(1536),
  chunk_index     integer not null,
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now()
);

-- ─── knowledge_citations ─────────────────────────────────────────────────────
create table knowledge_citations (
  id              uuid primary key default gen_random_uuid(),
  message_id      uuid references messages(id) on delete cascade,
  chunk_id        uuid not null references knowledge_chunks(id) on delete cascade,
  relevance_score float not null,
  created_at      timestamptz not null default now()
);

-- ─── Index für Ähnlichkeitssuche (ivfflat, cosine) ──────────────────────────
-- lists=100 ist gut für bis zu 1M Vektoren
create index knowledge_chunks_embedding_idx
  on knowledge_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Index für schnelle Lookups
create index knowledge_documents_source_idx on knowledge_documents(source_id);
create index knowledge_chunks_document_idx  on knowledge_chunks(document_id);
create index knowledge_chunks_org_idx       on knowledge_chunks(organization_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table knowledge_sources   enable row level security;
alter table knowledge_documents enable row level security;
alter table knowledge_chunks    enable row level security;
alter table knowledge_citations enable row level security;

-- Hilfsfunktion: prüft ob User zur Org gehört
create or replace function user_org_id()
returns uuid language sql stable as $$
  select organization_id from users where id = auth.uid()
$$;

-- knowledge_sources: User sieht Org-Sources + eigene User-Sources
create policy "knowledge_sources_select" on knowledge_sources
  for select using (
    organization_id = user_org_id()
  );
create policy "knowledge_sources_insert" on knowledge_sources
  for insert with check (
    organization_id = user_org_id()
    and (user_id is null or user_id = auth.uid())
  );
create policy "knowledge_sources_update" on knowledge_sources
  for update using (
    organization_id = user_org_id()
    and (user_id is null or user_id = auth.uid())
  );
create policy "knowledge_sources_delete" on knowledge_sources
  for delete using (
    organization_id = user_org_id()
    and (user_id is null or user_id = auth.uid())
  );

-- knowledge_documents: gleiche Logik
create policy "knowledge_documents_select" on knowledge_documents
  for select using (organization_id = user_org_id());
create policy "knowledge_documents_insert" on knowledge_documents
  for insert with check (
    organization_id = user_org_id()
    and (user_id is null or user_id = auth.uid())
  );
create policy "knowledge_documents_update" on knowledge_documents
  for update using (
    organization_id = user_org_id()
    and (user_id is null or user_id = auth.uid())
  );
create policy "knowledge_documents_delete" on knowledge_documents
  for delete using (
    organization_id = user_org_id()
    and (user_id is null or user_id = auth.uid())
  );

-- knowledge_chunks: nur SELECT für normale User (Ingest via Service Role)
create policy "knowledge_chunks_select" on knowledge_chunks
  for select using (organization_id = user_org_id());

-- knowledge_citations: User sieht eigene Zitierungen
create policy "knowledge_citations_select" on knowledge_citations
  for select using (
    exists (
      select 1 from messages m
      join conversations c on c.id = m.conversation_id
      where m.id = knowledge_citations.message_id
        and c.user_id = auth.uid()
    )
  );

-- Supabase Storage Bucket (muss einmalig im Dashboard oder via API angelegt werden)
-- Bucket-Name: knowledge-files
-- RLS: User kann nur eigene Dateien lesen/schreiben
```

**Step 2: Migration im Supabase-Dashboard ausführen**

Öffne Supabase Dashboard → SQL Editor → füge den Inhalt der Migration ein → Run.

Alternativ per CLI:
```bash
cd "/c/Users/timmr/tropen OS"
supabase db push
```

**Step 3: Bucket in Supabase Storage anlegen**

Im Supabase Dashboard → Storage → New Bucket:
- Name: `knowledge-files`
- Public: ❌ (privat)

**Step 4: Commit**

```bash
cd "/c/Users/timmr/tropen OS"
git add supabase/migrations/017_rag_foundation.sql
git commit -m "feat: add RAG foundation migration (pgvector, knowledge tables, RLS)"
```

---

## Task 2: Edge Function `knowledge-ingest`

**Files:**
- Create: `supabase/functions/knowledge-ingest/index.ts`

**Step 1: Verzeichnis anlegen und Datei erstellen**

```bash
mkdir -p "/c/Users/timmr/tropen OS/supabase/functions/knowledge-ingest"
```

Inhalt `supabase/functions/knowledge-ingest/index.ts`:

```ts
// knowledge-ingest/index.ts
// Nimmt document_id entgegen, liest Datei aus Storage, chunked, embedded, speichert

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY       = Deno.env.get("OPENAI_API_KEY")!;

const CHUNK_SIZE    = 800;
const CHUNK_OVERLAP = 100;
const EMBEDDING_MODEL = "text-embedding-3-small";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

// ─── Chunking ─────────────────────────────────────────────────────────────────
function chunkText(text: string): string[] {
  const chunks: string[] = [];
  // Bereinige Text
  const cleaned = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  let start = 0;
  while (start < cleaned.length) {
    const end = Math.min(start + CHUNK_SIZE, cleaned.length);
    chunks.push(cleaned.slice(start, end));
    start += CHUNK_SIZE - CHUNK_OVERLAP;
    if (start >= cleaned.length) break;
  }
  return chunks.filter(c => c.trim().length > 50); // Zu kurze Chunks ignorieren
}

// ─── Text-Extraktion ──────────────────────────────────────────────────────────
async function extractText(content: Uint8Array, fileType: string): Promise<string> {
  switch (fileType.toLowerCase()) {
    case "txt":
    case "md":
    case "csv":
      return new TextDecoder("utf-8").decode(content);

    case "pdf": {
      // PDF: Versuche Text via einfacher Byte-Extraktion (BT...ET Blöcke)
      // Für Production: pdf-parse via esm.sh oder Supabase AI
      const text = new TextDecoder("latin1").decode(content);
      const matches = text.match(/BT[\s\S]*?ET/g) ?? [];
      const extracted = matches
        .join("\n")
        .replace(/\(([^)]+)\)\s*Tj/g, "$1 ")
        .replace(/\[([^\]]+)\]\s*TJ/g, (_, m) =>
          m.replace(/\(([^)]*)\)/g, "$1 ").replace(/-?\d+(\.\d+)?\s*/g, "")
        )
        .replace(/[^\x20-\x7E\n]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
      return extracted || "PDF-Textextraktion nicht verfügbar für dieses Dokument.";
    }

    case "docx": {
      // DOCX: XML extrahieren aus ZIP
      // Einfache Extraktion ohne externe Library
      const text = new TextDecoder("utf-8", { fatal: false }).decode(content);
      const xmlMatches = text.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) ?? [];
      return xmlMatches
        .map(m => m.replace(/<[^>]+>/g, ""))
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
    }

    default:
      return new TextDecoder("utf-8", { fatal: false }).decode(content);
  }
}

// ─── Embeddings erstellen ─────────────────────────────────────────────────────
async function createEmbeddings(texts: string[]): Promise<number[][]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI Embeddings Fehler: ${err}`);
  }

  const data = await res.json();
  return data.data.map((d: { embedding: number[] }) => d.embedding);
}

// ─── Handler ──────────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  let document_id: string;
  try {
    const body = await req.json();
    document_id = body.document_id;
    if (!document_id) throw new Error("document_id fehlt");
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 400,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  }

  // Dokument laden
  const { data: doc, error: docErr } = await supabase
    .from("knowledge_documents")
    .select("*, knowledge_sources(organization_id, user_id, project_id)")
    .eq("id", document_id)
    .single();

  if (docErr || !doc) {
    return new Response(JSON.stringify({ error: "Dokument nicht gefunden" }), {
      status: 404,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  }

  try {
    // Status auf processing setzen
    await supabase
      .from("knowledge_documents")
      .update({ status: "processing" })
      .eq("id", document_id);

    // Datei aus Storage laden
    const { data: fileData, error: fileErr } = await supabase.storage
      .from("knowledge-files")
      .download(doc.storage_path);

    if (fileErr || !fileData) {
      throw new Error(`Storage-Fehler: ${fileErr?.message}`);
    }

    const content = new Uint8Array(await fileData.arrayBuffer());

    // Text extrahieren
    const text = await extractText(content, doc.file_type ?? "txt");

    if (!text || text.length < 10) {
      throw new Error("Kein Text extrahierbar");
    }

    // Chunking
    const chunks = chunkText(text);

    if (chunks.length === 0) {
      throw new Error("Keine Chunks erstellt");
    }

    // Embeddings in Batches (max 100 pro Request)
    const BATCH_SIZE = 100;
    const allEmbeddings: number[][] = [];
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const embeddings = await createEmbeddings(batch);
      allEmbeddings.push(...embeddings);
    }

    // Alte Chunks löschen (bei Re-Ingest)
    await supabase
      .from("knowledge_chunks")
      .delete()
      .eq("document_id", document_id);

    // Chunks speichern
    const chunkRows = chunks.map((content, i) => ({
      document_id,
      organization_id: doc.organization_id,
      user_id: doc.user_id,
      project_id: doc.project_id,
      content,
      embedding: `[${allEmbeddings[i].join(",")}]`,
      chunk_index: i,
      metadata: { source: doc.title, file_type: doc.file_type },
    }));

    const { error: insertErr } = await supabase
      .from("knowledge_chunks")
      .insert(chunkRows);

    if (insertErr) throw new Error(`Insert-Fehler: ${insertErr.message}`);

    // Dokument auf ready setzen
    await supabase
      .from("knowledge_documents")
      .update({ status: "ready", chunk_count: chunks.length, error_message: null })
      .eq("id", document_id);

    return new Response(
      JSON.stringify({ success: true, chunks: chunks.length }),
      { headers: { ...corsHeaders(), "Content-Type": "application/json" } }
    );
  } catch (err) {
    // Fehler speichern
    await supabase
      .from("knowledge_documents")
      .update({ status: "error", error_message: String(err) })
      .eq("id", document_id);

    return new Response(
      JSON.stringify({ error: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders(), "Content-Type": "application/json" },
      }
    );
  }
});
```

**Step 2: Commit**

```bash
cd "/c/Users/timmr/tropen OS"
git add supabase/functions/knowledge-ingest/index.ts
git commit -m "feat: add knowledge-ingest edge function (chunk + embed + store)"
```

---

## Task 3: Edge Function `knowledge-search`

**Files:**
- Create: `supabase/functions/knowledge-search/index.ts`

**Step 1: Verzeichnis anlegen und Datei erstellen**

```bash
mkdir -p "/c/Users/timmr/tropen OS/supabase/functions/knowledge-search"
```

Inhalt `supabase/functions/knowledge-search/index.ts`:

```ts
// knowledge-search/index.ts
// Nimmt Query + Kontext, gibt Top-5 Chunks zurück (Priorität: Projekt → User → Org)

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_API_KEY       = Deno.env.get("OPENAI_API_KEY")!;
const EMBEDDING_MODEL      = "text-embedding-3-small";
const TOP_K                = 5;
const SIMILARITY_THRESHOLD = 0.3;

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };
}

async function createEmbedding(text: string): Promise<number[]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: text }),
  });

  if (!res.ok) throw new Error(`OpenAI Embedding Fehler: ${await res.text()}`);
  const data = await res.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders() });
  }

  let query: string, org_id: string, user_id: string, project_id: string | null;

  try {
    const body = await req.json();
    query      = String(body.query ?? "").trim();
    org_id     = body.org_id;
    user_id    = body.user_id;
    project_id = body.project_id ?? null;

    if (!query || !org_id || !user_id) {
      throw new Error("query, org_id und user_id sind Pflicht");
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 400,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Query-Embedding erstellen
    const queryEmbedding = await createEmbedding(query);
    const embeddingStr = `[${queryEmbedding.join(",")}]`;

    // Suche mit Priorität: Projekt (3) > User (2) > Org (1)
    // Verwende Supabase RPC für Vektor-Suche
    const { data: results, error } = await supabase.rpc("search_knowledge_chunks", {
      query_embedding: embeddingStr,
      match_org_id:    org_id,
      match_user_id:   user_id,
      match_project_id: project_id,
      match_threshold:  SIMILARITY_THRESHOLD,
      match_count:      TOP_K * 3, // Mehr laden, dann nach Priorität sortieren
    });

    if (error) throw new Error(error.message);

    // Priorität zuweisen und Top-K auswählen
    const scored = (results ?? []).map((r: {
      id: string; content: string; similarity: number;
      document_id: string; user_id: string | null; project_id: string | null;
      metadata: Record<string, string>;
    }) => ({
      ...r,
      priority: r.project_id ? 3 : r.user_id ? 2 : 1,
      score: r.similarity + (r.project_id ? 0.2 : r.user_id ? 0.1 : 0),
    }));

    scored.sort((a: { score: number }, b: { score: number }) => b.score - a.score);
    const topChunks = scored.slice(0, TOP_K);

    // Quellenangaben laden
    const documentIds = [...new Set(topChunks.map((c: { document_id: string }) => c.document_id))];
    const { data: docs } = await supabase
      .from("knowledge_documents")
      .select("id, title, created_at, file_type")
      .in("id", documentIds);

    const docMap = new Map((docs ?? []).map((d: {
      id: string; title: string; created_at: string; file_type: string;
    }) => [d.id, d]));

    const chunks = topChunks.map((c: {
      id: string; content: string; similarity: number; document_id: string;
      priority: number; score: number;
    }) => {
      const doc = docMap.get(c.document_id) as {
        title: string; created_at: string; file_type: string;
      } | undefined;
      return {
        chunk_id:   c.id,
        content:    c.content,
        similarity: c.similarity,
        priority:   c.priority,
        citation:   doc
          ? `Quelle: ${doc.title} · ${new Date(doc.created_at).toLocaleDateString("de-DE")}`
          : "Quelle: Wissensbasis",
        document: doc ?? null,
      };
    });

    return new Response(JSON.stringify({ chunks, total: chunks.length }), {
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders(), "Content-Type": "application/json" },
    });
  }
});
```

**Step 2: RPC-Funktion `search_knowledge_chunks` zur Migration hinzufügen**

Führe folgendes SQL im Supabase Dashboard → SQL Editor aus:

```sql
-- RPC für Vektor-Ähnlichkeitssuche
create or replace function search_knowledge_chunks(
  query_embedding   vector(1536),
  match_org_id      uuid,
  match_user_id     uuid,
  match_project_id  uuid,
  match_threshold   float,
  match_count       int
)
returns table (
  id          uuid,
  content     text,
  similarity  float,
  document_id uuid,
  user_id     uuid,
  project_id  uuid,
  metadata    jsonb
)
language sql stable as $$
  select
    kc.id,
    kc.content,
    1 - (kc.embedding <=> query_embedding) as similarity,
    kc.document_id,
    kc.user_id,
    kc.project_id,
    kc.metadata
  from knowledge_chunks kc
  where
    kc.organization_id = match_org_id
    and (
      kc.project_id = match_project_id
      or kc.user_id = match_user_id
      or (kc.user_id is null and kc.project_id is null)
    )
    and 1 - (kc.embedding <=> query_embedding) > match_threshold
  order by kc.embedding <=> query_embedding
  limit match_count;
$$;
```

**Step 3: Commit**

```bash
cd "/c/Users/timmr/tropen OS"
git add supabase/functions/knowledge-search/index.ts
git commit -m "feat: add knowledge-search edge function (embedding + cosine similarity + citations)"
```

---

## Task 4: CSS-Klassen für /knowledge in globals.css

**Files:**
- Modify: `src/app/globals.css` (ans Ende anfügen)

**Step 1: CSS-Block anfügen**

```css
/* ─────────────────────────────────────────────────────────────────────────
   Knowledge Base Page (.kb-*)
   ───────────────────────────────────────────────────────────────────────── */

.kb-wrap       { max-width: 860px; margin: 0 auto; padding: 0; }
.kb-header     { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.kb-title      { font-size: 22px; font-weight: 700; color: #fff; margin: 0; letter-spacing: -0.02em; }
.kb-tabs       { display: flex; gap: 4px; margin-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0; }
.kb-tab        { padding: 8px 16px; background: none; border-top: none; border-left: none; border-right: none; border-bottom: 2px solid transparent; cursor: pointer; border-radius: 6px 6px 0 0; display: flex; align-items: center; gap: 6px; font-size: 14px; color: rgba(255,255,255,0.5); transition: color 0.15s; }
.kb-tab:hover  { color: rgba(255,255,255,0.8); }
.kb-tab--active { color: #fff; border-bottom: 2px solid #a3b554; }
.kb-tab--disabled { opacity: 0.35; cursor: not-allowed; }

/* Upload-Zone */
.kb-drop-zone  { border: 2px dashed rgba(255,255,255,0.15); border-radius: 12px; padding: 40px 24px; text-align: center; transition: border-color 0.15s, background 0.15s; cursor: pointer; margin-bottom: 24px; }
.kb-drop-zone:hover, .kb-drop-zone--active { border-color: #a3b554; background: rgba(163,181,84,0.05); }
.kb-drop-icon  { color: rgba(255,255,255,0.3); margin-bottom: 12px; }
.kb-drop-title { font-size: 15px; color: rgba(255,255,255,0.7); margin: 0 0 4px; font-weight: 600; }
.kb-drop-sub   { font-size: 12px; color: rgba(255,255,255,0.35); margin: 0; }

/* Dokument-Liste */
.kb-doc-list   { display: flex; flex-direction: column; gap: 8px; }
.kb-doc-row    { display: flex; align-items: center; gap: 12px; background: #111; border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px 16px; }
.kb-doc-icon   { flex-shrink: 0; color: rgba(255,255,255,0.4); }
.kb-doc-info   { flex: 1; min-width: 0; }
.kb-doc-name   { font-size: 14px; color: #fff; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.kb-doc-meta   { font-size: 12px; color: rgba(255,255,255,0.35); margin-top: 2px; }
.kb-doc-status { flex-shrink: 0; }
.kb-badge      { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 99px; font-size: 11px; font-weight: 600; }
.kb-badge--ready      { background: rgba(163,181,84,0.15); color: #a3b554; }
.kb-badge--processing { background: rgba(255,200,0,0.12); color: #f5c400; }
.kb-badge--error      { background: rgba(239,68,68,0.12); color: #ef4444; }
.kb-doc-delete { background: none; border: none; cursor: pointer; color: rgba(255,255,255,0.25); padding: 4px; border-radius: 6px; display: flex; transition: color 0.15s; }
.kb-doc-delete:hover { color: #ef4444; }

/* Fortschrittsbalken */
.kb-progress-wrap { margin-bottom: 16px; }
.kb-progress-label { font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.kb-progress-bar   { height: 4px; background: rgba(255,255,255,0.08); border-radius: 99px; overflow: hidden; }
.kb-progress-fill  { height: 100%; background: #a3b554; border-radius: 99px; transition: width 0.3s; }

/* Leerer Zustand */
.kb-empty      { text-align: center; padding: 48px 24px; }
.kb-empty-icon { color: rgba(255,255,255,0.15); margin-bottom: 12px; }
.kb-empty-text { font-size: 14px; color: rgba(255,255,255,0.35); margin: 0; }

/* Buttons */
.kb-btn-primary { display: inline-flex; align-items: center; gap: 6px; padding: 9px 18px; background: #a3b554; color: #0d1f16; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; transition: background 0.15s; }
.kb-btn-primary:hover { background: #b8ca62; }
.kb-error-msg  { font-size: 13px; color: #ef4444; margin-top: 8px; }
.kb-admin-hint { font-size: 13px; color: rgba(255,255,255,0.3); padding: 32px; text-align: center; }
```

**Step 2: Commit**

```bash
cd "/c/Users/timmr/tropen OS"
git add src/app/globals.css
git commit -m "feat: add .kb-* CSS classes for knowledge base page"
```

---

## Task 5: API Route `/api/knowledge`

**Files:**
- Create: `src/app/api/knowledge/route.ts`

**Step 1: Datei erstellen**

```ts
// src/app/api/knowledge/route.ts
// GET: Dokumente laden | DELETE: Dokument + Chunks löschen

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profil nicht gefunden' }, { status: 404 })

  const scope = req.nextUrl.searchParams.get('scope') ?? 'user'
  const project_id = req.nextUrl.searchParams.get('project_id')

  let query = supabase
    .from('knowledge_documents')
    .select(`
      id, title, file_type, file_size, status, chunk_count, created_at, error_message,
      knowledge_sources!inner(name, type, organization_id, user_id, project_id)
    `)
    .eq('organization_id', profile.organization_id)
    .order('created_at', { ascending: false })

  if (scope === 'user') {
    query = query.eq('user_id', user.id).is('project_id', null)
  } else if (scope === 'org') {
    query = query.is('user_id', null).is('project_id', null)
  } else if (scope === 'project' && project_id) {
    query = query.eq('project_id', project_id)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { document_id } = await req.json()
  if (!document_id) return NextResponse.json({ error: 'document_id fehlt' }, { status: 400 })

  // Dokument laden (Zugriffscheck + storage_path holen)
  const { data: doc } = await supabase
    .from('knowledge_documents')
    .select('id, storage_path, user_id, organization_id')
    .eq('id', document_id)
    .single()

  if (!doc) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  // Nur eigene Dokumente oder Org-Dokumente von Admins löschen
  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const isAdmin = profile?.role === 'admin' || profile?.role === 'owner' || profile?.role === 'superadmin'
  const isOwner = doc.user_id === user.id

  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }

  // Storage-Datei löschen
  if (doc.storage_path) {
    await supabaseAdmin.storage.from('knowledge-files').remove([doc.storage_path])
  }

  // Chunks werden via CASCADE gelöscht
  const { error } = await supabaseAdmin
    .from('knowledge_documents')
    .delete()
    .eq('id', document_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
```

**Step 2: Commit**

```bash
cd "/c/Users/timmr/tropen OS"
git add src/app/api/knowledge/route.ts
git commit -m "feat: add /api/knowledge route (list + delete documents)"
```

---

## Task 6: /knowledge Page UI

**Files:**
- Create: `src/app/knowledge/page.tsx`

**Step 1: Datei erstellen**

```tsx
'use client'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import {
  CloudArrowUp, File, FilePdf, FileDoc, FileText, FileCsv,
  Trash, CheckCircle, Warning, Spinner, Books, FolderOpen, Users,
} from '@phosphor-icons/react'

// ─── Typen ────────────────────────────────────────────────────────────────────

type Tab = 'user' | 'org' | 'project'
type DocStatus = 'processing' | 'ready' | 'error'

interface KnowledgeDoc {
  id: string
  title: string
  file_type: string | null
  file_size: number | null
  status: DocStatus
  chunk_count: number
  created_at: string
  error_message: string | null
}

interface UploadProgress {
  name: string
  percent: number
}

const ACCEPTED_TYPES = '.pdf,.docx,.txt,.md,.csv'
const MAX_SIZE_MB = 25

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileIcon(type: string | null) {
  switch (type?.toLowerCase()) {
    case 'pdf':  return <FilePdf size={20} weight="fill" style={{ color: '#ef4444' }} />
    case 'docx': return <FileDoc size={20} weight="fill" style={{ color: '#3b82f6' }} />
    case 'csv':  return <FileCsv size={20} weight="fill" style={{ color: '#22c55e' }} />
    default:     return <FileText size={20} weight="fill" style={{ color: 'rgba(255,255,255,0.4)' }} />
  }
}

// ─── Komponente ───────────────────────────────────────────────────────────────

export default function KnowledgePage() {
  const supabase = createClient()

  const [tab, setTab] = useState<Tab>('user')
  const [docs, setDocs] = useState<KnowledgeDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploads, setUploads] = useState<UploadProgress[]>([])
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // User + Profil laden
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)
      const { data: profile } = await supabase
        .from('users')
        .select('organization_id, role')
        .eq('id', user.id)
        .single()
      if (profile) {
        setOrgId(profile.organization_id)
        setIsAdmin(['admin', 'owner', 'superadmin'].includes(profile.role))
      }
    }
    load()
  }, [])

  const loadDocs = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/knowledge?scope=${tab}`)
    if (res.ok) setDocs(await res.json())
    setLoading(false)
  }, [tab])

  useEffect(() => { loadDocs() }, [loadDocs])

  // Polling für "processing" Dokumente
  useEffect(() => {
    const processing = docs.some(d => d.status === 'processing')
    if (!processing) return
    const timer = setInterval(loadDocs, 3000)
    return () => clearInterval(timer)
  }, [docs, loadDocs])

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setUploadError(null)

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop()?.toLowerCase() ?? ''
      if (!['pdf', 'docx', 'txt', 'md', 'csv'].includes(ext)) {
        setUploadError(`Dateityp .${ext} nicht unterstützt`)
        continue
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setUploadError(`${file.name} ist größer als ${MAX_SIZE_MB} MB`)
        continue
      }

      const progress: UploadProgress = { name: file.name, percent: 0 }
      setUploads(prev => [...prev, progress])

      try {
        // 1. Source anlegen (Upload-Typ, persönliche Ebene)
        const { data: source, error: srcErr } = await supabase
          .from('knowledge_sources')
          .insert({
            organization_id: orgId,
            user_id: tab === 'user' ? userId : null,
            project_id: null,
            name: file.name,
            type: 'upload',
            is_active: true,
          })
          .select('id')
          .single()

        if (srcErr || !source) throw new Error(srcErr?.message ?? 'Source-Fehler')

        // 2. Dokument-Eintrag anlegen
        const { data: doc, error: docErr } = await supabase
          .from('knowledge_documents')
          .insert({
            source_id: source.id,
            organization_id: orgId,
            user_id: tab === 'user' ? userId : null,
            project_id: null,
            title: file.name.replace(/\.[^.]+$/, ''),
            file_type: ext,
            file_size: file.size,
            storage_path: `${orgId}/${source.id}/${file.name}`,
            status: 'processing',
          })
          .select('id')
          .single()

        if (docErr || !doc) throw new Error(docErr?.message ?? 'Dokument-Fehler')

        setUploads(prev => prev.map(u => u.name === file.name ? { ...u, percent: 30 } : u))

        // 3. Datei in Storage hochladen
        const { error: storageErr } = await supabase.storage
          .from('knowledge-files')
          .upload(`${orgId}/${source.id}/${file.name}`, file, { upsert: true })

        if (storageErr) throw new Error(storageErr.message)

        setUploads(prev => prev.map(u => u.name === file.name ? { ...u, percent: 70 } : u))

        // 4. Ingest-Edge-Function triggern
        const { error: fnErr } = await supabase.functions.invoke('knowledge-ingest', {
          body: { document_id: doc.id },
        })

        if (fnErr) throw new Error(fnErr.message)

        setUploads(prev => prev.map(u => u.name === file.name ? { ...u, percent: 100 } : u))
        setTimeout(() => {
          setUploads(prev => prev.filter(u => u.name !== file.name))
          loadDocs()
        }, 1000)
      } catch (err) {
        setUploadError(String(err))
        setUploads(prev => prev.filter(u => u.name !== file.name))
      }
    }
  }

  async function deleteDoc(id: string) {
    if (!confirm('Dokument wirklich löschen?')) return
    await fetch('/api/knowledge', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: id }),
    })
    loadDocs()
  }

  const TABS: { id: Tab; label: string; icon: React.ReactNode; adminOnly?: boolean }[] = [
    { id: 'user', label: 'Meine Dokumente', icon: <File size={16} weight="fill" /> },
    { id: 'org',  label: 'Org-Wissen',      icon: <Users size={16} weight="fill" />, adminOnly: true },
    { id: 'project', label: 'Projekt-Wissen', icon: <FolderOpen size={16} weight="fill" /> },
  ]

  return (
    <div className="kb-wrap">
      {/* Header */}
      <div className="kb-header">
        <h1 className="kb-title">
          <Books size={24} weight="fill" style={{ verticalAlign: 'middle', marginRight: 10, color: '#a3b554' }} />
          Wissensbasis
        </h1>
      </div>

      {/* Tabs */}
      <div className="kb-tabs">
        {TABS.map(t => {
          const disabled = t.adminOnly && !isAdmin
          return (
            <button
              key={t.id}
              className={`kb-tab${tab === t.id ? ' kb-tab--active' : ''}${disabled ? ' kb-tab--disabled' : ''}`}
              onClick={() => !disabled && setTab(t.id)}
              disabled={disabled}
            >
              {t.icon}
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Org-Tab: nur Admins */}
      {tab === 'org' && !isAdmin ? (
        <p className="kb-admin-hint">Nur Admins können das Org-Wissen verwalten.</p>
      ) : (
        <>
          {/* Upload-Zone */}
          <div
            className={`kb-drop-zone${dragOver ? ' kb-drop-zone--active' : ''}`}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="kb-drop-icon"><CloudArrowUp size={36} weight="duotone" /></div>
            <p className="kb-drop-title">Datei hierher ziehen oder klicken</p>
            <p className="kb-drop-sub">PDF, DOCX, TXT, MD, CSV · max. {MAX_SIZE_MB} MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              multiple
              style={{ display: 'none' }}
              onChange={e => handleFiles(e.target.files)}
            />
          </div>

          {/* Upload-Fortschritt */}
          {uploads.map(u => (
            <div key={u.name} className="kb-progress-wrap">
              <div className="kb-progress-label">{u.name}</div>
              <div className="kb-progress-bar">
                <div className="kb-progress-fill" style={{ width: `${u.percent}%` }} />
              </div>
            </div>
          ))}

          {uploadError && <p className="kb-error-msg">{uploadError}</p>}

          {/* Dokument-Liste */}
          {loading ? (
            <div className="kb-empty">
              <Spinner size={24} className="animate-spin" style={{ color: 'rgba(255,255,255,0.3)' }} />
            </div>
          ) : docs.length === 0 ? (
            <div className="kb-empty">
              <div className="kb-empty-icon"><Books size={40} weight="duotone" /></div>
              <p className="kb-empty-text">Noch keine Dokumente. Lade dein erstes Dokument hoch.</p>
            </div>
          ) : (
            <div className="kb-doc-list">
              {docs.map(doc => (
                <div key={doc.id} className="kb-doc-row">
                  <div className="kb-doc-icon">{fileIcon(doc.file_type)}</div>
                  <div className="kb-doc-info">
                    <div className="kb-doc-name">{doc.title}</div>
                    <div className="kb-doc-meta">
                      {doc.file_size ? formatBytes(doc.file_size) : ''}
                      {doc.chunk_count > 0 && ` · ${doc.chunk_count} Chunks`}
                      {` · ${new Date(doc.created_at).toLocaleDateString('de-DE')}`}
                    </div>
                  </div>
                  <div className="kb-doc-status">
                    {doc.status === 'ready' && (
                      <span className="kb-badge kb-badge--ready">
                        <CheckCircle size={11} weight="fill" /> Bereit
                      </span>
                    )}
                    {doc.status === 'processing' && (
                      <span className="kb-badge kb-badge--processing">
                        <Spinner size={11} className="animate-spin" /> Verarbeitung
                      </span>
                    )}
                    {doc.status === 'error' && (
                      <span className="kb-badge kb-badge--error" title={doc.error_message ?? ''}>
                        <Warning size={11} weight="fill" /> Fehler
                      </span>
                    )}
                  </div>
                  <button className="kb-doc-delete" onClick={() => deleteDoc(doc.id)} aria-label="Löschen">
                    <Trash size={16} weight="fill" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
```

**Step 2: TypeScript prüfen**

```bash
cd "/c/Users/timmr/tropen OS" && npx tsc --noEmit 2>&1 | head -30
```

TS-Fehler beheben falls vorhanden.

**Step 3: Commit**

```bash
cd "/c/Users/timmr/tropen OS"
git add src/app/knowledge/page.tsx
git commit -m "feat: add /knowledge page with 3-tab UI, drag-drop upload, document list"
```

---

## Task 7: LeftNav-Link + Middleware

**Files:**
- Modify: `src/components/workspace/LeftNav.tsx`
- Modify: `src/middleware.ts`

**Step 1: LeftNav – Link nach `/projects` einfügen**

In `LeftNav.tsx` nach dem `<NavItem href="/projects" ...>` eintragen:

```tsx
<NavItem href="/knowledge" icon={<Books size={22} weight="fill" />} label="Wissen" />
```

Und den Import `Books` zu den Phosphor-Imports hinzufügen:
```tsx
import {
  Folders, ChartBar, Robot, CurrencyEur, ClipboardText,
  Users, TreePalm, SignOut, Gear, CaretDown, Plus,
  ArrowsMerge, FolderSimple, FolderOpen, Trash, Books,
} from '@phosphor-icons/react'
```

**Step 2: Middleware – /knowledge als geschützte Route bestätigen**

Die Middleware schützt bereits alle Routen außer `/` und `/auth/*`. Kein Änderungsbedarf — `/knowledge` ist automatisch geschützt.

**Step 3: TypeScript prüfen + Commit**

```bash
cd "/c/Users/timmr/tropen OS" && npx tsc --noEmit 2>&1 | head -10
git add src/components/workspace/LeftNav.tsx
git commit -m "feat: add Knowledge Base link to LeftNav"
```

---

## Checkliste: Manuell im Supabase-Dashboard

- [ ] Migration 017 ausgeführt (SQL Editor)
- [ ] RPC `search_knowledge_chunks` ausgeführt (SQL Editor)
- [ ] Storage Bucket `knowledge-files` angelegt (privat)
- [ ] Edge Functions deployed: `supabase functions deploy knowledge-ingest` + `knowledge-search`
- [ ] `OPENAI_API_KEY` in Supabase Secrets gesetzt

## End-to-End Test

1. `http://localhost:3000/workspaces/[id]` → LeftNav zeigt "Wissen"
2. `/knowledge` öffnen → Tab "Meine Dokumente" sichtbar
3. TXT-Datei hochladen → Fortschrittsbalken erscheint
4. Status wechselt zu "Verarbeitung" → nach ~5s zu "Bereit"
5. Chunk-Anzahl in der Zeile sichtbar
6. Dokument löschen → verschwindet aus der Liste
