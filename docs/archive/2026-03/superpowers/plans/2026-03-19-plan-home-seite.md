# Home-Seite — /home nach Login
## Claude Code Build-Prompt

---

## Pflicht: Vor dem Bauen lesen

```
1. CLAUDE.md                                        → Architektur, Design-System, CSS-Klassen
2. docs/webapp-manifest/engineering-standard.md    → Kategorien 1, 15, 16
3. src/app/projects/page.tsx                        → Referenz Page-Layout
4. src/app/dashboard/page.tsx                       → Bestehende Dashboard-Seite (nicht anfassen)
5. src/middleware.ts                                → Redirect-Logik nach Login prüfen
6. src/app/globals.css                              → CSS-Variablen + Klassen
```

Danach: Ampel bestimmen (🟢/🟡/🔴) und kurz im Terminal ausgeben.

---

## Ziel

Eine neue `/home` Route die nach Login als Startseite erscheint.
Orientiert, erklärt, leitet weiter — überfordert nicht.

```
/home
┌──────────────────────────────────────────────────────────────────┐
│ Guten Morgen, [Name] 👋                                          │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │ 📣 Neuigkeiten                                               │ │
│ │ [Tropen] Workspaces sind jetzt verfügbar — Jetzt entdecken → │ │
│ │ [Org]    Q1-Review Dokument wurde geteilt                    │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌──────────────────────────────────────────────────────────────┐ │
│ │  💬 Chat starten                                             │ │
│ │  Frag Toro — er hilft dir sofort weiter              [→]    │ │
│ └──────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│ │Workspaces│  │  Feeds   │  │ Agenten  │  │  Wissen  │        │
│ │Komplexe  │  │Externe   │  │Automat.  │  │Deine     │        │
│ │Vorhaben  │  │Daten rein│  │Aufgaben  │  │Wissensbas│        │
│ │strukturie│  │          │  │          │  │          │        │
│ └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                                                  │
│ Zuletzt genutzt                                                  │
│ [Chat: Marktanalyse · vor 2h] [Workspace: Businessplan · gestern]│
└──────────────────────────────────────────────────────────────────┘
```

---

## Schritt 1 — Migration: announcements Tabelle

```sql
-- Neuigkeiten von Tropen (Superadmin) und Org-Admins
CREATE TABLE announcements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  -- NULL = Tropen-weit (von Superadmin), gesetzt = Org-spezifisch
  title           TEXT NOT NULL,
  body            TEXT,
  url             TEXT,           -- optionaler Link ("Jetzt entdecken →")
  url_label       TEXT,           -- Label für den Link
  type            TEXT NOT NULL DEFAULT 'info'
                    CHECK (type IN ('info', 'update', 'warning')),
  source          TEXT NOT NULL DEFAULT 'org'
                    CHECK (source IN ('tropen', 'org')),
  is_active       BOOLEAN NOT NULL DEFAULT true,
  published_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ,    -- NULL = kein Ablaufdatum
  created_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_announcements_org ON announcements(organization_id, published_at DESC);
CREATE INDEX idx_announcements_tropen ON announcements(source, is_active, published_at DESC)
  WHERE organization_id IS NULL;

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;

-- User sieht: eigene Org-Announcements + Tropen-Announcements
CREATE POLICY "announcements_select" ON announcements
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
    OR organization_id IS NULL  -- Tropen-weite Announcements
  );

-- Nur Org-Admins und Superadmins können anlegen
CREATE POLICY "announcements_insert" ON announcements
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid()
      AND role IN ('org_admin', 'owner', 'superadmin')
    )
  );
```

---

## Schritt 2 — Login-Redirect auf /home

`src/middleware.ts` anpassen:

```typescript
// Nach erfolgreichem Login → /home statt /chat
// Prüfen ob aktuell auf /login oder /auth/callback weitergeleitet wird
// Redirect-Ziel: /home

// WICHTIG: Bestehende Onboarding-Logik nicht brechen
// Wenn onboarding_completed = false → /onboarding (bleibt Priorität)
// Wenn onboarding_completed = true → /home (neu)
```

---

## Schritt 3 — Home-Seite

### `src/app/home/page.tsx`

Server Component für initiales Data-Fetching:
- User-Name laden
- Letzte 3 Conversations laden (sorted by updated_at DESC)
- Letzte 2 Workspaces laden
- Announcements laden (org + tropen, max 5, aktiv, nicht abgelaufen)

### Layout

