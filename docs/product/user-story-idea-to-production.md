# Tropen OS — Der geführte Weg von der Idee zum Produkt
## User Story: Vibe Coding mit Leitplanken

> **Vision:** Tropen OS ist nicht nur ein Audit-Tool das hinterher meckert. Es ist ein **Begleiter** der den User von der ersten Idee bis zum produktionsreifen Launch führt — Schritt für Schritt, mit den Agenten als Leitplanken.

---

## Überblick: Die 7 Phasen

```
Phase 0  IDEE          Wo stehst du? Was hast du schon?
Phase 1  SCOPE         Was genau baust du? Für wen? Warum?
Phase 2  RECHERCHE     Gibt es das schon? Was kannst du nutzen?
Phase 3  ANFORDERUNGEN Was musst du beachten? (Recht, Technik, UX)
Phase 4  ARCHITEKTUR   Wie ist die App aufgebaut? Stack + Struktur
Phase 5  SETUP         Template + Konfiguration + erste Seite
Phase 6  BUILD         Feature für Feature — mit Quality Loop
Phase 7  LAUNCH        Deployment, Monitoring, Go-Live-Checkliste
```

Jede Phase hat Unterpunkte, Entscheidungshilfen, und eine Checkliste die erfüllt sein muss bevor es weitergeht.

---

## Phase 0: IDEE — Wo stehst du?

### Der Einstieg

Tropen OS fragt nicht sofort "welcher Tech-Stack" — es fragt: **wo stehst du mit deiner Idee?**

```
Willkommen bei Tropen OS.

Wo stehst du gerade?

○ Ich habe eine vage Idee
  → Wir helfen dir sie zu schärfen

○ Ich weiß was ich bauen will, aber nicht wie
  → Wir helfen dir mit Stack, Architektur und Plan

○ Ich habe schon einen Prototyp / Code
  → Wir scannen ihn und zeigen was fehlt

○ Ich habe ein fertiges Projekt und will es verbessern
  → Direkt zum Audit
```

### 0.1 Vage Idee → Schärfen

Ein geführtes Interview (KI-gestützt, nicht nur Formular):

```
Was ist das Problem das du lösen willst?
→ "Hundebesitzer finden schwer gute Hundesitter"

Wer hat dieses Problem?
→ "Hundebesitzer in Großstädten"

Wie lösen sie es heute?
→ "Facebook-Gruppen, Nachbarn fragen, Rover.com"

Was wäre anders an deiner Lösung?
→ "Lokaler Fokus, verifizierte Sitter, Echtzeit-Verfügbarkeit"

Wie würdest du Geld verdienen?
→ "Provision pro Buchung"
```

Output: ein **Projekt-Briefing** — eine Seite die das Projekt zusammenfasst. Wird gespeichert und ist die Basis für alles Weitere.

### 0.2 Weiß was, aber nicht wie

User hat eine klare Vorstellung aber keine technische Erfahrung:

```
Beschreibe dein Projekt in 2-3 Sätzen:
→ "Eine Plattform wo Hundebesitzer verifizierte Hundesitter 
   in ihrer Nähe finden und buchen können."

Was sind die wichtigsten Features? (max 5)
→ 1. Sitter-Profile mit Bewertungen
  2. Echtzeit-Verfügbarkeit + Buchung
  3. Chat zwischen Besitzer und Sitter
  4. Bezahlung über die Plattform
  5. GPS-Tracking während der Betreuung
```

Output: **Feature-Liste mit Priorisierung** (MVP vs. V2 vs. Nice-to-have).

### 0.3 Hat schon Code

→ Direkt zu Phase 6 (Build) mit vorgeschaltetem Scan.
→ Tropen OS scannt den bestehenden Code, zeigt den Score, und empfiehlt ob es sinnvoll ist weiterzubauen oder ein sauberes Fundament zu legen.

### Phase-0-Checkliste

```
□ Projekt-Briefing vorhanden (Problem, Zielgruppe, Lösung)
□ Grobe Feature-Liste (was soll die App können?)
□ Monetarisierung geklärt (oder bewusst "erstmal nicht")
□ Commitment: will ich das wirklich bauen?
```

---

