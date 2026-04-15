# Committee Review: compliance-architecture

> Generiert am 2026-04-14 · Reviewer: Claude Sonnet, GPT-4o, Gemini 2.5 Pro, Grok 4 · Judge: Claude Opus

---

# Technische Architektur-Entscheidungen: Compliance-Plattform MVP

## 1. PROFIL-DESIGN: Reichen 3 Fragen?

**Konsens-Level:** EINIG

**Empfohlene Option:** JA, 3 Fragen sind optimal.

Alle Modelle bestätigen: Die Kombination aus App-Typ, Nutzer-Location und Features (Multi-Select) deckt 80-90% der Szenarien ab ohne Friction zu erzeugen.

**Konkreter nächster Schritt:** 
UI-Form mit verbessertem Wording für Frage 3 implementieren:
```
"Was ist drin?" → Login / Bezahlung / KI-Features / Affiliate-Links / User-Content
```

## 2. MVP-SCOPE: Welche Domains zuerst?

**Konsens-Level:** MEHRHEIT

**Empfohlene Option:** B) Top 3 nach Risiko mit Profil-Filter

3 von 4 Modellen empfehlen Risiko-Fokus:
1. **Impressum/DDG** (100% Hit-Rate bei Lovable-Apps)
2. **DSGVO** (bis 20M€ Bußgeld)
3. **E-Commerce/Fernabsatz** (90% der SaaS haben Bezahlung)

Ein Modell präferiert alle Domains mit Profil-Filter — dieser Ansatz kann als Erweiterung nach MVP erfolgen.

**Konkreter nächster Schritt:**
Diese 3 Domains vollständig implementieren mit jeweils 10-15 Regeln. Andere Domains als Platzhalter vorbereiten.

## 3. E-COMMERCE-TIEFE für Vibe-Coder?

**Konsens-Level:** GESPALTEN

**Empfohlene Option:** A) Basis-Checks + spezifische Button-Texte

2 Modelle für minimale Checks (nur AGB/Widerruf), 2 für erweiterte Checks. 

Kompromiss: Starte minimal, aber implementiere konkret:
- AGB/Widerrufsbelehrung vorhanden?
- Button-Text-Check ("Jetzt kostenpflichtig bestellen")
- Preistransparenz vor Checkout

**Konkreter nächster Schritt:**
3 Basis-Regeln implementieren, Button-Text via Regex scannen. Templates für Fix-Prompts bereitstellen.

## 4. AFFILIATE-CHECKS: Automatisierbar?

**Konsens-Level:** EINIG

**Empfohlene Option:** A) Automatische URL-Erkennung + C) Hinweis-Finding

Klarer Konsens für Regex-basierte Erkennung:
```javascript
const affiliatePatterns = [
  /amazon\.[a-z]+\/.*[?&]tag=/,
  /awin1\.com/,
  /partnerize\.com/
];
```

Aber nur als Hinweis: "Affiliate-Links gefunden — Werbekennzeichnung prüfen!"

**Konkreter nächster Schritt:**
Pattern-Library aufbauen, als einzelne Regel implementieren mit generischem Hinweis-Text.

## 5. APP STORE: Eigene Domain oder Overlap?

**Konsens-Level:** EINIG

**Empfohlene Option:** B) In bestehende Domains integrieren

Mapping ist klar:
- Privacy Policy → DSGVO-Domain
- AI Transparency → AI Act-Domain
- Data Collection → DSGVO-Domain

Keine separate Domain, aber spezielle "📱 App Store Readiness" Section im UI.

**Konkreter nächster Schritt:**
3-5 Overlap-Regeln definieren, die bei Profil "Mobile" getriggert werden.

## 6. NAMING: Domain-Namen im UI?

**Konsens-Level:** EINIG

**Empfohlene Option:** Vereinfachte Namen mit Risiko-Indikator

```
🔒 Datenschutz (bis 20M€)
🤖 KI-Transparenz (bis 35M€)  
♿ Barrierefreiheit (bis 100k€)
🛒 Online-Handel (bis 50k€)
📄 Impressum & Pflichten
```

Emojis + Bußgeld-Range kommunizieren Dringlichkeit ohne Panik.

**Konkreter nächster Schritt:**
UI-Text-Constants aktualisieren, Ampel-System beibehalten.

## Technische Architektur

### Profil-Schema

```typescript
interface UserProfile {
  id: string;
  app_type: 'portfolio' | 'saas' | 'ecommerce' | 'blog' | 'mobile';
  user_location: 'de' | 'eu' | 'global' | 'internal';
  features: string[]; // ['login', 'payment', 'ai', 'affiliate', 'ugc']
  created_at: Date;
}
```

### Score-Anpassung

```typescript
function calculateScore(findings: Finding[], profile: UserProfile): Score {
  const relevantRules = filterRulesByProfile(allRules, profile);
  const applicableFindings = findings.filter(f => 
    relevantRules.includes(f.rule_id)
  );
  
  return {
    percentage: (relevantRules.length - applicableFindings.length) 
                / relevantRules.length * 100,
    total_applicable: relevantRules.length
  };
}
```

### N/A-Regel-Handling

- Regeln außerhalb des Profils werden komplett aus Score-Berechnung entfernt
- UI zeigt: "X von Y Regeln relevant für deine App"
- Graue Domains für nicht-relevante Bereiche

## Nächste Schritte

### Priorisierte TODO-Liste (5 Tage):

1. **Tag 1:** Profil-UI bauen (3-Fragen-Form nach Repo-Connect)
2. **Tag 2-3:** Top 3 Domains implementieren (Impressum, DSGVO, E-Commerce) mit je 10-15 Regeln
3. **Tag 4:** Affiliate-Pattern-Detection + Button-Text-Scanner für E-Commerce
4. **Tag 5:** Score-Algorithmus auf Profil-Filter umstellen + UI-Texte finalisieren

### Quick Win für Tag 1:
Impressum-Domain zuerst — garantierter Finding bei jeder Lovable-App. Sofortiger Wert für User.

---

## Kosten

| Modell           | In-Tok  | Out-Tok | Kosten   |
|------------------|---------|---------|----------|
| Claude Sonnet    |    2926 |    1813 | €0.0335 |
| GPT-4o           |    2134 |     652 | €0.0110 |
| Gemini 2.5 Pro   |    2401 |    2044 | €0.0218 |
| Grok 4           |    2907 |    2485 | €0.0428 |
| Judge (Opus)     |    6111 |    1714 | €0.2048 |
| **Gesamt**       |         |         | **€0.3139** |
