# Konzept: Begleiter-Foundation („Korsett" / Pre-Flight)

> **Status:** Konzept · Phase 2 · **nicht in Bau** · zur Komitee-Verifikation
> **Datum:** 2026-06-03
> **Disziplin-Hinweis:** Dies ist ein Konzept-Dokument, kein Bau-Auftrag. Phase 1 (Audit) ist Vorrang; dieses Feature gehört nach Beta. Festgehalten, damit die Denkrunde nicht verloren geht.

## 1 · Problem

Vibe-Coder bauen los, ohne Fundament. Ein Junior fängt einfach an; ein Senior fragt vorher: *Was ist das Ziel? Welcher Stack? Wo ist die SSOT? Welche harten Constraints? Damit auch andere — und die Bau-KI in drei Wochen — das Repo verstehen und wissen, wo weitermachen.*

Genau diese Senior-Befragung fehlt zwischen „Idee/Schema" und „Bauen". Der Begleiter füllt sie.

## 2 · Die Mechanik in einem Satz

> **Pre-Flight = die Audit-Engine vorwärts in der Zeit.**
> Audit schaut auf fertigen Code: „diese 12 Dinge sind falsch." Pre-Flight schaut auf Absicht: „diese 12 Dinge hast du noch nicht entschieden." **Gleiche Taxonomie, zwei Richtungen.** Keine neue Engine.

## 3 · Zwei Richtungen, gewählt durch Input-Reichtum

| Input | Richtung | Verhalten |
|-------|----------|-----------|
| Reich (fertiges Schema/Doc) | **Audit-Richtung** | Taxonomie *gegen* den Input → Lücken-Liste. **Validiert** (Live-Test 2026-06-03). |
| Vage (nur eine Idee) | **Elicit-Richtung** | offene Zellen werden zu Fragen (= die Onboarding-Fragen). **Unvalidiert.** |
| Dazwischen | Mischung | extrahieren was da ist, Rest erfragen |

Erster Schritt ist nicht „lies das Doc", sondern **„klassifiziere den Projekt-Reifegrad"** und drehe am Regler elicit↔audit. Damit kollabieren Onboarding-Wizard und Pre-Flight in *eine* Mechanik.

## 4 · Das Korsett ist ein Entscheidungsbaum

**Neutral an der Wurzel, meinungsstark in den Blättern.**

- **Universelle Knoten** (immer, stack-egal): Ziel & Scope, SSOT, Secrets-Handling, Repo-Lesbarkeit, Error-Disziplin.
- **Pivot-Fragen** schalten Sub-Bäume frei. Die `gilt-wenn`-Bedingung pro Knoten *ist* die Baum-Kante. Defaults leben auf den Ästen, nicht an der Wurzel.

**Knoten-Schema:** `{ Frage, Warum-es-zählt, Default (kontextuell), aufschub_kosten: 🔴|🟡, gilt-wenn }`

**Ehrliche Tiefe-Asymmetrie:** Unser Regelwerk (255 Regeln) ist selbst eine Kalibrierung auf **Supabase/Next/TS**. Der Baum ist *strukturell offen*, aber senior-tief nur auf diesem Ast; andere Äste sind Stubs. Glücklicher Zufall: dieser Ast ist der dominante Vibe-Coder-Stack (Lovable/Bolt erzwingen React+Supabase).

## 5 · Die Pivots

1. **Was baust du?** (Typ → Domänen-Overlay)
2. **Datenbank? welche?**
3. **Auth / User-Accounts?**
4. **Daten:** PII? Kategorie (besondere/​Kinder)?
5. **KI-Features? welches Risiko-Tier?**
6. **⚖️ Recht/Jurisdiktion (Querschnitt-Synthese):** Hosting · Zielgruppe · Firmensitz · B2C/B2B · Zahlungen · **Sub-Prozessoren** · Tracking
7. *(Eingangs-Pivot)* **Greenfield oder bestehende App?**

**Legal ist quer, nicht parallel:** eine Synthese-Schicht, die Signale aus den anderen Pivots zieht (PII→DSGVO, KI→AI-Act) *plus* eigene Jurisdiktions-Fragen. **Ableiten, nicht fragen** — niemals „bist du DSGVO-konform?", sondern Fakten → System schließt Regime. (Reuse: `compliance-domains.ts`, `scan_project_profiles`.)

Häufigste Vergessene mit hohem Schmerz: **B2C→BFSG** (neue Pflicht) und **Sub-Prozessor-AVV** (entsteht in der Sekunde, in der man die LLM-API anklemmt — was Vibe-Coder ständig tun).

## 6 · Awareness statt Gate (die „Gemüse"-Lösung)

Das Korsett **informiert, blockiert nie** (Advisor, nicht Mechaniker · 0 ungefragte Unterbrechungen). Jeder Knoten trägt **Aufschub-Kosten**:

- 🔴 **architektur-prägend** (aufschieben = teurer Umbau) → stark nudgen, nie zwingen. (`org_id`/Tenancy, `auth.uid`-Bindung, SSOT, Datenresidenz.)
- 🟡 **anbaubar** (aufschieben = nachrüstbar) → bewusst parken, „später". (DSGVO-Paperwork, a11y, Cookie-Banner, Monitoring.)

**Feinheit am DSGVO-Beispiel:** architektonischer Teil (welche PII, RLS, Residenz) = 🔴; Paperwork (Datenschutzerklärung, AVV, Banner) = 🟡. Das Korsett trennt beides — *„du weißt, du musst, aber jetzt nicht wichtig"* gilt fürs 🟡.

Bewusst Aufgeschobenes → als `open_question`/„später" in den **Decision-Log** → **taucht im Audit wieder auf**, sobald live. Aufschub ist *getrackt, nicht vergessen*. Damit ist das Konzept **nicht-bürokratisch** — kein Gemüse-Zwang.

