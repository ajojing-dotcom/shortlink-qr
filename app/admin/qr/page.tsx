import type { Metadata } from "next";
import QrStudio from "@/components/QrStudio";
import { listLinks, linkStatus } from "@/lib/links";
import { requestOrigin } from "@/lib/request";

export const metadata: Metadata = { title: "QR Generator" };
export const dynamic = "force-dynamic";

export default async function QrPage({ searchParams }: { searchParams: Promise<{ d?: string }> }) {
  const [{ d }, { origin }, links] = await Promise.all([searchParams, requestOrigin(), listLinks()]);
  const host = origin.replace(/^https?:\/\//, "");
  const options = links
    .filter((l) => linkStatus(l) === "aktif")
    .map((l) => ({ label: `${l.title || l.slug} — ${host}/${l.slug}`, url: `${origin}/${l.slug}` }));
  return <QrStudio initialData={d ?? options[0]?.url ?? `${origin}/`} links={options} />;
}
