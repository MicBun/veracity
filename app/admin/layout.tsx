import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session-cookies";
import { LogoutButton } from "@/components/admin/logout-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { ShieldCheck } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Middleware already gates /admin/*; this is defense in depth.
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-40 border-b border-t-2 border-t-emerald-700 bg-background dark:border-t-emerald-500">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <Link href="/admin/queue" className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-emerald-700 dark:text-emerald-400" />
              <span className="font-serif text-lg font-semibold tracking-tight">
                Amanah
              </span>
              <span className="text-sm font-normal text-muted-foreground">
                · Reviewer console
              </span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/admin/queue" className="text-muted-foreground hover:text-foreground">
                Queue
              </Link>
              <Link href="/admin/history" className="text-muted-foreground hover:text-foreground">
                History
              </Link>
              <Link href="/admin/evals" className="text-muted-foreground hover:text-foreground">
                Evals
              </Link>
              <Link href="/about" className="text-muted-foreground hover:text-foreground">
                About
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LogoutButton username={session.username} />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
