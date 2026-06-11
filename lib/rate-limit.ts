import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Fixed-window rate limiter backed by Postgres (works across serverless
 * instances). One atomic upsert per check.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  const result = await db.execute(sql`
    INSERT INTO rate_limits (key, window_start, count)
    VALUES (${key}, now(), 1)
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSeconds})
        THEN 1
        ELSE rate_limits.count + 1
      END,
      window_start = CASE
        WHEN rate_limits.window_start < now() - make_interval(secs => ${windowSeconds})
        THEN now()
        ELSE rate_limits.window_start
      END
    RETURNING count
  `);

  const rows = result.rows as Array<{ count: number }>;
  const count = Number(rows[0]?.count ?? limit + 1);
  return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
}

export function clientIpFrom(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "unknown";
}
