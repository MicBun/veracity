import { eq, inArray, sum, desc } from "drizzle-orm";
import { db } from "@/db";
import {
  campaigns,
  aiAssessments,
  reviews,
  evalRuns,
  type Campaign,
  type AiAssessment,
  type Review,
} from "@/db/schema";
import { bundleAssessments, type AssessmentBundle } from "./assessments";

export type QueueEntry = {
  campaign: Campaign;
  bundle: AssessmentBundle;
};

export async function getPendingQueue(): Promise<QueueEntry[]> {
  const pending = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.status, "pending"))
    .orderBy(desc(campaigns.createdAt));

  if (pending.length === 0) return [];

  const rows = await db
    .select()
    .from(aiAssessments)
    .where(
      inArray(
        aiAssessments.campaignId,
        pending.map((c) => c.id)
      )
    );

  const byCampaign = new Map<string, AiAssessment[]>();
  for (const row of rows) {
    const list = byCampaign.get(row.campaignId) ?? [];
    list.push(row);
    byCampaign.set(row.campaignId, list);
  }

  return pending.map((campaign) => ({
    campaign,
    bundle: bundleAssessments(byCampaign.get(campaign.id) ?? []),
  }));
}

export async function getCampaignWithAssessments(id: string): Promise<{
  campaign: Campaign;
  bundle: AssessmentBundle;
  auditLog: Review[];
} | null> {
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, id))
    .limit(1);
  if (!campaign) return null;

  const [assessmentRows, auditLog] = await Promise.all([
    db.select().from(aiAssessments).where(eq(aiAssessments.campaignId, id)),
    db
      .select()
      .from(reviews)
      .where(eq(reviews.campaignId, id))
      .orderBy(desc(reviews.createdAt)),
  ]);

  return { campaign, bundle: bundleAssessments(assessmentRows), auditLog };
}

/** Total AI spend: every assessment ever made plus completed eval runs. */
export async function getTotalAiSpend(): Promise<number> {
  const [assessmentTotal] = await db
    .select({ total: sum(aiAssessments.costUsd) })
    .from(aiAssessments);

  const runs = await db
    .select({ metrics: evalRuns.metrics })
    .from(evalRuns)
    .where(eq(evalRuns.status, "complete"));

  let evalTotal = 0;
  for (const run of runs) {
    const m = run.metrics as { total_cost_usd?: number } | null;
    evalTotal += m?.total_cost_usd ?? 0;
  }

  return Number(assessmentTotal?.total ?? 0) + evalTotal;
}

/** Public view: status only, never assessment data. */
export async function getPublicCampaign(id: string): Promise<Campaign | null> {
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, id))
    .limit(1);
  return campaign ?? null;
}
