import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.unit.test.ts', 'src/**/*.unit.test.tsx'],
    exclude: ['node_modules', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      // Nur Dateien mit tatsächlichen Tests — keine DB-abhängigen Routes
      include: [
        'src/lib/validators/**',
        'src/lib/errors.ts',
        'src/lib/token-counter.ts',
        'src/lib/logger.ts',
        'src/lib/qa/routing-logger.ts',
        'src/lib/qa/task-classifier.ts',
        'src/app/api/admin/qa/compliance/route.ts',
        'src/lib/repo-map/**/*.ts',
        'src/lib/audit/**/*.ts',
      ],
      exclude: [
        'src/test/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.test.tsx',
      ],
      thresholds: { branches: 70, functions: 70, lines: 70 },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
