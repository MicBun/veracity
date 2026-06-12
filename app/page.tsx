import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ShieldCheck,
  ArrowRight,
  ScanSearch,
  FileSearch,
  UserCheck,
  Quote,
} from "lucide-react";
import { getSession } from "@/lib/session-cookies";
import { LatticeBg } from "@/components/public/brand";
import { ThemeToggle } from "@/components/theme-toggle";

function MockQueueCard() {
  return (
    <div className="space-y-4">
      <div className="rotate-1 rounded-xl border border-emerald-900/15 dark:border-emerald-800/60 bg-white dark:bg-stone-900 p-4 shadow-[0_18px_50px_-22px_rgba(12,46,36,0.35)]">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm font-semibold">
            URGENT: my family will be on the street in 48 hours
          </p>
          <span className="shrink-0 rounded-md border border-red-200 dark:border-red-800/60 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 text-xs font-semibold text-red-800 dark:text-red-300">
            Risk 91
          </span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1">
          {["Urgency manipulation", "Unverifiable claims", "Financial anomaly"].map(
            (f) => (
              <span
                key={f}
                className="rounded-md bg-stone-100 dark:bg-stone-800 px-1.5 py-0.5 text-[11px] font-medium text-stone-700 dark:text-stone-300"
              >
                {f}
              </span>
            )
          )}
        </div>
        <p className="mt-3 border-l-2 border-emerald-700/60 dark:border-emerald-500 pl-2 text-xs italic text-stone-600 dark:text-stone-400">
          &ldquo;The bank has given us 48 hours before they change the
          locks&rdquo; — cited from the campaign text
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="rounded-md border border-violet-200 dark:border-violet-800/60 bg-violet-100 dark:bg-violet-900/40 px-2 py-0.5 text-[11px] font-semibold text-violet-800 dark:text-violet-300">
            AI suggests: escalate
          </span>
          <span className="text-[11px] text-stone-500 dark:text-stone-400">confidence 0.28 — low</span>
        </div>
      </div>

      <div className="-rotate-1 rounded-xl border border-emerald-900/15 dark:border-emerald-800/60 bg-white dark:bg-stone-900 p-4 shadow-[0_18px_50px_-22px_rgba(12,46,36,0.3)]">
        <p className="text-xs font-medium uppercase tracking-wide text-stone-500 dark:text-stone-400">
          The decision stays human
        </p>
        <div className="mt-2.5 flex gap-2">
          <span className="rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white">
            Approve
          </span>
          <span className="rounded-md border px-3 py-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400">
            Reject
          </span>
          <span className="rounded-md border px-3 py-1.5 text-xs font-semibold text-stone-600 dark:text-stone-400">
            Escalate
          </span>
        </div>
        <p className="mt-2.5 text-[11px] text-stone-500 dark:text-stone-400">
          Recorded to an immutable audit log with the AI&apos;s reasoning at
          decision time.
        </p>
      </div>
    </div>
  );
}

