# Marken-Brief
## Quelle der Wahrheit für die Marken-Position

> **Datum:** 2026-04-27 (Update 2026-04-28: Pfeiler 6+9 erweitert, Pfeiler 11 + zweiter Anker-Satz neu)
> **Status:** Verbindlich für alle Design- und Copy-Entscheidungen
> **Aktueller Produktname:** Tropen OS (Platzhalter)
> **Geltungsbereich:** Landing-Page, App-UI, Dokumentation, Marketing-Material

---

## Was dieser Brief ist

Dieser Brief ist die **konsolidierte Marken-Position** nach dem Sparring vom 2026-04-27. Er ersetzt die bisherige Tropen-OS-Markenwelt (organische Tropen-Wärme, dominantes Grün, Production-Readiness-Guide-Strenge).

Jede zukünftige Design-, Copy- oder Produkt-Entscheidung wird gegen diesen Brief geprüft. Wenn etwas widersprüchlich ist: Brief gewinnt.

Wenn der Brief selbst angepasst werden soll, geschieht das **nur durch ADR** — nicht beiläufig.

---

## Die Marke in einem Satz

> **Ein älterer Geschwister-artiger Coach, der Vibe-Coder vom ersten Prompt zur Production-Reife begleitet — direkt, kompetent, mit Haltung.**

Wenn du diesen Satz nicht in der UI/dem Marketing wiederfindest, ist etwas falsch.

---

## Marken-Pfeiler

### 1. Position: Coach

Das Produkt ist **kein Werkzeug** und **kein Buddy**. Es ist ein **Coach**.

| Position | Was sie wäre | Warum nicht |
|----------|--------------|-------------|
| Werkzeug | Lighthouse, ESLint — du bedienst es | Distanziert, keine Beziehung, austauschbar |
| Buddy | Kumpel auf Augenhöhe | Zu nah, keine Autorität |
| **Coach** | **Mit Vorsprung, ermutigend, fordernd** | **Du wächst mit ihm — das ist das Versprechen** |

**Coach bedeutet:**
- Etwas weiß mehr als du (deshalb folgst du)
- Glaubt an dich (deshalb hörst du zu)
- Sagt was du **hören musst**, nicht was du **hören willst**
- Feiert mit dir, wenn du wächst
- Bleibt dran, auch wenn es schwierig wird

### 2. Charakter: Älteres Geschwister

Innerhalb der Coach-Position gibt es viele Persönlichkeiten. Die Marke ist **älteres Geschwister**.

| Charakter | Wäre wie | Wirkt |
|-----------|----------|-------|
| Erfahrener Mentor (Yoda, Huberman) | Distanziert-weise | Zu hierarchisch |
| **Älteres Geschwister** | **2-3 Jahre voraus, auf Augenhöhe** | **Kompetent ohne abgehoben** |
| Ruhiger Profi | Pilot-Stimme | Zu emotionsarm |
| Enthusiastischer Trainer | Crossfit-Coach | Zu inszeniert |

**Älteres Geschwister bedeutet:**
- Spricht direkt — kein Diplomatie-Geschwurbel
- Hat Humor — aber drängt ihn nicht auf
- Sagt "das ist Quatsch" wenn etwas Quatsch ist
- Erklärt warum, nicht nur was
- Behandelt dich als gleichwertig, weiß aber Sachen die du nicht weißt

**Das ist nicht:** Locker-kumpelhafter Buddy. Es ist nicht: Hipp-und-Witzig wie Slack-CRM-Tools. Es ist: jemand der dich respektiert und im Zweifel direkt ist.

### 3. Stimme: Senior-Engineer im PR-Review

Das Coach-Älteres-Geschwister-Wesen spricht **wie ein Senior-Engineer in einem guten Pull-Request-Review**: knapp + Kontext + Vorschlag.

**Stimm-Formel:**
```
[Beobachtung — was ist los]
+ [Konsequenz — warum ist das wichtig]
+ [Vorschlag — wie geht's weiter]
```

**Beispiele:**

> "ai-chat/index.ts ist mit 924 Zeilen ziemlich groß geworden. Das wird beim nächsten Refactor schwierig. Hier ist ein Vorschlag, wie du das aufteilst:"

> "Lighthouse-Score liegt bei 67. Du peilst 85+ an, das ist machbar. Top-3-Hebel:"

> "Score 78% — Stable. Da kannst du stolz sein. Wenn du noch eins drauflegen willst, hier sind die Hebel für 85+:"

