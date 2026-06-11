# Public Donor Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the loop after approval — give donors a public gallery of approved campaigns, a per-campaign detail page, and a mock-but-persisted donation flow with a live progress bar.

**Architecture:** Two new public App-Router pages (`/campaigns`, `/campaigns/[id]`) plus one public, rate-limited write endpoint (`POST /api/donate`). A new `donations` table stores mock pledges; "raised" is always a derived `SUM`, never stored on `campaigns`. The reviewer action route remains the *only* writer of `campaigns.status`, and nothing under `/campaigns*` ever exposes assessment data. The seed gains 4 fully-consistent approved campaigns so the gallery is alive on day one.

**Tech Stack:** Next.js 15 App Router (React 19, Turbopack), Drizzle ORM on Neon HTTP, Zod validation, Tailwind v4 + shadcn/ui, TypeScript. No test runner — verification is `npm run lint`, `npm run build`, `npm run db:generate`/`db:migrate`, `npm run seed`, and manual flow checks (per CLAUDE.md).

**Spec:** `docs/superpowers/specs/2026-06-11-public-donor-experience-design.md`

**Conventions to honor:** Conventional Commits; **no `Co-Authored-By: Claude` trailer** (repo rule). Scripts import app modules via **relative** paths but tsx resolves `@/` transitively (proven by `npm run evals`). Pages reading the DB use `export const dynamic = "force-dynamic"`.

---

## File structure

**Create:**
- `app/campaigns/page.tsx` — public gallery of approved campaigns.
- `app/campaigns/[id]/page.tsx` — public donor detail page (approved-only).
- `app/api/donate/route.ts` — public, rate-limited mock-donation endpoint.
- `components/public/site-header.tsx` — shared public header (session-aware) for the campaign pages.
- `components/public/raised-progress.tsx` — raised/goal progress bar (server component, reused by gallery + detail).
- `components/public/donate-form.tsx` — `"use client"` donate form.

**Modify:**
- `db/schema.ts` — add `donationSourceEnum`, `donations` table, `Donation`/`NewDonation` types.
- `lib/data.ts` — add `ApprovedCampaign`, `getApprovedCampaigns()`, `getPublicApprovedCampaign()`.
- `lib/format.ts` — add `formatRelativeTime()`.
- `data/seed-campaigns.json` — add a `live_campaigns` array (4 approved campaigns).
- `scripts/seed.ts` — insert live campaigns + assessments + an `approve` review row + donations.
- `app/page.tsx` — "Browse campaigns" nav link + hero CTA.
- `app/about/page.tsx` — "Browse campaigns" nav link.
- `app/status/[id]/page.tsx` — approved banner deep-links to `/campaigns/[id]`.
- `app/admin/campaign/[id]/page.tsx` — (optional) "View public page ↗" link for approved campaigns.

**Generated:** a new migration under `drizzle/` from `npm run db:generate`.

---

## Task 1: `donations` table + migration

**Files:**
- Modify: `db/schema.ts`
- Generated: `drizzle/<timestamp>_*.sql`

- [ ] **Step 1: Add the enum + table + types to `db/schema.ts`**

Add the enum next to the other `pgEnum` declarations (after `evalRunStatusEnum`, before the `campaigns` table):

```ts
export const donationSourceEnum = pgEnum("donation_source", ["seed", "user"]);
```

Add the table after the `reviews` table definition:

```ts
// Mock donations. Insert-only for the public flow; "raised" is always a
// derived SUM over these rows — never stored on campaigns. This table is the
// ONLY thing the public donate endpoint writes to.
export const donations = pgTable("donations", {
  id: uuid("id").primaryKey().defaultRandom(),
  campaignId: uuid("campaign_id")
    .notNull()
    .references(() => campaigns.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(), // whole USD, matches campaigns.goalAmount
  donorName: text("donor_name"), // null → displayed as "Anonymous"
  source: donationSourceEnum("source").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
```

Add the types at the bottom, next to the other `$inferSelect` exports:

```ts
export type Donation = typeof donations.$inferSelect;
export type NewDonation = typeof donations.$inferInsert;
```

- [ ] **Step 2: Generate the migration**

Run: `npm run db:generate`
Expected: a new file under `drizzle/` whose SQL contains `CREATE TYPE "public"."donation_source"` and `CREATE TABLE "donations"` with a foreign key to `campaigns(id)` and `ON DELETE cascade`. Skim it to confirm no unexpected drops of other tables.

- [ ] **Step 3: Apply the migration to Neon**

Run: `npm run db:migrate`
Expected: applies cleanly; the `donations` table now exists.

