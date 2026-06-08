# ADR-033: Pre-Flight Eingang = Chat-first (Toro retargeted), KORSETT als Schritt 2

**Status:** VORGESCHLAGEN — 24h-Reflexion läuft (Pivot-Disziplin, CLAUDE.md). Kein Umbau vor Ablauf + Re-Plan.
**Datum:** 2026-06-08
**Bezug:** ADR-030 (Prämissen-Modell v2), Scheibe 2a (Lücken-Loop), Scheibe 2b (geführte Konzept-Entwicklung — wird hierdurch umgeformt), Scheibe C1/C2b (Konventions-Korpus = Teil des Outputs).

## Kontext

Der visuelle Check von Schicht 2b-1 (strukturierter 4-Felder-Fragebogen + KI-Default) lieferte Evidenz gegen den Formular-Ansatz:
- Das Formular fühlt sich **starr** an und ist für Vibe-Coder **nicht intuitiv** — es fällt hinter den Standard zurück, den Nutzer kennen (mit einem LLM chatten).
- Kurze Pflichtfeld-Antworten ergaben wieder ein „zu dünnes" Konzept → Schleife.

**Advocatus-Diaboli-Einwand (Nutzer):** Wenn man mit z.B. Claude Opus chattet, entsteht **fast von allein** ein starkes, natürliches Konzept — natürlicher als vorgefertigte Felder. Ein LLM liest alles aus der Konversation. Das **Einzige**, was ein normaler Chat *nicht* von selbst tut: systematisch **alle KORSETT-Knoten** (Foundation/Compliance) durchgehen — und kritisch hinterfragen, ob das alles Sinn ergibt.

**Schlüssel-Einsicht (Nutzer):** Wir haben den Chat schon — **Toro** (aktuell Phase-2-eingefroren). Wir müssen ihn nur stärker **auf den Output zuschneiden** (das Starterpaket). Reuse statt Neubau.

## Entscheidung

Pre-Flights primärer Eingang wird ein **Chat**, kein Formular:

1. **Schritt 1 — freier Chat (Toro, retargeted):** Der existierende Toro-Chat wird auf den Pre-Flight-Output zugeschnitten (Konzept → Starterpaket inkl. KORSETT-Abdeckung + Konventions-Korpus aus C1/C2b). Das Konzept entsteht natürlich im Gespräch. Toro deckt im Coaching implizit die 4 Dimensionen ab (was/für wen · Kern-Funktionen · Nutzer & Daten · Verkauf) — als **Agenda, nicht als starre Felder**.
2. **Schritt 2 — systematische Schärfung:** Lücken-Erkennung gegen das **KORSETT** (das, was der freie Chat nicht von selbst macht) **+ Advocatus Diaboli** („Brauchst du dafür wirklich Logins?", „Lohnt der Marktplatz ggü. simplem Shop?"). Das macht Pre-Flight zum **Denkpartner**, nicht zum Fragebogen-mit-Checkliste.
3. **Freier ↔ geführter Wechsel:** Nutzer kann jederzeit von freiem Chat in den geführten Modus wechseln — **oder das LLM erkennt** den Übergang (genug Konzept vorhanden / systematische Abdeckung fällig) und schlägt ihn vor.
4. **„Hab ich schon"-Schnellpfad bleibt:** Wer ein PRD/Doc hat, fügt es ein statt zu chatten. Chat **primär**, Einfügen **sekundär** — nicht Chat ausschließlich.

## Was bleibt (Reuse) — was sich ändert

| Asset | Schicksal |
|-------|-----------|
| **Toro-Chat-Infra** (Streaming, Kontext, project/workspace-chat) | **Reuse** — retargeten auf Pre-Flight-Output, statt neuen Coach-Chat bauen. Phase-2-Einfrieren für diesen Pfad aufheben. |
| **2b-1 Konzept-Datenmodell** (`concept` JSONB, 4 Felder) | **Reuse** — der Chat *extrahiert* in genau diese Struktur. |
| **`compose→analyzePreflight`-Handoff + Persistenz** | **Reuse** — unverändert. |
| **KORSETT-Analyse** (47 Knoten) | wird **Schritt 2** (Lücken + Advocatus Diaboli), nicht mehr der erste Schritt. |
| **2b-1 Formular-UI** | **Rolle wechselt:** von „primäre Eingabe" → „Zusammenfassungs-/Editier-Ansicht" des erchatteten Konzepts. Nicht verschwendet. |
| **2b-2 (offener Coach-Dialog, geplant)** | **wird primär** statt „für Unsichere" — und basiert auf Toro statt Neubau. |
| **Konventions-Korpus (C1/C2b)** | unverändert — Teil des Starterpaket-Outputs. |

## Konsequenzen

**Positiv:** natürlicher/standard-konformer Eingang; Reuse von Toro (großer Asset) statt Neubau; klare Wertschärfung (Burggraben = KORSETT-Abdeckung + Advocatus Diaboli, nicht das Formular); 2b-1-Substanz bleibt.

**Risiken / offene Fragen für die 24h-Reflexion + Re-Plan:**
1. **Konvergenz/Extraktion:** Freier Chat braucht ein klares „fertig → analysieren"-Signal + saubere Extraktion ins Konzept-Modell. Wer triggert (Nutzer-Button vs. LLM-Erkennung)?
2. **Wechsel-Trigger:** Wie erkennt das LLM zuverlässig „jetzt geführt"? Heuristik vs. LLM-Urteil vs. nur manuell als MVP?
3. **Toro-Entfrieren:** Was genau am eingefrorenen Toro/Chat muss reaktiviert/retargetet werden? Scope-Abgrenzung zum Phase-2-Chat.
4. **Perf orthogonal:** Die KORSETT-Analyse (Schritt 2) dauert aktuell 58–117s (Modell ist nicht der Hebel — Output-Menge). Muss unabhängig gelöst werden (Batching/Lazy/Streaming).
5. **Advocatus Diaboli — Kalibrierung:** kritisch, aber nicht bevormundend (Coach, kein Gate — ADR-030-Prinzip).
6. **MVP-Schnitt:** Was ist der kleinste sinnvolle erste Schritt? (Vermutlich: Toro-Retarget + manueller „analysieren"-Wechsel; LLM-erkannter Wechsel + Advocatus Diaboli später.)

## Pivot-Disziplin

Architektur-prägend → **ADR + 24h** (CLAUDE.md). Dieser ADR hält die Erkenntnis fest; **kein Umbau** vor Ablauf. Danach: 2b-Spec/Plan auf diesen ADR re-planen (2b-2-Dialog wird primär & Toro-basiert; Formular → Sekundär-/Editier-Ansicht). Bestehende 2b-1-Commits bleiben (Datenmodell/Handoff weiter gültig).
