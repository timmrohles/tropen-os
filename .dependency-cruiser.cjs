// .dependency-cruiser.cjs
// Tropen OS — Dependency Cruiser Konfiguration
// Engineering-Standard #1: Keine zirkulären Abhängigkeiten
//
// Ausführen:
//   pnpm lint:deps
//
// HTML-Report generieren:
//   pnpm exec depcruise src --config .dependency-cruiser.cjs --output-type dot | dot -T svg > deps.svg

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [

    // ── Zirkuläre Abhängigkeiten ─────────────────────────────────────────────
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Zirkuläre Abhängigkeiten verhindern Tree-Shaking und erschweren Tests',
      from: {},
      to: { circular: true },
    },

    // ── Schichtenverletzungen ────────────────────────────────────────────────

    {
      name: 'lib-no-ui',
      severity: 'error',
      comment: 'lib/ ist framework-unabhängig — kein Import von UI oder App-Code',
      from: { path: '^src/lib' },
      to: { path: '^src/(components|app|features|hooks|store)' },
    },

    {
      name: 'services-no-ui',
      severity: 'error',
      comment: 'Services dürfen keine UI-Komponenten importieren',
      from: { path: '^src/services' },
      to: { path: '^src/(components|app|features)' },
    },

    {
      name: 'types-no-impl',
      severity: 'warn',
      comment: 'Typ-Definitionen sollten keine Implementierungsdetails importieren',
      from: { path: '^src/types' },
      to: { path: '^src/(components|app|features|hooks|lib|services|store)' },
    },

    // ── Keine veralteten Module ──────────────────────────────────────────────
    {
      name: 'no-deprecated-core',
      severity: 'warn',
      from: {},
      to: {
        dependencyTypes: ['core'],
        path: '^(punycode|domain|constants|sys|_linklist)$',
      },
    },

    // ── Keine Importe aus .next/ ─────────────────────────────────────────────
    {
      name: 'no-next-internals',
      severity: 'error',
      comment: 'Keine direkten Importe aus .next/ Build-Artefakten',
      from: {},
      to: { path: '^\\.next' },
    },
  ],

  options: {
    // Nur src/ analysieren
    includeOnly: '^src',

    // Ignorieren
    exclude: {
      path: [
        'node_modules',
        '\\.next',
        '\\.test\\.',
        '\\.spec\\.',
        '__tests__',
        '__mocks__',
      ],
    },

    // Module-Auflösung
    moduleSystems: ['es6', 'cjs'],

    // TypeScript-Pfad-Aliase aus tsconfig.json lesen
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },

    // Ausgabe
    reporterOptions: {
      text: {
        highlightFocused: true,
      },
    },
  },
}