- [ ] **Step 4: Verify lint is clean**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add db/schema.ts drizzle/
git commit -m "feat(db): add donations table (mock-persisted donations)"
```

---

## Task 2: extend the seed with live (approved) campaigns

**Files:**
- Modify: `data/seed-campaigns.json`
- Modify: `scripts/seed.ts`

- [ ] **Step 1: Add a `live_campaigns` array to `data/seed-campaigns.json`**

The file is currently `{ "campaigns": [ ... ] }`. Add a sibling top-level key `live_campaigns`. Paste this exact array as the value (4 approved campaigns, each with a screening assessment, an `approve` review, and donations at varied progress):

```json
"live_campaigns": [
  {
    "key": "live-01",
    "class": "clean",
    "title": "Winter heating fund for Bosnian refugee families in Utica",
    "description": "Eleven resettled families on Utica's east side share aging furnaces that failed inspection this fall. Working with the Mohawk Valley Resource Center for Refugees, we have a written quote from Bartell Heating to repair or replace six units before the first freeze. MVRCR is administering the funds and every receipt is posted to our updates page.",
    "goal_amount": 12000,
    "category": "emergency-relief",
    "organizer_name": "Selma Begovic",
    "organizer_history": { "prior_campaigns": 2, "account_age_days": 980, "prior_flags": 0 },
    "zakat_claimed": true,
    "assessments": [
      {
        "stage": "screening",
        "model": "claude-haiku-4-5",
        "prompt_version": "v3",
        "input_tokens": 742,
        "output_tokens": 92,
        "cost_usd": 0.0012,
        "latency_ms": 1310,
        "output": {
          "risk_score": 9,
          "category_flags": [],
          "confidence": 0.9,
          "summary": "Named partner org administering funds, written contractor quote, established organizer; no risk signals."
        }
      }
    ],
    "review": {
      "reviewer_name": "Aisha Rahman",
      "note": "Verified MVRCR partnership and contractor quote. Zakat-eligible need is clear. Approved."
    },
    "donations": [
      { "donor_name": null, "amount": 500, "days_ago": 9 },
      { "donor_name": "Imran S.", "amount": 250, "days_ago": 8 },
      { "donor_name": "Fatima K.", "amount": 100, "days_ago": 7 },
      { "donor_name": null, "amount": 1000, "days_ago": 6 },
      { "donor_name": "The Yusuf family", "amount": 2000, "days_ago": 5 },
      { "donor_name": "Bilal R.", "amount": 250, "days_ago": 5 },
      { "donor_name": null, "amount": 5000, "days_ago": 3 },
      { "donor_name": "Sara M.", "amount": 450, "days_ago": 2 },
      { "donor_name": "Omar H.", "amount": 500, "days_ago": 1 },
      { "donor_name": null, "amount": 1000, "days_ago": 0 }
    ]
  },
  {
    "key": "live-02",
    "class": "clean",
    "title": "Rebuild Masjid As-Salam's wudu facilities after the flood",
    "description": "June flash flooding ruined the ablution area and two restrooms at our 200-family mosque in Poughkeepsie. The board approved a repair plan and we have a $26,400 bid from Hudson Valley Plumbing; insurance is covering the difference above this campaign's goal. Plans and the bid are available to any donor on request.",
    "goal_amount": 20000,
    "category": "community",
    "organizer_name": "Tariq Mahmood",
    "organizer_history": { "prior_campaigns": 4, "account_age_days": 2100, "prior_flags": 0 },
    "zakat_claimed": false,
    "assessments": [
      {
        "stage": "screening",
        "model": "claude-haiku-4-5",
        "prompt_version": "v3",
        "input_tokens": 738,
        "output_tokens": 88,
        "cost_usd": 0.0012,
        "latency_ms": 1280,
        "output": {
          "risk_score": 7,
          "category_flags": [],
          "confidence": 0.91,
          "summary": "Long-standing organizer, board-approved repair with an itemized bid; goal sits below the total cost. No concerns."
        }
      }
    ],
    "review": {
      "reviewer_name": "Daniyal Osei",
      "note": "Board-approved scope, itemized bid, insurance covers the remainder. Approved."
    },
    "donations": [
      { "donor_name": null, "amount": 2000, "days_ago": 12 },
      { "donor_name": "Hudson Valley MSA", "amount": 3000, "days_ago": 10 },
      { "donor_name": "Nadia A.", "amount": 500, "days_ago": 8 },
      { "donor_name": null, "amount": 250, "days_ago": 6 },
      { "donor_name": "Yousef T.", "amount": 1500, "days_ago": 5 },
      { "donor_name": "Layla B.", "amount": 300, "days_ago": 4 },
      { "donor_name": null, "amount": 1000, "days_ago": 2 },
      { "donor_name": "Kareem D.", "amount": 750, "days_ago": 1 },
      { "donor_name": null, "amount": 500, "days_ago": 0 }
    ]
  },
  {
    "key": "live-03",
    "class": "clean",
    "title": "Tuition gap for Amina's final year of nursing school",
    "description": "Amina is a first-generation student one year from her RN at SUNY Broome. A reduction in her father's work hours left a $7,800 tuition gap for her final two semesters. The financial-aid office can confirm enrollment and the outstanding balance; funds will be paid directly to the bursar.",
    "goal_amount": 8000,
    "category": "education",
    "organizer_name": "Halima Yusuf",
    "organizer_history": { "prior_campaigns": 0, "account_age_days": 410, "prior_flags": 0 },
    "zakat_claimed": true,
    "assessments": [
      {
        "stage": "screening",
        "model": "claude-haiku-4-5",
        "prompt_version": "v3",
        "input_tokens": 726,
        "output_tokens": 96,
        "cost_usd": 0.0011,
        "latency_ms": 1240,
        "output": {
          "risk_score": 14,
          "category_flags": [],
          "confidence": 0.84,
          "summary": "Specific institution and verifiable balance, funds paid to bursar; first-time organizer is the only mild uncertainty."
        }
      }
    ],
    "review": {
      "reviewer_name": "Sana Iqbal",
      "note": "Direct-to-bursar disbursement and verifiable enrollment offset the first-time-organizer flag. Zakat-eligible. Approved."
    },
    "donations": [
      { "donor_name": null, "amount": 100, "days_ago": 3 },
      { "donor_name": "Mrs. Halima", "amount": 250, "days_ago": 2 },
      { "donor_name": null, "amount": 50, "days_ago": 2 },
      { "donor_name": "J. Idris", "amount": 300, "days_ago": 1 },
      { "donor_name": null, "amount": 150, "days_ago": 0 },
      { "donor_name": "Tariq", "amount": 100, "days_ago": 0 }
    ]
  },
  {
    "key": "live-04",
    "class": "clean",
    "title": "Emergency surgery for baby Zayd's congenital heart defect",
    "description": "Zayd was born with tetralogy of Fallot and needs corrective surgery at Boston Children's Hospital. After insurance, the family faces $14,200 in out-of-pocket costs for travel, lodging near the hospital, and the deductible. The hospital social worker can verify the treatment plan and cost estimate.",
    "goal_amount": 15000,
    "category": "medical",
    "organizer_name": "Yasmin Al-Rashid",
    "organizer_history": { "prior_campaigns": 1, "account_age_days": 1320, "prior_flags": 0 },
    "zakat_claimed": false,
    "assessments": [
      {
        "stage": "screening",
        "model": "claude-haiku-4-5",
        "prompt_version": "v3",
        "input_tokens": 751,
        "output_tokens": 99,
        "cost_usd": 0.0013,
        "latency_ms": 1360,
        "output": {
          "risk_score": 12,
          "category_flags": [],
          "confidence": 0.88,
          "summary": "Named hospital and condition, itemized post-insurance costs, verifiable via hospital social worker. No fraud signals."
        }
      }
    ],
    "review": {
      "reviewer_name": "Aisha Rahman",
      "note": "Named facility and condition with a verifiable cost breakdown. Approved."
    },
    "donations": [
      { "donor_name": null, "amount": 5000, "days_ago": 7 },
      { "donor_name": "The Rahman family", "amount": 1000, "days_ago": 6 },
      { "donor_name": "Dr. Suleiman", "amount": 500, "days_ago": 5 },
      { "donor_name": null, "amount": 1500, "days_ago": 4 },
      { "donor_name": "Mariam O.", "amount": 250, "days_ago": 3 },
      { "donor_name": "Khalid", "amount": 750, "days_ago": 2 },
      { "donor_name": null, "amount": 1000, "days_ago": 1 },
      { "donor_name": "Noor S.", "amount": 500, "days_ago": 0 }
    ]
  }
]
```

(Place it as a second top-level key, e.g. `{ "campaigns": [...], "live_campaigns": [...] }`.)

- [ ] **Step 2: Update `scripts/seed.ts` — imports and type**

Replace the import block (lines 16–17) so it also pulls `reviews`, `donations`, and the assessment helpers:

```ts
  const { db } = await import("../db");
  const { campaigns, aiAssessments, reviews, donations } = await import("../db/schema");
  const { bundleAssessments, snapshotOf } = await import("../lib/assessments");