## Phase 1: SCOPE — Was genau baust du?

### 1.1 Zielgruppe definieren

Nicht nur "Hundebesitzer" — sondern:

```
Wer nutzt die App?

○ Endverbraucher (B2C)
  → DSGVO + BFSG + Cookie Consent + Barrierefreiheit
  → Performance kritisch (Mobile, langsame Netze)
  → SEO wichtig

○ Geschäftskunden (B2B / SaaS)
  → Multi-Tenancy + Rollen + Teams
  → Onboarding + Dokumentation
  → API / Integrationen

○ Internes Team
  → Weniger Compliance-Druck
  → Performance weniger kritisch
  → Auth über bestehendes System

○ Entwickler (Developer Tool)
  → CLI + API first
  → Dokumentation kritisch
  → Open Source?
```

Jede Antwort aktiviert automatisch die relevanten Agenten und setzt N/A-Kategorien.

### 1.2 MVP definieren

```
Deine 5 Features — was davon ist MVP?

Feature                          MVP?    V2?    Nice-to-have?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sitter-Profile + Bewertungen     [MVP]   [ ]    [ ]
Echtzeit-Verfügbarkeit + Buchung [MVP]   [ ]    [ ]
Chat                             [ ]     [V2]   [ ]
Bezahlung                        [ ]     [V2]   [ ]
GPS-Tracking                     [ ]     [ ]    [Nice]

→ Dein MVP hat 2 Features. Das ist realistisch für 2-4 Wochen.
  Chat und Bezahlung kommen in V2. GPS-Tracking ist Nice-to-have.
```

### 1.3 Wettbewerb & Differenzierung

KI-gestützte Recherche (Web Search):

```
Wir haben ähnliche Produkte gefunden:

→ Rover.com — Marktführer USA, nicht EU-fokussiert
→ PawHero — DE, aber nur Dogsitting, keine Echtzeit
→ Leinentausch — DE, Community-basiert, kein Booking

Deine Differenzierung:
"Lokaler Fokus DE + verifizierte Sitter + Echtzeit-Buchung"

Ist das stark genug? [Ja, weiter] [Nein, schärfen]
```

### 1.4 Business Model (optional aber empfohlen)

```
Wie verdient die App Geld?

○ Provision pro Transaktion (z.B. 15% pro Buchung)
○ Abo-Modell (monatlich/jährlich)
○ Freemium (Basis kostenlos, Premium-Features)
○ Einmalkauf
○ Werbung
○ Noch unklar — erstmal bauen
```

### Phase-1-Checkliste

```
□ Zielgruppe definiert (B2C/B2B/Intern/Dev)
□ MVP-Features festgelegt (max 3-5)
□ V2-Features identifiziert (was kommt später)
□ Wettbewerber recherchiert
□ Differenzierung formuliert
□ Business Model skizziert (oder bewusst "später")
```

---

## Phase 2: RECHERCHE — Muss das Rad neu erfunden werden?

### 2.1 Open-Source-Alternativen prüfen

Bevor eine Zeile Code geschrieben wird: gibt es schon etwas das funktioniert?

```
Für dein Projekt "Hundesitter-Plattform" haben wir gefunden:

Open-Source Marketplace Templates:
→ Medusa.js — Open-Source E-Commerce (Booking-fähig)
→ Saleor — Headless Commerce mit API
→ Cal.com — Open-Source Booking-System

Starter Templates:
→ next-saas-starter — Auth + Billing + Dashboard
→ Shipfast — Next.js Boilerplate mit Stripe
→ Supabase + Next.js Starter

Relevante Libraries:
→ @calcom/embed — Booking-Widget
→ react-big-calendar — Kalender-UI
→ mapbox-gl — Karten für Standort-Suche

Empfehlung: 
Statt eine Booking-Engine von Grund auf zu bauen, 
könntest du Cal.com als Basis nehmen und darauf aufbauen.
Das spart ~4 Wochen Entwicklung.

[Auf Cal.com aufbauen] [Selbst bauen] [Mehr Optionen]
```

### 2.2 Bestehende Dienste identifizieren

Nicht alles selbst bauen — Services nutzen wo sinnvoll:

