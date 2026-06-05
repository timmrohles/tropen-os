# Korsett v1 — Foundation-Entscheidungsbaum

> **Status:** v1 (nach Komitee-Runde 1) · Phase-2-Konzept, nicht in Bau
> **Vorgänger:** `begleiter-korsett-v0.md` · **Review:** `docs/committee-reviews/korsett-v0-review.md`
> **Kalibrierung:** Supabase + Next.js + TypeScript (tiefster Ast)

## Änderungen ggü. v0 (aus Komitee-Konsens)
- ➕ **Frontend-Domäne (F1–F3)** — fehlte komplett (EINIG)
- ➕ **API-Design (API1)**, **Deploy/CI (DEP1/DEP2)**, **Storage+RLS (D9)**, **Realtime (D10)**
- 🔁 **U6 Naming** und **A1 Auth-Methode** → 🟡 auf 🔴
- 🔗 Legal verschlankt: L3+L5 → „Juristische Pflichten"; L6+L7 → „Sub-Prozessoren & Tracking"
- ⚖️ **BFSG (L4)** geschärft: WCAG 2.2 / EN 301 549, B2C-Web = 🔴
- ↕️ Reihenfolge: **Projekt-Definition (P0/P1) zuerst**; D8 Schema-Hygiene → eigener Schema-Review (später, kein Foundation-Gate)

