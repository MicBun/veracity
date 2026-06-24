import { z } from "zod";

/** The 6-category risk rubric. Used in prompts, validation, and eval labels. */
export const RISK_FLAGS = [
  "urgency_manipulation",
  "story_inconsistency",
  "identity_mismatch",
  "unverifiable_claims",
  "duplicate_pattern",
  "financial_anomaly",
] as const;

export const riskFlagSchema = z.enum(RISK_FLAGS);
export type RiskFlag = z.infer<typeof riskFlagSchema>;

/** Stage 1 — screening. Runs on every campaign at ingestion. */
export const screeningOutputSchema = z.object({
  risk_score: z
    .number()
    .min(0)
    .max(100)
    .describe("Overall fraud/policy risk, 0 (clean) to 100 (certain fraud)"),
  category_flags: z
    .array(riskFlagSchema)
    .describe("Every rubric category with meaningful evidence in this campaign"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe(
      "How confident you are in this assessment given the available information, 0 to 1"
    ),
  summary: z.string().describe("One sentence for the reviewer queue card"),
});
export type ScreeningOutput = z.infer<typeof screeningOutputSchema>;

/** Stage 2 — deep review. Runs when risk_score >= 40 or confidence < 0.7. */
export const deepReviewOutputSchema = z.object({
  recommendation: z.enum(["approve", "flag_for_review", "escalate"]),
  evidence: z
    .array(
      z.object({
        claim: z.string().describe("The specific concern or observation"),
        source_field: z
          .string()
          .describe(
            "Which campaign field triggered it: title | description | goal_amount | category | organizer_name | organizer_history.prior_campaigns | organizer_history.account_age_days | organizer_history.prior_flags"
          ),
        quote: z
          .string()
          .describe(
            "VERBATIM excerpt from that field (or the exact value for non-text fields)"
          ),
      })
    )
    .describe("Every flag must cite the specific campaign text or data field"),
  risk_factors: z.array(z.string()),
  mitigating_factors: z.array(z.string()),
  confidence: z.number().min(0).max(1),
  reasoning: z.string().describe("A short paragraph explaining the recommendation"),
});
export type DeepReviewOutput = z.infer<typeof deepReviewOutputSchema>;

/** Campaign fields as the pipeline consumes them (DB-independent). */
export type CampaignInput = {
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
};
