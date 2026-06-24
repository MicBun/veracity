# Veracity rebrand — design spec

**Date:** 2026-06-24
**Status:** Approved (design) — ready for implementation plan
**Author:** Michael Buntarman (with Claude Code)

## Why

`Amanah` is being repackaged as a portfolio piece. The current name (Arabic أمانة, "trust")
and the `Zakat`-eligibility feature frame the product as Muslim-focused. That framing is
incidental to what the product actually is — an AI triage copilot for donation-crowdfunding
trust & safety — and the goal is to present it as a general, secular T&S product.

This spec covers: (1) renaming the brand to **Veracity**, (2) removing the Zakat feature
entirely, and (3) sweeping the remaining Islamic-specific framing out of prompts, copy, and
test data — while preserving the product's positioning, the `ShieldCheck`/emerald visual
identity, and the load-bearing "AI recommends, humans decide" invariant.

## Decisions (settled)

| Decision | Choice | Notes |
|---|---|---|
| New name | **Veracity** | "conformity to truth" — names what the system establishes; secular; keeps the editorial tone. Credence/Verity are drop-in alternates if reconsidered. |
| Zakat | **Remove entirely** | Not renamed. Clean ~16-file removal + DB `DROP COLUMN`. |
| Prompt version | `v3` → **`v5`** | NOT `v4`: CLAUDE.md records "v4 was tried and reverted," so reusing `v4` would make attribution ambiguous. Jump to `v5`. |
| Visual identity | **Unchanged** | Emerald palette + `ShieldCheck` mark are religion-neutral and carry over. Gold accent token stays (still used by the OG "demo" badge). |
| Positioning | **Unchanged** | Remains "trust & safety for donation crowdfunding." Only the religious framing is removed. |
| Test data | **Diversify into a general mix** | The eval + seed corpora are pervasively Islamic-themed (not just the `zakat_claimed` field). Rewrite them as a *general* crowdfunding platform: a realistic mix of medical / disaster / education / small-business / community causes, with only a few faith-based cases spread across different faiths/secular. Preserve each case's class label, structural fraud/clean signal, and difficulty. |

## Non-goals / out of scope (user-performed)

These are infrastructure actions outside the codebase; the spec only updates the **string
references** to them:

- DNS / Vercel domain change (`amanah.micbun.com` → `veracity.micbun.com`).
- GitHub repo rename (`MicBun/amanah` → `MicBun/veracity`).
- Any production data migration for the cookie rename — this is a demo with no live sessions,
  so the cookie is renamed outright with no compatibility shim.

## The load-bearing invariant (must be preserved)

Per CLAUDE.md, this rebrand must NOT touch the AI-recommends/humans-decide boundary:
- `campaigns.status` stays written in exactly one place (`app/api/admin/campaigns/[id]/action/route.ts`).
- Public routes still expose zero assessment data.
- The pipeline still only inserts into `ai_assessments`.

Removing Zakat removes one *input field* and one *risk category*; it does not change who writes
status or what public routes expose.

---

## Workstream A — Rename `Amanah` → `Veracity`

~47 occurrences, almost all user-visible copy. Mechanical string replacement except where the
copy leans on the name's Arabic meaning.

| Surface | Change |
|---|---|
| Wordmark / nav / headings (`app/page.tsx`, `app/about/page.tsx`, `components/public/site-header.tsx`, `app/admin/layout.tsx`, `app/status/[id]/page.tsx`, `app/login/page.tsx`, `app/submit/page.tsx`, `app/campaigns/page.tsx`) | `Amanah` → `Veracity` |
| Name-meaning gloss (`app/page.tsx:137`, `README.md:3`, `docs/architecture.md`) | Drop the `(أمانة — "trust")` etymology **and** the zakat clause. Reword to stand on the product. |
| Metadata title / OG / `siteName` (`app/layout.tsx`, `app/opengraph-image.tsx`, `app/about/page.tsx`, `app/campaigns/page.tsx`) | `Amanah — …` → `Veracity — AI triage copilot for campaign trust & safety` |
| `package.json` / `package-lock.json` name | `amanah` → `veracity` |
| Domain strings (`app/layout.tsx` metadataBase + OG url, `app/opengraph-image.tsx`, `README.md`) | `amanah.micbun.com` → `veracity.micbun.com` |
| Session cookie (`lib/session.ts:11`) | `amanah_session` → `veracity_session` (hard rename, no shim) |
| Repo URL (`app/about/page.tsx`, `components/public/site-footer.tsx`) | `github.com/MicBun/amanah` → `…/veracity` |
| AI prompt self-reference (`lib/ai/prompts.ts:18`) | `the screening stage of Amanah` → `the screening stage of Veracity` |
| Docs (`CLAUDE.md`, `README.md`, `docs/architecture.md`) | Update brand name + descriptions |

