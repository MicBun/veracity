import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "./session";

/**
 * Server-side session lookup for route handlers and server components.
 * Lives apart from session.ts because it imports next/headers, which is not
 * available in the edge middleware runtime.
 */
export async function getSession(): Promise<{ username: string } | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}
