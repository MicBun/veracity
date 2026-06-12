import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { getSession } from "@/lib/session-cookies";

/** Session-aware public header used by the donor-facing campaign pages. */
export async function SiteHeader() {
  const session = await getSession();
  return (
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
          className="hidden text-sm text-stone-600 hover:text-stone-900 sm:block dark:text-stone-400 dark:hover:text-stone-100"
        >
          Browse campaigns
        </Link>
        <Link
          href="/about"
          className="hidden text-sm text-stone-600 hover:text-stone-900 sm:block dark:text-stone-400 dark:hover:text-stone-100"
        >
          How it works
        </Link>
        {session ? (
          <Link
            href="/admin/queue"
            className="text-sm font-medium text-emerald-800 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-200"
          >
            Reviewer console
          </Link>
        ) : (
          <Link
            href="/login"
            className="text-sm text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
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
  );
}
