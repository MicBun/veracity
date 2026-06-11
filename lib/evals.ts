import { readFileSync } from "node:fs";
import path from "node:path";
import { eq, desc, and, lt } from "drizzle-orm";
import { db } from "@/db";
import { evalRuns, type EvalRun } from "@/db/schema";
import { assessCampaign } from "@/lib/ai/pipeline";
import { PROMPT_VERSION } from "@/lib/ai/prompts";
import type { CampaignInput, ScreeningOutput, DeepReviewOutput } from "@/lib/ai/schemas";

export const EVAL_CLASSES = [
  "clean",
  "subtle_fraud",
  "obvious_fraud",
  "ambiguous",
] as const;
export type EvalClass = (typeof EVAL_CLASSES)[number];

export type EvalCase = {
  id: string;
  label: EvalClass;
  rationale: string;
  campaign: CampaignInput;
};

/**
 * Pipeline output → predicted class mapping (documented on /admin/evals).
 *
 * Tuned against observed model behavior (prompt v2 analysis): escalations on
 * loud fraud carry HIGH screening risk but often LOW confidence (nothing is
 * verifiable — by design), so risk score separates obvious_fraud from
 * insufficient-information escalations better than confidence does.
 */
export const MAPPING_DOC = [
  "no deep review triggered (risk < 40 and confidence ≥ 0.7) → clean",
  "deep review says approve → clean",
  "deep review says flag_for_review (demonstrable deception) → subtle_fraud",
  "deep review says escalate with screening risk ≥ 70 → obvious_fraud",
  "deep review says escalate with screening risk < 70 (insufficient information, low confidence) → ambiguous",
];

export function predictClass(
  screening: ScreeningOutput,
  deepReview: DeepReviewOutput | null
): EvalClass {
  if (!deepReview) return "clean";
  switch (deepReview.recommendation) {
    case "approve":
      return "clean";
    case "flag_for_review":
      return "subtle_fraud";
    case "escalate":
      return screening.risk_score >= 70 ? "obvious_fraud" : "ambiguous";
  }
}

export type CaseResult = {
  id: string;
  title: string;
  truth: EvalClass;
  predicted: EvalClass | "error";
  risk_score: number | null;
  recommendation: string | null;
  confidence: number | null;
  cost_usd: number;
  error?: string;
};

export type EvalMetrics = {
  prompt_version: string;
  total_cases: number;
  scored_cases: number;
  accuracy: number;
  per_class: Record<
    EvalClass,
    {
      precision: number | null;
      recall: number | null;
      f1: number | null;
      support: number;
      errored: number;
    }
  >;
  confusion_matrix: Record<EvalClass, Record<EvalClass, number>>;
  false_negatives: Array<{
    id: string;
    title: string;
    truth: EvalClass;
    predicted: EvalClass | "error";
    risk_score: number | null;
    recommendation: string | null;
    confidence: number | null;
    rationale: string;
  }>;
  cases: CaseResult[];
  total_cost_usd: number;
  total_input_tokens: number;
  total_output_tokens: number;
  duration_ms: number;
};

export function loadEvalSet(): EvalCase[] {
  const file = path.join(process.cwd(), "data", "eval-set.json");
  return (JSON.parse(readFileSync(file, "utf8")) as { cases: EvalCase[] }).cases;
}

/** Bounded-concurrency map that preserves input order. */
async function mapPool<T, R>(
  items: T[],
  size: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(size, items.length) }, worker)
  );
  return results;
}

/**
 * Concurrency 5 keeps a 30-case run inside rate limits while finishing in
 * ~45s — comfortably under the 60s serverless function cap on Vercel's Hobby
 * plan, so the live "Run evals" button completes in production.
 */
const EVAL_CONCURRENCY = 5;

