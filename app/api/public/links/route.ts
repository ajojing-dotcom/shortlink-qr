import type { NextRequest } from "next/server";
import { errorResponse, json } from "@/lib/api";
import { createGuestLink, publicModeOn, publicView } from "@/lib/guest";
import { clientIp, requestOrigin } from "@/lib/request";

export const dynamic = "force-dynamic";

// Bikin shortlink tanpa login (mode tamu).
export async function POST(req: NextRequest) {
  if (!publicModeOn()) return json({ error: "Pembuatan link tanpa login sedang ditutup." }, 403);
  try {
    const body = (await req.json()) as { url?: string; slug?: string };
    const [{ host }, ip] = await Promise.all([requestOrigin(), clientIp()]);
    const { link, key } = await createGuestLink({ url: body.url ?? "", slug: body.slug }, ip, [host]);
    return json({ link: publicView(link), key }, 201);
  } catch (e) {
    return errorResponse(e);
  }
}
