import { NextResponse } from "next/server";
import { CREATEUR_COOKIE } from "@/lib/auth/createur";

export const dynamic = "force-dynamic";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(CREATEUR_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}

export const GET = POST;