## 7 · Output: Startpaket + GO

**Startpaket** (kopierbar/downloadbar — der Begleiter schreibt **nie** ins Repo; Fix-Engine-Lehre):
1. **Decision-Log** (geseedet) — `project_memory`, APPEND-ONLY
2. **`CLAUDE.md` / Rules** — Konventionen *als Kontext für die Bau-KI* ← der Hebel: die KI hat kein Gedächtnis, die Repo-Lesbarkeit *ist* ihr Gedächtnis
3. **Erste Migration** (Durchstich-Slice)
4. **`.env.example`**
5. **GO-Signal**

**GO ist ein Reifegrad-Bild, kein Knopf:** „Architektur-Entscheidungen (🔴) getroffen ✅ · N bewusst aufgeschoben (🟡, im Log) → leg los."

## 8 · Die Audit-Schleife (Korsett = lebender Vertrag)

Korsett (vorwärts) und Audit (rückwärts) sind dieselbe Taxonomie. Also prüft das Audit später: **„Hast du deine eigene Foundation eingehalten?"** — Drift-Detection Soll vs. Ist.

Zwei Folgen: (1) das Korsett wird vom Einmal-Schuss zum **lebenden Vertrag**; (2) es ist der **Retention-Hook** — der Grund wiederzukommen. Ohne die Schleife ist der Pre-Flight ein Einweg-Tool.

## 9 · Korsett-Domänen (Rückgrat)

| Domäne | Klärt | Quelle |
|--------|-------|--------|
| Ziel & Scope | was gebaut wird / was bewusst nicht | Senior |
| Stack & Bausteine | Framework, Libs, Starter, DB, Auth, Hosting | Senior |
| Repo-Struktur & Ablage | Ordnerlogik, Naming | Senior + Audit |
| SSOT | wo die *eine* Wahrheit liegt; generieren statt duplizieren | Senior |
| Harte Constraints | RLS-mit-Tabelle, Git-zuerst-DB, keine Secrets, Tenancy, Error-Pattern | Audit |
| Security & Compliance | EU-Moat-Mindestmenge (PII, RLS, DSGVO, AI-Act) als *Entscheidungen* | Audit |
| **💸 Kosten & Missbrauch** | Rate-Limiting, Budget-Cap, Runaway-LLM-Rechnung | Audit (cat-20) |
| **👀 Observability** | „woran merkst du, dass Prod kaputt ist?" | Audit |
| **💾 Backups & Umgebungen** | prod-vs-dev-Trennung, Wiederherstellbarkeit | Audit (sec-db-10) |
| Continuability / Legibility | CLAUDE.md, Decision-Log, ADRs, README | Senior |

*(Klein/später: i18n als Day-0 bei EU-Zielgruppe.)*

## 10 · Wiederverwendung vs. neu

**Recycelt:** `project_memory` (Decision-Log), Audit-Taxonomie (Backbone), `compliance-domains`/`scan_project_profiles` (Legal-Relevanz), Fix-Prompt-Template-Engine (Artefakt-Generierung), Veredler-Skelett (Tiefen-Klassifikator), Workspace-Tabellen (Chat).
**Neu:** Taxonomie-Autoring (das Moat + der Löwenanteil), CLAUDE.md-Generator, GO-/Reifegrad-Logik, Maturity-Klassifikator, Audit-Schleifen-Verknüpfung.

## 11 · Offene Risiken / Wetten

- **🔴 Premissen-Wette:** Will ein Vibe-Coder überhaupt etwas *vor* dem Bauen? Antwort-Hypothese (Timm, 2026-06-03): **ja, wenn Awareness statt Gate** — hinweisen + Option „später", nicht zwingen. **Vor v0 in L2-Calls testen.**
- **Taxonomie-Autoring:** Audit-Regeln sind „ist X im Code?" — die Forward-Form „hast du X entschieden?" ist *keine* 1:1-Übersetzung. Kuratierter Kern, nicht Auto-Konvertierung.
- **„Korsett, keine Zwangsjacke":** Komitee April flaggte „195 Regeln zu viele". Die Kunst ist Weglassen.
- **Compliance-Tiefe:** nur Stufe 1 (Existenz/Hinweis) + Disclaimer „ersetzt keinen Anwalt". Keine Rechtsberatung.

## 12 · Validierungs-Leitfaden L2-Calls

**Frage 1 (vor allem anderen):** *„Würdest du so ein Foundation-Tool benutzen, *bevor* du baust — oder erst, wenn du dir einmal die Finger verbrannt hast?"* → testet die Premissen-Wette.
**Frage 2:** Kommen Vibe-Coder vage oder mit Konzept? → kalibriert elicit-vs-audit-Gewicht.
**Frage 3:** Welche der „Entscheide-zuerst"-Punkte lösen den „daran hätte ich nicht gedacht"-Moment aus? → die werden Keimzelle der Taxonomie.

## 13 · Nächster Schritt

1. **Korsett v0** entwerfen: universelle Knoten + 7 Pivots, Legal als Querschnitt, Supabase/Next-Ast tief, Rest Stub, je Knoten Aufschub-Kosten 🔴/🟡.
2. **Adversariale Komitee-Verifikation** (`committee-review.ts`): nicht „ist das gut?", sondern *„Was **fehlt**? Was würde ein Senior **ablehnen**? Was ist **over-engineered** für einen Solo-Vibe-Coder?"* — das Komitee ist der Vollständigkeits-Check für das Korsett.
3. Härten anhand der Lücken → das verifizierte Korsett ist zugleich Produkt-Taxonomie **und** tropenOS' eigene Foundation (Dogfooding).
