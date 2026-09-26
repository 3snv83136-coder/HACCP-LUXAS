import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/backoffice",
    "/backoffice/:path*",
    "/hygiene",
    "/hygiene/:path*",
    "/station-impression",
    "/station-impression/:path*",
    "/createurs",
    "/createurs/:path*",
    "/api/:path*",
  ],
};
