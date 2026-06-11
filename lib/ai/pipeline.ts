import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import {
  screeningOutputSchema,
  deepReviewOutputSchema,
  type CampaignInput,
  type ScreeningOutput,
  type DeepReviewOutput,
} from "./schemas";
import {
  PROMPT_VERSION,
  screeningSystemPrompt,
  deepReviewSystemPrompt,
  screeningUserMessage,
  deepReviewUserMessage,
} from "./prompts";

/**
 * Model config. Both stages run Haiku (cheapest, fast) today, but they are
 * separate constants on purpose: a stronger model (e.g. "claude-sonnet-4-6")
 * can be swapped into stage 2 deep review — where judgment matters most —
 * without touching any pipeline code.
 */
export const MODEL_SCREENING = "claude-haiku-4-5";
export const MODEL_DEEP_REVIEW = "claude-haiku-4-5";

/** Hardcoded price table (USD per million tokens). */
export const PRICE_TABLE: Record<string, { input: number; output: number }> = {
  "claude-haiku-4-5": { input: 1.0, output: 5.0 },
  "claude-sonnet-4-6": { input: 3.0, output: 15.0 },
};

/** Abuse protection: hard cap on output tokens for every API call. */
const MAX_TOKENS = 1500;

/** Stage 2 triggers when screening risk >= this OR confidence < this. */
export const DEEP_REVIEW_RISK_THRESHOLD = 40;
export const DEEP_REVIEW_CONFIDENCE_THRESHOLD = 0.7;

export function shouldDeepReview(s: ScreeningOutput): boolean {
  return (
    s.risk_score >= DEEP_REVIEW_RISK_THRESHOLD ||
    s.confidence < DEEP_REVIEW_CONFIDENCE_THRESHOLD
  );
}

export function computeCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const price = PRICE_TABLE[model];
  if (!price) throw new Error(`No price table entry for model ${model}`);
  return (inputTokens * price.input + outputTokens * price.output) / 1_000_000;
}

// maxRetries above the SDK default (2): the eval harness fires many calls in a
// short window, and a few extra retries with the SDK's exponential backoff
// absorb transient rate-limit bursts so individual cases don't error out.
const client = new Anthropic({ maxRetries: 4 });

export type StageResult<T> = {
  output: T;
  model: string;
  promptVersion: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs: number;
};

async function runStage<T>(
  model: string,
  system: string,
  userMessage: string,
  schema: Parameters<typeof zodOutputFormat>[0]
): Promise<StageResult<T>> {
  const startedAt = Date.now();
  const response = await client.messages.parse({
    model,
    max_tokens: MAX_TOKENS,
    system,
    messages: [{ role: "user", content: userMessage }],
    output_config: { format: zodOutputFormat(schema) },
  });
  const latencyMs = Date.now() - startedAt;

  if (!response.parsed_output) {
    throw new Error(
      `Model returned no parseable output (stop_reason: ${response.stop_reason})`
    );
  }

  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;
  return {
    output: response.parsed_output as T,
    model,
    promptVersion: PROMPT_VERSION,
    inputTokens,
    outputTokens,
    costUsd: computeCostUsd(model, inputTokens, outputTokens),
    latencyMs,
  };
}

export async function runScreening(
  campaign: CampaignInput
): Promise<StageResult<ScreeningOutput>> {
  return runStage<ScreeningOutput>(
    MODEL_SCREENING,
    screeningSystemPrompt(),
    screeningUserMessage(campaign),
    screeningOutputSchema
  );
}

export async function runDeepReview(
  campaign: CampaignInput,
  screening: ScreeningOutput
): Promise<StageResult<DeepReviewOutput>> {
  return runStage<DeepReviewOutput>(
    MODEL_DEEP_REVIEW,
    deepReviewSystemPrompt(),
    deepReviewUserMessage(campaign, screening),
    deepReviewOutputSchema
  );
}

export type PipelineResult = {
  screening: StageResult<ScreeningOutput>;
  deepReview: StageResult<DeepReviewOutput> | null;
};

export type PipelineStageEvent =
  | { stage: "screening"; status: "started" }
  | { stage: "screening"; status: "complete" }
  | { stage: "deep_review"; status: "started" }
  | { stage: "deep_review"; status: "complete" }
  | { stage: "deep_review"; status: "skipped" };

/**
 * Runs the full two-stage pipeline against a campaign. Pure with respect to
 * the database — persistence is the caller's concern. `onStage` lets callers
 * (e.g. the public submission flow) surface progress; events carry stage
 * names only, never scores or assessment content.
 */
export async function assessCampaign(
  campaign: CampaignInput,
  onStage?: (event: PipelineStageEvent) => void | Promise<void>
): Promise<PipelineResult> {
  await onStage?.({ stage: "screening", status: "started" });
  const screening = await runScreening(campaign);
  await onStage?.({ stage: "screening", status: "complete" });

  if (!shouldDeepReview(screening.output)) {
    await onStage?.({ stage: "deep_review", status: "skipped" });
    return { screening, deepReview: null };
  }

  await onStage?.({ stage: "deep_review", status: "started" });
  const deepReview = await runDeepReview(campaign, screening.output);
  await onStage?.({ stage: "deep_review", status: "complete" });
  return { screening, deepReview };
}
