"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  Loader2,
  Circle,
  HandHeart,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LatticeBg } from "@/components/public/brand";

type StepState = "pending" | "active" | "done";

type ProgressStep = { key: string; label: string; state: StepState };

const INITIAL_STEPS: ProgressStep[] = [
  { key: "received", label: "Campaign received", state: "pending" },
  { key: "screening", label: "AI screening", state: "pending" },
];

export default function SubmitPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [goal, setGoal] = useState("");
  const [category, setCategory] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [priorCampaigns, setPriorCampaigns] = useState("0");
  const [accountAge, setAccountAge] = useState("30");
  const [priorFlags, setPriorFlags] = useState("0");
  const [zakat, setZakat] = useState(false);

  const [phase, setPhase] = useState<"form" | "progress" | "done">("form");
  const [steps, setSteps] = useState<ProgressStep[]>(INITIAL_STEPS);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  function setStep(key: string, state: StepState, label?: string) {
    setSteps((prev) => {
      const exists = prev.some((s) => s.key === key);
      const next = exists
        ? prev.map((s) =>
            s.key === key ? { ...s, state, label: label ?? s.label } : s
          )
        : [...prev, { key, label: label ?? key, state }];
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      title,
      description,
      goal_amount: Number(goal),
      category,
      organizer_name: organizerName,
      organizer_history: {
        prior_campaigns: Number(priorCampaigns),
        account_age_days: Number(accountAge),
        prior_flags: Number(priorFlags),
      },
      zakat_claimed: zakat,
    };

    setPhase("progress");
    setSteps(INITIAL_STEPS.map((s) => ({ ...s })));

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Submission failed. Please try again.");
        setPhase("form");
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let campaignId: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line);

          if (event.type === "created") {
            campaignId = event.id;
            setStep("received", "done");
            setStep("screening", "active");
          } else if (event.type === "stage" && event.stage === "screening") {
            if (event.status === "complete") setStep("screening", "done");
          } else if (event.type === "stage" && event.stage === "deep_review") {
            if (event.status === "started")
              setStep("deep_review", "active", "Deep review");
            if (event.status === "complete")
              setStep("deep_review", "done", "Deep review");
            // "skipped" adds no step — the pipeline simply finishes.
          } else if (event.type === "done") {
            if (event.warning) setWarning(event.warning);
            setPhase("done");
            const id = event.id ?? campaignId;
            setTimeout(() => router.push(`/status/${id}`), 1400);
          } else if (event.type === "error") {
            setError(event.message);
            setPhase("form");
          }
        }
      }
    } catch {
      setError("Network error — please try again.");
      setPhase("form");
    }
  }

  if (phase !== "form") {
    return (
      <main className="relative flex min-h-screen items-center justify-center bg-paper p-4 text-stone-900 dark:text-stone-100">
        <LatticeBg />
        <div className="fixed right-4 top-4 z-50">
          <ThemeToggle />
        </div>
        <Card className="relative w-full max-w-md">
          <CardHeader>
            <CardTitle>
              {phase === "done" ? "Submitted" : "Checking your campaign…"}
            </CardTitle>
            <CardDescription>
              {phase === "done"
                ? "Taking you to your campaign's status page."
                : "Automated checks gather signals for our review team. A human reviewer makes every decision."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-4">
              {steps.map((step) => (
                <li
                  key={step.key}
                  className="flex items-center gap-3 transition-colors duration-300"
                >
                  {step.state === "done" ? (
                    <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                  ) : step.state === "active" ? (
                    <Loader2 className="size-5 animate-spin text-emerald-700 dark:text-emerald-400" />
                  ) : (
                    <Circle className="size-5 text-muted-foreground/40" />
                  )}
                  <span
                    className={cn(
                      "text-sm transition-colors duration-300",
                      step.state === "pending" && "text-muted-foreground",
                      step.state === "active" && "font-medium text-emerald-900 dark:text-emerald-200"
                    )}
                  >
                    {step.label}
                  </span>
                </li>
              ))}
              {phase === "done" && (
                <li className="flex items-center gap-3">
                  <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-sm font-medium">
                    In the review queue
                  </span>
                </li>
              )}
            </ul>
            <p
              className="mt-4 text-xs text-muted-foreground tabular-nums"
              aria-live="polite"
            >
              {steps.filter((s) => s.state === "done").length} of {steps.length}{" "}
              checks complete
            </p>
            {warning && (
              <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-900 dark:text-amber-200">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                {warning}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper px-4 py-10 text-stone-900 dark:text-stone-100">
      <div className="fixed right-4 top-4 z-50">
        <ThemeToggle />
      </div>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-center gap-2.5">
          <HandHeart className="size-6 text-emerald-700 dark:text-emerald-400" />
          <h1 className="font-serif text-3xl font-medium tracking-tight">
            Submit a campaign
          </h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Every campaign goes through automated checks and is then reviewed by
          a human before any decision is made.{" "}
          <Link href="/" className="underline underline-offset-2">
            Back to Veracity
          </Link>
        </p>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-1.5">
                <Label htmlFor="title">Campaign title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  minLength={5}
                  maxLength={120}
                  required
                  placeholder="e.g. Rebuild the community kitchen after the flood"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  minLength={50}
                  maxLength={3000}
                  required
                  rows={8}
                  placeholder="Tell donors what you're raising for. Specific, checkable details (quotes, itemized costs, named institutions) help your campaign clear review faster."
                />
                <p
                  className={cn(
                    "text-right text-xs tabular-nums",
                    description.length > 2800
                      ? "text-amber-700 dark:text-amber-400"
                      : "text-muted-foreground"
                  )}
                >
                  {description.length}/3000
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="goal">Goal amount (USD)</Label>
                  <Input
                    id="goal"
                    type="number"
                    min={100}
                    max={1000000}
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    required
                    placeholder="15000"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory} required>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medical">Medical</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="community">Community</SelectItem>
                      <SelectItem value="emergency-relief">
                        Emergency relief
                      </SelectItem>
                      <SelectItem value="livelihood">Livelihood</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="organizer">Organizer name</Label>
                <Input
                  id="organizer"
                  value={organizerName}
                  onChange={(e) => setOrganizerName(e.target.value)}
                  minLength={2}
                  maxLength={80}
                  required
                  placeholder="Your name or organization"
                />
              </div>

              <div className="rounded-lg border border-dashed border-stone-300 dark:border-stone-700 bg-stone-50/80 dark:bg-stone-900/40 p-4">
                <p className="text-sm font-medium">Organizer trust signals</p>
                <p className="mb-3 mt-1 text-xs text-muted-foreground">
                  In production these come from the account system. They&apos;re
                  editable here so you can see how organizer history changes the
                  AI&apos;s assessment.
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="prior" className="text-xs">
                      Prior campaigns
                    </Label>
                    <Input
                      id="prior"
                      type="number"
                      min={0}
                      max={50}
                      value={priorCampaigns}
                      onChange={(e) => setPriorCampaigns(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="age" className="text-xs">
                      Account age (days)
                    </Label>
                    <Input
                      id="age"
                      type="number"
                      min={0}
                      max={10000}
                      value={accountAge}
                      onChange={(e) => setAccountAge(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="flags" className="text-xs">
                      Prior flags
                    </Label>
                    <Input
                      id="flags"
                      type="number"
                      min={0}
                      max={20}
                      value={priorFlags}
                      onChange={(e) => setPriorFlags(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Checkbox
                  id="zakat"
                  checked={zakat}
                  onCheckedChange={(v) => setZakat(v === true)}
                  className="mt-0.5"
                />
                <div>
                  <Label htmlFor="zakat">This campaign is zakat-eligible</Label>
                  <p className="text-xs text-muted-foreground">
                    Claiming zakat eligibility means donations count toward
                    donors&apos; religious obligation — our reviewers check
                    these claims against zakat categories.
                  </p>
                </div>
              </div>

              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

              <Button type="submit" className="w-full" size="lg">
                Submit for review
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Limited to 10 submissions per hour. Campaigns are screened by
                AI and decided by humans.
              </p>
            </CardContent>
          </Card>
        </form>
      </div>
    </main>
  );
}
