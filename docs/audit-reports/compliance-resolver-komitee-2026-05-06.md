# Compliance-Resolver Komitee — Spezifikation
> **Datum:** 2026-05-06
> **Reviewer:** Claude Sonnet, GPT-4o, Gemini 2.5 Pro, Grok 4
> **Judge:** Claude Opus
> **Kosten:** €0.4428
> **Output:** `docs/committee-reviews/compliance-resolver-review.md`

---

## Kontext-Zusammenfassung

Tropen OS sammelt 9 Compliance-Antworten (5 DSGVO, 4 KI-Act) via ComplianceBlock.tsx — gespeichert, angezeigt, gezählt — aber **von keinem Detektor konsumiert**. Das ist ein Marken-Bruch: ein Coach der Antworten entgegennimmt aber ignoriert ist kein Coach.

Ziel dieses Komitees: Spezifikation einer `compliance-resolver.ts`-Logik mit Dreischichten-Ansatz (Code-Check + Stamm-Daten + Detail-Antworten) und 4 Status-Typen.

**Wichtigste Komitee-Entscheidung vorab:** Der Status-Typ `fulfilled` wird umbennant in `confirmed`. Kein Tool das rechtliche Sachverhalte nicht verifizieren kann darf etwas als "erfüllt" bezeichnen.

---

## Konsens pro Frage

### `has_avv_supabase`

**Code-Prüfbarkeit:** NEIN (alle 4 Modelle einig). Verträge sind externe Dokumente — kein Code-Signal möglich.
**FP-Risiko:** Entfällt (kein Code-Check).
**Konflikt-Auflösung:** User-Vorrang (alle 4 einig). Einzige Informationsquelle ist der User.
**Status-Mapping:**
- `confirmed`: NIE vergeben — Komitee-Konsens: juristisch untragbar ohne Verifikation
- `needs-attention`: User-Antwort = false
- `input-needed`: Keine User-Antwort vorhanden
- `not-applicable`: Supabase nicht in package.json dependencies erkannt

**Coach-Wording (needs-attention):** "[DSGVO-Pflicht] Kein AVV mit Supabase bestätigt. Art. 28 DSGVO — ohne Vertrag dürft ihr keine Nutzerdaten auf Supabase verarbeiten. Wir sind kein Anwalt — aber das ist nicht verhandelbar."
**Coach-Wording (input-needed):** "Habt ihr einen AVV (Datenverarbeitungsvertrag) mit Supabase? Wir können das nicht aus dem Code prüfen — wir brauchen eure Antwort."

---

### `has_avv_vercel`

**Code-Prüfbarkeit:** NEIN (alle 4 einig).
**Konflikt-Auflösung:** User-Vorrang (alle 4 einig).
**Status-Mapping:**
- `confirmed`: NIE
- `needs-attention`: User = false
- `input-needed`: Keine User-Antwort
- `not-applicable`: Vercel nicht als Deployment-Target in vercel.json / package.json erkannt

**Coach-Wording (needs-attention):** "[DSGVO-Pflicht] Kein AVV mit Vercel bestätigt. Vercel verarbeitet eure Request-Daten — ohne DPA riskiert ihr einen DSGVO-Verstoß. Wir sind kein Anwalt."
**Coach-Wording (input-needed):** "Habt ihr den Vercel DPA (Data Processing Addendum) unterzeichnet? Findet ihr unter vercel.com/legal/dpa."

---

### `has_privacy_policy`

**Code-Prüfbarkeit:** JA (alle 4 einig). Code prüft ob Route `/datenschutz`, `/privacy`, `/datenschutz-erklarung` o.ä. existiert.
**FP-Risiko:** Mittel — externe Datenschutzseiten (z.B. auf eigenem Domain-Prefix) werden nicht erkannt.
**Konflikt-Auflösung:** User-Vorrang (3:1 Mehrheit). Code-Signal ist Hint, nicht Beweis. Spaltung aufgelöst: kein `confirmed` ohne User-Bestätigung.
**Status-Mapping:**
- `confirmed`: NIE (kein `confirmed` ohne inhaltliche Verifikation)
- `needs-attention`: Code findet keine Route ODER User = false
- `input-needed`: Code findet Route, aber keine User-Bestätigung der Aktualität
- `not-applicable`: Nie (DSGVO-Informationspflicht gilt immer)