**Verboten:**
- Marketing-Slang ("kick-ass", "ninja", "joyful")
- Erzwungene Lockerheit ("Hey du! 👋")
- Belehrender Ton ("Du solltest...")
- Übertriebene Höflichkeit ("Wir möchten freundlich darauf hinweisen, dass...")
- Emojis (sehr selten und nur als Status-Indikator: 🟢 🟡 🔴)

**Erlaubt:**
- Direkte Aussagen ("Das ist Pflicht.")
- Trockener Humor ohne Aufforderung zum Lachen ("924 Zeilen — das ist schon ein Roman.")
- Lob mit Maß ("Solide. Production-Grade.")
- Kritik mit Vorschlag ("Hier hakt's noch — schauen wir gleich rein.")

### 4. Compliance: Coach-Stimme + Pflicht-Tag

Compliance-Findings (DSGVO, BFSG, EU AI Act) brauchen besonderen Ernst, ohne die Coach-Stimme zu verlassen.

**Lösung:** Pflicht-Tag macht den Ernst sichtbar.

| Finding-Typ | Beispiel-Stimme |
|---|---|
| Code | "ai-chat ist mit 924 Zeilen groß. Aufteilen wäre clever." |
| Metrik | "Lighthouse 67. Ziel: 85+. Drei Hebel:" |
| **Compliance** | "**[DSGVO-Pflicht]** Datenexport-Endpoint fehlt. Art. 20 — nicht verhandelbar. So bekommst du das sauber:" |

**Pflicht-Tag-Varianten:**
- `[DSGVO-Pflicht]`
- `[BFSG-Pflicht]`
- `[EU-AI-Act-Pflicht]`
- `[Sicherheits-kritisch]` (für High-Severity-Code-Findings die rechtlich sensibel sind)

**Visuell:** Pflicht-Tags werden als kleines Badge in einer warmen Warnfarbe dargestellt — ähnlich wie ein roter Stempel. Das macht den Ernst sofort lesbar, ohne dass die Stimme wechseln muss.

### 5. Sichtbarkeit: Sichtbare Stimme, kein Persona

Die Coach-Stimme zeigt sich **überall wo das Tool spricht** — Findings, Headlines, Empty States, Loading, Score-Kommentare. Aber das Tool selbst ist der Coach. Es hat **keinen Namen, keinen Avatar, keine Ich-Form**.

**UI-Sprach-Beispiele:**

| UI-Element | Coach-Stil |
|---|---|
| Audit-Headline | "Schauen wir uns deinen Code an" |
| Empty State | "Lass uns loslegen — ich brauche nur dein Repo" |
| Loading | "Schaue mir gerade dein Repo an" |
| Score 90%+ | "Solide. Production-Grade-Niveau, da kannst du stolz sein." |
| Score < 50% | "Da ist noch Arbeit. Aber wir wissen ja jetzt wo." |
| Compliance erfüllt | "Erfüllt. Nichts zu tun." |
| Compliance offen | "Hier hakt's noch — schauen wir gleich rein." |
| 404 | "Diese Seite gibt's nicht. Vielleicht das hier?" |
| Audit lädt | "Geht durch deinen Code, einen Moment." |

**Disziplin:** Nicht jede Headline wird zur Coach-Aussage. Manche Begriffe bleiben sachlich (z.B. "Einstellungen", "Profil", "Audit-Report" als Seitentitel). Die Stimme zeigt sich da, wo das Tool **mit dem User spricht** — nicht da, wo es nur etikettiert.

**Toro / Mascot:** Mit dem Markenwechsel von Tropen weg verschwindet auch Toro als Mascot wahrscheinlich. Vorerst: kein neuer Mascot. Coach hat keine Figur.

---

## Visuelles System

### 6. Energie: Lebendiger Pragmatismus

**Was das bedeutet:**
- Hellgrundige Welt
- Zwei Akzentfarben (eine warm, eine kühl) für thematische Differenzierung
- Dezente Gradients als atmosphärische Schicht (nicht als Hauptmotiv)
- Lebendigere Typografie mit klaren Hierarchie-Sprüngen
- Wirkt arbeitend, nicht inszeniert

**Inspiration (Mix-Vorbild, nicht Kopie):**
- Vercel — Daten als Held, klare Typografie
- Plausible Analytics — sachlich ohne kalt zu sein
- Notion — Wärme ohne Kitsch
- Linear — Disziplin im Spacing
- GitHub — Engineer-Vertrautheit

