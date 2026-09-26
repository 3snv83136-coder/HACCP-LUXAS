import { redirigerLibre } from "@/lib/server/acces-libre";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  return redirigerLibre(request, "/terrain");
}
