# Dark-mode literal sweep — mapping spec

The app just gained a `.dark` theme (warm dark, emerald accents). Token-based
shadcn primitives (Card, Button, Input, Badge, etc.) and `bg-paper` already flip
automatically. This sweep handles the **hardcoded Tailwind color literals** in
page/component JSX, which have no dark behavior yet.

## The one rule that overrides everything

**NEVER change the light appearance.** The light theme was just polished and
adversarially reviewed. You may ONLY *append* `dark:` variants to existing
classes. Keep every existing class exactly as-is; add the dark counterpart right
after it in the same `className`. Do not reorder, rename, or drop classes. Do not
migrate literals to tokens. Additive only.

## Leave these ALONE (already flip via tokens — do NOT touch)

- `bg-paper` — now flips via the paper token.
- Anything already token-based: `bg-background`, `bg-card`, `bg-muted`,
  `bg-muted/30`, `bg-muted/40`, `bg-foreground/10`, `bg-secondary`,
  `bg-accent`, `text-foreground`, `text-muted-foreground`, `text-primary`,
  `border-border`, `border-input`, `ring-ring`, `bg-primary`, `shadow-card`,
  `bg-gold`/`text-gold`, etc.
- `text-primary-foreground` / `text-secondary-foreground` and friends.

## Neutral text (warm stone) — append dark variant

| light | append |
|---|---|
| `text-stone-900` | `dark:text-stone-100` |
| `text-stone-800` | `dark:text-stone-200` |
| `text-stone-700` | `dark:text-stone-300` |
| `text-stone-600` | `dark:text-stone-400` |
| `text-stone-500` | `dark:text-stone-400` |
| `hover:text-stone-900` | `dark:hover:text-stone-100` |
| `hover:text-stone-800` | `dark:hover:text-stone-200` |

## Neutral surfaces & borders

| light | append |
|---|---|
| `bg-white` (inset chip/button on a surface) | `dark:bg-stone-900` |
| `bg-stone-50` / `bg-stone-50/80` / `bg-stone-50/50` | `dark:bg-stone-900/40` |
| `bg-stone-100` | `dark:bg-stone-800` |
| `border-stone-200` | `dark:border-stone-700` |
| `border-stone-300` | `dark:border-stone-700` |
| `border-dashed border-stone-300` | append `dark:border-stone-700` |

`text-white` / `bg-black`: only act if it sits on a surface that FLIPS. If
`text-white` is on a colored literal bg that stays colored in dark (e.g.
`bg-emerald-700 text-white`), LEAVE it. If it's on a flipping token/paper, give
it a dark counterpart.

## Emerald (safe / approve / brand accent)

| light | append |
|---|---|
| `text-emerald-700` | `dark:text-emerald-400` |
| `text-emerald-800` | `dark:text-emerald-300` |
| `text-emerald-900` | `dark:text-emerald-200` |
| `bg-emerald-50` / `bg-emerald-50/60` / `/40` | `dark:bg-emerald-950/40` |
| `bg-emerald-100` | `dark:bg-emerald-900/40` |
| `border-emerald-200` / `/70` / `border-emerald-300` | `dark:border-emerald-800/60` |
| `border-l-emerald-700` | `dark:border-l-emerald-500` |
| `hover:border-emerald-300` | `dark:hover:border-emerald-700` |
| `hover:text-emerald-800` | `dark:hover:text-emerald-300` |

## Amber (pending / caution / flags / gold)

| light | append |
|---|---|
| `text-amber-700` | `dark:text-amber-400` |
| `text-amber-800` | `dark:text-amber-300` |
| `text-amber-900` | `dark:text-amber-200` |
| `bg-amber-50` / `/40` / `/80` | `dark:bg-amber-950/40` |
| `bg-amber-100` | `dark:bg-amber-900/40` |
| `border-amber-200` / `/70` / `border-amber-300` | `dark:border-amber-800/60` |

## Red (risk / reject)

| light | append |
|---|---|
| `text-red-800` | `dark:text-red-300` |
| `bg-red-50` / `/50` | `dark:bg-red-950/40` |
| `bg-red-100` | `dark:bg-red-900/40` |
| `border-red-200` | `dark:border-red-800/60` |

## Violet (escalated only)

| light | append |
|---|---|
| `text-violet-800` | `dark:text-violet-300` |
| `bg-violet-100` | `dark:bg-violet-900/40` |
| `border-violet-200` | `dark:border-violet-800/60` |

## Tone-map objects (badges.tsx, queue LANES, etc.)

Some files build className strings inside JS objects (e.g.
`"bg-red-100 text-red-800 border-red-200"`). Apply the SAME rules inside those
string literals — append the dark variants in-string.

## Contrast target

Body/heading text in dark must clear ~4.5:1 on its surface; large/secondary
text ~3:1. The dark surfaces are warm near-black (`--card` ≈ oklch 0.21,
`--paper` ≈ oklch 0.16). The stone-100/200/300 and color-300/400 picks above
are chosen to clear this — follow the table and you're safe.

## After editing

Re-grep your file for any palette literal that still lacks a `dark:` sibling and
confirm each was either mapped or intentionally left (token/colored-bg). Do not
run the build (the orchestrator does that once at the end).
