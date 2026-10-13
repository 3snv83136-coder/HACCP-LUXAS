import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CREATEUR_COOKIE, readCreateur } from "@/lib/auth/createur";
import { SESSION_COOKIE, readSession } from "@/lib/auth/session";

function estPublic(pathname: string) {
  if (pathname === "/" || pathname === "/connexion" || pathname === "/creer-compte") return true;
  if (pathname === "/createurs/connexion") return true;
  if (pathname.startsWith("/api/auth/connexion")) return true;
  if (pathname.startsWith("/api/auth/inscription")) return true;
  if (pathname.startsWith("/api/auth/definir-mot-de-passe")) return true;
  if (pathname.startsWith("/api/createurs/connexion")) return true;
  if (pathname.startsWith("/api/createurs/statut")) return true;
  if (pathname.startsWith("/api/auth/logout")) return true;
  return false;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await readSession(request.cookies.get(SESSION_COOKIE)?.value);
  const createur = await readCreateur(request.cookies.get(CREATEUR_COOKIE)?.value);

  if (session && (pathname === "/" || pathname === "/connexion" || pathname === "/creer-compte")) {
    const dest = request.nextUrl.clone();
    dest.pathname = "/accueil";
    dest.search = "";
    return NextResponse.redirect(dest);
  }

  if (createur && pathname === "/createurs/connexion") {
    const dest = request.nextUrl.clone();
    dest.pathname = "/createurs";
    dest.search = "";
    return NextResponse.redirect(dest);
  }

  if (estPublic(pathname)) return NextResponse.next();

  const qg =
    (pathname.startsWith("/createurs") && pathname !== "/createurs/connexion") ||
    (pathname.startsWith("/api/createurs") &&
      !pathname.startsWith("/api/createurs/connexion") &&
      !pathname.startsWith("/api/createurs/statut"));
  if (qg && !createur) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }
    const login = request.nextUrl.clone();
    login.pathname = "/createurs/connexion";
    login.search = "";
    return NextResponse.redirect(login);
  }

  if (session || createur) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Non connecté" }, { status: 401 });
  }

  const login = request.nextUrl.clone();
  login.pathname = "/";
  login.search = "";
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)"],
};
