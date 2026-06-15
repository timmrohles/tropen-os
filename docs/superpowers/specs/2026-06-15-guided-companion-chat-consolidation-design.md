---
status: draft
created: 2026-06-15
author: Timm (+ Claude)
supersedes_intent: konsolidiert die fragmentierten „geführter Chat"-Stränge
related: [ADR-028, ADR-030, ADR-033, ADR-023, ADR-020, ADR-021]
depends_on:
  - "corpus-c2 muss zuerst auf main landen (ADR-033 + Konzept-Modell + UI + Konventions-Korpus; ADR-Nummer 032→034)"
  - "Read-Zugriff-Entscheidung als eigener ADR ratifizieren (amendiert ADR-028)"
---

# Ziel-Bild: Geführter Companion-Chat (Konsolidierung)

## 1. Kontext & Problem

Rund um „geführten Chat" existieren mehrere parallele Stränge, die nie zu einem zusammengeführt wurden:

- **A — Guided-Workflows** (`/api/guided/*`, `guided-workflow-engine`, 7 geseedete Workflows): keyword-getriggerter geführter Dialog. **Pre-Pivot-KMU-Substanz** (generische Entscheidungshelfer), live aber minimal.
- **B — Chat-Intention `guided`** (`IntentionGate`, `conversations.intention`, ChatArea): „Gezielt ↔ Geführt"-Umschalter — live, aber Logik **leer**.
- **C — Pre-Flight Guided-Loop** (`/preflight/*`: analyze→Lücken→Entscheidungen→Starterpaket): geführte Fundament-Klärung als **Formular/Loop**, live (MVP auf main).
- **D — ADR-033 Chat-first Pre-Flight** (auf `corpus-c2`, VORGESCHLAGEN): die jüngste Setzung — Pre-Flight wird chat-getrieben via retargetem Toro.

**Der eigentliche Killer ist Drift:** Sobald der User mit Lovable/Cursor/Claude Code anders baut, als der Companion es „weiß", läuft Tropen blind parallel zur Realität — jeder Rat wird potenziell falsch. Ohne Erdung an der Repo-Realität ist der Companion wertlos.

## 2. Entscheidung / Ziel-Bild

**Ein Companion-Thread, dessen erste Aufgabe Pre-Flight ist.** Chat-first via retargetem Toro (ADR-033), als eigenes `/preflight`-Surface, das die schwere Chat-Infra wiederverwendet — aber **nicht** in der eingefrorenen Workspace-Chat-Welt lebt.

```
[Freier Toro-Chat] ──Umschalter──▶ [Systematische Schärfung] ──▶ [Starterpaket] ──▶ [läuft weiter als Begleiter]
 Toro coacht, deckt    (B recycelt:    KORSETT-Lücken (47 Knoten)    Konzept + KORSETT-
 4 Dimensionen implizit  intention=     + Advocatus Diaboli (P2)      Abdeckung + Konventions-
 ab (Agenda, kein Formular) 'guided')                                 Korpus C1/C2b
        ▲
        └── „Hab ich schon": PRD/Doc einfügen (sekundärer Schnellpfad)
```

Der Chat **endet nicht** mit dem Starterpaket — er ist der **dauerhafte Projekt-Companion-Thread**; Pre-Flight ist seine erste Station (ADR-028: Begleitung über die Zeit, kein One-Shot).

## 3. Scope & A/B-Verdikt

| Strang | Schicksal | Begründung |
|--------|-----------|------------|
| **A — Guided-Workflows** | **Stilllegen** (Engine, Seeds, `/api/guided/*`, Settings) | Generische Pre-Pivot-Entscheidungshelfer, nicht Vibe-Coder-Domäne; Keyword-/Optionen-Paradigma ist genau das, was ADR-033 (LLM-nativ) verwirft. |
| **B — Intention-Umschalter** | **Hülle recyceln, Logik neu** | „Frei ↔ Geführt" = wortwörtlich ADR-033 Schritt 3. `conversations.intention`-Spalte + Gate-Primitiv bleiben; leere Logik wird mit Pre-Flight-Semantik gefüllt. |
| **C — Pre-Flight-Loop** | **Reuse**, Eingang wird Chat statt Formular | Analyse/Lücken/Generate bleiben; Formular wird Editier-Ansicht. |
| **D — ADR-033** | **Rückgrat** | Jüngste, klarste Setzung. |

Kein „eine Guided-Schicht überall" — die Führung ist Pre-Flight-/Companion-geformt, nicht generisch-entscheidungsgeformt.

## 4. Architektur

