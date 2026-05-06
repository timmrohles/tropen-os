# Committee Review: killer-kriterien-komitee

> Generiert am 2026-05-04 · Reviewer: Claude Sonnet, GPT-4o, Gemini 2.5 Pro, Grok 4 · Judge: Claude Opus

---

# Multi-Model Konsens-Report: Killer-Kriterien für Vibe-Coder

## FRAGE 1 — Verfeinerung der Startliste

**Konsens-Level: MEHRHEIT**

### Endgültige Empfehlung

#### Universal (alle Profile) - EINIG
- **Hardcoded Secrets**: ✅ Bleibt (binär)
- **Production-Build bricht ab**: ✅ Bleibt (binär)
- **SQL-Injection-Risiko**: ✅ Bleibt (binär)

#### Public (Profile 3-5) - EINIG
- **Open CORS**: ✅ Bleibt (binär)
- **Keine HTTPS-Erzwingung**: ✅ Bleibt (binär)
- **Stack Traces an Client**: ✅ Bleibt (binär)

#### Multi-User (Profile 4-5) - GESPALTEN
- **API-Routes ohne Auth**: ✅ Bleibt (Claude: >20% Schwellwert, Rest: binär)
- **Tenant-Isolation**: ❌ Streichen (Claude: zu komplex, Rest: bleibt)
- **PII in Logs**: ✅ Bleibt (binär)

#### EU-Markt - GESPALTEN
- **Cookie-Banner**: ❌ Streichen (Claude/Gemini: zu spezifisch, GPT/Grok: bleibt)
- **DSGVO Backup-Pflicht**: ✅ Bleibt für Profile 4-5 (binär)
- **Datenschutzerklärung**: ❌ Streichen (Claude: nicht technisch, Rest: bleibt)
- **Newsletter Double-Opt-In**: ❌ Streichen (Claude: zu spezifisch, Rest: bleibt)

#### B2B/Reguliert (Profil 5) - MEHRHEIT
- **Audit-Logs**: ✅ Bleibt (binär für sensible Ops)
- **Zugriffsrechte-Doku**: ❌ Streichen (Claude: Doku-Check, Rest: bleibt)
- **Soft-Delete**: ✅ Bleibt (binär)

### Wichtigste Spaltungs-Argumente
1. **Tenant-Isolation**: Claude argumentiert "zu viele False Positives", andere sehen es als essentiell
2. **EU-Compliance-Checks**: Claude fokussiert auf technische vs. rechtliche Prüfbarkeit
3. **Auth-Check Schwellwert**: Binär vs. prozentual (>20%) — Pragmatismus vs. Strenge

## FRAGE 2 — Lücken in der Startliste

**Konsens-Level: MEHRHEIT**

### Priorisierte Lücken-Vorschläge (Top 8)

1. **Fehlende Row Level Security (RLS) bei Supabase** (Profile 4-5, binär)
2. **Database-Connection ohne SSL** (Profile 3-5, binär)
3. **Ungepatchte kritische Dependencies (CVSS >9)** (alle Profile, binär)
4. **Fehlende Rate Limiting auf API-Endpoints** (Profile 3-5, binär)
5. **Unbehandelte Promise-Rejections** (Profile 3-5, >3 in kritischen Flows)
6. **Fehlende Input-Validation** (Profile 3-5, >30% der POST/PUT-Routes)
7. **Production-Secrets in Development-Config** (alle Profile, binär)
8. **Kein CSRF-Schutz in Form-Handling** (Profile 4-5, binär)

## FRAGE 3 — Coach-Wording

**Konsens-Level: EINIG**

### Finale Coach-Wordings

**Hardcoded Secrets:**
"🛑 Stopper: API-Key direkt im Code gefunden. Jeder mit Repo-Zugriff kann den Key lesen — auch nach Löschen bleibt er in der Git-History. Key in .env.local verschieben, in .gitignore aufnehmen und beim Provider rotieren."

**Build-Fehler:**
"🛑 Stopper: Production-Build schlägt fehl. Eine nicht deploybare App kann nicht veröffentlicht werden. `npm run build` lokal ausführen, alle Errors beheben, dann nochmal testen."

**SQL-Injection:**
"🛑 Stopper: Query-String-Konkatenation gefunden. Das ermöglicht SQL-Injection-Angriffe über User-Input. Prepared Statements verwenden oder Query-Builder wie Drizzle nutzen."

