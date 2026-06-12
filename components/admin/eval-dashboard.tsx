"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCost, formatDate, FLAG_LABELS } from "@/lib/format";
import type { EvalMetrics } from "@/lib/evals";
import { cn } from "@/lib/utils";
import { Play, Loader2, AlertTriangle, FlaskConical } from "lucide-react";

const CLASSES = ["clean", "subtle_fraud", "obvious_fraud", "ambiguous"] as const;

const CLASS_LABELS: Record<string, string> = {
  clean: "Clean",
  subtle_fraud: "Subtle fraud",
  obvious_fraud: "Obvious fraud",
  ambiguous: "Ambiguous",
};

const MAPPING_DOC = [
  "No deep review triggered (risk < 40 and confidence ≥ 0.7) → clean",
  "Deep review says approve → clean",
  "Deep review says flag_for_review (demonstrable deception) → subtle_fraud",
  "Deep review says escalate with screening risk ≥ 70 → obvious_fraud",
  "Deep review says escalate with screening risk < 70 (insufficient information, low confidence) → ambiguous",
];

type Props = {
  cached: {
    runId: string;
    startedAt: string;
    metrics: EvalMetrics;
  } | null;
};

function pct(v: number | null): string {
  return v === null ? "—" : `${Math.round(v * 100)}%`;
}