```
Für dein Projekt empfehlen wir folgende Dienste:

Auth:        Supabase Auth (kostenlos bis 50K User)
Datenbank:   Supabase Postgres (kostenlos bis 500 MB)
Bezahlung:   Stripe (V2, 2.9% + 30ct pro Transaktion)
E-Mail:      Resend (kostenlos bis 3K/Monat)
Maps:        Mapbox (kostenlos bis 50K Loads/Monat)
Hosting:     Vercel (kostenlos für Hobby)
Monitoring:  Sentry (kostenlos bis 5K Events/Monat)
Analytics:   Plausible (€9/Monat, DSGVO-konform)
Chat:        Stream.io (V2, kostenlos bis 25 User)

Geschätzte monatliche Kosten für MVP: €0-9/Monat
Geschätzte Kosten bei 1000 Usern: ~€50/Monat

[Diese Dienste nutzen] [Alternativen zeigen] [Anpassen]
```

### 2.3 Design-Inspiration

```
Design-Inspiration für Marketplace-Apps:

→ Dribbble: "pet sitting app" — 47 Ergebnisse
→ Behance: "booking platform" — 128 Ergebnisse
→ Mobbin: Ähnliche Apps (Rover, Wag, Trusthousesitters)

UI-Kits die passen:
→ shadcn/ui — kostenlos, Tailwind-basiert, sehr beliebt
→ Radix UI — Headless, barrierefrei, flexibel
→ Tremor — Dashboard-Komponenten (wenn Admin-Panel nötig)

Icon-Libraries:
→ Phosphor Icons — 9000+ Icons, alle Stile
→ Lucide — Fork von Feather Icons
→ Heroicons — Von Tailwind-Team

[shadcn/ui verwenden] [Andere wählen]
```

### Phase-2-Checkliste

```
□ Open-Source-Basis geprüft (build vs. fork vs. use)
□ Externe Dienste gewählt (Auth, DB, Payment, etc.)
□ Kosten geschätzt (MVP + bei Wachstum)
□ Design-Richtung festgelegt (UI-Kit, Icon-Library)
□ Entscheidung dokumentiert: was bauen wir selbst, was nutzen wir?
```

---

## Phase 3: ANFORDERUNGEN — Was musst du beachten?

### 3.1 Rechtliche Anforderungen (automatisch aus Phase 1 abgeleitet)

```
Basierend auf deinem Profil (B2C, EU, Marketplace):

PFLICHT:
☑ DSGVO — Datenschutzerklärung, Cookie Consent, 
  Datenexport, Löschrecht
☑ BFSG — Barrierefreiheitserklärung, WCAG 2.1 AA 
  (seit 28.06.2025)
☑ Impressumspflicht — Name, Adresse, Kontakt
☑ AGB — Nutzungsbedingungen für Marketplace

WENN PAYMENT (V2):
☐ PCI-DSS — wird durch Stripe abgedeckt
☐ Widerrufsrecht — 14 Tage bei Dienstleistungen
☐ Rechnungslegung — Pflichtangaben auf Rechnungen

WENN KI-FEATURES:
☐ AI Act — Transparenzpflicht, Risiko-Klassifizierung

→ Tropen OS aktiviert automatisch: DSGVO_AGENT, BFSG_AGENT
→ AI_ACT_AGENT wird aktiviert sobald KI-Features gebaut werden
```

### 3.2 Technische Anforderungen

```
Aus deinem Scope ergeben sich:

Performance:
□ Mobile-first (60%+ der Hundebesitzer nutzen Smartphone)
□ Core Web Vitals im grünen Bereich
□ Bilder optimiert (Sitter-Fotos, Haustier-Fotos)
□ Offline-Fallback für Sitter-Kontaktdaten? → [Ja/Nein]

Sicherheit:
□ Auth für alle Buchungsfunktionen
□ Rate Limiting auf Registrierung + Login
□ Input-Validierung auf allen Formularen
□ HTTPS erzwungen

Skalierbarkeit:
□ Für wie viele User planst du? [100] [1000] [10000+]
  → Bei 100: Supabase Free Tier reicht
  → Bei 10000: Caching-Strategie + CDN nötig

Barrierefreiheit:
□ Tastatur-Navigation für Buchungsprozess
□ Screen-Reader-Support für Sitter-Profile
□ Farbkontraste WCAG AA
□ Touch-Targets mindestens 44px
```

