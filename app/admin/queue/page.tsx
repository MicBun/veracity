import Link from "next/link";
import { getPendingQueue, getTotalAiSpend, type QueueEntry } from "@/lib/data";
import {
  laneFor,
  riskScoreOf,
  confidenceOf,
  flagsOf,
  assessmentCostOf,
  type Lane,
} from "@/lib/assessments";
import { RiskBadge, FlagBadge } from "@/components/admin/badges";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatCost,
  formatPercent,
  formatUsd,
  CATEGORY_LABELS,
} from "@/lib/format";
import { Zap, Eye, AlertTriangle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const LANES: Array<{
  key: Lane;
  title: string;
  hint: string;
  icon: React.ReactNode;
  cls: string;
}> = [
  {
    key: "fast_track",
    title: "Fast-track",
    hint: "Low risk, confident screening — pre-filled approve suggestion, still needs one human click.",
    icon: <Zap className="size-4 text-emerald-600 dark:text-emerald-400" />,
    cls: "border-emerald-200/70 dark:border-emerald-800/60 bg-emerald-50/40 dark:bg-emerald-950/40",
  },
  {
    key: "needs_review",
    title: "Needs review",
    hint: "The AI found specific, evidence-backed concerns to weigh.",
    icon: <Eye className="size-4 text-amber-600 dark:text-amber-400" />,
    cls: "border-amber-200/70 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/40",
  },
  {
    key: "escalated",
    title: "Escalated",
    hint: "Severe signals or genuinely insufficient information — judgment required.",
    icon: <AlertTriangle className="size-4 text-violet-600 dark:text-violet-400" />,
    cls: "border-violet-200/70 dark:border-violet-800/60 bg-violet-50/40 dark:bg-violet-950/40",
  },
];

function QueueCard({ entry }: { entry: QueueEntry }) {
  const { campaign, bundle } = entry;
  const flags = flagsOf(bundle);
  return (
    <Link href={`/admin/campaign/${campaign.id}`} className="block">
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="space-y-2.5 px-4">
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-2 text-sm font-semibold leading-snug">
              {campaign.title}
            </p>
            <RiskBadge score={riskScoreOf(bundle)} />
          </div>
          <p className="text-xs text-muted-foreground">
            {CATEGORY_LABELS[campaign.category] ?? campaign.category} ·{" "}
            {formatUsd(campaign.goalAmount)} · {campaign.organizerName}
            {campaign.zakatClaimed && " · Zakat claimed"}
          </p>
          {flags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {flags.slice(0, 3).map((f) => (
                <FlagBadge key={f} flag={f} />
              ))}
              {flags.length > 3 && (
                <span className="text-[11px] text-muted-foreground">
                  +{flags.length - 3} more
                </span>
              )}
            </div>
          )}
          <p className="font-mono text-[11px] text-muted-foreground tabular-nums">
            Confidence {formatPercent(confidenceOf(bundle))} · assessment{" "}
            {formatCost(assessmentCostOf(bundle))}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

export default async function QueuePage() {
  const [entries, totalSpend] = await Promise.all([
    getPendingQueue(),
    getTotalAiSpend(),
  ]);

  const byLane: Record<Lane, QueueEntry[]> = {
    fast_track: [],
    needs_review: [],
    escalated: [],
  };
  for (const entry of entries) byLane[laneFor(entry.bundle)].push(entry);
  for (const lane of Object.values(byLane)) {
    lane.sort((a, b) => riskScoreOf(b.bundle) - riskScoreOf(a.bundle));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Triage queue</h1>
          <p className="text-sm text-muted-foreground">
            {entries.length} pending campaign{entries.length === 1 ? "" : "s"}.
            The AI recommends — only you can change a campaign&apos;s status.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Total AI spend this demo:{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {formatCost(totalSpend)}
          </span>
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {LANES.map((lane) => (
          <section
            key={lane.key}
            className={cn("space-y-3 rounded-xl border p-3", lane.cls)}
          >
            <div className="flex items-center gap-2">
              {lane.icon}
              <h2 className="text-sm font-semibold">{lane.title}</h2>
              <span className="rounded-full bg-foreground/10 px-2 py-0.5 text-xs font-semibold tabular-nums">
                {byLane[lane.key].length}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{lane.hint}</p>
            <div className="space-y-3">
              {byLane[lane.key].map((entry) => (
                <QueueCard key={entry.campaign.id} entry={entry} />
              ))}
              {byLane[lane.key].length === 0 && (
                <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                  <CheckCircle2 className="mx-auto mb-1 size-4 text-emerald-600 dark:text-emerald-400" />
                  All clear — nothing waiting.
                </p>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
