import { Badge } from "@/components/ui/badge";
import { FLAG_LABELS, STATUS_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";

export function RiskBadge({ score }: { score: number }) {
  const tone =
    score >= 70
      ? "bg-red-100 text-red-800 border-red-200"
      : score >= 40
        ? "bg-amber-100 text-amber-800 border-amber-200"
        : "bg-emerald-100 text-emerald-800 border-emerald-200";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold tabular-nums",
        tone
      )}
    >
      Risk {score}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800 border-amber-200",
    approved: "bg-emerald-100 text-emerald-800 border-emerald-200",
    rejected: "bg-red-100 text-red-800 border-red-200",
    escalated: "bg-violet-100 text-violet-800 border-violet-200",
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
    <Badge variant="secondary" className="text-[11px] font-medium">
      {FLAG_LABELS[flag] ?? flag}
    </Badge>
  );
}

export function RecommendationBadge({ rec }: { rec: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    approve: {
      label: "AI suggests: approve",
      cls: "bg-emerald-100 text-emerald-800 border-emerald-200",
    },
    flag_for_review: {
      label: "AI suggests: needs review",
      cls: "bg-amber-100 text-amber-800 border-amber-200",
    },
    escalate: {
      label: "AI suggests: escalate",
      cls: "bg-violet-100 text-violet-800 border-violet-200",
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
