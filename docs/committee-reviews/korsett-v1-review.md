# Committee Review: korsett-v1

> Generiert am 2026-06-05 · Reviewer: Claude Sonnet, GPT-4o, Gemini 2.5 Pro, Grok 4 · Judge: Claude Opus

---

# Korsett v1: Abschlussbericht Multi-Model-Komitee

## Konvergenz-Urteil: **RUNDE 3 NÖTIG**

**Konsens-Level: EINIG**

Alle 4 Modelle stimmen überein: Korsett v1 hat die Runde-1-Findings größtenteils adressiert, ist aber noch nicht reif zum Festschreiben. Kritische Lücken und 3-4 Über-Korrekturen müssen behoben werden.

**Hauptbegründung (alle Modelle):** Email-Versand als kritische Foundation-Lücke + leichte Zwangsjacke bei ~30 Knoten für Solo-Coder-Vibe.

---

## Verbleibende Konsens-Findings

### **Email-Versand/Transactional** — **EINIG**
- Alle 4 Modelle identifizieren dies als kritische Foundation-Lücke
- Claude: "prägt Provider-Wahl", GPT-4O: "oft wichtig für Auth", Gemini: erwähnt DSGVO-Aspekt, Grok: "Resend/Postmark + Templates"
- **Sofort hinzufügen** als eigener 🔴-Knoten

### **Background-Jobs/Queues** — **MEHRHEIT (3/4)**
- GPT-4O: "Background-Jobs/Cron nicht behandelt"
- Gemini: implizit erwähnt
- Grok: "Inngest/Supabase Edge Functions"
- Claude: nicht explizit erwähnt
- **Bald hinzufügen** als 🟡-Knoten

### **Seed-/Demo-Daten-Strategie** — **MEHRHEIT (3/4)**
- Claude: "wie entwickelt man mit realistischen Daten?"
- GPT-4O: "oft nützlich bei Greenfield"
- Grok: "reproduzierbarer Start"
- **Bald hinzufügen** als 🟡-Knoten

### **Feature-Flags** — **MEHRHEIT (3/4)**
- Claude, GPT-4O, Grok erwähnen alle
- **Später hinzufügen** — nicht Foundation-kritisch

---

## Über-Korrektur — Was zusammenlegen/streichen

### **F3 Design-System zu komplex** — **EINIG**
- Alle Modelle kritisieren Design-Tokens für Solo-Starter
- Claude: "Tailwind allein reicht", Grok: "zu granular"
- **Sofort vereinfachen** oder mit F2 zusammenlegen

### **DEP1 + DEP2 zusammenlegen** — **MEHRHEIT (3/4)**
- Claude: "Deploy & CI als ein Entscheidungspunkt"
- GPT-4O: "allgemeine Deployment-Strategie" 
- Grok: "Deploy & CI"
- **Sofort zusammenlegen** zu einem Knoten

### **D10 Realtime über-engineered** — **MEHRHEIT (3/4)**
- Claude: "Die meisten MVPs brauchen kein Live-Update"
- Grok: "auf Projekt-spezifisch reduzieren"
- **Sofort streichen** oder stark vereinfachen

---

## Restliche Fehlklassifikationen (🔴↔🟡)

### **DEP1 Hosting: 🟡 → 🔴** — **MEHRHEIT (3/4)**
- Claude: "Vercel vs. Railway bestimmt Sub-Prozessoren"
- Grok: "bestimmt Sub-Prozessoren L5 und Backup-Strategie"
- **Sofort korrigieren**

### **D4 Security-Härtung: uneinheitlich** — **GESPALTEN**
- Claude: "angemessen für Solo-Coder" (🟡 OK)
- GPT-4O: "könnte 🔴 sein wegen Sicherheitsrisiken"
- **Einzelfall-Entscheidung** — bei aktueller 🟡 belassen

### **API1: 🔴 → 🟡** — **EINZELMEINUNG**
- Nur Claude kritisiert: "Next.js Server Actions natürlicher Default"
- **Keine Änderung** — bleibt 🔴

---

## Priorisierte Änderungsliste v1 → v2

### **Sofort (Foundation-kritisch):**
1. **Email-Versand** als neuer 🔴-Knoten hinzufügen
2. **DEP1 + DEP2** zu einem "Deploy & CI"-Knoten zusammenlegen
3. **F3 Design-System** vereinfachen oder mit F2 mergen
4. **DEP1 Hosting** von 🟡 auf 🔴 hochstufen
5. **D10 Realtime** streichen oder stark vereinfachen

### **Bald (Vollständigkeit):**
6. **Background-Jobs/Queues** als 🟡-Knoten
7. **Seed-/Demo-Daten** als 🟡-Knoten

### **Später (Nice-to-have):**
8. **Feature-Flags** erwägen
9. **i18n** für EU-Märkte prüfen

---

## Nächste Schritte

1. **Runde 3 durchführen** mit den 5 sofortigen Änderungen
2. **Ziel:** Von ~30 auf ~25 Knoten reduzieren
3. **Erfolgskriterium:** Kein Modell kritisiert mehr Foundation-Lücken oder Zwangsjacke
4. **Timeline:** Nach Runde 3 → Festschreibung für Solo-Coder-Einsatz

**Konsens aller Modelle:** Der Ansatz ist richtig, v1 war ein guter Fortschritt, aber noch eine Iteration nötig für Production-Reife.

---

## Kosten

| Modell           | In-Tok  | Out-Tok | Kosten   |
|------------------|---------|---------|----------|
| Claude Sonnet    |    6587 |    1039 | €0.0329 |
| GPT-4o           |    5122 |     514 | €0.0167 |
| Gemini 2.5 Pro   |    5275 |    2044 | €0.0251 |
| Grok 4           |    5330 |    1045 | €0.0294 |
| Judge (Opus)     |    3186 |    1547 | €0.1523 |
| **Gesamt**       |         |         | **€0.2565** |
