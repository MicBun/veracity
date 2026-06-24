# Veracity Rebrand Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebrand `Amanah` → `Veracity`, remove the Zakat feature end-to-end, and de-Islamify the prompts, copy, and test data into a general-purpose donation-crowdfunding trust & safety demo — without touching the "AI recommends, humans decide" invariant.

**Architecture:** Three concerns over ~30 files: (1) a textual rebrand of all prose/metadata/docs/config; (2) removing the `zakat_claimed` field + `zakat_eligibility_doubt` rubric category through every layer (prompt → schema → DB → API → UI → scripts) with a prompt-version bump; (3) rewriting both labeled datasets into a diversified, mostly-secular corpus that preserves every case's class and difficulty. Ordering keeps `npm run build` green after every task: rename first, then de-zakat *consumers* (prompt, UI), then remove the field *definition* (+ DB migration), then rewrite + re-seed + re-eval data, then a final sweep.

**Tech Stack:** Next.js 15 (App Router) + React 19, Tailwind v4, shadcn/ui, TypeScript, Drizzle ORM (Neon HTTP), Zod, `tsx` scripts, Anthropic SDK (`claude-haiku-4-5`).

## Global Constraints

- **Preserve the invariant:** `campaigns.status` is written ONLY in `app/api/admin/campaigns/[id]/action/route.ts`; the AI pipeline only inserts into `ai_assessments`; public routes (`/status/[id]`, `/api/submit` stream) expose campaign content + stage names only — never scores/flags/recommendations. This plan does NOT edit `action/route.ts` or any auth path.
- **New name:** `Amanah` → `Veracity`. Drop the `(أمانة — "trust")` etymology gloss entirely.
- **Prompt version:** `PROMPT_VERSION` `"v3"` → **`"v5"`** (NOT `v4` — `v4` was tried and reverted; reusing it breaks attribution). Any prompt edit must carry this bump.
- **Rubric:** drops to **six** categories. Keep `lib/ai/prompts.ts` RUBRIC and `lib/ai/schemas.ts` `RISK_FLAGS` aligned. Surviving order: `urgency_manipulation, story_inconsistency, identity_mismatch, unverifiable_claims, duplicate_pattern, financial_anomaly`.
- **Visual identity unchanged:** emerald palette + `ShieldCheck` mark stay. The gold/amber token stays (still used by the OG "demo" badge); only `ZakatChip` is removed.
- **Seeding invariant:** every committed-assessment evidence `quote` MUST be a verbatim substring of its cited campaign field. Seeding stays free/deterministic (committed JSON, no API regeneration).
- **Eval split invariant:** keep 8 clean / 8 subtle_fraud / 7 obvious_fraud / 7 ambiguous, and each case's `id` + `label`.
- **Verification (no test runner):** `npm run lint` (must be clean), `npm run build` (Turbopack; type-checks the whole graph), `npm run seed`, `npm run evals`, and ripgrep sweeps. Historical artifacts under `docs/superpowers/plans/` and `drizzle/` (existing migrations + meta snapshots) are NOT edited — the new migration handles the column drop.
- **Domain/repo/cookie:** rename the *string references* (`amanah.micbun.com` → `veracity.micbun.com`, `MicBun/amanah` → `MicBun/veracity`, cookie `amanah_session` → `veracity_session`). The actual DNS change, GitHub repo rename, and (demo-only, no live sessions) cookie cutover are the user's infra actions — out of scope for code edits.

---

### Task 1: Textual rebrand → Veracity (prose, metadata, docs, config)

Pure wordmark/metadata swaps **plus** the prose-level zakat removals that live in the same sentences (hero blurb, about intro, README/architecture intros, rubric-count phrasing, prompt-lineage notes). Structural/UI/schema de-zakat is later tasks. No `Amanah` should remain except in `docs/superpowers/plans/` history.

**Files:**
- Modify: `app/page.tsx`, `app/about/page.tsx`, `app/campaigns/page.tsx`, `app/submit/page.tsx:242`, `app/status/[id]/page.tsx:79-81`, `app/login/page.tsx:62,122`, `app/admin/layout.tsx:24-26`, `components/public/site-header.tsx:14-16`, `components/public/site-footer.tsx:13,20`, `components/public/private-repo-link.tsx:13`, `app/layout.tsx`, `app/opengraph-image.tsx`, `package.json:2`, `package-lock.json:2,8`, `lib/session.ts:11`, `README.md`, `docs/architecture.md`, `CLAUDE.md`

**Interfaces:**
- Consumes: nothing.
- Produces: the brand string `Veracity`, domain `veracity.micbun.com`, repo `https://github.com/MicBun/veracity`, cookie `veracity_session` (consumed by `lib/session-cookies.ts` via `SESSION_COOKIE`). Rubric prose now says "six".

- [ ] **Step 1: Wordmark swaps (`Amanah` → `Veracity`)**