```

Extend the parsed-data type (the `as { campaigns: Array<...> }` annotation) to add the `live_campaigns` shape. After the existing `campaigns: Array<{ ... }>` member, add:

```ts
    live_campaigns: Array<{
      key: string;
      title: string;
      description: string;
      goal_amount: number;
      category: string;
      organizer_name: string;
      organizer_history: {
        prior_campaigns: number;
        account_age_days: number;
        prior_flags: number;
      };
      zakat_claimed: boolean;
      assessments: Array<{
        stage: "screening" | "deep_review";
        model: string;
        prompt_version: string;
        input_tokens: number;
        output_tokens: number;
        cost_usd: number;
        latency_ms: number;
        output: Record<string, unknown>;
      }>;
      review: { reviewer_name: string; note?: string };
      donations: Array<{ donor_name: string | null; amount: number; days_ago: number }>;
    }>;
```

- [ ] **Step 3: Insert the live campaigns**

Right after the existing pending-campaign loop ends (after its closing `}` and before the final `console.log(\`Seeded ${data.campaigns.length} campaigns.\`)`), add:

```ts
  for (const c of data.live_campaigns) {
    const [row] = await db
      .insert(campaigns)
      .values({
        title: c.title,
        description: c.description,
        goalAmount: c.goal_amount,
        category: c.category,
        organizerName: c.organizer_name,
        organizerHistory: c.organizer_history,
        zakatClaimed: c.zakat_claimed,
        status: "approved",
        source: "seed",
      })
      .returning({ id: campaigns.id });

    for (const a of c.assessments) {
      await db.insert(aiAssessments).values({
        campaignId: row.id,
        stage: a.stage,
        model: a.model,
        output: a.output,
        inputTokens: a.input_tokens,
        outputTokens: a.output_tokens,
        costUsd: a.cost_usd,
        latencyMs: a.latency_ms,
        promptVersion: a.prompt_version,
      });
    }

    // Build the same audit snapshot the reviewer action route stores, so the
    // admin History page and audit log render these exactly like a real
    // approval.
    const assessmentRows = await db
      .select()
      .from(aiAssessments)
      .where(eq(aiAssessments.campaignId, row.id));
    const snapshot = snapshotOf(bundleAssessments(assessmentRows));

    await db.insert(reviews).values({
      campaignId: row.id,
      reviewerName: c.review.reviewer_name,
      action: "approve",
      aiRecommendationSnapshot: snapshot,
      note: c.review.note ?? null,
    });

    for (const d of c.donations) {
      await db.insert(donations).values({
        campaignId: row.id,
        amount: d.amount,
        donorName: d.donor_name,
        source: "seed",
        createdAt: new Date(Date.now() - d.days_ago * 86_400_000),
      });
    }

    console.log(`  ✓ ${c.key}: ${c.title} (live · ${c.donations.length} donations)`);
  }

  console.log(`Seeded ${data.live_campaigns.length} live campaigns.`);
```

