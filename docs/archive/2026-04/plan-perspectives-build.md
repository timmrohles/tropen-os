# Perspectives — Zweite Meinung im Chat
## Claude Code Build-Prompt

> **Konzept-Referenz:** docs/superpowers/perspectives-concept-v2.md
> **Einordnung:** Nach Plan G (Feeds) in der Build-Reihenfolge
> **Scope:** Vollständige Implementierung MVP + Phase 1

---

## Pflicht: Vor dem Bauen lesen

```
1. CLAUDE.md                                              → Architektur, Design-System
2. docs/webapp-manifest/engineering-standard.md          → Kategorien 1, 3, 22
3. docs/superpowers/perspectives-concept-v2.md           → Vollständiges Konzept
4. src/components/workspace/ChatArea.tsx                  → Chat-Komponente
5. src/app/api/chat/stream/route.ts                       → Streaming-Architektur
6. supabase/migrations/ letzte Migration                  → Nächste Nummer
7. src/app/globals.css                                    → .chip, .card, .btn Klassen
```

Danach: Ampel bestimmen (grün/gelb/rot) und kurz im Terminal ausgeben.

---

## Konzept (Zusammenfassung)

Mitten aus einem laufenden Chat heraus eine zweite Meinung einholen —
von einem Avatar mit einem anderen Denkstil, parallel streamend.

```
Unter dem Chat-Input: Perspectives-Strip
[Kritiker] [A.D.] [Optimist] [Stratege] [Tabula Rasa] [+]

User wählt 1-N Avatare → [Befragen]
→ Bottom-Sheet öffnet sich
→ Antworten streamen parallel — eine Card pro Avatar
→ Optional: in Chat posten
```

---

## Schritt 1 — Migration

```sql
-- perspective_avatars
CREATE TABLE perspective_avatars (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope           TEXT NOT NULL CHECK (scope IN ('system','org','user')),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  emoji           TEXT NOT NULL DEFAULT '🤖',
  description     TEXT,
  system_prompt   TEXT NOT NULL,
  model_id        TEXT NOT NULL DEFAULT 'claude-sonnet-4-20250514',
  context_default TEXT NOT NULL DEFAULT 'last_10'
                  CHECK (context_default IN
                    ('last_5','last_10','last_20','full','none')),
  is_tabula_rasa  BOOLEAN DEFAULT false,
  is_active       BOOLEAN DEFAULT true,
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT scope_org_required
    CHECK (scope != 'org' OR organization_id IS NOT NULL),
  CONSTRAINT scope_user_required
    CHECK (scope != 'user' OR user_id IS NOT NULL)
);

CREATE INDEX idx_perspective_avatars_org
  ON perspective_avatars(organization_id) WHERE scope = 'org';
CREATE INDEX idx_perspective_avatars_user
  ON perspective_avatars(user_id) WHERE scope = 'user';

ALTER TABLE perspective_avatars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "perspectives_select" ON perspective_avatars
  FOR SELECT USING (
    scope = 'system'
    OR (scope = 'org' AND organization_id = (
      SELECT organization_id FROM users WHERE id = auth.uid()
    ))
    OR (scope = 'user' AND user_id = auth.uid())
  );

CREATE POLICY "perspectives_own" ON perspective_avatars
  FOR ALL USING (user_id = auth.uid() OR scope = 'system');

-- perspective_user_settings
CREATE TABLE perspective_user_settings (
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  avatar_id  UUID REFERENCES perspective_avatars(id) ON DELETE CASCADE,
  is_pinned  BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  PRIMARY KEY (user_id, avatar_id)
);

ALTER TABLE perspective_user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "persp_settings_own" ON perspective_user_settings
  FOR ALL USING (user_id = auth.uid());
```

### Seed: 5 System-Avatare

5 System-Avatare werden geseedet: Der Kritiker, Advocatus Diaboli, Der Optimist, Der Stratege, Tabula Rasa.
Vollständige Prompts: siehe ursprüngliches Build-Prompt-Dokument.

---

## Schritt 2 — API Routes

- `GET /api/perspectives/avatars` — alle sichtbaren Avatare für User (system + org + user)
- `POST /api/perspectives/avatars` — neuen Avatar erstellen (scope='user' oder 'org' für org_admin)
- `PATCH /api/perspectives/avatars/[id]` — bearbeiten (nur eigene)
- `DELETE /api/perspectives/avatars/[id]` — soft delete (nur eigene, nie system)
- `POST /api/perspectives/avatars/[id]/copy` — kopieren als scope='user'
- `POST /api/perspectives/query` — Herzstück: paralleles SSE-Streaming
- `GET/PATCH /api/perspectives/settings` — Strip-Sichtbarkeit pro User

