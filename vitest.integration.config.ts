import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./src/test/setup.integration.ts'],
    include: ['src/**/*.integration.test.ts'],
    exclude: ['node_modules', '.next'],
    testTimeout: 30000,
    sequence: { concurrent: false },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
})
