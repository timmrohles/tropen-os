# Committee Review: Batch Fix Strategy

## Kontext

Wir bauen einen Production Readiness Guide für Vibe-Coders.
Das Produkt scannt Quellcode, findet Probleme (aktuell 300+
Findings pro Scan), und generiert Fix-Prompts die der User
in sein Coding-Tool (Cursor/Claude Code) kopiert.

Aktuell: Ein Fix-Prompt pro Finding. User kopiert einzeln.

## Das User-Verhalten

User sehen eine lange Liste von Findings und wollen:
"Gib mir alles auf einmal, ich paste es in meine KI
und die soll alles durchgehen."

Das ist menschlich nachvollziehbar — aber potenziell
gefährlich für die Fix-Qualität.

## Die drei Kernprobleme

### Problem 1: Nicht alle Findings sind Code-Fixes

Unsere 25 Audit-Kategorien erzeugen Findings die in
fundamental verschiedene Kategorien fallen:

A) CODE-FIXES (Cursor/Claude Code kann das lösen):
   - Security Header fehlt → Code ändern
   - supabaseAdmin im Client → Code umstrukturieren
   - console.log in Produktion → Code entfernen
   - Fehlende Input-Validierung → Code ergänzen

B) CODE-GENERIERUNG (KI kann helfen, braucht aber Kontext):
   - Datenschutzseite fehlt → Seite generieren
   - Cookie-Consent fehlt → Komponente bauen
   - Barrierefreiheitserklärung fehlt → Seite generieren
   - Tests fehlen → Tests schreiben

C) REFACTORING (KI kann helfen, aber riskant im Batch):
   - "Datei zu lang" × 70 → Dateien aufteilen
   - Business-Logik in UI-Komponenten → Umstrukturieren
   - Fehlende Abstraktionsschicht → Architektur-Änderung

D) NICHT-CODE (KI kann nicht helfen):
   - AVV mit Drittanbietern fehlt → Vertrag abschließen
   - Backup-Strategie nicht dokumentiert → Runbook schreiben
   - PITR nicht verifiziert → im Supabase Dashboard prüfen
   - Budget-Alerts konfigurieren → im Cloud-Dashboard machen

E) INFRASTRUKTUR (teilweise KI, teilweise Dashboard):
   - SPF/DKIM/DMARC fehlt → DNS-Einträge setzen
   - Rate Limiting fehlt → Code + Config
   - CI/CD Pipeline fehlt → GitHub Actions schreiben

### Problem 2: Gleiche Findings × N Dateien

Typische Scan-Ergebnisse:
- "Datei zu lang (>500 Zeilen)" × 70 Dateien
- "Stack trace in API response" × 82 Dateien
- "Missing validateBody()" × 15 Dateien

Ein Batch-Prompt mit 70× "teile diese Datei auf" überfordert
jedes LLM. Aber die zentrale Lösung ("erstelle eine
handleApiError() Funktion und importiere sie überall")
ist ein einmaliger Fix + Migration.

### Problem 3: Batch-Fixing Qualität

Annahme: Ein strukturierter Batch-Prompt der sagt
"arbeite Liste von oben nach unten ab, ein Fix pro Schritt"
funktioniert besser als ein unstrukturierter Dump.

Aber: Ist das validiert? Oder erzeugt ein 50-Finding-Prompt
trotzdem Chaos ab Finding 10?

## Constraints

- Positionierung: "Advisor not Mechanic" — wir fixen nicht, wir beraten
- Wir kontrollieren nicht was das empfangende Tool mit dem Prompt macht
- Prompt-Qualität ist unser Differenziator — schlechte Batch-Prompts zerstören Vertrauen
- Solo-Founder-Team: Aufwand muss realistisch sein

## Fragen an das Committee

### 1. Kategorisierung: Brauchen wir Finding-Typen?

Sollen wir Findings explizit kategorisieren in:
- Code-Fix (KI kann direkt lösen)
- Code-Generierung (KI braucht mehr Kontext)
- Refactoring (KI kann helfen, aber schrittweise)
- Nicht-Code (menschliche Aktion nötig)
- Infrastruktur (Mix aus Code und Config)

Und dann den Export nur für Code-Fix und Code-Generierung
anbieten? Oder verwirrt das den User?

### 2. Batch vs. Sequential: Was funktioniert besser?

Option A: Ein großer Batch-Prompt mit allen Code-Findings,
strukturiert als Checkliste mit "eins nach dem anderen"

Option B: Automatisch gruppierte Mini-Batches
(z.B. "alle Security-Findings" als ein Prompt,
"alle DSGVO-Findings" als ein anderer)

Option C: Immer einzelne Prompts, aber mit einem
"Nächster Fix"-Flow der den User durchführt

Option D: Dem User die Wahl lassen (Einzeln / Gruppiert / Alles)

### 3. Gleiche Findings × N Dateien: Wie exportieren?

Wenn 82 Dateien dasselbe Problem haben:
- Einen Prompt mit der zentralen Lösung + Liste aller Dateien?
- Einen Prompt für die zentrale Lösung + einzelne Prompts pro Datei?
- Nur die zentrale Lösung, der Rest ergibt sich?

### 4. Nicht-Code-Findings: Wie damit umgehen im Export?

Wenn der User "Alles exportieren" klickt, was passiert
mit Findings wie "AVV fehlt" oder "Backup-Strategie prüfen"?

- Gar nicht exportieren (nur Code-Findings)?
- Als separate "Manuelle Aufgaben"-Liste exportieren?
- Im Prompt als "NICHT AUTOMATISCH LÖSBAR — manuell erledigen" markieren?

### 5. Qualitätsrisiko: Ist Batch-Fixing überhaupt empfehlenswert?

Sollen wir Batch-Fixing aktiv empfehlen oder eher davon
abraten? Wenn ein User 50 Findings auf einmal in Cursor
gibt und das Ergebnis ist Chaos — ist das unser Reputationsrisiko?

Sollen wir ein Limit setzen (z.B. max. 10 Findings pro Export)?

### 6. UX: Wie sieht der Export-Flow aus?

Aktuell: Pro Finding ein Copy-Button.
Gewünscht: "Exportiere alles" oder "Exportiere Gruppe".

Wie gestalten wir das so dass der User Kontrolle hat
aber nicht überfordert wird?
