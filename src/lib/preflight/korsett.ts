// src/lib/preflight/korsett.ts
import type { KorsettNode } from './types'

export const KORSETT: KorsettNode[] = [
  // 0 · Projekt-Definition
  { id: 'P0', domain: 'Projekt', frage: 'Greenfield oder bestehende App?', warum: 'Bestehend = Daten-Migration, Breaking-Changes, vorhandene Konventionen übernehmen', default: 'greenfield', kosten: 'red' },
  { id: 'P1', domain: 'Projekt', frage: 'Was baust du (Typ) — und was bewusst NICHT im ersten Wurf?', warum: 'Scope-Grenze; bestimmt Domänen-Overlay', default: '(erfragen)', kosten: 'red' },
  // A · Universell
  { id: 'U1', domain: 'Universell', frage: 'Ziel & Scope in einem Satz', warum: 'Ohne Scope wuchert alles', default: '(erfragen)', kosten: 'red' },
  { id: 'U2', domain: 'Universell', frage: 'Wo ist die SSOT, Code generiert statt dupliziert?', warum: 'Duplikate driften', default: 'DB-Schema = SSOT, Typen generiert', kosten: 'red' },
  { id: 'U3', domain: 'Universell', frage: 'Git ab Commit 1 + CLAUDE.md/README als KI-Kontext?', warum: 'Die KI hat kein Gedächtnis', default: 'sofort', kosten: 'yellow' },
  { id: 'U4', domain: 'Universell', frage: 'Wie werden Secrets gehalten?', warum: 'Klartext-Key im Repo = nicht-rückrufbarer Leak', default: '.env.local gitignored + .env.example', kosten: 'red' },
  { id: 'U5', domain: 'Universell', frage: 'Error-/Logging-Disziplin (kein PII, kein console.log Prod)?', warum: 'Debugbarkeit + Datenschutz', default: 'zentraler Logger', kosten: 'yellow' },
  { id: 'U6', domain: 'Universell', frage: 'Naming & Ordnerstruktur?', warum: 'Lesbarkeit/Fortführbarkeit', default: 'Framework-Standard', kosten: 'red' },
  // B · Frontend
  { id: 'F1', domain: 'Frontend', frage: 'Rendering-Strategie (SSR/SSG/RSC/CSR)?', warum: 'Prägt Datenfetch + Performance', default: 'Next.js App Router, RSC', kosten: 'red', appliesWhen: 'frontend' },
  { id: 'F2', domain: 'Frontend', frage: 'State-Management + UI-Basis?', warum: 'Falsche Wahl = großer Umbau', default: 'Server-State via Query-Lib; Tailwind + 1 Komponenten-Lib', kosten: 'red', appliesWhen: 'frontend' },
  // C · API
  { id: 'API1', domain: 'API', frage: 'Kommunikations-Pattern (Server Actions / Route Handlers / tRPC / REST)?', warum: 'Bestimmt die Client-Server-Grenze', default: 'Next.js Server Actions + Route Handlers', kosten: 'red' },
  // D · Datenbank
  { id: 'D1', domain: 'Datenbank', frage: 'Multi-Tenant (org_id) oder Single?', warum: 'org_id nachrüsten = Albtraum', default: 'wenn je Mehr-Mandanten denkbar → org_id jetzt', kosten: 'red', appliesWhen: 'db' },
  { id: 'D2', domain: 'Datenbank', frage: 'app_users.id = auth.users.id (1:1)?', warum: 'Bestimmt jede RLS-Policy', default: '1:1-Spiegel', kosten: 'red', appliesWhen: 'db' },
  { id: 'D3', domain: 'Datenbank', frage: 'RLS auf jeder Tabelle, in derselben Migration?', warum: 'Tabelle ohne RLS = jeder sieht alles', default: 'RLS-an + Policy mit jedem CREATE TABLE', kosten: 'red', appliesWhen: 'db' },
  { id: 'D4', domain: 'Datenbank', frage: 'Security-Härtung (search_path gepinnt, security_invoker, Rolle im JWT)?', warum: 'Hijacking / RLS-Bypass', default: 'Härtungs-Checkliste', kosten: 'yellow', appliesWhen: 'db' },
  { id: 'D5', domain: 'Datenbank', frage: 'Server/Client-Schreibgrenze (Service-Role nur server-seitig)?', warum: 'Service-Role im Client = ganze DB offen', default: 'Service-Role nie im Client', kosten: 'red', appliesWhen: 'db' },
  { id: 'D6', domain: 'Datenbank', frage: 'Löschen soft / append-only-Historie?', warum: 'Retention/Rollback', default: 'soft-delete User-Daten; append-only Audit', kosten: 'yellow', appliesWhen: 'db' },
  { id: 'D7', domain: 'Datenbank', frage: 'Migrations-Disziplin (Datei zuerst, dann anwenden)?', warum: 'Sonst Git↔DB-Drift', default: 'supabase/migrations, eine pro Änderung', kosten: 'red', appliesWhen: 'db' },
  { id: 'D9', domain: 'Datenbank', frage: 'Storage & Uploads + Bucket-RLS?', warum: 'Öffentlicher Bucket = Leak', default: 'privat default; RLS auf storage.objects', kosten: 'red', appliesWhen: 'uploads' },
  // E · Auth
  { id: 'A1', domain: 'Auth', frage: 'Auth-Methode (Magic-Link/Passwort/OAuth)?', warum: 'Wahl = Flow-Umbau', default: 'Provider-Auth', kosten: 'red', appliesWhen: 'auth' },
  { id: 'A2', domain: 'Auth', frage: 'Account-Lifecycle (Reset, Verify, Löschung)?', warum: 'Löschung = DSGVO', default: 'von Anfang mitdenken', kosten: 'yellow', appliesWhen: 'auth' },
  { id: 'A3', domain: 'Auth', frage: 'Authz-Modell (Rollen/Permissions)?', warum: 'Bestimmt RLS-Komplexität', default: 'Rolle im JWT-Claim', kosten: 'red', appliesWhen: 'auth' },
  // F · PII
  { id: 'PII1', domain: 'PII', frage: 'Datenarten-Inventar?', warum: 'Datensparsamkeit', default: 'nur erheben was nötig', kosten: 'yellow', appliesWhen: 'pii' },
  { id: 'PII2', domain: 'PII', frage: 'Besondere Kategorien (Art. 9) / Kinder (Art. 8)?', warum: 'Strengere Pflichten', default: 'wenn ja → trennen/verschlüsseln', kosten: 'red', appliesWhen: 'pii' },
  { id: 'PII3', domain: 'PII', frage: 'Datenresidenz (EU-Region)?', warum: 'Drittland → Transfer', default: 'EU-Region', kosten: 'red', appliesWhen: 'pii' },
  // G · KI
  { id: 'AI1', domain: 'KI', frage: 'Risiko-Tier (verboten/hochrisiko/begrenzt/minimal)?', warum: 'AI-Act-Pflichten', default: 'meist begrenzt → Transparenz', kosten: 'yellow', appliesWhen: 'ai' },
  { id: 'AI2', domain: 'KI', frage: 'Datenfluss (User-/PII-Daten an LLM? Provider, Retention, AVV)?', warum: 'Sub-Prozessor entsteht sofort', default: 'Zero-Retention/Gateway, AVV', kosten: 'red', appliesWhen: 'ai' },
  { id: 'AI3', domain: 'KI', frage: 'Kosten/Missbrauch (Rate-Limit + Budget-Cap)?', warum: 'Runaway-Rechnung', default: 'ab Tag 1', kosten: 'red', appliesWhen: 'ai' },
  // H · Recht
  { id: 'L1', domain: 'Recht', frage: 'Hosting / Daten-Residenz?', warum: 'EU vs. Drittland → Transfer', default: 'EU', kosten: 'red' },
  { id: 'L2', domain: 'Recht', frage: 'Zielgruppe-Standort?', warum: 'EU-User → DSGVO extraterritorial', default: '(erfragen)', kosten: 'yellow' },
  { id: 'L3', domain: 'Recht', frage: 'Juristische Pflichten (Impressum; Zahlungen → Fernabsatz)?', warum: 'Impressum, Widerruf, AGB', default: '(ableiten)', kosten: 'yellow' },
  { id: 'L4', domain: 'Recht', frage: 'B2C/B2B → BFSG/a11y?', warum: 'B2C-Web = Pflicht seit 2025 (WCAG 2.2/EN 301 549)', default: '(ableiten)', kosten: 'red', appliesWhen: 'b2c' },
  { id: 'L5', domain: 'Recht', frage: 'Sub-Prozessoren & Tracking (AVV-Kette; Cookie-Consent)?', warum: 'Art. 28, TTDSG', default: 'AVV + Consent', kosten: 'yellow' },
  // I · Betrieb
  { id: 'DEP', domain: 'Betrieb', frage: 'Deploy & CI (Hosting-Ziel + Test-Gate)?', warum: 'Hosting bestimmt Sub-Prozessoren + Backup', default: 'Vercel + minimaler CI-Gate', kosten: 'red' },
  { id: 'EM', domain: 'Betrieb', frage: 'Transaktions-E-Mail (Auth-Mails, Notifications)?', warum: 'Provider-Wahl, Sub-Prozessor', default: 'Resend/Postmark; in AVV (L5)', kosten: 'red', appliesWhen: 'auth' },
  { id: 'BG', domain: 'Betrieb', frage: 'Background-Jobs / Cron?', warum: 'Asynchrone Arbeit', default: 'Edge Functions / Cron; Queue nur bei Bedarf', kosten: 'yellow', appliesWhen: 'jobs' },
  { id: 'SEED', domain: 'Betrieb', frage: 'Seed-/Demo-Daten?', warum: 'Reproduzierbarer Start', default: 'Seed-Skript', kosten: 'yellow', appliesWhen: 'greenfield' },
  { id: 'O1', domain: 'Betrieb', frage: 'Observability (woran merkst du, dass Prod kaputt ist)?', warum: 'Ship-and-pray', default: 'Error-Tracking ab Launch', kosten: 'yellow' },
  { id: 'B1', domain: 'Betrieb', frage: 'Umgebungen & Backups (Prod≠Dev, Backup/PITR)?', warum: 'dev-gegen-prod + kein Backup = Katastrophe', default: 'getrennte DBs; Backups an', kosten: 'red' },
]
