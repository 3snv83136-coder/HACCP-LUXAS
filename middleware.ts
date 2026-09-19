import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readSession, SESSION_COOKIE } from "@/lib/auth/session";

const BACKOFFICE_ROLES = new Set(["responsable", "gerant"]);

function isProtectedPage(pathname: string) {
  if (pathname === "/backoffice/login") return false;
  return pathname === "/backoffice" || pathname.startsWith("/backoffice/");
}

function isProtectedApi(pathname: string) {
  return (
    pathname.startsWith("/api/dashboard") ||
    pathname.startsWith("/api/parametres") ||
    pathname.startsWith("/api/hygiene") ||
    pathname.startsWith("/api/export-pdf") ||
    pathname.startsWith("/api/documents") ||
    pathname.startsWith("/api/non-conformites") ||
    pathname.startsWith("/api/equipements") ||
    pathname.startsWith("/api/personnel") ||
    pathname.startsWith("/api/produits") ||
    pathname.startsWith("/api/alerts")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isProtectedPage(pathname) && !isProtectedApi(pathname)) {
    return NextResponse.next();
  }

  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  const ok = session && BACKOFFICE_ROLES.has(session.role);

  if (ok) return NextResponse.next();

  if (isProtectedApi(pathname)) {
    return NextResponse.json({ error: "Connexion back-office requise" }, { status: 401 });
  }

  const login = new URL("/backoffice/login", request.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/backoffice", "/backoffice/:path*", "/api/:path*"],
};
