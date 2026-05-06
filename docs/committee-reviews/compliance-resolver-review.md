# Committee Review: compliance-resolver

> Generiert am 2026-05-06 · Reviewer: Claude Sonnet, GPT-4o, Gemini 2.5 Pro, Grok 4 · Judge: Claude Opus

---

# Compliance-Resolver Architektur-Entscheidung

## Konsens-Synthese pro questionKey

### has_avv_supabase
- **Code-Prüfbarkeit**: NEIN (**EINIG**)
- **Konflikt-Auflösung**: User-Vorrang (**EINIG**)
- **Status-Mapping**: **EINIG**
  - fulfilled: NIE vergeben (3 Modelle explizit dagegen, GPT-4O implizit)
  - open: User-Antwort = false
  - input-needed: Keine User-Antwort
  - not-applicable: Supabase nicht in dependencies

### has_avv_vercel
- **Code-Prüfbarkeit**: NEIN (**EINIG**)
- **Konflikt-Auflösung**: User-Vorrang (**EINIG**)
- **Status-Mapping**: **EINIG**
  - fulfilled: NIE vergeben
  - open: User-Antwort = false
  - input-needed: Keine User-Antwort
  - not-applicable: Vercel nicht als Deployment-Target

### has_privacy_policy
- **Code-Prüfbarkeit**: JA (**EINIG**)
- **Konflikt-Auflösung**: User-Vorrang (**MEHRHEIT** - 3:1)
- **Status-Mapping**: **GESPALTEN**
  - **Entscheidung**: Kein `fulfilled` ohne User-Bestätigung
  - open: Code findet keine Route ODER User = false
  - input-needed: Code findet Route, aber keine User-Bestätigung
  - not-applicable: Nie (DSGVO gilt immer)

### data_location
- **Code-Prüfbarkeit**: HYBRID (**EINIG** - begrenzt möglich)
- **Konflikt-Auflösung**: User-Vorrang (**EINIG**)
- **Status-Mapping**: **EINIG**
  - fulfilled: NIE vergeben
  - open: User gibt "USA ohne SCC" oder "Andere" an
  - input-needed: Keine User-Antwort
  - not-applicable: Nie

### has_deletion_process
- **Code-Prüfbarkeit**: JA (**EINIG**)
- **Konflikt-Auflösung**: User-Vorrang (**EINIG**)
- **Status-Mapping**: **GESPALTEN**
  - **Entscheidung**: Kein `fulfilled` ohne User-Bestätigung der Vollständigkeit
  - open: Kein Code-Signal ODER User = false
  - input-needed: Code findet Delete-UI, aber keine User-Bestätigung
  - not-applicable: Nie

### ki_risk_class
- **Code-Prüfbarkeit**: NEIN (**EINIG**)
- **Konflikt-Auflösung**: User-Vorrang (**EINIG**)
- **Status-Mapping**: **EINIG**
  - fulfilled: NIE vergeben
  - open: User gibt "Hoch" an
  - input-needed: Keine User-Antwort
  - not-applicable: Kein KI-Einsatz erkannt

### ki_transparency_label
- **Code-Prüfbarkeit**: HYBRID (**MEHRHEIT** - 3:1)
- **Konflikt-Auflösung**: **GESPALTEN**
  - **Entscheidung**: User-Vorrang (konsistent mit anderen Fragen)
- **Status-Mapping**: **EINIG**
  - fulfilled: NIE vergeben
  - open: Kein Code-Signal ODER User = false
  - input-needed: Keine User-Antwort
  - not-applicable: Kein KI-Einsatz

### ki_logging_enabled
- **Code-Prüfbarkeit**: HYBRID (**EINIG**)
- **Konflikt-Auflösung**: User-Vorrang (**EINIG**)
- **Status-Mapping**: **EINIG**
  - fulfilled: NIE vergeben
  - open: User = false
  - input-needed: Keine User-Antwort
  - not-applicable: Kein KI-Einsatz

### ki_purpose_documented
- **Code-Prüfbarkeit**: NEIN (**EINIG**)
- **Konflikt-Auflösung**: User-Vorrang (**EINIG**)
- **Status-Mapping**: **EINIG**
  - fulfilled: NIE vergeben
  - open: User = false
  - input-needed: Keine User-Antwort
  - not-applicable: Kein KI-Einsatz

## Juristische Risiko-Bewertung

### Darf Tropen OS `fulfilled` anzeigen?
**NEIN.** Claude Sonnet hat es präzise formuliert: Ein Tool das `fulfilled` ohne Verifikation markiert wird zur "Compliance-Bescheinigung" — rechtlich untragbar. Konsens: Nur `confirmed` für User-Bestätigungen verwenden.