**Was das nicht ist:**
- **Nicht** Stripe-Marketing-Polish (zu inszeniert für Coach-Stimme)
- **Nicht** Linear-Disziplin pur (zu kalt für ältere-Geschwister-Wärme)
- **Nicht** Storyblok-Joy (zu marketinghaft)
- **Nicht** Cursor-Dunkelheit (Hell-Theme bleibt)

#### Zwei visuelle Welten unter einer Marke

Die Coach-Stimme und Schiefer-Korb-Farbwelt sind durchgängig — aber die
visuelle Komposition unterscheidet sich klar zwischen Marketing und App:

| Bereich | Charakter | Vorbild |
|---------|-----------|---------|
| Marketing-Welt (öffentlich, /, /de, Use-Cases) | Plakat-Pragmatismus mit dezenten Gradients und sanften Surface-Wechseln | Stripe-leicht, Vercel-warm |
| App-Welt (eingeloggt, /audit, /dashboard, /projects) | Tabellarisch-funktional mit harten Linien, eckigen Kanten, Mono-Schrift als Daten-Standard | Sentry, DataDog, Linear-App |

**Trennlinie:** Der Login. Vor dem Login Plakat. Nach dem Login Tabelle.

**Was beide gemeinsam haben:**
- Coach-Stimme (Senior-Engineer-PR-Review-Stil)
- Schiefer (Primär) + Korb (Sekundär)
- Hell-Theme als Welt
- Pflicht-Tag-Pattern für Compliance
- Plus Jakarta Sans + Inter + JetBrains Mono

**Was sie unterscheidet:**
- Marketing nutzt Surface-Familie (warm/cool/tint), App nutzt eine Hauptfläche
- Marketing nutzt Border-Radius 8-12px, App nutzt 0-4px
- Marketing nutzt Schatten, App nutzt Borders
- Marketing nutzt Cards, App nutzt Tabellen-Zeilen
- Marketing nutzt Mono als Akzent, App nutzt Mono als Standard für Daten

### 7. Farben

**Primär-Akzent: Schiefer**
- Annäherung: `#3F4A55` (warm-getöntes Schiefergrau)
- Verwendung: Headlines, Buttons (CTA), Active-States, Logo-Bereich, primäre Aktionen
- **Ersetzt das alte Grün (`#2D7A50`)** komplett

**Sekundär-Akzent: Korb** *(ehemals Limette — Update 2026-05-04)*
- Wert: `#fffad3` (helles Cremgelb)
- Verwendung: Severity-Filterbalken, Highlight-Balken, Coach-Atmosphäre-Elemente
- Warm ohne Aufdringlichkeit — setzt sich von Weiß ab, ohne zu dominieren

**Primäre Action-Farbe: Türkis**
- Wert: `#1E7070` (`var(--teal)`)
- Verwendung: ALLE primären Action-Buttons (Audit starten, Fix-Session, Kopieren etc.)
- Semantik: "Handlung auslösen" — klar und präzise

**Status-Familie (ergänzend):**
- Grün-erfüllt: `#5C8A52` oder ähnlich (für ✓-Status, sehr sparsam)
- Amber-Warnung: `#D9852C` oder ähnlich (für mittlere Severity)
- Rot-Pflicht: `#C8553D` oder ähnlich (für Compliance-Pflicht-Tags)

**Neutrale Welt:**
```
--bg-base:        #EAE9E5     (Seiten-Hintergrund — warm-getönt, bleibt)
--bg-surface:     rgba(255,255,255,0.85)  (Cards, leicht angepasst)
--text-primary:   #1A1714     (Haupttext — bleibt)
--text-secondary: #4A4540     (bleibt)
--text-tertiary:  #6B6560     (bleibt)
--border:         rgba(26,23,20,0.10)  (leicht stärker für klarere Sektion-Grenzen)
```

**Streichungen:**
- ❌ `--accent: #2D7A50` (Tropen-Grün) → ersetzt durch Schiefer
- ❌ `--accent-light: #D4EDDE` (helles Grün) → ersetzt durch Schiefer-Light + Limette-Light
- ❌ `--active-bg: #1A2E23` (dunkles Grün) → komplett gestrichen, keine dunklen Sections mehr

