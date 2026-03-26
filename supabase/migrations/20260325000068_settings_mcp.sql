-- Migration 068: Settings extensions — profile fields, KI-context, MCP policies/connections

-- Profile extensions
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS salutation TEXT;

-- User preferences extensions  
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS language              TEXT DEFAULT 'de',
  ADD COLUMN IF NOT EXISTS ki_context            TEXT,
  ADD COLUMN IF NOT EXISTS ki_role               TEXT,
  ADD COLUMN IF NOT EXISTS communication_style   TEXT DEFAULT 'structured';

-- ── MCP Policies per Organisation ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.org_mcp_policies (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  mcp_id           TEXT NOT NULL,
  mcp_name         TEXT NOT NULL,
  mcp_icon         TEXT,
  status           TEXT NOT NULL
    CHECK (status IN ('available', 'on_request', 'blocked'))
    DEFAULT 'available',
  allowed_roles    TEXT[] DEFAULT ARRAY['member', 'admin'],
  created_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, mcp_id)
);

ALTER TABLE public.org_mcp_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "members_read_own_org_mcp_policies"
  ON public.org_mcp_policies FOR SELECT
  USING (
    organization_id = (
      SELECT organization_id FROM public.users WHERE id = auth.uid()
    )
  );

CREATE POLICY "org_admin_manage_mcp_policies"
  ON public.org_mcp_policies FOR ALL
  USING (
    organization_id = (
      SELECT organization_id FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'owner', 'superadmin')
    )
  );

-- ── User MCP Connections ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_mcp_connections (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id  UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  mcp_id           TEXT NOT NULL,
  status           TEXT NOT NULL
    CHECK (status IN ('connected', 'pending_approval', 'disconnected'))
    DEFAULT 'disconnected',
  connected_at     TIMESTAMPTZ,
  requested_at     TIMESTAMPTZ,
  approved_at      TIMESTAMPTZ,
  approved_by      UUID REFERENCES auth.users(id),
  UNIQUE(user_id, mcp_id)
);

ALTER TABLE public.user_mcp_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_manage_own_mcp_connections"
  ON public.user_mcp_connections FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "org_admin_view_mcp_connections"
  ON public.user_mcp_connections FOR SELECT
  USING (
    organization_id = (
      SELECT organization_id FROM public.users
      WHERE id = auth.uid() AND role IN ('admin', 'owner', 'superadmin')
    )
  );

-- ── Seed: Standard-MCPs für alle existierenden Orgs ─────────────────────────
INSERT INTO public.org_mcp_policies (organization_id, mcp_id, mcp_name, mcp_icon, status)
SELECT
  o.id,
  m.mcp_id,
  m.mcp_name,
  m.mcp_icon,
  'available'
FROM public.organizations o
CROSS JOIN (VALUES
  ('google-drive',   'Google Drive',  '📁'),
  ('hubspot',        'HubSpot',       '🟠'),
  ('slack',          'Slack',         '💬'),
  ('notion',         'Notion',        '⬛'),
  ('salesforce',     'Salesforce',    '☁️'),
  ('microsoft-365',  'Microsoft 365', '🪟'),
  ('jira',           'Jira',          '🔵'),
  ('asana',          'Asana',         '🎯')
) AS m(mcp_id, mcp_name, mcp_icon)
ON CONFLICT DO NOTHING;
