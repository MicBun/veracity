import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { ShieldCheck, ArrowDown, ArrowRight } from "lucide-react";
import { getSession } from "@/lib/session-cookies";
import { GitHubMark } from "@/components/public/brand";
import { RepoLink } from "@/components/public/private-repo-link";
import { SiteFooter } from "@/components/public/site-footer";
import { ThemeToggle } from "@/components/theme-toggle";

export const metadata = {
  title: "How Veracity works — AI reads every campaign, people decide",
};

const REPO = "https://github.com/MicBun/veracity";
const DOCS = `${REPO}/tree/main/docs`;

function DiagramBox({
  label,
  title,
  body,
  tone = "neutral",
}: {
  label: string;
  title: string;
  body: string;
  tone?: "neutral" | "ai" | "human";
}) {
  const tones = {
    neutral: "border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900",
    ai: "border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/40",
    human: "border-stone-800 dark:border-stone-700 bg-stone-900 dark:bg-stone-800 text-stone-50",
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p
        className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${
          tone === "human" ? "text-stone-300" : "text-stone-500 dark:text-stone-400"
        }`}
      >
        {label}
      </p>
      <p className="mt-0.5 font-serif text-lg font-medium">{title}</p>
      <p
        className={`mt-1 text-xs leading-relaxed ${
          tone === "human" ? "text-stone-300" : "text-stone-600 dark:text-stone-400"
        }`}
      >
        {body}
      </p>
    </div>
  );
}

function Arrow({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-1 text-stone-400 dark:text-stone-500">
      <ArrowDown className="size-5" />
      {label && <span className="text-xs">{label}</span>}
    </div>
  );
}

export default async function AboutPage() {
  const session = await getSession();
  return (
    <div className="min-h-screen bg-paper text-stone-900 dark:text-stone-100">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-emerald-700 dark:text-emerald-400" />
          <span className="font-serif text-xl font-semibold tracking-tight">Veracity</span>
        </Link>
        <nav className="flex items-center gap-1">
          <Link href="/campaigns" className="rounded-md px-2.5 py-1 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-900/5 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-white/10 dark:hover:text-stone-100">
            Browse campaigns
          </Link>
          <Link href="/submit" className="rounded-md px-2.5 py-1 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-900/5 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-white/10 dark:hover:text-stone-100">
            Submit
          </Link>
          {session ? (
            <Link
              href="/admin/queue"
              className="rounded-md px-2.5 py-1 text-sm font-medium text-emerald-800 transition-colors hover:bg-emerald-900/5 hover:text-emerald-900 dark:text-emerald-300 dark:hover:bg-emerald-400/10 dark:hover:text-emerald-200"
            >
              Reviewer console
            </Link>
          ) : (
            <Link href="/login" className="rounded-md px-2.5 py-1 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-900/5 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-white/10 dark:hover:text-stone-100">
              Reviewer sign-in
            </Link>
          )}
          <RepoLink
            href={REPO}
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-900/5 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-white/10 dark:hover:text-stone-100"
          >
            <GitHubMark className="size-4" /> Code
          </RepoLink>
          <ThemeToggle />
        </nav>
      </header>

      <main className="mx-auto max-w-5xl space-y-14 px-5 pb-20 pt-6">
        <section>
          <h1 className="font-serif text-4xl font-medium tracking-tight">
            How Veracity works
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            Veracity triages incoming crowdfunding campaigns for fraud signals
            and policy violations. AI reads every submission and lays out what it
            found — but it never decides. A human
            reviewer approves, rejects, or escalates every campaign. This page
            explains how that works and where the line between the two is drawn.
          </p>
        </section>

        {/* ── The flow ── */}
        <section>
          <h2 className="font-serif text-2xl font-medium tracking-tight">
            From submission to decision
          </h2>
          <div className="mt-5 grid gap-0">
            <DiagramBox
              label="Public"
              title="Campaign submitted"
              body="Title, story, goal, category, organizer profile. Anyone can submit; submissions are rate-limited."
            />
            <Arrow label="every campaign" />
            <DiagramBox
              tone="ai"
              label="AI · first pass"
              title="Screening"
              body="A fast model scores fraud risk against a six-category rubric, reports how confident it is, and writes a one-line summary — in a few seconds, for every campaign."
            />
            <Arrow label="when risk or uncertainty is high" />
            <DiagramBox
              tone="ai"
              label="AI · closer look"
              title="Deep review"
              body="Risky or uncertain campaigns get a second pass that weighs the organizer's history. Every concern it raises must quote the exact campaign text that triggered it — evidence, not vibes."
            />
            <Arrow label="a recommendation only — never a status change" />
            <DiagramBox
              tone="human"
              label="Human · the decision"
              title="A reviewer decides"
              body="Reviewers work a triage queue sorted by risk and approve, reject, or escalate. Each decision is written to an immutable audit log with the reviewer's name and a snapshot of what the AI was recommending at that moment."
            />
          </div>
        </section>

        {/* ── Who owns what ── */}
        <section>
          <h2 className="font-serif text-2xl font-medium tracking-tight">
            Who owns what
          </h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
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
            <div className="rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-900 dark:text-stone-100">
                Humans own
              </p>
              <ul className="mt-3 space-y-2 text-sm text-stone-700 dark:text-stone-300">
                <li>Every approve, reject, and escalate</li>
                <li>Judgment on genuinely ambiguous cases</li>
                <li>Eligibility and policy calls that need off-platform proof</li>
                <li>Accountability — names in the audit log</li>
                <li>The rubric itself</li>
              </ul>
            </div>
          </div>
        </section>

        {/* ── Calibrated uncertainty ── */}
        <section>
          <div className="rounded-xl border border-emerald-900/15 bg-emerald-900 p-6 text-emerald-50">
            <p className="font-serif text-xl italic leading-relaxed">
              &ldquo;Insufficient information to distinguish an urgent legitimate
              need from fabricated urgency… this is exactly the kind of case a
              human should decide.&rdquo;
            </p>
            <p className="mt-3 text-xs text-emerald-200/80">
              — an actual deep-review output from the demo queue. Veracity is built
              to admit what it can&apos;t verify. Calibrated uncertainty is a
              feature, not a failure: when the AI isn&apos;t sure, it says so and
              hands the case up, rather than guessing.
            </p>
          </div>
        </section>

        {/* ── The line ── */}
        <section>
          <h2 className="font-serif text-2xl font-medium tracking-tight">
            The line is drawn in code, not in the UI
          </h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-stone-700 dark:text-stone-300">
            <li className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4">
              <span className="font-semibold">The AI cannot change a campaign&apos;s status.</span>{" "}
              Approvals, rejections, and escalations happen only behind reviewer
              authentication. The AI&apos;s only output is a recommendation and
              its evidence — there is no code path for it to decide.
            </li>
            <li className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4">
              <span className="font-semibold">
                Submitters and reviewers see different worlds.
              </span>{" "}
              The public status page never shows a risk score, a flag, or the
              AI&apos;s reasoning — because teaching submitters what the model
              looks for would teach bad actors how to evade it. Assessment detail
              is reviewer-only.
            </li>
            <li className="rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-4">
              <span className="font-semibold">Every decision is attributable and permanent.</span>{" "}
              The audit log records who decided, what they decided, and what the
              AI was recommending at that moment. Those rows are only ever added,
              never edited or removed.
            </li>
          </ul>
        </section>

        {/* ── Honesty about failure ── */}
        <section>
          <h2 className="font-serif text-2xl font-medium tracking-tight">
            We measure where it fails
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
            The hard case is subtle fraud — a calm, plausible story with one quiet
            inconsistency. A fast model can read past it. That is exactly why no
            campaign is ever approved without a human, and why Veracity runs against
            a labeled test set and shows reviewers its own error rates — including
            the fraud it would have missed — after every run. The dataset, the
            metrics, and the failure modes we still wrestle with are documented
            openly.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <Link href="/admin/evals">
                See live eval metrics (reviewer sign-in) <ArrowRight className="size-4" />
              </Link>
            </Button>
            <RepoLink
              href={`${DOCS}/evaluation.md`}
              className={buttonVariants({ variant: "ghost" })}
            >
              Read the evaluation write-up <ArrowRight className="size-4" />
            </RepoLink>
          </div>
        </section>

        {/* ── Built in the open ── */}
        <section>
          <div className="rounded-xl border border-stone-300 dark:border-stone-700 border-l-4 border-l-emerald-700 dark:border-l-emerald-500 bg-white dark:bg-stone-900 p-6">
            <div className="flex items-start gap-3">
              <GitHubMark className="mt-0.5 size-5 shrink-0 text-stone-700 dark:text-stone-300" />
              <div>
                <h2 className="font-serif text-2xl font-medium tracking-tight">
                  Built in the open
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
                  Want the engineering perspective — the two-stage pipeline, the
                  cost model, the schema, the boundaries enforced in code? It all
                  lives in the repository, not bolted onto this page. The{" "}
                  <RepoLink
                    href={DOCS}
                    className="font-medium text-emerald-800 dark:text-emerald-300 underline underline-offset-2"
                  >
                    docs
                  </RepoLink>{" "}
                  cover the architecture, cost model, and evaluation in depth.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <RepoLink href={REPO} className={buttonVariants()}>
                    <GitHubMark className="size-4" /> View the code on GitHub
                  </RepoLink>
                  <RepoLink
                    href={`${DOCS}/architecture.md`}
                    className={buttonVariants({ variant: "outline" })}
                  >
                    Architecture <ArrowRight className="size-4" />
                  </RepoLink>
                  <RepoLink
                    href={`${DOCS}/cost-model.md`}
                    className={buttonVariants({ variant: "outline" })}
                  >
                    Cost model <ArrowRight className="size-4" />
                  </RepoLink>
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