**Pastell-Surface-Familie (für Sektion-Differenzierung):**
- Annäherung — exakte Werte beim Build:
- `--surface-warm: #FAF7F2` (warmes Off-White)
- `--surface-cool: #F2F4F1` (kühl-getöntes Off-White, leicht limettig)
- `--surface-tint: #EBEEE5` (Schiefer-getönt)

### 8. Typografie

**Drei Schrift-Welten — bewusste Reduktion:**

| Rolle | Schrift | Verwendung |
|-------|---------|-----------|
| Display | Plus Jakarta Sans (700/800) | H1, Hero-Headlines |
| Body | Inter (400/500) | Fließtext, Buttons, UI-Labels |
| Mono | JetBrains Mono (400) | Code-Snippets, Daten-Highlights ("924 Zeilen"), Pfad-Anzeige |

**Streichungen:**
- ❌ Instrument Serif (war inkonsequent eingesetzt)

**Hierarchie-Sprünge schärfen:**

```
Hero-H1:       72-96px / 800 / -0.03em / Plus Jakarta Sans
H1:            48px / 800 / -0.02em
H2:            32px / 700 / -0.01em
H3:            20px / 600
Body-large:    18px / 400 / 1.6
Body:          16px / 400 / 1.55
Small:         14px / 400 / 1.5
Caption:       13px / 500 / 1.4
Mono:          14px / 400 / 1.5 (etwas größer als Body, damit Code lesbar)
Mono-large:    18px / 500 / 1.4 (für Daten-Highlights)
```

**Mono als Identitäts-Träger:**
Mono-Schrift wird **nicht nur für Code** verwendet, sondern auch für **Daten-Highlights** ("183 Regeln", "60 Sekunden", "924 Zeilen"). Das gibt dem Produkt eine erkennbare Engineer-Identität, ohne ganz Mono zu sein.

### 9. Sektion-Hierarchie

**Sanfte Surface-Welt, keine harten Brüche.**

```
Sektion-Typ     Hintergrund
─────────────────────────────────
section-base    var(--bg-base)
section-warm    var(--surface-warm)
section-cool    var(--surface-cool)
section-tint    var(--surface-tint)
section-hero    var(--gradient-hero) [warmer Verlauf]
section-data    var(--gradient-data) [Korb-Hauch]
```

**Faustregel:** Maximal 3-4 Sektion-Wechsel pro Seite. Keine schwarzen Sections (Pattern 21 ist gestrichen).

**Sektion-Padding:**
- Hero: 120-160px vertikal
- Standard: 80-120px vertikal
- Mobile: jeweils ~60-70% des Desktop-Werts

#### Marketing-Welt-Sektionen

In der Marketing-Welt: sanfte Surface-Wechsel zwischen --bg-base, --surface-warm,
--surface-cool, --surface-tint. Maximal 4 Sektion-Typen pro Seite, keine harten
Brüche. Atmosphärische Gradients als Hero-Hintergrund erlaubt.

#### App-Welt-Sektionen

In der App-Welt: einheitlicher Hintergrund (--bg-base oder --surface-warm).
Sektion-Trennung erfolgt durch:
- Tabellen-Borders (1px solid --border)
- Mono-Uppercase-Header in Akzent-Farbe (Schiefer)
- Section-Header-Bars mit minimalem Tint-Hintergrund

Keine sanften Surface-Wechsel zwischen Sektionen in der App-Welt — sonst entsteht
visuelles Gezappel.

### 10. Visuelle Komposition

**Hero-Pattern:**
Marketing-Text + Code-Snippet nebeneinander oder gestapelt. Code-Snippet zeigt **echte Tropen-Findings**, nicht generische Code-Beispiele.

**Use-Case-Pattern:**
Eyebrow-Tag + H2 + 2-Spalten-Inhalt:
- Linke Spalte: Erklärung
- Rechte Spalte: visuelles Beispiel (Code, Status, Chart)

**Daten-als-Held-Pattern:**
Wo Zahlen wichtig sind, werden sie **groß und im Mono-Stil** gezeigt:
```
183
Regeln in 25 Kategorien
```

**Avoid:**
- Keine Stockfoto-Illustrationen
- Keine 3-Spalten-Bullet-Listen mit dekorativen Icons (KI-Pattern)
- Keine animierten Hero-Visuals (zu aufwendig für Solo-Founder, zu inszeniert für Coach)
- Keine dunklen Sections

---

## Was sich konkret ändern muss

### Im Code

