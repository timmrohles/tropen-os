# ADR-003: Supabase als Auth- und Datenbank-Plattform

**Datum:** 2026-03-07 (initiale Entscheidung) — dokumentiert 2026-03-19
**Status:** Entschieden

---

## Kontext

Tropen OS benötigt eine Auth-Lösung mit sicherer Sitzungsverwaltung sowie eine Datenbank, die Row-Level-Security auf Zeilenebene unterstützt, um Multi-Tenant-Isolation ohne App-Layer-Komplexität zu garantieren.

Das Projekt wird von einem kleinen Team (primär 1 Entwickler + Claude Code) betrieben. Infrastruktur-Aufwand muss minimal bleiben. Es besteht eine harte Anforderung: Keine Nutzerdaten verlassen die EU.

Alternativen evaluiert: Firebase (kein EU-Hosting, kein echtes SQL), Auth0 + Postgres auf Render (zwei separate Systeme, höhere Kosten), Clerk + Neon (keine RLS, kein JSONB).

---

## Entscheidung

Supabase wird als einzige Auth- und Datenbank-Plattform eingesetzt:

- **Auth**: Supabase Auth mit Resend SMTP (Magic Links, Passwort-Reset, Einladungen)
- **Datenbank**: PostgreSQL via Supabase mit Row-Level-Security auf allen User-Tabellen
- **Storage**: Supabase Storage für Medien-Uploads
- **Edge Functions**: Supabase Deno-Runtime für AI-Chat-Streaming (latenz-kritisch)
- **Region**: EU (Frankfurt) — Datensouveränität erfüllt

Technische Umsetzung:
- Server-Zugriff: `supabaseAdmin` mit Service Role Key (`src/lib/supabase-admin.ts`) — bypasses RLS absichtlich für Backend-Operationen
- Client-Zugriff: `createClient()` aus `@supabase/ssr` — unterliegt RLS, für Auth-Checks
- **Constraint**: Drizzle ORM funktioniert in dieser Umgebung nicht für Queries (nur Schema-Definition) — alle Queries via Supabase JS Client

---

## Konsequenzen

**Positiv:**
- RLS ermöglicht Tenant-Isolation auf DB-Ebene ohne App-Layer-Logik
- PITR, automatische Backups, Connection Pooling out-of-the-box
- Auth + DB in einem System — kein Token-Sync zwischen Systemen
- pgvector für RAG direkt verfügbar (Migration 017)
- EU-Hosting erfüllt DSGVO-Anforderungen

**Negativ / Risiken:**
- Vendor Lock-in: Supabase-spezifische RLS-Syntax, Edge Functions in Deno
- Exit-Strategie: Postgres-Dump + Prisma als Migrations-Tool würde Migration zu anderem Provider ermöglichen (aufwändig aber möglich)
- Service Role Key muss streng geheim bleiben — nie im Frontend-Bundle
- RLS-Policies müssen nach jeder neuen Tabelle manuell geprüft werden (keine automatische Vererbung)

**Offene Punkte:**
- PITR-Konfiguration verifizieren (bekannter Tech Debt — `docs/tech-debt.md`)
- Supabase-Backup-Retention dokumentieren (`docs/runbooks/disaster-recovery.md` fehlt)
