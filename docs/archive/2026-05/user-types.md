# Tropen OS — Drei User-Typen, drei Journeys
## Ergänzung zum Gesamtkonzept "Idee zu Production Grade"

> **Erkenntnis:** Das ursprüngliche Konzept behandelt nur den Solo-Gründer der bei null anfängt. Aber es gibt mindestens drei fundamental verschiedene User-Typen mit komplett unterschiedlichen Bedürfnissen, Risiken und Journeys.

---

## Überblick: Die drei Typen

```
┌──────────────────────────────────────────────────────────┐
│                    TROPEN OS                              │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │
│  │   HOBBY    │  │   GRÜNDER  │  │    BUSINESS        │  │
│  │            │  │            │  │                    │  │
│  │ Spaß &     │  │ MVP →      │  │ Integration in     │  │
│  │ Lernen     │  │ Launch     │  │ bestehende Systeme │  │
│  │            │  │            │  │                    │  │
│  │ Keine      │  │ Volle      │  │ Enterprise         │  │
│  │ Compliance │  │ Compliance │  │ Security + Teams   │  │
│  │            │  │            │  │                    │  │
│  │ Speedrun   │  │ Guided     │  │ Controlled         │  │
│  └────────────┘  └────────────┘  └────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

---

## Typ 1: HOBBY-VIBER

### Profil

```
Wer:          Studenten, Bastler, Kreative, Neugierige
Motivation:   Spaß, Lernen, Portfolio, Nebenprojekte
Budget:       €0 — kostenlose Tools und Hosting
Team:         Allein
Erfahrung:    Wenig bis mittel
Zeitdruck:    Keiner — es ist ein Hobby
Compliance:   Irrelevant (App nicht öffentlich oder nur für Freunde)
```

### Was er braucht

- In 5 Minuten ein Ergebnis sehen
- Kein Zwang zu Planung oder Compliance
- Trotzdem lernen was gute Qualität ist
- Ermutigung statt Maßregelung
- Kostenlos nutzbar

### Was er NICHT braucht

- DSGVO-Checklisten
- Business Model Canvas
- Wettbewerbsanalyse
- Multi-Tenancy
- CI/CD Pipeline
- Rate Limiting

### Journey

```
"Was willst du bauen?"
→ "Eine Wetter-App für mich"

