import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { CREATEUR_COOKIE, readCreateur } from "@/lib/auth/createur";

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
  const createur = await readCreateur(request.cookies.get(CREATEUR_COOKIE)?.value);

  if (createur && (pathname === "/" || pathname === "/connexion" || pathname === "/createurs/connexion")) {
    const dest = request.nextUrl.clone();
    dest.pathname = pathname.startsWith("/createurs") ? "/createurs" : "/accueil";
    dest.search = "";
    return NextResponse.redirect(dest);
  }

  if (estPublic(pathname)) return NextResponse.next();

  if (createur) return NextResponse.next();

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
