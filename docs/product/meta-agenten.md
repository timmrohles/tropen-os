# Meta-Agenten — Konzept v1.0
## Agenten die Agenten fixen, verbessern und bauen

> **Status:** Konzept März 2026
> **Kernthese:** KMU haben keine Ressourcen eine Agenten-Infrastruktur
>               zu warten. Meta-Agenten machen es überflüssig.
> **Basis für:** Agenten-System Phase 3, Dashboard, Toro-Potenzial-Entdecker

---

## Das Problem: Agent Maintenance Tax

```
Versprechen:  "Agenten arbeiten für dich"
Realität:     "Du arbeitest für deine Agenten"

Warum:
→ Externe APIs ändern ihr Format
→ Prompts liefern schlechter werdende Ergebnisse
→ Neue Datenquellen werden nicht eingebunden
→ Fehler passieren still — niemand merkt es
→ Optimierungspotenzial bleibt ungenutzt

Konsequenz für KMU:
→ Zu viel Aufwand → Agenten werden abgeschaltet
→ "KI hat bei uns nicht funktioniert"
```

---

## Die Lösung: Zwei Ebenen

```
EBENE 1 — Agenten (was bereits existiert)
Tun konkrete Dinge:
→ Wettbewerber beobachten
→ Newsletter schreiben
→ Reports erstellen
→ Daten analysieren

EBENE 2 — Meta-Agenten (neu)
Beobachten und verbessern Ebene 1:
→ Läuft Agent X noch?
→ Sind die Ergebnisse noch gut?
→ Gibt es Verbesserungspotenzial?
→ Welche neuen Agenten wären sinnvoll?
```

Meta-Agenten arbeiten im Hintergrund.
User merkt sie nur wenn etwas zu entscheiden ist.

---

## Die drei Meta-Agenten

### Meta-Agent 1 — Health-Monitor

**Aufgabe:** Überwacht alle aktiven Agenten täglich.

```
Prüft pro Agent:
→ Hat er heute gelaufen? (Scheduled Check)
→ Hat er ein Ergebnis geliefert?
→ Ist das Ergebnis plausibel?
   (Länge, Format, Inhalt-Heuristiken)
→ Gibt es Fehler-Logs?

Bei Problem:
→ Klassifiziert: technisch | qualitativ | extern
→ Benachrichtigt User mit konkretem Vorschlag:
  "Der Wettbewerber-Monitor hat heute keine
   Daten geliefert. Ich vermute die Ziel-Website
   hat ihr Format geändert.
   [Automatisch reparieren]  [Mir zeigen]  [Pause]"

Bei automatischer Reparatur:
→ Toro analysiert den Fehler
→ Passt Prompt oder Parsing an
→ Testet mit letzten 3 Runs
→ Deployed wenn Test grün
→ Meldet: "Repariert — läuft wieder"
```

**Technisch:**
```typescript
// Täglich via Cron (Supabase Edge Function)
// Prüft agents Tabelle: scheduled + is_active
// Schreibt in agent_health_log (APPEND ONLY)
// Trigger: bei health_score < 70 → Notification
```

---

### Meta-Agent 2 — Quality-Optimizer

**Aufgabe:** Verbessert Agenten die schlechter werden.

```
Erkennt Qualitäts-Drift:
→ Vergleicht Outputs über Zeit
→ Erkennt wenn Ergebnisse kürzer, generischer,
  weniger präzise werden
→ Identifiziert Ursache:
  Prompt-Drift | Modell-Update | Kontext-Verlust

Bei erkanntem Drift:
→ Generiert verbesserten Prompt
→ Führt A/B-Test durch (alter vs. neuer Prompt)
→ Zeigt User Vergleich:

"Der Newsletter-Agent liefert seit 3 Wochen
 kürzere Texte als gewünscht.
 Ich habe den Prompt überarbeitet.
 Hier ist der Unterschied:"

Alt: [Beispiel-Output]
Neu: [Verbesserter Output]

[Neuen Prompt übernehmen]  [Weiter beobachten]"
```

**Technisch:**
```typescript
// Wöchentlich via Cron
// Liest agent_outputs (letzte 10 Runs)
// Berechnet Quality-Score (Länge, Struktur, Keywords)
// Sonnet für Prompt-Optimierung
// Schreibt in agent_versions (APPEND ONLY)
```

---

### Meta-Agent 3 — Opportunity-Scout

**Aufgabe:** Entdeckt neue Automatisierungsmöglichkeiten.

```
Beobachtet:
→ Welche Fragen werden im Chat oft gestellt?
→ Welche manuellen Aufgaben wiederholen sich?
→ Was machen ähnliche Orgs in der Community?
→ Welche neuen Fähigkeiten hat Toro bekommen?

Schlägt vor (max. 1x pro Woche):
"Ich habe bemerkt dass ihr jeden Freitag
 manuell Kennzahlen zusammentragt.
 Ich könnte das als automatischen
 Wochen-Report einrichten.
 Geschätzter Aufwand: 5 Minuten Setup.
 Geschätzte Zeitersparnis: 2 Stunden/Woche.

 [Jetzt einrichten]  [Später]  [Nicht relevant]"

Lernt aus Feedback:
→ Abgelehnte Vorschläge → nicht nochmal vorschlagen
→ Angenommene Vorschläge → ähnliche priorisieren
```

**Technisch:**
```typescript
// Wöchentlich via Cron
// Liest conversation_memory + usage_patterns
// Haiku für Pattern-Erkennung
// Schreibt in toro_suggestions (APPEND ONLY)
// Max. 1 aktiver Vorschlag pro Org
```

