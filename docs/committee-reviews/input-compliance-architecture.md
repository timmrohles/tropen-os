# Compliance-Architektur — Committee Input

## Kontext

Tropen OS ist ein Production Readiness Guide fuer Vibe-Coders. Bisherige Compliance-Checks: DSGVO, AI Act, BFSG (3 Deep Agents). Benchmark zeigt: 100% der Lovable-Apps haben DSGVO-Luecken.

Die tatsaechliche Compliance-Landschaft fuer DE-basierte Web-Apps hat 6 Domaenen:

1. Datenschutz (DSGVO/TTDSG) — bis 20 Mio EUR
2. AI Act — bis 35 Mio EUR (wenn KI)
3. Barrierefreiheit (BFSG/EAA) — bis 100.000 EUR (B2C ab 28.06.2025)
4. E-Commerce/Fernabsatz (BGB 312c ff.) — bis 50.000 EUR (wenn Bezahlung)
5. Werbekennzeichnung (UWG/DDG/MStV) — bis 500.000 EUR (wenn Affiliate)
6. Impressum/DDG — Abmahnklassiker #1 (JEDE Website)

Bonus: App Store Requirements (Apple/Google) — wenn Mobile App

## Aktueller Stand

- 188 Audit-Regeln, davon ~20 Compliance-Regeln (DSGVO/BFSG/AI Act)
- Benchmark: 41 Lovable-Repos, alle 72% Risky
- 7 der 23 "100%-Findings" sind Compliance
- Profil-Onboarding existiert teilweise (scan_projects.profile)
- Solo-Founder, Deutschland-first

## Profil-Vorschlag: 3 Fragen

Frage 1: "Was fuer eine App baust du?" → Portfolio / SaaS / E-Commerce / Blog / Mobile
Frage 2: "Wo sind deine Nutzer?" → DE / EU / Weltweit / Intern
Frage 3: "Was ist drin?" (Multi-Select) → Login / Bezahlung / KI / Affiliate / UGC

Daraus ergibt sich welche Domaenen relevant sind.

## Constraint

Solo-Founder, max 1 Woche MVP, Deutschland-first, Vibe-Coder-Sprache.