**Coach-Wording (needs-attention):** "Keine Datenschutzseite im Code gefunden. Ohne aktuelle Datenschutzerklärung ist eure App nicht DSGVO-konform — wir prüfen den Inhalt nicht, wir sind kein Anwalt."
**Coach-Wording (input-needed):** "Wir haben eine Datenschutzseite im Code gefunden — aber ist sie aktuell und vollständig für eure App? Bitte bestätigt."

---

### `data_location`

**Code-Prüfbarkeit:** HYBRID (alle 4 einig). Code kann vercel.json Region-Config und Supabase-Referenzen prüfen, aber nicht die Production-Konfiguration. Begrenzte Aussagekraft.
**FP-Risiko:** Hoch — Code-Hinweise sind keine verlässliche Region-Bestätigung.
**Konflikt-Auflösung:** User-Vorrang (alle 4 einig). Production-Konfiguration ist nur dem User bekannt.
**Status-Mapping:**
- `confirmed`: NIE
- `needs-attention`: User gibt "USA ohne SCC" oder "Andere" oder "Weiß ich nicht" an
- `input-needed`: Keine User-Antwort
- `not-applicable`: Nie

**Coach-Wording (needs-attention):** "Daten-Region kritisch: USA ohne Standardvertragsklauseln ist nach Schrems-II ein DSGVO-Risiko. Wir können die Production-Konfiguration nicht prüfen — das müsst ihr selbst klären."
**Coach-Wording (input-needed):** "Wo laufen eure Server? Das können wir nicht aus dem Code ablesen — Supabase-Region in app.supabase.com → Settings → General prüfen."

---

### `has_deletion_process`

**Code-Prüfbarkeit:** JA (alle 4 einig). Code prüft ob Account-Delete-UI und/oder `/api/auth/delete` Route existieren.
**FP-Risiko:** Mittel — UI-Element vorhanden bedeutet nicht dass alle Daten gelöscht werden.
**Konflikt-Auflösung:** User-Vorrang (alle 4 einig). Spaltung aufgelöst: kein `confirmed` ohne User-Bestätigung der Vollständigkeit.
**Status-Mapping:**
- `confirmed`: NIE
- `needs-attention`: Kein Code-Signal ODER User = false
- `input-needed`: Code findet Delete-UI, aber keine User-Bestätigung der Vollständigkeit
- `not-applicable`: Nie (Art. 17 DSGVO gilt immer wenn User-Accounts vorhanden)

**Coach-Wording (needs-attention):** "Kein Löschprozess bestätigt. Art. 17 DSGVO — Nutzer müssen alle ihre Daten löschen können, nicht nur deaktivieren. Nicht nur UI: auch Backups und Drittanbieter-Daten."
**Coach-Wording (input-needed):** "Löschwerkzeug im Code gefunden — aber löscht es wirklich alle Daten inkl. Backups und Drittanbieter? Bitte bestätigen."

---

### `ki_risk_class`

**Code-Prüfbarkeit:** NEIN (alle 4 einig). Risikoklassifizierung ist juristische Einschätzung, kein Code-Signal.
**Konflikt-Auflösung:** User-Vorrang (alle 4 einig).
**Status-Mapping:**
- `confirmed`: NIE
- `needs-attention`: User gibt "Hoch" oder "Unakzeptabel" an
- `input-needed`: Keine User-Antwort
- `not-applicable`: Kein KI-Einsatz in dependencies erkannt (kein @anthropic-ai/sdk, openai etc.)