---

## Die Wachstums-Kurve

```
Tag 1:
Org hat 0 Agenten
Toro hilft beim Potenzial-Scan
→ 3 erste Agenten eingerichtet

Monat 1:
5 Agenten laufen
Health-Monitor überwacht still
→ 1 Reparatur automatisch erledigt

Monat 3:
8 Agenten
Quality-Optimizer hat 2 verbessert
Opportunity-Scout hat 1 neuen vorgeschlagen
→ User hat nie debuggt

Monat 6:
12 Agenten
Infrastruktur wächst ohne Aufwand
→ "KI läuft einfach"

Jahr 1:
15-20 Agenten
Selbst-optimierende KI-Infrastruktur
User fokussiert auf Ergebnisse, nicht auf Wartung
→ Das ist das eigentliche Produkt
```

---

## Governance — wer entscheidet was

```
Automatisch (kein User nötig):
→ Health-Check durchführen
→ Fehler klassifizieren
→ Kleine technische Reparaturen (Timeout, Parsing)
→ Quality-Score berechnen

User-Bestätigung erforderlich:
→ Prompt-Änderungen deployen
→ Neue Agenten einrichten
→ Agenten pausieren oder löschen
→ Grundlegende Konfigurationsänderungen

Org-Admin sieht alles:
→ Vollständige Audit-Trail aller Meta-Agenten-Aktionen
→ Kann automatische Aktionen einschränken
→ Kann Meta-Agenten deaktivieren
```

---

## Dashboard-Integration

```
Bestehender Dashboard-Bereich "Agenten":

┌────────────────────────────────────────────────┐
│  Agenten-Infrastruktur                         │
│  12 aktiv · 1 Warnung · 3 diese Woche verbessert│
├────────────────────────────────────────────────┤
│  OK  Wettbewerber-Monitor    Heute · 5 Updates  │
│  OK  Newsletter-Agent        Di, Do · Gut        │
│  !   Report-Generator        Seit 3 Tagen still  │
│      [Automatisch reparieren]                   │
│  OK  Meeting-Protokolle      On Demand · Gut     │
├────────────────────────────────────────────────┤
│  Toros Vorschlag dieser Woche                  │
│  "Wochen-Report automatisieren spart           │
│   ~2h/Woche — soll ich das einrichten?"        │
│  [Ja]  [Später]                               │
└────────────────────────────────────────────────┘
```

---

## DB-Schema

```sql
-- Agent Health Log (APPEND ONLY)
CREATE TABLE agent_health_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        UUID REFERENCES agents(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  health_score    INTEGER CHECK (health_score BETWEEN 0 AND 100),
  status          TEXT CHECK (status IN
                    ('healthy','degraded','failing','repaired')),
  issue_type      TEXT CHECK (issue_type IN
                    ('technical','quality','external','none')),
  issue_detail    TEXT,
  auto_repaired   BOOLEAN DEFAULT false,
  repair_detail   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Agent Versions (APPEND ONLY)
CREATE TABLE agent_versions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id        UUID REFERENCES agents(id) ON DELETE CASCADE,
  version         INTEGER NOT NULL,
  prompt_before   TEXT,
  prompt_after    TEXT,
  quality_before  INTEGER,
  quality_after   INTEGER,
  changed_by      TEXT CHECK (changed_by IN ('meta_agent','user')),
  change_reason   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Toro Suggestions (APPEND ONLY)
CREATE TABLE toro_suggestions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  suggestion_type TEXT CHECK (suggestion_type IN
                    ('new_agent','optimization','automation')),
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  estimated_hours_saved NUMERIC,
  setup_minutes   INTEGER,
  status          TEXT CHECK (status IN
                    ('pending','accepted','rejected','snoozed'))
                    DEFAULT 'pending',
  user_feedback   TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  responded_at    TIMESTAMPTZ
);
```

---

## Positionierung

```
Was KMU heute haben:
"Ich habe 10 Agenten und kümmere mich
 die ganze Zeit darum dass sie funktionieren"

Was Tropen OS verspricht:
"Deine Agenten laufen. Toro kümmert sich.
 Du siehst die Ergebnisse."

Das ist der Unterschied zwischen
einem Werkzeug und einer Infrastruktur.
```

---

## Build-Reihenfolge

```
Phase 1 — Health-Monitor (Fundament)
→ agent_health_log Migration
→ Täglicher Cron-Check
→ Benachrichtigung bei Problemen
→ Einfache automatische Reparatur (Timeout-Fix)

Phase 2 — Quality-Optimizer
→ agent_versions Migration
→ Quality-Score Berechnung
→ Prompt-Optimierung via Sonnet
→ A/B-Test Mechanismus

Phase 3 — Opportunity-Scout
→ toro_suggestions Migration
→ Pattern-Erkennung aus Chat-History
→ Dashboard-Integration
→ Feedback-Loop
```

---

## Offene Fragen

| Frage | Priorität |
|-------|-----------|
| Quality-Score: wie messen wir Qualität objektiv? | Hoch |
| Automatische Reparatur: wie weit darf Meta-Agent gehen? | Hoch |
| Kosten-Kontrolle: Meta-Agenten selbst kosten API-Calls | Mittel |
| Transparenz: User muss verstehen was Meta-Agent getan hat | Hoch |
| Rollback: wenn Meta-Agent Verschlimmerung baut | Hoch |
