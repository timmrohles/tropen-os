-- 20260319000056_library_seed.sql
-- Seed library system: system roles (5), package roles (from package_agents migration),
-- update existing skills with new columns

BEGIN;

-- ============================================================
-- 1. System Roles (5)
-- ============================================================
INSERT INTO public.roles
  (name, label, icon, description, scope,
   system_prompt, domain_keywords, vocabulary,
   preferred_capability_types, preferred_skill_names, preferred_outcome_types,
   recommended_model_class, is_active, is_default, sort_order, created_by_role)
VALUES
  ('generalist', 'Generalist', '🦜',
   'Standard-Toro — allgemein und vielseitig',
   'system',
   'Du bist Toro, ein hilfreicher KI-Assistent von Tropen OS. Du unterstützt Teams bei ihrer täglichen Wissensarbeit. Antworte präzise, freundlich und auf Deutsch.',
   '{}', '{}',
   ARRAY['chat','search','writing'], '{}', ARRAY['text','email'],
   'fast', TRUE, TRUE, 1, 'superadmin'),

  ('strategist', 'Stratege', '🏛️',
   'Unternehmensstrategie, Geschäftsmodelle, OKRs',
   'system',
   'Du bist ein erfahrener Unternehmensberater mit Fokus auf Strategie und Geschäftsmodelle. Du denkst in Systemen, Märkten und langen Zeiträumen. Du nutzt Frameworks wie Porter, SWOT, OKR und BCG-Matrix wenn sie nützlich sind — aber erklärst sie nie um ihrer selbst willen. Du stellst immer die Frage: Was ist das eigentliche Ziel? Antworte präzise, strukturiert und auf Deutsch.',
   ARRAY['strategie','geschäftsmodell','okr','markt','wettbewerb','positionierung'],
   ARRAY['SWOT','OKR','KPI','Marktanteil','Positionierung','Value Proposition'],
   ARRAY['reasoning','search'], ARRAY['strategic-analysis'], ARRAY['report','action_plan'],
   'deep', TRUE, FALSE, 2, 'superadmin'),

  ('analyst', 'Analyst', '📊',
   'Daten, Zahlen, Marktforschung, KPIs',
   'system',
   'Du bist ein datengetriebener Analyst. Du denkst in Zahlen, Trends und Kausalitäten. Du hinterfragst Annahmen, forderst Belege und quantifizierst wo möglich. Antworte mit konkreten Zahlen und Quellen wo verfügbar. Auf Deutsch.',
   ARRAY['daten','analyse','statistik','zahlen','kpi','metriken','trends'],
   ARRAY['Signifikanz','Korrelation','CAGR','Konfidenzintervall'],
   ARRAY['data','search','reasoning'], ARRAY['data-analysis'], ARRAY['table','chart','report'],
   'deep', TRUE, FALSE, 3, 'superadmin'),

  ('communicator', 'Kommunikator', '✍️',
   'Texte, Präsentationen, interne Kommunikation',
   'system',
   'Du bist ein erfahrener Kommunikationsexperte. Du schreibst klar, präzise und zielgruppengerecht. Du passt Ton und Stil an den Kontext an — von formell bis informell. Du fragst nach Zielgruppe und gewünschtem Ton bevor du schreibst. Auf Deutsch.',
   ARRAY['text','schreiben','kommunikation','email','präsentation','brief'],
   ARRAY['Tonalität','Zielgruppe','Call-to-Action','Headline'],
   ARRAY['writing','document'], ARRAY['email-writing','report-writing'], ARRAY['text','email','presentation'],
   'deep', TRUE, FALSE, 4, 'superadmin'),

  ('project_manager', 'Projektmanager', '📋',
   'Planung, Meilensteine, Ressourcen, Risiken',
   'system',
   'Du bist ein strukturierter Projektmanager. Du denkst in Arbeitspaketen, Abhängigkeiten und Risiken. Du erstellst klare Aktionspläne mit Verantwortlichen und Terminen. Du fragst immer nach Scope, Ressourcen und Deadline bevor du planst. Auf Deutsch.',
   ARRAY['projekt','planung','meilenstein','ressourcen','risiko','timeline'],
   ARRAY['Meilenstein','Deliverable','Stakeholder','RACI','Critical Path','Sprint'],
   ARRAY['reasoning','writing'], ARRAY['project-planning'], ARRAY['action_plan','table'],
   'fast', TRUE, FALSE, 5, 'superadmin')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. Package Roles — Marketing (migrate from package_agents)
