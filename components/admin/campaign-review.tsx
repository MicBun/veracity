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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  RiskBadge,
  StatusBadge,
  FlagBadge,
  RecommendationBadge,
} from "@/components/admin/badges";
import {
  formatUsd,
  formatCost,
  formatDate,
  formatPercent,
  CATEGORY_LABELS,
} from "@/lib/format";
import type { ScreeningOutput, DeepReviewOutput } from "@/lib/ai/schemas";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Check,
  X,
  ArrowUpRight,
  Quote,
  ShieldAlert,
  ShieldCheck,
  History,
  Loader2,
} from "lucide-react";

const ACTION_DONE: Record<string, string> = {
  approve: "approved",
  reject: "rejected",
  escalate: "escalated",
};

type StageMeta = {
  model: string;
  promptVersion: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs: number;
  createdAt: string;
};

type Props = {
  campaign: {
    id: string;
    title: string;
    description: string;
    goalAmount: number;
    category: string;
    organizerName: string;
    organizerHistory: {
      prior_campaigns: number;
      account_age_days: number;
      prior_flags: number;
    };
    status: string;
    source: string;
    createdAt: string;
  };
  screening: ({ output: ScreeningOutput } & StageMeta) | null;
  deepReview: ({ output: DeepReviewOutput } & StageMeta) | null;
  auditLog: Array<{
    id: string;
    reviewerName: string;
    action: string;
    note: string | null;
    createdAt: string;
    snapshot: Record<string, unknown> | null;
  }>;
};

type Highlight = { field: string; quote: string } | null;

function fieldAnchor(field: string): string {
  return `field-${field.replace(/\./g, "-")}`;
}

/** Renders text with the quoted span highlighted, if it matches. */
function HighlightedText({
  text,
  quote,
}: {
  text: string;
  quote: string | null;
}) {
  if (!quote) return <>{text}</>;
  const idx = text.indexOf(quote);
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded bg-amber-200 dark:bg-amber-900/60 px-0.5 py-0.5 text-foreground">
        {text.slice(idx, idx + quote.length)}
      </mark>
      {text.slice(idx + quote.length)}
    </>
  );
}

function FieldRow({
  field,
  label,
  value,
  highlighted,
}: {
  field: string;
  label: string;
  value: React.ReactNode;
  highlighted: boolean;
}) {
  return (
    <div
      id={fieldAnchor(field)}
      className={cn(
        "rounded-md px-2 py-1.5 transition-colors",
        highlighted && "bg-amber-100 dark:bg-amber-900/40 ring-2 ring-amber-300 dark:ring-amber-800/60"
      )}
    >
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="text-sm">{value}</div>
    </div>
  );
}

function StageFooter({ meta }: { meta: StageMeta }) {
  return (
    <p className="font-mono text-[11px] text-muted-foreground">
      {meta.model} · prompt {meta.promptVersion} · {meta.inputTokens}/
      {meta.outputTokens} tokens · {formatCost(meta.costUsd)} ·{" "}
      {(meta.latencyMs / 1000).toFixed(1)}s
    </p>
  );
}

function ConfidenceMeter({ value }: { value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Confidence</span>
        <span className="font-mono font-medium tabular-nums">
          {formatPercent(value)}
        </span>
      </div>
      <Progress value={value * 100} className="h-1.5" />
      {value < 0.6 && (
        <p className="text-[11px] text-violet-700 dark:text-violet-400">
          <ShieldAlert className="mr-1 inline size-3" />
          Low confidence — the AI is telling you it doesn&apos;t have enough
          information. Your judgment matters most here.
        </p>
      )}
    </div>
  );
}

