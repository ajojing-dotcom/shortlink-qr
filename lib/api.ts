import { NextResponse } from "next/server";
import { isLoggedIn } from "./auth";
import { LinkError, linkStatus, type Link } from "./links";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: { "cache-control": "no-store" } });
}

/** Cek ulang sesi di dalam route (lapis kedua setelah middleware). */
export async function guard(): Promise<NextResponse | null> {
  return (await isLoggedIn()) ? null : json({ error: "Belum masuk. Silakan login dulu." }, 401);
}

export function errorResponse(e: unknown) {
  if (e instanceof LinkError) return json({ error: e.message, field: e.field }, 400);
  console.error(e);
  return json({ error: "Ada yang error di server. Coba lagi sebentar." }, 500);
}

export type LinkDTO = Link & { status: ReturnType<typeof linkStatus> };

export function dto(l: Link): LinkDTO {
  return { ...l, status: linkStatus(l) };
}
