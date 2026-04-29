# ADR-014: Smart Model Router — Multi-Provider mit Kundenhoheit und Kostenoptimierung

**Datum:** 2026-03-20
**Status:** Vorgeschlagen
**Deciders:** Timm (Founder), System-Architekt

---

## Kontext

Tropen OS nutzt aktuell zwei LLM-Provider (Anthropic, OpenAI) mit festem Modell-Routing:

| Aufgabe | Modell | Provider |
|---------|--------|----------|
| Projekt-Chat, Workspace-Chat, Transformationen | `claude-sonnet-4-20250514` | Anthropic |
| Context-Zusammenfassung, Feed Stage 2 | `claude-haiku-4-5-20251001` | Anthropic |
| Feed Stage 3 (Deep Analysis) | `claude-sonnet-4-20250514` | Anthropic |
| Router-Default (QA/Legacy) | `gpt-4o-mini` | OpenAI |

**Bestehender Code:**
- `src/lib/llm/router.ts` — traceable Routing-Funktion, aktuell hardcoded auf `gpt-4o-mini`
- `src/lib/llm/anthropic.ts` — Anthropic Provider via AI SDK
- `src/lib/llm/openai.ts` — OpenAI mit Lazy-Init
- `src/lib/qa/task-classifier.ts` — regelbasierter Classifier (code/translation/summary/vision/chat)
- Kommentar im Code: "Phase 2 des Routers: Modell-Auswahl basierend auf taskType + Qualitäts-Metriken"

**Probleme:**
1. **Vendor Lock-in** — 95% der Calls gehen an Anthropic. Ausfall oder Preiserhöhung trifft das gesamte Produkt.
2. **Keine Kostenoptimierung** — ein simpler Chat ("Wie spät ist es?") bekommt dasselbe Sonnet-Modell wie eine komplexe Analyse.
3. **Keine Kundenhoheit** — Org-Admins können nicht steuern, welche Modelle/Provider erlaubt sind.
4. **EU-Compliance** — DSGVO-sensible Kunden wollen garantieren, dass Daten nur von EU-gehosteten Modellen verarbeitet werden.
5. **Open-Source-Nachfrage** — Einige Kunden bevorzugen Open-Source-Modelle aus Transparenz- und Audit-Gründen.

**Strategischer Kontext:**
- Manifest-Prinzip 4: "Dependencies must be Replaceable"
- Systemische Lektion 2: "Org-Governance ist das eigentliche Produkt für KMU"
- ADR-003: Library-System trennt bereits Capabilities (WAS) von Roles (WER) — Modell-Routing gehört zur Capability-Schicht

---

## Entscheidung

**Stufenweiser Ausbau des Smart Model Routers** in drei Phasen, mit Kundenhoheit als Kernfeature.

### Phase 1: Multi-Provider Foundation (sofort)

Drei zusätzliche Provider einbinden, festes Routing nach Task-Typ:

| Provider | Modelle | Hosting | Open Source |
|----------|---------|---------|-------------|
| Anthropic (bestehend) | Sonnet 4, Haiku 4.5 | US/EU | Nein |
| OpenAI (bestehend) | GPT-4o, GPT-4o-mini | US/EU | Nein |
| Mistral AI (neu) | Mistral Large, Mistral Small | EU (Paris) | Teilweise |
| Together.ai / Fireworks (neu) | Llama 3.1 70B, Mixtral 8x22B | US (EU möglich) | Ja |

**Org-Settings erweitern:**
```sql
ALTER TABLE departments ADD COLUMN allowed_providers TEXT[] DEFAULT '{"anthropic"}';
ALTER TABLE departments ADD COLUMN allowed_regions TEXT[] DEFAULT '{"us","eu"}';
ALTER TABLE departments ADD COLUMN model_cost_limit_eur DECIMAL(10,2) DEFAULT NULL;
ALTER TABLE departments ADD COLUMN prefer_open_source BOOLEAN DEFAULT FALSE;
```