Note: the existing reset `db.delete(campaigns).where(eq(campaigns.source, "seed"))` already cascades to these new approved campaigns' assessments, reviews, and donations (all FK `onDelete: cascade`), so re-running the seed stays idempotent — no extra delete needed.

- [ ] **Step 4: Run the seed**

Run: `npm run seed`
Expected: logs the 10 pending campaigns, then 4 `live ·` lines, then `Seeded 4 live campaigns.` No errors.

- [ ] **Step 5: Lint**

Run: `npm run lint`
Expected: clean.

- [ ] **Step 6: Commit**

```bash
git add data/seed-campaigns.json scripts/seed.ts
git commit -m "feat(seed): add 4 approved live campaigns with reviews and donations"
```

---

## Task 3: data-access helpers for approved campaigns

**Files:**
- Modify: `lib/data.ts`

- [ ] **Step 1: Update imports in `lib/data.ts`**

Change the drizzle import to add `count`:

```ts
import { eq, ne, inArray, sum, count, desc } from "drizzle-orm";
```

Add `donations` and the `Donation` type to the schema import (extend the existing import list):

```ts
import {
  campaigns,
  aiAssessments,
  reviews,
  evalRuns,
  donations,
  type Campaign,
  type AiAssessment,
  type Review,
  type Donation,
} from "@/db/schema";
```

- [ ] **Step 2: Append the two helpers to `lib/data.ts`**

```ts
export type ApprovedCampaign = {
  campaign: Campaign;
  raised: number;
  donorCount: number;
};

/**
 * Public gallery source: approved campaigns only, newest first, each with its
 * derived raised total and donor count. Exposes campaign content + aggregates
 * only — never assessment data.
 */
export async function getApprovedCampaigns(): Promise<ApprovedCampaign[]> {
  const approved = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.status, "approved"))
    .orderBy(desc(campaigns.createdAt));
  if (approved.length === 0) return [];

  const agg = await db
    .select({
      campaignId: donations.campaignId,
      raised: sum(donations.amount),
      donorCount: count(donations.id),
    })
    .from(donations)
    .where(
      inArray(
        donations.campaignId,
        approved.map((c) => c.id)
      )
    )
    .groupBy(donations.campaignId);

  const byId = new Map(agg.map((a) => [a.campaignId, a]));
  return approved.map((campaign) => {
    const a = byId.get(campaign.id);
    return {
      campaign,
      raised: Number(a?.raised ?? 0),
      donorCount: Number(a?.donorCount ?? 0),
    };
  });
}

/**
 * Public donor detail source. Returns null if the campaign is missing OR not
 * approved — pending/rejected/escalated never render here (the detail route
 * turns null into notFound()). Recent supporters are the latest 8 donations.
 */
export async function getPublicApprovedCampaign(id: string): Promise<{
  campaign: Campaign;
  raised: number;
  donorCount: number;
  recent: Donation[];
} | null> {
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, id))
    .limit(1);
  if (!campaign || campaign.status !== "approved") return null;

  const [agg] = await db
    .select({ raised: sum(donations.amount), donorCount: count(donations.id) })
    .from(donations)
    .where(eq(donations.campaignId, id));

  const recent = await db
    .select()
    .from(donations)
    .where(eq(donations.campaignId, id))
    .orderBy(desc(donations.createdAt))
    .limit(8);

  return {
    campaign,
    raised: Number(agg?.raised ?? 0),
    donorCount: Number(agg?.donorCount ?? 0),
    recent,
  };
}
```

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: clean (no unused-import errors — `count` and `Donation` are both used).

