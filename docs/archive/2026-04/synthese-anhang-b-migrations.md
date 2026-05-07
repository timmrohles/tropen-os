# Anhang B — Migrations-Block
## Tropen OS — DB-Konsolidierung nach Inventur

> **Zugehörig zu:** Tag 4 Master-Synthese
> **Quellen:** Tag 1 (Bestandstabelle) + M3 (DUP-Migrations) + Tag 3 (Feature-Empfehlungen)
> **Charakter:** Operative Build-Anweisung für Claude Code

---

## Zweck

Dieser Anhang konsolidiert die DB-Migrations, die aus der Inventur folgen. Er ergänzt die Sprint-Roadmap (Anhang A) um die **technische Umsetzungs-Reihenfolge** auf DB-Ebene.

Der Block adressiert:
- Vier DUP-Cluster aus M3 (PW, Membership, Chat-Speicher, Audit-QA)
- DB-Tabellen mit Status WEGFALL, EINFRIEREN, BEHALTEN
- APPEND-ONLY-Risiken aus M1
- Migrations-Nummerierungs-Kollision (Tag 1 Befund)

---

## Migrations-Reihenfolge

Pro Sprint die zugehörigen Migrations. Reihenfolge **wichtig**, weil viele Migrations Datenabhängigkeiten haben.

| Sprint | Cluster | Migrations | Risiko |
|--------|---------|-----------|--------|
| **Sprint 0** | Hygiene | Migrations-Nummerierung-Kollision auflösen | niedrig |
| **Sprint 0** | Hygiene | Fix-Engine-Tabellen mit Feature-Flag | niedrig |
| **Sprint 1** | UI-only | (keine Migrations) | — |
| **Sprint 1** | Tasks-Schicht | BP6 — Schreibzugriff entzogen am 2026-04-28. Route + API 410. DROP TABLE audit_tasks folgt in Sprint 4. | niedrig |
| **Sprint 2** | UI-only | (keine Migrations) | — |
| **Sprint 3** | Membership | Membership-Cluster konsolidieren | mittel |
| **Sprint 3** | PW | PW-Cluster konsolidieren | hoch (APPEND ONLY) |
| **Sprint 3** | Audit-QA | Audit-QA-Cluster konsolidieren | mittel |
| **Sprint 4** | Veredler | Neue Veredler-Tabellen oder Markdown-Lösung | mittel |
| **Sprint 4** | Chat-Speicher | Chat-Speicher-Cluster konsolidieren | hoch |
| **Sprint 4** | EINFRIEREN | Workspace-Tabellen Feature-Flag-deaktiviert | niedrig |
| **Sprint 4** | AUS | Custom-Agents-Tabellen entfernen | mittel |
| **Sprint 5** | Distribution | OAuth-Token-Tabellen für GitHub | niedrig |

---

## Sprint 0 — Hygiene-Migrations

### Migrations-Nummerierung-Kollision auflösen

**Befund aus Tag 1:** `20260409000098/099` überlappen mit Epoch-6-Migrations `097–099`. Supabase trackt per Dateiname, daher technisch okay, aber bei manuellem Review verwirrend.

**Aktion:**
- `20260409000098_audit_fixes.sql` → umbenennen in `20260409100000_audit_fixes.sql`
- `20260409000099_audit_agent_source_fix.sql` → umbenennen in `20260409100001_audit_agent_source_fix.sql`
- `supabase migration repair` ausführen, um Migrations-History zu aktualisieren

**Risiko:** Wenn schon deployed, muss die migrations-history-Tabelle manuell angepasst werden.

### Fix-Engine deaktivieren

**Aktion:** Kein Schema-Wechsel, nur Feature-Flag in `.env.local`:

```
NEXT_PUBLIC_FIX_ENGINE_ENABLED=false
```

Die Tabellen `audit_fixes`, `fix_hint`, `fix_mode` bleiben in der DB. Nur die UI-Pfade und Server Actions werden vom Flag deaktiviert. Memory aus File-Damage-Vorfall: vorsichtige Stilllegung statt Löschung.

---

## Sprint 3 — Membership-Cluster