**CSS-Variablen umbauen:**
- `--accent` von `#2D7A50` → `#3F4A55` (Schiefer)
- `--accent-light` von `#D4EDDE` → Schiefer-Light + neue Korb-Variable
- `--active-bg` von `#1A2E23` → komplett streichen
- Neue Surface-Familie hinzufügen
- Neue Mono-Größen hinzufügen

**Komponenten neu denken:**
- Buttons (Primary): von Grün zu Schiefer
- Score-Anzeige: Türkis für positive Trends, gedämpftes Rot für Risiken
- Compliance-Badges: rote Pflicht-Tags neu einführen
- Section-Tag (Pattern 20): Farbe von Grün zu Schiefer
- Pattern 21 (dunkle Sections): komplett raus

**UI-Texte umschreiben:**
- Headlines, Empty States, Loading, Score-Kommentare → Coach-Stimme
- Compliance-Findings → Pflicht-Tag-Pattern

### Marketing & Doku

**Copy umstellen:**
- Landing-Page-Headlines: von "Production Readiness Guide" zu Coach-Sprache
- Beispiele: "Dein Code, in Production-Reife." statt "Production Readiness Guide für Vibe-Coder."
- Use-Case-Sektionen: "Schauen wir uns das genauer an" statt "Features"

**ADR-Eintrag schreiben:**
- ADR-024 "Marken-Pivot: Coach-Position + Schiefer-Korb-Welt"

---

## Was NICHT geändert wird

Damit klar ist, wo wir Disziplin halten:

- **Hell-Theme bleibt** — keine Dunkel-Variante als Default
- **Schriften bleiben** (Plus Jakarta Sans + Inter + JetBrains Mono) — kein Schrift-Wechsel
- **App-Funktionalität bleibt** — keine Feature-Streichungen aus Marken-Wechsel
- **Roadmap bleibt** — Sprint 1-5 wie geplant, Marken-Pivot läuft parallel
- **Compliance bleibt zentraler Moat** — Coach-Stimme integriert das, ersetzt es nicht
- **Vibe-Coder-Zielgruppe bleibt** — keine Verbreiterung zu KMU jetzt
- **EU/DACH-Fokus bleibt** — Marken-Pivot ist nicht Internationalisierung

---

## Was noch offen ist (zu klären in den nächsten Schritten)

- **Exakte Hex-Werte** — Schiefer und Korb sind Annäherungen, beim Build feinabstimmen
- **Pflicht-Tag-Visual** — wie genau sieht das `[DSGVO-Pflicht]`-Badge aus?
- **Hero-Visual-Detail** — welche konkreten Code-Snippets in welcher Komposition?
- **Logo / Wortmarke** — wenn Tropen ersetzt wird, wann passiert Naming-Sprint?
- **Toro / Mascot** — formal verabschieden? Oder erst beim Naming-Sprint mitbeerdigen?

Diese Punkte werden in den Build-Prompts schrittweise angegangen.

---

## Wie wir mit diesem Brief arbeiten

**Bei jeder Design-Entscheidung:**
1. Brief lesen (oder die relevante Sektion)
2. Entscheidung gegen Brief prüfen — passt sie?
3. Wenn nicht: entweder Entscheidung anpassen oder Brief diskutieren (über ADR)

**Bei jeder Copy-Entscheidung:**
1. Stimm-Formel anwenden: Beobachtung + Konsequenz + Vorschlag
2. Auf Marketing-Slang prüfen
3. Auf erzwungene Lockerheit prüfen

**Bei Build-Prompts:**
1. Brief als Pflicht-Lektüre für Claude Code
2. Konkrete Anker (Farb-Hex, Typografie, Patterns) im Build-Prompt benennen
3. Coach-Stimme-Beispiele im Build-Prompt mitliefern

---

### 11. App-Welt-Disziplinen

Nach dem Login gilt strikte Tabellen-Welt-Logik. Diese Disziplinen sind
nicht-verhandelbar:

#### Visuelle Reduktion

| Element | Regel |
|---------|-------|
| Border-Radius | Maximal 2-4px (eckig). Keine 8-12px Rundungen. |
| Schatten | Keine Drop-Shadows. Trennung über Borders (1px solid --border). |
| Surface-Familie | Auf 1-2 Töne reduziert (--bg-base, optional --surface-warm). Kein --surface-cool oder --surface-tint in der App. |
| Border-Radius an Buttons | Max 4px |
| Border-Radius an Modals | Max 6px |

