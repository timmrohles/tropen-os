---
status: accepted
updated: 2026-05-07
review_by: 2026-08-07
supersedes: []
superseded_by: null
author: Tim Rohles
---

# ADR-028 — Pivot to Companion Platform

---

## Kontext

Tropen OS hat zwei Pivots hinter sich. Ursprünglich als KMU-AI-Workspace mit dem Assistenten Toro-Parrot konzipiert, wurde das Produkt im Frühjahr 2026 zur Production-Readiness-Plattform für Vibe-Coder umgebaut — mit einem Audit-System aus 255 Regeln in 26 Kategorien, einer Multi-Model-Komitee-Engine und einem Fix-Prompt-Generator als Kern-Substanz. Diese Setzung trug das Produkt mehrere Monate.

Im Frühjahr 2026 sind zwei Erkenntnisse so deutlich geworden, dass die Scanner-Identität nicht mehr trägt:

Erstens reicht die reine Audit-Rolle nicht aus, um Vibe-Coder substantiell zu helfen. Ein Repo zu prüfen ist wertvoll, aber es ist eine Punkt-Interaktion. Vibe-Coder brauchen Begleitung über die Zeit — beim Anfangen, beim Bauen, beim Iterieren, beim Live-Gehen. Der Scanner ist eine von vielen Hilfeformen, nicht das Produkt.

Zweitens entspricht die Scanner-Architektur nicht der Markt-Realität. Vibe-Coder kommen nicht mit fertiger Spec und sauberem Repo zur Plattform. Sie kommen mit einem Wunschbild und einem ersten Lovable-Klick — oft mit einem halben Prototyp, oft mit einer noch unklaren Idee. Eine Plattform, die erst greift, wenn ein Repo existiert, verfehlt einen substanziellen Teil ihrer Zielgruppe.

**Was wir gelernt haben:** Scanner allein ist kein Subscription-Produkt — es ist ein einmaliges Werkzeug, das User nach erfolgreicher Anwendung wieder weglegen.

**Was im Pivot stabil bleibt:** die Marken-Position "Advisor not Mechanic", der EU-Compliance-Moat, und die kuratierte Tiefe des Regelwerks. Diese drei sind das Asset, das nicht weggeht — sie tragen über den Pivot hinweg.

---

## Entscheidung

**Tropen OS ist Begleitplattform mit Audit als Eintrittstor.** Der Pivot besteht in der Erweiterung um pre-emptive Begleitung.

**Was vorher war:** Tropen OS war Production-Readiness-Scanner mit Audit als zentraler Identität. User-Erfahrung war post-hoc: Repo prüfen, Findings produzieren, Fix-Prompts liefern.

**Was jetzt gilt:** Tropen OS ist Begleitplattform für Solo-Entrepreneurs und kleine Teams in DACH/EU, die mit Vibe-Coding-Tools (Lovable, Cursor, Claude Code, Bolt) Produkte bauen. Audit bleibt Kern-Werkzeug und ist eine von zwei Haupttüren in die Plattform — die andere ist strukturiertes Onboarding für User ohne existierenden Code. Beide Türen führen ins selbe Produkt: Decision-Log, Begleiter-Chat, Compliance-Checklisten, Fix-Prompts.

**Was sich ändert:** Die Identität verlagert sich vom Audit zum Begleiter. Audit wird strukturell zu einem von mehreren Eintritten und Werkzeugen. Pre-emptive Begleitung (Onboarding-Wizard, Begleiter-Chat, Decision-Log-Pflege, Initial-Compliance-Checkliste) wird gleichberechtigt zur post-hoc Prüfung.

**Die neun Achsen sind verbindlich.** Detail in `docs/active/vision.md` (= Zielbild Q3 v3):