**Ziel:** workspace_participants und project_participants konsolidieren zu einem einzigen Membership-Modell.

### Aktuelle Tabellen (DUP)
- `workspace_participants` (workspace_id, user_id, role)
- `project_participants` (project_id, user_id, role)
- `workspace_members` (workspace_id, user_id, role) — neuere Version
- `project_memberships` (project_id, user_id, role) — neuere Version

### Konsolidierung

**Migration: `XXXX_consolidate_memberships.sql`**

```sql
-- Eine einheitliche Membership-Tabelle
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_type TEXT NOT NULL CHECK (scope_type IN ('workspace', 'project')),
  scope_id UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(scope_type, scope_id, user_id)
);

-- Daten migrieren
INSERT INTO memberships (scope_type, scope_id, user_id, role, created_at)
SELECT 'workspace', workspace_id, user_id, role, created_at
FROM workspace_members
ON CONFLICT DO NOTHING;

INSERT INTO memberships (scope_type, scope_id, user_id, role, created_at)
SELECT 'project', project_id, user_id, role, created_at
FROM project_memberships
ON CONFLICT DO NOTHING;

-- RLS-Policies
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_see_own_memberships" ON memberships
  FOR SELECT USING (user_id = auth.uid());

-- Alte Tabellen NICHT droppen — Sprint 4
```

**Risiko:** Wenn aktive User auf alten Tabellen-Schemas sind, kann Down-Time entstehen. Lösung: Beide Schemas parallel laufen lassen, im Code via Feature-Flag umschalten.

---

## Sprint 3 — PW-Cluster

**Ziel:** Sechs Tabellen für Projekt-Wissen (Knowledge Entries, Card History, Project Memory, Dept Knowledge, Knowledge Sources, Knowledge Source Documents) auf eine einzige `project_memory` mit `scope`-Spalte konsolidieren.

### Aktuelle Tabellen (DUP)
- `project_memory` — APPEND ONLY (Memory-Extraktion aus Konversationen)
- `card_history` — APPEND ONLY (Card-Versionshistorie)
- `knowledge_entries` — RAG-Einträge mit Embeddings
- `knowledge_sources` — Quellen für Knowledge-Pipeline
- `knowledge_source_documents` — Dokumente pro Quelle
- `dept_knowledge` — Department-Knowledge

### Konsolidierungs-Strategie

**Wichtig:** APPEND-ONLY-Tabellen können NICHT geleert und neu befüllt werden. Stattdessen:

1. **Neue Spalte `scope` auf `project_memory` ergänzen** (memory_type war schon da, wird erweitert):

```sql
-- Migration: XXXX_project_memory_scope.sql
ALTER TABLE project_memory
  ADD COLUMN scope TEXT NOT NULL DEFAULT 'memory'
  CHECK (scope IN ('memory', 'card_version', 'knowledge_entry', 'knowledge_source', 'dept_knowledge'));

-- Index für schnelle Filter
CREATE INDEX idx_project_memory_scope ON project_memory(project_id, scope);
```

2. **Daten aus alten Tabellen schreiben in `project_memory` mit entsprechendem scope:**

```sql
-- card_history → project_memory mit scope='card_version'
INSERT INTO project_memory (project_id, scope, content, metadata, created_at)
SELECT 
  c.project_id,
  'card_version' AS scope,
  ch.snapshot AS content,
  jsonb_build_object('card_id', ch.card_id, 'version', ch.version) AS metadata,
  ch.created_at
FROM card_history ch
JOIN cards c ON c.id = ch.card_id;

-- knowledge_entries → project_memory mit scope='knowledge_entry'
-- Embeddings bleiben in einer separaten knowledge_embeddings-Tabelle
INSERT INTO project_memory (project_id, scope, content, metadata, created_at)
SELECT 
  project_id,
  'knowledge_entry' AS scope,
  content,
  jsonb_build_object('source_id', source_id, 'embedding_id', id) AS metadata,
  created_at
FROM knowledge_entries;
```

3. **Alte Tabellen bleiben liegen, werden read-only** (im Code keine INSERT/UPDATE mehr):