#### Typografie-Standard

| Element | Schrift |
|---------|---------|
| Daten (Pfade, Zahlen, Datum, Versionen) | JetBrains Mono — Standard, nicht Akzent |
| Section-Header | Plus Jakarta Sans, UPPERCASE, klein, Letter-Spacing 0.05em, in --accent (Schiefer) |
| Tabellen-Zellen | Inter (Body) für Text, Mono für Daten |
| Cursor-Prompts | JetBrains Mono in Code-Box mit dunklerem Hintergrund |

#### Tabellen-Standards

- Header-Zeile mit subtilem Akzent-Tint-Hintergrund
- Zeilen-Trennlinien (1px solid --border)
- Hover-State: ganze Zeile bekommt --surface-warm Hintergrund
- Spalten-Breiten klar definiert (nicht responsive-flowing)
- Erste Spalte oft kompakt (Status-Indikator), letzte rechtsbündig (Aktion)

#### Plakat-Reste in der App (gewollt)

Drei Stellen, wo Plakat-Charakter bleibt — als Wärme-Inseln:

1. **Empty-States** mit Coach-Stimme — fließender Text, keine Tabelle
2. **Cursor-Prompt-Boxen** — Code-Box mit Mono-Schrift, Border-Radius 6px erlaubt
3. **Score-Coach-Kommentar** — eine Zeile fließender Text im Score-Block

Diese Reste sind nicht Inkonsistenz, sondern bewusste Atemzonen.

#### Mobile-Anpassung

Tabellen brechen auf Mobile (<768px) zu **Karten-Listen** um:
- Jede Tabellen-Zeile wird zur Karte mit gleichen Daten
- Spalten-Header werden zu Labels innerhalb der Karte
- Border-Radius bleibt minimal (2-4px)
- Keine eigene Plakat-UI für Mobile — Tabellen-Welt-Charakter bleibt erhalten

---

## Anker-Satz, wenn alles unklar wird

Wenn du dich bei einer Entscheidung verlierst — ob UI-Text, Farb-Wahl, Layout — kehre zurück zu diesem Satz:

> **Wie würde ein älterer Senior-Engineer mit Geschmack das machen — direkt, kompetent, mit Haltung, aber auf Augenhöhe?**

Die Antwort ist meistens richtig.

## Zweiter Anker-Satz für die App-Welt

Wenn die erste Anker-Frage nicht reicht und es um App-spezifische
Design-Entscheidungen geht:

> **Wie würde Sentry oder DataDog das anzeigen — funktional, klar, ohne
> Marketing-Polish, mit Tabellen statt Cards?**

Die Antwort führt zur richtigen App-Welt-Entscheidung.

---

## 28. Coach-Position zweiter Ordnung — Begrenzung, Klassifikation, Aktivierung

Tropen OS hat eine besondere Coach-Position: nicht nur "was ist falsch im Code", sondern auch **transparente Aussagen über die eigenen Grenzen**. Coach erklärt, wo Coach selbst aufhört. Das ist Trust-Mechanismus zweiter Ordnung — User vertraut, weil Tropen OS ehrlich über seine Grenzen redet.

Drei zusammenhängende Substanzen:

### 28.1 Begrenzungs-Aussagen

Wenn die Detection heuristisch ist, wenn die Frage außerhalb des Code-Coach-Bereichs liegt, wenn nur ein Anwalt entscheiden kann — sagt Tropen OS das **explizit**.

**Kern-Pattern:**
- Klare Beobachtung
- Explizite Begrenzungs-Aussage ("wir können nicht...", "unsere Detection ist heuristisch", "wir sind kein Anwalt")
- Konsequenz-Erklärung (warum es trotzdem wichtig ist)
- Vorschlag, was der User selbst tun kann

**Beispiel-Wording:**

> "🟠 Hochrisiko (kein Killer): Möglicherweise fehlende Tenant-Isolation in 3 Datenbankqueries. Wir können nicht sicher sagen, ob das ein echtes Problem ist — unsere Detection ist heuristisch. Aber: bei B2B-Apps ist Tenant-Leak der schlimmste Datenschutz-Vorfall. Prüfe diese Queries selbst, bevor du veröffentlichst."

> "📋 Compliance-Hinweis (kein Killer): Dein Profil ist EU-B2C. Cookie-Banner und Datenschutzerklärung sind Pflicht — wir können den Inhalt nicht prüfen, wir sind kein Anwalt. Hier sind Ressourcen: [Datenschutz-Generator] [BfDI-Leitfaden]."

