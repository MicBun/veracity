# Design Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote the brand the landing page already invented (warm paper, emerald, stone, Newsreader serif, lattice texture) to the design-token level, propagate it to the orphaned surfaces (submit/status/login), and polish the donor pages and admin console — cosmetics only, zero behavior change.

**Architecture:** Tailwind v4 theme tokens in `app/globals.css` carry the brand (emerald `--primary`, stone neutrals, `--color-paper`, `--shadow-card`); shadcn/ui primitives get a one-time radius normalization; pages then shed their hardcoded `bg-emerald-700`-style overrides and inherit the tokens. Shared public brand atoms (lattice texture, zakat chip) move into `components/public/brand.tsx`. `sonner` toasts are mounted once in the root layout.

**Tech Stack:** Next.js 15 App Router, React 19, Tailwind v4 (`@theme inline`), shadcn/ui, lucide-react, sonner. No new dependencies.

**Constraints (CLAUDE.md invariants — must hold after every task):**
- No new writes to `campaigns.status`; we touch zero API routes.
- Public pages must not gain any assessment data (risk scores, flags, confidence, recommendations). The landing `MockQueueCard` shows *fictional hardcoded* strings — that stays, but gets a "Reviewer console preview" caption.
- Verification = `npm run lint` + `npm run build` (no test runner) + dev-server HTML greps.
- Commits: Conventional Commits, **no Claude co-author trailer**.

**Branch:** `feat/design-refresh` off `main`.

---

### Task 1: Brand tokens + primitive normalization

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Modify: `components/ui/button.tsx`, `components/ui/card.tsx`, `components/ui/progress.tsx`, plus every other `components/ui/*.tsx` containing `rounded-none`

- [ ] **Step 1: Re-token `globals.css`**

In the `@theme inline` block, append after the radius lines:

```css
  --color-paper: #faf8f4;
  --color-gold: oklch(0.828 0.189 84.429);
  --shadow-card: 0 18px 50px -26px rgb(12 46 36 / 0.4);
```

Replace the grayscale `:root` values with warm stone + emerald (Tailwind v4 palette values):

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.216 0.006 56.043);          /* stone-900 */
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.216 0.006 56.043);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.216 0.006 56.043);
  --primary: oklch(0.508 0.118 165.612);            /* emerald-700 */
  --primary-foreground: oklch(0.985 0.001 106.423); /* stone-50 */
  --secondary: oklch(0.97 0.001 106.424);           /* stone-100 */
  --secondary-foreground: oklch(0.268 0.007 34.298);/* stone-800 */
  --muted: oklch(0.97 0.001 106.424);
  --muted-foreground: oklch(0.553 0.013 58.071);    /* stone-500 */
  --accent: oklch(0.979 0.021 166.113);             /* emerald-50 */
  --accent-foreground: oklch(0.378 0.077 168.94);   /* emerald-900 */
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.923 0.003 48.717);              /* stone-200 */
  --input: oklch(0.923 0.003 48.717);
  --ring: oklch(0.596 0.145 163.225);               /* emerald-600 */
  /* chart + sidebar + radius lines unchanged */
}
```

In `.dark`, change only `--primary: oklch(0.696 0.17 162.48);` (emerald-500) and `--ring: oklch(0.596 0.145 163.225);` — dark mode is unused but should not regress to a black primary.

Delete the dead rule (overridden by the `font-sans` class on `<html>`):

```css
  html {
    @apply font-mono;
  }
```

- [ ] **Step 2: Mount toasts in `app/layout.tsx`**

```tsx
import { Toaster } from "@/components/ui/sonner";
// inside <body>:
<body className="antialiased">
  {children}
  <Toaster position="top-center" />
