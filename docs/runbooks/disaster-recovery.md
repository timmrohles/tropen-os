# Runbook: Disaster Recovery

**RTO:** < 4h | **RPO:** < 1h | **Kontakt:** Timm Rotter

---

## Supabase — Point in Time Recovery (PITR)

Wenn Daten korrumpiert oder versehentlich gelöscht wurden:

1. [supabase.com](https://supabase.com) → Projekt `vlwivsjfmcejhiqluaav` → **Database → Backups**
2. **Point in Time Recovery** wählen
3. Zeitpunkt vor dem Vorfall wählen (1-Min-Granularität, 7 Tage Aufbewahrung)
4. Recovery starten — Supabase erstellt neue DB-Instanz
5. `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` in Vercel Env Vars aktualisieren
6. Vercel Redeploy triggern, testen

> **TODO:** Ersten Restore-Test durchführen und Datum hier eintragen.
> Schritte zum Testen: Supabase → Database → Backups → Point in Time Recovery → 1h alten Zeitstempel wählen → in separates Projekt restoren → `SELECT COUNT(*) FROM users` vergleichen → Ergebnis hier dokumentieren.

---

## Vercel — Region-Failover

Kein manuelles Failover nötig. Vercel ist automatisch multi-region:
- Edge Network weltweit aktiv
- Functions: Frankfurt (eu-central-1) primär
- Bei Region-Ausfall: automatisches Routing durch Vercel

---

## Kompromittierte Credentials

**Supabase Service Role Key:**
```
Supabase → Settings → API → Regenerate
→ Vercel Env + supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<neu>
→ Redeploy
```

**Anthropic API Key:**
```
console.anthropic.com → API Keys → Revoke + neu erstellen
→ Vercel Env + supabase secrets set ANTHROPIC_API_KEY=<neu>
→ Redeploy
```

---

## Komplettausfall

1. Sentry → erster Fehler identifizieren
2. [status.supabase.com](https://status.supabase.com) + [vercel-status.com](https://www.vercel-status.com) prüfen
3. Wenn Deployment-Fehler → `rollback.md` folgen
4. Wenn Platform-Ausfall → warten, Status-Page updaten

---

## Kontakte

| System | Zugang |
|--------|--------|
| Vercel | vercel.com → Tropen Research UG |
| Supabase | Projekt `vlwivsjfmcejhiqluaav` |
| Anthropic | console.anthropic.com |
| Sentry | Sentry Dashboard |
