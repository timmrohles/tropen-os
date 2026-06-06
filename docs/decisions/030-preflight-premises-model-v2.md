# ADR-030: Pre-Flight Prämissen-Modell v2 — Hybrid (Analyse → geführter Loop)

**Status:** Accepted (Richtung). Architektonische Teile (geführter Loop, verzögerte Generierung — Scheibe 2) unterliegen der Pivot-Disziplin: ADR + 24h-Gate vor Build, eigene Spec.
**Datum:** 2026-06-06
**Kontext-Branch:** Folge auf `claude/preflight-impl` (PR #46, Scheibe-1-CRUD).
**Bezug:** ADR-028 (Begleitplattform, zwei Türen), ADR-029 (Audit-Kategorie 27 Web-Discoverability + AI-Readiness).

## Kontext

Die heutige Pre-Flight ist ein One-Shot: Pivots + Konzept → Analyse → Startpaket. Drei Schwächen aus dem Dogfooding:

1. **Das Konzept eines Vibe-Coders ist halbgar.** Eine Analyse von „was geschrieben steht" ist nur bedingt sinnvoll, wenn viele Fragen offen sind.
2. **Schwache/fehlende Prämissen:** Stack als Freitext (der Nutzer weiß es oft nicht oder rät schlecht); Plattform (Web vs. native App) gar nicht erfasst, obwohl architektur- und rechtsprägend; Fernabsatz/Abo nur flach abgedeckt, obwohl massiver Rechts-Hebel.
3. **Output endet beim Dateipaket** — kein „und jetzt?", keine Ehrlichkeit über die eigenen Grenzen.

## Entscheidung

**Interaktionsmodell = Hybrid.** One-Shot-Analyse zuerst (sofortiger Wert) → die offenen Lücken werden ein **geführter Klär-Loop** → erst danach finale Repo-Generierung + Next-Steps.

- **Loop-Mechanik:** strukturierte Lücken-Karten mit **KI-vorgeschlagenem Default** + **„diskutieren"-Chat-Eskalation pro Lücke** (schnell by default, Tiefe auf Abruf). Coach-geführt, kein Blank-Chat.
- **Scope-Grenze:** Kern bleibt eng am **Repo-Fundament** (Architektur, Konventionen, Sicherheit, rechtliche Trigger). Strategie-nahe Themen (Last/Skalierung, SEO/GEO) sind **leise Trigger + primär Next-Steps**, keine blockierenden Lücken. Die *tiefe* Discoverability-/AI-Readiness-Prüfung lebt auf der Audit-Tür (ADR-029, Kategorie 27).
- **Erweitertes Prämissen-Set:** Stack (Auswahl/Ableitung statt Freitext), Plattform (Web/Native/Beides), Geschäfts-/Vertriebsmodell (kein Verkauf/Shop/Abo/Marktplatz) als architektur- und rechtsprägende Prämissen. Kombination zählt (z.B. B2C **und** Abo **und** EU → Widerruf + Kündigungsbutton).
- **Ehrlichkeit:** fester Hinweis, was Pre-Flight gut kann und wo es Grenzen hat. Disclaimer „ersetzt keine Rechtsberatung" bleibt. Coach, kein Gate.

## Zerlegung in versandfähige Scheiben

| Scheibe | Inhalt | Architektur-prägend? |
|---------|--------|----------------------|
| **1 — Prämissen-Erfassung v2** | Stack-Auswahl + Plattform + Fernabsatz/Abo, verdrahtet mit Korsett + Compliance; Ehrlichkeits-Hinweis | Nein (additiv) — **baubar ohne 24h-Gate** |
| **2 — Geführter Loop** | Lücken-Karten mit KI-Default; Entscheidungen persistiert; Repo-Generierung nach Klärung verschoben | **Ja** — ADR + 24h-Gate, eigene Spec |
| **3 — „Diskutieren"-Chat pro Lücke** | Chat-Eskalation je Lücke | Ja (baut auf 2) |
| **4 — Next-Steps-Roadmap** | geordnete „und jetzt?"-Empfehlungen (now/soon/later), Brücke zur Audit-Tür | Nein |

Abhängigkeiten: 1 → 2 → 3; 4 kann nach 1 starten, wird mit 2 reicher.

## Konsequenzen

- **Scheibe 1 wird zuerst gebaut** (additiv, risikoarm; Spec: `docs/superpowers/specs/2026-06-06-preflight-premises-v2-slice1-design.md`).
- Der **geführte Loop** verschiebt die Repo-Generierung ans Ende — das ändert den Datenfluss (Entscheidungen werden vor Generierung persistiert). Architektonisch → 24h-Gate + eigene Spec vor Build.
- `pivots` liegt als JSONB → neue Pivot-Felder sind rückwärtskompatibel, keine Migration für Scheibe 1.
- Pre-Flight bleibt bewusst **kein** Markt-/Produktstrategie-Berater; die Trennlinie zur Audit-Tür bleibt scharf.