**Coach-Wording (needs-attention):** "[EU-AI-Act-Pflicht] Hochrisiko-KI: Konformitätsbewertung durch akkreditierte Stelle erforderlich. Wir können die Risikoklasse nicht bestätigen — das ist Anwaltsarbeit."
**Coach-Wording (input-needed):** "Wir haben KI-Nutzung erkannt. Welche Risikoklasse hat eure KI nach EU AI Act? Art. 6 listet Hochrisiko-Anwendungen konkret auf."

---

### `ki_transparency_label`

**Code-Prüfbarkeit:** HYBRID (3:1 Mehrheit). Code kann prüfen ob KI-Label-Patterns (z.B. "KI-generiert", "AI-generated", Komponenten-Pattern mit entsprechenden Klassen) in der Codebase vorhanden sind.
**FP-Risiko:** Hoch — Text-Pattern-Matching ist kein Beweis für korrekte Anzeige.
**Konflikt-Auflösung:** User-Vorrang. Spaltung aufgelöst: konsistent mit allen anderen Fragen.
**Status-Mapping:**
- `confirmed`: NIE
- `needs-attention`: Kein Code-Signal ODER User = false
- `input-needed`: Keine User-Antwort
- `not-applicable`: Kein KI-Einsatz erkannt

**Coach-Wording (needs-attention):** "Kein KI-Transparenz-Label erkannt. Art. 50 EU AI Act — Nutzer müssen wissen wenn sie KI-Inhalte sehen. Wir können das UI-Verhalten nicht prüfen."
**Coach-Wording (input-needed):** "Erkennen eure Nutzer wenn sie KI-generierte Inhalte sehen? Art. 50 EU AI Act — visuelles Label direkt beim Inhalt, nicht nur im Footer."

---

### `ki_logging_enabled`

**Code-Prüfbarkeit:** HYBRID (alle 4 einig). Code kann prüfen ob Logging-Patterns in Edge Functions / API-Routes vorhanden sind (z.B. strukturiertes Logging mit model_id, timestamp).
**FP-Risiko:** Hoch — Code-Logging-Patterns sind kein Beweis für rechtlich ausreichendes KI-Logging.
**Konflikt-Auflösung:** User-Vorrang (alle 4 einig). Backend-Konfiguration ist nur dem User bekannt.
**Status-Mapping:**
- `confirmed`: NIE
- `needs-attention`: User = false
- `input-needed`: Keine User-Antwort
- `not-applicable`: Kein KI-Einsatz erkannt

**Coach-Wording (needs-attention):** "KI-Logging nicht bestätigt. Art. 12 EU AI Act — für begrenzte und höhere Risikoklassen Pflicht. Logging-Inhalt: Modell-ID, Zeitstempel, Input-Typ, Entscheidungs-Typ."
**Coach-Wording (input-needed):** "Loggt ihr KI-Entscheidungen so, dass ihr sie erklären könnt? Wir sehen Code-Logging-Muster aber können rechtliche Ausreichendheit nicht prüfen."

---

### `ki_purpose_documented`

**Code-Prüfbarkeit:** NEIN (alle 4 einig). Dokumentation ist ein externes Dokument außerhalb des Code-Bestands.
**Konflikt-Auflösung:** User-Vorrang (alle 4 einig).
**Status-Mapping:**
- `confirmed`: NIE
- `needs-attention`: User = false
- `input-needed`: Keine User-Antwort
- `not-applicable`: Kein KI-Einsatz erkannt

**Coach-Wording (needs-attention):** "KI-Zweck nicht dokumentiert. Art. 13 EU AI Act — Nutzer müssen wissen wofür KI eingesetzt wird und was sie nicht tut. Schriftliches Dokument, nicht nur Code-Kommentar."
**Coach-Wording (input-needed):** "Ist schriftlich festgehalten wofür eure KI da ist? Nicht Implementierungsdetails — User-Facing-Erklärung: Zweck, Grenzen, Verantwortlichkeit."

---

## Übergreifende juristische Risiko-Bewertung