Track: SPEEDRUN
  1. Template wählen (oder leer starten)
  2. Sofort bauen
  3. Score als Gamification ("du bist bei 45% — schaffst du 60%?")
  4. Tipps statt Findings ("Tipp: füge alt-Texte zu deinen Bildern 
     hinzu — das ist gute Praxis und verbessert deinen Score")
  5. Deploy auf Vercel (kostenlos)

Agenten: Nur die Basics aktiv
  ✅ Code-Qualität (Clean Code lernen)
  ✅ Architektur (gute Gewohnheiten aufbauen)
  ✅ Performance (Core Web Vitals verstehen)
  ❌ DSGVO (nicht relevant)
  ❌ BFSG (nicht relevant)
  ❌ AI Act (nicht relevant)
  ❌ Supply Chain (Overkill)
  ❌ Backup & DR (nicht relevant)
```

### Ton und Sprache

```
NICHT: "⚠ Critical: Datenschutzerklärung fehlt. 
       DSGVO Art. 13 Verstoß. Bußgeldrisiko."

SONDERN: "💡 Tipp: Wenn du die App mal öffentlich machen willst, 
         brauchst du eine Datenschutzseite. Sollen wir eine 
         vorbereiten?"
```

### Gamification

```
Achievements (optional, motivierend):
  🏅 "Erster Scan" — Projekt zum ersten Mal gescannt
  🏅 "50% Club" — Score über 50%
  🏅 "Clean Coder" — Keine Code-Qualitäts-Findings
  🏅 "Accessibility Hero" — Alle A11y-Checks bestanden
  🏅 "Security Minded" — Keine Security-Findings

Score als positiver Fortschritt:
  "Du bist bei 52%! Letzte Woche waren es 38%. 
   Noch 8% bis Stable."
```

---

## Typ 2: SOLO-GRÜNDER

### Profil

```
Wer:          Unternehmer, Freelancer, Indie Hacker
Motivation:   Produkt bauen, Geld verdienen, Problem lösen
Budget:       Gering bis mittel (€0-500/Monat)
Team:         Allein oder mit 1-2 Freelancern
Erfahrung:    Variiert — von "kann prompten" bis "Full-Stack-Dev"
Zeitdruck:    Hoch — Runway brennt
Compliance:   Pflicht sobald öffentlich (DSGVO, BFSG, Impressum)
```

### Was er braucht

- Strukturierte Führung (aber nicht zu langsam)
- Compliance von Anfang an (nicht nachher)
- Kosten im Blick (API-Kosten, Hosting-Kosten)
- Launch-Readiness als messbares Ziel
- Aufgabenlisten für seine Coding-KI

### Journey

Das bestehende 7-Phasen-Konzept — aber mit dem Quick-Start-Track als Option:

```
Quick Start (empfohlen):
  1. "Was baust du?" (1 Satz)
  2. "Für wen?" (B2C/B2B/Intern)
  3. Template wählen (SaaS/Marketplace/API)
  4. Sofort bauen mit Quality Loop
  5. Compliance-Fragen kommen WÄHREND des Bauens
     (nicht vorher als Blocker)

Guided (für Gründliche):
  Alle 7 Phasen wie im Konzept beschrieben
```

### Agenten: Vollständig aktiv

```
Alle relevanten Agenten basierend auf Profil:
  ✅ Alles aus Hobby-Track
  ✅ DSGVO (B2C/B2B in EU)
  ✅ BFSG (B2C)
  ✅ AI Act (wenn KI-Features)
  ✅ Security (öffentliche App)
  ✅ Testing (Launch-Readiness)
  ✅ CI/CD (Deploy-Pipeline)
  ✅ Observability (nach Launch)
  ✅ Cost Awareness (Budget im Blick)
```

---

## Typ 3: BUSINESS / ENTERPRISE

### Profil

```
Wer:          Unternehmen mit bestehendem Tech-Stack
Motivation:   Neues Feature/Produkt, aber es muss in die 
              bestehende Infrastruktur passen
Budget:       Vorhanden — Qualität > Geschwindigkeit
Team:         Dev-Team (2-50 Entwickler)
Erfahrung:    Gemischt — Devs + Nicht-Devs die viben wollen
Zeitdruck:    Projekt-abhängig
Compliance:   Branchenspezifisch + Enterprise-Security
```

### Was er braucht

Alles aus Typ 2, plus eine komplett neue Dimension: **Integration in bestehende Systeme.**

### 3.1 Bestehende Datenbank

```
Das Unternehmen hat bereits eine PostgreSQL/MySQL/Oracle DB 
mit Kunden, Bestellungen, Produkten. Die neue App muss 
darauf zugreifen.

Fragen die Tropen OS stellen muss:
  - Welche DB? (PostgreSQL, MySQL, MSSQL, Oracle, MongoDB)
  - Lese-Zugriff oder auch Schreib-Zugriff?
  - Gibt es ein API-Layer davor oder Direkt-Zugriff?
  - Gibt es ein Schema das wir lesen können?
  - Wer verwaltet die DB? (DBA-Team, Cloud-Provider)

Risiken:
  ⚠ Direkt-Zugriff auf Produktions-DB = gefährlich
  ⚠ Schema-Änderungen können bestehende Apps brechen
  ⚠ Datenschutz: welche Felder sind PII?
  ⚠ Performance: neue Queries können bestehende Indexes belasten

Empfehlung von Tropen OS:
  "Bau KEINE direkte DB-Verbindung. Nutze die bestehende API 
   oder baue einen Read-Only View für die neue App.
   Wenn du schreiben musst: über die bestehende API, nicht direkt."

Agenten-Regeln die aktiviert werden:
  → DATABASE_AGENT: Least Privilege, keine DDL-Rechte
  → SECURITY_AGENT: Connection Strings nicht im Code
  → ARCHITECTURE_AGENT: Abstraktionsschicht zwischen App und DB
```

### 3.2 Bestehende Auth / SSO

```
Das Unternehmen nutzt Active Directory / Okta / 
Azure AD / SAML. Die neue App muss sich eingliedern.

Fragen:
  - Welches SSO-System? (SAML, OIDC, LDAP)
  - Gibt es bestehende Rollen/Gruppen?
  - Wer verwaltet User? (IT-Team, HR)
  - Muss die App offline funktionieren? (Cached Auth?)

Risiken:
  ⚠ DIY-Auth neben Enterprise-SSO = Shadow IT
  ⚠ Rollen-Mapping zwischen SSO und App ist komplex
  ⚠ Token-Handling: Refresh-Flows bei Enterprise-SSO anders
  ⚠ MFA-Requirements des Unternehmens müssen erfüllt werden

Empfehlung:
  "Nutze den bestehenden Identity Provider. Baue KEINE eigene 
   User-Verwaltung. NextAuth.js / Auth.js mit OIDC-Provider 
   verbinden."

Agenten-Regeln:
  → SECURITY_AGENT: SSO-Integration prüfen
  → ARCHITECTURE_AGENT: Kein eigener User-Store wenn SSO vorhanden
```

### 3.3 Bestehende APIs / Microservices

```
Das Unternehmen hat interne APIs (REST, gRPC, GraphQL) 
die die neue App konsumieren soll.

Fragen:
  - Gibt es eine API-Dokumentation? (OpenAPI/Swagger)
  - Wie authentifiziert man sich? (API Key, OAuth, mTLS)
  - Gibt es Rate Limits?
  - Gibt es ein API Gateway? (Kong, Apigee, AWS API Gateway)
  - VPN/Firewall-Zugang nötig?
  - Sind die APIs stabil oder ändern sie sich häufig?

Risiken:
  ⚠ Interne APIs fallen aus → App braucht Fallback
  ⚠ API-Versioning: interne APIs haben oft keine Versionierung
  ⚠ Daten-Konsistenz bei mehreren APIs als Source
  ⚠ Latenz: interne APIs hinter VPN/Firewall sind langsamer

Empfehlung:
  "Jede interne API hinter einer Abstraktionsschicht kapseln. 
   Fallback für jeden externen Call. Timeout + Retry + 
   Circuit Breaker Pattern."

Agenten-Regeln:
  → API_AGENT: Resilience-Patterns, Abstraktionsschicht
  → OBSERVABILITY_AGENT: Tracing über Service-Grenzen
  → ERROR_HANDLING_AGENT: Fallbacks für jeden externen Call
```

### 3.4 Dev-Team Integration

```
Das Team hat bestehende Workflows: Git-Branching, Code Reviews, 
CI/CD, Staging-Environments. Die Vibe-Coded App muss da rein.

Fragen:
  - Welches Git-Workflow? (GitFlow, Trunk-based, Feature-Branches)
  - Code Reviews nötig? (min. 1 Approval vor Merge)
  - Welches CI/CD? (GitHub Actions, Jenkins, GitLab CI, Azure DevOps)
  - Gibt es Staging/QA-Environments?
  - Gibt es Code-Ownership? (CODEOWNERS)
  - Welche Coding-Standards gelten? (Firmen-Linter-Config?)
  - Gibt es ein Monorepo oder separate Repos?

Herausforderungen:
  ⚠ Vibe-Coder committet direkt auf main
  ⚠ Vibe-Coder nutzt npm install statt des firmeninternen 
    Package-Managers
  ⚠ Vibe-Coder umgeht Code Review weil "die KI hat's ja geprüft"
  ⚠ Vibe-Coder erstellt Dateien die gegen Firmen-Konventionen verstoßen
  ⚠ KI-generierter Code passt nicht zum bestehenden Code-Stil
  ⚠ Parallel-Entwicklung: Vibe-Coder und Devs arbeiten 
    an denselben Dateien

Tropen OS Rolle:
  "Tropen OS ersetzt NICHT den Code-Review-Prozess des Teams. 
   Es ergänzt ihn: die Agenten-Regeln werden an die 
   Firmen-Standards angepasst, und der Audit läuft VOR dem 
   PR — nicht statt des Reviews."

Agenten-Regeln:
  → GIT_GOVERNANCE_AGENT: Branch-Schutz, Conventional Commits
  → CODE_STYLE_AGENT: an Firmen-Linter anpassen
  → ARCHITECTURE_AGENT: an bestehende Projektstruktur anpassen
```

### 3.5 Enterprise Security

```
Enterprise-Umgebungen haben Anforderungen die weit über 
Startup-Security hinausgehen:

Zertifizierungen:
  - SOC 2 Type II → Audit-Trail für alles
  - ISO 27001 → ISMS dokumentiert
  - PCI-DSS → wenn Payment involviert
  - HIPAA → wenn Gesundheitsdaten
  - FedRAMP → wenn US-Government

Network Security:
  - VPN-Zugang für interne APIs
  - Firewall-Rules für Outbound-Traffic
  - mTLS zwischen Services
  - No-Internet-Zugang in Production (Air-Gap)

Data Security:
  - Data Classification (Public/Internal/Confidential/Restricted)
  - Encryption at Rest + in Transit
  - Key Management (HSM, AWS KMS, Azure Key Vault)
  - Data Residency (Daten dürfen EU nicht verlassen)

Access Control:
  - Principle of Least Privilege (nicht nur für DB)
  - Privileged Access Management (PAM)
  - Audit Logging für jeden Datenzugriff
  - Break-Glass-Prozeduren für Notfälle

Tropen OS Rolle:
  Nicht alles davon ist durch Code-Analyse prüfbar. 
  Aber: Tropen OS kann prüfen ob die CODE-SEITIGE 
  Umsetzung stimmt:
  
  → Werden Secrets aus dem Vault geladen (nicht hardcoded)?
  → Gibt es Audit-Logging für Datenzugriffe?
  → Sind alle Verbindungen verschlüsselt (kein HTTP)?
  → Werden Daten-Klassifikationen im Code respektiert?
  → Gibt es ein RBAC-System mit Principle of Least Privilege?

Agenten:
  → SECURITY_AGENT: Enterprise-Modus mit erweiterten Regeln
  → SECURITY_SCAN_AGENT: branchenspezifische Patterns
  → DSGVO_AGENT: Data Residency Checks
  → Neuer Agent: ENTERPRISE_COMPLIANCE_AGENT
```

### 3.6 Multi-Umgebungs-Deployment

```
Enterprise hat nicht nur "localhost" und "Production":

Dev → Feature-Branch-Previews → Staging → QA → 
Pre-Production → Production → DR-Failover

Fragen:
  - Wie viele Environments?
  - Gibt es Infrastructure as Code? (Terraform, Pulumi)
  - Container-basiert? (Docker, Kubernetes)
  - Multi-Region?
  - Blue/Green oder Canary Deployments?
  - Wer hat Deploy-Rechte? (nur CI, oder manuell?)

Tropen OS Rolle:
  → PLATFORM_AGENT: Prüft ob IaC vorhanden
  → INFRASTRUCTURE_AGENT: Multi-AZ, Health Checks
  → Deployment-Checkliste pro Environment
```

### Enterprise-Journey (anders als Solo-Gründer)

```
Phase 0: KONTEXT VERSTEHEN
  - Bestehende Systeme inventarisieren (DBs, APIs, Auth)
  - Team-Workflows dokumentieren (Git, CI, Reviews)
  - Security-Anforderungen klären (Zertifizierungen)
  - Compliance-Anforderungen klären (Branche)
  
Phase 1: INTEGRATION PLANEN
  - Wie verbindet sich die neue App mit bestehenden Systemen?
  - Welche APIs werden konsumiert? Welche erstellt?
  - Wie passt die App in die bestehende Auth-Landschaft?
  - Wo wird deployed? Wer hat Zugriff?
  
Phase 2: AGENTEN ANPASSEN
  - Firmen-Linter-Config importieren → CODE_STYLE_AGENT anpassen
  - Firmen-Branching-Strategie → GIT_GOVERNANCE_AGENT anpassen
  - Branchenspezifische Compliance → zusätzliche Agenten aktivieren
  - Bestehende Architektur-Patterns → ARCHITECTURE_AGENT erweitern
  
Phase 3: TEMPLATE ANPASSEN
  - Firmen-Template nutzen (wenn vorhanden)
  - Oder: Tropen OS Template an Firmen-Standards anpassen
  - SSO-Integration vorkonfigurieren
  - Interne API-Clients einrichten
  
Phase 4: BUILD MIT GOVERNANCE
  - Quality Loop wie bei Solo-Gründer
  - PLUS: Code Reviews durch Team (nicht ersetzen)
  - PLUS: Staging-Deploy vor Production
  - PLUS: Security-Review vor Launch
  
Phase 5: LAUNCH MIT ENTERPRISE-CHECKLISTE
  - Alles aus Solo-Gründer Launch
  - PLUS: Penetration Test bestanden?
  - PLUS: Security Review durch CISO?
  - PLUS: Datenschutz-Folgenabschätzung (DSFA)?
  - PLUS: Change Management Prozess eingehalten?
  - PLUS: Runbooks für Ops-Team?
  - PLUS: SLA definiert?
```

---

## Agenten-Matrix nach User-Typ

```
Agent                  Hobby   Gründer   Business
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Architecture           ✅ lite  ✅ full    ✅ custom
Code Style             ✅       ✅         ✅ firmen-config
Security               ✅ lite  ✅ full    ✅ enterprise
Security Scan          ❌       ✅         ✅ erweitert
Observability          ❌       ✅         ✅ enterprise
Testing                ❌       ✅         ✅ pflicht
CI/CD                  ❌       ✅         ✅ firmen-pipeline
Database               ✅ lite  ✅         ✅ + DBA-Regeln
API                    ❌       ✅         ✅ + Resilience
Performance            ✅       ✅         ✅
Accessibility          ✅ tipps ✅ pflicht  ✅ pflicht
Design System          ✅ tipps ✅         ✅ firmen-tokens
Error Handling         ✅ lite  ✅         ✅
Dependencies           ❌       ✅         ✅ + SBOM
Git Governance         ❌       ✅         ✅ firmen-workflow
Cost Awareness         ❌       ✅         ✅
DSGVO                  ❌       ✅ (EU)    ✅ pflicht
BFSG                   ❌       ✅ (B2C)   ✅ (B2C)
AI Act                 ❌       ✅ (KI)    ✅ (KI)
Backup & DR            ❌       ✅ lite    ✅ enterprise
Infrastructure         ❌       ❌         ✅
Supply Chain           ❌       ✅ lite    ✅ full
Content / i18n         ❌       optional   ✅ wenn int'l
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Aktive Regeln:         ~30     ~120       ~195+
```

---

## Pricing-Implikation

```
Hobby:    KOSTENLOS
  → Basis-Scan, 3 Agenten, Score, Tipps
  → Kein Deep Review, keine Fix-Engine
  → Motiviert zum Upgrade wenn ernst wird

Gründer:  €19-49/Monat (oder Pay-per-Scan)
  → Alle Agenten, Deep Review, Aufgabenlisten
  → Quality Loop, Launch-Checkliste
  → 3 Projekte, unbegrenzte Scans

Business: €99-299/Monat pro Team
  → Alles aus Gründer
  → Custom Agenten (Firmen-Standards)
  → Team-Verwaltung, Rollen
  → SSO-Integration
  → Priority Support
  → Enterprise-Compliance-Agenten
  → API-Zugang für CI/CD-Integration
```

---

## Was das für Tropen OS bedeutet

### Neue Features die gebraucht werden

```
Für Hobby:
  → Lite-Modus (weniger Agenten, freundlicherer Ton)
  → Gamification (Achievements, Score als Spiel)
  → Kostenlos nutzbar

Für Gründer:
  → Das bestehende Konzept (7 Phasen, Quality Loop)
  → Templates (SaaS, Marketplace, API)
  → .cursorrules / CLAUDE.md Export

Für Business:
  → Custom Agenten (Firmen-Linter importieren)
  → SSO-Integration (OIDC/SAML)
  → Team-Verwaltung (wer darf was)
  → API für CI/CD-Integration (Scan als Pipeline-Step)
  → Enterprise-Compliance-Agenten (SOC2, ISO 27001)
  → Audit-Trail (wer hat wann welches Finding bearbeitet)
  → Import bestehender Coding-Standards
  → Bestehende DB/API-Inventarisierung
```

### Priorisierung (Vorschlag)

```
Jetzt (nächste 4 Wochen):
  → Hobby + Gründer als zwei Tracks implementieren
  → .cursorrules Export für die Top-30-Regeln
  → Templates (SaaS-Starter als erster)

Q3 2026:
  → Business-Track als Beta
  → Custom Agenten
  → Team-Verwaltung
  → CI/CD API

Q4 2026:
  → Enterprise-Compliance-Agenten
  → SSO-Integration
  → Audit-Trail
  → On-Premise Option (für Air-Gap-Kunden)
```

---

## Offene Fragen für das Komitee

```
1. Ist die Dreiteilung (Hobby/Gründer/Business) richtig,
   oder gibt es einen vierten Typ den wir übersehen?

2. Wie tief sollte die Enterprise-Integration gehen?
   (Import bestehender DB-Schemas? Firmen-Linter-Config 
   importieren? Oder reicht "hier sind die Regeln, passt 
   sie selbst an"?)

3. Ist Freemium (Hobby kostenlos) der richtige Einstieg,
   oder schreckt es zahlende Kunden ab?

4. Wie verhindert man dass der Business-Track zu komplex 
   wird und die Wartungs-Last explodiert?

5. Sollte das Enterprise-Feature ein separates Produkt sein
   (Tropen OS vs. Tropen OS Enterprise) oder ein Tier 
   im selben Produkt?
```
