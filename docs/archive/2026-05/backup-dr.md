# Backup & Disaster Recovery

## Stand: 2026-03-26

### Supabase Backup

**Point-in-Time Recovery (PITR):** Verfuegbar auf Pro-Plan und hoeher.
- Supabase erstellt automatisch taegliche Backups
- PITR ermoeglicht Wiederherstellung auf jeden Zeitpunkt der letzten 7 Tage (Pro) bzw. 28 Tage (Enterprise)
- Backups werden in der gleichen Region gespeichert
- Projekt-Ref: `vlwivsjfmcejhiqluaav`

### Backup-Strategie

| Was | Wie | Frequenz | Aufbewahrung |
|-----|-----|----------|-------------|
| Datenbank (Postgres) | Supabase PITR | Kontinuierlich | 7 Tage (Pro) |
| Code | GitHub Repository | Bei jedem Push | Unbegrenzt |
| Migrations | `supabase/migrations/` im Repo | Versioniert | Unbegrenzt |
| Environment Variables | Vercel Dashboard + `.env.example` | Manuell | Aktuell |
| Edge Functions | `supabase/functions/` im Repo | Versioniert | Unbegrenzt |

### Recovery-Ziele

| Metrik | Ziel | Aktuell |
|--------|------|---------|
| **RTO** (Recovery Time Objective) | < 1 Stunde | Nicht getestet |
| **RPO** (Recovery Point Objective) | < 1 Stunde | PITR (kontinuierlich) |

### Restore-Prozedur

1. **Datenbank:**
   - Supabase Dashboard → Project → Settings → Database → Backups
   - Zeitpunkt waehlen → Restore starten
   - Alternativ: `supabase db dump` fuer manuellen Export

2. **Anwendung:**
   - Vercel Rollback auf letztes funktionierendes Deployment
   - `vercel rollback` oder Dashboard → Deployments → Promote

3. **Migrations neu anwenden (nach Restore auf alteren Zeitpunkt):**
   ```bash
   cd "/c/Users/timmr/tropen OS"
   supabase db push
   ```

### TODO (vor erstem Kunden)

- [ ] Supabase PITR verifizieren (Pro-Plan aktiv?)
- [ ] Erster manueller Restore-Test durchfuehren
- [ ] Automatisierten Backup-Check einrichten (monatlich)
- [ ] Offsite-Backup evaluieren (z.B. pg_dump nach S3/R2)
- [ ] Runbook fuer Notfall-Szenarios schreiben

### APPEND ONLY Tabellen

Diese Tabellen duerfen nie UPDATE oder DELETE erhalten:
- `card_history`
- `project_memory`
- `feed_processing_log`
- `feed_data_records`
- `feed_runs`
- `agent_runs`
- `memory_extraction_log`

Bei einem Restore muessen diese Tabellen besonders geprueft werden,
da verlorene Eintraege nicht rekonstruierbar sind.
