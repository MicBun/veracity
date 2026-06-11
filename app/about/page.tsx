import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowDown, ArrowRight } from "lucide-react";

export const metadata = {
  title: "How Amanah works — AI reads every campaign, people decide",
};

const REPO = "https://github.com/MicBun/amanah";
const DOCS = `${REPO}/tree/main/docs`;

// lucide-react dropped its brand icons, so the GitHub mark is inlined here.
function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56 0-.27-.01-.99-.02-1.95-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.41-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.69.42.36.8 1.08.8 2.18 0 1.58-.01 2.85-.01 3.24 0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z" />
    </svg>
  );
}

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
    neutral: "border-stone-300 bg-white",
    ai: "border-emerald-300 bg-emerald-50/60",
    human: "border-stone-800 bg-stone-900 text-stone-50",
  };
  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p
        className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${
          tone === "human" ? "text-stone-300" : "text-stone-500"
        }`}
      >
        {label}
      </p>
      <p className="mt-0.5 font-serif text-lg font-medium">{title}</p>
      <p
        className={`mt-1 text-xs leading-relaxed ${
          tone === "human" ? "text-stone-300" : "text-stone-600"
        }`}
      >
        {body}
      </p>
    </div>
  );
}

function Arrow({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-1 text-stone-400">
      <ArrowDown className="size-4" />
      {label && <span className="text-[11px]">{label}</span>}
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#faf8f4] text-stone-900">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-emerald-700" />
          <span className="font-serif text-xl font-semibold tracking-tight">Amanah</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/submit" className="text-stone-600 hover:text-stone-900">
            Submit
          </Link>
          <Link href="/login" className="text-stone-600 hover:text-stone-900">
            Reviewer sign-in
          </Link>
          <a
            href={REPO}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-stone-600 hover:text-stone-900"
          >
            <GitHubMark className="size-4" /> Code
          </a>
        </nav>
      </header>

      <main className="mx-auto max-w-4xl space-y-14 px-5 pb-20 pt-6">
        <section>
          <h1 className="font-serif text-4xl font-medium tracking-tight">
            How Amanah works
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
            Amanah triages incoming crowdfunding campaigns for fraud signals,
            policy violations, and zakat-eligibility claims. AI reads every
            submission and lays out what it found — but it never decides. A human
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
              body="Title, story, goal, category, organizer profile, zakat claim. Anyone can submit; submissions are rate-limited."
            />
            <Arrow label="every campaign" />
            <DiagramBox
              tone="ai"
              label="AI · first pass"
              title="Screening"
              body="A fast model scores fraud risk against a seven-category rubric, reports how confident it is, and writes a one-line summary — in a few seconds, for every campaign."
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
            <div className="rounded-xl border border-emerald-300 bg-emerald-50/60 p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                The AI owns
              </p>
              <ul className="mt-3 space-y-2 text-sm text-stone-700">
                <li>Reading every submission, instantly</li>
                <li>Scoring risk against a fixed rubric</li>
                <li>Quoting evidence for every flag</li>
                <li>Saying &ldquo;I&apos;m not sure&rdquo; out loud</li>
                <li>Ordering the queue so people look at the right things first</li>
              </ul>
            </div>
            <div className="rounded-xl border border-stone-300 bg-white p-5">
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-900">
                Humans own
              </p>
              <ul className="mt-3 space-y-2 text-sm text-stone-700">
                <li>Every approve, reject, and escalate</li>
                <li>Judgment on genuinely ambiguous cases</li>
                <li>Zakat-eligibility calls that need documentation</li>
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
              — an actual deep-review output from the demo queue. Amanah is built
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
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-stone-700">
            <li className="rounded-xl border border-stone-200 bg-white p-4">
              <span className="font-semibold">The AI cannot change a campaign&apos;s status.</span>{" "}
              Approvals, rejections, and escalations happen only behind reviewer
              authentication. The AI&apos;s only output is a recommendation and
              its evidence — there is no code path for it to decide.
            </li>
            <li className="rounded-xl border border-stone-200 bg-white p-4">
              <span className="font-semibold">
                Submitters and reviewers see different worlds.
              </span>{" "}
              The public status page never shows a risk score, a flag, or the
              AI&apos;s reasoning — because teaching submitters what the model
              looks for would teach bad actors how to evade it. Assessment detail
              is reviewer-only.
            </li>
            <li className="rounded-xl border border-stone-200 bg-white p-4">
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
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
            The hard case is subtle fraud — a calm, plausible story with one quiet
            inconsistency. A fast model can read past it. That is exactly why no
            campaign is ever approved without a human, and why Amanah runs against
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
            <Button asChild variant="ghost">
              <a href={`${DOCS}/evaluation.md`} target="_blank" rel="noreferrer">
                Read the evaluation write-up <ArrowRight className="size-4" />
              </a>
            </Button>
          </div>
        </section>

        {/* ── Built in the open ── */}
        <section>
          <div className="rounded-xl border border-stone-300 bg-white p-6">
            <div className="flex items-start gap-3">
              <GitHubMark className="mt-0.5 size-5 shrink-0 text-stone-700" />
              <div>
                <h2 className="font-serif text-2xl font-medium tracking-tight">
                  Built in the open
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-stone-600">
                  Want the engineering perspective — the two-stage pipeline, the
                  cost model, the schema, the boundaries enforced in code? It all
                  lives in the repository, not bolted onto this page. The{" "}
                  <a
                    href={DOCS}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-emerald-800 underline underline-offset-2"
                  >
                    docs
                  </a>{" "}
                  cover the architecture, cost model, and evaluation in depth.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button asChild className="bg-emerald-700 hover:bg-emerald-800">
                    <a href={REPO} target="_blank" rel="noreferrer">
                      <GitHubMark className="size-4" /> View the code on GitHub
                    </a>
                  </Button>
                  <Button asChild variant="outline">
                    <a href={`${DOCS}/architecture.md`} target="_blank" rel="noreferrer">
                      Architecture <ArrowRight className="size-4" />
                    </a>
                  </Button>
                  <Button asChild variant="outline">
                    <a href={`${DOCS}/cost-model.md`} target="_blank" rel="noreferrer">
                      Cost model <ArrowRight className="size-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-stone-200 pt-6 text-xs text-stone-500">
          <p>
            Amanah — a working product demo. All campaigns are fictional; the AI
            pipeline and audit trail are real.
          </p>
        </footer>
      </main>
    </div>
  );
}
