// src/lib/file-access/stack-detector.ts
// Client-side stack detection from in-memory project files.
// Runs in the browser after directory-reader collects files.

import type { ProjectFile } from './types'

export interface DetectedStack {
  framework: string | null
  frameworkVersion: string | null
  language: 'typescript' | 'javascript'
  database: string | null
  auth: string | null
  styling: string | null
  testing: string | null
  errorTracking: string | null
  deployment: string | null
  hasI18n: boolean
  hasPwa: boolean
  hasPublicApi: boolean
  hasTests: boolean
  hasCi: boolean
  hasDocker: boolean
  packageName: string | null
  packageVersion: string | null
  dependencyCount: number
  devDependencyCount: number
}

type Pkg = {
  name?: string
  version?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
}

function findAndParsePackageJson(files: ProjectFile[]): Pkg | null {
  const file = files.find((f) => f.path === 'package.json')
  if (!file) return null
  try {
    return JSON.parse(file.content) as Pkg
  } catch {
    return null
  }
}

function detectFramework(deps: Record<string, string>): { name: string; version: string } | null {
  if (deps['next']) return { name: 'next.js', version: deps['next'] }
  if (deps['nuxt']) return { name: 'nuxt', version: deps['nuxt'] }
  if (deps['@sveltejs/kit']) return { name: 'sveltekit', version: deps['@sveltejs/kit'] }
  if (deps['svelte']) return { name: 'svelte', version: deps['svelte'] }
  if (deps['vue']) return { name: 'vue', version: deps['vue'] }
  if (deps['fastify']) return { name: 'fastify', version: deps['fastify'] }
  if (deps['express']) return { name: 'express', version: deps['express'] }
  if (deps['react']) return { name: 'react', version: deps['react'] }
  return null
}

function detectDatabase(deps: Record<string, string>): string | null {
  if (deps['@supabase/supabase-js']) return 'supabase'
  if (deps['@prisma/client']) return 'prisma'
  if (deps['drizzle-orm']) return 'drizzle'
  if (deps['mongoose']) return 'mongoose'
  if (deps['pg'] || deps['postgres']) return 'postgresql'
  if (deps['mysql2']) return 'mysql'
  if (deps['better-sqlite3']) return 'sqlite'
  return null
}

function detectAuth(deps: Record<string, string>): string | null {
  if (deps['@supabase/ssr'] || deps['@supabase/auth-helpers-nextjs']) return 'supabase-auth'
  if (deps['next-auth'] || deps['@auth/core']) return 'next-auth'
  if (deps['@clerk/nextjs'] || deps['@clerk/clerk-sdk-node']) return 'clerk'
  if (deps['lucia']) return 'lucia'
  if (deps['passport']) return 'passport'
  return null
}

function detectStyling(allDeps: Record<string, string>): string | null {
  if (allDeps['tailwindcss']) return 'tailwind'
  if (allDeps['styled-components']) return 'styled-components'
  if (allDeps['@emotion/react']) return 'emotion'
  if (allDeps['@vanilla-extract/css']) return 'vanilla-extract'
  return null
}

function detectTesting(devDeps: Record<string, string>): string | null {
  if (devDeps['vitest']) return 'vitest'
  if (devDeps['jest'] || devDeps['@jest/core']) return 'jest'
  if (devDeps['@playwright/test']) return 'playwright'
  if (devDeps['cypress']) return 'cypress'
  return null
}

function detectErrorTracking(deps: Record<string, string>): string | null {
  if (deps['@sentry/nextjs'] || deps['@sentry/node'] || deps['@sentry/browser']) return 'sentry'
  if (deps['@bugsnag/js']) return 'bugsnag'
  if (deps['logrocket']) return 'logrocket'
  return null
}

function detectDeployment(files: ProjectFile[]): string | null {
  if (files.some((f) => f.path === 'vercel.json' || f.path === 'vercel.ts')) return 'vercel'
  if (files.some((f) => f.path === 'netlify.toml')) return 'netlify'
  if (files.some((f) => f.path === 'fly.toml')) return 'fly.io'
  if (files.some((f) => f.path === 'Dockerfile' || f.path === 'docker-compose.yml')) return 'docker'
  if (files.some((f) => f.path.startsWith('.aws/'))) return 'aws'
  return null
}

export function detectStack(files: ProjectFile[]): DetectedStack {
  const pkg = findAndParsePackageJson(files)
  const deps = pkg?.dependencies ?? {}
  const devDeps = pkg?.devDependencies ?? {}
  const allDeps = { ...deps, ...devDeps }

  const frameworkResult = detectFramework(deps)
  const testing = detectTesting(devDeps)

  const hasTests =
    testing !== null &&
    files.some((f) => /\.(test|spec)\.(ts|tsx|js|jsx)$/.test(f.path))

  return {
    framework: frameworkResult?.name ?? null,
    frameworkVersion: frameworkResult?.version ?? null,
    language: files.some((f) => f.path === 'tsconfig.json') ? 'typescript' : 'javascript',
    database: detectDatabase(deps),
    auth: detectAuth(deps),
    styling: detectStyling(allDeps),
    testing,
    errorTracking: detectErrorTracking(deps),
    deployment: detectDeployment(files),
    hasI18n: !!(allDeps['react-i18next'] || allDeps['next-intl'] || allDeps['i18next'] || allDeps['next-i18next']),
    hasPwa: !!(
      allDeps['next-pwa'] ||
      files.some((f) => f.path === 'public/manifest.json' || f.path === 'public/sw.js')
    ),
    hasPublicApi: files.some(
      (f) =>
        f.path === 'openapi.json' ||
        f.path === 'openapi.yaml' ||
        f.path === 'swagger.json' ||
        f.path === 'swagger.yaml' ||
        f.path.includes('docs/api')
    ),
    hasTests,
    hasCi: files.some((f) => f.path.startsWith('.github/workflows/')),
    hasDocker: files.some((f) => f.path === 'Dockerfile' || f.path === 'docker-compose.yml'),
    packageName: pkg?.name ?? null,
    packageVersion: pkg?.version ?? null,
    dependencyCount: Object.keys(deps).length,
    devDependencyCount: Object.keys(devDeps).length,
  }
}
