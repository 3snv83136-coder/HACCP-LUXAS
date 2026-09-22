import { cookies } from "next/headers";
import { CREATEUR_COOKIE, readCreateur, type CreateurPayload } from "@/lib/auth/createur";

export async function createurDepuisCookie(): Promise<CreateurPayload | null> {
  return readCreateur(cookies().get(CREATEUR_COOKIE)?.value);
}

export async function createurDepuisRequete(request: Request): Promise<CreateurPayload | null> {
  const raw = request.headers.get("cookie") ?? "";
  const part = raw
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${CREATEUR_COOKIE}=`));
  if (!part) return null;
  return readCreateur(decodeURIComponent(part.slice(CREATEUR_COOKIE.length + 1)));
}