**Router-Logik:**
1. Task-Classifier bestimmt Komplexität (simple/medium/complex)
2. Org-Settings filtern erlaubte Provider und Regionen
3. Aus dem gefilterten Pool wird das günstigste passende Modell gewählt

### Phase 2: Dynamisches Quality-Routing (nach 4–6 Wochen)

- Quality-Scores pro Modell+Task-Kombination erfassen (User-Feedback, automatische Metriken)
- Router berücksichtigt: `(Qualität ≥ Schwellwert) → günstigstes Modell`
- Neue Tabelle `model_quality_metrics` für Scoring
- A/B-Testing-Fähigkeit: 10% der Requests an alternatives Modell routen

### Phase 3: Selbstoptimierender Router (nach 3+ Monaten)

- Automatische Schwellwert-Anpassung basierend auf aggregierten Quality-Scores
- Kosten-Dashboard für Org-Admins (Modell-Mix, Kosten pro Feature, Trends)
- Community-geteilte Router-Profile ("EU-Only Optimiert", "Budget-Modus")

---

## Optionen evaluiert

### Option A: Anthropic-Only beibehalten

| Dimension | Bewertung |
|-----------|-----------|
| Komplexität | Niedrig — kein Umbau nötig |
| Kosten | Hoch — kein Optimierungspotenzial |
| Skalierbarkeit | Begrenzt — Single Point of Failure |
| Kundenhoheit | Keine — kein Verkaufsargument für EU/OS-Kunden |
| Time-to-Market | Sofort — nichts zu tun |

**Pro:** Einfachheit, konsistente Prompt-Qualität, weniger Testing-Aufwand.
**Contra:** Vendor Lock-in, kein EU-Compliance-Argument, keine Kostenoptimierung, Marktpositionierung geschwächt.

### Option B: Multi-Provider mit festem Routing

| Dimension | Bewertung |
|-----------|-----------|
| Komplexität | Mittel — Provider-Abstraktion + Prompt-Varianten |
| Kosten | Mittel — Einsparung durch günstigere Modelle für einfache Tasks |
| Skalierbarkeit | Gut — Failover möglich |
| Kundenhoheit | Gut — Admin wählt erlaubte Provider |
| Time-to-Market | 2–3 Wochen |

**Pro:** Kundenwahlfreiheit, EU-Modelle als Verkaufsargument, überschaubare Komplexität.
**Contra:** Prompt-Qualität variiert zwischen Modellen, kein dynamisches Optimieren.

### Option C: Dynamischer Smart Router (Vollausbau)

| Dimension | Bewertung |
|-----------|-----------|
| Komplexität | Hoch — Quality-Monitoring, A/B-Testing, Scoring-Pipeline |
| Kosten | Optimal — jeder Request bekommt das günstigste ausreichende Modell |
| Skalierbarkeit | Exzellent — automatisches Failover + Load-Balancing |
| Kundenhoheit | Maximal — Provider, Region, Budget, Open-Source-Präferenz |
| Time-to-Market | 8–12 Wochen |

**Pro:** Maximale Kostenersparnis, starkes Differenzierungsmerkmal, selbstoptimierend.
**Contra:** Hohe initiale Komplexität, Quality-Monitoring muss zuverlässig sein, schwerer zu debuggen.

### Option D: Stufenweise (gewählt)

| Dimension | Bewertung |
|-----------|-----------|
| Komplexität | Steigt kontrolliert (Niedrig → Mittel → Hoch) |
| Kosten | Steigend optimiert mit jeder Phase |
| Skalierbarkeit | Gut ab Phase 1, exzellent ab Phase 2 |
| Kundenhoheit | Gut ab Phase 1, maximal ab Phase 2 |
| Time-to-Market | Phase 1 in 2–3 Wochen, dann iterativ |

**Pro:** Schneller erster Marktvorteil, Komplexität wächst kontrolliert, jede Phase liefert Wert.
**Contra:** Erfordert Disziplin, nicht sofort den vollen Router zu bauen.

---

## Trade-off-Analyse

### 1. Qualitätskonsistenz vs. Kostenersparnis

