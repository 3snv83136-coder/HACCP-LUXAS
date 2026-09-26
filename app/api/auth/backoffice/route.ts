import { redirigerLibre } from "@/lib/server/acces-libre";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function dest(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next");
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/backoffice";
}

export async function GET(request: Request) {
  return redirigerLibre(request, dest(request));
}

export async function POST(request: Request) {
  const form = await request.formData().catch(() => null);
  const fromForm = form ? String(form.get("next") ?? "") : "";
  const next =
    fromForm.startsWith("/") && !fromForm.startsWith("//")
      ? fromForm
      : dest(request);
  return redirigerLibre(request, next);
}
