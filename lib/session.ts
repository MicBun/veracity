import { SignJWT, jwtVerify } from "jose";

// Demo authentication. Any username + the fixed password "demo" yields a
// signed session; the username is only used for audit-log attribution.
// A production deployment would use SSO/OIDC with per-reviewer accounts.
//
// This module is edge-safe: it imports ONLY jose (no next/headers), so it can
// be pulled into middleware. The cookies()-based getSession lives in
// session-cookies.ts to keep this import graph clean for the edge runtime.

export const SESSION_COOKIE = "veracity_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24; // 24h

function secretKey(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export async function createSessionToken(username: string): Promise<string> {
  return new SignJWT({ username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function verifySessionToken(
  token: string | undefined
): Promise<{ username: string } | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      algorithms: ["HS256"],
    });
    if (typeof payload.username !== "string" || !payload.username) return null;
    return { username: payload.username };
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_TTL_SECONDS,
};