Verschiedene Modelle antworten unterschiedlich auf denselben Prompt. Mistral Large ist nahe an Sonnet, aber nicht identisch. Haiku und Mistral Small sparen ~90% gegenüber Sonnet, machen aber bei nuancierten Aufgaben mehr Fehler.

**Mitigation:** Task-Classifier bestimmt Mindest-Qualitätsstufe. Nur Tasks der Klasse "simple" (kurze Zusammenfassungen, Formatierung, Klassifikation) werden an günstige Modelle geroutet. Alles mit "complex" (Analyse, Coding, Strategie) bleibt bei Premium-Modellen.

### 2. Prompt-Engineering-Aufwand vs. Provider-Vielfalt

Jeder neue Provider erfordert Prompt-Anpassungen. Claude versteht XML-Tags besser, Mistral bevorzugt Markdown, Llama hat andere System-Prompt-Konventionen.

**Mitigation:** Prompt-Templates pro Provider-Familie in `src/lib/llm/prompts/`. Das AI SDK abstrahiert bereits den API-Layer — die Prompt-Transformation ist der einzige Provider-spezifische Code.

### 3. EU-Hosting vs. Modell-Qualität

EU-gehostete Modelle (Mistral) sind aktuell etwas schwächer als US-gehostete Top-Modelle (Claude Sonnet, GPT-4o). Kunden, die EU-Only wählen, bekommen möglicherweise niedrigere Qualität.

**Mitigation:** Transparentes Labeling im Admin-Panel: "EU-Only: Mistral Large (95% Sonnet-Qualität)" vs. "Global: Bestes verfügbares Modell". Der Kunde entscheidet bewusst.

### 4. Open Source vs. Managed API

Open-Source-Modelle (Llama, Mixtral) über Together.ai/Fireworks sind günstig, aber Verfügbarkeit und Latenz sind weniger vorhersagbar als Anthropic/OpenAI.

**Mitigation:** Open-Source als Opt-in, nie als Default. Automatischer Fallback auf Managed-Provider wenn Latenz > 5s oder Fehlerrate > 2%.

---

## Architektur-Änderungen

### Neue Dateien

| Datei | Inhalt |
|-------|--------|
| `src/lib/llm/providers/mistral.ts` | Mistral AI SDK Provider |
| `src/lib/llm/providers/together.ts` | Together.ai Provider (Llama, Mixtral) |
| `src/lib/llm/model-registry.ts` | Registry aller verfügbaren Modelle mit Metadaten (Kosten, Region, Capabilities) |
| `src/lib/llm/org-model-filter.ts` | Filtert Modelle basierend auf Org-Settings |
| `src/lib/llm/prompts/` | Prompt-Templates pro Provider-Familie |

### Geänderte Dateien

| Datei | Änderung |
|-------|----------|
| `src/lib/llm/router.ts` | `selectModel()` nutzt Model-Registry + Org-Filter statt Hardcoded |
| `src/lib/qa/task-classifier.ts` | Komplexitäts-Score (1–5) statt nur TaskType |
| `src/lib/llm/anthropic.ts` | Unverändert — bleibt primärer Provider |
| `src/lib/llm/openai.ts` | Unverändert — wird Fallback-Provider |

### Model-Registry Konzept

```typescript
// src/lib/llm/model-registry.ts
export interface ModelEntry {
  id: string                      // z.B. 'claude-sonnet-4-20250514'
  provider: 'anthropic' | 'openai' | 'mistral' | 'together'
  displayName: string             // z.B. 'Claude Sonnet 4'
  region: ('us' | 'eu')[]        // Hosting-Regionen
  isOpenSource: boolean
  costPer1kInput: number          // EUR
  costPer1kOutput: number         // EUR
  qualityTier: 'premium' | 'standard' | 'budget'
  maxContextTokens: number
  supportedTasks: TaskType[]      // aus task-classifier
  minComplexityScore: number      // Mindest-Komplexität für dieses Modell
}
```

### Erweiterter Router-Flow

