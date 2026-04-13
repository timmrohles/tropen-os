// Required by @sentry/nextjs webpack plugin (v10.x) as a build entry point.
// Actual Sentry client initialization lives in src/instrumentation-client.ts
// which is the Next.js 15 instrumentation pattern.
// This file is intentionally empty to avoid double-initialization.
export {}