In each of these, replace the visible wordmark text `Amanah` with `Veracity`:
- `app/page.tsx:85`, `app/about/page.tsx:70`, `app/about/page.tsx:104` (`How Amanah works` → `How Veracity works`), `app/status/[id]/page.tsx:80`, `components/public/site-header.tsx:15`, `app/admin/layout.tsx:26`.

- [ ] **Step 2: Hero + about intro prose (rename + drop zakat clause + drop gloss)**

`app/page.tsx` lines 137–141, replace:
```
              Amanah (أمانة — &ldquo;trust&rdquo;) triages incoming campaigns for
              fraud signals, policy violations, and zakat-eligibility claims. It
              scores risk, quotes its evidence, and admits what it can&apos;t
              verify — then hands the decision to a human reviewer. Every time.
```
with:
```
              Veracity triages incoming campaigns for fraud signals and policy
              violations. It scores risk, quotes its evidence, and admits what it
              can&apos;t verify — then hands the decision to a human reviewer.
              Every time.
```

`app/about/page.tsx` lines 107–112, replace:
```
            Amanah triages incoming crowdfunding campaigns for fraud signals,
            policy violations, and zakat-eligibility claims. AI reads every
            submission and lays out what it found — but it never decides. A human
```
with:
```
            Veracity triages incoming crowdfunding campaigns for fraud signals
            and policy violations. AI reads every submission and lays out what it
            found — but it never decides. A human
```

- [ ] **Step 3: Rubric-count + zakat-mention prose (page.tsx + about.tsx)**

- `app/page.tsx:182` — in the Screening card body, change `seven-category rubric — urgency manipulation, story inconsistency, financial anomalies, zakat-eligibility doubt, and more` → `six-category rubric — urgency manipulation, story inconsistency, financial anomalies, identity mismatch, and more`.
- `app/page.tsx:264` and `app/about/page.tsx:175` — replace the bullet `<li>Zakat-eligibility calls that need documentation</li>` → `<li>Eligibility and policy calls that need off-platform proof</li>`.
- `app/page.tsx:275` — change the stat tuple `["7", "risk categories"]` → `["6", "risk categories"]`.
- `app/about/page.tsx:124` — change diagram body `Title, story, goal, category, organizer profile, zakat claim. Anyone can submit; submissions are rate-limited.` → `Title, story, goal, category, organizer profile. Anyone can submit; submissions are rate-limited.`
- `app/about/page.tsx:131` — change `seven-category rubric` → `six-category rubric`.
- `app/about/page.tsx:192` — `Amanah is built` → `Veracity is built`.
- `app/about/page.tsx:238` — `why Amanah runs against` → `why Veracity runs against`.

- [ ] **Step 4: about REPO constant + metadata title**

- `app/about/page.tsx:11` — `title: "How Amanah works — AI reads every campaign, people decide"` → `title: "How Veracity works — AI reads every campaign, people decide"`.
- `app/about/page.tsx:14` — `const REPO = "https://github.com/MicBun/amanah";` → `const REPO = "https://github.com/MicBun/veracity";`.

- [ ] **Step 5: campaigns / submit / login / footer / private-repo-link prose**

- `app/campaigns/page.tsx:13` — `title: "Live campaigns — Amanah"` → `title: "Live campaigns — Veracity"`.
- `app/campaigns/page.tsx:28` — `Every campaign here passed Amanah&apos;s AI triage` → `Every campaign here passed Veracity&apos;s AI triage`.
- `app/submit/page.tsx:242` — `Back to Amanah` → `Back to Veracity`.
- `app/login/page.tsx:62` — `Access the Amanah trust &amp; safety console.` → `Access the Veracity trust &amp; safety console.`
- `app/login/page.tsx:122` — `← Back to Amanah` → `← Back to Veracity`.
- `components/public/site-footer.tsx:13` — `Amanah — a working product demo.` → `Veracity — a working product demo.`
- `components/public/site-footer.tsx:20` — `href="https://github.com/MicBun/amanah"` → `href="https://github.com/MicBun/veracity"`.
- `components/public/private-repo-link.tsx:13` — comment `The Amanah repo is private for now.` → `The Veracity repo is private for now.`

- [ ] **Step 6: `app/layout.tsx` metadata + domain**

Replace these exact strings:
- L34 `metadataBase: new URL("https://amanah.micbun.com")` → `...("https://veracity.micbun.com")`
- L35 `title: "Amanah — AI triage copilot for campaign trust & safety"` → `title: "Veracity — AI triage copilot for campaign trust & safety"`
- L37 `"Amanah screens every crowdfunding campaign with a two-stage AI pipeline, cites its evidence, and leaves every decision to a human reviewer."` → replace leading `Amanah` with `Veracity`.
- L41 `url: "https://amanah.micbun.com"` → `url: "https://veracity.micbun.com"`
- L42 `siteName: "Amanah"` → `siteName: "Veracity"`
- L43 and L50 (openGraph + twitter titles) `"Amanah — AI triage copilot for campaign trust & safety"` → `"Veracity — …"`.

