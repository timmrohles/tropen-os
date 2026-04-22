# Committee Review: prodify-round2

> Generiert am 2026-04-20 · Reviewer: Claude Sonnet, GPT-4o, Gemini 2.5 Pro, Grok 4 · Judge: Claude Opus

---

# Komitee-Abschlussbericht: Prodify Runde 2

## 1. Sicherheit des LLM-basierten Scans fremder Repos

**Konsens-Level:** EINIG

**Kern-Finding:** Alle Modelle sehen erhebliche Sicherheitsrisiken, die in der bisherigen Analyse unterschätzt wurden. Claude warnt: "ihr behandelt fremde Repos wie vertrauenswürdige Inputs" - ein fundamentaler Fehler. Die Angriffsfläche ist komplex und erfordert mehrschichtige Schutzmaßnahmen von Anfang an.

**Empfehlung:** **Sofort** - Sicherheitsarchitektur muss vor Prototyp-Bau festgelegt werden

### Priorisierte Angriffsvektoren (Konsens):

1. **Prompt-Injection via Code-Content**
   - V1: Input-Sanitization, Comment-Stripping, Template-basierte Antworten
   - V2: ML-basierte Injection-Erkennung, fortgeschrittene Content-Filter

2. **Resource-Exhaustion (Zip-Bomben, massive Files)**
   - V1: File-Size-Limits (10MB einzeln, 100MB gesamt), Timeouts
   - V2: Adaptive Limits basierend auf Repo-Typ

3. **Parser-Exploits / Payload-Angriffe**
   - V1: Sandboxed Parsing, Whitelisting für File-Extensions, JSON-Schema-Checks
   - V2: Separate Parser-Microservices, Deep-Payload-Inspection

4. **Cross-User-Contamination / Exfiltration**
   - V1: Strikte Session-Isolation, keine persistenten Cross-References
   - V2: Vollständige Multi-Tenancy mit verschlüsselter Persistierung

## 2. Scan-Architektur-Empfehlung

**Konsens-Level:** GESPALTEN

**Kern-Finding:** Die Modelle sind uneins über die optimale Architektur. Claude und GPT-4o befürworten Multi-Source mit besserer Kommunikation ("Instant Analysis" statt "Light"), während Grok für GitHub-App als einzigen Standard mit Browser als Demo plädiert. Gemini warnt vor "unvollständiger Scan-Coverage im Browser-Modus".

**Empfehlung:** **Sofort** - Architekturentscheidung blockiert weitere Entwicklung

## 3. GitHub-App als V1-Scope

**Konsens-Level:** EINIG (Ablehnung)

**Kern-Finding:** Alle Modelle halten 4-8 Wochen für eine produktionsreife GitHub-App für "illusorisch" (Claude) bzw. "unrealistisch" (Grok). GPT-4o nennt es "sehr ambitioniert". OAuth allein braucht 1-2 Wochen, Webhook-Orchestrierung weitere 2-3 Wochen.

**Empfehlung:** **Sofort** - V1-Scope ohne vollständige GitHub-App neu definieren

## 4. Was übersehen wir diesmal

**Konsens-Level:** MEHRHEIT

**Kern-Finding:** Claude und Grok sehen einen fundamentalen Konflikt zwischen Begleiter-Positionierung und Sicherheitsanforderungen. Claude: "persistente Projekt-Gedächtnisse erhöhen die Angriffsfläche exponentiell". Grok warnt, dass der Fokus auf GitHub-App "die Artefakt-Pflege als Kern überschattet".

**Empfehlung:** **Sofort** - Kernpositionierung klären

## Nächste Schritte

### 1. Die wichtigste Entscheidung (Konsens):

**Stateless Scanner vs. Persistent Companion für V1** - Diese fundamentale Architekturentscheidung muss sofort getroffen werden. Claude fasst es treffend zusammen: "beides parallel ist sicherheitstechnisch unverantwortlich und entwicklungstechnisch nicht machbar".

### 2. Die größte offene Streitfrage:

**Browser-Scan Positionierung** - Soll der Browser-Scan als gleichwertige Option (mit transparenter Kommunikation über Einschränkungen) oder nur als Demo-Teaser für die GitHub-App positioniert werden?

### 3. Kritik an der Analyse:

**Lob:** Die Modelle anerkennen die klare Begleiter-Vision und die durchdachten technischen Überlegungen.

**Kritik:** Die Analyse unterschätzt massiv die Komplexität der Sicherheitsanforderungen und überschätzt die Machbarkeit des V1-Scopes. Grok kritisiert den Verlust des "schnellen V1-Einstiegs" aus Runde 1 zugunsten komplexer technischer Features.

---

## Kosten

| Modell           | In-Tok  | Out-Tok | Kosten   |
|------------------|---------|---------|----------|
| Claude Sonnet    |    1950 |    1339 | €0.0241 |
| GPT-4o           |    1363 |     848 | €0.0111 |
| Gemini 2.5 Pro   |    1430 |    2044 | €0.0207 |
| Grok 4           |    2163 |    1645 | €0.0290 |
| Judge (Opus)     |    4776 |    1258 | €0.1544 |
| **Gesamt**       |         |         | **€0.2392** |
