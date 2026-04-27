# Tag 4 — Master-Synthese
## Tropen OS — Strategie und Bauplan nach Inventur

> **Datum:** 2026-04-27
> **Basis:** ADR-020/021/022/023 + Tag 1 (Code-Inventur + M1/M2/M3) + Tag 2 V2 (Wissens-Inventur) + Tag 3 (Produkt-Inventur)
> **Status:** Synthese — fasst die Inventur-Ergebnisse in eine umsetzbare Strategie zusammen
> **Autor-Perspektive:** Senior-Sparring, ungeschmeichelt
> **Anhänge:** A (Roadmap) · B (Migrations) · C (Kill- und Einfrier-Liste)

---

## TL;DR

Die Inventur hat drei Erkenntnisse zutage gefördert, die die Strategie schärfen:

1. **Drei Visionen koexistieren in der Codebase** — die Roadmap (Production Readiness Guide für Vibe-Coder, drei Features), die User-Story (7-Phasen-Begleiter Idee→Launch) und die Feature-Registry (KMU-Plattform mit Library-System, Workspaces, Custom Agents). **Diese Synthese erklärt die Roadmap zur normativen Quelle**, die User-Story zur Marketing-/Onboarding-Erzählung und die Feature-Registry zur Wartungs-Dokumentation. Damit ist die Strategie-Frage entschieden.

2. **~1.840 Zeilen Veredler-Substanz existieren bereits** — verteilt auf Library-Resolver, Capability-Resolver, Skill-Resolver, Complexity-Detector, Prompt-Export-Engine. Die Veredler-Implementierung (ADR-021) startet damit nicht bei 0%, sondern bei ~40%. Das verändert die Aufwand-Schätzung substanziell.

3. **41% der Zielfeatures sind NEU BAUEN, 19% gehen ins Phase-2-Eis** — das ist ehrlich, aber bedeutet ~45-60 Personen-Tage Gesamtarbeit. Wenn das in zwei Phasen (Sprints 1-3 = sichtbares MVP, Sprints 4-5 = Veredler + Distribution) geteilt wird, sind es ~25 Tage bis zum ersten produktreifen Stand.

**Drei kritische Risiken** stehen zwischen Status-Plan und Umsetzung: die Drei-Visionen-Spannung muss aktiv aufgelöst werden, die Fix-Engine muss stillgelegt werden, und drei Validierungs-Lücken (Nutzungsdaten, Vibe-Coder-Gespräche, Pricing) müssen vor Sprint 1 geschlossen sein.

---

## 1. Drei-Visionen-Auflösung

### 1.1 Was die drei Quellen erzählen

**Roadmap (`roadmap-2026-q2.md`)** beschreibt das Produkt als *Production Readiness Guide* mit drei Features (Audit + Fix-Prompt + Score-Tracking) für Solo-Gründer (€39/Monat), expliziten Kill-the-Darlings (Custom Agents, Team-Features, Echtzeit-Linting) und einer klaren Wettbewerbs-Position zwischen Vibe-Coding-Tools (Lovable, Cursor) und Quality-Tools (SonarQube, CodeRabbit).

**User-Story (`user-story-idea-to-production.md`)** beschreibt das Produkt als *Begleiter* über 7 Phasen (Idee → Scope → Recherche → Anforderungen → Architektur → Setup → Build → Launch), mit KI-gestütztem Onboarding, Library-Empfehlungen, Tech-Stack-Vorschlägen und Quality Loop nach jedem Feature.

**Feature-Registry (`feature-registry.md`)** beschreibt das technische Bestand: Library-System (Capabilities, Outcomes, Roles, Skills), Workspaces, Custom Agents, Cron-Trigger, Marketing-Paket — also eine KMU-orientierte Plattform.

### 1.2 Wo die Spannung wirklich liegt

Die drei Quellen widersprechen sich nicht so stark wie es zunächst aussieht. Genauer:

| Spannung | Charakter | Auflösung |
|----------|-----------|----------|
| Roadmap vs. Feature-Registry | **Echter Widerspruch.** Roadmap streicht explizit Custom Agents und Team-Features, die Registry beschreibt sie als aktiv. | Roadmap ist normativ. Registry wird zur reinen Wartungs-Doku des **Bestands**. |
| User-Story vs. Roadmap | **Kein Widerspruch, sondern Erweiterung.** User-Story setzt voraus, dass die drei Roadmap-Features stehen, und legt eine Nutzer-Erzählung darüber. | User-Story wird zur Marketing- und Onboarding-Erzählung. |
| Feature-Registry vs. User-Story | **Strategischer Konflikt.** Library-System ist KMU-Multi-Tenant, User-Story ist Solo-Begleiter. | Library-Substanz wird **transformiert**: Schemas und Resolver werden Veredler-Vorform, UI wird Solo-Onboarding. |

### 1.3 Die drei Rollen — verbindlich

| Dokument | Neue Rolle | Konsequenz |
|----------|-----------|------------|
| `roadmap-2026-q2.md` | **Normative Strategie-Quelle** | Was wir bauen, wann wir es bauen, was wir nicht bauen. Bei Konflikt: Roadmap gewinnt. |
| `user-story-idea-to-production.md` | **Marketing- und Onboarding-Narrativ** | Wie wir das Produkt erklären. Wird zur Vorlage für Landing-Pages, Onboarding-Texte, Verkaufs-Material. |
| `feature-registry.md` | **Wartungs-Doku des technischen Bestands** | Was *ist*, nicht was sein soll. Wird umbenannt in `feature-bestand.md`, mit Status-Marker pro Feature (LIVE / EINGEFROREN / ABGELÖST). |

**Operative Konsequenz:**
- ARCHITECT.md muss als Pflicht-Lektüre aktualisiert werden: ADR-020/021/022/023 und Roadmap als normative Quellen
- CLAUDE.md muss Library-Beschreibung als "in Transformation zur Veredler-Vorform" umetikettieren
- Ein neuer ADR-024 oder eigenes Strategie-Doc ("strategy.md") fasst diese Drei-Rollen-Aufteilung zusammen — sonst entsteht der nächste Drift in zwei Monaten wieder

---

## 2. Die fünf Empfehlungs-Kategorien

Über alle Inventur-Schichten hinweg (DB-Tabellen aus Tag 1 + M2 + M3, Routes/Komponenten aus Tag 1, Code-Module aus M1, Features aus Tag 3, Dokumente aus Tag 2 V2) gilt eine einheitliche Klassifizierung:

| # | Kategorie | Bedeutung | Aktion |
|---|-----------|-----------|--------|
| 1 | **BEHALTEN** | Passt zur Roadmap-Vision, kein Umbau nötig | Nichts tun, polieren wenn Zeit |
| 2 | **UMBAU** | Substanz wertvoll, aber Re-Framing oder Refactoring nötig | In Sprint einplanen, Aufwand schätzen |
| 3 | **EINFRIEREN** | KMU-Substanz, gehört nicht ins MVP, soll aber für Phase 2 erhalten bleiben | Mit Feature-Flag deaktivieren oder UI verbergen, Code im Repo lassen |
| 4 | **AUS** | Passt weder ins MVP noch in Phase 2 | Code entfernen, DB-Migration für Tabellen-Drop |
| 5 | **NEU BAUEN** | Existiert nicht, muss aber existieren | Spezifikation, Architektur-Review, dann Build |

**Wichtiger Zusatz aus M2 — die sechste Kategorie ist eigentlich "TRANSFORMATION":**

Library-Substanz fällt nicht in eine der fünf Kategorien sauber rein. Sie ist nicht BEHALTEN (UI ist irrelevant), nicht UMBAU (Funktion ändert sich grundlegend), nicht EINFRIEREN (wird aktiv genutzt für Veredler), nicht AUS (zu wertvoll), nicht NEU BAUEN (existiert ja). Sie wird **transformiert**: Schemas bleiben, Resolver-Code wandert in den Veredler.

Diese sechste Kategorie ist explizit zu benennen, sonst wird die Library zwischen BEHALTEN und AUS hin- und hergeschoben, ohne dass jemand sie tatsächlich macht.

### 2.1 Verteilung über die Inventur-Ebenen