### POST /api/perspectives/query — Paralleles SSE-Streaming

```typescript
interface PerspectiveQueryRequest {
  avatarIds:       string[]
  scope:           'last_5' | 'last_10' | 'last_20' | 'full' | 'custom'
  conversationId?: string
  projectId?:      string
  customText?:     string
  outputMode:      'drawer' | 'chat'
}

// Response: text/event-stream
// Tagged Events pro Avatar:
// data: {"avatarId": "uuid", "delta": "..."}
// data: {"avatarId": "uuid", "done": true, "tokensUsed": 412}
// data: {"done": true}
```

Kontext-Aufbereitung:
- `is_tabula_rasa=true` → IMMER nur Chat-Text, kein Projekt-Kontext
- Sonst: je nach scope last_5/10/20/full/custom
- Budget-Check vor jedem Avatar-Call — nie überspringen

---

## Schritt 3 — PerspectivesStrip.tsx

Position: direkt ÜBER dem Chat-Input, UNTER dem Chat-Bereich.

```
Höhe: 36px, dezent
Background: var(--bg-surface) mit leichtem Border-Top

ⓘ  [Kritiker] [A.D.] [Optimist] [Stratege] [Tabula Rasa]  [+]  [Befragen]
```

- Chips: `.chip` / `.chip--active` aus globals.css
- `[Befragen]`: `.btn .btn-primary .btn-sm` — nur wenn mind. 1 aktiv
- `ⓘ`: öffnet PerspectivesInfobox (Popover)
- `[+]`: navigiert zu /perspectives
- `role="toolbar"`, `aria-label="Perspectives — zweite Meinung einholen"`
- Jeder Chip: `aria-pressed={isActive}`

---

## Schritt 4 — PerspectivesInfobox.tsx

Kleines Popover über dem Strip (bottom: 100%). Schließt bei Klick außerhalb + Escape.
Erklärt was Perspectives ist + Link zu /perspectives.

---

## Schritt 5 — PerspectivesBottomSheet.tsx

Bottom-Sheet (~60% Viewport-Höhe, ausfahrbar auf Vollbild).

Layout je Anzahl Avatare:
- 1 Avatar: volle Breite
- 2 Avatare: 50/50
- 3+: horizontales Scroll-Layout, Cards min. 320px

Streaming: SSE-Verbindung zu `/api/perspectives/query`. Blinkender Cursor während Streaming.
"In Chat posten": Toro-Nachricht mit Avatar-Badge in Chat einfügen.

Accessibility: `role="dialog"`, `aria-modal="true"`, Fokus-Trap, Escape schließt.

---

## Schritt 6 — /perspectives Seite

`.content-max`. Tabs: System | Organisation | Meine Avatare.
Avatar-Cards im Grid (3/2/1 Spalten). Aktionen: anzeigen/ausblenden, kopieren, bearbeiten, löschen.

---

## Schritt 7 — AvatarFormDrawer.tsx

Right-Drawer: Emoji, Name, Beschreibung, System Prompt, Modell, Kontext-Default, Sichtbarkeit.

---

## Schritt 8 — Navigation

```typescript
// In LeftNav nach "Wissen":
{ href: '/perspectives', icon: 'Eye', label: 'Perspectives' }
// Phosphor: Eye, weight="bold"
```

---

## Architektur-Constraints

- Paralleles Streaming: Promise.all, nicht sequenziell
- Tabula Rasa: is_tabula_rasa=true überschreibt IMMER den Scope
- Budget-Check: vor jedem Avatar-Call — nie überspringen
- DB-Zugriff: supabaseAdmin — kein Drizzle
- System-Avatare: nie bearbeitbar oder löschbar (außer Superadmin)
- Bottom-Sheet — nicht Right-Drawer (rechts bereits belegt)

---

## Abschluss-Checkliste

```bash
pnpm tsc --noEmit
pnpm lint
supabase db push
```

Manuell prüfen:
- [ ] 5 System-Avatare erscheinen im Strip
- [ ] Avatar auswählen → [Befragen] erscheint
- [ ] Bottom-Sheet öffnet sich
- [ ] Antworten streamen parallel (nicht nacheinander)
- [ ] Tabula Rasa bekommt keinen Projekt-Kontext
- [ ] 2 Avatare: 50/50 Layout
- [ ] "In Chat posten" fügt Antwort mit Badge ein
- [ ] /perspectives zeigt alle Avatare in Tabs
- [ ] Eigenen Avatar erstellen funktioniert
- [ ] Avatar kopieren erstellt scope='user' Kopie
- [ ] Budget-Check greift bei jedem Call
- [ ] Escape schließt Bottom-Sheet
- [ ] Fokus-Trap im Bottom-Sheet
- [ ] CLAUDE.md aktualisiert
