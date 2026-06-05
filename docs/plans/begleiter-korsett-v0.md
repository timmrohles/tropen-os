# Korsett v0 — Foundation-Entscheidungsbaum

> **Status:** v0 · Entwurf zur Komitee-Verifikation · Phase-2-Konzept, nicht in Bau
> **Konzept-Basis:** `docs/plans/begleiter-foundation-korsett.md`
> **Kalibrierung:** Supabase + Next.js + TypeScript (tiefster Ast; andere Stacks = Stub)

## Legende

Jeder Knoten: **Frage** · *Warum* · **Default** (kontextuell) · **Aufschub-Kosten** · **gilt-wenn**

- 🔴 **architektur-prägend** — aufschieben = teurer Umbau → stark nudgen, nie zwingen
- 🟡 **anbaubar** — aufschieben = nachrüstbar → bewusst „später" in den Decision-Log

Prinzip: **Awareness, kein Gate.** Das Korsett *informiert*, blockiert nie. „GO" = alle 🔴 entschieden, alle 🟡 bewusst geparkt.

---

## A · Universelle Knoten (immer, stack-egal)

| # | Frage | Warum | Default | Kosten |
|---|-------|-------|---------|--------|
| U1 | Was baust du in **einem Satz** — und was ist bewusst **NICHT** im ersten Wurf? | Ohne Scope-Grenze wuchert alles | *(erfragen)* | 🔴 |
| U2 | Wo ist die **SSOT** (DB-Schema? Typen? Config)? Wird Code daraus **generiert** statt dupliziert? | Duplikate driften auseinander | DB-Schema = SSOT, Typen generiert (`supabase gen types`) | 🔴 |
| U3 | Gibt es **Git ab Commit 1** + eine **`CLAUDE.md`/README**, damit die Bau-KI nächste Session den Kontext hat? | Die KI hat kein Gedächtnis — Repo-Lesbarkeit *ist* ihr Gedächtnis | Git sofort; Konventions-Datei als KI-Kontext | 🟡 |
| U4 | Wie werden **Secrets** gehalten? | Klartext-Key im Repo = nicht-rückrufbarer Leak | `.env.local` (gitignored) + `.env.example`, nie committen | 🔴 |
| U5 | **Error-/Logging-Disziplin**: strukturierte Errors, kein `console.log` in Prod, kein PII in Logs? | Debugbarkeit + Datenschutz | zentraler Logger, strukturierte API-Errors | 🟡 |
| U6 | **Naming & Ordnerstruktur** festgelegt? | Lesbarkeit/Fortführbarkeit für andere + die KI | Framework-Standard; DB snake_case, Code camelCase | 🟡 |

---

## P0 · Greenfield oder bestehende App?
→ **bestehend** schaltet zusätzlich frei: Daten-Migration bestehender Daten, Breaking-Change-Strategie, *vorhandene Konventionen übernehmen statt neu erfinden*. *(v0: Stub)*

## P1 · Was baust du? (Typ → Domänen-Overlay)
→ bestimmt das Overlay (LMS, Marktplatz, SaaS, …). *(v0: nur erfassen; Overlays Phase 2)*

---

## P2 · Datenbank? → welche?

→ **keine DB** = ganzer Ast entfällt. → **Supabase** (tiefer Ast):

| # | Frage | Warum | Default | Kosten |
|---|-------|-------|---------|--------|
| D1 | **Multi-Tenant** (`org_id` auf jeder Tabelle) oder Single-Tenant? | `org_id` nachrüsten = Albtraum | Wenn je Mehr-Mandanten/White-Label denkbar → `org_id` **jetzt**. Sonst bewusst single | 🔴🔴 |
| D2 | **`app_users.id` = `auth.users.id`** (1:1) oder getrennt? | Bestimmt *jede* RLS-Policy (`auth.uid() = id`) | 1:1-Spiegel | 🔴 |
| D3 | **RLS auf jeder Tabelle**, in **derselben Migration** wie die Tabelle? | Tabelle ohne RLS = jeder sieht alles | RLS-an + Policy mit jedem `CREATE TABLE` | 🔴 |
| D4 | **Rolle aus dem JWT** (Custom Access Token Hook)? SECURITY-DEFINER-Helper mit gepinntem `search_path`? | search_path-Hijacking, Definer-View-Bypass (real erlebt) | Custom-Claims-Hook; `SET search_path = public` auf Helpern; `security_invoker` auf Views | 🟡 |
| D5 | **Server/Client-Schreibgrenze**: welche Writes laufen über **Service-Role** (server), welche per RLS-Client? | Service-Role im Client = ganze DB offen | Service-Role **nur** server-seitig (API/Edge) | 🔴 |
| D6 | **Löschen** = hard oder `archived` (soft-delete)? Welche Tabellen **append-only**? | Retention/Rollback; ggf. reguliert | soft-delete (`deleted_at`) für User-Daten; append-only für Historie/Audit | 🟡 (🔴 bei Retention-Pflicht) |
| D7 | **Migrations-Disziplin**: jede Schema-Änderung erst als **Datei**, dann anwenden (Git-zuerst-DB)? | sonst driftet Git↔DB (real erlebt) | `supabase/migrations`, eine pro Änderung, RLS inklusive | 🔴 |
| D8 | **Schema-Hygiene**: FK-`on delete` definiert? `sort_order` (int-Reindex vs. Ranking)? enum vs. CHECK/Lookup? jsonb mit referenzieller Integrität? | spätere Datenintegritäts- & Reorder-Schmerzen | FK explizit; Ranking statt int bei Drag-Reorder; CHECK statt enum bei wachsenden Werten | 🟡 |

→ **Firebase / raw Postgres / andere** = Stub (strukturelle Fragen, dünne Defaults).

---

