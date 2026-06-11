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
import { formatUsd, formatDate, CATEGORY_LABELS } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ShieldCheck, Clock, CheckCircle2, XCircle } from "lucide-react";

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
    cls: "bg-amber-50 border-amber-200 text-amber-900",
  },
  approved: {
    label: "Approved",
    description: "This campaign passed review and is live.",
    icon: <CheckCircle2 className="size-5" />,
    cls: "bg-emerald-50 border-emerald-200 text-emerald-900",
  },
  rejected: {
    label: "Not approved",
    description:
      "This campaign did not pass review. The organizer can contact support for details.",
    icon: <XCircle className="size-5" />,
    cls: "bg-red-50 border-red-200 text-red-900",
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
    <main className="min-h-screen bg-muted/30 px-4 py-10">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/" className="flex w-fit items-center gap-2 font-semibold">
          <ShieldCheck className="size-5 text-emerald-600" />
          Amanah
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
          <Link
            href={`/campaigns/${campaign.id}`}
            className="flex w-fit items-center gap-1 text-sm font-medium text-emerald-800 underline underline-offset-2 hover:text-emerald-900"
          >
            View your live campaign page →
          </Link>
        )}

        <Card>
          <CardHeader>
            <CardTitle>{campaign.title}</CardTitle>
            <CardDescription>
              {CATEGORY_LABELS[campaign.category] ?? campaign.category} · Goal{" "}
              {formatUsd(campaign.goalAmount)} · by {campaign.organizerName}
              {campaign.zakatClaimed && " · Zakat-eligible (claimed)"}
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
