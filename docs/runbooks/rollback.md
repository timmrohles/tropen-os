# Runbook: Rollback

## Wann

- Deploy schlägt fehl oder bringt kritischen Bug in Prod
- Feature macht Produktion instabil
- DB-Migration läuft schief

---

## Vercel Rollback (< 5 Min)

1. [vercel.com](https://vercel.com) → Projekt → **Deployments**
2. Letztes stabiles Deployment finden
3. **⋯ → Promote to Production**
4. Fertig — kein Redeployment nötig, sofort live

---

## DB Rollback (Supabase Migration)

```bash
# Migration als zurückgerollt markieren
supabase migration repair --status reverted <migration-nummer>

# Dann Schema manuell rückgängig machen (DROP COLUMN, ALTER etc.)
supabase db push
```

> **Achtung:** APPEND ONLY Tabellen (`audit_runs`, `agent_runs`, `feed_runs`, `audit_findings` etc.) — Schema rollbacken geht, Daten bleiben.

---

## Feature Rollback (Feature Flag, < 1 Min)

1. Supabase Dashboard → Table Editor → `organization_settings`
2. `features` JSONB: problematisches Flag auf `false` setzen
3. Kein Redeployment nötig

---

## Edge Function Rollback

```bash
# Vorherige Version aus Git holen und neu deployen
supabase functions deploy ai-chat
```

---

## Nach dem Rollback

- [ ] Sentry: Fehlerrate zurückgegangen?
- [ ] Login und Chat funktionieren?
- [ ] Root Cause in 1-2 Sätzen notieren