### 3.3 UX-Anforderungen

```
Kern-User-Journeys die funktionieren müssen:

Journey 1: Sitter finden
  Startseite → Standort eingeben → Sitter-Liste → 
  Profil ansehen → Verfügbarkeit prüfen → Anfrage senden

Journey 2: Sitter werden
  Registrierung → Profil erstellen → Verifizierung → 
  Verfügbarkeit einstellen → Erste Anfrage erhalten

Journey 3: Buchung abwickeln (V2)
  Anfrage bestätigen → Bezahlen → Tracking → Bewertung

Jede Journey wird später als E2E-Test implementiert.
```

### Phase-3-Checkliste

```
□ Rechtliche Anforderungen identifiziert
□ Relevante Agenten aktiviert (DSGVO, BFSG, etc.)
□ Performance-Ziele definiert
□ Sicherheits-Baseline festgelegt
□ Kern-User-Journeys definiert (max 3 für MVP)
□ N/A-Kategorien markiert (was nicht relevant ist)
```

---

## Phase 4: ARCHITEKTUR — Wie ist die App aufgebaut?

### 4.1 Tech-Stack Empfehlung

Basierend auf den Anforderungen empfiehlt Tropen OS einen Stack:

```
Empfohlener Stack für "Hundesitter-Marketplace":

Framework:    Next.js 15 (App Router)
  → Warum: SSR für SEO, API Routes, Vercel-Deploy
  
Sprache:      TypeScript (strict mode)
  → Warum: Typsicherheit, bessere Fehlererkennung

Datenbank:    Supabase (PostgreSQL + Auth + Storage)
  → Warum: Kostenlos starten, Auth included, EU-Server

Styling:      Tailwind CSS + shadcn/ui
  → Warum: Schnell, responsive, barrierefrei

Deployment:   Vercel
  → Warum: Zero-Config für Next.js, Preview Deploys

Testing:      Vitest + Playwright
  → Warum: Schnell, Next.js-kompatibel

Monitoring:   Sentry
  → Warum: Error-Tracking, Performance

[Diesen Stack verwenden] [Stack anpassen] [Eigenen Stack]
```

### 4.2 Datenbankdesign

```
Vorgeschlagenes Schema für deinen MVP:

users (Supabase Auth)
  → id, email, name, role (owner/sitter/both)

sitter_profiles
  → id, user_id FK, bio, location (PostGIS), 
    hourly_rate, verified, avatar_url

availability
  → id, sitter_id FK, date, start_time, end_time, 
    status (available/booked)

bookings (V2)
  → id, owner_id FK, sitter_id FK, date, status,
    amount, payment_status

reviews
  → id, booking_id FK, rating (1-5), text, created_at

Indexes:
  → sitter_profiles(location) — für Standort-Suche
  → availability(sitter_id, date) — für Kalender
  → reviews(sitter_id) — für Durchschnittsbewertung

RLS Policies:
  → Jeder kann Sitter-Profile sehen
  → Nur eigene Bookings sehen/erstellen
  → Nur eigene Reviews schreiben
```

### 4.3 Seitenstruktur

```
Vorgeschlagene Seiten:

Öffentlich:
  / — Landing Page (Suche + Top-Sitter)
  /suche — Sitter-Suche mit Karte
  /sitter/[id] — Sitter-Profil
  /registrieren — Registrierung
  /login — Login
  /datenschutz — Datenschutzerklärung
  /impressum — Impressum
  /barrierefreiheit — Barrierefreiheitserklärung
  /agb — AGB

Authentifiziert:
  /dashboard — Meine Buchungen / Meine Anfragen
  /profil — Eigenes Profil bearbeiten
  /nachrichten — Chat (V2)

Admin (V2):
  /admin — Sitter-Verifizierung, Reports

API:
  /api/sitter — Suche, CRUD
  /api/bookings — Buchungen (V2)
  /api/reviews — Bewertungen
```

### Phase-4-Checkliste

