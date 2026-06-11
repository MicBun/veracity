import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, aiAssessments, reviews } from "@/db/schema";
import { getSession } from "@/lib/session-cookies";
import { bundleAssessments, snapshotOf } from "@/lib/assessments";

const actionSchema = z.object({
  action: z.enum(["approve", "reject", "escalate"]),
  note: z.string().trim().max(1000).optional(),
});

const STATUS_FOR_ACTION = {
  approve: "approved",
  reject: "rejected",
  escalate: "escalated",
} as const;

/**
 * The ONLY code path that changes a campaign's status. Guarded by the session
 * middleware and re-checked here. The AI pipeline has no write access to
 * campaigns.status anywhere in the codebase — it only inserts assessments.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized. Reviewer sign-in required." },
      { status: 401 }
    );
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "action must be approve | reject | escalate; note ≤ 1000 chars" },
      { status: 400 }
    );
  }

  const [campaign] = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, id))
    .limit(1);
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }
  if (campaign.status !== "pending") {
    return NextResponse.json(
      { error: `Campaign already ${campaign.status}; decisions are final in this demo.` },
      { status: 409 }
    );
  }

  const assessmentRows = await db
    .select()
    .from(aiAssessments)
    .where(eq(aiAssessments.campaignId, id));
  const snapshot = snapshotOf(bundleAssessments(assessmentRows));

  const newStatus = STATUS_FOR_ACTION[parsed.data.action];

  // The conditional UPDATE is the real concurrency gate: the status='pending'
  // predicate means only ONE of two racing requests flips the row (the other
  // updates 0 rows). The earlier select is just for a friendly 409; the DB is
  // the source of truth. Only write the immutable audit row if we won the race.
  const updated = await db
    .update(campaigns)
    .set({ status: newStatus })
    .where(and(eq(campaigns.id, id), eq(campaigns.status, "pending")))
    .returning({ id: campaigns.id });

  if (updated.length !== 1) {
    return NextResponse.json(
      { error: "Campaign was already decided by another reviewer." },
      { status: 409 }
    );
  }

  await db.insert(reviews).values({
    campaignId: id,
    reviewerName: session.username,
    action: parsed.data.action,
    aiRecommendationSnapshot: snapshot,
    note: parsed.data.note || null,
  });

  return NextResponse.json({ ok: true, status: newStatus });
}
