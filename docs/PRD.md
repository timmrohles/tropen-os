# Product Requirements Document — Tropen OS (Arbeitsname; Prodify war Idee, nicht beschlossen)

> **Version:** 1.0 | **Date:** 2026-04-21 | **Status:** Active
> **Based on:** 5 committee reviews, competitive analysis, benchmark data

## Problem Statement

Vibe-coders (non-professional developers using AI coding tools like Cursor, Bolt, Lovable) ship
products that look finished but are systematically missing production-readiness properties:
security, DSGVO compliance, error monitoring, backup plans, CI/CD, rate limiting, etc.

They don't know what they don't know. No tool currently guides them from "I built something" to
"my product is ready for real users."

## Target Users

| User Type | Description | Primary Goal |
|-----------|-------------|-------------|
| Solo-Gründer (Vibe-Coder) | Non-technical founder building with AI tools | Ship safely without knowing all the gaps |
| Freelance Developer | Building for clients, wants to deliver quality | Systematically validate before handoff |
| Small Agency | 2–5 person team, multiple client projects | Repeatable quality process |

## Core Value Proposition

**"Von der Idee zum production-reifen Produkt — mit EU-Compliance."**

Prodify is the third category between vibe-coding tools (Cursor/Bolt/Lovable) and deep quality tools
(/ultrareview, SonarQube): a **Production Readiness Guide** that translates findings into actionable
Cursor prompts a non-technical founder can actually execute.

## MVP Features (Q2 2026)

### 1. Audit Engine
- 242 rules across 26 categories (178 automated, 64 manual)
- Scoring: 0–5 per rule, weighted by category importance
- Status tiers: Prototype (<60%) / Risky (60–79%) / Stable (80–89%) / Production (90–100%)
- False positive rate target: <10% per rule

### 2. Fix Prompt Generator
- Deterministic (no LLM cost) cursor-prompt generation per finding
- Template engine: Problem / Location / Why / Fix / Validation
- Group-level prompts for related findings

### 3. External Project Scanner
- File System Access API (browser-native, no upload)
- Stack detection: framework, DB, auth, styling, testing, deployment
- Profile-based relevance (compliance rules only for applicable projects)

## Non-Goals (Explicitly Out of Scope)

- Training custom AI models
- Running own GPU infrastructure
- Replacing Cursor / Bolt / Lovable (complementary, not competitive)
- Enterprise compliance audit (certifications, penetration testing)

## Success Metrics

| Metric | Target (Beta) | Target (GA) |
|--------|--------------|-------------|
| Beta users | 10 | 100 |
| Avg audit score improvement after fixes | +5pp | +10pp |
| FP rate per rule | <15% | <10% |
| Time to first audit | <3 min | <2 min |
| NPS | >30 | >50 |

## Technical Constraints

- Stack: Next.js 15, React 19, Supabase, TypeScript strict
- EU data residency required (Supabase Frankfurt)
- DSGVO compliance required before any user data collection
- Budget: Anthropic API costs must be tracked per org

## Roadmap Summary

| Phase | When | Focus |
|-------|------|-------|
| Beta Pilot | Q2 2026 | 10 users, 85%+ own score, cookie consent |
| GA | Q3 2026 | 100 users, self-serve onboarding, pricing |
| Scale | Q4 2026 | MCP integrations, team features, API access |