```sql
-- Schreibrechte entziehen
REVOKE INSERT, UPDATE, DELETE ON card_history FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON knowledge_entries FROM authenticated;
-- usw.
```

4. **In Sprint 4 oder später:** Wenn keine Code-Pfade mehr auf die alten Tabellen zugreifen, droppen.

**Risiko:** Embeddings sind groß (768-dim Vektoren). Sie sollten **nicht** in `project_memory.content` liegen, sondern in separater `project_memory_embeddings`-Tabelle mit FK zu `project_memory.id`.

```sql
CREATE TABLE project_memory_embeddings (
  project_memory_id UUID PRIMARY KEY REFERENCES project_memory(id) ON DELETE CASCADE,
  embedding vector(768),
  -- weitere Metadaten
);
```

---

## Sprint 3 — Audit-QA-Cluster

**Ziel:** `qa_metrics`, `qa_lighthouse_runs`, `qa_compliance_checks` konsolidieren zu `audit_runs`/`audit_findings`.

### Aktuelle Tabellen (DUP)
- `qa_metrics` — Performance/Quality-Metriken
- `qa_lighthouse_runs` — Lighthouse-Run-Ergebnisse
- `qa_compliance_checks` — Compliance-Checks
- `audit_runs` — Audit-Run-Container (neuer)
- `audit_findings` — Findings (neuer)

### Konsolidierung

Daten aus `qa_*` in `audit_runs`/`audit_findings` migrieren mit `agent_source` als Marker:

```sql
-- qa_lighthouse_runs → audit_findings mit agent_source='lighthouse'
INSERT INTO audit_findings (run_id, agent_source, rule_id, severity, message, ...)
SELECT 
  -- Ein neuer audit_run pro qa_lighthouse_run
  audit_runs.id, 
  'lighthouse',
  ...
FROM qa_lighthouse_runs;
```

**Risiko:** Datenmenge potenziell groß. Migration in Batches á 1.000 Zeilen.

---

## Sprint 4 — Veredler-Tabellen

**Ziel:** Veredler-Datenmodell aus M1 umsetzen.

### Option A: Eigene Tabellen (klassisch)

```sql
-- Migration: XXXX_veredler_tables.sql
CREATE TABLE veredler_classifier_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  pattern TEXT NOT NULL,
  depth INT NOT NULL CHECK (depth IN (1, 2, 3)),
  is_active BOOLEAN DEFAULT true,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE veredler_tool_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_name TEXT NOT NULL UNIQUE, -- 'lovable', 'cursor', 'claude_code', 'bolt'
  prompt_conventions TEXT,
  schema_expectations JSONB,
  limits JSONB,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE veredler_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  classifier_depth INT NOT NULL,
  tool_profile_id UUID REFERENCES veredler_tool_profiles(id),
  input_text TEXT NOT NULL,
  enriched_output JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
  -- APPEND ONLY
);

ALTER TABLE veredler_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_see_own_log" ON veredler_log
  FOR SELECT USING (user_id = auth.uid());
```

### Option B: Markdown-only (gemäß ADR-022)

Kein Schema-Wechsel. Tool-Profile als Markdown-Einträge in `project_memory` mit `scope='tool_profile'`:

```sql
-- Kein neues Schema, nur Convention im Code
INSERT INTO project_memory (project_id, scope, content, metadata, created_at)
VALUES (NULL, 'tool_profile', '<markdown>', jsonb_build_object('tool', 'lovable'), now());
```

**Empfehlung:** Option B testen mit Tool-Profiles, Option A für `veredler_log` (APPEND ONLY für Klassifikator-Lernen).

---

## Sprint 4 — Chat-Speicher-Cluster

**Ziel:** `workspace_messages` + `workspace_comments` zu `messages` mit `context_type` konsolidieren.

```sql
ALTER TABLE messages
  ADD COLUMN context_type TEXT DEFAULT 'chat'
  CHECK (context_type IN ('chat', 'workspace', 'comment', 'card_chat'));

-- workspace_messages → messages
INSERT INTO messages (conversation_id, content, role, context_type, ...)
SELECT 
  conversation_id, content, role, 'workspace', ...
FROM workspace_messages;

-- workspace_comments → messages
INSERT INTO messages (conversation_id, content, role, context_type, ...)
SELECT 
  conversation_id, content, 'user', 'comment', ...
FROM workspace_comments;
```