Gewählter Ansatz: **zweckgebautes Pre-Flight-Chat-Surface, das die Chat-Infra wiederverwendet** (nicht die Workspace-`ChatArea` mit „Pre-Flight-Modus" — das würde die eingefrorene Workspace-Welt unnötig entfrieren und zwei Produktwelten vermischen).

## 5. Komponenten

| Baustein | Aufgabe | Reuse/Neu |
|----------|---------|-----------|
| Pre-Flight-Chat-Surface (`/preflight/[id]`) | Chat-UI; Frei/Geführt-Indikator + „Schärfen"-Button | UI neu, Streaming-Primitive reused |
| Toro-Pre-Flight-Prompt | Coacht aufs Konzept (4 Dimensionen als Agenda), zielt auf Starterpaket | Neu (Prompt-Modul) |
| Concept-Extractor | `messages[] → concept`-JSONB (4 Felder) | Neu (1 LLM-Call) |
| Switch-Controller | Setzt `intention='guided'`, triggert Schärfung | B recycelt |
| KORSETT-Analyse (`analyzePreflight`) | 47 Knoten → Lücken (rot/gelb/grün) | Reuse |
| Advocatus Diaboli | Kritische Rückfragen zum Konzept | Neu (Phase 2) |
| Lücken-Loop (Decisions) | Rote Lücken auflösen | Reuse |
| Starterpaket-Generator (`/generate`) | KORSETT-Abdeckung + Konventions-Korpus | Reuse |
| Editier-Ansicht | Zeigt/editiert `concept`-JSONB | 2b-Formular reused |
| **Drift-Detektor** | Repo-Realität (gelesen) vs. concept/Decision-Log → Divergenz melden | Neu (Kern-Verhalten) |

## 6. Datenfluss

```
1. /preflight neu  → Pre-Flight-Conversation (type='preflight', intention=frei) ↔ preflight_project
2. Freier Chat     → Toro-Prompt streamt (bestehende Chat-Infra), Messages persistiert
3. „Schärfen" (B)  → Concept-Extractor: messages → concept-JSONB; intention='guided'
4. Schärfung       → analyzePreflight (KORSETT) → Lücken; [P2] Advocatus Diaboli
5. Lücken-Loop     → rote Lücken auflösen (Decisions → Decision-Log)
6. /generate       → Starterpaket (ArtifactBrowser)
7. Thread läuft weiter als Companion; Drift-Detektor gleicht Repo vs. Absicht ab
   ↕ Editier-Ansicht jederzeit auf dem concept-JSONB
```

**Neue Daten-Verknüpfung (einziger echter Schema-Zusatz):** permanente `conversation ↔ preflight_project`-Brücke (`preflight_projects.conversation_id` o.ä.). Sie trägt den Thread; das *Wissen* hängt an concept + Decision-Log + `project_memory`, nicht an der Nachrichten-Tabelle.

## 7. Gedächtnis & Drift

**Problem:** Ein lebenslanger Companion-Thread kann nicht endlos in den Kontext. Roh-Chat-Historie ist das falsche Gedächtnis.

**Prinzip:** *Das Gedächtnis ist der strukturierte Zustand, nicht das Chat-Log.* Der Chat ist eine Transkript-Sicht über dauerhaftem, kompaktem Wissen.

**Drei Quellen — mit Drift als Kern:**
- **Repo = Realität** (read-only gelesen — siehe §8)
- **`concept` + Decision-Log (`.tropen/decision-log.yml`, ADR-028) = Absicht**
- `project_memory` (APPEND ONLY) + Conversation-Summaries = verdichtete Historie

**Companion-Kernjob = Versöhnung von Absicht und Realität.** Der **Drift-Detektor** gleicht den gelesenen Repo-Stand gegen concept/Decision-Log ab und **meldet Divergenz aktiv**, statt blind zu beraten — Beispiel: „Du hast Logins mit Supabase gebaut, im Decision-Log steht aber ‚kein Auth nötig'. Stimmt das noch?"

**Kontext-Zusammenstellung pro Turn:**
```
strukturierter Zustand (concept + Decision-Log + relevantes project_memory + Drift-Status)
+ letzte N Nachrichten wörtlich
+ [später] semantisch abgerufene ältere Stellen (pgvector)
─ NICHT die ganze Historie ─
```
„Strukturiert zuerst" (ADR-021-Nachtrag); pgvector später. Anknüpfung ADR-020 (Sechs-Schichten-Wissensmodell).

## 8. Read-Mechanismus (Repo-Erdung)

**Entscheidung:** Tropen erhält **read-only**-Zugriff aufs Repo (kein Schreiben). Das hält die „Denken/Bauen"-Trennung (ADR-023) intakt und ist mit Pull-MCP kompatibel; es ist *nicht* das vertagte Push-MCP-Server-Thema.

**Phasiert:**
- **MVP:** bestehender Browser-Scan wiederverwenden (File System Access API → `/api/projects/scan`). Drift = letzter Scan vs. Decision-Log/Concept. Schon gebaut, kein GitHub nötig, manuelles Re-Scan.
- **Später:** GitHub-OAuth-Read-Integration für automatisches/kontinuierliches Lesen (Repo auf GitHub; OAuth + API + Push-Webhooks).

**Governance:** Diese Entscheidung **amendiert ADR-028** („kein Repo-Zugriff im MVP") und macht Drift-Erkennung vom Build-Item zum Fundament → **eigener ADR erforderlich** (Pivot-Disziplin, CLAUDE.md).

## 9. Phasen-Schnitt

**Phase 1 (MVP):** Pre-Flight-Chat-Surface + Toro-Retarget (freier Chat) · Conversation↔Projekt-Link · **manueller** „Schärfen"-Umschalter → Concept-Extractor → bestehende `analyzePreflight` → Lücken-Loop → `/generate` · 2b-Formular als Editier-Ansicht · **Scan-basierte Drift-Erkennung**. **Ohne** Advocatus Diaboli, **ohne** LLM-Wechselerkennung, **ohne** GitHub-OAuth.

**Phase 2:** Advocatus Diaboli · LLM-erkannter Frei→Geführt-Vorschlag · GitHub-OAuth-Read · KORSETT-Performance (58–117s → Streaming/Batching/Lazy) · semantisches Retrieval (pgvector).

## 10. Stilllegung A

`/api/guided/*`, `guided-workflow-engine`, die 7 Seeds + Tabellen, Guided-Settings entfernen. **`conversations.intention`-Spalte bleibt** (von B recycelt). Vorher prüfen, dass die Workspace-`ChatArea` nicht hart an A's Workflow-Detektion hängt — B/Gate muss sich sauber von A lösen.

## 11. Vorbedingungen / Governance

1. **`corpus-c2` zuerst auf main landen** (29 Commits: ADR-033 + 2b-Konzept-Modell + `ConceptForm` + analyze/preflight-UI + Konventions-Korpus C1/C2b). **ADR-Nummern-Kollision auflösen:** corpus-c2s `032-compliance-corpus-copilot` → `034` umbenennen (main hat bereits `032-enforced-route-authorization`).
2. **Read-Zugriff-ADR ratifizieren** (amendiert ADR-028; macht Drift-Erkennung zum Fundament).
3. **ADR-033 von VORGESCHLAGEN → akzeptiert** (bzw. diese Spec aktualisiert ihn um den Companion-/Drift-Teil).

## 12. Risiken & Fehlerbehandlung

- **Extraktions-Robustheit:** Liefert der Chat ein „zu dünnes" Konzept → Toro fragt nach statt fortzufahren (Dünn-Input-Ehrlichkeit, ADR-030). Kein Weiterreichen halbgarer Konzepte.
- **KORSETT-Latenz (58–117s):** Schärfungs-Wartezeit braucht Progress-/Streaming-UX (Phase 2).
- **Drift-Lesen veraltet:** MVP-Scan ist manuell → Companion kennzeichnet sein Repo-Bild als „Stand vom <Scan-Datum>", drängt zum Re-Scan bei Relevanz.
- **Doppel-Guided** wird durch A-Stilllegung beseitigt.
- **Advocatus-Diaboli-Kalibrierung:** kritisch, aber Coach, kein Gate (ADR-030).

## 13. Test

- **Unit:** Concept-Extractor (`messages→concept`-Shaping), Switch-Controller (intention-Übergang), Drift-Detektor (Repo-Stand vs. concept → Divergenz-Liste), Toro-Prompt-Modul.
- **Integration:** Conversation↔Projekt-Link, Gesamtfluss (Chat→Schärfen→Lücken→Generate), Scan→Drift.
- Reused-Teile (analyze/loop/generate) tragen ihre bestehenden Tests.

## 14. Out of Scope (dieses Ziel-Bild)

- Volle „während-des-Bauens"-Begleitung nach dem Starterpaket (eigene Fläche, ADR-028 Begleiter-Chat) — die Architektur legt nur das Fundament (persistenter Thread).
- Schreibender Repo-Zugriff / Push-MCP-Server (ADR-023 vertagt).
- pgvector / semantisches Retrieval (Phase 2+).
- Veredler-Vollausbau (ADR-021, eigener Strang).
