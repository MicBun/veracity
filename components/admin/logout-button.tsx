"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function LogoutButton({ username }: { username: string }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">
        Reviewer: <span className="font-medium text-foreground">{username}</span>
      </span>
      <Button variant="outline" size="sm" onClick={logout}>
        <LogOut className="size-4" />
        Sign out
      </Button>
    </div>
  );
}
