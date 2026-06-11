# Public donor experience — design

- **Date:** 2026-06-11
- **Status:** Approved (brainstorming) — pending implementation plan
- **Scope:** One feature: the public, donor-facing side that closes the loop after a reviewer approves a campaign.

## Problem

After a reviewer approves a campaign, `campaigns.status` flips to `approved`, but nothing public reflects it. The only public route that renders a campaign is `/status/[id]`, reachable only if you already hold the campaign's exact link (the submitter is redirected there). It says *"this campaign is live"* but it is a dead end: no gallery to discover approved campaigns, no donate action, and the schema has no notion of money raised.

This feature adds the missing arc: **approve → live → donors browse → donors donate**, with donations mocked (no payment gateway) but **persisted** so a raised/goal progress bar actually moves.

## Goals

- A public gallery of approved (and only approved) campaigns.
- A public per-campaign detail page with a moving progress bar, recent supporters, and a mock donate form.
- Mock donations are persisted and aggregated into a live "raised" total.
- The whole surface is clearly labeled as a demo with no real payment.

## Non-goals (YAGNI)

- No real payment integration, accounts, receipts, or refunds.
- No editing/withdrawing donations; the donations table is insert-only for this feature.
- No donor auth — donating is anonymous-capable and public.
- No "most funded" / category filtering on the gallery in v1 (newest-approved-first only).

## The load-bearing invariant — preserved

This feature must not weaken the project's core boundary ("AI recommends, humans decide" + "public routes never expose assessment data"):

1. **`campaigns.status` is still written in exactly ONE place** — the reviewer action route (`app/api/admin/campaigns/[id]/action/route.ts`). The new donate endpoint writes **only** to the `donations` table and never touches `campaigns`. "Raised" is derived, not a status-adjacent write.
2. **No assessment data leaks.** The gallery, the detail page, and the donate endpoint carry campaign content + aggregate raised totals + donor display names only — never a risk score, flag, recommendation, confidence, or reasoning. Same rule already enforced on `/status/[id]`.
3. **Approval is the gate.** The detail page renders only when `status='approved'`; the donate endpoint re-checks `status='approved'` server-side before accepting a donation, so a pending/rejected/escalated campaign cannot receive donations even by guessing its id.
4. **Public write is defended** like `/submit`: rate-limited via the existing `rate_limits` fixed-window table and input-validated (amount bounds, name length cap, sanitization).

## Routes & pages

