import { db } from "@/db";
import { aiAssessments, type Campaign } from "@/db/schema";
import type { CampaignInput } from "./schemas";
import type { PipelineResult, StageResult } from "./pipeline";

export function campaignToInput(c: Campaign): CampaignInput {
  return {
    title: c.title,
    description: c.description,
    goal_amount: c.goalAmount,
    category: c.category,
    organizer_name: c.organizerName,
    organizer_history: c.organizerHistory,
  };
}

async function insertStage(
  campaignId: string,
  stage: "screening" | "deep_review",
  result: StageResult<unknown>
) {
  await db.insert(aiAssessments).values({
    campaignId,
    stage,
    model: result.model,
    output: result.output as Record<string, unknown>,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    costUsd: result.costUsd,
    latencyMs: result.latencyMs,
    promptVersion: result.promptVersion,
  });
}

/** Persists both stages of a pipeline run to ai_assessments. */
export async function persistPipelineResult(
  campaignId: string,
  result: PipelineResult
): Promise<void> {
  await insertStage(campaignId, "screening", result.screening);
  if (result.deepReview) {
    await insertStage(campaignId, "deep_review", result.deepReview);
  }
}
