import Link from "next/link";
import { getDecidedCampaigns, type HistoryEntry } from "@/lib/data";
import { StatusBadge } from "@/components/admin/badges";
import { formatDate, formatUsd, CATEGORY_LABELS, ACTION_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Filter = "all" | "approved" | "rejected" | "escalated";

const TABS: Array<{ key: Filter; label: string }> = [
  { key: "all", label: "All" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "escalated", label: "Escalated" },
];

function HistoryRow({ entry }: { entry: HistoryEntry }) {
  const { campaign, review } = entry;
  return (
    <Link
      href={`/admin/campaign/${campaign.id}`}
      className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 transition-colors hover:bg-muted/50"
    >
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="min-w-0 truncate text-sm font-semibold">{campaign.title}</p>
          <span className="shrink-0">
            <StatusBadge status={campaign.status} />
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {CATEGORY_LABELS[campaign.category] ?? campaign.category} ·{" "}
          {formatUsd(campaign.goalAmount)} · {campaign.organizerName}
        </p>
      </div>
      <div className="shrink-0 text-right text-xs text-muted-foreground">
        {review ? (
          <>
            <p>
              <span className="font-medium text-foreground">
                {ACTION_LABELS[review.action] ?? review.action}
              </span>{" "}
              by {review.reviewerName}
            </p>
            <p className="tabular-nums">{formatDate(review.createdAt)}</p>
          </>
        ) : (
          <p>No review on record</p>
        )}
      </div>
    </Link>
  );
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const entries = await getDecidedCampaigns();

  const active: Filter = TABS.some((t) => t.key === status)
    ? (status as Filter)
    : "all";

  const counts: Record<Filter, number> = {
    all: entries.length,
    approved: entries.filter((e) => e.campaign.status === "approved").length,
    rejected: entries.filter((e) => e.campaign.status === "rejected").length,
    escalated: entries.filter((e) => e.campaign.status === "escalated").length,
  };

  const visible =
    active === "all"
      ? entries
      : entries.filter((e) => e.campaign.status === active);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Decision history</h1>
        <p className="text-sm text-muted-foreground">
          Every campaign that has left the queue. Decisions are final — this is the
          immutable record of who decided what, and what the AI was recommending at
          the time. Open any row to see its full audit log.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 border-b">
        {TABS.map((t) => {
          const isActive = active === t.key;
          return (
            <Link
              key={t.key}
              href={t.key === "all" ? "/admin/history" : `/admin/history?status=${t.key}`}
              className={cn(
                "-mb-px flex items-center gap-2 border-b-2 px-3 py-2 text-sm",
                isActive
                  ? "border-foreground font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs tabular-nums">
                {counts[t.key]}
              </span>
            </Link>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No {active === "all" ? "decided" : active} campaigns yet.
        </p>
      ) : (
        <div className="divide-y rounded-lg border bg-background">
          {visible.map((entry) => (
            <HistoryRow key={entry.campaign.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
