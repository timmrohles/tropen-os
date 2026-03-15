# Web Application Manifest

## Ebene 1 — Prinzipien

> \*\*Version:\*\* 2.0 — März 2026  
> \*\*Perspektive:\*\* Senior Full Stack Developer  
> \*\*Zielgruppe:\*\* Entwickler, Projektmanager, CTOs

\---

## Präambel

KI-gestützte Entwicklungswerkzeuge haben die Einstiegshürde dramatisch gesenkt. Was als „Vibe Coding" bekannt geworden ist – prompt-getriebenes Generieren von Code ohne Architekturverständnis – produziert Applikationen, die funktionieren, aber nicht bestehen.

**Eine Webapplikation ist kein versehentlich produktiv genommener Prototyp. Sie ist ein System mit Verantwortung gegenüber Nutzern, Daten, Betreibern und der Zukunft.**

Dieses Framework besteht aus drei Ebenen:

|Ebene|Dokument|Inhalt|
|-|-|-|
|1|`manifesto.md`|10 Kernprinzipien – Philosophie|
|2|`engineering-standard.md`|Konkrete Regeln pro Kategorie|
|3|`audit-system.md` + `scoring.md`|Messbare Bewertung mit Score|

\---

## Die 10 Prinzipien

### Principle 1 — Architecture before Code

Entscheidungen über Schichten, Module und Abhängigkeiten werden getroffen, bevor die erste Zeile Code geschrieben wird. Architektur ist kein Luxus – sie ist das Fundament, auf dem alles andere steht.

### Principle 2 — Systems must be Observable

Ein System, das du nicht beobachten kannst, kannst du nicht zuverlässig betreiben. Logs, Metrics und Traces sind keine optionalen Features – sie sind Teil des Systems selbst.

### Principle 3 — Security is Baseline, not Feature

Sicherheit wird nicht am Ende hinzugefügt. Sie wird von Anfang an eingebaut. Jede Abkürzung in der Sicherheit ist eine Schuld, die mit Zinsen zurückgezahlt wird.

### Principle 4 — Dependencies must be Replaceable

Jede externe Abhängigkeit – Cloud-Provider, Payment-Dienst, KI-API – wird hinter einer Abstraktionsschicht gekapselt. Was heute billig ist, kann morgen kritisch sein.

### Principle 5 — Data is a Liability, not an Asset

Daten, die nicht erhoben werden, können nicht gestohlen werden. Datensparsamkeit ist keine DSGVO-Pflicht – sie ist kluge Systemgestaltung.

### Principle 6 — Failure is not an Exception

Externe Dienste fallen aus. Netzwerke verlieren Pakete. Datenbanken werden langsam. Ein professionelles System ist auf Fehler vorbereitet, nicht überrascht von ihnen.

### Principle 7 — Automate what Repeats

Manuelle Deployments, manuelle Tests, manuelle Code-Reviews für Stil – alles, was sich wiederholt, wird automatisiert. Kognitive Energie ist für Probleme reserviert, die Maschinen nicht lösen können.

### Principle 8 — Code is read more than written

Jede Zeile wird einmal geschrieben und viele Male gelesen. Klarheit, Namensgebung und Struktur sind kein Komfort – sie sind wirtschaftliche Entscheidungen.

### Principle 9 — Performance is a Feature

Nutzer warten nicht. Jede Sekunde Ladezeit kostet Conversion, Vertrauen und Geld. Performance wird gemessen, nicht geschätzt.

### Principle 10 — Systems must survive their Creators

Ein System, das nur der Person verständlich ist, die es gebaut hat, ist ein Risiko. Dokumentation, Onboarding und Wissenstransfer sind Teil der Architektur.

\---

## Dieses Manifest ist kein Dogma

Standards haben Ausnahmen. Was nicht akzeptabel ist, sind Ausnahmen ohne Bewusstsein.

*Vibe Coding ist ein Werkzeug. KI-Assistenten sind Werkzeuge. Ein erfahrener Entwickler benutzt Werkzeuge mit Urteilsvermögen – er wird nicht von ihnen benutzt.*