**Open CORS:**
"🛑 Stopper: CORS auf '*' gesetzt. Jede Website kann deine API aufrufen und User-Sessions kapern. Origin auf deine Domain beschränken: 'https://yourdomain.com'."

**Fehlende HTTPS:**
"🛑 Stopper: HTTP-Traffic wird nicht auf HTTPS umgeleitet. Login-Daten werden im Klartext übertragen. HTTPS-Redirect in deiner Hosting-Config aktivieren."

**Stack Traces:**
"🛑 Stopper: Server-Errors zeigen Stack-Traces im Browser. Interne Pfade und Code-Struktur werden preisgegeben. Error-Handling einbauen, das nur generische Messages zurückgibt."

## FRAGE 4 — Kollisions-Behandlung

**Konsens-Level: EINIG**

### Empfehlung: Option A

**"Liste aller Stopper, User entscheidet Reihenfolge"**

Alle Modelle empfehlen Option A. Der Coach gibt Empfehlungen und Hinweise, aber der Nutzer behält die Kontrolle. Dies entspricht der Coach-Position: Vertrauen in die Kompetenz des Nutzers bei gleichzeitiger klarer Kommunikation der Blockaden.

## Endgültige Killer-Kriterien-Liste

| Kriterium | Profile | Schwellwert |
|-----------|---------|-------------|
| Hardcoded Secrets | Alle | Binär |
| Production-Build bricht ab | Alle | Binär |
| SQL-Injection-Risiko | Alle | Binär |
| Ungepatchte Dependencies (CVSS >9) | Alle | Binär |
| Production-Secrets in Dev-Config | Alle | Binär |
| Open CORS | 3-5 | Binär |
| Keine HTTPS-Erzwingung | 3-5 | Binär |
| Stack Traces an Client | 3-5 | Binär |
| Database-Connection ohne SSL | 3-5 | Binär |
| Rate Limiting fehlt | 3-5 | Binär |
| Unbehandelte Promise-Rejections | 3-5 | >3 in kritischen Flows |
| Input-Validation fehlt | 3-5 | >30% der Routes |
| API-Routes ohne Auth | 4-5 | >20% der Routes |
| PII in Logs | 4-5 | Binär |
| Fehlende RLS (Supabase) | 4-5 | Binär |
| CSRF-Schutz fehlt | 4-5 | Binär |
| DSGVO Backup-Pflicht | 4-5 (EU) | Binär |
| Audit-Logs fehlen | 5 | Binär (sensible Ops) |
| Soft-Delete fehlt | 5 | Binär |

## Für Timm zu entscheidende Spaltungen

1. **Tenant-Isolation als Killer-Kriterium**: Zu komplex/fehleranfällig vs. essentiell für Multi-Tenant?
2. **Auth-Check Schwellwert**: Strikt binär (jede Route) oder pragmatisch (>20%)?
3. **Compliance-Checks (Datenschutzerklärung, Cookie-Banner)**: Technisch prüfbar machen oder auslagern?

## Nächste Schritte

### Top-3-Empfehlungen für Folgesprint

1. **Implementiere AST-basierte Detektoren** für die Top-5-Kriterien (Secrets, SQL-Injection, Auth-Checks, CORS, HTTPS). Diese haben höchste Impact-Wahrscheinlichkeit.

2. **Entwickle Dependency-Scanner-Integration** für CVSS-Checks und npm audit. Quick Win mit hohem Sicherheitswert.

3. **Baue Config-Analyzer** für Environment-Management (Production-Secrets in Dev) und Database-Connections (SSL-Check). Verhindert häufige Deployment-Fehler.

### Priorisierung
- **Sofort**: Hardcoded Secrets, Build-Checks, SQL-Injection
- **Bald**: CORS, HTTPS, Auth-Checks, Dependencies
- **Später**: Compliance-Features, Audit-Logs, erweiterte Validierungen

---

## Kosten

| Modell           | In-Tok  | Out-Tok | Kosten   |
|------------------|---------|---------|----------|
| Claude Sonnet    |    5752 |    2048 | €0.0446 |
| GPT-4o           |    4295 |     941 | €0.0187 |
| Gemini 2.5 Pro   |    4723 |    2044 | €0.0245 |
| Grok 4           |    5238 |    2613 | €0.0511 |
| Judge (Opus)     |    6831 |    2337 | €0.2583 |
| **Gesamt**       |         |         | **€0.3972** |
