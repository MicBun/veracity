"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatUsd } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PRESETS = [25, 50, 100, 250];

export function DonateForm({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [amount, setAmount] = useState("50");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const value = Math.floor(Number(amount));
    if (!Number.isFinite(value) || value < 1) {
      setStatus("error");
      setMessage("Enter an amount of $1 or more.");
      return;
    }
    setStatus("submitting");
    setMessage(null);
    try {
      const res = await fetch("/api/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          campaign_id: campaignId,
          amount: value,
          donor_name: name.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Donation failed. Please try again.");
        return;
      }
      setStatus("success");
      setMessage(null);
      toast.success(
        `Thank you! Your ${formatUsd(value)} demo donation was recorded.`
      );
      setName("");
      router.refresh(); // re-fetch the server component → bar + supporters update
    } catch {
      setStatus("error");
      setMessage("Network error — please try again.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setAmount(String(p))}
            className={cn(
              "rounded-md border px-2 py-1.5 text-sm font-medium transition-colors",
              Math.floor(Number(amount)) === p
                ? "border-emerald-600 bg-emerald-50 text-emerald-800"
                : "border-stone-200 bg-stone-50 text-stone-700 hover:border-emerald-300 hover:text-emerald-800"
            )}
          >
            ${p}
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="amount">Amount (USD)</Label>
        <Input
          id="amount"
          type="number"
          min={1}
          max={100000}
          step={1}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="donor-name">Display name (optional)</Label>
        <Input
          id="donor-name"
          maxLength={60}
          placeholder="Anonymous"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={status === "submitting"} className="w-full">
        {status === "submitting" ? "Processing…" : "Donate"}
      </Button>
      {message && status === "error" && (
        <p className="text-sm text-red-600">{message}</p>
      )}
    </form>
  );
}
