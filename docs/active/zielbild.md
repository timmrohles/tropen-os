---
status: active
updated: 2026-05-07
review_by: 2026-08-07
supersedes: []
---

# Tropen OS — Zielbild Q3 2026 (Version 2)

> **Repo-Pfad:** `docs/product/zielbild-2026-q3.md` (normativ)
> **Vorgänger:** `docs/product/archiv/zielbild-2026-q3-v1.md` (v1 war internes Entwurfs-Dokument, nicht als Datei persistiert)
> **Erstellt:** 2026-05-07
> **Quelle:** Sparring-Session (8 Achsen) + Komitee K0 (4 Modelle) + Komitee K0.5 (5 Modelle, mit Constraints + Cross-Model-Reaktion)
> **Status:** Entwurf für ADR-031. 24h-Wait nach Doku-Fertigstellung.

---

## Vorbemerkung zur Version 2

Version 1 war ein interner Wurf, gebaut aus acht Achsen einer Sparring-Session. K0 hat ihn großzügig bestätigt. K0.5 hat ihn unter harten Constraints (1 Person, 6 Monate, €20–50k) **substantiell revidiert** — fünf der acht Achsen wurden teils kassiert, teils umformuliert.

Diese Version 2 trägt die Revisionen. Was sich geändert hat ist nicht "Detail-Schliff", sondern Umkehr in mehreren Achsen. Die Doku ist deshalb **vollständig** — auch die unveränderten Achsen sind hier nochmal, damit die neue Konfiguration als geschlossener Stand lesbar ist.

---

## Was sich gegenüber v1 geändert hat — Kurz-Übersicht

| Bereich | v1 | v2 |
|---|---|---|
| **Modi-Konstrukt (Achse 1)** | Zwei gleichwertige Modi A+B | **Ein Eintritt mit Eintritts-Frage** ("Was hast du bereits?"). Modi waren die falsche Frage. |
| **Eingriffs-Logik (Achse 2)** | Proaktiv-aktiv mit Eskalationsstufen | **Gate-getrieben statt phasen-getrieben.** Harte Stopps nur in CI/CD-Gates, nie im Editor. |
| **Trigger-Logik (Achse 5)** | Inline im Chat, proaktiv-aktiv | **Differenziert:** Schweigen-by-Default außerhalb des Chats. Proaktiv im Chat, wenn aktiv geöffnet — als testbare Wette markiert. |
| **Wissens-Persistenz (Achse 6 Cluster 1)** | Strukturierte Felder + ADR-Liste, RAG-Frage offen | **Decision-Log im Repo** (`.tropen/decision-log.yml`) + schlanke Metadaten-DB. RAG bleibt verschoben. |
| **Lernfähigkeit (Achse 8)** | Alle drei Quellen von Anfang an | **Lernen aus User-Repos verschoben auf Phase 2 (12+ Monate).** Externes + Komitee-Lernen bleiben aktiv. |
| **UX/UI-Konsistenz (Achse 3 Erweiterung)** | Fünfte Domäne | **Gestrichen.** Nicht im 6-Monats-Scope. |
| **Pricing** | Strategie-offener Punkt | **Konkretes Modell** aus K0.5-Konsens übernommen. |
| **Vertrags-Architektur** | Implizit | **Explizit ausgearbeitet** (~€1.500–€2.000 Anwaltskosten). |
| **CRA-Tiefe** | Kern-Compliance-Domäne | **Verschoben auf Phase 2.** MVP: DSGVO-Kern + BFSG-Basics + AI-Act-Transparenz. |

---

## Teil A — Die acht Achsen (revidiert)

### Achse 1 — Eintritts-Architektur (vormals "Phasen-Modell: Zwei-Modi")

**Neue Position:** Es gibt **keine zwei Modi**. Es gibt einen Eintritt mit einer Verzweigungs-Frage auf Screen 1.

**Eintritts-Frage:** "Was hast du bereits?"
- **Ein Repo / GitHub-URL** → Repo-Connection-Flow → Audit läuft.
- **Eine Idee / nichts** → 5 kurze Fragen (Vertikale, Datenarten, KI ja/nein, geplante Features, EU-Markt) → initiales Decision-Log + Compliance-Checkliste + Template-Prompts.

**Konvergenz nach Screen 1:** Identisches Dashboard, identische Navigation, identisches Decision-Log, identische Gates. Die Verzweigung steuert die *erste Aktivität*, nicht das Produkt.

