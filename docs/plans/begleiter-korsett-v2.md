# Korsett v2 — Foundation-Entscheidungsbaum (festgeschrieben)

> **Status:** **v2 · festgeschrieben** · Komitee-Loop gestoppt nach Runde 2 (abnehmende Erträge)
> **Historie:** `begleiter-korsett-v0.md` → `-v1.md` → v2 · Reviews: `docs/committee-reviews/korsett-v0-review.md`, `-v1-review.md`
> **Kalibrierung:** Supabase + Next.js + TypeScript (tiefster Ast)
> **Nächster echter Schritt:** nicht Runde 3, sondern **L2-Premissen-Validierung** (zieht jemand das Tool *vor* dem Bauen?)

## Änderungen ggü. v1 (aus Komitee-Runde 2)
- ➕ **Transaktions-E-Mail (EM)** als 🔴 (EINIG — prägt Provider-Wahl, oft Auth-kritisch)
- 🔗 **DEP1+DEP2 → ein „Deploy & CI"-Knoten** (DEP), als 🔴 (Hosting bestimmt Sub-Prozessoren + Backup)
- ✂️ **F3 Design-System** in F2 gefaltet (Tailwind reicht — keine Token-Akrobatik)
- ✂️ **D10 Realtime gestrichen** (kein Foundation-Knoten; projekt-spezifisch)
- ➕ **Background-Jobs (BG)** + **Seed-/Demo-Daten (SEED)** als 🟡
- *Gehalten gegen Einzelmeinungen:* API1 bleibt 🔴, D4 bleibt 🟡