### Kernentscheidung: `fulfilled` → `confirmed` (EINIG)

**KEIN Status `fulfilled` für juristische Sachverhalte.** Claude Sonnet hat es präzise formuliert: ein Tool das `fulfilled` ohne Verifikation markiert wird zur "Compliance-Bescheinigung" — rechtlich untragbar.

Der neue Status heißt `confirmed` und bedeutet: "User hat bestätigt, wir haben es zur Kenntnis genommen." Nicht: "Es ist rechtlich korrekt."

### Zwingend notwendige Disclaimer (alle 4 Modelle einig)

1. **"Wir sind kein Anwalt"** — bei JEDER Compliance-Bewertung
2. **"Basierend auf deiner Selbsteinschätzung"** — wenn nur User-Input vorliegt
3. **"Code-Hinweis, keine rechtliche Bewertung"** — bei Code-basierten Hinweisen

### Top 3 juristische Risiken

1. **Schein-Zertifizierung**: Tool könnte als Compliance-Garantie missverstanden werden → Lösung: Umbenennung in `confirmed` + persistente Disclaimer
2. **Haftungsübernahme**: Ohne klare Begrenzungs-Aussagen könnte Betreiber mithaften → Lösung: Marken-Brief 28.1-Wording konsequent
3. **Unvollständige Prüfung**: Code-Checks erfassen Bruchteile der rechtlichen Anforderungen → Lösung: Code-Signals immer als "Hinweis" kommunizieren, nie als "Beweis"

---

## TypeScript Interface-Skizze (Komitee-Konsens)

```typescript
// src/lib/audit/compliance-resolver.ts
// Komitee-Konsens 2026-05-06 — Interface-Skizze

/**
 * Input für den Compliance-Resolver.
 * complianceAnswers: aus project_compliance_data (DB)
 * codeSignals: aus AuditContext (Code-Existenz-Checks)
 */
interface ComplianceResolverInput {
  questionKey: string
  userAnswer: boolean | string | undefined   // aus DB: project_compliance_data
  codeSignals: {
    hasPrivacyRoute?: boolean                // /datenschutz, /privacy o.ä. existiert
    hasDeleteEndpoint?: boolean              // /api/auth/delete, Account-Delete-UI
    detectedRegions?: string[]               // aus vercel.json, Supabase-Config-Hinweise
    hasKITransparencyMarker?: boolean        // Text-Pattern "KI-generiert" o.ä. im Code
    hasKILoggingPattern?: boolean            // Strukturiertes Logging in Edge Function erkannt
  }
  detectedDependencies: string[]            // aus package.json: supabase, vercel, anthropic etc.
}

/**
 * Status-Typen — KEIN 'fulfilled' (Komitee-Konsens: juristisch untragbar)
 */
type ComplianceStatus =
  | 'confirmed'         // User hat bestätigt; wir haben es zur Kenntnis genommen (KEIN Rechtsurteil)
  | 'needs-attention'   // Problem erkannt (User sagt nein ODER Code-Signal negativ)
  | 'input-needed'      // Keine User-Antwort, können nicht prüfen
  | 'not-applicable'    // Technologie nicht in diesem Projekt erkannt

/**
 * Confidence-Level: woher stammt unsere Einschätzung?
 */
type ComplianceConfidence =
  | 'user-only'         // Nur User-Antwort, kein Code-Signal
  | 'code-supported'    // Code-Signal + User-Antwort konsistent
  | 'code-contradicted' // Code-Signal widerspricht User-Antwort (z.B. keine Route aber User = true)

interface ComplianceResolverResult {
  status: ComplianceStatus
  confidence: ComplianceConfidence
  coachMessage: string                  // Coach-Wording nach Marken-Brief 28.1
  disclaimer: string                    // Immer: "Wir sind kein Anwalt" Variante
  actionRequired?: string               // Was soll der User konkret tun
  findingSeverity?: 'high' | 'medium'   // null wenn kein Finding erzeugt wird
}

/**
 * Gesamtergebnis für alle 9 Fragen eines Projekts.
 */
interface ComplianceResolution {
  [questionKey: string]: ComplianceResolverResult
}

/**
 * Haupt-Funktion (zu implementieren).
 * Nimmt complianceAnswers aus DB + codeSignals aus AuditContext.
 * Gibt ComplianceResolution zurück.
 */
// export function resolveCompliance(
//   answers: Record<string, unknown>,
//   codeSignals: Partial<ComplianceResolverInput['codeSignals']>,
//   detectedDependencies: string[],
// ): ComplianceResolution
```

