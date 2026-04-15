// src/lib/audit/checkers/compliance-checker.ts
// E-Commerce, Affiliate, and AI Act compliance checks.
// These rules are profile-gated — only run when relevant features are detected.

import { readFileSync } from 'fs'
import { join } from 'path'
import type { AuditContext, RuleResult, Finding } from '../types'

/** Read file content — prefer in-memory, fall back to disk */
function readContent(ctx: AuditContext, relPath: string): string | null {
  if (ctx.fileContents) {
    const content = ctx.fileContents.get(relPath)
    if (content !== undefined) return content
  }
  if (ctx.rootPath) {
    try { return readFileSync(join(ctx.rootPath, relPath), 'utf-8') } catch { return null }
  }
  return null
}

function pass(id: string, score: number, reason: string): RuleResult {
  return { ruleId: id, score, reason, findings: [], automated: true }
}

function fail(id: string, score: number, reason: string, findings: Finding[]): RuleResult {
  return { ruleId: id, score, reason, findings, automated: true }
}

// ── E-Commerce: AGB vorhanden ──────────────────────────────────────────────

export async function checkAgbPage(ctx: AuditContext): Promise<RuleResult> {
  const patterns = ['/agb', '/terms', '/tos', '/nutzungsbedingungen']
  const routeFiles = ctx.repoMap.files.map((f) => f.path)

  for (const p of patterns) {
    if (routeFiles.some((f) => f.includes(p))) {
      return pass('cat-4-rule-20', 5, `AGB/Terms page found (${p})`)
    }
  }

  return fail('cat-4-rule-20', 0, 'No AGB/Terms page found', [{
    severity: 'high',
    message: 'AGB/Terms of Service page missing — required for online sales (§ 312d BGB)',
    suggestion: "Create a /terms or /agb page. Prompt for Cursor: 'Create a terms of service page at src/app/terms/page.tsx with standard sections'",
    agentSource: 'legal',
    fixHint: 'Add a terms page at src/app/agb/page.tsx or src/app/terms/page.tsx',
  }])
}

// ── E-Commerce: Widerrufsbelehrung vorhanden ────────────────────────────────

export async function checkWiderrufsbelehrung(ctx: AuditContext): Promise<RuleResult> {
  const patterns = ['/widerruf', '/cancellation', '/withdrawal', '/right-of-withdrawal']
  const routeFiles = ctx.repoMap.files.map((f) => f.path)

  for (const p of patterns) {
    if (routeFiles.some((f) => f.includes(p))) {
      return pass('cat-4-rule-21', 5, `Cancellation policy found (${p})`)
    }
  }

  return fail('cat-4-rule-21', 0, 'No cancellation/withdrawal policy found', [{
    severity: 'high',
    message: 'Widerrufsbelehrung missing — required for distance selling (§ 312g BGB)',
    suggestion: 'Create a /widerruf or /cancellation page with withdrawal instructions',
    agentSource: 'legal',
    fixHint: 'Add withdrawal policy at src/app/widerruf/page.tsx',
  }])
}

// ── E-Commerce: Button-Text Check ───────────────────────────────────────────

export async function checkCheckoutButtonText(ctx: AuditContext): Promise<RuleResult> {
  const checkoutFiles = ctx.repoMap.files.filter((f) =>
    f.path.includes('checkout') || f.path.includes('payment') ||
    f.path.includes('subscribe') || f.path.includes('pricing')
  )

  if (checkoutFiles.length === 0) {
    return pass('cat-4-rule-22', 3, 'No checkout components found — cannot verify button text')
  }

  // German law requires "kostenpflichtig bestellen" or equivalent
  const validPatterns = /kostenpflichtig\s+bestellen|zahlungspflichtig\s+bestellen|jetzt\s+kaufen/i
  const found: string[] = []

  for (const f of checkoutFiles) {
    const content = readContent(ctx, f.path)
    if (!content) continue
    if (validPatterns.test(content)) {
      found.push(f.path)
    }
  }

  if (found.length > 0) {
    return pass('cat-4-rule-22', 5, `Compliant button text found in ${found[0]}`)
  }

  return fail('cat-4-rule-22', 2, 'Checkout button text may not comply with § 312j BGB', [{
    severity: 'medium',
    message: 'Checkout button should read "Kostenpflichtig bestellen" or equivalent (§ 312j Abs. 3 BGB)',
    suggestion: 'Use "Kostenpflichtig bestellen" as checkout button text for German users',
    agentSource: 'legal',
    affectedFiles: checkoutFiles.map((f) => f.path),
  }])
}

