# Committee Review: korsett-v0

> Generiert am 2026-06-05 · Reviewer: Claude Sonnet, GPT-4o, Gemini 2.5 Pro, Grok 4 · Judge: Claude Opus

---

# Korsett v0 → v1: Multi-Model Review Abschlussbericht

## Fehlende Knoten/Pivots

### **Frontend-Architektur fehlt komplett** — KONSENS: **EINIG** ✅
Alle vier Modelle kritisieren das vollständige Fehlen der Frontend-Architektur:
- **Aufnehmen**: U7 (Frontend-Architektur & State Management)  
- **Aufnehmen**: P7 (Frontend/Hosting-Pivot)
- **Begründung**: State Management, SSR/CSR, Component-Pattern sind architektur-prägend

### **API-Design/Backend-Struktur** — KONSENS: **EINIG** ✅
- **Aufnehmen**: Knoten zu REST/GraphQL/tRPC-Entscheidung
- **Begründung**: Bestimmt gesamte Client-Server-Kommunikation

### **Deploy/CI-Pipeline** — KONSENS: **EINIG** ✅
- **Aufnehmen**: Hosting-Entscheidung (Vercel/Railway)
- **Aufnehmen**: CI/CD-Knoten 
- **Begründung**: Deployment-Strategie bestimmt Sub-Prozessoren (L6)

### **File Upload/Storage** — KONSENS: **MEHRHEIT** (3/4) ✅
- **Aufnehmen**: U8 (Storage & Uploads mit RLS)
- **Begründung**: Bei User-Content unvermeidlich, Supabase-spezifisch

### **Testing-Strategie** — KONSENS: **MEHRHEIT** (2/4) ⚠️
- **Später prüfen**: Nur GPT-4O und Gemini erwähnen explizit
- **Begründung**: Könnte zu enterprise-lastig für Solo-Coder sein

### **Realtime/WebSocket** — KONSENS: **MEHRHEIT** (2/4) ⚠️
- **Aufnehmen**: D9 (Realtime-Channel + RLS)
- **Begründung**: Supabase-spezifisch, oft vergessen

## Fehlklassifikationen (🔴↔🟡)

### **U6 (Naming) 🟡→🔴** — KONSENS: **MEHRHEIT** (3/4) ✅
- **Ändern**: Inkonsistente Naming kostet massiv beim Refactoring
- **Zitat Claude**: "Inkonsistente Naming kostet massiv beim Refactoring"

### **A1 (Auth-Methode) 🟡→🔴** — KONSENS: **MEHRHEIT** (3/4) ✅  
- **Ändern**: Magic-Link vs. Passwort = kompletter User-Flow-Umbau
- **Zusatz Grok**: "Hat direkte Auswirkung auf DSGVO-Pflichten"

### **D4 (search_path/Custom Access Token) 🟡→🔴** — KONSENS: **GESPALTEN** ⚠️
- **Claude**: zu komplex für Solo-Coder
- **Grok**: "reale Supabase-Sicherheitslücken"
- **Entscheidung**: Kompromiss → Warnung behalten, aber als kritische Security-Lücke markieren

### **O1 (Observability) 🟡→🔴** — KONSENS: **EINZELMEINUNG** (nur Grok)
- **Nicht ändern**: Nur ein Modell erwähnt, andere sehen es als "Monitoring später"

### **PII2 (besondere Kategorien) 🟡→🔴** — KONSENS: **EINZELMEINUNG** (nur GPT-4O)
- **Prüfen**: Bereits 🔴 in Original, möglich dass Modell falsche Version reviewte

## Streichen/Zusammenlegen (Über-Engineering)

### **D4 (search_path) zu komplex** — KONSENS: **MEHRHEIT** (3/4) ✅
- **Vereinfachen**: Auf Warnung reduzieren, nicht als separaten Knoten
- **Zitat Claude**: "viel zu komplex für Solo-Starter"

### **D8 (Schema-Hygiene) zu granular** — KONSENS: **MEHRHEIT** (3/4) ✅
- **Streichen/Später**: FK-Constraints kann man nachrüsten
- **Zitat Grok**: "Gehört in späteren Schema-Review-Knoten"

