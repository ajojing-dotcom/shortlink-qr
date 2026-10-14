import type { NextRequest } from "next/server";
import { errorResponse, guard, json } from "@/lib/api";
import { isSlugTaken, normalizeSlug, slugProblem } from "@/lib/links";

export const dynamic = "force-dynamic";

// Cek apakah nama link masih kosong: GET /api/admin/slug?s=nama
export async function GET(req: NextRequest) {
  const denied = await guard();
  if (denied) return denied;
  try {
    const slug = normalizeSlug(req.nextUrl.searchParams.get("s") ?? "");
    const problem = slugProblem(slug);
    if (problem) return json({ slug, available: false, message: problem });
    const taken = await isSlugTaken(slug);
    return json({ slug, available: !taken, message: taken ? "Nama ini udah dipakai." : "Mantep, namanya masih kosong" });
  } catch (e) {
    return errorResponse(e);
  }
}
