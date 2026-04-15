# Komitee-Review: Fix-Engine Strategie
## Diffs anwenden vs. Prompts exportieren vs. MCP-Integration

> **Kontext:** Die Fix-Engine von Tropen OS generiert LLM-basierte Unified Diffs und wendet sie direkt auf den Code an. In der Praxis hat sich das als fragil erwiesen — Dateien wurden beschädigt, Zeilennummern stimmen nicht, der Kontext reicht nicht, neue Dateien werden halluziniert. Ein Safety-Net (tsc-Check + Backup + Rollback) wurde nachgerüstet, aber das Problem ist strukturell: LLMs sind schlecht darin, präzise Diffs zu generieren.
>
> Gleichzeitig existiert bereits ein alternativer Flow: "Aufgabe + Prompt-Export". Der User kopiert einen generierten Prompt in sein Coding-Tool (Cursor, Claude Code), das den Fix mit vollem Dateizugriff sauber umsetzt.
>
> Das Komitee soll entscheiden: welcher Ansatz ist der richtige für ein Produkt das sich als "Advisor, not Mechanic" positioniert?

---

## DREI ANSÄTZE STEHEN ZUR DISKUSSION

### ANSATZ A: DIFF-BASIERTE FIX-ENGINE (aktuell)
Flow: Finding → LLM generiert Unified Diff → Applier wendet an
- Vorteile: One-Click-Fix, sofortiges Ergebnis
- Nachteile: fragil, teuer, braucht enormen Kontext, funktioniert nur lokal (nicht für externe User)
- Content-based Matching statt Zeilennummern
- tsc-Validierung nach Patching → automatischer Rollback
- Quick Fix (Sonnet, €0.02) und Konsens-Fix (4 Modelle, €0.45)

### ANSATZ B: PROMPT-EXPORT (bereits gebaut)
Flow: Finding → Tropen OS generiert konkreten Fix-Prompt → User kopiert in Cursor/Claude Code → Re-Scan
- Vorteile: robust, funktioniert für externe User, kein Dateizugriff nötig
- Nachteile: User muss Copy-Paste machen, zwei Tools statt einem

### ANSATZ C: MCP-SERVER-INTEGRATION
Flow: Tropen OS als MCP-Server → Cursor/Claude Code verbindet sich → fragt Findings → Coding-KI fixt selbst
- Tools: get_findings(file_path), get_project_score(), get_fix_prompt(finding_id), trigger_rescan(), get_rules()
- Vorteile: nahtlose Integration, Coding-KI hat vollen Kontext UND Findings, kein Copy-Paste
- Nachteile: MCP noch Beta, User muss konfigurieren, komplexere Architektur
