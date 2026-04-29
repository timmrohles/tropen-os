import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Tracing disabled — 124kB gz bundle savings; re-enable if Sentry Performance tab needed
  tracesSampleRate: 0,

  // Session Replays (5% in Prod, 100% bei Fehlern)
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      // Alles maskieren — kein PII in Replays
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  debug: false,
})
