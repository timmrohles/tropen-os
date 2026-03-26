# ADR-003: Library-System — Rolle, Capability, Skill, Outcome als vier eigenständige Entitäten

**Datum:** 2026-03-19 (Migrations 052–056, library-resolver.ts)
**Status:** Entschieden

---

## Kontext

Tropen OS setzt KI-Modelle (Anthropic Claude) für verschiedene Aufgaben ein: Projekt-Chat, Workspace-Briefing, Feed-Analyse, Agenten-Ausführung. Bisher war das Modell-Routing implizit im Code verdrahtet.

**Problem:** Mit wachsender Funktionalität entstanden inkonsistente System-Prompts, keine Wiederverwendbarkeit von Expertisen, kein strukturiertes Routing zu Fähigkeiten.

**Frage:** Wie modellieren wir "was Toro kann" und "wer Toro ist" auf eine Weise, die konfigurierbar, erweiterbar und für Org-Admins steuerbar ist?

**Alternativen evaluiert:**
- Option A: Monolithisches "Agent"-Konzept (zu rigid, mischte Fachexpertise mit Modell-Routing)
- Option B: Capabilities übernehmen alles (überlädt eine Entität mit zu vielen Verantwortlichkeiten)
- Option C (gewählt): Vier eigenständige Entitäten mit klarer Separation of Concerns

---

## Entscheidung

Vier eigenständige Entitäten, alle resolviert in `src/lib/library-resolver.ts`:

| Entität | Frage | Verwaltet von |
|---------|-------|--------------|
| **Capabilities** | WAS kann Toro? (Modell, Tools, Input-Typen) | Superadmin only |
| **Outcomes** | WAS kommt raus? (Output-Format, Karten-Typ) | Superadmin only |
| **Roles** | WER ist Toro? (Fachexpertise, System-Prompt) | Org-Admin + Member |
| **Skills** | WIE arbeitet Toro? (Schritt-für-Schritt-Anweisungen) | Org-Admin + Member |

**System-Prompt-Baulogik (Reihenfolge):**
1. `role.system_prompt` — Fachexpertise, Persönlichkeit
2. `skill.instructions` + Skill-Kontext — Schritt-für-Schritt
3. `capability.system_prompt_injection` — Modell-spezifische Anweisungen
4. `outcome.system_prompt_injection` — Output-Format-Anweisungen

**Scope-Hierarchie:** `system` → `package` → `org` → `user` → `public`

**Bewusste Nicht-Verbindung:** Skills und Capabilities haben keine FK-Verbindung. Skills empfehlen `recommended_capability_type` als String — kein FK. Dies verhindert Kopplungs-Chaos bei zukünftigen Schema-Änderungen.

**Migration-Pfad:** Bestehende `package_agents` (5 Marketing-Agenten) wurden als `scope='package'` Rollen migriert — keine Datenverluste.

---

## Konsequenzen

**Positiv:**
- Model-Agnostik: Rollen/Skills funktionieren mit jedem Modell — Capability entscheidet das Routing
- Org-Governance: Admins konfigurieren Rollen/Skills, Superadmin kontrolliert Capabilities — klare Verantwortlichkeiten
- Community-Erweiterbarkeit: `scope='public'` als opt-in für geteilte Rollen/Skills
- Saubere Architektur: `library-resolver.ts` (267 Zeilen) als einziger Einstiegspunkt vor jedem LLM-Call

**Negativ / Risiken:**
- Vier Entitäten erhöhen kognitive Komplexität für neue Entwickler
- System-Prompt-Baulogik muss konsistent in allen Chat-Endpoints genutzt werden — Risiko bei neuem Feature
- `package_agents`-Tabelle bleibt erhalten (Backward-Compat) — muss kommuniziert werden, dass sie nicht mehr befüllt wird
- Fix-Migration 054 nötig gewesen: `roles_insert` RLS Policy erlaubte kein `scope='public'` für Org-Admins (bereits behoben)

**Regel für alle neuen Features:** Vor jedem LLM-Call muss `POST /api/library/resolve` aufgerufen werden — nie direkt hardcodierte System-Prompts in Route-Handlern.