### **P6 Legal-Knoten zusammenlegen** — KONSENS: **MEHRHEIT** (3/4) ✅
- **Zusammenlegen**: L3+L5 zu "Juristische Pflichten"
- **Zusammenlegen**: L6+L7 zu "Sub-Prozessoren & Tracking"

### **AI3 (Budget-Cap) over-engineered** — KONSENS: **EINZELMEINUNG** (nur Grok)
- **Behalten**: Nur eine Stimme, Budget-Control ist bei LLMs real relevant

## Baum-Form-Kritik

### **P0 (Greenfield) falsch positioniert** — KONSENS: **MEHRHEIT** (2/4) ⚠️
- **Ändern**: Vor universelle Knoten verschieben
- **Begründung**: Bestimmt U2, U3, U6 komplett

### **U2/U6 sind Supabase-spezifisch** — KONSENS: **MEHRHEIT** (2/4) ⚠️
- **Verschieben**: Von Universal zu P2 (Supabase-Ast)
- **Begründung**: snake_case, `supabase gen types` sind Stack-abhängig

### **P1 "Was baust du?" zu spät** — KONSENS: **MEHRHEIT** (2/4) ⚠️
- **Verschieben**: Direkt nach U1
- **Begründung**: Bestimmt alle Overlays (LMS, Marktplatz)

## Compliance-Lücken

### **BFSG (L4) unterschätzt** — KONSENS: **MEHRHEIT** (3/4) ✅
- **Schärfen**: B2C-Web ist echte 🔴-Pflicht seit 2025
- **Ergänzen**: WCAG 2.2, EN 301 549 explizit nennen

### **TTDSG/Cookie-Consent fehlt** — KONSENS: **MEHRHEIT** (2/4) ⚠️
- **Ergänzen**: L8 (ePrivacy/Cookie-Consent) als separaten Knoten
- **Begründung**: Wird nur unter "Tracking" erwähnt

### **DSA/NetzDG fehlen** — KONSENS: **EINZELMEINUNG** (nur Claude)
- **Später prüfen**: Nur für große Plattformen relevant

## Nächste Schritte

### **SOFORT** (v0→v1)
1. **Frontend-Pivot hinzufügen** (P7: SSR/CSR, State Management)
2. **Storage-Knoten** (U8: File Uploads + RLS) 
3. **API-Design-Knoten** (REST/GraphQL-Entscheidung)
4. **Fehlklassifikation korrigieren**: U6+A1 auf 🔴
5. **Legal-Knoten zusammenlegen**: L3+L5, L6+L7

### **BALD** (v1.1)
1. **Baum-Struktur korrigieren**: P0 vor universelle Knoten
2. **BFSG schärfen**: WCAG 2.2 konkret benennen  
3. **D8 Schema-Hygiene** auf späteren Review-Knoten verschieben
4. **U2/U6** zu P2-Supabase-Ast verschieben

### **SPÄTER** (v2.0)
1. **Testing-Strategie** evaluieren (zu enterprise-lastig?)
2. **Cookie-Consent** (L8) als separaten Compliance-Knoten
3. **Performance-Budget** Knoten hinzufügen
4. **Internationalisierung** (i18n) evaluieren

**Kernerkenntnis**: Das Korsett ist zu datenbank-/compliance-lastig und vernachlässigt Frontend-Architektur komplett. Die Zielgruppe (Solo-Coder) braucht weniger Legal-Granularität, dafür mehr praktische Architektur-Entscheidungen.

---

## Kosten

| Modell           | In-Tok  | Out-Tok | Kosten   |
|------------------|---------|---------|----------|
| Claude Sonnet    |    7952 |    1379 | €0.0414 |
| GPT-4o           |    5933 |     832 | €0.0215 |
| Gemini 2.5 Pro   |    6143 |    2044 | €0.0262 |
| Grok 4           |    6208 |    1543 | €0.0388 |
| Judge (Opus)     |    4480 |    2216 | €0.2171 |
| **Gesamt**       |         |         | **€0.3450** |