| Ebene | BEHALTEN | UMBAU | EINFRIEREN | AUS | NEU BAUEN | TRANSFORMATION |
|-------|---------|-------|-----------|-----|----------|----------------|
| DB-Tabellen (76) | 30 (39%) | 19 (25%) | 14 (18%) | 10 (13%) | 3 (4%) | 0 (Library-Tabellen sind unter UMBAU subsumiert) |
| API-Routes (192) | ~120 (62%) | ~30 (16%) | ~25 (13%) | ~10 (5%) | ~7 (4%) | (n/a) |
| Komponenten (109) | ~50 (46%) | ~20 (18%) | ~15 (14%) | ~5 (5%) | ~19 (17%) | (n/a) |
| Code-Module (~135) | ~80 (59%) | ~25 (19%) | ~10 (7%) | ~10 (7%) | ~10 (7%) | ~6 (Library-Resolver, Complexity-Detector) |
| Features (58) | 13 (22%) | 6 (10%) | 11 (19%) | 4 (7%) | 24 (41%) | (n/a — auf Code-Ebene erfasst) |
| Dokumente (185) | 92 (50%) | 14 (8%) AKTUALISIEREN | 0 | 18 (10%) SUPERSEDED | 0 | 61 (33%) ARCHIVIEREN |

**Was fällt auf:**

- Auf **DB- und Code-Ebene** ist UMBAU mit ~20% der größte Anpassungs-Block. Das ist Substanz, die transformiert wird, nicht weggeworfen.
- Auf **Feature-Ebene** ist NEU BAUEN mit 41% der größte Block — was bedeutet: die User-sichtbare Vision ist substanziell neu, auch wenn das technische Fundament steht.
- **EINFRIEREN ist auf Feature-Ebene 19%** — also fast jedes fünfte Feature. Das ist der KMU-Sandsack, der nicht weggeworfen wird.
- **Dokumenten-Ebene** verhält sich anders, weil dort SUPERSEDED und ARCHIVIEREN dominieren. Die Hygiene-Aufgabe ist klar (~80 Dokumente), aber sie ist nicht inhaltlicher Umbau, sondern Aufräumen.

---

## 3. Phase-2-Backup-Konzept

Beim Archivieren der Architektur-Trilogie (`tropen-os-architektur.md` + `product/architecture.md` + `product/architecture-navigation.md`) und beim Einfrieren der KMU-Features besteht das Risiko, dass die KMU-Substanz **unsichtbar** wird. In drei Monaten weiß niemand mehr, *was* eingefroren wurde und *warum*.

### 3.1 Drei Mechanismen zur Erhaltung

**Mechanismus 1: Phase-2-Vision-Doc**

Ein neues Dokument `docs/phase-2-vision.md` extrahiert die KMU-Substanz aus den drei zu archivierenden Architektur-Dokumenten in konzentrierter Form:

- Department-Hierarchie als Konzept
- Workspace-Karten-Board-Metapher
- Custom-Agent-Trigger-System
- Library-Capabilities-Outcomes-Roles-Skills-Modell
- Marketing-Paket als Beispiel-Use-Case

Maximal 5 Seiten. Keine Build-Anweisungen, nur **das was wir wissen, dass es wertvoll ist und wieder relevant werden kann**, wenn das Solo-Produkt zum KMU-Produkt wächst.

**Mechanismus 2: Feature-Status-Marker**

In `feature-bestand.md` (umbenannt aus `feature-registry.md`) bekommt jedes EINFRIEREN-Feature einen expliziten Marker:

```
**Status:** EINGEFROREN seit 2026-04-27
**Wieder-Anschalten-Bedingung:** [konkrete Bedingung — siehe Anhang C]
**Code-Standort:** [bleibt im Repo, aber feature-flag-deaktiviert]
**Phase-2-Bezug:** docs/phase-2-vision.md Sektion X
```

Damit ist immer auffindbar, was warum eingefroren ist und wann es wieder relevant wird.

**Mechanismus 3: Archiv-Ordner mit Index**

Die archivierten Dokumente landen in `docs/_archive/2026-04-pre-pivot/` mit einem Index-File, das pro archiviertes Dokument einen Satz erklärt: *"Beschreibt KMU-Vision von März 2026, abgelöst durch ADR-020. Inhalt teilweise erhalten in `docs/phase-2-vision.md`."*

