# Committee Review: user-types-strategy

> Generiert am 2026-04-10 · Reviewer: Claude Sonnet, GPT-4o, Gemini 2.5 Pro, Grok 4 · Judge: Claude Opus

---

## 1. DREITEILUNG (Hobby/Gründer/Business)

**Konsens-Level:** EINIG

**Top-Empfehlung:** Die Dreiteilung ist zu starr — füge "Agency/Freelancer" als vierten Typ hinzu und baue nahtlose Upgrade-Pfade zwischen den Segmenten, da 30% der Hobby-Projekte zu Startups werden.

**Nächster Schritt:** Implementiere dynamische Regel-Aktivierung statt starrer 30/120/195 Limits: Wenn ein Hobby-Projekt User-Daten sammelt, aktiviere DSGVO-Regeln sofort, nicht erst nach Tier-Upgrade.

## 2. ENTERPRISE-TIEFE

**Konsens-Level:** EINIG

**Top-Empfehlung:** Enterprise-Features sind Over-Engineering für den Start — fokussiere auf Business-Light mit SSO, Teams und CI/CD-API, das reicht für 80% der zahlenden Kunden.

**Nächster Schritt:** Baue Read-only Schema-Viewer und ESLint-Import als MVP, verschiebe Custom Agenten und DB-Import auf nach Product-Market-Fit.

## 3. PRICING

**Konsens-Level:** MEHRHEIT

**Top-Empfehlung:** Freemium ja, aber mit härteren Gates (5 Scans/Monat statt unlimitiert) und höheren Gründer-Preisen (€39-80 statt €19-49), da Developer Tools diesen Wert rechtfertigen können.

**Nächster Schritt:** Teste Credits-Modell parallel: 10 Credits/Monat gratis, €39 für 500 Credits — das verhindert Freeloading und skaliert mit Usage.

## 4. AGENTEN ALS BUILD-TIME-REGELN

**Konsens-Level:** EINIG

**Top-Empfehlung:** 20-30 Regeln sind das Maximum für .cursorrules ohne Token-Bloat — implementiere hierarchische Filterung mit 5 Always-On-Regeln plus kontextabhängiger Aktivierung.

**Nächster Schritt:** Baue Versionierung für .cursorrules mit Auto-Update-Notifications ("Deine Regeln sind 3 Versionen alt") und teste MCP Server als dynamische Alternative.

## 5. WETTBEWERB

**Konsens-Level:** EINIG

**Top-Empfehlung:** Der USP "End-to-End Quality Journey" ist stark, aber angreifbar wenn Cursor oder GitHub Copilot native Quality-Features einbauen — baue 2+ Jahre Domain-Knowledge als Moat.

**Nächster Schritt:** Starte Rule-Database sofort mit Community-Input, dokumentiere jeden Edge-Case aus Real-World-Projekten als nicht-kopierbaren Wissensvorsprung.

## 6. GO-TO-MARKET

**Konsens-Level:** MEHRHEIT

**Top-Empfehlung:** VS Code Extension statt Web-App first, da Entwickler im Editor abgeholt werden wollen — Community-Building über Discord/Reddit als primärer Kanal.

**Nächster Schritt:** Baue Minimal-Extension die nur Audit-Score anzeigt + Link zur Web-App, teste "Aha-Moment" bei Score-Verbesserung als Conversion-Trigger.

## 7. TECHNISCHE RISIKEN

**Konsens-Level:** EINIG

**Top-Empfehlung:** LLM-API-Kosten sind der größte Skalierungs-Killer — optimiere aggressiv mit Batch-Processing und Cache häufiger Patterns.

**Nächster Schritt:** Implementiere Scan-Limits im Free-Tier sofort und baue Kosten-Monitoring pro User-Type, um Unit Economics zu verstehen.

## 8. BLINDE FLECKEN

**Konsens-Level:** EINIG

**Top-Empfehlung:** Educator/Content Creator als vergessenes Segment hat hohes Viral-Potenzial — Bootcamps und YouTuber brauchen lehrbare Standards statt Gamification.

