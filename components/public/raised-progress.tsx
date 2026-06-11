import { Progress } from "@/components/ui/progress";
import { formatUsd } from "@/lib/format";

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
  return (
    <div className="space-y-2">
      <Progress value={Math.min(100, pct)} className="h-2" />
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
        <p className="font-semibold text-emerald-900">
          {formatUsd(raised)}{" "}
          <span className="font-normal text-stone-500">
            raised of {formatUsd(goal)}
          </span>
        </p>
        <p className="text-stone-500">
          {Math.round(pct)}% funded · {donorCount}{" "}
          {donorCount === 1 ? "donor" : "donors"}
        </p>
      </div>
    </div>
  );
}
