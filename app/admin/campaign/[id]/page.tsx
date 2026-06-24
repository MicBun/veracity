import { notFound } from "next/navigation";
import { getCampaignWithAssessments } from "@/lib/data";
import { CampaignReview } from "@/components/admin/campaign-review";
import type { ScreeningOutput, DeepReviewOutput } from "@/lib/ai/schemas";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getCampaignWithAssessments(id).catch(() => null);
  if (!data) notFound();

  const { campaign, bundle, auditLog } = data;

  return (
    <CampaignReview
      campaign={{
        id: campaign.id,
        title: campaign.title,
        description: campaign.description,
        goalAmount: campaign.goalAmount,
        category: campaign.category,
        organizerName: campaign.organizerName,
        organizerHistory: campaign.organizerHistory,
        status: campaign.status,
        source: campaign.source,
        createdAt: campaign.createdAt.toISOString(),
      }}
      screening={
        bundle.screening
          ? {
              output: bundle.screening.parsed as ScreeningOutput,
              model: bundle.screening.model,
              promptVersion: bundle.screening.promptVersion,
              inputTokens: bundle.screening.inputTokens,
              outputTokens: bundle.screening.outputTokens,
              costUsd: bundle.screening.costUsd,
              latencyMs: bundle.screening.latencyMs,
              createdAt: bundle.screening.createdAt.toISOString(),
            }
          : null
      }
      deepReview={
        bundle.deepReview
          ? {
              output: bundle.deepReview.parsed as DeepReviewOutput,
              model: bundle.deepReview.model,
              promptVersion: bundle.deepReview.promptVersion,
              inputTokens: bundle.deepReview.inputTokens,
              outputTokens: bundle.deepReview.outputTokens,
              costUsd: bundle.deepReview.costUsd,
              latencyMs: bundle.deepReview.latencyMs,
              createdAt: bundle.deepReview.createdAt.toISOString(),
            }
          : null
      }
      auditLog={auditLog.map((r) => ({
        id: r.id,
        reviewerName: r.reviewerName,
        action: r.action,
        note: r.note,
        createdAt: r.createdAt.toISOString(),
        snapshot: r.aiRecommendationSnapshot as Record<string, unknown> | null,
      }))}
    />
  );
}
