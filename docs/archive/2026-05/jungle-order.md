# Tropen OS — Jungle Order, Soft Delete & Multi-Select

---

## Edge Function: jungle-order

- `action: "structure"` → analysiert ungrouped Conversations → Projektstruktur-Vorschlag via Dify
- `action: "merge"` → lädt Messages der ausgewählten Chats → Zusammenfassung via Dify → neuer Chat
- Separate Dify App: `tropen-os-jungle-order` (Workflow-Typ, nicht Chatflow)
- Setup-Anleitung: `docs/dify-jungle-order-setup.md`
- Env-Var: `DIFY_JUNGLE_ORDER_KEY=app-...` (in `.env.local` + Supabase Secrets)

---

## Soft Delete

- `conversations.deleted_at` → NULL = aktiv, Timestamp = im Papierkorb
- `conversations.merged_into` → UUID des Ziel-Chats nach Zusammenführung
- Papierkorb: 30 Tage, dann `cleanup_deleted_conversations()` (Supabase Cron oder manuell)
- **Alle Conversation-Queries müssen `.is('deleted_at', null)` filtern** (Ausnahme: Papierkorb-Query)

---

## Multi-Select

- ☑ Button in Sidebar aktiviert Multi-Select-Modus
- Checkboxen ersetzen Drag-Handle; Escape beendet Modus
- Aktionsleiste (fixed, bottom) erscheint ab 2 ausgewählten Chats
- Aktionen: Zusammenführen (Merge-Modal) · Löschen (soft) · In Projekt verschieben

---

## Artefakte & Merkliste

- **Artefakte** entstehen aus Chat-Antworten (Code-Blöcke, Dokumente, strukturierte Outputs)
- **Chat-Header-Strip**: sichtbar wenn ≥1 Artefakt oder Lesezeichen — zeigt Zähler, öffnet Drawer
- **Top-Drawer**: listet Artefakte des aktuellen Chats (Name, Typ-Icon, Datum, Download)
- **Lesezeichen**: Bookmark-Icon auf jeder Toro-Nachricht
- **`/workspace`-Seite**: Grid aller Artefakte, Filter nach Typ, Suche, Download, Löschen
- Tabellen: `artifacts` + `bookmarks` (Migration 022)

---

## Coming Soon (nicht bauen)

- Medien-Ordner (wartet auf Datei-Upload) — `conversations.has_files` bereits vorhanden
- Chat-Block-Sharing
- Gemeinsame Ordner im Team (Phase 3)

---

## Nutzerbedürfnisse

### Was Nutzer lieben

| Bedürfnis | Status |
|-----------|--------|
| Gute Beratung statt nur Antwort | ✅ Toro ist Berater |
| Transparenz über Kosten und Modelle | ✅ SessionPanel |
| Memory mit Kontrolle | ✅ user_preferences editierbar |
| Breite Einsatzmöglichkeiten | ✅ Task-Modal und Pakete |
| Real-Time Websuche | 🔜 Geplant V2 |
| Voice Output | 🔜 Dify hat es, UI fehlt |
| Multimodalität und Dateiupload | 🔜 UI fehlt |

### Was Nutzer hassen

| Problem | Unsere Lösung |
|---------|---------------|
| Zerbrechliche Sessions | ✅ Dify-Gedächtnis ab Nachricht 2 |
| Unklare Datenschutz-Story | ✅ AVV, Training-Opt-Out, EU-Server |
| Intransparente Filter | ✅ Toro Guard erklärt Ablehnungen |
| Überaggressive Filter | 🔧 Level-Slider noch offen |
| Kosten- und Modell-Kontrolle B2B | 🔧 Admin-Dashboard noch offen |