- [ ] **Step 7: `app/opengraph-image.tsx`**

- L5 `export const alt = "Amanah — AI triage copilot for campaign trust & safety";` → `"Veracity — …"`.
- L62 the wordmark text node `Amanah` → `Veracity`.
- L102 `amanah.micbun.com` → `veracity.micbun.com`.

- [ ] **Step 8: `package.json`, `package-lock.json`, cookie**

- `package.json:2` `"name": "amanah"` → `"name": "veracity"`.
- `package-lock.json:2` and `:8` `"name": "amanah"` → `"name": "veracity"`.
- `lib/session.ts:11` `export const SESSION_COOKIE = "amanah_session";` → `export const SESSION_COOKIE = "veracity_session";`.

- [ ] **Step 9: Docs (`README.md`, `docs/architecture.md`, `CLAUDE.md`)**

`README.md`:
- L1 `# Amanah — AI Triage Copilot for Campaign Trust & Safety` → `# Veracity — AI Triage Copilot for Campaign Trust & Safety`.
- L3–7 replace:
```
Amanah (Arabic: أمانة, "trust") is an AI-assisted triage system for
donation-based crowdfunding platforms. A two-stage Claude pipeline screens
every incoming campaign for fraud signals, policy violations, and
zakat-eligibility claims, cites its evidence, and calibrates its own
uncertainty — then a human reviewer makes every decision.
```
with:
```
Veracity is an AI-assisted triage system for donation-based crowdfunding
platforms. A two-stage Claude pipeline screens every incoming campaign for
fraud signals and policy violations, cites its evidence, and calibrates its own
uncertainty — then a human reviewer makes every decision.
```
- L9 `**Live demo:** https://amanah.micbun.com` → `https://veracity.micbun.com`.
- L40 `Prompts were tuned v1 → v3 against these metrics.` → `Prompts were tuned v1 → v3 against these metrics, then bumped to v5 when the zakat-eligibility category was removed.`

`docs/architecture.md`:
- L3–6 replace `Amanah is an AI-assisted triage system for donation-based crowdfunding trust & safety. A two-stage Claude pipeline screens every incoming campaign for fraud signals, policy violations, and zakat-eligibility claims, cites its evidence,` → `Veracity is an AI-assisted triage system for donation-based crowdfunding trust & safety. A two-stage Claude pipeline screens every incoming campaign for fraud signals and policy violations, cites its evidence,`.
- L60–64 in "Prompts are versioned": change `(current: v3)` → `(current: v5)`; change `The prompts went v1 → v3 against the eval set (v4 was tried and reverted).` → `The prompts went v1 → v3 against the eval set (v4 was tried and reverted), then v5 removed the zakat-eligibility category.`; change `seven-category risk rubric` → `six-category risk rubric`.

`CLAUDE.md`:
- "What this is" L7 — replace `Amanah is an AI triage copilot for donation-crowdfunding trust & safety. A two-stage Claude pipeline screens every campaign for fraud/policy/zakat-eligibility signals,` → `Veracity is an AI triage copilot for donation-crowdfunding trust & safety. A two-stage Claude pipeline screens every campaign for fraud/policy signals,`.
- "Prompts are versioned" paragraph — `Current version is v3 (tuned v1→v3 against the eval set; v4 was tried and reverted).` → `Current version is v5 (tuned v1→v3 against the eval set; v4 was tried and reverted; v5 removed the zakat-eligibility category).`; `The 7-category risk rubric lives in both the prompts and RISK_FLAGS` → `The 6-category risk rubric lives in both the prompts and RISK_FLAGS`.
- Any remaining standalone `Amanah` in CLAUDE.md → `Veracity` (the "What this is" heading sentence is the main one).

- [ ] **Step 10: Verify + commit**

```bash
npm run lint
# Expected: clean (no errors)
# No "Amanah" outside plan history, no domain/repo leftovers:
rg -n -i 'amanah' --glob '!docs/superpowers/plans/**'
# Expected: ZERO matches
npm run build
# Expected: build succeeds (zakat still present in code — fine; this task is text only)
git add -A && git commit -m "feat(rebrand): rename Amanah → Veracity across copy, metadata, docs, config"
```

---

### Task 2: De-zakat the prompt engine + secularize platform context + bump to v5

**Files:**
- Modify: `lib/ai/prompts.ts`