-- ============================================================
INSERT INTO public.roles
  (name, label, icon, description, scope, requires_package,
   system_prompt, domain_keywords, vocabulary,
   preferred_capability_types, preferred_skill_names, preferred_outcome_types,
   recommended_model_class, is_active, sort_order, created_by_role)
SELECT
  lower(regexp_replace(
    trim(regexp_replace(pa.name, '^[^\w\s]+\s*', '', 'g')),
    '\s+', '_', 'g'
  )) AS name,
  pa.name                AS label,
  split_part(pa.name, ' ', 1) AS icon,
  pa.description,
  'package'              AS scope,
  p.slug                 AS requires_package,
  pa.system_prompt,
  '{}'::TEXT[]           AS domain_keywords,
  '{}'::TEXT[]           AS vocabulary,
  ARRAY['writing','search'] AS preferred_capability_types,
  '{}'::TEXT[]           AS preferred_skill_names,
  ARRAY['text','report'] AS preferred_outcome_types,
  'deep'                 AS recommended_model_class,
  TRUE                   AS is_active,
  pa.display_order       AS sort_order,
  'superadmin'           AS created_by_role
FROM public.package_agents pa
JOIN public.packages p ON p.id = pa.package_id
WHERE p.slug = 'marketing'
  AND NOT EXISTS (
    SELECT 1 FROM public.roles r
    WHERE r.requires_package = p.slug
      AND r.scope = 'package'
      AND r.label = pa.name
  );

-- ============================================================
-- 3. Update existing system skills with new columns
-- ============================================================
UPDATE public.skills SET
  icon = '🔍', sort_order = 1, recommended_role_name = 'analyst',
  recommended_capability_type = 'search'
WHERE (name = 'competitor_analysis' OR name = 'deep_analysis') AND scope = 'system';

UPDATE public.skills SET
  icon = '📝', sort_order = 2, recommended_role_name = 'communicator',
  recommended_capability_type = 'writing'
WHERE name = 'summarize' AND scope = 'system';

UPDATE public.skills SET
  icon = '📊', sort_order = 3, recommended_role_name = 'analyst',
  recommended_capability_type = 'search'
WHERE name = 'market_watch' AND scope = 'system';

UPDATE public.skills SET
  icon = '🧩', sort_order = 4, recommended_role_name = 'analyst',
  recommended_capability_type = 'document'
WHERE name = 'knowledge_extract' AND scope = 'system';

UPDATE public.skills SET
  icon = '📄', sort_order = 5, recommended_role_name = 'communicator',
  recommended_capability_type = 'writing'
WHERE name = 'report_write' AND scope = 'system';

UPDATE public.skills SET
  icon = '📱', sort_order = 1, recommended_role_name = 'marketing_expert',
  recommended_capability_type = 'writing'
WHERE name = 'social_media_adapt';

-- ============================================================
-- 4. Seed new system skills (3)
-- ============================================================
INSERT INTO public.skills
  (name, title, icon, description, scope,
   instructions, quality_criteria, output_type,
   trigger_keywords, recommended_role_name, recommended_capability_type,
   is_active, sort_order, created_by_role)
VALUES
  ('competitor_analysis', 'Wettbewerbsanalyse', '🔍',
   'Strukturierte Analyse von Wettbewerbern und Marktpositionierung',
   'system',
   'Schritt 1: Identifiziere die 3-5 relevantesten Wettbewerber basierend auf dem Kontext.' || chr(10) ||
   'Schritt 2: Analysiere für jeden Wettbewerber: Positionierung, Stärken, Schwächen, Preismodell.' || chr(10) ||
   'Schritt 3: Identifiziere Marktlücken und Differenzierungspotenziale.' || chr(10) ||
   'Schritt 4: Leite 3 konkrete Handlungsempfehlungen ab.',
   'Mind. 3 Wettbewerber analysiert. Quellen angegeben. Konkrete Handlungsempfehlungen.',
   'text',
   ARRAY['wettbewerb','konkurrenz','markt','positionierung','competitor'],
   'analyst', 'search', TRUE, 1, 'superadmin'),

  ('meeting_summary', 'Meeting-Protokoll', '📝',
   'Strukturiertes Protokoll aus Gesprächsnotizen oder Chat-Verlauf',
   'system',
   'Schritt 1: Extrahiere alle besprochenen Themen.' || chr(10) ||
   'Schritt 2: Identifiziere Entscheidungen die getroffen wurden.' || chr(10) ||
   'Schritt 3: Liste alle Aufgaben mit Verantwortlichen und Deadlines.' || chr(10) ||
   'Schritt 4: Notiere offene Fragen für das nächste Meeting.',
   'Alle Entscheidungen erfasst. Alle Aufgaben mit Verantwortlichen. Offene Punkte dokumentiert.',
   'text',
   ARRAY['meeting','protokoll','zusammenfassung','besprechung','notes'],
   'project_manager', 'document', TRUE, 2, 'superadmin'),

  ('weekly_digest', 'Wöchentliche Zusammenfassung', '📅',
   'Kompakte Zusammenfassung der wichtigsten Entwicklungen der Woche',
   'system',
   'Schritt 1: Identifiziere die 5 wichtigsten Entwicklungen/Ereignisse.' || chr(10) ||
   'Schritt 2: Bewerte ihre Relevanz für das Geschäft (hoch/mittel/niedrig).' || chr(10) ||
   'Schritt 3: Leite 3 konkrete Empfehlungen für die nächste Woche ab.' || chr(10) ||
   'Schritt 4: Notiere was beobachtet werden sollte.',
   'Max 500 Wörter. 5 Entwicklungen. 3 Empfehlungen. Handlungsorientiert.',
   'text',
   ARRAY['woche','digest','zusammenfassung','überblick','weekly'],
   'analyst', 'search', TRUE, 3, 'superadmin')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 5. Package Skills — Marketing (3)
