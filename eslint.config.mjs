import nextConfig from 'eslint-config-next/core-web-vitals'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import prettierConfig from 'eslint-config-prettier'

export default [
  // Next.js Core Web Vitals (flat config array aus eslint-config-next v16)
  ...nextConfig,

  // TypeScript-Rules für .ts/.tsx
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: { '@typescript-eslint': tsPlugin },
    languageOptions: { parser: tsParser },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-object-type': 'off',
      // Async data fetching in useEffect ist legitim — kein Error
      'react-hooks/set-state-in-effect': 'warn'
    }
  },

  // Prettier (muss zuletzt kommen)
  prettierConfig,

  // Ignores
  { ignores: ['.next/**', 'node_modules/**', 'supabase/functions/**'] }
]
