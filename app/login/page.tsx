"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck, Info } from "lucide-react";
import { LatticeBg } from "@/components/public/brand";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("demo");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Sign-in failed");
        return;
      }
      const next = searchParams.get("next");
      router.push(next && next.startsWith("/admin") ? next : "/admin/queue");
      router.refresh();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="relative w-full max-w-md">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-emerald-700" />
          <CardTitle>Reviewer sign-in</CardTitle>
        </div>
        <CardDescription>
          Access the Amanah trust &amp; safety console.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-2 rounded-md border border-stone-200 bg-stone-100/70 p-3 text-sm text-stone-700">
            <Info className="mt-0.5 size-4 shrink-0 text-stone-500" />
            <div>
              <p className="font-medium text-stone-900">
                Demo credentials — shown on purpose
              </p>
              <p className="mt-1">
                Use{" "}
                <span className="font-mono font-semibold">any username</span>{" "}
                with the password{" "}
                <span className="font-mono font-semibold">demo</span>. Your
                username appears in the audit trail, so multiple visitors show
                up as distinct reviewers.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={50}
              required
              autoComplete="username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
        <CardFooter className="mt-6 flex flex-col gap-3">
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in as reviewer"}
          </Button>
          <p className="text-xs text-muted-foreground">
            Demo authentication. Any username with password{" "}
            <span className="font-mono">demo</span> works; your username appears
            in the audit trail. A production deployment would use proper
            authentication (SSO/OIDC), role-based access control, and
            per-reviewer accounts.
          </p>
          <Link
            href="/"
            className="text-xs text-muted-foreground underline underline-offset-2"
          >
            ← Back to Amanah
          </Link>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-paper p-4 text-stone-900">
      <LatticeBg />
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
