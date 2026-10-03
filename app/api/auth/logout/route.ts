import { NextResponse } from "next/server";
import { CREATEUR_COOKIE } from "@/lib/auth/createur";
import { SESSION_COOKIE } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

function viderCookies(res: NextResponse) {
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  res.cookies.set(CREATEUR_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}

export async function POST(request: Request) {
  const accept = request.headers.get("accept") ?? "";
  const res = accept.includes("application/json")
    ? NextResponse.json({ ok: true })
    : NextResponse.redirect(new URL("/", request.url), 303);
  return viderCookies(res);
}

export const GET = POST;
