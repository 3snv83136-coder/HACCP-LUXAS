import { cookies } from "next/headers";
import { readSession, SESSION_COOKIE, type SessionPayload } from "@/lib/auth/session";

export async function sessionDepuisCookie(): Promise<SessionPayload | null> {
  return readSession(cookies().get(SESSION_COOKIE)?.value);
}

export async function sessionDepuisRequete(request: Request): Promise<SessionPayload | null> {
  const raw = request.headers.get("cookie") ?? "";
  const part = raw.split(";").map((s) => s.trim()).find((s) => s.startsWith(`${SESSION_COOKIE}=`));
  if (!part) return null;
  return readSession(decodeURIComponent(part.slice(SESSION_COOKIE.length + 1)));
}