**Begründung gegen Modi-Trennung:**
- Komitee-Konsens (3 von 5 explizit Nein zu Modi).
- "Mittendrin"-User ist die kaufbereite Persona; "Von Anfang an" hypothetisch ohne Demand-Signal.
- Derselbe User durchläuft beide Pfade über die Zeit — bei der zweiten App kommt er ohne Code, will von vorne anfangen. Der Weg muss derselbe sein. Modi als getrennte Produkte hätten das blockiert.
- Constraints: Zwei Onboardings + zwei Navigationsstrukturen sprengen 6 Monate / 1 Person.

**Was nicht im MVP ist:** Mehrstündiges "Coaching-Onboarding". Der "Nichts vorhanden"-Pfad ist max. 5 Minuten. Tiefes Coaching ist Phase 2.

### Achse 2 — Eingriffs-Logik: Gate-getrieben

**Position:** Pull statt Push. Ereignis- und Gate-getrieben statt phasen-getrieben.

**Drei Eingriffs-Loci, klar getrennt:**

| Locus | Verhalten |
|---|---|
| **Editor / Coding-Session (lokal)** | Schweigen. Keine Pop-ups, keine Toasts, keine Background-Watcher mit Notifications. |
| **Pre-Commit-Gate (opt-in)** | Optional aktivierbarer Git-Hook. Blockt nur Critical-Severity in vom User aktivierten Kategorien (PII-Leak, Secrets, Lizenz-Verstöße). |
| **CI/CD-Release-Gate (opt-in)** | `tropen gate --release` blockt bei Critical-Compliance-Verstößen. Override mit Kommentar-Pflicht möglich, Entscheidung landet im Decision-Log. |

**Drei-Severity-Klassen** (nicht fünf, nicht eskalierend): **Critical / Should / Info.** Default-Anzeige: Critical sichtbar, Should + Info zugeklappt.

**Haltung bleibt:** Ehrlich widersprechend. Wenn User schlechte Entscheidung trifft, sagt Tropen das — aber im Audit-Bericht oder im Begleiter-Chat, nicht via Editor-Pop-up.

**Was kassiert wurde:** Dreistufiges Eskalations-Warnsystem mit hartem Stopp im Editor. Gate-Logik ist die saubere Implementierung derselben Intuition.

### Achse 3 — Wissens-Asymmetrie: Vier Domänen, CRA verschoben

Tropen ist **Vier-Domänen-Spezialist** für Vibe-Coder:

1. **Architektur & Datenmodell** — was wo gehört, Schichten, Trennung
2. **Security & Auth** — RLS, Secrets, Tenant-Isolation
3. **Testing, Monitoring, Operations** — alles ab Live
4. **Compliance** — **MVP-Scope: DSGVO-Kern + BFSG-Basics + AI-Act-Transparenz.** CRA-Tiefe verschoben auf Phase 2.

**UX/UI-Konsistenz als fünfte Domäne ist gestrichen.** Im Komitee nicht aufgetaucht, im 6-Monats-Scope nicht haltbar.

**Was Tropen *nicht* macht:** UI/UX-Coaching, Marketing, Pricing-Strategie, Code-Schönheit jenseits Lesbarkeit.

**Begründung CRA-Verschiebung:** DSGVO + BFSG + AI-Act sind in 6 Monaten mit substantieller Tiefe machbar. CRA als zusätzliche Domäne würde alle vier verwässern. Phase-2-Item.

### Achse 4 — Tool-Verhältnis: Hilfs-Artefakte und Datei-Brücke

**Tropen baut nie App-Code.** Nur Hilfs-Artefakte: Decision-Log, Fix-Prompts, Compliance-Checklisten, Template-Prompts. "Advisor not Mechanic" bleibt.

**Brücke ins Bau-Tool: Datei-Export + Zwischenablage.**
- Fix-Prompts copy-paste-fähig formatiert für Cursor / Claude Code / Lovable.
- Decision-Log als `.tropen/decision-log.yml` im User-Repo (User-Master).
- Keine native IDE-Integration in Phase 1. Plugin-APIs sind für Solo-Founder nicht haltbar.

**Source-of-Truth Decision-Log: User-Repo ist Master.** Tropen-DB hält nur Metadaten (Run-IDs, Audit-Reports, User-Account-Daten).

**Was kassiert wurde:** Browser-Extension, native IDE-Plugins, Echtzeit-Linting während des Tippens.

