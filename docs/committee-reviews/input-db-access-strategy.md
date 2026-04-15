# Committee Review: Database Access Strategy

## Kontext

Wir bauen einen Production Readiness Guide für Vibe-Coders.
Das Produkt scannt Quellcode und bewertet 25 Kategorien
(Security, Compliance, Architektur, Datenbank, etc.).

Positionierung: "Advisor not Mechanic" — wir finden Probleme,
erklären sie, und generieren Fix-Prompts die der User in sein
Coding-Tool (Cursor/Claude Code) kopiert.

Aktuell scannen wir NUR Code:
- Quellcode-Dateien (TypeScript, Config, etc.)
- Migrations-Dateien (SQL)
- Schema-Definitionen (Drizzle, Prisma, etc.)
- package.json, tsconfig, CI-Config

## Das Problem

Vibe-Coders arbeiten häufig über Provider-Dashboards
(Supabase Dashboard, PlanetScale UI, Neon Console, Firebase Console)
statt über Migrations-Dateien. Das bedeutet:

1. Der Code sagt etwas anderes als die Live-Datenbank
2. Policies (RLS), Indexes, Constraints können manuell gesetzt
   oder gelöscht worden sein ohne Spur im Code
3. Tabellen können existieren die keine Migration haben
4. Security-kritische Einstellungen (RLS, öffentliche Erreichbarkeit,
   Permissions) sind im Code nicht verifizierbar

Konkret: Wenn ein Vibe-Coder seine RLS falsch eingestellt hat,
sehen wir das im Code-Scan nicht. Bei Security und Compliance —
unseren wichtigsten Differenzierern — haben wir einen blinden Fleck.

## Fragen an das Committee

### 1. Brauchen wir DB-Zugriff für ein glaubwürdiges Produkt?
Können wir "Production Readiness" versprechen ohne die Live-DB
gesehen zu haben? Oder reicht Code-Analyse + ehrliche Kommunikation
der Grenzen? Wie gehen vergleichbare Tools damit um?

### 2. Welcher Zugriffs-Level ist der richtige?
Optionen (provider-agnostisch denken — nicht nur Supabase):

A) Kein DB-Zugriff — Code-only, Grenzen kommunizieren,
   "Schema-Drift-Check"-Prompt als Finding generieren

B) Schema-Metadaten only — read-only Zugriff auf:
   information_schema, pg_policies, pg_indexes, pg_roles
   Keine Produktionsdaten, kein PII-Zugriff
   Frage: Wie macht man das provider-agnostisch?

C) Management API der Provider — Supabase Management API,
   PlanetScale API, Neon API, Firebase Admin SDK
   Pro: kein direkter DB-Zugriff. Contra: pro Provider bauen

D) Connection String mit Read-Only-User —
   User erstellt eingeschränkten DB-User, wir prüfen Schema
   Pro: provider-agnostisch. Contra: Vertrauenshürde,
   Vibe-Coder wissen nicht wie man das macht

E) Hybrid — Code-Scan als Default, DB-Check als optionaler
   "Deep Scan" für zahlende User

### 3. Provider-Agnostik: Realistisch oder Illusion?
Welche Datenbanken nutzen Vibe-Coders tatsächlich?
Vermutlich: Supabase (Postgres), PlanetScale (MySQL),
Neon (Postgres), Firebase (Firestore), MongoDB Atlas, Turso (SQLite).
Können wir eine Abstraktionsschicht bauen die für alle funktioniert?
Oder fokussieren wir auf Postgres (Supabase + Neon = 80% des Markts)?

### 4. Security und Vertrauen
Wie überwinden wir die Vertrauenshürde?
Ein Vibe-Coder der gerade erst deployt hat, soll uns
DB-Zugriff geben? Was braucht es damit er das tut?
SOC2? Open Source? Lokale Analyse ohne Cloud?

### 5. Timing: Jetzt oder nach PMF?
Ist DB-Zugriff ein MVP-Feature oder ein Wachstums-Feature?
Können wir ohne DB-Zugriff die ersten 10 Beta-User gewinnen?
Ab wann wird der blinde Fleck zum Dealbreaker?

### 6. Impact auf Audit-Score
Aktuell bewertet die Datenbank-Kategorie (Gewicht 2) anhand von
Migrations-Dateien. Wenn wir DB-Zugriff hätten, welche neuen
Prüfungen werden möglich? Wie verändert sich die Aussagekraft
des Gesamt-Scores?

## Constraints

- Positionierung: "Advisor not Mechanic" — wir betreiben keine
  Datenbank, wir prüfen sie nur
- Kein PII-Zugriff — niemals Produktionsdaten lesen
- EU-Compliance: wir selbst müssen DSGVO-konform handeln
- Solo-Founder-Team: Aufwand muss realistisch sein
- Zielgruppe: Vibe-Coders, nicht Senior DBAs
- Preismodell: Free (10 Credits) + Gründer (€39/Mo) + Agency (€199/Mo)
