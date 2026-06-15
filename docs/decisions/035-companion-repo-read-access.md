---
status: accepted
updated: 2026-06-15
review_by: 2026-09-15
supersedes: []
superseded_by: null
amends: ADR-028
author: Tim Rohles
---

# ADR-035 — Companion liest das Repo (read-only) zur Drift-Erdung

**Status:** Accepted (2026-06-15) — Decider-Entscheidung; amendiert ADR-028.
**Deciders:** Timm
**Verwandt:** ADR-028 (Companion-Pivot), ADR-023 (Interface-Strategie/Pull-MCP), ADR-030 (Prämissen-Modell), ADR-033 (Pre-Flight Chat-first), Spec `docs/superpowers/specs/2026-06-15-guided-companion-chat-consolidation-design.md`

---

## Kontext

Der geführte Companion-Chat (ADR-033 + Konsolidierungs-Spec) hält Projekt-Wissen als **strukturierten Zustand** (`concept`, Decision-Log, `project_memory`). Dieses Wissen ist **Absicht** — was der Nutzer bauen *wollte*.

ADR-028 setzte für den MVP **keinen Repo-Zugriff** (web + Copy-Paste; Decision-Log im User-Repo, aber vom User committet). Daraus folgt ein struktureller Defekt: Sobald der Nutzer mit Lovable/Cursor/Claude Code **anders baut**, als der Companion es „weiß", läuft Tropen **blind parallel zur Realität** — jeder Rat wird potenziell falsch. Drift ist damit nicht ein Randproblem, sondern der **Killer** des Begleit-Versprechens.

## Entscheidung

**Der Companion erhält read-only-Zugriff auf das Repo, um seine Absicht gegen die Code-Realität zu erden und Drift aktiv zu melden.**

- **Read-only.** Tropen liest, um zu beraten — es **baut/schreibt nicht** ins Repo. Das hält die „Denken/Bauen"-Trennung (ADR-023) intakt und ist mit **Pull-MCP** kompatibel. **Push-MCP (Tropen als MCP-Server)** bleibt wie in ADR-023 vertagt.
- **Drei-Quellen-Gedächtnis:** **Repo = Realität (gelesen)** · `concept`/Decision-Log = Absicht · `project_memory`/Summaries = verdichtete Historie. Kern-Job des Companions ist die **Versöhnung** von Absicht und Realität.
- **Phasiert:**
  - **MVP:** bestehender Browser-Scan (File System Access API → `/api/projects/scan`) als Read-Mechanismus. Drift = letzter Scan vs. Decision-Log/Concept. Schon gebaut, kein GitHub nötig, manuelles Re-Scan.
  - **Später:** GitHub-OAuth-Read-Integration für automatisches/kontinuierliches Lesen.

## Amendment zu ADR-028

ADR-028 Achse 4 / Foundation sagte „kein Repo-Zugriff im MVP, Copy-Paste". Dieses ADR **amendiert** das: read-only-Repo-Lesen wird Teil des Companion-Fundaments, und die in ADR-028 schon gelistete **„Drift-Erkennung"** steigt vom Build-Item zum **Fundament** auf. Push (Tropen→Tool) bleibt unverändert Copy-Paste/CLI (ADR-023); nur das **Lesen** wird geöffnet.

## Konsequenzen

**Positiv:** Companion-Rat ist an der Realität geerdet statt blind; Drift wird aktiv gemeldet („du baust X, im Decision-Log steht Y — stimmt das noch?"); MVP nutzt vorhandene Scan-Substanz (kein Neubau).

**Negativ / offen:**
- MVP-Scan ist **manuell** → das gelesene Repo-Bild ist „Stand vom <Scan-Datum>"; der Companion muss das kennzeichnen und bei Relevanz zum Re-Scan drängen. GitHub-OAuth (später) löst die Aktualität.
- Privacy/EU: gelesener Repo-Inhalt ist Projektdaten — Verarbeitung muss zur DSGVO-First-Position passen (kein Persistieren über das Nötige hinaus; Org-Isolation).
- Lernen aus User-Repos bleibt wie in ADR-028 auf Phase 2/3 (statistisch/Privacy) — dieses ADR betrifft nur das **Lesen fürs eigene Projekt des Nutzers**, nicht plattformweites Lernen.

## Status

**Accepted**, 2026-06-15 durch Timm. Architektur-prägend; das 24h-Gate aus Pivot-Disziplin gilt durch die ausführliche Sparring-Entscheidung als erfüllt. Umsetzung beginnt mit dem Scan-basierten Drift-Read im MVP-Build (Konsolidierungs-Spec).
