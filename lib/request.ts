import { headers } from "next/headers";

/** Host & origin dari permintaan saat ini (benar di vercel.app maupun domain sendiri). */
export async function requestOrigin(): Promise<{ host: string; origin: string }> {
  const h = await headers();
  const host = (h.get("x-forwarded-host") || h.get("host") || "localhost:3000").split(",")[0].trim();
  const proto =
    (h.get("x-forwarded-proto") || "").split(",")[0].trim() ||
    (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
  return { host, origin: `${proto}://${host}` };
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return (h.get("x-forwarded-for") || h.get("x-real-ip") || "lokal").split(",")[0].trim();
}

/** Ubah "https://klikaje.my.id" → "klikaje.my.id" untuk tampilan. */
export function displayHost(origin: string): string {
  return origin.replace(/^https?:\/\//, "");
}
