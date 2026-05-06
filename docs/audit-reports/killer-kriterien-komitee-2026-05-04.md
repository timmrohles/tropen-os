# Killer-Kriterien-Komitee 2026-05-04

> **Datum:** 2026-05-04
> **Anlass:** Score-Architektur-Pivot — Killer-Kriterien werden primär, Score sekundär
> **Methode:** Multi-Model-Komitee (Claude Sonnet + GPT-4o + Gemini 2.5 Pro + Grok 4 + Opus-Judge)
> **Kosten:** €0.40
> **Vollständiger Rohbericht:** `docs/committee-reviews/killer-kriterien-komitee-review.md`

---

## Frage 1 — Verfeinerung Startliste

**Konsens-Level:** MEHRHEIT (mit Spaltungen bei EU-Compliance)

### Universal — EINIG (alle Profile)
✅ Hardcoded Secrets · ✅ Production-Build bricht ab · ✅ SQL-Injection-Risiko

### Public — EINIG (Profile 3–5)
✅ Open CORS · ✅ Keine HTTPS-Erzwingung · ✅ Stack Traces an Client

### Multi-User — GESPALTEN (Profile 4–5)
✅ API-Routes ohne Auth — Spaltung: binär vs. >20%-Schwelle  
⚠️ Tenant-Isolation — Spaltung: Claude streicht (FP-Risiko), andere behalten  
✅ PII in Logs

### EU-Markt — GESPALTEN
❌ Cookie-Banner — 2:2-Spaltung (technisch vs. rechtlich)  
✅ DSGVO Backup-Pflicht (Profile 4–5, EU)  
❌ Datenschutzerklärung — Claude streicht (nicht technisch prüfbar)  
❌ Newsletter Double-Opt-In — Claude streicht (zu spezifisch)

### B2B/Reguliert (Profil 5) — MEHRHEIT
✅ Audit-Logs · ❌ Zugriffsrechte-Doku (nicht automatisch prüfbar) · ✅ Soft-Delete

---

## Frage 2 — Lücken (Top 8 priorisiert)

1. **Fehlende RLS bei Supabase** (Profile 4–5, binär)
2. **Database-Connection ohne SSL** (Profile 3–5, binär)
3. **Ungepatchte Dependencies (CVSS >9)** (alle Profile, binär)
4. **Rate Limiting fehlt auf API-Endpoints** (Profile 3–5, binär)
5. **Unbehandelte Promise-Rejections** (Profile 3–5, >3 in kritischen Flows)
6. **Input-Validation fehlt** (Profile 3–5, >30% der POST/PUT-Routes)
7. **Production-Secrets in Dev-Config** (alle Profile, binär)
8. **Kein CSRF-Schutz** (Profile 4–5, binär)

---

## Frage 3 — Coach-Wording pro Kriterium

**Konsens-Level:** EINIG

| Kriterium | Wording |
|-----------|---------|
| Hardcoded Secrets | 🛑 Stopper: API-Key direkt im Code gefunden. Jeder mit Repo-Zugriff kann den Key lesen — auch nach Löschen bleibt er in der Git-History. Key in .env.local verschieben, in .gitignore aufnehmen und beim Provider rotieren. |
| Build-Fehler | 🛑 Stopper: Production-Build schlägt fehl. Eine nicht deploybare App kann nicht veröffentlicht werden. `npm run build` lokal ausführen, alle Errors beheben, dann nochmal testen. |
| SQL-Injection | 🛑 Stopper: Query-String-Konkatenation gefunden. Das ermöglicht SQL-Injection über User-Input. Prepared Statements oder Query-Builder wie Drizzle nutzen. |
| Open CORS | 🛑 Stopper: CORS auf '*' gesetzt. Jede Website kann deine API aufrufen und User-Sessions kapern. Origin auf deine Domain beschränken. |
| Fehlende HTTPS | 🛑 Stopper: HTTP-Traffic wird nicht auf HTTPS umgeleitet. Login-Daten werden im Klartext übertragen. HTTPS-Redirect in der Hosting-Config aktivieren. |
| Stack Traces | 🛑 Stopper: Server-Errors zeigen Stack-Traces im Browser. Interne Pfade werden preisgegeben. Error-Handling einbauen, das nur generische Messages zurückgibt. |

---

## Frage 4 — Kollisions-Behandlung

**Konsens-Level:** EINIG — **Option A**

Alle Stopper auflisten, User entscheidet Reihenfolge. Entspricht Coach-Position: klare Kommunikation der Blockaden, Vertrauen in die Kompetenz des Nutzers.

---

## Endgültige Killer-Kriterien-Liste

| Kriterium | Profile | Schwellwert |
|-----------|---------|-------------|
| Hardcoded Secrets | Alle | Binär |
| Production-Build bricht ab | Alle | Binär |
| SQL-Injection-Risiko | Alle | Binär |
| Ungepatchte Dependencies (CVSS >9) | Alle | Binär |
| Production-Secrets in Dev-Config | Alle | Binär |
| Open CORS | 3–5 | Binär |
| Keine HTTPS-Erzwingung | 3–5 | Binär |
| Stack Traces an Client | 3–5 | Binär |
| Database-Connection ohne SSL | 3–5 | Binär |
| Rate Limiting fehlt | 3–5 | Binär |
| Unbehandelte Promise-Rejections | 3–5 | >3 in kritischen Flows |
| Input-Validation fehlt | 3–5 | >30% der Routes |
| API-Routes ohne Auth | 4–5 | >20% oder binär (Timm-Entscheidung) |
| PII in Logs | 4–5 | Binär |
| Fehlende RLS (Supabase) | 4–5 | Binär |
| CSRF-Schutz fehlt | 4–5 | Binär |
| DSGVO Backup-Pflicht | 4–5 + EU | Binär |
| Audit-Logs fehlen | 5 | Binär (sensible Ops) |
| Soft-Delete fehlt | 5 | Binär |

**19 Kriterien total** (ohne die 3 gestrichenen EU-Compliance-Items)

---

## Spaltungen — Timm-Entscheidung nötig

1. **Tenant-Isolation**: Killer-Kriterium oder nicht? Claude: zu viele FPs (Muster schwer automatisch erkennbar). Rest: essentiell für Multi-Tenant. → Timm entscheidet
2. **Auth-Check-Schwelle**: Binär (jede Route) oder pragmatisch (>20%)? Binär = strenger, mehr FPs. 20% = pragmatischer. → Timm entscheidet
3. **Compliance-Checks** (Datenschutzerklärung, Cookie-Banner): Technisch prüfbar machen oder vollständig aus Killer-Kriterien raushalten? → Timm entscheidet

---

## Empfehlungen für Folgesprint (nur dokumentiert, nicht umgesetzt)

**Priorität 1 — Sofort:**
Detektoren für: Hardcoded Secrets, SQL-Injection, Auth-Checks, CORS, Build-Checks. Höchster Impact, technisch klar definiert.

**Priorität 2 — Bald:**
Dependency-Scanner-Integration (CVSS-Checks via `npm audit`), SSL-Check, HTTPS-Redirect-Detection.

**Priorität 3 — Später:**
Compliance-Features, Audit-Logs, Input-Validation-Coverage, CSRF-Detection.
