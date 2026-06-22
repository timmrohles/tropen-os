// Lighthouse CI config. Assertions als Datei statt CLI-Flags —
// die CLI-Flag-Form (--assert.assertions.categories:…) crasht @lhci/utils 0.14
// mit "normalizeAssertion is not a function". URL kommt aus LHCI_URL (CI-Secret).
module.exports = {
  ci: {
    collect: {
      url: [process.env.LHCI_URL].filter(Boolean),
      numberOfRuns: 1,
    },
    assert: {
      preset: 'lighthouse:no-pwa',
      // 'warn' statt 'error' → Schwellen sind Signal, kein Job-Gate.
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
}