### Zwingend notwendige Disclaimer
1. **"Wir sind kein Anwalt"** - bei JEDER Bewertung
2. **"Basierend auf deiner Selbsteinschätzung"** - wenn nur User-Input
3. **"Code-Hinweis, keine rechtliche Bewertung"** - bei Code-Checks

### Top 3 kritischste juristische Risiken
1. **Schein-Zertifizierung**: Tool könnte als Compliance-Garantie missverstanden werden
2. **Haftungsübernahme**: Ohne klare Begrenzung könnte Betreiber mithaften
3. **Unvollständige Prüfung**: Code-Checks erfassen nur Bruchteile der rechtlichen Anforderungen

## TypeScript API-Skizze

```typescript
// compliance-resolver.ts — Interface-Skizze (Komitee-Konsens)
interface ComplianceResolverInput {
  questionKey: string;
  userAnswer: boolean | string | undefined;
  codeSignals: {
    hasPrivacyRoute?: boolean;
    hasDeleteEndpoint?: boolean;
    detectedRegions?: string[];
    hasKITransparencyMarker?: boolean;
  };
  detectedDependencies: string[];
}

type ComplianceStatus = 'confirmed' | 'needs-attention' | 'input-needed' | 'not-applicable';

interface ComplianceResolverResult {
  status: ComplianceStatus;
  confidence: 'user-only' | 'code-supported' | 'code-contradicted';
  coachMessage: string;
  disclaimer: string;
  actionRequired?: string;
}

interface ComplianceResolution {
  [questionKey: string]: ComplianceResolverResult;
}
```

## Finding-Schwellen-Entscheidung

- **needs-attention**: HIGH severity Finding
- **input-needed**: MEDIUM severity Finding  
- **confirmed**: Kein Finding
- **not-applicable**: Kein Finding

**Begründung**: "needs-attention" zeigt aktive Compliance-Probleme, während "input-needed" nur fehlende Information signalisiert.

## Implementations-Reihenfolge

### 1. has_privacy_policy
**Grund**: Hohe Code-Prüfbarkeit, klare DSGVO-Anforderung, geringes Fehlinterpretations-Risiko

### 2. has_deletion_process  
**Grund**: Code-prüfbar, konkretes User-Recht, technisch gut abbildbar

### 3. data_location
**Grund**: Hybrid-prüfbar, kritisch für DSGVO, klare Handlungsempfehlungen möglich

## Konsens-Punkte vs. Spaltungen

### 8 Konsens-Punkte (alle 4 Modelle einig)
1. AVV-Fragen sind nicht code-prüfbar
2. User-Vorrang bei Konflikten (fast überall)
3. Kein `fulfilled` für juristische Bewertungen
4. KI-Risikoklasse ist reine User-Einschätzung
5. Disclaimer "Wir sind kein Anwalt" essentiell
6. `not-applicable` wenn Technologie nicht genutzt
7. Privacy Policy und Deletion Process sind code-prüfbar
8. Juristische Risiken erfordern klare Kommunikation

### 3 Spaltungen (aufgelöst)
1. **Fulfilled-Vergabe generell**: GPT-4O wollte bei User-Bestätigung `fulfilled` vergeben
   - **Auflösung**: Folge Claude/Gemini/Grok — zu riskant rechtlich
   
2. **Privacy Policy Status-Mapping**: Uneinigkeit ob Code+User oder nur User für positiv
   - **Auflösung**: Nur User-Bestätigung zählt — konsistent mit Gesamt-Architektur
   
3. **KI Transparency Konflikt-Auflösung**: GPT-4O wollte Code gewinnen lassen
   - **Auflösung**: User-Vorrang — bleibe konsistent

## Nächste Schritte

1. **Sofort**: Umbenennung `fulfilled` → `confirmed` im gesamten System
2. **Sofort**: Implementiere die Top 3 Fragen mit klaren Disclaimern  
3. **Bald**: Erweitere Code-Signal-Detection für Privacy/Delete/Region
4. **Später**: Entwickle User-Education-Content zu Compliance-Selbstprüfung

---

## Kosten

| Modell           | In-Tok  | Out-Tok | Kosten   |
|------------------|---------|---------|----------|
| Claude Sonnet    |    5651 |    2048 | €0.0443 |
| GPT-4o           |    4110 |    1866 | €0.0269 |
| Gemini 2.5 Pro   |    4454 |    2043 | €0.0242 |
| Grok 4           |    4961 |    2818 | €0.0532 |
| Judge (Opus)     |    8678 |    2483 | €0.2942 |
| **Gesamt**       |         |         | **€0.4428** |
