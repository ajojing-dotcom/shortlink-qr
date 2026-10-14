import type { NextRequest } from "next/server";
import { errorResponse, json } from "@/lib/api";
import { deleteGuestLinkWithKey, getGuestLinkWithKey, publicView } from "@/lib/guest";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ slug: string }> };

// Lihat jumlah klik link tamu: GET /api/public/links/<slug>?kunci=...
export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const { slug } = await params;
    const link = await getGuestLinkWithKey(slug, req.nextUrl.searchParams.get("kunci") ?? "");
    if (!link) return json({ error: "Link kagak ketemu atau kunci kelolanya salah." }, 404);
    return json({ link: publicView(link) });
  } catch (e) {
    return errorResponse(e);
  }
}

// Hapus link tamu dengan kunci kelola.
export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const { slug } = await params;
    const ok = await deleteGuestLinkWithKey(slug, req.nextUrl.searchParams.get("kunci") ?? "");
    return ok ? json({ ok: true }) : json({ error: "Link kagak ketemu atau kunci kelolanya salah." }, 404);
  } catch (e) {
    return errorResponse(e);
  }
}