export default async function LandingPage() {
  const session = await getSession();
  return (
    <div className="min-h-screen bg-paper text-stone-900 dark:text-stone-100">
      {/* ── Nav ── */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-emerald-700 dark:text-emerald-400" />
          <span className="font-serif text-xl font-semibold tracking-tight">
            Amanah
          </span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-5">
          <Link
            href="/campaigns"
            className="hidden text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 sm:block"
          >
            Browse campaigns
          </Link>
          <Link
            href="/about"
            className="hidden text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 sm:block"
          >
            How it works
          </Link>
          {session ? (
            <Link
              href="/admin/queue"
              className="text-sm font-medium text-emerald-800 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-200"
            >
              Reviewer console
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-sm text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100"
            >
              Reviewer sign-in
            </Link>
          )}
          <ThemeToggle />
          <Button asChild size="sm">
            <Link href="/submit">Submit a campaign</Link>
          </Button>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden">
        <LatticeBg />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-14 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="rise rise-1 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800 dark:text-emerald-300">
              Trust &amp; safety for donation crowdfunding
            </p>
            <h1 className="rise rise-2 mt-4 font-serif text-4xl font-medium leading-[1.12] tracking-tight sm:text-5xl">
              AI reads every campaign.
              <br />
              <em className="text-emerald-800 dark:text-emerald-300">People</em> make every call.
            </h1>
            <p className="rise rise-3 mt-5 max-w-xl text-base leading-relaxed text-stone-600 dark:text-stone-400">
              Amanah (أمانة — &ldquo;trust&rdquo;) triages incoming campaigns for
              fraud signals, policy violations, and zakat-eligibility claims. It
              scores risk, quotes its evidence, and admits what it can&apos;t
              verify — then hands the decision to a human reviewer. Every time.
            </p>
            <div className="rise rise-4 mt-7 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="shadow-lg shadow-emerald-900/15">
                <Link href="/submit">
                  Submit a campaign <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-stone-300 dark:border-stone-700 bg-white/60 dark:bg-stone-900/60">
                <Link href="/login">Open the reviewer console</Link>
              </Button>
              <Button asChild size="lg" variant="ghost">
                <Link href="/campaigns">Browse live campaigns</Link>
              </Button>
            </div>
            <p className="rise rise-5 mt-4 text-xs text-stone-500 dark:text-stone-400">
              Live demo — real AI pipeline, fictional campaigns, demo sign-in
              shown on the login page.
            </p>
          </div>
          <div className="rise rise-4 relative">
            <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
              Reviewer console preview
            </p>
            <MockQueueCard />
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-y border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900">
        <div className="mx-auto max-w-6xl px-5 py-16">
          <h2 className="font-serif text-3xl font-medium tracking-tight">
            Two stages of machine scrutiny.
            <br className="hidden sm:block" /> One human decision.
          </h2>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: <ScanSearch className="size-5" />,
                step: "Stage 1 · every campaign",
                title: "Screening",
                body: "A fast model scores fraud risk 0–100 against a seven-category rubric — urgency manipulation, story inconsistency, financial anomalies, zakat-eligibility doubt, and more — and reports how confident it is.",
              },
              {
                icon: <FileSearch className="size-5" />,
                step: "Stage 2 · when warranted",
                title: "Deep review",
                body: "Risky or uncertain campaigns get a second pass with the organizer's history. Every concern must quote the exact campaign text or data field that triggered it — no vibes, only evidence.",
              },
              {
                icon: <UserCheck className="size-5" />,
                step: "Always",
                title: "Human decision",
                body: "Reviewers approve, reject, or escalate from a triage queue sorted by risk. The AI cannot change a campaign's status — there is no code path for it. Every action lands in an immutable audit log.",
              },
            ].map((card) => (
              <div key={card.title} className="rounded-xl border border-stone-200 dark:border-stone-700 p-6">
                <div className="flex size-10 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300">
                  {card.icon}
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-stone-500 dark:text-stone-400">
                  {card.step}
                </p>
                <h3 className="mt-1 font-serif text-xl font-medium">{card.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-stone-600 dark:text-stone-400">{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── The boundary ── */}
      <section className="mx-auto max-w-6xl px-5 py-16">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="font-serif text-3xl font-medium tracking-tight">
              The line is drawn in code,
              <br /> not in the UI.
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-stone-600 dark:text-stone-400">
              Status transitions exist only behind reviewer-authenticated
              endpoints. AI assessments are served exclusively to the reviewer
              console — the public status page never carries a risk score, a
              flag, or a recommendation, because teaching submitters what the
              model looks for would teach bad actors how to evade it.
            </p>
            <div className="mt-6 rounded-xl border border-emerald-900/15 bg-emerald-900 p-5 text-emerald-50">
              <div className="flex items-start gap-3">
                <Quote className="mt-1 size-4 shrink-0 opacity-80" />
                <div>
                  <p className="font-serif text-lg italic leading-relaxed">
                    &ldquo;Insufficient information to distinguish an urgent
                    legitimate need from fabricated urgency… this is exactly the
                    kind of case a human should decide.&rdquo;
                  </p>
                  <p className="mt-2 text-xs text-emerald-200/80">
                    — an actual deep-review output from the demo queue.
                    Calibrated uncertainty is a feature, not a failure.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/40 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                The AI owns
              </p>
              <ul className="mt-3 space-y-2 text-sm text-stone-700 dark:text-stone-300">
                <li>Reading every submission, instantly</li>
                <li>Scoring risk against a fixed rubric</li>
                <li>Quoting evidence for every flag</li>
                <li>Saying &ldquo;I&apos;m not sure&rdquo; out loud</li>
                <li>Ordering the queue so people look at the right things first</li>
              </ul>
            </div>
            <div className="rounded-xl border border-stone-800 dark:border-stone-700 bg-stone-900 dark:bg-stone-800 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-200 dark:text-stone-100">
                Humans own
              </p>
              <ul className="mt-3 space-y-2 text-sm text-stone-300">
                <li>Every approve, reject, and escalate</li>
                <li>Judgment on genuinely ambiguous cases</li>
                <li>Zakat-eligibility calls that need documentation</li>
                <li>Accountability — names in the audit log</li>
                <li>The rubric itself</li>
              </ul>
            </div>
            <div className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-5 sm:col-span-2">
              <div className="grid grid-cols-2 gap-4 text-center sm:grid-cols-4">
                {[
                  ["100%", "decisions made by humans"],
                  ["2 stages", "of AI scrutiny"],
                  ["30 cases", "labeled eval set"],
                  ["7", "risk categories"],
                ].map(([v, l]) => (
                  <div key={l}>
                    <p className="font-serif text-2xl font-medium text-emerald-900 dark:text-emerald-200">{v}</p>
                    <p className="text-xs text-stone-500 dark:text-stone-400">{l}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA + footer ── */}
      <section className="border-t border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 py-14 text-center">
          <h2 className="font-serif text-3xl font-medium tracking-tight">
            Try both sides of the table.
          </h2>
          <p className="max-w-lg text-sm text-stone-600 dark:text-stone-400">
            Submit a campaign and watch the pipeline work in real time — then
            sign in as a reviewer and decide its fate. Your username shows up in
            the audit trail.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/submit">Submit a campaign</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/login">Reviewer sign-in</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/about">
                See how it works <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
        <footer className="border-t border-stone-200 dark:border-stone-700">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-6 text-xs text-stone-500 dark:text-stone-400 sm:flex-row">
            <p>
              Amanah — a working product demo. All campaigns are fictional; the
              AI pipeline and audit trail are real.
            </p>
            <p className="flex items-center gap-4">
              <Link href="/about" className="underline underline-offset-2">
                How it works
              </Link>
              <a
                href="https://github.com/MicBun/amanah"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-2"
              >
                Code on GitHub
              </a>
            </p>
          </div>
        </footer>
      </section>
    </div>
  );
}