### 28.2 Drei-Ebenen-Klassifikation

Findings sind nicht alle gleich. Tropen OS unterscheidet drei Coach-Ebenen:

| Ebene | Coach-Signal | Beispiel |
|-------|--------------|---------|
| 🛑 Killer | "Veröffentlichung blockiert" | Hardcoded Secrets, SQL-Injection |
| 🟠 Polish | "verbessert Qualität, kein Stopper" | Tenant-Isolation (Detection unsicher) |
| 📋 Hinweis | "wir prüfen das nicht, aber du solltest es klären" | DSGVO-Cookie-Banner |

**Killer:** binär oder mit klaren Schwellwerten. Bei Verletzung: "kann so nicht veröffentlicht werden". UI prominent (rote Sektion oben).

**Polish:** mit Severity (low/medium/high), aber kein Stopper. Coach erklärt: "warum melden wir das nicht als Killer? Detection ist heuristisch, FP-Risiko zu hoch."

**Hinweis:** Themen außerhalb des technischen Audit-Bereichs. Eigene UI-Sektion mit externen Links zu Ressourcen.

**Wording pro Ebene:**

```
🛑 Stopper: API-Key direkt im Code gefunden. Jeder mit Repo-Zugriff kann den Key lesen — auch nach Löschen bleibt er in der Git-History. Key in .env.local verschieben, in .gitignore aufnehmen und beim Provider rotieren.

🟠 Hochrisiko (kein Killer): 3 Datenbankqueries ohne erkennbaren organization_id-Filter. Bei B2B-Apps ist Tenant-Leak der schlimmste Datenschutz-Vorfall. Wir können nicht sicher sagen, ob die Queries betroffen sind — Detection ist heuristisch. Prüfe selbst, bevor du veröffentlichst.

📋 Compliance-Hinweis: Dein Profil ist EU-B2C. Du brauchst eine Datenschutzerklärung und vermutlich ein Cookie-Banner. Wir prüfen das nicht — wir sind Code-Coach, kein Anwalt. Ressourcen: [Datenschutz-Generator] [BfDI-Leitfaden].
```

### 28.3 Profil-basierte Aktivierung

Killer-Kriterien sind profil-spezifisch. Onboarding fragt zwei Fragen:

**Hauptfrage:** "Was beschreibt dein Projekt am besten?"

| Profil | Beschreibung |
|--------|-------------|
| Demo / Solo-Tool | Du allein, kein Login, kein Datenspeicher |
| Internes Tool | Multi-User, eigene Org, kein Public Internet |
| Public Tool ohne PII | Public Internet, keine User-Daten |
| B2C-App | Public Multi-User mit User-Accounts und PII |
| B2B / Reguliert | Multi-Org, Compliance-Anforderungen |

**Markt-Frage:** EU / Nicht-EU / Global / Egal

Profil ist jederzeit in Settings änderbar. Coach erklärt das aktive Profil bei jedem Audit:

> "Wir behandeln dein Projekt als 'B2C-App in EU'. Das aktiviert 17 Killer-Kriterien (z.B. DSGVO Backup-Pflicht, CSRF-Schutz). Wenn das nicht stimmt, ändere dein Profil in Settings."

> **Architektur-Bezug:** ADR-027 dokumentiert die technische Umsetzung: Killer-Kriterien als primäres Coach-Signal, Score als sekundärer Polish-Indikator.

### 28.4 Reihenfolge-Empfehlung als Coach-Pattern

Wenn ein Repo viele Polish-Findings hat, ist eine ungeordnete Liste keine Coach-Hilfe. "Wo soll ich anfangen?" ist die natürliche nächste Frage — und wenn Tropen OS darauf nicht antwortet, hat der Coach versagt.

**Coach-Position:** Tropen OS liefert eine Reihenfolge-Empfehlung mit transparent erklärtem Kriterium.

**Default-Sortierung:** Aufwand-basiert (Quick Wins zuerst).
- Aufwand ist greifbar: "15 Min" ist konkret, Impact-Scores wären für Vibe-Coder überkonstruiert.
- Vibe-Coder-Logik: kleine Erfolge zuerst, Vertrauen aufbauen.
- Reihenfolge-Kriterium wird **explizit erklärt** — User wissen warum, nicht nur dass.

**Wording-Beispiel:**

