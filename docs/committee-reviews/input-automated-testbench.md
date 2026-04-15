# Automated Checker Testbench — Committee Input

## Was ist Tropen OS?

Production Readiness Guide fuer Vibe-Coders. Scannt Quellcode mit 188 Regeln in 25 Kategorien. EU-Compliance (DSGVO/BFSG/AI Act) als Differenziator. Solo-Founder, noch keine externen User.

## Die Idee

Statt 5 Repos manuell zu scannen, automatisiert dutzende (50-100+) Repos scannen. Lovable synct automatisch zu GitHub — es gibt tausende oeffentliche Lovable-Projekte:

- GitHub Topic `lovable-dev`: hunderte Repos
- GPT-Engineer-App-Dev Org: 5.891 oeffentliche Repos
- GitHub Topic `vibe-coding`: weitere hunderte

Wenn wir diese automatisiert scannen, bekommen wir:
1. Statistisch belastbare False-Positive-Raten pro Regel
2. Pattern-Erkennung (welche Fehler machen Vibe-Coders am haeufigsten?)
3. Content fuer Go-to-Market ("94% der Lovable-Apps haben DSGVO-Luecken")
4. Domain Knowledge Moat aus echten Projekten

## Technischer Stand

- Scanner laeuft aktuell nur im Browser (File System API) ODER als CLI gegen lokales Repo
- `generateRepoMapFromFiles()` kann in-memory ohne Disk scannen
- `buildAuditContextFromFiles()` kann in-memory ohne Disk scannen
- GitHub API: 5.000 requests/hour authenticated
- Ein Repo mit 100 Dateien braucht ~100 API-Calls (pro Datei) ODER 1 git-clone
- Ergebnisse koennen in bestehende Supabase DB (audit_runs, audit_findings) oder JSON

## Bisherige Committee-Entscheidungen

- FP-Rate Ziel: <10% MVP, <5% Year 1
- Feedback: GitHub Issues + Markdown-Log
- Automatisierung: erst ab 10 Beta-Usern
- Checker-Qualitaet > Checker-Breite (60% verfeinern, 40% EU-Compliance)

## Constraints

- Solo-Founder: jedes System muss den Aufwand rechtfertigen
- Kein Budget fuer zusaetzliche Infrastruktur
- GitHub API Rate Limits (5.000/h authenticated)
- Ethische Grenzen beim Scannen/Veroeffentlichen oeffentlicher Repos
- Scanner muss auch fuer in-memory Scans funktionieren (nicht nur CLI)