export async function runEvalCases(
  cases: EvalCase[],
  onProgress?: (done: number, total: number) => void | Promise<void>
): Promise<EvalMetrics> {
  const startedAt = Date.now();
  let done = 0;
  let totalCost = 0;
  let totalIn = 0;
  let totalOut = 0;

  const results = await mapPool(cases, EVAL_CONCURRENCY, async (c) => {
    let result: CaseResult;
    try {
      let pipeline;
      try {
        pipeline = await assessCampaign(c.campaign);
      } catch {
        // one retry per case — transient API errors shouldn't kill the run
        pipeline = await assessCampaign(c.campaign);
      }
      const { screening, deepReview } = pipeline;
      totalCost += screening.costUsd + (deepReview?.costUsd ?? 0);
      totalIn += screening.inputTokens + (deepReview?.inputTokens ?? 0);
      totalOut += screening.outputTokens + (deepReview?.outputTokens ?? 0);
      result = {
        id: c.id,
        title: c.campaign.title,
        truth: c.label,
        predicted: predictClass(screening.output, deepReview?.output ?? null),
        risk_score: screening.output.risk_score,
        recommendation: deepReview?.output.recommendation ?? null,
        confidence:
          deepReview?.output.confidence ?? screening.output.confidence,
        cost_usd: screening.costUsd + (deepReview?.costUsd ?? 0),
      };
    } catch (err) {
      result = {
        id: c.id,
        title: c.campaign.title,
        truth: c.label,
        predicted: "error",
        risk_score: null,
        recommendation: null,
        confidence: null,
        cost_usd: 0,
        error: err instanceof Error ? err.message : String(err),
      };
    }
    done += 1;
    await onProgress?.(done, cases.length);
    return result;
  });

  // ── Metrics ──
  const matrix = {} as EvalMetrics["confusion_matrix"];
  for (const t of EVAL_CLASSES) {
    matrix[t] = { clean: 0, subtle_fraud: 0, obvious_fraud: 0, ambiguous: 0 };
  }
  const scored = results.filter((r) => r.predicted !== "error");
  for (const r of scored) {
    matrix[r.truth][r.predicted as EvalClass] += 1;
  }

  const perClass = {} as EvalMetrics["per_class"];
  for (const cls of EVAL_CLASSES) {
    const tp = matrix[cls][cls];
    // support is the GROUND-TRUTH count for this class (all cases labeled cls,
    // including any that errored). Using it as the recall denominator means an
    // errored fraud case correctly LOWERS recall instead of vanishing — the
    // safety metric must never be optimistically biased by dropped cases.
    const support = results.filter((r) => r.truth === cls).length;
    const errored = results.filter(
      (r) => r.truth === cls && r.predicted === "error"
    ).length;
    const predicted = EVAL_CLASSES.reduce((s, t) => s + matrix[t][cls], 0);
    const precision = predicted > 0 ? tp / predicted : null;
    const recall = support > 0 ? tp / support : null;
    const f1 =
      precision !== null && recall !== null && precision + recall > 0
        ? (2 * precision * recall) / (precision + recall)
        : null;
    perClass[cls] = { precision, recall, f1, support, errored };
  }

  const correct = scored.filter((r) => r.truth === r.predicted).length;

  // The dangerous failure mode for T&S: fraud the AI waved through as clean —
  // OR fraud the AI failed to assess at all (an errored fraud case is just as
  // unsafe as a missed one, so it belongs in this list too).
  const falseNegatives = results
    .filter(
      (r) =>
        (r.truth === "subtle_fraud" || r.truth === "obvious_fraud") &&
        (r.predicted === "clean" || r.predicted === "error")
    )
    .map((r) => ({
      id: r.id,
      title: r.title,
      truth: r.truth,
      predicted: r.predicted as EvalClass | "error",
      risk_score: r.risk_score,
      recommendation: r.recommendation,
      confidence: r.confidence,
      rationale: cases.find((c) => c.id === r.id)?.rationale ?? "",
    }));

  return {
    prompt_version: PROMPT_VERSION,
    total_cases: cases.length,
    scored_cases: scored.length,
    accuracy: scored.length > 0 ? correct / scored.length : 0,
    per_class: perClass,
    confusion_matrix: matrix,
    false_negatives: falseNegatives,
    cases: results,
    total_cost_usd: totalCost,
    total_input_tokens: totalIn,
    total_output_tokens: totalOut,
    duration_ms: Date.now() - startedAt,
  };
}

/** Full run with persistence into eval_runs (cache for the dashboard). */
export async function runEvals(
  onProgress?: (done: number, total: number) => void | Promise<void>
): Promise<{ runId: string; metrics: EvalMetrics }> {
  const cases = loadEvalSet();
  const [run] = await db
    .insert(evalRuns)
    .values({ promptVersion: PROMPT_VERSION, status: "running" })
    .returning({ id: evalRuns.id });

  try {
    const metrics = await runEvalCases(cases, onProgress);
    await db
      .update(evalRuns)
      .set({ metrics, completedAt: new Date(), status: "complete" })
      .where(eq(evalRuns.id, run.id));
    return { runId: run.id, metrics };
  } catch (err) {
    await db
      .update(evalRuns)
      .set({ completedAt: new Date(), status: "failed" })
      .where(eq(evalRuns.id, run.id));
    throw err;
  }
}

/** Latest completed run (the dashboard cache). */
export async function getLatestCompleteRun(): Promise<EvalRun | null> {
  // Housekeeping: a "running" row older than 10 minutes is a dead run
  // (cancelled function, lost connection) — mark it failed.
  await db
    .update(evalRuns)
    .set({ status: "failed", completedAt: new Date() })
    .where(
      and(
        eq(evalRuns.status, "running"),
        lt(evalRuns.startedAt, new Date(Date.now() - 10 * 60 * 1000))
      )
    );

  const [run] = await db
    .select()
    .from(evalRuns)
    .where(eq(evalRuns.status, "complete"))
    .orderBy(desc(evalRuns.startedAt))
    .limit(1);
  return run ?? null;
}