---

## Sprint 4 — EINFRIEREN (Workspace-Tabellen)

**Ziel:** Workspace-Tabellen via Feature-Flag deaktivieren, aber im Schema lassen.

**Aktion:**
- Schema bleibt
- RLS-Policies bleiben
- Code-Pfade prüfen `NEXT_PUBLIC_WORKSPACES_ENABLED=false`
- UI-Routes `/workspaces/*` werden zu 404

**Risiko:** Wenn aktive User Workspaces nutzen, müssen die Daten erhalten bleiben. RLS-Policies bleiben aktiv, damit kein Daten-Leak.

---

## Sprint 4 — AUS (Custom-Agents)

**Ziel:** Custom-Agents-Tabellen entfernen.

**Vorbedingung:** L2-Gespräche bestätigen, dass Custom Agents im Solo-MVP nicht genutzt werden. **Wenn unsicher: einfrieren statt entfernen.**

```sql
-- Migration: XXXX_drop_custom_agents.sql
-- ACHTUNG: Irreversible Operation. Backup vor Ausführung.

DROP TABLE agent_runs CASCADE; -- APPEND ONLY, aber wenn AUS, dann weg
DROP TABLE agent_skills CASCADE;
DROP TABLE agents CASCADE;
```

**Empfehlung:** Stattdessen Feature-Flag und Rückbau in Phase 2 entscheiden.

---

## Sprint 5 — Distribution

**Ziel:** OAuth-Token-Tabellen für GitHub-Integration.

```sql
CREATE TABLE github_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  access_token TEXT NOT NULL, -- encrypted at rest
  refresh_token TEXT, -- encrypted at rest
  expires_at TIMESTAMPTZ,
  scope TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE github_oauth_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_only_own_tokens" ON github_oauth_tokens
  FOR ALL USING (user_id = auth.uid());
```

---

## Migrations-Risiko-Übersicht

| Migration | Risiko | Mitigation |
|-----------|--------|----------|
| Membership-Konsolidierung | Mittel — Down-Time möglich | Parallele Schemas via Feature-Flag |
| PW-Cluster (APPEND ONLY) | Hoch — keine Reversibilität | Alte Tabellen liegen lassen, nur Schreibrechte entziehen |
| Audit-QA-Konsolidierung | Mittel — Datenmenge | Batch-Migration á 1.000 Zeilen |
| Veredler-Tabellen | Niedrig — neue Tabellen | Option B (Markdown) als Fallback |
| Chat-Speicher-Konsolidierung | Hoch — APPEND ONLY | Schreibrechte entziehen, Daten parallel führen |
| EINFRIEREN (Workspace) | Niedrig — Schema bleibt | Feature-Flag testen |
| AUS (Custom-Agents) | Mittel — irreversibel | **Vor DROP: L2-Validierung abwarten** |

---

## Was nach Sprint 5 kommt

**Phase-2-Vorbereitung (wenn KMU-Markt relevant wird):**
- Workspace-Feature-Flag wieder aktivieren
- Custom Agents — Code wiederherstellen wenn nicht gedroppt
- Library-UI als KMU-Verwaltungs-Interface bauen

Diese Migrations gehören in eine separate Roadmap, nicht in dieses Dokument.

---

## CLAUDE-CODE-spezifische Anweisungen

Vor jeder Migration:
- ARCHITECT.md-Review durchführen
- RLS in derselben Migration definieren (nicht später)
- Migration **reversibel** schreiben wo möglich (DROP-Statements als Kommentar)
- Bei APPEND-ONLY-Tabellen: kein UPDATE/DELETE, immer INSERT
- Migrations-Nummer immer im Timestamp-Format `YYYYMMDDHHMMSS_name.sql`

Nach jeder Migration:
- `supabase db push` lokal testen
- Feature-Flags in `.env.example` dokumentieren
- CLAUDE.md Migrations-Übersicht aktualisieren
- `docs/architect-log.md` ergänzen
