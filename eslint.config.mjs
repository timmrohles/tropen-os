import nextConfig from 'eslint-config-next/core-web-vitals'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import prettierConfig from 'eslint-config-prettier'
import boundaries from 'eslint-plugin-boundaries'
import unicorn from 'eslint-plugin-unicorn'
import sonarjs from 'eslint-plugin-sonarjs'

export default [
  // ── Next.js Core Web Vitals ────────────────────────────────────────────────
  ...nextConfig,

  // ── TypeScript ─────────────────────────────────────────────────────────────
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: { '@typescript-eslint': tsPlugin },
    languageOptions: { parser: tsParser },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-object-type': 'off',
      'react-hooks/set-state-in-effect': 'off',
    },
  },

  // ── Architecture Boundaries ────────────────────────────────────────────────
  // Enforces: UI → lib/hooks/services only. app/ = routing only.
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'app',        pattern: 'src/app/**' },
        { type: 'components', pattern: 'src/components/**' },
        { type: 'features',   pattern: 'src/features/**' },
        { type: 'hooks',      pattern: 'src/hooks/**' },
        { type: 'lib',        pattern: 'src/lib/**' },
        { type: 'services',   pattern: 'src/services/**' },
        { type: 'store',      pattern: 'src/store/**' },
        { type: 'types',      pattern: 'src/types/**' },
        { type: 'config',     pattern: 'src/config/**' },
      ],
      'boundaries/ignore': ['**/*.test.*', '**/*.spec.*'],
    },
    rules: {
      // components must not import from app/ (no circular routing deps)
      'boundaries/element-types': [
        'warn',
        {
          default: 'allow',
          rules: [
            { from: 'components', disallow: ['app'] },
            { from: 'lib',        disallow: ['app', 'components', 'features'] },
            { from: 'services',   disallow: ['app', 'components'] },
            { from: 'hooks',      disallow: ['app'] },
          ],
        },
      ],
    },
  },

  // ── Unicorn (file naming + code quality) ───────────────────────────────────
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    plugins: { unicorn },
    rules: {
      // Datei-Namenskonventionen: kebab-case für alles außer Komponenten
      'unicorn/filename-case': [
        'warn',
        {
          cases: {
            kebabCase: true,
            pascalCase: true, // React-Komponenten dürfen PascalCase sein
          },
        },
      ],
      // Gute Unicorn-Regeln ohne zu opinionated zu sein
      'unicorn/no-array-for-each': 'warn',
      'unicorn/no-useless-undefined': 'warn',
      'unicorn/prefer-node-protocol': 'off', // Next.js verträgt sich nicht gut damit
      'unicorn/prevent-abbreviations': 'off', // zu restriktiv für dt. Codebase
      'unicorn/no-null': 'off',              // Supabase gibt null zurück
      'unicorn/no-negated-condition': 'warn',
    },
  },

  // ── SonarJS: Cognitive Complexity + Code-Smells ───────────────────────────
  // Engineering-Standard #2: Cognitive Complexity ≤ 15 (für KI-Code: ≤ 8)
  // KI-Code-Gate: Coverage ≥ 90%, Duplikate ≤ 1% → via SonarQube AI Code Assurance
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    plugins: { sonarjs },
    rules: {
      // Cognitive Complexity — Schwellenwert 15 für menschlichen Code
      // KI-generierter Code sollte ≤ 8 sein (in SonarQube separat konfigurieren)
      'sonarjs/cognitive-complexity': ['warn', 15],

      // Keine duplizierten Strings (Magic Strings) — mehr als 3x = warn
      'sonarjs/no-duplicate-string': ['warn', { threshold: 3 }],

      // Keine identisch implementierten Funktionen
      'sonarjs/no-identical-functions': 'warn',

      // Toter Code
      'sonarjs/no-redundant-jump': 'warn',
      'sonarjs/no-unused-collection': 'warn',

      // Unnötige Komplexität
      'sonarjs/prefer-immediate-return': 'warn',
      'sonarjs/no-collapsible-if': 'warn',
    },
  },

  // ── Prettier (muss zuletzt kommen) ─────────────────────────────────────────
  prettierConfig,

  // ── Ignores ────────────────────────────────────────────────────────────────
  { ignores: ['.next/**', 'node_modules/**', 'supabase/functions/**', 'src/generated/**'] },
]