```tsx
// content-max (1200px), paddingTop: 32, paddingBottom: 48

<div className="content-max" style={{ paddingTop: 32, paddingBottom: 48 }}>

  {/* Begrüßung */}
  <div style={{ marginBottom: 32 }}>
    <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)',
                  letterSpacing: '-0.03em', margin: 0 }}>
      {greeting}, {user.full_name?.split(' ')[0]} 👋
    </h1>
    <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: '4px 0 0' }}>
      Was möchtest du heute angehen?
    </p>
  </div>

  {/* Neuigkeiten (nur wenn vorhanden) */}
  {announcements.length > 0 && <AnnouncementsFeed announcements={announcements} />}

  {/* Chat CTA — prominent */}
  <ChatCTA />

  {/* Feature-Grid */}
  <FeatureGrid />

  {/* Zuletzt genutzt */}
  {(recentChats.length > 0 || recentWorkspaces.length > 0) && (
    <RecentlyUsed chats={recentChats} workspaces={recentWorkspaces} />
  )}

</div>
```

**Begrüßungslogik:**
```typescript
function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Guten Morgen'
  if (hour < 18) return 'Guten Tag'
  return 'Guten Abend'
}
```

---

## Schritt 4 — Komponenten

### `AnnouncementsFeed`

```tsx
// Karte mit Neuigkeiten-Liste
// Tropen-Announcements: Badge "Neu von Tropen" in var(--accent)
// Org-Announcements: Badge "[Org-Name]" in var(--active-bg)

<div className="card" style={{ marginBottom: 24 }}>
  <div className="card-header">
    <span className="card-header-label">Neuigkeiten</span>
  </div>
  <div className="card-body">
    {announcements.map(a => (
      <div key={a.id} className="list-row" style={{ cursor: 'default' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '2px 6px',
            borderRadius: 'var(--radius-sm)',
            background: a.source === 'tropen'
              ? 'var(--accent)' : 'var(--active-bg)',
            color: '#fff', whiteSpace: 'nowrap',
          }}>
            {a.source === 'tropen' ? 'Tropen' : orgName}
          </span>
          <span style={{ fontSize: 14, color: 'var(--text-primary)' }}>
            {a.title}
          </span>
        </div>
        {a.url && (
          <a href={a.url}
             style={{ fontSize: 13, color: 'var(--accent)', whiteSpace: 'nowrap' }}>
            {a.url_label || 'Mehr →'}
          </a>
        )}
      </div>
    ))}
  </div>
</div>
```

### `ChatCTA`

Der prominenteste Element auf der Seite — klarer Call-to-Action zum Chat.

```tsx
<div
  className="card"
  style={{
    marginBottom: 24,
    background: 'var(--active-bg)',
    cursor: 'pointer',
    border: 'none',
  }}
  onClick={() => router.push('/chat')}
  role="button"
  aria-label="Chat starten"
  tabIndex={0}
>
  <div className="card-body" style={{
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', padding: '20px 24px',
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <span style={{ fontSize: 28 }}>🦜</span>
      <div>
        <div style={{ fontSize: 17, fontWeight: 700, color: '#fff' }}>
          Chat starten
        </div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
          Frag Toro — er hilft dir sofort weiter
        </div>
      </div>
    </div>
    <ArrowRight size={20} color="rgba(255,255,255,0.8)" />
  </div>
</div>
```

### `FeatureGrid`

4 Karten nebeneinander — je mit Icon, Titel, kurzer Erklärung, Link.

```typescript
const FEATURES = [
  {
    href: '/workspaces',
    icon: 'SquaresFour',
    title: 'Workspaces',
    description: 'Komplexe Vorhaben strukturieren — von der Idee zum fertigen Ergebnis',
    example: 'z.B. Businessplan, Marktanalyse, Strategie',
  },
  {
    href: '/feeds',
    icon: 'RssSimple',
    title: 'Feeds',
    description: 'Externe Daten automatisch reinholen und aufbereiten',
    example: 'z.B. Branchen-News, Wettbewerber, RSS-Quellen',
  },
  {
    href: '/agenten',
    icon: 'Robot',
    title: 'Agenten',
    description: 'Wiederkehrende Aufgaben automatisch erledigen lassen',
    example: 'z.B. Wöchentlicher Report, Monitoring, Alerts',
  },
  {
    href: '/knowledge',
    icon: 'Books',
    title: 'Wissen',
    description: 'Dein Wissen hochladen — Toro nutzt es automatisch',
    example: 'z.B. Handbücher, Richtlinien, Produktinfos',
  },
]
```

```tsx
// Responsive Grid: 4 Spalten Desktop, 2 Tablet, 1 Mobile
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: 16,
  marginBottom: 32,
}}>
  {FEATURES.map(f => (
    <div
      key={f.href}
      className="card"
      style={{ cursor: 'pointer' }}
      onClick={() => router.push(f.href)}
      role="button"
      tabIndex={0}
      aria-label={`Zu ${f.title} navigieren`}
      onKeyDown={e => e.key === 'Enter' && router.push(f.href)}
    >
      <div className="card-body">
        {/* Icon: SquaresFour / RssSimple / Robot / Books — 24px, weight="fill", color="var(--accent)" */}
        <h3 style={{ fontSize: 15, fontWeight: 700,
                      color: 'var(--text-primary)', margin: '8px 0 4px' }}>
          {f.title}
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)',
                    lineHeight: 1.5, margin: '0 0 8px' }}>
          {f.description}
        </p>
        <p style={{ fontSize: 11, color: 'var(--text-tertiary)', margin: 0 }}>
          {f.example}
        </p>
      </div>
    </div>
  ))}
</div>
```

