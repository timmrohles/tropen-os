---
status: accepted
updated: 2026-06-11
review_by: 2026-09-11
supersedes: []
superseded_by: null
author: Tim Rohles
---

# ADR-032 — Erzwungene Route-Autorisierung (withAuth/withProjectAccess + Checker)

**Status:** Accepted (2026-06-11)
**Deciders:** Timm
**Verwandt:** ADR-003 (Supabase als Auth+DB), ADR-004 (Drizzle Schema-Only → supabaseAdmin als Query-Pfad), ADR-007 (Rollen-Architektur), ADR-027 (Killer-Kriterien — „API-Routes ohne Auth-Check", „Tenant-Isolation")
**Quellen:** `docs/committee-reviews/fable-review-2026-06-11.md` (Finding #1), `docs/active/security-tenant-isolation.md`, `docs/active/checker-design-patterns.md` (P1, P13, P18)

---

## Kontext

Die DB-Zugriffs-Architektur von Tropen OS ist gesetzt (ADR-004): Drizzle funktioniert in dieser Umgebung nicht für Queries, deshalb laufen **alle** Server-/API-Queries über `supabaseAdmin` — den Service-Role-Client, der **RLS umgeht**. RLS-Policies existieren auf den Tabellen (zahlreiche Migrationen setzen sie), greifen aber im API-Layer nicht, weil der Service-Role-Client sie per Definition überspringt.

Die Folge: **Autorisierung ist in der Applikationsschicht manuell.** Jede Route ist selbst dafür verantwortlich, `getAuthUser()` aufzurufen und den `organization_id`-Filter bzw. den Ownership-Check zu setzen. Rollen-Guards (`requireOrgAdmin()`, `requireSuperadmin()` in `src/lib/auth/guards.ts`) decken nur die Rollen-Ebene ab — nicht die Tenant-/Ownership-Ebene auf jeder einzelnen Query.

**Größenordnung (verifiziert 2026-06-11):** `supabaseAdmin` wird in **164 Route-Dateien** in **660 Stellen** genutzt. Jede dieser Stellen ist eine potenzielle BOLA-Lücke (Broken Object Level Authorization), wenn ein org-/ownership-Filter vergessen wird. Ein einziger vergessener `.eq('organization_id', …)` = Cross-Tenant-Leak.

Das Fable-5-Review (2026-06-11) hat das als einziges substantielles Finding bestätigt (drei der fünf priorisierten Findings waren False Positives → P18). Die Formulierung des Reviews trifft den Kern: TropenOS würde dieses Muster bei einem **gescannten Fremd-Repo als Killer-Finding flaggen** — ADR-027 listet „API-Routes ohne Auth-Check" als Multi-User-Killer und „Tenant-Isolation (organization_id-Filter)" als Polish-High. Das Produktversprechen („wir finden deine Security-Lücken") verträgt keinen eigenen Vorfall dieser Klasse.

**Das eigentliche Problem ist nicht fehlende Disziplin, sondern undurchgesetzte Disziplin.** Die Autorisierung ist heute *dokumentiert und konventionell*, nicht *strukturell erzwungen*. Genau diese Verschiebung — von „dokumentiert" zu „erzwungen" — ist das Wertversprechen, das Tropen OS seinen Kunden verkauft.

---

## Entscheidung

**Autorisierung wird vom konventionellen Per-Route-Muster auf ein erzwungenes Wrapper-Pattern umgestellt, abgesichert durch einen eigenen Audit-Checker.**

Zwei Bausteine, gestaffelt:

1. **Sofort (Option A):** Higher-Order-Wrapper als Pflicht-Pattern für alle Routen, die `supabaseAdmin` nutzen — `withAuth()`, `withOrgAdmin()`, `withProjectAccess()`. Ein dedizierter Checker (cat-3) flaggt jede `supabaseAdmin`-Route ohne Wrapper bzw. ohne expliziten Allowlist-Eintrag (legitime Service-Routen: Cron, Webhooks, Aggregationen). Damit wird die Disziplin im eigenen Audit-System erzwungen — kein Self-Exempt.

2. **Mittelfristig (Option B, schrittweise):** Read-Pfade auf den RLS-respektierenden User-Client (anon-Client + User-Session) umstellen, sodass RLS als **Defense-in-Depth** auf DB-Ebene greift. `supabaseAdmin` bleibt nur für legitime Service-Operationen. Das ist additiv zu Option A, kein Ersatz, und kollidiert nicht mit ADR-004 (betrifft das Client-Objekt, nicht Drizzle).

Status **proposed** — Roll-out erst nach 24h-Wait und Pilot-Validierung.

---

## Optionen

### Option A — Wrapper-Pflicht + Checker (Empfehlung, sofort)

`withAuth(handler)` (User authentifiziert), `withOrgAdmin(handler)` (Rolle + Org), `withProjectAccess(handler)` (Ownership auf Projekt/Workspace). Wrapper injizieren den geprüften `AuthUser`/`org_id` in den Handler, sodass der Vergessens-Pfad strukturell entfällt. Checker-Regel macht Wrapper verpflichtend.

| Dimension | Bewertung |
|-----------|-----------|
| Komplexität | Mittel — Wrapper bauen + 164 Routen migrieren (mechanisch, inkrementell) |
| Risiko | Niedrig — additiv, Routen einzeln migrierbar, Checker fängt Regression |
| Nutzt Bestand | Hoch — Checker-Infrastruktur + `getAuthUser`/`guards.ts` existieren |
| Defense-in-Depth | Teilweise — App-Layer erzwungen, DB-Layer (RLS) noch umgangen |

**Pro:** Erzwingt Disziplin im eigenen Audit; deterministisch prüfbar; kein DB-Umbau; Dogfooding des eigenen Wertversprechens.
**Contra:** RLS bleibt im API-Layer umgangen (kein zweiter Schutzwall auf DB-Ebene); Wrapper-Korrektheit selbst muss geprüft werden.

### Option B — Read-Pfade auf RLS-Client umstellen (mittelfristig, additiv)

Lese-Routen nutzen den anon-Client mit User-Session → RLS greift als zweite Verteidigungslinie. `supabaseAdmin` nur noch für Service-Ops.

| Dimension | Bewertung |
|-----------|-----------|
| Komplexität | Hoch — pro Read-Pfad Verhalten gegen RLS-Policies verifizieren |
| Risiko | Mittel — falsche/fehlende RLS-Policy bricht Funktion (fail-closed) |
| Nutzt Bestand | Mittel — RLS-Policies existieren, sind aber ungetestet im Live-Pfad |
| Defense-in-Depth | Hoch — App- UND DB-Layer schützen |

**Pro:** Echter zweiter Schutzwall; macht RLS-Policies endlich wirksam.
**Contra:** Großer, riskanter Migrationsaufwand; nicht für alle Routen möglich (Cross-Org-Aggregationen, Superadmin, Service-Jobs).

### Option C — Status quo + Konvention/Doku (verworfen)

Nur dokumentieren, dass jede Route auth + org-filtern muss.

**Pro:** Kein Aufwand.
**Contra:** Das ist exakt die Lücke selbst — „dokumentiert, nicht erzwungen". 660 manuelle Stellen bleiben fehleranfällig. Verworfen.

---

## Trade-off-Analyse

Option A liefert den größten Hebel pro Aufwand: Sie nutzt vorhandene Checker- und Auth-Infrastruktur, ist inkrementell und risikoarm migrierbar, und — entscheidend — sie schließt die Lücke **strukturell** statt konventionell. Option B ist die einzige Option mit echtem Defense-in-Depth, aber teuer und riskant; sie eignet sich als schrittweiser Folge-Layer für Read-Pfade, nicht als Erstmaßnahme. Option C scheidet aus, weil sie das Problem nur umbenennt.

**Gewählt: A jetzt → B schrittweise (Hybrid).** A schließt die akute BOLA-Fläche, B härtet danach in der Tiefe.

**Checker-Design-Hinweis (selbstreferenziell):** Die neue Regel muss Autorisierung per **Datenfluss** erkennen (Wrapper-Aufruf / `getAuthUser()` / `organization_id`-Filter im Inhalt), nicht per Signatur oder Pfadname — sonst reproduziert sie genau P1/P18 aus den eigenen Checker-Design-Patterns. Allowlist für Service-Routen ist deterministisch, nicht heuristisch.

---

## Konsequenzen

**Wird einfacher:**
- Neue Routen sind per Default sicher — der Wrapper erzwingt Auth + Org/Ownership.
- Tenant-Isolation wird deterministisch prüfbar; ADR-027 kann „Tenant-Isolation" perspektivisch von Polish-High auf Killer hochstufen (FP-Risiko sinkt, weil Detection nicht mehr heuristisch ist).
- Das eigene Audit dogfoodet das Kernversprechen — kein Self-Exempt mehr.

**Wird schwieriger:**
- 164 Routen müssen migriert werden (mechanisch, aber Umfang).
- Wrapper-Signaturen erzeugen einmaligen Refactor-Aufwand und Test-Bedarf.
- Option B verlangt, RLS-Policies pro Read-Pfad real zu verifizieren.

**Zu revisitieren:**
- ADR-027 Killer-/Polish-Einstufung von Tenant-Isolation nach Wrapper-Roll-out.
- ADR-004-Notiz: supabaseAdmin bleibt Query-Pfad, aber nicht mehr der einzige für Read.

---

## Action Items

1. [x] **Route-Inventar** (2026-06-11): alle 197 `route.ts` erfasst → `docs/audit/route-authorization-inventory.md` (8 parallele Explore-Agenten). **Zwei Folge-Befunde:** (a) zwei Wrapper fehlen — `withWorkspaceAccess` (~20 workspaces/*-Routen) + `withSuperadmin` (~16 superadmin/* + admin/qa/*) → neues Action Item 2b. (b) Sicherheits-Findings vor Rollout zu triagieren, u.a. 🔴 `superadmin/impersonate/[id]` GET ohne Auth und `feeds/[id]/pause|resume|run|runs` ohne Org/Source-Ownership.
2b. [x] **Zwei fehlende Wrapper gebaut** (2026-06-11): `withWorkspaceAccess` (Read/Write-Schalter via `opts.write`, nutzt `canReadWorkspace`/`canWriteWorkspace`) + `withSuperadmin` (role==='superadmin') in `route-guards.ts`. 26 Unit-Tests grün, tsc sauber. Hinweis: `getAuthUser` liefert `role:string`; Workspace-Helfer erwarten ein engeres Union → Cast am Call-Site (laufzeit-sicher).
2. [x] `withAuth()` / `withOrgAdmin()` / `withProjectAccess()` (+ `withCronAuth()`) in `src/lib/auth/route-guards.ts` gebaut, inkl. 15 Unit-Tests (`route-guards.unit.test.ts`). ✅ 2026-06-11 — Tests grün, tsc sauber.
3. [x] **Checker-Regel** `cat-3-rule-27` (2026-06-11): `src/lib/audit/checkers/route-authorization-checker.ts` — datenfluss-basiert (liest Inhalt, kein `f.imports`/Signatur, P1/P7/P18), deterministische Allowlist (cron/inbound/webhook/public + health/waitlist/s/shared), P6-Disk-Fallback. **Nicht-blockierend** (enforcement: reviewed, weight 2): misst Wrapper-Abdeckung, Score steigt mit Rollout auf 5. 8 Unit-Tests grün. Gegen echtes Repo verifiziert: Score 4, **0 falsche „kein Auth"-Findings**, 3/154 migriert, 151 Migrationsschuld (low). Real-Test deckte Bug auf (generische Wrapper-Form `withProjectAccess<…>(` wurde nicht erkannt) — gefixt + per Fixture abgesichert.
4. [x] **Pilot** (2026-06-11): 3 Routen / 7 Handler migriert — `projects/[id]` (withProjectAccess), `projects` (withAuth), `admin/branding` (withOrgAdmin). `next build` grün, `tsc` sauber, 16 Unit-Tests grün. **Zwei Befunde:**
   - **Signatur-Refinement:** Wrapper-Kontext muss *required* sein (nicht optional) — ein `ctx?:` zieht `| undefined` in den Typ und bricht Next's `ParamCheck`. Behoben; `withOrgAdmin` um optionales `roles`-Set erweitert.
   - **owner-Rollen-Divergenz (GELÖST 2026-06-11):** Verifiziert — `users_role_check` erlaubt `owner`, RLS-Policies (002/014/032/033) behandeln `('owner','admin','superadmin')` durchgängig als Org-Admin-Tier, alle Admin-Routen ebenso. `requireOrgAdmin()` (nur `['admin','superadmin']`) war der Ausreißer. **Entscheidung (Timm):** kanonisches Set = `['owner','admin','superadmin']`. Umgesetzt: `ORG_ADMIN_ROLES`-Default inkl. owner, `requireOrgAdmin()` angeglichen, `{ roles }`-Override aus `admin/branding` entfernt. Korrigiert ADR-007 (siehe dortige Amendment-Notiz).
5. [x] **Roll-out** der Routen in Tranchen (Checker-CI-Gate-Flip = verbleibende Verfeinerung, s.u.).
   - [x] Tranche 1 (2026-06-11): `projects/[id]/*` — 7 Dateien auf `withProjectAccess` migriert (chats, documents, documents/[docId], memory, memory/[memId], memory/summary, merge). `merge` als Sonderfall (Quelle via Wrapper, Ziel inline `verifyProjectAccess`). `profile` ausgelassen (Scan-Projekt → `withAuth`-Tranche). `next build` grün, tsc sauber. Checker-Abdeckung 3 → **10/154**, 0 echte Lücken.
   - [x] Tranche 2 (2026-06-11): `withAuth`-Batch über 5 parallele Agenten — 37 Dateien (cockpit 11 inkl. budget/team-activity → `withOrgAdmin`; guided 6; agents 6; conversations+chat 8; perspectives 6). Streng mechanisch (Auth-Boilerplate→Wrapper, `me`→`auth`, übrige Logik verbatim). Zentral verifiziert: tsc sauber, `next build` grün, Stichproben ok. Checker-Abdeckung 10 → **43/154**, 0 echte Lücken. Hinweise: `cockpit/recommendation` 401-Shape normalisiert (`{recommendation:null}` → Standard-401); `agents/webhook/*` (HMAC) bewusst ausgelassen.
   - [x] Tranche 3 (2026-06-11): admin + superadmin über 3 parallele Agenten + impersonate manuell — 22 Dateien (admin/* 5 → `withOrgAdmin`; admin/qa/* 7 → `withSuperadmin`; superadmin/* 8 → `withSuperadmin`; superadmin/impersonate* 2 manuell, Scoping `.eq('superadmin_id', auth.id)` erhalten). `next build` grün (erster Build-Test von `withSuperadmin`), tsc sauber. Checker-Abdeckung 43 → **58/154**, 0 echte Lücken. Fallout: `admin/qa/compliance`-Route-Test auf gewrappte Signatur nachgezogen; Registry-Count-Test (war stale: 37, real 43) auf 44 aktualisiert. **REVIEW erledigt (2026-06-11):** `admin/budget` GET **und** PATCH waren cross-org (GET las alle Orgs, PATCH konnte jede Org/Workspace per ID ändern). Gefixt mit Org-Scoping: Nicht-Superadmins sehen/ändern nur die eigene Org; Superadmin alles. **Vorbestehend (nicht aus dieser Arbeit):** 3 Fehler in `src/lib/repo-map/*`-Tests.
   - [x] Tranche 4 (2026-06-11): workspaces + feeds + cron über 3 parallele Agenten — 42 Dateien (workspaces 24 → `withWorkspaceAccess` Read/Write aus Original-Zugriffsfunktion abgeleitet, `picker` → `withAuth` Sonderfall; feeds 12 → `withAuth`/`withOrgAdmin`, `verifyFeedSourceAccess` erhalten, `feeds/inbound/email` ausgelassen; cron 6 → `withCronAuth`). `next build` grün (erster Build-Test von `withWorkspaceAccess`), tsc sauber, volle Test-Suite ohne neue Fehler. Checker-Abdeckung 58 → **89/154**, 0 echte Lücken. Hinweise (beabsichtigte Wrapper-Semantik): 403→404-Normalisierung bei vormaligen Write-403-Pfaden; bei members POST/PATCH/DELETE läuft Workspace-Guard (404) nun vor inline-Rollen-Check (403).
   - [x] Tranche 5 / final (2026-06-11): library+skills+capabilities (26) + audit (17) + settings/artifacts/announcements (14) + misc-rest (16) über 4 parallele Agenten — ~73 Dateien. Überwiegend `withAuth`, plus `withOrgAdmin` (audit/fix*, audit/review, audit/trigger, audit/findings, home/org-stats, usage/stats, org-settings), `withSuperadmin` (audit/run, library/versions). `next build` grün, tsc sauber, volle Test-Suite nur mit 3 vorbestehenden repo-map-Fehlern. Checker-Abdeckung 89 → **151/154 → Score 5**, 0 echte Lücken. **Zentrale Korrekturen nach Agenten-Reports:** `home/org-stats` null-safe-Fix; `announcements` (route + [id]) auf `withAuth` zurückgenommen (inline `checkAccess`/Tropen-vs-Org-Logik autorisiert vollständig — `withOrgAdmin` hätte Verhalten geändert); `knowledge` GET (RLS→supabaseAdmin) als tenant-safe verifiziert (org_id-Spalte existiert). **3 legitime Ausnahmen ungewrappt:** `debug/feeds` (eigener Superadmin+prod-404-Guard), `onboarding/complete` (Bootstrap ohne org_id), `projects/scan` (migrierbar, unkritisch).

**Abschluss-Verfeinerung (erledigt 2026-06-11):** `projects/scan` → `withAuth` migriert; `debug/feeds` + `onboarding/complete` explizit in die Checker-Allowlist; Checker-Scoring auf **Gate-Semantik** umgestellt (volle Abdeckung für Score 5; un-gewrappte supabaseAdmin-Route = medium-Finding + Score-Abfall, statt Toleranzband). Real-Repo jetzt **152/152, Score 5, 0 Findings**. Ein NEUER ungewrappter supabaseAdmin-Route-Export fällt damit sofort auf. (Hart-blockierend/isKiller bewusst NICHT — bleibt Polish-Signal, kein Publikations-Blocker für das eigene Repo.)
6. [ ] **Option B (Folge-Sprint):** Read-Pfade tranchenweise auf RLS-Client umstellen, RLS-Policies dabei verifizieren.
7. [ ] Nach Roll-out: ADR-027 Tenant-Isolation-Einstufung neu bewerten.

---

## Status

**Accepted**, erstellt und angenommen am 2026-06-11 durch Timm. Das 24h-Wait aus Pivot-Disziplin Regel #1 wurde durch ausdrückliche Decider-Entscheidung verkürzt (Annahme am selben Tag). Roll-out beginnt mit dem Route-Inventar (Action Item 1) und der Pilot-Validierung (Action Item 4); der Checker wird erst nach gemessener FP-Rate als CI-Gate scharf geschaltet.