| # | Achse | Position |
|---|---|---|
| 1 | Eintritts-Architektur | Ein Eintritt mit Verzweigungs-Frage ("Was hast du bereits?") |
| 2 | Eingriffs-Logik | Gate-getrieben, drei Severity-Klassen |
| 3 | Wissens-Asymmetrie | Fünf-Domänen-Spezialist (Architektur, Security, Ops, Compliance, Doku-Hygiene) |
| 4 | Tool-Verhältnis | Hilfs-Artefakte only, Web-Plattform, keine Plugins (CLI ist Phase 2) |
| 5 | Schweigen-by-Default | Schweigen außerhalb Chat, proaktiv im Chat |
| 6 | Projekt-Hygiene | Decision-Log + Müll/Drift |
| 7 | Regelwerk | 255 Regeln Kern-Asset, Veredler-Skelett in Foundation, Vollausbau Phase 2 |
| 8 | Lernfähigkeit | Komitee + Extern Phase 1, Repo Phase 2/3 |
| 9 | Doku-Hygiene | Neun Audit-Findings + Konvention via AGENTS.md + CONVENTIONS.md |

**Hinweis zur Synchronität:** ADR-028 schärft Achse 4 und 7 gegenüber dem aktuellen Stand in v3. Die v3-Datei `docs/active/vision.md` wird im Folge-Sprint angeglichen, sodass Tabelle und v3-Detail wieder synchron sind. Bis dahin ist ADR-028 die normative Quelle für Achse 4 und 7.

Was bewusst nicht entschieden wird, ist im Abschnitt "Was nicht entschieden wird" aufgeführt.

---

## Architektur-Konsequenzen

Der Pivot strukturiert das Produkt in fünf Hauptpunkten neu:

**Audit-Pipeline bleibt Kern, wird zu einem von mehreren Eintrittstoren.** Die 255-Regel-Engine läuft unverändert. Was sich ändert, ist ihre Position im Produkt: Sie ist eine Tür für User mit existierendem Repo. Die zweite Tür ist ein strukturiertes Onboarding für User ohne Code. Beide Türen konvergieren in derselben Plattform.

**Begleiter-Chat als zweite Hauptachse neben Audit.** Die Plattform bekommt eine Konversations-Schicht, in der User über die Zeit mit dem Produkt arbeiten. Substanz dafür ist im Repo bereits vorhanden — die Workspace-Tabellen (`workspace_messages`, `workspace_participants`, `workspace_assets`, `workspace_exports`) sind aktiv produktiv und können als Recycling-Basis genutzt werden.

**Decision-Log im User-Repo als neue Wissens-Schicht.** Projekt-Wissen wird strukturiert persistiert in einer YAML-Datei im Repo des Users (`.tropen/decision-log.yml`). Quelle der Wahrheit liegt beim User, nicht in der Tropen-DB. Das ersetzt die in v2 erwogene Multi-Tier-Wissens-Architektur durch eine schlanke, repo-basierte Lösung.

**Fünf-Domänen-Spezialist statt Vier.** Die Wissens-Asymmetrie bekommt eine fünfte Domäne: Doku-Hygiene. Sie ist tropen-eigen — kein anderes AI-Code-Review-Tool adressiert systematisch Doku-Wildwuchs in Vibe-Coder-Repos. Substanz dafür existiert bereits in Form der Doku-Konvention (`AGENTS.md`, `docs/CONVENTIONS.md`), die im Aufräum-Sprint 2026-05-07 etabliert wurde.

**Lernende Plattform mit drei Quellen, gestaffelt aktiviert.** Komitee-Lernen (intern) und externe Quellen (CVE-Feeds, Gesetzes-Updates) sind in Phase 1 aktiv. Lernen aus User-Repos ist auf Phase 2/3 verschoben — bei <500 Usern statistisch bedeutungslos und in der Privacy-Architektur aufwändig.

**Inventur-Befund:** Die Repo-Bestandsaufnahme vom 2026-05-07 hat erhebliche eingefrorene Substanz quantifiziert, die für den Pivot Recycling-Kandidat ist. Drei Assets sind als Recycling-Priorität verbindlich (siehe Sequenzierung): das Feeds-System für Email-Digest und externe Quellen, das Projektwissen-System für die Decision-Log-Architektur, und die Guided-Workflows für den Onboarding-Wizard.

**Bestand bleibt operativ unberührt** — das Audit läuft, die Komitee-Engine läuft, der Fix-Prompt-Generator läuft. Der Pivot baut auf Bestand auf, er ersetzt ihn nicht.

---

## Sequenzierung

