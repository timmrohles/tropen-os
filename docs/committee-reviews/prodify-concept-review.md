# Committee Review: prodify-concept

> Generiert am 2026-04-18 · Reviewer: Claude Sonnet, GPT-4o, Gemini 2.5 Pro, Grok 4 · Judge: Claude Opus

---

# Konsens-Report: Prodify-Grobkonzept Bewertung

## 1. Produkt-Reframing
**Konsens-Level:** MEHRHEIT  
**Kern-Finding:** Drei von vier Modellen sehen die Verschiebung zum "projektzentrischen Begleiter" kritisch, da sie "zu vage klingt und schwerer verkaufbar ist" (Claude). Der Scanner als konkretes Feature bietet einen greifbareren Einstiegspunkt für kaufzögernde Vibe-Coder.  
**Empfehlung:** Scanner als Hauptversprechen beibehalten, "Begleiter mit Gedächtnis" als Erweiterung positionieren — **Priorität: sofort**

## 2a. Artefakt-Auswahl
**Konsens-Level:** EINIG  
**Kern-Finding:** Alle Modelle bemängeln das Fehlen eines "Next Actions"-Dokuments. Claude kritisiert: "Projekt-Memory ist zu abstrakt für V1, Vibe-Coder wollen sofortige Coding-Hilfe." GPT-4o fordert explizit "Ein Nächste-Schritte-Dokument als Must-Have".  
**Empfehlung:** NEXT.md oder ähnliches Action-orientiertes Dokument als Kernbestandteil hinzufügen — **Priorität: sofort**

## 2b. Charta vs. Architektur-Rahmen
**Konsens-Level:** EINIG  
**Kern-Finding:** Alle Modelle lehnen die Trennung ab. Claude nennt es "Consultant-Denke, nicht Builder-Denke", Grok sieht "Redundanz und Verwirrung". Der Konsens: Ein einziges, klar strukturiertes Dokument reicht völlig aus.  
**Empfehlung:** Zu einem PROJECT.md oder "Projekt-Rahmen" verschmelzen — **Priorität: sofort**

## 3. Kanonisch/Export-Trennung
**Konsens-Level:** MEHRHEIT  
**Kern-Finding:** Drei Modelle stimmen dem Ansatz grundsätzlich zu, warnen aber vor Umsetzungsrisiken. Claude: "wenn die tool-spezifischen Exporte schlecht sind, wirkt das Ganze akademisch." GPT-4o sieht "unnötige Komplexität" für Solo-Gründer.  
**Empfehlung:** Konzept beibehalten, aber mit einem Tool (Cursor) perfektionieren — **Priorität: bald**

## 4. Frage-Kette und Adaptivität
**Konsens-Level:** EINIG  
**Kern-Finding:** Alle Modelle sehen die Muss/Soll/Kann-Logik kritisch. Claude: "Vibe-Coder haben oft gar keine Meinung zu 'Soll'-Fragen — sie wollen einfach, dass es funktioniert." Mehrere fordern einen "Quick Start"-Modus für minimalen Einstieg.  
**Empfehlung:** Zwei Modi einführen: "Schnellstart" (5-10 Fragen) und "Deep Setup" — **Priorität: sofort**

## 5. Einstiegs-Türen
**Konsens-Level:** EINIG  
**Kern-Finding:** Alle Modelle lehnen drei Türen in V1 ab. Claude sieht "Feature-Creep, der die Entwicklung verlangsamt", Grok warnt vor "unpolished Experience". Konsens: Fokus auf Tür 1 (Repo existiert) als häufigster Fall.  
**Empfehlung:** Nur Tür 1 für V1 implementieren — **Priorität: sofort**

## 6. Abgrenzung zu Coding-Tools
**Konsens-Level:** MEHRHEIT  
**Kern-Finding:** Drei Modelle sehen das Risiko als real aber beherrschbar. Claude sieht "12-18 Monate Zeitvorsprung" als ausreichend, Grok empfiehlt "proprietären Meta-Prompt-Generator als Kern". GPT-4o warnt vor leichter Replizierbarkeit.  
**Empfehlung:** Tiefe Spezialisierung auf EU-Compliance und Struktur-Qualität — **Priorität: bald**

## 7. Was übersehen wird
**Konsens-Level:** MEHRHEIT  
**Kern-Finding:** Claude kritisiert: "Du denkst zu sehr in Dokumenten, zu wenig in Workflows." Grok warnt vor "Nutzer-Abhängigkeit" als Crutch. Der Konsens: Mehr Action-Orientierung und konkrete Integrations-Hilfen sind nötig.  
**Empfehlung:** Jedes Dokument mit CLI-Commands und Copy-Paste-Snippets anreichern — **Priorität: sofort**

## 7b. Geschäftsmodell
**Konsens-Level:** EINIG  
**Kern-Finding:** Alle Modelle lehnen klassisches Abo ab. Claude: "Abo scheitert bei kaufzögerlichen Solo-Buildern", Grok sieht "hohe Churn". Konsens für Freemium oder Pay-per-Project.  
**Empfehlung:** Freemium-Modell mit Projekt-Limits statt Zeit-Limits — **Priorität: bald**

## 8. Der nächste Bau-Schritt
**Konsens-Level:** MEHRHEIT  
**Kern-Finding:** Drei Modelle fordern einen Mini-Prototyp mit Fokus auf Qualität. Claude: "Repo-URL eingeben → PROJECT.md + .cursorrules generieren → mit 5 Cursor-Nutzern testen." Konsens: Schnell etwas Testbares bauen.  
**Empfehlung:** Web-App mit Tür 1 und einem perfekten Artefakt-Export — **Priorität: sofort**

## Nächste Schritte

### Die drei wichtigsten Änderungen (priorisiert):
1. **V1 radikal vereinfachen:** Nur Tür 1 (existierendes Repo), verschmolzene Dokumente, NEXT.md als Kernfeature
2. **Scanner-Fokus beibehalten:** Nicht zu abstrakt werden — konkreter Nutzen vor philosophischem Begleiter-Konzept  
3. **Action-Orientierung:** Weniger Meta-Dokumente, mehr Copy-Paste-Ready Outputs und CLI-Commands

### Der konkrete erste Bau-Schritt:
**Mini-Prototyp in 4 Wochen:** Web-Interface → Repo-URL eingeben → perfekte .cursorrules + PROJECT.md mit konkreten nächsten Schritten generieren → mit 5 echten Cursor-Nutzern validieren

### Die größte offene Streitfrage:
**Kanonisch/Export-Trennung:** Während die Mehrheit zustimmt, warnt GPT-4o vor unnötiger Komplexität für Solo-Gründer. Die Spannung zwischen eleganter Architektur und pragmatischer Direktheit bleibt ungelöst — erst reale Nutzertests werden zeigen, ob die Abstraktion gerechtfertigt ist.

---

## Kosten

| Modell           | In-Tok  | Out-Tok | Kosten   |
|------------------|---------|---------|----------|
| Claude Sonnet    |    2407 |    1589 | €0.0289 |
| GPT-4o           |    1652 |    1062 | €0.0137 |
| Gemini 2.5 Pro   |    1756 |    2044 | €0.0211 |
| Grok 4           |    2476 |    2307 | €0.0391 |
| Judge (Opus)     |    6274 |    1887 | €0.2191 |
| **Gesamt**       |         |         | **€0.3219** |
