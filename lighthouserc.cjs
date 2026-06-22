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
      // Kein Preset — das brächte ~40 Einzel-Audit-Assertions auf 'error' (color-contrast,
      // bf-cache, unused-css …) und spammt rote Fehler. Wir wollen nur die 4 Kategorie-Scores
      // als Signal (das ist auch, was als Telemetrie gespeichert wird), alles 'warn' = kein Gate.
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
