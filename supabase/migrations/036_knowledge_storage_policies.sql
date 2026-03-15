-- 036_knowledge_storage_policies.sql
-- Erstellt den knowledge-files Storage-Bucket und setzt RLS-Policies.
-- Ohne diese Policies schlägt jeder Upload mit "new row violates row-level security policy" fehl.

-- ─── Bucket anlegen ───────────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'knowledge-files',
  'knowledge-files',
  false,
  26214400, -- 25 MB (entspricht MAX_SIZE_MB in der UI)
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
    'text/csv',
    'text/x-markdown'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- ─── Storage-Policies ────────────────────────────────────────────────────────
-- Pfad-Schema: {organization_id}/{source_id}/{filename}
-- Prüfung: erster Pfad-Abschnitt muss die eigene organization_id sein.

-- SELECT: Dateien der eigenen Org lesen
CREATE POLICY "knowledge_files_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'knowledge-files'
    AND (storage.foldername(name))[1] = (
      SELECT organization_id::text FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

-- INSERT: Upload nur in den eigenen Org-Ordner
CREATE POLICY "knowledge_files_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'knowledge-files'
    AND auth.uid() IS NOT NULL
    AND (storage.foldername(name))[1] = (
      SELECT organization_id::text FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

-- UPDATE: Upsert (bestehende Datei überschreiben) erlauben
CREATE POLICY "knowledge_files_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'knowledge-files'
    AND (storage.foldername(name))[1] = (
      SELECT organization_id::text FROM users WHERE id = auth.uid() LIMIT 1
    )
  );

-- DELETE: Dateien der eigenen Org löschen
CREATE POLICY "knowledge_files_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'knowledge-files'
    AND (storage.foldername(name))[1] = (
      SELECT organization_id::text FROM users WHERE id = auth.uid() LIMIT 1
    )
  );
