# Amanah — AI Triage Copilot for Campaign Trust & Safety

Amanah (Arabic: أمانة, "trust") is an AI-assisted triage system for
donation-based crowdfunding platforms. A two-stage Claude pipeline screens
every incoming campaign for fraud signals, policy violations, and
zakat-eligibility claims, cites its evidence, and calibrates its own
uncertainty — then a human reviewer makes every decision.

**The boundary is enforced in code, not just UI:** no code path lets the AI
change a campaign's status, and AI assessments are never served to public
endpoints.

## How it works

```
submission ──▶ Stage 1: screening (every campaign)
               risk score 0–100 · rubric flags · confidence · summary
                     │
                     ▼  if risk ≥ 40 or confidence < 0.7
               Stage 2: deep review
               recommendation · evidence quoting exact campaign fields
               risk + mitigating factors · reasoning
                     │
                     ▼  recommendation only
               Reviewer console (demo-login protected)
               approve / reject / escalate ──▶ immutable audit log
```

- Both stages run `claude-haiku-4-5` with Zod-validated structured outputs.
  The stage models are config constants (`MODEL_SCREENING`,
  `MODEL_DEEP_REVIEW` in `lib/ai/pipeline.ts`) so a stronger model can be
  swapped into deep review without touching pipeline code.
- Token usage, cost (hardcoded price table), latency, and prompt version are
  recorded on every assessment.
- An eval harness (`npm run evals` or the Run button on `/admin/evals`) runs
  the pipeline against 30 labeled campaigns and reports per-class
  precision/recall, a confusion matrix, and false-negative drill-down.
  Prompts were tuned v1 → v3 against these metrics.

## Documentation

The engineering detail lives in [`docs/`](./docs), not on the live site — the
public pages stay in product voice:

- [`docs/architecture.md`](./docs/architecture.md) — the two-stage pipeline, the
  code-enforced "AI recommends, humans decide" boundary, persistence and
  derivation layers, the submission data flow, schema, and stack notes.
- [`docs/cost-model.md`](./docs/cost-model.md) — pricing table, per-operation
  cost, what it costs at scale, and the cost controls.
- [`docs/evaluation.md`](./docs/evaluation.md) — the 30-case labeled set, the
  output→class mapping, the metrics (and why recall counts errored cases), and
  the known failure modes.

## Pages

| Route | Access | What it is |
|---|---|---|
| `/` | public | Landing page |
| `/submit` | public | Campaign submission with live pipeline progress (stage names only) |
| `/status/[id]` | public | Campaign status — never shows AI internals |
| `/about` | public | How it works, in product voice — links to the docs for engineering depth |
| `/login` | public | Demo reviewer sign-in (any username + password `demo`) |
| `/admin/queue` | reviewer | Three-lane triage queue sorted by risk |
| `/admin/campaign/[id]` | reviewer | Campaign next to its assessment; evidence highlights the cited field; actions + audit log |
| `/admin/evals` | reviewer | Eval dashboard with cached results and live re-run |

## Running locally

```bash
npm install
cp .env.example .env.local   # fill in the three variables
npm run db:migrate           # apply schema to Neon
npm run seed                 # 10 demo campaigns with committed assessments
npm run dev
```

Environment variables:

```
ANTHROPIC_API_KEY=   # Anthropic API key
DATABASE_URL=        # Neon pooled connection string
SESSION_SECRET=      # secret for signing the demo-login session cookie
```

Useful scripts:

- `npm run seed` — reset the demo queue (free: assessments are committed JSON)
- `npm run evals` — full eval run from the CLI (~$0.18, ~2 min)
- `npx tsx scripts/test-pipeline.ts` — pipeline smoke test on 3 campaigns

## Abuse protection (public deployment, real API key)

- `/submit`: 10 submissions/hour per IP (Postgres-backed fixed window)
- Eval runs: admin-only + global cap of 2 runs/hour
- Description cap 3,000 chars; `max_tokens` 1,500 on every model call
