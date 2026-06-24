/**
 * Seeds the queue with 10 campaigns and their committed AI assessments.
 * Idempotent: wipes previously seeded rows (source = 'seed') first, so it can
 * be re-run safely. Uses committed assessment JSON — no API calls, no cost.
 *
 * Usage: npm run seed
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { eq } from "drizzle-orm";
import { readFileSync } from "node:fs";
import path from "node:path";

async function main() {
  const { db } = await import("../db");
  const { campaigns, aiAssessments, reviews, donations } = await import("../db/schema");
  const { bundleAssessments, snapshotOf } = await import("../lib/assessments");

  const file = path.join(process.cwd(), "data", "seed-campaigns.json");
  const data = JSON.parse(readFileSync(file, "utf8")) as {
    campaigns: Array<{
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
    }>;
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
  };

  console.log("Removing previously seeded campaigns…");
  await db.delete(campaigns).where(eq(campaigns.source, "seed"));

  for (const c of data.campaigns) {
    const [row] = await db
      .insert(campaigns)
      .values({
        title: c.title,
        description: c.description,
        goalAmount: c.goal_amount,
        category: c.category,
        organizerName: c.organizer_name,
        organizerHistory: c.organizer_history,
        status: "pending",
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
    console.log(`  ✓ ${c.key}: ${c.title} (${c.assessments.length} assessment(s))`);
  }

  console.log(`Seeded ${data.campaigns.length} campaigns.`);

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
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
