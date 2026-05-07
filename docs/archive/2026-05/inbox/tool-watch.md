# Tool-Watch
> Tools, die wir gesehen haben und parken — nicht jetzt, vielleicht später.

---

## Stash Memory (entdeckt 2026-04-27)

**Was es ist:** Open source, self-hosted Memory-Layer für AI-Agenten.
Postgres + pgvector + 8-Stage-Consolidation-Pipeline + MCP-Server.

**Warum interessant:**
- Memory-Layer ist Phase-2-Thema (Pfeiler 5: Wissens-Hierarchie)
- MCP-nativ → passt zu ADR-023 (Interface-Strategie)
- Stack-kompatibel (Postgres + pgvector haben wir schon)

**Warum jetzt nicht:**
- Memory ist nicht in den drei MVP-Features (Audit, Fix-Prompt, Score)
- Self-hosted-Anforderung kollidiert mit Vercel-Setup (Hetzner-Migration ist post-MVP)
- Multi-Tenancy nicht eingebaut — würde substanzielle Arbeit erfordern
- L2-Validierung übersprungen → User-Bedarf nicht bestätigt

**Trigger zum Wieder-Anschauen:**
- L2-Gespräche zeigen Cross-Project-Memory-Bedarf
- Phase-2-KMU-Aktivierung
- Hetzner-Migration abgeschlossen

**Quelle:** github.com/alash3al/stash