**Tagline read-through (unchanged structure):** *Veracity — AI reads every campaign. People make every call.*

Note: the historical plan docs under `docs/superpowers/plans/` contain `Amanah` but are dated
records — leave them as-is (they describe past work). Only `CLAUDE.md`, `README.md`,
`docs/architecture.md`, and the new spec describe the current product.

## Workstream B — Remove Zakat + secularize the prompt

Zakat is a clean, standalone category (confirmed by audit — no hidden dependencies). Removal
spans these layers:

- **Prompt (`lib/ai/prompts.ts`)** — delete rubric item #5 (`zakat_eligibility_doubt`); remove
  the `zakat_claimed` entry from the allowed `source_field` list (line 57) and from
  `renderCampaign()` (line 69); remove the "a zakat claim for a plainly ineligible use" example
  from deep-review guidance (line 50); **bump `PROMPT_VERSION` to `v5`** (line 7).
- **Secularize `PLATFORM_CONTEXT` (line 18)** — currently "serving Muslim communities and
  general charitable causes (mosque and community-center projects, medical emergencies, refugee
  relief, education funds, and zakat-eligible charity cases)." Reword to a secular description,
  e.g. "serving a broad range of charitable causes (medical emergencies, disaster and refugee
  relief, education funds, community projects, and memorial funds)." Exact wording in the plan.
- **Schema (`lib/ai/schemas.ts`)** — remove `zakat_eligibility_doubt` from `RISK_FLAGS` (line 9),
  the `zakat_claimed` mention in the evidence `source_field` description (line 48), and
  `zakat_claimed: boolean` from `CampaignInput` (line 77).
- **DB (`db/schema.ts:56`)** — remove `zakatClaimed`; `npm run db:generate` produces a new
  `DROP COLUMN "zakat_claimed"` migration.
- **API (`app/api/submit/route.ts`)** — remove `zakat_claimed` from the request schema (line 23)
  and the insert mapping (line 75).
- **Scripts (`scripts/seed.ts`, `scripts/test-pipeline.ts`)** — remove the `zakat_claimed` type
  hints and insert/input mappings.
- **UI** — remove the Zakat chip / badge / field-row / checkbox from: `app/submit/page.tsx`
  (state + checkbox + help text), `app/campaigns/page.tsx`, `app/campaigns/[id]/page.tsx`,
  `app/status/[id]/page.tsx`, `app/admin/queue/page.tsx`, `app/admin/history/page.tsx`,
  `app/admin/campaign/[id]/page.tsx` (prop), `components/admin/campaign-review.tsx` (prop + FieldRow).
- **Component (`components/public/brand.tsx`)** — delete the `ZakatChip` function (its only
  consumers are the UI sites above). The amber/gold token stays — the OG "demo" badge still uses it.
- **Marketing copy** — remove "zakat-eligibility claims/doubt" from `app/page.tsx` (hero +
  rubric blurb), `app/about/page.tsx`, and `CLAUDE.md`. The rubric is now **six** categories —
  update the "seven-category rubric" phrasing (`app/page.tsx:182`).

### Vocabulary sweep (completeness)