### `GET /campaigns` — "Live campaigns" gallery (public)
- `export const dynamic = "force-dynamic"`.
- Lists `status='approved'` campaigns, newest approved first.
- Each card: title, category, organizer, zakat badge (if claimed), a one-line description excerpt, a **raised / goal progress bar** with `% funded` and donor count.
- Empty state: a friendly "no live campaigns yet" message (won't appear in the seeded demo).
- Public chrome consistent with `/` and `/status/[id]` (stone/emerald palette, serif headings, `ShieldCheck` logo linking home).

### `GET /campaigns/[id]` — donor detail (public)
- `force-dynamic`. Renders **only if the campaign is `approved`**; otherwise `notFound()`. Pending/rejected/escalated continue to live only at `/status/[id]`.
- Shows: full story, organizer, goal, the progress bar (raised / goal, `% funded`, donor count), **recent supporters** (latest ~8 donations: display name + amount + relative date), and a **Donate** form.
- A clear, persistent badge: *"Demo — no real payment is processed."*

### `POST /api/donate` — mock donation (public, rate-limited)
- Body: `{ campaignId: string, amount: number, donorName?: string }`.
- Validation (reject with 400 on failure):
  - `campaignId` exists **and** `status='approved'` (re-read server-side; do not trust the client).
  - `amount` is an integer in **[1, 100000]** USD.
  - `donorName` optional; trimmed, collapsed whitespace, capped at 60 chars; empty → stored as `null` and displayed as "Anonymous".
- Rate limit: `donate:<ip>` fixed-window via `lib/rate-limit.ts` (e.g. 30/hour/IP) → 429 on exceed.
- On success: insert one `donations` row (`source='user'`), return the campaign's new raised total + donor count so the client can update the bar without a full reload.
- This endpoint has **zero** writes to `campaigns`.

## Data model — one new table

```ts
// db/schema.ts
export const donationSourceEnum = pgEnum("donation_source", ["seed", "user"]);

export const donations = pgTable("donations", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),            // whole USD, matches campaigns.goalAmount
  donorName: text("donor_name"),                  // null → "Anonymous"
  source: donationSourceEnum("source").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```

- `amount` is whole-USD integer to match `campaigns.goalAmount`.
- `source` mirrors `campaigns.source` so the seed reset can target `source='seed'` donation rows cleanly.
- Migration generated with `npm run db:generate`, applied with `npm run db:migrate`.
- Insert-only for this feature; no updates/deletes outside the seed reset.

## Data access — `lib/data.ts`

New helpers, all of which expose campaign content + aggregates only:

- `getApprovedCampaigns(): Promise<ApprovedCampaign[]>` — approved campaigns joined to `SUM(amount)` and `COUNT(*)` from donations (grouped by campaign), newest approved first. `ApprovedCampaign = { campaign, raised, donorCount }`.
- `getPublicApprovedCampaign(id): Promise<{ campaign, raised, donorCount, recent: Donation[] } | null>` — returns `null` if the campaign is missing or not approved (the detail route turns that into `notFound()`).
- Raised totals are always derived via aggregation; never cached on the campaign row.

## Seeding the gallery — full consistency

A fresh `npm run seed` currently creates only the 10-campaign **pending** queue, so the donor gallery would start empty. Extend the seed (and `data/seed-campaigns.json`) to also insert **4–5 `approved`, `source='seed'` campaigns** that are consistent everywhere a real approved campaign appears:

- The campaign row, `status='approved'`, `source='seed'`.
- Committed AI-assessment JSON (same shape as existing seed entries) so `/admin/campaign/[id]` renders its assessment.
- One seed `reviews` row per campaign: `action='approve'`, a demo `reviewerName`, an optional note, and `aiRecommendationSnapshot` taken from the committed assessment — so the campaign appears correctly on the **admin History** page and its audit log renders.
- Seed `donations` rows at varied progress so the gallery looks alive: e.g. one near goal, one ~half, one just started. Donor names are fictional; amounts sum to believable totals below or near each goal.

Seed reset must also clear `source='seed'` donations before re-inserting. The seed stays free (no API calls) and deterministic. The existing 10 pending queue campaigns are unchanged.

## Navigation & entry points

- Public nav (`/` and `/about`): add a **"Browse campaigns"** link → `/campaigns`. Add a matching hero/CTA on the landing page.
- `/status/[id]`: when `status='approved'`, the "live" banner deep-links to the campaign's public page (`/campaigns/[id]` → "View your live campaign").
- (Optional, low-cost) Admin campaign detail: for an approved campaign, a "View public page ↗" link to `/campaigns/[id]`. Nice for the demo; include if cheap, drop if it complicates the page.

## Error handling & edge cases

- Over-funding is allowed (campaigns can exceed goal). Progress bar caps its **visual** fill at 100% but the page shows the true `% funded`.
- Unknown / non-approved id on `/campaigns/[id]` → `notFound()` (never reveals existence of a rejected/pending campaign's content).
- Donate endpoint failures return clear 400/429 JSON; the form surfaces the message inline and never optimistically advances the bar before the server confirms.
- Donations to a campaign that was approved are permanent even though approval is terminal in this app (no status path leaves `approved`), so no donation can be "orphaned" by a later status change.

## Verification

No test runner. Verify via:
- `npm run lint` (clean) and `npm run build` (passes).
- `npm run db:generate` + `npm run db:migrate` apply the `donations` table.
- `npm run seed` produces a populated gallery; `/campaigns` and `/campaigns/[id]` render with moving progress bars.
- Manual donate flow: a donation increments the raised total and donor count and appears in recent supporters; donating to a non-approved id is rejected; rate limit triggers after the cap.
- Invariant spot-check: no assessment fields appear anywhere under `/campaigns*` or in the donate response; `campaigns.status` writes remain confined to the action route.