Der Weg zum Beta-Launch verläuft in drei Phasen ohne harten Monats-Schnitt.

**Foundation** legt die Pflicht-Substanz, ohne die Beta nicht möglich ist. Vier Aufgaben: Decision-Log-Schema und User-Repo-Integration. Veredler-Skelett — ein einfacher Prompt-Anreicherungs-Mechanismus, der Projekt-Kontext und relevantes Regelwerk in User-Prompts an Bau-Tools einfließen lässt. Die technische Ausgestaltung (Selektions-Logik, Tag-System, Embedding-Suche) wird im Build-Prompt zur Foundation festgelegt — im ADR bleibt offen, ob der Veredler heuristisch, regelbasiert oder modellbasiert arbeitet. Pricing-Tiers mit Stripe-Integration für Free, Starter, Pro, Team. Vertrags-Architektur (~€1.500–€2.000 Anwaltskosten, AVV mit Anthropic und OpenAI, EU-Hosting-Klauseln).

Foundation ist die ehrliche Engstelle des Pivots — wenn diese vier Bausteine nicht sauber stehen, kann Beta nicht starten. Mit dem Tausch von CLI gegen Veredler-Skelett ist Foundation realistischer dimensioniert: Decision-Log und Veredler-Skelett zusammen sind schmaler als das ursprünglich gesetzte 4-Wochen-CLI-Tool plus Decision-Log.

**Build** ergänzt die Substanz, die das Produkt von einer Audit-Plattform zur Begleitplattform macht. Onboarding-Wizard für den "Idee/nichts"-Eintritt. Begleiter-Chat auf Basis der Workspace-Tabellen, mit Veredler integriert. Email-Digest auf Basis des recycelten Feeds-Systems. Initial-Compliance-Checkliste. Decision-Log-Viewer im User-Interface. Drift-Erkennung zwischen Decision-Log und Code-Stand. Compliance-Reporting als Premium-Feature.

**Beta-Polish** bringt das Produkt auf einen Beta-tauglichen Stand. UX-Polish, Performance-Tuning, erste Onboarding-Iterationen mit echten Usern, Bug-Fixes aus Beta-Vorbereitung, Doku-Vollständigkeit.

**Was nicht in Phase 1 ist:** Das CLI-Tool (`tropen audit`, `tropen gate`) wird vollständig aus Phase 1 gestrichen. Die Beta-Erfahrung läuft web-basiert plus Copy-Paste-Workflow in das Bau-Tool des Users. Begründung: Cursor, Claude Code und vergleichbare Bau-Tools haben Repo- und GitHub-Zugriff. Pre-Commit-Stickiness ist nur einer von fünf Stickiness-Hebeln (Decision-Log, Email-Digest, Begleiter-Chat mit Veredler, Compliance-Reporting, Pre-Commit-Hook) — die anderen vier funktionieren ohne CLI. Wenn Wette 1 (Stickiness) in Beta trägt, ist sie ohne CLI getragen.

**Drei Recycling-Prioritäten** sind verbindlich gesetzt — ihre Aktivierung läuft in Build, nicht in Foundation:

Erstens das Feeds-System (`feed_sources`, `feed_items`, `feed_distributions`, Cron alle 6h aktiv) wird Phase-1-Substanz für Email-Digest und externe Quellen-Integration. Zweitens das Projektwissen-System (`projects`, `project_memory`, `project_documents`) wird Substanz-Basis für die Decision-Log-Architektur. Drittens die Guided-Workflows (sieben System-Workflows geseedet) werden Recycling-Basis für den Onboarding-Wizard im "Idee/nichts"-Pfad.

Was nach Beta passiert, ist Gegenstand einer eigenen ADR. Diese ADR existiert noch nicht und wird erst nach erfolgreichem Beta-Launch erstellt.

---

## Wetten und Falsifikations-Kriterien

Der Pivot ruht auf vier expliziten Wetten. Jede Wette hat ein Falsifikations-Kriterium. Bei substantieller Falsifikation einer oder mehrerer Wetten ist eine neue ADR (mindestens ADR-029) erforderlich, die den Pivot oder einzelne Achsen überprüft.