### `RecentlyUsed`

```tsx
<div>
  <span className="card-section-label" style={{ marginBottom: 12, display: 'block' }}>
    Zuletzt genutzt
  </span>
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
    {recentChats.map(c => (
      <button
        key={c.id}
        className="btn btn-ghost"
        onClick={() => router.push(`/chat/${c.id}`)}
        style={{ fontSize: 13 }}
      >
        {c.title || 'Chat'} · {formatRelativeTime(c.updated_at)}
      </button>
    ))}
    {recentWorkspaces.map(w => (
      <button
        key={w.id}
        className="btn btn-ghost"
        onClick={() => router.push(`/workspaces/${w.id}`)}
        style={{ fontSize: 13 }}
      >
        {w.title} · {formatRelativeTime(w.updated_at)}
      </button>
    ))}
  </div>
</div>
```

---

## Schritt 5 — Announcements API + Superadmin

### `GET /api/announcements`

```
→ Lädt aktive Announcements für den eingeloggten User:
  - source='tropen' (org IS NULL, is_active=true, expires_at IS NULL OR > NOW())
  - source='org' (organization_id = user.organization_id, is_active=true)
→ Sortiert: tropen zuerst, dann org, jeweils nach published_at DESC
→ Max 5 Announcements
```

### Superadmin: Tropen-Announcements

In `/superadmin/clients` einen neuen Tab: **Announcements**

```
[+ Neue Announcement]
Titel, Body, URL (optional), URL-Label (optional), Ablaufdatum (optional)
Typ: Info / Update / Warnung
Zielgruppe: Alle Orgs | Spezifische Org auswählen

Liste aller aktiven Announcements mit:
[Deaktivieren] [Löschen]
```

### Org-Admin: Org-Announcements

In Org-Settings ein neuer Abschnitt: **Neuigkeiten für dein Team**

```
[+ Neue Neuigkeit]
Titel, Body, URL (optional)
Gilt bis: [Datum-Picker]

Liste eigener Announcements
```

---

## Schritt 6 — Sidebar-Navigation

`/home` in die Sidebar-Navigation ergänzen — ganz oben, vor Chat:

```typescript
const NAV_PRIMARY = [
  { href: '/home',     icon: 'House',   label: 'Home' },   // NEU — ganz oben
  { href: '/chat',     icon: 'Chat',    label: 'Chat' },
  { href: '/projects', icon: 'Folder',  label: 'Projekte' },
]
```

Home ist der erste Nav-Punkt — und der Default nach Login.

---

## Schritt 7 — Accessibility

- [ ] Begrüßung: `<h1>` mit korrekter Hierarchie
- [ ] Announcements: `role="feed"`, jede Announcement als `article`
- [ ] ChatCTA: `role="button"`, `aria-label`, Enter-Handler
- [ ] Feature-Cards: `role="button"`, `aria-label`, `tabIndex={0}`, Enter-Handler
- [ ] Recently Used Buttons: `aria-label` mit Titel + Datum
- [ ] `aria-live="polite"` auf Announcements-Container (falls dynamisch geladen)

---

## Architektur-Constraints

- **DB-Zugriff**: `supabaseAdmin` — kein Drizzle für Queries
- **CSS**: `.card`, `.btn`, `.list-row`, CSS-Variablen — kein Tailwind
- **Kein Business-Logic in UI** — Announcements-Logik in `src/lib/announcements.ts`
- **Tenant-Isolation**: Announcements-Query immer mit organization_id Filter
- **Onboarding-Redirect** hat weiterhin Priorität vor /home
- **Icons**: Phosphor Icons, `weight="bold"` oder `weight="fill"` — keine anderen weights
- **Keine Hex-Farben** — nur `var(--)` CSS-Variablen

---

## Abschluss-Checkliste

```bash
pnpm tsc --noEmit
pnpm lint
supabase db push
```

Manuell prüfen:
- [ ] Login redirectet auf /home (nicht /chat)
- [ ] Onboarding redirectet weiterhin auf /onboarding
- [ ] Begrüßung zeigt korrekten Namen + Tageszeit
- [ ] Announcements erscheinen wenn vorhanden, fehlen wenn keine da
- [ ] ChatCTA navigiert zu /chat
- [ ] Feature-Karten navigieren korrekt
- [ ] Zuletzt-genutzt zeigt echte Daten
- [ ] Superadmin kann Tropen-Announcements anlegen
- [ ] Org-Admin kann Org-Announcements anlegen
