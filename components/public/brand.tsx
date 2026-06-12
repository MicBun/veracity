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

/** Gold zakat marker — the one place the gold accent is allowed. */
export function ZakatChip({ label = "Zakat" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-amber-200 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
      <Sparkles className="size-3" /> {label}
    </span>
  );
}
