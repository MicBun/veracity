# Architecture

Veracity is an AI-assisted triage system for donation-based crowdfunding trust &
safety. A two-stage Claude pipeline screens every incoming campaign for fraud
signals and policy violations, cites its evidence, and calibrates its own
uncertainty — then a human reviewer makes every decision.

This document describes the system at the level that requires reading several
files to understand. For the cost breakdown see [`cost-model.md`](./cost-model.md);
for how quality is measured see [`evaluation.md`](./evaluation.md).

## The load-bearing invariant: AI recommends, humans decide

This boundary is the point of the project, and it is enforced in code rather
than convention or UI affordances:

- **`campaigns.status` is written in exactly one place** —
  `app/api/admin/campaigns/[id]/action/route.ts`. The AI pipeline (`lib/ai/*`)
  only ever inserts into `ai_assessments`; it has zero campaign-table writes and
  no code path that could change a status.
- **Public surfaces never carry assessment data.** `/status/[id]` and the
  `/api/submit` progress stream expose campaign content and stage *names* only —
  never risk scores, flags, recommendations, confidence, or reasoning. The
  internal `escalated` status is masked to "Under review" publicly. Assessment
  data is served only under `/admin/*`. The reason is adversarial: teaching a
  submitter what the model reacts to teaches a bad actor how to evade it.
- **Auth is server-side, in two layers.** `middleware.ts` (edge) gates
  `/admin/*` and `/api/admin/*`; every reviewer-action and eval-run handler
  *also* re-checks `getSession()`. Demo auth accepts any username with the
  password `demo`; the username becomes the audit-log identity. Production would
  swap this for SSO/OIDC without touching the boundary above.

## Two-stage pipeline

`lib/ai/pipeline.ts` exposes `assessCampaign()`:

```
screening (every campaign)
  └─ risk_score 0–100 · rubric flags · calibrated confidence · summary
        │
        ▼  if risk_score ≥ 40 OR confidence < 0.7
deep review (only when screening warrants it)
  └─ recommendation · evidence (exact field + verbatim quote) · reasoning
```

- Both stages currently call `claude-haiku-4-5`, but the models are **separate
  config constants** — `MODEL_SCREENING` and `MODEL_DEEP_REVIEW`. This is
  deliberate: a stronger model can be swapped into deep review (where judgment
  matters most) without touching pipeline code. Keep them separate.
- Structured output is enforced with Zod schemas (`lib/ai/schemas.ts`) via the
  SDK's `messages.parse()`. A malformed model response fails closed rather than
  reaching a reviewer.
- `max_tokens` is capped at 1,500 on every call. The Anthropic client runs with
  `maxRetries: 4` so transient rate-limit bursts during eval runs don't error
  individual cases.
- Cost, tokens, and latency are captured per call and returned in the result.

## Prompts are versioned

`PROMPT_VERSION` lives in `lib/ai/prompts.ts` (current: `v5`). Any prompt change
must bump it — the version is recorded on every `ai_assessment` and `eval_run`,
so a metric shift is always attributable to a specific prompt. The prompts went
v1 → v3 against the eval set (v4 was tried and reverted), then v5 simplified the
rubric to six categories. The six-category risk rubric is mirrored in both the
prompts and `RISK_FLAGS`; keep them aligned.

## Persistence boundary

`lib/ai/pipeline.ts` is **pure with respect to the database** — it returns
results and never writes. Callers persist:

- The submit route persists assessments via `lib/ai/persist.ts` *after*
  streaming progress to the client.
- The eval harness deliberately does **not** persist per-case assessments — only
  the aggregate run row.

## Assessment derivation

`lib/assessments.ts` derives reviewer-facing views from stored rows, never the
other way around:

- `bundleAssessments()` picks the latest row per stage, with a deterministic
  tiebreaker on `id` for equal timestamps.
- `laneFor()` maps a bundle to a triage lane — `fast_track`, `needs_review`, or
  `escalated`. Lanes are a derivation over assessments; the AI does not write
  lanes any more than it writes status.

## Data flow of a submission

1. `POST /api/submit` (rate-limited, 3,000-char cap) inserts the campaign as
   `pending` and streams NDJSON stage events to the client (names only).
2. `assessCampaign` runs; assessments are persisted after streaming.
3. The client redirects to `/status/[id]`, which shows a coarse public status.
4. A reviewer opens `/admin/campaign/[id]` and approves / rejects / escalates.
5. The action handler does a conditional `UPDATE … WHERE status = 'pending'` —
   the concurrency gate — and **only on a winning update** inserts the immutable
   `reviews` audit row with a snapshot of the AI's reasoning at decision time.
   Two reviewers racing the same campaign produce one `200` and one `409`, never
   a flip-flopped status or a duplicate audit row.

## Schema & storage

Drizzle schema in `db/schema.ts`; Neon HTTP driver in `db/index.ts`. Tables:
`campaigns`, `ai_assessments`, `reviews` (append-only audit log), `eval_runs`,
`rate_limits`. `reviews` rows are only ever inserted — never updated or deleted.

`db.batch()` on the Neon HTTP driver is atomic but **READ COMMITTED**, so
cross-request guards belong in the `WHERE` clause (as in the action route's
conditional update), not in batch atomicity.

## Rate limiting

`lib/rate-limit.ts` is a Postgres fixed-window upsert (`ON CONFLICT`):
`/submit` is 10/hour/IP; eval runs are 2/hour globally. A live demo behind a
real API key should cost dollars, not surprises.

## Stack notes

Next.js 15 App Router + React 19, Tailwind v4, shadcn/ui (radix), TypeScript;
Drizzle ORM over the Neon serverless HTTP driver; `jose` for signed httpOnly
session cookies; deployed on Vercel (Hobby — 60s function cap).

Pages that read the database use `export const dynamic = "force-dynamic"`.
Edge-safe session logic (`lib/session.ts`, jose only) is split from the
`cookies()`-based `getSession()` (`lib/session-cookies.ts`) so `next/headers`
never enters the edge middleware bundle — keep that split.

Standalone scripts (`scripts/*.ts`, run via `tsx`) load `.env.local` themselves
and import app modules with **relative** paths, not the `@/` alias — the alias
only resolves under Next's bundler.
