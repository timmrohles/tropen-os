# Inventur-Sprint Handover — 2026-05-07

**Sprint:** Repo-Bestandsaufnahme  
**Datum:** 2026-05-07  
**Status:** Erfolgreich  
**Output:** `docs/inventur/repo-bestandsaufnahme-2026-05-07.md`

---

## Umfang

| Teil | Inhalt | Assets |
|------|--------|--------|
| A | Heutige Substanz (produktiv aktiv) | ~70 Assets (Regeln, Routen, Komponenten, API-Routes, Checker, Tables) |
| B | Eingefrorene Substanz | 10 Asset-Gruppen |
| C | Konzept-Substanz | ~90 Dokumente |
| D | Mapping gegen v2-Zielbild | 8 Achsen |
| E | Auffälligkeiten | 10 Beobachtungen |
| F | Quellen-Lücken | 7 offene Punkte |

---

## 5 Überraschende Befunde

**1. Regelzahl: 255 statt 242**  
CLAUDE.md und Zielbild v2 nennen "242 Regeln in 26 Kategorien". Der direkte Code-Scan von `rule-registry.ts` ergibt 255 Regeln (187 automatisiert + 68 manuell). Drei verschiedene Zahlen im Umlauf: 242 (Doku), 250 (Audit-Report), 255 (Code). Die Dokumentation ist um 13 Regeln veraltet.

**2. `docs/inventory/` und `docs/inventur/` — zwei Verzeichnisse**  
Frühere Inventur-Session (April 2026) liegt unter `docs/inventory/` (englisch, 8 Dateien). Diese neue Inventur liegt unter `docs/inventur/` (Deutsch, neu erstellt). Beide existieren parallel.

**3. 29 Agent-Dateien statt 21**  
CLAUDE.md dokumentiert "21 Agent Rule Packs". Tatsächlich in `docs/agents/` gefunden: 29 Dateien. 8 Agents wurden nach dem letzten CLAUDE.md-Update erstellt (BFSG_AGENT, AI_ACT_AGENT, DSGVO_AGENT, LOAD_TEST_AGENT, AGENT_QUALITY_AGENT, SECURITY_SCAN_AGENT, SLOP_DETECTION_AGENT, SPEC_AGENT).

**4. Skills 4–6 nicht direkt belegt**  
Drei der sechs System-Skills (Wissensextraktion, Berichterstellung, Social-Media) konnten nur aus CLAUDE.md bestätigt werden, nicht direkt aus dem Code. Die Migration-Datei wurde nur teilweise gelesen.

**5. ADR-Lücken ADR-028 bis ADR-030**  
Drei ADR-Nummern fehlen. ADR-025, ADR-026, ADR-027 existieren. ADR-031 steht aus. Was mit 028–030 passiert ist — gelöscht, nie angelegt, oder umbenannt — ist aus dem Repo nicht erkennbar.

---

## Wo Klärung nötig ist

1. **Regelzahl aktualisieren:** CLAUDE.md-Wert "242" auf tatsächliche Zahl (255 oder Audit-Report-Wert 250) aktualisieren.
2. **Skills 4–6 verifizieren:** `20260318000047_skills.sql` ab Zeile 235 lesen und die Skill-Namen bestätigen.
3. **ADR-028 bis ADR-030 klären:** Existierten diese ADRs? Wurden sie verworfen oder nie angelegt?
4. **`connections`-Tabelle:** Migrations-Quelldatei identifizieren.
5. **`inventory/` vs. `inventur/`:** Ein Verzeichnis wählen oder explizit beide behalten mit Beschreibung.
6. **Achse 2 CLI-Tool:** Ist `tropen gate` CLI für MVP geplant oder Phase 2? Zielbild v2 sagt MVP, aber kein Code vorhanden.

---

## Geschätzte Dauer

Inventur-Sprint: ~2,5 Stunden Laufzeit (parallele Reads, circa 60 Tool-Calls).

Abgedeckte Dateien: ~35 direkt gelesen + ~50 via `ls`/`grep` gescannt.

---

*Erstellt durch automatische Repo-Inventur.*
