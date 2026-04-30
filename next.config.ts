import type { NextConfig } from 'next'
import path from 'path'
import { withSentryConfig } from '@sentry/nextjs'
import bundleAnalyzer from '@next/bundle-analyzer'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const withBundleAnalyzer = bundleAnalyzer({ enabled: process.env.ANALYZE === 'true' })

const securityHeaders = [
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval nötig für Next.js dev + React
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.openai.com https://api.anthropic.com https://*.sentry.io",
      "worker-src 'self' blob:",
      "frame-ancestors 'none'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  // Explizit Projekt-Root setzen — verhindert dass Next.js C:\Users\timmr\package-lock.json
  // als Workspace-Root erkennt und Vendor-Chunks am falschen Ort schreibt.
  outputFileTracingRoot: path.resolve('.'),
  webpack(config) {
    // Force all @opentelemetry/api-logs imports (including nested copies from
    // pnpm's virtual store) to resolve to the single top-level installation.
    // Without this, webpack finds the nested copy inside instrumentation-amqplib
    // and fails to open its ESM entry on Windows because pnpm hard-links it
    // from a store path that webpack can't follow.
    config.resolve.alias = {
      ...config.resolve.alias,
      '@opentelemetry/api-logs': path.resolve('node_modules/@opentelemetry/api-logs'),
    }
    // Suppress known benign warning from @prisma/instrumentation dynamic requires
    config.ignoreWarnings = [
      ...(config.ignoreWarnings ?? []),
      { module: /node_modules\/@prisma\/instrumentation/ },
    ]
    return config
  },
  env: {
    // Ändert sich bei jedem Server-Start / Build → SW-Cache wird automatisch invalidiert
    NEXT_PUBLIC_BUILD_TIME: String(Date.now()),
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ]
  },
}

const sentryOptions = {
  org: 'tropen',
  project: 'javascript-nextjs',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
}

// withSentryConfig modifiziert Webpack-Module-IDs auch bei disable:true — das
// desynchronisiert RSC-Payload-IDs vom Client-Bundle ("options.factory undefined").
// In Dev wird withSentryConfig komplett übersprungen; Sentry-Client-SDK läuft
// weiterhin via instrumentation-client.ts für Fehler-Tracking.
const baseConfig = withNextIntl(withBundleAnalyzer(nextConfig))

export default process.env.NODE_ENV === 'production'
  ? withSentryConfig(baseConfig, sentryOptions)
  : baseConfig