```
□ Tech-Stack gewählt und begründet
□ Datenbankschema entworfen
□ Seitenstruktur definiert
□ API-Endpoints geplant
□ Auth-Strategie festgelegt
□ Hosting-Plan (kostenlos starten → skalieren)
```

---

## Phase 5: SETUP — Template + Konfiguration

### 5.1 Projekt-Template generieren

Tropen OS generiert ein vorkonfiguriertes Projekt das **bereits bei 60% Audit-Score startet**:

```
Dein Projekt wird erstellt...

✓ Next.js 15 + TypeScript (strict mode)
✓ Supabase Client konfiguriert
✓ Auth (Login, Register, Password Reset)
✓ Tailwind + shadcn/ui installiert
✓ ESLint + Prettier konfiguriert
✓ Error-Handling Pattern (AppError + Error Boundary)
✓ Structured Logging (createLogger)
✓ Security Headers (CSP, HSTS, X-Frame-Options)
✓ Cookie Consent Banner
✓ Datenschutzseite (Template)
✓ Impressum (Template — Daten ergänzen!)
✓ Barrierefreiheitserklärung (Template)
✓ .env.example mit allen benötigten Variablen
✓ CI/CD Pipeline (GitHub Actions: Lint + Test + Deploy)
✓ Vitest Setup + erste Tests
✓ Sentry Integration
✓ README.md mit Setup-Anleitung

Initialer Audit-Score: 62% (Risky)
→ Noch 28% bis Production Grade
→ Die rechtlichen Seiten brauchen deine echten Daten
→ Tests müssen für deine Features geschrieben werden
```

### 5.2 Projekt-Struktur

```
dein-projekt/
├── src/
│   ├── app/                    # Seiten (nur Routing)
│   │   ├── (public)/           # Öffentliche Seiten
│   │   │   ├── page.tsx        # Landing
│   │   │   ├── suche/          # Sitter-Suche
│   │   │   └── sitter/[id]/    # Sitter-Profil
│   │   ├── (auth)/             # Auth-Seiten
│   │   │   ├── login/
│   │   │   └── registrieren/
│   │   ├── (protected)/        # Authentifizierte Seiten
│   │   │   ├── dashboard/
│   │   │   └── profil/
│   │   ├── (legal)/            # Rechtliche Seiten
│   │   │   ├── datenschutz/
│   │   │   ├── impressum/
│   │   │   └── barrierefreiheit/
│   │   └── api/                # API Routes
│   ├── components/
│   │   ├── ui/                 # shadcn/ui Primitives
│   │   └── layout/             # Header, Footer, Nav
│   ├── lib/
│   │   ├── supabase.ts         # DB-Client
│   │   ├── auth.ts             # Auth-Helpers
│   │   ├── logger.ts           # Structured Logging
│   │   ├── errors.ts           # Error-Typen
│   │   └── validators/         # Zod-Schemas
│   ├── hooks/                  # Custom Hooks
│   └── types/                  # TypeScript-Typen
├── supabase/
│   └── migrations/             # DB-Migrationen
├── tests/                      # E2E Tests
├── .github/workflows/ci.yml    # CI/CD
├── .env.example                # Env-Template
└── README.md                   # Setup-Anleitung
```

### 5.3 Erste Konfiguration

```
Bevor du loslegst — ergänze diese Daten:

1. Impressum: Dein Name, Adresse, E-Mail
   → src/app/(legal)/impressum/page.tsx

2. Datenschutz: Verantwortlicher, Kontaktdaten
   → src/app/(legal)/datenschutz/page.tsx

3. Supabase: Projekt erstellen, Keys kopieren
   → .env.local

4. Vercel: Repository verbinden
   → Automatisches Deploy bei Push

[Ich bin fertig → erster Audit]
```

### Phase-5-Checkliste

```
□ Template generiert
□ Impressum mit echten Daten befüllt
□ Datenschutzerklärung angepasst
□ Supabase-Projekt erstellt + Keys konfiguriert
□ Vercel-Deploy eingerichtet
□ Erster Audit: Score ≥ 55%
□ Git-Repository initialisiert + erster Commit
```

---

## Phase 6: BUILD — Feature für Feature mit Quality Loop

