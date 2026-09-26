import { cookies } from "next/headers";
import { CREATEUR_COOKIE, readCreateur, type CreateurPayload } from "@/lib/auth/createur";
import { createurLibre } from "@/lib/server/acces-libre";

export async function createurDepuisCookie(): Promise<CreateurPayload | null> {
  return (await readCreateur(cookies().get(CREATEUR_COOKIE)?.value)) ?? createurLibre();
}

export async function createurDepuisRequete(request: Request): Promise<CreateurPayload | null> {
  const raw = request.headers.get("cookie") ?? "";
  const part = raw
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${CREATEUR_COOKIE}=`));
  if (part) {
    const createur = await readCreateur(decodeURIComponent(part.slice(CREATEUR_COOKIE.length + 1)));
    if (createur) return createur;
  }
  return createurLibre();
}
