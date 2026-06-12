import { Progress } from "@/components/ui/progress";
import { formatUsd } from "@/lib/format";
import { CheckCircle2 } from "lucide-react";

/** Raised/goal bar shared by the gallery card and the detail page. */
export function RaisedProgress({
  raised,
  goal,
  donorCount,
}: {
  raised: number;
  goal: number;
  donorCount: number;
}) {
  const pct = goal > 0 ? (raised / goal) * 100 : 0;
  const funded = goal > 0 && raised >= goal;
  const donors = `${donorCount} ${donorCount === 1 ? "donor" : "donors"}`;
  return (
    <div className="space-y-2">
      <Progress value={Math.min(100, pct)} className="h-2" />
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
        <p className="font-semibold text-emerald-900 dark:text-emerald-200">
          {formatUsd(raised)}{" "}
          <span className="font-normal text-stone-500 dark:text-stone-400">
            raised of {formatUsd(goal)}
          </span>
        </p>
        {funded ? (
          <p className="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400">
            <CheckCircle2 className="size-3.5" /> Fully funded · {donors}
          </p>
        ) : (
          <p className="text-stone-500 dark:text-stone-400">
            {Math.min(100, Math.round(pct))}% funded · {donors}
          </p>
        )}
      </div>
    </div>
  );
}
