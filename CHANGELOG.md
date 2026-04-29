# Changelog

All notable changes to Tropen OS are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Beta waitlist + welcome onboarding flow
- Audit batch-fix strategy with 5-finding limit per batch
- WCAG 2.1 AA fixes: 100/100 Lighthouse accessibility score on /audit and /chat
- Benchmark v8: 49 repos scanned (Lovable/Bolt/Cursor/Manual)
- Checker feedback process with GitHub issue templates + `docs/checker-feedback.md`
- Quick Wins algorithm (`src/lib/audit/quick-wins.ts`) with effort/impact scoring
- Self-assessment: 5 yes/no questions for manual checks
- Score percentile rank against v7 benchmark data

### Changed
- Produktname: **Prodify** (Idee, nicht beschlossen, Komitee-Diskussion 2026-04-13)
- Score target for beta: 85% Production Grade
- Findings list: all findings as RecommendationCards (removed table layout)
- Finding actions simplified: "Erledigt" / "Nicht relevant" with undo

### Fixed
- Numerous checker false positives (see `docs/checker-feedback.md`)
- CI/CD checker: added disk fallback for `.github/workflows/` detection
- Rate limit checker: content-based detection instead of import graph
- Deployment docs checker: accepts CLAUDE.md + root-level config files

## [0.4.0] - 2026-04-09

### Added
- Sprint 5b: 30+ automated checks from 18 committee-generated agent rule packs
- Multi-model review pipeline: Sonnet + GPT + Gemini + Grok → Opus judge
- Audit score: 71.3% Stable (from 59.1% Risky on 2026-03-30)
- `docs/audit-reports/2026-04-09-audit-report.md`

## [0.3.0] - 2026-03-30

### Added
- Parallel chat tabs with intent detection
- Bookmarks with multi-select, combine, and new-chat actions
- Model compare popover with capability-based pre-selection
- ChatArea refactored: 681 → 490 lines (extracted useParallelTabs, ArtifactsView)

## [0.2.0] - 2026-03-25

### Added
- Web search via Anthropic `web_search_20260209` server tool + SourcesBar
- Perspectives: parallel AI perspectives with SSE streaming
- Shared chats (`/s/[token]`) with reply support
- PowerPoint export for presentation artifacts
- Text-to-Speech via OpenAI TTS
- Voice input via Web Speech API
- PWA: offline support, service worker, web manifest

## [0.1.0] - 2026-03-15

### Added
- Initial audit system: 26 categories, weighted scoring
- Workspace chat with Anthropic Claude integration
- Supabase auth + RLS multi-tenant data isolation
- Budget enforcement via `check_and_reserve_budget` RPC
- Sentry error monitoring
- Upstash rate limiting
