import { NextRequest } from "next/server";
import { z } from "zod";
import { eq, sum, count } from "drizzle-orm";
import { db } from "@/db";
import { campaigns, donations } from "@/db/schema";
import { checkRateLimit, clientIpFrom } from "@/lib/rate-limit";

const donateSchema = z.object({
  campaign_id: z.string().uuid(),
  amount: z.number().int().min(1).max(100_000),
  donor_name: z.string().trim().max(60).optional(),
});

/**
 * Public mock-donation endpoint. Writes ONLY to the donations table — it never
 * touches campaigns.status (still owned solely by the reviewer action route)
 * and never returns or reads assessment data. Re-checks status='approved'
 * server-side so a guessed id for a pending/rejected campaign is rejected.
 */
export async function POST(request: NextRequest) {
  const ip = clientIpFrom(request.headers);
  const rate = await checkRateLimit(`donate:${ip}`, 30, 3600);
  if (!rate.allowed) {
    return Response.json(
      { error: "Rate limit reached: 30 donations per hour per IP. Try again later." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request body" }, { status: 400 });
  }
  const parsed = donateSchema.safeParse(body);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return Response.json(
      { error: `${issue?.path.join(".")}: ${issue?.message}` },
      { status: 400 }
    );
  }
  const { campaign_id, amount, donor_name } = parsed.data;

  const [campaign] = await db
    .select({ id: campaigns.id, status: campaigns.status })
    .from(campaigns)
    .where(eq(campaigns.id, campaign_id))
    .limit(1);
  if (!campaign) {
    return Response.json({ error: "Campaign not found" }, { status: 404 });
  }
  if (campaign.status !== "approved") {
    return Response.json(
      { error: "This campaign is not accepting donations." },
      { status: 409 }
    );
  }

  await db.insert(donations).values({
    campaignId: campaign_id,
    amount,
    donorName: donor_name && donor_name.length > 0 ? donor_name : null,
    source: "user",
  });

  const [agg] = await db
    .select({ raised: sum(donations.amount), donorCount: count(donations.id) })
    .from(donations)
    .where(eq(donations.campaignId, campaign_id));

  return Response.json({
    ok: true,
    raised: Number(agg?.raised ?? 0),
    donorCount: Number(agg?.donorCount ?? 0),
  });
}
