export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatCost(costUsd: number): string {
  if (costUsd === 0) return "$0";
  if (costUsd < 0.01) return `$${costUsd.toFixed(4)}`;
  return `$${costUsd.toFixed(2)}`;
}

export function formatDate(d: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(typeof d === "string" ? new Date(d) : d);
}

export function formatPercent(p: number): string {
  return `${Math.round(p * 100)}%`;
}

export const FLAG_LABELS: Record<string, string> = {
  urgency_manipulation: "Urgency manipulation",
  story_inconsistency: "Story inconsistency",
  identity_mismatch: "Identity mismatch",
  unverifiable_claims: "Unverifiable claims",
  zakat_eligibility_doubt: "Zakat eligibility doubt",
  duplicate_pattern: "Duplicate pattern",
  financial_anomaly: "Financial anomaly",
};

export const CATEGORY_LABELS: Record<string, string> = {
  medical: "Medical",
  education: "Education",
  community: "Community",
  "emergency-relief": "Emergency relief",
  livelihood: "Livelihood",
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  escalated: "Escalated",
};

// Past-tense labels for a recorded reviewer action (reviews.action stores the
// imperative verb: approve | reject | escalate).
export const ACTION_LABELS: Record<string, string> = {
  approve: "Approved",
  reject: "Rejected",
  escalate: "Escalated",
};
