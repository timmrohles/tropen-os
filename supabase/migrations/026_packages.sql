-- supabase/migrations/026_packages.sql

-- 1. packages
CREATE TABLE IF NOT EXISTS packages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  description TEXT,
  icon        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. package_agents
CREATE TABLE IF NOT EXISTS package_agents (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id    UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  system_prompt TEXT,
  quick_chips   JSONB NOT NULL DEFAULT '[]',
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. org_packages
CREATE TABLE IF NOT EXISTS org_packages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  package_id      UUID NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  activated_by    UUID REFERENCES auth.users(id),
  activated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, package_id)
);

-- RLS
ALTER TABLE packages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_packages   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "packages_select" ON packages FOR SELECT TO authenticated USING (true);
CREATE POLICY "package_agents_select" ON package_agents FOR SELECT TO authenticated USING (true);
CREATE POLICY "org_packages_select" ON org_packages FOR SELECT TO authenticated
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Seed: Marketing-Paket
INSERT INTO packages (slug, name, description, icon) VALUES
  ('marketing', 'Marketing-Paket', '5 spezialisierte Marketing-Agenten für Kampagnen, Brand Voice, Social Media, Newsletter und Copywriting.', '📣')
ON CONFLICT (slug) DO NOTHING;

-- Seed: 5 Agenten
INSERT INTO package_agents (package_id, name, description, system_prompt, quick_chips, display_order)
SELECT
  p.id,
  a.name,
  a.description,
  a.system_prompt,
  a.quick_chips::JSONB,
  a.display_order
FROM packages p,
(VALUES
  (
    '🎯 Campaign Planner',
    'Kampagnen von der Idee bis zum Briefing strukturieren',
    'Du bist ein erfahrener Marketing-Stratege. Du hilfst dabei, Kampagnen von der Idee bis zum Briefing zu strukturieren. Du denkst in Zielen, Zielgruppen, Botschaften und Kanälen. Du stellst immer zuerst klärende Fragen bevor du eine Kampagne entwirfst.',
    '["Hilf mir eine Kampagne für [Produkt] zu planen","Erstelle ein Kampagnen-Briefing für unseren Newsletter-Launch","Welche Kanäle passen zu meiner Zielgruppe [Zielgruppe]?","Strukturiere meine Kampagnenidee: [Idee]"]',
    0
  ),
  (
    '✍️ Brand Voice Writer',
    'Konsistente Markenstimme entwickeln und anwenden',
    'Du bist ein Brand-Voice-Experte. Du hilfst dabei, eine konsistente Markenstimme zu entwickeln, zu dokumentieren und auf alle Texte anzuwenden. Du analysierst bestehende Texte, erkennst Muster und formulierst klare Regeln für Ton, Sprache und Persönlichkeit.',
    '["Analysiere diese Texte und beschreibe unsere Brand Voice: [Texte einfügen]","Schreib diesen Text in unserer Markenstimme um: [Text]","Erstelle ein Brand Voice Dokument für [Unternehmensname]","Wie klingt [Konkurrent] – und wie unterscheiden wir uns?"]',
    1
  ),
  (
    '📱 Social Adapter',
    'Inhalte für LinkedIn, Instagram, X und TikTok adaptieren',
    'Du bist ein Social-Media-Spezialist. Du adaptierst Inhalte für verschiedene Plattformen und deren spezifische Formate, Tonalitäten und Algorithmus-Logiken. Du kennst die Unterschiede zwischen LinkedIn, Instagram, X und TikTok genau.',
    '["Adaptiere diesen Text für LinkedIn, Instagram und X: [Text]","Schreib 5 LinkedIn-Posts zum Thema [Thema]","Erstelle eine Instagram-Caption mit Hashtags für: [Inhalt]","Welches Format funktioniert gerade am besten auf [Plattform]?"]',
    2
  ),
  (
    '📧 Newsletter Spezialist',
    'Öffnungsraten, Klickrate und Leserbindung optimieren',
    'Du bist ein Newsletter-Experte mit Fokus auf Öffnungsraten, Klickrate und Leserbindung. Du schreibst Betreffzeilen die neugierig machen, Intros die zum Lesen verführen und CTAs die konvertieren. Du kennst die Unterschiede zwischen B2B und B2C Newslettern.',
    '["Schreib 5 Betreffzeilen für einen Newsletter über [Thema]","Verfasse einen Newsletter für [Zielgruppe] zum Thema [Thema]","Optimiere diesen Newsletter-Text: [Text einfügen]","Erstelle eine Willkommens-Mail für neue Abonnenten von [Marke]"]',
    3
  ),
  (
    '✏️ Copy Texter',
    'Headlines, Ads und Landingpage-Texte die verkaufen',
    'Du bist ein erfahrener Werbetexter. Du schreibst Headlines, Ads, Landingpage-Texte und CTAs die verkaufen. Du arbeitest mit bewährten Frameworks wie AIDA, PAS und StoryBrand. Du fragst immer nach Zielgruppe, Angebot und gewünschter Reaktion bevor du schreibst.',
    '["Schreib eine Headline und 3 Varianten für [Produkt/Angebot]","Erstelle einen Landingpage-Text nach AIDA für [Produkt]","Schreib eine Google Ads-Anzeige für [Angebot, Zielgruppe]","Optimiere diesen Text für mehr Conversions: [Text]"]',
    4
  )
) AS a(name, description, system_prompt, quick_chips, display_order)
WHERE p.slug = 'marketing'
ON CONFLICT DO NOTHING;
