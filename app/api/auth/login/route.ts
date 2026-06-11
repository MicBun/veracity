import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSessionToken, SESSION_COOKIE, sessionCookieOptions } from "@/lib/session";

const loginSchema = z.object({
  username: z.string().trim().min(1).max(50),
  password: z.string(),
});

const DEMO_PASSWORD = "demo";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Username (1-50 chars) and password are required" },
      { status: 400 }
    );
  }

  if (parsed.data.password !== DEMO_PASSWORD) {
    return NextResponse.json(
      { error: "Incorrect password. The demo password is shown on the form." },
      { status: 401 }
    );
  }

  const token = await createSessionToken(parsed.data.username);
  const response = NextResponse.json({ ok: true, username: parsed.data.username });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
  return response;
}
