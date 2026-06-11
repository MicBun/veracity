import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session-cookies";
import { LogoutButton } from "@/components/admin/logout-button";
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
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-6">
            <Link href="/admin/queue" className="flex items-center gap-2 font-semibold">
              <ShieldCheck className="size-5 text-emerald-600" />
              Amanah <span className="text-muted-foreground font-normal">· Reviewer console</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/admin/queue" className="text-muted-foreground hover:text-foreground">
                Queue
              </Link>
              <Link href="/admin/evals" className="text-muted-foreground hover:text-foreground">
                Evals
              </Link>
              <Link href="/about" className="text-muted-foreground hover:text-foreground">
                About
              </Link>
            </nav>
          </div>
          <LogoutButton username={session.username} />
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