### 6.1 Womit beginnen?

Die Reihenfolge ist nicht zufällig — sie folgt einer Logik:

```
Empfohlene Build-Reihenfolge:

Woche 1: Fundament
  1. Datenbankschema (Migrationen)
  2. Landing Page (SEO, erster Eindruck)
  3. Auth (Registrierung + Login)

Woche 2: Kern-Feature
  4. Sitter-Profil erstellen
  5. Sitter-Suche (mit Standort)
  6. Sitter-Detailseite

Woche 3: Interaktion
  7. Verfügbarkeits-Kalender
  8. Anfrage senden
  9. Dashboard (meine Anfragen)

Woche 4: Polish
  10. Bewertungen
  11. SEO-Optimierung
  12. Performance-Tuning
  13. Letzte Tests + Launch-Checkliste

Jedes Feature durchläuft:
  Beschreiben → Bauen → Scannen → Score prüfen → 
  Findings fixen → Weiter
```

### 6.2 Design — wann und wie?

```
Design-Ansatz für Vibe-Coders:

NICHT: Erst alles in Figma designen, dann umsetzen
  → Dauert zu lange, Ergebnis stimmt nie mit Code überein

STATTDESSEN: Design im Code

Schritt 1: shadcn/ui Komponenten nutzen (sofort gut aussehend)
Schritt 2: Layout bauen (Header, Footer, Grid)
Schritt 3: Farben + Fonts festlegen (CSS-Variablen)
Schritt 4: Feature bauen (funktional first)
Schritt 5: Look & Feel verfeinern (Spacing, Animationen)

Tools die helfen:
→ v0.dev — UI-Komponenten aus Prompts generieren
→ shadcn/ui Themes — vorgefertigte Farbpaletten
→ Tailwind UI — Premium-Komponenten (kostenpflichtig)
→ Realtime Colors — Farbpaletten-Generator

Design-Regel:
"Funktional first, schön second. Ein hässlicher Button 
der funktioniert ist besser als ein schöner Button 
der nicht gebaut wurde."
```

### 6.3 Der Quality Loop

Nach jedem Feature:

```
Feature gebaut
     ↓
Tropen OS: "Neuen Scan starten?"
     ↓
Scan läuft (30 Sekunden)
     ↓
Ergebnis:
  Score: 64% → 61% (-3%)
  
  Neue Findings:
  ⚠ Sitter-Suche: keine Input-Validierung auf PLZ
  ⚠ Sitter-Profil: Bilder ohne alt-Text
  ⚠ API Route /api/sitter: kein Rate Limiting
  
  Empfohlene Strategie:
  → Input-Validierung mit Zod (zentrale Lösung)
  → alt-Texte: Sitter-Name als Fallback
  → Rate Limiting: @upstash/ratelimit in Middleware
  
  [Aufgaben übernehmen] [Später] [Ignorieren]
     ↓
User übernimmt Aufgaben → exportiert als Prompt → 
gibt sie seiner KI → Findings gefixt → Re-Scan → 
Score steigt auf 65%
```

### 6.4 Open Source nutzen

Für jedes Feature: erst prüfen ob es eine gute Library gibt:

```
Du baust: Sitter-Suche mit Standort

Bevor du von null anfängst — diese Libraries lösen Teile:

Standort-Suche:
→ @mapbox/search-js-react — Adress-Autocomplete
→ react-map-gl — Karten-Darstellung
→ use-debounce — Input-Debouncing

Entfernungsberechnung:
→ Supabase PostGIS — ST_DWithin() in SQL
→ geolib — Client-seitig (Fallback)

Sitter-Liste:
→ @tanstack/react-table — Sortierung + Pagination
→ nuqs — Filter in URL-Params

[Libraries installieren] [Selbst bauen]
```

### Phase-6-Checkliste (pro Feature)

```
□ Feature beschrieben (was soll es tun?)
□ Libraries geprüft (gibt es was Fertiges?)
□ Feature gebaut
□ Scan durchgeführt
□ Score gehalten oder verbessert
□ Neue Findings als Aufgaben übernommen
□ Aufgaben abgearbeitet
□ Re-Scan: Score OK
```

---

