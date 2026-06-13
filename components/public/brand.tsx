import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

/** Eight-pointed-star lattice, the brand texture for public page backdrops.
   Two variants: dark emerald stroke for the paper light theme, light emerald
   for the warm-dark theme. The color lives inside the SVG data-URI, so it can't
   be themed by a `dark:` className — a CSS-background SVG is its own document and
   ignores `currentColor`. Instead both URIs ride in as CSS vars and the dark:
   utility swaps which one paints. */
export const LATTICE = `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%230e3b2e' stroke-width='1'%3E%3Cpath d='M40 8 L62 40 L40 72 L18 40 Z'/%3E%3Cpath d='M8 40 L40 18 L72 40 L40 62 Z'/%3E%3C/g%3E%3C/svg%3E")`;
export const LATTICE_DARK = `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23a7f3d0' stroke-width='1'%3E%3Cpath d='M40 8 L62 40 L40 72 L18 40 Z'/%3E%3Cpath d='M8 40 L40 18 L72 40 L40 62 Z'/%3E%3C/g%3E%3C/svg%3E")`;

export function LatticeBg({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 bg-[image:var(--lattice)] opacity-[0.045] dark:bg-[image:var(--lattice-dark)] dark:opacity-[0.08]",
        className
      )}
      style={
        {
          "--lattice": LATTICE,
          "--lattice-dark": LATTICE_DARK,
        } as CSSProperties
      }
    />
  );
}

/** GitHub mark — lucide-react dropped its brand icons, so the glyph is inlined. */
export function GitHubMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 .5C5.73.5.5 5.73.5 12a11.5 11.5 0 0 0 7.86 10.92c.58.1.79-.25.79-.56 0-.27-.01-.99-.02-1.95-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.1-.76.41-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.43-2.69 5.41-5.25 5.69.42.36.8 1.08.8 2.18 0 1.58-.01 2.85-.01 3.24 0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5z" />
    </svg>
  );
}

/** Gold zakat marker — the one place the gold accent is allowed. */
export function ZakatChip({ label = "Zakat" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
      <Sparkles className="size-3" /> {label}
    </span>
  );
}