-- ============================================================
INSERT INTO public.skills
  (name, title, icon, description, scope, requires_package,
   instructions, quality_criteria, output_type,
   trigger_keywords, recommended_role_name, recommended_capability_type,
   is_active, sort_order, created_by_role)
VALUES
  ('campaign_planning', 'Kampagnenplanung', '🎯',
   'Strukturierter Kampagnenplan von Ziel bis Kanal',
   'package', 'marketing',
   'Schritt 1: Kläre Ziel (Awareness/Lead/Conversion), Budget und Zeitraum.' || chr(10) ||
   'Schritt 2: Definiere Zielgruppe mit Persona und Pain Points.' || chr(10) ||
   'Schritt 3: Entwickle Kernbotschaft und Value Proposition.' || chr(10) ||
   'Schritt 4: Wähle Kanäle und Formate basierend auf Zielgruppe.' || chr(10) ||
   'Schritt 5: Definiere KPIs und Erfolgsmessung.',
   'Klares Ziel definiert. Zielgruppe beschrieben. Kanäle begründet. KPIs messbar.',
   'text',
   ARRAY['kampagne','campaign','launch','marketing','plan'],
   'marketing_expert', 'reasoning', TRUE, 1, 'superadmin'),

  ('brand_voice', 'Brand Voice', '🎨',
   'Markenstimme entwickeln und dokumentieren',
   'package', 'marketing',
   'Schritt 1: Analysiere bestehende Texte auf Muster (falls vorhanden).' || chr(10) ||
   'Schritt 2: Definiere Persönlichkeit: 3-5 Adjektive die die Marke beschreiben.' || chr(10) ||
   'Schritt 3: Lege Ton fest: formell/informell, sachlich/emotional.' || chr(10) ||
   'Schritt 4: Erstelle Dos und Don''ts mit Beispielen.' || chr(10) ||
   'Schritt 5: Schreibe 3 Beispieltexte in der definierten Brand Voice.',
   'Persönlichkeit definiert. Ton klar beschrieben. Dos/Don''ts mit Beispielen. Praxistauglich.',
   'text',
   ARRAY['brand','marke','stimme','tone','voice','stil'],
   'marketing_expert', 'writing', TRUE, 2, 'superadmin'),

  ('newsletter_writing', 'Newsletter schreiben', '📧',
   'Professionellen Newsletter verfassen der konvertiert',
   'package', 'marketing',
   'Schritt 1: Definiere ein klares Thema und den Mehrwert für den Leser.' || chr(10) ||
   'Schritt 2: Schreibe eine Betreffzeile die neugierig macht (max. 50 Zeichen).' || chr(10) ||
   'Schritt 3: Verfasse ein Intro das sofort den Nutzen kommuniziert.' || chr(10) ||
   'Schritt 4: Strukturiere den Inhalt in max. 3 Abschnitte.' || chr(10) ||
   'Schritt 5: Formuliere einen klaren CTA.',
   'Betreffzeile max. 50 Zeichen. Klarer CTA. Lesernutzen im Intro. Max. 400 Wörter.',
   'text',
   ARRAY['newsletter','mailing','email','kampagne','betreff'],
   'marketing_expert', 'writing', TRUE, 3, 'superadmin')
ON CONFLICT DO NOTHING;

COMMIT;