---

## Finding-Schwellen-Entscheidung (Komitee-Konsens)

| Status | Finding erzeugt? | Severity |
|--------|-----------------|----------|
| `confirmed` | Nein | — |
| `needs-attention` | Ja | HIGH |
| `input-needed` | Ja | MEDIUM |
| `not-applicable` | Nein | — |

**Begründung:** `needs-attention` = aktives Compliance-Problem → High. `input-needed` = fehlende Information → Medium (User hat noch keine Antwort gegeben, kein bestätigtes Problem).

---

## Implementations-Reihenfolge (Top 3)

1. **`has_privacy_policy`** — hohe Code-Prüfbarkeit, klare DSGVO-Anforderung, geringes Fehlinterpretations-Risiko
2. **`has_deletion_process`** — code-prüfbar, konkretes User-Recht (Art. 17), technisch gut abbildbar
3. **`data_location`** — hybrid-prüfbar, kritisch für DSGVO (Schrems-II), klare Handlungsempfehlungen möglich

---

## Konsens-Punkte und Spaltungen

### 8 Konsens-Punkte (alle 4 Modelle einig)
1. AVV-Fragen (`has_avv_supabase`, `has_avv_vercel`) sind nicht code-prüfbar
2. User-Vorrang bei allen Konflikten zwischen Code und User-Antwort
3. Kein `fulfilled`/`confirmed` für juristische Bewertungen ohne externe Verifikation
4. KI-Risikoklasse (`ki_risk_class`) ist reine User-Einschätzung
5. Disclaimer "Wir sind kein Anwalt" bei jeder Compliance-Ausgabe essentiell
6. `not-applicable` wenn Technologie nicht in dependencies erkannt
7. `has_privacy_policy` und `has_deletion_process` sind code-prüfbar (als Hinweis)
8. Juristische Risiken erfordern explizite Kommunikation (Marken-Brief 28.1 korrekt)

### 3 Spaltungen (aufgelöst durch Judge)

1. **`fulfilled`-Vergabe bei User-Bestätigung**: GPT-4o wollte bei User-Bestätigung `fulfilled` vergeben → **Aufgelöst:** Umbenennung in `confirmed`, NIE für juristische Sachverhalte — zu riskant (3:1)

2. **`has_privacy_policy` Status-Mapping**: Uneinigkeit ob Code+User-Bestätigung für positiven Status ausreicht → **Aufgelöst:** Kein `confirmed` ohne User-Bestätigung, konsistent mit Gesamt-Architektur

3. **`ki_transparency_label` Konflikt-Auflösung**: GPT-4o wollte Code gewinnen lassen wenn Code-Signal negativ → **Aufgelöst:** User-Vorrang — Konsistenz wichtiger als Einzelfall-Optimierung

---

## Geschätzter Implementations-Aufwand

- **Option A (Minimal, ~2-3h):** Nur die 3 priorisierten Fragen als manual-Checker-Rules, direkte complianceAnswers-Konsumption in agent-regulatory-checker.ts
- **Option B (Vollständig, ~1 Tag):** compliance-resolver.ts als eigenständiges Modul, AuditContext-Erweiterung, alle 9 Fragen, vollständige TypeScript-Typen

**Empfehlung Komitee:** Option A als sofortiger Marken-Bruch-Fix, Option B als Sprint-Ziel in Phase 2.5.