### Achse 5 — Schweigen-by-Default mit Chat-Differenzierung

**Position:** Schweigen ist Default außerhalb des Begleiter-Chats. Innerhalb des Chats — wenn User ihn aktiv geöffnet hat — kann Tropen proaktiv sprechen.

**Konkrete Verhaltens-Regeln:**

1. **Audit-Pipeline (Repo-Scan):** Pull-Modell. User startet Scan via Button, CLI oder Git-Hook. Keine Background-Notifications.
2. **Editor:** Null Pop-ups, null Toasts, null Tab-Badges. Tropen ist im Editor unsichtbar.
3. **Begleiter-Chat (User aktiv geöffnet):** Kontext-Trigger erlaubt. Wenn User über Auth schreibt und Critical-Finding zu Auth einfließt, taucht Tropens Hinweis im Chat auf. Lautstärke-Regler still / normal / laut bleibt als Sicherheitsventil.
4. **Email-Digest (opt-in):** Wöchentlicher Bericht "Was ist neu in EU-Compliance, was betrifft dein Projekt". Push, aber asynchron — bricht keinen Flow.

**Quantitative Anker:**
- **Während aktiver Coding-Session:** 0 Push-Notifications.
- **Im Begleiter-Chat:** ~1 proaktive Meldung pro 30 Min Chat-Aktivität als Default. Lautstärke-Regler kann mehr/weniger.
- **Email-Digest:** Max. 1× pro Woche.

**Wichtige Wette (siehe Teil D):** Das Komitee hat die Chat-Differenzierung nicht explizit empfohlen. Annahme: Chat-Aktivität ≠ Coding-Flow, Proaktivität dort ist Substanz, kein Bruch. Diese Wette muss in Beta getestet werden.

### Achse 6 — Projekt-Hygiene über Zeit

#### Cluster 1: Wissen — Decision-Log statt Schichten-Architektur

- **Form persistenten Wissens:** Decision-Log als YAML im User-Repo (`.tropen/decision-log.yml`). Pro Eintrag: Datum, Entscheidung, Begründung, Severity, Tags. Plus schlanke Metadaten-DB für Audit-Run-Historie.
- **User-Repo ist Master.** Tropen liest und schreibt, User sieht in Git-Diff was passiert.
- **Decision-Log ersetzt Felder + ADR.** ADR-artige Einträge mit Datum + Begründung.
- **RAG-Frage bleibt verschoben.** In 6 Monaten nicht prioritär.
- **Drift-Erkennung:** Soll-Bild kommt aus Decision-Log, Ist-Bild aus Code-Scan. Kein Graph nötig.

#### Cluster 2: UI/Code — UX-Konsistenz raus, Clean Code bleibt aber kalibriert

- **UX/UI-Konsistenz: gestrichen.**
- **Clean Code: bleibt** — Funktion >50 Zeilen, Naming, Cyclomatic Complexity. Aber: Severity-Sortierung muss Clean-Code unter Compliance/Security halten.
- **Tropen schreibt nichts um.** Hinweis + Fix-Prompt für Bau-Tool.

#### Cluster 3: Struktur — Müll, Drift, Refactoring-Anlässe

- **Repo-Hygiene:** Müll-Erkennung (toter Code, doppelte Komponenten, ungenutzte Deps) + Drift-Erkennung (Code weicht von Decision-Log ab).
- **Refactoring:** Anlass-Erkennung + Meldung im Audit-Bericht. Kein Auto-Fix.
- **Kein eigener Hygiene-Modus.** Querschnitt durch Audit + Chat.

### Achse 7 — Regelwerk als Kern-Asset

**Position bleibt:** 242 Regeln in 26 Kategorien sind **zentrales Wissens-Asset**, nicht nur Audit-Engine.

**Vier Use-Cases, Reihenfolge nach MVP-Priorität:**
1. **Audit (heute aktiv)** — Kern-Funktion, läuft.
2. **Fix-Prompts copy-paste-fähig formatiert** — Phase 1 Pflicht.
3. **Prompt-Veredler** — Phase 2. Braucht Regel-Selektion.
4. **Initial-Compliance-Checkliste im "Nichts vorhanden"-Eintritt** — neu durch Achse 1.

### Achse 8 — Lernfähigkeit: Reduziert auf Phase 1, voll in Phase 2

**Position:** Lernfähigkeit ist **strategischer Markenkern**, aber die Aktivierung ist gestaffelt.