**Wette 1 — Stickiness der asynchronen Architektur.** Wir setzen darauf, dass die Kombination aus Schweigen-by-Default, Pull-Modell und Verzicht auf IDE-Plugin ein Subscription-Produkt produziert — über die Stickiness-Hebel Begleiter-Chat, Decision-Log und wöchentlichen Email-Digest. Falsifikation: Wenn nach 8 Wochen Beta die Audit-Frequenz pro User unter 1 pro Monat liegt, ist die asynchrone Architektur als Subscription-Modell falsifiziert.

**Wette 2 — Wiederholbarer Channel-Mechanismus.** Wir setzen darauf, dass es einen Distributions-Mechanismus gibt, der nicht von Founder-Reichweite abhängt — also einen Kanal, der nach Initial-Setup ohne aktiven Founder-Outreach Beta-User produziert. Diese Wette ist die geschärfte Variante der ursprünglichen "30 User existieren"-Setzung aus v3. Falsifikation: Wenn nach Beta-Phase keine Akquise-Mechanik identifiziert ist, die ohne Founder-Personal-Outreach mehr als 5 User pro Monat liefert, ist die Distribution-Hypothese falsifiziert.

**Wette 3 — EU-Moat ist nachhaltig.** Wir setzen darauf, dass kuratierte Tiefe in DSGVO, BFSG, AI-Act-Transparenz, EU-Hosting und DSGVO-First-Architektur ein verteidigbares Moat gegen US-Konkurrenz ist — und nicht nur temporärer Vorsprung. Falsifikation: Wenn ein US-Konkurrent mit ähnlicher EU-Tiefe erscheint, bevor Tropen 1.000 zahlende User hat, ist das Moat-Gewicht zu überdenken.

**Wette 4 — Chat-Aktivität ist nicht Coding-Flow.** Wir setzen darauf, dass User den Begleiter-Chat aktiv öffnen — und dass proaktive Meldungen dort kein Flow-Bruch sind, sondern Substanz. Falsifikation: Wenn nach 8 Wochen Beta die Chat-Sessions pro User unter 2 pro Monat sind, ist Achse 5 zu überdenken — Tropen hätte dann praktisch gar keine proaktive Stimme.

Alle vier Wetten sind gleichberechtigt. Eine einzelne Falsifikation ist Anlass zur ADR-Überprüfung, keine zwingende Pivot-Wiederholung. Erst die Kombination aus mehreren falsifizierten Wetten ist Anlass für strukturelle Korrektur.

---

## Was nicht entschieden wird

Mit ADR-028 wird bewusst nicht entschieden:

**Distribution-Mechanik über Wette 2 hinaus.** Das K0.7-Distribution-Komitee wurde übersprungen, um ADR-028 nicht weiter zu verzögern. Die konkrete Channel-Architektur, Multiplikator-Hypothesen und Akquise-Sequenzierung bleiben offen und werden im K0.7-Sprint adressiert, der vor Beta-Akquise stattfindet. Bis dahin bleibt Wette 2 die einzige formale Setzung zum Thema.

**Akademie-Verhältnis.** Die Frage, wie die Tropen Academy gGmbH zur Plattform steht — als Funnel, als Vertiefungs-Layer, als getrennte Welt — ist eigene Strategie-Frage und nicht Teil des Pivot-ADRs. Sie wird vor dem Beta-Marketing-Sprint geklärt, weil davon Channel-Hypothesen abhängen.

**Naming-Sprint.** "Tropen OS" ist Platzhalter, "Prodify" ist Idee. Der Naming-Sprint ist Pflicht vor Beta-Onboarding und nicht Teil dieses ADRs. Eigener Sprint, eigene Entscheidung.

**Beta-Pilot-Detail.** Wer genau die ersten zehn bis dreißig Beta-User sind, wie Beta-Verträge konkret aussehen, welche Beta-Onboarding-Sequenz läuft — alles offen. Dies wird in der Foundation-Phase ausgearbeitet, nicht hier vorab gesetzt.

