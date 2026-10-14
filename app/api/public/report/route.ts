import type { NextRequest } from "next/server";
import { errorResponse, json } from "@/lib/api";
import { addReport } from "@/lib/guest";
import { clientIp } from "@/lib/request";

export const dynamic = "force-dynamic";

// Laporkan link berbahaya.
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { link?: string; reason?: string; note?: string };
    await addReport(body.link ?? "", body.reason ?? "lainnya", body.note ?? "", await clientIp());
    return json({ ok: true }, 201);
  } catch (e) {
    return errorResponse(e);
  }
}
