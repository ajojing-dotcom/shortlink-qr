import type { NextRequest } from "next/server";
import { errorResponse, guard, json } from "@/lib/api";
import { dismissReport } from "@/lib/guest";

export const dynamic = "force-dynamic";

// Tutup laporan (setelah ditinjau).
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await guard();
  if (denied) return denied;
  try {
    await dismissReport((await params).id);
    return json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
