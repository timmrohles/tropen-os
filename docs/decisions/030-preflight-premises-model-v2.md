# ADR-030: Pre-Flight Prämissen-Modell v2 — bereitschafts-gewahrter Einstieg + geführte Entwicklung

**Status:** Accepted (Richtung). Architektonische Teile (geführte Entwicklung + verzögerte Generierung — Scheibe 2) unterliegen der Pivot-Disziplin: ADR + 24h-Gate vor Build, eigene Spec.
**Datum:** 2026-06-06
**Kontext-Branch:** Folge auf `claude/preflight-impl` (PR #46, CRUD-Hülle).
**Bezug:** ADR-028 (Begleitplattform, zwei Türen), ADR-029 (Audit-Kategorie 27 Web-Discoverability + AI-Readiness).

## Kontext

Die heutige Pre-Flight ist ein One-Shot: Pivots + Konzept → Analyse → Startpaket. Dogfooding (2026-06-06) hat den Geburtsfehler empirisch belegt: Aus **„Ich möchte ein LMS bauen"** (0 Inhalt) entstehen 19 selbstbewusst aussehende Lücken **und** ein Startpaket — generisches Boilerplate, das so tut, als wäre es ein Fundament. **Fingierte Substanz ist schlimmer als ehrliche Leere.** Weitere Schwächen: Stack als Freitext (oft geraten), Plattform (Web/App) gar nicht erfasst, Fernabsatz/Abo nur flach, kein „und jetzt?", keine Ehrlichkeit über Grenzen.

Kernerkenntnis: **Wenn vieles ungeklärt ist, gibt es nichts zu analysieren.** Eine direkte Analyse/Generierung ist dann falsch.

## Entscheidung

### Bereitschafts-gewahrter Einstieg (Variante A)

Jeder Input bekommt einen **schnellen Bereitschafts-Check** (billig, nicht die 36-Knoten-Vollanalyse):
- **Reich genug** → Analyse/Ergebnis wie bisher.
- **Zu dünn** → **geführte Projektentwicklung** (anbieten, nicht erzwingen): mit dem Nutzer gemeinsam den **Mindeststandard** erreichen, statt Pseudo-Lücken auszuwerfen.

### Readiness-Maßstab (transparent, ein Maßstab — drei Funktionen)

Steht **am Eingabefeld** (Erwartung setzen), ist das **Gate-Kriterium**, und begründet die **Abzweigung**:

> Damit Pre-Flight wirklich analysieren kann, sollte die Beschreibung enthalten:
> 1. **Was & für wen** (1 Satz) · 2. **Kern-Funktionen** (3–5 Stichpunkte) · 3. **Nutzer & Daten** (Logins/Konten? welche Daten?) · 4. **Verkauf?** (kostenlos/Shop/Abo)
> Fehlt das meiste → geführte Entwicklung statt generischer Analyse.

### Mindeststandard (= die rot/gelb-Logik des Korsetts, als Gate genutzt)

Was **definitiv geklärt** sein muss, bevor ein Repo-Gerüst (CLAUDE.md/specs/readme) Sinn ergibt:
- **Ziel & Scope** in einem Satz + **Projekttyp**.
- Die **anwendbaren 🔴-Entscheidungen** — entschieden *oder* bewusst mit Default geparkt: Stack · Plattform (Web/Native) · Daten+Auth ja/nein · Vertriebsmodell (Fernabsatz/Abo) · Rechts-Trigger (B2C/EU/BFSG) · **Auffindbarkeit → Rendering-Strategie** · **Last → Daten-/Caching-Tier**.
- **🟡 = anbaubar**, explizit auf später vertagt — nicht Teil des Mindeststandards.

### Generierungs-Gate

**Repo-Dateien werden erst generiert, wenn der Mindeststandard erreicht ist** — nie aus dünnem Input. Das Startpaket entsteht aus *Entscheidungen*, nicht aus 5 Wörtern. (Verschiebt die Generierung ans Ende → Datenfluss-Änderung, architektonisch.)

### Loop-Mechanik

Strukturierte Lücken-Karten mit **KI-vorgeschlagenem Default** + **„diskutieren"-Chat-Eskalation pro Lücke**. Coach-geführt, kein Blank-Chat.

### Scope-Grenze (Verfeinerung von „eng am Fundament")

Kern bleibt am Repo-Fundament. **Auffindbarkeit (SEO) und Last** werden als **grobe Trigger vorab** erfasst (Teil des Mindeststandards), weil sie je *eine* rote Entscheidung steuern (SEO→Rendering F1; Last→DB-/Caching-Tier). Ihre **strategische Tiefe** (SEO-Taktik, Wachstum) bleibt **Next-Steps + Audit-Tür** (Kategorie 27, ADR-029). „Awareness, kein Gate"; Disclaimer „ersetzt keine Rechtsberatung" bleibt.

## Zerlegung in versandfähige Scheiben (re-sequenziert)

| Scheibe | Inhalt | Architektur-prägend? |
|---------|--------|----------------------|
| **1 — Prämissen-Erfassung + Ehrlichkeit** | Stack-Auswahl + Plattform + Fernabsatz/Abo (verdrahtet mit Korsett+Compliance) · **Readiness-Maßstab am Eingabefeld** · **Dünn-Input-Erkennung** (ehrliches Banner statt Pseudo-Startpaket) · Reifegrad-Begriffe erklärt · Capability-Hinweis | Nein (additiv) — **ohne 24h-Gate** |
| **2 — Geführte Entwicklung** | Bereitschafts-Check → geführter Loop zum **Mindeststandard** (Karten + KI-Default) · **Generierungs-Gate** (Repo erst nach Mindeststandard) · SEO/Last als grobe Trigger im Mindeststandard | **Ja** — ADR + 24h-Gate, eigene Spec |
| **3 — „Diskutieren"-Chat pro Lücke** | Chat-Eskalation je Lücke | Ja (baut auf 2) |
| **4 — Next-Steps-Roadmap** | geordnete „und jetzt?"-Empfehlungen (now/soon/later), inkl. SEO/Last-Tiefe, Brücke zur Audit-Tür | Nein |

Abhängigkeiten: 1 → 2 → 3; 4 kann nach 1 starten, wird mit 2 reicher.

## Konsequenzen

- **Scheibe 1 wird zuerst gebaut** (additiv; macht das Tool sofort *ehrlich* über dünnen Input). Spec: `docs/superpowers/specs/2026-06-06-preflight-premises-v2-slice1-design.md`.
- **Scheibe 2 ist der eigentliche Pivot** (geführte Entwicklung + Generierungs-Gate verschiebt den Datenfluss): 24h-Gate + eigene Spec vor Build.
- `pivots`/`result` sind JSONB → neue Felder rückwärtskompatibel, keine Migration für Scheibe 1.
- Pre-Flight bleibt **kein** Markt-/Produktstrategie-Berater; Trennlinie zur Audit-Tür bleibt scharf.