## Legende
**Frage** · **Default** · **Kosten** — 🔴 architektur-prägend (aufschieben = Umbau) · 🟡 anbaubar (park „später").
**Awareness, kein Gate.** „GO" = alle *zutreffenden* 🔴 entschieden, 🟡 bewusst geparkt. Pro Projekt entfallen ganze Äste → effektive 🔴-Zahl ist klein (~12–15).

---

## 0 · Projekt-Definition (zuerst)
| # | Frage | Default | Kosten |
|---|-------|---------|--------|
| P0 | **Greenfield oder bestehend?** (bestehend → Daten-Migration, Breaking-Changes, vorhandene Konventionen übernehmen) | greenfield | 🔴 |
| P1 | **Was baust du** (Typ → Overlay) — und was bewusst **NICHT** im ersten Wurf? | *(erfragen)* | 🔴 |

## A · Universelle Knoten
| # | Frage | Default | Kosten |
|---|-------|---------|--------|
| U1 | **Ziel & Scope** in einem Satz | *(erfragen)* | 🔴 |
| U2 | **SSOT** — wo die *eine* Wahrheit liegt, generiert statt dupliziert | DB-Schema = SSOT, Typen generiert *(stack-spez.)* | 🔴 |
| U3 | **Git ab Commit 1** + **`CLAUDE.md`/README** als KI-Kontext | sofort | 🟡 |
| U4 | **Secrets** — wie gehalten? | `.env.local` gitignored + `.env.example` | 🔴 |
| U5 | **Error-/Logging-Disziplin** (strukturiert, kein PII, kein `console.log` Prod) | zentraler Logger | 🟡 |
| U6 | **Naming & Ordnerstruktur** | Framework-Standard *(stack-spez.)* | 🔴 |

## B · Frontend (wenn Web-UI)
| # | Frage | Default | Kosten |
|---|-------|---------|--------|
| F1 | **Rendering-Strategie** (SSR/SSG/RSC/CSR) | Next.js App Router, RSC default | 🔴 |
| F2 | **State-Management + UI-Basis** | Server-State via Query-Lib; Client-State minimal; Tailwind + 1 Komponenten-Lib *(keine Design-Token-Akrobatik)* | 🔴 |

## C · API / Client-Server
| # | Frage | Default | Kosten |
|---|-------|---------|--------|
| API1 | **Kommunikations-Pattern** (Server Actions / Route Handlers / tRPC / REST) | Next.js Server Actions + Route Handlers | 🔴 |

## D · Datenbank (Supabase-Ast; *keine DB* → entfällt)
| # | Frage | Default | Kosten |
|---|-------|---------|--------|
| D1 | **Multi-Tenant (`org_id`)** oder Single? | wenn je Mehr-Mandanten denkbar → `org_id` jetzt | 🔴🔴 |
| D2 | **`app_users.id = auth.users.id`** (1:1)? | 1:1-Spiegel | 🔴 |
| D3 | **RLS auf jeder Tabelle**, in derselben Migration? | RLS-an + Policy mit jedem `CREATE TABLE` | 🔴 |
| D4 | ⚠️ **Security-Härtung** (RLS-Helper `search_path` gepinnt, `security_invoker` auf Views, Rolle im JWT) — *kritisch wenn ignoriert* | Härtungs-Checkliste | 🟡 (kritisch) |
| D5 | **Server/Client-Schreibgrenze** (Service-Role nur server-seitig)? | Service-Role nie im Client | 🔴 |
| D6 | **Löschen** soft / append-only-Historie? | soft-delete User-Daten; append-only Audit | 🟡 (🔴 bei Retention-Pflicht) |
| D7 | **Migrations-Disziplin** (Datei zuerst, dann anwenden; RLS inklusive) | `supabase/migrations`, eine pro Änderung | 🔴 |
| D9 | **Storage & Uploads + Bucket-RLS** (wenn Uploads) | privat default; RLS auf `storage.objects` | 🔴 |

> **Eigener Schema-Review *nach* der ersten Migration** (kein Foundation-Gate): FK-`on delete`, Ranking statt int-`sort_order`, enum-vs-CHECK, jsonb-Integrität.

## E · Auth (wenn Accounts)
| # | Frage | Default | Kosten |
|---|-------|---------|--------|
| A1 | **Auth-Methode** (Magic-Link / Passwort / OAuth) | Provider-Auth; Wahl = Flow-Umbau | 🔴 |
| A2 | **Account-Lifecycle** (Reset, Verify, **Löschung**) | von Anfang mitdenken | 🟡 (🔴 bei PII) |
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
| L3 | **Juristische Pflichten** (Firmensitz → Impressum; Zahlungen → Fernabsatz) | Impressum, Widerruf, AGB | 🟡 |
| L4 | **B2C/B2B → BFSG/a11y** | B2C-Web = Pflicht seit 2025; WCAG 2.2 / EN 301 549 | 🔴 bei B2C-Web |
| L5 | **Sub-Prozessoren & Tracking** (LLM/Analytics/Mail → AVV-Kette, VVT; Tracking → Cookie-Consent TTDSG) | AVV, Cookie-Consent | 🟡 (🔴 wo Daten fließen) |

## I · Betrieb, Deploy & Integrationen
| # | Frage | Default | Kosten |
|---|-------|---------|--------|
| DEP | **Deploy & CI** (Hosting-Ziel + lint/build/test-Gate vor Deploy) *(DEP1+DEP2 zusammengelegt)* | Vercel + minimaler CI-Gate | 🔴 |
| EM | **Transaktions-E-Mail** (Auth-Mails, Notifications) — Provider, Templates, Sub-Prozessor | Resend/Postmark; in L5 (AVV) aufnehmen | 🔴 |
| BG | **Background-Jobs / Cron** (wenn nötig) | Supabase Edge Functions / Cron; Queue nur bei Bedarf | 🟡 |
| SEED | **Seed-/Demo-Daten** (Greenfield) — reproduzierbarer Start | Seed-Skript mit realistischen Daten | 🟡 |
| O1 | **Observability** („woran merkst du, dass Prod kaputt ist?") | Error-Tracking ab Launch | 🟡 |
| B1 | **Umgebungen & Backups** (Prod≠Dev, Backup/PITR, Restore testen) | getrennte DBs; Backups an | 🔴 |

---

## Startpaket-Ableitung
Decision-Log (🔴=`decision`, geparkte 🟡=`open_question`/„später") · `CLAUDE.md` · erste Migration (Durchstich-Slice) · `.env.example` · Reifegrad-Signal („🔴 entschieden ✅ · N×🟡 geparkt → leg los").

## Status & nächster Schritt
Zwei adversariale Komitee-Runden (€0,60 gesamt). Konvergenz von „fehlende Domäne" (R1: Frontend) zu „Knoten-Trimm" (R2: Email + Merges) → **festgeschrieben.** Weitere Review-Runden = abnehmende Erträge.

**Die offene Wette ist nicht die Taxonomie, sondern die Premisse.** Validierung in den L2-Calls: *Zieht ein Vibe-Coder so ein Foundation-Tool, bevor er baut — oder erst nach dem ersten Schmerz?* Trägt die Premisse, ist v2 ein mehr-als-solides Fundament zum Start.
