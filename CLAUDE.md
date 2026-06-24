# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Veracity is an AI triage copilot for donation-crowdfunding trust & safety. A two-stage Claude pipeline screens every campaign for fraud/policy signals, cites its evidence, and calibrates confidence — then a human reviewer makes every decision. Deployed on Vercel; data in Neon Postgres.

## Commands

```bash
npm run dev          # local dev (Turbopack)
npm run build        # production build (Turbopack)
npm run lint         # eslint — must be clean before commit
npm run db:generate  # generate a Drizzle migration after editing db/schema.ts
npm run db:migrate   # apply migrations to Neon (reads .env.local)
npm run seed         # reset the demo queue: deletes source='seed' rows, re-inserts 10 campaigns + committed assessments (free, no API calls)
npm run evals        # full 30-case eval run from the CLI (~$0.17, ~60s); writes a row to eval_runs
npx tsx scripts/test-pipeline.ts   # live pipeline smoke test on 3 seed campaigns, NO DB writes
```

There is no test runner. Verification is done by `npm run build`, `npm run lint`, the eval harness, and the smoke-test script. Env vars (`.env.local`): `ANTHROPIC_API_KEY`, `DATABASE_URL` (Neon pooled), `SESSION_SECRET`.

Standalone scripts (`scripts/*.ts`, run via `tsx`) load `.env.local` themselves and import app modules with **relative** paths (`../lib/...`), not the `@/` alias — the `@/` alias only resolves under Next's bundler. Match this when adding scripts.

## The load-bearing invariant: AI recommends, humans decide

This boundary is enforced in code and is the point of the project. When touching the pipeline, status transitions, or public routes, preserve it:

- **`campaigns.status` is written in exactly ONE place:** `app/api/admin/campaigns/[id]/action/route.ts`. The AI pipeline (`lib/ai/*`) only ever inserts into `ai_assessments` — it has zero campaign-table writes. Do not add a status write anywhere else.
- **Public routes must never expose assessment data.** `/status/[id]` and the `/api/submit` progress stream carry campaign content and stage names only — never risk scores, flags, recommendations, confidence, or reasoning. The internal `escalated` status is masked to "Under review" publicly (`app/status/[id]/page.tsx`). Assessment data is served only under `/admin/*`.
- **Auth is server-side, two layers.** `middleware.ts` (edge) gates `/admin/*` and `/api/admin/*`; every reviewer-action and eval-run handler *also* re-checks `getSession()`. Demo auth: any username + password `demo`; the username is the audit-log identity.

## Architecture

**Two-stage pipeline** (`lib/ai/pipeline.ts`): `assessCampaign()` runs screening (every campaign) → deep review (only when `risk_score >= 40` OR `confidence < 0.7`). Both stages call `claude-haiku-4-5`, but the models are **separate config constants** (`MODEL_SCREENING`, `MODEL_DEEP_REVIEW`) so a stronger model can be swapped into deep review without touching pipeline code — keep them separate. Structured output is enforced with Zod schemas (`lib/ai/schemas.ts`) via `messages.parse()`. Cost/tokens/latency are captured per call; `max_tokens` is capped at 1500.

**Prompts are versioned** (`PROMPT_VERSION` in `lib/ai/prompts.ts`). Any prompt change must bump this constant — it is recorded on every `ai_assessment` and `eval_run` so metric changes are attributable. Current version is `v5` (tuned v1→v3 against the eval set; v4 was tried and reverted; v5 simplified the rubric to six categories). The 6-category risk rubric lives in both the prompts and `RISK_FLAGS`; keep them aligned.

**Persistence boundary:** `lib/ai/pipeline.ts` is pure w.r.t. the DB (returns results); callers persist via `lib/ai/persist.ts`. The submit route persists after streaming; the eval harness does not persist per-case assessments.

**Assessment derivation** (`lib/assessments.ts`): `bundleAssessments()` picks the latest row per stage (deterministic tiebreaker on `id` for equal timestamps). `laneFor()` maps a bundle to a queue lane (fast_track / needs_review / escalated). These are derivations over stored assessments — the AI does not write lanes.

**Eval harness** (`lib/evals.ts`): runs all 30 labeled cases from `data/eval-set.json` through the live pipeline at `EVAL_CONCURRENCY` (5 — chosen so a run finishes under Vercel Hobby's 60s function cap), maps pipeline output → predicted class (`predictClass`, mapping documented in `MAPPING_DOC`), and computes per-class precision/recall, a confusion matrix, and false-negative drill-down. **Recall denominators count errored cases** so a dropped fraud case lowers the safety metric rather than vanishing. Callable from `npm run evals` and the streamed `/api/admin/evals/run` route. `getLatestCompleteRun()` is the dashboard cache.

**Data flow of a submission:** `POST /api/submit` (rate-limited, 3000-char cap) inserts the campaign as `pending`, streams NDJSON stage events to the client, runs `assessCampaign`, persists assessments, then the client redirects to `/status/[id]`. The reviewer later opens `/admin/campaign/[id]`, and an approve/reject/escalate POST does a conditional `UPDATE ... WHERE status='pending'` (the concurrency gate) and, only on a winning update, inserts the immutable `reviews` audit row with a snapshot of the AI's reasoning.

## Schema & data

Drizzle schema in `db/schema.ts`; client in `db/index.ts` (Neon HTTP driver). Tables: `campaigns`, `ai_assessments`, `reviews` (append-only audit log), `eval_runs`, `rate_limits`. `reviews` rows are only ever inserted, never updated/deleted. `db.batch()` on the Neon HTTP driver is atomic but READ COMMITTED — cross-request guards belong in the `WHERE` clause, not in batch atomicity (see the action route's conditional update).

`data/seed-campaigns.json` ships 10 queue campaigns with **committed pre-generated assessment JSON** (keeps seeding free and deterministic — evidence quotes are verbatim substrings of the cited field). `data/eval-set.json` holds 30 labeled cases (8 clean / 8 subtle_fraud / 7 obvious_fraud / 7 ambiguous) used only for evals, never the queue.

## Stack notes

Next.js 15 App Router + React 19, Tailwind v4, shadcn/ui (radix), TypeScript. Pages reading the DB use `export const dynamic = "force-dynamic"`. Session token logic (jose) lives in `lib/session.ts` (edge-safe, no `next/headers`); the `cookies()`-based `getSession()` is split into `lib/session-cookies.ts` so it never enters the edge middleware bundle — keep that split. Rate limiting (`lib/rate-limit.ts`) is a Postgres fixed-window upsert: `/submit` 10/hr/IP, eval runs 2/hr global.
