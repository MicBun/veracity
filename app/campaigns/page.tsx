import Link from "next/link";
import { getApprovedCampaigns } from "@/lib/data";
import { SiteHeader } from "@/components/public/site-header";
import { RaisedProgress } from "@/components/public/raised-progress";
import { ZakatChip } from "@/components/public/brand";
import { CATEGORY_LABELS } from "@/lib/format";
import { Info } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Live campaigns — Amanah",
};

export default async function CampaignsPage() {
  const live = await getApprovedCampaigns();

  return (
    <div className="min-h-screen bg-paper text-stone-900 dark:text-stone-100">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 pb-20 pt-6">
        <div className="max-w-2xl">
          <h1 className="font-serif text-3xl font-medium tracking-tight sm:text-4xl">
            Live campaigns
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            Every campaign here passed Amanah&apos;s AI triage and was approved by
            a human reviewer. Support one directly.
          </p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
            <Info className="size-3.5 text-stone-400" />
            Demo — donations are simulated and no real payment is processed.
          </p>
        </div>

        {live.length === 0 ? (
          <p className="mt-10 rounded-xl border border-dashed border-stone-300 dark:border-stone-700 p-10 text-center text-sm text-stone-500 dark:text-stone-400">
            No live campaigns yet. Approved campaigns appear here.
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {live.map(({ campaign, raised, donorCount }) => (
              <Link
                key={campaign.id}
                href={`/campaigns/${campaign.id}`}
                className="flex flex-col rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-5 transition-all hover:-translate-y-0.5 hover:shadow-card"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                    {CATEGORY_LABELS[campaign.category] ?? campaign.category}
                  </span>
                  {campaign.zakatClaimed && <ZakatChip />}
                </div>
                <h2 className="mt-3 font-serif text-lg font-medium leading-snug">
                  {campaign.title}
                </h2>
                <p className="mt-1 line-clamp-2 text-sm text-stone-600 dark:text-stone-400">
                  {campaign.description}
                </p>
                <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">
                  by {campaign.organizerName}
                </p>
                <div className="mt-4 flex-1" />
                <RaisedProgress
                  raised={raised}
                  goal={campaign.goalAmount}
                  donorCount={donorCount}
                />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
