# Toro als Potenzial-Entdecker — Konzept v1.0
## "Was könnte KI für mich tun?"

> **Status:** Konzept März 2026
> **Kernthese:** KMU wissen nicht was sie automatisieren könnten.
>               Toro zeigt es ihnen — aktiv, konkret, branchenspezifisch.
> **Gilt für:** Onboarding, Dashboard, proaktive Hinweise, Community

---

## Das eigentliche Problem

KMU scheitern nicht an der Technik.
Sie scheitern an der Orientierungslosigkeit.

```
"Was kann KI für mich tun?"
"Wo fange ich an?"
"Lohnt sich das überhaupt für uns?"
```

Das sind die Fragen die niemand beantwortet.
Nicht ChatGPT, nicht Copilot, nicht andere Tools.
Sie geben Fähigkeiten — aber keine Orientierung.

Tropen OS gibt Orientierung.
Toro ist nicht nur Werkzeug — er ist Berater.

---

## Die Umkehrung

```
Bisheriges Modell:
User kommt mit Problem → Toro löst es
→ setzt voraus dass User weiß was er will

Neues Modell:
Toro kommt mit Möglichkeiten → User erkennt sein Problem
→ User muss nicht wissen was möglich ist
```

Das ist der fundamentale Unterschied zwischen
einem Chatbot und einem KI-Betriebssystem.

---

## Drei Bausteine

### Baustein 1 — KI-Potenzial-Scan (Onboarding)

Beim ersten Login — nach den technischen Onboarding-Schritten —
führt Toro ein strukturiertes Erstgespräch:

```
Toro: "Bevor wir starten — lass mich verstehen
       wie euer Alltag aussieht.
       Was macht ihr, und wo verliert ihr
       am meisten Zeit?"

→ 5-7 gezielte Fragen (als Gespräch, nie als Formular)
→ Branche, Teamgröße, wiederkehrende Aufgaben,
  manuelle Prozesse, größte Zeitfresser

Ergebnis nach 10 Minuten:

"Basierend auf dem was du mir erzählt hast,
 sehe ich 5 konkrete Möglichkeiten für euch:"

┌────────────────────────────────────────────────────┐
│ Hoher Impact, geringer Aufwand                     │
│                                                    │
│ 1. Wöchentliche Berichte automatisieren            │
│    "Ihr erstellt jeden Montag manuell Reports —    │
│     das kann Toro übernehmen"                      │
│    → [Jetzt ausprobieren]                          │
│                                                    │
│ 2. Kundenanfragen vorqualifizieren                 │
│    "Erste Antworten auf Standard-Anfragen          │
│     in unter 2 Minuten statt 2 Stunden"            │
│    → [Jetzt ausprobieren]                          │
├────────────────────────────────────────────────────┤
│ Mittlerer Impact, mittlerer Aufwand                │
│                                                    │
│ 3. Wettbewerber beobachten                         │
│ 4. Newsletter automatisch erstellen                │
│ 5. Meeting-Protokolle strukturieren                │
└────────────────────────────────────────────────────┘
```

Jede Möglichkeit ist:
- Konkret (nicht "KI kann Texte schreiben")
- Branchenspezifisch ("wie andere Agenturen in eurer Größe")
- Direkt ausprobierbar (ein Klick startet den ersten Chat)

**Technisch:**
- Sonnet führt das Gespräch
- Ergebnis wird als `org_potential_scan` gespeichert
- Scan kann jederzeit wiederholt werden
- Neue Möglichkeiten erscheinen wenn Toro die Org besser kennt

---

### Baustein 2 — Automatisierungs-Bibliothek

Keine abstrakten Fähigkeiten — konkrete Vorlagen aus der Praxis.

```
/library → Tab "Für meine Branche"

Filterbar nach:
→ Branche (Marketing, HR, Vertrieb, Recht, Bau...)
→ Teamgröße (1-10, 10-50, 50-200)
→ Zeitaufwand (täglich, wöchentlich, monatlich)
→ Komplexität (sofort, mit Setup, mit Integration)

Jede Vorlage zeigt:
→ Was wird automatisiert?
→ Wie viel Zeit spart das pro Woche?
→ Was brauche ich dafür?
→ [Für meine Org übernehmen]
```

**Peer-Vergleich als stärksten Motivator:**
```
"47 Marketingagenturen nutzen diese Vorlage"
"Durchschnittliche Zeitersparnis: 3 Stunden/Woche"
```

Nicht Funktionen verkaufen — Ergebnisse zeigen.

**Technisch:**
- Erweitert das bestehende Skills/Rollen-System
- `scope='public'` + `category='template'` + Branchen-Tags
- Community-Effekt: Org teilt was funktioniert
- Nutzungsstatistiken anonym aggregiert

---

### Baustein 3 — Toro beobachtet und schlägt vor

