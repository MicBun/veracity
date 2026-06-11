import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicApprovedCampaign } from "@/lib/data";
import { SiteHeader } from "@/components/public/site-header";
import { RaisedProgress } from "@/components/public/raised-progress";
import { DonateForm } from "@/components/public/donate-form";
import { CATEGORY_LABELS, formatUsd, formatRelativeTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await getPublicApprovedCampaign(id).catch(() => null);
  if (!data) notFound();
  const { campaign, raised, donorCount, recent } = data;

  return (
    <div className="min-h-screen bg-[#faf8f4] text-stone-900">
      <SiteHeader />
      <main className="mx-auto grid max-w-6xl gap-8 px-5 pb-20 pt-6 lg:grid-cols-[1.6fr_1fr]">
        <article>
          <Link
            href="/campaigns"
            className="text-sm text-stone-500 hover:text-stone-800"
          >
            ← All live campaigns
          </Link>
          <div className="mt-3 flex items-center gap-2">
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
              {CATEGORY_LABELS[campaign.category] ?? campaign.category}
            </span>
            {campaign.zakatClaimed && (
              <span className="rounded-md bg-stone-100 px-2 py-0.5 text-[11px] font-medium text-stone-600">
                Zakat-eligible (claimed)
              </span>
            )}
          </div>
          <h1 className="mt-3 font-serif text-3xl font-medium leading-tight tracking-tight">
            {campaign.title}
          </h1>
          <p className="mt-2 text-sm text-stone-500">
            by {campaign.organizerName}
          </p>
          <p className="mt-6 whitespace-pre-wrap text-[15px] leading-relaxed text-stone-700">
            {campaign.description}
          </p>
        </article>

        <aside className="space-y-5">
          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <RaisedProgress
              raised={raised}
              goal={campaign.goalAmount}
              donorCount={donorCount}
            />
            <div className="mt-5">
              <DonateForm campaignId={campaign.id} />
            </div>
            <p className="mt-3 text-center text-[11px] text-stone-400">
              Demo — no real payment is processed.
            </p>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
              Recent supporters
            </p>
            {recent.length === 0 ? (
              <p className="mt-3 text-sm text-stone-500">
                Be the first to support this campaign.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {recent.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-baseline justify-between gap-3 text-sm"
                  >
                    <span className="min-w-0 truncate font-medium text-stone-700">
                      {d.donorName ?? "Anonymous"}
                    </span>
                    <span className="shrink-0 text-stone-500">
                      {formatUsd(d.amount)} · {formatRelativeTime(d.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
