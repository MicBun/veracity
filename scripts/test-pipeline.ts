/**
 * CLI smoke test for the two-stage AI pipeline. Runs three seed campaigns
 * (one clean, one subtle fraud, one obvious fraud) through live API calls
 * WITHOUT touching the database, and prints outputs, latencies, and cost.
 *
 * Usage: npx tsx scripts/test-pipeline.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });

import { readFileSync } from "node:fs";
import path from "node:path";

async function main() {
  const { assessCampaign } = await import("../lib/ai/pipeline");

  const file = path.join(process.cwd(), "data", "seed-campaigns.json");
  const data = JSON.parse(readFileSync(file, "utf8"));
  const picks = ["seed-01", "seed-05", "seed-07"];
  let totalCost = 0;

  for (const key of picks) {
    const c = data.campaigns.find((x: { key: string }) => x.key === key);
    console.log(`\n=== ${key} (${c.class}): ${c.title} ===`);
    const result = await assessCampaign(
      {
        title: c.title,
        description: c.description,
        goal_amount: c.goal_amount,
        category: c.category,
        organizer_name: c.organizer_name,
        organizer_history: c.organizer_history,
      },
      (e) => console.log(`  [${e.stage}] ${e.status}`)
    );

    const s = result.screening;
    console.log(
      `  screening: risk=${s.output.risk_score} conf=${s.output.confidence} flags=[${s.output.category_flags.join(",")}]`
    );
    console.log(`    summary: ${s.output.summary}`);
    console.log(
      `    tokens=${s.inputTokens}/${s.outputTokens} cost=$${s.costUsd.toFixed(6)} latency=${s.latencyMs}ms`
    );
    totalCost += s.costUsd;

    if (result.deepReview) {
      const d = result.deepReview;
      console.log(
        `  deep_review: rec=${d.output.recommendation} conf=${d.output.confidence}`
      );
      for (const ev of d.output.evidence) {
        console.log(`    evidence [${ev.source_field}]: "${ev.quote.slice(0, 70)}"`);
      }
      console.log(`    reasoning: ${d.output.reasoning.slice(0, 220)}`);
      console.log(
        `    tokens=${d.inputTokens}/${d.outputTokens} cost=$${d.costUsd.toFixed(6)} latency=${d.latencyMs}ms`
      );
      totalCost += d.costUsd;
    }
  }

  console.log(`\nTotal cost for this test: $${totalCost.toFixed(6)}`);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(err);
    process.exit(1);
  }
);