Removing the literal `zakat` string is not enough. After the edits, grep the repo
(case-insensitive) for the adjacent Islamic vocabulary and secularize any remaining hits in
**copy and data**: `zakat`, `sadaqah`, `waqf`, `masjid`, `mosque`, `al-gharimin`, `ummah`,
`Muslim`, `Islamic`, `Quran`, `أمانة`. (The audit already found `al-gharimin` and "masjid zakat
committee" inside `data/eval-set.json` — see Workstream C.)

## Workstream C — Test data + baseline

**Scope correction (from the data sweep):** the Islamic framing is NOT confined to the
`zakat_claimed` field. It is woven through almost every campaign *story* in both corpora —
clean, subtle-fraud, and obvious-fraud alike (masjids, Jummah, Ramadan, "Assalamu alaikum",
"Alhamdulillah", "JazakAllah khair", al-gharimin / faqir / miskin, "the Prophet (pbuh)",
Day-of-Judgment guilt). Counts: `zakat_claimed: true` in 7/10 seed + 15/30 eval cases; the
`zakat_eligibility_doubt` flag appears in 1 seed assessment and 2 eval rationales. Several
obvious-fraud cases weaponize religious guilt as the fraud vector itself. So the data rewrite is
the largest piece of work, and per the **diversify** decision it reframes the corpus as a general
platform rather than scrubbing religion to zero.

- **`data/eval-set.json`** (30 labeled cases, no committed assessments — the eval runs the live
  pipeline): for every case, strip `zakat_claimed`, and rewrite the `campaign` story + `rationale`
  into a **diversified, mostly-secular** equivalent. Hard invariants per case: keep the `id` and
  `label` (class); keep the 8 clean / 8 subtle_fraud / 7 obvious_fraud / 7 ambiguous split; keep
  the *structural* signal the rationale names (re-anchor the 2 `zakat_eligibility_doubt` cases to
  surviving categories — `financial_anomaly` / `unverifiable_claims`, which they already partly
  rely on); preserve goal-vs-itemization arithmetic (it drives `financial_anomaly`) and
  `organizer_history` (it drives `identity_mismatch` / `duplicate_pattern`). Convert
  religious-guilt manipulation → equivalent secular guilt/urgency manipulation so difficulty holds.
- **`data/seed-campaigns.json`** (`campaigns[]` + `live_campaigns[]`, with committed assessments):
  same diversify rewrite, **plus** the seeding invariant — every committed-assessment evidence
  `quote` must remain a verbatim substring of its cited field. So stories and their cited quotes
  are rewritten *in lockstep*. Remove the `zakat_eligibility_doubt` flag and the zakat evidence
  item from seed-10's assessment and re-anchor it to `unverifiable_claims`. Committed assessments
  are hand-edited JSON (seeding stays free/deterministic — no API regeneration).
- **Re-seed + re-eval:** `npm run seed` (free) then `npm run evals` (~$0.17, ~60s) for an honest
  `v5` baseline. No precise precision/recall figures are hardcoded in copy; only the rubric *count*
  ("seven-category" → "six-category", "7 risk categories" → "6") and the prompt-lineage notes need
  prose updates (handled in the rename/prose workstream).

## Risks & mitigations

| Risk | Mitigation |
|---|---|
| Eval rewrite changes class balance or difficulty, distorting the baseline | Preserve the 8 clean / 8 subtle / 7 obvious / 7 ambiguous split; swap religious specifics for equivalent secular specifics, not for easier cases. Re-run evals and sanity-check the confusion matrix. |
| Seeded assessment becomes inconsistent after dropping the zakat flag | Evidence quotes must stay verbatim substrings of cited fields; re-point seed-10's signal to a surviving category and re-verify by reading the JSON. |
| `DROP COLUMN` migration vs. existing Neon data | New Drizzle migration is additive-safe (`ALTER TABLE … DROP COLUMN`); demo DB is reset via `npm run seed`. |
| Residual Islamic vocabulary missed | The explicit vocabulary-sweep grep (Workstream B) is a required final check, not optional. |
| Touching the pipeline accidentally moves a status write | Workstream B only edits prompt/schema/UI; no change to `action/route.ts`. Verified by re-reading the invariant section. |

## Verification

1. `npm run lint` — clean.
2. `npm run build` — type-checks the removed `zakat_claimed` field everywhere (TS will catch any missed reference).
3. `npm run db:generate` then `npm run db:migrate` — apply the `DROP COLUMN`.
4. `npm run seed` — re-seed the demo queue (must succeed with no zakat field).
5. `npm run evals` — produce the `v5` baseline; eyeball precision/recall + confusion matrix for sanity.
6. Final grep sweep for the Islamic vocabulary list — expect zero hits in `app/`, `lib/`, `components/`, `data/`, `README.md`, `CLAUDE.md`.
7. Manual smoke: `npm run dev`, confirm the wordmark reads "Veracity," no Zakat UI anywhere, submit form has no zakat checkbox.

## File inventory (appendix)

- **Rename only:** `app/layout.tsx`, `app/opengraph-image.tsx`, `components/public/site-header.tsx`,
  `components/public/site-footer.tsx`, `app/admin/layout.tsx`, `app/login/page.tsx`,
  `app/status/[id]/page.tsx`, `package.json`, `package-lock.json`, `lib/session.ts`, `README.md`,
  `docs/architecture.md`.
- **Rename + de-zakat:** `app/page.tsx`, `app/about/page.tsx`, `app/campaigns/page.tsx`,
  `app/submit/page.tsx`, `CLAUDE.md`, `lib/ai/prompts.ts`.
- **De-zakat only:** `lib/ai/schemas.ts`, `lib/ai/persist.ts` (`campaignToInput`), `lib/format.ts`
  (`FLAG_LABELS`), `db/schema.ts`, `app/api/submit/route.ts`, `scripts/seed.ts`,
  `scripts/test-pipeline.ts`, `app/campaigns/[id]/page.tsx`, `app/admin/queue/page.tsx`,
  `app/admin/history/page.tsx`, `app/admin/campaign/[id]/page.tsx`,
  `components/admin/campaign-review.tsx`, `components/public/brand.tsx` (drop `ZakatChip` +
  `Sparkles` import), `app/submit/page.tsx` (drop `Checkbox` import — zakat-only).
- **Data:** `data/seed-campaigns.json`, `data/eval-set.json`.
- **Generated:** new `drizzle/000X_*.sql` migration (via `db:generate`).