Damit ist Code-Forensik in 6 Monaten möglich, falls jemand wissen will, warum eine bestimmte Tabelle existiert.

### 3.2 Aufwand und Verantwortung

- Phase-2-Vision-Doc: **2-3 Stunden** (Extrahieren aus drei Quell-Dokumenten)
- Feature-Status-Marker: **30 Minuten** (mechanisch in feature-bestand.md ergänzen)
- Archiv-Ordner-Index: **30 Minuten**

Gesamt: **3-4 Stunden Hygiene-Arbeit**, vor Sprint 1 abgeschlossen.

---

## 4. Risiko-Register

### 4.1 Strategische Risiken (vor Sprint 1 zu adressieren)

| # | Risiko | Wahrscheinlichkeit | Schaden | Mitigation |
|---|--------|--------------------|---------|----------|
| **R1** | Drei-Visionen-Spannung erzeugt Drift | Hoch | Zwei Monate verlorene Arbeit, Wiederholung der Inventur | Drei-Rollen-Aufteilung in CLAUDE.md + ARCHITECT.md verankern, Aktualisierung **vor Sprint 1** |
| **R2** | Fix-Engine richtet weiteren Schaden an | Mittel (hat schon einmal File-Damage angerichtet) | Datenverlust, Vertrauensverlust | Fix-Engine sofort mit Feature-Flag deaktivieren, in Sprint 4 transformieren oder entfernen |
| **R3** | Veredler-Substanz wird im Library-Wegfall mit weggeworfen | Mittel | ~1.840 Zeilen Re-Implementierung nötig | Library auf TRANSFORMATION-Status setzen, Resolver-Code als Veredler-Vorform markieren |
| **R4** | Multi-Modell-Review erzeugt unkontrollierte Kosten | Mittel | Operative Verluste pro Solo-User | Kostenmodell vor Sprint 4 entscheiden — ist das Premium-Phase-3-Feature oder MVP-Bestandteil? |
| **R5** | Fehlende Validierung der Roadmap-Annahmen | Hoch | Falsche Sprint-1-Priorisierung | Drei Vibe-Coder-Gespräche und Pricing-Validation parallel zu Sprint 1, keine Investition in Sprint 2-Features ohne Bestätigung |

### 4.2 Operative Risiken (in der Umsetzung)

| # | Risiko | Mitigation |
|---|--------|----------|
| **R6** | `ai-chat/index.ts` (924 Zeilen) wird bei Veredler-Integration unwartbar | Aufspaltung **vor** Veredler-Integration in Sprint 3 oder Sprint-3-Vorlauf |
| **R7** | `useWorkspaceState.ts` (450 Zeilen) blockiert UI-Refactoring | Aufspaltung in 3 Sub-Hooks (Chat, Artefakte, Layout) in Sprint 1 oder Sprint 2 |
| **R8** | Migrations-Cluster M3 erzeugt RLS-Lücken | Jede Migration hat RLS in der gleichen Datei, nicht später nachgereicht (Standard aus engineering-standard.md) |
| **R9** | APPEND-ONLY-Tabellen verhindern saubere Migration | Bei DUP-Migrations: alte Tabellen bleiben liegen, neue Daten in Ziel-Tabellen schreiben — kein "leeren und neu befüllen" |
| **R10** | 41% NEU BAUEN unterschätzt — Sprint 4 (Veredler) blockiert sich selbst, weil Sprint 1-3 nicht fertig sind | Sprint 1-3 müssen **vollständig sichtbar abgeschlossen** sein, bevor Sprint 4 startet. Kein Parallel-Arbeiten |

### 4.3 Drei offene Validierungs-Lücken

Diese drei Punkte sind **vor Sprint 1** zu klären, sind aber nicht in dieser Sitzung lösbar:

**L1 — Quantitative Nutzungsdaten**
Tag 3 hat "Nutzung: hoch/mittel/niedrig" geschätzt. Eine SQL-Query auf `usage_logs` und `messages` für die letzten 30 Tage würde zeigen, welche Features tatsächlich genutzt werden. Erkenntnis ist auch dann wertvoll, wenn die Schätzungen sich bestätigen — sie sind dann gehärtet.

