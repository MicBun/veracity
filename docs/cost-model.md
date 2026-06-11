# Cost model

Token usage is captured from every API response and priced with a hardcoded
table; every assessment row carries its own cost. Cost is treated as a
first-class output of the system, not an afterthought — it is recorded per call,
aggregated per eval run, and visible to reviewers in the console.

## Pricing table

Prices are USD per million tokens, hardcoded in `PRICE_TABLE`
(`lib/ai/pipeline.ts`):

| Model | Input ($/M) | Output ($/M) |
|---|---|---|
| `claude-haiku-4-5` | 1.00 | 5.00 |
| `claude-sonnet-4-6` | 3.00 | 15.00 |

`claude-sonnet-4-6` is listed so a stronger model can be priced correctly the
moment it is swapped into deep review — see the model-config note in
[`architecture.md`](./architecture.md#two-stage-pipeline).

## Per-operation cost

| Operation | Model | Typical tokens (in / out) | Typical cost |
|---|---|---|---|
| Screening | `claude-haiku-4-5` | ~1,400 / ~80 | ~$0.002 |
| Deep review | `claude-haiku-4-5` | ~1,900 / ~450 | ~$0.006 |
| Full eval run (30 cases) | both stages | ~100k / ~15k | ~$0.18 |

`computeCostUsd()` derives each figure from `response.usage`, so the numbers
above are typical observed values, not estimates baked into the code.

## What this means at scale

At Haiku rates, screening one hundred thousand campaigns costs about the same as
a single reviewer-hour. The economic argument for the system is exactly this:
the screening pass scales with traffic at negligible marginal cost, so human
attention can be spent on the cases that actually need judgment instead of on
first-pass reading.

## Cost controls

- `max_tokens` is capped at **1,500** on every model call.
- Campaign descriptions are capped at **3,000 characters** before they reach the
  pipeline.
- Deep review only runs when screening warrants it (risk ≥ 40 or confidence <
  0.7), so the cheap stage absorbs the majority of traffic.
- Public submission is rate-limited to 10/hour/IP; eval runs are capped at
  2/hour globally. See [`architecture.md`](./architecture.md#rate-limiting).