```
Request eingehend
  → getAuthUser() + Org-Settings laden
  → Task-Classifier: TaskType + ComplexityScore (1–5)
  → Model-Registry filtern:
      1. allowed_providers (Org-Setting)
      2. allowed_regions (Org-Setting)
      3. prefer_open_source (Org-Setting)
      4. minComplexityScore ≤ ComplexityScore
  → Aus gefiltertem Pool: günstigstes Modell wählen
  → Fallback: wenn Pool leer → nächstbester Provider aus Default-Liste
  → LLM-Call via AI SDK (Provider-agnostisch)
  → Kosten + Qualität loggen (für Phase 2)
```

---

## Kostenprojektion (10.000 Nutzer)

Annahme: 50 Requests/Nutzer/Monat, Durchschnitt 1.500 Input + 500 Output Tokens pro Request.

### Ohne Smart Router (Status Quo)

| Modell | Anteil | Kosten/Monat (geschätzt) |
|--------|--------|--------------------------|
| Sonnet 4 | 70% | ~4.200 EUR |
| Haiku 4.5 | 30% | ~180 EUR |
| **Gesamt** | | **~4.380 EUR** |

### Mit Smart Router (Phase 1)

| Modell | Anteil | Kosten/Monat (geschätzt) |
|--------|--------|--------------------------|
| Sonnet 4 (complex) | 30% | ~1.800 EUR |
| Haiku 4.5 (medium) | 25% | ~150 EUR |
| Mistral Small (simple) | 35% | ~105 EUR |
| Mistral Large (complex, EU) | 10% | ~300 EUR |
| **Gesamt** | | **~2.355 EUR** |

**Einsparung: ~46% (~2.025 EUR/Monat)**

---

## Konsequenzen

**Positiv:**
- Kundenhoheit über Provider, Region und Budget — starkes KMU-Verkaufsargument
- EU-Compliance als Feature, nicht als Einschränkung
- Signifikante Kostensenkung bei steigender Nutzerzahl
- Kein Single Point of Failure mehr — automatischer Failover
- Passt nahtlos in ADR-003: Capabilities steuern das Modell, Roles/Skills bleiben Provider-agnostisch

**Negativ / Risiken:**
- Prompt-Qualität muss pro Provider getestet werden — erhöhter QA-Aufwand
- Model-Registry muss bei jedem neuen Modell-Release aktualisiert werden
- Org-Admins brauchen verständliches UI für Provider-Auswahl — kein technisches Dropdown
- Debugging wird komplexer: "Welches Modell hat diese Antwort generiert?"
- Latenz-Unterschiede zwischen Providern können UX beeinflussen

**Revisit-Trigger:**
- Wenn ein Provider 30%+ Marktanteil bei unseren Kunden erreicht → Mengenrabatt verhandeln
- Wenn Quality-Scores zeigen, dass Budget-Modelle zu oft versagen → Schwellwerte anpassen
- Wenn EU-Anbieter eigene Top-Modelle launchen → Model-Registry erweitern

---

## Action Items

1. [ ] **Phase 1a:** `model-registry.ts` anlegen mit allen Modell-Metadaten
2. [ ] **Phase 1b:** Org-Settings um `allowed_providers`, `allowed_regions`, `model_cost_limit_eur`, `prefer_open_source` erweitern (Migration)
3. [ ] **Phase 1c:** Mistral Provider via AI SDK einbinden (`@ai-sdk/mistral`)
4. [ ] **Phase 1d:** `router.ts` → `selectModel()` auf Registry + Org-Filter umbauen
5. [ ] **Phase 1e:** Task-Classifier um Complexity-Score (1–5) erweitern
6. [ ] **Phase 1f:** Admin-UI für Provider-Auswahl im Department-Settings-Panel
7. [ ] **Phase 1g:** Fallback-Logik testen (Anthropic-Ausfall → Mistral/OpenAI)
8. [ ] **Phase 2:** Quality-Monitoring + `model_quality_metrics` Tabelle
9. [ ] **Phase 3:** Kosten-Dashboard für Org-Admins
