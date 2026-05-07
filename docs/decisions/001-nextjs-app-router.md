# ADR-001: Next.js 16 mit App Router als Web-Framework

**Datum:** 2026-02 (initiale Entscheidung) — dokumentiert 2026-03-26
**Status:** Entschieden

---

## Kontext

Tropen OS ist eine vollständige Web-Applikation mit Auth, Datenbank-Zugriffen,
AI-Streaming, komplexen Layouts und später Multi-Tenant-Anforderungen. Das Framework
bestimmt die gesamte Architektur: Routing, Rendering, Deployment.

**Anforderungen:**
- AI-Streaming-Antworten (SSE) direkt aus Server-Komponenten
- Server-seitige Auth-Checks ohne Client-Round-trips
- Gute Supabase-Integration (SSR Cookies)
- Vercel-Deployment mit Zero-Config
- TypeScript-first, React 19

**Alternativen evaluiert:**
- **Remix**: Gute SSR-Story, aber schwächeres Ökosystem, kein nativer Vercel-Vorteil
- **Vite + React SPA**: Kein SSR, AI-Streaming nur über eigenen Server, mehr Infrastruktur
- **Nuxt/SvelteKit**: Kein React — zu viel Portierungsrisiko für Anthropic-SDK-Patterns

---

## Entscheidung

**Next.js 16 mit App Router** als einziges Web-Framework.

Konkrete Architekturregeln:
- **Server Components als Default** — `'use client'` nur wenn Browser-APIs oder Interaktivität nötig
- **`'use client'`-Boundary so tief wie möglich** in der Komponenten-Hierarchie
- **Server Actions (`'use server'`)** für Mutations — keine separaten API-Routes für interne Daten
- **Route Handlers** nur für externe Webhooks, Streaming-Endpoints (AI), und öffentliche APIs
- **`proxy.ts`** (ehemals `middleware.ts`) für Auth-Checks vor dem Render
- **`next/image`** und **`next/font`** durchgängig für Optimierungen
- Async Request APIs: `await cookies()`, `await headers()`, `await params`

---

## Konsequenzen

**Positiv:**
- Zero-Config-Deployment auf Vercel — automatische Erkennung, optimiertes Build-System
- Supabase SSR-Package (`@supabase/ssr`) direkt für Cookie-basierte Auth verwendbar
- AI-Streaming via Route Handler + `toUIMessageStreamResponse()` ohne Extra-Infrastruktur
- React 19 Features (Server Components, Suspense) nativ verfügbar
- Turbopack als Default-Bundler: schnelle HMR-Zeiten in Entwicklung

**Negativ / Risiken:**
- App Router hat Lernkurve gegenüber Pages Router — mentales Modell erfordert Disziplin
- `'use client'` versehentlich zu weit oben → unnötige Client-Bundles
- Caching-Verhalten von Next.js 16 ist komplex (Cache Components, revalidation)
- Vendor-Nähe zu Vercel — Exit-Strategie: selbst-gehosteter Next.js-Server möglich, aber mit Aufwand