</body>
```

(Confirm the export name in `components/ui/sonner.tsx` first; shadcn ships it as `Toaster`.)

- [ ] **Step 3: Radius normalization sweep**

Rule: containers `rounded-xl`, controls `rounded-md`, bars `rounded-full`.

Run `grep -l "rounded-none" components/ui/*.tsx` and apply:
- `card.tsx`: every `rounded-none` → `rounded-xl` (root, header, footer, img corners).
- `button.tsx`: base `rounded-none` → `rounded-md`; size variants `xs`/`sm`/`icon-xs`/`icon-sm` `rounded-none` → `rounded-md`.
- `progress.tsx`: `rounded-none` → `rounded-full`.
- `input.tsx`, `textarea.tsx`, `select.tsx`, `checkbox.tsx`, etc.: `rounded-none` → `rounded-md` (dialog/popover content → `rounded-xl`).

- [ ] **Step 4: Darker primary hover on Button**

In `button.tsx` `default` variant: `hover:bg-primary/80` → `hover:bg-[color-mix(in_oklch,var(--primary),black_12%)]` (matches the old hand-rolled emerald-700→800 hover).

- [ ] **Step 5: Verify + commit**

Run: `npm run lint && npm run build` — expect clean.
Commit: `feat(ui): emerald-stone brand tokens, radius + shadow system`

---

### Task 2: Shared brand atoms + landing/about fixes

**Files:**
- Create: `components/public/brand.tsx`
- Modify: `app/page.tsx`, `app/about/page.tsx`

- [ ] **Step 1: Create `components/public/brand.tsx`**

```tsx
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

/** Eight-pointed-star lattice, the brand texture for public page backdrops. */
export const LATTICE = `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%230e3b2e' stroke-width='1'%3E%3Cpath d='M40 8 L62 40 L40 72 L18 40 Z'/%3E%3Cpath d='M8 40 L40 18 L72 40 L40 62 Z'/%3E%3C/g%3E%3C/svg%3E")`;

export function LatticeBg({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 opacity-[0.045]", className)}
      style={{ backgroundImage: LATTICE }}
    />
  );
}

