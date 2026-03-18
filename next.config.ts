import type { NextConfig } from 'next'
import { withSentryConfig } from '@sentry/nextjs'

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
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.dify.ai https://api.openai.com https://api.anthropic.com https://*.sentry.io",
      "frame-ancestors 'none'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
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

export default withSentryConfig(nextConfig, {
  org: 'tropen',
  project: 'javascript-nextjs',

  // Source Maps hochladen (nur in CI/Prod, nicht lokal)
  silent: !process.env.CI,

  // Sentry-eigene Performance-Tracing Instrumentierung
  widenClientFileUpload: true,
  hideSourceMaps: true,
})
