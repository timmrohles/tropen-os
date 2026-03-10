-- 017_rag_foundation.sql
-- RAG: pgvector Extension + 4 Tabellen + RLS + Index

-- pgvector aktivieren (falls nicht vorhanden)
create extension if not exists vector;

-- ─── knowledge_sources ───────────────────────────────────────────────────────
create table knowledge_sources (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete cascade,
  project_id      uuid references projects(id) on delete cascade,
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
  file_type       text,
  file_size       bigint,
  storage_path    text,
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

-- ─── Index für Ähnlichkeitssuche ─────────────────────────────────────────────
create index knowledge_chunks_embedding_idx
  on knowledge_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

create index knowledge_documents_source_idx on knowledge_documents(source_id);
create index knowledge_chunks_document_idx  on knowledge_chunks(document_id);
create index knowledge_chunks_org_idx       on knowledge_chunks(organization_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
alter table knowledge_sources   enable row level security;
alter table knowledge_documents enable row level security;
alter table knowledge_chunks    enable row level security;
alter table knowledge_citations enable row level security;

create or replace function user_org_id()
returns uuid language sql stable as $$
  select organization_id from users where id = auth.uid()
$$;

-- knowledge_sources
create policy "knowledge_sources_select" on knowledge_sources
  for select using (organization_id = user_org_id());
create policy "knowledge_sources_insert" on knowledge_sources
  for insert with check (organization_id = user_org_id() and (user_id is null or user_id = auth.uid()));
create policy "knowledge_sources_update" on knowledge_sources
  for update using (organization_id = user_org_id() and (user_id is null or user_id = auth.uid()));
create policy "knowledge_sources_delete" on knowledge_sources
  for delete using (organization_id = user_org_id() and (user_id is null or user_id = auth.uid()));

-- knowledge_documents
create policy "knowledge_documents_select" on knowledge_documents
  for select using (organization_id = user_org_id());
create policy "knowledge_documents_insert" on knowledge_documents
  for insert with check (organization_id = user_org_id() and (user_id is null or user_id = auth.uid()));
create policy "knowledge_documents_update" on knowledge_documents
  for update using (organization_id = user_org_id() and (user_id is null or user_id = auth.uid()));
create policy "knowledge_documents_delete" on knowledge_documents
  for delete using (organization_id = user_org_id() and (user_id is null or user_id = auth.uid()));

-- knowledge_chunks (nur SELECT für normale User, Ingest via Service Role)
create policy "knowledge_chunks_select" on knowledge_chunks
  for select using (organization_id = user_org_id());

-- knowledge_citations
create policy "knowledge_citations_select" on knowledge_citations
  for select using (
    exists (
      select 1 from messages m
      join conversations c on c.id = m.conversation_id
      where m.id = knowledge_citations.message_id
        and c.user_id = auth.uid()
    )
  );

-- ─── RPC: Vektor-Ähnlichkeitssuche ───────────────────────────────────────────
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
