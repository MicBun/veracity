import { NextRequest } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { campaigns } from "@/db/schema";
import { assessCampaign } from "@/lib/ai/pipeline";
import { persistPipelineResult } from "@/lib/ai/persist";
import { checkRateLimit, clientIpFrom } from "@/lib/rate-limit";

// Two sequential Haiku calls can take ~10-15s; give the function headroom.
export const maxDuration = 60;

const submitSchema = z.object({
  title: z.string().trim().min(5).max(120),
  description: z.string().trim().min(50).max(3000), // 3,000-char abuse cap
  goal_amount: z.number().int().min(100).max(1_000_000),
  category: z.enum(["medical", "education", "community", "emergency-relief", "livelihood"]),
  organizer_name: z.string().trim().min(2).max(80),
  organizer_history: z.object({
    prior_campaigns: z.number().int().min(0).max(50),
    account_age_days: z.number().int().min(0).max(10000),
    prior_flags: z.number().int().min(0).max(20),
  }),
  zakat_claimed: z.boolean(),
});

const encoder = new TextEncoder();

/**
 * Public ingestion endpoint. Creates the campaign, then streams pipeline
 * progress as NDJSON. Progress events carry STAGE NAMES ONLY — risk scores,
 * flags, and recommendations are never sent to the public client; they are
 * persisted server-side and served only to authenticated reviewer routes.
 */
export async function POST(request: NextRequest) {
  const ip = clientIpFrom(request.headers);
  const rate = await checkRateLimit(`submit:${ip}`, 10, 3600);
  if (!rate.allowed) {
    return Response.json(
      { error: "Rate limit reached: 10 submissions per hour per IP. Try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return Response.json(
      { error: `${issue?.path.join(".")}: ${issue?.message}` },
      { status: 400 }
    );
  }
  const input = parsed.data;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));

      (async () => {
        const [row] = await db
          .insert(campaigns)
          .values({
            title: input.title,
            description: input.description,
            goalAmount: input.goal_amount,
            category: input.category,
            organizerName: input.organizer_name,
            organizerHistory: input.organizer_history,
            zakatClaimed: input.zakat_claimed,
            status: "pending",
            source: "user_submitted",
          })
          .returning({ id: campaigns.id });

        send({ type: "created", id: row.id });

        try {
          const result = await assessCampaign(input, (e) =>
            send({ type: "stage", stage: e.stage, status: e.status })
          );
          await persistPipelineResult(row.id, result);
          send({ type: "done", id: row.id });
        } catch (err) {
          console.error("pipeline failed for", row.id, err);
          // The campaign still exists and is pending; reviewers see it
          // without an assessment rather than the submitter losing the post.
          send({
            type: "done",
            id: row.id,
            warning: "Automated checks could not complete; the campaign will be reviewed manually.",
          });
        } finally {
          controller.close();
        }
      })().catch((err) => {
        console.error("submit stream failed", err);
        send({ type: "error", message: "Submission failed. Please try again." });
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