| Lernquelle | Phase 1 (0–6 Mon) | Phase 2 (6–12 Mon) | Phase 3 (12+) |
|---|---|---|---|
| **Komitee** | ✅ Aktiv (intern, für Regel-Qualität) | ✅ Aktiv (auch user-facing als Premium) | ✅ Aktiv |
| **Externe Quellen** | ✅ Aktiv (CVE-Feeds, Gesetzes-Updates manuell kuratiert) | ✅ Aktiv (semi-automatisiert) | ✅ Aktiv |
| **Repo-Lernen** | ❌ Nicht aktiv | 🟡 Vorbereitung (Privacy-Architektur, Vertrag, Opt-in-Mechanik) | ✅ Aktiv (mit >500 Usern statistisch sinnvoll) |

**Begründung Verschiebung Repo-Lernen:**
- Bei <500 Usern statistisch bedeutungslos.
- DSGVO-Compliance-Aufwand (DPIA, AVV, Opt-in-Mechanik) frisst 2–4 Wochen Solo-Founder-Zeit.
- **Vertrauens-Paradoxon:** Compliance ist USP — gleichzeitig User-Code aggregieren untergräbt die Story.

---

## Teil B — Verbindliche neue Inhalte aus K0.5

### Pricing-Modell

| Tier | Preis/Monat | Inhalt |
|---|---|---|
| **Free** | €0 | Single-Model-Audit, kein Komitee. Lokale Verarbeitung. |
| **Starter** | €19–29 | 5 Komitee-Runs/Monat, Hard-Cap. |
| **Pro** | €49–89 | 10–20 Komitee-Runs/Monat + CLI + GitHub-Action. |
| **Team** | €89–99 | 50 Runs + erweiterte Features. |

**Kalkulation:** Komitee-Run kostet €0.30–€0.80. Bei den genannten Hard-Caps trägt sich das Modell mit 55–72% Marge.

**Keine Pay-as-you-go-Variante.** Hard-Cap statt Overage.

**Beta-Phase:** Kostenfrei, mit Frequenz-Limit (z.B. 10 Komitee-Runs/Monat).

### Vertrags-Architektur

**Aufwand:** ~€1.500–€2.000 Anwaltskosten, 1–2 Tage Arbeit. Pflicht vor Beta-Onboarding.

**Sechs Bausteine:**

1. **Daten-Eigentum:** User behält 100% Eigentum am Code. Tropen erhält keine Train-Lizenz.
2. **Verarbeitung Free/Pro Audit:** Lokal via File System Access API. Code verlässt nicht den Rechner.
3. **Komitee-Calls:** Code geht an LLM-Provider. AVV (Art. 28 DSGVO) mit Anthropic + OpenAI verlinkt, SCCs für US-Transfer. Explizite Per-Run-Einwilligung mit Snippet-Preview. Optional: EU-only-Modellpfad als Premium.
4. **Aggregierte Metadaten:** Tropen Eigentümer abgeleiteter, anonymisierter Statistiken. Kein Code-Snippet-Sharing.
5. **Hosting:** EU (Hetzner/DE). Subprozessor-Liste publik.
6. **Phase-2-Klausel:** Optionales "Pattern-Sharing" als explizites Opt-in mit Mehrwert.

### Integrations-Architektur (verbindlich)

**MVP in 6 Monaten:**
- **Web-Plattform** mit File System Access API als Haupt-Interface.
- **CLI-Tool** (`tropen audit`, `tropen gate`) als zweiter Eintritt. **4 Wochen einplanen, nicht 2.**

**Explizit ausgeschlossen aus MVP:**
- Native IDE-Plugins (Cursor, Lovable, Replit, Claude Code)
- Browser-Extension
- Echtzeit-Linting während des Tippens
- Background-Watcher mit Notifications

---

## Teil C — Was die Constraints konkret ausschließen

Aus dem MVP-Scope gestrichen:

1. Native IDE-Integration in Cursor/Lovable/Claude Code/Replit
2. Echtzeit-Linting im Editor
3. Browser-Extension
4. Dreistufiges proaktives Eskalations-Warnsystem mit hartem Stopp
5. Lernen aus User-Repos / ML-basierte Regel-Verbesserung
6. CRA-Tiefe (Phase 2)
7. Komitee als Default-Erfahrung im Hintergrund (nur on-demand mit Hard-Cap)
8. Persistentes Projekt-Gedächtnis als Graph-DB / Multi-Tier-Architektur
9. Mehrstündiges "Von Anfang an"-Coaching-Onboarding (max. 5-Minuten-Wizard)
10. UX/UI-Konsistenz als fünfte Wissens-Domäne
11. UI mit Per-Modell-Drill-Down im Komitee-Output (nur Aggregat + Dissens)
12. Prompt-Veredler in Phase 1 (auf Phase 2 verschoben)

