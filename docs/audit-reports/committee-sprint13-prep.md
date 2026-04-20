# Komitee Sprint 13 — Vorbereitung

> Erstellt: 2026-04-17
> Basis: v8-Benchmark, /ultrareview-Benchmark, conference-intelligence-2026.md

---

## F1 — Gewichts- und Severity-Kalibrierungen (offen)

*Platzhalter — wird vor Sprint 13 befüllt.*

---

## F2 — Neue Agenten-Kandidaten (offen)

*Platzhalter — wird vor Sprint 13 befüllt.*

---

## F3 — False-Positive-Rate Ziel-Review (offen)

*Platzhalter — wird vor Sprint 13 befüllt.*

---

## F4 — Score-Modell Komplexitäts-Faktor (offen)

*Platzhalter — wird vor Sprint 13 befüllt.*

---

## F5 — /ultrareview Integration — Empirische Evidenz

**Benchmark durchgeführt:** 2026-04-17 über 3 Repos

| Repo | Plattform | Score (v8) | Tropen OS Findings | /ultrareview Findings |
|------|-----------|-----------|-------------------|---------------------|
| Devonz | Lovable-style | 79.1% Risky | 583 | 16 |
| paynless-framework | Framework | 81.4% Stable | 496 | 28 |
| next-forge | Vercel Manual | 84.5% Stable | 57 | 18 |
| **Gesamt** | — | — | **1.136** | **62** |

**Kernergebnisse:**
- Faktor 18× mehr Tropen-OS-Findings (1.136 vs. 62)
- <25% Kategorie-Überlappung
- /ultrareview fokussiert cat-3 Sicherheit (50%), cat-2 (21%), cat-5 (13%)

**/ultrareview 0-Findings über alle 3 Repos:**
cat-4 DSGVO · cat-10 Testing · cat-16 Accessibility · cat-17 i18n ·
cat-24 Supply Chain · cat-25 Git Governance · cat-26 SLOP

**5 Cross-Repo-Muster für neue Checker:**

| Muster | Regel-ID | Repos | Priorität | Statisch erkennbar |
|--------|----------|-------|-----------|-------------------|
| Auth-Bypass-by-Default | sec-auth-optional-bypass | 2/3 | Hoch | Ja |
| Debug-Artefakte in Production | sec-debug-artifacts | 2/3 | Hoch | Ja |
| Fehlende Tenant-Isolation | tenant-isolation-findmany | 2/3 | Hoch | Ja |
| User-Header-Trust | sec-untrusted-headers | 2/3 | Mittel (FP-Risiko) | Teilweise |
| Crash-on-Init | code-crash-on-init | 1/3 | Niedrig | Ja |

**Komitee-Frage 5a:**
Welche der 5 Muster werden als Checker umgesetzt? Reihenfolge?

**Komitee-Frage 5b:**
/ultrareview Integration als Feature (Option A/B/C aus vorheriger Diskussion)?
Datenbasis: Komplementarität empirisch belegt. Empfehlung: Option B —
klare Positionierung, keine Integration nötig.

**Komitee-Frage 5c:**
Blog-Post mit Benchmark-Daten publizieren?
Titel-Vorschlag: "Was KI-Reviews nicht sehen: 1.136 vs. 62 Findings"

---

_Letztes Update: 2026-04-17_
