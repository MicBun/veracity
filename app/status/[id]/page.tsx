import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicCampaign } from "@/lib/data";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatUsd, formatDate, CATEGORY_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * PUBLIC page. By design it renders campaign content and a coarse status
 * only — no risk scores, no flags, no AI output. Assessments are served
 * exclusively to authenticated /admin routes; surfacing them here would
 * teach bad actors how to evade detection. "Escalated" is internal state
 * and is shown publicly as still under review.
 */
const PUBLIC_STATUS: Record<
  string,
  { label: string; description: string; icon: React.ReactNode; cls: string }
> = {
  pending: {
    label: "Under review",
    description:
      "This campaign is being reviewed by our trust & safety team. Decisions are made by human reviewers.",
    icon: <Clock className="size-5" />,
    cls: "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200",
  },
  approved: {
    label: "Approved",
    description: "This campaign passed review and is live.",
    icon: <CheckCircle2 className="size-5" />,
    cls: "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60 text-emerald-900 dark:text-emerald-200",
  },
  rejected: {
    label: "Not approved",
    description:
      "This campaign did not pass review. The organizer can contact support for details.",
    icon: <XCircle className="size-5" />,
    cls: "bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800/60 text-red-900 dark:text-red-200",
  },
};

export default async function StatusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const campaign = await getPublicCampaign(id).catch(() => null);
  if (!campaign) notFound();

  // Map internal state to the public vocabulary before anything renders.
  const publicKey = campaign.status === "escalated" ? "pending" : campaign.status;
  const status = PUBLIC_STATUS[publicKey] ?? PUBLIC_STATUS.pending;

  return (
    <main className="min-h-screen bg-paper px-4 py-10 text-stone-900 dark:text-stone-100">
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/" className="flex w-fit items-center gap-2">
          <ShieldCheck className="size-5 text-emerald-700 dark:text-emerald-400" />
          <span className="font-serif text-xl font-semibold tracking-tight">
            Veracity
          </span>
        </Link>

        <div
          className={cn(
            "flex items-start gap-3 rounded-lg border p-4",
            status.cls
          )}
        >
          {status.icon}
          <div>
            <p className="font-semibold">{status.label}</p>
            <p className="text-sm opacity-90">{status.description}</p>
          </div>
        </div>

        {campaign.status === "approved" && (
          <Button asChild>
            <Link href={`/campaigns/${campaign.id}`}>
              View your live campaign page <ArrowRight className="size-4" />
            </Link>
          </Button>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{campaign.title}</CardTitle>
            <CardDescription>
              {CATEGORY_LABELS[campaign.category] ?? campaign.category} · Goal{" "}
              {formatUsd(campaign.goalAmount)} · by {campaign.organizerName}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {campaign.description}
            </p>
            <p className="text-xs text-muted-foreground">
              Submitted {formatDate(campaign.createdAt)}
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/submit" className="underline underline-offset-2">
            Submit another campaign
          </Link>
        </p>
      </div>
    </main>
  );
}