// ── Affiliate: URL Detection ────────────────────────────────────────────────

const AFFILIATE_PATTERNS = [
  /amazon\.[a-z.]+\/.*[?&]tag=/,
  /awin1\.com/,
  /partnerize\.com/,
  /shareasale\.com/,
  /commission-junction\.com|cj\.com/,
  /impact\.com\/ad/,
  /ref=.*affiliate/i,
]

export async function checkAffiliateDisclosure(ctx: AuditContext): Promise<RuleResult> {
  const violations: Finding[] = []

  for (const file of ctx.repoMap.files) {
    if (!file.path.endsWith('.tsx') && !file.path.endsWith('.jsx')) continue
    const content = readContent(ctx, file.path)
    if (!content) continue

    for (const pattern of AFFILIATE_PATTERNS) {
      if (pattern.test(content)) {
        violations.push({
          severity: 'medium',
          message: `Affiliate link detected without disclosure labeling`,
          filePath: file.path,
          suggestion: 'Label affiliate links with "Werbung" or "Anzeige" (§ 5a UWG)',
          agentSource: 'legal',
          fixHint: 'Add "Werbung" or "Anzeige" text directly next to affiliate links',
        })
        break // one finding per file
      }
    }
  }

  if (violations.length === 0) {
    return pass('cat-5-rule-20', 5, 'No unlabeled affiliate links detected')
  }

  return fail('cat-5-rule-20', 2,
    `${violations.length} file(s) with affiliate links — check disclosure`, violations)
}

// ── AI Act: Transparency Disclosure ─────────────────────────────────────────

export async function checkAiTransparency(ctx: AuditContext): Promise<RuleResult> {
  const pkg = ctx.packageJson
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  const hasAiSdk = Object.keys(deps).some((d) =>
    d.includes('openai') || d.includes('anthropic') || d.includes('ai-sdk') ||
    d.includes('@ai-sdk') || d.includes('langchain') || d.includes('google-generativeai')
  )

  if (!hasAiSdk) {
    return pass('cat-22-rule-14', 5, 'No AI SDK detected — transparency check not applicable')
  }

  // Look for disclosure page or component
  const disclosurePatterns = ['/ai-disclosure', '/ki-hinweis', '/ai-transparency']
  const routes = ctx.repoMap.files.map((f) => f.path)
  const hasDisclosurePage = disclosurePatterns.some((p) => routes.some((r) => r.includes(p)))

  // Look for inline disclosure text in layout
  const layoutFiles = ctx.repoMap.files.filter((f) =>
    f.path.includes('layout.tsx') || f.path.includes('layout.ts')
  )
  let hasInlineDisclosure = false
  for (const lf of layoutFiles) {
    const content = readContent(ctx, lf.path)
    if (!content) continue
    if (/powered\s+by\s+ai|ki-gestützt|ai-generated|ki-generiert/i.test(content)) {
      hasInlineDisclosure = true
      break
    }
  }

  if (hasDisclosurePage || hasInlineDisclosure) {
    return pass('cat-22-rule-14', 5, 'AI transparency disclosure found')
  }

  return fail('cat-22-rule-14', 1, 'AI SDK detected but no transparency disclosure', [{
    severity: 'high',
    message: 'AI Act Art. 50: Users must be informed when interacting with AI systems',
    suggestion: 'Add an AI disclosure page or visible notice that AI features are used',
    agentSource: 'ai-act',
    fixHint: 'Create src/app/ai-disclosure/page.tsx or add "Powered by AI" to your layout',
  }])
}

// ── AI Act: Content Labeling ────────────────────────────────────────────────

export async function checkAiContentLabeling(ctx: AuditContext): Promise<RuleResult> {
  const pkg = ctx.packageJson
  const deps = { ...pkg.dependencies, ...pkg.devDependencies }
  const hasAiSdk = Object.keys(deps).some((d) =>
    d.includes('openai') || d.includes('anthropic') || d.includes('@ai-sdk') ||
    d.includes('langchain')
  )

  if (!hasAiSdk) {
    return pass('cat-22-rule-15', 5, 'No AI SDK — content labeling not applicable')
  }

  return fail('cat-22-rule-15', 2, 'AI SDK detected — verify content labeling', [{
    severity: 'medium',
    message: 'AI Act Art. 50(2): AI-generated content must be labeled as such',
    suggestion: 'Label AI-generated text, images, or audio with a visible indicator',
    agentSource: 'ai-act',
    fixHint: 'Add a "Generated by AI" label near AI-produced content in your UI',
  }])
}
