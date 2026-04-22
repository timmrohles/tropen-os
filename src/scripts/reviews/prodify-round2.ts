import type { CommitteeReviewConfig } from '../committee-review'

export const config: CommitteeReviewConfig = {
  name: 'prodify-round2',
  contextFiles: [],

  systemPrompt: `Du bist Teil eines mehrköpfigen LLM-Komitees, das ein Produkt-Konzept und technische Architektur-Entscheidungen bewertet. Das Komitee hat Runde 1 bereits durchgeführt — ihr kennt den Kontext.

Antworte strukturiert, kritisch — keine höfliche Zustimmung.

Pro Punkt:
- **Urteil:** stimmig / Vorbehalt / ablehnen
- **Kernkritik** in zwei Sätzen
- **Gegenvorschlag** wenn vorhanden

Für Punkt 1 (Sicherheit): Priorisierte Liste der Angriffsvektoren mit Schutzmaßnahme und V1-vs-V2-Einordnung. Nicht als Essay — als kompakte Liste.

Am Ende: eine einzige **Gesamt-Empfehlung** in drei Sätzen: Was ist die wichtigste Entscheidung, die jetzt getroffen werden muss, bevor der Prototyp gebaut wird?`,

  userPrompt: `# Komitee-Review Runde 2 — Prodify

## Kontext (kurz, weil das Komitee Runde 1 kennt)

Ich habe euer Feedback aus Runde 1 weitgehend übernommen: Charta und Architektur-Rahmen zu PROJECT.md verschmolzen, NEXT.md als viertes Artefakt hinzugefügt, in V1 nur Tür 1 (Repo existiert), Schnellstart-Modus mit 5-10 Muss-Fragen, konkrete Snippets und Commands in den Artefakten.

Die Begleiter-Positionierung halte ich entgegen eurer Mehrheit fest — Scanner bleibt der Einstiegs-Aha, aber die Substanz des Produkts ist das Projekt-Gedächtnis mit laufender Artefakt-Pflege. Begründung: Ein reiner Scanner ist in 12-18 Monaten von Cursor selbst eingebaut. Ein Begleiter mit Gedächtnis nicht.

## Was seit Runde 1 neu ist

Technische Analyse des bestehenden Scan-Flows hat zwei strukturelle Dinge aufgedeckt:

**Erstens, zweistufige Scan-Coverage.** Der Browser-basierte Scan (File System Access API → JSON → Vercel) erreicht nur 55% der 179 Regeln. Die fehlenden 45% konzentrieren sich auf die compliance- und qualitätskritischsten Kategorien (Testing 86% Lücke, Datenbank 67%, DSGVO 50%, Backup/DR 67%). Vollständige Abdeckung nur über CLI oder GitHub-App.

**Zweitens, der Scan-Flow ist heute nicht gegen Angriffe fremder User-Inhalte gehärtet.** Vibe-Coder laden Repos hoch; diese Inhalte werden im RAM analysiert und an LLMs weitergereicht. Mögliche Angriffsvektoren: Prompt-Injection über Code-Kommentare, Exfiltration von Systemprompts oder anderen User-Daten, pathologische Datei-Strukturen, die Parser brechen, speziell geformte Payloads gegen Vercel-Functions.

## Was wir entschieden haben, bevor ihr seht

**Tiers nicht als Paywall.** Light Scan (Browser) und Deep Scan (GitHub-App) werden als unterschiedliche Gründlichkeitsstufen offen kommuniziert, nicht als Trial/Pro-Trennung. Monetarisierung soll über Projekt-Gedächtnis und Begleitungsdauer laufen, nicht über Regel-Coverage. Argument: Ein halber Scan als Trial-Einstieg zerstört das Vertrauen, bevor der Nutzer den eigentlichen Produktwert erlebt.

**GitHub-App ist V1-Thema, nicht V2.** Ohne sie ist die Tür-1-Pipeline, die ihr empfohlen habt, systematisch unvollständig.

---

## Vier Themen zur Bewertung

### 1. Sicherheit des LLM-basierten Scans fremder Repos

Das ist der Hauptpunkt dieser Runde. Konkret:

Was sind die Mindeststandards, die ein Produkt erfüllen muss, das fremde Repos entgegennimmt, deren Inhalte an LLMs weiterreicht und Analysen produziert? Welche Angriffsvektoren übersehe ich typischerweise? Wie gehen etablierte Anbieter (Snyk, Semgrep, GitHub Advanced Security, Socket.dev) mit diesen Risiken um — was ist übertragbar, was ist übertrieben für unseren Scope?

Konkret zu bewerten:

- Prompt-Injection über Code-Inhalte (Kommentare, Strings, README)
- Exfiltration über manipulierte Eingaben, die LLM-Antworten verlängern oder Kontext leaken
- Payload-Angriffe gegen Scan-Pipeline (Zip-Bomben-Äquivalente, pathologische JSON-Strukturen, Datei-Namen, die Parser brechen)
- Long-Term-State-Risiken (wenn Scan-Ergebnisse persistent sind, könnte ein User-Scan andere Projekte kompromittieren?)

Für jeden Vektor: Was ist angemessene Schutzmaßnahme für V1, was kann bis V2 warten?

### 2. Scan-Architektur-Empfehlung

Zweistufig Light + Deep, oder gibt es elegantere Architekturen? Drei Alternativen zur Prüfung:

- GitHub-App als einziger Standard, Browser-Route nur als "Demo für 3 Minuten, bevor du verbindest"
- Multi-Source-Scan: Browser für sofortige Erst-Einsicht, GitHub-App parallel als Tiefen-Scan nach Verbindung, Ergebnisse werden zusammengeführt
- Ein Tier, aber dafür deutlich eingeschränkte Kategorien-Menge — wir sagen ehrlich "wir decken nur 17 von 25 Kategorien ab" statt "55% der Regeln in allen 25"

Was ist tragfähiger für Solo-Vibe-Coder? Und wie kommunizieren wir Scan-Gründlichkeit ohne Vertrauensverlust?

### 3. GitHub-App als V1-Scope

Ist die Entwicklung einer produktionsreifen GitHub-App (OAuth, Webhook-Handling, Repo-Clone-Worker, Scan-Orchestrierung, Ergebnisse in Supabase) in 4-8 Wochen parallel zur Artefakt-Pipeline machbar — realistisch, nicht optimistisch?

Wenn nein: Was ist die kleinste sinnvolle Erst-Version der GitHub-App für V1? Nur Lesezugriff ohne Webhooks? Nur für einzelne Scans, nicht für kontinuierliche Begleitung? Welche Schnitte machen Sinn?

### 4. Was übersehen wir diesmal

Jedes Modell bitte wieder eine Kritik, die nicht durch die obigen Fragen abgedeckt ist. Diesmal gern mit Blick auf: Was zwischen Runde 1 und Runde 2 in der technischen Konkretisierung verloren gegangen sein könnte? Gibt es Spannungen zwischen dem V1-Konzept aus Runde 1 und den neuen technischen Realitäten?`,

  judgePrompt: `Vier Modelle haben die Runde-2-Fragen zu Prodify unabhängig bewertet.

Destilliere den Konsens in einen strukturierten Abschlussbericht.

Für jeden der 4 Punkte:
- **Konsens-Level:** EINIG | MEHRHEIT | GESPALTEN
- Kern-Finding in 2–3 Sätzen (mit konkreten Zitaten aus den Reviews wenn möglich)
- Empfehlung mit Priorität: sofort / bald / später

Für Punkt 1 (Sicherheit) zusätzlich: Zusammengefasste priorisierte Angriffsvektoren-Liste mit V1/V2-Einordnung aus dem Konsens der Modelle.

Abschluss:
1. Die wichtigste Entscheidung, die jetzt getroffen werden muss, bevor der Prototyp gebaut wird (aus Konsens)
2. Die größte offene Streitfrage (wo Modelle am meisten gespalten waren)
3. Was die Modelle an der Analyse des Fragestellenden am meisten loben oder kritisieren`,
}
