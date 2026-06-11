import type { AiAssessment } from "@/db/schema";
import type { ScreeningOutput, DeepReviewOutput } from "@/lib/ai/schemas";
import {
  DEEP_REVIEW_RISK_THRESHOLD,
  DEEP_REVIEW_CONFIDENCE_THRESHOLD,
} from "@/lib/ai/pipeline";

export type AssessmentBundle = {
  screening: (AiAssessment & { parsed: ScreeningOutput }) | null;
  deepReview: (AiAssessment & { parsed: DeepReviewOutput }) | null;
};

/** Picks the latest assessment per stage for one campaign. */
export function bundleAssessments(rows: AiAssessment[]): AssessmentBundle {
  const byStage = (stage: "screening" | "deep_review") =>
    rows
      .filter((r) => r.stage === stage)
      // id is the deterministic tiebreaker when two same-stage rows share a
      // createdAt (defaultNow() ties are possible at timestamp resolution).
      .sort(
        (a, b) =>
          b.createdAt.getTime() - a.createdAt.getTime() ||
          b.id.localeCompare(a.id)
      )[0] ?? null;

  const screening = byStage("screening");
  const deepReview = byStage("deep_review");
  return {
    screening: screening
      ? { ...screening, parsed: screening.output as ScreeningOutput }
      : null,
    deepReview: deepReview
      ? { ...deepReview, parsed: deepReview.output as DeepReviewOutput }
      : null,
  };
}

export type Lane = "fast_track" | "needs_review" | "escalated";

/**
 * Queue lane assignment. Fast-track = low risk + confident screening (or a
 * deep review that cleared the concern). The AI never moves a campaign out of
 * "pending" — lanes only order the human's work.
 */
export function laneFor(bundle: AssessmentBundle): Lane {
  const rec = bundle.deepReview?.parsed.recommendation;
  if (rec === "escalate") return "escalated";
  if (rec === "flag_for_review") return "needs_review";
  if (rec === "approve") return "fast_track";

  const s = bundle.screening?.parsed;
  if (
    s &&
    s.risk_score < DEEP_REVIEW_RISK_THRESHOLD &&
    s.confidence >= DEEP_REVIEW_CONFIDENCE_THRESHOLD
  ) {
    return "fast_track";
  }
  // Screening flagged it but no deep review exists (shouldn't happen in
  // practice) — be conservative.
  return "needs_review";
}

export function riskScoreOf(bundle: AssessmentBundle): number {
  return bundle.screening?.parsed.risk_score ?? 0;
}

/** Confidence of the most informative stage. */
export function confidenceOf(bundle: AssessmentBundle): number {
  return (
    bundle.deepReview?.parsed.confidence ??
    bundle.screening?.parsed.confidence ??
    0
  );
}

export function flagsOf(bundle: AssessmentBundle): string[] {
  return bundle.screening?.parsed.category_flags ?? [];
}

export function assessmentCostOf(bundle: AssessmentBundle): number {
  return (bundle.screening?.costUsd ?? 0) + (bundle.deepReview?.costUsd ?? 0);
}

/** The snapshot stored in the audit log at decision time. */
export function snapshotOf(bundle: AssessmentBundle) {
  return {
    screening: bundle.screening
      ? {
          output: bundle.screening.parsed,
          model: bundle.screening.model,
          prompt_version: bundle.screening.promptVersion,
          created_at: bundle.screening.createdAt.toISOString(),
        }
      : null,
    deep_review: bundle.deepReview
      ? {
          output: bundle.deepReview.parsed,
          model: bundle.deepReview.model,
          prompt_version: bundle.deepReview.promptVersion,
          created_at: bundle.deepReview.createdAt.toISOString(),
        }
      : null,
  };
}