---

## Teil D — Vier explizite Wetten (testbar in Beta)

### Wette 1 — Stickiness der asynchronen Architektur

**Setzung:** Schweigen-by-Default + Pull-Modell + kein IDE-Plugin produzieren ein Subscription-Produkt, nicht nur einen einmaligen Audit-Run.

**Gegenmaßnahmen:** Git-Hook-Setup als Pflicht-Onboarding-Schritt. Email-Digest wöchentlich. Decision-Log als persistenter Wert. Compliance-Reporting (PDF) als Premium-Feature.

**Falsifikations-Kriterium:** Wenn nach 8 Wochen Beta die Audit-Frequenz pro User <1 pro Monat liegt → Architektur-Korrektur nötig.

### Wette 2 — Distribution: Es gibt einen Channel für die ersten 30 User

**Setzung:** Es lassen sich 30 Beta-User in DACH/EU finden, die Compliance-Schmerz und Zahlungsbereitschaft haben.

**Hypothesen für Channels:** DSGVO-Anwälte als Multiplikatoren, Lovable/Cursor/Bolt-Discords, deutsche Solo-Founder-Communities, LinkedIn-Outreach.

**Falsifikations-Kriterium:** Wenn nach 8 Wochen aktiver Akquise <10 zahlungsbereite Beta-User erreicht → Distribution ist das größere Problem als das Produkt.

**Empfohlenes Folge-Komitee:** K0.7 — Distribution & Go-to-Market.

### Wette 3 — EU-Moat ist nachhaltig, nicht temporär

**Setzung:** Tiefe in DSGVO + BFSG + AI-Act-Transparenz + EU-Hosting + DSGVO-First-Architektur ist verteidigbar gegen US-Konkurrenz.

**Bewusste Setzung:** Wette auf kuratierte Tiefe + Vertrauen + EU-Hosting, nicht auf Daten-Moat.

**Falsifikations-Kriterium:** Wenn ein US-Konkurrent mit ähnlicher EU-Tiefe erscheint, bevor Tropen 1.000 zahlende User hat → Moat-Strategie überdenken.

### Wette 4 — Chat-Aktivität ist nicht Coding-Flow

**Setzung:** Wenn User den Begleiter-Chat aktiv geöffnet hat, ist proaktive Meldung dort kein Flow-Bruch.

**Falsifikations-Kriterium:** Wenn nach 8 Wochen Beta die Chat-Sessions pro User <2 pro Monat sind → Chat ist nicht der primäre Interaktions-Punkt, Achse 5 muss neu gedacht werden.

---

## Teil E — Komitee-Sprint-Pipeline (revidiert)

| # | Thema | Status nach K0.5 |
|---|---|---|
| ~~K1~~ | Projektwissen-Persistenz | **Geschlossen.** Decision-Log im Repo ist die Antwort. |
| **K2** | Regel-Qualität + Selektion | **Verschoben auf Phase 2** (mit Veredler). |
| ~~K3~~ | Repo-Lernen Privacy-Architektur | **Verschoben auf Phase 2.** |
| ~~K4~~ | Meta-Agent Verhaltens-Modell | **Eingeschmolzen** in Achse 5 / Trigger-Logik. Kein eigener Sprint. |
| **K0.7** *(neu)* | Distribution & Go-to-Market | **Empfohlen vor Beta-Phase.** |
| **K0.8** *(neu)* | Retention-Mechanik | **Empfohlen** zur Wette-1-Bearbeitung. |

---

## Teil F — Implikationen für den Reaktivierungsplan

