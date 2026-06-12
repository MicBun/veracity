import { FLAG_LABELS, STATUS_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";

export function RiskBadge({ score }: { score: number }) {
  const tone =
    score >= 70
      ? "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800/60"
      : score >= 40
        ? "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800/60"
        : "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800/60";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-xs font-semibold tabular-nums",
        tone
      )}
    >
      Risk {score}
      <span className="opacity-60">/100</span>
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800/60",
    approved: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800/60",
    rejected: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-800/60",
    escalated: "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-800/60",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold",
        tone[status] ?? "bg-muted text-muted-foreground"
      )}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export function FlagBadge({ flag }: { flag: string }) {
  return (
    <span className="inline-flex items-center rounded-md border border-amber-200/70 bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200">
      {FLAG_LABELS[flag] ?? flag}
    </span>
  );
}

export function RecommendationBadge({ rec }: { rec: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    approve: {
      label: "AI suggests: approve",
      cls: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800/60",
    },
    flag_for_review: {
      label: "AI suggests: needs review",
      cls: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-800/60",
    },
    escalate: {
      label: "AI suggests: escalate",
      cls: "bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-900/40 dark:text-violet-300 dark:border-violet-800/60",
    },
  };
  const m = map[rec] ?? { label: rec, cls: "bg-muted" };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold",
        m.cls
      )}
    >
      {m.label}
    </span>
  );
}