**Interfaces:**
- Consumes: `CampaignInput` (still has `zakat_claimed` until Task 4 — that's fine; this task just stops referencing it).
- Produces: `PROMPT_VERSION = "v5"`; a six-item RUBRIC; `renderCampaign()` no longer emits a `zakat_claimed:` line; `source_field` allow-list no longer lists `zakat_claimed`.

- [ ] **Step 1: Bump the version**

`lib/ai/prompts.ts:7` — `export const PROMPT_VERSION = "v3";` → `export const PROMPT_VERSION = "v5";`.

- [ ] **Step 2: Remove rubric item #5 and renumber**

Delete line 14 (`5. zakat_eligibility_doubt — …`) entirely, and renumber the two following items so the list is 1–6:
- `6. duplicate_pattern …` → `5. duplicate_pattern …`
- `7. financial_anomaly …` → `6. financial_anomaly …`

- [ ] **Step 3: Secularize `PLATFORM_CONTEXT`**

`lib/ai/prompts.ts:18` — replace:
```
const PLATFORM_CONTEXT = `You are the screening stage of Amanah, an AI triage assistant for a donation-based crowdfunding platform serving Muslim communities and general charitable causes (mosque and community-center projects, medical emergencies, refugee relief, education funds, and zakat-eligible charity cases).
```
with:
```
const PLATFORM_CONTEXT = `You are the screening stage of Veracity, an AI triage assistant for a donation-based crowdfunding platform serving a broad range of charitable causes (medical emergencies, disaster and refugee relief, education funds, small-business and livelihood support, and community projects).
```

- [ ] **Step 4: Remove zakat from deep-review guidance + source_field allow-list + renderCampaign**

- L50 — in the `flag_for_review` bullet, change `… an identity mismatch, a zakat claim for a plainly ineligible use. The deception must be quotable.` → `… an identity mismatch, a goal that cannot be reconciled with the stated need. The deception must be quotable.`
- L57 — change the allowed `source_field` list `… organizer_history.prior_flags, zakat_claimed.` → `… organizer_history.prior_flags.` (drop `, zakat_claimed`).
- L69 — delete the line `zakat_claimed: ${c.zakat_claimed}` from `renderCampaign()`.

- [ ] **Step 5: Verify + commit**

```bash
rg -n -i 'zakat|muslim|mosque|amanah' lib/ai/prompts.ts
# Expected: ZERO matches
npm run lint && npm run build
# Expected: clean; build succeeds (c.zakat_claimed still exists on CampaignInput but is now unused)
git add lib/ai/prompts.ts && git commit -m "feat(pipeline): drop zakat rubric category, secularize platform context, bump prompt v3→v5"
```

---

### Task 3: Remove Zakat from the UI (public + admin)

Remove every consumer of `zakatClaimed`/`ZakatChip` while the DB column still exists. Each edit just stops *using* an existing field, so the build stays green.

**Files:**
- Modify: `components/public/brand.tsx`, `app/campaigns/page.tsx`, `app/campaigns/[id]/page.tsx`, `app/status/[id]/page.tsx`, `app/admin/queue/page.tsx`, `app/admin/history/page.tsx`, `app/submit/page.tsx`, `components/admin/campaign-review.tsx`, `app/admin/campaign/[id]/page.tsx`

**Interfaces:**
- Consumes: nothing new.
- Produces: `ZakatChip` no longer exists/exported; `CampaignReview` `Props.campaign` no longer has `zakatClaimed`.

- [ ] **Step 1: Delete `ZakatChip` + its lone `Sparkles` import (`components/public/brand.tsx`)**

- Remove line 3 `import { Sparkles } from "lucide-react";`.
- Remove the whole block lines 41–48 (the `/** Gold zakat marker … */` comment + `export function ZakatChip(...) { … }`).

- [ ] **Step 2: Remove `ZakatChip` from the public campaign list/detail**

- `app/campaigns/page.tsx`: remove import line 6 `import { ZakatChip } from "@/components/public/brand";` and remove line 53 `{campaign.zakatClaimed && <ZakatChip />}`.
- `app/campaigns/[id]/page.tsx`: remove import line 8 `import { ZakatChip } from "@/components/public/brand";` and remove the block lines 38–40:
```
            {campaign.zakatClaimed && (
              <ZakatChip label="Zakat-eligible (claimed)" />
            )}
```

- [ ] **Step 3: Remove zakat strings from status + admin queue/history**

- `app/status/[id]/page.tsx:111` — remove `{campaign.zakatClaimed && " · Zakat-eligible (claimed)"}`.
- `app/admin/queue/page.tsx:70` — remove `{campaign.zakatClaimed && " · Zakat claimed"}`.
- `app/admin/history/page.tsx:35` — remove `{campaign.zakatClaimed && " · Zakat claimed"}`.

- [ ] **Step 4: Remove the submit-form zakat checkbox + state + `Checkbox` import**

`app/submit/page.tsx`:
- Remove import line 18 `import { Checkbox } from "@/components/ui/checkbox";` (zakat is its only consumer).
- Remove line 55 `const [zakat, setZakat] = useState(false);`.
- Remove line 89 `zakat_claimed: zakat,` from the `payload` object.
- Remove the whole block lines 381–396 (the `<div className="flex items-start gap-3"> … </div>` containing the zakat `<Checkbox>` and its `<Label>`/help text).

- [ ] **Step 5: Remove the zakat FieldRow + prop from the reviewer panel**

`components/admin/campaign-review.tsx`:
- Remove line 72 `zakatClaimed: boolean;` from the `Props.campaign` type.
- Remove the `FieldRow` block lines 277–282:
```
              <FieldRow
                field="zakat_claimed"
                label="Zakat claimed"
                highlighted={highlight?.field === "zakat_claimed"}
                value={campaign.zakatClaimed ? "Yes" : "No"}
              />
```

`app/admin/campaign/[id]/page.tsx:29` — remove `zakatClaimed: campaign.zakatClaimed,` from the object passed to `<CampaignReview campaign={{…}}>`.

- [ ] **Step 6: Verify + commit**

```bash
rg -n -i 'zakat|ZakatChip' app components
# Expected: ZERO matches
npm run lint && npm run build
# Expected: clean; build succeeds (DB column/Campaign type still has zakatClaimed, now unused by UI)
git add -A && git commit -m "feat(ui): remove zakat chip, checkbox, badges, and reviewer field row"
```

---

### Task 4: Remove the `zakat_claimed` field + `zakat_eligibility_doubt` flag from the data layer

Now that nothing references them, delete the field/category from types, schema, persistence, label map, API, and scripts, then generate + apply the column-drop migration.

**Files:**
- Modify: `lib/ai/schemas.ts`, `lib/ai/persist.ts`, `lib/format.ts`, `db/schema.ts`, `app/api/submit/route.ts`, `scripts/seed.ts`, `scripts/test-pipeline.ts`
- Create (generated): `drizzle/0003_*.sql` + updated `drizzle/meta/*` snapshot

**Interfaces:**
- Consumes: nothing.
- Produces: `RISK_FLAGS` is a 6-tuple (no `zakat_eligibility_doubt`); `CampaignInput` has no `zakat_claimed`; `campaigns` table has no `zakat_claimed` column.

- [ ] **Step 1: `lib/ai/schemas.ts`**

- Remove line 9 `"zakat_eligibility_doubt",` from `RISK_FLAGS`.
- Update the comment line 3 `/** The 7-category risk rubric. … */` → `/** The 6-category risk rubric. … */`.
- L48 — in the `source_field` `.describe(...)`, drop the trailing ` | zakat_claimed` from the field list string.
- Remove line 77 `zakat_claimed: boolean;` from the `CampaignInput` type.

- [ ] **Step 2: `lib/ai/persist.ts` + `lib/format.ts`**

- `lib/ai/persist.ts:14` — remove `zakat_claimed: c.zakatClaimed,` from `campaignToInput()`.
- `lib/format.ts:45` — remove `zakat_eligibility_doubt: "Zakat eligibility doubt",` from `FLAG_LABELS`.

- [ ] **Step 3: `db/schema.ts` + API + scripts**

- `db/schema.ts:56` — remove `zakatClaimed: boolean("zakat_claimed").notNull().default(false),`.
- `app/api/submit/route.ts:23` — remove `zakat_claimed: z.boolean(),` from `submitSchema`.
- `app/api/submit/route.ts:75` — remove `zakatClaimed: input.zakat_claimed,` from the insert `.values({…})`.
- `scripts/seed.ts` — remove `zakat_claimed: boolean;` at lines 34 and 58 (both the `campaigns` and `live_campaigns` cast types), and remove `zakatClaimed: c.zakat_claimed,` at lines 87 and 121 (both insert `.values`).
- `scripts/test-pipeline.ts:33` — remove `zakat_claimed: c.zakat_claimed,`.

- [ ] **Step 4: Generate + apply the migration**

```bash
npm run db:generate
# Expected: drizzle-kit emits a new migration, e.g. drizzle/0003_*.sql containing:
#   ALTER TABLE "campaigns" DROP COLUMN "zakat_claimed";
# plus an updated drizzle/meta snapshot. Do NOT hand-edit older migrations.
npm run db:migrate
# Expected: "applied" with no errors (Neon dev DB).
```

- [ ] **Step 5: Verify + commit**

```bash
rg -n -i 'zakat' --glob '!data/**' --glob '!docs/superpowers/plans/**' --glob '!drizzle/**'
# Expected: ZERO matches (drizzle/ historical snapshots legitimately still mention the dropped column)
npm run lint && npm run build
# Expected: clean; build succeeds — TS confirms no remaining reference to zakat_claimed
git add -A && git commit -m "feat(schema): drop zakat_claimed column + zakat_eligibility_doubt flag (migration)"
```

---

### Task 5: Rewrite + re-seed `data/seed-campaigns.json` (diversified, secular, quote-safe)

Rewrite the seed corpus (`campaigns[]` + `live_campaigns[]`) into a diversified general-platform mix and strip all zakat/Islamic framing — **keeping every committed-assessment evidence quote a verbatim substring of its rewritten field.**

**Files:**
- Modify: `data/seed-campaigns.json`
- Create (temporary, deleted at end of step): `scripts/check-seed-quotes.ts`

**Interfaces:**
- Consumes: the schema/types from Task 4 (no `zakat_claimed`).
- Produces: a clean seed corpus that `npm run seed` loads and the reviewer console renders.

**Rewrite rules (apply to every seed campaign in both arrays):**
1. Strip the `zakat_claimed` key.
2. Rewrite `title`/`description` into a diversified, mostly-secular cause. Target spread across the whole corpus: medical, disaster/emergency-relief, education, small-business/livelihood, community/nonprofit — with at most a couple of faith-based cases spread across *different* faiths (never all one faith). Keep `category` within the allowed enum (`medical | education | community | emergency-relief | livelihood`).
3. **Preserve the case's signal and numbers:** keep goal-vs-itemization arithmetic intact (it drives `financial_anomaly`), keep `organizer_history` values, and keep whatever made a campaign clean/borderline.
4. Remove the Islamic vocabulary entirely (`zakat, sadaqah, waqf, masjid, mosque, al-gharimin, faqir, miskin, ummah, Muslim, Islamic, Quran, Assalamu alaikum, Alhamdulillah, InshAllah, JazakAllah, Ramadan, Eid, Jummah, "the Prophet", Allah`).
5. **Quote lockstep (critical):** for each campaign's committed `assessments[].output.evidence[]`, every `quote` must remain an exact substring of the rewritten field named by its `source_field`. Rewrite the story and the cited quotes together. Remove any evidence item whose `source_field` was `zakat_claimed`.
6. For **seed-10** specifically: remove the `zakat_eligibility_doubt` flag from `category_flags` (re-anchor to `unverifiable_claims`), drop the `zakat_claimed` evidence item, and reword the summary/risk_factors/reasoning to a secular hardship-verification framing.
7. Keep committed `prompt_version` values as-authored (demo metadata); do not regenerate via API.

- [ ] **Step 1: Worked exemplar — rewrite seed-10 (carries the removed flag)**

Replace seed-10's `title`/`description`, drop `zakat_claimed`, and edit its deep-review assessment. Target shape (illustrative — keep the existing numeric fields/tokens/cost/latency):
```jsonc
"title": "Help with my brother's dialysis transport and care",
"description": "My brother Idris has been on dialysis three times a week since his kidneys failed last year. Medicaid covers the sessions but not the medical transport he needs to get to them, his renal diet, or the months of bills that piled up while he could not work. I am asking for $15,000 to cover a year of transport at roughly $220 a week, help with his food costs, and part of the debt. He lives alone in Newark and I am his only family nearby. He has no income right now, and I will share receipts with any donor who asks.",
// assessment.output (deep_review):
"category_flags": ["unverifiable_claims"],
"summary": "Coherent costs for a plausible chronic-care need, but the hardship basis rests on unverified facts.",
"evidence": [
  { "claim": "The beneficiary's income status — the basis for the hardship claim — is asserted but not evidenced", "source_field": "description", "quote": "He has no income right now" }
  // (the former zakat_claimed evidence item is deleted)
],
"risk_factors": ["The beneficiary's income and debt status — the basis of the hardship claim — cannot be verified from the campaign"],
"reasoning": "The need is plausible and the arithmetic is honest, but the facts that establish genuine hardship (no income, qualifying debt) are asserted without evidence. Recommend escalation to request income and debt documentation before approval."
```
Note `"He has no income right now"` is a verbatim substring of the new description — required.

- [ ] **Step 2: Rewrite the remaining seed campaigns**

Apply the rewrite rules to all other entries in `campaigns[]` and `live_campaigns[]` (the masjid roof, Al-Noor kitchen, masjid education committee, Salaam Relief refugee coats, Eid orphan kits, masjid wudu repair, etc.). Diversify contexts; keep each entry's class/role (clean vs flagged), goal arithmetic, organizer history, and — for any with committed deep-review evidence — quote lockstep per rule 5.

- [ ] **Step 3: Add the quote-integrity checker**

Create `scripts/check-seed-quotes.ts`:
```ts
import { readFileSync } from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), "data", "seed-campaigns.json");
const data = JSON.parse(readFileSync(file, "utf8")) as { campaigns: any[]; live_campaigns: any[] };

function fieldOf(c: any, sf: string): string | null {
  switch (sf) {
    case "title": return String(c.title);
    case "description": return String(c.description);
    case "goal_amount": return String(c.goal_amount);
    case "category": return String(c.category);
    case "organizer_name": return String(c.organizer_name);
    case "organizer_history.prior_campaigns": return String(c.organizer_history.prior_campaigns);
    case "organizer_history.account_age_days": return String(c.organizer_history.account_age_days);
    case "organizer_history.prior_flags": return String(c.organizer_history.prior_flags);
    default: return null; // zakat_claimed (or any unknown field) must no longer be cited
  }
}

let bad = 0;
for (const arr of [data.campaigns, data.live_campaigns]) {
  for (const c of arr) {
    for (const a of c.assessments ?? []) {
      if (a.stage !== "deep_review") continue;
      for (const ev of a.output.evidence ?? []) {
        const field = fieldOf(c, ev.source_field);
        if (field === null) { console.error(`✗ ${c.key}: bad source_field "${ev.source_field}"`); bad++; continue; }
        if (!field.includes(ev.quote)) { console.error(`✗ ${c.key}: quote not in ${ev.source_field}: "${ev.quote}"`); bad++; }
      }
    }
  }
}
if (bad) { console.error(`\n${bad} quote-integrity failures.`); process.exit(1); }
console.log("✓ all seed evidence quotes are verbatim substrings of their cited fields");
```

- [ ] **Step 4: Run the checker + re-seed**

```bash
npx tsx scripts/check-seed-quotes.ts
# Expected: "✓ all seed evidence quotes are verbatim substrings of their cited fields"
rg -n -i 'zakat|sadaqah|waqf|masjid|mosque|gharimin|faqir|miskin|ummah|muslim|islam|quran|ramadan|\beid\b|jummah|alhamdulillah|inshallah|jazakallah|assalam|allah' data/seed-campaigns.json
# Expected: ZERO matches
npm run seed
# Expected: "Seeded 10 campaigns." + live campaigns, no errors
```

- [ ] **Step 5: Remove the temporary checker + commit**

```bash
rm scripts/check-seed-quotes.ts
git add -A && git commit -m "feat(data): diversify + secularize seed corpus, drop zakat (quote-safe)"
```

---

### Task 6: Rewrite `data/eval-set.json` + re-eval the v5 baseline

Rewrite all 30 labeled cases into diversified, mostly-secular equivalents, strip `zakat_claimed`, and run the eval harness to produce an honest `v5` baseline. No committed assessments here, so no quote constraint — the pipeline generates evidence at run time.

**Files:**
- Modify: `data/eval-set.json`

**Interfaces:**
- Consumes: the v5 pipeline + 6-category `RISK_FLAGS`.
- Produces: a clean labeled set; a new `eval_runs` row at `prompt_version = "v5"`.

**Rewrite rules (per case):**
1. Keep `id` and `label`; keep the 8/8/7/7 split.
2. Strip `zakat_claimed` from `campaign`.
3. Rewrite `campaign.title`/`description` + `rationale` into a diversified, mostly-secular cause (same target mix as Task 5; keep `category` in-enum).
4. **Preserve the structural signal the `rationale` names**, and keep goal arithmetic + `organizer_history` that drive it. Convert religious-guilt manipulation → equivalent secular guilt/urgency manipulation (conscience, dying-child guilt, ticking-clock ultimatums) so subtle/obvious difficulty holds.
5. **Re-anchor the 2 `zakat_eligibility_doubt` cases** (the "Beautify Masjid Al-Falah Before Eid" subtle-fraud and the "masjid demolished in 72 hours" obvious-fraud) onto surviving categories they already lean on — `financial_anomaly` (round goal / no breakdown) and `unverifiable_claims` (unnamed authority) — and update their `rationale` accordingly.
6. Avoid cross-class metadata shortcuts and entity collisions (the dataset's stated design goal): don't reuse names/orgs across cases; don't let surface metadata telegraph the class.
7. Remove the full Islamic vocabulary (same list as Task 5, rule 4).

- [ ] **Step 1: Worked exemplar — an obvious-fraud rewrite**

`eval-obvious-01` (the "1000 ORPHANS … Your Zakat" case) → secular equivalent that keeps every fraud signal:
```jsonc
"rationale": "Obvious fraud: weaponizes guilt and a ticking-clock ultimatum, refuses to name the camp or partner org, makes an impossible 100%-delivery-in-24-hours guarantee, and asks for a $250k round goal on an 8-day-old flagged account.",
"campaign": {
  "title": "1,000 CHILDREN WILL STARVE BY FRIDAY — Your Donation Can Save Them TONIGHT",
  "description": "I am on the ground right now and what I see will haunt you. 1,000 children have NO food and by Friday it will be too late. I am personally guaranteeing that 100% of your donation reaches them within 24 hours — no middlemen, no admin fees, nothing, straight from your pocket into their hands. I cannot say which camp or which organization we work with because of security, but trust me, every penny gets there. If you can give and you scroll past these children, that is on your conscience. We need $250,000 by Friday. Donate NOW before it's too late.",
  "goal_amount": 250000,
  "category": "emergency-relief",
  "organizer_name": "<keep distinct from other cases>",
  "organizer_history": { "prior_campaigns": 0, "account_age_days": 8, "prior_flags": 1 }
}
```

- [ ] **Step 2: Rewrite the remaining 29 cases**

Apply the rules across all four classes. Keep the clean cases genuinely clean (named institutions, itemized totals matching goals, seasoned organizers), the subtle cases subtle (one quiet inconsistency in an otherwise plausible story), the obvious cases obvious, and the ambiguous cases genuinely unverifiable (the signal is *missing information*, not demonstrable deception).

- [ ] **Step 3: Verify the data is clean**

```bash
rg -n -i 'zakat|sadaqah|waqf|masjid|mosque|gharimin|faqir|miskin|ummah|muslim|islam|quran|ramadan|\beid\b|jummah|alhamdulillah|inshallah|jazakallah|assalam|allah' data/eval-set.json
# Expected: ZERO matches
node -e "const d=require('./data/eval-set.json');const c={};d.cases.forEach(x=>c[x.label]=(c[x.label]||0)+1);console.log(c, 'total', d.cases.length)"
# Expected: { clean: 8, subtle_fraud: 8, obvious_fraud: 7, ambiguous: 7 } total 30
```

- [ ] **Step 4: Re-eval the v5 baseline**

```bash
npm run evals
# Expected: ~$0.17, ~60s; writes an eval_runs row at prompt_version v5; prints per-class
# precision/recall + confusion matrix + false-negative drill-down.
# Sanity check: clean cases mostly predicted clean; obvious_fraud mostly caught; recall on
# fraud classes is the safety metric — eyeball that it's not collapsed.
```

- [ ] **Step 5: Commit**

```bash
git add data/eval-set.json && git commit -m "feat(data): diversify + secularize eval set, drop zakat, re-baseline at v5"
```

---

### Task 7: Final vocabulary sweep, full verification, manual smoke

**Files:** none (verification + optional fix-ups only).

- [ ] **Step 1: Whole-repo vocabulary sweep**

```bash
rg -n -i 'amanah|zakat|sadaqah|waqf|masjid|mosque|gharimin|faqir|miskin|ummah|muslim|islam|quran|أمانة' \
  --glob '!docs/superpowers/plans/**' --glob '!drizzle/**'
# Expected: ZERO matches. (Plan-history docs and historical drizzle snapshots are allowed to retain
# old terms as a record.) Fix any straggler in the task that owns that file, then re-run.
```

- [ ] **Step 2: Full build + lint**

```bash
npm run lint
# Expected: clean
npm run build
# Expected: build succeeds with no type errors
```

- [ ] **Step 3: Manual smoke (dev server)**

```bash
npm run dev
```
Confirm by eye:
- Wordmark reads **Veracity** on `/`, `/about`, `/campaigns`, `/login`, `/admin/queue`, `/status/[id]`.
- `/submit` has **no** zakat checkbox; submitting a campaign still streams stages and lands on `/status/[id]`.
- `/admin/queue` and `/admin/campaign/[id]` render with no "Zakat claimed" row/badge; evidence highlighting still works.
- `/campaigns` cards show no gold zakat chip.
- Tab favicon + OG still show the emerald `ShieldCheck`.

- [ ] **Step 4: Finalize**

```bash
git add -A && git commit -m "chore(rebrand): final vocabulary sweep + verification" --allow-empty
```
Then hand back: the branch `rebrand/veracity` is ready for the user's infra actions (rename GitHub repo, point `veracity.micbun.com`) and a PR.

---

## Self-Review

**Spec coverage:**
- Name → Veracity (rename incl. gloss drop): Task 1. ✓
- Domain / repo / cookie / package strings: Task 1 (steps 5–8). ✓
- Prompt de-zakat + secularize `PLATFORM_CONTEXT` + `v5`: Task 2. ✓
- Schema/enum/DB/API/scripts field removal + migration: Task 4. ✓
- `lib/ai/persist.ts` + `lib/format.ts` (the late-found refs): Task 4 (step 2). ✓
- UI chips/checkbox/field-row/`ZakatChip`/`Checkbox` import: Task 3. ✓
- Visual identity unchanged; gold token retained: no task removes it (only `ZakatChip`). ✓
- Six-category copy (`seven`→`six`, `7`→`6`): Task 1 (step 3) + Task 2 (rubric) + docs (step 9). ✓
- Data diversify + secularize + strip field, both corpora: Tasks 5 & 6. ✓
- Seed quote-integrity invariant: Task 5 (checker). ✓
- Re-seed + re-eval v5 baseline: Tasks 5 & 6. ✓
- Invariant preserved (no `action/route.ts`/auth edits): no task touches them. ✓
- Vocabulary sweep: Task 7. ✓

**Placeholder scan:** Data tasks (5, 6) intentionally provide rules + full worked exemplars rather than 40 pre-authored stories — the authoring *is* the task; the exemplars make the pattern unambiguous and the greps/checker make completion checkable. No `TBD`/`add error handling`/unspecified-code placeholders elsewhere.

**Type consistency:** `RISK_FLAGS` 6-tuple, `CampaignInput` without `zakat_claimed`, `campaignToInput` without the field, `FLAG_LABELS` without the key, `submitSchema` without it, `campaigns` table without the column, `CampaignReview` `Props.campaign` without `zakatClaimed` — all removed in the dependency order (consumers in Tasks 2–3, definition in Task 4) so `npm run build` is green after each task.