/** Gold zakat marker — the one place the gold accent is allowed. */
export function ZakatChip({ label = "Zakat" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
      <Sparkles className="size-3" /> {label}
    </span>
  );
}
```

- [ ] **Step 2: Landing (`app/page.tsx`)**

- Delete the local `LATTICE` const; `import { LatticeBg } from "@/components/public/brand";` and replace the inline backdrop div with `<LatticeBg />`.
- Above `<MockQueueCard />` add the framing caption (inside the `rise rise-4` wrapper):
  ```tsx
  <p className="mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-400">
    Reviewer console preview
  </p>
  ```
- Hero CTA hierarchy: primary keeps `size="lg"` but drops `bg-emerald-700 hover:bg-emerald-800` (token now does it) and gains `shadow-lg shadow-emerald-900/15`; outline + ghost unchanged.
- All other `className="bg-emerald-700 hover:bg-emerald-800"` overrides on Buttons (nav, footer CTA): remove — default variant is emerald now.
- "Who owns what" cards adopt the About page's coding: AI card `border-emerald-300 bg-emerald-50/60` (label stays emerald-800); Humans card → inverted: `border-stone-800 bg-stone-900` with label `text-stone-200` and list `text-stone-300`.
- Quote icon in the dark quote box: `opacity-60` → `opacity-80`.

- [ ] **Step 3: About (`app/about/page.tsx`)**

- `max-w-4xl` → `max-w-5xl` (header and main).
- `Arrow`: icon `size-4` → `size-5`, label `text-[11px]` → `text-xs`.
- "Built in the open" card: add `border-l-4 border-l-emerald-700` to its `rounded-xl border border-stone-300 bg-white p-6`.
- Remove `bg-emerald-700 hover:bg-emerald-800` Button override (GitHub button).

- [ ] **Step 4: Verify + commit**

`npm run lint && npm run build`.
Commit: `feat(landing): brand atoms, console-preview caption, CTA hierarchy, about polish`

---

### Task 3: Re-home submit + status pages

**Files:**
- Modify: `app/submit/page.tsx`, `app/status/[id]/page.tsx`

- [ ] **Step 1: Submit form phase**

- `<main className="min-h-screen bg-muted/30 px-4 py-10">` → `bg-paper text-stone-900`.
- Header becomes serif: `<h1 className="font-serif text-3xl font-medium tracking-tight">Submit a campaign</h1>`, icon `text-emerald-600` → `text-emerald-700`.
- Trust-signals box: `rounded-lg border bg-muted/40 p-4` → `rounded-lg border border-dashed border-stone-300 bg-stone-50/80 p-4` (signals "demo control").
- Character counter: turns amber near the cap:
  ```tsx
  <p className={cn("text-right text-xs tabular-nums", description.length > 2800 ? "text-amber-700" : "text-muted-foreground")}>
  ```
- Submit `<Button type="submit" className="w-full" size="lg">` unchanged (token makes it emerald).

- [ ] **Step 2: Submit streaming phase (the hero moment)**

- Wrapper: `bg-muted/30` → `relative bg-paper` and add `<LatticeBg />` inside it; Card gets `relative w-full max-w-md`.
- Step list: each `<li>` gains `transition-colors duration-300`; active icon `Loader2 className="size-5 animate-spin text-emerald-700"`; active label also `text-emerald-900`.
- Add a counter under the list:
  ```tsx
  <p className="mt-4 text-xs text-muted-foreground tabular-nums" aria-live="polite">
    {steps.filter((s) => s.state === "done").length} of {steps.length} checks complete
  </p>
  ```
- Warning upgrade: `<p className="mt-4 text-xs text-amber-700">` → bordered alert:
  ```tsx
  <div className="mt-4 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
    <AlertTriangle className="mt-0.5 size-3.5 shrink-0" /> {warning}
  </div>
  ```
  (add `AlertTriangle` to the lucide import).

- [ ] **Step 3: Status page**

- Background `bg-muted/30` → `bg-paper text-stone-900`; wordmark link gains `font-serif text-xl tracking-tight` styling to match other public headers.
- Approved CTA becomes a real button (keep the existing conditional):
  ```tsx
  <Button asChild>
    <Link href={`/campaigns/${campaign.id}`}>
      View your live campaign page <ArrowRight className="size-4" />
    </Link>
  </Button>
  ```
  (import `Button` + `ArrowRight`).

- [ ] **Step 4: Verify + commit**

`npm run lint && npm run build`.
Commit: `feat(public): re-home submit and status pages on the brand system`

---

### Task 4: Login page

**Files:**
- Modify: `app/login/page.tsx`

- [ ] **Step 1: Restyle**

- `<main ... bg-muted/30 p-4>` → `relative ... bg-paper p-4` + `<LatticeBg />` before `<Suspense>`; Card gets `relative`.
- Demo-credentials box: amber *warning* tone → neutral *info* tone:
  ```tsx
  <div className="flex items-start gap-2 rounded-md border border-stone-200 bg-stone-100/70 p-3 text-sm text-stone-700">
    <Info className="mt-0.5 size-4 shrink-0 text-stone-400" />
    <div>
      <p className="font-medium text-stone-900">Demo credentials — shown on purpose</p>
      <p className="mt-1">… (existing copy unchanged) …</p>
    </div>
  </div>
  ```
  (import `Info` from lucide; `ShieldCheck` icon `text-emerald-600` → `text-emerald-700`).

- [ ] **Step 2: Verify + commit**

`npm run lint && npm run build`.
Commit: `feat(login): paper backdrop, info-tone demo hint`

---

### Task 5: Donor experience polish (campaigns)

**Files:**
- Modify: `app/campaigns/page.tsx`, `app/campaigns/[id]/page.tsx`, `components/public/raised-progress.tsx`, `components/public/donate-form.tsx`

- [ ] **Step 1: RaisedProgress — cap % text, funded celebration**

```tsx
import { Progress } from "@/components/ui/progress";
import { formatUsd } from "@/lib/format";
import { CheckCircle2 } from "lucide-react";

