# LOAD_TEST_AGENT

> **Status:** Spec (nicht implementiert) — priorisiert für Sprint 11
> **Erstellt:** 2026-04-17 — Ergebnis des Komitee-Reviews (einstimmig)
> **Hintergrund:** Größter blinder Fleck im Audit-Stack: alle 233 Regeln prüfen statischen Code.
>                  Kein Agent testet Runtime-Verhalten unter Last.

---

## Kontext

Alle aktuellen 26 Agenten und 233 Regeln sind statische Code-Analysen. Kein einziger prüft,
ob die App bei 100–1000 concurrent Users noch funktioniert. Alle 49 Benchmark-Repos sind
Demos oder MVPs — Runtime-Performance ist vollständig unvalidiert.

**Komitee-Entscheidung (4/4 Modelle + Opus-Judge, 2026-04-17):**
> "Runtime-Verhalten unter realer Last" ist der größte blinde Fleck im Agent-Stack.

---

## Agent-Ziel

Prüfen, ob das Projekt Load-Testing-Infrastruktur hat und dabei eine klare
"Test mit 100 Users vor Production"-Regel durchsetzen.

---

## Regeln

### R1 — Load-Test-Skripte vorhanden

**Severity:** high
**Enforcement:** reviewed
**Check:** Suche nach k6, Locust, Artillery oder ähnlichen Load-Testing-Dateien im Repo.

```
Suche nach:
  - k6-Skripten (*.js mit "import http from 'k6/http'")
  - Locust-Dateien (locustfile.py, tests/load/*.py)
  - Artillery-Configs (artillery.yml, load-test.yml)
  - JMeter-Dateien (*.jmx)
  - Skript-Verzeichnisse: scripts/load/, tests/performance/, tests/load/
```

**Pass:** Load-Testing-Skripte oder -Konfiguration vorhanden.
**Fail:** Kein Load-Testing im Repo → severity: high, Suggestion: Fix-Prompt (siehe unten).

---

### R2 — Package.json Load-Test-Script

**Severity:** medium
**Enforcement:** reviewed
**Check:** `scripts` in package.json enthält `test:load`, `load-test` oder `k6 run`.

**Pass:** Load-Test-Script definiert.
**Fail:** Kein Load-Test-Script → severity: medium.

---

### R3 — Load-Test-Dokumentation

**Severity:** low
**Enforcement:** advisory
**Check:** `README.md` oder `docs/load-testing.md` erklärt wie Load-Tests ausgeführt werden.

---

## Fix-Prompts (Cursor/Claude Code)

### R1 — k6-Basis-Load-Test generieren

```
Cursor-Prompt: 'Create scripts/load-test.js using k6:
import http from "k6/http";
import { sleep, check } from "k6";

export const options = {
  stages: [
    { duration: "30s", target: 10 },   // warm up
    { duration: "1m",  target: 100 },  // 100 concurrent users
    { duration: "30s", target: 0 },    // ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<500"],   // 95% under 500ms
    http_req_failed: ["rate<0.01"],     // <1% error rate
  },
};

export default function () {
  const res = http.get("http://localhost:3000/");
  check(res, { "status 200": (r) => r.status === 200 });
  sleep(1);
}
// Run with: k6 run scripts/load-test.js'
```

### R1 — Artillery-Alternative

```
Cursor-Prompt: 'Create artillery.yml for load testing:
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 60
      arrivalRate: 100
      name: "100 concurrent users"
scenarios:
  - name: "Homepage"
    flow:
      - get:
          url: "/"
          expect:
            - statusCode: 200
            - maxResponseTime: 500
# Run with: artillery run artillery.yml'
```

---

## Checker-Implementierungs-Plan

```typescript
// Datei: src/lib/audit/checkers/category-gap-checkers.ts (ergänzen)

export async function checkLoadTestPresent(ctx: AuditContext): Promise<RuleResult> {
  // k6 scripts
  const hasK6 = ctx.filePaths.some(p =>
    (p.includes('load-test') || p.includes('load_test')) && p.endsWith('.js')
  ) || (() => {
    const content = readContent(ctx, 'package.json')
    return content ? /"k6"\s*:/.test(content) : false
  })()

  // Locust
  const hasLocust = ctx.filePaths.some(p =>
    p.includes('locustfile') || (p.includes('load') && p.endsWith('.py'))
  )

  // Artillery
  const hasArtillery = ctx.filePaths.some(p =>
    p.includes('artillery') && (p.endsWith('.yml') || p.endsWith('.yaml'))
  )

  // scripts/load/ directory
  const hasLoadDir = ctx.filePaths.some(p =>
    p.includes('/load/') || p.includes('/performance/')
  )

  if (hasK6 || hasLocust || hasArtillery || hasLoadDir) {
    return pass('cat-8-rule-load', 5, 'Load testing infrastructure detected')
  }

  return fail('cat-8-rule-load', 0, 'No load tests found — Runtime behavior under load is unvalidated', [{
    severity: 'high',
    message: 'No load-testing scripts (k6/Locust/Artillery) — unknown behavior at 100+ concurrent users',
    suggestion: "Cursor-Prompt: 'Create scripts/load-test.js using k6 — test with 100 concurrent users before first production launch'",
    agentSource: 'scalability',
  }])
}
```

---

## Rule-Registry-Eintrag (wenn implementiert)

```typescript
{
  id: 'cat-8-rule-load',
  categoryId: 8,
  name: 'Load-Testing vorhanden',
  weight: 3,
  checkMode: 'file-system',
  automatable: true,
  agentSource: 'scalability',
  enforcement: 'reviewed',
  fixType: 'code-gen',
  check: checkLoadTestPresent,
}
```

---

## Rollout-Plan

| Phase | Schritt | Aufwand |
|-------|---------|---------|
| 1 | Checker implementieren + in rule-registry eintragen | 2h |
| 2 | Gegen 49 Benchmark-Repos testen — erwartete Hit-Rate: 95% (fast keine Lovable-Repos haben Load-Tests) | 30min |
| 3 | Fix-Prompt in FixPromptDrawer integrieren | 1h |
| 4 | Dokumentation: "100 Users Test vor Production-Launch" als Onboarding-Schritt | 1h |

**Erwartete Hit-Rate:** 90–95% (kaum Vibe-Coder-Projekte haben Load-Tests)
**ROI:** Mittel — wichtig für Production-Readiness-Signal, nicht direkt fixbar durch Cursor-Prompt

---

## Offene Fragen

1. Soll der Checker nur Datei-Existenz prüfen oder auch Konfiguration validieren (min. 100 User)?
2. Soll `cat-8-rule-load` in cat-8 (Skalierbarkeit) oder eine neue cat-26 (Load-Testing) eingeführt werden?
3. CI-Integration: Soll der Check auch suchen ob Load-Tests in CI/CD eingebunden sind (`.github/workflows/*.yml` mit `k6`)?

---

_Spec-Dokument — kein aktiver Checker. Implementierung frühestens Sprint 11._