## Phase 7: LAUNCH — Go-Live-Checkliste

### 7.1 Pre-Launch Audit

```
Launch-Readiness Check:

Score:           [mindestens 80% für Production Grade]
Security:        [mindestens 3.5/5]
Accessibility:   [mindestens 3.0/5]
Performance:     [Lighthouse ≥ 80]
Testing:         [mindestens 2.5/5]
Legal:           [Impressum ✓, Datenschutz ✓, AGB ✓]

Offene kritische Findings: 0
Offene High-Findings: max 5

[Launch-Ready? Ja/Nein]
```

### 7.2 Launch-Checkliste

```
Vor dem Launch:
□ Domain registriert + DNS konfiguriert
□ SSL/HTTPS funktioniert
□ Analytics eingerichtet (DSGVO-konform)
□ Error-Tracking aktiv (Sentry)
□ Backup-Strategie konfiguriert
□ Monitoring eingerichtet (Uptime)
□ SEO: Meta-Tags, OpenGraph, Sitemap
□ Social-Media-Accounts erstellt
□ E-Mail-Adresse für Support eingerichtet
□ Feedback-Möglichkeit im Footer

Am Launch-Tag:
□ DNS umschalten
□ SSL prüfen
□ Alle kritischen Journeys durchklicken
□ Erste User einladen
□ Monitoring-Dashboard beobachten

Nach dem Launch:
□ Täglicher Score-Check (erste Woche)
□ Error-Dashboard prüfen (erste 48h)
□ User-Feedback sammeln
□ Performance-Daten auswerten
□ Erster Re-Audit nach 1 Woche
```

### 7.3 Post-Launch: Monitoring

```
Tropen OS überwacht dein Projekt nach dem Launch:

Täglich:
→ Dependency-Check: neue CVEs?
→ Error-Rate: Anomalien?

Wöchentlich:
→ Re-Audit: Score-Trend
→ Performance: Core Web Vitals

Bei Problemen:
→ Alert per E-Mail/Slack
→ Finding mit Empfehlung im Dashboard
→ Aufgabe automatisch erstellt
```

---

## Was Tropen OS dafür braucht

### Neue Features (priorisiert)

```
Sprint A:  Geführtes Onboarding (Phase 0-3)
           → Interview-Flow, Projekt-Briefing, Feature-Priorisierung
           → Automatische Agenten-Aktivierung
           → Anforderungs-Checklisten

Sprint B:  Projekt-Templates (Phase 5)
           → Next.js + Supabase + Tailwind Starter
           → Vorkonfiguriert mit Auth, Error-Handling, Legal Pages
           → Initialer Score ≥ 55%

Sprint C:  Library-Empfehlungen (Phase 2 + 6)
           → Web Search nach relevanten Libraries
           → Open-Source-Alternativen-Check
           → Kosten-Schätzung für externe Dienste

Sprint D:  Build-Modus (Phase 6)
           → Feature-für-Feature-Flow
           → Quality Loop nach jedem Build
           → Aufgaben-Export als Prompt

Sprint E:  Launch-Checkliste (Phase 7)
           → Pre-Launch Audit mit Schwellenwerten
           → Go-Live-Checkliste
           → Post-Launch Monitoring
```

### Bestehende Features die genutzt werden

```
✅ Audit Engine (25+ Agenten, 195 Regeln)
✅ Repo Map (Kontext für Empfehlungen)
✅ Score + Trend (Quality Loop)
✅ Aufgabenliste + Prompt-Export
✅ Strategie-Empfehlungen (gruppierte Findings)
✅ Stack-Detection (Auto-Detect aus package.json)
✅ Relevanz-Profiling (welche Agenten gelten)
✅ File System API (externes Projekt scannen)
```

---

## Die Vision

```
Heute:     "Hier ist ein Audit-Tool, viel Spaß."
           User scannt, sieht 400 Findings, ist überfordert.

Morgen:    "Erzähl mir von deiner Idee."
           Tropen OS führt von der Idee zum Launch.
           Jeder Schritt hat Leitplanken.
           Der User kann nicht falsch abbiegen.
           Am Ende steht ein Produkt mit 85% Audit-Score.
```