Nach 2 Wochen Nutzung erkennt Toro Muster:

```
Toro (im Dashboard oder als Chat-Einstieg):

"Ich habe in den letzten 2 Wochen ein Muster gesehen:
 Jeden Montag erstellt jemand aus eurem Team
 manuell einen Wochen-Report.
 Das könnte ich automatisch übernehmen.

 Soll ich einen Vorschlag machen?"

[Ja, zeig mir wie]  [Nein danke]  [Erinner mich später]
```

Weitere Erkennungs-Muster:
```
→ Gleiche Frage wird oft gestellt
  "Ihr fragt mich wöchentlich nach Wettbewerber-Updates —
   soll ich das als automatischen Feed einrichten?"

→ Zeitaufwändige manuelle Aufgaben
  "Ihr tippt oft lange Briefe/E-Mails —
   soll ich Vorlagen erstellen?"

→ Daten die regelmäßig gebraucht werden
  "Ihr fragt oft nach denselben Kennzahlen —
   soll ich ein Dashboard erstellen das ich
   täglich aktualisiere?"
```

**Technisch:**
- Pattern-Erkennung aus `project_memory` + Chat-Verlauf
- Haiku analysiert wöchentlich (fire-and-forget)
- Vorschläge landen in `toro_suggestions` Tabelle
- User sieht max. 1 Vorschlag pro Woche (nicht nervig)
- Feedback wird gespeichert — Toro lernt was angenommen wird

---

## Das Dashboard als Potenzial-Cockpit

Das bestehende Dashboard wird umgebaut:

```
Nicht: "Hier sind deine letzten Chats und Kosten"

Sondern: "Hier ist was ihr mit Toro erreicht habt
          und was noch möglich wäre"

┌─────────────────────────────────────────────────┐
│  Diese Woche mit Toro                           │
│  4,5 Stunden gespart · 12 Aufgaben erledigt     │
│  3 neue Möglichkeiten entdeckt                  │
├─────────────────────────────────────────────────┤
│  Noch nicht genutzt — könnte euch helfen        │
│                                                 │
│  Wettbewerber-Monitor         [Ausprobieren]    │
│  Newsletter-Automatisierung   [Ausprobieren]    │
│  Meeting-Protokolle           [Ausprobieren]    │
├─────────────────────────────────────────────────┤
│  Toros Beobachtung der Woche                    │
│  "Ich habe bemerkt dass ihr oft nach            │
│   Pricing-Fragen sucht — soll ich ein           │
│   Pricing-Dashboard erstellen?"                 │
│  [Ja]  [Nicht jetzt]                           │
└─────────────────────────────────────────────────┘
```

---

## Warum das differenzierend ist

```
ChatGPT / Copilot:    Werkzeug — antwortet auf Fragen
Langdock / Dify:      Plattform — gibt Zugang zu Modellen
Tropen OS:            Berater — zeigt was möglich ist
                      und hilft es umzusetzen
```

Der Vergleich der zählt:
```
Nicht: "Was kann unser KI-Tool?"
Sondern: "Was hat euer Unternehmen mit KI erreicht?"
```

Das ist eine andere Konversation — mit dem CFO,
mit dem Geschäftsführer, mit dem Team.

---

## Positionierung nach außen

```
Tagline (intern, zur Orientierung):
"Tropen OS zeigt dir was KI für dein Unternehmen
 tun kann — und macht es dann einfach."

Nicht:
"KI-Assistent für Teams"  ← zu generisch
"Automatisierung für KMU" ← zu technisch

Sondern:
"Dein KI-Berater der mitdenkt"
```

---

## Build-Reihenfolge

```
Phase 1 — Potenzial-Scan im Onboarding
→ Erstgespräch nach Onboarding-Step 5
→ Ergebnis als priorisierte Liste
→ Direkt ausprobierbar per Klick
→ Klein aber hoher Ersteindruck-Wert

Phase 2 — Automatisierungs-Bibliothek
→ /library Tab "Für meine Branche"
→ Branchen-Tags auf Skills/Rollen
→ Nutzungsstatistiken
→ Community-Sharing

Phase 3 — Toro beobachtet
→ Pattern-Erkennung (wöchentlich, Haiku)
→ toro_suggestions Tabelle
→ 1 Vorschlag pro Woche max.
→ Dashboard als Potenzial-Cockpit
```

---

## Offene Fragen

| Frage | Priorität |
|-------|-----------|
| Branchen-Taxonomie: welche Branchen zuerst? | Hoch |
| Zeitersparnis-Berechnung: wie messen wir das? | Mittel |
| Pattern-Erkennung: wie viele Chats braucht Toro minimum? | Mittel |
| Datenschutz: anonyme Aggregation über Orgs hinweg | Hoch |
| Onboarding-Länge: Potenzial-Scan darf nicht nerven | Mittel |