> **Empfehlung:** Vor Sprint 1, ~30 Minuten SQL-Arbeit. Konkrete Queries für: aktive Konversationen pro Konversations-Typ, Workspace-Aktivität, Card-Erstellungen, Audit-Run-Häufigkeit, Fix-Prompt-Exporte.

**L2 — Vibe-Coder-Gespräche**
Die Roadmap-Vision wurde laut Memory durch 5 Komitee-Reviews validiert (Modell-Reviews), nicht durch echte Solo-Gründer. Drei strukturierte Gespräche mit echten Vibe-Codern aus IH/Reddit/Lovable-Discord würden viele Annahmen härten oder kippen.

> **Empfehlung:** Parallel zu Sprint 1. Drei Gespräche à 30 Minuten. Gesprächsleitfaden in einem separaten Dokument vorbereitet. Erkenntnisse fließen in Sprint 2 ein.

**L3 — Pricing-Validation**
€39/Monat für Gründer ist eine plausible Zahl, aber unvalidiert. Beim Vibe-Coder-Gespräch sollte das mitlaufen.

> **Empfehlung:** Teil von L2. Konkrete Frage: *"Würdest du €39/Monat zahlen für ein Tool, das dir sagt, ob deine Lovable-App production-ready ist? Welcher Zahlungsbereitschaft entspricht das, im Vergleich zu Cursor (€20) oder Linear (€10/User)?"*

---

## 5. Bottom Line — was Tag 4 entscheidet

Die Inventur ist abgeschlossen. Die Strategie ist:

1. **Roadmap-2026-Q2 ist normativ.** Production Readiness Guide für Vibe-Coder mit drei Features. Alles andere ist EINFRIEREN oder AUS.

2. **User-Story wird Marketing-Vehikel.** 7-Phasen-Erzählung als Onboarding und Verkaufs-Material, nicht als Build-Spec.

3. **Feature-Registry wird zur Bestands-Doku.** Umbenannt zu `feature-bestand.md`, jedes Feature mit Status-Marker.

4. **Library wird transformiert, nicht weggeworfen.** Resolver-Code wird Veredler-Kern, UI wird Solo-Onboarding.

5. **Fix-Engine wird stillgelegt.** Mit Feature-Flag, bis Veredler steht.

6. **Phase-2-Backup wird systematisiert.** Phase-2-Vision-Doc + Status-Marker + Archiv-Index.

7. **Drei Validierungs-Lücken werden vor Sprint 1 geschlossen.** L1 (Daten) heute oder morgen, L2/L3 parallel zu Sprint 1.

**Was Tag 4 nicht entscheidet:**
- Die Sprint-Inhalte selbst — siehe Anhang A
- Die Migrations-Reihenfolge — siehe Anhang B
- Die Kill- und Einfrier-Liste im Detail — siehe Anhang C

**Reihenfolge der Anhänge:** Anhang C zuerst lesen (kürzeste, klärt Kill und Einfrier), dann Anhang A (Roadmap, leitet Sprints ab), dann Anhang B (Migrations, operativer Block für Claude Code).

---

## 6. Was bedeutet "fertig"?

Das Master-Dokument ist fertig, wenn folgende Bedingungen erfüllt sind:

- [ ] CLAUDE.md aktualisiert mit Drei-Rollen-Aufteilung (Roadmap normativ, User-Story Marketing, Feature-Registry Bestand)
- [ ] ARCHITECT.md aktualisiert mit ADR-020/021/022/023 als Pflicht-Lektüre
- [ ] `docs/phase-2-vision.md` erstellt
- [ ] `feature-bestand.md` (umbenannt) mit Status-Markern pro Feature
- [ ] `docs/_archive/2026-04-pre-pivot/` erstellt mit Index
- [ ] Fix-Engine mit Feature-Flag deaktiviert
- [ ] L1-Daten erhoben, Tag 3 mit echten Nutzungs-Zahlen aktualisiert
- [ ] L2-Gespräche terminiert (Outreach gestartet)
- [ ] Pricing-Validation in L2-Leitfaden integriert

Das ist die **Tag-4.5-Phase** — Hygiene und Vorbereitung — bevor Sprint 1 startet.

Erst danach: Sprint 1 (siehe Anhang A).
