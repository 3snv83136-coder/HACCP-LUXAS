import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function dest(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next");
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return `/connexion?next=${encodeURIComponent(next)}`;
  }
  return "/connexion";
}

export async function GET(request: Request) {
  return NextResponse.redirect(new URL(dest(request), request.url));
}

export async function POST(request: Request) {
  return NextResponse.redirect(new URL(dest(request), request.url));
}
