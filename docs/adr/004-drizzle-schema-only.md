# ADR-004: Drizzle ORM nur fuer Schema-Definition, nicht fuer Queries

**Status:** Accepted
**Datum:** 2026-03-15
**Kontext:** Datenbank-Zugriffsmuster

## Entscheidung

Drizzle ORM wird ausschliesslich fuer Schema-Definitionen und Typ-Generierung verwendet.
Alle Datenbank-Queries laufen ueber `supabaseAdmin.from('table')` (Server) oder
`createClient()` (Client).

## Grund

Drizzle-Queries funktionieren in der Supabase-Umgebung nicht zuverlaessig. Die
Supabase-Client-Library bietet RLS-Integration, Auth-Context und ist im gesamten
Backend etabliert. Ein Mischbetrieb wuerde Verwirrung schaffen.

## Konsequenzen

- **Positiv:** Ein einheitliches Query-Pattern im gesamten Projekt
- **Positiv:** RLS greift automatisch bei Client-Queries
- **Positiv:** Drizzle-Schema bleibt als Single Source of Truth fuer TypeScript-Typen
- **Negativ:** Kein Drizzle Query Builder (type-safe Queries), stattdessen String-basierte Supabase-Selects
- **Negativ:** Typ-Mapping (z.B. `mapSchemaRow`, `mapAgent`) muss manuell gepflegt werden

## Betroffene Dateien

- `src/db/schema.ts` — Schema-Definitionen + Typ-Exports
- `src/lib/supabase-admin.ts` — Service-Role Client fuer Server-Queries
- `src/utils/supabase/client.ts` — Anon Client fuer Frontend-Queries
- Alle `src/app/api/` Routes — verwenden `supabaseAdmin.from()`
