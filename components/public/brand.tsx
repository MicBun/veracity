import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

/** Eight-pointed-star lattice, the brand texture for public page backdrops. */
export const LATTICE = `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%230e3b2e' stroke-width='1'%3E%3Cpath d='M40 8 L62 40 L40 72 L18 40 Z'/%3E%3Cpath d='M8 40 L40 18 L72 40 L40 62 Z'/%3E%3C/g%3E%3C/svg%3E")`;

export function LatticeBg({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 opacity-[0.045]",
        className
      )}
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
