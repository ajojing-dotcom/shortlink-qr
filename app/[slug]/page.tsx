import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { after } from "next/server";
import { getLink, linkStatus, recordClick } from "@/lib/links";

export const dynamic = "force-dynamic";

// Pintu publik: /<slug> → tujuan. Tidak perlu login.
export default async function Go({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const link = await getLink(decodeURIComponent(slug)).catch((e) => {
    console.error("Gagal membaca link", e);
    return null;
  });
  if (!link || linkStatus(link) !== "aktif") notFound();

  const h = await headers();
  const ua = h.get("user-agent") ?? "";
  const referer = h.get("referer");
  const host = h.get("x-forwarded-host") || h.get("host") || undefined;
  // Catat klik setelah respons dikirim, supaya pengalihan tetap cepat.
  after(() => recordClick(link.slug, ua, referer, host).catch((e) => console.error("Gagal mencatat klik", e)));

  redirect(link.targetUrl);
}
