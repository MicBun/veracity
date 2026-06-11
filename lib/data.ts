import { eq, ne, inArray, sum, count, desc } from "drizzle-orm";
import { db } from "@/db";
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

export type HistoryEntry = {
  campaign: Campaign;
  review: Review | null;
};

/**
 * Reviewer-only history: every campaign that has left the pending queue
 * (approved / rejected / escalated), each paired with its latest review row,
 * newest decision first. The conditional UPDATE in the action route writes the
 * status and the review together, so a decided campaign normally has a review;
 * `review` is nullable only defensively.
 */
export async function getDecidedCampaigns(): Promise<HistoryEntry[]> {
  const decided = await db
    .select()
    .from(campaigns)
    .where(ne(campaigns.status, "pending"));

  if (decided.length === 0) return [];

  const reviewRows = await db
    .select()
    .from(reviews)
    .where(
      inArray(
        reviews.campaignId,
        decided.map((c) => c.id)
      )
    )
    .orderBy(desc(reviews.createdAt));

  // Rows arrive newest-first, so the first one seen per campaign is its latest.
  const latestReview = new Map<string, Review>();
  for (const r of reviewRows) {
    if (!latestReview.has(r.campaignId)) latestReview.set(r.campaignId, r);
  }

  const entries: HistoryEntry[] = decided.map((campaign) => ({
    campaign,
    review: latestReview.get(campaign.id) ?? null,
  }));

  // Order by decision time (fall back to submission time if a review is missing).
  entries.sort((a, b) => {
    const at = (a.review?.createdAt ?? a.campaign.createdAt).getTime();
    const bt = (b.review?.createdAt ?? b.campaign.createdAt).getTime();
    return bt - at;
  });

  return entries;
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

/** Public view: status only, never assessment data. */
export async function getPublicCampaign(id: string): Promise<Campaign | null> {
  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, id))
    .limit(1);
  return campaign ?? null;
}
