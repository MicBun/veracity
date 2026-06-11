/**
 * CLI eval run against the 30-case labeled dataset. Persists results to
 * eval_runs (the same cache the /admin/evals dashboard reads).
 *
 * Usage: npm run evals
 */
import { config } from "dotenv";
config({ path: ".env.local" });

async function main() {
  const { runEvals, EVAL_CLASSES } = await import("../lib/evals");

  console.log("Running evals against data/eval-set.json…\n");
  const { metrics } = await runEvals((done, total) => {
    process.stdout.write(`\r  progress: ${done}/${total} cases`);
  });
  console.log("\n");

  console.log(`prompt_version: ${metrics.prompt_version}`);
  console.log(
    `accuracy: ${(metrics.accuracy * 100).toFixed(1)}% (${metrics.scored_cases}/${metrics.total_cases} scored)`
  );
  console.log(
    `cost: $${metrics.total_cost_usd.toFixed(4)} | tokens: ${metrics.total_input_tokens}/${metrics.total_output_tokens} | ${(metrics.duration_ms / 1000).toFixed(0)}s\n`
  );

  console.log("per-class:");
  for (const cls of EVAL_CLASSES) {
    const m = metrics.per_class[cls];
    const fmt = (v: number | null) => (v === null ? "  —" : (v * 100).toFixed(0).padStart(3) + "%");
    console.log(
      `  ${cls.padEnd(14)} precision ${fmt(m.precision)}  recall ${fmt(m.recall)}  f1 ${fmt(m.f1)}  n=${m.support}`
    );
  }

  console.log("\nconfusion matrix (rows = truth, cols = predicted):");
  const header = ["truth\\pred", ...EVAL_CLASSES].map((s) => s.padEnd(14)).join("");
  console.log("  " + header);
  for (const t of EVAL_CLASSES) {
    const row = EVAL_CLASSES.map((p) =>
      String(metrics.confusion_matrix[t][p]).padEnd(14)
    ).join("");
    console.log("  " + t.padEnd(14) + row);
  }

  if (metrics.false_negatives.length > 0) {
    console.log("\n⚠ FALSE NEGATIVES (fraud predicted as clean):");
    for (const fn of metrics.false_negatives) {
      console.log(
        `  ${fn.id} [${fn.truth}] "${fn.title}" — risk ${fn.risk_score}, ${fn.recommendation ?? "no deep review"}, conf ${fn.confidence}`
      );
    }
  } else {
    console.log("\n✓ No false negatives (no fraud predicted as clean).");
  }

  const mismatches = metrics.cases.filter(
    (c) => c.predicted !== "error" && c.predicted !== c.truth
  );
  if (mismatches.length) {
    console.log("\nall misclassifications:");
    for (const m of mismatches) {
      console.log(
        `  ${m.id}: ${m.truth} → ${m.predicted} (risk ${m.risk_score}, ${m.recommendation ?? "no deep review"}, conf ${m.confidence})`
      );
    }
  }
  const errors = metrics.cases.filter((c) => c.predicted === "error");
  if (errors.length) {
    console.log("\ncases that errored:");
    for (const e of errors) console.log(`  ${e.id}: ${e.error}`);
  }
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
