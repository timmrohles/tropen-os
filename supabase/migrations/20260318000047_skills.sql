-- Plan J2a — Skills System
-- skills-Tabelle + agent_skills + RLS + Seed
-- Option C: Skills sind eigenständig (keine Verbindung zu Capabilities)
-- Capabilities = Modell-Routing für Chat; Skills = inhaltliche Anweisungen für Agenten

-- ============================================================
-- 1. skills Tabelle
-- ============================================================
CREATE TABLE IF NOT EXISTS public.skills (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identität
  name             TEXT NOT NULL,                           -- machine-name: 'deep_analysis'
  title            TEXT NOT NULL,                           -- UI-Label: 'Tiefenanalyse'
  description      TEXT,

  -- Sichtbarkeit (analog zu capabilities.scope)
  scope            TEXT NOT NULL DEFAULT 'user'
                   CHECK (scope IN ('system','package','org','user')),
  organization_id  UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id          UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  requires_package TEXT,                                    -- z.B. 'marketing'

  -- Inhalt
  instructions     TEXT NOT NULL,                           -- System-Prompt-Erweiterung für Agenten
  context_requirements TEXT,                                -- Was der Agent als Input braucht
  governance_rules     TEXT,                                -- DSGVO/Compliance-Hinweise
  quality_criteria     TEXT,                                -- Was gute Ergebnisse ausmacht
  input_schema     JSONB DEFAULT '{}',                      -- erwartete Input-Struktur
  output_type      TEXT NOT NULL DEFAULT 'text'
                   CHECK (output_type IN ('text','json','artifact','notification')),
  trigger_keywords TEXT[] DEFAULT '{}',                     -- Keywords für Toro-Erkennung

  -- Kontrolle
  is_active        BOOLEAN NOT NULL DEFAULT true,
  is_template      BOOLEAN NOT NULL DEFAULT false,          -- Vorlage zum Kopieren
  version          INTEGER NOT NULL DEFAULT 1,

  -- Herkunft
  created_by_role  TEXT NOT NULL DEFAULT 'superadmin'
                   CHECK (created_by_role IN ('superadmin','org_admin','member','toro')),
  source_skill_id  UUID REFERENCES public.skills(id) ON DELETE SET NULL,

  -- Soft Delete
  deleted_at       TIMESTAMPTZ,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_skills_scope        ON public.skills(scope) WHERE deleted_at IS NULL;
CREATE INDEX idx_skills_org          ON public.skills(organization_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_skills_user         ON public.skills(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_skills_active       ON public.skills(is_active) WHERE deleted_at IS NULL;

-- ============================================================
-- 2. agent_skills — Join-Tabelle
-- ============================================================
CREATE TABLE IF NOT EXISTS public.agent_skills (
  agent_id  UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  skill_id  UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  priority  INTEGER NOT NULL DEFAULT 0,          -- höhere Zahl = höhere Priorität
  PRIMARY KEY (agent_id, skill_id)
);

CREATE INDEX idx_agent_skills_agent ON public.agent_skills(agent_id);
CREATE INDEX idx_agent_skills_skill ON public.agent_skills(skill_id);

-- ============================================================
-- 3. RLS
-- ============================================================
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_skills ENABLE ROW LEVEL SECURITY;

-- skills SELECT: system-Skills für alle · org-Skills für eigene Org · user-Skills für eigenen User
-- package-Skills nur wenn Org das Paket hat (vereinfacht: sichtbar wie org-Skills, API filtert nach Paket)
CREATE POLICY "skills_select" ON public.skills FOR SELECT
  USING (
    deleted_at IS NULL
    AND (
      scope = 'system'
      OR (scope = 'package')                                -- API-Layer prüft requires_package
      OR (scope = 'org' AND organization_id IN (
        SELECT organization_id FROM public.users WHERE id = auth.uid()
      ))
      OR (scope = 'user' AND user_id = auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin'
      )
    )
  );

CREATE POLICY "skills_insert" ON public.skills FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
      -- user-scope: jeder eingeloggte User
      (scope = 'user' AND user_id = auth.uid())
      -- org-scope: nur org_admin oder owner
      OR (scope = 'org' AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
          AND organization_id = skills.organization_id
          AND role IN ('owner','admin')
      ))
      -- system/package: nur superadmin (API-Guard)
      OR EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin'
      )
    )
  );