**Pricing-Modell-Detail.** v3 enthält eine Empfehlung (Free / Starter €19–29 / Pro €49–89 / Team €89–99) auf Basis des K0.5-Komitees. Diese Setzung ist Vorschlag, nicht Beschluss — der Markttest steht aus. Das konkrete Pricing wird in Foundation festgelegt und im Beta-Lauf validiert.

---

## Konsequenzen

**Positive Konsequenzen.**

Der Pivot setzt drei Stickiness-Hebel frei. Der Begleiter-Chat und das Decision-Log produzieren wiederkehrenden Wert, den ein Audit-Tool allein nicht erzeugt — User kehren zurück, weil ihr Projekt in der Plattform lebt, nicht weil sie eine Prüfung wollen.

Die fünfte Domäne — Doku-Hygiene — ist tropen-eigen und erweitert den EU-Moat um eine Dimension, die kein US-Konkurrent systematisch adressiert. Die Substanz dafür ist mit der etablierten Konvention (`AGENTS.md`, `CONVENTIONS.md`) bereits gesetzt.

Die Begleiter-Architektur passt zur Markt-Realität. Vibe-Coder kommen mit Wunschbild, nicht mit Spec — ein Begleiter, der vom ersten Schritt an dabei ist, ist die ehrliche Antwort auf diese Realität.

**Negative Konsequenzen und Risiken.**

Die Foundation-Phase ist knapp, aber durch die CLI-Streichung deutlich realistischer dimensioniert als ursprünglich gesetzt. Mit Decision-Log, Veredler-Skelett, Pricing und Vertrag passt Foundation in 4–6 Wochen statt der ursprünglichen 6–8 Wochen mit CLI. Das schafft Spielraum für Build und Beta-Polish.

Die Distribution-Frage ist ungelöst. Ohne K0.7-Komitee bleibt Wette 2 die einzige Setzung zum Thema, und sie ist als Wette formuliert, nicht als Plan. Das ist substantielles Risiko — der beste Pivot ohne Distribution ist kein Produkt.

Die Stickiness-Wette ist Existenz-Risiko für den Pivot. Wenn falsifiziert, hieße das: Tropen ist nicht Subscription, sondern One-Shot-Tool. Dann wäre nicht nur der Pivot-Approach falsch, sondern auch das Pricing-Modell und die Akquise-Strategie. ADR-029 wäre Pflicht.

**Folge-Aktionen.**

K0.7-Distribution-Komitee als Folge-Sprint vor Beta-Akquise. K0.8-Retention-Komitee als Folge-Sprint vor Pricing-Live-Schaltung — adressiert Wette 1 mit Mechaniken-Vorschlägen.

v3-Synchronisations-Sprint: Achse 4 und Achse 7 in `docs/active/vision.md` an ADR-028 angleichen. Pflicht direkt im Anschluss an ADR-Akzeptanz.

Pivot-Disziplin: Bei substanzieller Falsifikation einer oder mehrerer Wetten ist ADR-029 erforderlich. Mid-Sprint-Annahmen, die ADR-Setzungen umgehen, sind verboten.

---

## Status

Status: **accepted**, gesetzt am 2026-05-07 nach 24h-Wait, der durch den Sparring-Marathon vom 2026-05-07 (acht Achsen, drei Komitee-Sprints, Inventur, Aufräum-Sprint, Quellen-Lücken-Klärung, Konvention-Update) faktisch durchlaufen ist.

`review_by: 2026-08-07`. Dieses Datum ist Stabilitäts-Check, nicht Verfallsdatum. ADRs sind in der Tropen-Konvention nicht verfallend — der review_by markiert den Zeitpunkt, an dem aktiv geprüft wird, ob die Setzungen noch tragen. Bestehen sie den Check, läuft ADR-028 weiter ohne Anpassung.

**Disziplin-Hinweis.** Pivot 2 ist nicht Pivot 3. Die Stabilität der hier getroffenen Setzungen ist Voraussetzung für Beta-Glaubwürdigkeit. Kein erneuter Pivot innerhalb der nächsten 6 Monate — falsifizierte Wetten werden über ADR-029 adressiert, nicht über erneute Identitäts-Verschiebung. Das Produkt darf in dieser Zeit präzisiert, geschärft, kalibriert werden — aber nicht neu definiert.