export function CampaignReview({
  campaign,
  screening,
  deepReview,
  auditLog,
}: Props) {
  const router = useRouter();
  const [highlight, setHighlight] = useState<Highlight>(null);
  const [note, setNote] = useState("");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isPending = campaign.status === "pending";
  const fastTrack =
    isPending && !deepReview && (screening?.output.risk_score ?? 100) < 40;

  function citeEvidence(field: string, quote: string) {
    setHighlight({ field, quote });
    document
      .getElementById(fieldAnchor(field))
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  async function act(action: "approve" | "reject" | "escalate") {
    setPendingAction(action);
    setError(null);
    try {
      const res = await fetch(`/api/admin/campaigns/${campaign.id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: note || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Action failed");
        return;
      }
      toast.success(`Decision recorded — campaign ${ACTION_DONE[action]}.`);
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setPendingAction(null);
    }
  }

  const descQuote =
    highlight?.field === "description" ? highlight.quote : null;
  const titleQuote = highlight?.field === "title" ? highlight.quote : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold leading-snug">
            <HighlightedText text={campaign.title} quote={titleQuote} />
          </h1>
          <StatusBadge status={campaign.status} />
        </div>
        {screening && <RiskBadge score={screening.output.risk_score} />}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── Campaign content ── */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Campaign</CardTitle>
            <CardDescription>
              Submitted {formatDate(campaign.createdAt)} ·{" "}
              {campaign.source === "seed" ? "Seeded demo campaign" : "User submitted"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <FieldRow
              field="description"
              label="Description"
              highlighted={highlight?.field === "description"}
              value={
                <p className="whitespace-pre-wrap leading-relaxed">
                  <HighlightedText text={campaign.description} quote={descQuote} />
                </p>
              }
            />
            <div className="grid grid-cols-2 gap-1">
              <FieldRow
                field="goal_amount"
                label="Goal"
                highlighted={highlight?.field === "goal_amount"}
                value={<span className="font-semibold">{formatUsd(campaign.goalAmount)}</span>}
              />
              <FieldRow
                field="category"
                label="Category"
                highlighted={highlight?.field === "category"}
                value={CATEGORY_LABELS[campaign.category] ?? campaign.category}
              />
              <FieldRow
                field="organizer_name"
                label="Organizer"
                highlighted={highlight?.field === "organizer_name"}
                value={campaign.organizerName}
              />
              <FieldRow
                field="organizer_history.prior_campaigns"
                label="Prior campaigns"
                highlighted={highlight?.field === "organizer_history.prior_campaigns"}
                value={campaign.organizerHistory.prior_campaigns}
              />
              <FieldRow
                field="organizer_history.account_age_days"
                label="Account age"
                highlighted={highlight?.field === "organizer_history.account_age_days"}
                value={`${campaign.organizerHistory.account_age_days} days`}
              />
              <FieldRow
                field="organizer_history.prior_flags"
                label="Prior flags"
                highlighted={highlight?.field === "organizer_history.prior_flags"}
                value={campaign.organizerHistory.prior_flags}
              />
            </div>
          </CardContent>
        </Card>

        {/* ── AI assessment ── */}
        <div className="space-y-4">
          {screening ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Stage 1 · Screening</CardTitle>
                  <RiskBadge score={screening.output.risk_score} />
                </div>
                <CardDescription>{screening.output.summary}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {screening.output.category_flags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {screening.output.category_flags.map((f) => (
                      <FlagBadge key={f} flag={f} />
                    ))}
                  </div>
                )}
                <ConfidenceMeter value={screening.output.confidence} />
                <StageFooter meta={screening} />
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground">
                No AI assessment recorded for this campaign.
              </CardContent>
            </Card>
          )}

          {deepReview && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Stage 2 · Deep review</CardTitle>
                  <RecommendationBadge rec={deepReview.output.recommendation} />
                </div>
                <CardDescription>
                  Triggered because screening risk ≥ 40 or confidence &lt; 0.7.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg border border-amber-200/70 dark:border-amber-800/60 bg-amber-50/40 dark:bg-amber-950/40 p-3">
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-amber-900 dark:text-amber-200">
                    Evidence — click to highlight the cited field
                  </p>
                  <ul className="space-y-1.5">
                    {deepReview.output.evidence.map((ev, i) => (
                      <li key={i}>
                        <button
                          type="button"
                          onClick={() => citeEvidence(ev.source_field, ev.quote)}
                          className={cn(
                            "w-full rounded-md border bg-white dark:bg-stone-900 p-2 text-left text-xs transition-colors hover:bg-amber-50 dark:hover:bg-amber-950/40",
                            highlight?.field === ev.source_field &&
                              highlight?.quote === ev.quote &&
                              "border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40"
                          )}
                        >
                          <span className="font-semibold">{ev.claim}</span>
                          <span className="mt-1 flex items-start gap-1 text-muted-foreground">
                            <Quote className="mt-0.5 size-3.5 shrink-0 text-amber-700 dark:text-amber-400" />
                            <span>
                              &ldquo;{ev.quote}&rdquo;{" "}
                              <span className="font-mono text-[10px]">
                                ({ev.source_field})
                              </span>
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-red-200 dark:border-red-800/60 bg-red-50/50 dark:bg-red-950/40 p-3">
                    <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-red-700 dark:text-red-300">
                      <ShieldAlert className="size-3.5" /> Risk factors
                    </p>
                    <ul className="list-disc space-y-1 pl-4 text-xs">
                      {deepReview.output.risk_factors.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/40 p-3">
                    <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                      <ShieldCheck className="size-3.5" /> Mitigating factors
                    </p>
                    <ul className="list-disc space-y-1 pl-4 text-xs">
                      {deepReview.output.mitigating_factors.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <ConfidenceMeter value={deepReview.output.confidence} />

                <div className="rounded-md bg-muted/60 p-3 text-xs leading-relaxed">
                  <p className="mb-1 font-semibold uppercase tracking-wide text-muted-foreground">
                    Reasoning
                  </p>
                  {deepReview.output.reasoning}
                </div>

                <StageFooter meta={deepReview} />
              </CardContent>
            </Card>
          )}

          {/* ── Reviewer decision ── */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your decision</CardTitle>
              <CardDescription>
                {isPending
                  ? fastTrack
                    ? "Fast-track: the AI suggests approval, but the decision is yours."
                    : "The AI has made its recommendation. The decision is yours."
                  : "A decision has been recorded. Status changes are final in this demo."}
              </CardDescription>
            </CardHeader>
            {isPending && (
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="note" className="text-xs">
                    Note (optional, recorded in the audit log)
                  </Label>
                  <Textarea
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    maxLength={1000}
                    placeholder="Why are you making this call?"
                    className="min-h-16 text-sm"
                  />
                </div>
                {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => act("approve")}
                    disabled={pendingAction !== null}
                    variant={fastTrack ? "default" : "outline"}
                  >
                    {pendingAction === "approve" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Check className="size-4" />
                    )}
                    {pendingAction === "approve" ? "Approving…" : "Approve"}
                  </Button>
                  <Button
                    onClick={() => act("reject")}
                    disabled={pendingAction !== null}
                    variant="outline"
                    className="border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-800 dark:hover:text-red-200"
                  >
                    {pendingAction === "reject" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <X className="size-4" />
                    )}
                    {pendingAction === "reject" ? "Rejecting…" : "Reject"}
                  </Button>
                  <Button
                    onClick={() => act("escalate")}
                    disabled={pendingAction !== null}
                    variant="outline"
                    className="border-violet-200 dark:border-violet-800/60 text-violet-700 dark:text-violet-300 hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:text-violet-800 dark:hover:text-violet-200"
                  >
                    {pendingAction === "escalate" ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <ArrowUpRight className="size-4" />
                    )}
                    {pendingAction === "escalate" ? "Escalating…" : "Escalate"}
                  </Button>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      {/* ── Audit log ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="size-4" /> Audit log
          </CardTitle>
          <CardDescription>
            Every status change is recorded with the reviewer&apos;s name and a
            snapshot of the AI recommendation at decision time. Rows are
            immutable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditLog.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No reviewer actions yet.
            </p>
          ) : (
            <ul className="space-y-4">
              {auditLog.map((entry) => {
                const snap = entry.snapshot as {
                  screening?: { output?: { risk_score?: number } };
                  deep_review?: {
                    output?: { recommendation?: string; reasoning?: string };
                  };
                } | null;
                return (
                  <li key={entry.id} className="flex gap-3">
                    <div className="mt-1 size-2 shrink-0 rounded-full bg-foreground/70" />
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm">
                        <span className="font-semibold">{entry.reviewerName}</span>{" "}
                        chose to{" "}
                        <span className="font-semibold">{entry.action}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          · {formatDate(entry.createdAt)}
                        </span>
                      </p>
                      {entry.note && (
                        <p className="text-sm text-muted-foreground">
                          “{entry.note}”
                        </p>
                      )}
                      {snap && (
                        <details className="text-xs text-muted-foreground">
                          <summary className="cursor-pointer select-none">
                            AI recommendation at decision time
                            {snap.screening?.output?.risk_score !== undefined &&
                              ` — risk ${snap.screening.output.risk_score}`}
                            {snap.deep_review?.output?.recommendation &&
                              `, ${snap.deep_review.output.recommendation}`}
                          </summary>
                          <div className="mt-2 space-y-1 rounded-md bg-muted p-3">
                            {snap.screening?.output?.risk_score !== undefined && (
                              <p>
                                Screening risk score:{" "}
                                <span className="font-mono font-semibold text-foreground">
                                  {snap.screening.output.risk_score}/100
                                </span>
                              </p>
                            )}
                            {snap.deep_review?.output?.recommendation && (
                              <p>
                                Deep-review recommendation:{" "}
                                <span className="font-semibold text-foreground">
                                  {snap.deep_review.output.recommendation}
                                </span>
                              </p>
                            )}
                            {snap.deep_review?.output?.reasoning && (
                              <p>“{snap.deep_review.output.reasoning}”</p>
                            )}
                            <details className="pt-1">
                              <summary className="cursor-pointer select-none">
                                Raw snapshot
                              </summary>
                              <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-background p-3 text-[11px]">
                                {JSON.stringify(snap, null, 2)}
                              </pre>
                            </details>
                          </div>
                        </details>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
