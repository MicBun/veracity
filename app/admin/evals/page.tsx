import { getLatestCompleteRun, type EvalMetrics } from "@/lib/evals";
import { EvalDashboard } from "@/components/admin/eval-dashboard";

export const dynamic = "force-dynamic";

export default async function EvalsPage() {
  const run = await getLatestCompleteRun();

  return (
    <EvalDashboard
      cached={
        run && run.metrics
          ? {
              runId: run.id,
              startedAt: run.startedAt.toISOString(),
              metrics: run.metrics as EvalMetrics,
            }
          : null
      }
    />
  );
}
