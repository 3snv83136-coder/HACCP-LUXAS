import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { readSession, SESSION_COOKIE } from "@/lib/auth/session";

const BACKOFFICE_ROLES = new Set(["responsable", "gerant"]);

function isProtectedPage(pathname: string) {
  if (pathname === "/backoffice/login") return false;
  if (pathname.startsWith("/acces/")) return false;
  return (
    pathname === "/backoffice" ||
    pathname.startsWith("/backoffice/") ||
    pathname === "/hygiene" ||
    pathname.startsWith("/hygiene/") ||
    pathname === "/station-impression" ||
    pathname.startsWith("/station-impression/")
  );
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
    pathname.startsWith("/api/ressources") ||
    pathname.startsWith("/api/etiquettes") ||
    pathname.startsWith("/api/impressions") ||
    pathname.startsWith("/api/alerts")
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (!isProtectedPage(pathname) && !isProtectedApi(pathname)) {
    return NextResponse.next();
  }

  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  const apiTerrain =
    pathname.startsWith("/api/etiquettes") || pathname.startsWith("/api/impressions");
  const ok = session && (BACKOFFICE_ROLES.has(session.role) || (apiTerrain && session.role));

  if (ok) return NextResponse.next();

  if (isProtectedApi(pathname)) {
    return NextResponse.json({ error: "Connexion administrateur requise" }, { status: 401 });
  }

  const loginPath = pathname.startsWith("/hygiene") ? "/acces/hygiene" : "/acces/administrateur";
  const login = new URL(loginPath, request.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: [
    "/backoffice",
    "/backoffice/:path*",
    "/hygiene",
    "/hygiene/:path*",
    "/station-impression",
    "/station-impression/:path*",
    "/api/:path*",
  ],
};