- [ ] **Step 4: Commit**

```bash
git add lib/data.ts
git commit -m "feat(data): approved-campaign queries with derived raised totals"
```

---

## Task 4: public presentational pieces (format helper, progress bar, header)

**Files:**
- Modify: `lib/format.ts`
- Create: `components/public/raised-progress.tsx`
- Create: `components/public/site-header.tsx`

- [ ] **Step 1: Add `formatRelativeTime` to `lib/format.ts`**

Append:

```ts
/** Coarse relative time for the recent-supporters list (e.g. "3 days ago"). */
export function formatRelativeTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const days = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? "a month ago" : `${months} months ago`;
}
```

- [ ] **Step 2: Create `components/public/raised-progress.tsx`**

```tsx
import { Progress } from "@/components/ui/progress";
import { formatUsd } from "@/lib/format";

/** Raised/goal bar shared by the gallery card and the detail page. */
export function RaisedProgress({
  raised,
  goal,
  donorCount,
}: {
  raised: number;
  goal: number;
  donorCount: number;
}) {
  const pct = goal > 0 ? (raised / goal) * 100 : 0;
  return (
    <div className="space-y-2">
      <Progress value={Math.min(100, pct)} className="h-2" />
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
        <p className="font-semibold text-emerald-900">
          {formatUsd(raised)}{" "}
          <span className="font-normal text-stone-500">
            raised of {formatUsd(goal)}
          </span>
        </p>
        <p className="text-stone-500">
          {Math.round(pct)}% funded · {donorCount}{" "}
          {donorCount === 1 ? "donor" : "donors"}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `components/public/site-header.tsx`**

```tsx
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/session-cookies";

/** Session-aware public header used by the donor-facing campaign pages. */
export async function SiteHeader() {
  const session = await getSession();
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
      <Link href="/" className="flex items-center gap-2">
        <ShieldCheck className="size-5 text-emerald-700" />
        <span className="font-serif text-xl font-semibold tracking-tight">
          Amanah
        </span>
      </Link>
      <nav className="flex items-center gap-2 sm:gap-5">
        <Link
          href="/campaigns"
          className="hidden text-sm text-stone-600 hover:text-stone-900 sm:block"
        >
          Browse campaigns
        </Link>
        <Link
          href="/about"
          className="hidden text-sm text-stone-600 hover:text-stone-900 sm:block"
        >
          How it works
        </Link>
        {session ? (
          <Link
            href="/admin/queue"
            className="text-sm font-medium text-emerald-800 hover:text-emerald-900"
          >
            Reviewer console
          </Link>
        ) : (
          <Link
            href="/login"
            className="text-sm text-stone-600 hover:text-stone-900"
          >
            Reviewer sign-in
          </Link>
        )}
        <Button asChild size="sm" className="bg-emerald-700 hover:bg-emerald-800">
          <Link href="/submit">Submit a campaign</Link>
        </Button>
      </nav>
    </header>
  );
}
```

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add lib/format.ts components/public/raised-progress.tsx components/public/site-header.tsx
git commit -m "feat(public): shared donor-page header, progress bar, relative-time helper"
```

---

## Task 5: `/campaigns` gallery page

**Files:**
- Create: `app/campaigns/page.tsx`

- [ ] **Step 1: Create `app/campaigns/page.tsx`**

```tsx
import Link from "next/link";
import { getApprovedCampaigns } from "@/lib/data";
import { SiteHeader } from "@/components/public/site-header";
import { RaisedProgress } from "@/components/public/raised-progress";
import { CATEGORY_LABELS } from "@/lib/format";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Live campaigns — Amanah",
};

export default async function CampaignsPage() {
  const live = await getApprovedCampaigns();

  return (
    <div className="min-h-screen bg-[#faf8f4] text-stone-900">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 pb-20 pt-6">
        <div className="max-w-2xl">
          <h1 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">
            Live campaigns
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-stone-600">
            Every campaign here passed Amanah&apos;s AI triage and was approved by
            a human reviewer. Support one directly.
          </p>
          <p className="mt-2 text-xs text-stone-500">
            Demo — donations are simulated and no real payment is processed.
          </p>
        </div>

        {live.length === 0 ? (
          <p className="mt-10 rounded-xl border border-dashed border-stone-300 p-10 text-center text-sm text-stone-500">
            No live campaigns yet. Approved campaigns appear here.
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {live.map(({ campaign, raised, donorCount }) => (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                className="flex flex-col rounded-xl border border-stone-200 bg-white p-5 transition-shadow hover:shadow-[0_18px_50px_-26px_rgba(12,46,36,0.4)]"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                    {CATEGORY_LABELS[campaign.category] ?? campaign.category}
                  </span>
                  {campaign.zakatClaimed && (
                    <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
                      Zakat
                    </span>
                  )}
                </div>
                <h2 className="mt-3 font-serif text-lg font-medium leading-snug">
                  {campaign.title}
                </h2>
                <p className="mt-1 line-clamp-2 text-sm text-stone-600">
                  {campaign.description}
                </p>
                <p className="mt-1 text-xs text-stone-500">
                  by {campaign.organizerName}
                </p>
                <div className="mt-4 flex-1" />
                <RaisedProgress
                  raised={raised}
                  goal={campaign.goalAmount}
                  donorCount={donorCount}
                />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Verify it renders with seeded data**

Run: `npm run dev`, open `http://localhost:3000/campaigns`.
Expected: 4 cards with moving progress bars at roughly 92% / 49% / 12% / 70%, each showing a donor count. No risk scores/flags anywhere. Clicking a card navigates to `/campaigns/<id>` (will 404 until Task 7 — that's fine for now). Stop dev when done.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add app/campaigns/page.tsx
git commit -m "feat(campaigns): public gallery of approved campaigns"
```

---

## Task 6: `POST /api/donate` endpoint

**Files:**
- Create: `app/api/donate/route.ts`

- [ ] **Step 1: Create `app/api/donate/route.ts`**

```ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, sum, count } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, donations } from "@/db/schema";
import { checkRateLimit, clientIpFrom } from "@/lib/rate-limit";