export function RaisedProgress({ raised, goal, donorCount }: { raised: number; goal: number; donorCount: number }) {
  const pct = goal > 0 ? (raised / goal) * 100 : 0;
  const funded = goal > 0 && raised >= goal;
  const donors = `${donorCount} ${donorCount === 1 ? "donor" : "donors"}`;
  return (
    <div className="space-y-2">
      <Progress value={Math.min(100, pct)} className="h-2" />
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
        <p className="font-semibold text-emerald-900">
          {formatUsd(raised)}{" "}
          <span className="font-normal text-stone-500">raised of {formatUsd(goal)}</span>
        </p>
        {funded ? (
          <p className="inline-flex items-center gap-1 font-medium text-amber-700">
            <CheckCircle2 className="size-3.5" /> Fully funded · {donors}
          </p>
        ) : (
          <p className="text-stone-500">
            {Math.min(100, Math.round(pct))}% funded · {donors}
          </p>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Gallery (`app/campaigns/page.tsx`)**

- `bg-[#faf8f4]` → `bg-paper`.
- Zakat span → `<ZakatChip />` (import from brand).
- Card hover: `transition-shadow hover:shadow-[0_18px_50px_-26px_rgba(12,46,36,0.4)]` → `transition-all hover:-translate-y-0.5 hover:shadow-card`.
- Demo line gets an icon: wrap in `inline-flex items-center gap-1.5` with `<Info className="size-3.5 text-stone-400" />`.

- [ ] **Step 3: Detail page (`app/campaigns/[id]/page.tsx`)**

- `bg-[#faf8f4]` → `bg-paper`; zakat span → `<ZakatChip label="Zakat-eligible (claimed)" />`.
- Recent supporters list becomes avatar rows:
  ```tsx
  <ul className="mt-3 space-y-2.5">
    {recent.map((d) => {
      const name = d.donorName ?? "Anonymous";
      return (
        <li key={d.id} className="flex items-center gap-2.5 text-sm">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800">
            {name.charAt(0).toUpperCase()}
          </span>
          <span className="min-w-0 flex-1 truncate font-medium text-stone-800">{name}</span>
          <span className="shrink-0 text-xs text-stone-500">
            {formatUsd(d.amount)} · {formatRelativeTime(d.createdAt)}
          </span>
        </li>
      );
    })}
  </ul>
  ```

- [ ] **Step 4: DonateForm — toast + preset contrast**

- Presets idle class: `border-stone-300 text-stone-600 hover:border-stone-400` → `border-stone-200 bg-stone-50 text-stone-700 hover:border-emerald-300 hover:text-emerald-800`.
- Donate Button: drop `bg-emerald-700 hover:bg-emerald-800` (token).
- Success path: replace inline success message with a toast (keep inline error rendering):
  ```tsx
  import { toast } from "sonner";
  // on success:
  setStatus("success");
  setMessage(null);
  toast.success(`Thank you! Your ${formatUsd(value)} demo donation was recorded.`);
  ```
  and the message `<p>` renders only for errors (`status === "error"`).

- [ ] **Step 5: Verify + commit**

`npm run lint && npm run build`.
Commit: `feat(campaigns): funded state, supporter avatars, donate toast, brand polish`

---

### Task 6: Admin queue + badges + layout

**Files:**
- Modify: `app/admin/layout.tsx`, `app/admin/queue/page.tsx`, `components/admin/badges.tsx`

- [ ] **Step 1: Admin layout**

- Header gets a brand accent: `border-b bg-background` → `border-b border-t-2 border-t-emerald-700 bg-background`.
- Wordmark: add `font-serif text-lg tracking-tight` to the "Amanah" link text (consistent with public).

- [ ] **Step 2: Badges (`components/admin/badges.tsx`)**

- `RiskBadge`: label closure + mono data:
  ```tsx
  <span className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-mono text-xs font-semibold tabular-nums", tone)}>
    Risk {score}<span className="opacity-60">/100</span>
  </span>
  ```
- `FlagBadge`: gray secondary → caution-tinted:
  ```tsx
  <span className="inline-flex items-center rounded-md border border-amber-200/70 bg-amber-50 px-1.5 py-0.5 text-[11px] font-medium text-amber-900">
    {FLAG_LABELS[flag] ?? flag}
  </span>
  ```
  (drop the `Badge` import if unused afterward).

- [ ] **Step 3: Queue (`app/admin/queue/page.tsx`)**

- Lane tint config — add `cls` to each `LANES` entry and apply on the `<section>`:
  - fast_track: `border-emerald-200/70 bg-emerald-50/40`
  - needs_review: `border-amber-200/70 bg-amber-50/40`
  - escalated: `border-violet-200/70 bg-violet-50/40`
  ```tsx
  <section key={lane.key} className={cn("space-y-3 rounded-xl border p-3", lane.cls)}>
  ```
- Count badge: `bg-muted` → `bg-foreground/10 font-semibold`.
- Card title: `text-sm font-semibold leading-snug` → add `line-clamp-2`.
- Footer meta: two `<span>`s → one consolidated line: `Confidence {…} · {…}` in a single muted span with `font-mono tabular-nums`.
- Empty lane: dashed box gains `<CheckCircle2 className="mx-auto mb-1 size-4 text-emerald-600" />` and copy "All clear — nothing waiting." (import from lucide).

- [ ] **Step 4: Verify + commit**

`npm run lint && npm run build`.
Commit: `feat(admin): branded console header, lane tints, legible risk/flag badges`

---

### Task 7: Campaign review screen

**Files:**
- Modify: `components/admin/campaign-review.tsx`

- [ ] **Step 1: Evidence panel elevation**

Wrap the evidence block in a tinted container and strengthen items:

```tsx
<div className="rounded-lg border border-amber-200/70 bg-amber-50/40 p-3">
  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-amber-900">
    Evidence — click to highlight the cited field
  </p>
  <ul className="space-y-1.5">…</ul>
</div>
```

Inside each evidence button: claim `font-medium` → `font-semibold`, quote icon `size-3` → `size-3.5 text-amber-700`, button bg `bg-white` idle (`"w-full rounded-md border bg-white p-2 text-left text-xs transition-colors hover:bg-amber-50"`), selected state unchanged.

- [ ] **Step 2: Risk / mitigating tinted panels**

```tsx
<div className="grid gap-3 sm:grid-cols-2">
  <div className="rounded-lg border border-red-200 bg-red-50/50 p-3">
    <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-red-700">
      <ShieldAlert className="size-3.5" /> Risk factors
    </p>
    <ul className="list-disc space-y-1 pl-4 text-xs">…</ul>
  </div>
  <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
    <p className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-emerald-700">
      <ShieldCheck className="size-3.5" /> Mitigating factors
    </p>
    <ul className="list-disc space-y-1 pl-4 text-xs">…</ul>
  </div>
</div>
```

- [ ] **Step 3: Decision buttons — spinner + toast**

- Import `Loader2` from lucide and `toast` from sonner.
- Each button icon becomes conditional, e.g. approve:
  ```tsx
  {pendingAction === "approve" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
  ```
  (same pattern for reject/X and escalate/ArrowUpRight).
- Remove the `cn(fastTrack && "bg-emerald-600 hover:bg-emerald-700")` override — `variant="default"` is emerald now.
- On success in `act()` before `router.refresh()`:
  ```tsx
  toast.success(`Decision recorded — ${action}d${action === "approve" ? "" : ""}`);
  ```
  Use readable labels instead: `const DONE: Record<string,string> = { approve: "approved", reject: "rejected", escalate: "escalated" };` → `toast.success(\`Decision recorded — campaign ${DONE[action]}.\`)`.

- [ ] **Step 4: Audit-log snapshot — readable summary over raw JSON**

Replace the `<details>` body: keep the summary line, then render structured bullets and nest the raw JSON one level deeper:

```tsx
<div className="mt-2 space-y-1 rounded-md bg-muted p-3">
  {snap.screening?.output?.risk_score !== undefined && (
    <p>Screening risk score: <span className="font-mono font-semibold">{snap.screening.output.risk_score}/100</span></p>
  )}
  {snap.deep_review?.output?.recommendation && (
    <p>Deep-review recommendation: <span className="font-semibold">{snap.deep_review.output.recommendation}</span></p>
  )}
  {snap.deep_review?.output?.reasoning && (
    <p className="text-muted-foreground">“{snap.deep_review.output.reasoning}”</p>
  )}
  <details className="pt-1">
    <summary className="cursor-pointer select-none">Raw snapshot</summary>
    <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-background p-3 text-[11px]">
      {JSON.stringify(snap, null, 2)}
    </pre>
  </details>
</div>
```

- [ ] **Step 5: Data-as-mono touches**

- `StageFooter` `<p>` gains `font-mono` (keep `text-[11px] text-muted-foreground`).
- `ConfidenceMeter` value span gains `font-mono`.
- Low-confidence note keeps violet (escalation semantics) but gains an icon: `<ShieldAlert className="mr-1 inline size-3" />`.

- [ ] **Step 6: Verify + commit**

`npm run lint && npm run build`.
Commit: `feat(admin): evidence panel elevation, decision feedback, readable audit snapshots`

---

### Task 8: Evals dashboard

**Files:**
- Modify: `components/admin/eval-dashboard.tsx`

- [ ] **Step 1: Header — last-run chip + stat mono**

- Move "Last run …" up: next to the `<h1>` render (when `cached`):
  ```tsx
  <span className="rounded-full border px-2.5 py-0.5 text-xs text-muted-foreground">
    Last run {formatDate(cached.startedAt)}
  </span>
  ```
  and shorten the old footnote to just the replace-on-completion sentence.
- Stat values: `text-xl font-semibold tabular-nums` → `font-mono text-xl font-semibold tabular-nums`.
- Run button shows live count: `Running… ` → `Running {progress ? \`${progress.done}/${progress.total}\` : ""}…`.

- [ ] **Step 2: Per-class table — emphasize the safety metric**

- `<thead>` row: `text-xs text-muted-foreground` → `text-xs font-semibold text-foreground`; Recall `<th>` gets `text-emerald-800`.
- Recall `<td>`: bold on fraud classes:
  ```tsx
  <td className={cn("py-2 tabular-nums", (cls === "subtle_fraud" || cls === "obvious_fraud") && "font-semibold text-emerald-900")}>
  ```
- All numeric cells gain `font-mono`.

- [ ] **Step 3: Confusion matrix — heat-map + legend**

- Header cells (top row + left column): `font-medium text-muted-foreground` → `text-[10px] font-semibold uppercase tracking-wide text-stone-500`.
- Cell classes: zero `bg-muted/40 text-muted-foreground/40`; diagonal `bg-emerald-100 font-bold text-emerald-900`; off-diagonal `bg-amber-100 text-amber-900`; fraud→clean `bg-red-100 font-bold text-red-900`. All cells keep `rounded-md py-2.5 font-mono tabular-nums`.
- Legend under the grid:
  ```tsx
  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
    <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-emerald-100 ring-1 ring-emerald-300" /> correct</span>
    <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-amber-100 ring-1 ring-amber-300" /> misclassified</span>
    <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-red-100 ring-1 ring-red-300" /> fraud predicted clean</span>
  </div>
  ```

- [ ] **Step 4: Intentionally dropped**

No skeletons for the misclassification list: cached results stay visible during a re-run by design — replacing them with skeletons would hide useful data.

- [ ] **Step 5: Verify + commit**

`npm run lint && npm run build`.
Commit: `feat(evals): heat-map confusion matrix, recall emphasis, mono metrics`

---

### Task 9: Full verification sweep

- [ ] **Step 1: Static checks** — `npm run lint && npm run build` clean.
- [ ] **Step 2: Leak grep** — start `npm run dev`, then for `/`, `/campaigns`, a campaign detail, `/status/<id>`, `/submit`, `/login`: `curl -s <url> | grep -ciE "risk_score|category_flags|recommendation|confidence"` must be 0 on all public pages (MockQueueCard strings are display copy: "Risk 91" literal is allowed on `/` only — it's fictional hardcoded demo copy with the new caption).
- [ ] **Step 3: Invariant grep** — `grep -rn "update(campaigns)" app lib` still matches only `app/api/admin/campaigns/[id]/action/route.ts`.
- [ ] **Step 4: Visual pass** — load every page on the dev server, eyeball typography/contrast/radius consistency.
- [ ] **Step 5: Adversarial review** — multi-agent workflow review of the diff (invariant, regression, a11y/contrast, consistency lenses); fix confirmed findings.
- [ ] **Step 6: Final commit** of any fixups; then finishing-a-development-branch.
