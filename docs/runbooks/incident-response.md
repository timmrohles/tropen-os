# Runbook: Incident Response

## Severity-Definition

| Level | Bedeutung | Reaktionszeit |
|-------|-----------|---------------|
| SEV1 | Alles down — kein Login, keine API-Antwort | Sofort |
| SEV2 | Teilfunktion down — Chat geht, Feeds nicht | < 1h |
| SEV3 | Performance-Probleme, langsame Antworten | < 4h |

---

## SEV1 — Alles down

```
1. Sentry öffnen → aktuellen Fehler identifizieren
2. Vercel Logs → letztes Deployment fehlerhaft?
   → Ja: sofort Rollback (rollback.md)
3. Supabase Status prüfen → DB-Ausfall?
   → Ja: warten, Status-Page updaten
4. Vercel Status prüfen → Platform-Ausfall?
   → Ja: warten
5. Wenn unklar: letztes stabiles Deployment promoten, dann debuggen
```

**Ziel:** System in < 30 Min wieder online, Ursache danach klären.

---

## SEV2 — Teilfunktion down

```
1. Welches Feature ist betroffen?
2. Feature-Flag deaktivieren (organization_settings.features)
   → User sehen nichts mehr, kein Datenverlust
3. Sentry: Fehler in dem Feature-Bereich?
4. Fix deployen, Feature-Flag wieder aktivieren
```

Häufige Ursachen:
- Edge Function Timeout → `supabase functions deploy ai-chat`
- Anthropic API-Problem → [status.anthropic.com](https://status.anthropic.com)
- Fehlgeschlagene Migration → rollback.md

---

## SEV3 — Performance

```
1. Vercel Analytics → welche Routes sind langsam?
2. Supabase → Slow Query Log prüfen
3. Sentry Performance → Traces ansehen
4. Upstash → Rate Limiter überfordert?
```

Häufige Ursachen:
- Fehlender DB-Index → Index hinzufügen
- N+1 Queries → Query zusammenfassen
- LLM-Call in kritischem Pfad → async auslagern

---

## Kommunikation

**Intern (Timm):** Direkt handeln, danach dokumentieren.

**Externe User (wenn vorhanden):**
- Vercel hat keine eingebaute Status-Page — bei längeren Ausfällen kurze E-Mail
- Ziel: proaktiv kommunizieren bevor User fragen

---

## Nach dem Incident

1. Root Cause in 1-2 Sätzen festhalten
2. Was hat den Incident verhindert zu eskalieren?
3. Was ändern wir damit es nicht nochmal passiert?

> Kein langer Post-Mortem-Report nötig — ein kurzer Eintrag in `docs/incidents/YYYY-MM-DD.md` reicht.