const donateSchema = z.object({
  campaign_id: z.string().uuid(),
  amount: z.number().int().min(1).max(100_000),
  donor_name: z.string().trim().max(60).optional(),
});

/**
 * Public mock-donation endpoint. Writes ONLY to the donations table — it never
 * touches campaigns.status (still owned solely by the reviewer action route)
 * and never returns or reads assessment data. Re-checks status='approved'
 * server-side so a guessed id for a pending/rejected campaign is rejected.
 */
export async function POST(request: NextRequest) {
  const ip = clientIpFrom(request.headers);
  const rate = await checkRateLimit(`donate:${ip}`, 30, 3600);
  if (!rate.allowed) {
    return Response.json(
      { error: "Rate limit reached: 30 donations per hour per IP. Try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = donateSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return Response.json(
      { error: `${issue?.path.join(".")}: ${issue?.message}` },
      { status: 400 }
    );
  }
  const { campaign_id, amount, donor_name } = parsed.data;

  const [campaign] = await db
    .select({ id: campaigns.id, status: campaigns.status })
    .from(campaigns)
    .where(eq(campaigns.id, campaign_id))
    .limit(1);
  if (!campaign) {
    return Response.json({ error: "Campaign not found" }, { status: 404 });
  }
  if (campaign.status !== "approved") {
    return Response.json(
      { error: "This campaign is not accepting donations." },
      { status: 409 }
    );
  }

  await db.insert(donations).values({
    campaignId: campaign_id,
    amount,
    donorName: donor_name && donor_name.length > 0 ? donor_name : null,
    source: "user",
  });

  const [agg] = await db
    .select({ raised: sum(donations.amount), donorCount: count(donations.id) })
    .from(donations)
    .where(eq(donations.campaignId, campaign_id));

  return Response.json({
    ok: true,
    raised: Number(agg?.raised ?? 0),
    donorCount: Number(agg?.donorCount ?? 0),
  });
}
```

- [ ] **Step 2: Smoke-test the endpoint against the running app**

With `npm run dev` running, pick a live campaign id (from `/campaigns`, copy an id from a card link) and run:

```bash
curl -s -X POST http://localhost:3000/api/donate \
  -H "Content-Type: application/json" \
  -d '{"campaign_id":"<LIVE_ID>","amount":42,"donor_name":"Curl Tester"}'
```
Expected: `{"ok":true,"raised":<bigger>,"donorCount":<+1>}`.

Then verify the guard rejects a non-approved id (use any pending campaign id from the admin queue):
```bash
curl -s -X POST http://localhost:3000/api/donate \
  -H "Content-Type: application/json" \
  -d '{"campaign_id":"<PENDING_ID>","amount":42}'
```
Expected: HTTP 409 `{"error":"This campaign is not accepting donations."}`.

(After testing, optionally re-run `npm run seed` to reset the seeded donation totals.)

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add app/api/donate/route.ts
git commit -m "feat(api): rate-limited mock donation endpoint (donations-only write)"
```

---

## Task 7: donate form + `/campaigns/[id]` detail page

**Files:**
- Create: `components/public/donate-form.tsx`
- Create: `app/campaigns/[id]/page.tsx`

- [ ] **Step 1: Create `components/public/donate-form.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";

const PRESETS = [25, 50, 100, 250];

export function DonateForm({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState("50");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Math.floor(Number(amount));
    if (!Number.isFinite(value) || value < 1) {
      setStatus("error");
      setMessage("Enter an amount of $1 or more.");
      return;
    }
    setStatus("submitting");
    setMessage(null);
    try {
      const res = await fetch("/api/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: campaignId,
          amount: value,
          donor_name: name.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Donation failed. Please try again.");
        return;
      }
      setStatus("success");
      setMessage(`Thank you! Your ${formatUsd(value)} demo donation was recorded.`);
      setName("");
      router.refresh(); // re-fetch the server component → bar + supporters update
    } catch {
      setStatus("error");
      setMessage("Network error — please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setAmount(String(p))}
            className={cn(
              "rounded-md border px-2 py-1.5 text-sm font-medium transition-colors",
              Math.floor(Number(amount)) === p
                ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                : "border-stone-300 text-stone-600 hover:border-stone-400"
            )}
          >
            ${p}
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="amount">Amount (USD)</Label>
        <Input
          id="amount"
          type="number"
          min={1}
          max={100000}
          step={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="donor-name">Display name (optional)</Label>
        <Input
          id="donor-name"
          maxLength={60}
          placeholder="Anonymous"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <Button
        type="submit"
        disabled={status === "submitting"}
        className="w-full bg-emerald-700 hover:bg-emerald-800"
      >
        {status === "submitting" ? "Processing…" : "Donate"}
      </Button>
      {message && (
        <p
          className={cn(
            "text-sm",
            status === "success" ? "text-emerald-700" : "text-red-600"
          )}
        >
          {message}
        </p>
      )}
    </form>
  );
}
```

- [ ] **Step 2: Create `app/campaigns/[id]/page.tsx`**

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicApprovedCampaign } from "@/lib/data";
import { SiteHeader } from "@/components/public/site-header";
import { RaisedProgress } from "@/components/public/raised-progress";
import { DonateForm } from "@/components/public/donate-form";
import { CATEGORY_LABELS, formatUsd, formatRelativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getPublicApprovedCampaign(id).catch(() => null);
  if (!data) notFound();
  const { campaign, raised, donorCount, recent } = data;

  return (
    <div className="min-h-screen bg-[#faf8f4] text-stone-900">
      <SiteHeader />
      <main className="mx-auto grid max-w-6xl gap-8 px-5 pb-20 pt-6 lg:grid-cols-[1.6fr_1fr]">
        <article>
          <Link
            href="/campaigns"
            className="text-sm text-stone-500 hover:text-stone-800"
          >
            ← All live campaigns
          </Link>
          <div className="mt-3 flex items-center gap-2">
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
              {CATEGORY_LABELS[campaign.category] ?? campaign.category}
            </span>
            {campaign.zakatClaimed && (
              <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
                Zakat-eligible (claimed)
              </span>
            )}
          </div>
          <h1 className="mt-3 font-serif text-3xl font-medium leading-tight tracking-tight">
            {campaign.title}
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            by {campaign.organizerName}
          </p>
          <p className="mt-6 whitespace-pre-wrap text-[15px] leading-relaxed text-stone-700">
            {campaign.description}
          </p>
        </article>

        <aside className="space-y-5">
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <RaisedProgress
              raised={raised}
              goal={campaign.goalAmount}
              donorCount={donorCount}
            />
            <div className="mt-5">
              <DonateForm campaignId={campaign.id} />
            </div>
            <p className="mt-3 text-center text-[11px] text-stone-400">
              Demo — no real payment is processed.
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Recent supporters
            </p>
            {recent.length === 0 ? (
              <p className="mt-3 text-sm text-stone-500">
                Be the first to support this campaign.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {recent.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-baseline justify-between gap-3 text-sm"
                  >
                    <span className="min-w-0 truncate font-medium text-stone-700">
                      {d.donorName ?? "Anonymous"}
                    </span>
                    <span className="shrink-0 text-stone-500">
                      {formatUsd(d.amount)} · {formatRelativeTime(d.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Verify the full donate flow end-to-end**

With `npm run dev`: open `/campaigns`, click a card → detail page renders story + progress + supporters + form. Submit a $50 donation → success message appears, the progress bar and donor count increase, and your donation appears in "Recent supporters" (via `router.refresh()`). Then visit `/campaigns/<a-PENDING-id>` → 404. Confirm no risk score/flag/recommendation appears anywhere on the page.

- [ ] **Step 4: Lint**

Run: `npm run lint`
Expected: clean.

- [ ] **Step 5: Commit**

```bash
git add components/public/donate-form.tsx app/campaigns/[id]/page.tsx
git commit -m "feat(campaigns): donor detail page with mock donate form"
```

---

## Task 8: navigation entry points

**Files:**
- Modify: `app/page.tsx`
- Modify: `app/about/page.tsx`
- Modify: `app/status/[id]/page.tsx`
- Modify: `app/admin/campaign/[id]/page.tsx` (optional link)

- [ ] **Step 1: Landing nav link (`app/page.tsx`)**

Find the nav opening + "How it works" link:

```tsx
        <nav className="flex items-center gap-2 sm:gap-5">
          <Link
            href="/about"
            className="hidden text-sm text-stone-600 hover:text-stone-900 sm:block"
          >
            How it works
          </Link>
```

Replace with (adds a "Browse campaigns" link before it):

```tsx
        <nav className="flex items-center gap-2 sm:gap-5">
          <Link
            href="/campaigns"
            className="hidden text-sm text-stone-600 hover:text-stone-900 sm:block"
          >
            Browse campaigns
          </Link>
          <Link
            href="/about"
            className="hidden text-sm text-stone-600 hover:text-stone-900 sm:block"
          >
            How it works
          </Link>
```

- [ ] **Step 2: Landing hero CTA (`app/page.tsx`)**

Find the hero button row:

```tsx
              <Button asChild size="lg" variant="outline" className="border-stone-300 bg-white/60">
                <Link href="/login">Open the reviewer console</Link>
              </Button>
            </div>
```

Replace with (adds a "Browse live campaigns" ghost button):

```tsx
              <Button asChild size="lg" variant="outline" className="border-stone-300 bg-white/60">
                <Link href="/login">Open the reviewer console</Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link href="/campaigns">Browse live campaigns</Link>
              </Button>
            </div>
```

- [ ] **Step 3: About nav link (`app/about/page.tsx`)**

Find:

```tsx
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/submit" className="text-stone-600 hover:text-stone-900">
            Submit
          </Link>
```

Replace with (adds "Browse campaigns" before "Submit"):

```tsx
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/campaigns" className="text-stone-600 hover:text-stone-900">
            Browse campaigns
          </Link>
          <Link href="/submit" className="text-stone-600 hover:text-stone-900">
            Submit
          </Link>
```

- [ ] **Step 4: Status page deep-link (`app/status/[id]/page.tsx`)**

Find the status banner block close + the `<Card>` opening:

```tsx
        </div>

        <Card>
```

Replace with (adds a "View your live campaign page" link only when approved, between the banner and the card):

```tsx
        </div>

        {campaign.status === "approved" && (
          <Link
            href={`/campaigns/${campaign.id}`}
            className="flex w-fit items-center gap-1 text-sm font-medium text-emerald-800 underline underline-offset-2 hover:text-emerald-900"
          >
            View your live campaign page →
          </Link>
        )}

        <Card>
```

(`Link` is already imported in this file.)

- [ ] **Step 5: (Optional) Admin "View public page" link (`app/admin/campaign/[id]/page.tsx`)**

If cheap, add a link to the public page for approved campaigns near the campaign header. Read the file first; add, where the campaign title/status is shown:

```tsx
{campaign.status === "approved" && (
  <a
    href={`/campaigns/${campaign.id}`}
    target="_blank"
    rel="noreferrer"
    className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
  >
    View public page ↗
  </a>
)}
```

Skip this step if it complicates the existing layout — it is not required by the spec.

- [ ] **Step 6: Lint**

Run: `npm run lint`
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add app/page.tsx app/about/page.tsx app/status/[id]/page.tsx app/admin/campaign/[id]/page.tsx
git commit -m "feat(nav): donor entry points to the campaigns gallery"
```

---

## Task 9: full verification & wrap

**Files:** none (verification only)

- [ ] **Step 1: Reset the seed to clean totals**

Run: `npm run seed`
Expected: 10 pending + 4 live campaigns; no errors.

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: clean.

- [ ] **Step 3: Production build**

Run: `npm run build`
Expected: build succeeds. Confirm `/campaigns` and `/campaigns/[id]` appear as dynamic (`ƒ`) routes and `/api/donate` is listed.

- [ ] **Step 4: Manual invariant checklist (dev server)**

- `/campaigns` and `/campaigns/[id]` show **no** risk score, flag, recommendation, confidence, or reasoning.
- `/campaigns/<pending-or-rejected-id>` returns 404.
- A donation increments raised total + donor count + recent supporters.
- The admin **History** page lists the 4 seeded live campaigns as "Approved by …"; opening one shows its audit log with the AI snapshot (confirms full-consistency seed).
- `grep -rn "status" app/api/donate/route.ts` shows only **reads** of `campaigns.status`, never an update — `campaigns.status` is still written exclusively in `app/api/admin/campaigns/[id]/action/route.ts`.

- [ ] **Step 5: Final commit (only if anything changed during verification)**

```bash
git add -A
git commit -m "chore: verify public donor experience end-to-end"
```

---

## Self-review (completed during planning)

**Spec coverage:** `/campaigns` gallery → Task 5. `/campaigns/[id]` approved-only detail → Task 7. `POST /api/donate` rate-limited + approved-recheck → Task 6. `donations` table (amount/donorName/source) → Task 1. Derived raised via SUM + helpers → Task 3. Seed of 4 fully-consistent approved campaigns (campaign + assessments + approve review + donations) → Task 2. Nav entry points + status deep-link → Task 8. Invariant preservation (status single-writer, no assessment exposure, server-side approved recheck) → Tasks 6 & 9. All spec sections map to a task.

**Placeholder scan:** No TBD/TODO; every code step shows complete code; the only "optional" step (admin link, Task 8 Step 5) is explicitly marked optional and matches the spec's optional framing.

**Type consistency:** `getApprovedCampaigns` returns `ApprovedCampaign[]` (`{campaign, raised, donorCount}`) consumed in Task 5. `getPublicApprovedCampaign` returns `{campaign, raised, donorCount, recent: Donation[]}` consumed in Task 7. The donate endpoint accepts `{campaign_id, amount, donor_name}` (snake_case) — matched exactly by `DonateForm`'s POST body. `Donation`, `donations`, `donationSourceEnum` defined in Task 1 and used consistently in Tasks 3/6. `formatRelativeTime` defined in Task 4, used in Task 7.