> "Du hast 17 Polish-Findings. Wir empfehlen, mit diesen 5 anzufangen — sie sind alle in unter 15 Minuten lösbar und reduzieren die Liste schnell. Die anderen 12 brauchen mehr Zeit oder Tiefe."

**Architektur-Bezug:** ADR-027 Schritt 6 (UI-Pivot) implementiert diese Reihenfolge-Logik. Bis dahin ist dieses Pattern Coach-Position-Substanz für die spätere Implementation.

### 28.5 Coach-Sprache: radikal vereinfachen

Coach spricht die Sprache des Vibe-Coders, nicht die der Compliance-Anwälte. Compliance-Begriffe filtern die Hälfte der Zielgruppe raus, bevor sie überhaupt verstehen, worum es geht.

**Pattern:** wenn ein juristischer oder technischer Begriff in der Coach-Frage auftaucht, **immer** durch eine alltägliche Beschreibung ersetzen. Beispiele direkt in der Frage.

**Übersetzungstabelle (Vibe-Coder-Wörterbuch):**

| Compliance-Sprech | Coach-Sprache |
|--------------------|---------------|
| "Verarbeitung personenbezogener Daten" | "Sammelt ihr Namen, E-Mails oder andere User-Daten?" |
| "Sensible Daten gemäß Art. 9 DSGVO" | "Verarbeitet ihr Gesundheit, Religion, Politik oder sexuelle Orientierung?" |
| "Biometrische Identifikation" | "Gesichtserkennung oder Emotionsanalyse?" |
| "Tracking und Analytics" | Aufgesplittet: "Analytics (z.B. GA4)" / "Werbung (z.B. FB Pixel)" / "Error-Monitoring (z.B. Sentry)" |
| "Drittland-Transfers (Schrems-II)" | "Stehen eure Server in den USA oder schickt ihr Daten dahin?" |
| "Automatische Vertragsverlängerung" | "Verlängert sich das Abo automatisch, wenn keiner kündigt?" |

**Wichtiger Anker:** Coach **filtert nicht aus**. Wenn ein Vibe-Coder die Coach-Sprache versteht, aber den juristischen Begriff nicht kennt, hat der Coach gewonnen. Tropen OS ist kein Anwalt (Begrenzungs-Aussage — Section 28.1).

**Implementation:** alle Coach-Fragen, Findings und Hilfetexte werden gegen dieses Wörterbuch geprüft. Compliance-Begriffe ohne Übersetzung sind Bugs. Vibe-Coder-Wörterbuch ist separater Sprint (vor Schritt 8).

### 28.6 LAZY-Detection: Coach reagiert auf Code-Sichtbares

Tropen OS fragt nicht alles vorab. Manche Compliance-Domänen werden **kontextuell aktiviert**, wenn der Code es zeigt.

**Pattern:**
- User durchläuft Onboarding mit 3 Pflichtfragen (Profil + Geo + Datenschutz-Basis)
- Weitere Domänen (Marketing, App Store, Infrastruktur, Open-Source-Lizenzen) sind LAZY
- Beim Audit-Lauf: Detektoren erkennen Code-Marker
- Wenn erkannt: Domäne aktiviert sich, Coach erklärt was er gefunden hat und warum

**Code-Marker pro Domäne:**
- Marketing: GA4/FB Pixel im Bundle?
- Plattform: capacitor.config, Info.plist?
- Infrastruktur: vercel.json, netlify.toml, hosting-config?
- Open-Source: GPL-Dependency in package.json?

**Beispiel-Coach-Wording:**

> "Wir haben Google Analytics in eurem Bundle gefunden. Das aktiviert ein paar Compliance-Themen (Cookie-Banner, Tracking-Consent). Wir prüfen das jetzt mit. Wenn das nicht stimmt, könnt ihr in Settings die Marketing-Domäne deaktivieren."

**Warum LAZY besser als Pflichtfrage:**
- Niedrige Onboarding-Reibung (3 Fragen statt 20+)
- Coach erklärt Aktivierung transparent — keine "plötzlichen neuen Findings"
- User behält Kontrolle (kann in Settings deaktivieren)
- Keine False-Positive-Activation bei Projekten die diese Tools nicht nutzen

**Architektur-Bezug:** ADR-027 Update 2026-05-05 dokumentiert die 9 Domänen + LAZY-Stufung. Schritt 9 (kommende Sprints) baut die Domain-Detektoren.