| Schritt | Original | Status nach v2 |
|---|---|---|
| **1 — Projektwissen strukturieren** | Tage bis Wochen, konzeptionell | **Reduziert auf Decision-Log-Schema.** ~1 Woche. K1 entfällt. |
| **2 — Meta-Agent Skeleton** | 1–2 Wochen | **Bleibt**, aber Rolle reduziert. Begleiter-Chat-Logik. |
| **3 — Prompt-Veredler** | 2 Wochen, größter Wow-Effekt | **Verschoben auf Phase 2.** |
| **4 — Onboarding** | 1–2 Wochen, in zwei Modi gespalten | **Eintritts-Frage statt Modi.** ~1 Woche für beide Pfade. |
| **5 — Scanner einordnen** | Im Menü nach unten | **Umgedreht:** Audit ist Haupttür, nicht Nebensache. |
| **6 — Artefakt-Fläche aktivieren** | 1–2 Wochen | **Reduziert** auf Decision-Log-Viewer + Audit-Report. |
| **7 — Projektboard** | 1–2 Wochen | **Verschoben auf Phase 2.** |

**Neue Schritte aus v2:**
- **N1 — CLI-Tool** (4 Wochen, vorher unterschätzt)
- **N2 — Vertrags-Architektur** (1–2 Tage Arbeit + Anwaltsmandat)
- **N3 — Pricing-Tiers + Stripe-Integration** (~1–2 Wochen)
- **N4 — Email-Digest-System** (~1 Woche)
- **N5 — Beta-Akquise-Channels** (parallel, nicht-technisch)

**Realistische Aufwand-Bewertung:** ~70% der MVP-Substanz vorhanden. 30% Neubau (CLI, Decision-Log-Schema, Pricing-Stufen, Eintritts-Flow, Vertrags-Doku). Machbar mit 6 Monaten / 1 Person, aber knapp — keine Reserven für Plugin-Experimente.

---

## Teil G — Strategie-offene Punkte (verbleibend)

1. **Akademie-Verhältnis** — Wie integriert sich Tropen Academy gGmbH? Vor Beta-Marketing-Sprint klären.
2. **Naming-Sprint-Timing** — "Tropen OS" ist Platzhalter. Pflicht vor Beta-Onboarding.
3. **Beta-Pilot während Umbau** — Beta-User bekommen das v2-Produkt.
4. **K0.7 Distribution-Komitee-Sprint** — wann?
5. **K0.8 Retention-Komitee-Sprint** — wann?

---

## Teil H — Verbindlichkeit und Disziplin

**Was diese Version 2 ist:**
- Ergebnis aus Sparring + zwei Komitee-Sprints (€1.94 gesamt, 8 Modelle aggregiert).
- Grundlage für ADR-031 (Pivot zur Begleitplattform). **24h-Wait nach v2-Fertigstellung.**
- Normative Quelle für alle nachfolgenden Sprints, bis durch ADR ersetzt.
- **Vier markierte Wetten** mit Falsifikations-Kriterien.

**Was sie nicht ist:**
- Keine Build-Anweisung. Implementierung liegt bei Claude Code.
- Keine endgültige Roadmap — Roadmap-Q3 wird nach ADR-031 erstellt.

**Pivot-Disziplin (verbindlich seit 2026-04-29):**
ADR-031 + 24h-Wait sind Pflicht. Stabile Sprint-Reihenfolge. Visual Sweep nach jedem Sprint.

---

## Anhang — Kompakte Achsen-Übersicht v2

| # | Achse | v2-Position |
|---|---|---|
| 1 | Eintritts-Architektur | Ein Eintritt mit Verzweigungs-Frage. Keine Modi. |
| 2 | Eingriffs-Logik | Gate-getrieben. Pull statt Push. Drei Severity-Klassen. |
| 3 | Wissens-Asymmetrie | Vier-Domänen-Spezialist. CRA + UX/UI in Phase 2. |
| 4 | Tool-Verhältnis | Hilfs-Artefakte only. Web + CLI. Keine IDE-Plugins. |
| 5 | Schweigen-by-Default | Schweigen außerhalb Chat. Proaktiv im Chat (Wette 4). |
| 6 | Projekt-Hygiene | Decision-Log + Müll/Drift. UX/UI raus. Refactoring nur Anlass-Erkennung. |
| 7 | Regelwerk | Kern-Asset. Veredler in Phase 2. |
| 8 | Lernfähigkeit | Komitee + Extern in Phase 1. Repo-Lernen Phase 2/3. |

**Vier explizite Wetten** (Stickiness, Distribution, EU-Moat-Nachhaltigkeit, Chat-Aktivität).
**Zwei verbleibende Komitee-Sprints** (K0.7 Distribution, K0.8 Retention).
**Fünf Strategie-offene Punkte** (Akademie, Naming, Beta-Pilot, K0.7-Timing, K0.8-Timing).