**Nächster Schritt:** Baue "Teaching Mode" wo nur spezifische Agenten aktiv sind ("Heute lernen wir Error Handling") mit Export für Kurs-Materialien.

## BLINDE FLECKEN

**Blinder Fleck:** Agency/Freelancer-Segment — Diese Gruppe baut ständig für verschiedene Kunden mit unterschiedlichen Compliance-Anforderungen, braucht Multi-Client-Management und Template-Wiederverwendung. Sie sind weder Hobby noch Gründer und zahlen €200-500/Monat für professionelle Tools.

**Blinder Fleck:** Educator/Content Creator — Bootcamps, YouTube-Tutorials und Coding-Kurse brauchen konsistente, lehrbare Standards und pädagogische Progression. Dieses Segment hat enormes Viral-Potenzial wurde aber komplett übersehen.

**Blinder Fleck:** Fließende Übergänge zwischen Tiers — 70% der Hobby-Projekte werden nie zu Startups, aber die 30% die es werden brauchen nahtlose Upgrade-Pfade ohne Datenverlust oder Workflow-Unterbrechung.

**Blinder Fleck:** Token-Bloat bei .cursorrules — 195 Regeln bedeuten 50k+ Tokens und damit teure LLM-Calls. Ohne Smart Filtering oder hierarchische Aktivierung wird das System unbenutzbar.

**Blinder Fleck:** Maintenance-Nightmare der Regeln — .cursorrules veralten binnen Wochen durch Framework-Updates. Ohne Versionierung und Auto-Update-System frustriert das Power-User.

**Blinder Fleck:** Cursor könnte Quality nativ einbauen — "Generate Cursor Rules based on your codebase" direkt im Editor würde Tropen OS überflüssig machen. Diese existenzielle Bedrohung wird unterschätzt.

## KILL-THE-DARLING

**Enterprise DB-Import** — Warum streichen: DBAs in Enterprises wollen keine Auto-Import-Tools die Produktions-Schemas touchen. Zu komplex, zu riskant, kein echter Markt. Was stattdessen: Read-only Schema-Viewer mit Warnungen ("Du greifst auf Produktions-Tabelle XYZ zu").

**195 Regeln für Business-Tier** — Warum streichen: Maintenance-Hölle und Token-Explosion. Niemand will 195 Regeln verstehen. Was stattdessen: 30 Smart Rules die kontextabhängig Sub-Rules aktivieren.

**Custom Agenten als Self-Service** — Warum streichen: Enterprises wollen keine Agenten programmieren, sie wollen ihre ESLint-Config hochladen. Was stattdessen: Professional Services die Firmen-Standards in Tropen-Agenten übersetzen.

**Gamification für Hobby-User** — Warum streichen: Entwickler hassen Gamification, sie wollen funktionierende Tools. Was stattdessen: Klare Progress-Indikatoren und Audit-Scores ohne spielerische Elemente.

## INVESTOR-PERSPEKTIVE

**Härteste Kritik:** "Das ist ein Feature, kein Produkt. Cursor oder GitHub Copilot können das in 3 Monaten nativ einbauen und ihr seid tot. Wo ist der echte Moat? Eine Regel-Sammlung kann jeder kopieren. Die Enterprise-Story ist Wunschdenken — ihr habt weder Compliance-Zertifikate noch Sales-Team. Das Pricing ist zu niedrig für B2B und Freemium frisst eure Runway bei hohen LLM-Kosten."

**Stärkstes Argument FÜR:** "Niemand löst das End-to-End-Quality-Problem. Alle Tools sind Punkt-Lösungen: Snyk nur Security, SonarQube nur Metriken, Cursor nur Generation.

---

## Kosten

| Modell           | In-Tok  | Out-Tok | Kosten   |
|------------------|---------|---------|----------|
| Claude Sonnet    |   17315 |    2048 | €0.0769 |
| GPT-4o           |   12364 |    1302 | €0.0409 |
| Gemini 2.5 Pro   |   13140 |    2044 | €0.0343 |
| Grok 4           |   13687 |    2358 | €0.0711 |
| Judge (Opus)     |    7441 |    2048 | €0.2466 |
| **Gesamt**       |         |         | **€0.4697** |
