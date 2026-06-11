import { NextRequest } from "next/server";
import { getSession } from "@/lib/session-cookies";
import { checkRateLimit } from "@/lib/rate-limit";
import { runEvals } from "@/lib/evals";

// Vercel Hobby caps serverless functions at 60s; a 30-case run at concurrency
// 5 finishes in ~45s from Vercel's network. If a run does exceed the cap, the
// route fails gracefully (the previous cached results stay; the dashboard
// shows an error) — exactly the degradation the design calls for. The cached
// results themselves come from a CLI run (npm run evals) so the dashboard
// always has complete metrics regardless of the live button.
export const maxDuration = 60;

const encoder = new TextEncoder();

/**
 * Admin-only live eval run, streamed as NDJSON progress events. Protected by
 * the session middleware + in-handler check, plus a global cap of 2 runs/hour
 * as an abuse backstop (each run costs real API money).
 */
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json(
      { error: "Unauthorized. Reviewer sign-in required." },
      { status: 401 }
    );
  }

  const rate = await checkRateLimit("evals:global", 2, 3600);
  if (!rate.allowed) {
    return Response.json(
      { error: "Eval cap reached: 2 runs per hour across all reviewers. Try again later." },
      { status: 429 }
    );
  }

  // Keep the linter happy about the unused request param without disabling types.
  void request;

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: Record<string, unknown>) =>
        controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));

      (async () => {
        try {
          send({ type: "started" });
          await runEvals((done, total) => {
            send({ type: "progress", done, total });
          });
          send({ type: "complete" });
        } catch (err) {
          console.error("eval run failed", err);
          send({
            type: "error",
            message:
              "Eval run failed. Cached results from the last successful run are still shown.",
          });
        } finally {
          controller.close();
        }
      })();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