## Legende
**Frage** · *Warum* · **Default** · **Kosten** — 🔴 architektur-prägend (aufschieben = Umbau) · 🟡 anbaubar (park „später" in den Log).
**Awareness, kein Gate.** „GO" = alle *zutreffenden* 🔴 entschieden, 🟡 bewusst geparkt. Pro Projekt entfallen ganze Äste → die effektive 🔴-Zahl ist klein.

---

## 0 · Projekt-Definition (zuerst — prägt alles)

| # | Frage | Default | Kosten |
|---|-------|---------|--------|
| P0 | **Greenfield oder bestehende App?** (bestehend → Daten-Migration, Breaking-Changes, *vorhandene Konventionen übernehmen*) | greenfield | 🔴 |
| P1 | **Was baust du** (Typ → Domänen-Overlay) — und was bewusst **NICHT** im ersten Wurf? | *(erfragen)* | 🔴 |

## A · Universelle Knoten

| # | Frage | Default | Kosten |
|---|-------|---------|--------|
| U1 | **Ziel & Scope** in einem Satz | *(erfragen)* | 🔴 |
| U2 | **SSOT** — wo die *eine* Wahrheit liegt, Code generiert statt dupliziert | DB-Schema = SSOT, Typen generiert *(Default stack-spezifisch)* | 🔴 |
| U3 | **Git ab Commit 1** + **`CLAUDE.md`/README** als KI-Kontext | sofort anlegen | 🟡 |
| U4 | **Secrets** — wie gehalten? | `.env.local` gitignored + `.env.example`, nie committen | 🔴 |
| U5 | **Error-/Logging-Disziplin** (strukturiert, kein PII, kein `console.log` Prod) | zentraler Logger | 🟡 |
| U6 | **Naming & Ordnerstruktur** | Framework-Standard *(Default stack-spezifisch)* | 🔴 ⬆️ |

## B · Frontend (wenn Web-UI) — NEU

| # | Frage | *Warum* | Default | Kosten |
|---|-------|---------|---------|--------|
| F1 | **Rendering-Strategie** (SSR / SSG / RSC / CSR) | prägt Datenfetch + Performance | Next.js App Router, RSC default | 🔴 |
| F2 | **State-Management** (Server-State vs. Client-State) | falsche Wahl = großer Umbau | Server-State via Query-Lib; Client-State minimal | 🔴 |
| F3 | **Component-/Design-System** (UI-Lib, Tokens) | Konsistenz, a11y-Basis | Tailwind + 1 Komponenten-Lib, Design-Tokens | 🟡 |

## C · API / Client-Server — NEU

| # | Frage | *Warum* | Default | Kosten |
|---|-------|---------|---------|--------|
| API1 | **Kommunikations-Pattern** (Server Actions / Route Handlers / tRPC / REST) | bestimmt die ganze Client-Server-Grenze | Next.js Server Actions + Route Handlers | 🔴 |

## D · Datenbank (Supabase-Ast; *keine DB* → Ast entfällt)

| # | Frage | Default | Kosten |
|---|-------|---------|--------|
| D1 | **Multi-Tenant (`org_id`)** oder Single? | wenn je Mehr-Mandanten denkbar → `org_id` jetzt | 🔴🔴 |
| D2 | **`app_users.id = auth.users.id`** (1:1)? | 1:1-Spiegel | 🔴 |
| D3 | **RLS auf jeder Tabelle**, in derselben Migration? | RLS-an + Policy mit jedem `CREATE TABLE` | 🔴 |
| D4 | ⚠️ **Security-Härtung** (RLS-Helper `search_path` gepinnt, `security_invoker` auf Views, Rolle im JWT) — *kritische Lücke wenn ignoriert* | Härtungs-Checkliste anwenden | 🟡 (kritisch) |
| D5 | **Server/Client-Schreibgrenze** (Service-Role nur server-seitig)? | Service-Role nie im Client | 🔴 |
| D6 | **Löschen** soft (`deleted_at`) / append-only-Historie? | soft-delete für User-Daten; append-only Audit | 🟡 (🔴 bei Retention-Pflicht) |
| D7 | **Migrations-Disziplin** (Datei zuerst, dann anwenden; RLS inklusive) | `supabase/migrations`, eine pro Änderung | 🔴 |
| D9 | **Storage & Uploads + Bucket-RLS** (wenn Datei-Uploads) — NEU | privat default; RLS-Policy auf `storage.objects` | 🔴 |
| D10 | **Realtime-Channels + RLS** (wenn Live-Updates) — NEU | nur wo nötig; RLS gilt auch für Realtime | 🟡 |

> **Verschoben:** D8 Schema-Hygiene (FK-`on delete`, Ranking statt int-`sort_order`, enum-vs-CHECK, jsonb-Integrität) → **eigener Schema-Review *nach* der ersten Migration**, kein Foundation-Gate.

## E · Auth (wenn Accounts)

| # | Frage | Default | Kosten |
|---|-------|---------|--------|
| A1 | **Auth-Methode** (Magic-Link / Passwort / OAuth) | Provider-Auth; Wahl = Flow-Umbau | 🔴 ⬆️ |
| A2 | **Account-Lifecycle** (Reset, Verify, **Löschung**) | von Anfang mitdenken (Löschung = DSGVO) | 🟡 (🔴 bei PII) |
| A3 | **Authz-Modell** (Rollen/Permissions) | Rolle im JWT-Claim | 🔴 bei mehreren Rollen |

## F · Personenbezogene Daten (PII)

| # | Frage | Default | Kosten |
|---|-------|---------|--------|
| PII1 | **Datenarten-Inventar** | Datensparsamkeit | 🟡 |
| PII2 | **Besondere Kategorien (Art. 9) / Kinder (Art. 8)?** | wenn ja → trennen/verschlüsseln | 🔴 |
| PII3 | **Datenresidenz** (EU-Region?) | EU-Region | 🔴 |

## G · KI-Features

| # | Frage | Default | Kosten |
|---|-------|---------|--------|
| AI1 | **Risiko-Tier** (verboten/hochrisiko/begrenzt/minimal) | meist „begrenzt" → Transparenzpflicht | 🟡 (🔴 hochrisiko) |
| AI2 | **Datenfluss** (User-/PII-Daten an LLM? Provider, Retention, **AVV**) | Zero-Retention/Gateway, AVV | 🔴 |
| AI3 | **Kosten/Missbrauch** (Rate-Limit + Budget-Cap) | ab Tag 1 | 🔴 |

## H · ⚖️ Recht / Jurisdiktion (Querschnitt — ableiten, nicht fragen; Stufe 1 + Disclaimer)

| # | Faktenfrage | Leitet ab | Kosten |
|---|-------------|-----------|--------|
| L1 | **Hosting / Daten-Residenz** | EU vs. Drittland → Transfer-Mechanismus | 🔴 |
| L2 | **Zielgruppe** | EU-User → DSGVO (extraterritorial) | 🟡 |
| L3 | **Juristische Pflichten** (Firmensitz → Impressum; Zahlungen → Fernabsatz/Preisangaben) *(L3+L5 zusammengelegt)* | Impressum, Widerruf, AGB | 🟡 |
| L4 | **B2C/B2B → BFSG/a11y** | B2C-Web = **Pflicht seit 2025**; WCAG 2.2 / EN 301 549 | 🔴 bei B2C-Web |
| L5 | **Sub-Prozessoren & Tracking** (LLM/Analytics/Mail → AVV-Kette, VVT; Tracking → Cookie-Consent TTDSG) *(L6+L7 zusammengelegt)* | AVV, Cookie-Consent | 🟡 (🔴 wo Daten fließen) |

## I · Betrieb & Deploy

| # | Frage | *Warum* | Default | Kosten |
|---|-------|---------|---------|--------|
| DEP1 | **Hosting/Deploy-Ziel** — NEU | bestimmt auch Sub-Prozessoren (L5) | Vercel | 🟡 |
| DEP2 | **CI/CD** (lint/build/test-Gate vor Deploy) — NEU | verhindert kaputte Deploys | minimaler CI-Gate | 🟡 |
| O1 | **Observability** („woran merkst du, dass Prod kaputt ist?") | sonst ship-and-pray | Error-Tracking ab Launch | 🟡 |
| B1 | **Umgebungen & Backups** (Prod≠Dev, Backup/PITR) | dev-gegen-prod + kein Backup = Katastrophe | getrennte DBs; Backups an; Restore testen | 🔴 |

---

## Startpaket-Ableitung (unverändert)
Decision-Log (🔴=`decision`, geparkte 🟡=`open_question`/„später") · `CLAUDE.md` · erste Migration (Durchstich-Slice) · `.env.example` · Reifegrad-Signal („🔴 entschieden ✅ · N×🟡 geparkt → leg los").

## Fragen an Runde 2
1. Wurden die Runde-1-Konsens-Findings **adäquat adressiert**?
2. **Überkorrigiert** — ist v1 jetzt zu groß (Zwangsjacke)? Welche neuen Knoten zusammenlegen/streichen?
3. Welche **neuen Lücken** bleiben?
4. Stimmt die Aufschub-Kosten-Verteilung (🔴 vs. 🟡) jetzt?