CREATE POLICY "skills_update" ON public.skills FOR UPDATE
  USING (
    deleted_at IS NULL
    AND (
      (scope = 'user' AND user_id = auth.uid())
      OR (scope = 'org' AND EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid()
          AND organization_id = skills.organization_id
          AND role IN ('owner','admin')
      ))
      OR EXISTS (
        SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin'
      )
    )
  );

CREATE POLICY "skills_delete" ON public.skills FOR DELETE
  USING (
    (scope = 'user' AND user_id = auth.uid())
    OR (scope = 'org' AND EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid()
        AND organization_id = skills.organization_id
        AND role IN ('owner','admin')
    ))
    OR EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- agent_skills: Sichtbarkeit über agent-RLS delegiert
-- User kann agent_skills sehen/verwalten wenn sie den Agenten besitzen
CREATE POLICY "agent_skills_select" ON public.agent_skills FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.id = agent_skills.agent_id
        AND (
          a.user_id = auth.uid()
          OR (a.visibility = 'org' AND a.organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
          ))
          OR EXISTS (
            SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'superadmin'
          )
        )
    )
  );

CREATE POLICY "agent_skills_insert" ON public.agent_skills FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.id = agent_skills.agent_id AND a.user_id = auth.uid()
    )
  );

CREATE POLICY "agent_skills_delete" ON public.agent_skills FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.agents a
      WHERE a.id = agent_skills.agent_id AND a.user_id = auth.uid()
    )
  );

-- ============================================================
-- 4. Seed: System-Skills
-- ============================================================
INSERT INTO public.skills
  (name, title, description, scope, instructions, context_requirements,
   governance_rules, quality_criteria, output_type, trigger_keywords,
   is_active, is_template, created_by_role)
