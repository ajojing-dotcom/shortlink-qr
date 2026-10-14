import type { NextRequest } from "next/server";
import { errorResponse, json } from "@/lib/api";
import { publicModeOn } from "@/lib/guest";
import { isSlugTaken, normalizeSlug, slugProblem } from "@/lib/links";

export const dynamic = "force-dynamic";

// Cek nama link untuk tamu (minimal 4 karakter).
export async function GET(req: NextRequest) {
  if (!publicModeOn()) return json({ error: "Ditutup." }, 403);
  try {
    const slug = normalizeSlug(req.nextUrl.searchParams.get("s") ?? "");
    const problem = slugProblem(slug) ?? (slug.length < 4 ? "Nama link tamu minimal 4 karakter." : null);
    if (problem) return json({ slug, available: false, message: problem });
    const taken = await isSlugTaken(slug);
    return json({ slug, available: !taken, message: taken ? "Nama ini udah dipakai." : "Mantep, namanya masih kosong" });
  } catch (e) {
    return errorResponse(e);
  }
}