## P3 · Auth / User-Accounts?

| # | Frage | Warum | Default | Kosten |
|---|-------|-------|---------|--------|
| A1 | **Auth-Methode** (Magic-Link / Passwort / OAuth)? | bestimmt Flows + Sicherheit | Provider-Auth (Supabase Auth), Magic-Link für B2C | 🟡 |
| A2 | **Account-Lifecycle**: Passwort-Reset, E-Mail-Verify, **Account-Löschung**? | Löschung ist auch DSGVO-Pflicht | von Anfang mitdenken | 🟡 (🔴 wenn PII) |
| A3 | **Authz-Modell**: Rollen/Permissions — wie abgebildet? | bestimmt RLS-Komplexität | Rolle im JWT-Claim (siehe D4) | 🔴 bei mehreren Rollen |

---

## P4 · Personenbezogene Daten (PII)?

| # | Frage | Warum | Default | Kosten |
|---|-------|-------|---------|--------|
| PII1 | **Datenarten-Inventar** — welche personenbezogenen Daten? | Datensparsamkeit (Art. 5) | nur erheben, was nötig ist | 🟡 |
| PII2 | **Besondere Kategorien** (Gesundheit/Biometrie, Art. 9) oder **Kinderdaten** (Art. 8)? | strengere Pflichten, ggf. Verschlüsselung/Trennung | wenn ja → architektonisch trennen/verschlüsseln | 🔴 |
| PII3 | **Datenresidenz** — wo gespeichert (EU-Region)? | Drittland → Transfer-Mechanismus | EU-Region wählen | 🔴 |

---

## P5 · KI-Features?

| # | Frage | Warum | Default | Kosten |
|---|-------|-------|---------|--------|
| AI1 | **Risiko-Tier** (verboten / hochrisiko / begrenzt / minimal)? | AI-Act-Pflichten | meist „begrenzt" → Transparenzpflicht | 🟡 (🔴 bei hochrisiko) |
| AI2 | **Datenfluss**: gehen User-/PII-Daten an einen **LLM-Provider**? welcher, Retention, **AVV**? | Sub-Prozessor entsteht sofort | Zero-Retention-Provider / AI-Gateway, AVV abschließen | 🔴 |
| AI3 | **Kosten/Missbrauch**: Rate-Limit + **Budget-Cap** auf LLM-Endpoints? | Runaway-Rechnung über Nacht | Rate-Limit + Budget-Cap ab Tag 1 | 🔴 |

---

## P6 · ⚖️ Recht / Jurisdiktion (Querschnitt-Synthese)

Zieht Signale aus P4/P5 + eigene Fakten. **Ableiten, nicht fragen.** Stufe 1 (Existenz/Hinweis) + Disclaimer „ersetzt keinen Anwalt".

| # | Faktenfrage | Leitet ab | Kosten |
|---|-------------|-----------|--------|
| L1 | Wo **gehostet** / Daten-Residenz? | EU vs. Drittland → Transfer-Mechanismus | 🔴 |
| L2 | Wo sitzt die **Zielgruppe**? | EU-User → DSGVO (extraterritorial) | 🟡 (Awareness) |
| L3 | Wo sitzt der **Rechtsträger**? | Impressumspflicht, zuständige Aufsicht | 🟡 |
| L4 | **B2C oder B2B**? | **BFSG** (a11y, 🔴 bei B2C-Web), Widerruf, AGB | 🟡 Paperwork / 🔴 a11y |
| L5 | **Zahlungen**? | PCI (oder Stripe-Auslagerung), Fernabsatz | 🟡 |
| L6 | **Sub-Prozessoren** (LLM, Analytics, Mail)? | AVV-Kette (Art. 28), VVT, Transfer | 🟡 Paperwork / 🔴 wo Daten fließen |
| L7 | **Tracking/Marketing**? | Cookie-Consent (TTDSG) vor Tracking | 🟡 |

---

## Q · Betrieb (quer, oft vergessen)

| # | Frage | Warum | Default | Kosten |
|---|-------|-------|---------|--------|
| O1 | **Observability**: „Woran merkst du, dass Prod kaputt ist?" Error-Tracking + Uptime? | sonst ship-and-pray | Error-Tracking (Sentry) ab Launch | 🟡 |
| B1 | **Umgebungen & Backups**: Prod von Dev getrennt? Entwickelst du gegen Prod? Backup/PITR an? | dev-gegen-prod + kein Backup = Katastrophe (real erlebt) | getrennte Projekte/DBs; Backups an; Restore einmal testen | 🔴 |

---

## Startpaket-Ableitung (was v0 erzeugt)

Aus den Antworten generiert der Begleiter (kopierbar, **nie** ins Repo geschrieben):
1. **Decision-Log** (🔴 als `decision`, geparkte 🟡 als `open_question`/„später")
2. **`CLAUDE.md`** mit den getroffenen Konventionen (U2/U3/U4/U6/D7 …)
3. **Erste Migration** für den Durchstich-Slice (auth + `app_users` + härteste RLS zuerst)
4. **`.env.example`** (aus U4 + Sub-Prozessoren L6)
5. **Reifegrad-Signal**: „🔴 entschieden ✅ · N×🟡 geparkt (im Log, kommen im Audit wieder) → leg los"

---

## Offene Fragen an das Komitee
1. Fehlt ein **universeller** Knoten oder ein **Pivot**?
2. Ist ein als 🟡 markierter Knoten in Wahrheit 🔴 (oder umgekehrt)?
3. Welche Knoten sind **over-engineered** für einen Solo-Vibe-Coder (Korsett, keine Zwangsjacke)?
4. Stimmt die **Baum-Form** (sind das die richtigen Pivots / Verzweigungen)?
5. Ist ein „universeller" Knoten in Wahrheit **stack-spezifisch**?
