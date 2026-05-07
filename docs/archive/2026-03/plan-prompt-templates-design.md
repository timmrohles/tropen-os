# Prompt-Bibliothek (Vorlagen) — Design

**Datum:** 2026-03-08
**Phase:** 2 (Core-Vorlagen)
**Status:** Approved

---

## Ziel

User können die 5 Standard-Aufgaben als geführten Dialog starten. Ein Drawer unter dem Input-Feld stellt 2–4 gezielte Fragen, baut daraus einen optimalen Prompt und übergibt ihn ans Input-Feld. Der User lernt unbewusst gutes Prompting — ohne es zu wissen.

## Architektur

Drei neue Dateien, keine bestehenden Komponenten gebrochen:

```
src/
  lib/
    prompt-templates.ts       ← Template-Definitionen + assemble()
  components/workspace/
    TemplateDrawer.tsx        ← Drawer-Komponente
    EmptyState.tsx            ← Pill onClick → Drawer statt Prefix-Text
```

Phase 2 ist vollständig clientseitig. Kein DB-Zugriff, kein API-Call.

---

## UI & Interaktion

**Pill-Klick** → aktive Pill wird highlighted (`.chip--active`), Drawer öffnet sich per Slide-down (~200ms) direkt unter dem Input-Feld. Pills und Footer-Text werden nach unten verschoben.

**Drawer-Layout:**
```
┌─────────────────────────────────────────────┐
│ [Input-Feld]                                │
└─────────────────────────────────────────────┘
┌─────────────────────────────────────────────┐
│ ✍ Schreib mir etwas                [✕]     │
│                                             │
│ Was?        [________________________]      │
│ Für wen?    [________________________]      │
│ Ton         [Formell ▾]                     │
│ Länge       [Mittel ▾]          optional   │
│                                             │
│ Vorschau: "Schreibe einen Blogartikel…"     │
│                                             │
│               [Prompt übernehmen →]         │
└─────────────────────────────────────────────┘
[Pill 1] [Pill 2] [Pill 3] [Pill 4] [Pill 5]
```

**Ablauf:**
1. Pill klicken → Drawer öffnet, zugehörige Vorlage geladen
2. User füllt Felder aus — Prompt-Vorschau aktualisiert sich live
3. Optionale Felder grau markiert, überspringbar
4. "Prompt übernehmen →" → Drawer schließt, Prompt im Input-Feld
5. User kann Prompt anpassen, dann normal absenden
6. [✕] schließt Drawer ohne Übernahme
7. Andere Pill klicken → Drawer wechselt sofort zur neuen Vorlage

---

## Datenstruktur (hardcoded, Phase 2)

```ts
type FieldDef = {
  id: string
  label: string
  type: 'text' | 'textarea' | 'select'
  options?: string[]
  placeholder?: string
  optional?: boolean
}

type Template = {
  id: 'chat' | 'research' | 'create' | 'summarize' | 'extract'
  label: string
  fields: FieldDef[]
  assemble: (values: Record<string, string>) => string
}
```

---

## Die 5 Core-Vorlagen

### 1. Ich habe eine Frage (`chat`)
**Felder:**
- `frage` — text — "Was möchtest du wissen?"
- `tiefe` — select — Kurz & knapp / Ausführlich mit Erklärung / Mit konkreten Beispielen

**Prompt:** `Beantworte folgende Frage {tiefe_mapped}: {frage}`

---

### 2. Erkläre mir ein Thema (`research`)
**Felder:**
- `thema` — text — "Was soll erklärt werden?"
- `vorwissen` — select — Ich weiß noch nichts darüber / Ich kenne die Grundlagen / Ich bin bereits fortgeschritten
- `zweck` — select — Zum Lernen / Für eine Präsentation / Für eine Entscheidung

**Prompt:** `Erkläre mir {thema}. Mein Vorwissensstand: {vorwissen}. Ich brauche es für: {zweck}.`

---

### 3. Schreib mir etwas (`create`)
**Felder:**
- `was` — text — "Was soll geschrieben werden?"
- `fuer_wen` — text — "Für wen? (Zielgruppe)"
- `ton` — select — Formell / Locker / Überzeugend / Sachlich
- `laenge` — select — Kurz / Mittel / Lang — **optional**

**Prompt:** `Schreibe {was} für {fuer_wen} in einem {ton}en Ton.{laenge ? " Länge: {laenge}." : ""}`

---

### 4. Fasse zusammen (`summarize`)
**Felder:**
- `text` — textarea — "Füge hier den Text ein, den Toro zusammenfassen soll"
- `fokus` — select — Kernaussagen / Handlungsempfehlungen / Zahlen & Fakten
- `fuer_wen` — text — "Für wen ist die Zusammenfassung?" — **optional**

**Prompt:** `Fasse folgenden Text zusammen. Fokus auf: {fokus}.{fuer_wen ? " Für: {fuer_wen}." : ""}\n\n{text}`

---

### 5. Hilf mir beim Denken (`extract`)
**Felder:**
- `thema` — text — "Worum geht es?"
- `ziel` — select — Entscheidung treffen / Ideen sammeln / Problem lösen / Vor- und Nachteile abwägen
- `hindernis` — text — "Was hält dich zurück?" — **optional**

**Prompt:** `Hilf mir beim {ziel} zu folgendem Thema: {thema}.{hindernis ? " Was mich dabei zurückhält: {hindernis}." : ""} Denke strukturiert mit und stelle mir die richtigen Gegenfragen.`

---

## Sidebar-Integration (Phase 2)

Dezenter Link neben dem Footer-Text in EmptyState:

```
Toro wählt immer das sparsamste Modell…       Vorlagen durchsuchen →
```

In Phase 2 öffnet der Link direkt den Drawer der zuletzt aktiven Vorlage (oder der ersten). Kein eigenes Modal.

---

## Phase-Plan

| Phase | Inhalt | Scope |
|---|---|---|
| **2** | Drawer + 5 Core-Vorlagen hardcoded | Diese Planung |
| **3** | DB-Tabelle `prompt_templates` + eigene Vorlagen erstellen/speichern + Sidebar-Bereich + "Als Vorlage speichern" | Folge-Plan |
| **4** | Community-Bibliothek + Paket-Vorlagen je Org | Future |

### Phase 3 — DB-Schema (zur Referenz)
```sql
CREATE TABLE prompt_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT,
  template_text   TEXT NOT NULL,
  fields          JSONB,
  task_type       TEXT,
  package         TEXT DEFAULT 'core',
  is_public       BOOLEAN DEFAULT false,
  usage_count     INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

RLS: User sieht eigene + org-weite Templates. `user_id IS NULL` = System-Vorlage (für alle sichtbar).

---

## Was Phase 2 bewusst NICHT enthält

- Keine DB-Migrationen
- Kein "Vorlagen durchsuchen" Modal
- Kein Speichern von User-Vorlagen
- Kein Admin-Interface für Paket-Vorlagen
- Keine Paket-Vorlagen (Behörde, Kreativ, Marketing, Wissenschaft)