VALUES
  (
    'deep_analysis',
    'Tiefenanalyse',
    'Gründliche inhaltliche Analyse von Texten, Artikeln und Dokumenten',
    'system',
    'Analysiere den gegebenen Inhalt gründlich und strukturiert. '
    'Identifiziere Kernaussagen, Argumente und Belege. '
    'Erkenne Stärken, Schwächen und blinde Flecken im Argument. '
    'Bewerte Relevanz für den Org-Kontext wenn vorhanden. '
    'Strukturiere deine Analyse: 1) Kernaussage 2) Argumente 3) Kritische Bewertung 4) Relevanz.',
    'Vollständiger Text oder URL des zu analysierenden Inhalts',
    'Keine personenbezogenen Daten in der Analyse speichern. Quellen korrekt zitieren.',
    'Analyse ist spezifisch und substanziell. Keine allgemeinen Platitüden. Mindestens 3 konkrete Punkte.',
    'text',
    ARRAY['analysiere', 'analyse', 'bewerte', 'untersuche', 'prüfe'],
    true, true, 'superadmin'
  ),
  (
    'summarize',
    'Zusammenfassung',
    'Komprimierung langer Texte auf das Wesentliche',
    'system',
    'Fasse den gegebenen Inhalt präzise zusammen. '
    'Behalte alle wichtigen Fakten und Kernaussagen. '
    'Entferne Wiederholungen und Füllwörter. '
    'Ziel: maximale Informationsdichte bei minimaler Länge. '
    'Format: 3-5 Stichpunkte oder 2-3 kompakte Absätze je nach Kontext.',
    'Vollständiger Text der zusammengefasst werden soll',
    NULL,
    'Zusammenfassung enthält alle wesentlichen Punkte. Keine wichtigen Fakten fehlen.',
    'text',
    ARRAY['zusammenfassen', 'zusammenfassung', 'überblick', 'kürze', 'fasse zusammen'],
    true, true, 'superadmin'
  ),
  (
    'market_watch',
    'Marktbeobachtung',
    'Wettbewerber, Trends und Marktveränderungen erkennen und einordnen',
    'system',
    'Beobachte und analysiere Marktentwicklungen mit strategischem Blick. '
    'Identifiziere: Neue Wettbewerber oder Marktbewegungen, Technologie-Trends, '
    'Veränderte Kundenbedürfnisse, Regulatorische Entwicklungen. '
    'Bewerte jede Entwicklung nach: Relevanz (1-5), Dringlichkeit (hoch/mittel/niedrig), '
    'empfohlene Reaktion. Fokus auf KMU-relevante Erkenntnisse.',
    'Aktuelle Nachrichten, Feed-Items oder Marktdaten als Input',
    'Keine Prognosen als Fakten darstellen. Unsicherheiten explizit kennzeichnen.',
    'Konkrete, handlungsorientierte Erkenntnisse. Kein allgemeines Markt-Rauschen.',
    'text',
    ARRAY['markt', 'wettbewerb', 'trend', 'konkurrenz', 'branche', 'industrie'],
    true, true, 'superadmin'
  ),
  (
    'knowledge_extract',
    'Wissensextraktion',
    'Strukturierte Extraktion von Fakten, Entitäten und Erkenntnissen',
    'system',
    'Extrahiere strukturiertes Wissen aus dem gegebenen Inhalt. '
    'Identifiziere und extrahiere: Schlüsselfakten mit Quellenangabe, '
    'Wichtige Personen/Unternehmen/Produkte, Daten und Zahlen, '
    'Kausale Zusammenhänge, Offene Fragen oder Wissenslücken. '
    'Ausgabe als strukturierte Liste, bereit zur Speicherung in der Wissenbasis.',
    'Text aus dem Wissen extrahiert werden soll',
    'PII nur extrahieren wenn für Org-Kontext relevant und DSGVO-konform.',
    'Fakten sind verifizierbar. Extraktion vollständig und duplikatfrei.',
    'json',
    ARRAY['extrahiere', 'speichere', 'lerne', 'merke', 'wissen'],
    true, true, 'superadmin'
  ),
  (
    'report_write',
    'Berichterstellung',
    'Professionelle Berichte aus strukturierten Daten und Analysen erstellen',
    'system',
    'Erstelle einen professionellen, strukturierten Bericht. '
    'Struktur: Executive Summary (max 3 Sätze), Hintergrund, '
    'Hauptbefunde (mit Daten belegt), Schlussfolgerungen, Empfehlungen. '
    'Ton: sachlich, präzise, handlungsorientiert. '
    'Zielgruppe: Führungskräfte in KMU — kein Fachjargon ohne Erklärung. '
    'Länge: so kurz wie möglich, so lang wie nötig.',
    'Analysierte Daten, Befunde oder vorherige Analyse-Ergebnisse als Input',
    'Keine ungesicherten Behauptungen als Fakten darstellen.',
    'Bericht ist eigenständig lesbar ohne Hintergrundwissen. Klare Handlungsempfehlungen.',
    'artifact',
    ARRAY['bericht', 'report', 'dokumentiere', 'erstelle', 'schreibe'],
    true, true, 'superadmin'
  ),
  (
    'social_media_adapt',
    'Social-Media-Adaption',
    'Inhalte für verschiedene Social-Media-Plattformen aufbereiten',
    'package',
    'Adaptiere den gegebenen Inhalt für Social Media. '
    'Erstelle Varianten für: LinkedIn (professionell, 1300 Zeichen), '
    'Instagram (visuell, Hook-first, 2200 Zeichen + Hashtags), '
    'Twitter/X (prägnant, max 280 Zeichen). '
    'Jede Variante hat: starker Einstieg, Kernbotschaft, Call-to-Action. '
    'Ton je Plattform anpassen. Keine generischen Posts.',
    'Zu adaptierender Inhalt (Blogartikel, Report, Ankündigung)',
    NULL,
    'Jede Plattform-Variante fühlt sich plattform-nativ an. Kein copy-paste.',
    'text',
    ARRAY['social media', 'linkedin', 'instagram', 'twitter', 'post', 'plattform'],
    true, true, 'superadmin'
  )
ON CONFLICT DO NOTHING;

-- social_media_adapt ist ein Marketing-Paket-Skill
UPDATE public.skills
SET requires_package = 'marketing'
WHERE name = 'social_media_adapt';
