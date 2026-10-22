import { cookies } from "next/headers";
import { BACKOFFICE_PIN_COOKIE, readBackofficePin } from "@/lib/auth/backoffice";

export async function backofficePinDepuisRequete(request: Request) {
  const raw = request.headers.get("cookie") ?? "";
  const part = raw
    .split(";")
    .map((s) => s.trim())
    .find((s) => s.startsWith(`${BACKOFFICE_PIN_COOKIE}=`));
  if (!part) return null;
  return readBackofficePin(decodeURIComponent(part.slice(BACKOFFICE_PIN_COOKIE.length + 1)));
}

export async function backofficePinDepuisCookie() {
  return readBackofficePin(cookies().get(BACKOFFICE_PIN_COOKIE)?.value);
}