export function EvalDashboard({ cached }: Props) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runEvals() {
    setRunning(true);
    setError(null);
    setProgress({ done: 0, total: 30 });
    try {
      const res = await fetch("/api/admin/evals/run", { method: "POST" });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not start the eval run.");
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);
          if (event.type === "progress") {
            setProgress({ done: event.done, total: event.total });
          } else if (event.type === "complete") {
            router.refresh();
          } else if (event.type === "error") {
            setError(event.message);
          }
        }
      }
    } catch {
      setError("Connection lost during the run. Cached results are still shown.");
    } finally {
      setRunning(false);
      setProgress(null);
    }
  }

  const m = cached?.metrics ?? null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <FlaskConical className="size-5" /> Eval dashboard
            {cached && (
              <span className="rounded-full border px-2.5 py-0.5 text-xs font-normal text-muted-foreground">
                Last run {formatDate(cached.startedAt)}
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground">
            The full pipeline runs against 30 labeled campaigns (8 clean, 8
            subtle fraud, 7 obvious fraud, 7 ambiguous) that never appear in
            the live queue.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {running && progress && (
            <div className="w-44">
              <Progress value={(progress.done / progress.total) * 100} className="h-2" />
            </div>
          )}
          <Button onClick={runEvals} disabled={running}>
            {running ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Running
                {progress ? ` ${progress.done}/${progress.total}` : ""}…
              </>
            ) : (
              <>
                <Play className="size-4" /> Run evals
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-800/60 bg-red-50 dark:bg-red-950/40 p-3 text-sm text-red-900 dark:text-red-200">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      )}

      {!m ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No completed eval run yet. Hit &ldquo;Run evals&rdquo; to produce
            the first set of metrics (~2–3 minutes, costs a few cents).
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── Summary ── */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { label: "Accuracy", value: pct(m.accuracy) },
              {
                label: "Cases scored",
                value: `${m.scored_cases}/${m.total_cases}`,
              },
              { label: "Run cost", value: formatCost(m.total_cost_usd) },
              { label: "Prompt version", value: m.prompt_version },
              {
                label: "Duration",
                value: `${Math.round(m.duration_ms / 1000)}s`,
              },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="px-4">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="font-mono text-xl font-semibold tabular-nums">
                    {stat.value}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Re-running replaces these cached results on completion; failures
            keep them.
          </p>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* ── Per-class table ── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Per-class precision &amp; recall</CardTitle>
                <CardDescription>
                  Recall on the fraud classes is what keeps donors safe;
                  precision keeps reviewers from drowning in noise.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs font-semibold text-foreground">
                      <th className="pb-2">Class</th>
                      <th className="pb-2">Precision</th>
                      <th className="pb-2 text-emerald-800 dark:text-emerald-300">Recall</th>
                      <th className="pb-2">F1</th>
                      <th className="pb-2">n</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CLASSES.map((cls) => {
                      const row = m.per_class[cls];
                      const fraud =
                        cls === "subtle_fraud" || cls === "obvious_fraud";
                      return (
                        <tr key={cls} className="border-b last:border-0">
                          <td className="py-2 font-medium">{CLASS_LABELS[cls]}</td>
                          <td className="py-2 font-mono tabular-nums">
                            {pct(row.precision)}
                          </td>
                          <td
                            className={cn(
                              "py-2 font-mono tabular-nums",
                              fraud && "font-semibold text-emerald-900 dark:text-emerald-200"
                            )}
                          >
                            {pct(row.recall)}
                          </td>
                          <td className="py-2 font-mono tabular-nums">
                            {pct(row.f1)}
                          </td>
                          <td className="py-2 font-mono tabular-nums">
                            {row.support}
                            {row.errored > 0 && (
                              <span className="ml-1 text-xs text-red-600 dark:text-red-400">
                                ({row.errored} errored)
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            {/* ── Confusion matrix ── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Confusion matrix</CardTitle>
                <CardDescription>Rows are ground truth; columns are predictions.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-5 gap-1 text-center text-xs">
                  <div />
                  {CLASSES.map((p) => (
                    <div
                      key={p}
                      className="px-1 py-1 text-[10px] font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-400"
                    >
                      {CLASS_LABELS[p]}
                    </div>
                  ))}
                  {CLASSES.map((t) => (
                    <div key={t} className="contents">
                      <div className="flex items-center justify-end px-1 py-1 text-right text-[10px] font-semibold uppercase tracking-wide text-stone-600 dark:text-stone-400">
                        {CLASS_LABELS[t]}
                      </div>
                      {CLASSES.map((p) => {
                        const v = m.confusion_matrix[t][p];
                        const onDiagonal = t === p;
                        return (
                          <div
                            key={p}
                            className={cn(
                              "rounded-md py-2.5 font-mono tabular-nums",
                              v === 0 && "bg-muted/40 text-muted-foreground/40",
                              v > 0 &&
                                onDiagonal &&
                                "bg-emerald-100 dark:bg-emerald-900/40 font-bold text-emerald-900 dark:text-emerald-200",
                              v > 0 &&
                                !onDiagonal &&
                                "bg-amber-100 dark:bg-amber-900/40 font-semibold text-amber-900 dark:text-amber-200",
                              v > 0 &&
                                !onDiagonal &&
                                t !== "clean" &&
                                p === "clean" &&
                                "bg-red-100 dark:bg-red-900/40 font-bold text-red-900 dark:text-red-200 dark:ring-1 dark:ring-red-400/50"
                            )}
                          >
                            {v}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm bg-emerald-100 dark:bg-emerald-900/40 ring-1 ring-emerald-300 dark:ring-emerald-800/60" />
                    correct
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm bg-amber-100 dark:bg-amber-900/40 ring-1 ring-amber-300 dark:ring-amber-800/60" />
                    misclassified
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-sm bg-red-100 dark:bg-red-900/40 ring-1 ring-red-300 dark:ring-red-400/60" />
                    fraud predicted clean
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ── False negatives ── */}
          <Card className={cn(m.false_negatives.length > 0 && "border-red-200 dark:border-red-800/60")}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle
                  className={cn(
                    "size-4",
                    m.false_negatives.length > 0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"
                  )}
                />
                False negatives — fraud predicted as clean
              </CardTitle>
              <CardDescription>
                This is the dangerous failure mode for trust &amp; safety: a
                fraudulent campaign the AI would have fast-tracked. False
                positives waste reviewer time; false negatives reach donors.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {m.false_negatives.length === 0 ? (
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  None in this run — no fraud case was waved through as clean.
                </p>
              ) : (
                <ul className="space-y-3">
                  {m.false_negatives.map((fn) => (
                    <li key={fn.id} className="rounded-lg border border-red-200 dark:border-red-800/60 bg-red-50/50 dark:bg-red-950/40 p-3">
                      <p className="text-sm font-semibold">{fn.title}</p>
                      <p className="text-xs text-muted-foreground">
                        truth: {CLASS_LABELS[fn.truth]} ·{" "}
                        {fn.predicted === "error"
                          ? "pipeline error — not assessed"
                          : `screened risk ${fn.risk_score} · ${fn.recommendation ?? "no deep review"} · confidence ${fn.confidence}`}
                      </p>
                      <p className="mt-1 text-xs">
                        <span className="font-medium">Why it&apos;s labeled {CLASS_LABELS[fn.truth]}:</span>{" "}
                        {fn.rationale}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* ── Mapping + all cases ── */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">How pipeline output maps to classes</CardTitle>
                <CardDescription>
                  The pipeline emits risk scores and recommendations, not class
                  labels — this mapping converts them for scoring.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="list-disc space-y-1.5 pl-4 text-sm">
                  {MAPPING_DOC.map((rule, i) => (
                    <li key={i}>{rule}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">All misclassifications</CardTitle>
                <CardDescription>
                  Where the pipeline and the labels disagree (
                  {
                    m.cases.filter(
                      (c) => c.predicted !== "error" && c.predicted !== c.truth
                    ).length
                  }{" "}
                  of {m.scored_cases}).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="max-h-72 space-y-2 overflow-auto text-xs">
                  {m.cases
                    .filter((c) => c.predicted !== "error" && c.predicted !== c.truth)
                    .map((c) => (
                      <li key={c.id} className="rounded-md border p-2">
                        <span className="font-medium">{c.title}</span>
                        <br />
                        <span className="text-muted-foreground">
                          {CLASS_LABELS[c.truth]} → {CLASS_LABELS[c.predicted as string] ?? c.predicted}{" "}
                          (risk {c.risk_score}, {c.recommendation ?? "no deep review"}, conf{" "}
                          {c.confidence})
                        </span>
                      </li>
                    ))}
                  {m.cases.filter(
                    (c) => c.predicted !== "error" && c.predicted !== c.truth
                  ).length === 0 && (
                    <li className="text-muted-foreground">Perfect run — none.</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <p className="text-xs text-muted-foreground">
        Flags rubric: {Object.values(FLAG_LABELS).join(" · ")}
      </p>
    </div>
  );
}
